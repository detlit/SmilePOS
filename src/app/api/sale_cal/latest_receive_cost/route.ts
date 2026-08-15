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
    const itemcode = searchParam.get('itemcode')

    if (!company || !itemcode) {
        return Response.json({ error: "Missing company or itemcode" }, { status: 400 })
    }

    const prisma = await getPrisma();

    // ทุนที่คืนไปคือ "ทุนสุทธิหลังหักส่วนลด" ทั้งคู่ (src/lib/lotCost.ts)
    // ค่าเฉลี่ยคำนวณเองจากแถวแทน _avg ของ Prisma เพราะทุนสุทธิต้อง fallback รายแถว
    // (netCost ?? คำนวณสด) ซึ่ง _avg ทำไม่ได้ — เงื่อนไขคัดแถวคงเดิมทุกประการ
    const costSelect = { newCost: true, netCost: true, qty: true, totalcost: true, discountbaht: true, freebaht: true }
    const [latest, allLots] = await Promise.all([
        prisma.rCitemlist.findFirst({
            where: {
                company,
                itemcode,
            },
            orderBy: { createDate: 'desc' },
            select: { ...costSelect, createDate: true }
        }),
        prisma.rCitemlist.findMany({
            where: { company, itemcode, newCost: { not: null } },
            select: costSelect,
        }),
    ])

    const averageCost = allLots.length > 0
        ? allLots.reduce((sum, lot) => sum + lotUnitCost(lot), 0) / allLots.length
        : null

    return Response.json({
        newCost: latest ? lotUnitCost(latest) : null,
        averageCost,
        createDate: latest?.createDate ?? null,
    })
}
