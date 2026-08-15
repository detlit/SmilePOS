
import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}


export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const company = searchParam.get('company')
  const monthyear = searchParam.get('monthyear')
  const sort = searchParam.get('sort') || 'asc'
  const prisma = await getPrisma();
  const get = await prisma.pL.findMany({
    where:
    // whereCondition as any
    {
      company,
      monthyear,
    }
    ,
    orderBy: {
      id: sort,  //เรียงลำดับ
    } as any,

  })
  return Response.json(get)
}



import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  const logFile = path.join(process.cwd(), 'debug_pl.log');

  try {
    const body = await req.json();
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] POST body: ${JSON.stringify(body)}\n`);

    const prisma = await getPrisma();

    const { company, month, year, monthyear,
      R4000, R4001, R4002,
      C5000, C5001,
      S6000, S6001, S6002, S6003, S6004, S6005, S6006, S6007, S6008, S6009, S6010,
      A7000, A7001, A7002, A7003, A7004, A7005, A7006, A7007 } = body;

    const safeNum = (val: any) => {
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    const data = {
      company: company ? String(company) : null,
      month: month ? String(month) : null,
      year: year ? String(year) : null,
      monthyear: monthyear ? String(monthyear) : null,
      R4000: safeNum(R4000), R4001: safeNum(R4001), R4002: safeNum(R4002),
      C5000: safeNum(C5000), C5001: safeNum(C5001),
      S6000: safeNum(S6000), S6001: safeNum(S6001), S6002: safeNum(S6002), S6003: safeNum(S6003), S6004: safeNum(S6004), S6005: safeNum(S6005), S6006: safeNum(S6006), S6007: safeNum(S6007), S6008: safeNum(S6008), S6009: safeNum(S6009), S6010: safeNum(S6010),
      A7000: safeNum(A7000), A7001: safeNum(A7001), A7002: safeNum(A7002), A7003: safeNum(A7003), A7004: safeNum(A7004), A7005: safeNum(A7005), A7006: safeNum(A7006), A7007: safeNum(A7007)
    };

    const newUser = await prisma.pL.create({ data });
    return Response.json(newUser);

  } catch (error: any) {
    const errorMsg = `[${new Date().toISOString()}] POST error: ${error.stack || error.message}\n`;
    console.error(errorMsg);
    fs.appendFileSync(logFile, errorMsg);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// company,name_promotion,customer,conditionid,condition,startdate,enddate,unit,pay_condition,discount,status,person