import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: ดึงประวัติ sync
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const company = searchParams.get("company");
        const limit = parseInt(searchParams.get("limit") || "50");

        if (!company) {
            return NextResponse.json({ error: "company is required" }, { status: 400 });
        }

        const logs = await prisma.syncLog.findMany({
            where: { company },
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        return NextResponse.json(logs);
    } catch (error: any) {
        console.error("[SyncLog] Error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch sync logs" }, { status: 500 });
    }
}
