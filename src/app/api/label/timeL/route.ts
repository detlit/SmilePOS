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
    const get =await prisma.timeL.findMany({
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
   
    const {company,list,list_lo,list_my,list_km,list_zh,list_eng} = await req.json()
    const newUser = await prisma.timeL.create({
    data: {  
        company,list,list_lo,list_my,list_km,list_zh,list_eng
        

         },
       
    })
    return Response.json(newUser)
    
} catch (error) {
      return new Response(error as BodyInit , {
      status: 500,
    })
  }

}