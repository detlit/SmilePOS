import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Debug - ค้นหาสินค้าตาม Barcode โดยไม่สน company
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const barcode = searchParams.get("barcode");

        if (!barcode) {
            return NextResponse.json(
                { error: "barcode is required" },
                { status: 400 }
            );
        }

        // ค้นหาทุก Datalist ที่มี Barcode นี้
        const products = await prisma.datalist.findMany({
            where: {
                Barcode: barcode
            },
            select: {
                id: true,
                company: true,
                code: true,
                ProductName: true,
                Barcode: true
            }
        });

        console.log(`🔍 Debug Barcode "${barcode}" found in ${products.length} companies:`);
        products.forEach(p => {
            console.log(`  - ID: ${p.id}, Company: "${p.company}", Code: ${p.code}`);
        });

        return NextResponse.json({
            barcode,
            totalFound: products.length,
            products
        });
    } catch (error) {
        console.error("Error in debug lookup:", error);
        return NextResponse.json(
            { error: "Failed" },
            { status: 500 }
        );
    }
}
