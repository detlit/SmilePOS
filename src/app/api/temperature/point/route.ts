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
    const points = await (prisma as any).temperaturePoint.findMany({
      where: { company: company || undefined },
      orderBy: { pointNumber: "asc" },
    });

    return NextResponse.json(points);
  } catch (error) {
    console.error("Error fetching temperature points:", error);
    return NextResponse.json({ error: "Failed to fetch points" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company, pointNumber, pointName, detail, locationType } = body;

    const prisma = await getPrisma();
    
    // Check if point already exists
    const existing = await (prisma as any).temperaturePoint.findFirst({
      where: { company, pointNumber },
    });

    let point;
    if (existing) {
      point = await (prisma as any).temperaturePoint.update({
        where: { id: existing.id },
        data: { pointName, detail, locationType },
      });
    } else {
      point = await (prisma as any).temperaturePoint.create({
        data: { company, pointNumber, pointName, detail, locationType, isActive: true },
      });
    }

    return NextResponse.json(point);
  } catch (error) {
    console.error("Error saving temperature point:", error);
    return NextResponse.json({ error: "Failed to save point" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const prisma = await getPrisma();
    await (prisma as any).temperaturePoint.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting temperature point:", error);
    return NextResponse.json({ error: "Failed to delete point" }, { status: 500 });
  }
}
