import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendMessage, answerCallbackQuery, editMessageReplyMarkup, getWebhookSecret } from '@/lib/telegram/bot';
import { notifySaleCancelled } from '@/lib/telegram/notifier';
import { cfgPublicAppUrl } from '@/lib/telegram/config';

// POST /api/telegram/webhook
// รับ update จาก Telegram Bot API
export async function POST(req: NextRequest) {
  try {
    // ตรวจสอบ secret token (Telegram ใส่ header X-Telegram-Bot-Api-Secret-Token)
    const expectedSecret = getWebhookSecret();
    if (expectedSecret) {
      const gotSecret = req.headers.get('x-telegram-bot-api-secret-token') || '';
      if (gotSecret !== expectedSecret) {
        return NextResponse.json({ error: 'invalid secret' }, { status: 401 });
      }
    }

    const update = await req.json();
    console.log('[Telegram webhook] update:', JSON.stringify(update).substring(0, 300));

    // ─────────── Callback query (inline button click) ───────────
    const cb = update.callback_query;
    if (cb) {
      const data: string = cb.data || '';
      const chatId = String(cb.message?.chat?.id || '');
      const messageId: number = cb.message?.message_id;
      const fromName = [cb.from?.first_name, cb.from?.last_name].filter(Boolean).join(' ') || cb.from?.username || 'Unknown';

      // ต้องผูกกับ binding ในห้องนี้ก่อน
      const binding = await prisma.telegramBinding.findFirst({
        where: { chatId, isActive: true },
      });
      if (!binding) {
        await answerCallbackQuery(cb.id, { text: '⛔ ห้องนี้ไม่ได้ผูกกับระบบ', showAlert: true });
        return NextResponse.json({ ok: true });
      }

      // cancel_sale:<id>  → แสดงยืนยัน
      if (data.startsWith('cancel_sale:')) {
        const saleId = Number(data.split(':')[1]);
        const confirmKb = {
          inline_keyboard: [[
            { text: '✅ ยืนยันยกเลิก', callback_data: `confirm_cancel:${saleId}` },
            { text: '↩️ ไม่ยกเลิก', callback_data: `abort_cancel:${saleId}` },
          ]],
        };
        await editMessageReplyMarkup(chatId, messageId, confirmKb);
        await answerCallbackQuery(cb.id, { text: 'กรุณายืนยันการยกเลิก' });
        return NextResponse.json({ ok: true });
      }

      // abort_cancel → กลับปุ่มเดิม
      if (data.startsWith('abort_cancel:')) {
        const saleId = Number(data.split(':')[1]);
        const base = cfgPublicAppUrl();
        const row: any[] = [];
        if (base) row.push({ text: '📄 ดูบิล', url: `${base}/web/salehistory?open=${saleId}` });
        row.push({ text: '❌ ยกเลิกบิล', callback_data: `cancel_sale:${saleId}` });
        await editMessageReplyMarkup(chatId, messageId, { inline_keyboard: [row] });
        await answerCallbackQuery(cb.id, { text: 'ยกเลิกการดำเนินการ' });
        return NextResponse.json({ ok: true });
      }

      // confirm_cancel → ทำการยกเลิกจริง
      if (data.startsWith('confirm_cancel:')) {
        const saleId = Number(data.split(':')[1]);
        const existing = await (prisma as any).saleMain.findUnique({ where: { id: saleId } });
        if (!existing) {
          await answerCallbackQuery(cb.id, { text: '❌ ไม่พบบิลนี้', showAlert: true });
          return NextResponse.json({ ok: true });
        }
        if (existing.statussall && existing.statussall !== '') {
          await answerCallbackQuery(cb.id, { text: 'ℹ️ บิลนี้ถูกยกเลิกแล้ว', showAlert: true });
          await editMessageReplyMarkup(chatId, messageId, null);
          return NextResponse.json({ ok: true });
        }
        await (prisma as any).saleMain.update({
          where: { id: saleId },
          data: { statussall: `ยกเลิกผ่าน Telegram โดย ${fromName}` },
        });
        await editMessageReplyMarkup(chatId, messageId, null);
        await answerCallbackQuery(cb.id, { text: '✅ ยกเลิกบิลแล้ว' });
        // ยิง notify ไปทุก binding
        notifySaleCancelled(saleId, {
          reason: 'ยกเลิกจาก Telegram',
          cancelledBy: fromName,
        }).catch(() => {});
        return NextResponse.json({ ok: true });
      }

      await answerCallbackQuery(cb.id, { text: 'unknown action' });
      return NextResponse.json({ ok: true });
    }

    const message = update.message;
    if (!message) return NextResponse.json({ ok: true });

    const chat = message.chat;
    const chatId = String(chat.id);
    const text: string = (message.text || '').trim();

    // Handle /start <token>, /bind <token>
    const startMatch = text.match(/^\/(?:start|bind)(?:@\w+)?\s+(bind_[a-f0-9]+)/i);
    if (startMatch) {
      const token = startMatch[1];
      const binding = await prisma.telegramBinding.findUnique({ where: { bindToken: token } });

      if (!binding) {
        await sendMessage(chatId, '❌ ไม่พบ token นี้ในระบบ');
        return NextResponse.json({ ok: true });
      }
      if (binding.bindExpiresAt && binding.bindExpiresAt < new Date()) {
        await sendMessage(chatId, '❌ Token หมดอายุแล้ว — กรุณาสร้างใหม่ในหน้าตั้งค่า');
        return NextResponse.json({ ok: true });
      }
      if (binding.isActive && binding.chatId) {
        await sendMessage(chatId, 'ℹ️ Token นี้ถูกใช้ไปแล้ว');
        return NextResponse.json({ ok: true });
      }

      const chatTitle = chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || '';
      await prisma.telegramBinding.update({
        where: { id: binding.id },
        data: {
          chatId,
          chatTitle,
          chatType: chat.type || '',
          isActive: true,
          bindExpiresAt: null,
        },
      });

      await sendMessage(
        chatId,
        `✅ *ผูกการแจ้งเตือนสำเร็จ*\n\n` +
        `🏪 ร้าน: ${binding.company}\n` +
        (binding.branchId ? `📍 สาขา: ${binding.branchId}\n` : '') +
        `💬 ห้องนี้: ${chatTitle || chatId}\n\n` +
        `คุณจะเริ่มได้รับแจ้งเตือน:\n` +
        `• 🛒 เมื่อมีบิลขาย\n` +
        `• ❌ เมื่อมีการยกเลิกบิล\n` +
        `• 📊 สรุปยอดขายรายชั่วโมง\n` +
        `• 🌙 สรุปปิดวัน\n\n` +
        `ปรับแต่งได้ที่หน้าตั้งค่า`
      );
      return NextResponse.json({ ok: true });
    }

    // /help
    if (/^\/help(@\w+)?$/i.test(text)) {
      await sendMessage(chatId,
        '*คำสั่งที่ใช้ได้:*\n' +
        '• `/start <token>` — ผูกการแจ้งเตือน (แชทส่วนตัว)\n' +
        '• `/bind <token>` — ผูกในกลุ่ม\n' +
        '• `/status` — ดูสถานะการผูก\n' +
        '• `/unbind` — ยกเลิกการผูก'
      );
      return NextResponse.json({ ok: true });
    }

    // /status
    if (/^\/status(@\w+)?$/i.test(text)) {
      const b = await prisma.telegramBinding.findFirst({
        where: { chatId, isActive: true },
      });
      if (!b) {
        await sendMessage(chatId, 'ℹ️ ห้องนี้ยังไม่ได้ผูกกับร้านใด');
      } else {
        await sendMessage(chatId,
          `✅ *สถานะ*\n🏪 ${b.company}\n` +
          (b.branchId ? `📍 สาขา: ${b.branchId}\n` : '') +
          `🛒 Sale: ${b.notifySale ? '✓' : '✗'}  ❌ Cancel: ${b.notifyCancel ? '✓' : '✗'}\n` +
          `📊 Hourly: ${b.notifyHourly ? '✓' : '✗'}  🌙 Daily: ${b.notifyDaily ? '✓' : '✗'}`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // /unbind
    if (/^\/unbind(@\w+)?$/i.test(text)) {
      const result = await prisma.telegramBinding.updateMany({
        where: { chatId, isActive: true },
        data: { isActive: false },
      });
      await sendMessage(chatId, result.count > 0 ? '✅ ยกเลิกการผูกแล้ว' : 'ℹ️ ห้องนี้ไม่มีการผูกอยู่');
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Telegram webhook] ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
