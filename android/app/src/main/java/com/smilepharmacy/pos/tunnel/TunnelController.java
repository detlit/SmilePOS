package com.smilepharmacy.pos.tunnel;

import android.content.Context;
import android.content.SharedPreferences;
import android.webkit.WebView;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

/**
 * ศูนย์กลางของฟีเจอร์ tunnel — ถือสถานะจริงไว้ที่เดียว
 *
 * ทำไมต้องเป็น singleton แยกจากปลั๊กอินและ service
 * ------------------------------------------------------------------
 * มีคนอยากรู้/สั่งงานสามฝ่ายที่คนละวงจรชีวิตกันโดยสิ้นเชิง
 *   - TunnelPlugin  เกิด-ตายตาม WebView (ผู้ใช้กดปุ่มในหน้าตั้งค่า)
 *   - TunnelService เกิด-ตายตาม foreground service (ต้องอยู่ต่อแม้ปิดหน้าจอ)
 *   - เธรดของ HTTP server และตัวเฝ้า cloudflared
 * ถ้าให้สถานะไปอยู่กับตัวใดตัวหนึ่ง พอตัวนั้นถูกทำลาย สถานะจะหายทั้งที่ tunnel ยังทำงานอยู่
 *
 * ค่าที่ต้องจำข้ามการเปิดแอป (โหมด, token, พอร์ต) เก็บใน SharedPreferences ของแอป
 * ซึ่งเป็นพื้นที่ส่วนตัวที่แอปอื่นอ่านไม่ได้ — ระดับเดียวกับที่ฝั่งพีซีเก็บ tunnel.token
 * ไว้ใน C:\SmileStorePOS\config
 */
public final class TunnelController {

    private static final String PREFS = "smilepos.tunnel";
    private static final String KEY_MODE = "mode";
    private static final String KEY_TOKEN = "token";
    private static final String KEY_PORT = "port";
    private static final String KEY_ENABLED = "enabled";
    private static final String KEY_EXPOSE_LAN = "exposeLan";
    private static final String KEY_LAST_PID = "lastPid";

    static final int DEFAULT_PORT = 8787;

    /** service ใช้ค่านี้อัปเดตข้อความบนแถบแจ้งเตือน */
    public interface StatusListener {
        void onTunnelStatusChanged();
    }

    private static volatile TunnelController instance;

    private final Context context;
    private final SharedPreferences prefs;
    private final LogBuffer log = new LogBuffer();
    private final WebViewApiBridge bridge = new WebViewApiBridge();
    private final LocalHttpServer server;
    private final CloudflaredProcess cloudflared;

    private StatusListener listener;
    private volatile String lastError = "";

    private TunnelController(Context context) {
        this.context = context.getApplicationContext();
        this.prefs = this.context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        this.server = new LocalHttpServer(this.context, bridge, log);
        this.cloudflared = new CloudflaredProcess(this.context, log,
            pid -> prefs.edit().putInt(KEY_LAST_PID, pid).apply());

        // แอปเพิ่งเริ่มใหม่ — เก็บกวาด cloudflared ที่อาจค้างจากโปรเซสรอบก่อนก่อนทำอะไรต่อ
        CloudflaredProcess.killOrphan(prefs.getInt(KEY_LAST_PID, -1), log);
        prefs.edit().remove(KEY_LAST_PID).apply();
    }

    public static TunnelController get(Context context) {
        if (instance == null) {
            synchronized (TunnelController.class) {
                if (instance == null) instance = new TunnelController(context);
            }
        }
        return instance;
    }

    // ------------------------------------------------------------------ สะพานกับ WebView

    void attachWebView(WebView view) {
        bridge.attach(view);
    }

    void detachWebView() {
        bridge.detach();
    }

    void setHandlerReady(boolean ready) {
        bridge.setHandlerReady(ready);
        if (ready) log.note("หน้าเว็บในแอปพร้อมรับคำขอจากภายนอกแล้ว");
        notifyListener();
    }

