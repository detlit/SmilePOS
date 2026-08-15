// ตัวแทนของ npm package ฝั่ง Node ที่ยกลงแท็บเล็ตไม่ได้ (sharp, formidable, pdf-to-printer, ...)
//
// route ที่ import พวกนี้ยังถูก bundle เข้า APK ตามปกติ แต่พอเรียกใช้จริงจะโยน error
// ที่บอกชื่อโมดูลชัด ๆ แล้วเราเตอร์จะแปลงเป็น HTTP 500 พร้อมข้อความ
// ดีกว่าตัด route ทิ้งตั้งแต่ตอน build เพราะบาง route import ไว้แต่ไม่ได้เรียกใช้ในทุกเส้นทาง

const MESSAGE =
  "ฟังก์ชันนี้ต้องใช้โมดูลฝั่ง Node ซึ่งทำงานบนแท็บเล็ตไม่ได้ " +
  "(เช่น ประมวลผลรูป อัปโหลดไฟล์ หรือสั่งพิมพ์ผ่านไดรเวอร์ Windows) — ให้ทำรายการนี้ที่เครื่องคอมพิวเตอร์แทน"

function fail(): never {
  throw new Error(MESSAGE)
}

/**
 * Proxy ที่โยน error ทุกทางเข้า ไม่ว่าจะถูกเรียกเป็นฟังก์ชัน, new, หรืออ่าน property
 * ยกเว้น property ที่ระบบ module ต้องอ่านตอน import — ไม่งั้นจะพังตั้งแต่ตอนโหลดไฟล์
 */
const stub: any = new Proxy(function () {} as any, {
  get(_target, prop) {
    if (prop === "__esModule") return true
    if (prop === "default") return stub
    if (prop === Symbol.toPrimitive || prop === Symbol.toStringTag) return undefined
    if (prop === "then") return undefined // กัน await เผลอมองว่าเป็น thenable
    return stub
  },
  apply: fail,
  construct: fail,
})

export default stub
export const UNSUPPORTED_NATIVE_MESSAGE = MESSAGE
