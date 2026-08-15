'use client'

import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import {
  Users, Calendar as CalendarIcon, Filter, Search, RefreshCw, FileSpreadsheet, Printer,
  TrendingUp, TrendingDown, DollarSign, Percent, Package, Wallet, BarChart3, ListOrdered,
  ArrowUp, ArrowDown, ArrowUpDown,
} from 'lucide-react'
import { getLocalStorageItem } from '@/utils/localStorage'

type FilterMode = 'range' | 'month'

type DailyRow = {
  date: string
  sale: number
  cost: number
  profit: number
  profitPercent: number
}

type DailySummary = {
  totalSale: number
  totalCost: number
  totalProfit: number
  totalProfitPercent: number
  totalDays: number
  activeDays: number
  avgSalePerDay: number
  avgProfitPerDay: number
}

type PickItem = {
  code: string
  name: string
  unit: string
  qty: number
  gifts: number
  giftRate: number
}

type PickSummary = {
  totalQty: number
  totalGifts: number
  uniqueItems: number
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

const fmtDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const fmtDateLong = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('th-TH', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

const fmtDateTime = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;'
}[char] || char))

const EMPTY_SUMMARY: DailySummary = {
  totalSale: 0, totalCost: 0, totalProfit: 0, totalProfitPercent: 0,
  totalDays: 0, activeDays: 0, avgSalePerDay: 0, avgProfitPerDay: 0,
}

const EMPTY_PICK_SUMMARY: PickSummary = { totalQty: 0, totalGifts: 0, uniqueItems: 0 }

