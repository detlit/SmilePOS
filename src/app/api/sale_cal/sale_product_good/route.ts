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
    
    const startDate = new Date(createDate + "T00:00:00.000+07:00");
    const endDate = new Date(createDate + "T23:59:59.999+07:00");
    
    const prisma = await getPrisma();
    
    // Use groupBy to aggregate at database level - much faster
    const grouped = await prisma.sale.groupBy({
      by: ['code_product', 'name_product'],
      where: {
        company,
        statuss: "OK",
        createDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        total: true,
        qty: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: 20, // Only get top 20
    });

    const ranksale = grouped.map((item: any) => ({
      Id: item.code_product,
      name: item.name_product,
      total: item._sum.total || 0,
      qty: item._sum.qty || 0,
    }));

    return Response.json(ranksale)
}