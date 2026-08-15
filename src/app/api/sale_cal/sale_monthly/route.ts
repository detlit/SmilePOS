import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const company = searchParam.get('company')
  const createDate = searchParam.get('createDate') || '' // format YYYY (year only)

  const year = Number(createDate);
  const startDate = `${year}-01-01T00:00:00.000+07:00`;
  const endDate = `${year}-12-31T23:59:59.999+07:00`;

  const prisma = await getPrisma();

  // Aggregate by month at the database level (SaleMain.sumtotal = total - discount - reward)
  const rows = await prisma.$queryRawUnsafe(`
    SELECT EXTRACT(MONTH FROM sm."createDate" AT TIME ZONE 'Asia/Bangkok') as month, SUM(sm."sumtotal") as value
    FROM "SaleMain" sm
    WHERE sm."companyall" = $1 AND sm."statussall" = '' AND sm."createDate" >= $2::timestamp AND sm."createDate" <= $3::timestamp
    GROUP BY EXTRACT(MONTH FROM sm."createDate" AT TIME ZONE 'Asia/Bangkok')
  `, company, startDate, endDate) as { month: number; value: number }[];

  const salesByMonth = new Map<number, number>();
  for (const row of rows) {
    salesByMonth.set(Number(row.month) - 1, Number(row.value) || 0); // 0-indexed
  }

  // Month names
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const yearSuffix = String(year).slice(2, 4);

  // Build result array for all 12 months
  const months = monthNames.map((name, index) => ({
    month: `${name}-${yearSuffix}`,
    value: salesByMonth.get(index) || 0,
  }));

  return Response.json(months);
}
