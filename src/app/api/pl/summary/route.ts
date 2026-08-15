import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const company = searchParam.get('company') || ""
  const createDate = searchParam.get('createDate') || "" // Expected YYYY-MM
  const sort = searchParam.get('sort') || 'asc'
  const name = searchParam.get('name') || "" // Employee name filter

  // Parse Year and Month consistently
  let year: number, month: number;
  const now = new Date();

  if (createDate && createDate.includes('-')) {
    const [y, m] = createDate.split('-');
    year = parseInt(y);
    month = parseInt(m);
  } else {
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }

  // Use Thai timezone (+07:00) for consistency with other APIs (sale, checkin, etc.)
  const monthStr2 = String(month).padStart(2, '0');
  const daysInMonth = new Date(year, month, 0).getDate();
  console.log(`Summary API: createDate=${createDate}, parsedYear=${year}, parsedMonth=${month}, daysInMonth=${daysInMonth}, name=${name}`);

  const startDate = new Date(`${year}-${monthStr2}-01T00:00:00.000+07:00`);
  const endDate = new Date(`${year}-${monthStr2}-${String(daysInMonth).padStart(2, '0')}T23:59:59.999+07:00`);

  const prisma = await getPrisma();

  // Build where conditions for employee-filtered data
  const saleWhereEmployee: any = {
    company,
    statuss: "OK",
    createDate: { gte: startDate, lte: endDate }
  }
  if (name) {
    saleWhereEmployee.person = name
  }

  const checkinWhereEmployee: any = {
    idcompany: company,
    checkin: { gte: startDate, lte: endDate }
  }
  if (name) {
    checkinWhereEmployee.person = name
  }

  // Parallel data fetching — select only fields used in calculations
  // When no employee filter, sales and salesByEmployee are identical → skip duplicate query
  const queries: Promise<any>[] = [
    // All sales (for cost)
    prisma.sale.findMany({
      where: { company, statuss: "OK", createDate: { gte: startDate, lte: endDate } },
      select: { total: true, cost: true, gifts: true, id_salemain: true, createDate: true }
    }),
    prisma.receive.findMany({
      where: { company, receive_date: { gte: startDate, lte: endDate } },
      select: { totalRCAll: true, receive_date: true }
    }),
    // Checkins filtered by employee (for hasCheckin)
    prisma.checkin.findMany({
      where: checkinWhereEmployee,
      select: { checkin: true }
    }),
    // SaleMain for accurate revenue (sumtotal = total - discount - reward)
    prisma.saleMain.findMany({
      where: { companyall: company, statussall: "", createDate: { gte: startDate, lte: endDate } },
      select: { id: true, sumtotal: true, createDate: true }
    }),
  ]
  // Only fetch employee-filtered sales separately when an employee filter is active
  if (name) {
    queries.push(
      prisma.sale.findMany({
        where: saleWhereEmployee,
        select: { total: true, gifts: true, id_salemain: true, createDate: true }
      })
    )
  }
  const results = await Promise.all(queries)
  const sales = results[0]
  const receives = results[1]
  const checkinsByEmployee = results[2]
  const saleMains = results[3]
  const salesByEmployee = name ? results[4] : sales  // reuse sales when no filter

  // Use Map for O(1) day lookup — extract day in Thai timezone (+07:00)
  const getThaiDay = (d: Date) => {
    return parseInt(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok', day: '2-digit' }))
  }
  const getDayDataMap = (data: any[], dateField: string) => {
    const map = new Map<number, any[]>();
    data.forEach(item => {
      if (item[dateField]) {
        const d = new Date(item[dateField]);
        const day = getThaiDay(d);
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(item);
      }
    });
    return map;
  };

  const salesByDay = getDayDataMap(sales, 'createDate');
  const saleMainsByDay = getDayDataMap(saleMains, 'createDate');
  const salesByEmployeeByDay = name ? getDayDataMap(salesByEmployee, 'createDate') : salesByDay;
  const receivesByDay = getDayDataMap(receives, 'receive_date');
  const checkinsByEmployeeByDay = getDayDataMap(checkinsByEmployee, 'checkin');

  const result = [];
  const monthStr = String(month).padStart(2, '0');

  for (let d = 1; d <= daysInMonth; d++) {
    const dayKey = d;
    const daySales = salesByDay.get(dayKey) || [];
    const daySaleMains = saleMainsByDay.get(dayKey) || [];
    const daySalesEmployee = salesByEmployeeByDay.get(dayKey) || [];
    const dayReceives = receivesByDay.get(dayKey) || [];
    const dayCheckinsEmployee = checkinsByEmployeeByDay.get(dayKey) || [];

    // ยอดขาย, บิล - ใช้ SaleMain.sumtotal (หลังหักส่วนลด/ตัดแต้ม)
    const sale = daySaleMains.reduce((sum, item) => sum + (Number(item.sumtotal) || 0), 0);
    const bill = daySaleMains.length;

    // ค่าหยิบ, ขาย/บิล - filter ตามพนักงาน (ใช้ daySalesEmployee)
    const gifts = daySalesEmployee.reduce((sum, item) => sum + (Number(item.gifts) || 0), 0);
    const saleEmployee = daySalesEmployee.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const uniqueBillIdsEmployee = new Set(daySalesEmployee.map(item => item.id_salemain));
    const billEmployee = uniqueBillIdsEmployee.size;
    const salePerBill = billEmployee > 0 ? saleEmployee / billEmployee : 0;

    // เข้างาน - filter ตามพนักงาน
    const hasCheckin = dayCheckinsEmployee.length > 0 ? 1 : 0;

    const cost = daySales.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
    const rc = dayReceives.reduce((sum, item) => sum + (Number(item.totalRCAll) || 0), 0);

    result.push({
      date: `${String(d).padStart(2, '0')}/${monthStr}/${year}`,
      sale,        // รวมทุกคน
      bill,        // รวมทุกคน
      salePerBill, // เฉพาะพนักงานที่เลือก
      gifts,       // เฉพาะพนักงานที่เลือก
      hasCheckin,  // เฉพาะพนักงานที่เลือก
      cost,
      rc,
      diff: sale - rc,
    });
  }

  return Response.json(result);
}

