import { NextRequest } from 'next/server'
import { lotUnitCost } from '@/lib/lotCost'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const company = searchParam.get('company')
    const nextOrderDateStr = searchParam.get('nextOrderDate')

    if (!company || !nextOrderDateStr) {
        return Response.json({ error: "Missing company or nextOrderDate" }, { status: 400 })
    }

    const prisma = await getPrisma();
    const nextOrderDate = new Date(nextOrderDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Fetch sales for last 3 months to get daily averages
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    const sales = await prisma.sale.findMany({
        where: {
            company,
            statuss: "OK",
            createDate: {
                gte: threeMonthsAgo,
                lte: new Date(),
            },
        },
        select: {
            code_product: true,
            qty: true,
            createDate: true,
        }
    });

    // 2. Build map of daily averages: itemcode -> dayOfMonth(1-31) -> totalQty
    const dailyMap: Record<string, number[]> = {};
    sales.forEach(sale => {
        if (!sale.code_product || !sale.createDate) return;
        const day = new Date(sale.createDate).getDate();
        if (!dailyMap[sale.code_product]) {
            dailyMap[sale.code_product] = new Array(32).fill(0);
        }
        dailyMap[sale.code_product][day] += (Number(sale.qty) || 0);
    });

    // Convert total to average (divide by 3)
    Object.keys(dailyMap).forEach(code => {
        for (let i = 1; i <= 31; i++) {
            dailyMap[code][i] = dailyMap[code][i] / 3;
        }
    });

    // 3. Fetch RCitemlist for current balance and latest cost
    const items = await prisma.rCitemlist.findMany({
        where: { company },
        orderBy: { createDate: 'desc' }
    });

    // Deduplicate RCitemlist to get latest cost and total balance
    const itemMap: Record<string, any> = {};
    items.forEach(item => {
        if (!item.itemcode) return;
        if (!itemMap[item.itemcode]) {
            itemMap[item.itemcode] = {
                itemcode: item.itemcode,
                itemName: item.itemName,
                // ทุนที่ใช้ประเมินมูลค่าสั่งซื้อ = ทุนสุทธิหลังหักส่วนลด (src/lib/lotCost.ts)
                newCost: lotUnitCost(item),
                balance: 0
            };
        }
        itemMap[item.itemcode].balance += (Number(item.qty) || 0);
    });

    // 4. Calculate projection and suggested order
    const resultList = [];

    // Determine the range of days to sum
    const targetDays: number[] = [];
    let tempDate = new Date(today);
    while (tempDate <= nextOrderDate) {
        targetDays.push(tempDate.getDate());
        tempDate.setDate(tempDate.getDate() + 1);
        // Limit to 90 days to prevent infinite loops or excessive calculations
        if (targetDays.length > 90) break;
    }

    for (const code in itemMap) {
        const item = itemMap[code];
        const averages = dailyMap[code] || new Array(32).fill(0);

        let projectedSales = 0;
        targetDays.forEach(day => {
            projectedSales += averages[day];
        });

        const suggestedQty = Math.max(0, projectedSales - item.balance);
        const totalSuggestedCost = suggestedQty * item.newCost;

        if (suggestedQty > 0) {
            resultList.push({
                ...item,
                projectedSales: Number(projectedSales.toFixed(1)),
                suggestedQty: Math.ceil(suggestedQty),
                totalSuggestedCost: Number(totalSuggestedCost.toFixed(2))
            });
        }
    }

    // 5. Sort by cost desc and limited to 500
    const sortedResult = resultList
        .sort((a, b) => b.totalSuggestedCost - a.totalSuggestedCost)
        .slice(0, 500);

    return Response.json(sortedResult);
}
