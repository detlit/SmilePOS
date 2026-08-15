import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma';

// Live DB lookup for the current max numeric product code, so the "add product"
// button doesn't rely on a possibly-stale client-side snapshot of the product list.
export async function GET(request: NextRequest) {
  const company = request.nextUrl.searchParams.get('company') || ''

  const rows = await prisma.datalist.findMany({
    where: { company },
    select: { code: true },
  })

  let maxValue = 10000
  for (const row of rows) {
    const n = Number(row.code)
    if (Number.isFinite(n) && n > maxValue) maxValue = n
  }

  return NextResponse.json({ maxValue: String(maxValue) })
}
