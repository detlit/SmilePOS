import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const company = searchParam.get('company')
  const month = searchParam.get('month') || '' // YYYY-MM format

  if (!company || !month) {
    return Response.json({ error: 'Missing company or month parameter' }, { status: 400 })
  }

  const [year, mon] = month.split('-').map(Number)
  const startDate = new Date(Date.UTC(year, mon - 1, 0, 17, 0, 0, 0))
  const endDate = new Date(Date.UTC(year, mon, 0, 16, 59, 59, 999))

  const prisma = await getPrisma();

  const [saleMainRows, saleRows] = await Promise.all([
    prisma.saleMain.findMany({
      where: {
        companyall: company,
        createDate: { gte: startDate, lte: endDate },
      },
      orderBy: { id: 'desc' },
    }),
    prisma.sale.findMany({
      where: {
        company,
        createDate: { gte: startDate, lte: endDate },
      },
      orderBy: { id: 'desc' },
    }),
  ])

  return Response.json({ saleMain: saleMainRows, sales: saleRows })
}
