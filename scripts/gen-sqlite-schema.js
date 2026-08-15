#!/usr/bin/env node
/**
 * แปลง prisma/schema.prisma (PostgreSQL) เป็น schema SQLite ที่ใช้ในเครื่องแท็บเล็ต
 *
 * ผลลัพธ์ออกเป็นไฟล์เดียว: src/lib/mobile/db/schema.generated.ts ซึ่งมีทั้ง
 *   - DDL ของทุกตาราง (ใช้ตอน migrate ครั้งแรก)
 *   - metadata ของแต่ละ model (ชนิดฟิลด์, ค่า default, ความสัมพันธ์)
 *     ตัวนี้คือสิ่งที่ prismaLite ใช้แปลงค่าไป-กลับระหว่าง JS กับ SQLite
 *     เพราะ SQLite ไม่มีชนิด boolean/datetime/json จริง ๆ
 *
 * รันซ้ำได้ทุกครั้งที่แก้ schema.prisma:  node scripts/gen-sqlite-schema.js
 */

const fs = require("fs")
const path = require("path")

const ROOT = path.resolve(__dirname, "..")
const SCHEMA_PATH = path.join(ROOT, "prisma", "schema.prisma")
const OUT_PATH = path.join(ROOT, "src", "lib", "mobile", "db", "schema.generated.ts")

const SCALARS = new Set([
  "String",
  "Int",
  "Float",
  "Boolean",
  "DateTime",
  "Json",
  "Decimal",
  "BigInt",
  "Bytes",
])

/** ชนิดใน SQLite — เก็บ DateTime เป็น TEXT (ISO-8601) เพราะเรียงลำดับด้วย string ได้ตรงกับเวลาจริง */
const SQLITE_TYPE = {
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

function parseSchema(src) {
  const models = []
  // จับทีละบล็อก model — schema นี้ไม่มี enum และไม่มี @@block จึงไม่ต้องรองรับ
  const modelRe = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm
  let m
  while ((m = modelRe.exec(src)) !== null) {
    const [, name, body] = m
    const fields = []

    for (const rawLine of body.split("\n")) {
      const line = rawLine.trim()
      if (!line || line.startsWith("//") || line.startsWith("@@")) continue

      const fm = line.match(/^(\w+)\s+(\w+)(\[\])?(\?)?\s*(.*)$/)
      if (!fm) continue

      const [, fieldName, typeName, listMark, optionalMark, attrs] = fm
      const isList = Boolean(listMark)
      const isOptional = Boolean(optionalMark)
      const isScalar = SCALARS.has(typeName)

      const field = {
        name: fieldName,
        type: typeName,
        isList,
        isOptional,
        kind: isScalar ? "scalar" : "relation",
      }

      if (isScalar) {
        const mapped = attrs.match(/@map\("([^"]+)"\)/)
        field.column = mapped ? mapped[1] : fieldName
        field.isId = /@id\b/.test(attrs)
        field.isUnique = /@unique\b/.test(attrs)
        field.updatedAt = /@updatedAt\b/.test(attrs)

        const def = attrs.match(/@default\(([\s\S]*)\)\s*(?:\/\/.*)?$/)
        if (def) field.default = parseDefault(def[1], typeName)
      } else {
        // ฝั่งที่ถือ foreign key จะมี fields/references — อีกฝั่งไม่มี ต้องจับคู่ทีหลัง
        const rel = attrs.match(/@relation\(([\s\S]*)\)/)
        if (rel) {
          const inner = rel[1]
          const nameMatch = inner.match(/^\s*"([^"]+)"/)
          const fieldsMatch = inner.match(/fields:\s*\[([^\]]*)\]/)
          const refsMatch = inner.match(/references:\s*\[([^\]]*)\]/)
          const onDelete = inner.match(/onDelete:\s*(\w+)/)

          if (nameMatch) field.relationName = nameMatch[1]
          if (fieldsMatch)
            field.relationFromFields = fieldsMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
          if (refsMatch)
            field.relationToFields = refsMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
          if (onDelete) field.onDelete = onDelete[1]
        }
      }

      fields.push(field)
    }

    models.push({ name, table: name, fields })
  }

  return models
}

/**
 * แปลงค่า @default(...) ของ Prisma เป็นรูปที่ runtime ใช้ต่อได้
 * ค่าที่ต้องคิดตอน insert (autoincrement/now/uuid) เก็บเป็น kind ไว้ให้ prismaLite จัดการ
 */
