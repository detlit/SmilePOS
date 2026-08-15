import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams;
  const company = searchParam.get('company') || '';
  const createDate = searchParam.get('createDate') || ''; // YYYY-MM-DD

  if (!company || !createDate) {
    return Response.json({ summary: {}, daily: [], monthly: [], topProducts: [], groupProducts: [] });
  }

  const prisma = await getPrisma();

  const [year, month] = createDate.split('-').map(Number);
  const dayStart = createDate + 'T00:00:00.000+07:00';
  const dayEnd = createDate + 'T23:59:59.999+07:00';
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000+07:00`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${lastDay}T23:59:59.999+07:00`;
  const yearStart = `${year}-01-01T00:00:00.000+07:00`;
  const yearEnd = `${year}-12-31T23:59:59.999+07:00`;

  const [saleSummaryRows, revenueRows, mainSummaryRows, rcSummaryRows, dailyRows, monthlyRows, topProductRows, groupRows] = await Promise.all([
    // 1a. Sale summary for the day (cost from Sale, revenue from SaleMain)
    prisma.$queryRawUnsafe(`
      SELECT COALESCE(SUM(s."cost"), 0) as cost, COUNT(DISTINCT s."id_salemain") as bill
      FROM "Sale" s
      INNER JOIN "SaleMain" sm ON s."id_salemain" = sm."id" AND sm."statussall" = ''
      WHERE s."company" = $1 AND s."statuss" = 'OK' AND s."createDate" >= $2::timestamp AND s."createDate" <= $3::timestamp
    `, company, dayStart, dayEnd) as Promise<any[]>,

    // 1a2. Revenue from SaleMain.sumtotal (after discount & reward)
    prisma.$queryRawUnsafe(`
      SELECT COALESCE(SUM(sm."sumtotal"), 0) as revenue, COUNT(*) as bill
      FROM "SaleMain" sm
      WHERE sm."companyall" = $1 AND sm."statussall" = '' AND sm."createDate" >= $2::timestamp AND sm."createDate" <= $3::timestamp
    `, company, dayStart, dayEnd) as Promise<any[]>,

    // 1b. SaleMain cash/transfer - single scan with conditional aggregation
    prisma.$queryRawUnsafe(`
      SELECT
        COALESCE(SUM(CASE WHEN sm."pay" = 'เงินสด' THEN sm."sumtotal" ELSE 0 END), 0) as cash,
        COALESCE(SUM(CASE WHEN sm."pay" = 'โอน' THEN sm."sumtotal" ELSE 0 END), 0) as payment
      FROM "SaleMain" sm
      WHERE sm."companyall" = $1 AND sm."statussall" = '' AND sm."createDate" >= $2::timestamp AND sm."createDate" <= $3::timestamp
    `, company, dayStart, dayEnd) as Promise<any[]>,

    // 1c. RC summary
    prisma.$queryRawUnsafe(`
      SELECT COALESCE(SUM(rc."totalcost"), 0) as "sumRC", COUNT(*) as "itemRC"
      FROM "RCitemlist" rc
      WHERE rc."company" = $1 AND rc."dateRC" >= $2::timestamp AND rc."dateRC" <= $3::timestamp
    `, company, dayStart, dayEnd) as Promise<any[]>,

    // 2. Daily sales for the month (use SaleMain.sumtotal)
    prisma.$queryRawUnsafe(`
      SELECT EXTRACT(DAY FROM sm."createDate" AT TIME ZONE 'Asia/Bangkok') as day, SUM(sm."sumtotal") as value
      FROM "SaleMain" sm
      WHERE sm."companyall" = $1 AND sm."statussall" = '' AND sm."createDate" >= $2::timestamp AND sm."createDate" <= $3::timestamp
      GROUP BY EXTRACT(DAY FROM sm."createDate" AT TIME ZONE 'Asia/Bangkok')
      ORDER BY day
    `, company, monthStart, monthEnd) as Promise<any[]>,

    // 3. Monthly sales for the year (use SaleMain.sumtotal)
    prisma.$queryRawUnsafe(`
      SELECT EXTRACT(MONTH FROM sm."createDate" AT TIME ZONE 'Asia/Bangkok') as month, SUM(sm."sumtotal") as value
      FROM "SaleMain" sm
      WHERE sm."companyall" = $1 AND sm."statussall" = '' AND sm."createDate" >= $2::timestamp AND sm."createDate" <= $3::timestamp
      GROUP BY EXTRACT(MONTH FROM sm."createDate" AT TIME ZONE 'Asia/Bangkok')
      ORDER BY month
    `, company, yearStart, yearEnd) as Promise<any[]>,

    // 4. Top products for the day
    prisma.$queryRawUnsafe(`
      SELECT s."code_product" as "Id", s."name_product" as name, SUM(s."total") as total, SUM(s."qty") as qty
      FROM "Sale" s
      WHERE s."company" = $1 AND s."statuss" = 'OK' AND s."createDate" >= $2::timestamp AND s."createDate" <= $3::timestamp
      GROUP BY s."code_product", s."name_product"
      ORDER BY total DESC
      LIMIT 20
    `, company, dayStart, dayEnd) as Promise<any[]>,

    // 5. Group products for the day
    prisma.$queryRawUnsafe(`
      SELECT s."cetagory" as "Id", SUM(s."total") as total, SUM(s."qty") as qty
      FROM "Sale" s
      WHERE s."company" = $1 AND s."statuss" = 'OK' AND s."createDate" >= $2::timestamp AND s."createDate" <= $3::timestamp
      GROUP BY s."cetagory"
      ORDER BY total DESC
    `, company, dayStart, dayEnd) as Promise<any[]>,
  ]);

  // Format summary
  const ss = saleSummaryRows[0] || {};
  const rv = revenueRows[0] || {};
  const ms = mainSummaryRows[0] || {};
  const rs = rcSummaryRows[0] || {};
  const revenue = Number(rv.revenue) || 0;
  const cost = Number(ss.cost) || 0;
  const bill = Number(rv.bill) || 0;
  const summary = {
    revenue, bill, cost,
    sumRC: Number(rs.sumRC) || 0,
    itemRC: Number(rs.itemRC) || 0,
    Bahtperbill: bill > 0 ? revenue / bill : 0,
    profit: revenue - cost,
    perprofit: revenue > 0 ? (((revenue - cost) / revenue) * 100).toFixed(1) : 0,
    cash: Number(ms.cash) || 0,
    payment: Number(ms.payment) || 0,
  };

  // Format daily
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dailyMap = new Map<number, number>();
  dailyRows.forEach((r: any) => { dailyMap.set(Number(r.day), Number(r.value) || 0); });
  const daily = [];
  for (let d = 1; d <= lastDay; d++) {
    daily.push({ date: `${String(d).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`, value: dailyMap.get(d) || 0 });
  }

  // Format monthly
  const monthlyMap = new Map<number, number>();
  monthlyRows.forEach((r: any) => { monthlyMap.set(Number(r.month), Number(r.value) || 0); });
  const yearSuffix = String(year).slice(2, 4);
  const monthly = monthNames.map((name, idx) => ({
    month: `${name}-${yearSuffix}`,
    value: monthlyMap.get(idx + 1) || 0,
  }));

  // Format products
  const topProducts = topProductRows.map((r: any) => ({
    Id: r.Id || '', name: r.name || '', total: Number(r.total) || 0, qty: Number(r.qty) || 0,
  }));

  const groupProducts = groupRows.map((r: any) => ({
    Id: r.Id || 'ไม่ระบุ', total: Number(r.total) || 0, qty: Number(r.qty) || 0,
  }));

  return Response.json({ summary, daily, monthly, topProducts, groupProducts });
}
