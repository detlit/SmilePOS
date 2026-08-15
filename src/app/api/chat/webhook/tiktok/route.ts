import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { tiktokAdapter, verifyTiktokSignature } from '@/lib/chat/adapters/tiktok-adapter';
import { processIncomingMessage } from '@/lib/chat/chat-service';

// POST /api/chat/webhook/tiktok - Receive TikTok messages
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-tiktok-signature') || '';
    const body = JSON.parse(rawBody);

    // Find matching TikTok channel
    const channels = await prisma.chatChannel.findMany({
      where: { platform: 'TIKTOK', isActive: true },
    });

    let matchedChannel = null;
    for (const ch of channels) {
      if (ch.channelSecret && verifyTiktokSignature(rawBody, signature, ch.channelSecret)) {
        matchedChannel = ch;
        break;
      }
    }

    if (!matchedChannel) {
      console.error('TikTok webhook: Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse and process messages
    const normalizedMessages = tiktokAdapter.parseIncoming(body);
    for (const msg of normalizedMessages) {
      await processIncomingMessage(msg, matchedChannel.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('TikTok webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
