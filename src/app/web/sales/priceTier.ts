export const DEFAULT_PRICE_TIER = "หน้าร้าน";

export const PRICE_TIER_VALUES = [
  DEFAULT_PRICE_TIER,
  "ขายส่ง",
  "สมาชิก",
  "ราคา A",
  "ราคา B",
  "ราคา C",
  "ราคา D",
  "ราคา E",
  "ราคา F",
  "ราคา G",
  "ราคา H",
] as const;

export type PriceTier = typeof PRICE_TIER_VALUES[number];

export function normalizePriceTier(value: unknown): PriceTier {
  const tier = String(value ?? "").trim();
  return PRICE_TIER_VALUES.includes(tier as PriceTier) ? tier as PriceTier : DEFAULT_PRICE_TIER;
}