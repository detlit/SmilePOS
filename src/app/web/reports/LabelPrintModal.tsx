'use client'

import React, { useEffect, useRef, useState } from "react"
import axios from "axios"
import { useReactToPrint } from "react-to-print"
import Toast from "react-bootstrap/Toast"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react"

type LabelPaperSize = '80x50' | '80x60' | '70x100'

const labelPaperSizeOptions: Array<{ value: LabelPaperSize; label: string; widthMm: number; heightMm: number }> = [
  { value: '80x50', label: '80×50 mm', widthMm: 80, heightMm: 50 },
  { value: '80x60', label: '80×60 mm', widthMm: 80, heightMm: 60 },
  { value: '70x100', label: '70×100 mm', widthMm: 70, heightMm: 100 },
]

const LANGUAGE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'th', label: 'ไทย' },
  { value: 'my', label: 'พม่า' },
  { value: 'lo', label: 'ลาว' },
  { value: 'en', label: 'อังกฤษ' },
  { value: 'zh-CN', label: 'จีน' },
  { value: 'ru', label: 'รัสเซีย' },
  { value: 'km', label: 'กัมพูชา' },
  { value: 'ko', label: 'เกาหลี' },
  { value: 'ja', label: 'ญี่ปุ่น' },
  { value: 'ms', label: 'บาฮาซา' },
]

const LABEL_FIELDS = ['indicatorlistS', 'timeS', 'useS', 'timeuseS', 'keepS', 'remarkS'] as const

type LabelData = { indicatorlistS: string; timeS: string; useS: string; timeuseS: string; keepS: string; remarkS: string }
const EMPTY_LABEL_DATA: LabelData = { indicatorlistS: '', timeS: '', useS: '', timeuseS: '', keepS: '', remarkS: '' }

type EditKind = 'indicator' | 'use' | 'time' | 'remark' | 'customer'

export interface LabelPrintItem {
  code_product: string
  name_product: string
  qty: number | string
  unit: string
}

interface LabelPrintModalProps {
  isOpen: boolean
  onOpenChange: () => void
  items: LabelPrintItem[]
  storeS: string
  addressS: string
  telS: string
  uploadedUrl: string | null
  customerName?: string
  pharmacistName?: string
}

