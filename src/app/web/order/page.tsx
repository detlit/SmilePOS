
'use client'

import React, { useEffect, useState, ChangeEvent, KeyboardEvent, use, useMemo, lazy, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import MenuTab_Small from "../componant/menutab_small.tsx"
import HeadTab from "../componant/headtab.jsx"
import styles from "./../componant/mystyle.module.css"
import axios from 'axios'
import { toThaiDateString } from '@/utils/dateUtils'
import { usePermission } from '@/utils/usePermission'
import * as XLSX from 'xlsx'

// Lazy-load chart.js — only downloaded when chart is actually rendered
const ChartLoadingFallback = () => (
  <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Kanit', color: '#94a3b8' }}>กำลังโหลดกราฟ...</div>
);
const LazyBar = dynamic(
  () => Promise.all([
    import('chart.js'),
    import('react-chartjs-2'),
  ]).then(([chartMod, chartReact]) => {
    chartMod.Chart.register(
      chartMod.CategoryScale, chartMod.LinearScale, chartMod.BarElement,
      chartMod.Title, chartMod.Tooltip, chartMod.Legend
    );
    return { default: chartReact.Bar };
  }),
  { ssr: false, loading: () => <ChartLoadingFallback /> }
);

const widths = 80;
import { Table } from 'react-bootstrap';
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { BarChart3, CalendarDays, Check, AArrowDown, ChevronDownIcon, ChevronsDown, ClipboardList, Key, Package, Printer, Rocket, Save, Search, ShoppingCart, Slice, Store, Trash2, Wallet } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Toaster, toast } from 'sonner'
import CreateMainOrder from '../receives/createorder.tsx'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
//*************************************************** */

const formatOrderCost = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toLocaleString('th-TH', { maximumFractionDigits: 2 }) : '-';
}

