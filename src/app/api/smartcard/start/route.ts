import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"
import { installPath } from "@/lib/installPaths"

export const dynamic = "force-dynamic"

// Resolve start.bat location. Try common paths so it works in dev, docker-less
// Windows install, and native installer layout.
function resolveStartBat(): string | null {
  const candidates = [
    path.join(process.cwd(), "smartcard-agent", "start.bat"),
    path.join(process.cwd(), "..", "smartcard-agent", "start.bat"),
    installPath("smartcard-agent", "start.bat"),
    // ที่ติดตั้งเดิมก่อนเปลี่ยนชื่อโฟลเดอร์ — เก็บไว้ให้เครื่องที่ยังไม่ได้ย้ายใช้ได้อยู่
    "C:\\SmilePharmacy\\smartcard-agent\\start.bat",
    "C:\\smartcard-agent\\start.bat",
  ]
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p
    } catch { /* ignore */ }
  }
  return null
}

export async function POST(_req: NextRequest) {
  try {
    if (process.platform !== "win32") {
      return NextResponse.json(
        { started: false, error: "รองรับเฉพาะระบบปฏิบัติการ Windows" },
        { status: 400 }
      )
    }

    const bat = resolveStartBat()
    if (!bat) {
      return NextResponse.json(
        {
          started: false,
          error: "ไม่พบไฟล์ smartcard-agent\\start.bat กรุณาตรวจสอบว่าติดตั้งโปรแกรม Smart Card Agent แล้ว",
        },
        { status: 404 }
      )
    }

    const cwd = path.dirname(bat)

    // ใช้ shell:true เพื่อให้ cmd.exe ตีความ start ได้ถูกต้อง
    // empty "" = window title (จำเป็นเมื่อ path มี space), จากนั้นใช้ path เต็มแบบครอบด้วย quote
    const child = spawn(
      `start "" /D "${cwd}" "${bat}"`,
      { shell: true, detached: true, stdio: "ignore", windowsHide: false }
    )
    child.unref()

    return NextResponse.json({
      started: true,
      path: bat,
      message: "เริ่มโปรแกรม Smart Card Agent เรียบร้อย",
    })
  } catch (e: any) {
    return NextResponse.json(
      { started: false, error: e?.message || "Internal error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  const bat = resolveStartBat()
  return NextResponse.json({ available: !!bat, path: bat })
}
