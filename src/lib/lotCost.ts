// ต้นทุนสุทธิของล็อตรับเข้า (RCitemlist) — จุดเดียวในระบบที่นิยาม "ทุนต่อหน่วยย่อยที่แท้จริง"
//
// ══════════════════════════════════════════════════════════════════════════════
// ปัญหาที่ไฟล์นี้แก้
// ══════════════════════════════════════════════════════════════════════════════
// ตอนรับสินค้า ผู้ขายมักให้ส่วนลดเป็นบาทต่อบรรทัด (RCitemlist.discountbaht)
// แต่ newCost ที่บันทึกไว้เป็น "ทุนก่อนหักส่วนลด" (gross) เสมอ และส่วนลดถูกใช้แค่
// ตอนรวมยอดหน้าจอ/พิมพ์ใบรับเท่านั้น — ไม่เคยไหลกลับเข้าทุนต่อหน่วย
// ผลคือทุกสูตรต้นทุน/กำไรทั้งระบบใช้ทุนสูงกว่าที่จ่ายจริง
//
//     รับ 10 ขวด × 100 บาท = 1,000 บาท  ส่วนลด 200 บาท
//         newCost = 100 บาท/ขวด   ← ที่ระบบใช้มาตลอด
//         netCost =  80 บาท/ขวด   ← ที่จ่ายจริง
//
// ══════════════════════════════════════════════════════════════════════════════
// ทำไม netCost ต้อง "คำนวณใหม่ได้เสมอ" ห้ามเป็นค่าที่ผู้ใช้กรอกเอง
// ══════════════════════════════════════════════════════════════════════════════
// เครื่องลูกค้าอัปเดตด้วย `prisma db push --accept-data-loss` (installer/scripts/update.ps1)
// ถ้าวันหนึ่งต้อง rollback กลับ image เก่าที่ schema ไม่มีคอลัมน์นี้ db push รอบถัดไป
// จะ "drop คอลัมน์ netCost ทิ้ง" — ซึ่งไม่เสียหายเลยตราบใดที่มันคำนวณกลับมาได้จาก
// totalcost / discountbaht / qty ที่ยังอยู่ครบ  แต่ถ้าเมื่อไหร่ให้ผู้ใช้พิมพ์ทุนสุทธิเอง
// คอลัมน์นี้จะกลายเป็นข้อมูลต้นฉบับทันที และการ rollback จะทำข้อมูลหายถาวร
//
// ด้วยเหตุผลเดียวกัน คอลัมน์ต้องเป็น `Float?` เปล่า ๆ ตรงกับ schema.prisma เป๊ะ
// ห้ามใส่ @default / NOT NULL / GENERATED — db push จะมองเป็น drift แล้ว
// drop+recreate ทุกครั้งที่ลูกค้ากดอัปเดต (เคยเกิดกับตาราง MainLevel มาแล้ว)
//
// ══════════════════════════════════════════════════════════════════════════════
// netCost = null หมายถึงอะไร
// ══════════════════════════════════════════════════════════════════════════════
// "ยังไม่ได้คำนวณ" ไม่ใช่ "ไม่มีส่วนลด" — ตัวอ่าน lotUnitCost() จะคำนวณสดจากแถวนั้นเอง
// จึงได้คำตอบที่ถูกต้องทันทีแม้คอลัมน์ยังว่างทั้งตาราง (เช่นวินาทีแรกหลังลูกค้ากดอัปเดต
// ซึ่ง db push เพิ่งสร้างคอลัมน์เสร็จ และ selfHeal ยังไม่ทันเติมค่า)
// คอลัมน์จึงเป็นเพียง "ตัวช่วยให้ raw SQL เขียนสั้นลง" ไม่ใช่แหล่งความจริงหลัก

import { roundUnit } from "./receiveUnit";

// ══════════════════════════════════════════════════════════════════════════════
// สวิตช์ขยายฟีเจอร์ — แก้ที่นี่จุดเดียว ทั้งระบบขยับพร้อมกัน
// ══════════════════════════════════════════════════════════════════════════════
// จงใจให้เป็นค่าคงที่ระดับโมดูล ไม่ใช่พารามิเตอร์ต่อการเรียก เพราะถ้าผู้เรียกส่งเองได้
// วันหนึ่งจะมีคนส่งไม่ตรงกัน แล้วทุนหน้าขายกับทุนในรายงานจะเพี้ยนคนละทางโดยไม่มีใครรู้

