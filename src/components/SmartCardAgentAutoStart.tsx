"use client"
import { useEffect, useRef } from "react"

// กดเปิดโปรแกรม Smart Card Agent ครั้งเดียวในหน้าตั้งค่า แล้วระบบจะจดจำไว้
// คอมโพเนนต์นี้จะทำงานตอน layout โหลด: ถ้าผู้ใช้เปิดใช้งาน auto-start ไว้
// และยัง ping ที่ agent ไม่ได้ จะยิง POST /api/smartcard/start ให้ "เปิดตลอด" โดยอัตโนมัติ
export default function SmartCardAgentAutoStart() {
  const triedRef = useRef(false)

  useEffect(() => {
    if (triedRef.current) return
    triedRef.current = true

    if (typeof window === "undefined") return
    const enabled = localStorage.getItem("smartcard_autostart") === "true"
    if (!enabled) return

    const url = localStorage.getItem("smartcard_url") || "http://127.0.0.1:8182"

    const run = async () => {
      // ping ก่อน ถ้าเปิดอยู่แล้วไม่ต้องเริ่มซ้ำ
      try {
        const controller = new AbortController()
        const to = setTimeout(() => controller.abort(), 1200)
        const res = await fetch(`${url}/ping`, { signal: controller.signal }).catch(() => null)
        clearTimeout(to)
        if (res && res.ok) return
      } catch { /* ignore */ }

      try {
        const electronAPI = (window as any).electronAPI
        if (electronAPI?.startSmartcardAgent) {
          await electronAPI.startSmartcardAgent()
        } else {
          await fetch("/api/smartcard/start", { method: "POST" })
        }
      } catch { /* ignore */ }
    }

    // หน่วงเล็กน้อยให้ layout อื่นโหลดก่อน
    const t = setTimeout(run, 1500)
    return () => clearTimeout(t)
  }, [])

  return null
}
