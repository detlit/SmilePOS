// ข้อมูลตั้งต้นตอนเปิดแอปครั้งแรกบนเครื่องเปล่า
//
// ตั้งใจให้เบามาก: ไม่ยัดข้อมูลตัวอย่างหรือบัญชีลับใด ๆ ลงเครื่องลูกค้า
// ผู้ใช้สร้างบัญชีร้านเองผ่านหน้าสมัครสมาชิกเดิม (POST /api/login/register)
// ซึ่งทำงานได้ครบอยู่แล้วบน prismaLite รวมถึงการสร้างพนักงานคนแรกแบบ nested create
//
// หน้าที่จริงของไฟล์นี้คือ "ทำให้แถวที่ระบบถือว่าต้องมี มีอยู่" เท่านั้น

import { prisma } from "./prismaLite"

let seeded = false

export async function seedIfEmpty(): Promise<void> {
  if (seeded) return
  seeded = true

  // เครื่องที่ใช้งานมาแล้วต้องไม่ถูกแตะ — ตรวจก่อนเสมอ
  const userCount = await prisma.user.count({})
  if (userCount > 0) return

  console.info("[seed] เครื่องนี้ยังไม่มีข้อมูลร้าน — รอผู้ใช้สมัครบัญชีที่หน้าเข้าสู่ระบบ")
}

/** true = ยังไม่มีบัญชีร้านในเครื่อง (UI ใช้ตัดสินใจพาไปหน้าสมัครสมาชิก) */
export async function isFirstRun(): Promise<boolean> {
  const userCount = await prisma.user.count({})
  return userCount === 0
}
