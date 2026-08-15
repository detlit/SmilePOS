// ซ่อมยอด lot ย้อนหลัง — ใช้โดย /api/cut-lot-retroactive และ /api/lot-repair
//
// แนวคิด: "ไล่บัญชี lot ใหม่ทั้งเส้น" (rebuild) ไม่ใช่แค่ปะยอดที่บันทึกไว้
//   หน้าสรุปยอดคงเหลือคำนวณคงเหลือของแต่ละ lot จาก transaction ใหม่ทุกครั้ง
//   การเขียนทับช่อง balance เฉย ๆ จึงไม่มีทางทำให้ยอดตรง ตราบใดที่ประวัติ transaction
//   ยังตัด lot แบบเกินจริงอยู่ (เช่นใบโอนออก 400 หน่วยไปตัด lot ที่มีของจริง 20 หน่วย)
//
// ขั้นตอนการซ่อมหนึ่งสินค้า:
//   1. เทียบยอดขาย: บิล (ตาราง Sale) ↔ รายการตัดสต๊อก (SALE transaction)
//        • tx มากกว่าบิล = ตัดซ้ำ  → ลบรายการซ้ำ (สำรองก่อนลบ)
//        • บิลมากกว่า tx = ขายแล้วไม่ได้ตัด → สร้างรายการตัดสต๊อกย้อนหลัง
//   2. รับโอนเข้าที่ lot ฝั่งผู้รับหายไป (เช่นโดน restore ทับ) → สร้าง lot รับโอนใหม่
//   3. ไล่เหตุการณ์ทั้งหมดตามเวลา (src/lib/lotLedger.ts) แล้วจัดสรรของออกทุกรายการ
//      ลง lot ที่มีของอยู่จริง ณ เวลานั้น — เคารพ lot เดิมก่อนถ้าของพอ ไม่พอค่อยไล่ FEFO
//   4. เขียนกลับ: ย้าย/แยกรายการที่ต้องเปลี่ยน lot + ปรับ balance และตัวนับขายของทุก lot
//
// ผลลัพธ์: ทุก lot ไม่ติดลบ, ไม่มี lot ไหนถูกตัดเกินจำนวนที่รับเข้า/รับโอนมาจริง และ
// ผลรวมคงเหลือทุก lot = ยอดคงเหลือคำนวณของสินค้า (สูตรเดียวกับหน้าสรุปยอดคงเหลือ)
//
// ทุกการแก้สำรองค่าเดิมลงตาราง _selfheal_lot_relink_log (jsonb before/after) ก่อนเสมอ

import {
    LedgerLot,
    LedgerTx,
    ledgerDirectionOf,
    rebuildLotLedger
} from "./lotLedger";
import {
    buildRcItemLookupWhere,
    buildSaleLookupWhere,
    calculateLotBalances,
    getProductBarcode,
    receivedQty,
    resolveItemcodeGroup,
    shouldUseItemcodeFallback
} from "./stockBalance";

export interface RelinkPiece {
    lotId: number;
    lot: string | null;
    dateExp: Date | null;
    qty: number;
    balanceAfter: number;
}

export interface RelinkTxPlan {
    txId: number;
    txType: string;         // SALE | TRANSFER_OUT | ADJUST | TRANSFER_IN … — คงประเภทเดิมตอน split
    direction: "in" | "out";
    qty: number;            // จำนวนของรายการ (บวกเสมอ)
    pieces: RelinkPiece[];  // แบ่งลงแต่ละ lot
    leftover: number;       // ส่วนที่ lot ไม่พอ — คงเป็น lot-less ต่อไป
    /** true = รายการนี้เคยผูก lot ไว้แล้ว แต่ lot นั้นมีของไม่พอจริง จึงถูกย้าย */
    reassigned: boolean;
}

export interface RelinkLotChange {
    lotId: number;          // ติดลบ = lot รับโอนที่จะสร้างใหม่
    lot: string | null;
    dateExp: Date | null;
    received: number;       // จำนวนรับเข้าจากใบรับสินค้า (lot โอน = ยอดรับโอนที่จับคู่ได้)
    /** ของเข้าทั้งหมดของ lot หลังไล่บัญชี = รับเข้า + รับโอน + คืน + ปรับเพิ่ม
     *  (ตัวตั้งของสมการ ของเข้า − ตัดออก = คงเหลือ) */
    inflow: number;
    storedBalance: number;  // balance ที่บันทึกอยู่ใน DB ตอนนี้
    calcBalance: number;    // ยอดคงเหลือหลังไล่บัญชีใหม่ (ก่อน clamp)
    allocated: number;      // ของออกทั้งหมดที่ถูกจัดสรรลง lot นี้
    newBalance: number;     // balance ใหม่ที่จะบันทึก
    currentSale: number;    // ตัวนับขายปัจจุบัน
    newSale: number;        // ตัวนับขายใหม่ (sync ตาม convention lot-edit)
    isNewLot?: boolean;     // true = lot รับโอนที่จะสร้างใหม่
}

export interface RelinkItemPlan {
    itemcode: string;
    itemName: string;
    barcode: string;
    /** รายการขาย/โอนออก/ปรับยอดลด ที่ไม่ได้ผูก lot (กำพร้า) */
    txCount: number;
    totalUnassignedQty: number;
    assignable: number;
    remaining: number;
    saleFallbackWarning: boolean;
    /** ยอดปลายทางของ "ทุก lot" หลังไล่บัญชีใหม่ */
    lots: RelinkLotChange[];
    /** รายการที่ต้องเขียนกลับ DB (ผูกใหม่ / ย้าย lot / แยก lot) */
    txPlan: RelinkTxPlan[];
    /** SALE transaction กำพร้าที่เป็น "รายการซ้ำเกินจริง" (ยอด tx ขายรวม > ยอดขายจริงจากบิล)
     *  — จะถูกลบทิ้งแทนการผูก lot เพราะสินค้าถูกตัดโดยรายการที่ถูกต้องไปแล้ว */
    deleteTxs: { txId: number; qty: number }[];
    deleteQty: number;
    /** lot รับโอนฝั่งผู้รับที่หายไป (TRANSFER_IN จับคู่ไม่ได้ และไม่มี lot ชื่อนั้นอยู่เลย
     *  เช่นโดน restore ทับ) — จะสร้าง lot ใหม่ statuss "โอนสินค้า" แล้วผูกรายการเข้า */
    createLots: { lot: string; qty: number; dateExp: Date | null; dateRC: Date | null; person: string; txIds: number[] }[];
    createQty: number;
    /** บิลที่ขายแล้วแต่ไม่มี SALE transaction (ตัดสต๊อกไม่สำเร็จตอนชำระ)
     *  — จะสร้าง SALE transaction ย้อนหลังผูก lot ตามผลไล่บัญชีใหม่ */
    createSaleTxs: {
        saleId: number | null;
        qty: number;
        lotId: number;
        lot: string | null;
        dateExp: Date | null;
        balanceAfter: number;
        createDate: Date | null;
        person: string;
        /** true = เติมเลข lot กลับเข้าแถวบิลด้วย (บิลนั้นยังไม่มี lot และตัดจบใน lot เดียว) */
        fillSaleLot: boolean;
    }[];
    createSaleQty: number;
    /** ยอดขายที่ตรวจพบว่าไม่มี transaction */
    uncutSaleQty: number;
    /** ส่วนที่ยังตัดไม่ได้ (ของในทุก lot ไม่พอ) */
    uncutSaleRemaining: number;
    /** รายการที่เคยผูก lot ไว้แล้ว แต่ lot นั้นมีของไม่พอ จึงย้ายไปตัด lot ที่มีของจริง */
    reassignTxCount: number;
    reassignQty: number;
    /** ของออกที่ไม่มี lot ไหนรองรับเลย (ขาย/โอนออกมากกว่าของที่เคยรับเข้าจริง) */
    unallocatedQty: number;
    /** ของเข้า (คืน/ปรับเพิ่ม) ที่ไม่รู้ lot แล้วถูกฝากเข้า lot ที่รับล่าสุด */
    attachedInflowCount: number;
    attachedInflowQty: number;
    /** สินค้ายุคเก่าที่ยอดขายยังผูก lot อยู่ในตัวบิล (ไม่มี SALE transaction) — ย้าย lot ขายไม่ได้ */
    legacyMode: boolean;
    /** ผลรวมคงเหลือทุก lot หลังไล่บัญชีใหม่ */
    ledgerTotal: number;
}

