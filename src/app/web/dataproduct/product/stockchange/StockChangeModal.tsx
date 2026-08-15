'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toThaiDateString } from '@/utils/dateUtils'
import {
  X, Search, Package, Plus, Save, Trash2, Leaf, RefreshCw, Box
} from 'lucide-react'
import { fetchBarcodeAliases, buildAliasesByCode } from '@/lib/barcodeAliasClient'

const apidatalist = "datalist"
const apiitemRC = "receivelist"
const apisaleitem = "sale_cal/sale_list_item"
const apibalance = "sale_cal/sale_balance"

interface StockChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StockChangeModal({ isOpen, onClose }: StockChangeModalProps) {
  // Search & product list
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Selected product
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedItemCode, setSelectedItemCode] = useState('');

  // Product detail
  const [productDetail, setProductDetail] = useState<any>(null);
  const [itemRC, setItemRC] = useState<any[]>([]);
  const [itemSale, setItemSale] = useState<any[]>([]);
  const [itemBalance, setItemBalance] = useState<any[]>([]);

  // Editable balances for receive list
  const [editedBalances, setEditedBalances] = useState<{ [key: number]: string }>({});
  const [editedDateRCValues, setEditedDateRCValues] = useState<{ [key: number]: string }>({});
  const [editedLotRCValues, setEditedLotRCValues] = useState<{ [key: number]: string }>({});
  const [editedDateExpRCValues, setEditedDateExpRCValues] = useState<{ [key: number]: string }>({});
  const [editedQtyRCValues, setEditedQtyRCValues] = useState<{ [key: number]: string }>({});

  // Receive modal
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [receiveForm, setReceiveForm] = useState({
    qty: '', unit: '', newCost: '', dateExp: '', lot: '',
    dateRC: toThaiDateString()
  });

  // GEN modal
  const [showGenModal, setShowGenModal] = useState(false);
  const [checkchangeList, setCheckchangeList] = useState<any[]>([]);
  const [editedQtyValues, setEditedQtyValues] = useState<{ [key: number]: string }>({});
  const [editedDateExpValues, setEditedDateExpValues] = useState<{ [key: number]: string }>({});
  const [editedLotValues, setEditedLotValues] = useState<{ [key: number]: string }>({});

  // Toast
  const [toast, setToast] = useState('');
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  // บาร์โค้ดสำรองจัดกลุ่มตามรหัสสินค้า — ใช้เฉพาะกรองผลค้นหา
  // การปรับยอดยังอ้างอิง productDetail.Barcode (บาร์โค้ดหลัก) เหมือนเดิมทุกจุด
  const [aliasesByCode, setAliasesByCode] = useState<Map<string, string[]>>(new Map());

  // Fetch product list
  useEffect(() => {
    if (!isOpen) return;
    const fetchProducts = async () => {
      const company = localStorage.getItem("company_") || "";
      try {
        setLoadingProducts(true);
        const [res, aliases] = await Promise.all([
          axios.get(`/api/${apidatalist}?company=${company}`),
          fetchBarcodeAliases(company),
        ]);
        setProducts(res.data || []);
        setAliasesByCode(buildAliasesByCode(aliases));
      } catch (e) { console.error(e); }
      finally { setLoadingProducts(false); }
    };
    fetchProducts();
  }, [isOpen]);

  // Fetch product detail when selected
  useEffect(() => {
    if (!selectedProductId) return;
    const fetchAll = async () => {
      try {
        await fetchProductDetail();
        await fetchReceiveItems();
        await fetchSaleItems();
        await fetchBalance();
      } catch (e) { console.error(e); }
    };
    fetchAll();
  }, [selectedProductId]);

  const fetchProductDetail = async () => {
    try {
      const res = await axios.get(`/api/${apidatalist}/${Number(selectedProductId)}`);
      setProductDetail(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchReceiveItems = async () => {
    const company = localStorage.getItem("company_") || "";
    try {
      const res = await axios.get(`/api/${apiitemRC}?company=${company}&itemcode=${selectedItemCode}`);
      setItemRC(res.data || []);
      const initialBalances: { [key: number]: string } = {};
      (res.data || []).forEach((item: any) => { initialBalances[item.id] = String(item.balance ?? 0); });
      setEditedBalances(initialBalances);
      const initialDates: { [key: number]: string } = {};
      const initialLots: { [key: number]: string } = {};
      (res.data || []).forEach((item: any) => {
        initialDates[item.id] = item.dateRC ? toThaiDateString(item.dateRC) : '';
        initialLots[item.id] = String(item.lot ?? '');
      });
      setEditedDateRCValues(initialDates);
      setEditedLotRCValues(initialLots);
      const initialExps: { [key: number]: string } = {};
      (res.data || []).forEach((item: any) => {
        initialExps[item.id] = item.dateExp ? toThaiDateString(item.dateExp) : '';
      });
      setEditedDateExpRCValues(initialExps);
      const initialQtys: { [key: number]: string } = {};
      (res.data || []).forEach((item: any) => { initialQtys[item.id] = String(item.qty ?? 0); });
      setEditedQtyRCValues(initialQtys);
    } catch (e) { console.error(e); }
  };

  const fetchSaleItems = async () => {
    const company = localStorage.getItem("company_") || "";
    try {
      const res = await axios.get(`/api/${apisaleitem}?company=${company}&code_product=${selectedItemCode}`);
      setItemSale(res.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchBalance = async () => {
    const company = localStorage.getItem("company_") || "";
    try {
      const idQuery = selectedProductId ? `&id=${selectedProductId}` : '';
      const res = await axios.get(`/api/${apibalance}?company=${company}&code_product=${selectedItemCode}${idQuery}`);
      setItemBalance(res.data || []);
    } catch (e) { console.error(e); }
  };

  const selectProduct = (product: any) => {
    setSelectedProductId(String(product.id));
    setSelectedItemCode(String(product.code));
  };

  // Filtered product search
  const filteredProducts = products.filter((p: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.ProductName?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q) || p.Barcode?.toLowerCase().includes(q)
      // บาร์โค้ดสำรองของสินค้าตัวเดียวกัน
      || (aliasesByCode.get(p.code) || []).some((b: string) => b.toLowerCase().includes(q));
  });

  // Date format conversion helpers (dd/mm/yyyy <-> yyyy-mm-dd)
  const isoToDisplay = (iso: string) => {
    if (!iso) return '';
    const d = iso.split('T')[0]; // ensure no time part
    const [y, m, dd] = d.split('-');
    if (!y || !m || !dd) return iso;
    return `${dd}/${m}/${y}`;
  };
  const displayToISO = (display: string) => {
    if (!display) return '';
    const parts = display.split('/');
    if (parts.length !== 3) return '';
    const [dd, mm, yyyy] = parts;
    if (!dd || !mm || !yyyy || yyyy.length !== 4) return '';
    return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
  };

  // Format helpers
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };
  const getDaysUntilExpiry = (dateExp: string) => {
    if (!dateExp) return 0;
    return Math.floor((new Date(dateExp).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  // Receive form
  const resetReceiveForm = () => {
    setReceiveForm({ qty: '', unit: productDetail?.Unit || '', newCost: '', dateExp: '', lot: '', dateRC: toThaiDateString() });
  };
  const openReceiveModal = () => { resetReceiveForm(); setReceiveForm(prev => ({ ...prev, unit: productDetail?.Unit || '' })); setShowReceiveModal(true); };

  const handleSaveReceive = async () => {
    if (!receiveForm.qty || !receiveForm.unit) { alert('กรุณากรอกจำนวนและหน่วย'); return; }
    setIsSaving(true);
    try {
      const company = localStorage.getItem("company_") || "";
      await axios.post('/api/receivelist', {
        company, codenames: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 11),
        itemcode: selectedItemCode, itemName: productDetail.ProductName,
        qty: Number(receiveForm.qty), unit: receiveForm.unit,
        newCost: Number(receiveForm.newCost) || 0,
        totalcost: Number(receiveForm.qty) * (Number(receiveForm.newCost) || 0),
        dateRC: new Date(receiveForm.dateRC),
        dateExp: receiveForm.dateExp ? new Date(receiveForm.dateExp) : null,
        lot: receiveForm.lot || '', freebaht: 0, discountbaht: 0, sale: 0, balance: Number(receiveForm.qty),
        Barcode: productDetail.Barcode || '', type: productDetail.type || '',
        person: localStorage.getItem("person_") || '', statuss: 'รับสินค้า', codevender: '', namevender: ''
      });
      await fetchReceiveItems(); await fetchBalance();
      setShowReceiveModal(false); resetReceiveForm(); showToast('บันทึกรับสินค้าสำเร็จ');
    } catch (e) { console.error(e); alert('เกิดข้อผิดพลาดในการบันทึก'); }
    finally { setIsSaving(false); }
  };

  // Update balance, dateRC, lot
  const handleUpdateBalance = async (p: any) => {
    const newBalance = editedBalances[p.id];
    const newDateRC = editedDateRCValues[p.id];
    const newLot = editedLotRCValues[p.id];
    const newDateExp = editedDateExpRCValues[p.id];
    const newQty = editedQtyRCValues[p.id];
    if (newBalance === undefined) return;
    try {
      await axios.put(`/api/receivelist/${p.id}`, {
        company: p.company, codenames: p.codenames, itemcode: p.itemcode, itemName: p.itemName,
        unit: p.unit, newCost: p.newCost, qty: newQty !== undefined ? Number(newQty) : p.qty,
        totalcost: newQty !== undefined ? Number(newQty) * Number(p.newCost) : p.totalcost,
        lot: newLot !== undefined ? newLot : p.lot,
        dateRC: newDateRC ? new Date(newDateRC) : p.dateRC,
        dateExp: newDateExp !== undefined ? (newDateExp ? new Date(newDateExp) : null) : p.dateExp, freebaht: p.freebaht, discountbaht: p.discountbaht, sale: p.sale,
        balance: Number(newBalance), Barcode: p.Barcode, type: p.type, person: p.person, statuss: p.statuss
      });
      await fetchReceiveItems(); await fetchBalance(); showToast('บันทึกสำเร็จ');
    } catch (e) { console.error(e); alert('เกิดข้อผิดพลาดในการบันทึก'); }
  };

  // Delete receive item
  const handleDeleteReceiveItem = async (itemId: number) => {
    if (!confirm('ต้องการลบรายการนี้หรือไม่?')) return;
    try {
      await axios.delete(`/api/receivelist/${itemId}`);
      await fetchReceiveItems(); await fetchBalance(); showToast('ลบข้อมูลสำเร็จ');
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  // GEN modal
  const fetchCheckchangeList = async () => {
    const company = localStorage.getItem("company_") || "";
    try {
      const res = await axios.get(`/api/checkchange?company=${company}&itemcode=${selectedItemCode}`);
      setCheckchangeList(res.data || []);
      const iq: any = {}, id: any = {}, il: any = {};
      (res.data || []).forEach((item: any) => {
        iq[item.id] = String(item.qty || '');
        id[item.id] = item.dateExp ? toThaiDateString(item.dateExp) : '';
        il[item.id] = String(item.lot || '');
      });
      setEditedQtyValues(iq); setEditedDateExpValues(id); setEditedLotValues(il);
    } catch (e) { console.error(e); }
  };

  const openGenModal = async () => { await fetchCheckchangeList(); setShowGenModal(true); };

  const handleAddToReceivelist = async (item: any) => {
    const editedQty = editedQtyValues[item.id] || item.qty;
    if (!editedQty || Number(editedQty) <= 0) { alert('กรุณากรอกจำนวนที่ถูกต้อง'); return; }
    try {
      const company = localStorage.getItem("company_") || "";
      const correctUnit = item.unit && item.unit !== '-' ? item.unit : productDetail?.Unit;
      await axios.post('/api/receivelist', {
        company, codenames: '20251101100', itemcode: selectedItemCode, itemName: productDetail?.ProductName,
        unit: correctUnit, newCost: Number(item.newCost) || 0, qty: Number(editedQty),
        totalcost: Number(item.newCost) * Number(editedQty) || 0,
        lot: String(editedLotValues[item.id] || item.lot || ''),
        dateExp: editedDateExpValues[item.id] ? new Date(editedDateExpValues[item.id]) : (item.dateExp ? new Date(item.dateExp) : null),
        dateRC: new Date('2025-11-11'), freebaht: 0, discountbaht: 0, sale: 0, balance: Number(editedQty),
        Barcode: productDetail?.Barcode || '', type: productDetail?.type || '',
        person: localStorage.getItem("person_") || '', statuss: 'ปรับยอด',
        codevender: '0000', namevender: 'ยกยอดให้ร้าน'
      });
      await fetchReceiveItems(); await fetchBalance(); showToast('เพิ่มข้อมูลสำเร็จ');
    } catch (e) { console.error(e); alert('เกิดข้อผิดพลาดในการเพิ่มข้อมูล'); }
  };

  const handleAddToReceivelist1 = async () => {
    try {
      const company = localStorage.getItem("company_") || "";
      const bal = Number(itemBalance.map((r: any) => r.balance));
      if (bal >= 0) { alert('Stock เป็นบวก ไม่สามารถสร้างข้อมูลได้'); return; }
      await axios.post('/api/receivelist', {
        company, codenames: '20251101101', itemcode: selectedItemCode, itemName: productDetail?.ProductName,
        unit: productDetail?.Unit, newCost: Number(productDetail?.CostActual),
        qty: Math.abs(bal), totalcost: Number(productDetail?.CostActual) * Math.abs(bal),
        lot: "9999", dateExp: new Date("2025-11-11 17:00:00"), dateRC: new Date("2025-11-11 17:00:00"),
        freebaht: 0, discountbaht: 0, sale: Math.abs(bal), balance: 0,
        Barcode: productDetail?.Barcode || '', type: productDetail?.type || '',
        person: localStorage.getItem("person_") || '', statuss: 'ปรับยอด',
        codevender: '0000', namevender: 'ยกยอดให้ร้าน'
      });
      await fetchReceiveItems(); await fetchBalance(); showToast('เพิ่มข้อมูลสำเร็จ');
    } catch (e) { console.error(e); alert('เกิดข้อผิดพลาด'); }
  };

  const handleAddToReceivelist2 = async () => {
    try {
      const company = localStorage.getItem("company_") || "";
      const bal = Number(itemBalance.map((r: any) => r.balance));
      if (bal >= 0) { alert('Stock เป็นบวก ไม่สามารถสร้างข้อมูลได้'); return; }
      await axios.post('/api/checkchange', {
        company, codenames: '20251101101', itemcode: selectedItemCode, itemName: productDetail?.ProductName,
        unit: productDetail?.Unit, newCost: Number(productDetail?.CostActual),
        qty: Math.abs(bal), totalcost: 0,
        lot: "9999", dateExp: new Date("2025-11-11 17:00:00"), dateRC: new Date("2025-11-11 17:00:00"),
        freebaht: 0, discountbaht: 0, sale: Math.abs(bal), balance: 0,
        Barcode: productDetail?.Barcode || '', type: productDetail?.type || '',
        person: localStorage.getItem("person_") || '', statuss: 'ปรับยอด',
        codevender: '0000', namevender: 'ยกยอดให้ร้าน'
      });
      await fetchReceiveItems(); await fetchBalance(); showToast('เพิ่มข้อมูลสำเร็จ');
    } catch (e) { console.error(e); alert('เกิดข้อผิดพลาด'); }
  };

  if (!isOpen) return null;

  const balanceVal = itemBalance.length > 0 ? itemBalance.map((r: any) => r.balance) : [0];

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)', zIndex: 9998, animation: 'scmFadeIn2 0.2s ease'
      }} />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '92vw', maxWidth: '1200px', height: '90vh',
        backgroundColor: '#f8fafc', borderRadius: '16px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)', zIndex: 9999,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: 'Kanit, sans-serif', animation: 'scmSlideIn2 0.3s ease'
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          padding: '14px 24px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
            <Package size={22} />
            <span style={{ fontSize: '18px', fontWeight: 600 }}>ปรับ Lot และ ยอดคงเหลือ</span>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '10px', color: 'white', width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left: Product search */}
          <div style={{
            width: '320px', borderRight: '1px solid #e2e8f0',
            display: 'flex', flexDirection: 'column', backgroundColor: 'white', flexShrink: 0
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Search size={14} color="#8b5cf6" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>ค้นหาสินค้า</span>
              </div>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input type="text" placeholder="ชื่อสินค้า, รหัส, Barcode..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 10px 9px 32px', border: '1px solid #e2e8f0',
                    borderRadius: '8px', fontSize: '12px', fontFamily: 'Kanit, sans-serif', outline: 'none'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#8b5cf6' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{
                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                    background: '#e5e7eb', border: 'none', borderRadius: '50%',
                    width: '18px', height: '18px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer'
                  }}>
                    <X size={10} color="#6b7280" />
                  </button>
                )}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingProducts ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: '13px' }}>
                  <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                  <div>กำลังโหลดข้อมูล...</div>
                </div>
              ) : (
                filteredProducts.slice(0, 100).map((product: any) => (
                  <div key={product.id} onClick={() => selectProduct(product)}
                    style={{
                      padding: '10px 16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer',
                      transition: 'background 0.15s', display: 'flex', alignItems: 'center', gap: '10px',
                      backgroundColor: String(product.id) === selectedProductId ? '#f5f3ff' : 'transparent',
                      borderLeft: String(product.id) === selectedProductId ? '3px solid #8b5cf6' : '3px solid transparent'
                    }}
                    onMouseOver={(e) => { if (String(product.id) !== selectedProductId) e.currentTarget.style.backgroundColor = '#faf5ff' }}
                    onMouseOut={(e) => { if (String(product.id) !== selectedProductId) e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <div style={{
                      background: '#f5f3ff', color: '#8b5cf6', padding: '3px 8px',
                      borderRadius: '6px', fontSize: '11px', fontWeight: 600, minWidth: '55px', textAlign: 'center'
                    }}>{product.code}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.ProductName}</div>
                      <div style={{ fontSize: '10px', color: '#9ca3af' }}>{product.Barcode}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Stock detail */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!selectedProductId || !productDetail ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                <div style={{ textAlign: 'center' }}>
                  <Package size={48} style={{ marginBottom: '12px', color: '#d1d5db' }} />
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#6b7280' }}>กรุณาเลือกสินค้า</div>
                  <div style={{ fontSize: '13px' }}>เลือกสินค้าจากรายการด้านซ้าย</div>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

                {/* Product Info */}
                <div style={{
                  background: 'white', borderRadius: '14px', padding: '16px 20px',
                  marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid #f0f0f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>รหัสสินค้า: <strong style={{ color: '#8b5cf6', fontSize: '13px' }}>{productDetail.code}</strong></span>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>Barcode: <strong style={{ color: '#1f2937' }}>{productDetail.Barcode}</strong></span>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#1f2937', marginBottom: '6px' }}>{productDetail.ProductName}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '10px' }}>
                    {[
                      { label: 'ชื่อสามัญ', value: productDetail.fixname },
                      { label: 'กลุ่มสินค้า', value: productDetail.group },
                      { label: 'หมวด', value: productDetail.Category },
                      { label: 'พื้นที่เก็บ', value: productDetail.Area },
                      { label: 'หน่วย', value: productDetail.Unit },
                      { label: 'ราคา', value: `${productDetail.price || 0} บาท` },
                    ].map((item, i) => (
                      <div key={i}>
                        <div style={{ fontSize: '10px', color: '#9ca3af' }}>{item.label}</div>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>{item.value || '-'}</div>
                      </div>
                    ))}
                  </div>
                  {/* Balance row */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: 'linear-gradient(135deg, #E5EEF8 0%, #CCDFF1 100%)',
                      padding: '8px 14px', borderRadius: '10px', border: '2px solid #3E86C7', flex: 1, minWidth: '130px'
                    }}>
                      <span style={{ fontSize: '12px', color: '#173F6B', fontWeight: 500 }}>คงเหลือ:</span>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#2A6AAA' }}>{balanceVal}</span>
                      <span style={{ fontSize: '12px', color: '#2A6AAA' }}>{productDetail.Unit}</span>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'linear-gradient(135deg, #E5EEF8 0%, #CCDFF1 100%)',
                      padding: '8px 14px', borderRadius: '10px', border: '2px solid #3E86C7'
                    }}>
                      <span style={{ fontSize: '12px', color: '#1E5088', fontWeight: 500 }}>รับ:</span>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#2A6AAA' }}>
                        {itemRC.reduce((sum: number, it: any) => sum + (Number(it.qty) || 0), 0)}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                      padding: '8px 14px', borderRadius: '10px', border: '2px solid #ef4444'
                    }}>
                      <span style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 500 }}>ขาย:</span>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#dc2626' }}>
                        {itemSale.reduce((sum: number, it: any) => {
                          const subqty = it.subqty;
                          if (subqty === 0 || subqty === "" || subqty === null || subqty === undefined) {
                            return sum + (Number(it.qty) || 0);
                          } else {
                            return sum + (Number(it.subqty) || 0);
                          }
                        }, 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Receive Section */}
                <div style={{
                  background: 'white', borderRadius: '14px', marginBottom: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #f0f0f0'
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px 16px', background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#0891b2' }}>📦 ข้อมูลรับสินค้า</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                      {Number(balanceVal) >= 0 ? (
                        <button onClick={openGenModal} style={{
                          padding: '5px 14px', borderRadius: '8px',
                          background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                          border: 'none', color: 'white', fontWeight: 600, fontSize: '12px',
                          fontFamily: 'Kanit, sans-serif', cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(239,68,68,0.3)'
                        }}>GEN</button>
                      ) : (
                        <button onClick={() => { handleAddToReceivelist1(); handleAddToReceivelist2(); }} style={{
                          padding: '5px 14px', borderRadius: '8px',
                          background: 'linear-gradient(135deg, #707070 0%, #868585 100%)',
                          border: 'none', color: 'white', fontWeight: 600, fontSize: '12px',
                          fontFamily: 'Kanit, sans-serif', cursor: 'pointer'
                        }}>GEN 0</button>
                      )}
                      <button onClick={openReceiveModal} style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, #6BA3D8 0%, #3E86C7 100%)',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', boxShadow: '0 2px 6px rgba(62, 134, 199,0.3)'
                      }}>
                        <Plus size={18} color="white" />
                      </button>
                    </div>
                  </div>
                  {itemRC.length > 0 ? (
                    <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ background: '#f9fafb', position: 'sticky', top: 0, zIndex: 5 }}>
                            {['วันที่รับ', 'ผู้รับ', 'รับ', 'คงเหลือ', 'หน่วยย่อย', 'ทุนใหม่', 'หมดอายุ', 'Lot', ''].map((h, i) => (
                              <th key={i} style={{ ...thStyle2, textAlign: i === 0 ? 'left' : 'center' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...itemRC].sort((a: any, b: any) => new Date(b.dateRC).getTime() - new Date(a.dateRC).getTime()).map((p: any, idx: number) => {
                            const daysLeft = getDaysUntilExpiry(p.dateExp);
                            return (
                              <tr key={p.id} style={{
                                backgroundColor: idx % 2 === 0 ? 'white' : '#fafbfc',
                                borderBottom: '1px solid #f1f5f9'
                              }}>
                                <td style={{ ...tdStyle2, textAlign: 'left' }}>
                                  <input type="date" lang="en-GB"
                                    value={editedDateRCValues[p.id] ?? ''}
                                    onChange={(e) => setEditedDateRCValues(prev => ({ ...prev, [p.id]: e.target.value }))}
                                    style={{
                                      width: '130px', padding: '2px 4px', border: '1px solid #d1d5db',
                                      borderRadius: '4px', fontSize: '11px', fontFamily: 'Kanit, sans-serif', outline: 'none'
                                    }}
                                  />
                                </td>
                                <td style={{ ...tdStyle2, fontSize: '11px', color: '#6b7280' }}>{p.person}</td>
                                <td style={tdStyle2}>
                                  <input type="number"
                                    value={editedQtyRCValues[p.id] ?? p.qty}
                                    onChange={(e) => setEditedQtyRCValues(prev => ({ ...prev, [p.id]: e.target.value }))}
                                    style={{
                                      width: '55px', padding: '2px 4px', border: '1px solid #d1d5db',
                                      borderRadius: '4px', fontSize: '12px', fontWeight: 600, color: '#2A6AAA',
                                      textAlign: 'center', fontFamily: 'Kanit, sans-serif', outline: 'none'
                                    }}
                                  />
                                </td>
                                <td style={tdStyle2}>
                                  <input type="number"
                                    value={editedBalances[p.id] ?? p.balance}
                                    disabled
                                    style={{
                                      width: '55px', padding: '3px 4px', border: '1px solid #d1d5db',
                                      borderRadius: '4px', fontSize: '12px', fontWeight: 700, color: '#2A6AAA',
                                      textAlign: 'center', background: '#f3f4f6', fontFamily: 'Kanit, sans-serif', outline: 'none',
                                      cursor: 'not-allowed', opacity: 0.7
                                    }}
                                  />
                                </td>
                                <td style={{ ...tdStyle2, fontSize: '11px' }}>{p.unit}</td>
                                <td style={tdStyle2}>{p.newCost}</td>
                                <td style={tdStyle2}>
                                  <input type="date" lang="en-GB"
                                    value={editedDateExpRCValues[p.id] ?? ''}
                                    onChange={(e) => setEditedDateExpRCValues(prev => ({ ...prev, [p.id]: e.target.value }))}
                                    style={{
                                      width: '130px', padding: '2px 4px',
                                      border: `1px solid ${(editedDateExpRCValues[p.id] && getDaysUntilExpiry(editedDateExpRCValues[p.id]) <= 30) ? '#dc2626' : '#d1d5db'}`,
                                      borderRadius: '4px', fontSize: '11px', fontFamily: 'Kanit, sans-serif', outline: 'none',
                                      color: (editedDateExpRCValues[p.id] && getDaysUntilExpiry(editedDateExpRCValues[p.id]) <= 30) ? '#dc2626' : '#147F56'
                                    }}
                                  />
                                </td>
                                <td style={tdStyle2}>
                                  <input type="text"
                                    value={editedLotRCValues[p.id] ?? ''}
                                    onChange={(e) => setEditedLotRCValues(prev => ({ ...prev, [p.id]: e.target.value }))}
                                    style={{
                                      width: '60px', padding: '2px 4px', border: '1px solid #d1d5db',
                                      borderRadius: '4px', fontSize: '11px', fontFamily: 'Kanit, sans-serif', outline: 'none'
                                    }}
                                  />
                                </td>
                                <td style={tdStyle2}>
                                  <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
                                    <button onClick={() => handleUpdateBalance(p)} style={{
                                      width: '24px', height: '24px', borderRadius: '4px',
                                      border: '1px solid #3E86C7', background: 'transparent',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      cursor: 'pointer', padding: 0
                                    }}>
                                      <Save size={12} color="#3E86C7" />
                                    </button>
                                    <button onClick={() => handleDeleteReceiveItem(p.id)} style={{
                                      width: '24px', height: '24px', borderRadius: '4px',
                                      background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                                      border: 'none', display: 'flex', alignItems: 'center',
                                      justifyContent: 'center', cursor: 'pointer'
                                    }}>
                                      <Trash2 size={12} color="white" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '13px' }}>ไม่มีข้อมูลการรับสินค้า</div>
                  )}
                </div>

                {/* Sales Section */}
                <div style={{
                  background: 'white', borderRadius: '14px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #f0f0f0'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#d97706' }}>💰 ข้อมูลขายสินค้า</span>
                  </div>
                  {itemSale.length > 0 ? (
                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ background: '#f9fafb', position: 'sticky', top: 0, zIndex: 5 }}>
                            {['วันที่ขาย', 'ขาย', 'หน่วย', 'ขายหน่วยย่อย','หน่วยย่อย', 'สถานะ'].map((h, i) => (
                              <th key={i} style={thStyle2}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...itemSale].sort((a: any, b: any) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime()).map((p: any, idx: number) => (
                            <tr key={p.id} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ ...tdStyle2, fontSize: '11px' }}>{formatDateTime(p.createDate)}</td>
                              <td style={{ ...tdStyle2, fontWeight: 600, color: '#2A6AAA' }}>{p.qty}</td>
                              <td style={{ ...tdStyle2, fontSize: '11px' }}>{p.unit}</td>
                              <td style={{ ...tdStyle2, fontWeight: 600, color: '#2A6AAA' }}>{p.subqty}</td>
                              <td style={{ ...tdStyle2, fontSize: '11px' }}>{p.subunit}</td>
                              <td style={{ ...tdStyle2, color: p.statuss === 'OK' ? '#147F56' : '#374151', fontWeight: 500, fontSize: '11px' }}>{p.statuss}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '13px' }}>ไม่มีข้อมูลการขายสินค้า</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
            background: '#1f2937', color: 'white', padding: '10px 24px', borderRadius: '10px',
            fontSize: '13px', fontFamily: 'Kanit, sans-serif', zIndex: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)', animation: 'scmFadeIn2 0.3s ease'
          }}>{toast}</div>
        )}
      </div>

      {/* Receive Modal */}
      {showReceiveModal && (
        <div onClick={() => setShowReceiveModal(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)', zIndex: 10001,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: '16px', width: '420px', maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            animation: 'scmSlideIn2 0.3s ease'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
              borderBottom: '1px solid #e5e7eb', borderRadius: '16px 16px 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 600, color: '#0891b2' }}>
                <Leaf size={18} /> เพิ่มข้อมูลรับสินค้า
              </div>
              <button onClick={() => setShowReceiveModal(false)} style={{
                width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(8,145,178,0.1)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}>
                <X size={16} color="#0891b2" />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              {/* Balance display */}
              <div style={{
                background: 'linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)',
                border: '2px solid #A6C8E7', borderRadius: '12px', padding: '10px 16px',
                marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#173F6B' }}>คงเหลือ:</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#2A6AAA' }}>{balanceVal} {productDetail?.Unit}</span>
              </div>
              {/* Qty & Unit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle2}>จำนวน *</label>
                  <input type="number" placeholder="0" value={receiveForm.qty}
                    onChange={e => setReceiveForm({ ...receiveForm, qty: e.target.value })} style={inputStyle2} />
                </div>
                <div>
                  <label style={labelStyle2}>หน่วย *</label>
                  <input type="text" placeholder="หน่วย" value={receiveForm.unit}
                    onChange={e => setReceiveForm({ ...receiveForm, unit: e.target.value })} style={inputStyle2} />
                </div>
              </div>
              {/* New Cost */}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle2}>ทุนใหม่</label>
                <input type="number" placeholder="0.00" step="0.01" value={receiveForm.newCost}
                  onChange={e => setReceiveForm({ ...receiveForm, newCost: e.target.value })} style={inputStyle2} />
              </div>
              {/* Exp & Lot */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle2}>วันหมดอายุ</label>
                  <input type="date" value={receiveForm.dateExp}
                    onChange={e => setReceiveForm({ ...receiveForm, dateExp: e.target.value })} style={inputStyle2} />
                </div>
                <div>
                  <label style={labelStyle2}>Lot</label>
                  <input type="text" placeholder="เลข Lot" value={receiveForm.lot}
                    onChange={e => setReceiveForm({ ...receiveForm, lot: e.target.value })} style={inputStyle2} />
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowReceiveModal(false)} style={{
                flex: 1, padding: '10px', border: '2px solid #e5e7eb', background: 'white',
                borderRadius: '10px', fontFamily: 'Kanit, sans-serif', fontSize: '14px', color: '#6b7280', cursor: 'pointer'
              }}>ยกเลิก</button>
              <button onClick={handleSaveReceive} disabled={isSaving} style={{
                flex: 1, padding: '10px', border: 'none',
                background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                borderRadius: '10px', fontFamily: 'Kanit, sans-serif', fontSize: '14px', color: 'white',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}>
                <Save size={16} /> {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GEN Modal */}
      {showGenModal && (
        <div onClick={() => setShowGenModal(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)', zIndex: 10001,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: '16px', width: '600px', maxHeight: '80vh',
            overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            animation: 'scmSlideIn2 0.3s ease'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              borderBottom: '1px solid #e5e7eb', borderRadius: '16px 16px 0 0'
            }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#dc2626' }}>📋 รายการปรับยอดสินค้า</div>
              <button onClick={() => setShowGenModal(false)} style={{
                width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(220,38,38,0.1)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}>
                <X size={16} color="#dc2626" />
              </button>
            </div>
            {/* Product info bar */}
            <div style={{
              padding: '10px 20px', fontSize: '13px', background: '#fef3c7',
              borderBottom: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div><strong style={{ color: '#d97706' }}>รหัสสินค้า:</strong> <span style={{ fontWeight: 600 }}>{productDetail?.code}</span></div>
                <div style={{ fontSize: '12px', color: '#374151', fontWeight: 500, marginTop: '2px' }}>{productDetail?.ProductName}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)', padding: '6px 12px', borderRadius: '8px', border: '1px solid #A6C8E7' }}>
                <span style={{ fontSize: '12px', color: '#173F6B', fontWeight: 500 }}>คงเหลือ: </span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#2A6AAA' }}>{balanceVal} {productDetail?.Unit}</span>
              </div>
            </div>
            {/* Checkchange table */}
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {checkchangeList.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', position: 'sticky', top: 0, zIndex: 5 }}>
                      {['จำนวน', 'หน่วย', 'ทุนใหม่', 'หมดอายุ', 'Lot', ''].map((h, i) => (
                        <th key={i} style={thStyle2}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {checkchangeList.map((p: any, idx: number) => (
                      <tr key={p.id} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                        <td style={tdStyle2}>
                          <input type="number" value={editedQtyValues[p.id] || ''}
                            onChange={(e) => setEditedQtyValues(prev => ({ ...prev, [p.id]: e.target.value }))}
                            style={{ ...genInputStyle, width: '70px', fontWeight: 600, textAlign: 'center' }}
                            onFocus={(e) => { e.target.style.borderColor = '#8b5cf6' }}
                            onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
                          />
                        </td>
                        <td style={tdStyle2}>{p.unit && p.unit !== '-' ? p.unit : productDetail?.Unit}</td>
                        <td style={tdStyle2}>{p.newCost}</td>
                        <td style={tdStyle2}>
                          <input type="date" value={editedDateExpValues[p.id] || ''}
                            onChange={(e) => setEditedDateExpValues(prev => ({ ...prev, [p.id]: e.target.value }))}
                            style={{ ...genInputStyle, width: '130px' }}
                            onFocus={(e) => { e.target.style.borderColor = '#8b5cf6' }}
                            onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
                          />
                        </td>
                        <td style={tdStyle2}>
                          <input type="text" placeholder="Lot" value={editedLotValues[p.id] || ''}
                            onChange={(e) => setEditedLotValues(prev => ({ ...prev, [p.id]: e.target.value }))}
                            style={{ ...genInputStyle, width: '90px', textAlign: 'center' }}
                            onFocus={(e) => { e.target.style.borderColor = '#8b5cf6' }}
                            onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
                          />
                        </td>
                        <td style={tdStyle2}>
                          <button onClick={() => handleAddToReceivelist(p)} style={{
                            width: '28px', height: '28px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #6BA3D8 0%, #3E86C7 100%)',
                            border: 'none', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(62, 134, 199,0.3)'
                          }}>
                            <Plus size={14} color="white" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: '13px' }}>ไม่มีข้อมูลปรับยอดสินค้า</div>
              )}
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid #f0f0f0' }}>
              <button onClick={() => setShowGenModal(false)} style={{
                width: '100%', padding: '10px', border: '2px solid #e5e7eb', background: 'white',
                borderRadius: '10px', fontFamily: 'Kanit, sans-serif', fontSize: '14px', color: '#6b7280', cursor: 'pointer'
              }}>ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes scmFadeIn2 { from { opacity: 0; } to { opacity: 1; } }
          @keyframes scmSlideIn2 { from { opacity: 0; transform: translate(-50%, -48%); } to { opacity: 1; transform: translate(-50%, -50%); } }
          @keyframes spin { to { transform: rotate(360deg); } }
        `
      }} />
    </>
  );
}

const thStyle2: React.CSSProperties = {
  padding: '8px 10px', fontSize: '11px', fontWeight: 600, color: '#475569',
  textAlign: 'center', fontFamily: 'Kanit, sans-serif', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap'
};

const tdStyle2: React.CSSProperties = {
  padding: '8px 10px', textAlign: 'center', fontFamily: 'Kanit, sans-serif', fontSize: '12px', color: '#334155'
};

const labelStyle2: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '5px', fontFamily: 'Kanit, sans-serif'
};

const inputStyle2: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '10px',
  fontSize: '14px', fontFamily: 'Kanit, sans-serif', background: '#fafafa', outline: 'none'
};

const genInputStyle: React.CSSProperties = {
  padding: '5px 8px', border: '2px solid #e5e7eb', borderRadius: '8px',
  fontSize: '12px', fontFamily: 'Kanit, sans-serif', background: '#fff', outline: 'none',
  transition: 'border-color 0.2s'
};
