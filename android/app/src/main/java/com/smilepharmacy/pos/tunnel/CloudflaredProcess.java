package com.smilepharmacy.pos.tunnel;

import android.content.Context;
import android.os.Build;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * ผู้ดูแลโปรเซส cloudflared ที่รันอยู่ในแท็บเล็ต
 *
 * ทำไมไฟล์ไบนารีต้องอยู่ใน jniLibs
 * ------------------------------------------------------------------
 * ตั้งแต่ Android 10 (API 29) SELinux ห้ามแอป execve() ไฟล์ที่อยู่ในโฟลเดอร์ข้อมูลของตัวเอง
 * (กฎ W^X) ดาวน์โหลด cloudflared มาวางใน filesDir แล้วสั่งรันจึงถูกปฏิเสธเสมอ
 *
 * ทางที่ระบบยอมคือวางไว้ใน lib/<abi>/ ของ APK แล้วให้ตัวติดตั้งแตกออกมาที่ nativeLibraryDir
 * ซึ่งมีสิทธิ์ execute อยู่แล้ว ข้อแม้คือชื่อไฟล์ต้องขึ้นต้น lib และลงท้าย .so ไม่งั้น
 * ตัวติดตั้งจะไม่แตกไฟล์ออกมา — ที่มาของชื่อ libcloudflared.so ทั้งที่มันเป็น executable ไม่ใช่ shared library
 * (ต้องคู่กับ android:extractNativeLibs="true" และ useLegacyPackaging true ใน build.gradle)
 *
 * ตัวไบนารีเป็น Go แบบ static ไม่พึ่ง bionic จึงรันบนเคอร์เนล Android ได้ตามปกติ
 * ดู scripts/fetch-cloudflared.js สำหรับขั้นตอนดาวน์โหลดตอน build
 */
final class CloudflaredProcess {

    /** ชื่อไฟล์ที่ scripts/fetch-cloudflared.js วางไว้ใน jniLibs/<abi>/ */
    static final String BINARY_NAME = "libcloudflared.so";

    enum Mode {
        /** ลิงก์ชั่วคราว *.trycloudflare.com — ไม่ต้องมีบัญชี Cloudflare */
        QUICK,
        /** tunnel ถาวรที่ผูกกับโดเมนของร้าน — ใช้ token จาก Zero Trust Dashboard */
        TOKEN
    }

    /**
     * URL ของ quick tunnel ที่ cloudflared พิมพ์ออกมา
     *
     * จำกัดไว้แค่สองโดเมนนี้โดยตั้งใจ ห้ามใช้รูปแบบ "โดเมนอะไรก็ได้" เด็ดขาด —
     * บรรทัดแรกที่ cloudflared พิมพ์คือคำชี้แจงเงื่อนไขการใช้งานซึ่งมี
     * https://www.cloudflare.com/website-terms/ อยู่ข้างใน ถ้าจับกว้างไปจะได้
     * www.cloudflare.com มาเป็น "ที่อยู่สำหรับแชร์" แล้วผู้ใช้กดเข้าเว็บ Cloudflare แทนร้านตัวเอง
     * ส่วน tunnel ที่ผูกโดเมนของร้านไว้ใช้ CONFIG_HOSTNAME ด้านล่างจับแทน
     */
    private static final Pattern URL_PATTERN = Pattern.compile(
        "https?://([a-zA-Z0-9][a-zA-Z0-9._-]*\\.(?:trycloudflare\\.com|cfargotunnel\\.com))");

    /** tunnel แบบมีชื่อไม่พิมพ์ URL แต่พิมพ์ ingress config ที่มี hostname อยู่ข้างใน */
    private static final Pattern CONFIG_HOSTNAME = Pattern.compile(
        "\"hostname\"\\s*:\\s*\"([a-zA-Z0-9][a-zA-Z0-9._-]*\\.[a-zA-Z]{2,})\"");

    private static final long[] BACKOFF_MS = { 2_000, 4_000, 8_000, 15_000, 30_000, 60_000 };

