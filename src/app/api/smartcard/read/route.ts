import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// อ่านบัตรผ่าน Smart Card Agent โดย proxy ผ่านเซิร์ฟเวอร์ Next
// ช่วยหลีกเลี่ยง CORS / Private Network Access ของบราวเซอร์
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const base = (searchParams.get("url") || "http://127.0.0.1:8182").replace(/\/+$/, "")
  const path = searchParams.get("path") || "/read"
  const timeoutMs = Math.max(1000, Math.min(30000, Number(searchParams.get("timeoutMs") || 15000)))

  try {
    const controller = new AbortController()
    const to = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(`${base}${path}`, {
      signal: controller.signal,
      cache: "no-store",
    })
    clearTimeout(to)
    const text = await res.text()
    // พยายาม parse เป็น JSON ถ้าไม่ได้ ให้ส่งข้อความดิบกลับ
    try {
      const json = JSON.parse(text)
      return NextResponse.json(json, { status: res.status })
    } catch {
      return new NextResponse(text, {
        status: res.status,
        headers: { "Content-Type": res.headers.get("content-type") || "text/plain; charset=utf-8" },
      })
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "ไม่สามารถเชื่อมต่อ Smart Card Agent" },
      { status: 502 }
    )
  }
}
