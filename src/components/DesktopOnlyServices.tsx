"use client";

// บริการเบื้องหลังที่ควรทำงานเฉพาะเครื่องเคาน์เตอร์ ไม่ใช่บนแท็บเล็ต Android
//
//  - AutoBackupScheduler     สำรองฐานข้อมูล เป็นงานของเครื่องที่ถือฐานข้อมูลจริง
//                            ไม่ใช่เครื่องลูกที่ต่อเข้ามา
//  - SmartCardAgentAutoStart ยิงไป 127.0.0.1:8182 ซึ่งบนแท็บเล็ตคือตัวแท็บเล็ตเอง
//                            ไม่ใช่เครื่องที่มีเครื่องอ่านบัตรประชาชนต่ออยู่
//
// LogbookAutoTracker ไม่อยู่ในนี้ เพราะการบันทึกว่าใครกดอะไรมีประโยชน์บนแท็บเล็ตด้วย

import AutoBackupScheduler from "@/components/AutoBackupScheduler";
import SmartCardAgentAutoStart from "@/components/SmartCardAgentAutoStart";
import { isNativeApp } from "@/lib/runtime/platform";

export default function DesktopOnlyServices() {
  if (isNativeApp()) return null;

  return (
    <>
      <AutoBackupScheduler />
      <SmartCardAgentAutoStart />
    </>
  );
}
