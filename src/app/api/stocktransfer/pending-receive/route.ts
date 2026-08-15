import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: ดึงรายการโอนที่รอรับ (pending_receive) สำหรับสาขาผู้รับ
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        const statusFilter = searchParams.get("status") || "pending_receive";
        const statusList = statusFilter === "history"
            ? ["completed", "failed", "pending_receive"]
            : [statusFilter];

        const parsedUserId = parseInt(userId);
        // หน้ารับโอน: แสดงเฉพาะ order ที่สาขานี้เป็น "ผู้รับ" (รับโอนจากสาขาอื่น) เท่านั้น
        // ตัด order ที่สาขานี้เป็นผู้ส่งเองออก (กรณี remote userId ชนกันข้าม DB ทำให้ toUserId ตรงกับตัวเอง)
        const transfers = await prisma.stockTransfer.findMany({
            where: {
                toUserId: parsedUserId,
                fromUserId: { not: parsedUserId },
                status: { in: statusList }
            },
            include: {
                items: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        // Debug: ถ้าไม่พบ transfer ให้ตรวจสอบว่ามี pending_receive อยู่ใน DB หรือไม่ (อาจ userId ไม่ตรง)
        if (transfers.length === 0 && statusFilter !== "history") {
            const allPending = await prisma.stockTransfer.findMany({
                where: { status: "pending_receive" },
                select: { id: true, toUserId: true, fromUserId: true, transferNo: true, createdAt: true }
            });
            if (allPending.length > 0) {
                console.log(`[PendingReceive] ⚠️ No transfers found for userId=${parsedUserId}, but ${allPending.length} pending_receive exist in DB:`);
                allPending.forEach(t => console.log(`  → id=${t.id} toUserId=${t.toUserId} fromUserId=${t.fromUserId} no=${t.transferNo}`));
                console.log(`[PendingReceive] 💡 Check: SettingEmployee.id_company should match toUserId above`);
            }
        }

        // ดึงชื่อสาขาผู้รับจาก User table
        const receiverUser = await prisma.user.findUnique({
            where: { id: parsedUserId },
            select: { id: true, company: true, name: true, email: true }
        });

        // ดึงชื่อสาขาผู้ส่ง (local) ถ้า fromUserId > 0
        const fromUserIds = [...new Set(transfers.map(t => t.fromUserId).filter(id => id > 0))];
        const fromUsers = fromUserIds.length > 0 ? await prisma.user.findMany({
            where: { id: { in: fromUserIds } },
            select: { id: true, company: true, name: true, email: true }
        }) : [];
        const fromUserMap = new Map(fromUsers.map(u => [u.id, u]));

        const enrichedTransfers = transfers.map(t => {
            // สำหรับ remote transfer: fromUserId=0, ชื่อสาขาอยู่ใน remark "Remote transfer from XXX"
            let fromBranchName = fromUserMap.get(t.fromUserId)?.company || "";
            if (t.fromUserId === 0 && t.remark) {
                const match = t.remark.match(/from (.+)$/);
                if (match) fromBranchName = match[1];
            }
            if (!fromBranchName) fromBranchName = "Remote";

            return {
                ...t,
                fromBranchName,
                fromEmail: fromUserMap.get(t.fromUserId)?.email || "",
                toBranchName: receiverUser?.company || "-",
                toEmail: receiverUser?.email || "",
            };
        });

        return NextResponse.json(enrichedTransfers);
    } catch (error: any) {
        console.error("Error fetching pending transfers:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: ยืนยันรับสินค้าทีละ item หรือ แก้ไขจำนวน + คืนส่วนที่เหลือ
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, transferItemId, confirmedQty, receiverCompanyId, receiverPerson } = body;

        if (!transferItemId || !receiverCompanyId) {
            return NextResponse.json({ error: "transferItemId and receiverCompanyId are required" }, { status: 400 });
        }

        const transferItem = await prisma.stockTransferItem.findUnique({
            where: { id: parseInt(transferItemId) },
            include: { transfer: true }
        });

        if (!transferItem) {
            return NextResponse.json({ error: "ไม่พบรายการโอน" }, { status: 404 });
        }

        if ((transferItem as any).itemStatus === "confirmed") {
            return NextResponse.json({ error: "รายการนี้ยืนยันแล้ว" }, { status: 400 });
        }

        const originalQty = transferItem.qty || 0;
        const finalQty = action === "confirm" ? originalQty : parseFloat(confirmedQty || 0);

        if (action === "confirm_edit" && (finalQty < 0 || finalQty > originalQty)) {
            return NextResponse.json({ error: `จำนวนต้องอยู่ระหว่าง 0 ถึง ${originalQty}` }, { status: 400 });
        }

        const companyId = String(receiverCompanyId);

        await prisma.$transaction(async (tx: any) => {
            // 1. เพิ่ม stock ที่สาขาผู้รับ (ด้วยจำนวนที่ยืนยัน)
            if (finalQty > 0) {
                const unitCost = transferItem.cost || 0;
                const fromBranchName = transferItem.transfer.fromBranchNameSnapshot
                    || transferItem.transfer.remark?.match(/from (.+)$/)?.[1]
                    || "";

                // หาสินค้าฝั่งผู้รับ — ถ้าไม่มี barcode ต้องค้นด้วย code เท่านั้น
                // ห้ามค้นด้วย Barcode: "" เด็ดขาด เพราะจะไปเจอ "สินค้าตัวแรกที่ไม่มีบาร์โค้ด" ของสาขา
                // แล้วลง lot ผิดตัวสินค้า (สาขาหนึ่งมีสินค้าไร้บาร์โค้ดเป็นร้อย ๆ ตัว)
                const transferBarcode = ((transferItem as any).barcode || "").trim();
                const transferItemCode = (transferItem.itemcode || "").trim();
                const receiverProductWhere = transferBarcode
                    ? { company: companyId, Barcode: transferBarcode }
                    : (transferItemCode ? { company: companyId, code: transferItemCode } : null);
                const receiverProduct = receiverProductWhere
                    ? await tx.datalist.findFirst({ where: receiverProductWhere })
                    : null;

                // รหัส/ชื่อ/บาร์โค้ดฝั่งผู้รับ — lot และ StockTransaction ต้องผูกด้วยชุดเดียวกัน
                // ไม่งั้นหน้าสรุปยอดคงเหลือ (ค้น StockTransaction ด้วย itemcode ของผู้รับ) จะหา TRANSFER_IN ไม่เจอ
                const targetItemCode = receiverProduct?.code ?? transferItem.itemcode;
                const targetItemName = receiverProduct?.ProductName ?? transferItem.itemName;
                const targetBarcode = transferBarcode || (receiverProduct?.Barcode || "").trim();

                // รวมเฉพาะกับ lot ที่มาจากการโอนด้วยกัน (statuss "โอนสินค้า") —
                // ห้ามรวมกับ lot รับซื้อปกติ เพราะ qty ของ lot ปกตินับใน "ยอดรับทั้งหมด" จะกลายเป็นนับซ้ำกับ TRANSFER_IN
                // เงื่อนไขต้องระบุตัวสินค้าได้จริง (barcode หรือ itemcode ของผู้รับ) ไม่งั้น lot "00" ของคนละสินค้าจะถูกรวมกอง
                let existingReceiverLot = targetBarcode
                    ? await tx.rCitemlist.findFirst({
                        where: {
                            company: companyId,
                            Barcode: targetBarcode,
                            lot: transferItem.lot || "",
                            statuss: "โอนสินค้า"
                        }
                    })
                    : null;

                if (!existingReceiverLot && targetItemCode) {
                    existingReceiverLot = await tx.rCitemlist.findFirst({
                        where: {
                            company: companyId,
                            itemcode: targetItemCode,
                            lot: transferItem.lot || "",
                            statuss: "โอนสินค้า"
                        }
                    });
                }

                let receiverLotId: number;
                let receiverLotBalanceAfter: number;

                if (existingReceiverLot) {
                    receiverLotBalanceAfter = (parseFloat(String(existingReceiverLot.balance)) || 0) + finalQty;
                    // อัปเดต qty (ยอดรับสะสม) และ totalcost ด้วย — ไม่ใช่แค่ balance
                    // เพื่อให้ช่อง "รับ"/"มูลค่า" ในหน้า Lot สินค้า สะท้อนยอดรับโอนจริง
                    await tx.rCitemlist.update({
                        where: { id: existingReceiverLot.id },
                        data: {
                            qty: (existingReceiverLot.qty || 0) + finalQty,
                            balance: receiverLotBalanceAfter,
                            totalcost: (existingReceiverLot.totalcost || 0) + finalQty * unitCost
                        }
                    });
                    receiverLotId = existingReceiverLot.id;
                } else {
                    const createdLot = await tx.rCitemlist.create({
                        data: {
                            company: companyId,
                            itemcode: targetItemCode,
                            itemName: targetItemName,
                            unit: (transferItem as any).unit || "",
                            lot: transferItem.lot || "",
                            dateExp: transferItem.dateExp,
                            newCost: unitCost,
                            qty: finalQty,
                            balance: finalQty,
                            type: "",
                            Barcode: targetBarcode,
                            statuss: "โอนสินค้า",
                            dateRC: new Date(),
                            totalcost: finalQty * unitCost,
                            codenames: `TRF:${transferItem.transfer.transferNo}`,
                            // แสดงสาขาต้นทางในช่อง "ผู้จำหน่าย" และผู้กดรับในช่อง person
                            namevender: fromBranchName,
                            person: receiverPerson || transferItem.transfer.person || ""
                        }
                    });
                    receiverLotId = createdLot.id;
                    receiverLotBalanceAfter = finalQty;
                }

                // บันทึก StockTransaction สำหรับ TRANSFER_IN — ผูกกับ lot ของ "ฝั่งผู้รับ"
                // (transferItem.lotId คือ lot ID ฝั่งผู้ส่ง ใช้ไม่ได้ และเป็น null สำหรับ remote transfer)
                // itemcode ต้องเป็นรหัสฝั่งผู้รับ (targetItemCode) ให้ตรงกับ lot ที่เพิ่งเขียน —
                // ถ้าใช้รหัสผู้ส่งแล้วสองสาขาใช้รหัสไม่ตรงกัน หน้าสรุปยอดคงเหลือจะนับ "ยอดรับโอนเข้า" ไม่เจอ
                await tx.stockTransaction.create({
                    data: {
                        product_id: receiverLotId,
                        inventory_lot_id: receiverLotId,
                        itemcode: targetItemCode,
                        itemName: targetItemName,
                        lot: transferItem.lot,
                        dateExp: transferItem.dateExp,
                        quantity_change: finalQty,
                        balance_after: receiverLotBalanceAfter,
                        transaction_type: "TRANSFER_IN",
                        company: companyId,
                        // ผู้รับโอน = ผู้ที่กดยืนยันรับโอน (ถ้าไม่ส่งมาให้ fallback เป็น person เดิมของใบโอน)
                        person: receiverPerson || transferItem.transfer.person,
                        receiverCompany: String(transferItem.transfer.fromUserId),
                        receiverCompanyName: fromBranchName
                    } as any
                });
            }

            // 2. คืน stock ส่วนที่เหลือกลับสาขาต้นทาง (ถ้ามี)
            const returnQty = originalQty - finalQty;
            if (returnQty > 0 && transferItem.lotId) {
                const senderLot = await tx.rCitemlist.findUnique({
                    where: { id: transferItem.lotId }
                });

                if (senderLot) {
                    await tx.rCitemlist.update({
                        where: { id: senderLot.id },
                        data: {
                            balance: (parseFloat(String(senderLot.balance)) || 0) + returnQty
                        }
                    });

                    // บันทึก StockTransaction สำหรับ TRANSFER_RETURN
                    // ของคืนเข้า lot ผู้ส่ง → itemcode ต้องเป็นรหัสของ lot นั้น (กติกาเดียวกับ TRANSFER_IN)
                    await tx.stockTransaction.create({
                        data: {
                            product_id: senderLot.id,
                            inventory_lot_id: senderLot.id,
                            itemcode: senderLot.itemcode ?? transferItem.itemcode,
                            itemName: senderLot.itemName ?? transferItem.itemName,
                            lot: transferItem.lot,
                            dateExp: transferItem.dateExp,
                            quantity_change: returnQty,
                            balance_after: (parseFloat(String(senderLot.balance)) || 0) + returnQty,
                            transaction_type: "TRANSFER_RETURN",
                            company: String(transferItem.transfer.fromUserId),
                            person: transferItem.transfer.person,
                        } as any
                    });
                }
            }

            // 3. อัปเดตสถานะ item
            await tx.stockTransferItem.update({
                where: { id: transferItem.id },
                data: {
                    confirmedQty: finalQty,
                    itemStatus: "confirmed"
                } as any
            });

            // 4. ตรวจสอบว่า item ทั้งหมดใน transfer ยืนยันหมดหรือยัง
            const remainingPending = await tx.stockTransferItem.findMany({
                where: {
                    transferId: transferItem.transferId,
                    NOT: { id: transferItem.id }
                }
            });

            const allConfirmed = remainingPending.every((item: any) => item.itemStatus === "confirmed");

            if (allConfirmed) {
                await tx.stockTransfer.update({
                    where: { id: transferItem.transferId },
                    data: { status: "completed", completedAt: new Date() }
                });
            }
        });

        // Stock change completed above

        return NextResponse.json({
            success: true,
            message: action === "confirm"
                ? `ยืนยันรับสินค้า ${transferItem.itemName} จำนวน ${finalQty} สำเร็จ`
                : `ยืนยันรับสินค้า ${transferItem.itemName} จำนวน ${finalQty} (คืน ${originalQty - finalQty}) สำเร็จ`,
            confirmedQty: finalQty,
            returnedQty: originalQty - finalQty
        });

    } catch (error: any) {
        console.error("Error confirming transfer item:", error);
        return NextResponse.json({ error: error.message || "Failed to confirm" }, { status: 500 });
    }
}
