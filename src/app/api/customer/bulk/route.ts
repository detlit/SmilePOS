import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

// DELETE all customers for a company
export async function DELETE(request: NextRequest) {
  try {
    const searchParam = request.nextUrl.searchParams
    const company = searchParam.get('company')
    if (!company) {
      return Response.json({ error: 'company is required' }, { status: 400 })
    }
    const prisma = await getPrisma();
    // Delete related drugallergys first
    await prisma.drugallergy.deleteMany({
      where: { salemain: { company } }
    })
    const deleted = await prisma.customer.deleteMany({
      where: { company }
    })
    return Response.json({ deleted: deleted.count })
  } catch (error) {
    console.error("DELETE Bulk Customer Error:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST bulk import customers (skip duplicates by code or tel)
export async function POST(req: Request) {
  try {
    const prisma = await getPrisma();
    const { company, customers } = await req.json()
    if (!company || !Array.isArray(customers)) {
      return Response.json({ error: 'company and customers array required' }, { status: 400 })
    }

    // Get existing customers for duplicate checking
    const existing = await prisma.customer.findMany({
      where: { company },
      select: { code: true, tel: true }
    })
    const existingCodes = new Set(existing.map((c: any) => c.code).filter(Boolean))
    const existingTels = new Set(existing.map((c: any) => c.tel).filter(Boolean))

    let created = 0
    let skipped = 0
    for (const cust of customers) {
      const code = String(cust.code || '').trim()
      const tel = String(cust.tel || '').trim()

      // Skip if code or tel already exists
      if (code && existingCodes.has(code)) { skipped++; continue }
      if (tel && existingTels.has(tel)) { skipped++; continue }

      await prisma.customer.create({
        data: {
          company,
          code: code || undefined,
          names: String(cust.names || '').trim() || undefined,
          sex: String(cust.sex || '').trim() || undefined,
          idcode: String(cust.idcode || '').trim() || undefined,
          age: cust.age ? Number(cust.age) : undefined,
          birthday: String(cust.birthday || '').trim() || undefined,
          address: String(cust.address || '').trim() || undefined,
          branch: String(cust.branch || '').trim() || undefined,
          levelPrice: String(cust.levelPrice || '').trim() || undefined,
          tel: tel || undefined,
          pointStart: cust.pointStart ? Number(cust.pointStart) : undefined,
          point: cust.point ? Number(cust.point) : undefined,
          totalPoint: cust.totalPoint ? Number(cust.totalPoint) : undefined,
          customer: String(cust.customer || '').trim() || undefined,
          congenitalDisease: String(cust.congenitalDisease || '').trim() || undefined,
          statuss: String(cust.statuss || '').trim() || undefined,
          numbertax: String(cust.numbertax || '').trim() || undefined,
        }
      })
      // Add to sets to prevent duplicates within the same batch
      if (code) existingCodes.add(code)
      if (tel) existingTels.add(tel)
      created++
    }

    return Response.json({ created, skipped })
  } catch (error) {
    console.error("POST Bulk Customer Error:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
