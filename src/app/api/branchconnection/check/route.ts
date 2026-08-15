import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: เช็คสถานะการเชื่อมต่อของสาขา (ping tunnel URL)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { connectionId } = body;

        if (!connectionId) {
            return NextResponse.json({ error: "connectionId is required" }, { status: 400 });
        }

        const connection = await prisma.branchConnection.findUnique({
            where: { id: parseInt(connectionId) },
            include: {
                toUser: { select: { id: true, tunnelUrl: true, apiToken: true, company: true } }
            }
        });

        if (!connection) {
            return NextResponse.json({ error: "Connection not found" }, { status: 404 });
        }

        let isOnline = false;

        // ลอง ping tunnel URL ถ้ามี
        if (connection.tunnelUrl) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const res = await fetch(connection.tunnelUrl, {
                    method: "HEAD",
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);

                isOnline = res.ok || res.status < 500;
            } catch (e) {
                isOnline = false;
            }
        }

        // อัปเดตสถานะ
        const updated = await prisma.branchConnection.update({
            where: { id: parseInt(connectionId) },
            data: {
                isOnline,
                lastCheckedAt: new Date(),
            }
        });

        return NextResponse.json({ isOnline, lastCheckedAt: updated.lastCheckedAt });
    } catch (error) {
        console.error("Error checking connection:", error);
        return NextResponse.json({ error: "Failed to check connection" }, { status: 500 });
    }
}
