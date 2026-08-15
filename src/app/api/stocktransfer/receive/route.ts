import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBranchApiToken } from "@/lib/branchApiAuth";

// POST: รับสินค้าจากสาขาอื่นผ่าน Tunnel
// เครื่องผู้ส่งจะเรียก endpoint นี้เพื่อสร้างรายการรอรับในเครื่องผู้รับ
// ผู้รับต้องยืนยันก่อน stock จึงจะเพิ่ม (ใช้ flow เดียวกับ local transfer)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { toCompanyId, apiToken, items, fromCompany, transferNo, person } = body;

        if (!toCompanyId || !apiToken || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "toCompanyId, apiToken, and items are required" },
                { status: 400 }
            );
        }

        const auth = await verifyBranchApiToken(toCompanyId, apiToken);

        if (!auth) {
            console.log(`[RemoteReceive] ❌ apiToken mismatch for userId=${toCompanyId}`);
            return NextResponse.json(
                { error: "Invalid apiToken" },
                { status: 401 }
            );
        }

        const user = auth.user;

        console.log(`[RemoteReceive] 📥 Validated user: id=${user.id}, company="${user.company}", auth=${auth.matchedBy}, items=${items.length}, transferNo=${transferNo}, from="${fromCompany}"`);

        const result = await prisma.$transaction(async (tx) => {
            // 1. สร้าง StockTransfer record บน DB ของผู้รับ เพื่อให้แสดงในหน้ารับโอน
            const transfer = await tx.stockTransfer.create({
                data: {
                    transferNo: transferNo || null,
                    fromUserId: 0, // remote sender (ไม่มี userId ใน DB นี้)
                    toUserId: user.id, // ใช้ validated user.id ตรงๆ
                    transferMode: "remote",
                    status: "pending_receive",
                    person: person || "Remote Transfer",
                    remark: `Remote transfer from ${fromCompany || "Remote"}`,
                    fromBranchNameSnapshot: fromCompany || "Remote",
                    fromBranchEmailSnapshot: "",
                    toBranchNameSnapshot: user.company || "",
                    toBranchEmailSnapshot: user.email || "",
                    toBranchDetailSnapshot: ""
                }
            });

            // 2. สร้าง StockTransferItem สำหรับแต่ละ item
            const transferItems = [];
            for (const item of items) {
                const { itemcode, itemName, lot, dateExp, qty, cost, barcode, unit } = item;

                const transferQty = parseFloat(qty);
                if (!transferQty || transferQty <= 0) continue;

                const transferItem = await tx.stockTransferItem.create({
                    data: {
                        transferId: transfer.id,
                        itemcode: itemcode || "",
                        itemName: itemName || "",
                        lotId: null,
                        lot: lot || "",
                        dateExp: dateExp ? new Date(dateExp) : null,
                        qty: transferQty,
                        cost: cost || 0,
                        barcode: barcode || "",
                        unit: unit || "",
                        itemStatus: "pending"
                    } as any
                });

                transferItems.push(transferItem);
            }

            return { transfer, transferItems };
        });

        console.log(`[RemoteReceive] ✅ Created StockTransfer #${result.transfer.id} (${transferNo}) with ${result.transferItems.length} items for receiver userId=${toCompanyId}`);

        return NextResponse.json({
            success: true,
            message: "สร้างรายการรอรับสำเร็จ",
            transferNo: transferNo,
            data: result
        }, { status: 201 });

    } catch (error: any) {
        console.error("Error in receive:", error);
        return NextResponse.json(
            { error: error.message || "Failed to receive stock" },
            { status: 500 }
        );
    }
}
