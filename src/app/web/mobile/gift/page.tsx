
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useNavLevel } from '../useNavLevel'
import { jwtDecode } from 'jwt-decode';
import {
    Calendar,
    TrendingUp,
    Target,
    DollarSign,
    Receipt,
    ChevronRight,
    CalendarDays,
    Home,
    ShoppingCart,
    Box,
    ClipboardList,
    LogIn,
    LogOut,
    RefreshCw,
    Gift,
    Wallet,
    BarChart3,
    Award,
    Clock,
    Settings,
    MessageSquare,
    PackagePlus
} from "lucide-react";
import Modal_blt from 'react-bootstrap/Modal';

const apipl = "pl/pl"

// Mobile App Styles
const mobileStyles = `
  @font-face {
    font-family: 'Kanit';
    src: url('/fonts/Kanit-Regular.ttf') format('truetype');
    font-weight: 400;
    font-style: normal;
  }
  
  @font-face {
    font-family: 'Kanit';
    src: url('/fonts/Kanit-SemiBold.ttf') format('truetype');
    font-weight: 600;
    font-style: normal;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .mobile-app {
    font-family: 'Kanit', sans-serif;
    background: linear-gradient(180deg, #faf5ff 0%, #f8fafc 100%);
    min-height: 100vh;
    max-width: 100vw;
    overflow-x: hidden;
    padding-bottom: 100px;
  }

  /* Header */
  .mobile-header {
    background: linear-gradient(135deg, #9333ea 0%, #7c3aed 50%, #6366f1 100%);
    padding: 20px 20px 80px;
    border-radius: 0 0 32px 32px;
    position: relative;
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .page-title {
    color: white;
    font-size: 22px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .page-title-icon {
    width: 40px;
    height: 40px;
    background: rgba(255,255,255,0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-icon {
    width: 44px;
    height: 44px;
    background: rgba(255,255,255,0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
  }

  .logout-btn {
    width: 44px;
    height: 44px;
    background: rgba(239, 68, 68, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.4);
  }

  .header-actions {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  /* Date Selector */
  .date-selector {
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    color: white;
  }

  .date-selector-text {
    flex: 1;
    font-size: 14px;
  }

  /* Hero Card */
  .hero-card {
    background: white;
    border-radius: 20px;
    padding: 12px 16px;
    margin: -60px 16px 12px;
    box-shadow: 0 10px 40px rgba(147, 51, 234, 0.15);
    position: relative;
    z-index: 10;
  }

  .hero-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  }

  .hero-label {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 4px;
  }

  .hero-value {
    font-size: 26px;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .hero-unit {
    font-size: 16px;
    color: #9ca3af;
    font-weight: 400;
  }

  .hero-badge {
    background: linear-gradient(135deg, #E5EEF8 0%, #CCDFF1 100%);
    padding: 8px 16px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .hero-badge-text {
    font-size: 13px;
    font-weight: 600;
    color: #2A6AAA;
  }

  .hero-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
    margin: 16px 0;
  }

  .hero-stats-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }

  .hero-stat-item {
    flex: 1;
    text-align: center;
  }

  .hero-stat-value {
    font-size: 20px;
    font-weight: 600;
    color: #7c3aed;
  }

  .hero-stat-label {
    font-size: 12px;
    color: #9ca3af;
    margin-top: 2px;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 0 16px;
    margin-bottom: 20px;
  }

  .stat-card {
    background: white;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    border: 1px solid #f0f0f0;
    position: relative;
    overflow: hidden;
  }

  .stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--accent-color), var(--accent-color-light));
  }

  .stat-card.purple { --accent-color: #9333ea; --accent-color-light: #c084fc; }
  .stat-card.blue { --accent-color: #3E86C7; --accent-color-light: #A6C8E7; }
  .stat-card.green { --accent-color: #3E86C7; --accent-color-light: #A6C8E7; }
  .stat-card.orange { --accent-color: #f59e0b; --accent-color-light: #fcd34d; }

  .stat-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-icon.purple { background: #f3e8ff; color: #9333ea; }
  .stat-icon.blue { background: #E5EEF8; color: #3E86C7; }
  .stat-icon.green { background: #E5EEF8; color: #3E86C7; }
  .stat-icon.orange { background: #ffedd5; color: #f59e0b; }

  .stat-label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: #1f2937;
    margin-top: 4px;
  }

  .stat-unit {
    font-size: 12px;
    color: #9ca3af;
    font-weight: 400;
    margin-left: 4px;
  }

  /* Progress Section */
  .section {
    padding: 20px 16px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .progress-card {
    background: white;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    border: 1px solid #f0f0f0;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .progress-title {
    font-size: 14px;
    color: #6b7280;
  }

  .progress-percentage {
    font-size: 18px;
    font-weight: 600;
    color: #7c3aed;
  }

  .progress-bar-container {
    height: 12px;
    background: #f3e8ff;
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 12px;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #9333ea, #7c3aed);
    border-radius: 6px;
    transition: width 0.5s ease;
  }

  .progress-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #9ca3af;
  }

  /* Summary Card */
  .summary-card {
    background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
    border-radius: 20px;
    padding: 20px;
    color: white;
    margin-top: 12px;
  }

  .summary-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .summary-icon {
    width: 48px;
    height: 48px;
    background: rgba(255,255,255,0.2);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .summary-title {
    font-size: 16px;
    font-weight: 600;
  }

  .summary-subtitle {
    font-size: 12px;
    opacity: 0.8;
  }

  .summary-value {
    font-size: 36px;
    font-weight: 600;
    text-align: center;
    margin: 16px 0;
  }

  .summary-value-unit {
    font-size: 18px;
    font-weight: 400;
    opacity: 0.8;
  }

  .summary-note {
    text-align: center;
    font-size: 12px;
    opacity: 0.7;
    padding-top: 12px;
    border-top: 1px solid rgba(255,255,255,0.2);
  }

  /* Bottom Navigation */
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-around;
    padding: 12px 0 20px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
    z-index: 100;
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: #9ca3af;
    font-size: 11px;
    transition: color 0.2s;
    cursor: pointer;
  }

  .nav-item.active {
    color: #9333ea;
  }

  .nav-icon {
    width: 24px;
    height: 24px;
  }

  /* Loading */
  .loading-overlay {
    position: fixed;
    inset: 0;
    background: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e5e7eb;
    border-top-color: #9333ea;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-text {
    margin-top: 16px;
    color: #6b7280;
    font-size: 14px;
  }
`;

