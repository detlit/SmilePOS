import { NextRequest, NextResponse } from "next/server";

import { hasAgent, submitJob } from "@/lib/printQueue";

// แท็บเล็ตส่งงานพิมพ์เข้ามาที่นี่ แล้วรอจนเครื่องเคาน์เตอร์พิมพ์เสร็จจริงถึงจะตอบกลับ
// ตั้งใจให้รอผลจริง ไม่ใช่ตอบ 202 ทิ้งไว้ เพราะหน้าขายต้องรู้ว่าใบเสร็จออกหรือไม่
// ก่อนจะบอกพนักงานว่า "ส่งพิมพ์เรียบร้อย"
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: any;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const content = String(body?.content || "");

  if (!content.trim()) {
    return NextResponse.json({ success: false, error: "ไม่มีเนื้อหาสำหรับพิมพ์" }, { status: 400 });
  }

  if (!hasAgent()) {
    // 503 = ตัวระบบพร้อม แต่ปลายทางที่ต่อเครื่องพิมพ์ยังไม่ออนไลน์
    // ฝั่งแอปใช้สถานะนี้เพื่อเสนอให้เปลี่ยนไปพิมพ์ทาง Bluetooth แทน
    return NextResponse.json(
      {
        success: false,
        error:
          "ไม่พบเครื่องพิมพ์ที่เคาน์เตอร์ — ตรวจว่าเปิดโปรแกรมบนเครื่อง Server ในโหมด Server แล้ว",
      },
      { status: 503 },
    );
  }

  try {
    const result = await submitJob({
      content,
      printerName: String(body?.printerName || "").trim(),
      horizontalOffset: Number(body?.horizontalOffset || 0),
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "พิมพ์ไม่สำเร็จ" },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "ส่งงานพิมพ์ไม่สำเร็จ" },
      { status: 502 },
    );
  }
}
