
'use client'

import React, { useEffect, useState, ChangeEvent, KeyboardEvent, use } from 'react'
import MenuTab_Small from "../componant/menutab_small.tsx"
import HeadTab from "../componant/headtab.jsx"
import { usePermission } from '@/utils/usePermission'
import styles from "./../componant/mystyle.module.css"
import axios from 'axios'
import { cachedGet } from '@/lib/catalogCache'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement, // Import ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2'; // Import Doughnut

const widths = 80;

// เก็บ/ส่งวันที่เป็น YYYY-MM-DD เสมอ — toLocaleDateString() แบบไม่ระบุ locale จะได้ปี พ.ศ.
// บนเครื่องที่ตั้งค่าภาษาไทย ทำให้ new Date() แปลงกลับไม่ได้ (Invalid Date)
const toYMD = (d: Date) => d.toLocaleDateString('sv-SE') // sv-SE ให้รูปแบบ YYYY-MM-DD
const formatYMD = (ymd: string) => {
    const [y, m, d] = ymd.split('-')
    return `${d}/${m}/${y}`
}
ChartJS.register(
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement // Register ArcElement
);
import { Table } from 'react-bootstrap';
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Check, AArrowDown, ChevronDownIcon, ChevronsDown, Slice, Key } from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import LoadingOverlay from '../componant/LoadingOverlay';
import { useRouter } from "next/navigation";
//*************************************************** */

