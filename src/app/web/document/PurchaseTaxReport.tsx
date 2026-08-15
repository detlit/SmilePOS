'use client'

import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { useReactToPrint } from "react-to-print"
import { Search, Printer, FileSpreadsheet, Calendar, X, ShoppingCart } from "lucide-react"

interface PurchaseTaxRow {
  id: string
  sourceId: number
  sourceType: 'tax' | 'debit' | 'credit'
  documentLabel: string
  referenceNo: string
  createDate: string | null
  payDate: string | null
  documentNo: string
  supplierCode: string
  supplierName: string
  supplierIdcode: string
  person: string
  beforeVat: number
  vatAmount: number
  totalAmount: number
  status: string
}

interface StoreInfo {
  namestore: string
  ownerName: string
  address: string
  taxnumber: string
  tel: string
  branchName: string
  branchCode: string
}

const SOURCE_STYLES: Record<PurchaseTaxRow['sourceType'], { color: string, bg: string }> = {
  tax: { color: '#2A6AAA', bg: '#E5EEF8' },
  debit: { color: '#7c3aed', bg: '#ede9fe' },
  credit: { color: '#c2410c', bg: '#ffedd5' },
}

const escapeCsvValue = (value: string | number) => {
  const normalized = String(value ?? '')
  if (normalized.includes(',') || normalized.includes('"') || normalized.includes('\n')) {
    return `"${normalized.replace(/"/g, '""')}"`
  }
  return normalized
}

const getStatusPresentation = (status: string) => {
  const normalizedStatus = String(status || '').trim() || 'ปกติ'

  if (normalizedStatus === 'ยกเลิก') {
    return { label: 'ยกเลิก', color: '#dc2626', bg: '#fee2e2' }
  }

  if (normalizedStatus === 'รออนุมัติ') {
    return { label: normalizedStatus, color: '#b45309', bg: '#fef3c7' }
  }

  if (normalizedStatus === 'อนุมัติ' || normalizedStatus === 'ปกติ') {
    return { label: normalizedStatus === 'อนุมัติ' ? 'อนุมัติ' : 'ปกติ', color: '#147F56', bg: '#D3F0E2' }
  }

  return { label: normalizedStatus, color: '#1E5088', bg: '#E5EEF8' }
}