export default function EmployeeReportTab() {
  const company = useMemo(() => getLocalStorageItem('company_') || '', [])
  const [storeName, setStoreName] = useState('')

  const [employeeList, setEmployeeList] = useState<any[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState('')

  const [filterMode, setFilterMode] = useState<FilterMode>('month')
  const [startDate, setStartDate] = useState(firstDayOfMonthStr())
  const [endDate, setEndDate] = useState(todayStr())
  const [month, setMonth] = useState(currentMonthStr())

  const [daily, setDaily] = useState<DailyRow[]>([])
  const [summary, setSummary] = useState<DailySummary>(EMPTY_SUMMARY)
  const [pickItems, setPickItems] = useState<PickItem[]>([])
  const [pickSummary, setPickSummary] = useState<PickSummary>(EMPTY_PICK_SUMMARY)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  type SortDir = 'asc' | 'desc'
  type DailySortKey = 'date' | 'sale' | 'cost' | 'profit' | 'profitPercent'
  type PickSortKey = 'name' | 'qty' | 'giftRate' | 'gifts'
  const [dailySort, setDailySort] = useState<{ key: DailySortKey; dir: SortDir }>({ key: 'date', dir: 'asc' })
  const [pickSort, setPickSort] = useState<{ key: PickSortKey; dir: SortDir }>({ key: 'qty', dir: 'desc' })

  const toggleDailySort = (key: DailySortKey) => {
    setDailySort((prev) => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'date' ? 'asc' : 'desc' })
  }
  const togglePickSort = (key: PickSortKey) => {
    setPickSort((prev) => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })
  }

  const sortedDaily = useMemo(() => {
    const copy = [...daily]
    const { key, dir } = dailySort
    copy.sort((a, b) => {
      const av = a[key]
      const bv = b[key]
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
      return dir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [daily, dailySort])

  const sortedPickItems = useMemo(() => {
    const copy = pickItems.filter((row) => Number(row.gifts) !== 0)
    const { key, dir } = pickSort
    copy.sort((a, b) => {
      const av = a[key]
      const bv = b[key]
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
      return dir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [pickItems, pickSort])

  const visiblePickSummary = useMemo(() => ({
    uniqueItems: sortedPickItems.length,
    totalQty: sortedPickItems.reduce((s, r) => s + Number(r.qty || 0), 0),
    totalGifts: sortedPickItems.reduce((s, r) => s + Number(r.gifts || 0), 0),
  }), [sortedPickItems])

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => {
    if (!active) return <ArrowUpDown size={11} style={{ opacity: 0.35 }} />
    return dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
  }

  const rangeText = useMemo(() => {
    if (filterMode === 'month') {
      const [year, monthValue] = month.split('-')
      if (!year || !monthValue) return 'เดือนที่เลือก'
      const date = new Date(Number(year), Number(monthValue) - 1, 1)
      return date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
    }
    return `${fmtDate(startDate)} - ${fmtDate(endDate)}`
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
    const loadEmployees = async () => {
      if (!company) return
      try {
        const res = await axios.get(`/api/setting/employee?id_company=${encodeURIComponent(company)}`)
        setEmployeeList(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        console.error(err)
      }
    }
    loadStore()
    loadEmployees()
  }, [company])

  const fetchReport = async () => {
    if (!company) {
      setError('ไม่พบรหัสสาขา')
      return
    }
    if (!selectedEmployee) {
      setError('กรุณาเลือกพนักงานขาย')
      return
    }
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const { from, to } = getDateRange()
      const params = new URLSearchParams({ company, person: selectedEmployee, startDate: from, endDate: to })
      const res = await axios.get(`/api/reports/employee-sales?${params.toString()}`)
      setDaily(Array.isArray(res.data?.daily) ? res.data.daily : [])
      setSummary(res.data?.summary || EMPTY_SUMMARY)
      setPickItems(Array.isArray(res.data?.pickItems) ? res.data.pickItems : [])
      setPickSummary(res.data?.pickSummary || EMPTY_PICK_SUMMARY)
    } catch (err: any) {
      console.error(err)
      setDaily([])
      setSummary(EMPTY_SUMMARY)
      setPickItems([])
      setPickSummary(EMPTY_PICK_SUMMARY)
      setError(err?.response?.data?.error || 'โหลดรายงานพนักงานไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  // ---------- Export / Print: Col 1 (ยอดขาย/ต้นทุน/กำไร) ----------
  const exportDailyExcel = () => {
    if (daily.length === 0) return
    const detailRows = sortedDaily.map((row, index) => ({
      'ลำดับ': index + 1,
      'วันที่': fmtDateLong(row.date),
      'ยอดขาย': Number(row.sale.toFixed(2)),
      'ต้นทุน': Number(row.cost.toFixed(2)),
      'กำไร': Number(row.profit.toFixed(2)),
      '%กำไร': Number(row.profitPercent.toFixed(2)),
    }))

    const summaryRows = [
      ['รายงานยอดขายพนักงาน'],
      [storeName || company],
      [`พนักงาน: ${selectedEmployee}`],
      [`ช่วงรายงาน: ${rangeText}`],
      [],
      ['ยอดขายรวม', Number(summary.totalSale.toFixed(2))],
      ['ต้นทุนรวม', Number(summary.totalCost.toFixed(2))],
      ['กำไรรวม', Number(summary.totalProfit.toFixed(2))],
      ['%กำไรเฉลี่ย', Number(summary.totalProfitPercent.toFixed(2))],
      ['จำนวนวันทั้งหมด', summary.totalDays],
      ['จำนวนวันที่มีการขาย', summary.activeDays],
      ['ยอดขายเฉลี่ย/วัน (วันที่มีขาย)', Number(summary.avgSalePerDay.toFixed(2))],
      ['กำไรเฉลี่ย/วัน (วันที่มีขาย)', Number(summary.avgProfitPerDay.toFixed(2))],
    ]

    const wb = XLSX.utils.book_new()
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
    wsSummary['!cols'] = [{ wch: 28 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปรายงาน')

    const wsDetail = XLSX.utils.json_to_sheet(detailRows)
    wsDetail['!cols'] = [{ wch: 7 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 }]
    XLSX.utils.book_append_sheet(wb, wsDetail, 'รายวัน')

    XLSX.writeFile(wb, `รายงานพนักงาน_${selectedEmployee}_${filterMode === 'month' ? month : `${startDate}_${endDate}`}.xlsx`)
  }

  const printDailyReport = () => {
    if (daily.length === 0) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const tableRows = sortedDaily.map((row, index) => `
      <tr>
        <td class="center">${index + 1}</td>
        <td>${escapeHtml(fmtDateLong(row.date))}</td>
        <td class="num">${fmtNum(row.sale, 2)}</td>
        <td class="num">${fmtNum(row.cost, 2)}</td>
        <td class="num ${row.profit < 0 ? 'negative' : 'positive'}">${fmtNum(row.profit, 2)}</td>
        <td class="num ${row.profitPercent < 0 ? 'negative' : 'positive'}">${fmtNum(row.profitPercent, 2)}%</td>
      </tr>
    `).join('')

    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>รายงานยอดขายพนักงาน</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box} body{font-family:'Kanit',sans-serif;margin:0;color:#0f172a;background:#fff;font-size:11px}
        .page{padding:12mm 10mm}.header{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #0f766e;padding-bottom:10px;margin-bottom:10px}
        .title{font-size:20px;font-weight:800;color:#0f766e}.meta{font-size:10px;color:#475569;line-height:1.7;text-align:right}
        .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}.metric{border:1px solid #E5EEF8;border-radius:8px;padding:8px;background:#f8fafc}
        .metric .k{font-size:9px;color:#64748b}.metric .v{font-size:16px;font-weight:800;color:#0f172a}.positive{color:#1E5088}.negative{color:#dc2626}
        table{width:100%;border-collapse:collapse;margin-top:8px} th{background:#E5EEF8;color:#0f172a;font-size:9px;font-weight:700;padding:5px;border:1px solid #CCDFF1;text-align:left}
        td{font-size:9px;padding:4px 5px;border:1px solid #e2e8f0;vertical-align:top} tr:nth-child(even) td{background:#f8fafc}.center{text-align:center}.num{text-align:right;font-weight:700;white-space:nowrap}
        @media print{@page{size:A4;margin:10mm}.page{padding:0}thead{display:table-header-group}tr{page-break-inside:avoid}}
      </style></head><body><div class="page">
        <div class="header">
          <div><div class="title">รายงานยอดขายพนักงาน</div><div>${escapeHtml(storeName || company)}</div></div>
          <div class="meta">พนักงาน: ${escapeHtml(selectedEmployee)}<br/>ช่วงรายงาน: ${escapeHtml(rangeText)}<br/>พิมพ์เมื่อ: ${escapeHtml(fmtDateTime(new Date().toISOString()))}</div>
        </div>
        <div class="summary">
          <div class="metric"><div class="k">ยอดขายรวม</div><div class="v">${fmtNum(summary.totalSale, 2)}</div></div>
          <div class="metric"><div class="k">ต้นทุนรวม</div><div class="v">${fmtNum(summary.totalCost, 2)}</div></div>
          <div class="metric"><div class="k">กำไรรวม</div><div class="v ${summary.totalProfit < 0 ? 'negative' : 'positive'}">${fmtNum(summary.totalProfit, 2)}</div></div>
          <div class="metric"><div class="k">%กำไรเฉลี่ย</div><div class="v ${summary.totalProfitPercent < 0 ? 'negative' : 'positive'}">${fmtNum(summary.totalProfitPercent, 2)}%</div></div>
        </div>
        <table><thead><tr><th>#</th><th>วันที่</th><th>ยอดขาย</th><th>ต้นทุน</th><th>กำไร</th><th>%กำไร</th></tr></thead><tbody>${tableRows}</tbody></table>
      </div><script>window.onload=()=>{window.print()}</script></body></html>`)
    printWindow.document.close()
  }

  // ---------- Export / Print: Col 2 (ค่าหยิบ) ----------
  const exportPickExcel = () => {
    if (pickItems.length === 0) return
    const detailRows = sortedPickItems.map((row, index) => ({
      'ลำดับ': index + 1,
      'รหัสสินค้า': row.code,
      'รายการสินค้า': row.name,
      'หน่วย': row.unit,
      'จำนวนรวมที่หยิบ': Number(row.qty.toFixed(2)),
      'ค่าหยิบ/ชิ้น': Number(row.giftRate.toFixed(2)),
      'ราคารวมค่าหยิบ': Number(row.gifts.toFixed(2)),
    }))

    const summaryRows = [
      ['รายงานค่าหยิบพนักงาน'],
      [storeName || company],
      [`พนักงาน: ${selectedEmployee}`],
      [`ช่วงรายงาน: ${rangeText}`],
      [],
      ['จำนวนรายการสินค้า', visiblePickSummary.uniqueItems],
      ['จำนวนรวมที่หยิบ', Number(visiblePickSummary.totalQty.toFixed(2))],
      ['ราคารวมค่าหยิบ', Number(visiblePickSummary.totalGifts.toFixed(2))],
    ]

    const wb = XLSX.utils.book_new()
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
    wsSummary['!cols'] = [{ wch: 28 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปค่าหยิบ')

    const wsDetail = XLSX.utils.json_to_sheet(detailRows)
    wsDetail['!cols'] = [{ wch: 7 }, { wch: 16 }, { wch: 36 }, { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, wsDetail, 'ค่าหยิบรายสินค้า')

    XLSX.writeFile(wb, `รายงานค่าหยิบ_${selectedEmployee}_${filterMode === 'month' ? month : `${startDate}_${endDate}`}.xlsx`)
  }

  const printPickReport = () => {
    if (pickItems.length === 0) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const tableRows = sortedPickItems.map((row, index) => `
      <tr>
        <td class="center">${index + 1}</td>
        <td>${escapeHtml(row.code)}</td>
        <td>${escapeHtml(row.name)}</td>
        <td class="center">${escapeHtml(row.unit)}</td>
        <td class="num">${fmtNum(row.qty, 2)}</td>
        <td class="num">${fmtNum(row.giftRate, 2)}</td>
        <td class="num">${fmtNum(row.gifts, 2)}</td>
      </tr>
    `).join('')

    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>รายงานค่าหยิบพนักงาน</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box} body{font-family:'Kanit',sans-serif;margin:0;color:#0f172a;background:#fff;font-size:11px}
        .page{padding:12mm 10mm}.header{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #ec4899;padding-bottom:10px;margin-bottom:10px}
        .title{font-size:20px;font-weight:800;color:#be185d}.meta{font-size:10px;color:#475569;line-height:1.7;text-align:right}
        .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}.metric{border:1px solid #fbcfe8;border-radius:8px;padding:8px;background:#fdf2f8}
        .metric .k{font-size:9px;color:#64748b}.metric .v{font-size:16px;font-weight:800;color:#0f172a}
        table{width:100%;border-collapse:collapse;margin-top:8px} th{background:#fce7f3;color:#0f172a;font-size:9px;font-weight:700;padding:5px;border:1px solid #fbcfe8;text-align:left}
        td{font-size:9px;padding:4px 5px;border:1px solid #e2e8f0;vertical-align:top} tr:nth-child(even) td{background:#fdf2f8}.center{text-align:center}.num{text-align:right;font-weight:700;white-space:nowrap}
        @media print{@page{size:A4;margin:10mm}.page{padding:0}thead{display:table-header-group}tr{page-break-inside:avoid}}
      </style></head><body><div class="page">
        <div class="header">
          <div><div class="title">รายงานค่าหยิบพนักงาน</div><div>${escapeHtml(storeName || company)}</div></div>
          <div class="meta">พนักงาน: ${escapeHtml(selectedEmployee)}<br/>ช่วงรายงาน: ${escapeHtml(rangeText)}<br/>พิมพ์เมื่อ: ${escapeHtml(fmtDateTime(new Date().toISOString()))}</div>
        </div>
        <div class="summary">
          <div class="metric"><div class="k">จำนวนรายการสินค้า</div><div class="v">${fmtNum(visiblePickSummary.uniqueItems)}</div></div>
          <div class="metric"><div class="k">จำนวนรวมที่หยิบ</div><div class="v">${fmtNum(visiblePickSummary.totalQty, 2)}</div></div>
          <div class="metric"><div class="k">ราคารวมค่าหยิบ</div><div class="v">${fmtNum(visiblePickSummary.totalGifts, 2)}</div></div>
        </div>
        <table><thead><tr><th>#</th><th>รหัส</th><th>รายการสินค้า</th><th>หน่วย</th><th>จำนวนรวมที่หยิบ</th><th>ค่าหยิบ/ชิ้น</th><th>ราคารวมค่าหยิบ</th></tr></thead><tbody>${tableRows}</tbody></table>
      </div><script>window.onload=()=>{window.print()}</script></body></html>`)
    printWindow.document.close()
  }

  const statCards = [
    { label: 'ยอดขายรวม', value: fmtNum(summary.totalSale, 2), icon: TrendingUp, color: '#0f766e', bg: '#F3F8FC' },
    { label: 'ต้นทุนรวม', value: fmtNum(summary.totalCost, 2), icon: DollarSign, color: '#dc2626', bg: '#fef2f2' },
    { label: 'กำไรรวม', value: fmtNum(summary.totalProfit, 2), icon: summary.totalProfit < 0 ? TrendingDown : TrendingUp, color: summary.totalProfit < 0 ? '#dc2626' : '#147F56', bg: summary.totalProfit < 0 ? '#fef2f2' : '#EDF9F3' },
    { label: '%กำไรเฉลี่ย', value: `${fmtNum(summary.totalProfitPercent, 2)}%`, icon: Percent, color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'วันที่มีการขาย', value: `${fmtNum(summary.activeDays)} / ${fmtNum(summary.totalDays)}`, icon: BarChart3, color: '#2A6AAA', bg: '#F3F8FC' },
  ]

  const pickStatCards = [
    { label: 'รายการสินค้า', value: fmtNum(visiblePickSummary.uniqueItems), icon: Package, color: '#be185d', bg: '#fdf2f8' },
    { label: 'จำนวนรวมที่หยิบ', value: fmtNum(visiblePickSummary.totalQty, 2), icon: ListOrdered, color: '#0d9488', bg: '#F3F8FC' },
    { label: 'ราคารวมค่าหยิบ', value: fmtNum(visiblePickSummary.totalGifts, 2), icon: Wallet, color: '#d97706', bg: '#fffbeb' },
  ]

  return (
    <div style={{ fontFamily: 'Kanit', color: '#0f172a' }}>
      <div style={{
        background: 'linear-gradient(135deg,#F3F8FC 0%,#F3F8FC 100%)', border: '1px solid #c7d2fe', borderRadius: 10,
        padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#0f766e', color: '#fff', display: 'grid', placeItems: 'center' }}><Users size={15} /></div>
          <div>
            <div style={{ fontFamily: 'Kanit_B', fontSize: 14, color: '#0f766e' }}>รายงานพนักงาน</div>
            <div style={{ fontSize: 11, color: '#475569' }}>วิเคราะห์ยอดขาย ต้นทุน กำไร และค่าหยิบ แยกตามพนักงานขาย</div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 8, marginBottom: 6, boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 8, alignItems: 'end' }}>
          <div style={{ gridColumn: 'span 3' }}>
            <label style={labelStyle}>พนักงานขาย</label>
            <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} style={inputStyle}>
              <option value="">เลือกพนักงาน</option>
              {employeeList.map((emp) => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
            </select>
          </div>

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
            <button onClick={fetchReport} disabled={loading} style={{
              width: '100%', minHeight: 30, border: 'none', borderRadius: 8, background: loading ? '#94a3b8' : 'linear-gradient(90deg,#0f766e,#2A6AAA)',
              color: '#fff', fontFamily: 'Kanit_B', fontSize: 12, cursor: loading ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>{loading ? <RefreshCw size={14} className="spin" /> : <Search size={14} />} แสดงรายงาน</button>
          </div>
        </div>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 6, borderRadius: 8, marginBottom: 6, fontSize: 12 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }} className="employee-report-cols">
        {/* COL 1: ยอดขาย ต้นทุน กำไร */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '6px 10px', background: '#F3F8FC', borderBottom: '1px solid #CCDFF1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#0f766e' }}>ยอดขายประจำวัน · {rangeText}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={exportDailyExcel} disabled={daily.length === 0} style={actionButtonStyle(daily.length === 0, '#2A6AAA')}><FileSpreadsheet size={14} /> Excel</button>
              <button onClick={printDailyReport} disabled={daily.length === 0} style={actionButtonStyle(daily.length === 0, '#0d9488')}><Printer size={14} /> พิมพ์ A4</button>
            </div>
          </div>

          <div style={{ padding: 6, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
            {statCards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.color}22`, borderRadius: 8, padding: 6, minHeight: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'Kanit_B' }}>{card.label}</span>
                    <Icon size={13} color={card.color} />
                  </div>
                  <div style={{ fontSize: 14, fontFamily: 'Kanit_B', color: card.color, lineHeight: 1 }}>{card.value}</div>
                </div>
              )
            })}
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '38vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9', zIndex: 1 }}>
                <tr>
                  <th style={thSortStyle} onClick={() => toggleDailySort('date')}>
                    <span style={thLabelStyle}>วันที่ <SortIcon active={dailySort.key === 'date'} dir={dailySort.dir} /></span>
                  </th>
                  <th style={{ ...thSortStyle, textAlign: 'right' }} onClick={() => toggleDailySort('sale')}>
                    <span style={{ ...thLabelStyle, justifyContent: 'flex-end' }}>ยอดขาย <SortIcon active={dailySort.key === 'sale'} dir={dailySort.dir} /></span>
                  </th>
                  <th style={{ ...thSortStyle, textAlign: 'right' }} onClick={() => toggleDailySort('cost')}>
                    <span style={{ ...thLabelStyle, justifyContent: 'flex-end' }}>ต้นทุน <SortIcon active={dailySort.key === 'cost'} dir={dailySort.dir} /></span>
                  </th>
                  <th style={{ ...thSortStyle, textAlign: 'right' }} onClick={() => toggleDailySort('profit')}>
                    <span style={{ ...thLabelStyle, justifyContent: 'flex-end' }}>กำไร <SortIcon active={dailySort.key === 'profit'} dir={dailySort.dir} /></span>
                  </th>
                  <th style={{ ...thSortStyle, textAlign: 'right' }} onClick={() => toggleDailySort('profitPercent')}>
                    <span style={{ ...thLabelStyle, justifyContent: 'flex-end' }}>%กำไร <SortIcon active={dailySort.key === 'profitPercent'} dir={dailySort.dir} /></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {daily.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 14, color: '#94a3b8', fontSize: 12 }}>
                      {searched ? 'ไม่พบข้อมูลการขายตามเงื่อนไขที่เลือก' : 'เลือกพนักงานและช่วงวันแล้วกดแสดงรายงาน'}
                    </td>
                  </tr>
                ) : sortedDaily.map((row, index) => (
                  <tr key={row.date} style={{ borderBottom: '1px solid #f1f5f9', background: row.sale === 0 ? '#fff' : (index % 2 === 0 ? '#fff' : '#f8fafc') }}>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{fmtDateLong(row.date)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B' }}>{fmtNum(row.sale, 2)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtNum(row.cost, 2)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: row.profit < 0 ? '#dc2626' : '#147F56' }}>{fmtNum(row.profit, 2)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: row.profitPercent < 0 ? '#dc2626' : '#147F56' }}>{fmtNum(row.profitPercent, 2)}%</td>
                  </tr>
                ))}
              </tbody>
              {daily.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#f1f5f9', borderTop: '2px solid #cbd5e1' }}>
                    <td style={{ ...tdStyle, fontFamily: 'Kanit_B' }}>รวมทั้งหมด</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B' }}>{fmtNum(summary.totalSale, 2)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B' }}>{fmtNum(summary.totalCost, 2)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: summary.totalProfit < 0 ? '#dc2626' : '#147F56' }}>{fmtNum(summary.totalProfit, 2)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: summary.totalProfitPercent < 0 ? '#dc2626' : '#147F56' }}>{fmtNum(summary.totalProfitPercent, 2)}%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* COL 2: ค่าหยิบ */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '6px 10px', background: '#fdf2f8', borderBottom: '1px solid #fbcfe8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#be185d' }}>ค่าหยิบ (เรียงตามจำนวน) · {rangeText}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={exportPickExcel} disabled={pickItems.length === 0} style={actionButtonStyle(pickItems.length === 0, '#2A6AAA')}><FileSpreadsheet size={14} /> Excel</button>
              <button onClick={printPickReport} disabled={pickItems.length === 0} style={actionButtonStyle(pickItems.length === 0, '#db2777')}><Printer size={14} /> พิมพ์ A4</button>
            </div>
          </div>

          <div style={{ padding: 6, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
            {pickStatCards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.color}22`, borderRadius: 8, padding: 6, minHeight: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'Kanit_B' }}>{card.label}</span>
                    <Icon size={13} color={card.color} />
                  </div>
                  <div style={{ fontSize: 14, fontFamily: 'Kanit_B', color: card.color, lineHeight: 1 }}>{card.value}</div>
                </div>
              )
            })}
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '38vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9', zIndex: 1 }}>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thSortStyle} onClick={() => togglePickSort('name')}>
                    <span style={thLabelStyle}>รายการสินค้า <SortIcon active={pickSort.key === 'name'} dir={pickSort.dir} /></span>
                  </th>
                  <th style={{ ...thSortStyle, textAlign: 'right' }} onClick={() => togglePickSort('qty')}>
                    <span style={{ ...thLabelStyle, justifyContent: 'flex-end' }}>จำนวนที่หยิบ <SortIcon active={pickSort.key === 'qty'} dir={pickSort.dir} /></span>
                  </th>
                  <th style={{ ...thSortStyle, textAlign: 'right' }} onClick={() => togglePickSort('giftRate')}>
                    <span style={{ ...thLabelStyle, justifyContent: 'flex-end' }}>ค่าหยิบ/ชิ้น <SortIcon active={pickSort.key === 'giftRate'} dir={pickSort.dir} /></span>
                  </th>
                  <th style={{ ...thSortStyle, textAlign: 'right' }} onClick={() => togglePickSort('gifts')}>
                    <span style={{ ...thLabelStyle, justifyContent: 'flex-end' }}>ค่าหยิบรวม <SortIcon active={pickSort.key === 'gifts'} dir={pickSort.dir} /></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedPickItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 14, color: '#94a3b8', fontSize: 12 }}>
                      {searched ? 'ไม่พบข้อมูลค่าหยิบตามเงื่อนไขที่เลือก' : 'เลือกพนักงานและช่วงวันแล้วกดแสดงรายงาน'}
                    </td>
                  </tr>
                ) : sortedPickItems.map((row, index) => (
                  <tr key={`${row.code}-${row.name}`} style={{ borderBottom: '1px solid #f1f5f9', background: index % 2 === 0 ? '#fff' : '#fdf2f8' }}>
                    <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>{index + 1}</td>
                    <td style={tdStyle}>
                      <div style={{ fontFamily: 'Kanit_B' }}>{row.name || '-'}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{row.code} {row.unit ? `· ${row.unit}` : ''}</div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B' }}>{fmtNum(row.qty, 2)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: '#0f766e' }}>{fmtNum(row.giftRate, 2)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: '#d97706' }}>{fmtNum(row.gifts, 2)}</td>
                  </tr>
                ))}
              </tbody>
              {sortedPickItems.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#f1f5f9', borderTop: '2px solid #cbd5e1' }}>
                    <td colSpan={2} style={{ ...tdStyle, fontFamily: 'Kanit_B' }}>รวมทั้งหมด</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B' }}>{fmtNum(visiblePickSummary.totalQty, 2)}</td>
                    <td style={tdStyle}></td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: '#d97706' }}>{fmtNum(visiblePickSummary.totalGifts, 2)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1100px) {
          .employee-report-cols { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, color: '#475569', marginBottom: 5, fontFamily: 'Kanit_B' }
const inputStyle: React.CSSProperties = { width: '100%', minHeight: 36, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontFamily: 'Kanit', fontSize: 12, color: '#0f172a', background: '#fff', outline: 'none' }
const modeButtonStyle = (active: boolean): React.CSSProperties => ({ flex: 1, minHeight: 36, borderRadius: 8, border: active ? '1px solid #0f766e' : '1px solid #cbd5e1', background: active ? '#F3F8FC' : '#fff', color: active ? '#0f766e' : '#64748b', fontFamily: 'Kanit_B', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 })
const actionButtonStyle = (disabled: boolean, color: string): React.CSSProperties => ({ padding: '5px 10px', borderRadius: 8, border: 'none', background: disabled ? '#cbd5e1' : color, color: '#fff', fontFamily: 'Kanit_B', fontSize: 11, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 })
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '5px 8px', color: '#475569', fontFamily: 'Kanit_B', fontSize: 11, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }
const thSortStyle: React.CSSProperties = { ...thStyle, cursor: 'pointer', userSelect: 'none' }
const thLabelStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4 }
const tdStyle: React.CSSProperties = { padding: '4px 8px', color: '#0f172a', verticalAlign: 'middle' }
