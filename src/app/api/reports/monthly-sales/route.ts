import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

/**
 * รายงานขายประจำเดือน (ช่วงวัน/เดือน)
 * คืนค่าข้อมูลระดับบิล (saleMain) และรายการสินค้า (sales) ตามช่วงวันที่เลือก
 * รองรับการกรองช่องทางชำระ และค้นหาลูกค้า/เบอร์โทร (กรองฝั่ง client)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const company = searchParams.get('company') || ""
  const startDateParam = searchParams.get('startDate') || ""
  const endDateParam = searchParams.get('endDate') || ""

  if (!company || !startDateParam || !endDateParam) {
    return Response.json({ error: 'missing company/startDate/endDate' }, { status: 400 })
  }

  // ขอบเขตวันแบบเวลาไทย (Asia/Bangkok, UTC+7)
  const startDate = new Date(`${startDateParam}T00:00:00.000+07:00`)
  const endDate = new Date(`${endDateParam}T23:59:59.999+07:00`)

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return Response.json({ error: 'invalid date format' }, { status: 400 })
  }

  const prisma = await getPrisma()

  const [saleMain, sales] = await Promise.all([
    prisma.saleMain.findMany({
      where: {
        companyall: company,
        createDate: { gte: startDate, lte: endDate },
      },
      orderBy: { id: 'asc' },
    }),
    prisma.sale.findMany({
      where: {
        company,
        createDate: { gte: startDate, lte: endDate },
      },
      orderBy: { id: 'asc' },
    }),
  ])

  return Response.json({ saleMain, sales })
}
