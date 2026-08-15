import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { company, codenames, fromId, toPosition } = await request.json()

    if (!company || !codenames || !fromId || toPosition == null) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    const allItems = await prisma.rCitemlist.findMany({
      where: { company, codenames },
      orderBy: { id: 'asc' }
    })

    console.log('[reorder] query company=', JSON.stringify(company), 'codenames=', JSON.stringify(codenames), 'found=', allItems.length)
    if (allItems.length > 0) {
      console.log('[reorder] first item codenames=', JSON.stringify(allItems[0].codenames), 'company=', JSON.stringify(allItems[0].company))
    } else {
      // fallback: ดู sample ว่า codenames ใน DB เป็นอะไร
      const sample = await prisma.rCitemlist.findFirst({ where: { company }, select: { codenames: true, company: true } })
      console.log('[reorder] sample item from company:', JSON.stringify(sample))
    }

    if (allItems.length === 0) {
      return new Response(JSON.stringify({ error: 'No items found' }), { status: 404 })
    }

    const fromIdx = allItems.findIndex((item: any) => item.id === Number(fromId))
    const toIdx = Number(toPosition) - 1

    if (fromIdx === -1 || fromIdx === toIdx) {
      return Response.json({ success: true })
    }

    if (toIdx < 0 || toIdx >= allItems.length) {
      return new Response(JSON.stringify({ error: 'Invalid target position' }), { status: 400 })
    }

    // Reorder: move item at fromIdx to toIdx, shifting others
    const newOrder = [...allItems]
    const [movedItem] = newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, movedItem)

    // Update only rows where data needs to change (row id stays, data swaps)
    const updates: any[] = []
    for (let i = 0; i < allItems.length; i++) {
      if (allItems[i].id !== newOrder[i].id) {
        const targetId = allItems[i].id
        const src = newOrder[i]
        updates.push(
          prisma.rCitemlist.update({
            where: { id: targetId },
            data: {
              itemcode: src.itemcode,
              itemName: src.itemName,
              unit: src.unit,
              newCost: src.newCost,
              // ย้ายทั้งแถวต้องพาทุนสุทธิไปด้วย ไม่งั้นแถวปลายทางจะถือทุนของสินค้าตัวเดิมค้างไว้
              netCost: src.netCost,
              qty: src.qty,
              totalcost: src.totalcost,
              lot: src.lot,
              dateExp: src.dateExp,
              freebaht: src.freebaht,
              discountbaht: src.discountbaht,
              Barcode: src.Barcode,
              type: src.type,
              subtype: src.subtype,
              person: src.person,
              statuss: src.statuss,
              dateRC: src.dateRC,
              sale: src.sale,
              balance: src.balance,
              createDate: src.createDate,
              maker: src.maker,
              qty_unit: src.qty_unit,
            }
          })
        )
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates)
    }

    return Response.json({ success: true })

  } catch (error) {
    console.error('Reorder error:', error)
    return new Response(JSON.stringify({ error: 'Reorder failed' }), { status: 500 })
  }
}
