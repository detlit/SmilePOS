import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}


export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const names = searchParam.get('names') || ''
  const code = searchParam.get('code') || ''
  const tel = searchParam.get('tel') || ''
  const company = searchParam.get('company')
  const sort = searchParam.get('sort') || 'asc'

  /*     //----- ต้องกด fontend ถึงส่ง------
     let whereCondition =company ? 
         {
           company,
              names:{
                     contains:names,  //ค้นหาทุกตัวหรือระหว่าง
                     mode: 'insensitive'  // ไม่ส่นใจตัวใหญ่ตัวเล็ก
                   }   
         } :{
              names:{
                     contains:names,  //ค้นหาทุกตัวหรือระหว่าง
                     mode: 'insensitive'  // ไม่ส่นใจตัวใหญ่ตัวเล็ก
                   }                   
         }*/
  const prisma = await getPrisma();
  const get = await prisma.receive.findMany({
    include: {
      confirmRecord: true,
    },
    where:
    // whereCondition as any
    {
      company,
      names: {
        contains: names,  //ค้นหาทุกตัวหรือระหว่าง
        mode: 'insensitive'  // ไม่ส่นใจตัวใหญ่ตัวเล็ก
      },
      code: {
        contains: code,  //ค้นหาทุกตัวหรือระหว่าง
        mode: 'insensitive'  // ไม่ส่นใจตัวใหญ่ตัวเล็ก
      },

    }
    ,
    orderBy: {
      id: sort,  //เรียงลำดับ
    } as any,

  })
  return Response.json(get)
}




export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const { company, code, names, invoice_No, order_date, receive_date, tax_date, pay_date, statuss, codenames, orderNo, orderfull, persons } = await req.json()
    const newUser = await prisma.receive.create({
      data: {
        company, code, names, invoice_No, order_date, receive_date, tax_date, pay_date, statuss, codenames, orderNo, orderfull, persons

      },
    })
    return Response.json(newUser)

  } catch (error) {
    return new Response(error as BodyInit, {
      status: 500,
    })
  }

}