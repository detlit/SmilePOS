// ดัชนีบาร์โค้ดสำรองฝั่ง client — ใช้ร่วมกันทุกหน้าจอที่มีการสแกน
// (หน้าขาย, รับสินค้า, โอนสาขา, นับสต็อก, ปรับยอด)
//
// ทำไมต้องมีไฟล์นี้: หน้าจอเหล่านั้นโหลด "แคตตาล็อกสินค้า" มาไว้ในหน่วยความจำ
// แล้วค้นบาร์โค้ดแบบ O(1) จาก Datalist.Barcode อยู่แล้ว ฟีเจอร์หลายบาร์โค้ดจึง
// ทำได้ด้วยการ "เติม" บาร์โค้ดสำรองเข้าไปใน map เดิม แทนที่จะยิง API ทุกครั้ง
// ที่สแกน — ความเร็วในการสแกนไม่ลดลงเลย (ยังเป็น lookup ในหน่วยความจำ)
//
// ⚠️ ข้อควรระวังที่สำคัญที่สุด
// map ที่ได้จากไฟล์นี้ชี้ไป "ตัวสินค้า" เสมอ ไม่ใช่ชี้ไปบาร์โค้ดที่สแกน
// โค้ดปลายทางต้องใช้ product.Barcode (บาร์โค้ดหลัก) เขียนลงเอกสารต่อไปตามเดิม
// ห้ามเอาบาร์โค้ดที่สแกนไปบันทึก ไม่งั้นยอดคงเหลือของ lot จะหลุดกลุ่ม
// (เหตุผลเต็ม: src/lib/barcodeResolve.ts และ src/lib/stockBalance.ts)

import axios from "axios"

export type AliasIndexRow = { b: string; c: string }

/** cache ต่อ company — TTL สั้น ๆ พอให้สลับหน้าไม่ยิงซ้ำ แต่ไม่ค้างจนแก้แล้วไม่เห็นผล */
const TTL_MS = 30_000
const cache = new Map<string, { t: number; rows: AliasIndexRow[] }>()

/**
 * ตัดช่องว่าง/ขีด — ต้องให้ผลตรงกับ normalizeBarcode ใน src/lib/barcodeResolve.ts เสมอ
 * เขียนเป็น replace สองชั้นโดยตั้งใจ ไม่ใช้ character class รวม เพราะ "-" ใน
 * class เสี่ยงถูกตีความเป็นช่วง (range) แล้วเงียบ ๆ ไม่ตัดขีดจริง
 */
export function normalizeBarcode(value: unknown): string {
    return String(value ?? "").replace(/\s+/g, "").replace(/-/g, "").trim()
}

/** โหลดคู่ (บาร์โค้ดสำรอง → รหัสสินค้า) ทั้งบริษัท — ล้มเหลวแล้วคืน [] เพื่อไม่ให้หน้าจอพัง */
export async function fetchBarcodeAliases(company: string): Promise<AliasIndexRow[]> {
    if (!company) return []

    const hit = cache.get(company)
    if (hit && Date.now() - hit.t < TTL_MS) return hit.rows

    try {
        const res = await axios.get(
            `/api/product-barcode?company=${encodeURIComponent(company)}&fields=index`
        )
        const rows: AliasIndexRow[] = Array.isArray(res.data) ? res.data : []
        cache.set(company, { t: Date.now(), rows })
        return rows
    } catch (e) {
        console.error("load barcode aliases failed:", e)
        // ไม่ cache ความล้มเหลว — ครั้งหน้าลองใหม่ (ระหว่างนี้สแกนบาร์โค้ดหลักได้ปกติ)
        return []
    }
}

/** เรียกหลังเพิ่ม/ลบ/แก้ alias เพื่อให้หน้าจออื่นเห็นผลทันทีที่โหลดรอบถัดไป */
export function invalidateBarcodeAliases(company?: string) {
    if (company) cache.delete(company)
    else cache.clear()
}

/**
 * สร้าง map "บาร์โค้ด → ตัวสินค้า" ที่รวมทั้งบาร์โค้ดหลักและบาร์โค้ดสำรอง
 *
 * ลำดับความสำคัญ: บาร์โค้ดหลักชนะเสมอ — ถ้ามีข้อมูลเก่าที่ alias ไปทับบาร์โค้ดหลัก
 * ของสินค้าอื่น (ก่อนมี unique index) การสแกนจะยังได้สินค้าที่ถูกต้อง
 *
 * @param products แคตตาล็อกสินค้าที่หน้าจอโหลดไว้แล้ว (ต้องมี Barcode + code)
 * @param aliases  ผลจาก fetchBarcodeAliases()
 */
export function buildBarcodeIndex(products: any[], aliases: AliasIndexRow[]): Map<string, any> {
    const map = new Map<string, any>()

    const byCode = new Map<string, any>()
    for (const p of products || []) {
        const code = String(p?.code || "")
        if (code) byCode.set(code, p)
    }

    // 1) บาร์โค้ดสำรองก่อน เพื่อให้บาร์โค้ดหลักเขียนทับได้ในขั้นถัดไป
    for (const a of aliases || []) {
        const bc = normalizeBarcode(a?.b)
        const product = byCode.get(String(a?.c || ""))
        if (bc && product) map.set(bc, product)
    }

    // 2) บาร์โค้ดหลัก — ชนะเสมอ
    for (const p of products || []) {
        const bc = normalizeBarcode(p?.Barcode)
        if (bc) map.set(bc, p)
    }

    return map
}

/** เซ็ตบาร์โค้ดสำรองต่อรหัสสินค้า — ใช้กรองผลค้นหา ("พิมพ์บาร์โค้ดสำรองแล้วต้องเจอ") */
export function buildAliasesByCode(aliases: AliasIndexRow[]): Map<string, string[]> {
    const map = new Map<string, string[]>()
    for (const a of aliases || []) {
        const code = String(a?.c || "")
        const bc = normalizeBarcode(a?.b)
        if (!code || !bc) continue
        const list = map.get(code)
        if (list) list.push(bc)
        else map.set(code, [bc])
    }
    return map
}
