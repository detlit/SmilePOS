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
    const getId = await prisma.remarkL.findUnique({
      where: { id: Number(params.id) }
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
  context: RouteContext, // ??? Type ??????
) {
  try {
    // 2. await params ??????????
    const params = await context.params
const prisma = await getPrisma();
    const { list, company, list_lo, list_my, list_km, list_zh, list_eng } = await req.json()
    
    const updated = await prisma.remarkL.update({
      where: { id: Number(params.id) },
      data: { list, company, list_lo, list_my, list_km, list_zh, list_eng },
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
    const deleted = await prisma.remarkL.delete({
      where: { id: Number(params.id) },
    })
    return Response.json(deleted)
  } catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }
}