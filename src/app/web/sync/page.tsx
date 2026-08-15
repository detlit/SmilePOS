'use client'

import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import MenuTab_Small from "../componant/menutab_small.tsx"
import HeadTab from "../componant/headtab.jsx"
import { useRouter } from "next/navigation"
import { jwtDecode } from 'jwt-decode'
import { Toaster, toast } from "sonner"
import PermissionGuard from '@/components/PermissionGuard'
import { Banknote, Check, Gauge, ShieldCheck, Tags } from "lucide-react"
import { logAction } from "@/lib/logbook"

const SYNC_TYPE_GROUPS = [
  {
    group: "สินค้า", types: [
      { key: "datalist", label: "สินค้า", desc: "Datalist + UnitConversion + สินค้าน้ำเด็ก" },
      { key: "gift", label: "ค่าหยิบสินค้า", desc: "Gifts" },
    ]
  },
  {
    group: "ฉลากสินค้า", types: [
      { key: "labeldata", label: "ฉลากสินค้า", desc: "Labeldata + ข้อบ่งใช้/วิธีใช้/เวลา/เก็บ/หมายเหตุ" },
    ]
  },
  {
    group: "ข้อมูลพื้นฐาน", types: [
      { key: "getagory", label: "หมวดสินค้า", desc: "Getagory" },
      { key: "fixname", label: "ชื่อทางการ", desc: "Fixname" },
      { key: "group", label: "กลุ่มสินค้า", desc: "Group" },
      { key: "type", label: "ประเภท (ขย.)", desc: "Type" },
      { key: "unit", label: "หน่วยสินค้า", desc: "Unit" },
      { key: "area", label: "พื้นที่เก็บ", desc: "Area" },
    ]
  },
  {
    group: "อื่นๆ", types: [
      { key: "supplier", label: "ผู้ขาย", desc: "Supplier" },
      { key: "interaction", label: "Drug Interaction", desc: "Interaction" },
    ]
  },
]

const ALL_SYNC_KEYS = SYNC_TYPE_GROUPS.flatMap(g => g.types.map(t => t.key))

const CUSTOM_SYNC_TYPES = ["datalist", "gift", "labeldata"] as const

const CUSTOM_PRICE_FIELDS = [
  { key: "price", label: "ราคาขาย" },
  { key: "PriceA", label: "ราคา A" },
  { key: "PriceB", label: "ราคา B" },
  { key: "wholesaleprice", label: "ขายส่ง" },
  { key: "online", label: "ออนไลน์" },
] as const

type ProductSyncOptions = {
  preserveCostActual: boolean
  preservePrices: boolean
  preserveStockLimits: boolean
}

const DEFAULT_PRODUCT_SYNC_OPTIONS: ProductSyncOptions = {
  preserveCostActual: true,
  preservePrices: true,
  preserveStockLimits: true,
}

const PRODUCT_SYNC_OPTION_ITEMS: Array<{
  key: keyof ProductSyncOptions
  label: string
  desc: string
  Icon: typeof Banknote
}> = [
  {
    key: "preserveCostActual",
    label: "คงราคาทุน (CostActual)",
    desc: "ไม่อัปเดตราคาทุนของสินค้าที่สาขาปลายทางมีอยู่แล้ว",
    Icon: Banknote,
  },
  {
    key: "preservePrices",
    label: "คงราคาขาย (ปลีก / ส่ง / Online / A / B)",
    desc: "ไม่อัปเดตราคาขายทั้งใน Datalist และ UnitConversion ของสาขาปลายทาง",
    Icon: Tags,
  },
  {
    key: "preserveStockLimits",
    label: "คงจุดสั่งซื้อ (Min / Max / ROP)",
    desc: "ไม่อัปเดตจุดสั่งซื้อและสต็อกขั้นต่ำ-สูงสุดของสาขาปลายทาง",
    Icon: Gauge,
  },
]

const INTERVAL_OPTIONS = [
  { value: 30, label: "ทุก 30 นาที" },
  { value: 60, label: "ทุก 1 ชั่วโมง" },
  { value: 180, label: "ทุก 3 ชั่วโมง" },
  { value: 360, label: "ทุก 6 ชั่วโมง" },
  { value: 720, label: "ทุก 12 ชั่วโมง" },
  { value: 1440, label: "ทุกวัน (24 ชม.)" },
]

