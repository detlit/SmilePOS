package com.smilepharmacy.pos.tunnel;

import android.content.Context;
import android.content.res.AssetManager;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * HTTP server ตัวจริงที่รันอยู่ในแท็บเล็ต — สิ่งที่ Cloudflare Tunnel ชี้เข้ามาหา
 *
 * ทำไมต้องมี
 * ------------------------------------------------------------------
 * โหมด standalone ไม่มี server อยู่เลย หน้าจอกับ API คุยกันในหน่วยความจำผ่านตัวดัก
 * fetch/axios (src/lib/mobile/api/interceptor.ts) ไม่เคยมีอะไรวิ่งผ่านพอร์ต
 * cloudflared จึงไม่มีปลายทางให้ส่งต่อ ตัวนี้เกิดมาเพื่อเป็นปลายทางนั้น
 *
 * มันเสิร์ฟสองอย่าง
 *   1. ไฟล์ static ชุดเดียวกับที่ WebView ใช้ (assets/public — คือผลลัพธ์ next export)
 *   2. /api/**  ส่งต่อให้ WebViewApiBridge ไปเรียก handler ตัวจริงในเครื่อง
 *
 * ทำไมเขียน HTTP เองแทนที่จะใช้ NanoHTTPD
 * ------------------------------------------------------------------
 * ต้องการแค่ HTTP/1.1 ฝั่ง server แบบพื้นฐานที่คุยกับ cloudflared ตัวเดียวบน loopback
 * การเพิ่ม dependency เข้ามาแลกกับโค้ด ~300 บรรทัดที่ควบคุมได้เองทั้งหมดไม่คุ้ม
 * โดยเฉพาะเรื่องที่ต้องแทรก marker ลงใน HTML และการ map path ของ static export
 * ซึ่งต้องแก้ไส้ในของ library อยู่ดี
 *
 * ความปลอดภัย: ผูกกับ 127.0.0.1 เท่านั้นโดยค่าเริ่มต้น เครื่องอื่นในวง LAN ยิงตรงไม่ได้
 * ทางเข้าเดียวคือผ่าน Cloudflare ซึ่งเจ้าของร้านคุมสิทธิ์ได้จาก Zero Trust Dashboard
 */
final class LocalHttpServer {

    /** โฟลเดอร์ใน assets ที่ cap sync คัดลอก out/ มาไว้ */
    private static final String ASSET_ROOT = "public";

    /** handler บางตัว (รายงานยอดขายทั้งปี) ใช้เวลานาน — ให้เวลามากกว่า default ของ cloudflared เล็กน้อย */
    private static final long API_TIMEOUT_MS = 60_000;

    private static final int READ_TIMEOUT_MS = 30_000;
    private static final int MAX_HEADER_BYTES = 32 * 1024;

    private final Context context;
    private final WebViewApiBridge bridge;
    private final LogBuffer log;

    private ServerSocket serverSocket;
    private ExecutorService workers;
    private Thread acceptThread;
    private volatile boolean running;
    private int boundPort;

    LocalHttpServer(Context context, WebViewApiBridge bridge, LogBuffer log) {
        this.context = context.getApplicationContext();
        this.bridge = bridge;
        this.log = log;
    }

