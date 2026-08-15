import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const idcompany = request.nextUrl.searchParams.get("idcompany") || "";
  try {
    let config = await (prisma as any).leaveConfig.findFirst({ where: { idcompany } });
    if (!config) {
      config = await (prisma as any).leaveConfig.create({
        data: { idcompany, vacationDays: 6, personalDays: 3, sickDays: 30, lateLimit: 3, workStartTime: "08:30" }
      });
    }
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idcompany, vacationDays, personalDays, sickDays, lateLimit, workStartTime } = body;
    const existing = await (prisma as any).leaveConfig.findFirst({ where: { idcompany } });
    let config;
    if (existing) {
      config = await (prisma as any).leaveConfig.update({
        where: { id: existing.id },
        data: { vacationDays, personalDays, sickDays, lateLimit, workStartTime }
      });
    } else {
      config = await (prisma as any).leaveConfig.create({
        data: { idcompany, vacationDays, personalDays, sickDays, lateLimit, workStartTime }
      });
    }
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
