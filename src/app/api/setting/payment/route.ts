import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

const normalizeNullableString = (value: unknown) => {
  const text = String(value ?? "").trim()
  return text === "" ? null : text
}



export async function GET(request: NextRequest) {
    const searchParam=request.nextUrl.searchParams
    const company = searchParam.get('company')
   // const code_product = searchParam.get('code_product') || ""
    const sort =searchParam.get('sort') || 'asc'
  const prisma = await getPrisma();
    const get =await prisma.settingpayment.findMany({
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
    const company = normalizeNullableString(body.company)
    const bank = normalizeNullableString(body.bank)
    const name = normalizeNullableString(body.name)
    const bookbankno = normalizeNullableString(body.bookbankno)
    const promtpayno = normalizeNullableString(body.promtpayno)
    const publicId = normalizeNullableString(body.publicId)

    const newUser = await prisma.settingpayment.create({
      data: {
        company,
        bank,
        name,
        bookbankno,
        promtpayno,
        publicId,
      },
    })
    return Response.json(newUser)
    
} catch (error) {
      console.error('POST /api/setting/payment error:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Response.json({ error: message }, { status: 500 })
  }

}

