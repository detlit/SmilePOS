// /api/system/tunnel เวอร์ชันที่รันในแท็บเล็ต
//
// ตัวจริงที่ src/app/api/system/tunnel/route.ts สั่ง PowerShell ไปคุม container ของ Podman
// บนเครื่องคอมพิวเตอร์ ซึ่งบนแท็บเล็ตทำไม่ได้เลยสักทาง (ไม่มี PowerShell ไม่มี Podman)
// next.config.ts จึงสลับมาใช้ไฟล์นี้แทนตอน build โหมด mobile — ดูบล็อก
// NormalModuleReplacementPlugin ที่นั่น
//
// สัญญาของ API เหมือนกันทุกฟิลด์ หน้าตั้งค่าจึงใช้โค้ดอ่านสถานะชุดเดิมได้
// ต่างกันแค่ค่าในฟิลด์ mode ("android" แทน "podman") ที่บอก UI ว่าควรแสดงคำอธิบายชุดไหน

import { NextRequest, NextResponse } from "../next-server-shim"
import {
  forgetTunnelToken,
  getTunnelLogs,
  getTunnelStatus,
  isTunnelPluginAvailable,
  startTunnel,
  stopTunnel,
  type TunnelMode,
} from "../../native/tunnel"

export const dynamic = "force-dynamic"

const UNSUPPORTED = {
  available: false,
  installed: false,
  running: false,
  status: "not-installed",
  hostname: "",
  hasToken: false,
  mode: "android",
  error:
    "เวอร์ชันของแอปนี้ยังไม่มีส่วนขยาย tunnel — ต้องติดตั้ง .apk ที่ build หลังรัน npm run fetch:cloudflared",
}

export async function GET(req: NextRequest) {
  if (!isTunnelPluginAvailable()) return NextResponse.json(UNSUPPORTED)

  const url = new URL(req.url)
  const action = url.searchParams.get("action") || "status"

  try {
    if (action === "logs") {
      const logs = await getTunnelLogs()
      return NextResponse.json({ available: true, log: logs?.log || "", hostname: logs?.hostname || "" })
    }

    const status = await getTunnelStatus()
    return NextResponse.json(status ?? UNSUPPORTED)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ...UNSUPPORTED, error: message })
  }
}

export async function POST(req: NextRequest) {
  if (!isTunnelPluginAvailable()) {
    return NextResponse.json({ error: UNSUPPORTED.error }, { status: 501 })
  }

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>))
    const action = String(body.action || "")
    const token = typeof body.token === "string" ? body.token.trim() : undefined

    if (!["start", "stop", "restart", "forget"].includes(action)) {
      return NextResponse.json(
        { error: "คำสั่งไม่ถูกต้อง (action ต้องเป็น start/stop/restart/forget)" },
        { status: 400 }
      )
    }

    if (token && !/^[A-Za-z0-9+/=_\-.]+$/.test(token)) {
      return NextResponse.json(
        {
          error:
            "รูปแบบ token ไม่ถูกต้อง กรุณาวางเฉพาะ Tunnel token (สตริงที่ขึ้นต้นด้วย eyJ) ไม่ต้องมีช่องว่างหรือคำสั่ง cloudflared",
        },
        { status: 400 }
      )
    }

    if (action === "forget") {
      const status = await forgetTunnelToken()
      return NextResponse.json({ ok: true, action, ...status })
    }

    if (action === "stop") {
      const status = await stopTunnel()
      return NextResponse.json({ ok: true, action, ...status })
    }

    // โหมดที่ผู้ใช้เลือก: มี token = tunnel ถาวรของร้าน, ไม่มี = ลิงก์ชั่วคราว trycloudflare.com
    // ถ้า UI ไม่ได้ส่ง mode มา ให้เดาจากการมี token เพื่อให้ปุ่มเดิมยังทำงานเหมือนฝั่งพีซี
    const requested = typeof body.mode === "string" ? (body.mode as TunnelMode) : undefined
    const mode: TunnelMode = requested === "quick" || requested === "token"
      ? requested
      : token
        ? "token"
        : "quick"

    if (action === "restart") {
      await stopTunnel().catch(() => undefined)
    }

    const status = await startTunnel({
      mode,
      token,
      port: typeof body.port === "number" ? body.port : undefined,
      exposeLan: typeof body.exposeLan === "boolean" ? body.exposeLan : undefined,
    })

    return NextResponse.json({ ok: true, action, ...status })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
