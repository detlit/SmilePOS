import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    buildRcItemLookupWhere,
    buildSaleLookupWhere,
    buildStockTransferItemLookupWhere,
    calculateLotBalances,
    receivedQty,
    resolveItemcodeGroup,
    saleStockQty,
    shouldUseItemcodeFallback,
    standardBalance,
    sumStockTransactions
} from "@/lib/stockBalance";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const itemcode = searchParams.get("itemcode");
        const company = searchParams.get("company");
        const idParam = searchParams.get("id");

        if (!itemcode || !company) {
            return NextResponse.json({ error: "itemcode and company are required" }, { status: 400 });
        }

        // 0. ดึงข้อมูลสินค้าก่อน เพื่อนำ Barcode ไปใช้คำนวณยอดรับทั้งหมด/ยอดขาย
        // กรณีรหัสสินค้าซ้ำกัน (code ซ้ำ) ให้ใช้ id เพื่อระบุสินค้าที่แน่นอน
        const productId = idParam ? parseInt(idParam, 10) : NaN;
        const product = await prisma.datalist.findFirst({
            where: !isNaN(productId)
                ? { company, id: productId }
                : { company, code: itemcode },
            select: {
                id: true, code: true, ProductName: true, fixname: true,
                group: true, Unit: true, Barcode: true, CostActual: true,
                price: true, maker: true
            }
        });
        const productBarcode = (product?.Barcode || "").trim();

        // 0b. หา itemcodes ทั้งหมดที่ใช้ Barcode เดียวกัน
        // (StockTransaction ไม่มีฟิลด์ barcode จึงต้องใช้กลุ่ม itemcodes)
        const itemcodeGroup = await resolveItemcodeGroup(company, itemcode, productBarcode);
        const useItemcodeFallback = await shouldUseItemcodeFallback(company, itemcode, productBarcode);

        // 1. ดึง RCitemlist (lots) — อิง Barcode ถ้ามี และ fallback itemcode เมื่อรหัสไม่ซ้ำ
        const lots = await prisma.rCitemlist.findMany({
            where: buildRcItemLookupWhere(company, itemcode, productBarcode, useItemcodeFallback),
            orderBy: { createDate: "desc" }
        });

        // 2. ดึง StockTransaction — ใช้ itemcodeGroup (ไม่มีฟิลด์ barcode)
        const transactions = await prisma.stockTransaction.findMany({
            where: { company, itemcode: { in: itemcodeGroup } },
            orderBy: { createDate: "desc" }
        });

        // 3. ดึง Sale — อิง barcode ถ้ามี และ fallback code_product เมื่อรหัสไม่ซ้ำ
        const sales = await prisma.sale.findMany({
            where: buildSaleLookupWhere(company, itemcode, productBarcode, useItemcodeFallback),
            orderBy: { createDate: "desc" }
        });

        // 4. ดึง StockTransferItem — อิง barcode ถ้ามี (มีฟิลด์ barcode อยู่แล้ว)
        const transferItems = await prisma.stockTransferItem.findMany({
            where: buildStockTransferItemLookupWhere(itemcode, productBarcode, useItemcodeFallback),
            include: {
                transfer: {
                    select: {
                        id: true,
                        transferNo: true,
                        fromUserId: true,
                        toUserId: true,
                        status: true,
                        createdAt: true,
                        completedAt: true,
                        person: true,
                        remark: true
                    }
                }
            },
            orderBy: { id: "desc" }
        });

        // 5. คำนวณสรุป
        // กรอง RCitemlist ที่มาจากการโอน (statuss: "โอนสินค้า") ออก เพราะนับใน TRANSFER_IN แล้ว
        const nonTransferLots = lots.filter(lot => lot.statuss !== "โอนสินค้า");
        const rawTotalBalance = lots.reduce((sum, lot) => sum + (lot.balance || 0), 0);

        // ยอดรับทั้งหมด: รวมจาก lot ที่ตรง barcode (กรองรายการโอนออกแล้ว) — นับของแถม (freebaht) ด้วย
        const totalReceived = nonTransferLots.reduce((sum, lot) => sum + receivedQty(lot), 0);

        // ยอดขาย: ถ้า subqty=0/null/"" ใช้ qty แทน, ถ้า subqty != 0 ใช้ subqty
        const totalSale = sales.reduce((sum: number, s: any) => sum + saleStockQty(s), 0);

        // ยอดจาก StockTransaction (โอน, ปรับยอด, รับเข้า) — แยกประเภทด้วยกติกากลางใน stockBalance.ts
        const { totalTransferOut, totalTransferIn, totalAdjust, totalOtherIn } =
            sumStockTransactions(transactions);

        const saleStockTx = transactions.filter(tx => (tx.transaction_type || "").toUpperCase() === "SALE");

        const lotsWithCalculatedBalance = calculateLotBalances(lots, transactions, sales);

        const totalBalance = lotsWithCalculatedBalance.reduce((sum, lot) => sum + (lot.balance || 0), 0);

        // 6. (ข้อมูลสินค้าถูกดึงไว้ในขั้นตอนที่ 0 แล้ว)

        // 7. รวม RCitemlist (รับเข้า) เป็น IN transactions — ไม่รวมรายการโอน (มี TRANSFER_IN แสดงแทนอยู่แล้ว)
        const inTransactions = nonTransferLots.map(lot => ({
            id: lot.id,
            createDate: lot.createDate,
            transaction_type: "IN",
            quantity_change: receivedQty(lot), // นับ qty + ของแถม (freebaht)
            balance_after: null,
            lot: lot.lot || "",
            dateExp: lot.dateExp,
            person: lot.person || "",
            personsale: "",
            receiverCompany: null,
            receiverCompanyName: lot.namevender || null,
            source: "rcitemlist"
        }));

        // 8. รวม transactions จาก Sale table เข้ากับ StockTransaction เพื่อแสดงประวัติ
        // ใช้ logic เดียวกับ totalSale: ถ้า subqty=0/null/"" ใช้ qty, ถ้า subqty != 0 ใช้ subqty
        // จับคู่ Lot จาก StockTransaction SALE โดยอิงวันที่ขาย (ถึงหน่วยนาที)
        const saleTransactions = sales.map(s => {
            const saleQty = saleStockQty(s as any);

            // จับคู่ StockTransaction SALE ตามวันที่ (ตรงถึงนาที)
            let lotDisplay = "";
            if (s.createDate) {
                const saleTime = new Date(s.createDate);
                const saleMinute = `${saleTime.getFullYear()}-${saleTime.getMonth()}-${saleTime.getDate()}-${saleTime.getHours()}-${saleTime.getMinutes()}`;

                const matchedTx = saleStockTx.filter(tx => {
                    if (!tx.createDate) return false;
                    const txTime = new Date(tx.createDate);
                    const txMinute = `${txTime.getFullYear()}-${txTime.getMonth()}-${txTime.getDate()}-${txTime.getHours()}-${txTime.getMinutes()}`;
                    return saleMinute === txMinute;
                });

                if (matchedTx.length > 0) {
                    lotDisplay = matchedTx
                        .map(tx => `${tx.lot || '-'}(${Math.abs(tx.quantity_change || 0)})`)
                        .join(", ");
                }
            }

            return {
                id: s.id,
                createDate: s.createDate,
                transaction_type: "SALE",
                quantity_change: -saleQty,
                balance_after: null,
                lot: lotDisplay || (s as any).lot_receive1 || "",
                dateExp: null,
                person: s.person || "",
                personsale: (s as any).name_customer || "",
                receiverCompany: null,
                receiverCompanyName: null,
                source: "sale_table"
            };
        });

        // StockTransaction records (ไม่รวม SALE เพราะใช้จาก Sale table แทน)
        const otherTransactions = transactions
            .filter(tx => (tx.transaction_type || "").toUpperCase() !== "SALE")
            .map(tx => ({
                id: tx.id,
                createDate: tx.createDate,
                transaction_type: tx.transaction_type,
                quantity_change: tx.quantity_change,
                balance_after: tx.balance_after,
                lot: tx.lot,
                dateExp: tx.dateExp,
                person: tx.person,
                personsale: tx.personsale,
                receiverCompany: tx.receiverCompany,
                receiverCompanyName: tx.receiverCompanyName,
                source: "stock_transaction"
            }));

        // รวมทั้งหมดเรียงตามวันที่
        const allTransactions = [...inTransactions, ...saleTransactions, ...otherTransactions]
            .sort((a, b) => {
                const da = a.createDate ? new Date(a.createDate).getTime() : 0;
                const db = b.createDate ? new Date(b.createDate).getTime() : 0;
                return db - da;
            });

        const summary = {
            product: product || { code: itemcode, ProductName: "-" },
            // นโยบาย lot ของสินค้า — สินค้าที่หาไม่เจอใน Datalist ถือว่าต้องมี lot ไว้ก่อน
            requireLot: product ? (product as any).requireLot !== false : true,
            totalReceived,
            totalSale,
            totalTransferOut,
            totalTransferIn,
            totalAdjust,
            totalOtherIn,
            totalBalance,
            rawTotalBalance,
            calculatedBalance: standardBalance({ totalReceived, totalSale, totalTransferOut, totalTransferIn, totalAdjust }),
            lots: lotsWithCalculatedBalance,
            transactions: allTransactions,
            transferItems: transferItems.map(ti => ({
                id: ti.id,
                transferNo: ti.transfer?.transferNo,
                transferStatus: ti.transfer?.status,
                transferDate: ti.transfer?.createdAt,
                completedAt: ti.transfer?.completedAt,
                fromUserId: ti.transfer?.fromUserId,
                toUserId: ti.transfer?.toUserId,
                person: ti.transfer?.person,
                remark: ti.transfer?.remark,
                qty: ti.qty,
                confirmedQty: ti.confirmedQty,
                itemStatus: ti.itemStatus,
                lot: ti.lot,
                dateExp: ti.dateExp,
                cost: ti.cost
            }))
        };

        return NextResponse.json(summary);
    } catch (error: any) {
        console.error("Error fetching stock balance summary:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
