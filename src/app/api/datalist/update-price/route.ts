import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT: แก้ไขราคาขายของสินค้า (datalist.price) — endpoint เฉพาะ ไม่กระทบฟิลด์อื่น
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, price, person } = body;

        if (id === undefined || id === null) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        const newPrice = parseFloat(String(price));
        if (isNaN(newPrice) || newPrice < 0) {
            return NextResponse.json({ error: "price must be a non-negative number" }, { status: 400 });
        }

        const existing = await prisma.datalist.findUnique({ where: { id: Number(id) } });
        if (!existing) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const updated = await prisma.datalist.update({
            where: { id: Number(id) },
            data: { price: newPrice },
        });

        console.log(`[UpdatePrice] ✅ Product #${id} price=${newPrice} by ${person || 'unknown'}`);

        return NextResponse.json({ success: true, message: "อัปเดตราคาขายสำเร็จ", data: updated });
    } catch (error: any) {
        console.error("[UpdatePrice] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update price" },
            { status: 500 }
        );
    }
}
