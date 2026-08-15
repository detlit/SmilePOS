// ตารางเส้นทางขนาดย่อสำหรับการทดสอบ end-to-end บน Node
//
// ของจริงตอน build จะ generate ครบทั้ง 299 route แต่การคอมไพล์ทั้งหมดในเทสต์ช้าเกินไป
// ที่นี่จึงเลือกเฉพาะ route ที่เป็นแกนของโหมด standalone มาพิสูจน์ว่าสายงานทั้งเส้นต่อกันติด:
//   เราเตอร์ -> handler เดิม -> shim ของ next/server -> prismaLite -> SQLite

export const ROUTES: Record<string, () => Promise<any>> = {
  "/api/login/register": () => import("../../src/app/api/login/register/route"),
  "/api/login/logins": () => import("../../src/app/api/login/logins/route"),
  "/api/datalist": () => import("../../src/app/api/datalist/route"),
  "/api/customer": () => import("../../src/app/api/customer/route"),
  "/api/health": () => import("../../src/app/api/health/route"),
  "/api/unit": () => import("../../src/app/api/unit/route"),
}

export const SERVER_ONLY_ROUTES: Record<string, string> = {
  "/api/setting/uploadImage": "next/cache",
}

export default ROUTES
