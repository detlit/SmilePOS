// Shared helpers สำหรับคำนวณยอดคงเหลือสินค้าให้สอดคล้องกันทั้งระบบ
//
// สูตรมาตรฐาน:
//   calculatedBalance = totalReceived − totalSale − totalTransferOut + totalTransferIn + totalAdjust
//
// ฟิลเตอร์มาตรฐาน:
//   - RCitemlist:       ใช้ Barcode ของสินค้าถ้ามี และ fallback เป็น itemcode เมื่อ code ไม่ซ้ำในบริษัท
//                        (totalReceived ไม่นับ lot ที่ statuss = "โอนสินค้า")
//                        จำนวนรับเข้า = qty + freebaht (ของแถม) — นับเฉพาะจำนวน ไม่กระทบต้นทุน (newCost/totalcost)
//   - Sale:             ใช้ barcode ของสินค้าถ้ามี และ fallback เป็น code_product เมื่อ code ไม่ซ้ำในบริษัท (statuss = "OK")
//                        ถ้า subqty=0/null/"" ใช้ qty แทน
//   - StockTransaction: ใช้ "กลุ่ม itemcodes" ที่ใช้ Barcode เดียวกัน (StockTransaction ไม่มีฟิลด์ barcode)

import { prisma } from "./prisma";

export interface StockBalanceBreakdown {
    totalReceived: number;       // ยอดรับเข้า (ไม่นับ lot ที่มาจากการโอน)
    totalSale: number;           // ยอดขาย (statuss = "OK")
    totalTransferOut: number;    // ยอดโอนออก
    totalTransferIn: number;     // ยอดรับโอนเข้า
    totalAdjust: number;         // ยอดปรับ (มีเครื่องหมาย ±)
    totalOtherIn: number;        // IN อื่น ๆ จาก StockTransaction
    totalBalance: number;        // ผลรวม lot.balance ดิบ ๆ
    calculatedBalance: number;   // ค่าคำนวณตามสูตรมาตรฐาน
    itemcodeGroup: string[];     // itemcodes ทั้งหมดที่ใช้ Barcode เดียวกัน
    productBarcode: string;      // Barcode ที่ใช้ filter (ว่างถ้าไม่มี)
}

export interface StockBalanceContext {
    company: string;
    itemcode: string;
    /** Barcode ของสินค้า — ถ้าไม่ส่งจะ lookup จาก Datalist เอง */
    barcode?: string | null;
    /** product id (ใช้กรณี itemcode ซ้ำกันใน company) */
    productId?: number | null;
}

/**
 * จำนวนที่รับเข้าสต็อกจริงของ lot หนึ่ง ๆ = qty (ที่จ่ายเงิน) + freebaht (ของแถม)
 * ใช้เป็นนิยามกลางเดียวทั้งระบบ เพื่อให้ทุกจุดที่คำนวณ "ยอดรับเข้า/คงเหลือ" ตรงกัน
 * (นับเฉพาะจำนวน ไม่กระทบต้นทุน newCost/totalcost)
 */
export function receivedQty(lot: { qty?: number | null; freebaht?: number | null }): number {
    return (lot.qty || 0) + (lot.freebaht || 0);
}

/**
 * จำนวนขายในหน่วยสต็อกของบรรทัดขายหนึ่ง ๆ
 * ถ้า subqty = 0/null/"" ใช้ qty แทน, ถ้า subqty != 0 ใช้ subqty
 */
export function saleStockQty(sale: { qty?: number | null; subqty?: unknown }): number {
    const subqty = sale.subqty;
    const qty = sale.qty || 0;
    const useQty = (subqty === null || subqty === undefined || subqty === "" || subqty === 0) ? qty : subqty;
    return parseFloat(String(useQty)) || 0;
}

export interface StockTxTotals {
    totalTransferOut: number;
    totalTransferIn: number;
    totalAdjust: number;
    totalOtherIn: number;
}

