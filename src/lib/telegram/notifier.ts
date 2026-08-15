import prisma from '@/lib/prisma';
import { sendMessage, sendPhoto, getPublicAppUrl } from './bot';
import { formatSaleCreated, formatSaleCancelled, type SaleMainData } from './formatters';

// ตรวจว่าอยู่ในช่วงเวลาเงียบหรือไม่ (HH:MM format)
function isQuietHour(quietStart: string, quietEnd: string, now = new Date()): boolean {
  if (!quietStart || !quietEnd) return false;
  const [sH, sM] = quietStart.split(':').map(Number);
  const [eH, eM] = quietEnd.split(':').map(Number);
  if (Number.isNaN(sH) || Number.isNaN(eH)) return false;

  const cur = now.getHours() * 60 + now.getMinutes();
  const s = sH * 60 + (sM || 0);
  const e = eH * 60 + (eM || 0);
  if (s === e) return false;
  if (s < e) return cur >= s && cur < e;
  // ข้ามคืน เช่น 22:00–07:00
  return cur >= s || cur < e;
}

async function sendAndLog(
  bindingId: number,
  chatId: string,
  text: string,
  eventType: string,
  refType: string,
  refId: number | null,
  silent = false,
  replyMarkup?: any,
  photoUrl?: string,
) {
  let success = false;
  let error = '';
  try {
    if (photoUrl) {
      await sendPhoto(chatId, photoUrl, {
        caption: text,
        disableNotification: silent,
        replyMarkup,
      });
    } else {
      await sendMessage(chatId, text, {
        disableNotification: silent,
        replyMarkup,
      });
    }
    success = true;
  } catch (e: any) {
    error = e?.message || String(e);
    console.error('[Telegram notifier]', error);
  }
  try {
    await prisma.telegramNotifyLog.create({
      data: {
        bindingId,
        eventType,
        refType,
        refId,
        payload: text.substring(0, 2000),
        success,
        error: error.substring(0, 500),
      },
    });
  } catch {}
  return success;
}

// สร้าง inline keyboard สำหรับบิลขาย
function buildSaleKeyboard(saleMainId: number) {
  const base = getPublicAppUrl();
  const viewUrl = base ? `${base}/web/salehistory?open=${saleMainId}` : '';
  const row: any[] = [];
  if (viewUrl) row.push({ text: '📄 ดูบิล', url: viewUrl });
  row.push({ text: '❌ ยกเลิกบิล', callback_data: `cancel_sale:${saleMainId}` });
  return { inline_keyboard: [row] };
}

// สร้าง QR code image URL (ใช้บริการฟรี)
function buildQrUrl(text: string): string {
  if (!text) return '';
  const enc = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${enc}&margin=10`;
}

async function getActiveBindings(company: string, branchId: number | null) {
  const bs = await prisma.telegramBinding.findMany({
    where: {
      company,
      isActive: true,
      chatId: { not: '' },
      OR: [{ branchId: null }, { branchId: branchId || undefined }],
    },
  });
  return bs;
}

async function loadSaleWithItems(saleMainId: number): Promise<SaleMainData | null> {
  const row = await (prisma as any).saleMain.findUnique({
    where: { id: saleMainId },
    include: { sales: true },
  });
  if (!row) return null;
  return row as SaleMainData;
}

// แจ้งเมื่อมีบิลขายใหม่
export async function notifySaleCreated(saleMainId: number, branchId: number | null = null) {
  try {
    const sale = await loadSaleWithItems(saleMainId);
    if (!sale) return;
    if (!sale.companyall) return;

    const bindings = await getActiveBindings(sale.companyall, branchId);
    if (bindings.length === 0) return;

    const text = formatSaleCreated(sale);
    const keyboard = buildSaleKeyboard(saleMainId);
    const base = getPublicAppUrl();
    const qrTarget = base ? `${base}/web/salehistory?open=${saleMainId}` : '';
    const qrUrl = qrTarget ? buildQrUrl(qrTarget) : '';

    await Promise.all(
      bindings
        .filter(b => b.notifySale)
        .filter(b => !b.minAmount || (sale.totalall || 0) >= b.minAmount)
        .map(b => {
          const silent = isQuietHour(b.quietStart || '', b.quietEnd || '');
          return sendAndLog(
            b.id, b.chatId, text,
            'sale_created', 'saleMain', saleMainId,
            silent, keyboard, qrUrl || undefined,
          );
        })
    );
  } catch (e) {
    console.error('[notifySaleCreated]', e);
  }
}

// แจ้งเมื่อบิลถูกยกเลิก
export async function notifySaleCancelled(
  saleMainId: number,
  opts: { reason?: string; cancelledBy?: string; branchId?: number | null } = {}
) {
  try {
    const sale = await loadSaleWithItems(saleMainId);
    if (!sale) return;
    if (!sale.companyall) return;

    const bindings = await getActiveBindings(sale.companyall, opts.branchId ?? null);
    if (bindings.length === 0) return;

    const text = formatSaleCancelled(sale, {
      reason: opts.reason,
      cancelledBy: opts.cancelledBy,
    });
    await Promise.all(
      bindings
        .filter(b => b.notifyCancel)
        .map(b => {
          const silent = isQuietHour(b.quietStart || '', b.quietEnd || '');
          return sendAndLog(b.id, b.chatId, text, 'sale_cancelled', 'saleMain', saleMainId, silent);
        })
    );
  } catch (e) {
    console.error('[notifySaleCancelled]', e);
  }
}
