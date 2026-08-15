// สแกนบาร์โค้ดแบบข้ามแพลตฟอร์ม
//
// บน Android ใช้ ML Kit ผ่าน @capacitor-mlkit/barcode-scanning ซึ่งเร็วและโฟกัสดีกว่า
// การถอดรหัสด้วย JavaScript ใน WebView มาก — เป็นจุดที่พนักงานสัมผัสบ่อยที่สุดในงานขาย
//
// บนเดสก์ท็อป/เบราว์เซอร์คืน supported = false ให้หน้าเดิมใช้ตัวสแกนแบบ web
// (html5-qrcode / @yudiel/react-qr-scanner) ต่อไปตามเดิม

import { getPlatform } from "./platform";

export type ScanResult = {
  /** ค่าที่อ่านได้ — ว่างแปลว่าผู้ใช้กดยกเลิก */
  value: string;
  /** รูปแบบบาร์โค้ดที่อ่านได้ เช่น EAN_13, CODE_128, QR_CODE */
  format?: string;
};

/** ใช้ตัวสแกน native ได้หรือไม่ ถ้าไม่ได้ให้หน้าเดิม fallback ไปตัวสแกนแบบ web */
export function isNativeScannerAvailable(): boolean {
  const platform = getPlatform();
  return platform === "android" || platform === "ios";
}

/**
 * ML Kit บน Android บางรุ่นต้องดาวน์โหลดโมดูลจาก Google Play Services ก่อนใช้ครั้งแรก
 * เรียกล่วงหน้าตอนเข้าหน้าขายจะได้ไม่ต้องรอตอนกดสแกนจริง
 */
export async function prepareScanner(): Promise<void> {
  if (!isNativeScannerAvailable()) return;

  try {
    const { BarcodeScanner } = await import("@capacitor-mlkit/barcode-scanning");

    const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
    if (!available) {
      await BarcodeScanner.installGoogleBarcodeScannerModule();
    }
  } catch {
    // ถ้าเตรียมไม่สำเร็จ ตอนกดสแกนจริงจะพยายามใหม่อีกครั้งเอง
  }
}

/** ขอสิทธิ์กล้อง คืน true เมื่อใช้กล้องได้ */
export async function ensureCameraPermission(): Promise<boolean> {
  if (!isNativeScannerAvailable()) return false;

  try {
    const { BarcodeScanner } = await import("@capacitor-mlkit/barcode-scanning");

    const current = await BarcodeScanner.checkPermissions();
    if (current.camera === "granted" || current.camera === "limited") return true;

    const requested = await BarcodeScanner.requestPermissions();
    return requested.camera === "granted" || requested.camera === "limited";
  } catch {
    return false;
  }
}

/**
 * เปิดหน้าสแกนของ ML Kit แล้วคืนค่าที่อ่านได้
 * คืน null เมื่อผู้ใช้ยกเลิก หรือเมื่อแพลตฟอร์มนี้ไม่มีตัวสแกน native
 *
 * รูปแบบบาร์โค้ดจำกัดไว้เท่าที่ร้านยาใช้จริง เพื่อลดการอ่านผิดเป็นรูปแบบอื่น
 */
export async function scanBarcode(): Promise<ScanResult | null> {
  if (!isNativeScannerAvailable()) return null;

  const granted = await ensureCameraPermission();
  if (!granted) {
    throw new Error("ไม่ได้รับอนุญาตให้ใช้กล้อง — เปิดสิทธิ์กล้องในการตั้งค่าแอปก่อน");
  }

  const { BarcodeScanner, BarcodeFormat } = await import("@capacitor-mlkit/barcode-scanning");

  const { barcodes } = await BarcodeScanner.scan({
    formats: [
      BarcodeFormat.Ean13,
      BarcodeFormat.Ean8,
      BarcodeFormat.UpcA,
      BarcodeFormat.UpcE,
      BarcodeFormat.Code128,
      BarcodeFormat.Code39,
      BarcodeFormat.Itf,
      BarcodeFormat.QrCode,
    ],
  });

  if (!barcodes.length) return null;

  // บาร์โค้ดบางชนิด (เช่นภาพเสียบางส่วน) อ่าน rawValue ไม่ได้ ถือว่าสแกนไม่สำเร็จ
  const value = barcodes[0].rawValue ?? barcodes[0].displayValue;
  if (!value) return null;

  return {
    value,
    format: String(barcodes[0].format),
  };
}
