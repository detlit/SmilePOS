package com.smilepharmacy.pos.tunnel;

import java.text.SimpleDateFormat;
import java.util.ArrayDeque;
import java.util.Date;
import java.util.Locale;

/**
 * บันทึกเหตุการณ์ของ tunnel แบบวงแหวน — เก็บล่าสุดไว้จำนวนจำกัดแล้วทิ้งของเก่า
 *
 * ทำไมต้องเก็บเองแทนที่จะพึ่ง logcat
 * ------------------------------------------------------------------
 * หน้าตั้งค่าในแอปต้องแสดง log ให้เจ้าของร้านดูได้เองตอนต่อไม่ติด (เหมือนที่ฝั่งพีซี
 * เรียก `podman logs`) แต่แท็บเล็ตในร้านไม่มีทางเปิด logcat ได้ จึงต้องมีบัฟเฟอร์
 * ที่ JS อ่านผ่านปลั๊กอินได้โดยตรง
 *
 * ทุกเมธอด synchronized เพราะมีคนเขียนพร้อมกันสามทาง: เธรดอ่าน stdout ของ cloudflared,
 * เธรดของ HTTP server และเธรดหลักตอนกดปุ่ม
 */
final class LogBuffer {

    private static final int MAX_LINES = 400;
    private static final SimpleDateFormat STAMP = new SimpleDateFormat("HH:mm:ss", Locale.US);

    private final ArrayDeque<String> lines = new ArrayDeque<>(MAX_LINES);

    synchronized void add(String line) {
        if (line == null) return;

        String trimmed = line.trim();
        if (trimmed.isEmpty()) return;

        if (lines.size() >= MAX_LINES) lines.removeFirst();
        lines.addLast(trimmed);
    }

    /** บรรทัดที่ระบบเราสร้างเอง (ไม่ใช่ของ cloudflared) — ใส่เวลานำหน้าให้อ่านลำดับได้ */
    synchronized void note(String message) {
        add("[" + STAMP.format(new Date()) + "] " + message);
    }

    synchronized String snapshot() {
        StringBuilder sb = new StringBuilder();
        for (String line : lines) {
            sb.append(line).append('\n');
        }
        return sb.toString().trim();
    }

    synchronized void clear() {
        lines.clear();
    }
}
