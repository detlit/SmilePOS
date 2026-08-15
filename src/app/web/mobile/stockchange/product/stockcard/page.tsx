
'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toThaiDateString } from '@/utils/dateUtils'
import { useMessageStore } from "../../useMessageStore";
import { Plus, X, Leaf, Save, Trash2 } from 'lucide-react';

// Mobile-optimized StockCard styles
const mobileStockCardStyles = `
  .stock-card-container {
    font-family: 'Kanit', sans-serif;
    padding: 16px;
    padding-bottom: 100px;
    min-height: 100vh;
    background: #f8fafc;
  }

  /* Product Info Card */
  .product-info-card {
    background: white;
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  .product-info-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
    align-items: center;
  }

  .product-info-row:last-child {
    margin-bottom: 0;
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .info-label {
    font-size: 12px;
    color: #6b7280;
    white-space: nowrap;
  }

  .info-value {
    font-size: 12px;
    font-weight: 600;
    color: #1f2937;
  }

  .info-value.highlight {
    font-size: 14px;
    color: #8b5cf6;
  }

  .product-name-display {
    font-size: 14px;
    font-weight: 700;
    color: #1f2937;
    margin: 8px 0;
  }

  /* Balance Display */
  .balance-display {
    display: flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%);
    padding: 12px 16px;
    border-radius: 12px;
    margin-top: 12px;
  }

  .balance-label {
    font-size: 13px;
    color: #2A6AAA;
    font-weight: 500;
  }

  .balance-value {
    font-size: 20px;
    font-weight: 700;
    color: #2A6AAA;
  }

  .balance-unit {
    font-size: 14px;
    color: #2A6AAA;
    font-weight: 500;
  }

  /* Section Card */
  .section-card {
    background: white;
    border-radius: 16px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    overflow: hidden;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 16px;
    background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
    border-bottom: 1px solid #e5e7eb;
  }

  .section-header.receive {
    background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%);
  }

  .section-header.sales {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #7c3aed;
  }

  .section-header.receive .section-title {
    color: #0891b2;
  }

  .section-header.sales .section-title {
    color: #d97706;
  }

  .section-content {
    padding: 0;
    max-height: 300px;
    overflow-y: auto;
  }

  /* Mobile Table */
  .mobile-table {
    width: 100%;
    font-size: 11px;
  }

  .mobile-table-header {
    display: grid;
    background: #f9fafb;
    padding: 10px 12px;
    border-bottom: 1px solid #e5e7eb;
    font-weight: 600;
    color: #6b7280;
    position: sticky;
    top: 0;
  }

  .mobile-table-header.receive-header {
    grid-template-columns: 1fr 0.5fr 0.5fr 0.8fr 0.8fr 0.6fr;
  }

  .mobile-table-header.sales-header {
    grid-template-columns: 1.2fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr;
  }

  .mobile-table-row {
    display: grid;
    padding: 12px;
    border-bottom: 1px solid #f3f4f6;
    align-items: center;
    transition: background 0.2s;
  }

  .mobile-table-row.receive-row {
    grid-template-columns: 1fr 0.5fr 0.5fr 0.8fr 0.8fr 0.6fr;
  }

  .mobile-table-row.sales-row {
    grid-template-columns: 1.2fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr;
  }

  .mobile-table-row:nth-child(even) {
    background: #fafafa;
  }

  .table-cell {
    text-align: center;
    font-size: 11px;
    color: #374151;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 2px;
  }

  .table-cell:first-child {
    text-align: left;
  }

  .table-cell.bold {
    font-weight: 600;
    color: #1f2937;
  }

  .table-cell.success {
    color: #2A6AAA;
    font-weight: 500;
  }

  .table-cell.danger {
    color: #dc2626;
    font-weight: 500;
  }

  /* Empty State */
  .empty-data {
    text-align: center;
    padding: 24px;
    color: #9ca3af;
    font-size: 13px;
  }

  /* Info Grid */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .info-grid-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .grid-label {
    font-size: 11px;
    color: #9ca3af;
  }

  .grid-value {
    font-size: 12px;
    font-weight: 500;
    color: #374151;
  }

  /* Add Receive Button */
  .add-receive-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #6BA3D8 0%, #3E86C7 100%);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(62, 134, 199, 0.3);
    margin-left: auto;
  }

  .add-receive-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(62, 134, 199, 0.4);
  }

  .add-receive-btn:active {
    transform: scale(0.95);
  }

  .section-header-content {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 8px;
  }

  /* Receive Modal */
  .receive-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .receive-modal {
    background: white;
    border-radius: 20px;
    width: 100%;
    max-width: 400px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .receive-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%);
    border-bottom: 1px solid #e5e7eb;
    border-radius: 20px 20px 0 0;
  }

  .receive-modal-title {
    font-size: 16px;
    font-weight: 600;
    color: #0891b2;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .receive-modal-close {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(8, 145, 178, 0.1);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .receive-modal-close:hover {
    background: rgba(8, 145, 178, 0.2);
  }

  .receive-modal-body {
    padding: 20px;
  }

  .receive-form-group {
    margin-bottom: 16px;
  }

  .receive-form-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
  }

  .receive-form-input {
    width: 100%;
    padding: 12px 14px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px;
    font-family: 'Kanit', sans-serif;
    transition: all 0.2s;
    background: #fafafa;
  }

  .receive-form-input:focus {
    outline: none;
    border-color: #0891b2;
    background: white;
    box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1);
  }

  .receive-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .receive-modal-footer {
    padding: 16px 20px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    gap: 12px;
  }

  .receive-btn-cancel {
    flex: 1;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    background: white;
    border-radius: 12px;
    font-family: 'Kanit', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
  }

  .receive-btn-cancel:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  .receive-btn-save {
    flex: 1;
    padding: 12px 16px;
    border: none;
    background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
    border-radius: 12px;
    font-family: 'Kanit', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .receive-btn-save:hover {
    box-shadow: 0 4px 15px rgba(8, 145, 178, 0.4);
  }

  .receive-btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

function StockCardproductP() {
  const apis = "datalist"
  const apiitemRC = "receivelist"
  const apisaleitem = "sale_cal/sale_list_item"
  const apibalance = "sale_cal/sale_balance"

  const ids = useMessageStore((state) => state.ids)
  const itemcodes = useMessageStore((state) => state.itemcodes)

  const initialValues = {
    code: "",
    company: "",
    ProductName: "",
    fixname: "",
    group: "",
    type: "",
    subtype: "",
    Category: "",
    DrugRegistor: "",
    Area: "",
    CostActual: "",
    Unit: "",
    price: "",
    wholesaleprice: "",
    online: "",
    PriceA: "",
    PriceB: "",
    Barcode: "",
    Max: "",
    Min: "",
    ROPs: "",
    AlarmExp: "",
    Show: "",
    Child: "",
    CI: "",
    Remark: ""
  };

  const [all, setall1] = useState(initialValues)
  const [itemRC, setGet_ItemRC] = useState([])
  const [itemSale, setGet_ItemSale] = useState([])
  const [itembalance, setbalance] = useState([])
  const [stockSummary, setStockSummary] = useState<any>(null)

  // Modal state
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [showGenModal, setShowGenModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Checkchange list for GEN modal
  const [checkchangeList, setCheckchangeList] = useState([])
  // Editable qty values for each checkchange item
  const [editedQtyValues, setEditedQtyValues] = useState<{ [key: number]: string }>({})
  // Editable dateExp values for each checkchange item
  const [editedDateExpValues, setEditedDateExpValues] = useState<{ [key: number]: string }>({})
  // Editable lot values for each checkchange item
  const [editedLotValues, setEditedLotValues] = useState<{ [key: number]: string }>({})

  // Editable balance values for the main receive list
  const [editedBalances, setEditedBalances] = useState<{ [key: number]: string }>({})

  // Receive form state
  const [receiveForm, setReceiveForm] = useState({
    qty: '',
    unit: '',
    newCost: '',
    dateExp: '',
    lot: '',
    dateRC: (typeof window !== 'undefined' && localStorage.getItem('receiveDate')) || toThaiDateString()
  })

  useEffect(() => {
    const useMyHook = async () => {
      try {
        await fetchPost()
        await fetchGet_ItemRC()
        await fetchGet_ItemSale()
        await fetchGet_Balance()
        await fetchStockSummary()
      } catch (e) {
        console.error(e);
      }
    }
    useMyHook()
  }, [ids])

  const fetchPost = async () => {
    try {
      const res = await axios.get(`/api/${apis}/${Number(ids)}`)
      setall1(res.data)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchGet_ItemRC = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apiitemRC}?company=${companyS}&itemcode=${itemcodes}`)
      setGet_ItemRC(res.data)

      // Initialize edited balance values
      const initialBalances: { [key: number]: string } = {}
      res.data.forEach((item: any) => {
        initialBalances[item.id] = String(item.balance ?? 0)
      })
      setEditedBalances(initialBalances)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchGet_ItemSale = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apisaleitem}?company=${companyS}&code_product=${itemcodes}`)
      setGet_ItemSale(res.data)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchGet_Balance = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const idQuery = ids ? `&id=${ids}` : ''
      const res = await axios.get(`/api/${apibalance}?company=${companyS}&code_product=${itemcodes}${idQuery}`)
      setbalance(res.data)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchStockSummary = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const idQuery = ids ? `&id=${ids}` : ''
      const res = await axios.get(`/api/stock-balance-summary?itemcode=${itemcodes}&company=${companyS}${idQuery}`)
      setStockSummary(res.data)
    } catch (error) {
      console.error(error)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'Asia/Bangkok' });
  }

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Bangkok'
    });
  }

  const getDaysUntilExpiry = (dateExp: string) => {
    if (!dateExp) return 0;
    const expDate = new Date(dateExp);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Reset receive form
  const resetReceiveForm = () => {
    setReceiveForm({
      qty: '',
      unit: all.Unit || '',
      newCost: '',
      dateExp: '',
      lot: '',
      dateRC: localStorage.getItem('receiveDate') || toThaiDateString()
    })
  }

  // Open receive modal
  const openReceiveModal = () => {
    resetReceiveForm()
    setReceiveForm(prev => ({ ...prev, unit: all.Unit || '' }))
    setShowReceiveModal(true)
  }

  // Handle save receive
  const handleSaveReceive = async () => {
    if (!receiveForm.qty || !receiveForm.unit) {
      alert('กรุณากรอกจำนวนและหน่วย')
      return
    }

    setIsSaving(true)
    try {
      const companyS = localStorage.getItem("company_") || ""
      const payload = {
        company: companyS,
        codenames: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }).replace(/-/g, '') + new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false, hour: '2-digit', minute: '2-digit' }).replace(':', '').slice(0, 3), // Generate a codename
        itemcode: itemcodes,
        itemName: all.ProductName,
        qty: Number(receiveForm.qty),
        unit: receiveForm.unit,
        newCost: Number(receiveForm.newCost) || 0,
        totalcost: (Number(receiveForm.qty) * (Number(receiveForm.newCost) || 0)),
        dateRC: new Date(receiveForm.dateRC),
        dateExp: receiveForm.dateExp ? new Date(receiveForm.dateExp) : null,
        lot: receiveForm.lot || '',
        freebaht: 0,
        discountbaht: 0,
        sale: 0,
        balance: Number(receiveForm.qty),
        Barcode: all.Barcode || '',
        type: all.type || '',
        person: localStorage.getItem("person_") || '',
        statuss: 'รับสินค้า',
        codevender: '',
        namevender: ''
      }

      await axios.post('/api/receivelist', payload)

      // Refresh data
      await fetchGet_ItemRC()
      await fetchGet_Balance()

      setShowReceiveModal(false)
      resetReceiveForm()
    } catch (error) {
      console.error('Error saving receive:', error)
      alert('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setIsSaving(false)
    }
  }

  // Fetch checkchange list for GEN modal
  const fetchCheckchangeList = async () => {
    const companyS = localStorage.getItem("company_") || ""
    try {
      const res = await axios.get(`/api/checkchange?company=${String(companyS)}&itemcode=${String(itemcodes)}`)
      setCheckchangeList(res.data)
      // Initialize edited qty values with current qty from each item
      const initialQtyValues: { [key: number]: string } = {}
      const initialDateExpValues: { [key: number]: string } = {}
      const initialLotValues: { [key: number]: string } = {}
      res.data.forEach((item: any) => {
        initialQtyValues[item.id] = String(item.qty || '')
        // Format dateExp for input type="date" (YYYY-MM-DD)
        if (item.dateExp) {
          initialDateExpValues[item.id] = toThaiDateString(item.dateExp)
        } else {
          initialDateExpValues[item.id] = ''
        }
        initialLotValues[item.id] = String(item.lot || '')
      })
      setEditedQtyValues(initialQtyValues)
      setEditedDateExpValues(initialDateExpValues)
      setEditedLotValues(initialLotValues)
    } catch (error) {
      console.error('Error fetching checkchange list:', error)
    }
  }

  // Handle qty change for checkchange item
  const handleQtyChange = (itemId: number, newQty: string) => {
    setEditedQtyValues(prev => ({ ...prev, [itemId]: newQty }))
  }

  // Handle dateExp change for checkchange item
  const handleDateExpChange = (itemId: number, newDateExp: string) => {
    setEditedDateExpValues(prev => ({ ...prev, [itemId]: newDateExp }))
  }

  // Handle lot change for checkchange item
  const handleLotChange = (itemId: number, newLot: string) => {
    setEditedLotValues(prev => ({ ...prev, [itemId]: newLot }))
  }

  // Handle add item to receivelist
  const handleAddToReceivelist = async (item: any) => {
    const editedQty = editedQtyValues[item.id] || item.qty
    if (!editedQty || Number(editedQty) <= 0) {
      alert('กรุณากรอกจำนวนที่ถูกต้อง')
      return
    }

    try {
      const companyS = localStorage.getItem("company_") || ""
      // Use correct unit (not '-') and include dateRC
      const correctUnit = item.unit && item.unit !== '-' ? item.unit : all.Unit
      const payload = {
        company: companyS,
        codenames: '20251101100',
        itemcode: itemcodes,
        itemName: all.ProductName,
        unit: correctUnit,
        newCost: Number(item.newCost) || 0,
        qty: Number(editedQty),
        totalcost: Number(item.newCost) * Number(editedQty) || 0,
        lot: String(editedLotValues[item.id] || item.lot || ''),
        dateExp: editedDateExpValues[item.id] ? new Date(editedDateExpValues[item.id]) : (item.dateExp ? new Date(item.dateExp) : null),
        dateRC: new Date('2025-11-11T00:00:00.000+07:00'),
        freebaht: 0,
        discountbaht: 0,
        sale: 0,
        balance: Number(editedQty),
        Barcode: all.Barcode || '',
        type: all.type || '',
        person: localStorage.getItem("person_") || '',
        statuss: 'ปรับยอด',
        codevender: String("0000") || '',
        namevender: String("ยกยอดให้ร้าน") || '',
      }

      await axios.post('/api/receivelist', payload)

      // Refresh data
      await fetchGet_ItemRC()
      await fetchGet_Balance()

      alert('เพิ่มข้อมูลสำเร็จ')
    } catch (error) {
      console.error('Error adding to receivelist:', error)
      alert('เกิดข้อผิดพลาดในการเพิ่มข้อมูล')
    }
  }

  // Handle add item to Balance
  const handleAddToReceivelist1 = async () => {


    try {
      const companyS = localStorage.getItem("company_") || ""
      // Use correct unit (not '-') and include dateRC

      const payload = {
        company: companyS,
        codenames: '20251101101',
        itemcode: itemcodes,
        itemName: all.ProductName,
        unit: all.Unit,
        newCost: Number(all.CostActual),
        qty: Math.abs(Number(itembalance.map((r: any) => r.balance))),
        totalcost: Number(all.CostActual) * Math.abs(Number(itembalance.map((r: any) => r.balance))),
        lot: "9999",
        dateExp: new Date("2025-11-11T17:00:00.000+07:00"),
        dateRC: new Date("2025-11-11T17:00:00.000+07:00"),
        freebaht: 0,
        discountbaht: 0,
        sale: Math.abs(Number(itembalance.map((r: any) => r.balance))),
        balance: 0,
        Barcode: all.Barcode || '',
        type: all.type || '',
        person: localStorage.getItem("person_") || '',
        statuss: 'ปรับยอด',
        codevender: String("0000") || '',
        namevender: String("ยกยอดให้ร้าน") || '',
      }
      Number(itembalance.map((r: any) => r.balance)) >= 0 ?
        alert('Stock เป็นบวก ไม่สามารถสร้างข้อมูลได้')
        :

        await axios.post('/api/receivelist', payload)

      // Refresh data
      await fetchGet_ItemRC()
      await fetchGet_Balance()

      alert('เพิ่มข้อมูลสำเร็จ')

    } catch (error) {
      console.error('Error adding to receivelist:', error)
      alert('เกิดข้อผิดพลาดในการเพิ่มข้อมูล')
    }
  }

  // Handle add item to Balance
  const handleAddToReceivelist2 = async () => {


    try {
      const companyS = localStorage.getItem("company_") || ""
      // Use correct unit (not '-') and include dateRC

      const payload = {
        company: companyS,
        codenames: '20251101101',
        itemcode: itemcodes,
        itemName: all.ProductName,
        unit: all.Unit,
        newCost: Number(all.CostActual),
        qty: Math.abs(Number(itembalance.map((r: any) => r.balance))),
        totalcost: 0,
        lot: "9999",
        dateExp: new Date("2025-11-11T17:00:00.000+07:00"),
        dateRC: new Date("2025-11-11T17:00:00.000+07:00"),
        freebaht: 0,
        discountbaht: 0,
        sale: Math.abs(Number(itembalance.map((r: any) => r.balance))),
        balance: 0,
        Barcode: all.Barcode || '',
        type: all.type || '',
        person: localStorage.getItem("person_") || '',
        statuss: 'ปรับยอด',
        codevender: String("0000") || '',
        namevender: String("ยกยอดให้ร้าน") || '',
      }
      Number(itembalance.map((r: any) => r.balance)) >= 0 ?
        alert('Stock เป็นบวก ไม่สามารถสร้างข้อมูลได้')
        :

        await axios.post('/api/checkchange', payload)

      // Refresh data
      await fetchGet_ItemRC()
      await fetchGet_Balance()

      alert('เพิ่มข้อมูลสำเร็จ')

    } catch (error) {
      console.error('Error adding to receivelist:', error)
      alert('เกิดข้อผิดพลาดในการเพิ่มข้อมูล')
    }
  }

  // Handle delete receive item
  const handleDeleteReceiveItem = async (itemId: number) => {
    if (!confirm('ต้องการลบรายการนี้หรือไม่?')) {
      return
    }

    try {
      await axios.delete(`/api/receivelist/${itemId}`)

      // Refresh data
      await fetchGet_ItemRC()
      await fetchGet_Balance()

      alert('ลบข้อมูลสำเร็จ')
    } catch (error: any) {
      console.error('Error deleting receive item:', error)
      const errorMessage = error.response?.data?.error || 'เกิดข้อผิดพลาดในการลบข้อมูล'
      alert(errorMessage)
    }
  }

  // Handle update balance
  const handleUpdateBalance = async (p: any) => {
    const newBalance = editedBalances[p.id];
    if (newBalance === undefined) return;

    try {
      const payload = {
        company: p.company,
        codenames: p.codenames,
        itemcode: p.itemcode,
        itemName: p.itemName,
        unit: p.unit,
        newCost: p.newCost,
        qty: p.qty,
        totalcost: p.totalcost,
        lot: p.lot,
        dateExp: p.dateExp,
        freebaht: p.freebaht,
        discountbaht: p.discountbaht,
        sale: p.sale,
        balance: Number(newBalance),
        Barcode: p.Barcode,
        type: p.type,
        person: p.person,
        statuss: p.statuss
      };

      await axios.put(`/api/receivelist/${p.id}`, payload);
      await fetchGet_ItemRC();
      await fetchGet_Balance();
      alert('บันทึกสำเร็จ');
    } catch (error) {
      console.error('Error updating balance:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  }

  // Open GEN modal
  const openGenModal = async () => {
    await fetchCheckchangeList()
    setShowGenModal(true)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: mobileStockCardStyles }} />

      {/* Product Info Card */}
      <div className="product-info-card" style={{ padding: '10px 12px', marginBottom: '10px' }}>
        {/* Row 1: Code & Barcode */}
        <div className="product-info-row" style={{ marginBottom: '6px', gap: '4px' }}>
          <div className="info-item">
            <span className="info-label" style={{ fontSize: '10px' }}>รหัสสินค้า:</span>
            <span className="info-value highlight" style={{ fontSize: '12px' }}>{all.code}</span>
          </div>
          <div className="info-item" style={{ marginLeft: 'auto' }}>
            <span className="info-label" style={{ fontSize: '10px' }}>Barcode:</span>
            <span className="info-value" style={{ fontSize: '10px' }}>{all.Barcode}</span>
          </div>
        </div>

        {/* Product Name */}
        <div className="product-name-display" style={{ fontSize: '12px', margin: '4px 0' }}>{all.ProductName}</div>

        {/* Info Grid - more compact */}
        <div className="info-grid" style={{ gap: '4px', gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="info-grid-item" style={{ gap: '0px' }}>
            <span className="grid-label" style={{ fontSize: '9px' }}>ชื่อสามัญ</span>
            <span className="grid-value" style={{ fontSize: '10px' }}>{all.fixname || '-'}</span>
          </div>
          <div className="info-grid-item" style={{ gap: '0px' }}>
            <span className="grid-label" style={{ fontSize: '9px' }}>กลุ่มสินค้า</span>
            <span className="grid-value" style={{ fontSize: '10px' }}>{all.group || '-'}</span>
          </div>
          <div className="info-grid-item" style={{ gap: '0px' }}>
            <span className="grid-label" style={{ fontSize: '9px' }}>หมวด</span>
            <span className="grid-value" style={{ fontSize: '10px' }}>{all.Category || '-'}</span>
          </div>
          <div className="info-grid-item" style={{ gap: '0px' }}>
            <span className="grid-label" style={{ fontSize: '9px' }}>พื้นที่เก็บ</span>
            <span className="grid-value" style={{ fontSize: '10px' }}>{all.Area || '-'}</span>
          </div>
          <div className="info-grid-item" style={{ gap: '0px' }}>
            <span className="grid-label" style={{ fontSize: '9px' }}>หน่วย</span>
            <span className="grid-value" style={{ fontSize: '10px' }}>{all.Unit || '-'}</span>
          </div>
          <div className="info-grid-item" style={{ gap: '0px' }}>
            <span className="grid-label" style={{ fontSize: '9px' }}>ราคา</span>
            <span className="grid-value" style={{ fontSize: '10px' }}>{all.price || '0'} บาท</span>
          </div>
        </div>

        {/* Balance Summary Cards - matching stock-balance-summary */}
        {stockSummary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '8px' }}>
            {[
              { label: 'ยอดรับทั้งหมด', value: stockSummary.totalReceived, icon: '📥', color: '#2A6AAA', bg: '#F3F8FC', border: '#CCDFF1' },
              { label: 'ยอดขาย', value: stockSummary.totalSale, icon: '🛒', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
              { label: 'ยอดโอนออก', value: stockSummary.totalTransferOut, icon: '📤', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
              { label: 'ยอดรับโอนเข้า', value: stockSummary.totalTransferIn, icon: '📦', color: '#2A6AAA', bg: '#F3F8FC', border: '#CCDFF1' },
              { label: 'ยอดปรับ', value: stockSummary.totalAdjust, icon: '🔧', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
              { label: 'ยอดคงเหลือ', value: stockSummary.calculatedBalance, icon: '📊', color: '#fff', bg: '#173F6B', border: '#173F6B' },
            ].map((card, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '6px 4px', borderRadius: 10,
                background: card.bg, border: `1px solid ${card.border}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{ fontSize: 14, marginBottom: 1 }}>{card.icon}</div>
                <div style={{ fontSize: 8, color: i === 5 ? '#CCDFF1' : card.color, textTransform: 'uppercase', letterSpacing: 0.3, fontWeight: 600 }}>{card.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: card.color, marginTop: 1 }}>{card.value != null ? Number(card.value).toLocaleString('th-TH') : '-'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receive Section */}
      <div className="section-card">
        <div className="section-header receive">
          <div className="section-header-content">
            <span className="section-title">📦 ข้อมูลรับสินค้า</span>
            {Number(itembalance.map((r: any) => r.balance)) >= 0 ?
              <button
                className="gen-btn"
                title="GEN"
                onClick={openGenModal}
                style={{
                  width: '50px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '13px',
                  fontFamily: 'Kanit, sans-serif'
                }}
              >
                GEN
              </button>
              :

              <button
                onClick={() => { handleAddToReceivelist1(), handleAddToReceivelist2() }}
                style={{
                  width: '50px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #707070ff 0%, #868585ff 100%)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(168, 168, 168, 0.3)',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '13px',
                  fontFamily: 'Kanit, sans-serif'
                }}
                title="เพิ่มรายการ"
              >
                GEN 0
              </button>
            }
            {/* Add Receive Button */}
            <button
              className="add-receive-btn"
              onClick={openReceiveModal}
              title="เพิ่มรายการรับสินค้า"
            >
              <Plus size={20} color="white" />
            </button>
          </div>
        </div>
        <div className="section-content">
          {itemRC.length > 0 ? (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '520px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['วันที่รับ', 'ผู้รับ', 'รับ', 'คงเหลือ', 'หน่วยย่อย', 'ทุนใหม่', 'หมดอายุ', 'Lot', ''].map((h, i) => (
                      <th key={i} style={{
                        padding: '8px 4px', fontWeight: 600, color: '#6b7280',
                        borderBottom: '2px solid #e5e7eb', textAlign: 'center',
                        fontSize: '10px', whiteSpace: 'nowrap', fontFamily: 'Kanit, sans-serif'
                      }}>{h}</th>
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
                        <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 500, fontSize: '11px' }}>{formatDate(p.dateRC)}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'center', fontSize: '10px', color: '#6b7280' }}>{p.person}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 600, color: '#2A6AAA', fontSize: '12px' }}>{p.qty}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                          <input type="number"
                            value={editedBalances[p.id] ?? p.balance}
                            onChange={(e) => setEditedBalances(prev => ({ ...prev, [p.id]: e.target.value }))}
                            style={{
                              width: '48px', padding: '3px 2px', border: '1px solid #d1d5db',
                              borderRadius: '4px', fontSize: '12px', fontWeight: 700, color: '#2A6AAA',
                              textAlign: 'center', background: '#F3F8FC', fontFamily: 'Kanit, sans-serif', outline: 'none'
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 4px', textAlign: 'center', fontSize: '10px' }}>{p.unit}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'center', fontSize: '11px' }}>{p.newCost}</td>
                        <td style={{
                          padding: '8px 4px', textAlign: 'center', fontSize: '10px',
                          color: daysLeft <= 0 ? '#dc2626' : daysLeft <= 30 ? '#dc2626' : '#147F56', fontWeight: 500
                        }}>{formatDate(p.dateExp)}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'center', fontSize: '10px', color: '#6b7280' }}>{p.lot || '-'}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'center' }}>
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
            <div className="empty-data">ไม่มีข้อมูลการรับสินค้า</div>
          )}
        </div>
      </div>

      {/* Sales Section */}
      <div className="section-card">
        <div className="section-header sales">
          <span className="section-title">💰 ข้อมูลขายสินค้า</span>
        </div>
        <div className="section-content">
          {itemSale.length > 0 ? (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '400px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['วันที่ขาย', 'ขาย', 'หน่วย', 'ขายหน่วยย่อย', 'หน่วยย่อย', 'สถานะ'].map((h, i) => (
                      <th key={i} style={{
                        padding: '8px 4px', fontWeight: 600, color: '#6b7280',
                        borderBottom: '2px solid #e5e7eb', textAlign: 'center',
                        fontSize: '10px', whiteSpace: 'nowrap', fontFamily: 'Kanit, sans-serif'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...itemSale].sort((a: any, b: any) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime()).map((p: any, idx: number) => (
                    <tr key={p.id} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 4px', textAlign: 'center', fontSize: '11px' }}>{formatDateTime(p.createDate)}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 600, color: '#2A6AAA', fontSize: '12px' }}>{p.qty}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'center', fontSize: '10px' }}>{p.unit}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 600, color: '#2A6AAA', fontSize: '12px' }}>{p.subqty}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'center', fontSize: '10px' }}>{p.subunit}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'center', color: p.statuss === 'OK' ? '#147F56' : '#374151', fontWeight: 500, fontSize: '11px' }}>{p.statuss}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-data">ไม่มีข้อมูลการขายสินค้า</div>
          )}
        </div>
      </div>

      {/* Receive Modal */}
      {showReceiveModal && (
        <div className="receive-modal-overlay" onClick={() => setShowReceiveModal(false)}>
          <div className="receive-modal" onClick={e => e.stopPropagation()}>
            <div className="receive-modal-header">
              <div className="receive-modal-title">
                <Leaf size={20} />
                เพิ่มข้อมูลรับสินค้า
              </div>
              <button
                className="receive-modal-close"
                onClick={() => setShowReceiveModal(false)}
              >
                <X size={18} color="#0891b2" />
              </button>
            </div>

            <div className="receive-modal-body">
              {/* Current Balance Display */}
              <div style={{
                background: 'linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)',
                border: '2px solid #A6C8E7',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#173F6B' }}>คงเหลือ:</span>
                <span style={{ fontSize: '20px', fontWeight: '700', color: '#2A6AAA' }}>
                  {stockSummary?.calculatedBalance != null ? Number(stockSummary.calculatedBalance).toLocaleString('th-TH') : itembalance.map((r: any) => r.balance)} {all.Unit}
                </span>
              </div>

              {/* Date Received */}
              <div className="receive-form-group">
                <label className="receive-form-label">วันที่รับสินค้า *</label>
                <input
                  type="date"
                  className="receive-form-input"
                  value={receiveForm.dateRC}
                  onChange={e => {
                    setReceiveForm({ ...receiveForm, dateRC: e.target.value })
                    localStorage.setItem('receiveDate', e.target.value)
                  }}
                />
              </div>

              {/* Quantity & Unit */}
              <div className="receive-form-row">
                <div className="receive-form-group">
                  <label className="receive-form-label">จำนวน *</label>
                  <input
                    type="number"
                    className="receive-form-input"
                    placeholder="0"
                    value={receiveForm.qty}
                    onChange={e => setReceiveForm({ ...receiveForm, qty: e.target.value })}
                  />
                </div>
                <div className="receive-form-group">
                  <label className="receive-form-label">หน่วย *</label>
                  <input
                    type="text"
                    className="receive-form-input"
                    placeholder="หน่วย"
                    value={receiveForm.unit}
                    onChange={e => setReceiveForm({ ...receiveForm, unit: e.target.value })}
                  />
                </div>
              </div>

              {/* New Cost */}
              <div className="receive-form-group">
                <label className="receive-form-label">ทุนใหม่</label>
                <input
                  type="number"
                  className="receive-form-input"
                  placeholder="0.00"
                  step="0.01"
                  value={receiveForm.newCost}
                  onChange={e => setReceiveForm({ ...receiveForm, newCost: e.target.value })}
                />
              </div>

              {/* Expiry Date & Lot */}
              <div className="receive-form-row">
                <div className="receive-form-group">
                  <label className="receive-form-label">วันหมดอายุ</label>
                  <input
                    type="date"
                    className="receive-form-input"
                    value={receiveForm.dateExp}
                    onChange={e => setReceiveForm({ ...receiveForm, dateExp: e.target.value })}
                  />
                </div>
                <div className="receive-form-group">
                  <label className="receive-form-label">Lot</label>
                  <input
                    type="text"
                    className="receive-form-input"
                    placeholder="เลข Lot"
                    value={receiveForm.lot}
                    onChange={e => setReceiveForm({ ...receiveForm, lot: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="receive-modal-footer">
              <button
                className="receive-btn-cancel"
                onClick={() => setShowReceiveModal(false)}
              >
                ยกเลิก
              </button>
              <button
                className="receive-btn-save"
                onClick={handleSaveReceive}
                disabled={isSaving}
              >
                <Save size={18} />
                {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GEN Modal - List of RCstockchange items */}
      {showGenModal && (
        <div className="receive-modal-overlay" onClick={() => setShowGenModal(false)}>
          <div className="receive-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="receive-modal-header" style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' }}>
              <div className="receive-modal-title" style={{ color: '#dc2626' }}>
                📋 รายการปรับยอดสินค้า
              </div>
              <button
                className="receive-modal-close"
                onClick={() => setShowGenModal(false)}
                style={{ background: 'rgba(220, 38, 38, 0.1)' }}
              >
                <X size={18} color="#dc2626" />
              </button>
            </div>

            <div style={{ padding: '12px', fontSize: '13px', background: '#fef3c7', borderBottom: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div><strong style={{ color: '#d97706' }}>รหัสสินค้า:</strong> <span style={{ color: '#1f2937', fontWeight: '600' }}>{all.code}</span></div>
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#374151', fontWeight: '500' }}>{all.ProductName}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)', padding: '6px 12px', borderRadius: '8px', border: '1px solid #A6C8E7' }}>
                <span style={{ fontSize: '12px', color: '#173F6B', fontWeight: '500' }}>คงเหลือ: </span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#2A6AAA' }}>{itembalance.map((r: any) => r.balance)} {all.Unit}</span>
              </div>
            </div>

            <div className="receive-modal-body" style={{ padding: 0, maxHeight: '400px', overflowY: 'auto' }}>
              {checkchangeList.length > 0 ? (
                <>
                  <div className="mobile-table-header receive-header" style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10, gridTemplateColumns: '70px 50px 60px 100px 100px 40px' }}>
                    <span>จำนวน</span>
                    <span>หน่วย</span>
                    <span>ทุนใหม่</span>
                    <span>หมดอายุ</span>
                    <span>Lot</span>
                    <span></span>
                  </div>
                  <div className="mobile-table">
                    {checkchangeList.map((p: any) => {
                      const daysLeft = getDaysUntilExpiry(p.dateExp);
                      return (
                        <div key={p.id} className="mobile-table-row receive-row" style={{ gridTemplateColumns: '70px 50px 60px 100px 100px 40px', alignItems: 'center' }}>
                          <span className="table-cell">
                            <input
                              type="number"
                              value={editedQtyValues[p.id] || ''}
                              onChange={(e) => handleQtyChange(p.id, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontFamily: 'Kanit, sans-serif',
                                fontWeight: '600',
                                textAlign: 'center',
                                background: '#fff',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                              }}
                              onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                          </span>
                          <span className="table-cell">{p.unit && p.unit !== '-' ? p.unit : all.Unit}</span>
                          <span className="table-cell">{p.newCost}</span>
                          <span className="table-cell">
                            <input
                              type="date"
                              value={editedDateExpValues[p.id] || ''}
                              onChange={(e) => handleDateExpChange(p.id, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '4px 6px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontFamily: 'Kanit, sans-serif',
                                fontWeight: '500',
                                background: '#fff',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                              }}
                              onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                          </span>
                          <span className="table-cell">
                            <input
                              type="text"
                              value={editedLotValues[p.id] || ''}
                              onChange={(e) => handleLotChange(p.id, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '4px 6px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontFamily: 'Kanit, sans-serif',
                                fontWeight: '500',
                                textAlign: 'center',
                                background: '#fff',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                              }}
                              onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                              placeholder="Lot"
                            />
                          </span>
                          <span className="table-cell">
                            <button
                              onClick={() => handleAddToReceivelist(p)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #6BA3D8 0%, #3E86C7 100%)',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(62, 134, 199, 0.3)',
                                transition: 'transform 0.2s'
                              }}
                              title="เพิ่มรายการ"
                            >
                              <Plus size={16} color="white" />
                            </button>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="empty-data" style={{ padding: '40px 20px' }}>ไม่มีข้อมูลปรับยอดสินค้า</div>
              )}
            </div>

            <div className="receive-modal-footer">
              <button
                className="receive-btn-cancel"
                onClick={() => setShowGenModal(false)}
                style={{ flex: 1 }}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}

export default StockCardproductP
