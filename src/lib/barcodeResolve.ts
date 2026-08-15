// การค้นหาสินค้าจากบาร์โค้ด (ฝั่งเซิร์ฟเวอร์) — รองรับ "หลายบาร์โค้ดต่อหนึ่งหน่วยสินค้า"
//
// ══════════════════════════════════════════════════════════════════════════════
// หลักการที่ห้ามละเมิด (เหตุผลที่ฟีเจอร์นี้ไม่กระทบยอดสต็อก)
// ══════════════════════════════════════════════════════════════════════════════
// สินค้าหนึ่งตัวมีบาร์โค้ดได้ 2 ชั้น:
//
//   1) บาร์โค้ดหลัก  = Datalist.Barcode          (มีได้ตัวเดียว — "คีย์ของยอด")
//   2) บาร์โค้ดสำรอง = ProductBarcode.barcode    (มีกี่ตัวก็ได้ — "แค่ทางเข้า")
//
// src/lib/stockBalance.ts จับกลุ่มธุรกรรมด้วย Datalist.Barcode:
//   RCitemlist.Barcode / Sale.barcode / StockTransaction (ผ่าน itemcodeGroup)
// ดังนั้นถ้าเผลอเขียน "บาร์โค้ดสำรอง" ลงเอกสาร ยอดของ lot นั้นจะหลุดกลุ่มทันที
//
// ฟีเจอร์นี้จึงออกแบบให้บาร์โค้ดสำรองมีชีวิตอยู่แค่ "ขั้นตอนสแกน" เท่านั้น:
//
//   สแกน 8851234567890 (สำรอง)
//        │
//        ├─ resolveBarcode() ── หา Datalist ที่เป็นเจ้าของ
//        │
//        └─▶ ทุกอย่างหลังจากนี้ใช้ product.Barcode (หลัก) + product.code เหมือนเดิม
//            → รับ / ขาย / โอน / รับโอน / ปรับยอด เขียนคีย์เดิมทุกประการ
//            → ยอดคงเหลือคำนวณเหมือนไม่มีฟีเจอร์นี้อยู่เลย
//
// ผลข้างเคียงที่ตั้งใจ: การเพิ่ม/ลบบาร์โค้ดสำรองปลอดภัยเสมอ แม้สินค้าจะมี
// ความเคลื่อนไหวสต็อกไปแล้ว (ต่างจากการแก้บาร์โค้ดหลักที่ถูกล็อกไว้)

import { prisma } from "./prisma"

/** แหล่งที่เจอบาร์โค้ด — ใช้บอกผู้ใช้/ดีบักว่าสแกนโดนอะไร */
export type BarcodeSource = "primary" | "alias" | "unit"

export type ResolvedBarcode = {
    source: BarcodeSource
    /** id ของ Datalist */
    productId: number
    /** Datalist.code */
    code: string
    /** Datalist.Barcode — บาร์โค้ดหลัก ตัวที่ต้องเขียนลงเอกสารเสมอ */
    primaryBarcode: string
    /** บาร์โค้ดที่ผู้ใช้สแกนมาจริง (อาจเป็นตัวสำรอง) */
    scanned: string
    productName: string
    unit: string
    /** id ของ UnitConversion เมื่อ source === "unit" */
    unitConversionId?: number
}

/**
 * ตัดช่องว่างและขีดคั่นที่เครื่องสแกน/คนพิมพ์แถมมา (เช่น "885 123-456" -> "885123456")
 * เขียนเป็น replace สองชั้นโดยตั้งใจ ไม่ใช้ character class รวม เพราะ "-" ใน
 * class เสี่ยงถูกตีความเป็นช่วง (range) แล้วเงียบ ๆ ไม่ตัดขีดจริง
 * ต้องให้ผลตรงกับ normalizeBarcode ใน src/lib/barcodeAliasClient.ts เสมอ
 */
export function normalizeBarcode(value: unknown): string {
    return String(value ?? "").replace(/\s+/g, "").replace(/-/g, "").trim()
}

/**
 * หาสินค้าจากบาร์โค้ดหนึ่งตัว ตามลำดับความสำคัญ:
 *   1. บาร์โค้ดหลัก (Datalist.Barcode)   — เร็วสุดและเป็นกรณีปกติ
 *   2. บาร์โค้ดสำรอง (ProductBarcode)     — ฟีเจอร์หลายบาร์โค้ด
 *   3. บาร์โค้ดหน่วยแปลง (UnitConversion) — คนละหน่วยขาย จึงตรวจท้ายสุด
 *
 * คืน null เมื่อไม่พบ (ผู้เรียกเป็นคนตัดสินใจว่าจะเตือนอย่างไร)
 */