export default function LabelPrintModal({
  isOpen,
  onOpenChange,
  items,
  storeS,
  addressS,
  telS,
  uploadedUrl,
  customerName,
  pharmacistName,
}: LabelPrintModalProps) {
  const [paperSize, setPaperSize] = useState<LabelPaperSize>('80x60')
  const [selectedLang, setSelectedLang] = useState('th')
  const [headerHeight, setHeaderHeight] = useState(48)
  const [headerFontSize, setHeaderFontSize] = useState(15)
  const [contentFontSize, setContentFontSize] = useState(16)
  const [showExpiry, setShowExpiry] = useState(false)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [labelData, setLabelData] = useState<Record<string, LabelData>>({})
  const [translations, setTranslations] = useState<Record<string, Partial<Record<typeof LABEL_FIELDS[number], string>>>>({})
  const [isTranslating, setIsTranslating] = useState(false)

  // แก้ไขข้อมูลฉลากของรายการที่เลือก (เหมือนหน้าขาย)
  const [editTarget, setEditTarget] = useState<{ code: string; name: string; kind: EditKind } | null>(null)
  const [editValue, setEditValue] = useState('')

  // ชื่อลูกค้าที่แก้ไขได้ตอนพิมพ์ (เริ่มจาก prop)
  const [customerNameOverride, setCustomerNameOverride] = useState('')
  // รายชื่อสมาชิก/ลูกค้า สำหรับเลือกตอนแก้ไขชื่อบนฉลาก
  const [memberOptions, setMemberOptions] = useState<Array<{ code: string; names: string; tel: string }>>([])

  const contentRef = useRef<HTMLDivElement>(null)

  const paperSizeConfig = labelPaperSizeOptions.find(option => option.value === paperSize) ?? labelPaperSizeOptions[0]
  const paperWidthCss = `${paperSizeConfig.widthMm}mm`
  const paperHeightCss = `${paperSizeConfig.heightMm}mm`
  const paperPrintPadding = paperSize === '70x100' ? '2mm' : '1mm'

  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: 'พิมพ์ฉลากสินค้า',
    pageStyle: `@page { size: ${paperWidthCss} ${paperHeightCss}; margin: 0; } @media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } body { margin: 0; padding: 0; } .label-print-card { box-shadow: none !important; margin: 0 !important; padding: ${paperPrintPadding} !important; page-break-inside: avoid; width: ${paperWidthCss} !important; height: ${paperHeightCss} !important; overflow: hidden !important; box-sizing: border-box !important; } }`,
  })

  // เลือกพิมพ์ทุกรายการเป็นค่าเริ่มต้นเมื่อเปิด modal
  useEffect(() => {
    if (!isOpen) return
    const next: Record<string, boolean> = {}
    items.forEach(item => { next[item.code_product] = true })
    setSelected(next)
    setCustomerNameOverride(customerName && customerName.trim() ? customerName : '')
  }, [isOpen, items, customerName])

  // ดึงรายชื่อสมาชิก/ลูกค้า เพื่อให้เลือกชื่อบนฉลากได้
  useEffect(() => {
    if (!isOpen || memberOptions.length > 0) return
    const company = typeof window !== 'undefined' ? (localStorage.getItem('company_') || '') : ''
    axios.get('/api/customer', { params: { company, fields: 'list', sort: 'asc' } })
      .then(res => {
        const rows = Array.isArray(res.data) ? res.data : []
        setMemberOptions(
          rows
            .map((c: any) => ({ code: String(c.code || ''), names: String(c.names || ''), tel: String(c.tel || '') }))
            .filter((c: { names: string }) => c.names.trim() !== '')
        )
      })
      .catch(err => console.error('Load customer list error:', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // ดึงข้อมูลฉลาก (ข้อบ่งใช้ / วิธีใช้ / ฯลฯ) ตามรหัสสินค้า
  useEffect(() => {
    if (!isOpen) return
    const codes = Array.from(new Set(items.map(item => item.code_product).filter(Boolean)))
    const company = typeof window !== 'undefined' ? (localStorage.getItem('company_') || '') : ''
    codes.forEach(async (code) => {
      if (labelData[code]) return
      try {
        const res = await axios.get(`/api/label/labeldata`, { params: { company, code } })
        const row = Array.isArray(res.data) ? res.data[0] : null
        setLabelData(prev => ({
          ...prev,
          [code]: {
            indicatorlistS: row?.indicatorlistS || '',
            timeS: row?.timeS || '',
            useS: row?.useS || '',
            timeuseS: row?.timeuseS || '',
            keepS: row?.keepS || '',
            remarkS: row?.remarkS || '',
          },
        }))
      } catch {
        setLabelData(prev => ({ ...prev, [code]: EMPTY_LABEL_DATA }))
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, items])

  // แปลภาษาเมื่อเปลี่ยนภาษาที่เลือก (ยกเว้นไทย)
  useEffect(() => {
    if (!isOpen || selectedLang === 'th') return
    const codes = Object.keys(labelData)
    if (codes.length === 0) return

    const textsToTranslate: string[] = []
    const mapping: { code: string; field: typeof LABEL_FIELDS[number]; uniqueKey: string }[] = []
    const uniqueIndex = new Map<string, number>()

    codes.forEach(code => {
      const cached = translations[code] || {}
      LABEL_FIELDS.forEach(field => {
        const original = labelData[code]?.[field]
        if (!original) return
        if (cached[field]) return
        if (!uniqueIndex.has(original)) {
          uniqueIndex.set(original, textsToTranslate.length)
          textsToTranslate.push(original)
        }
        mapping.push({ code, field, uniqueKey: original })
      })
    })

    if (textsToTranslate.length === 0) return

    setIsTranslating(true)
    axios.post('/api/translate', { texts: textsToTranslate, targets: [selectedLang] })
      .then(res => {
        const results: { index: number; translatedText: string }[] = res.data?.batchResults || []
        const translatedMap = new Map<number, string>()
        results.forEach(r => { if (r.translatedText) translatedMap.set(r.index, r.translatedText) })
        setTranslations(prev => {
          const next = { ...prev }
          mapping.forEach(m => {
            const idx = uniqueIndex.get(m.uniqueKey)
            const translated = idx !== undefined ? translatedMap.get(idx) : undefined
            if (translated && translated !== m.uniqueKey) {
              next[m.code] = { ...(next[m.code] || {}), [m.field]: translated }
            }
          })
          return next
        })
      })
      .catch(err => console.error('Translate label error:', err))
      .finally(() => setIsTranslating(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedLang, labelData])

  const getText = (code: string, field: typeof LABEL_FIELDS[number]) => {
    if (selectedLang !== 'th' && translations[code]?.[field]) return translations[code]![field] as string
    return labelData[code]?.[field] || ''
  }

  const toggleItem = (code: string) => {
    setSelected(prev => ({ ...prev, [code]: !prev[code] }))
  }

  const editTitles: Record<EditKind, string> = {
    indicator: 'ข้อบ่งใช้',
    use: 'วิธีและช่วงเวลา',
    time: 'ช่วงเวลาและวิธีเก็บ',
    remark: 'หมายเหตุ',
    customer: 'ชื่อลูกค้า',
  }

  // เปิดแก้ไขข้อมูลฉลากของรายการที่เลือก (เหมือนหน้าขาย)
  const openEdit = (code: string, name: string, kind: EditKind) => {
    const current =
      kind === 'customer' ? customerNameOverride :
        kind === 'indicator' ? getText(code, 'indicatorlistS') :
          kind === 'use' ? getText(code, 'useS') :
            kind === 'time' ? getText(code, 'timeS') :
              getText(code, 'remarkS')
    setEditValue(current)
    setEditTarget({ code, name, kind })
  }

  const saveEdit = () => {
    if (!editTarget) return
    const { code, kind } = editTarget
    if (kind === 'customer') {
      setCustomerNameOverride(editValue)
      setEditTarget(null)
      return
    }
    const applyChanges = (data: LabelData): LabelData => {
      if (kind === 'indicator') return { ...data, indicatorlistS: editValue }
      if (kind === 'use') return { ...data, useS: editValue, timeuseS: '' }
      if (kind === 'time') return { ...data, timeS: editValue, keepS: '' }
      return { ...data, remarkS: editValue }
    }
    setLabelData(prev => ({ ...prev, [code]: applyChanges(prev[code] || EMPTY_LABEL_DATA) }))
    if (selectedLang !== 'th') {
      setTranslations(prev => ({ ...prev, [code]: applyChanges({ ...EMPTY_LABEL_DATA, ...(prev[code] || {}) }) }))
    }
    setEditTarget(null)
  }

  const dateStr = new Date().toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const cusName = customerNameOverride && customerNameOverride.trim() ? customerNameOverride : 'ลูกค้าทั่วไป'
  const printable = items.filter(item => selected[item.code_product])

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} scrollBehavior="inside" size="full">
      <ModalContent className="shadow-sm rounded rounded-2 border" style={{ backgroundColor: '#fff', width: '100vw', height: '100%' }}>
        {(onClose) => (
          <>
            <ModalHeader style={{ backgroundColor: '#f1f1f1' }}>
              <div style={{ width: '100%' }}>
                <div className="d-flex align-items-center" style={{ width: '100%', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'Kanit_B', fontSize: 14, color: '#0f172a' }}>🏷️ พิมพ์ฉลาก</span>
                  <div className="d-flex align-items-center" style={{ gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#555' }}>ขนาดกระดาษ:</span>
                    {labelPaperSizeOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setPaperSize(option.value)}
                        style={{
                          fontFamily: 'Kanit', fontSize: 11, padding: '3px 10px', borderRadius: 7, cursor: 'pointer',
                          minWidth: 78,
                          border: paperSize === option.value ? '2px solid #7c3aed' : '1px solid #d1d5db',
                          background: paperSize === option.value ? '#f3e8ff' : '#fff',
                          color: paperSize === option.value ? '#7c3aed' : '#666',
                          fontWeight: paperSize === option.value ? 700 : 400,
                        }}
                      >{option.label}</button>
                    ))}
                  </div>

                  <div className="d-flex align-items-center" style={{ gap: 6, marginLeft: 'auto' }}>
                    {/* ปรับความสูงหัวฉลาก */}
                    <div className="d-flex align-items-center" style={{ background: '#fff', borderRadius: 6, border: '1px solid #d1d5db', padding: '1px 4px', gap: 2 }} title="ปรับความสูงหัวฉลาก">
                      <span style={{ fontFamily: 'Kanit_B', fontSize: 9, color: '#6b7280', padding: '0 2px' }}>สูง</span>
                      <button onClick={() => setHeaderHeight(v => Math.max(20, v - 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 3px', fontSize: 14, fontWeight: 700, color: '#6b7280', lineHeight: 1 }}>−</button>
                      <span style={{ fontFamily: 'Kanit', fontSize: 10, color: '#6b7280', minWidth: 20, textAlign: 'center' }}>{headerHeight}</span>
                      <button onClick={() => setHeaderHeight(v => Math.min(120, v + 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 3px', fontSize: 14, fontWeight: 700, color: '#6b7280', lineHeight: 1 }}>+</button>
                    </div>
                    {/* ปรับขนาดตัวหนังสือหัวฉลาก */}
                    <div className="d-flex align-items-center" style={{ background: '#fff', borderRadius: 6, border: '1px solid #d1d5db', padding: '1px 4px', gap: 2 }} title="ปรับขนาดตัวหนังสือหัวฉลาก (ร้าน/ที่อยู่)">
                      <span style={{ fontFamily: 'Kanit_B', fontSize: 9, color: '#6b7280', padding: '0 2px' }}>H</span>
                      <button onClick={() => setHeaderFontSize(v => Math.max(8, v - 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 3px', fontSize: 14, fontWeight: 700, color: '#6b7280', lineHeight: 1 }}>−</button>
                      <span style={{ fontFamily: 'Kanit', fontSize: 10, color: '#6b7280', minWidth: 16, textAlign: 'center' }}>{headerFontSize}</span>
                      <button onClick={() => setHeaderFontSize(v => Math.min(22, v + 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 3px', fontSize: 14, fontWeight: 700, color: '#6b7280', lineHeight: 1 }}>+</button>
                    </div>
                    {/* ปรับขนาดตัวหนังสือข้อมูลฉลาก */}
                    <div className="d-flex align-items-center" style={{ background: '#fff', borderRadius: 6, border: '1px solid #d1d5db', padding: '1px 4px', gap: 2 }} title="ปรับขนาดตัวหนังสือข้อมูลฉลาก (สินค้า/วิธีใช้)">
                      <span style={{ fontFamily: 'Kanit_B', fontSize: 9, color: '#6b7280', padding: '0 2px' }}>C</span>
                      <button onClick={() => setContentFontSize(v => Math.max(8, v - 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 3px', fontSize: 14, fontWeight: 700, color: '#6b7280', lineHeight: 1 }}>−</button>
                      <span style={{ fontFamily: 'Kanit', fontSize: 10, color: '#6b7280', minWidth: 16, textAlign: 'center' }}>{contentFontSize}</span>
                      <button onClick={() => setContentFontSize(v => Math.min(22, v + 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 3px', fontSize: 14, fontWeight: 700, color: '#6b7280', lineHeight: 1 }}>+</button>
                    </div>
                    {/* แสดงหมดอายุ */}
                    <label className="d-flex align-items-center" style={{ background: showExpiry ? '#E5EEF8' : '#fff', borderRadius: 6, border: showExpiry ? '1px solid #A6C8E7' : '1px solid #d1d5db', padding: '1px 8px', gap: 4, cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }} title="แสดงวันหมดอายุบนฉลาก">
                      <input type="checkbox" checked={showExpiry} onChange={(e) => setShowExpiry(e.target.checked)} style={{ cursor: 'pointer', accentColor: '#3E86C7' }} />
                      <span style={{ fontFamily: 'Kanit', fontSize: 10, color: showExpiry ? '#2A6AAA' : '#6b7280' }}>หมดอายุ</span>
                    </label>
                  </div>
                </div>

                {/* เลือกภาษา */}
                <div className="d-flex align-items-center" style={{ width: '100%', fontSize: 13, fontFamily: 'Kanit_B', marginTop: 8, flexWrap: 'wrap', gap: 4 }}>
                  <div style={{ whiteSpace: 'nowrap', marginRight: 6 }}>เลือกภาษา :</div>
                  {LANGUAGE_OPTIONS.map(opt => (
                    <label key={opt.value} style={{ fontFamily: 'Kanit', fontSize: 13, marginRight: 14, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                      <input type="radio" name="label-lang" value={opt.value} checked={selectedLang === opt.value} onChange={() => setSelectedLang(opt.value)} />
                      {opt.label}
                    </label>
                  ))}
                  {isTranslating && <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#0d6efd' }}>กำลังแปล...</span>}
                </div>
              </div>
            </ModalHeader>

            <ModalBody>
              {/* เลือกพิมพ์ */}
              <div style={{ padding: '6px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#555', whiteSpace: 'nowrap' }}>เลือกพิมพ์:</span>
                {items.map((item, idx) => (
                  <label key={`${item.code_product}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', background: selected[item.code_product] ? '#D3F0E2' : '#fee2e2', borderRadius: 16, padding: '2px 10px', border: selected[item.code_product] ? '1px solid #74CCA4' : '1px solid #fca5a5', userSelect: 'none' }}>
                    <input type="checkbox" checked={!!selected[item.code_product]} onChange={() => toggleItem(item.code_product)} style={{ cursor: 'pointer', accentColor: '#3E86C7' }} />
                    <span style={{ fontFamily: 'Kanit', fontSize: 11, color: selected[item.code_product] ? '#0F6845' : '#b91c1c', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name_product || `รายการ ${idx + 1}`}
                    </span>
                  </label>
                ))}
              </div>

              {/* พื้นที่ตัวอย่าง/พิมพ์ฉลาก */}
              <div style={{ padding: 16 }}>
                <div ref={contentRef} style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {printable.map((item, idx) => {
                    const qty = `${item.qty}${item.unit ? ` ${item.unit}` : ''}`
                    const useTime = `${getText(item.code_product, 'useS')}  ${getText(item.code_product, 'timeuseS')}`.trim()
                    const timeKeep = `${getText(item.code_product, 'timeS')}  ${getText(item.code_product, 'keepS')}`.trim()
                    const indicator = getText(item.code_product, 'indicatorlistS')
                    const remark = getText(item.code_product, 'remarkS')

                    return (
                      <div
                        key={`${item.code_product}-${idx}`}
                        className="label-print-card"
                        style={{
                          width: paperWidthCss,
                          height: paperHeightCss,
                          border: '2px solid #000',
                          borderRadius: 0,
                          overflow: 'hidden',
                          fontFamily: 'Kanit',
                          backgroundColor: '#fff',
                          boxSizing: 'border-box',
                          pageBreakAfter: 'always',
                          pageBreakInside: 'avoid',
                        }}
                      >
                        {/* Header */}
                        <div style={{ height: headerHeight, overflow: 'hidden', flexShrink: 0, borderBottom: '2px double #000', padding: '1px 8px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {uploadedUrl ? (
                            <img alt="" src={uploadedUrl} width={34} height={30} style={{ borderRadius: 2, padding: 1, objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          ) : null}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: 'Kanit_B', fontSize: headerFontSize + 1, color: '#000', lineHeight: 1.2, letterSpacing: '0.5px' }}>{storeS}</div>
                            <div style={{ fontSize: Math.max(7, headerFontSize - 5), color: '#000', lineHeight: 1.1 }}>{addressS} | โทร {telS}</div>
                          </div>
                        </div>

                        {/* Info Bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0px 10px', borderBottom: '1px solid #000', fontSize: Math.max(7, contentFontSize - 3), color: '#000' }}>
                          <span
                            style={{ fontFamily: 'Kanit_B', cursor: 'pointer' }}
                            title="คลิกเพื่อแก้ไขชื่อลูกค้า"
                            onClick={() => openEdit(item.code_product, 'ชื่อลูกค้า', 'customer')}
                          >{cusName}</span>
                          <span>{dateStr}</span>
                        </div>

                        {/* Product Name Bar */}
                        <div style={{ padding: '0px 10px', borderBottom: '1px solid #000', background: '#000', display: 'flex', justifyContent: 'space-between', alignItems: 'center', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}>
                          <div style={{ fontSize: contentFontSize, fontFamily: 'Kanit_B', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{item.name_product}</div>
                          <div style={{ fontSize: Math.max(7, contentFontSize - 2), fontFamily: 'Kanit_B', color: '#fff', whiteSpace: 'nowrap', marginLeft: 4, textAlign: 'right' }}>{qty}</div>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '0px 10px 1px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: Math.max(7, contentFontSize - 2) }}>
                            <tbody>
                              <tr
                                style={{ borderBottom: '1px dotted #000', cursor: 'pointer' }}
                                title="คลิกเพื่อแก้ไข"
                                onClick={() => openEdit(item.code_product, item.name_product, 'indicator')}
                              >
                                <td style={{ width: 65, color: '#000', fontFamily: 'Kanit_B', verticalAlign: 'top', padding: '0px 0', fontSize: Math.max(7, contentFontSize - 3) }}>ข้อบ่งใช้</td>
                                <td style={{ color: '#000', padding: '0px 0', verticalAlign: 'top' }}>{indicator}</td>
                              </tr>
                              <tr
                                style={{ borderBottom: '1px dotted #000', cursor: 'pointer' }}
                                title="คลิกเพื่อแก้ไข"
                                onClick={() => openEdit(item.code_product, item.name_product, 'use')}
                              >
                                <td style={{ color: '#000', fontFamily: 'Kanit_B', verticalAlign: 'top', padding: '0px 0', fontSize: Math.max(7, contentFontSize - 3) }}>วิธีใช้</td>
                                <td style={{ color: '#000', padding: '0px 0', verticalAlign: 'top' }}>{useTime}</td>
                              </tr>
                              <tr
                                style={{ borderBottom: '1px dotted #000', cursor: 'pointer' }}
                                title="คลิกเพื่อแก้ไข"
                                onClick={() => openEdit(item.code_product, item.name_product, 'time')}
                              >
                                <td style={{ color: '#000', fontFamily: 'Kanit_B', verticalAlign: 'top', padding: '0px 0', fontSize: Math.max(7, contentFontSize - 3) }}>ช่วงเวลา</td>
                                <td style={{ color: '#000', padding: '0px 0', verticalAlign: 'top' }}>{timeKeep}</td>
                              </tr>
                              <tr
                                style={{ cursor: 'pointer' }}
                                title="คลิกเพื่อแก้ไข"
                                onClick={() => openEdit(item.code_product, item.name_product, 'remark')}
                              >
                                <td style={{ color: '#000', fontFamily: 'Kanit_B', verticalAlign: 'top', padding: '0px 0', fontSize: Math.max(7, contentFontSize - 3) }}>หมายเหตุ</td>
                                <td style={{ color: '#000', padding: '0px 0', verticalAlign: 'top', fontStyle: 'italic' }}>{remark || '.'}</td>
                              </tr>
                            </tbody>
                          </table>
                          <div style={{ borderTop: '1.5px solid #000', marginTop: 2, paddingTop: 1, fontSize: Math.max(7, contentFontSize - 3), color: '#000', display: 'flex', justifyContent: 'space-between' }}>
                            <span>เภสัชกร: {pharmacistName || '-'}</span>
                            {showExpiry && <span>หมดอายุ : ..../......./..........</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="d-flex border" style={{ backgroundColor: '#f1f1f1', height: editTarget ? 110 : 'auto' }}>
              <button
                className="btn btn-success"
                style={{ width: 130, height: 35, fontSize: 15, fontFamily: 'Kanit' }}
                onClick={() => reactToPrintFn()}
                disabled={printable.length === 0}
              >
                Print (F11)
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: 'Kanit' }}
                onClick={() => onClose()}
              >
                Close
              </button>

              {editTarget && (
                <Toast show onClose={() => setEditTarget(null)}>
                  <Toast.Header>
                    <strong className="me-auto" style={{ fontFamily: 'Kanit', width: '100%', textAlign: 'start', fontSize: 10 }}>
                      แก้ไข {editTitles[editTarget.kind]} == {editTarget.name}
                    </strong>
                  </Toast.Header>
                  <Toast.Body>
                    <div className="row" style={{ justifyContent: 'center' }}>
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        list={editTarget.kind === 'customer' ? 'label-member-list' : undefined}
                        className="form-control form-control-sm"
                        placeholder={editTarget.kind === 'customer' ? 'พิมพ์ หรือเลือกชื่อสมาชิก...' : ''}
                        style={{ fontFamily: 'Kanit_B', width: '70%', textAlign: 'start', fontSize: 14, fontWeight: 600 }}
                      />
                      {editTarget.kind === 'customer' && (
                        <datalist id="label-member-list">
                          {memberOptions.map((m, i) => (
                            <option key={`${m.code}-${i}`} value={m.names}>
                              {m.code ? `${m.code} · ` : ''}{m.tel || ''}
                            </option>
                          ))}
                        </datalist>
                      )}
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={saveEdit}
                        style={{ fontFamily: 'Kanit', width: '20%', textAlign: 'center', fontSize: 12, marginLeft: 5 }}
                      >
                        ตกลง
                      </button>
                    </div>
                  </Toast.Body>
                </Toast>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
