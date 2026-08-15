import { NextRequest, NextResponse } from "next/server";

import { completeJob, setPrinters } from "@/lib/printQueue";

// Electron agent รายงานผลงานพิมพ์กลับมาที่นี่ และใช้ช่องทางเดียวกันส่งรายชื่อเครื่องพิมพ์
// ล่าสุดขึ้นมาด้วย (ตอบกลับ printers:refresh ที่ส่งไปทาง SSE)
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: any;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  if (Array.isArray(body?.printers)) {
    setPrinters(body.printers);
  }

  const id = String(body?.id || "");

  // เป็นการรายงานรายชื่อเครื่องพิมพ์อย่างเดียว ไม่ได้ผูกกับงานพิมพ์ไหน
  if (!id) {
    return NextResponse.json({ ok: true });
  }

  const matched = completeJob(id, {
    success: Boolean(body?.success),
    error: body?.error ? String(body.error) : undefined,
  });

  // ไม่เจองาน = งานหมดเวลาไปแล้ว ไม่ถือเป็น error ของ agent
  return NextResponse.json({ ok: true, matched });
}
