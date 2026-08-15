
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

const db = prisma as any;

export async function DELETE(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams;
    const id = searchParam.get('id');

    if (!id) {
        return Response.json({ error: "Missing id" }, { status: 400 });
    }

    try {
        const result = await db.$transaction(async (tx: any) => {
            // 1. Get the item to be deleted to know its orderId
            const itemToDelete = await tx.orderDetail.findUnique({
                where: { id: Number(id) }
            });

            if (!itemToDelete) {
                throw new Error("Item not found");
            }

            const orderId = itemToDelete.orderId;

            // 2. Delete the item
            await tx.orderDetail.delete({
                where: { id: Number(id) }
            });

            // 3. Recalculate totalAmount for the order
            const remainingItems = await tx.orderDetail.findMany({
                where: { orderId: orderId }
            });

            const newTotalAmount = remainingItems.reduce((sum: number, item: any) => sum + (item.total || 0), 0);

            // 4. Update OrderMain with new total
            await tx.orderMain.update({
                where: { id: orderId },
                data: { totalAmount: newTotalAmount }
            });

            return { success: true, newTotalAmount };
        });

        return Response.json(result);
    } catch (error: any) {
        console.error("Error deleting order detail:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, qty } = body;

        if (!id || qty === undefined) {
            return Response.json({ error: "Missing id or qty" }, { status: 400 });
        }

        const result = await db.$transaction(async (tx: any) => {
            // 1. Get the item to be updated
            const itemToUpdate = await tx.orderDetail.findUnique({
                where: { id: Number(id) }
            });

            if (!itemToUpdate) {
                throw new Error("Item not found");
            }

            const orderId = itemToUpdate.orderId;
            const cost = itemToUpdate.cost || 0;
            const newTotal = Number((qty * cost).toFixed(2));

            // 2. Update the item
            await tx.orderDetail.update({
                where: { id: Number(id) },
                data: {
                    qty: Number(qty),
                    total: newTotal
                }
            });

            // 3. Recalculate totalAmount for the order
            const remainingItems = await tx.orderDetail.findMany({
                where: { orderId: orderId }
            });

            const newTotalAmount = remainingItems.reduce((sum: number, item: any) => sum + (item.total || 0), 0);

            // 4. Update OrderMain with new total
            await tx.orderMain.update({
                where: { id: orderId },
                data: { totalAmount: newTotalAmount }
            });

            return { success: true, newTotalAmount };
        });

        return Response.json(result);
    } catch (error: any) {
        console.error("Error updating order detail:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