function parseDefault(raw, typeName) {
  const value = raw.trim()

  if (value.startsWith("autoincrement(")) return { kind: "autoincrement" }
  if (value.startsWith("now(")) return { kind: "now" }
  if (value.startsWith("uuid(")) return { kind: "uuid" }
  if (value.startsWith("cuid(")) return { kind: "uuid" }
  // nextval(...) ของ Postgres ใช้กับ SQLite ไม่ได้ — ถือเป็น autoincrement แทน
  if (value.startsWith("dbgenerated(")) return { kind: "autoincrement" }

  if (value === "true") return { kind: "value", value: true }
  if (value === "false") return { kind: "value", value: false }

  const str = value.match(/^"([\s\S]*)"$/)
  if (str) {
    // Prisma ยอมให้ String field มี @default("false") ซึ่งเป็นสตริง ไม่ใช่ boolean
    return { kind: "value", value: str[1] }
  }

  const num = Number(value)
  if (Number.isFinite(num)) {
    return { kind: "value", value: typeName === "Int" ? Math.trunc(num) : num }
  }

  return null
}

/**
 * เติมข้อมูลความสัมพันธ์ให้ฝั่งที่ไม่มี @relation(fields:)
 * เช่น User.employees ต้องรู้ว่าไปจับกับ SettingEmployee.id_company
 */
function linkRelations(models) {
  const byName = new Map(models.map((mo) => [mo.name, mo]))

  for (const model of models) {
    for (const field of model.fields) {
      if (field.kind !== "relation") continue
      if (field.relationFromFields) {
        field.side = "owner"
        continue
      }

      const target = byName.get(field.type)
      if (!target) continue

      // หาฟิลด์ฝั่งตรงข้ามที่ชี้กลับมาหา model นี้ — ถ้าตั้งชื่อ relation ไว้ต้องตรงกันด้วย
      const back = target.fields.find(
        (f) =>
          f.kind === "relation" &&
          f.type === model.name &&
          Boolean(f.relationFromFields) &&
          (field.relationName ? f.relationName === field.relationName : true)
      )

      if (!back) continue

      field.side = "back"
      field.relationFromFields = back.relationToFields // คีย์ฝั่งเรา (ปกติคือ id)
      field.relationToFields = back.relationFromFields // คอลัมน์ FK ฝั่งโน้น
    }
  }
}

function buildDDL(model) {
  const cols = []
  const scalars = model.fields.filter((f) => f.kind === "scalar" && !f.isList)

  for (const f of scalars) {
    const parts = [`"${f.column}"`, SQLITE_TYPE[f.type] || "TEXT"]

    if (f.isId) {
      // INTEGER PRIMARY KEY AUTOINCREMENT ต้องเขียนติดกันแบบนี้เท่านั้น SQLite ถึงจะรับ
      if (f.type === "Int") {
        parts.push("PRIMARY KEY AUTOINCREMENT")
      } else {
        parts.push("PRIMARY KEY")
      }
    } else {
      if (!f.isOptional) parts.push("NOT NULL")
      if (f.isUnique) parts.push("UNIQUE")

      if (f.default && f.default.kind === "value") {
        const v = f.default.value
        const lit =
          typeof v === "string"
            ? `'${v.replace(/'/g, "''")}'`
            : typeof v === "boolean"
              ? v
                ? "1"
                : "0"
              : String(v)
        parts.push(`DEFAULT ${lit}`)
      }
    }

    cols.push("  " + parts.join(" "))
  }

  return `CREATE TABLE IF NOT EXISTS "${model.table}" (\n${cols.join(",\n")}\n);`
}

/** index บนคอลัมน์ที่ระบบค้นบ่อย — เกือบทุกตารางกรองด้วย company */
function buildIndexes(model) {
  const out = []
  const has = (n) => model.fields.some((f) => f.kind === "scalar" && f.name === n)

  for (const col of ["company", "code", "Barcode", "createDate", "id_salemain", "id_cus"]) {
    if (has(col)) {
      out.push(
        `CREATE INDEX IF NOT EXISTS "idx_${model.table}_${col}" ON "${model.table}" ("${col}");`
      )
    }
  }

  // คอลัมน์ FK ของฝั่งเจ้าของความสัมพันธ์ — ใช้ตอน include
  for (const f of model.fields) {
    if (f.kind !== "relation" || !f.relationFromFields || f.side !== "owner") continue
    for (const col of f.relationFromFields) {
      if (!has(col)) continue
      out.push(
        `CREATE INDEX IF NOT EXISTS "idx_${model.table}_${col}" ON "${model.table}" ("${col}");`
      )
    }
  }

  return [...new Set(out)]
}

