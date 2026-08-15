import { NextRequest, NextResponse } from "next/server"
import { spawnSync } from "child_process"
import fs from "fs"
import { INSTALL_SCRIPTS } from "@/lib/installPaths"

export const dynamic = "force-dynamic"

const SCRIPT = `${INSTALL_SCRIPTS}\\tunnel-manage.ps1`
const BRIDGE_URL = process.env.BRIDGE_URL || ""
const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || ""

// Auto-reconnect: ensure tunnel container is running if a token was previously saved.
// This is best-effort and runs at most once per process boot, so users do not have
// to manually click "เชื่อมต่อ" again after a PC reset/restart.
let autoStartAttempted = false
let autoStartInFlight: Promise<void> | null = null

async function ensureTunnelRunning(currentStatus: any): Promise<void> {
  if (autoStartAttempted) return
  if (!currentStatus) return
  if (currentStatus.available === false) return
  if (currentStatus.running) {
    autoStartAttempted = true
    return
  }
  if (!currentStatus.hasToken) return // nothing saved -> nothing to auto-start

  if (autoStartInFlight) return
  autoStartAttempted = true

  autoStartInFlight = (async () => {
    try {
      if (BRIDGE_URL && BRIDGE_TOKEN) {
        await callBridge("/tunnel/action", {
          method: "POST",
          body: JSON.stringify({ action: "start" }),
        })
      } else {
        runScriptSync(["-Action", "start"]) // script reuses saved token file
      }
    } catch {
      // ignore – next manual click can still recover
    } finally {
      autoStartInFlight = null
    }
  })()
}

async function callBridge(path: string, init?: RequestInit): Promise<{ ok: boolean; body: any }> {
  try {
    const r = await fetch(`${BRIDGE_URL}${path}`, {
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
    try { parsed = JSON.parse(text) } catch { parsed = { raw: text } }
    return { ok: r.ok, body: parsed }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, body: { error: `bridge unreachable: ${msg}` } }
  }
}

function runScriptSync(args: string[]): { ok: boolean; stdout: string; stderr: string } {
  if (!fs.existsSync(SCRIPT)) {
    return {
      ok: false,
      stdout: "",
      stderr: "Tunnel control unavailable in this runtime (requires SmileStore POS native installer or host bridge configuration)",
    }
  }
  const res = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", SCRIPT, ...args],
    { encoding: "utf-8", windowsHide: true, timeout: 30000 }
  )
  return {
    ok: res.status === 0,
    stdout: (res.stdout || "").toString(),
    stderr: (res.stderr || "").toString(),
  }
}

// GET: status (default) | ?action=logs returns last container log lines + hostname
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const action = url.searchParams.get("action") || "status"

  if (action === "logs") {
    if (BRIDGE_URL && BRIDGE_TOKEN) {
      const { ok, body } = await callBridge("/tunnel/logs")
      if (!ok) return NextResponse.json({ available: false, ...body })
      const inner = body?.data ?? body
      return NextResponse.json({ available: true, ...inner })
    }
    const r = runScriptSync(["-Action", "logs", "-LogLines", "120"])
    if (!r.ok) {
      return NextResponse.json({ error: r.stderr || "Script failed", available: false })
    }
    try {
      const json = JSON.parse(r.stdout.trim())
      return NextResponse.json({ available: true, ...json })
    } catch {
      return NextResponse.json({ available: true, log: r.stdout, hostname: "" })
    }
  }

  if (BRIDGE_URL && BRIDGE_TOKEN) {
    const { ok, body } = await callBridge("/tunnel/status")
    if (!ok) return NextResponse.json({ available: false, ...body })
    const inner = body?.data ?? body
    const merged = { available: true, ...inner }
    void ensureTunnelRunning(merged)
    return NextResponse.json(merged)
  }
  const r = runScriptSync(["-Action", "status"])
  if (!r.ok) {
    return NextResponse.json({ error: r.stderr || "Script failed", available: false })
  }
  try {
    const json = JSON.parse(r.stdout.trim())
    const merged = { available: true, ...json }
    void ensureTunnelRunning(merged)
    return NextResponse.json(merged)
  } catch {
    return NextResponse.json({ available: false, raw: r.stdout, error: "Parse failed" })
  }
}

// POST: { action: "start" | "stop" | "restart", token?: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const action = body.action as string
    // Trim whitespace/newlines that often ride along when a token is pasted, so a
    // clean token does not get rejected with a 400 over a trailing space/newline.
    const token = (body.token as string | undefined)?.trim() || undefined

    if (!["start", "stop", "restart"].includes(action)) {
      return NextResponse.json({ error: "คำสั่งไม่ถูกต้อง (action ต้องเป็น start/stop/restart)" }, { status: 400 })
    }

    // Validate token format (base64-like, safe chars only)
    if (token && !/^[A-Za-z0-9+/=_\-.]+$/.test(token)) {
      return NextResponse.json(
        { error: "รูปแบบ token ไม่ถูกต้อง กรุณาวางเฉพาะ Tunnel token (สตริงที่ขึ้นต้นด้วย eyJ) ไม่ต้องมีช่องว่างหรือคำสั่ง cloudflared" },
        { status: 400 }
      )
    }

    if (BRIDGE_URL && BRIDGE_TOKEN) {
      const { ok, body: resp } = await callBridge("/tunnel/action", {
        method: "POST",
        body: JSON.stringify({ action, token }),
      })
      if (!ok) {
        return NextResponse.json({ error: resp?.error || "bridge error", ...resp }, { status: 500 })
      }
      return NextResponse.json({ ok: true, action, ...resp })
    }

    const args = ["-Action", action]
    if (token) args.push("-Token", token)

    const r = runScriptSync(args)
    if (!r.ok) {
      return NextResponse.json(
        { error: r.stderr || "Script failed", output: r.stdout },
        { status: 500 }
      )
    }
    return NextResponse.json({ ok: true, action, output: r.stdout.trim() })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
