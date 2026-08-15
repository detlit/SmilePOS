// การรับสินค้าด้วย "หน่วยขาย" (ลัง/กล่อง/แพ็ค) — ตัวกลางของหน้ารับสินค้าทั้งเพิ่มและแก้ไข
//
// ══════════════════════════════════════════════════════════════════════════════
// หลักการที่ห้ามละเมิด (เหตุผลที่ฟีเจอร์นี้ไม่กระทบยอดสต็อก)
// ══════════════════════════════════════════════════════════════════════════════
// สินค้าหนึ่งตัวมีหน่วยได้ 2 ชั้น:
//
//   1) หน่วยฐาน (หน่วยย่อย) = Datalist.Unit         — "หน่วยของยอด" มีตัวเดียว
//   2) หน่วยขาย (pack)      = UnitConversion.saleUnit — มีกี่หน่วยก็ได้ (กล่อง/ลัง/แพ็ค)
//                             โดย subQty = จำนวนหน่วยย่อยต่อ 1 หน่วยขาย
//
// ทุกสูตรคงเหลือ/ต้นทุน (src/lib/stockBalance.ts, รายงานซื้อ, FEFO) อ่านจาก
// RCitemlist.qty + RCitemlist.unit + RCitemlist.newCost ซึ่ง "ต้องเป็นหน่วยย่อยเสมอ"
// ฟีเจอร์นี้จึงให้หน่วยขายมีชีวิตอยู่แค่ "ตอนกรอกฟอร์ม" เท่านั้น แล้วแปลงลงหน่วยย่อย
// ก่อนบันทึกทุกครั้ง:
//
//   ผู้ใช้กรอก 2 กล่อง × ทุน 267 บาท/กล่อง   (กล่องละ 12 ขวด)
//        │
//        ├─ toBaseQty()  → qty     = 24 ขวด        ← เข้าสูตรคงเหลือเหมือนเดิม
//        ├─ toBaseCost() → newCost = 22.25 บาท/ขวด ← เข้าสูตรต้นทุน/CostActual เหมือนเดิม
//        │                 totalcost = 534 บาท (เท่ากันทั้งสองวิธีคิด)
//        └─▶ เก็บที่มาไว้ดูย้อนหลัง: saleQty = 2, saleUnit = "กล่อง", saleFactor = 12
//
// แถวเก่าที่ไม่มีสามฟิลด์นี้ (null) = รับด้วยหน่วยฐาน → factor 1 → คำนวณเหมือนเดิมทุกประการ

/** แถว UnitConversion เท่าที่หน้ารับสินค้าต้องใช้ */
export type UnitConversionRow = {
    id: number
    company?: string | null
    productCode?: string | null
    saleUnit?: string | null
    subQty?: number | null
    subUnit?: string | null
    Barcode?: string | null
}

/** ตัวเลือก "หน่วยรับ" หนึ่งตัวในฟอร์ม (หน่วยฐาน 1 ตัว + หน่วยขายกี่ตัวก็ได้) */
export type ReceiveUnitOption = {
    /** คีย์สำหรับ <select> — "base" หรือ id ของ UnitConversion */
    key: string
    /** id ของ UnitConversion (null = หน่วยฐาน) */
    unitConversionId: number | null
    /** ชื่อหน่วยที่รับ เช่น "กล่อง" (หน่วยฐานใช้ Datalist.Unit) */
    label: string
    /** จำนวนหน่วยย่อยต่อ 1 หน่วยนี้ — หน่วยฐานเป็น 1 เสมอ */
    factor: number
    /** ชื่อหน่วยย่อย (หน่วยฐานของสินค้า) */
    baseUnit: string
    /** บาร์โค้ดของหน่วยนี้ (หน่วยฐานใช้บาร์โค้ดหลักของสินค้า) */
    barcode: string
    /** true เมื่อเป็นหน่วยที่กู้มาจากแถวเดิมแต่ไม่มีใน UnitConversion แล้ว */
    legacy?: boolean
}

