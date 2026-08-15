import { NextRequest, NextResponse } from "next/server"
import { spawnSync } from "child_process"
import { existsSync } from "fs"
import { INSTALL_SCRIPTS } from "@/lib/installPaths"

export const dynamic = "force-dynamic"

const SCRIPT = `${INSTALL_SCRIPTS}\\onedrive-sync.ps1`
const BRIDGE_URL = process.env.BRIDGE_URL || ""
const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || ""

type ScriptResult = Record<string, unknown> & { error?: string; raw?: string }

async function callBridge(path: string, init?: RequestInit): Promise<ScriptResult> {
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
    let data: ScriptResult & { data?: unknown } = {}
    try { data = JSON.parse(text) } catch { data = { raw: text } }
    if (data && typeof data === "object" && "data" in data && data.data) {
      return data.data as ScriptResult
    }
    return data
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { error: `bridge unreachable: ${msg}` }
  }
}

function runScriptLocal(args: string[]): ScriptResult {
  if (!existsSync(SCRIPT)) {
    return { error: "onedrive-sync.ps1 not installed" }
  }
  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", SCRIPT, ...args],
    { encoding: "utf8", timeout: 60000 }
  )
  if (result.status !== 0) {
    return {
      error: result.stderr?.trim() || "script failed",
      raw: result.stdout?.trim(),
    }
  }
  try {
    return JSON.parse((result.stdout || "").trim()) as ScriptResult
  } catch {
    return { raw: (result.stdout || "").trim() }
  }
}

export async function GET() {
  if (BRIDGE_URL && BRIDGE_TOKEN) {
    const r = await callBridge("/onedrive/status")
    return NextResponse.json(r)
  }
  const r = runScriptLocal(["-Action", "status"])
  return NextResponse.json(r)
}

export async function POST(req: NextRequest) {
  try {
    const { action, path } = await req.json()
    if (!["enable", "disable"].includes(action)) {
      return NextResponse.json({ error: "invalid action" }, { status: 400 })
    }
    if (path && typeof path === "string" && !/^[A-Z]:\\[^<>|"*?]+$/i.test(path)) {
      return NextResponse.json({ error: "invalid path" }, { status: 400 })
    }

    if (BRIDGE_URL && BRIDGE_TOKEN) {
      const r = await callBridge("/onedrive/action", {
        method: "POST",
        body: JSON.stringify({ action, path }),
      })
      return NextResponse.json(r)
    }

    const args = ["-Action", action]
    if (action === "enable" && path) args.push("-OneDrivePath", path)
    const r = runScriptLocal(args)
    return NextResponse.json(r)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
