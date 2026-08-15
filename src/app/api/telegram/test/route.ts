import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendMessage } from '@/lib/telegram/bot';
import { requireOwner } from '@/lib/telegram/auth';

// POST /api/telegram/test  Body: { id: bindingId }
export async function POST(req: NextRequest) {
  const g = requireOwner(req);
  if (!g.ok) return NextResponse.json(g.body, { status: g.status });
  try {
    const body = await req.json();
    const id = Number(body.id || 0);
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const b = await prisma.telegramBinding.findUnique({ where: { id } });
    if (!b || !b.isActive || !b.chatId) {
      return NextResponse.json({ error: 'binding not active' }, { status: 400 });
    }

    await sendMessage(
      b.chatId,
      `🔔 *ทดสอบการแจ้งเตือน*\n\n` +
      `🏪 ${b.company}\n` +
      (b.branchId ? `📍 สาขา: ${b.branchId}\n` : '') +
      `🕐 ${new Date().toLocaleString('th-TH')}\n\n` +
      `✅ ระบบทำงานปกติ`
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
