import { NextRequest, NextResponse } from 'next/server';
import { getConfig, setConfig } from '@/lib/telegram/config';
import { getMe } from '@/lib/telegram/bot';
import { requireOwner } from '@/lib/telegram/auth';

// Mask token for display (show first 8 + last 4)
function maskToken(t?: string): string {
  if (!t) return '';
  if (t.length <= 12) return '***';
  return `${t.substring(0, 8)}...${t.substring(t.length - 4)}`;
}

export async function GET(req: NextRequest) {
  const g = requireOwner(req);
  if (!g.ok) return NextResponse.json(g.body, { status: g.status });
  const c = getConfig();
  return NextResponse.json({
    hasToken: !!c.botToken,
    tokenMasked: maskToken(c.botToken),
    botUsername: c.botUsername || '',
    hasWebhookSecret: !!c.webhookSecret,
    publicAppUrl: c.publicAppUrl || '',
    hasCronSecret: !!c.cronSecret,
    // ค่าจาก env (read-only)
    envBotUsername: process.env.TELEGRAM_BOT_USERNAME || '',
  });
}

export async function POST(req: NextRequest) {
  const g = requireOwner(req);
  if (!g.ok) return NextResponse.json(g.body, { status: g.status });
  try {
    const body = await req.json();
    const patch: any = {};
    if (typeof body.botToken === 'string' && body.botToken.trim()) patch.botToken = body.botToken.trim();
    if (typeof body.botUsername === 'string') patch.botUsername = body.botUsername.trim().replace(/^@/, '');
    if (typeof body.webhookSecret === 'string') patch.webhookSecret = body.webhookSecret.trim();
    if (typeof body.publicAppUrl === 'string') patch.publicAppUrl = body.publicAppUrl.trim();
    if (typeof body.cronSecret === 'string') patch.cronSecret = body.cronSecret.trim();

    setConfig(patch);

    // ทดสอบเรียก getMe เพื่อยืนยันว่า token ใช้ได้
    let botInfo: any = null;
    let testError: string | null = null;
    try {
      botInfo = await getMe();
    } catch (e: any) {
      testError = e?.message || String(e);
    }

    return NextResponse.json({
      ok: true,
      botInfo,
      testError,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const g = requireOwner(req);
  if (!g.ok) return NextResponse.json(g.body, { status: g.status });
  setConfig({ botToken: '', botUsername: '', webhookSecret: '', publicAppUrl: '', cronSecret: '' });
  return NextResponse.json({ ok: true });
}
