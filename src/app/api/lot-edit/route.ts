import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLotsWithCalculatedBalance } from "@/lib/stockBalance";
import { computeNetCostOrNull } from "@/lib/lotCost";

const LOT_EDIT_ADJUST_REASON = "แก้ไขยอดจากหน้า Lot สินค้า";

// PUT: แก้ไขข้อมูล Lot (RCitemlist)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { lotId, lot, dateExp, balance, dateRC, newCost, person } = body;

        if (!lotId) {
            return NextResponse.json({ error: "lotId is required" }, { status: 400 });
        }

        const existing = await prisma.rCitemlist.findUnique({ where: { id: parseInt(lotId) } });
        if (!existing) {
            return NextResponse.json({ error: "Lot not found" }, { status: 404 });
        }

        const updateData: any = {};

        if (lot !== undefined && lot !== null) {
            updateData.lot = String(lot).trim();
        }

        if (dateExp !== undefined) {
            updateData.dateExp = dateExp ? new Date(dateExp) : null;
        }

        if (balance !== undefined && balance !== null) {
            const newBalance = parseFloat(String(balance));
            if (isNaN(newBalance)) {
                return NextResponse.json({ error: "balance must be a number" }, { status: 400 });
            }
            updateData.balance = newBalance;
            // sync ตัวนับขาย (sale) ให้สอดคล้องกับคงเหลือใหม่ เพราะหน้าขายเช็คว่า lot ยังมีของจาก qty > sale
            // ถ้าไม่ sync การแก้คงเหลือจะไม่มีผลกับการเลือก lot ตอนตัดสต็อก
            const receivedTotal = (existing.qty || 0) + (existing.freebaht || 0);
            updateData.sale = Math.max(0, receivedTotal - Math.max(0, newBalance));
        }

        if (dateRC !== undefined) {
            updateData.dateRC = dateRC ? new Date(dateRC) : null;
        }

        if (newCost !== undefined && newCost !== null) {
            const cost = parseFloat(String(newCost));
            if (isNaN(cost) || cost < 0) {
                return NextResponse.json({ error: "newCost must be a non-negative number" }, { status: 400 });
            }
            updateData.newCost = cost;
            // อัปเดตมูลค่ารวมของล็อตให้สอดคล้องกับต้นทุนใหม่ (ใช้คงเหลือใหม่ถ้ามีการแก้ไขพร้อมกัน)
            const lotBalance = updateData.balance !== undefined ? updateData.balance : (existing.balance || 0);
            updateData.totalcost = Math.round(cost * lotBalance * 100) / 100;
            // ทุนสุทธิต้องขยับตามทุนใหม่ด้วย ไม่งั้นค่าที่คำนวณไว้เดิมจะค้างและกลบทุนที่เพิ่งแก้
            // หน้านี้แก้ทีละฟิลด์ จึงต้องคำนวณจากแถวที่ merge ค่าเดิมแล้ว (ไม่ใช่เฉพาะที่ส่งมา)
            updateData.netCost = computeNetCostOrNull({ ...existing, ...updateData });
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }

        // ถ้ามีการส่งยอดคงเหลือมา → เทียบกับ "ยอดคำนวณจากประวัติ" แล้วบันทึกส่วนต่างเป็น ADJUST อัตโนมัติ
        // เพื่อให้ยอดบันทึกกับยอดคำนวณขยับไปด้วยกันเสมอ (และซ่อม lot เก่าที่สองยอดเพี้ยนกันอยู่ในตัว
        // ทุกครั้งที่มีคนกดบันทึก — หน้าโอน/หน้าขายใช้ min(สองยอดนี้) จึงต้องตรงกันจึงจะใช้ของได้ครบ)
        let adjustDelta = 0;
        const newBalanceValue: number | null = updateData.balance !== undefined ? updateData.balance : null;
        if (newBalanceValue !== null) {
            const calculatedLots = await getLotsWithCalculatedBalance({
                company: existing.company || "",
                itemcode: existing.itemcode || "",
                barcode: existing.Barcode
            });
            const calcLot = calculatedLots.find(l => Number(l.id) === existing.id);
            const baseline = calcLot ? calcLot.balance : (existing.balance || 0);
            adjustDelta = newBalanceValue - baseline;
        }

        const updated = await prisma.$transaction(async (tx) => {
            const updatedLot = await tx.rCitemlist.update({
                where: { id: parseInt(lotId) },
                data: updateData
            });

            if (newBalanceValue !== null && Math.abs(adjustDelta) > 1e-9) {
                await tx.stockTransaction.create({
                    data: {
                        product_id: existing.id,
                        inventory_lot_id: existing.id,
                        itemcode: existing.itemcode,
                        itemName: existing.itemName || "",
                        lot: updateData.lot !== undefined ? updateData.lot : (existing.lot || ""),
                        dateExp: updateData.dateExp !== undefined ? updateData.dateExp : existing.dateExp,
                        quantity_change: adjustDelta,
                        balance_after: newBalanceValue,
                        transaction_type: "ADJUST",
                        company: existing.company || "",
                        person: person || "",
                        personsale: "",
                        adjustReasonMain: LOT_EDIT_ADJUST_REASON
                    } as any
                });
                console.log(`[LotEdit] 🔧 Auto ADJUST ${adjustDelta > 0 ? "+" : ""}${adjustDelta} for lot #${lotId} (stored ${existing.balance} → ${newBalanceValue}, calculated baseline ${newBalanceValue - adjustDelta})`);
            }

            return updatedLot;
        });

        // Log the change
        const changes = Object.entries(updateData).map(([k, v]) => `${k}=${v}`).join(", ");
        console.log(`[LotEdit] ✅ Updated lot #${lotId}: ${changes} by ${person || 'unknown'}`);

        return NextResponse.json({
            success: true,
            message: "อัปเดต Lot สำเร็จ",
            data: updated
        });
    } catch (error: any) {
        console.error("[LotEdit] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update lot" },
            { status: 500 }
        );
    }
}
