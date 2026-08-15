import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyStockChange } from '@/lib/sse';
import { receivedQty } from '@/lib/stockBalance';

type ParsedBody = { ok: true; body: any } | { ok: false; reason: string };

// อ่าน body แบบกันพัง: ถ้า client ตัดการเชื่อมต่อกลางคัน (รีเฟรชหน้า / ปิดแอป / dev server
// recompile แล้ว Fast Refresh reload) body จะมาไม่ครบ ทำให้ req.json() โยน
// "Unexpected end of JSON input" ออกมาเป็น 500 ทั้งที่ไม่ใช่บั๊กของการตัดสต็อก
async function readJsonBody(req: Request): Promise<ParsedBody> {
    let raw = '';

    try {
        raw = await req.text();
    } catch {
        return { ok: false, reason: 'Request aborted before the body was fully received' };
    }

    if (!raw.trim()) {
        return { ok: false, reason: 'Request body is empty' };
    }

    try {
        return { ok: true, body: JSON.parse(raw) };
    } catch {
        return { ok: false, reason: 'Request body is not valid JSON' };
    }
}

export async function POST(req: Request) {
    try {
        const parsed = await readJsonBody(req);
        if (!parsed.ok) {
            console.warn(`⚠️ Cut stock skipped — ${parsed.reason}. สต็อกยังไม่ถูกตัด กรุณาตรวจสอบบิลล่าสุด`);
            return new Response(JSON.stringify({
                success: false,
                error: parsed.reason
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const {
            itemcode,
            quantity,
            company,
            person,
            transaction_type = 'SALE'
        } = parsed.body ?? {};

        if (!itemcode || quantity === undefined) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing itemcode or quantity'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const deductQty = parseFloat(quantity);
        if (isNaN(deductQty) || deductQty <= 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid quantity'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Query lots sorted by Expiry Date (FEFO) with Row Locking (FOR UPDATE)
            // Using raw query because Prisma findMany doesn't natively support FOR UPDATE.
            // FEFO: หมดอายุใกล้สุดก่อน — lot ที่ไม่มีวันหมดอายุ (สินค้าที่ตั้งค่า "ไม่มี Lot")
            // ตกไปท้ายและเรียงต่อด้วย id เพื่อให้ตัดแบบ FIFO อย่างคงเส้นคงวา
            // (ลำดับเดียวกับ sortLotsForConsumption ใน src/lib/lotPolicy.ts)
                        const lots: any[] = await tx.$queryRaw`
                SELECT * FROM "RCitemlist"
        WHERE "itemcode" = ${itemcode}
                    AND COALESCE("qty", 0) + COALESCE("freebaht", 0) > 0
          AND "company" = ${company}
        ORDER BY "dateExp" ASC NULLS LAST, "id" ASC
        FOR UPDATE
      `;

            // ถ้าไม่มี lot เลย → สร้าง StockTransaction แบบไม่มี lot (lot-less)
            if (!lots || lots.length === 0) {
                // ดึงชื่อสินค้าจาก Datalist
                const product = await tx.datalist.findFirst({ where: { code: itemcode } });
                const stockTx = await tx.stockTransaction.create({
                    data: {
                        product_id: null,
                        inventory_lot_id: null,
                        itemcode: itemcode,
                        itemName: product?.ProductName || itemcode,
                        lot: null,
                        dateExp: null,
                        quantity_change: -deductQty,
                        balance_after: null,
                        transaction_type: transaction_type,
                        company: company,
                        person: person
                    } as any
                });
                console.log(`📦 Cut stock (no lot) for ${itemcode}: ${deductQty} units`);
                return {
                    transactions: [stockTx],
                    itemcode,
                    warning: `No lot available for item ${itemcode}. Created lot-less transaction.`,
                    deductedQty: deductQty,
                    lotDetails: [{
                        lotId: null,
                        lotNumber: null,
                        expiryDate: null,
                        previousBalance: null,
                        deducted: deductQty,
                        newBalance: null
                    }]
                };
            }

            let remainingToDeduct = deductQty;
            const transactions = [];
            const lotDetails: any[] = []; // เก็บรายละเอียดการตัดแต่ละ lot
            const lotIds = lots.map(lot => Number(lot.id));
            const lotIdSet = new Set(lotIds);
            const normalizeLot = (value: unknown) => String(value || '').trim().toLowerCase();
            const lotCodeToIds = new Map<string, number[]>();

            for (const lot of lots) {
                const lotKey = normalizeLot(lot.lot);
                if (!lotKey) continue;
                lotCodeToIds.set(lotKey, [...(lotCodeToIds.get(lotKey) || []), Number(lot.id)]);
            }

            const lotCodes = Array.from(new Set(
                lots.map(lot => String(lot.lot || '').trim()).filter(Boolean)
            ));
            const lotTransactionDelta = new Map<number, number>();

            const addLotDelta = (lotId: number, delta: number) => {
                if (!lotIdSet.has(lotId) || !Number.isFinite(delta)) return false;
                lotTransactionDelta.set(lotId, (lotTransactionDelta.get(lotId) || 0) + delta);
                return true;
            };

            const addLotDeltaByCode = (lotCode: unknown, delta: number) => {
                const matchingLotIds = lotCodeToIds.get(normalizeLot(lotCode)) || [];
                if (matchingLotIds.length !== 1) return false;
                return addLotDelta(matchingLotIds[0], delta);
            };

            const addTransactionLotDelta = (stockTx: any, delta: number) => {
                if (addLotDelta(Number(stockTx.inventory_lot_id || 0), delta)) return true;
                if (addLotDelta(Number(stockTx.product_id || 0), delta)) return true;
                return addLotDeltaByCode(stockTx.lot, delta);
            };

            const lotTransactions = await tx.stockTransaction.findMany({
                where: {
                    company,
                    itemcode,
                    OR: [
                        { inventory_lot_id: { in: lotIds } },
                        { product_id: { in: lotIds } },
                        ...(lotCodes.length > 0 ? [{ lot: { in: lotCodes } }] : [])
                    ]
                }
            });

            let assignedSaleStockTxCount = 0;
            for (const stockTx of lotTransactions as any[]) {
                const type = String(stockTx.transaction_type || '').toUpperCase();
                if (["SALE", "TRANSFER_OUT", "TRANSFER_IN", "ADJUST", "RETURN", "TRANSFER_RETURN"].includes(type)) {
                    const assigned = addTransactionLotDelta(stockTx, Number(stockTx.quantity_change || 0));
                    if (type === "SALE" && assigned) assignedSaleStockTxCount += 1;
                }
            }

            if (assignedSaleStockTxCount === 0) {
                const sales = await tx.sale.findMany({
                    where: { company, code_product: itemcode, statuss: 'OK' }
                });

                for (const sale of sales as any[]) {
                    for (const idx of [1, 2, 3]) {
                        const lotQty = Number(sale[`qty_lot${idx}`] || 0);
                        if (lotQty <= 0) continue;
                        if (!addLotDelta(Number(sale[`id_receive${idx}`] || 0), -lotQty)) {
                            addLotDeltaByCode(sale[`lot_receive${idx}`], -lotQty);
                        }
                    }
                }
            }

            const getAvailableBalance = (lot: any) => {
                // จำนวนรับเข้าจริงของ lot = qty + freebaht (ของแถมขายออกได้)
                const received = receivedQty(lot);
                const rawBalance = lot.balance === null || lot.balance === undefined ? received : Number(lot.balance || 0);
                const calculatedBalance = received + (lotTransactionDelta.get(Number(lot.id)) || 0);
                return Math.max(0, Math.min(rawBalance, calculatedBalance));
            };

            for (const lot of lots) {
                if (remainingToDeduct <= 0) break;

                const currentBalance = getAvailableBalance(lot);
                if (currentBalance <= 0) continue;
                const deductFromThisLot = Math.min(currentBalance, remainingToDeduct);
                const newBalance = currentBalance - deductFromThisLot;

                // 2. Update lot balance - ตัดข้าม lot
                // sync ตัวนับขายของ lot ตาม convention เดียวกับ /api/lot-edit และตัวซ่อม lot
                // (sale = จำนวนรับ − คงเหลือ) ไม่งั้นตัวนับจะค้างต่ำกว่าจริงทุกครั้งที่ขาย
                // แล้วช่อง "คงเหลือของ lot" ในหน้าขาย (qty − sale) จะเกินความจริงไปเรื่อย ๆ
                await tx.rCitemlist.update({
                    where: { id: lot.id },
                    data: {
                        balance: newBalance,
                        sale: Math.max(0, receivedQty(lot) - newBalance)
                    }
                });

                // 3. Record transaction log พร้อมข้อมูล lot
                const stockTx = await tx.stockTransaction.create({
                    data: {
                        product_id: lot.id,
                        inventory_lot_id: lot.id,
                        itemcode: lot.itemcode,
                        itemName: lot.itemName,
                        lot: lot.lot,
                        dateExp: lot.dateExp,
                        quantity_change: -deductFromThisLot,
                        balance_after: newBalance,
                        transaction_type: transaction_type,
                        company: company,
                        person: person
                    } as any
                });

                // เก็บรายละเอียดการตัดจาก lot นี้
                lotDetails.push({
                    lotId: lot.id,
                    lotNumber: lot.lotNumber || lot.lot || 'N/A',
                    expiryDate: lot.dateExp,
                    previousBalance: currentBalance,
                    deducted: deductFromThisLot,
                    newBalance: newBalance
                });

                transactions.push(stockTx);
                remainingToDeduct -= deductFromThisLot;

                console.log(`📦 Cut stock from Lot #${lot.id}: ${deductFromThisLot} units (${currentBalance} → ${newBalance})`);
            }

            // แทนที่จะ throw error เมื่อสต็อกไม่พอ ให้ตัดเท่าที่มีและสร้าง lot-less transaction สำหรับส่วนที่เหลือ
            if (remainingToDeduct > 0) {
                const product = await tx.datalist.findFirst({ where: { code: itemcode } });
                const lotlessTx = await tx.stockTransaction.create({
                    data: {
                        product_id: null,
                        inventory_lot_id: null,
                        itemcode: itemcode,
                        itemName: product?.ProductName || lots[0]?.itemName || itemcode,
                        lot: null,
                        dateExp: null,
                        quantity_change: -remainingToDeduct,
                        balance_after: null,
                        transaction_type: transaction_type,
                        company: company,
                        person: person
                    } as any
                });
                transactions.push(lotlessTx);
                lotDetails.push({
                    lotId: null,
                    lotNumber: null,
                    expiryDate: null,
                    previousBalance: null,
                    deducted: remainingToDeduct,
                    newBalance: null
                });
                console.log(`📦 Cut stock (no lot - partial) for ${itemcode}: ${remainingToDeduct} units`);
            }

            const warning = remainingToDeduct > 0
                ? `Partial lot deduction: ${remainingToDeduct.toFixed(2)} units for item ${itemcode} had no lot. Created lot-less transaction.`
                : null;

            console.log(`✅ Total cut for ${itemcode}: ${deductQty - remainingToDeduct} units from ${lotDetails.length} lot(s)`);

            return { transactions, itemcode, warning, deductedQty: deductQty - remainingToDeduct, lotDetails };
        });

        // 4. Real-time update (SSE & Socket.io placeholder)
        try {
            notifyStockChange(itemcode);

            // If Socket.io is initialized on server (e.g. via global.io), you can emit here:
            // if (global.io) global.io.emit('stock_update', { itemcode, company });
        } catch (realtimeError) {
            console.warn('Real-time notification failed, but stock was deducted:', realtimeError);
        }

        return new Response(JSON.stringify({
            success: true,
            message: result.warning ? 'Stock partially deducted' : 'Stock deducted successfully',
            warning: result.warning,
            data: result
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Stock deduction error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Internal Server Error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function PUT(req: Request) {
    try {
        const parsed = await readJsonBody(req);
        if (!parsed.ok) {
            console.warn(`⚠️ Stock return skipped — ${parsed.reason}`);
            return new Response(JSON.stringify({
                success: false,
                error: parsed.reason
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { sales_lot, person } = parsed.body ?? {};

        if (!sales_lot || !Array.isArray(sales_lot)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing or invalid sales_lot'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            const transactions = [];

            for (const item of sales_lot) {
                // We handle up to 3 lots as defined in the frontend structure
                for (let i = 1; i <= 3; i++) {
                    const lotId = item[`id_receive${i}`];
                    if (!lotId) continue;

                    const newSale = item[`sale_lot${i}`];
                    const newBalance = item[`balance_lot${i}`];
                    const qtyReturned = item[`qty_lot${i}`];

                    if (qtyReturned === undefined || qtyReturned <= 0) continue;

                    // 1. Get current lot info for logging
                    const lotInfo = await tx.rCitemlist.findUnique({
                        where: { id: Number(lotId) }
                    });

                    if (!lotInfo) continue;

                    // 2. Update lot balance
                    await tx.rCitemlist.update({
                        where: { id: Number(lotId) },
                        data: {
                            sale: newSale,
                            balance: newBalance
                        }
                    });

                    // 3. Record transaction log
                    const stockTx = await tx.stockTransaction.create({
                        data: {
                            product_id: lotInfo.id,
                            inventory_lot_id: lotInfo.id,
                            itemcode: lotInfo.itemcode,
                            itemName: lotInfo.itemName,
                            lot: lotInfo.lot,
                            dateExp: lotInfo.dateExp,
                            quantity_change: qtyReturned, // Positive for return
                            balance_after: newBalance,
                            transaction_type: 'RETURN',
                            company: lotInfo.company,
                            person: person || 'System'
                        } as any
                    });

                    transactions.push(stockTx);

                    // Notify stock change
                    try {
                        notifyStockChange(lotInfo.itemcode || '');
                    } catch (e) {
                        console.warn('Notification failed:', e);
                    }
                }
            }

            return transactions;
        });

        return new Response(JSON.stringify({
            success: true,
            message: 'Stock returned successfully',
            data: result
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Stock return error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Internal Server Error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
