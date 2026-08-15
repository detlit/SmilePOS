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

        const [saleMains, customers, histories] = await Promise.all([
            prisma.saleMain.findMany({
                where: {
                    companyall: company,
                    statussall: "",
                    createDate: { gte: start, lte: end },
                },
                select: {
                    id: true,
                    code_costomer: true,
                    sumtotal: true,
                    totalall: true,
                    discount: true,
                    addreward: true,
                    usereward: true,
                    pay: true,
                    personall: true,
                    createDate: true,
                    group_price: true,
                },
            }),
            prisma.customer.findMany({
                where: { company },
                select: {
                    id: true,
                    code: true,
                    names: true,
                    sex: true,
                    age: true,
                    point: true,
                    totalPoint: true,
                    congenitalDisease: true,
                    levelPrice: true,
                    birthday: true,
                    customer: true,
                },
            }),
            prisma.history.findMany({
                where: {
                    company,
                    duedate: { lte: new Date() },
                    statusH: { not: "เสร็จสิ้น" },
                },
                select: {
                    id: true,
                    code_costomer: true,
                    name_customer: true,
                    duedate: true,
                    statusH: true,
                },
            }),
        ])

        // Build customer map
        const cusMap = new Map<string, any>()
        customers.forEach(c => {
            if (c.code) cusMap.set(c.code, c)
        })

        // Aggregate by customer
        const customerSales = new Map<string, {
            code: string; name: string; bills: number; revenue: number;
            discount: number; reward: number; lastDate: Date | null; sex: string;
            age: number; point: number; totalPoint: number; congenitalDisease: string;
            levelPrice: string;
        }>()

        saleMains.forEach((sm: any) => {
            const code = sm.code_costomer || 'ลูกค้าทั่วไป'
            const existing = customerSales.get(code)
            const cus = cusMap.get(code)

            if (existing) {
                existing.bills += 1
                existing.revenue += Number(sm.sumtotal || 0)
                existing.discount += Number(sm.discount || 0)
                existing.reward += Number(sm.usereward || 0)
                if (sm.createDate && (!existing.lastDate || sm.createDate > existing.lastDate)) {
                    existing.lastDate = sm.createDate
                }
            } else {
                customerSales.set(code, {
                    code,
                    name: cus?.names || code,
                    bills: 1,
                    revenue: Number(sm.sumtotal || 0),
                    discount: Number(sm.discount || 0),
                    reward: Number(sm.usereward || 0),
                    lastDate: sm.createDate,
                    sex: cus?.sex || '',
                    age: cus?.age || 0,
                    point: cus?.point || 0,
                    totalPoint: cus?.totalPoint || 0,
                    congenitalDisease: cus?.congenitalDisease || '',
                    levelPrice: cus?.levelPrice || '',
                })
            }
        })

        const customerList = Array.from(customerSales.values())
            .sort((a, b) => b.revenue - a.revenue)
            .map((c, i) => ({ ...c, rank: i + 1 }))

        // Summary stats
        const totalCustomers = customerList.length
        const totalRevenue = customerList.reduce((s, c) => s + c.revenue, 0)
        const totalBills = customerList.reduce((s, c) => s + c.bills, 0)
        const avgPerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0
        const avgPerBill = totalBills > 0 ? totalRevenue / totalBills : 0

        // New vs returning: customers who bought in previous period vs not
        const newCustomers = customerList.filter(c => c.bills === 1).length
        const returningCustomers = customerList.filter(c => c.bills > 1).length

        // Gender breakdown
        const maleCount = customerList.filter(c => c.sex === 'ชาย').length
        const femaleCount = customerList.filter(c => c.sex === 'หญิง').length

        // Age groups
        const ageGroups = [
            { label: '0-18', count: customerList.filter(c => c.age > 0 && c.age <= 18).length },
            { label: '19-35', count: customerList.filter(c => c.age > 18 && c.age <= 35).length },
            { label: '36-50', count: customerList.filter(c => c.age > 35 && c.age <= 50).length },
            { label: '51-65', count: customerList.filter(c => c.age > 50 && c.age <= 65).length },
            { label: '65+', count: customerList.filter(c => c.age > 65).length },
        ]

        // Price level breakdown
        const priceLevelMap = new Map<string, number>()
        customerList.forEach(c => {
            const level = c.levelPrice || 'ทั่วไป'
            priceLevelMap.set(level, (priceLevelMap.get(level) || 0) + 1)
        })
        const priceLevels = Array.from(priceLevelMap.entries()).map(([level, count]) => ({ level, count }))

        // Follow-up pending
        const pendingFollowups = histories.length

        return Response.json({
            summary: {
                totalCustomers,
                totalRevenue: Math.round(totalRevenue),
                totalBills,
                avgPerCustomer: Math.round(avgPerCustomer),
                avgPerBill: Math.round(avgPerBill),
                newCustomers,
                returningCustomers,
                maleCount,
                femaleCount,
                pendingFollowups,
            },
            ageGroups,
            priceLevels,
            customers: customerList.slice(0, 200),
            followups: histories.slice(0, 50),
        })
    } catch (error) {
        console.error('Error in customer_analysis:', error)
        return Response.json({ error: 'Failed to fetch customer analysis' }, { status: 500 })
    }
}
