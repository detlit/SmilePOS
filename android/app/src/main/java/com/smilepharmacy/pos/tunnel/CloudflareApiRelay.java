package com.smilepharmacy.pos.tunnel;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * ตัวแทนคุยกับ api.trycloudflare.com ให้ cloudflared
 *
 * ทำไมต้องมีตัวกลางทั้งที่ cloudflared ต่อเน็ตเองได้
 * ------------------------------------------------------------------
 * cloudflared เป็นโปรแกรมภาษา Go ที่ build มาสำหรับ Linux แบบ static ตัวแปลชื่อโดเมนของ Go
 * อ่านรายชื่อ DNS server จาก /etc/resolv.conf ซึ่ง "ไม่มีอยู่บน Android" (ระบบใช้ตัวแปลของ
 * bionic ผ่าน netd แทน) เมื่ออ่านไฟล์ไม่ได้ Go จะถอยไปใช้ค่าเริ่มต้นคือ 127.0.0.1:53
 * และ [::1]:53 ซึ่งไม่มีใครฟังอยู่ ผลคือทุกการแปลงชื่อโดเมนล้มเหลวด้วย connection refused
 *
 * ทางแก้ที่ตรงที่สุดคือ build cloudflared ใหม่ด้วย NDK ให้ใช้ตัวแปลของ Android
 * แต่นั่นบังคับให้ทุกเครื่องที่ build APK ต้องมี Go + NDK ติดตั้งไว้ ซึ่งแพงเกินไป
 *
 * ตัวนี้แก้อีกทางแทน: ตัดการแปลงชื่อโดเมนออกจาก cloudflared ให้หมด
 *   - ปลายทาง origin        อยู่ที่ 127.0.0.1 อยู่แล้ว ไม่ต้องแปลง
 *   - ปลายทาง edge          ส่ง IP ตรง ๆ ผ่าน --edge (CloudflaredProcess.resolveEdgeAddresses)
 *   - API ของ quick tunnel  ชี้มาที่ตัวนี้ผ่าน --quick-service เป็น http ธรรมดาบน loopback
 *
 * ฝั่ง Java แปลงชื่อโดเมนผ่าน InetAddress ซึ่งใช้ตัวแปลของ Android ได้ตามปกติ
 * จึงไม่ติดปัญหาเดียวกัน และเพราะช่วง cloudflared -> ตัวนี้เป็น loopback ล้วน
 * จึงไม่ต้องยุ่งกับใบรับรอง TLS ให้ซับซ้อน ส่วนช่วงตัวนี้ -> Cloudflare ยังเป็น HTTPS เต็มรูปแบบ
 */
final class CloudflareApiRelay {

    private static final String UPSTREAM = "https://api.trycloudflare.com";
    private static final int TIMEOUT_MS = 30_000;

    private final LogBuffer log;

    private ServerSocket serverSocket;
    private Thread acceptThread;
    private volatile boolean running;
    private int port;

    CloudflareApiRelay(LogBuffer log) {
        this.log = log;
    }

    synchronized int start() throws IOException {
        if (running) return port;

        serverSocket = new ServerSocket();
        serverSocket.setReuseAddress(true);
        serverSocket.bind(new InetSocketAddress(InetAddress.getByName("127.0.0.1"), 0), 8);
        port = serverSocket.getLocalPort();
        running = true;

        acceptThread = new Thread(this::acceptLoop, "cf-api-relay");
        acceptThread.setDaemon(true);
        acceptThread.start();

        return port;
    }

    synchronized void stop() {
        if (!running) return;
        running = false;
        try {
            if (serverSocket != null) serverSocket.close();
        } catch (IOException ignored) {
        }
        serverSocket = null;
        acceptThread = null;
    }

    int getPort() {
        return port;
    }

    private void acceptLoop() {
        while (running) {
            try {
                Socket client = serverSocket.accept();
                client.setSoTimeout(TIMEOUT_MS);
                // คำขอมีไม่กี่ครั้งตลอดอายุ tunnel (ตอนขอที่อยู่ใหม่) เธรดต่อคำขอจึงพอ
                Thread worker = new Thread(() -> handle(client), "cf-api-relay-req");
                worker.setDaemon(true);
                worker.start();
            } catch (IOException ex) {
                if (running) log.note("ตัวกลาง API ของ Cloudflare รับงานไม่สำเร็จ: " + ex.getMessage());
            }
        }
    }