export function emptyStockTxTotals(): StockTxTotals {
    return { totalTransferOut: 0, totalTransferIn: 0, totalAdjust: 0, totalOtherIn: 0 };
}

/**
 * จุดเดียวที่ตัดสินว่า transaction_type ไหนถูกนับเป็นยอดอะไร
 * ทุกหน้าที่แสดง "ยอดคงเหลือ" ต้องเรียกผ่านฟังก์ชันนี้ เพื่อไม่ให้สูตรแยกกันเมื่อมี type ใหม่
 *   TRANSFER_RETURN = ผู้รับยืนยันไม่ครบ ของถูกคืนกลับสต็อกผู้ส่ง — นับเป็นรับโอนเข้า
 */
export function addStockTransaction(
    totals: StockTxTotals,
    tx: { transaction_type?: string | null; quantity_change?: number | null }
): void {
    const type = (tx.transaction_type || "").toUpperCase();
    const signed = Number(tx.quantity_change || 0);
    const q = Math.abs(signed);
    if (type === "TRANSFER_OUT") totals.totalTransferOut += q;
    else if (type === "TRANSFER_IN" || type === "TRANSFER_RETURN") totals.totalTransferIn += q;
    else if (type === "ADJUST") totals.totalAdjust += signed; // keep sign
    else if (type === "IN") totals.totalOtherIn += q;
}

export function sumStockTransactions(
    transactions: { transaction_type?: string | null; quantity_change?: number | null }[]
): StockTxTotals {
    const totals = emptyStockTxTotals();
    for (const tx of transactions) addStockTransaction(totals, tx);
    return totals;
}

/** สูตรมาตรฐาน: รับ − ขาย − โอนออก + รับโอน + ปรับยอด */
export function standardBalance(parts: {
    totalReceived: number;
    totalSale: number;
    totalTransferOut: number;
    totalTransferIn: number;
    totalAdjust: number;
}): number {
    return parts.totalReceived
        - parts.totalSale
        - parts.totalTransferOut
        + parts.totalTransferIn
        + parts.totalAdjust;
}

/**
 * หา itemcodes ทุกตัวที่ใช้ Barcode เดียวกัน (ใน company เดียวกัน)
 * ใช้สำหรับคิวรี StockTransaction ที่ไม่มีฟิลด์ barcode
 */
export async function resolveItemcodeGroup(
    company: string,
    itemcode: string,
    barcode?: string | null
): Promise<string[]> {
    const bc = (barcode || "").trim();
    if (!bc) return [itemcode];
    const sameBarcodeProducts = await prisma.datalist.findMany({
        where: { company, Barcode: bc },
        select: { code: true }
    });
    const codes = sameBarcodeProducts
        .map(p => p.code)
        .filter((c): c is string => !!c);
    if (codes.length === 0) return [itemcode];
    return Array.from(new Set([itemcode, ...codes]));
}

/**
 * ดึง Barcode ของสินค้าจาก Datalist
 * รองรับการระบุด้วย product id (กรณี code ซ้ำกัน)
 */
export async function getProductBarcode(
    company: string,
    itemcode: string,
    productId?: number | null
): Promise<string> {
    const id = productId != null && !isNaN(Number(productId)) ? Number(productId) : null;
    const product = await prisma.datalist.findFirst({
        where: id != null ? { company, id } : { company, code: itemcode },
        select: { Barcode: true }
    });
    return (product?.Barcode || "").trim();
}

/**
 * อนุญาตให้ fallback ด้วย itemcode เฉพาะเมื่อ code นี้มีสินค้าเดียวในบริษัท
 * เพื่อดึง lot เก่าที่บันทึก Barcode ผิด/เก่า โดยไม่รวมสินค้ารหัสซ้ำคนละ Barcode เข้าด้วยกัน
 */
