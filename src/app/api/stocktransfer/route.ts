import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLotsWithCalculatedBalance, transferableLotQty } from "@/lib/stockBalance";

// Helper function to generate transfer number
function generateTransferNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TRF-${year}${month}${day}${random}`;
}

// GET: ดึงรายการโอนของสาขา
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        // หน้าโอน: แสดงเฉพาะ order ที่สาขานี้เป็น "ผู้ส่ง" (โอนออกไปสาขาอื่น) เท่านั้น
        // order ที่สาขานี้เป็นผู้รับจะไปแสดงในหน้ารับโอนแทน
        const transfers = await prisma.stockTransfer.findMany({
            where: {
                fromUserId: parseInt(userId)
            },
            include: {
                items: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        // ดึงชื่อสาขาผู้ส่งและผู้รับจาก User table
        const userIds = [...new Set(transfers.flatMap(t => [t.fromUserId, t.toUserId]).filter(id => id > 0))];
        const users = userIds.length > 0 ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, company: true, name: true, email: true }
        }) : [];
        const userMap = new Map(users.map(u => [u.id, u]));

        // ดึง BranchConnection สำหรับ remote transfers เพื่อหาชื่อสาขาปลายทาง
        const remoteTransfers = transfers.filter(t => t.transferMode === "remote" || t.remark?.includes("Remote"));
        const connections = remoteTransfers.length > 0 ? await prisma.branchConnection.findMany({
            where: {
                fromUserId: parseInt(userId),
                status: "accepted"
            },
            select: { remoteUserId: true, remoteCompany: true, branchName: true, tunnelUrl: true }
        }) : [];

        const enrichedTransfers = transfers.map(t => {
            const transferMode = t.transferMode || (t.remark?.includes("Remote") ? "remote" : "connected");
            const isRemote = transferMode === "remote";
            let fromBranchName = t.fromBranchNameSnapshot || userMap.get(t.fromUserId)?.company || (t.fromUserId === 0 ? "Remote" : "-");
            let fromEmail = t.fromBranchEmailSnapshot || userMap.get(t.fromUserId)?.email || "";
            let toBranchName = t.toBranchNameSnapshot || userMap.get(t.toUserId)?.company || "-";
            let toEmail = t.toBranchEmailSnapshot || userMap.get(t.toUserId)?.email || "";

            if (isRemote) {
                // สำหรับ remote transfer: ดึงชื่อสาขาจาก BranchConnection โดยใช้ tunnelUrl (normalize ก่อนเทียบ)
                const tunnelUrlMatch = t.remark?.match(/via (.+)$/);
                const tunnelUrl = (tunnelUrlMatch?.[1] || "").replace(/\/+$/, "").trim();
                // ลำดับความสำคัญ: 1) tunnelUrl match 2) remoteUserId fallback
                const conn = (tunnelUrl
                    ? connections.find(c => (c.tunnelUrl || "").replace(/\/+$/, "").trim() === tunnelUrl)
                    : null
                ) || connections.find(c => c.remoteUserId === t.toUserId);
                if (conn) {
                    toBranchName = t.toBranchNameSnapshot || conn.branchName || conn.remoteCompany || toBranchName;
                    toEmail = t.toBranchEmailSnapshot || "";
                }
            }

            if (transferMode === "manual") {
                fromBranchName = t.fromBranchNameSnapshot || fromBranchName;
                fromEmail = t.fromBranchEmailSnapshot || fromEmail;
                toBranchName = t.toBranchNameSnapshot || "-";
                toEmail = t.toBranchEmailSnapshot || "";
            }

            return {
                ...t,
                transferMode,
                fromBranchName,
                fromPersonName: userMap.get(t.fromUserId)?.name || "",
                fromEmail,
                toBranchName,
                toPersonName: isRemote ? "" : (userMap.get(t.toUserId)?.name || ""),
                toEmail,
                toBranchDetail: t.toBranchDetailSnapshot || "",
            };
        });

        return NextResponse.json(enrichedTransfers);
    } catch (error) {
        console.error("Error fetching transfers:", error);
        return NextResponse.json(
            { error: "Failed to fetch transfers" },
            { status: 500 }
        );
    }
}

// Helper: ส่งสินค้าไปยังสาขา remote ผ่าน Tunnel
async function sendToRemoteBranch(
    tunnelUrl: string,
    apiToken: string,
    remoteUserId: number,
    items: any[],
    fromCompany: string,
    transferNo: string,
    person: string
): Promise<{ success: boolean; error?: string; remoteData?: any }> {
    const cleanUrl = tunnelUrl.replace(/\/+$/, "");

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        console.log(`[RemoteTransfer] 📤 Sending ${items.length} items to ${cleanUrl}/api/stocktransfer/receive (toCompanyId=${remoteUserId})`);

        const res = await fetch(`${cleanUrl}/api/stocktransfer/receive`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                toCompanyId: remoteUserId,
                apiToken, items, fromCompany, transferNo, person
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        // อ่าน response body เสมอ เพื่อ verify ว่า remote สร้าง record จริง
        const responseText = await res.text().catch(() => "");
        let responseData: any = null;
        try {
            responseData = JSON.parse(responseText);
        } catch {
            // response ไม่ใช่ JSON — อาจเป็น Cloudflare error page
        }

        console.log(`[RemoteTransfer] 📥 Response: status=${res.status}, isJSON=${!!responseData}, body=${responseText.substring(0, 300)}`);

        if (!res.ok) {
            const errMsg = responseData?.error || responseText.substring(0, 200) || `HTTP ${res.status}`;
            console.log(`[RemoteTransfer] ❌ Remote returned ${res.status}: ${errMsg}`);
            return { success: false, error: `Remote returned ${res.status}: ${errMsg}` };
        }

        // ตรวจสอบว่า response เป็น JSON ที่มี success: true
        if (!responseData || !responseData.success) {
            console.log(`[RemoteTransfer] ❌ Remote returned 200 but no success flag — possible Cloudflare interception`);
            return { success: false, error: "Remote returned 200 but response is not valid (possible Cloudflare interception)" };
        }

        console.log(`[RemoteTransfer] ✅ Success: transferNo=${responseData.transferNo || transferNo}, items=${responseData.data?.transferItems?.length || '?'}`);
        return { success: true, remoteData: responseData };
    } catch (err: any) {
        console.log(`[RemoteTransfer] ❌ Network error: ${err.message}`);
        return { success: false, error: err.message || "Network error" };
    }
}

// POST: สร้างการโอนใหม่พร้อมตัด stock (รองรับทั้ง local และ remote)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            fromUserId, toUserId, items, person, remark, fromCompany, toCompany,
            isRemote, tunnelUrl, apiToken, remoteUserId, transferMode,
            fromBranchNameSnapshot, fromBranchEmailSnapshot,
            toBranchNameSnapshot, toBranchEmailSnapshot, toBranchDetailSnapshot
        } = body;

        const normalizedTransferMode = transferMode === "manual" ? "manual" : (isRemote ? "remote" : "connected");
        const isManual = normalizedTransferMode === "manual";

        if (!fromUserId || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "fromUserId and items are required" },
                { status: 400 }
            );
        }

        // สำหรับ local transfer ต้องมี toUserId
        if (!isManual && !isRemote && !toUserId) {
            return NextResponse.json(
                { error: "toUserId is required for local transfer" },
                { status: 400 }
            );
        }

        // สำหรับ remote transfer ต้องมี tunnelUrl, apiToken, remoteUserId
        if (!isManual && isRemote && (!tunnelUrl || !apiToken || !remoteUserId)) {
            return NextResponse.json(
                { error: "tunnelUrl, apiToken, and remoteUserId are required for remote transfer" },
                { status: 400 }
            );
        }

        // ตรวจสอบว่าเชื่อมสาขากันหรือไม่
        let connection = null;
        if (!isManual) {
            if (isRemote) {
                // สำหรับ remote: ค้นหา connection ที่มี tunnelUrl ตรงกัน
                connection = await prisma.branchConnection.findFirst({
                    where: {
                        fromUserId: parseInt(fromUserId),
                        tunnelUrl: tunnelUrl,
                        status: "accepted"
                    }
                });
            } else {
                connection = await prisma.branchConnection.findFirst({
                    where: {
                        OR: [
                            { fromUserId: parseInt(fromUserId), toUserId: parseInt(toUserId), status: "accepted" },
                            { fromUserId: parseInt(toUserId), toUserId: parseInt(fromUserId), status: "accepted" }
                        ]
                    }
                });
            }
        }

        if (!isManual && !connection) {
            return NextResponse.json(
                { error: "สาขาไม่ได้เชื่อมต่อกัน กรุณาเชื่อมสาขาก่อน" },
                { status: 403 }
            );
        }

        const transferNo = generateTransferNo();

        const result = await prisma.$transaction(async (tx) => {
            const resolvedFromBranchNameSnapshot = fromBranchNameSnapshot || fromCompany || "";
            const resolvedFromBranchEmailSnapshot = fromBranchEmailSnapshot || person || "";
            const resolvedToBranchNameSnapshot = toBranchNameSnapshot || toCompany || (isManual ? "Manual" : "");
            const resolvedToBranchEmailSnapshot = toBranchEmailSnapshot || "";
            const resolvedToBranchDetailSnapshot = toBranchDetailSnapshot || "";

            // 1. สร้างรายการโอน (ใช้ remoteUserId สำหรับ toUserId ถ้าเป็น remote)
            console.log(`[Transfer] Starting transaction: fromUserId=${fromUserId}, toUserId=${toUserId}, items=${items.length}, mode=${normalizedTransferMode}`);
            const transfer = await tx.stockTransfer.create({
                data: {
                    transferNo: transferNo,
                    fromUserId: parseInt(fromUserId),
                    toUserId: isManual ? 0 : (isRemote ? (remoteUserId || 0) : parseInt(toUserId)),
                    transferMode: normalizedTransferMode,
                    status: isManual ? "completed" : (isRemote ? "pending_remote" : "pending_receive"),
                    completedAt: isManual ? new Date() : null,
                    person,
                    remark: isManual
                        ? `Manual transfer to ${resolvedToBranchNameSnapshot}`
                        : (isRemote ? `Remote transfer via ${tunnelUrl}` : remark),
                    fromBranchNameSnapshot: resolvedFromBranchNameSnapshot,
                    fromBranchEmailSnapshot: resolvedFromBranchEmailSnapshot,
                    toBranchNameSnapshot: resolvedToBranchNameSnapshot,
                    toBranchEmailSnapshot: resolvedToBranchEmailSnapshot,
                    toBranchDetailSnapshot: resolvedToBranchDetailSnapshot
                }
            });

            const transferItems = [];
            const lotDetails: any[] = [];
            const remoteItems: any[] = [];
            const createdTxIds: number[] = [];

            for (const item of items) {
                const { lotId, itemcode, itemName, lot, dateExp, qty, cost } = item;

                // 2. ตัด stock จากสาขาผู้ส่ง (เหมือนเดิมทั้ง local และ remote)
                const parsedLotId = parseInt(lotId);
                if (isNaN(parsedLotId)) {
                    throw new Error(`lotId ไม่ถูกต้อง: "${lotId}" สำหรับสินค้า ${itemName}`);
                }
                console.log(`[Transfer] 🔍 Looking up lotId=${lotId} (parsed=${parsedLotId}) for ${itemcode} ${itemName}`);

                const senderLot = await tx.rCitemlist.findUnique({
                    where: { id: parsedLotId }
                });

                if (!senderLot) {
                    throw new Error(`ไม่พบ Lot ID: ${lotId}`);
                }

                // ยอดที่โอนได้ = min(balance ที่บันทึกจริง, ยอดคำนวณจาก transaction)
                // สูตรเดียวกับหน้า Lot สินค้า/หน้าขาย — นับ TRANSFER_IN ที่รับเข้ามาด้วย
                const calculatedLots = await getLotsWithCalculatedBalance({
                    company: senderLot.company || String(fromUserId),
                    itemcode: senderLot.itemcode || itemcode || "",
                    barcode: senderLot.Barcode
                }, tx);
                const calcLot = calculatedLots.find(l => Number(l.id) === parsedLotId);
                const rawBalance = parseFloat(String(senderLot.balance)) || 0;
                const availableQty = calcLot
                    ? transferableLotQty(calcLot)
                    : Math.max(0, rawBalance);

                console.log(`[Transfer] 📦 Lot #${parsedLotId}: rawBalance=${rawBalance}, calculatedBalance=${calcLot?.balance}, available=${availableQty}`);

                const transferQty = parseFloat(qty);

                if (transferQty > availableQty) {
                    throw new Error(`สินค้า ${itemName} มี stock ไม่พอ (ต้องการ ${transferQty}, โอนได้ ${availableQty}) [lotId=${parsedLotId}]`);
                }

                // หักยอดจาก balance เดิมตรง ๆ (ไม่เขียนทับด้วยค่าคำนวณ — กัน balance เพี้ยนถ้าสูตรคำนวณพลาดกับข้อมูลเก่า)
                await tx.rCitemlist.update({
                    where: { id: parsedLotId },
                    data: { balance: rawBalance - transferQty }
                });

                if (!isRemote && !isManual) {
                    // === LOCAL TRANSFER: ไม่เพิ่ม stock ทันที รอผู้รับยืนยันก่อน ===
                    // Stock จะถูกเพิ่มเมื่อผู้รับกด confirm ทีละ item
                } else {
                    // === REMOTE TRANSFER: เก็บข้อมูลไว้ส่งไปยังสาขา remote ===
                    if (isManual) {
                        // Manual transfer does not create receiver-side stock movement.
                    } else {
                        remoteItems.push({
                            itemcode,
                            itemName,
                            lot,
                            dateExp,
                            qty: transferQty,
                            cost,
                            barcode: senderLot.Barcode,
                            unit: senderLot.unit,
                            codevender: senderLot.codevender,
                            namevender: senderLot.namevender,
                            type: senderLot.type,
                            subtype: senderLot.subtype
                        });
                    }
                }

                // 4. บันทึก StockTransaction สำหรับการตัด (เก็บ id ไว้ใช้ rollback กรณี remote ส่งไม่สำเร็จ)
                const outTx = await tx.stockTransaction.create({
                    data: {
                        product_id: senderLot.id,
                        inventory_lot_id: senderLot.id,
                        itemcode: itemcode,
                        itemName: itemName,
                        lot: lot,
                        dateExp: dateExp ? new Date(dateExp) : null,
                        quantity_change: -transferQty,
                        balance_after: rawBalance - transferQty,
                        transaction_type: "TRANSFER_OUT",
                        company: String(fromUserId),
                        person: person,
                        receiverCompany: isManual
                            ? `manual:${resolvedToBranchNameSnapshot}`
                            : (isRemote ? `remote:${remoteUserId}` : String(toUserId)),
                        receiverCompanyName: resolvedToBranchNameSnapshot || toCompany
                    } as any
                });
                createdTxIds.push(outTx.id);

                // 5. บันทึก transfer item (พร้อม barcode, unit สำหรับแสดงผล)
                const transferItem = await tx.stockTransferItem.create({
                    data: {
                        transferId: transfer.id,
                        itemcode,
                        itemName,
                        lotId: parseInt(lotId),
                        lot,
                        dateExp: dateExp ? new Date(dateExp) : null,
                        qty: transferQty,
                        cost,
                        barcode: senderLot.Barcode || "",
                        unit: senderLot.unit || "",
                        confirmedQty: isManual ? transferQty : null,
                        itemStatus: isManual ? "confirmed" : "pending"
                    } as any
                });

                transferItems.push(transferItem);

                lotDetails.push({
                    lotId: parsedLotId,
                    itemcode,
                    itemName,
                    lot,
                    transferred: transferQty,
                    previousBalance: rawBalance,
                    newBalance: rawBalance - transferQty
                });

                // Stock change logged above
            }

            return { transfer, transferItems, lotDetails, remoteItems, createdTxIds };
        }, {
            maxWait: 10000,
            timeout: 30000
        });

        // === สำหรับ remote transfer: ส่งสินค้าไปยังสาขาปลายทางผ่าน Tunnel ===
        if (isRemote && result.remoteItems.length > 0) {
            const remoteResult = await sendToRemoteBranch(
                tunnelUrl,
                apiToken,
                remoteUserId,
                result.remoteItems,
                fromCompany,
                transferNo,
                person
            );

            if (remoteResult.success) {
                // อัปเดตสถานะเป็น completed
                await prisma.stockTransfer.update({
                    where: { id: result.transfer.id },
                    data: { status: "completed", completedAt: new Date() }
                });
            } else {
                // ถ้าส่งไม่สำเร็จ → rollback: ลบ StockTransaction ที่สร้างรอบนี้ แล้วคืน balance ที่หักไว้
                console.log(`[RemoteTransfer] ❌ Rolling back transfer #${result.transfer.id}: ${remoteResult.error}`);

                // 1. ลบเฉพาะ StockTransaction ที่สร้างในรอบนี้ (ลบด้วย id — ไม่กระทบประวัติโอนเก่าของ lot เดิม)
                if (result.createdTxIds.length > 0) {
                    await prisma.stockTransaction.deleteMany({
                        where: { id: { in: result.createdTxIds } }
                    });
                    console.log(`[RemoteTransfer] 🗑️ Deleted TRANSFER_OUT StockTransactions: ${result.createdTxIds.join(", ")}`);
                }

                // 2. บวกยอดที่หักไว้กลับคืน lot เดิม (ไม่ recalculate ทั้งก้อน — กันข้อมูลเก่าที่เพี้ยนพลอยถูกเขียนทับ)
                for (const detail of result.lotDetails) {
                    if (!detail.lotId || !detail.transferred) continue;
                    await prisma.rCitemlist.update({
                        where: { id: detail.lotId },
                        data: { balance: { increment: detail.transferred } }
                    });
                    console.log(`[RemoteTransfer] ↩️ Lot #${detail.lotId}: returned ${detail.transferred} to balance`);
                }

                // 3. ลบ StockTransferItem + อัปเดต StockTransfer เป็น failed
                await prisma.stockTransferItem.deleteMany({
                    where: { transferId: result.transfer.id }
                });
                await prisma.stockTransfer.update({
                    where: { id: result.transfer.id },
                    data: { status: "failed", remark: `Remote error: ${remoteResult.error}` }
                });

                return NextResponse.json(
                    { error: `โอนไปยังสาขาปลายทางไม่สำเร็จ: ${remoteResult.error}` },
                    { status: 502 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: isManual ? "โอนสินค้า Manual สำเร็จ" : (isRemote ? "โอนสินค้าข้ามสาขาสำเร็จ (Remote)" : "โอนสินค้าสำเร็จ"),
            data: result
        }, { status: 201 });

    } catch (error: any) {
        const errorCode = error?.code || '';
        const errorMeta = error?.meta ? JSON.stringify(error.meta) : '';
        console.error(`[Transfer] ❌ Error (code=${errorCode}):`, error.message || error);
        if (errorMeta) console.error(`[Transfer] ❌ Meta:`, errorMeta);

        let userMessage = error.message || "Failed to create transfer";
        let status = 500;

        if (errorCode === 'P2028') {
            userMessage = "ระบบประมวลผลล่าช้า กรุณาลองใหม่อีกครั้ง (Transaction timeout)";
        } else if (errorCode === 'P2002') {
            userMessage = "เกิดข้อขัดแย้งในฐานข้อมูล กรุณาลองใหม่อีกครั้ง (Sequence conflict)";
            status = 409;
        } else if (errorCode === 'P2024') {
            userMessage = "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่ (Connection pool timeout)";
            status = 503;
        }

        return NextResponse.json(
            { error: userMessage, code: errorCode },
            { status }
        );
    }
}
