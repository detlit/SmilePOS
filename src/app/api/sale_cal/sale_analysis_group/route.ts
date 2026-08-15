import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}



export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const company = searchParam.get('company')
  const startMonth = searchParam.get('startMonth') || ''
  const current = searchParam.get('current') || ''
  const sort = searchParam.get('sort') || 'asc'
  const d = new Date(current + "T23:59:59.999+07:00");
  const d1 = new Date(startMonth + "T00:00:00.000+07:00");

  //   console.log(d1)

  const prisma = await getPrisma();
  const get = await prisma.sale.findMany({
    where:
    // whereCondition as any
    {
      company,
      statuss: "OK",
      createDate: {

        lte: d,
        gte: d1,
      },
    }
    ,
    orderBy: {
      id: sort,  //เรียงลำดับ
    } as any,

  })



  /*
  let groupByLocation = get.filter((obj,index,self)=> 
                  index===self.findIndex((t)=> (
                      t.code_product===obj.code_product 
                  )))*/

  var result: String[] = [];

  get.reduce(function (res: any, value: any, name: any) {
    if (!res[value.cetagory]) {
      res[value.cetagory] = { Id: value.cetagory, total: 0, qty: 0 };
      result.push(res[value.cetagory]);

    }
    res[value.cetagory].total += value.total;
    res[value.cetagory].qty += value.qty;
    res[value.cetagory].name = value.name_product;

    return res;
  }, {});

  const ranksales = result.sort((a: any, b: any) => b.total - a.total);
  const ranksaleE = [
    ranksales[0] == null ? "" : ranksales[0],
    ranksales[1] == null ? "" : ranksales[1],
    ranksales[2] == null ? "" : ranksales[2],
    ranksales[3] == null ? "" : ranksales[3],
    ranksales[4] == null ? "" : ranksales[4],
    ranksales[5] == null ? "" : ranksales[5],
    ranksales[6] == null ? "" : ranksales[6],
    ranksales[7] == null ? "" : ranksales[7],
    ranksales[8] == null ? "" : ranksales[8],
    ranksales[9] == null ? "" : ranksales[9],
    ranksales[10] == null ? "" : ranksales[10],
    ranksales[11] == null ? "" : ranksales[11]


  ]
  const ranksale = ranksaleE.filter((s: any) => s.Id != null)


  //console.log(ranksale)
  return Response.json(ranksale)

}