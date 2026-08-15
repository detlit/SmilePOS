import { NextRequest } from 'next/server'
import { saleStockQty } from '@/lib/stockBalance'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const company = searchParam.get('company')
    const codeProduct = searchParam.get('codeProduct')

    if (!company || !codeProduct) {
        return Response.json({ error: "Missing company or codeProduct" }, { status: 400 })
    }

    const prisma = await getPrisma();

    // Calculate date range: current month and previous month
    const now = new Date();
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const sales = await prisma.sale.findMany({
        where: {
            company,
            code_product: codeProduct,
            statuss: "OK",
            createDate: {
                gte: startOfPreviousMonth,
                lte: now,
            },
        },
        select: {
            createDate: true,
            qty: true,
            subqty: true,
        }
    });

    // Generate a map of all dates in the range
    const dailyMap: { [key: string]: number } = {};
    let current = new Date(startOfPreviousMonth);
    while (current <= now) {
        const dateString = current.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
        dailyMap[dateString] = 0;
        current.setDate(current.getDate() + 1);
    }

    // Populate with actual sales data
    sales.forEach((sale) => {
        if (sale.createDate) {
            const dateString = new Date(sale.createDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
            if (dailyMap[dateString] !== undefined) {
                // นับเป็นหน่วยสต็อก (subqty) ให้ตรงกับตารางวิเคราะห์และยอดคงเหลือ
                dailyMap[dateString] += saleStockQty(sale);
            }
        }
    });

    // Convert map to sorted array with labels
    const result = Object.keys(dailyMap).sort().map(dateStr => {
        const d = new Date(dateStr);
        return {
            date: dateStr,
            label: `${d.getDate()}/${d.getMonth() + 1}`,
            totalQty: dailyMap[dateStr]
        };
    });

    return Response.json(result);
}
