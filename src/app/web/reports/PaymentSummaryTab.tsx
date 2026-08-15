'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
import axios from 'axios'
import {
  CreditCard, Search, Download, Printer, Banknote, ArrowLeftRight,
  CalendarRange, CalendarDays, TrendingUp, Wallet, PieChart, BarChart3
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { getLocalStorageItem } from '@/utils/localStorage'
import { useReactToPrint } from 'react-to-print'

export default function PaymentSummaryTab() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
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
      const res = await axios.get(`/api/sale_cal/payment_summary?company=${company}&startDate=${df}&endDate=${dt}`)
      setData(res.data)
    } catch (e) {
      console.error(e)
      setData(null)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: 'รายงานสรุปช่องทางชำระเงิน' })

  const handleExport = () => {
    if (!data) return
    const wb = XLSX.utils.book_new()

    // Summary sheet
    const summaryRows = [
      { 'รายการ': 'ยอดขายรวม', 'จำนวนเงิน': data.summary.grandTotal, 'บิล': data.summary.totalBills },
      { 'รายการ': 'เงินสด (รวม)', 'จำนวนเงิน': data.summary.totalCashAll, 'สัดส่วน %': data.summary.cashPercent },
      { 'รายการ': 'โอน (รวม)', 'จำนวนเงิน': data.summary.totalTransferAll, 'สัดส่วน %': data.summary.transferPercent },
      { 'รายการ': 'เงินสดอย่างเดียว', 'จำนวนเงิน': data.summary.cashTotal, 'บิล': data.summary.cashCount },
      { 'รายการ': 'โอนอย่างเดียว', 'จำนวนเงิน': data.summary.transferTotal, 'บิล': data.summary.transferCount },
      { 'รายการ': 'เงินสด+โอน', 'จำนวนเงิน': data.summary.splitTotal, 'บิล': data.summary.splitCount },
      { 'รายการ': 'อื่นๆ', 'จำนวนเงิน': data.summary.otherTotal, 'สัดส่วน %': data.summary.otherPercent, 'บิล': data.summary.otherCount },
      { 'รายการ': 'ส่วนลด', 'จำนวนเงิน': data.summary.totalDiscount },
      { 'รายการ': 'Reward ใช้', 'จำนวนเงิน': data.summary.totalReward },
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'สรุป')

    // Transfer detail
    if (data.transferDetails?.length) {
      const detailRows = data.transferDetails.map((d: any, i: number) => ({
        '#': i + 1, 'ช่องทาง': d.name, 'ยอดเงิน': d.total, 'จำนวนบิล': d.count,
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows), 'รายละเอียดโอน')
    }

    // Daily
    if (data.daily?.length) {
      const dailyRows = data.daily.map((d: any) => ({
        'วันที่': d.date, 'เงินสด': d.cash, 'โอน': d.transfer, 'เงินสด+โอน': d.split, 'อื่นๆ': d.other, 'รวม': d.total,
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dailyRows), 'รายวัน')
    }

    XLSX.writeFile(wb, `สรุปชำระเงิน_${selectedMonth || dateFrom}.xlsx`)
  }

  const fmt = (n: number) => n?.toLocaleString('th-TH') ?? '0'

  // Calculate max daily for chart bar widths
  const maxDaily = useMemo(() => {
    if (!data?.daily) return 1
    return Math.max(...data.daily.map((d: any) => d.total), 1)
  }, [data])

  return (
    <div ref={printRef} style={{ fontFamily: 'Kanit' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)',
        borderRadius: '16px', padding: '20px 24px', color: 'white', marginBottom: '12px',
        boxShadow: '0 4px 15px rgba(124,58,237,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontFamily: 'Kanit_B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={24} /> สรุปช่องทางชำระเงิน
            </h2>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '13px' }}>Payment Summary Report {storeName && `- ${storeName}`}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
              <button onClick={() => setDateMode('month')} style={{
                padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'Kanit_B',
                background: dateMode === 'month' ? 'white' : 'transparent', color: dateMode === 'month' ? '#7c3aed' : 'white',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}><CalendarDays size={14} /> เดือน</button>
              <button onClick={() => setDateMode('range')} style={{
                padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'Kanit_B',
                background: dateMode === 'range' ? 'white' : 'transparent', color: dateMode === 'range' ? '#7c3aed' : 'white',
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
              padding: '6px 16px', background: 'white', color: '#7c3aed', border: 'none', borderRadius: '8px',
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
          {/* Main Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, #2A6AAA 0%, #3E86C7 100%)', borderRadius: '14px', padding: '18px 20px', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', opacity: 0.9, fontSize: '12px' }}>
                <TrendingUp size={16} /> ยอดขายรวม
              </div>
              <div style={{ fontSize: '24px', fontFamily: 'Kanit_B' }}>฿{fmt(data.summary.grandTotal)}</div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>{data.summary.totalBills} บิล</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #2A6AAA 0%, #3E86C7 100%)', borderRadius: '14px', padding: '18px 20px', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', opacity: 0.9, fontSize: '12px' }}>
                <Banknote size={16} /> เงินสด (รวม)
              </div>
              <div style={{ fontSize: '24px', fontFamily: 'Kanit_B' }}>฿{fmt(data.summary.totalCashAll)}</div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>{data.summary.cashPercent}% | {data.summary.cashCount} บิล (สด) + {data.summary.splitCount} บิล (ผสม)</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #2A6AAA 0%, #3E86C7 100%)', borderRadius: '14px', padding: '18px 20px', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', opacity: 0.9, fontSize: '12px' }}>
                <ArrowLeftRight size={16} /> โอน (รวม)
              </div>
              <div style={{ fontSize: '24px', fontFamily: 'Kanit_B' }}>฿{fmt(data.summary.totalTransferAll)}</div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>{data.summary.transferPercent}% | {data.summary.transferCount} บิล (โอน) + {data.summary.splitCount} บิล (ผสม)</div>
            </div>
            {data.summary.otherTotal > 0 && (
              <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', borderRadius: '14px', padding: '18px 20px', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', opacity: 0.9, fontSize: '12px' }}>
                  <CreditCard size={16} /> อื่นๆ
                </div>
                <div style={{ fontSize: '24px', fontFamily: 'Kanit_B' }}>฿{fmt(data.summary.otherTotal)}</div>
                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>{data.summary.otherPercent}% | {data.summary.otherCount} บิล</div>
              </div>
            )}
          </div>

          {/* Payment Mix & Transfer Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            {/* Payment Pie - visual bars */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '14px', fontFamily: 'Kanit_B', color: '#334155', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PieChart size={16} color="#7c3aed" /> สัดส่วนการชำระ
              </h4>
              {[
                { label: 'เงินสดอย่างเดียว', value: data.summary.cashTotal, count: data.summary.cashCount, color: '#3E86C7' },
                { label: 'โอนอย่างเดียว', value: data.summary.transferTotal, count: data.summary.transferCount, color: '#3E86C7' },
                { label: 'เงินสด + โอน', value: data.summary.splitTotal, count: data.summary.splitCount, color: '#f59e0b' },
                ...(data.summary.otherTotal > 0 ? [{ label: 'อื่นๆ', value: data.summary.otherTotal, count: data.summary.otherCount, color: '#7c3aed' }] : []),
              ].map((item, i) => {
                const pct = data.summary.grandTotal > 0 ? (item.value / data.summary.grandTotal) * 100 : 0
                return (
                  <div key={i} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ color: '#475569', fontFamily: 'Kanit_B' }}>{item.label}</span>
                      <span style={{ color: '#64748b' }}>฿{fmt(item.value)} ({item.count} บิล) - {Math.round(pct * 10) / 10}%</span>
                    </div>
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: '4px', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                )
              })}
              <div style={{ marginTop: '12px', padding: '10px', background: '#fef2f2', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#dc2626', fontFamily: 'Kanit_B' }}>ส่วนลด + Reward</span>
                <span style={{ color: '#dc2626' }}>฿{fmt(data.summary.totalDiscount + data.summary.totalReward)}</span>
              </div>
            </div>

            {/* Transfer Channel Details */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '14px', fontFamily: 'Kanit_B', color: '#334155', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wallet size={16} color="#2A6AAA" /> รายละเอียดช่องทางโอน
              </h4>
              {data.transferDetails?.length > 0 ? (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {data.transferDetails.map((td: any, i: number) => {
                    const pct = data.summary.totalTransferAll > 0 ? (td.total / data.summary.totalTransferAll) * 100 : 0
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontFamily: 'Kanit_B', color: '#334155' }}>{td.name}</div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>{td.count} บิล | {Math.round(pct * 10) / 10}%</div>
                        </div>
                        <div style={{ fontFamily: 'Kanit_B', fontSize: '13px', color: '#2A6AAA' }}>฿{fmt(td.total)}</div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '12px' }}>ไม่มีข้อมูลการโอน</div>
              )}
            </div>
          </div>

          {/* Daily Breakdown */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '14px', fontFamily: 'Kanit_B', color: '#334155', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarChart3 size={16} color="#7c3aed" /> ยอดชำระรายวัน
            </h4>
            <div style={{ overflowX: 'auto', maxHeight: '45vh' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '8px', textAlign: 'left', fontFamily: 'Kanit_B', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>วันที่</th>
                    <th style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#2A6AAA', borderBottom: '2px solid #e2e8f0' }}>เงินสด</th>
                    <th style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#2A6AAA', borderBottom: '2px solid #e2e8f0' }}>โอน</th>
                    <th style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#f59e0b', borderBottom: '2px solid #e2e8f0' }}>ผสม</th>
                    <th style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#7c3aed', borderBottom: '2px solid #e2e8f0' }}>อื่นๆ</th>
                    <th style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#334155', borderBottom: '2px solid #e2e8f0' }}>รวม</th>
                    <th style={{ padding: '8px', textAlign: 'left', fontFamily: 'Kanit_B', color: '#334155', borderBottom: '2px solid #e2e8f0', width: '200px' }}>กราฟ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.daily?.map((d: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px', fontFamily: 'Kanit', color: '#334155' }}>{d.date}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#2A6AAA' }}>฿{fmt(d.cash)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#2A6AAA' }}>฿{fmt(d.transfer)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#f59e0b' }}>฿{fmt(d.split)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#7c3aed' }}>฿{fmt(d.other)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#0f172a' }}>฿{fmt(d.total)}</td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', background: '#f1f5f9', width: `${(d.total / maxDaily) * 100}%`, minWidth: '4px' }}>
                          {d.cash > 0 && <div style={{ width: `${(d.cash / d.total) * 100}%`, background: '#3E86C7', height: '100%' }} />}
                          {d.transfer > 0 && <div style={{ width: `${(d.transfer / d.total) * 100}%`, background: '#3E86C7', height: '100%' }} />}
                          {d.split > 0 && <div style={{ width: `${(d.split / d.total) * 100}%`, background: '#f59e0b', height: '100%' }} />}
                          {d.other > 0 && <div style={{ width: `${(d.other / d.total) * 100}%`, background: '#7c3aed', height: '100%' }} />}
                        </div>
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
          <CreditCard size={48} strokeWidth={1} />
          <p style={{ marginTop: '12px' }}>กรุณาเลือกช่วงเวลาแล้วกด "ค้นหา"</p>
        </div>
      )}
    </div>
  )
}
