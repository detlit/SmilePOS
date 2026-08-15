'use client'

// Modal "ซ่อมแซม Lot ทุกสินค้า" (เรียกจากหน้าสรุปยอดคงเหลือ)
// สแกนทั้ง company (GET /api/lot-repair/scan) → แยกกลุ่ม:
//   1. พร้อมซ่อมอัตโนมัติ = หลังซ่อมแล้วยอด lot เท่ายอดคำนวณพอดี → กดซ่อมทั้งหมดได้
//   2. ควรตรวจก่อน = หลังซ่อมยังไม่เท่ายอดคำนวณ / อิงยอดขายบิลเก่า / ของไม่พอตัด
//      → ซ่อมได้ทีละรายการหลังเปิดดูรายละเอียด (กันซ่อมพลาดเป็นสต็อกผี)
// การซ่อมจะไล่ประวัติ transaction ใหม่ทั้งเส้น แล้วจัดสรรการตัด lot ของการขาย/โอนออก
// ให้ไม่เกินจำนวนที่รับเข้า/รับโอนของแต่ละ lot จริง ๆ (รายละเอียดใน src/lib/lotLedger.ts)
// การซ่อมจริงยิง POST /api/lot-repair ทีละสินค้า (มี log สำรองใน DB ทุกครั้ง)

import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'

interface RepairLotChange {
    lotId: number
    lot: string | null
    dateExp: string | null
    received: number
    inflow: number
    storedBalance: number
    currentSale: number
    allocated: number
    newBalance: number
    newSale: number
    isNewLot?: boolean
}

interface LotRepairPlan {
    itemcode: string
    itemName: string
    orphanTxCount: number
    orphanQty: number
    orphanAssignable: number
    orphanRemaining: number
    deleteTxCount: number
    deleteQty: number
    createLotCount: number
    createQty: number
    createSaleTxCount: number
    createSaleQty: number
    uncutSaleQty: number
    uncutSaleRemaining: number
    reassignTxCount: number
    reassignQty: number
    unallocatedQty: number
    attachedInflowCount: number
    attachedInflowQty: number
    legacyMode: boolean
    saleFallbackWarning: boolean
    changes: RepairLotChange[]
    lotCount: number
    storedTotal: number
    newTotal: number
    calculatedBalance: number
}

type FixStatus = 'pending' | 'fixing' | 'done' | 'error'

interface RepairItem extends LotRepairPlan {
    status: FixStatus
    resultMsg?: string
}

interface LotRepairAllModalProps {
    show: boolean
    onClose: () => void
    company: string
    onComplete?: () => void
}

const fmtQty = (n: number) => Number(n || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 })
const fmtDate = (d: string | null) => d
    ? new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })
    : '-'

const isAutoFixable = (p: LotRepairPlan) =>
    Math.abs(p.newTotal - p.calculatedBalance) < 0.001 && !p.saleFallbackWarning

