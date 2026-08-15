// สร้าง/อัปเดตโครงตารางในเครื่องให้ตรงกับ schema.prisma
//
// ไม่ได้ใช้ระบบ migration แบบมีไฟล์เป็นขั้น ๆ เหมือนฝั่ง server เพราะแท็บเล็ตอาจข้ามเวอร์ชัน
// (เครื่องที่ไม่ได้อัปเดตมาสามเดือนแล้วลง APK ใหม่ทีเดียว) จึงใช้วิธี "เทียบของจริงกับ schema"
// แล้วเติมส่วนที่ขาด — ครอบคลุมการเปลี่ยนแปลงแบบเพิ่ม (ตารางใหม่/คอลัมน์ใหม่) ซึ่งเป็นเกือบทุกกรณี
//
// สิ่งที่ทำอัตโนมัติไม่ได้: เปลี่ยนชนิดคอลัมน์, เปลี่ยนชื่อ, ลบคอลัมน์
// พวกนี้ต้องเขียนลงใน MANUAL_MIGRATIONS ให้ชัดเจน

import { getDriver, saveWebStore } from "./sqlite"
import { MODELS, SCHEMA_STATEMENTS, SCHEMA_VERSION } from "./schema.generated"

const SQLITE_TYPE: Record<string, string> = {
  String: "TEXT",
  Int: "INTEGER",
  Float: "REAL",
  Boolean: "INTEGER",
  DateTime: "TEXT",
  Json: "TEXT",
  Decimal: "REAL",
  BigInt: "INTEGER",
  Bytes: "BLOB",
}

/**
 * คำสั่งที่ต้องรันตอนขึ้นเวอร์ชันหนึ่ง ๆ (เปลี่ยนชนิด/ลบคอลัมน์/แก้ข้อมูลเก่า)
 * key คือเวอร์ชันปลายทาง — จะรันเมื่อเครื่องนั้นยังอยู่เวอร์ชันต่ำกว่า
 */
const MANUAL_MIGRATIONS: Record<number, string[]> = {
  // 2: ['UPDATE "Datalist" SET "unit" = \'\' WHERE "unit" IS NULL;'],
}

let migratePromise: Promise<void> | null = null

/** รัน migration ครั้งเดียวต่อการเปิดแอป — เรียกซ้ำได้ */
export function ensureSchema(): Promise<void> {
  if (!migratePromise) {
    migratePromise = runMigration().catch((err) => {
      migratePromise = null
      throw err
    })
  }
  return migratePromise
}

async function runMigration(): Promise<void> {
  const db = await getDriver()

  await db.executeScript(`
    CREATE TABLE IF NOT EXISTS "_meta" (
      "key" TEXT PRIMARY KEY,
      "value" TEXT
    );
  `)

  const rows = await db.query<{ value: string }>(
    'SELECT "value" FROM "_meta" WHERE "key" = ?',
    ["schema_version"]
  )
  const current = rows.length > 0 ? Number(rows[0].value) || 0 : 0

  // CREATE TABLE / CREATE INDEX ทุกตัวเป็น IF NOT EXISTS อยู่แล้ว รันซ้ำได้ไม่เสียหาย
  // และเป็นทางที่ตารางใหม่ถูกสร้างตอนอัปเกรดด้วย
  for (const stmt of SCHEMA_STATEMENTS) {
    await db.executeScript(stmt)
  }

  const added = await addMissingColumns(db)

  if (current > 0 && current < SCHEMA_VERSION) {
    for (let v = current + 1; v <= SCHEMA_VERSION; v++) {
      for (const stmt of MANUAL_MIGRATIONS[v] || []) {
        await db.run(stmt)
      }
    }
  }

  await db.run(
    'INSERT INTO "_meta" ("key", "value") VALUES (?, ?) ' +
      'ON CONFLICT("key") DO UPDATE SET "value" = excluded."value"',
    ["schema_version", String(SCHEMA_VERSION)]
  )

  await saveWebStore()

  if (added.length > 0) {
    console.info(`[migrate] เพิ่มคอลัมน์ใหม่ ${added.length} รายการ:`, added.join(", "))
  }
}

/** เทียบคอลัมน์จริงในเครื่องกับ schema แล้ว ALTER TABLE ADD COLUMN ส่วนที่ขาด */
async function addMissingColumns(db: Awaited<ReturnType<typeof getDriver>>): Promise<string[]> {
  const added: string[] = []

  for (const meta of Object.values(MODELS)) {
    const existing = await db.query<{ name: string }>(
      `PRAGMA table_info("${meta.table}")`
    )
    if (existing.length === 0) continue // ตารางเพิ่งถูกสร้าง — ครบอยู่แล้ว

    const have = new Set(existing.map((c) => c.name))

    for (const field of meta.fields) {
      if (field.kind !== "scalar" || field.isId) continue
      if (have.has(field.column)) continue

      const type = SQLITE_TYPE[field.type] || "TEXT"
      const parts = [`ALTER TABLE "${meta.table}" ADD COLUMN "${field.column}" ${type}`]

      // SQLite ห้าม ADD COLUMN ที่เป็น NOT NULL โดยไม่มี default — ต้องมีค่าเริ่มต้นให้แถวเก่า
      const literal = defaultLiteral(field)
      if (literal !== null) {
        parts.push(`DEFAULT ${literal}`)
        if (!field.isOptional) parts.push("NOT NULL")
      }

      await db.run(parts.join(" "))
      added.push(`${meta.table}.${field.column}`)
    }
  }

  return added
}

function defaultLiteral(field: any): string | null {
  const def = field.default
  if (def && def.kind === "value") {
    const v = def.value
    if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`
    if (typeof v === "boolean") return v ? "1" : "0"
    return String(v)
  }

  // ฟิลด์บังคับที่ไม่มี default — ต้องเดาค่ากลาง ๆ ให้แถวเดิมที่มีอยู่แล้ว
  if (!field.isOptional) {
    if (field.type === "DateTime") return `'${new Date(0).toISOString()}'`
    if (field.type === "Int" || field.type === "Float" || field.type === "Boolean") return "0"
    return "''"
  }

  return null
}