/** การเปลี่ยนแปลงต่อ lot ของการซ่อมทั้งสินค้า */
export interface RepairLotChange {
    lotId: number;          // ติดลบ = lot รับโอนที่จะสร้างใหม่ (ยังไม่มีใน DB)
    lot: string | null;
    dateExp: Date | null;
    received: number;
    /** ของเข้าทั้งหมด (รับเข้า + รับโอน + คืน + ปรับเพิ่ม) — ของเข้า − ตัดออก = คงเหลือ */
    inflow: number;
    storedBalance: number;
    currentSale: number;
    allocated: number;      // ของออกที่ถูกจัดสรรลง lot นี้หลังไล่บัญชีใหม่
    calcBalance: number;    // ยอดคงเหลือหลังไล่บัญชีใหม่ (ก่อน clamp)
    newBalance: number;
    newSale: number;
    isNewLot?: boolean;
}

export interface LotRepairPlan {
    itemcode: string;
    itemName: string;
    barcode: string;
    orphanTxCount: number;
    orphanQty: number;
    orphanAssignable: number;
    orphanRemaining: number;
    deleteTxCount: number;   // SALE tx ซ้ำเกินจริงที่จะลบ
    deleteQty: number;
    createLotCount: number;  // lot รับโอนที่หายไปที่จะสร้างใหม่
    createQty: number;
    createSaleTxCount: number;   // รายการตัดสต๊อกย้อนหลังที่จะสร้างให้บิลที่ขายแล้วไม่ได้ตัด
    createSaleQty: number;
    uncutSaleQty: number;        // ยอดขายที่ไม่มีรายการตัดสต๊อก (ที่ตรวจพบ)
    uncutSaleRemaining: number;  // ส่วนที่ยังตัดให้ไม่ได้ (ของไม่พอ)
    reassignTxCount: number;     // รายการที่ต้องย้าย lot ใหม่ให้สอดคล้องกับของที่รับเข้าจริง
    reassignQty: number;
    unallocatedQty: number;      // ของออกที่ไม่มี lot รองรับ (สต็อกเคยติดลบจริง)
    attachedInflowCount: number;
    attachedInflowQty: number;
    legacyMode: boolean;
    saleFallbackWarning: boolean;
    changes: RepairLotChange[];   // เฉพาะ lot ที่ค่าจะเปลี่ยน
    lotCount: number;
    storedTotal: number;          // ยอดรวม balance ที่บันทึกตอนนี้ (ทุก lot)
    newTotal: number;             // ยอดรวม balance หลังซ่อม (ทุก lot)
    calculatedBalance: number;    // ยอดคงเหลือคำนวณระดับสินค้า (สูตรเดียวกับหน้าสรุป)
    relink: RelinkItemPlan | null;
}

const EPS = 1e-9;

const txTypeOf = (tx: any) => String(tx?.transaction_type || "").toUpperCase();

const timeOf = (value: unknown): number => {
    if (value == null) return 0;
    const t = new Date(value as any).getTime();
    return Number.isFinite(t) ? t : 0;
};

/** จำนวนขายจริงของแถวบิล — subqty (หน่วยฐาน) มาก่อน ถ้าไม่มีค่อยใช้ qty */
function saleRowQty(sale: any): number {
    const subqty = sale?.subqty;
    const useQty = (subqty === null || subqty === undefined || subqty === "" || subqty === 0)
        ? (sale?.qty || 0) : subqty;
    return parseFloat(String(useQty)) || 0;
}

/** บิลใบนี้มีการระบุ lot ไว้ในตัวบิลหรือไม่ (ทั้ง 3 ช่อง) */
function saleHasLotInfo(sale: any): boolean {
    return [1, 2, 3].some(idx =>
        Number(sale?.[`id_receive${idx}`] || 0) > 0 || String(sale?.[`lot_receive${idx}`] || "").trim() !== ""
    );
}

/**
 * ยอดคงเหลือคำนวณระดับสินค้า (สูตรเดียวกับ /api/stock-balance-summary):
 * รับทั้งหมด − ขายจากบิล − โอนออก + รับโอน + ปรับยอด
 */
function productCalculatedBalance(lots: any[], transactions: any[], sales: any[]): number {
    const nonTransferLots = lots.filter(l => l.statuss !== "โอนสินค้า");
    const totalReceived = nonTransferLots.reduce((s, l) => s + receivedQty(l), 0);
    const totalSale = sales.reduce((sum: number, s: any) => sum + saleRowQty(s), 0);
    let totalTransferOut = 0, totalTransferIn = 0, totalAdjust = 0;
    for (const t of transactions) {
        const type = txTypeOf(t);
        const q = Math.abs(t.quantity_change || 0);
        if (type === "TRANSFER_OUT") totalTransferOut += q;
        else if (type === "TRANSFER_IN" || type === "TRANSFER_RETURN") totalTransferIn += q;
        else if (type === "ADJUST") totalAdjust += (t.quantity_change || 0);
    }
    return totalReceived - totalSale - totalTransferOut + totalTransferIn + totalAdjust;
}

/** หา itemcode ที่มี orphan SALE/TRANSFER_OUT/ADJUST transaction (lot ว่าง + ไม่ผูก inventory_lot_id) */
export async function findOrphanSaleItemcodes(db: any, company: string): Promise<string[]> {
    const rows: { itemcode: string | null }[] = await db.stockTransaction.findMany({
        where: {
            company,
            transaction_type: { in: ["SALE", "TRANSFER_OUT", "ADJUST"] },
            inventory_lot_id: null,
            OR: [{ lot: null }, { lot: "" }]
        },
        select: { itemcode: true },
        distinct: ["itemcode"]
    });
    return rows.map(r => (r.itemcode || "").trim()).filter(Boolean).sort();
}

export interface LotRepairScan {
    plans: LotRepairPlan[];      // เฉพาะสินค้าที่มีอะไรให้ซ่อม (changes หรือบิลกำพร้า)
    candidateCount: number;      // จำนวนสินค้าที่เข้าเกณฑ์คัดกรองรอบแรก
    lotItemcodeCount: number;    // จำนวนสินค้าทั้งหมดที่มี lot ใน company นี้
}

/**
 * สแกนหาสินค้าทั้ง company ที่ยอด lot ไม่ตรงยอดคำนวณ/มีบิลกำพร้า แล้วสร้างแผนซ่อมต่อสินค้า
 * ใช้ 2 ชั้น: SQL คัดกรองหยาบ (เร็ว, เผื่อเกินได้) → buildLotRepairPlan ยืนยันของจริงทีละตัว
 * (ตัวคัดกรองนับเฉพาะ tx ที่ผูก inventory_lot_id ตรง ๆ — plan ตัวจริงรู้จัก product_id/เลข lot/
 *  Sale fallback ครบ จึงกรองตัวปลอมออกเอง)
 */
