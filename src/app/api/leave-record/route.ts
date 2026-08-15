import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const idcompany = request.nextUrl.searchParams.get("idcompany") || "";
  const personId = request.nextUrl.searchParams.get("personId");
  const year = request.nextUrl.searchParams.get("year");

  try {
    const where: any = { idcompany };
    if (personId) where.personId = Number(personId);
    if (year) {
      where.leaveDate = {
        gte: new Date(`${year}-01-01T00:00:00.000+07:00`),
        lte: new Date(`${year}-12-31T23:59:59.999+07:00`),
      };
    }
    const records = await (prisma as any).leaveRecord.findMany({
      where,
      orderBy: { leaveDate: "desc" },
    });
    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idcompany, personId, person, leaveType, leaveDate, reason, status } = body;
    const record = await (prisma as any).leaveRecord.create({
      data: {
        idcompany,
        personId: Number(personId),
        person,
        leaveType,
        leaveDate: new Date(leaveDate),
        reason: reason || "",
        status: status || "approved",
      },
    });
    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, rejectReason, approvedBy } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const data: any = { status };
    if (status === "approved") {
      data.approvedBy = approvedBy || "";
      data.approvedDate = new Date();
      data.rejectReason = "";
    } else if (status === "rejected") {
      data.rejectReason = rejectReason || "";
      data.approvedBy = approvedBy || "";
      data.approvedDate = new Date();
    }
    const record = await (prisma as any).leaveRecord.update({
      where: { id: Number(id) },
      data,
    });
    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await (prisma as any).leaveRecord.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
