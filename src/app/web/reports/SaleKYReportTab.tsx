'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import axios from 'axios'
import { cachedGet } from '@/lib/catalogCache'
import { ClipboardList, Printer, Search, Calendar as CalendarIcon, RefreshCw, Scissors } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { getLocalStorageItem } from '@/utils/localStorage'
import CutLotModal from '@/components/CutLotModal'

type FormKey = 'ky10' | 'ky11' | 'ky12' | 'ky13'

const forms: { key: FormKey; label: string; badge: string }[] = [
  { key: 'ky10', label: 'ข.ย.10', badge: 'แบบ ข.ย. ๑๐' },
  { key: 'ky11', label: 'ข.ย.11', badge: 'แบบ ข.ย. ๑๑' },
  { key: 'ky12', label: 'ข.ย.12', badge: 'แบบ ข.ย. ๑๒' },
  { key: 'ky13', label: 'ข.ย.13', badge: 'แบบ ข.ย. ๑๓' },
]

// โทเคนจำแนกประเภท ข.ย. ของสินค้า (รองรับ "ขย.10", "ข.ย.10" และค่ารวม)
const kyTokens: Record<string, string[]> = {
  ky10: ['ขย.10', 'ข.ย.10'],
  ky11: ['ขย.11', 'ข.ย.11'],
  ky12: ['ขย.12', 'ข.ย.12'],
  ky13: ['ขย.13', 'ข.ย.13'],
}

interface RcRow {
  id: number
  itemcode?: string
  itemName?: string
  namevender?: string
  lot?: string
  qty?: number
  unit?: string
  dateRC?: string | null
}

const fmtDate = (d?: string | null) => {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }) } catch { return '' }
}

const num = (v: any) => Number(v) || 0
const effQty = (s: any) => (s.subqty == null || num(s.subqty) === 0) ? num(s.qty) : num(s.subqty)
const effUnit = (s: any) => (s.subqty == null || num(s.subqty) === 0) ? (s.unit || '') : (s.subunit || '')

interface LedgerRow { date: string; qty: string; customer: string; pharmacist: string }
interface Ledger12Row { date: string; userName: string; drugQty: string; pharmacist: string }

// จำนวนแถวต่อ 1 หน้ากระดาษ A4 แนวนอน (รวมหัวฟอร์ม) — lot ที่ขายเกินจะขึ้นหน้าใหม่
const ROWS_PER_PAGE = 12

function chunkRows<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]]
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// สร้างแถวบัญชีการขายของ lot นั้น ๆ (กรองตามช่วงวันที่ขาย)
function buildLedgerRows(sales: any[], lot: string, start: Date | null, end: Date | null): LedgerRow[] {
  let active = sales.filter((s) => s.statuss !== 'ยกเลิก')
  if (start || end) {
    active = active.filter((s) => {
      if (!s.createDate) return false
      const d = new Date(s.createDate)
      if (start && d < start) return false
      if (end && d > end) return false
      return true
    })
  }
  const hasLotInfo = active.some((s) => s.lot_receive1 || s.lot_receive2 || s.lot_receive3)
  const rows: { s: any; qty: number }[] = []
  if (hasLotInfo && lot) {
    active.forEach((s) => {
      let q = 0
      if ((s.lot_receive1 || '') === lot) q += num(s.qty_lot1)
      if ((s.lot_receive2 || '') === lot) q += num(s.qty_lot2)
      if ((s.lot_receive3 || '') === lot) q += num(s.qty_lot3)
      if (q > 0) rows.push({ s, qty: q })
    })
  } else {
    active.forEach((s) => rows.push({ s, qty: effQty(s) }))
  }
  return rows
    .sort((a, b) => new Date(a.s.createDate || 0).getTime() - new Date(b.s.createDate || 0).getTime())
    .map(({ s, qty }) => ({
      date: fmtDate(s.createDate),
      qty: `${qty} ${effUnit(s)}`.trim(),
      customer: s.name_customer || '',
      pharmacist: s.pharmacy || s.person || '',
    }))
}

