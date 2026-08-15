import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import fs from "fs"
import { INSTALL_LOGS, INSTALL_SCRIPTS } from "@/lib/installPaths"

export const dynamic = "force-dynamic"

const UPDATE_SCRIPT = `${INSTALL_SCRIPTS}\\update.ps1`
const LOG_FILE = `${INSTALL_LOGS}\\update.log`
const BRIDGE_URL = process.env.BRIDGE_URL || ""
const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || ""

function detectUpdateState(log: string) {
  const marker = "=== Auto-update to tag:"
  const latestBlockStart = log.lastIndexOf(marker)
  const latestLog = latestBlockStart >= 0 ? log.slice(latestBlockStart) : log

  if (latestLog.includes("[OK] Update complete")) return "done"
  if (
    latestLog.includes("[ERR]") ||
    latestLog.includes("update incomplete") ||
    latestLog.includes("Schema sync failed")
  ) {
    return "failed"
  }
  return "running"
}

async function callBridge(
  p: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; body: any }> {
  try {
    const r = await fetch(`${BRIDGE_URL}${p}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BRIDGE_TOKEN}`,
        ...(init?.headers || {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(60000),
    })
    const text = await r.text()
    let parsed: any = {}
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = { raw: text }
    }
    return { ok: r.ok, status: r.status, body: parsed }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, status: 0, body: { error: `bridge unreachable: ${msg}` } }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const tag = typeof body.tag === "string" ? body.tag : "latest"

    // Security: only allow safe tag characters
    if (!/^[a-zA-Z0-9._-]+$/.test(tag)) {
      return NextResponse.json({ error: "Invalid tag format" }, { status: 400 })
    }

    // Preferred path: call host-bridge. The Next.js API runs inside a Linux
    // container so it cannot spawn powershell.exe directly — the bridge
    // (host-bridge.ps1) running on the Windows host invokes update.ps1 for us.
    if (BRIDGE_URL && BRIDGE_TOKEN) {
      const { ok, body: resp } = await callBridge("/update/start", {
        method: "POST",
        body: JSON.stringify({ tag }),
      })
      if (!ok) {
        return NextResponse.json(
          { error: resp?.error || "bridge error", ...resp },
          { status: 500 }
        )
      }
      return NextResponse.json({
        started: true,
        tag,
        message: "กำลังอัพเดทบน Windows host กรุณารอ 2-5 นาที ระบบจะ reconnect และโหลดหน้าใหม่เอง",
        logFile: LOG_FILE,
        via: "bridge",
      })
    }

    // Fallback: spawn powershell directly. Only works when the Next.js
    // process is running natively on the Windows host (e.g. dev mode).
    if (!fs.existsSync(UPDATE_SCRIPT)) {
      return NextResponse.json(
        {
          error:
            "Update script not found. This feature requires the native installer (host-bridge not configured).",
        },
        { status: 500 }
      )
    }

    const child = spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-WindowStyle",
        "Hidden",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        UPDATE_SCRIPT,
        "-Tag",
        tag,
      ],
      { detached: true, stdio: "ignore", windowsHide: true }
    )
    child.unref()

    return NextResponse.json({
      started: true,
      tag,
      message: "กำลังอัพเดทบน Windows host กรุณารอ 2-5 นาที ระบบจะ reconnect และโหลดหน้าใหม่เอง",
      logFile: LOG_FILE,
      via: "direct",
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 })
  }
}

export async function GET() {
  // Return recent update log tail (for status polling)
  try {
    if (BRIDGE_URL && BRIDGE_TOKEN) {
      const { ok, body: resp } = await callBridge("/update/log")
      if (!ok) {
        return NextResponse.json({
          log: "",
          exists: false,
          error: resp?.error || "bridge error",
        })
      }
      const log = resp?.log ?? ""
      return NextResponse.json({
        log,
        exists: !!resp?.exists,
        via: "bridge",
        state: detectUpdateState(log),
      })
    }

    if (!fs.existsSync(LOG_FILE)) {
      return NextResponse.json({ log: "", exists: false })
    }
    const data = fs.readFileSync(LOG_FILE, "utf-8")
    const lines = data.split(/\r?\n/)
    const tail = lines.slice(-120).join("\n")
    return NextResponse.json({ log: tail, exists: true, via: "direct", state: detectUpdateState(tail) })
  } catch (e: any) {
    return NextResponse.json({ log: "", exists: false, error: e.message, state: "running" })
  }
}
