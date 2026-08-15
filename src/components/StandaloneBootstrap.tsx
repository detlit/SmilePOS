"use client";

// เตรียมระบบฝั่งเครื่องก่อนปล่อยให้ UI ทำงาน (เฉพาะ build ที่ฝังลง .apk)
//
// ต้องกั้นการ render ไว้จริง ๆ ไม่ใช่แค่เรียก init แล้วปล่อยผ่าน เพราะหน้าจอหลายหน้า
// ยิง API ตั้งแต่ useEffect แรก ถ้าฐานข้อมูลยังไม่พร้อมหรือตัวดักคำขอยังไม่ติดตั้ง
// คำขอชุดแรกจะพังทั้งชุด แล้วหน้าจะค้างที่สถานะ "ไม่มีข้อมูล" ทั้งที่ระบบปกติดี
//
// บนเว็บ/Electron คอมโพเนนต์นี้คืนค่า children ทันทีโดยไม่ทำอะไรเลย

import { useEffect, useState } from "react";

import { isMobileBuild } from "@/lib/runtime/platform";

type Status = "loading" | "ready" | "error";

export default function StandaloneBootstrap({ children }: { children: React.ReactNode }) {
  // build ปกติไม่ต้องรออะไร — ตัดสินตั้งแต่ตอน build ไม่ใช่ตอน runtime
  const [status, setStatus] = useState<Status>(isMobileBuild ? "loading" : "ready");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isMobileBuild) return;

    let cancelled = false;

    void (async () => {
      try {
        const { bootstrapStandalone } = await import("@/lib/mobile/bootstrap");
        await bootstrapStandalone();
        if (!cancelled) setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setMessage(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "ready") return <>{children}</>;

  if (status === "error") {
    return (
      <div style={SCREEN}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>เปิดฐานข้อมูลไม่สำเร็จ</div>
        <div style={{ color: "#64748b", fontSize: 14, maxWidth: 420, lineHeight: 1.6 }}>{message}</div>
        <button style={BUTTON} onClick={() => window.location.reload()}>
          ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <div style={SCREEN}>
      <div style={SPINNER} />
      <div style={{ color: "#64748b", fontSize: 15 }}>กำลังเตรียมข้อมูล…</div>
      <style>{`@keyframes smilepos-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

const SCREEN: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 99998,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 14,
  padding: 24,
  textAlign: "center",
  background: "#ffffff",
};

const SPINNER: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  border: "3px solid #e2e8f0",
  borderTopColor: "#3e86c7",
  animation: "smilepos-spin 0.8s linear infinite",
};

const BUTTON: React.CSSProperties = {
  marginTop: 8,
  padding: "10px 22px",
  borderRadius: 8,
  border: "none",
  background: "#3e86c7",
  color: "#fff",
  fontSize: 15,
  cursor: "pointer",
};
