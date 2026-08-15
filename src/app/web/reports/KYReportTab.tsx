'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import axios from 'axios'
import { ClipboardList, Calendar as CalendarIcon, Printer, Search, FileText, RefreshCw, FileSpreadsheet } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import Modal_blrc from 'react-bootstrap/Modal'
import * as XLSX from 'xlsx'
import { getLocalStorageItem } from '@/utils/localStorage'

interface ReceiveRow {
  id: number
  orderfull?: string
  names?: string
  receive_date?: string | null
  order_date?: string | null
  totalRCAll?: number
}

interface RCItem {
  id: number
  company?: string
  codenames?: string
  itemcode?: string
  itemName?: string
  unit?: string
  qty?: number
  lot?: string
  dateExp?: string | null
  dateRC?: string | null
  namevender?: string
  type?: string
  subtype?: string
}

const docTypeOptions = [
  { value: 'ข.ย.9', label: 'ข.ย.9' },
  { value: 'ข.ย.10', label: 'ข.ย.10' },
  { value: 'ข.ย.11', label: 'ข.ย.11' },
  { value: 'ข.ย.12', label: 'ข.ย.12' },
  { value: 'ข.ย.13', label: 'ข.ย.13' },
]

const toThaiNumeral = (num: string): string => {
  const t: { [k: string]: string } = { '0': '๐', '1': '๑', '2': '๒', '3': '๓', '4': '๔', '5': '๕', '6': '๖', '7': '๗', '8': '๘', '9': '๙' }
  return num.replace(/[0-9]/g, (d) => t[d] || d)
}

const toThaiDocType = (docType: string): string => {
  const m = docType.match(/(\d+)$/)
  if (m) return `แบบ ข.ย. ${toThaiNumeral(m[1])}`
  return 'แบบ ข.ย. ๙'
}

const fmtDate = (d?: string | null) => {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return ''
  }
}

