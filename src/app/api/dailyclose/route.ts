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

function toDateOnly(s: string) {
  // store as midnight UTC for the calendar day
  const d = new Date(s)
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}

export async function GET(req: NextRequest) {
  try {
    const prisma = await getPrisma()
    const url = new URL(req.url)
    const date = url.searchParams.get("date")
    const company = url.searchParams.get("company") || undefined
    const from = url.searchParams.get("from")
    const to = url.searchParams.get("to")
    const q = url.searchParams.get("q") || ""

    if (date && company) {
      const employee = url.searchParams.get("employee") ?? ""
      const item = await prisma.dailyClose.findFirst({
        where: { company, closeDate: toDateOnly(date), employeeName: employee },
      })
      return NextResponse.json(item)
    }

    const where: any = {}
    if (company) where.company = company
    if (from || to) {
      where.closeDate = {}
      if (from) where.closeDate.gte = toDateOnly(from)
      if (to) where.closeDate.lte = toDateOnly(to)
    }
    if (q) {
      where.OR = [
        { note: { contains: q, mode: "insensitive" } },
        { employeeName: { contains: q, mode: "insensitive" } },
        { branchName: { contains: q, mode: "insensitive" } },
      ]
    }

    const items = await prisma.dailyClose.findMany({
      where,
      orderBy: { closeDate: "desc" },
      take: 200,
    })
    return NextResponse.json(items)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "internal error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const prisma = await getPrisma()
    const data = await req.json()
    const { company, closeDate, id: _ignore, createdAt: _c, updatedAt: _u, ...rest } = data || {}
    if (!company || !closeDate) {
      return NextResponse.json({ error: "company & closeDate required" }, { status: 400 })
    }

    const totalCounted = computeCounted(rest)
    const cashDeliver = Number(rest.cashDeliver) || 0
    const diff = totalCounted - cashDeliver

    const day = toDateOnly(closeDate)

    // sanitize numeric fields
    const numKeys = [
      "salesTotal", "promptpayTotal", "transferTotal", "cashTotal", "otherTotal",
      "cashDeliver", "b1000", "b500", "b100", "b50", "b20", "b10", "b5", "b2", "b1",
      "changeAmount", "drawerBalance",
    ]
    for (const k of numKeys) {
      if (k in rest) (rest as any)[k] = Number((rest as any)[k]) || 0
    }

    const payload = { ...rest, totalCounted, diff }

    const empName = String(rest.employeeName ?? "")
    const existing = await prisma.dailyClose.findFirst({
      where: { company, closeDate: day, employeeName: empName },
    })
    const item = existing
      ? await prisma.dailyClose.update({ where: { id: existing.id }, data: payload })
      : await prisma.dailyClose.create({ data: { company, closeDate: day, ...payload } })
    return NextResponse.json(item)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "internal error" }, { status: 500 })
  }
}
