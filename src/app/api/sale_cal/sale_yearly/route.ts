import { NextRequest } from 'next/server'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const company = searchParam.get('company')
    const createDate = searchParam.get('createDate') || new Date().getFullYear().toString() // Format: YYYY
    const sort = searchParam.get('sort') || 'asc'

    try {
        // Get data for the past 5 years
        const currentYear = Number(createDate)
        const startYear = new Date(`${currentYear - 4}-01-01T00:00:00.000+07:00`)
        const endYear = new Date(`${currentYear}-12-31T23:59:59.999+07:00`)

        const prisma = await getPrisma();

        // Get all sale items for the year range
        const saleItems = await prisma.sale.findMany({
            where: {
                company,
                statuss: "OK",
                createDate: {
                    gte: startYear,
                    lte: endYear,
                },
            },
            orderBy: {
                id: sort,
            } as any,
        })

        // Get all sale mains (bills) for the year range
        const saleMains = await prisma.saleMain.findMany({
            where: {
                companyall: company,
                statussall: "",
                createDate: {
                    gte: startYear,
                    lte: endYear,
                },
            },
        })

        // Group by year
        const yearlyData = []
        for (let y = currentYear - 4; y <= currentYear; y++) {
            const yearStart = new Date(`${y}-01-01T00:00:00.000+07:00`)
            const yearEnd = new Date(`${y}-12-31T23:59:59.999+07:00`)

            // Filter sale items for this year
            const yearSaleItems = saleItems.filter((s: any) => {
                const saleDate = new Date(s.createDate)
                return saleDate >= yearStart && saleDate <= yearEnd
            })

            // Filter bills for this year
            const yearBills = saleMains.filter((sm: any) => {
                const billDate = new Date(sm.createDate)
                return billDate >= yearStart && billDate <= yearEnd
            })

            const billCount = yearBills.length
            const revenue = yearBills.reduce((a: number, b: any) => a + Number(b.sumtotal || 0), 0)
            const cost = yearSaleItems.reduce((a: number, b: any) => a + (Number(b.cost || 0)), 0)
            const profit = revenue - cost
            const perBill = billCount > 0 ? revenue / billCount : 0
            const profitPercent = revenue > 0 ? (profit / revenue) * 100 : 0

            yearlyData.push({
                year: y.toString(),
                bill: billCount,
                revenue: Math.round(revenue),
                cost: Math.round(cost),
                perBill: Math.round(perBill),
                profit: Math.round(profit),
                profitPercent: Math.round(profitPercent * 10) / 10,
            })
        }

        return Response.json(yearlyData)
    } catch (error) {
        console.error('Error in sale_yearly:', error)
        return Response.json({ error: 'Failed to fetch yearly report' }, { status: 500 })
    }
}
