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
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const point = searchParams.get("point");

    let whereClause: any = {};
    if (company) whereClause.company = company;
    if (point) whereClause.recordPoint = parseInt(point);

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      whereClause.recordDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    const prisma = await getPrisma();
    const records = await (prisma as any).temperatureRecord.findMany({
      where: whereClause,
      orderBy: [{ recordDate: "desc" }, { recordPoint: "asc" }, { recordTime: "asc" }],
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching temperature records:", error);
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company, recordDate, recordPoint, recordTime, temperature, humidity, locationType, person } = body;

    const prisma = await getPrisma();
    const record = await (prisma as any).temperatureRecord.create({
      data: {
        company,
        recordDate: new Date(recordDate),
        recordPoint,
        recordTime,
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity),
        locationType,
        person,
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("Error creating temperature record:", error);
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
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
    await (prisma as any).temperatureRecord.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting temperature record:", error);
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}
