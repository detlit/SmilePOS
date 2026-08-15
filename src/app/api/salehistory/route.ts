import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}



export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const companyall = searchParam.get('companyall')
  const id_costomer = Number(searchParam.get('id_costomer') || 0)
  const code_costomer = String(searchParam.get('code_costomer') || '').trim()
  const filterStatus = searchParam.get('filterStatus') || ''
  const createDate = searchParam.get('createDate') || ''
  const sort = searchParam.get('sort') || 'desc'
  const d = new Date(createDate);
  const today = d.setDate(d.getDate() + 1)
  const prisma = await getPrisma();

  const customer = !code_costomer && id_costomer
    ? await prisma.customer.findFirst({
      where: {
        id: id_costomer,
        ...(companyall ? { company: companyall } : {}),
      },
      select: { code: true },
    })
    : null
  const resolvedCustomerCode = String(code_costomer || customer?.code || '').trim()

  // Build where condition. Customer code is the stable key across import/restore; id is only a fallback.
  const whereCondition: any = { companyall }
  if (resolvedCustomerCode) {
    whereCondition.OR = [
      { code_costomer: resolvedCustomerCode },
      ...(id_costomer ? [{
        id_costomer,
        OR: [
          { code_costomer: resolvedCustomerCode },
          { code_costomer: null },
          { code_costomer: '' },
        ],
      }] : []),
    ]
  } else if (id_costomer) {
    whereCondition.id_costomer = id_costomer
  }

  // Build historys include with optional statusH filter
  const historysInclude: any = filterStatus === '1'
    ? { where: { statusH: { not: null, notIn: [''] } } }
    : true

  const get = await prisma.saleMain.findMany({
    where: whereCondition,
    orderBy: {
      id: sort,  //เรียงลำดับ
    } as any,
    include: {
      sales: true,
      historys: historysInclude
    }

  })
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