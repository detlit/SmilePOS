import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: ค้นหาข้อมูลสินค้าของสาขาผู้รับตาม Barcode
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { barcodes, receiverCompanyId } = body;

        console.log(`🔍 Receiver Lookup - Barcodes: ${JSON.stringify(barcodes)}, CompanyId: "${receiverCompanyId}"`);

        if (!barcodes || !Array.isArray(barcodes) || !receiverCompanyId) {
            return NextResponse.json(
                { error: "barcodes (array) and receiverCompanyId are required" },
                { status: 400 }
            );
        }

        // Filter out null/empty barcodes
        const validBarcodes = barcodes.filter(b => b && b.trim() !== '');

        if (validBarcodes.length === 0) {
            console.log("⚠️ No valid barcodes to search");
            return NextResponse.json({});
        }

        console.log(`📦 Searching for barcodes: ${validBarcodes.join(', ')} in company ID: "${receiverCompanyId}"`);

        // ค้นหาสินค้าของสาขาผู้รับจาก Datalist โดยใช้ Barcode และ company ID
        const receiverProducts = await prisma.datalist.findMany({
            where: {
                company: receiverCompanyId,  // company เก็บเป็น ID (string)
                Barcode: { in: validBarcodes }
            },
            select: {
                code: true,
                ProductName: true,
                Barcode: true
            }
        });

        console.log(`✅ Found ${receiverProducts.length} products in receiver's Datalist`);

        // แปลงเป็น map โดยใช้ Barcode เป็น key
        const productMap: Record<string, any> = {};
        for (const product of receiverProducts) {
            if (product.Barcode) {
                productMap[product.Barcode] = {
                    itemcode: product.code,
                    itemName: product.ProductName,
                    Barcode: product.Barcode
                };
                console.log(`  - Found: ${product.Barcode} -> ${product.code} (${product.ProductName})`);
            }
        }

        return NextResponse.json(productMap);
    } catch (error) {
        console.error("Error looking up receiver products:", error);
        return NextResponse.json(
            { error: "Failed to lookup receiver products" },
            { status: 500 }
        );
    }
}
