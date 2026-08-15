// แปล SQL ดิบจากภาษา PostgreSQL เป็นภาษาที่ SQLite เข้าใจ
//
// route ประมาณ 15 ไฟล์เขียน SQL ตรง ๆ ผ่าน $queryRaw / $executeRawUnsafe โดยเฉพาะรายงานยอดขาย
// ที่ต้องกรุ๊ปตามวัน/เดือน ถ้าจะรันบนแท็บเล็ตก็ต้องแปลงภาษาก่อน
//
// เลือกแปลที่ชั้นนี้ชั้นเดียวแทนการไล่แก้ทีละไฟล์ ด้วยเหตุผลเดียวกับ prismaLite:
// โค้ดต้นฉบับยังใช้ร่วมกับ server ได้เหมือนเดิม ไม่ต้องมีสองเวอร์ชันให้ดูแล
//
// สิ่งที่แปลไม่ได้ (sequence ของ Postgres) จะโยน error ที่บอกชื่อฟีเจอร์ตรง ๆ
// ดีกว่าปล่อยให้ SQLite ตอบ syntax error ที่ตามต้นตอไม่ได้

/** เขตเวลาที่ระบบนี้ใช้จริง — เก็บเป็นชั่วโมงเพราะ SQLite ไม่มีตาราง timezone */
const TIMEZONE_OFFSETS: Record<string, string> = {
  "asia/bangkok": "+7 hours",
  "asia/jakarta": "+7 hours",
  utc: "+0 hours",
  "etc/utc": "+0 hours",
}

/** ตัวอักษรที่ strftime ใช้แทนแต่ละส่วนของวันที่ */
const EXTRACT_FIELDS: Record<string, string> = {
  year: "%Y",
  month: "%m",
  day: "%d",
  hour: "%H",
  minute: "%M",
  second: "%S",
  dow: "%w",
  doy: "%j",
  week: "%W",
}

export class UnsupportedSqlError extends Error {
  constructor(feature: string) {
    super(
      `คำสั่ง SQL นี้ใช้ ${feature} ซึ่งเป็นของ PostgreSQL โดยเฉพาะ ` +
        `จึงทำงานบนฐานข้อมูลในเครื่องไม่ได้ — ให้ทำรายการนี้ที่เครื่องคอมพิวเตอร์แทน`
    )
    this.name = "UnsupportedSqlError"
  }
}

/**
 * แยกข้อความ SQL เป็นช่วง "โค้ด" กับช่วง "สตริง" เพื่อไม่ให้การแทนที่ไปโดนข้อมูลข้างใน
 * เช่น ชื่อสินค้าที่มีเครื่องหมาย $ หรือคำว่า ILIKE อยู่ในนั้น
 */
function mapOutsideStrings(sql: string, transform: (chunk: string) => string): string {
  let out = ""
  let i = 0

  while (i < sql.length) {
    const ch = sql[i]

    if (ch === "'" || ch === '"') {
      // เดินไปจนจบสตริง (SQL หนีเครื่องหมายด้วยการพิมพ์ซ้ำสองตัว)
      let j = i + 1
      while (j < sql.length) {
        if (sql[j] === ch) {
          if (sql[j + 1] === ch) j += 2
          else break
        } else j++
      }
      out += sql.slice(i, j + 1)
      i = j + 1
      continue
    }

    let j = i
    while (j < sql.length && sql[j] !== "'" && sql[j] !== '"') j++
    out += transform(sql.slice(i, j))
    i = j
  }

  return out
}

