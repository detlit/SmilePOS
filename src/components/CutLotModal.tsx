'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { Package, RefreshCw, CheckCircle, AlertTriangle, X, ChevronDown, ChevronRight } from 'lucide-react'

interface CutLotModalProps {
    show: boolean
    onClose: () => void
    company: string
    person: string
    onComplete?: () => void
}

interface LotChange {
    lotId: number
    lot: string | null
    dateExp: string | null
    received: number
    storedBalance: number
    calcBalance: number
    allocated: number
    newBalance: number
    currentSale: number
    newSale: number
}

interface LotlessItem {
    itemcode: string
    itemName: string
    txCount: number
    totalUnassignedQty: number
    assignable: number
    remaining: number
    saleFallbackWarning: boolean
    lots: LotChange[]
}

interface CutResult {
    assigned: number
    remaining: number
    message: string
    details: {
        itemcode: string
        itemName: string
        totalQty: number
        assigned: number
        remaining: number
        lotsUsed: { lotId: number; lot: string; allocated: number; newBalance: number }[]
    }[]
}

const fmtQty = (n: number) => Number(n || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 })
const fmtDate = (d: string | null) => d
    ? new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-'

export default function CutLotModal({ show, onClose, company, person, onComplete }: CutLotModalProps) {
    const [loading, setLoading] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [items, setItems] = useState<LotlessItem[]>([])
    const [totalQty, setTotalQty] = useState(0)
    const [result, setResult] = useState<CutResult | null>(null)
    const [expanded, setExpanded] = useState<Set<string>>(new Set())

    const fetchLotlessItems = async () => {
        if (!company) return
        setLoading(true)
        setResult(null)
        setExpanded(new Set())
        try {
            const res = await axios.get(`/api/cut-lot-retroactive?company=${company}`)
            setItems(res.data.data || [])
            setTotalQty(res.data.totalQty || 0)
        } catch (err: any) {
            toast.error(<div style={{ fontFamily: 'Kanit' }}>ไม่สามารถดึงข้อมูลได้: {err.message}</div>)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (show) {
            fetchLotlessItems()
        }
    }, [show, company])

    const toggleExpand = (itemcode: string) => {
        setExpanded(prev => {
            const next = new Set(prev)
            if (next.has(itemcode)) next.delete(itemcode)
            else next.add(itemcode)
            return next
        })
    }

    const handleCutAll = async () => {
        setProcessing(true)
        setResult(null)
        try {
            const res = await axios.post('/api/cut-lot-retroactive', { company, person })
            setResult(res.data)
            toast.success(<div style={{ fontFamily: 'Kanit' }}>{res.data.message}</div>)
            // Refresh list
            fetchLotlessItems()
            onComplete?.()
        } catch (err: any) {
            toast.error(<div style={{ fontFamily: 'Kanit' }}>ตัด lot ไม่สำเร็จ: {err.response?.data?.error || err.message}</div>)
        } finally {
            setProcessing(false)
        }
    }

    const handleCutSingle = async (itemcode: string) => {
        setProcessing(true)
        try {
            const res = await axios.post('/api/cut-lot-retroactive', { company, person, itemcode })
            setResult(res.data)
            toast.success(<div style={{ fontFamily: 'Kanit' }}>{res.data.message}</div>)
            fetchLotlessItems()
            onComplete?.()
        } catch (err: any) {
            toast.error(<div style={{ fontFamily: 'Kanit' }}>ตัด lot ไม่สำเร็จ: {err.response?.data?.error || err.message}</div>)
        } finally {
            setProcessing(false)
        }
    }

    if (!show) return null

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#fff', borderRadius: 16, width: '92%', maxWidth: 960,
                maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
            }} onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '18px 24px', borderBottom: '1px solid #e2e8f0',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: '#fff', borderRadius: '16px 16px 0 0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <div style={{ fontFamily: 'Kanit', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Package size={20} /> ตัด Lot ย้อนหลัง สินค้าที่ยังไม่มี Lot
                        </div>
                        <div style={{ fontFamily: 'Kanit', fontSize: 12, opacity: 0.85 }}>
                            {loading ? 'กำลังวิเคราะห์ข้อมูล...' : `${items.length} รายการ / ${fmtQty(totalQty)} หน่วย`}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={fetchLotlessItems} disabled={loading}
                            style={{
                                fontFamily: 'Kanit', fontSize: 12, padding: '6px 14px', borderRadius: 8,
                                border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.15)',
                                color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                            }}>
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> รีเฟรช
                        </button>
                        <button onClick={onClose}
                            style={{
                                width: 32, height: 32, borderRadius: 8, border: 'none',
                                backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40, fontFamily: 'Kanit', color: '#94a3b8' }}>
                            กำลังวิเคราะห์ยอดคงเหลือและวางแผนตัด Lot...
                        </div>
                    ) : items.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, fontFamily: 'Kanit' }}>
                            <CheckCircle size={48} style={{ color: '#3E86C7', marginBottom: 12 }} />
                            <div style={{ fontSize: 16, fontWeight: 600, color: '#2A6AAA' }}>ไม่มีรายการที่ต้องตัด Lot</div>
                            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>สินค้าทุกรายการมี Lot ครบแล้ว</div>
                        </div>
                    ) : (
                        <>
                            {/* Info banner */}
                            <div style={{
                                padding: '10px 14px', borderRadius: 10, marginBottom: 14,
                                backgroundColor: '#fef3c7', border: '1px solid #fde68a',
                                display: 'flex', alignItems: 'flex-start', gap: 8
                            }}>
                                <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
                                <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#92400e' }}>
                                    ระบบจะตัดจาก Lot ที่ใกล้หมดอายุก่อน (FEFO) โดยใช้ "ยอดตามคำนวณ" ของแต่ละ Lot เป็นตัวตั้ง
                                    แล้วปรับยอดคงเหลือ + ตัวนับขายของ Lot ให้ตรงกัน — กดที่แถวสินค้าเพื่อดูรายละเอียดก่อนยืนยัน
                                    (ค่าเดิมถูกสำรองไว้ในฐานข้อมูลทุกครั้ง)
                                </span>
                            </div>

                            {/* Product list */}
                            {items.map((item, idx) => {
                                const isOpen = expanded.has(item.itemcode)
                                return (
                                    <div key={item.itemcode} style={{
                                        border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 8,
                                        overflow: 'hidden', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa'
                                    }}>
                                        {/* Product row */}
                                        <div onClick={() => toggleExpand(item.itemcode)} style={{
                                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                                            cursor: 'pointer', fontFamily: 'Kanit'
                                        }}>
                                            {isOpen ? <ChevronDown size={16} style={{ color: '#7c3aed', flexShrink: 0 }} />
                                                : <ChevronRight size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />}
                                            <span style={{ fontSize: 12, color: '#1E5088', fontWeight: 500, flexShrink: 0 }}>{item.itemcode}</span>
                                            <span style={{
                                                fontSize: 12, color: '#334155', flex: 1,
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                            }}>{item.itemName || '-'}</span>
                                            {item.saleFallbackWarning && (
                                                <span title="สินค้านี้ยังอิงยอดขายจากบิลเก่า (ไม่มี transaction ผูก lot) — ตรวจรายละเอียดก่อนตัด"
                                                    style={{
                                                        fontSize: 10, color: '#b45309', backgroundColor: '#fef3c7',
                                                        padding: '2px 8px', borderRadius: 8, flexShrink: 0
                                                    }}>⚠ ตรวจก่อน</span>
                                            )}
                                            <span style={{ fontSize: 11, color: '#64748b', flexShrink: 0 }}>{item.txCount} บิล</span>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', flexShrink: 0, width: 70, textAlign: 'right' }}>
                                                {fmtQty(item.totalUnassignedQty)} หน่วย
                                            </span>
                                            {item.remaining > 0 && (
                                                <span style={{
                                                    fontSize: 10, color: '#dc2626', backgroundColor: '#fee2e2',
                                                    padding: '2px 8px', borderRadius: 8, flexShrink: 0
                                                }}>lot พอแค่ {fmtQty(item.assignable)}</span>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleCutSingle(item.itemcode) }}
                                                disabled={processing || item.assignable <= 0}
                                                style={{
                                                    fontFamily: 'Kanit', fontSize: 11, padding: '5px 12px', borderRadius: 6,
                                                    border: 'none', flexShrink: 0,
                                                    background: item.assignable <= 0 ? '#e2e8f0' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                                    color: item.assignable <= 0 ? '#94a3b8' : '#fff',
                                                    cursor: processing || item.assignable <= 0 ? 'not-allowed' : 'pointer',
                                                    opacity: processing ? 0.6 : 1
                                                }}>
                                                ตัด Lot
                                            </button>
                                        </div>

                                        {/* Lot detail (expanded) */}
                                        {isOpen && (
                                            <div style={{ padding: '0 14px 12px 40px' }}>
                                                {item.lots.length === 0 ? (
                                                    <div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#dc2626', padding: '6px 0' }}>
                                                        ไม่มี Lot ที่มียอดตามคำนวณเหลือให้ตัด — รายการขายจะคงเป็นแบบไม่มี Lot ต่อไป
                                                    </div>
                                                ) : (
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Kanit' }}>
                                                        <thead>
                                                            <tr style={{ backgroundColor: '#f5f3ff' }}>
                                                                <th style={{ padding: '6px 8px', fontSize: 11, color: '#5b21b6', fontWeight: 600, textAlign: 'left' }}>Lot</th>
                                                                <th style={{ padding: '6px 8px', fontSize: 11, color: '#5b21b6', fontWeight: 600, textAlign: 'center' }}>หมดอายุ</th>
                                                                <th style={{ padding: '6px 8px', fontSize: 11, color: '#5b21b6', fontWeight: 600, textAlign: 'center' }}>คงเหลือที่บันทึก</th>
                                                                <th style={{ padding: '6px 8px', fontSize: 11, color: '#5b21b6', fontWeight: 600, textAlign: 'center' }}>ตามคำนวณ</th>
                                                                <th style={{ padding: '6px 8px', fontSize: 11, color: '#5b21b6', fontWeight: 600, textAlign: 'center' }}>จะตัด</th>
                                                                <th style={{ padding: '6px 8px', fontSize: 11, color: '#5b21b6', fontWeight: 600, textAlign: 'center' }}>คงเหลือใหม่</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {item.lots.map(lc => (
                                                                <tr key={lc.lotId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                    <td style={{ padding: '6px 8px', fontSize: 12, fontWeight: 500, color: '#0f172a' }}>{lc.lot || '-'}</td>
                                                                    <td style={{ padding: '6px 8px', fontSize: 11, color: '#64748b', textAlign: 'center' }}>{fmtDate(lc.dateExp)}</td>
                                                                    <td style={{
                                                                        padding: '6px 8px', fontSize: 12, textAlign: 'center',
                                                                        color: Math.abs(lc.storedBalance - lc.calcBalance) > 0.001 ? '#dc2626' : '#334155',
                                                                        fontWeight: Math.abs(lc.storedBalance - lc.calcBalance) > 0.001 ? 600 : 400
                                                                    }}>{fmtQty(lc.storedBalance)}</td>
                                                                    <td style={{ padding: '6px 8px', fontSize: 12, color: '#334155', textAlign: 'center' }}>{fmtQty(lc.calcBalance)}</td>
                                                                    <td style={{ padding: '6px 8px', fontSize: 12, color: '#dc2626', fontWeight: 600, textAlign: 'center' }}>-{fmtQty(lc.allocated)}</td>
                                                                    <td style={{ padding: '6px 8px', fontSize: 12, color: '#2A6AAA', fontWeight: 700, textAlign: 'center' }}>{fmtQty(lc.newBalance)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                                {item.remaining > 0 && item.lots.length > 0 && (
                                                    <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#dc2626', marginTop: 6 }}>
                                                        ⚠ Lot มีไม่พอ {fmtQty(item.remaining)} หน่วยจะคงเป็นรายการไม่มี Lot ต่อไป
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </>
                    )}

                    {/* Result Section */}
                    {result && result.details && result.details.length > 0 && (
                        <div style={{ marginTop: 16, padding: 14, borderRadius: 10, backgroundColor: '#F3F8FC', border: '1px solid #CCDFF1' }}>
                            <div style={{ fontFamily: 'Kanit', fontSize: 14, fontWeight: 600, color: '#2A6AAA', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <CheckCircle size={16} /> ผลการตัด Lot
                            </div>
                            {result.details.map((d, i) => (
                                <div key={i} style={{
                                    fontFamily: 'Kanit', fontSize: 12, color: '#334155', padding: '6px 0',
                                    borderBottom: i < result.details.length - 1 ? '1px solid #E5EEF8' : 'none'
                                }}>
                                    <span style={{ fontWeight: 500, color: '#1E5088' }}>{d.itemcode}</span>
                                    {' '}{d.itemName} —{' '}
                                    <span style={{ color: '#147F56', fontWeight: 600 }}>ตัดสำเร็จ {fmtQty(d.assigned)}</span>
                                    {d.remaining > 0 && (
                                        <span style={{ color: '#dc2626', fontWeight: 500 }}> / เหลือ {fmtQty(d.remaining)}</span>
                                    )}
                                    {d.lotsUsed.length > 0 && (
                                        <span style={{ color: '#64748b', fontSize: 11 }}>
                                            {' '}({d.lotsUsed.map(l => `${l.lot || 'N/A'} -${fmtQty(l.allocated)} → เหลือ ${fmtQty(l.newBalance)}`).join(', ')})
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '14px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderRadius: '0 0 16px 16px'
                }}>
                    <div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b' }}>
                        {items.length > 0
                            ? `สินค้า ${items.length} รายการ / รวม ${fmtQty(totalQty)} หน่วยที่ยังไม่มี Lot`
                            : 'ครบถ้วนแล้ว'}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={onClose} style={{
                            fontFamily: 'Kanit', fontSize: 13, padding: '8px 20px', borderRadius: 8,
                            border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#64748b', cursor: 'pointer'
                        }}>
                            ปิด
                        </button>
                        {items.length > 0 && (
                            <button onClick={handleCutAll} disabled={processing} style={{
                                fontFamily: 'Kanit', fontSize: 13, padding: '8px 20px', borderRadius: 8,
                                border: 'none', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                color: '#fff', cursor: processing ? 'not-allowed' : 'pointer',
                                opacity: processing ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6,
                                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)'
                            }}>
                                {processing ? (
                                    <><RefreshCw size={14} className="animate-spin" /> กำลังตัด Lot ย้อนหลัง...</>
                                ) : (
                                    <><Package size={14} /> ตัด Lot ย้อนหลังทั้งหมด</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
