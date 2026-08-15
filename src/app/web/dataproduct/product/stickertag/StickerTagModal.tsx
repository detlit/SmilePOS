'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import Modal from 'react-bootstrap/Modal'
import JsBarcode from 'jsbarcode'

interface Product {
  id: number
  code: string
  ProductName: string
  Barcode: string
  price: number
  Unit: string
  pic: string
}

// หน่วยในการขาย (หลายหน่วยต่อสินค้าเดียว) จากตาราง UnitConversion
interface UnitConv {
  id: number
  productCode: string
  saleUnit: string | null
  priceRetail: number | null
  Barcode: string | null
}

// ตัวเลือกหน่วยของสินค้าหนึ่งตัว (หน่วยหลัก + หน่วยขายย่อยแต่ละหน่วย)
interface Variant {
  unitKey: string      // 'base' หรือ `conv-<id>`
  unitLabel: string    // ชื่อหน่วยที่จะแสดงบนสติ๊กเกอร์
  price: number        // ราคาของหน่วยนี้
  barcode: string      // บาร์โค้ดของหน่วยนี้
}

interface TagItem {
  id: string           // `${product.id}-${unitKey}` เพื่อแยกสติ๊กเกอร์ของแต่ละหน่วย
  product: Product
  unitKey: string
  unitLabel: string
  price: number
  barcode: string
  qty: number
}

// ข้อมูลสติ๊กเกอร์ 1 ดวงที่จะแสดง/พิมพ์
interface TagData {
  ProductName: string
  code: string
  price: number
  barcode: string
  unitLabel: string
}

interface StickerTagModalProps {
  isOpen: boolean
  onClose: () => void
}

const BarcodeCanvas = ({ value, width, height }: { value: string; width: number; height: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        JsBarcode(canvasRef.current, value, {
          format: 'CODE128',
          width: 1.5,
          height: Math.max(35, height * 0.3),
          displayValue: true,
          fontSize: 10,
          font: 'Kanit',
          margin: 0,
          textMargin: 2,
        })
      } catch (e) {
        console.error('Barcode error:', e)
      }
    }
  }, [value, width, height])

  return <canvas ref={canvasRef} style={{ maxWidth: '100%', objectFit: 'contain' }} />
}

const COLUMN_OPTIONS = [1, 2, 3]

