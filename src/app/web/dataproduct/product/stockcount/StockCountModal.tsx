'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  X, Search, Box, AlertTriangle, FileText, BarChart3,
  ClipboardList, Plus, Minus, Check, RefreshCw
} from 'lucide-react'
import { fetchBarcodeAliases, buildAliasesByCode } from '@/lib/barcodeAliasClient'

const apidatalist = "datalist"
const apibalance = "sale_cal/sale_balance"

interface ProductItem {
  id: number;
  code: string;
  ProductName: string;
  Unit: string;
  Barcode: string;
  itembalance?: number;
}

interface CountedItem {
  id_product: number;
  code: string;
  name_product: string;
  unit: string;
  balance: number;
  actual: number;
  diff: number;
  saved: boolean;
}

interface CheckstockRecord {
  id: number;
  date: string;
  month: string;
  idcompany: string;
  id_product: number;
  name_product: string;
  balance: number;
  actual: number;
  diff: number;
  person: string;
  status: string;
}

interface StockCountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StockCountModal({ isOpen, onClose }: StockCountModalProps) {
  const [activeTab, setActiveTab] = useState('count');
  const [searchQuery, setSearchQuery] = useState('');
  const [dataProduct, setDataProduct] = useState<ProductItem[]>([]);
  const [countedItems, setCountedItems] = useState<CountedItem[]>([]);
  const [checkstockRecords, setCheckstockRecords] = useState<CheckstockRecord[]>([]);
  const [toast, setToast] = useState('');
  const [liveBalanceMap, setLiveBalanceMap] = useState<{ [code: string]: number }>({});
  const [diffSearchQuery, setDiffSearchQuery] = useState('');
  const [resultsSearchQuery, setResultsSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [companyS, setCompanyS] = useState('');
  const [personS, setPersonS] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  // บาร์โค้ดสำรองจัดกลุ่มตามรหัสสินค้า (ใช้เฉพาะกรองผลค้นหา ไม่แตะยอดใด ๆ)
  const [aliasesByCode, setAliasesByCode] = useState<Map<string, string[]>>(new Map());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCompanyS(localStorage.getItem("company_") || "");
      setPersonS(localStorage.getItem("person_") || "");
    }
  }, []);

  // Fetch products (without balance - balance fetched on select)
  useEffect(() => {
    if (!isOpen) return;
    const fetchProducts = async () => {
      if (typeof window === "undefined") return;
      let company = localStorage.getItem("company_") || "";
      try {
        setLoadingData(true);
        const [res, aliases] = await Promise.all([
          axios.get(`/api/${apidatalist}?company=${company}`),
          // บาร์โค้ดสำรอง — ให้ค้นด้วยบาร์โค้ดตัวไหนของสินค้าก็เจอสินค้าตัวเดียวกัน
          fetchBarcodeAliases(company),
        ]);
        setDataProduct(res.data || []);
        setAliasesByCode(buildAliasesByCode(aliases));
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchProducts();
  }, [isOpen]);

  // Fetch checkstock records
  useEffect(() => {
    const fetchRecords = async () => {
      if (!companyS) return;
      try {
        const res = await axios.get(`/api/checkstock?idcompany=${companyS}`);
        setCheckstockRecords(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    if (companyS && isOpen) fetchRecords();
  }, [companyS, countedItems, isOpen]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  };

  const addProductToCount = (product: ProductItem): boolean => {
    const existingInCurrent = countedItems.findIndex(item => item.id_product === product.id);
    if (existingInCurrent !== -1) {
      showToast('สินค้านี้อยู่ในรายการนับแล้ว');
      return false;
    }
    const existingRecord = checkstockRecords.find(r => r.id_product === product.id);
    if (existingRecord) {
      if (existingRecord.diff === 0) {
        alert(`สินค้า "${product.ProductName}" มีการนับไปแล้ว และผลต่างเป็น 0`);
        return false;
      }
    }
    setCountedItems([...countedItems, {
      id_product: product.id,
      code: product.code,
      name_product: product.ProductName,
      unit: product.Unit,
      balance: product.itembalance || 0,
      actual: 0,
      diff: -(product.itembalance || 0),
      saved: false
    }]);
    return true;
  };

  const handleProductSelect = async (product: ProductItem) => {
    // Fetch balance from stock-balance-summary API for this product before adding
    let balance = 0;
    try {
      const company = localStorage.getItem("company_") || "";
      const res = await axios.get(`/api/stock-balance-summary?itemcode=${product.code}&company=${company}&id=${product.id}`);
      balance = res.data?.calculatedBalance ?? 0;
    } catch (e) { console.error(e); }
    const productWithBalance = { ...product, itembalance: balance };
    const canAdd = addProductToCount(productWithBalance);
    if (canAdd) {
      showToast(`เพิ่ม ${product.ProductName}`);
      setSearchQuery('');
    }
  };

  const updateActualCount = (id_product: number, actual: number) => {
    setCountedItems(countedItems.map(item => {
      if (item.id_product === id_product) {
        const diff = actual - item.balance;
        return { ...item, actual, diff, saved: false };
      }
      return item;
    }));
  };

  const incrementActual = (id_product: number) => {
    const item = countedItems.find(i => i.id_product === id_product);
    if (item) updateActualCount(id_product, item.actual + 1);
  };

  const decrementActual = (id_product: number) => {
    const item = countedItems.find(i => i.id_product === id_product);
    if (item && item.actual > 0) updateActualCount(id_product, item.actual - 1);
  };

  const removeCountItem = (id_product: number) => {
    setCountedItems(countedItems.filter(i => i.id_product !== id_product));
  };

  const saveCountItem = async (item: CountedItem) => {
    try {
      const status = item.diff === 0 ? 'approved' : 'pending';
      await axios.post('/api/checkstock', {
        idcompany: companyS,
        id_product: item.id_product,
        month: selectedMonth,
        name_product: item.name_product,
        balance: item.balance,
        actual: item.actual,
        diff: item.diff,
        person: personS,
        status: status
      });
      setCountedItems(countedItems.map(i =>
        i.id_product === item.id_product ? { ...i, saved: true } : i
      ));
      showToast(status === 'approved' ? 'บันทึกสำเร็จ (เรียบร้อย)' : 'บันทึกสำเร็จ (รอตรวจสอบ)');
    } catch (error) {
      console.error(error);
      showToast('เกิดข้อผิดพลาด');
    }
  };

  const filteredProducts = dataProduct.filter((product) => {
    if (!searchQuery) return false;
    const query = searchQuery.toLowerCase();
    return (
      product.ProductName?.toLowerCase().includes(query) ||
      product.code?.toLowerCase().includes(query) ||
      product.Barcode?.toLowerCase().includes(query) ||
      // บาร์โค้ดสำรองของสินค้าตัวเดียวกัน
      (aliasesByCode.get(product.code) || []).some((b) => b.toLowerCase().includes(query))
    );
  });

  // Fetch live balance for records shown in Diff/Results tabs
  useEffect(() => {
    if (activeTab !== 'diff' && activeTab !== 'results') return;
    const records = checkstockRecords.filter(r => r.month === selectedMonth);
    const uniqueProducts = records.map(r => {
      const p = dataProduct.find(dp => dp.id === r.id_product);
      return p ? { id: p.id, code: p.code } : null;
    }).filter((x): x is { id: number; code: string } => !!x && !!x.code);
    // unique by id
    const seen = new Set<number>();
    const uniqueProductList = uniqueProducts.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    const fetchLiveBalances = async () => {
      const company = localStorage.getItem("company_") || "";
      const newMap: { [code: string]: number } = {};
      for (const p of uniqueProductList) {
        try {
          const res = await axios.get(`/api/stock-balance-summary?itemcode=${p.code}&company=${company}&id=${p.id}`);
          newMap[p.code] = res.data?.calculatedBalance ?? 0;
        } catch { newMap[p.code] = 0; }
      }
      setLiveBalanceMap(prev => ({ ...prev, ...newMap }));
    };
    if (uniqueProductList.length > 0) fetchLiveBalances();
  }, [activeTab, checkstockRecords, selectedMonth]);

  const filteredDiffRecords = checkstockRecords.filter(r => {
    if (r.diff === 0) return false;
    if (r.month !== selectedMonth) return false;
    const productRecords = checkstockRecords.filter(pr => pr.id_product === r.id_product);
    const latestRecord = productRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    if (latestRecord && latestRecord.status === 'approved') return false;
    if (!diffSearchQuery) return true;
    const query = diffSearchQuery.toLowerCase();
    return (
      r.name_product?.toLowerCase().includes(query) ||
      r.id_product?.toString().includes(query)
    );
  });

  const filteredResultsRecords = checkstockRecords.filter(r => {
    if (r.month !== selectedMonth) return false;
    if (!resultsSearchQuery) return true;
    const query = resultsSearchQuery.toLowerCase();
    return (
      r.name_product?.toLowerCase().includes(query) ||
      r.id_product?.toString().includes(query)
    );
  });

  const monthFilteredRecords = checkstockRecords.filter(r => r.month === selectedMonth);
  const totalCounted = monthFilteredRecords.length;
  const totalDiffPositive = monthFilteredRecords.filter(r => r.diff > 0).reduce((sum, r) => sum + r.diff, 0);
  const totalDiffNegative = monthFilteredRecords.filter(r => r.diff < 0).reduce((sum, r) => sum + r.diff, 0);
  const pendingCount = monthFilteredRecords.filter(r => r.status === 'pending').length;

  if (!isOpen) return null;

  const tabs = [
    { key: 'count', label: 'นับ Stock', icon: <Box size={15} /> },
    { key: 'diff', label: 'Diff', icon: <AlertTriangle size={15} /> },
    { key: 'results', label: 'ผลการนับ', icon: <FileText size={15} /> },
    { key: 'summary', label: 'สรุปผล', icon: <BarChart3 size={15} /> },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
          animation: 'scmFadeIn 0.2s ease'
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90vw',
        maxWidth: '1100px',
        height: '88vh',
        backgroundColor: '#f8fafc',
        borderRadius: '16px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'Kanit, sans-serif',
        animation: 'scmSlideIn 0.3s ease'
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
            <ClipboardList size={22} />
            <span style={{ fontSize: '18px', fontWeight: 600 }}>นับ Stock สินค้า</span>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '2px 10px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 500
            }}>
              {selectedMonth}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '10px',
              color: 'white',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)' }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: 'white',
          padding: '6px 24px',
          gap: '4px',
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: activeTab === tab.key ? 600 : 500,
                fontFamily: 'Kanit, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === tab.key
                  ? 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)'
                  : 'transparent',
                color: activeTab === tab.key ? 'white' : '#6b7280',
                boxShadow: activeTab === tab.key ? '0 2px 8px rgba(62, 134, 199, 0.3)' : 'none',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}

          {/* Month Selector - right side */}
          {(activeTab === 'diff' || activeTab === 'results' || activeTab === 'summary') && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>เดือน:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontFamily: 'Kanit, sans-serif',
                  outline: 'none',
                  color: '#374151'
                }}
              />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* ====== TAB: COUNT ====== */}
          {activeTab === 'count' && (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Left: Product search panel */}
              <div style={{
                width: '340px',
                borderRight: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white',
                flexShrink: 0
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f1f5f9',
                  background: '#f8fafc'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <Search size={14} color="#3E86C7" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>ค้นหาสินค้า</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                      type="text"
                      placeholder="ชื่อสินค้า, รหัส, Barcode..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 10px 9px 32px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontFamily: 'Kanit, sans-serif',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#3E86C7' }}
                      onBlur={(e) => { e.target.style.borderColor = '#e2e8f0' }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        style={{
                          position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                          background: '#e5e7eb', border: 'none', borderRadius: '50%',
                          width: '18px', height: '18px', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', cursor: 'pointer'
                        }}
                      >
                        <X size={10} color="#6b7280" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Product list */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {loadingData ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: '13px' }}>
                      <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                      <div>กำลังโหลดข้อมูล...</div>
                    </div>
                  ) : !searchQuery ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                      <Search size={32} style={{ marginBottom: '8px', color: '#d1d5db' }} />
                      <div style={{ fontSize: '13px' }}>พิมพ์ค้นหาสินค้าเพื่อเพิ่มรายการนับ</div>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                      <Box size={32} style={{ marginBottom: '8px', color: '#d1d5db' }} />
                      <div style={{ fontSize: '13px' }}>ไม่พบสินค้า</div>
                    </div>
                  ) : (
                    filteredProducts.slice(0, 50).map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid #f5f5f5',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F3F8FC' }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <div style={{
                          background: '#F3F8FC',
                          color: '#3E86C7',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          minWidth: '55px',
                          textAlign: 'center'
                        }}>
                          {product.code}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '12px',
                            color: '#1f2937',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {product.ProductName}
                          </div>
                          <div style={{ fontSize: '10px', color: '#9ca3af' }}>{product.Barcode}</div>
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#3E86C7',
                          fontWeight: 500,
                          whiteSpace: 'nowrap'
                        }}>
                        
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right: Counting area */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Counting header */}
                <div style={{
                  padding: '10px 20px',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ClipboardList size={16} color="#3E86C7" />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>รายการนับ</span>
                    <span style={{
                      background: '#E5EEF8',
                      color: '#2A6AAA',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}>
                      {countedItems.filter(i => !i.saved).length} รายการ
                    </span>
                  </div>
                </div>

                {/* Counting table */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
                  {countedItems.filter(item => !item.saved).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                      <Box size={48} style={{ marginBottom: '12px', color: '#d1d5db' }} />
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>ยังไม่มีรายการนับ</div>
                      <div style={{ fontSize: '13px' }}>ค้นหาสินค้าจากแผงด้านซ้ายเพื่อเริ่มนับ</div>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', position: 'sticky', top: 0, zIndex: 5 }}>
                          <th style={{ ...thStyle, width: '70px' }}>รหัส</th>
                          <th style={{ ...thStyle, textAlign: 'left' }}>ชื่อสินค้า</th>
                          <th style={{ ...thStyle, width: '70px' }}>หน่วย</th>
                          <th style={{ ...thStyle, width: '80px' }}>คงเหลือ</th>
                          <th style={{ ...thStyle, width: '160px' }}>จำนวนนับ</th>
                          <th style={{ ...thStyle, width: '70px' }}>ผลต่าง</th>
                          <th style={{ ...thStyle, width: '120px' }}>การจัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {countedItems.filter(item => !item.saved).map((item, index) => (
                          <tr
                            key={item.id_product}
                            style={{
                              backgroundColor: index % 2 === 0 ? 'white' : '#fafbfc',
                              borderBottom: '1px solid #f1f5f9',
                              transition: 'background 0.15s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F3F8FC' }}
                            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#fafbfc' }}
                          >
                            <td style={{ ...tdStyle, color: '#3E86C7', fontWeight: 600 }}>{item.code}</td>
                            <td style={{ ...tdStyle, textAlign: 'left', color: '#1f2937', fontWeight: 500 }}>{item.name_product}</td>
                            <td style={tdStyle}>
                              <span style={{
                                background: '#F3F8FC',
                                color: '#3E86C7',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px'
                              }}>{item.unit}</span>
                            </td>
                            <td style={{ ...tdStyle, color: '#3E86C7', fontWeight: 600 }}>{item.balance}</td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <button
                                  onClick={() => decrementActual(item.id_product)}
                                  style={qtyBtnStyle}
                                >
                                  <Minus size={14} />
                                </button>
                                <input
                                  type="number"
                                  value={item.actual}
                                  onChange={(e) => updateActualCount(item.id_product, parseInt(e.target.value) || 0)}
                                  style={{
                                    width: '60px',
                                    textAlign: 'center',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    padding: '5px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    fontFamily: 'Kanit, sans-serif',
                                    outline: 'none',
                                    color: '#1f2937'
                                  }}
                                  onFocus={(e) => { e.target.style.borderColor = '#3E86C7' }}
                                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0' }}
                                />
                                <button
                                  onClick={() => incrementActual(item.id_product)}
                                  style={qtyBtnStyle}
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </td>
                            <td style={tdStyle}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '36px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 700,
                                background: item.diff > 0 ? '#D3F0E2' : item.diff < 0 ? '#fee2e2' : '#f3f4f6',
                                color: item.diff > 0 ? '#147F56' : item.diff < 0 ? '#dc2626' : '#6b7280'
                              }}>
                                {item.diff > 0 ? '+' : ''}{item.diff}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <button
                                  onClick={() => saveCountItem(item)}
                                  style={{
                                    padding: '5px 12px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)',
                                    color: 'white',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    fontFamily: 'Kanit, sans-serif',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 1px 4px rgba(62, 134, 199,0.3)'
                                  }}
                                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
                                >
                                  <Check size={12} />
                                  บันทึก
                                </button>
                                <button
                                  onClick={() => removeCountItem(item.id_product)}
                                  style={{
                                    padding: '5px 8px',
                                    border: '1px solid #fecaca',
                                    borderRadius: '6px',
                                    background: '#fef2f2',
                                    color: '#ef4444',
                                    fontSize: '11px',
                                    fontFamily: 'Kanit, sans-serif',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseOver={(e) => { e.currentTarget.style.background = '#fee2e2' }}
                                  onMouseOut={(e) => { e.currentTarget.style.background = '#fef2f2' }}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ====== TAB: DIFF ====== */}
          {activeTab === 'diff' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {/* Search */}
              <div style={{ marginBottom: '16px', position: 'relative', maxWidth: '400px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="ค้นหาสินค้า..."
                  value={diffSearchQuery}
                  onChange={(e) => setDiffSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 10px 9px 34px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontFamily: 'Kanit, sans-serif',
                    outline: 'none',
                    background: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#3E86C7' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0' }}
                />
                {diffSearchQuery && (
                  <button
                    onClick={() => setDiffSearchQuery('')}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: '#e5e7eb', border: 'none', borderRadius: '50%',
                      width: '20px', height: '20px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', cursor: 'pointer'
                    }}
                  >
                    <X size={10} color="#6b7280" />
                  </button>
                )}
              </div>

              {filteredDiffRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                  <Check size={48} style={{ marginBottom: '12px', color: '#d1d5db' }} />
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                    {diffSearchQuery ? 'ไม่พบรายการที่ค้นหา' : 'ไม่มีรายการที่ต่างกัน'}
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    {diffSearchQuery ? 'ลองค้นหาด้วยคำอื่น' : 'ยอดนับตรงกับคงเหลือในระบบ'}
                  </div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ ...thStyle, width: '70px' }}>รหัส</th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>ชื่อสินค้า</th>
                      <th style={{ ...thStyle, width: '100px' }}>วันที่</th>
                      <th style={{ ...thStyle, width: '80px' }}>ผู้นับ</th>
                      <th style={{ ...thStyle, width: '80px' }}>คงเหลือ</th>
                      <th style={{ ...thStyle, width: '80px' }}>นับได้</th>
                      <th style={{ ...thStyle, width: '80px' }}>ผลต่าง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDiffRecords.map((record, index) => (
                      <tr
                        key={record.id}
                        style={{
                          backgroundColor: index % 2 === 0 ? 'white' : '#fafbfc',
                          borderBottom: '1px solid #f1f5f9',
                          borderLeft: '3px solid #3E86C7'
                        }}
                      >
                        <td style={{ ...tdStyle, color: '#3E86C7', fontWeight: 600 }}>
                          {dataProduct.find(p => p.id === record.id_product)?.code || record.id_product}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'left', color: '#1f2937' }}>{record.name_product}</td>
                        <td style={{ ...tdStyle, fontSize: '11px', color: '#6b7280' }}>
                          {new Date(record.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ ...tdStyle, fontSize: '11px', color: '#6b7280' }}>{record.person}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: '#3E86C7' }}>
                          {(() => { const code = dataProduct.find(p => p.id === record.id_product)?.code; return code && liveBalanceMap[code] != null ? liveBalanceMap[code] : record.balance; })()}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{record.actual}</td>
                        <td style={tdStyle}>
                          {(() => {
                            const code = dataProduct.find(p => p.id === record.id_product)?.code;
                            const bal = code && liveBalanceMap[code] != null ? liveBalanceMap[code] : record.balance;
                            const diff = record.actual - bal;
                            return (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '36px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 700,
                                background: diff > 0 ? '#D3F0E2' : diff < 0 ? '#fee2e2' : '#f3f4f6',
                                color: diff > 0 ? '#147F56' : diff < 0 ? '#dc2626' : '#6b7280'
                              }}>
                                {diff > 0 ? '+' : ''}{diff}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ====== TAB: RESULTS ====== */}
          {activeTab === 'results' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {/* Search */}
              <div style={{ marginBottom: '16px', position: 'relative', maxWidth: '400px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="ค้นหาสินค้า..."
                  value={resultsSearchQuery}
                  onChange={(e) => setResultsSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 10px 9px 34px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontFamily: 'Kanit, sans-serif',
                    outline: 'none',
                    background: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#3E86C7' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0' }}
                />
                {resultsSearchQuery && (
                  <button
                    onClick={() => setResultsSearchQuery('')}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: '#e5e7eb', border: 'none', borderRadius: '50%',
                      width: '20px', height: '20px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', cursor: 'pointer'
                    }}
                  >
                    <X size={10} color="#6b7280" />
                  </button>
                )}
              </div>

              {filteredResultsRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                  <FileText size={48} style={{ marginBottom: '12px', color: '#d1d5db' }} />
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                    {resultsSearchQuery ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีผลการนับ'}
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    {resultsSearchQuery ? 'ลองค้นหาด้วยคำอื่น' : 'เริ่มนับ stock เพื่อดูผลลัพธ์'}
                  </div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ ...thStyle, width: '70px' }}>รหัส</th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>ชื่อสินค้า</th>
                      <th style={{ ...thStyle, width: '110px' }}>วันที่</th>
                      <th style={{ ...thStyle, width: '80px' }}>ผู้นับ</th>
                      <th style={{ ...thStyle, width: '80px' }}>คงเหลือ</th>
                      <th style={{ ...thStyle, width: '80px' }}>นับได้</th>
                      <th style={{ ...thStyle, width: '80px' }}>ผลต่าง</th>
                      <th style={{ ...thStyle, width: '90px' }}>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResultsRecords.map((record, index) => (
                      <tr
                        key={record.id}
                        style={{
                          backgroundColor: index % 2 === 0 ? 'white' : '#fafbfc',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                      >
                        <td style={{ ...tdStyle, color: '#3E86C7', fontWeight: 600 }}>
                          {dataProduct.find(p => p.id === record.id_product)?.code || record.id_product}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'left', color: '#1f2937' }}>{record.name_product}</td>
                        <td style={{ ...tdStyle, fontSize: '11px', color: '#6b7280' }}>
                          {new Date(record.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {' '}
                          {new Date(record.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ ...tdStyle, fontSize: '11px', color: '#6b7280' }}>{record.person}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: '#3E86C7' }}>
                          {(() => { const code = dataProduct.find(p => p.id === record.id_product)?.code; return code && liveBalanceMap[code] != null ? liveBalanceMap[code] : record.balance; })()}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{record.actual}</td>
                        <td style={tdStyle}>
                          {(() => {
                            const code = dataProduct.find(p => p.id === record.id_product)?.code;
                            const bal = code && liveBalanceMap[code] != null ? liveBalanceMap[code] : record.balance;
                            const diff = record.actual - bal;
                            return (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '36px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 700,
                                background: diff > 0 ? '#D3F0E2' : diff < 0 ? '#fee2e2' : '#f3f4f6',
                                color: diff > 0 ? '#147F56' : diff < 0 ? '#dc2626' : '#6b7280'
                              }}>
                                {diff > 0 ? '+' : ''}{diff}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: record.status === 'pending' ? '#fef3c7' : '#D3F0E2',
                            color: record.status === 'pending' ? '#d97706' : '#147F56'
                          }}>
                            {record.status === 'pending' ? 'Diff' : 'Complete'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ====== TAB: SUMMARY ====== */}
          {activeTab === 'summary' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '20px'
              }}>
                {/* Total Counted */}
                <div style={{
                  background: 'white',
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: '#E5EEF8',
                    color: '#2A6AAA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <ClipboardList size={24} />
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#1f2937' }}>{totalCounted}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>รายการนับทั้งหมด</div>
                </div>

                {/* Pending */}
                <div style={{
                  background: 'white',
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: '#ffedd5',
                    color: '#ea580c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <AlertTriangle size={24} />
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#1f2937' }}>{pendingCount}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>รอตรวจสอบ</div>
                </div>

                {/* Diff Positive */}
                <div style={{
                  background: 'white',
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: '#E5EEF8',
                    color: '#2A6AAA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <Plus size={24} />
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#2A6AAA' }}>+{totalDiffPositive}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>ผลต่างบวก</div>
                </div>

                {/* Diff Negative */}
                <div style={{
                  background: 'white',
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: '#f3e8ff',
                    color: '#9333ea',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <Minus size={24} />
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#dc2626' }}>{totalDiffNegative}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>ผลต่างลบ</div>
                </div>
              </div>

              {/* Net Diff */}
              <div style={{
                background: 'white',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: '#E5EEF8',
                  color: '#2A6AAA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <BarChart3 size={28} />
                </div>
                <div style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  color: (totalDiffPositive + totalDiffNegative) >= 0 ? '#147F56' : '#dc2626'
                }}>
                  {(totalDiffPositive + totalDiffNegative) >= 0 ? '+' : ''}{totalDiffPositive + totalDiffNegative}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>ผลต่างสุทธิ</div>
              </div>
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1f2937',
            color: 'white',
            padding: '10px 24px',
            borderRadius: '10px',
            fontSize: '13px',
            fontFamily: 'Kanit, sans-serif',
            zIndex: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            animation: 'scmFadeIn 0.3s ease'
          }}>
            {toast}
          </div>
        )}
      </div>

      {/* Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes scmFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scmSlideIn {
            from { opacity: 0; transform: translate(-50%, -48%); }
            to { opacity: 1; transform: translate(-50%, -50%); }
          }
        `
      }} />
    </>
  );
}

// Shared styles
const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: '12px',
  fontWeight: 600,
  color: '#475569',
  textAlign: 'center',
  fontFamily: 'Kanit, sans-serif',
  borderBottom: '2px solid #e2e8f0',
  whiteSpace: 'nowrap'
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'center',
  fontFamily: 'Kanit, sans-serif',
  fontSize: '12px',
  color: '#334155'
};

const qtyBtnStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '6px',
  border: '1px solid #e2e8f0',
  background: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#6b7280',
  transition: 'all 0.15s'
};