// Settings Row Component
interface SettingsRowProps {
    label: string;
    value1: number;
    value2: number;
    unit1?: string;
    unit2?: string;
    hideValue2?: boolean;
    icon?: React.ReactNode;
    color?: string;
    onSave: (v1: number, v2: number) => void;
}

function SettingsRow({ label, value1, value2, unit1 = 'บาท', unit2 = 'บาท', hideValue2 = false, icon, color = '#9333ea', onSave }: SettingsRowProps) {
    const [localValue1, setLocalValue1] = useState(value1);
    const [localValue2, setLocalValue2] = useState(value2);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setLocalValue1(value1);
        setLocalValue2(value2);
    }, [value1, value2]);

    const handleSave = () => {
        onSave(localValue1, localValue2);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
    };

    return (
        <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '12px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            border: '1px solid #f0f0f0',
            transition: 'all 0.2s ease'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
            }}>
                {icon && (
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: `${color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: color
                    }}>
                        {icon}
                    </div>
                )}
                <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1f2937',
                    flex: 1
                }}>{label}</div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: hideValue2 ? '1fr auto' : '1fr 1fr auto',
                gap: '8px',
                alignItems: 'flex-end'
            }}>
                <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>เป้าหมาย</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                            type="number"
                            value={localValue1}
                            onChange={(e) => setLocalValue1(Number(e.target.value))}
                            style={{
                                width: '100%',
                                minWidth: '70px',
                                padding: '10px 8px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '10px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#1f2937',
                                textAlign: 'center',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                background: '#fafafa'
                            }}
                            onFocus={(e) => e.target.style.borderColor = color}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', whiteSpace: 'nowrap' }}>{unit1}</span>
                    </div>
                </div>

                {!hideValue2 && (
                    <div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>โบนัส</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                                type="number"
                                value={localValue2}
                                onChange={(e) => setLocalValue2(Number(e.target.value))}
                                style={{
                                    width: '100%',
                                    minWidth: '70px',
                                    padding: '10px 8px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#1f2937',
                                    textAlign: 'center',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    background: '#fafafa'
                                }}
                                onFocus={(e) => e.target.style.borderColor = color}
                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                            <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', whiteSpace: 'nowrap' }}>{unit2}</span>
                        </div>
                    </div>
                )}

                <div>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '10px 14px',
                            background: saved
                                ? 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)'
                                : `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                            border: 'none',
                            borderRadius: '10px',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '12px',
                            boxShadow: saved
                                ? '0 4px 12px rgba(62, 134, 199, 0.3)'
                                : `0 4px 12px ${color}30`,
                            transition: 'all 0.2s ease',
                            transform: saved ? 'scale(0.95)' : 'scale(1)',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {saved ? '✓' : 'บันทึก'}
                    </button>
                </div>
            </div>
        </div>
    );
}


