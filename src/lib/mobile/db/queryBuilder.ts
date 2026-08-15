// แปลง argument แบบ Prisma (where / orderBy / data) เป็น SQL ของ SQLite
//
// เหตุผลที่ต้องมีชั้นนี้: SQLite ไม่มีชนิด boolean, datetime, json จริง ๆ
// ค่าทุกตัวจึงต้องแปลงไป-กลับตาม metadata ที่ generate มาจาก schema.prisma
// และต้องเลียนพฤติกรรมของ Postgres ให้ตรง (เช่นการเรียง NULL) ไม่งั้นผลลัพธ์
// บนแท็บเล็ตจะไม่เหมือนบนเครื่องเคาน์เตอร์

import type { ModelMeta, ScalarFieldMeta } from "./schema.generated"
import type { SqlValue } from "./sqlite"

export type Sql = { sql: string; params: SqlValue[] }

export function scalarField(meta: ModelMeta, name: string): ScalarFieldMeta | null {
  const f = meta.fields.find((x) => x.name === name)
  return f && f.kind === "scalar" ? f : null
}

export function relationField(meta: ModelMeta, name: string) {
  const f = meta.fields.find((x) => x.name === name)
  return f && f.kind === "relation" ? f : null
}

// ---------------------------------------------------------------- coercion

/** JS -> SQLite */
export function toDb(field: ScalarFieldMeta | null, value: unknown): SqlValue {
  if (value === null || value === undefined) return null

  switch (field?.type) {
    case "Boolean":
      return value ? 1 : 0

    case "DateTime": {
      if (value instanceof Date) return value.toISOString()
      const parsed = new Date(value as any)
      // เก็บเป็น ISO เสมอ เพื่อให้เปรียบเทียบ/เรียงด้วย string ได้ตรงกับเวลาจริง
      return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString()
    }

    case "Json":
      return typeof value === "string" ? value : JSON.stringify(value)

    case "Int":
      return typeof value === "number" ? Math.trunc(value) : Math.trunc(Number(value))

    case "Float":
    case "Decimal":
      return typeof value === "number" ? value : Number(value)

    case "String":
      return typeof value === "string" ? value : String(value)

    default:
      if (typeof value === "boolean") return value ? 1 : 0
      if (value instanceof Date) return value.toISOString()
      if (typeof value === "object") return JSON.stringify(value)
      return value as SqlValue
  }
}

/** SQLite -> JS */
export function fromDb(field: ScalarFieldMeta | null, value: unknown): unknown {
  if (value === null || value === undefined) return null

  switch (field?.type) {
    case "Boolean":
      return Boolean(value)

    case "DateTime": {
      const d = new Date(value as string)
      return Number.isNaN(d.getTime()) ? null : d
    }

    case "Json":
      if (typeof value !== "string") return value
      try {
        return JSON.parse(value)
      } catch {
        return value
      }

    case "Int":
    case "Float":
    case "Decimal":
      return typeof value === "number" ? value : Number(value)

    default:
      return value
  }
}

/** แปลงทั้งแถวจาก SQLite เป็นออบเจกต์แบบที่ Prisma คืน */
export function rowToObject(meta: ModelMeta, row: Record<string, any>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const field of meta.fields) {
    if (field.kind !== "scalar") continue
    if (!(field.column in row)) continue
    out[field.name] = fromDb(field, row[field.column])
  }
  return out
}

// ------------------------------------------------------------------- where

const AND = (parts: string[]) => (parts.length ? `(${parts.join(" AND ")})` : "1=1")

/**
 * where ของ Prisma -> SQL
 * รองรับ AND/OR/NOT, ตัวดำเนินการเปรียบเทียบ, การค้นข้อความ และ relation filter (some/every/none)
 */
