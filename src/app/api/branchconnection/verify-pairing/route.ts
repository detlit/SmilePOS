import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: สาขาอื่นเรียกมาเพื่อ verify pairing code ของเรา (ใช้ตอน sync จริง)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { pairingCode } = body;

        if (!pairingCode) {
            return NextResponse.json(
                { error: "pairingCode is required" },
                { status: 400 }
            );
        }

        const code = pairingCode.trim().toUpperCase();

        // ค้นหา user ที่มี pairingCode ตรงกัน + ยังไม่หมดอายุ
        // หรือใช้ apiToken ตรงกัน (สำหรับ long-term auth)
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    {
                        pairingCode: code,
                        pairingCodeExpiresAt: { gte: new Date() }
                    },
                    { apiToken: code }
                ]
            },
            select: {
                id: true,
                company: true,
                email: true,
                tunnelUrl: true,
                apiToken: true,
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: "รหัสจับคู่ไม่ถูกต้องหรือหมดอายุแล้ว" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            verified: true,
            userId: user.id,
            company: user.company,
            email: user.email,
            tunnelUrl: user.tunnelUrl,
            apiToken: user.apiToken,
        });
    } catch (error) {
        console.error("Error verifying pairing:", error);
        return NextResponse.json(
            { error: "Failed to verify pairing" },
            { status: 500 }
        );
    }
}
