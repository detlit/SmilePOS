import { NextRequest, NextResponse } from 'next/server';
import { setWebhook, deleteWebhook, getWebhookInfo, getMe, getWebhookSecret } from '@/lib/telegram/bot';

// GET /api/telegram/setup - ดู bot info + webhook info
export async function GET() {
  try {
    const [me, info] = await Promise.all([getMe(), getWebhookInfo()]);
    return NextResponse.json({ bot: me, webhook: info });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/telegram/setup  Body: { publicUrl: "https://xxx.ngrok-free.app" }
// ตั้งค่า webhook ให้ Telegram ส่ง update มาหาเรา
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const publicUrl = String(body.publicUrl || '').replace(/\/$/, '');
    if (!publicUrl.startsWith('https://')) {
      return NextResponse.json({ error: 'publicUrl must be https' }, { status: 400 });
    }

    const webhookUrl = `${publicUrl}/api/telegram/webhook`;
    const secret = getWebhookSecret() || undefined;
    const result = await setWebhook(webhookUrl, secret);

    return NextResponse.json({ ok: true, webhookUrl, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/telegram/setup — ลบ webhook
export async function DELETE() {
  try {
    await deleteWebhook();
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
