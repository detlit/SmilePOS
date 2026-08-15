package com.smilepharmacy.pos;

import android.content.Intent;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * ปลั๊กอินเล็ก ๆ ให้หน้าจับคู่เรียกใช้
 *
 * ทำไมต้องรีสตาร์ทแอปแทนที่จะ redirect ด้วย window.location
 * ------------------------------------------------------------------
 * origin ของแอปถูกกำหนดตอน Bridge ถูกสร้างใน MainActivity.onCreate() เท่านั้น
 * และ Capacitor inject window.Capacitor ให้แค่ origin นั้น origin เดียว
 * ถ้า redirect เอง หน้าปลายทางจะไม่มีสะพาน native ให้ใช้
 *
 * จึงต้องบันทึกค่าแล้วเริ่ม Activity ใหม่ ให้ MainActivity อ่านค่าที่จับคู่ไว้
 * แล้วตั้ง server.url ให้ถูกตั้งแต่ต้น
 */
@CapacitorPlugin(name = "SmilePosShell")
public class ShellPlugin extends Plugin {

    /** ต้องตรงกับ MainActivity.SERVER_URL_KEY และ STORAGE_KEY ใน connect.js */
    private static final String SERVER_URL_KEY = "smilepos.serverUrl";
    private static final String PREFS_NAME = "CapacitorStorage";

    /**
     * บันทึกที่อยู่ server ที่จับคู่แล้วเปิดแอปใหม่
     *
     * เขียนค่าเองแทนที่จะพึ่ง Preferences plugin เพื่อให้แน่ใจว่าค่าลงดิสก์แล้วจริง
     * ก่อนที่ process จะถูกฆ่า — commit() เขียนแบบ synchronous ต่างจาก apply()
     */
    @PluginMethod
    public void pairAndRestart(PluginCall call) {
        String url = call.getString("url");

        if (url == null || url.trim().isEmpty()) {
            call.reject("ไม่ได้ระบุที่อยู่ server");
            return;
        }

        try {
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE);
            boolean saved = prefs.edit().putString(SERVER_URL_KEY, url.trim()).commit();

            if (!saved) {
                call.reject("บันทึกที่อยู่ server ไม่สำเร็จ");
                return;
            }

            JSObject result = new JSObject();
            result.put("restarting", true);
            call.resolve(result);

            restartApp();
        } catch (Exception ex) {
            call.reject("เริ่มระบบใหม่ไม่สำเร็จ: " + ex.getMessage());
        }
    }

    /** ล้างค่าที่จับคู่ไว้แล้วกลับไปหน้าจับคู่ — ใช้ตอนย้ายเครื่อง server */
    @PluginMethod
    public void resetPairing(PluginCall call) {
        try {
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE);
            prefs.edit().remove(SERVER_URL_KEY).commit();

            call.resolve();
            restartApp();
        } catch (Exception ex) {
            call.reject("ล้างค่าไม่สำเร็จ: " + ex.getMessage());
        }
    }

    private void restartApp() {
        Intent intent = getContext()
            .getPackageManager()
            .getLaunchIntentForPackage(getContext().getPackageName());

        if (intent == null) return;

        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);

        // ปิด process เดิมทิ้ง ไม่งั้น Bridge ตัวเก่าที่ผูกกับ origin เดิมยังค้างอยู่
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(
            () -> Runtime.getRuntime().exit(0),
            300
        );
    }
}