const todayStr = () => new Date().toISOString().slice(0, 10)
const monthAgoStr = () => {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

export default function KYReportTab() {
  const [docType, setDocType] = useState('ข.ย.9')
  const [filterMode, setFilterMode] = useState<'date' | 'order'>('date')
  const [startDate, setStartDate] = useState(monthAgoStr())
  const [endDate, setEndDate] = useState(todayStr())
  const [selectedOrder, setSelectedOrder] = useState('')

  const [receives, setReceives] = useState<ReceiveRow[]>([])
  const [allItems, setAllItems] = useState<RCItem[]>([])
  const [storeName, setStoreName] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')

  const company = useMemo(() => getLocalStorageItem('company_') || '', [])

  // Load store info & receives list (for order picker)
  useEffect(() => {
    const load = async () => {
      try {
        const [resStore, resRC] = await Promise.all([
          axios.get(`/api/setting/store/store?company=${company}`),
          axios.get(`/api/receive?company=${company}&sort=desc`),
        ])
        if (resStore.data?.[0]) setStoreName(resStore.data[0].namestore || '')
        setReceives(Array.isArray(resRC.data) ? resRC.data : [])
      } catch (e) {
        console.error(e)
      }
    }
    if (company) load()
  }, [company])

  const fetchItems = async () => {
    if (!company) return
    setLoading(true)
    setSearched(true)
    const sortItems = (arr: RCItem[]) => {
      const copy = [...arr]
      copy.sort((a, b) => {
        const ta = a.dateRC ? new Date(a.dateRC).getTime() : 0
        const tb = b.dateRC ? new Date(b.dateRC).getTime() : 0
        if (ta !== tb) return ta - tb
        return (a.id || 0) - (b.id || 0)
      })
      return copy
    }
    try {
      if (filterMode === 'order') {
        if (!selectedOrder) {
          setAllItems([])
          return
        }
        const res = await axios.get(`/api/dataitemlist?company=${company}&codenames=${encodeURIComponent(selectedOrder)}&docType=${encodeURIComponent(docType)}`)
        setAllItems(sortItems(Array.isArray(res.data) ? res.data : []))
      } else {
        const res = await axios.get(`/api/dataitemlist?company=${company}&docType=${encodeURIComponent(docType)}`)
        const data: RCItem[] = Array.isArray(res.data) ? res.data : []
        const start = startDate ? new Date(startDate + 'T00:00:00') : null
        const end = endDate ? new Date(endDate + 'T23:59:59') : null
        const filtered = data.filter((it) => {
          if (!it.dateRC) return false
          const d = new Date(it.dateRC)
          if (start && d < start) return false
          if (end && d > end) return false
          return true
        })
        setAllItems(sortItems(filtered))
      }
    } catch (e) {
      console.error(e)
      setAllItems([])
    } finally {
      setLoading(false)
    }
  }

  // Vendor lookup by codenames (orderfull) for items missing namevender
  const vendorByOrder = useMemo(() => {
    const map: Record<string, string> = {}
    receives.forEach((r) => { if (r.orderfull) map[r.orderfull] = r.names || '' })
    return map
  }, [receives])

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase()
    if (!q) return receives.slice(0, 200)
    return receives.filter((r) =>
      String(r.orderfull || '').toLowerCase().includes(q) ||
      String(r.names || '').toLowerCase().includes(q)
    ).slice(0, 200)
  }, [receives, orderSearch])

  const docTypeLabel = toThaiDocType(docType)

  const exportExcel = () => {
    if (allItems.length === 0) return
    const rows = allItems.map((it, idx) => ({
      'ลำดับ': idx + 1,
      'วันที่รับสินค้า': fmtDate(it.dateRC),
      'ชื่อผู้ขาย': it.namevender || vendorByOrder[it.codenames || ''] || '',
      'ชื่อยา': it.itemName || '',
      'เลขที่อักษร/Lot': it.lot || '',
      'จำนวน/ปริมาณ': it.qty ?? '',
      'หน่วย': it.unit || '',
      'เลขที่เอกสาร': it.codenames || '',
      'ประเภทเอกสาร': docType,
    }))
    const headerInfo = [
      [`บัญชีการซื้อยา - ${docTypeLabel}`],
      [storeName],
      [headerRangeText],
      [],
    ]
    const ws = XLSX.utils.aoa_to_sheet(headerInfo)
    XLSX.utils.sheet_add_json(ws, rows, { origin: 'A5' })
    ws['!cols'] = [
      { wch: 6 }, { wch: 14 }, { wch: 22 }, { wch: 40 },
      { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 12 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'KY Report')
    const safeDoc = docType.replace(/\./g, '')
    const stamp = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `KY-Report_${safeDoc}_${stamp}.xlsx`)
  }

  const headerRangeText = useMemo(() => {
    if (filterMode === 'order') {
      const r = receives.find((x) => x.orderfull === selectedOrder)
      return `เลขที่เอกสาร: ${selectedOrder || '-'}${r?.names ? ' / ' + r.names : ''}`
    }
    const fmt = (s: string) => {
      try { return new Date(s).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }) } catch { return s }
    }
    return `ช่วงวันที่: ${fmt(startDate)} - ${fmt(endDate)}`
  }, [filterMode, startDate, endDate, selectedOrder, receives])

  return (
    <div style={{ fontFamily: 'Kanit' }}>
      {/* Header */}
      <div style={{
        background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: 16,
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
      }}>
        <ClipboardList size={20} color="#92400e" />
        <div>
          <div style={{ fontFamily: 'Kanit_B', color: '#92400e', fontSize: 16 }}>รายงาน ข.ย. (บัญชีการซื้อยา)</div>
          <div style={{ fontSize: 12, color: '#a16207' }}>ดึงข้อมูลรายการรับสินค้าตามประเภทเอกสาร โดยเลือกตามช่วงวันที่ หรือ เลือกเป็น Order</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, marginBottom: 14, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 12, alignItems: 'end' }}>
          {/* Doc type */}
          <div style={{ gridColumn: 'span 3' }}>
            <label style={{ fontSize: 12, color: '#475569', marginBottom: 6, display: 'block' }}>ประเภทเอกสาร</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontFamily: 'Kanit', fontSize: 13 }}
            >
              {docTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Mode */}
          <div style={{ gridColumn: 'span 3' }}>
            <label style={{ fontSize: 12, color: '#475569', marginBottom: 6, display: 'block' }}>โหมดการกรอง</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setFilterMode('date')}
                style={{
                  flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 13, fontFamily: 'Kanit',
                  border: filterMode === 'date' ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                  background: filterMode === 'date' ? '#fef3c7' : 'white',
                  color: filterMode === 'date' ? '#92400e' : '#475569', cursor: 'pointer',
                }}
              >
                <CalendarIcon size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />ช่วงวันที่
              </button>
              <button
                onClick={() => setFilterMode('order')}
                style={{
                  flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 13, fontFamily: 'Kanit',
                  border: filterMode === 'order' ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                  background: filterMode === 'order' ? '#fef3c7' : 'white',
                  color: filterMode === 'order' ? '#92400e' : '#475569', cursor: 'pointer',
                }}
              >
                <FileText size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />เลือก Order
              </button>
            </div>
          </div>

          {filterMode === 'date' ? (
            <>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: 12, color: '#475569', marginBottom: 6, display: 'block' }}>วันที่เริ่ม</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontFamily: 'Kanit', fontSize: 13 }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: 12, color: '#475569', marginBottom: 6, display: 'block' }}>วันที่สิ้นสุด</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontFamily: 'Kanit', fontSize: 13 }} />
              </div>
            </>
          ) : (
            <div style={{ gridColumn: 'span 4' }}>
              <label style={{ fontSize: 12, color: '#475569', marginBottom: 6, display: 'block' }}>เลือกเอกสารรับสินค้า</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder="ค้นหา order / ผู้ขาย"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontFamily: 'Kanit', fontSize: 13 }}
                />
                <select
                  value={selectedOrder}
                  onChange={(e) => setSelectedOrder(e.target.value)}
                  style={{ flex: 2, padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontFamily: 'Kanit', fontSize: 13 }}
                >
                  <option value="">— เลือกเอกสาร —</option>
                  {filteredOrders.map((r) => (
                    <option key={r.id} value={r.orderfull || ''}>
                      {r.orderfull} {r.names ? `· ${r.names}` : ''} {r.receive_date ? `· ${fmtDate(r.receive_date)}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div style={{ gridColumn: 'span 2', display: 'flex', gap: 6 }}>
            <button
              onClick={fetchItems}
              disabled={loading}
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(90deg,#f59e0b,#d97706)', color: 'white', fontFamily: 'Kanit_B', fontSize: 13,
              }}
            >
              {loading ? <RefreshCw size={14} className="spin" /> : <Search size={14} />} แสดงรายงาน
            </button>
          </div>
        </div>
      </div>

      {/* Result table */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', background: '#fef3c7', borderBottom: '1px solid #fde68a',
        }}>
          <div style={{ fontFamily: 'Kanit_B', color: '#92400e', fontSize: 14 }}>
            ผลการแสดง {docType} · {allItems.length} รายการ · {headerRangeText}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={exportExcel}
              disabled={allItems.length === 0}
              style={{
                padding: '7px 14px', borderRadius: 8, border: 'none', cursor: allItems.length === 0 ? 'not-allowed' : 'pointer',
                background: allItems.length === 0 ? '#e2e8f0' : '#2A6AAA', color: 'white', fontFamily: 'Kanit', fontSize: 13,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <FileSpreadsheet size={14} /> Export Excel
            </button>
            <button
              onClick={() => setShowPrint(true)}
              disabled={allItems.length === 0}
              style={{
                padding: '7px 14px', borderRadius: 8, border: 'none', cursor: allItems.length === 0 ? 'not-allowed' : 'pointer',
                background: allItems.length === 0 ? '#e2e8f0' : '#0d9488', color: 'white', fontFamily: 'Kanit', fontSize: 13,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <Printer size={14} /> พิมพ์รายงาน
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '60vh' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Kanit', fontSize: 13 }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f8fafc' }}>
              <tr>
                <th style={th}>ลำดับ</th>
                <th style={th}>วันที่รับสินค้า</th>
                <th style={th}>ชื่อผู้ขาย</th>
                <th style={th}>ชื่อยา</th>
                <th style={th}>เลขที่อักษร/Lot</th>
                <th style={{ ...th, textAlign: 'center' }}>จำนวน/ปริมาณ</th>
                <th style={th}>เลขที่เอกสาร</th>
              </tr>
            </thead>
            <tbody>
              {allItems.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>
                    {searched ? 'ไม่พบข้อมูล' : 'กรุณาเลือกเงื่อนไขแล้วกด “แสดงรายงาน”'}
                  </td>
                </tr>
              ) : (
                allItems.map((it, idx) => (
                  <tr key={it.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ ...td, textAlign: 'center' }}>{idx + 1}</td>
                    <td style={td}>{fmtDate(it.dateRC)}</td>
                    <td style={td}>{it.namevender || vendorByOrder[it.codenames || ''] || ''}</td>
                    <td style={td}>{it.itemName || ''}</td>
                    <td style={td}>{it.lot || ''}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{it.qty ?? ''}</td>
                    <td style={{ ...td, color: '#1E5088' }}>{it.codenames || ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <KYPrintModal
        show={showPrint}
        onHide={() => setShowPrint(false)}
        items={allItems}
        vendorByOrder={vendorByOrder}
        currentDocTypeLabel={docTypeLabel}
        storeName={storeName}
        rangeText={headerRangeText}
      />

      <style jsx>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

const th: React.CSSProperties = { textAlign: 'left', padding: '10px 8px', fontFamily: 'Kanit_B', fontSize: 12, color: '#475569', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '8px', verticalAlign: 'middle', color: '#0f172a' }

function KYPrintModal({ show, onHide, items, vendorByOrder, currentDocTypeLabel, storeName, rangeText }: {
  show: boolean
  onHide: () => void
  items: RCItem[]
  vendorByOrder: Record<string, string>
  currentDocTypeLabel: string
  storeName: string
  rangeText: string
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const reactToPrintFn = useReactToPrint({ contentRef, documentTitle: currentDocTypeLabel })

  return (
    <Modal_blrc show={show} onHide={onHide} size="xl" scrollable aria-labelledby="ky-print-modal">
      <Modal_blrc.Header closeButton>
        <Modal_blrc.Title id="ky-print-modal">
          <div style={{ fontSize: 13, fontFamily: 'Kanit' }}>รายงานบัญชีการซื้อยา</div>
        </Modal_blrc.Title>
      </Modal_blrc.Header>
      <Modal_blrc.Body style={{ backgroundColor: 'grey' }}>
        <div className="paper a4 col-12" id="print-area"
             style={{ justifySelf: 'center', backgroundColor: 'white', marginLeft: 30, marginRight: 30, position: 'relative' }}
             ref={contentRef}>
          <div style={{ marginLeft: 5, marginRight: 5 }}>
            <table className="table table-sm items">
              <thead>
                <tr>
                  <td colSpan={8} style={{ border: 'none', padding: 0 }}>
                    <div style={{ position: 'relative', marginBottom: 10 }}>
                      <div style={{ position: 'absolute', top: 0, right: 0, fontFamily: 'kanit', fontSize: 12, border: '1px solid black', padding: '2px 10px' }}>{currentDocTypeLabel}</div>
                      <div style={{ textAlign: 'center', fontFamily: 'kanit', fontSize: 13, marginTop: 10 }}>บัญชีการซื้อยา</div>
                      <div style={{ textAlign: 'center', fontFamily: 'Kanit_B', fontSize: 15 }}>{storeName}</div>
                      <div style={{ textAlign: 'center', fontFamily: 'kanit', fontSize: 9 }}>(ชื่อสถานที่ขายยา)</div>
                      <div style={{ textAlign: 'center', fontFamily: 'kanit', fontSize: 10, marginTop: 4, color: '#374151' }}>{rangeText}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={hCell('3%')}>ลำดับ</td>
                  <td style={hCell('10%')}>วันที่รับสินค้า</td>
                  <td style={hCell('22%')}>ชื่อผู้ขาย</td>
                  <td style={hCell('30%')}>ชื่อยา</td>
                  <td style={hCell('8%')}>เลขที่อักษรของครั้งที่ผลิต</td>
                  <td style={hCell('5%')}>จำนวน/ปริมาณ</td>
                  <td style={hCell('11%')}>ลงลายมือชื่อผู้มีหน้าที่ปฏิบัติการ</td>
                  <td style={hCell('11%')}>หมายเหตุ</td>
                </tr>
              </thead>
              <tbody>
                {items.map((a, index) => (
                  <tr key={a.id}>
                    <td style={bCell('center')}>{index + 1}</td>
                    <td style={bCell('left')}>{fmtDate(a.dateRC)}</td>
                    <td style={bCell('left')}>{a.namevender || vendorByOrder[a.codenames || ''] || ''}</td>
                    <td style={bCell('left')}>{a.itemName || ''}</td>
                    <td style={bCell('left')}>{a.lot || ''}</td>
                    <td style={bCell('center')}>{a.qty ?? ''}</td>
                    <td style={bCell('center')}></td>
                    <td style={bCell('center')}></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <style jsx>{`
            table.items { width: 100%; border-collapse: collapse; font-size: 12px; }
            table.items th, table.items td { padding: 4px 4px; border-bottom: 1px solid #686868ff; }
            @media print {
              @page { size: A4 landscape; margin: 10mm; }
              thead { display: table-header-group; }
              tr { page-break-inside: avoid; }
              button { display: none !important; }
            }
          `}</style>
        </div>
      </Modal_blrc.Body>
      <Modal_blrc.Footer>
        <button className="btn btn-primary" style={{ width: 80, height: 35, fontSize: 15, fontFamily: 'Kanit' }} onClick={reactToPrintFn}>Print</button>
        <button className="btn btn-secondary" style={{ width: 80, height: 35, fontSize: 15, fontFamily: 'Kanit' }} onClick={onHide}>ปิด</button>
      </Modal_blrc.Footer>
    </Modal_blrc>
  )
}

const hCell = (w: string): React.CSSProperties => ({ fontFamily: 'kanit', fontSize: 10, textAlign: 'left', height: 15, width: w })
const bCell = (align: 'left' | 'center'): React.CSSProperties => ({ fontFamily: 'kanit', fontSize: 12, height: 25, textAlign: align })
