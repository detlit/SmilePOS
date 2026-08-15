// แทนที่ `next/cache` ตอน build โหมด mobile
//
// ฟังก์ชันในนั้นสั่งให้ Next server ล้างแคชของหน้าที่ระบุ ซึ่งเป็นเรื่องของฝั่ง server ล้วน ๆ
// แอป standalone ไม่มี server และไม่มีแคชแบบนั้นให้ล้าง — หน้าจอดึงข้อมูลใหม่จาก SQLite
// ทุกครั้งที่ผู้ใช้เปิดอยู่แล้ว จึงปล่อยเป็นฟังก์ชันเปล่าได้อย่างปลอดภัย
//
// ที่ต้องมีไฟล์นี้เพราะ Next ปฏิเสธการ import next/cache เข้าไปใน client bundle ตั้งแต่ตอน build

export function revalidatePath(_path: string, _type?: "layout" | "page"): void {
  // ไม่มีแคชฝั่ง server ให้ล้าง
}

export function revalidateTag(_tag: string): void {
  // เช่นเดียวกัน
}

export function unstable_cache<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  // ไม่แคช — เรียกฟังก์ชันเดิมตรง ๆ
  return fn
}

export function unstable_noStore(): void {
  // ไม่ต้องทำอะไร
}

export const revalidate = 0
