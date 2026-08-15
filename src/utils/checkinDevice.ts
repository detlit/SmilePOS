// Utility สำหรับจัดการ Device ID ของคอมพิวเตอร์ที่ใช้ลงเวลา Check-in / Check-out
// Device ID จะถูกสร้างครั้งเดียวต่อเครื่อง (เก็บใน localStorage) เพื่อใช้ระบุเครื่องที่ได้รับอนุญาต

const DEVICE_ID_KEY = 'checkin_device_id'

const isElectron = () =>
  typeof navigator !== 'undefined' && /electron/i.test(navigator.userAgent || '')

const randomId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    /* noop */
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// คืนค่า Device ID ของเครื่องนี้ (สร้างใหม่ถ้ายังไม่มี)
export const getDeviceId = (): string => {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(DEVICE_ID_KEY) || ''
  if (!id) {
    const prefix = isElectron() ? 'app' : 'web'
    id = `${prefix}-${randomId()}`
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

// ประเภทเครื่อง (Web Browser / Desktop App)
export const getDeviceType = (): string => (isElectron() ? 'Desktop App' : 'Web Browser')
export const getDeviceTypeShort = (): string => (isElectron() ? 'App' : 'Web')