    /**
     * เปิดพอร์ต — ผูกกับ loopback เสมอเว้นแต่สั่ง exposeToLan
     *
     * @param port      พอร์ตที่ต้องการ (0 = ให้ระบบเลือกให้)
     * @param exposeLan true = ผูก 0.0.0.0 ให้เครื่องอื่นในวง LAN เข้าถึงได้ด้วย
     */
    synchronized void start(int port, boolean exposeLan) throws IOException {
        if (running) return;

        InetAddress address = exposeLan ? null : InetAddress.getByName("127.0.0.1");
        serverSocket = new ServerSocket();
        serverSocket.setReuseAddress(true);
        serverSocket.bind(new InetSocketAddress(address, port), 64);
        boundPort = serverSocket.getLocalPort();

        // cloudflared เปิดหลายคำขอพร้อมกัน (หน้าเว็บหนึ่งหน้าดึงไฟล์หลายสิบไฟล์)
        // แต่ทุกคำขอ /api ต้องไปรอ WebView ซึ่งทำงานทีละอย่างอยู่แล้ว จำกัดไว้ไม่ให้เธรดบาน
        workers = new ThreadPoolExecutor(
            2, 16, 30L, TimeUnit.SECONDS,
            new java.util.concurrent.SynchronousQueue<>(),
            new ThreadPoolExecutor.CallerRunsPolicy()
        );

        running = true;
        acceptThread = new Thread(this::acceptLoop, "smilepos-http");
        acceptThread.setDaemon(true);
        acceptThread.start();

        log.note("เปิด HTTP server ที่ " + (exposeLan ? "0.0.0.0" : "127.0.0.1") + ":" + boundPort);
    }

    synchronized void stop() {
        if (!running) return;
        running = false;

        try {
            if (serverSocket != null) serverSocket.close();
        } catch (IOException ignored) {
        }
        if (workers != null) workers.shutdownNow();

        serverSocket = null;
        workers = null;
        acceptThread = null;
        log.note("ปิด HTTP server");
    }

    boolean isRunning() {
        return running;
    }

    int getPort() {
        return boundPort;
    }

    // ------------------------------------------------------------------ วงรับคำขอ

    private void acceptLoop() {
        while (running) {
            try {
                Socket socket = serverSocket.accept();
                socket.setSoTimeout(READ_TIMEOUT_MS);
                socket.setTcpNoDelay(true);
                workers.execute(() -> serveConnection(socket));
            } catch (IOException ex) {
                if (running) log.note("รับการเชื่อมต่อไม่สำเร็จ: " + ex.getMessage());
            } catch (RuntimeException ex) {
                if (running) log.note("เธรดรับงานล้มเหลว: " + ex.getMessage());
            }
        }
    }

    private void serveConnection(Socket socket) {
        try (Socket client = socket;
             BufferedInputStream in = new BufferedInputStream(client.getInputStream());
             BufferedOutputStream out = new BufferedOutputStream(client.getOutputStream())) {

            // keep-alive: cloudflared ใช้ connection ซ้ำ การปิดทุกคำขอทำให้หน้าเว็บโหลดช้าลงมาก
            while (running && handleOne(in, out)) {
                out.flush();
            }
            out.flush();
        } catch (IOException ignored) {
            // ปลายทางตัดสายกลางคัน — เรื่องปกติของ HTTP ไม่ต้องรก log
        }
    }

    /** @return true = คุยต่อบน connection เดิมได้ */
    private boolean handleOne(InputStream in, OutputStream out) throws IOException {
        String requestLine = readLine(in);
        if (requestLine == null || requestLine.isEmpty()) return false;

        String[] parts = requestLine.split(" ");
        if (parts.length < 2) {
            writeResponse(out, 400, textHeaders("text/plain; charset=utf-8"), "Bad Request".getBytes(StandardCharsets.UTF_8), false, "GET");
            return false;
        }

        String method = parts[0].toUpperCase(Locale.US);
        String target = parts[1];
        String version = parts.length > 2 ? parts[2] : "HTTP/1.1";

        Map<String, String> headers = readHeaders(in);
        boolean keepAlive = !"close".equalsIgnoreCase(headers.get("connection"))
            && !"HTTP/1.0".equalsIgnoreCase(version);

        byte[] body = readBody(in, headers);
        if (body == BODY_TOO_LARGE) {
            writeResponse(out, 413, textHeaders("application/json; charset=utf-8"),
                "{\"error\":\"ข้อมูลที่ส่งมาใหญ่เกินไป\"}".getBytes(StandardCharsets.UTF_8), false, method);
            return false;
        }

        String path = target;
        int q = path.indexOf('?');
        if (q >= 0) path = path.substring(0, q);

        if (path.startsWith("/api/")) {
            serveApi(out, method, target, headers, body, keepAlive);
        } else {
            serveStatic(out, method, path, keepAlive);
        }

        return keepAlive;
    }