    /** ที่อยู่ edge ของ Cloudflare — ชื่อพวกนี้ต้องแปลงเป็น IP ฝั่ง Java เพราะ Go แปลงเองไม่ได้บน Android */
    private static final String[] EDGE_REGIONS = {
        "region1.v2.argotunnel.com",
        "region2.v2.argotunnel.com",
    };

    private static final int EDGE_PORT = 7844;

    /** cloudflared เปิดการเชื่อมต่อกับ edge สี่เส้น ให้ที่อยู่มากกว่านี้ก็ไม่ได้ใช้ */
    private static final int MAX_EDGE_ADDRESSES = 8;

    /** ที่เก็บหมายเลขโปรเซสไว้ข้ามการเปิดแอป — ดู killOrphan() */
    interface PidStore {
        void savePid(int pid);
    }

    private final Context context;
    private final LogBuffer log;
    private final PidStore pidStore;
    private final CloudflareApiRelay relay;

    private Process process;
    private Thread readerThread;
    private Thread supervisorThread;

    private volatile boolean wanted;      // ผู้ใช้สั่งให้เปิดอยู่หรือไม่
    private volatile String hostname = "";
    private volatile String lastError = "";
    private volatile int restarts;

    private Mode mode = Mode.QUICK;
    private String token = "";
    private int targetPort;

    CloudflaredProcess(Context context, LogBuffer log, PidStore pidStore) {
        this.context = context.getApplicationContext();
        this.log = log;
        this.pidStore = pidStore;
        this.relay = new CloudflareApiRelay(log);
    }

    /**
     * ฆ่า cloudflared ที่หลงเหลือจากโปรเซสแอปรอบก่อน
     *
     * ลูกที่ ProcessBuilder สร้างไว้ "ไม่" ตายตามพ่อ ถ้าระบบเก็บโปรเซสแอปไปตอนหน่วยความจำเต็ม
     * cloudflared ตัวเดิมจะยังต่อกับ edge อยู่แต่ยิงเข้าพอร์ตที่ไม่มีใครฟังแล้ว พอเปิดแอปใหม่
     * จะได้ connector สองตัวต่อ tunnel เดียว Cloudflare กระจายทราฟฟิกให้ทั้งคู่ ครึ่งหนึ่งของคำขอ
     * จึงตกไปที่ตัวผี — อาการคือ "เข้าได้บ้างไม่ได้บ้าง" ซึ่งไล่สาเหตุยากที่สุดแบบหนึ่ง
     *
     * ตรวจ /proc/<pid>/cmdline ก่อนฆ่าเสมอ เพราะหมายเลขโปรเซสถูกใช้ซ้ำได้
     */
    static void killOrphan(int pid, LogBuffer log) {
        if (pid <= 0) return;
        if (pid == android.os.Process.myPid()) return;

        try {
            java.io.File cmdline = new java.io.File("/proc/" + pid + "/cmdline");
            if (!cmdline.exists()) return;

            byte[] raw = new byte[256];
            int read;
            try (java.io.FileInputStream stream = new java.io.FileInputStream(cmdline)) {
                read = stream.read(raw);
            }
            if (read <= 0) return;

            String command = new String(raw, 0, read, StandardCharsets.UTF_8).replace('\0', ' ');
            if (!command.contains(BINARY_NAME)) return;

            android.os.Process.killProcess(pid);
            if (log != null) log.note("ปิด cloudflared ที่ค้างจากรอบก่อน (pid " + pid + ")");
        } catch (Exception ignored) {
            // อ่าน /proc ไม่ได้บนบางรอม — ปล่อยผ่าน ดีกว่าทำให้เปิด tunnel ไม่ได้เลย
        }
    }

