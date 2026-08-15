// ตรวจตัวแปลภาษา SQL จาก PostgreSQL -> SQLite
//
// ใช้ "คำสั่งจริง" ที่คัดมาจาก route ในโปรเจกต์ แล้วทดสอบสองชั้น:
//   1. แปลแล้วได้ข้อความที่ถูกต้องไหม
//   2. เอาไปรันกับ SQLite จริงแล้วได้คำตอบตรงกับที่ควรเป็นไหม
//
// ชั้นที่สองสำคัญกว่า เพราะ "แปลผ่าน" ไม่ได้แปลว่า "ได้คำตอบถูก"
//
// รันด้วย: node scripts/run-ts.js scripts/test-pg-dialect.ts

import { DatabaseSync } from "node:sqlite"
import { setDriver, type SqliteDriver } from "../src/lib/mobile/db/sqlite"
import { ensureSchema } from "../src/lib/mobile/db/migrate"
import { prisma } from "../src/lib/mobile/db/prismaLite"
import { translatePostgresSql, UnsupportedSqlError } from "../src/lib/mobile/db/pgDialect"

const sqlite = new DatabaseSync(":memory:")

const driver: SqliteDriver = {
  async query(sql, params = []) {
    return sqlite.prepare(sql).all(...(params as any[])) as any[]
  },
  async run(sql, params = []) {
    const res = sqlite.prepare(sql).run(...(params as any[]))
    return { changes: Number(res.changes), lastId: Number(res.lastInsertRowid) }
  },
  async executeScript(sql) {
    sqlite.exec(sql)
  },
  async beginTransaction() {
    sqlite.exec("BEGIN")
  },
  async commitTransaction() {
    sqlite.exec("COMMIT")
  },
  async rollbackTransaction() {
    sqlite.exec("ROLLBACK")
  },
  async close() {
    sqlite.close()
  },
}

setDriver(driver)

let passed = 0
let failed = 0

function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) {
    passed++
    console.log(`  ok   ${name}`)
  } else {
    failed++
    console.log(`  FAIL ${name}`)
    if (detail !== undefined) console.log("       ", JSON.stringify(detail))
  }
}

function contains(name: string, sql: string, needle: string) {
  check(name, sql.includes(needle), sql.includes(needle) ? undefined : { sql, needle })
}

function notContains(name: string, sql: string, needle: string) {
  check(name, !sql.includes(needle), !sql.includes(needle) ? undefined : { sql, needle })
}

