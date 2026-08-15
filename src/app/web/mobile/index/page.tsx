
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useNavLevel } from '../useNavLevel'
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
    ArcElement,
} from 'chart.js';
import { jwtDecode } from 'jwt-decode';
import { Line, Doughnut } from 'react-chartjs-2';
import { Calendar, TrendingUp, Package, Receipt, Clock, ChevronRight, CalendarDays, BarChart3, Home, ShoppingCart, DollarSign, Box, ClipboardList, LogIn, LogOut, RefreshCw, PackagePlus, MessageSquare, Building2, Wallet, CreditCard, Star, Globe, ChevronDown, Banknote, PieChart } from "lucide-react";

ChartJS.register(
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement
);

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
    background: linear-gradient(180deg, #F3F8FC 0%, #f8fafc 100%);
    min-height: 100vh;
    max-width: 100vw;
    overflow-x: hidden;
    padding-bottom: 80px;
  }

  /* Header */
  .mobile-header {
    background: linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%);
    padding: 20px 20px 60px;
    border-radius: 0 0 32px 32px;
    position: relative;
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .greeting {
    color: rgba(255,255,255,0.9);
    font-size: 14px;
    font-weight: 400;
  }

  .greeting-name {
    color: white;
    font-size: 20px;
    font-weight: 600;
    margin-top: 2px;
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

  /* Stats Cards - Floating */
  .stats-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 0 16px;
    margin-top: -40px;
    position: relative;
    z-index: 10;
  }

  .stat-card {
    background: white;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #f0f0f0;
  }

  .stat-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-icon.blue { background: #E5EEF8; color: #2A6AAA; }
  .stat-icon.green { background: #E5EEF8; color: #2A6AAA; }
  .stat-icon.orange { background: #ffedd5; color: #ea580c; }
  .stat-icon.purple { background: #f3e8ff; color: #9333ea; }

  .stat-label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 400;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: #1f2937;
  }

  .stat-unit {
    font-size: 12px;
    color: #9ca3af;
    font-weight: 400;
    margin-left: 4px;
  }

  /* Section */
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
  }

  .section-action {
    font-size: 13px;
    color: #3E86C7;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* เมนูเข้าระบบเต็ม — หน้าเดสก์ท็อปที่เดิมเข้าได้เฉพาะพิมพ์ URL เอง */
  .full-system-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
    gap: 10px;
  }

  .full-system-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 14px 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    /* ขั้นต่ำ 44px ตามเกณฑ์พื้นที่กดบนจอสัมผัส */
    min-height: 84px;
    justify-content: center;
    color: #374151;
    font-size: 12.5px;
    font-weight: 500;
    text-align: center;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .full-system-item:active {
    background: #f3f4f6;
  }

  .full-system-item svg {
    color: #3E86C7;
    flex: 0 0 auto;
  }

  /* Chart Card */
  .chart-card {
    background: white;
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    border: 1px solid #f0f0f0;
    margin-bottom: 16px;
  }

  .chart-title {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .chart-title-icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Product List */
  .product-list {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    border: 1px solid #f0f0f0;
  }

  .product-list-header {
    background: linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%);
    padding: 14px 16px;
    font-size: 14px;
    font-weight: 600;
    color: #173F6B;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .product-item {
    display: flex;
    align-items: center;
    padding: 14px 16px;
    border-bottom: 1px solid #f3f4f6;
    gap: 12px;
  }

  .product-item:last-child {
    border-bottom: none;
  }

  .product-rank {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: #F3F8FC;
    color: #2A6AAA;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .product-info {
    flex: 1;
    min-width: 0;
  }

  .product-name {
    font-size: 13px;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .product-qty {
    font-size: 11px;
    color: #9ca3af;
    margin-top: 2px;
  }

  .product-total {
    font-size: 14px;
    font-weight: 600;
    color: #2A6AAA;
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
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: #9ca3af;
    font-size: 11px;
    transition: color 0.2s;
  }

  .nav-item.active {
    color: #3E86C7;
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
    border-top-color: #3E86C7;
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

  /* Horizontal Scroll Cards */
  .scroll-container {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding: 4px 16px 16px;
    margin: 0 -16px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  
  .scroll-container::-webkit-scrollbar {
    display: none;
  }

  .mini-chart-card {
    flex: 0 0 280px;
    background: white;
    border-radius: 16px;
    padding: 14px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    border: 1px solid #f0f0f0;
  }

  /* Branch Selector */
  .branch-selector {
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: white;
    margin-top: 10px;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.2);
  }

  .branch-selector select {
    background: transparent;
    border: none;
    color: white;
    font-family: 'Kanit', sans-serif;
    font-size: 13px;
    flex: 1;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }

  .branch-selector select option {
    background: #1f2937;
    color: white;
    font-family: 'Kanit', sans-serif;
  }

  /* KPI Grid */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    padding: 0 16px;
    margin-top: -40px;
    position: relative;
    z-index: 10;
  }

  .kpi-card {
    border-radius: 14px;
    padding: 14px 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    transition: transform 0.2s;
  }

  .kpi-card:active {
    transform: scale(0.97);
  }

  .kpi-card-icon {
    font-size: 16px;
    margin-bottom: 6px;
  }

  .kpi-card-label {
    font-size: 10px;
    color: #64748b;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .kpi-card-value {
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.2;
  }

  .kpi-card-sub {
    font-size: 9px;
    color: #94a3b8;
    margin-top: 2px;
  }

  /* Branch Comparison */
  .branch-compare-section {
    padding: 0 16px;
    margin-top: 16px;
  }

  .branch-compare-title {
    font-size: 14px;
    font-weight: 600;
    color: #334155;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .branch-compare-scroll {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 8px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .branch-compare-scroll::-webkit-scrollbar {
    display: none;
  }

  .branch-card {
    flex: 0 0 200px;
    border-radius: 14px;
    padding: 14px;
    border: 1px solid #e2e8f0;
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }

  .branch-card-name {
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .branch-card-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3px 0;
  }

  .branch-card-label {
    font-size: 11px;
    color: #64748b;
  }

  .branch-card-val {
    font-size: 12px;
    font-weight: 600;
    color: #0f172a;
  }

  /* Refresh Button */
  .refresh-btn {
    width: 36px;
    height: 36px;
    background: rgba(255,255,255,0.2);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .refresh-btn:hover {
    background: rgba(255,255,255,0.3);
  }

  .refresh-btn.spinning svg {
    animation: spin 0.8s linear infinite;
  }
`;

function DashboardPagem() {
    const router = useRouter();
    const { isNavVisible } = useNavLevel();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');
    const [salesummary, setsalesummary] = useState<any[]>([]);
    const [sale_pd_good, setsale_pd_good] = useState<any[]>([]);
    const [sale_group_pd_good, res_group_pd_good] = useState<any[]>([]);
    const [saledaily, setsaledaily] = useState<any[]>([]);
    const [saleresmonth, setsaleresmonth] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const dateInputRef = React.useRef<HTMLInputElement>(null);

    // Branch state
    const [allBranches, setAllBranches] = useState<any[]>([]);
    const [selectedBranch, setSelectedBranch] = useState("all");
    const [branchData, setBranchData] = useState<Record<string, any>>({});
    const [branchLoading, setBranchLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const userLevel = typeof window !== 'undefined' ? localStorage.getItem("level_") || "" : "";
    const BCOLORS = ['#2A6AAA', '#E0762A', '#1F9D6B', '#8B5CF6', '#0E9BB5', '#DB2777'];

    useEffect(() => {
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.background = '#f8fafc';
    }, []);

    useEffect(() => {
        setLoading(false);
    }, []);

    // Fetch branches
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;
                const payload = jwtDecode<any>(token);
                const userId = Number(payload.idcompany);
                const [userRes, connRes] = await Promise.all([
                    axios.get(`/api/login/logins/${userId}`),
                    axios.get(`/api/branchconnection?userId=${userId}&type=all`),
                ]);
                const accepted = connRes.data.filter((c: any) => c.status === "accepted");
                const branches = accepted.map((c: any) => {
                    const isFromUs = c.fromUserId === userId;
                    const branch = isFromUs ? c.toUser : c.fromUser;
                    const localBranchId = Number(branch?.id);
                    const isRemote = !localBranchId || Number.isNaN(localBranchId) || !branch;
                    const bid = isRemote ? c.remoteUserId : localBranchId;
                    if (!bid || (!isRemote && localBranchId === userId)) return null;
                    return {
                        id: bid, companyId: isRemote ? String(c.remoteUserId) : String(localBranchId),
                        dataKey: isRemote ? `remote_${c.id}` : `local_${localBranchId}`,
                        branchName: c.branchName || branch?.company || branch?.name || c.remoteCompany || "ไม่ทราบชื่อ",
                        isRemote, tunnelUrl: c.tunnelUrl || "", remoteUserId: c.remoteUserId || null,
                        remoteCompany: c.remoteCompany || "",
                    };
                }).filter((b: any) => b !== null);
                const currentBranch = {
                    id: userId, companyId: String(userId),
                    companyStr: localStorage.getItem("company_") || userRes.data.company || "",
                    dataKey: `self_${userId}`,
                    branchName: userRes.data.company || localStorage.getItem("cp_") || "สาขาปัจจุบัน",
                    isRemote: false, tunnelUrl: "", remoteUserId: null,
                };
                setAllBranches([currentBranch, ...branches]);
            } catch (error) { console.error("Error fetching branches:", error); }
        };
        fetchBranches();
    }, []);

    // Fetch all branch data
    useEffect(() => {
        if (allBranches.length === 0) return;
        const fetchAllBranchData = async () => {
            setBranchLoading(true);
            const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
            const yr = selectedDate.getFullYear();
            const mo = `${yr}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
            const newData: Record<string, any> = {};
            await Promise.all(allBranches.map(async (branch: any) => {
                const dk = branch.dataKey;
                try {
                    if (branch.isRemote && branch.tunnelUrl) {
                        const rc = branch.remoteUserId;
                        const base = `/api/sale_cal/branch-proxy?tunnelUrl=${encodeURIComponent(branch.tunnelUrl)}`;
                        const [s, d, m, p, g] = await Promise.all([
                            axios.get(`${base}&apiPath=/api/sale_cal/sale_sum&company=${rc}&createDate=${dateStr}`).catch(() => ({ data: [] })),
                            axios.get(`${base}&apiPath=/api/sale_cal/sale_daily&company=${rc}&createDate=${mo}`).catch(() => ({ data: [] })),
                            axios.get(`${base}&apiPath=/api/sale_cal/sale_monthly&company=${rc}&createDate=${yr}`).catch(() => ({ data: [] })),
                            axios.get(`${base}&apiPath=/api/sale_cal/sale_product_good&company=${rc}&createDate=${dateStr}`).catch(() => ({ data: [] })),
                            axios.get(`${base}&apiPath=/api/sale_cal/sale_group&company=${rc}&createDate=${dateStr}`).catch(() => ({ data: [] })),
                        ]);
                        newData[dk] = { summary: s.data?.[0] || {}, daily: d.data || [], monthly: m.data || [], topProducts: p.data || [], groupProducts: g.data || [] };
                    } else {
                        const companyName = branch.companyStr || localStorage.getItem("company_") || "";
                        const res = await axios.get(`/api/sale_cal/sale_branch_summary?company=${encodeURIComponent(companyName)}&createDate=${dateStr}`).catch(() => null);
                        if (res?.data?.summary && Object.keys(res.data.summary).length > 0) {
                            const d = res.data;
                            newData[dk] = { summary: d.summary || {}, daily: d.daily || [], monthly: d.monthly || [], topProducts: d.topProducts || [], groupProducts: d.groupProducts || [] };
                        } else {
                            const [s2, d2, m2, p2, g2] = await Promise.all([
                                axios.get(`/api/sale_cal/sale_sum?company=${encodeURIComponent(companyName)}&createDate=${dateStr}`).catch(() => ({ data: [] })),
                                axios.get(`/api/sale_cal/sale_daily?company=${encodeURIComponent(companyName)}&createDate=${mo}`).catch(() => ({ data: [] })),
                                axios.get(`/api/sale_cal/sale_monthly?company=${encodeURIComponent(companyName)}&createDate=${yr}`).catch(() => ({ data: [] })),
                                axios.get(`/api/sale_cal/sale_product_good?company=${encodeURIComponent(companyName)}&createDate=${dateStr}`).catch(() => ({ data: [] })),
                                axios.get(`/api/sale_cal/sale_group?company=${encodeURIComponent(companyName)}&createDate=${dateStr}`).catch(() => ({ data: [] })),
                            ]);
                            newData[dk] = { summary: s2.data?.[0] || {}, daily: d2.data || [], monthly: m2.data || [], topProducts: p2.data || [], groupProducts: g2.data || [] };
                        }
                    }
                } catch (err) {
                    console.error(`Error fetching data for branch ${branch.id}:`, err);
                    newData[dk] = { summary: {}, daily: [], monthly: [], topProducts: [], groupProducts: [] };
                }
            }));
            setBranchData(newData);
            setBranchLoading(false);
        };
        fetchAllBranchData();
    }, [selectedDate, allBranches]);

    // Also keep original single-company fetch as fallback for salesummary etc.
    useEffect(() => {
        let companyS = localStorage.getItem("company_") || "";
        const fetchData = async () => {
            try {
                const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
                const monthStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;

                const [resSummary, resProducts, resGroups, resDaily, resMonthly] = await Promise.all([
                    axios.get(`/api/sale_cal/sale_sum?company=${companyS}&createDate=${dateStr}`),
                    axios.get(`/api/sale_cal/sale_product_good?company=${companyS}&createDate=${dateStr}`),
                    axios.get(`/api/sale_cal/sale_group?company=${companyS}&createDate=${dateStr}`),
                    axios.get(`/api/sale_cal/sale_daily?company=${companyS}&createDate=${monthStr}`),
                    axios.get(`/api/sale_cal/sale_monthly?company=${companyS}&createDate=${selectedDate.getFullYear()}`)
                ]);

                setsalesummary(resSummary.data);
                setsale_pd_good(resProducts.data);
                res_group_pd_good(resGroups.data);
                setsaledaily(resDaily.data);
                setsaleresmonth(resMonthly.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchData();
    }, [selectedDate]);


    const [user, setUser] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/");
            return;
        }

        try {
            // 🎉 Clean and safe decoding with the library
            const payload = jwtDecode<any>(token);

            const fetchGetIDUser = async () => {
                // ... your existing fetch logic
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
            // Handle cases where the token is malformed or expired
            console.error("Token decoding failed:", error);
            // You might want to log the user out here or redirect them
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

    // Refresh handler
    const handleRefresh = async () => {
        setRefreshing(true);
        setSelectedDate(new Date(selectedDate));
        setTimeout(() => setRefreshing(false), 2000);
    };

    // Branch computed KPIs
    const visible = selectedBranch === "all" ? allBranches : allBranches.filter((b: any) => b.dataKey === selectedBranch);
    const sumF = (field: string) => visible.reduce((s: number, b: any) => s + (Number(branchData[b.dataKey]?.summary?.[field]) || 0), 0);
    const totalRevenue = allBranches.length > 0 ? sumF('revenue') : Number(salesummary[0]?.revenue || 0);
    const totalBills = allBranches.length > 0 ? sumF('bill') : Number(salesummary[0]?.bill || 0);
    const totalCost = allBranches.length > 0 ? sumF('cost') : 0;
    const totalProfit = totalRevenue - totalCost;
    const avgPerBill = totalBills > 0 ? totalRevenue / totalBills : 0;
    const totalCash = allBranches.length > 0 ? sumF('cash') : 0;
    const totalPayment = allBranches.length > 0 ? sumF('payment') : 0;
    const fmt = (n: number) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });

    // Aggregated top products from visible branches
    const branchTopProducts = (() => {
        if (allBranches.length === 0) return sale_pd_good;
        const map = new Map<string, { Id: string; name: string; total: number; qty: number }>();
        visible.forEach((b: any) => {
            (branchData[b.dataKey]?.topProducts || []).forEach((p: any) => {
                const key = p.Id || p.name;
                const existing = map.get(key);
                if (existing) { existing.total += Number(p.total) || 0; existing.qty += Number(p.qty) || 0; }
                else map.set(key, { Id: p.Id, name: p.name, total: Number(p.total) || 0, qty: Number(p.qty) || 0 });
            });
        });
        return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5);
    })();

    // Aggregated group products from visible branches (for doughnut)
    const branchGroupProducts = (() => {
        if (allBranches.length === 0) return sale_group_pd_good;
        const map = new Map<string, { Id: string; total: number; qty: number }>();
        visible.forEach((b: any) => {
            (branchData[b.dataKey]?.groupProducts || []).forEach((g: any) => {
                const key = g.Id || 'ไม่ระบุ';
                const existing = map.get(key);
                if (existing) { existing.total += Number(g.total) || 0; existing.qty += Number(g.qty) || 0; }
                else map.set(key, { Id: key, total: Number(g.total) || 0, qty: Number(g.qty) || 0 });
            });
        });
        return Array.from(map.values()).sort((a, b) => b.total - a.total);
    })();

    // Chart options for mobile
    const mobileChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { family: "Kanit", size: 10 }, color: '#9ca3af', maxRotation: 0 }
            },
            y: {
                display: false,
                grid: { display: false }
            }
        },
        elements: {
            point: { radius: 0, hoverRadius: 4 },
            line: { tension: 0.4, borderWidth: 2 }
        }
    };

    // Helper: match daily record date string to YYYY-MM-DD
    const matchDailyDate = (record: any, dateStr: string) => {
        if (typeof record.date === 'string') {
            if (record.date.includes('-')) return record.date === dateStr;
            if (record.date.includes('/')) {
                const parts = record.date.split('/');
                if (parts.length >= 3) {
                    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}` === dateStr;
                }
            }
        }
        return false;
    };

    // Generate last 7 days labels ending at selected date
    const getLast7DaysLabels = () => {
        const labels = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(selectedDate);
            date.setDate(date.getDate() - i);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            labels.push(`${day}/${month}`);
        }
        return labels;
    };

    // Get aggregated daily sales data from visible branches for last 7 days
    const getLast7DaysData = () => {
        const useBranch = allBranches.length > 0;
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(selectedDate);
            date.setDate(date.getDate() - i);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

            if (useBranch) {
                let sum = 0;
                visible.forEach((b: any) => {
                    const daily = branchData[b.dataKey]?.daily || [];
                    const found = daily.find((r: any) => matchDailyDate(r, dateStr));
                    sum += found ? Number(found.value) || 0 : 0;
                });
                data.push(sum);
            } else {
                const found = saledaily.find((r: any) => matchDailyDate(r, dateStr));
                data.push(found ? Number(found.value) || 0 : 0);
            }
        }
        return data;
    };

    // Aggregated monthly data from visible branches
    const getMonthlyData = () => {
        if (allBranches.length === 0) return { labels: saleresmonth.map((r: any) => r.month), data: saleresmonth.map((r: any) => r.value) };
        const ref = branchData[allBranches[0]?.dataKey]?.monthly || saleresmonth;
        if (ref.length === 0) return { labels: saleresmonth.map((r: any) => r.month), data: saleresmonth.map((r: any) => r.value) };
        const labels = ref.map((d: any) => d.month);
        const data = ref.map((_: any, i: number) => {
            return visible.reduce((s: number, b: any) => s + (Number(branchData[b.dataKey]?.monthly?.[i]?.value) || 0), 0);
        });
        return { labels, data };
    };

    const monthlyAgg = getMonthlyData();

    const dailyChartData = {
        labels: getLast7DaysLabels(),
        datasets: [{
            data: getLast7DaysData(),
            borderColor: '#3E86C7',
            backgroundColor: 'rgba(62, 134, 199, 0.1)',
            fill: true,
        }]
    };

    const monthlyChartData = {
        labels: monthlyAgg.labels,
        datasets: [{
            data: monthlyAgg.data,
            borderColor: '#3E86C7',
            backgroundColor: 'rgba(62, 134, 199, 0.1)',
            fill: true,
        }]
    };

    const formattedDate = selectedDate.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Handle date change from date picker
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = new Date(e.target.value);
        if (!isNaN(newDate.getTime())) {
            setSelectedDate(newDate);
        }
    };

    // Open native date picker
    const openDatePicker = () => {
        dateInputRef.current?.showPicker();
    };

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
                        <div>
                            <div className="greeting">สวัสดี {(user as any)?.name || localStorage.getItem("person_") || "ผู้ใช้"} 👋</div>
                            <div className="greeting-name">{(user as any)?.company || localStorage.getItem("cp_") || "ร้านค้า"}</div>
                        </div>
                        <div className="header-actions">
                            <button className={`refresh-btn ${refreshing ? 'spinning' : ''}`} onClick={handleRefresh} title="รีเฟรช">
                                <RefreshCw size={18} color="white" />
                            </button>
                            <button className="logout-btn" onClick={handleLogout} title="ออกจากระบบ">
                                <LogOut size={20} color="white" />
                            </button>
                        </div>
                    </div>

                    <div className="date-selector" onClick={openDatePicker} style={{ cursor: 'pointer' }}>
                        <Calendar size={18} />
                        <div className="date-selector-text">{formattedDate}</div>
                        <ChevronRight size={18} />
                        <input
                            ref={dateInputRef}
                            type="date"
                            value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`}
                            onChange={handleDateChange}
                            style={{
                                position: 'absolute',
                                opacity: 0,
                                width: 0,
                                height: 0,
                                padding: 0,
                                border: 'none',
                            }}
                        />
                    </div>

                    {/* Branch Selector */}
                    {allBranches.length > 1 && (
                        <div className="branch-selector">
                            <Building2 size={16} />
                            <select
                                value={selectedBranch}
                                onChange={e => setSelectedBranch(e.target.value)}
                            >
                                <option value="all">ทุกสาขา ({allBranches.length})</option>
                                {allBranches.map((b: any, i: number) => (
                                    <option key={b.dataKey} value={b.dataKey}>
                                        {i === 0 ? `⭐ ${b.branchName}` : b.branchName}{b.isRemote ? ' 🌐' : ''}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={14} style={{ opacity: 0.7 }} />
                        </div>
                    )}
                </div>

                {/* KPI Cards - 3 column grid */}
                <div className="kpi-grid">
                    <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)', border: '1px solid #CCDFF1' }}>
                        <div className="kpi-card-icon">💰</div>
                        <div className="kpi-card-label">ยอดขายรวม</div>
                        <div className="kpi-card-value">{fmt(totalRevenue)}</div>
                        <div className="kpi-card-sub">บาท</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)', border: '1px solid #CCDFF1' }}>
                        <div className="kpi-card-icon">📋</div>
                        <div className="kpi-card-label">จำนวนบิล</div>
                        <div className="kpi-card-value">{fmt(totalBills)}</div>
                        <div className="kpi-card-sub">บิล</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1px solid #fde68a' }}>
                        <div className="kpi-card-icon">📊</div>
                        <div className="kpi-card-label">เฉลี่ย/บิล</div>
                        <div className="kpi-card-value">{fmt(avgPerBill)}</div>
                        <div className="kpi-card-sub">บาท</div>
                    </div>
                    {userLevel !== "level1" && (
                        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)', border: '1px solid #CCDFF1' }}>
                            <div className="kpi-card-icon">📈</div>
                            <div className="kpi-card-label">กำไร</div>
                            <div className="kpi-card-value">{fmt(totalProfit)}</div>
                            <div className="kpi-card-sub">บาท</div>
                        </div>
                    )}
                    <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', border: '1px solid #e9d5ff' }}>
                        <div className="kpi-card-icon">💵</div>
                        <div className="kpi-card-label">เงินสด</div>
                        <div className="kpi-card-value">{fmt(totalCash)}</div>
                        <div className="kpi-card-sub">บาท</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', border: '1px solid #fecdd3' }}>
                        <div className="kpi-card-icon">🏦</div>
                        <div className="kpi-card-label">โอน</div>
                        <div className="kpi-card-value">{fmt(totalPayment)}</div>
                        <div className="kpi-card-sub">บาท</div>
                    </div>
                </div>

                {/* Branch Comparison */}
                {allBranches.length > 1 && selectedBranch === "all" && (
                    <div className="branch-compare-section">
                        <div className="branch-compare-title">
                            <Building2 size={16} color="#334155" />
                            เปรียบเทียบสาขา
                        </div>
                        {branchLoading ? (
                            <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: 13 }}>⏳ กำลังโหลด...</div>
                        ) : (
                            <div className="branch-compare-scroll">
                                {allBranches.map((b: any, idx: number) => {
                                    const sd = branchData[b.dataKey]?.summary || {};
                                    const rev = Number(sd.revenue) || 0;
                                    const cost2 = Number(sd.cost) || 0;
                                    const profit2 = rev - cost2;
                                    const bills2 = Number(sd.bill) || 0;
                                    const avg2 = bills2 > 0 ? rev / bills2 : 0;
                                    const clr = BCOLORS[idx % BCOLORS.length];
                                    return (
                                        <div key={b.dataKey} className="branch-card" style={{ borderTop: `3px solid ${clr}` }}>
                                            <div className="branch-card-name">
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: clr, display: 'inline-block', flexShrink: 0 }}></span>
                                                {idx === 0 ? `${b.branchName} ⭐` : b.branchName}
                                                {b.isRemote && <Globe size={12} color="#94a3b8" />}
                                            </div>
                                            <div className="branch-card-row">
                                                <span className="branch-card-label">ยอดขาย</span>
                                                <span className="branch-card-val" style={{ color: clr }}>{fmt(rev)} ฿</span>
                                            </div>
                                            <div className="branch-card-row">
                                                <span className="branch-card-label">บิล</span>
                                                <span className="branch-card-val">{fmt(bills2)}</span>
                                            </div>
                                            {userLevel !== "level1" && (
                                                <div className="branch-card-row">
                                                    <span className="branch-card-label">กำไร</span>
                                                    <span className="branch-card-val" style={{ color: profit2 >= 0 ? '#147F56' : '#ef4444' }}>{fmt(profit2)} ฿</span>
                                                </div>
                                            )}
                                            <div className="branch-card-row">
                                                <span className="branch-card-label">เฉลี่ย/บิล</span>
                                                <span className="branch-card-val">{fmt(avg2)} ฿</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Charts Section */}
                <div className="section">
                    <div className="section-header">
                        <div className="section-title">📊 สถิติการขาย</div>
                    </div>

                    <div className="scroll-container">
                        <div className="mini-chart-card">
                            <div className="chart-title">
                                <div className="chart-title-icon" style={{ background: '#E5EEF8' }}>
                                    <BarChart3 size={16} color="#2A6AAA" />
                                </div>
                                ยอดขายรายวัน (7 วันล่าสุด)
                            </div>
                            <div style={{ height: 120 }}>
                                <Line options={mobileChartOptions as any} data={dailyChartData} />
                            </div>
                        </div>

                        <div className="mini-chart-card">
                            <div className="chart-title">
                                <div className="chart-title-icon" style={{ background: '#E5EEF8' }}>
                                    <TrendingUp size={16} color="#2A6AAA" />
                                </div>
                                ยอดขายรายเดือน
                            </div>
                            <div style={{ height: 120 }}>
                                <Line options={mobileChartOptions as any} data={monthlyChartData} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Best Sellers */}
                <div className="section">
                    <div className="section-header">
                        <div className="section-title">🏆 สินค้าขายดี</div>
                    </div>

                    <div className="product-list">
                        <div className="product-list-header">
                            <TrendingUp size={16} />
                            Top 5 {selectedBranch === "all" && allBranches.length > 1 ? "ทุกสาขา" : "วันนี้"}
                        </div>
                        {(branchTopProducts.length > 0 ? branchTopProducts : sale_pd_good).slice(0, 5).map((item: any, index: number) => (
                            <div key={item.Id || index} className="product-item">
                                <div className="product-rank">{index + 1}</div>
                                <div className="product-info">
                                    <div className="product-name">{item.name}</div>
                                    <div className="product-qty">{item.qty} ชิ้น</div>
                                </div>
                                <div className="product-total">฿{Number(item.total).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Category Chart */}
                {(branchGroupProducts.length > 0 || sale_group_pd_good.length > 0) && (
                    <div className="section">
                        <div className="section-header">
                            <div className="section-title">📦 กลุ่มสินค้าขายดี</div>
                        </div>
                        <div className="chart-card">
                            <div style={{ height: 200 }}>
                                <Doughnut
                                    data={{
                                        labels: (branchGroupProducts.length > 0 ? branchGroupProducts : sale_group_pd_good).map((w: any) => w.Id),
                                        datasets: [{
                                            data: (branchGroupProducts.length > 0 ? branchGroupProducts : sale_group_pd_good).map((w: any) => w.total),
                                            backgroundColor: [
                                                '#3E86C7', '#3E86C7', '#f59e0b', '#8b5cf6', '#ec4899',
                                                '#06b6d4', '#f97316', '#14b8a6', '#6366f1'
                                            ],
                                            borderWidth: 0,
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'right',
                                                labels: { font: { family: 'Kanit', size: 11 }, boxWidth: 12, padding: 8 }
                                            }
                                        },
                                        cutout: '65%'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* เข้าระบบเต็ม — หน้าเหล่านี้เปิดบนแท็บเล็ตได้อยู่แล้ว แต่เดิมไม่มีทางกดเข้า
                    ต้องพิมพ์ URL เอง เมนูนี้เลยเปิดทางให้ใช้ได้ครบทั้งระบบจากแท็บเล็ต */}
                <div className="section" style={{ paddingBottom: 96 }}>
                    <div className="section-header">
                        <div className="section-title">🗂️ ระบบเต็ม</div>
                    </div>
                    <div className="full-system-grid">
                        {[
                            { label: 'ขาย (เต็ม)', path: '/web/sales', icon: <ShoppingCart size={22} /> },
                            { label: 'สินค้า', path: '/web/dataproduct', icon: <Box size={22} /> },
                            { label: 'รับสินค้า', path: '/web/receives', icon: <PackagePlus size={22} /> },
                            { label: 'รายงาน', path: '/web/reports', icon: <BarChart3 size={22} /> },
                            { label: 'ลูกค้า', path: '/web/customers', icon: <Star size={22} /> },
                            { label: 'ผู้จำหน่าย', path: '/web/suppliers', icon: <Building2 size={22} /> },
                            { label: 'เอกสาร', path: '/web/document', icon: <Receipt size={22} /> },
                            { label: 'โปรโมชัน', path: '/web/promotion', icon: <Wallet size={22} /> },
                            { label: 'สต๊อก', path: '/web/stocktransaction', icon: <ClipboardList size={22} /> },
                            { label: 'ตั้งค่า', path: '/web/setting', icon: <PieChart size={22} /> },
                        ].map((item) => (
                            <div
                                key={item.path}
                                className="full-system-item"
                                onClick={() => router.push(item.path)}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Navigation */}
                <div className="bottom-nav">
                    {isNavVisible('P1') && <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
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

export default DashboardPagem;