/** คีย์ของตัวเลือกหน่วยฐาน — ใช้เป็นค่าเริ่มต้นทุกที่ */
export const BASE_UNIT_KEY = "base"

/**
 * sentinel ที่ช่องค้นหาส่งเข้าช่องบาร์โค้ดเมื่อผู้ใช้ "เลือกหน่วยขาย" จาก dropdown
 * (หน่วยขายบางตัวไม่มีบาร์โค้ด จึงสแกนไม่ได้ ต้องมีทางเลือกจากรายการ)
 * ใช้รูปแบบเดียวกับหน้าขาย (body_sale.tsx) เพื่อให้พฤติกรรมสองหน้าตรงกัน
 */
export const UC_SELECT_PREFIX = "__UC__"

/** ปัดเศษทศนิยมลอย (0.1 × 3 = 0.30000000000000004) ให้เป็นตัวเลขที่มนุษย์คาดหวัง */
export function roundUnit(value: number, digits = 4): number {
    if (!Number.isFinite(value)) return 0
    const f = Math.pow(10, digits)
    return Math.round(value * f) / f
}

/** ตัวคูณที่ใช้ได้จริงเสมอ — ค่าเสีย/ว่าง/0/ติดลบ ให้ตกเป็น 1 (เท่ากับไม่มีการแปลง) */
export function normalizeFactor(value: unknown): number {
    const n = Number(value)
    return Number.isFinite(n) && n > 0 ? n : 1
}

/** ตัวเลือกหน่วยฐานของสินค้าหนึ่งตัว */
export function baseUnitOption(product: any): ReceiveUnitOption {
    const baseUnit = String(product?.Unit || "")
    return {
        key: BASE_UNIT_KEY,
        unitConversionId: null,
        label: baseUnit,
        factor: 1,
        baseUnit,
        barcode: String(product?.Barcode || ""),
    }
}

/**
 * รายการหน่วยที่รับได้ของสินค้าหนึ่งตัว = หน่วยฐาน + หน่วยขายทุกตัวใน UnitConversion
 *
 * ตัดหน่วยขายที่ใช้ไม่ได้ทิ้ง (ไม่มีชื่อหน่วย) เพราะเลือกไปก็แสดงผลไม่รู้เรื่อง
 * ส่วนหน่วยที่ subQty เพี้ยน (0/ติดลบ/ว่าง) ยังคงไว้แต่บังคับ factor = 1
 * เพื่อไม่ให้จำนวนรับกลายเป็น 0 เงียบ ๆ
 */
export function buildUnitOptions(product: any, rows: UnitConversionRow[] | null | undefined): ReceiveUnitOption[] {
    const base = baseUnitOption(product)
    const code = String(product?.code || "")
    if (!code) return [base]

    const options = (rows || [])
        .filter((uc) => String(uc?.productCode || "") === code)
        .filter((uc) => String(uc?.saleUnit || "").trim() !== "")
        .map((uc) => ({
            key: String(uc.id),
            unitConversionId: Number(uc.id),
            label: String(uc.saleUnit || "").trim(),
            factor: normalizeFactor(uc.subQty),
            // หน่วยย่อยยึดจากหน่วยฐานของสินค้าเสมอ (กันค่าที่ค้างใน UnitConversion.subUnit)
            baseUnit: base.baseUnit || String(uc.subUnit || ""),
            barcode: String(uc.Barcode || "").trim(),
        }))

    return [base, ...options]
}

/** หาตัวเลือกจากคีย์ — หาไม่เจอให้ตกกลับหน่วยฐาน (ตัวแรกเสมอ) */
export function findUnitOption(options: ReceiveUnitOption[], key: string | null | undefined): ReceiveUnitOption {
    return options.find((o) => o.key === String(key ?? "")) || options[0] || baseUnitOption(null)
}

