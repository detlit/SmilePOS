
import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}
import { Translator } from 'google-translate-api-x';

export async function POST(req: Request) {
    const {sales,lg} = await req.json()

    let counts=sales.length
  


try{
 

      //ฉลาก No.1
const translator0 = new Translator({from: 'th', to: lg , forceBatch: false, tld: 'es'});
const indicatorlist0 = await translator0.translate(String(sales.map((a:any)=>a.indicatorlistS)[0]));
const time0 = await translator0.translate(String(sales.map((a:any)=>a.timeS)[0]));
const use0 = await translator0.translate(String(sales.map((a:any)=>a.useS)[0]));
const timeuse0 = await translator0.translate(String(sales.map((a:any)=>a.timeuseS)[0]));
const keep0 = await translator0.translate(String(sales.map((a:any)=>a.keepS)[0]));
const remark0 =await translator0.translate(String(sales.map((a:any)=>a.remarkS)[0]));


//ฉลาก No.2
const translator1 = new Translator({from: 'th', to: lg , forceBatch: false, tld: 'es'});
const indicatorlist1 = await translator1.translate(String(sales.map((a:any)=>a.indicatorlistS)[1]));
const time1 = await translator1.translate(String(sales.map((a:any)=>a.timeS)[1]));
const use1 = await translator1.translate(String(sales.map((a:any)=>a.useS)[1]));
const timeuse1 = await translator1.translate(String(sales.map((a:any)=>a.timeuseS)[1]));
const keep1 = await translator1.translate(String(sales.map((a:any)=>a.keepS)[1]));
const remark1 =await translator1.translate(String(sales.map((a:any)=>a.remarkS)[1]));

//ฉลาก No.3
const translator2 = new Translator({from: 'th', to: lg , forceBatch: false, tld: 'es'});
const indicatorlist2 = await translator2.translate(String(sales.map((a:any)=>a.indicatorlistS)[2]));
const time2 = await translator2.translate(String(sales.map((a:any)=>a.timeS)[2]));
const use2 = await translator2.translate(String(sales.map((a:any)=>a.useS)[2]));
const timeuse2 = await translator2.translate(String(sales.map((a:any)=>a.timeuseS)[2]));
const keep2 = await translator2.translate(String(sales.map((a:any)=>a.keepS)[2]));
const remark2 =await translator2.translate(String(sales.map((a:any)=>a.remarkS)[2]));

//ฉลาก No.4
const translator3 = new Translator({from: 'th', to: lg , forceBatch: false, tld: 'es'});
const indicatorlist3 = await translator3.translate(String(sales.map((a:any)=>a.indicatorlistS)[3]));
const time3 = await translator3.translate(String(sales.map((a:any)=>a.timeS)[3]));
const use3 = await translator3.translate(String(sales.map((a:any)=>a.useS)[3]));
const timeuse3 = await translator3.translate(String(sales.map((a:any)=>a.timeuseS)[3]));
const keep3 = await translator3.translate(String(sales.map((a:any)=>a.keepS)[3]));
const remark3 =await translator3.translate(String(sales.map((a:any)=>a.remarkS)[3]));

//ฉลาก No.5
const translator4 = new Translator({from: 'th', to: lg , forceBatch: false, tld: 'es'});
const indicatorlist4 = await translator4.translate(String(sales.map((a:any)=>a.indicatorlistS)[4]));
const time4 = await translator4.translate(String(sales.map((a:any)=>a.timeS)[4]));
const use4 = await translator4.translate(String(sales.map((a:any)=>a.useS)[4]));
const timeuse4 = await translator4.translate(String(sales.map((a:any)=>a.timeuseS)[4]));
const keep4 = await translator4.translate(String(sales.map((a:any)=>a.keepS)[4]));
const remark4 =await translator4.translate(String(sales.map((a:any)=>a.remarkS)[4]));

//ฉลาก No.6
const translator5 = new Translator({from: 'th', to: lg , forceBatch: false, tld: 'es'});
const indicatorlist5 = await translator5.translate(String(sales.map((a:any)=>a.indicatorlistS)[5]));
const time5 = await translator5.translate(String(sales.map((a:any)=>a.timeS)[5]));
const use5 = await translator5.translate(String(sales.map((a:any)=>a.useS)[5]));
const timeuse5 = await translator5.translate(String(sales.map((a:any)=>a.timeuseS)[5]));
const keep5 = await translator5.translate(String(sales.map((a:any)=>a.keepS)[5]));
const remark5 =await translator5.translate(String(sales.map((a:any)=>a.remarkS)[5]));

//ฉลาก No.7
const translator6 = new Translator({from: 'th', to: lg , forceBatch: false, tld: 'es'});
const indicatorlist6 = await translator6.translate(String(sales.map((a:any)=>a.indicatorlistS)[6]));
const time6 = await translator6.translate(String(sales.map((a:any)=>a.timeS)[6]));
const use6 = await translator6.translate(String(sales.map((a:any)=>a.useS)[6]));
const timeuse6 = await translator6.translate(String(sales.map((a:any)=>a.timeuseS)[6]));
const keep6 = await translator6.translate(String(sales.map((a:any)=>a.keepS)[6]));
const remark6 =await translator6.translate(String(sales.map((a:any)=>a.remarkS)[6]));





 const dd= [
  {
    "id": sales.map((a:any)=>a.id_product)[0],
    "company": sales.map((a:any)=>a.company)[0],
    "code":sales.map((a:any)=>a.code_product)[0],
    "indicatorlistS":indicatorlist0.text,
    "timeS": time0.text,
    "useS": use0.text,
    "timeuseS": timeuse0.text,
    "keepS": keep0.text,
    "remarkS":  sales.map((a:any)=>a.remarkS)[0]==null?"":remark0.text
  },  
  {
    "id": sales.map((a:any)=>a.id_product)[1],
    "company": sales.map((a:any)=>a.company)[1],
    "code":sales.map((a:any)=>a.code_product)[1],
    "indicatorlistS":indicatorlist1.text,
    "timeS": time1.text,
    "useS": use1.text,
    "timeuseS": timeuse1.text,
    "keepS": keep1.text,
    "remarkS":  sales.map((a:any)=>a.remarkS)[1]==null?"":remark1.text
  },  
  {
    "id": sales.map((a:any)=>a.id_product)[2],
    "company": sales.map((a:any)=>a.company)[2],
    "code":sales.map((a:any)=>a.code_product)[2],
    "indicatorlistS":indicatorlist2.text,
    "timeS": time2.text,
    "useS": use2.text,
    "timeuseS": timeuse2.text,
    "keepS": keep2.text,
    "remarkS":  sales.map((a:any)=>a.remarkS)[2]==null?"":remark2.text
  },  
  {
    "id": sales.map((a:any)=>a.id_product)[3],
    "company": sales.map((a:any)=>a.company)[3],
    "code":sales.map((a:any)=>a.code_product)[3],
    "indicatorlistS":indicatorlist3.text,
    "timeS": time3.text,
    "useS": use3.text,
    "timeuseS": timeuse3.text,
    "keepS": keep3.text,
    "remarkS":  sales.map((a:any)=>a.remarkS)[3]==null?"":remark3.text
  },  
  {
    "id": sales.map((a:any)=>a.id_product)[4],
    "company": sales.map((a:any)=>a.company)[4],
    "code":sales.map((a:any)=>a.code_product)[4],
    "indicatorlistS":indicatorlist4.text,
    "timeS": time4.text,
    "useS": use4.text,
    "timeuseS": timeuse4.text,
    "keepS": keep4.text,
    "remarkS":  sales.map((a:any)=>a.remarkS)[4]==null?"":remark4.text
  },  
  {
    "id": sales.map((a:any)=>a.id_product)[5],
    "company": sales.map((a:any)=>a.company)[5],
    "code":sales.map((a:any)=>a.code_product)[5],
    "indicatorlistS":indicatorlist5.text,
    "timeS": time5.text,
    "useS": use5.text,
    "timeuseS": timeuse5.text,
    "keepS": keep5.text,
    "remarkS":  sales.map((a:any)=>a.remarkS)[5]==null?"":remark5.text
  },  
  {
    "id": sales.map((a:any)=>a.id_product)[6],
    "company": sales.map((a:any)=>a.company)[6],
    "code":sales.map((a:any)=>a.code_product)[6],
    "indicatorlistS":indicatorlist6.text,
    "timeS": time6.text,
    "useS": use6.text,
    "timeuseS": timeuse6.text,
    "keepS": keep6.text,
    "remarkS":  sales.map((a:any)=>a.remarkS)[6]==null?"":remark6.text
  }
 

]

console.log(counts);

console.log(dd);
    
return Response.json("")

    
    
} catch (error) {
      return new Response(error as BodyInit , {
      status: 500,
    })
  }

}