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
  const sort = searchParam.get('sort') || 'asc'

  // Use +07:00 (Thailand timezone) for correct date range: 00:00 - 23:59 Thai time
  const startOfDay = new Date(createDate + "T00:00:00.000+07:00");
  const endOfDay = new Date(createDate + "T23:59:59.999+07:00");

  const prisma = await getPrisma();

  // Get SaleMain for accurate revenue (sumtotal = total - discount - reward)
  const getMain = await prisma.saleMain.findMany({
    where: {
      companyall: company,
      statussall: "",
      createDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      sumtotal: true,
      createDate: true,
    },
    orderBy: {
      id: sort,
    } as any,
  })

  // Build time boundaries in UTC for each Thai hour
  // 00:00 Thai = 17:00 UTC (previous day), so use yesDT for hours 00-06
  const setDT = new Date(createDate)
  const Datestr = setDT.getFullYear() + "-" + ("0" + (Number(new Date(setDT).getMonth()) + 1)).slice(-2) + "-" + ("0" + (Number(new Date(setDT).getDate()))).slice(-2)
  const yesDate = new Date(startOfDay);
  yesDate.setDate(yesDate.getDate() - 1);
  const yesDT = yesDate.getFullYear() + "-" + ("0" + (yesDate.getMonth() + 1)).slice(-2) + "-" + ("0" + yesDate.getDate()).slice(-2)

  // Thai time -> UTC: Thai hour H = UTC (H-7), if H < 7 then previous day UTC (H+17)
  const T0000 = new Date(yesDT + "T17:00:00.000Z")  // 00:00 Thai
  const T0100 = new Date(yesDT + "T18:00:00.000Z")  // 01:00 Thai
  const T0200 = new Date(yesDT + "T19:00:00.000Z")  // 02:00 Thai
  const T0300 = new Date(yesDT + "T20:00:00.000Z")  // 03:00 Thai
  const T0400 = new Date(yesDT + "T21:00:00.000Z")  // 04:00 Thai
  const T0500 = new Date(yesDT + "T22:00:00.000Z")  // 05:00 Thai
  const T0600 = new Date(yesDT + "T23:00:00.000Z")  // 06:00 Thai
  const T0700 = new Date(Datestr + "T00:00:00.000Z") // 07:00 Thai
  const T0800 = new Date(Datestr + "T01:00:00.000Z") // 08:00 Thai
  const T0900 = new Date(Datestr + "T02:00:00.000Z") // 09:00 Thai
  const T1000 = new Date(Datestr + "T03:00:00.000Z") // 10:00 Thai
  const T1100 = new Date(Datestr + "T04:00:00.000Z") // 11:00 Thai
  const T1200 = new Date(Datestr + "T05:00:00.000Z") // 12:00 Thai
  const T1300 = new Date(Datestr + "T06:00:00.000Z") // 13:00 Thai
  const T1400 = new Date(Datestr + "T07:00:00.000Z") // 14:00 Thai
  const T1500 = new Date(Datestr + "T08:00:00.000Z") // 15:00 Thai
  const T1600 = new Date(Datestr + "T09:00:00.000Z") // 16:00 Thai
  const T1700 = new Date(Datestr + "T10:00:00.000Z") // 17:00 Thai
  const T1800 = new Date(Datestr + "T11:00:00.000Z") // 18:00 Thai
  const T1900 = new Date(Datestr + "T12:00:00.000Z") // 19:00 Thai
  const T2000 = new Date(Datestr + "T13:00:00.000Z") // 20:00 Thai
  const T2100 = new Date(Datestr + "T14:00:00.000Z") // 21:00 Thai
  const T2200 = new Date(Datestr + "T15:00:00.000Z") // 22:00 Thai
  const T2300 = new Date(Datestr + "T16:00:00.000Z") // 23:00 Thai
  const T2400 = new Date(Datestr + "T17:00:00.000Z") // 00:00 Thai (next day)

  const sumSlot = (from: Date, to: Date) => getMain.filter((r: any) => r.createDate >= from && r.createDate < to).reduce((a: any, b: any) => a + Number(b.sumtotal || 0), 0)

  const timeRever = [
    { time: "00:00", v: 0, value: sumSlot(T0000, T0100) },
    { time: "01:00", v: 1, value: sumSlot(T0100, T0200) },
    { time: "02:00", v: 2, value: sumSlot(T0200, T0300) },
    { time: "03:00", v: 3, value: sumSlot(T0300, T0400) },
    { time: "04:00", v: 4, value: sumSlot(T0400, T0500) },
    { time: "05:00", v: 5, value: sumSlot(T0500, T0600) },
    { time: "06:00", v: 6, value: sumSlot(T0600, T0700) },
    { time: "07:00", v: 7, value: sumSlot(T0700, T0800) },
    { time: "08:00", v: 8, value: sumSlot(T0800, T0900) },
    { time: "09:00", v: 9, value: sumSlot(T0900, T1000) },
    { time: "10:00", v: 10, value: sumSlot(T1000, T1100) },
    { time: "11:00", v: 11, value: sumSlot(T1100, T1200) },
    { time: "12:00", v: 12, value: sumSlot(T1200, T1300) },
    { time: "13:00", v: 13, value: sumSlot(T1300, T1400) },
    { time: "14:00", v: 14, value: sumSlot(T1400, T1500) },
    { time: "15:00", v: 15, value: sumSlot(T1500, T1600) },
    { time: "16:00", v: 16, value: sumSlot(T1600, T1700) },
    { time: "17:00", v: 17, value: sumSlot(T1700, T1800) },
    { time: "18:00", v: 18, value: sumSlot(T1800, T1900) },
    { time: "19:00", v: 19, value: sumSlot(T1900, T2000) },
    { time: "20:00", v: 20, value: sumSlot(T2000, T2100) },
    { time: "21:00", v: 21, value: sumSlot(T2100, T2200) },
    { time: "22:00", v: 22, value: sumSlot(T2200, T2300) },
    { time: "23:00", v: 23, value: sumSlot(T2300, T2400) },
  ]

  return Response.json(timeRever)
}
