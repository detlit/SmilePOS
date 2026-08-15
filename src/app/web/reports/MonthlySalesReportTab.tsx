'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import {
  CalendarRange, Calendar as CalendarIcon, Filter, Search, RefreshCw, FileSpreadsheet, Printer,
  TrendingUp, DollarSign, Percent, Receipt, Wallet, CreditCard, Banknote,
  ArrowUp, ArrowDown, ArrowUpDown, Package, ChevronDown, X, ScanLine,
} from 'lucide-react'
import { getLocalStorageItem } from '@/utils/localStorage'

type FilterMode = 'month' | 'range'
type ViewMode = 'bills' | 'items'
type SortDir = 'asc' | 'desc'

type SaleMainRow = {
  id: number
  createDate?: string | null
  bill?: number | null
  orderNo?: string | null
  pay?: string | null
  transferDetail?: string | null
  cashAmount?: number | null
  transferAmount?: number | null
  discount?: number | null
  usereward?: number | null
  sumtotal?: number | null
  totalall?: number | null
  personall?: string | null
  statussall?: string | null
}

type SaleItemRow = {
  id: number
  id_salemain: number
  createDate?: string | null
  code_product?: string | null
  name_product?: string | null
  unit?: string | null
  qty?: number | null
  subunit?: string | null
  subqty?: number | null
  price?: number | null
  cost?: number | null
  discount?: number | null
  total?: number | null
  person?: string | null
  name_customer?: string | null
  phone?: string | null
  statuss?: string | null
}

type BillRow = {
  id: number
  date: string
  billNo: string
  orderNo: string
  customer: string
  phone: string
  payLabel: string
  pay: string
  itemCount: number
  qty: number
  discount: number
  reward: number
  net: number
  seller: string
  canceled: boolean
}

type FlatItemRow = {
  id: number
  billId: number
  date: string
  billNo: string
  orderNo: string
  payLabel: string
  code: string
  name: string
  unit: string
  qty: number
  /** หน่วยย่อยที่ตัดสต็อกจริง เช่น ขาย 1 กล่อง = 3 ซอง */
  subUnit: string
  subQty: number
  price: number
  unitCost: number
  cost: number
  discount: number
  total: number
  profit: number
  customer: string
  phone: string
  seller: string
  canceled: boolean
}

const todayStr = () => new Date().toISOString().slice(0, 10)
const firstDayOfMonthStr = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}
const currentMonthStr = () => new Date().toISOString().slice(0, 7)

const fmtNum = (value: unknown, fractionDigits = 0) => {
  const numberValue = Number(value || 0)
  return numberValue.toLocaleString('th-TH', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })
}

const fmtDateTime = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const fmtDateShort = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** จำนวนในหน่วยที่ตัดสต็อกจริง — ถ้าไม่มี subQty ให้ใช้ qty (สินค้าที่ไม่มีหน่วยย่อย) */
const stockQtyOf = (it: { qty: number; subQty: number }) => (it.subQty > 0 ? it.subQty : it.qty)

/**
 * ข้อความหน่วยย่อยของบรรทัดขาย เช่น ขาย 1 กล่อง (บรรจุ 3 ซอง) → "3 ซอง"
 * คืนค่าว่างถ้าหน่วยย่อยเท่ากับหน่วยขายอยู่แล้ว จะได้ไม่แสดงเลขซ้ำ
 */
const subQtyText = (it: { unit: string; qty: number; subUnit: string; subQty: number }) => {
  if (!it.subUnit || it.subQty <= 0) return ''
  if (it.subUnit === it.unit && it.subQty === it.qty) return ''
  return `${fmtNum(it.subQty, 2)} ${it.subUnit}`
}

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
}[char] || char))

const getPayLabel = (
  sale: { pay?: string | null; transferDetail?: string | null },
  providerNames: Record<string, string> = {},
) => {
  const pay = sale.pay
  if (!pay) return '-'
  if (pay === 'เงินสด+โอน') return 'แยกจ่าย เงินสด/โอน'
  if (pay === 'cash' || pay === 'เงินสด') return 'เงินสด'
  const rawDetail = (sale.transferDetail || '').trim()
  const detail = rawDetail ? (providerNames[rawDetail] || rawDetail) : ''
  if (pay === 'payment' || pay === 'โอน') return detail ? `โอน (${detail})` : 'โอน'
  if (pay === 'other' || pay === 'อื่นๆ') return detail ? `อื่นๆ (${detail})` : 'อื่นๆ'
  return detail ? `${pay} (${detail})` : pay
}

// normalize payment channel into one of: cash | transfer | split
const normalizePay = (pay?: string | null): 'cash' | 'transfer' | 'split' | 'other' => {
  if (pay === 'เงินสด' || pay === 'cash') return 'cash'
  if (pay === 'โอน' || pay === 'payment') return 'transfer'
  if (pay === 'เงินสด+โอน') return 'split'
  return 'other'
}

