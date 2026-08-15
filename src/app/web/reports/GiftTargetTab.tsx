'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Gift, Target, TrendingUp, Calendar, DollarSign, Receipt, Wallet, BarChart3, BarChart, Settings, ChevronRight, Award, ShoppingCart } from 'lucide-react'
import { Button } from "@/components/ui/button"

import { getLocalStorageItem } from '@/utils/localStorage';

export default function GiftTargetTab() {
    const [loading, setLoading] = useState(false)
    const [salepl, setsalepl] = useState<any[]>([])
    const [countday, setcountday] = useState(0)

    // State for month/year selection
    const today = new Date()
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(today.getFullYear())
    const [showMonthPicker, setShowMonthPicker] = useState(false)
    const [showSettings, setShowSettings] = useState(false)

    // State for employee filter
    const [employeeList, setEmployeeList] = useState<any[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState("")

    // Thai month names
    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ]
    const availableYears = Array.from({ length: 6 }, (_, i) => today.getFullYear() - 5 + i)

    // Settings state
    const [settings, setSettings] = useState({
        targetMonthly: 300000,
        targetMonthlyBonus: 1000,
        targetDaysOver: 13,
        targetDaysOverBonus: 750,
        targetAmountOver: 10000,
        targetAmountOverBonus: 0,
        targetDaily: 12000,
        targetDailyBonus: 80,
        pickupFeeRate: 100,
        pickupFeeBonus: 0,
        salesPerBillTarget: 120,
        salesPerBillBonus: 20,
        enableTargetMonthly: true,
        enableTargetDaysOver: true,
        enableTargetDaily: true,
        enablePickupFee: true,
        enableSalesPerBill: true,
    })

    // Fetch incentive settings
    const fetchSettings = async () => {
        const companyS = getLocalStorageItem("company_") || ""
        try {
            const res = await axios.get(`/api/mobile/insentive?company=${companyS}`)
            if (res.data) {
                setSettings({
                    targetMonthly: res.data.targetMonthly || 300000,
                    targetMonthlyBonus: res.data.targetMonthlyBonus || 1000,
                    targetDaysOver: res.data.targetDaysOver || 13,
                    targetDaysOverBonus: res.data.targetDaysOverBonus || 750,
                    targetAmountOver: res.data.targetAmountOver || 10000,
                    targetAmountOverBonus: res.data.targetAmountOverBonus || 0,
                    targetDaily: res.data.targetDaily || 12000,
                    targetDailyBonus: res.data.targetDailyBonus || 80,
                    pickupFeeRate: res.data.pickupFeeRate || 100,
                    pickupFeeBonus: res.data.pickupFeeBonus || 0,
                    salesPerBillTarget: res.data.salesPerBillTarget || 120,
                    salesPerBillBonus: res.data.salesPerBillBonus || 20,
                    enableTargetMonthly: res.data.enableTargetMonthly ?? true,
                    enableTargetDaysOver: res.data.enableTargetDaysOver ?? true,
                    enableTargetDaily: res.data.enableTargetDaily ?? true,
                    enablePickupFee: res.data.enablePickupFee ?? true,
                    enableSalesPerBill: res.data.enableSalesPerBill ?? true,
                })
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error)
        }
    }

    const fetchEmployees = async () => {
        const id_company = localStorage.getItem("company_")
        if (!id_company) return
        try {
            const res = await axios.get(`/api/setting/employee?id_company=${id_company}`)
            setEmployeeList(res.data || [])
        } catch (error) {
            console.error("Failed to fetch employees:", error)
        }
    }

    // Fetch sales data
    const fetchData = async () => {
        setLoading(true)
        const companyS = getLocalStorageItem("company_") || ""
        try {
            const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`
            let url = `/api/pl/summary?company=${companyS}&createDate=${monthStr}&v=${new Date().getTime()}`
            if (selectedEmployee) {
                url += `&name=${selectedEmployee}`
            }
            const res = await axios.get(url)
            setsalepl(res.data ?? [])
            setcountday(res.data.length ?? 0)
        } catch (error) {
            console.error("Error fetching data:", error)
            setsalepl([])
        }
        setLoading(false)
    }

    // Save setting
    const saveSetting = async (key: string, value: number | boolean) => {
        const companyS = getLocalStorageItem("company_") || ""
        try {
            await axios.put(`/api/mobile/insentive`, { company: companyS, [key]: value })
            setSettings(prev => ({ ...prev, [key]: value }))
        } catch (error) {
            console.error("Failed to save setting:", error)
        }
    }

    useEffect(() => {
        fetchSettings()
        fetchEmployees()
    }, [])

    useEffect(() => {
        fetchData()
    }, [selectedMonth, selectedYear])

    // Separate useEffect for employee filter change
    useEffect(() => {
        if (selectedEmployee !== "") {
            fetchData()
        }
    }, [selectedEmployee])

    // Calculations
    const monthlyTotal = salepl.reduce((a, b) => a + (Number(b.sale) || 0), 0)
    const progressPercent = Math.min((monthlyTotal / settings.targetMonthly) * 100, 100)
    const daysOverTarget = salepl.filter(d => Number(d.sale || 0) >= settings.targetAmountOver).length
    const daysMetSalesPerBill = salepl.filter(d => {
        if (!d.hasCheckin) return false
        const salePerBill = Number(d.bill) > 0 ? Number(d.sale || 0) / Number(d.bill) : 0
        return salePerBill >= settings.salesPerBillTarget
    }).length
    const daysMetDailyTarget = salepl.filter(d => {
        if (!d.hasCheckin) return false
        return Number(d.sale || 0) >= settings.targetDaily
    }).length
    const pickupFeeTotal = salepl.reduce((a, b) => a + (Number(b.gifts) || 0), 0)

    // Total bonus calculation (only counts groups where calculation is enabled)
    const totalBonus =
        (settings.enableTargetMonthly && monthlyTotal >= settings.targetMonthly ? settings.targetMonthlyBonus : 0) +
        (settings.enableTargetDaysOver && daysOverTarget >= settings.targetDaysOver ? settings.targetDaysOverBonus : 0) +
        (settings.enableSalesPerBill ? daysMetSalesPerBill * settings.salesPerBillBonus : 0) +
        (settings.enablePickupFee ? pickupFeeTotal : 0) +
        (settings.enableTargetDaily ? daysMetDailyTarget * settings.targetDailyBonus : 0)

    const formattedDate = `${thaiMonths[selectedMonth - 1]} ${selectedYear + 543}`

    // Stat Card Component
    const StatCard = ({ icon: Icon, title, value, subValue, target, bonus, bgColor, accentColor, met, enabled = true }: any) => (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '10px 14px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(124, 58, 237, 0.04)',
            border: '1px solid #f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            minHeight: '120px',
            opacity: enabled ? 1 : 0.5,
            filter: enabled ? 'none' : 'grayscale(0.6)',
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '6px',
                height: '100%',
                backgroundColor: accentColor,
                opacity: 0.6,
            }} />
            {!enabled && (
                <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    fontFamily: 'Kanit_B',
                    fontSize: '10px',
                    color: '#94a3b8',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '1px 6px',
                }}>
                    ปิดใช้งาน
                </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    backgroundColor: bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Icon size={14} style={{ color: accentColor }} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Kanit_B', fontSize: '13px', color: '#1e293b', lineHeight: 1.2 }}>{title}</div>
                    {target && <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#64748b', fontWeight: 500 }}>{target}</div>}
                </div>
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <div style={{ fontFamily: 'Kanit_B', fontSize: '20px', color: '#1e293b' }}>
                        {value}
                    </div>
                    {subValue && <div style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{subValue}</div>}
                </div>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '6px',
                borderTop: '1px solid #f8fafc',
                marginTop: 'auto'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                }}>
                    <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: met ? '#1F9D6B' : '#ef4444'
                    }} />
                    <span style={{
                        fontFamily: 'Kanit_B',
                        fontSize: '12px',
                        color: met ? '#147F56' : '#dc2626',
                    }}>
                        {met ? 'ถึงเป้า' : 'ยังไม่ถึง'}
                    </span>
                </div>
                <div style={{
                    fontFamily: 'Kanit_B',
                    fontSize: '14px',
                    color: accentColor,
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${accentColor}20`,
                    backgroundColor: `${accentColor}05`,
                }}>
                    {bonus}
                </div>
            </div>
        </div>
    )

    // Settings Row Component
    const SettingsRow = ({ label, value, unit, field, icon: Icon, color }: any) => {
        const [localValue, setLocalValue] = useState(value)
        const [saved, setSaved] = useState(false)

        useEffect(() => { setLocalValue(value) }, [value])

        const handleSave = async () => {
            await saveSetting(field, localValue)
            setSaved(true)
            setTimeout(() => setSaved(false), 1500)
        }

        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: 'white',
                borderRadius: '10px',
                marginBottom: '8px',
                border: '1px solid #e2e8f0',
            }}>
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: `${color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Icon size={18} style={{ color }} />
                </div>
                <div style={{ flex: 1, fontFamily: 'Kanit', fontSize: '13px', color: '#334155' }}>{label}</div>
                <input
                    type="number"
                    value={localValue}
                    onChange={(e) => setLocalValue(Number(e.target.value))}
                    style={{
                        width: '100px',
                        padding: '8px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontFamily: 'Kanit',
                        fontSize: '13px',
                        textAlign: 'center',
                    }}
                />
                <span style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#94a3b8', width: '40px' }}>{unit}</span>
                <Button
                    size="sm"
                    onClick={handleSave}
                    style={{
                        backgroundColor: saved ? '#3E86C7' : color,
                        color: 'white',
                        fontFamily: 'Kanit',
                        fontSize: '11px',
                    }}
                >
                    {saved ? '✓' : 'บันทึก'}
                </Button>
            </div>
        )
    }

    // Settings Group Component - groups related rows under a "calculate this target?" toggle
    const SettingsGroup = ({ title, field, color, children }: any) => {
        const enabled = (settings as any)[field] as boolean
        const [toggling, setToggling] = useState(false)

        const handleToggle = async (checked: boolean) => {
            setToggling(true)
            await saveSetting(field, checked)
            setToggling(false)
        }

        return (
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                marginBottom: '12px',
                border: `1px solid ${enabled ? '#e2e8f0' : '#fecaca'}`,
                overflow: 'hidden',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: enabled ? `${color}10` : '#fef2f2',
                    borderBottom: '1px solid #f1f5f9',
                }}>
                    <span style={{ fontFamily: 'Kanit_B', fontSize: '12px', color: enabled ? color : '#94a3b8' }}>
                        {title}
                    </span>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: toggling ? 'wait' : 'pointer',
                        userSelect: 'none',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        backgroundColor: enabled ? '#F3F8FC' : '#f1f5f9',
                        border: `1px solid ${enabled ? '#CCDFF1' : '#e2e8f0'}`,
                    }}>
                        <input
                            type="checkbox"
                            checked={enabled}
                            disabled={toggling}
                            onChange={(e) => handleToggle(e.target.checked)}
                            style={{ accentColor: '#3E86C7', width: '14px', height: '14px', cursor: 'inherit' }}
                        />
                        <span style={{
                            fontFamily: 'Kanit_B',
                            fontSize: '11px',
                            color: enabled ? '#2A6AAA' : '#94a3b8',
                        }}>
                            {enabled ? 'คำนวณเป้านี้' : 'ไม่คำนวณ'}
                        </span>
                    </label>
                </div>
                <div style={{ padding: '10px', opacity: enabled ? 1 : 0.5, pointerEvents: enabled ? 'auto' : 'none' }}>
                    {children}
                </div>
            </div>
        )
    }

    return (
        <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '24px',
            boxShadow: '0 8px 30px rgba(124, 58, 237, 0.04)',
            border: '1px solid #f1f5f9',
            overflow: 'visible',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                background: '#fdf2f8',
                borderBottom: '2px solid #ec4899',
                color: '#be185d',
                padding: '8px 20px',
                fontFamily: 'Kanit_B',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: '#fce7f3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Gift size={18} style={{ color: '#ec4899' }} />
                    </div>
                    <span>รายงานโบนัสและค่าหยิบ</span>
                </div>
                {typeof window !== 'undefined' && getLocalStorageItem('level_') === 'level2' && (
                    <Button
                        size="sm"
                        onClick={() => setShowSettings(!showSettings)}
                        style={{
                            backgroundColor: '#64748b',
                            color: 'white',
                            fontFamily: 'Kanit_B',
                            fontSize: '13px',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            height: 'auto',
                            borderRadius: '10px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Settings size={16} /> ตั้งค่าเป้าหมาย
                    </Button>
                )}
            </div>

            {/* Month Selector */}
            <div style={{
                padding: '6px 20px',
                backgroundColor: 'white',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
            }}>
                <div
                    onClick={() => setShowMonthPicker(!showMonthPicker)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 16px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontFamily: 'Kanit_B',
                        fontSize: '13px',
                        color: '#475569',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <Calendar size={16} />
                    <span>{formattedDate}</span>
                    <ChevronRight size={16} style={{ opacity: 0.5 }} />
                </div>

                {/* Employee Dropdown */}
                <div style={{ position: 'relative' }}>
                    <select
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        style={{
                            padding: '6px 14px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #f1f5f9',
                            borderRadius: '8px',
                            fontFamily: 'Kanit',
                            fontSize: '13px',
                            color: '#475569',
                            cursor: 'pointer',
                            outline: 'none',
                            height: '34px',
                            minWidth: '200px',
                            appearance: 'none',
                            backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 12px center',
                            backgroundSize: '16px',
                        }}
                    >
                        <option value="">กรุณาเลือกชื่อพนักงาน</option>
                        {employeeList.map((emp) => (
                            <option key={emp.id} value={emp.name}>{emp.name}</option>
                        ))}
                    </select>
                </div>

                <Button
                    onClick={fetchData}
                    disabled={loading}
                    size="sm"
                    style={{
                        backgroundColor: '#2A6AAA',
                        color: 'white',
                        fontFamily: 'Kanit_B',
                        fontSize: '15px',
                        borderRadius: '12px',
                        padding: '0 28px',
                        height: '48px',
                        border: 'none',
                        boxShadow: '0 4px 6px rgba(42, 106, 170, 0.2)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {loading ? 'กำลังโหลด...' : 'ดึงข้อมูล'}
                </Button>
            </div>

            {/* Month Picker Dropdown */}
            {showMonthPicker && (
                <div style={{
                    position: 'absolute',
                    top: '140px',
                    left: '20px',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    padding: '20px',
                    zIndex: 100,
                    width: '340px',
                }}>
                    <div style={{ fontFamily: 'Kanit_B', fontSize: '14px', color: '#1e293b', marginBottom: '16px' }}>
                        เลือกเดือน/ปี
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>ปี</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {availableYears.map((year) => (
                                <button
                                    key={year}
                                    onClick={() => setSelectedYear(year)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: selectedYear === year ? '2px solid #9333ea' : '1px solid #e2e8f0',
                                        backgroundColor: selectedYear === year ? '#f3e8ff' : 'white',
                                        color: selectedYear === year ? '#9333ea' : '#334155',
                                        fontFamily: 'Kanit',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {year + 543}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>เดือน</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                            {thaiMonths.map((month, index) => (
                                <button
                                    key={index}
                                    onClick={() => { setSelectedMonth(index + 1); setShowMonthPicker(false) }}
                                    style={{
                                        padding: '8px 6px',
                                        borderRadius: '6px',
                                        border: selectedMonth === index + 1 ? '2px solid #9333ea' : '1px solid #e2e8f0',
                                        backgroundColor: selectedMonth === index + 1 ? '#f3e8ff' : 'white',
                                        color: selectedMonth === index + 1 ? '#9333ea' : '#334155',
                                        fontFamily: 'Kanit',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {month.slice(0, 3)}.
                                </button>
                            ))}
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowMonthPicker(false)}
                        style={{
                            width: '100%',
                            backgroundColor: '#9333ea',
                            color: 'white',
                            fontFamily: 'Kanit',
                            fontSize: '12px',
                        }}
                    >
                        ปิด
                    </Button>
                </div>
            )}

            {/* Content Area */}
            <div style={{ flex: 1, display: 'flex' }}>
                {/* Main Content */}
                <div style={{ flex: 1, padding: '10px 20px' }}>
                    {/* Total Bonus Card */}
                    {/* Total Bonus Card Redesign */}
                    <div style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)',
                        borderRadius: '16px',
                        padding: '12px',
                        marginBottom: '12px',
                        border: '1px solid #ede9fe',
                        boxShadow: '0 10px 30px rgba(124, 58, 237, 0.08)',
                    }}>

                        {/* Total Bonus Summary Row */}
                        <div style={{
                            padding: '10px 20px',
                            backgroundColor: '#f5f3ff',
                            borderRadius: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            border: '1px dashed #c4b5fd',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    backgroundColor: '#ede9fe',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Award size={22} style={{ color: '#7c3aed' }} />
                                </div>
                                <div>
                                    <div style={{ fontFamily: 'Kanit_B', fontSize: '16px', color: '#4c1d95' }}>รายได้โบนัสรวมทั้งหมด</div>
                                    <div style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#7c3aed' }}>คำนวณจากทุกรายการเงื่อนไขเป้าหมาย</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontFamily: 'Kanit_B', fontSize: '36px', color: '#7c3aed' }}>฿{totalBonus.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '12px' }}>
                        <StatCard
                            icon={Target}
                            title="เป้าเดือน"
                            target={`฿${settings.targetMonthly.toLocaleString()}`}
                            value={`฿${(settings.enableTargetMonthly && monthlyTotal >= settings.targetMonthly ? settings.targetMonthlyBonus : 0).toLocaleString()}`}
                            subValue={`${((monthlyTotal / settings.targetMonthly) * 100).toFixed(1)}%`}
                            bgColor="#f3e8ff"
                            accentColor="#9333ea"
                            met={monthlyTotal >= settings.targetMonthly}
                            bonus={`฿${monthlyTotal.toLocaleString()}`}
                            enabled={settings.enableTargetMonthly}
                        />
                        <StatCard
                            icon={Calendar}
                            title="วันเกินเป้า"
                            target={`${settings.targetDaysOver} วัน ≥ ฿${settings.targetAmountOver.toLocaleString()}`}
                            value={`฿${(settings.enableTargetDaysOver && daysOverTarget >= settings.targetDaysOver ? settings.targetDaysOverBonus : 0).toLocaleString()}`}
                            subValue={`เป้า: ${settings.targetDaysOver} วัน`}
                            bgColor="#E5EEF8"
                            accentColor="#3E86C7"
                            met={daysOverTarget >= settings.targetDaysOver}
                            bonus={`${daysOverTarget} วัน`}
                            enabled={settings.enableTargetDaysOver}
                        />
                        <StatCard
                            icon={Receipt}
                            title="ยอดขาย/บิล"
                            target={`≥ ฿${settings.salesPerBillTarget.toLocaleString()}/บิล`}
                            value={`฿${(settings.enableSalesPerBill ? daysMetSalesPerBill * settings.salesPerBillBonus : 0).toLocaleString()}`}
                            subValue={`฿${settings.salesPerBillBonus}/บิล`}
                            bgColor="#E5EEF8"
                            accentColor="#3E86C7"
                            met={daysMetSalesPerBill > 0}
                            bonus={`${daysMetSalesPerBill} วัน`}
                            enabled={settings.enableSalesPerBill}
                        />
                        <StatCard
                            icon={Wallet}
                            title="ค่าหยิบรวม"
                            target={`${settings.pickupFeeRate}%`}
                            value={`฿${(settings.enablePickupFee ? pickupFeeTotal : 0).toLocaleString()}`}
                            subValue={`${countday} วัน`}
                            bgColor="#fef3c7"
                            accentColor="#f59e0b"
                            met={true}
                            bonus={`฿${pickupFeeTotal.toLocaleString()}`}
                            enabled={settings.enablePickupFee}
                        />
                        <StatCard
                            icon={BarChart3}
                            title="เป้ารายวัน"
                            target={`≥ ฿${settings.targetDaily.toLocaleString()}/วัน`}
                            value={`฿${(settings.enableTargetDaily ? daysMetDailyTarget * settings.targetDailyBonus : 0).toLocaleString()}`}
                            subValue={`฿${settings.targetDailyBonus}/วัน`}
                            bgColor="#fce7f3"
                            accentColor="#ec4899"
                            met={daysMetDailyTarget > 0}
                            bonus={`${daysMetDailyTarget} วัน`}
                            enabled={settings.enableTargetDaily}
                        />
                    </div>

                    {/* Daily Table Redesign */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '14px',
                        border: '1px solid #f1f5f9',
                        overflow: 'hidden',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                    }}>
                        <div style={{
                            padding: '10px 16px',
                            backgroundColor: 'white',
                            borderBottom: '1px solid #f1f5f9',
                            fontFamily: 'Kanit_B',
                            fontSize: '14px',
                            color: '#1e293b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <span style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '6px',
                                backgroundColor: '#F3F8FC',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #E5EEF8'
                            }}>
                                <BarChart size={14} style={{ color: '#3E86C7' }} />
                            </span>
                            รายละเอียดรายวัน ({salepl.length} วัน)
                        </div>
                        <div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Kanit', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                                        <th style={{ padding: '10px 10px', textAlign: 'center', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>วันที่</th>
                                        <th style={{ padding: '10px 10px', textAlign: 'right', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>ยอดขาย (฿)</th>
                                        <th style={{ padding: '10px 10px', textAlign: 'right', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>บิล</th>
                                        <th style={{ padding: '10px 10px', textAlign: 'right', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>ขาย/บิล</th>
                                        <th style={{ padding: '10px 10px', textAlign: 'right', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>ค่าหยิบ</th>
                                        <th style={{ padding: '10px 10px', textAlign: 'center', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>เข้างาน</th>
                                        <th style={{ padding: '10px 10px', textAlign: 'center', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salepl.map((day, index) => {
                                        // ขาย/บิล มาจาก API (filtered by employee)
                                        const salePerBill = Number(day.salePerBill) || 0
                                        const metDaily = Number(day.sale || 0) >= settings.targetDaily
                                        const metPerBill = salePerBill >= settings.salesPerBillTarget
                                        return (
                                            <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '8px', textAlign: 'center', color: '#334155' }}>{day.date}</td>
                                                <td style={{ padding: '8px', textAlign: 'right', color: Number(day.sale || 0) >= settings.targetAmountOver ? '#2A6AAA' : '#334155', fontWeight: 600 }}>
                                                    ฿{Number(day.sale || 0).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '8px', textAlign: 'right', color: '#334155' }}>{day.bill || 0}</td>
                                                <td style={{ padding: '8px', textAlign: 'right', color: metPerBill ? '#2A6AAA' : '#334155', fontWeight: 500 }}>
                                                    ฿{salePerBill.toFixed(0)}
                                                </td>
                                                <td style={{ padding: '8px', textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>
                                                    ฿{Number(day.gifts || 0).toLocaleString()}
                                                </td>

                                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                                    {day.hasCheckin ? (
                                                        <span style={{ color: '#2A6AAA', fontSize: '18px', fontWeight: 'bold' }}>✓</span>
                                                    ) : (
                                                        <span style={{ color: '#dc2626', fontSize: '18px', fontWeight: 'bold' }}>-</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                                    {metDaily && day.hasCheckin ? (
                                                        <span style={{ backgroundColor: '#E5EEF8', color: '#2A6AAA', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>ถึงเป้า</span>
                                                    ) : (
                                                        <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>ไม่ถึง</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <div style={{
                        width: '380px',
                        borderLeft: '1px solid #e2e8f0',
                        backgroundColor: '#f8fafc',
                        overflowY: 'auto',
                        padding: '20px',
                    }}>
                        <div style={{
                            fontFamily: 'Kanit_B',
                            fontSize: '16px',
                            color: '#1e293b',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <Settings size={18} /> ตั้งค่าเป้าหมาย
                        </div>

                        <SettingsGroup title="🎯 เป้ายอดขายประจำเดือน" field="enableTargetMonthly" color="#9333ea">
                            <SettingsRow label="เป้ายอดขายประจำเดือน" value={settings.targetMonthly} unit="บาท" field="targetMonthly" icon={Target} color="#9333ea" />
                            <SettingsRow label="โบนัสถึงเป้าเดือน" value={settings.targetMonthlyBonus} unit="บาท" field="targetMonthlyBonus" icon={Award} color="#9333ea" />
                        </SettingsGroup>

                        <SettingsGroup title="📅 วันเกินเป้า" field="enableTargetDaysOver" color="#3E86C7">
                            <SettingsRow label="จำนวนวันเกินเป้า" value={settings.targetDaysOver} unit="วัน" field="targetDaysOver" icon={Calendar} color="#3E86C7" />
                            <SettingsRow label="โบนัสวันเกินเป้า" value={settings.targetDaysOverBonus} unit="บาท" field="targetDaysOverBonus" icon={Award} color="#3E86C7" />
                            <SettingsRow label="ยอดเงินเกินเป้า (ต่อวัน)" value={settings.targetAmountOver} unit="บาท" field="targetAmountOver" icon={TrendingUp} color="#3E86C7" />
                        </SettingsGroup>

                        <SettingsGroup title="📊 เป้ายอดขายประจำวัน" field="enableTargetDaily" color="#f59e0b">
                            <SettingsRow label="เป้ายอดขายประจำวัน" value={settings.targetDaily} unit="บาท" field="targetDaily" icon={BarChart3} color="#f59e0b" />
                            <SettingsRow label="โบนัสถึงเป้ารายวัน" value={settings.targetDailyBonus} unit="บาท" field="targetDailyBonus" icon={Award} color="#f59e0b" />
                        </SettingsGroup>

                        <SettingsGroup title="💊 ค่าหยิบสินค้า" field="enablePickupFee" color="#ec4899">
                            <SettingsRow label="ค่าหยิบสินค้า (%)" value={settings.pickupFeeRate} unit="%" field="pickupFeeRate" icon={Wallet} color="#ec4899" />
                        </SettingsGroup>

                        <SettingsGroup title="🧾 ยอดขาย/บิล" field="enableSalesPerBill" color="#06b6d4">
                            <SettingsRow label="เป้ายอดขาย/บิล" value={settings.salesPerBillTarget} unit="บาท" field="salesPerBillTarget" icon={Receipt} color="#06b6d4" />
                            <SettingsRow label="โบนัสยอดขาย/บิล" value={settings.salesPerBillBonus} unit="บาท" field="salesPerBillBonus" icon={Award} color="#06b6d4" />
                        </SettingsGroup>

                        <div style={{
                            marginTop: '16px',
                            padding: '12px',
                            backgroundColor: '#f3e8ff',
                            borderRadius: '10px',
                            border: '1px solid #e9d5ff',
                        }}>
                            <div style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#7c3aed', fontWeight: 500 }}>💡 คำแนะนำ</div>
                            <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>
                                กดปุ่ม "บันทึก" เพื่อบันทึกค่าแต่ละรายการ
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
