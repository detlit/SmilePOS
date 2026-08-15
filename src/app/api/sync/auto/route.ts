import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: ตรวจสอบและรัน auto sync ที่ถึงเวลา
// เรียกจาก setInterval ใน client หรือ cron job
export async function GET(request: NextRequest) {
    try {
        const schedules = await prisma.syncSchedule.findMany({
            where: { enabled: true }
        });

        if (schedules.length === 0) {
            return NextResponse.json({ message: "No active schedules", ran: 0 });
        }

        const now = new Date();
        const results: any[] = [];

        for (const schedule of schedules) {
            const intervalMs = (schedule.intervalMinutes || 60) * 60 * 1000;
            const lastRun = schedule.lastRunAt ? new Date(schedule.lastRunAt).getTime() : 0;
            const nextRun = lastRun + intervalMs;

            if (now.getTime() < nextRun) {
                continue; // ยังไม่ถึงเวลา
            }

            const company = schedule.company;
            if (!company) continue;

            // หา userId จาก company
            const user = await prisma.user.findFirst({
                where: { company },
                select: { id: true }
            });

            if (!user) continue;

            const types = (schedule.syncTypes || "datalist,labeldata,supplier").split(",").map((s: string) => s.trim()).filter(Boolean);
            const targetBranches = schedule.targetBranches
                ? schedule.targetBranches.split(",").map((s: string) => s.trim()).filter(Boolean)
                : [];

            console.log(`[AutoSync] 🔄 Running auto sync for company="${company}", types=${types.join(",")}`);

            // เรียก push API ภายใน
            try {
                const baseUrl = request.nextUrl.origin;
                const pushRes = await fetch(`${baseUrl}/api/sync/push`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        company,
                        userId: user.id,
                        types,
                        targetBranches: targetBranches.length > 0 ? targetBranches : undefined,
                    }),
                });

                const pushData = await pushRes.json();

                results.push({
                    company,
                    success: pushRes.ok,
                    data: pushData,
                });
            } catch (err: any) {
                results.push({
                    company,
                    success: false,
                    error: err.message,
                });
            }

            // อัปเดต lastRunAt
            await prisma.syncSchedule.update({
                where: { id: schedule.id },
                data: { lastRunAt: now }
            });
        }

        return NextResponse.json({
            message: `Checked ${schedules.length} schedules, ran ${results.length}`,
            ran: results.length,
            results,
        });
    } catch (error: any) {
        console.error("[AutoSync] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
