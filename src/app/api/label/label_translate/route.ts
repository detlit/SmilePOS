import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

import { Translator } from 'google-translate-api-x';


export async function GET(request: NextRequest) {
    const searchParam=request.nextUrl.searchParams
    const company = searchParam.get('company')
     const code = searchParam.get('code')
    const sort =searchParam.get('sort') || 'asc'
  const prisma = await getPrisma();
    const get =await prisma.labeldata.findMany({
      where:     
         // whereCondition as any
       { 
        company,
        code,
        }
      ,
      orderBy:{
        id: sort,  //เรียงลำดับ
      } as any,

    })

 


const translator = new Translator({from: 'th', to: 'my', forceBatch: false, tld: 'es'});
const indicatorlistM = await translator.translate(String(get.map((a:any)=>a.indicatorlistS)[0]));
const timeM = await translator.translate(String(get.map((a:any)=>a.timeS)[0]));
const useM = await translator.translate(String(get.map((a:any)=>a.useS)[0]));
const timeuseM = await translator.translate(String(get.map((a:any)=>a.timeuseS)[0]));
const keepM = await translator.translate(String(get.map((a:any)=>a.keepS)[0]));
const remarkM =await translator.translate(String(get.map((a:any)=>a.remarkS)[0]));

const translatorL = new Translator({from: 'th', to: 'lo', forceBatch: false, tld: 'es'});
const indicatorlistL = await translatorL.translate(String(get.map((a:any)=>a.indicatorlistS)[0]));
const timeL = await translatorL.translate(String(get.map((a:any)=>a.timeS)[0]));
const useL = await translatorL.translate(String(get.map((a:any)=>a.useS)[0]));
const timeuseL = await translatorL.translate(String(get.map((a:any)=>a.timeuseS)[0]));
const keepL = await translatorL.translate(String(get.map((a:any)=>a.keepS)[0]));
const remarkL =await translatorL.translate(String(get.map((a:any)=>a.remarkS)[0]));

const translatorU = new Translator({from: 'th', to: 'en', forceBatch: false, tld: 'es'});
const indicatorlistU = await translatorU.translate(String(get.map((a:any)=>a.indicatorlistS)[0]));
const timeU = await translatorU.translate(String(get.map((a:any)=>a.timeS)[0]));
const useU = await translatorU.translate(String(get.map((a:any)=>a.useS)[0]));
const timeuseU = await translatorU.translate(String(get.map((a:any)=>a.timeuseS)[0]));
const keepU = await translatorU.translate(String(get.map((a:any)=>a.keepS)[0]));
const remarkU =await translatorU.translate(String(get.map((a:any)=>a.remarkS)[0]));

const translatorC = new Translator({from: 'th', to: 'zh-CN', forceBatch: false, tld: 'es'});
const indicatorlistC = await translatorC.translate(String(get.map((a:any)=>a.indicatorlistS)[0]));
const timeC = await translatorC.translate(String(get.map((a:any)=>a.timeS)[0]));
const useC = await translatorC.translate(String(get.map((a:any)=>a.useS)[0]));
const timeuseC = await translatorC.translate(String(get.map((a:any)=>a.timeuseS)[0]));
const keepC = await translatorC.translate(String(get.map((a:any)=>a.keepS)[0]));
const remarkC =await translatorC.translate(String(get.map((a:any)=>a.remarkS)[0]));

const translatorK = new Translator({from: 'th', to: 'km', forceBatch: false, tld: 'es'});
const indicatorlistK = await translatorK.translate(String(get.map((a:any)=>a.indicatorlistS)[0]));
const timeK = await translatorK.translate(String(get.map((a:any)=>a.timeS)[0]));
const useK = await translatorK.translate(String(get.map((a:any)=>a.useS)[0]));
const timeuseK = await translatorK.translate(String(get.map((a:any)=>a.timeuseS)[0]));
const keepK = await translatorK.translate(String(get.map((a:any)=>a.keepS)[0]));
const remarkK =await translatorK.translate(String(get.map((a:any)=>a.remarkS)[0]));


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
    "remarkS":  get.map((a:any)=>a.remarkS)[0]==null?"":remarkM.text
  },  
  {
    "id": get.map((a:any)=>a.id)[0],
    "company": get.map((a:any)=>a.company)[0],
    "code": get.map((a:any)=>a.code)[0],
    "indicatorlistS":indicatorlistL.text,
    "timeS": timeL.text,
    "useS": useL.text,
    "timeuseS": timeuseL.text,
    "keepS": keepL.text,
    "remarkS":  get.map((a:any)=>a.remarkS)[0]==null?"":remarkL.text
  },  
  {
    "id": get.map((a:any)=>a.id)[0],
    "company": get.map((a:any)=>a.company)[0],
    "code": get.map((a:any)=>a.code)[0],
    "indicatorlistS":indicatorlistU.text,
    "timeS": timeU.text,
    "useS": useU.text,
    "timeuseS": timeuseU.text,
    "keepS": keepU.text,
    "remarkS":  get.map((a:any)=>a.remarkS)[0]==null?"":remarkU.text
  },  
  {
    "id": get.map((a:any)=>a.id)[0],
    "company": get.map((a:any)=>a.company)[0],
    "code": get.map((a:any)=>a.code)[0],
    "indicatorlistS":indicatorlistC.text,
    "timeS": timeC.text,
    "useS": useC.text,
    "timeuseS": timeuseC.text,
    "keepS": keepC.text,
    "remarkS":  get.map((a:any)=>a.remarkS)[0]==null?"":remarkC.text
  },  
  {
    "id": get.map((a:any)=>a.id)[0],
    "company": get.map((a:any)=>a.company)[0],
    "code": get.map((a:any)=>a.code)[0],
    "indicatorlistS":indicatorlistK.text,
    "timeS": timeK.text,
    "useS": useK.text,
    "timeuseS": timeuseK.text,
    "keepS": keepK.text,
    "remarkS":  get.map((a:any)=>a.remarkS)[0]==null?"":remarkK.text
  }
 

]


//console.log(dd); // => 'gato'


return Response.json(dd)
  





}





export async function POST(req: Request) {
  const prisma = await getPrisma();
  try{
   
    const {company, code, indicatorlistS, timeS, useS, timeuseS, keepS, remarkS} = await req.json()
    const newUser = await prisma.labeldata.create({
    data: {  
        company, code, indicatorlistS, timeS, useS, timeuseS, keepS, remarkS
        

         },
       
    })
    return Response.json(newUser)
    
} catch (error) {
      return new Response(error as BodyInit , {
      status: 500,
    })
  }

}