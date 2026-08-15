import { NextRequest } from "next/server";
import { addClient, removeClient, getLatestOrder, getLatestSummary } from "@/lib/sse";

export async function GET(req: NextRequest) {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // ส่งข้อมูลล่าสุดให้ client ใหม่
  const latestOrderData = getLatestOrder();
  const latestSummaryData = getLatestSummary();

  if (latestOrderData.length > 0)
    writer.write(`data: ${JSON.stringify({ type: "order", data: latestOrderData })}\n\n`);

  if (latestSummaryData)
    writer.write(`data: ${JSON.stringify({ type: "summary", data: latestSummaryData })}\n\n`);

  addClient(writer);

  req.signal.addEventListener("abort", () => {
    removeClient(writer);
    writer.close();
  });

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
