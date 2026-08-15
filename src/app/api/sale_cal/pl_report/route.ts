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
    const startDate = searchParam.get('startDate') || ''
    const endDate = searchParam.get('endDate') || ''

    if (!company) {
        return Response.json({ error: 'company is required' }, { status: 400 })
    }

    try {
        const start = new Date(startDate + "T00:00:00.000+07:00")
        const end = new Date(endDate + "T23:59:59.999+07:00")

        const prisma = await getPrisma()

        const [saleMains, saleItems, rcItems, datalist] = await Promise.all([
            prisma.saleMain.findMany({
                where: {
                    companyall: company,
                    statussall: "",
                    createDate: { gte: start, lte: end },
                },
                select: { id: true, sumtotal: true },
            }),
            prisma.sale.findMany({
                where: {
                    company,
                    statuss: "OK",
                    createDate: { gte: start, lte: end },
                },
                select: { cost: true, total: true, qty: true },
            }),
            prisma.rCitemlist.findMany({
                where: {
                    company,
                    dateRC: { gte: start, lte: end },
                },
                select: { totalcost: true, discountbaht: true },
            }),
            prisma.datalist.findMany({
                where: { company },
                select: { code: true, CostActual: true },
            }),
        ])

        // Calculate stock value
        const stockItems = await prisma.rCitemlist.findMany({
            where: { company, balance: { gt: 0 } },
            select: { newCost: true, netCost: true, qty: true, balance: true },
        })

        // มูลค่าสต็อกคิดจากทุนสุทธิหลังหักส่วนลด (src/lib/lotCost.ts) ให้ตรงกับต้นทุนที่จ่ายจริง
        const stockValue = stockItems.reduce((s, item) =>
            s + (Number(item.balance || 0) * lotUnitCost(item)), 0)

        // Revenue
        const totalRevenue = saleMains.reduce((s, sm) => s + Number(sm.sumtotal || 0), 0)

        // COGS from sale items
        const totalCOGS = saleItems.reduce((s, si) => s + Number(si.cost || 0), 0)

        // Gross Profit
        const grossProfit = totalRevenue - totalCOGS
        const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

        // Purchase cost — หักส่วนลดต่อบรรทัดออก ให้เท่ากับยอดที่จ่ายผู้ขายจริง
        // (สูตรเดียวกับยอดรวมในหน้ารับสินค้า: totalcost − discountbaht)
        const totalPurchase = rcItems.reduce((s, rc) =>
            s + Number(rc.totalcost || 0) - Number(rc.discountbaht || 0), 0)

        // Fetch PL data if exists
        const [yearStr, monthStr] = startDate.split('-')
        const plData = await (prisma as any).pL.findFirst({
            where: {
                company,
                year: yearStr,
                month: monthStr,
            },
        })

        // Build P&L structure
        const pl = {
            // Revenue
            R4000: plData?.R4000 ?? totalRevenue,  // ยอดขายสินค้า
            R4001: plData?.R4001 ?? 0,              // รายได้อื่น
            R4002: plData?.R4002 ?? 0,              // รายได้อื่น 2

            // Cost of goods
            C5000: plData?.C5000 ?? totalCOGS,      // ต้นทุนขาย
            C5001: plData?.C5001 ?? 0,              // ต้นทุนอื่น

            // Selling expenses
            S6000: plData?.S6000 ?? 0,  // เงินเดือน/ค่าจ้าง
            S6001: plData?.S6001 ?? 0,  // ค่าเช่า
            S6002: plData?.S6002 ?? 0,  // ค่าน้ำ
            S6003: plData?.S6003 ?? 0,  // ค่าไฟ
            S6004: plData?.S6004 ?? 0,  // ค่าโทรศัพท์/อินเตอร์เน็ต
            S6005: plData?.S6005 ?? 0,  // ค่าขนส่ง
            S6006: plData?.S6006 ?? 0,  // ค่าโฆษณา/การตลาด
            S6007: plData?.S6007 ?? 0,  // ค่าเสื่อมราคา
            S6008: plData?.S6008 ?? 0,  // ค่าซ่อมบำรุง
            S6009: plData?.S6009 ?? 0,  // ค่าประกัน
            S6010: plData?.S6010 ?? 0,  // ค่าใช้จ่ายอื่น

            // Admin expenses
            A7000: plData?.A7000 ?? 0,  // ค่าที่ปรึกษา/บัญชี
            A7001: plData?.A7001 ?? 0,  // ค่าอุปกรณ์สำนักงาน
            A7002: plData?.A7002 ?? 0,  // ค่าธรรมเนียม
            A7003: plData?.A7003 ?? 0,  // ค่าสาธารณูปโภคอื่น
            A7004: plData?.A7004 ?? 0,  // ค่าใช้จ่ายบริหารอื่น
            A7005: plData?.A7005 ?? 0,
            A7006: plData?.A7006 ?? 0,
            A7007: plData?.A7007 ?? 0,

            vat: plData?.vat ?? 0,
        }

        const totalRevenueAll = pl.R4000 + pl.R4001 + pl.R4002
        const totalCost = pl.C5000 + pl.C5001
        const grossProfitPL = totalRevenueAll - totalCost

        const totalSelling = pl.S6000 + pl.S6001 + pl.S6002 + pl.S6003 + pl.S6004 +
            pl.S6005 + pl.S6006 + pl.S6007 + pl.S6008 + pl.S6009 + pl.S6010
        const totalAdmin = pl.A7000 + pl.A7001 + pl.A7002 + pl.A7003 + pl.A7004 +
            pl.A7005 + pl.A7006 + pl.A7007

        const totalExpenses = totalSelling + totalAdmin
        const operatingProfit = grossProfitPL - totalExpenses
        const netProfit = operatingProfit - pl.vat
        const netMargin = totalRevenueAll > 0 ? (netProfit / totalRevenueAll) * 100 : 0

        return Response.json({
            pl,
            calculated: {
                totalRevenue: Math.round(totalRevenueAll),
                totalCost: Math.round(totalCost),
                grossProfit: Math.round(grossProfitPL),
                grossMargin: Math.round(grossMargin * 10) / 10,
                totalSelling: Math.round(totalSelling),
                totalAdmin: Math.round(totalAdmin),
                totalExpenses: Math.round(totalExpenses),
                operatingProfit: Math.round(operatingProfit),
                netProfit: Math.round(netProfit),
                netMargin: Math.round(netMargin * 10) / 10,
                totalPurchase: Math.round(totalPurchase),
                stockValue: Math.round(stockValue),
                totalBills: saleMains.length,
            },
            hasPLData: !!plData,
        })
    } catch (error) {
        console.error('Error in pl_report:', error)
        return Response.json({ error: 'Failed to fetch P&L report' }, { status: 500 })
    }
}