/**
 * false (ปัจจุบัน) = ของแถมมีทุนเท่ากับของซื้อ — ทุน ÷ จำนวนที่ซื้อ (qty)
 * true             = ถัวเฉลี่ยทุนรวมของแถม   — ทุน ÷ (qty + freebaht)
 *
 * เชิงบัญชี true ถูกต้องกว่า (ของแถมเข้าสต็อกเป็น balance = qty + freebaht ต้องขายหมด
 * ที่มูลค่าซื้อก้อนเดียวกัน) แต่กระทบสินค้าที่มีของแถมทุกตัวพร้อมกัน จึงยังไม่เปิดในเฟสนี้
 *
 * ⚠️ วันที่เปิดสวิตช์นี้ ต้องทำสองอย่างเพิ่ม:
 *    1) แก้สูตร SQL ในงานที่ 4 ของ src/lib/selfHeal.ts ให้ตรงกัน
 *    2) ล้างค่าเดิมทั้งตาราง (UPDATE "RCitemlist" SET "netCost" = NULL) ให้ selfHeal เติมใหม่
 *       เพราะงานที่ 4 แตะเฉพาะแถวที่เป็น NULL — ค่าที่คำนวณด้วยสูตรเก่าจะค้างอยู่ตลอดไป
 */
export const SPREAD_COST_OVER_FREE = false;

/**
 * false (ปัจจุบัน) = คิดเฉพาะส่วนลดต่อบรรทัด (RCitemlist.discountbaht)
 * true             = รวมส่วนลดท้ายบิล (Receive.discountRC) ที่ปันส่วนมาแล้วด้วย
 *
 * ส่วนลดท้ายบิลอยู่คนละตาราง ผู้เรียกต้อง join Receive แล้วเฉลี่ยตามสัดส่วนมูลค่า
 * แต่ละบรรทัดมาส่งเองทาง opts.billDiscountShare — และต้องคำนวณใหม่ทุกครั้งที่แก้หัวบิล
 */
export const INCLUDE_BILL_DISCOUNT = false;

/** เท่าที่สูตรต้นทุนต้องใช้จากแถว RCitemlist (รับ object อะไรก็ได้ที่มีฟิลด์เหล่านี้) */
export interface LotCostSource {
    newCost?: number | null;
    qty?: number | null;
    totalcost?: number | null;
    discountbaht?: number | null;
    freebaht?: number | null;
    netCost?: number | null;
    /** ไว้อ้างอิงในข้อความเตือนเมื่อข้อมูลเพี้ยน (ไม่มีก็ได้) */
    id?: number | null;
}

export interface NetCostOptions {
    /**
     * ส่วนลดท้ายบิลที่ปันส่วนมาให้บรรทัดนี้แล้ว (บาท)
     * มีผลก็ต่อเมื่อ INCLUDE_BILL_DISCOUNT = true เท่านั้น
     */
    billDiscountShare?: number | null;
}

const num = (value: unknown): number => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

/** ทุนรวมของบรรทัด (บาท ก่อนหักส่วนลด) — แถวเก่าที่ไม่มี totalcost ให้ย้อนคิดจาก newCost × qty */
function grossTotal(row: LotCostSource): number {
    const totalcost = num(row.totalcost);
    if (totalcost > 0) return totalcost;
    return num(row.newCost) * num(row.qty);
}

/** จำนวนหน่วยย่อยที่ใช้หารทุน */
function costDivisor(row: LotCostSource): number {
    const qty = num(row.qty);
    return SPREAD_COST_OVER_FREE ? qty + num(row.freebaht) : qty;
}

/**
 * ทุนสุทธิต่อหน่วยย่อย — คืน null เมื่อข้อมูลไม่พอจะคำนวณ (ผู้เรียกตัดสินใจเองว่าจะทำอย่างไรต่อ)
 *
 * ใช้ตอน "เขียน" ลงคอลัมน์ netCost เป็นหลัก ส่วนตอน "อ่าน" ให้ใช้ lotUnitCost()
 */
