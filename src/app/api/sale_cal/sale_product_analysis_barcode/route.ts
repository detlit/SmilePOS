import { NextRequest } from 'next/server'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const companies = searchParam.get('companies') || ''
    const mainCompany = searchParam.get('mainCompany') || ''
    const startDate = searchParam.get('startDate') || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    const endDate = searchParam.get('endDate') || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })

    try {
        const start = startDate + "T00:00:00.000+07:00"
        const end = endDate + "T23:59:59.999+07:00"
        const companyList = companies.split(',').map(c => c.trim()).filter(Boolean)
        if (companyList.length === 0) return Response.json([])

        const prisma = await getPrisma();

        const placeholders = companyList.map((_, i) => `$${i + 1}`).join(',');
        const startIdx = companyList.length + 1;
        const endIdx = companyList.length + 2;

        // Aggregate sales by barcode at DB level using GROUP BY
        const query = `
            SELECT
                s."barcode",
                SUM(CASE WHEN s."subqty" IS NOT NULL AND s."subqty" != 0 THEN s."subqty" ELSE COALESCE(s."qty", 0) END) as qty,
                SUM(COALESCE(s."total", 0)) as revenue,
                SUM(COALESCE(s."cost", 0)) as cost
            FROM "Sale" s
            WHERE s."company" IN (${placeholders})
                AND s."statuss" = 'OK'
                AND s."createDate" >= $${startIdx}::timestamp
                AND s."createDate" <= $${endIdx}::timestamp
                AND s."barcode" IS NOT NULL AND s."barcode" != ''
            GROUP BY s."barcode"
        `;

        const rows: any[] = await prisma.$queryRawUnsafe(query, ...companyList, start, end);

        // Get product info (code, name) for each barcode, preferring main company
        const barcodes = rows.map((r: any) => r.barcode).filter(Boolean);
        let productInfoMap: Record<string, { code: string; name: string }> = {};

        if (barcodes.length > 0) {
            // First try main company datalist
            if (mainCompany) {
                const mainInfoQuery = `
                    SELECT "Barcode" as barcode, "code", "ProductName" as name
                    FROM "Datalist"
                    WHERE "company" = $1 AND "Barcode" IN (${barcodes.map((_, i) => `$${i + 2}`).join(',')})
                `;
                const mainInfoRows: any[] = await prisma.$queryRawUnsafe(mainInfoQuery, mainCompany, ...barcodes);
                mainInfoRows.forEach((r: any) => {
                    if (r.barcode) productInfoMap[r.barcode] = { code: r.code || '', name: r.name || '' };
                });
            }

            // Fill missing with any company datalist
            const missingBarcodes = barcodes.filter(bc => !productInfoMap[bc]);
            if (missingBarcodes.length > 0) {
                const fallbackQuery = `
                    SELECT DISTINCT ON ("Barcode") "Barcode" as barcode, "code", "ProductName" as name
                    FROM "Datalist"
                    WHERE "company" IN (${placeholders}) AND "Barcode" IN (${missingBarcodes.map((_, i) => `$${companyList.length + i + 1}`).join(',')})
                    ORDER BY "Barcode"
                `;
                const fallbackRows: any[] = await prisma.$queryRawUnsafe(fallbackQuery, ...companyList, ...missingBarcodes);
                fallbackRows.forEach((r: any) => {
                    if (r.barcode && !productInfoMap[r.barcode]) {
                        productInfoMap[r.barcode] = { code: r.code || '', name: r.name || '' };
                    }
                });
            }
        }

        const products = rows
            .map((r: any) => {
                const info = productInfoMap[r.barcode] || { code: '', name: '' };
                const revenue = Number(r.revenue || 0);
                const cost = Number(r.cost || 0);
                return {
                    rank: 0,
                    barcode: r.barcode,
                    code: info.code,
                    name: info.name,
                    qty: Math.round(Number(r.qty || 0)),
                    revenue: Math.round(revenue),
                    cost: Math.round(cost),
                    profit: Math.round(revenue - cost),
                    profitPercent: revenue > 0 ? Math.round(((revenue - cost) / revenue) * 1000) / 10 : 0,
                };
            })
            .sort((a, b) => b.revenue - a.revenue)
            .map((p, index) => ({ ...p, rank: index + 1 }))

        return Response.json(products)
    } catch (error) {
        console.error('Error in sale_product_analysis_barcode:', error)
        return Response.json({ error: 'Failed to fetch product analysis' }, { status: 500 })
    }
}
