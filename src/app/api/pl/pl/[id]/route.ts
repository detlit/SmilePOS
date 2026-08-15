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
    const getId = await prisma.pL.findUnique({
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
    const body = await req.json();
    console.log(`PUT /api/pl/pl/${params.id} body:`, JSON.stringify(body, null, 2));

    const prisma = await getPrisma();
    const { R4000, R4001, R4002,
      C5000, C5001,
      S6000, S6001, S6002, S6003, S6004, S6005, S6006, S6007, S6008, S6009, S6010,
      A7000, A7001, A7002, A7003, A7004, A7005, A7006, A7007 } = body;

    const safeNum = (val: any) => {
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    const updated = await prisma.pL.update({
      where: { id: Number(params.id) },
      data: {
        R4000: safeNum(R4000), R4001: safeNum(R4001), R4002: safeNum(R4002),
        C5000: safeNum(C5000), C5001: safeNum(C5001),
        S6000: safeNum(S6000), S6001: safeNum(S6001), S6002: safeNum(S6002), S6003: safeNum(S6003), S6004: safeNum(S6004), S6005: safeNum(S6005), S6006: safeNum(S6006), S6007: safeNum(S6007), S6008: safeNum(S6008), S6009: safeNum(S6009), S6010: safeNum(S6010),
        A7000: safeNum(A7000), A7001: safeNum(A7001), A7002: safeNum(A7002), A7003: safeNum(A7003), A7004: safeNum(A7004), A7005: safeNum(A7005), A7006: safeNum(A7006), A7007: safeNum(A7007)
      },
    })
    return Response.json(updated)
  } catch (error: any) {
    console.error("PUT /api/pl/pl error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
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
    // ?? NOTE: Model "promotion" ???????????? ???????? GET/PUT ??? "pL"
    const deleted = await prisma.promotion.delete({
      where: { id: Number(params.id) },
    })
    return Response.json(deleted)
  } catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }
}