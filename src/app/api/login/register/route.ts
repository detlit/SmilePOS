
import { NextResponse } from "next/server";
import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}



/*
export async function POST(req: Request) {

  try{
    const {name , company , tel, lineid , email , password , level, status , enddate } = await req.json()
const newUser = await prisma.user.create({
  data: { name , company , tel, lineid , email , password , level, status , enddate    },
})
    return Response.json(newUser)
    
} catch (error) {
      return new Response(error as BodyInit , {
      status: 500,
    })
  }

}
*/
// name , company , tel, lineid , email , password , level, status , enddate 

import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_SIGNUP_PASSWORD = "Dui09510665";
const ADMIN_EMPLOYEE_PASSWORD = "admin";
const ADMIN_TRIAL_YEARS = 100;

export async function POST(req: Request) {
  const {name , company , tel, lineid , email , password , status , enddate,employees  } = await req.json();
  const prisma = await getPrisma();

  const inputEmail = String(email || "").trim();
  const inputPassword = String(password || "");
  const isPrivilegedAdmin = inputEmail.toLowerCase() === ADMIN_EMAIL && inputPassword === ADMIN_SIGNUP_PASSWORD;
  const userEmail = isPrivilegedAdmin ? ADMIN_EMAIL : inputEmail;
  const employeeLoginPassword = isPrivilegedAdmin ? ADMIN_EMPLOYEE_PASSWORD : inputPassword;

  const longTermEnddate = new Date();
  longTermEnddate.setFullYear(longTermEnddate.getFullYear() + ADMIN_TRIAL_YEARS);

  const userEnddate = isPrivilegedAdmin ? longTermEnddate : enddate;
  const firstEmployee = Array.isArray(employees) && employees.length > 0 ? employees[0] : {};

  const existUser = await prisma.user.findUnique({ where: { email: userEmail } });
  if (existUser) return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 400 });

  // Check SettingEmployee.username uniqueness (same email is used as username)
  const existEmployee = await prisma.settingEmployee.findUnique({ where: { username: userEmail } });
  if (existEmployee) return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 400 });

  const [hash, employeeHash] = await Promise.all([
    bcrypt.hash(inputPassword, 10),
    bcrypt.hash(employeeLoginPassword, 10),
  ]);

  const user = await prisma.user.create({
    data: { email: userEmail, password: hash, name , company , tel, lineid, status , enddate: userEnddate,
     
        employees: {
        create: {
          company: firstEmployee.company ?? company,
          name: firstEmployee.name ?? name,
          position: firstEmployee.position ?? "เจ้าของกิจการ",
          level: firstEmployee.level ?? "level2",
          username: userEmail,
          password: employeeHash,
          passwords: employeeLoginPassword,
        }
            },        
         },
        include: {
             employees: true
         }, 
    
    
  });

  return NextResponse.json({ id: user.id, email: user.email, name: user.name,company:user.company });
}