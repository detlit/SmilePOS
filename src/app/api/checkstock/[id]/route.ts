import { NextRequest } from 'next/server'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

// GET by ID - Fetch single stock count record
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const prisma = await getPrisma();
    const { id } = await params;

    try {
        const record = await prisma.checkstock.findUnique({
            where: {
                id: parseInt(id)
            }
        })

        if (!record) {
            return new Response(JSON.stringify({ error: 'Record not found' }), {
                status: 404,
            })
        }

        return Response.json(record)
    } catch (error) {
        console.error('Error fetching checkstock:', error)
        return new Response(JSON.stringify({ error: 'Failed to fetch record' }), {
            status: 500,
        })
    }
}

// PUT - Update stock count record by ID
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const prisma = await getPrisma();
    const { id } = await params;

    try {
        const { idcompany, id_product, name_product, balance, actual, diff, person, status } = await request.json()

        const updatedRecord = await prisma.checkstock.update({
            where: {
                id: parseInt(id)
            },
            data: {
                idcompany,
                id_product,
                name_product,
                balance: balance !== undefined ? parseFloat(balance) : undefined,
                actual: actual !== undefined ? parseFloat(actual) : undefined,
                diff: diff !== undefined ? parseFloat(diff) : undefined,
                person,
                status
            },
        })

        return Response.json(updatedRecord)
    } catch (error) {
        console.error('Error updating checkstock:', error)
        return new Response(JSON.stringify({ error: 'Failed to update record' }), {
            status: 500,
        })
    }
}

// DELETE - Delete stock count record by ID
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const prisma = await getPrisma();
    const { id } = await params;

    try {
        await prisma.checkstock.delete({
            where: {
                id: parseInt(id)
            }
        })

        return Response.json({ message: 'Record deleted successfully' })
    } catch (error) {
        console.error('Error deleting checkstock:', error)
        return new Response(JSON.stringify({ error: 'Failed to delete record' }), {
            status: 500,
        })
    }
}
