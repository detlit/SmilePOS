import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

const normalizeMemberDiscountPercent = (value: unknown) => {
  const numericValue = Number(value ?? 2)
  if (!Number.isFinite(numericValue)) return 2
  return Math.min(100, Math.max(0, numericValue))
}

const normalizeMemberDiscountEnabled = (value: unknown) => {
  if (value === undefined || value === null || value === "") return false
  if (typeof value === "boolean") return value
  return String(value) === "true"
}


export async function GET(request: NextRequest) {
    const searchParam=request.nextUrl.searchParams
    const company = searchParam.get('company')
   // const code_product = searchParam.get('code_product') || ""
    const sort =searchParam.get('sort') || 'asc'
  const prisma = await getPrisma();
    const get =await prisma.settingpoint.findMany({
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
    const {company,sale,pointeq,pointset,discount,status,memberDiscountPercent,memberDiscountEnabled} = await req.json()
const newUser = await prisma.settingpoint.create({
  data: {   
     company,
     sale,
     pointeq,
     pointset,
     discount,
     status,
     memberDiscountPercent: normalizeMemberDiscountPercent(memberDiscountPercent),
     memberDiscountEnabled: normalizeMemberDiscountEnabled(memberDiscountEnabled)
  },
})
    return Response.json(newUser)
    
} catch (error) {
      return new Response(error as BodyInit , {
      status: 500,
    })
  }

}

