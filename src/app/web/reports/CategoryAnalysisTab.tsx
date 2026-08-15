'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Layers, Search, TrendingUp, DollarSign, ShoppingCart, Percent, Package } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { toThaiDateString } from '@/utils/dateUtils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Category {
    rank: number
    name: string
    qty: number
    revenue: number
    cost: number
    profit: number
    profitPercent: number
}

interface CategoryProduct {
    rank: number
    code: string
    name: string
    qty: number
    revenue: number
}

interface CategoryDetail {
    summary: {
        totalQty: number
        totalRevenue: number
        totalCost: number
        profit: number
        profitPercent: number
    }
    products: CategoryProduct[]
    dayOfMonthSales: { label: string; revenue: number }[]
    dailySales: { label: string; revenue: number }[]
    weeklySales: { label: string; revenue: number }[]
    monthlySales: { label: string; revenue: number }[]
}

export default function CategoryAnalysisTab() {
    const [loading, setLoading] = useState(false)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [categoryDetail, setCategoryDetail] = useState<CategoryDetail | null>(null)

    // Date range
    const today = toThaiDateString()
    const thirtyDaysAgo = toThaiDateString(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const [startDate, setStartDate] = useState(thirtyDaysAgo)
    const [endDate, setEndDate] = useState(today)
    const [searchCategory, setSearchCategory] = useState('')
    const [searchProduct, setSearchProduct] = useState('')

    // Filter categories by search
    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchCategory.toLowerCase())
    )

    // Filter products by search
    const filteredProducts = categoryDetail?.products?.filter(p =>
        p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        p.code.toLowerCase().includes(searchProduct.toLowerCase())
    ) || []

    const fetchCategories = async () => {
        setLoading(true)
        const companyS = localStorage.getItem("company_") || ""
        try {
            const res = await axios.get(`/api/sale_cal/sale_category_analysis?company=${companyS}&startDate=${startDate}&endDate=${endDate}`)
            setCategories(res.data)
            setSelectedCategory(null)
            setCategoryDetail(null)
        } catch (error) {
            console.error('Error fetching categories:', error)
            setCategories([])
        }
        setLoading(false)
    }

    const fetchCategoryDetail = async (category: Category) => {
        setLoadingDetail(true)
        setSelectedCategory(category)
        const companyS = localStorage.getItem("company_") || ""
        try {
            const res = await axios.get(`/api/sale_cal/sale_category_detail?company=${companyS}&category=${encodeURIComponent(category.name)}&startDate=${startDate}&endDate=${endDate}`)
            setCategoryDetail(res.data)
        } catch (error) {
            console.error('Error fetching category detail:', error)
            setCategoryDetail(null)
        }
        setLoadingDetail(false)
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const StatCard = ({ icon: Icon, label, value, color, subValue }: { icon: any, label: string, value: string, color: string, subValue?: string }) => (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            flex: 1,
            minWidth: '120px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <div style={{
                    backgroundColor: `${color}15`,
                    borderRadius: '6px',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Icon size={14} style={{ color }} />
                </div>
                <span style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#64748b' }}>{label}</span>
            </div>
            <div style={{ fontFamily: 'Kanit_B', fontSize: '16px', color: '#1e293b' }}>{value}</div>
            {subValue && <div style={{ fontFamily: 'Kanit', fontSize: '10px', color: '#94a3b8' }}>{subValue}</div>}
        </div>
    )

    const ChartCard = ({ title, data, color }: { title: string, data: { label: string; revenue: number }[], color: string }) => (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            marginBottom: '10px',
        }}>
            <div style={{ fontFamily: 'Kanit_B', fontSize: '12px', color: '#334155', marginBottom: '10px' }}>{title}</div>
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fontFamily: 'Kanit' }} stroke="#94a3b8" />
                        <YAxis tick={{ fontSize: 9, fontFamily: 'Kanit' }} stroke="#94a3b8" tickFormatter={(v) => v.toLocaleString()} />
                        <Tooltip
                            contentStyle={{ fontFamily: 'Kanit', fontSize: 11, borderRadius: 6 }}
                            formatter={(value: number) => [`฿${value.toLocaleString()}`, 'ยอดขาย']}
                        />
                        <Line type="monotone" dataKey="revenue" stroke={color} strokeWidth={2} dot={{ fill: color, r: 2 }} />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontFamily: 'Kanit', fontSize: '11px', padding: '30px 0' }}>
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
                background: '#fffbeb',
                borderBottom: '2px solid #f59e0b',
                color: '#b45309',
                padding: '16px 20px',
                fontFamily: 'Kanit_B',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <Layers size={18} /> รายงานวิเคราะห์กลุ่มสินค้า
            </div>

            {/* Date Filter */}
            <div style={{
                padding: '10px 16px',
                backgroundColor: '#fafafa',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#64748b' }}>วันเริ่ม:</span>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{
                            fontFamily: 'Kanit',
                            fontSize: '12px',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            color: '#334155',
                        }}
                    />
                </div>
                <span style={{ color: '#94a3b8' }}>➜</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#64748b' }}>วันจบ:</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{
                            fontFamily: 'Kanit',
                            fontSize: '12px',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            color: '#334155',
                        }}
                    />
                </div>
                <Button
                    onClick={fetchCategories}
                    disabled={loading}
                    size="sm"
                    style={{
                        fontFamily: 'Kanit',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: '#f59e0b',
                        color: 'white',
                    }}
                >
                    <Search size={12} />
                    ค้นหา
                </Button>
            </div>

            {/* 3-Column Content */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Column 1: Category List */}
                <div style={{
                    width: '25%',
                    borderRight: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        padding: '10px 12px',
                        backgroundColor: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        fontFamily: 'Kanit_B',
                        fontSize: '12px',
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                    }}>
                        <span>กลุ่มสินค้า ({filteredCategories.length})</span>
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            value={searchCategory}
                            onChange={(e) => setSearchCategory(e.target.value)}
                            style={{
                                fontFamily: 'Kanit',
                                fontSize: '10px',
                                padding: '5px 8px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                width: '80px',
                                outline: 'none',
                            }}
                        />
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontFamily: 'Kanit', fontSize: '12px' }}>
                                กำลังโหลด...
                            </div>
                        ) : categories.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontFamily: 'Kanit', fontSize: '12px' }}>
                                ไม่พบข้อมูล
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Kanit', fontSize: '11px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f1f5f9', position: 'sticky', top: 0 }}>
                                        <th style={{ padding: '8px 6px', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>#</th>
                                        <th style={{ padding: '8px 6px', textAlign: 'left', color: '#64748b', fontWeight: 500 }}>กลุ่มสินค้า</th>
                                        <th style={{ padding: '8px 6px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>ยอดขาย</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCategories.map((cat) => (
                                        <tr
                                            key={cat.name}
                                            onClick={() => fetchCategoryDetail(cat)}
                                            style={{
                                                cursor: 'pointer',
                                                backgroundColor: selectedCategory?.name === cat.name ? '#fef3c7' : 'transparent',
                                                borderBottom: '1px solid #f1f5f9',
                                                transition: 'background-color 0.15s',
                                            }}
                                            className="hover-row-cat"
                                        >
                                            <td style={{ padding: '8px 6px', textAlign: 'center', color: '#94a3b8' }}>{cat.rank}</td>
                                            <td style={{ padding: '8px 6px', color: '#334155', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</td>
                                            <td style={{ padding: '8px 6px', textAlign: 'right', color: '#2A6AAA', fontWeight: 500 }}>฿{cat.revenue.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Column 2: Products in Category */}
                <div style={{
                    width: '30%',
                    borderRight: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    backgroundColor: '#fafafa',
                }}>
                    <div style={{
                        padding: '10px 12px',
                        backgroundColor: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        fontFamily: 'Kanit_B',
                        fontSize: '12px',
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                    }}>
                        <span>สินค้าในกลุ่ม {selectedCategory ? `(${filteredProducts.length})` : ''}</span>
                        <input
                            type="text"
                            placeholder="ค้นหารหัส/ชื่อ..."
                            value={searchProduct}
                            onChange={(e) => setSearchProduct(e.target.value)}
                            style={{
                                fontFamily: 'Kanit',
                                fontSize: '10px',
                                padding: '5px 8px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                width: '100px',
                                outline: 'none',
                            }}
                        />
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {!selectedCategory ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontFamily: 'Kanit', fontSize: '12px' }}>
                                เลือกกลุ่มสินค้า
                            </div>
                        ) : loadingDetail ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontFamily: 'Kanit', fontSize: '12px' }}>
                                กำลังโหลด...
                            </div>
                        ) : categoryDetail?.products?.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontFamily: 'Kanit', fontSize: '12px' }}>
                                ไม่พบสินค้า
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Kanit', fontSize: '11px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f1f5f9', position: 'sticky', top: 0 }}>
                                        <th style={{ padding: '8px 6px', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>#</th>
                                        <th style={{ padding: '8px 6px', textAlign: 'left', color: '#64748b', fontWeight: 500 }}>รหัส</th>
                                        <th style={{ padding: '8px 6px', textAlign: 'left', color: '#64748b', fontWeight: 500 }}>ชื่อสินค้า</th>
                                        <th style={{ padding: '8px 6px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>จำนวน</th>
                                        <th style={{ padding: '8px 6px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>ยอดขาย</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((product) => (
                                        <tr key={product.code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '8px 6px', textAlign: 'center', color: '#94a3b8' }}>{product.rank}</td>
                                            <td style={{ padding: '8px 6px', color: '#6366f1', fontWeight: 500 }}>{product.code}</td>
                                            <td style={{ padding: '8px 6px', color: '#334155', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</td>
                                            <td style={{ padding: '8px 6px', textAlign: 'right', color: '#334155' }}>{product.qty.toLocaleString()}</td>
                                            <td style={{ padding: '8px 6px', textAlign: 'right', color: '#2A6AAA', fontWeight: 500 }}>฿{product.revenue.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Column 3: Category Dashboard */}
                <div style={{
                    width: '45%',
                    backgroundColor: '#f8fafc',
                    overflowY: 'auto',
                    padding: '12px',
                }}>
                    {!selectedCategory ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#94a3b8',
                            fontFamily: 'Kanit',
                        }}>
                            <Layers size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                            <div style={{ fontSize: '13px' }}>เลือกกลุ่มสินค้าเพื่อดูรายละเอียด</div>
                        </div>
                    ) : loadingDetail ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#94a3b8',
                            fontFamily: 'Kanit',
                            fontSize: '13px',
                        }}>
                            กำลังโหลดข้อมูล...
                        </div>
                    ) : categoryDetail ? (
                        <>
                            {/* Category Header */}
                            <div style={{
                                background: '#fffbeb',
                                borderBottom: '2px solid #f59e0b',
                                borderRadius: '10px',
                                padding: '12px',
                                marginBottom: '12px',
                                color: '#b45309',
                            }}>
                                <div style={{ fontFamily: 'Kanit_B', fontSize: '14px' }}>{selectedCategory.name}</div>
                                <div style={{ fontFamily: 'Kanit', fontSize: '11px', opacity: 0.8 }}>กลุ่มสินค้า</div>
                            </div>

                            {/* Stats Cards */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                <StatCard icon={ShoppingCart} label="จำนวนขาย" value={categoryDetail.summary.totalQty.toLocaleString()} color="#6366f1" subValue="ชิ้น" />
                                <StatCard icon={DollarSign} label="ยอดขายรวม" value={`฿${categoryDetail.summary.totalRevenue.toLocaleString()}`} color="#2A6AAA" />
                                <StatCard icon={Package} label="ต้นทุนรวม" value={`฿${categoryDetail.summary.totalCost.toLocaleString()}`} color="#ef4444" />
                                <StatCard icon={TrendingUp} label="กำไร" value={`฿${categoryDetail.summary.profit.toLocaleString()}`} color="#f59e0b" />
                                <StatCard icon={Percent} label="%กำไร" value={`${categoryDetail.summary.profitPercent}%`} color="#1F9D6B" />

                            </div>


                            {/* Charts */}
                            <ChartCard title="📅 กราฟยอดขายตามวันที่ (1-31)" data={categoryDetail.dayOfMonthSales} color="#ec4899" />
                            <ChartCard title="📈 กราฟยอดขายรายวัน" data={categoryDetail.dailySales} color="#6366f1" />
                            <ChartCard title="📊 กราฟยอดขายรายสัปดาห์" data={categoryDetail.weeklySales} color="#2A6AAA" />
                            <ChartCard title="📉 กราฟยอดขายรายเดือน" data={categoryDetail.monthlySales} color="#f59e0b" />
                        </>
                    ) : null}
                </div>
            </div>

            <style jsx>{`
        .hover-row-cat:hover { background-color: #fef9c3 !important; }
      `}</style>
        </div>
    )
}
