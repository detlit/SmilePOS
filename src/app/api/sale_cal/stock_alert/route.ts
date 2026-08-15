import { NextRequest } from 'next/server'
import { lotUnitCost } from '@/lib/lotCost'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const company = searchParam.get('company') || ''

    if (!company) {
        return Response.json({ error: 'company is required' }, { status: 400 })
    }

    try {
        const prisma = await getPrisma()

        // Get all products with Min/Max/ROP settings
        const datalist = await prisma.datalist.findMany({
            where: { company },
            select: {
                id: true,
                code: true,
                ProductName: true,
                ROP: true,
                Min: true,
                Max: true,
                Unit: true,
                group: true,
                CostActual: true,
                PriceA: true,
            },
        })

        // Get current balances from RCitemlist
        const rcItems = await prisma.rCitemlist.findMany({
            where: { company, balance: { gt: 0 } },
            select: {
                itemcode: true,
                balance: true,
                newCost: true,
                netCost: true,
                qty: true,
                lot: true,
                dateExp: true,
            },
        })

        // Aggregate balances by product code
        const balanceMap = new Map<string, { balance: number; lots: number; nearestExpiry: Date | null; totalCost: number }>()
        rcItems.forEach(rc => {
            const code = rc.itemcode || ''
            const existing = balanceMap.get(code) || { balance: 0, lots: 0, nearestExpiry: null, totalCost: 0 }
            existing.balance += Number(rc.balance || 0)
            existing.lots += 1
            existing.totalCost += Number(rc.balance || 0) * lotUnitCost(rc)
            if (rc.dateExp) {
                const ed = new Date(rc.dateExp)
                if (!existing.nearestExpiry || ed < existing.nearestExpiry) {
                    existing.nearestExpiry = ed
                }
            }
            balanceMap.set(code, existing)
        })

        // Build alert items
        const alerts: any[] = []
        datalist.forEach(d => {
            const rop = Number(d.ROP || 0)
            const min = Number(d.Min || 0)
            const max = Number(d.Max || 0)
            if (rop <= 0 && min <= 0) return // No settings

            const stock = balanceMap.get(d.code || '')
            const balance = stock?.balance || 0

            let alertLevel = ''
            if (balance <= 0) alertLevel = 'out'
            else if (rop > 0 && balance <= rop) alertLevel = 'rop'
            else if (min > 0 && balance <= min) alertLevel = 'min'
            else return // Above min, no alert

            alerts.push({
                code: d.code,
                name: d.ProductName,
                balance: Math.round(balance),
                rop,
                min,
                max,
                unit: d.Unit || '',
                group: d.group || '',
                alertLevel,
                lots: stock?.lots || 0,
                nearestExpiry: stock?.nearestExpiry,
                stockValue: Math.round(stock?.totalCost || 0),
                cost: Number(d.CostActual || 0),
                price: Number(d.PriceA || 0),
                orderQty: max > 0 ? Math.max(0, max - balance) : Math.max(0, (rop > 0 ? rop * 2 : min * 2) - balance),
            })
        })

        // Sort: out first, then rop, then min
        const priority: Record<string, number> = { out: 0, rop: 1, min: 2 }
        alerts.sort((a, b) => (priority[a.alertLevel] ?? 9) - (priority[b.alertLevel] ?? 9))

        // Summary
        const outCount = alerts.filter(a => a.alertLevel === 'out').length
        const ropCount = alerts.filter(a => a.alertLevel === 'rop').length
        const minCount = alerts.filter(a => a.alertLevel === 'min').length
        const totalOrderValue = alerts.reduce((s, a) => s + (a.orderQty * a.cost), 0)

        // Group by product group
        const groupMap = new Map<string, number>()
        alerts.forEach(a => {
            const g = a.group || 'ไม่ระบุ'
            groupMap.set(g, (groupMap.get(g) || 0) + 1)
        })
        const groups = Array.from(groupMap.entries())
            .map(([group, count]) => ({ group, count }))
            .sort((a, b) => b.count - a.count)

        return Response.json({
            summary: {
                totalAlerts: alerts.length,
                outCount,
                ropCount,
                minCount,
                totalOrderValue: Math.round(totalOrderValue),
                totalProducts: datalist.length,
            },
            groups,
            alerts,
        })
    } catch (error) {
        console.error('Error in stock_alert:', error)
        return Response.json({ error: 'Failed to fetch stock alerts' }, { status: 500 })
    }
}
