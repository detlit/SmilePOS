// ฝั่งรับงานของ HTTP server ในเครื่อง — ตัวที่ทำให้คนนอกร้านเห็นข้อมูลชุดเดียวกับแท็บเล็ต
//
// LocalHttpServer (Java) รับคำขอจาก cloudflared แล้วเด้งเข้ามาที่ window.__smileposServeApi
// ไฟล์นี้แปลงคำขอนั้นให้เป็นรูปแบบที่ router.ts เข้าใจ เรียก dispatch() ตัวเดียวกับที่หน้าจอ
// ในแท็บเล็ตใช้ แล้วส่งคำตอบกลับผ่านปลั๊กอิน
//
// ประเด็นที่ต้องระวังเป็นพิเศษ: ฟังก์ชันนี้ทำงานบนเธรดเดียวกับ UI ของแอป คำขอจากภายนอก
// ที่หนักมาก ๆ จะทำให้หน้าจอในแท็บเล็ตหน่วงตามไปด้วย จึงไม่รับ body เกิน 8 MB (บังคับที่ฝั่ง Java)
// และ handler ที่ใช้เวลานานกว่า 60 วินาทีจะถูกตัดทิ้งพร้อมข้อความบอกสาเหตุ

import { dispatch } from "./router"
import { registerRemoteServer, respondToRemoteRequest } from "../native/tunnel"

type IncomingRequest = {
  id: string
  method: string
  url: string
  headers: Record<string, string>
  body: string | null
}

let installed = false

/**
 * ติดตั้งตัวรับคำขอจากภายนอก — เรียกซ้ำได้
 *
 * ต้องเรียก "หลัง" ฐานข้อมูลพร้อมแล้วเท่านั้น เพราะการประกาศตัวว่าพร้อม (registerServer)
 * เป็นสัญญาณให้ฝั่ง native เปิด tunnel ต่อจากที่ตั้งค่าไว้ ถ้าประกาศเร็วเกินไป
 * ผู้เข้าชมกลุ่มแรกจะเจอ error ของ SQLite ที่ยังเปิดไม่เสร็จ
 */
export function installRemoteApiServer(): void {
  if (installed) return
  if (typeof window === "undefined") return
  installed = true

  ;(window as any).__smileposServeApi = (payload: string) => {
    // ตั้งใจไม่ await — ฝั่ง Java เรียกแบบ fire-and-forget แล้วไปรอคำตอบที่คิวของมันเอง
    void handleIncoming(payload)
  }

  void registerRemoteServer(true)
}

/** ปิดการรับคำขอจากภายนอกชั่วคราว (ใช้ตอนกำลัง restore ฐานข้อมูลทับ) */
export function suspendRemoteApiServer(): void {
  void registerRemoteServer(false)
}

async function handleIncoming(rawPayload: string): Promise<void> {
  let id = ""

  try {
    const request = JSON.parse(rawPayload) as IncomingRequest
    id = request.id

    const response = await dispatch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body ? base64ToBytes(request.body) : null,
    })

    const buffer = await response.arrayBuffer()

    await respondToRemoteRequest(
      id,
      response.status,
      headersToObject(response.headers),
      buffer.byteLength ? bytesToBase64(new Uint8Array(buffer)) : null
    )
  } catch (err) {
    if (!id) return // แกะ payload ไม่ออก — ไม่รู้จะตอบใคร ปล่อยให้ฝั่ง Java หมดเวลาไปเอง

    const message = err instanceof Error ? err.message : String(err)
    console.error("[remote-api] ประมวลผลคำขอจากภายนอกล้มเหลว:", err)

    await respondToRemoteRequest(
      id,
      500,
      { "Content-Type": "application/json; charset=utf-8" },
      bytesToBase64(new TextEncoder().encode(JSON.stringify({ error: message })))
    ).catch(() => undefined)
  }
}

/**
 * ไม่มี route ไหนในโปรเจกต์นี้ตั้ง Set-Cookie (ระบบยืนยันตัวตนใช้ JWT ผ่าน header)
 * ถ้าวันหนึ่งมี ต้องแยกส่งเป็น array เพราะ header ซ้ำชื่อยุบรวมเป็นค่าเดียวไม่ได้
 */
function headersToObject(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {}
  headers.forEach((value, key) => {
    out[key] = value
  })
  return out
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/**
 * แปลงเป็น base64 ทีละก้อน
 *
 * String.fromCharCode(...bytes) ก้อนเดียวจะทำให้ stack ล้นเมื่อ response ใหญ่กว่าไม่กี่ร้อย KB
 * (รายงานยอดขายบางหน้าคืน JSON หลายเมกะไบต์) ตัดเป็นช่วงละ 32KB จึงปลอดภัยกับทุกขนาด
 */
function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000
  let binary = ""
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}