export async function shouldUseItemcodeFallback(
    company: string,
    itemcode: string,
    barcode?: string | null
): Promise<boolean> {
    const bc = (barcode || "").trim();
    if (!bc || !itemcode) return false;
    const productCount = await prisma.datalist.count({
        where: { company, code: itemcode }
    });
    return productCount <= 1;
}

export function buildRcItemLookupWhere(
    company: string,
    itemcode: string,
    barcode?: string | null,
    useItemcodeFallback = false
) {
    const bc = (barcode || "").trim();
    if (!bc) return { company, itemcode };
    if (useItemcodeFallback) {
        return { company, OR: [{ Barcode: bc }, { itemcode }] };
    }
    return { company, Barcode: bc };
}

export function buildSaleLookupWhere(
    company: string,
    itemcode: string,
    barcode?: string | null,
    useItemcodeFallback = false
) {
    const bc = (barcode || "").trim();
    if (!bc) return { company, code_product: itemcode, statuss: "OK" };
    if (useItemcodeFallback) {
        return { company, statuss: "OK", OR: [{ barcode: bc }, { code_product: itemcode }] };
    }
    return { company, barcode: bc, statuss: "OK" };
}

export function buildStockTransferItemLookupWhere(
    itemcode: string,
    barcode?: string | null,
    useItemcodeFallback = false
) {
    const bc = (barcode || "").trim();
    if (!bc) return { itemcode };
    if (useItemcodeFallback) {
        return { OR: [{ barcode: bc }, { itemcode }] };
    }
    return { barcode: bc };
}

export interface BulkBalanceBreakdown extends StockTxTotals {
    totalReceived: number;
    totalSale: number;
    calculatedBalance: number;
}

export interface BulkStockBalance {
    /** คีย์กลุ่มของสินค้า — Barcode เดียวกันถือเป็นยอดเดียวกัน ถ้าไม่มี Barcode ใช้รหัสสินค้า */
    groupKeyOf: (barcode?: string | null, code?: string | null) => string;
    /** ยอดแยกช่องของกลุ่มสินค้านั้น (รับ/ขาย/โอน/ปรับ + ยอดคงเหลือ) */
    breakdownOf: (barcode?: string | null, code?: string | null) => BulkBalanceBreakdown;
    /** ยอดคงเหลือมาตรฐานของกลุ่มสินค้านั้น */
    balanceOf: (barcode?: string | null, code?: string | null) => number;
    /** ยอดคงเหลือของคีย์กลุ่มโดยตรง (ใช้เมื่อวนตามกลุ่มที่จัดไว้แล้ว) */
    balanceByKey: (groupKey: string) => number;
}

/**
 * คำนวณยอดคงเหลือมาตรฐานของ "ทุกสินค้าในบริษัท" ในรอบเดียว
 * ใช้สูตร/ฟิลเตอร์ชุดเดียวกับ computeStockBalance() และ /api/stock-balance-summary
 * (หน้าไหนที่ต้องแสดงยอดคงเหลือหลายสินค้าพร้อมกัน ให้เรียกผ่านฟังก์ชันนี้ ห้ามคำนวณเอง)
 *
 * ผู้เรียกต้องดึงข้อมูลมาให้ครบทั้งบริษัท:
 *   lots         = RCitemlist ทั้งหมด (statuss = "โอนสินค้า" จะถูกกรองออกจากยอดรับให้เอง)
 *   sales        = Sale ที่ statuss = "OK" ทั้งหมด
 *   transactions = StockTransaction ทั้งหมด
 */
