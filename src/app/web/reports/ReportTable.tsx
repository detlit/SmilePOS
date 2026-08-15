'use client'

import React, { useState, useEffect } from 'react'
import { Table } from 'react-bootstrap'
import { getLocalStorageItem } from '@/utils/localStorage'

interface ReportData {
    label: string
    bill: number
    revenue: number
    cost: number
    perBill: number
    profit: number
    profitPercent: number
}

interface ReportTableProps {
    data: ReportData[]
    labelHeader: string
    loading?: boolean
}

export default function ReportTable({ data, labelHeader, loading = false }: ReportTableProps) {
    const [isLevel2, setIsLevel2] = useState(false)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsLevel2(String(getLocalStorageItem('level_')) === 'level2')
        }
    }, [])

    const formatNumber = (num: number) => {
        return num.toLocaleString('th-TH')
    }

    const formatDecimal = (num: number) => {
        return Number(num || 0).toLocaleString('th-TH', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    }

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontFamily: 'Kanit', fontSize: '14px' }}>กำลังโหลดข้อมูล...</div>
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontFamily: 'Kanit', fontSize: '14px' }}>ไม่มีข้อมูล</div>
            </div>
        )
    }

    // Calculate totals
    const totals = data.reduce((acc, row) => ({
        bill: acc.bill + row.bill,
        revenue: acc.revenue + row.revenue,
        cost: acc.cost + row.cost,
        profit: acc.profit + row.profit,
    }), { bill: 0, revenue: 0, cost: 0, profit: 0 })

    const totalPerBill = totals.bill > 0 ? totals.revenue / totals.bill : 0
    const totalProfitPercent = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0

    const headerStyle = {
        padding: '10px 12px',
        fontFamily: 'Kanit',
        fontSize: '12px',
        color: '#475569',
        fontWeight: 600,
        textAlign: 'center' as const,
        backgroundColor: '#f8fafc',
        borderBottom: '2px solid #e2e8f0',
    }

    const cellStyle = {
        padding: '10px 12px',
        fontFamily: 'Kanit',
        fontSize: '13px',
        textAlign: 'center' as const,
        borderBottom: '1px solid #f1f5f9',
    }

    return (
        <div style={{ overflowX: 'auto' }}>
            <Table hover borderless className="mb-0">
                <thead>
                    <tr>
                        <th style={{ ...headerStyle, textAlign: 'left', width: '20%' }}>{labelHeader}</th>
                        <th style={{ ...headerStyle, width: '12%' }}>ยอดบิล</th>
                        <th style={{ ...headerStyle, width: '15%' }}>ยอดขาย</th>
                        {isLevel2 && <th style={{ ...headerStyle, width: '15%' }}>ต้นทุน</th>}
                        <th style={{ ...headerStyle, width: '13%' }}>ยอดต่อบิล</th>
                        {isLevel2 && <th style={{ ...headerStyle, width: '13%' }}>กำไร</th>}
                        {isLevel2 && <th style={{ ...headerStyle, width: '12%' }}>%กำไร</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index} style={{ transition: 'background-color 0.15s' }} className="hover-row">
                            <td style={{ ...cellStyle, textAlign: 'left', color: '#334155', fontWeight: 500 }}>{row.label}</td>
                            <td style={{ ...cellStyle, color: '#6366f1', fontWeight: 600 }}>{formatNumber(row.bill)}</td>
                            <td style={{ ...cellStyle, color: '#2A6AAA', fontWeight: 600 }}>{formatDecimal(row.revenue)}</td>
                            {isLevel2 && <td style={{ ...cellStyle, color: '#b45309' }}>{formatDecimal(row.cost)}</td>}
                            <td style={{ ...cellStyle, color: '#0891b2' }}>{formatDecimal(row.perBill)}</td>
                            {isLevel2 && <td style={{ ...cellStyle, color: row.profit >= 0 ? '#0F6845' : '#dc2626', fontWeight: 600 }}>{formatDecimal(row.profit)}</td>}
                            {isLevel2 && <td style={{
                                ...cellStyle,
                                color: row.profitPercent >= 20 ? '#0F6845' : row.profitPercent >= 10 ? '#ca8a04' : '#dc2626',
                                fontWeight: 600
                            }}>
                                {row.profitPercent.toFixed(1)}%
                            </td>}
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr style={{ backgroundColor: '#F3F8FC' }}>
                        <td style={{ ...cellStyle, textAlign: 'left', fontFamily: 'Kanit_B', color: '#1E5088' }}>รวม</td>
                        <td style={{ ...cellStyle, fontFamily: 'Kanit_B', color: '#6366f1' }}>{formatNumber(totals.bill)}</td>
                        <td style={{ ...cellStyle, fontFamily: 'Kanit_B', color: '#2A6AAA' }}>{formatDecimal(totals.revenue)}</td>
                        {isLevel2 && <td style={{ ...cellStyle, fontFamily: 'Kanit_B', color: '#b45309' }}>{formatDecimal(totals.cost)}</td>}
                        <td style={{ ...cellStyle, fontFamily: 'Kanit_B', color: '#0891b2' }}>{formatDecimal(totalPerBill)}</td>
                        {isLevel2 && <td style={{ ...cellStyle, fontFamily: 'Kanit_B', color: totals.profit >= 0 ? '#0F6845' : '#dc2626' }}>{formatDecimal(totals.profit)}</td>}
                        {isLevel2 && <td style={{ ...cellStyle, fontFamily: 'Kanit_B', color: '#7c3aed' }}>{totalProfitPercent.toFixed(1)}%</td>}
                    </tr>
                </tfoot>
            </Table>
            <style jsx>{`.hover-row:hover { background-color: #f8fafc !important; }`}</style>
        </div>
    )
}
