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
  const get = await prisma.area.findMany({
    where: { company },
    orderBy: { id: sort as 'asc' | 'desc' },
  })

  return Response.json(get)
}


export async function POST(req: Request) {

 const prisma = await getPrisma();
  const { list, company } = await req.json()

  const newUser = await prisma.area.create({
    data: { list, company },
  })

  return Response.json(newUser)
}
