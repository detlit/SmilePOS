import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}


export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const company = searchParam.get('company')
  const statusH = searchParam.get('statusH') || ''
  const createDate = searchParam.get('createDate') || ''
  const sort = searchParam.get('sort') || 'desc'
  const filterDuedate = searchParam.get('filterDuedate') || ''
  const fields = searchParam.get('fields')
  const d = new Date(createDate);
  const today = d.setDate(d.getDate() + 1)
  const prisma = await getPrisma();

  const whereCondition: any = { company, statusH }
  if (filterDuedate === 'lte_today') {
    whereCondition.duedate = { lte: new Date() }
  }

  // When fields=list, only return essential fields for the follow list (skip salemain join)
  let get
  if (fields === 'list') {
    get = await prisma.history.findMany({
      where: whereCondition,
      orderBy: {
        id: sort,
      } as any,
      select: {
        id: true,
        code_costomer: true,
        name_customer: true,
        id_costomer: true,
        duedate: true,
        duedate1: true,
        duedate2: true,
        statusH: true,
      }
    })
  } else {
    get = await prisma.history.findMany({
      where: whereCondition,
      orderBy: {
        id: sort,
      } as any,
      include: {
        salemain: true
      }
    })
  }
  return Response.json(get)
}




export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {

    const { sales, companyall, id_costomer, code_costomer, group_price, pay, bill, totalall, discount, sumtotal, addreward, usereward, personall, statussall } = await req.json()
    const newUser = await prisma.saleMain.create({
      data: {
        companyall, id_costomer, code_costomer, group_price, pay, bill, totalall, discount, sumtotal, addreward, usereward, personall, statussall,

        sales: {
          create: sales
        },
      },
      include: {
        sales: true,
      },
    })
    return Response.json(newUser)

  } catch (error) {
    return new Response(error as BodyInit, {
      status: 500,
    })
  }

}