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
    const get =await prisma.settingStore.findMany({
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
    const {company, namestore, address, tel, lineid, taxnumber, publiclogo, publicline, vatEnabled, vatRate, branchName, branchCode, blockNegativeStockSale, expiryColorRules, costPriceMode} = await req.json()
const newUser = await prisma.settingStore.create({
  data: {   
     company, namestore, address, tel, lineid, taxnumber, publiclogo, publicline, vatEnabled, vatRate, branchName, branchCode, blockNegativeStockSale, expiryColorRules, costPriceMode
  } as any,
})
    return Response.json(newUser)
    
} catch (error) {
    console.error("POST /api/setting/store/store error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal Server Error", 
      details: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

}

  //company, namestore, address, tel, lineid, taxnumber, publiclogo, publicline