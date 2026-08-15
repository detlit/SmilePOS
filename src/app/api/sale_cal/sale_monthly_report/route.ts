import { NextRequest } from 'next/server'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const company = searchParam.get('company')
    const createDate = searchParam.get('createDate') || new Date().getFullYear().toString() // Format: YYYY
    const sort = searchParam.get('sort') || 'asc'

    try {
        const startYear = new Date(`${createDate}-01-01T00:00:00.000+07:00`)
        const endYear = new Date(`${createDate}-12-31T23:59:59.999+07:00`)

        const prisma = await getPrisma();

        // Get all sale items for the year
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

        // Get all sale mains (bills) for the year
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

        // Create monthly buckets
        const monthsData = []
        for (let m = 1; m <= 12; m++) {
            const monthStr = m < 10 ? `0${m}` : `${m}`
            const lastDay = new Date(Number(createDate), m, 0).getDate()
            const monthStart = new Date(`${createDate}-${monthStr}-01T00:00:00.000+07:00`)
            const monthEnd = new Date(`${createDate}-${monthStr}-${lastDay}T23:59:59.999+07:00`)

            // Filter sale items for this month
            const monthSaleItems = saleItems.filter((s: any) => {
                const saleDate = new Date(s.createDate)
                return saleDate >= monthStart && saleDate <= monthEnd
            })

            // Filter bills for this month
            const monthBills = saleMains.filter((sm: any) => {
                const billDate = new Date(sm.createDate)
                return billDate >= monthStart && billDate <= monthEnd
            })

            const billCount = monthBills.length
            const revenue = monthSaleItems.reduce((a: number, b: any) => a + Number(b.total || 0), 0)
            const cost = monthSaleItems.reduce((a: number, b: any) => a + (Number(b.cost || 0)), 0)
            const profit = revenue - cost
            const perBill = billCount > 0 ? revenue / billCount : 0
            const profitPercent = revenue > 0 ? (profit / revenue) * 100 : 0

            const monthLabel = `${monthNames[m - 1]} ${createDate}`

            monthsData.push({
                month: monthLabel,
                monthNumber: m,
                bill: billCount,
                revenue: Math.round(revenue),
                cost: Math.round(cost),
                perBill: Math.round(perBill),
                profit: Math.round(profit),
                profitPercent: Math.round(profitPercent * 10) / 10,
            })
        }

        return Response.json(monthsData)
    } catch (error) {
        console.error('Error in sale_monthly_report:', error)
        return Response.json({ error: 'Failed to fetch monthly report' }, { status: 500 })
    }
}
