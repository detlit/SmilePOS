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
    const getId = await prisma.settingEmployee.findUnique({
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
const prisma = await getPrisma();
    const { name, position, username, password, passwords, mobile, timeIn, timeOut, salary, otRate } = await req.json()
    
    const updated = await prisma.settingEmployee.update({
      where: { id: Number(params.id) },
      data: { name, position, username, password, passwords, mobile, timeIn, timeOut, salary, otRate },
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
    const employeeId = Number(params.id)

    // Delete dependent records first, otherwise a foreign-key constraint
    // blocks the delete for employees who have a registered Check-in face
    // (CheckinFace has no onDelete: Cascade). Wrap in a transaction so the
    // employee is only removed after its dependents are gone.
    const deleted = await prisma.$transaction(async (tx) => {
      await tx.checkinFace.deleteMany({ where: { employeeId } })
      await tx.employeePermission.deleteMany({ where: { employeeId } })
      return tx.settingEmployee.delete({
        where: { id: employeeId },
      })
    })

    return Response.json(deleted)
  } catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }
}