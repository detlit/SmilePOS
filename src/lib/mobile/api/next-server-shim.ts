// แทนที่ `next/server` ตอน build โหมด mobile
//
// route handler เดิมเขียนด้วย NextRequest/NextResponse ซึ่งเป็นของฝั่ง server
// แต่ทั้งสองตัวเป็นแค่ส่วนขยายบาง ๆ ของ Request/Response มาตรฐาน ซึ่ง WebView ของ
// Android (Chromium) มีให้อยู่แล้ว จึงสร้างตัวแทนที่มี API เหมือนกันได้
// ผลคือไฟล์ใน src/app/api ถูกนำมา bundle ใส่ APK แล้วเรียกใช้ตรง ๆ ได้โดยไม่ต้องแก้โค้ด
//
// next.config.ts จะ alias "next/server" มาที่ไฟล์นี้เมื่อ BUILD_TARGET=mobile

/** Request ที่มี nextUrl เพิ่มมา — handler ส่วนใหญ่ในโปรเจกต์นี้อ่าน searchParams ผ่านตัวนี้ */
export class NextRequest extends Request {
  readonly nextUrl: URL

  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init)
    this.nextUrl = new URL(typeof input === "string" ? input : this.url)
  }

  /** ของจริงมี cookies ให้ด้วย — ในแอปนี้ไม่มี handler ไหนใช้ แต่ใส่ไว้กัน runtime error */
  get cookies() {
    const jar = new Map<string, string>()
    const raw = this.headers.get("cookie") || ""
    for (const part of raw.split(";")) {
      const [k, ...v] = part.trim().split("=")
      if (k) jar.set(k, v.join("="))
    }
    return {
      get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      has: (name: string) => jar.has(name),
      set: () => undefined,
      delete: () => undefined,
    }
  }
}

export class NextResponse extends Response {
  static json(body: unknown, init?: ResponseInit): NextResponse {
    // ใช้ JSON.stringify ตัวเดียวกับที่ server ใช้ ค่าที่ออกมาจึงหน้าตาเหมือนกันเป๊ะ
    // (สำคัญกับ Date ซึ่งต้องกลายเป็น ISO string ก่อนถึงมือ UI)
    const headers = new Headers(init?.headers)
    if (!headers.has("content-type")) headers.set("content-type", "application/json")

    return new NextResponse(JSON.stringify(body), { ...init, headers })
  }

  static redirect(url: string | URL, status = 307): NextResponse {
    return new NextResponse(null, { status, headers: { location: String(url) } })
  }

  static next(init?: ResponseInit): NextResponse {
    return new NextResponse(null, init)
  }

  static rewrite(url: string | URL): NextResponse {
    return new NextResponse(null, { headers: { "x-middleware-rewrite": String(url) } })
  }
}

/** ของจริงมีให้ import ด้วย — ประกาศไว้กัน handler ที่เผลอ import แล้วพังตอน build */
export type NextMiddleware = (request: NextRequest) => Response | Promise<Response>

export const userAgent = () => ({ isBot: false, ua: navigator?.userAgent || "" })
export const userAgentFromString = (ua: string) => ({ isBot: false, ua })

export default { NextRequest, NextResponse }
