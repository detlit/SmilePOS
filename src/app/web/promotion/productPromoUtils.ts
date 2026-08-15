// Helper กลางของ "โปรโมชั่นสินค้า" (ProductPromotion)
// ใช้ร่วมกันระหว่างหน้าตั้งค่าโปรโมชั่น และหน้าขาย เพื่อให้เงื่อนไข/ข้อความตรงกันเสมอ

export const PROMO_TIER_ALL = "ทุกระดับราคา"

export interface ProductPromo {
  id: number
  company?: string
  name?: string
  id_product?: number
  code_product?: string
  name_product?: string
  unit?: string
  price_tier?: string
  promo_type?: string        // "discount" | "freebie"
  min_qty?: number
  discount_unit?: string     // "baht" | "percent"
  discount_scope?: string    // "unit" = ลดต่อหน่วย | "bill" = ลดทั้งรายการ
  discount_value?: number
  free_qty?: number
  startdate?: string | Date | null
  enddate?: string | Date | null
  status?: string            // "active" | "inactive"
}

const toNum = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// โปรใช้งานได้ ณ เวลาปัจจุบันหรือไม่ (สถานะเปิด + อยู่ในช่วงวันที่, วันสิ้นสุดนับรวมทั้งวัน)
export function isPromoActiveNow(p: ProductPromo, now: Date = new Date()): boolean {
  if (String(p.status || "") !== "active") return false
  if (p.startdate) {
    const start = new Date(p.startdate)
    start.setHours(0, 0, 0, 0)
    if (now < start) return false
  }
  if (p.enddate) {
    const end = new Date(p.enddate)
    end.setHours(23, 59, 59, 999)
    if (now > end) return false
  }
  return true
}

// โปรนี้ร่วมรายการกับระดับราคา (ราคาที่เลือกขายหน้าบิล) นี้หรือไม่
export function promoMatchesTier(p: ProductPromo, tier: string): boolean {
  const promoTier = String(p.price_tier || PROMO_TIER_ALL)
  return promoTier === PROMO_TIER_ALL || promoTier === String(tier || "")
}

// ข้อความเงื่อนไข เช่น "ซื้อครบ 12 เม็ด"
export function promoConditionText(p: ProductPromo): string {
  const unit = String(p.unit || "หน่วย")
  return `ซื้อครบ ${toNum(p.min_qty)} ${unit}`
}

// ข้อความสิทธิ์ที่ได้ เช่น "ลด 10% ต่อหน่วย" / "ลด 5 บาท/หน่วย" / "แถม 1 เม็ด"
export function promoRewardText(p: ProductPromo): string {
  if (String(p.promo_type) === "freebie") {
    return `แถม ${toNum(p.free_qty)} ${String(p.unit || "หน่วย")}`
  }
  if (String(p.discount_unit) === "percent") {
    return `ลด ${toNum(p.discount_value)}%`
  }
  const scope = String(p.discount_scope) === "bill" ? "ต่อรายการ" : `ต่อ${String(p.unit || "หน่วย")}`
  return `ลด ${toNum(p.discount_value)} บาท ${scope}`
}

export function promoFullText(p: ProductPromo): string {
  return `${promoConditionText(p)} ${promoRewardText(p)}`
}

// ส่วนลดโปรโมชั่นต่อหน่วย (บาท/หน่วย) สำหรับโปรชนิดส่วนลด
// qty = จำนวนในรายการขาย, price = ราคาขายต่อหน่วย
// คืน 0 เมื่อยังซื้อไม่ครบเงื่อนไข
export function calcPromoDiscountPerUnit(p: ProductPromo, qty: number, price: number): number {
  if (String(p.promo_type) !== "discount") return 0
  const minQty = toNum(p.min_qty)
  const value = toNum(p.discount_value)
  if (minQty <= 0 || value <= 0 || qty < minQty || qty <= 0) return 0
  let perUnit = 0
  if (String(p.discount_unit) === "percent") {
    perUnit = (price * value) / 100
  } else if (String(p.discount_scope) === "bill") {
    perUnit = value / qty // เฉลี่ยส่วนลดทั้งรายการลงต่อหน่วย เพื่อให้รวมแล้วลดเท่ากับที่ตั้งไว้
  } else {
    perUnit = value
  }
  perUnit = Math.min(perUnit, price)
  return Math.round(perUnit * 10000) / 10000
}

// จำนวนของแถมที่มีสิทธิ์ได้ (คิดทวีคูณ) จากจำนวนที่ "จ่ายเงิน"
export function calcPromoFreeEntitled(p: ProductPromo, paidQty: number): number {
  if (String(p.promo_type) !== "freebie") return 0
  const minQty = toNum(p.min_qty)
  const freeQty = toNum(p.free_qty)
  if (minQty <= 0 || freeQty <= 0 || paidQty < minQty) return 0
  return Math.floor(paidQty / minQty) * freeQty
}
