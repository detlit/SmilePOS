import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}


export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const companyall = searchParam.get('companyall')
  const id_costomer = searchParam.get('id_costomer') || ''
  const createDate = searchParam.get('createDate') || ''
  const sort = searchParam.get('sort') || 'desc'

  // createDate is expected in YYYY-MM-DD local format
  const startDate = new Date(createDate + "T00:00:00.000+07:00");
  const endDate = new Date(createDate + "T23:59:59.999+07:00");

  const prisma = await getPrisma();
  const get = await prisma.saleMain.findMany({
    where:
    {
      companyall,
      createDate: {
        gte: startDate,
        lte: endDate,
      },
    }
    ,
    orderBy: {
      id: sort,  //เรียงลำดับ
    } as any,
    include: {
      sales: true
    }

  })
  return Response.json(get)
}




export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {

    const { historys, sales, companyall, id_costomer, code_costomer, group_price, pay, bill, totalall, discount, memberDiscount, memberDiscountPercent, sumtotal, addreward, usereward, personall, statussall, orderNo, transferDetail, cashAmount, transferAmount, serviceCharge, serviceChargePercent, discountReason, vatAmount, beforeVat, vatEnabled, taxInvoiceNo: preGenTaxNo } = await req.json()

    // กันบิลเบิ้ล: orderNo ถูกสร้างครั้งเดียวต่อบิล (ล้างเมื่อตะกร้าว่าง) ดังนั้นถ้ามีบิล
    // orderNo เดิมของร้านเดิมถูกบันทึกไปแล้วใน 10 นาทีที่ผ่านมา แสดงว่าเป็นการกดชำระซ้ำ
    // → คืนบิลเดิมพร้อม flag duplicated แทนการสร้างบิลใหม่
    if (orderNo && companyall) {
      const existing = await prisma.saleMain.findFirst({
        where: {
          companyall,
          orderNo,
          totalall: Number(totalall) || 0,
          createDate: { gte: new Date(Date.now() - 10 * 60 * 1000) },
        },
        orderBy: { id: 'desc' },
        include: { sales: true, historys: true },
      })
      if (existing) {
        console.warn(`[Sale API] Duplicate submit blocked: orderNo=${orderNo} company=${companyall} existingId=${existing.id}`)
        return Response.json({ ...existing, duplicated: true })
      }
    }

    // Use pre-generated taxInvoiceNo if provided, otherwise generate new one
    let taxInvoiceNo = ""
    if (vatEnabled === "true") {
      if (preGenTaxNo) {
        taxInvoiceNo = preGenTaxNo
      } else {
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
        taxInvoiceNo = `${prefix}${String(running).padStart(4, '0')}`
      }
    }

    const newUser = await (prisma.saleMain.create as any)({
      data: {
        companyall, id_costomer, code_costomer, group_price, pay, bill, totalall, discount, memberDiscount: Number(memberDiscount || 0), memberDiscountPercent: Number(memberDiscountPercent || 0), sumtotal, addreward, usereward, personall, statussall, orderNo, transferDetail, cashAmount, transferAmount, serviceCharge: Number(serviceCharge || 0), serviceChargePercent: Number(serviceChargePercent || 0), discountReason,
        taxInvoiceNo, vatAmount: vatAmount || 0, beforeVat: beforeVat || 0,

        sales: {
          create: sales
        },
        historys: {
          create: historys
        }
      },
      include: {
        sales: true,
        historys: true,
      },
    })

    // 🔔 Telegram notification (fire-and-forget)
    import('@/lib/telegram/notifier')
      .then(m => m.notifySaleCreated(newUser.id))
      .catch(e => console.error('[Telegram] notifySaleCreated failed:', e))

    return Response.json(newUser)

  } catch (error) {
    console.error("Sale API Error:", error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

}