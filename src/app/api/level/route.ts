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
    const get =await prisma.mainLevel.findMany({
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
    const body = await req.json()
    const { mainlevel, levelId } = body || {}

    // Append missing rows to an existing Level parent
    if (levelId && Array.isArray(mainlevel) && mainlevel.length > 0) {
      const created = await prisma.mainLevel.createMany({
        data: mainlevel.map((m: any) => ({
          company: m.company ?? null,
          codename: m.codename ?? "",
          main: m.main ?? "",
          list: m.list ?? "",
          level1: m.level1 ?? true,
          level2: m.level2 ?? true,
          level3: m.level3 ?? true,
          levelId: Number(levelId),
        })),
      })
      return Response.json(created)
    }

const newUser = await prisma.level.create({
  data: {
         mainlevel: {
          create: mainlevel,
        }
  },
})
    return Response.json(newUser)
    
} catch (error) {
      return new Response(error as BodyInit , {
      status: 500,
    })
  }

}