/**
 * จับคู่ "หน่วยที่เคยบันทึกไว้ในแถวรับ" กลับเป็นตัวเลือกในฟอร์ม (ใช้ตอนแก้ไขรายการ)
 *
 * แถวเก่า (saleUnit ว่าง) = หน่วยฐาน
 * ถ้าหน่วยขายเดิมถูกลบ/แก้ตัวคูณไปแล้ว จะคืนตัวเลือกจำลอง (legacy) แทน
 * เพื่อให้ค่าที่ผู้ใช้เคยบันทึกไม่ถูกแปลงผิดเงียบ ๆ ตอนเปิดฟอร์ม
 */
export function optionFromSavedItem(
    options: ReceiveUnitOption[],
    saved: { saleUnit?: string | null; saleFactor?: number | null } | null | undefined
): ReceiveUnitOption {
    const base = options[0] || baseUnitOption(null)
    const savedUnit = String(saved?.saleUnit || "").trim()
    const savedFactor = Number(saved?.saleFactor)
    if (!savedUnit || !Number.isFinite(savedFactor) || savedFactor <= 1) return base

    const exact = options.find((o) => o.label === savedUnit && roundUnit(o.factor) === roundUnit(savedFactor))
    if (exact) return exact

    const byName = options.find((o) => o.label === savedUnit)
    if (byName) return byName

    return {
        key: `legacy:${savedUnit}:${savedFactor}`,
        unitConversionId: null,
        label: savedUnit,
        factor: savedFactor,
        baseUnit: base.baseUnit,
        barcode: "",
        legacy: true,
    }
}

/** จำนวนหน่วยย่อยที่เข้าสต็อกจริง (qty ที่บันทึกลง RCitemlist) */
export function toBaseQty(qtyInUnit: unknown, factor: number): number {
    return roundUnit((Number(qtyInUnit) || 0) * normalizeFactor(factor))
}

/** ทุนต่อหน่วยย่อย (newCost ที่บันทึกลง RCitemlist + ใช้อัปเดต Datalist.CostActual) */
export function toBaseCost(costPerUnit: unknown, factor: number): number {
    return roundUnit((Number(costPerUnit) || 0) / normalizeFactor(factor), 6)
}

/** ทุนต่อ 1 หน่วยขาย — ใช้ตอนเติมค่าเริ่มต้นจาก "ทุนล่าสุด" ซึ่งเป็นทุนต่อหน่วยย่อย */
export function toUnitCost(baseCost: unknown, factor: number): number {
    return roundUnit((Number(baseCost) || 0) * normalizeFactor(factor), 6)
}

/**
 * แปลงตัวเลขที่ผู้ใช้กรอกไว้แล้ว เมื่อสลับหน่วยรับกลางคัน (คงปริมาณ/มูลค่าจริงไว้)
 *   จำนวน 2 กล่อง (×12) → สลับเป็นขวด → 24 ขวด
 *   ทุน 267 บาท/กล่อง   → สลับเป็นขวด → 22.25 บาท/ขวด
 * ค่าว่างยังคงว่าง (ไม่ยัด 0 ให้ผู้ใช้ต้องลบทิ้ง)
 */
export function reinterpretOnUnitChange(
    value: string,
    fromFactor: number,
    toFactor: number,
    kind: "qty" | "cost"
): string {
    const raw = String(value ?? "").trim()
    if (raw === "") return raw
    const n = Number(raw)
    if (!Number.isFinite(n)) return raw

    const from = normalizeFactor(fromFactor)
    const to = normalizeFactor(toFactor)
    if (from === to) return raw

    // จำนวน: หน่วยใหญ่ขึ้น → ตัวเลขน้อยลง | ทุน: หน่วยใหญ่ขึ้น → ตัวเลขมากขึ้น
    const next = kind === "qty" ? (n * from) / to : (n / from) * to
    return String(roundUnit(next, kind === "qty" ? 4 : 6))
}

