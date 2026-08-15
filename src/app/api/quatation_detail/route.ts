import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}


export async function GET(request: NextRequest) {
    const searchParam=request.nextUrl.searchParams
    const company = searchParam.get('company')
    const id_docmain = Number(searchParam.get('id_docmain')) 
    const prisma = await getPrisma();
    const get =await prisma.docDetail.findMany({
      where:     
         // whereCondition as any
       { 
        company,
        id_docmain,    
        }
      
    })
    return Response.json(get)
}



export async function POST(req: Request) {
  const prisma = await getPrisma();
  try{
   
    const body = await req.json()
    console.log('POST /api/quatation_detail body:', JSON.stringify(body))
    const { unit, qty,price,total,person ,company,id_product,code_product,name_product,id_docmain} = body
    const newUser = await prisma.docDetail.create({
    data: {  
         unit,
         qty: qty != null ? Number(qty) : null,
         price: price != null ? Number(price) : null,
         total: total != null ? Number(total) : null,
         person,
         company,
         id_product: id_product != null ? Number(id_product) : null,
         code_product,
         name_product,
         id_docmain: Number(id_docmain)
         },
    })
    return Response.json(newUser)
    
} catch (error) {
      console.error('POST /api/quatation_detail error:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Response.json({ error: message }, { status: 500 })
  }

}