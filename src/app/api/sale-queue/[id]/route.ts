import { normalizeQueueStatus } from '@/lib/saleQueue'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma')
  if (!prisma) throw new Error('Prisma is not available during build.')
  return prisma
}

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/sale-queue/[id] — เปลี่ยนสถานะคิว (รอทำ → กำลังทำ → พร้อมรับ → รับแล้ว)
 * ประทับเวลา readyAt / doneAt ให้อัตโนมัติตอนเข้าสถานะนั้นครั้งแรก เพื่อใช้ดูเวลารอย้อนหลังได้
 */
export async function PATCH(req: Request, context: RouteContext) {
  const prisma = await getPrisma()
  try {
    const params = await context.params
    const id = Number(params.id)
    if (!Number.isFinite(id)) return Response.json({ error: 'id ไม่ถูกต้อง' }, { status: 400 })

    const body = await req.json()
    const current = await prisma.saleQueue.findUnique({ where: { id } })
    if (!current) return Response.json({ error: 'ไม่พบคิวนี้' }, { status: 404 })

    const data: any = {}

    if (body.status !== undefined) {
      const status = normalizeQueueStatus(body.status)
      data.status = status
      if (status === 'ready' && !current.readyAt) data.readyAt = new Date()
      if (status === 'done' && !current.doneAt) data.doneAt = new Date()
      // ถอยสถานะกลับ = ล้างเวลาที่ประทับไว้ ไม่งั้นเวลารอที่คำนวณได้จะเพี้ยน
      if (status === 'waiting' || status === 'preparing') {
        data.readyAt = null
        data.doneAt = null
      }
    }

    if (body.note !== undefined) data.note = String(body.note ?? '').trim()

    const updated = await prisma.saleQueue.update({ where: { id }, data })
    return Response.json(updated)
  } catch (error: any) {
    console.error('PATCH /api/sale-queue/[id] error:', error)
    return Response.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
