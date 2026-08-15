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

        const saleMains = await prisma.saleMain.findMany({
            where: {
                companyall: company,
                statussall: "",
                createDate: { gte: start, lte: end },
            },
            select: {
                id: true,
                pay: true,
                sumtotal: true,
                totalall: true,
                discount: true,
                usereward: true,
                addreward: true,
                cashAmount: true,
                transferAmount: true,
                transferDetail: true,
                createDate: true,
            },
        })

        // Aggregate by payment method
        let cashTotal = 0, cashCount = 0
        let transferTotal = 0, transferCount = 0
        let splitTotal = 0, splitCount = 0
        let splitCash = 0, splitTransfer = 0
        let otherTotal = 0, otherCount = 0
        let totalDiscount = 0, totalReward = 0
        const transferDetailMap = new Map<string, { total: number; count: number }>()
        const dailyMap = new Map<string, { cash: number; transfer: number; split: number; other: number; total: number }>()

        saleMains.forEach((sm: any) => {
            const pay = sm.pay || ''
            const amount = Number(sm.sumtotal || 0)
            totalDiscount += Number(sm.discount || 0)
            totalReward += Number(sm.usereward || 0)

            // Daily breakdown
            const dateKey = sm.createDate
                ? new Date(new Date(sm.createDate).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
                : 'unknown'
            const day = dailyMap.get(dateKey) || { cash: 0, transfer: 0, split: 0, other: 0, total: 0 }

            if (pay === 'เงินสด' || pay === 'cash') {
                cashTotal += amount
                cashCount++
                day.cash += amount
            } else if (pay === 'โอน' || pay === 'payment') {
                transferTotal += amount
                transferCount++
                day.transfer += amount
                const detail = sm.transferDetail || 'โอน (ไม่ระบุ)'
                const existing = transferDetailMap.get(detail) || { total: 0, count: 0 }
                existing.total += amount
                existing.count++
                transferDetailMap.set(detail, existing)
            } else if (pay === 'เงินสด+โอน') {
                splitCount++
                const ca = Number(sm.cashAmount || 0)
                const ta = Number(sm.transferAmount || 0)
                splitCash += ca
                splitTransfer += ta
                splitTotal += amount
                day.split += amount
                day.cash += ca
                day.transfer += ta
                const detail = sm.transferDetail || 'โอน (ไม่ระบุ)'
                const existing = transferDetailMap.get(detail) || { total: 0, count: 0 }
                existing.total += ta
                existing.count++
                transferDetailMap.set(detail, existing)
            } else if (pay === 'อื่นๆ' || pay === 'other') {
                otherTotal += amount
                otherCount++
                day.other += amount
            }

            day.total += amount
            dailyMap.set(dateKey, day)
        })

        const grandTotal = cashTotal + transferTotal + splitTotal + otherTotal
        const totalCashAll = cashTotal + splitCash
        const totalTransferAll = transferTotal + splitTransfer
        const totalBills = saleMains.length

        const transferDetails = Array.from(transferDetailMap.entries())
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.total - a.total)

        const daily = Array.from(dailyMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, data]) => ({ date, ...data }))

        return Response.json({
            summary: {
                grandTotal: Math.round(grandTotal),
                totalBills,
                totalCashAll: Math.round(totalCashAll),
                totalTransferAll: Math.round(totalTransferAll),
                cashTotal: Math.round(cashTotal),
                cashCount,
                transferTotal: Math.round(transferTotal),
                transferCount,
                splitTotal: Math.round(splitTotal),
                splitCount,
                splitCash: Math.round(splitCash),
                splitTransfer: Math.round(splitTransfer),
                otherTotal: Math.round(otherTotal),
                otherCount,
                totalDiscount: Math.round(totalDiscount),
                totalReward: Math.round(totalReward),
                cashPercent: grandTotal > 0 ? Math.round((totalCashAll / grandTotal) * 1000) / 10 : 0,
                transferPercent: grandTotal > 0 ? Math.round((totalTransferAll / grandTotal) * 1000) / 10 : 0,
                otherPercent: grandTotal > 0 ? Math.round((otherTotal / grandTotal) * 1000) / 10 : 0,
            },
            transferDetails,
            daily,
        })
    } catch (error) {
        console.error('Error in payment_summary:', error)
        return Response.json({ error: 'Failed to fetch payment summary' }, { status: 500 })
    }
}
