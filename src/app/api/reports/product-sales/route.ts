import { NextRequest } from 'next/server'
import { buildBulkStockBalance, saleStockQty } from '@/lib/stockBalance'

export const dynamic = 'force-dynamic'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

/**
 * รายงานขายตามสินค้า (ช่วงวัน/เดือน)
 * รวมยอดขายรายสินค้า (จัดกลุ่มตาม Barcode เหมือนหน้าสรุปยอดคงเหลือ) พร้อมสต๊อก:
 *   สต๊อกน่าจะเหลือ = ยอดคงเหลือมาตรฐานปัจจุบัน (รับ − ขาย − โอนออก + รับโอน + ปรับยอด)
 *   สต๊อกก่อนขาย   = สต๊อกน่าจะเหลือ + จำนวนขายในช่วง (คงสูตร ก่อนขาย − ขาย = เหลือ)
 * และสรุปส่วนลดท้ายบิล (totalall − sumtotal ของบิลที่ไม่ยกเลิก) สำหรับแถวท้ายรายงาน
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const company = searchParams.get('company') || ""
  const startDateParam = searchParams.get('startDate') || ""
  const endDateParam = searchParams.get('endDate') || ""

  if (!company || !startDateParam || !endDateParam) {
    return Response.json({ error: 'missing company/startDate/endDate' }, { status: 400 })
  }

  // ขอบเขตวันแบบเวลาไทย (Asia/Bangkok, UTC+7)
  const startDate = new Date(`${startDateParam}T00:00:00.000+07:00`)
  const endDate = new Date(`${endDateParam}T23:59:59.999+07:00`)

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return Response.json({ error: 'invalid date format' }, { status: 400 })
  }

  try {
    const prisma = await getPrisma()

    const [salesInRange, saleMainInRange, datalist, rcItems, allSales, stockTx] = await Promise.all([
      // รายการขายในช่วง (เฉพาะที่ไม่ยกเลิก)
      prisma.sale.findMany({
        where: { company, statuss: 'OK', createDate: { gte: startDate, lte: endDate } },
        select: {
          code_product: true, name_product: true, barcode: true, unit: true,
          qty: true, subqty: true, cost: true, price: true, discount: true, total: true,
        },
      }),
      // บิลในช่วง — ใช้สรุปส่วนลดท้ายบิล/จำนวนบิล
      prisma.saleMain.findMany({
        where: { companyall: company, createDate: { gte: startDate, lte: endDate } },
        select: { discount: true, memberDiscount: true, usereward: true, sumtotal: true, totalall: true, statussall: true },
      }),
      // ทะเบียนสินค้า — ใช้ชื่อ/บาร์โค้ด/หน่วย และจัดกลุ่ม Barcode
      prisma.datalist.findMany({
        where: { company },
        select: { id: true, code: true, ProductName: true, Barcode: true, Unit: true, group: true },
      }),
      // ล็อตรับเข้าทั้งหมด — คำนวณยอดรับ (สูตรเดียวกับหน้าสรุปยอดคงเหลือ)
      prisma.rCitemlist.findMany({
        where: { company },
        select: { itemcode: true, Barcode: true, qty: true, freebaht: true, statuss: true },
      }),
      // ยอดขายทั้งหมด (statuss = OK) — คำนวณยอดคงเหลือปัจจุบัน
      prisma.sale.findMany({
        where: { company, statuss: 'OK' },
        select: { barcode: true, code_product: true, qty: true, subqty: true },
      }),
      // โอน/ปรับยอด
      prisma.stockTransaction.findMany({
        where: { company },
        select: { itemcode: true, transaction_type: true, quantity_change: true },
      }),
    ])

    // ---- ยอดคงเหลือปัจจุบันต่อกลุ่ม = รับ − ขาย − โอนออก + รับโอน + ปรับยอด ----
    // ใช้ตัวคำนวณกลางตัวเดียวกับหน้า "สรุปยอดคงเหลือ" (src/lib/stockBalance.ts)
    const bulkBalance = buildBulkStockBalance({
      products: datalist,
      lots: rcItems,
      sales: allSales,
      transactions: stockTx,
    })
    const groupKeyOf = bulkBalance.groupKeyOf
    const stockQtyOf = saleStockQty

    // ---- ข้อมูลทะเบียนสินค้าต่อกลุ่ม (ใช้ชื่อ/บาร์โค้ด/หน่วยตัวแรกที่พบ) ----
    const productByGroup = new Map<string, { code: string; barcode: string; name: string; unit: string; group: string }>()
    datalist.forEach(d => {
      const key = groupKeyOf(d.Barcode, d.code)
      if (!productByGroup.has(key)) {
        productByGroup.set(key, {
          code: d.code || '',
          barcode: (d.Barcode || '').trim(),
          name: d.ProductName || '',
          unit: d.Unit || '',
          group: d.group || '',
        })
      }
    })

    // ---- รวมยอดขายในช่วงต่อกลุ่มสินค้า ----
    type Agg = {
      qtySold: number      // หน่วยสต๊อก (subqty logic) — ใช้คู่กับคอลัมน์สต๊อก
      gross: number        // ขายได้ = qty × price (ก่อนหักส่วนลดสินค้า)
      revenue: number      // รายรับ = Σ total (หลังหักส่วนลดสินค้า)
      cost: number         // ต้นทุน = Σ cost/หน่วย × qty
      billItemCount: number
      fallbackName: string
      fallbackUnit: string
      fallbackCode: string
      fallbackBarcode: string
    }
    const aggByGroup = new Map<string, Agg>()
    salesInRange.forEach(s => {
      const key = groupKeyOf(s.barcode, s.code_product)
      const agg = aggByGroup.get(key) || {
        qtySold: 0, gross: 0, revenue: 0, cost: 0, billItemCount: 0,
        fallbackName: '', fallbackUnit: '', fallbackCode: '', fallbackBarcode: '',
      }
      const qty = Number(s.qty || 0)
      agg.qtySold += stockQtyOf(s)
      agg.gross += qty * Number(s.price || 0)
      agg.revenue += Number(s.total || 0)
      agg.cost += qty * Number(s.cost || 0)
      agg.billItemCount += 1
      if (!agg.fallbackName && s.name_product) agg.fallbackName = s.name_product
      if (!agg.fallbackUnit && s.unit) agg.fallbackUnit = s.unit
      if (!agg.fallbackCode && s.code_product) agg.fallbackCode = s.code_product
      if (!agg.fallbackBarcode && s.barcode) agg.fallbackBarcode = (s.barcode || '').trim()
      aggByGroup.set(key, agg)
    })

    // ---- สร้างแถวรายงาน (เฉพาะสินค้าที่มีการขายในช่วง) ----
    const rows = Array.from(aggByGroup.entries()).map(([key, agg]) => {
      const info = productByGroup.get(key)
      const stockAfter = Math.round(bulkBalance.balanceByKey(key) * 100) / 100
      const qtySold = Math.round(agg.qtySold * 100) / 100
      const revenue = agg.revenue
      const discount = agg.gross - agg.revenue // ส่วนลดสินค้า = ขายได้ − รายรับ (สอดคล้องกันเสมอ)
      return {
        code: info?.code || agg.fallbackCode,
        barcode: info?.barcode || agg.fallbackBarcode,
        name: info?.name || agg.fallbackName,
        unit: info?.unit || agg.fallbackUnit,
        group: info?.group || '',
        stockBefore: Math.round((stockAfter + qtySold) * 100) / 100,
        qtySold,
        stockAfter,
        gross: agg.gross,
        discount,
        revenue,
        cost: agg.cost,
        profit: revenue - agg.cost,
        billItemCount: agg.billItemCount,
      }
    }).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'th'))

    // ---- สรุปบิล: ส่วนลดท้ายบิล (รวมส่วนลดสมาชิก/ตัดแต้ม) ของบิลที่ไม่ยกเลิก ----
    let endBillDiscount = 0
    let billCount = 0
    let canceledCount = 0
    saleMainInRange.forEach(m => {
      if (m.statussall === 'ยกเลิก') { canceledCount += 1; return }
      billCount += 1
      const totalall = Number(m.totalall || 0)
      const sumtotal = Number(m.sumtotal || 0)
      const diff = totalall - sumtotal
      if (Number.isFinite(diff) && diff > 0) endBillDiscount += diff
    })

    return Response.json({
      rows,
      summary: { endBillDiscount, billCount, canceledCount },
    })
  } catch (error) {
    console.error('Error in product-sales report:', error)
    return Response.json({ error: 'Failed to fetch product sales report' }, { status: 500 })
  }
}
