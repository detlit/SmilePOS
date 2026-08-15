import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - ดึงข้อมูลการตั้งค่า GPS ทั้งหมดตาม idcompany (สูงสุด 5 จุด)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const idcompany = url.searchParams.get("idcompany");

    if (!idcompany) {
      return NextResponse.json(
        { error: "idcompany is required" },
        { status: 400 }
      );
    }

    const settings = await prisma.checkinSet.findMany({
      where: {
        idcompany: idcompany,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 5, // Maximum 5 locations
    });

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error("Error fetching checkin settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - บันทึกการตั้งค่า GPS ใหม่ (ถ้ายังไม่ครบ 5 จุด)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("DEBUG: CheckinSet POST body:", body);
    console.log("DEBUG: Code Version Timestamp: 2025-12-23 11:35");
    const { idcompany, names, radius, latitude, longitude, id } = body;

    if (!idcompany) {
      return NextResponse.json(
        { error: "idcompany is required" },
        { status: 400 }
      );
    }

    // If id is provided, update existing location
    if (id) {
      const result = await prisma.checkinSet.update({
        where: { id: parseInt(id) },
        data: {
          names: names || null,
          radius: radius ? parseFloat(radius) : null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          createdAt: new Date(),
        } as any,
      });
      return NextResponse.json(result, { status: 200 });
    }

    // Check current count
    const existingCount = await prisma.checkinSet.count({
      where: { idcompany: idcompany },
    });

    if (existingCount >= 5) {
      return NextResponse.json(
        { error: "Maximum 5 locations allowed" },
        { status: 400 }
      );
    }

    // Create new location
    const result = await prisma.checkinSet.create({
      data: {
        idcompany: idcompany,
        names: names || `จุดที่ ${existingCount + 1}`,
        radius: radius ? parseFloat(radius) : 100,
        latitude: latitude ? parseFloat(latitude) : 0,
        longitude: longitude ? parseFloat(longitude) : 0,
        createdAt: new Date(),
      } as any,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error saving checkin settings:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// DELETE - ลบการตั้งค่า GPS ตาม ID
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    await prisma.checkinSet.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting checkin setting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
