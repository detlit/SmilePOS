import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { lineAdapter, verifyLineSignature, downloadLineContent } from '@/lib/chat/adapters/line-adapter';
import { processIncomingMessage } from '@/lib/chat/chat-service';

// POST /api/chat/webhook/line - Receive LINE messages
export async function POST(req: NextRequest) {
  console.log('[LINE Webhook] ===== Received POST request =====');
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-line-signature') || '';
    console.log('[LINE Webhook] Signature:', signature ? 'present' : 'MISSING');
    console.log('[LINE Webhook] Body length:', rawBody.length);

    // Find LINE channel to validate signature
    const body = JSON.parse(rawBody);
    const events = body.events || [];
    console.log('[LINE Webhook] Events count:', events.length);
    if (events.length === 0) {
      console.log('[LINE Webhook] Empty events (verification ping) - OK');
      return NextResponse.json({ ok: true });
    }

    // Log event types
    events.forEach((e: any, i: number) => {
      console.log(`[LINE Webhook] Event[${i}]: type=${e.type}, source=${e.source?.type}, userId=${e.source?.userId?.substring(0, 10)}...`);
    });

    // Find the channel by matching any active LINE channel
    const channels = await prisma.chatChannel.findMany({
      where: { platform: 'LINE', isActive: true },
    });
    console.log('[LINE Webhook] Active LINE channels found:', channels.length, channels.map(c => `id=${c.id} name=${c.channelName}`));

    if (channels.length === 0) {
      console.error('[LINE Webhook] No active LINE channels in database!');
      return NextResponse.json({ error: 'No LINE channels configured' }, { status: 404 });
    }

    let matchedChannel = null;
    for (const ch of channels) {
      if (ch.channelSecret && verifyLineSignature(rawBody, signature, ch.channelSecret)) {
        matchedChannel = ch;
        console.log('[LINE Webhook] Signature matched channel:', ch.id, ch.channelName);
        break;
      }
    }

    if (!matchedChannel) {
      console.error('[LINE Webhook] Invalid signature - no channel matched');
      console.error('[LINE Webhook] Channels checked:', channels.map(c => `id=${c.id} hasSecret=${!!c.channelSecret}`));
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse and process messages
    const normalizedMessages = lineAdapter.parseIncoming(body);
    console.log('[LINE Webhook] Normalized messages:', normalizedMessages.length);
    for (const msg of normalizedMessages) {
      console.log(`[LINE Webhook] Processing: type=${msg.messageType}, from=${msg.platformUserId?.substring(0, 10)}..., content=${msg.content?.substring(0, 50)}`);

      // Download media content from LINE for image/video/audio/file
      if (['image', 'video', 'audio', 'file'].includes(msg.messageType) && msg.platformMessageId) {
        if (!msg.mediaUrl) {
          const localUrl = await downloadLineContent(
            msg.platformMessageId,
            matchedChannel.accessToken || '',
            msg.messageType,
          );
          if (localUrl) {
            msg.mediaUrl = localUrl;
            console.log(`[LINE Webhook] Downloaded media: ${msg.platformMessageId} → ${localUrl}`);
          }
        }
      }

      await processIncomingMessage(msg, matchedChannel.id);
    }

    console.log('[LINE Webhook] ===== All messages processed OK =====');
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[LINE Webhook] ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
