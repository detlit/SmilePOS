// ที่อยู่โฟลเดอร์ติดตั้งของระบบบนเครื่อง server (Windows)
//
// เดิมพาธนี้ถูก hardcode เป็น "C:\SmilePharmacy" กระจายอยู่ 11 จุดใน 8 ไฟล์
// พอย้ายที่ติดตั้งทีต้องไล่แก้ทุกไฟล์ และเคยหลุดจนโค้ดชี้ไปคนละที่กับที่ installer ติดตั้งจริง
//
// ตอนนี้รวมไว้ที่เดียว และ override ได้ด้วย environment variable SMILEPOS_HOME
// เผื่อเครื่องไหนติดตั้งไว้คนละไดรฟ์หรือยังใช้โฟลเดอร์เดิมอยู่:
//
//   SMILEPOS_HOME=C:\SmilePharmacy   (เครื่องที่ยังไม่ได้ย้าย)
//   SMILEPOS_HOME=D:\SmilePOS        (ติดตั้งคนละไดรฟ์)

/** โฟลเดอร์ราก — ต้องตรงกับ DefaultDirName ใน installer/setup.iss */
export const INSTALL_ROOT: string =
  (typeof process !== "undefined" && process.env.SMILEPOS_HOME) || "C:\\SmilePOS";

export const INSTALL_SCRIPTS = `${INSTALL_ROOT}\\scripts`;
export const INSTALL_LOGS = `${INSTALL_ROOT}\\logs`;
export const INSTALL_CONFIG = `${INSTALL_ROOT}\\config`;

/** ต่อพาธย่อยจากโฟลเดอร์ราก เช่น installPath("scripts", "update.ps1") */
export function installPath(...segments: string[]): string {
  return [INSTALL_ROOT, ...segments].join("\\");
}
