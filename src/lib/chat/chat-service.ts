import prisma from '@/lib/prisma';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { getAdapter } from './adapters';
import type { NormalizedMessage, OutboundMessage, Platform, ChannelConfig } from './types';

// Download remote avatar and save locally, returns local URL
async function downloadAvatar(remoteUrl: string): Promise<string> {
  if (!remoteUrl || remoteUrl.startsWith('/uploads/')) return remoteUrl;
  try {
    const res = await fetch(remoteUrl);
    if (!res.ok) return remoteUrl;
    const contentType = res.headers.get('content-type') || '';
    let ext = '.jpg';
    if (contentType.includes('png')) ext = '.png';
    else if (contentType.includes('gif')) ext = '.gif';
    else if (contentType.includes('webp')) ext = '.webp';
    const buffer = new Uint8Array(await res.arrayBuffer());
    if (buffer.length < 100) return remoteUrl; // too small, likely error
    const fileName = `avatar_${crypto.randomUUID()}${ext}`;
    const dir = path.join(process.cwd(), 'public', 'uploads', 'chat-images');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, fileName), buffer);
    const localUrl = `/uploads/chat-images/${fileName}`;
    console.log(`[Chat] Downloaded avatar: ${localUrl}`);
    return localUrl;
  } catch {
    return remoteUrl;
  }
}

// Process incoming message from any platform
export async function processIncomingMessage(normalizedMsg: NormalizedMessage, channelId: number) {
  // 1. Find or create contact
  let contact = await prisma.chatContact.findUnique({
    where: {
      channelId_platformUserId: {
        channelId,
        platformUserId: normalizedMsg.platformUserId,
      },
    },
  });

  const needsProfileUpdate = !contact || !contact.avatarUrl ||
    !contact.avatarUrl.startsWith('/uploads/') ||
    contact.displayName === 'Facebook User' || contact.displayName === 'LINE User' ||
    contact.displayName === '' || contact.displayName === 'ไม่ทราบชื่อ';

  if (!contact) {
    // Fetch profile from platform
    const channel = await prisma.chatChannel.findUnique({ where: { id: channelId } });
    let displayName = normalizedMsg.senderName || '';
    let avatarUrl = '';

    if (channel) {
      try {
        const adapter = getAdapter(channel.platform as Platform);
        const config: ChannelConfig = {
          platform: channel.platform as Platform,
          accessToken: channel.accessToken || '',
          channelSecret: channel.channelSecret || '',
          pageId: channel.pageId || '',
        };
        const profile = await adapter.getUserProfile(config, normalizedMsg.platformUserId);
        displayName = profile.displayName;
        avatarUrl = await downloadAvatar(profile.avatarUrl);
      } catch {
        // Use fallback name
      }
    }

    contact = await prisma.chatContact.create({
      data: {
        company: channel?.company || '',
        channelId,
        platformUserId: normalizedMsg.platformUserId,
        displayName,
        avatarUrl,
      },
    });
  } else if (needsProfileUpdate) {
    // Re-fetch profile if name/avatar is missing (e.g. token was expired before)
    try {
      const channel = await prisma.chatChannel.findUnique({ where: { id: channelId } });
      if (channel) {
        const adapter = getAdapter(channel.platform as Platform);
        const config: ChannelConfig = {
          platform: channel.platform as Platform,
          accessToken: channel.accessToken || '',
          channelSecret: channel.channelSecret || '',
          pageId: channel.pageId || '',
        };
        const profile = await adapter.getUserProfile(config, normalizedMsg.platformUserId);
        if (profile.displayName && profile.displayName !== 'Facebook User' && profile.displayName !== 'LINE User') {
          const localAvatar = await downloadAvatar(profile.avatarUrl);
          contact = await prisma.chatContact.update({
            where: { id: contact.id },
            data: {
              displayName: profile.displayName,
              avatarUrl: localAvatar || contact.avatarUrl || '',
            },
          });
          console.log(`[Chat] Updated profile for contact ${contact.id}: ${profile.displayName}`);
        }
      }
    } catch {
      // Ignore profile update errors
    }
  }

  // 2. Find open conversation or create new one
  let conversation = await prisma.chatConversation.findFirst({
    where: {
      contactId: contact.id,
      status: { in: ['open', 'pending'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!conversation) {
    conversation = await prisma.chatConversation.create({
      data: {
        company: contact.company,
        contactId: contact.id,
        status: 'open',
      },
    });
  }

  // 3. Store message
  const message = await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      senderType: normalizedMsg.senderType,
      senderName: contact.displayName || '',
      messageType: normalizedMsg.messageType,
      content: normalizedMsg.content,
      mediaUrl: normalizedMsg.mediaUrl || '',
      metadata: JSON.stringify({
        platformMessageId: normalizedMsg.platformMessageId,
        platform: normalizedMsg.platform,
      }),
    },
  });

  // 4. Update timestamps
  await prisma.chatConversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  await prisma.chatContact.update({
    where: { id: contact.id },
    data: { lastMessageAt: new Date() },
  });

  return { contact, conversation, message };
}

// Send message from agent to customer
export async function sendAgentMessage(
  conversationId: number,
  agentName: string,
  content: string,
  messageType: string = 'text',
  mediaUrl?: string,
  baseUrl?: string,
) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: {
      contact: {
        include: { channel: true },
      },
    },
  });

  if (!conversation) throw new Error('Conversation not found');

  const { contact } = conversation;
  const { channel } = contact;

  // 1. Store message in DB
  const message = await prisma.chatMessage.create({
    data: {
      conversationId,
      senderType: 'agent',
      senderName: agentName,
      messageType,
      content,
      mediaUrl: mediaUrl || '',
    },
  });

  // 2. Send via platform adapter
  if (channel.platform !== 'WEB') {
    const adapter = getAdapter(channel.platform as Platform);
    const config: ChannelConfig = {
      platform: channel.platform as Platform,
      accessToken: channel.accessToken || '',
      channelSecret: channel.channelSecret || '',
      pageId: channel.pageId || '',
    };

    // Resolve absolute media URL for external platforms
    let resolvedMediaUrl = mediaUrl;
    if (mediaUrl && mediaUrl.startsWith('/') && baseUrl) {
      resolvedMediaUrl = baseUrl + mediaUrl;
    }
    console.log('[Chat] Sending media - original:', mediaUrl, 'resolved:', resolvedMediaUrl, 'baseUrl:', baseUrl);

    const outbound: OutboundMessage = {
      platformUserId: contact.platformUserId,
      messageType: messageType as any,
      content,
      mediaUrl: resolvedMediaUrl,
    };

    const result = await adapter.sendMessage(config, outbound);
    if (!result.success) {
      console.error(`[Chat] Failed to send message via ${channel.platform}:`, result);
      throw new Error(`ส่งข้อความไปยัง ${channel.platform} ไม่สำเร็จ`);
    }
    console.log(`[Chat] Message sent via ${channel.platform}, messageId: ${result.messageId}`);
  }

  // 3. Update conversation timestamp
  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date(), status: 'open' },
  });

  return message;
}

