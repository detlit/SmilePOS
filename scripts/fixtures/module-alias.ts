// ทำให้ชื่อโมดูลแบบย่อ resolve ได้ตอน "รัน" บน Node ไม่ใช่แค่ตอนคอมไพล์
//
// tsconfig paths มีผลกับตัวตรวจชนิดเท่านั้น — โค้ดที่ออกมายังเป็น require("@/lib/prisma") ตามเดิม
// ไฟล์นี้จึงต้องดักที่ตัว resolver ของ Node ให้ชี้ไปยังไฟล์ที่คอมไพล์แล้ว
// เพื่อจำลองสิ่งที่ next.config.ts ทำให้ตอน build โหมด mobile
//
// ต้อง import ไฟล์นี้เป็นอันดับแรกสุดของสคริปต์ทดสอบเสมอ ก่อน import อย่างอื่นทั้งหมด

import Module from "node:module"
import path from "node:path"

const compiledRoot = path.resolve(__dirname, "..", "..")

/** ชุดเดียวกับที่ next.config.ts สลับให้ตอน build โหมด mobile */
const ALIASES: Record<string, string> = {
  "@mobile-api-registry": path.join(__dirname, "test-registry.js"),
  "@/lib/prisma": path.join(compiledRoot, "src", "lib", "mobile", "db", "prismaLite.js"),
  "@/lib/jwt": path.join(compiledRoot, "src", "lib", "mobile", "jwt.js"),
  "next/server": path.join(compiledRoot, "src", "lib", "mobile", "api", "next-server-shim.js"),
  "next/cache": path.join(compiledRoot, "src", "lib", "mobile", "api", "next-cache-shim.js"),
}

const original = (Module as any)._resolveFilename

;(Module as any)._resolveFilename = function patched(request: string, ...rest: unknown[]) {
  const exact = ALIASES[request]
  if (exact) return original.call(this, exact, ...rest)

  // "@/อะไรก็ได้" -> src/อะไรก็ได้ (ตรงกับ paths ใน tsconfig หลัก)
  if (request.startsWith("@/")) {
    return original.call(this, path.join(compiledRoot, "src", request.slice(2)), ...rest)
  }

  return original.call(this, request, ...rest)
}
