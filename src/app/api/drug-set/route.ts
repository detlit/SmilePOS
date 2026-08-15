import { NextRequest } from 'next/server'
import { cleanText, drugSetInclude, normalizeDrugSetItems, normalizeStatus } from '@/lib/drugSetItems'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma')
  if (!prisma) throw new Error('Prisma is not available during build.')
  return prisma
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma()
  const searchParam = request.nextUrl.searchParams
  const company = searchParam.get('company') || ''
  const q = cleanText(searchParam.get('q') || searchParam.get('search'))
  const status = cleanText(searchParam.get('status'))

  const where: any = {}
  if (company) where.company = company
  if (status) where.status = status
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      {
        items: {
          some: {
            OR: [
              { code: { contains: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
              { fixname: { contains: q, mode: 'insensitive' } },
              { drugGroup: { contains: q, mode: 'insensitive' } },
              { barcode: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
      },
    ]
  }

  const drugSets = await prisma.drugSet.findMany({
    where,
    include: drugSetInclude,
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
  })
  return Response.json(drugSets)
}

export async function POST(req: Request) {
  const prisma = await getPrisma()
  try {
    const data = await req.json()
    const name = cleanText(data.name)
    if (!name) return Response.json({ error: 'กรุณาระบุชื่อชุดยา' }, { status: 400 })
    const items = await normalizeDrugSetItems(prisma, data.items)

    const created = await prisma.drugSet.create({
      data: {
        company: cleanText(data.company),
        name,
        description: cleanText(data.description),
        status: normalizeStatus(data.status),
        items: { create: items },
      },
      include: drugSetInclude,
    })
    return Response.json(created)
  } catch (error: any) {
    console.error('POST /api/drug-set error:', error)
    return Response.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
