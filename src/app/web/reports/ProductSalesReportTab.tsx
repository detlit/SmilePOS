'use client'

import React, { useMemo, useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import {
  ShoppingBag, Calendar as CalendarIcon, Filter, Search, RefreshCw, FileSpreadsheet, Printer,
  TrendingUp, DollarSign, Percent, Package, Boxes, ScanLine, X,
  ArrowUp, ArrowDown, ArrowUpDown, Receipt,
} from 'lucide-react'
import { getLocalStorageItem } from '@/utils/localStorage'

type FilterMode = 'month' | 'range'
type SortDir = 'asc' | 'desc'

const VAT_RATE = 0.07 // ภาษีมูลค่าเพิ่ม 7%

type ProductRow = {
  code: string
  barcode: string
  name: string
  unit: string
  group: string
  stockBefore: number
  qtySold: number
  stockAfter: number
  gross: number      // ขายได้
  discount: number   // ส่วนลดสินค้า
  revenue: number    // รายรับ
  cost: number       // ต้นทุน
  profit: number     // กำไร
  roi: number        // ROI % (กำไร/ต้นทุน)
  beforeVat: number  // ก่อน VAT
  vat: number        // VAT
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

const fmtDateShort = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const fmtDateTime = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
}[char] || char))

export default function ProductSalesReportTab() {
  const company = useMemo(() => getLocalStorageItem('company_') || '', [])
  const [storeName, setStoreName] = useState('')

  const [filterMode, setFilterMode] = useState<FilterMode>('month')
  const [startDate, setStartDate] = useState(firstDayOfMonthStr())
  const [endDate, setEndDate] = useState(todayStr())
  const [month, setMonth] = useState(currentMonthStr())
  const [groupFilter, setGroupFilter] = useState('all')
  const [itemQuery, setItemQuery] = useState('')

  const [rows, setRows] = useState<ProductRow[]>([])
  const [billSummary, setBillSummary] = useState({ endBillDiscount: 0, billCount: 0, canceledCount: 0 })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const [sort, setSort] = useState<{ key: keyof ProductRow; dir: SortDir }>({ key: 'name', dir: 'asc' })
  const toggleSort = (key: keyof ProductRow) =>
    setSort((prev) => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' || key === 'code' ? 'asc' : 'desc' })

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
      const pad = (n: number) => String(n).padStart(2, '0')
      return {
        from: `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}`,
        to: `${to.getFullYear()}-${pad(to.getMonth() + 1)}-${pad(to.getDate())}`,
      }
    }
    return { from: startDate, to: endDate }
  }

  const fetchReport = async () => {
    if (!company) {
      setError('ไม่พบรหัสสาขา')
      return
    }
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      // โหลดชื่อร้านครั้งแรก (สำหรับหัวรายงาน)
      if (!storeName) {
        try {
          const storeRes = await axios.get(`/api/setting/store/store?company=${encodeURIComponent(company)}`)
          if (storeRes.data?.[0]) setStoreName(storeRes.data[0].namestore || '')
        } catch { /* ไม่บังคับ */ }
      }
      const { from, to } = getDateRange()
      const params = new URLSearchParams({ company, startDate: from, endDate: to })
      const res = await axios.get(`/api/reports/product-sales?${params.toString()}`)
      const rawRows: any[] = Array.isArray(res.data?.rows) ? res.data.rows : []
      setRows(rawRows.map((r) => {
        const revenue = Number(r.revenue || 0)
        const cost = Number(r.cost || 0)
        const profit = Number(r.profit || 0)
        const beforeVat = revenue / (1 + VAT_RATE)
        return {
          code: r.code || '',
          barcode: r.barcode || '',
          name: r.name || '',
          unit: r.unit || '',
          group: r.group || '',
          stockBefore: Number(r.stockBefore || 0),
          qtySold: Number(r.qtySold || 0),
          stockAfter: Number(r.stockAfter || 0),
          gross: Number(r.gross || 0),
          discount: Number(r.discount || 0),
          revenue,
          cost,
          profit,
          roi: cost > 0 ? (profit / cost) * 100 : 0,
          beforeVat,
          vat: revenue - beforeVat,
        }
      }))
      setBillSummary({
        endBillDiscount: Number(res.data?.summary?.endBillDiscount || 0),
        billCount: Number(res.data?.summary?.billCount || 0),
        canceledCount: Number(res.data?.summary?.canceledCount || 0),
      })
    } catch (err: any) {
      console.error(err)
      setRows([])
      setBillSummary({ endBillDiscount: 0, billCount: 0, canceledCount: 0 })
      setError(err?.response?.data?.error || 'โหลดรายงานขายตามสินค้าไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  // ---- ตัวกรองกลุ่มสินค้า / ค้นหาสินค้า ----
  const groupOptions = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((r) => { if (r.group) set.add(r.group) })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'))
  }, [rows])

  const itemNeedle = itemQuery.trim().toLowerCase()
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (groupFilter !== 'all' && r.group !== groupFilter) return false
      if (itemNeedle && !`${r.code} ${r.barcode} ${r.name}`.toLowerCase().includes(itemNeedle)) return false
      return true
    })
  }, [rows, groupFilter, itemNeedle])

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows]
    const { key, dir } = sort
    copy.sort((a, b) => {
      const av = a[key]; const bv = b[key]
      const cmp = typeof av === 'string' ? String(av).localeCompare(String(bv), 'th') : (Number(av) - Number(bv))
      return dir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [filteredRows, sort])

  // ---- ยอดรวม (ตามแถวที่กรองแล้ว) ----
  const totals = useMemo(() => {
    const t = filteredRows.reduce((acc, r) => {
      acc.qtySold += r.qtySold
      acc.gross += r.gross
      acc.discount += r.discount
      acc.revenue += r.revenue
      acc.cost += r.cost
      acc.profit += r.profit
      return acc
    }, { qtySold: 0, gross: 0, discount: 0, revenue: 0, cost: 0, profit: 0 })
    const beforeVat = t.revenue / (1 + VAT_RATE)
    return {
      ...t,
      roi: t.cost > 0 ? (t.profit / t.cost) * 100 : 0,
      beforeVat,
      vat: t.revenue - beforeVat,
      netRevenue: t.revenue - billSummary.endBillDiscount, // รายรับรวมหลังหักส่วนลดท้ายบิล
    }
  }, [filteredRows, billSummary.endBillDiscount])

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => {
    if (!active) return <ArrowUpDown size={11} style={{ opacity: 0.35 }} />
    return dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
  }

  const fileTag = filterMode === 'month' ? month : `${startDate}_${endDate}`
  const hasData = filteredRows.length > 0

  // ---------------- Excel export ----------------
  const exportExcel = () => {
    if (!hasData) return
    const wb = XLSX.utils.book_new()

    const header = [
      'ลำดับ', 'รหัสสินค้า', 'บาร์โค้ด', 'ชื่อสินค้า', 'หน่วย',
      'สต๊อกก่อนขาย', 'จำนวนการขาย', 'สต๊อกน่าจะเหลือ',
      'ขายได้', 'ส่วนลดสินค้า', 'รายรับ', 'ต้นทุน', 'กำไร', 'ROI %', 'ก่อน VAT', 'VAT',
    ]
    const dataRows = sortedRows.map((r, idx) => [
      idx + 1, r.code, r.barcode, r.name, r.unit,
      Number(r.stockBefore.toFixed(2)), Number(r.qtySold.toFixed(2)), Number(r.stockAfter.toFixed(2)),
      Number(r.gross.toFixed(2)), Number(r.discount.toFixed(2)), Number(r.revenue.toFixed(2)),
      Number(r.cost.toFixed(2)), Number(r.profit.toFixed(2)), Number(r.roi.toFixed(2)),
      Number(r.beforeVat.toFixed(2)), Number(r.vat.toFixed(2)),
    ])
    const footer = [
      ['รวม', '', '', '', '', '', Number(totals.qtySold.toFixed(2)), '',
        Number(totals.gross.toFixed(2)), Number(totals.discount.toFixed(2)), Number(totals.revenue.toFixed(2)),
        Number(totals.cost.toFixed(2)), Number(totals.profit.toFixed(2)), Number(totals.roi.toFixed(2)),
        Number(totals.beforeVat.toFixed(2)), Number(totals.vat.toFixed(2))],
      ['ส่วนลดท้ายบิล', '', '', '', '', '', '', '', '', '', Number(billSummary.endBillDiscount.toFixed(2)), '', '', '', '', ''],
      ['รายรับรวม จากการขายสินค้า', '', '', '', '', '', '', '', '', '', Number(totals.netRevenue.toFixed(2)), '', '', '', '', ''],
    ]

    const sheetRows: (string | number)[][] = [
      ['รายงานขายตามสินค้า'],
      [storeName || company],
      [`ช่วงรายงาน: ${rangeText}`],
      ...(groupFilter !== 'all' ? [[`กลุ่มสินค้า: ${groupFilter}`]] : []),
      ...(itemNeedle ? [[`ค้นหาสินค้า: ${itemQuery}`]] : []),
      [`พิมพ์เมื่อ: ${fmtDateTime(new Date().toISOString())}`],
      [],
      header,
      ...dataRows,
      ...footer,
    ]
    const ws = XLSX.utils.aoa_to_sheet(sheetRows)
    ws['!cols'] = [
      { wch: 7 }, { wch: 12 }, { wch: 16 }, { wch: 38 }, { wch: 9 },
      { wch: 12 }, { wch: 12 }, { wch: 13 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 11 },
    ]
    XLSX.utils.book_append_sheet(wb, ws, 'รายงานขายตามสินค้า')

    XLSX.writeFile(wb, `รายงานขายตามสินค้า_${fileTag}.xlsx`)
  }

  // ---------------- Print A4 landscape ----------------
  const printReport = () => {
    if (!hasData) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const rowsHtml = sortedRows.map((r, idx) => `
      <tr>
        <td class="center">${idx + 1}</td>
        <td>${escapeHtml(r.code)}</td>
        <td>${escapeHtml(r.barcode || '-')}</td>
        <td>${escapeHtml(r.name)}</td>
        <td class="center">${escapeHtml(r.unit || '-')}</td>
        <td class="num">${fmtNum(r.stockBefore, 0)}</td>
        <td class="num">${fmtNum(r.qtySold, 0)}</td>
        <td class="num">${fmtNum(r.stockAfter, 0)}</td>
        <td class="num">${fmtNum(r.gross, 2)}</td>
        <td class="num">${fmtNum(r.discount, 2)}</td>
        <td class="num">${fmtNum(r.revenue, 2)}</td>
        <td class="num">${fmtNum(r.cost, 2)}</td>
        <td class="num ${r.profit < 0 ? 'negative' : 'positive'}">${fmtNum(r.profit, 2)}</td>
        <td class="num">${fmtNum(r.roi, 2)}%</td>
        <td class="num">${fmtNum(r.beforeVat, 2)}</td>
        <td class="num">${fmtNum(r.vat, 2)}</td>
      </tr>`).join('')

    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>รายงานขายตามสินค้า</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box} body{font-family:'Kanit',sans-serif;margin:0;color:#0f172a;background:#fff;font-size:11px}
        .page{padding:10mm 8mm}
        .header{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #0d9488;padding-bottom:10px;margin-bottom:10px}
        .title{font-size:20px;font-weight:800;color:#0f766e}.sub{font-size:11px;color:#475569}
        .meta{font-size:10px;color:#475569;line-height:1.7;text-align:right}
        .summary{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:10px 0}
        .metric{border:1px solid #ccfbf1;border-radius:8px;padding:8px;background:#f8fafc}
        .metric .k{font-size:9px;color:#64748b}.metric .v{font-size:14px;font-weight:800;color:#0f172a}
        .positive{color:#1E5088}.negative{color:#dc2626}
        table{width:100%;border-collapse:collapse;margin-top:6px}
        th{background:#f0fdfa;color:#0f172a;font-size:8.5px;font-weight:700;padding:4px;border:1px solid #99f6e4;text-align:center}
        td{font-size:8.5px;padding:3px 4px;border:1px solid #e2e8f0;vertical-align:top}
        tr:nth-child(even) td{background:#f8fafc}
        .center{text-align:center}.num{text-align:right;font-weight:600;white-space:nowrap}
        tfoot td{background:#f0fdfa;font-weight:800;border-top:2px solid #99f6e4}
        @media print{@page{size:A4 landscape;margin:8mm}.page{padding:0}thead{display:table-header-group}tfoot{display:table-row-group}tr{page-break-inside:avoid}}
      </style></head><body><div class="page">
        <div class="header">
          <div><div class="title">รายงานขายตามสินค้า</div><div class="sub">${escapeHtml(storeName || company)}</div></div>
          <div class="meta">ช่วงรายงาน: ${escapeHtml(rangeText)}${groupFilter !== 'all' ? `<br/>กลุ่มสินค้า: ${escapeHtml(groupFilter)}` : ''}${itemNeedle ? `<br/>ค้นหาสินค้า: ${escapeHtml(itemQuery)}` : ''}<br/>จำนวนสินค้า: ${fmtNum(sortedRows.length)} รายการ · ${fmtNum(billSummary.billCount)} บิล<br/>พิมพ์เมื่อ: ${escapeHtml(fmtDateTime(new Date().toISOString()))}</div>
        </div>
        <div class="summary">
          <div class="metric"><div class="k">ขายได้</div><div class="v">${fmtNum(totals.gross, 2)}</div></div>
          <div class="metric"><div class="k">ส่วนลดสินค้า</div><div class="v">${fmtNum(totals.discount, 2)}</div></div>
          <div class="metric"><div class="k">รายรับ</div><div class="v">${fmtNum(totals.revenue, 2)}</div></div>
          <div class="metric"><div class="k">ต้นทุน</div><div class="v">${fmtNum(totals.cost, 2)}</div></div>
          <div class="metric"><div class="k">กำไร</div><div class="v ${totals.profit < 0 ? 'negative' : 'positive'}">${fmtNum(totals.profit, 2)}</div></div>
          <div class="metric"><div class="k">ROI</div><div class="v ${totals.profit < 0 ? 'negative' : 'positive'}">${fmtNum(totals.roi, 2)}%</div></div>
        </div>
        <table>
          <thead><tr>
            <th>#</th><th>รหัสสินค้า</th><th>บาร์โค้ด</th><th>ชื่อสินค้า</th><th>หน่วย</th>
            <th>สต๊อก<br/>ก่อนขาย</th><th>จำนวน<br/>การขาย</th><th>สต๊อกน่า<br/>จะเหลือ</th>
            <th>ขายได้</th><th>ส่วนลด<br/>สินค้า</th><th>รายรับ</th><th>ต้นทุน</th><th>กำไร</th><th>ROI</th><th>ก่อน VAT</th><th>VAT</th>
          </tr></thead>
          <tbody>${rowsHtml}</tbody>
          <tfoot>
            <tr><td colspan="6" class="num">รวม</td><td class="num">${fmtNum(totals.qtySold, 0)}</td><td></td><td class="num">${fmtNum(totals.gross, 2)}</td><td class="num">${fmtNum(totals.discount, 2)}</td><td class="num">${fmtNum(totals.revenue, 2)}</td><td class="num">${fmtNum(totals.cost, 2)}</td><td class="num ${totals.profit < 0 ? 'negative' : 'positive'}">${fmtNum(totals.profit, 2)}</td><td class="num">${fmtNum(totals.roi, 2)}%</td><td class="num">${fmtNum(totals.beforeVat, 2)}</td><td class="num">${fmtNum(totals.vat, 2)}</td></tr>
            <tr><td colspan="10" class="num">ส่วนลดท้ายบิล</td><td class="num">${fmtNum(billSummary.endBillDiscount, 2)}</td><td colspan="5"></td></tr>
            <tr><td colspan="10" class="num">รายรับรวม จากการขายสินค้า</td><td class="num">${fmtNum(totals.netRevenue, 2)}</td><td colspan="5"></td></tr>
          </tfoot>
        </table>
      </div><script>window.onload=()=>{window.print()}</script></body></html>`)
    printWindow.document.close()
  }

  const statCards = [
    { label: 'สินค้าที่ขาย', value: fmtNum(filteredRows.length), sub: 'รายการ', icon: Package, color: '#0d9488', bg: '#f0fdfa' },
    { label: 'จำนวนชิ้นรวม', value: fmtNum(totals.qtySold), sub: 'ชิ้น', icon: Boxes, color: '#1E5088', bg: '#F3F8FC' },
    { label: 'ขายได้', value: fmtNum(totals.gross, 2), sub: 'บาท', icon: Receipt, color: '#4f46e5', bg: '#eef2ff' },
    { label: 'รายรับ', value: fmtNum(totals.revenue, 2), sub: 'บาท', icon: TrendingUp, color: '#0f766e', bg: '#F3F8FC' },
    { label: 'ต้นทุน', value: fmtNum(totals.cost, 2), sub: 'บาท', icon: DollarSign, color: '#dc2626', bg: '#fef2f2' },
    { label: 'กำไร', value: fmtNum(totals.profit, 2), sub: 'บาท', icon: TrendingUp, color: totals.profit < 0 ? '#dc2626' : '#147F56', bg: totals.profit < 0 ? '#fef2f2' : '#EDF9F3' },
    { label: 'ROI', value: `${fmtNum(totals.roi, 2)}%`, sub: 'กำไร/ต้นทุน', icon: Percent, color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'ส่วนลดท้ายบิล', value: fmtNum(billSummary.endBillDiscount, 2), sub: 'บาท', icon: Receipt, color: '#d97706', bg: '#fffbeb' },
  ]

  const numTh = (label: string, key: keyof ProductRow) => (
    <th style={{ ...thSortStyle, textAlign: 'right' }} onClick={() => toggleSort(key)}>
      <span style={{ ...thLabelStyle, justifyContent: 'flex-end' }}>{label} <SortIcon active={sort.key === key} dir={sort.dir} /></span>
    </th>
  )

  return (
    <div style={{ fontFamily: 'Kanit', color: '#0f172a' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#f0fdfa 0%,#ecfeff 100%)', border: '1px solid #99f6e4', borderRadius: 10,
        padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#0d9488', color: '#fff', display: 'grid', placeItems: 'center' }}><ShoppingBag size={15} /></div>
          <div>
            <div style={{ fontFamily: 'Kanit_B', fontSize: 14, color: '#0f766e' }}>รายงานขายตามสินค้า</div>
            <div style={{ fontSize: 11, color: '#475569' }}>สรุปยอดขายรายสินค้า · สต๊อกก่อนขาย/น่าจะเหลือ · ต้นทุน กำไร ROI และ VAT ตามช่วงวัน/เดือน</div>
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
            <label style={labelStyle}>กลุ่มสินค้า</label>
            <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} style={inputStyle}>
              <option value="all">ทั้งหมด</option>
              {groupOptions.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div style={{ gridColumn: filterMode === 'month' ? 'span 4' : 'span 2', position: 'relative' }}>
            <label style={labelStyle}>ค้นหาสินค้า / บาร์โค้ด</label>
            <div style={{ position: 'relative' }}>
              <ScanLine size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                value={itemQuery}
                onChange={(e) => setItemQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
                placeholder="พิมพ์/สแกน รหัส บาร์โค้ด หรือ ชื่อสินค้า"
                style={{ ...inputStyle, paddingLeft: 28, paddingRight: 26 }}
              />
              {itemQuery && (
                <button
                  type="button"
                  onClick={() => setItemQuery('')}
                  title="ล้างค่า"
                  style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'inline-flex', padding: 0 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <button onClick={fetchReport} disabled={loading} style={{
              width: '100%', minHeight: 36, border: 'none', borderRadius: 8, background: loading ? '#94a3b8' : 'linear-gradient(90deg,#0d9488,#0891b2)',
              color: '#fff', fontFamily: 'Kanit_B', fontSize: 12, cursor: loading ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>{loading ? <RefreshCw size={14} className="spin" /> : <Search size={14} />} แสดงรายงาน</button>
          </div>
        </div>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 6, borderRadius: 8, marginBottom: 6, fontSize: 12 }}>{error}</div>}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, marginBottom: 6 }} className="psr-stats">
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
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, fontFamily: 'Kanit_B', color: '#0f766e' }}>
            <Package size={14} /> สินค้าที่มีการขาย {fmtNum(filteredRows.length)} รายการ
            <span style={{ color: '#94a3b8', fontFamily: 'Kanit', fontSize: 11 }}>· ช่วง {rangeText} · {fmtNum(billSummary.billCount)} บิล{billSummary.canceledCount > 0 ? ` (ยกเลิก ${fmtNum(billSummary.canceledCount)})` : ''}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={exportExcel} disabled={!hasData} style={actionButtonStyle(!hasData, '#2A6AAA')}><FileSpreadsheet size={14} /> Excel</button>
            <button onClick={printReport} disabled={!hasData} style={actionButtonStyle(!hasData, '#0d9488')}><Printer size={14} /> พิมพ์ A4</button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '56vh' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f0fdfa', zIndex: 1 }}>
              <tr>
                <th style={thStyle}>#</th>
                <th style={thSortStyle} onClick={() => toggleSort('code')}><span style={thLabelStyle}>รหัส / บาร์โค้ด <SortIcon active={sort.key === 'code'} dir={sort.dir} /></span></th>
                <th style={thSortStyle} onClick={() => toggleSort('name')}><span style={thLabelStyle}>ชื่อสินค้า <SortIcon active={sort.key === 'name'} dir={sort.dir} /></span></th>
                {numTh('สต๊อกก่อนขาย', 'stockBefore')}
                {numTh('จำนวนการขาย', 'qtySold')}
                {numTh('สต๊อกน่าจะเหลือ', 'stockAfter')}
                {numTh('ขายได้', 'gross')}
                {numTh('ส่วนลดสินค้า', 'discount')}
                {numTh('รายรับ', 'revenue')}
                {numTh('ต้นทุน', 'cost')}
                {numTh('กำไร', 'profit')}
                {numTh('ROI %', 'roi')}
                {numTh('ก่อน VAT', 'beforeVat')}
                {numTh('VAT', 'vat')}
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 ? (
                <tr><td colSpan={14} style={emptyCellStyle}>{searched ? (itemNeedle || groupFilter !== 'all' ? 'ไม่พบสินค้าที่ตรงกับเงื่อนไข' : 'ไม่พบข้อมูลการขายในช่วงที่เลือก') : 'เลือกช่วงวัน/เดือนแล้วกดแสดงรายงาน'}</td></tr>
              ) : sortedRows.map((r, idx) => (
                <tr key={`${r.code}-${r.barcode}-${idx}`} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                    <div style={{ fontFamily: 'Kanit_B' }}>{r.code || '-'}</div>
                    {r.barcode && <div style={{ fontSize: 10, color: '#94a3b8' }}>{r.barcode}</div>}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontFamily: 'Kanit_B' }}>{r.name || '-'}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{r.unit}{r.group ? ` · ${r.group}` : ''}</div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtNum(r.stockBefore, 0)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: '#0f766e' }}>{fmtNum(r.qtySold, 0)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: r.stockAfter < 0 ? '#dc2626' : '#0f172a' }}>{fmtNum(r.stockAfter, 0)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtNum(r.gross, 2)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: r.discount > 0 ? '#dc2626' : '#0f172a' }}>{fmtNum(r.discount, 2)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B' }}>{fmtNum(r.revenue, 2)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#b45309' }}>{fmtNum(r.cost, 2)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: r.profit < 0 ? '#dc2626' : '#147F56' }}>{fmtNum(r.profit, 2)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: r.profit < 0 ? '#dc2626' : '#7c3aed' }}>{fmtNum(r.roi, 2)}%</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#475569' }}>{fmtNum(r.beforeVat, 2)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#475569' }}>{fmtNum(r.vat, 2)}</td>
                </tr>
              ))}
            </tbody>
            {sortedRows.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f0fdfa', borderTop: '2px solid #99f6e4' }}>
                  <td colSpan={4} style={{ ...tdStyle, fontFamily: 'Kanit_B' }}>รวม {fmtNum(filteredRows.length)} รายการ</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: '#0f766e' }}>{fmtNum(totals.qtySold, 0)}</td>
                  <td style={tdStyle}></td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B' }}>{fmtNum(totals.gross, 2)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: '#dc2626' }}>{fmtNum(totals.discount, 2)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: '#0f766e' }}>{fmtNum(totals.revenue, 2)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: '#b45309' }}>{fmtNum(totals.cost, 2)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: totals.profit < 0 ? '#dc2626' : '#147F56' }}>{fmtNum(totals.profit, 2)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: '#7c3aed' }}>{fmtNum(totals.roi, 2)}%</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B' }}>{fmtNum(totals.beforeVat, 2)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B' }}>{fmtNum(totals.vat, 2)}</td>
                </tr>
                <tr style={{ background: '#fffbeb' }}>
                  <td colSpan={8} style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: '#92400e' }}>ส่วนลดท้ายบิล (รวมส่วนลดสมาชิก/ตัดแต้ม)</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: '#d97706' }}>{fmtNum(billSummary.endBillDiscount, 2)}</td>
                  <td colSpan={5} style={tdStyle}></td>
                </tr>
                <tr style={{ background: '#F3F8FC' }}>
                  <td colSpan={8} style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: '#173F6B' }}>รายรับรวม จากการขายสินค้า</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', fontSize: 13, color: '#1E5088' }}>{fmtNum(totals.netRevenue, 2)}</td>
                  <td colSpan={5} style={tdStyle}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <style jsx>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1200px) {
          .psr-stats { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .psr-stats { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, color: '#475569', marginBottom: 5, fontFamily: 'Kanit_B' }
const inputStyle: React.CSSProperties = { width: '100%', minHeight: 36, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontFamily: 'Kanit', fontSize: 12, color: '#0f172a', background: '#fff', outline: 'none' }
const modeButtonStyle = (active: boolean): React.CSSProperties => ({ flex: 1, minHeight: 36, borderRadius: 8, border: active ? '1px solid #0d9488' : '1px solid #cbd5e1', background: active ? '#f0fdfa' : '#fff', color: active ? '#0f766e' : '#64748b', fontFamily: 'Kanit_B', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 })
const actionButtonStyle = (disabled: boolean, color: string): React.CSSProperties => ({ padding: '5px 10px', borderRadius: 8, border: 'none', background: disabled ? '#cbd5e1' : color, color: '#fff', fontFamily: 'Kanit_B', fontSize: 11, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 })
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '6px 8px', color: '#475569', fontFamily: 'Kanit_B', fontSize: 11, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }
const thSortStyle: React.CSSProperties = { ...thStyle, cursor: 'pointer', userSelect: 'none' }
const thLabelStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4 }
const tdStyle: React.CSSProperties = { padding: '5px 8px', color: '#0f172a', verticalAlign: 'middle' }
const emptyCellStyle: React.CSSProperties = { textAlign: 'center', padding: 18, color: '#94a3b8', fontSize: 12 }
