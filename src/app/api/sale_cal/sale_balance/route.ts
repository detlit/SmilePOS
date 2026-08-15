import { NextRequest } from 'next/server'
import { buildRcItemLookupWhere, computeStockBalance, getProductBarcode, shouldUseItemcodeFallback } from '@/lib/stockBalance'
import { lotUnitCost } from '@/lib/lotCost'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}


export async function GET(request: NextRequest) {
    const searchParam=request.nextUrl.searchParams
    const company = searchParam.get('company') || ""
    const code_product = searchParam.get('code_product') || ""
    const idParam = searchParam.get('id')
    const sort = searchParam.get('sort') || 'desc'

    if (!company || !code_product) {
        return Response.json([{ balance: 0, cost: undefined }])
    }

    const prisma = await getPrisma();

    // ใช้ helper กลางเพื่อให้สูตรตรงกับ /api/stock-balance-summary
    // รองรับ id เพื่อแยกสินค้าในกรณี code ซ้ำกัน
    const productId = idParam ? Number(idParam) : null;
    const productBarcode = await getProductBarcode(company, code_product, productId);
    const breakdown = await computeStockBalance({
        company,
        itemcode: code_product,
        barcode: productBarcode,
        productId,
    });
    const useItemcodeFallback = await shouldUseItemcodeFallback(company, code_product, productBarcode);

    // ดึง cost ล่าสุดจาก RCitemlist (เพื่อ compatibility กับ caller เดิม)
    const latestRC = await prisma.rCitemlist.findFirst({
        where: buildRcItemLookupWhere(company, code_product, productBarcode, useItemcodeFallback),
        orderBy: { id: sort as any },
        select: { newCost: true, netCost: true, qty: true, totalcost: true, discountbaht: true, freebaht: true, itemcode: true }
    })

    const dd = [
        // ทุนสุทธิหลังหักส่วนลด (src/lib/lotCost.ts) — คงพฤติกรรมเดิมที่ไม่มีล็อต = ไม่ส่ง cost
        { balance: breakdown.calculatedBalance, cost: latestRC ? lotUnitCost(latestRC) : undefined }
    ]

    return Response.json(dd)
}
