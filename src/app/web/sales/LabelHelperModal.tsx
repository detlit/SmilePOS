'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import Modal from 'react-bootstrap/Modal'
import { useReactToPrint } from 'react-to-print'
import { QRCodeCanvas } from 'qrcode.react'
import JsBarcode from 'jsbarcode'

/* ============================ Types ============================ */
export type LabelPaperSize = '80x50' | '80x60' | '70x100'
export type LabelStyle = 'current' | 'wow' | 'pro' | 'elegant' | 'minimal'

interface StoreInfo {
  name: string
  address: string
  tel: string
  logoUrl?: string | null
  lineUrl?: string | null
  showLogo?: boolean
  showLine?: boolean
}

interface LabelHelper {
  id: number
  company: string
  name: string
  isDefault: boolean
  suspended: boolean
  paperSize: LabelPaperSize
  labelStyle: LabelStyle
  title: string; titleOn: boolean; titleSize: number
  line1: string; line1On: boolean; line1Size: number
  line2: string; line2On: boolean; line2Size: number
  line3: string; line3On: boolean; line3Size: number
  line4: string; line4On: boolean; line4Size: number
  line5: string; line5On: boolean; line5Size: number
  line6: string; line6On: boolean; line6Size: number
  url: string
  showBarcode: boolean
  barcode: string
}

interface LabelHelperModalProps {
  isOpen: boolean
  onClose: () => void
  store: StoreInfo
  initialPaperSize?: LabelPaperSize
  initialLabelStyle?: LabelStyle
}

/* ============================ Constants ============================ */
const PAPER_OPTIONS: Array<{ value: LabelPaperSize; label: string; widthMm: number; heightMm: number }> = [
  { value: '80x50', label: '80×50 mm', widthMm: 80, heightMm: 50 },
  { value: '80x60', label: '80×60 mm', widthMm: 80, heightMm: 60 },
  { value: '70x100', label: '70×100 mm', widthMm: 70, heightMm: 100 },
]

const STYLE_OPTIONS: Array<{ value: LabelStyle; label: string; accent: string; headBg: string; headColor: string }> = [
  { value: 'current', label: '📋 แบบที่ 1', accent: '#111827', headBg: '#111827', headColor: '#ffffff' },
  { value: 'wow', label: '✨ แบบที่ 2', accent: '#ec4899', headBg: '#fdf2f8', headColor: '#9d174d' },
  { value: 'pro', label: '🏥 แบบที่ 3', accent: '#0891b2', headBg: '#ecfeff', headColor: '#0e7490' },
  { value: 'elegant', label: '🌸 แบบที่ 4', accent: '#d97706', headBg: '#fffbeb', headColor: '#b45309' },
  { value: 'minimal', label: '💎 แบบที่ 5', accent: '#7c3aed', headBg: '#f5f3ff', headColor: '#6d28d9' },
]

const TEAL = '#0d9488'
const TEAL_DK = '#0f766e'

const LINE_KEYS = [1, 2, 3, 4, 5, 6] as const

const emptyForm: Omit<LabelHelper, 'id' | 'company'> = {
  name: '',
  isDefault: false,
  suspended: false,
  paperSize: '80x50',
  labelStyle: 'current',
  title: '', titleOn: true, titleSize: 14,
  line1: 'วันนัดโทรติดตาม.....................', line1On: true, line1Size: 10,
  line2: 'เบอร์ร้าน 088-251-3199', line2On: true, line2Size: 12,
  line3: 'ขอความเห็นใจรับสินค้ากับร้านด้วยนะคะ', line3On: true, line3Size: 10,
  line4: 'ผู้ป่วยไม่รับโทรศัพท์ *ร้านค้าเบิกเงินไม่ได้*', line4On: true, line4Size: 10,
  line5: 'ร้านต้องแบกรับค่าใช้จ่ายเองทั้งหมด', line5On: true, line5Size: 9,
  line6: '**(ขณะนี้ร้านเบิกเงินไม่ได้เป็นจำนวนมากแล้ว)**', line6On: true, line6Size: 9,
  url: '',
  showBarcode: false,
  barcode: '',
}