export async function scanCompanyLotRepair(db: any, company: string): Promise<LotRepairScan> {
    const mismatchRows: { itemcode: string | null }[] = await db.$queryRawUnsafe(`
        WITH lot_delta AS (
            SELECT r."itemcode",
                   CASE WHEN r."statuss" = 'โอนสินค้า' THEN 0
                        ELSE COALESCE(r."qty",0)+COALESCE(r."freebaht",0) END AS base,
                   COALESCE(r."balance",0) AS stored,
                   COALESCE(t.delta,0) AS delta
            FROM "RCitemlist" r
            LEFT JOIN (
                SELECT "inventory_lot_id", SUM("quantity_change") AS delta
                FROM "StockTransaction"
                WHERE UPPER("transaction_type") IN ('SALE','TRANSFER_OUT','TRANSFER_IN','ADJUST','TRANSFER_RETURN','RETURN')
                  AND "inventory_lot_id" IS NOT NULL AND "company" = $1
                GROUP BY "inventory_lot_id"
            ) t ON t."inventory_lot_id" = r."id"
            WHERE r."company" = $1
        )
        SELECT "itemcode" FROM lot_delta
        GROUP BY "itemcode"
        HAVING ABS(SUM(stored) - SUM(base + delta)) > 0.001
            OR MIN(base + delta) < -0.001`, company);

    // ยอดรวมของบัญชี lot ไม่เท่ายอดคำนวณของสินค้า — เกิดจากรายการที่ตัด lot เกินของที่มีจริง
    // (ส่วนเกินหายไปจากบัญชี lot) หรือรายการที่จับคู่ lot ไม่ได้เลย
    //   ผลรวม lot = รับ + delta   /   ยอดคำนวณ = รับ − ขายจากบิล − โอนออก + รับโอน + ปรับ
    //   ต่างกันเมื่อ |delta + ขายจากบิล + โอนออก − รับโอน − ปรับ| > 0
    const ledgerGapRows: { itemcode: string | null }[] = await db.$queryRawUnsafe(`
        WITH lot_delta AS (
            SELECT r."itemcode", SUM(COALESCE(t.delta,0)) AS delta
            FROM "RCitemlist" r
            LEFT JOIN (
                SELECT "inventory_lot_id", SUM("quantity_change") AS delta
                FROM "StockTransaction"
                WHERE UPPER("transaction_type") IN ('SALE','TRANSFER_OUT','TRANSFER_IN','ADJUST','TRANSFER_RETURN','RETURN')
                  AND "inventory_lot_id" IS NOT NULL AND "company" = $1
                GROUP BY "inventory_lot_id"
            ) t ON t."inventory_lot_id" = r."id"
            WHERE r."company" = $1
            GROUP BY r."itemcode"
        ), tx_tot AS (
            SELECT "itemcode",
                   SUM(CASE WHEN UPPER("transaction_type") = 'TRANSFER_OUT' THEN ABS("quantity_change") ELSE 0 END) AS tout,
                   SUM(CASE WHEN UPPER("transaction_type") IN ('TRANSFER_IN','TRANSFER_RETURN') THEN ABS("quantity_change") ELSE 0 END) AS tin,
                   SUM(CASE WHEN UPPER("transaction_type") = 'ADJUST' THEN "quantity_change" ELSE 0 END) AS adj
            FROM "StockTransaction" WHERE "company" = $1 GROUP BY "itemcode"
        ), sale_tot AS (
            SELECT "code_product" AS itemcode,
                   SUM(CASE WHEN COALESCE("subqty",0) = 0 THEN COALESCE("qty",0) ELSE "subqty" END) AS sold
            FROM "Sale" WHERE "company" = $1 AND "statuss" = 'OK' GROUP BY "code_product"
        )
        SELECT d."itemcode" FROM lot_delta d
        LEFT JOIN tx_tot t ON t."itemcode" = d."itemcode"
        LEFT JOIN sale_tot s ON s."itemcode" = d."itemcode"
        WHERE ABS(COALESCE(d.delta,0) + COALESCE(s.sold,0) + COALESCE(t.tout,0)
                  - COALESCE(t.tin,0) - COALESCE(t.adj,0)) > 0.001`, company);

    // tx ที่อ้าง lot id ที่ไม่มีอยู่จริง (เกิดจาก restore ที่ id ถูกรันใหม่) — heuristic ด้านบน
    // มองไม่เห็นเพราะ join แล้วไม่ติดแถวไหนเลย (เช่น ใบโอนออกชี้ lot id เก่า)
    const danglingRows: { itemcode: string | null }[] = await db.$queryRawUnsafe(`
        SELECT DISTINCT t."itemcode"
        FROM "StockTransaction" t
        WHERE t."company" = $1
          AND UPPER(t."transaction_type") IN ('SALE','TRANSFER_OUT','TRANSFER_IN','ADJUST','TRANSFER_RETURN','RETURN')
          AND t."inventory_lot_id" IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM "RCitemlist" r WHERE r."id" = t."inventory_lot_id")`, company);

    // รับโอนเข้าที่ lot ฝั่งผู้รับหายไป (จับคู่ id ไม่ได้ และไม่มี lot ชื่อนั้นของสินค้านี้เลย)
    const missingTransferInRows: { itemcode: string | null }[] = await db.$queryRawUnsafe(`
        SELECT DISTINCT t."itemcode"
        FROM "StockTransaction" t
        WHERE t."company" = $1
          AND UPPER(t."transaction_type") = 'TRANSFER_IN'
          AND (t."inventory_lot_id" IS NULL
               OR NOT EXISTS (SELECT 1 FROM "RCitemlist" r WHERE r."id" = t."inventory_lot_id"))
          AND NOT EXISTS (
              SELECT 1 FROM "RCitemlist" r2
              WHERE r2."company" = t."company" AND r2."itemcode" = t."itemcode"
                AND LOWER(TRIM(COALESCE(r2."lot",''))) = LOWER(TRIM(COALESCE(t."lot",'')))
          )`, company);

    // ขายแล้วแต่ไม่ได้ตัดสต๊อก: ยอดขายจากบิล (Sale) มากกว่ายอดขายจาก StockTransaction
    // (heuristic หยาบระดับสินค้า — buildLotRepairPlan จะกรองตัวที่ไม่ใช่ออกเองอีกชั้น)
    const uncutSaleRows: { itemcode: string | null }[] = await db.$queryRawUnsafe(`
        WITH sale_qty AS (
            SELECT "code_product" AS itemcode,
                   SUM(CASE WHEN COALESCE("subqty",0) = 0 THEN COALESCE("qty",0) ELSE "subqty" END) AS billed
            -- นับเฉพาะบิลที่ยังใช้งาน (ยกเลิกแล้วถูกคืนสต๊อกด้วย RETURN ไปแล้ว)
            FROM "Sale" WHERE "company" = $1 AND "statuss" = 'OK' GROUP BY "code_product"
        ), tx_qty AS (
            SELECT "itemcode",
                   SUM(CASE WHEN UPPER("transaction_type") = 'SALE' THEN ABS("quantity_change") ELSE 0 END)
                 - SUM(CASE WHEN UPPER("transaction_type") = 'RETURN' THEN ABS("quantity_change") ELSE 0 END) AS cut
            FROM "StockTransaction"
            WHERE "company" = $1 AND UPPER("transaction_type") IN ('SALE','RETURN')
            GROUP BY "itemcode"
        )
        SELECT s."itemcode" FROM sale_qty s
        JOIN tx_qty t ON t."itemcode" = s."itemcode"
        WHERE s.billed - COALESCE(t.cut,0) > 0.001`, company);

    const orphanCodes = await findOrphanSaleItemcodes(db, company);
    const candidates = Array.from(new Set([
        ...mismatchRows.map(r => (r.itemcode || "").trim()).filter(Boolean),
        ...ledgerGapRows.map(r => (r.itemcode || "").trim()).filter(Boolean),
        ...danglingRows.map(r => (r.itemcode || "").trim()).filter(Boolean),
        ...missingTransferInRows.map(r => (r.itemcode || "").trim()).filter(Boolean),
        ...uncutSaleRows.map(r => (r.itemcode || "").trim()).filter(Boolean),
        ...orphanCodes
    ])).sort();

    const plans: LotRepairPlan[] = [];
    const BATCH = 10;
    for (let i = 0; i < candidates.length; i += BATCH) {
        const batch = await Promise.all(candidates.slice(i, i + BATCH).map(code =>
            buildLotRepairPlan(db, company, code).catch((err: any) => {
                console.error(`[LotRepairScan] plan failed for ${code}:`, err?.message || err);
                return null;
            })
        ));
        for (const p of batch) {
            if (!p) continue;
            const hasWork = p.changes.length > 0 || p.orphanTxCount > 0
                || p.createSaleTxCount > 0 || p.reassignTxCount > 0
                || p.deleteTxCount > 0 || p.createLotCount > 0;
            // ตัดรายละเอียดแผน (relink) ออกจากผลสแกน — ฝั่งหน้าจอใช้แค่ยอดสรุป
            if (hasWork) plans.push({ ...p, relink: null });
        }
    }

    const totalRow: any[] = await db.$queryRawUnsafe(
        `SELECT count(DISTINCT "itemcode")::int AS n FROM "RCitemlist" WHERE "company" = $1`, company);

    return {
        plans,
        candidateCount: candidates.length,
        lotItemcodeCount: Number(totalRow?.[0]?.n || 0)
    };
}

