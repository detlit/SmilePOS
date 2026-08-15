import prisma from '@/lib/prisma';
import {
  formatHourlySummary, formatDailySummary, formatWeeklyTopProducts,
  type HourlySummaryData, type DailySummaryData, type WeeklyTopProductsData,
} from './formatters';
import { sendMessage } from './bot';

// =========================================================
// Build hourly summary for a given company in [start, end)
// =========================================================
export async function buildHourlySummary(
  company: string,
  startHour: Date,
  endHour: Date
): Promise<HourlySummaryData> {
  const allBills = await (prisma as any).saleMain.findMany({
    where: {
      companyall: company,
      createDate: { gte: startHour, lt: endHour },
    },
    include: { sales: true },
  });

  const activeBills = allBills.filter((b: any) => !b.statussall || b.statussall === '');
  const cancelBills = allBills.filter((b: any) => b.statussall && b.statussall !== '');

  const netSales = activeBills.reduce((s: number, b: any) => s + (b.totalall || 0), 0);
  const cancelAmount = cancelBills.reduce((s: number, b: any) => s + (b.totalall || 0), 0);
  const billCount = activeBills.length;
  const avgPerBill = billCount > 0 ? netSales / billCount : 0;

  // Payment methods
  const byPayment: Record<string, { amount: number; count: number }> = {};
  for (const b of activeBills) {
    let method = 'อื่นๆ';
    const pay = String(b.pay || '').toLowerCase();
    if (pay.includes('cash') || pay.includes('เงินสด')) method = 'เงินสด';
    else if (pay.includes('transfer') || pay.includes('โอน')) method = 'โอน';
    else if (pay.includes('qr')) method = 'QR Pay';
    else if (pay.includes('credit') || pay.includes('บัตร')) method = 'บัตรเครดิต';
    else if (b.pay) method = b.pay;
    if (!byPayment[method]) byPayment[method] = { amount: 0, count: 0 };
    byPayment[method].amount += b.totalall || 0;
    byPayment[method].count += 1;
  }

  // Top products
  const productMap: Record<string, { name: string; qty: number; amount: number }> = {};
  for (const b of activeBills) {
    for (const s of b.sales || []) {
      const k = s.code_product || s.name_product || 'unknown';
      if (!productMap[k]) productMap[k] = { name: s.name_product || '-', qty: 0, amount: 0 };
      productMap[k].qty += s.qty || 0;
      productMap[k].amount += s.total || 0;
    }
  }
  const topProducts = Object.values(productMap).sort((a, b) => b.amount - a.amount).slice(0, 5);

  // Compare vs previous hour
  const prevHourStart = new Date(startHour.getTime() - 60 * 60 * 1000);
  const prevHourEnd = startHour;
  const prevBills = await (prisma as any).saleMain.findMany({
    where: {
      companyall: company,
      createDate: { gte: prevHourStart, lt: prevHourEnd },
      OR: [{ statussall: '' }, { statussall: null }],
    },
    select: { totalall: true },
  });
  const prevHourSales = prevBills.reduce((s: number, b: any) => s + (b.totalall || 0), 0);

  // Compare vs same hour last week
  const weekAgoStart = new Date(startHour.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoEnd = new Date(endHour.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekBills = await (prisma as any).saleMain.findMany({
    where: {
      companyall: company,
      createDate: { gte: weekAgoStart, lt: weekAgoEnd },
      OR: [{ statussall: '' }, { statussall: null }],
    },
    select: { totalall: true },
  });
  const prevWeekSales = weekBills.reduce((s: number, b: any) => s + (b.totalall || 0), 0);

  return {
    startHour, endHour,
    netSales, billCount,
    cancelCount: cancelBills.length, cancelAmount,
    avgPerBill,
    byPayment,
    topProducts,
    prevHourSales: prevHourSales || undefined,
    prevWeekSales: prevWeekSales || undefined,
  };
}

export async function buildDailySummary(
  company: string,
  dayStart: Date,
  dayEnd: Date
): Promise<DailySummaryData> {
  const allBills = await (prisma as any).saleMain.findMany({
    where: {
      companyall: company,
      createDate: { gte: dayStart, lt: dayEnd },
    },
    include: { sales: true },
  });
  const active = allBills.filter((b: any) => !b.statussall || b.statussall === '');
  const cancels = allBills.filter((b: any) => b.statussall && b.statussall !== '');
  const totalSales = active.reduce((s: number, b: any) => s + (b.totalall || 0), 0);
  const cancelAmount = cancels.reduce((s: number, b: any) => s + (b.totalall || 0), 0);

  // Best hour
  const byHour: Record<string, number> = {};
  for (const b of active) {
    if (!b.createDate) continue;
    const h = new Date(b.createDate).getHours();
    const key = `${String(h).padStart(2, '0')}:00-${String(h + 1).padStart(2, '0')}:00`;
    byHour[key] = (byHour[key] || 0) + (b.totalall || 0);
  }
  const bestHour = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];

  // Top employee
  const byEmp: Record<string, number> = {};
  for (const b of active) {
    const e = b.personall || 'ไม่ระบุ';
    byEmp[e] = (byEmp[e] || 0) + 1;
  }
  const topEmp = Object.entries(byEmp).sort((a, b) => b[1] - a[1])[0];

  return {
    date: dayStart,
    totalSales,
    billCount: active.length,
    cancelCount: cancels.length,
    cancelAmount,
    netSales: totalSales,
    bestHour: bestHour ? { label: bestHour[0], amount: bestHour[1] } : undefined,
    topEmployee: topEmp ? { name: topEmp[0], bills: topEmp[1] } : undefined,
  };
}

// =========================================================
// Send summaries to all active bindings
// =========================================================

async function logSend(bindingId: number, eventType: string, text: string, ok: boolean, err = '') {
  try {
    await prisma.telegramNotifyLog.create({
      data: {
        bindingId, eventType, refType: '', refId: null,
        payload: text.substring(0, 2000),
        success: ok, error: err.substring(0, 500),
      },
    });
  } catch {}
}

/**
 * Run hourly summary for ALL active bindings.
 * เรียกตอนต้นชั่วโมง (xx:00) → สรุปชั่วโมงที่ผ่านมา (xx-1 ถึง xx)
 */
export async function runHourlySummaryForAll(now = new Date()) {
  // End = ต้นชั่วโมงปัจจุบัน, Start = ต้นชั่วโมงก่อนหน้า
  const endHour = new Date(now);
  endHour.setMinutes(0, 0, 0);
  const startHour = new Date(endHour.getTime() - 60 * 60 * 1000);

  const bindings = await prisma.telegramBinding.findMany({
    where: { isActive: true, notifyHourly: true, chatId: { not: '' } },
  });

  // group by company
  const byCompany = new Map<string, typeof bindings>();
  for (const b of bindings) {
    const list = byCompany.get(b.company) || [];
    list.push(b);
    byCompany.set(b.company, list);
  }

  for (const [company, group] of byCompany) {
    try {
      const data = await buildHourlySummary(company, startHour, endHour);
      // ไม่ส่งหากไม่มีบิลในชั่วโมงนั้น (ลด spam)
      if (data.billCount === 0 && data.cancelCount === 0) continue;

      const text = formatHourlySummary(data);
      for (const b of group) {
        try {
          await sendMessage(b.chatId, text);
          await logSend(b.id, 'summary_hourly', text, true);
        } catch (e: any) {
          await logSend(b.id, 'summary_hourly', text, false, e?.message || String(e));
        }
      }
    } catch (e) {
      console.error(`[hourly summary] company=${company}:`, e);
    }
  }
}

/**
 * Daily summary — เรียกตอนปิดวัน เช่น 22:00 ของวันนั้น
 */
export async function runDailySummaryForAll(now = new Date()) {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const bindings = await prisma.telegramBinding.findMany({
    where: { isActive: true, notifyDaily: true, chatId: { not: '' } },
  });
  const byCompany = new Map<string, typeof bindings>();
  for (const b of bindings) {
    const list = byCompany.get(b.company) || [];
    list.push(b);
    byCompany.set(b.company, list);
  }

  for (const [company, group] of byCompany) {
    try {
      const data = await buildDailySummary(company, dayStart, dayEnd);
      if (data.billCount === 0) continue;
      const text = formatDailySummary(data);
      for (const b of group) {
        try {
          await sendMessage(b.chatId, text);
          await logSend(b.id, 'summary_daily', text, true);
        } catch (e: any) {
          await logSend(b.id, 'summary_daily', text, false, e?.message || String(e));
        }
      }
    } catch (e) {
      console.error(`[daily summary] company=${company}:`, e);
    }
  }
}

// =========================================================
// Weekly Top 10 products
// =========================================================
export async function buildWeeklyTopProducts(
  company: string,
  weekStart: Date,
  weekEnd: Date
): Promise<WeeklyTopProductsData> {
  const bills = await (prisma as any).saleMain.findMany({
    where: {
      companyall: company,
      createDate: { gte: weekStart, lt: weekEnd },
      OR: [{ statussall: '' }, { statussall: null }],
    },
    include: { sales: true },
  });

  const totalSales = bills.reduce((s: number, b: any) => s + (b.totalall || 0), 0);
  const billCount = bills.length;

  const map: Record<string, { name: string; qty: number; amount: number }> = {};
  for (const b of bills) {
    for (const s of b.sales || []) {
      const k = s.code_product || s.name_product || 'unknown';
      if (!map[k]) map[k] = { name: s.name_product || '-', qty: 0, amount: 0 };
      map[k].qty += s.qty || 0;
      map[k].amount += s.total || 0;
    }
  }
  const sorted = Object.values(map).sort((a, b) => b.amount - a.amount).slice(0, 10);
  const products = sorted.map((p, i) => ({
    rank: i + 1,
    name: p.name,
    qty: p.qty,
    amount: p.amount,
    share: totalSales > 0 ? (p.amount / totalSales) * 100 : 0,
  }));

  return { weekStart, weekEnd, totalSales, billCount, products };
}

/**
 * Weekly top products — เรียกทุกวันจันทร์เช้า สรุปสัปดาห์ที่ผ่านมา (จ.-อา.)
 */
export async function runWeeklyTopForAll(now = new Date()) {
  // weekEnd = 00:00 ของวันนี้ (เช้าวันจันทร์) → weekStart = 7 วันก่อนหน้า (จันทร์ที่แล้ว)
  const weekEnd = new Date(now);
  weekEnd.setHours(0, 0, 0, 0);
  const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  const bindings = await prisma.telegramBinding.findMany({
    where: { isActive: true, notifyDaily: true, chatId: { not: '' } },
  });
  const byCompany = new Map<string, typeof bindings>();
  for (const b of bindings) {
    const list = byCompany.get(b.company) || [];
    list.push(b);
    byCompany.set(b.company, list);
  }

  for (const [company, group] of byCompany) {
    try {
      const data = await buildWeeklyTopProducts(company, weekStart, weekEnd);
      if (data.billCount === 0) continue;
      const text = formatWeeklyTopProducts(data);
      for (const b of group) {
        try {
          await sendMessage(b.chatId, text);
          await logSend(b.id, 'summary_weekly_top', text, true);
        } catch (e: any) {
          await logSend(b.id, 'summary_weekly_top', text, false, e?.message || String(e));
        }
      }
    } catch (e) {
      console.error(`[weekly top] company=${company}:`, e);
    }
  }
}
