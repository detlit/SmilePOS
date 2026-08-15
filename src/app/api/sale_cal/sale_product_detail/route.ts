import { NextRequest } from 'next/server'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const company = searchParam.get('company')
    const productCode = searchParam.get('productCode') || ''
    const startDate = searchParam.get('startDate') || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    const endDate = searchParam.get('endDate') || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })

    try {
        const start = new Date(startDate + "T00:00:00.000+07:00")
        const end = new Date(endDate + "T23:59:59.999+07:00")

        const prisma = await getPrisma();

        // Get all sale items for this product in date range
        const saleItems = await prisma.sale.findMany({
            where: {
                company,
                code_product: productCode,
                statuss: "OK",
                createDate: {
                    gte: start,
                    lte: end,
                },
            },
            orderBy: {
                createDate: 'asc',
            },
        })

        // Calculate summary
        let totalQty = 0
        let totalRevenue = 0
        let totalCost = 0
        let avgPrice = 0

        saleItems.forEach((item: any) => {
            totalQty += Number(item.qty || 0)
            totalRevenue += Number(item.total || 0)
            totalCost += Number(item.cost || 0)  // ผลรวม cost ไม่คูณ qty
            avgPrice = Number(item.price || 0)
        })

        // กำไร = ยอดขาย - ราคาทุน
        const profit = totalRevenue - totalCost
        // %กำไร = (กำไร/ยอดขาย)*100%
        const profitPercent = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0
        // ราคาทุน/หน่วย = ราคาทุน/จำนวนขาย
        const costPerUnit = totalQty > 0 ? totalCost / totalQty : 0

        // Group by day for daily chart
        const dailyMap = new Map<string, number>()
        saleItems.forEach((item: any) => {
            const dateKey = new Date(item.createDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
            dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + Number(item.total || 0))
        })
        const dailySales = Array.from(dailyMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, revenue]) => ({
                label: date.split('-').slice(1).join('/'),
                revenue: Math.round(revenue),
            }))

        // Group by day of month (1-31) - aggregate across all months
        const dayOfMonthMap = new Map<number, number>()
        saleItems.forEach((item: any) => {
            const date = new Date(item.createDate)
            const dayOfMonth = date.getDate()
            dayOfMonthMap.set(dayOfMonth, (dayOfMonthMap.get(dayOfMonth) || 0) + Number(item.total || 0))
        })
        const dayOfMonthSales = Array.from({ length: 31 }, (_, i) => ({
            label: `${i + 1}`,
            revenue: Math.round(dayOfMonthMap.get(i + 1) || 0),
        }))

        // Group by week for weekly chart
        const weeklyMap = new Map<string, number>()
        saleItems.forEach((item: any) => {
            const date = new Date(item.createDate)
            const weekStart = new Date(date)
            weekStart.setDate(date.getDate() - date.getDay())
            const weekKey = weekStart.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
            weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + Number(item.total || 0))
        })
        const weeklySales = Array.from(weeklyMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, revenue], index) => ({
                label: `W${index + 1}`,
                revenue: Math.round(revenue),
            }))

        // Group by month for monthly chart
        const monthlyMap = new Map<string, number>()
        const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
        saleItems.forEach((item: any) => {
            const date = new Date(item.createDate)
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + Number(item.total || 0))
        })
        const monthlySales = Array.from(monthlyMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, revenue]) => {
                const [year, month] = date.split('-')
                return {
                    label: `${monthNames[Number(month) - 1]} ${year}`,
                    revenue: Math.round(revenue),
                }
            })

        return Response.json({
            summary: {
                totalQty: Math.round(totalQty),
                totalRevenue: Math.round(totalRevenue),
                totalCost: Math.round(totalCost),
                avgPrice: Math.round(avgPrice),
                costPerUnit: Math.round(costPerUnit),
                profit: Math.round(profit),
                profitPercent: Math.round(profitPercent * 10) / 10,
            },
            dayOfMonthSales,
            dailySales,
            weeklySales,
            monthlySales,
        })
    } catch (error) {
        console.error('Error in sale_product_detail:', error)
        return Response.json({ error: 'Failed to fetch product detail' }, { status: 500 })
    }
}
