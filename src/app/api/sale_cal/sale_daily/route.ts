import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const company = searchParam.get('company')
  const createDate = searchParam.get('createDate') || '' // format YYYY-MM

  const [year, month] = createDate.split('-').map(Number);
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const startDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000+07:00`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}T23:59:59.999+07:00`;

  const prisma = await getPrisma();

  // Aggregate by day at the database level (SaleMain.sumtotal = total - discount - reward)
  const rows = await prisma.$queryRawUnsafe(`
    SELECT EXTRACT(DAY FROM sm."createDate" AT TIME ZONE 'Asia/Bangkok') as day, SUM(sm."sumtotal") as value
    FROM "SaleMain" sm
    WHERE sm."companyall" = $1 AND sm."statussall" = '' AND sm."createDate" >= $2::timestamp AND sm."createDate" <= $3::timestamp
    GROUP BY EXTRACT(DAY FROM sm."createDate" AT TIME ZONE 'Asia/Bangkok')
  `, company, startDate, endDate) as { day: number; value: number }[];

  // Build array of days with sales
  const salesByDay = new Map<number, number>();
  for (const row of rows) {
    salesByDay.set(Number(row.day), Number(row.value) || 0);
  }

  // Build result array for all days
  const days = [];
  for (let day = 1; day <= lastDayOfMonth; day++) {
    const dateStr = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    days.push({
      date: dateStr,
      value: salesByDay.get(day) || 0,
    });
  }

  return Response.json(days);
}
