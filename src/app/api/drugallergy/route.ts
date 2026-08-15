import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}



export async function GET(request: NextRequest) {
    const searchParam=request.nextUrl.searchParams
    const id_cus=Number(searchParam.get('id_cus'))
    const company = searchParam.get('company')
    const sort =searchParam.get('sort') || 'asc'
const prisma = await getPrisma();
    const get =await prisma.drugallergy.findMany({
      where:     
         // whereCondition as any
       { 
        company,
       id_cus, 
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
 const {company,drugallergy,remark,id_cus} = await req.json()
 const newUse = await prisma.drugallergy.create({
  data: {  company,drugallergy,remark,id_cus }
      
})
    return Response.json(newUse)
    
} catch (error) {
      return new Response(error as BodyInit , {
      status: 500,
    })
  }

}

