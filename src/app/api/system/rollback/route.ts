import { NextRequest, NextResponse } from "next/server"
import { spawn, execSync } from "child_process"
import { readFileSync, existsSync } from "fs"
import { INSTALL_LOGS, INSTALL_SCRIPTS } from "@/lib/installPaths"

const SCRIPT = `${INSTALL_SCRIPTS}\\rollback-version.ps1`
const LOG_FILE = `${INSTALL_LOGS}\\rollback.log`

export async function GET() {
  try {
    let localTags: string[] = []
    try {
      const raw = execSync(
        'podman images d2poption/smilestore --format "{{.Tag}}"',
        { encoding: "utf8", timeout: 10000 }
      )
      localTags = raw
        .split(/\r?\n/)
        .map((t) => t.trim())
        .filter((t) => t && t !== "<none>")
    } catch {
      /* podman not available locally — ignore */
    }

    let hubTags: string[] = []
    try {
      const resp = await fetch(
        "https://hub.docker.com/v2/repositories/d2poption/smilestore/tags?page_size=50"
      )
      if (resp.ok) {
        const data = await resp.json()
        hubTags = ((data as { results?: { name: string }[] }).results || [])
          .map((r) => r.name)
          .filter((n) => /^v?\d+(\.\d+)*$/.test(n))
      }
    } catch {
      /* offline — ignore */
    }

    const availableTags = Array.from(new Set([...localTags, ...hubTags]))
      .filter((t) => t !== "latest")
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))

    let log = ""
    if (existsSync(LOG_FILE)) {
      const content = readFileSync(LOG_FILE, "utf8")
      log = content.split(/\r?\n/).slice(-40).join("\n")
    }

    return NextResponse.json({
      localTags,
      availableTags,
      currentTag: process.env.APP_VERSION || "dev",
      log,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tag } = await req.json()
    if (!tag || typeof tag !== "string" || !/^[a-zA-Z0-9._-]+$/.test(tag)) {
      return NextResponse.json({ error: "invalid tag" }, { status: 400 })
    }
    if (!existsSync(SCRIPT)) {
      return NextResponse.json(
        { error: "rollback-version.ps1 not installed" },
        { status: 500 }
      )
    }

    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", SCRIPT, "-Tag", tag],
      { detached: true, stdio: "ignore" }
    )
    child.unref()

    return NextResponse.json({ ok: true, tag, started: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
