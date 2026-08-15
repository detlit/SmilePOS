"use client";

// พฤติกรรมระดับ "เปลือกแอป" ที่ต้องมีเมื่อ UI ชุดเดียวกันนี้ถูกเปิดในแอป Android
//
// คอมโพเนนต์นี้อยู่ใน root layout และไม่ทำอะไรเลยบนเดสก์ท็อป/เบราว์เซอร์ —
// ทุกอย่างข้างในกันด้วย isNativeApp() เพื่อไม่ให้กระทบเครื่องขายหน้าร้านที่ใช้ Electron อยู่

import { useEffect, useState } from "react";

import { isNativeApp } from "@/lib/runtime/platform";
import {
  applyStatusBarTheme,
  hideSplashScreen,
  isPayLocked,
  onBackButton,
  onNetworkChange,
  getNetworkStatus,
} from "@/lib/runtime/native";

/**
 * CSS ที่ทำให้ WebView รู้สึกเป็นแอปจริง ไม่ใช่หน้าเว็บในเบราว์เซอร์
 * ใส่เฉพาะตอนรันใน native เท่านั้น เพื่อไม่ให้ไปแตะ UI ฝั่งเดสก์ท็อป
 */
const NATIVE_CSS = `
  html, body {
    overscroll-behavior-y: none;   /* กันลากลงแล้วรีเฟรชหน้ากลางบิล */
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;   /* กดค้างแล้วไม่เด้งเมนู copy/share */
  }

  /* ช่องกรอกยังต้องเลือกข้อความได้ตามปกติ */
  input, textarea, [contenteditable="true"] {
    -webkit-user-select: text;
    user-select: text;
  }

  /* เว้นพื้นที่ให้ notch และแถบ gesture ของ Android */
  body {
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  /* ปุ่มบนแท็บเล็ตต้องกดโดนง่าย ตามเกณฑ์ขั้นต่ำ 44px */
  button, [role="button"] {
    touch-action: manipulation;
  }
`;

const BANNER_STYLE: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 99999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  minHeight: 48,
  padding: "10px 16px",
  paddingTop: "calc(10px + env(safe-area-inset-top, 0px))",
  background: "#fff7ed",
  color: "#9a3412",
  borderBottom: "1px solid #fed7aa",
  fontFamily: "Kanit, sans-serif",
  fontSize: 15,
  fontWeight: 600,
};

export default function NativeAppShell() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!isNativeApp()) return;

    const style = document.createElement("style");
    style.setAttribute("data-native-shell", "");
    style.textContent = NATIVE_CSS;
    document.head.appendChild(style);

    hideSplashScreen();
    applyStatusBarTheme();

    let disposed = false;
    const cleanups: Array<() => void> = [];

    const register = (cleanup: () => void) => {
      // effect อาจถูก unmount ระหว่างรอ dynamic import — เก็บกวาดให้ครบ
      if (disposed) cleanup();
      else cleanups.push(cleanup);
    };

    // ปุ่ม Back: ถอยกลับหน้าก่อนหน้าถ้ามี ไม่งั้นย่อแอปลง (native.ts จัดการให้เมื่อคืน false)
    onBackButton(() => {
      // B4 กันทุจริต: ระหว่างชำระเงินห้ามออกจากหน้า — กลืนปุ่ม Back ทิ้ง
      if (isPayLocked()) return true;

      if (window.history.length > 1) {
        window.history.back();
        return true;
      }

      return false;
    }).then(register);

    getNetworkStatus().then((status) => {
      if (!disposed) setOffline(!status.connected);
    });

    onNetworkChange((status) => {
      if (!disposed) setOffline(!status.connected);
    }).then(register);

    return () => {
      disposed = true;
      cleanups.forEach((cleanup) => cleanup());
      style.remove();
    };
  }, []);

  if (!offline) return null;

  return (
    <div style={BANNER_STYLE} role="status" aria-live="polite">
      <span>ขาดการเชื่อมต่อเครือข่าย — ตรวจ Wi-Fi ของแท็บเล็ต</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          minHeight: 32,
          padding: "0 14px",
          borderRadius: 8,
          border: "1px solid #fdba74",
          background: "#fff",
          color: "#9a3412",
          fontWeight: 700,
          fontFamily: "inherit",
        }}
      >
        ลองใหม่
      </button>
    </div>
  );
}
