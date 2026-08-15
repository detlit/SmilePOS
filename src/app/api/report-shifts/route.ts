import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma')
  if (!prisma) throw new Error('Prisma is not available during build.')
  return prisma
}

type ShiftPayload = {
  id?: unknown
  name?: unknown
  start?: unknown
  end?: unknown
}

type NormalizedShift = {
  id: string
  name: string
  start: string
  end: string
}

const DEFAULT_SHIFTS = [
  { id: 'morning', name: 'เช้า', start: '07:00', end: '15:00' },
  { id: 'afternoon', name: 'บ่าย', start: '15:00', end: '22:00' },
  { id: 'night', name: 'ดึก', start: '22:00', end: '07:00' },
]

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

const getBearerToken = (request: NextRequest) => {
  const authorization = request.headers.get('authorization') || ''
  const [type, token] = authorization.split(' ')
  return type?.toLowerCase() === 'bearer' && token ? token : ''
}

const normalizeShiftKey = (value: unknown, index: number) => {
  const raw = String(value || '').trim()
  const safe = raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40)
  return safe || `shift_${Date.now()}_${index}`
}

const normalizeShift = (shift: ShiftPayload, index: number) => {
  const name = String(shift.name || '').trim() || `กะ ${index + 1}`
  const start = String(shift.start || '').trim()
  const end = String(shift.end || '').trim()

  if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end)) {
    throw new Error('เวลาของกะต้องอยู่ในรูปแบบ HH:mm')
  }

  return {
    id: normalizeShiftKey(shift.id, index),
    name: name.slice(0, 80),
    start,
    end,
  }
}

const toClientShift = (shift: { shiftKey: string; name: string; startTime: string; endTime: string }) => ({
  id: shift.shiftKey,
  name: shift.name,
  start: shift.startTime,
  end: shift.endTime,
})

export async function GET(request: NextRequest) {
  const company = String(request.nextUrl.searchParams.get('company') || '').trim()

  if (!company) {
    return NextResponse.json({ error: 'company is required' }, { status: 400 })
  }

  const prisma = await getPrisma()
  const rows = await prisma.reportWorkShift.findMany({
    where: { company },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  })

  return NextResponse.json({ shifts: rows.length > 0 ? rows.map(toClientShift) : DEFAULT_SHIFTS })
}

export async function PUT(request: NextRequest) {
  const token = getBearerToken(request)
  const payload = token ? verifyToken(token) as any : null

  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (String(payload.level || '') !== 'level2') {
    return NextResponse.json({ error: 'อนุญาตเฉพาะผู้ใช้ level 2 เท่านั้น' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const company = String(payload.idcompany || body?.company || '').trim()
  const shiftsInput = Array.isArray(body?.shifts) ? body.shifts : []

  if (!company) {
    return NextResponse.json({ error: 'company is required' }, { status: 400 })
  }

  if (shiftsInput.length === 0 || shiftsInput.length > 12) {
    return NextResponse.json({ error: 'ต้องมีรายการกะ 1-12 รายการ' }, { status: 400 })
  }

  let shifts: NormalizedShift[]
  try {
    shifts = shiftsInput.map(normalizeShift)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'ข้อมูลกะไม่ถูกต้อง' }, { status: 400 })
  }

  const uniqueKeys = new Set(shifts.map((shift) => shift.id))
  if (uniqueKeys.size !== shifts.length) {
    return NextResponse.json({ error: 'รหัสกะซ้ำกัน' }, { status: 400 })
  }

  const prisma = await getPrisma()
  const keepKeys = shifts.map((shift) => shift.id)

  await prisma.$transaction(async (tx: any) => {
    await tx.reportWorkShift.deleteMany({
      where: {
        company,
        shiftKey: { notIn: keepKeys },
      },
    })

    await Promise.all(shifts.map((shift, index) => tx.reportWorkShift.upsert({
      where: {
        company_shiftKey: {
          company,
          shiftKey: shift.id,
        },
      },
      update: {
        name: shift.name,
        startTime: shift.start,
        endTime: shift.end,
        sortOrder: index,
      },
      create: {
        company,
        shiftKey: shift.id,
        name: shift.name,
        startTime: shift.start,
        endTime: shift.end,
        sortOrder: index,
      },
    })))
  })

  const rows = await prisma.reportWorkShift.findMany({
    where: { company },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  })

  return NextResponse.json({ shifts: rows.map(toClientShift) })
}