import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const employeeId = searchParam.get('employeeId')

  if (!employeeId) {
    return new Response(JSON.stringify({ error: 'employeeId is required' }), { status: 400 })
  }

  const prisma = await getPrisma();
  const permissions = await prisma.employeePermission.findMany({
    where: { employeeId: Number(employeeId) },
    orderBy: { codename: 'asc' },
  })
  return Response.json(permissions)
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  try {
    const { employeeId, codename, allowed } = await req.json()

    if (!employeeId || !codename) {
      return new Response(JSON.stringify({ error: 'employeeId and codename are required' }), { status: 400 })
    }

    const result = await prisma.employeePermission.upsert({
      where: {
        employeeId_codename: {
          employeeId: Number(employeeId),
          codename: String(codename),
        },
      },
      update: { allowed: Boolean(allowed) },
      create: {
        employeeId: Number(employeeId),
        codename: String(codename),
        allowed: Boolean(allowed),
      },
    })
    return Response.json(result)
  } catch (error) {
    return new Response(JSON.stringify(error), { status: 500 })
  }
}
