import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyStockChange } from '@/lib/sse';
import { applyLotRelinkForItem, buildLotRelinkPlan, findOrphanSaleItemcodes } from '@/lib/lotRelink';

// GET: preview — วางแผนผูกบิลขายแบบไม่มี lot กลับเข้า lot (FEFO) ต่อสินค้า
// ความจุใช้ "ยอดคำนวณ" (calculateLotBalances) ไม่ใช่ balance ที่บันทึก เพราะ lot ยุคบั๊ก
// อาจมี balance บันทึกผิด (ดูรายละเอียดใน src/lib/lotRelink.ts) — ยังไม่แก้อะไรใน DB
export async function GET(request: NextRequest) {
    try {
        const company = request.nextUrl.searchParams.get('company');
        if (!company) {
            return NextResponse.json({ error: 'company is required' }, { status: 400 });
        }

        const itemcodes = await findOrphanSaleItemcodes(prisma, company);

        // วางแผนทีละชุดเล็ก ๆ กัน connection pool หมด (แผนหนึ่งใช้หลาย query)
        const plans = [];
        const BATCH = 8;
        for (let i = 0; i < itemcodes.length; i += BATCH) {
            const batch = await Promise.all(
                itemcodes.slice(i, i + BATCH).map(code => buildLotRelinkPlan(prisma, company, code))
            );
            plans.push(...batch.filter(Boolean));
        }

        return NextResponse.json({
            success: true,
            data: plans,
            totalItems: plans.length,
            totalQty: plans.reduce((s, p: any) => s + (p.totalUnassignedQty || 0), 0)
        });
    } catch (error: any) {
        console.error('[CutLotRetroactive] GET error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

// POST: apply — ผูกจริงตามแผน (คำนวณแผนใหม่ใน transaction ต่อสินค้า)
// สำรองค่าเดิมลง _selfheal_lot_relink_log ทุกครั้ง / ส่ง itemcode มาเพื่อทำเฉพาะรายการ
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { company, person, itemcode: specificItemcode } = body;

        if (!company) {
            return NextResponse.json({ error: 'company is required' }, { status: 400 });
        }

        const itemcodes = specificItemcode
            ? [String(specificItemcode)]
            : await findOrphanSaleItemcodes(prisma, company);

        let totalAssigned = 0;
        let totalRemaining = 0;
        const details: any[] = [];

        for (const code of itemcodes) {
            // โหมดตัดทั้งหมด: ข้ามสินค้าที่มี saleFallbackWarning — ต้องกดยืนยันทีละรายการ
            const applied = await applyLotRelinkForItem(prisma, company, code, person || '',
                { skipFallbackWarned: !specificItemcode });
            if (!applied) continue;
            totalAssigned += applied.assignable;
            totalRemaining += applied.remaining;
            details.push({
                itemcode: applied.itemcode,
                itemName: applied.itemName,
                totalQty: applied.totalUnassignedQty,
                assigned: applied.assignable,
                remaining: applied.remaining,
                lotsUsed: applied.lots.map(l => ({
                    lotId: l.lotId,
                    lot: l.lot,
                    dateExp: l.dateExp,
                    allocated: l.allocated,
                    newBalance: l.newBalance
                }))
            });
            try { notifyStockChange(code); } catch { /* ignore */ }
        }

        return NextResponse.json({
            success: true,
            assigned: totalAssigned,
            remaining: totalRemaining,
            details,
            message: details.length === 0
                ? 'ไม่มีรายการที่ต้องตัด lot'
                : totalRemaining > 0
                    ? `ตัด lot สำเร็จ ${totalAssigned} หน่วย (เหลือ ${totalRemaining} หน่วยที่ lot ไม่พอ)`
                    : `ตัด lot สำเร็จทั้งหมด ${totalAssigned} หน่วย`
        });
    } catch (error: any) {
        console.error('[CutLotRetroactive] POST error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
