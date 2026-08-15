package com.smilepharmacy.pos.tunnel;

import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.webkit.WebView;

import org.json.JSONObject;

import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

/**
 * สะพานส่งคำขอ HTTP จาก LocalHttpServer เข้าไปให้ route handler ที่รันอยู่ใน WebView
 *
 * ทำไมต้องเด้งเข้า WebView ไม่ทำใน Java ให้จบ
 * ------------------------------------------------------------------
 * โหมด standalone ยก API ทั้ง 299 เส้นทางไปไว้ใน JS (src/lib/mobile/api/router.ts)
 * และชั้นข้อมูลทั้งหมด — prismaLite, queryBuilder, ตัวแปล SQL — ก็เป็น JS เช่นกัน
 * ถ้าจะให้ Java ตอบ /api/** เองต้องเขียนระบบทั้งหมดใหม่เป็นภาษา Java ซึ่งไม่มีทางคุ้ม
 * และจะกลายเป็นโค้ดสองชุดที่ต้องดูแลให้ตรงกันตลอดไป
 *
 * สะพานนี้จึงทำหน้าที่แค่ "ยกคำขอข้ามภาษา" แล้วรอคำตอบกลับ — logic ทุกบรรทัดยังอยู่ที่เดิม
 * ผลคือหน้าเว็บที่เปิดผ่าน tunnel ได้ข้อมูลชุดเดียวกับที่หน้าจอในแท็บเล็ตเห็น เป๊ะ ๆ
 *
 * การจับคู่คำขอ-คำตอบ
 * ------------------------------------------------------------------
 * evaluateJavascript() เป็น fire-and-forget และต้องเรียกจากเธรดหลักเท่านั้น
 * ส่วน HTTP server อยู่คนละเธรดและต้องบล็อกรอคำตอบ จึงใช้รหัสอ้างอิงต่อคำขอ
 * แล้วให้ฝั่ง JS ยิงคำตอบกลับผ่านปลั๊กอิน (TunnelPlugin.respondApi) พร้อมรหัสเดิม
 */
final class WebViewApiBridge {

    /** ชื่อฟังก์ชันฝั่ง JS ที่ src/lib/mobile/api/remote-serve.ts ติดตั้งไว้บน window */
    private static final String JS_ENTRY = "window.__smileposServeApi";

    /** ใหญ่กว่านี้ไม่ให้ผ่าน — กัน request ก้อนโตทำ WebView ค้างตอน base64 */
    static final int MAX_BODY_BYTES = 8 * 1024 * 1024;

    private final Handler main = new Handler(Looper.getMainLooper());
    private final AtomicLong sequence = new AtomicLong(0);
    private final ConcurrentHashMap<String, ArrayBlockingQueue<ApiResponse>> pending = new ConcurrentHashMap<>();

    private volatile WebView webView;
    private volatile boolean handlerReady;

    static final class ApiResponse {
        final int status;
        final Map<String, String> headers;
        final byte[] body;

        ApiResponse(int status, Map<String, String> headers, byte[] body) {
            this.status = status;
            this.headers = headers;
            this.body = body;
        }

        static ApiResponse error(int status, String messageThai) {
            Map<String, String> headers = new LinkedHashMap<>();
            headers.put("Content-Type", "application/json; charset=utf-8");
            String json = "{\"error\":" + JSONObject.quote(messageThai) + "}";
            return new ApiResponse(status, headers, json.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        }
    }

    void attach(WebView view) {
        this.webView = view;
    }

    /**
     * WebView หายไปตอน Activity ถูกทำลาย — ต้องปลดทิ้งไม่งั้นถือ reference ค้างจนรั่ว
     * และคำขอที่เข้ามาหลังจากนี้ควรได้ 503 ทันทีแทนที่จะรอจนหมดเวลา
     */
    void detach() {
        this.webView = null;
        this.handlerReady = false;
        failAllPending();
    }

    /** JS เรียกผ่านปลั๊กอินเมื่อ router ในเครื่องพร้อมรับงานแล้ว */
    void setHandlerReady(boolean ready) {
        this.handlerReady = ready;
    }

    boolean isReady() {
        return handlerReady && webView != null;
    }

