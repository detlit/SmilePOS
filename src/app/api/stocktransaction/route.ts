import { NextRequest } from 'next/server'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

async function getNextStockTransactionId(prisma: any): Promise<number> {
    const result = await prisma.$queryRaw`
        SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM "StockTransaction"
    `;
    return (result as any)?.[0]?.next_id || 1;
}

export async function POST(request: NextRequest) {
    const prisma = await getPrisma();

    try {
        const body = await request.json()

        const company = String(body?.company || '')
        const itemcode = String(body?.itemcode || '')
        const itemName = String(body?.itemName || '')
        const lot = String(body?.lot || '')
        const person = String(body?.person || '')

        // สินค้าที่ตั้งค่า "ไม่มี Lot" จะมี lot เป็นค่าว่างเสมอ — จึงยอมรับได้ถ้าระบุ
        // inventory_lot_id (แถวรับเข้าจริง) มาแทน ซึ่งเป็นตัวผูกบัญชีสต็อกอยู่แล้ว
        const inventoryLotId = body?.inventory_lot_id ? Number(body.inventory_lot_id) : null

        if (!company || !itemcode || (!lot && !inventoryLotId)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing required fields: company, itemcode และ lot (หรือ inventory_lot_id)'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const createDate = body?.createDate ? new Date(body.createDate) : new Date()
        const dateExp = body?.dateExp ? new Date(body.dateExp) : null

        const nextId = await getNextStockTransactionId(prisma)

        const createdTx = await prisma.stockTransaction.create({
            data: {
                id: nextId,
                inventory_lot_id: inventoryLotId,
                itemcode,
                itemName,
                lot,
                dateExp,
                quantity_change: Number(body?.quantity_change || 0),
                balance_after: Number(body?.balance_after || 0),
                transaction_type: 'SALE',
                createDate,
                company,
                person,
                personsale: String(body?.caregiverName || '')
            }
        })

        if (body?.caregiverName !== undefined) {
            const caregiverName = String(body.caregiverName || '').trim()
            if (caregiverName) {
                const minuteRange = getMinuteRange(createDate)
                if (minuteRange) {
                    await prisma.sale.updateMany({
                        where: {
                            company,
                            code_product: itemcode,
                            createDate: {
                                gte: minuteRange.start,
                                lt: minuteRange.end
                            }
                        },
                        data: {
                            name_customer: caregiverName
                        }
                    })
                }
            }
        }

        return Response.json({
            success: true,
            data: createdTx
        })
    } catch (error: any) {
        console.error('Error creating stock transaction:', error)
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Internal Server Error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}

export async function PUT(request: NextRequest) {
    const prisma = await getPrisma();

    try {
        const body = await request.json()
        const id = Number(body?.id || 0)

        if (!id) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid id'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const updateData: any = {}

        if (body.createDate) {
            const parsedDate = new Date(body.createDate)
            if (!Number.isNaN(parsedDate.getTime())) {
                updateData.createDate = parsedDate
            }
        }

        if (body.quantity_change !== undefined) {
            updateData.quantity_change = Number(body.quantity_change)
        }

        if (body.balance_after !== undefined) {
            updateData.balance_after = Number(body.balance_after)
        }

        if (body.person !== undefined) {
            updateData.person = String(body.person || '')
        }

        if (body.personsale !== undefined) {
            updateData.personsale = String(body.personsale || '')
        }

        const updatedTx = await prisma.stockTransaction.update({
            where: { id },
            data: updateData
        })

        if (body.caregiverName !== undefined) {
            const caregiverName = String(body.caregiverName || '').trim()

            if (updatedTx.itemcode && updatedTx.createDate) {
                const minuteRange = getMinuteRange(updatedTx.createDate)

                if (minuteRange) {
                    const saleWhere: any = {
                        code_product: updatedTx.itemcode,
                        createDate: {
                            gte: minuteRange.start,
                            lt: minuteRange.end
                        }
                    }

                    if (updatedTx.company) {
                        saleWhere.company = updatedTx.company
                    }

                    await prisma.sale.updateMany({
                        where: saleWhere,
                        data: {
                            name_customer: caregiverName
                        }
                    })
                }
            }
        }

        return Response.json({
            success: true,
            data: updatedTx
        })

    } catch (error: any) {
        console.error('Error updating stock transaction:', error)
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Internal Server Error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}

export async function DELETE(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const id = Number(searchParam.get('id') || 0)
    const prisma = await getPrisma();

    if (!id) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Invalid id'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    try {
        const deleted = await prisma.stockTransaction.delete({
            where: { id }
        })

        return Response.json({
            success: true,
            data: deleted
        })
    } catch (error: any) {
        console.error('Error deleting stock transaction:', error)
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Internal Server Error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}

function getMinuteRange(dateValue: Date | string) {
    const baseDate = new Date(dateValue)
    if (Number.isNaN(baseDate.getTime())) return null

    const start = new Date(baseDate)
    start.setSeconds(0, 0)
    const end = new Date(start)
    end.setMinutes(end.getMinutes() + 1)

    return { start, end }
}

export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const company = searchParam.get('company') || ''
    const itemcode = searchParam.get('itemcode') || ''
    const startDate = searchParam.get('startDate') || ''
    const endDate = searchParam.get('endDate') || ''
    const limit = Number(searchParam.get('limit')) || 100

    const prisma = await getPrisma();

    try {
        // Build where condition
        const whereCondition: any = {}

        if (company) {
            whereCondition.company = company
        }

        if (itemcode) {
            whereCondition.itemcode = itemcode
        }

        // Date filter
        if (startDate || endDate) {
            whereCondition.createDate = {}
            if (startDate) {
                whereCondition.createDate.gte = new Date(startDate)
            }
            if (endDate) {
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                whereCondition.createDate.lte = end
            }
        }

        // Get stock transactions
        const transactions = await prisma.stockTransaction.findMany({
            where: whereCondition,
            orderBy: {
                createDate: 'desc'
            },
            take: limit
        })

        // Prepare sale lookup (match by code_product + createDate minute)
        const txDates = transactions
            .map((t: any) => t.createDate)
            .filter(Boolean)
            .map((d: Date) => new Date(d))

        const txItemCodes = [...new Set(transactions
            .map((t: any) => t.itemcode)
            .filter(Boolean))]

        const minTxDate = txDates.length > 0
            ? new Date(Math.min(...txDates.map(d => d.getTime())))
            : null
        const maxTxDate = txDates.length > 0
            ? new Date(Math.max(...txDates.map(d => d.getTime())))
            : null

        const saleWhere: any = {}

        if (company) {
            saleWhere.company = company
        }

        if (txItemCodes.length > 0) {
            saleWhere.code_product = { in: txItemCodes as string[] }
        }

        if (minTxDate && maxTxDate) {
            const start = new Date(minTxDate)
            start.setMinutes(start.getMinutes() - 1)
            const end = new Date(maxTxDate)
            end.setMinutes(end.getMinutes() + 1)

            saleWhere.createDate = {
                gte: start,
                lte: end
            }
        }

        const sales = txItemCodes.length > 0 ? await prisma.sale.findMany({
            where: saleWhere,
            select: ({
                code_product: true,
                createDate: true,
                name_customer: true,
                pharmacy: true
            } as any),
            orderBy: {
                createDate: 'desc'
            }
        }) : []

        const saleMinuteMap = new Map<string, string>()
        const salePharmacyMinuteMap = new Map<string, string>()
        for (const s of sales) {
            if (!s.code_product || !s.createDate) continue
            const minuteKey = `${s.code_product}|${new Date(s.createDate).toISOString().slice(0, 16)}`

            if (s.name_customer && !saleMinuteMap.has(minuteKey)) {
                saleMinuteMap.set(minuteKey, s.name_customer)
            }

            if (s.pharmacy && !salePharmacyMinuteMap.has(minuteKey)) {
                salePharmacyMinuteMap.set(minuteKey, s.pharmacy)
            }
        }

        // Get lot details from RCitemlist for ALL transactions that have a lot link
        // We need this to get metadata like 'Unit' which is not stored in StockTransaction
        const lotIds = [...new Set(transactions
            .map(t => t.inventory_lot_id)
            .filter(Boolean))]

        const lots = lotIds.length > 0 ? await prisma.rCitemlist.findMany({
            where: {
                id: { in: lotIds as number[] }
            }
        }) : []

        // Create a map of lot details
        const lotMap = new Map(lots.map(lot => [lot.id, lot]))

        // Combine transaction with lot details (prefer transaction data, enrich with RCitemlist metadata)
        const enrichedTransactions = transactions.map(tx => {
            const lot = tx.inventory_lot_id ? lotMap.get(tx.inventory_lot_id) : null
            const txMinuteKey = tx.itemcode && tx.createDate
                ? `${tx.itemcode}|${new Date(tx.createDate).toISOString().slice(0, 16)}`
                : null
            const saleCaregiverName = txMinuteKey ? (saleMinuteMap.get(txMinuteKey) || null) : null
            const caregiverName = saleCaregiverName || (tx.personsale ? String(tx.personsale).trim() : null) || null

            const salePharmacy = txMinuteKey ? (salePharmacyMinuteMap.get(txMinuteKey) || null) : null
            const pharmacy = salePharmacy || null

            return {
                ...tx,
                pharmacy,
                caregiverName,
                lotDetails: {
                    id: tx.inventory_lot_id,
                    itemcode: tx.itemcode || lot?.itemcode || null,
                    itemName: tx.itemName || lot?.itemName || null,
                    lot: tx.lot || lot?.lot || null,
                    dateExp: tx.dateExp || lot?.dateExp || null,
                    balance: tx.balance_after ?? lot?.balance ?? null,
                    unit: lot?.unit || null
                }
            }
        })

        const filteredTransactions = enrichedTransactions

        return Response.json({
            success: true,
            total: filteredTransactions.length,
            data: filteredTransactions
        })

    } catch (error: any) {
        console.error('Error fetching stock transactions:', error)
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Internal Server Error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