export function buildBulkStockBalance(input: {
    products: { code?: string | null; Barcode?: string | null }[];
    lots: { itemcode?: string | null; Barcode?: string | null; qty?: number | null; freebaht?: number | null; statuss?: string | null }[];
    sales: { barcode?: string | null; code_product?: string | null; qty?: number | null; subqty?: unknown }[];
    transactions: { itemcode?: string | null; transaction_type?: string | null; quantity_change?: number | null }[];
}): BulkStockBalance {
    const { products, lots, sales, transactions } = input;

    // จัดกลุ่มสินค้าตาม Barcode (สินค้าที่ Barcode เดียวกันถือเป็นยอดเดียวกัน) ถ้าไม่มี Barcode ใช้รหัสสินค้า
    const barcodeSet = new Set<string>();
    const codeToGroupKey = new Map<string, string>();
    for (const p of products) {
        const bc = (p.Barcode || "").trim();
        const code = p.code || "";
        if (bc) barcodeSet.add(bc);
        if (code) codeToGroupKey.set(code, bc ? `B:${bc}` : `C:${code}`);
    }

    const groupKeyOf = (barcode?: string | null, code?: string | null) => {
        const bc = (barcode || "").trim();
        if (bc && barcodeSet.has(bc)) return `B:${bc}`;
        const c = code || "";
        return codeToGroupKey.get(c) || (bc ? `B:${bc}` : `C:${c}`);
    };

    const byGroup = new Map<string, BulkBalanceBreakdown>();
    const bucketOf = (key: string): BulkBalanceBreakdown => {
        let bucket = byGroup.get(key);
        if (!bucket) {
            bucket = { totalReceived: 0, totalSale: 0, ...emptyStockTxTotals(), calculatedBalance: 0 };
            byGroup.set(key, bucket);
        }
        return bucket;
    };

    // ยอดรับ = qty + ของแถม(freebaht) ของล็อตที่ไม่ใช่รายการโอน (statuss != "โอนสินค้า")
    for (const lot of lots) {
        if (lot.statuss === "โอนสินค้า") continue;
        bucketOf(groupKeyOf(lot.Barcode, lot.itemcode)).totalReceived += receivedQty(lot);
    }

    for (const sale of sales) {
        bucketOf(groupKeyOf(sale.barcode, sale.code_product)).totalSale += saleStockQty(sale);
    }

    // StockTransaction ไม่มีฟิลด์ barcode จึงจับกลุ่มผ่าน itemcode
    for (const tx of transactions) {
        addStockTransaction(bucketOf(groupKeyOf(null, tx.itemcode)), tx);
    }

    byGroup.forEach(bucket => { bucket.calculatedBalance = standardBalance(bucket); });

    const emptyBreakdown = (): BulkBalanceBreakdown =>
        ({ totalReceived: 0, totalSale: 0, ...emptyStockTxTotals(), calculatedBalance: 0 });

    const breakdownOf = (barcode?: string | null, code?: string | null) =>
        byGroup.get(groupKeyOf(barcode, code)) || emptyBreakdown();

    return {
        groupKeyOf,
        breakdownOf,
        balanceOf: (barcode, code) => breakdownOf(barcode, code).calculatedBalance,
        balanceByKey: (groupKey) => byGroup.get(groupKey)?.calculatedBalance || 0,
    };
}

export interface CalculatedLot {
    id: number;
    lot: string | null;
    dateExp: Date | null;
    qty: number | null;
    freebaht: number | null;
    received: number; // จำนวนรับเข้าจริง = qty + freebaht (lot โอน = ยอด TRANSFER_IN ที่จับคู่ได้)
    balance: number;
    rawBalance: number | null;
    balanceDiff: number;
    newCost: number | null;
    /** ทุนสุทธิหลังหักส่วนลดต่อบรรทัด — อ่านผ่าน lotUnitCost() ใน src/lib/lotCost.ts เสมอ */
    netCost: number | null;
    /** ส่วนลดของบรรทัดรับเข้า (บาท ทั้งบรรทัด) — ติดมาด้วยเพื่อให้ทุนสุทธิคำนวณย้อนได้ครบ */
    discountbaht: number | null;
    totalcost: number | null;
    namevender: string | null;
    codevender: string | null;
    dateRC: Date | null;
    createDate: Date | null;
    person: string | null;
    type: string | null;
    maker: string | null;
    qty_unit: string | null;
    itemcode: string | null;
    itemName: string | null;
    unit: string | null;
    subtype: string | null;
    Barcode: string | null;
    statuss: string | null;
    /** เลขเอกสารที่มาของ lot — เลข order รับสินค้า หรือ "TRF:<เลขใบโอน>" สำหรับ lot รับโอน */
    codenames: string | null;
}

