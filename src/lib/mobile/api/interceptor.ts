// ดักคำขอ /api/** ของ UI แล้วส่งให้ handler ในเครื่องแทนการยิงออกเน็ต
//
// UI เรียก API ผ่าน axios ~1,200 จุด และ fetch อีก ~70 จุด ทั้งหมดใช้ path แบบ relative
// การดักที่ชั้นนี้ชั้นเดียวจึงครอบคลุมทุกหน้าโดยไม่ต้องแก้โค้ดหน้าจอสักบรรทัด
//
// สิ่งที่ "ไม่" ดัก: URL ที่ระบุ host เต็ม (เช่นเรียกข้ามสาขาผ่าน tunnel) — พวกนั้นต้องใช้เน็ตจริง
// จึงปล่อยให้วิ่งออกไปตามปกติ

import axios from "axios"
import { dispatch, hasLocalRoute } from "./router"

let installed = false

/** ติดตั้งตัวดัก — เรียกซ้ำได้ ปลอดภัย */
export function installLocalApi(): void {
  if (installed) return
  installed = true

  patchAxios()
  patchFetch()
}

/** path นี้ควรถูกจัดการในเครื่องหรือไม่ */
function shouldHandle(rawUrl: string): { handle: boolean; url: string } {
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost"
    const parsed = new URL(rawUrl, origin)

    // URL ที่ชี้ไปเครื่องอื่น (สาขาอื่น / tunnel) ต้องออกเน็ตจริง
    if (typeof window !== "undefined" && parsed.origin !== origin) {
      return { handle: false, url: rawUrl }
    }
    if (!parsed.pathname.startsWith("/api/")) return { handle: false, url: rawUrl }

    return { handle: hasLocalRoute(parsed.pathname), url: parsed.toString() }
  } catch {
    return { handle: false, url: rawUrl }
  }
}

// ------------------------------------------------------------------ axios

function patchAxios(): void {
  const previous = axios.defaults.adapter

  axios.defaults.adapter = async function localFirstAdapter(config: any) {
    const rawUrl = buildAxiosUrl(config)
    const { handle, url } = shouldHandle(rawUrl)

    if (!handle) return forwardToDefaultAdapter(previous, config)

    const response = await dispatch(url, {
      method: config.method,
      headers: normalizeHeaders(config.headers),
      body: serializeBody(config.data),
    })

    const data = await readBody(response, config.responseType)

    const axiosResponse = {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config,
      request: null,
    }

    const accept = config.validateStatus || ((s: number) => s >= 200 && s < 300)
    if (accept(response.status)) return axiosResponse

    // ทำให้ error หน้าตาเหมือนของจริง เพราะโค้ด UI อ่าน err.response.data กันทั้งโปรเจกต์
    throw new axios.AxiosError(
      `Request failed with status code ${response.status}`,
      response.status >= 500 ? axios.AxiosError.ERR_BAD_RESPONSE : axios.AxiosError.ERR_BAD_REQUEST,
      config,
      null,
      axiosResponse as any
    )
  } as any
}

function buildAxiosUrl(config: any): string {
  const base = config.baseURL || ""
  const url = config.url || ""
  const joined = base && !/^https?:\/\//i.test(url) ? `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}` : url

  // axios เติม params ให้ตอนยิงจริง — ต้องเติมเองเพราะเราไม่ได้ผ่านขั้นตอนนั้น
  if (!config.params) return joined

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(config.params)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) value.forEach((v) => search.append(key, String(v)))
    else search.append(key, String(value))
  }

  const query = search.toString()
  if (!query) return joined
  return joined + (joined.includes("?") ? "&" : "?") + query
}

async function forwardToDefaultAdapter(previous: unknown, config: any) {
  const getAdapter = (axios as any).getAdapter
  if (typeof getAdapter === "function") {
    return getAdapter(previous)(config)
  }
  if (typeof previous === "function") return (previous as any)(config)
  throw new Error("[local-api] หา adapter เดิมของ axios ไม่เจอ")
}

function normalizeHeaders(headers: any): Record<string, string> {
  const out: Record<string, string> = {}
  if (!headers) return out

  const source = typeof headers.toJSON === "function" ? headers.toJSON() : headers
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined || value === null) continue
    if (typeof value === "object") continue // axios เก็บ config ต่อ method ปนมาด้วย
    out[key] = String(value)
  }
  return out
}

function serializeBody(data: unknown): BodyInit | null {
  if (data === undefined || data === null) return null
  if (typeof data === "string") return data
  if (data instanceof FormData || data instanceof Blob || data instanceof ArrayBuffer) return data as BodyInit
  if (data instanceof URLSearchParams) return data
  return JSON.stringify(data)
}

async function readBody(response: Response, responseType?: string): Promise<unknown> {
  if (response.status === 204) return null

  if (responseType === "blob") return response.blob()
  if (responseType === "arraybuffer") return response.arrayBuffer()

  const text = await response.text()
  if (responseType === "text") return text
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

// ------------------------------------------------------------------ fetch

function patchFetch(): void {
  if (typeof window === "undefined") return

  const originalFetch = window.fetch.bind(window)

  window.fetch = async function patchedFetch(input: RequestInfo | URL, init?: RequestInit) {
    const rawUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
    const { handle, url } = shouldHandle(rawUrl)

    if (!handle) return originalFetch(input as any, init)

    // ถ้าเรียกมาด้วย Request object ต้องดึง method/headers/body ออกจากตัวมัน
    const source = input instanceof Request ? input : null
    const method = init?.method || source?.method || "GET"
    const headers = mergeHeaders(source?.headers, init?.headers)
    const body =
      init?.body ??
      (source && method !== "GET" && method !== "HEAD" ? await source.clone().text() : null)

    return dispatch(url, { method, headers, body })
  } as typeof window.fetch
}

function mergeHeaders(...sources: Array<HeadersInit | undefined>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const source of sources) {
    if (!source) continue
    new Headers(source).forEach((value, key) => {
      out[key] = value
    })
  }
  return out
}