    void deliverApiResponse(String id, WebViewApiBridge.ApiResponse response) {
        bridge.deliver(id, response);
    }

    public void setStatusListener(StatusListener listener) {
        this.listener = listener;
    }

    private void notifyListener() {
        StatusListener current = listener;
        if (current != null) current.onTunnelStatusChanged();
    }

    // ------------------------------------------------------------------ เปิด/ปิด

    /**
     * เปิดใช้งาน tunnel — เปิด HTTP server ในเครื่องก่อน แล้วค่อยปล่อย cloudflared ออกไปหา edge
     *
     * ลำดับสำคัญ: ถ้าปล่อย cloudflared ก่อนที่พอร์ตจะพร้อม มันจะรายงาน 502 ให้ผู้เข้าชม
     * อยู่หลายวินาทีแรก และ log จะเต็มไปด้วย connection refused ที่ทำให้ไล่ปัญหาจริงยาก
     */
    public synchronized void start(CloudflaredProcess.Mode mode, String token) throws IOException {
        lastError = "";

        int port = getPort();
        boolean exposeLan = prefs.getBoolean(KEY_EXPOSE_LAN, false);

        if (!server.isRunning()) {
            server.start(port, exposeLan);
        }

        String effectiveToken = mode == CloudflaredProcess.Mode.TOKEN
            ? (token == null || token.trim().isEmpty() ? getSavedToken() : token.trim())
            : "";

        try {
            cloudflared.start(mode, effectiveToken, server.getPort());
        } catch (IOException ex) {
            lastError = ex.getMessage() == null ? "เปิด tunnel ไม่สำเร็จ" : ex.getMessage();
            // HTTP server ยังเปิดค้างไว้ตั้งใจ — เครื่องในวง LAN (ถ้าเปิดไว้) ยังใช้ได้
            // และการกดลองใหม่จะไม่ต้องรอเปิดพอร์ตอีกรอบ
            notifyListener();
            throw ex;
        }

        SharedPreferences.Editor editor = prefs.edit();
        editor.putString(KEY_MODE, mode == CloudflaredProcess.Mode.TOKEN ? "token" : "quick");
        editor.putBoolean(KEY_ENABLED, true);
        if (mode == CloudflaredProcess.Mode.TOKEN && !effectiveToken.isEmpty()) {
            editor.putString(KEY_TOKEN, effectiveToken);
        }
        editor.apply();

        notifyListener();
    }

    public synchronized void stop() {
        cloudflared.stop();
        server.stop();
        prefs.edit().putBoolean(KEY_ENABLED, false).apply();
        notifyListener();
    }

    /** ลืม token ที่บันทึกไว้ — ใช้ตอนเปลี่ยน tunnel หรือขายเครื่องต่อ */
    public synchronized void forgetToken() {
        prefs.edit().remove(KEY_TOKEN).apply();
        notifyListener();
    }

    /**
     * เปิดต่อจากที่ค้างไว้ตอนแอปถูกเปิดใหม่
     *
     * เจ้าของร้านตั้งค่าครั้งเดียวแล้วคาดหวังว่าลิงก์จะใช้ได้ตลอด การบังคับให้เข้ามากด
     * "เชื่อมต่อ" ใหม่ทุกครั้งที่แท็บเล็ตรีสตาร์ทคือจุดที่ระบบจะถูกเลิกใช้ในสัปดาห์แรก
     * (ฝั่งพีซีแก้ปัญหาเดียวกันนี้ไว้ที่ src/app/api/system/tunnel/route.ts)
     */
    public synchronized void resumeIfEnabled() {
        if (!prefs.getBoolean(KEY_ENABLED, false)) return;
        if (cloudflared.isWanted()) return;
        if (!cloudflared.isInstalled()) return;

        CloudflaredProcess.Mode mode = savedMode();
        if (mode == CloudflaredProcess.Mode.TOKEN && getSavedToken().isEmpty()) return;

        try {
            log.note("เปิด tunnel ต่อจากการตั้งค่าเดิมอัตโนมัติ");
            start(mode, getSavedToken());
        } catch (IOException ex) {
            lastError = "เปิด tunnel อัตโนมัติไม่สำเร็จ: " + ex.getMessage();
            log.note(lastError);
        }
    }

