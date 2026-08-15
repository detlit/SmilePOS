// Telegram config storage — เก็บ token/username/secret ในไฟล์ JSON
// (ไม่ต้องแก้ .env เอง) อ่านจากไฟล์ก่อน fallback เป็น env
import fs from 'fs';
import path from 'path';

const CONFIG_DIR = path.join(process.cwd(), 'data');
const CONFIG_PATH = path.join(CONFIG_DIR, 'telegram-config.json');

export interface TelegramConfig {
  botToken?: string;
  botUsername?: string;
  webhookSecret?: string;
  publicAppUrl?: string;
  cronSecret?: string;
}

let cache: TelegramConfig | null = null;
let cacheAt = 0;
const TTL_MS = 5_000; // reload ทุก 5 วินาที

function readFile(): TelegramConfig {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return {};
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    console.error('[telegram config] read error:', e);
    return {};
  }
}

export function getConfig(): TelegramConfig {
  const now = Date.now();
  if (!cache || now - cacheAt > TTL_MS) {
    cache = readFile();
    cacheAt = now;
  }
  return cache;
}

export function setConfig(patch: Partial<TelegramConfig>): TelegramConfig {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  const cur = readFile();
  const next = { ...cur, ...patch };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2), 'utf8');
  cache = next;
  cacheAt = Date.now();
  return next;
}

// helpers ที่ fallback เป็น env
export function cfgBotToken(): string {
  return getConfig().botToken || process.env.TELEGRAM_BOT_TOKEN || '';
}
export function cfgBotUsername(): string {
  return getConfig().botUsername || process.env.TELEGRAM_BOT_USERNAME || '';
}
export function cfgWebhookSecret(): string {
  return getConfig().webhookSecret || process.env.TELEGRAM_WEBHOOK_SECRET || '';
}
export function cfgPublicAppUrl(): string {
  return (getConfig().publicAppUrl || process.env.TELEGRAM_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
}
export function cfgCronSecret(): string {
  return getConfig().cronSecret || process.env.TELEGRAM_CRON_SECRET || '';
}