/** ป้ายหน่วยในรายการเลือก เช่น "กล่อง (1 × 12 ขวด)" */
export function unitOptionLabel(option: ReceiveUnitOption): string {
    if (!option) return ""
    if (option.factor === 1) return option.label || option.baseUnit || ""
    return `${option.label} (1 × ${roundUnit(option.factor)} ${option.baseUnit})`.trim()
}

/** ข้อความสรุปการแปลงหน่วยของ "จำนวน" เช่น "= 24 ขวด" (คืน "" เมื่อไม่มีการแปลง) */
export function baseQtySummary(qtyInUnit: unknown, option: ReceiveUnitOption): string {
    if (!option || option.factor === 1) return ""
    const base = toBaseQty(qtyInUnit, option.factor)
    if (!base) return ""
    return `= ${roundUnit(base)} ${option.baseUnit}`
}

/**
 * ทำความสะอาดสามฟิลด์หน่วยขายก่อนเขียนลงฐานข้อมูล (ใช้ฝั่ง API)
 *
 * ผู้เรียกที่ "ไม่ส่งมาเลย" (เช่นสคริปต์เก่า/หน้าอื่นที่ยังไม่รู้จักฟีเจอร์นี้) จะได้ {}
 * กลับไป → Prisma ไม่แตะคอลัมน์เดิม ค่าที่ผู้ใช้เคยบันทึกไว้จึงไม่ถูกล้างเป็น null
 */
export function normalizeReceivePacking(input: {
    saleQty?: unknown
    saleUnit?: unknown
    saleFactor?: unknown
}): { saleQty?: number | null; saleUnit?: string | null; saleFactor?: number | null } {
    const { saleQty, saleUnit, saleFactor } = input || {}
    if (saleQty === undefined && saleUnit === undefined && saleFactor === undefined) return {}

    const qty = Number(saleQty)
    return {
        saleQty: Number.isFinite(qty) ? roundUnit(qty) : null,
        saleUnit: saleUnit === null || saleUnit === undefined ? null : String(saleUnit),
        saleFactor: normalizeFactor(saleFactor),
    }
}

/**
 * ค่าที่ต้องบันทึกลง RCitemlist จากสิ่งที่ผู้ใช้กรอกในฟอร์ม
 *
 * จุดเดียวในระบบที่ทำการแปลงหน่วย → ทั้งหน้าเพิ่มและหน้าแก้ไขเรียกตัวนี้ตัวเดียวกัน
 * จำนวนแถม (freebaht) แปลงด้วยตัวคูณเดียวกัน เพราะแถมมาเป็นกล่องก็ต้องเข้าสต็อกเป็นขวด
 */
export function buildReceiveQuantities(input: {
    qtyInUnit: unknown
    costPerUnit: unknown
    freeInUnit?: unknown
    option: ReceiveUnitOption
}) {
    const factor = normalizeFactor(input.option?.factor)
    const qtyInUnit = Number(input.qtyInUnit) || 0
    const costPerUnit = Number(input.costPerUnit) || 0

    const qty = toBaseQty(qtyInUnit, factor)
    const newCost = toBaseCost(costPerUnit, factor)
    const freebaht = toBaseQty(input.freeInUnit ?? 0, factor)
    // คิดจากหน่วยขายโดยตรง เพื่อไม่ให้เศษจากการหาร newCost ไหลเข้ายอดเงิน
    // (100 บาท/แพ็ค ÷ 3 = 33.333333 → 3 × 33.333333 = 99.999999 ซึ่งไม่ตรงใบกำกับ)
    const totalcost = roundUnit(qtyInUnit * costPerUnit, 2)

    return {
        qty,
        newCost,
        freebaht,
        totalcost,
        /** จำนวนเข้าสต็อกจริง = จำนวนรับ + ของแถม (หน่วยย่อยทั้งคู่) */
        balance: roundUnit(qty + freebaht),
        saleQty: roundUnit(qtyInUnit),
        saleUnit: input.option?.label || "",
        saleFactor: factor,
    }
}
