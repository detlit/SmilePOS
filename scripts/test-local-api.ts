// ทดสอบทั้งเส้นทางแบบ end-to-end: ยิง /api/... เข้าเราเตอร์ในเครื่อง
//
// นี่คือเทสต์ที่ใกล้ของจริงที่สุดที่รันได้โดยไม่ต้องมีเครื่อง Android — เดินครบทุกชั้น
//
//   dispatch("/api/...")
//        -> จับคู่ route
//        -> route handler ตัวจริงจาก src/app/api (ไม่ได้เขียนใหม่)
//        -> NextRequest/NextResponse ฉบับ WebView
//        -> prismaLite
//        -> SQLite
//
// รันด้วย: npm run test:mobile-api

// ต้องมาก่อน import อื่นทั้งหมด — ตั้งค่าการ resolve ชื่อโมดูลแบบย่อให้เหมือนตอน build จริง
import "./fixtures/module-alias"

import { DatabaseSync } from "node:sqlite"
import { setDriver, type SqliteDriver } from "../src/lib/mobile/db/sqlite"
import { ensureSchema } from "../src/lib/mobile/db/migrate"
import { dispatch, hasLocalRoute, localRouteCount } from "../src/lib/mobile/api/router"

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

/** เรียก API เหมือนที่หน้าจอเรียก แล้วคืนทั้งสถานะและเนื้อหา */
async function call(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<{ status: number; data: any }> {
  const response = await dispatch(path, {
    method: init.method || "GET",
    headers: init.body ? { "content-type": "application/json" } : undefined,
    body: init.body ? JSON.stringify(init.body) : null,
  })

  const text = await response.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  return { status: response.status, data }
}

async function main() {
  await ensureSchema()
  console.log(`\nเราเตอร์ในเครื่อง: ${localRouteCount()} เส้นทาง\n`)

  // ------------------------------------------------------- การจับคู่เส้นทาง
  console.log("การจับคู่เส้นทาง")
  check("รู้จัก /api/datalist", hasLocalRoute("/api/datalist"))
  check("ไม่รู้จัก /api/ที่ไม่มีจริง", !hasLocalRoute("/api/ไม่มีจริง"))

  const notFound = await call("/api/ไม่มีจริง")
  check("path ที่ไม่มี -> 404", notFound.status === 404, notFound)

  const serverOnly = await call("/api/setting/uploadImage", { method: "POST", body: {} })
  check("route ที่ต้องใช้ server -> 501", serverOnly.status === 501, serverOnly)
  check(
    "501 บอกสาเหตุเป็นภาษาไทย",
    typeof serverOnly.data?.error === "string" && serverOnly.data.error.includes("เครื่องคอมพิวเตอร์"),
    serverOnly.data
  )

  // ------------------------------------------------------------------ health
  console.log("\nGET /api/health")
  const health = await call("/api/health")
  check("ตอบ 200", health.status === 200, health)
  check("ok = true", health.data?.ok === true, health.data)

  // ------------------------------------------------------- สมัคร + เข้าสู่ระบบ
  console.log("\nPOST /api/login/register  (สร้างบัญชีร้านครั้งแรก)")
  const register = await call("/api/login/register", {
    method: "POST",
    body: {
      name: "ร้านยาทดสอบ",
      company: "C001",
      tel: "021234567",
      email: "owner@shop.local",
      password: "secret123",
      status: "Active",
      enddate: new Date("2030-01-01").toISOString(),
      employees: [{ name: "เจ้าของร้าน", company: "C001", position: "เจ้าของกิจการ" }],
    },
  })
  check("สมัครสำเร็จ 200", register.status === 200, register)
  check("ได้ id กลับมา", typeof register.data?.id === "number", register.data)
  check("อีเมลตรง", register.data?.email === "owner@shop.local", register.data)

  const duplicate = await call("/api/login/register", {
    method: "POST",
    body: { email: "owner@shop.local", password: "x", company: "C001", employees: [] },
  })
  check("สมัครซ้ำ -> 400", duplicate.status === 400, duplicate)
  check("บอกว่าอีเมลซ้ำ", duplicate.data?.error === "อีเมลนี้ถูกใช้งานแล้ว", duplicate.data)

  console.log("\nPOST /api/login/logins  (เข้าสู่ระบบ)")
  const login = await call("/api/login/logins", {
    method: "POST",
    body: { email: "owner@shop.local", password: "secret123" },
  })
  check("เข้าสู่ระบบสำเร็จ", login.status === 200, login)
  check(
    "ได้ token รูปแบบ JWT",
    typeof login.data?.token === "string" && login.data.token.split(".").length === 3,
    login.data
  )

  const badLogin = await call("/api/login/logins", {
    method: "POST",
    body: { email: "owner@shop.local", password: "ผิด" },
  })
  check("รหัสผ่านผิด -> 400", badLogin.status === 400, badLogin)

  const noUser = await call("/api/login/logins", {
    method: "POST",
    body: { email: "ไม่มีคนนี้@shop.local", password: "x" },
  })
  check("ไม่มีผู้ใช้ -> 400", noUser.status === 400, noUser)

  // ----------------------------------------------------------------- สินค้า
  console.log("\nPOST/GET /api/datalist  (สินค้า)")
  const created = await call("/api/datalist", {
    method: "POST",
    body: {
      company: "C001",
      code: "P001",
      ProductName: "พาราเซตามอล 500mg",
      Barcode: "8850001234567",
      price: 25,
      Unit: "เม็ด",
    },
  })
  check("เพิ่มสินค้าได้", created.status >= 200 && created.status < 300, created)

  await call("/api/datalist", {
    method: "POST",
    body: { company: "C001", code: "P002", ProductName: "Amoxicillin 500", Barcode: "8850009999999", price: 120 },
  })

  const list = await call("/api/datalist?company=C001")
  check("ดึงรายการสินค้าได้", list.status === 200, { status: list.status })
  const items = Array.isArray(list.data) ? list.data : list.data?.data || list.data?.items
  check("ได้สินค้า 2 รายการ", Array.isArray(items) && items.length === 2, {
    type: typeof list.data,
    length: Array.isArray(items) ? items.length : undefined,
  })

  const byName = await call(`/api/datalist?company=C001&ProductName=${encodeURIComponent("พารา")}`)
  const found = Array.isArray(byName.data) ? byName.data : byName.data?.data
  check("ค้นด้วยชื่อภาษาไทยเจอ 1 รายการ", Array.isArray(found) && found.length === 1, {
    length: Array.isArray(found) ? found.length : undefined,
  })

  const byBarcode = await call("/api/datalist?company=C001&Barcode=885000123")
  const bc = Array.isArray(byBarcode.data) ? byBarcode.data : byBarcode.data?.data
  check("ค้นด้วยบาร์โค้ดเจอ", Array.isArray(bc) && bc.length === 1, {
    length: Array.isArray(bc) ? bc.length : undefined,
  })

  const otherCompany = await call("/api/datalist?company=C999")
  const none = Array.isArray(otherCompany.data) ? otherCompany.data : otherCompany.data?.data
  check("บริษัทอื่นไม่เห็นข้อมูล", Array.isArray(none) && none.length === 0, {
    length: Array.isArray(none) ? none.length : undefined,
  })

  // ----------------------------------------------------------------- ลูกค้า
  console.log("\nPOST/GET /api/customer  (ลูกค้า)")
  const customer = await call("/api/customer", {
    method: "POST",
    body: { company: "C001", names: "สมชาย ใจดี", tel: "0812345678" },
  })
  check("เพิ่มลูกค้าได้", customer.status >= 200 && customer.status < 300, customer)

  const customers = await call("/api/customer?company=C001")
  const custList = Array.isArray(customers.data) ? customers.data : customers.data?.data
  check("ดึงรายชื่อลูกค้าได้", Array.isArray(custList) && custList.length >= 1, {
    length: Array.isArray(custList) ? custList.length : undefined,
  })

  // ------------------------------------------------------------ เมธอดไม่รองรับ
  console.log("\nกรณีอื่น")
  const wrongMethod = await call("/api/health", { method: "DELETE" })
  check("เมธอดที่ handler ไม่มี -> 405", wrongMethod.status === 405, wrongMethod)

  console.log(`\n${"─".repeat(50)}`)
  console.log(`ผ่าน ${passed} / ล้มเหลว ${failed}`)
  if (failed > 0) process.exitCode = 1
}

main().catch((err) => {
  console.error("\nการทดสอบพังกลางคัน:", err)
  process.exitCode = 1
})
