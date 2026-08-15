package com.smilepharmacy.pos;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.CapConfig;
import com.getcapacitor.Logger;
import com.smilepharmacy.pos.tunnel.TunnelPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

/**
 * Activity หลักของ Smile POS
 *
 * ทำไมต้องตั้ง server.url เองที่นี่ ไม่ปล่อยให้หน้า shell พาไปเอง
 * ------------------------------------------------------------------
 * Capacitor inject ตัวสะพาน JS (window.Capacitor) ให้ "origin เดียว" เท่านั้น คือ appUrl
 * ดู Bridge.loadWebView():
 *
 *     WebViewCompat.addDocumentStartJavaScript(webView, injector.getScriptString(),
 *                                              Collections.singleton(allowedOrigin));
 *
 * ถ้าปล่อยให้หน้า shell (https://localhost) redirect ไป http://192.168.x.x เอง
 * หน้าปลายทางจะ "ไม่มี" window.Capacitor → isNativeApp() คืน false →
 * สแกนเนอร์ native, print relay, ปุ่ม Back, แบนเนอร์ออฟไลน์ ตายหมด
 *
 * จึงต้องบอก Capacitor ตั้งแต่ต้นว่า origin ของแอปคือเครื่อง server ในร้าน
 *
 * ลำดับการทำงานตอนเปิดแอป
 * ------------------------------------------------------------------
 *   1. อ่าน URL ที่จับคู่ไว้จาก SharedPreferences (Preferences plugin เขียนไว้)
 *   2. ยังไม่เคยจับคู่        -> โหลดหน้า shell ที่ฝังใน APK (หน้าจับคู่)
 *   3. จับคู่แล้ว + server พร้อม -> ตั้ง server.url แล้วเข้า UI จริง (สะพาน native ครบ)
 *   4. จับคู่แล้ว + server ล่ม  -> โหลดหน้า shell เพื่อแสดงข้อความไทย + ปุ่มลองใหม่
 *                                (ดีกว่าปล่อยให้เจอหน้า error ของ Android ที่กดอะไรไม่ได้)
 */
public class MainActivity extends BridgeActivity {

    /** ต้องตรงกับ STORAGE_KEY ใน mobile-shell/connect.js */
    private static final String SERVER_URL_KEY = "smilepos.serverUrl";

    /** Preferences plugin เก็บลง SharedPreferences ชื่อนี้เป็นค่าเริ่มต้น */
    private static final String PREFS_NAME = "CapacitorStorage";

    private static final String ENTRY_PATH = "/web/mobile/index";
    private static final String HEALTH_PATH = "/api/health";

    /** LAN ในร้านตอบเร็วมาก ถ้าเกินนี้ถือว่าไม่พร้อมแล้วไปหน้าจับคู่แทน */
    private static final int HEALTH_TIMEOUT_MS = 2000;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // ต้องทำก่อน super.onCreate() เพราะ BridgeActivity.onCreate() เรียก load()
        // ซึ่งอ่านฟิลด์ config และรายชื่อปลั๊กอินไปสร้าง Bridge ทันที
        registerPlugin(ShellPlugin.class);
        registerPlugin(TunnelPlugin.class);
        applyPairedServerConfig();

        super.onCreate(savedInstanceState);

