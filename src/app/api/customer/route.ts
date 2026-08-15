import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}


export async function GET(request: NextRequest) {
  try {
    const searchParam = request.nextUrl.searchParams
    const names = searchParam.get('names')?.trim() || ''
    const company = searchParam.get('company')
    const sort = (searchParam.get('sort') || 'asc') as 'asc' | 'desc'
    const fields = searchParam.get('fields')
    const prisma = await getPrisma();

    let where: any = {}

    if (company) {
      where.company = company
    }

    if (names) {
      where.OR = [
        {
          names: {
            contains: names,
            mode: 'insensitive'
          }
        },
        {
          code: {
            contains: names, // Using contains for better matching
            mode: 'insensitive'
          }
        },
        {
          tel: {
            contains: names,
            mode: 'insensitive'
          }
        }
      ];
    }

    // When fields=list, return the fields used by customer pickers and receipt rendering.
    let get
    if (fields === 'list') {
      get = await prisma.customer.findMany({
        where,
        orderBy: {
          id: sort
        },
        select: {
          id: true,
          code: true,
          names: true,
          tel: true,
          address: true,
          numbertax: true,
          congenitalDisease: true,
          customer: true,
          totalPoint: true,
          levelPrice: true,
          moreInfo: true,
          drugallergys: {
            select: { drugallergy: true, remark: true },
          },
        }
      })
    } else {
      get = await prisma.customer.findMany({
        where,
        orderBy: {
          id: sort
        },
        include: {
          drugallergys: true
        }
      })
    }
    return Response.json(get)
  } catch (error) {
    console.error("GET Customer Error:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const { company, code, names, sex, idcode, age, birthday, address, branch, levelPrice, tel, pointStart, point, totalPoint, customer, drugallergys, congenitalDisease, statuss, numbertax, moreInfo } = await req.json()
    const newUser = await prisma.customer.create({
      data: {
        company, code, names, sex, idcode, age, birthday, address, branch, levelPrice, tel, pointStart, point, totalPoint, customer, congenitalDisease, statuss, numbertax, moreInfo
        , drugallergys: {
          create: drugallergys
        },
      },
      include: {
        drugallergys: true,
      },

    })
    return Response.json(newUser)

  } catch (error) {
    return new Response(error as BodyInit, {
      status: 500,
    })
  }

}