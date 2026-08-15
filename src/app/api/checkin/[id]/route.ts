import { NextRequest } from 'next/server'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

// Type for route params
type RouteContext = {
    params: Promise<{ id: string }>
}

// GET - Fetch single checkin record by ID
export async function GET(
    req: Request,
    context: RouteContext,
) {
    try {
        const params = await context.params
        const prisma = await getPrisma();

        const checkin = await prisma.checkin.findUnique({
            where: { id: Number(params.id) }
        })

        if (!checkin) {
            return new Response(JSON.stringify({ error: 'Checkin not found' }), {
                status: 404,
            })
        }

        return Response.json(checkin)
    } catch (error) {
        return new Response(JSON.stringify(error), {
            status: 500,
        })
    }
}

// PUT - Update checkin record by ID
export async function PUT(
    req: Request,
    context: RouteContext,
) {
    try {
        const params = await context.params
        const prisma = await getPrisma();

        const {
            status,
            checkin,
            checkout,
            checkinLat,
            checkinLng,
            checkoutLat,
            checkoutLng,
            gpsRadius,
            targetLat,
            targetLng,
            approve,
            approveDate,
            approvePerson,
            remark
        } = await req.json()

        // Build update data object (only include fields that are provided)
        const updateData: Record<string, unknown> = {}

        if (status !== undefined) updateData.status = status
        if (checkin !== undefined) updateData.checkin = checkin ? new Date(checkin) : null
        if (checkout !== undefined) updateData.checkout = checkout ? new Date(checkout) : null
        if (checkinLat !== undefined) updateData.checkinLat = checkinLat
        if (checkinLng !== undefined) updateData.checkinLng = checkinLng
        if (checkoutLat !== undefined) updateData.checkoutLat = checkoutLat
        if (checkoutLng !== undefined) updateData.checkoutLng = checkoutLng
        if (gpsRadius !== undefined) updateData.gpsRadius = gpsRadius
        if (targetLat !== undefined) updateData.targetLat = targetLat
        if (targetLng !== undefined) updateData.targetLng = targetLng
        if (approve !== undefined) updateData.approve = approve
        if (approveDate !== undefined) updateData.approveDate = approveDate ? new Date(approveDate) : null
        if (approvePerson !== undefined) updateData.approvePerson = approvePerson
        if (remark !== undefined) updateData.remark = remark

        const updated = await prisma.checkin.update({
            where: { id: Number(params.id) },
            data: updateData
        })

        return Response.json(updated)

    } catch (error) {
        return new Response(JSON.stringify(error), {
            status: 500,
        })
    }
}

// DELETE - Delete checkin record by ID
export async function DELETE(
    req: Request,
    context: RouteContext,
) {
    try {
        const params = await context.params
        const prisma = await getPrisma();

        const deleted = await prisma.checkin.delete({
            where: { id: Number(params.id) }
        })

        return Response.json(deleted)

    } catch (error) {
        return new Response(JSON.stringify(error), {
            status: 500,
        })
    }
}
