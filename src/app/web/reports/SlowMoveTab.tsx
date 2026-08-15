'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { PackageX, Search, Download, AlertTriangle, Clock, TrendingDown, Filter } from 'lucide-react'
import * as XLSX from 'xlsx'
import { getLocalStorageItem } from '@/utils/localStorage'

interface SlowMoveItem {
    itemcode: string
    itemName: string
    balance: number
    cost: number
    stockValue: number
    oldestLot: string
    oldestLotDate: string
    lastSaleDate: string
    daysIdle: number
}

type FilterType = 'all' | '60' | '90' | '120'

export default function SlowMoveTab() {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<SlowMoveItem[]>([])
    const [filter, setFilter] = useState<FilterType>('all')
    const [search, setSearch] = useState('')

    const fetchData = async () => {
        setLoading(true)
        const company = getLocalStorageItem("company_") || ""
        try {
            const res = await axios.get(`/api/sale_cal/slow_move?company=${company}`)
            setData(res.data || [])
        } catch (e) {
            console.error(e)
            setData([])
        }
        setLoading(false)
    }

    useEffect(() => { fetchData() }, [])

    // Categorize
    const group60 = data.filter(d => d.daysIdle >= 60 && d.daysIdle < 90)
    const group90 = data.filter(d => d.daysIdle >= 90 && d.daysIdle < 120)
    const group120 = data.filter(d => d.daysIdle >= 120)

    // Filter
    const filteredData = (() => {
        let result = data
        if (filter === '60') result = group60
        else if (filter === '90') result = group90
        else if (filter === '120') result = group120

        if (search.trim()) {
            const q = search.trim().toLowerCase()
            result = result.filter(d =>
                d.itemcode.toLowerCase().includes(q) ||
                d.itemName.toLowerCase().includes(q)
            )
        }
        return result
    })()

    const totalValue = (items: SlowMoveItem[]) =>
        items.reduce((sum, d) => sum + d.stockValue, 0)

    const handleExport = () => {
        const exportData = filteredData.map((d, i) => ({
            '#': i + 1,
            'รหัส': d.itemcode,
            'ชื่อสินค้า': d.itemName,
            'คงเหลือ': d.balance,
            'ต้นทุน': d.cost,
            'มูลค่า': d.stockValue,
            'Lot เก่าสุด': d.oldestLot,
            'วันรับเข้า': d.oldestLotDate,
            'ขายล่าสุด': d.lastSaleDate,
            'วันไม่ขาย': d.daysIdle,
        }))
        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Slow Move')
        XLSX.writeFile(wb, `SlowMove_${new Date().toISOString().slice(0, 10)}.xlsx`)
    }

    const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

    const getDaysColor = (days: number) => {
        if (days >= 120) return { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' }
        if (days >= 90) return { bg: '#fff7ed', color: '#ea580c', border: '#fdba74' }
        return { bg: '#fffbeb', color: '#d97706', border: '#fcd34d' }
    }

    return (
        <div style={{
            backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0', overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                color: 'white', padding: '16px 24px', fontFamily: 'Kanit_B', fontSize: '16px',
                display: 'flex', alignItems: 'center', gap: '10px'
            }}>
                <PackageX size={22} /> สินค้า Slow Move
                <span style={{ fontSize: '12px', fontFamily: 'Kanit', opacity: 0.85, marginLeft: '8px' }}>
                    สินค้าที่ไม่มีการขายหรือขายช้า (≥ 60 วัน)
                </span>
            </div>

            {/* Dashboard Cards */}
            <div style={{ padding: '20px 24px 12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {/* 60-89 days */}
                <div
                    onClick={() => setFilter(filter === '60' ? 'all' : '60')}
                    style={{
                        flex: 1, minWidth: '220px', padding: '16px 20px', borderRadius: '12px', cursor: 'pointer',
                        border: filter === '60' ? '2px solid #d97706' : '1px solid #fcd34d',
                        backgroundColor: filter === '60' ? '#fffbeb' : '#fffef5',
                        transition: 'all 0.2s', boxShadow: filter === '60' ? '0 4px 12px rgba(217,119,6,0.15)' : 'none',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Clock size={18} color="#d97706" />
                        <span style={{ fontFamily: 'Kanit_B', fontSize: '14px', color: '#d97706' }}>60 - 89 วัน</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ fontFamily: 'Kanit_B', fontSize: '28px', color: '#92400e', lineHeight: 1 }}>{group60.length}</div>
                            <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#a16207' }}>รายการ</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'Kanit_B', fontSize: '16px', color: '#92400e' }}>{fmt(totalValue(group60))}</div>
                            <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#a16207' }}>บาท</div>
                        </div>
                    </div>
                </div>

                {/* 90-119 days */}
                <div
                    onClick={() => setFilter(filter === '90' ? 'all' : '90')}
                    style={{
                        flex: 1, minWidth: '220px', padding: '16px 20px', borderRadius: '12px', cursor: 'pointer',
                        border: filter === '90' ? '2px solid #ea580c' : '1px solid #fdba74',
                        backgroundColor: filter === '90' ? '#fff7ed' : '#fffbf5',
                        transition: 'all 0.2s', boxShadow: filter === '90' ? '0 4px 12px rgba(234,88,12,0.15)' : 'none',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <AlertTriangle size={18} color="#ea580c" />
                        <span style={{ fontFamily: 'Kanit_B', fontSize: '14px', color: '#ea580c' }}>90 - 119 วัน</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ fontFamily: 'Kanit_B', fontSize: '28px', color: '#9a3412', lineHeight: 1 }}>{group90.length}</div>
                            <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#c2410c' }}>รายการ</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'Kanit_B', fontSize: '16px', color: '#9a3412' }}>{fmt(totalValue(group90))}</div>
                            <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#c2410c' }}>บาท</div>
                        </div>
                    </div>
                </div>

                {/* 120+ days */}
                <div
                    onClick={() => setFilter(filter === '120' ? 'all' : '120')}
                    style={{
                        flex: 1, minWidth: '220px', padding: '16px 20px', borderRadius: '12px', cursor: 'pointer',
                        border: filter === '120' ? '2px solid #dc2626' : '1px solid #fca5a5',
                        backgroundColor: filter === '120' ? '#fef2f2' : '#fff5f5',
                        transition: 'all 0.2s', boxShadow: filter === '120' ? '0 4px 12px rgba(220,38,38,0.15)' : 'none',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <TrendingDown size={18} color="#dc2626" />
                        <span style={{ fontFamily: 'Kanit_B', fontSize: '14px', color: '#dc2626' }}>120+ วัน</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ fontFamily: 'Kanit_B', fontSize: '28px', color: '#991b1b', lineHeight: 1 }}>{group120.length}</div>
                            <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#b91c1c' }}>รายการ</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'Kanit_B', fontSize: '16px', color: '#991b1b' }}>{fmt(totalValue(group120))}</div>
                            <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#b91c1c' }}>บาท</div>
                        </div>
                    </div>
                </div>

                {/* Total summary */}
                <div style={{
                    flex: 1, minWidth: '220px', padding: '16px 20px', borderRadius: '12px',
                    border: '1px solid #e2e8f0', backgroundColor: '#f8fafc',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <PackageX size={18} color="#475569" />
                        <span style={{ fontFamily: 'Kanit_B', fontSize: '14px', color: '#475569' }}>รวมทั้งหมด</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ fontFamily: 'Kanit_B', fontSize: '28px', color: '#1e293b', lineHeight: 1 }}>{data.length}</div>
                            <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#64748b' }}>รายการ</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'Kanit_B', fontSize: '16px', color: '#1e293b' }}>{fmt(totalValue(data))}</div>
                            <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#64748b' }}>บาท</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter bar */}
            <div style={{
                padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '12px',
                borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fafbfc'
            }}>
                <Filter size={16} color="#64748b" />
                <div style={{ display: 'flex', gap: '6px' }}>
                    {([
                        { key: 'all' as FilterType, label: 'ทั้งหมด' },
                        { key: '60' as FilterType, label: '60-89 วัน' },
                        { key: '90' as FilterType, label: '90-119 วัน' },
                        { key: '120' as FilterType, label: '120+ วัน' },
                    ]).map(tab => (
                        <button key={tab.key} onClick={() => setFilter(tab.key)}
                            style={{
                                padding: '5px 14px', borderRadius: '6px', fontFamily: 'Kanit', fontSize: '12px',
                                border: filter === tab.key ? '1px solid #6366f1' : '1px solid #e2e8f0',
                                backgroundColor: filter === tab.key ? '#f0f3ff' : 'white',
                                color: filter === tab.key ? '#4f46e5' : '#64748b',
                                fontWeight: filter === tab.key ? 600 : 400,
                                cursor: 'pointer', transition: 'all 0.15s',
                            }}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div style={{ position: 'relative', marginLeft: 'auto' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="ค้นหารหัส/ชื่อสินค้า..."
                        style={{
                            fontFamily: 'Kanit', fontSize: '12px', padding: '6px 12px 6px 32px',
                            borderRadius: '8px', border: '1px solid #e2e8f0', width: '220px',
                        }}
                    />
                </div>

                <button onClick={handleExport} style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px',
                    border: 'none', background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)', color: 'white',
                    fontFamily: 'Kanit', fontSize: '12px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(62, 134, 199,0.3)',
                }}>
                    <Download size={14} /> Export Excel
                </button>
            </div>

            {/* Table */}
            <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontFamily: 'Kanit' }}>
                        กำลังโหลดข้อมูล...
                    </div>
                ) : filteredData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                        <PackageX size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                        <div style={{ fontFamily: 'Kanit', fontSize: '14px' }}>ไม่พบสินค้า Slow Move</div>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr>
                                {['#', 'รหัส', 'ชื่อสินค้า', 'คงเหลือ', 'ต้นทุน', 'มูลค่า', 'Lot เก่าสุด', 'วันรับเข้า', 'ขายล่าสุด', 'วันไม่ขาย'].map((h, i) => (
                                    <th key={i} style={{
                                        padding: '10px 12px', fontFamily: 'Kanit', fontSize: '11px', color: '#64748b',
                                        fontWeight: 600, borderBottom: '2px solid #e2e8f0',
                                        textAlign: i >= 3 ? 'center' : 'left', whiteSpace: 'nowrap',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item, index) => {
                                const dc = getDaysColor(item.daysIdle)
                                return (
                                    <tr key={item.itemcode} style={{
                                        borderBottom: '1px solid #f1f5f9',
                                        backgroundColor: index % 2 === 0 ? 'white' : '#fafbfc',
                                        transition: 'background-color 0.15s',
                                    }}>
                                        <td style={{ padding: '8px 12px', fontFamily: 'Kanit', fontSize: '12px', color: '#94a3b8' }}>{index + 1}</td>
                                        <td style={{ padding: '8px 12px', fontFamily: 'Kanit', fontSize: '12px', color: '#6366f1', fontWeight: 600 }}>{item.itemcode}</td>
                                        <td style={{ padding: '8px 12px', fontFamily: 'Kanit', fontSize: '12px', color: '#334155', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.itemName}</td>
                                        <td style={{ padding: '8px 12px', fontFamily: 'Kanit_B', fontSize: '12px', color: '#334155', textAlign: 'center' }}>{fmt(item.balance)}</td>
                                        <td style={{ padding: '8px 12px', fontFamily: 'Kanit', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>{fmt(item.cost)}</td>
                                        <td style={{ padding: '8px 12px', fontFamily: 'Kanit_B', fontSize: '12px', color: '#1e293b', textAlign: 'center' }}>{fmt(item.stockValue)}</td>
                                        <td style={{ padding: '8px 12px', fontFamily: 'Kanit', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>{item.oldestLot}</td>
                                        <td style={{ padding: '8px 12px', fontFamily: 'Kanit', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>{item.oldestLotDate}</td>
                                        <td style={{
                                            padding: '8px 12px', fontFamily: 'Kanit', fontSize: '11px', textAlign: 'center',
                                            color: item.lastSaleDate === 'ไม่เคยขาย' ? '#dc2626' : '#64748b',
                                            fontWeight: item.lastSaleDate === 'ไม่เคยขาย' ? 600 : 400,
                                        }}>{item.lastSaleDate}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                            <span style={{
                                                fontFamily: 'Kanit_B', fontSize: '12px', padding: '3px 10px', borderRadius: '10px',
                                                backgroundColor: dc.bg, color: dc.color, border: `1px solid ${dc.border}`,
                                            }}>
                                                {item.daysIdle} วัน
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                            <tr>
                                <td colSpan={3} style={{ padding: '10px 12px', fontFamily: 'Kanit_B', fontSize: '13px', color: '#1e293b' }}>
                                    รวม {filteredData.length} รายการ
                                </td>
                                <td style={{ padding: '10px 12px', fontFamily: 'Kanit_B', fontSize: '12px', color: '#1e293b', textAlign: 'center' }}>
                                    {fmt(filteredData.reduce((s, d) => s + d.balance, 0))}
                                </td>
                                <td></td>
                                <td style={{ padding: '10px 12px', fontFamily: 'Kanit_B', fontSize: '12px', color: '#dc2626', textAlign: 'center' }}>
                                    {fmt(totalValue(filteredData))}
                                </td>
                                <td colSpan={4}></td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>
        </div>
    )
}