function DashboardPage() {



    useEffect(() => {
        // Set professional background color
        document.body.style.background = '#F8FAFC'; // Slate-50 (Softer, Modern)
        document.body.style.minHeight = '100vh';
    }, []);

    const [loading, setLoading] = useState(true);



    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(undefined)

    const initialValues = {
        company: "",
        idSaleItem: "",
        search_date: "",

    };

    const [all, setall1] = useState(initialValues)

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setTimeout(() => {
            setall1({
                ...all,
                [name]: value,
            });
        }, 30);
    };


    const [saleresmonth, setsaleresmonth] = useState([])
    const [saledaily, setsaledaily] = useState([])
    const [salesummary, setsalesummary] = useState([])
    const [saletime, setsaletime] = useState([])
    const [sale_pd_good, setsale_pd_good] = useState([])
    const [sale_group_pd_good, res_group_pd_good] = useState([])

    // Expiry products state
    const [expiryDays, setExpiryDays] = useState(60)
    const [expirySoonItems, setExpirySoonItems] = useState<any[]>([])
    const [productAreas, setProductAreas] = useState<Record<string, string>>({})


    useEffect(() => {
        let companyS = (localStorage.getItem("company_") || "")
        const fetchPostsz = async () => {
            try {
                const today = new Date();
                const searchDate = all.search_date || toYMD(today);
                const currentMonth = `${today.getFullYear()}-${("0" + (today.getMonth() + 1)).slice(-2)}`;

                // เรียก API แบบ Parallel ด้วย Promise.all เพื่อเพิ่มความเร็ว
                const [resmonth, resday, res, restime, res_product_good, res_groupproduct_good] = await Promise.all([
                    axios.get(`/api/sale_cal/sale_monthly?company=${companyS}&createDate=${today.getFullYear()}`),
                    axios.get(`/api/sale_cal/sale_daily?company=${companyS}&createDate=${currentMonth}`),
                    axios.get(`/api/sale_cal/sale_sum?company=${companyS}&createDate=${searchDate}`),
                    axios.get(`/api/sale_cal/sale_time?company=${companyS}&createDate=${searchDate}`),
                    axios.get(`/api/sale_cal/sale_product_good?company=${companyS}&createDate=${searchDate}`),
                    axios.get(`/api/sale_cal/sale_group?company=${companyS}&createDate=${searchDate}`)
                ])

                setsalesummary(res.data)
                setsaletime(restime.data)
                setsaleresmonth(resmonth.data)
                setsaledaily(resday.data)
                setsale_pd_good(res_product_good.data)
                res_group_pd_good(res_groupproduct_good.data)
            } catch (error) {
                console.error(error)
            }
        }

        // เรียกทุก fetch functions พร้อมกัน
        Promise.all([fetchPostsz(), fetchExpirySoonItems(), fetchProductAreas()]).finally(() => setLoading(false))

    }, [])

    //console.log(saleresmonth)
    //  console.log(saledaily)

    //*****Sale Month */
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                align: 'end' as const, // Align legend to ends
                labels: {
                    font: { family: "Kanit", size: 12 },
                    usePointStyle: true,
                    boxWidth: 8,
                    boxHeight: 8,
                }
            },
            title: {
                display: true,
                text: 'ยอดขาย รายเดือน',
                font: { size: 15, family: "Kanit", weight: '600' },
                color: '#2A6AAA',
                align: 'start' as const,
                padding: { bottom: 20 }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)', // Light tooltip
                titleColor: '#173F6B',
                bodyColor: '#374151',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                titleFont: { family: "Kanit", size: 14, weight: 'bold' },
                bodyFont: { family: "Kanit", size: 13 },
                padding: 12,
                cornerRadius: 12,
                displayColors: false, // Cleaner tooltip
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { family: "Kanit" }, color: '#6B7280' }
            },
            y: {
                border: { display: false }, // Hide axis border
                grid: { color: '#F3F4F6', tickLength: 0 }, // Very light grid
                ticks: { font: { family: "Kanit" }, color: '#6B7280', padding: 10 }
            }
        },
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        elements: {
            point: {
                radius: 0,
                hoverRadius: 6,
                hoverBorderWidth: 2,
            },
            line: {
                tension: 0.5, // Smoother
                borderWidth: 3,
            }
        }
    };

    const months = saleresmonth.map((r: any) => r.month);
    const labels = months

    const data = {
        labels: labels,
        datasets: [
            {
                label: String(new Date().getFullYear()),
                data: saleresmonth.map((r: any) => r.value),
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(62, 134, 199, 0.4)'); // Emerald 500
                    gradient.addColorStop(1, 'rgba(62, 134, 199, 0.05)');
                    return gradient;
                },
                borderColor: '#3E86C7', // Emerald 500
                pointBackgroundColor: '#3E86C7',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#3E86C7',
                pointHoverBorderColor: '#fff',
                fill: true,
            }
        ],
    };

    //*************************************************** */

    //*****Sale Daily */


    const optionday = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                align: 'end' as const,
                labels: {
                    font: { family: "Kanit", size: 12 },
                    usePointStyle: true,
                    boxWidth: 8,
                    boxHeight: 8,
                }
            },
            title: {
                display: true,
                text: 'ยอดขาย รายวัน',
                font: { size: 15, family: "Kanit", weight: '600' },
                color: '#173F6B', // Blue 800
                align: 'start' as const,
                padding: { bottom: 20 }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#173F6B',
                bodyColor: '#374151',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                titleFont: { family: "Kanit", size: 14, weight: 'bold' },
                bodyFont: { family: "Kanit", size: 13 },
                padding: 12,
                cornerRadius: 12,
                displayColors: false,
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { family: "Kanit" }, color: '#6B7280' }
            },
            y: {
                border: { display: false },
                grid: { color: '#F3F4F6', tickLength: 0 },
                ticks: { font: { family: "Kanit" }, color: '#6B7280', padding: 10 }
            }
        },
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        elements: {
            point: {
                radius: 0,
                hoverRadius: 6,
                hoverBorderWidth: 2,
            },
            line: {
                tension: 0.5,
                borderWidth: 3,
            }
        }
    };

    const monthday = saledaily.map((r: any) => r.date);
    const labelday = monthday

    const data1 = {
        labels: labelday,
        datasets: [
            {
                label: ("0" + (Number(new Date().getMonth()) + 1)).slice(-2) + "/" + new Date().getFullYear(),
                data: saledaily.map((r: any) => r.value),
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(62, 134, 199, 0.4)'); // Blue 500
                    gradient.addColorStop(1, 'rgba(62, 134, 199, 0.05)');
                    return gradient;
                },
                borderColor: '#3E86C7', // Blue 500
                pointBackgroundColor: '#3E86C7',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#3E86C7',
                pointHoverBorderColor: '#fff',
                fill: true,
            }
        ],
    };

    //*************************************************** */

    //*****Time Daily */


    const optiontime = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                align: 'end' as const,
                labels: {
                    font: { family: "Kanit", size: 12 },
                    usePointStyle: true,
                    boxWidth: 8,
                    boxHeight: 8,
                }
            },
            title: {
                display: true,
                text: 'ยอดขาย ตามช่วงเวลา',
                font: { size: 15, family: "Kanit", weight: '600' },
                color: '#9A3412', // Orange 800
                align: 'start' as const,
                padding: { bottom: 20 }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#173F6B',
                bodyColor: '#374151',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                titleFont: { family: "Kanit", size: 14, weight: 'bold' },
                bodyFont: { family: "Kanit", size: 13 },
                padding: 12,
                cornerRadius: 12,
                displayColors: false,
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { family: "Kanit" }, color: '#6B7280' }
            },
            y: {
                border: { display: false },
                grid: { color: '#F3F4F6', tickLength: 0 },
                ticks: { font: { family: "Kanit" }, color: '#6B7280', padding: 10 }
            }
        },
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        elements: {
            point: {
                radius: 0,
                hoverRadius: 6,
                hoverBorderWidth: 2,
            },
            line: {
                tension: 0.5,
                borderWidth: 3,
            }
        }
    };

    const daytime = saletime.map((r: any) => r.time);
    const labeltime = daytime

    const daytimes = {
        labels: labeltime,
        datasets: [
            {
                label: formatYMD(all.search_date || toYMD(new Date())),
                data: saletime.map((r: any) => r.value),
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(245, 158, 11, 0.4)'); // Amber 500
                    gradient.addColorStop(1, 'rgba(245, 158, 11, 0.05)');
                    return gradient;
                },
                borderColor: '#F59E0B',
                pointBackgroundColor: '#F59E0B',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#F59E0B',
                pointHoverBorderColor: '#fff',
                fill: true,
            }
        ],
    };





    const isFirstDateEffect = React.useRef(true)
    useEffect(() => {
        // รอบแรกตอน mount ถูก effect ด้านบนโหลดข้อมูลชุดเดียวกันไปแล้ว — ข้ามเพื่อไม่ยิง API ซ้ำ
        if (isFirstDateEffect.current) {
            isFirstDateEffect.current = false
            return
        }
        let companyS = (localStorage.getItem("company_") || "")
        const fetchPostsz = async () => {
            try {
                const searchDate = all.search_date || toYMD(new Date());

                // เรียก API แบบ Parallel ด้วย Promise.all เพื่อเพิ่มความเร็ว
                const [res, restime, res_product_good, res_groupproduct_good] = await Promise.all([
                    axios.get(`/api/sale_cal/sale_sum?company=${companyS}&createDate=${searchDate}`),
                    axios.get(`/api/sale_cal/sale_time?company=${companyS}&createDate=${searchDate}`),
                    axios.get(`/api/sale_cal/sale_product_good?company=${companyS}&createDate=${searchDate}`),
                    axios.get(`/api/sale_cal/sale_group?company=${companyS}&createDate=${searchDate}`)
                ])

                setsalesummary(res.data)
                setsaletime(restime.data)
                setsale_pd_good(res_product_good.data)
                res_group_pd_good(res_groupproduct_good.data)
            } catch (error) {
                console.error(error)
            }
        }
        fetchPostsz()

    }, [date])


    useEffect(() => {
        
    }, []);
    const [l, setlevel] = useState([])
    const { hasPermission } = usePermission()

    const fetchProductAreas = async () => {
        const companyS = localStorage.getItem("company_") || ""
        try {
            const res = await cachedGet(`/api/datalist?company=${companyS}&fields=list`)
            const areaMap: Record<string, string> = {}
            res.data.forEach((p: any) => {
                areaMap[p.code] = p.Area || ""
            })
            setProductAreas(areaMap)
        } catch (error) {
            console.error('Error fetching product areas:', error)
        }
    }

    // Fetch expiry soon items from receivelist
    const fetchExpirySoonItems = async () => {
        const companyS = localStorage.getItem("company_") || ""
        try {
            const res = await axios.get(`/api/receivelist?company=${companyS}&fields=expiry`)
            setExpirySoonItems(res.data)
        } catch (error) {
            console.error('Error fetching expiry items:', error)
        }
    }

    // Calculate days until expiry
    const getDaysUntilExpiry = (dateExp: string) => {
        if (!dateExp) return 9999
        const expDate = new Date(dateExp)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const diffTime = expDate.getTime() - today.getTime()
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    // Filter and sort expiry items based on selected days
    const filteredExpiryItems = expirySoonItems
        .filter((item: any) => {
            const daysLeft = getDaysUntilExpiry(item.dateExp)
            const hasStock = (item.balance ?? 0) > 0
            const isAcknowledged = item.statuss === 'exp'

            // Hide if no stock
            if (!hasStock) return false

            // If acknowledged, stay until expired (daysLeft <= 0)
            if (isAcknowledged) {
                return daysLeft > 0
            }

            // Normal items show if in filter period
            return daysLeft <= expiryDays
        })
        .sort((a: any, b: any) => {
            const daysA = getDaysUntilExpiry(a.dateExp)
            const daysB = getDaysUntilExpiry(b.dateExp)
            return daysA - daysB // Sort ascending (closest to expiry first)
        })

    // Format date for display
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-'
        const date = new Date(dateStr)
        return date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
    }

    // Handle Acknowledge (Set status to 'exp')
    const handleAcknowledge = async (item: any) => {
        if (!confirm('ยืนยันคุณได้รับทราบข้อมูลรายการนี้แล้ว?')) return
        try {
            await axios.put(`/api/receivelist/${item.id}`, {
                ...item,
                statuss: 'exp'
            })
            // Refresh data
            fetchExpirySoonItems()
        } catch (error) {
            console.error('Error acknowledging item:', error)
            alert('เกิดข้อผิดพลาดในการบันทึก')
        }
    }



    return (

        <>
            <LoadingOverlay show={loading} />
            <div className={styles.dashboardPageShell}>
                <div className="row justify-content-start " >
                    <HeadTab />
                </div>

                <div className="row justify-content-start " >

                    <div className="col-sm-1" >
                        <MenuTab_Small />
                    </div>

                    <div className={`col-sm-11 ${styles.dashboardContentColumn}`}>
                        <div className={`row ${styles.dashboardMainGrid}`}>

                            <div className={`col-sm-7 mt-1 ${styles.dashboardLeftColumn}`}>


                                <div className={styles.dashboardLeftStack}>
                                    <div className={`row mb-3 ${styles.dashboardControlBar}`}>
                                        <div className={styles.bodydetail} style={{ width: 'auto', marginRight: 10, fontFamily: 'Kanit', color: '#475569', fontWeight: 600 }}>
                                            เลือกวันที่ :
                                        </div>
                                        <Popover open={open} onOpenChange={setOpen}>
                                            <PopoverTrigger asChild >
                                                <Button
                                                    variant="outline"
                                                    id="order_date"
                                                    name="order_date"
                                                    className="justify-start mb-0 rounded-lg border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                                                    style={{ fontFamily: "Kanit", fontSize: 13, width: 180, height: 38, color: '#475569' }}
                                                >
                                                    <div style={{ flex: 1, textAlign: 'left' }}>
                                                        {formatYMD(all.search_date || toYMD(new Date()))}
                                                    </div>
                                                    <ChevronDownIcon className="h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger >
                                            <PopoverContent className="w-auto overflow-hidden p-0" align="end" >
                                                <Calendar
                                                    mode="single"
                                                    selected={date}
                                                    captionLayout="dropdown"
                                                    onSelect={(date) => {
                                                        setDate(date)
                                                        setall1({ ...all, search_date: date ? toYMD(date) : "", })

                                                        setOpen(false)
                                                    }}
                                                    className="rounded-md border shadow"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    {/* Professional Stats Cards Row */}
                                    <div className={`row mb-2 g-2 ${styles.dashboardKpiGrid}`}>
                                        {/*****จำนวนบิล (Bills)*********/}
                                        {hasPermission("A2") ?
                                            <div className='col-auto'>
                                                <div className={`${styles.dashboardKpiCard} ${styles.dashboardKpiIndigo}`} style={{
                                                    width: 150,
                                                    background: 'linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)', // Light Blue
                                                    borderRadius: 12,
                                                    padding: '10px 12px',
                                                    boxShadow: '0 2px 8px rgba(204, 223, 241, 0.2)',
                                                    transition: 'all 0.3s ease',
                                                    cursor: 'default',
                                                    border: '1px solid #CCDFF1'
                                                }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.2)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.15)'; }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                                        <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <span className={styles.dashboardKpiIconDot} aria-hidden="true" />
                                                        </div>
                                                        <div style={{ marginLeft: 8, fontFamily: "Kanit", fontSize: 11, color: '#4F46E5', fontWeight: 500 }}>จำนวนบิล</div>
                                                    </div>
                                                    <div style={{ fontFamily: "Kanit", fontSize: 22, fontWeight: 'bold', color: '#3730A3' }}>
                                                        {salesummary.map((r: any) => r.bill)}
                                                    </div>
                                                    <div style={{ fontFamily: "Kanit", fontSize: 10, color: '#6366F1' }}>บิล</div>
                                                </div>
                                            </div>
                                            : ""}

                                        {/*****ยอดขาย (Sales)*********/}
                                        {hasPermission("A3") ?
                                            <div className='col-auto'>
                                                <div className={`${styles.dashboardKpiCard} ${styles.dashboardKpiGreen}`} style={{
                                                    width: 150,
                                                    background: 'linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)', // Emerald 50/100
                                                    borderRadius: 12,
                                                    padding: '10px 12px',
                                                    boxShadow: '0 2px 8px rgba(62, 134, 199, 0.1)',
                                                    transition: 'all 0.3s ease',
                                                    cursor: 'default',
                                                    border: '1px solid #CCDFF1'
                                                }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(62, 134, 199, 0.2)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(62, 134, 199, 0.15)'; }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                                        <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(62, 134, 199, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <span className={styles.dashboardKpiIconDot} aria-hidden="true" />
                                                        </div>
                                                        <div style={{ marginLeft: 8, fontFamily: "Kanit", fontSize: 11, color: '#2A6AAA', fontWeight: 500 }}>ยอดขาย</div>
                                                    </div>
                                                    <div style={{ fontFamily: "Kanit", fontSize: 20, fontWeight: 'bold', color: '#1E5088' }}>
                                                        {Number(salesummary.map((r: any) => r.revenue)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </div>
                                                    <div style={{ fontFamily: "Kanit", fontSize: 10, color: '#3E86C7' }}>บาท</div>
                                                </div>
                                            </div>
                                            : ""}

                                        {/*****ยอดขาย/บิล (Avg)*********/}
                                        {hasPermission("A4") ?
                                            <div className='col-auto'>
                                                <div className={`${styles.dashboardKpiCard} ${styles.dashboardKpiAmber}`} style={{
                                                    width: 150,
                                                    background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', // Amber 50/100
                                                    borderRadius: 12,
                                                    padding: '10px 12px',
                                                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.1)',
                                                    transition: 'all 0.3s ease',
                                                    cursor: 'default',
                                                    border: '1px solid #FDE68A'
                                                }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.2)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.15)'; }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                                        <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <span className={styles.dashboardKpiIconDot} aria-hidden="true" />
                                                        </div>
                                                        <div style={{ marginLeft: 8, fontFamily: "Kanit", fontSize: 11, color: '#D97706', fontWeight: 500 }}>ยอดขาย/บิล</div>
                                                    </div>
                                                    <div style={{ fontFamily: "Kanit", fontSize: 20, fontWeight: 'bold', color: '#B45309' }}>
                                                        {Number(salesummary.map((r: any) => r.Bahtperbill)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </div>
                                                    <div style={{ fontFamily: "Kanit", fontSize: 10, color: '#F59E0B' }}>บาท/ออเดอร์</div>
                                                </div>
                                            </div>
                                            : ""}

                                        {/*****ยอดรับสินค้า (Received)*********/}
                                        {hasPermission("A5") ?
                                            <div className='col-auto'>
                                                <div className={`${styles.dashboardKpiCard} ${styles.dashboardKpiBlue}`} style={{
                                                    width: 150,
                                                    background: 'linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)', // Blue 50/100
                                                    borderRadius: 12,
                                                    padding: '10px 12px',
                                                    boxShadow: '0 2px 8px rgba(62, 134, 199, 0.1)',
                                                    transition: 'all 0.3s ease',
                                                    cursor: 'default',
                                                    border: '1px solid #CCDFF1'
                                                }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(62, 134, 199, 0.2)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(62, 134, 199, 0.15)'; }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                                        <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(62, 134, 199, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <span className={styles.dashboardKpiIconDot} aria-hidden="true" />
                                                        </div>
                                                        <div style={{ marginLeft: 8, fontFamily: "Kanit", fontSize: 11, color: '#2A6AAA', fontWeight: 500 }}>ยอดรับสินค้า</div>
                                                    </div>
                                                    <div style={{ fontFamily: "Kanit", fontSize: 18, fontWeight: 'bold', color: '#1E5088' }}>
                                                        {Number(salesummary.map((r: any) => r.sumRC)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </div>
                                                    <div style={{ fontFamily: "Kanit", fontSize: 9, color: '#3E86C7' }}>
                                                        {Number(salesummary.map((r: any) => r.itemRC)).toLocaleString()} รายการ
                                                    </div>
                                                </div>
                                            </div>
                                            : ""}
                                    </div>
                                </div>

                                {/*****ขายดีและหมดอายุ - Professional Layout*********/}

                                <div className={`row mt-1 g-4 ${styles.dashboardSectionGrid}`}>
                                    <div className={`col-sm-6 d-flex flex-column gap-4 ${styles.dashboardPanelStack}`}>

                                        {hasPermission("A7") ?
                                            <div className={`${styles.dashboardPanel} ${styles.dashboardDonutPanel}`} style={{
                                                height: "32vh",
                                                display: 'flex',
                                                flexDirection: 'column',
                                                background: '#ffffff',
                                                borderRadius: 20,
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                                overflow: 'hidden',
                                                border: '1px solid rgba(148, 163, 184, 0.15)'
                                            }}>
                                                <div className={styles.dashboardPanelHeader} style={{
                                                    background: '#f1f5f9',
                                                    borderBottom: '2px solid #94a3b8',
                                                    padding: '14px 20px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10
                                                }}>
                                                    <span className={styles.dashboardPanelIcon} aria-hidden="true" />
                                                    <div style={{ fontFamily: "Kanit", fontSize: 13, fontWeight: 600, color: '#475569' }}>กลุ่มสินค้าขายดี</div>
                                                </div>
                                                <div style={{ flex: 1, padding: '15px', position: 'relative' }}>
                                                    <Doughnut
                                                        data={{
                                                            labels: sale_group_pd_good.map((w: any) => w.Id),
                                                            datasets: [{
                                                                data: sale_group_pd_good.map((w: any) => w.total),
                                                                backgroundColor: [
                                                                    '#94A3B8', '#A6C8E7', '#FCD34D', '#C4B5FD', '#FBCFE8',
                                                                    '#A5B4FC', '#67E8F9', '#FDBA74', '#5EEAD4'
                                                                ],
                                                                borderColor: '#ffffff',
                                                                borderWidth: 3,
                                                            }]
                                                        }}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: {
                                                                legend: {
                                                                    position: 'right' as const,
                                                                    labels: { font: { family: "Kanit", size: 11 }, boxWidth: 12, usePointStyle: true, padding: 8 }
                                                                },
                                                                tooltip: {
                                                                    callbacks: {
                                                                        label: function (context) {
                                                                            let label = context.label || '';
                                                                            if (label) label += ': ';
                                                                            let value = context.parsed;
                                                                            let total = context.dataset.data.reduce((a: any, b: any) => a + b, 0);
                                                                            let percentage = ((value / total) * 100).toFixed(1) + "%";
                                                                            if (context.parsed !== null) label += new Intl.NumberFormat('en-US').format(value) + ' (' + percentage + ')';
                                                                            return label;
                                                                        }
                                                                    },
                                                                    backgroundColor: '#fff', titleColor: '#1F2937', bodyColor: '#4B5563',
                                                                    titleFont: { family: "Kanit", size: 13, weight: 'bold' }, bodyFont: { family: "Kanit", size: 12 },
                                                                    borderColor: '#E5E7EB', borderWidth: 1, padding: 12, cornerRadius: 10
                                                                }
                                                            },
                                                            cutout: '65%',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            : ""}

                                        {hasPermission("A6") ?
                                            <div className={`${styles.dashboardPanel} ${styles.dashboardBestPanel}`} style={{
                                                height: "60vh",
                                                background: '#ffffff',
                                                borderRadius: 20,
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                                overflow: 'hidden',
                                                border: '1px solid rgba(166, 200, 231, 0.2)'
                                            }}>
                                                <div className={styles.dashboardPanelHeader} style={{
                                                    background: '#F3F8FC',
                                                    borderBottom: '2px solid #3E86C7',
                                                    padding: '14px 20px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10
                                                }}>
                                                    <span className={styles.dashboardPanelIcon} aria-hidden="true" />
                                                    <div style={{ fontFamily: "Kanit", fontSize: 13, fontWeight: 600, color: '#1E5088' }}>สินค้าขายดี</div>
                                                </div>
                                                <div style={{ overflowY: 'auto', height: "calc(100% - 48px)" }}>
                                                    <Table hover size="sm" className={`mb-0 w-100 ${styles.dashboardTable}`}>
                                                        <thead style={{ background: '#F3F8FC', position: 'sticky', top: 0, zIndex: 1 }}>
                                                            <tr>
                                                                <th style={{ padding: '12px 16px', fontFamily: "Kanit", fontSize: 12, color: "#173F6B", fontWeight: 600, borderBottom: '2px solid #CCDFF1' }}>รหัส</th>
                                                                <th style={{ padding: '12px 16px', fontFamily: "Kanit", fontSize: 12, color: "#173F6B", fontWeight: 600, borderBottom: '2px solid #CCDFF1' }}>รายการ</th>
                                                                <th style={{ padding: '12px 16px', fontFamily: "Kanit", fontSize: 12, color: "#173F6B", fontWeight: 600, textAlign: 'center', borderBottom: '2px solid #CCDFF1' }}>จำนวน</th>
                                                                <th style={{ padding: '12px 16px', fontFamily: "Kanit", fontSize: 12, color: "#173F6B", fontWeight: 600, textAlign: 'right', borderBottom: '2px solid #CCDFF1' }}>ยอดขาย</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {sale_pd_good.map((w: any, index) =>
                                                                <tr key={`${w.Id ?? 'na'}-${index}`} style={{ transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#F3F8FC'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                                                    <td style={{ padding: '10px 16px', fontFamily: "Kanit", fontSize: 12, color: '#334155', borderBottom: '1px solid #E5EEF8' }}>{w.Id}</td>
                                                                    <td style={{ padding: '10px 16px', fontFamily: "Kanit", fontSize: 12, color: '#334155', borderBottom: '1px solid #E5EEF8', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name}</td>
                                                                    <td style={{ padding: '10px 16px', fontFamily: "Kanit", fontSize: 12, color: '#334155', textAlign: 'center', borderBottom: '1px solid #E5EEF8' }}>{w.qty}</td>
                                                                    <td style={{ padding: '10px 16px', fontFamily: "Kanit", fontSize: 12, color: '#2A6AAA', fontWeight: 600, textAlign: 'right', borderBottom: '1px solid #E5EEF8' }}>{Number(w.total).toLocaleString()}</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            </div>
                                            : ""}

                                    </div>
                                    {hasPermission("A8") ?
                                        <div className='col-sm-6'>
                                            <div className={`${styles.dashboardPanel} ${styles.dashboardExpiryPanel}`} style={{
                                                height: '95vh',
                                                background: '#ffffff',
                                                borderRadius: 20,
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                                overflow: 'hidden',
                                                border: '1px solid rgba(251, 191, 36, 0.2)'
                                            }}>
                                                <div className={styles.dashboardPanelHeader} style={{
                                                    background: '#fffbeb',
                                                    borderBottom: '2px solid #f59e0b',
                                                    padding: '14px 20px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: 10
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <span className={styles.dashboardPanelIcon} aria-hidden="true" />
                                                        <div style={{ fontFamily: "Kanit", fontSize: 12, fontWeight: 600, color: '#b45309' }}>สินค้าใกล้หมดอายุ/หมดอายุ</div>
                                                    </div>
                                                    {/* Period Selection Buttons */}
                                                    <div style={{ display: 'flex', gap: 4 }}>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setExpiryDays(60)}
                                                            style={{
                                                                fontFamily: "Kanit",
                                                                fontSize: 11,
                                                                height: 28,
                                                                padding: '0 8px',
                                                                background: expiryDays === 60 ? '#f59e0b' : '#fffbeb',
                                                                border: '1px solid #f59e0b',
                                                                color: expiryDays === 60 ? '#fff' : '#b45309',
                                                                fontWeight: 600,
                                                                borderRadius: 6,
                                                                transition: 'all 0.2s ease',
                                                                cursor: 'pointer', width: '38px'
                                                            }}
                                                        >
                                                            60 วัน
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setExpiryDays(90)}
                                                            style={{
                                                                fontFamily: "Kanit",
                                                                fontSize: 11,
                                                                height: 28,
                                                                padding: '0 8px',
                                                                background: expiryDays === 90 ? '#f59e0b' : '#fffbeb',
                                                                border: '1px solid #f59e0b',
                                                                color: expiryDays === 90 ? '#fff' : '#b45309',
                                                                fontWeight: 600,
                                                                borderRadius: 6,
                                                                transition: 'all 0.2s ease',
                                                                cursor: 'pointer', width: '38px'
                                                            }}
                                                        >
                                                            90 วัน
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setExpiryDays(120)}
                                                            style={{
                                                                fontFamily: "Kanit",
                                                                fontSize: 11,
                                                                height: 28,
                                                                padding: '0 8px',
                                                                background: expiryDays === 120 ? '#f59e0b' : '#fffbeb',
                                                                border: '1px solid #f59e0b',
                                                                color: expiryDays === 120 ? '#fff' : '#b45309',
                                                                fontWeight: 600,
                                                                borderRadius: 6,
                                                                transition: 'all 0.2s ease',
                                                                cursor: 'pointer', width: '38px'
                                                            }}
                                                        >
                                                            120 วัน
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div style={{ overflowY: 'auto', height: "calc(100% - 48px)" }}>
                                                    <Table hover size="sm" className={`mb-0 w-100 ${styles.dashboardTable} ${styles.dashboardExpiryTable}`}>
                                                        <thead style={{ background: '#FFFBEB', position: 'sticky', top: 0, zIndex: 1 }}>
                                                            <tr>
                                                                <th style={{ padding: '10px 12px', fontFamily: "Kanit", fontSize: 11, color: "#92400E", fontWeight: 600, borderBottom: '2px solid #FDE68A' }}>รหัส</th>
                                                                <th style={{ padding: '10px 12px', fontFamily: "Kanit", fontSize: 11, color: "#92400E", fontWeight: 600, borderBottom: '2px solid #FDE68A' }}>ชื่อสินค้า</th>
                                                                <th style={{ padding: '10px 12px', fontFamily: "Kanit", fontSize: 11, color: "#92400E", fontWeight: 600, textAlign: 'center', borderBottom: '2px solid #FDE68A' }}>คงเหลือ</th>
                                                                <th style={{ padding: '10px 12px', fontFamily: "Kanit", fontSize: 11, color: "#92400E", fontWeight: 600, textAlign: 'center', borderBottom: '2px solid #FDE68A' }}>หมดอายุ</th>
                                                                <th style={{ padding: '10px 12px', fontFamily: "Kanit", fontSize: 11, color: "#92400E", fontWeight: 600, textAlign: 'center', borderBottom: '2px solid #FDE68A' }}>Lot</th>

                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {filteredExpiryItems.length > 0 ? (
                                                                filteredExpiryItems.map((item: any, index: number) => {
                                                                    const daysLeft = getDaysUntilExpiry(item.dateExp)
                                                                    const isExpired = daysLeft <= 0
                                                                    const isNearExpiry = daysLeft > 0 && daysLeft <= 30
                                                                    const isAcknowledged = item.statuss === 'exp'

                                                                    return (
                                                                        <tr key={`${item.id ?? 'na'}-${index}`} style={{ transition: 'background 0.2s', background: isExpired ? '#FEF2F2' : isNearExpiry ? '#FFFBEB' : 'transparent', opacity: isAcknowledged ? 0.7 : 1 }} onMouseEnter={(e) => e.currentTarget.style.background = isExpired ? '#FEE2E2' : '#FEF2F2'} onMouseLeave={(e) => e.currentTarget.style.background = isExpired ? '#FEF2F2' : isNearExpiry ? '#FFFBEB' : 'transparent'}>
                                                                            <td style={{ padding: '8px 12px', fontFamily: "Kanit", fontSize: 11, color: '#334155', borderBottom: '1px solid #FEE2E2' }}>{item.itemcode}</td>
                                                                            <td style={{ padding: '8px 12px', fontFamily: "Kanit", fontSize: 12, color: '#334155', borderBottom: '1px solid #FEE2E2', maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.itemName}>
                                                                                {item.itemName}
                                                                                {productAreas[item.itemcode] && (
                                                                                    <div style={{ fontSize: 10, color: '#3E86C7', marginTop: 2 }}>
                                                                                        พื้นที่: {productAreas[item.itemcode]}
                                                                                    </div>
                                                                                )}
                                                                            </td>
                                                                            <td style={{ padding: '8px 12px', fontFamily: "Kanit", fontSize: 11, color: '#334155', textAlign: 'center', borderBottom: '1px solid #FEE2E2' }}>{item.balance ?? '-'}</td>
                                                                            <td style={{ padding: '8px 12px', fontFamily: "Kanit", fontSize: 11, color: isExpired ? '#DC2626' : isNearExpiry ? '#D97706' : '#147F56', fontWeight: 600, textAlign: 'center', borderBottom: '1px solid #FEE2E2' }}>
                                                                                {formatDate(item.dateExp)}
                                                                                <div style={{ fontSize: 9, fontWeight: 500, color: isExpired ? '#DC2626' : isNearExpiry ? '#D97706' : '#6B7280' }}>
                                                                                    {isExpired ? `หมดอายุแล้ว ${Math.abs(daysLeft)} วัน` : `อีก ${daysLeft} วัน`}
                                                                                </div>
                                                                            </td>
                                                                            <td style={{ padding: '8px 12px', fontFamily: "Kanit", fontSize: 11, color: '#334155', textAlign: 'center', borderBottom: '1px solid #FEE2E2' }}>
                                                                                <div style={{ marginBottom: 4 }}>{item.lot || '-'}</div>
                                                                                {isAcknowledged ? (
                                                                                    <div style={{ color: '#181d69ff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                                        <span style={{ fontSize: 10, fontWeight: 600 }}>รับทราบ</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <button
                                                                                        onClick={() => handleAcknowledge(item)}
                                                                                        style={{
                                                                                            background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
                                                                                            border: '1px solid #CBD5E1',
                                                                                            borderRadius: '6px',
                                                                                            padding: '4px 8px',
                                                                                            color: '#475569',
                                                                                            cursor: 'pointer',
                                                                                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                                                                            transition: 'all 0.2s ease'
                                                                                        }}
                                                                                        onMouseEnter={(e) => {
                                                                                            e.currentTarget.style.background = '#E2E8F0';
                                                                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                                                                        }}
                                                                                        onMouseLeave={(e) => {
                                                                                            e.currentTarget.style.background = 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)';
                                                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                                                        }}
                                                                                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                                                                                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                                                        title="กดรับทราบเพื่อบันทึกการเช็ครายการ"
                                                                                    >
                                                                                        <Check size={14} />
                                                                                    </button>
                                                                                )}
                                                                            </td>

                                                                        </tr>
                                                                    )
                                                                })
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={6} style={{ padding: '40px 16px', fontFamily: "Kanit", fontSize: 13, color: '#6B7280', textAlign: 'center', borderBottom: 'none' }}>ไม่มีสินค้าใกล้หมดอายุภายใน {expiryDays} วัน</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            </div>
                                        </div>
                                        : ""}

                                </div>

                            </div>

                            {/**กราฟ */}
                            {hasPermission("A9") ?
                                <div className={`col-sm-5 d-flex flex-column gap-3 ${styles.dashboardChartColumn}`}>
                                    <div className={styles.dashboardChartCard}>
                                        <Line options={optiontime as any} data={daytimes} />
                                    </div>
                                    <div className={styles.dashboardChartCard}>
                                        <Line options={optionday as any} data={data1} />
                                    </div>
                                    <div className={styles.dashboardChartCard}>
                                        <Line options={options as any} data={data} />
                                    </div>

                                </div>
                                : ""}


                        </div>
                    </div>

                </div>

            </div >
        </>
    )
}
export default DashboardPage




