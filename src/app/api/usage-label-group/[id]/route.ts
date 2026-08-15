import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  req: Request,
  context: RouteContext,
) {
  try {
    const params = await context.params
    const prisma = await getPrisma();
    const getId = await prisma.usageLabelGroup.findUnique({
      where: { id: Number(params.id) }
    })
    return Response.json(getId)
  } catch (error) {
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
    const params = await context.params
    const prisma = await getPrisma();
    const { company, groupName, shortName, useS, timeS, timeuseS, keepS, remarkS } = await req.json()

    const updated = await prisma.usageLabelGroup.update({
      where: { id: Number(params.id) },
      data: { company, groupName, shortName, useS, timeS, timeuseS, keepS, remarkS },
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
    const params = await context.params
    const prisma = await getPrisma();
    const deleted = await prisma.usageLabelGroup.delete({
      where: { id: Number(params.id) },
    })
    return Response.json(deleted)
  } catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }
}
