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
  unitLabel: string    // ชื่อหน่วยที่จะแสดงบนป้าย
  price: number        // ราคาของหน่วยนี้
  barcode: string      // บาร์โค้ดของหน่วยนี้
}

interface TagItem {
  id: string           // `${product.id}-${unitKey}` เพื่อแยกป้ายของแต่ละหน่วย
  product: Product
  unitKey: string
  unitLabel: string
  price: number
  barcode: string
  qty: number
}

// ข้อมูลป้าย 1 ใบที่จะแสดง/พิมพ์
interface TagData {
  ProductName: string
  code: string
  price: number
  barcode: string
  unitLabel: string
}

interface PriceTagModalProps {
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
          width: 1.2,
          height: Math.max(18, height * 0.175),
          displayValue: true,
          fontSize: 9,
          font: 'Kanit',
          margin: 2,
          textMargin: 1,
        })
      } catch (e) {
        console.error('Barcode error:', e)
      }
    }
  }, [value, width, height])

  return <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />
}

export default function PriceTagModal({ isOpen, onClose }: PriceTagModalProps) {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [tagItems, setTagItems] = useState<TagItem[]>([])
  // แผนที่หน่วยในการขาย: productCode -> รายการหน่วยย่อย
  const [unitMap, setUnitMap] = useState<Record<string, UnitConv[]>>({})
  const [tagWidth, setTagWidth] = useState(5)
  const [tagHeight, setTagHeight] = useState(3.5)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // A4 dimensions in cm
  const a4Width = 21
  const a4Height = 29.7
  const pageMargin = 0.5

  const cols = Math.floor((a4Width - pageMargin * 2) / tagWidth)
  const rows = Math.floor((a4Height - pageMargin * 2) / tagHeight)
  const tagsPerPage = cols * rows

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

  const [l, setlevel] = useState([])
  const Getlevel = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/level?company=${companyS}`)  //Get_Employee
      await setlevel(res.data)

    } catch (error) {
      console.error(error)
    }

  }
  // การมองเห็น
  useEffect(() => {
    const SS = async () => {
      try {
        await Getlevel()
      } catch (error) {
        console.error(error)
      }
    }
    SS

  }, []);

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

  // เพิ่มป้ายของสินค้า+หน่วยที่เลือก (สินค้าเดียวกันคนละหน่วย = คนละป้าย)
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

  const totalTags = tagItems.reduce((sum, t) => sum + t.qty, 0)
  const totalPages = Math.ceil(totalTags / tagsPerPage)

  // Generate flat list of all tags
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

  // Split into pages
  const pages: TagData[][] = []
  for (let i = 0; i < allTags.length; i += tagsPerPage) {
    pages.push(allTags.slice(i, i + tagsPerPage))
  }

  const handlePrint = useCallback(() => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>ป้ายราคา</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A4 portrait; margin: ${pageMargin}cm; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page-break { page-break-after: always; }
          }
          body { font-family: 'Kanit', sans-serif; }
          .page {
            width: ${a4Width - pageMargin * 2}cm;
            height: ${a4Height - pageMargin * 2}cm;
            display: flex;
            flex-wrap: wrap;
            align-content: flex-start;
          }
          .tag {
            width: ${tagWidth}cm;
            height: ${tagHeight}cm;
            border: 1px dashed #cbd5e1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 0.15cm;
            overflow: hidden;
          }
          .tag-name {
            font-size: 13px;
            font-weight: 600;
            text-align: center;
            color: #1e293b;
            line-height: 1.3;
            width: 100%;
            margin-bottom: 2px;
            word-break: break-word;
          }
          .tag-code {
            font-size: 9px;
            color: #64748b;
            margin-bottom: 2px;
          }
          .tag-price {
            font-size: 23px;
            font-weight: 700;
            color: #1E5088;
            margin-bottom: 1px;
          }
          .tag-price .unit {
            font-size: 11px;
            font-weight: 500;
            color: #64748b;
          }
          .tag-unit {
            font-size: 7px;
            color: #94a3b8;
          }
          .tag-pic {
            width: 30px;
            height: 30px;
            object-fit: cover;
            border-radius: 4px;
            margin-bottom: 2px;
          }
          .tag-barcode canvas { max-width: 90%; }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
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
              width: 1.2,
              height: Math.max(18, tagHeight * 0.175 * 37.8),
              displayValue: true,
              fontSize: 9,
              font: 'Kanit',
              margin: 2,
              textMargin: 1,
            })
          } catch (e) { console.error(e) }
        }
      })
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 300)
    }, 500)
  }, [tagItems, tagWidth, tagHeight, pageMargin])

  return (
    <Modal show={isOpen} onHide={onClose} size="xl" fullscreen="lg-down" dialogClassName="modal-90w">
      <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #3E86C7 0%, #1E5088 100%)', color: 'white', padding: '12px 20px' }}>
        <Modal.Title style={{ fontFamily: 'Kanit_B', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🏷️ ป้ายราคา - Price Tag Generator
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
                onFocus={(e) => { e.target.style.borderColor = '#3E86C7'; e.target.style.boxShadow = '0 0 0 3px rgba(62, 134, 199,0.15)' }}
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
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F3F8FC' }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ color: '#3E86C7', fontWeight: 600, marginRight: '10px' }}>{p.code}</span>
                              <span style={{ color: '#334155' }}>{p.ProductName}</span>
                            </div>
                            <span style={{ color: '#1E5088', fontWeight: 700, fontSize: '16px' }}>
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
                                  fontFamily: 'Kanit', fontSize: '11px', border: '1px solid #CCDFF1',
                                  backgroundColor: '#F3F8FC', color: '#1E5088', borderRadius: '999px',
                                  padding: '3px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#E5EEF8' }}
                                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#F3F8FC' }}
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
              📐 ขนาดป้าย
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>กว้าง (cm)</label>
                <input type="number" value={tagWidth} onChange={(e) => setTagWidth(Number(e.target.value) || 5)} step={0.1} min={2} max={10}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: 'Kanit', textAlign: 'center' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>ยาว (cm)</label>
                <input type="number" value={tagHeight} onChange={(e) => setTagHeight(Number(e.target.value) || 3.5)} step={0.1} min={2} max={15}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: 'Kanit', textAlign: 'center' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontFamily: 'Kanit', fontSize: '11px', color: '#94a3b8' }}>
              <span>{cols} คอลัมน์ × {rows} แถว</span>
              <span>{tagsPerPage} ป้าย/แผ่น</span>
            </div>
          </div>

          {/* Selected Products List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            <div style={{ fontFamily: 'Kanit_B', fontSize: '13px', color: '#334155', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>📋 รายการสินค้า ({tagItems.length})</span>
              <span style={{ color: '#3E86C7', fontWeight: 600 }}>รวม {totalTags} ป้าย</span>
            </div>
            {tagItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 16px', color: '#94a3b8', fontFamily: 'Kanit', fontSize: '12px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏷️</div>
                ค้นหาและเลือกสินค้าเพื่อสร้างป้ายราคา
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
                            marginLeft: '6px', fontSize: '10px', color: '#1E5088', fontWeight: 600,
                            backgroundColor: '#F3F8FC', borderRadius: '999px', padding: '1px 7px',
                          }}>{item.unitLabel}</span>
                        )}
                      </div>
                      <div style={{ fontFamily: 'Kanit', fontSize: '10px', color: '#3E86C7' }}>
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
              background: tagItems.length > 0 ? 'linear-gradient(135deg, #3E86C7 0%, #1E5088 100%)' : '#e2e8f0',
              fontFamily: 'Kanit_B', fontSize: '13px', color: tagItems.length > 0 ? 'white' : '#94a3b8',
              cursor: tagItems.length > 0 ? 'pointer' : 'not-allowed',
              boxShadow: tagItems.length > 0 ? '0 2px 8px rgba(62, 134, 199,0.3)' : 'none'
            }}>🖨️ พิมพ์ป้ายราคา ({totalTags} ป้าย / {totalPages} หน้า)</button>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontFamily: 'Kanit_B', fontSize: '14px', color: '#475569', textAlign: 'center' }}>
            ตัวอย่างหน้า A4 ({tagWidth} × {tagHeight} cm) — {tagsPerPage} ป้าย/แผ่น
          </div>

          {pages.length === 0 ? (
            <div style={{
              width: `${(a4Width - pageMargin * 2) * 37.8}px`, height: `${(a4Height - pageMargin * 2) * 37.8}px`,
              backgroundColor: 'white', borderRadius: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
              color: '#94a3b8', fontFamily: 'Kanit', transform: 'scale(0.75)', transformOrigin: 'top center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏷️</div>
              <div style={{ fontSize: '14px' }}>เลือกสินค้าเพื่อดูตัวอย่างป้ายราคา</div>
            </div>
          ) : (
            pages.map((page, pageIndex) => (
              <div key={pageIndex} style={{
                width: `${(a4Width - pageMargin * 2) * 37.8}px`,
                minHeight: `${(a4Height - pageMargin * 2) * 37.8}px`,
                backgroundColor: 'white', borderRadius: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start',
                padding: '0', transform: 'scale(0.75)', transformOrigin: 'top center',
              }}>
                {page.map((tag, tagIndex) => (
                  <div key={`${pageIndex}-${tagIndex}`} style={{
                    width: `${tagWidth * 37.8}px`, height: `${tagHeight * 37.8}px`,
                    border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', padding: '4px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      fontFamily: 'Kanit', fontSize: '13px', fontWeight: 600, textAlign: 'center',
                      color: '#1e293b', lineHeight: 1.3,
                      width: '100%', marginBottom: '2px', wordBreak: 'break-word' as any
                    }}>{tag.ProductName}</div>
                    <div style={{ fontFamily: 'Kanit', fontSize: '9px', color: '#64748b', marginBottom: '1px' }}>
                      รหัส: {tag.code}
                    </div>
                    <div style={{
                      fontFamily: 'Kanit_B', fontSize: '27px', color: '#1E5088', fontWeight: 700, marginBottom: '2px'
                    }}>
                      ฿{tag.price?.toFixed(0)}
                      {tag.unitLabel ? <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}> /{tag.unitLabel}</span> : null}
                    </div>
                    {tag.barcode && (
                      <div style={{ maxWidth: '90%' }}>
                        <BarcodeCanvas value={tag.barcode} width={tagWidth * 37.8} height={tagHeight * 37.8} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}

          {/* Hidden print content */}
          <div ref={printRef} style={{ display: 'none' }}>
            {pages.map((page, pageIndex) => (
              <div key={pageIndex} className={pageIndex < pages.length - 1 ? 'page-break' : ''} style={{
                width: `${a4Width - pageMargin * 2}cm`,
                minHeight: `${a4Height - pageMargin * 2}cm`,
                display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start',
              }}>
                {page.map((tag, tagIndex) => (
                  <div key={`${pageIndex}-${tagIndex}`} className="tag" style={{
                    width: `${tagWidth}cm`, height: `${tagHeight}cm`,
                    border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', padding: '0.15cm',
                    overflow: 'hidden', boxSizing: 'border-box',
                  }}>
                    <div className="tag-name">{tag.ProductName}</div>
                    <div className="tag-code">รหัส: {tag.code}</div>
                    <div className="tag-price">
                      ฿{tag.price?.toFixed(0)}
                      {tag.unitLabel ? <span className="unit"> /{tag.unitLabel}</span> : null}
                    </div>
                    {tag.barcode && (
                      <div className="tag-barcode">
                        <canvas data-barcode={tag.barcode} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Modal.Body>
    </Modal>
  )
}
