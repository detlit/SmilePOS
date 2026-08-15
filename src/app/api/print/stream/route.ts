import { NextRequest } from "next/server";

import { addAgent, removeAgent, setPrinters } from "@/lib/printQueue";

// ช่องทางที่ Electron ฝั่งเครื่องเคาน์เตอร์เปิดค้างไว้เพื่อรองานพิมพ์จากแท็บเล็ต
// รูปแบบเดียวกับ /api/sse/stream ที่ใช้กับจอลูกค้าอยู่แล้ว
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // ให้ agent รู้ว่าต่อติดแล้ว และเป็นการ flush header ออกไปทันที
  writer.write(encoder.encode(`data: ${JSON.stringify({ type: "ready" })}\n\n`));

  addAgent(writer);

  // ping กัน proxy/ตัวกลางตัดการเชื่อมต่อที่เงียบนานเกินไป
  const keepAlive = setInterval(() => {
    writer.write(encoder.encode(": keep-alive\n\n")).catch(() => {
      clearInterval(keepAlive);
      removeAgent(writer);
    });
  }, 25000);

  req.signal.addEventListener("abort", () => {
    clearInterval(keepAlive);
    removeAgent(writer);
    setPrinters([]);
    writer.close().catch(() => undefined);
  });

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // ปิด buffering ของ reverse proxy ไม่งั้นงานพิมพ์จะค้างรอจนเต็ม buffer
      "X-Accel-Buffering": "no",
    },
  });
}
