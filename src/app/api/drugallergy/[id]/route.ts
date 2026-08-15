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

export async function DELETE(
  req: Request,
  context: RouteContext, // ??? Type ??????
) {
  try {
    // 2. await params ??????????
    const params = await context.params
const prisma = await getPrisma();
    const deleted = await prisma.drugallergy.delete({
      where: { id: Number(params.id) },
    })
    
    return Response.json(deleted)
  } catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }
}