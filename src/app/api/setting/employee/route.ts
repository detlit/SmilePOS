
import { NextResponse } from "next/server";
import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

export async function GET(request: NextRequest) {
    const searchParam=request.nextUrl.searchParams
    const id_company = Number(searchParam.get('id_company'))
    const company = searchParam.get('company') || ""
   // const code_product = searchParam.get('code_product') || ""
    const sort =searchParam.get('sort') || 'asc'
  const prisma = await getPrisma();
  
  // Build where condition based on provided parameters
  const whereCondition: any = {}
  if (id_company) {
    whereCondition.id_company = id_company
  }
  if (company) {
    whereCondition.company = company
  }
  
    const get =await prisma.settingEmployee.findMany({
      where: whereCondition,
      orderBy:{
        id: sort,  //เรียงลำดับ
      } as any,

    })
    return NextResponse.json(get)
}


/*
export async function POST(req: Request) {
  try{
    const {company,name,position,level,username,password} = await req.json()
const newUser = await prisma.settingEmployee.create({
  data: {

    
    company,name,position,level,username,password
    
  },
})
    return Response.json(newUser)
    
} catch (error) {
      return new Response(error as BodyInit , {
      status: 500,
    })
  }

}*/





import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
  const {company,name,position,level,username,password ,passwords ,id_company, mobile, timeIn, timeOut, salary, otRate  } = await req.json();
const prisma = await getPrisma();

  if (!username) return NextResponse.json({ error: "Username is required" }, { status: 400 });
  if (!password) return NextResponse.json({ error: "Password is required" }, { status: 400 });

  const exist = await prisma.settingEmployee.findUnique({ where: { username } });
  if (exist) return NextResponse.json({ error: "Username already used" }, { status: 400 });

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.settingEmployee.create({
    data: {company,name,position,level,username, password: hash,id_company,passwords, mobile: mobile || false, timeIn: timeIn || null, timeOut: timeOut || null, salary: salary ? Number(salary) : 0, otRate: otRate ? Number(otRate) : 0 },
  });

  return NextResponse.json({ id: user.id, username: user.username, name: user.name,company:user.company });
  } catch (error: any) {
    console.error("POST /api/setting/employee error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
