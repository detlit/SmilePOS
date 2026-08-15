import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

export async function GET(request: NextRequest) {
    const searchParam=request.nextUrl.searchParams
    const company = searchParam.get('company')
   // const code_product = searchParam.get('code_product') || ""
    const sort =searchParam.get('sort') || 'asc'
  const prisma = await getPrisma();
    const get =await prisma.gifts.findMany({
      where:     
         // whereCondition as any
       { 
        company,
     //   code_product,
        }
      ,
      orderBy:{
        id: sort,  //เรียงลำดับ
      } as any,

    })
    return Response.json(get)
}


export async function POST(req: Request) {
  const prisma = await getPrisma();
  try{

    const {company,code_product,id_product,name_product,gift,person,} = await req.json()

    const codeProduct = String(code_product ?? "").trim()
    const giftValue = Number(gift)

    if (!company || !codeProduct) {
      return Response.json({ message: "กรุณาระบุบริษัทและรหัสสินค้า" }, { status: 400 })
    }
    if (!Number.isFinite(giftValue) || giftValue < 0) {
      return Response.json({ message: "ค่าหยิบต้องเป็นตัวเลข และห้ามติดลบ" }, { status: 400 })
    }

    // 1 สินค้า = 1 รายการค่าหยิบต่อบริษัท ถ้ามีอยู่แล้วให้แก้ไขค่าเดิม ไม่เพิ่มรายการซ้ำ
    const existing = await prisma.gifts.findFirst({
      where: { company, code_product: codeProduct },
      orderBy: { id: 'asc' },
    })

    if (existing) {
      const updated = await prisma.gifts.update({
        where: { id: existing.id },
        data: { id_product, name_product, gift: giftValue, person },
      })
      return Response.json({ ...updated, mode: "updated", previous_gift: existing.gift })
    }

    const newUser = await prisma.gifts.create({
    data: {
        company,code_product: codeProduct,id_product,name_product,gift: giftValue,person,


         },

    })
    return Response.json({ ...newUser, mode: "created" })

} catch (error) {
      return new Response(error as BodyInit , {
      status: 500,
    })
  }

}