/* ============================ Barcode sub-component ============================ */
const BarcodePreview = ({ value, height }: { value: string; height: number }) => {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (ref.current && value) {
      try {
        JsBarcode(ref.current, value, {
          format: 'CODE128', width: 1.1, height, displayValue: true,
          fontSize: 9, font: 'Kanit', margin: 0, textMargin: 1,
        })
      } catch (e) { /* invalid barcode value */ }
    }
  }, [value, height])
  return <canvas ref={ref} style={{ maxWidth: '100%' }} />
}

/* ============================ Label preview ============================ */
function HelperLabelPreview({
  form, store, theme,
}: { form: Omit<LabelHelper, 'id' | 'company'>; store: StoreInfo; theme: typeof STYLE_OPTIONS[number] }) {
  const paper = PAPER_OPTIONS.find(p => p.value === form.paperSize) ?? PAPER_OPTIONS[0]
  const isTall = form.paperSize === '70x100'
  const is60 = form.paperSize === '80x60'
  const roomy = isTall || is60

  const fsHead = isTall ? 12 : is60 ? 12 : 11
  const fsAddr = isTall ? 7.5 : is60 ? 7.5 : 6.5
  const fsMeta = isTall ? 8 : 7.5
  const fsBody = isTall ? 11 : is60 ? 10.5 : 9.5
  const imgW = isTall ? 26 : is60 ? 28 : 24
  const imgH = isTall ? 24 : is60 ? 26 : 22
  const gap = isTall ? 3 : is60 ? 2 : 1

  const lines = LINE_KEYS
    .map(n => ({ on: (form as any)[`line${n}On`] as boolean, text: (form as any)[`line${n}`] as string, size: (form as any)[`line${n}Size`] as number }))
    .filter(l => l.on && (l.text || '').trim() !== '')

  const today = new Date().toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const hasCode = (form.url && form.url.trim() !== '') || (form.showBarcode && form.barcode.trim() !== '')
  const qrSize = isTall ? 56 : is60 ? 46 : 40

  return (
    <div id="helper-label-print" style={{
      width: `${paper.widthMm}mm`, height: `${paper.heightMm}mm`,
      fontFamily: 'Kanit', color: '#000', boxSizing: 'border-box',
      border: `1.5px solid ${theme.accent}`, borderRadius: 4, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', background: '#fff',
      WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
    } as React.CSSProperties}>

      {/* HEADER */}
      <div style={{
        background: theme.headBg, color: theme.headColor, flexShrink: 0,
        padding: isTall ? '2mm 3mm 1.4mm' : is60 ? '1.6mm 2.5mm 1.1mm' : '1.2mm 2mm 0.8mm',
        textAlign: 'center', borderBottom: `1px solid ${theme.accent}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          {store.showLogo && store.logoUrl && (
            <img alt="" src={String(store.logoUrl)} width={imgW} height={imgH}
              style={{ borderRadius: 2, flexShrink: 0, background: '#fff' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'Kanit_B', fontSize: fsHead, lineHeight: 1.12, letterSpacing: '0.3px' }}>{store.name || 'ชื่อร้าน'}</div>
            <div style={{ fontSize: fsAddr, lineHeight: 1.05, opacity: 0.92 }}>{store.address} {store.tel ? `โทร ${store.tel}` : ''}</div>
          </div>
          {store.showLine && store.lineUrl && (
            <img alt="" src={String(store.lineUrl)} width={imgW} height={imgH}
              style={{ borderRadius: 2, flexShrink: 0, background: '#fff' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, padding: isTall ? '1.5mm 3mm' : '1mm 2.5mm', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* customer + date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: fsMeta, borderBottom: `1px dashed ${theme.accent}55`, paddingBottom: gap, marginBottom: gap }}>
          <span><span style={{ fontFamily: 'Kanit_B' }}>ชื่อ:</span> ลูกค้าทั่วไป</span>
          <span><span style={{ fontFamily: 'Kanit_B' }}>วันที่:</span> {today}</span>
        </div>

        {/* helper lines */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: gap, textAlign: 'center' }}>
          {form.titleOn && (form.title || '').trim() !== '' && (
            <div style={{ fontFamily: 'Kanit_B', fontSize: form.titleSize || 14, lineHeight: 1.2, color: '#000', borderBottom: `1.5px solid ${theme.accent}`, paddingBottom: gap, marginBottom: gap, wordBreak: 'break-word' }}>{form.title}</div>
          )}
          {lines.length === 0 ? (
            <div style={{ fontSize: fsBody, color: '#9ca3af', fontFamily: 'Kanit' }}>— ยังไม่มีข้อความ —</div>
          ) : lines.map((l, i) => (
            <div key={i} style={{ fontFamily: 'Kanit_B', fontSize: l.size || fsBody, lineHeight: 1.2, color: '#000', wordBreak: 'break-word' }}>
              {l.text}
            </div>
          ))}
        </div>

        {/* QR + barcode */}
        {hasCode && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: gap, paddingTop: gap, borderTop: `1px dashed ${theme.accent}55` }}>
            {form.url && form.url.trim() !== '' && (
              <QRCodeCanvas value={form.url} size={qrSize} level="M" includeMargin={false} />
            )}
            {form.showBarcode && form.barcode.trim() !== '' && (
              <BarcodePreview value={form.barcode.trim()} height={isTall ? 28 : 22} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================ Main modal ============================ */
export default function LabelHelperModal({ isOpen, onClose, store, initialPaperSize, initialLabelStyle }: LabelHelperModalProps) {
  const [helpers, setHelpers] = useState<LabelHelper[]>([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState<Omit<LabelHelper, 'id' | 'company'>>(emptyForm)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const company = typeof window !== 'undefined' ? localStorage.getItem('company_') || '' : ''

  const theme = STYLE_OPTIONS.find(s => s.value === form.labelStyle) ?? STYLE_OPTIONS[0]
  const paper = PAPER_OPTIONS.find(p => p.value === form.paperSize) ?? PAPER_OPTIONS[0]

  const printFn = useReactToPrint({
    contentRef: printRef,
    pageStyle: `@page { size: ${paper.widthMm}mm ${paper.heightMm}mm; margin: 0; }
      @media print {
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { margin: 0; padding: 0; }
        #helper-label-print { box-shadow: none !important; margin: 0 !important; page-break-inside: avoid;
          width: ${paper.widthMm}mm !important; height: ${paper.heightMm}mm !important; overflow: hidden !important; box-sizing: border-box !important; } }`,
  })

  const fetchHelpers = useCallback(async () => {
    try {
      const res = await axios.get(`/api/label-helper?company=${company}&sort=asc`)
      setHelpers(res.data || [])
    } catch (e) { console.error(e) }
  }, [company])

  useEffect(() => {
    if (isOpen) {
      fetchHelpers()
      // เริ่มต้นด้วยฟอร์มใหม่ ใช้ขนาด/รูปแบบฉลากที่เปิดอยู่ในหน้าขาย
      setSelectedId(null)
      setDirty(false)
      setForm({
        ...emptyForm,
        paperSize: initialPaperSize ?? '80x50',
        labelStyle: initialLabelStyle ?? 'current',
      })
    }
  }, [isOpen, fetchHelpers, initialPaperSize, initialLabelStyle])

  const filtered = !search.trim() ? helpers
    : helpers.filter(h => (h.name || '').toLowerCase().includes(search.toLowerCase()))

  const setField = (patch: Partial<typeof form>) => { setForm(prev => ({ ...prev, ...patch })); setDirty(true) }

  const loadHelper = (h: LabelHelper) => {
    setSelectedId(h.id)
    setDirty(false)
    setForm({
      name: h.name || '', isDefault: !!h.isDefault, suspended: !!h.suspended,
      paperSize: (h.paperSize as LabelPaperSize) || '80x50', labelStyle: (h.labelStyle as LabelStyle) || 'current',
      title: h.title || '', titleOn: h.titleOn !== false, titleSize: Number(h.titleSize) || 14,
      line1: h.line1 || '', line1On: !!h.line1On, line1Size: Number(h.line1Size) || 10,
      line2: h.line2 || '', line2On: !!h.line2On, line2Size: Number(h.line2Size) || 10,
      line3: h.line3 || '', line3On: !!h.line3On, line3Size: Number(h.line3Size) || 10,
      line4: h.line4 || '', line4On: !!h.line4On, line4Size: Number(h.line4Size) || 10,
      line5: h.line5 || '', line5On: !!h.line5On, line5Size: Number(h.line5Size) || 10,
      line6: h.line6 || '', line6On: !!h.line6On, line6Size: Number(h.line6Size) || 10,
      url: h.url || '', showBarcode: !!h.showBarcode, barcode: h.barcode || '',
    })
  }

  const handleNew = () => {
    setSelectedId(null)
    setDirty(false)
    setForm({ ...emptyForm, name: '', paperSize: form.paperSize, labelStyle: form.labelStyle })
  }

  const handleSave = async () => {
    if (!form.name.trim()) { alert('กรุณาระบุชื่อฉลากช่วย'); return }
    setSaving(true)
    try {
      const payload = { company, ...form }
      if (selectedId) {
        await axios.put(`/api/label-helper/${selectedId}`, payload)
      } else {
        const res = await axios.post('/api/label-helper', payload)
        setSelectedId(res.data?.id ?? null)
      }
      setDirty(false)
      await fetchHelpers()
    } catch (e) { console.error(e); alert('บันทึกไม่สำเร็จ') }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!selectedId) return
    if (!confirm('ต้องการลบฉลากช่วยนี้หรือไม่?')) return
    try {
      await axios.delete(`/api/label-helper/${selectedId}`)
      handleNew()
      await fetchHelpers()
    } catch (e) { console.error(e) }
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: 'Kanit', fontSize: 12, width: '100%', padding: '7px 10px',
    border: '1px solid #e2e8f0', borderRadius: 6, outline: 'none', boxSizing: 'border-box',
  }

  return (
    <Modal show={isOpen} onHide={onClose} size="xl" dialogClassName="modal-95w" centered>
      <Modal.Header closeButton style={{ background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DK} 100%)`, color: 'white', padding: '10px 18px', border: 'none' }}>
        <Modal.Title style={{ fontFamily: 'Kanit_B', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          🧩 ตัวช่วยฉลากสินค้า <span style={{ fontFamily: 'Kanit', fontSize: 12, opacity: 0.85 }}>ออกแบบฉลากช่วย / ข้อความประชาสัมพันธ์</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: 0, display: 'flex', height: '82vh', overflow: 'hidden', background: '#fff' }}>

        {/* ============ COL 1: list ============ */}
        <div style={{ width: 270, minWidth: 270, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
          <div style={{ padding: 14, borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#334155' }}>📑 รายการฉลากช่วย</div>
              <button onClick={handleNew} style={{
                fontFamily: 'Kanit_B', fontSize: 11, padding: '5px 11px', border: 'none', borderRadius: 6,
                cursor: 'pointer', background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DK} 100%)`, color: '#fff',
                boxShadow: '0 2px 6px rgba(13,148,136,0.3)',
              }}>+ สร้างใหม่</button>
            </div>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อ..." style={{ ...inputStyle, fontSize: 12 }} />
            <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8', marginTop: 6 }}>ทั้งหมด {filtered.length} รายการ</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map((h, i) => (
              <div key={h.id} onClick={() => loadHelper(h)} style={{
                padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                background: selectedId === h.id ? '#ccfbf1' : i % 2 === 0 ? '#fff' : '#fafbfc',
                borderLeft: selectedId === h.id ? `3px solid ${TEAL}` : '3px solid transparent',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontFamily: 'Kanit', fontSize: 12, color: h.suspended ? '#9ca3af' : '#334155', fontWeight: selectedId === h.id ? 600 : 400, textDecoration: h.suspended ? 'line-through' : 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.name || '(ไม่มีชื่อ)'}
                  </span>
                  {h.isDefault && <span style={{ fontFamily: 'Kanit', fontSize: 9, background: '#0d9488', color: '#fff', borderRadius: 10, padding: '1px 6px' }}>เริ่มต้น</span>}
                </div>
                <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                  {(PAPER_OPTIONS.find(p => p.value === h.paperSize)?.label) || h.paperSize} · {(STYLE_OPTIONS.find(s => s.value === h.labelStyle)?.label) || h.labelStyle}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 14px', color: '#94a3b8', fontFamily: 'Kanit', fontSize: 12 }}>ยังไม่มีฉลากช่วย</div>
            )}
          </div>
        </div>

        {/* ============ COL 2: editor ============ */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: 18, background: '#f8fafc' }}>
          {/* name + flags */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#475569', display: 'block', marginBottom: 4 }}>
              ชื่อฉลากช่วย <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input value={form.name} onChange={(e) => setField({ name: e.target.value })} placeholder="เช่น ประชาสัมพันธ์บัตรทอง, วันนัดติดตาม..." style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: 18, marginBottom: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'Kanit', fontSize: 12, color: '#334155' }}>
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setField({ isDefault: e.target.checked })} style={{ accentColor: TEAL }} />
              เป็นฉลากช่วยเริ่มต้น
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'Kanit', fontSize: 12, color: '#334155' }}>
              <input type="checkbox" checked={form.suspended} onChange={(e) => setField({ suspended: e.target.checked })} style={{ accentColor: '#ef4444' }} />
              ระงับการใช้งาน
            </label>
          </div>

          {/* paper size + label style */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 14, padding: '12px 14px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontFamily: 'Kanit_B', fontSize: 11, color: '#64748b', marginBottom: 6 }}>ขนาดกระดาษ</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {PAPER_OPTIONS.map(p => (
                  <button key={p.value} onClick={() => setField({ paperSize: p.value })} style={{
                    fontFamily: 'Kanit', fontSize: 11, padding: '4px 10px', borderRadius: 7, cursor: 'pointer',
                    border: form.paperSize === p.value ? `2px solid ${TEAL}` : '1px solid #d1d5db',
                    background: form.paperSize === p.value ? '#f0fdfa' : '#fff', color: form.paperSize === p.value ? TEAL : '#666',
                    fontWeight: form.paperSize === p.value ? 700 : 400,
                  }}>{p.label}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'Kanit_B', fontSize: 11, color: '#64748b', marginBottom: 6 }}>รูปแบบฉลาก</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {STYLE_OPTIONS.map(s => (
                  <button key={s.value} onClick={() => setField({ labelStyle: s.value })} style={{
                    fontFamily: 'Kanit', fontSize: 11, padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
                    border: form.labelStyle === s.value ? `2px solid ${s.accent}` : '1px solid #d1d5db',
                    background: form.labelStyle === s.value ? s.headBg : '#fff',
                    color: form.labelStyle === s.value ? (s.value === 'current' ? '#fff' : s.headColor) : '#888',
                    fontWeight: form.labelStyle === s.value ? 700 : 400,
                  }}>{s.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* bold lines */}
          <div style={{ padding: '12px 14px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#475569', marginBottom: 8 }}>ข้อความตัวหนา (สูงสุด 6 บรรทัด)</div>
            {/* หัวข้อเรื่อง */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9, paddingBottom: 9, borderBottom: '1px dashed #e2e8f0' }}>
              <input type="checkbox" checked={form.titleOn} onChange={(e) => setField({ titleOn: e.target.checked })} style={{ accentColor: TEAL, flexShrink: 0 }} />
              <span style={{ fontFamily: 'Kanit_B', fontSize: 11, color: TEAL_DK, width: 58, flexShrink: 0 }}>หัวข้อเรื่อง</span>
              <input value={form.title} onChange={(e) => setField({ title: e.target.value })}
                placeholder="หัวเรื่องของฉลาก (เช่น แจ้งเพื่อทราบ)" disabled={!form.titleOn}
                style={{ ...inputStyle, fontFamily: 'Kanit_B', fontSize: 12, padding: '6px 9px', opacity: form.titleOn ? 1 : 0.5, background: form.titleOn ? '#fff' : '#f1f5f9' }} />
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, border: '1px solid #e2e8f0', borderRadius: 6, background: form.titleOn ? '#fff' : '#f1f5f9', opacity: form.titleOn ? 1 : 0.5, overflow: 'hidden' }}>
                <button type="button" disabled={!form.titleOn} onClick={() => setField({ titleSize: Math.max(5, (Number(form.titleSize) || 14) - 1) })}
                  style={{ border: 'none', background: 'transparent', cursor: form.titleOn ? 'pointer' : 'default', padding: '0 7px', fontSize: 15, fontWeight: 700, color: '#64748b', lineHeight: 1, height: 30 }}>−</button>
                <input type="number" min={5} max={40} value={form.titleSize} disabled={!form.titleOn}
                  onChange={(e) => setField({ titleSize: Math.min(40, Math.max(5, parseInt(e.target.value || '14', 10))) })}
                  style={{ width: 38, textAlign: 'center', border: 'none', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', outline: 'none', fontFamily: 'Kanit', fontSize: 12, height: 30, background: 'transparent', MozAppearance: 'textfield' as any }} />
                <button type="button" disabled={!form.titleOn} onClick={() => setField({ titleSize: Math.min(40, (Number(form.titleSize) || 14) + 1) })}
                  style={{ border: 'none', background: 'transparent', cursor: form.titleOn ? 'pointer' : 'default', padding: '0 7px', fontSize: 15, fontWeight: 700, color: '#64748b', lineHeight: 1, height: 30 }}>+</button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, paddingLeft: 84 }}>
              <span style={{ flex: 1 }} />
              <span style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8', width: 96, flexShrink: 0, textAlign: 'center' }}>ขนาดตัวอักษร</span>
            </div>
            {LINE_KEYS.map(n => {
              const onKey = `line${n}On` as keyof typeof form
              const txtKey = `line${n}` as keyof typeof form
              const sizeKey = `line${n}Size` as keyof typeof form
              const on = form[onKey] as boolean
              const size = Number(form[sizeKey]) || 10
              const setSize = (v: number) => setField({ [sizeKey]: Math.min(40, Math.max(5, v)) } as any)
              return (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <input type="checkbox" checked={on} onChange={(e) => setField({ [onKey]: e.target.checked } as any)} style={{ accentColor: TEAL, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8', width: 58, flexShrink: 0 }}>บรรทัด {n}</span>
                  <input value={form[txtKey] as string} onChange={(e) => setField({ [txtKey]: e.target.value } as any)}
                    placeholder={`ข้อความบรรทัดที่ ${n}`} disabled={!on}
                    style={{ ...inputStyle, fontSize: 11, padding: '6px 9px', opacity: on ? 1 : 0.5, background: on ? '#fff' : '#f1f5f9' }} />
                  {/* ปรับขนาดตัวอักษรเฉพาะบรรทัด */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0, border: '1px solid #e2e8f0', borderRadius: 6, background: on ? '#fff' : '#f1f5f9', opacity: on ? 1 : 0.5, overflow: 'hidden' }}>
                    <button type="button" disabled={!on} onClick={() => setSize(size - 1)}
                      style={{ border: 'none', background: 'transparent', cursor: on ? 'pointer' : 'default', padding: '0 7px', fontSize: 15, fontWeight: 700, color: '#64748b', lineHeight: 1, height: 30 }}>−</button>
                    <input type="number" min={5} max={40} value={size} disabled={!on}
                      onChange={(e) => setSize(parseInt(e.target.value || '10', 10))}
                      style={{ width: 38, textAlign: 'center', border: 'none', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', outline: 'none', fontFamily: 'Kanit', fontSize: 12, height: 30, background: 'transparent', MozAppearance: 'textfield' as any }} />
                    <button type="button" disabled={!on} onClick={() => setSize(size + 1)}
                      style={{ border: 'none', background: 'transparent', cursor: on ? 'pointer' : 'default', padding: '0 7px', fontSize: 15, fontWeight: 700, color: '#64748b', lineHeight: 1, height: 30 }}>+</button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* QR + barcode */}
          <div style={{ padding: '12px 14px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#475569', display: 'block', marginBottom: 4 }}>URL สำหรับสร้าง QR Code</label>
              <input value={form.url} onChange={(e) => setField({ url: e.target.value })} placeholder="https://... (เว้นว่างหากไม่ต้องการ QR)" style={{ ...inputStyle, fontSize: 11 }} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'Kanit_B', fontSize: 12, color: '#475569', marginBottom: 6 }}>
                <input type="checkbox" checked={form.showBarcode} onChange={(e) => setField({ showBarcode: e.target.checked })} style={{ accentColor: TEAL }} />
                แสดงแถบบาร์โค้ด
              </label>
              <input value={form.barcode} onChange={(e) => setField({ barcode: e.target.value })} placeholder="เลขบาร์โค้ด (เช่น 13 หลัก)" disabled={!form.showBarcode}
                style={{ ...inputStyle, fontSize: 11, opacity: form.showBarcode ? 1 : 0.5, background: form.showBarcode ? '#fff' : '#f1f5f9' }} />
            </div>
          </div>
        </div>

        {/* ============ COL 3: preview ============ */}
        <div style={{ width: 340, minWidth: 340, borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#eef2f7' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', background: '#fff', fontFamily: 'Kanit_B', fontSize: 12, color: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>👁️ ตัวอย่างฉลาก</span>
            <span style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>{paper.label}</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16 }}>
            <div ref={printRef} style={{ boxShadow: '0 4px 18px rgba(0,0,0,0.12)' }}>
              <HelperLabelPreview form={form} store={store} theme={theme} />
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer style={{ background: '#f8fafc', padding: '10px 18px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          {selectedId && (
            <button onClick={handleDelete} style={{ fontFamily: 'Kanit', fontSize: 12, padding: '8px 18px', border: '1px solid #ef4444', borderRadius: 8, background: '#fff', color: '#ef4444', cursor: 'pointer' }}>
              🗑️ ลบ
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => printFn()} style={{ fontFamily: 'Kanit', fontSize: 12, padding: '8px 18px', border: `1px solid ${TEAL}`, borderRadius: 8, background: '#fff', color: TEAL, cursor: 'pointer' }}>
            🖨️ พิมพ์ทดสอบ
          </button>
          <button onClick={onClose} style={{ fontFamily: 'Kanit', fontSize: 12, padding: '8px 18px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', cursor: 'pointer' }}>
            ปิด
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            fontFamily: 'Kanit_B', fontSize: 12, padding: '8px 26px', border: 'none', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer',
            background: saving ? '#cbd5e1' : `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DK} 100%)`, color: '#fff',
            boxShadow: saving ? 'none' : '0 2px 8px rgba(13,148,136,0.3)',
          }}>
            {saving ? 'กำลังบันทึก...' : selectedId ? '💾 บันทึกการแก้ไข' : '💾 บันทึก'}{dirty && !saving ? ' *' : ''}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  )
}
