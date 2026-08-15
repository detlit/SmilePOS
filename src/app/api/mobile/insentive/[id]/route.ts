import { NextRequest } from 'next/server'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

type RouteContext = {
    params: Promise<{ id: string }>
}

// GET by ID
export async function GET(
    req: Request,
    context: RouteContext,
) {
    try {
        const params = await context.params;
        const prisma = await getPrisma();

        const settings = await prisma.incentiveSetting.findUnique({
            where: { id: Number(params.id) }
        });

        return Response.json(settings);
    } catch (error) {
        console.error("GET incentive by ID error:", error);
        return new Response(JSON.stringify({ error: "Failed to get incentive settings" }), {
            status: 500,
        });
    }
}

// PUT - Update by ID
export async function PUT(
    req: Request,
    context: RouteContext,
) {
    try {
        const params = await context.params;
        const prisma = await getPrisma();
        const body = await req.json();

        const updated = await prisma.incentiveSetting.update({
            where: { id: Number(params.id) },
            data: body,
        });

        return Response.json(updated);
    } catch (error) {
        console.error("PUT incentive by ID error:", error);
        return new Response(JSON.stringify({ error: "Failed to update incentive settings" }), {
            status: 500,
        });
    }
}

// DELETE by ID
export async function DELETE(
    req: Request,
    context: RouteContext,
) {
    try {
        const params = await context.params;
        const prisma = await getPrisma();

        const deleted = await prisma.incentiveSetting.delete({
            where: { id: Number(params.id) },
        });

        return Response.json(deleted);
    } catch (error) {
        console.error("DELETE incentive by ID error:", error);
        return new Response(JSON.stringify({ error: "Failed to delete incentive settings" }), {
            status: 500,
        });
    }
}
