'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function PermissionGuard({ codename, children }: { codename: string, children: React.ReactNode }) {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    const check = async () => {
      if (typeof window === 'undefined') return

      const userLevel = localStorage.getItem("level_") || ""

      // level2 (เจ้าของกิจการ) always has full access
      if (userLevel === "level2") {
        setAllowed(true)
        return
      }

      const companyS = localStorage.getItem("company_") || ""
      const personId = localStorage.getItem("personid_") || ""

      try {
        // Check per-employee override first (from localStorage cache)
        if (personId) {
          let empData: any[] = []
          const cached = localStorage.getItem("emp_permissions")
          if (cached) {
            try { empData = JSON.parse(cached) } catch { empData = [] }
          }
          // If no cache, fetch from API
          if (empData.length === 0 && cached === null) {
            try {
              const empRes = await axios.get(`/api/employee-permission?employeeId=${personId}`)
              empData = empRes.data
              localStorage.setItem("emp_permissions", JSON.stringify(empData))
            } catch { /* ignore */ }
          }
          const override = empData.find((p: any) => p.codename === codename)
          if (override) {
            setAllowed(override.allowed)
            return
          }
        }

        // Fallback to global level
        if (companyS) {
          const levelRes = await axios.get(`/api/level?company=${companyS}`)
          const found = levelRes.data.filter((a: any) => a.codename === codename)

          if (found.length === 0 || levelRes.data.length === 0) {
            setAllowed(true)
            return
          }

          if (userLevel === "level1") {
            setAllowed(found[0].level1 !== false)
            return
          }
        }

        setAllowed(true)
      } catch (error) {
        console.error(error)
        setAllowed(true) // allow on error to avoid lockout
      }
    }
    check()
  }, [codename])

  useEffect(() => {
    if (allowed === false) {
      router.replace('/web/dashboard')
    }
  }, [allowed, router])

  if (allowed === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Kanit' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border text-success" role="status" />
          <div style={{ marginTop: 10, color: '#6b7280' }}>กำลังตรวจสอบสิทธิ์...</div>
        </div>
      </div>
    )
  }

  if (allowed === false) return null

  return <>{children}</>
}
