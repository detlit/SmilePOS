import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

// Combined API: fetches all small lookup data for the sale page in a single request
// Replaces 15 separate API calls with 1, reducing HTTP overhead dramatically
export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const company = searchParam.get('company')
  const prisma = await getPrisma();

  const orderAsc = { id: 'asc' as const }

  const [
    labeldata,
    indicator,
    timeL,
    useL,
    timeuseL,
    keepL,
    remarkL,
    employee,
    interaction,
    store,
    settingLabel,
    settingPoint,
    promotion,
    productPromotion,
    giftlist,
    customer,
  ] = await Promise.all([
    prisma.labeldata.findMany({ where: { company }, orderBy: orderAsc }),
    prisma.indicator.findMany({ where: { company }, orderBy: orderAsc }),
    prisma.timeL.findMany({ where: { company }, orderBy: orderAsc }),
    prisma.useL.findMany({ where: { company }, orderBy: orderAsc }),
    prisma.timeUseL.findMany({ where: { company }, orderBy: orderAsc }),
    prisma.keepL.findMany({ where: { company }, orderBy: orderAsc }),
    prisma.remarkL.findMany({ where: { company }, orderBy: orderAsc }),
    prisma.settingEmployee.findMany({ where: { id_company: Number(company) || 0 }, orderBy: orderAsc }),
    prisma.interaction.findMany({ where: { company }, orderBy: orderAsc }),
    prisma.settingStore.findMany({ where: { company }, orderBy: orderAsc }),
    prisma.settingLabel.findMany({ where: { company }, orderBy: orderAsc }),
    prisma.settingpoint.findMany({ where: { company }, orderBy: orderAsc }),
    prisma.promotion.findMany({ where: { company }, orderBy: orderAsc }),
    (prisma as any).productPromotion.findMany({ where: { company, status: "active" }, orderBy: orderAsc }),
    prisma.gifts.findMany({ where: { company }, orderBy: orderAsc }),
    prisma.customer.findMany({
      where: { company },
      orderBy: orderAsc,
      select: { id: true, code: true, names: true, totalPoint: true, levelPrice: true, address: true, numbertax: true, tel: true, congenitalDisease: true, drugallergys: true }
    }),
  ])

  return Response.json({
    labeldata,
    indicator,
    timeL,
    useL,
    timeuseL,
    keepL,
    remarkL,
    employee,
    interaction,
    store,
    settingLabel,
    settingPoint,
    promotion,
    productPromotion,
    giftlist,
    customer,
  })
}
