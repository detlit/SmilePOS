'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
import axios from 'axios'
import { AlertTriangle, Search, Download, ShieldAlert, Clock, XCircle, CheckCircle2, Filter, CalendarClock, Package, Timer, CalendarDays, CalendarRange, Infinity as InfinityIcon } from 'lucide-react'
import * as XLSX from 'xlsx'
import { getLocalStorageItem } from '@/utils/localStorage'
import { useReactToPrint } from 'react-to-print'

interface ExpiryItem {
    id: number
    itemcode: string
    itemName: string
    lot: string
    dateExp: string
    balance: number
    statuss: string | null
    daysLeft: number
    namevender?: string
}

type FilterType = 'all' | 'expired' | '30' | '60' | '90' | '120' | '180' | '365' | 'over365' | 'acknowledged'

export default function ExpiryProductTab() {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<ExpiryItem[]>([])
    const [filter, setFilter] = useState<FilterType>('all')
    const [search, setSearch] = useState('')
    const printRef = useRef<HTMLDivElement>(null)
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

    // Modal state
    const [adjustModalItem, setAdjustModalItem] = useState<ExpiryItem | null>(null)
    const [adjustReason, setAdjustReason] = useState('ส่งคืนบริษัท')
    const [adjustDate, setAdjustDate] = useState(() => new Date().toISOString().slice(0, 10))
    const [adjustReceiverDetail, setAdjustReceiverDetail] = useState('')
    const [adjustOperator, setAdjustOperator] = useState('')
    const [employeeList, setEmployeeList] = useState<any[]>([])
    const [savingAdjust, setSavingAdjust] = useState(false)

    // Report modal state
    const [showReport, setShowReport] = useState(false)
    const [reportData, setReportData] = useState<any[]>([])
    const [reportLoading, setReportLoading] = useState(false)
    const [reportReasonFilter, setReportReasonFilter] = useState('all')
    const [reportDateFrom, setReportDateFrom] = useState('')
    const [reportDateTo, setReportDateTo] = useState('')
    const reportPrintRef = useRef<HTMLDivElement>(null)

    const [storeName, setStoreName] = useState('')
    const [storeAddress, setStoreAddress] = useState('')

    const handlePrintReport = useReactToPrint({ contentRef: reportPrintRef, documentTitle: 'แบบบันทึกรายการสินค้าเปลี่ยนคืน-ทำลาย' })

    const getDaysUntilExpiry = (dateExp: string) => {
        if (!dateExp) return 9999
        const expDate = new Date(dateExp)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const diffTime = expDate.getTime() - today.getTime()
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    const fetchData = async () => {
        setLoading(true)
        const company = getLocalStorageItem("company_") || ""
        try {
            const res = await axios.get(`/api/receivelist?company=${company}&fields=expiry`)
            const items = (res.data || [])
                .filter((item: any) => (item.balance ?? 0) > 0 && item.dateExp)
                .map((item: any) => ({
                    ...item,
                    lot: item.lot || '-',
                    daysLeft: getDaysUntilExpiry(item.dateExp),
                }))
                .sort((a: ExpiryItem, b: ExpiryItem) => a.daysLeft - b.daysLeft)
            setData(items)
        } catch (e) {
            console.error(e)
            setData([])
        }
        setLoading(false)
    }

    useEffect(() => { fetchData() }, [])

    useEffect(() => {
        const handleClickOutside = () => setOpenDropdownId(null)
        if (openDropdownId) {
            document.addEventListener('click', handleClickOutside)
            return () => document.removeEventListener('click', handleClickOutside)
        }
    }, [openDropdownId])

    // Categorize
    const expired = data.filter(d => d.daysLeft <= 0 && d.statuss !== 'exp')
    const within30 = data.filter(d => d.daysLeft > 0 && d.daysLeft <= 30 && d.statuss !== 'exp')
    const within60 = data.filter(d => d.daysLeft > 30 && d.daysLeft <= 60 && d.statuss !== 'exp')
    const within90 = data.filter(d => d.daysLeft > 60 && d.daysLeft <= 90 && d.statuss !== 'exp')
    const within120 = data.filter(d => d.daysLeft > 90 && d.daysLeft <= 120 && d.statuss !== 'exp')
    const within180 = data.filter(d => d.daysLeft > 120 && d.daysLeft <= 180 && d.statuss !== 'exp')
    const within365 = data.filter(d => d.daysLeft > 180 && d.daysLeft <= 365 && d.statuss !== 'exp')
    const over365 = data.filter(d => d.daysLeft > 365 && d.statuss !== 'exp')
    const acknowledged = data.filter(d => d.statuss === 'exp')

    // Filter
    const filteredData = (() => {
        let result = data
        if (filter === 'expired') result = expired
        else if (filter === '30') result = within30
        else if (filter === '60') result = within60
        else if (filter === '90') result = within90
        else if (filter === '120') result = within120
        else if (filter === '180') result = within180
        else if (filter === '365') result = within365
        else if (filter === 'over365') result = over365
        else if (filter === 'acknowledged') result = acknowledged

        if (search.trim()) {
            const q = search.trim().toLowerCase()
            result = result.filter(d =>
                d.itemcode.toLowerCase().includes(q) ||
                d.itemName.toLowerCase().includes(q) ||
                d.lot.toLowerCase().includes(q)
            )
        }
        return result
    })()

    const handleAcknowledge = async (item: ExpiryItem) => {
        if (!confirm('ยืนยันคุณได้รับทราบรายการนี้แล้ว?')) return
        try {
            await axios.put(`/api/receivelist/${item.id}`, {
                ...item,
                statuss: 'exp'
            })
            fetchData()
        } catch (error) {
            console.error('Error acknowledging item:', error)
            alert('เกิดข้อผิดพลาดในการบันทึก')
        }
    }

    const adjustReasons = [
        { label: 'ส่งคืนบริษัท', value: 'ส่งคืนบริษัท' },
        { label: 'ทำลายยา ที่หมดอายุ', value: 'ทำลายยา ที่หมดอายุ' },
        { label: 'แจ้งเปลี่ยนสินค้า', value: 'แจ้งเปลี่ยนสินค้า' },
    ]

    const fetchEmployees = async () => {
        const id_company = Number(getLocalStorageItem('id_company') || '0')
        try {
            const res = await axios.get(`/api/setting/employee?id_company=${id_company}`)
            setEmployeeList(Array.isArray(res.data) ? res.data : [])
        } catch (error) {
            console.error('Error fetching employees:', error)
        }
    }

    const openAdjustModal = (item: ExpiryItem) => {
        setOpenDropdownId(null)
        setAdjustModalItem(item)
        setAdjustReason('ส่งคืนบริษัท')
        setAdjustDate(new Date().toISOString().slice(0, 10))
        setAdjustReceiverDetail('')
        setAdjustOperator(getLocalStorageItem('person_') || '')
        if (employeeList.length === 0) fetchEmployees()
    }

    const handleAdjustStock = async () => {
        if (!adjustModalItem) return
        setSavingAdjust(true)
        try {
            await axios.put(`/api/receivelist/${adjustModalItem.id}`, {
                ...adjustModalItem,
                balance: 0,
                statuss: adjustReason,
                dateRC: new Date(adjustDate).toISOString(),
                maker: adjustReceiverDetail,
                person: adjustOperator,
            })
            fetchData()
            setAdjustModalItem(null)
        } catch (error) {
            console.error('Error adjusting stock:', error)
            alert('เกิดข้อผิดพลาดในการปรับยอด')
        } finally {
            setSavingAdjust(false)
        }
    }

    // Report functions
    const fetchReportData = async () => {
        setReportLoading(true)
        const company = getLocalStorageItem("company_") || ""
        try {
            const res = await axios.get(`/api/receivelist?company=${company}&fields=adjusted`)
            setReportData(Array.isArray(res.data) ? res.data : [])
        } catch (e) {
            console.error(e)
            setReportData([])
        }
        setReportLoading(false)
    }

    const openReportModal = () => {
        setShowReport(true)
        setReportReasonFilter('all')
        setReportDateFrom('')
        setReportDateTo('')
        fetchReportData()
        // Fetch store info
        const company = getLocalStorageItem("company_") || ""
        axios.get(`/api/setting/store/store?company=${company}`).then(res => {
            const store = Array.isArray(res.data) ? res.data[0] : null
            setStoreName(store?.namestore || '')
            setStoreAddress(store?.address || '')
        }).catch(() => {})
    }

    const filteredReportData = useMemo(() => {
        let result = reportData
        if (reportReasonFilter !== 'all') {
            result = result.filter((d: any) => d.statuss === reportReasonFilter)
        }
        if (reportDateFrom) {
            const from = new Date(reportDateFrom)
            from.setHours(0, 0, 0, 0)
            result = result.filter((d: any) => d.dateExp && new Date(d.dateExp) >= from)
        }
        if (reportDateTo) {
            const to = new Date(reportDateTo)
            to.setHours(23, 59, 59, 999)
            result = result.filter((d: any) => d.dateExp && new Date(d.dateExp) <= to)
        }
        return result
    }, [reportData, reportReasonFilter, reportDateFrom, reportDateTo])

    const handleExport = () => {
        const exportData = filteredData.map((d, i) => ({
            '#': i + 1,
            'รหัส': d.itemcode,
            'ชื่อสินค้า': d.itemName,
            'Lot': d.lot,
            'วันหมดอายุ': formatDate(d.dateExp),
            'คงเหลือ': d.balance,
            'วันคงเหลือ': d.daysLeft <= 0 ? `หมดอายุแล้ว (${Math.abs(d.daysLeft)} วัน)` : `${d.daysLeft} วัน`,
            'สถานะ': d.statuss === 'exp' ? 'รับทราบแล้ว' : d.daysLeft <= 0 ? 'หมดอายุ' : 'ใกล้หมดอายุ',
        }))
        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'สินค้าหมดอายุ')
        XLSX.writeFile(wb, `ExpiryProducts_${new Date().toISOString().slice(0, 10)}.xlsx`)
    }

    const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: 'รายงานสินค้าหมดอายุ' })

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-'
        const date = new Date(dateStr)
        return date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    const getStatusStyle = (daysLeft: number, statuss: string | null) => {
        if (statuss === 'exp') return { bg: '#F3F8FC', color: '#2A6AAA', border: '#A6C8E7', label: 'รับทราบแล้ว' }
        if (daysLeft <= 0) return { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5', label: 'หมดอายุแล้ว' }
        if (daysLeft <= 30) return { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5', label: `${daysLeft} วัน` }
        if (daysLeft <= 60) return { bg: '#fff7ed', color: '#ea580c', border: '#fdba74', label: `${daysLeft} วัน` }
        if (daysLeft <= 90) return { bg: '#fffbeb', color: '#d97706', border: '#fcd34d', label: `${daysLeft} วัน` }
        if (daysLeft <= 120) return { bg: '#F3F8FC', color: '#1E5088', border: '#A6C8E7', label: `${daysLeft} วัน` }
        if (daysLeft <= 180) return { bg: '#F3F8FC', color: '#2A6AAA', border: '#A6C8E7', label: `${daysLeft} วัน` }
        return { bg: '#f5f3ff', color: '#7c3aed', border: '#c4b5fd', label: `${daysLeft} วัน` }
    }

    return (
        <div ref={printRef} style={{
            backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0', overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                color: 'white', padding: '16px 24px', fontFamily: 'Kanit_B', fontSize: '16px',
                display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldAlert size={22} />
                    สินค้าหมดอายุ / ใกล้หมดอายุ
                    <span style={{ fontSize: '12px', fontFamily: 'Kanit', opacity: 0.85, marginLeft: '8px' }}>
                        ควบคุมและติดตามสินค้าที่ใกล้หมดอายุ
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handlePrint()} style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: 'white',
                        fontFamily: 'Kanit', fontSize: '12px', cursor: 'pointer',
                    }}>
                        พิมพ์
                    </button>
                    <button onClick={openReportModal} style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: 'white',
                        fontFamily: 'Kanit', fontSize: '12px', cursor: 'pointer',
                    }}>
                        📋 รายงาน
                    </button>
                </div>
            </div>

            {/* Dashboard Cards - single row compact */}
            <div style={{ padding: '14px 24px 10px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                {([
                    { key: 'expired' as FilterType, label: 'หมดอายุแล้ว', count: expired.length, icon: <XCircle size={15} color="#dc2626" />, color: '#dc2626', darkColor: '#991b1b', borderColor: '#fca5a5', bg: '#fff5f5', bgActive: '#fef2f2' },
                    { key: '30' as FilterType, label: 'ภายใน 30 วัน', count: within30.length, icon: <AlertTriangle size={15} color="#dc2626" />, color: '#dc2626', darkColor: '#991b1b', borderColor: '#fca5a5', bg: '#fff8f8', bgActive: '#fef2f2' },
                    { key: '60' as FilterType, label: '31-60 วัน', count: within60.length, icon: <Clock size={15} color="#ea580c" />, color: '#ea580c', darkColor: '#9a3412', borderColor: '#fdba74', bg: '#fffbf5', bgActive: '#fff7ed' },
                    { key: '90' as FilterType, label: '61-90 วัน', count: within90.length, icon: <CalendarClock size={15} color="#d97706" />, color: '#d97706', darkColor: '#92400e', borderColor: '#fcd34d', bg: '#fffef5', bgActive: '#fffbeb' },
                    { key: '120' as FilterType, label: '91-120 วัน', count: within120.length, icon: <Timer size={15} color="#1E5088" />, color: '#1E5088', darkColor: '#173F6B', borderColor: '#A6C8E7', bg: '#f8fdf8', bgActive: '#F3F8FC' },
                    { key: '180' as FilterType, label: '121-180 วัน', count: within180.length, icon: <CalendarDays size={15} color="#2A6AAA" />, color: '#2A6AAA', darkColor: '#173F6B', borderColor: '#A6C8E7', bg: '#f8faff', bgActive: '#F3F8FC' },
                    { key: '365' as FilterType, label: '181-365 วัน', count: within365.length, icon: <CalendarRange size={15} color="#7c3aed" />, color: '#7c3aed', darkColor: '#5b21b6', borderColor: '#c4b5fd', bg: '#faf8ff', bgActive: '#f5f3ff' },
                    { key: 'over365' as FilterType, label: 'เกิน 365 วัน', count: over365.length, icon: <InfinityIcon size={15} color="#0891b2" />, color: '#0891b2', darkColor: '#155e75', borderColor: '#67e8f9', bg: '#f5fcfd', bgActive: '#ecfeff' },
                    { key: 'acknowledged' as FilterType, label: 'รับทราบแล้ว', count: acknowledged.length, icon: <CheckCircle2 size={15} color="#2A6AAA" />, color: '#2A6AAA', darkColor: '#173F6B', borderColor: '#A6C8E7', bg: '#f8fdf8', bgActive: '#F3F8FC' },
                ]).map(card => (
                    <div key={card.key}
                        onClick={() => setFilter(filter === card.key ? 'all' : card.key)}
                        style={{
                            flex: '1 1 0', minWidth: '110px', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer',
                            border: filter === card.key ? `2px solid ${card.color}` : `1px solid ${card.borderColor}`,
                            backgroundColor: filter === card.key ? card.bgActive : card.bg,
                            transition: 'all 0.2s', boxShadow: filter === card.key ? `0 2px 8px ${card.color}26` : 'none',
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            {card.icon}
                            <span style={{ fontFamily: 'Kanit_B', fontSize: '11px', color: card.color, whiteSpace: 'nowrap' }}>{card.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span style={{ fontFamily: 'Kanit_B', fontSize: '20px', color: card.darkColor, lineHeight: 1 }}>{card.count}</span>
                            <span style={{ fontFamily: 'Kanit', fontSize: '10px', color: card.color }}>รายการ</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter bar */}
            <div style={{
                padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '12px',
                borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fafbfc',
                flexWrap: 'wrap',
            }}>
                <Filter size={16} color="#64748b" />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {([
                        { key: 'expired' as FilterType, label: 'หมดอายุ', count: expired.length },
                        { key: '30' as FilterType, label: '≤ 30 วัน', count: within30.length },
                        { key: '60' as FilterType, label: '31-60 วัน', count: within60.length },
                        { key: '90' as FilterType, label: '61-90 วัน', count: within90.length },
                        { key: '120' as FilterType, label: '91-120 วัน', count: within120.length },
                        { key: '180' as FilterType, label: '121-180 วัน', count: within180.length },
                        { key: '365' as FilterType, label: '181-365 วัน', count: within365.length },
                        { key: 'over365' as FilterType, label: 'เกิน 365 วัน', count: over365.length },
                        { key: 'acknowledged' as FilterType, label: 'รับทราบแล้ว', count: acknowledged.length },
                    ]).map(tab => (
                        <button key={tab.key} onClick={() => setFilter(tab.key)}
                            style={{
                                padding: '5px 14px', borderRadius: '6px', fontFamily: 'Kanit', fontSize: '12px',
                                border: filter === tab.key ? '1px solid #ea580c' : '1px solid #e2e8f0',
                                backgroundColor: filter === tab.key ? '#fff7ed' : 'white',
                                color: filter === tab.key ? '#ea580c' : '#64748b',
                                fontWeight: filter === tab.key ? 600 : 400,
                                cursor: 'pointer', transition: 'all 0.15s',
                                display: 'flex', alignItems: 'center', gap: '4px',
                            }}>
                            {tab.label}
                            <span style={{
                                fontSize: '10px', padding: '1px 6px', borderRadius: '10px',
                                backgroundColor: filter === tab.key ? '#ea580c' : '#e2e8f0',
                                color: filter === tab.key ? 'white' : '#64748b',
                            }}>{tab.count}</span>
                        </button>
                    ))}
                </div>

                <div style={{ position: 'relative', marginLeft: 'auto' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="ค้นหารหัส/ชื่อสินค้า/Lot..."
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
                        <Package size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                        <div style={{ fontFamily: 'Kanit', fontSize: '14px' }}>ไม่พบสินค้าหมดอายุ / ใกล้หมดอายุ</div>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr>
                                {['#', 'รหัส', 'ชื่อสินค้า', 'Lot', 'วันหมดอายุ', 'คงเหลือ', 'สถานะ', 'วันคงเหลือ', 'จัดการ', 'สาเหตุที่ขอ'].map((h, i) => (
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
                                const st = getStatusStyle(item.daysLeft, item.statuss)
                                return (
                                    <tr key={`${item.id}-${item.lot}`} style={{
                                        borderBottom: '1px solid #f1f5f9',
                                        backgroundColor: item.daysLeft <= 0 && item.statuss !== 'exp'
                                            ? '#fef2f2' : index % 2 === 0 ? 'white' : '#fafbfc',
                                        transition: 'background-color 0.15s',
                                    }}>
                                        <td style={{ padding: '8px 12px', fontFamily: 'Kanit', fontSize: '12px', color: '#94a3b8' }}>{index + 1}</td>
                                        <td style={{ padding: '8px 12px', fontFamily: 'Kanit', fontSize: '12px', color: '#6366f1', fontWeight: 600 }}>{item.itemcode}</td>
                                        <td style={{
                                            padding: '8px 12px', maxWidth: '220px',
                                        }}>
                                            <div style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.itemName}</div>
                                            {(item as any).namevender && (
                                                <div style={{ fontFamily: 'Kanit', fontSize: '10px', color: '#94a3b8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {(item as any).namevender}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '8px 12px', fontFamily: 'Kanit', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>{item.lot}</td>
                                        <td style={{
                                            padding: '8px 12px', fontFamily: 'Kanit', fontSize: '12px', textAlign: 'center',
                                            color: item.daysLeft <= 30 ? '#dc2626' : '#334155', fontWeight: item.daysLeft <= 30 ? 600 : 400,
                                        }}>{formatDate(item.dateExp)}</td>
                                        <td style={{ padding: '8px 12px', fontFamily: 'Kanit_B', fontSize: '12px', color: '#334155', textAlign: 'center' }}>{item.balance}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                            <span style={{
                                                fontFamily: 'Kanit', fontSize: '11px', padding: '3px 10px', borderRadius: '10px',
                                                backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}`,
                                                fontWeight: 600,
                                            }}>
                                                {st.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                            {item.daysLeft <= 0 ? (
                                                <span style={{
                                                    fontFamily: 'Kanit_B', fontSize: '12px', color: '#dc2626',
                                                }}>
                                                    เกิน {Math.abs(item.daysLeft)} วัน
                                                </span>
                                            ) : (
                                                <span style={{
                                                    fontFamily: 'Kanit_B', fontSize: '12px',
                                                    color: item.daysLeft <= 30 ? '#dc2626' : item.daysLeft <= 60 ? '#ea580c' : '#d97706',
                                                }}>
                                                    {item.daysLeft} วัน
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                            {item.statuss !== 'exp' ? (
                                                <button
                                                    onClick={() => handleAcknowledge(item)}
                                                    style={{
                                                        padding: '4px 12px', borderRadius: '6px', fontFamily: 'Kanit', fontSize: '11px',
                                                        border: '1px solid #ea580c', backgroundColor: '#fff7ed', color: '#ea580c',
                                                        cursor: 'pointer', transition: 'all 0.15s', fontWeight: 600,
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ea580c'; e.currentTarget.style.color = 'white' }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff7ed'; e.currentTarget.style.color = '#ea580c' }}
                                                >
                                                    รับทราบ
                                                </button>
                                            ) : (
                                                <span style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#2A6AAA' }}>รับทราบแล้ว</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => openAdjustModal(item)}
                                                style={{
                                                    padding: '4px 10px', borderRadius: '6px', fontFamily: 'Kanit', fontSize: '11px',
                                                    border: '1px solid #7c3aed', backgroundColor: '#f5f3ff', color: '#7c3aed',
                                                    cursor: 'pointer', transition: 'all 0.15s', fontWeight: 600,
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#7c3aed'; e.currentTarget.style.color = 'white' }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f5f3ff'; e.currentTarget.style.color = '#7c3aed' }}
                                            >
                                                สาเหตุที่ขอ
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                            <tr>
                                <td colSpan={5} style={{ padding: '10px 12px', fontFamily: 'Kanit_B', fontSize: '13px', color: '#1e293b' }}>
                                    รวม {filteredData.length} รายการ
                                </td>
                                <td style={{ padding: '10px 12px', fontFamily: 'Kanit_B', fontSize: '12px', color: '#1e293b', textAlign: 'center' }}>
                                    {filteredData.reduce((s, d) => s + d.balance, 0).toLocaleString('th-TH')}
                                </td>
                                <td colSpan={4}></td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>

            {/* Adjust Stock Modal */}
            {adjustModalItem && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
                }} onClick={() => !savingAdjust && setAdjustModalItem(null)}>
                    <div style={{
                        background: 'white', borderRadius: '12px', width: '520px', maxWidth: '94vw',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
                    }} onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                            color: 'white', padding: '14px 20px', fontFamily: 'Kanit_B', fontSize: '15px',
                            display: 'flex', alignItems: 'center', gap: '8px',
                        }}>
                            📋 ปรับยอดสินค้า
                        </div>

                        {/* Product Info */}
                        <div style={{
                            padding: '12px 20px', backgroundColor: '#faf5ff', borderBottom: '1px solid #e9d5ff',
                            fontFamily: 'Kanit', fontSize: '13px',
                        }}>
                            <div style={{ color: '#6d28d9', fontWeight: 600 }}>{adjustModalItem.itemcode} - {adjustModalItem.itemName}</div>
                            {adjustModalItem.namevender && (
                                <div style={{ color: '#6d28d9', fontSize: '12px', marginTop: '2px' }}>บริษัท: {adjustModalItem.namevender}</div>
                            )}
                            <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>
                                Lot: {adjustModalItem.lot} | คงเหลือ: {adjustModalItem.balance} | หมดอายุ: {formatDate(adjustModalItem.dateExp)}
                            </div>
                        </div>

                        {/* Form */}
                        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px', alignItems: 'center' }}>
                            {/* 1. สาเหตุที่ขอ */}
                            <label style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#475569', fontWeight: 500 }}>สาเหตุที่ขอ</label>
                            <select
                                value={adjustReason}
                                onChange={(e) => setAdjustReason(e.target.value)}
                                style={{
                                    fontFamily: 'Kanit', fontSize: '13px', padding: '8px 12px',
                                    borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none',
                                    cursor: 'pointer', backgroundColor: 'white',
                                }}
                            >
                                {adjustReasons.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>

                            {/* 2. วันที่ขอเปลี่ยนคืน */}
                            <label style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#475569', fontWeight: 500 }}>วันที่ขอเปลี่ยนคืน</label>
                            <input
                                type="date"
                                value={adjustDate}
                                onChange={(e) => setAdjustDate(e.target.value)}
                                style={{
                                    fontFamily: 'Kanit', fontSize: '13px', padding: '8px 12px',
                                    borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none',
                                }}
                            />

                            {/* 3. ชื่อผู้รับคืน/รายละเอียด */}
                            <label style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#475569', fontWeight: 500, alignSelf: 'start', paddingTop: '8px' }}>
                                {adjustReason === 'ทำลายยา ที่หมดอายุ' ? 'รายละเอียดการทำลายยา' : 'ชื่อผู้รับคืน / รายละเอียด'}
                            </label>
                            <input
                                type="text"
                                value={adjustReceiverDetail}
                                onChange={(e) => setAdjustReceiverDetail(e.target.value)}
                                placeholder={adjustReason === 'ทำลายยา ที่หมดอายุ' ? 'ระบุรายละเอียดการทำลายยา...' : 'ระบุชื่อผู้รับคืน / รายละเอียด...'}
                                style={{
                                    fontFamily: 'Kanit', fontSize: '13px', padding: '8px 12px',
                                    borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none',
                                }}
                            />

                            {/* 4. ลายมือชื่อผู้มีหน้าที่ปฏิบัติการ */}
                            <label style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#475569', fontWeight: 500 }}>ผู้มีหน้าที่ปฏิบัติการ</label>
                            <select
                                value={adjustOperator}
                                onChange={(e) => setAdjustOperator(e.target.value)}
                                style={{
                                    fontFamily: 'Kanit', fontSize: '13px', padding: '8px 12px',
                                    borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none',
                                    cursor: 'pointer', backgroundColor: 'white',
                                }}
                            >
                                <option value="">-- เลือกพนักงาน --</option>
                                {employeeList.map((emp: any) => (
                                    <option key={emp.id} value={emp.name || ''}>{emp.name || '-'}</option>
                                ))}
                            </select>
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '12px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc',
                            display: 'flex', justifyContent: 'flex-end', gap: '8px',
                        }}>
                            <button
                                onClick={() => setAdjustModalItem(null)}
                                disabled={savingAdjust}
                                style={{
                                    padding: '8px 20px', borderRadius: '8px', fontFamily: 'Kanit', fontSize: '13px',
                                    border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b',
                                    cursor: 'pointer', fontWeight: 500,
                                }}
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleAdjustStock}
                                disabled={savingAdjust}
                                style={{
                                    padding: '8px 20px', borderRadius: '8px', fontFamily: 'Kanit', fontSize: '13px',
                                    border: 'none', background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                                    color: 'white', cursor: 'pointer', fontWeight: 600,
                                    boxShadow: '0 2px 6px rgba(124,58,237,0.3)',
                                }}
                            >
                                {savingAdjust ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Modal - A4 Landscape */}
            {showReport && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001,
                }} onClick={() => setShowReport(false)}>
                    <div style={{
                        background: 'white', borderRadius: '10px', width: '1150px', maxWidth: '96vw',
                        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 25px 80px rgba(0,0,0,0.3)', overflow: 'hidden',
                    }} onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header with filters */}
                        <div style={{
                            padding: '12px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc',
                            display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
                        }}>
                            <span style={{ fontFamily: 'Kanit_B', fontSize: '14px', color: '#1e293b' }}>📋 รายงานบันทึกรายการสินค้าเปลี่ยนคืน/ทำลาย</span>
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <label style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#64748b' }}>สาเหตุ:</label>
                                <select value={reportReasonFilter} onChange={(e) => setReportReasonFilter(e.target.value)}
                                    style={{ fontFamily: 'Kanit', fontSize: '12px', padding: '5px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    <option value="all">ทั้งหมด</option>
                                    <option value="ส่งคืนบริษัท">ส่งคืนบริษัท</option>
                                    <option value="ทำลายยา ที่หมดอายุ">ทำลายยา ที่หมดอายุ</option>
                                    <option value="แจ้งเปลี่ยนสินค้า">แจ้งเปลี่ยนสินค้า</option>
                                </select>
                                <label style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#64748b' }}>วันหมดอายุ:</label>
                                <input type="date" value={reportDateFrom} onChange={(e) => setReportDateFrom(e.target.value)}
                                    style={{ fontFamily: 'Kanit', fontSize: '12px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                                <span style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#94a3b8' }}>ถึง</span>
                                <input type="date" value={reportDateTo} onChange={(e) => setReportDateTo(e.target.value)}
                                    style={{ fontFamily: 'Kanit', fontSize: '12px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                                <button onClick={() => handlePrintReport()} style={{
                                    padding: '5px 14px', borderRadius: '6px', fontFamily: 'Kanit', fontSize: '12px',
                                    border: 'none', background: '#1e293b', color: 'white', cursor: 'pointer',
                                }}>🖨️ พิมพ์</button>
                                <button onClick={() => setShowReport(false)} style={{
                                    padding: '5px 14px', borderRadius: '6px', fontFamily: 'Kanit', fontSize: '12px',
                                    border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer',
                                }}>✕ ปิด</button>
                            </div>
                        </div>

                        {/* Printable A4 Area */}
                        <div style={{ overflow: 'auto', flex: 1, padding: '16px', backgroundColor: '#e5e7eb' }}>
                            <div ref={reportPrintRef} style={{
                                width: '297mm', minHeight: '210mm', margin: '0 auto',
                                backgroundColor: 'white', padding: '15mm 12mm',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                                fontFamily: 'Kanit',
                            }}>
                                {/* Report Title */}
                                <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                                    <div style={{ fontFamily: 'Kanit_B', fontSize: '16px', color: '#1e293b' }}>
                                        แบบบันทึกรายการสินค้าเปลี่ยนคืนผู้จัดจำหน่าย/ทำลาย
                                    </div>
                                </div>

                                {/* Store Info */}
                                <div style={{ textAlign: 'center', marginBottom: '12px', fontSize: '14px' }}>
                                    <div style={{ fontWeight: 600 }}>ร้าน {storeName || getLocalStorageItem('cp_') || '_______________'}</div>
                                    {storeAddress && <div style={{ fontSize: '13px', marginTop: '2px' }}>{storeAddress}</div>}
                                </div>

                                {/* Table */}
                                {reportLoading ? (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '13px' }}>กำลังโหลดข้อมูล...</div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f1f5f9' }}>
                                                {[
                                                    { label: 'ลำดับ', width: '35px' },
                                                    { label: 'วัน เดือน ปี ที่ขอ\nเปลี่ยน/คืน/ทำลาย', width: '90px' },
                                                    { label: 'รายการสินค้าที่เปลี่ยน/คืน/ทำลาย\n(ชื่อสินค้า/ความแรง)', width: '' },
                                                    { label: 'จำนวน\n(หน่วย)', width: '65px' },
                                                    { label: 'ครั้งที่ผลิต\n(Lot.)', width: '80px' },
                                                    { label: 'วันหมดอายุ', width: '85px' },
                                                    { label: 'สาเหตุที่ขอ\nเปลี่ยนคืน/ทำลาย', width: '120px' },
                                                    { label: 'ชื่อผู้รับคืน/รายละเอียด\nการทำลายสินค้า', width: '140px' },
                                                    { label: 'ลายมือชื่อ\nผู้มีหน้าที่ปฏิบัติการ', width: '120px' },
                                                ].map((h, i) => (
                                                    <th key={i} style={{
                                                        padding: '6px 5px', border: '1px solid #94a3b8',
                                                        fontFamily: 'Kanit', fontSize: '10px', fontWeight: 600,
                                                        color: '#334155', textAlign: 'center', lineHeight: '1.4',
                                                        whiteSpace: 'pre-line', width: h.width || 'auto',
                                                        verticalAlign: 'middle',
                                                    }}>{h.label}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredReportData.length === 0 ? (
                                                <tr>
                                                    <td colSpan={9} style={{
                                                        padding: '30px', textAlign: 'center', border: '1px solid #cbd5e1',
                                                        color: '#94a3b8', fontSize: '12px',
                                                    }}>ไม่พบข้อมูลรายการที่บันทึก</td>
                                                </tr>
                                            ) : (
                                                filteredReportData.map((item: any, idx: number) => (
                                                    <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fafbfc' }}>
                                                        <td style={{ padding: '5px 4px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '10px' }}>{idx + 1}</td>
                                                        <td style={{ padding: '5px 4px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '10px' }}>
                                                            {item.dateRC ? formatDate(item.dateRC) : '-'}
                                                        </td>
                                                        <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', fontSize: '10px' }}>
                                                            <div style={{ fontWeight: 600 }}>{item.itemName || '-'}</div>
                                                            {item.namevender && <div style={{ fontSize: '9px', color: '#64748b' }}>{item.namevender}</div>}
                                                        </td>
                                                        <td style={{ padding: '5px 4px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '10px' }}>
                                                            {item.qty || '-'} {item.unit || ''}
                                                        </td>
                                                        <td style={{ padding: '5px 4px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '10px' }}>{item.lot || '-'}</td>
                                                        <td style={{ padding: '5px 4px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '10px' }}>{item.dateExp ? formatDate(item.dateExp) : '-'}</td>
                                                        <td style={{ padding: '5px 4px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '10px' }}>{item.statuss || '-'}</td>
                                                        <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', fontSize: '10px' }}>{item.maker || '-'}</td>
                                                        <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '10px' }}>{item.person || '-'}</td>
                                                    </tr>
                                                ))
                                            )}
                                            {/* Empty rows for manual use */}
                                            {filteredReportData.length > 0 && filteredReportData.length < 15 && (
                                                Array.from({ length: Math.max(0, 15 - filteredReportData.length) }).map((_, i) => (
                                                    <tr key={`empty-${i}`}>
                                                        {Array.from({ length: 9 }).map((_, j) => (
                                                            <td key={j} style={{ padding: '10px 4px', border: '1px solid #cbd5e1' }}>&nbsp;</td>
                                                        ))}
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                )}

                                {/* Footer summary */}
                                {!reportLoading && filteredReportData.length > 0 && (
                                    <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
                                        รวมทั้งสิ้น {filteredReportData.length} รายการ
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
