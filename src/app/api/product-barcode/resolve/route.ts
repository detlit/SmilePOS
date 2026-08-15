// ค้นหาสินค้าจากบาร์โค้ดหนึ่งตัว (บาร์โค้ดหลัก / สำรอง / หน่วยแปลง)
//
// จุดยืนของ endpoint นี้: เป็น "ทางเข้าเดียว" ที่ทุกหน้าจอใช้แปลงบาร์โค้ดที่สแกน
// ให้กลายเป็นตัวสินค้า แล้วหน้าจอค่อยไปทำงานต่อด้วย code + primaryBarcode
// ตามเดิม — ห้ามเอา `scanned` ไปบันทึกลงเอกสาร (ดู src/lib/barcodeResolve.ts)
//
//   GET /api/product-barcode/resolve?company=X&barcode=Y
//     200 { found: true,  ...ResolvedBarcode }
//     200 { found: false }

import { NextRequest, NextResponse } from "next/server"
import { resolveBarcode } from "@/lib/barcodeResolve"

export async function GET(request: NextRequest) {
    try {
        const params = request.nextUrl.searchParams
        const company = params.get("company") || ""
        const barcode = params.get("barcode") || ""

        if (!company || !barcode) {
            return NextResponse.json({ error: "company และ barcode จำเป็นต้องมี" }, { status: 400 })
        }

        const resolved = await resolveBarcode(company, barcode)
        if (!resolved) return NextResponse.json({ found: false })

        return NextResponse.json({ found: true, ...resolved })
    } catch (error: any) {
        console.error("GET /api/product-barcode/resolve error:", error)
        return NextResponse.json({ error: "Failed", details: error?.message }, { status: 500 })
    }
}
