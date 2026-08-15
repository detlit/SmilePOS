import { NextRequest } from 'next/server'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const company = searchParam.get('company') || ''
    const startDate = searchParam.get('startDate') || ''
    const endDate = searchParam.get('endDate') || ''

    if (!company) {
        return Response.json({ error: 'company is required' }, { status: 400 })
    }

    try {
        const start = new Date(startDate + "T00:00:00.000+07:00")
        const end = new Date(endDate + "T23:59:59.999+07:00")

        const prisma = await getPrisma()

        const histories = await prisma.history.findMany({
            where: {
                company,
                OR: [
                    { duedate: { gte: start, lte: end } },
                    { duedate: { lte: new Date() }, statusH: { not: "เสร็จสิ้น" } },
                ],
            },
            orderBy: { duedate: 'asc' },
            select: {
                id: true,
                code_costomer: true,
                name_customer: true,
                duedate: true,
                statusH: true,
                followup: true,
                solution: true,
                remark: true,
                createDate: true,
            },
        })

        const now = new Date()

        // Categorize
        let completed = 0, pending = 0, overdue = 0
        const overdueList: any[] = []
        const pendingList: any[] = []
        const completedList: any[] = []

        histories.forEach(h => {
            if (h.statusH === 'เสร็จสิ้น') {
                completed++
                completedList.push(h)
            } else if (h.duedate && new Date(h.duedate) < now) {
                overdue++
                overdueList.push(h)
            } else {
                pending++
                pendingList.push(h)
            }
        })

        // Group by customer
        const customerMap = new Map<string, {
            code: string; name: string; total: number; overdue: number; pending: number; completed: number;
        }>()

        histories.forEach(h => {
            const code = h.code_costomer || 'unknown'
            const existing = customerMap.get(code) || {
                code,
                name: h.name_customer || '',
                total: 0,
                overdue: 0,
                pending: 0,
                completed: 0,
            }
            existing.total++
            if (h.statusH === 'เสร็จสิ้น') existing.completed++
            else if (h.duedate && new Date(h.duedate) < now) existing.overdue++
            else existing.pending++
            customerMap.set(code, existing)
        })

        const byCustomer = Array.from(customerMap.values())
            .sort((a, b) => b.overdue - a.overdue || b.total - a.total)

        // Daily timeline
        const dailyMap = new Map<string, { due: number; completed: number; overdue: number }>()
        histories.forEach(h => {
            const dateKey = h.duedate
                ? new Date(new Date(h.duedate).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
                : 'unknown'
            const day = dailyMap.get(dateKey) || { due: 0, completed: 0, overdue: 0 }
            day.due++
            if (h.statusH === 'เสร็จสิ้น') day.completed++
            else if (h.duedate && new Date(h.duedate) < now) day.overdue++
            dailyMap.set(dateKey, day)
        })

        const daily = Array.from(dailyMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, data]) => ({ date, ...data }))

        return Response.json({
            summary: {
                total: histories.length,
                completed,
                pending,
                overdue,
                completionRate: histories.length > 0 ? Math.round((completed / histories.length) * 1000) / 10 : 0,
                uniqueCustomers: customerMap.size,
            },
            overdueList: overdueList.slice(0, 100),
            pendingList: pendingList.slice(0, 100),
            completedList: completedList.slice(0, 100),
            byCustomer: byCustomer.slice(0, 100),
            daily,
        })
    } catch (error) {
        console.error('Error in followup_summary:', error)
        return Response.json({ error: 'Failed to fetch followup summary' }, { status: 500 })
    }
}