    /**
     * หมายเลขโปรเซสของลูก — Process.pid() มีตั้งแต่ API 26 ส่วนเครื่อง API 24-25
     * ต้องอ่านจากฟิลด์ภายในของ ProcessImpl ซึ่งเป็น core library ไม่ใช่ hidden API ของ Android
     */
    private static int pidOf(Process target) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                java.lang.reflect.Method method = Process.class.getMethod("pid");
                Object value = method.invoke(target);
                if (value instanceof Number) return ((Number) value).intValue();
            } catch (Throwable ignored) {
            }
        }
        try {
            java.lang.reflect.Field field = target.getClass().getDeclaredField("pid");
            field.setAccessible(true);
            return field.getInt(target);
        } catch (Throwable ignored) {
            return -1;
        }
    }

    // ------------------------------------------------------------------ สถานะ

    /** ไฟล์ไบนารีถูกฝังมากับ APK นี้หรือไม่ */
    boolean isInstalled() {
        File binary = binaryFile();
        return binary.exists() && binary.canExecute();
    }

    File binaryFile() {
        return new File(context.getApplicationInfo().nativeLibraryDir, BINARY_NAME);
    }

    boolean isRunning() {
        Process current = process;
        if (current == null) return false;
        try {
            current.exitValue();
            return false;
        } catch (IllegalThreadStateException stillAlive) {
            return true;
        }
    }

    boolean isWanted() {
        return wanted;
    }

    String getHostname() {
        return hostname;
    }

    String getLastError() {
        return lastError;
    }

    Mode getMode() {
        return mode;
    }

    // ------------------------------------------------------------------ เปิด/ปิด

    synchronized void start(Mode mode, String token, int port) throws IOException {
        if (!isInstalled()) {
            throw new IOException(
                "APK นี้ไม่ได้ฝังตัว cloudflared มาด้วย — build ใหม่หลังรัน npm run fetch:cloudflared");
        }
        if (mode == Mode.TOKEN && (token == null || token.trim().isEmpty())) {
            throw new IOException("โหมด tunnel ถาวรต้องมี token");
        }

        this.mode = mode;
        this.token = token == null ? "" : token.trim();
        this.targetPort = port;
        this.wanted = true;
        this.restarts = 0;
        this.hostname = "";
        this.lastError = "";

        spawn();
        startSupervisor();
    }

    synchronized void stop() {
        wanted = false;

        Thread supervisor = supervisorThread;
        supervisorThread = null;
        if (supervisor != null) supervisor.interrupt();

        killProcess();
        relay.stop();
        hostname = "";
        log.note("หยุด cloudflared แล้ว");
    }

    private void killProcess() {
        Process current = process;
        process = null;

        if (current != null) {
            current.destroy();
            // ให้เวลาปิด connection กับ edge อย่างสุภาพก่อนบังคับฆ่า
            // ใช้วิธี poll เอง เพราะ Process.waitFor(timeout) มีตั้งแต่ API 26 แต่แอปรองรับ 24
            if (!awaitExit(current, 3_000)) {
                current.destroyForcibly();
            }
        }

        Thread reader = readerThread;
        readerThread = null;
        if (reader != null) reader.interrupt();
    }

    /** @return true = โปรเซสจบลงภายในเวลาที่ให้ */
    private boolean awaitExit(Process target, long timeoutMs) {
        long deadline = System.currentTimeMillis() + timeoutMs;
        while (System.currentTimeMillis() < deadline) {
            try {
                target.exitValue();
                return true;
            } catch (IllegalThreadStateException stillAlive) {
                sleepQuietly(100);
            }
        }
        return false;
    }

    private void spawn() throws IOException {
        List<String> command = buildCommand();
        log.note("เริ่ม cloudflared: " + describeCommand(command));

        ProcessBuilder builder = new ProcessBuilder(command);
        builder.redirectErrorStream(true);

        // cloudflared อยากมี HOME สำหรับเขียน ~/.cloudflared และ TMPDIR สำหรับไฟล์ชั่วคราว
        // ถ้าไม่ตั้งให้ มันจะพยายามเขียนลง / ซึ่งอ่านอย่างเดียวบน Android แล้วออกทันที
        builder.environment().put("HOME", context.getFilesDir().getAbsolutePath());
        builder.environment().put("TMPDIR", context.getCacheDir().getAbsolutePath());

        try {
            process = builder.start();
        } catch (IOException ex) {
            lastError = "เริ่มโปรเซส cloudflared ไม่สำเร็จ: " + ex.getMessage();
            log.note(lastError);
            throw new IOException(lastError, ex);
        }

        if (pidStore != null) pidStore.savePid(pidOf(process));
        startReader(process);
    }

    private List<String> buildCommand() throws IOException {
        List<String> command = new ArrayList<>();
        command.add(binaryFile().getAbsolutePath());
        command.add("tunnel");
        command.add("--no-autoupdate");

        // http2 แทน QUIC: เครือข่ายมือถือและ Wi-Fi ในร้านหลายที่บล็อก UDP/7844
        // ฝั่งพีซี (installer/scripts/tunnel-manage.ps1) ก็ตั้งค่านี้เหมือนกัน
        command.add("--protocol");
        command.add("http2");

        command.add("--loglevel");
        command.add("info");

        // ---- ตัดการแปลงชื่อโดเมนออกจาก cloudflared ให้หมด (ดูเหตุผลใน CloudflareApiRelay) ----

        // --edge รับได้ครั้งละหนึ่งที่อยู่ ต้องใส่ธงซ้ำถ้ามีหลายตัว
        // (ส่งเป็นรายการคั่นจุลภาคจะได้ error "too many colons in address")
        for (String edge : resolveEdgeAddresses()) {
            command.add("--edge");
            command.add(edge);
        }

        if (mode == Mode.QUICK) {
            // API ของ quick tunnel ต้องผ่านตัวกลางฝั่ง Java ไม่งั้นแปลงชื่อ api.trycloudflare.com ไม่ได้
            int relayPort = relay.start();
            command.add("--quick-service");
            command.add("http://127.0.0.1:" + relayPort);

            command.add("--url");
            command.add("http://127.0.0.1:" + targetPort);
        } else {
            command.add("run");
            command.add("--token");
            command.add(token);
        }

        return command;
    }

    /**
     * แปลงชื่อ edge ของ Cloudflare เป็น IP ด้วยตัวแปลของ Android แล้วต่อเป็นค่าให้ธง --edge
     *
     * เลือก IPv4 ก่อนเสมอ เพราะ Wi-Fi ในร้านส่วนใหญ่ไม่มี IPv6 ใช้จริง การปล่อยให้ cloudflared
     * ไปลอง IPv6 ที่ต่อไม่ติดก่อนจะทำให้การเชื่อมต่อครั้งแรกช้าขึ้นหลายวินาทีโดยไม่จำเป็น
     *
     * คืนรายการว่างถ้าแปลงไม่ได้เลย (เช่นเน็ตหลุดตอนกดปุ่ม) แล้วปล่อยให้ cloudflared ลองเอง
     * — จะล้มเหลวพร้อมข้อความใน log ซึ่งดีกว่าเงียบไปเฉย ๆ
     */
    private List<String> resolveEdgeAddresses() {
        LinkedHashSet<String> ipv4 = new LinkedHashSet<>();
        LinkedHashSet<String> ipv6 = new LinkedHashSet<>();

        for (String region : EDGE_REGIONS) {
            try {
                for (InetAddress address : InetAddress.getAllByName(region)) {
                    String host = address.getHostAddress();
                    if (host == null) continue;
                    if (address instanceof Inet4Address) {
                        ipv4.add(host + ":" + EDGE_PORT);
                    } else {
                        // IPv6 ต้องอยู่ในวงเล็บเหลี่ยมเวลาต่อกับพอร์ต และต้องตัด scope id (%wlan0) ออก
                        int scope = host.indexOf('%');
                        if (scope >= 0) host = host.substring(0, scope);
                        ipv6.add("[" + host + "]:" + EDGE_PORT);
                    }
                }
            } catch (UnknownHostException ex) {
                log.note("แปลงชื่อ " + region + " ไม่สำเร็จ: " + ex.getMessage());
            }
        }

        LinkedHashSet<String> chosen = ipv4.isEmpty() ? ipv6 : ipv4;
        if (chosen.isEmpty()) {
            log.note("หาที่อยู่ edge ของ Cloudflare ไม่ได้ — ตรวจการเชื่อมต่ออินเทอร์เน็ตของแท็บเล็ต");
            return new ArrayList<>();
        }

        // แต่ละภูมิภาคตอบกลับมาสิบกว่า IP ซึ่งเกินความจำเป็น cloudflared ใช้แค่ไม่กี่ตัวสำหรับ
        // การเชื่อมต่อสี่เส้นของมัน เอามาพอประมาณเพื่อไม่ให้บรรทัดคำสั่งยาวเกินเหตุ
        List<String> selected = new ArrayList<>();
        for (String address : chosen) {
            selected.add(address);
            if (selected.size() >= MAX_EDGE_ADDRESSES) break;
        }

        log.note("ที่อยู่ edge ที่ใช้: " + selected);
        return selected;
    }

    /** ตัด token ออกจากข้อความ log — ใครที่เห็น log ไม่ควรได้สิทธิ์คุม tunnel ไปด้วย */
    private String describeCommand(List<String> command) {
        StringBuilder sb = new StringBuilder();
        boolean maskNext = false;
        for (String part : command) {
            String shown = maskNext ? "<token>" : part;
            maskNext = "--token".equals(part);
            sb.append(shown).append(' ');
        }
        return sb.toString().trim();
    }

    private void startReader(Process target) {
        Thread reader = new Thread(() -> {
            try (BufferedReader stream = new BufferedReader(
                    new InputStreamReader(target.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = stream.readLine()) != null) {
                    log.add(line);
                    detectHostname(line);
                }
            } catch (IOException ignored) {
                // โปรเซสถูกปิด — เป็นเรื่องปกติตอนกดหยุด
            }
        }, "cloudflared-log");

        reader.setDaemon(true);
        reader.start();
        readerThread = reader;
    }

    private void detectHostname(String line) {
        if (!hostname.isEmpty()) return;

        // cloudflared escape เครื่องหมายคำพูดใน log ของ config — เอาออกก่อนจับ
        String normalized = line.replace("\\", "");

        Matcher url = URL_PATTERN.matcher(normalized);
        if (url.find()) {
            hostname = url.group(1);
            log.note("ที่อยู่สำหรับแชร์: https://" + hostname);
            return;
        }

        Matcher config = CONFIG_HOSTNAME.matcher(normalized);
        if (config.find()) {
            hostname = config.group(1);
            log.note("ที่อยู่สำหรับแชร์: https://" + hostname);
        }
    }

    /**
     * เฝ้าดูโปรเซส แล้วเปิดใหม่ถ้ามันตายทั้งที่ผู้ใช้ยังสั่งเปิดอยู่
     *
     * cloudflared ตายเองได้หลายกรณีที่ไม่ใช่ความผิดใคร: Wi-Fi ในร้านหลุด, สลับจาก Wi-Fi
     * ไป 4G, edge ฝั่ง Cloudflare ตัด connection ถ้าไม่มีตัวเปิดใหม่ให้ เจ้าของร้านจะพบว่า
     * ลิงก์ตายไปเงียบ ๆ โดยไม่รู้ตัว
     */
    private void startSupervisor() {
        Thread supervisor = new Thread(() -> {
            while (wanted && !Thread.currentThread().isInterrupted()) {
                Process current = process;

                if (current == null) {
                    sleepQuietly(1_000);
                    continue;
                }

                try {
                    int exit = current.waitFor();
                    if (!wanted) return;

                    long delay = BACKOFF_MS[Math.min(restarts, BACKOFF_MS.length - 1)];
                    restarts += 1;
                    lastError = "cloudflared หยุดเอง (exit " + exit + ")";
                    log.note(lastError + " — จะลองใหม่ในอีก " + (delay / 1000) + " วินาที (ครั้งที่ " + restarts + ")");

                    sleepQuietly(delay);
                    if (!wanted) return;

                    synchronized (this) {
                        if (!wanted) return;
                        hostname = "";
                        spawn();
                    }
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                    return;
                } catch (IOException ex) {
                    lastError = "เปิด cloudflared ใหม่ไม่สำเร็จ: " + ex.getMessage();
                    log.note(lastError);
                    sleepQuietly(10_000);
                }
            }
        }, "cloudflared-watch");

        supervisor.setDaemon(true);
        supervisor.start();
        supervisorThread = supervisor;
    }

    private void sleepQuietly(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }
}
