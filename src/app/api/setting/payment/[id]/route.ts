import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

const normalizeNullableString = (value: unknown) => {
  const text = String(value ?? "").trim()
  return text === "" ? null : text
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
    const getId = await prisma.settingpayment.findUnique({
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

    const body = await req.json()
    const bank = normalizeNullableString(body.bank)
    const name = normalizeNullableString(body.name)
    const bookbankno = normalizeNullableString(body.bookbankno)
    const promtpayno = normalizeNullableString(body.promtpayno)
    const publicId = normalizeNullableString(body.publicId)
    const prisma = await getPrisma();
    const updated = await prisma.settingpayment.update({
      where: { id: Number(params.id) },
      data: { bank, name, bookbankno, promtpayno, publicId },
    })
    return Response.json(updated)
  } catch (error) {
    console.error('PUT /api/setting/payment/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
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
    const deleted = await prisma.settingpayment.delete({
      where: { id: Number(params.id) },
    })
    return Response.json(deleted)
  } catch (error) {
    console.error('DELETE /api/setting/payment/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}