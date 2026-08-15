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
  const dateFrom = searchParam.get('dateFrom') || ''
  const dateTo = searchParam.get('dateTo') || ''

  if (!company) {
    return Response.json({ error: 'company is required' }, { status: 400 })
  }

  const prisma = await getPrisma()

  try {
    // Build date range filter
    const dateFilter: any = {}
    if (dateFrom) dateFilter.gte = new Date(dateFrom)
    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      dateFilter.lte = toDate
    }
    const hasDateFilter = Object.keys(dateFilter).length > 0

    // 1) Fetch Receive (headers) — ยึด "วันรับสินค้า" (receive_date) เป็นเกณฑ์ของทั้งรายงาน
    const rcHeaderWhere: any = { company }
    if (hasDateFilter) rcHeaderWhere.receive_date = dateFilter
    const receives = await prisma.receive.findMany({
      where: rcHeaderWhere,
      select: {
        id: true,
        names: true,
        orderfull: true,
        invoice_No: true,
        order_date: true,
        receive_date: true,
        pay_date: true,
        totalRC: true,
        vatRC: true,
        discountRC: true,
        totalRCAll: true,
        purchase_credit_status: true,
        purchase_credit_reason: true,
        purchase_credit_difference_amount: true,
        purchase_credit_reduce_amount: true,
        purchase_debit_status: true,
        purchase_debit_reason: true,
        purchase_debit_difference_amount: true,
      },
    })

    // 2) Fetch RCitemlist ของใบรับข้างต้น (join ด้วย codenames = orderfull)
    // ห้ามกรองด้วย dateRC — ข้อมูลเก่าบางแถว dateRC เป็น NULL/ไม่ตรงหัวบิล ทำให้ยอดซื้อขาดหาย
    const orderCodes = Array.from(new Set(receives.map(r => r.orderfull).filter(Boolean))) as string[]
    const rcItems = orderCodes.length > 0
      ? await prisma.rCitemlist.findMany({
          where: { company, codenames: { in: orderCodes } },
          select: {
            id: true,
            codenames: true,
            itemcode: true,
            itemName: true,
            unit: true,
            newCost: true,
            netCost: true,
            qty: true,
            totalcost: true,
            lot: true,
            dateExp: true,
            freebaht: true,
            discountbaht: true,
            balance: true,
            codevender: true,
            namevender: true,
            dateRC: true,
            maker: true,
          },
        })
      : []

    // ใบรับ → ชื่อผู้ขายจากหัวบิล เพื่อให้รายการสินค้า group อยู่ผู้ขายเดียวกับหัวบิลเสมอ
    const codeVendorName = new Map<string, string>()
    for (const r of receives) {
      if (r.orderfull) codeVendorName.set(r.orderfull, (r.names || '').trim())
    }

    // 3) Fetch Suppliers
    const suppliers = await prisma.supplier.findMany({
      where: { company },
      select: {
        id: true,
        code: true,
        names: true,
        leadtime: true,
        tel: true,
        email: true,
      },
    })

    // 4) Fetch Sales in date range (for margin/turnover analysis)
    const saleWhere: any = { company }
    if (hasDateFilter) saleWhere.createDate = dateFilter
    const sales = await prisma.sale.findMany({
      where: saleWhere,
      select: {
        id: true,
        code_product: true,
        name_product: true,
        qty: true,
        cost: true,
        price: true,
        total: true,
        createDate: true,
      },
    })

    // 5) Fetch OrderMain + OrderDetail in date range
    const orderWhere: any = { company }
    if (hasDateFilter) orderWhere.createDate = dateFilter
    const orders = await prisma.orderMain.findMany({
      where: orderWhere,
      include: { items: true },
    })

    // 6) Fetch Datalist (products) for ROP/Min/Max + price
    const products = await prisma.datalist.findMany({
      where: { company },
      select: {
        id: true,
        code: true,
        ProductName: true,
        price: true,
        CostActual: true,
        Min: true,
        Max: true,
        ROP: true,
        AlarmExp: true,
        Unit: true,
        Category: true,
      },
    })

    // 7) Fetch all RCitemlist with balance > 0 for expiry & stock analysis
    const currentStock = await prisma.rCitemlist.findMany({
      where: { company, balance: { gt: 0 } },
      select: {
        id: true,
        itemcode: true,
        itemName: true,
        balance: true,
        newCost: true,
        netCost: true,
        qty: true,
        totalcost: true,
        discountbaht: true,
        freebaht: true,
        dateExp: true,
        namevender: true,
        lot: true,
        dateRC: true,
      },
    })

    // 8) Previous period for comparison — ยึดวันรับสินค้า (receive_date) เช่นเดียวกับงวดปัจจุบัน
    let prevReceives: any[] = []
    let prevRcItems: any[] = []
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom)
      const to = new Date(dateTo)
      const diffMs = to.getTime() - from.getTime()
      const prevFrom = new Date(from.getTime() - diffMs)
      const prevTo = new Date(from.getTime() - 1)
      prevTo.setHours(23, 59, 59, 999)
      prevReceives = await prisma.receive.findMany({
        where: { company, receive_date: { gte: prevFrom, lte: prevTo } },
        select: { names: true, orderfull: true, totalRCAll: true },
      })
      const prevCodes = Array.from(new Set(prevReceives.map(r => r.orderfull).filter(Boolean))) as string[]
      prevRcItems = prevCodes.length > 0
        ? await prisma.rCitemlist.findMany({
            where: { company, codenames: { in: prevCodes } },
            select: {
              namevender: true,
              codenames: true,
              itemcode: true,
              newCost: true,
              netCost: true,
              qty: true,
              totalcost: true,
              discountbaht: true,
              freebaht: true,
            },
          })
        : []
    }

    // ==================== PROCESS DATA ====================

    // Group by vendor
    const vendorMap = new Map<string, any>()

    const getVendor = (name: string) => {
      const key = (name || 'ไม่ระบุผู้ขาย').trim()
      if (!vendorMap.has(key)) {
        const sup = suppliers.find(s => s.names === key)
        vendorMap.set(key, {
          name: key,
          code: sup?.code || '',
          leadtime: sup?.leadtime || 0,
          tel: sup?.tel || '',
          email: sup?.email || '',
          totalPurchase: 0,
          totalDiscount: 0,
          totalFree: 0,
          totalVat: 0,
          receiveCount: 0,
          skuSet: new Set(),
          items: [] as any[],
          poCount: 0,
          poTotal: 0,
          leadtimeActual: [] as number[],
          creditNotes: [] as any[],
          debitNotes: [] as any[],
          unpaidAmount: 0,
          unpaidCount: 0,
          expiryItems: [] as any[],
          salesByItem: new Map<string, number>(),
          prevTotal: 0,
          prevCostMap: new Map<string, number>(),
        })
      }
      return vendorMap.get(key)
    }

    // Process RCitemlist — เก็บรายละเอียดรายการ/ส่วนลด/SKU (ยอดซื้อหลักคิดจากหัวบิลด้านล่าง)
    for (const rc of rcItems) {
      const v = getVendor(codeVendorName.get(rc.codenames || '') || rc.namevender || '')
      v.totalDiscount += rc.discountbaht || 0
      v.totalFree += rc.freebaht || 0
      v.skuSet.add(rc.itemcode)
      v.items.push(rc)
    }

    // Process Receives (headers) - purchase total, lead time, payment, credit/debit
    for (const r of receives) {
      const v = getVendor(r.names || '')
      // ยอดซื้อ = เงินสุทธิของใบรับ (totalRCAll) ให้ตรงกับที่เห็นในหน้ารับสินค้า
      v.totalPurchase += r.totalRCAll || 0
      v.receiveCount += 1
      v.totalVat += r.vatRC || 0

      // Lead time
      if (r.order_date && r.receive_date) {
        const diff = Math.ceil((new Date(r.receive_date).getTime() - new Date(r.order_date).getTime()) / (1000 * 60 * 60 * 24))
        if (diff >= 0) v.leadtimeActual.push(diff)
      }

      // Unpaid
      if (!r.pay_date) {
        v.unpaidAmount += r.totalRCAll || 0
        v.unpaidCount += 1
      }

      // Credit Notes
      if (r.purchase_credit_status) {
        v.creditNotes.push({
          reason: r.purchase_credit_reason,
          amount: r.purchase_credit_difference_amount || r.purchase_credit_reduce_amount || 0,
        })
      }

      // Debit Notes
      if (r.purchase_debit_status) {
        v.debitNotes.push({
          reason: r.purchase_debit_reason,
          amount: r.purchase_debit_difference_amount || 0,
        })
      }
    }

    // Process Orders (PO)
    for (const o of orders) {
      const v = getVendor(o.supplierName || '')
      v.poCount += 1
      v.poTotal += o.totalAmount || 0
    }

    // Process Sales - map to vendor via itemcode
    const saleByProduct = new Map<string, number>()
    for (const s of sales) {
      const code = s.code_product || ''
      saleByProduct.set(code, (saleByProduct.get(code) || 0) + (s.qty || 0))
    }

    // Map itemcode → vendor(s)
    const itemVendorMap = new Map<string, string>()
    for (const rc of rcItems) {
      if (rc.itemcode && rc.namevender) {
        itemVendorMap.set(rc.itemcode, (rc.namevender || '').trim())
      }
    }

    // Assign sales to vendors
    for (const [code, qty] of saleByProduct) {
      const vendorName = itemVendorMap.get(code)
      if (vendorName && vendorMap.has(vendorName)) {
        const v = vendorMap.get(vendorName)
        v.salesByItem.set(code, (v.salesByItem.get(code) || 0) + qty)
      }
    }

    // Process current stock - expiry items
    const now = new Date()
    for (const s of currentStock) {
      const vendorName = (s.namevender || 'ไม่ระบุผู้ขาย').trim()
      if (vendorMap.has(vendorName)) {
        const v = vendorMap.get(vendorName)
        if (s.dateExp) {
          const daysLeft = Math.ceil((new Date(s.dateExp).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (daysLeft <= 180) {
            v.expiryItems.push({
              itemcode: s.itemcode,
              itemName: s.itemName,
              lot: s.lot,
              dateExp: s.dateExp,
              balance: s.balance,
              daysLeft,
              value: (s.balance || 0) * lotUnitCost(s),
            })
          }
        }
      }
    }

    // Previous period comparison — ยอดงวดก่อนจากหัวบิล (เงินสุทธิ) ให้เทียบแบบเดียวกับงวดปัจจุบัน
    const prevCodeVendorName = new Map<string, string>()
    for (const r of prevReceives) {
      if (r.orderfull) prevCodeVendorName.set(r.orderfull, (r.names || '').trim())
      const key = (r.names || 'ไม่ระบุผู้ขาย').trim()
      if (vendorMap.has(key)) {
        vendorMap.get(key).prevTotal += r.totalRCAll || 0
      }
    }
    for (const rc of prevRcItems) {
      const key = prevCodeVendorName.get(rc.codenames || '') || (rc.namevender || 'ไม่ระบุผู้ขาย').trim()
      if (vendorMap.has(key)) {
        const v = vendorMap.get(key)
        // ต้องใช้ฐานเดียวกับ itemMargins ด้านล่าง (ทุนสุทธิ) ไม่งั้น costChange จะเทียบคนละหน่วยวัด
        if (rc.itemcode && rc.newCost) {
          v.prevCostMap.set(rc.itemcode, lotUnitCost(rc))
        }
      }
    }

    // Products lookup
    const productMap = new Map<string, any>()
    for (const p of products) {
      productMap.set(p.code || '', p)
    }

    // Current stock by itemcode
    const stockByItem = new Map<string, number>()
    for (const s of currentStock) {
      const code = s.itemcode || ''
      stockByItem.set(code, (stockByItem.get(code) || 0) + (s.balance || 0))
    }

    // ==================== BUILD RESPONSE ====================

    const grandTotal = Array.from(vendorMap.values()).reduce((s, v) => s + v.totalPurchase, 0)

    const vendorResults = Array.from(vendorMap.values())
      .sort((a, b) => b.totalPurchase - a.totalPurchase)
      .map(v => {
        // Lead time stats
        const avgLeadtime = v.leadtimeActual.length > 0
          ? Math.round(v.leadtimeActual.reduce((s: number, n: number) => s + n, 0) / v.leadtimeActual.length)
          : null
        const onTimeCount = v.leadtimeActual.filter((d: number) => d <= (v.leadtime || 999)).length
        const onTimeRate = v.leadtimeActual.length > 0
          ? Math.round((onTimeCount / v.leadtimeActual.length) * 100)
          : null

        // Growth
        const growth = v.prevTotal > 0
          ? Math.round(((v.totalPurchase - v.prevTotal) / v.prevTotal) * 100)
          : null

        // Margin analysis - top items
        const itemMargins = v.items.map((item: any) => {
          const product = productMap.get(item.itemcode || '')
          const sellingPrice = product?.price || 0
          const cost = lotUnitCost(item)
          const margin = sellingPrice > 0 ? Math.round(((sellingPrice - cost) / sellingPrice) * 100) : 0
          const salesQty = saleByProduct.get(item.itemcode || '') || 0
          return {
            itemcode: item.itemcode,
            itemName: item.itemName,
            cost,
            sellingPrice,
            margin,
            qty: item.qty || 0,
            totalcost: item.totalcost || 0,
            salesQty,
            unit: item.unit,
          }
        })

        // Deduplicate items (sum qty/total for same itemcode)
        const itemMap = new Map<string, any>()
        for (const m of itemMargins) {
          if (itemMap.has(m.itemcode)) {
            const existing = itemMap.get(m.itemcode)
            existing.qty += m.qty
            existing.totalcost += m.totalcost
          } else {
            itemMap.set(m.itemcode, { ...m })
          }
        }
        const uniqueItems = Array.from(itemMap.values())

        // Low margin items (< 15%)
        const lowMarginItems = uniqueItems
          .filter(m => m.margin < 15 && m.sellingPrice > 0)
          .sort((a, b) => a.margin - b.margin)
          .slice(0, 10)

        // Top purchased items
        const topPurchased = [...uniqueItems]
          .sort((a, b) => b.totalcost - a.totalcost)
          .slice(0, 10)

        // Top sold items from this vendor
        const topSold = [...uniqueItems]
          .filter(m => m.salesQty > 0)
          .sort((a, b) => b.salesQty - a.salesQty)
          .slice(0, 10)

        // Price changes from previous period
        const priceChanges = uniqueItems
          .filter(m => {
            const prevCost = v.prevCostMap.get(m.itemcode)
            return prevCost !== undefined && prevCost !== m.cost
          })
          .map(m => ({
            ...m,
            prevCost: v.prevCostMap.get(m.itemcode),
            costChange: m.cost - (v.prevCostMap.get(m.itemcode) || 0),
          }))

        // Credit/Debit summary
        const creditTotal = v.creditNotes.reduce((s: number, n: any) => s + (n.amount || 0), 0)
        const debitTotal = v.debitNotes.reduce((s: number, n: any) => s + (n.amount || 0), 0)

        // Expiry summary
        const expiryExpired = v.expiryItems.filter((e: any) => e.daysLeft <= 0)
        const expiry90 = v.expiryItems.filter((e: any) => e.daysLeft > 0 && e.daysLeft <= 90)
        const expiry180 = v.expiryItems.filter((e: any) => e.daysLeft > 90 && e.daysLeft <= 180)
        const expiryValue = v.expiryItems.reduce((s: number, e: any) => s + (e.value || 0), 0)

        // Vendor Scorecard
        // Price (25): compare avg margin with all vendors
        const avgMargin = uniqueItems.length > 0
          ? uniqueItems.reduce((s, m) => s + m.margin, 0) / uniqueItems.length : 0
        const priceScore = Math.min(25, Math.round((avgMargin / 100) * 25))

        // Quality/Shelf Life (20): fewer expiry items = better
        const expiryRatio = v.items.length > 0
          ? 1 - (v.expiryItems.length / Math.max(v.items.length, 1)) : 1
        const qualityScore = Math.round(expiryRatio * 20)

        // Delivery (20): on-time rate
        const deliveryScore = onTimeRate !== null ? Math.round((onTimeRate / 100) * 20) : 15

        // Credit terms (15): based on having reasonable leadtime
        const creditScore = v.unpaidCount === 0 ? 15 : Math.max(5, 15 - v.unpaidCount)

        // Variety (10): number of SKUs
        const varietyScore = Math.min(10, Math.round((v.skuSet.size / Math.max(1, products.length)) * 100))

        // Returns (10): fewer credit notes = better
        const returnScore = Math.max(0, 10 - v.creditNotes.length * 2)

        const totalScore = priceScore + qualityScore + deliveryScore + creditScore + varietyScore + returnScore

        return {
          name: v.name,
          code: v.code,
          tel: v.tel,
          email: v.email,
          leadtimeSetting: v.leadtime,
          // Purchase summary
          totalPurchase: Math.round(v.totalPurchase * 100) / 100,
          totalDiscount: Math.round((v.totalDiscount + v.totalFree) * 100) / 100,
          totalVat: Math.round(v.totalVat * 100) / 100,
          receiveCount: v.receiveCount,
          skuCount: v.skuSet.size,
          sharePercent: grandTotal > 0 ? Math.round((v.totalPurchase / grandTotal) * 1000) / 10 : 0,
          growth,
          prevTotal: Math.round(v.prevTotal * 100) / 100,
          // PO
          poCount: v.poCount,
          poTotal: Math.round(v.poTotal * 100) / 100,
          // Lead time
          avgLeadtime,
          onTimeRate,
          deliveryCount: v.leadtimeActual.length,
          // Payment
          unpaidAmount: Math.round(v.unpaidAmount * 100) / 100,
          unpaidCount: v.unpaidCount,
          // Credit/Debit
          creditNoteCount: v.creditNotes.length,
          creditNoteTotal: Math.round(creditTotal * 100) / 100,
          debitNoteCount: v.debitNotes.length,
          debitNoteTotal: Math.round(debitTotal * 100) / 100,
          // Margin
          avgMargin: Math.round(avgMargin),
          lowMarginItems,
          // Items
          topPurchased,
          topSold,
          priceChanges,
          // Expiry
          expiryExpiredCount: expiryExpired.length,
          expiry90Count: expiry90.length,
          expiry180Count: expiry180.length,
          expiryValue: Math.round(expiryValue * 100) / 100,
          expiryItems: v.expiryItems.sort((a: any, b: any) => a.daysLeft - b.daysLeft).slice(0, 20),
          // Scorecard
          scorecard: {
            price: priceScore,
            quality: qualityScore,
            delivery: deliveryScore,
            credit: creditScore,
            variety: varietyScore,
            returns: returnScore,
            total: totalScore,
          },
        }
      })

    // Summary stats
    const summary = {
      totalVendors: vendorResults.length,
      grandTotal: Math.round(grandTotal * 100) / 100,
      totalPO: orders.length,
      totalReceive: receives.length,
      totalUnpaid: Math.round(vendorResults.reduce((s, v) => s + v.unpaidAmount, 0) * 100) / 100,
      totalCreditNotes: vendorResults.reduce((s, v) => s + v.creditNoteCount, 0),
      totalExpiryItems: vendorResults.reduce((s, v) => s + v.expiryExpiredCount + v.expiry90Count + v.expiry180Count, 0),
    }

    return Response.json({ summary, vendors: vendorResults })
  } catch (error: any) {
    console.error('Vendor analysis error:', error)
    return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
