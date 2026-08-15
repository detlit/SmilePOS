import { NextRequest } from 'next/server'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const company = searchParam.get('company')
    const startDate = searchParam.get('startDate') || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    const endDate = searchParam.get('endDate') || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })

    try {
        const start = new Date(startDate + "T00:00:00.000+07:00")
        const end = new Date(endDate + "T23:59:59.999+07:00")

        const prisma = await getPrisma();

        // Get all sale items in date range
        const saleItems = await prisma.sale.findMany({
            where: {
                company,
                statuss: "OK",
                createDate: {
                    gte: start,
                    lte: end,
                },
            },
        })

        // Group by product code
        const productMap = new Map<string, {
            code: string;
            name: string;
            qty: number;
            revenue: number;
            cost: number;
        }>()

        saleItems.forEach((item: any) => {
            const code = item.code_product || ''
            const existing = productMap.get(code)

            if (existing) {
                existing.qty += Number(item.qty || 0)
                existing.revenue += Number(item.total || 0)
                existing.cost += Number(item.cost || 0)
            } else {
                productMap.set(code, {
                    code: code,
                    name: item.name_product || '',
                    qty: Number(item.qty || 0),
                    revenue: Number(item.total || 0),
                    cost: Number(item.cost || 0),
                })
            }
        })

        // Convert to array and sort by revenue descending
        const products = Array.from(productMap.values())
            .map((p, index) => ({
                rank: index + 1,
                code: p.code,
                name: p.name,
                qty: Math.round(p.qty),
                revenue: Math.round(p.revenue),
                cost: Math.round(p.cost),
                profit: Math.round(p.revenue - p.cost),
                profitPercent: p.revenue > 0 ? Math.round(((p.revenue - p.cost) / p.revenue) * 1000) / 10 : 0,
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .map((p, index) => ({ ...p, rank: index + 1 }))

        return Response.json(products)
    } catch (error) {
        console.error('Error in sale_product_analysis:', error)
        return Response.json({ error: 'Failed to fetch product analysis' }, { status: 500 })
    }
}
