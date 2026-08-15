// Telegram message formatters

export function fmtMoney(n: number | null | undefined): string {
  const v = Number(n || 0);
  return v.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return '-';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleString('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function fmtTime(d: Date | string | null | undefined): string {
  if (!d) return '-';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

export interface SaleMainData {
  id: number;
  createDate: Date | null;
  code_costomer?: string | null;
  companyall?: string | null;
  personall?: string | null;
  statussall?: string | null;
  totalall?: number | null;
  sumtotal?: number | null;
  discount?: number | null;
  pay?: string | null;
  cashAmount?: number | null;
  transferAmount?: number | null;
  taxInvoiceNo?: string | null;
  vatAmount?: number | null;
  sales?: Array<{
    name_product?: string | null;
    qty?: number | null;
    unit?: string | null;
    price?: number | null;
    total?: number | null;
    name_customer?: string | null;
    phone?: string | null;
  }>;
}

export function formatSaleCreated(sale: SaleMainData, opts?: { branchName?: string }): string {
  const lines: string[] = [];
  const billNo = sale.taxInvoiceNo || `#${sale.id}`;
  lines.push(`🛒 *ขายสำเร็จ* ${billNo}`);
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push(`💰 ยอดรวม: *฿${fmtMoney(sale.totalall)}*`);

  if (sale.discount && sale.discount > 0) {
    lines.push(`🏷️ ส่วนลด: ฿${fmtMoney(sale.discount)}`);
  }
  if (sale.vatAmount && sale.vatAmount > 0) {
    lines.push(`🧾 VAT: ฿${fmtMoney(sale.vatAmount)}`);
  }

  // Payment
  const payMethod = (sale.pay || '').toLowerCase();
  if (payMethod.includes('cash') || payMethod.includes('เงินสด')) {
    lines.push(`💵 ชำระ: เงินสด`);
    if (sale.cashAmount) lines.push(`   รับเงิน: ฿${fmtMoney(sale.cashAmount)}`);
    if (sale.cashAmount && sale.totalall && sale.cashAmount > sale.totalall) {
      lines.push(`   🪙 ทอน: ฿${fmtMoney(sale.cashAmount - sale.totalall)}`);
    }
  } else if (payMethod.includes('transfer') || payMethod.includes('โอน')) {
    lines.push(`💳 ชำระ: โอน ฿${fmtMoney(sale.transferAmount || sale.totalall)}`);
  } else if (payMethod) {
    lines.push(`💳 ชำระ: ${sale.pay}`);
  }

  // Items
  const items = sale.sales || [];
  if (items.length > 0) {
    lines.push('');
    lines.push(`📋 รายการ (${items.length} รายการ):`);
    const show = items.slice(0, 5);
    for (const it of show) {
      const nm = (it.name_product || '-').substring(0, 40);
      const qty = Number(it.qty || 0);
      const total = Number(it.total || 0);
      lines.push(`• ${nm} × ${qty} — ฿${fmtMoney(total)}`);
    }
    if (items.length > 5) {
      lines.push(`   _...และอีก ${items.length - 5} รายการ_`);
    }
  }

  // Customer
  const cust = items.find(i => i.name_customer)?.name_customer || '';
  const phone = items.find(i => i.phone)?.phone || '';
  if (cust || phone) {
    lines.push('');
    lines.push(`👤 ลูกค้า: ${cust || '-'}${phone ? ` (${phone})` : ''}`);
  }

  if (opts?.branchName) lines.push(`🏪 สาขา: ${opts.branchName}`);
  if (sale.personall) lines.push(`👨‍💼 พนักงาน: ${sale.personall}`);
  lines.push(`🕐 ${fmtDateTime(sale.createDate)}`);
  lines.push('━━━━━━━━━━━━━━━━━━');

  return lines.join('\n');
}

export function formatSaleCancelled(
  sale: SaleMainData,
  opts?: { reason?: string; cancelledBy?: string; branchName?: string }
): string {
  const lines: string[] = [];
  const billNo = sale.taxInvoiceNo || `#${sale.id}`;
  lines.push(`❌ *ยกเลิกบิล* ${billNo}`);
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push(`💰 ยอดที่ยกเลิก: *฿${fmtMoney(sale.totalall)}*`);
  if (opts?.reason) lines.push(`📝 เหตุผล: ${opts.reason}`);
  if (opts?.cancelledBy) lines.push(`👨‍💼 ยกเลิกโดย: ${opts.cancelledBy}`);
  else if (sale.personall) lines.push(`👨‍💼 พนักงาน: ${sale.personall}`);
  if (opts?.branchName) lines.push(`🏪 สาขา: ${opts.branchName}`);
  lines.push(`🕐 ยกเลิก: ${fmtDateTime(new Date())}`);
  if (sale.createDate) {
    const diffMin = Math.round((Date.now() - new Date(sale.createDate).getTime()) / 60000);
    if (diffMin < 60) lines.push(`⚠️ เดิมขายเมื่อ: ${fmtTime(sale.createDate)} (ผ่านไป ${diffMin} นาที)`);
    else lines.push(`⚠️ เดิมขายเมื่อ: ${fmtDateTime(sale.createDate)}`);
  }
  lines.push('━━━━━━━━━━━━━━━━━━');
  return lines.join('\n');
}

export interface HourlySummaryData {
  startHour: Date;
  endHour: Date;
  branchName?: string;
  netSales: number;
  billCount: number;
  cancelCount: number;
  cancelAmount: number;
  avgPerBill: number;
  byPayment: Record<string, { amount: number; count: number }>;
  topProducts: Array<{ name: string; qty: number; amount: number }>;
  prevHourSales?: number;
  prevWeekSales?: number;
}

export function formatHourlySummary(d: HourlySummaryData): string {
  const L: string[] = [];
  const hStart = d.startHour.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const hEnd = d.endHour.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const dateStr = d.startHour.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });

  L.push(`📊 *สรุปยอดขาย — ${hStart} ถึง ${hEnd}*`);
  if (d.branchName) L.push(`🏪 ${d.branchName} | ${dateStr}`);
  else L.push(`📅 ${dateStr}`);
  L.push('━━━━━━━━━━━━━━━━━━');

  L.push(`💰 ยอดขายสุทธิ: *฿${fmtMoney(d.netSales)}*`);
  L.push(`🧾 จำนวนบิล: ${d.billCount} บิล`);
  if (d.cancelCount > 0) L.push(`❌ ยกเลิก: ${d.cancelCount} บิล (฿${fmtMoney(d.cancelAmount)})`);
  L.push(`📈 เฉลี่ย/บิล: ฿${fmtMoney(d.avgPerBill)}`);

  const payEntries = Object.entries(d.byPayment).filter(([, v]) => v.count > 0);
  if (payEntries.length > 0) {
    L.push('');
    L.push(`💳 ช่องทางชำระ:`);
    for (const [method, v] of payEntries) {
      L.push(`• ${method}: ฿${fmtMoney(v.amount)} (${v.count} บิล)`);
    }
  }

  if (d.topProducts.length > 0) {
    L.push('');
    L.push(`🔝 Top สินค้า:`);
    d.topProducts.slice(0, 3).forEach((p, i) => {
      L.push(`${i + 1}. ${p.name.substring(0, 35)} — ${p.qty} ชิ้น (฿${fmtMoney(p.amount)})`);
    });
  }

  if (d.prevHourSales !== undefined && d.prevHourSales > 0) {
    const pct = ((d.netSales - d.prevHourSales) / d.prevHourSales) * 100;
    const arrow = pct >= 0 ? '▲' : '▼';
    L.push('');
    L.push(`📈 เทียบชั่วโมงก่อน: ${arrow} ${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`);
  }
  if (d.prevWeekSales !== undefined && d.prevWeekSales > 0) {
    const pct = ((d.netSales - d.prevWeekSales) / d.prevWeekSales) * 100;
    const arrow = pct >= 0 ? '▲' : '▼';
    L.push(`📉 เทียบสัปดาห์ก่อน: ${arrow} ${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`);
  }

  L.push('━━━━━━━━━━━━━━━━━━');
  return L.join('\n');
}

