import { NextRequest } from 'next/server'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const company = searchParam.get('company')
    const createDate = searchParam.get('createDate') || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }) // Format: YYYY-MM-DD
    const sort = searchParam.get('sort') || 'asc'

    try {
        const startDate = new Date(createDate + "T00:00:00.000+07:00")
        const endDate = new Date(createDate + "T23:59:59.999+07:00")

        const prisma = await getPrisma();

        // Get all sales (sale items) for the day
        const saleItems = await prisma.sale.findMany({
            where: {
                company,
                statuss: "OK",
                createDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: {
                id: sort,
            } as any,
        })

        // Get all sale main (bills) for the day
        const saleMains = await prisma.saleMain.findMany({
            where: {
                companyall: company,
                statussall: "",
                createDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        })

        // Create hourly buckets (6:00 - 24:00)
        const hours = []
        for (let h = 6; h <= 24; h++) {
            const hourStart = new Date(createDate)
            hourStart.setHours(h, 0, 0, 0)
            const hourEnd = new Date(createDate)
            hourEnd.setHours(h, 59, 59, 999)

            // Filter sales for this hour
            const hourSaleItems = saleItems.filter((s: any) => {
                const saleDate = new Date(s.createDate)
                return saleDate >= hourStart && saleDate <= hourEnd
            })

            // Filter bill mains for this hour
            const hourBills = saleMains.filter((sm: any) => {
                const billDate = new Date(sm.createDate)
                return billDate >= hourStart && billDate <= hourEnd
            })

            const billCount = hourBills.length
            const revenue = hourBills.reduce((a: number, b: any) => a + Number(b.sumtotal || 0), 0)
            const cost = hourSaleItems.reduce((a: number, b: any) => a + (Number(b.cost || 0)), 0)
            const profit = revenue - cost
            const perBill = billCount > 0 ? revenue / billCount : 0
            const profitPercent = revenue > 0 ? (profit / revenue) * 100 : 0

            const timeLabel = h < 10 ? `0${h}:00` : `${h === 24 ? '00' : h}:00`

            hours.push({
                time: timeLabel,
                hour: h,
                bill: billCount,
                revenue: Math.round(revenue),
                cost: Math.round(cost),
                perBill: Math.round(perBill),
                profit: Math.round(profit),
                profitPercent: Math.round(profitPercent * 10) / 10,
            })
        }

        return Response.json(hours)
    } catch (error) {
        console.error('Error in sale_hourly_report:', error)
        return Response.json({ error: 'Failed to fetch hourly report' }, { status: 500 })
    }
}

