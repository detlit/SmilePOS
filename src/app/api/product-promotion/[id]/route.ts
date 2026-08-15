async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  req: Request,
  context: RouteContext,
) {
  try {
    const params = await context.params
    const prisma = await getPrisma();
    const getId = await (prisma as any).productPromotion.findUnique({
      where: { id: Number(params.id) }
    })
    return Response.json(getId)
  } catch (error) {
    return new Response(JSON.stringify(String(error)), {
      status: 500,
    })
  }
}

export async function PUT(
  req: Request,
  context: RouteContext,
) {
  try {
    const params = await context.params
    const body = await req.json()
    // รองรับทั้งอัปเดตเต็มฟอร์ม และสลับสถานะอย่างเดียว (ส่งเฉพาะ status)
    const data: Record<string, unknown> = {}
    const assign = (key: string, transform?: (v: any) => unknown) => {
      if (body[key] !== undefined) data[key] = transform ? transform(body[key]) : body[key]
    }
    assign('name')
    assign('id_product', (v) => Number(v) || 0)
    assign('code_product')
    assign('name_product')
    assign('unit')
    assign('price_tier')
    assign('promo_type')
    assign('min_qty', (v) => Number(v) || 0)
    assign('discount_unit')
    assign('discount_scope')
    assign('discount_value', (v) => Number(v) || 0)
    assign('free_qty', (v) => Number(v) || 0)
    assign('startdate', (v) => v ? new Date(v) : null)
    assign('enddate', (v) => v ? new Date(v) : null)
    assign('status')
    assign('person')
    const prisma = await getPrisma();
    const updated = await (prisma as any).productPromotion.update({
      where: { id: Number(params.id) },
      data,
    })
    return Response.json(updated)
  } catch (error) {
    return new Response(JSON.stringify(String(error)), {
      status: 500,
    })
  }
}

export async function DELETE(
  req: Request,
  context: RouteContext,
) {
  try {
    const params = await context.params
    const prisma = await getPrisma();
    const deleted = await (prisma as any).productPromotion.delete({
      where: { id: Number(params.id) },
    })
    return Response.json(deleted)
  } catch (error) {
    return new Response(JSON.stringify(String(error)), {
      status: 500,
    })
  }
}
