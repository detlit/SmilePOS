import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeStockBalance } from "@/lib/stockBalance";
import { verifyBranchApiToken } from "@/lib/branchApiAuth";

// POST: ให้สาขาอื่นค้นหาสินค้าในเครื่องนี้ผ่าน Tunnel
// ใช้ apiToken ยืนยันตัวตน
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query, companyId, apiToken } = body;

        if (!query || !companyId || !apiToken) {
            return NextResponse.json(
                { error: "query, companyId, and apiToken are required" },
                { status: 400 }
            );
        }

        const auth = await verifyBranchApiToken(companyId, apiToken);

        if (!auth) {
            return NextResponse.json(
                { error: "Invalid apiToken" },
                { status: 401 }
            );
        }

        const searchPattern = `%${query}%`;

        // ค้นหาสินค้าจาก Datalist
        const products: any[] = await prisma.$queryRaw`
            SELECT * FROM "Datalist"
            WHERE "company" = ${String(companyId)}
              AND (
                COALESCE("Barcode", '') ILIKE ${searchPattern}
                OR COALESCE("code", '') ILIKE ${searchPattern}
                OR COALESCE("ProductName", '') ILIKE ${searchPattern}
              )
            ORDER BY "code" ASC
            LIMIT 20
        `;

        // สำหรับแต่ละสินค้า ดึงยอดคงเหลือ (ใช้สูตรเดียวกับ /api/stock-balance-summary)
        const results = [];
        for (const product of products) {
            const barcode = product.Barcode || "";

            const breakdown = await computeStockBalance({
                company: String(companyId),
                itemcode: product.code || "",
                barcode,
            });

            results.push({
                productCode: product.code,
                productName: product.ProductName,
                barcode: barcode,
                totalBalance: breakdown.calculatedBalance,
                hasProduct: true
            });
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error("Error in remote-lookup:", error);
        return NextResponse.json(
            { error: "Remote lookup failed" },
            { status: 500 }
        );
    }
}
