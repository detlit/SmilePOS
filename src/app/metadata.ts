// app/metadata.ts
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "SmileStore POS",
  description: "ระบบจัดการร้านค้าอัจฉริยะ — ขายหน้าร้าน สต็อก และรายงานในระบบเดียว",
};

// UI ชุดนี้ถูกเปิดในแอป Android ด้วย จึงต้องกันการซูมด้วยสองนิ้วที่ทำให้เลย์เอาต์เพี้ยน
// กลางบิล และเปิด viewport-fit=cover เพื่อให้ safe-area-inset-* มีค่าจริงบนจอมี notch
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#3e86c7",
};