'use client'

import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import {
  FileText, Download, Printer, TrendingUp, TrendingDown,
  CalendarRange, CalendarDays, Search, DollarSign, ArrowDown, ArrowUp,
  Minus, BarChart3, PieChart
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { getLocalStorageItem } from '@/utils/localStorage'
import { useReactToPrint } from 'react-to-print'

export default function PLReportTab() {
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
      const res = await axios.get(`/api/sale_cal/pl_report?company=${company}&startDate=${df}&endDate=${dt}`)
      setData(res.data)
    } catch (e) {
      console.error(e)
      setData(null)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: 'งบกำไรขาดทุน' })

  const handleExport = () => {
    if (!data) return
    const pl = data.pl
    const c = data.calculated
    const rows = [
      { 'รายการ': '=== รายได้ ===', 'จำนวนเงิน': '' },
      { 'รายการ': 'R4000 - ยอดขายสินค้า', 'จำนวนเงิน': pl.R4000 },
      { 'รายการ': 'R4001 - รายได้อื่น', 'จำนวนเงิน': pl.R4001 },
      { 'รายการ': 'R4002 - รายได้อื่น 2', 'จำนวนเงิน': pl.R4002 },
      { 'รายการ': 'รายได้รวม', 'จำนวนเงิน': c.totalRevenue },
      { 'รายการ': '', 'จำนวนเงิน': '' },
      { 'รายการ': '=== ต้นทุน ===', 'จำนวนเงิน': '' },
      { 'รายการ': 'C5000 - ต้นทุนขาย', 'จำนวนเงิน': pl.C5000 },
      { 'รายการ': 'C5001 - ต้นทุนอื่น', 'จำนวนเงิน': pl.C5001 },
      { 'รายการ': 'ต้นทุนรวม', 'จำนวนเงิน': c.totalCost },
      { 'รายการ': 'กำไรขั้นต้น', 'จำนวนเงิน': c.grossProfit },
      { 'รายการ': '', 'จำนวนเงิน': '' },
      { 'รายการ': '=== ค่าใช้จ่ายในการขาย ===', 'จำนวนเงิน': '' },
      { 'รายการ': 'S6000 - เงินเดือน/ค่าจ้าง', 'จำนวนเงิน': pl.S6000 },
      { 'รายการ': 'S6001 - ค่าเช่า', 'จำนวนเงิน': pl.S6001 },
      { 'รายการ': 'S6002 - ค่าน้ำ', 'จำนวนเงิน': pl.S6002 },
      { 'รายการ': 'S6003 - ค่าไฟ', 'จำนวนเงิน': pl.S6003 },
      { 'รายการ': 'S6004 - ค่าโทรศัพท์/อินเตอร์เน็ต', 'จำนวนเงิน': pl.S6004 },
      { 'รายการ': 'S6005 - ค่าขนส่ง', 'จำนวนเงิน': pl.S6005 },
      { 'รายการ': 'S6006 - ค่าโฆษณา/การตลาด', 'จำนวนเงิน': pl.S6006 },
      { 'รายการ': 'S6007 - ค่าเสื่อมราคา', 'จำนวนเงิน': pl.S6007 },
      { 'รายการ': 'S6008 - ค่าซ่อมบำรุง', 'จำนวนเงิน': pl.S6008 },
      { 'รายการ': 'S6009 - ค่าประกัน', 'จำนวนเงิน': pl.S6009 },
      { 'รายการ': 'S6010 - ค่าใช้จ่ายอื่น', 'จำนวนเงิน': pl.S6010 },
      { 'รายการ': 'ค่าใช้จ่ายในการขายรวม', 'จำนวนเงิน': c.totalSelling },
      { 'รายการ': '', 'จำนวนเงิน': '' },
      { 'รายการ': '=== ค่าใช้จ่ายบริหาร ===', 'จำนวนเงิน': '' },
      { 'รายการ': 'A7000 - ค่าที่ปรึกษา/บัญชี', 'จำนวนเงิน': pl.A7000 },
      { 'รายการ': 'A7001 - ค่าอุปกรณ์สำนักงาน', 'จำนวนเงิน': pl.A7001 },
      { 'รายการ': 'A7002 - ค่าธรรมเนียม', 'จำนวนเงิน': pl.A7002 },
      { 'รายการ': 'A7003 - ค่าสาธารณูปโภคอื่น', 'จำนวนเงิน': pl.A7003 },
      { 'รายการ': 'A7004 - ค่าใช้จ่ายบริหารอื่น', 'จำนวนเงิน': pl.A7004 },
      { 'รายการ': 'ค่าใช้จ่ายบริหารรวม', 'จำนวนเงิน': c.totalAdmin },
      { 'รายการ': '', 'จำนวนเงิน': '' },
      { 'รายการ': 'กำไรจากการดำเนินงาน', 'จำนวนเงิน': c.operatingProfit },
      { 'รายการ': 'ภาษีมูลค่าเพิ่ม (VAT)', 'จำนวนเงิน': pl.vat },
      { 'รายการ': '** กำไรสุทธิ **', 'จำนวนเงิน': c.netProfit },
      { 'รายการ': 'Net Margin %', 'จำนวนเงิน': c.netMargin },
    ]
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'งบกำไรขาดทุน')
    XLSX.writeFile(wb, `งบกำไรขาดทุน_${selectedMonth || dateFrom}.xlsx`)
  }

  const fmt = (n: number) => Math.round(n || 0).toLocaleString('th-TH')

  const PLRow = ({ label, value, bold, indent, color, border }: {
    label: string; value: number; bold?: boolean; indent?: boolean; color?: string; border?: boolean
  }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: `${bold ? '10px' : '6px'} ${indent ? '24px' : '12px'} ${bold ? '10px' : '6px'} 12px`,
      borderBottom: border ? '2px solid #334155' : '1px solid #f1f5f9',
      background: bold ? '#f8fafc' : 'transparent',
    }}>
      <span style={{
        fontSize: bold ? '13px' : '12px',
        fontFamily: bold ? 'Kanit_B' : 'Kanit',
        color: color || (bold ? '#0f172a' : '#475569'),
        paddingLeft: indent ? '16px' : '0',
      }}>{label}</span>
      <span style={{
        fontSize: bold ? '14px' : '13px',
        fontFamily: 'Kanit_B',
        color: color || (value >= 0 ? '#147F56' : '#dc2626'),
      }}>
        {value < 0 ? '-' : ''}฿{fmt(Math.abs(value))}
      </span>
    </div>
  )

  return (
    <div ref={printRef} style={{ fontFamily: 'Kanit' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #2dd4bf 100%)',
        borderRadius: '16px', padding: '20px 24px', color: 'white', marginBottom: '12px',
        boxShadow: '0 4px 15px rgba(15,118,110,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontFamily: 'Kanit_B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={24} /> งบกำไรขาดทุน (P&L)
            </h2>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '13px' }}>Profit & Loss Statement {storeName && `- ${storeName}`}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
              <button onClick={() => setDateMode('month')} style={{
                padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'Kanit_B',
                background: dateMode === 'month' ? 'white' : 'transparent', color: dateMode === 'month' ? '#0f766e' : 'white',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}><CalendarDays size={14} /> เดือน</button>
              <button onClick={() => setDateMode('range')} style={{
                padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'Kanit_B',
                background: dateMode === 'range' ? 'white' : 'transparent', color: dateMode === 'range' ? '#0f766e' : 'white',
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
              padding: '6px 16px', background: 'white', color: '#0f766e', border: 'none', borderRadius: '8px',
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
          <div className="spinner-border text-success" />
          <p style={{ marginTop: '12px', fontFamily: 'Kanit' }}>กำลังโหลดข้อมูล...</p>
        </div>
      ) : data ? (
        <>
          {/* Key Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            {[
              { icon: <TrendingUp size={20} />, label: 'รายได้รวม', value: `฿${fmt(data.calculated.totalRevenue)}`, color: '#2A6AAA', bg: '#F3F8FC' },
              { icon: <DollarSign size={20} />, label: 'ต้นทุนรวม', value: `฿${fmt(data.calculated.totalCost)}`, color: '#dc2626', bg: '#fef2f2' },
              { icon: <ArrowUp size={20} />, label: 'กำไรขั้นต้น', value: `฿${fmt(data.calculated.grossProfit)}`, color: data.calculated.grossProfit >= 0 ? '#147F56' : '#dc2626', bg: data.calculated.grossProfit >= 0 ? '#EDF9F3' : '#fef2f2' },
              { icon: <BarChart3 size={20} />, label: 'Gross Margin', value: `${data.calculated.grossMargin}%`, color: '#7c3aed', bg: '#f5f3ff' },
              { icon: <ArrowDown size={20} />, label: 'ค่าใช้จ่ายรวม', value: `฿${fmt(data.calculated.totalExpenses)}`, color: '#ea580c', bg: '#fff7ed' },
              { icon: data.calculated.netProfit >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />, label: 'กำไรสุทธิ', value: `฿${fmt(data.calculated.netProfit)}`, color: data.calculated.netProfit >= 0 ? '#147F56' : '#dc2626', bg: data.calculated.netProfit >= 0 ? '#EDF9F3' : '#fef2f2' },
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

          {!data.hasPLData && (
            <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '8px', padding: '10px 16px', marginBottom: '12px', fontSize: '12px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Minus size={14} /> ไม่พบข้อมูล PL ที่บันทึกไว้สำหรับช่วงนี้ - ข้อมูลคำนวณจากยอดขายจริง (R4000, C5000 อัตโนมัติ) ค่าใช้จ่ายอื่นๆ ต้องบันทึกในระบบ PL
            </div>
          )}

          {/* P&L Statement */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              {/* Revenue Section */}
              <div style={{ background: '#F3F8FC', padding: '10px 12px', borderBottom: '2px solid #3E86C7' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontFamily: 'Kanit_B', color: '#2A6AAA', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={16} /> รายได้ (Revenue)
                </h4>
              </div>
              <PLRow label="R4000 - ยอดขายสินค้า" value={data.pl.R4000} indent />
              <PLRow label="R4001 - รายได้อื่น" value={data.pl.R4001} indent />
              <PLRow label="R4002 - รายได้อื่น 2" value={data.pl.R4002} indent />
              <PLRow label="รายได้รวม" value={data.calculated.totalRevenue} bold border color="#2A6AAA" />

              {/* Cost Section */}
              <div style={{ background: '#fef2f2', padding: '10px 12px', borderBottom: '2px solid #ef4444', marginTop: '4px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontFamily: 'Kanit_B', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowDown size={16} /> ต้นทุน (Cost of Goods)
                </h4>
              </div>
              <PLRow label="C5000 - ต้นทุนขาย" value={data.pl.C5000} indent />
              <PLRow label="C5001 - ต้นทุนอื่น" value={data.pl.C5001} indent />
              <PLRow label="ต้นทุนรวม" value={data.calculated.totalCost} bold border color="#dc2626" />
              <PLRow label="กำไรขั้นต้น (Gross Profit)" value={data.calculated.grossProfit} bold border color={data.calculated.grossProfit >= 0 ? '#147F56' : '#dc2626'} />
            </div>

            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              {/* Selling Expenses */}
              <div style={{ background: '#fff7ed', padding: '10px 12px', borderBottom: '2px solid #f59e0b' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontFamily: 'Kanit_B', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={16} /> ค่าใช้จ่ายในการขาย
                </h4>
              </div>
              <PLRow label="S6000 - เงินเดือน/ค่าจ้าง" value={data.pl.S6000} indent />
              <PLRow label="S6001 - ค่าเช่า" value={data.pl.S6001} indent />
              <PLRow label="S6002 - ค่าน้ำ" value={data.pl.S6002} indent />
              <PLRow label="S6003 - ค่าไฟ" value={data.pl.S6003} indent />
              <PLRow label="S6004 - ค่าโทรศัพท์/อินเตอร์เน็ต" value={data.pl.S6004} indent />
              <PLRow label="S6005 - ค่าขนส่ง" value={data.pl.S6005} indent />
              <PLRow label="S6006 - ค่าโฆษณา" value={data.pl.S6006} indent />
              <PLRow label="S6007 - ค่าเสื่อมราคา" value={data.pl.S6007} indent />
              <PLRow label="S6008 - ค่าซ่อมบำรุง" value={data.pl.S6008} indent />
              <PLRow label="S6009 - ค่าประกัน" value={data.pl.S6009} indent />
              <PLRow label="S6010 - ค่าใช้จ่ายอื่น" value={data.pl.S6010} indent />
              <PLRow label="รวมค่าใช้จ่ายขาย" value={data.calculated.totalSelling} bold border color="#ea580c" />

              {/* Admin Expenses */}
              <div style={{ background: '#F3F8FC', padding: '10px 12px', borderBottom: '2px solid #2A6AAA', marginTop: '4px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontFamily: 'Kanit_B', color: '#2A6AAA', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} /> ค่าใช้จ่ายบริหาร
                </h4>
              </div>
              <PLRow label="A7000 - ค่าที่ปรึกษา/บัญชี" value={data.pl.A7000} indent />
              <PLRow label="A7001 - ค่าอุปกรณ์สำนักงาน" value={data.pl.A7001} indent />
              <PLRow label="A7002 - ค่าธรรมเนียม" value={data.pl.A7002} indent />
              <PLRow label="A7003 - ค่าสาธารณูปโภคอื่น" value={data.pl.A7003} indent />
              <PLRow label="A7004 - ค่าใช้จ่ายบริหารอื่น" value={data.pl.A7004} indent />
              <PLRow label="รวมค่าใช้จ่ายบริหาร" value={data.calculated.totalAdmin} bold border color="#2A6AAA" />
            </div>
          </div>

          {/* Bottom Line */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '12px' }}>
            <div style={{
              background: data.calculated.operatingProfit >= 0 ? 'linear-gradient(135deg, #147F56, #1F9D6B)' : 'linear-gradient(135deg, #dc2626, #ef4444)',
              borderRadius: '14px', padding: '18px 20px', color: 'white', textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>กำไรจากการดำเนินงาน</div>
              <div style={{ fontSize: '22px', fontFamily: 'Kanit_B' }}>฿{fmt(data.calculated.operatingProfit)}</div>
            </div>
            <div style={{
              background: '#f1f5f9', borderRadius: '14px', padding: '18px 20px', textAlign: 'center', border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>VAT</div>
              <div style={{ fontSize: '22px', fontFamily: 'Kanit_B', color: '#475569' }}>฿{fmt(data.pl.vat)}</div>
            </div>
            <div style={{
              background: data.calculated.netProfit >= 0 ? 'linear-gradient(135deg, #147F56, #1F9D6B)' : 'linear-gradient(135deg, #dc2626, #ef4444)',
              borderRadius: '14px', padding: '18px 20px', color: 'white', textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>กำไรสุทธิ (Net Profit)</div>
              <div style={{ fontSize: '22px', fontFamily: 'Kanit_B' }}>฿{fmt(data.calculated.netProfit)}</div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>Net Margin {data.calculated.netMargin}%</div>
            </div>
          </div>

          {/* Extra Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>ยอดซื้อสินค้า (Purchase)</div>
              <div style={{ fontSize: '18px', fontFamily: 'Kanit_B', color: '#7c3aed' }}>฿{fmt(data.calculated.totalPurchase)}</div>
            </div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>มูลค่าสินค้าคงคลัง</div>
              <div style={{ fontSize: '18px', fontFamily: 'Kanit_B', color: '#2A6AAA' }}>฿{fmt(data.calculated.stockValue)}</div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          <FileText size={48} strokeWidth={1} />
          <p style={{ marginTop: '12px' }}>กรุณาเลือกช่วงเวลาแล้วกด "ค้นหา"</p>
        </div>
      )}
    </div>
  )
}
