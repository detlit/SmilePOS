import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { facebookAdapter, verifyFacebookSignature } from '@/lib/chat/adapters/facebook-adapter';
import { processIncomingMessage } from '@/lib/chat/chat-service';

// GET /api/chat/webhook/facebook - Webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Match verify token against any active FB channel secret
  const channels = await prisma.chatChannel.findMany({
    where: { platform: 'FACEBOOK', isActive: true },
  });

  const validToken = channels.some(ch => ch.channelSecret === token);

  if (mode === 'subscribe' && validToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST /api/chat/webhook/facebook - Receive Facebook messages
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256') || '';
    const body = JSON.parse(rawBody);

    console.log('[FB Webhook] POST received, object:', body.object, 'entries:', body.entry?.length || 0);

    // Find matching Facebook channel
    const channels = await prisma.chatChannel.findMany({
      where: { platform: 'FACEBOOK', isActive: true },
    });

    console.log('[FB Webhook] Active channels:', channels.length, 'signature present:', !!signature);

    let matchedChannel = null;
    for (const ch of channels) {
      if (ch.channelSecret && verifyFacebookSignature(rawBody, signature, ch.channelSecret)) {
        matchedChannel = ch;
        break;
      }
    }

    if (!matchedChannel) {
      console.error('[FB Webhook] Invalid signature, channels checked:', channels.map(c => c.id));
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('[FB Webhook] Matched channel:', matchedChannel.id, matchedChannel.channelName);

    // Parse and process messages
    const normalizedMessages = facebookAdapter.parseIncoming(body);
    console.log('[FB Webhook] Parsed messages:', normalizedMessages.length);

    for (const msg of normalizedMessages) {
      const result = await processIncomingMessage(msg, matchedChannel.id);
      console.log('[FB Webhook] Processed msg:', msg.platformMessageId, 'conv:', result.conversation.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[FB Webhook] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
