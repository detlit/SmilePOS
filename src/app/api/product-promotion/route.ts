import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const company = searchParam.get('company')
  const status = searchParam.get('status') || ""
  const prisma = await getPrisma();
  const get = await (prisma as any).productPromotion.findMany({
    where: {
      company,
      ...(status !== "" ? { status } : {}),
    },
    orderBy: { id: 'desc' },
  })
  return Response.json(get)
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const {
      company, name, id_product, code_product, name_product, unit,
      price_tier, promo_type, min_qty, discount_unit, discount_scope,
      discount_value, free_qty, startdate, enddate, status, person
    } = await req.json()
    const created = await (prisma as any).productPromotion.create({
      data: {
        company,
        name,
        id_product: Number(id_product) || 0,
        code_product,
        name_product,
        unit,
        price_tier,
        promo_type,
        min_qty: Number(min_qty) || 0,
        discount_unit,
        discount_scope,
        discount_value: Number(discount_value) || 0,
        free_qty: Number(free_qty) || 0,
        startdate: startdate ? new Date(startdate) : null,
        enddate: enddate ? new Date(enddate) : null,
        status,
        person,
      },
    })
    return Response.json(created)
  } catch (error) {
    return new Response(JSON.stringify(String(error)), {
      status: 500,
    })
  }
}
