import { NextRequest } from 'next/server'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

// GET - ดึงข้อมูล Incentive Settings ของ company
export async function GET(req: NextRequest) {
    try {
        const prisma = await getPrisma();
        const { searchParams } = new URL(req.url);
        const company = searchParams.get("company");

        if (!company) {
            return Response.json({ error: "Company is required" }, { status: 400 });
        }

        const settings = await prisma.incentiveSetting.findFirst({
            where: { company: company }
        });

        if (!settings) {
            // Return default values if no settings found
            return Response.json({
                id: null,
                company: company,
                targetMonthly: 300000,
                targetMonthlyBonus: 1000,
                targetDaysOver: 13,
                targetDaysOverBonus: 750,
                targetAmountOver: 10000,
                targetAmountOverBonus: 0,
                targetDaily: 12000,
                targetDailyBonus: 80,
                pickupFeeRate: 0.5,
                pickupFeeBonus: 0,
                salesPerBillTarget: 120,
                salesPerBillBonus: 20,
                enableTargetMonthly: true,
                enableTargetDaysOver: true,
                enableTargetDaily: true,
                enablePickupFee: true,
                enableSalesPerBill: true,
            });
        }

        return Response.json(settings);
    } catch (error) {
        console.error("GET incentive error:", error);
        return new Response(JSON.stringify({ error: "Failed to get incentive settings" }), {
            status: 500,
        });
    }
}

// POST - สร้าง Incentive Settings ใหม่
export async function POST(req: NextRequest) {
    try {
        const prisma = await getPrisma();
        const body = await req.json();
        const { company, ...settingsData } = body;

        if (!company) {
            return Response.json({ error: "Company is required" }, { status: 400 });
        }

        // Check if settings already exist for this company
        const existing = await prisma.incentiveSetting.findFirst({
            where: { company: company }
        });

        if (existing) {
            // Update existing
            const updated = await prisma.incentiveSetting.update({
                where: { id: existing.id },
                data: settingsData,
            });
            return Response.json(updated);
        }

        // Create new
        const created = await prisma.incentiveSetting.create({
            data: {
                company,
                ...settingsData,
            },
        });

        return Response.json(created);
    } catch (error) {
        console.error("POST incentive error:", error);
        return new Response(JSON.stringify({ error: "Failed to create incentive settings" }), {
            status: 500,
        });
    }
}

// PUT - อัปเดต Incentive Settings (partial update)
export async function PUT(req: NextRequest) {
    try {
        const prisma = await getPrisma();
        const body = await req.json();
        const { company, field, value } = body;

        if (!company) {
            return Response.json({ error: "Company is required" }, { status: 400 });
        }

        // Find existing settings
        let settings = await prisma.incentiveSetting.findFirst({
            where: { company: company }
        });

        // If no settings exist, create new one
        if (!settings) {
            settings = await prisma.incentiveSetting.create({
                data: { company },
            });
        }

        // Update specific field
        const updateData: any = {};
        if (field && value !== undefined) {
            updateData[field] = value;
        } else {
            // Update all fields from body (excluding company and field)
            const { company: _, field: __, value: ___, ...rest } = body;
            Object.assign(updateData, rest);
        }

        const updated = await prisma.incentiveSetting.update({
            where: { id: settings.id },
            data: updateData,
        });

        return Response.json(updated);
    } catch (error) {
        console.error("PUT incentive error:", error);
        return new Response(JSON.stringify({ error: "Failed to update incentive settings" }), {
            status: 500,
        });
    }
}
