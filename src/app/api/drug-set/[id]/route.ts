import { cleanText, drugSetInclude, normalizeDrugSetItems, normalizeStatus } from '@/lib/drugSetItems'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma')
  if (!prisma) throw new Error('Prisma is not available during build.')
  return prisma
}

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const params = await context.params
    const prisma = await getPrisma()
    const drugSet = await prisma.drugSet.findUnique({
      where: { id: Number(params.id) },
      include: drugSetInclude,
    })
    return Response.json(drugSet)
  } catch (error: any) {
    console.error('GET /api/drug-set/[id] error:', error)
    return Response.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request, context: RouteContext) {
  const prisma = await getPrisma()
  try {
    const params = await context.params
    const data = await req.json()
    const name = cleanText(data.name)
    if (!name) return Response.json({ error: 'กรุณาระบุชื่อชุดยา' }, { status: 400 })
    const items = await normalizeDrugSetItems(prisma, data.items)

    const updated = await prisma.drugSet.update({
      where: { id: Number(params.id) },
      data: {
        company: cleanText(data.company),
        name,
        description: cleanText(data.description),
        status: normalizeStatus(data.status),
        items: {
          deleteMany: {},
          create: items,
        },
      },
      include: drugSetInclude,
    })
    return Response.json(updated)
  } catch (error: any) {
    console.error('PUT /api/drug-set/[id] error:', error)
    return Response.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const params = await context.params
    const prisma = await getPrisma()
    const deleted = await prisma.drugSet.delete({ where: { id: Number(params.id) } })
    return Response.json(deleted)
  } catch (error: any) {
    console.error('DELETE /api/drug-set/[id] error:', error)
    return Response.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