function GiftPage() {


    const router = useRouter();
    const { isNavVisible } = useNavLevel();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pickup');
    const [salesummary, setsalesummary] = useState<any[]>([]);
    const [saledaily, setsaledaily] = useState<any[]>([]);
    const [targetSales, setTargetSales] = useState(300000); // ยอดเป้าหมายเริ่มต้น
    const [user, setUser] = useState("");

    // State สำหรับ Settings Modal
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // State สำหรับค่าเป้าหมายต่างๆ
    const [settings, setSettings] = useState({
        targetMonthly: 300000,       // เป้ายอดขายประจำเดือน - เป้าหมาย
        targetMonthlyBonus: 1000,    // เป้ายอดขายประจำเดือน - จำนวนเงิน
        targetDaysOver: 13,          // จำนวนวันเกินเป้า - เป้าหมาย
        targetDaysOverBonus: 750,    // จำนวนวันเกินเป้า - จำนวนเงิน
        targetAmountOver: 10000,     // จำนวนเงินเกินเป้า - เป้าหมาย
        targetAmountOverBonus: 0,    // จำนวนเงินเกินเป้า - จำนวนเงิน
        targetDaily: 12000,          // เป้ายอดขายประจำวัน - เป้าหมาย
        targetDailyBonus: 80,        // เป้ายอดขายประจำวัน - จำนวนเงิน
        pickupFeeRate: 100,          // ค่าหยิบ - เป้าหมาย (%)
        pickupFeeBonus: 0,           // ค่าหยิบ - จำนวนเงิน
        salesPerBillTarget: 120,     // ยอดขาย/บิล - เป้าหมาย
        salesPerBillBonus: 20,       // ยอดขาย/บิล - จำนวนเงิน
        enableTargetMonthly: true,   // เปิด/ปิด การคำนวณเป้ายอดขายประจำเดือน
        enableTargetDaysOver: true,  // เปิด/ปิด การคำนวณวันเกินเป้า
        enableTargetDaily: true,     // เปิด/ปิด การคำนวณเป้ารายวัน
        enablePickupFee: true,       // เปิด/ปิด การคำนวณค่าหยิบ
        enableSalesPerBill: true,    // เปิด/ปิด การคำนวณยอดขาย/บิล
    });

    // โหลดค่า settings จาก API
    const fetchIncentiveSettings = async () => {
        const companyS = localStorage.getItem("company_") || "";
        try {
            const res = await axios.get(`/api/mobile/insentive?company=${companyS}`);
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
                    pickupFeeRate: res.data.pickupFeeRate || 0.5,
                    pickupFeeBonus: res.data.pickupFeeBonus || 0,
                    salesPerBillTarget: res.data.salesPerBillTarget || 120,
                    salesPerBillBonus: res.data.salesPerBillBonus || 20,
                    enableTargetMonthly: res.data.enableTargetMonthly ?? true,
                    enableTargetDaysOver: res.data.enableTargetDaysOver ?? true,
                    enableTargetDaily: res.data.enableTargetDaily ?? true,
                    enablePickupFee: res.data.enablePickupFee ?? true,
                    enableSalesPerBill: res.data.enableSalesPerBill ?? true,
                });
                setTargetSales(res.data.targetMonthly || 300000);
            }
        } catch (error) {
            console.error("Failed to fetch incentive settings:", error);
        }
    };

    useEffect(() => {
        fetchIncentiveSettings();
    }, []);

    // ฟังก์ชันบันทึก settings ไปยัง API
    const saveIncentiveSetting = async (field1: string, value1: number, field2?: string, value2?: number) => {
        const companyS = localStorage.getItem("company_") || "";
        try {
            const updateData: any = { company: companyS };
            updateData[field1] = value1;
            if (field2 && value2 !== undefined) {
                updateData[field2] = value2;
            }

            await axios.put(`/api/mobile/insentive`, updateData);

            // Update local state
            setSettings(prev => ({
                ...prev,
                [field1]: value1,
                ...(field2 ? { [field2]: value2 } : {})
            }));

            if (field1 === 'targetMonthly') {
                setTargetSales(value1);
            }
        } catch (error) {
            console.error("Failed to save incentive setting:", error);
        }
    };

    // State สำหรับเลือกเดือน/ปี
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    // รายชื่อเดือนภาษาไทย
    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    // ปีที่สามารถเลือกได้ (5 ปีย้อนหลัง ถึงปีปัจจุบัน)
    const availableYears = Array.from({ length: 6 }, (_, i) => today.getFullYear() - 5 + i);

    //***************************************************************** */
    // P/L States and Functions
    const [salepl, setsalepl] = useState<any[]>([]);
    const [countday, setcountday] = useState(0);
    const [countnow, setnowday] = useState(0);
    const [countlast, setlastday] = useState(0);
    const [pl, setpl] = useState<any[]>([]);
    const [plid, setplid] = useState(0);
    const [showte, setShowte] = useState(false);

    const fetchPostsz = async () => {
        let companyS = (localStorage.getItem("company_") || "");
        let personName = (localStorage.getItem("person_") || "");
        try {
            const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
            let url = `/api/pl/summary?company=${companyS}&createDate=${monthStr}`;
            if (personName) {
                url += `&name=${personName}`;
            }
            const resday = await axios.get(url);

            setsalepl(resday.data ?? []);

            const dateS = new Date(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`);

            let lastDay = parseInt(new Date(dateS.getFullYear(), dateS.getMonth() + 1, 0).toLocaleDateString('es-US', { day: '2-digit', timeZone: 'Asia/Bangkok' }));
            let nowS = parseInt(new Date().toLocaleDateString('es-US', { day: '2-digit', timeZone: 'Asia/Bangkok' }));

            let datecount = new Date() > new Date(dateS.getFullYear(), dateS.getMonth() + 1, 0) ?
                parseInt(new Date(dateS.getFullYear(), dateS.getMonth() + 1, 0).toLocaleDateString('es-US', { day: '2-digit', timeZone: 'Asia/Bangkok' })) :
                parseInt(new Date().toLocaleDateString('es-US', { day: '2-digit', timeZone: 'Asia/Bangkok' }));

            setcountday(datecount ?? 0);
            setnowday(nowS ?? 0);
            setlastday(lastDay ?? 0);

        } catch (error) {
            console.error(error);
        }
    };

    const GetPL = async () => {
        let companyS = (localStorage.getItem("company_") || "");
        try {
            const monthyearStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
            const res = await axios.get(`/api/pl/pl?company=${companyS}&monthyear=${monthyearStr}`);
            setpl(res.data ?? []);
            setplid(res.data[0] !== undefined ? res.data[0].id : 0);

            localStorage.setItem("plid", String(res.data[0] !== undefined ? res.data[0].id : ""));

        } catch (error) {
            console.error(error);
        }
    };

    // Load P/L data when month/year changes
    useEffect(() => {
        fetchPostsz();
        GetPL();
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.background = '#f8fafc';
    }, []);

    useEffect(() => {
        setLoading(false);
    }, []);

    // ฟังก์ชันดึงข้อมูลตามเดือน/ปีที่เลือก
    const fetchDataByMonth = async (month: number, year: number) => {
        let companyS = localStorage.getItem("company_") || "";
        try {
            const monthStr = `${year}-${String(month).padStart(2, '0')}`;
            const dateStr = `${year}-${String(month).padStart(2, '0')}-01`;

            const [resSummary, resDaily] = await Promise.all([
                axios.get(`/api/sale_cal/sale_sum?company=${companyS}&createDate=${dateStr}`),
                axios.get(`/api/sale_cal/sale_daily?company=${companyS}&createDate=${monthStr}`)
            ]);

            setsalesummary(resSummary.data);
            setsaledaily(resDaily.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchDataByMonth(selectedMonth, selectedYear);
    }, [selectedMonth, selectedYear]);

    // handler สำหรับเลือกเดือน
    const handleSelectMonth = (month: number, year: number) => {
        setSelectedMonth(month);
        setSelectedYear(year);
        setShowMonthPicker(false);
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/");
            return;
        }

        try {
            const payload = jwtDecode<any>(token);

            const fetchGetIDUser = async () => {
                const res = await axios.get(`/api/login/loginuser/${Number(payload.id)}`);
                setUser(res.data)
                localStorage.setItem("level_", res.data.level);
                localStorage.setItem("person_", res.data.name);
                localStorage.setItem("pi_", res.data.id);
                localStorage.setItem("ci_", res.data.id_company);
                localStorage.setItem("cp_", res.data.company);
            };

            fetchGetIDUser();
        } catch (error) {
            console.error("Token decoding failed:", error);
            router.push("/");
        }
    }, []);

    // Logout function
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('level_');
        localStorage.removeItem('person_');
        localStorage.removeItem('pi_');
        localStorage.removeItem('ci_');
        localStorage.removeItem('cp_');
        localStorage.removeItem('company_');
        router.push('/');
    };

    // ฟังก์ชันบันทึก settings แต่ละ field ไปยัง API
    const saveSetting = async (key: string, value: number) => {
        const companyS = localStorage.getItem("company_") || "";
        try {
            const updateData: any = { company: companyS };
            updateData[key] = value;

            await axios.put(`/api/mobile/insentive`, updateData);

            // Update local state
            const newSettings = { ...settings, [key]: value };
            setSettings(newSettings);

            // ถ้าเป็น targetMonthly ให้อัพเดท targetSales ด้วย
            if (key === 'targetMonthly') {
                setTargetSales(value);
            }
        } catch (error) {
            console.error("Failed to save setting:", error);
        }
    };

    // คำนวณข้อมูล
    const dailySales = Number(salesummary[0]?.revenue || 0);
    const billCount = Number(salesummary[0]?.bill || 0);
    const salesPerBill = Number(salesummary[0]?.Bahtperbill || 0);

    // คำนวณยอดขายประจำเดือน
    const monthlyTotal = saledaily.reduce((acc: number, day: any) => acc + Number(day.value || 0), 0);

    // คำนวณจำนวนวันที่มีการขาย
    const workingDays = saledaily.filter((day: any) => Number(day.value) > 0).length;

    // คำนวณค่าหยิบยา (ใช้ค่าจาก settings)
    const pickupFeeRate = settings.pickupFeeRate / 100; // แปลงจาก % เป็นทศนิยม
    const pickupFee = monthlyTotal * pickupFeeRate;

    // คำนวณเปอร์เซ็นต์ความสำเร็จ
    const progressPercent = Math.min((monthlyTotal / targetSales) * 100, 100);

    // แสดงเดือน/ปีที่เลือก
    const selectedMonthName = thaiMonths[selectedMonth - 1];
    const formattedDate = `${selectedMonthName} ${selectedYear + 543}`;
    const currentMonth = `${selectedMonthName} ${selectedYear + 543}`;

    if (loading) {
        return (
            <>
                <style dangerouslySetInnerHTML={{ __html: mobileStyles }} />
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <div className="loading-text">กำลังโหลดข้อมูล...</div>
                </div>
            </>
        );
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: mobileStyles }} />
            <div className="mobile-app">
                {/* Header */}
                <div className="mobile-header">
                    <div className="header-top">
                        <div className="page-title">
                            <div className="page-title-icon">
                                <Gift size={22} color="white" />
                            </div>
                            <div>
                                <div>ค่าหยิบสินค้า</div>
                                {user && (user as any).name && (
                                    <div style={{ fontSize: '12px', fontWeight: '400', opacity: 0.9 }}>{(user as any).name}</div>
                                )}
                            </div>
                        </div>
                        <div className="header-actions">
                            {localStorage.getItem("level_") === "level2" && (
                                <div className="header-icon" onClick={() => setShowSettingsModal(true)} style={{ cursor: 'pointer' }}>
                                    <Settings size={22} color="white" />
                                </div>
                            )}
                            <button className="logout-btn" onClick={handleLogout} title="ออกจากระบบ">
                                <LogOut size={22} color="white" />
                            </button>
                        </div>
                    </div>

                    <div className="date-selector" onClick={() => setShowMonthPicker(true)} style={{ cursor: 'pointer' }}>
                        <Calendar size={18} />
                        <div className="date-selector-text">{formattedDate}</div>
                        <ChevronRight size={18} />
                    </div>
                </div>

                {/* Month/Year Picker Modal */}
                {showMonthPicker && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '20px'
                    }} onClick={() => setShowMonthPicker(false)}>
                        <div style={{
                            background: 'white',
                            borderRadius: '20px',
                            padding: '24px',
                            width: '100%',
                            maxWidth: '340px',
                            maxHeight: '80vh',
                            overflow: 'auto'
                        }} onClick={(e) => e.stopPropagation()}>
                            <div style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#1f2937',
                                marginBottom: '20px',
                                textAlign: 'center'
                            }}>
                                เลือกเดือน/ปี
                            </div>

                            {/* Year Selector */}
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>ปี</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {availableYears.map((year) => (
                                        <button
                                            key={year}
                                            onClick={() => setSelectedYear(year)}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                border: selectedYear === year ? '2px solid #9333ea' : '1px solid #e5e7eb',
                                                background: selectedYear === year ? '#f3e8ff' : 'white',
                                                color: selectedYear === year ? '#9333ea' : '#374151',
                                                fontWeight: selectedYear === year ? '600' : '400',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            {year + 543}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Month Selector */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>เดือน</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                    {thaiMonths.map((month, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSelectMonth(index + 1, selectedYear)}
                                            style={{
                                                padding: '10px 8px',
                                                borderRadius: '8px',
                                                border: selectedMonth === index + 1 ? '2px solid #9333ea' : '1px solid #e5e7eb',
                                                background: selectedMonth === index + 1 ? '#f3e8ff' : 'white',
                                                color: selectedMonth === index + 1 ? '#9333ea' : '#374151',
                                                fontWeight: selectedMonth === index + 1 ? '600' : '400',
                                                cursor: 'pointer',
                                                fontSize: '13px'
                                            }}
                                        >
                                            {month}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => setShowMonthPicker(false)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                                    color: 'white',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                )}

                {/* Settings Modal */}
                {showSettingsModal && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 1000,
                    }}>
                        {/* Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 50%, #6366f1 100%)',
                            padding: '20px',
                            paddingTop: '24px',
                            borderRadius: '0 0 24px 24px',
                            boxShadow: '0 4px 20px rgba(147, 51, 234, 0.3)'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px'
                            }}>
                                <button
                                    onClick={() => setShowSettingsModal(false)}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: 'rgba(255,255,255,0.2)',
                                        backdropFilter: 'blur(10px)',
                                        color: 'white',
                                        fontSize: '20px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    ←
                                </button>
                                <div>
                                    <div style={{ color: 'white', fontSize: '20px', fontWeight: '600' }}>ตั้งค่าเป้าหมาย</div>
                                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>กำหนดเป้าหมายและโบนัส</div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{
                            flex: 1,
                            background: 'linear-gradient(180deg, #faf5ff 0%, #f8fafc 100%)',
                            padding: '20px',
                            overflowY: 'auto',
                            paddingBottom: '40px'
                        }}>
                            {/* Row 1: เป้ายอดขายประจำเดือน */}
                            <SettingsRow
                                label="เป้ายอดขายประจำเดือน"
                                value1={settings.targetMonthly}
                                value2={settings.targetMonthlyBonus}
                                unit1="บาท"
                                unit2="บาท"
                                icon={<Target size={18} />}
                                color="#9333ea"
                                onSave={(v1, v2) => {
                                    saveSetting('targetMonthly', v1);
                                    saveSetting('targetMonthlyBonus', v2);
                                }}
                            />

                            {/* Row 2: จำนวนวันเกินเป้า */}
                            <SettingsRow
                                label="จำนวนวันเกินเป้า"
                                value1={settings.targetDaysOver}
                                value2={settings.targetDaysOverBonus}
                                unit1="วัน"
                                unit2="บาท"
                                icon={<Calendar size={18} />}
                                color="#3E86C7"
                                onSave={(v1, v2) => {
                                    saveSetting('targetDaysOver', v1);
                                    saveSetting('targetDaysOverBonus', v2);
                                }}
                            />

                            {/* Row 3: จำนวนเงินเกินเป้า */}
                            <SettingsRow
                                label="จำนวนเงินเกินเป้า"
                                value1={settings.targetAmountOver}
                                value2={settings.targetAmountOverBonus}
                                unit1="บาท"
                                hideValue2={true}
                                icon={<TrendingUp size={18} />}
                                color="#3E86C7"
                                onSave={(v1, v2) => {
                                    saveSetting('targetAmountOver', v1);
                                    saveSetting('targetAmountOverBonus', v2);
                                }}
                            />

                            {/* Row 4: เป้ายอดขายประจำวัน */}
                            <SettingsRow
                                label="เป้ายอดขายประจำวัน"
                                value1={settings.targetDaily}
                                value2={settings.targetDailyBonus}
                                unit1="บาท"
                                unit2="บาท"
                                icon={<BarChart3 size={18} />}
                                color="#f59e0b"
                                onSave={(v1, v2) => {
                                    saveSetting('targetDaily', v1);
                                    saveSetting('targetDailyBonus', v2);
                                }}
                            />

                            {/* Row 5: ค่าหยิบ */}
                            <SettingsRow
                                label="ค่าหยิบสินค้า"
                                value1={settings.pickupFeeRate}
                                value2={settings.pickupFeeBonus}
                                unit1="%"
                                hideValue2={true}
                                icon={<Wallet size={18} />}
                                color="#ec4899"
                                onSave={(v1, v2) => {
                                    saveSetting('pickupFeeRate', v1);
                                    saveSetting('pickupFeeBonus', v2);
                                }}
                            />

                            {/* Row 6: ยอดขาย/บิล */}
                            <SettingsRow
                                label="ยอดขาย/บิล"
                                value1={settings.salesPerBillTarget}
                                value2={settings.salesPerBillBonus}
                                unit1="บาท"
                                unit2="บาท"
                                icon={<Receipt size={18} />}
                                color="#06b6d4"
                                onSave={(v1, v2) => {
                                    saveSetting('salesPerBillTarget', v1);
                                    saveSetting('salesPerBillBonus', v2);
                                }}
                            />

                            {/* Info Note */}
                            <div style={{
                                marginTop: '16px',
                                padding: '16px',
                                background: 'rgba(147, 51, 234, 0.1)',
                                borderRadius: '12px',
                                border: '1px solid rgba(147, 51, 234, 0.2)'
                            }}>
                                <div style={{ fontSize: '12px', color: '#7c3aed', fontWeight: '500', marginBottom: '4px' }}>
                                    💡 คำแนะนำ
                                </div>
                                <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.5' }}>
                                    กดปุ่ม "บันทึก" เพื่อบันทึกค่าแต่ละรายการ ค่าที่บันทึกจะถูกนำไปใช้ในการคำนวณโบนัสและเป้าหมายโดยอัตโนมัติ
                                </div>
                            </div>
                        </div>

                        
                    </div>
                )}
                {/* Total Bonus Card - Modern Mobile Design */}
                <div style={{
                    margin: '-60px 16px 16px',
                    position: 'relative',
                    zIndex: 10
                }}>
                    {/* Main Bonus Summary Card */}
                    <div style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)',
                        borderRadius: '20px',
                        padding: '20px',
                        boxShadow: '0 10px 40px rgba(147, 51, 234, 0.15)',
                        border: '1px solid #ede9fe',
                        marginBottom: '12px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '16px'
                        }}>
                            <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: '#ede9fe',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Award size={24} color="#7c3aed" />
                            </div>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#4c1d95' }}>รายได้โบนัสรวมทั้งหมด</div>
                                <div style={{ fontSize: '11px', color: '#7c3aed' }}>คำนวณจากเงื่อนไขเป้าหมาย</div>
                            </div>
                        </div>
                        
                        <div style={{
                            textAlign: 'center',
                            padding: '16px',
                            background: '#f5f3ff',
                            borderRadius: '14px',
                            border: '1px dashed #c4b5fd'
                        }}>
                            <span style={{ fontSize: '36px', fontWeight: '700', color: '#7c3aed' }}>
                                ฿{(
                                    (settings.enableTargetMonthly && salepl.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0) >= settings.targetMonthly ? settings.targetMonthlyBonus : 0) +
                                    (settings.enableTargetDaysOver && salepl.filter((d: any) => Number(d.sale || 0) >= settings.targetAmountOver).length >= settings.targetDaysOver ? settings.targetDaysOverBonus : 0) +
                                    (settings.enableSalesPerBill ? salepl.filter((d: any) => {
                                        if (!d.hasCheckin) return false;
                                        const salePerBill = Number(d.bill) > 0 ? Number(d.sale || 0) / Number(d.bill) : 0;
                                        return salePerBill >= settings.salesPerBillTarget;
                                    }).length * settings.salesPerBillBonus : 0) +
                                    (settings.enablePickupFee ? salepl.reduce((a: any, b: any) => a + (Number(b.gifts) || 0), 0) : 0) +
                                    (settings.enableTargetDaily ? salepl.filter((d: any) => {
                                        if (!d.hasCheckin) return false;
                                        return Number(d.sale || 0) >= settings.targetDaily;
                                    }).length * settings.targetDailyBonus : 0)
                                ).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Wrap Stat Cards */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '10px',
                        paddingBottom: '8px'
                    }}>
                        {/* เป้าเดือน Card */}
                        <div style={{
                            flex: '1 1 calc(50% - 5px)',
                            minWidth: '140px',
                            background: 'white',
                            borderRadius: '14px',
                            padding: '14px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                            border: '1px solid #f3e8ff',
                            borderLeft: '4px solid #9333ea',
                            opacity: settings.enableTargetMonthly ? 1 : 0.5,
                            filter: settings.enableTargetMonthly ? 'none' : 'grayscale(0.6)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    background: '#f3e8ff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Target size={14} color="#9333ea" />
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b21a8' }}>เป้าเดือน</div>
                                {!settings.enableTargetMonthly && (
                                    <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '1px 5px' }}>ปิดใช้งาน</span>
                                )}
                            </div>
                            <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px' }}>฿{settings.targetMonthly.toLocaleString()}</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#6b21a8', marginBottom: '6px' }}>
                                ฿{(settings.enableTargetMonthly && salepl.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0) >= settings.targetMonthly ? settings.targetMonthlyBonus : 0).toLocaleString()}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                                    {((salepl.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0) / settings.targetMonthly) * 100).toFixed(0)}%
                                </span>
                                <span style={{
                                    fontSize: '9px',
                                    fontWeight: '600',
                                    color: salepl.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0) >= settings.targetMonthly ? '#147F56' : '#dc2626',
                                    background: salepl.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0) >= settings.targetMonthly ? '#D3F0E2' : '#fee2e2',
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                }}>
                                    {salepl.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0) >= settings.targetMonthly ? 'ถึงเป้า' : 'ยังไม่ถึง'}
                                </span>
                            </div>
                        </div>

                        {/* วันเกินเป้า Card */}
                        <div style={{
                            flex: '1 1 calc(50% - 5px)',
                            minWidth: '140px',
                            background: 'white',
                            borderRadius: '14px',
                            padding: '14px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                            border: '1px solid #E5EEF8',
                            borderLeft: '4px solid #3E86C7',
                            opacity: settings.enableTargetDaysOver ? 1 : 0.5,
                            filter: settings.enableTargetDaysOver ? 'none' : 'grayscale(0.6)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    background: '#E5EEF8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <CalendarDays size={14} color="#3E86C7" />
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: '#173F6B' }}>วันเกินเป้า</div>
                                {!settings.enableTargetDaysOver && (
                                    <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '1px 5px' }}>ปิดใช้งาน</span>
                                )}
                            </div>
                            <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px' }}>{settings.targetDaysOver} วัน ≥ ฿{settings.targetAmountOver.toLocaleString()}</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#173F6B', marginBottom: '6px' }}>
                                ฿{(settings.enableTargetDaysOver && salepl.filter((d: any) => Number(d.sale || 0) >= settings.targetAmountOver).length >= settings.targetDaysOver ? settings.targetDaysOverBonus : 0).toLocaleString()}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                                    เป้า: {settings.targetDaysOver} วัน
                                </span>
                                <span style={{
                                    fontSize: '9px',
                                    fontWeight: '600',
                                    color: '#3E86C7',
                                    background: '#E5EEF8',
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                }}>
                                    {salepl.filter((d: any) => Number(d.sale || 0) >= settings.targetAmountOver).length} วัน
                                </span>
                            </div>
                        </div>

                        {/* ยอดขาย/บิล Card */}
                        <div style={{
                            flex: '1 1 calc(50% - 5px)',
                            minWidth: '140px',
                            background: 'white',
                            borderRadius: '14px',
                            padding: '14px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                            border: '1px solid #E5EEF8',
                            borderLeft: '4px solid #3E86C7',
                            opacity: settings.enableSalesPerBill ? 1 : 0.5,
                            filter: settings.enableSalesPerBill ? 'none' : 'grayscale(0.6)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    background: '#E5EEF8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Receipt size={14} color="#3E86C7" />
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: '#173F6B' }}>ยอดขาย/บิล</div>
                                {!settings.enableSalesPerBill && (
                                    <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '1px 5px' }}>ปิดใช้งาน</span>
                                )}
                            </div>
                            <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px' }}>≥ ฿{settings.salesPerBillTarget}/บิล</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#173F6B', marginBottom: '6px' }}>
                                ฿{(settings.enableSalesPerBill ? salepl.filter((d: any) => {
                                    if (!d.hasCheckin) return false;
                                    const salePerBill = Number(d.bill) > 0 ? Number(d.sale || 0) / Number(d.bill) : 0;
                                    return salePerBill >= settings.salesPerBillTarget;
                                }).length * settings.salesPerBillBonus : 0).toLocaleString()}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                                    ฿{settings.salesPerBillBonus}/วัน
                                </span>
                                <span style={{
                                    fontSize: '9px',
                                    fontWeight: '600',
                                    color: '#3E86C7',
                                    background: '#E5EEF8',
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                }}>
                                    {salepl.filter((d: any) => {
                                        if (!d.hasCheckin) return false;
                                        const salePerBill = Number(d.bill) > 0 ? Number(d.sale || 0) / Number(d.bill) : 0;
                                        return salePerBill >= settings.salesPerBillTarget;
                                    }).length} วัน
                                </span>
                            </div>
                        </div>

                        {/* ค่าหยิบรวม Card */}
                        <div style={{
                            flex: '1 1 calc(50% - 5px)',
                            minWidth: '140px',
                            background: 'white',
                            borderRadius: '14px',
                            padding: '14px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                            border: '1px solid #fef3c7',
                            borderLeft: '4px solid #f59e0b',
                            opacity: settings.enablePickupFee ? 1 : 0.5,
                            filter: settings.enablePickupFee ? 'none' : 'grayscale(0.6)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    background: '#fef3c7',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Wallet size={14} color="#f59e0b" />
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: '#92400e' }}>ค่าหยิบรวม</div>
                                {!settings.enablePickupFee && (
                                    <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '1px 5px' }}>ปิดใช้งาน</span>
                                )}
                            </div>
                            <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px' }}>{settings.pickupFeeRate}%</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#92400e', marginBottom: '6px' }}>
                                ฿{(settings.enablePickupFee ? salepl.reduce((a: any, b: any) => a + (Number(b.gifts) || 0), 0) : 0).toLocaleString()}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                                    รวม
                                </span>
                                <span style={{
                                    fontSize: '9px',
                                    fontWeight: '600',
                                    color: '#f59e0b',
                                    background: '#fef3c7',
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                }}>
                                    {countday} วัน
                                </span>
                            </div>
                        </div>

                        {/* เป้ารายวัน Card */}
                        <div style={{
                            flex: '1 1 100%',
                            minWidth: '140px',
                            background: 'white',
                            borderRadius: '14px',
                            padding: '14px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                            border: '1px solid #fce7f3',
                            borderLeft: '4px solid #ec4899',
                            opacity: settings.enableTargetDaily ? 1 : 0.5,
                            filter: settings.enableTargetDaily ? 'none' : 'grayscale(0.6)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    background: '#fce7f3',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <BarChart3 size={14} color="#ec4899" />
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: '#be185d' }}>เป้ารายวัน</div>
                                {!settings.enableTargetDaily && (
                                    <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '1px 5px' }}>ปิดใช้งาน</span>
                                )}
                            </div>
                            <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px' }}>≥ ฿{settings.targetDaily.toLocaleString()}/วัน</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#be185d', marginBottom: '6px' }}>
                                ฿{(settings.enableTargetDaily ? salepl.filter((d: any) => {
                                    if (!d.hasCheckin) return false;
                                    return Number(d.sale || 0) >= settings.targetDaily;
                                }).length * settings.targetDailyBonus : 0).toLocaleString()}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                                    ฿{settings.targetDailyBonus}/วัน
                                </span>
                                <span style={{
                                    fontSize: '9px',
                                    fontWeight: '600',
                                    color: '#ec4899',
                                    background: '#fce7f3',
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                }}>
                                    {salepl.filter((d: any) => {
                                        if (!d.hasCheckin) return false;
                                        return Number(d.sale || 0) >= settings.targetDaily;
                                    }).length} วัน
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Table Section - Hidden */}
                <div style={{ padding: '0 16px 16px', display: 'none' }}>
                    {/* Section Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px'
                    }}>
                        <div style={{
                            width: '4px',
                            height: '20px',
                            background: 'linear-gradient(180deg, #9333ea, #7c3aed)',
                            borderRadius: '2px'
                        }} />
                        <span style={{
                            fontSize: '15px',
                            fontWeight: '600',
                            color: '#1f2937'
                        }}>รายละเอียดรายวัน ({salepl.length} วัน)</span>
                    </div>

                    {/* Clean Data Table */}
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        border: '1px solid #f0f0f0'
                    }}>
                        {/* Table Header */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 0.6fr 1fr 0.8fr 0.6fr',
                            gap: '6px',
                            padding: '12px 14px',
                            background: '#f8fafc',
                            borderBottom: '1px solid #e5e7eb',
                            fontWeight: '600',
                            fontSize: '10px',
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px'
                        }}>
                            <div>วันที่</div>
                            <div style={{ textAlign: 'center' }}>บิล</div>
                            <div style={{ textAlign: 'right' }}>ยอดขาย</div>
                            <div style={{ textAlign: 'right' }}>ค่าหยิบ</div>
                            <div style={{ textAlign: 'right' }}>%กำไร</div>
                        </div>

                        {/* Table Body */}
                        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            {salepl.map((n: any, index: number) => (
                                <div
                                    key={n.date}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 0.6fr 1fr 0.8fr 0.6fr',
                                        gap: '6px',
                                        padding: '10px 14px',
                                        borderBottom: '1px solid #f3f4f6',
                                        background: index % 2 === 0 ? 'white' : '#fafafa',
                                        alignItems: 'center',
                                        transition: 'background 0.15s ease'
                                    }}
                                >
                                    <div style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>
                                        {n.date}
                                    </div>
                                    <div style={{
                                        textAlign: 'center',
                                        fontSize: '11px',
                                        color: '#6b7280',
                                        background: '#f1f5f9',
                                        padding: '3px 8px',
                                        borderRadius: '6px',
                                        fontWeight: '500'
                                    }}>
                                        {isNaN(Number(n.bill)) ? "-" : Number(n.bill || 0).toFixed(0)}
                                    </div>
                                    <div style={{
                                        textAlign: 'right',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#7c3aed'
                                    }}>
                                        {isNaN(Number(n.sale)) ? "0" : Number(n.sale || 0).toLocaleString()}
                                    </div>
                                    <div style={{
                                        textAlign: 'right',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#3E86C7'
                                    }}>
                                        {isNaN(Number(n.gifts)) ? "0" : Number(n.gifts || 0).toLocaleString()}
                                    </div>
                                    <div style={{
                                        textAlign: 'right',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        color: 'white',
                                        background: Number(((Number(n.sale || 0) - Number(n.cost || 0)) / Number(n.sale || 0)) * 100) >= 20 ? '#1F9D6B' : '#f59e0b',
                                        padding: '3px 6px',
                                        borderRadius: '6px'
                                    }}>
                                        {isNaN(Number(((Number(n.sale || 0) - Number(n.cost || 0)) / Number(n.sale || 0)) * 100)) ? "0" : Number(((Number(n.sale || 0) - Number(n.cost || 0)) / Number(n.sale || 0)) * 100).toFixed(0)}%
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary Footer Row */}
                        {salepl.length > 0 && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 0.6fr 1fr 0.8fr 0.6fr',
                                gap: '6px',
                                padding: '12px 14px',
                                background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                                fontWeight: '600',
                                fontSize: '12px',
                                color: 'white'
                            }}>
                                <div>รวม</div>
                                <div style={{ textAlign: 'center' }}>
                                    {salepl.reduce((a: any, b: any) => a + (Number(b.bill) || 0), 0).toFixed(0)}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    {salepl.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0).toLocaleString()}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    {salepl.reduce((a: any, b: any) => a + (Number(b.gifts) || 0), 0).toLocaleString()}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    {(((salepl.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0) - salepl.reduce((a: any, b: any) => a + (Number(b.cost) || 0), 0)) / salepl.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0)) * 100 || 0).toFixed(0)}%
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {salepl.length === 0 && (
                            <div style={{
                                padding: '40px 20px',
                                textAlign: 'center',
                                color: '#9ca3af'
                            }}>
                                <div style={{ fontSize: '14px' }}>ไม่มีข้อมูล</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Navigation */}
                <div className="bottom-nav">
                    {isNavVisible('P1') && <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => { setActiveTab('home'); router.push('/web/mobile/index/'); }}>
                        <Home size={20} />
                        <span>หน้าหลัก</span>
                    </div>}
                    {isNavVisible('P2') && <div className={`nav-item ${activeTab === 'checkin' ? 'active' : ''}`} onClick={() => { setActiveTab('checkin'); router.push('/web/mobile/checkin/'); }}>
                        <LogIn size={20} />
                        <span>เข้างาน</span>
                    </div>}
                    {isNavVisible('P3') && <div className={`nav-item ${activeTab === 'sale' ? 'active' : ''}`} onClick={() => { setActiveTab('sale'); router.push('/web/mobile/sale/'); }}>
                        <ShoppingCart size={20} />
                        <span>ขาย</span>
                    </div>}
                    {isNavVisible('P4') && <div className={`nav-item ${activeTab === 'pickup' ? 'active' : ''}`} onClick={() => { setActiveTab('pickup'); router.push('/web/mobile/gift/'); }}>
                        <DollarSign size={20} />
                        <span>ค่าหยิบ</span>
                    </div>}
                    {/* {isNavVisible('P5') && <div className={`nav-item ${activeTab === 'product' ? 'active' : ''}`} onClick={() => { setActiveTab('product'); router.push('/web/mobile/product/'); }}>
                        <Box size={20} />
                        <span>สินค้า</span>
                    </div>} */}
                    {isNavVisible('P6') && <div className={`nav-item ${activeTab === 'count' ? 'active' : ''}`} onClick={() => { setActiveTab('count'); router.push('/web/mobile/stock/'); }}>
                        <ClipboardList size={20} />
                        <span>นับสินค้า</span>
                    </div>}
                    {isNavVisible('P7') && <div className={`nav-item ${activeTab === 'receive' ? 'active' : ''}`} onClick={() => { setActiveTab('receive'); router.push('/web/mobile/rc/'); }}>
                        <PackagePlus size={20} />
                        <span>รับ</span>
                    </div>}
                    <div className={`nav-item ${activeTab === 'voice' ? 'active' : ''}`} onClick={() => { setActiveTab('voice'); router.push('/web/mobile/voice/'); }}>
                        <MessageSquare size={20} />
                        <span>สื่อสาร</span>
                    </div>
                </div>
            </div>
        </>
    );
}

export default GiftPage;