// Get conversations list with latest message
export async function getConversations(company: string, status?: string, search?: string) {
  const where: any = { company };
  if (status && status !== 'all') where.status = status;

  const conversations = await prisma.chatConversation.findMany({
    where,
    include: {
      contact: {
        include: { channel: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  if (search) {
    const s = search.toLowerCase();
    return conversations.filter(c =>
      (c.contact.displayName || '').toLowerCase().includes(s) ||
      (c.messages[0]?.content || '').toLowerCase().includes(s)
    );
  }

  return conversations;
}

// Get messages for a conversation (ดึงข้อความใหม่สุด limit รายการ แล้วกลับลำดับเป็นเก่า→ใหม่)
export async function getMessages(conversationId: number, limit = 50, before?: number) {
  const where: any = { conversationId };
  if (before) where.id = { lt: before };

  const rows = await prisma.chatMessage.findMany({
    where,
    orderBy: { id: 'desc' },
    take: limit,
  });
  return rows.reverse();
}

// Mark messages as read
export async function markAsRead(conversationId: number) {
  return prisma.chatMessage.updateMany({
    where: { conversationId, isRead: false, senderType: 'customer' },
    data: { isRead: true, readAt: new Date() },
  });
}

// Get unread count
export async function getUnreadCount(company: string) {
  const conversations = await prisma.chatConversation.findMany({
    where: { company, status: { in: ['open', 'pending'] } },
    select: { id: true },
  });

  const count = await prisma.chatMessage.count({
    where: {
      conversationId: { in: conversations.map(c => c.id) },
      senderType: 'customer',
      isRead: false,
    },
  });

  return count;
}