    // ------------------------------------------------------------------ /api/**

    private void serveApi(OutputStream out, String method, String target, Map<String, String> headers,
                          byte[] body, boolean keepAlive) throws IOException {

        Map<String, String> forward = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : headers.entrySet()) {
            String key = entry.getKey();
            // hop-by-hop และค่าที่เราคำนวณใหม่เอง — ส่งต่อไปแล้วมีแต่ทำให้ผิด
            if (key.equals("connection") || key.equals("keep-alive") || key.equals("transfer-encoding")
                || key.equals("content-length") || key.equals("host") || key.equals("upgrade")) {
                continue;
            }
            forward.put(key, entry.getValue());
        }

        WebViewApiBridge.ApiResponse response = bridge.call(method, target, forward, body, API_TIMEOUT_MS);

        Map<String, String> outHeaders = new LinkedHashMap<>(response.headers);
        outHeaders.put("Cache-Control", "no-store");
        writeResponse(out, response.status, outHeaders, response.body, keepAlive, method);
    }

    // ------------------------------------------------------------------ ไฟล์ static

    private void serveStatic(OutputStream out, String method, String rawPath, boolean keepAlive) throws IOException {
        String decoded;
        try {
            decoded = URLDecoder.decode(rawPath, "UTF-8");
        } catch (Exception ex) {
            decoded = rawPath;
        }

        String assetPath = resolveAsset(decoded);
        if (assetPath == null) {
            byte[] notFound = ("ไม่พบไฟล์ " + decoded).getBytes(StandardCharsets.UTF_8);
            writeResponse(out, 404, textHeaders("text/plain; charset=utf-8"), notFound, keepAlive, method);
            return;
        }

        byte[] content = readAsset(assetPath);
        if (content == null) {
            writeResponse(out, 404, textHeaders("text/plain; charset=utf-8"),
                "ไม่พบไฟล์".getBytes(StandardCharsets.UTF_8), keepAlive, method);
            return;
        }

        String mime = mimeOf(assetPath);
        Map<String, String> headers = textHeaders(mime);

        if (mime.startsWith("text/html")) {
            content = injectRemoteMarker(content);
            // หน้าเว็บต้องไม่ถูก cache ไว้ ไม่งั้นอัปเดตแอปแล้วผู้ใช้ยังเห็นของเก่า
            headers.put("Cache-Control", "no-cache");
        } else if (assetPath.startsWith(ASSET_ROOT + "/_next/static/")) {
            // ชื่อไฟล์มี hash ของเนื้อหาอยู่แล้ว cache ยาวได้ปลอดภัย
            headers.put("Cache-Control", "public, max-age=31536000, immutable");
        }

        headers.put("X-Content-Type-Options", "nosniff");
        writeResponse(out, 200, headers, content, keepAlive, method);
    }

    /**
     * แปลง path ของ URL เป็นชื่อไฟล์ใน assets
     *
     * static export ตั้ง trailingSlash: true ไว้ หน้าเว็บจึงอยู่ในรูป web/setting/index.html
     * ลองตามลำดับความน่าจะเป็น แล้วคืน null ถ้าไม่เจอจริง ๆ
     */
    private String resolveAsset(String path) {
        String clean = path.startsWith("/") ? path.substring(1) : path;

        // กันเดินออกนอกโฟลเดอร์ assets
        if (clean.contains("..")) return null;

        if (clean.isEmpty()) return existing(ASSET_ROOT + "/index.html");

        if (clean.endsWith("/")) {
            return existing(ASSET_ROOT + "/" + clean + "index.html");
        }

        String direct = existing(ASSET_ROOT + "/" + clean);
        if (direct != null) return direct;

        String asDir = existing(ASSET_ROOT + "/" + clean + "/index.html");
        if (asDir != null) return asDir;

        return existing(ASSET_ROOT + "/" + clean + ".html");
    }

    private String existing(String assetPath) {
        AssetManager assets = context.getAssets();
        try (InputStream stream = assets.open(assetPath)) {
            return assetPath;
        } catch (IOException ex) {
            return null;
        }
    }

    private byte[] readAsset(String assetPath) {
        try (InputStream stream = context.getAssets().open(assetPath)) {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream(Math.max(1024, stream.available()));
            byte[] chunk = new byte[16 * 1024];
            int read;
            while ((read = stream.read(chunk)) != -1) {
                buffer.write(chunk, 0, read);
            }
            return buffer.toByteArray();
        } catch (IOException ex) {
            return null;
        }
    }

    /**
     * แทรกธงบอกหน้าเว็บว่า "คุณถูกเสิร์ฟผ่าน tunnel ไม่ได้อยู่ในแท็บเล็ต"
     *
     * สำคัญมาก: bundle ชุดเดียวกันนี้ตอนรันในแท็บเล็ตจะดักทุก fetch ไปเรียก SQLite ในเครื่อง
     * ถ้าเบราว์เซอร์ปลายทางทำแบบเดียวกันจะพังทันทีเพราะไม่มีฐานข้อมูลอยู่ตรงนั้น
     * ธงนี้ทำให้ src/lib/mobile/bootstrap.ts รู้ว่าต้องปล่อยให้คำขอวิ่งออกเน็ตตามปกติ
     */
    private byte[] injectRemoteMarker(byte[] html) {
        String text = new String(html, StandardCharsets.UTF_8);
        String marker = "<script>window.__SMILEPOS_REMOTE__=true;</script>";

        int head = text.toLowerCase(Locale.US).indexOf("<head>");
        String patched = head >= 0
            ? text.substring(0, head + 6) + marker + text.substring(head + 6)
            : marker + text;

        return patched.getBytes(StandardCharsets.UTF_8);
    }

    // ------------------------------------------------------------------ อ่าน/เขียน HTTP

    private static final byte[] BODY_TOO_LARGE = new byte[0];

    private String readLine(InputStream in) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream(128);
        int b;
        while ((b = in.read()) != -1) {
            if (b == '\n') break;
            if (b != '\r') buffer.write(b);
            if (buffer.size() > MAX_HEADER_BYTES) throw new IOException("header ยาวผิดปกติ");
        }
        if (b == -1 && buffer.size() == 0) return null;
        return buffer.toString("UTF-8");
    }

    private Map<String, String> readHeaders(InputStream in) throws IOException {
        Map<String, String> headers = new LinkedHashMap<>();
        String line;
        while ((line = readLine(in)) != null && !line.isEmpty()) {
            int colon = line.indexOf(':');
            if (colon <= 0) continue;
            String name = line.substring(0, colon).trim().toLowerCase(Locale.US);
            String value = line.substring(colon + 1).trim();
            // header ซ้ำชื่อ (เช่น Cookie หลายบรรทัด) ต่อด้วย ", " ตาม RFC 9110
            String previous = headers.get(name);
            headers.put(name, previous == null ? value : previous + ", " + value);
        }
        return headers;
    }

    private byte[] readBody(InputStream in, Map<String, String> headers) throws IOException {
        String encoding = headers.get("transfer-encoding");
        if (encoding != null && encoding.toLowerCase(Locale.US).contains("chunked")) {
            return readChunked(in);
        }

        String lengthHeader = headers.get("content-length");
        if (lengthHeader == null) return null;

        int length;
        try {
            length = Integer.parseInt(lengthHeader.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
        if (length <= 0) return null;
        if (length > WebViewApiBridge.MAX_BODY_BYTES) return BODY_TOO_LARGE;

        byte[] body = new byte[length];
        int offset = 0;
        while (offset < length) {
            int read = in.read(body, offset, length - offset);
            if (read == -1) throw new IOException("body ขาดกลางคัน");
            offset += read;
        }
        return body;
    }

    private byte[] readChunked(InputStream in) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();

        while (true) {
            String sizeLine = readLine(in);
            if (sizeLine == null) throw new IOException("chunk ขาดกลางคัน");

            int semicolon = sizeLine.indexOf(';'); // chunk extension — ไม่ได้ใช้
            if (semicolon >= 0) sizeLine = sizeLine.substring(0, semicolon);

            int size;
            try {
                size = Integer.parseInt(sizeLine.trim(), 16);
            } catch (NumberFormatException ex) {
                throw new IOException("ขนาด chunk ไม่ถูกต้อง: " + sizeLine);
            }

            if (size == 0) {
                while (true) { // trailer headers จนถึงบรรทัดว่าง
                    String trailer = readLine(in);
                    if (trailer == null || trailer.isEmpty()) break;
                }
                break;
            }

            if (buffer.size() + size > WebViewApiBridge.MAX_BODY_BYTES) return BODY_TOO_LARGE;

            byte[] chunk = new byte[size];
            int offset = 0;
            while (offset < size) {
                int read = in.read(chunk, offset, size - offset);
                if (read == -1) throw new IOException("chunk ขาดกลางคัน");
                offset += read;
            }
            buffer.write(chunk);
            readLine(in); // CRLF ปิดท้าย chunk
        }

        return buffer.size() == 0 ? null : buffer.toByteArray();
    }

    private void writeResponse(OutputStream out, int status, Map<String, String> headers, byte[] body,
                               boolean keepAlive, String method) throws IOException {
        byte[] payload = body == null ? new byte[0] : body;
        boolean headOnly = "HEAD".equals(method);

        StringBuilder head = new StringBuilder(256);
        head.append("HTTP/1.1 ").append(status).append(' ').append(reason(status)).append("\r\n");

        List<String> setCookies = new ArrayList<>();
        for (Map.Entry<String, String> entry : headers.entrySet()) {
            if ("set-cookie".equalsIgnoreCase(entry.getKey())) {
                setCookies.add(entry.getValue());
                continue;
            }
            head.append(entry.getKey()).append(": ").append(entry.getValue()).append("\r\n");
        }
        for (String cookie : setCookies) {
            head.append("Set-Cookie: ").append(cookie).append("\r\n");
        }

        head.append("Content-Length: ").append(payload.length).append("\r\n");
        head.append("Connection: ").append(keepAlive ? "keep-alive" : "close").append("\r\n");
        head.append("\r\n");

        out.write(head.toString().getBytes(StandardCharsets.ISO_8859_1));
        if (!headOnly && payload.length > 0) out.write(payload);
        out.flush();
    }

    private Map<String, String> textHeaders(String contentType) {
        Map<String, String> headers = new LinkedHashMap<>();
        headers.put("Content-Type", contentType);
        return headers;
    }

    private static String reason(int status) {
        switch (status) {
            case 200: return "OK";
            case 201: return "Created";
            case 204: return "No Content";
            case 304: return "Not Modified";
            case 400: return "Bad Request";
            case 401: return "Unauthorized";
            case 403: return "Forbidden";
            case 404: return "Not Found";
            case 405: return "Method Not Allowed";
            case 413: return "Payload Too Large";
            case 500: return "Internal Server Error";
            case 501: return "Not Implemented";
            case 503: return "Service Unavailable";
            case 504: return "Gateway Timeout";
            default: return status < 400 ? "OK" : "Error";
        }
    }

    private static String mimeOf(String path) {
        String lower = path.toLowerCase(Locale.US);
        if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html; charset=utf-8";
        if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "text/javascript; charset=utf-8";
        if (lower.endsWith(".css")) return "text/css; charset=utf-8";
        if (lower.endsWith(".json")) return "application/json; charset=utf-8";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".ico")) return "image/x-icon";
        if (lower.endsWith(".woff2")) return "font/woff2";
        if (lower.endsWith(".woff")) return "font/woff";
        if (lower.endsWith(".ttf")) return "font/ttf";
        if (lower.endsWith(".wasm")) return "application/wasm";
        if (lower.endsWith(".txt")) return "text/plain; charset=utf-8";
        if (lower.endsWith(".map")) return "application/json; charset=utf-8";
        if (lower.endsWith(".pdf")) return "application/pdf";
        return "application/octet-stream";
    }
}
