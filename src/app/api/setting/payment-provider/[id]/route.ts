import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const params = await context.params
    const prisma = await getPrisma();
    const data = await (prisma as any).paymentProvider.findUnique({
      where: { id: Number(params.id) }
    })
    return Response.json(data)
  } catch (error) {
    return new Response(JSON.stringify(error), { status: 500 })
  }
}

export async function PUT(req: Request, context: RouteContext) {
  try {
    const params = await context.params
    const body = await req.json()
    const prisma = await getPrisma();
    const updated = await (prisma as any).paymentProvider.update({
      where: { id: Number(params.id) },
      data: body,
    })
    return Response.json(updated)
  } catch (error) {
    return new Response(JSON.stringify(error), { status: 500 })
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const params = await context.params
    const prisma = await getPrisma();
    const deleted = await (prisma as any).paymentProvider.delete({
      where: { id: Number(params.id) },
    })
    return Response.json(deleted)
  } catch (error) {
    return new Response(JSON.stringify(error), { status: 500 })
  }
}
