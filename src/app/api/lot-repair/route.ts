import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyStockChange } from '@/lib/sse';
import { applyLotRepair, buildLotRepairPlan } from '@/lib/lotRelink';

// ซ่อมยอด lot ของสินค้าหนึ่งรายการให้ตรงกับยอดคำนวณ (ใช้จากหน้าสรุปยอดคงเหลือ/หน้าขาย):
// 1. เทียบยอดขายจากบิลกับรายการตัดสต๊อก (ลบรายการซ้ำ / สร้างรายการที่ขาด)
// 2. ไล่บัญชี lot ใหม่ทั้งเส้นตามประวัติ transaction แล้วจัดสรรการตัด lot ใหม่
//    ให้ทุกรายการตัดได้ไม่เกินจำนวนที่รับเข้า/รับโอนของ lot นั้นจริง ๆ
// 3. เขียนกลับทั้งรายการเคลื่อนไหวและ balance/ตัวนับขายของทุก lot
// รายละเอียด/เหตุผลของสูตรอยู่ใน src/lib/lotRelink.ts และ src/lib/lotLedger.ts

// ตัดรายละเอียดแผนระดับรายการทิ้งก่อนส่งกลับ — ฝั่งหน้าจอใช้แค่ยอดสรุป
const slim = (plan: any) => ({ ...plan, relink: null });

// GET: ตรวจสอบ + วางแผน (ไม่แก้ข้อมูล)
export async function GET(request: NextRequest) {
    try {
        const sp = request.nextUrl.searchParams;
        const company = sp.get('company');
        const itemcode = sp.get('itemcode');
        const idParam = sp.get('id');

        if (!company || !itemcode) {
            return NextResponse.json({ error: 'company and itemcode are required' }, { status: 400 });
        }
        const productId = idParam ? parseInt(idParam, 10) : null;

        const plan = await buildLotRepairPlan(
            prisma, company, itemcode,
            productId != null && !isNaN(productId) ? productId : null
        );
        return NextResponse.json({ success: true, plan: slim(plan) });
    } catch (error: any) {
        console.error('[LotRepair] GET error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

// POST: ลงมือซ่อมตามแผน (คำนวณแผนใหม่ใน transaction, สำรองค่าเดิมลง log เสมอ)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { company, itemcode, id, person } = body;

        if (!company || !itemcode) {
            return NextResponse.json({ error: 'company and itemcode are required' }, { status: 400 });
        }
        const productId = id != null ? parseInt(String(id), 10) : null;

        const applied = await applyLotRepair(
            prisma, company, itemcode, person || '',
            productId != null && !isNaN(productId) ? productId : null
        );
        try { notifyStockChange(itemcode); } catch { /* ignore */ }

        const parts: string[] = [];
        if (applied.changes.length > 0) parts.push(`ปรับยอด ${applied.changes.length} lot`);
        if (applied.reassignTxCount > 0) parts.push(`จัดสรรการตัด lot ใหม่ ${applied.reassignTxCount} รายการ (${applied.reassignQty} หน่วย)`);
        if (applied.orphanAssignable > 0) parts.push(`ผูกบิลย้อนหลัง ${applied.orphanAssignable} หน่วย`);
        if (applied.deleteTxCount > 0) parts.push(`ลบรายการขายซ้ำ ${applied.deleteTxCount} รายการ`);
        if (applied.createLotCount > 0) parts.push(`สร้าง lot รับโอน ${applied.createLotCount} lot (${applied.createQty} หน่วย)`);
        if (applied.createSaleTxCount > 0) parts.push(`ตัดสต๊อกย้อนหลังให้บิลที่ยังไม่ได้ตัด ${applied.createSaleQty} หน่วย`);
        if (applied.unallocatedQty > 0) parts.push(`เหลือรายการที่ของไม่พอตัด ${applied.unallocatedQty} หน่วย`);

        return NextResponse.json({
            success: true,
            plan: slim(applied),
            message: parts.length === 0
                ? 'ข้อมูล lot ถูกต้องอยู่แล้ว ไม่มีอะไรต้องซ่อม'
                : `ซ่อมแล้ว: ${parts.join(' / ')}`
        });
    } catch (error: any) {
        console.error('[LotRepair] POST error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
