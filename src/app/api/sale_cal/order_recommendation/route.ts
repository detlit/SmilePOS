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
    const daysUntilNextOrder = Number(searchParam.get('daysToOrder') || 0)
    const beforeday = Number(searchParam.get('beforeday') || 3)  //คำนวณย้อนหลังกี่วัน

    if (!company) {
        return Response.json({ error: "Missing company" }, { status: 400 })
    }

    const prisma = await getPrisma();
    const today = new Date();
    const downavg = 0.5 //ต่ำกว่าค่าเฉลี่ย %
    const percentadd = 1.25 //  บวกเพิ่มจำนวนไปจนถึงวันสั่งครั้งถัดไป 1+กี่%

    today.setHours(0, 0, 0, 0);

    // 1. Fetch sales for last 5 days for recommendation logic (Daily Average)
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(today.getDate() - beforeday);

    const salesLast5Days = await prisma.sale.findMany({
        where: {
            company,
            statuss: "OK",
            createDate: {
                gte: fiveDaysAgo,
                lte: new Date(),
            },
        },
        select: {
            code_product: true,
            qty: true,
        }
    });

    const fiveDayStats: Record<string, number> = {};
    salesLast5Days.forEach(sale => {
        if (!sale.code_product) return;
        fiveDayStats[sale.code_product] = (fiveDayStats[sale.code_product] || 0) + (Number(sale.qty) || 0);
    });

    // 2. Fetch TOTAL Received Quantities (Sum RCitemlist) for absolute balance
    const totalReceived = await prisma.rCitemlist.groupBy({
        by: ['itemcode'],
        where: { company },
        _sum: { qty: true, freebaht: true }, // นับของแถม (freebaht) เป็นยอดรับเข้าด้วย
    });

    // 3. Fetch TOTAL Sales Quantities (Sum Sale) for absolute balance
    const totalSold = await prisma.sale.groupBy({
        by: ['code_product'],
        where: {
            company,
            statuss: "OK"
        },
        _sum: { qty: true },
    });

    // Create a map for total sold quantities
    const soldMap: Record<string, number> = {};
    totalSold.forEach(s => {
        if (s.code_product) soldMap[s.code_product] = s._sum.qty || 0;
    });

    // 5. Fetch items currently in "Pending" status in OrderDetail
    const db = prisma as any;
    const pendingItems = await db.orderDetail.findMany({
        where: {
            status: "Pending",
            orderMain: {
                company: company
            }
        },
        select: {
            itemcode: true
        }
    });
    const pendingCodes = new Set(pendingItems.map((pi: any) => pi.itemcode));

    // 4. Fetch latest info (name, cost) for each item
    const latestItems = await prisma.rCitemlist.findMany({
        where: { company },
        orderBy: { createDate: 'desc' },
        distinct: ['itemcode']
    });

    // 6. Build the item map with REAL balance calculation: Received - Sold
    const itemMap: Record<string, any> = {};
    totalReceived.forEach(rc => {
        if (!rc.itemcode || pendingCodes.has(rc.itemcode)) return;
        const latest = latestItems.find(i => i.itemcode === rc.itemcode);
        const soldQty = soldMap[rc.itemcode] || 0;

        itemMap[rc.itemcode] = {
            itemcode: rc.itemcode,
            itemName: latest?.itemName || rc.itemcode,
            // ทุนที่ใช้ประเมินมูลค่าสั่งซื้อ = ทุนสุทธิหลังหักส่วนลด (src/lib/lotCost.ts)
            newCost: lotUnitCost(latest),
            balance: (rc._sum.qty || 0) + (rc._sum.freebaht || 0) - soldQty
        };
    });

    // 6. Apply Recommendation Logic
    const results = [];
    for (const code in itemMap) {
        const item = itemMap[code];
        const fiveDayQty = fiveDayStats[code] || 0;
        const dailyAvg5Days = fiveDayQty / beforeday;
        const threshold = dailyAvg5Days * downavg;

        // Condition provided by user: balance < 50% of the 5-day daily average
        if (item.balance < threshold) {
            // Formula: (Avg * DaysUntilNextOrder) + 25%
            const baseNeed = dailyAvg5Days * daysUntilNextOrder;
            const suggestedQty = baseNeed * percentadd;

            if (suggestedQty > 0) {
                const totalSuggestedCost = Math.ceil(suggestedQty) * item.newCost;
                results.push({
                    ...item,
                    dailyAvg: Number(dailyAvg5Days.toFixed(2)),
                    priorityQty: fiveDayQty, // Sorting by 5-day volume
                    suggestedQty: Math.ceil(suggestedQty),
                    totalSuggestedCost: Number(totalSuggestedCost.toFixed(2))
                });
            }
        }
    }

    // 7. Sort by totalSuggestedCost (desc) and return
    const sortedResult = results.sort((a, b) => b.dailyAvg - a.dailyAvg).slice(0, 500);
    console.log(beforeday)
    return Response.json(sortedResult);
}
