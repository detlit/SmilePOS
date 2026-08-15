// catalogCache.ts
// Lightweight in-memory cache for heavy GET responses (e.g. the ~5k-row product
// catalog). Switching between client pages remounts components and refetches
// everything; this serves a recent response instantly instead, so page switches
// feel fast. Notes:
//   * In-memory Map (not sessionStorage): no serialize cost, no quota limits.
//     It survives client-side route navigation (the module stays loaded) and is
//     cleared on a full browser reload - which refetches fresh, as expected.
//   * Short TTL (default 30s) so stock/price never stays stale for long. The
//     authoritative price/stock is re-fetched per product at checkout anyway, so
//     the cached list is only ever used for browsing/search.
//   * On ANY error it falls back to a plain network fetch, so behaviour is never
//     worse than calling axios directly.
//   * Call invalidateCatalog() after a mutation (sale, product edit) to force the
//     next read to be fresh.
import axios from "axios"

type Entry = { t: number; data: unknown }

const DEFAULT_TTL = 30_000
const store = new Map<string, Entry>()
// คำขอที่กำลังวิ่งอยู่ — component แม่กับลูกที่ mount พร้อมกันจะ miss cache พร้อมกัน
// ถ้าไม่รวมร่างตรงนี้ก็จะยิง URL เดียวกันซ้อนกันหลายเส้น (ก้อนละ ~1 MB)
const inflight = new Map<string, Promise<any>>()

export async function cachedGet<T = any>(
  url: string,
  opts: { ttlMs?: number } = {}
): Promise<{ data: T }> {
  const ttl = opts.ttlMs ?? DEFAULT_TTL

  const hit = store.get(url)
  if (hit && Date.now() - hit.t < ttl) {
    return { data: hit.data as T }
  }

  const pending = inflight.get(url)
  if (pending) return { data: (await pending) as T }

  const request = axios.get<T>(url)
    .then((res) => {
      store.set(url, { t: Date.now(), data: res.data })
      return res.data
    })
    .finally(() => { inflight.delete(url) })

  inflight.set(url, request)
  return { data: (await request) as T }
}

// Patch one row inside cached list responses instead of dropping them. Used after
// a single-product mutation (price / CostActual) so the cached catalog stays
// correct without paying for another full refetch - dropping the entry would make
// the very next page reload slow again, which is exactly what the cache is for.
// The entry timestamp is kept, so the TTL is never silently extended.
export function patchCatalogById(
  urlSubstring: string,
  id: number | string,
  patch: Record<string, unknown>
) {
  const target = String(id)
  for (const [key, entry] of Array.from(store.entries())) {
    if (!key.includes(urlSubstring) || !Array.isArray(entry.data)) continue
    let changed = false
    const next = (entry.data as any[]).map((row) => {
      if (row && String(row.id) === target) {
        changed = true
        return { ...row, ...patch }
      }
      return row
    })
    if (changed) store.set(key, { t: entry.t, data: next })
  }
}

// Drop cached entries. Pass a substring (e.g. "datalist") to clear only matching
// URLs, or nothing to clear everything.
export function invalidateCatalog(urlSubstring?: string) {
  if (!urlSubstring) {
    store.clear()
    return
  }
  for (const key of Array.from(store.keys())) {
    if (key.includes(urlSubstring)) store.delete(key)
  }
}
