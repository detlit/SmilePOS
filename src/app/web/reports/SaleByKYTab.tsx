'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Search, Package, RefreshCw, X, FileText, ShoppingCart, Calendar } from 'lucide-react'
import { getLocalStorageItem } from '@/utils/localStorage';

const apidatalist = "datalist"
const apisaleitem = "sale_cal/sale_list_item"
const apibalance = "sale_cal/sale_balance"

export default function SaleByKYTab() {
  // Search & product list
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [selectedKY, setSelectedKY] = useState('')

  const kyOptions = [
    { label: 'ทั้งหมด', value: '' },
    { label: 'ข.ย.9', value: 'ky9', match: ['ข.ย.9', 'ขย.9'] },
    { label: 'ข.ย.10', value: 'ky10', match: ['ข.ย.10', 'ขย.10'] },
    { label: 'ข.ย.11', value: 'ky11', match: ['ข.ย.11', 'ขย.11'] },
    { label: 'ข.ย.12', value: 'ky12', match: ['ข.ย.12', 'ขย.12'] },
    { label: 'ข.ย.13', value: 'ky13', match: ['ข.ย.13', 'ขย.13'] },
  ]

  // Selected product
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedItemCode, setSelectedItemCode] = useState('')

  // Product detail
  const [productDetail, setProductDetail] = useState<any>(null)
  const [itemSale, setItemSale] = useState<any[]>([])
  const [itemBalance, setItemBalance] = useState<any[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Fetch product list
  useEffect(() => {
    const fetchProducts = async () => {
      const company = getLocalStorageItem("company_") || ""
      try {
        setLoadingProducts(true)
        const res = await axios.get(`/api/${apidatalist}?company=${company}&fields=list`)
        setProducts(res.data || [])
      } catch (e) { console.error(e) }
      finally { setLoadingProducts(false) }
    }
    fetchProducts()
  }, [])

  // Fetch product detail when selected
  useEffect(() => {
    if (!selectedProductId) return
    const fetchAll = async () => {
      setLoadingDetail(true)
      try {
        await Promise.all([fetchProductDetail(), fetchSaleItems(), fetchBalance()])
      } catch (e) { console.error(e) }
      finally { setLoadingDetail(false) }
    }
    fetchAll()
  }, [selectedProductId])

  const fetchProductDetail = async () => {
    try {
      const res = await axios.get(`/api/${apidatalist}/${Number(selectedProductId)}`)
      setProductDetail(res.data)
    } catch (e) { console.error(e) }
  }

  const fetchSaleItems = async () => {
    const company = getLocalStorageItem("company_") || ""
    try {
      const res = await axios.get(`/api/${apisaleitem}?company=${company}&code_product=${selectedItemCode}`)
      setItemSale(res.data || [])
    } catch (e) { console.error(e) }
  }

  const fetchBalance = async () => {
    const company = getLocalStorageItem("company_") || ""
    try {
      const idQuery = selectedProductId ? `&id=${selectedProductId}` : ''
      const res = await axios.get(`/api/${apibalance}?company=${company}&code_product=${selectedItemCode}${idQuery}`)
      setItemBalance(res.data || [])
    } catch (e) { console.error(e) }
  }

  const selectProduct = (product: any) => {
    setSelectedProductId(String(product.id))
    setSelectedItemCode(String(product.code))
  }

  // Filtered product search
  const filteredProducts = products.filter((p: any) => {
    // Filter by ข.ย. dropdown
    if (selectedKY) {
      const opt = kyOptions.find(o => o.value === selectedKY)
      if (opt && opt.match) {
        const typeVal = (p.type || '').trim()
        const subtypeVal = (p.subtype || '').trim()
        const matched = opt.match.some((m: string) => typeVal === m || subtypeVal === m)
        if (!matched) return false
      }
    }
    // Filter by search query
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return p.ProductName?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q) || p.Barcode?.toLowerCase().includes(q)
  })

  // Format helpers
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const balanceVal = itemBalance.length > 0 ? itemBalance.map((r: any) => r.balance) : [0]

  // Summary calculations
  const totalQtySold = itemSale.reduce((sum: number, it: any) => {
    const subqty = it.subqty
    if (subqty === 0 || subqty === "" || subqty === null || subqty === undefined) {
      return sum + (Number(it.qty) || 0)
    } else {
      return sum + (Number(it.subqty) || 0)
    }
  }, 0)

  const totalRevenue = itemSale.reduce((sum: number, it: any) => sum + (Number(it.total) || 0), 0)
  const totalCost = itemSale.reduce((sum: number, it: any) => {
    const subqty = it.subqty
    const qty = (subqty === 0 || subqty === "" || subqty === null || subqty === undefined)
      ? (Number(it.qty) || 0)
      : (Number(it.subqty) || 0)
    return sum + (qty * (Number(it.cost) || 0))
  }, 0)

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      height: '88vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: 'white',
        flexShrink: 0
      }}>
        <FileText size={20} />
        <span style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'Kanit, sans-serif' }}>รายงานขายตาม ข.ย.</span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left: Product search */}
        <div style={{
          width: '320px', borderRight: '1px solid #e2e8f0',
          display: 'flex', flexDirection: 'column', backgroundColor: 'white', flexShrink: 0
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Search size={14} color="#8b5cf6" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', fontFamily: 'Kanit, sans-serif' }}>ค้นหาสินค้า</span>
              <select
                value={selectedKY}
                onChange={(e) => setSelectedKY(e.target.value)}
                style={{
                  marginLeft: 'auto',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '11px',
                  fontFamily: 'Kanit, sans-serif',
                  color: selectedKY ? '#7c3aed' : '#64748b',
                  backgroundColor: selectedKY ? '#f5f3ff' : 'white',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {kyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input type="text" placeholder="ชื่อสินค้า, รหัส, Barcode..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '9px 10px 9px 32px', border: '1px solid #e2e8f0',
                  borderRadius: '8px', fontSize: '12px', fontFamily: 'Kanit, sans-serif', outline: 'none'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#8b5cf6' }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: '#e5e7eb', border: 'none', borderRadius: '50%',
                  width: '18px', height: '18px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer'
                }}>
                  <X size={10} color="#6b7280" />
                </button>
              )}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingProducts ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: '13px' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                <div>กำลังโหลดข้อมูล...</div>
              </div>
            ) : (
              filteredProducts.slice(0, 100).map((product: any) => (
                <div key={product.id} onClick={() => selectProduct(product)}
                  style={{
                    padding: '10px 16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer',
                    transition: 'background 0.15s', display: 'flex', alignItems: 'center', gap: '10px',
                    backgroundColor: String(product.id) === selectedProductId ? '#f5f3ff' : 'transparent',
                    borderLeft: String(product.id) === selectedProductId ? '3px solid #8b5cf6' : '3px solid transparent'
                  }}
                  onMouseOver={(e) => { if (String(product.id) !== selectedProductId) e.currentTarget.style.backgroundColor = '#faf5ff' }}
                  onMouseOut={(e) => { if (String(product.id) !== selectedProductId) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <div style={{
                    background: '#f5f3ff', color: '#8b5cf6', padding: '3px 8px',
                    borderRadius: '6px', fontSize: '11px', fontWeight: 600, minWidth: '55px', textAlign: 'center',
                    fontFamily: 'Kanit, sans-serif'
                  }}>{product.code}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Kanit, sans-serif' }}>{product.ProductName}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'Kanit, sans-serif' }}>{product.Barcode}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Sale detail */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedProductId || !productDetail ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
              <div style={{ textAlign: 'center' }}>
                <ShoppingCart size={48} style={{ marginBottom: '12px', color: '#d1d5db' }} />
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#6b7280', fontFamily: 'Kanit, sans-serif' }}>กรุณาเลือกสินค้า</div>
                <div style={{ fontSize: '13px', fontFamily: 'Kanit, sans-serif' }}>เลือกสินค้าจากรายการด้านซ้าย</div>
              </div>
            </div>
          ) : loadingDetail ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
              <div style={{ textAlign: 'center' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                <div style={{ fontSize: '13px', fontFamily: 'Kanit, sans-serif' }}>กำลังโหลดข้อมูล...</div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

              {/* Product Info */}
              <div style={{
                background: 'white', borderRadius: '14px', padding: '16px 20px',
                marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'Kanit, sans-serif' }}>รหัสสินค้า: <strong style={{ color: '#8b5cf6', fontSize: '13px' }}>{productDetail.code}</strong></span>
                      <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'Kanit, sans-serif' }}>Barcode: <strong style={{ color: '#1f2937' }}>{productDetail.Barcode}</strong></span>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#1f2937', marginBottom: '6px', fontFamily: 'Kanit, sans-serif' }}>{productDetail.ProductName}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '10px' }}>
                  {[
                    { label: 'ชื่อสามัญ', value: productDetail.fixname },
                    { label: 'กลุ่มสินค้า', value: productDetail.group },
                    { label: 'หมวด', value: productDetail.Category },
                    { label: 'พื้นที่เก็บ', value: productDetail.Area },
                    { label: 'หน่วย', value: productDetail.Unit },
                    { label: 'ราคา', value: `${productDetail.price || 0} บาท` },
                  ].map((item, i) => (
                    <div key={i}>
                      <div style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'Kanit, sans-serif' }}>{item.label}</div>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: '#374151', fontFamily: 'Kanit, sans-serif' }}>{item.value || '-'}</div>
                    </div>
                  ))}
                </div>
                {/* Summary row */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'linear-gradient(135deg, #E5EEF8 0%, #CCDFF1 100%)',
                    padding: '8px 14px', borderRadius: '10px', border: '2px solid #3E86C7', flex: 1, minWidth: '130px'
                  }}>
                    <span style={{ fontSize: '12px', color: '#173F6B', fontWeight: 500, fontFamily: 'Kanit, sans-serif' }}>คงเหลือ:</span>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#2A6AAA', fontFamily: 'Kanit, sans-serif' }}>{balanceVal}</span>
                    <span style={{ fontSize: '12px', color: '#2A6AAA', fontFamily: 'Kanit, sans-serif' }}>{productDetail.Unit}</span>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                    padding: '8px 14px', borderRadius: '10px', border: '2px solid #ef4444'
                  }}>
                    <span style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 500, fontFamily: 'Kanit, sans-serif' }}>ขายทั้งหมด:</span>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#dc2626', fontFamily: 'Kanit, sans-serif' }}>{totalQtySold}</span>
                    <span style={{ fontSize: '12px', color: '#dc2626', fontFamily: 'Kanit, sans-serif' }}>{productDetail.Unit}</span>
                  </div>
                </div>
              </div>

              {/* Sales Table */}
              <div style={{
                background: 'white', borderRadius: '14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #f0f0f0'
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#d97706', fontFamily: 'Kanit, sans-serif' }}>💰 รายการขายสินค้า ({itemSale.length} รายการ)</span>
                </div>
                {itemSale.length > 0 ? (
                  <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb', position: 'sticky', top: 0, zIndex: 5 }}>
                          {['วันที่ขาย', 'จำนวน', 'หน่วย', 'จำนวนย่อย', 'หน่วยย่อย', 'Lot', 'สถานะ'].map((h, i) => (
                            <th key={i} style={thStyle}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...itemSale].sort((a: any, b: any) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime()).map((p: any, idx: number) => (
                          <tr key={p.id} style={{
                            backgroundColor: idx % 2 === 0 ? 'white' : '#fafbfc',
                            borderBottom: '1px solid #f1f5f9'
                          }}>
                            <td style={{ ...tdStyle, fontSize: '11px' }}>{formatDateTime(p.createDate)}</td>
                            <td style={{ ...tdStyle, fontWeight: 600, color: '#2A6AAA' }}>{p.qty}</td>
                            <td style={{ ...tdStyle, fontSize: '11px' }}>{p.unit}</td>
                            <td style={{ ...tdStyle, fontWeight: 600, color: '#7c3aed' }}>{p.subqty || '-'}</td>
                            <td style={{ ...tdStyle, fontSize: '11px' }}>{p.subunit || '-'}</td>
                            <td style={{ ...tdStyle, fontSize: '11px', color: '#6b7280' }}>{p.lot_receive1 || '-'}</td>
                            <td style={tdStyle}>
                              <span style={{
                                padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 500,
                                backgroundColor: p.statuss === 'ยกเลิก' ? '#fee2e2' : '#D3F0E2',
                                color: p.statuss === 'ยกเลิก' ? '#ef4444' : '#147F56'
                              }}>
                                {p.statuss || 'OK'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: '13px', fontFamily: 'Kanit, sans-serif' }}>
                    ไม่มีข้อมูลการขายสินค้า
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `@keyframes spin { to { transform: rotate(360deg); } }`
      }} />
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '8px 10px', fontSize: '11px', fontWeight: 600, color: '#475569',
  textAlign: 'center', fontFamily: 'Kanit, sans-serif', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap'
}

const tdStyle: React.CSSProperties = {
  padding: '8px 10px', textAlign: 'center', fontFamily: 'Kanit, sans-serif', fontSize: '12px', color: '#334155'
}
