
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
  const { email, password } = await req.json();
const prisma = await getPrisma();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 400 });

  if (!user.password) {
    return NextResponse.json({ error: "Password not set" }, { status: 400 });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) return NextResponse.json({ error: "password ไม่ถูกต้อง" }, { status: 400 });

  const token = signToken({ id: user.id, email: user.email });

  return NextResponse.json({ token });
}
