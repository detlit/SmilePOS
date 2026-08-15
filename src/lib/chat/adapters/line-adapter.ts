import crypto from 'crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { ChannelAdapter, ChannelConfig, NormalizedMessage, OutboundMessage } from '../types';

const LINE_API = 'https://api.line.me/v2';
const LINE_DATA_API = 'https://api-data.line.me/v2';

export const lineAdapter: ChannelAdapter = {
  platform: 'LINE',

  async validateWebhook(req: Request): Promise<boolean> {
    // LINE uses X-Line-Signature header with HMAC-SHA256
    const signature = req.headers.get('x-line-signature');
    if (!signature) return false;
    // Validation happens in the webhook route with channel secret
    return true;
  },

  parseIncoming(body: any): NormalizedMessage[] {
    const events = body.events || [];
    return events
      .filter((e: any) => ['message', 'follow', 'unfollow', 'postback', 'join', 'leave'].includes(e.type))
      .map((event: any) => {
        // Non-message events → system log
        if (event.type !== 'message') {
          let sysContent = '';
          switch (event.type) {
            case 'follow':   sysContent = '[ลูกค้าเพิ่มเพื่อน / Follow]'; break;
            case 'unfollow': sysContent = '[ลูกค้าบล็อก / Unfollow]'; break;
            case 'join':     sysContent = '[เข้าร่วมห้อง]'; break;
            case 'leave':    sysContent = '[ออกจากห้อง]'; break;
            case 'postback': sysContent = `[Postback] ${event.postback?.data || ''}`; break;
            default:         sysContent = `[${event.type}]`;
          }
          return {
            platformMessageId: `${event.type}_${event.timestamp}`,
            platformUserId: event.source?.userId || '',
            platform: 'LINE' as const,
            senderType: 'system' as const,
            senderName: '',
            messageType: 'text' as const,
            content: sysContent,
            mediaUrl: undefined,
            timestamp: new Date(event.timestamp),
            rawPayload: event,
          };
        }

        const msg = event.message;
        let messageType: NormalizedMessage['messageType'] = 'text';
        let content = '';
        let mediaUrl: string | undefined;

        switch (msg.type) {
          case 'text':
            messageType = 'text';
            content = msg.text;
            break;
          case 'image':
            messageType = 'image';
            mediaUrl = msg.contentProvider?.originalContentUrl || '';
            break;
          case 'video':
            messageType = 'video';
            mediaUrl = msg.contentProvider?.originalContentUrl || '';
            break;
          case 'audio':
            messageType = 'audio';
            mediaUrl = msg.contentProvider?.originalContentUrl || '';
            break;
          case 'sticker':
            messageType = 'sticker';
            content = `sticker:${msg.packageId}:${msg.stickerId}`;
            break;
          case 'location':
            messageType = 'location';
            content = JSON.stringify({ lat: msg.latitude, lng: msg.longitude, title: msg.title, address: msg.address });
            break;
          case 'file':
            messageType = 'file';
            content = msg.fileName;
            break;
          default:
            content = `[Unsupported: ${msg.type}]`;
        }

        return {
          platformMessageId: msg.id,
          platformUserId: event.source?.userId || '',
          platform: 'LINE' as const,
          senderType: 'customer' as const,
          senderName: '',
          messageType,
          content,
          mediaUrl,
          timestamp: new Date(event.timestamp),
          rawPayload: event,
        };
      });
  },

  async sendMessage(config: ChannelConfig, message: OutboundMessage) {
    const body: any = {
      to: message.platformUserId,
      messages: [],
    };

    switch (message.messageType) {
      case 'text':
        body.messages.push({ type: 'text', text: message.content });
        break;
      case 'image':
        body.messages.push({
          type: 'image',
          originalContentUrl: message.mediaUrl,
          previewImageUrl: message.mediaUrl,
        });
        break;
      case 'video':
        body.messages.push({
          type: 'video',
          originalContentUrl: message.mediaUrl,
          previewImageUrl: message.mediaUrl,
        });
        break;
      default:
        body.messages.push({ type: 'text', text: message.content });
    }

    if (message.quickReplies && message.quickReplies.length > 0) {
      body.messages[0].quickReply = {
        items: message.quickReplies.map(qr => ({
          type: 'action',
          action: { type: 'message', label: qr.label, text: qr.text },
        })),
      };
    }

    const res = await fetch(`${LINE_API}/bot/message/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    return { success: res.ok, messageId: '' };
  },

  async getUserProfile(config: ChannelConfig, platformUserId: string) {
    const res = await fetch(`${LINE_API}/bot/profile/${platformUserId}`, {
      headers: { Authorization: `Bearer ${config.accessToken}` },
    });

    if (!res.ok) return { displayName: 'LINE User', avatarUrl: '' };

    const data = await res.json();
    return {
      displayName: data.displayName || 'LINE User',
      avatarUrl: data.pictureUrl || '',
    };
  },
};

export function verifyLineSignature(body: string, signature: string, channelSecret: string): boolean {
  const hash = crypto.createHmac('sha256', channelSecret).update(body).digest('base64');
  return hash === signature;
}

// Download media content from LINE Content API and save locally
export async function downloadLineContent(
  messageId: string,
  accessToken: string,
  messageType: string,
): Promise<string> {
  try {
    const res = await fetch(`${LINE_DATA_API}/bot/message/${messageId}/content`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.error(`[LINE] Failed to download content for ${messageId}: ${res.status}`);
      return '';
    }

    const contentType = res.headers.get('content-type') || '';
    const arrayBuffer = await res.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Determine extension from content-type
    let ext = '.bin';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
    else if (contentType.includes('png')) ext = '.png';
    else if (contentType.includes('gif')) ext = '.gif';
    else if (contentType.includes('webp')) ext = '.webp';
    else if (contentType.includes('mp4')) ext = '.mp4';
    else if (contentType.includes('audio')) ext = '.m4a';
    else if (contentType.includes('pdf')) ext = '.pdf';

    // Determine subdirectory
    let subDir = 'chat-files';
    if (messageType === 'image') subDir = 'chat-images';
    else if (messageType === 'video') subDir = 'chat-images';
    else if (messageType === 'audio') subDir = 'chat-files';

    const fileName = `${crypto.randomUUID()}${ext}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', subDir);
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, fileName), buffer);

    const mediaUrl = `/uploads/${subDir}/${fileName}`;
    console.log(`[LINE] Downloaded content: ${messageId} → ${mediaUrl} (${contentType}, ${buffer.length} bytes)`);
    return mediaUrl;
  } catch (error) {
    console.error(`[LINE] Error downloading content ${messageId}:`, error);
    return '';
  }
}