export default function StickerTagModal({ isOpen, onClose }: StickerTagModalProps) {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [tagItems, setTagItems] = useState<TagItem[]>([])
  // แผนที่หน่วยในการขาย: productCode -> รายการหน่วยย่อย
  const [unitMap, setUnitMap] = useState<Record<string, UnitConv[]>>({})
  const [tagWidth, setTagWidth] = useState(3)  // Default 3 cm
  const [tagHeight, setTagHeight] = useState(2)  // Default 2 cm
  const [cols, setCols] = useState(1)  // จำนวนคอลัมน์ต่อแถว (1 / 2 / 3)
  const [gapX, setGapX] = useState(0)  // ระยะห่างแนวนอน (ระหว่างคอลัมน์) cm — สำหรับกระดาษ label
  const [gapY, setGapY] = useState(0)  // ระยะห่างแนวตั้ง (ระหว่างแถว) cm — สำหรับกระดาษ label
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const totalTags = tagItems.reduce((sum, t) => sum + t.qty, 0)

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
      fetchUnitConversions()
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchProducts = async () => {
    const companyS = localStorage.getItem('company_') || ''
    try {
      const res = await axios.get(`/api/datalist?company=${companyS}&fields=sale`)
      setProducts(res.data || [])
    } catch (error) {
      console.error(error)
    }
  }

  // ดึงหน่วยในการขายทั้งหมดของร้าน แล้วจัดกลุ่มตาม productCode
  const fetchUnitConversions = async () => {
    const companyS = localStorage.getItem('company_') || ''
    try {
      const res = await axios.get(`/api/unitconversion?company=${companyS}`)
      const map: Record<string, UnitConv[]> = {}
      for (const u of (res.data || []) as UnitConv[]) {
        const code = u.productCode || ''
        if (!code) continue
        if (!map[code]) map[code] = []
        map[code].push(u)
      }
      setUnitMap(map)
    } catch (error) {
      console.error(error)
    }
  }

  // สร้างตัวเลือกหน่วยของสินค้า: หน่วยหลัก + หน่วยขายย่อยแต่ละหน่วย
  const getVariants = (product: Product): Variant[] => {
    const base: Variant = {
      unitKey: 'base',
      unitLabel: product.Unit || '',
      price: product.price ?? 0,
      barcode: product.Barcode || '',
    }
    const convs = (unitMap[product.code] || []).map((c) => ({
      unitKey: `conv-${c.id}`,
      unitLabel: c.saleUnit || '',
      price: c.priceRetail ?? 0,
      barcode: c.Barcode || '',
    }))
    return [base, ...convs]
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    if (value.trim()) {
      const lower = value.toLowerCase()
      const filtered = products.filter(
        (p) =>
          p.ProductName?.toLowerCase().includes(lower) ||
          p.code?.toLowerCase().includes(lower) ||
          p.Barcode?.toLowerCase().includes(lower)
      )
      setFilteredProducts(filtered)
      setShowDropdown(true)
    } else {
      setFilteredProducts([])
      setShowDropdown(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredProducts.length === 1) {
      const p = filteredProducts[0]
      addVariant(p, getVariants(p)[0])
    }
  }

  // เพิ่มสติ๊กเกอร์ของสินค้า+หน่วยที่เลือก (สินค้าเดียวกันคนละหน่วย = คนละสติ๊กเกอร์)
  const addVariant = (product: Product, variant: Variant) => {
    const itemId = `${product.id}-${variant.unitKey}`
    const existing = tagItems.find((t) => t.id === itemId)
    if (existing) {
      setTagItems(tagItems.map((t) => (t.id === itemId ? { ...t, qty: t.qty + 1 } : t)))
    } else {
      setTagItems([
        ...tagItems,
        {
          id: itemId,
          product,
          unitKey: variant.unitKey,
          unitLabel: variant.unitLabel,
          price: variant.price,
          barcode: variant.barcode,
          qty: 1,
        },
      ])
    }
    setSearch('')
    setFilteredProducts([])
    setShowDropdown(false)
    searchRef.current?.focus()
  }

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) {
      setTagItems(tagItems.filter((t) => t.id !== id))
    } else {
      setTagItems(tagItems.map((t) => (t.id === id ? { ...t, qty } : t)))
    }
  }

  const removeItem = (id: string) => {
    setTagItems(tagItems.filter((t) => t.id !== id))
  }

  // Generate flat list of all stickers (continuous roll / label sheet)
  const allTags: TagData[] = []
  tagItems.forEach((item) => {
    for (let i = 0; i < item.qty; i++) {
      allTags.push({
        ProductName: item.product.ProductName,
        code: item.product.code,
        price: item.price,
        barcode: item.barcode,
        unitLabel: item.unitLabel,
      })
    }
  })

  const handlePrint = useCallback(() => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printTags = allTags.slice(0, 300)
    // ขนาดหน้ากระดาษต้องเท่ากับเนื้อหาจริงเป๊ะๆ ไม่งั้นเครื่องพิมพ์ความร้อนจะฟีดกระดาษ
    // ออกมายาวเท่าขนาด default ของไดรเวอร์ (size: auto)
    const rows = Math.ceil(printTags.length / cols)
    const pageW = tagWidth * cols + gapX * (cols - 1) + 0.1
    const contentH = rows * tagHeight + Math.max(0, rows - 1) * gapY
    // ถ้าหน้ากว้างมากกว่าสูง Chrome จะถือว่าเป็นหน้าแนวนอน (landscape) แล้วสั่งไดรเวอร์
    // หมุนงานพิมพ์ 90° ทำให้พิมพ์ออกมาผิดแนว จึงบังคับความสูงขั้นต่ำ = ความกว้าง
    // เพื่อให้เป็นแนวตั้งเสมอ (งานสั้นๆ จะมีท้ายหน้าว่างเล็กน้อย)
    const pageH = Math.max(contentH, pageW)

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>สติ๊กเกอร์ติดสินค้า</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page {
            size: ${pageW}cm ${pageH}cm;
            margin: 0mm !important;
            padding: 0mm !important;
          }
          @media print {
            html, body {
              width: ${pageW}cm;
              height: ${pageH}cm;
              overflow: hidden;
              margin: 0mm !important;
              padding: 0mm !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .sticker-container {
              margin: 0 !important;
              padding: 0 !important;
            }
            .sticker { page-break-inside: avoid; margin: 0; padding: 0.1cm; border: none; }
          }
          html, body {
            font-family: 'Kanit', sans-serif;
            margin: 0 !important;
            padding: 0 !important;
          }
          .sticker-container {
            width: ${pageW}cm;
            margin: 0;
            padding: 0;
            display: flex;
            flex-wrap: wrap;
            align-content: flex-start;
            column-gap: ${gapX}cm;
            row-gap: ${gapY}cm;
          }
          .sticker {
            width: ${tagWidth}cm;
            height: ${tagHeight}cm;
            border: 1px dashed #cbd5e1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 0.1cm;
            overflow: hidden;
            box-sizing: border-box;
          }
          .sticker-name {
            font-size: 8px;
            font-weight: 600;
            text-align: center;
            color: #1e293b;
            line-height: 1.2;
            width: 100%;
            margin-bottom: 1px;
            word-break: break-word;
          }
          .sticker-code {
            font-size: 6px;
            color: #64748b;
            margin-bottom: 1px;
          }
          .sticker-price {
            font-size: 13px;
            font-weight: 700;
            color: #1E5088;
            margin-bottom: 1px;
          }
          .sticker-price .unit {
            font-size: 8px;
            font-weight: 500;
            color: #64748b;
          }
          .sticker-barcode canvas {
            max-width: 100%;
            height: auto;
            margin-top: 1px;
            object-fit: contain;
          }
          .sticker-barcode text { font-size: 10px !important; }
        </style>
      </head>
      <body>
        <div class="sticker-container">
          ${printTags.map((tag) => `
            <div class="sticker">
              <div class="sticker-name">${tag.ProductName}</div>
              <div class="sticker-price">฿${tag.price?.toFixed(0)}${tag.unitLabel ? `<span class="unit"> /${tag.unitLabel}</span>` : ''}</div>
              ${tag.barcode ? `
                <div class="sticker-barcode">
                  <canvas data-barcode="${tag.barcode}"></canvas>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `)

    // Wait for barcodes to render
    setTimeout(() => {
      const canvases = printWindow.document.querySelectorAll('canvas[data-barcode]')
      canvases.forEach((canvas: any) => {
        const value = canvas.getAttribute('data-barcode')
        if (value) {
          try {
            JsBarcode(canvas, value, {
              format: 'CODE128',
              width: 1.5,
              height: Math.max(35, tagHeight * 0.3 * 37.8),
              displayValue: true,
              fontSize: 10,
              font: 'Kanit',
              margin: 0,
              textMargin: 2,
            })
          } catch (e) { console.error(e) }
        }
      })
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 300)
    }, 500)
  }, [tagWidth, tagHeight, cols, gapX, gapY, allTags])

  return (
    <Modal show={isOpen} onHide={onClose} size="xl" fullscreen="lg-down" dialogClassName="modal-90w">
      <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: 'white', padding: '12px 20px' }}>
        <Modal.Title style={{ fontFamily: 'Kanit_B', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🎯 สติ๊กเกอร์ติดสินค้า - Product Sticker Generator
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '0', display: 'flex', height: '80vh', overflow: 'hidden' }}>

        {/* Left Panel - Controls */}
        <div style={{ width: '350px', minWidth: '350px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>

          {/* Search Section */}
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white' }}>
            <div style={{ fontFamily: 'Kanit_B', fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
              🔍 ค้นหาสินค้า
            </div>
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Scan barcode หรือพิมพ์ รหัส/ชื่อสินค้า..."
                style={{
                  fontFamily: 'Kanit', fontSize: '12px', width: '100%', padding: '10px 12px',
                  border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#d97706'; e.target.style.boxShadow = '0 0 0 3px rgba(217,119,6,0.15)' }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
              {showDropdown && filteredProducts.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                  backgroundColor: 'white', borderRadius: '0 0 8px 8px', border: '1px solid #e2e8f0',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '300px', overflowY: 'auto'
                }}>
                  {filteredProducts.slice(0, 20).map((p) => {
                    const variants = getVariants(p)
                    const convVariants = variants.slice(1) // หน่วยขายย่อย (ไม่รวมหน่วยหลัก)
                    return (
                      <div key={p.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '8px 12px' }}>
                        <div onClick={() => addVariant(p, variants[0])} style={{
                          cursor: 'pointer', transition: 'background 0.15s', fontFamily: 'Kanit', fontSize: '12px',
                          borderRadius: '6px', padding: '2px 4px',
                        }}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fffbeb' }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ color: '#d97706', fontWeight: 600, marginRight: '10px' }}>{p.code}</span>
                              <span style={{ color: '#334155' }}>{p.ProductName}</span>
                            </div>
                            <span style={{ color: '#b45309', fontWeight: 700, fontSize: '16px' }}>
                              ฿{p.price?.toFixed(0)}{p.Unit ? <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}> /{p.Unit}</span> : null}
                            </span>
                          </div>
                          {p.Barcode && <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Barcode: {p.Barcode}</div>}
                        </div>

                        {/* หน่วยในการขายอื่นๆ ของสินค้าตัวเดียวกัน */}
                        {convVariants.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px', paddingLeft: '4px' }}>
                            {convVariants.map((v) => (
                              <button
                                key={v.unitKey}
                                type="button"
                                onClick={() => addVariant(p, v)}
                                style={{
                                  fontFamily: 'Kanit', fontSize: '11px', border: '1px solid #fde68a',
                                  backgroundColor: '#fffbeb', color: '#b45309', borderRadius: '999px',
                                  padding: '3px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fef3c7' }}
                                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fffbeb' }}
                              >
                                <span style={{ fontWeight: 700 }}>+ {v.unitLabel || 'หน่วย'}</span>
                                <span style={{ fontWeight: 600 }}>฿{v.price.toFixed(0)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Tag Size Settings */}
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white' }}>
            <div style={{ fontFamily: 'Kanit_B', fontSize: '13px', color: '#334155', marginBottom: '10px' }}>
              📐 ขนาดสติ๊กเกอร์ (สำหรับพิมพ์สติ๊กเกอร์ความร้อน)
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>กว้าง (cm)</label>
                <input type="number" value={tagWidth} onChange={(e) => setTagWidth(Number(e.target.value) || 3)} step={0.1} min={2} max={6}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: 'Kanit', textAlign: 'center' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>ยาว (cm)</label>
                <input type="number" value={tagHeight} onChange={(e) => setTagHeight(Number(e.target.value) || 2)} step={0.1} min={1.5} max={5}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: 'Kanit', textAlign: 'center' }}
                />
              </div>
            </div>

            {/* จำนวนคอลัมน์ */}
            <div style={{ marginTop: '12px' }}>
              <label style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '6px' }}>จำนวนคอลัมน์ต่อแถว</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {COLUMN_OPTIONS.map((c) => {
                  const active = cols === c
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCols(c)}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: '8px', cursor: 'pointer',
                        fontFamily: 'Kanit_B', fontSize: '13px',
                        border: active ? '1px solid #d97706' : '1px solid #e2e8f0',
                        background: active ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : 'white',
                        color: active ? 'white' : '#64748b',
                        boxShadow: active ? '0 2px 6px rgba(217,119,6,0.25)' : 'none',
                        transition: 'all 0.15s',
                      }}
                    >{c} คอลัมน์</button>
                  )
                })}
              </div>
            </div>

            {/* ระยะห่างระหว่างดวง (สำหรับกระดาษ label ที่มีร่องว่าง) */}
            <div style={{ marginTop: '12px' }}>
              <label style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '6px' }}>ระยะห่างระหว่างดวง (สำหรับกระดาษ label)</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontFamily: 'Kanit', fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ห่างแนวนอน (cm)</label>
                  <input type="number" value={gapX} onChange={(e) => setGapX(Math.max(0, Number(e.target.value) || 0))} step={0.1} min={0} max={3}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: 'Kanit', textAlign: 'center' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontFamily: 'Kanit', fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ห่างแนวตั้ง (cm)</label>
                  <input type="number" value={gapY} onChange={(e) => setGapY(Math.max(0, Number(e.target.value) || 0))} step={0.1} min={0} max={3}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: 'Kanit', textAlign: 'center' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '10px', fontFamily: 'Kanit', fontSize: '11px', color: '#94a3b8' }}>
              <span>ความกว้างรวม {(tagWidth * cols + gapX * (cols - 1)).toFixed(1)} cm ({cols} คอลัมน์{gapX > 0 || gapY > 0 ? `, ห่าง ${gapX}×${gapY} cm` : ''})</span>
            </div>
          </div>

          {/* Selected Products List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            <div style={{ fontFamily: 'Kanit_B', fontSize: '13px', color: '#334155', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>📋 รายการสินค้า ({tagItems.length})</span>
              <span style={{ color: '#d97706', fontWeight: 600 }}>รวม {totalTags} สติ๊กเกอร์</span>
            </div>
            {tagItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 16px', color: '#94a3b8', fontFamily: 'Kanit', fontSize: '12px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎯</div>
                ค้นหาและเลือกสินค้าเพื่อสร้างสติ๊กเกอร์
              </div>
            ) : (
              tagItems.map((item) => (
                <div key={item.id} style={{
                  backgroundColor: 'white', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px',
                  border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#334155', fontWeight: 500, lineHeight: 1.3 }}>
                        {item.product.ProductName}
                        {item.unitLabel && (
                          <span style={{
                            marginLeft: '6px', fontSize: '10px', color: '#b45309', fontWeight: 600,
                            backgroundColor: '#fffbeb', borderRadius: '999px', padding: '1px 7px',
                          }}>{item.unitLabel}</span>
                        )}
                      </div>
                      <div style={{ fontFamily: 'Kanit', fontSize: '10px', color: '#d97706' }}>
                        {item.product.code} | ฿{item.price?.toFixed(0)}
                        {item.barcode ? ` | ${item.barcode}` : ''}
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.id)} style={{
                      background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', padding: '0 4px', lineHeight: 1
                    }}>×</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#64748b' }}>จำนวน:</span>
                    <button onClick={() => updateQty(item.id, item.qty - 1)} style={{
                      width: '24px', height: '24px', border: '1px solid #e2e8f0', borderRadius: '4px',
                      background: 'white', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>−</button>
                    <input type="number" value={item.qty} onChange={(e) => updateQty(item.id, Number(e.target.value) || 1)} min={1}
                      style={{ width: '50px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px', fontSize: '13px', fontFamily: 'Kanit' }}
                    />
                    <button onClick={() => updateQty(item.id, item.qty + 1)} style={{
                      width: '24px', height: '24px', border: '1px solid #e2e8f0', borderRadius: '4px',
                      background: 'white', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>+</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', gap: '8px' }}>
            <button onClick={() => setTagItems([])} style={{
              flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white',
              fontFamily: 'Kanit', fontSize: '12px', color: '#64748b', cursor: 'pointer'
            }}>ล้างทั้งหมด</button>
            <button onClick={handlePrint} disabled={tagItems.length === 0} style={{
              flex: 2, padding: '10px', border: 'none', borderRadius: '8px',
              background: tagItems.length > 0 ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : '#e2e8f0',
              fontFamily: 'Kanit_B', fontSize: '13px', color: tagItems.length > 0 ? 'white' : '#94a3b8',
              cursor: tagItems.length > 0 ? 'pointer' : 'not-allowed',
              boxShadow: tagItems.length > 0 ? '0 2px 8px rgba(217,119,6,0.3)' : 'none'
            }}>🖨️ พิมพ์สติ๊กเกอร์ ({totalTags} ดวง)</button>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontFamily: 'Kanit_B', fontSize: '14px', color: '#475569', textAlign: 'center' }}>
            ตัวอย่างสติ๊กเกอร์ ({tagWidth} × {tagHeight} cm) × {cols} คอลัมน์ — {totalTags} ดวง
          </div>

          {allTags.length === 0 ? (
            <div style={{
              width: `${(tagWidth + 0.4) * 37.8}px`, height: `${(tagHeight + 0.4) * 37.8}px`,
              backgroundColor: 'white', borderRadius: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
              color: '#94a3b8', fontFamily: 'Kanit'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎯</div>
              <div style={{ fontSize: '14px' }}>เลือกสินค้าเพื่อดูตัวอย่างสติ๊กเกอร์</div>
            </div>
          ) : (
            <div style={{
              width: `${(tagWidth * cols + gapX * (cols - 1)) * 37.8 + 2}px`,
              boxSizing: 'content-box',
              backgroundColor: 'white', borderRadius: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start',
              padding: '8px', columnGap: `${gapX * 37.8}px`, rowGap: `${gapY * 37.8}px`
            }}>
              {allTags.slice(0, 60).map((tag, index) => (
                <div key={index} style={{
                  width: `${tagWidth * 37.8}px`, height: `${tagHeight * 37.8}px`,
                  border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', padding: '4px',
                  overflow: 'hidden', backgroundColor: '#fafafa', boxSizing: 'border-box'
                }}>
                  <div style={{
                    fontFamily: 'Kanit', fontSize: '8px', fontWeight: 600, textAlign: 'center',
                    color: '#1e293b', lineHeight: 1.2,
                    width: '100%', marginBottom: '1px', wordBreak: 'break-word' as any
                  }}>{tag.ProductName}</div>
                  <div style={{
                    fontFamily: 'Kanit_B', fontSize: '13px', color: '#b45309', fontWeight: 700, marginBottom: '1px'
                  }}>
                    ฿{tag.price?.toFixed(0)}
                    {tag.unitLabel ? <span style={{ fontSize: '8px', fontWeight: 500, color: '#64748b' }}> /{tag.unitLabel}</span> : null}
                  </div>
                  {tag.barcode && (
                    <div style={{ maxWidth: '100%' }}>
                      <BarcodeCanvas value={tag.barcode} width={tagWidth * 37.8} height={tagHeight * 37.8} />
                    </div>
                  )}
                </div>
              ))}
              {allTags.length > 60 && (
                <div style={{ width: '100%', padding: '8px', fontFamily: 'Kanit', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                  ... และอีก {allTags.length - 60} ดวง
                </div>
              )}
            </div>
          )}

          {/* Hidden print anchor (print HTML is generated in handlePrint) */}
          <div ref={printRef} style={{ display: 'none' }} />
        </div>
      </Modal.Body>
    </Modal>
  )
}
