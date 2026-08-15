import { NextRequest } from 'next/server'
import { normalizeRequireLot } from '@/lib/lotPolicy'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

const normalizeMemberDiscountEligible = (value: unknown) => {
  if (value === undefined || value === null || value === "") return true
  if (typeof value === "boolean") return value
  return String(value) === "true"
}

// 1. ????? Type ?????????? context ?????? params ???? Promise
type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  req: Request,
  context: RouteContext, // ??? Type ??????
) {
  try {
    // 2. await params ????????????????????????
    const params = await context.params
const prisma = await getPrisma();
    const getId = await prisma.datalist.findUnique({
      where: { id: Number(params.id) }
    })
    return Response.json(getId)
  } catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }
}

export async function PUT(
  req: Request,
  context: RouteContext, // ??? Type ??????
) {
  try {
    // 2. await params
    const params = await context.params
const prisma = await getPrisma();
    const body = await req.json()
    const { code, ProductName, fixname, group, type, subtype, Category, DrugRegistor, Area, CostActual, Unit, price, wholesaleprice, online, PriceA, PriceB, PriceC, PriceD, PriceE, PriceF, PriceG, PriceH, Barcode, Max, Min, ROP, AlarmExp, Show, Child, CI, Remark, pic, maker, qty_unit, concentration, dosePerKg, doseFrequency, maxDosePerDay }
      = body

    // แฟล็ก boolean ของสินค้า: ถ้าผู้เรียกไม่ส่งฟิลด์มาเลย = "ไม่แตะต้องค่าเดิม"
    // (เดิม PUT ที่แก้แค่ราคา/ทุน จะเผลอรีเซ็ต memberDiscountEligible กลับเป็น true)
    const booleanFlags: Record<string, boolean> = {}
    if ('memberDiscountEligible' in body) {
      booleanFlags.memberDiscountEligible = normalizeMemberDiscountEligible(body.memberDiscountEligible)
    }
    if ('requireLot' in body) {
      booleanFlags.requireLot = normalizeRequireLot(body.requireLot)
    }

    // บาร์โค้ดสำรองผูกกับสินค้าด้วย productCode — ถ้ารหัสสินค้าเปลี่ยน ต้องย้ายตาม
    // ไม่งั้น alias จะกลายเป็นกำพร้า (สแกนแล้วหาสินค้าไม่เจอ)
    const before = code
      ? await prisma.datalist.findUnique({
          where: { id: Number(params.id) },
          select: { company: true, code: true },
        })
      : null

    const updated = await prisma.datalist.update({
      where: { id: Number(params.id) },
      data: { code, ProductName, fixname, group, type, subtype, Category, DrugRegistor, Area, CostActual, Unit, price, wholesaleprice, online, PriceA, PriceB, PriceC, PriceD, PriceE, PriceF, PriceG, PriceH, Barcode, Max, Min, ROP, AlarmExp, Show, Child, CI, Remark, pic, maker, qty_unit, concentration, dosePerKg, doseFrequency, maxDosePerDay, ...booleanFlags },
    })

    if (before?.code && before.code !== code) {
      await prisma.productBarcode.updateMany({
        where: { company: before.company, productCode: before.code },
        data: { productCode: code },
      })
    }

    return Response.json(updated)
  } catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }
}

export async function DELETE(
  req: Request,
  context: RouteContext, // ??? Type ??????
) {
  try {
    // 2. await params
    const params = await context.params
const prisma = await getPrisma();
    // ลบบาร์โค้ดสำรองของสินค้าตัวนี้ก่อน ไม่งั้นจะเหลือ alias ลอยที่สแกนแล้ว
    // หาสินค้าไม่เจอ และไปกินบาร์โค้ดของสินค้าตัวใหม่ที่จะสร้างทีหลัง
    const target = await prisma.datalist.findUnique({
      where: { id: Number(params.id) },
      select: { company: true, code: true },
    })
    if (target?.code) {
      await prisma.productBarcode.deleteMany({
        where: { company: target.company, productCode: target.code },
      })
    }

    const deleted = await prisma.datalist.delete({
      where: { id: Number(params.id) },
    })
    return Response.json(deleted)
  } catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }
}