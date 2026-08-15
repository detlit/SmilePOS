import { NextRequest } from 'next/server'
import { lotUnitCost } from '@/lib/lotCost'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const company = searchParam.get('company')
    const supplierCode = searchParam.get('supplierCode')

    if (!company) {
        return Response.json({ error: "Missing company" }, { status: 400 })
    }

    const prisma = await getPrisma();

    if (supplierCode) {
        // Fetch latest cost per item for a specific supplier
        const items = await prisma.rCitemlist.findMany({
            where: {
                company,
                codevender: supplierCode,
            },
            orderBy: { createDate: 'desc' },
            distinct: ['itemcode'],
            select: {
                itemcode: true,
                newCost: true,
                netCost: true,
                qty: true,
            }
        });

        // ทุนล่าสุดต่อสินค้าของผู้ขายรายนี้ = ทุนสุทธิหลังหักส่วนลด (src/lib/lotCost.ts)
        const costMap: Record<string, number> = {};
        items.forEach(item => {
            if (item.itemcode) {
                costMap[item.itemcode] = lotUnitCost(item);
            }
        });

        return Response.json(costMap);
    }

    return Response.json({});
}
