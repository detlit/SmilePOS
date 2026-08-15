import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const today = new Date()
    const dateStr = today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0')
    const prefix = `TV${dateStr}-`

    const lastInvoice = await prisma.saleMain.findFirst({
      where: {
        taxInvoiceNo: { startsWith: prefix }
      },
      orderBy: { taxInvoiceNo: 'desc' }
    })

    let running = 1
    if (lastInvoice?.taxInvoiceNo) {
      const lastNum = parseInt(lastInvoice.taxInvoiceNo.split('-')[1] || '0', 10)
      running = lastNum + 1
    }
    const taxInvoiceNo = `${prefix}${String(running).padStart(4, '0')}`

    return Response.json({ taxInvoiceNo })
  } catch (error) {
    console.error("next-tax-invoice error:", error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 })
  }
}
