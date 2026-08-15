
import { NextResponse } from "next/server";
import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

import { signToken } from "../../../../lib/jwt";
import bcrypt from "bcryptjs";


export async function POST(req: Request) {
  const { username, password } = await req.json();
  const prisma = await getPrisma();
  const usernameInput = String(username || "").trim();
  const user = await prisma.settingEmployee.findUnique({ where: { username: usernameInput } })
    || await prisma.settingEmployee.findFirst({
      where: { username: { equals: usernameInput, mode: "insensitive" } },
    });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 400 });

  if (!user.password) {
    return NextResponse.json({ error: "Password not set" }, { status: 400 });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) return NextResponse.json({ error: "password ไม่ถูกต้อง" }, { status: 400 });

  const token = signToken({ id: user.id, company:user.company, username: user.username,level:user.level,idcompany:user.id_company, mobile: user.mobile });

  return NextResponse.json({ token });
}
