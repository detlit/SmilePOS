import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT: อัปเดตการเชื่อมต่อ (tunnelUrl, apiToken, branchName, status)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, tunnelUrl, apiToken, branchName } = body;

        const updateData: any = { respondedAt: new Date() };

        if (status) updateData.status = status;
        if (tunnelUrl !== undefined) updateData.tunnelUrl = tunnelUrl;
        if (apiToken !== undefined) updateData.apiToken = apiToken;
        if (branchName !== undefined) updateData.branchName = branchName;

        const connection = await prisma.branchConnection.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                fromUser: {
                    select: { id: true, company: true, email: true, tunnelUrl: true }
                },
                toUser: {
                    select: { id: true, company: true, email: true, tunnelUrl: true }
                }
            }
        });

        return NextResponse.json(connection);
    } catch (error) {
        console.error("Error updating connection:", error);
        return NextResponse.json(
            { error: "Failed to update connection" },
            { status: 500 }
        );
    }
}

// DELETE: ลบการเชื่อม
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.branchConnection.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ message: "Connection deleted successfully" });
    } catch (error) {
        console.error("Error deleting connection:", error);
        return NextResponse.json(
            { error: "Failed to delete connection" },
            { status: 500 }
        );
    }
}