export default function PurchaseTaxReport() {
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [startDate, setStartDate] = useState<Date>(firstDayOfMonth)
  const [endDate, setEndDate] = useState<Date>(today)
  const [data, setData] = useState<PurchaseTaxRow[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({ namestore: '', ownerName: '', address: '', taxnumber: '', tel: '', branchName: '', branchCode: '' })
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({ contentRef: printRef })

  const fetchStore = async () => {
    const company = localStorage.getItem("company_") || ""
    try {
      const res = await axios.get(`/api/setting/store/store?company=${company}`)
      if (res.data?.[0]) {
        setStoreInfo({
          namestore: res.data[0].namestore || '',
          ownerName: res.data[0].ownerName || '',
          address: res.data[0].address || '',
          taxnumber: res.data[0].taxnumber || '',
          tel: res.data[0].tel || '',
          branchName: res.data[0].branchName || '',
          branchCode: res.data[0].branchCode || '',
        })
      }
    } catch (error) { console.error(error) }
  }

  const fetchData = async () => {
    const company = localStorage.getItem("company_") || ""
    if (!company) return
    setLoading(true)
    try {
      const sd = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
      const ed = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
      const res = await axios.get<PurchaseTaxRow[]>(`/api/receive/tax-report?company=${company}&startDate=${sd}&endDate=${ed}`)
      setData(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error("Fetch purchase tax report error:", error)
      setData([])
    }
    setLoading(false)
  }

  useEffect(() => { fetchStore() }, [])
  useEffect(() => { fetchData() }, [startDate, endDate])

  const filtered = data.filter(row => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (row.documentNo || '').toLowerCase().includes(q) ||
      (row.referenceNo || '').toLowerCase().includes(q) ||
      (row.documentLabel || '').toLowerCase().includes(q) ||
      (row.supplierName || '').toLowerCase().includes(q) ||
      (row.supplierCode || '').toLowerCase().includes(q) ||
      (row.person || '').toLowerCase().includes(q) ||
      (row.status || '').toLowerCase().includes(q)
    )
  })

  const activeRows = filtered.filter(row => row.status !== 'ยกเลิก')
  const cancelledRows = filtered.filter(row => row.status === 'ยกเลิก')

  const totalBeforeVat = activeRows.reduce((sum, row) => sum + Number(row.beforeVat || 0), 0)
  const totalVat = activeRows.reduce((sum, row) => sum + Number(row.vatAmount || 0), 0)
  const totalSum = activeRows.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0)
  const totalCancelledMagnitude = cancelledRows.reduce((sum, row) => sum + Math.abs(Number(row.totalAmount || 0)), 0)

  const fmtDate = (d?: string | null) => {
    if (!d) return '-'
    const dt = new Date(d)
    return dt.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }
  const fmtTime = (d?: string | null) => {
    if (!d) return ''
    const dt = new Date(d)
    return dt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  const fmtNum = (n: number) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const getIssueDateLabel = (row: PurchaseTaxRow) => {
    if (!row.createDate) return ''
    return `วันที่ออก ${fmtDate(row.createDate)}`
  }

  const fmtDateThai = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0')
    const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
    const month = thaiMonths[d.getMonth()]
    const year = d.getFullYear() + 543
    return `${day} ${month} ${year}`
  }

  const getThaiMonth = (d: Date) => {
    const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
    return thaiMonths[d.getMonth()]
  }

  const taxDigits = (taxnum: string) => {
    const digits = (taxnum || '').replace(/[^0-9]/g, '').split('')
    const boxes = Array(13).fill('')
    digits.forEach((d, i) => { if (i < 13) boxes[i] = d })
    return boxes
  }

  const branchDigits = (branch: string) => {
    const digits = (branch || '').replace(/[^0-9๐-๙]/g, '').split('')
    const boxes = Array(5).fill('')
    digits.forEach((d, i) => { if (i < 5) boxes[i] = d })
    return boxes
  }

  const exportCSV = () => {
    const header = ['ลำดับ', 'วันที่เอกสาร', 'วันที่ชำระสินค้า', 'ประเภทเอกสาร', 'เลขที่เอกสาร', 'เลขที่อ้างอิง', 'ผู้ขาย/ผู้ให้บริการ', 'รหัสผู้ขาย', 'พนักงาน', 'มูลค่าก่อนภาษี', 'ภาษี 7%', 'ยอดรวม', 'สถานะ']
    const rows = filtered.map((r, i) => [
      i + 1,
      fmtDate(r.createDate),
      fmtDate(r.payDate),
      r.documentLabel || '-',
      r.documentNo || '-',
      r.referenceNo || '-',
      r.supplierName || '-',
      r.supplierCode || '-',
      r.person || '-',
      Number(r.beforeVat || 0).toFixed(2),
      Number(r.vatAmount || 0).toFixed(2),
      Number(r.totalAmount || 0).toFixed(2),
      r.status || 'ปกติ'
    ])
    const bom = '\uFEFF'
    const csv = bom + [header, ...rows].map(row => row.map(escapeCsvValue).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `รายงานภาษีซื้อ_${startDate.toISOString().slice(0, 10)}_${endDate.toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: '20px 10px' }}>
      {/* ===== Header ===== */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShoppingCart size={24} color="#2A6AAA" />
          <span style={{ fontFamily: 'Kanit_B', fontSize: 22, color: '#1e293b' }}>รายการภาษีซื้อ</span>
        </div>
      </div>

      {/* ===== Filters Bar ===== */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginBottom: 20,
        background: '#f8fafc', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={16} color="#64748b" />
          <span style={{ fontFamily: 'Kanit', fontSize: 13, color: '#64748b' }}>ตั้งแต่</span>
          <DatePicker
            selected={startDate}
            onChange={(date: Date | null) => date && setStartDate(date)}
            dateFormat="dd/MM/yyyy"
            className="form-control"
          />
          <span style={{ fontFamily: 'Kanit', fontSize: 13, color: '#64748b' }}>ถึง</span>
          <DatePicker
            selected={endDate}
            onChange={(date: Date | null) => date && setEndDate(date)}
            dateFormat="dd/MM/yyyy"
            className="form-control"
          />
        </div>

        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="ค้นหาเลขที่เอกสาร, เลขอ้างอิง, ผู้ขาย, พนักงาน..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', height: 36, borderRadius: 8, border: '1px solid #cbd5e1',
              paddingLeft: 34, paddingRight: 10, fontFamily: 'Kanit', fontSize: 13,
              outline: 'none', transition: 'border 0.2s',
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#2A6AAA'}
            onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportCSV} style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
            borderRadius: 8, border: '1px solid #2A6AAA', background: 'white', color: '#2A6AAA',
            fontFamily: 'Kanit', fontSize: 13, cursor: 'pointer', transition: 'all 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F3F8FC' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
          >
            <FileSpreadsheet size={15} /> Export CSV
          </button>
          <button onClick={() => setShowModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
            borderRadius: 8, border: 'none', background: '#2A6AAA', color: 'white',
            fontFamily: 'Kanit', fontSize: 13, cursor: 'pointer', transition: 'all 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1E5088' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#2A6AAA' }}
          >
            <Printer size={15} /> พิมพ์
          </button>
        </div>
      </div>

      {/* ===== Summary Cards ===== */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <SummaryCard label="จำนวนเอกสาร" value={`${activeRows.length}`} unit="รายการ" color="#3E86C7" bg="#F3F8FC" />
        <SummaryCard label="มูลค่าสินค้า (ก่อน VAT)" value={fmtNum(totalBeforeVat)} unit="บาท" color="#8b5cf6" bg="#f5f3ff" />
        <SummaryCard label="ภาษีมูลค่าเพิ่ม 7%" value={fmtNum(totalVat)} unit="บาท" color="#f59e0b" bg="#fffbeb" />
        <SummaryCard label="ยอดรวมทั้งสิ้น" value={fmtNum(totalSum)} unit="บาท" color="#2A6AAA" bg="#F3F8FC" />
        {cancelledRows.length > 0 && (
          <SummaryCard label="ยกเลิก" value={`${cancelledRows.length} รายการ (${fmtNum(totalCancelledMagnitude)})`} unit="บาท" color="#ef4444" bg="#fef2f2" />
        )}
      </div>

      {/* ===== Data Table ===== */}
      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Kanit', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={thStyle}>#</th>
              <th style={{ ...thStyle, textAlign: 'left' }}>วันที่ใบกำกับภาษี</th>
              <th style={{ ...thStyle, textAlign: 'left' }}>วันที่ชำระสินค้า</th>
              <th style={{ ...thStyle, textAlign: 'left' }}>เอกสารภาษี</th>
              <th style={{ ...thStyle, textAlign: 'left' }}>ผู้ขาย/ผู้ให้บริการ</th>
              <th style={{ ...thStyle, textAlign: 'left' }}>พนักงาน</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>มูลค่าก่อนภาษี</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>ภาษี 7%</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>ยอดรวม</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontFamily: 'Kanit' }}>กำลังโหลด...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontFamily: 'Kanit' }}>ไม่พบข้อมูล</td></tr>
            ) : (
              filtered.map((row, idx) => {
                const isCancelled = row.status === 'ยกเลิก'
                const statusView = getStatusPresentation(row.status)
                const sourceStyle = SOURCE_STYLES[row.sourceType]
                return (
                  <tr key={row.id} style={{
                    background: isCancelled ? '#fef2f2' : idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    opacity: isCancelled ? 0.7 : 1,
                    transition: 'background 0.15s'
                  }}
                    onMouseEnter={e => { if (!isCancelled) e.currentTarget.style.background = '#F3F8FC' }}
                    onMouseLeave={e => { e.currentTarget.style.background = isCancelled ? '#fef2f2' : idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                  >
                    <td style={tdStyle}>{idx + 1}</td>
                    <td style={{ ...tdStyle, textAlign: 'left', whiteSpace: 'nowrap' }}>
                      {fmtDate(row.createDate)} <span style={{ color: '#94a3b8', fontSize: 11 }}>{fmtTime(row.createDate)}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'left', whiteSpace: 'nowrap' }}>
                      {row.payDate ? fmtDate(row.payDate) : '-'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'left', whiteSpace: 'normal', minWidth: 220 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontFamily: 'Kanit_B', color: isCancelled ? '#991b1b' : '#173F6B' }}>{row.documentNo || '-'}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 999,
                            fontSize: 10, fontFamily: 'Kanit_B', color: sourceStyle.color, background: sourceStyle.bg
                          }}>
                            {row.documentLabel}
                          </span>
                          {getIssueDateLabel(row) ? (
                            <span style={{ color: '#64748b', fontSize: 11 }}>{getIssueDateLabel(row)}</span>
                          ) : null}
                          {row.referenceNo ? (
                            <span style={{ color: '#64748b', fontSize: 11 }}>อ้างอิง {row.referenceNo}</span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'left', whiteSpace: 'normal', minWidth: 180 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span>{row.supplierName || '-'}</span>
                        {row.supplierCode ? <span style={{ fontSize: 11, color: '#64748b' }}>รหัส {row.supplierCode}</span> : null}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'left', whiteSpace: 'normal' }}>{row.person || '-'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: row.beforeVat < 0 ? '#dc2626' : '#0f172a' }}>{fmtNum(Number(row.beforeVat || 0))}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: row.vatAmount < 0 ? '#dc2626' : '#0f172a' }}>{fmtNum(Number(row.vatAmount || 0))}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: row.totalAmount < 0 ? '#dc2626' : '#0f172a' }}>{fmtNum(Number(row.totalAmount || 0))}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{ padding: '2px 10px', borderRadius: 6, fontSize: 11, background: statusView.bg, color: statusView.color, fontFamily: 'Kanit_B' }}>{statusView.label}</span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr style={{ background: '#f1f5f9', fontFamily: 'Kanit_B' }}>
                <td colSpan={6} style={{ ...tdStyle, textAlign: 'right', fontSize: 14, color: '#1e293b' }}>รวมทั้งหมด (ไม่รวมยกเลิก)</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontSize: 14, color: '#8b5cf6' }}>{fmtNum(totalBeforeVat)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontSize: 14, color: '#f59e0b' }}>{fmtNum(totalVat)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontSize: 14, color: '#2A6AAA' }}>{fmtNum(totalSum)}</td>
                <td style={tdStyle}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ===== A4 Print Modal ===== */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          overflowY: 'auto', padding: '20px 0'
        }} onClick={() => setShowModal(false)}>
          <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 10,
              position: 'sticky', top: 0, zIndex: 10, padding: '8px 0'
            }}>
              <button onClick={() => handlePrint()} style={{
                display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 20px',
                borderRadius: 8, border: 'none', background: '#2A6AAA', color: 'white',
                fontFamily: 'Kanit', fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                <Printer size={16} /> พิมพ์
              </button>
              <button onClick={() => setShowModal(false)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 38, height: 38, borderRadius: 8, border: 'none',
                background: '#ef4444', color: 'white', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                <X size={18} />
              </button>
            </div>

            <div ref={printRef}>
              {(() => {
                const ROWS_PER_PAGE = 20
                const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE))
                const pages = []
                for (let p = 0; p < totalPages; p++) {
                  const pageRows = filtered.slice(p * ROWS_PER_PAGE, (p + 1) * ROWS_PER_PAGE)
                  const blankCount = ROWS_PER_PAGE - pageRows.length
                  const isLastPage = p === totalPages - 1
                  pages.push(
                    <div key={p} style={{
                      width: '210mm', minHeight: '297mm', background: 'white',
                      padding: '15mm 15mm 20mm 15mm',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                      fontFamily: 'Kanit', fontSize: '11pt', color: '#000',
                      boxSizing: 'border-box',
                      pageBreakAfter: isLastPage ? 'auto' : 'always',
                      marginBottom: isLastPage ? 0 : 20
                    }}>
                      {/* Title */}
                      <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <div style={{ fontFamily: 'Kanit_B', fontSize: '16pt' }}>รายงานภาษีซื้อ</div>
                      </div>

                      {/* เดือนภาษี / ปี */}
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, fontSize: '11pt' }}>
                        <span>เดือนภาษี </span>
                        <span style={{ borderBottom: '1px dotted #000', minWidth: 180, textAlign: 'center', margin: '0 4px', fontFamily: 'Kanit_B' }}>
                          {getThaiMonth(startDate)}
                        </span>
                        <span> ปี </span>
                        <span style={{ borderBottom: '1px dotted #000', minWidth: 80, textAlign: 'center', margin: '0 4px', fontFamily: 'Kanit_B' }}>
                          {startDate.getFullYear() + 543}
                        </span>
                      </div>

                      {/* ชื่อผู้ประกอบการ / เลขประจำตัวผู้เสียภาษีอากร */}
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6, fontSize: '10pt', flexWrap: 'wrap' }}>
                        <span>ชื่อผู้ประกอบการ </span>
                        <span style={{ borderBottom: '1px dotted #000', flex: 1, minWidth: 100, textAlign: 'center', margin: '0 4px', fontFamily: 'Kanit_B' }}>
                          {storeInfo.ownerName}
                        </span>
                        <span style={{ marginLeft: 8 }}>เลขประจำตัวผู้เสียภาษีอากร </span>
                        <div style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
                          {taxDigits(storeInfo.taxnumber).map((d, i) => (
                            <div key={i} style={{
                              width: 18, height: 22, border: '1px solid #000', textAlign: 'center',
                              lineHeight: '22px', fontSize: '10pt', fontFamily: 'Kanit_B'
                            }}>{d}</div>
                          ))}
                        </div>
                      </div>

                      {/* สถานประกอบการ */}
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6, fontSize: '10pt', flexWrap: 'wrap' }}>
                        <span>ชื่อสถานประกอบการ </span>
                        <span style={{ borderBottom: '1px dotted #000', flex: 1, minWidth: 100, textAlign: 'center', margin: '0 4px', fontFamily: 'Kanit_B' }}>
                          {storeInfo.namestore}{storeInfo.address ? ` ${storeInfo.address}` : ''}
                        </span>
                      </div>

                      {/* สำนักงานใหญ่ / สาขา */}
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, fontSize: '10pt', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <div style={{ width: 16, height: 16, border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10pt' }}>
                              {storeInfo.branchName === 'สำนักงานใหญ่' || !storeInfo.branchName ? '✓' : ''}
                            </div>
                            <span>สำนักงานใหญ่</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <div style={{ width: 16, height: 16, border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10pt' }}>
                              {storeInfo.branchName && storeInfo.branchName !== 'สำนักงานใหญ่' ? '✓' : ''}
                            </div>
                            <span>สาขาที่</span>
                            <div style={{ display: 'flex', gap: 2, marginLeft: 2 }}>
                              {branchDigits(storeInfo.branchCode).map((d, i) => (
                                <div key={i} style={{
                                  width: 18, height: 22, border: '1px solid #000', textAlign: 'center',
                                  lineHeight: '22px', fontSize: '10pt', fontFamily: 'Kanit_B'
                                }}>{d}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ===== Table ===== */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                        <thead>
                          <tr>
                            <th style={{ ...pthStyle, width: '5%' }} rowSpan={2}>ลำดับ<br />ที่</th>
                            <th colSpan={2} style={pthStyle}>ใบกำกับภาษี</th>
                            <th rowSpan={2} style={{ ...pthStyle, width: '18%' }}>ชื่อผู้ขายสินค้า/<br />ผู้ให้บริการ</th>
                            <th rowSpan={2} style={{ ...pthStyle, width: '14%' }}>เลขประจำตัวผู้เสียภาษีอากร<br />ของผู้ขายสินค้า/<br />ผู้ให้บริการ</th>
                            <th colSpan={2} style={pthStyle}>สถานประกอบการ *</th>
                            <th rowSpan={2} style={{ ...pthStyle, width: '14%' }}>มูลค่าสินค้า<br />หรือบริการ</th>
                            <th rowSpan={2} style={{ ...pthStyle, width: '12%' }}>จำนวนเงิน<br />ภาษีมูลค่าเพิ่ม</th>
                          </tr>
                          <tr>
                            <th style={{ ...pthStyle, width: '12%' }}>วัน เดือน ปี</th>
                            <th style={{ ...pthStyle, width: '12%' }}>เลขที่</th>
                            <th style={{ ...pthStyle, width: '8%' }}>สำนักงานใหญ่</th>
                            <th style={{ ...pthStyle, width: '6%' }}>สาขาที่</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageRows.length === 0 ? (
                            <tr>
                              <td colSpan={9} style={{ ...ptdStyle, textAlign: 'center', height: 200, color: '#999' }}>ไม่พบข้อมูล</td>
                            </tr>
                          ) : (
                            pageRows.map((row, idx) => {
                              const isCancelled = row.status === 'ยกเลิก'
                              const sourceStyle = SOURCE_STYLES[row.sourceType]
                              const dateVal = row.createDate || row.payDate
                              const dt = dateVal ? new Date(dateVal) : null
                              const dateStr = dt ? `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear() + 543}` : '-'
                              return (
                                <tr key={row.id} style={{ background: isCancelled ? '#fff5f5' : 'transparent' }}>
                                  <td style={{ ...ptdStyle, textAlign: 'center', fontSize: '8.5pt' }}>
                                    {p * ROWS_PER_PAGE + idx + 1}
                                  </td>
                                  <td style={{ ...ptdStyle, textAlign: 'center', fontSize: '8.5pt' }}>
                                    {dateStr}
                                  </td>
                                  <td style={{ ...ptdStyle, textAlign: 'center', fontSize: '7pt', whiteSpace: 'normal' }}>
                                    <div style={{ fontFamily: 'Kanit_B' }}>{row.documentNo || '-'}</div>
                                    <div style={{ color: sourceStyle.color }}>{row.documentLabel}</div>
                                    {row.referenceNo ? <div style={{ color: '#475569' }}>อ้างอิง {row.referenceNo}</div> : null}
                                    {isCancelled && <div style={{ color: '#dc2626', fontSize: '7pt', fontFamily: 'Kanit_B' }}>(ยกเลิก)</div>}
                                  </td>
                                  <td style={{ ...ptdStyle, textAlign: 'left', paddingLeft: 4, fontSize: '8.5pt' }}>
                                    {row.supplierName || '-'}
                                  </td>
                                  <td style={{ ...ptdStyle, textAlign: 'center', fontSize: '8.5pt' }}>{row.supplierIdcode || '-'}</td>
                                  <td style={{ ...ptdStyle, textAlign: 'center', fontSize: '8.5pt' }}>
                                    {storeInfo.branchCode || ''}
                                  </td>
                                  <td style={{ ...ptdStyle, textAlign: 'center', fontSize: '8.5pt' }}>
                                    {storeInfo.branchName && storeInfo.branchName !== 'สำนักงานใหญ่' ? storeInfo.branchCode : ''}
                                  </td>
                                  <td style={{ ...ptdStyle, textAlign: 'right', paddingRight: 6, fontSize: '8.5pt', fontFamily: 'Kanit_B' }}>
                                    {isCancelled ? '-' : fmtNum(Number(row.beforeVat || 0))}
                                  </td>
                                  <td style={{ ...ptdStyle, textAlign: 'right', paddingRight: 6, fontSize: '8.5pt', fontFamily: 'Kanit_B' }}>
                                    {isCancelled ? '-' : fmtNum(Number(row.vatAmount || 0))}
                                  </td>
                                </tr>
                              )
                            })
                          )}
                          {/* Blank rows */}
                          {blankCount > 0 && Array.from({ length: blankCount }).map((_, i) => (
                            <tr key={`blank-${i}`}>
                              <td style={ptdStyle}>&nbsp;</td>
                              <td style={ptdStyle}>&nbsp;</td>
                              <td style={ptdStyle}>&nbsp;</td>
                              <td style={ptdStyle}>&nbsp;</td>
                              <td style={ptdStyle}>&nbsp;</td>
                              <td style={ptdStyle}>&nbsp;</td>
                              <td style={ptdStyle}>&nbsp;</td>
                              <td style={ptdStyle}>&nbsp;</td>
                              <td style={ptdStyle}>&nbsp;</td>
                            </tr>
                          ))}
                        </tbody>
                        {isLastPage && (
                          <tfoot>
                            <tr style={{ fontFamily: 'Kanit_B' }}>
                              <td colSpan={7} style={{ ...ptdStyle, textAlign: 'right', paddingRight: 10, fontSize: '10pt' }}>รวม</td>
                              <td style={{ ...ptdStyle, textAlign: 'right', paddingRight: 6, fontSize: '10pt' }}>{fmtNum(totalBeforeVat)}</td>
                              <td style={{ ...ptdStyle, textAlign: 'right', paddingRight: 6, fontSize: '10pt' }}>{fmtNum(totalVat)}</td>
                            </tr>
                          </tfoot>
                        )}
                      </table>

                      {/* Footer */}
                      <div style={{ marginTop: 16, fontSize: '9pt', color: '#666', textAlign: 'center' }}>
                        พิมพ์วันที่ {fmtDateThai(new Date())} | {storeInfo.namestore} | หน้า {p + 1}/{totalPages}
                      </div>
                    </div>
                  )
                }
                return pages
              })()}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
        }
      `}</style>
    </div>
  )
}

