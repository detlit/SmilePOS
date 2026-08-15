import { NextRequest } from 'next/server'
import { normalizeReceivePacking } from '@/lib/receiveUnit'
import { netCostPatch } from '@/lib/lotCost'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

// 1. ????? Type ??? params ???? Promise
type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  req: Request,
  context: RouteContext,
) {
  try {
    // 2. ???? await params ????
    const params = await context.params
    const prisma = await getPrisma();
    const getId = await prisma.rCitemlist.findUnique({
      where: { id: Number(params.id) } // ??? params ??? await ????
    })
    return Response.json(getId)
  }
  catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }
}

export async function PUT(
  req: Request,
  context: RouteContext,
) {
  try {
    // 2. ???? await params ????
    const params = await context.params
    const prisma = await getPrisma();
    const { company, codenames, itemcode, itemName, unit, newCost, qty, totalcost, lot, dateExp, freebaht, discountbaht, Barcode, type, subtype, person, statuss, dateRC, sale, codevender, namevender, balance, saleQty, saleUnit, saleFactor }
      = await req.json()
    const normalizedDateExp = dateExp ? new Date(dateExp) : null
    // dateRC ไม่ส่งมา/ไม่ valid → คงค่าเดิมไว้ (undefined = ไม่อัพเดท) ห้ามล้างเป็น NULL
    let normalizedDateRC: Date | undefined = dateRC ? new Date(dateRC) : undefined
    if (normalizedDateRC && Number.isNaN(normalizedDateRC.getTime())) normalizedDateRC = undefined

    // หน่วยขายที่ใช้รับ — ผู้เรียกที่ไม่ส่งมาจะไม่ถูกแตะ (ดู normalizeReceivePacking)
    const packing = normalizeReceivePacking({ saleQty, saleUnit, saleFactor })
    // ทุนสุทธิคำนวณใหม่ทุกครั้งที่แก้ไขรายการ — ผู้เรียกที่ไม่ได้ส่งฟิลด์ต้นทุนมาเลยจะไม่ถูกแตะ
    const netCost = netCostPatch({ newCost, qty, totalcost, discountbaht, freebaht })

    const updated = await prisma.rCitemlist.update({
      where: { id: Number(params.id) }, // ??? params ??? await ????
      data: { company, codenames, itemcode, itemName, unit, newCost, qty, totalcost, lot, dateExp: normalizedDateExp, freebaht, discountbaht, Barcode, type, subtype, person, statuss, dateRC: normalizedDateRC, sale, codevender, namevender, balance, ...packing, ...netCost },
    })
    return Response.json(updated)

  } catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }
}

export async function DELETE(
  req: Request,
  context: RouteContext,
) {
  try {
    // 2. ???? await params ????
    const params = await context.params
    const prisma = await getPrisma();
    const deleted = await prisma.rCitemlist.delete({
      where: { id: Number(params.id) }, // ??? params ??? await ????
    })
    return Response.json(deleted)

  } catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }
}