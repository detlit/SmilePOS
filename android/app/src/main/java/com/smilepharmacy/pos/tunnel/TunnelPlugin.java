package com.smilepharmacy.pos.tunnel;

import android.Manifest;
import android.os.Build;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Logger;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * หน้าต่างที่ JS ใช้คุย tunnel — คู่ตรงข้ามของ src/lib/mobile/native/tunnel.ts
 *
 * ปลั๊กอินตัวนี้จงใจไม่เก็บสถานะอะไรเลย ทุกอย่างอยู่ที่ TunnelController
 * เพราะ WebView ถูกสร้างใหม่ได้ตลอด (หมุนจอ, ระบบเรียกคืนหน่วยความจำ) แต่ tunnel ต้องไม่สะดุด
 *
 * เส้นทางคำขอครบวง
 *   คนนอก -> cloudflared -> LocalHttpServer -> WebViewApiBridge
 *          -> window.__smileposServeApi (JS) -> dispatch() -> SQLite
 *          -> respondApi() (กลับมาทางปลั๊กอินตัวนี้) -> ตอบกลับออกไป
 */
@CapacitorPlugin(
    name = "SmilePosTunnel",
    permissions = {
        @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
    }
)
public class TunnelPlugin extends Plugin {

    /** งานที่บล็อก (bind พอร์ต, spawn โปรเซส) ต้องไม่ไปอยู่บนเธรดหลัก */
    private final ExecutorService worker = Executors.newSingleThreadExecutor();

    private TunnelController controller;

    @Override
    public void load() {
        controller = TunnelController.get(getContext());
        controller.attachWebView(getBridge().getWebView());

        // เปิดต่อจากที่ตั้งค่าไว้ ต้องรอให้ WebView ประกาศตัวว่าพร้อมก่อน (registerServer)
        // ไม่งั้น cloudflared จะเปิดทางให้คนนอกเข้ามาเจอ 503 ในไม่กี่วินาทีแรก
    }

    @Override
    protected void handleOnDestroy() {
        controller.detachWebView();
        super.handleOnDestroy();
    }

    // ------------------------------------------------------------------ ฝั่ง JS ประกาศตัว

    /**
     * JS เรียกเมื่อ router ในเครื่องพร้อมรับงานแล้ว
     * ตัวนี้คือสัญญาณเดียวที่บอกว่าเสิร์ฟคำขอจากภายนอกได้จริง จึงใช้เป็นจังหวะเปิด tunnel ต่อด้วย
     */
    @PluginMethod
    public void registerServer(PluginCall call) {
        boolean ready = call.getBoolean("ready", true);
        controller.setHandlerReady(ready);

        if (ready) {
            worker.execute(() -> {
                try {
                    if (controller.isEnabled()) {
                        TunnelService.ensureRunning(getContext());
                        controller.resumeIfEnabled();
                    }
                } catch (Exception ex) {
                    Logger.error("SmilePosTunnel: เปิด tunnel ต่ออัตโนมัติไม่สำเร็จ", ex);
                }
            });
        }

        call.resolve();
    }

    /** JS ส่งคำตอบของคำขอหนึ่ง ๆ กลับมาให้ HTTP server ที่กำลังรออยู่ */
    @PluginMethod
    public void respondApi(PluginCall call) {
        String id = call.getString("id");
        if (id == null || id.isEmpty()) {
            call.reject("ไม่ได้ระบุรหัสคำขอ");
            return;
        }

        int status = call.getInt("status", 200);
        String bodyBase64 = call.getString("body");
        JSObject headerObject = call.getObject("headers");

        Map<String, String> headers = new LinkedHashMap<>();
        if (headerObject != null) {
            for (Iterator<String> keys = headerObject.keys(); keys.hasNext(); ) {
                String key = keys.next();
                headers.put(key, headerObject.optString(key, ""));
            }
        }

        byte[] body = new byte[0];
        if (bodyBase64 != null && !bodyBase64.isEmpty()) {
            try {
                body = Base64.decode(bodyBase64, Base64.DEFAULT);
            } catch (IllegalArgumentException ex) {
                body = ("{\"error\":\"ข้อมูลตอบกลับเสียหาย\"}").getBytes(StandardCharsets.UTF_8);
                status = 500;
            }
        }

        controller.deliverApiResponse(id, new WebViewApiBridge.ApiResponse(status, headers, body));
        call.resolve();
    }

