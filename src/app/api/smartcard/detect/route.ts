import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import { networkInterfaces } from "os"
import dns from "dns"
import { promisify } from "util"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// ปรอบพอร์ตของ Smart Card Agent จาก "ฝั่งเซิร์ฟเวอร์" แทนที่จะเรียกจาก browser
// เพราะบราวเซอร์บางตัวบล็อคคำขอข้าม localhost <-> 127.0.0.1 หรือบังคับ preflight
// แบบ Private Network Access ทำให้ขึ้น "Failed to fetch" แม้ agent จะเปิดอยู่
// host.containers.internal = Podman, host.docker.internal = Docker Desktop / Linux Docker
const HOST_ALIASES = ["host.containers.internal", "host.docker.internal"]
// 8182 = ค่าเริ่มต้น Agent, 18182 = port-proxy ที่ installer ตั้งให้ (สำหรับ Agent เก่าที่ bind 127.0.0.1)
const SMARTCARD_PORTS = [8182, 18182, 8189, 8188, 8443, 6543, 5000, 3001, 9182, 9876]

const dnsLookup = promisify(dns.lookup)

const STATIC_CANDIDATES = [
  "http://127.0.0.1:8182",
  "http://localhost:8182",
  "http://127.0.0.1:18182",
  "http://localhost:18182",
  // container-to-host aliases for each port (Podman & Docker Desktop)
  ...HOST_ALIASES.flatMap((h) => SMARTCARD_PORTS.map((p) => `http://${h}:${p}`)),
  "http://127.0.0.1:8189",
  "http://127.0.0.1:8443",
  "https://127.0.0.1:8443",
  "http://127.0.0.1:8188",
  "http://127.0.0.1:6543",
  "http://127.0.0.1:5000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:9182",
  "http://127.0.0.1:9876",
]

// อ่าน default gateway จาก /proc/net/route (Linux containers)
// ใน Podman/Docker บน Windows ค่านี้คือ IP ของ Podman bridge → ซึ่งมัก route ต่อไปยัง Windows host
async function readDefaultGateways(): Promise<string[]> {
  if (process.platform !== "linux") return []
  try {
    const text = await fs.readFile("/proc/net/route", "utf8")
    const out = new Set<string>()
    const lines = text.split("\n").slice(1)
    for (const line of lines) {
      const cols = line.trim().split(/\s+/)
      if (cols.length < 3) continue
      const dest = cols[1]
      const gw = cols[2]
      // default route: destination = 00000000
      if (dest === "00000000" && gw && gw !== "00000000") {
        // gw คือ little-endian hex (8 ตัวอักษร) แปลงเป็น dotted IPv4
        const m = gw.match(/^([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/)
        if (m) {
          const ip = `${parseInt(m[4], 16)}.${parseInt(m[3], 16)}.${parseInt(m[2], 16)}.${parseInt(m[1], 16)}`
          out.add(ip)
        }
      }
    }
    return Array.from(out)
  } catch {
    return []
  }
}

// อ่าน IP ของ network interfaces ทั้งหมดในเครื่อง host (กรณีรัน Next.js บน Windows ตรง ๆ)
function readLocalNetworkAddresses(): string[] {
  try {
    const ifs = networkInterfaces()
    const out: string[] = []
    for (const name of Object.keys(ifs)) {
      for (const a of ifs[name] || []) {
        if (a.family === "IPv4" && !a.internal) out.push(a.address)
      }
    }
    return out
  } catch {
    return []
  }
}

// resolve DNS aliases เพื่อหา IP จริง (กันกรณี alias ตอบ DNS แต่ route ไม่ได้)
async function resolveAliasIps(): Promise<string[]> {
  const ips = new Set<string>()
  for (const h of HOST_ALIASES) {
    try {
      const r = await dnsLookup(h, { family: 4 })
      if (r?.address) ips.add(r.address)
    } catch { /* ignore */ }
  }
  return Array.from(ips)
}

async function buildDynamicCandidates(): Promise<string[]> {
  const ips = new Set<string>()
  for (const ip of await readDefaultGateways()) ips.add(ip)
  for (const ip of readLocalNetworkAddresses()) ips.add(ip)
  for (const ip of await resolveAliasIps()) ips.add(ip)
  // ตัดออก loopback และ multicast/broadcast ที่ไม่มีประโยชน์
  const out: string[] = []
  for (const ip of ips) {
    if (!ip || ip.startsWith("127.") || ip === "0.0.0.0" || ip.startsWith("224.") || ip.startsWith("255.")) continue
    for (const p of SMARTCARD_PORTS) out.push(`http://${ip}:${p}`)
  }
  return out
}

async function pingOne(baseUrl: string, timeoutMs: number) {
  const url = baseUrl.replace(/\/+$/, "")
  const start = Date.now()
  try {
    const controller = new AbortController()
    const to = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(`${url}/ping`, {
      signal: controller.signal,
      cache: "no-store",
    }).catch(() => null)
    clearTimeout(to)
    if (!res || !res.ok) return null
    let info: any = undefined
    try { info = await res.clone().json() } catch { /* non-JSON ok */ }
    // ตรวจว่าเป็น Smart Card Agent ของเราจริง ๆ ไม่ใช่บริการอื่นที่บังเอิญตอบ /ping
    // (กันกรณี http.sys ของ Windows ตอบ 401/200 บนพอร์ตที่จองไว้)
    if (info && typeof info === "object") {
      const isAgent = info.name === "thai-smartcard-agent" || Array.isArray(info.readers) || info.engine?.toString().toLowerCase().includes("winscard")
      if (!isAgent) return null
    }
    return { url, pingMs: Date.now() - start, info }
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const preferred = (searchParams.get("preferred") || "").trim()
  const timeoutMs = Math.max(400, Math.min(5000, Number(searchParams.get("timeoutMs") || 1500)))

  const dynamic = await buildDynamicCandidates()
  const list = Array.from(
    new Set(
      [preferred, ...STATIC_CANDIDATES, ...dynamic]
        .filter(Boolean)
        .map((u) => u.replace(/\/+$/, ""))
    )
  )

  // probe พร้อมกันทั้งหมด แล้วเลือกตัวที่ตอบเร็วที่สุด (เรียงตาม index)
  const results = await Promise.all(list.map((u) => pingOne(u, timeoutMs)))
  for (let i = 0; i < results.length; i++) {
    if (results[i]) {
      return NextResponse.json({ ok: true, ...results[i], tried: list.length })
    }
  }
  return NextResponse.json(
    { ok: false, tried: list.length, message: "ไม่พบ Smart Card Agent บนพอร์ตใด ๆ" },
    { status: 404 }
  )
}

