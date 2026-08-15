import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'node:crypto';
import { getBotUsername } from '@/lib/telegram/bot';
import { requireOwner } from '@/lib/telegram/auth';

// POST /api/telegram/bind/create
// Body: { company: string, branchId?: number }
// Returns: { token, deepLink, expiresAt }
export async function POST(req: NextRequest) {
  const g = requireOwner(req);
  if (!g.ok) return NextResponse.json(g.body, { status: g.status });
  try {
    const body = await req.json();
    const company = String(body.company || '').trim();
    const branchId = body.branchId ? Number(body.branchId) : null;

    if (!company) {
      return NextResponse.json({ error: 'company required' }, { status: 400 });
    }

    const token = 'bind_' + crypto.randomBytes(8).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 นาที

    const binding = await prisma.telegramBinding.create({
      data: {
        company,
        branchId,
        bindToken: token,
        bindExpiresAt: expiresAt,
        isActive: false,
      },
    });

    const botUsername = getBotUsername();
    const deepLink = botUsername
      ? `https://t.me/${botUsername}?start=${token}`
      : '';

    return NextResponse.json({
      id: binding.id,
      token,
      deepLink,
      botUsername,
      groupCommand: `/bind ${token}`,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('[Telegram bind/create]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
