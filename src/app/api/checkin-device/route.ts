import { NextRequest, NextResponse } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma')
  if (!prisma) throw new Error('Prisma is not available during build.')
  return prisma
}

// หมายเหตุ: ใช้ raw SQL แทน model delegate (prisma.checkinDevice) เพื่อความทนทาน
// เนื่องจาก Next dev เก็บ PrismaClient ไว้บน globalThis ข้าม HMR ทำให้ instance เดิม
// อาจยังไม่รู้จัก model ใหม่จนกว่าจะ restart กระบวนการ — raw query ทำงานได้เสมอ

const TABLE = '"CheckinDevice"'

// GET - รายชื่อคอมพิวเตอร์ที่ได้รับอนุญาตของบริษัท (และเช็คสถานะของ deviceId เครื่องนี้)
export async function GET(request: NextRequest) {
  try {
    const idcompany = (request.nextUrl.searchParams.get('idcompany') || '').trim()
    const deviceId = (request.nextUrl.searchParams.get('deviceId') || '').trim()

    if (!idcompany) {
      return NextResponse.json({ error: 'idcompany is required' }, { status: 400 })
    }

    const prisma = await getPrisma()
    const devices = (await prisma.$queryRawUnsafe(
      `SELECT * FROM ${TABLE} WHERE "idcompany" = $1 ORDER BY "createdAt" ASC`,
      idcompany
    )) as any[]

    const current = deviceId
      ? devices.find((d: any) => d.deviceId === deviceId) || null
      : null

    return NextResponse.json({ devices, current }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching checkin devices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - ผูก/ลงทะเบียนคอมพิวเตอร์เครื่องนี้ (upsert ตาม deviceId)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const idcompany = String(body?.idcompany || '').trim()
    const deviceId = String(body?.deviceId || '').trim()
    const name = String(body?.name || '').trim()
    const branch = String(body?.branch || '').trim()
    const deviceType = String(body?.deviceType || 'Web').trim() || 'Web'
    const registeredBy = String(body?.registeredBy || '').trim()

    if (!idcompany || !deviceId) {
      return NextResponse.json({ error: 'idcompany และ deviceId จำเป็นต้องระบุ' }, { status: 400 })
    }

    const prisma = await getPrisma()
    const existingRows = (await prisma.$queryRawUnsafe(
      `SELECT * FROM ${TABLE} WHERE "deviceId" = $1 LIMIT 1`,
      deviceId
    )) as any[]
    const existing = existingRows[0]

    if (existing) {
      const rows = (await prisma.$queryRawUnsafe(
        `UPDATE ${TABLE}
           SET "idcompany" = $1, "name" = $2, "branch" = $3, "deviceType" = $4,
               "status" = 'active', "updatedAt" = NOW()
         WHERE "deviceId" = $5
         RETURNING *`,
        idcompany,
        name || existing.name || '',
        branch || existing.branch || '',
        deviceType,
        deviceId
      )) as any[]
      return NextResponse.json(rows[0], { status: 200 })
    }

    const finalName = name || `เครื่อง ${new Date().toLocaleDateString('th-TH')}`
    const rows = (await prisma.$queryRawUnsafe(
      `INSERT INTO ${TABLE}
         ("idcompany", "deviceId", "name", "branch", "deviceType", "status", "registeredBy", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, 'active', $6, NOW(), NOW())
       RETURNING *`,
      idcompany,
      deviceId,
      finalName,
      branch,
      deviceType,
      registeredBy
    )) as any[]
    return NextResponse.json(rows[0], { status: 201 })
  } catch (error: any) {
    console.error('Error registering checkin device:', error)
    return NextResponse.json({ error: `Internal server error: ${error?.message || 'Unknown error'}` }, { status: 500 })
  }
}

// PUT - แก้ไขชื่อ/สาขา/สถานะของเครื่อง (ต้องระบุ id)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const id = Number(body?.id)
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const sets: string[] = []
    const params: any[] = []
    let i = 1
    if (body?.name !== undefined) { sets.push(`"name" = $${i++}`); params.push(String(body.name || '').trim()) }
    if (body?.branch !== undefined) { sets.push(`"branch" = $${i++}`); params.push(String(body.branch || '').trim()) }
    if (body?.status !== undefined) { sets.push(`"status" = $${i++}`); params.push(body.status === 'disabled' ? 'disabled' : 'active') }
    sets.push(`"updatedAt" = NOW()`)

    if (params.length === 0) {
      return NextResponse.json({ error: 'ไม่มีข้อมูลที่จะแก้ไข' }, { status: 400 })
    }

    params.push(id)
    const prisma = await getPrisma()
    const rows = (await prisma.$queryRawUnsafe(
      `UPDATE ${TABLE} SET ${sets.join(', ')} WHERE "id" = $${i} RETURNING *`,
      ...params
    )) as any[]
    return NextResponse.json(rows[0], { status: 200 })
  } catch (error: any) {
    console.error('Error updating checkin device:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - ลบสิทธิ์เครื่อง (ระบุ id หรือ deviceId)
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    const deviceId = request.nextUrl.searchParams.get('deviceId')

    if (!id && !deviceId) {
      return NextResponse.json({ error: 'id หรือ deviceId is required' }, { status: 400 })
    }

    const prisma = await getPrisma()
    if (id) {
      await prisma.$executeRawUnsafe(`DELETE FROM ${TABLE} WHERE "id" = $1`, Number(id))
    } else {
      await prisma.$executeRawUnsafe(`DELETE FROM ${TABLE} WHERE "deviceId" = $1`, String(deviceId))
    }
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error deleting checkin device:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
