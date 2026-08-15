import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

type RouteContext = {
  params: Promise<{ employeeId: string }>
}

export async function GET(
  req: Request,
  context: RouteContext,
) {
  try {
    const params = await context.params
    const prisma = await getPrisma();
    const permissions = await prisma.employeePermission.findMany({
      where: { employeeId: Number(params.employeeId) },
      orderBy: { codename: 'asc' },
    })
    return Response.json(permissions)
  } catch (error) {
    return new Response(JSON.stringify(error), { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  context: RouteContext,
) {
  try {
    const params = await context.params
    const prisma = await getPrisma();
    await prisma.employeePermission.deleteMany({
      where: { employeeId: Number(params.employeeId) },
    })
    return Response.json({ message: 'All permissions reset to default' })
  } catch (error) {
    return new Response(JSON.stringify(error), { status: 500 })
  }
}
