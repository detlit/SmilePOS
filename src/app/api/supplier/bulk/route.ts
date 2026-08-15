import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

// DELETE all suppliers for a company
export async function DELETE(request: NextRequest) {
  try {
    const searchParam = request.nextUrl.searchParams
    const company = searchParam.get('company')
    if (!company) {
      return Response.json({ error: 'company is required' }, { status: 400 })
    }
    const prisma = await getPrisma();
    const deleted = await prisma.supplier.deleteMany({
      where: { company }
    })
    return Response.json({ deleted: deleted.count })
  } catch (error) {
    console.error("DELETE Bulk Supplier Error:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST bulk import suppliers (skip duplicates by code or names)
export async function POST(req: Request) {
  try {
    const prisma = await getPrisma();
    const { company, suppliers } = await req.json()
    if (!company || !Array.isArray(suppliers)) {
      return Response.json({ error: 'company and suppliers array required' }, { status: 400 })
    }

    // Get existing suppliers for duplicate checking
    const existing = await prisma.supplier.findMany({
      where: { company },
      select: { code: true, names: true }
    })
    const existingCodes = new Set(existing.map((c: any) => c.code).filter(Boolean))
    const existingNames = new Set(existing.map((c: any) => (c.names || '').trim().toLowerCase()).filter(Boolean))

    let created = 0
    let skipped = 0
    for (const sup of suppliers) {
      const code = String(sup.code || '').trim()
      const names = String(sup.names || '').trim()

      // Skip if code or company name already exists
      if (code && existingCodes.has(code)) { skipped++; continue }
      if (names && existingNames.has(names.toLowerCase())) { skipped++; continue }

      await prisma.supplier.create({
        data: {
          company,
          code: code || undefined,
          names: names || undefined,
          tel: String(sup.tel || '').trim() || undefined,
          idcode: String(sup.idcode || '').trim() || undefined,
          address: String(sup.address || '').trim() || undefined,
          statuss: String(sup.statuss || '').trim() || undefined,
          leadtime: sup.leadtime ? Number(sup.leadtime) : undefined,
          email: String(sup.email || '').trim() || undefined,
        }
      })
      if (code) existingCodes.add(code)
      if (names) existingNames.add(names.toLowerCase())
      created++
    }

    return Response.json({ created, skipped })
  } catch (error) {
    console.error("POST Bulk Supplier Error:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