        // เครื่องขายหน้าร้านต้องไม่ดับจอกลางบิล — พนักงานถือแท็บเล็ตเดินขายทั้งวัน
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    private void applyPairedServerConfig() {
        // โหมด standalone: UI และฐานข้อมูลอยู่ใน APK ทั้งหมด ไม่มี server ให้จับคู่
        // ต้องตรวจก่อนอ่านค่าที่จับคู่ไว้ เพราะเครื่องที่เคยลงเวอร์ชันเก่ายังมี serverUrl ค้างอยู่
        if (isStandaloneBuild()) {
            Logger.info("SmilePOS: โหมด standalone — ใช้ข้อมูลในเครื่อง ไม่ต่อ server");
            return;
        }

        String serverUrl = readPairedServerUrl();

        if (serverUrl == null || serverUrl.trim().isEmpty()) {
            Logger.info("SmilePOS: ยังไม่ได้จับคู่ server — เปิดหน้าจับคู่");
            return;
        }

        if (!isServerReachable(serverUrl)) {
            Logger.info("SmilePOS: ต่อ " + serverUrl + " ไม่ได้ — เปิดหน้าจับคู่แทน");
            return;
        }

        JSONObject assetConfig = readAssetConfig();

        // Builder เริ่มจากค่า default ของ Capacitor ไม่ได้สืบทอดจาก capacitor.config.json
        // จึงต้องยกค่าที่จำเป็นมาเองให้ครบ ไม่งั้น allowNavigation / plugin config จะหาย
        CapConfig.Builder builder = new CapConfig.Builder(this)
            .setServerUrl(serverUrl)
            .setStartPath(ENTRY_PATH)
            .setAndroidScheme(readString(assetConfig, "androidScheme", "https"))
            .setAllowNavigation(readAllowNavigation(assetConfig))
            // ห้ามเรียก setCaptureInput(true) — จะทำให้พิมพ์ภาษาไทยไม่ได้
            // (เหตุผลเต็มอยู่ใน capacitor.config.ts) ค่า default คือ false อยู่แล้ว
            .setAllowMixedContent(true);

        JSONObject plugins = assetConfig == null ? null : assetConfig.optJSONObject("plugins");
        if (plugins != null) {
            builder.setPluginsConfiguration(plugins);
        }

        this.config = builder.create();
        Logger.info("SmilePOS: เข้าใช้งานผ่าน " + serverUrl + ENTRY_PATH);
    }

    /** true = APK นี้ build มาแบบ standalone (ดูธง "standalone" ใน capacitor.config.json) */
    private boolean isStandaloneBuild() {
        JSONObject assetConfig = readAssetConfig();
        return assetConfig != null && assetConfig.optBoolean("standalone", false);
    }

    private String readPairedServerUrl() {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
            return prefs.getString(SERVER_URL_KEY, null);
        } catch (Exception ex) {
            Logger.error("SmilePOS: อ่านค่าที่จับคู่ไว้ไม่สำเร็จ", ex);
            return null;
        }
    }

    /**
     * เช็คว่า server ในร้านพร้อมจริงก่อนมอบ origin ให้ WebView
     *
     * ยอมบล็อกสั้น ๆ ตอนเปิดแอปเพื่อแลกกับการที่ผู้ใช้ไม่ต้องเจอหน้า error ของ Android
     * ตอน server ปิดอยู่ — ในวง LAN ปกติใช้เวลาไม่ถึง 100ms
     */
    private boolean isServerReachable(String origin) {
        ExecutorService executor = Executors.newSingleThreadExecutor();

        try {
            Future<Boolean> probe = executor.submit(() -> {
                HttpURLConnection connection = null;
                try {
                    connection = (HttpURLConnection) new URL(origin + HEALTH_PATH).openConnection();
                    connection.setConnectTimeout(HEALTH_TIMEOUT_MS);
                    connection.setReadTimeout(HEALTH_TIMEOUT_MS);
                    connection.setRequestMethod("GET");
                    return connection.getResponseCode() < 500;
                } finally {
                    if (connection != null) connection.disconnect();
                }
            });

            return Boolean.TRUE.equals(probe.get(HEALTH_TIMEOUT_MS + 500L, TimeUnit.MILLISECONDS));
        } catch (Exception ex) {
            return false;
        } finally {
            executor.shutdownNow();
        }
    }

    /** อ่าน capacitor.config.json ที่ cap sync คัดลอกมาไว้ใน assets */
    private JSONObject readAssetConfig() {
        try (InputStream input = getAssets().open("capacitor.config.json")) {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] chunk = new byte[4096];
            int read;
            while ((read = input.read(chunk)) != -1) {
                buffer.write(chunk, 0, read);
            }

            return new JSONObject(new String(buffer.toByteArray(), StandardCharsets.UTF_8));
        } catch (Exception ex) {
            Logger.error("SmilePOS: อ่าน capacitor.config.json ไม่สำเร็จ", ex);
            return null;
        }
    }

    private String readString(JSONObject config, String serverKey, String fallback) {
        if (config == null) return fallback;

        JSONObject server = config.optJSONObject("server");
        if (server == null) return fallback;

        return server.optString(serverKey, fallback);
    }

    private String[] readAllowNavigation(JSONObject config) {
        if (config == null) return new String[0];

        JSONObject server = config.optJSONObject("server");
        if (server == null) return new String[0];

        JSONArray list = server.optJSONArray("allowNavigation");
        if (list == null) return new String[0];

        String[] result = new String[list.length()];
        for (int i = 0; i < list.length(); i++) {
            result[i] = list.optString(i);
        }

        return result;
    }
}
