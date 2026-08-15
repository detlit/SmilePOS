'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface ChartData {
    label: string
    revenue: number
    profit?: number
}

interface SalesChartProps {
    data: ChartData[]
    title: string
    showProfit?: boolean
    height?: number
    loading?: boolean
}

export default function SalesChart({ data, title, showProfit = false, height = 300, loading = false }: SalesChartProps) {
    if (loading) {
        return (
            <div style={{
                height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                margin: '16px 0'
            }}>
                <div style={{ fontFamily: 'Kanit', fontSize: '14px', color: '#64748b' }}>กำลังโหลดกราฟ...</div>
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div style={{
                height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                margin: '16px 0'
            }}>
                <div style={{ fontFamily: 'Kanit', fontSize: '14px', color: '#94a3b8' }}>ไม่มีข้อมูลสำหรับแสดงกราฟ</div>
            </div>
        )
    }

    const formatNumber = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
        return value.toString()
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    <p style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#334155', margin: 0, marginBottom: '8px' }}>{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{
                            fontFamily: 'Kanit',
                            fontSize: '12px',
                            color: entry.color,
                            margin: 0,
                            marginBottom: index < payload.length - 1 ? '4px' : 0
                        }}>
                            {entry.name}: {Number(entry.value).toLocaleString('th-TH')} บาท
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            margin: '16px 0'
        }}>
            <div style={{
                fontFamily: 'Kanit_B',
                fontSize: '14px',
                color: '#334155',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                📊 {title}
            </div>
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                        dataKey="label"
                        tick={{ fontFamily: 'Kanit', fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                        tickFormatter={formatNumber}
                        tick={{ fontFamily: 'Kanit', fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ fontFamily: 'Kanit', fontSize: 12 }}
                        formatter={(value) => <span style={{ color: '#475569' }}>{value}</span>}
                    />
                    <Bar
                        dataKey="revenue"
                        name="ยอดขาย"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                    />
                    {showProfit && (
                        <Bar
                            dataKey="profit"
                            name="กำไร"
                            fill="#3E86C7"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                        />
                    )}
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
