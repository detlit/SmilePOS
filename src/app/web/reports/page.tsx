'use client'

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useReactToPrint } from 'react-to-print';
import styles from "../componant/mystyle.module.css";

import MenuTab_Small from "../componant/menutab_small.tsx"
import { usePermission } from '@/utils/usePermission'
import { isSilentPrintAvailable, printSilent } from '@/lib/runtime/print'
import { getThermalReceiptHorizontalOffset, getThermalReceiptPaperWidth, getThermalReceiptPrintStyles } from '@/utils/receiptPrintStyles'

const getLocalStorageItem = (key: string, defaultValue: string = '') => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key) || defaultValue;
  }
  return defaultValue;
};

const getLocalJwtLevel = () => {
  if (typeof window === 'undefined') return ''
  const storedLevel = localStorage.getItem('level_') || ''
  if (storedLevel) return storedLevel
  const token = localStorage.getItem('token') || ''
  const payload = token.split('.')[1]
  if (!payload) return ''
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const decoded = JSON.parse(window.atob(padded))
    return String(decoded?.level || '')
  } catch {
    return ''
  }
}
import HeadTab from "../componant/headtab.jsx"
import { Table } from 'react-bootstrap';
import axios from 'axios'
import { ChevronDownIcon, Calendar as CalendarIcon, CalendarRange, BarChart3, Receipt, DollarSign, TrendingUp, CreditCard, Banknote, ShoppingBag, Package, ClipboardList, Layers, Gift, Clock, FileSpreadsheet, Printer, ShieldAlert, Building2, ClipboardCheck, Search, Trash2, Pencil, Save, Lock, History as HistoryIcon, ImageDown, Filter, User as UserIcon, X, Plus, Signature, Landmark, FileDown, ChevronDown, Truck, EyeOff, Wallet, DatabaseBackup, CheckCircle2, AlertTriangle, RefreshCw, ArrowLeftRight } from "lucide-react"
import { runBackupNow } from "@/lib/backupRunner"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Settings } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SaleListItem from "./listsaleitem.tsx";
import ReceiptItem from "./receipt.tsx";
import AllReportsTab from "./AllReportsTab";
import ProductAnalysisTab from "./ProductAnalysisTab";
import CategoryAnalysisTab from "./CategoryAnalysisTab";
import GiftTargetTab from "./GiftTargetTab";
import SaleByKYTab from "./SaleByKYTab";
import AttendanceReportTab from "./AttendanceReportTab";
import SlowMoveTab from "./SlowMoveTab";
import ExpiryProductTab from "./ExpiryProductTab";
import VendorAnalysisTab from "./VendorAnalysisTab";
import CustomerAnalysisTab from "./CustomerAnalysisTab";
import PaymentSummaryTab from "./PaymentSummaryTab";
import PLReportTab from "./PLReportTab";
import StockAlertTab from "./StockAlertTab";
import TemperatureReportTab from "./TemperatureReportTab";
import FollowupSummaryTab from "./FollowupSummaryTab";
import StockInventoryTab from "./StockInventoryTab";
import KYReportTab from "./KYReportTab";
import SaleKYReportTab from "./SaleKYReportTab";
import StockAdjustmentReportTab from "./StockAdjustmentReportTab";
import EmployeeReportTab from "./EmployeeReportTab";
import MonthlySalesReportTab from "./MonthlySalesReportTab";
import ProductSalesReportTab from "./ProductSalesReportTab";
import StockTransferReportTab from "./StockTransferReportTab";

type ReceiptA4CustomerInfo = {
  id: string
  code: string
  name: string
  taxId: string
  tel: string
  address: string
  branch: string
  note: string
}

type ReceiptA4SignatureEmployee = {
  id: number
  name?: string | null
  username?: string | null
  position?: string | null
}

const EMPTY_RECEIPT_A4_CUSTOMER: ReceiptA4CustomerInfo = {
  id: '',
  code: '',
  name: '',
  taxId: '',
  tel: '',
  address: '',
  branch: '',
  note: '',
}

type TaxInvoiceCustomerInfo = {
  id: string
  code: string
  name: string
  taxId: string
  tel: string
  address: string
  branch: string
}

const EMPTY_TAX_INVOICE_CUSTOMER: TaxInvoiceCustomerInfo = {
  id: '',
  code: '',
  name: 'ลูกค้าทั่วไป',
  taxId: '',
  tel: '',
  address: '',
  branch: '',
}

type TaxInvoiceCopyOption = 'original' | 'copy'

const htmlEscapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
}

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => htmlEscapeMap[char] || char)

const formatReceiptCurrency = (value: unknown, fractionDigits = 2) => {
  const numericValue = Number(value || 0)
  return numericValue.toLocaleString('th-TH', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })
}

const THAI_DIGIT_WORDS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
const THAI_PLACE_WORDS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน']

const thaiDigitsToText = (digitsStr: string) => {
  const trimmed = digitsStr.replace(/^0+(?=\d)/, '')
  if (trimmed === '0') return ''
  let result = ''
  const len = trimmed.length
  for (let i = 0; i < len; i++) {
    const digit = Number(trimmed[i])
    if (digit === 0) continue
    const pos = (len - i - 1) % 6
    if (pos === 0 && digit === 1 && len > 1) {
      result += 'เอ็ด'
    } else if (pos === 1 && digit === 2) {
      result += 'ยี่' + THAI_PLACE_WORDS[1]
    } else if (pos === 1 && digit === 1) {
      result += THAI_PLACE_WORDS[1]
    } else {
      result += THAI_DIGIT_WORDS[digit] + THAI_PLACE_WORDS[pos]
    }
    if (pos === 0 && len - i - 1 > 0) result += 'ล้าน'
  }
  return result
}

const bahtText = (amount: number) => {
  const safeAmount = Number.isFinite(amount) ? Math.abs(amount) : 0
  const rounded = Math.round(safeAmount * 100) / 100
  const [bahtPart, satangPart = '00'] = rounded.toFixed(2).split('.')
  const bahtWords = thaiDigitsToText(bahtPart) || 'ศูนย์'
  const satangNumber = Number(satangPart)
  return satangNumber === 0
    ? `${bahtWords}บาทถ้วน`
    : `${bahtWords}บาท${thaiDigitsToText(satangPart)}สตางค์`
}

const getReceiptDateTime = (value: string | Date | null | undefined) => {
  const dateValue = value ? new Date(value) : new Date()
  if (Number.isNaN(dateValue.getTime())) {
    return { date: '-', time: '-' }
  }
  return {
    date: dateValue.toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' }),
    time: dateValue.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }),
  }
}

const toReceiptA4InputDate = (value: unknown) => {
  if (!value) {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  }
  const dateValue = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(dateValue.getTime())) return String(value)
  return `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, '0')}-${String(dateValue.getDate()).padStart(2, '0')}`
}

const formatReceiptA4SignatureDate = (value: string) => {
  if (!value) return '-'
  const parts = value.split('-')
  if (parts.length === 3) {
    const [yearValue, monthValue, dayValue] = parts
    return `${dayValue}/${monthValue}/${yearValue}`
  }
  return value
}

const getReceiptA4SignatureEmployeeLabel = (employee: ReceiptA4SignatureEmployee) => {
  return String(employee.name || employee.username || `พนักงาน ${employee.id}`).trim()
}

// ── Built-in payment provider display names (fallback when DB displayName is empty) ──
const BUILTIN_PROVIDER_NAMES: Record<string, string> = {
  promptpay: 'PromptPay',
  maemanee: 'แม่มณี (SCB)',
  kshop: 'K-Shop (KBank)',
  alipay: 'Alipay',
  wechat: 'WeChat Pay',
  truemoney: 'TrueMoney Wallet',
  bbl: 'ธนาคารกรุงเทพ (BBL)',
  krungsri: 'ธนาคารกรุงศรี (BAY)',
  tmb: 'ธนาคารทหารไทย (ttb)',
  thanachart: 'ธนาคารธนชาติ',
  paotang: 'เป๋าตัง (Paotang)',
  edc: 'EDC (บัตร)',
}

// แปลง key ของช่องทางชำระเงิน → ชื่อที่อ่านง่าย (รองรับชื่อกำหนดเอง custom_*)
const resolveProviderLabel = (rawKey: string, providerMap: Record<string, string>) => {
  const key = String(rawKey || '').trim()
  if (!key) return ''
  if (providerMap[key]) return providerMap[key]
  if (BUILTIN_PROVIDER_NAMES[key]) return BUILTIN_PROVIDER_NAMES[key]
  // คีย์ที่ระบบสร้างให้แต่ยังไม่ได้ตั้งชื่อ เช่น custom_other_xxx → แสดงเป็น "อื่นๆ"
  if (/^custom_other_/.test(key)) return 'อื่นๆ (ไม่ระบุชื่อ)'
  if (/^custom_transfer_/.test(key)) return 'โอน (ไม่ระบุชื่อ)'
  return key
}

const getReceiptPaymentLabel = (sale: any) => {
  if (!sale?.pay) return '-'
  if (sale.pay === 'เงินสด+โอน') return 'แยกจ่าย เงินสด/โอน'
  if (sale.pay === 'payment') return 'โอน'
  if (sale.pay === 'cash') return 'เงินสด'
  if (sale.pay === 'โอน' && sale.transferDetail) return `โอน (${sale.transferDetail})`
  return sale.pay
}

const toReportNumber = (value: unknown) => Number(value || 0)

const getSaleRowId = (sale: any) => String(sale?.id ?? '')

const getSaleItemMainId = (item: any) => String(item?.id_salemain ?? '')

const buildDailyReportMetrics = (saleRows: any[], saleItemRows: any[], fallbackSummary: any = {}) => {
  const scopedSaleRows = Array.isArray(saleRows) ? saleRows : []
  const saleIdSet = new Set(scopedSaleRows.map(getSaleRowId))
  const scopedItemRows = (Array.isArray(saleItemRows) ? saleItemRows : []).filter((item: any) => saleIdSet.has(getSaleItemMainId(item)))

  const activeSales = scopedSaleRows.filter((sale: any) => sale.statussall !== 'ยกเลิก')
  const canceledSales = scopedSaleRows.filter((sale: any) => sale.statussall === 'ยกเลิก')
  const activeSaleIdSet = new Set(activeSales.map(getSaleRowId))
  const activeItems = scopedItemRows.filter((item: any) => activeSaleIdSet.has(getSaleItemMainId(item)) && item.statuss !== 'ยกเลิก')

  const totalNet = activeSales.reduce((sum: number, sale: any) => sum + toReportNumber(sale.sumtotal), 0)
  const totalAll = activeSales.reduce((sum: number, sale: any) => sum + toReportNumber(sale.totalall), 0)
  const totalDiscount = activeSales.reduce((sum: number, sale: any) => sum + toReportNumber(sale.discount), 0)
  const totalReward = activeSales.reduce((sum: number, sale: any) => sum + toReportNumber(sale.usereward), 0)
  const canceledNet = canceledSales.reduce((sum: number, sale: any) => sum + toReportNumber(sale.sumtotal), 0)
  const totalCost = activeItems.reduce((sum: number, item: any) => sum + toReportNumber(item.cost), 0)
  const profit = totalNet - totalCost
  const profitPercent = totalNet > 0 ? (profit / totalNet) * 100 : 0

  const cashSales = activeSales.filter((sale: any) => sale.pay === 'เงินสด')
  const transferSales = activeSales.filter((sale: any) => sale.pay === 'โอน')
  const splitSales = activeSales.filter((sale: any) => sale.pay === 'เงินสด+โอน')
  const otherSales = activeSales.filter((sale: any) => sale.pay === 'อื่นๆ')
  const splitCashTotal = splitSales.reduce((sum: number, sale: any) => sum + toReportNumber(sale.cashAmount), 0)
  const splitTransferTotal = splitSales.reduce((sum: number, sale: any) => sum + toReportNumber(sale.transferAmount), 0)
  const cashTotal = cashSales.reduce((sum: number, sale: any) => sum + toReportNumber(sale.sumtotal), 0) + splitCashTotal
  const transferTotal = transferSales.reduce((sum: number, sale: any) => sum + toReportNumber(sale.sumtotal), 0) + splitTransferTotal
  const otherTotal = otherSales.reduce((sum: number, sale: any) => sum + toReportNumber(sale.sumtotal), 0)
  const promptpayTotal = activeSales
    .filter((sale: any) => (sale.pay === 'โอน' || sale.pay === 'เงินสด+โอน') && String(sale.transferDetail || '').toLowerCase().includes('promptpay'))
    .reduce((sum: number, sale: any) => sum + toReportNumber(sale.pay === 'เงินสด+โอน' ? sale.transferAmount : sale.sumtotal), 0)
  // ค่าธรรมเนียมบัตร (Service charge เช่น EDC) — เก็บแยกจาก sumtotal จึงต้องสรุปแยก
  const serviceChargeSales = activeSales.filter((sale: any) => toReportNumber(sale.serviceCharge) > 0)
  const serviceChargeTotal = serviceChargeSales.reduce((sum: number, sale: any) => sum + toReportNumber(sale.serviceCharge), 0)

  return {
    saleRows: scopedSaleRows,
    saleItemRows: scopedItemRows,
    activeSales,
    canceledSales,
    activeItems,
    cashSales,
    transferSales,
    splitSales,
    otherSales,
    totalNet,
    totalAll,
    totalDiscount,
    totalReward,
    canceledNet,
    totalCost,
    profit,
    profitPercent,
    splitCashTotal,
    splitTransferTotal,
    cashTotal,
    transferTotal,
    otherTotal,
    promptpayTotal,
    serviceChargeTotal,
    serviceChargeBills: serviceChargeSales.length,
    summary: {
      revenue: totalNet,
      bill: activeSales.length,
      sumRC: toReportNumber(fallbackSummary?.sumRC),
      itemRC: toReportNumber(fallbackSummary?.itemRC),
      Bahtperbill: activeSales.length > 0 ? totalNet / activeSales.length : 0,
      cost: totalCost,
      profit,
      perprofit: profitPercent,
      cashbill: cashSales.length + splitSales.length,
      paymentbill: transferSales.length + splitSales.length,
      cash: cashTotal,
      payment: transferTotal,
      splitbill: splitSales.length,
      splitCash: splitCashTotal,
      splitTransfer: splitTransferTotal,
      otherbill: otherSales.length,
      other: otherTotal,
      serviceCharge: serviceChargeTotal,
      serviceChargeBill: serviceChargeSales.length,
    },
  }
}


