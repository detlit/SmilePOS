// Self-heal ข้อมูลตอนเซิร์ฟเวอร์บูต (เรียกจาก src/instrumentation.ts)
//
// ทุกงานในไฟล์นี้ต้อง idempotent (รันซ้ำได้ทุกบูตโดยไม่ทำข้อมูลดีเสีย) เพราะ
// เครื่องลูกค้าอาจ restore ฐานข้อมูลจาก backup เก่าเมื่อไหร่ก็ได้ — ข้อมูลที่เคย
// ซ่อมแล้วจะย้อนกลับมาเสียอีก จึงต้องตรวจ+ซ่อมใหม่ทุกครั้งที่เปิดแอป
// (เกิดจริงแล้ว: รอบซ่อม 2026-07-10 ถูก restore ทับจนหายทั้งชุด)
//
// งานที่ 1: RCitemlist.sale (ตัวนับจำนวนที่ขายไปแล้วของ lot) — ฟอร์มรับสินค้ารุ่นเก่า
// เคยเขียน "ราคาขาย" ทับลงช่องนี้ ทำให้ sale > จำนวนรับ → หน้าขายมองว่า lot หมด
// ไม่แสดง/ไม่ตัด lot (ฟอร์มปัจจุบันแก้แล้ว แถวปกติไม่มีทางเข้าเงื่อนไขนี้)
// ซ่อมด้วยสูตรเดียวกับรอบ 2026-07-10: sale = จำนวนรับ − clamp(balance, 0, จำนวนรับ)
// และสำรองค่าเดิมลงตาราง _selfheal_rcitemlist_sale_log ก่อนแก้เสมอ
//
// งานที่ 2: RCitemlist.dateRC (วันรับสินค้าของรายการ) — ฟอร์มรับสินค้ารุ่นเก่าเพิ่มรายการ
// ตอนที่ยังไม่ได้กรอกวันรับสินค้า → new Date("") = Invalid Date → บันทึกเป็น NULL
// ทำให้รายงานที่กรองด้วย dateRC (วิเคราะห์ผู้ขาย/งบกำไรขาดทุน/รายงานซื้อ) มองไม่เห็นยอด
// (พบจริง 2026-07-18: สุวรรณาฟาร์ม่า เดือน ก.ค. หายไป 8 ใบรับ ~34,000 บาท)
// ซ่อมโดย sync dateRC = receive_date ของหัวบิล (กติกาเดียวกับ /api/receive/[id] ที่
// sync ให้อยู่แล้วเวลาแก้ไขใบรับ) และสำรองค่าเดิมลง _selfheal_rcitemlist_daterc_log
//
// งานที่ 3: ตาราง ProductBarcode (บาร์โค้ดสำรอง — สินค้าหนึ่งหน่วยมีหลายบาร์โค้ด)
// ปกติ prisma db push ตอนอัปเดตจะสร้างให้อยู่แล้ว แต่ถ้ารอบ push ล้ม (เกิดจริงหลายครั้ง
// บนเครื่องลูกค้าเมื่อ DB ยังไม่พร้อม) หน้าขาย/รับสินค้าจะ 500 ทั้งหน้าเพราะ query
// ตารางที่ยังไม่มี — สร้างแบบ IF NOT EXISTS ตอนบูตจึงกันเคสนั้นได้ทั้งหมด
// เป็น DDL ล้วน ไม่แตะข้อมูลเดิมสักแถว
//
// งานที่ 4: RCitemlist.netCost (ทุนสุทธิหลังหักส่วนลดต่อบรรทัด — ดู src/lib/lotCost.ts)
// คอลัมน์นี้เพิ่งมีในเวอร์ชันนี้ ทุกแถวเดิมจึงเป็น NULL — เติมค่าให้ครั้งเดียวตอนบูต
// (ตัวอ่าน lotUnitCost() คำนวณสดเมื่อเจอ NULL อยู่แล้ว งานนี้จึงเป็นแค่การเร่งความเร็ว
//  ให้ raw SQL ฝั่งรายงาน ไม่ใช่เงื่อนไขความถูกต้อง — ถึงรันไม่สำเร็จก็ไม่มีอะไรพัง)
//
// ⚠️ ลำดับสำคัญ: งานนี้ต้องอยู่ท้ายสุดและ "ปล่อยให้ throw" เมื่อคอลัมน์ยังไม่มี
// เพราะ installer/scripts/update.ps1 สั่ง recreate container (แอปบูต + งานนี้เริ่มทำงาน)
// ก่อน แล้วจึงค่อยรัน `prisma db push` ที่สร้างคอลัมน์ให้ทีหลัง — รอบแรกจึงพังแน่นอน
// การ throw ทำให้ retry loop ด้านล่าง (30 ครั้ง × 10 วิ ≈ 5 นาที) รอจน push เสร็จแล้วสำเร็จเอง
// ถ้าดักจับ error ไว้เองเงียบ ๆ จะไม่มีการเติมค่าจนกว่าลูกค้าจะรีสตาร์ทเครื่องรอบหน้า

