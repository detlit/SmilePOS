import { NextRequest } from 'next/server'
import { lotUnitCost } from '@/lib/lotCost'
import { buildBulkStockBalance, receivedQty } from '@/lib/stockBalance'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const company = searchParam.get('company') || ''
    const search = searchParam.get('search') || ''
    const group = searchParam.get('group') || ''
    const category = searchParam.get('category') || ''
    const statusFilter = searchParam.get('status') || '' // all, normal, low, rop, out
    const sortBy = searchParam.get('sortBy') || 'name' // name, balance, value, group
    const sortDir = searchParam.get('sortDir') || 'asc'

    if (!company) {
        return Response.json({ error: 'company is required' }, { status: 400 })
    }

    try {
        const prisma = await getPrisma()

        // โหมดราคาทุน: "latest" (ทุนล่าสุด, ค่าเริ่มต้น) หรือ "average" (ทุนเฉลี่ยของ newCost ทุกล็อต)
        const storeSetting = await prisma.settingStore.findFirst({ where: { company }, select: { costPriceMode: true } as any }) as any
        const costPriceMode = String(storeSetting?.costPriceMode) === 'average' ? 'average' : 'latest'

        // Get all products
        const datalist = await prisma.datalist.findMany({
            where: { company },
            select: {
                id: true,
                code: true,
                ProductName: true,
                group: true,
                Category: true,
                Unit: true,
                CostActual: true,
                price: true,
                Min: true,
                Max: true,
                ROP: true,
                Barcode: true,
                maker: true,
            },
        })

        // ดึงล็อตทั้งหมด (รับเข้า) ของบริษัท — ใช้คำนวณยอดรับ, หาต้นทุนล่าสุด และรวมล็อตที่ยังมีของ
        const rcItems = await prisma.rCitemlist.findMany({
            where: { company },
            select: {
                id: true,
                itemcode: true,
                Barcode: true,
                qty: true,
                freebaht: true,
                balance: true,
                statuss: true,
                newCost: true,
                netCost: true,
                lot: true,
                dateExp: true,
                dateRC: true,
                namevender: true,
            },
        })

        // ดึงยอดขาย (statuss = "OK") และ StockTransaction ทั้งบริษัท
        // เพื่อคำนวณยอดคงเหลือด้วยสูตรเดียวกับหน้า "สรุปยอดคงเหลือ"
        const sales = await prisma.sale.findMany({
            where: { company, statuss: 'OK' },
            select: { barcode: true, code_product: true, qty: true, subqty: true },
        })
        const stockTx = await prisma.stockTransaction.findMany({
            where: { company },
            select: { itemcode: true, transaction_type: true, quantity_change: true },
        })

        // ยอดคงเหลือมาตรฐานต่อสินค้า = รับ − ขาย − โอนออก + รับโอน + ปรับยอด
        // ใช้ตัวคำนวณกลางตัวเดียวกับหน้า "สรุปยอดคงเหลือ" (src/lib/stockBalance.ts)
        // เพื่อให้ยอดของสองหน้าตรงกันเสมอ แม้จะมี transaction type เพิ่มในอนาคต
        const bulkBalance = buildBulkStockBalance({
            products: datalist,
            lots: rcItems,
            sales,
            transactions: stockTx,
        })
        const calcBalanceOf = (barcode: string | null | undefined, code: string | null | undefined) =>
            bulkBalance.balanceOf(barcode, code)

        // ต้นทุนล่าสุด (ทุนสุทธิของล็อตที่ dateRC ใหม่สุด) ต่อรหัสสินค้า — ดู src/lib/lotCost.ts
        const latestCostMap = new Map<string, { cost: number; dateRC: Date | null }>()
        // ต้นทุนเฉลี่ย (ค่าเฉลี่ยอย่างง่ายของทุนสุทธิทุกล็อตที่มีค่า) ต่อรหัสสินค้า
        const avgCostAccum = new Map<string, { sum: number; count: number }>()
        rcItems.forEach(rc => {
            const code = rc.itemcode || ''
            if (!code) return
            const rcDate = rc.dateRC ? new Date(rc.dateRC) : null
            const existing = latestCostMap.get(code)
            // เลือกล็อตที่ dateRC ใหม่สุด (ล็อตที่มี dateRC ชนะล็อตที่ไม่มีวันที่)
            if (!existing || (rcDate && (!existing.dateRC || rcDate > existing.dateRC))) {
                latestCostMap.set(code, { cost: lotUnitCost(rc), dateRC: rcDate })
            }
            // เกณฑ์ "ล็อตนี้มีทุนไหม" ยังยึด newCost เหมือนเดิม เปลี่ยนแค่ค่าที่นำไปเฉลี่ย
            if (rc.newCost !== null && rc.newCost !== undefined) {
                const acc = avgCostAccum.get(code) || { sum: 0, count: 0 }
                acc.sum += lotUnitCost(rc)
                acc.count += 1
                avgCostAccum.set(code, acc)
            }
        })
        const avgCostMap = new Map<string, number>()
        avgCostAccum.forEach((v, code) => avgCostMap.set(code, v.count > 0 ? v.sum / v.count : 0))
        // ต้นทุนต่อหน่วยตามโหมดที่ตั้งค่า
        const unitCostOf = (code: string, fallback: number) => {
            if (costPriceMode === 'average') {
                const avg = avgCostMap.get(code) || 0
                if (avg > 0) return avg
            }
            const latest = latestCostMap.get(code)
            return latest && latest.cost > 0 ? latest.cost : fallback
        }

        // รวมล็อตที่ยังมีของ (balance > 0) ไว้แสดงรายละเอียด Lot / มูลค่าทุน / วันหมดอายุ
        const balanceMap = new Map<string, {
            lots: { id: number; lot: string; received: number; balance: number; cost: number; dateExp: Date | null; dateRC: Date | null; vendor: string }[]
            totalCostValue: number
            nearestExpiry: Date | null
        }>()
        rcItems.forEach(rc => {
            const code = rc.itemcode || ''
            const bal = Number(rc.balance || 0)
            if (bal <= 0) return
            const existing = balanceMap.get(code) || { lots: [], totalCostValue: 0, nearestExpiry: null }
            // มูลค่าสต็อกคิดจากทุนสุทธิที่จ่ายจริง ไม่ใช่ทุนก่อนหักส่วนลด
            existing.totalCostValue += bal * lotUnitCost(rc)
            existing.lots.push({
                id: rc.id,
                lot: rc.lot || '',
                // จำนวนที่รับเข้าของล็อตนี้ = qty + ของแถม (นิยามกลางเดียวกับหน้าสรุปยอดคงเหลือ)
                received: receivedQty(rc),
                balance: bal,
                cost: lotUnitCost(rc),
                dateExp: rc.dateExp ? new Date(rc.dateExp) : null,
                dateRC: rc.dateRC ? new Date(rc.dateRC) : null,
                vendor: rc.namevender || '',
            })
            if (rc.dateExp) {
                const ed = new Date(rc.dateExp)
                if (!existing.nearestExpiry || ed < existing.nearestExpiry) {
                    existing.nearestExpiry = ed
                }
            }
            balanceMap.set(code, existing)
        })

        // Build product list
        const now = new Date()
        const days90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
        let products: any[] = []

        datalist.forEach(d => {
            const code = d.code || ''
            const stock = balanceMap.get(code)
            // คงเหลือ = ยอดคำนวณตามหน้าสรุปยอดคงเหลือ (รับ − ขาย − โอนออก + รับโอน + ปรับยอด)
            const balance = calcBalanceOf(d.Barcode, code)
            // ต้นทุน = ตามโหมด (ทุนล่าสุด/ทุนเฉลี่ย); ถ้าไม่เคยรับเข้าเลย ใช้ CostActual จากทะเบียนสินค้า
            const costActual = unitCostOf(code, Number(d.CostActual || 0))
            const price = Number(d.price || 0)
            const min = Number(d.Min || 0)
            const max = Number(d.Max || 0)
            const rop = Number(d.ROP || 0)

            // Determine status
            let status = 'normal'
            if (balance <= 0) status = 'out'
            else if (rop > 0 && balance <= rop) status = 'rop'
            else if (min > 0 && balance <= min) status = 'low'

            // Check expiry within 90 days
            const hasNearExpiry = stock?.nearestExpiry ? stock.nearestExpiry <= days90 : false

            // มูลค่าทุน: โหมดทุนล่าสุด ใช้มูลค่าตามต้นทุนจริงของแต่ละล็อต / โหมดเฉลี่ย ใช้ยอดคงเหลือ × ทุนเฉลี่ย
            const stockValueCost = costPriceMode === 'average' ? balance * costActual : (stock?.totalCostValue || 0)

            products.push({
                id: d.id,
                code,
                name: d.ProductName || '',
                group: d.group || '',
                category: d.Category || '',
                unit: d.Unit || '',
                balance: Math.round(balance * 100) / 100,
                costActual,
                stockValueCost: Math.round(stockValueCost * 100) / 100,
                stockValueSale: Math.round(balance * price * 100) / 100,
                price,
                min, max, rop,
                status,
                lotCount: stock?.lots?.length || 0,
                nearestExpiry: stock?.nearestExpiry || null,
                hasNearExpiry,
                lots: stock?.lots?.sort((a, b) => {
                    if (!a.dateExp && !b.dateExp) return 0
                    if (!a.dateExp) return 1
                    if (!b.dateExp) return -1
                    return a.dateExp.getTime() - b.dateExp.getTime()
                }) || [],
            })
        })

        // Apply filters
        if (search.trim()) {
            const q = search.toLowerCase()
            products = products.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.code.toLowerCase().includes(q)
            )
        }
        if (group) products = products.filter(p => p.group === group)
        if (category) products = products.filter(p => p.category === category)
        if (statusFilter && statusFilter !== 'all') {
            products = products.filter(p => p.status === statusFilter)
        }

        // Sort
        products.sort((a, b) => {
            let cmp = 0
            switch (sortBy) {
                case 'balance': cmp = a.balance - b.balance; break
                case 'value': cmp = a.stockValueCost - b.stockValueCost; break
                case 'group': cmp = (a.group || '').localeCompare(b.group || '', 'th'); break
                default: cmp = (a.name || '').localeCompare(b.name || '', 'th'); break
            }
            return sortDir === 'desc' ? -cmp : cmp
        })

        // Summary stats (computed in single pass)
        const totalSKU = datalist.length
        let totalStockValueCost = 0
        let totalStockValueSale = 0
        let outOfStockCount = 0
        let belowMinCount = 0
        let belowROPCount = 0
        let nearExpiryCount = 0
        for (const d of datalist) {
            const code = d.code || ''
            const stock = balanceMap.get(code)
            const bal = calcBalanceOf(d.Barcode, code)
            const min = Number(d.Min || 0)
            const rop = Number(d.ROP || 0)
            const price = Number(d.price || 0)
            totalStockValueCost += costPriceMode === 'average'
                ? bal * unitCostOf(code, Number(d.CostActual || 0))
                : (stock?.totalCostValue || 0)
            totalStockValueSale += bal * price
            if (bal <= 0) outOfStockCount++
            else {
                if (rop > 0 && bal <= rop) belowROPCount++
                if (min > 0 && bal <= min) belowMinCount++
            }
            if (stock?.nearestExpiry && stock.nearestExpiry <= days90) nearExpiryCount++
        }

        // Top 10 by stock value
        const top10Value = [...products]
            .filter(p => p.stockValueCost > 0)
            .sort((a, b) => b.stockValueCost - a.stockValueCost)
            .slice(0, 10)
            .map(p => ({ name: p.name, value: Math.round(p.stockValueCost) }))

        // Group breakdown
        const groupBreakdown = new Map<string, { count: number; value: number }>()
        products.forEach(p => {
            const g = p.group || 'ไม่ระบุ'
            const existing = groupBreakdown.get(g) || { count: 0, value: 0 }
            existing.count++
            existing.value += p.stockValueCost
            groupBreakdown.set(g, existing)
        })
        const groupStats = Array.from(groupBreakdown.entries())
            .map(([name, data]) => ({ name, count: data.count, value: Math.round(data.value) }))
            .sort((a, b) => b.value - a.value)

        // Category breakdown
        const categoryBreakdown = new Map<string, { count: number; value: number }>()
        products.forEach(p => {
            const c = p.category || 'ไม่ระบุ'
            const existing = categoryBreakdown.get(c) || { count: 0, value: 0 }
            existing.count++
            existing.value += p.stockValueCost
            categoryBreakdown.set(c, existing)
        })
        const categoryStats = Array.from(categoryBreakdown.entries())
            .map(([name, data]) => ({ name, count: data.count, value: Math.round(data.value) }))
            .sort((a, b) => b.value - a.value)

        // Available groups and categories for filters
        const allGroups = [...new Set(datalist.map(d => d.group).filter(Boolean))] as string[]
        const allCategories = [...new Set(datalist.map(d => d.Category).filter(Boolean))] as string[]

        return Response.json({
            summary: {
                totalSKU,
                totalStockValueCost: Math.round(totalStockValueCost),
                totalStockValueSale: Math.round(totalStockValueSale),
                outOfStockCount,
                belowMinCount,
                belowROPCount,
                nearExpiryCount,
                totalWithStock: totalSKU - outOfStockCount,
            },
            top10Value,
            groupStats,
            categoryStats,
            products,
            filters: {
                groups: allGroups.sort((a, b) => a.localeCompare(b, 'th')),
                categories: allCategories.sort((a, b) => a.localeCompare(b, 'th')),
            },
        })
    } catch (error) {
        console.error('Error in stock_inventory:', error)
        return Response.json({ error: 'Failed to fetch stock inventory' }, { status: 500 })
    }
}
