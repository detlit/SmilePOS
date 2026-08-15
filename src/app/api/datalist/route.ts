import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma';
import { productCodesMatchingAlias } from '@/lib/barcodeResolve';
import { normalizeRequireLot } from '@/lib/lotPolicy';

const normalizeMemberDiscountEligible = (value: unknown) => {
  if (value === undefined || value === null || value === "") return true
  if (typeof value === "boolean") return value
  return String(value) === "true"
}

export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const ProductName = searchParam.get('ProductName') || ''
  const code = searchParam.get('code') || ''
  const Barcode = searchParam.get('Barcode') || ''
  const query = searchParam.get('q') || searchParam.get('search') || ''
  const company = searchParam.get('company')
  const sort = searchParam.get('sort') || 'asc'
  const fields = searchParam.get('fields')
  const takeValue = Number(searchParam.get('take') || 0)
  const take = Number.isFinite(takeValue) && takeValue > 0 ? takeValue : undefined

  const whereParts: any[] = []

  if (company) {
    whereParts.push({ company })
  }

  if (ProductName) {
    whereParts.push({
      ProductName: {
        contains: ProductName,
        mode: 'insensitive' as const,
      },
    })
  }

  if (code) {
    whereParts.push({
      code: {
        startsWith: code,
        mode: 'insensitive' as const,
      },
    })
  }

  // ค้นด้วยบาร์โค้ด — ต้องเจอทั้งบาร์โค้ดหลัก (Datalist.Barcode) และบาร์โค้ดสำรอง
  // (ProductBarcode) เพราะสินค้าหนึ่งหน่วยมีบาร์โค้ดได้หลายตัว การค้นด้วยบาร์โค้ด
  // สำรองจึงต้องคืน "สินค้าเจ้าของ" ตัวเดียวกัน
  if (Barcode) {
    const aliasCodes = company ? await productCodesMatchingAlias(company, Barcode, 'startsWith') : []
    whereParts.push({
      OR: [
        { Barcode: { startsWith: Barcode, mode: 'insensitive' as const } },
        ...(aliasCodes.length > 0 ? [{ code: { in: aliasCodes } }] : []),
      ],
    })
  }

  if (query) {
    const aliasCodes = company ? await productCodesMatchingAlias(company, query, 'contains') : []
    whereParts.push({
      OR: [
        {
          ProductName: {
            contains: query,
            mode: 'insensitive' as const,
          },
        },
        {
          code: {
            contains: query,
            mode: 'insensitive' as const,
          },
        },
        {
          Barcode: {
            contains: query,
            mode: 'insensitive' as const,
          },
        },
        {
          fixname: {
            contains: query,
            mode: 'insensitive' as const,
          },
        },
        ...(aliasCodes.length > 0 ? [{ code: { in: aliasCodes } }] : []),
      ],
    })
  }

  const whereClause = whereParts.length > 1
    ? { AND: whereParts }
    : whereParts[0] || {}

  const queryOptions: { take?: number } = take ? { take } : {}

  // When fields=list, only return essential fields for the product list table (faster)
  // When fields=receive, return fields needed for receive pages
  // When fields=sale, return fields needed for the sale page (pricing, labels, etc.)
  let get
  if (fields === 'list') {
    get = await prisma.datalist.findMany({
      where: whereClause,
      select: {
        id: true,
        code: true,
        ProductName: true,
        Barcode: true,
        Show: true,
        type: true,
        subtype: true,
        Area: true,
        maker: true,
        qty_unit: true,
        requireLot: true,
      },
      ...queryOptions,
      orderBy: {
        id: sort,
      } as any,
    })
  } else if (fields === 'receive') {
    get = await prisma.datalist.findMany({
      where: whereClause,
      select: {
        id: true,
        code: true,
        ProductName: true,
        Barcode: true,
        Unit: true,
        price: true,
        CostActual: true,
        type: true,
        subtype: true,
        // ฟอร์มรับสินค้าต้องรู้ว่าสินค้านี้ต้องกรอก Lot/วันหมดอายุหรือไม่
        // และต้องส่งค่าเดิมกลับตอน PUT ทุน ไม่งั้นค่าจะถูกรีเซ็ต
        memberDiscountEligible: true,
        requireLot: true,
      },
      ...queryOptions,
      orderBy: {
        id: sort,
      } as any,
    })
  } else if (fields === 'sale') {
    get = await prisma.datalist.findMany({
      where: whereClause,
      select: {
        id: true,
        code: true,
        ProductName: true,
        Barcode: true,
        Unit: true,
        price: true,
        wholesaleprice: true,
        online: true,
        PriceA: true,
        PriceB: true,
        PriceC: true,
        PriceD: true,
        PriceE: true,
        PriceF: true,
        PriceG: true,
        PriceH: true,
        CostActual: true,
        fixname: true,
        Category: true,
        Show: true,
        type: true,
        subtype: true,
        pic: true,
        concentration: true,
        dosePerKg: true,
        doseFrequency: true,
        maxDosePerDay: true,
        Min: true,
        Max: true,
        ROP: true,
        memberDiscountEligible: true,
        requireLot: true,
      },
      ...queryOptions,
      orderBy: {
        id: sort,
      } as any,
    })
  } else if (fields === 'drug-set') {
    get = await prisma.datalist.findMany({
      where: whereClause,
      select: {
        id: true,
        code: true,
        ProductName: true,
        Barcode: true,
        Unit: true,
        price: true,
        wholesaleprice: true,
        online: true,
        PriceA: true,
        PriceB: true,
        PriceC: true,
        PriceD: true,
        PriceE: true,
        PriceF: true,
        PriceG: true,
        PriceH: true,
        CostActual: true,
        fixname: true,
        group: true,
        Category: true,
        Show: true,
        requireLot: true,
      },
      ...queryOptions,
      orderBy: {
        id: sort,
      } as any,
    })
  } else {
    get = await prisma.datalist.findMany({
      where: whereClause,
      ...queryOptions,
      orderBy: {
        id: sort,
      } as any,
    })
  }

  return NextResponse.json(get)
}

