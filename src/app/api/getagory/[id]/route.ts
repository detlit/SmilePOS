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
    // 2. await params ????
    const params = await context.params
const prisma = await getPrisma();
    const getId = await prisma.getagory.findUnique({
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
  context: RouteContext,
) {
  try {
    // 2. await params ????
    const params = await context.params

    const { list, company } = await req.json()
    const prisma = await getPrisma();
    const updated = await prisma.getagory.update({
      where: { id: Number(params.id) },
      data: { list, company },
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
    // 2. await params ????
    const params = await context.params
const prisma = await getPrisma();
    const deleted = await prisma.getagory.delete({
      where: { id: Number(params.id) },
    })
    return Response.json(deleted)
  } catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }
}