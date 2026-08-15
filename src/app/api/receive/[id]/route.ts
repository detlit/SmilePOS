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
    const getId = await prisma.receive.findUnique({
      where: { id: Number(params.id) },
      include: {
        confirmRecord: true,
      },
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
    const prisma = await getPrisma();
    const {
      code,
      names,
      invoice_No,
      order_date,
      receive_date,
      tax_date,
      tax_no,
      pay_date,
      statuss,
      codenames,
      totalRC,
      vatRC,
      discountRC,
      totalRCAll,
      countorder,
      orderNo,
      orderfull,
      purchase_debit_date,
      purchase_debit_number,
      purchase_debit_orderNo,
      purchase_debit_orderfull,
      purchase_debit_status,
      purchase_debit_person,
      purchase_debit_remark,
      purchase_debit_reference_no,
      purchase_debit_reference_book_no,
      purchase_debit_reason,
      purchase_debit_original_amount,
      purchase_debit_correct_amount,
      purchase_debit_difference_amount,
      purchase_debit_vat_rate,
      purchase_debit_vat_amount,
      purchase_debit_grand_total,
      purchase_credit_date,
      purchase_credit_number,
      purchase_credit_orderNo,
      purchase_credit_orderfull,
      purchase_credit_status,
      purchase_credit_person,
      purchase_credit_remark,
      purchase_credit_reference_no,
      purchase_credit_reference_book_no,
      purchase_credit_reason,
      purchase_credit_item_name,
      purchase_credit_item_qty,
      purchase_credit_items_json,
      purchase_credit_original_amount,
      purchase_credit_correct_amount,
      purchase_credit_difference_amount,
      purchase_credit_reduce_amount,
      purchase_credit_vat_rate,
      purchase_credit_vat_amount,
      purchase_credit_net_total,
      receiveConfirmStatus,
      confirmedBy,
    } = await req.json()

    const receiveId = Number(params.id)
    const receiveData = Object.fromEntries(
      Object.entries({
        code, names, invoice_No, order_date, receive_date, tax_date, tax_no, pay_date, statuss, codenames, totalRC, vatRC, discountRC, totalRCAll, countorder, orderNo, orderfull,
        purchase_debit_date, purchase_debit_number, purchase_debit_orderNo, purchase_debit_orderfull, purchase_debit_status, purchase_debit_person, purchase_debit_remark,
        purchase_debit_reference_no, purchase_debit_reference_book_no, purchase_debit_reason, purchase_debit_original_amount, purchase_debit_correct_amount,
        purchase_debit_difference_amount, purchase_debit_vat_rate, purchase_debit_vat_amount, purchase_debit_grand_total,
        purchase_credit_date, purchase_credit_number, purchase_credit_orderNo, purchase_credit_orderfull, purchase_credit_status, purchase_credit_person, purchase_credit_remark,
        purchase_credit_reference_no, purchase_credit_reference_book_no, purchase_credit_reason, purchase_credit_item_name, purchase_credit_item_qty, purchase_credit_items_json,
        purchase_credit_original_amount, purchase_credit_correct_amount, purchase_credit_difference_amount, purchase_credit_reduce_amount,
        purchase_credit_vat_rate, purchase_credit_vat_amount, purchase_credit_net_total,
      })
        .filter(([, value]) => value !== undefined)
    )

    const updated = await prisma.$transaction(async (tx) => {
      const receive = Object.keys(receiveData).length > 0
        ? await tx.receive.update({
            where: { id: receiveId },
            data: receiveData,
          })
        : await tx.receive.findUniqueOrThrow({
            where: { id: receiveId },
          })

      if (receiveConfirmStatus === 'confirmed') {
        await tx.confirmRC.upsert({
          where: { receiveId },
          update: {
            company: receive.company,
            status: 'confirmed',
            confirmedAt: new Date(),
            confirmedBy: confirmedBy || receive.persons || '',
          },
          create: {
            company: receive.company,
            receiveId,
            status: 'confirmed',
            confirmedAt: new Date(),
            confirmedBy: confirmedBy || receive.persons || '',
          },
        })
      }

      if (receiveConfirmStatus === 'pending') {
        await tx.confirmRC.deleteMany({
          where: { receiveId },
        })
      }

      // sync วันรับสินค้า ไปยังรายการสินค้า (RCitemlist) ของใบรับนี้ด้วย
      if (receive_date && receive.orderfull) {
        await tx.rCitemlist.updateMany({
          where: { company: receive.company, codenames: receive.orderfull },
          data: { dateRC: new Date(receive_date) },
        })
      }

      return tx.receive.findUniqueOrThrow({
        where: { id: receiveId },
        include: {
          confirmRecord: true,
        },
      })
    })
    return Response.json(updated)
  } catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
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
    const receiveId = Number(params.id)
    const prisma = await getPrisma();

    const receive = await prisma.receive.findUnique({
      where: { id: receiveId },
      select: { company: true, orderfull: true },
    })

    if (!receive) {
      return new Response(JSON.stringify({ error: 'ไม่พบใบรับสินค้า' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const itemCount = await prisma.rCitemlist.count({
      where: {
        company: receive.company,
        codenames: receive.orderfull,
      },
    })

    if (itemCount > 0) {
      return new Response(JSON.stringify({
        error: 'กรุณาลบรายการสินค้าในใบรับนี้ก่อน',
        itemCount,
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const deleted = await prisma.receive.delete({
      where: { id: receiveId },
    })
    return Response.json(deleted)
  } catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }
}