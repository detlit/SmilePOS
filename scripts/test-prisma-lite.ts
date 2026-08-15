// ตรวจว่า prismaLite ให้ผลตรงกับที่ Prisma Client ทำ โดยรันบน node:sqlite (ไม่ต้องมีเครื่อง Android)
//
// รันด้วย:  npm run test:mobile-db
//
// ครอบคลุมท่าที่ route handler ในโปรเจกต์นี้ใช้จริง — where/orderBy/select/include/
// increment/aggregate/groupBy/transaction/raw — ถ้าตัวไหนพัง แปลว่า API ที่ใช้ท่านั้นจะพังบนแท็บเล็ต

import { DatabaseSync } from "node:sqlite"
import { setDriver, type SqliteDriver } from "../src/lib/mobile/db/sqlite"
import { ensureSchema } from "../src/lib/mobile/db/migrate"
import { prisma } from "../src/lib/mobile/db/prismaLite"

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

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed++
    console.log(`  ok   ${name}`)
  } else {
    failed++
    console.log(`  FAIL ${name}`)
    if (detail !== undefined) console.log("       ", JSON.stringify(detail))
  }
}

function eq(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual)
  const b = JSON.stringify(expected)
  check(name, a === b, a === b ? undefined : { actual, expected })
}

async function main() {
  await ensureSchema()
  console.log("\nschema: สร้างตารางครบแล้ว\n")

  // ---------------------------------------------------------------- create
  console.log("create / default / autoincrement")
  const user = await prisma.user.create({
    data: { name: "ร้านทดสอบ", email: "test@shop.local", company: "C001" },
  })
  check("คืนค่า id ที่ autoincrement", typeof user.id === "number" && user.id > 0, user.id)
  eq("ใช้ค่า @default ให้เอง", user.package, "Free")
  eq("ใช้ค่า @default(\"Active\")", user.status, "Active")
  check("@default(now()) เป็น Date", user.createdAt instanceof Date, user.createdAt)

  // ------------------------------------------------------------ find/where
  console.log("\nfindMany / where / orderBy")
  await prisma.datalist.createMany({
    data: [
      { company: "C001", code: "P001", ProductName: "พาราเซตามอล 500mg", Barcode: "8850001", Min: 10, price: 25 },
      { company: "C001", code: "P002", ProductName: "Amoxicillin 500", Barcode: "8850002", Min: 5, price: 120 },
      { company: "C001", code: "P003", ProductName: "ยาแก้ไอ", Barcode: "8850003", Min: 0, price: 60 },
      { company: "C002", code: "P004", ProductName: "ของร้านอื่น", Barcode: "8850004", Min: 3, price: 10 },
    ],
  })

  const all = await prisma.datalist.findMany({ where: { company: "C001" } })
  eq("กรองด้วย company", all.length, 3)

  const byName = await prisma.datalist.findMany({
    where: { company: "C001", ProductName: { contains: "พารา" } },
  })
  eq("contains ภาษาไทย", byName.length, 1)

  const insensitive = await prisma.datalist.findMany({
    where: { ProductName: { contains: "amox", mode: "insensitive" } },
  })
  eq("contains + mode:insensitive", insensitive.length, 1)

  const sensitive = await prisma.datalist.findMany({
    where: { ProductName: { contains: "amox" } },
  })
  eq("contains แบบสนตัวพิมพ์ (ตรงกับ Postgres)", sensitive.length, 0)

  const startsWith = await prisma.datalist.findMany({ where: { Barcode: { startsWith: "885000" } } })
  eq("startsWith", startsWith.length, 4)

  const gt = await prisma.datalist.findMany({ where: { company: "C001", Min: { gt: 0 } } })
  eq("ตัวดำเนินการ gt", gt.length, 2)

  const inList = await prisma.datalist.findMany({ where: { code: { in: ["P001", "P003"] } } })
  eq("in", inList.length, 2)

  const orQuery = await prisma.datalist.findMany({
    where: { OR: [{ code: "P001" }, { code: "P004" }] },
  })
  eq("OR", orQuery.length, 2)

  const notQuery = await prisma.datalist.findMany({
    where: { company: "C001", NOT: { code: "P001" } },
  })
  eq("NOT", notQuery.length, 2)

  const ordered = await prisma.datalist.findMany({
    where: { company: "C001" },
    orderBy: { price: "desc" },
  })
  eq("orderBy desc", ordered.map((r: any) => r.code), ["P002", "P003", "P001"])

  const paged = await prisma.datalist.findMany({
    where: { company: "C001" },
    orderBy: { code: "asc" },
    skip: 1,
    take: 1,
  })
  eq("skip + take", paged.map((r: any) => r.code), ["P002"])

  const selected = await prisma.datalist.findMany({
    where: { code: "P001" },
    select: { code: true, ProductName: true },
  })
  eq("select คืนเฉพาะฟิลด์ที่ขอ", Object.keys(selected[0]).sort(), ["ProductName", "code"])

  const first = await prisma.datalist.findFirst({ where: { company: "C001" }, orderBy: { code: "asc" } })
  eq("findFirst", first.code, "P001")

  const unique = await prisma.user.findUnique({ where: { id: user.id } })
  eq("findUnique ด้วย id", unique.email, "test@shop.local")

  const missing = await prisma.datalist.findFirst({ where: { code: "ไม่มีจริง" } })
  eq("ไม่เจอคืน null", missing, null)

  // ----------------------------------------------------------- null order
  console.log("\nการเรียง NULL (ต้องเหมือน Postgres)")
  await prisma.datalist.create({ data: { company: "C009", code: "N1", price: null } })
  await prisma.datalist.create({ data: { company: "C009", code: "N2", price: 5 } })
  const nullsAsc = await prisma.datalist.findMany({ where: { company: "C009" }, orderBy: { price: "asc" } })
  eq("ASC -> NULL อยู่ท้าย", nullsAsc.map((r: any) => r.code), ["N2", "N1"])
  const nullsDesc = await prisma.datalist.findMany({ where: { company: "C009" }, orderBy: { price: "desc" } })
  eq("DESC -> NULL อยู่หน้า", nullsDesc.map((r: any) => r.code), ["N1", "N2"])

  // ---------------------------------------------------------------- update
  console.log("\nupdate / increment / decrement")
  const target = await prisma.datalist.findFirst({ where: { code: "P001" } })
  await prisma.datalist.update({ where: { id: target.id }, data: { Min: { decrement: 3 } } })
  const afterDec = await prisma.datalist.findFirst({ where: { code: "P001" } })
  eq("decrement", afterDec.Min, 7)

  await prisma.datalist.update({ where: { id: target.id }, data: { Min: { increment: 10 } } })
  const afterInc = await prisma.datalist.findFirst({ where: { code: "P001" } })
  eq("increment", afterInc.Min, 17)

  await prisma.datalist.update({ where: { id: target.id }, data: { ProductName: "ชื่อใหม่" } })
  const renamed = await prisma.datalist.findFirst({ where: { id: target.id } })
  eq("แก้ค่าธรรมดา", renamed.ProductName, "ชื่อใหม่")

  const many = await prisma.datalist.updateMany({
    where: { company: "C001" },
    data: { Area: "โซน A" },
  })
  eq("updateMany คืนจำนวนแถว", many.count, 3)

  // ---------------------------------------------------------------- upsert
  console.log("\nupsert")
  const up1 = await prisma.datalist.upsert({
    where: { id: 999999 },
    create: { company: "C001", code: "P900", ProductName: "สร้างใหม่" },
    update: { ProductName: "ไม่ควรถูกใช้" },
  })
  eq("upsert -> create", up1.ProductName, "สร้างใหม่")

  const up2 = await prisma.datalist.upsert({
    where: { id: up1.id },
    create: { company: "C001", code: "P901" },
    update: { ProductName: "อัปเดตแล้ว" },
  })
  eq("upsert -> update", up2.ProductName, "อัปเดตแล้ว")

  // ----------------------------------------------------------------- count
  console.log("\ncount / aggregate / groupBy")
  const total = await prisma.datalist.count({ where: { company: "C001" } })
  eq("count", total, 4)

  const agg = await prisma.datalist.aggregate({
    where: { company: "C001" },
    _sum: { Min: true },
    _count: true,
    _avg: { price: true },
    _max: { price: true },
  })
  eq("_sum", agg._sum.Min, 22)
  eq("_count: true", agg._count, 4)
  eq("_max", agg._max.price, 120)
  check("_avg เป็นตัวเลข", typeof agg._avg.price === "number", agg._avg)

  const grouped = await prisma.datalist.groupBy({
    by: ["company"],
    _sum: { Min: true },
    _count: true,
    orderBy: { company: "asc" },
  })
  eq("groupBy คืนตามจำนวนกลุ่ม", grouped.length, 3)
  eq("groupBy กลุ่มแรก", grouped[0].company, "C001")
  eq("groupBy _sum", grouped[0]._sum.Min, 22)

  // --------------------------------------------------------------- include
  console.log("\ninclude / relation")
  const emp = await prisma.settingEmployee.create({
    data: { name: "พนักงาน A", company: "C001", id_company: user.id },
  })
  await prisma.employeePermission.createMany({
    data: [
      { employeeId: emp.id, codename: "sale", allowed: true },
      { employeeId: emp.id, codename: "stock", allowed: false },
    ],
  })

  const withPerms = await prisma.settingEmployee.findUnique({
    where: { id: emp.id },
    include: { permissions: true },
  })
  eq("include รายการลูก", withPerms.permissions.length, 2)
  check("Boolean แปลงกลับถูก", withPerms.permissions[0].allowed === true, withPerms.permissions[0].allowed)

  const withUser = await prisma.settingEmployee.findUnique({
    where: { id: emp.id },
    include: { users: true },
  })
  eq("include ฝั่งเจ้าของ FK", withUser.users?.email, "test@shop.local")

  const filteredInclude = await prisma.settingEmployee.findUnique({
    where: { id: emp.id },
    include: { permissions: { where: { allowed: true } } },
  })
  eq("include + where", filteredInclude.permissions.length, 1)

  const userWithEmployees = await prisma.user.findUnique({
    where: { id: user.id },
    include: { employees: true },
  })
  eq("include ฝั่งตรงข้าม (list)", userWithEmployees.employees.length, 1)

  // ---------------------------------------------------- relation filter
  const empsWithView = await prisma.settingEmployee.findMany({
    where: { permissions: { some: { allowed: true } } },
  })
  eq("relation filter some", empsWithView.length, 1)

  const empsNone = await prisma.settingEmployee.findMany({
    where: { permissions: { none: { codename: "sale" } } },
  })
  eq("relation filter none", empsNone.length, 0)

  // ------------------------------------------------------------ datetime
  console.log("\nชนิดข้อมูล")
  const when = new Date("2026-03-15T08:30:00.000Z")
  const sale = await prisma.saleMain.create({
    data: { companyall: "C001", orderNo: "S001", createDate: when, sumtotal: 250.5 },
  })
  check("DateTime คืนเป็น Date", sale.createDate instanceof Date, sale.createDate)
  eq("DateTime ค่าตรง", sale.createDate.toISOString(), when.toISOString())
  eq("Float ค่าตรง", sale.sumtotal, 250.5)

  const inRange = await prisma.saleMain.findMany({
    where: {
      createDate: { gte: new Date("2026-03-01T00:00:00Z"), lt: new Date("2026-04-01T00:00:00Z") },
    },
  })
  eq("ค้นด้วยช่วงวันที่", inRange.length, 1)

  const outRange = await prisma.saleMain.findMany({
    where: { createDate: { gte: new Date("2026-04-01T00:00:00Z") } },
  })
  eq("นอกช่วงไม่เจอ", outRange.length, 0)

  // ----------------------------------------------------------- transaction
  console.log("\ntransaction")
  const before = await prisma.datalist.count({})
  try {
    await prisma.$transaction(async (tx: any) => {
      await tx.datalist.create({ data: { company: "CTX", code: "TX1" } })
      throw new Error("ตั้งใจให้พังเพื่อทดสอบ rollback")
    })
  } catch {
    // คาดไว้แล้ว
  }
  const afterRollback = await prisma.datalist.count({})
  eq("rollback แล้วข้อมูลไม่ค้าง", afterRollback, before)

  await prisma.$transaction(async (tx: any) => {
    await tx.datalist.create({ data: { company: "CTX", code: "TX2" } })
    await tx.datalist.create({ data: { company: "CTX", code: "TX3" } })
  })
  const afterCommit = await prisma.datalist.count({ where: { company: "CTX" } })
  eq("commit แล้วข้อมูลครบ", afterCommit, 2)

  // ------------------------------------------------------------- delete
  console.log("\ndelete")
  const toDelete = await prisma.datalist.findFirst({ where: { code: "TX2" } })
  const deleted = await prisma.datalist.delete({ where: { id: toDelete.id } })
  eq("delete คืนแถวที่ลบ", deleted.code, "TX2")
  eq("ลบแล้วหายจริง", await prisma.datalist.count({ where: { code: "TX2" } }), 0)

  const delMany = await prisma.datalist.deleteMany({ where: { company: "CTX" } })
  eq("deleteMany", delMany.count, 1)

  // ---------------------------------------------------------------- raw
  console.log("\nraw query")
  const raw = await prisma.$queryRawUnsafe(
    'SELECT COUNT(*) AS n FROM "Datalist" WHERE "company" = ?',
    "C001"
  )
  eq("$queryRawUnsafe", Number(raw[0].n), 4)

  const tagged = await prisma.$queryRaw`SELECT COUNT(*) AS n FROM "Datalist" WHERE "company" = ${"C001"}`
  eq("$queryRaw แบบ template", Number(tagged[0].n), 4)

  // ------------------------------------------------------------ summary
  console.log(`\n${"─".repeat(50)}`)
  console.log(`ผ่าน ${passed} / ล้มเหลว ${failed}`)
  if (failed > 0) process.exitCode = 1
}

main().catch((err) => {
  console.error("\nการทดสอบพังกลางคัน:", err)
  process.exitCode = 1
})
