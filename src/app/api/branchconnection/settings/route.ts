import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// GET: ดึงข้อมูล tunnelUrl และ apiToken ของ user
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            select: {
                id: true,
                company: true,
                email: true,
                tunnelUrl: true,
                apiToken: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

// PUT: อัปเดต tunnelUrl ของ user
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, tunnelUrl } = body;

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { tunnelUrl: tunnelUrl || null },
            select: {
                id: true,
                company: true,
                email: true,
                tunnelUrl: true,
                apiToken: true,
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error updating tunnel URL:", error);
        return NextResponse.json({ error: "Failed to update tunnel URL" }, { status: 500 });
    }
}

// POST: สร้าง/regenerate API Token
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        // สร้าง token แบบ random 48 bytes -> hex string
        const newToken = crypto.randomBytes(48).toString("hex");

        const user = await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { apiToken: newToken },
            select: {
                id: true,
                company: true,
                email: true,
                tunnelUrl: true,
                apiToken: true,
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error generating token:", error);
        return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
    }
}
