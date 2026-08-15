'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
import axios from 'axios'
import {
  ClipboardCheck, Search, Download, Printer, AlertCircle, Clock,
  CalendarRange, CalendarDays, CheckCircle, Users, ChevronDown,
  ChevronUp, UserCheck, BarChart3, Bell
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { getLocalStorageItem } from '@/utils/localStorage'
import { useReactToPrint } from 'react-to-print'

export default function FollowupSummaryTab() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'customer'>('list')
  const printRef = useRef<HTMLDivElement>(null)

  const [dateMode, setDateMode] = useState<'month' | 'range'>('month')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [storeName, setStoreName] = useState('')

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const c = getLocalStorageItem('company_')
        const res = await axios.get(`/api/setting/store/store?company=${c}`)
        if (res.data?.[0]) setStoreName(res.data[0].namestore || '')
      } catch { }
    }
    fetchStore()
  }, [])

  const getDateRange = () => {
    if (dateMode === 'month' && selectedMonth) {
      const [y, m] = selectedMonth.split('-').map(Number)
      const from = new Date(y, m - 1, 1)
      const to = new Date(y, m, 0)
      return { dateFrom: from.toISOString().split('T')[0], dateTo: to.toISOString().split('T')[0] }
    }
    return { dateFrom, dateTo }
  }

  const fetchData = async () => {
    setLoading(true)
    const company = getLocalStorageItem('company_')
    const { dateFrom: df, dateTo: dt } = getDateRange()
    try {
      const res = await axios.get(`/api/sale_cal/followup_summary?company=${company}&startDate=${df}&endDate=${dt}`)
      setData(res.data)
    } catch (e) {
      console.error(e)
      setData(null)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: 'รายงานติดตามผล' })

  const handleExport = () => {
    if (!data) return
    const wb = XLSX.utils.book_new()

    // Summary
    const summaryRows = [
      { 'รายการ': 'ทั้งหมด', 'จำนวน': data.summary.total },
      { 'รายการ': 'เสร็จสิ้น', 'จำนวน': data.summary.completed },
      { 'รายการ': 'รอดำเนินการ', 'จำนวน': data.summary.pending },
      { 'รายการ': 'เลยกำหนด', 'จำนวน': data.summary.overdue },
      { 'รายการ': 'อัตราสำเร็จ %', 'จำนวน': data.summary.completionRate },
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'สรุป')

    // Overdue
    if (data.overdueList?.length > 0) {
      const rows = data.overdueList.map((h: any, i: number) => ({
        '#': i + 1,
        'รหัสลูกค้า': h.code_costomer,
        'ชื่อลูกค้า': h.name_customer,
        'กำหนดติดตาม': h.duedate ? new Date(h.duedate).toLocaleDateString('th-TH') : '',
        'สถานะ': h.statusH,
        'สินค้า': h.drug_name,
        'รายละเอียด': h.follow_detail,
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'เลยกำหนด')
    }

    // Pending
    if (data.pendingList?.length > 0) {
      const rows = data.pendingList.map((h: any, i: number) => ({
        '#': i + 1,
        'รหัสลูกค้า': h.code_costomer,
        'ชื่อลูกค้า': h.name_customer,
        'กำหนดติดตาม': h.duedate ? new Date(h.duedate).toLocaleDateString('th-TH') : '',
        'สถานะ': h.statusH,
        'สินค้า': h.drug_name,
        'รายละเอียด': h.follow_detail,
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'รอดำเนินการ')
    }

    // By customer
    if (data.byCustomer?.length > 0) {
      const rows = data.byCustomer.map((c: any, i: number) => ({
        '#': i + 1,
        'รหัสลูกค้า': c.code,
        'ชื่อลูกค้า': c.name,
        'ทั้งหมด': c.total,
        'เลยกำหนด': c.overdue,
        'รอดำเนินการ': c.pending,
        'เสร็จสิ้น': c.completed,
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'ตามลูกค้า')
    }

    XLSX.writeFile(wb, `รายงานติดตามผล_${selectedMonth || dateFrom}.xlsx`)
  }

  const currentList = useMemo(() => {
    if (!data) return []
    let list: any[] = []
    if (filterStatus === 'overdue') list = data.overdueList || []
    else if (filterStatus === 'pending') list = data.pendingList || []
    else if (filterStatus === 'completed') list = data.completedList || []
    else list = [...(data.overdueList || []), ...(data.pendingList || []), ...(data.completedList || [])]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((h: any) =>
        h.name_customer?.toLowerCase().includes(q) ||
        h.code_costomer?.toLowerCase().includes(q) ||
        h.drug_name?.toLowerCase().includes(q)
      )
    }
    return list
  }, [data, filterStatus, search])

  const getStatusBadge = (h: any) => {
    const now = new Date()
    if (h.statusH === 'เสร็จสิ้น') return { text: 'เสร็จสิ้น', bg: '#F3F8FC', color: '#2A6AAA', border: '#CCDFF1' }
    if (h.duedate && new Date(h.duedate) < now) return { text: 'เลยกำหนด', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }
    return { text: 'รอดำเนินการ', bg: '#F3F8FC', color: '#2A6AAA', border: '#CCDFF1' }
  }

  const getDaysOverdue = (duedate: any) => {
    if (!duedate) return 0
    const d = new Date(duedate)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  return (
    <div ref={printRef} style={{ fontFamily: 'Kanit' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #9333ea 0%, #a855f7 50%, #c084fc 100%)',
        borderRadius: '16px', padding: '20px 24px', color: 'white', marginBottom: '12px',
        boxShadow: '0 4px 15px rgba(147,51,234,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontFamily: 'Kanit_B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardCheck size={24} /> รายงานติดตามผล
            </h2>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '13px' }}>Follow-up Summary Report {storeName && `- ${storeName}`}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
              <button onClick={() => setDateMode('month')} style={{
                padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'Kanit_B',
                background: dateMode === 'month' ? 'white' : 'transparent', color: dateMode === 'month' ? '#9333ea' : 'white',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}><CalendarDays size={14} /> เดือน</button>
              <button onClick={() => setDateMode('range')} style={{
                padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'Kanit_B',
                background: dateMode === 'range' ? 'white' : 'transparent', color: dateMode === 'range' ? '#9333ea' : 'white',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}><CalendarRange size={14} /> ช่วงเวลา</button>
            </div>
            {dateMode === 'month' ? (
              <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '13px', fontFamily: 'Kanit' }} />
            ) : (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', fontSize: '12px', fontFamily: 'Kanit' }} />
                <span style={{ color: 'white', fontSize: '12px' }}>ถึง</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', fontSize: '12px', fontFamily: 'Kanit' }} />
              </div>
            )}
            <button onClick={fetchData} style={{
              padding: '6px 16px', background: 'white', color: '#9333ea', border: 'none', borderRadius: '8px',
              fontFamily: 'Kanit_B', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
            }}><Search size={14} /> ค้นหา</button>
            <button onClick={() => handlePrint()} style={{
              padding: '6px 12px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontFamily: 'Kanit_B'
            }}><Printer size={14} /> พิมพ์</button>
            <button onClick={handleExport} style={{
              padding: '6px 12px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontFamily: 'Kanit_B'
            }}><Download size={14} /> Excel</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <div className="spinner-border text-primary" />
          <p style={{ marginTop: '12px', fontFamily: 'Kanit' }}>กำลังโหลดข้อมูล...</p>
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            {[
              { icon: <BarChart3 size={20} />, label: 'ทั้งหมด', value: data.summary.total, color: '#7c3aed', bg: '#f5f3ff' },
              { icon: <AlertCircle size={20} />, label: 'เลยกำหนด', value: data.summary.overdue, color: '#dc2626', bg: '#fef2f2' },
              { icon: <Clock size={20} />, label: 'รอดำเนินการ', value: data.summary.pending, color: '#2A6AAA', bg: '#F3F8FC' },
              { icon: <CheckCircle size={20} />, label: 'เสร็จสิ้น', value: data.summary.completed, color: '#147F56', bg: '#EDF9F3' },
              { icon: <UserCheck size={20} />, label: 'อัตราสำเร็จ', value: `${data.summary.completionRate}%`, color: data.summary.completionRate >= 80 ? '#147F56' : data.summary.completionRate >= 50 ? '#ea580c' : '#dc2626', bg: data.summary.completionRate >= 80 ? '#EDF9F3' : data.summary.completionRate >= 50 ? '#fff7ed' : '#fef2f2' },
              { icon: <Users size={20} />, label: 'ลูกค้า', value: data.summary.uniqueCustomers, color: '#0891b2', bg: '#ecfeff' },
            ].map((card, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ background: card.bg, borderRadius: '8px', padding: '6px', color: card.color }}>{card.icon}</div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{card.label}</span>
                </div>
                <div style={{ fontSize: '18px', fontFamily: 'Kanit_B', color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Completion bar */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'Kanit_B', color: '#334155' }}>ความคืบหน้าการติดตาม</span>
              <span style={{ color: '#64748b' }}>{data.summary.completed}/{data.summary.total}</span>
            </div>
            <div style={{ height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
              {data.summary.total > 0 && (
                <>
                  <div style={{ width: `${(data.summary.completed / data.summary.total) * 100}%`, background: '#1F9D6B', height: '100%' }} />
                  <div style={{ width: `${(data.summary.pending / data.summary.total) * 100}%`, background: '#3E86C7', height: '100%' }} />
                  <div style={{ width: `${(data.summary.overdue / data.summary.total) * 100}%`, background: '#ef4444', height: '100%' }} />
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3E86C7' }} /> เสร็จสิ้น
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3E86C7' }} /> รอดำเนินการ
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} /> เลยกำหนด
              </span>
            </div>
          </div>

          {/* Filters */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '12px 16px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
              <Search size={16} color="#94a3b8" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อลูกค้า, สินค้า..."
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', fontFamily: 'Kanit', background: 'transparent' }} />
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[
                { key: 'all', label: 'ทั้งหมด', color: '#475569' },
                { key: 'overdue', label: 'เลยกำหนด', color: '#dc2626' },
                { key: 'pending', label: 'รอดำเนินการ', color: '#2A6AAA' },
                { key: 'completed', label: 'เสร็จสิ้น', color: '#147F56' },
              ].map(f => (
                <button key={f.key} onClick={() => setFilterStatus(f.key)}
                  style={{
                    padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontFamily: 'Kanit_B',
                    border: filterStatus === f.key ? `1px solid ${f.color}` : '1px solid #e2e8f0',
                    background: filterStatus === f.key ? f.color : 'white',
                    color: filterStatus === f.key ? 'white' : f.color,
                    cursor: 'pointer',
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => setViewMode('list')} style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontFamily: 'Kanit_B',
                border: viewMode === 'list' ? '1px solid #9333ea' : '1px solid #e2e8f0',
                background: viewMode === 'list' ? '#f5f3ff' : 'white', color: viewMode === 'list' ? '#9333ea' : '#64748b',
                cursor: 'pointer',
              }}>รายการ</button>
              <button onClick={() => setViewMode('customer')} style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontFamily: 'Kanit_B',
                border: viewMode === 'customer' ? '1px solid #9333ea' : '1px solid #e2e8f0',
                background: viewMode === 'customer' ? '#f5f3ff' : 'white', color: viewMode === 'customer' ? '#9333ea' : '#64748b',
                cursor: 'pointer',
              }}>ตามลูกค้า</button>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{viewMode === 'list' ? currentList.length : (data.byCustomer?.length || 0)} รายการ</span>
          </div>

          {viewMode === 'list' ? (
            /* Follow-up List */
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <div style={{ overflowX: 'auto', maxHeight: '50vh' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontFamily: 'Kanit_B', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>ลูกค้า</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontFamily: 'Kanit_B', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>สินค้า/รายการ</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'Kanit_B', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>กำหนดวัน</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'Kanit_B', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>สถานะ</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>เลย (วัน)</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontFamily: 'Kanit_B', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>รายละเอียด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentList.map((h: any, i: number) => {
                      const badge = getStatusBadge(h)
                      const daysOver = getDaysOverdue(h.duedate)
                      return (
                        <tr key={i} style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: badge.text === 'เลยกำหนด' ? '#fef2f2' : 'transparent',
                        }}>
                          <td style={{ padding: '8px' }}>
                            <div style={{ fontFamily: 'Kanit_B', color: '#0f172a', fontSize: '12px' }}>{h.name_customer || '-'}</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{h.code_costomer}</div>
                          </td>
                          <td style={{ padding: '8px', color: '#475569', fontSize: '12px' }}>{h.drug_name || '-'}</td>
                          <td style={{ padding: '8px', textAlign: 'center', fontSize: '11px', color: '#334155' }}>
                            {h.duedate ? new Date(h.duedate).toLocaleDateString('th-TH') : '-'}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <span style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontFamily: 'Kanit_B' }}>
                              {badge.text}
                            </span>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: daysOver > 0 ? '#dc2626' : '#64748b' }}>
                            {daysOver > 0 ? daysOver : '-'}
                          </td>
                          <td style={{ padding: '8px', fontSize: '11px', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {h.follow_detail || h.formular || '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* By Customer View */
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <div style={{ overflowX: 'auto', maxHeight: '50vh' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontFamily: 'Kanit_B', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>รหัส</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontFamily: 'Kanit_B', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>ชื่อลูกค้า</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>ทั้งหมด</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#dc2626', borderBottom: '2px solid #e2e8f0' }}>เลยกำหนด</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#2A6AAA', borderBottom: '2px solid #e2e8f0' }}>รอดำเนินการ</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#2A6AAA', borderBottom: '2px solid #e2e8f0' }}>เสร็จสิ้น</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontFamily: 'Kanit_B', color: '#475569', borderBottom: '2px solid #e2e8f0', width: '150px' }}>ความคืบหน้า</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byCustomer?.map((c: any, i: number) => {
                      const pct = c.total > 0 ? (c.completed / c.total) * 100 : 0
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: c.overdue > 0 ? '#fef2f2' : 'transparent' }}>
                          <td style={{ padding: '8px', fontSize: '11px', color: '#64748b' }}>{c.code}</td>
                          <td style={{ padding: '8px', fontFamily: 'Kanit_B', color: '#0f172a' }}>{c.name}</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#7c3aed' }}>{c.total}</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: c.overdue > 0 ? '#dc2626' : '#94a3b8' }}>{c.overdue}</td>
                          <td style={{ padding: '8px', textAlign: 'right', color: '#2A6AAA' }}>{c.pending}</td>
                          <td style={{ padding: '8px', textAlign: 'right', color: '#147F56' }}>{c.completed}</td>
                          <td style={{ padding: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? '#1F9D6B' : pct >= 50 ? '#f59e0b' : '#ef4444', borderRadius: '4px' }} />
                              </div>
                              <span style={{ fontSize: '10px', color: '#64748b', minWidth: '28px' }}>{Math.round(pct)}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Daily Timeline */}
          {data.daily?.length > 0 && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginTop: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '13px', fontFamily: 'Kanit_B', color: '#334155', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bell size={16} color="#9333ea" /> ไทม์ไลน์กำหนดติดตาม
              </h4>
              <div style={{ overflowX: 'auto', maxHeight: '25vh' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left', fontFamily: 'Kanit_B', borderBottom: '1px solid #e2e8f0' }}>วันที่</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'Kanit_B', borderBottom: '1px solid #e2e8f0' }}>กำหนด</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#2A6AAA', borderBottom: '1px solid #e2e8f0' }}>เสร็จสิ้น</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#dc2626', borderBottom: '1px solid #e2e8f0' }}>เลยกำหนด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.daily.map((d: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 8px', color: '#334155' }}>{d.date}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#7c3aed' }}>{d.due}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: '#147F56' }}>{d.completed}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: d.overdue > 0 ? '#dc2626' : '#94a3b8', fontFamily: d.overdue > 0 ? 'Kanit_B' : 'Kanit' }}>{d.overdue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          <ClipboardCheck size={48} strokeWidth={1} />
          <p style={{ marginTop: '12px' }}>กรุณาเลือกช่วงเวลาแล้วกด "ค้นหา"</p>
        </div>
      )}
    </div>
  )
}
