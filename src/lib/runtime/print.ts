// การพิมพ์แบบข้ามแพลตฟอร์ม
//
// เดิมหน้าขายเรียก window.electron.printSilent() ตรง ๆ ซึ่งมีเฉพาะบน Electron
// ไฟล์นี้ห่อไว้ให้เรียกแบบเดียวกันได้ทุกที่ โดยคง payload รูปแบบเดิมทุกฟิลด์
// เพื่อให้ฝั่งเดสก์ท็อปเดินเส้นทางเดิมเป๊ะ ๆ ไม่มีอะไรเปลี่ยน
//
// เส้นทางการพิมพ์ตามแพลตฟอร์ม:
//   electron  -> window.electron.printSilent (ของเดิม)
//   android   -> ส่งงานข้าม LAN ให้เครื่องเคาน์เตอร์พิมพ์ (โหมด server)
//                หรือส่ง ESC/POS ออกเครื่องพิมพ์ Bluetooth (โหมด bluetooth)
//   browser   -> window.print() ของเบราว์เซอร์

import { getPlatform } from "./platform";
import { getPreference, setPreference } from "./native";

/** payload เดิมของ Electron — ห้ามเปลี่ยนรูปแบบ ฝั่ง main process อ่านฟิลด์ชุดนี้ */
export type PrintPayload = {
  content: string;
  printerName?: string;
  horizontalOffset?: number;
};

export type PrintResult = { success: boolean; error?: string };

export type PrinterInfo = {
  name: string;
  displayName?: string;
  isDefault?: boolean;
};

/** โหมดพิมพ์บน Android — เก็บไว้ระดับเครื่อง ไม่ใช่ระดับผู้ใช้ */
export type PrintMode = "server" | "bluetooth";

const PRINT_MODE_KEY = "smilepos.printMode";

export async function getPrintMode(): Promise<PrintMode> {
  const saved = await getPreference(PRINT_MODE_KEY);
  return saved === "bluetooth" ? "bluetooth" : "server";
}

export async function setPrintMode(mode: PrintMode): Promise<void> {
  await setPreference(PRINT_MODE_KEY, mode);
}

/* ----------------------------------------------------------------- electron */

function electronPrinter(): any {
  if (typeof window === "undefined") return null;
  return (window as any).electron || null;
}

/* ------------------------------------------------------------------ ability */

/**
 * พิมพ์เงียบ (ไม่มีกล่อง dialog) ได้หรือไม่
 *
 * ใช้แทนการเช็ค `(window as any).electron?.printSilent` ที่กระจายอยู่ตามหน้าต่าง ๆ
 * บน Android ถือว่าได้เสมอ เพราะทั้งโหมด server และ bluetooth พิมพ์เงียบทั้งคู่
 * ตัวที่พิมพ์เงียบไม่ได้คือเบราว์เซอร์ล้วน ซึ่งต้องเด้ง dialog ของระบบ
 */
export function isSilentPrintAvailable(): boolean {
  const platform = getPlatform();

  if (platform === "electron") return Boolean(electronPrinter()?.printSilent);
  if (platform === "android" || platform === "ios") return true;

  return false;
}

/* ----------------------------------------------------------------- printers */

export async function getPrinters(): Promise<PrinterInfo[]> {
  const platform = getPlatform();

  if (platform === "electron") {
    const api = electronPrinter();
    if (!api?.getPrinters) return [];

    try {
      return await api.getPrinters();
    } catch {
      return [];
    }
  }

  if (platform === "android" || platform === "ios") {
    // อ่านรายชื่อเครื่องพิมพ์ที่ต่ออยู่กับเครื่องเคาน์เตอร์ผ่าน relay
    try {
      const response = await fetch("/api/print/printers", { cache: "no-store" });
      if (!response.ok) return [];

      const body = await response.json();
      return Array.isArray(body?.printers) ? body.printers : [];
    } catch {
      return [];
    }
  }

  return [];
}

/* -------------------------------------------------------------------- print */

/** ส่งงานพิมพ์ให้เครื่องเคาน์เตอร์ผ่าน relay แล้วรอผลจริงจาก Electron agent */
async function printViaServerRelay(payload: PrintPayload): Promise<PrintResult> {
  const response = await fetch("/api/print/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (response.status === 503) {
    throw new Error(
      body?.error ||
        "ไม่พบเครื่องพิมพ์ที่เคาน์เตอร์ — ตรวจว่าเปิดโปรแกรมบนเครื่อง Server ในโหมด Server แล้ว",
    );
  }

  if (!response.ok || !body?.success) {
    throw new Error(body?.error || `พิมพ์ไม่สำเร็จ (HTTP ${response.status})`);
  }

  return { success: true };
}

async function printViaBluetooth(_payload: PrintPayload): Promise<PrintResult> {
  // Phase 5: ต้องมีเทมเพลต ESC/POS แยกต่างหาก แปลง HTML ใบเสร็จตรง ๆ ไม่ได้
  throw new Error("ยังไม่ได้ตั้งค่าการพิมพ์ผ่าน Bluetooth — ไปที่ตั้งค่า > เครื่องพิมพ์");
}

/** พิมพ์ HTML ที่หน้าจอสร้างไว้ ผ่านเส้นทางที่เหมาะกับแพลตฟอร์มปัจจุบัน */
export async function printSilent(payload: PrintPayload): Promise<PrintResult> {
  if (!payload?.content?.trim()) {
    throw new Error("ไม่มีเนื้อหาสำหรับพิมพ์");
  }

  const platform = getPlatform();

  if (platform === "electron") {
    const api = electronPrinter();

    if (!api?.printSilent) {
      throw new Error("ไม่พบช่องทางการพิมพ์ของโปรแกรมเดสก์ท็อป");
    }

    return await api.printSilent(payload);
  }

  if (platform === "android" || platform === "ios") {
    const mode = await getPrintMode();
    return mode === "bluetooth"
      ? await printViaBluetooth(payload)
      : await printViaServerRelay(payload);
  }

  // เบราว์เซอร์ล้วน: พิมพ์ผ่าน dialog ของระบบ
  return await printViaBrowserDialog(payload);
}

/**
 * ทางออกสุดท้ายสำหรับเบราว์เซอร์ — เปิด iframe ซ่อนแล้วสั่งพิมพ์
 * ใช้ base href เดียวกับหน้าปัจจุบันเพื่อให้รูปและฟอนต์ในใบเสร็จโหลดได้
 */
function printViaBrowserDialog(payload: PrintPayload): Promise<PrintResult> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("พิมพ์ได้เฉพาะฝั่งเบราว์เซอร์"));
      return;
    }

    const offset = Number(payload.horizontalOffset || 0);
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";

    const cleanup = () => {
      window.setTimeout(() => iframe.remove(), 1000);
    };

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        resolve({ success: true });
      } catch (error: any) {
        reject(new Error(error?.message || "พิมพ์ไม่สำเร็จ"));
      } finally {
        cleanup();
      }
    };

    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    if (!doc) {
      iframe.remove();
      reject(new Error("สร้างหน้าสำหรับพิมพ์ไม่สำเร็จ"));
      return;
    }

    doc.open();
    doc.write(
      `<!doctype html><html><head><meta charset="utf-8">` +
        `<base href="${window.location.origin}/">` +
        `<style>@page{margin:0}html,body{margin:0;padding:0;background:#fff}` +
        `.print-root{width:fit-content;transform:translateX(${offset}px);transform-origin:top left}</style>` +
        `</head><body><div class="print-root">${payload.content}</div></body></html>`,
    );
    doc.close();
  });
}