async function loadProductStockData(db: any, company: string, itemcode: string, productId?: number | null) {
    const barcode = await getProductBarcode(company, itemcode, productId);
    const itemcodeGroup = await resolveItemcodeGroup(company, itemcode, barcode);
    const useItemcodeFallback = await shouldUseItemcodeFallback(company, itemcode, barcode);

    const lots: any[] = await db.rCitemlist.findMany({
        where: buildRcItemLookupWhere(company, itemcode, barcode, useItemcodeFallback),
        orderBy: { createDate: "desc" }
    });
    const transactions: any[] = await db.stockTransaction.findMany({
        where: { company, itemcode: { in: itemcodeGroup } },
        orderBy: { createDate: "asc" }
    });
    const sales: any[] = await db.sale.findMany({
        where: buildSaleLookupWhere(company, itemcode, barcode, useItemcodeFallback),
        orderBy: { createDate: "asc" }
    });
    return { barcode, lots, transactions, sales };
}

/** ตัวช่วย resolve lot ปลายทางของ transaction — กติกาเดียวกับ calculateLotBalances */
function makeTxLotResolver(lots: any[]) {
    const lotIds = new Set(lots.map(l => Number(l.id)));
    const normalizeLot = (v: unknown) => String(v || "").trim().toLowerCase();
    const lotCodeToIds = new Map<string, number[]>();
    for (const lot of lots) {
        const key = normalizeLot(lot.lot);
        if (!key) continue;
        lotCodeToIds.set(key, [...(lotCodeToIds.get(key) || []), Number(lot.id)]);
    }
    const resolveTxLotId = (tx: any): number | null => {
        const inv = Number(tx.inventory_lot_id || 0);
        if (lotIds.has(inv)) return inv;
        const legacy = Number(tx.product_id || 0);
        if (lotIds.has(legacy)) return legacy;
        const byCode = lotCodeToIds.get(normalizeLot(tx.lot)) || [];
        return byCode.length === 1 ? byCode[0] : null;
    };
    return { lotIds, lotCodeToIds, normalizeLot, resolveTxLotId };
}

/** ข้อมูลผู้เรียกที่แนบไปกับรายการในเครื่องยนต์ไล่บัญชี */
type LedgerRef =
    | { kind: "tx"; tx: any; wasOrphan: boolean }
    | { kind: "sale-cut"; cut: PendingSaleCut };

interface PendingSaleCut {
    saleId: number | null;
    qty: number;
    createDate: Date | null;
    person: string;
    preferLotIds: number[];
    hasLotInfo: boolean;
}

