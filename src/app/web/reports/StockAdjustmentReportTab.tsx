'use client'

import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { BarChart3, Calendar as CalendarIcon, FileSpreadsheet, Filter, PackageCheck, Printer, RefreshCw, Search, SlidersHorizontal, TrendingDown, TrendingUp } from 'lucide-react'
import { getLocalStorageItem } from '@/utils/localStorage'
import { STOCK_ADJUST_REASON_OPTIONS } from '@/lib/stockAdjustReasons'

type FilterMode = 'range' | 'month'

type ReasonGroup = {
  reason: string
  count: number
  increase: number
  decrease: number
  net: number
}

type StockAdjustReportRow = {
  id: number
  createDate?: string | null
  itemcode?: string | null
  itemName?: string | null
  lot?: string | null
  dateExp?: string | null
  quantity_change?: number | null
  balance_after?: number | null
  person?: string | null
  adjustReasonMain?: string | null
  receiverCompanyName?: string | null
}

type StockAdjustSummary = {
  totalRows: number
  totalIncrease: number
  totalDecrease: number
  netAdjust: number
  uniqueItems: number
  reasonGroups: ReasonGroup[]
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
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
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

export default function StockAdjustmentReportTab() {
  const company = useMemo(() => getLocalStorageItem('company_') || '', [])
  const [storeName, setStoreName] = useState('')
  const [filterMode, setFilterMode] = useState<FilterMode>('month')
  const [startDate, setStartDate] = useState(firstDayOfMonthStr())
  const [endDate, setEndDate] = useState(todayStr())
  const [month, setMonth] = useState(currentMonthStr())
  const [reason, setReason] = useState('')
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<StockAdjustReportRow[]>([])
  const [summary, setSummary] = useState<StockAdjustSummary>({ totalRows: 0, totalIncrease: 0, totalDecrease: 0, netAdjust: 0, uniqueItems: 0, reasonGroups: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const rangeText = useMemo(() => {
    if (filterMode === 'month') {
      const [year, monthValue] = month.split('-')
      if (!year || !monthValue) return 'เดือนที่เลือก'
      const date = new Date(Number(year), Number(monthValue) - 1, 1)
      return date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
    }
    return `${fmtDate(startDate)} - ${fmtDate(endDate)}`
  }, [filterMode, month, startDate, endDate])

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

  const fetchReport = async () => {
    if (!company) {
      setError('ไม่พบรหัสสาขา')
      return
    }
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const params = new URLSearchParams({ company, limit: '10000' })
      if (filterMode === 'month') {
        params.set('month', month)
      } else {
        params.set('startDate', startDate)
        params.set('endDate', endDate)
      }
      if (reason) params.set('reason', reason)
      if (search.trim()) params.set('search', search.trim())

      const res = await axios.get(`/api/reports/stock-adjustments?${params.toString()}`)
      const dataRows = Array.isArray(res.data?.rows) ? res.data.rows : []
      setRows(dataRows)
      setSummary(res.data?.summary || { totalRows: 0, totalIncrease: 0, totalDecrease: 0, netAdjust: 0, uniqueItems: 0, reasonGroups: [] })
    } catch (err: any) {
      console.error(err)
      setRows([])
      setSummary({ totalRows: 0, totalIncrease: 0, totalDecrease: 0, netAdjust: 0, uniqueItems: 0, reasonGroups: [] })
      setError(err?.response?.data?.error || 'โหลดรายงานปรับยอดไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company])

  const exportExcel = () => {
    if (rows.length === 0) return
    const detailRows = rows.map((row, index) => ({
      'ลำดับ': index + 1,
      'วันที่ปรับยอด': fmtDateTime(row.createDate),
      'รหัสสินค้า': row.itemcode || '',
      'รายการสินค้า': row.itemName || '',
      'Lot': row.lot || '',
      'วันหมดอายุ': fmtDate(row.dateExp),
      'เหตุผลหลัก': row.adjustReasonMain || 'ไม่ระบุ',
      'รายละเอียดเพิ่มเติม': row.receiverCompanyName || '',
      'จำนวนปรับ': Number(row.quantity_change || 0),
      'คงเหลือหลังปรับ': row.balance_after ?? '',
      'ผู้ทำรายการ': row.person || '',
    }))

    const summaryRows = [
      ['รายงานปรับยอดสินค้า'],
      [storeName || company],
      [`ช่วงรายงาน: ${rangeText}`],
      [`เหตุผลหลัก: ${reason || 'ทั้งหมด'}`],
      [],
      ['จำนวนรายการ', summary.totalRows],
      ['สินค้าไม่ซ้ำ', summary.uniqueItems],
      ['ยอดเพิ่มรวม', summary.totalIncrease],
      ['ยอดลดรวม', summary.totalDecrease],
      ['สุทธิ', summary.netAdjust],
      [],
      ['เหตุผลหลัก', 'รายการ', 'เพิ่ม', 'ลด', 'สุทธิ'],
      ...summary.reasonGroups.map((group) => [group.reason, group.count, group.increase, group.decrease, group.net]),
    ]

    const wb = XLSX.utils.book_new()
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
    wsSummary['!cols'] = [{ wch: 24 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปรายงาน')

    const wsDetail = XLSX.utils.json_to_sheet(detailRows)
    wsDetail['!cols'] = [
      { wch: 7 }, { wch: 19 }, { wch: 16 }, { wch: 36 }, { wch: 16 }, { wch: 14 },
      { wch: 28 }, { wch: 32 }, { wch: 12 }, { wch: 14 }, { wch: 18 },
    ]
    XLSX.utils.book_append_sheet(wb, wsDetail, 'รายการปรับยอด')
    XLSX.writeFile(wb, `รายงานปรับยอด_${filterMode === 'month' ? month : `${startDate}_${endDate}`}.xlsx`)
  }

  const printReport = () => {
    if (rows.length === 0) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const reasonRows = summary.reasonGroups.map((group) => `
      <tr>
        <td>${escapeHtml(group.reason)}</td>
        <td class="center">${fmtNum(group.count)}</td>
        <td class="num positive">${fmtNum(group.increase)}</td>
        <td class="num negative">${fmtNum(group.decrease)}</td>
        <td class="num ${group.net < 0 ? 'negative' : 'positive'}">${fmtNum(group.net)}</td>
      </tr>
    `).join('')

    const tableRows = rows.map((row, index) => {
      const quantity = Number(row.quantity_change || 0)
      return `
        <tr>
          <td class="center">${index + 1}</td>
          <td>${escapeHtml(fmtDateTime(row.createDate))}</td>
          <td>${escapeHtml(row.itemcode || '')}</td>
          <td>${escapeHtml(row.itemName || '')}</td>
          <td>${escapeHtml(row.lot || '')}</td>
          <td>${escapeHtml(row.adjustReasonMain || 'ไม่ระบุ')}</td>
          <td>${escapeHtml(row.receiverCompanyName || '')}</td>
          <td class="num ${quantity < 0 ? 'negative' : 'positive'}">${quantity > 0 ? '+' : ''}${fmtNum(quantity)}</td>
          <td class="num">${row.balance_after === null || row.balance_after === undefined ? '-' : fmtNum(row.balance_after)}</td>
          <td>${escapeHtml(row.person || '')}</td>
        </tr>
      `
    }).join('')

    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>รายงานปรับยอดสินค้า</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box} body{font-family:'Kanit',sans-serif;margin:0;color:#0f172a;background:#fff;font-size:11px}
        .page{padding:12mm 10mm}.header{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #0f766e;padding-bottom:10px;margin-bottom:10px}
        .title{font-size:20px;font-weight:800;color:#0f766e}.meta{font-size:10px;color:#475569;line-height:1.7;text-align:right}
        .summary{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:10px 0}.metric{border:1px solid #E5EEF8;border-radius:8px;padding:8px;background:#f8fafc}
        .metric .k{font-size:9px;color:#64748b}.metric .v{font-size:16px;font-weight:800;color:#0f172a}.positive{color:#1E5088}.negative{color:#dc2626}
        table{width:100%;border-collapse:collapse;margin-top:8px} th{background:#E5EEF8;color:#0f172a;font-size:9px;font-weight:700;padding:5px;border:1px solid #CCDFF1;text-align:left}
        td{font-size:9px;padding:4px 5px;border:1px solid #e2e8f0;vertical-align:top} tr:nth-child(even) td{background:#f8fafc}.center{text-align:center}.num{text-align:right;font-weight:700;white-space:nowrap}
        .section-title{font-size:12px;font-weight:800;color:#0f766e;margin-top:10px}
        @media print{@page{size:A4 landscape;margin:8mm}.page{padding:0}thead{display:table-header-group}tr{page-break-inside:avoid}}
      </style></head><body><div class="page">
        <div class="header">
          <div><div class="title">รายงานปรับยอดสินค้า</div><div>${escapeHtml(storeName || company)}</div></div>
          <div class="meta">ช่วงรายงาน: ${escapeHtml(rangeText)}<br/>เหตุผลหลัก: ${escapeHtml(reason || 'ทั้งหมด')}<br/>พิมพ์เมื่อ: ${escapeHtml(fmtDateTime(new Date().toISOString()))}</div>
        </div>
        <div class="summary">
          <div class="metric"><div class="k">จำนวนรายการ</div><div class="v">${fmtNum(summary.totalRows)}</div></div>
          <div class="metric"><div class="k">สินค้าไม่ซ้ำ</div><div class="v">${fmtNum(summary.uniqueItems)}</div></div>
          <div class="metric"><div class="k">ยอดเพิ่มรวม</div><div class="v positive">${fmtNum(summary.totalIncrease)}</div></div>
          <div class="metric"><div class="k">ยอดลดรวม</div><div class="v negative">${fmtNum(summary.totalDecrease)}</div></div>
          <div class="metric"><div class="k">สุทธิ</div><div class="v ${summary.netAdjust < 0 ? 'negative' : 'positive'}">${fmtNum(summary.netAdjust)}</div></div>
        </div>
        <div class="section-title">สรุปตามเหตุผลหลัก</div>
        <table><thead><tr><th>เหตุผลหลัก</th><th>รายการ</th><th>เพิ่ม</th><th>ลด</th><th>สุทธิ</th></tr></thead><tbody>${reasonRows}</tbody></table>
        <div class="section-title">รายการปรับยอด</div>
        <table><thead><tr><th>#</th><th>วันที่</th><th>รหัส</th><th>รายการสินค้า</th><th>Lot</th><th>เหตุผลหลัก</th><th>รายละเอียด</th><th>จำนวน</th><th>คงเหลือ</th><th>ผู้ทำรายการ</th></tr></thead><tbody>${tableRows}</tbody></table>
      </div><script>window.onload=()=>{window.print()}</script></body></html>`)
    printWindow.document.close()
  }

  const statCards = [
    { label: 'จำนวนรายการ', value: fmtNum(summary.totalRows), sub: 'ครั้ง', icon: BarChart3, color: '#0f766e', bg: '#F3F8FC' },
    { label: 'สินค้าไม่ซ้ำ', value: fmtNum(summary.uniqueItems), sub: 'รายการ', icon: PackageCheck, color: '#2A6AAA', bg: '#F3F8FC' },
    { label: 'ยอดเพิ่มรวม', value: fmtNum(summary.totalIncrease), sub: 'หน่วย', icon: TrendingUp, color: '#2A6AAA', bg: '#F3F8FC' },
    { label: 'ยอดลดรวม', value: fmtNum(summary.totalDecrease), sub: 'หน่วย', icon: TrendingDown, color: '#dc2626', bg: '#fef2f2' },
    { label: 'สุทธิ', value: `${summary.netAdjust > 0 ? '+' : ''}${fmtNum(summary.netAdjust)}`, sub: 'หน่วย', icon: SlidersHorizontal, color: summary.netAdjust < 0 ? '#dc2626' : '#7c3aed', bg: '#f5f3ff' },
  ]

  return (
    <div style={{ fontFamily: 'Kanit', color: '#0f172a' }}>
      <div style={{
        background: 'linear-gradient(135deg,#F3F8FC 0%,#F3F8FC 100%)', border: '1px solid #c7d2fe', borderRadius: 12,
        padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0f766e', color: '#fff', display: 'grid', placeItems: 'center' }}><SlidersHorizontal size={20} /></div>
          <div>
            <div style={{ fontFamily: 'Kanit_B', fontSize: 16, color: '#0f766e' }}>รายงานปรับยอด</div>
            <div style={{ fontSize: 12, color: '#475569' }}>ข้อมูลจากประวัติ StockTransaction ประเภท ADJUST</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={exportExcel} disabled={rows.length === 0} style={actionButtonStyle(rows.length === 0, '#2A6AAA')}><FileSpreadsheet size={14} /> Export Excel</button>
          <button onClick={printReport} disabled={rows.length === 0} style={actionButtonStyle(rows.length === 0, '#0d9488')}><Printer size={14} /> พิมพ์รายงาน</button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 12, boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 10, alignItems: 'end' }}>
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

          <div style={{ gridColumn: 'span 3' }}>
            <label style={labelStyle}>เหตุผลหลัก</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} style={inputStyle}>
              <option value="">ทั้งหมด</option>
              {STOCK_ADJUST_REASON_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          <div style={{ gridColumn: 'span 3' }}>
            <label style={labelStyle}>ค้นหา</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="รหัสสินค้า ชื่อสินค้า Lot ผู้ทำรายการ" style={inputStyle} />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <button onClick={fetchReport} disabled={loading} style={{
              width: '100%', minHeight: 36, border: 'none', borderRadius: 8, background: loading ? '#94a3b8' : 'linear-gradient(90deg,#0f766e,#2A6AAA)',
              color: '#fff', fontFamily: 'Kanit_B', fontSize: 13, cursor: loading ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>{loading ? <RefreshCw size={14} className="spin" /> : <Search size={14} />} แสดงรายงาน</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10, marginBottom: 12 }}>
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.color}22`, borderRadius: 10, padding: 12, minHeight: 86 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'Kanit_B' }}>{card.label}</span>
                <Icon size={18} color={card.color} />
              </div>
              <div style={{ fontSize: 22, fontFamily: 'Kanit_B', color: card.color, lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{card.sub}</div>
            </div>
          )
        })}
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 10, borderRadius: 10, marginBottom: 12, fontSize: 12 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 12 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontFamily: 'Kanit_B', fontSize: 14, color: '#0f172a' }}>รายการปรับยอด · {fmtNum(rows.length)} รายการ · {rangeText}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{reason || 'ทุกเหตุผลหลัก'}</div>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '58vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9', zIndex: 1 }}>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>วันที่</th>
                  <th style={thStyle}>รหัส</th>
                  <th style={thStyle}>รายการสินค้า</th>
                  <th style={thStyle}>Lot</th>
                  <th style={thStyle}>เหตุผลหลัก</th>
                  <th style={thStyle}>รายละเอียด</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>จำนวน</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>คงเหลือ</th>
                  <th style={thStyle}>ผู้ทำรายการ</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: 34, color: '#94a3b8', fontSize: 13 }}>
                      {searched ? 'ไม่พบข้อมูลปรับยอดตามเงื่อนไขที่เลือก' : 'เลือกเงื่อนไขแล้วกดแสดงรายงาน'}
                    </td>
                  </tr>
                ) : rows.map((row, index) => {
                  const quantity = Number(row.quantity_change || 0)
                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9', background: index % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>{index + 1}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{fmtDateTime(row.createDate)}</td>
                      <td style={{ ...tdStyle, color: '#1E5088', fontFamily: 'Kanit_B' }}>{row.itemcode || '-'}</td>
                      <td style={{ ...tdStyle, minWidth: 220 }}>{row.itemName || '-'}</td>
                      <td style={tdStyle}>{row.lot || '-'}</td>
                      <td style={tdStyle}><span style={reasonPillStyle}>{row.adjustReasonMain || 'ไม่ระบุ'}</span></td>
                      <td style={{ ...tdStyle, minWidth: 180, color: '#64748b' }}>{row.receiverCompanyName || '-'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: quantity < 0 ? '#dc2626' : '#147F56' }}>{quantity > 0 ? '+' : ''}{fmtNum(quantity)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{row.balance_after === null || row.balance_after === undefined ? '-' : fmtNum(row.balance_after)}</td>
                      <td style={tdStyle}>{row.person || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', alignSelf: 'start' }}>
          <div style={{ padding: '10px 12px', background: '#F3F8FC', borderBottom: '1px solid #CCDFF1', fontFamily: 'Kanit_B', color: '#0f766e', fontSize: 13 }}>สรุปตามเหตุผลหลัก</div>
          <div style={{ padding: 10, display: 'grid', gap: 8 }}>
            {summary.reasonGroups.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: 18 }}>ไม่มีข้อมูลสรุป</div>
            ) : summary.reasonGroups.map((group) => (
              <div key={group.reason} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 9, background: '#ffffff' }}>
                <div style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#0f172a', marginBottom: 5 }}>{group.reason}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, fontSize: 10, color: '#64748b' }}>
                  <span>{fmtNum(group.count)} รายการ</span>
                  <span style={{ color: '#2A6AAA' }}>+{fmtNum(group.increase)}</span>
                  <span style={{ color: '#dc2626' }}>-{fmtNum(group.decrease)}</span>
                  <span style={{ color: group.net < 0 ? '#dc2626' : '#7c3aed', fontFamily: 'Kanit_B' }}>{group.net > 0 ? '+' : ''}{fmtNum(group.net)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1100px) {
          div[style*="repeat(5"] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          div[style*="minmax(0, 1fr) 280px"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, color: '#475569', marginBottom: 5, fontFamily: 'Kanit_B' }
const inputStyle: React.CSSProperties = { width: '100%', minHeight: 36, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontFamily: 'Kanit', fontSize: 12, color: '#0f172a', background: '#fff', outline: 'none' }
const modeButtonStyle = (active: boolean): React.CSSProperties => ({ flex: 1, minHeight: 36, borderRadius: 8, border: active ? '1px solid #0f766e' : '1px solid #cbd5e1', background: active ? '#F3F8FC' : '#fff', color: active ? '#0f766e' : '#64748b', fontFamily: 'Kanit_B', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 })
const actionButtonStyle = (disabled: boolean, color: string): React.CSSProperties => ({ padding: '8px 12px', borderRadius: 8, border: 'none', background: disabled ? '#cbd5e1' : color, color: '#fff', fontFamily: 'Kanit_B', fontSize: 12, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 })
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '9px 8px', color: '#475569', fontFamily: 'Kanit_B', fontSize: 11, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }
const tdStyle: React.CSSProperties = { padding: '8px', color: '#0f172a', verticalAlign: 'middle' }
const reasonPillStyle: React.CSSProperties = { display: 'inline-block', maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '3px 8px', borderRadius: 999, background: '#E5EEF8', color: '#1E5088', fontFamily: 'Kanit_B', fontSize: 10 }