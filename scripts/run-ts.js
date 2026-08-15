#!/usr/bin/env node
/**
 * คอมไพล์ไฟล์ .ts แล้วรันด้วย node — ใช้กับสคริปต์ทดสอบฝั่ง mobile
 *
 * ทำไมไม่ใช้ node ตรง ๆ: Node แกะ type ให้ได้ก็จริง แต่ import แบบไม่มีนามสกุลไฟล์
 * (ซึ่งเป็นสไตล์ที่โปรเจกต์นี้ใช้ทั้งหมด) resolve ไม่ได้ในโหมด ESM
 * คอมไพล์เป็น CommonJS ก่อนจึงง่ายและแน่นอนกว่า
 *
 *   node scripts/run-ts.js scripts/test-prisma-lite.ts
 */

const { spawnSync } = require("child_process")
const path = require("path")
const fs = require("fs")

const ROOT = path.resolve(__dirname, "..")
const entry = process.argv[2]

if (!entry) {
  console.error("ใช้: node scripts/run-ts.js <ไฟล์.ts>")
  process.exit(1)
}

const outDir = path.join(ROOT, "node_modules", ".cache", "run-ts")
fs.rmSync(outDir, { recursive: true, force: true })

// --project <tsconfig> ใช้ตอนต้องการ path mapping (เช่นให้ route handler ตัวจริง
// มองเห็น prismaLite แทน Prisma Client) — tsc ไม่มีแฟล็ก --paths ให้ตั้งจากบรรทัดคำสั่ง
const projectIndex = process.argv.indexOf("--project")
const project = projectIndex >= 0 ? process.argv[projectIndex + 1] : null

// เรียกไฟล์ js ของ tsc ตรง ๆ แทน npx — บน Windows การ spawn ไฟล์ .cmd
// โดยไม่ผ่าน shell จะได้ EINVAL (Node ปิดช่องนี้ไว้ด้วยเหตุผลด้านความปลอดภัย)
const tscBin = require.resolve("typescript/bin/tsc")

let tscArgs

if (project) {
  // tsc ห้ามใส่ชื่อไฟล์คู่กับ --project จึงต้องสร้าง tsconfig ชั่วคราวที่ extends ของเดิม
  // แล้วระบุไฟล์เข้ากับ outDir ลงไปแทน
  const tempConfig = path.join(ROOT, "node_modules", ".cache", "run-ts.tsconfig.json")
  fs.mkdirSync(path.dirname(tempConfig), { recursive: true })
  fs.writeFileSync(
    tempConfig,
    JSON.stringify(
      {
        extends: path.resolve(ROOT, project),
        compilerOptions: { outDir, noEmitOnError: false },
        files: [path.resolve(ROOT, entry)],
      },
      null,
      2
    ),
    "utf8"
  )
  tscArgs = [tscBin, "--project", tempConfig]
} else {
  tscArgs = [
    tscBin,
    entry,
    "--outDir",
    outDir,
    "--module",
    "commonjs",
    "--target",
    "es2022",
    "--moduleResolution",
    "node",
    "--skipLibCheck",
    "--esModuleInterop",
    // ต้องมี dom เพราะโค้ดฝั่ง mobile ใช้ TextEncoder/btoa/Response ซึ่งเป็น API ของเบราว์เซอร์
    "--lib",
    "es2022,dom",
  ]
}

const tsc = spawnSync(process.execPath, tscArgs, { cwd: ROOT, encoding: "utf8" })

// tsc คืน exit code ไม่เป็นศูนย์เมื่อมี type error แต่ยัง emit ไฟล์ออกมาให้
// สคริปต์ทดสอบไม่ได้แคร์ type error (เช่นหา @capacitor-community/sqlite ไม่เจอบน Node)
// ขอแค่มีไฟล์ .js ออกมาก็รันต่อได้
const compiled = path.join(outDir, path.relative(ROOT, entry).replace(/\.ts$/, ".js"))

if (!fs.existsSync(compiled)) {
  console.error(tsc.stdout || tsc.stderr || "คอมไพล์ไม่สำเร็จ")
  process.exit(1)
}

const scriptArgs = process.argv.slice(3).filter((a, i, all) => {
  if (a === "--project") return false
  return all[i - 1] !== "--project"
})

const run = spawnSync(process.execPath, [compiled, ...scriptArgs], {
  cwd: ROOT,
  stdio: "inherit",
})

process.exit(run.status ?? 0)
