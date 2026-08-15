import type { ChannelAdapter, Platform } from '../types';
import { lineAdapter } from './line-adapter';
import { facebookAdapter } from './facebook-adapter';
import { tiktokAdapter } from './tiktok-adapter';

const adapters: Record<Platform, ChannelAdapter> = {
  LINE: lineAdapter,
  FACEBOOK: facebookAdapter,
  TIKTOK: tiktokAdapter,
  WEB: lineAdapter, // Web uses direct socket, adapter is fallback
};

export function getAdapter(platform: Platform): ChannelAdapter {
  const adapter = adapters[platform];
  if (!adapter) throw new Error(`Unsupported platform: ${platform}`);
  return adapter;
}

export { lineAdapter, facebookAdapter, tiktokAdapter };
