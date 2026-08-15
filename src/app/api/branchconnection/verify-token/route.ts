import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBranchApiToken } from "@/lib/branchApiAuth";

// POST: ให้สาขาอื่นเรียกมาตรวจสอบ API Token ของเรา
// Remote branch จะยิงมาที่ URL นี้เพื่อ verify ว่า token ถูกต้อง
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { apiToken, userId } = body;

        if (!apiToken) {
            return NextResponse.json(
                { error: "apiToken is required" },
                { status: 400 }
            );
        }

        if (userId) {
            const auth = await verifyBranchApiToken(userId, apiToken);
            if (!auth) {
                return NextResponse.json(
                    { error: "API Token ไม่ถูกต้อง" },
                    { status: 401 }
                );
            }

            return NextResponse.json({
                verified: true,
                userId: auth.user.id,
                company: auth.user.company,
                email: auth.user.email,
                tunnelUrl: auth.user.tunnelUrl,
                authType: auth.matchedBy,
            });
        }

        // ค้นหา user ที่มี apiToken ตรงกัน
        const user = await prisma.user.findFirst({
            where: { apiToken: apiToken.trim() },
            select: {
                id: true,
                company: true,
                email: true,
                tunnelUrl: true,
            }
        });

        if (!user) {
            const connection = await prisma.branchConnection.findFirst({
                where: {
                    apiToken: apiToken.trim(),
                    status: "accepted",
                },
                include: {
                    fromUser: {
                        select: {
                            id: true,
                            company: true,
                            email: true,
                            tunnelUrl: true,
                        }
                    }
                }
            });

            if (connection?.fromUser) {
                return NextResponse.json({
                    verified: true,
                    userId: connection.fromUser.id,
                    company: connection.fromUser.company,
                    email: connection.fromUser.email,
                    tunnelUrl: connection.fromUser.tunnelUrl,
                    authType: "connection",
                });
            }

            return NextResponse.json(
                { error: "API Token ไม่ถูกต้อง" },
                { status: 401 }
            );
        }

        // ส่งข้อมูลสาขากลับไป (ไม่ส่ง token กลับ)
        return NextResponse.json({
            verified: true,
            userId: user.id,
            company: user.company,
            email: user.email,
            tunnelUrl: user.tunnelUrl,
        });
    } catch (error) {
        console.error("Error verifying token:", error);
        return NextResponse.json(
            { error: "Failed to verify token" },
            { status: 500 }
        );
    }
}
