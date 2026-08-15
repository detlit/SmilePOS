// สะพานฝั่ง JS ไปยังปลั๊กอิน SmilePosTunnel (android/.../tunnel/TunnelPlugin.java)
//
// เรียกผ่าน window.Capacitor.Plugins ตรง ๆ ให้เหมือน SmilePosShell ใน src/lib/runtime/native.ts
// แทนการใช้ registerPlugin — โปรเจกต์นี้ไม่ได้ประกาศปลั๊กอินฝั่ง TS ไว้ที่ไหนเลย
// และการเรียกตรงทำให้ build ฝั่งเว็บไม่ต้องรู้จัก Capacitor เลยแม้แต่นิดเดียว

export type TunnelMode = "quick" | "token"

export type TunnelStatus = {
  /** APK นี้ฝังไบนารี cloudflared มาด้วยหรือไม่ */
  available: boolean
  installed: boolean
  running: boolean
  status: "running" | "stopped" | "not-installed" | string
  hostname: string
  hasToken: boolean
  /** "android" = tunnel รันอยู่ในแท็บเล็ตเครื่องนี้ (ฝั่งพีซีไม่มีฟิลด์นี้) */
  mode?: string
  tunnelMode?: TunnelMode
  port?: number
  serverRunning?: boolean
  /** หน้าเว็บในแอปพร้อมรับคำขอจากภายนอกแล้วหรือยัง */
  serverReady?: boolean
  exposeLan?: boolean
  binary?: string
  url?: string
  error?: string
}

export type TunnelLogs = {
  log: string
  hostname: string
}

type TunnelPluginApi = {
  status(): Promise<TunnelStatus>
  logs(): Promise<TunnelLogs>
  start(options: { mode: TunnelMode; token?: string; port?: number; exposeLan?: boolean }): Promise<TunnelStatus>
  stop(): Promise<TunnelStatus>
  forgetToken(): Promise<TunnelStatus>
  clearLog(): Promise<void>
  registerServer(options: { ready: boolean }): Promise<void>
  respondApi(options: { id: string; status: number; headers: Record<string, string>; body: string | null }): Promise<void>
  ensureNotificationPermission(): Promise<{ granted: boolean }>
}

function plugin(): TunnelPluginApi | null {
  if (typeof window === "undefined") return null
  const cap = (window as any).Capacitor
  if (!cap?.isNativePlatform?.()) return null
  return (cap.Plugins?.SmilePosTunnel as TunnelPluginApi) || null
}

/** true = แอปตัวนี้คุม tunnel ในเครื่องได้ (เป็น APK ที่มีปลั๊กอินอยู่) */
export function isTunnelPluginAvailable(): boolean {
  return plugin() !== null
}

export async function getTunnelStatus(): Promise<TunnelStatus | null> {
  const api = plugin()
  if (!api) return null
  return api.status()
}

export async function getTunnelLogs(): Promise<TunnelLogs | null> {
  const api = plugin()
  if (!api) return null
  return api.logs()
}

export async function startTunnel(options: {
  mode: TunnelMode
  token?: string
  port?: number
  exposeLan?: boolean
}): Promise<TunnelStatus> {
  const api = plugin()
  if (!api) throw new Error("เครื่องนี้ไม่รองรับการเปิด tunnel ในตัว")
  return api.start(options)
}

export async function stopTunnel(): Promise<TunnelStatus> {
  const api = plugin()
  if (!api) throw new Error("เครื่องนี้ไม่รองรับการเปิด tunnel ในตัว")
  return api.stop()
}

export async function forgetTunnelToken(): Promise<TunnelStatus> {
  const api = plugin()
  if (!api) throw new Error("เครื่องนี้ไม่รองรับการเปิด tunnel ในตัว")
  return api.forgetToken()
}

/** บอกฝั่ง native ว่า router ในเครื่องพร้อม/ไม่พร้อมรับคำขอจากภายนอกแล้ว */
export async function registerRemoteServer(ready: boolean): Promise<void> {
  const api = plugin()
  if (!api) return
  await api.registerServer({ ready })
}

export async function respondToRemoteRequest(
  id: string,
  status: number,
  headers: Record<string, string>,
  bodyBase64: string | null
): Promise<void> {
  const api = plugin()
  if (!api) return
  await api.respondApi({ id, status, headers, body: bodyBase64 })
}

/**
 * ขอสิทธิ์แจ้งเตือน (Android 13+)
 *
 * ตัว foreground service ทำงานได้แม้ไม่ได้รับสิทธิ์ แต่ผู้ใช้จะไม่เห็นแถบสถานะและไม่มีปุ่มหยุด
 * ซึ่งเป็นสภาพที่แย่กว่าไม่เปิดฟีเจอร์เลย — เครื่องเปิดให้เข้าจากภายนอกอยู่โดยไม่มีร่องรอยบอก
 */
export async function ensureTunnelNotificationPermission(): Promise<boolean> {
  const api = plugin()
  if (!api) return false
  try {
    const result = await api.ensureNotificationPermission()
    return Boolean(result?.granted)
  } catch {
    return false
  }
}