export async function resolveBarcode(
    company: string,
    rawBarcode: string
): Promise<ResolvedBarcode | null> {
    const barcode = normalizeBarcode(rawBarcode)
    if (!company || !barcode) return null

    const toResolved = (
        product: { id: number; code: string | null; Barcode: string | null; ProductName: string | null; Unit: string | null },
        source: BarcodeSource,
        unitConversionId?: number
    ): ResolvedBarcode => ({
        source,
        productId: product.id,
        code: product.code || "",
        primaryBarcode: (product.Barcode || "").trim(),
        scanned: barcode,
        productName: product.ProductName || "",
        unit: product.Unit || "",
        ...(unitConversionId != null ? { unitConversionId } : {}),
    })

    const productSelect = { id: true, code: true, Barcode: true, ProductName: true, Unit: true } as const

    // 1) บาร์โค้ดหลัก
    const primary = await prisma.datalist.findFirst({
        where: { company, Barcode: barcode },
        select: productSelect,
    })
    if (primary) return toResolved(primary, "primary")

    // 2) บาร์โค้ดสำรอง — ผูกด้วย productId ก่อน (แม่นกว่าเมื่อ code ซ้ำในบริษัท)
    const alias = await prisma.productBarcode.findFirst({
        where: { company, barcode, isActive: true },
        select: { productCode: true, productId: true },
    })
    if (alias) {
        const product = await prisma.datalist.findFirst({
            where: alias.productId
                ? { company, id: alias.productId }
                : { company, code: alias.productCode },
            select: productSelect,
        })
        // สินค้าถูกลบไปแล้วแต่ alias ค้าง → ถือว่าไม่พบ (ไม่ทำให้ล้มทั้งการสแกน)
        if (product) return toResolved(product, "alias")
    }

    // 3) บาร์โค้ดหน่วยแปลง
    const unit = await prisma.unitConversion.findFirst({
        where: { company, Barcode: barcode },
        select: { id: true, productCode: true },
    })
    if (unit) {
        const product = await prisma.datalist.findFirst({
            where: { company, code: unit.productCode || "" },
            select: productSelect,
        })
        if (product) return toResolved(product, "unit", unit.id)
    }

    return null
}

/** บาร์โค้ดสำรองทั้งหมดของสินค้าหนึ่งตัว (เรียงเก่า→ใหม่) */
export async function getAliasesForProduct(company: string, productCode: string) {
    if (!company || !productCode) return []
    return prisma.productBarcode.findMany({
        where: { company, productCode },
        orderBy: { id: "asc" },
    })
}

export type BarcodeConflict = {
    /** ชนกับอะไร */
    kind: "primary" | "alias" | "unit"
    productCode: string
    productName: string
    message: string
}

/**
 * ตรวจว่าบาร์โค้ดนี้ว่างพอจะผูกกับ productCode ที่ระบุไหม
 *
 * บาร์โค้ดหนึ่งตัวต้องชี้สินค้าได้เพียงตัวเดียวต่อบริษัท ไม่งั้นการสแกนจะกำกวม
 * และเลือกสินค้าผิด → ตัดสต็อกผิดตัว ตรวจครบทั้ง 3 ที่เก็บบาร์โค้ดในระบบ
 *
 * คืน null = ใช้ได้, คืน object = ชน (พร้อมข้อความไทยพร้อมแสดงผล)
 */
export async function findBarcodeConflict(
    company: string,
    rawBarcode: string,
    ownerProductCode: string,
    opts: { ignoreAliasId?: number } = {}
): Promise<BarcodeConflict | null> {
    const barcode = normalizeBarcode(rawBarcode)
    if (!company || !barcode) return null

    const owner = String(ownerProductCode || "")

    const primary = await prisma.datalist.findFirst({
        where: { company, Barcode: barcode, code: { not: owner } },
        select: { code: true, ProductName: true },
    })
    if (primary) {
        return {
            kind: "primary",
            productCode: primary.code || "",
            productName: primary.ProductName || "",
            message: `บาร์โค้ด ${barcode} ถูกใช้เป็นบาร์โค้ดหลักของ ${primary.code} ${primary.ProductName || ""} แล้ว`,
        }
    }

    const alias = await prisma.productBarcode.findFirst({
        where: {
            company,
            barcode,
            productCode: { not: owner },
            ...(opts.ignoreAliasId ? { id: { not: opts.ignoreAliasId } } : {}),
        },
        select: { productCode: true },
    })
    if (alias) {
        const product = await prisma.datalist.findFirst({
            where: { company, code: alias.productCode },
            select: { ProductName: true },
        })
        return {
            kind: "alias",
            productCode: alias.productCode,
            productName: product?.ProductName || "",
            message: `บาร์โค้ด ${barcode} ถูกใช้เป็นบาร์โค้ดสำรองของ ${alias.productCode} ${product?.ProductName || ""} แล้ว`,
        }
    }

    const unit = await prisma.unitConversion.findFirst({
        where: { company, Barcode: barcode, productCode: { not: owner } },
        select: { productCode: true, saleUnit: true },
    })
    if (unit) {
        return {
            kind: "unit",
            productCode: unit.productCode || "",
            productName: "",
            message: `บาร์โค้ด ${barcode} ถูกใช้เป็นบาร์โค้ดหน่วยขาย "${unit.saleUnit || ""}" ของ ${unit.productCode} แล้ว`,
        }
    }

    return null
}

/**
 * รหัสสินค้าทุกตัวที่ผูกกับบาร์โค้ดสำรองชุดหนึ่ง — ใช้ขยายผลการค้นหา
 * ของ /api/datalist ให้ค้นด้วยบาร์โค้ดสำรองแล้วเจอสินค้าเจ้าของ
 */
export async function productCodesMatchingAlias(
    company: string,
    term: string,
    mode: "startsWith" | "contains" = "startsWith"
): Promise<string[]> {
    const value = normalizeBarcode(term)
    if (!company || !value) return []
    const rows = await prisma.productBarcode.findMany({
        where: {
            company,
            isActive: true,
            barcode: mode === "contains" ? { contains: value } : { startsWith: value },
        },
        select: { productCode: true },
        take: 200,
    })
    return Array.from(new Set(rows.map((r) => r.productCode).filter(Boolean)))
}
