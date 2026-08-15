import { NextRequest } from 'next/server'
import { normalizeRcItemDates } from './date-normalize'
import { calculateLotBalances } from '@/lib/stockBalance'
import { netCostPatch } from '@/lib/lotCost'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}


export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const itemcode = searchParam.get('itemcode')
  const company = searchParam.get('company')
  const sort = searchParam.get('sort') || 'asc'
  const fields = searchParam.get('fields')

  const prisma = await getPrisma();

  // Build where condition - only include itemcode if it's provided
  const whereCondition: any = { company }
  if (itemcode) {
    whereCondition.itemcode = itemcode
  }

  // Optimized mode for expiry checking - คำนวณ balance ต่อ lot จาก transaction/sale
  // เพราะคอลัมน์ balance ดิบใน RCitemlist อาจไม่ sync (ดูสูตรเดียวกับ /api/stock-balance-summary)
  if (fields === 'expiry') {
    // Pre-filter to lots with an expiry date. We can't pre-filter on the raw
    // `balance` column here because it can be stale/unsynced vs. the
    // calculated balance below (lots with rawBalance<=0 may still have stock).
    const expiryWhere: any = { company, dateExp: { not: null } }
    if (itemcode) expiryWhere.itemcode = itemcode

    const lots = await prisma.rCitemlist.findMany({
      where: expiryWhere,
      select: {
        id: true,
        itemcode: true,
        itemName: true,
        lot: true,
        dateExp: true,
        balance: true,
        statuss: true,
        namevender: true,
        qty: true,
        freebaht: true, // receivedQty() นับของแถมด้วย — ไม่ select มา balance จะขาด
      },
      orderBy: { id: sort } as any,
    })

    const itemcodes = Array.from(new Set(lots.map(l => l.itemcode).filter((c): c is string => !!c)))

    // Select เฉพาะคอลัมน์ที่ calculateLotBalances ใช้ — ดึงทั้ง row ของประวัติขาย
    // ทุกสินค้าหนักเกินไป (หลาย MB) และทำให้ dashboard โหลดช้า
    const [transactions, sales] = await Promise.all([
      prisma.stockTransaction.findMany({
        where: { company, itemcode: { in: itemcodes } },
        select: {
          itemcode: true,
          transaction_type: true,
          quantity_change: true,
          inventory_lot_id: true,
          product_id: true,
          lot: true,
        },
      }),
      prisma.sale.findMany({
        where: { company, code_product: { in: itemcodes }, statuss: 'OK' },
        select: {
          code_product: true,
          id_receive1: true, lot_receive1: true, qty_lot1: true,
          id_receive2: true, lot_receive2: true, qty_lot2: true,
          id_receive3: true, lot_receive3: true, qty_lot3: true,
        },
      }),
    ])

    // จัดกลุ่มตาม itemcode ครั้งเดียว — การ .filter() ต่อรหัสสินค้าเป็น O(items × rows)
    const groupByCode = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const map = new Map<string, T[]>()
      for (const row of rows) {
        const k = key(row)
        if (!k) continue
        const arr = map.get(k)
        if (arr) arr.push(row)
        else map.set(k, [row])
      }
      return map
    }
    const lotsByCode = groupByCode(lots, l => l.itemcode)
    const txByCode = groupByCode(transactions, t => t.itemcode)
    const salesByCode = groupByCode(sales, s => s.code_product)

    const result: any[] = []
    for (const code of itemcodes) {
      const lotsForItem = lotsByCode.get(code) || []
      const txForItem = txByCode.get(code) || []
      const salesForItem = salesByCode.get(code) || []
      const calculated = calculateLotBalances(lotsForItem, txForItem, salesForItem)

      for (const calcLot of calculated) {
        if ((calcLot.balance || 0) <= 0) continue
        const original = lotsForItem.find(l => l.id === calcLot.id)
        result.push({
          id: calcLot.id,
          itemcode: code,
          itemName: original?.itemName,
          lot: calcLot.lot,
          dateExp: calcLot.dateExp,
          balance: calcLot.balance,
          statuss: original?.statuss,
          namevender: original?.namevender,
        })
      }
    }

    result.sort((a, b) => (sort === 'desc' ? b.id - a.id : a.id - b.id))
    return Response.json(result)
  }

  // Adjusted items - items that have been processed (balance=0, statuss is a reason)
  if (fields === 'adjusted') {
    whereCondition.balance = 0
    whereCondition.statuss = { in: ['ส่งคืนบริษัท', 'ทำลายยา ที่หมดอายุ', 'แจ้งเปลี่ยนสินค้า'] }
    const get = await prisma.rCitemlist.findMany({
      where: whereCondition,
      select: {
        id: true,
        itemcode: true,
        itemName: true,
        lot: true,
        dateExp: true,
        qty: true,
        unit: true,
        statuss: true,
        namevender: true,
        person: true,
        maker: true,
        dateRC: true,
      },
      orderBy: { dateExp: 'asc' },
    })
    return Response.json(get)
  }

  const get = await prisma.rCitemlist.findMany({
    where: whereCondition,
    orderBy: {
      id: sort,  //เรียงลำดับ
    } as any,
  })
  return Response.json(get)
}




