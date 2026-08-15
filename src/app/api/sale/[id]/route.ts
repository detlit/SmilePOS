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
    const getId = await prisma.saleMain.findUnique({
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

    const { id_salemain, statussall, sumtotal, totalall, personall, statuss, person, id_receive1, lot_receive1, qty_lot1, id_receive2, lot_receive2, qty_lot2, id_receive3, lot_receive3, qty_lot3, usereward, discount, beforeVat, vatAmount, cancelReason, cancelledBy } = await req.json()
    const prisma = await getPrisma();

    // อ่านสถานะเดิมก่อน เพื่อตรวจว่าเพิ่งถูกเปลี่ยนเป็น "ยกเลิก" หรือไม่
    const prevMain = await prisma.saleMain.findUnique({ where: { id: Number(id_salemain) } });
    const wasActive = !prevMain?.statussall || prevMain.statussall === '';
    const nowCancelled = !!statussall && statussall !== '';

    // ?????? saleMain ?????? id_salemain ?????? Frontend
    const saleMainData: any = { statussall, sumtotal, totalall, personall };
    if (usereward !== undefined) {
      saleMainData.usereward = usereward;
    }
    if (discount !== undefined) {
      saleMainData.discount = discount;
    }
    if (beforeVat !== undefined) {
      saleMainData.beforeVat = beforeVat;
    }
    if (vatAmount !== undefined) {
      saleMainData.vatAmount = vatAmount;
    }
    const putmainsale = await prisma.saleMain.update({
      where: { id: Number(id_salemain) },
      data: saleMainData,
    })

    // ?????? sale ?????? params.id (???????????? params.id ??????? id ?????? Sale ????)
    const putsale = await prisma.sale.update({
      where: { id: Number(params.id) },
      data: { statuss, person, id_receive1, lot_receive1, qty_lot1, id_receive2, lot_receive2, qty_lot2, id_receive3, lot_receive3, qty_lot3 },
    })

    // 🔔 Telegram notify on cancel (fire-and-forget)
    if (wasActive && nowCancelled) {
      import('@/lib/telegram/notifier')
        .then(m => m.notifySaleCancelled(Number(id_salemain), {
          reason: cancelReason || statussall || 'ยกเลิก',
          cancelledBy: cancelledBy || personall || '',
        }))
        .catch(e => console.error('[Telegram] notifySaleCancelled failed:', e))
    }

    // ?????? Response ????? (??????????? putmainsale)
    return Response.json(putmainsale)

  } catch (error: any) {
    console.error("PUT Sale Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}