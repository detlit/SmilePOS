import { NextRequest } from 'next/server'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const companies = searchParam.get('companies') || ''
    const mainCompany = searchParam.get('mainCompany') || ''
    const startDate = searchParam.get('startDate') || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    const endDate = searchParam.get('endDate') || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })

    try {
        const start = new Date(startDate + "T00:00:00.000+07:00")
        const end = new Date(endDate + "T23:59:59.999+07:00")
        const companyList = companies.split(',').map(c => c.trim()).filter(Boolean)

        const prisma = await getPrisma();

        const saleItems = await prisma.sale.findMany({
            where: {
                company: companyList.length === 1 ? companyList[0] : { in: companyList },
                statuss: "OK",
                createDate: { gte: start, lte: end },
            },
        })

        // Group by category, prefer main branch category name
        const categoryMap = new Map<string, {
            name: string;
            qty: number;
            revenue: number;
            cost: number;
        }>()

        saleItems.forEach((item: any) => {
            const category = item.cetagory || 'ไม่ระบุกลุ่ม'
            const existing = categoryMap.get(category)

            if (existing) {
                existing.qty += Number(item.subqty || item.qty || 0)
                existing.revenue += Number(item.total || 0)
                existing.cost += Number(item.cost || 0)
            } else {
                categoryMap.set(category, {
                    name: category,
                    qty: Number(item.subqty || item.qty || 0),
                    revenue: Number(item.total || 0),
                    cost: Number(item.cost || 0),
                })
            }
        })

        const categories = Array.from(categoryMap.values())
            .map((c) => ({
                rank: 0,
                name: c.name,
                qty: Math.round(c.qty),
                revenue: Math.round(c.revenue),
                cost: Math.round(c.cost),
                profit: Math.round(c.revenue - c.cost),
                profitPercent: c.revenue > 0 ? Math.round(((c.revenue - c.cost) / c.revenue) * 1000) / 10 : 0,
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .map((c, index) => ({ ...c, rank: index + 1 }))

        return Response.json(categories)
    } catch (error) {
        console.error('Error in sale_category_analysis_barcode:', error)
        return Response.json({ error: 'Failed to fetch category analysis' }, { status: 500 })
    }
}
