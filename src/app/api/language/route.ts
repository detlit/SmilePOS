import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}


export async function GET(request: NextRequest) {
    const searchParam=request.nextUrl.searchParams
    const list=searchParam.get('list') || ''
    const company = searchParam.get('company')
    const sort =searchParam.get('sort') || 'asc'
const prisma = await getPrisma();
    const get =await prisma.label_language.findMany({
      where:     
         // whereCondition as any
       { 
       list:{
            contains:list,  //ค้นหาทุกตัวหรือระหว่าง
            mode: 'insensitive'  // ไม่ส่นใจตัวใหญ่ตัวเล็ก
              }      
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
    const {list} = await req.json()
const newUser = await prisma.label_language.create({
  data: {  
   list
    
  },
})
    return Response.json(newUser)
    
} catch (error) {
      return new Response(error as BodyInit , {
      status: 500,
    })
  }

}

