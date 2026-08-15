// ตรวจว่าโค้ดกำลังรันอยู่บนแพลตฟอร์มไหน — ใช้ร่วมกันทั้ง runtime layer และ native bridge
// แยกไฟล์ออกมาเพื่อไม่ให้ serverUrl กับ native/index อ้างอิงวนกัน

export type BuildTarget = "web" | "mobile";
export type Platform = "android" | "ios" | "electron" | "browser" | "server";

/** ตั้งตอน build จาก next.config.ts (BUILD_TARGET=mobile) — คงที่ตลอด runtime */
export const BUILD_TARGET: BuildTarget =
  process.env.NEXT_PUBLIC_BUILD_TARGET === "mobile" ? "mobile" : "web";

/** true = โค้ดชุดนี้ถูก build ไปอยู่ใน .apk */
export const isMobileBuild = BUILD_TARGET === "mobile";

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** รันอยู่ใน Capacitor WebView (Android/iOS) หรือไม่ */
export function isNativeApp(): boolean {
  if (!isBrowser()) return false;
  const cap = (window as any).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export function isElectron(): boolean {
  if (!isBrowser()) return false;
  return Boolean((window as any).electronAPI || (window as any).electron);
}

export function getPlatform(): Platform {
  if (!isBrowser()) return "server";

  const cap = (window as any).Capacitor;
  if (cap?.isNativePlatform?.()) {
    const name = String(cap.getPlatform?.() || "");
    if (name === "android") return "android";
    if (name === "ios") return "ios";
  }

  if (isElectron()) return "electron";
  return "browser";
}