export default function LotRepairAllModal({ show, onClose, company, onComplete }: LotRepairAllModalProps) {
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<RepairItem[]>([])
    const [stats, setStats] = useState<any>(null)
    const [error, setError] = useState('')
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const [applying, setApplying] = useState(false)
    const [progress, setProgress] = useState({ done: 0, total: 0 })
    const cancelRef = useRef(false)

    const fetchScan = async () => {
        if (!company) return
        setLoading(true)
        setItems([])
        setStats(null)
        setError('')
        setExpanded(new Set())
        setProgress({ done: 0, total: 0 })
        try {
            const res = await axios.get(`/api/lot-repair/scan?company=${encodeURIComponent(company)}`, { timeout: 300000 })
            const plans: LotRepairPlan[] = res.data.plans || []
            // พร้อมซ่อมอัตโนมัติก่อน แล้วเรียงตามชื่อ
            plans.sort((a, b) => {
                const ra = isAutoFixable(a) ? 0 : 1
                const rb = isAutoFixable(b) ? 0 : 1
                return ra !== rb ? ra - rb : (a.itemName || '').localeCompare(b.itemName || '', 'th')
            })
            setItems(plans.map(p => ({ ...p, status: 'pending' as FixStatus })))
            setStats(res.data.stats)
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'สแกนไม่สำเร็จ')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (show) fetchScan()
        if (!show) cancelRef.current = true
    }, [show, company])

    const toggleExpand = (code: string) => {
        setExpanded(prev => {
            const next = new Set(prev)
            if (next.has(code)) next.delete(code)
            else next.add(code)
            return next
        })
    }

    const setItemState = (itemcode: string, patch: Partial<RepairItem>) => {
        setItems(prev => prev.map(p => p.itemcode === itemcode ? { ...p, ...patch } : p))
    }

    const fixOne = async (itemcode: string): Promise<boolean> => {
        setItemState(itemcode, { status: 'fixing' })
        try {
            const person = localStorage.getItem('person_') || ''
            const res = await axios.post('/api/lot-repair', { company, itemcode, person })
            setItemState(itemcode, { status: 'done', resultMsg: res.data.message })
            return true
        } catch (err: any) {
            setItemState(itemcode, { status: 'error', resultMsg: err.response?.data?.error || err.message })
            return false
        }
    }

    const handleFixSingle = async (itemcode: string) => {
        const ok = await fixOne(itemcode)
        if (ok) {
            toast.success(<div style={{ fontFamily: 'Kanit', fontSize: 14 }}>ซ่อมแซม {itemcode} สำเร็จ</div>, { duration: 2500 })
            onComplete?.()
        }
    }

    const handleFixAll = async () => {
        const targets = items.filter(i => isAutoFixable(i) && i.status !== 'done')
        if (targets.length === 0) return
        setApplying(true)
        cancelRef.current = false
        setProgress({ done: 0, total: targets.length })
        let done = 0
        let success = 0
        for (const it of targets) {
            if (cancelRef.current) break
            const ok = await fixOne(it.itemcode)
            if (ok) success++
            done++
            setProgress({ done, total: targets.length })
        }
        setApplying(false)
        toast.success(<div style={{ fontFamily: 'Kanit', fontSize: 14 }}>ซ่อมแซมสำเร็จ {success} / {done} สินค้า</div>, { duration: 4000 })
        onComplete?.()
    }

    if (!show) return null

    const readyItems = items.filter(i => isAutoFixable(i))
    const reviewItems = items.filter(i => !isAutoFixable(i))
    const remainingReady = readyItems.filter(i => i.status !== 'done').length
    const totalOrphanQty = items.reduce((s, i) => s + (i.orphanAssignable || 0) + (i.reassignQty || 0), 0)
    const totalLotChanges = items.reduce((s, i) => s + (i.changes?.length || 0), 0)

    const statusBadge = (it: RepairItem) => {
        if (it.status === 'fixing') return <span style={{ fontSize: 11, color: '#d97706' }}>⏳ กำลังซ่อม...</span>
        if (it.status === 'done') return <span style={{ fontSize: 11, color: '#2A6AAA', fontWeight: 600 }}>✅ ซ่อมแล้ว</span>
        if (it.status === 'error') return <span style={{ fontSize: 11, color: '#dc2626' }} title={it.resultMsg}>❌ ผิดพลาด</span>
        return null
    }

    const renderRow = (it: RepairItem, idx: number, review: boolean) => {
        const isOpen = expanded.has(it.itemcode)
        const diff = it.calculatedBalance - it.newTotal
        return (
            <div key={it.itemcode} style={{
                border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 6, overflow: 'hidden',
                background: it.status === 'done' ? '#EDF9F3' : idx % 2 === 0 ? '#fff' : '#fafafa'
            }}>
                <div onClick={() => toggleExpand(it.itemcode)} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                    cursor: 'pointer', fontFamily: 'Kanit'
                }}>
                    <span style={{ fontSize: 11, color: isOpen ? '#d97706' : '#94a3b8', flexShrink: 0 }}>{isOpen ? '▼' : '▶'}</span>
                    <span style={{ fontSize: 12, color: '#1E5088', fontWeight: 500, flexShrink: 0, width: 56 }}>{it.itemcode}</span>
                    <span style={{
                        fontSize: 12, color: '#334155', flex: 1, minWidth: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>{it.itemName || '-'}</span>
                    {review && (
                        <span style={{
                            fontSize: 10, color: '#b45309', background: '#fef3c7', padding: '2px 8px',
                            borderRadius: 8, flexShrink: 0
                        }}>
                            {it.saleFallbackWarning ? 'อิงยอดขายบิลเก่า'
                                : it.legacyMode ? 'ยังไม่มีรายการตัดสต๊อก'
                                    : (it.unallocatedQty || 0) > 0 ? `ขาย/โอนออกเกินของที่รับเข้า ${fmtQty(it.unallocatedQty)} หน่วย`
                                        : `หลังซ่อมยังต่างจากยอดคำนวณ ${diff > 0 ? '-' : '+'}${fmtQty(Math.abs(diff))}`}
                        </span>
                    )}
                    <span style={{ fontSize: 12, flexShrink: 0, color: '#64748b' }}>
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>{fmtQty(it.storedTotal)}</span>
                        {' → '}
                        <span style={{ color: '#2A6AAA', fontWeight: 700 }}>{fmtQty(it.newTotal)}</span>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}> /คำนวณ {fmtQty(it.calculatedBalance)}</span>
                    </span>
                    <span style={{ flexShrink: 0, width: 86, textAlign: 'right' }}>
                        {statusBadge(it) || (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleFixSingle(it.itemcode) }}
                                disabled={applying}
                                style={{
                                    fontFamily: 'Kanit', fontSize: 11, padding: '4px 14px', borderRadius: 6, border: 'none',
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff',
                                    cursor: applying ? 'not-allowed' : 'pointer', opacity: applying ? 0.5 : 1
                                }}>ซ่อม</button>
                        )}
                    </span>
                </div>
                {isOpen && (
                    <div style={{ padding: '0 14px 10px 38px', fontFamily: 'Kanit' }}>
                        {(it.orphanTxCount > 0 || (it.createLotCount || 0) > 0 || (it.createSaleTxCount || 0) > 0 || (it.reassignTxCount || 0) > 0) && (
                            <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>
                                {(it.reassignTxCount || 0) > 0 && <span style={{ color: '#b45309' }}>♻️ ตัด lot เกินของที่รับเข้าจริง {it.reassignTxCount} รายการ ({fmtQty(it.reassignQty)} หน่วย) — จัดสรรลง lot ที่มีของใหม่{it.orphanTxCount > 0 ? ' / ' : ''}</span>}
                                {it.orphanTxCount > 0 && <>🔗 ขาย/โอนออก/ปรับยอดไม่ผูก lot {it.orphanTxCount} รายการ ({fmtQty(it.orphanQty)} หน่วย) — ผูกได้ {fmtQty(it.orphanAssignable)}</>}
                                {(it.deleteTxCount || 0) > 0 && <span style={{ color: '#7c3aed' }}> / ลบรายการซ้ำเกินจริง {it.deleteTxCount} รายการ ({fmtQty(it.deleteQty)} หน่วย)</span>}
                                {(it.createLotCount || 0) > 0 && <span style={{ color: '#2A6AAA' }}> {it.orphanTxCount > 0 ? '/ ' : ''}📦 สร้าง lot รับโอนใหม่ {it.createLotCount} lot ({fmtQty(it.createQty)} หน่วย)</span>}
                                {(it.createSaleTxCount || 0) > 0 && <span style={{ color: '#0f766e' }}> {it.orphanTxCount > 0 || (it.createLotCount || 0) > 0 ? '/ ' : ''}🧾 ขายแล้วยังไม่ได้ตัดสต๊อก {fmtQty(it.uncutSaleQty)} หน่วย — ตัดย้อนหลังให้ {fmtQty(it.createSaleQty)}</span>}
                                {it.orphanRemaining > 0 && <span style={{ color: '#dc2626' }}> / lot ไม่พอ {fmtQty(it.orphanRemaining)}</span>}
                            </div>
                        )}
                        {it.changes.length === 0 ? (
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>ไม่มี lot ที่ต้องปรับยอด</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#fffbeb' }}>
                                        {['Lot', 'หมดอายุ', 'รับ/รับโอน', 'ตัดออกรวม', 'คงเหลือเดิม', 'คงเหลือใหม่', 'ตัวนับขาย'].map((h, i) => (
                                            <th key={h} style={{
                                                padding: '5px 8px', fontSize: 10, color: '#92400e', fontWeight: 700,
                                                textAlign: i === 0 ? 'left' : 'center', whiteSpace: 'nowrap'
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {it.changes.map(c => (
                                        <tr key={c.lotId} style={{ borderTop: '1px solid #fef3c7' }}>
                                            <td style={{ padding: '5px 8px', fontSize: 11, fontWeight: 600, color: '#0f172a' }}>
                                                {c.lot || '-'}
                                                {c.isNewLot && <span style={{
                                                    marginLeft: 5, fontSize: 9, fontWeight: 600, color: '#2A6AAA',
                                                    background: '#F3F8FC', padding: '1px 5px', borderRadius: 5
                                                }}>🆕 รับโอน</span>}
                                            </td>
                                            <td style={{ padding: '5px 8px', fontSize: 10, color: '#64748b', textAlign: 'center' }}>{fmtDate(c.dateExp)}</td>
                                            <td style={{ padding: '5px 8px', fontSize: 11, color: '#0f172a', fontWeight: 600, textAlign: 'center' }}
                                                title={c.inflow !== c.received ? `ใบรับสินค้า ${fmtQty(c.received)} + รับโอน/คืน/ปรับเพิ่ม ${fmtQty(c.inflow - c.received)}` : undefined}>
                                                {fmtQty(c.inflow ?? c.received)}
                                            </td>
                                            <td style={{ padding: '5px 8px', fontSize: 11, color: c.allocated > 0 ? '#dc2626' : '#94a3b8', textAlign: 'center' }}>
                                                {c.allocated > 0 ? `-${fmtQty(c.allocated)}` : '-'}
                                            </td>
                                            <td style={{ padding: '5px 8px', fontSize: 11, color: '#94a3b8', textAlign: 'center', textDecoration: 'line-through' }}>{fmtQty(c.storedBalance)}</td>
                                            <td style={{ padding: '5px 8px', fontSize: 12, color: '#2A6AAA', fontWeight: 700, textAlign: 'center' }}>{fmtQty(c.newBalance)}</td>
                                            <td style={{ padding: '5px 8px', fontSize: 10, color: '#64748b', textAlign: 'center' }}>
                                                {fmtQty(c.currentSale)} → <strong style={{ color: '#0f172a' }}>{fmtQty(c.newSale)}</strong>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {it.resultMsg && (
                            <div style={{ fontSize: 11, color: it.status === 'error' ? '#dc2626' : '#147F56', marginTop: 6 }}>{it.resultMsg}</div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={(e) => { if (e.target === e.currentTarget && !applying) onClose() }}>
            <div style={{
                background: '#fff', borderRadius: 16, width: 900, maxWidth: '96vw',
                maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '18px 24px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <div style={{ fontFamily: 'Kanit', fontSize: 18, fontWeight: 700 }}>🛠️ ซ่อมแซม Lot ทุกสินค้า</div>
                        <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#fef3c7', marginTop: 2 }}>
                            {loading ? 'กำลังสแกน...' : stats
                                ? `ตรวจแล้ว ${stats.lotItemcodeCount} สินค้า · พบที่ต้องซ่อม ${items.length} สินค้า`
                                : 'ตรวจสอบ transaction ทุกสินค้าแล้วปรับยอด lot ให้ตรงยอดคำนวณ'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button onClick={fetchScan} disabled={loading || applying} style={{
                            fontFamily: 'Kanit', fontSize: 12, padding: '6px 14px', borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)',
                            color: '#fff', cursor: 'pointer'
                        }}>🔄 สแกนใหม่</button>
                        <button onClick={onClose} disabled={applying} style={{
                            width: 32, height: 32, borderRadius: 8, border: 'none',
                            background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', fontSize: 16
                        }}>✕</button>
                    </div>
                </div>

                {/* Progress bar ระหว่างซ่อมทั้งหมด */}
                {applying && (
                    <div style={{ padding: '10px 24px', background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Kanit', fontSize: 12, color: '#92400e', marginBottom: 6 }}>
                            <span>⏳ กำลังซ่อมแซม... {progress.done}/{progress.total}</span>
                            <button onClick={() => { cancelRef.current = true }} style={{
                                fontFamily: 'Kanit', fontSize: 11, padding: '2px 12px', borderRadius: 6,
                                border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', cursor: 'pointer'
                            }}>หยุด</button>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: '#fde68a', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#f59e0b,#d97706)',
                                width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`, transition: 'width 0.3s'
                            }} />
                        </div>
                    </div>
                )}

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', fontFamily: 'Kanit' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 14 }}>
                            🔍 กำลังตรวจสอบ transaction ทุกสินค้า...
                            <div style={{ fontSize: 11, marginTop: 6, color: '#cbd5e1' }}>อาจใช้เวลาหลายวินาทีตามจำนวนสินค้า</div>
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#dc2626', fontSize: 13 }}>{error}</div>
                    ) : items.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 50 }}>
                            <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#2A6AAA' }}>ยอด Lot ทุกสินค้าถูกต้องแล้ว</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>ไม่พบสินค้าที่ยอด lot ไม่ตรงกับยอดคำนวณ</div>
                        </div>
                    ) : (
                        <>
                            {/* สรุปรวม */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                                {[
                                    { label: 'สินค้าที่ต้องซ่อม', value: items.length, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                                    { label: 'พร้อมซ่อมอัตโนมัติ', value: readyItems.length, color: '#2A6AAA', bg: '#F3F8FC', border: '#CCDFF1' },
                                    { label: 'ควรตรวจก่อน', value: reviewItems.length, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                                    { label: 'ที่จะจัดสรร lot ใหม่', value: `${fmtQty(totalOrphanQty)} หน่วย`, color: '#2A6AAA', bg: '#F3F8FC', border: '#CCDFF1' },
                                ].map((c, i) => (
                                    <div key={i} style={{
                                        textAlign: 'center', padding: '10px 6px', borderRadius: 10,
                                        background: c.bg, border: `1px solid ${c.border}`
                                    }}>
                                        <div style={{ fontSize: 10, color: c.color, fontWeight: 600 }}>{c.label}</div>
                                        <div style={{ fontSize: 20, fontWeight: 800, color: c.color }}>{c.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* กลุ่ม 1: พร้อมซ่อมอัตโนมัติ */}
                            {readyItems.length > 0 && (
                                <>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        marginBottom: 8
                                    }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#173F6B' }}>
                                            ✅ พร้อมซ่อมอัตโนมัติ ({readyItems.length}) — หลังซ่อมยอด lot เท่ายอดคำนวณพอดี
                                        </div>
                                        {remainingReady > 0 && (
                                            <button onClick={handleFixAll} disabled={applying} style={{
                                                fontFamily: 'Kanit', fontSize: 12, fontWeight: 600, padding: '6px 18px',
                                                borderRadius: 8, border: 'none',
                                                background: 'linear-gradient(135deg, #2A6AAA 0%, #1E5088 100%)', color: '#fff',
                                                cursor: applying ? 'not-allowed' : 'pointer', opacity: applying ? 0.6 : 1,
                                                boxShadow: '0 2px 8px rgba(42, 106, 170,0.3)'
                                            }}>
                                                🔧 ซ่อมทั้งหมด ({remainingReady})
                                            </button>
                                        )}
                                    </div>
                                    {readyItems.map((it, idx) => renderRow(it, idx, false))}
                                </>
                            )}

                            {/* กลุ่ม 2: ควรตรวจก่อน */}
                            {reviewItems.length > 0 && (
                                <>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#b45309', margin: '16px 0 4px' }}>
                                        ⚠️ ควรตรวจก่อนซ่อม ({reviewItems.length})
                                    </div>
                                    <div style={{ fontSize: 11, color: '#92400e', marginBottom: 8 }}>
                                        กลุ่มนี้ซ่อมแล้วยอดยังไม่เท่ายอดคำนวณ (เช่น ขาย/โอนออกเกินของที่เคยรับเข้าจริง หรืออิงยอดขายบิลเก่า) —
                                        เปิดดูรายละเอียดและตรวจสต็อกจริงก่อนกดซ่อมทีละรายการ ไม่ถูกรวมใน "ซ่อมทั้งหมด"
                                    </div>
                                    {reviewItems.map((it, idx) => renderRow(it, idx, true))}
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Kanit'
                }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        💾 ค่าเดิมทุกรายการถูกสำรองไว้ในฐานข้อมูลก่อนแก้เสมอ ตรวจย้อนหลังได้
                    </div>
                    <button onClick={onClose} disabled={applying} style={{
                        fontFamily: 'Kanit', fontSize: 13, padding: '8px 22px', borderRadius: 8,
                        border: '1px solid #e2e8f0', background: '#fff', color: '#64748b',
                        cursor: applying ? 'not-allowed' : 'pointer'
                    }}>ปิด</button>
                </div>
            </div>
        </div>
    )
}