import { prisma } from "./prisma";

const BROKEN_SALE = `COALESCE(r."sale", 0) > COALESCE(r."qty", 0) + COALESCE(r."freebaht", 0)`;
const FIXED_SALE = `(COALESCE(r."qty", 0) + COALESCE(r."freebaht", 0))
    - LEAST(GREATEST(COALESCE(r."balance", 0), 0), COALESCE(r."qty", 0) + COALESCE(r."freebaht", 0))`;

async function fixRcitemlistSaleCounters(): Promise<number> {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "_selfheal_rcitemlist_sale_log" (
            "log_id"   SERIAL PRIMARY KEY,
            "fixed_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
            "rc_id"    INTEGER NOT NULL,
            "company"  TEXT,
            "itemcode" TEXT,
            "lot"      TEXT,
            "qty"      DOUBLE PRECISION,
            "freebaht" DOUBLE PRECISION,
            "old_sale" DOUBLE PRECISION,
            "new_sale" DOUBLE PRECISION,
            "balance"  DOUBLE PRECISION
        )`);

    return prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`
            INSERT INTO "_selfheal_rcitemlist_sale_log"
                ("rc_id", "company", "itemcode", "lot", "qty", "freebaht", "old_sale", "new_sale", "balance")
            SELECT r."id", r."company", r."itemcode", r."lot", r."qty", r."freebaht", r."sale", ${FIXED_SALE}, r."balance"
            FROM "RCitemlist" r
            WHERE ${BROKEN_SALE}`);

        return tx.$executeRawUnsafe(`
            UPDATE "RCitemlist" r SET "sale" = ${FIXED_SALE} WHERE ${BROKEN_SALE}`);
    }, { timeout: 60_000 });
}

// รายการที่ dateRC ไม่ตรงกับวันรับสินค้าของหัวบิล (NULL หรือคนละวัน)
const BROKEN_DATERC = `
    r."company" = i."company" AND r."orderfull" = i."codenames"
    AND r."receive_date" IS NOT NULL
    AND (i."dateRC" IS NULL OR i."dateRC"::date <> r."receive_date"::date)`;

async function fixRcitemlistDateRC(): Promise<number> {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "_selfheal_rcitemlist_daterc_log" (
            "log_id"     SERIAL PRIMARY KEY,
            "fixed_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
            "rc_id"      INTEGER NOT NULL,
            "company"    TEXT,
            "codenames"  TEXT,
            "itemcode"   TEXT,
            "lot"        TEXT,
            "old_daterc" TIMESTAMP,
            "new_daterc" TIMESTAMP
        )`);

    return prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`
            INSERT INTO "_selfheal_rcitemlist_daterc_log"
                ("rc_id", "company", "codenames", "itemcode", "lot", "old_daterc", "new_daterc")
            SELECT i."id", i."company", i."codenames", i."itemcode", i."lot", i."dateRC", r."receive_date"
            FROM "RCitemlist" i JOIN "Receive" r ON ${BROKEN_DATERC}`);

        return tx.$executeRawUnsafe(`
            UPDATE "RCitemlist" i SET "dateRC" = r."receive_date"
            FROM "Receive" r WHERE ${BROKEN_DATERC}`);
    }, { timeout: 60_000 });
}

