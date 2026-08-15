import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const company = searchParams.get('company') || ""
  const person = searchParams.get('person') || ""
  const startDateParam = searchParams.get('startDate') || ""
  const endDateParam = searchParams.get('endDate') || ""

  if (!company || !startDateParam || !endDateParam) {
    return Response.json({ error: 'missing company/startDate/endDate' }, { status: 400 })
  }

  const startDate = new Date(`${startDateParam}T00:00:00.000+07:00`)
  const endDate = new Date(`${endDateParam}T23:59:59.999+07:00`)

  const prisma = await getPrisma()

  const where: any = {
    company,
    statuss: "OK",
    createDate: { gte: startDate, lte: endDate },
  }
  if (person) where.person = person

  const sales = await prisma.sale.findMany({
    where,
    select: {
      createDate: true,
      code_product: true,
      name_product: true,
      unit: true,
      qty: true,
      cost: true,
      total: true,
      gifts: true,
      person: true,
    },
  })

  const getThaiDateKey = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })

  // ---- Daily breakdown (ยอดขาย, ต้นทุน, กำไร, %กำไร) ----
  const dailyMap = new Map<string, { sale: number; cost: number }>()
  for (const item of sales) {
    if (!item.createDate) continue
    const key = getThaiDateKey(new Date(item.createDate))
    const entry = dailyMap.get(key) || { sale: 0, cost: 0 }
    entry.sale += Number(item.total) || 0
    // Sale.cost เก็บเป็นต้นทุนรวมทั้งบรรทัดแล้ว (qty × ต้นทุนต่อหน่วย ตอนบันทึกบิล)
    // จึงบวกตรง ๆ ห้ามคูณ qty ซ้ำ ให้ตรงกับ pl_report / sale_daily_report
    entry.cost += Number(item.cost) || 0
    dailyMap.set(key, entry)
  }

  const daily: any[] = []
  const cursor = new Date(startDate)
  while (cursor <= endDate) {
    const key = cursor.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    const entry = dailyMap.get(key) || { sale: 0, cost: 0 }
    const profit = entry.sale - entry.cost
    const profitPercent = entry.sale > 0 ? (profit / entry.sale) * 100 : 0
    daily.push({
      date: key,
      sale: entry.sale,
      cost: entry.cost,
      profit,
      profitPercent,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  const totalSale = daily.reduce((sum, d) => sum + d.sale, 0)
  const totalCost = daily.reduce((sum, d) => sum + d.cost, 0)
  const totalProfit = totalSale - totalCost
  const totalProfitPercent = totalSale > 0 ? (totalProfit / totalSale) * 100 : 0
  const activeDays = daily.filter((d) => d.sale > 0).length

  const summary = {
    totalSale,
    totalCost,
    totalProfit,
    totalProfitPercent,
    totalDays: daily.length,
    activeDays,
    avgSalePerDay: activeDays > 0 ? totalSale / activeDays : 0,
    avgProfitPerDay: activeDays > 0 ? totalProfit / activeDays : 0,
  }

  // ---- ค่าหยิบ (picking fee) by product ----
  const pickMap = new Map<string, { code: string; name: string; unit: string; qty: number; gifts: number }>()
  for (const item of sales) {
    const gifts = Number(item.gifts) || 0
    const qty = Number(item.qty) || 0
    if (gifts === 0 && qty === 0) continue
    const key = `${item.code_product || ''}__${item.name_product || ''}`
    const entry = pickMap.get(key) || { code: item.code_product || '', name: item.name_product || '', unit: item.unit || '', qty: 0, gifts: 0 }
    entry.qty += qty
    entry.gifts += gifts
    pickMap.set(key, entry)
  }

  const giftRates = await prisma.gifts.findMany({
    where: { company },
    select: { code_product: true, gift: true },
  })
  const giftRateMap = new Map<string, number>()
  for (const g of giftRates) {
    if (g.code_product) giftRateMap.set(g.code_product, Number(g.gift) || 0)
  }

  const pickItems = Array.from(pickMap.values())
    .map((item) => ({ ...item, giftRate: giftRateMap.get(item.code) ?? 0 }))
    .filter((item) => item.giftRate !== 0)
    .sort((a, b) => b.qty - a.qty)

  const pickSummary = {
    totalQty: pickItems.reduce((sum, item) => sum + item.qty, 0),
    totalGifts: pickItems.reduce((sum, item) => sum + item.gifts, 0),
    uniqueItems: pickItems.length,
  }

  return Response.json({ daily, summary, pickItems, pickSummary })
}
