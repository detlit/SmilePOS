/**
 * ตัวช่วยกลางของ "ระบบคิว" หน้าขาย — ใช้ร่วมกันทั้งฝั่ง API และฝั่งหน้าจอ
 * เพื่อให้สถานะ/ลำดับ/สีของคิว ตรงกันทุกที่ที่แสดงผล
 */

/** สถานะของคิว เรียงตามลำดับการทำงานจริง */
export const QUEUE_STATUSES = ["waiting", "preparing", "ready", "done", "cancelled"] as const
export type QueueStatus = (typeof QUEUE_STATUSES)[number]

export const QUEUE_STATUS_LABEL: Record<QueueStatus, string> = {
  waiting: "รอทำ",
  preparing: "กำลังทำ",
  ready: "พร้อมรับ",
  done: "รับแล้ว",
  cancelled: "ยกเลิก",
}

/** สถานะถัดไปเมื่อกดปุ่มเดินหน้าบนการ์ดคิว (done/cancelled = จบแล้ว ไม่มีถัดไป) */
export const NEXT_QUEUE_STATUS: Partial<Record<QueueStatus, QueueStatus>> = {
  waiting: "preparing",
  preparing: "ready",
  ready: "done",
}

/** คิวที่ยังต้องจับตา — ใช้กรองรายการที่แสดงบนแผงสถานะคิว */
export const ACTIVE_QUEUE_STATUSES: QueueStatus[] = ["waiting", "preparing", "ready"]

export function normalizeQueueStatus(value: unknown): QueueStatus {
  const v = String(value ?? "").trim()
  return (QUEUE_STATUSES as readonly string[]).includes(v) ? (v as QueueStatus) : "waiting"
}

/** วันของคิวรูปแบบ YYYY-MM-DD ตามเวลาท้องถิ่น (ห้ามใช้ toISOString — จะเพี้ยนข้ามวันเพราะเป็น UTC) */
export function queueDateOf(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** เลขคิวที่แสดงผล — เติมศูนย์หน้าให้อ่านง่ายบนใบเสร็จและหน้าจอ (7 → "007") */
export function formatQueueNo(n: unknown): string {
  const v = Number(n)
  if (!Number.isFinite(v) || v <= 0) return "-"
  return String(Math.trunc(v)).padStart(3, "0")
}

export type SaleQueueItem = {
  name: string
  qty: number
  unit: string
}

export type SaleQueueRow = {
  id: number
  company: string
  queueNo: number
  queueDate: string
  orderNo: string | null
  customer: string
  seller: string
  itemCount: number
  totalAmount: number
  items: SaleQueueItem[]
  status: QueueStatus
  note: string
  createdAt: string
  readyAt: string | null
  doneAt: string | null
}
