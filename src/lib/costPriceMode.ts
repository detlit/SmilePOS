// Shared helper for the "latest vs average cost" toggle (ตั้งค่าราคาทุนล่าสุด/เฉลี่ย)
// - "latest": use the cost of the most recently received lot (default, current behaviour)
// - "average": use the simple average of every receive-lot newCost for the product

export type CostPriceMode = "latest" | "average"

export const COST_PRICE_MODE_KEY = "costPriceMode"
export const DEFAULT_COST_PRICE_MODE: CostPriceMode = "latest"

export function normalizeCostPriceMode(value: unknown): CostPriceMode {
  return String(value) === "average" ? "average" : "latest"
}

export function costPriceModeLabel(mode: CostPriceMode): string {
  return mode === "average" ? "ทุนเฉลี่ย" : "ทุนล่าสุด"
}

// Read the cached mode from localStorage (defaults to "latest").
export function getCachedCostPriceMode(): CostPriceMode {
  if (typeof window === "undefined") return DEFAULT_COST_PRICE_MODE
  try {
    return normalizeCostPriceMode(localStorage.getItem(COST_PRICE_MODE_KEY))
  } catch {
    return DEFAULT_COST_PRICE_MODE
  }
}

export function setCachedCostPriceMode(mode: CostPriceMode): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(COST_PRICE_MODE_KEY, normalizeCostPriceMode(mode))
  } catch {
    /* ignore */
  }
}

// Fetch the mode from the store setting API and cache it. Falls back to the cached
// value (then default) if the request fails.
export async function fetchCostPriceMode(company: string): Promise<CostPriceMode> {
  if (!company) return getCachedCostPriceMode()
  try {
    const res = await fetch(`/api/setting/store/store?company=${encodeURIComponent(company)}`)
    if (!res.ok) return getCachedCostPriceMode()
    const data = await res.json()
    const store = Array.isArray(data) ? data[0] : null
    const mode = normalizeCostPriceMode(store?.costPriceMode)
    setCachedCostPriceMode(mode)
    return mode
  } catch {
    return getCachedCostPriceMode()
  }
}

// Choose the effective unit cost given the mode and the two candidate values.
// Any non-positive candidate falls back to the other value, then to `fallback`.
export function pickCostByMode(
  mode: CostPriceMode,
  latestCost: number | null | undefined,
  averageCost: number | null | undefined,
  fallback = 0,
): number {
  const latest = Number(latestCost || 0)
  const average = Number(averageCost || 0)
  if (mode === "average") {
    if (average > 0) return average
    if (latest > 0) return latest
    return fallback
  }
  if (latest > 0) return latest
  if (average > 0) return average
  return fallback
}
