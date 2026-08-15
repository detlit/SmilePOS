import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}



export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const company = searchParam.get('company')
  const code = searchParam.get('code')
  const sort = searchParam.get('sort') || 'asc'
  const prisma = await getPrisma();
  const get = await prisma.labeldata.findMany({
    where:
    // whereCondition as any
    {
      company,
      code,
    }
    ,
    orderBy: {
      id: sort,  //เรียงลำดับ
    } as any,

  })

  /*
 
 
 const translator = new Translator({from: 'th', to: 'lo', forceBatch: false, tld: 'es'});
 const indicatorlistM = await translator.translate(String(get.map((a:any)=>a.indicatorlistS)[0]));
 const timeM = await translator.translate(String(get.map((a:any)=>a.timeS)[0]));
 const useM = await translator.translate(String(get.map((a:any)=>a.useS)[0]));
 const timeuseM = await translator.translate(String(get.map((a:any)=>a.timeuseS)[0]));
 const keepM = await translator.translate(String(get.map((a:any)=>a.keepS)[0]));
 const remarkM =await translator.translate(String(get.map((a:any)=>a.remarkS)[0]));
 
 
  const dd= [
   {
     "id": get.map((a:any)=>a.id)[0],
     "company": get.map((a:any)=>a.company)[0],
     "code": get.map((a:any)=>a.code)[0],
     "indicatorlistS":indicatorlistM.text,
     "timeS": timeM.text,
     "useS": useM.text,
     "timeuseS": timeuseM.text,
     "keepS": keepM.text,
     "remarkS":  remarkM.text
   }
 ]
 
 
 console.log(dd); // => 'gato'
 */

  return Response.json(get)






}





export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {

    const { company, code, indicatorlistS, timeS, useS, timeuseS, keepS, remarkS } = await req.json()
    const newUser = await prisma.labeldata.create({
      data: {
        company, code, indicatorlistS, timeS, useS, timeuseS, keepS, remarkS


      },

    })
    return Response.json(newUser)

  } catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }

}