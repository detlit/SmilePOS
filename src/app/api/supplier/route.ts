import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}


export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const names = searchParam.get('names') || ''
  const code = searchParam.get('code') || ''
  const company = searchParam.get('company')
  const sort = searchParam.get('sort') || 'asc'
  const fields = searchParam.get('fields')
  const prisma = await getPrisma();

  const whereClause = {
    ...(company ? { company } : {}),
    names: {
      contains: names,
      mode: 'insensitive' as const
    },
    code: {
      contains: code,
      mode: 'insensitive' as const
    }
  }

  // When fields=list, only return essential fields for the supplier list (faster)
  let get
  if (fields === 'list') {
    get = await prisma.supplier.findMany({
      where: whereClause,
      select: {
        id: true,
        code: true,
        names: true,
        leadtime: true,
      },
      orderBy: {
        id: sort,
      } as any,
    })
  } else {
    get = await prisma.supplier.findMany({
      where: whereClause,
      orderBy: {
        id: sort,
      } as any,
    })
  }
  return Response.json(get)
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const { company, code, names, tel, leadtime, idcode, address, statuss, email } = await req.json()
    const newUser = await prisma.supplier.create({
      data: {
        company, code, names, tel, leadtime, idcode, address, statuss, email

      },
    })
    return Response.json(newUser)

  } catch (error) {
    return new Response(error as BodyInit, {
      status: 500,
    })
  }

}

