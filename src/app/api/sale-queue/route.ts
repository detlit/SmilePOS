import { NextRequest } from 'next/server'
import { normalizeQueueStatus, queueDateOf, type SaleQueueItem } from '@/lib/saleQueue'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma')
  if (!prisma) throw new Error('Prisma is not available during build.')
  return prisma
}

const cleanText = (v: unknown) => String(v ?? '').trim()

/** ย่อรายการสินค้าให้เหลือเท่าที่ใบ job และแผงคิวต้องใช้ — บิลใหญ่ ๆ จะได้ไม่บวม */
function normalizeItems(raw: unknown): SaleQueueItem[] {
  if (!Array.isArray(raw)) return []
  return raw.slice(0, 100).map((it: any) => ({
    name: cleanText(it?.name).slice(0, 160),
    qty: Number(it?.qty) || 0,
    unit: cleanText(it?.unit).slice(0, 40),
  }))
}

/** GET /api/sale-queue?company=&date=YYYY-MM-DD&status=waiting,preparing */
export async function GET(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const params = request.nextUrl.searchParams
    const company = cleanText(params.get('company'))
    const queueDate = cleanText(params.get('date')) || queueDateOf()
    const statusParam = cleanText(params.get('status'))

    const where: any = { queueDate }
    if (company) where.company = company
    if (statusParam) {
      const list = statusParam.split(',').map((s) => normalizeQueueStatus(s))
      where.status = { in: Array.from(new Set(list)) }
    }

    // Prisma client ที่ dev server โหลดค้างไว้ตั้งแต่ก่อนเพิ่ม model จะไม่มี saleQueue
    // ตอบให้ชัดว่าต้อง restart ดีกว่าปล่อยเป็น 500 เปล่า ๆ ที่ไล่สาเหตุไม่ได้
    if (!prisma.saleQueue) {
      return Response.json(
        { error: 'Prisma client ยังไม่รู้จักตาราง SaleQueue — กรุณา restart dev server หลังรัน prisma generate' },
        { status: 503 }
      )
    }

    const rows = await prisma.saleQueue.findMany({ where, orderBy: [{ queueNo: 'asc' }] })
    return Response.json(rows)
  } catch (error: any) {
    console.error('GET /api/sale-queue error:', error)
    return Response.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}

/**
 * POST /api/sale-queue — ออกเลขคิวใบใหม่
 *
 * เลขคิวรันใหม่ทุกวัน จึงคำนวณจาก max(queueNo) ของวันนั้น แล้วอาศัย unique
 * [company, queueDate, queueNo] เป็นตัวตัดสินตอนสองเครื่องกดชำระพร้อมกัน:
 * ใครแพ้จะโดน P2002 แล้ววนขอเลขถัดไปใหม่ (ไม่ใช้ transaction ยาว ๆ ล็อกทั้งตาราง)
 *
 * ถ้าส่ง orderNo เดิมซ้ำ (กดชำระซ้ำ / retry) จะคืนคิวใบเดิมกลับไป ไม่ออกเลขใหม่
 */
export async function POST(req: Request) {
  const prisma = await getPrisma()
  try {
    const data = await req.json()
    const company = cleanText(data.company)
    if (!company) return Response.json({ error: 'กรุณาระบุ company' }, { status: 400 })

    const queueDate = cleanText(data.queueDate) || queueDateOf()
    const orderNo = cleanText(data.orderNo)

    if (orderNo) {
      const existing = await prisma.saleQueue.findFirst({ where: { company, orderNo } })
      if (existing) return Response.json({ ...existing, duplicated: true })
    }

    const base = {
      company,
      branch: cleanText(data.branch),
      queueDate,
      orderNo: orderNo || null,
      id_salemain: Number.isFinite(Number(data.id_salemain)) ? Number(data.id_salemain) : null,
      customer: cleanText(data.customer),
      seller: cleanText(data.seller),
      itemCount: Number(data.itemCount) || 0,
      totalAmount: Number(data.totalAmount) || 0,
      items: normalizeItems(data.items),
      note: cleanText(data.note),
      status: normalizeQueueStatus(data.status),
    }

    for (let attempt = 0; attempt < 8; attempt++) {
      const last = await prisma.saleQueue.findFirst({
        where: { company, queueDate },
        orderBy: { queueNo: 'desc' },
        select: { queueNo: true },
      })
      const queueNo = (last?.queueNo || 0) + 1 + attempt

      try {
        const created = await prisma.saleQueue.create({ data: { ...base, queueNo } })
        return Response.json(created)
      } catch (e: any) {
        // P2002 = เลขคิวนี้เพิ่งถูกเครื่องอื่นคว้าไป → ขอเลขถัดไปใหม่
        if (e?.code === 'P2002') continue
        throw e
      }
    }

    return Response.json({ error: 'ออกเลขคิวไม่สำเร็จ กรุณาลองใหม่' }, { status: 409 })
  } catch (error: any) {
    console.error('POST /api/sale-queue error:', error)
    return Response.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
