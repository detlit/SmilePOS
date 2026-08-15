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
    return Response.json([])
  }

  const prisma = await getPrisma();

  // โหมดราคาทุน: "latest" (ทุนล่าสุด, ค่าเริ่มต้น) หรือ "average" (ทุนเฉลี่ยของ newCost ทุกล็อต)
  const storeSetting = await prisma.settingStore.findFirst({ where: { company }, select: { costPriceMode: true } as any }) as any
  const costPriceMode = String(storeSetting?.costPriceMode) === 'average' ? 'average' : 'latest'

  // 1. Get all RC items with balance > 0, grouped by itemcode
  const rcItems = await prisma.rCitemlist.findMany({
    where: {
      company,
      balance: { gt: 0 },
    },
    select: {
      itemcode: true,
      itemName: true,
      dateRC: true,
      newCost: true,
      netCost: true,
      balance: true,
      lot: true,
    },
    orderBy: { dateRC: 'asc' },
  })

  if (rcItems.length === 0) {
    return Response.json([])
  }

  // 2. Group by itemcode
  const productMap = new Map<string, {
    itemcode: string
    itemName: string
    totalBalance: number
    oldestLotDate: Date | null
    oldestLot: string
    latestCost: number
  }>()

  for (const rc of rcItems) {
    const code = rc.itemcode || ''
    if (!code) continue

    const existing = productMap.get(code)
    if (existing) {
      existing.totalBalance += Number(rc.balance || 0)
      // oldest lot
      if (rc.dateRC && (!existing.oldestLotDate || rc.dateRC < existing.oldestLotDate)) {
        existing.oldestLotDate = rc.dateRC
        existing.oldestLot = rc.lot || ''
      }
      // latest cost (last entry since ordered asc)
      // เกณฑ์ "ล็อตนี้มีทุนไหม" ยังใช้ newCost เหมือนเดิม เปลี่ยนแค่ค่าที่เก็บเป็นทุนสุทธิ
      if (rc.newCost) {
        existing.latestCost = lotUnitCost(rc)
      }
    } else {
      productMap.set(code, {
        itemcode: code,
        itemName: rc.itemName || '',
        totalBalance: Number(rc.balance || 0),
        oldestLotDate: rc.dateRC || null,
        oldestLot: rc.lot || '',
        latestCost: lotUnitCost(rc),
      })
    }
  }

  // Filter out products with totalBalance <= 0
  const products = Array.from(productMap.values()).filter(p => p.totalBalance > 0)
  const itemcodes = products.map(p => p.itemcode)

  // ต้นทุนเฉลี่ย (ค่าเฉลี่ยอย่างง่ายของทุนสุทธิทุกล็อต) ต่อรหัสสินค้า — ใช้เมื่อโหมด = average
  //
  // เดิมใช้ groupBy + _avg ของ newCost แต่ทุนสุทธิเป็นค่าที่ต้อง fallback ต่อแถว (netCost ?? คำนวณสด)
  // ซึ่ง _avg ฝั่ง Prisma ทำไม่ได้ — และถ้าเปลี่ยนไป _avg netCost ตรง ๆ ล็อตที่ทุนเป็น 0
  // (netCost คำนวณไม่ได้ = NULL) จะหลุดออกจากตัวหาร ทำให้ค่าเฉลี่ยสูงขึ้นโดยไม่ตั้งใจ
  // จึงดึงแถวมาเฉลี่ยเองโดยคงเงื่อนไขคัดแถวเดิมไว้ทุกประการ
  const avgCostMap = new Map<string, number>()
  if (costPriceMode === 'average') {
    const avgRows = await prisma.rCitemlist.findMany({
      where: { company, itemcode: { in: itemcodes }, newCost: { not: null } },
      select: { itemcode: true, newCost: true, netCost: true, qty: true, totalcost: true, discountbaht: true, freebaht: true },
    })
    const acc = new Map<string, { sum: number; count: number }>()
    avgRows.forEach(r => {
      if (!r.itemcode) return
      const entry = acc.get(r.itemcode) || { sum: 0, count: 0 }
      entry.sum += lotUnitCost(r)
      entry.count += 1
      acc.set(r.itemcode, entry)
    })
    acc.forEach((v, code) => avgCostMap.set(code, v.count > 0 ? v.sum / v.count : 0))
  }

  // 3. Get last sale date for each product (batch query)
  const sales = await prisma.sale.findMany({
    where: {
      company,
      code_product: { in: itemcodes },
      statuss: 'OK',
    },
    select: {
      code_product: true,
      createDate: true,
    },
    orderBy: { createDate: 'desc' },
  })

  // Build map of last sale date per product
  const lastSaleMap = new Map<string, Date>()
  for (const sale of sales) {
    const code = sale.code_product || ''
    if (code && sale.createDate && !lastSaleMap.has(code)) {
      lastSaleMap.set(code, sale.createDate)
    }
  }

  // 4. Calculate days idle and build result
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const result = products.map(p => {
    const lastSaleDate = lastSaleMap.get(p.itemcode) || null
    const oldestLotDate = p.oldestLotDate

    // Reference date: the later of lastSaleDate and oldestLotDate, or oldestLotDate if no sale
    let referenceDate: Date | null = null
    if (lastSaleDate && oldestLotDate) {
      referenceDate = lastSaleDate > oldestLotDate ? lastSaleDate : oldestLotDate
    } else if (lastSaleDate) {
      referenceDate = lastSaleDate
    } else {
      referenceDate = oldestLotDate
    }

    let daysIdle = 0
    if (referenceDate) {
      const ref = new Date(referenceDate)
      ref.setHours(0, 0, 0, 0)
      daysIdle = Math.floor((today.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24))
    }

    const avgCost = avgCostMap.get(p.itemcode) || 0
    const effectiveCost = costPriceMode === 'average' && avgCost > 0 ? avgCost : p.latestCost
    const stockValue = p.totalBalance * effectiveCost

    return {
      itemcode: p.itemcode,
      itemName: p.itemName,
      balance: p.totalBalance,
      cost: effectiveCost,
      stockValue: Math.round(stockValue * 100) / 100,
      oldestLot: p.oldestLot,
      oldestLotDate: oldestLotDate ? oldestLotDate.toISOString().split('T')[0] : '',
      lastSaleDate: lastSaleDate ? lastSaleDate.toISOString().split('T')[0] : 'ไม่เคยขาย',
      daysIdle,
    }
  })
    .filter(item => item.daysIdle >= 60)
    .sort((a, b) => b.daysIdle - a.daysIdle)

  return Response.json(result)
}
