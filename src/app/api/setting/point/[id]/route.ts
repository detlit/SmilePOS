import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

const normalizeMemberDiscountPercent = (value: unknown) => {
  const numericValue = Number(value ?? 2)
  if (!Number.isFinite(numericValue)) return 2
  return Math.min(100, Math.max(0, numericValue))
}

const normalizeMemberDiscountEnabled = (value: unknown) => {
  if (value === undefined || value === null || value === "") return false
  if (typeof value === "boolean") return value
  return String(value) === "true"
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
    const getId = await prisma.settingpoint.findUnique({
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
    const { sale, pointeq, pointset, discount, status, memberDiscountPercent, memberDiscountEnabled } = await req.json()
    
    const updated = await prisma.settingpoint.update({
      where: { id: Number(params.id) },
      data: {
        sale,
        pointeq,
        pointset,
        discount,
        status,
        memberDiscountPercent: normalizeMemberDiscountPercent(memberDiscountPercent),
        memberDiscountEnabled: normalizeMemberDiscountEnabled(memberDiscountEnabled),
      },
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
    const deleted = await prisma.settingpoint.delete({
      where: { id: Number(params.id) },
    })
    return Response.json(deleted)
  } catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }
}