export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const body = await req.json()

    if (Array.isArray(body)) {
      // 1. Extract itemcodes to fetch Barcodes
      const itemCodes = body.map((item: any) => item.itemcode).filter(Boolean);
      const company = body[0]?.company || "";

      // 2. Fetch Datalist to get Barcode, Unit, type, and subtype
      const datalistItems = await prisma.datalist.findMany({
        where: {
          company: company,
          code: { in: itemCodes }
        },
        select: {
          code: true,
          Barcode: true,
          Unit: true,
          type: true,
          subtype: true
        }
      });

      // 3. Create a Map for quick lookup (stores all fetched fields)
      const datalistMap = new Map();
      datalistItems.forEach((item: any) => {
        datalistMap.set(item.code, {
          Barcode: item.Barcode,
          Unit: item.Unit,
          type: item.type,
          subtype: item.subtype
        });
      });

      // 4. Map body items and inject Barcode, Unit, type, subtype from Datalist
      const itemsWithDatalist = body.map(item => {
        const datalistInfo = datalistMap.get(item.itemcode) || {};
        return normalizeRcItemDates({
          company: item.company,
          codenames: item.codenames,
          itemcode: item.itemcode,
          itemName: item.itemName,
          unit: datalistInfo.Unit || item.unit || "",  // Use Unit from Datalist
          newCost: item.newCost,
          // ทุนสุทธิหลังหักส่วนลดของบรรทัดนี้ (สูตรเดียวกับทุกจุดเขียน — src/lib/lotCost.ts)
          ...netCostPatch({
            newCost: item.newCost,
            qty: item.qty,
            totalcost: item.totalcost,
            discountbaht: item.discountbaht,
            freebaht: item.freebaht,
          }),
          qty: item.qty,
          totalcost: item.totalcost,
          lot: item.lot,
          dateExp: item.dateExp,
          freebaht: item.freebaht,
          discountbaht: item.discountbaht,
          sale: item.sale,
          balance: item.balance,
          Barcode: datalistInfo.Barcode || item.Barcode || "",
          type: datalistInfo.type || item.type || "",  // Use type from Datalist
          subtype: datalistInfo.subtype || item.subtype || "",  // Use subtype from Datalist
          person: item.person,
          statuss: item.statuss,
          dateRC: item.dateRC,
          codevender: item.codevender,
          namevender: item.namevender
        });
      });

      const result = await prisma.rCitemlist.createMany({
        data: itemsWithDatalist
      })
      return Response.json(result)
    } else {
      // Single item case - fetch Barcode, Unit, type, subtype as well
      const { company, codenames, itemcode, itemName, unit, newCost, qty, totalcost, lot, dateExp, freebaht, discountbaht, sale, balance, Barcode, type, subtype, person, statuss, dateRC, codevender, namevender } = body

      let finalBarcode = Barcode;
      let finalUnit = unit;
      let finalType = type;
      let finalSubtype = subtype;

      if (itemcode) {
        const datalistItem = await prisma.datalist.findFirst({
          where: { company, code: itemcode },
          select: { Barcode: true, Unit: true, type: true, subtype: true }
        });
        if (datalistItem) {
          finalBarcode = datalistItem.Barcode || finalBarcode;
          finalUnit = datalistItem.Unit || finalUnit;
          finalType = datalistItem.type || finalType;
          finalSubtype = datalistItem.subtype || finalSubtype;
        }
      }

      const newUser = await prisma.rCitemlist.create({
        data: {
          ...normalizeRcItemDates({ company, codenames, itemcode, itemName, unit: finalUnit, newCost, qty, totalcost, lot, dateExp, freebaht, discountbaht, sale, balance, Barcode: finalBarcode, type: finalType, subtype: finalSubtype, person, statuss, dateRC, codevender, namevender }),
          ...netCostPatch({ newCost, qty, totalcost, discountbaht, freebaht })
        },
      })
      return Response.json(newUser)
    }

  } catch (error) {
    console.error("Error in POST /api/receivelist:", error);
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, {
      status: 500,
    })
  }
}