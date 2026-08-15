#!/usr/bin/env node
/**
 * สร้างตารางเส้นทาง API สำหรับฝังลง APK
 *
 * เดินดูไฟล์ route.ts ทั้งหมดแล้วออกเป็นโมดูลเดียวที่ map
 *   "/api/datalist/[id]"  ->  () => import("@/app/_api/datalist/[id]/route")
 *
 * ใช้ dynamic import เพื่อให้ webpack แตกเป็น chunk ย่อย — แอปจึงไม่ต้องโหลดโค้ด API
 * ทั้ง 300 ตัวตอนเปิดหน้าแรก แต่โหลดเฉพาะตัวที่ถูกเรียกจริง
 *
 *   node scripts/gen-api-registry.js [--src src/app/_api] [--alias @/app/_api] [--out <ไฟล์>]
 */

const fs = require("fs")
const path = require("path")

const ROOT = path.resolve(__dirname, "..")

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const SRC_DIR = path.join(ROOT, arg("src", "src/app/api"))
const ALIAS = arg("alias", "@/app/api")
const OUT_PATH = path.join(ROOT, arg("out", "src/lib/mobile/api/registry.generated.ts"))

/**
 * API ของ Next ที่ใช้ได้เฉพาะฝั่ง server
 *
 * ตัวตรวจ React Server Components ของ Next ดู "ข้อความ import" ตั้งแต่ตอนแปลงไฟล์
 * ก่อนขั้นตอน resolve ของ webpack — จึง alias หนีไม่ได้ ต้องกัน route นั้นออกจากตาราง
 * ตั้งแต่ตอน generate แทน แล้วให้เราเตอร์ตอบกลับด้วยข้อความที่อธิบายสาเหตุ
 */
const SERVER_ONLY_IMPORTS = [/from\s+["']next\/cache["']/, /from\s+["']next\/headers["']/, /["']server-only["']/]

function serverOnlyReason(filePath) {
  const source = fs.readFileSync(filePath, "utf8")
  const hit = SERVER_ONLY_IMPORTS.find((re) => re.test(source))
  if (!hit) return null

  const m = source.match(hit)
  return (m ? m[0] : "server-only").replace(/from\s+/, "").replace(/["']/g, "")
}

/** เก็บทุก route.ts ใต้โฟลเดอร์ พร้อม path แบบ URL */
function collect(dir, segments = []) {
  const found = []

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      // route group เช่น (admin) ไม่นับเป็นส่วนหนึ่งของ URL
      const isGroup = entry.name.startsWith("(") && entry.name.endsWith(")")
      // โฟลเดอร์ขึ้นต้นด้วย _ คือของภายใน ไม่ใช่เส้นทาง
      if (entry.name.startsWith("_") && !isGroup) continue

      found.push(...collect(full, isGroup ? segments : [...segments, entry.name]))
      continue
    }

    if (!/^route\.(ts|tsx|js|jsx)$/.test(entry.name)) continue

    found.push({
      urlPath: "/api/" + segments.join("/"),
      importPath: [ALIAS, ...segments, "route"].join("/"),
      serverOnly: serverOnlyReason(full),
    })
  }

  return found
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`[gen-api-registry] ไม่พบโฟลเดอร์ ${path.relative(ROOT, SRC_DIR)}`)
    process.exit(1)
  }

  const all = collect(SRC_DIR).sort((a, b) => a.urlPath.localeCompare(b.urlPath))
  const routes = all.filter((r) => !r.serverOnly)
  const skipped = all.filter((r) => r.serverOnly)

  const entries = routes
    .map((r) => `  ${JSON.stringify(r.urlPath)}: () => import(${JSON.stringify(r.importPath)}),`)
    .join("\n")

  const skippedEntries = skipped
    .map((r) => `  ${JSON.stringify(r.urlPath)}: ${JSON.stringify(r.serverOnly)},`)
    .join("\n")

  const body = `// สร้างอัตโนมัติ — อย่าแก้ไฟล์นี้ด้วยมือ (scripts/gen-api-registry.js)
// ฝังลงแอป: ${routes.length} route   ทำงานในเครื่องไม่ได้: ${skipped.length} route
/* eslint-disable */

export const ROUTES: Record<string, () => Promise<any>> = {
${entries}
}

/** route ที่ต้องพึ่ง API ฝั่ง server ของ Next — เก็บไว้เพื่อตอบข้อความที่อธิบายสาเหตุได้ */
export const SERVER_ONLY_ROUTES: Record<string, string> = {
${skippedEntries}
}

export default ROUTES
`

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, body, "utf8")

  console.log(
    `[gen-api-registry] ฝังลงแอป ${routes.length} route -> ${path.relative(ROOT, OUT_PATH)}`
  )

  if (skipped.length > 0) {
    console.log(`[gen-api-registry] ข้าม ${skipped.length} route ที่ต้องใช้ API ฝั่ง server:`)
    for (const r of skipped) console.log(`    ${r.urlPath}  (${r.serverOnly})`)
  }
}

main()
