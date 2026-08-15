import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLotsWithCalculatedBalance, transferableLotQty } from "@/lib/stockBalance";
import { productCodesMatchingAlias } from "@/lib/barcodeResolve";
import { lotUnitCost } from "@/lib/lotCost";

// GET: ค้นหาสินค้าด้วย barcode, itemcode, หรือชื่อ
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get("q");
        const company = searchParams.get("company");

        if (!query || !company) {
            return NextResponse.json(
                { error: "query (q) and idcompany are required" },
                { status: 400 }
            );
        }

        console.log(`🔍 Searching: query="${query}", company="${company}"`);

        // Debug: ดูว่ามีข้อมูลนี้ในระบบเลยไหม (ไม่ filter by company)
        const debugAll: any[] = await prisma.$queryRaw`
            SELECT id, "company", "itemcode", "itemName", "balance" 
            FROM "RCitemlist" 
            WHERE COALESCE("itemcode", '') ILIKE ${`%${query}%`}
            LIMIT 10
        `;
        console.log(`🔎 Debug (all companies): Found ${debugAll.length} items with itemcode like "${query}":`, debugAll);

        // Debug: ดูว่า company นี้มีสินค้าอะไรบ้าง
        const debugCompany: any[] = await prisma.$queryRaw`
            SELECT id, "company", "itemcode", "itemName", "balance" 
            FROM "RCitemlist" 
            WHERE "company" = ${company}
            LIMIT 5
        `;
        console.log(`🏪 Debug (company="${company}"): Sample products:`, debugCompany);

        // ใช้ raw SQL query สำหรับการค้นหาที่ยืดหยุ่น (หา itemcode ที่ตรงกับคำค้นก่อน)
        const searchPattern = `%${query}%`;

        // บาร์โค้ดสำรอง — สินค้าตัวเดียว/หน่วยเดียวมีหลายบาร์โค้ด
        // RCitemlist ไม่เคยเก็บบาร์โค้ดสำรอง (เก็บบาร์โค้ดหลักเสมอ) จึงต้องแปลง
        // บาร์โค้ดที่สแกน → รหัสสินค้า แล้วค้นด้วย itemcode แทน
        const aliasCodes = await productCodesMatchingAlias(company, query, "contains");

        const matchedItems: any[] = await prisma.$queryRaw`
            SELECT DISTINCT ON ("itemcode") id, "itemcode", "itemName", "Barcode", "unit", "newCost", "netCost", "qty", "totalcost", "discountbaht", "freebaht"
            FROM "RCitemlist"
            WHERE "company" = ${company}
              AND (
                COALESCE("Barcode", '') ILIKE ${searchPattern}
                OR COALESCE("itemcode", '') ILIKE ${searchPattern}
                OR COALESCE("itemName", '') ILIKE ${searchPattern}
                OR COALESCE("itemcode", '') = ANY(${aliasCodes}::text[])
              )
            ORDER BY "itemcode" ASC, "createDate" DESC
        `;

        console.log(`📦 Raw query found ${matchedItems.length} matching itemcodes`);

        // คำนวณ balance ต่อ lot ใหม่จาก transaction (สูตรเดียวกับหน้า "Lot สินค้า")
        // เพื่อไม่ให้ lot ที่ RCitemlist.balance ยังไม่ sync หายไปจากรายการ
        const availableProducts: any[] = [];

        // นโยบาย lot ของสินค้าแต่ละตัว (Datalist.requireLot) — หน้าโอนใช้ตัดสินใจว่า
        // ต้องให้ผู้ใช้เลือก lot เอง หรือให้ระบบปันส่วน lot ให้อัตโนมัติ
        const matchedCodes = matchedItems
            .map((item: any) => item.itemcode)
            .filter((code: any): code is string => !!code);
        const lotPolicyRows = matchedCodes.length > 0
            ? await prisma.datalist.findMany({
                where: { company, code: { in: matchedCodes } },
                select: { code: true, requireLot: true },
            })
            : [];
        const lotPolicyByCode = new Map(
            lotPolicyRows.map(row => [String(row.code), row.requireLot !== false])
        );

        for (const item of matchedItems) {
            const calculatedLots = await getLotsWithCalculatedBalance({
                company,
                itemcode: item.itemcode,
                barcode: item.Barcode,
            });

            // ยอดที่โอนได้ = min(balance ที่บันทึกจริง, ยอดคำนวณ) — ให้ตรงกับที่ปุ่มยืนยันโอนจะอนุญาตจริง
            const lotsInStock = calculatedLots
                .map(lot => ({ ...lot, balance: transferableLotQty(lot) }))
                .filter(lot => (lot.balance || 0) > 0);
            if (lotsInStock.length === 0) continue;

            const totalBalance = lotsInStock.reduce((sum, lot) => sum + (lot.balance || 0), 0);

            availableProducts.push({
                id: item.id,
                code: item.itemcode,
                ProductName: item.itemName,
                Barcode: item.Barcode,
                Unit: item.unit,
                // ทุนสุทธิหลังหักส่วนลด (src/lib/lotCost.ts) — สาขาปลายทางต้องรับต้นทุนที่จ่ายจริง
                CostActual: lotUnitCost(item),
                // สินค้าที่ไม่เจอใน Datalist (lot เก่า/รหัสถูกลบ) ให้ถือว่าต้องมี lot ไว้ก่อน
                requireLot: lotPolicyByCode.get(String(item.itemcode)) ?? true,
                lots: lotsInStock
                    .sort((a, b) => {
                        const da = a.dateExp ? new Date(a.dateExp).getTime() : 0;
                        const db = b.dateExp ? new Date(b.dateExp).getTime() : 0;
                        return da - db;
                    })
                    .map(lot => ({
                        id: lot.id,
                        lot: lot.lot,
                        dateExp: lot.dateExp,
                        balance: lot.balance,
                        newCost: lotUnitCost(lot)
                    })),
                totalBalance
            });
        }

        console.log(`✅ Final result: ${availableProducts.length} products with stock`);

        return NextResponse.json(availableProducts);
    } catch (error) {
        console.error("Error searching products:", error);
        return NextResponse.json(
            { error: "Failed to search products" },
            { status: 500 }
        );
    }
}
