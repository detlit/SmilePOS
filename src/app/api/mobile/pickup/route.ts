import { NextRequest } from 'next/server'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

// GET - คำนวณค่าหยิบยาตาม person รายวัน
export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const company = searchParam.get('company')
    const createDate = searchParam.get('createDate') || '' // Format: YYYY-MM
    const person = searchParam.get('person') || ''

    if (!company) {
        return Response.json({ error: "Company is required" }, { status: 400 });
    }

    const prisma = await getPrisma();

    // Get date range for the month
    const d = new Date(createDate + "-31");
    const d1 = new Date(createDate + "-01");

    // Build where condition
    const whereCondition: any = {
        company,
        statuss: "OK",
        createDate: {
            lte: new Date(d),
            gte: new Date(d1),
        },
    };

    // Add person filter if provided
    if (person && person !== '') {
        whereCondition.person = person;
    }

    // Get all sales for the month
    const sales = await prisma.sale.findMany({
        where: whereCondition,
        orderBy: {
            createDate: 'asc',
        },
    });

    // Get incentive settings for pickup fee rate
    const incentiveSettings = await prisma.incentiveSetting.findFirst({
        where: { company: company }
    });

    const pickupFeeRate = (incentiveSettings?.pickupFeeRate || 0.5) / 100; // Convert from % to decimal

    // Generate dates for the month
    const dates: string[] = [];
    for (let i = 1; i <= 31; i++) {
        const dateStr = new Date(createDate + `-${String(i).padStart(2, '0')}`);
        if (dateStr.getMonth() === d1.getMonth()) {
            dates.push(dateStr.toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric' }));
        }
    }

    // Calculate daily data
    const dailyData = dates.map((date, index) => {
        const nextDate = dates[index + 1] || null;

        // Filter sales for this day
        const daySales = sales.filter((sale: any) => {
            if (!sale.createDate) return false;
            const saleDate = sale.createDate.toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
            if (nextDate) {
                return saleDate >= date && saleDate < nextDate;
            }
            return saleDate === date;
        });

        // Calculate totals
        const totalSales = daySales.reduce((acc: number, sale: any) => acc + Number(sale.total || 0), 0);
        const billCount = new Set(daySales.map((s: any) => s.id_salemain)).size;
        const salesPerBill = billCount > 0 ? totalSales / billCount : 0;
        const pickupFee = totalSales * pickupFeeRate;

        // Calculate profit percentage (using cost from sales)
        const totalCost = daySales.reduce((acc: number, sale: any) => acc + Number(sale.cost || 0) * Number(sale.qty || 0), 0);
        const profit = totalSales - totalCost;
        const profitPercent = totalSales > 0 ? (profit / totalSales) * 100 : 0;

        return {
            date: date,
            dateFormatted: new Date(createDate + `-${String(index + 1).padStart(2, '0')}`).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            billCount: billCount,
            totalSales: Math.round(totalSales),
            salesPerBill: Math.round(salesPerBill),
            pickupFee: Math.round(pickupFee),
            profitPercent: Math.round(profitPercent),
        };
    });

    // Calculate summary
    const totalMonthSales = dailyData.reduce((acc, day) => acc + day.totalSales, 0);
    const totalMonthBills = dailyData.reduce((acc, day) => acc + day.billCount, 0);
    const totalMonthPickupFee = dailyData.reduce((acc, day) => acc + day.pickupFee, 0);
    const workingDays = dailyData.filter(day => day.totalSales > 0).length;
    const avgDailySales = workingDays > 0 ? totalMonthSales / workingDays : 0;
    const avgBillsPerDay = workingDays > 0 ? totalMonthBills / workingDays : 0;

    // Calculate total profit
    const totalCost = sales.reduce((acc: number, sale: any) => acc + Number(sale.cost || 0) * Number(sale.qty || 0), 0);
    const totalProfit = totalMonthSales - totalCost;
    const totalProfitPercent = totalMonthSales > 0 ? (totalProfit / totalMonthSales) * 100 : 0;

    return Response.json({
        summary: {
            totalSales: Math.round(totalMonthSales),
            totalBills: totalMonthBills,
            totalPickupFee: Math.round(totalMonthPickupFee),
            workingDays: workingDays,
            avgDailySales: Math.round(avgDailySales),
            avgBillsPerDay: Math.round(avgBillsPerDay),
            profitPercent: Math.round(totalProfitPercent),
            pickupFeeRate: (incentiveSettings?.pickupFeeRate || 0.5),
        },
        daily: dailyData,
        person: person || 'all',
    });
}