    // ------------------------------------------------------------------ ค่าที่บันทึกไว้

    public boolean isEnabled() {
        return prefs.getBoolean(KEY_ENABLED, false);
    }

    CloudflaredProcess.Mode savedMode() {
        return "token".equals(prefs.getString(KEY_MODE, "quick"))
            ? CloudflaredProcess.Mode.TOKEN
            : CloudflaredProcess.Mode.QUICK;
    }

    String getSavedToken() {
        return prefs.getString(KEY_TOKEN, "");
    }

    int getPort() {
        return prefs.getInt(KEY_PORT, DEFAULT_PORT);
    }

    void setPort(int port) {
        prefs.edit().putInt(KEY_PORT, port).apply();
    }

    void setExposeLan(boolean expose) {
        prefs.edit().putBoolean(KEY_EXPOSE_LAN, expose).apply();
    }

    boolean isExposeLan() {
        return prefs.getBoolean(KEY_EXPOSE_LAN, false);
    }

    // ------------------------------------------------------------------ รายงานสถานะ

    public String getHostname() {
        return cloudflared.getHostname();
    }

    public boolean isRunning() {
        return cloudflared.isRunning() && server.isRunning();
    }

    /** ข้อความสั้น ๆ สำหรับแถบแจ้งเตือน */
    public String describeForNotification() {
        if (!isRunning()) return "กำลังเตรียมการเชื่อมต่อ…";

        String host = cloudflared.getHostname();
        if (host.isEmpty()) return "กำลังขอที่อยู่จาก Cloudflare…";
        return host;
    }

    /**
     * รูปแบบเดียวกับที่ tunnel-manage.ps1 คืนให้ฝั่งพีซี บวกฟิลด์ที่มีเฉพาะบนแท็บเล็ต
     * หน้าตั้งค่าจึงใช้โค้ดอ่านสถานะชุดเดิมได้โดยไม่ต้องแยกสองทาง
     */
    public JSONObject statusJson() {
        JSONObject json = new JSONObject();
        try {
            boolean installed = cloudflared.isInstalled();
            boolean running = isRunning();

            json.put("available", installed);
            json.put("installed", installed && (isEnabled() || running));
            json.put("running", running);
            json.put("status", running ? "running" : installed ? "stopped" : "not-installed");
            json.put("hostname", cloudflared.getHostname());
            json.put("hasToken", !getSavedToken().isEmpty());

            // ฟิลด์เฉพาะแท็บเล็ต
            json.put("mode", "android");
            json.put("tunnelMode", savedMode() == CloudflaredProcess.Mode.TOKEN ? "token" : "quick");
            json.put("port", server.isRunning() ? server.getPort() : getPort());
            json.put("serverRunning", server.isRunning());
            json.put("serverReady", bridge.isReady());
            json.put("exposeLan", isExposeLan());
            json.put("binary", cloudflared.binaryFile().getAbsolutePath());

            String host = cloudflared.getHostname();
            json.put("url", host.isEmpty() ? "" : "https://" + host);

            String error = !lastError.isEmpty() ? lastError : cloudflared.getLastError();
            if (error != null && !error.isEmpty()) json.put("error", error);

            if (!installed) {
                json.put("error", "APK นี้ไม่ได้ฝังตัว cloudflared มาด้วย — ต้อง build ใหม่หลังรัน npm run fetch:cloudflared");
            }
        } catch (JSONException ex) {
            // JSONObject.put โยนได้เฉพาะตอนคีย์เป็น null ซึ่งเป็นไปไม่ได้ในนี้
        }
        return json;
    }

    public JSONObject logsJson() {
        JSONObject json = new JSONObject();
        try {
            json.put("log", log.snapshot());
            json.put("hostname", cloudflared.getHostname());
        } catch (JSONException ignored) {
        }
        return json;
    }

    void clearLog() {
        log.clear();
    }
}
