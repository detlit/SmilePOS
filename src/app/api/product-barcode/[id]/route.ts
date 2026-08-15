// แก้ไข / เปิด-ปิด / ลบ บาร์โค้ดสำรองรายตัว
//
// การปิดใช้งาน (isActive=false) มีไว้สำหรับบาร์โค้ดที่เลิกใช้แต่ยังอยากเก็บประวัติ
// ไว้ดู — ปิดแล้วสแกนไม่ติด แต่ไม่กระทบเอกสารเก่าเลย เพราะเอกสารไม่เคยเก็บ
// บาร์โค้ดสำรองอยู่แล้ว (ดู src/lib/barcodeResolve.ts)

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { findBarcodeConflict, normalizeBarcode } from "@/lib/barcodeResolve"

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await context.params
        const id = Number(idParam || 0)
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

        const body = await request.json()
        const current = await prisma.productBarcode.findUnique({ where: { id } })
        if (!current) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 })

        const data: any = {}

        if (body.barcode !== undefined) {
            const barcode = normalizeBarcode(body.barcode)
            if (!barcode) return NextResponse.json({ error: "กรุณากรอกบาร์โค้ด" }, { status: 400 })

            if (barcode !== current.barcode) {
                const product = await prisma.datalist.findFirst({
                    where: { company: current.company || "", code: current.productCode },
                    select: { Barcode: true },
                })
                if (normalizeBarcode(product?.Barcode) === barcode) {
                    return NextResponse.json(
                        { error: `บาร์โค้ด ${barcode} เป็นบาร์โค้ดหลักของสินค้านี้อยู่แล้ว` },
                        { status: 409 }
                    )
                }
                const conflict = await findBarcodeConflict(
                    current.company || "",
                    barcode,
                    current.productCode,
                    { ignoreAliasId: id }
                )
                if (conflict) {
                    return NextResponse.json({ error: conflict.message, conflict }, { status: 409 })
                }
            }
            data.barcode = barcode
        }

        if (body.note !== undefined) data.note = String(body.note || "")
        if (body.isActive !== undefined) data.isActive = body.isActive !== false

        const updated = await prisma.productBarcode.update({ where: { id }, data })
        return NextResponse.json(updated)
    } catch (error: any) {
        if (error?.code === "P2002") {
            return NextResponse.json({ error: "บาร์โค้ดนี้ถูกใช้งานแล้วในระบบ" }, { status: 409 })
        }
        console.error("PUT /api/product-barcode/[id] error:", error)
        return NextResponse.json({ error: "Failed", details: error?.message }, { status: 500 })
    }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await context.params
        const id = Number(idParam || 0)
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

        await prisma.productBarcode.delete({ where: { id } })
        return NextResponse.json({ ok: true })
    } catch (error: any) {
        if (error?.code === "P2025") {
            return NextResponse.json({ error: "ไม่พบรายการที่ต้องการลบ" }, { status: 404 })
        }
        console.error("DELETE /api/product-barcode/[id] error:", error)
        return NextResponse.json({ error: "Failed", details: error?.message }, { status: 500 })
    }
}
