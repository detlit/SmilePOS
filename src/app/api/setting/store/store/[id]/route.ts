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
  context: RouteContext, // ??? Type ??????
) {
  try {
    // 2. await params ??????????
    const params = await context.params
const prisma = await getPrisma();
    const getId = await prisma.settingStore.findUnique({
      where: { id: Number(params.id) }
    })
    return Response.json(getId)
  }
  catch (error) {
    return new Response(JSON.stringify(error), { // ??? JSON.stringify ????????????????
      status: 500,
    })
  }
}

export async function PUT(
  req: Request,
  context: RouteContext, // ??? Type ??????
) {
  try {
    // 2. await params ??????????
    const params = await context.params

    const { namestore, address, tel, lineid, ownerName, taxnumber, publiclogo, publicline, vatEnabled, vatRate, branchName, branchCode, blockNegativeStockSale, expiryColorRules, costPriceMode } = await req.json()
    const prisma = await getPrisma();
    const updated = await prisma.settingStore.update({
      where: { id: Number(params.id) },
      data: { namestore, address, tel, lineid, ownerName, taxnumber, publiclogo, publicline, vatEnabled, vatRate, branchName, branchCode, blockNegativeStockSale, expiryColorRules, costPriceMode } as any,
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
  context: RouteContext, // ??? Type ??????
) {
  try {
    // 2. await params ??????????
    const params = await context.params
const prisma = await getPrisma();
    const deleted = await prisma.settingStore.delete({
      where: { id: Number(params.id) },
    })
    return Response.json(deleted)
  } catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }
}