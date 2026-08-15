import crypto from 'crypto';
import type { ChannelAdapter, ChannelConfig, NormalizedMessage, OutboundMessage } from '../types';

const TIKTOK_API = 'https://business-api.tiktok.com/open_api/v1.3';

export const tiktokAdapter: ChannelAdapter = {
  platform: 'TIKTOK',

  async validateWebhook(req: Request): Promise<boolean> {
    // TikTok uses signature verification on webhook
    const signature = req.headers.get('x-tiktok-signature');
    return !!signature;
  },

  parseIncoming(body: any): NormalizedMessage[] {
    // TikTok Business API message format
    const messages: NormalizedMessage[] = [];
    const events = body.data || [];

    for (const event of Array.isArray(events) ? events : [events]) {
      if (event.event_type !== 'receive_message') continue;

      const msg = event.content || {};
      let messageType: NormalizedMessage['messageType'] = 'text';
      let content = msg.text || '';
      let mediaUrl: string | undefined;

      if (msg.media_type === 'image') {
        messageType = 'image';
        mediaUrl = msg.media_url;
      } else if (msg.media_type === 'video') {
        messageType = 'video';
        mediaUrl = msg.media_url;
      }

      messages.push({
        platformMessageId: event.message_id || `tt_${Date.now()}`,
        platformUserId: event.sender?.user_id || event.open_id || '',
        platform: 'TIKTOK',
        senderType: 'customer',
        senderName: event.sender?.nickname || '',
        messageType,
        content,
        mediaUrl,
        timestamp: new Date(event.create_time ? event.create_time * 1000 : Date.now()),
        rawPayload: event,
      });
    }

    return messages;
  },

  async sendMessage(config: ChannelConfig, message: OutboundMessage) {
    const body: any = {
      open_id: message.platformUserId,
      message_type: message.messageType === 'text' ? 'text' : 'image',
    };

    if (message.messageType === 'text') {
      body.text = { text: message.content };
    } else if (message.mediaUrl) {
      body.image = { image_url: message.mediaUrl };
    }

    const res = await fetch(`${TIKTOK_API}/im/message/send/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': config.accessToken,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return { success: data.code === 0, messageId: data.data?.message_id || '' };
  },

  async getUserProfile(config: ChannelConfig, platformUserId: string) {
    const res = await fetch(
      `${TIKTOK_API}/user/info/?open_id=${platformUserId}`,
      {
        headers: { 'Access-Token': config.accessToken },
      }
    );

    if (!res.ok) return { displayName: 'TikTok User', avatarUrl: '' };

    const data = await res.json();
    const user = data.data?.user || {};
    return {
      displayName: user.display_name || user.nickname || 'TikTok User',
      avatarUrl: user.avatar_url || '',
    };
  },
};

export function verifyTiktokSignature(body: string, signature: string, secret: string): boolean {
  const hash = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return hash === signature;
}
