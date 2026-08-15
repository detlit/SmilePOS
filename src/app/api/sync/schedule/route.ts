import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: ดึงการตั้งเวลา sync ของ company
export async function GET(request: NextRequest) {
    try {
        const company = request.nextUrl.searchParams.get("company");
        if (!company) {
            return NextResponse.json({ error: "company is required" }, { status: 400 });
        }

        let schedule = await prisma.syncSchedule.findFirst({ where: { company } });

        // ถ้ายังไม่มี → สร้าง default
        if (!schedule) {
            schedule = await prisma.syncSchedule.create({
                data: {
                    company,
                    intervalMinutes: 60,
                    syncTypes: "datalist,labeldata,supplier",
                    targetBranches: "",
                    enabled: false,
                }
            });
        }

        return NextResponse.json(schedule);
    } catch (error: any) {
        console.error("[SyncSchedule] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: อัปเดตการตั้งเวลา sync
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { company, intervalMinutes, syncTypes, targetBranches, enabled } = body;

        if (!company) {
            return NextResponse.json({ error: "company is required" }, { status: 400 });
        }

        let schedule = await prisma.syncSchedule.findFirst({ where: { company } });

        if (schedule) {
            schedule = await prisma.syncSchedule.update({
                where: { id: schedule.id },
                data: {
                    intervalMinutes: intervalMinutes ?? schedule.intervalMinutes,
                    syncTypes: syncTypes ?? schedule.syncTypes,
                    targetBranches: targetBranches ?? schedule.targetBranches,
                    enabled: enabled ?? schedule.enabled,
                }
            });
        } else {
            schedule = await prisma.syncSchedule.create({
                data: {
                    company,
                    intervalMinutes: intervalMinutes ?? 60,
                    syncTypes: syncTypes ?? "datalist,labeldata,supplier",
                    targetBranches: targetBranches ?? "",
                    enabled: enabled ?? false,
                }
            });
        }

        return NextResponse.json(schedule);
    } catch (error: any) {
        console.error("[SyncSchedule] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