function SyncPageContent() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [company, setCompany] = useState("")
  const [userId, setUserId] = useState(0)

  // Connected branches
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])

  // Sync types
  const [selectedTypes, setSelectedTypes] = useState<string[]>([...ALL_SYNC_KEYS])

  // Sync state
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState("")
  const [syncResults, setSyncResults] = useState<any>(null)
  const [progressCurrent, setProgressCurrent] = useState(0)
  const [progressTotal, setProgressTotal] = useState(0)
  const [typeStatuses, setTypeStatuses] = useState<Record<string, { status: string; branch?: string; created?: number; updated?: number; error?: string }[]>>({})

  // Sync logs
  const [logs, setLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  // Schedule
  const [schedule, setSchedule] = useState<any>(null)
  const [scheduleInterval, setScheduleInterval] = useState(60)
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduleTypes, setScheduleTypes] = useState<string[]>([...ALL_SYNC_KEYS])
  const [savingSchedule, setSavingSchedule] = useState(false)

  // Auto sync timer
  const autoSyncRef = useRef<any>(null)

  const customSearchRequestRef = useRef(0)

  const [activeSyncMode, setActiveSyncMode] = useState<"full" | "selected">("full")
  const [customProductQuery, setCustomProductQuery] = useState("")
  const [customSearchResults, setCustomSearchResults] = useState<any[]>([])
  const [customSearchLoading, setCustomSearchLoading] = useState(false)
  const [customSearchError, setCustomSearchError] = useState("")
  const [customSelectedProducts, setCustomSelectedProducts] = useState<any[]>([])
  const [branchPriceOverrides, setBranchPriceOverrides] = useState<Record<string, Record<string, Record<string, string>>>>({})
  const [productSyncOptions, setProductSyncOptions] = useState<ProductSyncOptions>(DEFAULT_PRODUCT_SYNC_OPTIONS)

  const getBranchPriceValue = (branchUrl: string, productCode: string, field: string, fallback: any) => {
    const override = branchPriceOverrides[branchUrl]?.[productCode]?.[field]
    if (override !== undefined && override !== null && override !== "") {
      return override
    }

    if (fallback === null || fallback === undefined) {
      return ""
    }

    return String(fallback)
  }

  const setBranchPriceValue = (branchUrl: string, productCode: string, field: string, value: string) => {
    setBranchPriceOverrides(prev => {
      const next = { ...prev }
      const branchMap = { ...(next[branchUrl] || {}) }
      const productMap = { ...(branchMap[productCode] || {}) }

      if (value === "") {
        delete productMap[field]
      } else {
        productMap[field] = value
      }

      if (Object.keys(productMap).length === 0) {
        delete branchMap[productCode]
      } else {
        branchMap[productCode] = productMap
      }

      if (Object.keys(branchMap).length === 0) {
        delete next[branchUrl]
      } else {
        next[branchUrl] = branchMap
      }

      return next
    })
  }

  const toggleCustomProduct = (product: any) => {
    const isSelected = selectedProductCodeSet.has(product.code)

    if (isSelected) {
      setBranchPriceOverrides(current => {
        const next = { ...current }
        for (const branchUrl of Object.keys(next)) {
          const branchMap = { ...(next[branchUrl] || {}) }
          delete branchMap[product.code]
          if (Object.keys(branchMap).length === 0) {
            delete next[branchUrl]
          } else {
            next[branchUrl] = branchMap
          }
        }
        return next
      })
    }

    setCustomSelectedProducts(prev => (
      isSelected ? prev.filter(item => item.code !== product.code) : [...prev, product]
    ))
  }

  const removeCustomProduct = (productCode: string) => {
    setBranchPriceOverrides(current => {
      const next = { ...current }
      for (const branchUrl of Object.keys(next)) {
        const branchMap = { ...(next[branchUrl] || {}) }
        delete branchMap[productCode]
        if (Object.keys(branchMap).length === 0) {
          delete next[branchUrl]
        } else {
          next[branchUrl] = branchMap
        }
      }
      return next
    })
    setCustomSelectedProducts(prev => prev.filter(item => item.code !== productCode))
  }

  const clearCustomProducts = () => {
    setCustomSelectedProducts([])
    setBranchPriceOverrides({})
  }

  const fetchCustomProducts = async (query: string = "") => {
    if (!company) return

    const requestId = ++customSearchRequestRef.current
    setCustomSearchLoading(true)
    setCustomSearchError("")

    try {
      const res = await axios.get("/api/datalist", {
        params: {
          company,
          fields: "sale",
          q: query.trim(),
          take: 40,
          sort: "desc",
        },
      })

      if (requestId !== customSearchRequestRef.current) return
      setCustomSearchResults(Array.isArray(res.data) ? res.data : [])
    } catch (error: any) {
      if (requestId !== customSearchRequestRef.current) return
      setCustomSearchResults([])
      setCustomSearchError(error.response?.data?.error || error.message || "ค้นหาสินค้าไม่สำเร็จ")
    } finally {
      if (requestId === customSearchRequestRef.current) {
        setCustomSearchLoading(false)
      }
    }
  }

  // Tab
  const [activeTab, setActiveTab] = useState<"sync" | "schedule" | "logs">("sync")

  useEffect(() => {
    fetchInit()
    return () => {
      if (autoSyncRef.current) clearInterval(autoSyncRef.current)
    }
  }, [])

  // Start auto sync checker
  useEffect(() => {
    if (autoSyncRef.current) clearInterval(autoSyncRef.current)
    if (scheduleEnabled && company) {
      autoSyncRef.current = setInterval(async () => {
        try {
          await axios.get("/api/sync/auto")
        } catch (e) {
          console.error("Auto sync check failed:", e)
        }
      }, 60000) // เช็คทุก 1 นาที
    }
  }, [scheduleEnabled, company])

  useEffect(() => {
    if (activeSyncMode !== "selected") return

    const timer = setTimeout(() => {
      fetchCustomProducts(customProductQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [activeSyncMode, customProductQuery, company])

  const fetchInit = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) { router.push("/"); return }

      const payload = jwtDecode<any>(token)
      const uid = Number(payload.idcompany)
      setUserId(uid)

      // company_ ใน localStorage คือ User ID ที่ใช้เป็น company filter ทั้งระบบ
      const comp = localStorage.getItem("company_") || String(uid)
      setCompany(comp)

      const userRes = await axios.get(`/api/login/logins/${uid}`)
      setCurrentUser(userRes.data)

      // Fetch branches
      const connRes = await axios.get(`/api/branchconnection?userId=${uid}&type=all`)
      const accepted = connRes.data.filter((c: any) => c.status === "accepted")
      const mapped = accepted.map((c: any) => ({
        id: c.id,
        tunnelUrl: c.tunnelUrl || "",
        apiToken: c.apiToken || "",
        remoteUserId: c.remoteUserId,
        branchName: c.branchName || c.remoteCompany || c.displayName || "ไม่ทราบชื่อ",
        isOnline: c.isOnline,
      })).filter((b: any) => b.tunnelUrl)
      setBranches(mapped)

      // Fetch schedule
      const schedRes = await axios.get(`/api/sync/schedule?company=${comp}`)
      setSchedule(schedRes.data)
      setScheduleInterval(schedRes.data.intervalMinutes || 60)
      setScheduleEnabled(schedRes.data.enabled || false)
      setScheduleTypes((schedRes.data.syncTypes || ALL_SYNC_KEYS.join(",")).split(",").filter(Boolean))

      // Fetch logs
      fetchLogs(comp)
    } catch (error) {
      console.error("Error fetching init:", error)
    }
  }

  const fetchLogs = async (comp?: string) => {
    setLoadingLogs(true)
    try {
      const c = comp || company
      const res = await axios.get(`/api/sync/log?company=${c}&limit=50`)
      setLogs(res.data)
    } catch (e) {
      console.error("Error fetching logs:", e)
    } finally {
      setLoadingLogs(false)
    }
  }

  // === Manual Sync (Streaming) ===
  const handleSync = async () => {
    const targetBranches = selectedBranches.length > 0
      ? selectedBranches
      : branches.map(b => b.tunnelUrl)

    if (targetBranches.length === 0) {
      toast.error(<div style={{ fontFamily: "Kanit" }}>ไม่พบสาขาที่เชื่อมต่อ</div>)
      void logAction({
        actionType: "sync",
        entityType: "sync",
        buttonLabel: activeSyncMode === "selected" ? "Sync รายการที่เลือก" : "Sync Now",
        status: "blocked",
        message: "ไม่พบสาขาที่เชื่อมต่อ",
        metadata: { syncMode: activeSyncMode, selectedBranchCount: selectedBranches.length },
      })
      return
    }

    if (activeSyncMode === "selected") {
      const selectedCodes = customSelectedProducts.map(product => product.code).filter(Boolean)

      if (selectedCodes.length === 0) {
        toast.error(<div style={{ fontFamily: "Kanit" }}>กรุณาเลือกสินค้าที่ต้องการ sync</div>)
        void logAction({
          actionType: "sync",
          entityType: "sync",
          buttonLabel: "Sync รายการที่เลือก",
          status: "blocked",
          message: "กรุณาเลือกสินค้าที่ต้องการ sync",
          metadata: { syncMode: "selected", targetBranchCount: targetBranches.length },
        })
        return
      }

      const startedAt = Date.now()

      setSyncing(true)
      setSyncProgress(`เริ่ม sync สินค้าที่เลือก ${selectedCodes.length} รายการ...`)
      setSyncResults(null)
      setProgressCurrent(0)
      setProgressTotal(0)
      setTypeStatuses({})

      try {
        const res = await fetch("/api/sync/push-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company,
            userId,
            types: [...CUSTOM_SYNC_TYPES],
            targetBranches,
            syncMode: "selected",
            selectedCodes,
            branchPriceOverrides,
            mirror: false,
            productSyncOptions,
          }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || `HTTP ${res.status}`)
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error("No stream reader")

        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          let currentEvent = ""
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim()
            } else if (line.startsWith("data: ") && currentEvent) {
              try {
                const data = JSON.parse(line.slice(6))
                handleSSEEvent(currentEvent, data)
              } catch { }
              currentEvent = ""
            }
          }
        }

        setSyncProgress("")
        toast.success(<div style={{ fontFamily: "Kanit" }}>Sync สินค้าที่เลือกเสร็จสิ้น!</div>, { duration: 3000 })
        void logAction({
          actionType: "sync",
          entityType: "sync",
          buttonLabel: "Sync รายการที่เลือก",
          status: "success",
          message: "Sync สินค้าที่เลือกเสร็จสิ้น",
          durationMs: Date.now() - startedAt,
          metadata: {
            syncMode: "selected",
            selectedProductCount: selectedCodes.length,
            targetBranchCount: targetBranches.length,
            types: [...CUSTOM_SYNC_TYPES],
          },
        })
        fetchLogs()
      } catch (error: any) {
        toast.error(<div style={{ fontFamily: "Kanit" }}>{error.message || "Sync ไม่สำเร็จ"}</div>, { duration: 4000 })
        void logAction({
          actionType: "sync",
          entityType: "sync",
          buttonLabel: "Sync รายการที่เลือก",
          status: "failed",
          message: "Sync สินค้าที่เลือกไม่สำเร็จ",
          errorMessage: error.message || "Sync ไม่สำเร็จ",
          durationMs: Date.now() - startedAt,
          metadata: {
            syncMode: "selected",
            selectedProductCount: selectedCodes.length,
            targetBranchCount: targetBranches.length,
            types: [...CUSTOM_SYNC_TYPES],
          },
        })
        setSyncProgress("")
      } finally {
        setSyncing(false)
      }

      return
    }

    if (selectedTypes.length === 0) {
      toast.error(<div style={{ fontFamily: "Kanit" }}>กรุณาเลือกประเภทข้อมูลที่ต้องการ sync</div>)
      void logAction({
        actionType: "sync",
        entityType: "sync",
        buttonLabel: "Sync Now",
        status: "blocked",
        message: "กรุณาเลือกประเภทข้อมูลที่ต้องการ sync",
        metadata: { syncMode: "all", targetBranchCount: targetBranches.length },
      })
      return
    }

    const startedAt = Date.now()

    setSyncing(true)
    setSyncProgress("เริ่มต้น sync...")
    setSyncResults(null)
    setProgressCurrent(0)
    setProgressTotal(0)
    setTypeStatuses({})

    try {
      const res = await fetch("/api/sync/push-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, userId, types: selectedTypes, targetBranches, productSyncOptions }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `HTTP ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No stream reader")

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        let currentEvent = ""
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim()
          } else if (line.startsWith("data: ") && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6))
              handleSSEEvent(currentEvent, data)
            } catch { }
            currentEvent = ""
          }
        }
      }

      setSyncProgress("")
      toast.success(<div style={{ fontFamily: "Kanit" }}>Sync เสร็จสิ้น!</div>, { duration: 3000 })
      void logAction({
        actionType: "sync",
        entityType: "sync",
        buttonLabel: "Sync Now",
        status: "success",
        message: "Sync เสร็จสิ้น",
        durationMs: Date.now() - startedAt,
        metadata: {
          syncMode: "all",
          typeCount: selectedTypes.length,
          targetBranchCount: targetBranches.length,
          types: selectedTypes,
        },
      })
      fetchLogs()
    } catch (error: any) {
      toast.error(<div style={{ fontFamily: "Kanit" }}>{error.message || "Sync ไม่สำเร็จ"}</div>, { duration: 4000 })
      void logAction({
        actionType: "sync",
        entityType: "sync",
        buttonLabel: "Sync Now",
        status: "failed",
        message: "Sync ไม่สำเร็จ",
        errorMessage: error.message || "Sync ไม่สำเร็จ",
        durationMs: Date.now() - startedAt,
        metadata: {
          syncMode: "all",
          typeCount: selectedTypes.length,
          targetBranchCount: targetBranches.length,
          types: selectedTypes,
        },
      })
      setSyncProgress("")
    } finally {
      setSyncing(false)
    }
  }

  const handleSSEEvent = (event: string, data: any) => {
    switch (event) {
      case "start":
        setProgressTotal(data.totalSteps)
        setSyncProgress(`กำลัง sync ${data.totalSteps} รายการ...`)
        break
      case "fetch":
        if (data.status === "fetching") {
          setSyncProgress(`กำลังดึงข้อมูล ${typeLabel(data.type)}...`)
        } else if (data.status === "done") {
          setSyncProgress(`ดึง ${typeLabel(data.type)} เสร็จ (${data.count} รายการ)`)
        }
        break
      case "type-branch":
        if (data.status === "pushing") {
          setSyncProgress(`กำลัง sync ${typeLabel(data.type)} → ${data.branch}...`)
        }
        setTypeStatuses(prev => {
          const key = data.type
          const existing = prev[key] || []
          const updated = [...existing.filter((e: any) => e.branch !== data.branch), data]
          return { ...prev, [key]: updated }
        })
        break
      case "progress":
        setProgressCurrent(data.current)
        setProgressTotal(data.total)
        break
      case "done":
        setSyncProgress("sync เสร็จสิ้น!")
        break
    }
  }

  // === Save Schedule ===
  const handleSaveSchedule = async () => {
    setSavingSchedule(true)
    const startedAt = Date.now()
    try {
      const res = await axios.put("/api/sync/schedule", {
        company,
        intervalMinutes: scheduleInterval,
        syncTypes: scheduleTypes.join(","),
        targetBranches: "", // ว่าง = ทุกสาขา
        enabled: scheduleEnabled,
      })
      setSchedule(res.data)
      toast.success(<div style={{ fontFamily: "Kanit" }}>บันทึกตั้งเวลาสำเร็จ</div>, { duration: 2000 })
      void logAction({
        actionType: "save",
        entityType: "sync",
        buttonLabel: "บันทึกตั้งเวลา Sync",
        status: "success",
        message: "บันทึกตั้งเวลา Sync สำเร็จ",
        durationMs: Date.now() - startedAt,
        metadata: {
          intervalMinutes: scheduleInterval,
          syncTypes: scheduleTypes,
          enabled: scheduleEnabled,
        },
      })
    } catch (e: any) {
      toast.error(<div style={{ fontFamily: "Kanit" }}>{e.response?.data?.error || "บันทึกไม่สำเร็จ"}</div>)
      void logAction({
        actionType: "save",
        entityType: "sync",
        buttonLabel: "บันทึกตั้งเวลา Sync",
        status: "failed",
        message: "บันทึกตั้งเวลา Sync ไม่สำเร็จ",
        errorMessage: e.response?.data?.error || e.message || "บันทึกไม่สำเร็จ",
        durationMs: Date.now() - startedAt,
        metadata: {
          intervalMinutes: scheduleInterval,
          syncTypes: scheduleTypes,
          enabled: scheduleEnabled,
        },
      })
    } finally {
      setSavingSchedule(false)
    }
  }

  // === Toggle helpers ===
  const toggleType = (key: string) => {
    setSelectedTypes(prev =>
      prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]
    )
  }

  const selectAllTypes = () => {
    if (selectedTypes.length === ALL_SYNC_KEYS.length) {
      setSelectedTypes([])
    } else {
      setSelectedTypes([...ALL_SYNC_KEYS])
    }
  }

  const toggleProductSyncOption = (key: keyof ProductSyncOptions) => {
    setProductSyncOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const setAllProductSyncOptions = (checked: boolean) => {
    setProductSyncOptions({
      preserveCostActual: checked,
      preservePrices: checked,
      preserveStockLimits: checked,
    })
  }

  const toggleScheduleType = (key: string) => {
    setScheduleTypes(prev =>
      prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]
    )
  }

  const toggleBranch = (tunnelUrl: string) => {
    setSelectedBranches(prev =>
      prev.includes(tunnelUrl) ? prev.filter(t => t !== tunnelUrl) : [...prev, tunnelUrl]
    )
  }

  const selectAllBranches = () => {
    if (selectedBranches.length === branches.length) {
      setSelectedBranches([])
    } else {
      setSelectedBranches(branches.map(b => b.tunnelUrl))
    }
  }

  // === Format helpers ===
  const formatDate = (d: string) => {
    if (!d) return "-"
    return new Date(d).toLocaleString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  const fmtMoney = (value: any) => {
    const numberValue = Number(value)
    if (!Number.isFinite(numberValue)) return "-"
    return numberValue.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      success: { bg: "#E5EEF8", text: "#173F6B" },
      failed: { bg: "#fee2e2", text: "#991b1b" },
      partial: { bg: "#fef3c7", text: "#92400e" },
      pending: { bg: "#e0e7ff", text: "#3730a3" },
    }
    const c = colors[status] || colors.pending
    return (
      <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: c.bg, color: c.text }}>
        {status === "success" ? "สำเร็จ" : status === "failed" ? "ล้มเหลว" : status === "partial" ? "บางส่วน" : "รอดำเนินการ"}
      </span>
    )
  }

  const typeLabel = (t: string) => {
    const map: Record<string, string> = {
      datalist: "สินค้า", labeldata: "ฉลากสินค้า", supplier: "ผู้ขาย",
      gift: "ค่าหยิบสินค้า", getagory: "หมวดสินค้า", fixname: "ชื่อทางการ",
      group: "กลุ่มสินค้า", type: "ประเภท", unit: "หน่วยสินค้า",
      area: "พื้นที่เก็บ", interaction: "Drug Interaction",
    }
    return map[t] || t
  }

  const selectedProductCodeSet = new Set(customSelectedProducts.map(product => product.code).filter(Boolean))
  const syncTargetBranches = selectedBranches.length > 0
    ? branches.filter(branch => selectedBranches.includes(branch.tunnelUrl))
    : branches
  const datalistSyncSelected = selectedTypes.includes("datalist")
  const productSyncOptionsEnabled = activeSyncMode === "selected" ? true : datalistSyncSelected
  const allProductSyncOptionsSelected = Object.values(productSyncOptions).every(Boolean)
  const selectedProductSyncOptionCount = Object.values(productSyncOptions).filter(Boolean).length

  // === Styles ===
  const cardStyle = { backgroundColor: "#fff", padding: 20, borderRadius: 14, border: "1px solid #e2e8f0", marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }
  const btnPrimary = { padding: "10px 28px", backgroundColor: "#1E5088", color: "#fff", border: "none", borderRadius: 10, fontFamily: "Kanit", fontSize: 15, fontWeight: 600, cursor: "pointer" }
  const btnSecondary = { padding: "8px 20px", backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 10, fontFamily: "Kanit", fontSize: 13, cursor: "pointer" }
  const infoPillStyle = { display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 999, backgroundColor: "#F3F8FC", color: "#1E5088", fontFamily: "Kanit", fontSize: 11, fontWeight: 600 }
  const productOptionStyle = (checked: boolean, disabled: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    minHeight: 58,
    borderRadius: 12,
    border: checked ? "1.5px solid #2A6AAA" : "1px solid #e2e8f0",
    backgroundColor: disabled ? "#f8fafc" : checked ? "#F3F8FC" : "#fff",
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s",
    fontFamily: "Kanit",
  })
  const productOptionIconStyle = (checked: boolean): React.CSSProperties => ({
    width: 34,
    height: 34,
    borderRadius: 10,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: checked ? "#E5EEF8" : "#f1f5f9",
    color: checked ? "#1E5088" : "#64748b",
    flex: "0 0 auto",
  })
  const modeButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 18px",
    borderRadius: 999,
    border: active ? "1px solid #1E5088" : "1px solid #cbd5e1",
    backgroundColor: active ? "#F3F8FC" : "#fff",
    color: active ? "#1E5088" : "#475569",
    fontFamily: "Kanit",
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    cursor: "pointer",
    transition: "all 0.2s",
  })
  const tabStyle = (active: boolean) => ({
    padding: "10px 24px", border: "none", borderBottom: active ? "3px solid #1E5088" : "3px solid transparent",
    backgroundColor: "transparent", color: active ? "#1E5088" : "#64748b", fontFamily: "Kanit", fontSize: 14,
    fontWeight: active ? 700 : 400, cursor: "pointer", transition: "all 0.2s"
  })

  return (
    <div style={{ paddingLeft: 15, paddingRight: 15 }}>
      <Toaster richColors position="top-right" />

      <div className="row justify-content-start">
        <HeadTab />
      </div>

      <div className="row justify-content-start">
        <div className="col-sm-1">
          <MenuTab_Small />
        </div>

        <div className="col-sm-11">
          <div className='col shadow-sm rounded border' style={{ backgroundColor: "white", minHeight: "90vh", padding: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h4 style={{ fontFamily: "Kanit", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              🔄 Sync Center
            </h4>
            <div style={{ fontFamily: "Kanit", fontSize: 13, color: "#64748b" }}>
              sync ข้อมูลจากสาขาหลักไปยังสาขาย่อย ({branches.length} สาขาที่เชื่อมต่อ)
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e2e8f0", marginBottom: 20 }}>
          <button style={tabStyle(activeTab === "sync")} onClick={() => setActiveTab("sync")}>Sync Now</button>
          {/* <button style={tabStyle(activeTab === "schedule")} onClick={() => setActiveTab("schedule")}>ตั้งเวลา Auto Sync</button> */}
          <button style={tabStyle(activeTab === "logs")} onClick={() => { setActiveTab("logs"); fetchLogs() }}>ประวัติ Sync</button>
        </div>

        {/* ==================== TAB: SYNC NOW ==================== */}
        {activeTab === "sync" && (
          <div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
              <button type="button" style={modeButtonStyle(activeSyncMode === "full")} onClick={() => setActiveSyncMode("full")}>
                Sync ทั้งชุด
              </button>
              <button type="button" style={modeButtonStyle(activeSyncMode === "selected")} onClick={() => setActiveSyncMode("selected")}>
                Sync เฉพาะสินค้า
              </button>
            </div>

            {activeSyncMode === "full" && (
              <div style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontFamily: "Kanit", fontSize: 15, fontWeight: 600, color: "#0f172a" }}>
                    📦 เลือกประเภทข้อมูลที่ต้องการ sync
                  </div>
                  <button onClick={selectAllTypes} style={{ ...btnSecondary, fontSize: 12, padding: "4px 14px" }}>
                    {selectedTypes.length === ALL_SYNC_KEYS.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                  </button>
                </div>
                {SYNC_TYPE_GROUPS.map(grp => (
                  <div key={grp.group} style={{ marginBottom: 14 }}>
                    <div style={{ fontFamily: "Kanit", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{grp.group}</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {grp.types.map(st => (
                        <label key={st.key} style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
                          borderRadius: 10, border: selectedTypes.includes(st.key) ? "2px solid #1E5088" : "2px solid #e2e8f0",
                          backgroundColor: selectedTypes.includes(st.key) ? "#F3F8FC" : "#fff",
                          cursor: "pointer", transition: "all 0.2s", fontFamily: "Kanit",
                        }}>
                          <input type="checkbox" checked={selectedTypes.includes(st.key)} onChange={() => toggleType(st.key)} style={{ accentColor: "#1E5088", width: 16, height: 16 }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{st.label}</div>
                            <div style={{ fontSize: 10, color: "#94a3b8" }}>{st.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={cardStyle}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
                    <span style={{ width: 36, height: 36, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F3F8FC", color: "#1E5088", flex: "0 0 auto" }}>
                      <ShieldCheck size={19} strokeWidth={2.4} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "Kanit", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                        ตัวเลือกการ Sync สินค้า
                      </div>
                      <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b", marginTop: 2 }}>
                        {activeSyncMode === "selected"
                          ? "กำหนดข้อมูลเฉพาะสาขาที่ต้องคงไว้เมื่อ sync สินค้าที่เลือก"
                          : datalistSyncSelected
                            ? "กำหนดข้อมูลเฉพาะสาขาที่ต้องคงไว้เมื่อ sync สินค้าทั้งชุด"
                            : "เปิดใช้งานเมื่อเลือกประเภทข้อมูลสินค้า"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 999, backgroundColor: productSyncOptionsEnabled ? "#F3F8FC" : "#f1f5f9", color: productSyncOptionsEnabled ? "#1E5088" : "#64748b", fontFamily: "Kanit", fontSize: 11, fontWeight: 700 }}>
                      <Check size={13} strokeWidth={3} /> {selectedProductSyncOptionCount}/{PRODUCT_SYNC_OPTION_ITEMS.length}
                    </span>
                    <button
                      type="button"
                      disabled={!productSyncOptionsEnabled}
                      onClick={() => setAllProductSyncOptions(!allProductSyncOptionsSelected)}
                      style={{ ...btnSecondary, fontSize: 12, padding: "4px 14px", opacity: productSyncOptionsEnabled ? 1 : 0.55, cursor: productSyncOptionsEnabled ? "pointer" : "not-allowed" }}
                    >
                      {allProductSyncOptionsSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 10 }}>
                  {PRODUCT_SYNC_OPTION_ITEMS.map(option => {
                    const Icon = option.Icon
                    const checked = productSyncOptions[option.key]
                    return (
                      <label key={option.key} style={productOptionStyle(checked, !productSyncOptionsEnabled)}>
                        <input
                          type="checkbox"
                          disabled={!productSyncOptionsEnabled}
                          checked={checked}
                          onChange={() => toggleProductSyncOption(option.key)}
                          style={{ accentColor: "#2A6AAA", width: 18, height: 18, flex: "0 0 auto" }}
                        />
                        <span style={productOptionIconStyle(checked)}>
                          <Icon size={18} strokeWidth={2.4} />
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{option.label}</span>
                          <span style={{ display: "block", fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 1.45 }}>{option.desc}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
            </div>

            {/* เลือกสาขาปลายทาง */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontFamily: "Kanit", fontSize: 15, fontWeight: 600, color: "#0f172a" }}>
                  🏢 เลือกสาขาปลายทาง
                </div>
                <button onClick={selectAllBranches} style={{ ...btnSecondary, fontSize: 12, padding: "4px 14px" }}>
                  {selectedBranches.length === branches.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                </button>
              </div>

              {branches.length === 0 ? (
                <div style={{ fontFamily: "Kanit", fontSize: 13, color: "#94a3b8", padding: "20px 0", textAlign: "center" }}>
                  ไม่พบสาขาที่เชื่อมต่อ — กรุณาตั้งค่าเชื่อมสาขาก่อน
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {branches.map(b => (
                    <label key={b.tunnelUrl} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                      borderRadius: 10, border: selectedBranches.includes(b.tunnelUrl) ? "2px solid #1E5088" : "2px solid #e2e8f0",
                      backgroundColor: selectedBranches.includes(b.tunnelUrl) ? "#F3F8FC" : "#fff",
                      cursor: "pointer", transition: "all 0.2s", fontFamily: "Kanit",
                    }}>
                      <input type="checkbox" checked={selectedBranches.includes(b.tunnelUrl)} onChange={() => toggleBranch(b.tunnelUrl)} style={{ accentColor: "#1E5088", width: 18, height: 18 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{b.branchName}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{b.tunnelUrl}</div>
                      </div>
                      <span style={{
                        display: "inline-block", width: 10, height: 10, borderRadius: "50%",
                        backgroundColor: b.isOnline ? "#1F9D6B" : "#ef4444",
                      }} title={b.isOnline ? "Online" : "Offline"} />
                    </label>
                  ))}
                </div>
              )}

              {selectedBranches.length === 0 && branches.length > 0 && (
                <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b", marginTop: 8 }}>
                  * ถ้าไม่เลือกสาขา จะ sync ไปทุกสาขาที่เชื่อมต่อ
                </div>
              )}
            </div>

            {activeSyncMode === "selected" && (
              <div style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                  <div style={{ fontFamily: "Kanit", fontSize: 15, fontWeight: 600, color: "#0f172a" }}>
                    🔎 ค้นหาสินค้าที่จะ sync
                  </div>
                  <button
                    onClick={() => fetchCustomProducts(customProductQuery)}
                    style={{ ...btnSecondary, fontSize: 12, padding: "4px 14px" }}
                  >
                    ค้นหา
                  </button>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  <input
                    value={customProductQuery}
                    onChange={e => setCustomProductQuery(e.target.value)}
                    placeholder="พิมพ์ code, barcode หรือชื่อสินค้า"
                    style={{
                      flex: 1,
                      minWidth: 280,
                      fontFamily: "Kanit",
                      fontSize: 14,
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                    }}
                  />
                  <button
                    onClick={() => {
                      setCustomProductQuery("")
                      fetchCustomProducts("")
                    }}
                    style={btnSecondary}
                  >
                    แสดงล่าสุด
                  </button>
                </div>

                <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b", marginBottom: 12 }}>
                  ระบบจะ sync เฉพาะสินค้า, ค่าหยิบ และฉลากสินค้าของรายการที่เลือก พร้อมให้ปรับราคาขายแยกตามสาขา
                </div>

                {customSearchLoading ? (
                  <div style={{ fontFamily: "Kanit", fontSize: 13, color: "#64748b", padding: "10px 0" }}>
                    กำลังค้นหาสินค้า...
                  </div>
                ) : customSearchError ? (
                  <div style={{ fontFamily: "Kanit", fontSize: 13, color: "#b91c1c", padding: "10px 0" }}>
                    {customSearchError}
                  </div>
                ) : customSearchResults.length === 0 ? (
                  <div style={{ fontFamily: "Kanit", fontSize: 13, color: "#94a3b8", padding: "10px 0" }}>
                    {customProductQuery.trim() ? "ไม่พบรายการที่ตรงกับคำค้น" : "ยังไม่มีรายการล่าสุด"}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
                    {customSearchResults.map((product: any) => {
                      const isSelected = selectedProductCodeSet.has(product.code)
                      return (
                        <label
                          key={`${product.code}-${product.id || "search"}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 14px",
                            borderRadius: 12,
                            border: isSelected ? "2px solid #1E5088" : "1px solid #e2e8f0",
                            backgroundColor: isSelected ? "#F3F8FC" : "#fff",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            fontFamily: "Kanit",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCustomProduct(product)}
                            style={{ accentColor: "#1E5088", width: 18, height: 18 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                              {product.code} · {product.ProductName}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                              Barcode: {product.Barcode || "-"} · ขาย {fmtMoney(product.price)} · A {fmtMoney(product.PriceA)} · B {fmtMoney(product.PriceB)}
                            </div>
                          </div>
                          <span style={infoPillStyle}>{isSelected ? "เลือกแล้ว" : "พร้อม sync"}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeSyncMode === "selected" && (
              <div style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                  <div style={{ fontFamily: "Kanit", fontSize: 15, fontWeight: 600, color: "#0f172a" }}>
                    🧾 รายการสินค้าที่เลือก ({customSelectedProducts.length})
                  </div>
                  <button onClick={clearCustomProducts} style={{ ...btnSecondary, fontSize: 12, padding: "4px 14px" }}>
                    ล้างทั้งหมด
                  </button>
                </div>

                {customSelectedProducts.length === 0 ? (
                  <div style={{ fontFamily: "Kanit", fontSize: 13, color: "#94a3b8", padding: "18px 0", textAlign: "center" }}>
                    ยังไม่ได้เลือกสินค้า
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {customSelectedProducts.map((product: any) => (
                      <div
                        key={product.code}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 14,
                          padding: 14,
                          backgroundColor: "#fafafa",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                          <div>
                            <div style={{ fontFamily: "Kanit", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                              {product.ProductName}
                            </div>
                            <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b", marginTop: 2 }}>
                              Code: {product.code || "-"} · Barcode: {product.Barcode || "-"}
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                              <span style={infoPillStyle}>ค่าหยิบจะถูก sync</span>
                              <span style={infoPillStyle}>ฉลากสินค้าจะถูก sync</span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeCustomProduct(product.code)}
                            style={{ ...btnSecondary, fontSize: 12, padding: "4px 12px" }}
                          >
                            เอาออก
                          </button>
                        </div>

                        <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                          ราคาต้นทาง: ขาย {fmtMoney(product.price)} · A {fmtMoney(product.PriceA)} · B {fmtMoney(product.PriceB)} · ส่ง {fmtMoney(product.wholesaleprice)} · Online {fmtMoney(product.online)}
                        </div>

                        {syncTargetBranches.length === 0 ? (
                          <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#94a3b8", padding: "10px 0" }}>
                            ไม่มีสาขาที่เลือกสำหรับรับข้อมูล
                          </div>
                        ) : (
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", minWidth: 840, borderCollapse: "collapse" }}>
                              <thead>
                                <tr style={{ backgroundColor: "#f8fafc" }}>
                                  <th style={{ ...thStyle, whiteSpace: "nowrap" }}>สาขา</th>
                                  {CUSTOM_PRICE_FIELDS.map(field => (
                                    <th key={field.key} style={{ ...thStyle, whiteSpace: "nowrap", textAlign: "center" }}>
                                      {field.label}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {syncTargetBranches.map(branch => (
                                  <tr key={branch.tunnelUrl} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                    <td style={{ ...tdStyle, verticalAlign: "top", minWidth: 170 }}>
                                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{branch.branchName}</div>
                                      <div style={{ fontSize: 11, color: "#94a3b8", wordBreak: "break-all" }}>{branch.tunnelUrl}</div>
                                    </td>
                                    {CUSTOM_PRICE_FIELDS.map(field => (
                                      <td key={field.key} style={{ ...tdStyle, verticalAlign: "top" }}>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={getBranchPriceValue(branch.tunnelUrl, product.code, field.key, product[field.key])}
                                          onChange={e => setBranchPriceValue(branch.tunnelUrl, product.code, field.key, e.target.value)}
                                          style={{
                                            width: "100%",
                                            minWidth: 110,
                                            fontFamily: "Kanit",
                                            fontSize: 13,
                                            padding: "8px 10px",
                                            borderRadius: 8,
                                            border: "1px solid #cbd5e1",
                                            backgroundColor: "#fff",
                                          }}
                                        />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#64748b", marginTop: 8 }}>
                          * เว้นว่างเพื่อใช้ราคาต้นทางของสินค้า
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ปุ่ม Sync + Progress */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <button onClick={handleSync} disabled={syncing} style={{ ...btnPrimary, opacity: syncing ? 0.7 : 1 }}>
                {syncing
                  ? (activeSyncMode === "selected" ? "⏳ กำลัง sync รายการที่เลือก..." : "⏳ กำลัง sync...")
                  : (activeSyncMode === "selected" ? "🔄 Sync รายการที่เลือก" : "🔄 Sync Now")}
              </button>
              {syncProgress && (
                <div style={{ fontFamily: "Kanit", fontSize: 13, color: "#64748b" }}>{syncProgress}</div>
              )}
            </div>

            {/* Progress Bar */}
            {syncing && progressTotal > 0 && (
              <div style={{ ...cardStyle, padding: 16 }}>
                <div style={{ fontFamily: "Kanit", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 8 }}>
                  Progress: {progressCurrent}/{progressTotal}
                </div>
                <div style={{ width: "100%", height: 10, backgroundColor: "#e2e8f0", borderRadius: 5, overflow: "hidden" }}>
                  <div style={{
                    width: `${Math.round((progressCurrent / progressTotal) * 100)}%`,
                    height: "100%", backgroundColor: "#1E5088", borderRadius: 5,
                    transition: "width 0.3s ease",
                  }} />
                </div>
              </div>
            )}

            {/* Streaming Type Statuses */}
            {Object.keys(typeStatuses).length > 0 && (
              <div style={cardStyle}>
                <div style={{ fontFamily: "Kanit", fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>
                  📊 ผลลัพธ์ Sync
                </div>
                {Object.entries(typeStatuses).map(([type, results]) => (
                  <div key={type} style={{ marginBottom: 12 }}>
                    <div style={{ fontFamily: "Kanit", fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
                      {typeLabel(type)}
                    </div>
                    {results.map((r: any, i: number) => (
                      <div key={i} style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b", paddingLeft: 16, marginBottom: 2 }}>
                        {r.status === "pushing" && <span>⏳ {r.branch}...</span>}
                        {r.status === "success" && <span>✅ {r.branch}: เพิ่ม {r.created || 0} / อัปเดต {r.updated || 0}</span>}
                        {r.status === "failed" && <span style={{ color: "#991b1b" }}>❌ {r.branch}: {r.error}</span>}
                        {r.status === "skipped" && <span style={{ color: "#92400e" }}>⚠️ {r.branch}: {r.error}</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Legacy Sync Results (from non-streaming) */}
            {syncResults && (
              <div style={cardStyle}>
                <div style={{ fontFamily: "Kanit", fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>
                  📊 ผลลัพธ์ Sync
                </div>
                {/* Debug Info */}
                {syncResults.debugInfo && (
                  <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b", marginBottom: 12, padding: "8px 12px", backgroundColor: "#f8fafc", borderRadius: 8 }}>
                    <strong>Debug:</strong> company="{syncResults.debugInfo.company}", userId={syncResults.debugInfo.userId}, connections={syncResults.debugInfo.connectionCount}
                    {syncResults.fetchedCounts && (
                      <span> | ดึงข้อมูลได้: {Object.entries(syncResults.fetchedCounts).map(([k, v]) => `${k}=${v}`).join(", ")}</span>
                    )}
                  </div>
                )}
                {syncResults.results?.map((r: any, i: number) => (
                  <div key={i} style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 8, backgroundColor: "#fafafa" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "Kanit" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                        🏢 {r.branch}
                      </div>
                      {statusBadge(r.status)}
                    </div>
                    {r.types && Object.entries(r.types).map(([type, result]: [string, any]) => (
                      <div key={type} style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b", marginTop: 4, paddingLeft: 16 }}>
                        <span style={{ fontWeight: 600 }}>{typeLabel(type)}:</span>{" "}
                        {result.success
                          ? `✅ เพิ่ม ${result.created || 0} / อัปเดต ${result.updated || 0}`
                          : `❌ ${result.error || "ล้มเหลว"}`
                        }
                      </div>
                    ))}
                    {r.error && (
                      <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#991b1b", marginTop: 4 }}>
                        ❌ {r.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: SCHEDULE ==================== */}
        {activeTab === "schedule" && (
          <div>
            <div style={cardStyle}>
              <div style={{ fontFamily: "Kanit", fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 16 }}>
                ⏰ ตั้งเวลา Auto Sync
              </div>

              {/* เปิด/ปิด */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontFamily: "Kanit" }}>
                  <div onClick={() => setScheduleEnabled(!scheduleEnabled)} style={{
                    width: 50, height: 26, borderRadius: 13, backgroundColor: scheduleEnabled ? "#1E5088" : "#cbd5e1",
                    position: "relative", cursor: "pointer", transition: "all 0.3s",
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", backgroundColor: "#fff",
                      position: "absolute", top: 2, left: scheduleEnabled ? 26 : 2,
                      transition: "all 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                    }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: scheduleEnabled ? "#1E5088" : "#64748b" }}>
                    {scheduleEnabled ? "เปิดใช้งาน Auto Sync" : "ปิดอยู่"}
                  </span>
                </label>
              </div>

              {/* Interval */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "Kanit", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>ความถี่ในการ sync</div>
                <select
                  value={scheduleInterval}
                  onChange={e => setScheduleInterval(Number(e.target.value))}
                  style={{ fontFamily: "Kanit", fontSize: 14, padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0", width: 260 }}
                >
                  {INTERVAL_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* ประเภทข้อมูล */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "Kanit", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>ประเภทข้อมูลที่ sync อัตโนมัติ</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {SYNC_TYPE_GROUPS.flatMap(g => g.types).map(st => (
                    <label key={st.key} style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
                      borderRadius: 8, border: scheduleTypes.includes(st.key) ? "2px solid #1E5088" : "2px solid #e2e8f0",
                      backgroundColor: scheduleTypes.includes(st.key) ? "#F3F8FC" : "#fff",
                      cursor: "pointer", fontFamily: "Kanit", fontSize: 13,
                    }}>
                      <input type="checkbox" checked={scheduleTypes.includes(st.key)} onChange={() => toggleScheduleType(st.key)} style={{ accentColor: "#1E5088" }} />
                      {st.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Last run */}
              {schedule?.lastRunAt && (
                <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b", marginBottom: 16 }}>
                  รันล่าสุด: {formatDate(schedule.lastRunAt)}
                </div>
              )}

              <button onClick={handleSaveSchedule} disabled={savingSchedule} style={{ ...btnPrimary, opacity: savingSchedule ? 0.7 : 1 }}>
                {savingSchedule ? "กำลังบันทึก..." : "💾 บันทึกการตั้งเวลา"}
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB: LOGS ==================== */}
        {activeTab === "logs" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontFamily: "Kanit", fontSize: 15, fontWeight: 600, color: "#0f172a" }}>
                📋 ประวัติ Sync (ล่าสุด 50 รายการ)
              </div>
              <button onClick={() => fetchLogs()} style={btnSecondary}>
                {loadingLogs ? "กำลังโหลด..." : "🔄 รีเฟรช"}
              </button>
            </div>

            {logs.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: "center", padding: 40 }}>
                <div style={{ fontFamily: "Kanit", fontSize: 14, color: "#94a3b8" }}>ยังไม่มีประวัติ sync</div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Kanit", fontSize: 13 }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc" }}>
                      <th style={thStyle}>วันเวลา</th>
                      <th style={thStyle}>สาขา</th>
                      <th style={thStyle}>ประเภท</th>
                      <th style={thStyle}>จำนวน</th>
                      <th style={thStyle}>เพิ่ม</th>
                      <th style={thStyle}>อัปเดต</th>
                      <th style={thStyle}>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log: any) => (
                      <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={tdStyle}>{formatDate(log.createdAt)}</td>
                        <td style={tdStyle}>{log.branchName || log.targetBranch || "-"}</td>
                        <td style={tdStyle}>{typeLabel(log.syncType || "")}</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>{log.recordCount || 0}</td>
                        <td style={{ ...tdStyle, textAlign: "center", color: "#2A6AAA", fontWeight: 600 }}>{log.created || 0}</td>
                        <td style={{ ...tdStyle, textAlign: "center", color: "#2A6AAA", fontWeight: 600 }}>{log.updated || 0}</td>
                        <td style={tdStyle}>
                          {statusBadge(log.status || "pending")}
                          {log.error && (
                            <div style={{ fontSize: 11, color: "#991b1b", marginTop: 2 }} title={log.error}>
                              {log.error.length > 60 ? log.error.substring(0, 60) + "..." : log.error}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: "10px 12px", fontWeight: 700, fontSize: 12, color: "#64748b",
  borderBottom: "2px solid #e2e8f0", textAlign: "left",
}
const tdStyle: React.CSSProperties = {
  padding: "10px 12px", fontSize: 13, color: "#334155",
}

function SyncPage() {
  return <PermissionGuard codename="Q1"><SyncPageContent /></PermissionGuard>
}

export default SyncPage
