import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const company = searchParam.get('company')
  const sort = searchParam.get('sort') || 'asc'
  const prisma = await getPrisma();

  const where: any = {}
  if (company) where.company = company

  const get = await prisma.usageLabelGroup.findMany({
    where,
    orderBy: {
      id: sort,
    } as any,
  })
  return Response.json(get)
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const { company, groupName, shortName, useS, timeS, timeuseS, keepS, remarkS } = await req.json()
    const newRecord = await prisma.usageLabelGroup.create({
      data: {
        company, groupName, shortName, useS, timeS, timeuseS, keepS, remarkS
      },
    })
    return Response.json(newRecord)
  } catch (error) {
    console.error('POST /api/usage-label-group error:', error)
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }
}
