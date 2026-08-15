import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const company = searchParam.get('company')
  const prisma = await getPrisma();
  const data = await (prisma as any).paymentProvider.findMany({
    where: { company },
    orderBy: { id: 'asc' },
  })
  return Response.json(data)
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const body = await req.json()
    const newRecord = await (prisma as any).paymentProvider.create({
      data: body,
    })
    return Response.json(newRecord)
  } catch (error) {
    return new Response(String(error), { status: 500 })
  }
}
