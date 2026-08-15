import { NextRequest, NextResponse } from "next/server";

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get("company");

    const prisma = await getPrisma();
    let setting = await (prisma as any).temperatureSetting.findFirst({
      where: { company: company || undefined },
    });

    if (!setting) {
      setting = await (prisma as any).temperatureSetting.create({
        data: {
          company,
          roomTempMin: 0,
          roomTempMax: 30,
          roomHumidMin: 30,
          roomHumidMax: 50,
          fridgeTempMin: 2,
          fridgeTempMax: 8,
        },
      });
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error("Error fetching temperature setting:", error);
    return NextResponse.json({ error: "Failed to fetch setting" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company, roomTempMin, roomTempMax, roomHumidMin, roomHumidMax, fridgeTempMin, fridgeTempMax } = body;

    const prisma = await getPrisma();
    const existing = await (prisma as any).temperatureSetting.findFirst({
      where: { company },
    });

    let setting;
    if (existing) {
      setting = await (prisma as any).temperatureSetting.update({
        where: { id: existing.id },
        data: {
          roomTempMin,
          roomTempMax,
          roomHumidMin,
          roomHumidMax,
          fridgeTempMin,
          fridgeTempMax,
        },
      });
    } else {
      setting = await (prisma as any).temperatureSetting.create({
        data: {
          company,
          roomTempMin,
          roomTempMax,
          roomHumidMin,
          roomHumidMax,
          fridgeTempMin,
          fridgeTempMax,
        },
      });
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error("Error saving temperature setting:", error);
    return NextResponse.json({ error: "Failed to save setting" }, { status: 500 });
  }
}
