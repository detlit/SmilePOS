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
  const sort = searchParam.get('sort') || 'desc'

  // createDate is expected in YYYY-MM-DD local format
  const startDate = new Date(createDate + "T00:00:00.000+07:00");
  const endDate = new Date(createDate + "T23:59:59.999+07:00");

  const prisma = await getPrisma();
  const get = await prisma.sale.findMany({
    where:
    {
      company,
      createDate: {
        gte: startDate,
        lte: endDate,
      },
    }
    ,
    orderBy: {
      id: sort,  //เรียงลำดับ
    } as any,

  })
  return Response.json(get)
}


