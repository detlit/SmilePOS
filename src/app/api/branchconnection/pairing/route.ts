import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// สร้างรหัสจับคู่ 6 ตัว (ตัวเลข + ตัวอักษรพิมพ์ใหญ่ ไม่สับสน)
function generatePairingCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ไม่มี 0,O,1,I
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// POST: สร้างรหัสจับคู่ใหม่ (หมดอายุ 10 นาที)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            select: { id: true, company: true, tunnelUrl: true, apiToken: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!user.tunnelUrl) {
            return NextResponse.json(
                { error: "กรุณาตั้งค่า Tunnel URL ก่อนสร้างรหัสจับคู่" },
                { status: 400 }
            );
        }

        // สร้างรหัสจับคู่ + หมดอายุ 10 นาที
        const code = generatePairingCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 นาที

        // ถ้ายังไม่มี apiToken ให้สร้างอัตโนมัติ
        const crypto = require("crypto");
        const apiToken = user.apiToken || crypto.randomBytes(48).toString("hex");

        await prisma.user.update({
            where: { id: parseInt(userId) },
            data: {
                pairingCode: code,
                pairingCodeExpiresAt: expiresAt,
                apiToken: apiToken,
            }
        });

        return NextResponse.json({
            pairingCode: code,
            expiresAt: expiresAt.toISOString(),
            tunnelUrl: user.tunnelUrl,
            message: `รหัสจับคู่: ${code} (หมดอายุใน 10 นาที)`
        });
    } catch (error) {
        console.error("Error generating pairing code:", error);
        return NextResponse.json({ error: "Failed to generate pairing code" }, { status: 500 });
    }
}

// GET: ดึงรหัสจับคู่ปัจจุบัน (ถ้ายังไม่หมดอายุ)
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
                pairingCode: true,
                pairingCodeExpiresAt: true,
                tunnelUrl: true,
            }
        });

        if (!user || !user.pairingCode || !user.pairingCodeExpiresAt) {
            return NextResponse.json({ active: false });
        }

        // เช็คหมดอายุ
        if (new Date() > user.pairingCodeExpiresAt) {
            return NextResponse.json({ active: false, expired: true });
        }

        return NextResponse.json({
            active: true,
            pairingCode: user.pairingCode,
            expiresAt: user.pairingCodeExpiresAt.toISOString(),
            tunnelUrl: user.tunnelUrl,
        });
    } catch (error) {
        console.error("Error fetching pairing code:", error);
        return NextResponse.json({ error: "Failed to fetch pairing code" }, { status: 500 });
    }
}
