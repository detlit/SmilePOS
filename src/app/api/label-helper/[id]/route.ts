import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

type RouteContext = {
  params: Promise<{ id: string }>
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

export async function GET(req: Request, context: RouteContext) {
  try {
    const params = await context.params
    const prisma = await getPrisma();
    const getId = await prisma.labelHelper.findUnique({
      where: { id: Number(params.id) }
    })
    return Response.json(getId)
  } catch (error) {
    return new Response(JSON.stringify(error), { status: 500 })
  }
}

export async function PUT(req: Request, context: RouteContext) {
  try {
    const params = await context.params
    const prisma = await getPrisma();
    const body = await req.json()
    const data = pick(body)

    if (data.isDefault && data.company) {
      await prisma.labelHelper.updateMany({
        where: { company: data.company, isDefault: true, id: { not: Number(params.id) } },
        data: { isDefault: false },
      })
    }

    const updated = await prisma.labelHelper.update({
      where: { id: Number(params.id) },
      data,
    })
    return Response.json(updated)
  } catch (error) {
    return new Response(JSON.stringify(error), { status: 500 })
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const params = await context.params
    const prisma = await getPrisma();
    const deleted = await prisma.labelHelper.delete({
      where: { id: Number(params.id) },
    })
    return Response.json(deleted)
  } catch (error) {
    return new Response(JSON.stringify(error), { status: 500 })
  }
}