export default function MonthlySalesReportTab() {
  const company = useMemo(() => getLocalStorageItem('company_') || '', [])
  const [storeName, setStoreName] = useState('')

  const [filterMode, setFilterMode] = useState<FilterMode>('month')
  const [startDate, setStartDate] = useState(firstDayOfMonthStr())
  const [endDate, setEndDate] = useState(todayStr())
  const [month, setMonth] = useState(currentMonthStr())
  const [payFilter, setPayFilter] = useState<string>('all')
  const [customerQuery, setCustomerQuery] = useState('')
  const [itemQuery, setItemQuery] = useState('')
  const [customerOpen, setCustomerOpen] = useState(false)
  const customerBoxRef = useRef<HTMLDivElement>(null)

  const [viewMode, setViewMode] = useState<ViewMode>('bills')

  const [saleMain, setSaleMain] = useState<SaleMainRow[]>([])
  const [sales, setSales] = useState<SaleItemRow[]>([])
  const [payProviderNames, setPayProviderNames] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const [billSort, setBillSort] = useState<{ key: keyof BillRow; dir: SortDir }>({ key: 'date', dir: 'asc' })
  const [itemSort, setItemSort] = useState<{ key: keyof FlatItemRow; dir: SortDir }>({ key: 'date', dir: 'asc' })

  const toggleBillSort = (key: keyof BillRow) =>
    setBillSort((prev) => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'date' ? 'asc' : 'desc' })
  const toggleItemSort = (key: keyof FlatItemRow) =>
    setItemSort((prev) => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'date' ? 'asc' : 'desc' })

  const rangeText = useMemo(() => {
    if (filterMode === 'month') {
      const [year, monthValue] = month.split('-')
      if (!year || !monthValue) return 'เดือนที่เลือก'
      const date = new Date(Number(year), Number(monthValue) - 1, 1)
      return date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
    }
    return `${fmtDateShort(`${startDate}T00:00:00`)} - ${fmtDateShort(`${endDate}T00:00:00`)}`
  }, [filterMode, month, startDate, endDate])

  const getDateRange = () => {
    if (filterMode === 'month') {
      const [y, m] = month.split('-').map(Number)
      const from = new Date(y, m - 1, 1)
      const to = new Date(y, m, 0)
      return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }
    }
    return { from: startDate, to: endDate }
  }

  useEffect(() => {
    const loadStore = async () => {
      if (!company) return
      try {
        const res = await axios.get(`/api/setting/store/store?company=${encodeURIComponent(company)}`)
        if (res.data?.[0]) setStoreName(res.data[0].namestore || '')
      } catch (err) {
        console.error(err)
      }
    }
    loadStore()
  }, [company])

  // map payment provider key -> displayName (e.g. "custom_other_xxx" -> "CI")
  useEffect(() => {
    const loadProviders = async () => {
      if (!company) return
      try {
        const res = await axios.get(`/api/setting/payment-provider?company=${encodeURIComponent(company)}`)
        const map: Record<string, string> = {}
        for (const p of (Array.isArray(res.data) ? res.data : [])) {
          const key = String(p?.provider || '').trim()
          const name = String(p?.displayName || '').trim()
          if (key && name) map[key] = name
        }
        setPayProviderNames(map)
      } catch (err) {
        console.error(err)
      }
    }
    loadProviders()
  }, [company])

  // close customer dropdown when clicking outside
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (customerBoxRef.current && !customerBoxRef.current.contains(e.target as Node)) {
        setCustomerOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const fetchReport = async () => {
    if (!company) {
      setError('ไม่พบรหัสสาขา')
      return
    }
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const { from, to } = getDateRange()
      const params = new URLSearchParams({ company, startDate: from, endDate: to })
      const res = await axios.get(`/api/reports/monthly-sales?${params.toString()}`)
      setSaleMain(Array.isArray(res.data?.saleMain) ? res.data.saleMain : [])
      setSales(Array.isArray(res.data?.sales) ? res.data.sales : [])
    } catch (err: any) {
      console.error(err)
      setSaleMain([])
      setSales([])
      setError(err?.response?.data?.error || 'โหลดรายงานขายประจำเดือนไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  // ---- build per-bill customer info from items ----
  const itemsByBill = useMemo(() => {
    const map = new Map<number, SaleItemRow[]>()
    for (const item of sales) {
      const key = Number(item.id_salemain)
      const arr = map.get(key) || []
      arr.push(item)
      map.set(key, arr)
    }
    return map
  }, [sales])

  const billCustomer = (id: number) => {
    const items = itemsByBill.get(id) || []
    const withName = items.find((i) => (i.name_customer || '').trim())
    const withPhone = items.find((i) => (i.phone || '').trim())
    return {
      customer: (withName?.name_customer || '').trim() || 'ลูกค้าทั่วไป',
      phone: (withPhone?.phone || '').trim(),
    }
  }

  // ---- normalize, filter (pay + customer/phone), sort ----
  const customerNeedle = customerQuery.trim().toLowerCase()

  const allBills: BillRow[] = useMemo(() => {
    return saleMain.map((s) => {
      const items = itemsByBill.get(Number(s.id)) || []
      const okItems = items.filter((i) => i.statuss !== 'ยกเลิก')
      const { customer, phone } = billCustomer(Number(s.id))
      return {
        id: Number(s.id),
        date: s.createDate || '',
        billNo: s.bill != null ? String(s.bill) : (s.orderNo || '-'),
        orderNo: s.orderNo || '',
        customer,
        phone,
        payLabel: getPayLabel(s, payProviderNames),
        pay: s.pay || '',
        itemCount: okItems.length,
        qty: okItems.reduce((sum, i) => sum + Number(i.qty || 0), 0),
        discount: Number(s.discount || 0),
        reward: Number(s.usereward || 0),
        net: Number(s.sumtotal || 0),
        seller: s.personall || '-',
        canceled: s.statussall === 'ยกเลิก',
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleMain, itemsByBill, payProviderNames])

  // unique customer/phone options for the searchable dropdown (from loaded bills)
  const customerOptions = useMemo(() => {
    const map = new Map<string, { customer: string; phone: string }>()
    for (const b of allBills) {
      const key = `${b.customer}|${b.phone}`
      if (!map.has(key)) map.set(key, { customer: b.customer, phone: b.phone })
    }
    return Array.from(map.values()).sort((a, b) => a.customer.localeCompare(b.customer, 'th'))
  }, [allBills])

  const filteredCustomerOptions = useMemo(() => {
    const needle = customerQuery.trim().toLowerCase()
    if (!needle) return customerOptions
    return customerOptions.filter((o) => `${o.customer} ${o.phone}`.toLowerCase().includes(needle))
  }, [customerOptions, customerQuery])

  // distinct detailed payment channels present in the loaded bills (e.g. "โอน (กสิกร)")
  const payOptions = useMemo(() => {
    const set = new Set<string>()
    for (const b of allBills) {
      if (b.payLabel && b.payLabel !== '-') set.add(b.payLabel)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'))
  }, [allBills])

  const filteredBills = useMemo(() => {
    return allBills.filter((b) => {
      if (payFilter !== 'all' && b.payLabel !== payFilter) return false
      if (customerNeedle) {
        const hay = `${b.customer} ${b.phone}`.toLowerCase()
        if (!hay.includes(customerNeedle)) return false
      }
      return true
    })
  }, [allBills, payFilter, customerNeedle])

  const sortedBills = useMemo(() => {
    const copy = [...filteredBills]
    const { key, dir } = billSort
    copy.sort((a, b) => {
      const av = a[key]; const bv = b[key]
      const cmp = typeof av === 'string' ? String(av).localeCompare(String(bv), 'th') : (Number(av) - Number(bv))
      return dir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [filteredBills, billSort])

  const billIdSet = useMemo(() => new Set(filteredBills.map((b) => b.id)), [filteredBills])
  const billNoById = useMemo(() => {
    const m = new Map<number, string>()
    allBills.forEach((b) => m.set(b.id, b.billNo))
    return m
  }, [allBills])

  const allItems: FlatItemRow[] = useMemo(() => {
    const billMeta = new Map(allBills.map((b) => [b.id, b]))
    return sales
      .filter((i) => i.statuss !== 'ยกเลิก')
      .map((i) => {
        const bill = billMeta.get(Number(i.id_salemain))
        const total = Number(i.total || 0)
        const unitCost = Number(i.cost || 0)
        const cost = unitCost * Number(i.qty || 0)
        return {
          id: Number(i.id),
          billId: Number(i.id_salemain),
          date: i.createDate || '',
          billNo: billNoById.get(Number(i.id_salemain)) || '-',
          orderNo: bill?.orderNo || '',
          payLabel: bill?.payLabel || '-',
          code: i.code_product || '',
          name: i.name_product || '',
          unit: i.unit || '',
          qty: Number(i.qty || 0),
          subUnit: (i.subunit || '').trim(),
          subQty: Number(i.subqty || 0),
          price: Number(i.price || 0),
          unitCost,
          cost,
          discount: Number(i.discount || 0),
          total,
          profit: total - cost,
          customer: bill?.customer || (i.name_customer || '').trim() || 'ลูกค้าทั่วไป',
          phone: bill?.phone || (i.phone || '').trim(),
          seller: i.person || bill?.seller || '-',
          canceled: bill?.canceled || false,
        }
      })
  }, [sales, allBills, billNoById])

  const filteredItems = useMemo(() => {
    return allItems.filter((it) => {
      if (!billIdSet.has(it.billId)) return false
      return true
    })
  }, [allItems, billIdSet])

  const sortedItems = useMemo(() => {
    const copy = [...filteredItems]
    const { key, dir } = itemSort
    copy.sort((a, b) => {
      const av = a[key]; const bv = b[key]
      const cmp = typeof av === 'string' ? String(av).localeCompare(String(bv), 'th') : (Number(av) - Number(bv))
      return dir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [filteredItems, itemSort])

  // ---- product search / barcode (filters the displayed item list) ----
  const itemNeedle = itemQuery.trim().toLowerCase()
  const displayedItems = useMemo(() => {
    if (!itemNeedle) return sortedItems
    return sortedItems.filter((it) => `${it.code} ${it.name}`.toLowerCase().includes(itemNeedle))
  }, [sortedItems, itemNeedle])

  const itemTotals = useMemo(() => (
    displayedItems.reduce((acc, it) => {
      acc.qty += it.qty
      acc.stockQty += stockQtyOf(it)
      acc.total += it.total
      acc.cost += it.cost
      acc.profit += it.profit
      return acc
    }, { qty: 0, stockQty: 0, total: 0, cost: 0, profit: 0 })
  ), [displayedItems])

  // ป้ายหน่วยย่อยของยอดรวม: ถ้ารายการที่แสดงใช้หน่วยย่อยเดียวกันหมดก็บอกชื่อหน่วยไปเลย
  const totalSubUnitLabel = useMemo(() => {
    const units = new Set(displayedItems.filter((it) => subQtyText(it)).map((it) => it.subUnit))
    return units.size === 1 ? Array.from(units)[0] : 'หน่วยย่อย'
  }, [displayedItems])

  // ---- summary based on filtered (active) bills/items ----
  const summary = useMemo(() => {
    const activeBills = filteredBills.filter((b) => !b.canceled)
    const canceledBills = filteredBills.filter((b) => b.canceled)
    const activeBillIds = new Set(activeBills.map((b) => b.id))
    const activeItems = filteredItems.filter((it) => activeBillIds.has(it.billId))

    const totalNet = activeBills.reduce((s, b) => s + b.net, 0)
    const totalDiscount = activeBills.reduce((s, b) => s + b.discount, 0)
    const totalReward = activeBills.reduce((s, b) => s + b.reward, 0)
    const totalCost = activeItems.reduce((s, it) => s + it.cost, 0)
    const totalRevenue = activeItems.reduce((s, it) => s + it.total, 0)
    const profit = totalRevenue - totalCost
    const profitPercent = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

    let cashTotal = 0
    let transferTotal = 0
    activeBills.forEach((b) => {
      const sm = saleMain.find((s) => Number(s.id) === b.id)
      const kind = normalizePay(b.pay)
      if (kind === 'cash') cashTotal += b.net
      else if (kind === 'transfer') transferTotal += b.net
      else if (kind === 'split') {
        cashTotal += Number(sm?.cashAmount || 0)
        transferTotal += Number(sm?.transferAmount || 0)
      }
    })

    return {
      billCount: activeBills.length,
      canceledCount: canceledBills.length,
      totalQty: activeItems.reduce((s, it) => s + it.qty, 0),
      totalStockQty: activeItems.reduce((s, it) => s + stockQtyOf(it), 0),
      totalNet, totalDiscount, totalReward,
      totalCost, profit, profitPercent,
      cashTotal, transferTotal,
      avgPerBill: activeBills.length > 0 ? totalNet / activeBills.length : 0,
    }
  }, [filteredBills, filteredItems, saleMain])

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => {
    if (!active) return <ArrowUpDown size={11} style={{ opacity: 0.35 }} />
    return dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
  }

  const fileTag = filterMode === 'month' ? month : `${startDate}_${endDate}`

  // ---------------- Excel export ----------------
  const exportExcel = () => {
    if (filteredBills.length === 0 && filteredItems.length === 0) return
    const wb = XLSX.utils.book_new()

    const summaryRows: (string | number)[][] = [
      ['รายงานขายประจำเดือน'],
      [storeName || company],
      [`ช่วงรายงาน: ${rangeText}`],
      [`ช่องทางชำระ: ${payFilter === 'all' ? 'ทั้งหมด' : payFilter}`],
      ...(customerNeedle ? [[`ค้นหาลูกค้า/เบอร์: ${customerQuery}`]] : []),
      ...(itemNeedle ? [[`ค้นหาสินค้า/บาร์โค้ด: ${itemQuery}`]] : []),
      [`พิมพ์เมื่อ: ${fmtDateTime(new Date().toISOString())}`],
      [],
      ['ภาพรวม', 'ค่า', 'หน่วย'],
      ['จำนวนบิลขาย', summary.billCount, 'บิล'],
      ['จำนวนบิลยกเลิก', summary.canceledCount, 'บิล'],
      ['จำนวนชิ้นรวม', Number(summary.totalQty.toFixed(2)), 'ชิ้น'],
      ['จำนวนหน่วยย่อยรวม', Number(summary.totalStockQty.toFixed(2)), 'หน่วยย่อย'],
      ['ยอดขายสุทธิ', Number(summary.totalNet.toFixed(2)), 'บาท'],
      ['ส่วนลดรวม', Number(summary.totalDiscount.toFixed(2)), 'บาท'],
      ['ตัดแต้มรวม', Number(summary.totalReward.toFixed(2)), 'บาท'],
      ['ต้นทุนรวม', Number(summary.totalCost.toFixed(2)), 'บาท'],
      ['กำไรรวม', Number(summary.profit.toFixed(2)), 'บาท'],
      ['อัตรากำไร', Number(summary.profitPercent.toFixed(2)), '%'],
      ['ยอดเงินสด', Number(summary.cashTotal.toFixed(2)), 'บาท'],
      ['ยอดเงินโอน', Number(summary.transferTotal.toFixed(2)), 'บาท'],
      ['ยอดเฉลี่ย/บิล', Number(summary.avgPerBill.toFixed(2)), 'บาท'],
    ]
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
    wsSummary['!cols'] = [{ wch: 24 }, { wch: 18 }, { wch: 8 }]
    XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุป')

    const billRows = sortedBills.map((b, idx) => ({
      'ลำดับ': idx + 1,
      'วันที่/เวลา': fmtDateTime(b.date),
      'เลขที่บิล': b.billNo,
      'ลูกค้า': b.customer,
      'เบอร์โทร': b.phone || '-',
      'ช่องทางชำระ': b.payLabel,
      'จำนวนรายการ': b.itemCount,
      'จำนวนชิ้น': Number(b.qty.toFixed(2)),
      'ส่วนลด': Number(b.discount.toFixed(2)),
      'ตัดแต้ม': Number(b.reward.toFixed(2)),
      'ยอดสุทธิ': Number(b.net.toFixed(2)),
      'ผู้ขาย': b.seller,
      'สถานะ': b.canceled ? 'ยกเลิก' : 'OK',
    }))
    const wsBills = XLSX.utils.json_to_sheet(billRows)
    wsBills['!cols'] = [{ wch: 7 }, { wch: 18 }, { wch: 12 }, { wch: 22 }, { wch: 13 }, { wch: 18 }, { wch: 11 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 9 }]
    XLSX.utils.book_append_sheet(wb, wsBills, 'รายการบิล')

    const itemRows = displayedItems.map((it, idx) => ({
      'ลำดับ': idx + 1,
      'วันที่/เวลา': fmtDateTime(it.date),
      'เลขที่บิล': it.billNo,
      'เลข Order': it.orderNo || '-',
      'ช่องทางชำระ': it.payLabel,
      'รหัสสินค้า': it.code,
      'รายการสินค้า': it.name,
      'หน่วย': it.unit,
      'จำนวน': Number(it.qty.toFixed(2)),
      'หน่วยย่อย': it.subUnit || '-',
      'จำนวนหน่วยย่อย': Number(stockQtyOf(it).toFixed(2)),
      'ราคา/หน่วย': Number(it.price.toFixed(2)),
      'ส่วนลด': Number(it.discount.toFixed(2)),
      'รวม': Number(it.total.toFixed(2)),
      'ราคาทุน/หน่วย': Number(it.unitCost.toFixed(2)),
      'ราคาทุนรวม': Number(it.cost.toFixed(2)),
      'กำไร': Number(it.profit.toFixed(2)),
      'ลูกค้า': it.customer,
      'เบอร์โทร': it.phone || '-',
      'ผู้ขาย': it.seller,
    }))
    const wsItems = XLSX.utils.json_to_sheet(itemRows)
    wsItems['!cols'] = [{ wch: 7 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 34 }, { wch: 9 }, { wch: 9 }, { wch: 10 }, { wch: 15 }, { wch: 11 }, { wch: 10 }, { wch: 11 }, { wch: 12 }, { wch: 12 }, { wch: 11 }, { wch: 20 }, { wch: 13 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsItems, 'รายการสินค้า')

    XLSX.writeFile(wb, `รายงานขายประจำเดือน_${fileTag}.xlsx`)
  }

  // ---------------- Print A4 ----------------
  const printReport = () => {
    if (filteredBills.length === 0 && filteredItems.length === 0) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const billsHtml = sortedBills.map((b, idx) => `
      <tr class="${b.canceled ? 'cancel' : ''}">
        <td class="center">${idx + 1}</td>
        <td>${escapeHtml(fmtDateTime(b.date))}</td>
        <td class="center">${escapeHtml(b.billNo)}</td>
        <td>${escapeHtml(b.customer)}${b.phone ? ` <span class="muted">(${escapeHtml(b.phone)})</span>` : ''}</td>
        <td>${escapeHtml(b.payLabel)}</td>
        <td class="center">${b.itemCount}</td>
        <td class="num">${fmtNum(b.discount, 2)}</td>
        <td class="num">${fmtNum(b.net, 2)}</td>
        <td>${escapeHtml(b.seller)}</td>
      </tr>`).join('')

    const itemsHtml = displayedItems.map((it, idx) => `
      <tr>
        <td class="center">${idx + 1}</td>
        <td>${escapeHtml(fmtDateTime(it.date))}</td>
        <td class="center">${escapeHtml(it.billNo)}</td>
        <td class="center">${escapeHtml(it.orderNo || '-')}</td>
        <td>${escapeHtml(it.payLabel)}</td>
        <td>${escapeHtml(it.code)}</td>
        <td>${escapeHtml(it.name)}</td>
        <td class="center">${escapeHtml(it.unit)}</td>
        <td class="num">${fmtNum(it.qty, 2)}${subQtyText(it) ? `<div class="subq">= ${escapeHtml(subQtyText(it))}</div>` : ''}</td>
        <td class="num">${fmtNum(it.price, 2)}</td>
        <td class="num">${fmtNum(it.total, 2)}</td>
        <td class="num">${fmtNum(it.unitCost, 2)}</td>
        <td class="num">${fmtNum(it.cost, 2)}</td>
        <td class="num ${it.profit < 0 ? 'negative' : 'positive'}">${fmtNum(it.profit, 2)}</td>
      </tr>`).join('')

    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>รายงานขายประจำเดือน</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box} body{font-family:'Kanit',sans-serif;margin:0;color:#0f172a;background:#fff;font-size:11px}
        .page{padding:12mm 10mm}
        .header{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #4f46e5;padding-bottom:10px;margin-bottom:10px}
        .title{font-size:20px;font-weight:800;color:#4338ca}.sub{font-size:11px;color:#475569}
        .meta{font-size:10px;color:#475569;line-height:1.7;text-align:right}
        .summary{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:10px 0}
        .metric{border:1px solid #e0e7ff;border-radius:8px;padding:8px;background:#f8fafc}
        .metric .k{font-size:9px;color:#64748b}.metric .v{font-size:15px;font-weight:800;color:#0f172a}
        .positive{color:#1E5088}.negative{color:#dc2626}
        h2{font-size:13px;color:#4338ca;margin:14px 0 6px;border-left:4px solid #6366f1;padding-left:8px}
        table{width:100%;border-collapse:collapse;margin-top:6px}
        th{background:#eef2ff;color:#0f172a;font-size:9px;font-weight:700;padding:5px;border:1px solid #c7d2fe;text-align:left}
        td{font-size:9px;padding:4px 5px;border:1px solid #e2e8f0;vertical-align:top}
        tr:nth-child(even) td{background:#f8fafc}
        tr.cancel td{color:#94a3b8;text-decoration:line-through}
        .center{text-align:center}.num{text-align:right;font-weight:700;white-space:nowrap}.muted{color:#94a3b8;font-weight:400}
        .subq{color:#94a3b8;font-weight:400;font-size:8px}
        tfoot td{background:#eef2ff;font-weight:800;border-top:2px solid #c7d2fe}
        @media print{@page{size:A4 landscape;margin:8mm}.page{padding:0}thead{display:table-header-group}tr{page-break-inside:avoid}}
      </style></head><body><div class="page">
        <div class="header">
          <div><div class="title">รายงานขายประจำเดือน</div><div class="sub">${escapeHtml(storeName || company)}</div></div>
          <div class="meta">ช่วงรายงาน: ${escapeHtml(rangeText)}<br/>ช่องทางชำระ: ${escapeHtml(payFilter === 'all' ? 'ทั้งหมด' : payFilter)}${customerNeedle ? `<br/>ค้นหา: ${escapeHtml(customerQuery)}` : ''}${itemNeedle ? `<br/>ค้นหาสินค้า: ${escapeHtml(itemQuery)}` : ''}<br/>พิมพ์เมื่อ: ${escapeHtml(fmtDateTime(new Date().toISOString()))}</div>
        </div>
        <div class="summary">
          <div class="metric"><div class="k">จำนวนบิล</div><div class="v">${fmtNum(summary.billCount)}</div></div>
          <div class="metric"><div class="k">ยอดขายสุทธิ</div><div class="v">${fmtNum(summary.totalNet, 2)}</div></div>
          <div class="metric"><div class="k">ต้นทุนรวม</div><div class="v">${fmtNum(summary.totalCost, 2)}</div></div>
          <div class="metric"><div class="k">กำไรรวม</div><div class="v ${summary.profit < 0 ? 'negative' : 'positive'}">${fmtNum(summary.profit, 2)}</div></div>
          <div class="metric"><div class="k">อัตรากำไร</div><div class="v ${summary.profit < 0 ? 'negative' : 'positive'}">${fmtNum(summary.profitPercent, 2)}%</div></div>
        </div>
        <div class="summary" style="grid-template-columns:repeat(4,1fr)">
          <div class="metric"><div class="k">เงินสด</div><div class="v">${fmtNum(summary.cashTotal, 2)}</div></div>
          <div class="metric"><div class="k">เงินโอน</div><div class="v">${fmtNum(summary.transferTotal, 2)}</div></div>
          <div class="metric"><div class="k">ส่วนลดรวม</div><div class="v">${fmtNum(summary.totalDiscount, 2)}</div></div>
          <div class="metric"><div class="k">ยอดเฉลี่ย/บิล</div><div class="v">${fmtNum(summary.avgPerBill, 2)}</div></div>
        </div>

        <h2>รายการบิล (${fmtNum(sortedBills.length)} บิล)</h2>
        <table>
          <thead><tr><th>#</th><th>วันที่/เวลา</th><th>เลขที่บิล</th><th>ลูกค้า</th><th>ช่องทางชำระ</th><th>รายการ</th><th>ส่วนลด</th><th>ยอดสุทธิ</th><th>ผู้ขาย</th></tr></thead>
          <tbody>${billsHtml}</tbody>
          <tfoot><tr><td colspan="7" class="num">รวมยอดขายสุทธิ</td><td class="num">${fmtNum(summary.totalNet, 2)}</td><td></td></tr></tfoot>
        </table>

        <h2>รายการสินค้า (${fmtNum(displayedItems.length)} รายการ)</h2>
        <table>
          <thead><tr><th>#</th><th>วันที่/เวลา</th><th>เลขที่บิล</th><th>เลข Order</th><th>ช่องทางชำระ</th><th>รหัส</th><th>รายการสินค้า</th><th>หน่วย</th><th>จำนวน</th><th>ราคา</th><th>รวม</th><th>ราคาทุน</th><th>ราคาทุนรวม</th><th>กำไร</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot><tr><td colspan="10" class="num">รวม</td><td class="num">${fmtNum(itemTotals.total, 2)}</td><td></td><td class="num">${fmtNum(itemTotals.cost, 2)}</td><td class="num ${itemTotals.profit < 0 ? 'negative' : 'positive'}">${fmtNum(itemTotals.profit, 2)}</td></tr></tfoot>
        </table>
      </div><script>window.onload=()=>{window.print()}</script></body></html>`)
    printWindow.document.close()
  }

  const statCards = [
    { label: 'จำนวนบิล', value: fmtNum(summary.billCount), sub: summary.canceledCount > 0 ? `ยกเลิก ${fmtNum(summary.canceledCount)}` : '', icon: Receipt, color: '#4f46e5', bg: '#eef2ff' },
    { label: 'ยอดขายสุทธิ', value: fmtNum(summary.totalNet, 2), sub: 'บาท', icon: TrendingUp, color: '#0f766e', bg: '#F3F8FC' },
    { label: 'ต้นทุนรวม', value: fmtNum(summary.totalCost, 2), sub: 'บาท', icon: DollarSign, color: '#dc2626', bg: '#fef2f2' },
    { label: 'กำไรรวม', value: fmtNum(summary.profit, 2), sub: 'บาท', icon: TrendingUp, color: summary.profit < 0 ? '#dc2626' : '#147F56', bg: summary.profit < 0 ? '#fef2f2' : '#EDF9F3' },
    { label: 'อัตรากำไร', value: `${fmtNum(summary.profitPercent, 2)}%`, sub: '', icon: Percent, color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'เงินสด', value: fmtNum(summary.cashTotal, 2), sub: 'บาท', icon: Banknote, color: '#0891b2', bg: '#ecfeff' },
    { label: 'เงินโอน', value: fmtNum(summary.transferTotal, 2), sub: 'บาท', icon: CreditCard, color: '#2A6AAA', bg: '#F3F8FC' },
    { label: 'ยอดเฉลี่ย/บิล', value: fmtNum(summary.avgPerBill, 2), sub: 'บาท', icon: Wallet, color: '#d97706', bg: '#fffbeb' },
  ]

  const hasData = filteredBills.length > 0 || filteredItems.length > 0

  return (
    <div style={{ fontFamily: 'Kanit', color: '#0f172a' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#eef2ff 0%,#ecfeff 100%)', border: '1px solid #c7d2fe', borderRadius: 10,
        padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#4f46e5', color: '#fff', display: 'grid', placeItems: 'center' }}><CalendarRange size={15} /></div>
          <div>
            <div style={{ fontFamily: 'Kanit_B', fontSize: 14, color: '#4338ca' }}>รายงานขายประจำเดือน</div>
            <div style={{ fontSize: 11, color: '#475569' }}>ค้นหาตามช่วงวัน/เดือน · ช่องทางชำระ · ลูกค้า/เบอร์โทร แสดงทั้งบิลและรายการสินค้า</div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 8, marginBottom: 6, boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 8, alignItems: 'end' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>โหมดค้นหา</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setFilterMode('month')} style={modeButtonStyle(filterMode === 'month')}><CalendarIcon size={13} /> เดือน</button>
              <button onClick={() => setFilterMode('range')} style={modeButtonStyle(filterMode === 'range')}><Filter size={13} /> ช่วงวัน</button>
            </div>
          </div>

          {filterMode === 'month' ? (
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>เดือน</label>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={inputStyle} />
            </div>
          ) : (
            <>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>วันที่เริ่ม</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>วันที่สิ้นสุด</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
              </div>
            </>
          )}

          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>ช่องทางชำระ</label>
            <select value={payFilter} onChange={(e) => setPayFilter(e.target.value)} style={inputStyle}>
              <option value="all">ทั้งหมด</option>
              {payOptions.map((label) => (
                <option key={label} value={label}>{label}</option>
              ))}
              {payFilter !== 'all' && !payOptions.includes(payFilter) && (
                <option value={payFilter}>{payFilter}</option>
              )}
            </select>
          </div>

          <div ref={customerBoxRef} style={{ gridColumn: filterMode === 'month' ? 'span 4' : 'span 2', position: 'relative' }}>
            <label style={labelStyle}>ลูกค้า / เบอร์โทร</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={customerQuery}
                onChange={(e) => { setCustomerQuery(e.target.value); setCustomerOpen(true) }}
                onFocus={() => setCustomerOpen(true)}
                placeholder="พิมพ์เพื่อค้นหา / เลือกลูกค้า หรือ เบอร์โทร"
                style={{ ...inputStyle, paddingRight: 52 }}
              />
              {customerQuery && (
                <button
                  type="button"
                  onClick={() => { setCustomerQuery(''); setCustomerOpen(false) }}
                  title="ล้างค่า"
                  style={{ position: 'absolute', right: 28, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'inline-flex', padding: 0 }}
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setCustomerOpen((o) => !o)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'inline-flex', padding: 0 }}
              >
                <ChevronDown size={16} style={{ transition: 'transform .15s', transform: customerOpen ? 'rotate(180deg)' : 'none' }} />
              </button>

              {customerOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, boxShadow: '0 8px 24px rgba(15,23,42,0.12)', zIndex: 30, maxHeight: 240, overflowY: 'auto' }}>
                  <div
                    onClick={() => { setCustomerQuery(''); setCustomerOpen(false) }}
                    style={{ padding: '8px 10px', fontSize: 12, cursor: 'pointer', color: '#4338ca', borderBottom: '1px solid #f1f5f9', fontFamily: 'Kanit_B' }}
                  >
                    ทั้งหมด (ไม่กรองลูกค้า)
                  </div>
                  {filteredCustomerOptions.length === 0 ? (
                    <div style={{ padding: 10, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                      {allBills.length === 0 ? 'กดแสดงรายงานเพื่อโหลดรายชื่อลูกค้า' : 'ไม่พบลูกค้าที่ตรงกับคำค้น'}
                    </div>
                  ) : filteredCustomerOptions.map((o, i) => (
                    <div
                      key={`${o.customer}-${o.phone}-${i}`}
                      onClick={() => { setCustomerQuery(o.phone || o.customer); setCustomerOpen(false) }}
                      style={{ padding: '8px 10px', fontSize: 12, cursor: 'pointer', borderBottom: '1px solid #f8fafc' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
                    >
                      <div style={{ fontFamily: 'Kanit_B', color: '#0f172a' }}>{o.customer}</div>
                      {o.phone && <div style={{ fontSize: 10, color: '#94a3b8' }}>{o.phone}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <button onClick={fetchReport} disabled={loading} style={{
              width: '100%', minHeight: 36, border: 'none', borderRadius: 8, background: loading ? '#94a3b8' : 'linear-gradient(90deg,#4f46e5,#2A6AAA)',
              color: '#fff', fontFamily: 'Kanit_B', fontSize: 12, cursor: loading ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>{loading ? <RefreshCw size={14} className="spin" /> : <Search size={14} />} แสดงรายงาน</button>
          </div>
        </div>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 6, borderRadius: 8, marginBottom: 6, fontSize: 12 }}>{error}</div>}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, marginBottom: 6 }} className="msr-stats">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.color}22`, borderRadius: 8, padding: 7, minHeight: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'Kanit_B' }}>{card.label}</span>
                <Icon size={13} color={card.color} />
              </div>
              <div style={{ fontSize: 15, fontFamily: 'Kanit_B', color: card.color, lineHeight: 1.1 }}>{card.value}</div>
              {card.sub && <div style={{ fontSize: 9, color: '#94a3b8' }}>{card.sub}</div>}
            </div>
          )
        })}
      </div>

      {/* Table panel */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '6px 10px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => setViewMode('bills')} style={viewTabStyle(viewMode === 'bills')}>
              <Receipt size={13} /> บิลขาย ({fmtNum(sortedBills.length)})
            </button>
            <button onClick={() => setViewMode('items')} style={viewTabStyle(viewMode === 'items')}>
              <Package size={13} /> รายการสินค้า ({fmtNum(displayedItems.length)})
            </button>
            {viewMode === 'items' && (
              <div style={{ position: 'relative', minWidth: 240, marginLeft: 4 }}>
                <ScanLine size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  value={itemQuery}
                  onChange={(e) => setItemQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
                  placeholder="ค้นหา/สแกนบาร์โค้ด · รหัส หรือ ชื่อสินค้า"
                  style={{ ...inputStyle, minHeight: 30, padding: '4px 28px 4px 28px', fontSize: 12 }}
                />
                {itemQuery && (
                  <button
                    type="button"
                    onClick={() => setItemQuery('')}
                    title="ล้างค่า"
                    style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'inline-flex', padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={exportExcel} disabled={!hasData} style={actionButtonStyle(!hasData, '#2A6AAA')}><FileSpreadsheet size={14} /> Excel</button>
            <button onClick={printReport} disabled={!hasData} style={actionButtonStyle(!hasData, '#4f46e5')}><Printer size={14} /> พิมพ์ A4</button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '52vh' }}>
          {viewMode === 'bills' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9', zIndex: 1 }}>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thSortStyle} onClick={() => toggleBillSort('date')}><span style={thLabelStyle}>วันที่/เวลา <SortIcon active={billSort.key === 'date'} dir={billSort.dir} /></span></th>
                  <th style={thSortStyle} onClick={() => toggleBillSort('billNo')}><span style={thLabelStyle}>เลขที่บิล <SortIcon active={billSort.key === 'billNo'} dir={billSort.dir} /></span></th>
                  <th style={thSortStyle} onClick={() => toggleBillSort('customer')}><span style={thLabelStyle}>ลูกค้า / เบอร์ <SortIcon active={billSort.key === 'customer'} dir={billSort.dir} /></span></th>
                  <th style={thSortStyle} onClick={() => toggleBillSort('payLabel')}><span style={thLabelStyle}>ช่องทางชำระ <SortIcon active={billSort.key === 'payLabel'} dir={billSort.dir} /></span></th>
                  <th style={{ ...thSortStyle, textAlign: 'right' }} onClick={() => toggleBillSort('itemCount')}><span style={{ ...thLabelStyle, justifyContent: 'flex-end' }}>รายการ <SortIcon active={billSort.key === 'itemCount'} dir={billSort.dir} /></span></th>
                  <th style={{ ...thSortStyle, textAlign: 'right' }} onClick={() => toggleBillSort('discount')}><span style={{ ...thLabelStyle, justifyContent: 'flex-end' }}>ส่วนลด <SortIcon active={billSort.key === 'discount'} dir={billSort.dir} /></span></th>
                  <th style={{ ...thSortStyle, textAlign: 'right' }} onClick={() => toggleBillSort('net')}><span style={{ ...thLabelStyle, justifyContent: 'flex-end' }}>ยอดสุทธิ <SortIcon active={billSort.key === 'net'} dir={billSort.dir} /></span></th>
                  <th style={thSortStyle} onClick={() => toggleBillSort('seller')}><span style={thLabelStyle}>ผู้ขาย <SortIcon active={billSort.key === 'seller'} dir={billSort.dir} /></span></th>
                </tr>
              </thead>
              <tbody>
                {sortedBills.length === 0 ? (
                  <tr><td colSpan={9} style={emptyCellStyle}>{searched ? 'ไม่พบข้อมูลบิลตามเงื่อนไขที่เลือก' : 'เลือกช่วงวัน/เดือนแล้วกดแสดงรายงาน'}</td></tr>
                ) : sortedBills.map((b, idx) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9', background: b.canceled ? '#fff7ed' : (idx % 2 === 0 ? '#fff' : '#f8fafc') }}>
                    <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{fmtDateTime(b.date)}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontFamily: 'Kanit_B' }}>{b.billNo}{b.canceled && <span style={{ marginLeft: 4, fontSize: 9, color: '#ea580c' }}>(ยกเลิก)</span>}</td>
                    <td style={tdStyle}>
                      <div style={{ fontFamily: 'Kanit_B' }}>{b.customer}</div>
                      {b.phone && <div style={{ fontSize: 10, color: '#94a3b8' }}>{b.phone}</div>}
                    </td>
                    <td style={tdStyle}>{b.payLabel}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{b.itemCount}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: b.discount > 0 ? '#dc2626' : '#0f172a' }}>{fmtNum(b.discount, 2)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', textDecoration: b.canceled ? 'line-through' : 'none', color: b.canceled ? '#94a3b8' : '#0f172a' }}>{fmtNum(b.net, 2)}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{b.seller}</td>
                  </tr>
                ))}
              </tbody>
              {sortedBills.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#eef2ff', borderTop: '2px solid #c7d2fe' }}>
                    <td colSpan={5} style={{ ...tdStyle, fontFamily: 'Kanit_B' }}>รวม {fmtNum(summary.billCount)} บิล (ที่ไม่ยกเลิก)</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B' }}>{fmtNum(summary.totalQty, 0)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B' }}>{fmtNum(summary.totalDiscount, 2)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: '#4338ca' }}>{fmtNum(summary.totalNet, 2)}</td>
                    <td style={tdStyle}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9', zIndex: 1 }}>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thSortStyle} onClick={() => toggleItemSort('date')}><span style={thLabelStyle}>วันที่/เวลา <SortIcon active={itemSort.key === 'date'} dir={itemSort.dir} /></span></th>
                  <th style={thSortStyle} onClick={() => toggleItemSort('billNo')}><span style={thLabelStyle}>บิล <SortIcon active={itemSort.key === 'billNo'} dir={itemSort.dir} /></span></th>
                  <th style={thSortStyle} onClick={() => toggleItemSort('orderNo')}><span style={thLabelStyle}>เลข Order <SortIcon active={itemSort.key === 'orderNo'} dir={itemSort.dir} /></span></th>
                  <th style={thSortStyle} onClick={() => toggleItemSort('payLabel')}><span style={thLabelStyle}>ช่องทางชำระ <SortIcon active={itemSort.key === 'payLabel'} dir={itemSort.dir} /></span></th>
                  <th style={thSortStyle} onClick={() => toggleItemSort('name')}><span style={thLabelStyle}>รายการสินค้า <SortIcon active={itemSort.key === 'name'} dir={itemSort.dir} /></span></th>
                  <th style={{ ...thSortStyle, textAlign: 'right' }} onClick={() => toggleItemSort('qty')}><span style={{ ...thLabelStyle, justifyContent: 'flex-end' }}>จำนวน <SortIcon active={itemSort.key === 'qty'} dir={itemSort.dir} /></span></th>
                  <th style={{ ...thSortStyle, textAlign: 'right' }} onClick={() => toggleItemSort('price')}><span style={{ ...thLabelStyle, justifyContent: 'flex-end' }}>ราคา <SortIcon active={itemSort.key === 'price'} dir={itemSort.dir} /></span></th>
                  <th style={{ ...thSortStyle, textAlign: 'right' }} onClick={() => toggleItemSort('total')}><span style={{ ...thLabelStyle, justifyContent: 'flex-end' }}>รวม <SortIcon active={itemSort.key === 'total'} dir={itemSort.dir} /></span></th>
                  <th style={{ ...thSortStyle, textAlign: 'right' }} onClick={() => toggleItemSort('unitCost')}><span style={{ ...thLabelStyle, justifyContent: 'flex-end' }}>ราคาทุน <SortIcon active={itemSort.key === 'unitCost'} dir={itemSort.dir} /></span></th>
                  <th style={{ ...thSortStyle, textAlign: 'right' }} onClick={() => toggleItemSort('cost')}><span style={{ ...thLabelStyle, justifyContent: 'flex-end' }}>ราคาทุนรวม <SortIcon active={itemSort.key === 'cost'} dir={itemSort.dir} /></span></th>
                  <th style={{ ...thSortStyle, textAlign: 'right' }} onClick={() => toggleItemSort('profit')}><span style={{ ...thLabelStyle, justifyContent: 'flex-end' }}>กำไร <SortIcon active={itemSort.key === 'profit'} dir={itemSort.dir} /></span></th>
                  <th style={thSortStyle} onClick={() => toggleItemSort('customer')}><span style={thLabelStyle}>ลูกค้า <SortIcon active={itemSort.key === 'customer'} dir={itemSort.dir} /></span></th>
                </tr>
              </thead>
              <tbody>
                {displayedItems.length === 0 ? (
                  <tr><td colSpan={13} style={emptyCellStyle}>{searched ? (itemNeedle ? 'ไม่พบสินค้าที่ตรงกับคำค้น/บาร์โค้ด' : 'ไม่พบข้อมูลรายการสินค้าตามเงื่อนไขที่เลือก') : 'เลือกช่วงวัน/เดือนแล้วกดแสดงรายงาน'}</td></tr>
                ) : displayedItems.map((it, idx) => (
                  <tr key={it.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{fmtDateTime(it.date)}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{it.billNo}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: it.orderNo ? '#0f172a' : '#94a3b8' }}>{it.orderNo || '-'}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{it.payLabel}</td>
                    <td style={tdStyle}>
                      <div style={{ fontFamily: 'Kanit_B' }}>{it.name || '-'}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{it.code}{it.unit ? ` · ${it.unit}` : ''}</div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B' }}>
                      <div>{fmtNum(it.qty, 2)}</div>
                      {subQtyText(it) && (
                        <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'Kanit' }}>= {subQtyText(it)}</div>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtNum(it.price, 2)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B' }}>{fmtNum(it.total, 2)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#b45309' }}>{fmtNum(it.unitCost, 2)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#b45309' }}>{fmtNum(it.cost, 2)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: it.profit < 0 ? '#dc2626' : '#147F56' }}>{fmtNum(it.profit, 2)}</td>
                    <td style={tdStyle}>
                      <div>{it.customer}</div>
                      {it.phone && <div style={{ fontSize: 10, color: '#94a3b8' }}>{it.phone}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
              {displayedItems.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#eef2ff', borderTop: '2px solid #c7d2fe' }}>
                    <td colSpan={6} style={{ ...tdStyle, fontFamily: 'Kanit_B' }}>รวม {fmtNum(displayedItems.length)} รายการ{itemNeedle ? ' (กรองตามคำค้น)' : ''}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B' }}>
                      <div>{fmtNum(itemTotals.qty, 2)}</div>
                      {itemTotals.stockQty !== itemTotals.qty && (
                        <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'Kanit' }}>= {fmtNum(itemTotals.stockQty, 2)} {totalSubUnitLabel}</div>
                      )}
                    </td>
                    <td style={tdStyle}></td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: '#4338ca' }}>{fmtNum(itemTotals.total, 2)}</td>
                    <td style={tdStyle}></td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: '#b45309' }}>{fmtNum(itemTotals.cost, 2)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: itemTotals.profit < 0 ? '#dc2626' : '#147F56' }}>{fmtNum(itemTotals.profit, 2)}</td>
                    <td style={tdStyle}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>

      <style jsx>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1200px) {
          .msr-stats { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .msr-stats { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, color: '#475569', marginBottom: 5, fontFamily: 'Kanit_B' }
const inputStyle: React.CSSProperties = { width: '100%', minHeight: 36, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontFamily: 'Kanit', fontSize: 12, color: '#0f172a', background: '#fff', outline: 'none' }
const modeButtonStyle = (active: boolean): React.CSSProperties => ({ flex: 1, minHeight: 36, borderRadius: 8, border: active ? '1px solid #4f46e5' : '1px solid #cbd5e1', background: active ? '#eef2ff' : '#fff', color: active ? '#4338ca' : '#64748b', fontFamily: 'Kanit_B', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 })
const viewTabStyle = (active: boolean): React.CSSProperties => ({ minHeight: 30, padding: '4px 12px', borderRadius: 8, border: active ? '1px solid #4f46e5' : '1px solid #e2e8f0', background: active ? '#4f46e5' : '#fff', color: active ? '#fff' : '#64748b', fontFamily: 'Kanit_B', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 })
const actionButtonStyle = (disabled: boolean, color: string): React.CSSProperties => ({ padding: '5px 10px', borderRadius: 8, border: 'none', background: disabled ? '#cbd5e1' : color, color: '#fff', fontFamily: 'Kanit_B', fontSize: 11, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 })
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '6px 8px', color: '#475569', fontFamily: 'Kanit_B', fontSize: 11, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }
const thSortStyle: React.CSSProperties = { ...thStyle, cursor: 'pointer', userSelect: 'none' }
const thLabelStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4 }
const tdStyle: React.CSSProperties = { padding: '5px 8px', color: '#0f172a', verticalAlign: 'middle' }
const emptyCellStyle: React.CSSProperties = { textAlign: 'center', padding: 18, color: '#94a3b8', fontSize: 12 }