function OrderPage() {

  useEffect(() => {

    // change background color with a random color
    const color = localStorage.getItem("bgcolor") || ""
    document.body.style.background = color;


  }, []);



  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedOrderId = searchParams.get('orderId');


  // HTML จาก server อ่าน localStorage ไม่ได้ ค่าจึงต้องเป็น false ในเรนเดอร์แรกของ client ด้วย
  // ไม่งั้น React hydrate ไม่ตรงกับ HTML ที่ server ส่งมา ("Hydration failed ...")
  // พอ mount แล้วค่อยอ่านค่าจริง — แนวเดียวกับ hasPermission ใน usePermission
  const [isLevel2, setIsLevel2] = useState(false)
  useEffect(() => {
    setIsLevel2(String(localStorage.getItem('level_') || '') === 'level2')
  }, [])
  const { hasPermission } = usePermission()
  const canViewCostComparison = isLevel2 || hasPermission("E2")

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



  const [sale_pd_good, setsale_pd_good] = useState([])
  const [sale_group_pd_good, res_group_pd_good] = useState([])

  const [Al, SetAl] = useState<number>(30)

  const [dailySalesData, setDailySalesData] = useState<any[]>([])
  const [selectedProductName, setSelectedProductName] = useState("")
  const [budget, setBudget] = useState("")
  const [nextOrderDate, setNextOrderDate] = useState<Date | undefined>(undefined)

  const [orderPlanningList, setOrderPlanningList] = useState<any[]>([])
  const [baseOrderPlanningList, setBaseOrderPlanningList] = useState<any[]>([])
  const [isPlanningLoading, setIsPlanningLoading] = useState(false)
  const [isLocalStorageLoaded, setIsLocalStorageLoaded] = useState(false)

  // LocalStorage key constants
  const LS_ORDER_PLANNING_KEY = 'order_planning_list'
  const LS_BASE_ORDER_PLANNING_KEY = 'base_order_planning_list'

  // Load orderPlanningList from localStorage on mount
  useEffect(() => {
    try {
      const savedOrderList = localStorage.getItem(LS_ORDER_PLANNING_KEY)
      const savedBaseList = localStorage.getItem(LS_BASE_ORDER_PLANNING_KEY)

      if (savedOrderList) {
        const parsedOrderList = JSON.parse(savedOrderList)
        if (Array.isArray(parsedOrderList) && parsedOrderList.length > 0) {
          setOrderPlanningList(parsedOrderList)
        }
      }

      if (savedBaseList) {
        const parsedBaseList = JSON.parse(savedBaseList)
        if (Array.isArray(parsedBaseList) && parsedBaseList.length > 0) {
          setBaseOrderPlanningList(parsedBaseList)
        }
      }
    } catch (error) {
      console.error('Error loading order planning from localStorage:', error)
    } finally {
      setIsLocalStorageLoaded(true)
    }
  }, [])

  // Save orderPlanningList to localStorage whenever it changes (after initial load)
  useEffect(() => {
    if (!isLocalStorageLoaded) return

    try {
      if (orderPlanningList.length > 0) {
        localStorage.setItem(LS_ORDER_PLANNING_KEY, JSON.stringify(orderPlanningList))
      } else {
        localStorage.removeItem(LS_ORDER_PLANNING_KEY)
      }
    } catch (error) {
      console.error('Error saving order planning to localStorage:', error)
    }
  }, [orderPlanningList, isLocalStorageLoaded])

  // Save baseOrderPlanningList to localStorage whenever it changes (after initial load)
  useEffect(() => {
    if (!isLocalStorageLoaded) return

    try {
      if (baseOrderPlanningList.length > 0) {
        localStorage.setItem(LS_BASE_ORDER_PLANNING_KEY, JSON.stringify(baseOrderPlanningList))
      } else {
        localStorage.removeItem(LS_BASE_ORDER_PLANNING_KEY)
      }
    } catch (error) {
      console.error('Error saving base order planning to localStorage:', error)
    }
  }, [baseOrderPlanningList, isLocalStorageLoaded])

  const [yAxisMax, setYAxisMax] = useState<number | undefined>(undefined)
  const [tempMax, setTempMax] = useState("")
  const [globalSearch, setGlobalSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")

  const [debouncedProductSearch, setDebouncedProductSearch] = useState("")
  const [debouncedGlobalSearch, setDebouncedGlobalSearch] = useState("")

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedProductSearch(productSearch)
    }, 300)
    return () => clearTimeout(handler)
  }, [productSearch])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedGlobalSearch(globalSearch)
    }, 300)
    return () => clearTimeout(handler)
  }, [globalSearch])

  const [filterBelowROP, setFilterBelowROP] = useState(false)
  const [filterBelowMin, setFilterBelowMin] = useState(false)

  const filteredProducts = useMemo(() => {
    return sale_pd_good.filter((w: any) => {
      const matchSearch = w.Id?.toString().toLowerCase().includes(debouncedProductSearch.toLowerCase()) ||
        w.name?.toLowerCase().includes(debouncedProductSearch.toLowerCase())
      if (!matchSearch) return false
      if (filterBelowROP) {
        if (!w.ROP || w.ROP <= 0) return false
        if (w.balance >= w.ROP) return false
      }
      if (filterBelowMin) {
        if (!w.Min || w.Min <= 0) return false
        if (w.balance >= w.Min) return false
      }
      return true
    })
  }, [sale_pd_good, debouncedProductSearch, filterBelowROP, filterBelowMin])

  const filteredRecommendations = useMemo(() => {
    return orderPlanningList.filter((item: any) =>
    (item.itemcode?.toString().toLowerCase().includes(debouncedGlobalSearch.toLowerCase()) ||
      item.itemName?.toLowerCase().includes(debouncedGlobalSearch.toLowerCase()))
    )
  }, [orderPlanningList, debouncedGlobalSearch])

  const plannedItemCodes = useMemo(() => new Set(orderPlanningList.map((i: any) => String(i.itemcode))), [orderPlanningList])

  const [suppliers, setSuppliers] = useState<any[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState("")

  const [activeTab, setActiveTab] = useState("analysis") // "analysis" or "data"
  const [savedOrders, setSavedOrders] = useState<any[]>([])
  const [isOrdersLoading, setIsOrdersLoading] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

  useEffect(() => {
    if (requestedOrderId) {
      setActiveTab('data')
    }
  }, [requestedOrderId])

  useEffect(() => {
    if (!requestedOrderId || savedOrders.length === 0) return
    const parsedOrderId = Number(requestedOrderId)
    if (!Number.isFinite(parsedOrderId)) return
    const matchedOrder = savedOrders.find((order: any) => Number(order?.id) === parsedOrderId)
    if (matchedOrder) {
      setSelectedOrderId(matchedOrder.id)
    }
  }, [requestedOrderId, savedOrders])

  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState<any>(null);

  const fetchSuppliers = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/supplier?company=${companyS}&fields=list`)
      setSuppliers(res.data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchSuppliers()
    fetchSavedOrders()
  }, [])

  const fetchOrderPlanning = async () => {
    if (!nextOrderDate) return;
    let companyS = (localStorage.getItem("company_") || "")
    setIsPlanningLoading(true)
    setSelectedSupplier("")
    try {
      const res = await axios.get(`/api/sale_cal/order_planning?company=${companyS}&nextOrderDate=${nextOrderDate.toISOString()}`)
      setOrderPlanningList(res.data)
      setBaseOrderPlanningList(res.data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsPlanningLoading(false)
    }
  }

  const generateRecommendation = async () => {
    if (!nextOrderDate) {
      alert("กรุณาเลือกวันสั่งสินค้าถัดไป");
      return;
    }
    let companyS = (localStorage.getItem("company_") || "")
    const daysToOrder = calculateDaysRemaining(nextOrderDate);
    setIsPlanningLoading(true)
    setSelectedSupplier("")
    try {
      const res = await axios.get(`/api/sale_cal/order_recommendation?company=${companyS}&daysToOrder=${daysToOrder}&beforeday=${Al}`)
      const rawResults = res.data;

      // Apply Budget constraint on results already sorted by priorityQty desc in API
      let currentTotal = 0;
      const budgetNum = budget === "" ? Infinity : (Number(budget) || 0);
      const filteredResults = [];

      for (const item of rawResults) {
        if (currentTotal + item.totalSuggestedCost <= budgetNum) {
          filteredResults.push(item);
          currentTotal += item.totalSuggestedCost;
        } else {
          // If cost + item exceeds budget, we skip this item and continue as there might be cheaper items down the priority list
          continue;
        }
      }

      setOrderPlanningList(filteredResults);
      setBaseOrderPlanningList(filteredResults);
    } catch (error) {
      console.error(error)
    } finally {
      setIsPlanningLoading(false)
    }
  }

  const updateSuggestedQty = (itemcode: string, newQty: number) => {
    setOrderPlanningList(prev => prev.map(item => {
      if (item.itemcode === itemcode) {
        const updatedQty = Math.max(0, newQty);
        return {
          ...item,
          suggestedQty: updatedQty,
          totalSuggestedCost: updatedQty * (item.newCost || 0)
        };
      }
      return item;
    }));
  };

  const handleAddManualRecommendation = (w: any) => {
    if (!nextOrderDate) {
      alert("กรุณาเลือกวันสั่งสินค้าถัดไป");
      return;
    }

    const daysToOrder = calculateDaysRemaining(nextOrderDate);
    const suggestedQty = Math.ceil(Number(w.avg) * daysToOrder * 1.25);
    const latestVendor = w.rc && w.rc.length > 0 ? w.rc[0] : null;
    const newCost = latestVendor ? latestVendor.newCost : 0;
    const totalSuggestedCost = suggestedQty * newCost;

    const newItem = {
      itemcode: w.Id,
      itemName: w.name,
      newCost: newCost,
      balance: w.balance,
      dailyAvg: Number(w.avg),
      priorityQty: w.qty,
      suggestedQty: suggestedQty,
      totalSuggestedCost: Number(totalSuggestedCost.toFixed(2))
    };

    const updateFn = (prev: any[]) => {
      const exists = prev.find(item => item.itemcode === newItem.itemcode);
      if (exists) {
        return prev.map(item => item.itemcode === newItem.itemcode ? newItem : item);
      }
      return [...prev, newItem];
    };

    setOrderPlanningList(updateFn);
    setBaseOrderPlanningList(updateFn);

    toast.success(`เพิ่ม ${w.name} ลงในรายการแนะนำแล้ว`);
  };

  useEffect(() => {
    if (nextOrderDate) {
      fetchOrderPlanning()
    }
  }, [nextOrderDate])

  const handleRemoveRecommendation = (itemcode: string) => {
    const filterFn = (prev: any[]) => prev.filter(item => item.itemcode !== itemcode);
    setOrderPlanningList(filterFn);
    setBaseOrderPlanningList(filterFn);
    toast.error("ลบรายการออกจากรายการแนะนำแล้ว");
  };

  const handleSupplierChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const supplierId = e.target.value;
    setSelectedSupplier(supplierId);

    if (!supplierId) {
      // No supplier selected: revert to base costs (latest receiving cost)
      const reverted = baseOrderPlanningList.map(item => ({
        ...item,
        newCost: item.baseCost ?? item.newCost,
        totalSuggestedCost: Number((item.suggestedQty * ((item.baseCost ?? item.newCost) || 0)).toFixed(2))
      }));
      setOrderPlanningList(reverted);
      return;
    }

    const supplier = suppliers.find(s => String(s.id) === supplierId);
    const leadtime = supplier?.leadtime ? Number(supplier.leadtime) : 0;
    const supplierCode = supplier?.code || "";
    const budgetNum = budget === "" ? Infinity : (Number(budget) || 0);

    // Fetch supplier-specific costs
    let supplierCostMap: Record<string, number> = {};
    if (supplierCode) {
      try {
        const companyS = localStorage.getItem("company_") || "";
        const res = await axios.get(`/api/sale_cal/supplier_costs?company=${companyS}&supplierCode=${encodeURIComponent(supplierCode)}`);
        supplierCostMap = res.data;
      } catch (error) {
        console.error("Error fetching supplier costs:", error);
      }
    }

    // 1. Always start from the BASE list to avoid accumulating leadtimes
    const updatedList = baseOrderPlanningList.map(item => {
      // Use supplier cost if available, otherwise fall back to base cost (latest receiving cost)
      const baseCost = item.baseCost ?? item.newCost;
      const costForSupplier = (supplierCode && supplierCostMap[item.itemcode] !== undefined)
        ? supplierCostMap[item.itemcode]
        : baseCost;

      let newQty = item.suggestedQty;
      if (leadtime > 0) {
        const rawQty = leadtime * (item.dailyAvg || 0);
        // Custom rounding: decimal <= 0.5 round down, > 0.5 round up
        const addedQty = (rawQty % 1 <= 0.5) ? Math.floor(rawQty) : Math.ceil(rawQty);
        newQty = item.suggestedQty + addedQty;
      }

      return {
        ...item,
        baseCost: baseCost, // preserve original cost for fallback
        newCost: costForSupplier,
        suggestedQty: newQty,
        totalSuggestedCost: Number((newQty * (costForSupplier || 0)).toFixed(2))
      };
    });

    // 2. Re-apply budget filter starting from the top of the list
    let currentTotal = 0;
    const filteredResults = [];

    for (const item of updatedList) {
      if (currentTotal + item.totalSuggestedCost <= budgetNum) {
        filteredResults.push(item);
        currentTotal += item.totalSuggestedCost;
      }
    }

    setOrderPlanningList(filteredResults);
    if (leadtime > 0) {
      toast.success(`อัปเดตรายการสินค้าตาม Leadtime ${leadtime} วัน และราคาทุนของร้านค้าเรียบร้อยแล้ว`);
    } else {
      toast.success(`อัปเดตราคาทุนตามร้านค้าเรียบร้อยแล้ว`);
    }
  };

  const fetchSavedOrders = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    setIsOrdersLoading(true)
    try {
      const res = await axios.get(`/api/order?company=${companyS}`)
      setSavedOrders(res.data)
    } catch (error) {
      console.error(error)
      toast.error("ไม่สามารถโหลดข้อมูลการสั่งซื้อได้")
    } finally {
      setIsOrdersLoading(false)
    }
  }

  const handleSaveOrder = async () => {
    if (!selectedSupplier) {
      toast.warning("กรุณาเลือกร้านค้าก่อนบันทึก");
      return;
    }
    if (orderPlanningList.length === 0) {
      toast.warning("ไม่มีรายการสินค้าให้บันทึก");
      return;
    }

    const companyS = localStorage.getItem("company_") || "";
    const person = localStorage.getItem("person_") || "";
    const supplier = suppliers.find(s => String(s.id) === selectedSupplier);

    // Generate orderNo and orderfull according to formulas
    const dt = new Date();
    const year = dt.getFullYear();
    const month = (dt.getMonth() + 1).toString().padStart(2, "0");
    const day = dt.getDate().toString().padStart(2, "0");
    const orderNo = String(year) + String(month) + String(day);

    // Calculate maxRecN from savedOrders
    // We filter for today's orders and extract the sequence number from orderfull
    const todayOrders = savedOrders.filter((o: any) => o.orderNo === orderNo);
    const sequences = todayOrders.map((o: any) => {
      if (!o.orderfull) return 100;
      const seqStr = o.orderfull.replace(orderNo, "");
      const seqNum = Number(seqStr);
      return isNaN(seqNum) ? 100 : seqNum;
    });

    const maxRec = sequences.length > 0 ? Math.max(...sequences) : -Infinity;
    const maxRecN = maxRec === -Infinity || isNaN(maxRec) ? 100 : maxRec + 1;
    const orderfull = orderNo + String(maxRecN);

    const orderData = {
      company: companyS,
      orderNo: orderNo,
      orderfull: orderfull,
      supplierId: selectedSupplier,
      supplierCode: supplier?.code || "",
      supplierName: supplier?.names || "",
      totalAmount: orderPlanningList.reduce((sum, item) => sum + item.totalSuggestedCost, 0),
      person: person,
      remark: "",
      items: orderPlanningList
    };

    try {
      const res = await axios.post('/api/order', orderData);
      if (res.status === 200) {
        toast.success("บันทึกการสั่งซื้อเรียบร้อยแล้ว");
        setOrderPlanningList([]);
        setBaseOrderPlanningList([]);

        // Clear localStorage after successful save
        localStorage.removeItem(LS_ORDER_PLANNING_KEY);
        localStorage.removeItem(LS_BASE_ORDER_PLANNING_KEY);

        fetchSavedOrders(); // Refresh list if on the other tab
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกการสั่งซื้อ");
    }
  };

  const handleReceiveOrder = async () => {
    if (!selectedOrderId) return;
    const order = savedOrders.find(o => o.id === selectedOrderId);
    if (!order) return;

    setReceivingOrder(order);
    setIsReceiveModalOpen(true);
  };

  const handleReceiveSuccess = async () => {
    if (!selectedOrderId) return;

    try {
      const res = await axios.put('/api/order', {
        orderId: selectedOrderId,
        status: "Received"
      });

      if (res.status === 200) {
        toast.success("รับสินค้าและอัปเดตสถานะใบสั่งซื้อเรียบร้อยแล้ว");
        fetchSavedOrders(); // Refresh list
        setIsReceiveModalOpen(false);
        router.push('/web/receives');
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะการสั่งซื้อ");
    }
  };

  const handleDeleteOrderDetail = async (itemId: number) => {
    if (!confirm("คุณต้องการลบรายการสินค้านี้ใช่หรือไม่?")) return;

    try {
      const res = await axios.delete(`/api/order/detail?id=${itemId}`);
      if (res.status === 200) {
        toast.success("ลบรายการสินค้าเรียบร้อยแล้ว");
        fetchSavedOrders(); // Refresh the main list and the order details via state update from fetchSavedOrders
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการลบรายการสินค้า");
    }
  };

  const handleUpdateOrderDetailQty = async (itemId: number, newQty: number) => {
    if (newQty < 0) return;

    try {
      const res = await axios.put('/api/order/detail', {
        id: itemId,
        qty: newQty
      });

      if (res.status === 200) {
        fetchSavedOrders(); // Refresh to get recalculated totals
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดตจำนวนสินค้า");
    }
  };

  useEffect(() => {
    if (activeTab === "data") {
      fetchSavedOrders()
    }
  }, [activeTab])

  const calculateDaysRemaining = (selectedDate: Date | undefined) => {
    if (!selectedDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(selectedDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  const fetchDailySales = async (codeProduct: string, productName: string) => {
    let companyS = (localStorage.getItem("company_") || "")
    setSelectedProductName(productName)
    try {
      const res = await axios.get(`/api/sale_cal/daily_sale_product?company=${companyS}&codeProduct=${codeProduct}`)
      setDailySalesData(res.data)
    } catch (error) {
      console.error(error)
    }
  }

  const chartData = {
    labels: dailySalesData.map(d => d.label || d.day?.toString() || ""),
    datasets: [
      {
        label: `จำนวนขายรวมรายวัน: ${selectedProductName}`,
        data: dailySalesData.map(d => d.totalQty),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: 'Kanit',
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'วิเคราะห์จำนวนขายรวมรายวัน (เดือนปัจจุบันและเดือนก่อนหน้า)',
        font: {
          family: 'Kanit',
          size: 14,
          weight: 'bold' as const
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `ยอดขายรวม: ${context.raw} units`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: yAxisMax,
        ticks: {
          font: {
            family: 'Kanit',
            size: 10
          }
        }
      },
      x: {
        ticks: {
          font: {
            family: 'Kanit',
            size: 10
          }
        }
      }
    }
  };

  //******* */ Year********/ 
  const AlInput = (e: any) => {
    let value = parseInt(e.target.value);
    if (isNaN(value)) value = 1;
    if (value > 150) value = 150;
    if (value < 1) value = 1;
    SetAl(value);
  }


  const curmonth = toThaiDateString();

  const getPreviousDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return toThaiDateString(d);
  };


  useEffect(() => {
    let companyS = (localStorage.getItem("company_") || "")
    const fetchPostsz = async () => {
      try {

        const startDate = getPreviousDate(Al);
        const res_product_good = await axios.get(`/api/sale_cal/sale_analysis?company=${companyS}&startMonth=${startDate}&current=${curmonth}&days=${Al}`)
        const res_group_good = await axios.get(`/api/sale_cal/sale_analysis_group?company=${companyS}&startMonth=${startDate}&current=${curmonth}`)

        setsale_pd_good(res_product_good.data)
        res_group_pd_good(res_group_good.data)

      } catch (error) {
        console.error(error)
      }

    }
    fetchPostsz()

  }, [Al])



  // Inline styles for professional look
  const orderStyles = {
    mainContainer: {
      background: 'linear-gradient(145deg, #f8f9fa, #ffffff)',
      minHeight: '100vh',
      padding: '0 15px',
    },
    contentCard: {
      background: 'linear-gradient(145deg, #ffffff, #fafafa)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e0e0e0',
      overflow: 'hidden',
      margin: '12px 0',
    },
    cardHeader: {
      background: '#f0f7ff',
      color: '#1a4b8c',
      fontFamily: 'Kanit',
      fontSize: '14px',
      fontWeight: 600,
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      letterSpacing: '0.5px',
      borderBottom: '1px solid #e1e8ed',
    },
    cardHeaderIcon: {
      marginRight: '8px',
      fontSize: '16px',
    },
    filterContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 20px',
      background: '#ffffff',
      borderBottom: '1px solid #e0e0e0',
    },
    filterLabel: {
      fontFamily: 'Kanit',
      fontSize: '13px',
      color: '#455a64',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    filterSelect: {
      fontFamily: 'Kanit',
      fontSize: '13px',
      padding: '8px 32px 8px 14px',
      borderRadius: '8px',
      border: '1px solid #90caf9',
      background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
      color: '#1565c0',
      fontWeight: 500,
      cursor: 'pointer',
      outline: 'none',
      boxShadow: '0 2px 8px rgba(21, 101, 192, 0.1)',
      transition: 'all 0.2s ease',
      minWidth: '150px',
    },
    tableContainer: {
      padding: '0',
      overflowX: 'auto' as const,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      fontFamily: 'Kanit',
    },
    tableHeader: {
      background: '#f8fafc',
    },
    tableHeaderCell: {
      color: '#475569',
      fontFamily: 'Kanit_B',
      fontSize: '12px',
      fontWeight: 600,
      textAlign: 'center' as const,
      padding: '2px 10px',
      borderBottom: '2px solid #e2e8f0',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    tableRow: {
      borderBottom: '1px solid #e8e8e8',
      transition: 'all 0.2s ease',
    },
    tableRowEven: {
      backgroundColor: '#fafafa',
    },
    tableRowOdd: {
      backgroundColor: '#ffffff',
    },
    tableCell: {
      fontFamily: 'Kanit',
      fontSize: '13px',
      padding: '2px 10px',
      verticalAlign: 'middle' as const,
      borderBottom: 'none',
    },
    tableCellNo: {
      color: '#94a3b8',
      fontFamily: 'Kanit',
      fontSize: '13px',
      textAlign: 'center' as const,
      padding: '2px 10px',
      fontWeight: 600,
    },
    tableCellCode: {
      color: '#2A6AAA',
      fontFamily: 'Kanit_B',
      fontSize: '13px',
      fontWeight: 600,
      padding: '2px 10px',
    },
    tableCellName: {
      color: '#1e293b',
      fontFamily: 'Kanit',
      fontSize: '13px',
      padding: '2px 10px',
      maxWidth: '220px',
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      lineHeight: '1.4',
    },
    tableCellNumber: {
      color: '#2A6AAA',
      fontFamily: 'Kanit_B',
      fontSize: '13px',
      textAlign: 'center' as const,
      padding: '2px 10px',
      fontWeight: 600,
    },
    tableCellBalance: {
      fontFamily: 'Kanit_B',
      fontSize: '13px',
      textAlign: 'center' as const,
      padding: '2px 10px',
      fontWeight: 600,
    },
    priceCard: {
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '1px 4px',
      width: '62px',
      minWidth: '62px',
      maxWidth: '62px',
      textAlign: 'center' as const,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease',
    },
    priceVendor: {
      color: '#1e293b',
      fontFamily: 'Kanit_B',
      fontSize: '8px',
      lineHeight: '1.05',
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      letterSpacing: '0px',
      marginBottom: '0px',
    },
    priceValue: {
      color: '#ef4444',
      fontFamily: 'Kanit_B',
      fontSize: '10px',
      fontWeight: 600,
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '40px 20px',
      color: '#90a4ae',
      fontFamily: 'Kanit',
      fontSize: '14px',
    },
    chartPlaceholder: {
      background: 'linear-gradient(145deg, #ffffff, #f5f5f5)',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e0e0e0',
      padding: '20px',
      minHeight: '250px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '12px 0',
    },
    sectionTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    badge: {
      background: 'rgba(26, 75, 140, 0.1)',
      color: '#1a4b8c',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 500,
    },
    planningInput: {
      fontSize: '12px',
      padding: '5px 8px',
      borderRadius: '8px',
      border: '1px solid #90caf9',
      background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
      color: '#1565c0',
      fontWeight: 500,
      outline: 'none',
      width: '100px',
      transition: 'all 0.2s ease',
    },
    planningLabel: {
      fontSize: '12px',
      color: '#455a64',
      fontWeight: 500,
      marginLeft: '5px',
    },
    searchInput: {
      fontFamily: 'Kanit',
      fontSize: '12px',
      padding: '5px 32px 5px 12px',
      borderRadius: '8px',
      border: '1px solid #90caf9',
      background: '#ffffff',
      color: '#1a4b8c',
      outline: 'none',
      width: '200px',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    },
    searchIcon: {
      position: 'absolute' as const,
      right: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#90caf9',
      pointerEvents: 'none' as const,
    },
    daysRemainingBadge: {
      background: '#1565c0',
      color: '#ffffff',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
      boxShadow: '0 2px 4px rgba(21, 101, 192, 0.2)',
    }
  };

  const activeTabStyle = {
    background: 'linear-gradient(145deg, #1e293b, #0f172a)',
    color: '#ffffff',
    border: 'none',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
  };

  const inactiveTabStyle = {
    background: '#ffffff',
    color: '#64748b',
    border: '1px solid #e2e8f0',
  };

  return (

    <>
      <Toaster position="top-center" richColors />

      <div style={orderStyles.mainContainer}>
        <div className="row justify-content-start " >
          <HeadTab />
        </div>

        <div className="row justify-content-start " >

          <div className="col-sm-1" >
            <MenuTab_Small />
          </div>

          <div className="col-sm-11">
            <div className='row '>

              {/* Tab Navigation Buttons */}
              <div className="col-12 mt-2 mb-1">
                <div className={styles.orderTabShell} style={{
                  display: 'flex',
                  gap: '10px',
                  background: 'rgba(241, 245, 249, 0.5)',
                  padding: '6px',
                  borderRadius: '12px',
                  width: 'fit-content',
                  border: '1px solid #e2e8f0'
                }}>
                  <button
                    onClick={() => setActiveTab("analysis")}
                    style={{
                      fontFamily: 'Kanit',
                      fontSize: '13px',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      ...(activeTab === "analysis" ? activeTabStyle : inactiveTabStyle)
                    }}
                  >
                    <BarChart3 size={15} strokeWidth={2.4} /> วิเคราะห์การสั่งสินค้า
                  </button>
                  <button
                    onClick={() => setActiveTab("data")}
                    style={{
                      fontFamily: 'Kanit',
                      fontSize: '13px',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      ...(activeTab === "data" ? activeTabStyle : inactiveTabStyle)
                    }}
                  >
                    <ClipboardList size={15} strokeWidth={2.4} /> ข้อมูลสั่งสินค้า
                  </button>
                </div>
              </div>

              {activeTab === "analysis" ? (
                <>
                  <div className={`col-sm-7 mt-1 ${styles.orderAnalysisLeftColumn}`}>

                    {/* Main Content Card */}
                    <div className={`${styles.orderWorkspaceCard} ${styles.orderProductsCard}`} style={orderStyles.contentCard}>

                      {/* Card Header */}
                      <div className={styles.orderWorkspaceHeader} style={orderStyles.cardHeader}>
                        <div className={styles.orderWorkspaceTitle} style={orderStyles.sectionTitle}>
                          <span className={styles.orderWorkspaceTitleIcon} style={orderStyles.cardHeaderIcon}><Package size={15} strokeWidth={2.4} /></span>
                          <span>ข้อมูลสินค้า</span>
                          <span style={orderStyles.badge}>{sale_pd_good.length} รายการ</span>
                        </div>
                        <div style={{ position: 'relative', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="ค้นหาสินค้า..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            style={{ ...orderStyles.searchInput, width: '160px' }}
                          />
                        </div>
                      </div>

                      <div className={styles.orderFilterBar} style={orderStyles.filterContainer}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' as const, overflowX: 'auto' as const }}>
                          <span style={{ ...orderStyles.filterLabel, fontSize: '12px' }}>
                            <Search size={13} strokeWidth={2.3} /> วิเคราะห์:
                          </span>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                              type="number"
                              value={Al}
                              onChange={AlInput}
                              min={1}
                              max={150}
                              style={{ ...orderStyles.filterSelect, padding: '5px 35px 5px 8px', minWidth: '80px', width: '80px' }}
                            />
                            <span style={{
                              position: 'absolute',
                              right: '10px',
                              fontFamily: 'Kanit',
                              fontSize: '11px',
                              color: '#1565c0',
                              pointerEvents: 'none'
                            }}>วัน</span>
                          </div>

                          <span style={orderStyles.planningLabel}><Wallet size={13} strokeWidth={2.3} /> งบ:</span>
                          <input
                            type="text"
                            placeholder="0.00"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            style={orderStyles.planningInput}
                          />

                          <span style={orderStyles.planningLabel}><CalendarDays size={13} strokeWidth={2.3} /> สั่งถัดไป:</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                style={{
                                  ...orderStyles.filterSelect,
                                  minWidth: '110px',
                                  fontSize: '12px',
                                  justifyContent: 'flex-start',
                                  textAlign: 'left',
                                  padding: '5px 8px',
                                  height: 'auto'
                                }}
                              >
                                {nextOrderDate ? (
                                  nextOrderDate.toLocaleDateString('th-TH')
                                ) : (
                                  <span style={{ color: '#90caf9' }}>เลือกวันที่</span>
                                )}
                                <ChevronDownIcon className="ml-auto h-3 w-3 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={nextOrderDate}
                                onSelect={setNextOrderDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>

                          <span style={{ ...orderStyles.daysRemainingBadge, padding: '3px 8px' }}>
                            {calculateDaysRemaining(nextOrderDate)}
                          </span>

                          <Button
                            onClick={generateRecommendation}
                            style={{
                              background: 'linear-gradient(145deg, #2A6AAA, #1E5088)',
                              color: 'white',
                              fontFamily: 'Kanit',
                              fontSize: '11px',
                              padding: '3px 12px',
                              height: 'auto',
                              borderRadius: '8px',
                              border: 'none',
                              boxShadow: '0 2px 4px rgba(22, 163, 174, 0.2)',
                              marginLeft: '10px'
                            }}
                          >
                            <Rocket size={13} strokeWidth={2.4} /> สร้างรายการสั่งสินค้า
                          </Button>
                        </div>
                      </div>

                      {/* Table Section */}
                      <div className={styles.orderProductTableFrame} style={orderStyles.tableContainer}>
                        <table className={`${styles.orderProductTable} ${canViewCostComparison ? styles.orderProductTableWithPrices : styles.orderProductTableBasic}`} style={orderStyles.table}>
                          <thead style={orderStyles.tableHeader}>
                            <tr>
                              <th style={{ ...orderStyles.tableHeaderCell, width: '5%' }}>ลำดับ</th>

                              <th style={{ ...orderStyles.tableHeaderCell, width: '30px', textAlign: 'left' as const }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span>รายการสินค้า</span>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '9px', fontWeight: 400, color: '#d32f2f', cursor: 'pointer' }}>
                                      <input type="checkbox" checked={filterBelowROP} onChange={(e) => setFilterBelowROP(e.target.checked)} style={{ width: '12px', height: '12px', cursor: 'pointer', accentColor: '#d32f2f' }} />
                                      ต่ำกว่า ROP
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '9px', fontWeight: 400, color: '#1565c0', cursor: 'pointer' }}>
                                      <input type="checkbox" checked={filterBelowMin} onChange={(e) => setFilterBelowMin(e.target.checked)} style={{ width: '12px', height: '12px', cursor: 'pointer', accentColor: '#1565c0' }} />
                                      ต่ำกว่า MIN
                                    </label>
                                  </div>
                                </div>
                              </th>
                              <th style={{ ...orderStyles.tableHeaderCell, width: '7%' }}>จำนวน/<br/>ยอดขาย</th>

                              <th style={{ ...orderStyles.tableHeaderCell, width: '7%' }}>จำนวนต่อวัน</th>
                              <th style={{ ...orderStyles.tableHeaderCell, width: '9%' }}>ยอดคงเหลือ</th>
                              {canViewCostComparison && <th style={{ ...orderStyles.tableHeaderCell, width: '24%' }}>ราคาซัพพลายเออร์</th>}
                              <th style={{ ...orderStyles.tableHeaderCell, width: '9%' }}>Action</th>
                            </tr>
                          </thead>

                          <tbody>
                            {filteredProducts.length === 0 ? (
                              <tr>
                                <td colSpan={canViewCostComparison ? 7 : 6} style={orderStyles.emptyState}>
                                  ไม่พบข้อมูลที่ค้นหา
                                </td>
                              </tr>
                            ) : (
                              filteredProducts
                                .map((w: any, index: number) => (
                                  <tr
                                    key={w.Id}
                                    onClick={() => fetchDailySales(w.Id, w.name)}
                                    style={{
                                      ...orderStyles.tableRow,
                                      ...(index % 2 === 0 ? orderStyles.tableRowEven : orderStyles.tableRowOdd),
                                      cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fafafa' : '#ffffff';
                                    }}
                                  >
                                    <td style={orderStyles.tableCellNo}>{w.no}</td>
                                    <td style={orderStyles.tableCellCode}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                          <div style={{ fontSize: 12, lineHeight: '1.2' }}>{w.Id}</div>
                                          <div style={{ fontSize: 12, color: '#646464ff', lineHeight: '1.2' }}>{w.name}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px', fontSize: 10, color: '#78909c', whiteSpace: 'nowrap', fontWeight: 400, marginLeft: '8px' }}>
                                          {w.Min ? <span>Min:<span style={{ color: '#d32f2f', fontWeight: 600 }}>{w.Min}</span></span> : null}
                                          {w.Max ? <span>Max:<span style={{ color: '#173F6B', fontWeight: 600 }}>{w.Max}</span></span> : null}
                                          {w.ROP ? <span>ROP:<span style={{ color: '#f57c00', fontWeight: 600 }}>{w.ROP}</span></span> : null}
                                        </div>
                                      </div>
                                    </td>
                                    <td style={orderStyles.tableCellNumber}>
                                      <div style={{ fontSize: 14, fontWeight: 600, lineHeight: '1.2' }}>{w.qty.toLocaleString()}</div>
                                      <div style={{ color: '#646464ff', fontSize: 11, lineHeight: '1.1' }}>{w.total.toLocaleString()}</div>
                                    </td>

                                    <td style={{ ...orderStyles.tableCellNumber, color: '#646464ff' }}>{w.avg.toLocaleString()}</td>
                                    <td style={{
                                      ...orderStyles.tableCellBalance, fontSize: 14,
                                      color: w.balance <= 0 ? '#d32f2f' : w.balance < 10 ? '#f57c00' : '#0C5238'
                                    }}>{w.balance.toLocaleString()}</td>

                                    {canViewCostComparison && (
                                      <td style={{ ...orderStyles.tableCell, padding: '3px 5px' }}>
                                        <div className={styles.orderPriceQuotes}>
                                          {(w.rc || []).slice(0, 3).filter(Boolean).map((quote: any, quoteIndex: number) => (
                                            <div
                                              key={`${w.Id}-supplier-price-${quoteIndex}`}
                                              className={styles.orderPriceQuote}
                                              title={`${quote.namevender || '-'} ${formatOrderCost(quote.newCost)} บาท`}
                                            >
                                              <span className={styles.orderPriceVendor}>{quote.namevender || '-'}</span>
                                              <span className={styles.orderPriceValue}>{formatOrderCost(quote.newCost)} บาท</span>
                                            </div>
                                          ))}
                                          {(!w.rc || w.rc.length === 0) && <span className={styles.orderPriceEmpty}>-</span>}
                                        </div>
                                      </td>
                                    )}

                                    <td style={{ ...orderStyles.tableCellNumber, padding: '2px', textAlign: 'center' }}>
                                      {!plannedItemCodes.has(String(w.Id)) && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddManualRecommendation(w);
                                          }}
                                          style={{
                                            background: '#858484ff',
                                            color: '#ffffffff',
                                            fontFamily: 'Kanit',
                                            fontSize: '11px',
                                            fontWeight: 400,
                                            padding: '2px 10px',
                                            height: '24px',
                                            width: '38px',
                                            borderRadius: '6px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                            transition: 'all 0.2s',
                                          }}

                                        >
                                          เพิ่ม
                                        </button>
                                      )}
                                      {w.isPending && (
                                        <div style={{
                                          fontSize: '10px',
                                          color: '#ef4444',
                                          fontFamily: 'Kanit',
                                          marginTop: '2px',
                                          fontWeight: 500,
                                          lineHeight: '1'
                                        }}>
                                          รอรับสินค้า
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>

                  <div className={`col-sm-5 mt-1 ${styles.orderAnalysisRightColumn}`}>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        top: '25px',
                        left: '25px',
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <input
                          type="text"
                          value={tempMax}
                          onChange={(e) => setTempMax(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (tempMax.trim() === "") {
                                setYAxisMax(undefined);
                              } else {
                                const val = Number(tempMax);
                                if (!isNaN(val)) setYAxisMax(val);
                              }
                            }
                          }}
                          placeholder="Max"
                          style={{
                            width: '45px',
                            fontSize: '10px',
                            padding: '2px 4px',
                            border: '1px solid #90caf9',
                            borderRadius: '4px',
                            textAlign: 'center',
                            outline: 'none',
                            fontFamily: 'Kanit'
                          }}
                        />
                      </div>
                    </div>
                    <div className={styles.orderChartPanel} style={orderStyles.chartPlaceholder}>
                      {dailySalesData.length > 0 ? (
                        <div style={{ width: '100%', height: '230px' }}>
                          <LazyBar data={chartData} options={chartOptions} />
                        </div>
                      ) : (
                        <span style={{ color: '#90a4ae', fontFamily: 'Kanit', fontSize: '14px', textAlign: 'center' }}>
                          กรุณาเลือกสินค้าในตารางเพื่อดูกราฟวิเคราะห์ยอดขาย<br />
                          (ข้อมูลรวมรายวันย้อนหลัง เดือนปัจจุบันและเดือนก่อนหน้า)
                        </span>
                      )}
                    </div>

                    {/* Supplier Selection Dropdown */}
                    <div className={styles.orderSupplierBar} style={{
                      padding: '10px 16px',
                      background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                      border: '1px solid #e2e8f0',
                      marginTop: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#475569',
                        fontFamily: 'Kanit',
                        fontSize: '12px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap'
                      }}>
                        <Store size={14} strokeWidth={2.4} />
                        <span>เลือกร้านค้า:</span>
                      </div>
                      <select
                        value={selectedSupplier}
                        onChange={handleSupplierChange}
                        style={{
                          flex: 1,
                          fontFamily: 'Kanit',
                          fontSize: '11px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#1e293b',
                          outline: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#1a4b8c'}
                        onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                      >
                        <option value="">-- กรุณาเลือกร้านค้า / Supplier --</option>
                        {suppliers.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            [{s.code}] {s.names} | Leadtime: {s.leadtime || 0} วัน
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={handleSaveOrder}
                        disabled={!selectedSupplier}
                        style={{
                          background: !selectedSupplier ? '#cbd5e1' : 'linear-gradient(145deg, #2A6AAA, #1E5088)',
                          color: '#ffffffff',
                          fontFamily: 'Kanit',
                          fontSize: '11px',
                          fontWeight: 500,
                          padding: '6px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: !selectedSupplier ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                          whiteSpace: 'nowrap',
                          opacity: !selectedSupplier ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedSupplier) return;
                          e.currentTarget.style.background = '#28526eff';
                          e.currentTarget.style.borderColor = '#267ea7ff';
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedSupplier) return;
                          e.currentTarget.style.background = 'linear-gradient(145deg, #2A6AAA, #1E5088)';
                          e.currentTarget.style.borderColor = '#1E5088';
                        }}
                      >
                        <Save size={13} strokeWidth={2.4} /> บันทึกการสั่งซื้อ
                      </button>
                    </div>

                    {/* Order Planning List Card */}
                    <div className={`${styles.orderWorkspaceCard} ${styles.orderRecommendationCard}`} style={{ ...orderStyles.contentCard, marginTop: '12px' }}>
                      <div className={styles.orderWorkspaceHeader} style={orderStyles.cardHeader}>
                        <div className={styles.orderWorkspaceTitle} style={orderStyles.sectionTitle}>
                          <span className={styles.orderWorkspaceTitleIcon} style={orderStyles.cardHeaderIcon}><ShoppingCart size={15} strokeWidth={2.4} /></span>
                          <span>รายการสั่งสินค้าแนะนำ</span>
                          <span style={orderStyles.badge}>{orderPlanningList.length} รายการ</span>
                        </div>
                        <div style={{ position: 'relative', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="ค้นหาสินค้า..."
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                            style={{ ...orderStyles.searchInput, width: '160px' }}
                          />
                          {isPlanningLoading && <span style={{ fontSize: '11px', color: '#1a4b8c' }}>กำลังคำนวณ...</span>}
                        </div>
                      </div>

                      <div className={styles.orderRecommendationTableFrame} style={{ ...orderStyles.tableContainer, maxHeight: '480px', overflowY: 'auto' as const }}>
                        <table className={styles.orderRecommendationTable} style={orderStyles.table}>
                          <thead style={{ ...orderStyles.tableHeader, position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr>
                              <th style={{ ...orderStyles.tableHeaderCell, width: '10%' }}>ลำดับ</th>
                              <th style={{ ...orderStyles.tableHeaderCell, width: '35%', textAlign: 'left' as const }}>รายการ</th>
                              <th style={{ ...orderStyles.tableHeaderCell, width: '15%' }}>จำนวน</th>
                              {isLevel2 && <th style={{ ...orderStyles.tableHeaderCell, width: '25%' }}>รวม (ทุน)</th>}
                              <th style={{ ...orderStyles.tableHeaderCell, width: '15%' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRecommendations.length === 0 ? (
                              <tr>
                                <td colSpan={isLevel2 ? 5 : 4} style={orderStyles.emptyState}>
                                  {nextOrderDate ? "ไม่พบข้อมูลที่ค้นหา" : "กรุณาเลือกวันสั่งสินค้าครั้งถัดไป"}
                                </td>
                              </tr>
                            ) : (
                              filteredRecommendations
                                .sort((a, b) => (a.itemName || '').localeCompare(b.itemName || '', 'th'))
                                .map((item, idx) => (
                                  <tr key={item.itemcode} style={idx % 2 === 0 ? orderStyles.tableRowEven : orderStyles.tableRowOdd}>
                                    <td style={orderStyles.tableCellNo}>{idx + 1}</td>
                                    <td style={orderStyles.tableCellName}>
                                      <div style={{ fontSize: '11px', color: '#1a4b8c' }}>{item.itemcode}</div>
                                      <div style={{ fontSize: '12px', fontWeight: 500 }}>{item.itemName}</div>
                                    </td>
                                    <td style={orderStyles.tableCellNumber}>
                                      <input
                                        type="number"
                                        min="0"
                                        value={item.suggestedQty}
                                        onChange={(e) => updateSuggestedQty(item.itemcode, Number(e.target.value))}
                                        style={{
                                          width: '60px',
                                          padding: '2px 4px',
                                          borderRadius: '6px',
                                          border: '1px solid #2A6AAA',
                                          textAlign: 'center',
                                          fontSize: '13px',
                                          color: '#2A6AAA',
                                          fontFamily: 'Kanit_B',
                                          fontWeight: 600,
                                          outline: 'none',
                                          background: '#F3F8FC'
                                        }}
                                      />
                                    </td>
                                    {isLevel2 && <td style={orderStyles.tableCellBalance}>
                                      {item.totalSuggestedCost.toLocaleString()}
                                    </td>}
                                    <td style={{ ...orderStyles.tableCell, textAlign: 'center' }}>
                                      <button
                                        onClick={() => handleRemoveRecommendation(item.itemcode)}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: '#ef4444',
                                          cursor: 'pointer',
                                          padding: '4px',
                                          borderRadius: '4px',
                                          transition: 'all 0.2s',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          margin: '0 auto'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#fee2e2';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                            )}
                          </tbody>

                        </table>
                      </div>

                      {/* Summary Section */}
                      <div style={{
                        padding: '12px 20px',
                        borderTop: '1px solid #e0e0e0',
                        background: '#f8fafc',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ fontFamily: 'Kanit', fontSize: '13px', fontWeight: 600 }}>
                          ยอดรวมประมาณการ:
                          <span style={{
                            marginLeft: '8px',
                            fontSize: '16px',
                            color: (Number(budget) > 0 && orderPlanningList.reduce((sum, item) => sum + item.totalSuggestedCost, 0) > Number(budget)) ? '#d32f2f' : '#1e293b'
                          }}>
                            {orderPlanningList.reduce((sum, item) => sum + item.totalSuggestedCost, 0).toLocaleString()} บาท
                          </span>
                        </div>
                        {Number(budget) > 0 && (
                          <div style={{
                            fontSize: '11px',
                            color: orderPlanningList.reduce((sum, item) => sum + item.totalSuggestedCost, 0) > Number(budget) ? '#d32f2f' : '#0C5238',
                            fontFamily: 'Kanit'
                          }}>
                            {orderPlanningList.reduce((sum, item) => sum + item.totalSuggestedCost, 0) > Number(budget)
                              ? '⚠️ เกินงบประมาณ'
                              : '✅ อยู่ในงบประมาณ'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-12 mt-2">
                  <div className="row">
                    {/* Master: Order List (Left) */}
                    <div className="col-md-5">
                      <div style={orderStyles.contentCard}>
                        <div style={orderStyles.cardHeader}>
                          <div style={orderStyles.sectionTitle}>
                            <span style={orderStyles.cardHeaderIcon}>📜</span>
                            <span>ประวัติการสั่งสินค้า</span>
                            <span style={orderStyles.badge}>{savedOrders.length} รายการ</span>
                          </div>
                          {isOrdersLoading && <span style={{ fontSize: '11px', color: '#1a4b8c' }}>กำลังโหลด...</span>}
                        </div>

                        <div style={{ ...orderStyles.tableContainer, maxHeight: '600px', overflowY: 'auto' as const }}>
                          <table style={orderStyles.table}>
                            <thead style={{ ...orderStyles.tableHeader, position: 'sticky', top: 0, zIndex: 1 }}>
                              <tr>
                                <th style={{ ...orderStyles.tableHeaderCell, width: '20%' }}>วันที่</th>
                                <th style={{ ...orderStyles.tableHeaderCell, width: '20%' }}>Order No.</th>
                                <th style={{ ...orderStyles.tableHeaderCell, width: '40%', textAlign: 'left' as const }}>ผู้ขาย / Supplier</th>
                                <th style={{ ...orderStyles.tableHeaderCell, width: '20%' }}>สถานะ</th>
                                {isLevel2 && <th style={{ ...orderStyles.tableHeaderCell, width: '20%' }}>รวม (บาท)</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {savedOrders.length === 0 ? (
                                <tr>
                                  <td colSpan={4} style={orderStyles.emptyState}>
                                    ไม่พบข้อมูลการสั่งซื้อ
                                  </td>
                                </tr>
                              ) : (
                                savedOrders.map((order, idx) => (
                                  <tr
                                    key={order.id}
                                    onClick={() => setSelectedOrderId(order.id)}
                                    style={{
                                      ...(idx % 2 === 0 ? orderStyles.tableRowEven : orderStyles.tableRowOdd),
                                      cursor: 'pointer',
                                      backgroundColor: selectedOrderId === order.id ? '#E5EEF8' : undefined,
                                      borderLeft: selectedOrderId === order.id ? '4px solid #2A6AAA' : '4px solid transparent',
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    <td style={{ ...orderStyles.tableCellNo, fontSize: '11px', textAlign: 'left', paddingLeft: '15px' }}>
                                      {new Date(order.createDate).toLocaleDateString('th-TH')}
                                      <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                                        {new Date(order.createDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    </td>
                                    <td style={{ ...orderStyles.tableCell, fontSize: '11px', fontWeight: 600, color: '#1a4b8c' }}>
                                      {order.orderfull}
                                    </td>
                                    <td style={orderStyles.tableCellName}>
                                      <div style={{ fontSize: '12px', fontWeight: 500 }}>{order.supplierName}</div>
                                      <div style={{ fontSize: '10px', color: '#64748b' }}>{order.person}</div>
                                    </td>
                                    <td style={{ ...orderStyles.tableCell, textAlign: 'center' }}>
                                      <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '11px',
                                        background: order.status === 'Pending' ? '#fef9c3' : order.status === 'Acknowledged' ? '#E5EEF8' : '#D3F0E2',
                                        color: order.status === 'Pending' ? '#854d0e' : order.status === 'Acknowledged' ? '#173F6B' : '#0C5238',
                                        border: `1px solid ${order.status === 'Pending' ? '#facc15' : order.status === 'Acknowledged' ? '#A6C8E7' : '#43B283'}`
                                      }}>
                                        {order.status === 'Pending' ? 'รอดำเนินการ' : order.status === 'Acknowledged' ? 'รับทราบแล้ว' : 'ได้รับสินค้าแล้ว'}
                                      </span>
                                    </td>
                                    {isLevel2 && <td style={{ ...orderStyles.tableCellBalance, textAlign: 'right', paddingRight: '15px' }}>
                                      {order.totalAmount?.toLocaleString()}
                                    </td>}
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Detail: Order Items (Right) */}
                    <div className="col-md-7">
                      <div style={{ ...orderStyles.contentCard, borderColor: '#2A6AAA', borderStyle: 'dashed' }}>
                        <div style={{ ...orderStyles.cardHeader, background: '#F3F8FC' }}>
                          <div style={orderStyles.sectionTitle}>
                            <span style={orderStyles.cardHeaderIcon}>🔍</span>
                            <span>รายละเอียดการสั่งสินค้า</span>
                            {selectedOrderId && (
                              <span style={orderStyles.badge}>
                                จำนวน {savedOrders.find(o => o.id === selectedOrderId)?.items?.length || 0} รายการ
                              </span>
                            )}
                          </div>
                          {selectedOrderId && (
                            <button
                              onClick={() => {
                                const order = savedOrders.find((o: any) => o.id === selectedOrderId)
                                if (!order) return
                                const companyName = localStorage.getItem('cp_') || localStorage.getItem('company_') || ''
                                const personName = localStorage.getItem('person_') || ''
                                const items = (order.items || []).sort((a: any, b: any) => (a.itemName || '').localeCompare(b.itemName || ''))
                                const totalAmount = order.totalAmount || items.reduce((s: number, i: any) => s + (i.total || 0), 0)
                                const orderDate = order.createDate ? new Date(order.createDate) : new Date()
                                const thDate = orderDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })

                                const printWindow = window.open('', '_blank', 'width=800,height=1000')
                                if (!printWindow) return
                                printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>ใบสั่งซื้อสินค้า ${order.orderfull || ''}</title><style>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
@page { size: A4 portrait; margin: 15mm 12mm 15mm 12mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Sarabun', sans-serif; color: #1a1a1a; font-size: 13px; line-height: 1.5; background: #fff; }
.page { width: 100%; max-width: 210mm; margin: 0 auto; padding: 0; }
.header { text-align: center; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 3px solid #1a4b8c; }
.header h1 { font-size: 22px; font-weight: 700; color: #1a4b8c; letter-spacing: 2px; margin-bottom: 2px; }
.header .subtitle { font-size: 13px; color: #64748b; font-weight: 400; }
.info-grid { display: flex; justify-content: space-between; margin-bottom: 14px; gap: 16px; }
.info-box { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; }
.info-box .label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; font-weight: 600; }
.info-box .value { font-size: 13px; font-weight: 600; color: #1e293b; }
table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
table thead th { background: #1a4b8c; color: #fff; font-weight: 600; font-size: 12px; padding: 8px 10px; text-align: center; }
table thead th:first-child { border-radius: 6px 0 0 0; }
table thead th:last-child { border-radius: 0 6px 0 0; }
table tbody td { padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #e2e8f0; }
table tbody tr:nth-child(even) { background: #f8fafc; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-left { text-align: left; }
.item-code { color: #1a4b8c; font-weight: 600; font-size: 11px; }
.item-name { font-size: 12px; color: #334155; }
.total-row { background: #F3F8FC !important; border-top: 2px solid #1a4b8c; }
.total-row td { font-weight: 700; font-size: 14px; padding: 10px; color: #1a4b8c; }
.footer { margin-top: 30px; display: flex; justify-content: space-between; padding: 0 30px; }
.sign-box { text-align: center; width: 200px; }
.sign-line { border-bottom: 1px solid #64748b; margin-bottom: 6px; height: 50px; }
.sign-label { font-size: 11px; color: #64748b; }
.print-info { text-align: center; margin-top: 30px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page { max-width: none; } }
</style></head><body>
<div class="page">
  <div class="header">
    <h1>ใบสั่งซื้อสินค้า</h1>
    <div class="subtitle">PURCHASE ORDER</div>
  </div>
  <div class="info-grid">
    <div class="info-box">
      <div class="label">ร้านค้า / Company</div>
      <div class="value">${companyName || '-'}</div>
    </div>
    <div class="info-box">
      <div class="label">เลขที่ใบสั่งซื้อ / Order No.</div>
      <div class="value">${order.orderfull || '-'}</div>
    </div>
    <div class="info-box">
      <div class="label">วันที่ / Date</div>
      <div class="value">${thDate}</div>
    </div>
  </div>
  <div class="info-grid">
    <div class="info-box">
      <div class="label">ผู้ขาย / Supplier</div>
      <div class="value">${order.supplierName || '-'}</div>
    </div>
    <div class="info-box">
      <div class="label">ผู้สั่งซื้อ / Ordered By</div>
      <div class="value">${personName || order.person || '-'}</div>
    </div>
    <div class="info-box">
      <div class="label">สถานะ / Status</div>
      <div class="value">${order.status === 'Pending' ? 'รอดำเนินการ' : order.status === 'Acknowledged' ? 'รับทราบแล้ว' : 'ได้รับสินค้าแล้ว'}</div>
    </div>
  </div>
  <table>
    <thead><tr>
      <th style="width:6%">ลำดับ</th>
      <th style="width:14%">รหัสสินค้า</th>
      <th style="width:40%;text-align:left">รายการสินค้า</th>
      <th style="width:10%">จำนวน</th>
      <th style="width:15%">ราคา/หน่วย</th>
      <th style="width:15%">รวม (บาท)</th>
    </tr></thead>
    <tbody>
      ${items.map((item: any, idx: number) => `<tr>
        <td class="text-center">${idx + 1}</td>
        <td class="text-center item-code">${item.itemcode || '-'}</td>
        <td class="text-left item-name">${item.itemName || '-'}</td>
        <td class="text-center">${(item.qty || 0).toLocaleString()}</td>
        <td class="text-right">${(item.cost || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td class="text-right">${(item.total || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      </tr>`).join('')}
      <tr class="total-row">
        <td colspan="5" class="text-right">ยอดรวมทั้งสิ้น</td>
        <td class="text-right">${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</td>
      </tr>
    </tbody>
  </table>
  <div style="text-align:right;font-size:12px;color:#64748b;margin-bottom:4px">จำนวนรายการทั้งหมด: ${items.length} รายการ</div>
  <div class="footer">
    <div class="sign-box"><div class="sign-line"></div><div class="sign-label">ผู้สั่งซื้อ</div><div class="sign-label">(${personName || '............................'})</div></div>
    <div class="sign-box"><div class="sign-line"></div><div class="sign-label">ผู้อนุมัติ</div><div class="sign-label">(............................)</div></div>
    <div class="sign-box"><div class="sign-line"></div><div class="sign-label">ผู้รับสินค้า</div><div class="sign-label">(............................)</div></div>
  </div>
  <div class="print-info">พิมพ์เมื่อ ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} | SmileStore POS</div>
</div>
</body></html>`)
                                printWindow.document.close()
                                setTimeout(() => { printWindow.print() }, 500)
                              }}
                              style={{
                                background: 'linear-gradient(145deg, #7c3aed, #6d28d9)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 12px',
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontFamily: 'Kanit',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(124, 58, 237, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(124, 58, 237, 0.2)';
                              }}
                            >
                              <Printer size={13} />
                              <span>Print</span>
                            </button>
                          )}
                          {selectedOrderId && (
                            <button
                              onClick={() => {
                                const order = savedOrders.find(o => o.id === selectedOrderId)
                                if (!order?.items?.length) return
                                const exportData = order.items.sort((a: any, b: any) => a.itemName.localeCompare(b.itemName)).map((item: any, idx: number) => ({
                                  'ลำดับ': idx + 1,
                                  'รหัส': item.itemcode || '',
                                  'รายการสินค้า': item.itemName || '',
                                  'จำนวน': item.qty || 0,
                                  'ราคา/หน่วย': item.cost || 0,
                                  'รวม': item.total || 0,
                                }))
                                const ws = XLSX.utils.json_to_sheet(exportData)
                                const wb = XLSX.utils.book_new()
                                XLSX.utils.book_append_sheet(wb, ws, 'รายการสั่งซื้อ')
                                XLSX.writeFile(wb, `รายการสั่งซื้อ_${order.id}_${new Date().toISOString().slice(0, 10)}.xlsx`)
                              }}
                              style={{
                                background: 'linear-gradient(145deg, #2A6AAA, #1E5088)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 12px',
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontFamily: 'Kanit',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 4px rgba(42, 106, 170, 0.2)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(42, 106, 170, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(42, 106, 170, 0.2)';
                              }}
                            >
                              <span>📊</span>
                              <span>Export Excel</span>
                            </button>
                          )}
                          {selectedOrderId && ['Pending', 'Acknowledged'].includes(savedOrders.find(o => o.id === selectedOrderId)?.status) && (
                            <button
                              onClick={handleReceiveOrder}
                              style={{
                                background: 'linear-gradient(145deg, #3E86C7, #2A6AAA)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 12px',
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontFamily: 'Kanit',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 4px rgba(62, 134, 199, 0.2)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(62, 134, 199, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(62, 134, 199, 0.2)';
                              }}
                            >
                              <span>📦</span>
                              <span>รับสินค้า</span>
                            </button>
                          )}
                        </div>

                        <div style={{ ...orderStyles.tableContainer, minHeight: '400px', maxHeight: '600px', overflowY: 'auto' as const }}>
                          <table style={orderStyles.table}>
                            <thead style={{ ...orderStyles.tableHeader, position: 'sticky', top: 0, zIndex: 1 }}>
                              <tr>
                                <th style={{ ...orderStyles.tableHeaderCell, width: '7%', textAlign: 'center' as const }}>ลำดับ</th>
                                <th style={{ ...orderStyles.tableHeaderCell, width: '12%' }}>รหัส</th>
                                <th style={{ ...orderStyles.tableHeaderCell, width: '36%', textAlign: 'left' as const }}>รายการสินค้า</th>
                                <th style={{ ...orderStyles.tableHeaderCell, width: '12%' }}>จำนวน</th>
                                {isLevel2 && <th style={{ ...orderStyles.tableHeaderCell, width: '13%' }}>ราคา/หน่วย</th>}
                                {isLevel2 && <th style={{ ...orderStyles.tableHeaderCell, width: '12%' }}>รวม</th>}
                                <th style={{ ...orderStyles.tableHeaderCell, width: '8%', textAlign: 'center' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {!selectedOrderId ? (
                                <tr>
                                  <td colSpan={isLevel2 ? 7 : 5} style={{ ...orderStyles.emptyState, padding: '100px 0' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>👈</div>
                                    กรุณาเลือกรายการสั่งซื้อด้านซ้ายเพื่อดูรายละเอียด
                                  </td>
                                </tr>
                              ) : (
                                savedOrders.find(o => o.id === selectedOrderId)?.items?.sort((a: any, b: any) => a.itemName.localeCompare(b.itemName)).map((item: any, idx: number) => (
                                  <tr key={item.id} style={idx % 2 === 0 ? orderStyles.tableRowEven : orderStyles.tableRowOdd}>
                                    <td style={{ ...orderStyles.tableCellNo, fontSize: '11px', color: '#475569' }}>{idx + 1}</td>
                                    <td style={{ ...orderStyles.tableCellCode, fontSize: '11px' }}>{item.itemcode}</td>
                                    <td style={orderStyles.tableCellName}>
                                      <div style={{ fontSize: '12px', fontWeight: 500 }}>{item.itemName}</div>
                                    </td>
                                    <td style={{ ...orderStyles.tableCellNumber, color: '#2A6AAA' }}>
                                      <input
                                        type="number"
                                        min="0"
                                        value={item.qty}
                                        onChange={(e) => handleUpdateOrderDetailQty(item.id, Number(e.target.value))}
                                        style={{
                                          width: '60px',
                                          padding: '2px 4px',
                                          borderRadius: '6px',
                                          border: '1px solid #2A6AAA',
                                          textAlign: 'center',
                                          fontSize: '13px',
                                          color: '#2A6AAA',
                                          fontFamily: 'Kanit_B',
                                          fontWeight: 600,
                                          outline: 'none',
                                          background: '#F3F8FC'
                                        }}
                                      />
                                    </td>

                                    {isLevel2 && <td style={{ ...orderStyles.tableCell, textAlign: 'right' }}>{item.cost?.toLocaleString()}</td>}
                                    {isLevel2 && <td style={{ ...orderStyles.tableCellBalance, textAlign: 'right', paddingRight: '15px' }}>
                                      {item.total?.toLocaleString()}
                                    </td>}
                                    <td style={{ ...orderStyles.tableCell, textAlign: 'center' }}>
                                      {['Pending', 'Acknowledged'].includes(savedOrders.find(o => o.id === selectedOrderId)?.status) && (
                                        <button
                                          onClick={() => handleDeleteOrderDetail(item.id)}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            borderRadius: '4px',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#fee2e2';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                          }}
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                            {selectedOrderId && isLevel2 && (
                              <tfoot>
                                <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                                  <td colSpan={5} style={{ textAlign: 'right', padding: '12px 20px', fontWeight: 600, fontFamily: 'Kanit' }}>ราคารวมทั้งสิ้น:</td>
                                  <td style={{ textAlign: 'right', padding: '12px 15px', fontWeight: 700, color: '#2A6AAA', fontSize: '16px', fontFamily: 'Kanit' }}>
                                    {savedOrders.find(o => o.id === selectedOrderId)?.totalAmount?.toLocaleString()} บาท
                                  </td>
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}


            </div>
          </div>

        </div>

      </div >
      <Dialog open={isReceiveModalOpen} onOpenChange={setIsReceiveModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Kanit_B', color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px' }}>
              <span>📦</span> สร้างใบรับสินค้าจากรายการสั่งซื้อ
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <CreateMainOrder
              initialData={{
                names: receivingOrder?.supplierName,
                invoice_No: receivingOrder?.id ? `ORDER-${receivingOrder.id}` : "",
                order_date: receivingOrder?.createDate ? new Date(receivingOrder.createDate) : new Date(),
                items: receivingOrder?.items || [],
              }}
              onSuccess={handleReceiveSuccess}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
export default OrderPage