export function buildWhere(
  meta: ModelMeta,
  where: any,
  alias: string,
  models: Record<string, ModelMeta>
): Sql {
  if (!where || typeof where !== "object") return { sql: "1=1", params: [] }

  const parts: string[] = []
  const params: SqlValue[] = []

  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue

    if (key === "AND" || key === "OR") {
      const list = (Array.isArray(value) ? value : [value]).filter(Boolean)
      if (list.length === 0) continue
      const subs = list.map((w) => buildWhere(meta, w, alias, models))
      parts.push(`(${subs.map((s) => s.sql).join(key === "AND" ? " AND " : " OR ")})`)
      subs.forEach((s) => params.push(...s.params))
      continue
    }

    if (key === "NOT") {
      const list = (Array.isArray(value) ? value : [value]).filter(Boolean)
      if (list.length === 0) continue
      const subs = list.map((w) => buildWhere(meta, w, alias, models))
      parts.push(`NOT (${subs.map((s) => s.sql).join(" AND ")})`)
      subs.forEach((s) => params.push(...s.params))
      continue
    }

    const rel = relationField(meta, key)
    if (rel) {
      const sub = buildRelationFilter(meta, rel, value, alias, models)
      if (sub) {
        parts.push(sub.sql)
        params.push(...sub.params)
      }
      continue
    }

    const field = scalarField(meta, key)
    if (!field) continue // ฟิลด์ที่ไม่รู้จัก — ข้าม ดีกว่าทำให้ทั้ง query พัง

    const col = `"${alias}"."${field.column}"`
    const cond = buildFieldCondition(col, field, value)
    parts.push(cond.sql)
    params.push(...cond.params)
  }

  return { sql: AND(parts), params }
}

function buildFieldCondition(col: string, field: ScalarFieldMeta, value: any): Sql {
  // ค่าธรรมดา = เท่ากับ
  if (value === null) return { sql: `${col} IS NULL`, params: [] }
  if (typeof value !== "object" || value instanceof Date) {
    return { sql: `${col} = ?`, params: [toDb(field, value)] }
  }

  const parts: string[] = []
  const params: SqlValue[] = []
  // Prisma ให้ระบุ mode คู่กับ contains/startsWith/endsWith เพื่อค้นแบบไม่สนตัวพิมพ์
  const insensitive = value.mode === "insensitive"

  for (const [op, raw] of Object.entries<any>(value)) {
    if (raw === undefined || op === "mode") continue

    switch (op) {
      case "equals":
        if (raw === null) parts.push(`${col} IS NULL`)
        else {
          parts.push(`${col} = ?`)
          params.push(toDb(field, raw))
        }
        break

      case "not":
        if (raw === null) parts.push(`${col} IS NOT NULL`)
        else if (typeof raw === "object" && !(raw instanceof Date)) {
          const inner = buildFieldCondition(col, field, raw)
          parts.push(`NOT (${inner.sql})`)
          params.push(...inner.params)
        } else {
          // NULL ต้องนับว่า "ไม่เท่ากับ" ด้วย เหมือนที่ Prisma ทำ (SQL ปกติจะตัด NULL ทิ้ง)
          parts.push(`(${col} IS NULL OR ${col} <> ?)`)
          params.push(toDb(field, raw))
        }
        break

      case "in": {
        const list = Array.isArray(raw) ? raw : [raw]
        if (list.length === 0) {
          parts.push("1=0")
          break
        }
        parts.push(`${col} IN (${list.map(() => "?").join(", ")})`)
        list.forEach((v) => params.push(toDb(field, v)))
        break
      }

      case "notIn": {
        const list = Array.isArray(raw) ? raw : [raw]
        if (list.length === 0) {
          parts.push("1=1")
          break
        }
        parts.push(`(${col} IS NULL OR ${col} NOT IN (${list.map(() => "?").join(", ")}))`)
        list.forEach((v) => params.push(toDb(field, v)))
        break
      }

      case "lt":
      case "lte":
      case "gt":
      case "gte": {
        const sqlOp = { lt: "<", lte: "<=", gt: ">", gte: ">=" }[op]
        parts.push(`${col} ${sqlOp} ?`)
        params.push(toDb(field, raw))
        break
      }

      case "contains":
      case "startsWith":
      case "endsWith": {
        const text = String(raw)
        if (insensitive) {
          // LIKE ของ SQLite ไม่สนตัวพิมพ์ใหญ่-เล็ก (ASCII) อยู่แล้ว ตรงกับ mode:'insensitive'
          const pattern =
            op === "contains"
              ? `%${escapeLike(text)}%`
              : op === "startsWith"
                ? `${escapeLike(text)}%`
                : `%${escapeLike(text)}`
          parts.push(`${col} LIKE ? ESCAPE '\\'`)
          params.push(pattern)
        } else {
          // ไม่ระบุ mode = ต้องสนตัวพิมพ์ (ตรงกับ Postgres) — instr/substr เทียบแบบ binary
          if (op === "contains") {
            parts.push(`instr(${col}, ?) > 0`)
            params.push(text)
          } else if (op === "startsWith") {
            parts.push(`substr(${col}, 1, ?) = ?`)
            params.push(text.length, text)
          } else {
            parts.push(`substr(${col}, -?) = ?`)
            params.push(text.length, text)
          }
        }
        break
      }

      default:
        // ตัวดำเนินการที่ยังไม่รองรับ (เช่น search) — เงียบไว้ดีกว่าคืนผลผิด
        break
    }
  }

  return { sql: AND(parts), params }
}