/**
 * จำนวนที่ "โอน/ขายออกได้จริง" ของ lot = min(balance ที่บันทึกจริง, ยอดคำนวณจาก transaction)
 * ใช้ clamp สองทางแบบเดียวกับ cutstock เพื่อกันทั้งเคส balance ดิบค้างสูง และเคส transaction เก่าจับคู่ไม่ได้
 */
export function transferableLotQty(lot: Pick<CalculatedLot, "balance" | "rawBalance">): number {
    const raw = lot.rawBalance == null ? lot.balance : lot.rawBalance;
    return Math.max(0, Math.min(raw, lot.balance));
}

/**
 * คำนวณ balance ต่อ lot จาก qty รับเข้า + ผลรวม transaction delta (โอน/ปรับ/ขาย)
 * ที่จับคู่กับ lot นั้น ๆ — สูตรเดียวกับที่ /api/stock-balance-summary ใช้แสดงตาราง Lot สินค้า
 */
export function calculateLotBalances(lots: any[], transactions: any[], sales: any[]): CalculatedLot[] {
    const lotIds = new Set(lots.map(lot => Number(lot.id)));
    const normalizeLot = (value: unknown) => String(value || "").trim().toLowerCase();
    const lotCodeToIds = new Map<string, number[]>();
    const lotTransactionDelta = new Map<number, number>();
    // ยอด TRANSFER_IN ที่จับคู่ได้ต่อ lot — ใช้แสดงช่อง "รับ" ของ lot ที่มาจากการโอน
    const lotTransferInTotal = new Map<number, number>();

    for (const lot of lots) {
        const lotKey = normalizeLot(lot.lot);
        if (!lotKey) continue;
        lotCodeToIds.set(lotKey, [...(lotCodeToIds.get(lotKey) || []), Number(lot.id)]);
    }

    const resolveLotIdByCode = (lotCode: unknown): number | null => {
        const matchingLotIds = lotCodeToIds.get(normalizeLot(lotCode)) || [];
        return matchingLotIds.length === 1 ? matchingLotIds[0] : null;
    };

    // หา lot ปลายทางของ transaction: inventory_lot_id → product_id (ข้อมูลเก่า) → เทียบเลข lot (เมื่อไม่กำกวม)
    const resolveTxLotId = (tx: any): number | null => {
        const inventoryLotId = Number(tx.inventory_lot_id || 0);
        if (lotIds.has(inventoryLotId)) return inventoryLotId;
        const legacyProductId = Number(tx.product_id || 0);
        if (lotIds.has(legacyProductId)) return legacyProductId;
        return resolveLotIdByCode(tx.lot);
    };

    const addLotDelta = (lotId: number | null, delta: number) => {
        if (lotId == null || !lotIds.has(lotId) || !Number.isFinite(delta)) return false;
        lotTransactionDelta.set(lotId, (lotTransactionDelta.get(lotId) || 0) + delta);
        return true;
    };

    for (const tx of transactions) {
        const type = (tx.transaction_type || "").toUpperCase();
        // TRANSFER_RETURN = ผู้รับยืนยันไม่ครบแล้วคืนของกลับ lot ผู้ส่ง (ยอดบวก)
        // RETURN = คืนสินค้า/ยกเลิกบิล (ยอดบวก) — cutstock นับด้วย จึงต้องนับให้ตรงกัน
        if (["TRANSFER_OUT", "TRANSFER_IN", "ADJUST", "TRANSFER_RETURN", "RETURN"].includes(type)) {
            const targetLotId = resolveTxLotId(tx);
            const delta = Number(tx.quantity_change || 0);
            if (!addLotDelta(targetLotId, delta)) continue;
            if (type === "TRANSFER_IN" && delta > 0 && targetLotId != null) {
                lotTransferInTotal.set(targetLotId, (lotTransferInTotal.get(targetLotId) || 0) + delta);
            }
        }
    }

    const saleStockTx = transactions.filter(tx => (tx.transaction_type || "").toUpperCase() === "SALE");
    let assignedSaleStockTxCount = 0;
    for (const tx of saleStockTx) {
        if (addLotDelta(resolveTxLotId(tx), Number(tx.quantity_change || 0))) {
            assignedSaleStockTxCount += 1;
        }
    }

    if (assignedSaleStockTxCount === 0) {
        for (const sale of sales as any[]) {
            for (const idx of [1, 2, 3]) {
                const lotId = Number(sale[`id_receive${idx}`] || 0);
                const lotQty = Number(sale[`qty_lot${idx}`] || 0);
                if (lotQty <= 0) continue;
                if (!addLotDelta(lotIds.has(lotId) ? lotId : null, -lotQty)) {
                    addLotDelta(resolveLotIdByCode(sale[`lot_receive${idx}`]), -lotQty);
                }
            }
        }
    }

    return lots.map(lot => {
        const lotId = Number(lot.id);
        const isTransferLot = (lot.statuss || "") === "โอนสินค้า";
        const transferInTotal = lotTransferInTotal.get(lotId) || 0;
        // lot ที่มาจากการโอน: ยอดตั้งต้น = 0 เพราะยอดรับโอนถูกบันทึกเป็น TRANSFER_IN อยู่แล้ว
        // (qty ของ lot โอนคือยอดรับโอนสะสม — ถ้านับ qty ด้วยจะนับซ้ำ)
        // lot รับเข้าปกติ: นับของแถม (freebaht) รวมกับ qty ด้วย (ไม่กระทบต้นทุน)
        const baseQty = isTransferLot ? 0 : receivedQty(lot);
        const calculatedLotBalance = baseQty + (lotTransactionDelta.get(lotId) || 0);
        // ช่อง "รับ" ของ lot โอน = ยอดรับโอนเข้าที่จับคู่ได้ (ถ้าจับคู่ transaction เก่าไม่ได้ ใช้ qty เดิม)
        const received = isTransferLot && transferInTotal > 0 ? transferInTotal : receivedQty(lot);
        return {
            id: lot.id,
            lot: lot.lot,
            dateExp: lot.dateExp,
            qty: lot.qty,
            freebaht: lot.freebaht ?? null,
            received,
            balance: calculatedLotBalance,
            rawBalance: lot.balance,
            balanceDiff: calculatedLotBalance - (lot.balance || 0),
            newCost: lot.newCost,
            netCost: lot.netCost ?? null,
            discountbaht: lot.discountbaht ?? null,
            totalcost: lot.totalcost,
            namevender: lot.namevender,
            codevender: lot.codevender,
            dateRC: lot.dateRC,
            createDate: lot.createDate,
            person: lot.person,
            type: lot.type,
            maker: lot.maker,
            qty_unit: lot.qty_unit,
            itemcode: lot.itemcode ?? null,
            itemName: lot.itemName ?? null,
            unit: lot.unit ?? null,
            subtype: lot.subtype ?? null,
            Barcode: lot.Barcode ?? null,
            statuss: lot.statuss ?? null,
            codenames: lot.codenames ?? null
        };
    });
}

