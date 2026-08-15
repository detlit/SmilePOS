'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'

// Read cached data synchronously so the first render already has permissions
// (prevents the sidebar from flashing empty while /api/level is still fetching).
const readCache = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function usePermission() {
  const [levelData, setLevelData] = useState<any[]>(() => readCache<any[]>("level_data", []))
  const [empPermissions, setEmpPermissions] = useState<any[]>(() => readCache<any[]>("emp_permissions", []))
  // Only "loading" when we truly have nothing cached; otherwise render instantly and refresh in background.
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return !localStorage.getItem("level_data") && !localStorage.getItem("emp_permissions")
  })

  // HTML จาก server ไม่มีสิทธิ์ผู้ใช้ (อ่าน localStorage ไม่ได้) hasPermission จึงต้องคืน false
  // ในเรนเดอร์แรกของ client ด้วย ไม่งั้น React จะ hydrate ไม่ตรงกับ HTML ที่ server ส่งมา
  // (อาการ: "Hydration failed because the server rendered text didn't match the client")
  // พอ mount แล้วค่อยใช้ค่าจาก cache ทันที — ยังไม่ต้องรอ /api/level เหมือนเดิม
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    // AbortController + active flag: ยกเลิก request ที่ค้างเมื่อ unmount/HMR
    // เพื่อไม่ให้เกิด error "Request aborted" ค้างใน dev overlay และกัน setState หลัง unmount
    const controller = new AbortController()
    let active = true

    // การถูกยกเลิก (unmount/HMR/นำทางออก) ไม่ใช่ error จริง — ไม่ต้อง log ให้ overlay เด้ง
    const isAbortError = (e: any): boolean =>
      (typeof axios.isCancel === 'function' && axios.isCancel(e)) ||
      e?.code === 'ERR_CANCELED' ||
      e?.code === 'ECONNABORTED' ||
      e?.name === 'CanceledError' ||
      e?.name === 'AbortError' ||
      /aborted|canceled|cancelled/i.test(e?.message || '')

    const fetchAll = async () => {
      if (typeof window === 'undefined') return
      const companyS = localStorage.getItem("company_") || ""
      const personId = localStorage.getItem("personid_") || ""

      const tasks: Promise<any>[] = []

      // Fetch global level data (and cache it) — แต่ละ request มี catch ของตัวเอง
      // เพื่อไม่ให้ตัวหนึ่งล้ม/ถูกยกเลิกแล้วทำให้อีกตัวพังไปด้วย
      if (companyS) {
        tasks.push(
          axios.get(`/api/level?company=${companyS}`, { signal: controller.signal }).then((res) => {
            if (!active) return
            setLevelData(res.data || [])
            try { localStorage.setItem("level_data", JSON.stringify(res.data || [])) } catch {}
          }).catch((error) => { if (!isAbortError(error)) console.error(error) })
        )
      }

      // Fetch per-employee overrides (always refresh in background; cache is used for instant render)
      if (personId) {
        tasks.push(
          axios.get(`/api/employee-permission?employeeId=${personId}`, { signal: controller.signal }).then((res2) => {
            if (!active) return
            setEmpPermissions(res2.data || [])
            try { localStorage.setItem("emp_permissions", JSON.stringify(res2.data || [])) } catch {}
          }).catch((error) => { if (!isAbortError(error)) console.error(error) })
        )
      }

      // allSettled: ไม่ throw แม้ request ถูกยกเลิก
      await Promise.allSettled(tasks)
      if (active) setIsLoading(false)
    }
    fetchAll()

    return () => { active = false; controller.abort() }
  }, [])

  const hasPermission = (codename: string): boolean => {
    if (typeof window === 'undefined' || !mounted) return false
    // Don't block the UI while loading — fall through to the
    // "no config yet" path which allows access. Once the API resolves,
    // the real rules take over.

    const userLevel = localStorage.getItem("level_") || ""

    // level2 (เจ้าของกิจการ) always has full access
    if (userLevel === "level2") return true

    // Check per-employee override first
    const override = empPermissions.find((p: any) => p.codename === codename)
    if (override) return override.allowed

    // Fallback to global level
    if (levelData.length === 0) return true // no config = allow all

    const found = levelData.filter((a: any) => a.codename === codename)
    if (found.length === 0) return true // codename not in config = allow

    if (userLevel === "level1") return found[0].level1 !== false
    if (userLevel === "level3") return found[0].level3 !== false

    return true
  }

  return { levelData, empPermissions, hasPermission, isLoading }
}
