import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}


export async function GET(request: NextRequest) {
    const searchParam=request.nextUrl.searchParams
    const company = searchParam.get('company')
    const id_salemain = Number(searchParam.get('id_salemain'))
    const sort =searchParam.get('sort') || 'asc'
  const prisma = await getPrisma();
    const get =await prisma.sale.findMany({
      where:     
         // whereCondition as any
       { 
        company,
        id_salemain,
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
   
    const {sales,companyall,id_costomer,code_costomer,group_price,pay,bill,totalall,discount,sumtotal,addreward,usereward ,personall,statussall} = await req.json()
    const newUser = await prisma.saleMain.create({
    data: {  
        companyall,id_costomer,code_costomer,group_price,pay,bill,totalall,discount,sumtotal,addreward,usereward ,personall,statussall,
        
        sales: {
        create: sales
            },
         },
        include: {
             sales: true,
         },
    })
    return Response.json(newUser)
    
} catch (error) {
      return new Response(error as BodyInit , {
      status: 500,
    })
  }

}