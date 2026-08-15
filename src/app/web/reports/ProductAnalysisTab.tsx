'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Package, Search, TrendingUp, DollarSign, ShoppingCart, Percent, BarChart3 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getLocalStorageItem } from "@/utils/localStorage"
import { toThaiDateString } from '@/utils/dateUtils'

interface Product {
    rank: number
    code: string
    name: string
    qty: number
    revenue: number
    cost: number
    profit: number
    profitPercent: number
}

interface ProductDetail {
    summary: {
        totalQty: number
        totalRevenue: number
        totalCost: number
        avgPrice: number
        costPerUnit: number
        profit: number
        profitPercent: number
    }
    dayOfMonthSales: { label: string; revenue: number }[]
    dailySales: { label: string; revenue: number }[]
    weeklySales: { label: string; revenue: number }[]
    monthlySales: { label: string; revenue: number }[]
}

export default function ProductAnalysisTab() {
    const [loading, setLoading] = useState(false)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [products, setProducts] = useState<Product[]>([])
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [productDetail, setProductDetail] = useState<ProductDetail | null>(null)

    // Date range
    const today = toThaiDateString()
    const thirtyDaysAgo = toThaiDateString(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const [startDate, setStartDate] = useState(thirtyDaysAgo)
    const [endDate, setEndDate] = useState(today)
    const [searchProduct, setSearchProduct] = useState('')

    // Filter products by search
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        p.code.toLowerCase().includes(searchProduct.toLowerCase())
    )

    const fetchProducts = async () => {
        setLoading(true)
        const companyS = getLocalStorageItem("company_") || ""
        try {
            const res = await axios.get(`/api/sale_cal/sale_product_analysis?company=${companyS}&startDate=${startDate}&endDate=${endDate}`)
            setProducts(res.data)
            setSelectedProduct(null)
            setProductDetail(null)
        } catch (error) {
            console.error('Error fetching products:', error)
            setProducts([])
        }
        setLoading(false)
    }

    const fetchProductDetail = async (product: Product) => {
        setLoadingDetail(true)
        setSelectedProduct(product)
        const companyS = getLocalStorageItem("company_") || ""
        try {
            const res = await axios.get(`/api/sale_cal/sale_product_detail?company=${companyS}&productCode=${product.code}&startDate=${startDate}&endDate=${endDate}`)
            setProductDetail(res.data)
        } catch (error) {
            console.error('Error fetching product detail:', error)
            setProductDetail(null)
        }
        setLoadingDetail(false)
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    const StatCard = ({ icon: Icon, label, value, color, subValue }: { icon: any, label: string, value: string, color: string, subValue?: string }) => (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            flex: 1,
            minWidth: '140px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{
                    backgroundColor: `${color}15`,
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Icon size={16} style={{ color }} />
                </div>
                <span style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#64748b' }}>{label}</span>
            </div>
            <div style={{ fontFamily: 'Kanit_B', fontSize: '20px', color: '#1e293b' }}>{value}</div>
            {subValue && <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#94a3b8' }}>{subValue}</div>}
        </div>
    )

    const ChartCard = ({ title, data, color }: { title: string, data: { label: string; revenue: number }[], color: string }) => (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            marginBottom: '12px',
        }}>
            <div style={{ fontFamily: 'Kanit_B', fontSize: '13px', color: '#334155', marginBottom: '12px' }}>{title}</div>
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'Kanit' }} stroke="#94a3b8" />
                        <YAxis tick={{ fontSize: 10, fontFamily: 'Kanit' }} stroke="#94a3b8" tickFormatter={(v) => v.toLocaleString()} />
                        <Tooltip
                            contentStyle={{ fontFamily: 'Kanit', fontSize: 12, borderRadius: 8 }}
                            formatter={(value: number) => [`฿${value.toLocaleString()}`, 'ยอดขาย']}
                        />
                        <Line type="monotone" dataKey="revenue" stroke={color} strokeWidth={2} dot={{ fill: color, r: 3 }} />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontFamily: 'Kanit', fontSize: '12px', padding: '40px 0' }}>
                    ไม่มีข้อมูล
                </div>
            )}
        </div>
    )

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
                background: '#f5f3ff',
                borderBottom: '2px solid #8b5cf6',
                color: '#6d28d9',
                padding: '16px 20px',
                fontFamily: 'Kanit_B',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <Package size={18} /> รายงานวิเคราะห์สินค้า
            </div>

            {/* Date Filter */}
            <div style={{
                padding: '12px 16px',
                backgroundColor: '#fafafa',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#64748b' }}>วันเริ่ม:</span>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
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
                <span style={{ color: '#94a3b8' }}>➜</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#64748b' }}>วันจบ:</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
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
                <Button
                    onClick={fetchProducts}
                    disabled={loading}
                    style={{
                        fontFamily: 'Kanit',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#8b5cf6',
                        color: 'white',
                    }}
                >
                    <Search size={14} />
                    ค้นหา
                </Button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Column 1: Product List */}
                <div style={{
                    width: '40%',
                    borderRight: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        padding: '12px 16px',
                        backgroundColor: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        fontFamily: 'Kanit_B',
                        fontSize: '13px',
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                    }}>
                        <span>รายการสินค้า ({filteredProducts.length} รายการ)</span>
                        <input
                            type="text"
                            placeholder="ค้นหารหัส/ชื่อ..."
                            value={searchProduct}
                            onChange={(e) => setSearchProduct(e.target.value)}
                            style={{
                                fontFamily: 'Kanit',
                                fontSize: '11px',
                                padding: '6px 10px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                width: '140px',
                                outline: 'none',
                            }}
                        />
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontFamily: 'Kanit' }}>
                                กำลังโหลด...
                            </div>
                        ) : products.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontFamily: 'Kanit' }}>
                                ไม่พบข้อมูลสินค้า
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Kanit', fontSize: '12px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f1f5f9', position: 'sticky', top: 0 }}>
                                        <th style={{ padding: '10px 8px', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>#</th>
                                        <th style={{ padding: '10px 8px', textAlign: 'left', color: '#64748b', fontWeight: 500 }}>รหัส</th>
                                        <th style={{ padding: '10px 8px', textAlign: 'left', color: '#64748b', fontWeight: 500 }}>ชื่อสินค้า</th>
                                        <th style={{ padding: '10px 8px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>จำนวน</th>
                                        <th style={{ padding: '10px 8px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>ยอดขาย</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((product) => (
                                        <tr
                                            key={product.code}
                                            onClick={() => fetchProductDetail(product)}
                                            style={{
                                                cursor: 'pointer',
                                                backgroundColor: selectedProduct?.code === product.code ? '#ede9fe' : 'transparent',
                                                borderBottom: '1px solid #f1f5f9',
                                                transition: 'background-color 0.15s',
                                            }}
                                            className="hover-row"
                                        >
                                            <td style={{ padding: '10px 8px', textAlign: 'center', color: '#94a3b8' }}>{product.rank}</td>
                                            <td style={{ padding: '10px 8px', color: '#6366f1', fontWeight: 500 }}>{product.code}</td>
                                            <td style={{ padding: '10px 8px', color: '#334155', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</td>
                                            <td style={{ padding: '10px 8px', textAlign: 'right', color: '#334155' }}>{product.qty.toLocaleString()}</td>
                                            <td style={{ padding: '10px 8px', textAlign: 'right', color: '#2A6AAA', fontWeight: 500 }}>฿{product.revenue.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Column 2: Product Dashboard */}
                <div style={{
                    width: '60%',
                    backgroundColor: '#f8fafc',
                    overflowY: 'auto',
                    padding: '16px',
                }}>
                    {!selectedProduct ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#94a3b8',
                            fontFamily: 'Kanit',
                        }}>
                            <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                            <div style={{ fontSize: '14px' }}>เลือกสินค้าเพื่อดูรายละเอียด</div>
                        </div>
                    ) : loadingDetail ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#94a3b8',
                            fontFamily: 'Kanit',
                        }}>
                            กำลังโหลดข้อมูล...
                        </div>
                    ) : productDetail ? (
                        <>
                            {/* Product Header */}
                            <div style={{
                                background: '#f5f3ff',
                                borderBottom: '2px solid #8b5cf6',
                                borderRadius: '12px',
                                padding: '16px',
                                marginBottom: '16px',
                                color: '#6d28d9',
                            }}>
                                <div style={{ fontFamily: 'Kanit', fontSize: '12px', opacity: 0.8 }}>{selectedProduct.code}</div>
                                <div style={{ fontFamily: 'Kanit_B', fontSize: '16px' }}>{selectedProduct.name}</div>
                            </div>

                            {/* Stats Cards */}
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                <StatCard
                                    icon={ShoppingCart}
                                    label="จำนวนขาย"
                                    value={productDetail.summary.totalQty.toLocaleString()}
                                    color="#6366f1"
                                    subValue="ชิ้น"
                                />
                                <StatCard
                                    icon={DollarSign}
                                    label="ยอดขาย"
                                    value={`฿${productDetail.summary.totalRevenue.toLocaleString()}`}
                                    color="#2A6AAA"
                                />
                                <StatCard
                                    icon={Package}
                                    label="ราคาทุน"
                                    value={`฿${productDetail.summary.totalCost.toLocaleString()}`}
                                    color="#ef4444"
                                />

                                <StatCard
                                    icon={TrendingUp}
                                    label="กำไร"
                                    value={`฿${productDetail.summary.profit.toLocaleString()}`}
                                    color="#f59e0b"
                                    subValue={`${productDetail.summary.profitPercent}%`}
                                />
                                <StatCard
                                    icon={Percent}
                                    label="%กำไร"
                                    value={`${productDetail.summary.profitPercent}%`}
                                    color="#3E86C7"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                <StatCard
                                    icon={BarChart3}
                                    label="ราคาขาย/หน่วย"
                                    value={`฿${productDetail.summary.avgPrice.toLocaleString()}`}
                                    color="#3E86C7"
                                />
                                <StatCard
                                    icon={BarChart3}
                                    label="ราคาทุน/หน่วย"
                                    value={`฿${productDetail.summary.costPerUnit.toLocaleString()}`}
                                    color="#3E86C7"
                                />


                            </div>

                            {/* Charts */}
                            <ChartCard title="📅 กราฟยอดขายตามวันที่ (1-31)" data={productDetail.dayOfMonthSales} color="#ec4899" />
                            <ChartCard title="📈 กราฟยอดขายรายวัน" data={productDetail.dailySales} color="#6366f1" />
                            <ChartCard title="📊 กราฟยอดขายรายสัปดาห์" data={productDetail.weeklySales} color="#2A6AAA" />
                            <ChartCard title="📉 กราฟยอดขายรายเดือน" data={productDetail.monthlySales} color="#f59e0b" />
                        </>
                    ) : null}
                </div>
            </div>

            <style jsx>{`
        .hover-row:hover { background-color: #f5f3ff !important; }
      `}</style>
        </div>
    )
}
