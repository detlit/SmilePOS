// ตัวแทนของตารางเส้นทาง API ที่ใช้ตอน build ปกติ (เว็บ/Docker/Electron)
//
// ในโหมดนั้น API ทำงานที่ Next.js server อยู่แล้ว จึงไม่มี route ไหนต้องฝังในฝั่ง client
// ตอน build โหมด mobile ไฟล์นี้จะถูก alias สลับไปเป็น registry.generated.ts แทน
// (ดู next.config.ts) ทำให้ทั้งสองโหมดใช้โค้ดชุดเดียวกันได้โดยไม่ต้อง if/else

export const ROUTES: Record<string, () => Promise<any>> = {}

export const SERVER_ONLY_ROUTES: Record<string, string> = {}

export default ROUTES
