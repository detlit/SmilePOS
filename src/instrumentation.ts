// Next.js instrumentation hook (runs once when the Node.js server boots).
// Used to automatically reconnect persistent integrations so users do not have
// to manually re-click "เชื่อมต่อ" after a PC reset/restart:
//   - Cloudflare Tunnel container (token already saved on disk)
//   - OneDrive backup junction (already on disk – just touch status)
//   - Self-heal ข้อมูลที่เสียจากบั๊กเก่า (src/lib/selfHeal.ts — idempotent, มี retry รอ DB)
//
// All work is best-effort and silent; failures here must never block server boot.

import { INSTALL_CONFIG, INSTALL_SCRIPTS } from "@/lib/installPaths"

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  void import("./lib/selfHeal")
    .then(({ runDataSelfHeal }) => runDataSelfHeal())
    .catch((err) => console.error("[SelfHeal] load failed:", err))

  // Defer slightly so Next finishes its own init before we spawn child processes.
  setTimeout(() => {
    void autoReconnectIntegrations()
  }, 5000)
}

async function autoReconnectIntegrations() {
  try {
    // Use indirect require to keep these Node-only modules invisible to
    // Turbopack/webpack's static analyzer (otherwise they trigger
    // "Node.js module is loaded ... not supported in the Edge Runtime" warnings
    // even though this function only runs when NEXT_RUNTIME === 'nodejs').
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports
    const nodeRequire: NodeRequire = (eval("require") as any)
    const { spawn } = nodeRequire("child_process") as typeof import("child_process")
    const { existsSync } = nodeRequire("fs") as typeof import("fs")

    const BRIDGE_URL = process.env.BRIDGE_URL || ""
    const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || ""

    const tryBridge = async (path: string, body?: unknown) => {
      if (!BRIDGE_URL || !BRIDGE_TOKEN) return false
      try {
        await fetch(`${BRIDGE_URL}${path}`, {
          method: body ? "POST" : "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${BRIDGE_TOKEN}`,
          },
          body: body ? JSON.stringify(body) : undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          signal: (AbortSignal as any).timeout?.(60000),
        })
        return true
      } catch {
        return false
      }
    }

    const runScript = (script: string, args: string[]) => {
      if (!existsSync(script)) return
      try {
        const child = spawn(
          "powershell.exe",
          ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, ...args],
          { windowsHide: true, detached: true, stdio: "ignore" }
        )
        child.unref()
      } catch {
        // ignore
      }
    }

    // ---- Cloudflare Tunnel auto-reconnect ----
    // Script falls back to the previously-saved token file when -Token is omitted.
    const tunnelScript = `${INSTALL_SCRIPTS}\\tunnel-manage.ps1`
    const tunnelTokenFile = `${INSTALL_CONFIG}\\tunnel.token`
    const usedBridge = await tryBridge("/tunnel/action", { action: "start" })
    if (!usedBridge && existsSync(tunnelTokenFile)) {
      runScript(tunnelScript, ["-Action", "start"])
    }

    // ---- OneDrive sync ----
    // Junction persists across reboots, so just nudge status to keep config fresh.
    const onedriveScript = `${INSTALL_SCRIPTS}\\onedrive-sync.ps1`
    const usedBridgeOd = await tryBridge("/onedrive/status")
    if (!usedBridgeOd) runScript(onedriveScript, ["-Action", "status"])
  } catch {
    // never let this crash the server
  }
}
