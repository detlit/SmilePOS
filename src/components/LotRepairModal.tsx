'use client'

// Modal ซ่อมแซมยอด Lot ของสินค้าหนึ่งรายการ (เรียกจากหน้าสรุปยอดคงเหลือ)
// ขั้นตอน: ตรวจสอบ (GET /api/lot-repair) → แสดงแผนให้ตรวจก่อน → ยืนยัน (POST) → แสดงผล
// การซ่อม: ไล่ประวัติ transaction ใหม่ทั้งเส้น แล้วจัดสรรการตัด lot ของการขาย/โอนออก
// ให้ไม่เกินจำนวนที่รับเข้า/รับโอนของแต่ละ lot จริง ๆ + ปรับคงเหลือทุก lot ให้ตรงยอดคำนวณ

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'

interface RepairLotChange {
    lotId: number
    lot: string | null
    dateExp: string | null
    received: number
    /** ของเข้าทั้งหมด = รับเข้า + รับโอน + คืน + ปรับเพิ่ม */
    inflow: number
    storedBalance: number
    currentSale: number
    allocated: number
    calcBalance: number
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

interface LotRepairModalProps {
    show: boolean
    onClose: () => void
    company: string
    itemcode: string
    productId?: string | number | null
    productName?: string
    onComplete?: () => void
}

const fmtQty = (n: number) => Number(n || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 })
const fmtDate = (d: string | null) => d
    ? new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-'

