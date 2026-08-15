import { NextResponse } from "next/server";

import { getPrinters, hasAgent, requestPrinterRefresh } from "@/lib/printQueue";

// รายชื่อเครื่องพิมพ์ที่ต่ออยู่กับเครื่องเคาน์เตอร์ ให้แท็บเล็ตเลือกปลายทางได้
export const dynamic = "force-dynamic";

/** ถ้าข้อมูลเก่ากว่านี้ให้ขอ agent อัปเดตใหม่ (เครื่องพิมพ์ไม่ได้เปลี่ยนบ่อย) */
const STALE_AFTER_MS = 60000;

export async function GET() {
  if (!hasAgent()) {
    return NextResponse.json({ printers: [], agentOnline: false });
  }

  const { printers, updatedAt } = getPrinters();

  if (Date.now() - updatedAt > STALE_AFTER_MS) {
    // ขอแบบไม่รอผล — รอบนี้ส่งค่าที่มีไปก่อน รอบหน้าจะได้ของใหม่
    requestPrinterRefresh().catch(() => undefined);
  }

  return NextResponse.json({ printers, agentOnline: true, updatedAt });
}
