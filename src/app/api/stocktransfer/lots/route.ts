import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lotUnitCost } from "@/lib/lotCost";

// GET: ดึงรายการ lot ที่มี stock ของสินค้า
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const itemcode = searchParams.get("itemcode");
        const company = searchParams.get("company");

        if (!itemcode || !company) {
            return NextResponse.json(
                { error: "itemcode and company are required" },
                { status: 400 }
            );
        }

        // ดึง lot ที่มี balance > 0 เรียงตามวันหมดอายุ (FEFO)
        const lots = await prisma.rCitemlist.findMany({
            where: {
                itemcode: itemcode,
                company: company,
                balance: {
                    gt: 0
                }
            },
            select: {
                id: true,
                itemcode: true,
                itemName: true,
                lot: true,
                dateExp: true,
                balance: true,
                newCost: true,
                netCost: true,
                qty: true,
                totalcost: true,
                discountbaht: true,
                freebaht: true,
                Barcode: true,
                unit: true
            },
            orderBy: {
                dateExp: "asc" // FEFO: First Expiry First Out
            }
        });

        // newCost ที่ส่งออกไปคือ "ทุนสุทธิหลังหักส่วนลด" (src/lib/lotCost.ts)
        // ทับค่าในฟิลด์เดิมเพื่อให้หน้าโอนที่อ่าน newCost อยู่แล้วได้ต้นทุนที่จ่ายจริงโดยไม่ต้องแก้หน้าจอ
        return NextResponse.json(lots.map(lot => ({ ...lot, newCost: lotUnitCost(lot) })));
    } catch (error) {
        console.error("Error fetching lots:", error);
        return NextResponse.json(
            { error: "Failed to fetch lots" },
            { status: 500 }
        );
    }
}
