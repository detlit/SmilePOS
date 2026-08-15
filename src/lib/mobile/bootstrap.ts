// จุดเริ่มต้นของโหมด standalone — ต้องรันให้เสร็จก่อน UI ยิง API ตัวแรก
//
// ลำดับสำคัญ: ติดตั้งตัวดักคำขอ "ก่อน" เปิดฐานข้อมูล เพราะหน้าจอบางหน้ายิง API
// ตั้งแต่ effect แรกที่ mount ถ้าดักไม่ทัน คำขอนั้นจะหลุดออกไปหา server ที่ไม่มีอยู่จริง

import { installLocalApi } from "./api/interceptor"
import { installRemoteApiServer } from "./api/remote-serve"
import { ensureSchema } from "./db/migrate"
import { localRouteCount } from "./api/router"

export type BootstrapState = "idle" | "ready" | "error"

let state: BootstrapState = "idle"
let bootPromise: Promise<void> | null = null
let bootError: Error | null = null

export function getBootstrapState(): { state: BootstrapState; error: Error | null } {
  return { state, error: bootError }
}

/** เตรียมระบบฝั่งเครื่อง — เรียกซ้ำได้ ทำงานจริงครั้งเดียว */
export function bootstrapStandalone(): Promise<void> {
  if (!bootPromise) {
    bootPromise = run().catch((err) => {
      // ไม่ cache ความล้มเหลว เผื่อผู้ใช้กดลองใหม่
      bootPromise = null
      state = "error"
      bootError = err instanceof Error ? err : new Error(String(err))
      throw bootError
    })
  }
  return bootPromise
}

/**
 * true = หน้านี้ถูกเสิร์ฟผ่าน Cloudflare Tunnel ให้เบราว์เซอร์นอกร้าน ไม่ได้รันอยู่ในแท็บเล็ต
 *
 * LocalHttpServer ฝั่ง Java เป็นคนแทรกธงนี้ลงใน <head> ของทุกหน้า HTML ที่มันเสิร์ฟ
 * (ดู injectRemoteMarker) — ต้องรู้ให้ได้ เพราะ bundle ก้อนเดียวกันนี้ถูกใช้ทั้งสองฝั่ง
 */
export function isRemoteClient(): boolean {
  if (typeof window === "undefined") return false
  return (window as any).__SMILEPOS_REMOTE__ === true
}

async function run(): Promise<void> {
  // เบราว์เซอร์ปลายทางไม่มี SQLite และไม่ควรมี — ข้อมูลอยู่ในแท็บเล็ตเครื่องเดียวเท่านั้น
  // ถ้าเผลอติดตั้งตัวดักคำขอที่นี่ ทุก /api/** จะถูกจับไว้ในเบราว์เซอร์แล้วพังหมด
  // ปล่อยให้ fetch วิ่งออกไปตามปกติ = วิ่งกลับเข้า LocalHttpServer ในแท็บเล็ตผ่าน tunnel
  if (isRemoteClient()) {
    state = "ready"
    bootError = null
    console.info("[standalone] เปิดจากภายนอกผ่าน tunnel — ใช้ API ของแท็บเล็ตต้นทาง")
    return
  }

  installLocalApi()

  await ensureSchema()
  const { seedIfEmpty } = await import("./db/seed")
  await seedIfEmpty()

  // ต้องอยู่หลังฐานข้อมูลพร้อม: การประกาศตัวคือสัญญาณให้ฝั่ง native เปิด tunnel ต่อ
  // จากที่ตั้งค่าไว้ ถ้าประกาศก่อน ผู้เข้าชมกลุ่มแรกจะเจอ error ของ SQLite ที่ยังเปิดไม่เสร็จ
  installRemoteApiServer()

  state = "ready"
  bootError = null

  console.info(`[standalone] พร้อมใช้งาน — API ในเครื่อง ${localRouteCount()} เส้นทาง`)
}
