'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
import axios from 'axios'
import {
  AlertTriangle, Search, Download, Printer, Package, ShieldAlert,
  ArrowDown, ChevronDown, ChevronUp, Box, TrendingDown, ShoppingCart
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { getLocalStorageItem } from '@/utils/localStorage'
import { useReactToPrint } from 'react-to-print'

export default function StockAlertTab() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const [sortField, setSortField] = useState<string>('alertLevel')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const printRef = useRef<HTMLDivElement>(null)
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

  const fetchData = async () => {
    setLoading(true)
    const company = getLocalStorageItem('company_')
    try {
      const res = await axios.get(`/api/sale_cal/stock_alert?company=${company}`)
      setData(res.data)
    } catch (e) {
      console.error(e)
      setData(null)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const filteredAlerts = useMemo(() => {
    if (!data?.alerts) return []
    let list = data.alerts
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((a: any) => a.name?.toLowerCase().includes(q) || a.code?.toLowerCase().includes(q))
    }
    if (filterLevel !== 'all') list = list.filter((a: any) => a.alertLevel === filterLevel)
    if (filterGroup !== 'all') list = list.filter((a: any) => (a.group || 'ไม่ระบุ') === filterGroup)

    const priority: Record<string, number> = { out: 0, rop: 1, min: 2 }
    list.sort((a: any, b: any) => {
      if (sortField === 'alertLevel') {
        const d = (priority[a.alertLevel] ?? 9) - (priority[b.alertLevel] ?? 9)
        return sortDir === 'asc' ? d : -d
      }
      const av = a[sortField] ?? 0, bv = b[sortField] ?? 0
      return sortDir === 'desc' ? bv - av : av - bv
    })
    return list
  }, [data, search, filterLevel, filterGroup, sortField, sortDir])

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortField(field); setSortDir('desc') }
  }

  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: 'รายงานสินค้าต่ำกว่า Min/ROP' })

  const handleExport = () => {
    if (!data?.alerts) return
    const rows = data.alerts.map((a: any, i: number) => ({
      '#': i + 1,
      'รหัส': a.code,
      'ชื่อสินค้า': a.name,
      'หน่วย': a.unit,
      'กลุ่ม': a.group,
      'สถานะ': a.alertLevel === 'out' ? 'หมดสต็อก' : a.alertLevel === 'rop' ? 'ต่ำกว่า ROP' : 'ต่ำกว่า Min',
      'คงเหลือ': a.balance,
      'ROP': a.rop,
      'Min': a.min,
      'Max': a.max,
      'ควรสั่ง': a.orderQty,
      'ราคาทุน': a.cost,
      'มูลค่าสั่งซื้อ': Math.round(a.orderQty * a.cost),
      'จำนวน Lot': a.lots,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Alert')
    XLSX.writeFile(wb, `สินค้าต่ำกว่า_Min_ROP_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const fmt = (n: number) => Math.round(n || 0).toLocaleString('th-TH')

  const alertLabel = (level: string) => {
    if (level === 'out') return { text: 'หมด', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }
    if (level === 'rop') return { text: 'ต่ำ ROP', bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' }
    return { text: 'ต่ำ Min', bg: '#fefce8', color: '#ca8a04', border: '#fef08a' }
  }

  return (
    <div ref={printRef} style={{ fontFamily: 'Kanit' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
        borderRadius: '16px', padding: '20px 24px', color: 'white', marginBottom: '12px',
        boxShadow: '0 4px 15px rgba(220,38,38,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontFamily: 'Kanit_B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={24} /> สินค้าต่ำกว่า Min/ROP
            </h2>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '13px' }}>Stock Alert Report {storeName && `- ${storeName}`}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={fetchData} style={{
              padding: '6px 16px', background: 'white', color: '#dc2626', border: 'none', borderRadius: '8px',
              fontFamily: 'Kanit_B', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
            }}><Search size={14} /> รีเฟรช</button>
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
          <div className="spinner-border text-danger" />
          <p style={{ marginTop: '12px', fontFamily: 'Kanit' }}>กำลังโหลดข้อมูล...</p>
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            {[
              { icon: <AlertTriangle size={20} />, label: 'แจ้งเตือนทั้งหมด', value: data.summary.totalAlerts, color: '#dc2626', bg: '#fef2f2' },
              { icon: <Box size={20} />, label: 'หมดสต็อก', value: data.summary.outCount, color: '#991b1b', bg: '#fee2e2' },
              { icon: <TrendingDown size={20} />, label: 'ต่ำกว่า ROP', value: data.summary.ropCount, color: '#ea580c', bg: '#fff7ed' },
              { icon: <ArrowDown size={20} />, label: 'ต่ำกว่า Min', value: data.summary.minCount, color: '#ca8a04', bg: '#fefce8' },
              { icon: <ShoppingCart size={20} />, label: 'มูลค่าสั่งซื้อ', value: `฿${fmt(data.summary.totalOrderValue)}`, color: '#7c3aed', bg: '#f5f3ff' },
              { icon: <Package size={20} />, label: 'สินค้าทั้งหมด', value: fmt(data.summary.totalProducts), color: '#2A6AAA', bg: '#F3F8FC' },
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

          {/* Group Breakdown */}
          {data.groups?.length > 0 && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '13px', fontFamily: 'Kanit_B', color: '#334155', margin: '0 0 8px' }}>กลุ่มสินค้าที่ต้องสั่งซื้อ</h4>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {data.groups.map((g: any, i: number) => (
                  <button key={i} onClick={() => setFilterGroup(filterGroup === g.group ? 'all' : g.group)}
                    style={{
                      padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontFamily: 'Kanit',
                      border: filterGroup === g.group ? '1px solid #dc2626' : '1px solid #e2e8f0',
                      background: filterGroup === g.group ? '#fef2f2' : '#f8fafc',
                      color: filterGroup === g.group ? '#dc2626' : '#64748b',
                      cursor: 'pointer',
                    }}>
                    {g.group} ({g.count})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '12px 16px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
              <Search size={16} color="#94a3b8" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อหรือรหัสสินค้า..."
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', fontFamily: 'Kanit', background: 'transparent' }} />
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[
                { key: 'all', label: 'ทั้งหมด', color: '#475569' },
                { key: 'out', label: 'หมดสต็อก', color: '#dc2626' },
                { key: 'rop', label: 'ต่ำ ROP', color: '#ea580c' },
                { key: 'min', label: 'ต่ำ Min', color: '#ca8a04' },
              ].map(f => (
                <button key={f.key} onClick={() => setFilterLevel(f.key)}
                  style={{
                    padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontFamily: 'Kanit_B',
                    border: filterLevel === f.key ? `1px solid ${f.color}` : '1px solid #e2e8f0',
                    background: filterLevel === f.key ? f.color : 'white',
                    color: filterLevel === f.key ? 'white' : f.color,
                    cursor: 'pointer',
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{filteredAlerts.length} รายการ</span>
          </div>

          {/* Alert Table */}
          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            <div style={{ overflowX: 'auto', maxHeight: '55vh' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                    {[
                      { key: 'code', label: 'รหัส', w: '90px', align: 'left' },
                      { key: 'name', label: 'ชื่อสินค้า', w: '220px', align: 'left' },
                      { key: 'alertLevel', label: 'สถานะ', w: '80px', align: 'center' },
                      { key: 'balance', label: 'คงเหลือ', w: '80px', align: 'right' },
                      { key: 'rop', label: 'ROP', w: '60px', align: 'right' },
                      { key: 'min', label: 'Min', w: '60px', align: 'right' },
                      { key: 'max', label: 'Max', w: '60px', align: 'right' },
                      { key: 'orderQty', label: 'ควรสั่ง', w: '80px', align: 'right' },
                      { key: 'stockValue', label: 'มูลค่าคงเหลือ', w: '100px', align: 'right' },
                      { key: 'group', label: 'กลุ่ม', w: '100px', align: 'left' },
                    ].map(col => (
                      <th key={col.key} onClick={() => handleSort(col.key)} style={{
                        padding: '10px 8px', textAlign: col.align as any, fontFamily: 'Kanit_B', color: '#475569',
                        cursor: 'pointer', width: col.w, borderBottom: '2px solid #e2e8f0', userSelect: 'none', whiteSpace: 'nowrap',
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start' }}>
                          {col.label}
                          {sortField === col.key && (sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((a: any, i: number) => {
                    const al = alertLabel(a.alertLevel)
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '8px', fontFamily: 'Kanit', color: '#334155', fontSize: '11px' }}>{a.code}</td>
                        <td style={{ padding: '8px', fontFamily: 'Kanit_B', color: '#0f172a' }}>{a.name}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <span style={{ background: al.bg, color: al.color, border: `1px solid ${al.border}`, padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontFamily: 'Kanit_B' }}>
                            {al.text}
                          </span>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: a.balance <= 0 ? '#dc2626' : '#ea580c' }}>
                          {a.balance} {a.unit}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#64748b' }}>{a.rop}</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#64748b' }}>{a.min}</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#64748b' }}>{a.max}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#7c3aed' }}>{a.orderQty} {a.unit}</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#475569' }}>฿{fmt(a.stockValue)}</td>
                        <td style={{ padding: '8px', fontSize: '11px', color: '#64748b' }}>{a.group}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          <ShieldAlert size={48} strokeWidth={1} />
          <p style={{ marginTop: '12px' }}>กำลังโหลดข้อมูล...</p>
        </div>
      )}
    </div>
  )
}
