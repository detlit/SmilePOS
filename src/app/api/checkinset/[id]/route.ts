import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - ดึงข้อมูลการตั้งค่า GPS ตาม id
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const settingId = parseInt(id);

        if (isNaN(settingId)) {
            return NextResponse.json(
                { error: "Invalid ID format" },
                { status: 400 }
            );
        }

        const setting = await prisma.checkinSet.findUnique({
            where: {
                id: settingId,
            },
        });

        if (!setting) {
            return NextResponse.json(
                { error: "Setting not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(setting, { status: 200 });
    } catch (error) {
        console.error("Error fetching checkin setting:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT - อัปเดตการตั้งค่า GPS ตาม id
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const settingId = parseInt(id);

        if (isNaN(settingId)) {
            return NextResponse.json(
                { error: "Invalid ID format" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { radius, latitude, longitude } = body;

        // Check if setting exists
        const existingSetting = await prisma.checkinSet.findUnique({
            where: {
                id: settingId,
            },
        });

        if (!existingSetting) {
            return NextResponse.json(
                { error: "Setting not found" },
                { status: 404 }
            );
        }

        // Update the setting
        const updatedSetting = await prisma.checkinSet.update({
            where: {
                id: settingId,
            },
            data: {
                radius: radius !== undefined ? parseFloat(radius) : existingSetting.radius,
                latitude: latitude !== undefined ? parseFloat(latitude) : existingSetting.latitude,
                longitude: longitude !== undefined ? parseFloat(longitude) : existingSetting.longitude,
                createdAt: new Date(),
            },
        });

        return NextResponse.json(updatedSetting, { status: 200 });
    } catch (error) {
        console.error("Error updating checkin setting:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE - ลบการตั้งค่า GPS ตาม id
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const settingId = parseInt(id);

        if (isNaN(settingId)) {
            return NextResponse.json(
                { error: "Invalid ID format" },
                { status: 400 }
            );
        }

        // Check if setting exists
        const existingSetting = await prisma.checkinSet.findUnique({
            where: {
                id: settingId,
            },
        });

        if (!existingSetting) {
            return NextResponse.json(
                { error: "Setting not found" },
                { status: 404 }
            );
        }

        // Delete the setting
        await prisma.checkinSet.delete({
            where: {
                id: settingId,
            },
        });

        return NextResponse.json(
            { message: "Setting deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting checkin setting:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
