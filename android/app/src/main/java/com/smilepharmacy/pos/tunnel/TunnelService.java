package com.smilepharmacy.pos.tunnel;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

import androidx.core.app.NotificationCompat;

/**
 * Foreground service ที่ทำให้ tunnel อยู่รอดตอนผู้ใช้สลับไปแอปอื่นหรือปิดหน้าจอ
 *
 * ทำไมขาดไม่ได้
 * ------------------------------------------------------------------
 * Android หยุดโปรเซสของแอปที่ไม่มีอะไรมองเห็นได้ภายในไม่กี่นาที ถ้าไม่มี service ตัวนี้
 * ลิงก์ที่แชร์ออกไปจะใช้ได้เฉพาะตอนที่พนักงานเปิดหน้าจอแอปค้างไว้เท่านั้น ซึ่งไม่มีประโยชน์จริง
 * แถบแจ้งเตือนที่โผล่ขึ้นมาคือ "ค่าตอบแทน" ที่ระบบเรียกเก็บ และก็ทำหน้าที่ดีอยู่แล้วในแง่ที่
 * เจ้าของร้านเห็นตลอดเวลาว่าเครื่องกำลังเปิดให้เข้าจากภายนอกอยู่ พร้อมปุ่มปิดในตัว
 *
 * ประเภท specialUse ไม่ใช่ dataSync
 * ------------------------------------------------------------------
 * ตั้งแต่ Android 15 ประเภท dataSync ถูกจำกัดไว้ที่ 6 ชั่วโมงต่อวัน ซึ่งสั้นกว่าเวลาเปิดร้าน
 * พอครบเวลาระบบจะฆ่า service ทิ้งแล้วลิงก์ตายกลางวัน — เคสที่หาสาเหตุยากที่สุดแบบหนึ่ง
 * specialUse ไม่มีเพดานนั้นและตรงกับการใช้งานจริง (เครื่องขายหน้าร้านทำตัวเป็น server)
 */
public final class TunnelService extends Service implements TunnelController.StatusListener {

    public static final String ACTION_START = "com.smilepharmacy.pos.tunnel.START";
    public static final String ACTION_STOP = "com.smilepharmacy.pos.tunnel.STOP";

    private static final String CHANNEL_ID = "smilepos-tunnel";
    private static final int NOTIFICATION_ID = 4471;

    private TunnelController controller;
    private PowerManager.WakeLock wakeLock;
    private WifiManager.WifiLock wifiLock;

    /** เปิด service ถ้ายังไม่เปิด — เรียกซ้ำได้ */
    public static void ensureRunning(Context context) {
        Intent intent = new Intent(context, TunnelService.class).setAction(ACTION_START);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    public static void shutdown(Context context) {
        context.startService(new Intent(context, TunnelService.class).setAction(ACTION_STOP));
    }

    @Override
    public void onCreate() {
        super.onCreate();
        controller = TunnelController.get(this);
        controller.setStatusListener(this);
        createChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? ACTION_START : intent.getAction();

        if (ACTION_STOP.equals(action)) {
            controller.stop();
            releaseLocks();
            stopForeground(STOP_FOREGROUND_REMOVE);
            stopSelf();
            return START_NOT_STICKY;
        }

        startInForeground();
        acquireLocks();

        // START_STICKY: ถ้าระบบต้องเรียกคืนหน่วยความจำจริง ๆ ให้กลับมาเปิดใหม่เอง
        // แล้ว TunnelPlugin.load() จะสั่ง resumeIfEnabled() ต่อให้เมื่อ WebView กลับมา
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        // service ตาย = ไม่มีใครประกันว่าโปรเซสจะอยู่ต่อ ต้องเก็บ cloudflared ให้เรียบร้อย
        // ไม่งั้นมันจะกลายเป็นโปรเซสกำพร้าที่ยังต่อกับ edge อยู่แต่ยิงเข้า HTTP server ที่ตายไปแล้ว
        // ผลคือผู้เข้าชมเจอ 502 สลับกับหน้าปกติ ซึ่งไล่สาเหตุยากมาก
        controller.stop();
        controller.setStatusListener(null);
        releaseLocks();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onTunnelStatusChanged() {
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) manager.notify(NOTIFICATION_ID, buildNotification());
    }

    // ------------------------------------------------------------------ แถบแจ้งเตือน

    private void startInForeground() {
        Notification notification = buildNotification();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "การเข้าถึงจากภายนอก",
            NotificationManager.IMPORTANCE_LOW // ไม่ส่งเสียง ไม่เด้ง — อยู่เป็นสถานะเฉย ๆ
        );
        channel.setDescription("แสดงสถานะลิงก์ที่แชร์ให้เข้าถึงระบบขายจากนอกร้าน");
        channel.setShowBadge(false);

        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) manager.createNotificationChannel(channel);
    }

    private Notification buildNotification() {
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent contentIntent = open == null ? null : PendingIntent.getActivity(
            this, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        PendingIntent stopIntent = PendingIntent.getService(
            this, 1,
            new Intent(this, TunnelService.class).setAction(ACTION_STOP),
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        String detail = controller.describeForNotification();

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Smile POS เปิดให้เข้าจากภายนอก")
            .setContentText(detail)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(detail))
            .setSmallIcon(android.R.drawable.stat_sys_upload)
            .setOngoing(true)
            .setShowWhen(false)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setVisibility(NotificationCompat.VISIBILITY_SECRET) // ที่อยู่ tunnel ไม่ควรโผล่บนหน้าจอล็อก
            .addAction(0, "หยุด", stopIntent);

        if (contentIntent != null) builder.setContentIntent(contentIntent);

        return builder.build();
    }

    // ------------------------------------------------------------------ ล็อกไม่ให้เครื่องหลับ

    /**
     * แท็บเล็ตหน้าร้านเสียบไฟตลอด แต่ Android ยังพัก CPU และ Wi-Fi ตอนจอดับอยู่ดี
     * ซึ่งทำให้ connection กับ Cloudflare หลุดเป็นช่วง ๆ แล้วลิงก์ใช้บ้างไม่ได้บ้าง
     */
    private void acquireLocks() {
        if (wakeLock == null) {
            PowerManager power = (PowerManager) getSystemService(POWER_SERVICE);
            if (power != null) {
                wakeLock = power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "SmilePOS::tunnel");
                wakeLock.setReferenceCounted(false);
            }
        }
        if (wakeLock != null && !wakeLock.isHeld()) wakeLock.acquire();

        if (wifiLock == null) {
            WifiManager wifi = (WifiManager) getApplicationContext().getSystemService(WIFI_SERVICE);
            if (wifi != null) {
                wifiLock = wifi.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "SmilePOS::tunnel");
                wifiLock.setReferenceCounted(false);
            }
        }
        if (wifiLock != null && !wifiLock.isHeld()) wifiLock.acquire();
    }

    private void releaseLocks() {
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        if (wifiLock != null && wifiLock.isHeld()) wifiLock.release();
    }
}