function buildRelinkPlanFromData(
    itemcode: string,
    barcode: string,
    lots: any[],
    transactions: any[],
    sales: any[]
): RelinkItemPlan | null {
    const { lotIds, lotCodeToIds, normalizeLot, resolveTxLotId } = makeTxLotResolver(lots);

    const saleTxs = transactions.filter(tx => txTypeOf(tx) === "SALE");
    const saleRowTotal = sales.reduce((sum: number, s: any) => sum + saleRowQty(s), 0);
    const saleTxTotal = saleTxs.reduce((s, t) => s + Math.abs(Number(t.quantity_change || 0)), 0);
    const returnTxTotal = transactions
        .filter(tx => txTypeOf(tx) === "RETURN")
        .reduce((s, t) => s + Math.abs(Number(t.quantity_change || 0)), 0);
    const assignedSaleTxCount = saleTxs.filter(tx => resolveTxLotId(tx) != null).length;

    // โหมดยุคเก่า: ไม่มี SALE transaction เลย → หน้าสรุปยอดคงเหลือยังหักยอดขายจากตัวบิลอยู่
    // จึงย้าย lot ของการขายไม่ได้ (ต้องตรึงยอดขายไว้กับ lot ที่บิลระบุ)
    const legacyMode = saleTxTotal <= EPS && saleRowTotal > EPS;

    // เตือนเมื่อสินค้านี้ยังพึ่งการจับคู่ยอดขายจากตาราง Sale (fallback) อยู่ —
    // การผูก orphan จะสลับโหมดคำนวณไปใช้ StockTransaction แล้วยอดจาก Sale จะหายจากสูตร
    let saleFallbackWarning = false;
    if (assignedSaleTxCount === 0) {
        outer: for (const sale of sales) {
            for (const idx of [1, 2, 3]) {
                const lotQty = Number(sale[`qty_lot${idx}`] || 0);
                if (lotQty <= 0) continue;
                const byId = Number(sale[`id_receive${idx}`] || 0);
                const byCode = lotCodeToIds.get(normalizeLot(sale[`lot_receive${idx}`])) || [];
                if (lotIds.has(byId) || byCode.length === 1) { saleFallbackWarning = true; break outer; }
            }
        }
    }

    // --- 1. รายการขายซ้ำเกินจริง (เช่น cutstock ยิงซ้ำ) → ลบทิ้ง ---
    // ส่วนเกินคือ tx ผี — เอาตัวกำพร้าใหม่สุดออกก่อนเพราะเป็นตัวยิงซ้ำ
    const orphanSaleTxs = saleTxs.filter(tx =>
        resolveTxLotId(tx) == null && Math.abs(Number(tx.quantity_change || 0)) > EPS);
    let excess = Math.max(0, saleTxTotal - returnTxTotal - saleRowTotal);
    const deleteTxs: { txId: number; qty: number }[] = [];
    const deleteIds = new Set<number>();
    for (const tx of [...orphanSaleTxs].sort((a, b) => Number(b.id) - Number(a.id))) {
        if (excess <= EPS) break;
        const qty = Math.abs(Number(tx.quantity_change || 0));
        if (qty > excess + EPS) continue; // ไม่ลบบางส่วน — ข้ามถ้าเกินโควตาส่วนเกิน
        deleteTxs.push({ txId: Number(tx.id), qty });
        deleteIds.add(Number(tx.id));
        excess -= qty;
    }
    const deleteQty = deleteTxs.reduce((s, d) => s + d.qty, 0);

    // --- 2. lot รับโอนฝั่งผู้รับที่หายไป → สร้างใหม่แล้วผูกรายการรับโอนเข้า ---
    const orphanTransferIns = transactions.filter(tx =>
        txTypeOf(tx) === "TRANSFER_IN" &&
        resolveTxLotId(tx) == null && Number(tx.quantity_change || 0) > EPS &&
        String(tx.lot || "").trim() !== "" &&
        (lotCodeToIds.get(normalizeLot(tx.lot)) || []).length === 0
    );
    const createLotMap = new Map<string, RelinkItemPlan["createLots"][number]>();
    for (const tx of orphanTransferIns) {
        const code = String(tx.lot).trim();
        const key = code.toLowerCase();
        const entry = createLotMap.get(key)
            || { lot: code, qty: 0, dateExp: null as Date | null, dateRC: null as Date | null, person: "", txIds: [] as number[] };
        entry.qty += Number(tx.quantity_change || 0);
        if (!entry.dateExp && tx.dateExp) entry.dateExp = tx.dateExp;
        if (!entry.dateRC || (tx.createDate && new Date(tx.createDate) < new Date(entry.dateRC))) entry.dateRC = tx.createDate;
        if (!entry.person && tx.person) entry.person = tx.person;
        entry.txIds.push(Number(tx.id));
        createLotMap.set(key, entry);
    }
    const createLots = Array.from(createLotMap.values());
    const createQty = createLots.reduce((s, c) => s + c.qty, 0);

    // --- 3. บิลที่ขายแล้วแต่ไม่ได้ตัดสต๊อก (มีแถวใน Sale แต่ไม่มี SALE transaction) ---
    // เกิดตอนกดชำระเงินแล้ว /api/cutstock ล้มเหลว/ยิงไม่ถึง (โค้ดฝั่งขาย catch ไว้แล้วขายต่อ)
    // ผลคือยอด lot ค้างสูงกว่าความจริง — ซ่อมด้วยการสร้าง SALE transaction ย้อนหลัง
    // (สินค้ายุคเก่าที่ไม่มี SALE tx เลยไม่เข้าเงื่อนไขนี้ เพราะยอดขายถูกหักจากตัวบิลอยู่แล้ว)
    const uncutSaleQty = legacyMode ? 0 : Math.max(0, saleRowTotal - (saleTxTotal - deleteQty - returnTxTotal));

    const billPreferLotIds = (sale: any): number[] => {
        const ids: number[] = [];
        for (const idx of [1, 2, 3]) {
            const byId = Number(sale[`id_receive${idx}`] || 0);
            if (lotIds.has(byId)) ids.push(byId);
            for (const id of lotCodeToIds.get(normalizeLot(sale[`lot_receive${idx}`])) || []) ids.push(id);
        }
        return Array.from(new Set(ids));
    };

    const pendingSaleCuts: PendingSaleCut[] = [];
    if (uncutSaleQty > EPS) {
        // เลือกบิลที่จะผูกรายการตัดสต๊อกย้อนหลัง: บิลที่ "ไม่มีข้อมูล lot ในบิลเลย" น่าสงสัยที่สุด
        // (ตอนขายหา lot ไม่เจอ = เส้นทางเดียวกับที่ทำให้ตัดสต๊อกไม่สำเร็จ) แล้วไล่จากบิลใหม่สุด
        const ranked = sales
            .map((s: any) => ({ sale: s, qty: saleRowQty(s) }))
            .filter((r: any) => r.qty > EPS)
            .sort((a: any, b: any) => {
                const am = saleHasLotInfo(a.sale) ? 1 : 0;
                const bm = saleHasLotInfo(b.sale) ? 1 : 0;
                if (am !== bm) return am - bm;
                const ta = a.sale.createDate ? new Date(a.sale.createDate).getTime() : 0;
                const tb = b.sale.createDate ? new Date(b.sale.createDate).getTime() : 0;
                return tb - ta;
            });

        let left = uncutSaleQty;
        for (const row of ranked) {
            if (left <= EPS) break;
            const qty = Math.min(row.qty, left);
            pendingSaleCuts.push({
                saleId: Number(row.sale.id) || null,
                qty,
                createDate: row.sale.createDate || null,
                person: String(row.sale.person || row.sale.personsale || ""),
                preferLotIds: billPreferLotIds(row.sale),
                hasLotInfo: saleHasLotInfo(row.sale)
            });
            left -= qty;
        }
    }

    // --- 4. ไล่บัญชี lot ใหม่ทั้งเส้น ---
    // lot: ของจริง + lot รับโอนที่จะสร้างใหม่ (id ติดลบ)
    const synthLotIdByCode = new Map<string, number>();
    const ledgerLots: LedgerLot[] = lots.map(l => ({
        id: Number(l.id),
        lot: l.lot ?? null,
        dateExp: l.dateExp ?? null,
        receivedAt: timeOf(l.dateRC || l.createDate),
        // lot ที่มาจากการโอน: ยอดตั้งต้น = 0 เพราะยอดรับโอนมาจากรายการ TRANSFER_IN
        baseIn: (l.statuss || "") === "โอนสินค้า" ? 0 : receivedQty(l),
        pinnedOut: 0
    }));
    createLots.forEach((c, i) => {
        const synthId = -(i + 1);
        synthLotIdByCode.set(c.lot.trim().toLowerCase(), synthId);
        ledgerLots.push({
            id: synthId, lot: c.lot, dateExp: c.dateExp,
            receivedAt: timeOf(c.dateRC), baseIn: 0, pinnedOut: 0
        });
    });

    // โหมดยุคเก่า: ตรึงยอดขายจากตัวบิลไว้กับ lot ที่บิลระบุ (ย้ายไม่ได้ เพราะสูตรหน้าสรุปอ่านจากบิล)
    if (legacyMode) {
        const lotById = new Map(ledgerLots.map(l => [l.id, l]));
        for (const sale of sales) {
            for (const idx of [1, 2, 3]) {
                const lotQty = Number(sale[`qty_lot${idx}`] || 0);
                if (lotQty <= 0) continue;
                const byId = Number(sale[`id_receive${idx}`] || 0);
                const byCode = lotCodeToIds.get(normalizeLot(sale[`lot_receive${idx}`])) || [];
                const target = lotIds.has(byId) ? byId : (byCode.length === 1 ? byCode[0] : null);
                if (target == null) continue;
                const entry = lotById.get(target);
                if (entry) entry.pinnedOut = (entry.pinnedOut || 0) + lotQty;
            }
        }
    }

    const ledgerTxs: LedgerTx<LedgerRef>[] = [];
    for (const t of transactions) {
        const id = Number(t.id);
        if (deleteIds.has(id)) continue;
        const signed = Number(t.quantity_change || 0);
        const direction = ledgerDirectionOf(t.transaction_type, signed);
        if (!direction) continue;
        const qty = Math.abs(signed);
        if (qty <= EPS) continue;

        const resolved = resolveTxLotId(t);
        const synth = synthLotIdByCode.get(normalizeLot(t.lot)) ?? null;
        const lotId = resolved ?? synth;
        ledgerTxs.push({
            id, type: txTypeOf(t), direction, qty,
            at: timeOf(t.createDate),
            lotId,
            preferLotIds: lotCodeToIds.get(normalizeLot(t.lot)) || [],
            ref: { kind: "tx", tx: t, wasOrphan: resolved == null }
        });
    }
    pendingSaleCuts.forEach((cut, i) => {
        ledgerTxs.push({
            id: -(i + 1), type: "SALE", direction: "out", qty: cut.qty,
            at: timeOf(cut.createDate), lotId: null,
            preferLotIds: cut.preferLotIds,
            ref: { kind: "sale-cut", cut }
        });
    });

    const ledger = rebuildLotLedger<LedgerRef>(ledgerLots, ledgerTxs);

    // --- 5. แปลงผลไล่บัญชีเป็นคำสั่งเขียนกลับ ---
    const txPlan: RelinkTxPlan[] = [];
    const createSaleTxs: RelinkItemPlan["createSaleTxs"] = [];
    let orphanTxCount = 0, orphanQty = 0, assignable = 0, remaining = 0;
    let reassignTxCount = 0, reassignQty = 0;
    let attachedInflowCount = 0, attachedInflowQty = 0;
    let createSaleRemaining = 0;

    for (const move of ledger.moves) {
        const ref = move.tx.ref as LedgerRef;

        if (ref.kind === "sale-cut") {
            const fillSaleLot = !ref.cut.hasLotInfo && move.pieces.length === 1 && move.leftover <= EPS;
            for (const piece of move.pieces) {
                createSaleTxs.push({
                    saleId: ref.cut.saleId,
                    qty: piece.qty,
                    lotId: piece.lotId,
                    lot: piece.lot,
                    dateExp: piece.dateExp,
                    balanceAfter: piece.balanceAfter,
                    createDate: ref.cut.createDate,
                    person: ref.cut.person,
                    fillSaleLot
                });
            }
            createSaleRemaining += move.leftover;
            continue;
        }

        const wasOrphan = ref.wasOrphan;
        if (move.tx.direction === "out" && wasOrphan) {
            orphanTxCount += 1;
            orphanQty += move.tx.qty;
            assignable += move.pieces.reduce((s, p) => s + p.qty, 0);
            remaining += move.leftover;
        }
        if (!move.changed) continue;

        if (move.tx.direction === "in") {
            attachedInflowCount += 1;
            attachedInflowQty += move.pieces.reduce((s, p) => s + p.qty, 0);
        } else if (!wasOrphan) {
            reassignTxCount += 1;
            reassignQty += move.tx.qty;
        }

        txPlan.push({
            txId: move.tx.id,
            txType: move.tx.type,
            direction: move.tx.direction,
            qty: move.tx.qty,
            pieces: move.pieces.map(p => ({
                lotId: p.lotId, lot: p.lot, dateExp: p.dateExp, qty: p.qty, balanceAfter: p.balanceAfter
            })),
            leftover: move.leftover,
            reassigned: !wasOrphan
        });
    }

    const createSaleQty = createSaleTxs.reduce((s, c) => s + c.qty, 0);

    // ไม่มีอะไรต้องเขียนกลับเลย = ไม่มีแผน (ยอดของทุก lot ถูกต้องตามประวัติอยู่แล้ว)
    if (txPlan.length === 0 && deleteTxs.length === 0
        && createLots.length === 0 && createSaleTxs.length === 0) return null;

    // --- 6. ยอดปลายทางของทุก lot ---
    const lotById = new Map(lots.map(l => [Number(l.id), l]));
    const createLotByCode = new Map(createLots.map(c => [c.lot.trim().toLowerCase(), c]));
    const lotChanges: RelinkLotChange[] = ledger.lots.map(result => {
        const raw = lotById.get(result.lotId);
        const isNewLot = result.lotId < 0;
        const created = isNewLot ? createLotByCode.get(String(result.lot || "").trim().toLowerCase()) : undefined;
        const isTransferLot = isNewLot || (raw?.statuss || "") === "โอนสินค้า";
        // ช่อง "รับ" ของ lot โอน = ยอดรับโอนที่จับคู่ได้ (ถ้าจับคู่ไม่ได้ ใช้ qty เดิม)
        const received = isNewLot ? (created?.qty || result.totalIn)
            : isTransferLot && result.totalIn > 0 ? result.totalIn
                : receivedQty(raw || {});
        const newBalance = Math.max(0, result.endBalance);
        return {
            lotId: result.lotId,
            lot: result.lot,
            dateExp: result.dateExp,
            received,
            inflow: result.totalIn,
            storedBalance: Number(raw?.balance || 0),
            calcBalance: result.endBalance,
            allocated: result.totalOut,
            newBalance,
            currentSale: Number(raw?.sale || 0),
            // sync ตัวนับขายแบบเดียวกับ /api/lot-edit (อิง qty+freebaht ดิบของแถว)
            newSale: Math.max(0, (isNewLot ? (created?.qty || 0) : receivedQty(raw || {})) - newBalance),
            ...(isNewLot ? { isNewLot: true } : {})
        };
    });

    const firstTx = transactions[0] || {};
    return {
        itemcode,
        itemName: String(lots[0]?.itemName || firstTx.itemName || ""),
        barcode,
        txCount: orphanTxCount,
        totalUnassignedQty: orphanQty,
        assignable,
        remaining,
        saleFallbackWarning,
        lots: lotChanges,
        txPlan,
        deleteTxs,
        deleteQty,
        createLots,
        createQty,
        createSaleTxs,
        createSaleQty,
        uncutSaleQty,
        uncutSaleRemaining: createSaleRemaining,
        reassignTxCount,
        reassignQty,
        unallocatedQty: ledger.unallocatedOut,
        attachedInflowCount,
        attachedInflowQty,
        legacyMode,
        ledgerTotal: lotChanges.reduce((s, l) => s + l.newBalance, 0)
    };
}