// สร้างตารางบาร์โค้ดสำรองถ้ายังไม่มี (DDL ชุดเดียวกับ migration
// 20260722090000_add_product_barcode — แก้ที่ไหนต้องแก้ให้ตรงกันทั้งสองที่)
async function ensureProductBarcodeTable(): Promise<void> {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ProductBarcode" (
            "id"          SERIAL PRIMARY KEY,
            "company"     TEXT,
            "productCode" TEXT NOT NULL,
            "productId"   INTEGER,
            "barcode"     TEXT NOT NULL,
            "note"        TEXT DEFAULT '',
            "isActive"    BOOLEAN NOT NULL DEFAULT true,
            "createdBy"   TEXT DEFAULT '',
            "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`);
    await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "ProductBarcode_company_barcode_key"
            ON "ProductBarcode" ("company", "barcode")`);
    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "ProductBarcode_company_productCode_idx"
            ON "ProductBarcode" ("company", "productCode")`);
    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "ProductBarcode_company_isActive_idx"
            ON "ProductBarcode" ("company", "isActive")`);
}

// ══════════════════════════════════════════════════════════════════════════════
// งานที่ 4: เติมทุนสุทธิ (netCost) ให้แถวที่ยังไม่เคยคำนวณ
// ══════════════════════════════════════════════════════════════════════════════
// ⚠️ สูตรสามบรรทัดล่างนี้ต้องตรงกับ computeNetCostOrNull() ใน src/lib/lotCost.ts เป๊ะ ๆ
//    แก้ที่ไหนต้องแก้ให้ตรงกันทั้งสองที่ (สวิตช์ SPREAD_COST_OVER_FREE / INCLUDE_BILL_DISCOUNT
//    ในไฟล์นั้นเป็นค่าคงที่ฝั่ง TS จึงสะท้อนมาที่ SQL เองไม่ได้)

/** ทุนรวมบรรทัด (บาท) — แถวเก่าที่ไม่มี totalcost ให้ย้อนคิดจาก newCost × qty */
const NET_GROSS = `CASE WHEN COALESCE(r."totalcost", 0) > 0
        THEN r."totalcost" ELSE COALESCE(r."newCost", 0) * COALESCE(r."qty", 0) END`;
/** ตัวหาร = จำนวนที่ซื้อ (ยังไม่เฉลี่ยของแถม เพราะ SPREAD_COST_OVER_FREE = false) */
const NET_DIVISOR = `COALESCE(r."qty", 0)`;
const NET_DISCOUNT = `COALESCE(r."discountbaht", 0)`;
/** ไม่มีส่วนลด → ทุนสุทธิ = ทุนเดิมเป๊ะ ๆ (ทางลัดเดียวกับฝั่ง TS กันเศษปัดเลื่อน) */
const NET_NO_DISCOUNT = `${NET_DISCOUNT} <= 0 AND COALESCE(r."newCost", 0) > 0`;

async function fillRcitemlistNetCost(): Promise<number> {
    // แตะเฉพาะแถวที่ยังเป็น NULL → รันซ้ำทุกบูตได้โดยไม่ทับค่าที่คำนวณ/แก้ไว้แล้ว
    // แถวที่ข้อมูลไม่พอจะคำนวณ (qty = 0 และไม่มีทุน) จะไม่เข้าเงื่อนไข WHERE เลย
    // จึงคงเป็น NULL ตลอดไปและไม่ถูกนับซ้ำในรอบถัดไป — ตัวอ่านจัดการ NULL ได้อยู่แล้ว
    return prisma.$executeRawUnsafe(`
        UPDATE "RCitemlist" r
        SET "netCost" = CASE
            WHEN ${NET_NO_DISCOUNT} THEN r."newCost"
            ELSE GREATEST(
                ROUND(((${NET_GROSS}) - ${NET_DISCOUNT})::numeric / (${NET_DIVISOR})::numeric, 6),
                0)::double precision
        END
        WHERE r."netCost" IS NULL
          AND ((${NET_NO_DISCOUNT}) OR ((${NET_GROSS}) > 0 AND (${NET_DIVISOR}) > 0))`);
}

/** สรุปผลกระทบไว้ให้อธิบายลูกค้าได้ว่ากำไรที่ขยับมาจากส่วนลดที่เคยไม่ถูกนับ ไม่ใช่ระบบเพี้ยน */
async function summarizeNetCostImpact(): Promise<{ lots: number; amount: number }> {
    const rows = await prisma.$queryRawUnsafe<{ lots: number; amount: number }[]>(`
        SELECT COUNT(*)::int AS lots,
               COALESCE(SUM((COALESCE("newCost", 0) - "netCost") * COALESCE("qty", 0)), 0)::double precision AS amount
        FROM "RCitemlist"
        WHERE "netCost" IS NOT NULL AND "netCost" < COALESCE("newCost", 0)`);
    return rows?.[0] ?? { lots: 0, amount: 0 };
}

// ตอนบูตเครื่องลูกค้า Postgres (podman) อาจยังสตาร์ทไม่เสร็จ — retry สูงสุด ~5 นาที
const MAX_ATTEMPTS = 30;
const RETRY_DELAY_MS = 10_000;

let started = false;

export async function runDataSelfHeal(): Promise<void> {
    if (started) return;
    started = true;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const fixed = await fixRcitemlistSaleCounters();
            console.log(fixed > 0
                ? `[SelfHeal] 🔧 RCitemlist.sale: ซ่อม ${fixed} แถว (ค่าเดิมสำรองไว้ใน _selfheal_rcitemlist_sale_log)`
                : `[SelfHeal] ✅ RCitemlist.sale: ไม่พบแถวเสีย`);

            const fixedDateRC = await fixRcitemlistDateRC();
            console.log(fixedDateRC > 0
                ? `[SelfHeal] 🔧 RCitemlist.dateRC: sync วันรับสินค้าจากหัวบิล ${fixedDateRC} แถว (ค่าเดิมสำรองไว้ใน _selfheal_rcitemlist_daterc_log)`
                : `[SelfHeal] ✅ RCitemlist.dateRC: ตรงกับหัวบิลครบ`);

            await ensureProductBarcodeTable();
            console.log(`[SelfHeal] ✅ ProductBarcode: ตารางบาร์โค้ดสำรองพร้อมใช้งาน`);

            // ต้องเป็นงานสุดท้ายเสมอ — รอบแรกหลังลูกค้ากดอัปเดตจะ throw เพราะคอลัมน์ยังไม่ถูกสร้าง
            // (db push รันทีหลังแอปบูต) แล้ว retry loop จะพากลับมาทำใหม่จนสำเร็จ ดูเหตุผลเต็มด้านบน
            const filled = await fillRcitemlistNetCost();
            const impact = await summarizeNetCostImpact();
            console.log(filled > 0
                ? `[SelfHeal] 🔧 RCitemlist.netCost: คำนวณทุนสุทธิให้ ${filled} แถว`
                : `[SelfHeal] ✅ RCitemlist.netCost: คำนวณครบทุกแถวแล้ว`);
            console.log(impact.lots > 0
                ? `[SelfHeal] 💰 ทุนสุทธิ: ${impact.lots} ล็อตมีส่วนลด รวมต้นทุนลดลง ${impact.amount.toFixed(2)} บาท`
                : `[SelfHeal] 💰 ทุนสุทธิ: ยังไม่มีล็อตไหนบันทึกส่วนลดไว้`);
            return;
        } catch (err) {
            if (attempt === MAX_ATTEMPTS) {
                console.error(`[SelfHeal] ❌ ซ่อมไม่สำเร็จหลังลอง ${MAX_ATTEMPTS} ครั้ง:`, err);
                return;
            }
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }
}
