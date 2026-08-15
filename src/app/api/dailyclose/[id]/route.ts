import { NextRequest, NextResponse } from "next/server"

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma")
  if (!prisma) throw new Error("Prisma is not available during build.")
  return prisma
}

function computeCounted(d: any) {
  return (
    (Number(d.b1000) || 0) * 1000 +
    (Number(d.b500) || 0) * 500 +
    (Number(d.b100) || 0) * 100 +
    (Number(d.b50) || 0) * 50 +
    (Number(d.b20) || 0) * 20 +
    (Number(d.b10) || 0) * 10 +
    (Number(d.b5) || 0) * 5 +
    (Number(d.b2) || 0) * 2 +
    (Number(d.b1) || 0) * 1
  )
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma()
    const { id } = await params
    const raw = await req.json()
    const { id: _i, company: _c, closeDate: _d, createdAt: _ca, updatedAt: _ua, ...data } = raw

    const numKeys = [
      "salesTotal", "promptpayTotal", "transferTotal", "cashTotal", "otherTotal",
      "cashDeliver", "b1000", "b500", "b100", "b50", "b20", "b10", "b5", "b2", "b1",
      "changeAmount", "drawerBalance",
    ]
    for (const k of numKeys) {
      if (k in data) (data as any)[k] = Number((data as any)[k]) || 0
    }
    const totalCounted = computeCounted(data)
    const diff = totalCounted - (Number(data.cashDeliver) || 0)

    const item = await prisma.dailyClose.update({
      where: { id: Number(id) },
      data: { ...data, totalCounted, diff },
    })
    return NextResponse.json(item)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "internal error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma()
    const { id } = await params
    await prisma.dailyClose.delete({ where: { id: Number(id) } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "internal error" }, { status: 500 })
  }
}
