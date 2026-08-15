'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Home, ShoppingCart, DollarSign, Box, ClipboardList, LogIn,
  Camera, Search, X, ChevronRight, ChevronDown, Plus, Minus,
  PackagePlus, MessageSquare, Package, FileText, Building2,
  Calendar as CalendarIcon, ArrowDownToLine, Check, Pencil,
  RotateCcw, Trash2, ChevronLeft
} from "lucide-react"
import { useNavLevel } from '../useNavLevel'
import { useMessageStore } from "./useMessageStore"
import BodyRCList from './body_rc_list'
import axios from 'axios'
import { toThaiDateString } from '@/utils/dateUtils'
import { Scanner } from '@yudiel/react-qr-scanner'
import { isNativeScannerAvailable, scanBarcode } from '@/lib/runtime/scanner'
import { jwtDecode } from 'jwt-decode'
import { toast, Toaster } from 'sonner'

import { UC_SELECT_PREFIX, normalizeFactor, roundUnit, type UnitConversionRow } from "@/lib/receiveUnit"

const apis = "receive"
const apidatalist = "datalist"
const apidataitem = "dataitemlist"
const apiunitconversion = "unitconversion"

const mobileRCStyles = `
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

  .mobile-rc-app {
    font-family: 'Kanit', sans-serif;
    background: linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%);
    min-height: 100vh;
    max-width: 100vw;
    overflow-x: hidden;
    padding-bottom: 90px;
  }

  .rc-header {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    padding: 16px 16px 20px;
    border-radius: 0 0 24px 24px;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 4px 20px rgba(79, 70, 229, 0.3);
  }

  .header-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .header-title {
    color: white;
    font-size: 20px;
    font-weight: 600;
  }

  .header-back-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(255,255,255,0.2);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .tab-bar {
    display: flex;
    gap: 6px;
    background: rgba(255,255,255,0.15);
    border-radius: 14px;
    padding: 4px;
  }

  .tab-btn {
    flex: 1;
    padding: 10px 8px;
    border: none;
    border-radius: 11px;
    background: transparent;
    color: rgba(255,255,255,0.7);
    font-family: 'Kanit', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }

  .tab-btn.active {
    background: white;
    color: #4f46e5;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .tab-badge {
    background: #ef4444;
    color: white;
    font-size: 10px;
    font-weight: 700;
    min-width: 18px;
    height: 18px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
  }

  .search-container {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-top: 12px;
  }

  .search-input-wrapper {
    flex: 1;
    position: relative;
  }

  .search-input {
    width: 100%;
    padding: 12px 16px 12px 44px;
    border: none;
    border-radius: 16px;
    background: rgba(255,255,255,0.95);
    font-size: 14px;
    font-family: 'Kanit', sans-serif;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    outline: none;
  }

  .search-input:focus {
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  }

  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
  }

  .camera-btn {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(10px);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .camera-btn:active {
    transform: scale(0.95);
    background: rgba(255,255,255,0.3);
  }

  .rc-content {
    padding: 16px;
    padding-top: 20px;
  }

  /* RC List Cards */
  .rc-card {
    background: white;
    border-radius: 16px;
    padding: 14px 16px;
    margin-bottom: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.04);
    border: 1px solid #f0f0f0;
    cursor: pointer;
    transition: all 0.2s;
  }

  .rc-card:active {
    transform: scale(0.98);
    border-color: #6366f1;
  }

  .rc-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  }

  .rc-card-code {
    font-size: 15px;
    font-weight: 600;
    color: #4f46e5;
  }

  .rc-card-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 10px;
    background: #eef2ff;
    color: #4f46e5;
  }

  .rc-card-supplier {
    font-size: 14px;
    color: #334155;
    margin-bottom: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rc-card-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: #94a3b8;
  }

  .rc-card-total {
    font-size: 14px;
    font-weight: 600;
    color: #f59e0b;
    background: #fffbeb;
    padding: 2px 10px;
    border-radius: 10px;
  }

  /* Create Form */
  .form-card {
    background: white;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    border: 1px solid #f0f0f0;
  }

  .form-title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .form-group {
    margin-bottom: 14px;
  }

  .form-label {
    font-size: 13px;
    color: #64748b;
    margin-bottom: 6px;
    font-weight: 500;
  }

  .form-input {
    width: 100%;
    padding: 12px 14px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 15px;
    font-family: 'Kanit', sans-serif;
    outline: none;
    transition: border-color 0.2s;
    background: #fafafa;
  }

  .form-input:focus {
    border-color: #6366f1;
    background: white;
  }

  .form-select {
    width: 100%;
    padding: 12px 14px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 15px;
    font-family: 'Kanit', sans-serif;
    outline: none;
    background: #fafafa;
    appearance: none;
    cursor: pointer;
  }

  .supplier-list {
    max-height: 200px;
    overflow-y: auto;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    margin-top: 4px;
  }

  .supplier-item {
    padding: 12px 14px;
    font-size: 14px;
    cursor: pointer;
    border-bottom: 1px solid #f5f5f5;
    transition: background 0.15s;
  }

  .supplier-item:active {
    background: #eef2ff;
  }

  .supplier-item:last-child {
    border-bottom: none;
  }

  .form-btn-primary {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 14px;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: white;
    font-family: 'Kanit', sans-serif;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .form-btn-primary:active {
    transform: scale(0.98);
  }

  .form-btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Transfer Cards */
  .transfer-card {
    background: white;
    border-radius: 16px;
    margin-bottom: 10px;
    overflow: hidden;
    border: 1px solid #f0f0f0;
    box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  }

  .transfer-header {
    padding: 14px 16px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background 0.15s;
  }

  .transfer-header:active {
    background: #fafafa;
  }

  .transfer-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  .transfer-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .transfer-details {
    flex: 1;
    min-width: 0;
  }

  .transfer-no {
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
  }

  .transfer-route {
    font-size: 12px;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .transfer-date {
    font-size: 11px;
    color: #94a3b8;
  }

  .transfer-status-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 20px;
    flex-shrink: 0;
  }

  .transfer-items {
    border-top: 1px solid #f0f0f0;
  }

  .transfer-item-row {
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid #f8f8f8;
    font-size: 13px;
  }

  .transfer-item-row:last-child {
    border-bottom: none;
  }

  .transfer-item-info {
    flex: 1;
    min-width: 0;
  }

  .transfer-item-name {
    color: #334155;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .transfer-item-code {
    font-size: 11px;
    color: #6366f1;
    font-weight: 500;
  }

  .transfer-item-qty {
    font-weight: 600;
    color: #1e293b;
    text-align: center;
    min-width: 36px;
  }

  .transfer-item-actions {
    display: flex;
    gap: 6px;
  }

  .confirm-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 8px;
    font-family: 'Kanit', sans-serif;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .confirm-btn.green {
    background: #2A6AAA;
    color: white;
  }

  .confirm-btn.orange {
    background: #fff;
    color: #d97706;
    border: 1px solid #fde68a;
  }

  .confirm-btn.gray {
    background: #f1f5f9;
    color: #64748b;
  }

  .confirm-btn:disabled {
    opacity: 0.5;
  }

  .transfer-footer {
    padding: 10px 16px;
    background: #f8fafc;
    font-size: 12px;
    color: #64748b;
    display: flex;
    justify-content: space-between;
  }

  /* History toggle */
  .toggle-bar {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .toggle-btn {
    flex: 1;
    padding: 10px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    font-family: 'Kanit', sans-serif;
    font-size: 13px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }

  .toggle-btn.active {
    border-color: #6366f1;
    background: #eef2ff;
    color: #4f46e5;
    font-weight: 600;
  }

  /* QR Scanner */
  .qr-scanner-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.95);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .qr-scanner-header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%);
  }

  .qr-scanner-title {
    color: white;
    font-size: 18px;
    font-weight: 600;
  }

  .qr-close-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .qr-scanner-frame {
    width: 280px;
    height: 280px;
    border: 3px solid #6366f1;
    border-radius: 24px;
    position: relative;
    overflow: hidden;
  }

  .qr-scanner-hint {
    color: rgba(255,255,255,0.7);
    font-size: 14px;
    text-align: center;
    margin-top: 24px;
    padding: 0 40px;
  }

  /* Search Modal */
  .search-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 500;
    display: flex;
    flex-direction: column;
  }

  .search-modal {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-radius: 24px 24px 0 0;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  .search-modal-header {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    position: sticky;
    top: 0;
    background: white;
    border-radius: 24px 24px 0 0;
  }

  .search-modal-handle {
    width: 40px;
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    margin: 0 auto 12px;
  }

  .search-modal-input {
    width: 100%;
    padding: 14px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 15px;
    font-family: 'Kanit', sans-serif;
    outline: none;
    transition: border-color 0.2s;
  }

  .search-modal-input:focus {
    border-color: #6366f1;
  }

  .search-modal-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  .product-search-item {
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #f5f5f5;
    cursor: pointer;
    transition: background 0.2s;
  }

  .product-search-item:active {
    background: #eef2ff;
  }

  .product-code {
    background: #eef2ff;
    color: #4f46e5;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    min-width: 60px;
    text-align: center;
  }

  .product-details {
    flex: 1;
    min-width: 0;
  }

  .product-name {
    font-size: 14px;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .product-barcode {
    font-size: 11px;
    color: #9ca3af;
    margin-top: 2px;
  }

  .product-price {
    font-size: 15px;
    font-weight: 600;
    color: #6366f1;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #94a3b8;
  }

  .empty-state-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  .empty-state-title {
    font-size: 16px;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 4px;
  }

  .empty-state-text {
    font-size: 13px;
  }

  /* Add Button Floating */
  .fab-btn {
    position: fixed;
    bottom: 100px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
    z-index: 50;
    transition: all 0.2s;
  }

  .fab-btn:active {
    transform: scale(0.92);
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
    padding: 12px 0 calc(12px + env(safe-area-inset-bottom));
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
    padding: 4px 12px;
  }

  .nav-item.active {
    color: #6366f1;
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
    border-top-color: #6366f1;
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

  /* Edit qty input in transfer */
  .edit-qty-input {
    width: 54px;
    text-align: center;
    border: 2px solid #f59e0b;
    border-radius: 8px;
    font-family: 'Kanit', sans-serif;
    font-size: 14px;
    font-weight: 600;
    padding: 4px;
    outline: none;
  }
`;

