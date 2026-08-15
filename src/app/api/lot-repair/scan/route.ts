import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scanCompanyLotRepair } from '@/lib/lotRelink';

// สแกนทุกสินค้าใน company หายอด lot ที่ไม่ตรงยอดคำนวณ/บิลกำพร้า พร้อมแผนซ่อมต่อสินค้า
// (อ่านอย่างเดียว ไม่แก้ข้อมูล — การซ่อมจริงใช้ POST /api/lot-repair ทีละสินค้า)
export async function GET(request: NextRequest) {
    try {
        const company = request.nextUrl.searchParams.get('company');
        if (!company) {
            return NextResponse.json({ error: 'company is required' }, { status: 400 });
        }

        const started = Date.now();
        const scan = await scanCompanyLotRepair(prisma, company);

        return NextResponse.json({
            success: true,
            plans: scan.plans,
            stats: {
                products: scan.plans.length,
                candidateCount: scan.candidateCount,
                lotItemcodeCount: scan.lotItemcodeCount,
                elapsedMs: Date.now() - started
            }
        });
    } catch (error: any) {
        console.error('[LotRepairScan] GET error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