    private void handle(Socket client) {
        try (Socket socket = client;
             BufferedInputStream in = new BufferedInputStream(socket.getInputStream());
             OutputStream out = socket.getOutputStream()) {

            String requestLine = readLine(in);
            if (requestLine == null) return;

            String[] parts = requestLine.split(" ");
            if (parts.length < 2) return;

            String method = parts[0].toUpperCase(Locale.US);
            String path = parts[1];

            Map<String, String> headers = new LinkedHashMap<>();
            String line;
            while ((line = readLine(in)) != null && !line.isEmpty()) {
                int colon = line.indexOf(':');
                if (colon <= 0) continue;
                headers.put(line.substring(0, colon).trim().toLowerCase(Locale.US), line.substring(colon + 1).trim());
            }

            byte[] body = readBody(in, headers.get("content-length"));

            forward(method, path, headers, body, out);
        } catch (IOException ex) {
            // ปลายทางตัดสายกลางคัน — cloudflared จะลองใหม่เอง
        }
    }

    private void forward(String method, String path, Map<String, String> headers, byte[] body, OutputStream out)
            throws IOException {
        HttpURLConnection connection = null;

        try {
            connection = (HttpURLConnection) new URL(UPSTREAM + path).openConnection();
            connection.setRequestMethod(method);
            connection.setConnectTimeout(TIMEOUT_MS);
            connection.setReadTimeout(TIMEOUT_MS);
            connection.setInstanceFollowRedirects(false);

            String userAgent = headers.get("user-agent");
            if (userAgent != null) connection.setRequestProperty("User-Agent", userAgent);
            String contentType = headers.get("content-type");
            if (contentType != null) connection.setRequestProperty("Content-Type", contentType);

            if (body != null && body.length > 0) {
                connection.setDoOutput(true);
                connection.setFixedLengthStreamingMode(body.length);
                try (OutputStream upstream = connection.getOutputStream()) {
                    upstream.write(body);
                }
            }

            int status = connection.getResponseCode();
            InputStream source = status >= 400 ? connection.getErrorStream() : connection.getInputStream();
            byte[] payload = source == null ? new byte[0] : readAll(source);

            writeResponse(out, status, connection.getContentType(), payload);
        } catch (IOException ex) {
            log.note("ขอที่อยู่จาก Cloudflare ไม่สำเร็จ: " + ex.getMessage());
            byte[] payload = ("{\"error\":" + org.json.JSONObject.quote(String.valueOf(ex.getMessage())) + "}")
                .getBytes(StandardCharsets.UTF_8);
            writeResponse(out, 502, "application/json", payload);
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private void writeResponse(OutputStream out, int status, String contentType, byte[] payload) throws IOException {
        StringBuilder head = new StringBuilder(160);
        head.append("HTTP/1.1 ").append(status).append(" ").append(status < 400 ? "OK" : "Error").append("\r\n");
        head.append("Content-Type: ").append(contentType == null ? "application/json" : contentType).append("\r\n");
        head.append("Content-Length: ").append(payload.length).append("\r\n");
        head.append("Connection: close\r\n\r\n");

        out.write(head.toString().getBytes(StandardCharsets.ISO_8859_1));
        out.write(payload);
        out.flush();
    }

    private String readLine(InputStream in) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream(128);
        int b;
        while ((b = in.read()) != -1) {
            if (b == '\n') break;
            if (b != '\r') buffer.write(b);
            if (buffer.size() > 16 * 1024) throw new IOException("header ยาวผิดปกติ");
        }
        if (b == -1 && buffer.size() == 0) return null;
        return buffer.toString("UTF-8");
    }

    private byte[] readBody(InputStream in, String contentLength) throws IOException {
        if (contentLength == null) return null;

        int length;
        try {
            length = Integer.parseInt(contentLength.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
        if (length <= 0) return null;

        byte[] body = new byte[length];
        int offset = 0;
        while (offset < length) {
            int read = in.read(body, offset, length - offset);
            if (read == -1) throw new IOException("body ขาดกลางคัน");
            offset += read;
        }
        return body;
    }

    private byte[] readAll(InputStream source) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream(1024);
        byte[] chunk = new byte[8192];
        int read;
        while ((read = source.read(chunk)) != -1) buffer.write(chunk, 0, read);
        return buffer.toByteArray();
    }
}
