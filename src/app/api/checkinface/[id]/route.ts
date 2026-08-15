import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const result = await prisma.checkinFace.findUnique({
            where: { employeeId: Number(id) },
        });

        if (!result) {
            return NextResponse.json(
                { error: 'Face registration not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching face registration:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