function SummaryCard({ label, value, unit, color, bg }: { label: string, value: string, unit: string, color: string, bg: string }) {
  return (
    <div style={{
      flex: '1 1 180px', minWidth: 160, background: bg, borderRadius: 10,
      padding: '14px 18px', border: `1px solid ${color}20`,
      display: 'flex', flexDirection: 'column', gap: 4
    }}>
      <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontFamily: 'Kanit_B', fontSize: 20, color }}>{value}</span>
        <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#94a3b8' }}>{unit}</span>
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '10px 12px', fontSize: 13, fontFamily: 'Kanit_B', color: '#475569',
  borderBottom: '2px solid #e2e8f0', textAlign: 'center', whiteSpace: 'nowrap'
}

const tdStyle: React.CSSProperties = {
  padding: '8px 12px', fontSize: 13, borderBottom: '1px solid #f1f5f9',
  textAlign: 'center', whiteSpace: 'nowrap'
}

const pthStyle: React.CSSProperties = {
  border: '1px solid #000', padding: '4px 3px', textAlign: 'center',
  fontFamily: 'Kanit_B', fontSize: '8.5pt', lineHeight: '1.3',
  background: '#f9f9f9'
}

const ptdStyle: React.CSSProperties = {
  border: '1px solid #000', padding: '3px 2px', textAlign: 'center',
  fontSize: '8.5pt', lineHeight: '1.4'
}
