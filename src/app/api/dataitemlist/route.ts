import { NextRequest } from 'next/server'
import { normalizeReceivePacking } from '@/lib/receiveUnit'
import { netCostPatch } from '@/lib/lotCost'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}



export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const itemcode = searchParam.get('itemcode') || ''
  const codenames = searchParam.get('codenames') || ''
  const company = searchParam.get('company')
  const sort = searchParam.get('sort') || 'asc'
  const docType = searchParam.get('docType') || '' // e.g., "ข.ย.9", "ข.ย.10", etc.
  const fields = searchParam.get('fields')
  const prisma = await getPrisma();

  if (fields === 'latest-cost') {
    if (!company || !itemcode) {
      return Response.json(null)
    }

    const latestCost = await prisma.rCitemlist.findFirst({
      where: {
        company,
        itemcode,
        newCost: { not: null },
      },
      select: {
        id: true,
        itemcode: true,
        newCost: true,
        dateRC: true,
      },
      orderBy: { id: 'desc' },
    })

    return Response.json(latestCost)
  }

  // Returns both the latest receive cost and the simple average of every
  // receive-lot newCost for the product (used by the latest/average cost toggle).
  if (fields === 'cost-summary') {
    if (!company || !itemcode) {
      return Response.json({ latestCost: null, averageCost: null, dateRC: null })
    }

    const [latest, agg] = await Promise.all([
      prisma.rCitemlist.findFirst({
        where: { company, itemcode, newCost: { not: null } },
        select: { newCost: true, dateRC: true },
        orderBy: { id: 'desc' },
      }),
      prisma.rCitemlist.aggregate({
        where: { company, itemcode, newCost: { not: null } },
        _avg: { newCost: true },
      }),
    ])

    return Response.json({
      latestCost: latest?.newCost ?? null,
      averageCost: agg._avg.newCost ?? null,
      dateRC: latest?.dateRC ?? null,
    })
  }

  // Build where condition
  const whereCondition: any = {
    company,
    itemcode: {
      startsWith: itemcode,
      mode: 'insensitive'
    },
    codenames: {
      startsWith: codenames,
      mode: 'insensitive'
    },
  }

  // Add type/subtype filter if docType is provided.
  // IMPORTANT: classify by the product master (Datalist)'s CURRENT type/subtype
  // instead of the snapshot stored on the receive line (RCitemlist). This way,
  // re-classifying a product later (e.g. setting ข.ย.11 after the goods were
  // already received) is reflected retroactively in the purchase report.
  if (docType) {
    // Create alternate format (e.g., "ข.ย.9" -> "ขย.9" - remove first dot only)
    const docTypeAlt = docType.replace('.', '')
    const matchingProducts = await prisma.datalist.findMany({
      where: {
        company,
        OR: [
          { type: { contains: docType, mode: 'insensitive' } },
          { type: { contains: docTypeAlt, mode: 'insensitive' } },
          { subtype: { contains: docType, mode: 'insensitive' } },
          { subtype: { contains: docTypeAlt, mode: 'insensitive' } }
        ]
      },
      select: { code: true }
    })
    const codes = Array.from(
      new Set(
        matchingProducts
          .map((p) => p.code)
          .filter((c): c is string => Boolean(c))
      )
    )
    // No product is currently classified under this docType -> nothing to report
    if (codes.length === 0) {
      return Response.json([])
    }
    whereCondition.itemcode = { in: codes }
  }

  // Optimized mode for sale page - only fields needed for stock/lot calculation
  if (fields === 'sale') {
    const get = await prisma.rCitemlist.findMany({
      where: whereCondition,
      select: {
        id: true,
        itemcode: true,
        lot: true,
        qty: true,
        sale: true,
        newCost: true,
        // ทุนสุทธิหลังหักส่วนลด — หน้าขายใช้ตัวนี้เป็นหลัก (ดู src/lib/lotCost.ts)
        // ไม่ต้องส่ง totalcost/discountbaht มาด้วยเพื่อประหยัด payload: แถวที่มีส่วนลดจริง
        // ผ่านจุดเขียนที่คำนวณ netCost ให้เสมอ ส่วนแถวที่ netCost ยังว่างคือแถวไม่มีส่วนลด
        // ซึ่ง lotUnitCost() ตกกลับไปใช้ newCost ได้ถูกต้องอยู่แล้ว
        netCost: true,
        balance: true,
        Barcode: true,
        dateRC: true,
        dateExp: true,
      },
      orderBy: { id: sort as 'asc' | 'desc' },
    })
    return Response.json(get)
  }

  const get = await prisma.rCitemlist.findMany({
    where: whereCondition,
    orderBy: {
      id: sort as 'asc' | 'desc'
    },

  })
  return Response.json(get)
}




export async function DELETE(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const company = request.nextUrl.searchParams.get('company')
    const codenames = request.nextUrl.searchParams.get('codenames')
    if (!company || !codenames) {
      return new Response(JSON.stringify({ error: 'company and codenames are required' }), { status: 400 })
    }
    const result = await prisma.rCitemlist.deleteMany({
      where: { company, codenames }
    })
    return Response.json(result)
  } catch (error) {
    return new Response(JSON.stringify(error), { status: 500 })
  }
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try {
    const { company, codenames, itemcode, itemName, unit, newCost, qty, totalcost, lot, dateExp, freebaht, discountbaht, Barcode, type, subtype, person, statuss, dateRC, sale, codevender, namevender, balance, saleQty, saleUnit, saleFactor } = await req.json()
    const normalizedDateExp = dateExp ? new Date(dateExp) : null
    let normalizedDateRC = dateRC ? new Date(dateRC) : null
    if (normalizedDateRC && Number.isNaN(normalizedDateRC.getTime())) normalizedDateRC = null
    // dateRC ห้ามเป็น NULL — รายงานที่กรองด้วย dateRC จะมองไม่เห็นแถวนี้
    // (ฟอร์มเก่าเคยส่ง Invalid Date มาตอนยังไม่กรอกวันรับสินค้า) → ใช้วันรับสินค้าของหัวบิลแทน
    if (!normalizedDateRC && company && codenames) {
      const header = await prisma.receive.findFirst({
        where: { company, orderfull: codenames },
        select: { receive_date: true },
      })
      normalizedDateRC = header?.receive_date || null
    }
    if (!normalizedDateRC) normalizedDateRC = new Date()
    // หน่วยขายที่ใช้รับ (กล่อง/ลัง) — เก็บไว้ดูย้อนหลังเท่านั้น qty/unit/newCost ที่ส่งมา
    // ต้องเป็นหน่วยย่อยแล้วเสมอ (ฟอร์มแปลงให้ก่อน — ดู src/lib/receiveUnit.ts)
    const packing = normalizeReceivePacking({ saleQty, saleUnit, saleFactor })
    // ทุนสุทธิหลังหักส่วนลดของบรรทัดนี้ — คำนวณที่ชั้น API จุดเดียว ฟอร์มทุกหน้าจึงได้ค่าตรงกัน
    const netCost = netCostPatch({ newCost, qty, totalcost, discountbaht, freebaht })
    const newUser = await prisma.rCitemlist.create({
      data: {


        company, codenames, itemcode, itemName, unit, newCost, qty, totalcost, lot, dateExp: normalizedDateExp, freebaht, discountbaht, Barcode, type, subtype, person, statuss, dateRC: normalizedDateRC, sale, codevender, namevender, balance, ...packing, ...netCost

      },
    })
    return Response.json(newUser)

  } catch (error) {
    return new Response(error as BodyInit, {
      status: 500,
    })
  }

}