/**
 * ดึง lot ทั้งหมดของสินค้าหนึ่งรายการ พร้อม balance ที่คำนวณใหม่ตาม transaction
 * (ใช้สูตรเดียวกับ /api/stock-balance-summary)
 */
export async function getLotsWithCalculatedBalance(
    ctx: StockBalanceContext,
    /** Prisma client หรือ transaction client — ส่ง tx มาเมื่อต้องอ่านข้อมูลที่เพิ่งเขียนใน transaction เดียวกัน */
    db: any = prisma
): Promise<CalculatedLot[]> {
    const { company, itemcode } = ctx;

    const productBarcode = ctx.barcode != null
        ? (ctx.barcode || "").trim()
        : await getProductBarcode(company, itemcode, ctx.productId);

    const itemcodeGroup = await resolveItemcodeGroup(company, itemcode, productBarcode);
    const useItemcodeFallback = await shouldUseItemcodeFallback(company, itemcode, productBarcode);

    const lots = await db.rCitemlist.findMany({
        where: buildRcItemLookupWhere(company, itemcode, productBarcode, useItemcodeFallback),
        orderBy: { createDate: "desc" }
    });

    const transactions = await db.stockTransaction.findMany({
        where: { company, itemcode: { in: itemcodeGroup } },
        orderBy: { createDate: "desc" }
    });

    const sales = await db.sale.findMany({
        where: buildSaleLookupWhere(company, itemcode, productBarcode, useItemcodeFallback),
        orderBy: { createDate: "desc" }
    });

    return calculateLotBalances(lots, transactions, sales);
}