function ReportPage() {

  const [salesummary, setsalesummary] = useState([])
  const [saledaily, setsaledaily] = useState([])
  const [saledailycount, setsaledailycount] = useState([])
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({})
  const [idDatalist, setidW] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const initialValues = { company: "", idSaleItem: "", search_date: "" };
  const [all, setall1] = useState(initialValues)
  const [initialDrawer, setInitialDrawer] = useState<number>(0)
  const [tempDrawer, setTempDrawer] = useState<string>("0")
  const [openSettings, setOpenSettings] = useState(false)
  const [providerMap, setProviderMap] = useState<Record<string, string>>({})
  // ── Sales-list filters: user / shift / custom time range ────────────────
  type Shift = { id: string; name: string; start: string; end: string }
  const DEFAULT_SHIFTS: Shift[] = [
    { id: 'morning', name: 'เช้า', start: '07:00', end: '15:00' },
    { id: 'afternoon', name: 'บ่าย', start: '15:00', end: '22:00' },
    { id: 'night', name: 'ดึก', start: '22:00', end: '07:00' },
  ]
  const [userFilter, setUserFilter] = useState<string>('all')
  const [shiftFilter, setShiftFilter] = useState<string>('all') // 'all' | shift.id | 'custom'
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')
  const [shifts, setShifts] = useState<Shift[]>(DEFAULT_SHIFTS)
  const [openShiftSettings, setOpenShiftSettings] = useState(false)
  const [openSalesFilter, setOpenSalesFilter] = useState(false)
  const [shiftSettingsLoading, setShiftSettingsLoading] = useState(false)
  const [shiftSettingsSaving, setShiftSettingsSaving] = useState(false)
  const [shiftSettingsMessage, setShiftSettingsMessage] = useState('')
  const [currentUserLevel, setCurrentUserLevel] = useState('')
  const [currentSellerName, setCurrentSellerName] = useState('')
  const { hasPermission } = usePermission()

  useEffect(() => {
    let cancelled = false
    const fetchShifts = async () => {
      const companyS = localStorage.getItem('company_') || ''
      setCurrentUserLevel(getLocalJwtLevel())
      setCurrentSellerName(localStorage.getItem('person_') || '')
      if (!companyS) return

      setShiftSettingsLoading(true)
      try {
        const res = await axios.get(`/api/report-shifts?company=${encodeURIComponent(companyS)}`)
        const rows = Array.isArray(res.data?.shifts) ? res.data.shifts : []
        if (!cancelled && rows.length > 0) setShifts(rows)
      } catch (error) {
        console.error('Load report shifts error:', error)
      } finally {
        if (!cancelled) setShiftSettingsLoading(false)
      }
    }

    fetchShifts()
    return () => { cancelled = true }
  }, [])

  const updateShiftDraft = (index: number, patch: Partial<Shift>) => {
    setShiftSettingsMessage('')
    setShifts((current) => current.map((shift, currentIndex) => currentIndex === index ? { ...shift, ...patch } : shift))
  }

  const removeShiftDraft = (index: number) => {
    const removed = shifts[index]
    setShiftSettingsMessage('')
    setShifts((current) => current.filter((_, currentIndex) => currentIndex !== index))
    if (removed && shiftFilter === removed.id) setShiftFilter('all')
  }

  const addShiftDraft = () => {
    setShiftSettingsMessage('')
    setShifts((current) => [...current, { id: `shift_${Date.now()}`, name: 'กะใหม่', start: '08:00', end: '17:00' }])
  }

  const persistShifts = async (nextShifts: Shift[] = shifts) => {
    const companyS = localStorage.getItem('company_') || ''
    const token = localStorage.getItem('token') || ''
    const level = getLocalJwtLevel()
    setCurrentUserLevel(level)

    if (level !== 'level2') {
      setShiftSettingsMessage('อนุญาตเฉพาะผู้ใช้ level 2 เท่านั้น')
      return
    }

    if (!companyS) {
      setShiftSettingsMessage('ไม่พบข้อมูลบริษัท')
      return
    }

    setShiftSettingsSaving(true)
    setShiftSettingsMessage('')
    try {
      const res = await axios.put('/api/report-shifts', { company: companyS, shifts: nextShifts }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const rows = Array.isArray(res.data?.shifts) ? res.data.shifts : nextShifts
      setShifts(rows)
      setShiftSettingsMessage('บันทึกแล้ว')
    } catch (error: any) {
      console.error('Save report shifts error:', error)
      const status = error?.response?.status
      setShiftSettingsMessage(status === 403 ? 'อนุญาตเฉพาะผู้ใช้ level 2 เท่านั้น' : 'บันทึกไม่สำเร็จ')
    } finally {
      setShiftSettingsSaving(false)
    }
  }

  const availableUsers = useMemo(() => {
    const set = new Set<string>()
    saledaily.forEach((sale: any) => { if (sale.personall) set.add(String(sale.personall)) })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'))
  }, [saledaily])

  const isLevel1User = currentUserLevel === 'level1'
  const canLevel1SelectHistoricalDate = !isLevel1User || hasPermission('J17')
  const canLevel1SelectAnySeller = isLevel1User && hasPermission('J18')
  const isSellerFilterLocked = isLevel1User && !canLevel1SelectAnySeller
  const userFilterOptions = useMemo(() => {
    if (!isLevel1User) return availableUsers
    if (canLevel1SelectAnySeller) {
      return currentSellerName && !availableUsers.includes(currentSellerName)
        ? [currentSellerName, ...availableUsers]
        : availableUsers
    }
    return currentSellerName ? [currentSellerName] : []
  }, [availableUsers, canLevel1SelectAnySeller, currentSellerName, isLevel1User])

  useEffect(() => {
    if (isLevel1User && !canLevel1SelectAnySeller && currentSellerName && userFilter !== currentSellerName) {
      setUserFilter(currentSellerName)
      return
    }
    if (isLevel1User && canLevel1SelectAnySeller) {
      const fallbackSeller = currentSellerName || userFilterOptions[0] || 'all'
      if (userFilter !== 'all' && userFilterOptions.length > 0 && !userFilterOptions.includes(userFilter)) {
        setUserFilter(fallbackSeller)
        return
      }
    }
  }, [canLevel1SelectAnySeller, currentSellerName, currentUserLevel, isLevel1User, userFilter, userFilterOptions])

  const level1SellerFallback = currentSellerName || userFilterOptions[0] || 'all'
  const effectiveUserFilter = isLevel1User
    ? (canLevel1SelectAnySeller ? userFilter : level1SellerFallback)
    : userFilter

  useEffect(() => {
    if (!isLevel1User || canLevel1SelectHistoricalDate) return
    if (all.search_date) {
      setall1((current) => ({ ...current, search_date: '' }))
      setDate(undefined)
    }
    setOpen(false)
  }, [all.search_date, canLevel1SelectHistoricalDate, isLevel1User])

  const activeWindow = useMemo<{ start: string; end: string } | null>(() => {
    if (shiftFilter === 'all') return null
    if (shiftFilter === 'custom') {
      if (!customStart && !customEnd) return null
      return { start: customStart || '00:00', end: customEnd || '23:59' }
    }
    const shift = shifts.find((item) => item.id === shiftFilter)
    return shift ? { start: shift.start, end: shift.end } : null
  }, [shiftFilter, customStart, customEnd, shifts])

  const filteredSaledaily = useMemo(() => {
    return saledaily.filter((sale: any) => {
      if (effectiveUserFilter !== 'all' && String(sale.personall || '') !== effectiveUserFilter) return false
      if (activeWindow) {
        const saleDate = new Date(String(sale.createDate))
        const hh = String(saleDate.getHours()).padStart(2, '0')
        const mm = String(saleDate.getMinutes()).padStart(2, '0')
        const timeText = `${hh}:${mm}`
        const { start, end } = activeWindow
        const inRange = start <= end ? (timeText >= start && timeText <= end) : (timeText >= start || timeText <= end)
        if (!inRange) return false
      }
      return true
    })
  }, [saledaily, effectiveUserFilter, activeWindow])

  const filtersActive = effectiveUserFilter !== 'all' || shiftFilter !== 'all'

  const activeFilterLabel = useMemo(() => {
    const parts: string[] = []
    if (effectiveUserFilter !== 'all') parts.push(`ผู้ขาย: ${effectiveUserFilter}`)
    if (shiftFilter !== 'all') {
      if (shiftFilter === 'custom') {
        parts.push(`ช่วงเวลา: ${customStart || '00:00'}-${customEnd || '23:59'}`)
      } else {
        const shift = shifts.find((item) => item.id === shiftFilter)
        if (shift) parts.push(`กะ: ${shift.name} ${shift.start}-${shift.end}`)
      }
    }
    return parts.length > 0 ? parts.join(' · ') : 'ทั้งหมดของวัน'
  }, [effectiveUserFilter, shiftFilter, customStart, customEnd, shifts])

  const reportScopeLabel = filtersActive ? activeFilterLabel : 'ทั้งหมดของวัน'
  const salesummaryData = useMemo(() => Array.isArray(salesummary) ? ((salesummary[0] as any) || {}) : {}, [salesummary])
  const dailyReportMetrics = useMemo(
    () => buildDailyReportMetrics(filteredSaledaily as any[], saledailycount as any[], salesummaryData),
    [filteredSaledaily, saledailycount, salesummaryData]
  )

  useEffect(() => {
    if (!idDatalist) return
    const selectedStillVisible = filteredSaledaily.some((sale: any) => String(sale.id) === String(idDatalist))
    if (!selectedStillVisible) setidW('')
  }, [filteredSaledaily, idDatalist])

  const receiptRef = useRef<HTMLDivElement>(null)
  const [mainTab, setMainTab] = useState<'daily' | 'all' | 'product' | 'category' | 'gift' | 'saleky' | 'attendance' | 'slowmove' | 'expiry' | 'vendor' | 'customer' | 'payment' | 'pl' | 'stockalert' | 'temperature' | 'followup' | 'stock' | 'kyreport' | 'salekyreport' | 'stockadjust' | 'employee' | 'monthlysales' | 'productsales' | 'stocktransfer'>('daily')
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closeTab, setCloseTab] = useState<'form' | 'history'>('form')
  const [closeData, setCloseData] = useState<any>(null)
  const [closeHistory, setCloseHistory] = useState<any[]>([])
  const [closeSearch, setCloseSearch] = useState({ from: '', to: '', q: '' })
  const [closeBusy, setCloseBusy] = useState(false)
  // สถานะการสำรองข้อมูลอัตโนมัติหลังกด "ปิดบิล (ล็อก)"
  const [closeBackup, setCloseBackup] = useState<{
    status: 'idle' | 'running' | 'done' | 'error' | 'skipped'
    file?: string; folder?: string; records?: number; at?: string; message?: string
  }>({ status: 'idle' })
  const [isExportingDaily, setIsExportingDaily] = useState(false)
  const [isExportingMonthly, setIsExportingMonthly] = useState(false)

  // Store settings for receipt printing
  const [storeS, setStoreS] = useState('')
  const [addressS, setAddressS] = useState('')
  const [telS, setTelS] = useState('')
  const [taxS, setTaxS] = useState('')
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [selectedPrinter_rc, setSelectedPrinter_rc] = useState('')
  const [showReceiptA4Modal, setShowReceiptA4Modal] = useState(false)
  const [receiptA4Loading, setReceiptA4Loading] = useState(false)
  const [receiptA4SavingCustomer, setReceiptA4SavingCustomer] = useState(false)
  const [receiptA4SaveMessage, setReceiptA4SaveMessage] = useState('')
  const [receiptA4Sale, setReceiptA4Sale] = useState<any>(null)
  const [receiptA4Items, setReceiptA4Items] = useState<any[]>([])
  const [receiptA4Customer, setReceiptA4Customer] = useState<ReceiptA4CustomerInfo>(EMPTY_RECEIPT_A4_CUSTOMER)
  const [receiptA4ShowSignature, setReceiptA4ShowSignature] = useState(false)
  const [receiptA4SignatureEmployees, setReceiptA4SignatureEmployees] = useState<ReceiptA4SignatureEmployee[]>([])
  const [receiptA4SignatureEmployeesLoading, setReceiptA4SignatureEmployeesLoading] = useState(false)
  const [receiptA4SignatureEmployeeId, setReceiptA4SignatureEmployeeId] = useState('')
  const [receiptA4SignatureUrl, setReceiptA4SignatureUrl] = useState('')
  const [receiptA4SignatureName, setReceiptA4SignatureName] = useState('')
  const [receiptA4SignatureDate, setReceiptA4SignatureDate] = useState(toReceiptA4InputDate(new Date()))
  const [receiptA4SignatureLoading, setReceiptA4SignatureLoading] = useState(false)

  // Tax invoice (Gen Tax) modal state
  const [showTaxInvoiceModal, setShowTaxInvoiceModal] = useState(false)
  const [taxInvoiceLoading, setTaxInvoiceLoading] = useState(false)
  const [taxInvoiceSale, setTaxInvoiceSale] = useState<any>(null)
  const [taxInvoiceItems, setTaxInvoiceItems] = useState<any[]>([])
  const [taxInvoiceCustomerList, setTaxInvoiceCustomerList] = useState<any[]>([])
  const [taxInvoiceCustomer, setTaxInvoiceCustomer] = useState<TaxInvoiceCustomerInfo>(EMPTY_TAX_INVOICE_CUSTOMER)
  const [taxInvoiceCustomerOpen, setTaxInvoiceCustomerOpen] = useState(false)
  const [taxInvoiceCustomerQuery, setTaxInvoiceCustomerQuery] = useState('')
  const [taxInvoiceNo, setTaxInvoiceNo] = useState('')
  const [taxInvoiceDate, setTaxInvoiceDate] = useState(toReceiptA4InputDate(new Date()))
  const [taxInvoiceCopies, setTaxInvoiceCopies] = useState<Record<TaxInvoiceCopyOption, boolean>>({ original: true, copy: true })
  const [taxInvoicePdfBusy, setTaxInvoicePdfBusy] = useState(false)
  const [taxInvoiceSavingCustomer, setTaxInvoiceSavingCustomer] = useState(false)
  const [taxInvoiceSaveMessage, setTaxInvoiceSaveMessage] = useState('')

  // Delivery note (ใบส่งสินค้า) modal state
  const [showDeliveryNoteModal, setShowDeliveryNoteModal] = useState(false)
  const [deliveryNoteLoading, setDeliveryNoteLoading] = useState(false)
  const [deliveryNoteSavingCustomer, setDeliveryNoteSavingCustomer] = useState(false)
  const [deliveryNoteSaveMessage, setDeliveryNoteSaveMessage] = useState('')
  const [deliveryNoteSale, setDeliveryNoteSale] = useState<any>(null)
  const [deliveryNoteItems, setDeliveryNoteItems] = useState<any[]>([])
  const [deliveryNoteCustomer, setDeliveryNoteCustomer] = useState<ReceiptA4CustomerInfo>(EMPTY_RECEIPT_A4_CUSTOMER)
  const [deliveryNoteShowSender, setDeliveryNoteShowSender] = useState(true)
  const [deliveryNoteCustomerList, setDeliveryNoteCustomerList] = useState<any[]>([])
  const [deliveryNoteCustomerOpen, setDeliveryNoteCustomerOpen] = useState(false)
  const [deliveryNoteCustomerQuery, setDeliveryNoteCustomerQuery] = useState('')

  const fetchReceiptA4SignatureEmployees = async () => {
    const companyS = localStorage.getItem('company_') || ''
    if (!companyS) {
      setReceiptA4SignatureEmployees([])
      return [] as ReceiptA4SignatureEmployee[]
    }
    setReceiptA4SignatureEmployeesLoading(true)
    try {
      const res = await axios.get(`/api/setting/employee?id_company=${companyS}`)
      const rows = Array.isArray(res.data) ? res.data : []
      setReceiptA4SignatureEmployees(rows)
      return rows as ReceiptA4SignatureEmployee[]
    } catch (error) {
      console.error(error)
      setReceiptA4SignatureEmployees([])
      return [] as ReceiptA4SignatureEmployee[]
    } finally {
      setReceiptA4SignatureEmployeesLoading(false)
    }
  }

  const loadReceiptA4Signature = async (employeeId: string) => {
    if (!employeeId) {
      setReceiptA4SignatureUrl('')
      return
    }
    const companyS = localStorage.getItem('company_') || 'default'
    setReceiptA4SignatureLoading(true)
    try {
      const res = await axios.get(`/api/setting/employee-signature?employeeId=${encodeURIComponent(employeeId)}&company=${encodeURIComponent(companyS)}`)
      setReceiptA4SignatureUrl(res.data?.signatureUrl ? `${res.data.signatureUrl}?v=${Date.now()}` : '')
    } catch (error) {
      console.error(error)
      setReceiptA4SignatureUrl('')
    } finally {
      setReceiptA4SignatureLoading(false)
    }
  }

  const handleReceiptA4SignatureEmployeeChange = (employeeId: string) => {
    setReceiptA4SignatureEmployeeId(employeeId)
    const employee = receiptA4SignatureEmployees.find((item) => String(item.id) === employeeId)
    if (employee) {
      setReceiptA4SignatureName(getReceiptA4SignatureEmployeeLabel(employee))
    }
  }

  const handleToggleReceiptA4Signature = async () => {
    const nextShow = !receiptA4ShowSignature
    setReceiptA4ShowSignature(nextShow)
    if (!nextShow) return

    let employees = receiptA4SignatureEmployees
    if (employees.length === 0) {
      employees = await fetchReceiptA4SignatureEmployees()
    }

    if (!receiptA4SignatureDate) {
      setReceiptA4SignatureDate(toReceiptA4InputDate(new Date()))
    }
    if (!receiptA4SignatureName) {
      setReceiptA4SignatureName(String(receiptA4Sale?.personall || localStorage.getItem('person_') || '').trim())
    }
    if (!receiptA4SignatureEmployeeId && employees.length > 0) {
      const currentEmployeeId = localStorage.getItem('personid_') || ''
      const currentEmployee = employees.find((item) => String(item.id) === currentEmployeeId) || employees[0]
      if (currentEmployee) {
        setReceiptA4SignatureEmployeeId(String(currentEmployee.id))
        setReceiptA4SignatureName(getReceiptA4SignatureEmployeeLabel(currentEmployee))
      }
    }
  }

  useEffect(() => {
    if (!receiptA4SignatureEmployeeId) {
      setReceiptA4SignatureUrl('')
      return
    }
    void loadReceiptA4Signature(receiptA4SignatureEmployeeId)
  }, [receiptA4SignatureEmployeeId])

  // Auto-load DailyClose record when the modal opens
  useEffect(() => {
    if (!showCloseModal || closeTab !== 'form' || closeData) return
    let cancelled = false
    ;(async () => {
      const company = (typeof window !== 'undefined' && (localStorage.getItem('company_') || '')) || ''
      const employeeNow = (typeof window !== 'undefined' && (localStorage.getItem('user_') || localStorage.getItem('person_') || '')) || ''
      const todayStr = all.search_date || new Date().toLocaleDateString('sv-SE')
      const resolvedEmployee = effectiveUserFilter !== 'all' ? effectiveUserFilter : employeeNow
      try {
        const r = await fetch(`/api/dailyclose?date=${todayStr}&company=${encodeURIComponent(company)}&employee=${encodeURIComponent(resolvedEmployee)}`, { cache: 'no-store' })
        const existing = await r.json()
        if (cancelled) return
        if (existing && existing.id) {
          setCloseData({ ...existing, closeDate: String(existing.closeDate).slice(0, 10) })
          return
        }

        if (cancelled) return

        const totalNet = dailyReportMetrics.totalNet
        const cash = dailyReportMetrics.cashTotal
        const transfer = dailyReportMetrics.transferTotal
        const promptpay = dailyReportMetrics.promptpayTotal
        const other = dailyReportMetrics.otherTotal
        const now = new Date()
        const hh = activeWindow?.start?.slice(0, 2) || String(now.getHours()).padStart(2, '0')
        const mm = activeWindow?.start?.slice(3, 5) || String(now.getMinutes()).padStart(2, '0')
        const endHH = activeWindow?.end?.slice(0, 2) || String(now.getHours()).padStart(2, '0')
        const endMM = activeWindow?.end?.slice(3, 5) || String(now.getMinutes()).padStart(2, '0')
        setCloseData({
          company,
          closeDate: todayStr,
          workTimeStart: `${hh}:${mm}`,
          workTimeEnd: `${endHH}:${endMM}`,
          salesTotal: totalNet,
          promptpayTotal: promptpay,
          transferTotal: transfer,
          cashTotal: cash,
          otherTotal: other,
          cashDeliver: cash,
          note: filtersActive ? `ช่วงข้อมูล: ${activeFilterLabel}` : '',
          b1000: 0, b500: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, b2: 0, b1: 0,
          changeAmount: 0, drawerBalance: 0,
          employeeName: resolvedEmployee,
          branchName: company,
          status: 'draft',
        })
      } catch {}
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCloseModal, closeTab, closeData, dailyReportMetrics, filtersActive, activeFilterLabel, activeWindow, userFilter, all.search_date])

  // Reset close data when modal is closed
  useEffect(() => {
    setCloseBackup({ status: 'idle' })
    if (!showCloseModal) {
      setCloseData(null)
      setCloseHistory([])
    }
  }, [showCloseModal])

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const companyS = localStorage.getItem('company_') || ''
        const res = await axios.get(`/api/setting/store/store?company=${companyS}`)
        const s = res.data?.[0]
        if (s) {
          setStoreS(s.namestore || '')
          setAddressS(s.address || '')
          setTelS(s.tel || '')
          setTaxS(s.taxnumber || '')
          setUploadedUrl(s.publiclogo || null)
        }
      } catch (e) { console.error(e) }
    }
    fetchStore()
    fetchReceiptA4SignatureEmployees()
    // fetch payment providers for transferDetail label lookup
    ;(async () => {
      try {
        const companyS = localStorage.getItem('company_') || ''
        const res = await fetch(`/api/setting/payment-provider?company=${encodeURIComponent(companyS)}`)
        const data = await res.json()
        if (Array.isArray(data)) {
          const map: Record<string, string> = {}
          data.forEach((p: any) => { if (p.provider && p.displayName) map[p.provider] = p.displayName })
          setProviderMap(map)
        }
      } catch {}
    })()
    const savedPrinter = localStorage.getItem('auto_printer_rc')
    if (savedPrinter) setSelectedPrinter_rc(savedPrinter)
  }, [])

  const handleReactToPrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: 'ใบเสร็จรับเงิน',
  });

  const handlePrint = async () => {
    if (!idDatalist) return
    // Get sale items and sale main for this receipt
    const companyS = localStorage.getItem('company_') || ''
    try {
      const [resItems, resMain] = await Promise.all([
        axios.get(`/api/salelist?company=${companyS}&id_salemain=${Number(idDatalist)}`),
        axios.get(`/api/sale/${Number(idDatalist)}`)
      ])
      const list = resItems.data || []
      const alldatalist = resMain.data || {}
      const receiptGrossTotal = Number(alldatalist.totalall || 0)
      const receiptBillDiscount = Number(alldatalist.discount || 0) + Number(alldatalist.promotion || 0)
      const receiptMemberDiscount = Number(alldatalist.memberDiscount || 0)
      const receiptRewardDiscount = Number(alldatalist.usereward || 0)
      const receiptNetTotal = Number(alldatalist.sumtotal ?? (receiptGrossTotal - receiptBillDiscount - receiptMemberDiscount - receiptRewardDiscount))
      const receiptServiceCharge = Number(alldatalist.serviceCharge || 0)
      const receiptServiceChargePct = Number(alldatalist.serviceChargePercent || 0)
      const receiptGrandDue = Number((receiptNetTotal + receiptServiceCharge).toFixed(2))
      const fmtReceipt2 = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

      if (isSilentPrintAvailable()) {
        // Thermal receipt print (same as sales page)
        const paperSize = localStorage.getItem('receipt_paper_size') || '80'
        const is58 = paperSize === '58'
        const paperW = getThermalReceiptPaperWidth(is58)
        const horizontalOffset = getThermalReceiptHorizontalOffset(is58)
        const fontSize_header = is58 ? '12px' : '15px'
        const fontSize_store = is58 ? '15px' : '19px'
        const fontSize_body = is58 ? '9px' : '11px'
        const fontSize_item = is58 ? '9px' : '11px'
        const fontSize_th = is58 ? '7px' : '8.5px'
        const fontSize_footer = is58 ? '9px' : '11px'
        const fontSize_total = is58 ? '11px' : '13px'
        const separator = is58 ? '------------------------' : '--------------------------------------'
        const logoSize = is58 ? '40px' : '50px'
        const personName = localStorage.getItem('person_') || ''
        const name_cus = list[0]?.code_costomer || 'ลูกค้าทั่วไป'
        const createDate = list[0]?.createDate ? new Date(list[0].createDate) : new Date()
        const receiptItemRows = list.map((saleItem: any) => {
          const unitLabel = String(saleItem.unit || '').trim()
          const qtyLabel = `${saleItem.qty}${unitLabel ? ` ${unitLabel}` : ''}`
          const discountValue = Number(saleItem.discount || 0)

          return `
            <div class="receipt-sale-item" style="font-size: ${fontSize_item};">
              <div class="receipt-sale-main">
                <div class="receipt-sale-name">${saleItem.name_product}</div>
                <div class="receipt-sale-total">${saleItem.total}</div>
              </div>
              <div class="receipt-sale-line">
                <div class="receipt-sale-detail">${qtyLabel} x ${saleItem.price}</div>
              </div>
              ${discountValue > 0 ? `<div class="receipt-sale-discount">ลด ${saleItem.discount}</div>` : ''}
            </div>
          `
        }).join('')

        const content = `
          ${getThermalReceiptPrintStyles(paperW, is58)}
          <div class="thermal-receipt" style="width: ${paperW}; max-width: ${paperW}; background-color: white; box-sizing: border-box; font-family: 'Kanit'; justify-self: left; overflow: visible; margin: 0;">
            <div style="width: 100%; display: flex; justify-content: center; margin-bottom: 5px;">
              ${uploadedUrl && String(uploadedUrl) !== '' ? `<img src="${String(uploadedUrl)}" style="width: ${logoSize}; height: ${logoSize};" />` : ''}
            </div>
            <div style="text-align: center; font-size: ${fontSize_header}; font-family: 'Kanit';">ใบเสร็จรับเงิน</div>
            <div style="text-align: center; font-size: ${fontSize_store}; font-family: 'Kanit'; font-weight: bold;">${storeS}</div>
            <div style="text-align: center; font-size: ${fontSize_body}; font-family: 'Kanit'; word-break: break-word;">${addressS}</div>
            <div style="text-align: center; font-size: ${fontSize_body}; font-family: 'Kanit';">เลขที่ผู้เสียภาษี : ${taxS}</div>
            <div style="text-align: center; font-size: ${fontSize_body}; font-family: 'Kanit';">โทร : ${telS}</div>
            <div style="text-align: center; font-size: ${fontSize_body}; font-family: 'Kanit';">${separator}</div>
            <div style="font-size: ${fontSize_body}; font-family: 'Kanit'; text-align: left;">พนักงานขาย : ${list[0]?.person || personName}</div>
            <div style="font-size: ${fontSize_body}; font-family: 'Kanit'; text-align: left;">
              วันที่ : ${createDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}&nbsp;&nbsp;&nbsp;
              ${createDate.toLocaleTimeString('en-US', { hour12: false, hour: 'numeric', minute: 'numeric' })}
            </div>
            <div style="text-align: center; font-size: ${fontSize_body}; font-family: 'Kanit';">${separator}</div>
            <div style="font-size: ${fontSize_body}; font-family: 'Kanit'; text-align: left;">ลูกค้า : ${name_cus}</div>
            <div style="text-align: center; font-size: ${fontSize_body}; font-family: 'Kanit';">${separator}</div>

            <div class="receipt-sale-header" style="font-size: ${fontSize_th};">
              <div>รายการ</div>
              <div class="receipt-sale-header-total">รวม</div>
            </div>
            ${receiptItemRows}

            <div style="text-align: center; font-size: ${fontSize_body}; font-family: 'Kanit'; margin-top: 3px;">${separator}</div>
            <div style="font-size: ${fontSize_body}; font-family: 'Kanit'; text-align: left;">ทั้งหมด : ${list.length} รายการ  ชำระ : ${alldatalist.pay === 'payment' || alldatalist.pay === 'โอน' ? 'โอน' : alldatalist.pay === 'cash' || alldatalist.pay === 'เงินสด' ? 'เงินสด' : alldatalist.pay === 'เงินสด+โอน' ? 'แยกจ่าย' : alldatalist.pay || ''}</div>
            ${String(alldatalist.pay) === 'เงินสด+โอน' ? `<div style="font-size: ${fontSize_body}; font-family: 'Kanit'; text-align: left;">เงินสด: ${Number(alldatalist.cashAmount || 0).toFixed(0)} บาท / โอน: ${Number(alldatalist.transferAmount || 0).toFixed(0)} บาท</div>` : ''}

            ${is58 ? `
            <div style="font-size: ${fontSize_footer}; font-family: 'Kanit'; margin-top: 3px;">
              <div style="display: flex; justify-content: space-between; padding: 1px 0;"><span>รวมเงิน :</span><span>${receiptGrossTotal} บ.</span></div>
              <div style="display: flex; justify-content: space-between; padding: 1px 0;"><span>ส่วนลด :</span><span>${receiptBillDiscount} บ.</span></div>
              ${receiptMemberDiscount > 0 ? `<div style="display: flex; justify-content: space-between; padding: 1px 0;"><span>ส่วนลดสมาชิก :</span><span>${receiptMemberDiscount.toLocaleString()} บ.</span></div>` : ''}
              <div style="display: flex; justify-content: space-between; padding: 1px 0;"><span>ใช้แต้มส่วนลด :</span><span>${receiptRewardDiscount} บ.</span></div>
              <div class="receipt-grand-total" style="display: flex; justify-content: space-between; padding: 3px 0 1px 0; font-size: ${fontSize_total}; font-weight: bold; border-top: 1px dashed black; margin-top: 2px;"><span>ยอดสุทธิ :</span><span>${receiptNetTotal.toLocaleString()} บ.</span></div>
              ${receiptServiceCharge > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 1px 0;"><span>ค่าธรรมเนียมบัตร${receiptServiceChargePct > 0 ? ` ${receiptServiceChargePct}%` : ''} :</span><span>+${fmtReceipt2(receiptServiceCharge)} บ.</span></div>
              <div style="display: flex; justify-content: space-between; padding: 1px 0; font-size: ${fontSize_total}; font-weight: bold;"><span>ยอดเรียกเก็บรวม :</span><span>${fmtReceipt2(receiptGrandDue)} บ.</span></div>
              ` : ''}
            </div>
            ` : `
            <table style="width: 100%; border-collapse: collapse; table-layout: fixed; font-family: 'Kanit'; margin-top: 10px;">
              <colgroup><col style="width: auto;"/><col style="width: 96px;"/></colgroup>
              <tbody>
                <tr style="font-size: ${fontSize_footer};"><td style="text-align: right; padding: 1px 2px 1px 0;">รวมเงิน :</td><td style="text-align: right; padding: 1px 0; white-space: nowrap;">${receiptGrossTotal} บาท</td></tr>
                <tr style="font-size: ${fontSize_footer};"><td style="text-align: right; padding: 1px 2px 1px 0;">ส่วนลด :</td><td style="text-align: right; padding: 1px 0; white-space: nowrap;">${receiptBillDiscount} บาท</td></tr>
                ${receiptMemberDiscount > 0 ? `<tr style="font-size: ${fontSize_footer};"><td style="text-align: right; padding: 1px 2px 1px 0;">ส่วนลดสมาชิก :</td><td style="text-align: right; padding: 1px 0; white-space: nowrap;">${receiptMemberDiscount.toLocaleString()} บาท</td></tr>` : ''}
                <tr style="font-size: ${fontSize_footer};"><td style="text-align: right; padding: 1px 2px 1px 0;">ใช้แต้มส่วนลด :</td><td style="text-align: right; padding: 1px 0; white-space: nowrap;">${receiptRewardDiscount.toLocaleString()} บาท</td></tr>
                <tr class="receipt-grand-total" style="font-size: ${fontSize_total}; font-weight: bold;"><td style="text-align: right; padding: 4px 2px 1px 0;">ยอดรวมสุทธิ :</td><td style="text-align: right; padding: 4px 0 1px 0; white-space: nowrap;">${receiptNetTotal.toLocaleString()} บาท</td></tr>
                ${receiptServiceCharge > 0 ? `
                <tr style="font-size: ${fontSize_footer};"><td style="text-align: right; padding: 1px 2px 1px 0;">ค่าธรรมเนียมบัตร${receiptServiceChargePct > 0 ? ` ${receiptServiceChargePct}%` : ''} :</td><td style="text-align: right; padding: 1px 0; white-space: nowrap;">+${fmtReceipt2(receiptServiceCharge)} บาท</td></tr>
                <tr style="font-size: ${fontSize_total}; font-weight: bold;"><td style="text-align: right; padding: 1px 2px 1px 0;">ยอดเรียกเก็บรวม :</td><td style="text-align: right; padding: 1px 0; white-space: nowrap;">${fmtReceipt2(receiptGrandDue)} บาท</td></tr>
                ` : ''}
              </tbody>
            </table>
            `}
          </div>
        `

        try {
          await printSilent({
            content: content,
            printerName: selectedPrinter_rc,
            horizontalOffset
          })
        } catch (error) {
          console.error('Printing failed:', error)
          alert('การพิมพ์ล้มเหลว')
        }
      } else {
        // Fallback: use browser print dialog with ReceiptItem
        handleReactToPrint()
      }
    } catch (error) {
      console.error('Print error:', error)
      handleReactToPrint()
    }
  }

  const openReceiptA4Modal = async () => {
    if (!idDatalist) {
      window.alert('กรุณาเลือกรายการขายก่อนพิมพ์ใบเสร็จ A4')
      return
    }

    const companyS = localStorage.getItem('company_') || ''
    setReceiptA4Loading(true)
    setReceiptA4SaveMessage('')
    setReceiptA4ShowSignature(false)
    setReceiptA4SignatureEmployeeId('')
    setReceiptA4SignatureUrl('')
    setReceiptA4SignatureDate(toReceiptA4InputDate(new Date()))
    setShowReceiptA4Modal(true)

    try {
      const [resItems, resMain, resCustomer] = await Promise.all([
        axios.get(`/api/salelist?company=${companyS}&id_salemain=${Number(idDatalist)}`),
        axios.get(`/api/sale/${Number(idDatalist)}`),
        axios.get(`/api/customer?company=${companyS}`),
      ])

      const sale = resMain.data || {}
      const items = Array.isArray(resItems.data) ? resItems.data : []
      const customers = Array.isArray(resCustomer.data) ? resCustomer.data : []
      const customer = customers.find((item: any) => {
        return String(item.id || '') === String(sale.id_costomer || '') || String(item.code || '') === String(sale.code_costomer || '')
      })

      setReceiptA4Sale(sale)
      setReceiptA4Items(items)
      setReceiptA4SignatureName(String(sale.personall || localStorage.getItem('person_') || '').trim())
      setReceiptA4Customer({
        id: String(customer?.id || sale.id_costomer || ''),
        code: String(sale.code_costomer || customer?.code || ''),
        name: String(customer?.names || sale.code_costomer || 'ลูกค้าทั่วไป'),
        taxId: String(customer?.numbertax || ''),
        tel: String(customer?.tel || ''),
        address: String(customer?.address || ''),
        branch: String(customer?.branch || ''),
        note: '',
      })
    } catch (error) {
      console.error('Load A4 receipt data error:', error)
      window.alert('ไม่สามารถโหลดข้อมูลใบเสร็จ A4 ได้')
      setShowReceiptA4Modal(false)
    } finally {
      setReceiptA4Loading(false)
    }
  }

  const updateReceiptA4Customer = (field: keyof ReceiptA4CustomerInfo, value: string) => {
    setReceiptA4Customer((current) => ({ ...current, [field]: value }))
    setReceiptA4SaveMessage('')
  }

  const handleSaveReceiptA4Customer = async () => {
    const customerId = Number(receiptA4Customer.id || receiptA4Sale?.id_costomer || 0)

    setReceiptA4SavingCustomer(true)
    setReceiptA4SaveMessage('')

    try {
      const companyS = localStorage.getItem('company_') || ''
      const fallbackCode = receiptA4Sale?.id ? `A4-${receiptA4Sale.id}` : `A4-${Date.now()}`
      const payload = {
        code: receiptA4Customer.code.trim() || fallbackCode,
        names: receiptA4Customer.name.trim() || 'ลูกค้าทั่วไป',
        numbertax: receiptA4Customer.taxId.trim(),
        tel: receiptA4Customer.tel.trim(),
        branch: receiptA4Customer.branch.trim(),
        address: receiptA4Customer.address.trim(),
      }

      const response = customerId
        ? await axios.put(`/api/customer/${customerId}`, payload)
        : await axios.post('/api/customer', {
            company: companyS,
            ...payload,
            pointStart: 0,
            point: 0,
            totalPoint: 0,
            statuss: 'ใช้งาน',
            drugallergys: [],
          })
      const updated = response.data || {}
      const updatedCode = String(updated.code ?? payload.code)
      const updatedName = String(updated.names ?? payload.names)

      setReceiptA4Customer((current) => ({
        ...current,
        id: String(updated.id || customerId),
        code: updatedCode,
        name: updatedName,
        taxId: String(updated.numbertax ?? payload.numbertax),
        tel: String(updated.tel ?? payload.tel),
        branch: String(updated.branch ?? payload.branch),
        address: String(updated.address ?? payload.address),
      }))
      setReceiptA4Sale((current: any) => current ? ({ ...current, id_costomer: updated.id || customerId, code_costomer: updatedCode }) : current)
      setCustomerMap((current) => ({ ...current, [updatedCode]: updatedName }))
      setReceiptA4SaveMessage(customerId ? 'บันทึกข้อมูลลูกค้าแล้ว' : 'สร้างและบันทึกลูกค้าใหม่แล้ว')
    } catch (error) {
      console.error('Save A4 receipt customer error:', error)
      setReceiptA4SaveMessage('บันทึกข้อมูลลูกค้าไม่สำเร็จ')
    } finally {
      setReceiptA4SavingCustomer(false)
    }
  }

  const handlePrintReceiptA4 = () => {
    if (!receiptA4Sale) return

    const sale = receiptA4Sale
    const items = receiptA4Items
    const activeItems = items.filter((item: any) => item.statuss !== 'ยกเลิก')
    const receiptDateTime = getReceiptDateTime(sale.createDate)
    const printedAt = getReceiptDateTime(new Date())
    const isCancelled = sale.statussall === 'ยกเลิก'
    const receiptNo = sale.orderNo || sale.taxInvoiceNo || sale.id || '-'
    const cashierName = sale.personall || activeItems[0]?.person || getLocalStorageItem('person_') || '-'
    const grossTotal = isCancelled ? 0 : Number(sale.totalall || activeItems.reduce((sum: number, item: any) => sum + Number(item.total || 0), 0))
    const billDiscount = isCancelled ? 0 : Number(sale.discount || 0) + Number(sale.promotion || 0)
    const memberDiscount = isCancelled ? 0 : Number(sale.memberDiscount || 0)
    const rewardDiscount = isCancelled ? 0 : Number(sale.usereward || 0)
    const beforeVat = isCancelled ? 0 : Number(sale.beforeVat || 0)
    const vatAmount = isCancelled ? 0 : Number(sale.vatAmount || 0)
    const netTotal = isCancelled ? 0 : Number(sale.sumtotal ?? (grossTotal - billDiscount - memberDiscount - rewardDiscount))
    const receiptA4ServiceCharge = isCancelled ? 0 : Number(sale.serviceCharge || 0)
    const receiptA4ServiceChargePct = Number(sale.serviceChargePercent || 0)
    const receiptA4GrandDue = Number((netTotal + receiptA4ServiceCharge).toFixed(2))
    const hasVat = vatAmount > 0 || Boolean(sale.taxInvoiceNo)
    const companyName = storeS || getLocalStorageItem('company_') || '-'
    const logoHtml = uploadedUrl
      ? `<img class="store-logo" src="${escapeHtml(uploadedUrl)}" alt="logo" />`
      : `<div class="store-logo-fallback">${escapeHtml(String(companyName).slice(0, 2).toUpperCase())}</div>`

    const itemRowsHtml = items.map((item: any, index: number) => {
      const rowCancelled = item.statuss === 'ยกเลิก'
      return `<tr class="${rowCancelled ? 'cancelled-row' : ''}">
        <td class="text-center">${index + 1}</td>
        <td>${escapeHtml(item.code_product || '-')}</td>
        <td>
          <div class="item-name">${escapeHtml(item.name_product || '-')}</div>
          ${rowCancelled ? '<div class="item-status">ยกเลิกรายการ</div>' : ''}
        </td>
        <td class="text-right">${formatReceiptCurrency(item.qty, 0)}</td>
        <td class="text-center">${escapeHtml(item.unit || '-')}</td>
        <td class="text-right">${formatReceiptCurrency(item.price)}</td>
        <td class="text-right">${Number(item.discount || 0) > 0 ? formatReceiptCurrency(item.discount) : '-'}</td>
        <td class="text-right total-cell">${formatReceiptCurrency(rowCancelled ? 0 : item.total)}</td>
      </tr>`
    }).join('')

    const vatRowsHtml = hasVat
      ? `<div class="summary-row muted"><span>มูลค่าสินค้าก่อน VAT</span><strong>${formatReceiptCurrency(beforeVat)} บาท</strong></div>
         <div class="summary-row muted"><span>ภาษีมูลค่าเพิ่ม 7%</span><strong>${formatReceiptCurrency(vatAmount)} บาท</strong></div>`
      : ''

    const paymentDetailHtml = sale.pay === 'เงินสด+โอน'
      ? `<div class="payment-split"><span>เงินสด ${formatReceiptCurrency(sale.cashAmount)} บาท</span><span>โอน ${formatReceiptCurrency(sale.transferAmount)} บาท</span></div>`
      : ''

    const customerBranchHtml = receiptA4Customer.branch
      ? `<div><span>สาขา</span><strong>${escapeHtml(receiptA4Customer.branch)}</strong></div>`
      : ''

    const customerNoteHtml = receiptA4Customer.note
      ? `<div class="customer-note">${escapeHtml(receiptA4Customer.note)}</div>`
      : ''

    const receiptA4SignerName = String(receiptA4SignatureName || cashierName || '').trim() || '-'
    const receiptA4SignerDate = formatReceiptA4SignatureDate(receiptA4SignatureDate)
    const receiptA4SignatureImageHtml = receiptA4ShowSignature && receiptA4SignatureUrl
      ? `<img class="signature-image" src="${escapeHtml(receiptA4SignatureUrl)}" alt="signature" />`
      : ''
    const receiptA4ReceiverSignatureHtml = receiptA4ShowSignature
      ? `<div class="signature-content">
          ${receiptA4SignatureImageHtml}
          <div class="signature-name">${escapeHtml(receiptA4SignerName)}</div>
          <div class="signature-date">วันที่ ${escapeHtml(receiptA4SignerDate)}</div>
        </div>
        <div class="signature-line">ผู้รับเงิน</div>`
      : `<div class="signature-content"></div><div class="signature-line">ผู้รับเงิน</div>`

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      window.alert('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ กรุณาอนุญาต pop-up ของเบราว์เซอร์')
      return
    }

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>ใบเสร็จรับเงิน A4 ${escapeHtml(String(receiptNo))}</title>
  <style>
    @font-face { font-family: Kanit; src: url('/fonts/Kanit-Regular.ttf') format('truetype'); font-weight: 400; }
    @font-face { font-family: Kanit; src: url('/fonts/Kanit-SemiBold.ttf') format('truetype'); font-weight: 700; }
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #eef2f7; color: #0f172a; font-family: Kanit, Arial, sans-serif; font-size: 11px; }
    .sheet { width: 186mm; min-height: auto; margin: 0 auto; padding: 0; background: #fff; }
    .top-accent { height: 2px; background: #0f172a; }
    .sheet-inner { padding: 4mm 6mm 3mm; }
    .header-bar { display: flex; justify-content: space-between; align-items: center; gap: 4mm; padding-bottom: 1.5mm; border-bottom: 1px solid #cbd5e1; }
    .store-block { display: flex; align-items: center; gap: 2mm; }
    .store-logo, .store-logo-fallback { width: 8mm; height: 8mm; flex-shrink: 0; }
    .store-logo { object-fit: contain; }
    .store-logo-fallback { border-radius: 4px; background: #e2e8f0; color: #0f172a; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px; }
    .store-text { line-height: 1.35; }
    .store-name { font-size: 12.5px; font-weight: 700; color: #0f172a; letter-spacing: 0.2px; }
    .store-meta { color: #475569; font-size: 9px; line-height: 1.4; }
    .doc-box { text-align: right; }
    .doc-title-inline { font-size: 13px; font-weight: 700; color: #0f172a; letter-spacing: 0.3px; }
    .doc-title-inline span { font-size: 8px; letter-spacing: 1.5px; color: #475569; margin-left: 5px; }
    .doc-meta-inline { display: flex; gap: 9px; justify-content: flex-end; flex-wrap: wrap; font-size: 9.5px; color: #475569; margin-top: 2px; }
    .doc-meta-inline strong { color: #0f172a; font-weight: 700; }
    .status-badge { display: inline-flex; align-items: center; padding: 1px 6px; border-radius: 999px; font-size: 8.5px; font-weight: 700; border: 1px solid #0f172a; background: ${isCancelled ? '#0f172a' : '#fff'}; color: ${isCancelled ? '#fff' : '#0f172a'}; }
    .info-bar { display: flex; flex-wrap: wrap; gap: 1.5mm 6mm; padding: 1.5mm 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 1.5mm; font-size: 9.5px; }
    .info-bar > div { display: flex; gap: 4px; align-items: baseline; white-space: nowrap; }
    .info-bar span { color: #64748b; }
    .info-bar strong { color: #0f172a; font-weight: 700; }
    .customer-note { flex-basis: 100%; white-space: pre-wrap; color: #334155; }
    .section-heading { padding: 2px 6px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 700; }
    .section-body { padding: 3px 6px; display: grid; gap: 1px; }
    .section-body div { display: flex; gap: 8px; align-items: baseline; }
    .section-body span { min-width: 24mm; color: #64748b; }
    .section-body strong { color: #0f172a; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; }
    .items { margin-top: 2mm; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; }
    thead { display: table-header-group; }
    th { padding: 3px 6px; background: #1e293b; color: #fff; font-size: 10px; font-weight: 700; text-align: left; }
    td { padding: 2px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; font-size: 10.5px; }
    tbody tr:nth-child(even) td { background: #f8fafc; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .item-name { font-weight: 700; color: #0f172a; }
    .item-status { margin-top: 1px; font-size: 9px; color: #475569; }
    .cancelled-row td { color: #64748b; text-decoration: line-through; background: #f1f5f9 !important; }
    .cancelled-row .item-status { text-decoration: none; }
    .total-cell { font-weight: 700; color: #0f172a; }
    .footer-area { display: grid; grid-template-columns: 1fr 72mm; gap: 3mm; margin-top: 2mm; align-items: start; }
    .payment-card { border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
    .payment-card .section-body { gap: 2px; }
    .payment-split { display: flex !important; gap: 8px; margin-top: 1px; color: #475569; }
    .summary-card { border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; }
    .summary-row { display: flex; justify-content: space-between; gap: 10px; padding: 2px 8px; border-bottom: 1px solid #e2e8f0; }
    .summary-row span { color: #475569; }
    .summary-row strong { font-weight: 700; color: #0f172a; }
    .summary-row.muted { background: #f8fafc; }
    .summary-row.net { background: #0f172a; color: #fff; border-bottom: 0; }
    .summary-row.net span, .summary-row.net strong { color: #fff; font-size: 13px; }
    .signatures { display: grid; grid-template-columns: repeat(2, 1fr); gap: 3mm; margin-top: 4mm; page-break-inside: avoid; }
    .signature-box { text-align: center; color: #475569; }
    .signature-content { height: 7mm; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 1mm; padding-bottom: 1mm; }
    .signature-image { display: block; max-width: 78%; max-height: 6mm; object-fit: contain; }
    .signature-name { color: #0f172a; font-weight: 700; line-height: 1.2; }
    .signature-date { color: #475569; font-size: 9px; line-height: 1.2; }
    .signature-line { border-top: 1px solid #94a3b8; padding-top: 3px; }
    .print-footer { margin-top: 2mm; padding-top: 1mm; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; color: #94a3b8; font-size: 9px; }
    @media print {
      body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .sheet { width: auto; min-height: auto; margin: 0; }
      .sheet-inner { padding: 0; }
      tr, .section, .summary-card, .payment-card, .signatures { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="top-accent"></div>
    <div class="sheet-inner">
      <div class="header-bar">
        <div class="store-block">
          ${logoHtml}
          <div class="store-text">
            <div class="store-name">${escapeHtml(companyName)}</div>
            <div class="store-meta">${escapeHtml(addressS || '-')} | ภาษี: ${escapeHtml(taxS || '-')} | โทร: ${escapeHtml(telS || '-')}</div>
          </div>
        </div>
        <div class="doc-box">
          <div class="doc-title-inline">ใบเสร็จรับเงิน<span>OFFICIAL RECEIPT</span></div>
          <div class="doc-meta-inline">
            <span>เลขที่ <strong>${escapeHtml(receiptNo)}</strong></span>
            <span>วันที่ <strong>${escapeHtml(receiptDateTime.date)}</strong></span>
            <span>เวลา <strong>${escapeHtml(receiptDateTime.time)}</strong></span>
            <span class="status-badge">${isCancelled ? 'ยกเลิก' : 'สมบูรณ์'}</span>
          </div>
        </div>
      </div>

      <div class="info-bar">
        <div><span>ลูกค้า</span><strong>${escapeHtml(receiptA4Customer.name || 'ลูกค้าทั่วไป')}</strong></div>
        <div><span>รหัส</span><strong>${escapeHtml(receiptA4Customer.code || '-')}</strong></div>
        <div><span>ผู้เสียภาษี</span><strong>${escapeHtml(receiptA4Customer.taxId || '-')}</strong></div>
        <div><span>โทร</span><strong>${escapeHtml(receiptA4Customer.tel || '-')}</strong></div>
        ${customerBranchHtml}
        <div><span>ที่อยู่</span><strong>${escapeHtml(receiptA4Customer.address || '-')}</strong></div>
        <div><span>พนักงาน</span><strong>${escapeHtml(cashierName)}</strong></div>
        <div><span>ชำระโดย</span><strong>${escapeHtml(getReceiptPaymentLabel(sale))}</strong></div>
        <div><span>จำนวน</span><strong>${activeItems.length} รายการ</strong></div>
        ${sale.taxInvoiceNo ? `<div><span>เลขใบกำกับ</span><strong>${escapeHtml(sale.taxInvoiceNo)}</strong></div>` : ''}
        ${customerNoteHtml}
      </div>

      <div class="items">
        <table>
          <thead>
            <tr>
              <th style="width:7%" class="text-center">#</th>
              <th style="width:13%">รหัส</th>
              <th>รายการสินค้า</th>
              <th style="width:9%" class="text-right">จำนวน</th>
              <th style="width:9%" class="text-center">หน่วย</th>
              <th style="width:13%" class="text-right">ราคา/หน่วย</th>
              <th style="width:11%" class="text-right">ส่วนลด</th>
              <th style="width:13%" class="text-right">รวม</th>
            </tr>
          </thead>
          <tbody>
            ${itemRowsHtml || `<tr><td colspan="8" class="text-center">ไม่มีรายการสินค้า</td></tr>`}
          </tbody>
        </table>
      </div>

      <div class="footer-area">
        <div class="payment-card">
          <div class="section-heading">การชำระเงิน</div>
          <div class="section-body">
            <div><span>ช่องทาง</span><strong>${escapeHtml(getReceiptPaymentLabel(sale))}</strong></div>
            ${paymentDetailHtml}
            <div><span>ผู้รับเงิน</span><strong>${escapeHtml(cashierName)}</strong></div>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-row"><span>รวมมูลค่าสินค้า</span><strong>${formatReceiptCurrency(grossTotal)} บาท</strong></div>
          <div class="summary-row"><span>ส่วนลดท้ายบิล</span><strong>${formatReceiptCurrency(billDiscount)} บาท</strong></div>
          ${memberDiscount > 0 ? `<div class="summary-row"><span>ส่วนลดสมาชิก</span><strong>${formatReceiptCurrency(memberDiscount)} บาท</strong></div>` : ''}
          ${rewardDiscount > 0 ? `<div class="summary-row"><span>ใช้แต้มส่วนลด</span><strong>${formatReceiptCurrency(rewardDiscount)} บาท</strong></div>` : ''}
          ${vatRowsHtml}
          <div class="summary-row net"><span>ยอดรวมสุทธิ</span><strong>${formatReceiptCurrency(netTotal)} บาท</strong></div>
          ${receiptA4ServiceCharge > 0 ? `
          <div class="summary-row"><span>ค่าธรรมเนียมบัตร${receiptA4ServiceChargePct > 0 ? ` ${receiptA4ServiceChargePct}%` : ''}</span><strong>+${formatReceiptCurrency(receiptA4ServiceCharge)} บาท</strong></div>
          <div class="summary-row net"><span>ยอดเรียกเก็บรวม</span><strong>${formatReceiptCurrency(receiptA4GrandDue)} บาท</strong></div>
          ` : ''}
        </div>
      </div>

      <div class="signatures">
        <div class="signature-box">${receiptA4ReceiverSignatureHtml}</div>
        <div class="signature-box"><div class="signature-content"></div><div class="signature-line">ลูกค้า / ผู้รับสินค้า</div></div>
      </div>

      <div class="print-footer">
        <span>พิมพ์เมื่อ ${escapeHtml(printedAt.date)} ${escapeHtml(printedAt.time)}</span>
        <span>SmileStore POS</span>
      </div>
    </div>
  </div>
</body>
</html>`)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 350)
  }

  const openDeliveryNoteModal = async () => {
    if (!idDatalist) {
      window.alert('กรุณาเลือกรายการขายก่อนสร้างใบส่งสินค้า')
      return
    }

    const companyS = localStorage.getItem('company_') || ''
    setDeliveryNoteLoading(true)
    setDeliveryNoteSaveMessage('')
    setDeliveryNoteShowSender(true)
    setDeliveryNoteCustomerQuery('')
    setDeliveryNoteCustomerOpen(false)
    setShowDeliveryNoteModal(true)

    try {
      const [resItems, resMain, resCustomer] = await Promise.all([
        axios.get(`/api/salelist?company=${companyS}&id_salemain=${Number(idDatalist)}`),
        axios.get(`/api/sale/${Number(idDatalist)}`),
        axios.get(`/api/customer?company=${companyS}`),
      ])

      const sale = resMain.data || {}
      const items = Array.isArray(resItems.data) ? resItems.data : []
      const customers = Array.isArray(resCustomer.data) ? resCustomer.data : []
      const customer = customers.find((item: any) => {
        return String(item.id || '') === String(sale.id_costomer || '') || String(item.code || '') === String(sale.code_costomer || '')
      })

      setDeliveryNoteSale(sale)
      setDeliveryNoteItems(items)
      setDeliveryNoteCustomerList(customers)
      setDeliveryNoteCustomer({
        id: String(customer?.id || sale.id_costomer || ''),
        code: String(sale.code_costomer || customer?.code || ''),
        name: String(customer?.names || sale.code_costomer || 'ลูกค้าทั่วไป'),
        taxId: String(customer?.numbertax || ''),
        tel: String(customer?.tel || ''),
        address: String(customer?.address || ''),
        branch: String(customer?.branch || ''),
        note: '',
      })
    } catch (error) {
      console.error('Load delivery note data error:', error)
      window.alert('ไม่สามารถโหลดข้อมูลใบส่งสินค้าได้')
      setShowDeliveryNoteModal(false)
    } finally {
      setDeliveryNoteLoading(false)
    }
  }

  const updateDeliveryNoteCustomer = (field: keyof ReceiptA4CustomerInfo, value: string) => {
    setDeliveryNoteCustomer((current) => ({ ...current, [field]: value }))
    setDeliveryNoteSaveMessage('')
  }

  const handleSelectDeliveryNoteCustomer = (customer: any) => {
    setDeliveryNoteCustomer({
      id: String(customer.id || ''),
      code: String(customer.code || ''),
      name: String(customer.names || 'ลูกค้าทั่วไป'),
      taxId: String(customer.numbertax || ''),
      tel: String(customer.tel || ''),
      address: String(customer.address || ''),
      branch: String(customer.branch || ''),
      note: '',
    })
    setDeliveryNoteCustomerQuery('')
    setDeliveryNoteCustomerOpen(false)
    setDeliveryNoteSaveMessage('')
  }

  const handleSaveDeliveryNoteCustomer = async () => {
    const customerId = Number(deliveryNoteCustomer.id || deliveryNoteSale?.id_costomer || 0)

    setDeliveryNoteSavingCustomer(true)
    setDeliveryNoteSaveMessage('')

    try {
      const companyS = localStorage.getItem('company_') || ''
      const fallbackCode = deliveryNoteSale?.id ? `DN-${deliveryNoteSale.id}` : `DN-${Date.now()}`
      const payload = {
        code: deliveryNoteCustomer.code.trim() || fallbackCode,
        names: deliveryNoteCustomer.name.trim() || 'ลูกค้าทั่วไป',
        numbertax: deliveryNoteCustomer.taxId.trim(),
        tel: deliveryNoteCustomer.tel.trim(),
        branch: deliveryNoteCustomer.branch.trim(),
        address: deliveryNoteCustomer.address.trim(),
      }

      const response = customerId
        ? await axios.put(`/api/customer/${customerId}`, payload)
        : await axios.post('/api/customer', {
            company: companyS,
            ...payload,
            pointStart: 0,
            point: 0,
            totalPoint: 0,
            statuss: 'ใช้งาน',
            drugallergys: [],
          })
      const updated = response.data || {}
      const updatedCode = String(updated.code ?? payload.code)
      const updatedName = String(updated.names ?? payload.names)

      setDeliveryNoteCustomer((current) => ({
        ...current,
        id: String(updated.id || customerId),
        code: updatedCode,
        name: updatedName,
        taxId: String(updated.numbertax ?? payload.numbertax),
        tel: String(updated.tel ?? payload.tel),
        branch: String(updated.branch ?? payload.branch),
        address: String(updated.address ?? payload.address),
      }))
      setDeliveryNoteSale((current: any) => current ? ({ ...current, id_costomer: updated.id || customerId, code_costomer: updatedCode }) : current)
      setCustomerMap((current) => ({ ...current, [updatedCode]: updatedName }))
      setDeliveryNoteSaveMessage(customerId ? 'บันทึกข้อมูลลูกค้าแล้ว' : 'สร้างและบันทึกลูกค้าใหม่แล้ว')
    } catch (error) {
      console.error('Save delivery note customer error:', error)
      setDeliveryNoteSaveMessage('บันทึกข้อมูลลูกค้าไม่สำเร็จ')
    } finally {
      setDeliveryNoteSavingCustomer(false)
    }
  }

  const handlePrintDeliveryNote = () => {
    if (!deliveryNoteSale) return

    const sale = deliveryNoteSale
    const items: any[] = deliveryNoteItems

    try {
      const activeItems = items.filter((item: any) => item.statuss !== 'ยกเลิก')
      const docDateTime = getReceiptDateTime(sale.createDate)
      const printedAt = getReceiptDateTime(new Date())
      const docNo = sale.orderNo || sale.taxInvoiceNo || sale.id || '-'
      const employeeName = String(sale.personall || activeItems[0]?.person || getLocalStorageItem('person_') || '-')
      const companyName = storeS || getLocalStorageItem('company_') || '-'
      const logoHtml = uploadedUrl
        ? `<img class="store-logo" src="${escapeHtml(uploadedUrl)}" alt="logo" />`
        : `<div class="store-logo-fallback">${escapeHtml(String(companyName).slice(0, 2).toUpperCase())}</div>`

      const customerName = deliveryNoteCustomer.name || 'ลูกค้าทั่วไป'
      const customerCode = deliveryNoteCustomer.code || '-'
      const customerTel = deliveryNoteCustomer.tel || '-'
      const customerAddress = deliveryNoteCustomer.address || '-'
      const customerBranch = deliveryNoteCustomer.branch ? `<div><span>สาขา</span><strong>${escapeHtml(deliveryNoteCustomer.branch)}</strong></div>` : ''
      const senderInfoHtml = deliveryNoteShowSender
        ? `<div><span>ผู้จัดส่ง</span><strong>${escapeHtml(employeeName)}</strong></div>`
        : ''
      const storeBlockHtml = deliveryNoteShowSender
        ? `<div class="store-block">
            ${logoHtml}
            <div class="store-text">
              <div class="store-name">${escapeHtml(companyName)}</div>
              <div class="store-meta">${escapeHtml(addressS || '-')} | โทร: ${escapeHtml(telS || '-')}</div>
            </div>
          </div>`
        : ''

      const totalQty = activeItems.reduce((sum: number, item: any) => sum + Number(item.qty || 0), 0)

      const itemRowsHtml = items.map((item: any, index: number) => {
        const rowCancelled = item.statuss === 'ยกเลิก'
        return `<tr class="${rowCancelled ? 'cancelled-row' : ''}">
          <td class="text-center">${index + 1}</td>
          <td>${escapeHtml(item.code_product || '-')}</td>
          <td>
            <div class="item-name">${escapeHtml(item.name_product || '-')}</div>
            ${rowCancelled ? '<div class="item-status">ยกเลิกรายการ</div>' : ''}
          </td>
          <td class="text-right">${formatReceiptCurrency(item.qty, 0)}</td>
          <td class="text-center">${escapeHtml(item.unit || '-')}</td>
          <td></td>
        </tr>`
      }).join('')

      const senderSignatureHtml = deliveryNoteShowSender
        ? `<div class="signature-box">
            <div class="signature-content"></div>
            <div class="signature-line">ผู้จัดส่งสินค้า</div>
            <div class="signature-date">วันที่ ........../........../..........</div>
          </div>`
        : ''

      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        window.alert('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ กรุณาอนุญาต pop-up ของเบราว์เซอร์')
        return
      }

      printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>ใบส่งสินค้า ${escapeHtml(String(docNo))}</title>
  <style>
    @font-face { font-family: Kanit; src: url('/fonts/Kanit-Regular.ttf') format('truetype'); font-weight: 400; }
    @font-face { font-family: Kanit; src: url('/fonts/Kanit-SemiBold.ttf') format('truetype'); font-weight: 700; }
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #eef2f7; color: #0f172a; font-family: Kanit, Arial, sans-serif; font-size: 11px; }
    .sheet { width: 186mm; min-height: auto; margin: 0 auto; padding: 0; background: #fff; }
    .top-accent { height: 2px; background: #0f172a; }
    .sheet-inner { padding: 4mm 6mm 3mm; }
    .header-bar { display: flex; justify-content: space-between; align-items: center; gap: 4mm; padding-bottom: 1.5mm; border-bottom: 1px solid #cbd5e1; }
    .store-block { display: flex; align-items: center; gap: 2mm; }
    .store-logo, .store-logo-fallback { width: 8mm; height: 8mm; flex-shrink: 0; }
    .store-logo { object-fit: contain; }
    .store-logo-fallback { border-radius: 4px; background: #e2e8f0; color: #0f172a; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px; }
    .store-text { line-height: 1.35; }
    .store-name { font-size: 12.5px; font-weight: 700; color: #0f172a; letter-spacing: 0.2px; }
    .store-meta { color: #475569; font-size: 9px; line-height: 1.4; }
    .doc-box { text-align: right; }
    .doc-title-inline { font-size: 13px; font-weight: 700; color: #0f172a; letter-spacing: 0.3px; }
    .doc-title-inline span { font-size: 8px; letter-spacing: 1.5px; color: #475569; margin-left: 5px; }
    .doc-meta-inline { display: flex; gap: 9px; justify-content: flex-end; flex-wrap: wrap; font-size: 9.5px; color: #475569; margin-top: 2px; }
    .doc-meta-inline strong { color: #0f172a; font-weight: 700; }
    .info-bar { display: flex; flex-wrap: wrap; gap: 1.5mm 6mm; padding: 1.5mm 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 1.5mm; font-size: 9.5px; }
    .info-bar > div { display: flex; gap: 4px; align-items: baseline; white-space: nowrap; }
    .info-bar span { color: #64748b; }
    .info-bar strong { color: #0f172a; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; }
    .items { margin-top: 2mm; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; }
    thead { display: table-header-group; }
    th { padding: 3px 6px; background: #1e293b; color: #fff; font-size: 10px; font-weight: 700; text-align: left; }
    td { padding: 4px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; font-size: 10.5px; }
    tbody tr:nth-child(even) td { background: #f8fafc; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .item-name { font-weight: 700; color: #0f172a; }
    .item-status { margin-top: 1px; font-size: 9px; color: #475569; }
    .cancelled-row td { color: #64748b; text-decoration: line-through; background: #f1f5f9 !important; }
    .cancelled-row .item-status { text-decoration: none; }
    .summary-line { display: flex; justify-content: flex-end; gap: 8px; margin-top: 2mm; font-size: 10.5px; }
    .summary-line span { color: #64748b; }
    .summary-line strong { color: #0f172a; font-weight: 700; }
    .note-box { margin-top: 3mm; border: 1px solid #e2e8f0; border-radius: 6px; padding: 2mm 3mm; min-height: 12mm; font-size: 9.5px; color: #475569; }
    .note-box .note-title { font-weight: 700; color: #0f172a; margin-bottom: 1mm; }
    .signatures { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6mm; margin-top: 8mm; page-break-inside: avoid; }
    .signature-box { text-align: center; color: #475569; }
    .signature-content { height: 10mm; }
    .signature-line { border-top: 1px solid #94a3b8; padding-top: 3px; }
    .signature-date { margin-top: 4mm; font-size: 9.5px; color: #475569; }
    .print-footer { margin-top: 2mm; padding-top: 1mm; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; color: #94a3b8; font-size: 9px; }
    @media print {
      body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .sheet { width: auto; min-height: auto; margin: 0; }
      .sheet-inner { padding: 0; }
      tr, .note-box, .signatures { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="top-accent"></div>
    <div class="sheet-inner">
      <div class="header-bar" style="${deliveryNoteShowSender ? '' : 'justify-content: flex-end;'}">
        ${storeBlockHtml}
        <div class="doc-box">
          <div class="doc-title-inline">ใบส่งสินค้า<span>DELIVERY NOTE</span></div>
          <div class="doc-meta-inline">
            <span>เลขที่ <strong>${escapeHtml(docNo)}</strong></span>
            <span>วันที่ <strong>${escapeHtml(docDateTime.date)}</strong></span>
            <span>เวลา <strong>${escapeHtml(docDateTime.time)}</strong></span>
          </div>
        </div>
      </div>

      <div class="info-bar">
        <div><span>ลูกค้า/ผู้รับสินค้า</span><strong>${escapeHtml(customerName)}</strong></div>
        <div><span>รหัส</span><strong>${escapeHtml(customerCode)}</strong></div>
        <div><span>โทร</span><strong>${escapeHtml(customerTel)}</strong></div>
        ${customerBranch}
        <div><span>ที่อยู่จัดส่ง</span><strong>${escapeHtml(customerAddress)}</strong></div>
        ${senderInfoHtml}
        <div><span>จำนวน</span><strong>${activeItems.length} รายการ</strong></div>
      </div>

      <div class="items">
        <table>
          <thead>
            <tr>
              <th style="width:7%" class="text-center">#</th>
              <th style="width:15%">รหัส</th>
              <th>รายการสินค้า</th>
              <th style="width:12%" class="text-right">จำนวน</th>
              <th style="width:12%" class="text-center">หน่วย</th>
              <th style="width:18%">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            ${itemRowsHtml || `<tr><td colspan="6" class="text-center">ไม่มีรายการสินค้า</td></tr>`}
          </tbody>
        </table>
      </div>

      <div class="summary-line"><span>จำนวนสินค้ารวม</span><strong>${formatReceiptCurrency(totalQty, 0)} หน่วย</strong></div>

      <div class="note-box">
        <div class="note-title">หมายเหตุ</div>
        <div>กรุณาตรวจสอบความถูกต้องและสภาพสินค้าก่อนลงนามรับสินค้า</div>
      </div>

      <div class="signatures" style="grid-template-columns: repeat(${deliveryNoteShowSender ? 2 : 1}, 1fr);">
        ${senderSignatureHtml}
        <div class="signature-box">
          <div class="signature-content"></div>
          <div class="signature-line">ผู้รับสินค้า</div>
          <div class="signature-date">วันที่ ........../........../..........</div>
        </div>
      </div>

      <div class="print-footer">
        <span>พิมพ์เมื่อ ${escapeHtml(printedAt.date)} ${escapeHtml(printedAt.time)}</span>
        <span>SmileStore POS</span>
      </div>
    </div>
  </div>
</body>
</html>`)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
      }, 350)
    } catch (error) {
      console.error('Print delivery note error:', error)
      window.alert('ไม่สามารถพิมพ์ใบส่งสินค้าได้')
    }
  }


  const openTaxInvoiceModal = async () => {
    if (!idDatalist) {
      window.alert('กรุณาเลือกรายการขายก่อนสร้างใบกำกับภาษี')
      return
    }

    const companyS = localStorage.getItem('company_') || ''
    setTaxInvoiceLoading(true)
    setTaxInvoiceCustomerQuery('')
    setTaxInvoiceCustomerOpen(false)
    setTaxInvoiceSaveMessage('')
    setTaxInvoiceCopies({ original: true, copy: true })
    setTaxInvoiceDate(toReceiptA4InputDate(new Date()))
    setShowTaxInvoiceModal(true)

    try {
      const [resItems, resMain, resCustomer] = await Promise.all([
        axios.get(`/api/salelist?company=${companyS}&id_salemain=${Number(idDatalist)}`),
        axios.get(`/api/sale/${Number(idDatalist)}`),
        axios.get(`/api/customer?company=${companyS}`),
      ])

      const sale = resMain.data || {}
      const items = Array.isArray(resItems.data) ? resItems.data : []
      const customers = Array.isArray(resCustomer.data) ? resCustomer.data : []
      const customer = customers.find((item: any) => {
        return String(item.id || '') === String(sale.id_costomer || '') || String(item.code || '') === String(sale.code_costomer || '')
      })

      setTaxInvoiceSale(sale)
      setTaxInvoiceItems(items)
      setTaxInvoiceCustomerList(customers)
      setTaxInvoiceNo(String(sale.taxInvoiceNo || sale.orderNo || sale.id || ''))
      setTaxInvoiceCustomer(customer ? {
        id: String(customer.id || ''),
        code: String(customer.code || ''),
        name: String(customer.names || 'ลูกค้าทั่วไป'),
        taxId: String(customer.numbertax || ''),
        tel: String(customer.tel || ''),
        address: String(customer.address || ''),
        branch: String(customer.branch || ''),
      } : { ...EMPTY_TAX_INVOICE_CUSTOMER, code: String(sale.code_costomer || '') })
    } catch (error) {
      console.error('Load tax invoice data error:', error)
      window.alert('ไม่สามารถโหลดข้อมูลใบกำกับภาษีได้')
      setShowTaxInvoiceModal(false)
    } finally {
      setTaxInvoiceLoading(false)
    }
  }

  const handleSelectTaxInvoiceCustomer = (customer: any) => {
    setTaxInvoiceCustomer({
      id: String(customer.id || ''),
      code: String(customer.code || ''),
      name: String(customer.names || 'ลูกค้าทั่วไป'),
      taxId: String(customer.numbertax || ''),
      tel: String(customer.tel || ''),
      address: String(customer.address || ''),
      branch: String(customer.branch || ''),
    })
    setTaxInvoiceCustomerQuery('')
    setTaxInvoiceCustomerOpen(false)
  }

  const toggleTaxInvoiceCopy = (key: TaxInvoiceCopyOption) => {
    setTaxInvoiceCopies((current) => ({ ...current, [key]: !current[key] }))
  }

  const updateTaxInvoiceCustomer = (field: keyof TaxInvoiceCustomerInfo, value: string) => {
    setTaxInvoiceCustomer((current) => ({ ...current, [field]: value }))
    setTaxInvoiceSaveMessage('')
  }

  const handleSaveTaxInvoiceCustomer = async () => {
    const customerId = Number(taxInvoiceCustomer.id || taxInvoiceSale?.id_costomer || 0)

    setTaxInvoiceSavingCustomer(true)
    setTaxInvoiceSaveMessage('')

    try {
      const companyS = localStorage.getItem('company_') || ''
      const fallbackCode = taxInvoiceSale?.id ? `TI-${taxInvoiceSale.id}` : `TI-${Date.now()}`
      const payload = {
        code: taxInvoiceCustomer.code.trim() || fallbackCode,
        names: taxInvoiceCustomer.name.trim() || 'ลูกค้าทั่วไป',
        numbertax: taxInvoiceCustomer.taxId.trim(),
        tel: taxInvoiceCustomer.tel.trim(),
        branch: taxInvoiceCustomer.branch.trim(),
        address: taxInvoiceCustomer.address.trim(),
      }

      const response = customerId
        ? await axios.put(`/api/customer/${customerId}`, payload)
        : await axios.post('/api/customer', {
            company: companyS,
            ...payload,
            pointStart: 0,
            point: 0,
            totalPoint: 0,
            statuss: 'ใช้งาน',
            drugallergys: [],
          })
      const updated = response.data || {}
      const updatedCode = String(updated.code ?? payload.code)
      const updatedName = String(updated.names ?? payload.names)

      setTaxInvoiceCustomer((current) => ({
        ...current,
        id: String(updated.id || customerId),
        code: updatedCode,
        name: updatedName,
        taxId: String(updated.numbertax ?? payload.numbertax),
        tel: String(updated.tel ?? payload.tel),
        branch: String(updated.branch ?? payload.branch),
        address: String(updated.address ?? payload.address),
      }))
      setCustomerMap((current) => ({ ...current, [updatedCode]: updatedName }))
      setTaxInvoiceSaveMessage(customerId ? 'บันทึกข้อมูลลูกค้าแล้ว' : 'สร้างและบันทึกลูกค้าใหม่แล้ว')
    } catch (error) {
      console.error('Save tax invoice customer error:', error)
      setTaxInvoiceSaveMessage('บันทึกข้อมูลลูกค้าไม่สำเร็จ')
    } finally {
      setTaxInvoiceSavingCustomer(false)
    }
  }

  const filteredTaxInvoiceCustomers = useMemo(() => {
    const query = taxInvoiceCustomerQuery.trim().toLowerCase()
    if (!query) return taxInvoiceCustomerList
    return taxInvoiceCustomerList.filter((customer: any) => {
      return String(customer.names || '').toLowerCase().includes(query)
        || String(customer.code || '').toLowerCase().includes(query)
        || String(customer.numbertax || '').toLowerCase().includes(query)
        || String(customer.tel || '').toLowerCase().includes(query)
    })
  }, [taxInvoiceCustomerList, taxInvoiceCustomerQuery])

  const filteredDeliveryNoteCustomers = useMemo(() => {
    const query = deliveryNoteCustomerQuery.trim().toLowerCase()
    if (!query) return deliveryNoteCustomerList
    return deliveryNoteCustomerList.filter((customer: any) => {
      return String(customer.names || '').toLowerCase().includes(query)
        || String(customer.code || '').toLowerCase().includes(query)
        || String(customer.tel || '').toLowerCase().includes(query)
    })
  }, [deliveryNoteCustomerList, deliveryNoteCustomerQuery])

  const buildTaxInvoiceStyles = () => `
    @font-face { font-family: Kanit; src: url('/fonts/Kanit-Regular.ttf') format('truetype'); font-weight: 400; }
    @font-face { font-family: Kanit; src: url('/fonts/Kanit-SemiBold.ttf') format('truetype'); font-weight: 700; }
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #eef2f7; color: #0f172a; font-family: Kanit, Arial, sans-serif; font-size: 11px; }
    .ti-sheet { width: 186mm; min-height: auto; margin: 0 auto 3mm; padding: 0; background: #fff; position: relative; page-break-after: always; }
    .ti-sheet:last-child { page-break-after: auto; }
    .ti-top-accent { height: 2px; background: #0f172a; }
    .ti-copy-row { display: flex; justify-content: flex-end; margin-bottom: 2mm; }
    .ti-copy-badge { display: inline-flex; padding: 1px 8px; border-radius: 999px; border: 1.5px solid #0f172a; color: #0f172a; font-weight: 700; font-size: 8px; letter-spacing: 1px; background: #fff; }
    .ti-inner { padding: 4mm 6mm 3mm; }
    .ti-header-bar { display: flex; justify-content: space-between; align-items: center; gap: 4mm; padding-bottom: 1.5mm; border-bottom: 1px solid #cbd5e1; }
    .ti-store-block { display: flex; align-items: center; gap: 2mm; }
    .ti-store-logo, .ti-store-logo-fallback { width: 8mm; height: 8mm; flex-shrink: 0; }
    .ti-store-logo { object-fit: contain; }
    .ti-store-logo-fallback { border-radius: 4px; background: #e2e8f0; color: #0f172a; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px; }
    .ti-store-text { line-height: 1.35; }
    .ti-store-name { font-size: 12.5px; font-weight: 700; color: #0f172a; letter-spacing: 0.2px; }
    .ti-store-meta { color: #475569; font-size: 9px; line-height: 1.4; }
    .ti-doc-box { text-align: right; }
    .ti-doc-title-inline { font-size: 13px; font-weight: 700; color: #0f172a; letter-spacing: 0.3px; }
    .ti-doc-title-inline span { font-size: 8px; letter-spacing: 1.5px; color: #475569; margin-left: 5px; }
    .ti-doc-meta-inline { display: flex; gap: 9px; justify-content: flex-end; flex-wrap: wrap; font-size: 9.5px; color: #475569; margin-top: 2px; }
    .ti-doc-meta-inline strong { color: #0f172a; font-weight: 700; }
    .ti-status-badge { display: inline-flex; align-items: center; padding: 1px 6px; border-radius: 999px; font-size: 8.5px; font-weight: 700; }
    .ti-info-bar { display: flex; flex-wrap: wrap; gap: 1.5mm 6mm; padding: 1.5mm 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 1.5mm; font-size: 9.5px; }
    .ti-info-bar > div { display: flex; gap: 4px; align-items: baseline; white-space: nowrap; }
    .ti-info-bar span { color: #64748b; }
    .ti-info-bar strong { color: #0f172a; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; }
    .ti-items { margin-top: 2mm; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; }
    thead { display: table-header-group; }
    .ti-items th { padding: 3px 6px; background: #1e293b; color: #fff; font-size: 10px; font-weight: 700; text-align: left; }
    .ti-items td { padding: 2px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; font-size: 10.5px; }
    .ti-items tbody tr:nth-child(even) td { background: #f8fafc; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .item-name { font-weight: 700; color: #0f172a; }
    .item-status { margin-top: 1px; font-size: 9px; color: #475569; }
    .cancelled-row td { color: #64748b; text-decoration: line-through; background: #f1f5f9 !important; }
    .cancelled-row .item-status { text-decoration: none; }
    .total-cell { font-weight: 700; color: #0f172a; }
    .ti-footer-area { display: grid; grid-template-columns: 1fr 72mm; gap: 3mm; margin-top: 2mm; align-items: stretch; }
    .ti-words-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 8px; display: flex; flex-direction: column; gap: 2px; justify-content: center; }
    .ti-words-card span { color: #64748b; }
    .ti-words-card strong { color: #0f172a; font-weight: 700; font-size: 12px; }
    .ti-summary-card { border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; }
    .ti-summary-row { display: flex; justify-content: space-between; gap: 10px; padding: 2px 8px; border-bottom: 1px solid #e2e8f0; }
    .ti-summary-row span { color: #475569; }
    .ti-summary-row strong { font-weight: 700; color: #0f172a; }
    .ti-summary-row.muted { background: #f8fafc; }
    .ti-summary-row.net { background: #0f172a; color: #fff; border-bottom: 0; }
    .ti-summary-row.net span, .ti-summary-row.net strong { color: #fff; font-size: 13px; }
    .ti-signatures { display: grid; grid-template-columns: repeat(2, 1fr); gap: 3mm; margin-top: 4mm; page-break-inside: avoid; }
    .ti-signature-box { text-align: center; color: #475569; }
    .ti-signature-content { height: 7mm; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 1mm; padding-bottom: 1mm; }
    .ti-signature-line { border-top: 1px solid #94a3b8; padding-top: 3px; }
    .ti-print-footer { margin-top: 2mm; padding-top: 1mm; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; color: #94a3b8; font-size: 9px; }
    @media print {
      body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .ti-sheet { width: auto; min-height: auto; margin: 0; }
      .ti-inner { padding: 0; }
      tr, .ti-summary-card, .ti-words-card, .ti-signatures { page-break-inside: avoid; }
    }
  `

  const buildTaxInvoiceSheetHtml = (copyLabel: string, copySub: string) => {
    const sale = taxInvoiceSale || {}
    const isCancelled = sale.statussall === 'ยกเลิก'
    const netTotal = isCancelled ? 0 : Number(sale.sumtotal || 0)
    const beforeVat = netTotal / 1.07
    const vatAmount = netTotal - beforeVat
    const receiptDateTime = getReceiptDateTime(taxInvoiceDate)
    const printedAt = getReceiptDateTime(new Date())
    const cashierName = sale.personall || taxInvoiceItems[0]?.person || getLocalStorageItem('person_') || '-'
    const companyName = storeS || getLocalStorageItem('company_') || '-'
    const logoHtml = uploadedUrl
      ? `<img class="ti-store-logo" src="${escapeHtml(uploadedUrl)}" alt="logo" />`
      : `<div class="ti-store-logo-fallback">${escapeHtml(String(companyName).slice(0, 2).toUpperCase())}</div>`

    const itemRowsHtml = taxInvoiceItems.map((item: any, index: number) => {
      const rowCancelled = item.statuss === 'ยกเลิก'
      return `<tr class="${rowCancelled ? 'cancelled-row' : ''}">
        <td class="text-center">${index + 1}</td>
        <td>${escapeHtml(item.code_product || '-')}</td>
        <td>
          <div class="item-name">${escapeHtml(item.name_product || '-')}</div>
          ${rowCancelled ? '<div class="item-status">ยกเลิกรายการ</div>' : ''}
        </td>
        <td class="text-right">${formatReceiptCurrency(item.qty, 0)}</td>
        <td class="text-center">${escapeHtml(item.unit || '-')}</td>
        <td class="text-right">${formatReceiptCurrency(item.price)}</td>
        <td class="text-right">${Number(item.discount || 0) > 0 ? formatReceiptCurrency(item.discount) : '-'}</td>
        <td class="text-right total-cell">${formatReceiptCurrency(rowCancelled ? 0 : item.total)}</td>
      </tr>`
    }).join('')

    const customerBranchHtml = taxInvoiceCustomer.branch
      ? `<div><span>สาขา</span><strong>${escapeHtml(taxInvoiceCustomer.branch)}</strong></div>`
      : ''

    return `<div class="ti-sheet">
      <div class="ti-top-accent"></div>
      <div class="ti-inner">
        <div class="ti-copy-row"><div class="ti-copy-badge">${escapeHtml(copyLabel)} / ${escapeHtml(copySub)}</div></div>
        <div class="ti-header-bar">
          <div class="ti-store-block">
            ${logoHtml}
            <div class="ti-store-text">
              <div class="ti-store-name">${escapeHtml(companyName)}</div>
              <div class="ti-store-meta">${escapeHtml(addressS || '-')} | ภาษี: ${escapeHtml(taxS || '-')} | โทร: ${escapeHtml(telS || '-')}</div>
            </div>
          </div>
          <div class="ti-doc-box">
            <div class="ti-doc-title-inline">ใบกำกับภาษี<span>TAX INVOICE</span></div>
            <div class="ti-doc-meta-inline">
              <span>เลขที่ <strong>${escapeHtml(taxInvoiceNo || '-')}</strong></span>
              <span>วันที่ <strong>${escapeHtml(receiptDateTime.date)}</strong></span>
              <span>อ้างอิง <strong>${escapeHtml(String(sale.orderNo || sale.id || '-'))}</strong></span>
              <span class="ti-status-badge" style="border:1px solid #0f172a;background:${isCancelled ? '#0f172a' : '#fff'};color:${isCancelled ? '#fff' : '#0f172a'}">${isCancelled ? 'ยกเลิก' : 'สมบูรณ์'}</span>
            </div>
          </div>
        </div>

        <div class="ti-info-bar">
          <div><span>ชื่อลูกค้า</span><strong>${escapeHtml(taxInvoiceCustomer.name || 'ลูกค้าทั่วไป')}</strong></div>
          <div><span>รหัสลูกค้า</span><strong>${escapeHtml(taxInvoiceCustomer.code || '-')}</strong></div>
          <div><span>เลขผู้เสียภาษี</span><strong>${escapeHtml(taxInvoiceCustomer.taxId || '-')}</strong></div>
          <div><span>โทรศัพท์</span><strong>${escapeHtml(taxInvoiceCustomer.tel || '-')}</strong></div>
          ${customerBranchHtml}
          <div><span>ที่อยู่</span><strong>${escapeHtml(taxInvoiceCustomer.address || '-')}</strong></div>
          <div><span>พนักงานขาย</span><strong>${escapeHtml(cashierName)}</strong></div>
          <div><span>ชำระโดย</span><strong>${escapeHtml(getReceiptPaymentLabel(sale))}</strong></div>
          <div><span>จำนวนรายการ</span><strong>${taxInvoiceItems.filter((item: any) => item.statuss !== 'ยกเลิก').length} รายการ</strong></div>
        </div>

        <div class="ti-items">
          <table>
            <thead>
              <tr>
                <th style="width:6%" class="text-center">#</th>
                <th style="width:13%">รหัส</th>
                <th>รายการสินค้า</th>
                <th style="width:9%" class="text-right">จำนวน</th>
                <th style="width:9%" class="text-center">หน่วย</th>
                <th style="width:13%" class="text-right">ราคา/หน่วย</th>
                <th style="width:11%" class="text-right">ส่วนลด</th>
                <th style="width:13%" class="text-right">มูลค่า</th>
              </tr>
            </thead>
            <tbody>
              ${itemRowsHtml || `<tr><td colspan="8" class="text-center">ไม่มีรายการสินค้า</td></tr>`}
            </tbody>
          </table>
        </div>

        <div class="ti-footer-area">
          <div class="ti-words-card">
            <span>จำนวนเงินรวมทั้งสิ้น (ตัวอักษร)</span>
            <strong>(${bahtText(netTotal)})</strong>
          </div>
          <div class="ti-summary-card">
            <div class="ti-summary-row muted"><span>มูลค่าสินค้า/บริการ (ก่อนภาษี)</span><strong>${formatReceiptCurrency(beforeVat)} บาท</strong></div>
            <div class="ti-summary-row muted"><span>ภาษีมูลค่าเพิ่ม 7%</span><strong>${formatReceiptCurrency(vatAmount)} บาท</strong></div>
            <div class="ti-summary-row net"><span>จำนวนเงินรวมทั้งสิ้น</span><strong>${formatReceiptCurrency(netTotal)} บาท</strong></div>
          </div>
        </div>

        <div class="ti-signatures">
          <div class="ti-signature-box"><div class="ti-signature-content"></div><div class="ti-signature-line">ผู้รับสินค้า / ผู้รับบริการ</div></div>
          <div class="ti-signature-box"><div class="ti-signature-content"></div><div class="ti-signature-line">ผู้ออกใบกำกับภาษี (${escapeHtml(cashierName)})</div></div>
        </div>

        <div class="ti-print-footer">
          <span>พิมพ์เมื่อ ${escapeHtml(printedAt.date)} ${escapeHtml(printedAt.time)}</span>
          <span>SmileStore POS</span>
        </div>
      </div>
    </div>`
  }

  const getTaxInvoiceCopyLabels = () => {
    const labels: { label: string; sub: string }[] = []
    if (taxInvoiceCopies.original) labels.push({ label: 'ต้นฉบับ', sub: 'ORIGINAL' })
    if (taxInvoiceCopies.copy) labels.push({ label: 'สำเนา', sub: 'COPY' })
    return labels.length > 0 ? labels : [{ label: 'ต้นฉบับ', sub: 'ORIGINAL' }]
  }

  const handlePrintTaxInvoice = () => {
    if (!taxInvoiceSale) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      window.alert('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ กรุณาอนุญาต pop-up ของเบราว์เซอร์')
      return
    }

    const sheetsHtml = getTaxInvoiceCopyLabels().map((copy) => buildTaxInvoiceSheetHtml(copy.label, copy.sub)).join('')

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>ใบกำกับภาษี ${escapeHtml(taxInvoiceNo || String(taxInvoiceSale.id || ''))}</title>
  <style>${buildTaxInvoiceStyles()}</style>
</head>
<body>
  ${sheetsHtml}
</body>
</html>`)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 350)
  }

  const handleSaveTaxInvoicePdf = async () => {
    if (!taxInvoiceSale) return

    setTaxInvoicePdfBusy(true)
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.innerHTML = `<style>${buildTaxInvoiceStyles()}</style>${getTaxInvoiceCopyLabels().map((copy) => buildTaxInvoiceSheetHtml(copy.label, copy.sub)).join('')}`
    document.body.appendChild(container)

    try {
      const html2pdf = (await import('html2pdf.js')).default
      const fileName = `ใบกำกับภาษี_${taxInvoiceNo || taxInvoiceSale.id}.pdf`
      await html2pdf().from(container).set({
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).save()
    } catch (error) {
      console.error('Save tax invoice PDF error:', error)
      window.alert('ไม่สามารถบันทึก PDF ได้')
    } finally {
      document.body.removeChild(container)
      setTaxInvoicePdfBusy(false)
    }
  }

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setTimeout(() => { setall1({ ...all, [name]: value }); }, 30);
  };

  useEffect(() => {
    const saved = localStorage.getItem("initial_drawer")
    if (saved) {
      setInitialDrawer(Number(saved))
      setTempDrawer(saved)
    }
  }, [])

  const handleSaveInitialDrawer = () => {
    localStorage.setItem("initial_drawer", tempDrawer)
    setInitialDrawer(Number(tempDrawer))
    setOpenSettings(false)
  }

  const fetchPostsz = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const searchDate = all.search_date || new Date().toLocaleDateString('sv-SE') // sv-SE gives YYYY-MM-DD
      const [res, resday, res1, resCus] = await Promise.all([
        axios.get(`/api/sale?companyall=${companyS}&createDate=${searchDate}`),
        axios.get(`/api/salelistday?company=${companyS}&createDate=${searchDate}`),
        axios.get(`/api/sale_cal/sale_sum?company=${companyS}&createDate=${searchDate}`),
        axios.get(`/api/customer?company=${companyS}`)
      ])
      setsalesummary(res1.data)
      setsaledaily(res.data)
      setsaledailycount(resday.data)
      const cusMap: Record<string, string> = {}
      if (Array.isArray(resCus.data)) {
        resCus.data.forEach((c: any) => { if (c.code) cusMap[c.code] = c.names || '' })
      }
      setCustomerMap(cusMap)
      setRefreshKey(prev => prev + 1)  // Trigger ReceiptItem refresh
    } catch (error) { console.error(error) }
  }

  useEffect(() => {
    fetchPostsz()
  }, [date, all.search_date])
  const [l, setlevel] = useState([])

  const getReportDateValue = () => all.search_date || new Date().toLocaleDateString('sv-SE')

  const formatDateOnly = (value: string | Date | null | undefined) => {
    if (!value) return '-'
    const dateValue = new Date(value)
    if (Number.isNaN(dateValue.getTime())) return '-'
    return dateValue.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatTimeOnly = (value: string | Date | null | undefined) => {
    if (!value) return '-'
    const dateValue = new Date(value)
    if (Number.isNaN(dateValue.getTime())) return '-'
    return dateValue.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const formatDateTime = (value: string | Date | null | undefined) => {
    if (!value) return '-'
    const dateValue = new Date(value)
    if (Number.isNaN(dateValue.getTime())) return '-'
    return `${formatDateOnly(dateValue)} ${formatTimeOnly(dateValue)}`
  }

  const exportDailySalesExcel = async () => {
    setIsExportingDaily(true)
    try {
      const XLSX = await import('xlsx')
      const reportDate = getReportDateValue()
      const companyName = getLocalStorageItem("company_") || '-'
      const generatedBy = getLocalStorageItem("person_") || '-'
      const summaryData = dailyReportMetrics.summary
      const saleRows = dailyReportMetrics.saleRows
      const saleItemRows = dailyReportMetrics.saleItemRows
      const activeSales = dailyReportMetrics.activeSales
      const canceledSales = dailyReportMetrics.canceledSales

      const totalNet = activeSales.reduce((sum: number, sale: any) => sum + Number(sale.sumtotal || 0), 0)
      const totalAll = activeSales.reduce((sum: number, sale: any) => sum + Number(sale.totalall || 0), 0)
      const totalDiscount = activeSales.reduce((sum: number, sale: any) => sum + Number(sale.discount || 0), 0)
      const totalReward = activeSales.reduce((sum: number, sale: any) => sum + Number(sale.usereward || 0), 0)
      const canceledNet = canceledSales.reduce((sum: number, sale: any) => sum + Number(sale.sumtotal || 0), 0)

      const splitSales = activeSales.filter((sale: any) => sale.pay === 'เงินสด+โอน')
      const cashSales = activeSales.filter((sale: any) => sale.pay === 'เงินสด')
      const transferSales = activeSales.filter((sale: any) => sale.pay === 'โอน')
      const otherSales = activeSales.filter((sale: any) => sale.pay === 'อื่นๆ')

      const splitCashTotal = splitSales.reduce((sum: number, sale: any) => sum + Number(sale.cashAmount || 0), 0)
      const splitTransferTotal = splitSales.reduce((sum: number, sale: any) => sum + Number(sale.transferAmount || 0), 0)
      const cashTotal = cashSales.reduce((sum: number, sale: any) => sum + Number(sale.sumtotal || 0), 0) + splitCashTotal
      const transferTotal = transferSales.reduce((sum: number, sale: any) => sum + Number(sale.sumtotal || 0), 0) + splitTransferTotal
      const otherTotal = otherSales.reduce((sum: number, sale: any) => sum + Number(sale.sumtotal || 0), 0)
      const serviceChargeSalesRows = activeSales.filter((sale: any) => Number(sale.serviceCharge || 0) > 0)
      const serviceChargeTotal = serviceChargeSalesRows.reduce((sum: number, sale: any) => sum + Number(sale.serviceCharge || 0), 0)

      const transferGroups = new Map<string, { total: number; count: number }>()
      transferSales.forEach((sale: any) => {
        const key = resolveProviderLabel(sale.transferDetail, providerMap) || 'โอน (ไม่ระบุ)'
        const current = transferGroups.get(key) || { total: 0, count: 0 }
        current.total += Number(sale.sumtotal || 0)
        current.count += 1
        transferGroups.set(key, current)
      })
      splitSales.forEach((sale: any) => {
        const key = resolveProviderLabel(sale.transferDetail, providerMap) || 'โอน (ไม่ระบุ)'
        const current = transferGroups.get(key) || { total: 0, count: 0 }
        current.total += Number(sale.transferAmount || 0)
        current.count += 1
        transferGroups.set(key, current)
      })

      const otherGroups = new Map<string, { total: number; count: number }>()
      otherSales.forEach((sale: any) => {
        const key = resolveProviderLabel(sale.transferDetail, providerMap) || 'อื่นๆ (ไม่ระบุ)'
        const current = otherGroups.get(key) || { total: 0, count: 0 }
        current.total += Number(sale.sumtotal || 0)
        current.count += 1
        otherGroups.set(key, current)
      })

      const itemCountBySaleId = saleItemRows.reduce((map, item: any) => {
        const saleId = Number(item.id_salemain || 0)
        map.set(saleId, (map.get(saleId) || 0) + 1)
        return map
      }, new Map<number, number>())

      const saleById = saleRows.reduce((map, sale: any) => {
        map.set(Number(sale.id), sale)
        return map
      }, new Map<number, any>())

      const cashierSummaryMap = activeSales.reduce((map, sale: any) => {
        const cashier = sale.personall || 'ไม่ระบุ'
        const current = map.get(cashier) || { bills: 0, amount: 0, items: 0 }
        current.bills += 1
        current.amount += Number(sale.sumtotal || 0)
        current.items += itemCountBySaleId.get(Number(sale.id)) || 0
        map.set(cashier, current)
        return map
      }, new Map<string, { bills: number; amount: number; items: number }>())

      const cashierRows = Array.from(cashierSummaryMap.entries())
        .sort((a: any, b: any) => b[1].amount - a[1].amount)
        .map(([cashier, metrics]: any) => [cashier, metrics.bills, metrics.items, metrics.amount])

      const transferRows = Array.from(transferGroups.entries())
        .sort((a: any, b: any) => b[1].total - a[1].total)
        .map(([name, metrics]: any) => [name, metrics.count, metrics.total])

      const otherRows = Array.from(otherGroups.entries())
        .sort((a: any, b: any) => b[1].total - a[1].total)
        .map(([name, metrics]: any) => [name, metrics.count, metrics.total])

      const summaryRows: (string | number)[][] = [
        ['รายงานการขายประจำวัน'],
        ['วันที่รายงาน', formatDateOnly(reportDate), '', 'สร้างเมื่อ', formatDateTime(new Date())],
        ['บริษัท', companyName, '', 'พนักงาน', generatedBy],
        ['ขอบเขตข้อมูล', reportScopeLabel],
        [],
        ['ภาพรวมยอดขาย'],
        ['ตัวชี้วัด', 'ค่า', 'หน่วย'],
        ['จำนวนบิลขาย', activeSales.length, 'บิล'],
        ['จำนวนบิลยกเลิก', canceledSales.length, 'บิล'],
        ['ยอดขายก่อนส่วนลด', totalAll, 'บาท'],
        ['ส่วนลด', totalDiscount, 'บาท'],
        ['ตัดแต้ม', totalReward, 'บาท'],
        ['ยอดขายสุทธิ', totalNet, 'บาท'],
        ...(serviceChargeTotal > 0 ? [['ค่าธรรมเนียมบัตร Service charge (เรียกเก็บเพิ่มจากลูกค้า)', serviceChargeTotal, 'บาท'] as (string | number)[]] : []),
        ['ยอดบิลที่ยกเลิก', canceledNet, 'บาท'],
        ['ต้นทุน', Number(summaryData?.cost || 0), 'บาท'],
        ['กำไร', Number(summaryData?.profit || 0), 'บาท'],
        ['อัตรากำไร', Number(summaryData?.perprofit || 0), '%'],
        ['ยอดขายเฉลี่ยต่อบิล', Number(summaryData?.Bahtperbill || 0), 'บาท/บิล'],
        [filtersActive ? 'ยอดรับสินค้า (ทั้งวัน)' : 'ยอดรับสินค้า', Number(summaryData?.sumRC || 0), 'บาท'],
        [filtersActive ? 'จำนวนรายการรับสินค้า (ทั้งวัน)' : 'จำนวนรายการรับสินค้า', Number(summaryData?.itemRC || 0), 'รายการ'],
        [],
        ['สรุปช่องทางชำระ'],
        ['ช่องทาง', 'จำนวนบิล', 'ยอดรวม (บาท)'],
        ['เงินสด', cashSales.length + splitSales.length, cashTotal],
        ['เงินโอน', transferSales.length + splitSales.length, transferTotal],
        ...(serviceChargeTotal > 0 ? [['ค่าธรรมเนียมบัตร (เรียกเก็บเพิ่ม)', serviceChargeSalesRows.length, serviceChargeTotal] as (string | number)[]] : []),
      ]

      if (splitSales.length > 0) {
        summaryRows.push(['แยกจ่าย', splitSales.length, splitCashTotal + splitTransferTotal])
      }
      if (otherSales.length > 0) {
        summaryRows.push(['อื่นๆ', otherSales.length, otherTotal])
      }

      summaryRows.push([])
      summaryRows.push(['สรุปตามผู้ขาย'])
      summaryRows.push(['ผู้ขาย', 'จำนวนบิล', 'จำนวนรายการ', 'ยอดสุทธิ (บาท)'])
      if (cashierRows.length > 0) {
        summaryRows.push(...cashierRows)
      } else {
        summaryRows.push(['-', 0, 0, 0])
      }

      if (transferRows.length > 0) {
        summaryRows.push([])
        summaryRows.push(['สรุปตามประเภทการโอน'])
        summaryRows.push(['ประเภทการโอน', 'จำนวนบิล', 'ยอดรวม (บาท)'])
        summaryRows.push(...transferRows)
      }

      if (otherRows.length > 0) {
        summaryRows.push([])
        summaryRows.push(['สรุปตามประเภทอื่นๆ'])
        summaryRows.push(['ประเภทอื่นๆ', 'จำนวนบิล', 'ยอดรวม (บาท)'])
        summaryRows.push(...otherRows)
      }

      const billRows = saleRows.map((sale: any, index: number) => ({
        'ลำดับ': index + 1,
        'เลขที่บิล': sale.id,
        'ออเดอร์': sale.orderNo || '-',
        'วันที่': formatDateOnly(sale.createDate),
        'เวลา': formatTimeOnly(sale.createDate),
        'ช่องทางชำระ': sale.pay === 'โอน' ? `โอน (${resolveProviderLabel(sale.transferDetail, providerMap) || 'ไม่ระบุ'})` : sale.pay === 'เงินสด+โอน' ? 'แยกจ่าย' : sale.pay === 'อื่นๆ' ? (resolveProviderLabel(sale.transferDetail, providerMap) || 'อื่นๆ') : sale.pay || '-',
        'รายละเอียดการโอน': resolveProviderLabel(sale.transferDetail, providerMap) || '-',
        'กลุ่มราคา': sale.group_price || '-',
        'จำนวนรายการ': itemCountBySaleId.get(Number(sale.id)) || 0,
        'ยอดก่อนลด': Number(sale.totalall || 0),
        'ตัดแต้ม': Number(sale.usereward || 0),
        'ส่วนลด': Number(sale.discount || 0),
        'ยอดสุทธิ': Number(sale.sumtotal || 0),
        'ค่าธรรมเนียมบัตร': Number(sale.serviceCharge || 0),
        'ยอดเรียกเก็บรวม': Number(sale.sumtotal || 0) + Number(sale.serviceCharge || 0),
        'เงินสด': Number(sale.pay === 'เงินสด+โอน' ? sale.cashAmount || 0 : sale.pay === 'เงินสด' ? sale.sumtotal || 0 : 0),
        'เงินโอน': Number(sale.pay === 'เงินสด+โอน' ? sale.transferAmount || 0 : sale.pay === 'โอน' ? sale.sumtotal || 0 : 0),
        'ผู้ขาย': sale.personall || '-',
        'เหตุผลส่วนลด': sale.discountReason || '-',
        'สถานะ': sale.statussall || 'ปกติ',
      }))

      const detailRows = saleItemRows.map((item: any, index: number) => {
        const bill = saleById.get(Number(item.id_salemain))
        return {
          'ลำดับ': index + 1,
          'เลขที่บิล': item.id_salemain,
          'ออเดอร์': bill?.orderNo || '-',
          'วันที่': formatDateOnly(item.createDate),
          'เวลา': formatTimeOnly(item.createDate),
          'รหัสสินค้า': item.code_product || '-',
          'ชื่อสินค้า': item.name_product || '-',
          'หมวดสินค้า': item.cetagory || '-',
          'ชื่อสามัญ': item.fixname || '-',
          'หน่วย': item.unit || '-',
          'จำนวน': Number(item.qty || 0),
          'จำนวนย่อย': Number(item.subqty || 0),
          'ราคาขาย/หน่วย': Number(item.price || 0),
          'ราคาทุนล่าสุด': Number(item.qty) > 0 ? Number((Number(item.cost || 0) / Number(item.qty)).toFixed(2)) : Number(item.cost || 0),
          'ทุนรวม': Number(item.cost || 0),
          'ส่วนลด': Number(item.discount || 0),
          'ค่าหยิบ': Number(item.gifts || 0),
          'รวม': Number(item.total || 0),
          'ผู้ขาย': item.person || bill?.personall || '-',
          'ช่องทางชำระ': bill?.pay || '-',
          'ช่องทางชำระ (ละเอียด)': bill ? (bill.pay === 'โอน' ? `โอน (${resolveProviderLabel(bill.transferDetail, providerMap) || 'ไม่ระบุ'})` : bill.pay === 'เงินสด+โอน' ? 'แยกจ่าย เงินสด/โอน' : bill.pay === 'อื่นๆ' ? (resolveProviderLabel(bill.transferDetail, providerMap) || 'อื่นๆ') : bill.pay || '-') : '-',
          'สถานะรายการ': item.statuss || 'ปกติ',
          'สถานะบิล': bill?.statussall || 'ปกติ',
        }
      })

      const workbook = XLSX.utils.book_new()
      workbook.Props = {
        Title: 'รายงานการขายประจำวัน',
        Subject: `ยอดขายประจำวันที่ ${reportDate}`,
        Author: 'SmileStore POS',
        CreatedDate: new Date(),
      }

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)
      summarySheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }]
      summarySheet['!cols'] = [
        { wch: 26 },
        { wch: 18 },
        { wch: 14 },
        { wch: 18 },
        { wch: 24 },
      ]

      const billSheet = XLSX.utils.json_to_sheet(billRows)
      billSheet['!autofilter'] = { ref: billSheet['!ref'] || 'A1' }
      billSheet['!cols'] = [
        { wch: 8 },
        { wch: 10 },
        { wch: 16 },
        { wch: 12 },
        { wch: 10 },
        { wch: 18 },
        { wch: 18 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 24 },
        { wch: 12 },
      ]

      const detailSheet = XLSX.utils.json_to_sheet(detailRows)
      detailSheet['!autofilter'] = { ref: detailSheet['!ref'] || 'A1' }
      detailSheet['!cols'] = [
        { wch: 8 },
        { wch: 10 },
        { wch: 16 },
        { wch: 12 },
        { wch: 10 },
        { wch: 12 },
        { wch: 34 },
        { wch: 16 },
        { wch: 20 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
        { wch: 12 },
        { wch: 14 },
        { wch: 22 },
        { wch: 14 },
        { wch: 12 },
      ]

      XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุปยอด')
      XLSX.utils.book_append_sheet(workbook, billSheet, 'สรุปบิล')
      XLSX.utils.book_append_sheet(workbook, detailSheet, 'รายละเอียดสินค้า')
      XLSX.writeFile(workbook, `รายงานขายประจำวัน_${reportDate}.xlsx`)
    } catch (error) {
      console.error('Export daily sales excel error:', error)
      window.alert('ไม่สามารถสร้างไฟล์ Excel ได้')
    } finally {
      setIsExportingDaily(false)
    }
  }

  const exportMonthlySalesExcel = async () => {
    setIsExportingMonthly(true)
    try {
      const XLSX = await import('xlsx')
      const companyName = getLocalStorageItem("company_") || '-'
      const generatedBy = getLocalStorageItem("person_") || '-'
      const reportDate = getReportDateValue()
      const monthStr = reportDate.substring(0, 7) // YYYY-MM

      const res = await axios.get(`/api/sale/monthly?company=${companyName}&month=${monthStr}`)
      const { saleMain: saleMainRows, sales: saleItemRows } = res.data as { saleMain: any[]; sales: any[] }

      const activeSales = saleMainRows.filter((s: any) => s.statussall !== 'ยกเลิก')
      const canceledSales = saleMainRows.filter((s: any) => s.statussall === 'ยกเลิก')

      const totalNet = activeSales.reduce((sum: number, s: any) => sum + Number(s.sumtotal || 0), 0)
      const totalAll = activeSales.reduce((sum: number, s: any) => sum + Number(s.totalall || 0), 0)
      const totalDiscount = activeSales.reduce((sum: number, s: any) => sum + Number(s.discount || 0), 0)
      const totalReward = activeSales.reduce((sum: number, s: any) => sum + Number(s.usereward || 0), 0)
      const canceledNet = canceledSales.reduce((sum: number, s: any) => sum + Number(s.sumtotal || 0), 0)

      const totalCost = saleItemRows.filter((i: any) => i.statuss === 'OK').reduce((sum: number, i: any) => sum + Number(i.cost || 0), 0)
      const totalRevenue = saleItemRows.filter((i: any) => i.statuss === 'OK').reduce((sum: number, i: any) => sum + Number(i.total || 0), 0)
      const profit = totalRevenue - totalCost
      const profitPercent = totalRevenue > 0 ? ((profit / totalRevenue) * 100) : 0

      const splitSales = activeSales.filter((s: any) => s.pay === 'เงินสด+โอน')
      const cashSales = activeSales.filter((s: any) => s.pay === 'เงินสด')
      const transferSales = activeSales.filter((s: any) => s.pay === 'โอน')
      const otherSales = activeSales.filter((s: any) => s.pay === 'อื่นๆ')

      const splitCashTotal = splitSales.reduce((sum: number, s: any) => sum + Number(s.cashAmount || 0), 0)
      const splitTransferTotal = splitSales.reduce((sum: number, s: any) => sum + Number(s.transferAmount || 0), 0)
      const cashTotal = cashSales.reduce((sum: number, s: any) => sum + Number(s.sumtotal || 0), 0) + splitCashTotal
      const transferTotal = transferSales.reduce((sum: number, s: any) => sum + Number(s.sumtotal || 0), 0) + splitTransferTotal
      const otherTotal = otherSales.reduce((sum: number, s: any) => sum + Number(s.sumtotal || 0), 0)
      const serviceChargeSalesRows = activeSales.filter((s: any) => Number(s.serviceCharge || 0) > 0)
      const serviceChargeTotal = serviceChargeSalesRows.reduce((sum: number, s: any) => sum + Number(s.serviceCharge || 0), 0)

      const transferGroups = new Map<string, { total: number; count: number }>()
      transferSales.forEach((s: any) => {
        const key = resolveProviderLabel(s.transferDetail, providerMap) || 'โอน (ไม่ระบุ)'
        const cur = transferGroups.get(key) || { total: 0, count: 0 }
        cur.total += Number(s.sumtotal || 0); cur.count += 1
        transferGroups.set(key, cur)
      })
      splitSales.forEach((s: any) => {
        const key = resolveProviderLabel(s.transferDetail, providerMap) || 'โอน (ไม่ระบุ)'
        const cur = transferGroups.get(key) || { total: 0, count: 0 }
        cur.total += Number(s.transferAmount || 0); cur.count += 1
        transferGroups.set(key, cur)
      })

      const otherGroups = new Map<string, { total: number; count: number }>()
      otherSales.forEach((s: any) => {
        const key = resolveProviderLabel(s.transferDetail, providerMap) || 'อื่นๆ (ไม่ระบุ)'
        const cur = otherGroups.get(key) || { total: 0, count: 0 }
        cur.total += Number(s.sumtotal || 0); cur.count += 1
        otherGroups.set(key, cur)
      })

      const itemCountBySaleId = saleItemRows.reduce((map: Map<number, number>, item: any) => {
        const saleId = Number(item.id_salemain || 0)
        map.set(saleId, (map.get(saleId) || 0) + 1)
        return map
      }, new Map<number, number>())

      const saleById = saleMainRows.reduce((map: Map<number, any>, sale: any) => {
        map.set(Number(sale.id), sale)
        return map
      }, new Map<number, any>())

      const cashierSummaryMap = activeSales.reduce((map: Map<string, { bills: number; amount: number; items: number }>, sale: any) => {
        const cashier = sale.personall || 'ไม่ระบุ'
        const current = map.get(cashier) || { bills: 0, amount: 0, items: 0 }
        current.bills += 1
        current.amount += Number(sale.sumtotal || 0)
        current.items += itemCountBySaleId.get(Number(sale.id)) || 0
        map.set(cashier, current)
        return map
      }, new Map<string, { bills: number; amount: number; items: number }>())

      const cashierRows = Array.from(cashierSummaryMap.entries())
        .sort((a: any, b: any) => b[1].amount - a[1].amount)
        .map(([cashier, metrics]: any) => [cashier, metrics.bills, metrics.items, metrics.amount])

      const transferRows = Array.from(transferGroups.entries())
        .sort((a: any, b: any) => b[1].total - a[1].total)
        .map(([name, metrics]: any) => [name, metrics.count, metrics.total])

      const otherRows = Array.from(otherGroups.entries())
        .sort((a: any, b: any) => b[1].total - a[1].total)
        .map(([name, metrics]: any) => [name, metrics.count, metrics.total])

      const [y, m] = monthStr.split('-')
      const monthLabel = `${m}/${y}`

      const summaryRows: (string | number)[][] = [
        ['รายงานการขายประจำเดือน'],
        ['เดือน', monthLabel, '', 'สร้างเมื่อ', formatDateTime(new Date())],
        ['บริษัท', companyName, '', 'พนักงาน', generatedBy],
        [],
        ['ภาพรวมยอดขาย'],
        ['ตัวชี้วัด', 'ค่า', 'หน่วย'],
        ['จำนวนบิลขาย', activeSales.length, 'บิล'],
        ['จำนวนบิลยกเลิก', canceledSales.length, 'บิล'],
        ['ยอดขายก่อนส่วนลด', totalAll, 'บาท'],
        ['ส่วนลด', totalDiscount, 'บาท'],
        ['ตัดแต้ม', totalReward, 'บาท'],
        ['ยอดขายสุทธิ', totalNet, 'บาท'],
        ...(serviceChargeTotal > 0 ? [['ค่าธรรมเนียมบัตร Service charge (เรียกเก็บเพิ่มจากลูกค้า)', serviceChargeTotal, 'บาท'] as (string | number)[]] : []),
        ['ยอดบิลที่ยกเลิก', canceledNet, 'บาท'],
        ['ต้นทุน', totalCost, 'บาท'],
        ['กำไร', profit, 'บาท'],
        ['อัตรากำไร', Number(profitPercent.toFixed(2)), '%'],
        [],
        ['สรุปช่องทางชำระ'],
        ['ช่องทาง', 'จำนวนบิล', 'ยอดรวม (บาท)'],
        ['เงินสด', cashSales.length + splitSales.length, cashTotal],
        ['เงินโอน', transferSales.length + splitSales.length, transferTotal],
        ...(serviceChargeTotal > 0 ? [['ค่าธรรมเนียมบัตร (เรียกเก็บเพิ่ม)', serviceChargeSalesRows.length, serviceChargeTotal] as (string | number)[]] : []),
      ]

      if (splitSales.length > 0) {
        summaryRows.push(['แยกจ่าย', splitSales.length, splitCashTotal + splitTransferTotal])
      }
      if (otherSales.length > 0) {
        summaryRows.push(['อื่นๆ', otherSales.length, otherTotal])
      }

      summaryRows.push([])
      summaryRows.push(['สรุปตามผู้ขาย'])
      summaryRows.push(['ผู้ขาย', 'จำนวนบิล', 'จำนวนรายการ', 'ยอดสุทธิ (บาท)'])
      if (cashierRows.length > 0) {
        summaryRows.push(...cashierRows)
      } else {
        summaryRows.push(['-', 0, 0, 0])
      }

      if (transferRows.length > 0) {
        summaryRows.push([])
        summaryRows.push(['สรุปตามประเภทการโอน'])
        summaryRows.push(['ประเภทการโอน', 'จำนวนบิล', 'ยอดรวม (บาท)'])
        summaryRows.push(...transferRows)
      }

      if (otherRows.length > 0) {
        summaryRows.push([])
        summaryRows.push(['สรุปตามประเภทอื่นๆ'])
        summaryRows.push(['ประเภทอื่นๆ', 'จำนวนบิล', 'ยอดรวม (บาท)'])
        summaryRows.push(...otherRows)
      }

      const billRows = saleMainRows.map((sale: any, index: number) => ({
        'ลำดับ': index + 1,
        'เลขที่บิล': sale.id,
        'ออเดอร์': sale.orderNo || '-',
        'วันที่': formatDateOnly(sale.createDate),
        'เวลา': formatTimeOnly(sale.createDate),
        'ช่องทางชำระ': sale.pay === 'โอน' ? `โอน (${resolveProviderLabel(sale.transferDetail, providerMap) || 'ไม่ระบุ'})` : sale.pay === 'เงินสด+โอน' ? 'แยกจ่าย' : sale.pay === 'อื่นๆ' ? (resolveProviderLabel(sale.transferDetail, providerMap) || 'อื่นๆ') : sale.pay || '-',
        'รายละเอียดการโอน': resolveProviderLabel(sale.transferDetail, providerMap) || '-',
        'กลุ่มราคา': sale.group_price || '-',
        'จำนวนรายการ': itemCountBySaleId.get(Number(sale.id)) || 0,
        'ยอดก่อนลด': Number(sale.totalall || 0),
        'ตัดแต้ม': Number(sale.usereward || 0),
        'ส่วนลด': Number(sale.discount || 0),
        'ยอดสุทธิ': Number(sale.sumtotal || 0),
        'ค่าธรรมเนียมบัตร': Number(sale.serviceCharge || 0),
        'ยอดเรียกเก็บรวม': Number(sale.sumtotal || 0) + Number(sale.serviceCharge || 0),
        'เงินสด': Number(sale.pay === 'เงินสด+โอน' ? sale.cashAmount || 0 : sale.pay === 'เงินสด' ? sale.sumtotal || 0 : 0),
        'เงินโอน': Number(sale.pay === 'เงินสด+โอน' ? sale.transferAmount || 0 : sale.pay === 'โอน' ? sale.sumtotal || 0 : 0),
        'ผู้ขาย': sale.personall || '-',
        'เหตุผลส่วนลด': sale.discountReason || '-',
        'สถานะ': sale.statussall || 'ปกติ',
      }))

      const detailRows = saleItemRows.map((item: any, index: number) => {
        const bill = saleById.get(Number(item.id_salemain))
        return {
          'ลำดับ': index + 1,
          'เลขที่บิล': item.id_salemain,
          'ออเดอร์': bill?.orderNo || '-',
          'วันที่': formatDateOnly(item.createDate),
          'เวลา': formatTimeOnly(item.createDate),
          'รหัสสินค้า': item.code_product || '-',
          'ชื่อสินค้า': item.name_product || '-',
          'หมวดสินค้า': item.cetagory || '-',
          'ชื่อสามัญ': item.fixname || '-',
          'หน่วย': item.unit || '-',
          'จำนวน': Number(item.qty || 0),
          'จำนวนย่อย': Number(item.subqty || 0),
          'ราคาขาย/หน่วย': Number(item.price || 0),
          'ราคาทุนล่าสุด': Number(item.qty) > 0 ? Number((Number(item.cost || 0) / Number(item.qty)).toFixed(2)) : Number(item.cost || 0),
          'ทุนรวม': Number(item.cost || 0),
          'ส่วนลด': Number(item.discount || 0),
          'ค่าหยิบ': Number(item.gifts || 0),
          'รวม': Number(item.total || 0),
          'ผู้ขาย': item.person || bill?.personall || '-',
          'ช่องทางชำระ': bill?.pay || '-',
          'ช่องทางชำระ (ละเอียด)': bill ? (bill.pay === 'โอน' ? `โอน (${resolveProviderLabel(bill.transferDetail, providerMap) || 'ไม่ระบุ'})` : bill.pay === 'เงินสด+โอน' ? 'แยกจ่าย เงินสด/โอน' : bill.pay === 'อื่นๆ' ? (resolveProviderLabel(bill.transferDetail, providerMap) || 'อื่นๆ') : bill.pay || '-') : '-',
          'สถานะรายการ': item.statuss || 'ปกติ',
          'สถานะบิล': bill?.statussall || 'ปกติ',
        }
      })

      const workbook = XLSX.utils.book_new()
      workbook.Props = {
        Title: 'รายงานการขายประจำเดือน',
        Subject: `ยอดขายประจำเดือน ${monthLabel}`,
        Author: 'SmileStore POS',
        CreatedDate: new Date(),
      }

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)
      summarySheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }]
      summarySheet['!cols'] = [
        { wch: 26 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 24 },
      ]

      const billSheet = XLSX.utils.json_to_sheet(billRows)
      billSheet['!autofilter'] = { ref: billSheet['!ref'] || 'A1' }
      billSheet['!cols'] = [
        { wch: 8 }, { wch: 10 }, { wch: 16 }, { wch: 12 }, { wch: 10 },
        { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
        { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 24 }, { wch: 12 },
      ]

      const detailSheet = XLSX.utils.json_to_sheet(detailRows)
      detailSheet['!autofilter'] = { ref: detailSheet['!ref'] || 'A1' }
      detailSheet['!cols'] = [
        { wch: 8 }, { wch: 10 }, { wch: 16 }, { wch: 12 }, { wch: 10 },
        { wch: 12 }, { wch: 34 }, { wch: 16 }, { wch: 20 }, { wch: 10 },
        { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
        { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 14 },
        { wch: 22 }, { wch: 14 }, { wch: 12 },
      ]

      XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุปยอด')
      XLSX.utils.book_append_sheet(workbook, billSheet, 'สรุปบิล')
      XLSX.utils.book_append_sheet(workbook, detailSheet, 'รายละเอียดสินค้า')
      XLSX.writeFile(workbook, `รายงานขายประจำเดือน_${monthStr}.xlsx`)
    } catch (error) {
      console.error('Export monthly sales excel error:', error)
      window.alert('ไม่สามารถสร้างไฟล์ Excel รายเดือนได้')
    } finally {
      setIsExportingMonthly(false)
    }
  }

  const handlePrintSalesReport = () => {
    const companyName = getLocalStorageItem('company_') || '-'
    const reportDate = all.search_date || new Date().toLocaleDateString('sv-SE')
    const displayDate = new Date(reportDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
    const generatedBy = getLocalStorageItem('person_') || '-'
    const activeSales = dailyReportMetrics.activeSales
    const canceledSales = dailyReportMetrics.canceledSales
    const totalNet = activeSales.reduce((a: number, b: any) => a + Number(b.sumtotal || 0), 0)
    const totalAll = activeSales.reduce((a: number, b: any) => a + Number(b.totalall || 0), 0)
    const totalDiscount = activeSales.reduce((a: number, b: any) => a + Number(b.discount || 0), 0)
    const totalReward = activeSales.reduce((a: number, b: any) => a + Number(b.usereward || 0), 0)
    const summaryData = dailyReportMetrics.summary
    const cashSales = activeSales.filter((s: any) => s.pay === 'เงินสด')
    const transferSales = activeSales.filter((s: any) => s.pay === 'โอน')
    const splitSales = activeSales.filter((s: any) => s.pay === 'เงินสด+โอน')
    const otherSales = activeSales.filter((s: any) => s.pay === 'อื่นๆ')
    const splitCashTotal = splitSales.reduce((a: number, b: any) => a + Number(b.cashAmount || 0), 0)
    const splitTransferTotal = splitSales.reduce((a: number, b: any) => a + Number(b.transferAmount || 0), 0)
    const cashTotal = cashSales.reduce((a: number, b: any) => a + Number(b.sumtotal || 0), 0) + splitCashTotal
    const transferTotal = transferSales.reduce((a: number, b: any) => a + Number(b.sumtotal || 0), 0) + splitTransferTotal
    const otherTotal = otherSales.reduce((a: number, b: any) => a + Number(b.sumtotal || 0), 0)
    const serviceChargeSalesRows = activeSales.filter((s: any) => Number(s.serviceCharge || 0) > 0)
    const serviceChargeTotal = serviceChargeSalesRows.reduce((a: number, b: any) => a + Number(b.serviceCharge || 0), 0)

    // Group by transfer type (resolve provider key → display name)
    const transferGroups: { [k: string]: { total: number; count: number } } = {}
    transferSales.forEach((s: any) => { const k = resolveProviderLabel(s.transferDetail, providerMap) || 'โอน (ไม่ระบุ)'; if (!transferGroups[k]) transferGroups[k] = { total: 0, count: 0 }; transferGroups[k].total += Number(s.sumtotal || 0); transferGroups[k].count += 1 })
    splitSales.forEach((s: any) => { const k = resolveProviderLabel(s.transferDetail, providerMap) || 'โอน (ไม่ระบุ)'; if (!transferGroups[k]) transferGroups[k] = { total: 0, count: 0 }; transferGroups[k].total += Number(s.transferAmount || 0); transferGroups[k].count += 1 })

    // Group "อื่นๆ" by provider type (resolve provider key → display name)
    const otherGroups: { [k: string]: { total: number; count: number } } = {}
    otherSales.forEach((s: any) => { const k = resolveProviderLabel(s.transferDetail, providerMap) || 'อื่นๆ (ไม่ระบุ)'; if (!otherGroups[k]) otherGroups[k] = { total: 0, count: 0 }; otherGroups[k].total += Number(s.sumtotal || 0); otherGroups[k].count += 1 })

    // Group by cashier
    const cashierGroups: { [k: string]: { bills: number; amount: number } } = {}
    activeSales.forEach((s: any) => { const k = s.personall || 'ไม่ระบุ'; if (!cashierGroups[k]) cashierGroups[k] = { bills: 0, amount: 0 }; cashierGroups[k].bills += 1; cashierGroups[k].amount += Number(s.sumtotal || 0) })

    const fmtN = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    // Build sale transaction rows with item details
    const saleRowsHtml = activeSales.map((s: any, i: number) => {
      const items = (saledailycount as any[]).filter((r: any) => r.id_salemain === s.id)
      const time = new Date(String(s.createDate)).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
      const custCode = s.code_costomer || ''
      const custName = customerMap[custCode] || ''
      const custInfo = custCode ? `${custCode}${custName ? '<br>' + custName : ''}` : ''
      const transferLabel = resolveProviderLabel(s.transferDetail, providerMap)
      const payBadge = s.pay === 'เงินสด' ? '<span style="color:#2A6AAA">เงินสด</span>'
        : s.pay === 'โอน' ? `<span style="color:#2A6AAA">${transferLabel || 'โอน'}</span>`
        : s.pay === 'เงินสด+โอน' ? `<span style="color:#b45309">แยกจ่าย</span>`
        : s.pay === 'อื่นๆ' ? `<span style="color:#7c3aed">${transferLabel || 'อื่นๆ'}</span>`
        : `<span style="color:#64748b">${s.pay || '-'}</span>`
      const itemRowsHtml = items.map((it: any, j: number) => {
        const isCanceled = it.statuss === 'ยกเลิก'
        const bgColor = isCanceled ? '#fef2f2' : j % 2 === 0 ? '#f8fafc' : '#ffffff'
        const borderBottom = j < items.length - 1 ? 'border-bottom:1px solid #e2e8f0;' : ''
        return `<tr style="background:${bgColor};${borderBottom}${isCanceled ? 'text-decoration:line-through;color:#991b1b;' : ''}">
          <td style="padding:5px 8px;font-size:9px;text-align:center;color:#94a3b8">${j + 1}</td>
          <td style="padding:5px 8px;font-size:9px;color:#3E86C7;font-weight:600;letter-spacing:0.3px">${it.code_product || '-'}</td>
          <td style="padding:5px 8px;font-size:9px;color:#334155">${it.name_product || '-'}</td>
          <td style="padding:5px 8px;font-size:9px;text-align:center;color:#64748b">${it.unit || '-'}</td>
          <td style="padding:5px 8px;font-size:9px;text-align:center;font-weight:600;color:#334155">${Number(it.qty || 0)}</td>
          <td style="padding:5px 8px;font-size:9px;text-align:right;color:#334155">${fmtN(Number(it.price || 0))}</td>
          <td style="padding:5px 8px;font-size:9px;text-align:right;color:#ef4444">${Number(it.discount || 0) > 0 ? fmtN(Number(it.discount || 0)) : '-'}</td>
          <td style="padding:5px 8px;font-size:9px;text-align:right;font-weight:700;color:#173F6B">${fmtN(Number(it.total || 0))}</td>
        </tr>`
      }).join('')
      return `<tr style="border-bottom:1px solid #cbd5e1;background:#e8edf5;cursor:pointer">
        <td style="padding:6px 8px;text-align:center;font-size:11px;font-weight:700">${i + 1}</td>
        <td style="padding:6px 8px;text-align:center;font-size:11px;font-weight:600">${time}</td>
        <td style="padding:6px 8px;text-align:center;font-size:11px;font-weight:600">${s.orderNo || '-'}</td>
        <td style="padding:6px 8px;text-align:center;font-size:11px">${payBadge}</td>
        <td style="padding:6px 8px;text-align:center;font-size:11px;font-weight:600;color:#6366f1">${items.length}</td>
        <td style="padding:6px 8px;text-align:right;font-size:11px">${fmtN(Number(s.totalall || 0))}</td>
        <td style="padding:6px 8px;text-align:right;font-size:11px;color:#ef4444">${Number(s.discount || 0) > 0 ? '-' + fmtN(Number(s.discount || 0)) : '-'}</td>
        <td style="padding:6px 8px;text-align:right;font-size:11px;font-weight:700;color:#2A6AAA">${fmtN(Number(s.sumtotal || 0))}</td>
        <td style="padding:6px 8px;text-align:left;font-size:10px">${custInfo || '-'}</td>
        <td style="padding:6px 8px;text-align:center;font-size:10px">${s.personall || '-'}</td>
      </tr>
      ${items.length > 0 ? `<tr><td colspan="10" style="padding:4px 12px 8px 24px;background:#f8fafc">
        <table style="width:100%;border-collapse:collapse;border:1px solid #cbd5e1;border-radius:6px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <thead><tr style="background:linear-gradient(135deg,#e0e7ff,#E5EEF8)">
            <th style="padding:5px 8px;font-size:8px;color:#12314F;text-align:center;width:4%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">#</th>
            <th style="padding:5px 8px;font-size:8px;color:#12314F;text-align:left;width:12%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">รหัส</th>
            <th style="padding:5px 8px;font-size:8px;color:#12314F;text-align:left;width:34%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">รายการสินค้า</th>
            <th style="padding:5px 8px;font-size:8px;color:#12314F;text-align:center;width:8%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">หน่วย</th>
            <th style="padding:5px 8px;font-size:8px;color:#12314F;text-align:center;width:8%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">จำนวน</th>
            <th style="padding:5px 8px;font-size:8px;color:#12314F;text-align:right;width:12%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">ราคา/หน่วย</th>
            <th style="padding:5px 8px;font-size:8px;color:#12314F;text-align:right;width:10%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">ส่วนลด</th>
            <th style="padding:5px 8px;font-size:8px;color:#12314F;text-align:right;width:12%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">รวม</th>
          </tr></thead>
          <tbody>${itemRowsHtml}</tbody>
        </table>
      </td></tr>` : ''}`
    }).join('')

    // Canceled rows with item details
    const canceledRowsHtml = canceledSales.map((s: any, i: number) => {
      const items = (saledailycount as any[]).filter((r: any) => r.id_salemain === s.id)
      const time = new Date(String(s.createDate)).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
      const custCode = s.code_costomer || ''
      const custName = customerMap[custCode] || ''
      const custInfo = custCode ? `${custCode}${custName ? '<br>' + custName : ''}` : ''
      const cancelItemRowsHtml = items.map((it: any, j: number) => {
        const borderBottom = j < items.length - 1 ? 'border-bottom:1px solid #fecaca;' : ''
        return `<tr style="background:${j % 2 === 0 ? '#fef2f2' : '#fff5f5'};text-decoration:line-through;color:#991b1b;${borderBottom}">
          <td style="padding:5px 8px;font-size:9px;text-align:center">${j + 1}</td>
          <td style="padding:5px 8px;font-size:9px;font-weight:600;letter-spacing:0.3px">${it.code_product || '-'}</td>
          <td style="padding:5px 8px;font-size:9px">${it.name_product || '-'}</td>
          <td style="padding:5px 8px;font-size:9px;text-align:center">${it.unit || '-'}</td>
          <td style="padding:5px 8px;font-size:9px;text-align:center;font-weight:600">${Number(it.qty || 0)}</td>
          <td style="padding:5px 8px;font-size:9px;text-align:right">${fmtN(Number(it.price || 0))}</td>
          <td style="padding:5px 8px;font-size:9px;text-align:right">${Number(it.discount || 0) > 0 ? fmtN(Number(it.discount || 0)) : '-'}</td>
          <td style="padding:5px 8px;font-size:9px;text-align:right;font-weight:700">${fmtN(Number(it.total || 0))}</td>
        </tr>`
      }).join('')
      return `<tr style="border-bottom:1px solid #fca5a5;background:#fef2f2;color:#991b1b">
        <td style="padding:6px 8px;text-align:center;font-size:11px;font-weight:700">${i + 1}</td>
        <td style="padding:6px 8px;text-align:center;font-size:11px;font-weight:600">${time}</td>
        <td style="padding:6px 8px;text-align:center;font-size:11px;font-weight:600">${s.orderNo || '-'}</td>
        <td style="padding:6px 8px;text-align:center;font-size:11px"><span style="background:#991b1b;color:#fff;padding:1px 6px;border-radius:4px;font-size:9px">ยกเลิก</span></td>
        <td style="padding:6px 8px;text-align:center;font-size:11px;font-weight:600">${items.length}</td>
        <td style="padding:6px 8px;text-align:right;font-size:11px;text-decoration:line-through">${fmtN(Number(s.totalall || 0))}</td>
        <td style="padding:6px 8px;text-align:right;font-size:11px">-</td>
        <td style="padding:6px 8px;text-align:right;font-size:11px;text-decoration:line-through">${fmtN(Number(s.sumtotal || 0))}</td>
        <td style="padding:6px 8px;text-align:left;font-size:10px">${custInfo || '-'}</td>
        <td style="padding:6px 8px;text-align:center;font-size:10px">${s.personall || '-'}</td>
      </tr>
      ${items.length > 0 ? `<tr><td colspan="10" style="padding:4px 12px 8px 24px;background:#fef2f2">
        <table style="width:100%;border-collapse:collapse;border:1px solid #fca5a5;border-radius:6px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <thead><tr style="background:linear-gradient(135deg,#fecaca,#fca5a5)">
            <th style="padding:5px 8px;font-size:8px;color:#7f1d1d;text-align:center;width:4%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">#</th>
            <th style="padding:5px 8px;font-size:8px;color:#7f1d1d;text-align:left;width:12%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">รหัส</th>
            <th style="padding:5px 8px;font-size:8px;color:#7f1d1d;text-align:left;width:34%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">รายการสินค้า</th>
            <th style="padding:5px 8px;font-size:8px;color:#7f1d1d;text-align:center;width:8%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">หน่วย</th>
            <th style="padding:5px 8px;font-size:8px;color:#7f1d1d;text-align:center;width:8%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">จำนวน</th>
            <th style="padding:5px 8px;font-size:8px;color:#7f1d1d;text-align:right;width:12%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">ราคา/หน่วย</th>
            <th style="padding:5px 8px;font-size:8px;color:#7f1d1d;text-align:right;width:10%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">ส่วนลด</th>
            <th style="padding:5px 8px;font-size:8px;color:#7f1d1d;text-align:right;width:12%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">รวม</th>
          </tr></thead>
          <tbody>${cancelItemRowsHtml}</tbody>
        </table>
      </td></tr>` : ''}`
    }).join('')

    // Transfer group rows
    const transferGroupRows = Object.entries(transferGroups).sort((a, b) => b[1].total - a[1].total)
      .map(([name, d]) => `<tr><td style="padding:4px 8px;font-size:11px">${name}</td><td style="padding:4px 8px;text-align:center;font-size:11px;color:#64748b">${d.count} บิล</td><td style="padding:4px 8px;text-align:right;font-size:11px;font-weight:600">${fmtN(d.total)}</td></tr>`).join('')

    const otherGroupRows = Object.entries(otherGroups).sort((a, b) => b[1].total - a[1].total)
      .map(([name, d]) => `<tr><td style="padding:4px 8px;font-size:11px">${name}</td><td style="padding:4px 8px;text-align:center;font-size:11px;color:#64748b">${d.count} บิล</td><td style="padding:4px 8px;text-align:right;font-size:11px;font-weight:600">${fmtN(d.total)}</td></tr>`).join('')

    // Cashier rows
    const cashierRows = Object.entries(cashierGroups).sort((a, b) => b[1].amount - a[1].amount)
      .map(([name, d]) => `<tr><td style="padding:4px 12px;font-size:11px">${name}</td><td style="padding:4px 12px;text-align:center;font-size:11px">${d.bills} บิล</td><td style="padding:4px 12px;text-align:right;font-size:11px;font-weight:600">${fmtN(d.amount)}</td></tr>`).join('')

    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>รายงานขายสินค้า ${displayDate}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Sarabun',sans-serif; color:#1e293b; background:#fff; }
      @page { size:A4 portrait; margin:15mm 12mm 15mm 12mm; }
      @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } .no-print{display:none!important;} }
      .page { width:210mm; min-height:297mm; margin:0 auto; padding:15mm 12mm; }
      table { width:100%; border-collapse:collapse; }
      .section-title { font-size:13px; font-weight:700; color:#173F6B; border-bottom:2px solid #3E86C7; padding-bottom:4px; margin:18px 0 8px 0; }
    </style></head><body>
    <div class="page">
      <!-- HEADER -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1e3a5f;padding-bottom:12px;margin-bottom:16px">
        <div>
          <div style="font-size:22px;font-weight:700;color:#1e3a5f">📊 รายงานขายสินค้า</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px">DAILY SALES REPORT</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:14px;font-weight:700;color:#1e3a5f">${companyName}</div>
          <div style="font-size:11px;color:#64748b">วันที่ : ${displayDate}</div>
          <div style="font-size:11px;color:#64748b">ขอบเขต : ${escapeHtml(reportScopeLabel)}</div>
          <div style="font-size:11px;color:#64748b">พิมพ์โดย : ${generatedBy}</div>
        </div>
      </div>

      <!-- SUMMARY CARDS -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">
        <div style="background:#F3F8FC;border:1px solid #A6C8E7;border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:10px;color:#173F6B">ยอดขายสุทธิ</div>
          <div style="font-size:20px;font-weight:800;color:#1E5088">${fmtN(totalNet)}</div>
          <div style="font-size:9px;color:#2A6AAA">${activeSales.length} บิล</div>
        </div>
        <div style="background:#F3F8FC;border:1px solid #A6C8E7;border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:10px;color:#173F6B">ยอดก่อนส่วนลด</div>
          <div style="font-size:20px;font-weight:800;color:#2A6AAA">${fmtN(totalAll)}</div>
        </div>
        <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:10px;color:#991b1b">ส่วนลด</div>
          <div style="font-size:20px;font-weight:800;color:#dc2626">-${fmtN(totalDiscount)}</div>
        </div>
        <div style="background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:10px;color:#854d0e">ตัดแต้ม</div>
          <div style="font-size:20px;font-weight:800;color:#ca8a04">${fmtN(totalReward)}</div>
        </div>
      </div>

      <!-- PROFIT CARDS -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">
        <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:10px;color:#9a3412">ต้นทุน</div>
          <div style="font-size:16px;font-weight:700;color:#ea580c">${fmtN(Number(summaryData?.cost || 0))}</div>
        </div>
        <div style="background:#F3F8FC;border:1px solid #A6C8E7;border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:10px;color:#0C5238">กำไร</div>
          <div style="font-size:16px;font-weight:700;color:#147F56">${fmtN(Number(summaryData?.profit || 0))}</div>
        </div>
        <div style="background:#f5f3ff;border:1px solid #c4b5fd;border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:10px;color:#6b21a8">%กำไร</div>
          <div style="font-size:16px;font-weight:700;color:#7c3aed">${Number(summaryData?.perprofit || 0).toFixed(1)}%</div>
        </div>
        <div style="background:#fdf2f8;border:1px solid #f9a8d4;border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:10px;color:#9d174d">เฉลี่ย/บิล</div>
          <div style="font-size:16px;font-weight:700;color:#db2777">${fmtN(Number(summaryData?.Bahtperbill || 0))}</div>
        </div>
      </div>

      <!-- PAYMENT SUMMARY -->
      <div class="section-title">💳 สรุปช่องทางชำระเงิน</div>
      <div style="display:grid;grid-template-columns:repeat(${2 + (otherSales.length > 0 ? 1 : 0) + (serviceChargeTotal > 0 ? 1 : 0)},1fr);gap:8px;margin-bottom:8px">
        <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:12px">
          <div style="font-size:10px;color:#173F6B;margin-bottom:4px">💵 เงินสด</div>
          <div style="font-size:18px;font-weight:700;color:#2A6AAA">${fmtN(cashTotal)}</div>
          <div style="font-size:9px;color:#102C4C">${cashSales.length + splitSales.length} บิล${totalNet > 0 ? ` · ${((cashTotal / totalNet) * 100).toFixed(1)}%` : ''}</div>
        </div>
        <div style="background:#F3F8FC;border:1px solid #A6C8E7;border-radius:8px;padding:12px">
          <div style="font-size:10px;color:#173F6B;margin-bottom:4px">🏦 เงินโอน</div>
          <div style="font-size:18px;font-weight:700;color:#2A6AAA">${fmtN(transferTotal)}</div>
          <div style="font-size:9px;color:#12314F">${transferSales.length + splitSales.length} บิล${totalNet > 0 ? ` · ${((transferTotal / totalNet) * 100).toFixed(1)}%` : ''}</div>
        </div>
        ${otherSales.length > 0 ? `<div style="background:#f5f3ff;border:1px solid #c4b5fd;border-radius:8px;padding:12px">
          <div style="font-size:10px;color:#5b21b6;margin-bottom:4px">💳 อื่นๆ</div>
          <div style="font-size:18px;font-weight:700;color:#7c3aed">${fmtN(otherTotal)}</div>
          <div style="font-size:9px;color:#4c1d95">${otherSales.length} บิล${totalNet > 0 ? ` · ${((otherTotal / totalNet) * 100).toFixed(1)}%` : ''}</div>
        </div>` : ''}
        ${serviceChargeTotal > 0 ? `<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px">
          <div style="font-size:10px;color:#92400e;margin-bottom:4px">💳 ค่าธรรมเนียมบัตร</div>
          <div style="font-size:18px;font-weight:700;color:#b45309">+${fmtN(serviceChargeTotal)}</div>
          <div style="font-size:9px;color:#78350f">${serviceChargeSalesRows.length} บิล · เรียกเก็บเพิ่มจากลูกค้า</div>
        </div>` : ''}
      </div>
      ${(Object.keys(transferGroups).length > 0 || Object.keys(otherGroups).length > 0) ? `
      <div style="display:grid;grid-template-columns:repeat(${(Object.keys(transferGroups).length > 0 && Object.keys(otherGroups).length > 0) ? 2 : 1},1fr);gap:8px;margin-bottom:12px">
        ${Object.keys(transferGroups).length > 0 ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px">
          <div style="font-size:10px;color:#173F6B;font-weight:700;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px">🏦 แยกตามประเภทโอน</div>
          <table style="width:100%;border-collapse:collapse">${transferGroupRows}</table>
        </div>` : ''}
        ${Object.keys(otherGroups).length > 0 ? `<div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:10px 12px">
          <div style="font-size:10px;color:#6b21a8;font-weight:700;margin-bottom:6px;border-bottom:1px solid #e9d5ff;padding-bottom:4px">💳 แยกตามประเภทอื่นๆ</div>
          <table style="width:100%;border-collapse:collapse">${otherGroupRows}</table>
        </div>` : ''}
      </div>` : ''}

      <!-- CASHIER SUMMARY -->
      ${Object.keys(cashierGroups).length > 0 ? `
      <div class="section-title">👤 สรุปตามผู้ขาย</div>
      <table style="margin-bottom:12px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
        <thead><tr style="background:#f1f5f9">
          <th style="padding:6px 12px;text-align:left;font-size:11px;font-weight:600;color:#475569">ผู้ขาย</th>
          <th style="padding:6px 12px;text-align:center;font-size:11px;font-weight:600;color:#475569">จำนวนบิล</th>
          <th style="padding:6px 12px;text-align:right;font-size:11px;font-weight:600;color:#475569">ยอดสุทธิ (บาท)</th>
        </tr></thead>
        <tbody>${cashierRows}</tbody>
      </table>` : ''}

      <!-- TRANSACTIONS TABLE -->
      <div class="section-title">📋 รายการขายทั้งหมด (${activeSales.length} บิล)</div>
      <table style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:12px">
        <thead><tr style="background:#1e3a5f">
          <th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:600;text-align:center;width:5%">#</th>
          <th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:600;text-align:center;width:8%">เวลา</th>
          <th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:600;text-align:center;width:12%">เลขที่บิล</th>
          <th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:600;text-align:center;width:9%">ชำระ</th>
          <th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:600;text-align:center;width:6%">รายการ</th>
          <th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:600;text-align:right;width:12%">ยอดรวม</th>
          <th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:600;text-align:right;width:10%">ส่วนลด</th>
          <th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:600;text-align:right;width:12%">สุทธิ</th>
          <th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:600;text-align:left;width:16%">ลูกค้า</th>
          <th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:600;text-align:center;width:10%">ผู้ขาย</th>
        </tr></thead>
        <tbody>
          ${saleRowsHtml}
          <tr style="background:#F3F8FC;border-top:2px solid #2A6AAA">
            <td colspan="5" style="padding:8px 12px;font-size:12px;font-weight:700;color:#2A6AAA;text-align:right">รวมทั้งสิ้น (${activeSales.length} บิล)</td>
            <td style="padding:8px;text-align:right;font-size:12px;font-weight:700">${fmtN(totalAll)}</td>
            <td style="padding:8px;text-align:right;font-size:12px;font-weight:700;color:#ef4444">${totalDiscount > 0 ? '-' + fmtN(totalDiscount) : '-'}</td>
            <td style="padding:8px;text-align:right;font-size:14px;font-weight:800;color:#2A6AAA">${fmtN(totalNet)}</td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>

      ${canceledSales.length > 0 ? `
      <!-- CANCELED -->
      <div class="section-title" style="color:#991b1b;border-color:#ef4444">❌ รายการที่ยกเลิก (${canceledSales.length} บิล)</div>
      <table style="border:1px solid #fca5a5;border-radius:8px;overflow:hidden;margin-bottom:12px">
        <thead><tr style="background:#991b1b">
          <th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:600;text-align:center;width:5%">#</th>
          <th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:600;text-align:center;width:8%">เวลา</th>
          <th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:600;text-align:center;width:12%">เลขที่บิล</th>
          <th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:600;text-align:center;width:9%">สถานะ</th>
          <th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:600;text-align:center;width:6%">รายการ</th>
          <th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:600;text-align:right;width:12%">ยอดรวม</th>
          <th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:600;text-align:right;width:10%">ส่วนลด</th>
          <th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:600;text-align:right;width:12%">สุทธิ</th>
          <th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:600;text-align:left;width:16%">ลูกค้า</th>
          <th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:600;text-align:center;width:10%">ผู้ขาย</th>
        </tr></thead>
        <tbody>${canceledRowsHtml}</tbody>
      </table>` : ''}

      <!-- FOOTER -->
      <div style="margin-top:20px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8">
        <span>พิมพ์เมื่อ : ${new Date().toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        <span>SmileStore POS</span>
      </div>
    </div></body></html>`)
    printWindow.document.close()
    setTimeout(() => { printWindow.focus(); printWindow.print() }, 400)
  }

  const statCardStyle = {
    backgroundColor: 'white', borderRadius: '12px', padding: '8px 12px',
    border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
    minWidth: '94px', height: '70px'
  };

  const SummaryReport = () => {
    const summaryData = dailyReportMetrics.summary
    const stats = [
      { label: 'จำนวนบิล', value: summaryData.bill, unit: 'บิล', color: '#4f46e5', bg: '#f5f7ff', code: 'J2' },
      { label: 'ยอดขาย', value: Number(summaryData.revenue).toFixed(0), unit: 'บาท', color: '#2A6AAA', bg: '#F3F8FC', code: 'J3' },
      { label: 'ต้นทุน', value: Number(summaryData.cost).toFixed(0), unit: 'บาท', color: '#b45309', bg: '#fffbeb', code: 'J4' },
      { label: 'กำไร', value: Number(summaryData.profit).toFixed(0), unit: 'บาท', color: '#0F6845', bg: '#EDF9F3', code: 'J5' },
      { label: '%กำไร', value: Number(summaryData.perprofit).toFixed(0), unit: '%', color: '#7c3aed', bg: '#f5f3ff', code: 'J6' },
    ];
    const splitBill = Number(summaryData.splitbill) || 0
    const splitCash = Number(summaryData.splitCash) || 0
    const splitTransfer = Number(summaryData.splitTransfer) || 0
    const otherBill = Number(summaryData.otherbill) || 0
    const serviceChargeSum = Number(summaryData.serviceCharge) || 0
    const serviceChargeBillCount = Number(summaryData.serviceChargeBill) || 0
    const stats2 = [
      { label: 'เงินสด', value: Number(summaryData.cash).toFixed(0), unit: 'บาท', count: Number(summaryData.cashbill).toFixed(0), color: '#173F6B', bg: '#f0fdfa', code: 'J7' },
      { label: 'เงินโอน', value: Number(summaryData.payment).toFixed(0), unit: 'บาท', count: Number(summaryData.paymentbill).toFixed(0), color: '#1E5088', bg: '#F3F8FC', code: 'J8' },
      ...(otherBill > 0 ? [{ label: 'อื่นๆ', value: Number(summaryData.other).toFixed(0), unit: 'บาท', count: String(otherBill), color: '#7c3aed', bg: '#f5f3ff', code: 'J8' }] : []),
      ...(splitBill > 0 ? [{ label: 'แยกจ่าย', value: (splitCash + splitTransfer)?.toFixed(0), unit: 'บาท', count: String(splitBill), color: '#b45309', bg: '#fffbeb', code: 'J7' }] : []),
      ...(serviceChargeSum > 0 ? [{ label: '💳 ค่าธรรมเนียมบัตร', value: '+' + serviceChargeSum.toFixed(2), unit: 'บาท', count: String(serviceChargeBillCount), color: '#b45309', bg: '#fffbeb', code: 'J8' }] : []),
      { label: 'ยอดขาย/บิล', value: Number(summaryData.Bahtperbill).toFixed(0), unit: 'บาท/บิล', color: '#be185d', bg: '#fff1f2', code: 'J9' },
      { label: filtersActive ? 'ยอดรับสินค้า (ทั้งวัน)' : 'ยอดรับสินค้า', value: Number(summaryData.sumRC).toFixed(0), unit: 'บาท', count: Number(summaryData.itemRC).toFixed(0), color: '#c2410c', bg: '#fff7ed', code: 'J10' },
    ];

    return (
      <div className={styles.reportSummaryGridWrap}>
        <div className={styles.reportSummaryHeader}>
          <span>สรุปยอดรายวัน</span>
          <span>{filtersActive ? reportScopeLabel : (all.search_date || new Date().toLocaleDateString('sv-SE'))}</span>
        </div>
        <div className={styles.reportSummaryGrid}>
          {stats.map((s, i) => (
            (hasPermission(s.code)) && (
              <div key={i} className={styles.reportSummaryStatCard} style={{ ...statCardStyle, backgroundColor: s.bg, border: `1px solid ${s.color}20` }}>
                <div style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#475569', marginBottom: '2px' }}>{s.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontFamily: 'Kanit_B', fontSize: '22px', color: s.color, lineHeight: 1 }}>{s.value}</span>
                  <span style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#64748b' }}>{s.unit}</span>
                </div>
              </div>
            )
          ))}
        </div>
        <div className={styles.reportSummaryGrid}>
          {stats2.map((s, i) => (
            (hasPermission(s.code)) && (
              <div key={i} className={styles.reportSummaryStatCard} style={{ ...statCardStyle, backgroundColor: s.bg, height: '80px', border: `1px solid ${s.color}20` }}>
                <div style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#475569', marginBottom: '2px' }}>{s.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontFamily: 'Kanit_B', fontSize: '19px', color: s.color, lineHeight: 1 }}>{s.value}</span>
                  <span style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#64748b' }}>{s.unit}</span>
                </div>
                {s.count && <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{s.count} รายการ</div>}
              </div>
            )
          ))}
        </div>
      </div>
    )
  }

  const canManageReportShifts = (currentUserLevel || getLocalJwtLevel()) === 'level2'
  const reportDateDisplay = all.search_date === "" ? new Date().toLocaleDateString("es-US", { day: "2-digit", month: "2-digit", year: "numeric" }) : new Date(all.search_date).toLocaleDateString("es-US", { day: "2-digit", month: "2-digit", year: "numeric" })
  const drawerTotal = saledaily.filter((r: any) => r.statussall === "" && r.personall === String(getLocalStorageItem("person_") || "")).reduce((a: any, b: any) => a + (b.pay === "เงินสด" ? Number(b.sumtotal) : b.pay === "เงินสด+โอน" ? Number(b.cashAmount || 0) : 0), 0) + initialDrawer
  const visibleBillLabel = filtersActive ? `${filteredSaledaily.length}/${saledaily.length}` : String(saledaily.length)

  return (
    <div style={{ paddingLeft: 15, paddingRight: 15, backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: 20 }}>
      <div className="row justify-content-start"><HeadTab /></div>
      <div className="row justify-content-start">
        <div className="col-sm-1"><MenuTab_Small /></div>
        <div className="col-sm-11">
          {/* Main Tab Navigation */}
          <div style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '8px',
            backgroundColor: 'white',
            padding: '4px 10px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: '1px solid #e2e8f0',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => setMainTab('daily')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'daily' ? '#f0f3ff' : '#f1f5f9',
                color: mainTab === 'daily' ? '#4f46e5' : '#64748b',
                border: mainTab === 'daily' ? '1px solid #6366f1' : 'none',
                boxShadow: mainTab === 'daily' ? '0 4px 6px rgba(99,102,241,0.1)' : 'none',
              }}
            >
              <BarChart3 size={16} />
              รายงานประจำวัน
            </button>
            <button
              onClick={() => setMainTab('all')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'all' ? '#F3F8FC' : '#f1f5f9',
                color: mainTab === 'all' ? '#2A6AAA' : '#64748b',
                border: mainTab === 'all' ? '1px solid #3E86C7' : 'none',
                boxShadow: mainTab === 'all' ? '0 4px 6px rgba(42, 106, 170,0.1)' : 'none',
              }}
            >
              <ClipboardList size={16} />
              รายงานทั้งหมด
            </button>
            <button
              onClick={() => setMainTab('product')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'product' ? '#f5f3ff' : '#f1f5f9',
                color: mainTab === 'product' ? '#6d28d9' : '#64748b',
                border: mainTab === 'product' ? '1px solid #8b5cf6' : 'none',
                boxShadow: mainTab === 'product' ? '0 4px 6px rgba(139,92,246,0.1)' : 'none',
              }}
            >
              <Package size={16} />
              รายงานวิเคราะห์สินค้า
            </button>
            <button
              onClick={() => setMainTab('category')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'category' ? '#fffbeb' : '#f1f5f9',
                color: mainTab === 'category' ? '#b45309' : '#64748b',
                border: mainTab === 'category' ? '1px solid #f59e0b' : 'none',
                boxShadow: mainTab === 'category' ? '0 4px 6px rgba(245,158,11,0.1)' : 'none',
              }}
            >
              <Layers size={16} />
              รายงานวิเคราะห์กลุ่มสินค้า
            </button>
            <button
              onClick={() => setMainTab('slowmove')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'slowmove' ? '#fef2f2' : '#f1f5f9',
                color: mainTab === 'slowmove' ? '#dc2626' : '#64748b',
                border: mainTab === 'slowmove' ? '1px solid #ef4444' : 'none',
                boxShadow: mainTab === 'slowmove' ? '0 4px 6px rgba(220,38,38,0.1)' : 'none',
              }}
            >
              <Package size={16} />
              สินค้า Slow Move
            </button>
            <button
              onClick={() => setMainTab('expiry')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'expiry' ? '#fff7ed' : '#f1f5f9',
                color: mainTab === 'expiry' ? '#ea580c' : '#64748b',
                border: mainTab === 'expiry' ? '1px solid #ea580c' : 'none',
                boxShadow: mainTab === 'expiry' ? '0 4px 6px rgba(234,88,12,0.1)' : 'none',
              }}
            >
              <ShieldAlert size={16} />
              สินค้าหมดอายุ
            </button>
            <button
              onClick={() => setMainTab('gift')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'gift' ? '#faf5ff' : '#f1f5f9',
                color: mainTab === 'gift' ? '#7e22ce' : '#64748b',
                border: mainTab === 'gift' ? '1px solid #9333ea' : 'none',
                boxShadow: mainTab === 'gift' ? '0 4px 6px rgba(147,51,234,0.1)' : 'none',
              }}
            >
              <Gift size={16} />
              รายงานยอดเป้า ค่าหยิบ
            </button>
            {String(getLocalStorageItem("level_")) !== "level1" && (
            <button
              onClick={() => setMainTab('vendor')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'vendor' ? '#eef2ff' : '#f1f5f9',
                color: mainTab === 'vendor' ? '#4f46e5' : '#64748b',
                border: mainTab === 'vendor' ? '1px solid #6366f1' : 'none',
                boxShadow: mainTab === 'vendor' ? '0 4px 6px rgba(99,102,241,0.1)' : 'none',
              }}
            >
              <Building2 size={16} />
              วิเคราะห์ผู้ขาย
            </button>
            )}
            {String(getLocalStorageItem("level_")) === "level2" && (
            <button
              onClick={() => setMainTab('attendance')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'attendance' ? '#fef3c7' : '#f1f5f9',
                color: mainTab === 'attendance' ? '#b45309' : '#64748b',
                border: mainTab === 'attendance' ? '1px solid #f59e0b' : 'none',
                boxShadow: mainTab === 'attendance' ? '0 4px 6px rgba(245,158,11,0.1)' : 'none',
              }}
            >
              <Clock size={16} />
              รายงานเข้า-ออก งาน
            </button>
            )}
            {/** 
            <button
              onClick={() => setMainTab('saleky')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'saleky' ? '#f5f3ff' : '#f1f5f9',
                color: mainTab === 'saleky' ? '#7c3aed' : '#64748b',
                border: mainTab === 'saleky' ? '1px solid #8b5cf6' : 'none',
                boxShadow: mainTab === 'saleky' ? '0 4px 6px rgba(139,92,246,0.1)' : 'none',
              }}
            >
              <ClipboardList size={16} />
              รายงานขายตาม ข.ย.
            </button>*/}
            {String(getLocalStorageItem("level_")) === "level2" && (
            <button
              onClick={() => setMainTab('customer')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'customer' ? '#ecfeff' : '#f1f5f9',
                color: mainTab === 'customer' ? '#0891b2' : '#64748b',
                border: mainTab === 'customer' ? '1px solid #06b6d4' : 'none',
                boxShadow: mainTab === 'customer' ? '0 4px 6px rgba(8,145,178,0.1)' : 'none',
              }}
            >
              <ClipboardList size={16} />
              วิเคราะห์ลูกค้า
            </button>
            )}
            {String(getLocalStorageItem("level_")) === "level2" && (
            <button
              onClick={() => setMainTab('payment')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'payment' ? '#f5f3ff' : '#f1f5f9',
                color: mainTab === 'payment' ? '#7c3aed' : '#64748b',
                border: mainTab === 'payment' ? '1px solid #8b5cf6' : 'none',
                boxShadow: mainTab === 'payment' ? '0 4px 6px rgba(124,58,237,0.1)' : 'none',
              }}
            >
              <CreditCard size={16} />
              สรุปชำระเงิน
            </button>
            )}
            {String(getLocalStorageItem("level_")) === "level2" && (
            <button
              onClick={() => setMainTab('pl')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'pl' ? '#F3F8FC' : '#f1f5f9',
                color: mainTab === 'pl' ? '#0f766e' : '#64748b',
                border: mainTab === 'pl' ? '1px solid #14b8a6' : 'none',
                boxShadow: mainTab === 'pl' ? '0 4px 6px rgba(15,118,110,0.1)' : 'none',
              }}
            >
              <DollarSign size={16} />
              งบกำไรขาดทุน
            </button>
            )}
            {/** แจ้งเตือนสต็อก - hidden
            {String(getLocalStorageItem("level_")) === "level2" && (
            <button
              onClick={() => setMainTab('stockalert')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'stockalert' ? '#fef2f2' : '#f1f5f9',
                color: mainTab === 'stockalert' ? '#dc2626' : '#64748b',
                border: mainTab === 'stockalert' ? '1px solid #ef4444' : 'none',
                boxShadow: mainTab === 'stockalert' ? '0 4px 6px rgba(220,38,38,0.1)' : 'none',
              }}
            >
              <ShieldAlert size={16} />
              แจ้งเตือนสต็อก
            </button>
            )}
            */}
            {String(getLocalStorageItem("level_")) === "level2" && (
            <button
              onClick={() => setMainTab('temperature')}
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'temperature' ? '#F3F8FC' : '#f1f5f9',
                color: mainTab === 'temperature' ? '#1E5088' : '#64748b',
                border: mainTab === 'temperature' ? '1px solid #3E86C7' : 'none',
                boxShadow: mainTab === 'temperature' ? '0 4px 6px rgba(30, 80, 136,0.1)' : 'none',
              }}
            >
              <BarChart3 size={16} />
              รายงานอุณหภูมิ
            </button>
            )}
            {String(getLocalStorageItem("level_")) === "level2" && (
            <button
              onClick={() => setMainTab('stock')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'stock' ? '#f0fdfa' : '#f1f5f9',
                color: mainTab === 'stock' ? '#0d9488' : '#64748b',
                border: mainTab === 'stock' ? '1px solid #14b8a6' : 'none',
                boxShadow: mainTab === 'stock' ? '0 4px 6px rgba(13,148,136,0.1)' : 'none',
              }}
            >
              <Package size={16} />
              สินค้าคงคลัง
            </button>
            )}
            {hasPermission("J19") && (
            <button
              onClick={() => setMainTab('kyreport')}
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'kyreport' ? '#fffbeb' : '#f1f5f9',
                color: mainTab === 'kyreport' ? '#92400e' : '#64748b',
                border: mainTab === 'kyreport' ? '1px solid #f59e0b' : 'none',
                boxShadow: mainTab === 'kyreport' ? '0 4px 6px rgba(245,158,11,0.15)' : 'none',
              }}
            >
              <ClipboardList size={16} />
              รายงาน ข.ย. (บัญชีการซื้อยา)
            </button>
            )}
            {hasPermission("J19") && (
            <button
              onClick={() => setMainTab('salekyreport')}
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'salekyreport' ? '#fff1f2' : '#f1f5f9',
                color: mainTab === 'salekyreport' ? '#be123c' : '#64748b',
                border: mainTab === 'salekyreport' ? '1px solid #f43f5e' : 'none',
                boxShadow: mainTab === 'salekyreport' ? '0 4px 6px rgba(244,63,94,0.15)' : 'none',
              }}
            >
              <ClipboardList size={16} />
              รายงาน ข.ย. (บัญชีการขายยา)
            </button>
            )}
            {String(getLocalStorageItem("level_")) === "level2" && (
            <button
              onClick={() => setMainTab('stockadjust')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'stockadjust' ? '#F3F8FC' : '#f1f5f9',
                color: mainTab === 'stockadjust' ? '#0f766e' : '#64748b',
                border: mainTab === 'stockadjust' ? '1px solid #3E86C7' : 'none',
                boxShadow: mainTab === 'stockadjust' ? '0 4px 6px rgba(62, 134, 199,0.12)' : 'none',
              }}
            >
              <ClipboardCheck size={16} />
              รายงานปรับยอด
            </button>
            )}
            {String(getLocalStorageItem("level_")) === "level2" && (
            <button
              onClick={() => setMainTab('employee')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'employee' ? '#f5f3ff' : '#f1f5f9',
                color: mainTab === 'employee' ? '#7c3aed' : '#64748b',
                border: mainTab === 'employee' ? '1px solid #a78bfa' : 'none',
                boxShadow: mainTab === 'employee' ? '0 4px 6px rgba(124,58,237,0.12)' : 'none',
              }}
            >
              <UserIcon size={16} />
              รายงานพนักงาน
            </button>
            )}
            {String(getLocalStorageItem("level_")) === "level2" && (
            <button
              onClick={() => setMainTab('monthlysales')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'monthlysales' ? '#eef2ff' : '#f1f5f9',
                color: mainTab === 'monthlysales' ? '#4338ca' : '#64748b',
                border: mainTab === 'monthlysales' ? '1px solid #6366f1' : 'none',
                boxShadow: mainTab === 'monthlysales' ? '0 4px 6px rgba(79,70,229,0.12)' : 'none',
              }}
            >
              <CalendarRange size={16} />
              รายงานขายประจำเดือน
            </button>
            )}
            {String(getLocalStorageItem("level_")) === "level2" && (
            <button
              onClick={() => setMainTab('productsales')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'productsales' ? '#f0fdfa' : '#f1f5f9',
                color: mainTab === 'productsales' ? '#0f766e' : '#64748b',
                border: mainTab === 'productsales' ? '1px solid #14b8a6' : 'none',
                boxShadow: mainTab === 'productsales' ? '0 4px 6px rgba(13,148,136,0.12)' : 'none',
              }}
            >
              <ShoppingBag size={16} />
              รายงานขายตามสินค้า
            </button>
            )}
            {String(getLocalStorageItem("level_")) === "level2" && (
            <button
              onClick={() => setMainTab('stocktransfer')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '8px',
                fontFamily: 'Kanit_B',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mainTab === 'stocktransfer' ? '#F3F8FC' : '#f1f5f9',
                color: mainTab === 'stocktransfer' ? '#1E5088' : '#64748b',
                border: mainTab === 'stocktransfer' ? '1px solid #3E86C7' : 'none',
                boxShadow: mainTab === 'stocktransfer' ? '0 4px 6px rgba(30, 80, 136,0.12)' : 'none',
              }}
            >
              <ArrowLeftRight size={16} />
              การโอน-รับโอน สินค้า
            </button>
            )}
            {/* รายงานติดตามผล - hidden */}
          </div>

          {/* Conditional Content Rendering */}
          {mainTab === 'all' ? (
            hasPermission("J12") ?
            <AllReportsTab />
            : ""

          ) : mainTab === 'product' ? (
            hasPermission("J13") ?
            <ProductAnalysisTab />
            : ""
          ) : mainTab === 'category' ? (
             hasPermission("J14") ?
            <CategoryAnalysisTab />
            : ""
          ) : mainTab === 'slowmove' ? (
            <SlowMoveTab />
          ) : mainTab === 'expiry' ? (
            <ExpiryProductTab />
          ) : mainTab === 'gift' ? (
            hasPermission("J15") ?
            <GiftTargetTab />
            : ""
          ) : mainTab === 'saleky' ? (
            <SaleByKYTab />
          ) : mainTab === 'vendor' ? (
            <VendorAnalysisTab />
          ) : mainTab === 'attendance' ? (
            <AttendanceReportTab />
          ) : mainTab === 'customer' ? (
            <CustomerAnalysisTab />
          ) : mainTab === 'payment' ? (
            <PaymentSummaryTab />
          ) : mainTab === 'pl' ? (
            <PLReportTab />
          ) : mainTab === 'stockalert' ? (
            <StockAlertTab />
          ) : mainTab === 'temperature' ? (
            <TemperatureReportTab />
          ) : mainTab === 'stock' ? (
            <StockInventoryTab />
          ) : mainTab === 'kyreport' ? (
            hasPermission("J19") ?
            <KYReportTab />
            : ""
          ) : mainTab === 'salekyreport' ? (
            hasPermission("J19") ?
            <SaleKYReportTab />
            : ""
          ) : mainTab === 'stockadjust' ? (
            <StockAdjustmentReportTab />
          ) : mainTab === 'employee' ? (
            <EmployeeReportTab />
          ) : mainTab === 'monthlysales' ? (
            String(getLocalStorageItem("level_")) === "level2" ? <MonthlySalesReportTab /> : ""
          ) : mainTab === 'productsales' ? (
            String(getLocalStorageItem("level_")) === "level2" ? <ProductSalesReportTab /> : ""
          ) : mainTab === 'stocktransfer' ? (
            String(getLocalStorageItem("level_")) === "level2" ? <StockTransferReportTab /> : ""
          ) : (
            <div className={`row g-3 ${styles.reportDailyWorkspace}`}>
              <div className={`col-lg-4 col-md-6 ${styles.reportDailySalesColumn}`}>
                <div className={styles.reportSalesPanel}>
                  <div className={styles.reportSalesHeader}>
                    <div className={styles.reportSalesHeaderTop}>
                      <div className={styles.reportSalesTitleGroup}>
                        <span className={styles.reportSalesTitleIcon}>
                          <BarChart3 size={16} strokeWidth={2.4} />
                        </span>
                        <div className={styles.reportSalesTitleText}>
                          <span className={styles.reportSalesTitle}>รายงานขายสินค้า</span>
                          <span className={styles.reportSalesSubtitle}>ประจำวันและสรุปยอด</span>
                        </div>
                      </div>
                      <div className={styles.reportSalesStatusGroup}>
                        <span className={styles.reportSalesStatusPill}>
                          <Receipt size={12} strokeWidth={2.4} />
                          {visibleBillLabel} บิล
                        </span>
                      </div>
                    </div>
                    <div className={styles.reportSalesActionGroup}>
                      <button
                        onClick={handlePrintSalesReport}
                        disabled={!canLevel1SelectHistoricalDate}
                        className={`${styles.reportHeaderIconButton} ${styles.reportActionPrint} ${!canLevel1SelectHistoricalDate ? styles.reportActionDisabled : ''}`}
                        title={!canLevel1SelectHistoricalDate ? 'ผู้ใช้ level 1 ไม่ได้รับสิทธิ์เลือกดูรายงานวันที่ย้อนหลัง' : 'Print รายงานขายประจำวัน'}
                      >
                        <Printer size={15} strokeWidth={2.3} />
                      </button>
                      <button
                        onClick={exportMonthlySalesExcel}
                        disabled={isExportingMonthly || !canLevel1SelectHistoricalDate}
                        className={`${styles.reportHeaderIconButton} ${styles.reportActionExcelMonth} ${isExportingMonthly || !canLevel1SelectHistoricalDate ? styles.reportActionDisabled : ''}`}
                        title={!canLevel1SelectHistoricalDate ? 'ผู้ใช้ level 1 ไม่ได้รับสิทธิ์เลือกดูรายงานวันที่ย้อนหลัง' : 'Export Excel รายงานขายประจำเดือน'}
                      >
                        <FileSpreadsheet size={15} strokeWidth={2.3} />
                      </button>
                      <button
                        onClick={exportDailySalesExcel}
                        disabled={isExportingDaily || !canLevel1SelectHistoricalDate}
                        className={`${styles.reportHeaderIconButton} ${styles.reportActionExcelDay} ${isExportingDaily || !canLevel1SelectHistoricalDate ? styles.reportActionDisabled : ''}`}
                        title={!canLevel1SelectHistoricalDate ? 'ผู้ใช้ level 1 ไม่ได้รับสิทธิ์เลือกดูรายงานวันที่ย้อนหลัง' : 'Export Excel รายงานขายประจำวัน'}
                      >
                        <FileSpreadsheet size={15} strokeWidth={2.3} />
                      </button>
                      <button
                        onClick={() => setShowSummaryModal(true)}
                        className={`${styles.reportHeaderActionButton} ${styles.reportSummaryButton}`}
                      >
                        <DollarSign size={14} strokeWidth={2.4} />
                        <span>สรุปยอด</span>
                      </button>
                      <button
                        onClick={() => { setShowCloseModal(true); setCloseTab('form') }}
                        className={`${styles.reportHeaderActionButton} ${styles.reportCloseButton}`}
                        title="ปิดบิลประจำวัน — บันทึก/ค้นหา/แก้ไข"
                      >
                        <ClipboardCheck size={14} strokeWidth={2.4} />
                        <span>ปิดบิลวัน</span>
                      </button>
                    </div>
                  </div>

                  <div className={styles.reportSalesMetaBar}>
                    <div className={styles.reportSalesMetaGroup}>
                      <div className={styles.reportSalesMetaItem}>
                      <span className={styles.reportSalesMetaIcon}>
                        <CalendarIcon size={14} strokeWidth={2.3} />
                      </span>
                      <span className={styles.reportSalesMetaLabel}>วันที่</span>
                      <Popover open={canLevel1SelectHistoricalDate ? open : false} onOpenChange={(nextOpen) => { if (canLevel1SelectHistoricalDate) setOpen(nextOpen) }}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" id="order_date" name="order_date"
                            disabled={!canLevel1SelectHistoricalDate}
                            title={!canLevel1SelectHistoricalDate ? 'ผู้ใช้ level 1 ไม่ได้รับสิทธิ์เลือกดูรายงานวันที่ย้อนหลัง' : undefined}
                            className={styles.reportSalesDateButton}>
                            <span>{reportDateDisplay}</span>
                            <ChevronDownIcon size={16} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="end">
                          <Calendar mode="single" selected={date} captionLayout="dropdown"
                            onSelect={(date) => { if (!canLevel1SelectHistoricalDate) return; setDate(date); setall1({ ...all, search_date: date ? date.toLocaleDateString('sv-SE') : "" }); setOpen(false) }} />
                        </PopoverContent>
                      </Popover>
                      </div>

                      {/* drawer metric hidden */}
                    </div>

                  </div>

                  {/* ── Professional sales-list filter bar ──────────────── */}
                  <div className={styles.reportSalesFilterBar} style={{ padding: '4px 16px', background: 'linear-gradient(to right, #ffffff, #f8fafc)', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 10, borderRight: '1px solid #e2e8f0' }}>
                      <Filter size={14} style={{ color: filtersActive ? '#6366f1' : '#94a3b8' }} />
                      <span style={{ fontFamily: 'Kanit', fontSize: 12, color: filtersActive ? '#6366f1' : '#64748b', fontWeight: filtersActive ? 600 : 400 }}>กรองรายการ</span>
                      {filtersActive && <span style={{ background: '#6366f1', color: 'white', fontSize: 10, padding: '1px 6px', borderRadius: 999, fontFamily: 'Kanit' }}>ใช้งานอยู่</span>}
                    </div>

                    {/* User filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <UserIcon size={13} style={{ color: '#64748b' }} />
                      <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b' }}>ผู้ขาย:</span>
                      <select value={effectiveUserFilter} onChange={(e) => setUserFilter(e.target.value)}
                        disabled={isSellerFilterLocked}
                        title={isLevel1User ? (canLevel1SelectAnySeller ? 'ผู้ใช้ level 1 เลือกชื่อผู้ขายได้' : 'ผู้ใช้ level 1 ดูเฉพาะยอดขายของตัวเอง') : currentUserLevel === 'level2' ? 'ผู้ใช้ level 2 เลือกผู้ขายได้' : undefined}
                        style={{ fontFamily: 'Kanit', fontSize: 12, height: 22, borderRadius: 4, border: `1px solid ${effectiveUserFilter !== 'all' ? '#6366f1' : '#e2e8f0'}`, padding: '0 22px 0 6px', background: isSellerFilterLocked ? '#f8fafc' : 'white', color: isSellerFilterLocked ? '#475569' : '#334155', cursor: isSellerFilterLocked ? 'not-allowed' : 'pointer', outline: 'none', minWidth: 110 }}>
                        {(!isLevel1User || canLevel1SelectAnySeller) && <option value="all">ทั้งหมด</option>}
                        {isLevel1User && !currentSellerName && <option value={userFilter}>ไม่พบชื่อผู้ login</option>}
                        {userFilterOptions.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>

                    {/* Shift quick-pick chips */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={13} style={{ color: '#64748b', marginRight: 2 }} />
                      <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b', marginRight: 2 }}>กะ:</span>
                      <button type="button" onClick={() => { setShiftFilter('all'); setCustomStart(''); setCustomEnd('') }}
                        style={{ fontFamily: 'Kanit', fontSize: 11, height: 22, padding: '0 10px', borderRadius: 999, border: '1px solid', borderColor: shiftFilter === 'all' ? '#6366f1' : '#e2e8f0', background: shiftFilter === 'all' ? '#eef2ff' : 'white', color: shiftFilter === 'all' ? '#4f46e5' : '#64748b', cursor: 'pointer', fontWeight: shiftFilter === 'all' ? 600 : 400 }}>
                        ทั้งวัน
                      </button>
                      {shifts.map((sh) => (
                        <button key={sh.id} type="button" onClick={() => { setShiftFilter(sh.id); setCustomStart(''); setCustomEnd('') }}
                          title={`${sh.start} – ${sh.end}`}
                          style={{ fontFamily: 'Kanit', fontSize: 11, height: 22, padding: '0 10px', borderRadius: 999, border: '1px solid', borderColor: shiftFilter === sh.id ? '#6366f1' : '#e2e8f0', background: shiftFilter === sh.id ? '#eef2ff' : 'white', color: shiftFilter === sh.id ? '#4f46e5' : '#64748b', cursor: 'pointer', fontWeight: shiftFilter === sh.id ? 600 : 400, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {sh.name}
                          <span style={{ fontSize: 9, color: '#94a3b8' }}>{sh.start}-{sh.end}</span>
                        </button>
                      ))}
                    </div>

                    {/* Custom time range — only when 'custom' picked */}
                    {shiftFilter === 'custom' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 6px', background: '#fefce8', borderRadius: 4, border: '1px solid #fef08a' }}>
                        <input type="time" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                          style={{ fontFamily: 'Kanit', fontSize: 11, height: 20, border: '1px solid #fde047', borderRadius: 4, padding: '0 4px', background: 'white' }} />
                        <span style={{ fontSize: 11, color: '#a16207' }}>–</span>
                        <input type="time" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                          style={{ fontFamily: 'Kanit', fontSize: 11, height: 20, border: '1px solid #fde047', borderRadius: 4, padding: '0 4px', background: 'white' }} />
                      </div>
                    )}

                    <div style={{ flex: 1 }} />

                    {/* Result count */}
                    <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b' }}>
                      {filtersActive ? <>แสดง <b style={{ color: '#0d9488' }}>{filteredSaledaily.length}</b> / {saledaily.length} บิล</> : <>{saledaily.length} บิล</>}
                    </span>

                    {filtersActive && (
                      <button type="button" onClick={() => { setUserFilter('all'); setShiftFilter('all'); setCustomStart(''); setCustomEnd('') }}
                        style={{ fontFamily: 'Kanit', fontSize: 11, height: 22, padding: '0 8px', borderRadius: 4, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <X size={12} /> ล้างตัวกรอง
                      </button>
                    )}

                    {/* Shift settings popover */}
                    <Popover open={openShiftSettings} onOpenChange={setOpenShiftSettings}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" style={{ width: 22, height: 22, padding: 0, border: '1px solid #e2e8f0', borderRadius: 4 }} title="ตั้งค่ากะ/ช่วงเวลา">
                          <Settings size={14} className="text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-3" align="end">
                        <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={14} style={{ color: '#6366f1' }} /> ตั้งค่ากะการทำงาน
                        </div>
                        {!canManageReportShifts && (
                          <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '6px 8px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Lock size={12} /> อนุญาตเฉพาะ level 2
                          </div>
                        )}
                        {shiftSettingsLoading && (
                          <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b', marginBottom: 8 }}>กำลังโหลด...</div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                          {shifts.map((sh, idx) => (
                            <div key={sh.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                              <input value={sh.name} onChange={(e) => {
                                updateShiftDraft(idx, { name: e.target.value })
                              }} placeholder="ชื่อกะ"
                                disabled={!canManageReportShifts || shiftSettingsSaving}
                                style={{ fontFamily: 'Kanit', fontSize: 12, height: 28, flex: 1, border: '1px solid #e2e8f0', borderRadius: 4, padding: '0 6px', background: 'white', minWidth: 60 }} />
                              <input type="time" value={sh.start} onChange={(e) => {
                                updateShiftDraft(idx, { start: e.target.value })
                              }} disabled={!canManageReportShifts || shiftSettingsSaving} style={{ fontFamily: 'Kanit', fontSize: 12, height: 28, border: '1px solid #e2e8f0', borderRadius: 4, padding: '0 4px', background: 'white' }} />
                              <span style={{ color: '#94a3b8', fontSize: 11 }}>–</span>
                              <input type="time" value={sh.end} onChange={(e) => {
                                updateShiftDraft(idx, { end: e.target.value })
                              }} disabled={!canManageReportShifts || shiftSettingsSaving} style={{ fontFamily: 'Kanit', fontSize: 12, height: 28, border: '1px solid #e2e8f0', borderRadius: 4, padding: '0 4px', background: 'white' }} />
                              <button type="button" onClick={() => {
                                removeShiftDraft(idx)
                              }}
                                disabled={!canManageReportShifts || shiftSettingsSaving || shifts.length <= 1}
                                style={{ width: 24, height: 24, border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
                                title="ลบกะนี้">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button type="button" onClick={addShiftDraft}
                          disabled={!canManageReportShifts || shiftSettingsSaving || shifts.length >= 12}
                          style={{ marginTop: 8, width: '100%', fontFamily: 'Kanit', fontSize: 12, height: 32, border: '1px dashed #cbd5e1', background: 'white', color: '#475569', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <Plus size={13} /> เพิ่มกะ
                        </button>
                        <button type="button" onClick={() => persistShifts()}
                          disabled={!canManageReportShifts || shiftSettingsSaving || shifts.length === 0}
                          style={{ marginTop: 6, width: '100%', fontFamily: 'Kanit', fontSize: 12, height: 30, border: 'none', background: canManageReportShifts ? '#4f46e5' : '#cbd5e1', color: 'white', borderRadius: 6, cursor: canManageReportShifts ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                          <Save size={13} /> {shiftSettingsSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                        </button>
                        {shiftSettingsMessage && (
                          <div style={{ marginTop: 6, fontFamily: 'Kanit', fontSize: 11, color: shiftSettingsMessage === 'บันทึกแล้ว' ? '#0F6845' : '#b45309', textAlign: 'center' }}>{shiftSettingsMessage}</div>
                        )}
                        <button type="button" onClick={() => { setShifts(DEFAULT_SHIFTS); setShiftFilter('all'); setShiftSettingsMessage('') }}
                          disabled={!canManageReportShifts || shiftSettingsSaving}
                          style={{ marginTop: 6, width: '100%', fontFamily: 'Kanit', fontSize: 11, height: 28, border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', textDecoration: 'underline' }}>
                          คืนค่าเริ่มต้น
                        </button>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className={styles.reportSalesTableArea} style={{ flex: 1, overflowY: 'auto', background: '#ffffff' }}>
                    <Table hover borderless className={`mb-0 ${styles.reportSalesTable}`} style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                        <tr style={{
                          background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
                          boxShadow: 'inset 0 -1px 0 #e2e8f0'
                        }}>
                          <th style={{ padding: '8px 6px', fontFamily: 'Kanit_B', fontSize: '11px', color: '#475569', fontWeight: 700, textAlign: 'center', letterSpacing: '0.2px' }}>วันที่/เวลา</th>
                          <th style={{ padding: '8px 6px', fontFamily: 'Kanit_B', fontSize: '11px', color: '#475569', fontWeight: 700, textAlign: 'center', letterSpacing: '0.2px' }}>ชำระ</th>
                          <th style={{ padding: '8px 4px', fontFamily: 'Kanit_B', fontSize: '11px', color: '#475569', fontWeight: 700, textAlign: 'center', letterSpacing: '0.2px' }}>จำนวน</th>
                          <th style={{ padding: '8px 6px', fontFamily: 'Kanit_B', fontSize: '11px', color: '#475569', fontWeight: 700, textAlign: 'right', letterSpacing: '0.2px' }}>ยอดรวม</th>
                          <th style={{ padding: '4px 3px', fontFamily: 'Kanit_B', fontSize: '9px', color: '#475569', fontWeight: 700, textAlign: 'center', letterSpacing: 0 }}>แต้ม/ลด</th>
                          <th style={{ padding: '8px 6px', fontFamily: 'Kanit_B', fontSize: '11px', color: '#475569', fontWeight: 700, textAlign: 'right', letterSpacing: '0.2px' }}>สุทธิ</th>
                          {String(getLocalStorageItem("level_")) === "level2" && (
                            <>
                              <th style={{ padding: '4px 3px', fontFamily: 'Kanit_B', fontSize: '9px', color: '#b45309', fontWeight: 700, textAlign: 'right', background: '#fffbeb', width: '50px' }}>ทุน</th>
                              <th style={{ padding: '4px 3px', fontFamily: 'Kanit_B', fontSize: '9px', color: '#0F6845', fontWeight: 700, textAlign: 'right', background: '#EDF9F3', width: '60px' }}>กำไร%</th>
                            </>
                          )}
                          <th style={{ padding: '8px 6px', fontFamily: 'Kanit_B', fontSize: '11px', color: '#475569', fontWeight: 700, textAlign: 'center', letterSpacing: '0.2px' }}>ผู้ขาย</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSaledaily.map((s: any, idx: number) => {
                          const items = (saledailycount as any[]).filter((r: any) => r.id_salemain === s.id && r.statuss !== 'ยกเลิก')
                          const totalCost = items.reduce((sum: number, r: any) => sum + Number(r.cost || 0), 0)
                          const sumtotal = Number(s.sumtotal || 0)
                          const profit = sumtotal - totalCost
                          const profitPct = sumtotal > 0 ? (profit / sumtotal) * 100 : 0
                          const isBillCancelled = s.statussall === 'ยกเลิก'
                          const isSelected = String(idDatalist) === String(s.id)
                          const rawTransferKey = String(s.transferDetail || '').trim()
                          const transferDetailLabel = resolveProviderLabel(rawTransferKey, providerMap)
                          const paymentLabel = s.pay === 'เงินสด+โอน' ? 'แยกจ่าย' : s.pay === 'โอน' ? 'โอน' : s.pay || '-'
                          const showTransferDetail = (s.pay === 'โอน' || s.pay === 'เงินสด+โอน' || s.pay === 'อื่นๆ') && transferDetailLabel
                          return (
                          <tr key={s.id} onClick={() => { setidW(s.id) }}
                            style={{
                              cursor: 'pointer',
                              borderBottom: '1px solid #f1f5f9',
                              background: isSelected
                                ? 'linear-gradient(90deg, #E5EEF8 0%, #F3F8FC 100%)'
                                : (isBillCancelled ? '#fef2f2' : (idx % 2 === 0 ? '#ffffff' : '#fafbfc')),
                              opacity: isBillCancelled ? 0.7 : 1,
                              boxShadow: isSelected ? 'inset 3px 0 0 #2A6AAA' : 'none',
                              transition: 'background-color 0.15s, box-shadow 0.15s'
                            }}
                            className={isSelected ? 'selected-row' : 'hover-row'}>
                            <td className={styles.reportSalesDateCell} style={{ padding: '3px 4px', fontFamily: 'Kanit', fontSize: '11px', color: '#334155', textAlign: 'center', lineHeight: 1.15 }}>
                              <div className={styles.reportSalesDateText}>
                                {new Date(String(s.createDate)).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
                              </div>
                              <div className={styles.reportSalesTimeText}>
                                {new Date(String(s.createDate)).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}
                              </div>
                              {s.orderNo && <div className={styles.reportSalesOrderText}>{s.orderNo}</div>}
                            </td>

                            <td style={{ padding: '3px 4px', textAlign: 'center', lineHeight: 1.15, minWidth: 0, maxWidth: 0, overflow: 'hidden' }}>
                              <span style={{ display: 'inline-block', maxWidth: '100%', fontFamily: 'Kanit_B', fontSize: '11px', padding: '1px 8px', borderRadius: '999px', backgroundColor: s.pay === 'เงินสด' ? '#D3F0E2' : s.pay === 'เงินสด+โอน' ? '#fef3c7' : '#E5EEF8', color: s.pay === 'เงินสด' ? '#147F56' : s.pay === 'เงินสด+โอน' ? '#b45309' : '#2A6AAA', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'top' }}>{paymentLabel}</span>
                              {showTransferDetail && <div title={transferDetailLabel} style={{ fontFamily: 'Kanit', fontSize: '9px', color: '#2A6AAA', marginTop: 1, lineHeight: 1.05, fontWeight: 600, maxWidth: '100%', maxHeight: 20, overflow: 'hidden', textAlign: 'center', wordBreak: 'break-all' }}>{transferDetailLabel}</div>}
                              {s.pay === 'เงินสด+โอน' && <div style={{ fontFamily: 'Kanit', fontSize: '9px', color: '#78716c', marginTop: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>สด {(s.cashAmount || 0)?.toFixed(0)} / โอน {(s.transferAmount || 0)?.toFixed(0)}</div>}
                              <div style={{ fontFamily: 'Kanit', fontSize: '10px', color: '#64748b', textAlign: 'center', lineHeight: 1.15 }}>{s.group_price}</div>
                            </td>
                            <td style={{ padding: '3px 4px', fontFamily: 'Kanit_B', fontSize: '13px', color: '#6366f1', textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.15 }}>{items.length || (saledailycount as any[]).filter((r: any) => r.id_salemain === s.id).length}</td>
                            <td style={{ padding: '3px 6px', fontFamily: 'Kanit', fontSize: '12px', color: '#334155', textAlign: 'right', fontVariantNumeric: 'tabular-nums', lineHeight: 1.15 }}>{(s.totalall)?.toFixed(0)}</td>
                            <td style={{ padding: '3px 4px', textAlign: 'center', cursor: s.discountReason ? 'help' : 'default' }} title={s.discountReason || ''}>
                              <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#f59e0b', lineHeight: 1.1, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{(s.usereward)?.toFixed(0) || 0}</div>
                              <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#ef4444', lineHeight: 1.1, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{(s.discount)?.toFixed(0) || 0}</div>
                            </td>
                            <td style={{ padding: '3px 6px', fontFamily: 'Kanit_B', fontSize: '13px', color: '#3E86C7', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.15 }}>{(s.sumtotal)?.toFixed(0)}</td>
                            {String(getLocalStorageItem("level_")) === "level2" && (
                              <>
                                <td style={{ padding: '3px 4px', fontFamily: 'Kanit', fontSize: '11px', color: '#b45309', textAlign: 'right', background: '#fffbeb', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', lineHeight: 1.15 }}>{totalCost.toFixed(0)}</td>
                                <td style={{ padding: '3px 4px', textAlign: 'right', background: '#F3F8FC', whiteSpace: 'nowrap' }}>
                                  <div style={{
                                    fontFamily: 'Kanit_B', fontSize: '11px',
                                    color: profit >= 0 ? '#0F6845' : '#dc2626',
                                    fontVariantNumeric: 'tabular-nums', fontWeight: 700, lineHeight: 1.1
                                  }}>{profit.toFixed(0)}</div>
                                  <div style={{
                                    fontFamily: 'Kanit', fontSize: '10px',
                                    color: profitPct >= 20 ? '#147F56' : profitPct >= 0 ? '#a16207' : '#dc2626',
                                    fontVariantNumeric: 'tabular-nums', lineHeight: 1.1, fontWeight: 600
                                  }}>{profitPct.toFixed(1)}%</div>
                                </td>
                              </>
                            )}
                            <td style={{ padding: '3px 4px', fontFamily: 'Kanit', fontSize: '10px', color: '#64748b', textAlign: 'center', maxWidth: '40px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.15 }}>
                              <div style={{ maxWidth: '40px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.personall}</div>
                              {(() => {
                                const cancelledCount = saledailycount.filter((r: any) => r.id_salemain === s.id && r.statuss === 'ยกเลิก').length;
                                if (isBillCancelled || cancelledCount > 0) {
                                  return (
                                    <div style={{
                                      fontFamily: 'Kanit_B', fontSize: '10px', padding: '1px 6px', borderRadius: '999px', marginTop: 2,
                                      backgroundColor: '#fee2e2', color: '#ef4444', display: 'inline-block', fontWeight: 600
                                    }}>ยกเลิก {isBillCancelled ? '(All)' : `(${cancelledCount})`}</div>
                                  );
                                }
                                return null;
                              })()}
                            </td>
                          </tr>
                          )
                        })}
                      </tbody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Middle Panel - Sale Items */}
              <div className={`col-lg-5 col-md-6 ${styles.reportDailyItemColumn}`}>
                <div className={styles.reportItemsPanel}>
                  <div className={styles.reportItemsTableRegion}>
                    <SaleListItem data={idDatalist} onPrint={handlePrint} onPrintA4={openReceiptA4Modal} onGenTax={openTaxInvoiceModal} onPrintDeliveryNote={openDeliveryNoteModal} onRefresh={fetchPostsz} storeS={storeS} addressS={addressS} telS={telS} uploadedUrl={uploadedUrl} />
                  </div>

                  <div className={styles.reportItemsSummaryRegion}>
                    <SummaryReport />
                  </div>
                </div>
              </div>

              {/* Right Panel - Receipt */}
              {(hasPermission("J11")) && (
                <div className="col-lg-3 col-md-12">
                  <div style={{
                    backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0', overflow: 'hidden', height: '88vh'
                  }}>
                    <div ref={receiptRef}>
                      <ReceiptItem data={idDatalist} key={`${idDatalist}-${refreshKey}`} />
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .hover-row:hover { background-color: #f1f5f9 !important; }
        .selected-row,
        .selected-row:hover {
          background: linear-gradient(90deg, #E5EEF8 0%, #F3F8FC 100%) !important;
          box-shadow: inset 3px 0 0 #2A6AAA !important;
        }
        .selected-row td { background: transparent !important; }
        .selected-row td:first-child { box-shadow: inset 3px 0 0 #2A6AAA !important; }
      `}</style>

      {showReceiptA4Modal && (
        <div className={styles.receiptA4ModalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.receiptA4Modal}>
            <div className={styles.receiptA4ModalHeader}>
              <div className={styles.receiptA4ModalTitleGroup}>
                <span className={styles.receiptA4ModalIcon}><Receipt size={18} strokeWidth={2.4} /></span>
                <div>
                  <div className={styles.receiptA4ModalTitle}>พิมพ์ใบเสร็จรับเงิน A4</div>
                  <div className={styles.receiptA4ModalSubtitle}>แก้ไขข้อมูลลูกค้าสำหรับเอกสารฉบับพิมพ์</div>
                </div>
              </div>
              <button type="button" className={styles.receiptA4ModalClose} onClick={() => setShowReceiptA4Modal(false)}>
                <X size={18} strokeWidth={2.4} />
              </button>
            </div>

            {receiptA4Loading ? (
              <div className={styles.receiptA4Loading}>กำลังโหลดข้อมูลใบเสร็จ...</div>
            ) : (
              <>
                <div className={styles.receiptA4ModalBody}>
                  <div className={styles.receiptA4PreviewPanel}>
                    <div className={styles.receiptA4PreviewTitle}>ข้อมูลเอกสาร</div>
                    <div className={styles.receiptA4PreviewDocNo}>#{receiptA4Sale?.orderNo || receiptA4Sale?.taxInvoiceNo || receiptA4Sale?.id || '-'}</div>
                    <div className={styles.receiptA4PreviewMeta}>
                      <span>วันที่</span>
                      <strong>{formatDateOnly(receiptA4Sale?.createDate)}</strong>
                    </div>
                    <div className={styles.receiptA4PreviewMeta}>
                      <span>ชำระ</span>
                      <strong>{getReceiptPaymentLabel(receiptA4Sale)}</strong>
                    </div>
                    <div className={styles.receiptA4PreviewGrid}>
                      <div>
                        <span>รายการ</span>
                        <strong>{receiptA4Items.filter((item: any) => item.statuss !== 'ยกเลิก').length}</strong>
                      </div>
                      <div>
                        <span>ยอดสุทธิ</span>
                        <strong>{formatReceiptCurrency(receiptA4Sale?.statussall === 'ยกเลิก' ? 0 : receiptA4Sale?.sumtotal, 0)}</strong>
                      </div>
                    </div>
                    <div className={styles.receiptA4PreviewHint}>
                      ข้อมูลที่แก้ในหน้านี้ใช้กับใบเสร็จ A4 และสามารถกดบันทึกเพื่ออัปเดตหรือสร้างข้อมูลลูกค้าในระบบได้
                    </div>
                  </div>

                  <div className={styles.receiptA4FormPanel}>
                    <div className={styles.receiptA4FormHeader}>
                      <div className={styles.receiptA4FormTitleGroup}>
                        <Pencil size={16} strokeWidth={2.3} />
                        <span>ข้อมูลลูกค้าในใบเสร็จ</span>
                      </div>
                      <div className={styles.receiptA4SaveGroup}>
                        {receiptA4SaveMessage && <span className={styles.receiptA4SaveMessage}>{receiptA4SaveMessage}</span>}
                        <button
                          type="button"
                          className={styles.receiptA4SaveCustomerButton}
                          onClick={handleSaveReceiptA4Customer}
                          disabled={receiptA4SavingCustomer}
                          title={receiptA4Customer.id ? 'บันทึกข้อมูลลูกค้าในระบบ' : 'สร้างลูกค้าใหม่จากข้อมูลนี้'}
                        >
                          <Save size={14} strokeWidth={2.4} />
                          {receiptA4SavingCustomer ? 'กำลังบันทึก' : 'บันทึกลูกค้า'}
                        </button>
                      </div>
                    </div>
                    <div className={styles.receiptA4FormGrid}>
                      <label className={styles.receiptA4Field}>
                        <span>ชื่อลูกค้า</span>
                        <input value={receiptA4Customer.name} onChange={(event) => updateReceiptA4Customer('name', event.target.value)} />
                      </label>
                      <label className={styles.receiptA4Field}>
                        <span>รหัสลูกค้า</span>
                        <input value={receiptA4Customer.code} onChange={(event) => updateReceiptA4Customer('code', event.target.value)} />
                      </label>
                      <label className={styles.receiptA4Field}>
                        <span>เลขผู้เสียภาษี</span>
                        <input value={receiptA4Customer.taxId} onChange={(event) => updateReceiptA4Customer('taxId', event.target.value)} />
                      </label>
                      <label className={styles.receiptA4Field}>
                        <span>โทรศัพท์</span>
                        <input value={receiptA4Customer.tel} onChange={(event) => updateReceiptA4Customer('tel', event.target.value)} />
                      </label>
                      <label className={styles.receiptA4Field}>
                        <span>สาขาลูกค้า</span>
                        <input value={receiptA4Customer.branch} onChange={(event) => updateReceiptA4Customer('branch', event.target.value)} />
                      </label>
                      <label className={`${styles.receiptA4Field} ${styles.receiptA4FieldWide}`}>
                        <span>ที่อยู่</span>
                        <textarea value={receiptA4Customer.address} onChange={(event) => updateReceiptA4Customer('address', event.target.value)} rows={3} />
                      </label>
                      <label className={`${styles.receiptA4Field} ${styles.receiptA4FieldWide}`}>
                        <span>หมายเหตุบนใบเสร็จ</span>
                        <textarea value={receiptA4Customer.note} onChange={(event) => updateReceiptA4Customer('note', event.target.value)} rows={2} />
                      </label>
                    </div>

                    <div style={{ marginTop: 14, padding: 12, border: receiptA4ShowSignature ? '1px solid #A6C8E7' : '1px solid #cbd5e1', borderRadius: 12, background: receiptA4ShowSignature ? '#F3F8FC' : '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: receiptA4ShowSignature ? 10 : 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, color: '#0f172a', fontFamily: 'Kanit_B', fontSize: 13 }}>
                          <Signature size={16} strokeWidth={2.4} color={receiptA4ShowSignature ? '#2A6AAA' : '#64748b'} />
                          <span>ลายเซ็นผู้รับเงิน</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { void handleToggleReceiptA4Signature() }}
                          style={{ height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0 12px', border: receiptA4ShowSignature ? '1px solid #CCDFF1' : '1px solid #cbd5e1', borderRadius: 8, background: receiptA4ShowSignature ? '#E5EEF8' : '#ffffff', color: receiptA4ShowSignature ? '#1E5088' : '#475569', fontFamily: 'Kanit_B', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          <Signature size={14} strokeWidth={2.4} />
                          {receiptA4ShowSignature ? 'แสดงลายเซ็นแล้ว' : 'แสดงลายเซ็น'}
                        </button>
                      </div>

                      {receiptA4ShowSignature && (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <label className={styles.receiptA4Field}>
                              <span>เลือกลายเซ็นพนักงาน</span>
                              <select
                                value={receiptA4SignatureEmployeeId}
                                onChange={(event) => handleReceiptA4SignatureEmployeeChange(event.target.value)}
                                disabled={receiptA4SignatureEmployeesLoading}
                                style={{ width: '100%', height: 36, border: '1px solid #cbd5e1', borderRadius: 8, background: '#ffffff', color: '#0f172a', fontFamily: 'Kanit', fontSize: 13, padding: '0 10px', outline: 'none' }}
                              >
                                <option value="">เลือกลายเซ็น</option>
                                {receiptA4SignatureEmployees.map((employee) => (
                                  <option key={employee.id} value={employee.id}>{getReceiptA4SignatureEmployeeLabel(employee)}</option>
                                ))}
                              </select>
                            </label>
                            <label className={styles.receiptA4Field}>
                              <span>วันที่</span>
                              <input type="date" value={receiptA4SignatureDate} onChange={(event) => setReceiptA4SignatureDate(event.target.value)} />
                            </label>
                            <label className={`${styles.receiptA4Field} ${styles.receiptA4FieldWide}`}>
                              <span>ชื่อผู้ลงนาม</span>
                              <input value={receiptA4SignatureName} onChange={(event) => setReceiptA4SignatureName(event.target.value)} placeholder="ชื่อผู้รับเงิน" />
                            </label>
                          </div>
                          <div style={{ height: 76, marginTop: 10, border: '1px dashed #CCDFF1', borderRadius: 10, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontFamily: 'Kanit', fontSize: 12, overflow: 'hidden' }}>
                            {receiptA4SignatureLoading ? 'กำลังโหลดลายเซ็น...' : receiptA4SignatureUrl ? (
                              <img src={receiptA4SignatureUrl} alt="ลายเซ็นอิเล็กทรอนิกส์" style={{ maxWidth: '78%', maxHeight: 64, objectFit: 'contain' }} />
                            ) : receiptA4SignatureEmployeeId ? 'ยังไม่มีลายเซ็นของพนักงานนี้' : 'เลือกลายเซ็นเพื่อแสดงบนใบเสร็จ'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.receiptA4ModalFooter}>
                  <button type="button" className={styles.receiptA4SecondaryButton} onClick={() => setShowReceiptA4Modal(false)}>
                    ยกเลิก
                  </button>
                  <button type="button" className={styles.receiptA4PrimaryButton} onClick={handlePrintReceiptA4} disabled={!receiptA4Sale}>
                    <Printer size={16} strokeWidth={2.4} />
                    พิมพ์ A4
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ====== DELIVERY NOTE (ใบส่งสินค้า) MODAL ====== */}
      {showDeliveryNoteModal && (
        <div className={styles.receiptA4ModalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.receiptA4Modal}>
            <div className={styles.receiptA4ModalHeader}>
              <div className={styles.receiptA4ModalTitleGroup}>
                <span className={styles.receiptA4ModalIcon}><Truck size={18} strokeWidth={2.4} /></span>
                <div>
                  <div className={styles.receiptA4ModalTitle}>สร้างใบส่งสินค้า</div>
                  <div className={styles.receiptA4ModalSubtitle}>แก้ไขข้อมูลลูกค้าและผู้จัดส่งสำหรับเอกสารฉบับพิมพ์</div>
                </div>
              </div>
              <button type="button" className={styles.receiptA4ModalClose} onClick={() => setShowDeliveryNoteModal(false)}>
                <X size={18} strokeWidth={2.4} />
              </button>
            </div>

            {deliveryNoteLoading ? (
              <div className={styles.receiptA4Loading}>กำลังโหลดข้อมูลใบส่งสินค้า...</div>
            ) : (
              <>
                <div className={styles.receiptA4ModalBody}>
                  <div className={styles.receiptA4PreviewPanel}>
                    <div className={styles.receiptA4PreviewTitle}>ข้อมูลเอกสาร</div>
                    <div className={styles.receiptA4PreviewDocNo}>#{deliveryNoteSale?.orderNo || deliveryNoteSale?.taxInvoiceNo || deliveryNoteSale?.id || '-'}</div>
                    <div className={styles.receiptA4PreviewMeta}>
                      <span>วันที่</span>
                      <strong>{formatDateOnly(deliveryNoteSale?.createDate)}</strong>
                    </div>
                    <div className={styles.receiptA4PreviewGrid}>
                      <div>
                        <span>รายการ</span>
                        <strong>{deliveryNoteItems.filter((item: any) => item.statuss !== 'ยกเลิก').length}</strong>
                      </div>
                      <div>
                        <span>จำนวนรวม</span>
                        <strong>{formatReceiptCurrency(deliveryNoteItems.filter((item: any) => item.statuss !== 'ยกเลิก').reduce((sum: number, item: any) => sum + Number(item.qty || 0), 0), 0)}</strong>
                      </div>
                    </div>
                    <div className={styles.receiptA4PreviewHint}>
                      ข้อมูลที่แก้ในหน้านี้ใช้กับใบส่งสินค้าและสามารถกดบันทึกเพื่ออัปเดตหรือสร้างข้อมูลลูกค้าในระบบได้
                    </div>
                  </div>

                  <div className={styles.receiptA4FormPanel}>
                    <div className={styles.receiptA4FormHeader}>
                      <div className={styles.receiptA4FormTitleGroup}>
                        <Pencil size={16} strokeWidth={2.3} />
                        <span>ข้อมูลลูกค้า/ผู้รับสินค้า</span>
                      </div>
                      <div className={styles.receiptA4SaveGroup}>
                        {deliveryNoteSaveMessage && <span className={styles.receiptA4SaveMessage}>{deliveryNoteSaveMessage}</span>}
                        <button
                          type="button"
                          className={styles.receiptA4SaveCustomerButton}
                          onClick={handleSaveDeliveryNoteCustomer}
                          disabled={deliveryNoteSavingCustomer}
                          title={deliveryNoteCustomer.id ? 'บันทึกข้อมูลลูกค้าในระบบ' : 'สร้างลูกค้าใหม่จากข้อมูลนี้'}
                        >
                          <Save size={14} strokeWidth={2.4} />
                          {deliveryNoteSavingCustomer ? 'กำลังบันทึก' : 'บันทึกลูกค้า'}
                        </button>
                      </div>
                    </div>
                    <div className={styles.receiptA4FormGrid}>
                      <label className={`${styles.receiptA4Field} ${styles.receiptA4FieldWide}`}>
                        <span>ค้นหา / เลือกลูกค้า</span>
                        <Popover open={deliveryNoteCustomerOpen} onOpenChange={setDeliveryNoteCustomerOpen}>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              style={{ width: '100%', height: 36, border: '1px solid #cbd5e1', borderRadius: 8, background: '#ffffff', color: deliveryNoteCustomer.name ? '#0f172a' : '#94a3b8', fontFamily: 'Kanit', fontSize: 13, padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, cursor: 'pointer' }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {deliveryNoteCustomer.name || 'เลือกลูกค้า'}{deliveryNoteCustomer.code ? ` (${deliveryNoteCustomer.code})` : ''}
                              </span>
                              <ChevronDown size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[320px] p-0 z-[200]" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput placeholder="ค้นหาชื่อ, รหัส, โทร" value={deliveryNoteCustomerQuery} onValueChange={setDeliveryNoteCustomerQuery} />
                              <CommandList style={{ maxHeight: 260 }}>
                                <CommandEmpty>ไม่พบลูกค้า</CommandEmpty>
                                <CommandGroup>
                                  {filteredDeliveryNoteCustomers.slice(0, 50).map((customer: any) => (
                                    <CommandItem key={customer.id} value={String(customer.id)} onSelect={() => handleSelectDeliveryNoteCustomer(customer)}>
                                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontFamily: 'Kanit_B', fontSize: 13 }}>{customer.names || '-'}</span>
                                        <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8' }}>{customer.code || '-'} {customer.tel ? `· ${customer.tel}` : ''}</span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </label>
                      <label className={`${styles.receiptA4Field} ${styles.receiptA4FieldWide}`}>
                        <span>ชื่อลูกค้า/ผู้รับสินค้า (พิมพ์แก้ไขได้)</span>
                        <input value={deliveryNoteCustomer.name} onChange={(event) => updateDeliveryNoteCustomer('name', event.target.value)} placeholder="ชื่อลูกค้า / ผู้รับสินค้า" />
                      </label>
                      <label className={styles.receiptA4Field}>
                        <span>รหัสลูกค้า</span>
                        <input value={deliveryNoteCustomer.code} onChange={(event) => updateDeliveryNoteCustomer('code', event.target.value)} />
                      </label>
                      <label className={styles.receiptA4Field}>
                        <span>โทรศัพท์</span>
                        <input value={deliveryNoteCustomer.tel} onChange={(event) => updateDeliveryNoteCustomer('tel', event.target.value)} />
                      </label>
                      <label className={styles.receiptA4Field}>
                        <span>สาขาลูกค้า</span>
                        <input value={deliveryNoteCustomer.branch} onChange={(event) => updateDeliveryNoteCustomer('branch', event.target.value)} />
                      </label>
                      <label className={`${styles.receiptA4Field} ${styles.receiptA4FieldWide}`}>
                        <span>ที่อยู่จัดส่ง</span>
                        <textarea value={deliveryNoteCustomer.address} onChange={(event) => updateDeliveryNoteCustomer('address', event.target.value)} rows={3} />
                      </label>
                    </div>

                    <div style={{ marginTop: 14, padding: 12, border: deliveryNoteShowSender ? '1px solid #cbd5e1' : '1px solid #fecaca', borderRadius: 12, background: deliveryNoteShowSender ? '#f8fafc' : '#fef2f2' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, color: '#0f172a', fontFamily: 'Kanit_B', fontSize: 13 }}>
                          <Truck size={16} strokeWidth={2.4} color={deliveryNoteShowSender ? '#475569' : '#dc2626'} />
                          <span>ข้อมูลผู้ส่งสินค้าบนเอกสาร</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDeliveryNoteShowSender((current) => !current)}
                          style={{ height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0 12px', border: deliveryNoteShowSender ? '1px solid #cbd5e1' : '1px solid #fecaca', borderRadius: 8, background: deliveryNoteShowSender ? '#ffffff' : '#fee2e2', color: deliveryNoteShowSender ? '#475569' : '#b91c1c', fontFamily: 'Kanit_B', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          <EyeOff size={14} strokeWidth={2.4} />
                          {deliveryNoteShowSender ? 'ปิดข้อมูลผู้ส่งสินค้า' : 'ปิดข้อมูลผู้ส่งสินค้าแล้ว'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.receiptA4ModalFooter}>
                  <button type="button" className={styles.receiptA4SecondaryButton} onClick={() => setShowDeliveryNoteModal(false)}>
                    ยกเลิก
                  </button>
                  <button type="button" className={styles.receiptA4PrimaryButton} onClick={handlePrintDeliveryNote} disabled={!deliveryNoteSale}>
                    <Printer size={16} strokeWidth={2.4} />
                    พิมพ์ใบส่งสินค้า
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ====== TAX INVOICE (GEN TAX) MODAL ====== */}
      {showTaxInvoiceModal && (
        <div className={styles.receiptA4ModalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.receiptA4Modal}>
            <div className={styles.receiptA4ModalHeader}>
              <div className={styles.receiptA4ModalTitleGroup}>
                <span className={styles.receiptA4ModalIcon}><Landmark size={18} strokeWidth={2.4} /></span>
                <div>
                  <div className={styles.receiptA4ModalTitle}>สร้างใบกำกับภาษี</div>
                  <div className={styles.receiptA4ModalSubtitle}>เลือกลูกค้าและตรวจสอบข้อมูลก่อนพิมพ์ / บันทึก PDF</div>
                </div>
              </div>
              <button type="button" className={styles.receiptA4ModalClose} onClick={() => setShowTaxInvoiceModal(false)}>
                <X size={18} strokeWidth={2.4} />
              </button>
            </div>

            {taxInvoiceLoading ? (
              <div className={styles.receiptA4Loading}>กำลังโหลดข้อมูลใบกำกับภาษี...</div>
            ) : (
              <>
                <div className={styles.receiptA4ModalBody}>
                  <div className={styles.receiptA4PreviewPanel}>
                    <div className={styles.receiptA4PreviewTitle}>ข้อมูลเอกสาร</div>
                    <div className={styles.receiptA4PreviewDocNo}>#{taxInvoiceNo || taxInvoiceSale?.id || '-'}</div>
                    <div className={styles.receiptA4PreviewMeta}>
                      <span>วันที่</span>
                      <strong>{formatDateOnly(taxInvoiceDate)}</strong>
                    </div>
                    <div className={styles.receiptA4PreviewMeta}>
                      <span>ชำระ</span>
                      <strong>{getReceiptPaymentLabel(taxInvoiceSale)}</strong>
                    </div>
                    <div className={styles.receiptA4PreviewGrid}>
                      <div>
                        <span>รายการ</span>
                        <strong>{taxInvoiceItems.filter((item: any) => item.statuss !== 'ยกเลิก').length}</strong>
                      </div>
                      <div>
                        <span>ยอดสุทธิ</span>
                        <strong>{formatReceiptCurrency(taxInvoiceSale?.statussall === 'ยกเลิก' ? 0 : taxInvoiceSale?.sumtotal, 0)}</strong>
                      </div>
                    </div>
                    <div className={styles.receiptA4PreviewHint}>
                      เลือกจำนวนชุดเอกสาร (ต้นฉบับ / สำเนา) ที่ต้องการพิมพ์หรือบันทึกเป็น PDF ด้านล่าง
                    </div>

                    <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Kanit', fontSize: 13, color: '#0f172a', cursor: 'pointer' }}>
                        <input type="checkbox" checked={taxInvoiceCopies.original} onChange={() => toggleTaxInvoiceCopy('original')} />
                        ต้นฉบับ (ORIGINAL)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Kanit', fontSize: 13, color: '#0f172a', cursor: 'pointer' }}>
                        <input type="checkbox" checked={taxInvoiceCopies.copy} onChange={() => toggleTaxInvoiceCopy('copy')} />
                        สำเนา (COPY)
                      </label>
                    </div>
                  </div>

                  <div className={styles.receiptA4FormPanel}>
                    <div className={styles.receiptA4FormHeader}>
                      <div className={styles.receiptA4FormTitleGroup}>
                        <Pencil size={16} strokeWidth={2.3} />
                        <span>ข้อมูลใบกำกับภาษี</span>
                      </div>
                      <div className={styles.receiptA4SaveGroup}>
                        {taxInvoiceSaveMessage && <span className={styles.receiptA4SaveMessage}>{taxInvoiceSaveMessage}</span>}
                        <button
                          type="button"
                          className={styles.receiptA4SaveCustomerButton}
                          onClick={handleSaveTaxInvoiceCustomer}
                          disabled={taxInvoiceSavingCustomer}
                          title={taxInvoiceCustomer.id ? 'บันทึกข้อมูลลูกค้าในระบบ' : 'สร้างลูกค้าใหม่จากข้อมูลนี้'}
                        >
                          <Save size={14} strokeWidth={2.4} />
                          {taxInvoiceSavingCustomer ? 'กำลังบันทึก' : 'บันทึกลูกค้า'}
                        </button>
                      </div>
                    </div>

                    <div className={styles.receiptA4FormGrid}>
                      <label className={`${styles.receiptA4Field} ${styles.receiptA4FieldWide}`}>
                        <span>ค้นหา / เลือกลูกค้า</span>
                        <Popover open={taxInvoiceCustomerOpen} onOpenChange={setTaxInvoiceCustomerOpen}>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              style={{ width: '100%', height: 36, border: '1px solid #cbd5e1', borderRadius: 8, background: '#ffffff', color: taxInvoiceCustomer.name ? '#0f172a' : '#94a3b8', fontFamily: 'Kanit', fontSize: 13, padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, cursor: 'pointer' }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {taxInvoiceCustomer.name || 'เลือกลูกค้า'}{taxInvoiceCustomer.code ? ` (${taxInvoiceCustomer.code})` : ''}
                              </span>
                              <ChevronDown size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[320px] p-0 z-[200]" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput placeholder="ค้นหาชื่อ, รหัส, เลขผู้เสียภาษี, โทร" value={taxInvoiceCustomerQuery} onValueChange={setTaxInvoiceCustomerQuery} />
                              <CommandList style={{ maxHeight: 260 }}>
                                <CommandEmpty>ไม่พบลูกค้า</CommandEmpty>
                                <CommandGroup>
                                  {filteredTaxInvoiceCustomers.slice(0, 50).map((customer: any) => (
                                    <CommandItem key={customer.id} value={String(customer.id)} onSelect={() => handleSelectTaxInvoiceCustomer(customer)}>
                                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontFamily: 'Kanit_B', fontSize: 13 }}>{customer.names || '-'}</span>
                                        <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8' }}>{customer.code || '-'} {customer.numbertax ? `· ${customer.numbertax}` : ''}</span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </label>
                      <label className={`${styles.receiptA4Field} ${styles.receiptA4FieldWide}`}>
                        <span>ชื่อลูกค้า (พิมพ์แก้ไขได้)</span>
                        <input value={taxInvoiceCustomer.name} onChange={(event) => updateTaxInvoiceCustomer('name', event.target.value)} placeholder="ชื่อลูกค้า / ชื่อบริษัท" />
                      </label>
                      <label className={styles.receiptA4Field}>
                        <span>เลขที่ใบกำกับภาษี</span>
                        <input value={taxInvoiceNo} onChange={(event) => setTaxInvoiceNo(event.target.value)} />
                      </label>
                      <label className={styles.receiptA4Field}>
                        <span>วันที่ออกใบกำกับภาษี</span>
                        <input type="date" value={taxInvoiceDate} onChange={(event) => setTaxInvoiceDate(event.target.value)} />
                      </label>
                      <label className={styles.receiptA4Field}>
                        <span>เลขผู้เสียภาษี</span>
                        <input value={taxInvoiceCustomer.taxId} onChange={(event) => updateTaxInvoiceCustomer('taxId', event.target.value)} />
                      </label>
                      <label className={styles.receiptA4Field}>
                        <span>โทรศัพท์</span>
                        <input value={taxInvoiceCustomer.tel} onChange={(event) => updateTaxInvoiceCustomer('tel', event.target.value)} />
                      </label>
                      <label className={styles.receiptA4Field}>
                        <span>สาขาลูกค้า</span>
                        <input value={taxInvoiceCustomer.branch} onChange={(event) => updateTaxInvoiceCustomer('branch', event.target.value)} />
                      </label>
                      <label className={`${styles.receiptA4Field} ${styles.receiptA4FieldWide}`}>
                        <span>ที่อยู่ลูกค้า</span>
                        <textarea value={taxInvoiceCustomer.address} onChange={(event) => updateTaxInvoiceCustomer('address', event.target.value)} rows={3} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className={styles.receiptA4ModalFooter}>
                  <button type="button" className={styles.receiptA4SecondaryButton} onClick={() => setShowTaxInvoiceModal(false)}>
                    ยกเลิก
                  </button>
                  <button type="button" className={styles.receiptA4SecondaryButton} onClick={handleSaveTaxInvoicePdf} disabled={!taxInvoiceSale || taxInvoicePdfBusy}>
                    <FileDown size={16} strokeWidth={2.4} />
                    {taxInvoicePdfBusy ? 'กำลังบันทึก...' : 'บันทึก PDF'}
                  </button>
                  <button type="button" className={styles.receiptA4PrimaryButton} onClick={handlePrintTaxInvoice} disabled={!taxInvoiceSale}>
                    <Printer size={16} strokeWidth={2.4} />
                    พิมพ์ A4
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ====== SUMMARY MODAL ====== */}
      {showSummaryModal && (() => {
        const activeSales = dailyReportMetrics.activeSales
        const totalNet = dailyReportMetrics.totalNet
        const totalAll = dailyReportMetrics.totalAll
        const totalDiscount = dailyReportMetrics.totalDiscount
        const totalReward = dailyReportMetrics.totalReward
        const totalBills = activeSales.length

        const cashSales = dailyReportMetrics.cashSales
        const splitSales = dailyReportMetrics.splitSales
        const splitTransferSum = dailyReportMetrics.splitTransferTotal
        const cashTotal = dailyReportMetrics.cashTotal
        const cashBills = cashSales.length + splitSales.length

        const transferSales = dailyReportMetrics.transferSales
        const transferTotal = dailyReportMetrics.transferTotal
        const transferBills = transferSales.length + splitSales.length

        const otherSales = dailyReportMetrics.otherSales
        const otherTotal = dailyReportMetrics.otherTotal
        const otherBills = otherSales.length

        // Group transfers by transferDetail (resolve provider key → display name)
        const transferGroups: { [key: string]: { total: number; count: number } } = {}
        transferSales.forEach((s: any) => {
          const key = resolveProviderLabel(s.transferDetail, providerMap) || 'โอน (ไม่ระบุ)'
          if (!transferGroups[key]) transferGroups[key] = { total: 0, count: 0 }
          transferGroups[key].total += Number(s.sumtotal || 0)
          transferGroups[key].count += 1
        })
        splitSales.forEach((s: any) => {
          const key = resolveProviderLabel(s.transferDetail, providerMap) || 'โอน (ไม่ระบุ)'
          if (!transferGroups[key]) transferGroups[key] = { total: 0, count: 0 }
          transferGroups[key].total += Number(s.transferAmount || 0)
          transferGroups[key].count += 1
        })
        const transferGroupArr = Object.entries(transferGroups).sort((a, b) => b[1].total - a[1].total)

        // Group "อื่นๆ" by provider type (resolve provider key → display name)
        const otherGroups: { [key: string]: { total: number; count: number } } = {}
        otherSales.forEach((s: any) => {
          const key = resolveProviderLabel(s.transferDetail, providerMap) || 'อื่นๆ (ไม่ระบุ)'
          if (!otherGroups[key]) otherGroups[key] = { total: 0, count: 0 }
          otherGroups[key].total += Number(s.sumtotal || 0)
          otherGroups[key].count += 1
        })
        const otherGroupArr = Object.entries(otherGroups).sort((a, b) => b[1].total - a[1].total)

        const fmtN = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        const fmtI = (n: number) => n.toLocaleString('th-TH')

        const transferColors = ['#2A6AAA', '#7c3aed', '#0891b2', '#0d9488', '#6366f1', '#a855f7']
        const otherColors = ['#7c3aed', '#a855f7', '#c026d3', '#db2777', '#9333ea', '#6d28d9']

        return (
          <>
            <div onClick={() => setShowSummaryModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9998 }} />
            <div style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '520px', maxHeight: '90vh', backgroundColor: 'white', borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)', zIndex: 9999, overflow: 'hidden',
              fontFamily: 'Kanit, sans-serif', animation: 'scmSlideIn 0.3s ease'
            }}>
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)',
                padding: '20px 24px', color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '8px', display: 'flex' }}>
                      <BarChart3 size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 700 }}>สรุปยอดขายประจำวัน</div>
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>
                        {all.search_date ? new Date(all.search_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      {filtersActive && (
                        <div style={{ fontSize: '11px', opacity: 0.9, marginTop: 2 }}>{reportScopeLabel}</div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setShowSummaryModal(false)} style={{
                    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '10px', color: 'white', width: '36px', height: '36px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}>
                    ✕
                  </button>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: 'calc(90vh - 100px)' }}>
                {/* Net Total Hero */}
                <div style={{
                  background: 'linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)',
                  border: '2px solid #A6C8E7', borderRadius: '16px', padding: '20px', marginBottom: '16px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '13px', color: '#173F6B', marginBottom: '4px', fontWeight: 500 }}>ยอดสุทธิรวม</div>
                  <div style={{ fontSize: '36px', fontWeight: 800, color: '#1E5088', lineHeight: 1.1 }}>{fmtN(totalNet)}</div>
                  <div style={{ fontSize: '14px', color: '#2A6AAA', marginTop: '2px' }}>บาท</div>
                  <div style={{ fontSize: '12px', color: '#173F6B', marginTop: '8px', opacity: 0.7 }}>{fmtI(totalBills)} บิล</div>
                </div>

                {/* Breakdown Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px 12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>ยอดรวมก่อนลด</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#334155' }}>{fmtN(totalAll)}</div>
                  </div>
                  <div style={{ background: '#fef2f2', borderRadius: '12px', padding: '14px 12px', textAlign: 'center', border: '1px solid #fecaca' }}>
                    <div style={{ fontSize: '11px', color: '#991b1b', marginBottom: '4px' }}>ส่วนลด</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#dc2626' }}>-{fmtN(totalDiscount)}</div>
                  </div>
                  <div style={{ background: '#fffbeb', borderRadius: '12px', padding: '14px 12px', textAlign: 'center', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '11px', color: '#92400e', marginBottom: '4px' }}>ตัดแต้ม</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#d97706' }}>-{fmtN(totalReward)}</div>
                  </div>
                </div>

                {/* Cash vs Transfer */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CreditCard size={16} color="#6366f1" /> แยกตามช่องทางชำระ
                  </div>

                  {/* Progress bar */}
                  {totalNet > 0 && (
                    <div style={{ height: '10px', borderRadius: '5px', overflow: 'hidden', display: 'flex', marginBottom: '12px', background: '#f1f5f9' }}>
                      <div style={{ width: `${(cashTotal / totalNet) * 100}%`, background: 'linear-gradient(90deg, #2A6AAA, #3E86C7)', transition: 'width 0.5s' }} />
                      <div style={{ width: `${(transferTotal / totalNet) * 100}%`, background: 'linear-gradient(90deg, #2A6AAA, #6BA3D8)', transition: 'width 0.5s' }} />
                      {otherTotal > 0 && <div style={{ width: `${(otherTotal / totalNet) * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', transition: 'width 0.5s' }} />}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: otherBills > 0 ? '1fr 1fr 1fr' : '1fr 1fr', gap: '10px' }}>
                    {/* Cash Card */}
                    <div style={{ background: '#F3F8FC', borderRadius: '14px', padding: '16px', border: '1px solid #CCDFF1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ background: '#E5EEF8', borderRadius: '8px', padding: '6px', display: 'flex' }}>
                          <Banknote size={18} color="#2A6AAA" />
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#173F6B' }}>เงินสด</div>
                      </div>
                      <div style={{ fontSize: otherBills > 0 ? '20px' : '24px', fontWeight: 800, color: '#0F6845', marginBottom: '2px' }}>{fmtN(cashTotal)}</div>
                      <div style={{ fontSize: '12px', color: '#173F6B', opacity: 0.7 }}>{fmtI(cashBills)} บิล · {totalNet > 0 ? ((cashTotal / totalNet) * 100).toFixed(1) : 0}%</div>
                    </div>

                    {/* Transfer Card */}
                    <div style={{ background: '#F3F8FC', borderRadius: '14px', padding: '16px', border: '1px solid #CCDFF1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ background: '#E5EEF8', borderRadius: '8px', padding: '6px', display: 'flex' }}>
                          <CreditCard size={18} color="#2A6AAA" />
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#173F6B' }}>เงินโอน</div>
                      </div>
                      <div style={{ fontSize: otherBills > 0 ? '20px' : '24px', fontWeight: 800, color: '#1E5088', marginBottom: '2px' }}>{fmtN(transferTotal)}</div>
                      <div style={{ fontSize: '12px', color: '#173F6B', opacity: 0.7 }}>{fmtI(transferBills)} บิล · {totalNet > 0 ? ((transferTotal / totalNet) * 100).toFixed(1) : 0}%</div>
                    </div>

                    {/* Other Card */}
                    {otherBills > 0 && (
                      <div style={{ background: '#f5f3ff', borderRadius: '14px', padding: '16px', border: '1px solid #ddd6fe' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ background: '#ede9fe', borderRadius: '8px', padding: '6px', display: 'flex' }}>
                            <Wallet size={18} color="#7c3aed" />
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#5b21b6' }}>อื่นๆ</div>
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#6d28d9', marginBottom: '2px' }}>{fmtN(otherTotal)}</div>
                        <div style={{ fontSize: '12px', color: '#5b21b6', opacity: 0.7 }}>{fmtI(otherBills)} บิล · {totalNet > 0 ? ((otherTotal / totalNet) * 100).toFixed(1) : 0}%</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transfer Breakdown */}
                {transferGroupArr.length > 0 && (
                  <div style={{ marginBottom: otherGroupArr.length > 0 ? '16px' : 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TrendingUp size={16} color="#6366f1" /> แยกตามลักษณะการโอน
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {transferGroupArr.map(([name, data], idx) => (
                        <div key={name} style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          background: '#f8fafc', borderRadius: '12px', padding: '12px 16px',
                          border: '1px solid #e2e8f0', transition: 'all 0.2s'
                        }}>
                          <div style={{
                            width: '6px', height: '36px', borderRadius: '3px',
                            background: transferColors[idx % transferColors.length]
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{fmtI(data.count)} บิล</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '17px', fontWeight: 700, color: transferColors[idx % transferColors.length] }}>{fmtN(data.total)}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{transferTotal > 0 ? ((data.total / transferTotal) * 100).toFixed(1) : 0}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Breakdown */}
                {otherGroupArr.length > 0 && (
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Wallet size={16} color="#7c3aed" /> แยกตามลักษณะอื่นๆ
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {otherGroupArr.map(([name, data], idx) => (
                        <div key={name} style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          background: '#faf5ff', borderRadius: '12px', padding: '12px 16px',
                          border: '1px solid #ede9fe', transition: 'all 0.2s'
                        }}>
                          <div style={{
                            width: '6px', height: '36px', borderRadius: '3px',
                            background: otherColors[idx % otherColors.length]
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{fmtI(data.count)} บิล</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '17px', fontWeight: 700, color: otherColors[idx % otherColors.length] }}>{fmtN(data.total)}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{otherTotal > 0 ? ((data.total / otherTotal) * 100).toFixed(1) : 0}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )
      })()}

      {/* ====== DAILY CLOSE MODAL ====== */}
      {showCloseModal && (() => {
        const company = (typeof window !== 'undefined' && (localStorage.getItem('company_') || '')) || ''
        const employeeNow = (typeof window !== 'undefined' && (localStorage.getItem('user_') || localStorage.getItem('person_') || '')) || ''
        const todayStr = all.search_date || new Date().toLocaleDateString('sv-SE')
        const fmt = (n: number) => Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

        const setField = (k: string, v: any) => setCloseData((prev: any) => ({ ...(prev || {}), [k]: v }))

        const counted =
          ((closeData?.b1000 || 0) * 1000) + ((closeData?.b500 || 0) * 500) +
          ((closeData?.b100 || 0) * 100) + ((closeData?.b50 || 0) * 50) +
          ((closeData?.b20 || 0) * 20) + ((closeData?.b10 || 0) * 10) +
          ((closeData?.b5 || 0) * 5) + ((closeData?.b2 || 0) * 2) +
          ((closeData?.b1 || 0) * 1)
        const diff = counted - (Number(closeData?.cashDeliver) || 0)

        // สำรองข้อมูลอัตโนมัติหลังปิดบิล — ทำงานแยกจากการปิดบิล
        // ถ้าสำรองไม่สำเร็จ บิลยังถูกปิดเรียบร้อย (แจ้งเตือนให้ลองใหม่ได้)
        const runCloseBackup = async (rec: any, force = false) => {
          if (!force && localStorage.getItem('dailyCloseAutoBackup') === 'off') {
            setCloseBackup({ status: 'skipped', at: new Date().toLocaleString('th-TH') })
            return
          }
          setCloseBackup({ status: 'running' })
          const res = await runBackupNow({
            kind: 'dailyclose',
            note: `ปิดบิลประจำวัน ${rec?.closeDate || ''} · ${rec?.branchName || company || ''}`.trim(),
          })
          setCloseBackup(res.ok
            ? { status: 'done', file: res.file, folder: res.folder, records: res.records, at: res.at }
            : { status: 'error', message: res.error, at: res.at })
        }

        const save = async (status: 'draft' | 'closed' | 'reopened') => {
          if (!closeData) return
          setCloseBusy(true)
          try {
            const r = await fetch('/api/dailyclose', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...closeData, status, updatedBy: employeeNow, createdBy: closeData?.createdBy || employeeNow }),
            })
            const data = await r.json()
            if (!r.ok) throw new Error(data?.error || 'failed')
            const saved = { ...data, closeDate: String(data.closeDate).slice(0, 10) }
            setCloseData(saved)
            if (status === 'closed') {
              // ปิดบิลสำเร็จ → สำรองข้อมูลทันที (แสดงสถานะในแถบด้านล่างแทน alert)
              // ไม่ await เพื่อไม่ให้ปุ่มอื่นค้างระหว่างสำรองข้อมูล
              void runCloseBackup(saved)
            } else {
              setCloseBackup({ status: 'idle' })
              alert('บันทึกร่างเรียบร้อย')
            }
          } catch (e: any) {
            alert('ผิดพลาด: ' + (e?.message || 'unknown'))
          } finally {
            setCloseBusy(false)
          }
        }

        const searchHistory = async () => {
          setCloseBusy(true)
          try {
            const params = new URLSearchParams()
            if (company) params.set('company', company)
            if (closeSearch.from) params.set('from', closeSearch.from)
            if (closeSearch.to) params.set('to', closeSearch.to)
            if (closeSearch.q) params.set('q', closeSearch.q)
            const r = await fetch(`/api/dailyclose?${params}`, { cache: 'no-store' })
            const data = await r.json()
            setCloseHistory(Array.isArray(data) ? data : [])
          } catch {} finally { setCloseBusy(false) }
        }

        const editFromHistory = (rec: any) => {
          setCloseData({ ...rec, closeDate: String(rec.closeDate).slice(0, 10) })
          setCloseTab('form')
        }

        const removeRecord = async (id: number) => {
          if (!confirm('ลบรายการนี้?')) return
          await fetch(`/api/dailyclose/${id}`, { method: 'DELETE' })
          await searchHistory()
        }

        const buildSlipHtml = (rec: any) => {
          const d = rec || closeData
          if (!d) return { html: '', body: '', styles: '', dateTH: '', content: '', horizontalOffset: 0 }
          const dateFull = new Date(d.closeDate).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
          const dateTH = new Date(d.closeDate).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
          const printedAt = new Date().toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          const num = (n: number) => Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          const counted =
            ((d.b1000 || 0) * 1000) + ((d.b500 || 0) * 500) + ((d.b100 || 0) * 100) +
            ((d.b50 || 0) * 50) + ((d.b20 || 0) * 20) + ((d.b10 || 0) * 10) +
            ((d.b5 || 0) * 5) + ((d.b2 || 0) * 2) + ((d.b1 || 0) * 1)
          const expectedCash = Number(d.cashTotal || 0) + Number(d.cashDeliver || 0)
          const diff = counted - expectedCash
          const diffLabel = diff > 0.001 ? 'เกิน' : diff < -0.001 ? 'ขาด' : 'ตรง'
          const totalIncome = Number(d.salesTotal || 0)
          const paperSize = localStorage.getItem('receipt_paper_size') || '80'
          const is58 = paperSize === '58'
          const paperW = getThermalReceiptPaperWidth(is58)
          const horizontalOffset = getThermalReceiptHorizontalOffset(is58)
          const thermalBaseStyles = getThermalReceiptPrintStyles(paperW, is58).replace(/<\/?style>/g, '')
          const fontSizeTitle = is58 ? '13px' : '16px'
          const fontSizeStore = is58 ? '12px' : '15px'
          const fontSizeBody = is58 ? '8.5px' : '10.5px'
          const fontSizeSmall = is58 ? '7.5px' : '9px'
          const fontSizeAmount = is58 ? '10.5px' : '13px'
          const logoSize = is58 ? '34px' : '44px'

          const denoms: Array<[number, number]> = [
            [1000, d.b1000 || 0], [500, d.b500 || 0], [100, d.b100 || 0],
            [50, d.b50 || 0], [20, d.b20 || 0], [10, d.b10 || 0],
            [5, d.b5 || 0], [2, d.b2 || 0], [1, d.b1 || 0],
          ]

          const styles = `
  ${thermalBaseStyles}
  @page { margin: 0; }
  html, body { width: ${paperW}; max-width: ${paperW}; margin: 0; padding: 0; background: #ffffff; color: #000000; }
  body { font-family: 'Kanit', 'Tahoma', Arial, sans-serif; font-size: ${fontSizeBody}; font-weight: 700; }
  .daily-close-slip { width: ${paperW}; max-width: ${paperW}; margin: 0; padding: ${is58 ? '1mm 2.5mm 2mm' : '1.5mm 3.5mm 2mm'} !important; border: 0; border-radius: 0; box-shadow: none; background: #ffffff; color: #000000; overflow: visible; }
  .daily-close-slip * { letter-spacing: 0; color: #000000 !important; text-shadow: none !important; }
  .daily-close-logo { display: block; width: ${logoSize}; height: ${logoSize}; object-fit: contain; margin: 0 auto 3px; filter: contrast(1.12); }
  .header { text-align: center; padding: 0 0 5px; margin: 0 0 5px; border-bottom: 1.5px solid #000000; }
  .header .badge { display: block; font-size: ${fontSizeSmall}; font-weight: 800; line-height: 1.2; margin-bottom: 2px; }
  .header h1 { margin: 0; font-size: ${fontSizeStore}; font-weight: 800; line-height: 1.22; word-break: break-word; }
  .header .sub { margin-top: 1px; font-size: ${fontSizeSmall}; font-weight: 700; line-height: 1.2; }
  .meta-row { margin-top: 4px; padding-top: 4px; border-top: 1px dashed #000000; }
  .meta-row .meta { display: flex; justify-content: space-between; gap: 5px; padding: 1px 0; line-height: 1.22; }
  .meta-row .meta .k { flex: 0 0 ${is58 ? '43%' : '38%'}; text-align: left; font-size: ${fontSizeSmall}; font-weight: 700; }
  .meta-row .meta .v { flex: 1; min-width: 0; text-align: right; font-size: ${fontSizeSmall}; font-weight: 800; word-break: break-word; }
  .body { padding: 0; }
  .section { margin: 0 0 6px; }
  .section-title { margin: 0 0 3px; padding: 2px 0; border-top: 1px dashed #000000; border-bottom: 1px dashed #000000; font-size: ${fontSizeSmall}; font-weight: 800; text-align: center; line-height: 1.2; }
  .kpi { display: grid; grid-template-columns: 1fr; gap: 2px; }
  .kpi-card { display: flex; justify-content: space-between; align-items: baseline; gap: 5px; padding: 1px 0; border-bottom: 1px dotted #333333; }
  .kpi-card .k { font-size: ${fontSizeSmall}; font-weight: 700; }
  .kpi-card .v { font-size: ${fontSizeAmount}; font-weight: 800; text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: ${fontSizeBody}; margin: 0 !important; }
  .table th { padding: 2px 1px; border-bottom: 1px solid #000000; font-size: ${fontSizeSmall}; font-weight: 800; text-align: left; }
  .table td { padding: 2px 1px; border-bottom: 1px dotted #333333; font-weight: 700; }
  .table td.r { text-align: right; font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .denom { width: 100%; }
  .denom-hdr { display: grid; grid-template-columns: 2.5fr 2fr 3fr; gap: 2px; padding: 3px 1px; border-top: 1.5px solid #000000; border-bottom: 1.5px solid #000000; font-size: ${fontSizeBody}; font-weight: 900; }
  .denom-hdr span:nth-child(2) { text-align: center; }
  .denom-hdr span:last-child { text-align: right; }
  .denom-row { display: grid; grid-template-columns: 2.5fr 2fr 3fr; gap: 2px; padding: 3px 1px; border-bottom: 1px solid #555555; align-items: baseline; }
  .denom-row .face { font-size: ${fontSizeBody}; font-weight: 900; }
  .denom-row .qty { font-size: ${fontSizeBody}; font-weight: 900; text-align: center; }
  .denom-row .sub { font-size: ${fontSizeBody}; font-weight: 900; text-align: right; font-variant-numeric: tabular-nums; }
  .denom-row:not(.has) .face, .denom-row:not(.has) .qty, .denom-row:not(.has) .sub { font-weight: 700; color: #555555; }
  .summary { margin-top: 5px; padding: 4px 0; border-top: 1.5px solid #000000; border-bottom: 1.5px solid #000000; }
  .summary .row { display: flex; justify-content: space-between; gap: 5px; padding: 1px 0; font-size: ${fontSizeBody}; line-height: 1.22; }
  .summary .row span:last-child { text-align: right; font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .summary .row.divider { border-top: 1px dashed #000000; margin-top: 2px; padding-top: 3px; }
  .summary .row.grand { font-size: ${fontSizeAmount}; font-weight: 800; }
  .summary .label { font-weight: 700; }
  .diff-pill { display: inline-block; padding: 0 3px; margin-left: 3px; border: 1px solid #000000; font-size: ${fontSizeSmall}; font-weight: 800; line-height: 1.15; }
  .note-box { padding: 3px 0; border-bottom: 1px dotted #333333; font-size: ${fontSizeBody}; font-weight: 700; min-height: 24px; white-space: pre-wrap; word-break: break-word; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: ${is58 ? '8px' : '12px'}; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #000000; }
  .sig { text-align: center; min-width: 0; }
  .sig .line { border-top: 1px solid #000000; padding-top: 3px; margin-top: 24px; }
  .sig .role { font-size: ${fontSizeSmall}; font-weight: 700; }
  .sig .name { font-size: ${fontSizeSmall}; font-weight: 800; margin-top: 1px; word-break: break-word; }
  .footer-bar { margin-top: 7px; padding-top: 4px; border-top: 1px dashed #000000; display: block; text-align: center; font-size: ${fontSizeSmall}; font-weight: 700; line-height: 1.25; }
  .footer-bar .brand { display: block; font-weight: 800; }
`
          const denomRows = denoms.map(([face, qty]) => `
    <div class="denom-row ${qty > 0 ? 'has' : ''}">
      <span class="face">${face.toLocaleString('th-TH')} บาท</span>
      <span class="qty">× ${qty}</span>
      <span class="sub">${num(face * qty)}</span>
    </div>`).join('')

          const body = `
  <div class="thermal-receipt slip daily-close-slip">
    <div class="header">
      ${uploadedUrl && String(uploadedUrl) !== '' ? `<img class="daily-close-logo" src="${escapeHtml(String(uploadedUrl))}" />` : ''}
      <span class="badge">รายงานปิดบิลประจำวัน · DAILY CLOSE REPORT</span>
      <h1>${escapeHtml(d.branchName || company || 'ร้านค้า')}</h1>
      <div class="sub">${dateFull}</div>
      <div class="meta-row">
        <div class="meta"><div class="k">วันที่ปิดบิล</div><div class="v">${dateTH}</div></div>
        <div class="meta"><div class="k">เวลาทำงาน</div><div class="v">${escapeHtml(d.workTimeStart || '-')} - ${escapeHtml(d.workTimeEnd || '-')}</div></div>
        <div class="meta"><div class="k">พนักงาน</div><div class="v">${escapeHtml(d.employeeName || '-')}</div></div>
      </div>
    </div>

    <div class="body">
      <div class="section">
        <div class="section-title">ยอดขายประจำวัน</div>
        <div class="kpi">
          <div class="kpi-card total"><div class="k">ยอดขายรวม</div><div class="v">฿ ${num(totalIncome)}</div></div>
          <div class="kpi-card"><div class="k">ยอดเงินสดนำส่ง</div><div class="v">฿ ${num(d.cashDeliver)}</div></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">รายละเอียดตามช่องทาง</div>
        <table class="table">
          <thead><tr><th>ช่องทาง</th><th style="text-align:right">ยอดเงิน (บาท)</th></tr></thead>
          <tbody>
            <tr><td>เงินสด (ระบบ)</td><td class="r">${num(d.cashTotal)}</td></tr>
            <tr><td>PromptPay / QR</td><td class="r">${num(d.promptpayTotal)}</td></tr>
            <tr><td>เงินโอน</td><td class="r">${num(d.transferTotal)}</td></tr>
            <tr><td>อื่น ๆ</td><td class="r">${num(d.otherTotal)}</td></tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">นับเงินสดนำส่ง</div>
        <div class="denom">
          <div class="denom-hdr">
            <span>ธนบัตร / เหรียญ</span>
            <span>จำนวน</span>
            <span>ยอด (บาท)</span>
          </div>
          ${denomRows}
        </div>
      </div>

      <div class="summary">
        <div class="row"><span class="label">เงินสดที่นับได้</span><span>฿ ${num(counted)}</span></div>
        <div class="row"><span class="label">เงินสดที่คาดว่าจะมี (สด+นำส่ง)</span><span>฿ ${num(expectedCash)}</span></div>
        <div class="row divider grand">
          <span>ผลต่าง <span class="diff-pill">${diffLabel}</span></span>
          <span style="color:${diff < 0 ? '#fca5a5' : diff > 0 ? '#A6C8E7' : '#cbd5e1'}">${diff >= 0 ? '+' : ''}${num(diff)} บาท</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">สรุปเงินในลิ้นชัก</div>
        <div class="kpi">
          <div class="kpi-card"><div class="k">เงินแลก</div><div class="v">฿ ${num(d.changeAmount || 0)}</div></div>
          <div class="kpi-card"><div class="k">ยอดเงินคงเหลือในลิ้นชัก</div><div class="v">฿ ${num(d.drawerBalance || 0)}</div></div>
        </div>
      </div>

      ${(d.note && String(d.note).trim()) ? `
      <div class="section" style="margin-top:18px">
        <div class="section-title">หมายเหตุ</div>
        <div class="note-box">${escapeHtml(d.note)}</div>
      </div>` : ''}

      <div class="signatures">
        <div class="sig"><div class="line"><div class="role">ผู้ปิดบิล</div><div class="name">${escapeHtml(d.employeeName || '') || '....................'}</div></div></div>
        <div class="sig"><div class="line"><div class="role">ผู้ตรวจสอบ</div><div class="name">....................</div></div></div>
      </div>
    </div>

    <div class="footer-bar">
      <span class="brand">SmileStore POS</span>
      <span>พิมพ์เมื่อ ${printedAt}</span>
    </div>
  </div>`
          const html = `<!doctype html><html><head><meta charset="utf-8"/><title>ปิดบิลวัน ${dateTH}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>${styles}</style></head><body>${body}
<script>window.onload = () => { setTimeout(() => window.print(), 400); };</script></body></html>`
          const content = `<style>${styles}</style>${body}`
          return { html, body, styles, dateTH, content, horizontalOffset }
        }

        const printSlip = async (rec: any) => {
          const { html, content, horizontalOffset } = buildSlipHtml(rec)
          if (!html) return
          if (isSilentPrintAvailable()) {
            try {
              await printSilent({
                content,
                printerName: selectedPrinter_rc,
                horizontalOffset,
              })
              return
            } catch (error) {
              console.error('Daily close print failed:', error)
              alert('การพิมพ์ใบปิดบิลล้มเหลว')
            }
          }
          const w = window.open('', '_blank', 'width=720,height=900')
          if (w) { w.document.write(html); w.document.close() }
        }

        const saveAsImage = async (rec: any) => {
          const built = buildSlipHtml(rec)
          if (!built.body) return
          setCloseBusy(true)
          // Render the slip into an isolated iframe so that the app's Tailwind v4
          // stylesheet (which uses unsupported `oklch()`/`lab()` color functions)
          // never leaks into the html2canvas computed-style traversal.
          const iframe = document.createElement('iframe')
          iframe.style.position = 'fixed'
          iframe.style.left = '-10000px'
          iframe.style.top = '0'
          iframe.style.width = '560px'
          iframe.style.height = '900px'
          iframe.style.border = '0'
          iframe.setAttribute('aria-hidden', 'true')
          document.body.appendChild(iframe)
          try {
            const doc = iframe.contentDocument!
            doc.open()
            doc.write(`<!doctype html><html><head><meta charset="utf-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>${built.styles}</style>
</head><body>${built.body}</body></html>`)
            doc.close()
            // Wait for fonts to be ready inside the iframe
            try {
              const winFonts = (iframe.contentWindow as any)?.document?.fonts
              if (winFonts && typeof winFonts.ready?.then === 'function') {
                await winFonts.ready
              } else {
                await new Promise((r) => setTimeout(r, 350))
              }
            } catch { await new Promise((r) => setTimeout(r, 350)) }
            await new Promise((r) => requestAnimationFrame(() => r(null)))
            const target = doc.querySelector('.slip') as HTMLElement
            if (!target) throw new Error('ไม่พบเนื้อหาสลิป')
            // Resize iframe to slip's actual size for sharp rendering
            const rect = target.getBoundingClientRect()
            iframe.style.width = Math.ceil(rect.width + 48) + 'px'
            iframe.style.height = Math.ceil(rect.height + 48) + 'px'
            const html2canvas = (await import('html2canvas')).default
            const canvas = await html2canvas(target, {
              backgroundColor: '#ffffff',
              scale: 2,
              useCORS: true,
              logging: false,
              windowWidth: iframe.contentWindow?.innerWidth,
              windowHeight: iframe.contentWindow?.innerHeight,
            })
            const dataUrl = canvas.toDataURL('image/png')
            const a = document.createElement('a')
            const safeBranch = String(closeData?.branchName || closeData?.company || 'shop').replace(/[^\wก-๙\- ]+/g, '').replace(/\s+/g, '_')
            a.download = `ปิดบิลวัน_${safeBranch}_${(rec || closeData)?.closeDate || ''}.png`
            a.href = dataUrl
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
          } catch (e: any) {
            alert('บันทึกรูปไม่สำเร็จ: ' + (e?.message || 'unknown'))
          } finally {
            try { document.body.removeChild(iframe) } catch { /* ignore */ }
            setCloseBusy(false)
          }
        }

        const isClosed = closeData?.status === 'closed'
        const inputStyle: React.CSSProperties = {
          width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8,
          fontFamily: 'Kanit', fontSize: 13, outline: 'none',
        }
        const numInputStyle: React.CSSProperties = { ...inputStyle, textAlign: 'right' as const, fontWeight: 600 }
        const labelStyle: React.CSSProperties = { fontSize: 11, color: '#475569', marginBottom: 4, fontWeight: 600 }

        return (
          <>
            <div onClick={() => setShowCloseModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9998 }} />
            <div style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '760px', maxWidth: '95vw', maxHeight: '92vh', backgroundColor: 'white', borderRadius: 20,
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)', zIndex: 9999, overflow: 'hidden',
              fontFamily: 'Kanit, sans-serif', display: 'flex', flexDirection: 'column'
            }}>
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg, #ea580c 0%, #f97316 60%, #fb923c 100%)',
                padding: '18px 22px', color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 8, display: 'flex' }}>
                      <ClipboardCheck size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 700 }}>ปิดบิลประจำวัน</div>
                      <div style={{ fontSize: 12, opacity: 0.9 }}>
                        {(closeData?.branchName || company || '-')} · {closeData?.closeDate || todayStr}
                        {filtersActive && <span style={{ marginLeft: 8 }}>· {reportScopeLabel}</span>}
                        {isClosed && (
                          <span style={{ marginLeft: 8, background: '#2A6AAA', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700 }}>
                            <Lock size={10} style={{ marginRight: 3 }} /> CLOSED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setShowCloseModal(false)} style={{
                    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: 10, color: 'white', width: 36, height: 36, cursor: 'pointer'
                  }}>✕</button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                  {([
                    { k: 'form' as const, label: 'ฟอร์ม', icon: <ClipboardCheck size={14} /> },
                    { k: 'history' as const, label: 'ประวัติ / ค้นหา', icon: <HistoryIcon size={14} /> },
                  ]).map((t) => (
                    <button key={t.k} onClick={() => { setCloseTab(t.k); if (t.k === 'history') searchHistory() }}
                      style={{
                        background: closeTab === t.k ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.18)',
                        color: closeTab === t.k ? '#ea580c' : 'white',
                        border: 'none', borderRadius: 8, padding: '6px 14px',
                        fontFamily: 'Kanit', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                      {t.icon}{t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '18px 22px', overflowY: 'auto', flex: 1 }}>
                {closeTab === 'form' && !closeData && (
                  <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    กำลังโหลดข้อมูล...
                  </div>
                )}
                {closeTab === 'form' && closeData && (
                  <>
                    {/* ข้อมูลกะ */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.4fr', gap: 10, marginBottom: 14 }}>
                      <div>
                        <div style={labelStyle}>วันที่</div>
                        <input type="date" value={closeData.closeDate || ''} disabled={isClosed}
                          onChange={(e) => setField('closeDate', e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <div style={labelStyle}>เวลาเข้า</div>
                        <input type="time" value={closeData.workTimeStart || ''} disabled={isClosed}
                          onChange={(e) => setField('workTimeStart', e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <div style={labelStyle}>เวลาออก</div>
                        <input type="time" value={closeData.workTimeEnd || ''} disabled={isClosed}
                          onChange={(e) => setField('workTimeEnd', e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <div style={labelStyle}>พนักงาน</div>
                        <input type="text" value={closeData.employeeName || ''} disabled={isClosed}
                          onChange={(e) => setField('employeeName', e.target.value)} style={inputStyle} />
                      </div>
                    </div>

                    {/* ยอดประจำวัน — จัดกลุ่มแยกชัดเจน */}
                    <div style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: 12, padding: 0, marginBottom: 14, overflow: 'hidden' }}>
                      <div style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', padding: '10px 14px', borderBottom: '1px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#9a3412', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <DollarSign size={14} /> ยอดประจำวัน
                        </div>
                        <div style={{ fontSize: 11, color: '#9a3412', fontWeight: 600 }}>
                          ยอดขายรวม:&nbsp;
                          <span style={{ fontSize: 16, color: '#c2410c', fontWeight: 800 }}>฿ {fmt(Number(closeData.salesTotal || 0))}</span>
                        </div>
                      </div>

                      {/* (1) ยอดขายตามช่องทางชำระ */}
                      <div style={{ padding: '12px 14px', borderBottom: '1px dashed #fed7aa' }}>
                        <div style={{ fontSize: 10, color: '#9a3412', fontWeight: 700, letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase' }}>
                          ① ยอดขายแยกตามช่องทาง
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                          {[
                            { k: 'cashTotal', label: 'เงินสด', color: '#2A6AAA', bg: '#F3F8FC' },
                            { k: 'promptpayTotal', label: 'PromptPay', color: '#2A6AAA', bg: '#F3F8FC' },
                            { k: 'transferTotal', label: 'เงินโอน', color: '#7c3aed', bg: '#f5f3ff' },
                            { k: 'otherTotal', label: 'อื่น ๆ', color: '#64748b', bg: '#f8fafc' },
                          ].map(f => (
                            <div key={f.k} style={{ background: f.bg, border: `1px solid ${f.color}22`, borderRadius: 8, padding: '8px 10px' }}>
                              <div style={{ fontSize: 10, color: f.color, fontWeight: 600, marginBottom: 2 }}>{f.label}</div>
                              <input type="number" step="0.01" value={closeData[f.k] ?? 0} disabled={isClosed}
                                onChange={(e) => setField(f.k, e.target.value === '' ? 0 : Number(e.target.value))}
                                style={{ ...numInputStyle, padding: '4px 6px', fontSize: 13, fontWeight: 700, color: f.color, background: 'white', border: `1px solid ${f.color}33` }} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* (2) ยอดขายรวม + ยอดเงินสดนำส่ง */}
                      <div style={{ padding: '12px 14px', background: '#fafafa' }}>
                        <div style={{ fontSize: 10, color: '#9a3412', fontWeight: 700, letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase' }}>
                          ② สรุปยอดรวม &amp; เงินสดนำส่ง
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px' }}>
                            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>ยอดขาย (รวมทุกช่องทาง)</div>
                            <input type="number" step="0.01" value={closeData.salesTotal ?? 0} disabled={isClosed}
                              onChange={(e) => setField('salesTotal', e.target.value === '' ? 0 : Number(e.target.value))}
                              style={{ ...numInputStyle, padding: '4px 6px', fontSize: 14, fontWeight: 700, color: '#0f172a' }} />
                          </div>
                          <div style={{ background: '#fff7ed', border: '2px solid #fb923c', borderRadius: 8, padding: '8px 10px', position: 'relative' }}>
                            <div style={{ fontSize: 10, color: '#c2410c', fontWeight: 700, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Banknote size={11} /> ยอดเงินสดนำส่ง <span style={{ color: '#dc2626' }}>*</span>
                            </div>
                            <input type="number" step="0.01" value={closeData.cashDeliver ?? 0} disabled={isClosed}
                              onChange={(e) => setField('cashDeliver', e.target.value === '' ? 0 : Number(e.target.value))}
                              style={{ ...numInputStyle, padding: '4px 6px', fontSize: 14, fontWeight: 800, color: '#c2410c', background: 'white', border: '1px solid #fb923c' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* นับเงินสิ้นชัก */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Banknote size={14} color="#2A6AAA" /> นับเงินสดนำส่ง
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        {[
                          ['b1000', '1,000'], ['b500', '500'], ['b100', '100'],
                          ['b50', '50'], ['b20', '20'], ['b10', '10'],
                          ['b5', '5'], ['b2', '2'], ['b1', '1'],
                        ].map(([k, label]) => (
                          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 56, fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</div>
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>×</span>
                            <input type="number" min="0" value={closeData[k] ?? 0} disabled={isClosed}
                              onChange={(e) => setField(k, e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0))}
                              style={{ ...numInputStyle, padding: '6px 8px', flex: 1 }} />
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px dashed #cbd5e1' }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>รวมนับได้</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: '#1E5088' }}>{fmt(counted)} <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>บาท</span></div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: '#64748b' }}>ส่วนต่าง (นับ - นำส่ง)</div>
                          <div style={{
                            fontSize: 22, fontWeight: 800,
                            color: diff === 0 ? '#0f766e' : diff < 0 ? '#dc2626' : '#147F56'
                          }}>
                            {diff > 0 ? '+' : ''}{fmt(diff)}
                            <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 6, color: diff < 0 ? '#dc2626' : diff > 0 ? '#147F56' : '#0f766e' }}>
                              {diff < 0 ? '⚠ ขาด' : diff > 0 ? 'เกิน' : 'ตรง'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* เงินแลก & ยอดเงินคงเหลือในลิ้นชัก */}
                    <div style={{ background: 'linear-gradient(135deg,#fff7ed,#fef3c7)', border: '1.5px solid #fed7aa', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ background: '#f97316', color: 'white', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>💰 สรุปเงินในลิ้นชัก</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <div style={{ ...labelStyle, color: '#b45309', fontWeight: 700 }}>เงินแลก <span style={{ color: '#94a3b8', fontWeight: 400 }}>(บาท)</span></div>
                          <input
                            type="number" min={0} step={0.01}
                            value={closeData.changeAmount ?? 0}
                            disabled={isClosed}
                            onChange={(e) => setField('changeAmount', parseFloat(e.target.value) || 0)}
                            style={{ ...numInputStyle, background: isClosed ? '#f8fafc' : 'white', border: '1.5px solid #fbbf24', borderRadius: 8, fontSize: 15, fontWeight: 700, color: '#92400e', padding: '8px 10px' }}
                          />
                        </div>
                        <div>
                          <div style={{ ...labelStyle, color: '#b45309', fontWeight: 700 }}>ยอดเงินคงเหลือในลิ้นชัก <span style={{ color: '#94a3b8', fontWeight: 400 }}>(บาท)</span></div>
                          <input
                            type="number" min={0} step={0.01}
                            value={closeData.drawerBalance ?? 0}
                            disabled={isClosed}
                            onChange={(e) => setField('drawerBalance', parseFloat(e.target.value) || 0)}
                            style={{ ...numInputStyle, background: isClosed ? '#f8fafc' : 'white', border: '1.5px solid #fbbf24', borderRadius: 8, fontSize: 15, fontWeight: 700, color: '#1E5088', padding: '8px 10px' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* หมายเหตุ */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={labelStyle}>หมายเหตุ</div>
                      <textarea value={closeData.note || ''} disabled={isClosed}
                        onChange={(e) => setField('note', e.target.value)}
                        rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>
                  </>
                )}

                {closeTab === 'history' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: 8, marginBottom: 12 }}>
                      <div>
                        <div style={labelStyle}>ตั้งแต่</div>
                        <input type="date" value={closeSearch.from} onChange={(e) => setCloseSearch({ ...closeSearch, from: e.target.value })} style={inputStyle} />
                      </div>
                      <div>
                        <div style={labelStyle}>ถึง</div>
                        <input type="date" value={closeSearch.to} onChange={(e) => setCloseSearch({ ...closeSearch, to: e.target.value })} style={inputStyle} />
                      </div>
                      <div>
                        <div style={labelStyle}>คำค้น (พนักงาน / หมายเหตุ)</div>
                        <input type="text" value={closeSearch.q} onChange={(e) => setCloseSearch({ ...closeSearch, q: e.target.value })} style={inputStyle} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button onClick={searchHistory} disabled={closeBusy}
                          style={{ background: '#ea580c', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontFamily: 'Kanit', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Search size={14} /> ค้น
                        </button>
                      </div>
                    </div>

                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead style={{ background: '#f8fafc' }}>
                          <tr>
                            <th style={{ padding: 8, textAlign: 'left', color: '#475569' }}>วันที่</th>
                            <th style={{ padding: 8, textAlign: 'right', color: '#475569' }}>ยอดขาย</th>
                            <th style={{ padding: 8, textAlign: 'right', color: '#475569' }}>เงินสดนำส่ง</th>
                            <th style={{ padding: 8, textAlign: 'right', color: '#475569' }}>นับได้</th>
                            <th style={{ padding: 8, textAlign: 'right', color: '#475569' }}>ส่วนต่าง</th>
                            <th style={{ padding: 8, textAlign: 'center', color: '#475569' }}>สถานะ</th>
                            <th style={{ padding: 8, textAlign: 'center', color: '#475569' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {closeHistory.length === 0 && (
                            <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>ไม่พบข้อมูล</td></tr>
                          )}
                          {closeHistory.map((rec) => (
                            <tr key={rec.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                              <td style={{ padding: 8 }}>{String(rec.closeDate).slice(0, 10)}</td>
                              <td style={{ padding: 8, textAlign: 'right' }}>{fmt(rec.salesTotal)}</td>
                              <td style={{ padding: 8, textAlign: 'right' }}>{fmt(rec.cashDeliver)}</td>
                              <td style={{ padding: 8, textAlign: 'right' }}>{fmt(rec.totalCounted)}</td>
                              <td style={{ padding: 8, textAlign: 'right', color: rec.diff < 0 ? '#dc2626' : rec.diff > 0 ? '#147F56' : '#0f766e', fontWeight: 700 }}>
                                {rec.diff > 0 ? '+' : ''}{fmt(rec.diff)}
                              </td>
                              <td style={{ padding: 8, textAlign: 'center' }}>
                                <span style={{
                                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                                  background: rec.status === 'closed' ? '#D3F0E2' : '#fef3c7',
                                  color: rec.status === 'closed' ? '#0C5238' : '#92400e',
                                }}>{rec.status}</span>
                              </td>
                              <td style={{ padding: 8, textAlign: 'center' }}>
                                <button onClick={() => editFromHistory(rec)} title="แก้ไข"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2A6AAA', padding: 4 }}>
                                  <Pencil size={14} />
                                </button>
                                <button onClick={() => printSlip(rec)} title="พิมพ์"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4 }}>
                                  <Printer size={14} />
                                </button>
                                <button onClick={() => saveAsImage(rec)} title="บันทึกเป็นรูป" disabled={closeBusy}
                                  style={{ background: 'none', border: 'none', cursor: closeBusy ? 'wait' : 'pointer', color: '#0d9488', padding: 4 }}>
                                  <ImageDown size={14} />
                                </button>
                                <button onClick={() => removeRecord(rec.id)} title="ลบ"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 4 }}>
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              {closeTab === 'form' && closeData && (
                <div style={{ borderTop: '1px solid #e2e8f0' }}>
                {/* แถบสถานะสำรองข้อมูลอัตโนมัติหลังปิดบิล */}
                {closeBackup.status !== 'idle' && (() => {
                  const theme = {
                    running: { bg: '#F3F8FC', line: '#2A6AAA', text: '#12314F' },
                    done: { bg: '#F3F8FC', line: '#2A6AAA', text: '#102C4C' },
                    error: { bg: '#fff7ed', line: '#f59e0b', text: '#7c2d12' },
                    skipped: { bg: '#f8fafc', line: '#94a3b8', text: '#334155' },
                  }[closeBackup.status as 'running' | 'done' | 'error' | 'skipped']
                  return (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 22px', background: theme.bg,
                      borderLeft: `4px solid ${theme.line}`, color: theme.text,
                    }}>
                      <style>{`@keyframes dcSpin { to { transform: rotate(360deg); } }`}</style>
                      <div style={{ display: 'flex', flexShrink: 0 }}>
                        {closeBackup.status === 'running' && (
                          <RefreshCw size={18} color={theme.line} style={{ animation: 'dcSpin 0.9s linear infinite' }} />
                        )}
                        {closeBackup.status === 'done' && <CheckCircle2 size={18} color={theme.line} />}
                        {closeBackup.status === 'error' && <AlertTriangle size={18} color={theme.line} />}
                        {closeBackup.status === 'skipped' && <DatabaseBackup size={18} color={theme.line} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700 }}>
                          {closeBackup.status === 'running' && 'ปิดบิลเรียบร้อย · กำลังสำรองข้อมูลอัตโนมัติ...'}
                          {closeBackup.status === 'done' && 'ปิดบิลและสำรองข้อมูลเรียบร้อย'}
                          {closeBackup.status === 'error' && 'ปิดบิลเรียบร้อย แต่สำรองข้อมูลไม่สำเร็จ'}
                          {closeBackup.status === 'skipped' && 'ปิดบิลเรียบร้อย · ไม่ได้สำรองข้อมูล'}
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {closeBackup.status === 'running' && 'กรุณาอย่าปิดโปรแกรมจนกว่าจะเสร็จ'}
                          {closeBackup.status === 'done' && `${closeBackup.file} · ${Number(closeBackup.records || 0).toLocaleString('th-TH')} รายการ · เก็บที่ ${closeBackup.folder} · ${closeBackup.at}`}
                          {closeBackup.status === 'error' && (closeBackup.message || 'ไม่ทราบสาเหตุ')}
                          {closeBackup.status === 'skipped' && 'ปิดการสำรองข้อมูลเมื่อปิดบิลไว้ที่ ตั้งค่า → แบ็คอัพข้อมูล'}
                        </div>
                      </div>
                      {(closeBackup.status === 'error' || closeBackup.status === 'skipped') && (
                        <button onClick={() => runCloseBackup(closeData, true)}
                          style={{
                            flexShrink: 0, background: 'white', color: theme.text,
                            border: `1px solid ${theme.line}`, borderRadius: 8, padding: '6px 12px',
                            fontFamily: 'Kanit', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 5,
                          }}>
                          <DatabaseBackup size={13} /> สำรองข้อมูลตอนนี้
                        </button>
                      )}
                    </div>
                  )
                })()}
                <div style={{ padding: '14px 22px', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={() => printSlip(null)}
                    style={{ background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', fontFamily: 'Kanit', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Printer size={14} /> พิมพ์
                  </button>
                  <button onClick={() => saveAsImage(null)} disabled={closeBusy}
                    style={{ background: 'white', color: '#0d9488', border: '1px solid #99f6e4', borderRadius: 8, padding: '8px 14px', fontFamily: 'Kanit', fontSize: 12, cursor: closeBusy ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ImageDown size={14} /> บันทึกเป็นรูป
                  </button>
                  <div style={{ flex: 1 }} />
                  {!isClosed && (
                    <>
                      <button onClick={() => save('draft')} disabled={closeBusy}
                        style={{ background: '#f1f5f9', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', fontFamily: 'Kanit', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Save size={14} /> บันทึกร่าง
                      </button>
                      <button onClick={() => save('closed')} disabled={closeBusy}
                        style={{ background: 'linear-gradient(135deg,#2A6AAA,#3E86C7)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Lock size={14} /> ปิดบิล (ล็อก)
                      </button>
                    </>
                  )}
                  {isClosed && (
                    <button onClick={() => save('reopened')} disabled={closeBusy}
                      style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 14px', fontFamily: 'Kanit', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Pencil size={14} /> เปิดแก้ไข
                    </button>
                  )}
                </div>
                </div>
              )}
            </div>
          </>
        )
      })()}
    </div>
  )
}
export default ReportPage