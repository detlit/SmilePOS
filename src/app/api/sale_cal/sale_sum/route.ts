import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}


export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const company = searchParam.get('company')
  const createDate = searchParam.get('createDate') || ''

  // createDate is expected in YYYY-MM-DD local format
  const startDate = new Date(createDate + "T00:00:00.000+07:00");
  const endDate = new Date(createDate + "T23:59:59.999+07:00");

  const prisma = await getPrisma();

  // Use parallel queries with aggregate for better performance
  const [saleAgg, mainAllAgg, mainCashAgg, mainPaymentAgg, mainSplitAgg, rcAgg] = await Promise.all([
    // Aggregate cost from sale (exclude cancelled bills)
    prisma.sale.aggregate({
      where: {
        company,
        statuss: "OK",
        createDate: { gte: startDate, lte: endDate },
        salemain: { statussall: "" },
      },
      _sum: { cost: true },
    }),
    // Aggregate revenue (sumtotal) from SaleMain (after discount & reward)
    prisma.saleMain.aggregate({
      where: {
        companyall: company,
        statussall: "",
        createDate: { gte: startDate, lte: endDate },
      },
      _sum: { sumtotal: true },
      _count: true,
    }),
    // Aggregate cash payments
    prisma.saleMain.aggregate({
      where: {
        companyall: company,
        statussall: "",
        pay: "เงินสด",
        createDate: { gte: startDate, lte: endDate },
      },
      _sum: { sumtotal: true },
      _count: true,
    }),
    // Aggregate transfer payments
    prisma.saleMain.aggregate({
      where: {
        companyall: company,
        statussall: "",
        pay: "โอน",
        createDate: { gte: startDate, lte: endDate },
      },
      _sum: { sumtotal: true },
      _count: true,
    }),
    // Aggregate split payments (เงินสด+โอน)
    prisma.saleMain.aggregate({
      where: {
        companyall: company,
        statussall: "",
        pay: "เงินสด+โอน",
        createDate: { gte: startDate, lte: endDate },
      },
      _sum: { sumtotal: true, cashAmount: true, transferAmount: true } as any,
      _count: true,
    }),
    // Aggregate RC items
    prisma.rCitemlist.aggregate({
      where: {
        company,
        dateRC: { gte: startDate, lte: endDate },
      },
      _sum: { totalcost: true },
      _count: true,
    }),
  ]);

  const costdaily = Number(saleAgg._sum.cost) || 0
  // Calculate revenue from SaleMain.sumtotal (net after discount & reward)
  const sumdaily = Number(mainAllAgg._sum?.sumtotal) || 0
  // Count bills from SaleMain aggregate
  const countdaily = Number(mainAllAgg._count) || 0
  const sumdailyRC = Number(rcAgg._sum.totalcost) || 0
  const countdailyRC = rcAgg._count || 0

  const splitbill = Number(mainSplitAgg._count) || 0
  const splitCash = Number((mainSplitAgg._sum as any)?.cashAmount) || 0
  const splitTransfer = Number((mainSplitAgg._sum as any)?.transferAmount) || 0

  const cashbill = (Number(mainCashAgg._count) || 0) + splitbill
  const cash = (Number(mainCashAgg._sum?.sumtotal) || 0) + splitCash
  const paymentbill = (Number(mainPaymentAgg._count) || 0) + splitbill
  const payment = (Number(mainPaymentAgg._sum?.sumtotal) || 0) + splitTransfer

  const bathperBill = countdaily > 0 ? sumdaily / countdaily : 0
  const profitdaily = sumdaily - costdaily
  const pprofit = sumdaily > 0 ? (((sumdaily - costdaily) / sumdaily) * 100).toFixed(1) : 0

  const summary = [
    {
      revenue: sumdaily,
      bill: countdaily,
      sumRC: sumdailyRC,
      itemRC: countdailyRC,
      Bahtperbill: bathperBill,
      cost: costdaily,
      profit: profitdaily,
      perprofit: pprofit,
      cashbill: cashbill,
      paymentbill: paymentbill,
      cash: cash,
      payment: payment,
      splitbill: splitbill,
      splitCash: splitCash,
      splitTransfer: splitTransfer
    }
  ]

  return Response.json(summary)
}
