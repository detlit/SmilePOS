import crypto from 'crypto';
import type { ChannelAdapter, ChannelConfig, NormalizedMessage, OutboundMessage } from '../types';

const FB_API = 'https://graph.facebook.com/v19.0';

export const facebookAdapter: ChannelAdapter = {
  platform: 'FACEBOOK',

  async validateWebhook(req: Request): Promise<boolean> {
    const signature = req.headers.get('x-hub-signature-256');
    return !!signature;
  },

  parseIncoming(body: any): NormalizedMessage[] {
    const messages: NormalizedMessage[] = [];
    const entries = body.entry || [];

    for (const entry of entries) {
      const messagingEvents = entry.messaging || [];
      for (const event of messagingEvents) {
        if (!event.message) continue;

        const msg = event.message;
        let messageType: NormalizedMessage['messageType'] = 'text';
        let content = msg.text || '';
        let mediaUrl: string | undefined;

        if (msg.attachments && msg.attachments.length > 0) {
          const att = msg.attachments[0];
          switch (att.type) {
            case 'image':
              messageType = 'image';
              mediaUrl = att.payload?.url;
              break;
            case 'video':
              messageType = 'video';
              mediaUrl = att.payload?.url;
              break;
            case 'audio':
              messageType = 'audio';
              mediaUrl = att.payload?.url;
              break;
            case 'file':
              messageType = 'file';
              mediaUrl = att.payload?.url;
              break;
            case 'location':
              messageType = 'location';
              content = JSON.stringify(att.payload?.coordinates || {});
              break;
          }
        }

        messages.push({
          platformMessageId: msg.mid || '',
          platformUserId: event.sender?.id || '',
          platform: 'FACEBOOK',
          senderType: 'customer',
          senderName: '',
          messageType,
          content,
          mediaUrl,
          timestamp: new Date(event.timestamp || Date.now()),
          rawPayload: event,
        });
      }
    }

    return messages;
  },

  async sendMessage(config: ChannelConfig, message: OutboundMessage) {
    const body: any = {
      recipient: { id: message.platformUserId },
      message: {},
    };

    switch (message.messageType) {
      case 'text':
        body.message.text = message.content;
        break;
      case 'image':
        body.message.attachment = {
          type: 'image',
          payload: { url: message.mediaUrl, is_reusable: true },
        };
        break;
      case 'video':
        body.message.attachment = {
          type: 'video',
          payload: { url: message.mediaUrl, is_reusable: true },
        };
        break;
      case 'file':
        body.message.attachment = {
          type: 'file',
          payload: { url: message.mediaUrl, is_reusable: true },
        };
        break;
      default:
        body.message.text = message.content;
    }

    if (message.quickReplies && message.quickReplies.length > 0) {
      body.message.quick_replies = message.quickReplies.map(qr => ({
        content_type: 'text',
        title: qr.label,
        payload: qr.text,
      }));
    }

    const res = await fetch(`${FB_API}/me/messages?access_token=${config.accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[FB Send] Error:', res.status, JSON.stringify(data));
    }
    return { success: res.ok, messageId: data.message_id || '' };
  },

  async getUserProfile(config: ChannelConfig, platformUserId: string) {
    try {
      // Use page-scoped API to get user profile (requires pages_user_locale permission)
      const res = await fetch(
        `${FB_API}/${platformUserId}?fields=first_name,last_name,name,profile_pic&access_token=${config.accessToken}`
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('[FB Profile] Error:', res.status, JSON.stringify(errData));
        return { displayName: 'Facebook User', avatarUrl: '' };
      }

      const data = await res.json();
      const displayName = data.name || [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Facebook User';
      const avatarUrl = data.profile_pic || '';
      console.log('[FB Profile] Got:', displayName, avatarUrl ? '(has avatar)' : '(no avatar)');
      return { displayName, avatarUrl };
    } catch (err) {
      console.error('[FB Profile] Fetch error:', err);
      return { displayName: 'Facebook User', avatarUrl: '' };
    }
  },
};

export function verifyFacebookSignature(body: string, signature: string, appSecret: string): boolean {
  if (!signature || !appSecret) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(body).digest('hex');
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}
