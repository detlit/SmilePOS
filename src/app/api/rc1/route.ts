import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}




export async function PUT( req: Request) {
       const { sales_lot }= await req.json()
   const prisma = await getPrisma();
  try {
 
    // ข้าม slot ที่ไม่มี lot (id_receive = 0) — เดิมถ้ารายการใดไม่มี lot จะทำให้ update ล้มเหลว
    // ทั้ง transaction แล้วบิลทั้งใบไม่ถูกตัดสต็อกเลย
    const Up1= await prisma.$transaction(async (prisma:any) => {
    for (const list of sales_lot){
       if (!Number(list.id_receive1)) continue
       await prisma.rCitemlist.update({
          where: { id: list.id_receive1 },
          data:
                {
                    sale:list.sale_lot1,
                    balance:list.balance_lot1
                }
            })
            }
        })
    const Up2= await prisma.$transaction(async (prisma:any) => {
    for (const list of sales_lot){
       if (!Number(list.id_receive2)) continue
       await prisma.rCitemlist.update({
          where: { id: list.id_receive2 },
          data:
                {
                    sale:list.sale_lot2,
                    balance:list.balance_lot2
                }
            })
            }
        })
    const Up3= await prisma.$transaction(async (prisma:any) => {
    for (const list of sales_lot){
       if (!Number(list.id_receive3)) continue
       await prisma.rCitemlist.update({
          where: { id: list.id_receive3 },
          data:
                {
                    sale:list.sale_lot3,
                    balance:list.balance_lot3
                }
            })
            }
        })
    return  Response.json(Up1),Response.json(Up2),Response.json(Up3)
 
  } catch (error) {
    return new Response(error as BodyInit, {
      status: 500,
    })
  }
}
