'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toThaiDateString } from '@/utils/dateUtils'
import { ChevronDownIcon, Clock, Calendar, CalendarDays, BarChart3, TrendingUp, Download } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import ReportTable from './ReportTable'
import SalesChart from './SalesChart'

type SubTab = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'

interface TabConfig {
    key: SubTab
    label: string
    icon: React.ReactNode
}

const subTabs: TabConfig[] = [
    { key: 'hourly', label: 'รายชั่วโมง', icon: <Clock size={14} /> },
    { key: 'daily', label: 'รายวัน', icon: <Calendar size={14} /> },
    { key: 'weekly', label: 'รายสัปดาห์', icon: <CalendarDays size={14} /> },
    { key: 'monthly', label: 'รายเดือน', icon: <BarChart3 size={14} /> },
    { key: 'yearly', label: 'รายปี', icon: <TrendingUp size={14} /> },
]

export default function AllReportsTab() {
    const [activeTab, setActiveTab] = useState<SubTab>('hourly')
    const [loading, setLoading] = useState(false)
    const [reportData, setReportData] = useState<any[]>([])

    // Filter states
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })
    const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString())
    const [selectedDate, setSelectedDate] = useState(() => toThaiDateString())

    const [openMonthPicker, setOpenMonthPicker] = useState(false)
    const [openYearPicker, setOpenYearPicker] = useState(false)

    // Generate month options
    const monthOptions = () => {
        const months = []
        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
        const currentYear = new Date().getFullYear()
        for (let y = currentYear; y >= currentYear - 3; y--) {
            for (let m = 12; m >= 1; m--) {
                const value = `${y}-${String(m).padStart(2, '0')}`
                months.push({ value, label: `${thaiMonths[m - 1]} ${y + 543}` })
            }
        }
        return months
    }

    // Generate year options
    const yearOptions = () => {
        const years = []
        const currentYear = new Date().getFullYear()
        for (let y = currentYear; y >= currentYear - 5; y--) {
            years.push({ value: y.toString(), label: `${y + 543}` })
        }
        return years
    }

    const fetchData = async () => {
        setLoading(true)
        const companyS = localStorage.getItem("company_") || ""

        try {
            let res
            switch (activeTab) {
                case 'hourly':
                    res = await axios.get(`/api/sale_cal/sale_hourly_report?company=${companyS}&createDate=${selectedDate}`)
                    setReportData(res.data.map((d: any) => ({
                        label: d.time,
                        bill: d.bill,
                        revenue: d.revenue,
                        cost: d.cost,
                        perBill: d.perBill,
                        profit: d.profit,
                        profitPercent: d.profitPercent,
                    })))
                    break
                case 'daily':
                    res = await axios.get(`/api/sale_cal/sale_daily_report?company=${companyS}&createDate=${selectedMonth}`)
                    setReportData(res.data.map((d: any) => ({
                        label: d.date,
                        bill: d.bill,
                        revenue: d.revenue,
                        cost: d.cost,
                        perBill: d.perBill,
                        profit: d.profit,
                        profitPercent: d.profitPercent,
                    })))
                    break
                case 'weekly':
                    res = await axios.get(`/api/sale_cal/sale_weekly?company=${companyS}&createDate=${selectedMonth}`)
                    setReportData(res.data.map((d: any) => ({
                        label: d.week,
                        bill: d.bill,
                        revenue: d.revenue,
                        cost: d.cost,
                        perBill: d.perBill,
                        profit: d.profit,
                        profitPercent: d.profitPercent,
                    })))
                    break
                case 'monthly':
                    res = await axios.get(`/api/sale_cal/sale_monthly_report?company=${companyS}&createDate=${selectedYear}`)
                    setReportData(res.data.map((d: any) => ({
                        label: d.month,
                        bill: d.bill,
                        revenue: d.revenue,
                        cost: d.cost,
                        perBill: d.perBill,
                        profit: d.profit,
                        profitPercent: d.profitPercent,
                    })))
                    break
                case 'yearly':
                    res = await axios.get(`/api/sale_cal/sale_yearly?company=${companyS}&createDate=${selectedYear}`)
                    setReportData(res.data.map((d: any) => ({
                        label: `${Number(d.year) + 543}`,
                        bill: d.bill,
                        revenue: d.revenue,
                        cost: d.cost,
                        perBill: d.perBill,
                        profit: d.profit,
                        profitPercent: d.profitPercent,
                    })))
                    break
            }
        } catch (error) {
            console.error('Error fetching report data:', error)
            setReportData([])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [activeTab, selectedMonth, selectedYear, selectedDate])

    const getFilterComponent = () => {
        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

        if (activeTab === 'hourly') {
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#64748b' }}>วันที่:</span>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{
                            fontFamily: 'Kanit',
                            fontSize: '13px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            color: '#334155',
                        }}
                    />
                </div>
            )
        }

        if (activeTab === 'monthly' || activeTab === 'yearly') {
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#64748b' }}>ปี:</span>
                    <Popover open={openYearPicker} onOpenChange={setOpenYearPicker}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" style={{
                                fontFamily: 'Kanit',
                                fontSize: 13,
                                height: 36,
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}>
                                <span style={{ color: '#6366f1' }}>{Number(selectedYear) + 543}</span>
                                <ChevronDownIcon size={16} style={{ color: '#94a3b8' }} />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {yearOptions().map((y) => (
                                <div
                                    key={y.value}
                                    onClick={() => { setSelectedYear(y.value); setOpenYearPicker(false) }}
                                    style={{
                                        padding: '8px 16px',
                                        cursor: 'pointer',
                                        fontFamily: 'Kanit',
                                        fontSize: '13px',
                                        color: y.value === selectedYear ? '#6366f1' : '#334155',
                                        backgroundColor: y.value === selectedYear ? '#f5f3ff' : 'transparent',
                                        borderRadius: '6px',
                                    }}
                                    className="hover-option"
                                >
                                    {y.label}
                                </div>
                            ))}
                        </PopoverContent>
                    </Popover>
                </div>
            )
        }

        // daily and weekly use month picker
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#64748b' }}>เดือน:</span>
                <Popover open={openMonthPicker} onOpenChange={setOpenMonthPicker}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" style={{
                            fontFamily: 'Kanit',
                            fontSize: 13,
                            height: 36,
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <span style={{ color: '#6366f1' }}>
                                {(() => {
                                    const [y, m] = selectedMonth.split('-')
                                    return `${thaiMonths[Number(m) - 1]} ${Number(y) + 543}`
                                })()}
                            </span>
                            <ChevronDownIcon size={16} style={{ color: '#94a3b8' }} />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {monthOptions().map((m) => (
                            <div
                                key={m.value}
                                onClick={() => { setSelectedMonth(m.value); setOpenMonthPicker(false) }}
                                style={{
                                    padding: '8px 16px',
                                    cursor: 'pointer',
                                    fontFamily: 'Kanit',
                                    fontSize: '13px',
                                    color: m.value === selectedMonth ? '#6366f1' : '#334155',
                                    backgroundColor: m.value === selectedMonth ? '#f5f3ff' : 'transparent',
                                    borderRadius: '6px',
                                }}
                                className="hover-option"
                            >
                                {m.label}
                            </div>
                        ))}
                    </PopoverContent>
                </Popover>
            </div>
        )
    }

    const getChartTitle = () => {
        switch (activeTab) {
            case 'hourly': return 'กราฟยอดขายรายชั่วโมง'
            case 'daily': return 'กราฟยอดขายรายวัน'
            case 'weekly': return 'กราฟยอดขายรายสัปดาห์'
            case 'monthly': return 'กราฟยอดขายรายเดือน'
            case 'yearly': return 'กราฟยอดขายรายปี'
        }
    }

    const getLabelHeader = () => {
        switch (activeTab) {
            case 'hourly': return 'เวลา'
            case 'daily': return 'วันที่'
            case 'weekly': return 'สัปดาห์'
            case 'monthly': return 'เดือน'
            case 'yearly': return 'ปี'
        }
    }

    const exportCSV = () => {
        if (reportData.length === 0) return
        const isLevel2 = String(localStorage.getItem('level_')) === 'level2'

        const headers = isLevel2
            ? [getLabelHeader(), 'ยอดบิล', 'ยอดขาย', 'ต้นทุน', 'ยอดต่อบิล', 'กำไร', '%กำไร']
            : [getLabelHeader(), 'ยอดบิล', 'ยอดขาย', 'ยอดต่อบิล']
        const csvContent = [
            headers.join(','),
            ...reportData.map(row => isLevel2
                ? [
                    row.label,
                    row.bill,
                    row.revenue,
                    row.cost,
                    row.perBill,
                    row.profit,
                    row.profitPercent
                ].join(',')
                : [
                    row.label,
                    row.bill,
                    row.revenue,
                    row.perBill,
                ].join(','))
        ].join('\n')

        const BOM = '\uFEFF'
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `report_${activeTab}_${toThaiDateString()}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

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
                background: '#F3F8FC',
                borderBottom: '2px solid #3E86C7',
                color: '#1E5088',
                padding: '16px 20px',
                fontFamily: 'Kanit_B',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <BarChart3 size={18} /> รายงานทั้งหมด
            </div>

            {/* Sub Tabs */}
            <div style={{
                display: 'flex',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                padding: '8px 16px',
                gap: '4px',
                overflowX: 'auto',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {subTabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontFamily: 'Kanit',
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                backgroundColor: activeTab === tab.key ? '#f5f3ff' : 'transparent',
                                color: activeTab === tab.key ? '#6366f1' : '#64748b',
                                border: activeTab === tab.key ? '1px solid #6366f1' : '1px solid transparent',
                                boxShadow: activeTab === tab.key ? '0 2px 4px rgba(99,102,241,0.1)' : 'none',
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={exportCSV}
                    disabled={reportData.length === 0 || loading}
                    style={{
                        fontFamily: 'Kanit',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderColor: '#3E86C7',
                        color: '#3E86C7'
                    }}
                >
                    <Download size={14} />
                    Export CSV
                </Button>
            </div>

            {/* Filter Section */}
            <div style={{
                padding: '12px 16px',
                backgroundColor: '#fafafa',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                {getFilterComponent()}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchData}
                    style={{ fontFamily: 'Kanit', fontSize: '12px' }}
                >
                    🔄 รีเฟรช
                </Button>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {/* Table */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    marginBottom: '16px'
                }}>
                    <ReportTable
                        data={reportData}
                        labelHeader={getLabelHeader()}
                        loading={loading}
                    />
                </div>

                {/* Chart */}
                <SalesChart
                    data={reportData.map(d => ({ label: d.label, revenue: d.revenue, profit: d.profit }))}
                    title={getChartTitle()}
                    showProfit={true}
                    height={280}
                    loading={loading}
                />
            </div>

            <style jsx>{`
        .hover-option:hover { background-color: #f8fafc !important; }
      `}</style>
        </div>
    )
}