function main() {
  const src = fs.readFileSync(SCHEMA_PATH, "utf8")
  const models = parseSchema(src)
  linkRelations(models)

  const ddl = []
  for (const model of models) {
    ddl.push(buildDDL(model))
    ddl.push(...buildIndexes(model))
  }

  const meta = {}
  for (const model of models) {
    meta[model.name] = {
      table: model.table,
      // ชื่อที่ใช้เรียกจากโค้ด: prisma.settingEmployee -> model SettingEmployee
      delegate: model.name.charAt(0).toLowerCase() + model.name.slice(1),
      idField: (model.fields.find((f) => f.isId) || {}).name || null,
      fields: model.fields.map((f) => {
        const out = { name: f.name, kind: f.kind, type: f.type }
        if (f.kind === "scalar") {
          out.column = f.column
          if (f.isId) out.isId = true
          if (f.isOptional) out.isOptional = true
          if (f.isUnique) out.isUnique = true
          if (f.updatedAt) out.updatedAt = true
          if (f.default) out.default = f.default
        } else {
          out.isList = f.isList
          out.isOptional = f.isOptional
          if (f.side) out.side = f.side
          if (f.relationFromFields) out.fromFields = f.relationFromFields
          if (f.relationToFields) out.toFields = f.relationToFields
          if (f.onDelete) out.onDelete = f.onDelete
        }
        return out
      }),
    }
  }

  const banner = `// สร้างอัตโนมัติจาก prisma/schema.prisma — อย่าแก้ไฟล์นี้ด้วยมือ
// รันใหม่ด้วย: node scripts/gen-sqlite-schema.js
// models: ${models.length}`

  const body = `${banner}

export type PrismaDefault =
  | { kind: "autoincrement" }
  | { kind: "now" }
  | { kind: "uuid" }
  | { kind: "value"; value: string | number | boolean }

export type ScalarFieldMeta = {
  name: string
  kind: "scalar"
  type: "String" | "Int" | "Float" | "Boolean" | "DateTime" | "Json" | "Decimal" | "BigInt" | "Bytes"
  column: string
  isId?: boolean
  isOptional?: boolean
  isUnique?: boolean
  updatedAt?: boolean
  default?: PrismaDefault
}

export type RelationFieldMeta = {
  name: string
  kind: "relation"
  /** ชื่อ model ปลายทาง */
  type: string
  isList: boolean
  isOptional: boolean
  /** owner = ฝั่งที่ถือ foreign key, back = ฝั่งตรงข้าม */
  side?: "owner" | "back"
  /** คอลัมน์ฝั่งนี้ */
  fromFields?: string[]
  /** คอลัมน์ฝั่งปลายทาง */
  toFields?: string[]
  onDelete?: string
}

export type FieldMeta = ScalarFieldMeta | RelationFieldMeta

export type ModelMeta = {
  table: string
  delegate: string
  idField: string | null
  fields: FieldMeta[]
}

export const MODELS: Record<string, ModelMeta> = ${JSON.stringify(meta, null, 2)} as any

/** delegate name (prisma.xxx) -> ชื่อ model */
export const DELEGATE_TO_MODEL: Record<string, string> = Object.fromEntries(
  Object.entries(MODELS).map(([name, m]) => [m.delegate, name])
)

/** DDL ทั้งหมด รันตามลำดับตอนเปิดฐานข้อมูลครั้งแรก */
export const SCHEMA_STATEMENTS: string[] = ${JSON.stringify(ddl, null, 2)}

/** เพิ่มเลขนี้เมื่อ schema เปลี่ยน เพื่อให้ตัว migrate รู้ว่าต้องรัน DDL ใหม่ */
export const SCHEMA_VERSION = 1
`

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, body, "utf8")

  const relCount = models.reduce(
    (n, mo) => n + mo.fields.filter((f) => f.kind === "relation").length,
    0
  )
  console.log(`[gen-sqlite-schema] models=${models.length} relations=${relCount} statements=${ddl.length}`)
  console.log(`[gen-sqlite-schema] -> ${path.relative(ROOT, OUT_PATH)}`)
}

main()
