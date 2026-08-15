'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
import axios from 'axios'
import {
  Users, Search, Download, Printer, TrendingUp, Crown, UserCheck,
  UserX, CalendarRange, CalendarDays, BarChart3, ShoppingBag, Heart,
  Star, ChevronDown, ChevronUp
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { getLocalStorageItem } from '@/utils/localStorage'
import { useReactToPrint } from 'react-to-print'

export default function CustomerAnalysisTab() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<string>('revenue')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
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
      const res = await axios.get(`/api/sale_cal/customer_analysis?company=${company}&startDate=${df}&endDate=${dt}`)
      setData(res.data)
    } catch (e) {
      console.error(e)
      setData(null)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const filteredCustomers = useMemo(() => {
    if (!data?.customers) return []
    let list = data.customers
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c: any) => c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q))
    }
    list.sort((a: any, b: any) => {
      const av = a[sortField] ?? 0, bv = b[sortField] ?? 0
      return sortDir === 'desc' ? bv - av : av - bv
    })
    return list
  }, [data, search, sortField, sortDir])

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortField(field); setSortDir('desc') }
  }

  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: 'รายงานวิเคราะห์ลูกค้า' })

  const handleExport = () => {
    if (!data?.customers) return
    const rows = data.customers.map((c: any, i: number) => ({
      '#': i + 1,
      'รหัส': c.code,
      'ชื่อลูกค้า': c.name,
      'จำนวนบิล': c.bills,
      'ยอดซื้อรวม': c.revenue,
      'ส่วนลด': c.discount,
      'Reward ใช้': c.reward,
      'เพศ': c.sex,
      'อายุ': c.age,
      'คะแนนสะสม': c.point,
      'ระดับราคา': c.levelPrice,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Customer Analysis')
    XLSX.writeFile(wb, `วิเคราะห์ลูกค้า_${selectedMonth || dateFrom}.xlsx`)
  }

  const fmt = (n: number) => n?.toLocaleString('th-TH') ?? '0'

  return (
    <div ref={printRef} style={{ fontFamily: 'Kanit' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%)',
        borderRadius: '16px', padding: '20px 24px', color: 'white', marginBottom: '12px',
        boxShadow: '0 4px 15px rgba(8,145,178,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontFamily: 'Kanit_B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={24} /> รายงานวิเคราะห์ลูกค้า
            </h2>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '13px' }}>Customer Analysis Report {storeName && `- ${storeName}`}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
              <button onClick={() => setDateMode('month')} style={{
                padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'Kanit_B',
                background: dateMode === 'month' ? 'white' : 'transparent', color: dateMode === 'month' ? '#0891b2' : 'white',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}><CalendarDays size={14} /> เดือน</button>
              <button onClick={() => setDateMode('range')} style={{
                padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'Kanit_B',
                background: dateMode === 'range' ? 'white' : 'transparent', color: dateMode === 'range' ? '#0891b2' : 'white',
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
              padding: '6px 16px', background: 'white', color: '#0891b2', border: 'none', borderRadius: '8px',
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
          <div className="spinner-border text-info" />
          <p style={{ marginTop: '12px', fontFamily: 'Kanit' }}>กำลังโหลดข้อมูล...</p>
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            {[
              { icon: <Users size={20} />, label: 'ลูกค้าทั้งหมด', value: fmt(data.summary.totalCustomers), color: '#0891b2', bg: '#ecfeff' },
              { icon: <ShoppingBag size={20} />, label: 'ยอดขายรวม', value: `฿${fmt(data.summary.totalRevenue)}`, color: '#2A6AAA', bg: '#F3F8FC' },
              { icon: <BarChart3 size={20} />, label: 'จำนวนบิล', value: fmt(data.summary.totalBills), color: '#7c3aed', bg: '#f5f3ff' },
              { icon: <TrendingUp size={20} />, label: 'เฉลี่ย/ลูกค้า', value: `฿${fmt(data.summary.avgPerCustomer)}`, color: '#ea580c', bg: '#fff7ed' },
              { icon: <UserCheck size={20} />, label: 'ลูกค้าขาประจำ', value: fmt(data.summary.returningCustomers), color: '#2A6AAA', bg: '#F3F8FC' },
              { icon: <UserX size={20} />, label: 'ลูกค้าใหม่', value: fmt(data.summary.newCustomers), color: '#dc2626', bg: '#fef2f2' },
              { icon: <Heart size={20} />, label: 'รอติดตาม', value: fmt(data.summary.pendingFollowups), color: '#d946ef', bg: '#fdf4ff' },
              { icon: <Star size={20} />, label: 'เฉลี่ย/บิล', value: `฿${fmt(data.summary.avgPerBill)}`, color: '#2A6AAA', bg: '#F3F8FC' },
            ].map((card, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: '12px', padding: '14px 16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ background: card.bg, borderRadius: '8px', padding: '6px', color: card.color }}>{card.icon}</div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{card.label}</span>
                </div>
                <div style={{ fontSize: '18px', fontFamily: 'Kanit_B', color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Demographics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            {/* Gender */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '13px', fontFamily: 'Kanit_B', color: '#334155', margin: '0 0 10px' }}>เพศ</h4>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, textAlign: 'center', background: '#F3F8FC', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '20px', fontFamily: 'Kanit_B', color: '#2A6AAA' }}>{data.summary.maleCount}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>ชาย</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', background: '#fdf2f8', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '20px', fontFamily: 'Kanit_B', color: '#db2777' }}>{data.summary.femaleCount}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>หญิง</div>
                </div>
              </div>
            </div>

            {/* Age Groups */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '13px', fontFamily: 'Kanit_B', color: '#334155', margin: '0 0 10px' }}>กลุ่มอายุ</h4>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {data.ageGroups?.map((g: any, i: number) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', background: '#f1f5f9', borderRadius: '6px', padding: '6px 4px', minWidth: '50px' }}>
                    <div style={{ fontSize: '14px', fontFamily: 'Kanit_B', color: '#334155' }}>{g.count}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>{g.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Levels */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '13px', fontFamily: 'Kanit_B', color: '#334155', margin: '0 0 10px' }}>ระดับราคา</h4>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {data.priceLevels?.map((p: any, i: number) => (
                  <div key={i} style={{ background: '#F3F8FC', borderRadius: '6px', padding: '6px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontFamily: 'Kanit_B', color: '#2A6AAA' }}>{p.count}</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>{p.level}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '12px 16px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={16} color="#94a3b8" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อหรือรหัสลูกค้า..."
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', fontFamily: 'Kanit', background: 'transparent' }} />
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{filteredCustomers.length} รายการ</span>
            </div>
          </div>

          {/* Customer Table */}
          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            <div style={{ overflowX: 'auto', maxHeight: '55vh' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                    {[
                      { key: 'rank', label: '#', w: '40px' },
                      { key: 'code', label: 'รหัส', w: '100px' },
                      { key: 'name', label: 'ชื่อลูกค้า', w: '180px' },
                      { key: 'bills', label: 'บิล', w: '60px' },
                      { key: 'revenue', label: 'ยอดซื้อ', w: '110px' },
                      { key: 'discount', label: 'ส่วนลด', w: '90px' },
                      { key: 'reward', label: 'Reward', w: '80px' },
                      { key: 'sex', label: 'เพศ', w: '50px' },
                      { key: 'age', label: 'อายุ', w: '50px' },
                      { key: 'point', label: 'คะแนน', w: '80px' },
                      { key: 'levelPrice', label: 'ระดับ', w: '70px' },
                    ].map(col => (
                      <th key={col.key} onClick={() => handleSort(col.key)} style={{
                        padding: '10px 8px', textAlign: col.key === 'name' || col.key === 'code' ? 'left' : 'right',
                        fontFamily: 'Kanit_B', color: '#475569', cursor: 'pointer', width: col.w,
                        borderBottom: '2px solid #e2e8f0', userSelect: 'none', whiteSpace: 'nowrap',
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: col.key === 'name' || col.key === 'code' ? 'flex-start' : 'flex-end' }}>
                          {col.label}
                          {sortField === col.key && (sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#94a3b8', fontSize: '11px' }}>{c.rank}</td>
                      <td style={{ padding: '8px', fontFamily: 'Kanit', color: '#334155', fontSize: '11px' }}>{c.code}</td>
                      <td style={{ padding: '8px', fontFamily: 'Kanit_B', color: '#0f172a' }}>
                        {c.rank <= 3 && <Crown size={12} color="#f59e0b" style={{ marginRight: '4px' }} />}
                        {c.name}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#7c3aed' }}>{c.bills}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#2A6AAA' }}>฿{fmt(c.revenue)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#dc2626' }}>฿{fmt(c.discount)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#ea580c' }}>{fmt(c.reward)}</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontSize: '11px' }}>
                        <span style={{ background: c.sex === 'ชาย' ? '#F3F8FC' : c.sex === 'หญิง' ? '#fdf2f8' : '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: c.sex === 'ชาย' ? '#2A6AAA' : c.sex === 'หญิง' ? '#db2777' : '#64748b' }}>
                          {c.sex || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#64748b' }}>{c.age || '-'}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#2A6AAA', fontFamily: 'Kanit_B' }}>{fmt(c.point)}</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontSize: '11px' }}>
                        <span style={{ background: '#F3F8FC', padding: '2px 6px', borderRadius: '4px', color: '#2A6AAA' }}>{c.levelPrice || '-'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          <Users size={48} strokeWidth={1} />
          <p style={{ marginTop: '12px' }}>กรุณาเลือกช่วงเวลาแล้วกด "ค้นหา"</p>
        </div>
      )}
    </div>
  )
}
