'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
import axios from 'axios'
import {
  Building2, Search, Download, Printer, TrendingUp, TrendingDown,
  Package, AlertTriangle, Clock, CreditCard, ShieldCheck, ChevronDown,
  ChevronUp, Star, DollarSign, Truck, BarChart3, CalendarRange,
  CalendarDays, FileText, Minus
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { getLocalStorageItem } from '@/utils/localStorage'
import { useReactToPrint } from 'react-to-print'

interface VendorData {
  name: string
  code: string
  tel: string
  email: string
  leadtimeSetting: number
  totalPurchase: number
  totalDiscount: number
  totalVat: number
  receiveCount: number
  skuCount: number
  sharePercent: number
  growth: number | null
  prevTotal: number
  poCount: number
  poTotal: number
  avgLeadtime: number | null
  onTimeRate: number | null
  deliveryCount: number
  unpaidAmount: number
  unpaidCount: number
  creditNoteCount: number
  creditNoteTotal: number
  debitNoteCount: number
  debitNoteTotal: number
  avgMargin: number
  lowMarginItems: any[]
  topPurchased: any[]
  topSold: any[]
  priceChanges: any[]
  expiryExpiredCount: number
  expiry90Count: number
  expiry180Count: number
  expiryValue: number
  expiryItems: any[]
  scorecard: {
    price: number
    quality: number
    delivery: number
    credit: number
    variety: number
    returns: number
    total: number
  }
}

interface AnalysisData {
  summary: {
    totalVendors: number
    grandTotal: number
    totalPO: number
    totalReceive: number
    totalUnpaid: number
    totalCreditNotes: number
    totalExpiryItems: number
  }
  vendors: VendorData[]
}

export default function VendorAnalysisTab() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AnalysisData | null>(null)
  const [search, setSearch] = useState('')
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string>('overview')
  const printRef = useRef<HTMLDivElement>(null)

  // Date range
  const [dateMode, setDateMode] = useState<'month' | 'range'>('month')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Store name for print
  const [storeName, setStoreName] = useState('')

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const companyS = getLocalStorageItem('company_')
        const res = await axios.get(`/api/setting/store/store?company=${companyS}`)
        if (res.data?.[0]) setStoreName(res.data[0].namestore || '')
      } catch (e) { /* ignore */ }
    }
    fetchStore()
  }, [])

  const getDateRange = () => {
    if (dateMode === 'month' && selectedMonth) {
      const [y, m] = selectedMonth.split('-').map(Number)
      const from = new Date(y, m - 1, 1)
      const to = new Date(y, m, 0)
      return {
        dateFrom: from.toISOString().split('T')[0],
        dateTo: to.toISOString().split('T')[0],
      }
    }
    return { dateFrom, dateTo }
  }

  const fetchData = async () => {
    setLoading(true)
    const company = getLocalStorageItem('company_')
    const { dateFrom: df, dateTo: dt } = getDateRange()
    try {
      const res = await axios.get(`/api/vendor-analysis?company=${company}&dateFrom=${df}&dateTo=${dt}`)
      setData(res.data)
    } catch (e) {
      console.error(e)
      setData(null)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleSearch = () => { fetchData() }

  const filteredVendors = useMemo(() => {
    if (!data) return []
    if (!search.trim()) return data.vendors
    const q = search.toLowerCase()
    return data.vendors.filter(v =>
      v.name.toLowerCase().includes(q) || v.code.toLowerCase().includes(q)
    )
  }, [data, search])

  // Print
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `รายงานวิเคราะห์ผู้ขาย`,
  })

  // Export Excel
  const handleExport = () => {
    if (!data) return
    const rows = data.vendors.map((v, i) => ({
      '#': i + 1,
      'รหัส': v.code,
      'ชื่อผู้ขาย': v.name,
      'ยอดซื้อรวม': v.totalPurchase,
      'สัดส่วน %': v.sharePercent,
      'เติบโต %': v.growth ?? '-',
      'ใบรับสินค้า': v.receiveCount,
      'จำนวน SKU': v.skuCount,
      'ส่วนลดรวม': v.totalDiscount,
      'ใบ PO': v.poCount,
      'Lead Time เฉลี่ย (วัน)': v.avgLeadtime ?? '-',
      'ส่งตรงเวลา %': v.onTimeRate ?? '-',
      'ยอดค้างชำระ': v.unpaidAmount,
      'ใบลดหนี้': v.creditNoteCount,
      'มูลค่าลดหนี้': v.creditNoteTotal,
      'Margin เฉลี่ย %': v.avgMargin,
      'สินค้าใกล้หมดอายุ': v.expiry90Count + v.expiry180Count,
      'มูลค่าใกล้หมดอายุ': v.expiryValue,
      'คะแนนรวม': v.scorecard.total,
    }))
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'วิเคราะห์ผู้ขาย')

    // Detail sheets per vendor
    for (const v of data.vendors.slice(0, 20)) {
      const detailRows = v.topPurchased.map((item: any, i: number) => ({
        '#': i + 1,
        'รหัส': item.itemcode,
        'สินค้า': item.itemName,
        'จำนวนซื้อ': item.qty,
        'ต้นทุน': item.cost,
        'ราคาขาย': item.sellingPrice,
        'Margin %': item.margin,
        'ยอดรวม': item.totalcost,
      }))
      if (detailRows.length > 0) {
        const ws2 = XLSX.utils.json_to_sheet(detailRows)
        XLSX.utils.book_append_sheet(wb, ws2, (v.name || 'vendor').slice(0, 28))
      }
    }
    XLSX.writeFile(wb, `vendor_analysis_${selectedMonth || 'custom'}.xlsx`)
  }

  const fmt = (n: number, dec = 0) => n.toLocaleString('th-TH', { minimumFractionDigits: dec, maximumFractionDigits: dec })

  const getScoreColor = (score: number, max: number) => {
    const pct = (score / max) * 100
    if (pct >= 70) return { color: '#2A6AAA', bg: '#F3F8FC' }
    if (pct >= 50) return { color: '#d97706', bg: '#fffbeb' }
    return { color: '#dc2626', bg: '#fef2f2' }
  }

  const getScoreBadge = (total: number) => {
    if (total >= 70) return { label: 'ดีเยี่ยม', color: '#2A6AAA', bg: '#E5EEF8', icon: '🏆' }
    if (total >= 50) return { label: 'พอใช้', color: '#d97706', bg: '#fef9c3', icon: '⚡' }
    return { label: 'ต้องปรับปรุง', color: '#dc2626', bg: '#fee2e2', icon: '⚠️' }
  }

  const { dateFrom: displayFrom, dateTo: displayTo } = getDateRange()
  const periodLabel = dateMode === 'month' && selectedMonth
    ? new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]) - 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
    : `${displayFrom || '?'} - ${displayTo || '?'}`

  // ==================== RENDER ====================

  const renderSummaryCards = () => {
    if (!data) return null
    const s = data.summary
    const cards = [
      { label: 'ผู้ขายทั้งหมด', value: s.totalVendors, unit: 'ราย', icon: <Building2 size={20} />, color: '#6366f1', bg: '#eef2ff' },
      { label: 'ยอดซื้อรวม', value: fmt(s.grandTotal, 1), unit: 'บาท', icon: <DollarSign size={20} />, color: '#2A6AAA', bg: '#F3F8FC' },
      { label: 'ใบรับสินค้า', value: s.totalReceive, unit: 'ใบ', icon: <FileText size={20} />, color: '#2A6AAA', bg: '#F3F8FC' },
      { label: 'ยอดค้างชำระ', value: fmt(s.totalUnpaid, 1), unit: 'บาท', icon: <CreditCard size={20} />, color: '#dc2626', bg: '#fef2f2' },
      { label: 'ใบลดหนี้', value: s.totalCreditNotes, unit: 'ใบ', icon: <AlertTriangle size={20} />, color: '#d97706', bg: '#fffbeb' },
      { label: 'สินค้าใกล้หมดอายุ', value: s.totalExpiryItems, unit: 'รายการ', icon: <ShieldCheck size={20} />, color: '#ea580c', bg: '#fff7ed' },
    ]
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        {cards.map((c, i) => (
          <div key={i} style={{
            background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}>
                {c.icon}
              </div>
              <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8' }}>{c.label}</span>
            </div>
            <div style={{ fontFamily: 'Kanit_B', fontSize: 18, color: '#1e293b' }}>
              {c.value} <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'Kanit' }}>{c.unit}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderScoreBar = (label: string, score: number, max: number) => {
    const sc = getScoreColor(score, max)
    const pct = Math.round((score / max) * 100)
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b', width: 90, textAlign: 'right' }}>{label}</span>
        <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: sc.color, transition: 'width 0.5s' }} />
        </div>
        <span style={{ fontFamily: 'Kanit_B', fontSize: 11, color: sc.color, minWidth: 35, textAlign: 'right' }}>{score}/{max}</span>
      </div>
    )
  }

  const renderVendorCard = (v: VendorData, index: number) => {
    const isExpanded = expandedVendor === v.name
    const badge = getScoreBadge(v.scorecard.total)

    return (
      <div key={v.name} style={{
        background: 'white', borderRadius: 14, border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 12, overflow: 'hidden',
        transition: 'box-shadow 0.2s',
      }}>
        {/* Header Row */}
        <div
          onClick={() => setExpandedVendor(isExpanded ? null : v.name)}
          style={{
            display: 'flex', alignItems: 'center', padding: '14px 18px', cursor: 'pointer',
            gap: 12, flexWrap: 'wrap',
            background: isExpanded ? '#fafbff' : 'white',
            borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
          }}
        >
          {/* Rank */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: index < 3 ? '#fef9c3' : '#f1f5f9',
            fontFamily: 'Kanit_B', fontSize: 13,
            color: index < 3 ? '#b45309' : '#64748b',
          }}>
            {index + 1}
          </div>

          {/* Name */}
          <div style={{ flex: 1, minWidth: 150 }}>
            <div style={{ fontFamily: 'Kanit_B', fontSize: 14, color: '#1e293b' }}>{v.name}</div>
            <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8' }}>
              {v.code ? `รหัส: ${v.code}` : ''} {v.skuCount} SKU | {v.receiveCount} ใบรับ
            </div>
          </div>

          {/* Key Metrics */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>ยอดซื้อ</div>
              <div style={{ fontFamily: 'Kanit_B', fontSize: 14, color: '#1e293b' }}>฿{fmt(v.totalPurchase, 0)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>สัดส่วน</div>
              <div style={{ fontFamily: 'Kanit_B', fontSize: 14, color: '#6366f1' }}>{v.sharePercent}%</div>
            </div>
            {v.growth !== null && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>เทียบเดือนก่อน</div>
                <div style={{
                  fontFamily: 'Kanit_B', fontSize: 13, display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center',
                  color: v.growth >= 0 ? '#147F56' : '#dc2626',
                }}>
                  {v.growth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {v.growth >= 0 ? '+' : ''}{v.growth}%
                </div>
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>Margin</div>
              <div style={{ fontFamily: 'Kanit_B', fontSize: 14, color: v.avgMargin >= 15 ? '#147F56' : '#dc2626' }}>{v.avgMargin}%</div>
            </div>

            {/* Score Badge */}
            <div style={{
              padding: '4px 12px', borderRadius: 20, background: badge.bg,
              fontFamily: 'Kanit_B', fontSize: 12, color: badge.color,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {badge.icon} {v.scorecard.total}/100
            </div>

            {isExpanded ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
          </div>
        </div>

        {/* Expanded Detail */}
        {isExpanded && (
          <div style={{ padding: '16px 18px' }}>
            {/* Section Tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { key: 'overview', label: 'ภาพรวม', icon: <BarChart3 size={13} /> },
                { key: 'items', label: 'รายการสินค้า', icon: <Package size={13} /> },
                { key: 'delivery', label: 'การส่งมอบ', icon: <Truck size={13} /> },
                { key: 'expiry', label: 'หมดอายุ', icon: <AlertTriangle size={13} /> },
                { key: 'scorecard', label: 'Scorecard', icon: <Star size={13} /> },
              ].map(s => (
                <button key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px',
                    borderRadius: 8, border: activeSection === s.key ? '1px solid #6366f1' : '1px solid #e2e8f0',
                    background: activeSection === s.key ? '#eef2ff' : 'white',
                    color: activeSection === s.key ? '#4f46e5' : '#64748b',
                    fontFamily: 'Kanit', fontSize: 11.5, cursor: 'pointer',
                  }}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            {activeSection === 'overview' && renderOverview(v)}
            {activeSection === 'items' && renderItems(v)}
            {activeSection === 'delivery' && renderDelivery(v)}
            {activeSection === 'expiry' && renderExpiry(v)}
            {activeSection === 'scorecard' && renderScorecard(v)}
          </div>
        )}
      </div>
    )
  }

  const renderOverview = (v: VendorData) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
      {/* Purchase Summary */}
      <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, border: '1px solid #e2e8f0' }}>
        <div style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#475569', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <DollarSign size={14} /> สรุปยอดซื้อ
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 11.5, color: '#64748b' }}>ยอดซื้อรวม</span>
            <span style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#1e293b' }}>฿{fmt(v.totalPurchase, 1)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 11.5, color: '#64748b' }}>ส่วนลดรวม</span>
            <span style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#2A6AAA' }}>฿{fmt(v.totalDiscount, 1)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 11.5, color: '#64748b' }}>ภาษี VAT</span>
            <span style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#1e293b' }}>฿{fmt(v.totalVat, 1)}</span>
          </div>
          {v.prevTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 6 }}>
              <span style={{ fontFamily: 'Kanit', fontSize: 11.5, color: '#64748b' }}>เดือนก่อน</span>
              <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#94a3b8' }}>฿{fmt(v.prevTotal, 1)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment */}
      <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, border: '1px solid #e2e8f0' }}>
        <div style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#475569', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CreditCard size={14} /> การชำระเงิน
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 11.5, color: '#64748b' }}>ยอดค้างชำระ</span>
            <span style={{ fontFamily: 'Kanit_B', fontSize: 12, color: v.unpaidAmount > 0 ? '#dc2626' : '#147F56' }}>฿{fmt(v.unpaidAmount, 1)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 11.5, color: '#64748b' }}>ใบค้างชำระ</span>
            <span style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#1e293b' }}>{v.unpaidCount} ใบ</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 6 }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 11.5, color: '#64748b' }}>ใบลดหนี้</span>
            <span style={{ fontFamily: 'Kanit_B', fontSize: 12, color: v.creditNoteCount > 0 ? '#d97706' : '#1e293b' }}>{v.creditNoteCount} ใบ (฿{fmt(v.creditNoteTotal, 1)})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 11.5, color: '#64748b' }}>ใบเพิ่มหนี้</span>
            <span style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#1e293b' }}>{v.debitNoteCount} ใบ (฿{fmt(v.debitNoteTotal, 1)})</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, border: '1px solid #e2e8f0' }}>
        <div style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#475569', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <BarChart3 size={14} /> สถิติสำคัญ
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 11.5, color: '#64748b' }}>จำนวน SKU</span>
            <span style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#1e293b' }}>{v.skuCount} รายการ</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 11.5, color: '#64748b' }}>Margin เฉลี่ย</span>
            <span style={{ fontFamily: 'Kanit_B', fontSize: 12, color: v.avgMargin >= 15 ? '#147F56' : '#dc2626' }}>{v.avgMargin}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 11.5, color: '#64748b' }}>Lead Time เฉลี่ย</span>
            <span style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#1e293b' }}>{v.avgLeadtime ?? '-'} วัน</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 11.5, color: '#64748b' }}>ส่งตรงเวลา</span>
            <span style={{ fontFamily: 'Kanit_B', fontSize: 12, color: (v.onTimeRate ?? 0) >= 80 ? '#147F56' : '#d97706' }}>{v.onTimeRate ?? '-'}%</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderItems = (v: VendorData) => (
    <div>
      {/* Top Purchased */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'Kanit_B', fontSize: 12.5, color: '#1e293b', marginBottom: 8 }}>Top สินค้าที่ซื้อมากที่สุด</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={thStyle}>#</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>รหัส</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>สินค้า</th>
                <th style={thStyle}>จำนวนซื้อ</th>
                <th style={thStyle}>ต้นทุน</th>
                <th style={thStyle}>ราคาขาย</th>
                <th style={thStyle}>Margin</th>
                <th style={thStyle}>ยอดรวม</th>
              </tr>
            </thead>
            <tbody>
              {v.topPurchased.map((item: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={tdStyle}>{i + 1}</td>
                  <td style={{ ...tdStyle, textAlign: 'left' }}>{item.itemcode}</td>
                  <td style={{ ...tdStyle, textAlign: 'left', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.itemName}</td>
                  <td style={tdStyle}>{fmt(item.qty)}</td>
                  <td style={tdStyle}>฿{fmt(item.cost, 1)}</td>
                  <td style={tdStyle}>฿{fmt(item.sellingPrice, 1)}</td>
                  <td style={{ ...tdStyle, color: item.margin >= 15 ? '#147F56' : '#dc2626', fontFamily: 'Kanit_B' }}>{item.margin}%</td>
                  <td style={tdStyle}>฿{fmt(item.totalcost, 1)}</td>
                </tr>
              ))}
              {v.topPurchased.length === 0 && (
                <tr><td colSpan={8} style={{ ...tdStyle, color: '#94a3b8', textAlign: 'center' }}>ไม่มีข้อมูล</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Margin Items */}
      {v.lowMarginItems.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'Kanit_B', fontSize: 12.5, color: '#dc2626', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={14} /> สินค้า Margin ต่ำ (&lt;15%) - ควรเจรจาราคา
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#fef2f2' }}>
                  <th style={thStyle}>#</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>รหัส</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>สินค้า</th>
                  <th style={thStyle}>ต้นทุน</th>
                  <th style={thStyle}>ราคาขาย</th>
                  <th style={thStyle}>Margin</th>
                </tr>
              </thead>
              <tbody>
                {v.lowMarginItems.map((item: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #fecaca' }}>
                    <td style={tdStyle}>{i + 1}</td>
                    <td style={{ ...tdStyle, textAlign: 'left' }}>{item.itemcode}</td>
                    <td style={{ ...tdStyle, textAlign: 'left' }}>{item.itemName}</td>
                    <td style={tdStyle}>฿{fmt(item.cost, 1)}</td>
                    <td style={tdStyle}>฿{fmt(item.sellingPrice, 1)}</td>
                    <td style={{ ...tdStyle, color: '#dc2626', fontFamily: 'Kanit_B' }}>{item.margin}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Price Changes */}
      {v.priceChanges.length > 0 && (
        <div>
          <div style={{ fontFamily: 'Kanit_B', fontSize: 12.5, color: '#d97706', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={14} /> สินค้าที่ราคาทุนเปลี่ยนแปลง
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#fffbeb' }}>
                  <th style={thStyle}>#</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>สินค้า</th>
                  <th style={thStyle}>ราคาเดิม</th>
                  <th style={thStyle}>ราคาใหม่</th>
                  <th style={thStyle}>เปลี่ยนแปลง</th>
                </tr>
              </thead>
              <tbody>
                {v.priceChanges.map((item: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #fef3c7' }}>
                    <td style={tdStyle}>{i + 1}</td>
                    <td style={{ ...tdStyle, textAlign: 'left' }}>{item.itemName}</td>
                    <td style={tdStyle}>฿{fmt(item.prevCost, 1)}</td>
                    <td style={tdStyle}>฿{fmt(item.cost, 1)}</td>
                    <td style={{ ...tdStyle, color: item.costChange > 0 ? '#dc2626' : '#147F56', fontFamily: 'Kanit_B' }}>
                      {item.costChange > 0 ? '+' : ''}{fmt(item.costChange, 1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )

  const renderDelivery = (v: VendorData) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
      <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
        <Truck size={24} style={{ color: '#6366f1', margin: '0 auto 8px' }} />
        <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8' }}>Lead Time ตั้งค่า</div>
        <div style={{ fontFamily: 'Kanit_B', fontSize: 22, color: '#1e293b' }}>{v.leadtimeSetting || '-'} <span style={{ fontSize: 12 }}>วัน</span></div>
      </div>
      <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
        <Clock size={24} style={{ color: '#2A6AAA', margin: '0 auto 8px' }} />
        <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8' }}>Lead Time เฉลี่ยจริง</div>
        <div style={{ fontFamily: 'Kanit_B', fontSize: 22, color: '#1e293b' }}>{v.avgLeadtime ?? '-'} <span style={{ fontSize: 12 }}>วัน</span></div>
      </div>
      <div style={{ background: v.onTimeRate !== null && v.onTimeRate >= 80 ? '#EDF9F3' : '#fef2f2', borderRadius: 10, padding: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
        <ShieldCheck size={24} style={{ color: (v.onTimeRate ?? 0) >= 80 ? '#147F56' : '#dc2626', margin: '0 auto 8px' }} />
        <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8' }}>ส่งตรงเวลา</div>
        <div style={{ fontFamily: 'Kanit_B', fontSize: 22, color: (v.onTimeRate ?? 0) >= 80 ? '#147F56' : '#dc2626' }}>{v.onTimeRate ?? '-'}%</div>
      </div>
      <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
        <FileText size={24} style={{ color: '#7c3aed', margin: '0 auto 8px' }} />
        <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8' }}>จำนวนการส่งมอบ</div>
        <div style={{ fontFamily: 'Kanit_B', fontSize: 22, color: '#1e293b' }}>{v.deliveryCount} <span style={{ fontSize: 12 }}>ครั้ง</span></div>
      </div>
    </div>
  )

  const renderExpiry = (v: VendorData) => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#fef2f2', borderRadius: 10, padding: 12, textAlign: 'center', border: '1px solid #fecaca' }}>
          <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#dc2626' }}>หมดอายุแล้ว</div>
          <div style={{ fontFamily: 'Kanit_B', fontSize: 20, color: '#dc2626' }}>{v.expiryExpiredCount}</div>
        </div>
        <div style={{ background: '#fff7ed', borderRadius: 10, padding: 12, textAlign: 'center', border: '1px solid #fed7aa' }}>
          <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#ea580c' }}>ภายใน 90 วัน</div>
          <div style={{ fontFamily: 'Kanit_B', fontSize: 20, color: '#ea580c' }}>{v.expiry90Count}</div>
        </div>
        <div style={{ background: '#fffbeb', borderRadius: 10, padding: 12, textAlign: 'center', border: '1px solid #fde68a' }}>
          <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#d97706' }}>ภายใน 180 วัน</div>
          <div style={{ fontFamily: 'Kanit_B', fontSize: 20, color: '#d97706' }}>{v.expiry180Count}</div>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b' }}>มูลค่ารวม</div>
          <div style={{ fontFamily: 'Kanit_B', fontSize: 16, color: '#dc2626' }}>฿{fmt(v.expiryValue, 0)}</div>
        </div>
      </div>

      {v.expiryItems.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#fef2f2' }}>
                <th style={thStyle}>#</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>รหัส</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>สินค้า</th>
                <th style={thStyle}>Lot</th>
                <th style={thStyle}>หมดอายุ</th>
                <th style={thStyle}>เหลือ (วัน)</th>
                <th style={thStyle}>คงเหลือ</th>
                <th style={thStyle}>มูลค่า</th>
              </tr>
            </thead>
            <tbody>
              {v.expiryItems.map((item: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #fecaca' }}>
                  <td style={tdStyle}>{i + 1}</td>
                  <td style={{ ...tdStyle, textAlign: 'left' }}>{item.itemcode}</td>
                  <td style={{ ...tdStyle, textAlign: 'left' }}>{item.itemName}</td>
                  <td style={tdStyle}>{item.lot || '-'}</td>
                  <td style={tdStyle}>{item.dateExp ? new Date(item.dateExp).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' }) : '-'}</td>
                  <td style={{
                    ...tdStyle, fontFamily: 'Kanit_B',
                    color: item.daysLeft <= 0 ? '#dc2626' : item.daysLeft <= 90 ? '#ea580c' : '#d97706',
                  }}>
                    {item.daysLeft <= 0 ? 'หมดอายุ' : `${item.daysLeft} วัน`}
                  </td>
                  <td style={tdStyle}>{fmt(item.balance)}</td>
                  <td style={tdStyle}>฿{fmt(item.value, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const renderScorecard = (v: VendorData) => {
    const badge = getScoreBadge(v.scorecard.total)
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Score Bars */}
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#1e293b', marginBottom: 14 }}>รายละเอียดคะแนน</div>
          {renderScoreBar('ราคา/ส่วนลด', v.scorecard.price, 25)}
          {renderScoreBar('คุณภาพ/Shelf', v.scorecard.quality, 20)}
          {renderScoreBar('ส่งมอบตรงเวลา', v.scorecard.delivery, 20)}
          {renderScoreBar('เงื่อนไขเครดิต', v.scorecard.credit, 15)}
          {renderScoreBar('ความหลากหลาย', v.scorecard.variety, 10)}
          {renderScoreBar('การคืนสินค้า', v.scorecard.returns, 10)}
        </div>

        {/* Total Score */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: badge.bg, borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 40, marginBottom: 4 }}>{badge.icon}</div>
          <div style={{ fontFamily: 'Kanit_B', fontSize: 42, color: badge.color }}>{v.scorecard.total}</div>
          <div style={{ fontFamily: 'Kanit', fontSize: 13, color: '#94a3b8' }}>จาก 100 คะแนน</div>
          <div style={{
            marginTop: 8, padding: '6px 20px', borderRadius: 20,
            background: 'white', fontFamily: 'Kanit_B', fontSize: 14, color: badge.color,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            {badge.label}
          </div>
        </div>
      </div>
    )
  }

  // ==================== PRINT LAYOUT ====================

  const renderPrintContent = () => {
    if (!data) return null
    return (
      <div ref={printRef} style={{ padding: 30, fontFamily: 'Kanit', background: 'white' }}>
        <style>{`@media print { @page { size: A4 landscape; margin: 10mm; } }`}</style>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: 'Kanit_B', fontSize: 18 }}>{storeName || 'ร้านค้า'}</div>
          <div style={{ fontFamily: 'Kanit_B', fontSize: 15, color: '#4f46e5' }}>รายงานวิเคราะห์ผู้ขาย</div>
          <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b' }}>ช่วงเวลา: {periodLabel}</div>
          <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>พิมพ์เมื่อ: {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'ผู้ขาย', value: `${data.summary.totalVendors} ราย` },
            { label: 'ยอดซื้อรวม', value: `฿${fmt(data.summary.grandTotal, 1)}` },
            { label: 'ใบรับ', value: `${data.summary.totalReceive} ใบ` },
            { label: 'ค้างชำระ', value: `฿${fmt(data.summary.totalUnpaid, 1)}` },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '6px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 9, color: '#94a3b8' }}>{s.label}</div>
              <div style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#1e293b' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Vendor Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, marginBottom: 16 }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #6366f1' }}>
              <th style={printTh}>#</th>
              <th style={{ ...printTh, textAlign: 'left' }}>ผู้ขาย</th>
              <th style={printTh}>ยอดซื้อ</th>
              <th style={printTh}>สัดส่วน</th>
              <th style={printTh}>เทียบก่อน</th>
              <th style={printTh}>SKU</th>
              <th style={printTh}>ใบรับ</th>
              <th style={printTh}>Lead Time</th>
              <th style={printTh}>ตรงเวลา</th>
              <th style={printTh}>Margin</th>
              <th style={printTh}>ค้างชำระ</th>
              <th style={printTh}>ลดหนี้</th>
              <th style={printTh}>ใกล้หมดอายุ</th>
              <th style={printTh}>คะแนน</th>
            </tr>
          </thead>
          <tbody>
            {data.vendors.map((v, i) => {
              const badge = getScoreBadge(v.scorecard.total)
              return (
                <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={printTd}>{i + 1}</td>
                  <td style={{ ...printTd, textAlign: 'left', fontFamily: 'Kanit_B' }}>{v.name}</td>
                  <td style={printTd}>฿{fmt(v.totalPurchase, 0)}</td>
                  <td style={printTd}>{v.sharePercent}%</td>
                  <td style={{ ...printTd, color: (v.growth ?? 0) >= 0 ? '#147F56' : '#dc2626' }}>
                    {v.growth !== null ? `${v.growth >= 0 ? '+' : ''}${v.growth}%` : '-'}
                  </td>
                  <td style={printTd}>{v.skuCount}</td>
                  <td style={printTd}>{v.receiveCount}</td>
                  <td style={printTd}>{v.avgLeadtime ?? '-'} วัน</td>
                  <td style={{ ...printTd, color: (v.onTimeRate ?? 0) >= 80 ? '#147F56' : '#dc2626' }}>{v.onTimeRate ?? '-'}%</td>
                  <td style={{ ...printTd, color: v.avgMargin >= 15 ? '#147F56' : '#dc2626' }}>{v.avgMargin}%</td>
                  <td style={{ ...printTd, color: v.unpaidAmount > 0 ? '#dc2626' : '#1e293b' }}>฿{fmt(v.unpaidAmount, 0)}</td>
                  <td style={printTd}>{v.creditNoteCount}</td>
                  <td style={printTd}>{v.expiry90Count + v.expiry180Count}</td>
                  <td style={{ ...printTd, fontFamily: 'Kanit_B', color: badge.color }}>{v.scorecard.total}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Per-vendor detail for top 5 vendors */}
        {data.vendors.slice(0, 5).map((v, vi) => (
          <div key={vi} style={{ pageBreakBefore: vi === 0 ? 'auto' : 'always', marginTop: vi === 0 ? 20 : 0 }}>
            <div style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#4f46e5', marginBottom: 8, borderBottom: '2px solid #6366f1', paddingBottom: 4 }}>
              {vi + 1}. {v.name} — คะแนน {v.scorecard.total}/100
            </div>
            {v.topPurchased.length > 0 && (
              <>
                <div style={{ fontFamily: 'Kanit_B', fontSize: 10, marginBottom: 4, color: '#475569' }}>สินค้าที่ซื้อมากที่สุด</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9, marginBottom: 12 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={printTh}>#</th>
                      <th style={{ ...printTh, textAlign: 'left' }}>รหัส</th>
                      <th style={{ ...printTh, textAlign: 'left' }}>สินค้า</th>
                      <th style={printTh}>จำนวน</th>
                      <th style={printTh}>ต้นทุน</th>
                      <th style={printTh}>ราคาขาย</th>
                      <th style={printTh}>Margin</th>
                      <th style={printTh}>ยอดรวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.topPurchased.map((item: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={printTd}>{i + 1}</td>
                        <td style={{ ...printTd, textAlign: 'left' }}>{item.itemcode}</td>
                        <td style={{ ...printTd, textAlign: 'left' }}>{item.itemName}</td>
                        <td style={printTd}>{fmt(item.qty)}</td>
                        <td style={printTd}>฿{fmt(item.cost, 1)}</td>
                        <td style={printTd}>฿{fmt(item.sellingPrice, 1)}</td>
                        <td style={{ ...printTd, color: item.margin >= 15 ? '#147F56' : '#dc2626' }}>{item.margin}%</td>
                        <td style={printTd}>฿{fmt(item.totalcost, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        ))}
      </div>
    )
  }

  // ==================== MAIN LAYOUT ====================

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)',
        borderRadius: 14, padding: '18px 22px', marginBottom: 16,
        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Building2 size={22} />
          <div>
            <div style={{ fontFamily: 'Kanit_B', fontSize: 16 }}>วิเคราะห์ผู้ขาย</div>
            <div style={{ fontFamily: 'Kanit', fontSize: 11, opacity: 0.8 }}>Vendor Performance Analysis</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExport} disabled={!data}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 8,
              background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
              fontFamily: 'Kanit', fontSize: 12, cursor: data ? 'pointer' : 'not-allowed', opacity: data ? 1 : 0.5,
            }}>
            <Download size={14} /> Excel
          </button>
          <button onClick={() => handlePrint()} disabled={!data}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 8,
              background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
              fontFamily: 'Kanit', fontSize: 12, cursor: data ? 'pointer' : 'not-allowed', opacity: data ? 1 : 0.5,
            }}>
            <Printer size={14} /> พิมพ์รายงาน
          </button>
        </div>
      </div>

      {/* Date Controls */}
      <div style={{
        background: 'white', borderRadius: 12, padding: '14px 18px', marginBottom: 16,
        border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        {/* Mode Toggle */}
        <div style={{ display: 'flex', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <button
            onClick={() => setDateMode('month')}
            style={{
              padding: '6px 14px', fontFamily: 'Kanit', fontSize: 12, border: 'none', cursor: 'pointer',
              background: dateMode === 'month' ? '#4f46e5' : 'white',
              color: dateMode === 'month' ? 'white' : '#64748b',
            }}
          >
            <CalendarDays size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> รายเดือน
          </button>
          <button
            onClick={() => setDateMode('range')}
            style={{
              padding: '6px 14px', fontFamily: 'Kanit', fontSize: 12, border: 'none', cursor: 'pointer',
              background: dateMode === 'range' ? '#4f46e5' : 'white',
              color: dateMode === 'range' ? 'white' : '#64748b',
            }}
          >
            <CalendarRange size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> เลือกช่วง
          </button>
        </div>

        {dateMode === 'month' ? (
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              fontFamily: 'Kanit', fontSize: 13, padding: '6px 12px', borderRadius: 8,
              border: '1px solid #e2e8f0', outline: 'none',
            }}
          />
        ) : (
          <>
            <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b' }}>วันเริ่ม:</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ fontFamily: 'Kanit', fontSize: 13, padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
            <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b' }}>ถึง:</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ fontFamily: 'Kanit', fontSize: 13, padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
          </>
        )}

        <button onClick={handleSearch}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 8,
            background: '#4f46e5', color: 'white', border: 'none', fontFamily: 'Kanit_B', fontSize: 12.5, cursor: 'pointer',
          }}>
          <Search size={14} /> ค้นหา
        </button>

        {/* Search vendor */}
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text" placeholder="ค้นหาผู้ขาย..." value={search} onChange={e => setSearch(e.target.value)}
            style={{
              fontFamily: 'Kanit', fontSize: 12.5, padding: '7px 12px 7px 32px', borderRadius: 8,
              border: '1px solid #e2e8f0', width: 200, outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{
            width: 40, height: 40, border: '4px solid #e2e8f0', borderTop: '4px solid #6366f1',
            borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px',
          }} />
          <div style={{ fontFamily: 'Kanit', fontSize: 13, color: '#94a3b8' }}>กำลังวิเคราะห์ข้อมูล...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && data && renderSummaryCards()}

      {/* Vendor List */}
      {!loading && data && filteredVendors.length > 0 && (
        <div>
          {filteredVendors.map((v, i) => renderVendorCard(v, i))}
        </div>
      )}

      {!loading && data && filteredVendors.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <Building2 size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <div style={{ fontFamily: 'Kanit', fontSize: 14 }}>ไม่พบข้อมูลผู้ขายในช่วงเวลาที่เลือก</div>
        </div>
      )}

      {/* Hidden Print Content */}
      <div style={{ display: 'none' }}>
        {renderPrintContent()}
      </div>
    </div>
  )
}

// Shared styles
const thStyle: React.CSSProperties = {
  fontFamily: 'Kanit_B', fontSize: 11, color: '#475569', padding: '8px 6px',
  textAlign: 'center', borderBottom: '2px solid #e2e8f0',
}

const tdStyle: React.CSSProperties = {
  fontFamily: 'Kanit', fontSize: 11, color: '#1e293b', padding: '7px 6px',
  textAlign: 'center', whiteSpace: 'nowrap',
}

const printTh: React.CSSProperties = {
  fontFamily: 'Kanit_B', fontSize: 9, padding: '5px 4px', textAlign: 'center',
  borderBottom: '1px solid #94a3b8',
}

const printTd: React.CSSProperties = {
  fontFamily: 'Kanit', fontSize: 9, padding: '4px 4px', textAlign: 'center',
}