// เส้นว่างสำหรับเขียน (หรือแสดงค่า)
const Line = ({ width, flex }: { width?: number | string; flex?: number }) => (
  <span style={{ display: 'inline-block', flex: flex ?? (width ? undefined : 1), width, borderBottom: '1px dotted #555', minWidth: 30, height: 15, margin: '0 4px' }} />
)
// เส้นที่มีค่าข้อมูล
const LineVal = ({ value, width, flex, align = 'center' }: { value?: React.ReactNode; width?: number | string; flex?: number; align?: 'left' | 'center' }) => (
  <span style={{
    display: 'inline-block', flex: flex ?? (width ? undefined : 1), width, borderBottom: '1px solid #111', minWidth: 30, height: 17,
    margin: '0 4px', textAlign: align, fontFamily: 'Kanit_B', fontSize: 12, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  }}>{value ?? ''}</span>
)

const border = '1px solid #000'
const thCell: React.CSSProperties = { border, padding: '6px 4px', fontSize: 12, fontFamily: 'Kanit_B', fontWeight: 700, textAlign: 'center', verticalAlign: 'middle' }
const bodyCell: React.CSSProperties = { border, height: 300 }
const rowCell: React.CSSProperties = { border, height: 28, padding: '3px 6px', fontSize: 12, fontFamily: 'Kanit', color: '#111', verticalAlign: 'middle' }
const fieldRow: React.CSSProperties = { display: 'flex', alignItems: 'flex-end', flexWrap: 'nowrap', fontSize: 13, marginTop: 6, gap: 2 }

const paperStyle: React.CSSProperties = {
  background: 'white', width: 1000, maxWidth: '100%', margin: '0 auto 24px', padding: '32px 36px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.2)', color: '#111', fontFamily: 'Kanit',
}

// บรรทัดชื่อ/ที่อยู่สถานที่ขายยา
const PlaceLine = ({ place, label }: { place: string; label: string }) => (
  <div style={{ textAlign: 'center', marginTop: 8 }}>
    <div style={{ display: 'inline-block', minWidth: 440, maxWidth: '85%', borderBottom: '1px dotted #555', fontSize: 13, fontFamily: 'Kanit_B', paddingBottom: 2, lineHeight: 1.4 }}>
      {place || ' '}
    </div>
    <div style={{ fontSize: 11, color: '#374151' }}>{label}</div>
  </div>
)

