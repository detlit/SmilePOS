import { NextRequest } from 'next/server'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const company = searchParam.get('company')
    const createDate = searchParam.get('createDate') || '' // Format: YYYY-MM
    const sort = searchParam.get('sort') || 'asc'

    try {
        const [year, month] = createDate.split('-')
        const startOfMonth = new Date(`${year}-${month}-01T00:00:00.000+07:00`)
        const lastDay = new Date(Number(year), Number(month), 0).getDate()
        const endOfMonth = new Date(`${year}-${month}-${lastDay}T23:59:59.999+07:00`)

        const prisma = await getPrisma();

        // Get all sale items for the month
        const saleItems = await prisma.sale.findMany({
            where: {
                company,
                statuss: "OK",
                createDate: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
            orderBy: {
                id: sort,
            } as any,
        })

        // Get all sale mains (bills) for the month
        const saleMains = await prisma.saleMain.findMany({
            where: {
                companyall: company,
                statussall: "",
                createDate: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
        })

        // Create daily buckets
        const daysData = []
        for (let d = 1; d <= lastDay; d++) {
            const dayStr = d < 10 ? `0${d}` : `${d}`
            const dayStart = new Date(`${year}-${month}-${dayStr}T00:00:00.000+07:00`)
            const dayEnd = new Date(`${year}-${month}-${dayStr}T23:59:59.999+07:00`)

            // Filter sale items for this day
            const daySaleItems = saleItems.filter((s: any) => {
                const saleDate = new Date(s.createDate)
                return saleDate >= dayStart && saleDate <= dayEnd
            })

            // Filter bills for this day
            const dayBills = saleMains.filter((sm: any) => {
                const billDate = new Date(sm.createDate)
                return billDate >= dayStart && billDate <= dayEnd
            })

            const billCount = dayBills.length
            const revenue = dayBills.reduce((a: number, b: any) => a + Number(b.sumtotal || 0), 0)
            const cost = daySaleItems.reduce((a: number, b: any) => a + (Number(b.cost || 0)), 0)
            const profit = revenue - cost
            const perBill = billCount > 0 ? revenue / billCount : 0
            const profitPercent = revenue > 0 ? (profit / revenue) * 100 : 0

            const dateLabel = `${d}/${month}/${year}`

            daysData.push({
                date: dateLabel,
                day: d,
                dateISO: `${year}-${month}-${dayStr}`,
                bill: billCount,
                revenue: Math.round(revenue),
                cost: Math.round(cost),
                perBill: Math.round(perBill),
                profit: Math.round(profit),
                profitPercent: Math.round(profitPercent * 10) / 10,
            })
        }

        return Response.json(daysData)
    } catch (error) {
        console.error('Error in sale_daily_report:', error)
        return Response.json({ error: 'Failed to fetch daily report' }, { status: 500 })
    }
}
