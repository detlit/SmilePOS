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

        // Calculate weeks (starting from first day of month)
        const weeksData = []
        let currentWeekStart = new Date(startOfMonth)
        let weekNumber = 1

        while (currentWeekStart <= endOfMonth) {
            const currentWeekEnd = new Date(currentWeekStart)
            currentWeekEnd.setDate(currentWeekEnd.getDate() + 6)

            // Ensure week end doesn't exceed month end
            const weekEnd = currentWeekEnd > endOfMonth ? endOfMonth : currentWeekEnd

            // Filter sale items for this week
            const weekSaleItems = saleItems.filter((s: any) => {
                const saleDate = new Date(s.createDate)
                return saleDate >= currentWeekStart && saleDate <= weekEnd
            })

            // Filter bills for this week
            const weekBills = saleMains.filter((sm: any) => {
                const billDate = new Date(sm.createDate)
                return billDate >= currentWeekStart && billDate <= weekEnd
            })

            const billCount = weekBills.length
            const revenue = weekBills.reduce((a: number, b: any) => a + Number(b.sumtotal || 0), 0)
            const cost = weekSaleItems.reduce((a: number, b: any) => a + (Number(b.cost || 0)), 0)
            const profit = revenue - cost
            const perBill = billCount > 0 ? revenue / billCount : 0
            const profitPercent = revenue > 0 ? (profit / revenue) * 100 : 0

            const weekLabel = `สัปดาห์ ${weekNumber} (${currentWeekStart.getDate()}-${weekEnd.getDate()})`

            weeksData.push({
                week: weekLabel,
                weekNumber,
                startDate: currentWeekStart.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }),
                endDate: weekEnd.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }),
                bill: billCount,
                revenue: Math.round(revenue),
                cost: Math.round(cost),
                perBill: Math.round(perBill),
                profit: Math.round(profit),
                profitPercent: Math.round(profitPercent * 10) / 10,
            })

            // Move to next week
            currentWeekStart = new Date(weekEnd)
            currentWeekStart.setDate(currentWeekStart.getDate() + 1)
            weekNumber++
        }

        return Response.json(weeksData)
    } catch (error) {
        console.error('Error in sale_weekly:', error)
        return Response.json({ error: 'Failed to fetch weekly report' }, { status: 500 })
    }
}