    // ------------------------------------------------------------------ ควบคุม tunnel

    @PluginMethod
    public void status(PluginCall call) {
        call.resolve(safeJson(controller.statusJson()));
    }

    @PluginMethod
    public void logs(PluginCall call) {
        call.resolve(safeJson(controller.logsJson()));
    }

    /**
     * เปิด tunnel
     *
     * @param mode      "quick" (ลิงก์ชั่วคราว ไม่ต้องมีบัญชี) หรือ "token" (tunnel ถาวรของร้าน)
     * @param token     ใช้เฉพาะโหมด token — ว่างไว้ได้ถ้าเคยบันทึกไว้แล้ว
     * @param port      พอร์ตของ HTTP server ในเครื่อง (ไม่ส่งมาก็ใช้ค่าเดิม)
     * @param exposeLan true = ให้เครื่องอื่นในวง LAN เข้าถึงพอร์ตนี้ได้ด้วย
     */
    @PluginMethod
    public void start(PluginCall call) {
        String modeName = call.getString("mode", "quick");
        String token = call.getString("token", "");
        Integer port = call.getInt("port");
        Boolean exposeLan = call.getBoolean("exposeLan");

        CloudflaredProcess.Mode mode = "token".equalsIgnoreCase(modeName)
            ? CloudflaredProcess.Mode.TOKEN
            : CloudflaredProcess.Mode.QUICK;

        if (port != null && port > 0 && port < 65536) controller.setPort(port);
        if (exposeLan != null) controller.setExposeLan(exposeLan);

        // service ต้องขึ้นก่อน: Android ยอมให้เริ่ม foreground service ตอนแอปยัง "มองเห็นได้" เท่านั้น
        // ถ้าไปเริ่มทีหลังเมื่องานเปิด tunnel เสร็จ อาจโดน ForegroundServiceStartNotAllowedException
        TunnelService.ensureRunning(getContext());

        worker.execute(() -> {
            try {
                controller.start(mode, token);
                call.resolve(safeJson(controller.statusJson()));
            } catch (Exception ex) {
                TunnelService.shutdown(getContext());
                String message = ex.getMessage() == null ? "เปิด tunnel ไม่สำเร็จ" : ex.getMessage();
                Logger.error("SmilePosTunnel: " + message, ex);
                call.reject(message);
            }
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        worker.execute(() -> {
            try {
                TunnelService.shutdown(getContext());
                controller.stop();
                call.resolve(safeJson(controller.statusJson()));
            } catch (Exception ex) {
                call.reject(ex.getMessage() == null ? "หยุด tunnel ไม่สำเร็จ" : ex.getMessage());
            }
        });
    }

    @PluginMethod
    public void forgetToken(PluginCall call) {
        controller.forgetToken();
        call.resolve(safeJson(controller.statusJson()));
    }

    @PluginMethod
    public void clearLog(PluginCall call) {
        controller.clearLog();
        call.resolve();
    }

    // ------------------------------------------------------------------ สิทธิ์แจ้งเตือน

    /**
     * Android 13 ขึ้นไปต้องขอสิทธิ์ก่อน ไม่งั้นแถบแจ้งเตือนของ foreground service จะถูกซ่อน
     * (ตัว service ยังทำงาน แต่ผู้ใช้จะไม่เห็นสถานะและไม่มีปุ่มหยุด ซึ่งแย่กว่าไม่มีฟีเจอร์)
     */
    @PluginMethod
    public void ensureNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }

        if (getPermissionState("notifications") == com.getcapacitor.PermissionState.GRANTED) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }

        requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void notificationPermissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", getPermissionState("notifications") == com.getcapacitor.PermissionState.GRANTED);
        call.resolve(result);
    }

    /** JSObject.fromJSONObject โยน JSONException ได้ — ห่อไว้ให้เรียกง่าย */
    private static JSObject safeJson(JSONObject source) {
        try {
            return JSObject.fromJSONObject(source);
        } catch (Exception ex) {
            JSObject fallback = new JSObject();
            fallback.put("error", "อ่านสถานะไม่สำเร็จ");
            return fallback;
        }
    }
}
