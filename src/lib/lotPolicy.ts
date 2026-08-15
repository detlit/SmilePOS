// นโยบาย Lot ของสินค้า (Datalist.requireLot) — จุดเดียวที่นิยาม "สินค้านี้ต้องมี lot ไหม"
//
// requireLot = true  (ค่าเริ่มต้นของทุกสินค้า)
//     รับสินค้า · ขายสินค้า · โอน · รับโอน · ปรับยอด — ต้องระบุ/เลือก Lot ตามเดิมทุกขั้นตอน
// requireLot = false
//     ทุกธุรกรรมข้างต้นไม่ต้องกรอก/เลือก Lot; ระบบจัดการ lot ให้เองเบื้องหลัง
//
// สำคัญ — ทำไม lot=false ถึงยังมีแถว RCitemlist:
//   ยอดคงเหลือทั้งระบบคำนวณจาก RCitemlist + StockTransaction (ดู src/lib/stockBalance.ts)
//   ถ้าสินค้าที่ไม่ใช้ lot ไม่มีแถว RCitemlist เลย ยอดรับเข้า/ต้นทุน/FEFO จะหายไปทั้งสาย
//   ดังนั้นสินค้าไม่ใช้ lot ยังคงมีแถวรับเข้าเหมือนเดิม เพียงแต่ lot = "" และ dateExp = null
//   แล้วให้ UI ซ่อนช่อง Lot + ระบบเลือก/ปันส่วน lot ให้อัตโนมัติแบบ FEFO→FIFO
//
// ห้ามใช้ค่าอื่นแทน "" ในช่อง lot ของสินค้าไม่ใช้ lot (เช่น "-" หรือ "NOLOT")
// เพราะ /api/stocktransfer/pending-receive จับคู่ lot ผู้รับด้วย lot: transferItem.lot || ""
// และ calculateLotBalances() ข้าม lot ที่เป็นค่าว่างอยู่แล้ว — ค่าว่างจึงคือค่าที่ปลอดภัยที่สุด

/** ค่าที่บันทึกลง RCitemlist.lot / StockTransferItem.lot เมื่อสินค้าไม่ใช้ lot */
export const NO_LOT_VALUE = "";

/** ข้อความที่แสดงแทนเลข lot บนหน้าจอ เมื่อสินค้าไม่ใช้ lot */
export const NO_LOT_LABEL = "ไม่ใช้ Lot";

/** ป้ายกำกับสถานะบนฟอร์มข้อมูลสินค้า */
export const LOT_BADGE_ON = "มี Lot";
export const LOT_BADGE_OFF = "ไม่มี Lot";

const FALSE_TOKENS = new Set([
    "false", "0", "no", "n", "off",
    "ไม่", "ไม่มี", "ไม่มีlot", "ไม่ใช้lot", "ไม่ใช้", "nolot",
]);

/**
 * แปลงค่าดิบ (form / query string / CSV) เป็น boolean
 * ค่าว่าง/undefined/null = true เสมอ เพื่อให้ "ค่าเริ่มต้น = ต้องมี lot" ตามสเปก
 */
export function normalizeRequireLot(value: unknown): boolean {
    if (value === undefined || value === null || value === "") return true;
    if (typeof value === "boolean") return value;
    const token = String(value).trim().toLowerCase().replace(/\s+/g, "");
    return !FALSE_TOKENS.has(token);
}

/**
 * ใช้กับ object สินค้าที่ดึงมาจาก /api/datalist (หรือ cache)
 * สินค้าที่ยังไม่ได้โหลด/หาไม่เจอ ให้ถือว่า "ต้องมี lot" ไว้ก่อน (ปลอดภัยกว่า)
 */
export function isLotRequired(product: any): boolean {
    if (!product) return true;
    return normalizeRequireLot(product.requireLot);
}

/** เลข lot ที่ควรแสดงบนหน้าจอ ตามนโยบายของสินค้า */
export function displayLot(lot: unknown, requireLot: boolean): string {
    const text = String(lot ?? "").trim();
    if (text) return text;
    return requireLot ? "-" : NO_LOT_LABEL;
}

export interface AllocatableLot {
    id: number;
    lot?: string | null;
    dateExp?: string | Date | null;
    balance?: number | null;
    newCost?: number | null;
    [key: string]: any;
}

export interface LotAllocation<T extends AllocatableLot = AllocatableLot> {
    lot: T;
    qty: number;
}

/**
 * เรียง lot ตามลำดับที่ควรถูกตัดก่อน: FEFO (หมดอายุใกล้สุดก่อน)
 * → lot ที่ไม่มีวันหมดอายุตกไปท้าย แล้วเรียงต่อด้วย FIFO (id น้อยก่อน = รับเข้าก่อน)
 *
 * ลำดับเดียวกับ /api/cutstock (ORDER BY "dateExp" ASC ซึ่ง Postgres วาง NULL ไว้ท้าย)
 * เพื่อให้ยอดที่ระบบเลือกให้อัตโนมัติตรงกับ lot ที่จะถูกตัดจริงตอนขาย
 */
export function sortLotsForConsumption<T extends AllocatableLot>(lots: T[]): T[] {
    return [...lots].sort((a, b) => {
        const ta = a.dateExp ? new Date(a.dateExp).getTime() : Number.POSITIVE_INFINITY;
        const tb = b.dateExp ? new Date(b.dateExp).getTime() : Number.POSITIVE_INFINITY;
        if (ta !== tb) return ta - tb;
        return Number(a.id) - Number(b.id);
    });
}

/**
 * ปันส่วนจำนวนที่ต้องการออกเป็นรายการต่อ lot ตามลำดับ FEFO→FIFO
 * ใช้กับสินค้าไม่ใช้ lot เพื่อ "โอน/ปรับยอด" โดยที่ผู้ใช้ไม่ต้องเลือก lot เอง
 *
 * คืน shortage > 0 เมื่อยอดคงเหลือรวมไม่พอ (ผู้เรียกเป็นคนตัดสินใจว่าจะเตือนหรือปฏิเสธ)
 */
export function allocateFromLots<T extends AllocatableLot>(
    lots: T[],
    qty: number,
    /** ยอดที่ถูกจองไว้แล้วในตะกร้า (lotId → จำนวน) เพื่อไม่ให้ปันส่วนเกินของจริง */
    reserved?: Map<number, number>
): { allocations: LotAllocation<T>[]; shortage: number } {
    const allocations: LotAllocation<T>[] = [];
    let remaining = Number(qty) || 0;
    if (remaining <= 0) return { allocations, shortage: 0 };

    for (const lot of sortLotsForConsumption(lots)) {
        if (remaining <= 0) break;
        const alreadyUsed = reserved?.get(Number(lot.id)) || 0;
        const available = Math.max(0, (Number(lot.balance) || 0) - alreadyUsed);
        if (available <= 0) continue;
        const take = Math.min(available, remaining);
        allocations.push({ lot, qty: take });
        remaining -= take;
    }

    return { allocations, shortage: Math.max(0, remaining) };
}
