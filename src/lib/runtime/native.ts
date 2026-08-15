// สะพานเรียกปลั๊กอิน Capacitor จากโค้ด React ที่ใช้ร่วมกันทั้ง desktop และ Android
//
// ทุกปลั๊กอินโหลดแบบ dynamic import ตั้งใจให้ Electron/เบราว์เซอร์ไม่ต้องดึงโค้ด Capacitor
// เข้า bundle หลัก (โค้ดชุดเดียวกันนี้เสิร์ฟทั้งสองแพลตฟอร์มจาก server ตัวเดียว)
//
// ทุกฟังก์ชันในไฟล์นี้ปลอดภัยที่จะเรียกจากแพลตฟอร์มไหนก็ได้ — ถ้าไม่ได้อยู่ในแอป native
// จะคืนค่า fallback แทนการโยน error เพื่อให้หน้าเดิมบนเดสก์ท็อปทำงานได้เหมือนเดิม

import { isNativeApp } from "./platform";

/** key ที่ใช้ร่วมกับ mobile-shell/connect.js — ต้องตรงกัน */
export const SERVER_URL_KEY = "smilepos.serverUrl";

/* ------------------------------------------------------------ preferences */

/** อ่านค่าที่เก็บถาวรระดับเครื่อง (SharedPreferences) — ต่างจาก localStorage ตรงที่ผูกกับเครื่องไม่ใช่ origin */
export async function getPreference(key: string): Promise<string | null> {
  if (!isNativeApp()) return null;

  try {
    const { Preferences } = await import("@capacitor/preferences");
    const { value } = await Preferences.get({ key });
    return value ?? null;
  } catch {
    return null;
  }
}

export async function setPreference(key: string, value: string): Promise<void> {
  if (!isNativeApp()) return;

  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key, value });
  } catch {
    // เก็บค่าไม่ได้ไม่ควรทำให้การขายสะดุด
  }
}

export async function removePreference(key: string): Promise<void> {
  if (!isNativeApp()) return;

  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.remove({ key });
  } catch {
    // เช่นเดียวกับ setPreference
  }
}

/* ---------------------------------------------------------------- network */

export type NetworkStatus = { connected: boolean; connectionType: string };

export async function getNetworkStatus(): Promise<NetworkStatus> {
  if (!isNativeApp()) {
    const online = typeof navigator === "undefined" ? true : navigator.onLine;
    return { connected: online, connectionType: "unknown" };
  }

  try {
    const { Network } = await import("@capacitor/network");
    const status = await Network.getStatus();
    return { connected: status.connected, connectionType: status.connectionType };
  } catch {
    return { connected: true, connectionType: "unknown" };
  }
}

/** คืนฟังก์ชันสำหรับยกเลิกการติดตาม */
export async function onNetworkChange(
  handler: (status: NetworkStatus) => void,
): Promise<() => void> {
  if (!isNativeApp()) {
    if (typeof window === "undefined") return () => undefined;

    const online = () => handler({ connected: true, connectionType: "unknown" });
    const offline = () => handler({ connected: false, connectionType: "none" });

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }

  try {
    const { Network } = await import("@capacitor/network");
    const listener = await Network.addListener("networkStatusChange", (status) => {
      handler({ connected: status.connected, connectionType: status.connectionType });
    });

    return () => listener.remove();
  } catch {
    return () => undefined;
  }
}

/* -------------------------------------------------------------- back button */

/**
 * ดักปุ่ม Back ของ Android
 * handler คืน true = จัดการเองแล้ว, false = ปล่อยให้ระบบทำงานตามปกติ
 */
export async function onBackButton(handler: () => boolean): Promise<() => void> {
  if (!isNativeApp()) return () => undefined;

  try {
    const { App } = await import("@capacitor/app");
    const listener = await App.addListener("backButton", () => {
      const handled = handler();
      if (!handled) App.minimizeApp();
    });

    return () => listener.remove();
  } catch {
    return () => undefined;
  }
}

export async function exitApp(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    const { App } = await import("@capacitor/app");
    await App.exitApp();
  } catch {
    // ไม่มีอะไรต้องทำต่อถ้าปิดแอปไม่ได้
  }
}

/* ------------------------------------------------------------------ chrome */

/** ตั้งสีแถบสถานะให้เข้ากับธีมแอป เรียกครั้งเดียวตอน mount */
export async function applyStatusBarTheme(backgroundColor = "#3e86c7"): Promise<void> {
  if (!isNativeApp()) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: backgroundColor });
  } catch {
    // แท็บเล็ตบางรุ่นตั้งสีแถบสถานะไม่ได้ ไม่ถือเป็นข้อผิดพลาด
  }
}

/** ล็อกแนวจอ — หน้าขายใช้แนวนอนสะดวกกว่า แต่ปล่อยให้หน้าอื่นเลือกเองได้ */
export async function lockOrientation(
  orientation: "portrait" | "landscape",
): Promise<void> {
  if (!isNativeApp()) return;

  try {
    const { ScreenOrientation } = await import("@capacitor/screen-orientation");
    await ScreenOrientation.lock({ orientation });
  } catch {
    // ไม่รองรับก็ปล่อยหมุนอิสระตามเดิม
  }
}

export async function unlockOrientation(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    const { ScreenOrientation } = await import("@capacitor/screen-orientation");
    await ScreenOrientation.unlock();
  } catch {
    // เช่นเดียวกับ lockOrientation
  }
}

export async function hideSplashScreen(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    // splash หายเองตาม launchShowDuration อยู่แล้ว
  }
}

/* ---------------------------------------------------------------- pay lock */

// B4 กันทุจริต: ระหว่างอยู่หน้าชำระเงินต้องออกจากหน้าไม่ได้
//   เดสก์ท็อป — Electron main process บล็อกการปิดหน้าต่าง/รีเฟรช/Ctrl+W
//   Android   — ต้องบล็อกปุ่ม Back ของเครื่องด้วย ไม่งั้นกดออกจากบิลกลางคันได้
// เก็บสถานะไว้ที่ตัวแปรระดับโมดูลเพื่อให้ NativeAppShell อ่านได้ตอนปุ่ม Back ถูกกด
let payLocked = false;

export function isPayLocked(): boolean {
  return payLocked;
}

export function setPayLock(locked: boolean): void {
  payLocked = locked;

  if (typeof window === "undefined") return;

  try {
    (window as any).electron?.setPayLock?.(locked);
  } catch {
    // ไม่ได้รันบน Electron ก็ใช้แค่ธงฝั่ง JS ข้างบน
  }
}

/* ------------------------------------------------------------------ server */

/**
 * ล้างค่า server ที่จับคู่ไว้แล้วกลับไปหน้าจับคู่
 * ใช้ตอนย้ายเครื่อง server หรือ IP เปลี่ยน
 *
 * ต้องให้ฝั่ง native เปิดแอปใหม่ ไม่ใช่แค่เปลี่ยน URL เพราะ origin ของแอป
 * ถูกกำหนดตอนสร้าง Bridge ครั้งเดียว (ดู MainActivity.applyPairedServerConfig)
 */
export async function resetServerPairing(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    const cap = (window as any).Capacitor;
    const shell = cap?.Plugins?.SmilePosShell;

    if (shell?.resetPairing) {
      await shell.resetPairing();
      return;
    }
  } catch {
    // ตกไปใช้ทางสำรองด้านล่าง
  }

  // ทางสำรอง: ลบค่าแล้วให้ผู้ใช้เปิดแอปใหม่เอง
  await removePreference(SERVER_URL_KEY);
}