export default function SaleKYReportTab() {
  const [selected, setSelected] = useState<FormKey>('ky10')
  const [storeName, setStoreName] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [receives, setReceives] = useState<RcRow[]>([])
  const [loading, setLoading] = useState(true)

  // ช่วงวันที่รับสินค้า
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [salesByCode, setSalesByCode] = useState<Record<string, any[]>>({})

  // ตัวเลือกซ่อนข้อมูลในตาราง
  const [hideCustomer, setHideCustomer] = useState(false)
  const [hidePharmacist, setHidePharmacist] = useState(false)

  // ตัด Lot ย้อนหลัง
  const [showCutLot, setShowCutLot] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)
  const current = forms.find((f) => f.key === selected)!
  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: current.badge,
    pageStyle: `
      @page { size: A4 landscape; margin: 8mm; }
      @media print {
        html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .kypage { box-shadow: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; break-inside: avoid; page-break-inside: avoid; break-after: page; page-break-after: always; }
        .kypage:last-child { break-after: auto; page-break-after: auto; }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; break-inside: avoid; }
        thead { display: table-header-group; }
        button { display: none !important; }
      }
    `,
  })

  const company = useMemo(() => getLocalStorageItem('company_') || '', [])

  useEffect(() => {
    if (!company) return
    const load = async () => {
      setLoading(true)
      const [resStore, resProd, resRC] = await Promise.allSettled([
        axios.get(`/api/setting/store/store?company=${company}`),
        cachedGet(`/api/datalist?company=${company}&fields=list`),
        axios.get(`/api/dataitemlist?company=${company}`),
      ])
      if (resStore.status === 'fulfilled') {
        const s = resStore.value.data?.[0]
        if (s) { setStoreName(s.namestore || ''); setStoreAddress(s.address || '') }
      }
      setProducts(resProd.status === 'fulfilled' && Array.isArray(resProd.value.data) ? resProd.value.data : [])
      setReceives(resRC.status === 'fulfilled' && Array.isArray(resRC.value.data) ? resRC.value.data : [])
      setLoading(false)
    }
    load()
  }, [company])

  const placeText = [storeName, storeAddress].filter(Boolean).join('  ')
  const rangeText = (startDate || endDate)
    ? `ระหว่างวันที่ ${fmtDate(startDate) || '...'} - ${fmtDate(endDate) || '...'}`
    : ''

  const productByCode = useMemo(() => {
    const m: Record<string, any> = {}
    products.forEach((p) => { if (p.code) m[String(p.code)] = p })
    return m
  }, [products])

  // รายการ lot ที่รับเข้า ของสินค้า ข.ย.10 / ข.ย.11 (ทั้งหมด — กรองวันที่ขายภายหลัง)
  const lots = useMemo(() => {
    const tokens = kyTokens[selected]
    if (!tokens) return []
    return receives
      .filter((r) => {
        const prod = productByCode[String(r.itemcode)]
        if (!prod) return false
        const tv = String(prod.type || '')
        const sv = String(prod.subtype || '')
        if (!tokens.some((t) => tv.includes(t) || sv.includes(t))) return false
        return true
      })
      .map((r) => {
        const prod = productByCode[String(r.itemcode)]
        return {
          ...r,
          productName: prod?.ProductName || r.itemName || '',
          maker: prod?.maker || '',
          qty_unit: prod?.qty_unit || '',
        }
      })
      .sort((a, b) => new Date(a.dateRC || 0).getTime() - new Date(b.dateRC || 0).getTime())
  }, [selected, receives, productByCode])

  // จับคู่ lot กับรายการขาย (กรองตามช่วงวันที่ขาย) — แสดงเฉพาะ lot ที่มีการขายในช่วงนั้น
  const lotsWithRows = useMemo(() => {
    const start = startDate ? new Date(startDate + 'T00:00:00') : null
    const end = endDate ? new Date(endDate + 'T23:59:59') : null
    const result = lots.map((r) => ({
      lot: r,
      rows: buildLedgerRows(salesByCode[String(r.itemcode)] || [], r.lot || '', start, end),
    }))
    if (start || end) return result.filter((x) => x.rows.length > 0)
    return result
  }, [lots, salesByCode, startDate, endDate])

  // ดึงข้อมูลการขายของสินค้า ข.ย.10/11/12 แล้วค้นหา
  const onSearch = async () => {
    setSearching(true)
    const allTokens = [...kyTokens.ky10, ...kyTokens.ky11, ...kyTokens.ky12]
    const codes = Array.from(new Set(
      products
        .filter((p: any) => {
          const tv = String(p.type || '')
          const sv = String(p.subtype || '')
          return allTokens.some((t) => tv.includes(t) || sv.includes(t))
        })
        .map((p: any) => String(p.code))
        .filter(Boolean)
    ))
    const results = await Promise.allSettled(
      codes.map((c) => axios.get(`/api/sale_cal/sale_list_item?company=${company}&code_product=${encodeURIComponent(c)}`))
    )
    const map: Record<string, any[]> = {}
    codes.forEach((c, i) => {
      const r = results[i]
      map[c] = r.status === 'fulfilled' && Array.isArray(r.value.data) ? r.value.data : []
    })
    setSalesByCode(map)
    setSearching(false)
    setSearched(true)
  }

  // ข.ย.12 — รายการขายแบบเรียง (ไม่แยก lot) ตามช่วงวันที่ขาย
  const sale12Rows = useMemo(() => {
    if (selected !== 'ky12') return []
    const tokens = kyTokens.ky12
    const start = startDate ? new Date(startDate + 'T00:00:00') : null
    const end = endDate ? new Date(endDate + 'T23:59:59') : null
    const out: { date: string; userName: string; drugQty: string; pharmacist: string; _t: number }[] = []
    Object.entries(salesByCode).forEach(([code, sales]) => {
      const prod = productByCode[code]
      if (!prod) return
      const tv = String(prod.type || '')
      const sv = String(prod.subtype || '')
      if (!tokens.some((t) => tv.includes(t) || sv.includes(t))) return
      sales.forEach((s) => {
        if (s.statuss === 'ยกเลิก') return
        if (start || end) {
          if (!s.createDate) return
          const d = new Date(s.createDate)
          if (start && d < start) return
          if (end && d > end) return
        }
        out.push({
          date: fmtDate(s.createDate),
          userName: s.name_customer || '',
          drugQty: `${s.name_product || prod.ProductName || ''} : ${effQty(s)} ${effUnit(s)}`.trim(),
          pharmacist: s.pharmacy || s.person || '',
          _t: new Date(s.createDate || 0).getTime(),
        })
      })
    })
    return out.sort((a, b) => a._t - b._t)
  }, [selected, salesByCode, productByCode, startDate, endDate])

  const isFillable = selected === 'ky10' || selected === 'ky11' || selected === 'ky12'

  return (
    <div style={{
      backgroundColor: 'white', borderRadius: 16, boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
      border: '1px solid #e2e8f0', overflow: 'hidden', height: '88vh', display: 'flex', flexDirection: 'column', fontFamily: 'Kanit',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#f43f5e 0%,#be123c 100%)', padding: '14px 24px',
        display: 'flex', alignItems: 'center', gap: 10, color: 'white', flexShrink: 0,
      }}>
        <ClipboardList size={20} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 16, fontFamily: 'Kanit_B' }}>รายงาน ข.ย. (บัญชีการขายยา)</span>
          <span style={{ fontSize: 11, opacity: 0.9 }}>เลือกแบบฟอร์มบัญชีการขายยา ข.ย.10–13</span>
        </div>
        <button
          onClick={() => setShowCutLot(true)}
          title="กำหนด Lot ให้บิลขายย้อนหลัง (FIFO)"
          style={{
            marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.5)', cursor: 'pointer',
            background: 'rgba(255,255,255,0.15)', color: 'white', fontFamily: 'Kanit_B', fontSize: 13,
          }}
        >
          <Scissors size={16} /> ตัด Lot ย้อนหลัง
        </button>
      </div>

      {/* Toolbar: form buttons + date search + print */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderBottom: '1px solid #f1f5f9', background: '#fff5f6', flexWrap: 'wrap' }}>
        {forms.map((f) => (
          <button
            key={f.key}
            onClick={() => setSelected(f.key)}
            style={{
              padding: '7px 18px', borderRadius: 8, fontFamily: 'Kanit_B', fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
              background: selected === f.key ? 'linear-gradient(135deg,#f43f5e,#be123c)' : 'white',
              color: selected === f.key ? 'white' : '#64748b',
              border: selected === f.key ? 'none' : '1px solid #fecdd3',
              boxShadow: selected === f.key ? '0 3px 8px rgba(244,63,94,0.25)' : 'none',
            }}
          >
            {f.label}
          </button>
        ))}

        {isFillable && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 14, paddingLeft: 14, borderLeft: '1px solid #fecdd3', flexWrap: 'wrap' }}>
            <CalendarIcon size={15} color="#be123c" />
            <span style={{ fontSize: 12, color: '#be123c', fontFamily: 'Kanit_B' }}>วันที่ขาย</span>
            <input type="date" lang="en-GB" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #fda4af', fontSize: 12, fontFamily: 'Kanit' }} />
            <span style={{ color: '#be123c' }}>-</span>
            <input type="date" lang="en-GB" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #fda4af', fontSize: 12, fontFamily: 'Kanit' }} />
            <button
              onClick={onSearch}
              disabled={loading || searching}
              style={{ padding: '6px 16px', borderRadius: 8, border: 'none', cursor: (loading || searching) ? 'wait' : 'pointer', background: 'linear-gradient(90deg,#f43f5e,#be123c)', color: 'white', fontFamily: 'Kanit_B', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              {(loading || searching) ? <RefreshCw size={13} className="spin" /> : <Search size={13} />} ค้นหา
            </button>
            {searched && (
              <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'Kanit_B' }}>พบ {lotsWithRows.length} รายการ</span>
            )}
          </div>
        )}

        {isFillable && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 14, paddingLeft: 14, borderLeft: '1px solid #fecdd3' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'Kanit', color: '#475569', cursor: 'pointer' }}>
              <input type="checkbox" checked={hideCustomer} onChange={(e) => setHideCustomer(e.target.checked)} style={{ cursor: 'pointer' }} />
              ปิดชื่อ-สกุล
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'Kanit', color: '#475569', cursor: 'pointer' }}>
              <input type="checkbox" checked={hidePharmacist} onChange={(e) => setHidePharmacist(e.target.checked)} style={{ cursor: 'pointer' }} />
              ปิดชื่อ-สกุล เภสัชกร
            </label>
          </div>
        )}

        <button
          onClick={reactToPrintFn}
          style={{ marginLeft: 'auto', padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#0d9488', color: 'white', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Printer size={14} /> พิมพ์ฟอร์ม
        </button>
      </div>

      {/* Form paper(s) */}
      <div style={{ flex: 1, overflow: 'auto', background: '#94a3b8', padding: 24 }}>
        <div ref={contentRef}>
          {/* ข.ย.10 / ข.ย.11 — แยกหน้าตาม lot */}
          {(selected === 'ky10' || selected === 'ky11') && (
            searched && lotsWithRows.length > 0 ? (
              lotsWithRows.map(({ lot: r, rows: allRows }) => {
                const pages = chunkRows(allRows, ROWS_PER_PAGE)
                return pages.map((pageRows, pi) => (
                  <div className="kypage" key={`${r.id}-${pi}`} style={paperStyle}>
                    {selected === 'ky10'
                      ? <FormKY1011 title="บัญชีการขายยาควบคุมพิเศษ" badge={current.badge} place={placeText} rangeText={rangeText} data={r} rows={pageRows} pageInfo={{ current: pi + 1, total: pages.length }} hideCustomer={hideCustomer} hidePharmacist={hidePharmacist} />
                      : <FormKY1011 title="บัญชีการขายยาอันตราย เฉพาะรายการยาที่เลขาธิการคณะกรรมการอาหารและยากำหนด" badge={current.badge} place={placeText} rangeText={rangeText} data={r} rows={pageRows} pageInfo={{ current: pi + 1, total: pages.length }} hideCustomer={hideCustomer} hidePharmacist={hidePharmacist} />}
                  </div>
                ))
              })
            ) : (
              <div className="kypage" style={paperStyle}>
                {searched && <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginBottom: 10 }}>ไม่พบรายการขายในช่วงวันที่ที่เลือก — แสดงแบบฟอร์มเปล่า</div>}
                {selected === 'ky10'
                  ? <FormKY1011 title="บัญชีการขายยาควบคุมพิเศษ" badge={current.badge} place={placeText} rangeText={rangeText} data={null} rows={[]} pageInfo={{ current: 1, total: 1 }} hideCustomer={hideCustomer} hidePharmacist={hidePharmacist} />
                  : <FormKY1011 title="บัญชีการขายยาอันตราย เฉพาะรายการยาที่เลขาธิการคณะกรรมการอาหารและยากำหนด" badge={current.badge} place={placeText} rangeText={rangeText} data={null} rows={[]} pageInfo={{ current: 1, total: 1 }} hideCustomer={hideCustomer} hidePharmacist={hidePharmacist} />}
              </div>
            )
          )}

          {/* ข.ย.12 — รายการขายแบบเรียง */}
          {selected === 'ky12' && (
            (() => {
              const pages = searched ? chunkRows(sale12Rows, ROWS_PER_PAGE) : [[]]
              return pages.map((pageRows, pi) => (
                <div className="kypage" key={`12-${pi}`} style={paperStyle}>
                  {pi === 0 && searched && sale12Rows.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginBottom: 10 }}>ไม่พบรายการขายในช่วงวันที่ที่เลือก — แสดงแบบฟอร์มเปล่า</div>
                  )}
                  <FormKY12 badge={current.badge} place={placeText} rangeText={rangeText} rows={pageRows} pageInfo={{ current: pi + 1, total: pages.length }} hideCustomer={hideCustomer} hidePharmacist={hidePharmacist} />
                </div>
              ))
            })()
          )}

          {/* ข.ย.13 — แบบฟอร์มเปล่า */}
          {selected === 'ky13' && (
            <div className="kypage" style={paperStyle}>
              <FormKY13 badge={current.badge} place={placeText} />
            </div>
          )}
        </div>
      </div>

      <CutLotModal
        show={showCutLot}
        onClose={() => setShowCutLot(false)}
        company={company}
        person={getLocalStorageItem('person_') || ''}
        onComplete={() => { if (searched) onSearch() }}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      ` }} />
    </div>
  )
}

interface FilledData {
  productName?: string
  namevender?: string
  maker?: string
  qty_unit?: string
  lot?: string
  qty?: number
  unit?: string
  dateRC?: string | null
}

/* ---------- แบบ ข.ย.10 / ข.ย.11 ---------- */
function FormKY1011({ title, badge, place, rangeText, data, rows, pageInfo, hideCustomer, hidePharmacist }: { title: string; badge: string; place: string; rangeText: string; data: FilledData | null; rows: LedgerRow[]; pageInfo: { current: number; total: number }; hideCustomer: boolean; hidePharmacist: boolean }) {
  const fillerCount = Math.max(0, ROWS_PER_PAGE - rows.length)
  // เลขลำดับต่อเนื่องข้ามหน้า
  const startNo = (pageInfo.current - 1) * ROWS_PER_PAGE
  return (
    <div>
      <div style={{ textAlign: 'right', fontSize: 13, fontFamily: 'Kanit_B' }}>
        {badge}
        {pageInfo.total > 1 && <div style={{ fontSize: 11, fontFamily: 'Kanit', color: '#374151', marginTop: 2 }}>หน้า {pageInfo.current} / {pageInfo.total}</div>}
      </div>
      <div style={{ textAlign: 'center', fontSize: 16, fontFamily: 'Kanit_B', marginTop: 2 }}>{title}</div>
      <PlaceLine place={place} label="(ชื่อสถานที่ขายยา)" />
      {rangeText && <div style={{ textAlign: 'center', fontSize: 12, fontFamily: 'Kanit_B', color: '#111', marginTop: 4 }}>{rangeText}</div>}

      {/* Header fields (เติมจากข้อมูลการรับเข้า) */}
      <div style={fieldRow}><span>ชื่อยา</span><LineVal value={data?.productName} align="left" /></div>
      <div style={fieldRow}>
        <span>ชื่อผู้ผลิต / ผู้นำเข้า</span><LineVal value={data?.maker} flex={2} />
        <span>เลขที่หรืออักษรของครั้งที่ผลิต</span><LineVal value={data?.lot} flex={2} />
        <span>ขนาดบรรจุ</span><LineVal value={data?.qty_unit} flex={1} />
      </div>
      <div style={fieldRow}>
        <span>ได้มาจาก</span><LineVal value={data?.namevender} flex={2} />
        <span>จำนวนรับ</span><LineVal value={data ? `${data.qty ?? ''} ${data.unit ?? ''}`.trim() : undefined} flex={2} />
        <span>วันที่รับ</span><LineVal value={data ? fmtDate(data.dateRC) : undefined} flex={2} />
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 14 }}>
        <thead>
          <tr>
            <th style={{ ...thCell, width: '8%' }}>ลำดับที่</th>
            <th style={{ ...thCell, width: '13%' }}>วัน เดือน ปี<br />ที่ขาย</th>
            <th style={{ ...thCell, width: '22%' }}>จำนวน / ปริมาณที่ขาย</th>
            <th style={{ ...thCell, width: '24%' }}>ชื่อ - สกุล ผู้ซื้อ</th>
            <th style={{ ...thCell, width: '21%' }}>ลายมือชื่อ<br />ผู้มีหน้าที่ปฏิบัติการ</th>
            <th style={{ ...thCell, width: '12%' }}>หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td style={{ ...rowCell, textAlign: 'center' }}>{startNo + i + 1}</td>
              <td style={{ ...rowCell, textAlign: 'center' }}>{row.date}</td>
              <td style={{ ...rowCell, textAlign: 'center' }}>{row.qty}</td>
              <td style={{ ...rowCell, textAlign: 'left' }}>{hideCustomer ? '' : row.customer}</td>
              <td style={{ ...rowCell, textAlign: 'center' }}>{hidePharmacist ? '' : row.pharmacist}</td>
              <td style={rowCell} />
            </tr>
          ))}
          {Array.from({ length: fillerCount }).map((_, i) => (
            <tr key={`f${i}`}>
              <td style={rowCell} /><td style={rowCell} /><td style={rowCell} />
              <td style={rowCell} /><td style={rowCell} /><td style={rowCell} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- แบบ ข.ย.12 ---------- */
function FormKY12({ badge, place, rangeText, rows, pageInfo, hideCustomer, hidePharmacist }: { badge: string; place: string; rangeText: string; rows: Ledger12Row[]; pageInfo: { current: number; total: number }; hideCustomer: boolean; hidePharmacist: boolean }) {
  const fillerCount = Math.max(0, ROWS_PER_PAGE - rows.length)
  const startNo = (pageInfo.current - 1) * ROWS_PER_PAGE
  return (
    <div>
      <div style={{ textAlign: 'right', fontSize: 13, fontFamily: 'Kanit_B' }}>
        {badge}
        {pageInfo.total > 1 && <div style={{ fontSize: 11, fontFamily: 'Kanit', color: '#374151', marginTop: 2 }}>หน้า {pageInfo.current} / {pageInfo.total}</div>}
      </div>
      <div style={{ textAlign: 'center', fontSize: 15, fontFamily: 'Kanit_B', marginTop: 2, lineHeight: 1.4 }}>
        บัญชีการขายยาตามใบสั่งของผู้ประกอบวิชาชีพเวชกรรม ผู้ประกอบโรคศิลปะ<br />หรือผู้ประกอบวิชาชีพการสัตวแพทย์
      </div>
      <PlaceLine place={place} label="(ชื่อสถานที่ขายยา)" />
      {rangeText && <div style={{ textAlign: 'center', fontSize: 12, fontFamily: 'Kanit_B', color: '#111', marginTop: 4 }}>{rangeText}</div>}

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 14 }}>
        <thead>
          <tr>
            <th style={{ ...thCell, width: '6%' }} rowSpan={2}>ลำดับที่</th>
            <th style={{ ...thCell, width: '11%' }} rowSpan={2}>วัน เดือน ปี<br />ที่ขายยา</th>
            <th style={thCell} colSpan={2}>ผู้สั่งยา</th>
            <th style={thCell} colSpan={3}>ผู้ใช้ยา</th>
            <th style={{ ...thCell, width: '16%' }} rowSpan={2}>ชื่อยา และ<br />จำนวน / ปริมาณ</th>
            <th style={{ ...thCell, width: '13%' }} rowSpan={2}>ลายมือชื่อ<br />ผู้มีหน้าที่ปฏิบัติการ</th>
            <th style={{ ...thCell, width: '8%' }} rowSpan={2}>หมายเหตุ</th>
          </tr>
          <tr>
            <th style={{ ...thCell, width: '10%' }}>ชื่อ – สกุล</th>
            <th style={{ ...thCell, width: '11%' }}>ที่อยู่หรือที่ทำงาน</th>
            <th style={{ ...thCell, width: '10%' }}>ชื่อ – สกุล</th>
            <th style={{ ...thCell, width: '5%' }}>อายุ</th>
            <th style={{ ...thCell, width: '10%' }}>ที่อยู่</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td style={{ ...rowCell, textAlign: 'center' }}>{startNo + i + 1}</td>
              <td style={{ ...rowCell, textAlign: 'center' }}>{row.date}</td>
              <td style={rowCell} />
              <td style={rowCell} />
              <td style={{ ...rowCell, textAlign: 'left' }}>{hideCustomer ? '' : row.userName}</td>
              <td style={rowCell} />
              <td style={rowCell} />
              <td style={{ ...rowCell, textAlign: 'left' }}>{row.drugQty}</td>
              <td style={{ ...rowCell, textAlign: 'center' }}>{hidePharmacist ? '' : row.pharmacist}</td>
              <td style={rowCell} />
            </tr>
          ))}
          {Array.from({ length: fillerCount }).map((_, i) => (
            <tr key={`f${i}`}>
              <td style={rowCell} /><td style={rowCell} /><td style={rowCell} /><td style={rowCell} /><td style={rowCell} />
              <td style={rowCell} /><td style={rowCell} /><td style={rowCell} /><td style={rowCell} /><td style={rowCell} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- แบบ ข.ย.13 ---------- */
function FormKY13({ badge, place }: { badge: string; place: string }) {
  return (
    <div>
      <div style={{ textAlign: 'right', fontSize: 13, fontFamily: 'Kanit_B' }}>{badge}</div>
      <div style={{ textAlign: 'center', fontSize: 15, fontFamily: 'Kanit_B', marginTop: 2 }}>
        รายงานการขายยาตามที่เลขาธิการคณะกรรมการอาหารและยากำหนด
      </div>
      <PlaceLine place={place} label="(ชื่อ ที่อยู่ สถานที่ขายยา)" />

      {/* Header fields */}
      <div style={fieldRow}>
        <span>ชื่อยา</span><Line flex={3} />
        <span>เลขทะเบียนตำรับยา</span><Line flex={2} />
      </div>
      <div style={fieldRow}>
        <span>ชื่อผู้ผลิต / ผู้นำเข้า</span><Line flex={2} />
        <span>เลขที่หรืออักษรของครั้งที่ผลิต</span><Line flex={2} />
        <span>ขนาดบรรจุ</span><Line flex={1} />
      </div>
      <div style={fieldRow}>
        <span>ได้มาจาก</span><Line flex={2} />
        <span>จำนวนรับ</span><Line flex={2} />
        <span>วันที่รับ</span><Line flex={2} />
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 14 }}>
        <thead>
          <tr>
            <th style={{ ...thCell, width: '7%' }} rowSpan={2}>ลำดับที่</th>
            <th style={{ ...thCell, width: '11%' }} rowSpan={2}>วัน เดือน ปี<br />ที่ขาย</th>
            <th style={thCell} colSpan={2}>จ่ายไปให้</th>
            <th style={thCell} colSpan={2}>จำนวน / ปริมาณ</th>
            <th style={{ ...thCell, width: '10%' }} rowSpan={2}>หมายเหตุ</th>
          </tr>
          <tr>
            <th style={{ ...thCell, width: '24%' }}>ชื่อและที่อยู่</th>
            <th style={{ ...thCell, width: '13%' }}>ประเภท</th>
            <th style={{ ...thCell, width: '17%' }}>ขาย (หน่วยนับ)</th>
            <th style={{ ...thCell, width: '18%' }}>คงเหลือ (หน่วยนับ)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...bodyCell, height: 260 }} /><td style={bodyCell} /><td style={bodyCell} /><td style={bodyCell} />
            <td style={bodyCell} /><td style={bodyCell} /><td style={bodyCell} />
          </tr>
        </tbody>
      </table>

      {/* Signatures */}
      <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14, fontSize: 13 }}>
        <div>(ลายมือชื่อ) <Line width={220} /> ผู้รับอนุญาต</div>
        <div>(ลายมือชื่อ) <Line width={220} /> ผู้มีหน้าที่ปฏิบัติการ</div>
      </div>
    </div>
  )
}