export function computeNetCostOrNull(row: LotCostSource, opts?: NetCostOptions): number | null {
    if (!row) return null;

    const qty = num(row.qty);
    const newCost = num(row.newCost);
    const divisor = costDivisor(row);
    const discount = num(row.discountbaht)
        + (INCLUDE_BILL_DISCOUNT ? num(opts?.billDiscountShare) : 0);

    // ทางลัดสำคัญ: ไม่มีส่วนลด + ไม่ได้เฉลี่ยของแถม → ทุนสุทธิ = ทุนเดิมเป๊ะ ๆ
    // ต้องคืน newCost ตรง ๆ ไม่ใช่ผลหาร totalcost/qty เพราะสองทางนี้อาจต่างกันที่ทศนิยม
    // ตัวสุดท้าย (ทุนต่อหน่วยขายที่หารไม่ลงตัว เช่น 100 ÷ 3) แล้วยอดจะขยับทั้งที่ไม่มีอะไรเปลี่ยน
    if (discount <= 0 && divisor === qty && newCost > 0) return newCost;

    const gross = grossTotal(row);
    if (!(gross > 0) || !(divisor > 0)) return null;

    const net = (gross - discount) / divisor;

    // ส่วนลดมากกว่าทุนทั้งบรรทัด = กรอกผิดแน่นอน (เช่นใส่ยอดรวมทั้งบิลลงช่องส่วนลดบรรทัดเดียว)
    // ไม่ปล่อยทุนติดลบเข้าระบบเพราะจะทำให้กำไรพุ่งผิดปกติแบบเงียบ ๆ
    if (net < 0) {
        console.warn(`[lotCost] ⚠️ ส่วนลดมากกว่าทุนของล็อต #${row.id ?? "?"} `
            + `(ทุนรวม ${gross}, ส่วนลด ${discount}) → ใช้ทุน 0`);
        return 0;
    }

    return roundUnit(net, 6);
}

/**
 * ทุนต่อหน่วยย่อยที่ควรใช้คำนวณทุกอย่าง — ตัวอ่านหลักของทั้งระบบ
 *
 * netCost ที่คำนวณไว้แล้ว → ใช้เลย
 * ยังเป็น null           → คำนวณสดจากแถวนั้น (ไม่ต้องรอ backfill)
 * ข้อมูลไม่พอ            → ตกกลับ newCost เดิม (พฤติกรรมเดียวกับก่อนมีฟีเจอร์นี้)
 */
export function lotUnitCost(row: LotCostSource | null | undefined, opts?: NetCostOptions): number {
    if (!row) return 0;
    const stored = row.netCost;
    if (stored !== null && stored !== undefined && Number.isFinite(Number(stored))) {
        return Number(stored);
    }
    const computed = computeNetCostOrNull(row, opts);
    return computed !== null ? computed : num(row.newCost);
}

/** ฟิลด์ที่ทำให้ทุนสุทธิเปลี่ยน — ถ้าผู้เรียกไม่ได้ส่งสักตัว แปลว่าไม่ได้ยุ่งกับต้นทุน */
const COST_FIELDS = ["newCost", "qty", "totalcost", "discountbaht", "freebaht"] as const;

/**
 * ค่าที่ต้องเขียนลงคอลัมน์ netCost — ใช้กับ prisma create/update ทุกจุดที่แตะ RCitemlist
 *
 *   data: { ...fields, ...netCostPatch(fields) }
 *
 * คืน `{}` เมื่อผู้เรียกไม่ได้ส่งฟิลด์ต้นทุนมาเลย (Prisma จะไม่แตะคอลัมน์เดิม)
 * — กติกาเดียวกับ normalizeReceivePacking() ใน src/lib/receiveUnit.ts
 *
 * คืน `{ netCost: null }` เมื่อแตะต้นทุนแต่ข้อมูลไม่พอจะคำนวณ ซึ่งปลอดภัยเสมอ
 * เพราะ null = "ให้คำนวณตอนอ่าน" ไม่ใช่ "ไม่มีส่วนลด" — ค่าเก่าที่ค้างอยู่ต่างหากที่อันตราย
 */
export function netCostPatch(
    input: LotCostSource,
    opts?: NetCostOptions
): { netCost?: number | null } {
    if (!input) return {};
    const touched = COST_FIELDS.some((key) => input[key] !== undefined);
    if (!touched) return {};
    return { netCost: computeNetCostOrNull(input, opts) };
}
