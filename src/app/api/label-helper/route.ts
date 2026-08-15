import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

const pick = (b: any) => ({
  company: b.company ?? null,
  name: b.name ?? '',
  isDefault: !!b.isDefault,
  suspended: !!b.suspended,
  paperSize: b.paperSize ?? '80x50',
  labelStyle: b.labelStyle ?? 'current',
  title: b.title ?? '', titleOn: b.titleOn ?? true, titleSize: Number(b.titleSize) || 14,
  line1: b.line1 ?? '', line1On: b.line1On ?? true, line1Size: Number(b.line1Size) || 10,
  line2: b.line2 ?? '', line2On: b.line2On ?? true, line2Size: Number(b.line2Size) || 10,
  line3: b.line3 ?? '', line3On: b.line3On ?? true, line3Size: Number(b.line3Size) || 10,
  line4: b.line4 ?? '', line4On: b.line4On ?? true, line4Size: Number(b.line4Size) || 10,
  line5: b.line5 ?? '', line5On: b.line5On ?? true, line5Size: Number(b.line5Size) || 10,
  line6: b.line6 ?? '', line6On: b.line6On ?? true, line6Size: Number(b.line6Size) || 10,
  url: b.url ?? '',
  showBarcode: !!b.showBarcode,
  barcode: b.barcode ?? '',
})

export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const company = searchParam.get('company')
  const sort = (searchParam.get('sort') || 'asc') as 'asc' | 'desc'
  const prisma = await getPrisma();

  const where: any = {}
  if (company) where.company = company

  const get = await prisma.labelHelper.findMany({
    where,
    orderBy: { id: sort } as any,
  })
  return Response.json(get)
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const body = await req.json()
    const data = pick(body)

    // มีฉลากช่วยเริ่มต้นได้เพียงตัวเดียวต่อร้าน
    if (data.isDefault && data.company) {
      await prisma.labelHelper.updateMany({
        where: { company: data.company, isDefault: true },
        data: { isDefault: false },
      })
    }

    const newRecord = await prisma.labelHelper.create({ data })
    return Response.json(newRecord)
  } catch (error) {
    console.error('POST /api/label-helper error:', error)
    return new Response(JSON.stringify(error), { status: 500 })
  }
}
