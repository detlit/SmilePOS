'use client'

import React, { useEffect, useState } from "react"
import axios from "axios"
import { toThaiDateString } from '@/utils/dateUtils'
import MenuTab_Small from "../componant/menutab_small.tsx"
import HeadTab from "../componant/headtab.jsx"

interface StockTransaction {
    id: number
    product_id: number
    inventory_lot_id: number
    quantity_change: number
    transaction_type: string
    createDate: string
    company: string
    person: string
    lotDetails: {
        id: number
        itemcode: string
        itemName: string
        lot: string
        dateExp: string
        balance: number
        unit: string
    } | null
}

function StockTransactionPage() {
    const [transactions, setTransactions] = useState<StockTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [searchItemcode, setSearchItemcode] = useState('')

    // Set default date range (last 7 days)
    useEffect(() => {
        const today = new Date()
        const lastWeek = new Date(today)
        lastWeek.setDate(lastWeek.getDate() - 7)

        setEndDate(toThaiDateString(today))
        setStartDate(toThaiDateString(lastWeek))
    }, [])

    const fetchTransactions = async () => {
        const company = localStorage.getItem("company_") || ""
        setLoading(true)

        try {
            const params = new URLSearchParams()
            if (company) params.append('company', company)
            if (startDate) params.append('startDate', startDate)
            if (endDate) params.append('endDate', endDate)
            if (searchItemcode) params.append('itemcode', searchItemcode)
            params.append('limit', '500')

            const res = await axios.get(`/api/stocktransaction?${params.toString()}`)

            if (res.data.success) {
                setTransactions(res.data.data)
            }
        } catch (error) {
            console.error('Error fetching transactions:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (startDate && endDate) {
            fetchTransactions()
        }
    }, [startDate, endDate])

    const handleSearch = () => {
        fetchTransactions()
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return '-'
        const date = new Date(dateString)
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatExpDate = (dateString: string) => {
        if (!dateString) return '-'
        const date = new Date(dateString)
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    }

    const getTransactionTypeLabel = (type: string) => {
        switch (type?.toUpperCase()) {
            case 'SALE':
                return '🛒 ขาย'
            case 'IN':
                return '📥 รับเข้า'
            case 'ADJUST':
                return '🔧 ปรับปรุง'
            default:
                return type || '-'
        }
    }

    return (
        <div style={{ paddingLeft: 15, paddingRight: 15, backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: 20 }}>
            <div className="row justify-content-start"><HeadTab /></div>
            <div className="row justify-content-start">
                <div className="col-sm-1"><MenuTab_Small /></div>
                <div className="col-sm-11">
                    <div className="row g-3">
                        {/* Main Content Panel */}
                        <div className="col-12">
                            <div style={{
                                backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                border: '1px solid #e2e8f0', overflow: 'hidden', minHeight: '88vh', display: 'flex', flexDirection: 'column'
                            }}>
                                {/* Header */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)',
                                    color: 'white', padding: '16px 20px', fontFamily: 'Kanit_B', fontSize: '14px',
                                    display: 'flex', alignItems: 'center', gap: '10px'
                                }}>
                                    📦 ประวัติการตัด Stock (Stock Transaction History)
                                </div>

                                {/* Filters */}
                                <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#64748b' }}>วันที่เริ่มต้น:</span>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                style={{ fontFamily: 'Kanit', fontSize: 12, height: 36, borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0 10px' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#64748b' }}>ถึง:</span>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                style={{ fontFamily: 'Kanit', fontSize: 12, height: 36, borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0 10px' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#64748b' }}>รหัสสินค้า:</span>
                                            <input
                                                type="text"
                                                placeholder="ค้นหา..."
                                                value={searchItemcode}
                                                onChange={(e) => setSearchItemcode(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                style={{ fontFamily: 'Kanit', fontSize: 12, height: 36, borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0 10px', width: 140 }}
                                            />
                                        </div>
                                        <button
                                            onClick={handleSearch}
                                            style={{
                                                background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)',
                                                color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px',
                                                fontFamily: 'Kanit', fontSize: '12px', cursor: 'pointer'
                                            }}
                                        >
                                            🔍 ค้นหา
                                        </button>
                                    </div>
                                </div>

                                {/* Summary Cards */}
                                <div style={{ padding: '12px 16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <div style={{ backgroundColor: '#eef2ff', borderRadius: '12px', padding: '12px 20px', minWidth: '100px' }}>
                                        <div style={{ fontFamily: 'Kanit', fontSize: '10px', color: '#64748b' }}>ทั้งหมด</div>
                                        <div style={{ fontFamily: 'Kanit_B', fontSize: '16px', color: '#6366f1' }}>{transactions.length} <span style={{ fontSize: '10px', color: '#94a3b8' }}>รายการ</span></div>
                                    </div>
                                    <div style={{ backgroundColor: '#fef2f2', borderRadius: '12px', padding: '12px 20px', minWidth: '100px' }}>
                                        <div style={{ fontFamily: 'Kanit', fontSize: '10px', color: '#64748b' }}>🛒 ขาย</div>
                                        <div style={{ fontFamily: 'Kanit_B', fontSize: '16px', color: '#ef4444' }}>{transactions.filter(t => t.transaction_type?.toUpperCase() === 'SALE').length} <span style={{ fontSize: '10px', color: '#94a3b8' }}>รายการ</span></div>
                                    </div>
                                    <div style={{ backgroundColor: '#F3F8FC', borderRadius: '12px', padding: '12px 20px', minWidth: '100px' }}>
                                        <div style={{ fontFamily: 'Kanit', fontSize: '10px', color: '#64748b' }}>📥 รับเข้า</div>
                                        <div style={{ fontFamily: 'Kanit_B', fontSize: '16px', color: '#3E86C7' }}>{transactions.filter(t => t.transaction_type?.toUpperCase() === 'IN').length} <span style={{ fontSize: '10px', color: '#94a3b8' }}>รายการ</span></div>
                                    </div>
                                </div>

                                {/* Table */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px 16px' }}>
                                    {loading ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: '#64748b' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#3E86C7', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
                                                กำลังโหลดข้อมูล...
                                            </div>
                                        </div>
                                    ) : transactions.length === 0 ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: '#94a3b8', flexDirection: 'column' }}>
                                            <span style={{ fontSize: 48, marginBottom: 12 }}>📭</span>
                                            <p style={{ fontFamily: 'Kanit' }}>ไม่พบข้อมูลการเคลื่อนไหว Stock</p>
                                        </div>
                                    ) : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                            <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                                                <tr>
                                                    <th style={{ padding: '10px 8px', fontFamily: 'Kanit', fontSize: '10px', color: '#64748b', fontWeight: 600, textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>#</th>
                                                    <th style={{ padding: '10px 8px', fontFamily: 'Kanit', fontSize: '10px', color: '#64748b', fontWeight: 600, textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>วันที่/เวลา</th>
                                                    <th style={{ padding: '10px 8px', fontFamily: 'Kanit', fontSize: '10px', color: '#64748b', fontWeight: 600, textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>ประเภท</th>
                                                    <th style={{ padding: '10px 8px', fontFamily: 'Kanit', fontSize: '10px', color: '#64748b', fontWeight: 600, textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>รหัสสินค้า</th>
                                                    <th style={{ padding: '10px 8px', fontFamily: 'Kanit', fontSize: '10px', color: '#64748b', fontWeight: 600, textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>ชื่อสินค้า</th>
                                                    <th style={{ padding: '10px 8px', fontFamily: 'Kanit', fontSize: '10px', color: '#64748b', fontWeight: 600, textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Lot</th>
                                                    <th style={{ padding: '10px 8px', fontFamily: 'Kanit', fontSize: '10px', color: '#64748b', fontWeight: 600, textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>วันหมดอายุ</th>
                                                    <th style={{ padding: '10px 8px', fontFamily: 'Kanit', fontSize: '10px', color: '#64748b', fontWeight: 600, textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>จำนวน</th>
                                                    <th style={{ padding: '10px 8px', fontFamily: 'Kanit', fontSize: '10px', color: '#64748b', fontWeight: 600, textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>คงเหลือ</th>
                                                    <th style={{ padding: '10px 8px', fontFamily: 'Kanit', fontSize: '10px', color: '#64748b', fontWeight: 600, textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>ผู้ทำรายการ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transactions.map((tx, index) => (
                                                    <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-row">
                                                        <td style={{ padding: '8px', fontFamily: 'Kanit', fontSize: '10px', color: '#334155', textAlign: 'center' }}>{index + 1}</td>
                                                        <td style={{ padding: '8px', fontFamily: 'Kanit', fontSize: '10px', color: '#64748b', textAlign: 'center' }}>{formatDate(tx.createDate)}</td>
                                                        <td style={{ padding: '8px', textAlign: 'center' }}>
                                                            <span style={{
                                                                fontFamily: 'Kanit', fontSize: '9px', padding: '2px 8px', borderRadius: '8px',
                                                                backgroundColor: tx.transaction_type?.toUpperCase() === 'SALE' ? '#fef2f2' : '#EDF9F3',
                                                                color: tx.transaction_type?.toUpperCase() === 'SALE' ? '#dc2626' : '#147F56'
                                                            }}>
                                                                {getTransactionTypeLabel(tx.transaction_type)}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '8px', fontFamily: 'Consolas', fontSize: '10px', color: '#3E86C7', fontWeight: 500 }}>{tx.lotDetails?.itemcode || '-'}</td>
                                                        <td style={{ padding: '8px', fontFamily: 'Kanit', fontSize: '10px', color: '#334155', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.lotDetails?.itemName || '-'}</td>
                                                        <td style={{ padding: '8px', fontFamily: 'Kanit', fontSize: '10px', color: '#64748b', textAlign: 'center' }}>{tx.lotDetails?.lot || '-'}</td>
                                                        <td style={{ padding: '8px', fontFamily: 'Kanit', fontSize: '10px', color: '#64748b', textAlign: 'center' }}>{formatExpDate(tx.lotDetails?.dateExp || '')}</td>
                                                        <td style={{ padding: '8px', fontFamily: 'Kanit_B', fontSize: '11px', textAlign: 'center', color: tx.quantity_change < 0 ? '#ef4444' : '#1F9D6B' }}>
                                                            {tx.quantity_change > 0 ? '+' : ''}{tx.quantity_change?.toFixed(2)}
                                                        </td>
                                                        <td style={{ padding: '8px', fontFamily: 'Kanit', fontSize: '10px', color: '#3E86C7', textAlign: 'center', fontWeight: 500 }}>{tx.lotDetails?.balance?.toFixed(2) || '-'}</td>
                                                        <td style={{ padding: '8px', fontFamily: 'Kanit', fontSize: '9px', color: '#64748b', textAlign: 'center' }}>{tx.person || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`.hover-row:hover { background-color: #f1f5f9 !important; }`}</style>
        </div>
    )
}

export default StockTransactionPage
