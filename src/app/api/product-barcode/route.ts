// API บาร์โค้ดสำรอง (alias) ของสินค้า — "หลายบาร์โค้ดต่อหนึ่งหน่วยสินค้า"
//
// ตารางนี้ไม่แตะข้อมูลธุรกรรมใด ๆ (ดูเหตุผลเต็มใน src/lib/barcodeResolve.ts)
// เอกสาร รับ/ขาย/โอน/รับโอน/ปรับยอด ยังบันทึก Datalist.Barcode เหมือนเดิม
// การเพิ่ม/ลบที่นี่จึงปลอดภัยแม้สินค้ามีความเคลื่อนไหวสต็อกไปแล้ว
//
//   GET    /api/product-barcode?company=X                  → alias ทั้งหมด (สำหรับสร้าง map ฝั่ง client)
//   GET    /api/product-barcode?company=X&productCode=Y     → alias ของสินค้าตัวเดียว
//   GET    /api/product-barcode?company=X&fields=index      → payload บางเฉียบ [{b, c}] สำหรับหน้าขาย
//   POST   /api/product-barcode                             → เพิ่ม (ตรวจชนทุกที่เก็บบาร์โค้ด)
//   DELETE /api/product-barcode?id=N                        → ลบ

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { findBarcodeConflict, normalizeBarcode } from "@/lib/barcodeResolve"

export async function GET(request: NextRequest) {
    try {
        const params = request.nextUrl.searchParams
        const company = params.get("company") || ""
        const productCode = params.get("productCode") || ""
        const barcode = params.get("barcode") || ""
        const fields = params.get("fields") || ""

        if (!company) {
            return NextResponse.json({ error: "company required" }, { status: 400 })
        }

        const where: any = { company }
        if (productCode) where.productCode = productCode
        if (barcode) where.barcode = normalizeBarcode(barcode)

        // payload ขนาดเล็กสำหรับหน้าขาย/รับ: ส่งเฉพาะที่ยังเปิดใช้งาน
        if (fields === "index") {
            where.isActive = true
            const rows = await prisma.productBarcode.findMany({
                where,
                select: { barcode: true, productCode: true },
                orderBy: { id: "asc" },
            })
            return NextResponse.json(rows.map((r) => ({ b: r.barcode, c: r.productCode })))
        }

        const rows = await prisma.productBarcode.findMany({
            where,
            orderBy: { id: "asc" },
        })
        return NextResponse.json(rows)
    } catch (error: any) {
        console.error("GET /api/product-barcode error:", error)
        return NextResponse.json({ error: "Failed", details: error?.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const company = String(body.company || "")
        const productCode = String(body.productCode || "")
        const barcode = normalizeBarcode(body.barcode)

        if (!company || !productCode) {
            return NextResponse.json({ error: "company และ productCode จำเป็นต้องมี" }, { status: 400 })
        }
        if (!barcode) {
            return NextResponse.json({ error: "กรุณากรอกบาร์โค้ด" }, { status: 400 })
        }

        // สินค้าต้องมีอยู่จริง — กัน alias ลอยที่สแกนแล้วหาสินค้าไม่เจอ
        const product = await prisma.datalist.findFirst({
            where: { company, code: productCode },
            select: { id: true, Barcode: true },
        })
        if (!product) {
            return NextResponse.json({ error: `ไม่พบสินค้ารหัส ${productCode}` }, { status: 404 })
        }

        // ตรงกับบาร์โค้ดหลักของตัวเองอยู่แล้ว — ไม่ต้องเพิ่มซ้ำ
        if (normalizeBarcode(product.Barcode) === barcode) {
            return NextResponse.json(
                { error: `บาร์โค้ด ${barcode} เป็นบาร์โค้ดหลักของสินค้านี้อยู่แล้ว` },
                { status: 409 }
            )
        }

        // ซ้ำกับ alias ของตัวเอง
        const own = await prisma.productBarcode.findFirst({
            where: { company, productCode, barcode },
            select: { id: true },
        })
        if (own) {
            return NextResponse.json(
                { error: `บาร์โค้ด ${barcode} ถูกเพิ่มให้สินค้านี้ไปแล้ว` },
                { status: 409 }
            )
        }

        const conflict = await findBarcodeConflict(company, barcode, productCode)
        if (conflict) {
            return NextResponse.json({ error: conflict.message, conflict }, { status: 409 })
        }

        const created = await prisma.productBarcode.create({
            data: {
                company,
                productCode,
                productId: product.id,
                barcode,
                note: String(body.note || ""),
                isActive: body.isActive === false ? false : true,
                createdBy: String(body.createdBy || ""),
            },
        })
        return NextResponse.json(created, { status: 201 })
    } catch (error: any) {
        // ชน unique index (company, barcode) จากการกดพร้อมกันสองหน้าต่าง
        if (error?.code === "P2002") {
            return NextResponse.json({ error: "บาร์โค้ดนี้ถูกใช้งานแล้วในระบบ" }, { status: 409 })
        }
        console.error("POST /api/product-barcode error:", error)
        return NextResponse.json({ error: "Failed", details: error?.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const id = Number(request.nextUrl.searchParams.get("id") || 0)
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

        await prisma.productBarcode.delete({ where: { id } })
        return NextResponse.json({ ok: true })
    } catch (error: any) {
        if (error?.code === "P2025") {
            return NextResponse.json({ error: "ไม่พบรายการที่ต้องการลบ" }, { status: 404 })
        }
        console.error("DELETE /api/product-barcode error:", error)
        return NextResponse.json({ error: "Failed", details: error?.message }, { status: 500 })
    }
}
