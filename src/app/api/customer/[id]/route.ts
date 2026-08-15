import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}


// 1. ????? Type ??? params ???? Promise
type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  req: Request,
  context: RouteContext,
) {
  try {
    // 2. ???? await params ????
    const params = await context.params
const prisma = await getPrisma();
    const getId = await prisma.customer.findUnique({
      where: { id: Number(params.id) }, // ??? params ??? await ????
      include: {
        drugallergys: true
      }
    })
    return Response.json(getId)
  }
  catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }
}

export async function PUT(
  req: Request,
  context: RouteContext,
) {
  try {
    // 2. ???? await params ????
    const params = await context.params
const prisma = await getPrisma();
    const { code, names, sex, idcode, age, birthday, address, branch, levelPrice, tel, pointStart, point, totalPoint, customer, drugallergys, congenitalDisease, statuss, numbertax, moreInfo } = await req.json()

    const updated = await prisma.customer.update({
      where: { id: Number(params.id) }, // ??? params ??? await ????
      data: { code, names, sex, idcode, age, birthday, address, branch, levelPrice, tel, pointStart, point, totalPoint, customer, drugallergys, congenitalDisease, statuss, numbertax, moreInfo },
    })
    return Response.json(updated)

  } catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }
}

export async function DELETE(
  req: Request,
  context: RouteContext,
) {
  try {
    // 2. ???? await params ????
    const params = await context.params
const prisma = await getPrisma();
    const deleted = await prisma.customer.delete({
      where: { id: Number(params.id) }, // ??? params ??? await ????
    })
    return Response.json(deleted)

  } catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }
}