function MobileRCPage() {
  const router = useRouter();
  const { isNavVisible } = useNavLevel();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('receive');

  // Main view: 'list' | 'create' | 'transfer' | 'detail'
  const [activeView, setActiveView] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchModalQuery, setSearchModalQuery] = useState('');
  const [unitConversions, setUnitConversions] = useState<UnitConversionRow[]>([]);

  // RC List
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedRCId, setSelectedRCId] = useState<string>('');

  // Create Order
  const [supplier, setSupplier] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [receiveDate, setReceiveDate] = useState('');
  const [taxDate, setTaxDate] = useState('');
  const [taxNo, setTaxNo] = useState('');
  const [showSupplierList, setShowSupplierList] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [maxRec, setMaxRec] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Transfer
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistoryView, setShowHistoryView] = useState(false);
  const [expandedTransferId, setExpandedTransferId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState('');
  const [confirmingItemId, setConfirmingItemId] = useState<number | null>(null);

  // Products for scan
  const [dataProduct, setDataProduct] = useState<any[]>([]);

  const setcpage = useMessageStore((state) => state.setcpage);
  const cpage = useMessageStore((state) => state.cpage);

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.background = '#f8fafc';
  }, []);

  useEffect(() => {
    setLoading(false);
  }, []);

  // Fetch RC list
  const fetchRCList = async () => {
    let companyS = localStorage.getItem("company_") || "";
    try {
      const res = await axios.get(`/api/${apis}?company=${companyS}`);
      setPosts(res.data);

      const dt = new Date();
      const year = dt.toLocaleDateString('en-CA', { year: 'numeric', timeZone: 'Asia/Bangkok' });
      const month = dt.toLocaleDateString('en-CA', { month: '2-digit', timeZone: 'Asia/Bangkok' });
      const day = dt.toLocaleDateString('en-CA', { day: '2-digit', timeZone: 'Asia/Bangkok' });
      const orderNo = String(year) + String(month) + String(day);
      const result = res.data.filter((a: any) => a.orderNo === orderNo).map((pp: any) => pp.code);
      const maxValue = Math.max.apply(null, result);
      setMaxRec(String(maxValue));
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch suppliers
  const fetchSuppliers = async () => {
    let companyS = localStorage.getItem("company_") || "";
    try {
      const res = await axios.get(`/api/supplier?company=${companyS}`);
      setSupplier(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch products for search/scan
  const fetchProducts = async () => {
    let companyS = localStorage.getItem("company_") || "";
    try {
      const res = await axios.get(`/api/${apidatalist}?company=${companyS}&fields=receive`);
      setDataProduct(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // หน่วยขาย (กล่อง/ลัง) — ให้ช่องค้นหาเลือกหน่วยที่จะรับได้ ไม่ใช่แค่ตัวสินค้า
  const fetchUnitConversionsForSearch = async () => {
    let companyS = localStorage.getItem("company_") || "";
    if (!companyS) return;
    try {
      const res = await axios.get(`/api/${apiunitconversion}?company=${encodeURIComponent(companyS)}`);
      setUnitConversions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('load unit conversions failed:', error);
    }
  };

  // Fetch pending transfers
  const fetchPendingTransfers = async (userId?: number) => {
    const uid = userId || currentUserId;
    if (!uid) return;
    setTransferLoading(true);
    try {
      const res = await axios.get(`/api/stocktransfer/pending-receive?userId=${uid}`);
      setPendingTransfers(res.data || []);
      setPendingCount(res.data?.length || 0);
    } catch (err) {
      console.error('Failed to fetch pending transfers:', err);
    } finally {
      setTransferLoading(false);
    }
  };

  const fetchTransferHistory = async (userId?: number) => {
    const uid = userId || currentUserId;
    if (!uid) return;
    setHistoryLoading(true);
    try {
      const res = await axios.get(`/api/stocktransfer/pending-receive?userId=${uid}&status=history`);
      setTransferHistory(res.data || []);
    } catch (err) {
      console.error('Failed to fetch transfer history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const confirmItem = async (transferItemId: number, action: 'confirm' | 'confirm_edit', qty?: number) => {
    if (!currentUserId) return;
    setConfirmingItemId(transferItemId);
    try {
      const res = await axios.post('/api/stocktransfer/pending-receive', {
        action,
        transferItemId,
        confirmedQty: qty,
        receiverCompanyId: currentUserId,
        // ผู้รับโอน = ผู้ที่ล็อกอินใช้งานบนมือถือ
        receiverPerson: localStorage.getItem('person_') || ''
      });
      toast.success(<div style={{ fontFamily: 'Kanit' }}>{res.data.message}</div>);
      setEditingItemId(null);
      fetchPendingTransfers();
    } catch (err: any) {
      toast.error(<div style={{ fontFamily: 'Kanit' }}>{err.response?.data?.error || 'ยืนยันไม่สำเร็จ'}</div>);
    } finally {
      setConfirmingItemId(null);
    }
  };

  useEffect(() => {
    fetchRCList();
    fetchSuppliers();
    fetchProducts();
    fetchUnitConversionsForSearch();

    try {
      const token = localStorage.getItem('token') || '';
      if (token) {
        const payload = jwtDecode<any>(token);
        const uid = Number(payload.idcompany);
        setCurrentUserId(uid);
        fetchPendingTransfers(uid);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (cpage && cpage !== "" && cpage !== "1") {
      fetchRCList();
    }
  }, [cpage]);

  // Set today's date as default for create form
  useEffect(() => {
    const today = toThaiDateString();
    setOrderDate(today);
    setReceiveDate(today);
  }, []);

  // QR Scanner
  // บนแอป Android ใช้ ML Kit ของระบบแทน overlay ตัวเดิม (เร็วและโฟกัสดีกว่ามาก)
  const startQRScanner = async () => {
    if (isNativeScannerAvailable()) {
      try {
        const result = await scanBarcode();
        if (result?.value) handleQRCodeScanned(result.value);
      } catch (error: any) {
        toast.error(<div style={{ fontFamily: 'Kanit' }}>{error?.message || 'เปิดกล้องไม่สำเร็จ'}</div>);
      }
      return;
    }

    setShowQRScanner(true);
  };

  const handleScanResult = (result: any) => {
    if (result && result.length > 0) {
      const scannedCode = result[0].rawValue;
      handleQRCodeScanned(scannedCode);
      setShowQRScanner(false);
    }
  };

  const handleQRCodeScanned = (code: string) => {
    const product = dataProduct.find((p: any) => p.Barcode === code);
    if (product) {
      // If we are in detail view, pass barcode to body_rc_list via store
      useMessageStore.getState().setScannedBarcode(code);
      if (activeView !== 'detail') {
        toast.info(<div style={{ fontFamily: 'Kanit' }}>พบสินค้า: {product.ProductName} — กรุณาเปิดใบ RC ก่อน</div>);
      }
    } else {
      toast.error(<div style={{ fontFamily: 'Kanit' }}>ไม่พบสินค้าจาก Barcode: {code}</div>);
    }
  };

  // Create Order
  const handleCreateOrder = async () => {
    if (!selectedSupplier || !invoiceNo || !orderDate || !receiveDate) {
      toast.error(<div style={{ fontFamily: 'Kanit' }}>กรุณากรอกข้อมูลให้ครบถ้วน</div>);
      return;
    }

    setCreateLoading(true);

    const dt = new Date();
    const year = dt.toLocaleDateString('en-CA', { year: 'numeric', timeZone: 'Asia/Bangkok' });
    const month = dt.toLocaleDateString('en-CA', { month: '2-digit', timeZone: 'Asia/Bangkok' });
    const day = dt.toLocaleDateString('en-CA', { day: '2-digit', timeZone: 'Asia/Bangkok' });

    let companyS = localStorage.getItem("company_") || "";
    const person = localStorage.getItem("person_") || "";
    let maxRecN = Number(maxRec) === -Infinity || isNaN(Number(maxRec)) ? 100 : Number(maxRec) + 1;
    const code = String(maxRecN);
    const orderNo = String(year) + String(month) + String(day);
    const orderfull = orderNo + String(maxRecN);
    const codevender = String(supplier.filter((s: any) => s.names === selectedSupplier).map((s: any) => s.code));

    try {
      await axios.post(`/api/${apis}`, {
        company: companyS,
        code,
        names: selectedSupplier,
        invoice_No: invoiceNo,
        order_date: new Date(orderDate),
        receive_date: new Date(receiveDate),
        tax_date: taxDate ? new Date(taxDate) : null,
        tax_no: taxNo,
        pay_date: null,
        statuss: "",
        codenames: codevender,
        orderNo,
        orderfull,
        persons: person
      });

      toast.success(<div style={{ fontFamily: 'Kanit' }}>สร้างใบรับสินค้าเรียบร้อย</div>);

      // Reset form
      setSelectedSupplier('');
      setInvoiceNo('');
      setTaxDate('');
      setTaxNo('');

      // Refresh list and go back
      await fetchRCList();
      setActiveView('list');
    } catch (error) {
      console.error(error);
      toast.error(<div style={{ fontFamily: 'Kanit' }}>เกิดข้อผิดพลาดในการสร้างใบรับสินค้า</div>);
    } finally {
      setCreateLoading(false);
    }
  };

  // Filtered RC list
  const filteredPosts = posts.filter((post: any) => {
    const q = searchQuery.toLowerCase();
    return (
      (post.names || '').toLowerCase().includes(q) ||
      (post.orderfull || '').toLowerCase().includes(q) ||
      (post.invoice_No || '').toLowerCase().includes(q)
    );
  }).sort((a: any, b: any) => (b.orderfull || "").localeCompare(a.orderfull || ""));

  // Filtered suppliers
  const filteredSuppliers = supplier.filter((s: any) =>
    (s.names || '').toLowerCase().includes(supplierSearch.toLowerCase())
  );

  /**
   * ตัวเลือกในช่องค้นหา = สินค้า (หน่วยฐาน) + หน่วยขายทุกตัวของสินค้านั้น
   * เลือกแถวหน่วยขาย → ส่ง sentinel __UC__<id> ให้ฟอร์มรับสินค้าตั้งหน่วยรับให้เลย
   * (หน่วยขายที่ไม่มีบาร์โค้ดก็เลือกได้ ไม่ต้องสแกน)
   */
  const searchOptions = useMemo(() => {
    const base = dataProduct.map((product: any) => ({
      key: `p${product.id}`,
      value: String(product.Barcode || ''),
      code: String(product.code || ''),
      name: String(product.ProductName || ''),
      barcode: String(product.Barcode || ''),
      unitLabel: '',
      isUnit: false,
    }));
    if (unitConversions.length === 0) return base;

    const byCode = new Map<string, any[]>();
    for (const uc of unitConversions) {
      const code = String(uc?.productCode || '');
      const unitLabel = String(uc?.saleUnit || '').trim();
      if (!code || !unitLabel) continue;
      const product = dataProduct.find((p: any) => String(p.code || '') === code);
      if (!product) continue;
      const row = {
        key: `u${uc.id}`,
        value: `${UC_SELECT_PREFIX}${uc.id}`,
        code,
        name: String(product.ProductName || ''),
        barcode: String(uc.Barcode || ''),
        unitLabel: `${unitLabel} = ${roundUnit(normalizeFactor(uc.subQty))} ${product.Unit || ''}`,
        isUnit: true,
      };
      const list = byCode.get(code);
      if (list) list.push(row);
      else byCode.set(code, [row]);
    }
    if (byCode.size === 0) return base;

    // แทรกหน่วยขายไว้ใต้สินค้าเจ้าของทันที เพื่อให้อ่านเป็นกลุ่มเดียวกัน
    const merged: any[] = [];
    for (const item of base) {
      merged.push(item);
      const units = byCode.get(item.code);
      if (units) merged.push(...units);
    }
    return merged;
  }, [dataProduct, unitConversions]);

  // Filtered products for search modal
  const filteredProducts = searchOptions.filter((option: any) => {
    const query = searchModalQuery.toLowerCase();
    return (
      option.name?.toLowerCase().includes(query) ||
      option.code?.toLowerCase().includes(query) ||
      option.barcode?.toLowerCase().includes(query) ||
      option.unitLabel?.toLowerCase().includes(query)
    );
  });

  const handleNavigation = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'home') router.push('/web/mobile/index/');
    if (tab === 'checkin') router.push('/web/mobile/checkin/');
    if (tab === 'sale') router.push('/web/mobile/sale/');
    if (tab === 'product') router.push('/web/mobile/product/');
    if (tab === 'count') router.push('/web/mobile/stock/');
    if (tab === 'pickup') router.push('/web/mobile/gift/');
    if (tab === 'voice') router.push('/web/mobile/voice/');
  };

  const handleSelectRC = (post: any) => {
    setSelectedRCId(String(post.id));
    localStorage.setItem("id_RC", post.id);
    localStorage.setItem("codeS", post.orderfull);
    setActiveView('detail');
  };

  const handleProductSelectFromSearch = (option: any) => {
    // แถวหน่วยขายส่ง sentinel (__UC__id) แทนบาร์โค้ด — ฟอร์มรับสินค้าจะตั้งหน่วยรับให้เอง
    useMessageStore.getState().setScannedBarcode(option.value || '');
    setShowSearchModal(false);
    setSearchModalQuery('');
    if (activeView !== 'detail') {
      toast.info(<div style={{ fontFamily: 'Kanit' }}>กรุณาเปิดใบ RC ก่อนเพิ่มสินค้า</div>);
    }
  };

  if (loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: mobileRCStyles }} />
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">กำลังโหลดหน้ารับสินค้า...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      <style dangerouslySetInnerHTML={{ __html: mobileRCStyles }} />
      <div className="mobile-rc-app">
        {/* Header */}
        <div className="rc-header">
          <div className="header-top-row">
            {activeView === 'detail' ? (
              <button className="header-back-btn" onClick={() => { setActiveView('list'); setSelectedRCId(''); }}>
                <ChevronLeft size={20} color="white" />
              </button>
            ) : (
              <div />
            )}
            <div className="header-title">
              {activeView === 'detail' ? '📋 รายละเอียดใบ RC' : '📦 รับสินค้า'}
            </div>
            <button
              onClick={() => router.push('/web/mobile/product/')}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'white', fontFamily: 'Kanit', fontSize: 12, fontWeight: 500 }}
            >
              <Package size={16} />
              สินค้า
            </button>
          </div>

          {activeView !== 'detail' && (
            <div className="tab-bar">
              <button
                className={`tab-btn ${activeView === 'list' ? 'active' : ''}`}
                onClick={() => setActiveView('list')}
              >
                <FileText size={16} /> รายการ
              </button>
              <button
                className={`tab-btn ${activeView === 'create' ? 'active' : ''}`}
                onClick={() => setActiveView('create')}
              >
                <Plus size={16} /> สร้างใบ
              </button>
              <button
                className={`tab-btn ${activeView === 'transfer' ? 'active' : ''}`}
                onClick={() => { setActiveView('transfer'); fetchPendingTransfers(); }}
              >
                <ArrowDownToLine size={16} /> รับโอน
                {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
              </button>
            </div>
          )}

          {/* Search bar for list & detail views */}
          {(activeView === 'list' || activeView === 'detail') && (
            <div className="search-container">
              <div className="search-input-wrapper">
                <Search size={20} className="search-icon" />
                {activeView === 'list' ? (
                  <input
                    type="text"
                    className="search-input"
                    placeholder="ค้นหาใบรับสินค้า..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    className="search-input"
                    placeholder="ค้นหาสินค้า..."
                    value=""
                    readOnly
                    onClick={() => setShowSearchModal(true)}
                  />
                )}
              </div>
              {activeView === 'detail' && (
                <button className="camera-btn" onClick={startQRScanner}>
                  <Camera size={24} color="white" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="rc-content">
          {/* === LIST VIEW === */}
          {activeView === 'list' && (
            <>
              {filteredPosts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-title">ยังไม่มีใบรับสินค้า</div>
                  <div className="empty-state-text">กดปุ่ม "สร้างใบ" เพื่อเริ่มต้น</div>
                </div>
              ) : (
                filteredPosts.map((post: any) => (
                  <div key={post.id} className="rc-card" onClick={() => handleSelectRC(post)}>
                    <div className="rc-card-header">
                      <div className="rc-card-code">RC{post.orderfull}</div>
                      <div className="rc-card-badge">{post.countorder || 0} รายการ</div>
                    </div>
                    <div className="rc-card-supplier">{post.names}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="rc-card-meta">
                        <span>INV: {post.invoice_No}</span>
                        <span>
                          {post.order_date ? new Date(post.order_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-'}
                        </span>
                      </div>
                      {Number(post.totalRCAll) > 0 && (
                        <div className="rc-card-total">
                          ฿{Number(post.totalRCAll).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* === CREATE VIEW === */}
          {activeView === 'create' && (
            <div className="form-card">
              <div className="form-title">
                <Plus size={20} color="#4f46e5" />
                สร้างใบรับสินค้าใหม่
              </div>

              <div className="form-group">
                <div className="form-label">ชื่อผู้ขาย / ผู้แทนจำหน่าย *</div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="พิมพ์เพื่อค้นหา..."
                  value={selectedSupplier || supplierSearch}
                  onChange={(e) => {
                    setSupplierSearch(e.target.value);
                    setSelectedSupplier('');
                    setShowSupplierList(true);
                  }}
                  onFocus={() => setShowSupplierList(true)}
                />
                {showSupplierList && supplierSearch && (
                  <div className="supplier-list">
                    {filteredSuppliers.slice(0, 20).map((s: any) => (
                      <div
                        key={s.id}
                        className="supplier-item"
                        onClick={() => {
                          setSelectedSupplier(s.names);
                          setSupplierSearch('');
                          setShowSupplierList(false);
                        }}
                      >
                        <div style={{ fontWeight: 500, color: '#334155' }}>{s.names}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>รหัส: {s.code}</div>
                      </div>
                    ))}
                    {filteredSuppliers.length === 0 && (
                      <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>ไม่พบผู้ขาย</div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <div className="form-label">เลขที่ใบสั่งซื้อ *</div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="กรอกเลขที่ใบสั่งซื้อ"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <div className="form-label">วันสั่งสินค้า *</div>
                  <input
                    type="date"
                    className="form-input"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <div className="form-label">วันรับสินค้า *</div>
                  <input
                    type="date"
                    className="form-input"
                    value={receiveDate}
                    onChange={(e) => setReceiveDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="form-label">เลขที่ใบกำกับภาษี</div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="กรอกเลขที่ใบกำกับภาษี"
                  value={taxNo}
                  onChange={(e) => setTaxNo(e.target.value)}
                />
              </div>

              <div className="form-group">
                <div className="form-label">วันที่ออกใบกำกับภาษี</div>
                <input
                  type="date"
                  className="form-input"
                  value={taxDate}
                  onChange={(e) => setTaxDate(e.target.value)}
                />
              </div>

              <button
                className="form-btn-primary"
                onClick={handleCreateOrder}
                disabled={createLoading}
                style={{ marginTop: 8 }}
              >
                {createLoading ? (
                  <><RotateCcw size={18} style={{ animation: 'spin 1s linear infinite' }} /> กำลังบันทึก...</>
                ) : (
                  <><Check size={18} /> สร้างใบรับสินค้า</>
                )}
              </button>
            </div>
          )}

          {/* === TRANSFER VIEW === */}
          {activeView === 'transfer' && (
            <>
              <div className="toggle-bar">
                <button
                  className={`toggle-btn ${!showHistoryView ? 'active' : ''}`}
                  onClick={() => setShowHistoryView(false)}
                >
                  📦 รอรับ ({pendingTransfers.length})
                </button>
                <button
                  className={`toggle-btn ${showHistoryView ? 'active' : ''}`}
                  onClick={() => { setShowHistoryView(true); fetchTransferHistory(); }}
                >
                  📋 ประวัติ
                </button>
              </div>

              {!showHistoryView ? (
                // Pending transfers
                transferLoading ? (
                  <div className="empty-state">
                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                    <div className="empty-state-text" style={{ marginTop: 12 }}>กำลังโหลด...</div>
                  </div>
                ) : pendingTransfers.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <div className="empty-state-title">ไม่มีรายการรอรับ</div>
                    <div className="empty-state-text">ยังไม่มีสินค้าโอนเข้ามา</div>
                  </div>
                ) : (
                  pendingTransfers.map((transfer: any) => {
                    const isExpanded = expandedTransferId === transfer.id;
                    const pendingItems = transfer.items?.filter((i: any) => i.itemStatus === 'pending') || [];
                    const confirmedItems = transfer.items?.filter((i: any) => i.itemStatus === 'confirmed') || [];
                    const totalItems = transfer.items?.length || 0;

                    return (
                      <div key={transfer.id} className="transfer-card" style={{ borderColor: isExpanded ? '#f59e0b' : undefined }}>
                        <div className="transfer-header" onClick={() => setExpandedTransferId(isExpanded ? null : transfer.id)}>
                          <div className="transfer-info">
                            <div className="transfer-icon" style={{ background: '#fef3c7' }}>📦</div>
                            <div className="transfer-details">
                              <div className="transfer-no">{transfer.transferNo || `#${transfer.id}`}</div>
                              <div className="transfer-route">
                                📤 {transfer.fromBranchName || 'Remote'} → 📥 {transfer.toBranchName || '-'}
                              </div>
                              <div className="transfer-date">
                                {transfer.person || '-'} · {new Date(transfer.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="transfer-status-badge" style={{ background: '#fef3c7', color: '#d97706' }}>
                              รอรับ {pendingItems.length}/{totalItems}
                            </span>
                            <ChevronDown size={16} color="#94a3b8" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                          </div>
                        </div>

                        {isExpanded && transfer.items && (
                          <div className="transfer-items">
                            {transfer.items.map((item: any, idx: number) => {
                              const isPending = item.itemStatus === 'pending';
                              const isEditing = editingItemId === item.id;
                              const isConfirming = confirmingItemId === item.id;

                              return (
                                <div key={item.id} className="transfer-item-row" style={{ background: !isPending ? '#F3F8FC' : undefined }}>
                                  <div className="transfer-item-info">
                                    <div className="transfer-item-code">{item.itemcode}</div>
                                    <div className="transfer-item-name">{item.itemName}</div>
                                    {item.lot && <div style={{ fontSize: 11, color: '#94a3b8' }}>Lot: {item.lot}</div>}
                                  </div>
                                  <div className="transfer-item-qty">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        className="edit-qty-input"
                                        value={editQty}
                                        onChange={(e) => setEditQty(e.target.value)}
                                        autoFocus
                                      />
                                    ) : (
                                      <>{item.qty}{!isPending && item.confirmedQty != null && item.confirmedQty !== item.qty && (
                                        <span style={{ fontSize: 10, color: '#dc2626' }}> →{item.confirmedQty}</span>
                                      )}</>
                                    )}
                                  </div>
                                  <div className="transfer-item-actions">
                                    {isPending && !isEditing && (
                                      <>
                                        <button
                                          className="confirm-btn green"
                                          onClick={() => confirmItem(item.id, 'confirm')}
                                          disabled={isConfirming}
                                        >{isConfirming ? '...' : '✓'}</button>
                                        <button
                                          className="confirm-btn orange"
                                          onClick={() => { setEditingItemId(item.id); setEditQty(String(item.qty || 0)); }}
                                        >✏️</button>
                                      </>
                                    )}
                                    {isPending && isEditing && (
                                      <>
                                        <button
                                          className="confirm-btn green"
                                          onClick={() => {
                                            const q = parseFloat(editQty);
                                            if (isNaN(q) || q < 0 || q > (item.qty || 0)) {
                                              toast.error(<div style={{ fontFamily: 'Kanit' }}>จำนวนต้อง 0-{item.qty}</div>);
                                              return;
                                            }
                                            confirmItem(item.id, 'confirm_edit', q);
                                          }}
                                          disabled={isConfirming}
                                        >{isConfirming ? '...' : '✓'}</button>
                                        <button
                                          className="confirm-btn gray"
                                          onClick={() => setEditingItemId(null)}
                                        >✕</button>
                                      </>
                                    )}
                                    {!isPending && (
                                      <span style={{ fontSize: 11, color: '#2A6AAA', fontWeight: 600 }}>✅</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            <div className="transfer-footer">
                              <span>ผู้โอน: {transfer.person || '-'}</span>
                              <span>รวม: {transfer.items.reduce((s: number, i: any) => s + (i.qty || 0), 0)} ชิ้น</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              ) : (
                // History
                historyLoading ? (
                  <div className="empty-state">
                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                    <div className="empty-state-text" style={{ marginTop: 12 }}>กำลังโหลด...</div>
                  </div>
                ) : transferHistory.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <div className="empty-state-title">ยังไม่มีประวัติ</div>
                  </div>
                ) : (
                  transferHistory.map((transfer: any) => {
                    const isExpanded = expandedTransferId === transfer.id;
                    const totalItems = transfer.items?.length || 0;
                    const confirmedItems = transfer.items?.filter((i: any) => i.itemStatus === 'confirmed') || [];
                    const isCompleted = transfer.status === 'completed' || confirmedItems.length === totalItems;
                    const statusColor = isCompleted ? '#147F56' : '#f59e0b';
                    const statusBg = isCompleted ? '#D3F0E2' : '#fef3c7';
                    const statusLabel = isCompleted ? '✅ รับครบ' : `⏳ ${confirmedItems.length}/${totalItems}`;

                    return (
                      <div key={transfer.id} className="transfer-card" style={{ borderColor: isExpanded ? statusColor : undefined }}>
                        <div className="transfer-header" onClick={() => setExpandedTransferId(isExpanded ? null : transfer.id)}>
                          <div className="transfer-info">
                            <div className="transfer-icon" style={{ background: statusBg }}>{isCompleted ? '✅' : '⏳'}</div>
                            <div className="transfer-details">
                              <div className="transfer-no">{transfer.transferNo || `#${transfer.id}`}</div>
                              <div className="transfer-route">
                                📤 {transfer.fromBranchName || 'Remote'} → 📥 {transfer.toBranchName || '-'}
                              </div>
                              <div className="transfer-date">
                                {new Date(transfer.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })} · {totalItems} รายการ
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="transfer-status-badge" style={{ background: statusBg, color: statusColor }}>{statusLabel}</span>
                            <ChevronDown size={16} color="#94a3b8" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                          </div>
                        </div>

                        {isExpanded && transfer.items && (
                          <div className="transfer-items">
                            {transfer.items.map((item: any) => (
                              <div key={item.id} className="transfer-item-row" style={{ background: item.itemStatus === 'confirmed' ? '#EDF9F3' : undefined }}>
                                <div className="transfer-item-info">
                                  <div className="transfer-item-code">{item.itemcode}</div>
                                  <div className="transfer-item-name">{item.itemName}</div>
                                </div>
                                <div className="transfer-item-qty">{item.qty}</div>
                                <span style={{ fontSize: 11, fontWeight: 600, color: item.itemStatus === 'confirmed' ? '#147F56' : '#d97706' }}>
                                  {item.itemStatus === 'confirmed' ? '✅' : '⏳'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              )}
            </>
          )}

          {/* === DETAIL VIEW === */}
          {activeView === 'detail' && selectedRCId && (
            <BodyRCList rcId={selectedRCId} />
          )}
        </div>

        {/* FAB for create */}
        {activeView === 'list' && (
          <button className="fab-btn" onClick={() => setActiveView('create')}>
            <Plus size={28} />
          </button>
        )}

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <div className="qr-scanner-overlay">
            <div className="qr-scanner-header">
              <div className="qr-scanner-title">สแกน Barcode / QR Code</div>
              <button className="qr-close-btn" onClick={() => setShowQRScanner(false)}>
                <X size={24} color="white" />
              </button>
            </div>
            <div className="qr-scanner-frame">
              <Scanner
                onScan={handleScanResult}
                onError={(error) => console.log('Scanner error:', error)}
                formats={['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'code_93', 'upc_a', 'upc_e']}
                paused={!showQRScanner}
                components={{ finder: true }}
                styles={{
                  container: { width: '100%', height: '100%' },
                  video: { width: '100%', height: '100%', objectFit: 'cover' }
                }}
              />
            </div>
            <div className="qr-scanner-hint">
              วางกรอบ Barcode หรือ QR Code ไว้ในกรอบ<br />
              ระบบจะสแกนอัตโนมัติ
            </div>
          </div>
        )}

        {/* Search Modal */}
        {showSearchModal && (
          <div className="search-modal-overlay" onClick={() => setShowSearchModal(false)}>
            <div className="search-modal" onClick={(e) => e.stopPropagation()}>
              <div className="search-modal-header">
                <div className="search-modal-handle"></div>
                <input
                  type="text"
                  className="search-modal-input"
                  placeholder="ค้นหาชื่อ, รหัส, Barcode สินค้า"
                  value={searchModalQuery}
                  onChange={(e) => setSearchModalQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="search-modal-list">
                {filteredProducts.slice(0, 50).map((option: any) => (
                  <div
                    key={option.key}
                    className="product-search-item"
                    onClick={() => handleProductSelectFromSearch(option)}
                    // แถวหน่วยขายเยื้องเข้า + เส้นซ้าย ให้เห็นว่าเป็นหน่วยของสินค้าด้านบน
                    style={option.isUnit ? { paddingLeft: 22, borderLeft: '3px solid #c7d2fe', background: '#fbfbff' } : undefined}
                  >
                    <div className="product-code" style={option.isUnit ? { background: '#eef2ff', color: '#4338ca' } : undefined}>{option.code}</div>
                    <div className="product-details">
                      <div className="product-name" style={option.isUnit ? { color: '#4338ca' } : undefined}>{option.name}</div>
                      <div className="product-barcode">
                        {option.isUnit ? `📦 ${option.unitLabel}` : (option.barcode || '-')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="bottom-nav">
          {isNavVisible('P1') && <div
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => handleNavigation('home')}
          >
            <Home size={20} />
            <span>หน้าหลัก</span>
          </div>}
          {isNavVisible('P2') && <div
            className={`nav-item ${activeTab === 'checkin' ? 'active' : ''}`}
            onClick={() => handleNavigation('checkin')}
          >
            <LogIn size={20} />
            <span>เข้างาน</span>
          </div>}
          {isNavVisible('P3') && <div
            className={`nav-item ${activeTab === 'sale' ? 'active' : ''}`}
            onClick={() => handleNavigation('sale')}
          >
            <ShoppingCart size={20} />
            <span>ขาย</span>
          </div>}
          {isNavVisible('P4') && <div
            className={`nav-item ${activeTab === 'pickup' ? 'active' : ''}`}
            onClick={() => handleNavigation('pickup')}
          >
            <DollarSign size={20} />
            <span>ค่าหยิบ</span>
          </div>}
          {/* {isNavVisible('P5') && <div
            className={`nav-item ${activeTab === 'product' ? 'active' : ''}`}
            onClick={() => handleNavigation('product')}
          >
            <Box size={20} />
            <span>สินค้า</span>
          </div>} */}
          {isNavVisible('P6') && <div
            className={`nav-item ${activeTab === 'count' ? 'active' : ''}`}
            onClick={() => handleNavigation('count')}
          >
            <ClipboardList size={20} />
            <span>นับสินค้า</span>
          </div>}
          {isNavVisible('P7') && <div
            className="nav-item active"
          >
            <PackagePlus size={20} />
            <span>รับ</span>
          </div>}
          <div
            className={`nav-item ${activeTab === 'voice' ? 'active' : ''}`}
            onClick={() => handleNavigation('voice')}
          >
            <MessageSquare size={20} />
            <span>สื่อสาร</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default MobileRCPage;