async function main() {
  await ensureSchema()

  // ---------------------------------------------------------- การแปลข้อความ
  console.log("\nแปลข้อความ SQL")

  const placeholders = translatePostgresSql('SELECT * FROM "T" WHERE a = $1 AND b = $2')
  contains("$1/$2 -> ?", placeholders, "a = ? AND b = ?")

  const casts = translatePostgresSql('WHERE "createDate" >= $1::timestamp AND x <= $2::numeric')
  notContains("ตัด ::timestamp", casts, "::")
  contains("พารามิเตอร์ยังอยู่", casts, ">= ? AND")

  const forUpdate = translatePostgresSql('SELECT * FROM "T" ORDER BY id ASC FOR UPDATE')
  notContains("ตัด FOR UPDATE", forUpdate.toUpperCase(), "FOR UPDATE")

  const ilike = translatePostgresSql(`SELECT * FROM "T" WHERE name ILIKE '%ยา%'`)
  contains("ILIKE -> LIKE", ilike, "LIKE")
  notContains("ไม่เหลือ ILIKE", ilike.toUpperCase(), "ILIKE")

  const inString = translatePostgresSql(`SELECT * FROM "T" WHERE note = 'ราคา $1 บาท ILIKE'`)
  contains("ไม่แตะข้อความในเครื่องหมายคำพูด", inString, "'ราคา $1 บาท ILIKE'")

  const now = translatePostgresSql('UPDATE "T" SET "updatedAt" = NOW()')
  contains("NOW() -> datetime('now')", now, "datetime('now')")

  // ------------------------------------------------------ คำสั่งจริงจาก route
  console.log("\nคำสั่งจริงจาก route")

  // src/app/api/sale_cal/sale_daily/route.ts
  const saleDaily = translatePostgresSql(`
    SELECT EXTRACT(DAY FROM sm."createDate" AT TIME ZONE 'Asia/Bangkok') as day, SUM(sm."sumtotal") as value
    FROM "SaleMain" sm
    WHERE sm."companyall" = $1 AND sm."statussall" = '' AND sm."createDate" >= $2::timestamp AND sm."createDate" <= $3::timestamp
    GROUP BY EXTRACT(DAY FROM sm."createDate" AT TIME ZONE 'Asia/Bangkok')
  `)
  contains("sale_daily: EXTRACT -> strftime", saleDaily, "strftime('%d'")
  contains("sale_daily: AT TIME ZONE -> datetime(+7 hours)", saleDaily, "'+7 hours'")
  notContains("sale_daily: ไม่เหลือ EXTRACT", saleDaily.toUpperCase(), "EXTRACT")

  // src/app/api/cutstock/route.ts
  const cutstock = translatePostgresSql(`
    SELECT * FROM "RCitemlist"
    WHERE "itemcode" = ? AND COALESCE("qty", 0) + COALESCE("freebaht", 0) > 0
    ORDER BY "dateExp" ASC NULLS LAST, "id" ASC
    FOR UPDATE
  `)
  notContains("cutstock: ตัด FOR UPDATE", cutstock.toUpperCase(), "FOR UPDATE")

  // ------------------------------------------------------------ รันจริง
  console.log("\nรันกับ SQLite จริง")

  const bangkokEvening = new Date("2026-03-15T18:30:00.000Z") // = 16 มี.ค. 01:30 เวลาไทย
  const bangkokMorning = new Date("2026-03-10T03:00:00.000Z") // = 10 มี.ค. 10:00 เวลาไทย

  await prisma.saleMain.createMany({
    data: [
      { companyall: "C001", statussall: "", createDate: bangkokMorning, sumtotal: 100 },
      { companyall: "C001", statussall: "", createDate: bangkokMorning, sumtotal: 50 },
      { companyall: "C001", statussall: "", createDate: bangkokEvening, sumtotal: 25 },
      { companyall: "C002", statussall: "", createDate: bangkokMorning, sumtotal: 999 },
    ],
  })

  const daily = (await prisma.$queryRawUnsafe(
    `SELECT EXTRACT(DAY FROM sm."createDate" AT TIME ZONE 'Asia/Bangkok') as day, SUM(sm."sumtotal") as value
     FROM "SaleMain" sm
     WHERE sm."companyall" = $1 AND sm."statussall" = '' AND sm."createDate" >= $2::timestamp AND sm."createDate" <= $3::timestamp
     GROUP BY EXTRACT(DAY FROM sm."createDate" AT TIME ZONE 'Asia/Bangkok')
     ORDER BY day ASC`,
    "C001",
    new Date("2026-03-01T00:00:00.000Z").toISOString(),
    new Date("2026-03-31T23:59:59.000Z").toISOString()
  )) as Array<{ day: number; value: number }>

  check("แยกกลุ่มได้ 2 วัน", daily.length === 2, daily)
  check("วันที่ 10 ยอดรวม 150", daily.some((r) => Number(r.day) === 10 && Number(r.value) === 150), daily)
  check(
    "18:30 UTC ถูกนับเป็นวันที่ 16 ตามเวลาไทย",
    daily.some((r) => Number(r.day) === 16 && Number(r.value) === 25),
    daily
  )
  check("ไม่ปนข้อมูลของบริษัทอื่น", !daily.some((r) => Number(r.value) === 999), daily)

  const monthly = (await prisma.$queryRawUnsafe(
    `SELECT EXTRACT(MONTH FROM sm."createDate" AT TIME ZONE 'Asia/Bangkok') as month, SUM(sm."sumtotal") as value
     FROM "SaleMain" sm WHERE sm."companyall" = $1 GROUP BY EXTRACT(MONTH FROM sm."createDate" AT TIME ZONE 'Asia/Bangkok')`,
    "C001"
  )) as Array<{ month: number; value: number }>

  check("รายเดือน: เดือน 3 ยอดรวม 175", monthly.some((r) => Number(r.month) === 3 && Number(r.value) === 175), monthly)

  const maxId = (await prisma.$queryRaw`
    SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM "SaleMain"
  `) as Array<{ next_id: number }>
  check("MAX(id)+1 ทำงาน", Number(maxId[0].next_id) === 5, maxId)

  await prisma.$executeRawUnsafe(
    'UPDATE "SaleMain" SET "statussall" = $1 WHERE "id" = $2',
    "ยกเลิก",
    1
  )
  const updated = await prisma.saleMain.findUnique({ where: { id: 1 } })
  check("UPDATE ด้วย $1/$2 ทำงาน", updated?.statussall === "ยกเลิก", updated?.statussall)

  const nullsLast = (await prisma.$queryRawUnsafe(
    `SELECT "id" FROM "SaleMain" ORDER BY "sumtotal" DESC NULLS LAST, "id" ASC FOR UPDATE`
  )) as Array<{ id: number }>
  check("NULLS LAST + FOR UPDATE รันผ่าน", nullsLast.length === 4, nullsLast)

  // ------------------------------------------------------ กรณีที่ต้องปฏิเสธ
  console.log("\nกรณีที่แปลไม่ได้ ต้องบอกสาเหตุชัด")
  let threw = false
  try {
    translatePostgresSql(`SELECT nextval('"SaleMain_id_seq"')`)
  } catch (err) {
    threw = err instanceof UnsupportedSqlError
  }
  check("nextval -> โยน UnsupportedSqlError", threw)

  let tzThrew = false
  try {
    translatePostgresSql(`SELECT x AT TIME ZONE 'America/New_York'`)
  } catch (err) {
    tzThrew = err instanceof UnsupportedSqlError
  }
  check("เขตเวลาที่ไม่รู้จัก -> โยน error", tzThrew)

  console.log(`\n${"─".repeat(50)}`)
  console.log(`ผ่าน ${passed} / ล้มเหลว ${failed}`)
  if (failed > 0) process.exitCode = 1
}

main().catch((err) => {
  console.error("\nการทดสอบพังกลางคัน:", err)
  process.exitCode = 1
})