    /**
     * ส่งคำขอเข้า WebView แล้วบล็อกรอคำตอบ
     *
     * เรียกจากเธรดของ HTTP server เท่านั้น (ห้ามเรียกจากเธรดหลัก — จะ deadlock ตัวเอง
     * เพราะคนที่ต้องรัน JS ให้คือเธรดหลักนั่นแหละ)
     */
    ApiResponse call(String method, String url, Map<String, String> headers, byte[] body, long timeoutMs) {
        WebView view = this.webView;

        if (view == null || !handlerReady) {
            return ApiResponse.error(503, "แอปในแท็บเล็ตยังไม่พร้อมให้บริการ — เปิดแอป Smile POS ค้างไว้แล้วลองใหม่");
        }
        if (body != null && body.length > MAX_BODY_BYTES) {
            return ApiResponse.error(413, "ข้อมูลที่ส่งมาใหญ่เกินกว่าที่แท็บเล็ตรับไหว");
        }

        String id = "r" + sequence.incrementAndGet();
        ArrayBlockingQueue<ApiResponse> slot = new ArrayBlockingQueue<>(1);
        pending.put(id, slot);

        try {
            String payload = buildPayload(id, method, url, headers, body);
            // JSONObject.quote() ห่อให้เป็น string literal ของ JS ที่ escape ครบ
            // ฝั่ง JS จึงรับเป็นข้อความก้อนเดียวแล้ว JSON.parse เอง ปลอดภัยกว่าการ
            // ต่อ JS object ตรง ๆ ซึ่งอักขระพิเศษในข้อมูลไทยทำให้ syntax พังได้
            final String js = JS_ENTRY + "(" + JSONObject.quote(payload) + ")";

            main.post(() -> {
                WebView current = this.webView;
                if (current == null) {
                    deliver(id, ApiResponse.error(503, "หน้าจอแอปถูกปิดไปแล้ว"));
                    return;
                }
                try {
                    current.evaluateJavascript(js, null);
                } catch (Exception ex) {
                    deliver(id, ApiResponse.error(500, "ส่งคำขอเข้าแอปไม่สำเร็จ: " + ex.getMessage()));
                }
            });

            ApiResponse response = slot.poll(timeoutMs, TimeUnit.MILLISECONDS);
            if (response == null) {
                return ApiResponse.error(504, "แท็บเล็ตตอบกลับช้าเกินไป (เกิน " + (timeoutMs / 1000) + " วินาที)");
            }
            return response;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return ApiResponse.error(503, "คำขอถูกยกเลิก");
        } catch (Exception ex) {
            return ApiResponse.error(500, "เตรียมคำขอไม่สำเร็จ: " + ex.getMessage());
        } finally {
            pending.remove(id);
        }
    }

    /** ฝั่ง JS ตอบกลับมาแล้ว — ปลุกเธรดที่รออยู่ */
    void deliver(String id, ApiResponse response) {
        ArrayBlockingQueue<ApiResponse> slot = pending.get(id);
        if (slot == null) return; // หมดเวลาไปแล้ว หรือส่งซ้ำ — ทิ้งไปเงียบ ๆ
        slot.offer(response);
    }

    private void failAllPending() {
        for (Iterator<Map.Entry<String, ArrayBlockingQueue<ApiResponse>>> it = pending.entrySet().iterator(); it.hasNext(); ) {
            it.next().getValue().offer(ApiResponse.error(503, "แอปถูกปิดระหว่างประมวลผลคำขอ"));
            it.remove();
        }
    }

    private String buildPayload(String id, String method, String url, Map<String, String> headers, byte[] body)
            throws Exception {
        JSONObject headerJson = new JSONObject();
        if (headers != null) {
            for (Map.Entry<String, String> entry : headers.entrySet()) {
                headerJson.put(entry.getKey(), entry.getValue());
            }
        }

        JSONObject payload = new JSONObject();
        payload.put("id", id);
        payload.put("method", method);
        payload.put("url", url);
        payload.put("headers", headerJson);
        payload.put("body", body == null || body.length == 0
            ? JSONObject.NULL
            : Base64.encodeToString(body, Base64.NO_WRAP));

        return payload.toString();
    }
}
