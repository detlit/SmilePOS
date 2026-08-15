// Unified message types for omnichannel chat

export type Platform = 'LINE' | 'FACEBOOK' | 'TIKTOK' | 'WEB';
export type SenderType = 'customer' | 'agent' | 'system';
export type MessageType = 'text' | 'image' | 'file' | 'video' | 'audio' | 'sticker' | 'location' | 'richcard';
export type ConversationStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type CallStatus = 'pending' | 'ringing' | 'active' | 'ended' | 'missed';

export interface NormalizedMessage {
  platformMessageId: string;
  platformUserId: string;
  platform: Platform;
  senderType: SenderType;
  senderName: string;
  messageType: MessageType;
  content: string;
  mediaUrl?: string;
  timestamp: Date;
  rawPayload?: any;
}

export interface OutboundMessage {
  platformUserId: string;
  messageType: MessageType;
  content: string;
  mediaUrl?: string;
  quickReplies?: { label: string; text: string }[];
}

export interface ChannelConfig {
  platform: Platform;
  accessToken: string;
  channelSecret: string;
  pageId?: string;
}

export interface ChannelAdapter {
  platform: Platform;
  validateWebhook(req: Request): Promise<boolean>;
  parseIncoming(body: any): NormalizedMessage[];
  sendMessage(config: ChannelConfig, message: OutboundMessage): Promise<{ success: boolean; messageId?: string }>;
  getUserProfile(config: ChannelConfig, platformUserId: string): Promise<{ displayName: string; avatarUrl: string }>;
}