export async function POST(req: Request) {
  try {
    const data = await req.json()

    if (data.code) {
      const existing = await prisma.datalist.findFirst({
        where: { company: data.company, code: String(data.code) },
        select: { id: true },
      })
      if (existing) {
        return NextResponse.json({
          error: "DUPLICATE_CODE",
          details: `รหัสสินค้า ${data.code} มีอยู่ในระบบแล้ว`,
        }, { status: 409 })
      }
    }

    const newUser = await prisma.datalist.create({
      data: {
        company: data.company,
        code: data.code,
        ProductName: data.ProductName,
        fixname: data.fixname,
        group: data.group,
        type: data.type,
        subtype: data.subtype,
        Category: data.Category,
        DrugRegistor: data.DrugRegistor,
        Area: data.Area,
        CostActual: data.CostActual,
        Unit: data.Unit,
        price: data.price,
        wholesaleprice: data.wholesaleprice,
        online: data.online,
        PriceA: data.PriceA,
        PriceB: data.PriceB,
        PriceC: data.PriceC,
        PriceD: data.PriceD,
        PriceE: data.PriceE,
        PriceF: data.PriceF,
        PriceG: data.PriceG,
        PriceH: data.PriceH,
        Barcode: data.Barcode,
        Max: data.Max,
        Min: data.Min,
        ROP: data.ROP,
        AlarmExp: data.AlarmExp,
        Show: data.Show,
        Child: data.Child,
        CI: data.CI,
        Remark: data.Remark,
        pic: data.pic,
        concentration: data.concentration,
        dosePerKg: data.dosePerKg,
        doseFrequency: data.doseFrequency,
        maxDosePerDay: data.maxDosePerDay,
        memberDiscountEligible: normalizeMemberDiscountEligible(data.memberDiscountEligible),
        requireLot: normalizeRequireLot(data.requireLot)
      },
    })
    return NextResponse.json(newUser)
  } catch (error: any) {
    console.error("POST /api/datalist error:", error)
    return NextResponse.json({
      error: "Internal Server Error",
      details: error.message,
      code: error.code // Prisma error code
    }, { status: 500 })
  }
}