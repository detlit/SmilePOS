// เราเตอร์ที่ทำหน้าที่แทน Next.js server ตอนแอปรันอยู่ในเครื่อง
//
// UI เรียก /api/... เหมือนเดิมทุกประการ แต่แทนที่จะวิ่งออกไปหา server ในวง LAN
// ตัวนี้จะหา route handler ที่ถูก bundle ไว้ใน APK แล้วเรียกมันตรง ๆ ในหน่วยความจำ
// การจับคู่ path รองรับ dynamic segment แบบเดียวกับ App Router: [id], [...slug], [[...slug]]

import { NextRequest } from "./next-server-shim"

/** ตารางเส้นทาง — สร้างอัตโนมัติตอน build (ดู scripts/gen-api-registry.js) */
import { ROUTES, SERVER_ONLY_ROUTES } from "@mobile-api-registry"

type RouteModule = Record<string, ((req: any, ctx: any) => Promise<Response> | Response) | undefined>

type CompiledRoute = {
  pattern: string
  regex: RegExp
  paramNames: Array<{ name: string; catchAll: boolean }>
  /** ยิ่งเจาะจงยิ่งมาก่อน — /api/sale/summary ต้องชนะ /api/sale/[id] */
  score: number
  load: () => Promise<RouteModule>
}

let compiled: CompiledRoute[] | null = null

function compileRoutes(): CompiledRoute[] {
  if (compiled) return compiled

  const list: CompiledRoute[] = []

  for (const [pattern, load] of Object.entries(ROUTES as Record<string, () => Promise<RouteModule>>)) {
    const paramNames: Array<{ name: string; catchAll: boolean }> = []
    let score = 0
    let source = "^"

    for (const segment of pattern.split("/").filter(Boolean)) {
      const optionalCatchAll = segment.match(/^\[\[\.\.\.(\w+)\]\]$/)
      const catchAll = segment.match(/^\[\.\.\.(\w+)\]$/)
      const dynamic = segment.match(/^\[(\w+)\]$/)

      if (optionalCatchAll) {
        paramNames.push({ name: optionalCatchAll[1], catchAll: true })
        source += "(?:/(.*))?"
      } else if (catchAll) {
        paramNames.push({ name: catchAll[1], catchAll: true })
        source += "/(.+)"
        score += 1
      } else if (dynamic) {
        paramNames.push({ name: dynamic[1], catchAll: false })
        source += "/([^/]+)"
        score += 2
      } else {
        source += "/" + escapeRegex(segment)
        score += 10
      }
    }

    source += "/?$"
    list.push({ pattern, regex: new RegExp(source), paramNames, score, load })
  }

  list.sort((a, b) => b.score - a.score || b.pattern.length - a.pattern.length)
  compiled = list
  return list
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export type MatchedRoute = {
  route: CompiledRoute
  params: Record<string, string | string[]>
}

/** หา handler ที่ตรงกับ path — คืน null ถ้าไม่มี route ไหนรับ */
export function matchRoute(pathname: string): MatchedRoute | null {
  const clean = pathname.replace(/\/+$/, "") || "/"

  for (const route of compileRoutes()) {
    const m = clean.match(route.regex)
    if (!m) continue

    const params: Record<string, string | string[]> = {}
    route.paramNames.forEach((p, i) => {
      const raw = m[i + 1]
      if (raw === undefined) {
        if (p.catchAll) params[p.name] = []
        return
      }
      params[p.name] = p.catchAll
        ? raw.split("/").map(decodeURIComponent)
        : decodeURIComponent(raw)
    })

    return { route, params }
  }

  return null
}

/** true = path นี้มี handler อยู่ในเครื่อง (ตัวดักคำขอใช้ตัดสินว่าจะรับเองหรือปล่อยออกเน็ต) */
export function hasLocalRoute(pathname: string): boolean {
  return matchRoute(pathname) !== null
}

export type LocalRequestInit = {
  method?: string
  headers?: Record<string, string>
  body?: BodyInit | null
}

/**
 * เรียก route handler ในเครื่องแล้วคืน Response มาตรฐาน
 * ทุก error ถูกแปลงเป็น response 4xx/5xx เพื่อให้ UI ได้ข้อความที่อ่านรู้เรื่อง
 * แทนที่จะเป็น promise rejection ลอย ๆ ที่ตามต้นตอไม่ได้
 */
export async function dispatch(url: string, init: LocalRequestInit = {}): Promise<Response> {
  const absolute = new URL(url, getOrigin())
  const method = (init.method || "GET").toUpperCase()

  const matched = matchRoute(absolute.pathname)
  if (!matched) {
    // route ที่ตั้งใจไม่ฝังลงแอป — บอกสาเหตุให้ชัด ดีกว่าปล่อยเป็น 404 เปล่า ๆ
    const serverOnly = SERVER_ONLY_ROUTES[absolute.pathname]
    if (serverOnly) {
      return jsonError(
        501,
        `ฟังก์ชันนี้ใช้ได้เฉพาะบนเครื่องคอมพิวเตอร์ (ต้องใช้ ${serverOnly} ของฝั่ง server)`
      )
    }

    return jsonError(404, `ไม่พบ API ${absolute.pathname} ในเครื่อง`, {
      hint: "ยังไม่ได้พอร์ต route นี้ลงแอป — ดู docs/android-standalone.md",
    })
  }

  let mod: RouteModule
  try {
    mod = await matched.route.load()
  } catch (err) {
    return jsonError(500, `โหลด handler ของ ${matched.route.pattern} ไม่สำเร็จ`, {
      detail: describe(err),
    })
  }

  const handler = mod[method]
  if (typeof handler !== "function") {
    return jsonError(405, `${method} ไม่รองรับที่ ${absolute.pathname}`)
  }

  // GET/HEAD ห้ามมี body ไม่งั้น constructor ของ Request จะโยน error
  const hasBody = method !== "GET" && method !== "HEAD" && init.body != null

  const request = new NextRequest(absolute.toString(), {
    method,
    headers: init.headers,
    body: hasBody ? init.body : undefined,
  })

  try {
    // App Router รุ่นใหม่ส่ง params มาเป็น Promise — handler ทั้ง 57 ตัวในโปรเจกต์นี้ await อยู่แล้ว
    const result = await handler(request, { params: Promise.resolve(matched.params) })

    if (result instanceof Response) return result

    // handler ที่ลืม return — คืน 204 ดีกว่าปล่อยให้ฝั่งเรียกค้าง
    return new Response(null, { status: 204 })
  } catch (err) {
    console.error(`[local-api] ${method} ${absolute.pathname} ล้มเหลว:`, err)
    return jsonError(500, describe(err), { route: matched.route.pattern })
  }
}

function jsonError(status: number, message: string, extra?: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { "content-type": "application/json" },
  })
}

function describe(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

function getOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin
  return "http://localhost"
}

/** จำนวน route ที่ถูกฝังมาใน APK — ใช้ในหน้าตรวจสอบระบบ */
export function localRouteCount(): number {
  return compileRoutes().length
}

/** รายการ path ทั้งหมดที่รับได้ในเครื่อง — ใช้ตอน debug */
export function localRoutePatterns(): string[] {
  return compileRoutes().map((r) => r.pattern)
}
