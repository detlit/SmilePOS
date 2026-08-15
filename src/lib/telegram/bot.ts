// Telegram Bot client - fetch-based, no external dependency
// อ่าน config จาก data/telegram-config.json (ผ่าน UI) หรือ fallback เป็น .env
import { cfgBotToken, cfgBotUsername, cfgWebhookSecret, cfgPublicAppUrl } from './config';

const TG_API = 'https://api.telegram.org';

export function getBotToken(): string {
  return cfgBotToken();
}

export function getWebhookSecret(): string {
  return cfgWebhookSecret();
}

export function getBotUsername(): string {
  return cfgBotUsername();
}

async function callApi(method: string, body: any): Promise<any> {
  const token = getBotToken();
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not configured');

  const res = await fetch(`${TG_API}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description || 'unknown'}`);
  }
  return data.result;
}

export async function sendMessage(
  chatId: string,
  text: string,
  opts?: {
    parseMode?: 'Markdown' | 'HTML' | 'MarkdownV2';
    disableNotification?: boolean;
    replyMarkup?: any;
  }
) {
  return callApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: opts?.parseMode || 'Markdown',
    disable_notification: opts?.disableNotification || false,
    reply_markup: opts?.replyMarkup,
  });
}

export async function sendPhoto(
  chatId: string,
  photoUrl: string,
  opts?: {
    caption?: string;
    parseMode?: 'Markdown' | 'HTML' | 'MarkdownV2';
    disableNotification?: boolean;
    replyMarkup?: any;
  }
) {
  return callApi('sendPhoto', {
    chat_id: chatId,
    photo: photoUrl,
    caption: opts?.caption,
    parse_mode: opts?.parseMode || 'Markdown',
    disable_notification: opts?.disableNotification || false,
    reply_markup: opts?.replyMarkup,
  });
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  opts?: { text?: string; showAlert?: boolean }
) {
  return callApi('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text: opts?.text,
    show_alert: opts?.showAlert || false,
  });
}

export async function editMessageReplyMarkup(
  chatId: string,
  messageId: number,
  replyMarkup: any | null
) {
  return callApi('editMessageReplyMarkup', {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: replyMarkup,
  });
}

export function getPublicAppUrl(): string {
  return cfgPublicAppUrl();
}

export async function getMe() {
  return callApi('getMe', {});
}

export async function setWebhook(url: string, secretToken?: string) {
  return callApi('setWebhook', {
    url,
    secret_token: secretToken,
    allowed_updates: ['message', 'callback_query'],
  });
}

export async function deleteWebhook() {
  return callApi('deleteWebhook', { drop_pending_updates: false });
}

export async function getWebhookInfo() {
  return callApi('getWebhookInfo', {});
}

// Escape MarkdownV2 special chars (หากต้องใช้ MarkdownV2)
export function escapeMd(text: string): string {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}
