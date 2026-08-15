import { NextResponse, NextRequest } from "next/server"
import prisma from "@/lib/prisma" // Force re-save to resolve build cache issue
import { findBarcodeConflict } from "@/lib/barcodeResolve"

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const company = searchParams.get("company")
        const productCode = searchParams.get("productCode")
        const Barcode = searchParams.get("Barcode")

        const where: any = {}
        if (company) where.company = company
        if (productCode) where.productCode = productCode
        if (Barcode) where.Barcode = Barcode

        const data = await prisma.unitConversion.findMany({
            where,
            orderBy: { id: "asc" },
        })

        return NextResponse.json(data)
    } catch (error) {
        console.error("Error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Check for duplicate barcode in Datalist
        if (body.Barcode && body.Barcode.trim() !== "") {
            const existingDatalist = await prisma.datalist.findFirst({
                where: {
                    company: body.company,
                    Barcode: body.Barcode.trim(),
                    code: { not: body.productCode }
                }
            });
            if (existingDatalist) {
                return NextResponse.json({ error: "Barcode already exists in system" }, { status: 409 });
            }

            // ชนกับบาร์โค้ดสำรองของสินค้าตัวอื่น — บาร์โค้ดหนึ่งตัวต้องชี้สินค้าได้ตัวเดียว
            const conflict = await findBarcodeConflict(
                String(body.company || ""),
                body.Barcode,
                String(body.productCode || "")
            );
            if (conflict) {
                return NextResponse.json({ error: conflict.message }, { status: 409 });
            }
        }

        const data = await prisma.unitConversion.create({
            data: {
                company: body.company,
                productCode: body.productCode,
                qty: body.qty ?? 1,
                saleUnit: body.saleUnit,
                subQty: body.subQty ?? 12,
                subUnit: body.subUnit,
                priceRetail: body.priceRetail,
                priceWholesale: body.priceWholesale,
                priceOnline: body.priceOnline,
                priceA: body.priceA,
                priceB: body.priceB,
                priceC: body.priceC,
                priceD: body.priceD,
                priceE: body.priceE,
                priceF: body.priceF,
                priceG: body.priceG,
                priceH: body.priceH,
                Barcode: body.Barcode?.trim() || "",
            },
        })

        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error("Error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()

        if (!body.id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 })
        }

        // Check for duplicate barcode in Datalist
        if (body.Barcode && body.Barcode.trim() !== "") {
            const unitData = await prisma.unitConversion.findUnique({ where: { id: body.id } });
            if (unitData) {
                const existingDatalist = await prisma.datalist.findFirst({
                    where: {
                        company: unitData.company,
                        Barcode: body.Barcode.trim(),
                        code: { not: unitData.productCode }
                    }
                });
                if (existingDatalist) {
                    return NextResponse.json({ error: "Barcode already exists in system" }, { status: 409 });
                }

                // ชนกับบาร์โค้ดสำรองของสินค้าตัวอื่น (ดูเหตุผลใน POST)
                const conflict = await findBarcodeConflict(
                    String(unitData.company || ""),
                    body.Barcode,
                    String(unitData.productCode || "")
                );
                if (conflict) {
                    return NextResponse.json({ error: conflict.message }, { status: 409 });
                }
            }
        }

        const data = await prisma.unitConversion.update({
            where: { id: body.id },
            data: {
                qty: body.qty,
                saleUnit: body.saleUnit,
                subQty: body.subQty,
                subUnit: body.subUnit,
                priceRetail: body.priceRetail,
                priceWholesale: body.priceWholesale,
                priceOnline: body.priceOnline,
                priceA: body.priceA,
                priceB: body.priceB,
                priceC: body.priceC,
                priceD: body.priceD,
                priceE: body.priceE,
                priceF: body.priceF,
                priceG: body.priceG,
                priceH: body.priceH,
                Barcode: body.Barcode?.trim() || "",
            },
        })

        return NextResponse.json(data)
    } catch (error) {
        console.error("Error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 })
        }

        await prisma.unitConversion.delete({
            where: { id: parseInt(id) },
        })

        return NextResponse.json({ message: "Deleted" })
    } catch (error) {
        console.error("Error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}