/** relation filter: { items: { some: {...} } } -> EXISTS (...) */
function buildRelationFilter(
  meta: ModelMeta,
  rel: any,
  value: any,
  alias: string,
  models: Record<string, ModelMeta>
): Sql | null {
  const target = models[rel.type]
  if (!target || !rel.fromFields || !rel.toFields) return null

  const sub = `${alias}_${rel.name}`
  const join = rel.fromFields
    .map((from: string, i: number) => {
      const fromCol = scalarField(meta, from)?.column || from
      const toCol = scalarField(target, rel.toFields[i])?.column || rel.toFields[i]
      return `"${sub}"."${toCol}" = "${alias}"."${fromCol}"`
    })
    .join(" AND ")

  const exists = (cond: Sql, negate: boolean) => ({
    sql: `${negate ? "NOT " : ""}EXISTS (SELECT 1 FROM "${target.table}" AS "${sub}" WHERE ${join} AND ${cond.sql})`,
    params: cond.params,
  })

  // ความสัมพันธ์แบบเดี่ยว: { user: { name: 'x' } } — ไม่มี some/every/none
  if (!("some" in value) && !("every" in value) && !("none" in value) && !("is" in value) && !("isNot" in value)) {
    return exists(buildWhere(target, value, sub, models), false)
  }

  const parts: string[] = []
  const params: SqlValue[] = []

  if (value.some) {
    const s = exists(buildWhere(target, value.some, sub, models), false)
    parts.push(s.sql)
    params.push(...s.params)
  }
  if (value.none) {
    const s = exists(buildWhere(target, value.none, sub, models), true)
    parts.push(s.sql)
    params.push(...s.params)
  }
  if (value.every) {
    // "ทุกแถวเข้าเงื่อนไข" = "ไม่มีแถวไหนที่ไม่เข้าเงื่อนไข"
    const inner = buildWhere(target, value.every, sub, models)
    parts.push(
      `NOT EXISTS (SELECT 1 FROM "${target.table}" AS "${sub}" WHERE ${join} AND NOT (${inner.sql}))`
    )
    params.push(...inner.params)
  }
  if (value.is) {
    const s = exists(buildWhere(target, value.is, sub, models), false)
    parts.push(s.sql)
    params.push(...s.params)
  }
  if (value.isNot) {
    const s = exists(buildWhere(target, value.isNot, sub, models), true)
    parts.push(s.sql)
    params.push(...s.params)
  }

  return { sql: AND(parts), params }
}

function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`)
}

// ----------------------------------------------------------------- orderBy

/**
 * Postgres เรียง NULL ไว้ท้ายสุดเมื่อ ASC และไว้บนสุดเมื่อ DESC — SQLite ทำตรงกันข้าม
 * จึงต้องใส่คีย์ "IS NULL" นำหน้าทุกครั้งเพื่อให้ลำดับตรงกับฝั่ง server
 */
export function buildOrderBy(meta: ModelMeta, orderBy: any, alias: string): string {
  const list = (Array.isArray(orderBy) ? orderBy : [orderBy]).filter(Boolean)
  const terms: string[] = []

  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue

    for (const [key, raw] of Object.entries<any>(entry)) {
      if (raw === undefined || raw === null) continue

      const field = scalarField(meta, key)
      if (!field) continue // เรียงตามฟิลด์ของ relation ยังไม่รองรับ

      const dir = String(typeof raw === "object" ? raw.sort : raw).toLowerCase() === "desc"
        ? "DESC"
        : "ASC"
      const col = `"${alias}"."${field.column}"`

      terms.push(`${col} IS NULL ${dir === "ASC" ? "ASC" : "DESC"}`)
      terms.push(`${col} ${dir}`)
    }
  }

  return terms.length > 0 ? ` ORDER BY ${terms.join(", ")}` : ""
}
