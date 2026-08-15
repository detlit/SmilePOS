import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

const db = prisma as any;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            company,
            orderNo,
            orderfull,
            supplierId,
            supplierCode,
            supplierName,
            totalAmount,
            person,
            remark,
            items
        } = body;

        if (!company) {
            return Response.json({ error: "Missing company" }, { status: 400 });
        }

        const result = await db.$transaction(async (tx: any) => {
            const orderMain = await tx.orderMain.create({
                data: {
                    company,
                    orderNo,
                    orderfull,
                    supplierId: supplierId ? Number(supplierId) : null,
                    supplierCode,
                    supplierName,
                    totalAmount: Number(totalAmount) || 0,
                    person,
                    remark,
                    status: "Pending",
                    items: {
                        create: items.map((item: any) => ({
                            itemcode: item.itemcode,
                            itemName: item.itemName,
                            qty: Number(item.suggestedQty) || 0,
                            unit: item.unit || "",
                            cost: Number(item.newCost) || 0,
                            total: Number(item.totalSuggestedCost) || 0,
                        }))
                    }
                },
                include: {
                    items: true
                }
            });
            return orderMain;
        });

        return Response.json(result);
    } catch (error: any) {
        console.error("Error creating order:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams;
    const company = searchParam.get('company');

    if (!company) {
        return Response.json({ error: "Missing company" }, { status: 400 });
    }

    try {
        const orders = await db.orderMain.findMany({
            where: { company },
            include: {
                items: true
            },
            orderBy: {
                createDate: 'desc'
            }
        });

        return Response.json(orders);
    } catch (error: any) {
        console.error("Error fetching orders:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, status } = body;

        if (!orderId) {
            return Response.json({ error: "Missing orderId" }, { status: 400 });
        }

        const result = await db.$transaction(async (tx: any) => {
            // Update OrderMain status
            const orderMain = await tx.orderMain.update({
                where: { id: Number(orderId) },
                data: { status: status },
            });

            // Update all OrderDetail status to match
            await tx.orderDetail.updateMany({
                where: { orderId: Number(orderId) },
                data: { status: status },
            });

            return orderMain;
        });

        return Response.json(result);
    } catch (error: any) {
        console.error("Error updating order status:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