export default function LotRepairModal({ show, onClose, company, itemcode, productId, productName, onComplete }: LotRepairModalProps) {
    const [loading, setLoading] = useState(false)
    const [applying, setApplying] = useState(false)
    const [plan, setPlan] = useState<LotRepairPlan | null>(null)
    const [done, setDone] = useState(false)
    const [error, setError] = useState('')

    const fetchPlan = async () => {
        setLoading(true)
        setPlan(null)
        setDone(false)
        setError('')
        try {
            const idParam = productId != null && productId !== '' ? `&id=${encodeURIComponent(String(productId))}` : ''
            const res = await axios.get(`/api/lot-repair?company=${encodeURIComponent(company)}&itemcode=${encodeURIComponent(itemcode)}${idParam}`)
            setPlan(res.data.plan)
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'ตรวจสอบไม่สำเร็จ')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (show && itemcode) fetchPlan()
    }, [show, itemcode, company, productId])

    const handleApply = async () => {
        if (!plan) return
        setApplying(true)
        setError('')
        try {
            const person = localStorage.getItem('person_') || ''
            const res = await axios.post('/api/lot-repair', {
                company, itemcode, id: productId ?? null, person
            })
            setPlan(res.data.plan)
            setDone(true)
            toast.success(<div style={{ fontFamily: 'Kanit', fontSize: 15 }}>ซ่อมแซมยอด Lot สำเร็จ</div>, {
                description: <div style={{ fontFamily: 'Kanit', fontSize: 13 }}>{res.data.message}</div>,
                duration: 3500,
            })
            onComplete?.()
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'ซ่อมแซมไม่สำเร็จ')
        } finally {
            setApplying(false)
        }
    }

    if (!show) return null

    // มีงานให้ซ่อมเมื่อ: ต้องปรับยอด lot / มีรายการที่ต้องจัดสรร lot ใหม่ / มีบิลกำพร้าให้ผูก /
    // มีรายการขายซ้ำให้ลบ / มี lot รับโอนให้สร้าง / มีบิลที่ขายแล้วยังไม่ได้ตัดสต๊อก
    const hasChanges = !!plan && (
        plan.changes.length > 0 || plan.orphanAssignable > 0 ||
        (plan.reassignTxCount || 0) > 0 ||
        (plan.deleteTxCount || 0) > 0 || (plan.createLotCount || 0) > 0 ||
        (plan.createSaleTxCount || 0) > 0
    )
    const totalsMatch = plan ? Math.abs(plan.newTotal - plan.calculatedBalance) < 0.001 : false

    const thStyle: React.CSSProperties = {
        padding: '8px 10px', fontSize: 11, color: '#92400e', fontWeight: 700, whiteSpace: 'nowrap'
    }
    const tdStyle: React.CSSProperties = { padding: '8px 10px', fontSize: 12, color: '#334155' }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={(e) => { if (e.target === e.currentTarget && !applying) onClose() }}>
            <div style={{
                background: '#fff', borderRadius: 16, width: 720, maxWidth: '95vw',
                maxHeight: '88vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '18px 24px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <div style={{ fontFamily: 'Kanit', fontSize: 18, fontWeight: 700 }}>🔧 ซ่อมแซมยอด Lot</div>
                        <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#fef3c7', marginTop: 2 }}>
                            {productName || plan?.itemName || '-'} ({itemcode})
                        </div>
                    </div>
                    <button onClick={onClose} disabled={applying} style={{
                        background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                        width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16
                    }}>✕</button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px', fontFamily: 'Kanit' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 50, color: '#94a3b8', fontSize: 14 }}>
                            🔍 กำลังตรวจสอบ transaction และคำนวณยอด Lot...
                        </div>
                    ) : error && !plan ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#dc2626', fontSize: 13 }}>{error}</div>
                    ) : plan && (
                        <>
                            {/* สรุปยอด ก่อน → หลัง */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                                <div style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: '#fafafa', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>ยอด Lot ที่บันทึก</div>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: totalsMatch && !hasChanges ? '#147F56' : '#dc2626' }}>{fmtQty(plan.storedTotal)}</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a' }}>
                                    <div style={{ fontSize: 10, color: '#92400e', fontWeight: 600, textTransform: 'uppercase' }}>หลังซ่อม</div>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706' }}>{fmtQty(plan.newTotal)}</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: '#F3F8FC', border: '1px solid #CCDFF1' }}>
                                    <div style={{ fontSize: 10, color: '#173F6B', fontWeight: 600, textTransform: 'uppercase' }}>ยอดคำนวณ (เป้าหมาย)</div>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#2A6AAA' }}>
                                        {fmtQty(plan.calculatedBalance)} {totalsMatch ? '✓' : ''}
                                    </div>
                                </div>
                            </div>

                            {done ? (
                                <div style={{
                                    padding: '14px 16px', borderRadius: 12, background: '#F3F8FC',
                                    border: '1px solid #CCDFF1', marginBottom: 14, textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#147F56' }}>✅ ซ่อมแซมเรียบร้อยแล้ว</div>
                                    <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                                        {[
                                            plan.changes.length > 0 ? `ปรับยอด ${plan.changes.length} lot` : '',
                                            (plan.reassignTxCount || 0) > 0 ? `จัดสรรการตัด lot ใหม่ ${plan.reassignTxCount} รายการ (${fmtQty(plan.reassignQty)} หน่วย)` : '',
                                            plan.orphanAssignable > 0 ? `ผูกบิลขายย้อนหลัง ${fmtQty(plan.orphanAssignable)} หน่วย` : '',
                                            (plan.deleteTxCount || 0) > 0 ? `ลบรายการขายซ้ำ ${plan.deleteTxCount} รายการ` : '',
                                            (plan.createLotCount || 0) > 0 ? `สร้าง lot รับโอน ${plan.createLotCount} lot` : '',
                                            (plan.createSaleTxCount || 0) > 0 ? `ตัดสต๊อกย้อนหลังให้บิลที่ยังไม่ได้ตัด ${fmtQty(plan.createSaleQty)} หน่วย` : '',
                                        ].filter(Boolean).join(' · ')}
                                        {' '}— ค่าเดิมถูกสำรองไว้ในฐานข้อมูลแล้ว
                                    </div>
                                </div>
                            ) : !hasChanges ? (
                                <div style={{ textAlign: 'center', padding: '28px 0 20px' }}>
                                    <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#2A6AAA' }}>ข้อมูล Lot ถูกต้องแล้ว</div>
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                                        ยอดคงเหลือทุก lot ตรงกับยอดคำนวณ ไม่มีอะไรต้องซ่อม
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* สิ่งที่ตรวจพบ */}
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>สิ่งที่ตรวจพบ</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                                        {(plan.reassignTxCount || 0) > 0 && (
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#475569' }}>
                                                <span>♻️</span>
                                                <span>รายการขาย/โอนออกที่<strong>ตัด lot เกินจำนวนที่รับเข้าจริง {plan.reassignTxCount} รายการ ({fmtQty(plan.reassignQty)} หน่วย)</strong>
                                                    {' '}— จะจัดสรรใหม่ไปตัด lot ที่มีของอยู่จริง ณ เวลานั้น (จำนวนรวมของแต่ละรายการเท่าเดิม ไม่มีของหาย)</span>
                                            </div>
                                        )}
                                        {plan.orphanTxCount > 0 && (
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#475569' }}>
                                                <span>🔗</span>
                                                <span>รายการขาย/โอนออก/ปรับยอดที่ไม่ได้ผูก lot <strong>{plan.orphanTxCount} รายการ ({fmtQty(plan.orphanQty)} หน่วย)</strong>
                                                    {plan.orphanAssignable > 0 && <> — จะผูกเข้า lot ที่ใกล้หมดอายุก่อน (FEFO) {fmtQty(plan.orphanAssignable)} หน่วย</>}
                                                    {plan.orphanRemaining > 0 && <span style={{ color: '#dc2626' }}> (lot ไม่พอ {fmtQty(plan.orphanRemaining)} หน่วย)</span>}
                                                </span>
                                            </div>
                                        )}
                                        {(plan.deleteTxCount || 0) > 0 && (
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#475569' }}>
                                                <span>🧹</span>
                                                <span>รายการขายใน stock ที่<strong>ซ้ำเกินยอดขายจริง {plan.deleteTxCount} รายการ ({fmtQty(plan.deleteQty)} หน่วย)</strong>
                                                    {' '}— สินค้าถูกตัดโดยรายการที่ถูกต้องไปแล้ว จะลบรายการซ้ำออก (สำรองก่อนลบ)</span>
                                            </div>
                                        )}
                                        {(plan.createLotCount || 0) > 0 && (
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#475569' }}>
                                                <span>📦</span>
                                                <span>รับโอนเข้าที่<strong>ไม่มี lot รองรับ {fmtQty(plan.createQty)} หน่วย</strong>
                                                    {' '}— จะสร้าง lot รับโอนใหม่ {plan.createLotCount} lot แล้วผูกรายการรับโอนเข้าให้</span>
                                            </div>
                                        )}
                                        {(plan.createSaleTxCount || 0) > 0 && (
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#475569' }}>
                                                <span>🧾</span>
                                                <span>บิลที่<strong>ขายแล้วแต่ยังไม่ได้ตัดสต๊อก {fmtQty(plan.uncutSaleQty)} หน่วย</strong>
                                                    {' '}— จะสร้างรายการตัดสต๊อกย้อนหลังผูก lot แบบ FEFO ให้ {fmtQty(plan.createSaleQty)} หน่วย
                                                    {(plan.uncutSaleRemaining || 0) > 0 && <span style={{ color: '#dc2626' }}> (ตัดให้ไม่ได้ {fmtQty(plan.uncutSaleRemaining)} หน่วย)</span>}
                                                </span>
                                            </div>
                                        )}
                                        {plan.changes.length > 0 && (
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#475569' }}>
                                                <span>📊</span>
                                                <span>lot ที่ยอดคงเหลือ/ตัวนับขายไม่ตรงกับยอดคำนวณ <strong>{plan.changes.length} จาก {plan.lotCount} lot</strong> — จะปรับให้ตรงตามตารางด้านล่าง</span>
                                            </div>
                                        )}
                                        {(plan.attachedInflowCount || 0) > 0 && (
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#475569' }}>
                                                <span>↩️</span>
                                                <span>รายการคืน/ปรับยอดเพิ่มที่<strong>ไม่ระบุ lot {plan.attachedInflowCount} รายการ ({fmtQty(plan.attachedInflowQty)} หน่วย)</strong>
                                                    {' '}— จะฝากเข้า lot ที่รับเข้าล่าสุด เพื่อให้ยอดรวมของ lot ตรงกับยอดคำนวณ</span>
                                            </div>
                                        )}
                                        {(plan.unallocatedQty || 0) > 0 && (
                                            <div style={{
                                                display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12,
                                                color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca',
                                                borderRadius: 8, padding: '8px 10px'
                                            }}>
                                                <span>⚠️</span>
                                                <span>มีการขาย/โอนออก <strong>{fmtQty(plan.unallocatedQty)} หน่วย</strong> ที่มากกว่าของที่เคยรับเข้าจริง —
                                                    ส่วนนี้ไม่มี lot ไหนรองรับ จะคงไว้เป็นรายการไม่มี lot (ควรตรวจใบรับสินค้าย้อนหลัง)</span>
                                            </div>
                                        )}
                                        {plan.legacyMode && (
                                            <div style={{
                                                display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12,
                                                color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a',
                                                borderRadius: 8, padding: '8px 10px'
                                            }}>
                                                <span>🕰️</span>
                                                <span>สินค้านี้ยังไม่มีรายการตัดสต๊อกเลย (ยอดขายผูก lot อยู่ในตัวบิล) —
                                                    การขายจึงย้าย lot ไม่ได้ ระบบจะปรับได้เฉพาะยอดคงเหลือของ lot</span>
                                            </div>
                                        )}
                                        {plan.saleFallbackWarning && (
                                            <div style={{
                                                display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12,
                                                color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a',
                                                borderRadius: 8, padding: '8px 10px'
                                            }}>
                                                <span>⚠️</span>
                                                <span>สินค้านี้ยังมียอดขายที่อิงจากบิลเก่า (ไม่มี transaction ผูก lot) — โปรดตรวจตัวเลขในตารางให้แน่ใจก่อนยืนยัน</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* ตารางการเปลี่ยนแปลง (เฉพาะเมื่อมี lot ต้องปรับยอด) */}
                                    {plan.changes.length > 0 && (<>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>การเปลี่ยนแปลง</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
                                        ยึดหลัก <strong style={{ color: '#64748b' }}>รับเข้า/รับโอน − ตัดออก = คงเหลือ</strong> ของทุก lot
                                    </div>
                                    <div style={{ border: '1px solid #fde68a', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Kanit' }}>
                                            <thead>
                                                <tr style={{ background: '#fffbeb' }}>
                                                    <th style={{ ...thStyle, textAlign: 'left' }}>Lot</th>
                                                    <th style={{ ...thStyle, textAlign: 'center' }}>หมดอายุ</th>
                                                    <th style={{ ...thStyle, textAlign: 'center' }}>รับเข้า/รับโอน</th>
                                                    <th style={{ ...thStyle, textAlign: 'center' }}>ตัดออกรวม</th>
                                                    <th style={{ ...thStyle, textAlign: 'center' }}>คงเหลือเดิม</th>
                                                    <th style={{ ...thStyle, textAlign: 'center' }}>คงเหลือใหม่</th>
                                                    <th style={{ ...thStyle, textAlign: 'center' }}>ตัวนับขาย</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {plan.changes.map((c, i) => (
                                                    <tr key={c.lotId} style={{ borderTop: '1px solid #fef3c7', background: i % 2 === 0 ? '#fff' : '#fffdf5' }}>
                                                        <td style={{ ...tdStyle, fontWeight: 600, color: '#0f172a' }}>
                                                            {c.lot || '-'}
                                                            {c.isNewLot && <span style={{
                                                                marginLeft: 6, fontSize: 9, fontWeight: 600, color: '#2A6AAA',
                                                                background: '#F3F8FC', padding: '1px 6px', borderRadius: 6
                                                            }}>🆕 สร้างใหม่ (รับโอน)</span>}
                                                        </td>
                                                        <td style={{ ...tdStyle, textAlign: 'center', color: '#64748b', fontSize: 11 }}>{fmtDate(c.dateExp)}</td>
                                                        <td style={{ ...tdStyle, textAlign: 'center', color: '#0f172a', fontWeight: 600 }}
                                                            title={c.inflow !== c.received ? `ใบรับสินค้า ${fmtQty(c.received)} + รับโอน/คืน/ปรับเพิ่ม ${fmtQty(c.inflow - c.received)}` : undefined}>
                                                            {fmtQty(c.inflow ?? c.received)}
                                                        </td>
                                                        <td style={{ ...tdStyle, textAlign: 'center', color: c.allocated > 0 ? '#dc2626' : '#94a3b8' }}>
                                                            {c.allocated > 0 ? `-${fmtQty(c.allocated)}` : '-'}
                                                        </td>
                                                        <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', textDecoration: 'line-through' }}>{fmtQty(c.storedBalance)}</td>
                                                        <td style={{ ...tdStyle, textAlign: 'center', color: '#2A6AAA', fontWeight: 700, fontSize: 13 }}>
                                                            {fmtQty(c.newBalance)}
                                                        </td>
                                                        <td style={{ ...tdStyle, textAlign: 'center', fontSize: 11, color: '#64748b' }}>
                                                            {fmtQty(c.currentSale)} → <strong style={{ color: '#0f172a' }}>{fmtQty(c.newSale)}</strong>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    </>)}
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                                        💾 ค่าเดิมทุกรายการจะถูกสำรองไว้ในฐานข้อมูลก่อนแก้ สามารถตรวจย้อนหลังได้เสมอ
                                    </div>
                                </>
                            )}

                            {error && (
                                <div style={{
                                    marginTop: 10, padding: '8px 12px', borderRadius: 8, fontSize: 12,
                                    background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626'
                                }}>{error}</div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '14px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc',
                    display: 'flex', justifyContent: 'flex-end', gap: 8
                }}>
                    <button onClick={onClose} disabled={applying} style={{
                        fontFamily: 'Kanit', fontSize: 13, padding: '8px 20px', borderRadius: 8,
                        border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer'
                    }}>
                        {done || !hasChanges ? 'ปิด' : 'ยกเลิก'}
                    </button>
                    {!done && hasChanges && !loading && (
                        <button onClick={handleApply} disabled={applying} style={{
                            fontFamily: 'Kanit', fontSize: 13, fontWeight: 600, padding: '8px 24px', borderRadius: 8,
                            border: 'none', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: '#fff', cursor: applying ? 'not-allowed' : 'pointer', opacity: applying ? 0.6 : 1,
                            boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)'
                        }}>
                            {applying ? '⏳ กำลังซ่อมแซม...' : '🔧 ยืนยันซ่อมแซม'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