/**
 * คำนวณยอดคงเหลือมาตรฐานของสินค้าหนึ่งรายการ
 * (สูตรเดียวกับ /api/stock-balance-summary)
 */
export async function computeStockBalance(ctx: StockBalanceContext): Promise<StockBalanceBreakdown> {
    const { company, itemcode } = ctx;

    // 1. หา barcode ถ้ายังไม่มี
    const productBarcode = ctx.barcode != null
        ? (ctx.barcode || "").trim()
        : await getProductBarcode(company, itemcode, ctx.productId);

    // 2. หา itemcodes ทั้งหมดที่ใช้ barcode เดียวกัน
    const itemcodeGroup = await resolveItemcodeGroup(company, itemcode, productBarcode);
    const useItemcodeFallback = await shouldUseItemcodeFallback(company, itemcode, productBarcode);

    // 3. RCitemlist (รับเข้า) — อิง Barcode ถ้ามี
    const lots = await prisma.rCitemlist.findMany({
        where: buildRcItemLookupWhere(company, itemcode, productBarcode, useItemcodeFallback),
        select: { qty: true, freebaht: true, balance: true, statuss: true }
    });

    // 4. Sale (ยอดขาย) — อิง Barcode ถ้ามี
    const sales = await prisma.sale.findMany({
        where: buildSaleLookupWhere(company, itemcode, productBarcode, useItemcodeFallback),
        select: { qty: true, subqty: true }
    });

    // 5. StockTransaction (โอน/ปรับ/IN อื่น ๆ) — ใช้กลุ่ม itemcodes
    const transactions = await prisma.stockTransaction.findMany({
        where: { company, itemcode: { in: itemcodeGroup } },
        select: { transaction_type: true, quantity_change: true }
    });

    const nonTransferLots = lots.filter(l => l.statuss !== "โอนสินค้า");
    // ยอดรับเข้านับของแถม (freebaht) รวมกับ qty ด้วย (เฉพาะจำนวน ไม่กระทบต้นทุน)
    const totalReceived = nonTransferLots.reduce((s, l) => s + receivedQty(l), 0);
    const totalBalance = lots.reduce((s, l) => s + (l.balance || 0), 0);

    const totalSale = sales.reduce((sum: number, s: any) => sum + saleStockQty(s), 0);

    const txTotals = sumStockTransactions(transactions);

    return {
        totalReceived,
        totalSale,
        ...txTotals,
        totalBalance,
        calculatedBalance: standardBalance({ totalReceived, totalSale, ...txTotals }),
        itemcodeGroup,
        productBarcode,
    };
}
