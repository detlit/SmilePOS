import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STOCK_ADJUST_REASON_OPTIONS } from "@/lib/stockAdjustReasons";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { lotId, itemcode, itemName, lot, dateExp, adjustQty, reason, adjustReasonMain, company, person } = body;

        if (!lotId || !itemcode || adjustQty === undefined || adjustQty === 0) {
            return NextResponse.json(
                { error: "lotId, itemcode, and adjustQty (non-zero) are required" },
                { status: 400 }
            );
        }

        const parsedLotId = parseInt(lotId);
        if (isNaN(parsedLotId)) {
            return NextResponse.json(
                { error: `lotId ไม่ถูกต้อง: "${lotId}"` },
                { status: 400 }
            );
        }

        const adjustAmount = parseFloat(adjustQty);
        if (isNaN(adjustAmount) || adjustAmount === 0) {
            return NextResponse.json(
                { error: "จำนวนปรับยอดต้องไม่เป็น 0" },
                { status: 400 }
            );
        }

        const normalizedReasonMain = typeof adjustReasonMain === "string" ? adjustReasonMain.trim() : "";
        if (!normalizedReasonMain || !STOCK_ADJUST_REASON_OPTIONS.some((option) => option === normalizedReasonMain)) {
            return NextResponse.json(
                { error: "กรุณาเลือกเหตุผลหลักในการปรับยอด" },
                { status: 400 }
            );
        }

        const detailReason = typeof reason === "string" ? reason.trim() : "";

        const result = await prisma.$transaction(async (tx) => {
            // 1. ดึง Lot ปัจจุบัน
            const currentLot = await tx.rCitemlist.findUnique({
                where: { id: parsedLotId }
            });

            if (!currentLot) {
                throw new Error(`ไม่พบ Lot ID: ${lotId}`);
            }

            const currentBalance = currentLot.balance || 0;
            const newBalance = currentBalance + adjustAmount;

            if (newBalance < 0) {
                throw new Error(`ยอดคงเหลือไม่เพียงพอ (มี ${currentBalance}, ปรับ ${adjustAmount})`);
            }

            // 2. อัปเดต balance ใน RCitemlist
            await tx.rCitemlist.update({
                where: { id: parsedLotId },
                data: { balance: newBalance }
            });

            // 3. สร้าง StockTransaction
            const transaction = await tx.stockTransaction.create({
                data: {
                    product_id: parsedLotId,
                    inventory_lot_id: parsedLotId,
                    itemcode: itemcode,
                    itemName: itemName || "",
                    lot: lot || "",
                    dateExp: dateExp ? new Date(dateExp) : null,
                    quantity_change: adjustAmount,
                    balance_after: newBalance,
                    transaction_type: "ADJUST",
                    company: String(company || ""),
                    person: person || "",
                    personsale: "",
                    receiverCompany: null,
                    receiverCompanyName: detailReason || normalizedReasonMain
                }
            });

            await tx.$executeRawUnsafe(
                'UPDATE "StockTransaction" SET "adjustReasonMain" = $1 WHERE "id" = $2',
                normalizedReasonMain,
                transaction.id
            );

            return { transaction, previousBalance: currentBalance, newBalance };
        }, {
            maxWait: 10000,
            timeout: 15000
        });

        return NextResponse.json({
            success: true,
            message: `ปรับยอดสำเร็จ: ${result.previousBalance} → ${result.newBalance}`,
            data: result
        }, { status: 201 });

    } catch (error: any) {
        console.error("[StockAdjust] Error:", error.message || error);
        return NextResponse.json(
            { error: error.message || "Failed to adjust stock" },
            { status: 500 }
        );
    }
}
