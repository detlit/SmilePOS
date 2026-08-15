// ตรวจว่า HS256 ที่เขียนเองใน src/lib/mobile/jwt.ts ให้ผลตรงกับ jsonwebtoken ของฝั่ง server
//
// สำคัญมาก เพราะ token ที่ออกจากแท็บเล็ตต้องถูกอ่านได้ด้วยกติกาเดียวกัน
// ถ้าไม่ตรง = ล็อกอินบนแอปแล้วใช้ไม่ได้ หรือแย่กว่านั้นคือ verify ผ่านทั้งที่ไม่ควรผ่าน
//
// รันด้วย: node scripts/run-ts.js scripts/test-mobile-jwt.ts

import crypto from "node:crypto"
import jwt from "jsonwebtoken"

// เลียนแบบ browser API ที่ไฟล์ jwt ฝั่ง mobile ใช้ ก่อน import มัน
const g = globalThis as any
if (typeof g.btoa !== "function") {
  g.btoa = (s: string) => Buffer.from(s, "binary").toString("base64")
}
if (typeof g.atob !== "function") {
  g.atob = (s: string) => Buffer.from(s, "base64").toString("binary")
}

const { signToken, verifyToken } = require("../src/lib/mobile/jwt") as typeof import("../src/lib/mobile/jwt")

const SECRET = process.env.JWT_SECRET || "MY_SECRET"

let passed = 0
let failed = 0

function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) {
    passed++
    console.log(`  ok   ${name}`)
  } else {
    failed++
    console.log(`  FAIL ${name}`)
    if (detail !== undefined) console.log("       ", detail)
  }
}

// ---------------------------------------------------------- SHA-256 ตรงไหม
// ใช้ทางอ้อม: ถ้า HMAC ตรงกับ Node แปลว่า SHA-256 ข้างในถูกต้อง
console.log("HMAC-SHA256 เทียบกับ node:crypto")
for (const message of ["", "abc", "ข้อความภาษาไทย", "a".repeat(200)]) {
  const mine = signToken({ m: message })
  const [head, claims, signature] = mine.split(".")
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(`${head}.${claims}`)
    .digest("base64url")
  check(`signature ตรงกับ node (len=${message.length})`, signature === expected, {
    mine: signature,
    node: expected,
  })
}

// ------------------------------------------------- jsonwebtoken อ่านได้ไหม
console.log("\njsonwebtoken ของฝั่ง server ต้องอ่าน token จากแท็บเล็ตได้")
const token = signToken({ id: 42, email: "test@shop.local" })
try {
  const decoded = jwt.verify(token, SECRET) as any
  check("verify ผ่าน", true)
  check("payload.id ตรง", decoded.id === 42, decoded)
  check("payload.email ตรง", decoded.email === "test@shop.local", decoded)
  check("มี exp", typeof decoded.exp === "number", decoded.exp)
  check(
    "อายุ 1 วันตามเดิม",
    decoded.exp - decoded.iat === 86400,
    decoded.exp - decoded.iat
  )
} catch (err) {
  check("verify ผ่าน", false, err)
}

// ------------------------------------------- อ่าน token ที่ server ออกให้ได้
console.log("\nแท็บเล็ตต้องอ่าน token ที่ server ออกให้ได้")
const serverToken = jwt.sign({ id: 7, email: "server@shop.local" }, SECRET, { expiresIn: "1d" })
const back = verifyToken(serverToken)
check("verifyToken อ่าน token จาก server ได้", back?.id === 7, back)

// ------------------------------------------------------------- กรณีปฏิเสธ
console.log("\nกรณีที่ต้องปฏิเสธ")
check("token มั่ว -> null", verifyToken("aaa.bbb.ccc") === null)
check("สตริงว่าง -> null", verifyToken("") === null)

const tampered = token.split(".")
tampered[1] = Buffer.from(JSON.stringify({ id: 999, exp: 9999999999 })).toString("base64url")
check("แก้ payload แล้ว signature ไม่ตรง -> null", verifyToken(tampered.join(".")) === null)

const expired = jwt.sign({ id: 1 }, SECRET, { expiresIn: "-1s" })
check("token หมดอายุ -> null", verifyToken(expired) === null)

const wrongSecret = jwt.sign({ id: 1 }, "another-secret", { expiresIn: "1d" })
check("เซ็นด้วย secret อื่น -> null", verifyToken(wrongSecret) === null)

console.log(`\n${"─".repeat(50)}`)
console.log(`ผ่าน ${passed} / ล้มเหลว ${failed}`)
if (failed > 0) process.exitCode = 1
