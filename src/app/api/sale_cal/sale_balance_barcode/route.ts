import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams;
  const companiesStr = searchParam.get('companies') || '';
  const companies = companiesStr.split(',').filter(Boolean);

  if (companies.length === 0) {
    return Response.json([]);
  }

  const prisma = await getPrisma();

  const placeholders = companies.map((_, i) => `$${i + 1}`).join(',');

  // Aggregate RC qty by barcode using DB-level GROUP BY with LEFT JOIN for missing barcodes
  // ยอดรับเข้านับของแถม (freebaht) รวมกับ qty ด้วย (เฉพาะจำนวน ไม่กระทบต้นทุน)
  const rcQuery = `
    SELECT COALESCE(NULLIF(rc."Barcode", ''), dl."Barcode") as barcode, SUM(COALESCE(rc."qty", 0) + COALESCE(rc."freebaht", 0)) as total_qty
    FROM "RCitemlist" rc
    LEFT JOIN "Datalist" dl ON rc."company" = dl."company" AND rc."itemcode" = dl."code"
    WHERE rc."company" IN (${placeholders})
    GROUP BY COALESCE(NULLIF(rc."Barcode", ''), dl."Barcode")
    HAVING COALESCE(NULLIF(rc."Barcode", ''), dl."Barcode") IS NOT NULL
      AND COALESCE(NULLIF(rc."Barcode", ''), dl."Barcode") != ''
  `;

  // Aggregate Sale qty by barcode using DB-level GROUP BY with subqty fallback
  const saleQuery = `
    SELECT COALESCE(NULLIF(s."barcode", ''), dl."Barcode") as barcode,
      SUM(CASE WHEN s."subqty" IS NOT NULL AND s."subqty" != 0 THEN s."subqty" ELSE COALESCE(s."qty", 0) END) as total_qty
    FROM "Sale" s
    LEFT JOIN "Datalist" dl ON s."company" = dl."company" AND s."code_product" = dl."code"
    WHERE s."company" IN (${placeholders}) AND s."statuss" = 'OK'
    GROUP BY COALESCE(NULLIF(s."barcode", ''), dl."Barcode")
    HAVING COALESCE(NULLIF(s."barcode", ''), dl."Barcode") IS NOT NULL
      AND COALESCE(NULLIF(s."barcode", ''), dl."Barcode") != ''
  `;

  // StockTransaction: TRANSFER_OUT, TRANSFER_IN, ADJUST grouped by barcode (via Datalist join)
  const txPlaceholders = companies.map((_, i) => `$${i + 1}`).join(',');

  const transferOutQuery = `
    SELECT dl."Barcode" as barcode, SUM(ABS(COALESCE(st."quantity_change", 0))) as total_qty
    FROM "StockTransaction" st
    LEFT JOIN "Datalist" dl ON st."company" = dl."company" AND st."itemcode" = dl."code"
    WHERE st."company" IN (${txPlaceholders}) AND UPPER(st."transaction_type") = 'TRANSFER_OUT'
    GROUP BY dl."Barcode"
    HAVING dl."Barcode" IS NOT NULL AND dl."Barcode" != ''
  `;

  const transferInQuery = `
    SELECT dl."Barcode" as barcode, SUM(ABS(COALESCE(st."quantity_change", 0))) as total_qty
    FROM "StockTransaction" st
    LEFT JOIN "Datalist" dl ON st."company" = dl."company" AND st."itemcode" = dl."code"
    WHERE st."company" IN (${txPlaceholders}) AND UPPER(st."transaction_type") = 'TRANSFER_IN'
    GROUP BY dl."Barcode"
    HAVING dl."Barcode" IS NOT NULL AND dl."Barcode" != ''
  `;

  const adjustQuery = `
    SELECT dl."Barcode" as barcode, SUM(COALESCE(st."quantity_change", 0)) as total_qty
    FROM "StockTransaction" st
    LEFT JOIN "Datalist" dl ON st."company" = dl."company" AND st."itemcode" = dl."code"
    WHERE st."company" IN (${txPlaceholders}) AND UPPER(st."transaction_type") = 'ADJUST'
    GROUP BY dl."Barcode"
    HAVING dl."Barcode" IS NOT NULL AND dl."Barcode" != ''
  `;

  const [rcRows, saleRows, txOutRows, txInRows, txAdjRows] = await Promise.all([
    prisma.$queryRawUnsafe(rcQuery, ...companies) as Promise<{ barcode: string; total_qty: number }[]>,
    prisma.$queryRawUnsafe(saleQuery, ...companies) as Promise<{ barcode: string; total_qty: number }[]>,
    prisma.$queryRawUnsafe(transferOutQuery, ...companies) as Promise<{ barcode: string; total_qty: number }[]>,
    prisma.$queryRawUnsafe(transferInQuery, ...companies) as Promise<{ barcode: string; total_qty: number }[]>,
    prisma.$queryRawUnsafe(adjustQuery, ...companies) as Promise<{ barcode: string; total_qty: number }[]>,
  ]);

  // สูตรเดียวกับ stock-balance-summary: received - sale - transferOut + transferIn + adjust
  const balanceMap: Record<string, number> = {};
  rcRows.forEach((r: any) => { balanceMap[r.barcode] = Number(r.total_qty || 0); });
  saleRows.forEach((s: any) => { balanceMap[s.barcode] = (balanceMap[s.barcode] || 0) - Number(s.total_qty || 0); });
  txOutRows.forEach((t: any) => { balanceMap[t.barcode] = (balanceMap[t.barcode] || 0) - Number(t.total_qty || 0); });
  txInRows.forEach((t: any) => { balanceMap[t.barcode] = (balanceMap[t.barcode] || 0) + Number(t.total_qty || 0); });
  txAdjRows.forEach((t: any) => { balanceMap[t.barcode] = (balanceMap[t.barcode] || 0) + Number(t.total_qty || 0); });

  const result = Object.entries(balanceMap).map(([barcode, balance]) => ({ barcode, balance }));
  return Response.json(result);
}