export interface DailySummaryData {
  date: Date;
  branchName?: string;
  totalSales: number;
  billCount: number;
  cancelCount: number;
  cancelAmount: number;
  netSales: number;
  bestHour?: { label: string; amount: number };
  topEmployee?: { name: string; bills: number };
}

export function formatDailySummary(d: DailySummaryData): string {
  const L: string[] = [];
  const dateStr = d.date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
  L.push(`🌙 *ปิดยอดประจำวัน*`);
  if (d.branchName) L.push(`🏪 ${d.branchName} | ${dateStr}`);
  else L.push(`📅 ${dateStr}`);
  L.push('');
  L.push(`💰 ยอดขายรวม: *฿${fmtMoney(d.totalSales)}*`);
  L.push(`🧾 บิลทั้งหมด: ${d.billCount} บิล`);
  if (d.cancelCount > 0) L.push(`❌ ยกเลิก: ${d.cancelCount} บิล (฿${fmtMoney(d.cancelAmount)})`);
  L.push(`✅ สุทธิ: ฿${fmtMoney(d.netSales)}`);
  if (d.bestHour) L.push(`\n📊 ชั่วโมงที่ขายดีที่สุด: ${d.bestHour.label} (฿${fmtMoney(d.bestHour.amount)})`);
  if (d.topEmployee) L.push(`🏆 พนักงานยอดเยี่ยม: ${d.topEmployee.name} (${d.topEmployee.bills} บิล)`);
  L.push('━━━━━━━━━━━━━━━━━━');
  L.push(`ขอบคุณที่ทำงานหนัก 💪`);
  return L.join('\n');
}

export interface WeeklyTopProductsData {
  weekStart: Date;
  weekEnd: Date;
  branchName?: string;
  totalSales: number;
  billCount: number;
  products: Array<{
    rank: number;
    name: string;
    qty: number;
    amount: number;
    share: number; // % ของยอดรวม
  }>;
}

export function formatWeeklyTopProducts(d: WeeklyTopProductsData): string {
  const L: string[] = [];
  const s = d.weekStart.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
  const e = new Date(d.weekEnd.getTime() - 1).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
  L.push(`🏆 *Top 10 สินค้าขายดีประจำสัปดาห์*`);
  if (d.branchName) L.push(`🏪 ${d.branchName}`);
  L.push(`📅 ${s} – ${e}`);
  L.push('━━━━━━━━━━━━━━━━━━');
  L.push(`💰 ยอดขายรวม: *฿${fmtMoney(d.totalSales)}*  (${d.billCount} บิล)`);
  L.push('');
  if (d.products.length === 0) {
    L.push('_ไม่มีข้อมูลการขายในช่วงนี้_');
  } else {
    const medals = ['🥇', '🥈', '🥉'];
    for (const p of d.products) {
      const icon = medals[p.rank - 1] || `${p.rank}.`;
      L.push(`${icon} ${p.name.substring(0, 35)}`);
      L.push(`     ${p.qty} ชิ้น · ฿${fmtMoney(p.amount)} · ${p.share.toFixed(1)}%`);
    }
  }
  L.push('━━━━━━━━━━━━━━━━━━');
  return L.join('\n');
}