/** อ่านวงเล็บให้ครบคู่ เริ่มจากตำแหน่งของ "(" — คืนตำแหน่งของ ")" ที่คู่กัน */
function matchParen(text: string, open: number): number {
  let depth = 0
  for (let i = open; i < text.length; i++) {
    if (text[i] === "(") depth++
    else if (text[i] === ")") {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/** `<expr> AT TIME ZONE 'Asia/Bangkok'` -> `datetime(<expr>, '+7 hours')` */
function convertAtTimeZone(sql: string): string {
  const re = /AT\s+TIME\s+ZONE\s+'([^']+)'/i
  let result = sql

  for (let guard = 0; guard < 20; guard++) {
    const m = result.match(re)
    if (!m || m.index === undefined) break

    const tz = String(m[1]).toLowerCase()
    const offset = TIMEZONE_OFFSETS[tz]
    if (!offset) throw new UnsupportedSqlError(`เขตเวลา '${m[1]}'`)

    // นิพจน์ที่อยู่ "ก่อน" คำสั่งนี้คือค่าที่จะถูกแปลงเขตเวลา
    const before = result.slice(0, m.index).trimEnd()
    const start = findExpressionStart(before)
    const expr = before.slice(start).trim()

    result =
      result.slice(0, start) +
      `datetime(${expr}, '${offset}')` +
      result.slice(m.index + m[0].length)
  }

  return result
}

/** ถอยหลังจากท้ายข้อความเพื่อหาจุดเริ่มของนิพจน์ตัวสุดท้าย (รองรับวงเล็บและชื่อแบบ "tbl"."col") */
function findExpressionStart(before: string): number {
  let i = before.length - 1

  if (before[i] === ")") {
    let depth = 0
    while (i >= 0) {
      if (before[i] === ")") depth++
      else if (before[i] === "(") {
        depth--
        if (depth === 0) break
      }
      i--
    }
    // เผื่อเป็นการเรียกฟังก์ชัน เช่น datetime(...) ให้รวมชื่อฟังก์ชันเข้าไปด้วย
    let j = i - 1
    while (j >= 0 && /[\w.]/.test(before[j])) j--
    return j + 1
  }

  while (i >= 0 && /[\w."]/.test(before[i])) i--
  return i + 1
}

/** `EXTRACT(DAY FROM <expr>)` -> `CAST(strftime('%d', <expr>) AS INTEGER)` */
function convertExtract(sql: string): string {
  let result = sql

  for (let guard = 0; guard < 30; guard++) {
    const m = result.match(/EXTRACT\s*\(/i)
    if (!m || m.index === undefined) break

    const open = result.indexOf("(", m.index)
    const close = matchParen(result, open)
    if (close === -1) break

    const inner = result.slice(open + 1, close)
    const parts = inner.match(/^\s*(\w+)\s+FROM\s+([\s\S]+)$/i)
    if (!parts) break

    const pattern = EXTRACT_FIELDS[parts[1].toLowerCase()]
    if (!pattern) throw new UnsupportedSqlError(`EXTRACT(${parts[1]} ...)`)

    result =
      result.slice(0, m.index) +
      `CAST(strftime('${pattern}', ${parts[2].trim()}) AS INTEGER)` +
      result.slice(close + 1)
  }

  return result
}

/** `DATE_TRUNC('month', x)` -> `strftime('%Y-%m-01', x)` */
function convertDateTrunc(sql: string): string {
  const patterns: Record<string, string> = {
    year: "%Y-01-01",
    month: "%Y-%m-01",
    day: "%Y-%m-%d",
    hour: "%Y-%m-%d %H:00:00",
    minute: "%Y-%m-%d %H:%M:00",
  }

  let result = sql

  for (let guard = 0; guard < 30; guard++) {
    const m = result.match(/DATE_TRUNC\s*\(/i)
    if (!m || m.index === undefined) break

    const open = result.indexOf("(", m.index)
    const close = matchParen(result, open)
    if (close === -1) break

    const inner = result.slice(open + 1, close)
    const parts = inner.match(/^\s*'(\w+)'\s*,\s*([\s\S]+)$/)
    if (!parts) break

    const pattern = patterns[parts[1].toLowerCase()]
    if (!pattern) throw new UnsupportedSqlError(`DATE_TRUNC('${parts[1]}', ...)`)

    result =
      result.slice(0, m.index) +
      `strftime('${pattern}', ${parts[2].trim()})` +
      result.slice(close + 1)
  }

  return result
}

/**
 * แปลง SQL ของ PostgreSQL ให้ SQLite รันได้
 *
 * ครอบคลุมเท่าที่โค้ดในโปรเจกต์นี้ใช้จริง — ถ้าเจอของที่แปลงไม่ได้จะโยน UnsupportedSqlError
 */
export function translatePostgresSql(sql: string): string {
  let result = sql

  // sequence เป็นแนวคิดที่ SQLite ไม่มี (ใช้ AUTOINCREMENT แทน) แปลงตรง ๆ ไม่ได้
  if (/\b(nextval|setval|currval)\s*\(/i.test(result)) {
    throw new UnsupportedSqlError("sequence (nextval/setval)")
  }

  result = convertAtTimeZone(result)
  result = convertExtract(result)
  result = convertDateTrunc(result)

  result = mapOutsideStrings(result, (chunk) =>
    chunk
      // $1, $2 -> ? (SQLite ใช้ ? เรียงตามลำดับอยู่แล้ว จึงแทนที่ได้ตรงตัว)
      .replace(/\$\d+/g, "?")
      // ตัด cast แบบ ::type ทิ้ง — SQLite เก็บชนิดแบบยืดหยุ่นอยู่แล้ว
      .replace(/::\s*(?:timestamptz|timestamp|numeric|decimal|varchar|integer|bigint|float|double precision|boolean|text|date|int|uuid|json|jsonb)\b/gi, "")
      // SQLite ล็อกทั้งไฟล์ในหนึ่ง transaction อยู่แล้ว ไม่มี row lock ให้ขอ
      .replace(/\bFOR\s+(?:UPDATE|SHARE)(?:\s+NOWAIT|\s+SKIP\s+LOCKED)?/gi, "")
      // LIKE ของ SQLite ไม่สนตัวพิมพ์ใหญ่-เล็กอยู่แล้ว จึงมีผลเท่ากับ ILIKE
      .replace(/\bILIKE\b/gi, "LIKE")
      .replace(/\bNOW\s*\(\s*\)/gi, "datetime('now')")
      .replace(/\bCURRENT_DATE\b/gi, "date('now')")
      // ตัวคั่นชื่อฐานข้อมูลของ Postgres ที่ SQLite ไม่รู้จัก
      .replace(/\bpublic\.\s*/gi, "")
  )

  return result.trim()
}