/**
 * สร้างแผนผูก lot ย้อนหลังของสินค้าหนึ่งรายการ (ยังไม่แก้อะไรใน DB)
 * คืน null ถ้าไม่มีอะไรต้องแก้
 */
export async function buildLotRelinkPlan(
    db: any,
    company: string,
    itemcode: string,
    productId?: number | null
): Promise<RelinkItemPlan | null> {
    const { barcode, lots, transactions, sales } = await loadProductStockData(db, company, itemcode, productId);
    return buildRelinkPlanFromData(itemcode, barcode, lots, transactions, sales);
}

async function ensureRelinkLogTable(prisma: any) {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "_selfheal_lot_relink_log" (
            "log_id"   SERIAL PRIMARY KEY,
            "fixed_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
            "company"  TEXT,
            "itemcode" TEXT,
            "person"   TEXT,
            "kind"     TEXT NOT NULL,
            "ref_id"   INTEGER NOT NULL,
            "before"   JSONB,
            "after"    JSONB
        )`);
}

function makeLogWriter(tx: any, company: string, itemcode: string, person: string) {
    return (kind: string, refId: number, before: any, after: any) =>
        tx.$executeRawUnsafe(
            `INSERT INTO "_selfheal_lot_relink_log"
                ("company","itemcode","person","kind","ref_id","before","after")
             VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb)`,
            company, itemcode, person, kind, refId,
            JSON.stringify(before), JSON.stringify(after)
        );
}

/**
 * ย้าย/ผูก transaction เข้า lot ตามผลไล่บัญชี (เฉพาะฝั่ง StockTransaction — ไม่แตะ balance ของ lot)
 * รายการที่ตัดข้าม lot จะถูกแยกเป็นหลายแถว แถวเดิมเก็บก้อนแรกไว้เพื่อคงเลขรายการเดิม
 */
async function applyTxMovesInTx(
    tx: any,
    plan: RelinkItemPlan,
    logRow: (kind: string, refId: number, before: any, after: any) => Promise<any>,
    lotIdMap: Map<number, number>
) {
    for (const p of plan.txPlan) {
        const original = await tx.stockTransaction.findUnique({ where: { id: p.txId } });
        if (!original) continue;
        const sign = p.direction === "in" ? 1 : -1;
        // แปลง id จำลองของ lot รับโอนที่เพิ่งสร้าง → id จริง (ตัวที่สร้างไม่สำเร็จให้ข้ามรายการนั้น)
        const pieces = p.pieces
            .map(piece => ({ ...piece, lotId: piece.lotId < 0 ? (lotIdMap.get(piece.lotId) ?? 0) : piece.lotId }))
            .filter(piece => piece.lotId > 0);
        if (pieces.length !== p.pieces.length) continue;

        await logRow("tx", p.txId,
            {
                quantity_change: original.quantity_change, lot: original.lot,
                inventory_lot_id: original.inventory_lot_id, product_id: original.product_id,
                balance_after: original.balance_after
            },
            { pieces, leftover: p.leftover, reassigned: p.reassigned });

        const [firstPiece, ...restPieces] = pieces;

        // ไม่มี lot ไหนรองรับแล้ว — คงจำนวนเดิมไว้แบบไม่มี lot (ยอดรวมของสินค้าไม่เปลี่ยน)
        if (!firstPiece) {
            await tx.stockTransaction.update({
                where: { id: p.txId },
                data: {
                    product_id: null, inventory_lot_id: null, lot: null, dateExp: null,
                    quantity_change: sign * p.qty, balance_after: null
                }
            });
            continue;
        }

        await tx.stockTransaction.update({
            where: { id: p.txId },
            data: {
                product_id: firstPiece.lotId,
                inventory_lot_id: firstPiece.lotId,
                lot: firstPiece.lot,
                dateExp: firstPiece.dateExp,
                quantity_change: sign * firstPiece.qty,
                balance_after: firstPiece.balanceAfter
            }
        });

        for (const piece of restPieces) {
            await tx.stockTransaction.create({
                data: {
                    product_id: piece.lotId,
                    inventory_lot_id: piece.lotId,
                    itemcode: original.itemcode,
                    itemName: original.itemName,
                    lot: piece.lot,
                    dateExp: piece.dateExp,
                    quantity_change: sign * piece.qty,
                    balance_after: piece.balanceAfter,
                    transaction_type: original.transaction_type,
                    company: original.company,
                    person: original.person,
                    personsale: original.personsale,
                    createDate: original.createDate
                }
            });
        }

        // ส่วนที่ lot ไม่พอ — คงไว้เป็น lot-less แถวใหม่ (ยอดรวมไม่เปลี่ยน)
        if (p.leftover > EPS) {
            await tx.stockTransaction.create({
                data: {
                    product_id: null,
                    inventory_lot_id: null,
                    itemcode: original.itemcode,
                    itemName: original.itemName,
                    lot: null,
                    dateExp: null,
                    quantity_change: sign * p.leftover,
                    balance_after: null,
                    transaction_type: original.transaction_type,
                    company: original.company,
                    person: original.person,
                    personsale: original.personsale,
                    createDate: original.createDate
                }
            });
        }
    }
}

/** ลบ SALE transaction ซ้ำเกินจริงตามแผน (สำรองแถวเต็มลง log ก่อนลบ) */
async function deleteExcessTxsInTx(
    tx: any,
    plan: RelinkItemPlan,
    logRow: (kind: string, refId: number, before: any, after: any) => Promise<any>
) {
    for (const d of plan.deleteTxs || []) {
        const original = await tx.stockTransaction.findUnique({ where: { id: d.txId } });
        if (!original) continue;
        await logRow("tx-delete", d.txId, original, null);
        await tx.stockTransaction.delete({ where: { id: d.txId } });
    }
}

/**
 * สร้าง lot รับโอนที่หายไปตามแผน แล้วผูก TRANSFER_IN เข้า lot ใหม่ (log ทุกขั้น)
 * คืน map จาก id จำลอง (ติดลบ) → id จริงที่เพิ่งสร้าง เพื่อให้ขั้นตอนถัดไปอ้างถูกตัว
 */
async function createTransferLotsInTx(
    tx: any,
    company: string,
    plan: RelinkItemPlan,
    logRow: (kind: string, refId: number, before: any, after: any) => Promise<any>
): Promise<Map<number, number>> {
    const idMap = new Map<number, number>();
    if (!plan.createLots || plan.createLots.length === 0) return idMap;
    // ใช้ lot เดิมของสินค้าเป็นแม่แบบ unit/type และหา cost จากใบโอน (ถ้ามี)
    const template = await tx.rCitemlist.findFirst({
        where: { company, itemcode: plan.itemcode },
        orderBy: { id: "desc" }
    });

    for (const [i, c] of plan.createLots.entries()) {
        let cost = Number(template?.newCost || 0);
        try {
            const ti = await tx.stockTransferItem.findFirst({
                where: { itemcode: plan.itemcode, lot: c.lot },
                orderBy: { id: "desc" }
            });
            if (ti?.cost != null) cost = Number(ti.cost) || cost;
        } catch { /* ตาราง/ฟิลด์ไม่ตรงเวอร์ชัน — ใช้ cost จากแม่แบบ */ }

        const created = await tx.rCitemlist.create({
            data: {
                company,
                itemcode: plan.itemcode,
                itemName: plan.itemName || template?.itemName || "",
                unit: template?.unit || "",
                Barcode: plan.barcode || template?.Barcode || "",
                lot: c.lot,
                dateExp: c.dateExp,
                dateRC: c.dateRC,
                qty: c.qty,          // convention lot โอน: qty = ยอดรับโอนสะสม
                freebaht: 0,
                newCost: cost,
                totalcost: cost * c.qty,
                sale: 0,
                balance: c.qty,
                statuss: "โอนสินค้า",
                person: c.person || "",
                type: template?.type || "",
                subtype: template?.subtype || "",
                namevender: "รับโอนระหว่างสาขา"
            }
        });
        idMap.set(-(i + 1), created.id);
        await logRow("lot-create", created.id, null,
            { lot: c.lot, qty: c.qty, balance: c.qty, txIds: c.txIds });

        for (const txId of c.txIds) {
            const original = await tx.stockTransaction.findUnique({ where: { id: txId } });
            if (!original) continue;
            await logRow("tx", txId,
                { inventory_lot_id: original.inventory_lot_id, product_id: original.product_id, lot: original.lot },
                { inventory_lot_id: created.id, product_id: created.id });
            await tx.stockTransaction.update({
                where: { id: txId },
                data: { inventory_lot_id: created.id, product_id: created.id }
            });
        }
    }
    return idMap;
}

/** สร้าง SALE transaction ย้อนหลังให้บิลที่ขายแล้วแต่ไม่ได้ตัดสต๊อก + เติมเลข lot กลับเข้าบิล */
async function createSaleTxsInTx(
    tx: any,
    company: string,
    plan: RelinkItemPlan,
    logRow: (kind: string, refId: number, before: any, after: any) => Promise<any>,
    lotIdMap: Map<number, number>
) {
    if (!plan.createSaleTxs || plan.createSaleTxs.length === 0) return;

    for (const c of plan.createSaleTxs) {
        const lotId = c.lotId < 0 ? lotIdMap.get(c.lotId) : c.lotId;
        if (!lotId) continue; // lot จำลองที่สร้างไม่สำเร็จ — ข้ามไว้ให้รอบถัดไปตรวจ
        const created = await tx.stockTransaction.create({
            data: {
                product_id: lotId,
                inventory_lot_id: lotId,
                itemcode: plan.itemcode,
                itemName: plan.itemName || "",
                lot: c.lot,
                dateExp: c.dateExp,
                quantity_change: -c.qty,
                balance_after: c.balanceAfter,
                transaction_type: "SALE",
                company,
                person: c.person || "",
                // ใช้เวลาของบิลเป็นเวลารายการ เพื่อให้ประวัติการตัด stock เรียงตรงกับบิลจริง
                createDate: c.createDate || new Date()
            }
        });
        await logRow("tx-create-sale", created.id, null,
            { saleId: c.saleId, qty: c.qty, lotId, lot: c.lot });

        // เติมเลข lot กลับเข้าแถวบิล เพื่อให้บิล/ฉลากย้อนหลังอ้าง lot ได้ตรงกับที่ตัดจริง
        if (c.fillSaleLot && c.saleId) {
            const saleRow = await tx.sale.findUnique({ where: { id: c.saleId } });
            if (saleRow && !saleHasLotInfo(saleRow)) {
                await logRow("sale-lot", c.saleId,
                    { id_receive1: saleRow.id_receive1, lot_receive1: saleRow.lot_receive1, qty_lot1: saleRow.qty_lot1 },
                    { id_receive1: lotId, lot_receive1: c.lot, qty_lot1: c.qty });
                await tx.sale.update({
                    where: { id: c.saleId },
                    data: { id_receive1: lotId, lot_receive1: c.lot, qty_lot1: c.qty }
                });
            }
        }
    }
}

/** เขียน balance + ตัวนับขายของทุก lot ที่ค่าเปลี่ยน (lot ที่ตรงอยู่แล้วไม่แตะ) */
async function applyLotBalancesInTx(
    tx: any,
    changes: { lotId: number; lot: string | null; storedBalance: number; currentSale: number; newBalance: number; newSale: number }[],
    logRow: (kind: string, refId: number, before: any, after: any) => Promise<any>,
    lotIdMap: Map<number, number>
) {
    for (const change of changes) {
        // lotId ติดลบ = lot รับโอนที่เพิ่งสร้างในรอบนี้ — ใช้ id จริงที่ได้มา
        const lotId = change.lotId < 0 ? lotIdMap.get(change.lotId) : change.lotId;
        if (!lotId) continue;
        if (Math.abs(change.storedBalance - change.newBalance) <= EPS
            && Math.abs(change.currentSale - change.newSale) <= EPS) continue;
        await logRow("lot", lotId,
            { balance: change.storedBalance, sale: change.currentSale },
            { balance: change.newBalance, sale: change.newSale });
        await tx.rCitemlist.update({
            where: { id: lotId },
            data: { balance: change.newBalance, sale: change.newSale }
        });
    }
}

/**
 * ลงมือซ่อมตามแผน (คำนวณแผนใหม่ภายใน transaction เพื่อกันข้อมูลเปลี่ยนระหว่าง preview)
 * สำรองค่าเดิมของทั้ง lot และ transaction ลง _selfheal_lot_relink_log ก่อนแก้เสมอ
 */
export async function applyLotRelinkForItem(
    prisma: any,
    company: string,
    itemcode: string,
    person: string,
    opts?: { skipFallbackWarned?: boolean }
): Promise<RelinkItemPlan | null> {
    await ensureRelinkLogTable(prisma);

    return prisma.$transaction(async (tx: any) => {
        const plan = await buildLotRelinkPlan(tx, company, itemcode);
        if (!plan) return null;
        // โหมด bulk: ข้ามสินค้าที่ยังอิงยอดขายจากตาราง Sale — ให้ผู้ใช้กดยืนยันทีละรายการเอง
        if (opts?.skipFallbackWarned && plan.saleFallbackWarning) return null;

        const logRow = makeLogWriter(tx, company, itemcode, person);
        await deleteExcessTxsInTx(tx, plan, logRow);
        const lotIdMap = await createTransferLotsInTx(tx, company, plan, logRow);
        await applyTxMovesInTx(tx, plan, logRow, lotIdMap);
        await createSaleTxsInTx(tx, company, plan, logRow, lotIdMap);
        await applyLotBalancesInTx(tx, plan.lots, logRow, lotIdMap);

        return plan;
    }, { timeout: 60_000 });
}

/**
 * สร้างแผน "ซ่อมทั้งสินค้า": ไล่บัญชี lot ใหม่ทั้งเส้น แล้วสรุปการเปลี่ยนแปลงต่อ lot
 * (ยังไม่แก้อะไรใน DB)
 */
export async function buildLotRepairPlan(
    db: any,
    company: string,
    itemcode: string,
    productId?: number | null
): Promise<LotRepairPlan> {
    const { barcode, lots, transactions, sales } = await loadProductStockData(db, company, itemcode, productId);
    const relink = buildRelinkPlanFromData(itemcode, barcode, lots, transactions, sales);

    // ยอดคงเหลือคำนวณระดับสินค้า (สูตรเดียวกับ /api/stock-balance-summary)
    const calculatedBalance = productCalculatedBalance(lots, transactions, sales);

    // ไม่มีแผนซ่อม = ประวัติสอดคล้องอยู่แล้ว เทียบ balance ที่บันทึกกับยอดคำนวณต่อ lot ตรง ๆ
    const endLots: RelinkLotChange[] = relink?.lots ?? calculateLotBalances(lots, transactions, sales).map(l => {
        const newBalance = Math.max(0, l.balance);
        return {
            lotId: Number(l.id),
            lot: l.lot,
            dateExp: l.dateExp,
            received: l.received,
            inflow: l.received,
            storedBalance: l.rawBalance ?? 0,
            calcBalance: l.balance,
            allocated: 0,
            newBalance,
            currentSale: 0, // ตัวนับขายจริงอ่านจากแถว lot ในลูปด้านล่าง
            newSale: Math.max(0, receivedQty(l) - newBalance)
        };
    });

    const lotById = new Map(lots.map(l => [Number(l.id), l]));
    const changes: RepairLotChange[] = [];
    let storedTotal = 0;
    let newTotal = 0;
    for (const l of endLots) {
        const raw = lotById.get(l.lotId);
        const currentSale = raw ? Number(raw.sale || 0) : l.currentSale;
        storedTotal += l.storedBalance;
        newTotal += l.newBalance;
        if (Math.abs(l.storedBalance - l.newBalance) > EPS || Math.abs(currentSale - l.newSale) > EPS) {
            changes.push({
                lotId: l.lotId,
                lot: l.lot,
                dateExp: l.dateExp,
                received: l.received,
                inflow: l.inflow,
                storedBalance: l.storedBalance,
                currentSale,
                allocated: l.allocated,
                calcBalance: l.calcBalance,
                newBalance: l.newBalance,
                newSale: l.newSale,
                ...(l.isNewLot ? { isNewLot: true } : {})
            });
        }
    }

    return {
        itemcode,
        itemName: String(lots[0]?.itemName || relink?.itemName || ""),
        barcode,
        orphanTxCount: relink?.txCount || 0,
        orphanQty: relink?.totalUnassignedQty || 0,
        orphanAssignable: relink?.assignable || 0,
        orphanRemaining: relink?.remaining || 0,
        deleteTxCount: relink?.deleteTxs.length || 0,
        deleteQty: relink?.deleteQty || 0,
        createLotCount: relink?.createLots.length || 0,
        createQty: relink?.createQty || 0,
        createSaleTxCount: relink?.createSaleTxs.length || 0,
        createSaleQty: relink?.createSaleQty || 0,
        uncutSaleQty: relink?.uncutSaleQty || 0,
        uncutSaleRemaining: relink?.uncutSaleRemaining || 0,
        reassignTxCount: relink?.reassignTxCount || 0,
        reassignQty: relink?.reassignQty || 0,
        unallocatedQty: relink?.unallocatedQty || 0,
        attachedInflowCount: relink?.attachedInflowCount || 0,
        attachedInflowQty: relink?.attachedInflowQty || 0,
        legacyMode: relink?.legacyMode || false,
        saleFallbackWarning: relink?.saleFallbackWarning || false,
        changes,
        lotCount: lots.length,
        storedTotal,
        newTotal,
        calculatedBalance,
        relink
    };
}

/**
 * ลงมือซ่อมทั้งสินค้า: ไล่บัญชี lot ใหม่ + เขียนกลับทั้งรายการเคลื่อนไหวและยอดของทุก lot
 * (คำนวณแผนใหม่ภายใน transaction) — สำรองค่าเดิมลง _selfheal_lot_relink_log เสมอ
 */
export async function applyLotRepair(
    prisma: any,
    company: string,
    itemcode: string,
    person: string,
    productId?: number | null
): Promise<LotRepairPlan> {
    await ensureRelinkLogTable(prisma);

    return prisma.$transaction(async (tx: any) => {
        const plan = await buildLotRepairPlan(tx, company, itemcode, productId);
        const logRow = makeLogWriter(tx, company, itemcode, person);

        let lotIdMap = new Map<number, number>();
        if (plan.relink) {
            await deleteExcessTxsInTx(tx, plan.relink, logRow);
            lotIdMap = await createTransferLotsInTx(tx, company, plan.relink, logRow);
            await applyTxMovesInTx(tx, plan.relink, logRow, lotIdMap);
            await createSaleTxsInTx(tx, company, plan.relink, logRow, lotIdMap);
        }

        await applyLotBalancesInTx(tx, plan.changes, logRow, lotIdMap);

        return plan;
    }, { timeout: 60_000 });
}
