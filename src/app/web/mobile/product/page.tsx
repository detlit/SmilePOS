'use client'

import React, { useEffect, useState, createContext, useRef, Suspense } from 'react'
import axios from 'axios'
import { usePermission } from '@/utils/usePermission'
import { useRouter } from 'next/navigation'
import { Home, ShoppingCart, DollarSign, Box, ClipboardList, LogIn, Camera, X, ChevronDown, ChevronUp, Package, Search, RefreshCw, PackagePlus, MessageSquare } from "lucide-react"
import { useNavLevel } from '../useNavLevel'
import { Table } from 'react-bootstrap'
import styles from "../../componant/mystyle.module.css"
import MenuProductHead from '../../componant/menuproducthead'
import ProductPagedata from "././product/dataproduct/updateproduct.tsx"
import CreateProductPagedata from '././product/dataproduct/createproduct.tsx'
import StockCardproduct from '././product/stockcard/page.tsx'
import Labelproduct from '././product/label/page.tsx'
import Giftproduct from '././product/gift/page.tsx'
import Image from "next/image"
import cancel from "../../../icon/cancel.jpg"
import { Scanner } from '@yudiel/react-qr-scanner'
import { toast } from 'sonner'
import { isNativeScannerAvailable, scanBarcode } from '@/lib/runtime/scanner'

const IDContext = createContext<any>(undefined)
import { useMessageStore } from "./useMessageStore"

const apis = "datalist"
const btncolors = "#3E86C7"
const btncolort = "white"

// Mobile Product Styles
const mobileProductStyles = `
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

  .mobile-product-app {
    font-family: 'Kanit', sans-serif;
    background: linear-gradient(180deg, #faf5ff 0%, #f8fafc 100%);
    min-height: 100vh;
    max-width: 100vw;
    overflow-x: hidden;
    padding-bottom: 90px;
  }

  /* Header */
  .product-header {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    padding: 16px 16px 20px;
    border-radius: 0 0 24px 24px;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3);
  }

  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .header-title {
    color: white;
    font-size: 20px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header-count {
    background: rgba(255,255,255,0.2);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    color: white;
  }

  /* QR Scanner Button */
  .scanner-container {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .scan-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px 20px;
    background: rgba(255,255,255,0.95);
    border: none;
    border-radius: 16px;
    font-family: 'Kanit', sans-serif;
    font-size: 15px;
    color: #7c3aed;
    font-weight: 500;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .scan-btn:active {
    transform: scale(0.98);
    background: rgba(255,255,255,1);
  }

  .add-product-btn {
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
    font-size: 24px;
    color: white;
  }

  .add-product-btn:active {
    transform: scale(0.95);
    background: rgba(255,255,255,0.3);
  }

  /* QR Scanner Modal */
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
    border: 3px solid #8b5cf6;
    border-radius: 24px;
    position: relative;
    overflow: hidden;
  }

  .qr-scanner-frame::before,
  .qr-scanner-frame::after {
    content: '';
    position: absolute;
    width: 40px;
    height: 40px;
    border: 4px solid #8b5cf6;
  }

  .qr-scanner-frame::before {
    top: -3px;
    left: -3px;
    border-right: none;
    border-bottom: none;
    border-radius: 20px 0 0 0;
  }

  .qr-scanner-frame::after {
    bottom: -3px;
    right: -3px;
    border-left: none;
    border-top: none;
    border-radius: 0 0 20px 0;
  }

  .qr-scanning-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, #8b5cf6, transparent);
    animation: scan 2s ease-in-out infinite;
  }

  @keyframes scan {
    0%, 100% { top: 0; }
    50% { top: calc(100% - 3px); }
  }

  .qr-scanner-hint {
    color: rgba(255,255,255,0.7);
    font-size: 14px;
    text-align: center;
    margin-top: 24px;
    padding: 0 40px;
  }

  /* Product Found Modal */
  .product-found-modal {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-radius: 24px 24px 0 0;
    padding: 20px;
    z-index: 1001;
    animation: slideUpModal 0.3s ease;
    max-height: 50vh;
    overflow-y: auto;
  }

  @keyframes slideUpModal {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  .product-found-handle {
    width: 40px;
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    margin: 0 auto 16px;
  }

  .product-found-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 12px;
  }

  .product-found-name {
    font-size: 18px;
    color: #8b5cf6;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .product-found-code {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 16px;
  }

  .product-found-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-family: 'Kanit', sans-serif;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
  }

  /* Content Area */
  .product-content {
    padding: 16px;
    padding-top: 20px;
  }

  /* Product List Card */
  .product-list-card {
    background: white;
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    border: 1px solid #f0f0f0;
    margin-bottom: 16px;
  }

  .product-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .product-list-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .product-list-title svg {
    color: #8b5cf6;
  }

  .toggle-list-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #f5f3ff;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #8b5cf6;
    transition: all 0.2s;
  }

  .toggle-list-btn:active {
    background: #ede9fe;
  }

  /* Product Table */
  .product-table-wrapper {
    max-height: 40vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .product-table {
    width: 100%;
    border-collapse: collapse;
  }

  .product-table th {
    background: #f5f3ff;
    padding: 10px 12px;
    text-align: left;
    font-size: 12px;
    font-weight: 600;
    color: #7c3aed;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .product-table td {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 13px;
    color: #374151;
  }

  .product-table tr {
    transition: background 0.2s;
  }

  .product-table tr:active {
    background: #faf5ff;
  }

  .product-table tr.selected {
    background: #ede9fe;
  }

  .product-name-cell {
    max-width: 150px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    background: #fee2e2;
    color: #dc2626;
  }

  /* Product Detail Card */
  .product-detail-card {
    background: white;
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    border: 1px solid #f0f0f0;
  }

  .detail-tabs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 12px;
    margin-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .detail-tabs::-webkit-scrollbar {
    display: none;
  }

  .detail-tab-btn {
    flex-shrink: 0;
    padding: 8px 16px;
    border-radius: 20px;
    border: 2px solid #e5e7eb;
    background: white;
    font-family: 'Kanit', sans-serif;
    font-size: 13px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .detail-tab-btn.active {
    background: #8b5cf6;
    border-color: #8b5cf6;
    color: white;
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
    border-color: #8b5cf6;
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
    background: #faf5ff;
  }

  .product-code-badge {
    background: #f5f3ff;
    color: #8b5cf6;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    min-width: 60px;
    text-align: center;
  }

  .product-search-details {
    flex: 1;
    min-width: 0;
  }

  .product-search-name {
    font-size: 14px;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .product-search-barcode {
    font-size: 11px;
    color: #9ca3af;
    margin-top: 2px;
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
    color: #8b5cf6;
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
    border-top-color: #8b5cf6;
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

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #9ca3af;
  }

  .empty-state svg {
    color: #d1d5db;
    margin-bottom: 12px;
  }

  .empty-state-text {
    font-size: 14px;
    text-align: center;
  }
`;

function MobileProductPage() {
  const router = useRouter();
  const { isNavVisible } = useNavLevel();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('product');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductList, setShowProductList] = useState(true);
  const [foundProduct, setFoundProduct] = useState<any>(null);

  const cpage = useMessageStore((state) => state.cpage);
  const setcpage = useMessageStore((state) => state.setcpage);
  const setidcus = useMessageStore((state) => state.setidcus);
  const setitem = useMessageStore((state) => state.setitem);
  const setMax = useMessageStore((state) => state.setMax);

  const [posts, setPosts] = useState<any[]>([]);
  const [data1, setData1] = useState<any[]>([]);
  const [showcolor, setshowcolor] = useState("1");
  const [idssw, setidss] = useState({ ids: "", itemcodes: "", maxSup: "" });
  const [chanhepage, setchanhepage] = useState(2);



  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.background = '#f8fafc';
  }, []);

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
    setcpage("1");
  }, [Number(cpage)]);

  const fetchPosts = async () => {
    let companyS = (localStorage.getItem("company_") || "");
    try {
      const res = await axios.get(`/api/${apis}?company=${companyS}`);
      if (res.data !== undefined) {
        setPosts(res.data);
        setData1(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const maxV = async () => {
    let result = posts.map((pp: any) => (pp.code));
    let maxValue = Math.max.apply(null, result);
    setMax(String(maxValue));
    setidss({ ...idssw, maxSup: String(maxValue) });
  };

  // QR Scanner Functions - Using @yudiel/react-qr-scanner
  // บนแอป Android ใช้ ML Kit ของระบบแทน overlay ตัวเดิม (เร็วและโฟกัสดีกว่ามาก)
  const startQRScanner = async () => {
    if (isNativeScannerAvailable()) {
      try {
        const result = await scanBarcode();
        if (result?.value) handleQRCodeScanned(result.value);
      } catch (error: any) {
        toast.error(error?.message || 'เปิดกล้องไม่สำเร็จ');
      }
      return;
    }

    setShowQRScanner(true);
  };

  const stopQRScanner = () => {
    setShowQRScanner(false);
  };

  const handleScanResult = (result: any) => {
    if (result && result.length > 0) {
      const scannedCode = result[0].rawValue;
      handleQRCodeScanned(scannedCode);
      stopQRScanner();
    }
  };

  const handleQRCodeScanned = (code: string) => {
    // Find product by barcode or code
    const product = data1.find((p: any) =>
      p.Barcode === code || p.code === code
    );
    if (product) {
      setFoundProduct(product);
      selectProduct(product);
    }
  };

  const selectProduct = (product: any) => {
    setidss({ ...idssw, ids: product.id, itemcodes: product.code });
    setidcus(String(product.id));
    setitem(String(product.code));
    setchanhepage(2);
    setFoundProduct(null);
    setShowSearchModal(false);
    setSearchQuery('');
  };

  const handleProductSelect = (product: any) => {
    selectProduct(product);
  };

  // Filter products for search
  const filteredProducts = data1.filter((product: any) => {
    const query = searchQuery.toLowerCase();
    return (
      product.ProductName?.toLowerCase().includes(query) ||
      product.code?.toLowerCase().includes(query) ||
      product.Barcode?.toLowerCase().includes(query)
    );
  });

  const handleNavigation = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case 'home':
        router.push('/web/mobile/index/');
        break;
      case 'checkin':
        router.push('/web/mobile/checkin/');
        break;
      case 'sale':
        router.push('/web/mobile/sale/');
        break;
      case 'product':
        router.push('/web/mobile/product/');
        break;
      case 'count':
        router.push('/web/mobile/stock/');
        break;
      case 'stockchange':
        router.push('/web/mobile/stockchange/');
        break;
      case 'receive':
        router.push('/web/mobile/rc/');
        break;
      case 'pickup':
        router.push('/web/mobile/gift/');
        break;
      case 'voice':
        router.push('/web/mobile/voice/');
        break;
    }
  };

  const handleAddProduct = () => {
    setchanhepage(1);
    setshowcolor("1");
    maxV();
    setcpage("1");
  };

  // Level check
  const [l, setlevel] = useState<any[]>([]);
  const { hasPermission } = usePermission()
  useEffect(() => {
  }, []);

  if (loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: mobileProductStyles }} />
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">กำลังโหลดข้อมูลสินค้า...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: mobileProductStyles }} />
      <div className="mobile-product-app">
        {/* Header */}
        <div className="product-header">
          <div className="header-top">
            <div className="header-title">
              <Package size={24} />
              ข้อมูลสินค้า
            </div>
            <div className="header-count">{data1.length} รายการ</div>
          </div>

          {/* Scanner Button */}
          <div className="scanner-container">
            <button className="scan-btn" onClick={startQRScanner}>
              <Camera size={22} />
              <span>สแกน QR Code / Barcode</span>
            </button>
            <button className="add-product-btn" onClick={handleAddProduct}>
              +
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="product-content">
          {/* Product List Card */}
          <div className="product-list-card">
            <div className="product-list-header">
              <div className="product-list-title">
                <Box size={18} />
                รายการสินค้า
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="toggle-list-btn"
                  onClick={() => setShowSearchModal(true)}
                >
                  <Search size={18} />
                </button>
                <button
                  className="toggle-list-btn"
                  onClick={() => setShowProductList(!showProductList)}
                >
                  {showProductList ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
            </div>

            {showProductList && (
              <div className="product-table-wrapper">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>รหัส</th>
                      <th style={{ width: '65%' }}>ชื่อสินค้า</th>
                      <th style={{ width: '20%' }}>ระงับ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data1.map((post: any) => (
                      <tr
                        key={post.id}
                        onClick={() => selectProduct(post)}
                        className={idssw.ids === post.id ? 'selected' : ''}
                      >
                        <td>{post.code}</td>
                        <td className="product-name-cell">{post.ProductName}</td>
                        <td>
                          {post.Show === "False" || post.Show === "FALSE" || post.Show === "false"
                            ? ""
                            : <span className="status-badge">ระงับ</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Product Detail Card */}
          <div className="product-detail-card">
            {/* Tab Buttons */}
            <div className="detail-tabs">
              <button
                className={`detail-tab-btn ${showcolor === "1" ? "active" : ""}`}
                onClick={() => setshowcolor("1")}
              >
                ข้อมูลสินค้า
              </button>
              {/* Hidden tabs - uncomment to show
              <button
                className={`detail-tab-btn ${showcolor === "2" ? "active" : ""}`}
                onClick={() => setshowcolor("2")}
              >
                ภาษาฉลากสินค้า
              </button>
              {(l.filter((a: any) => a.codename === "D1").map((b: any) => b.level1)[0] === true ||
                l.length === 0 ||
                String(localStorage.getItem("level_")) === "level2") && (
                  <button
                    className={`detail-tab-btn ${showcolor === "4" ? "active" : ""}`}
                    onClick={() => setshowcolor("4")}
                  >
                    StockCard
                  </button>
                )}
              {(l.filter((a: any) => a.codename === "C2").map((b: any) => b.level1)[0] === true ||
                l.length === 0 ||
                String(localStorage.getItem("level_")) === "level2") && (
                  <button
                    className={`detail-tab-btn ${showcolor === "3" ? "active" : ""}`}
                    onClick={() => setshowcolor("3")}
                  >
                    ค่าหยิบสินค้า
                  </button>
                )}
              */}
            </div>

            {/* Detail Content */}
            <div>
              {idssw.ids === "" ? (
                <div className="empty-state">
                  <Package size={48} />
                  <div className="empty-state-text">
                    กรุณาเลือกสินค้าจากรายการ<br />หรือสแกน QR Code
                  </div>
                </div>
              ) : (
                <>
                  {showcolor === "1" && (
                    <IDContext.Provider value={idssw}>
                      {chanhepage === 1 ? <CreateProductPagedata /> : <ProductPagedata />}
                    </IDContext.Provider>
                  )}
                  {showcolor === "2" && (
                    <IDContext.Provider value={idssw}>
                      <Labelproduct />
                    </IDContext.Provider>
                  )}
                  {showcolor === "3" && (
                    <IDContext.Provider value={idssw}>
                      <Giftproduct />
                    </IDContext.Provider>
                  )}
                  {showcolor === "4" && (
                    <IDContext.Provider value={idssw}>
                      <StockCardproduct />
                    </IDContext.Provider>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <div className="qr-scanner-overlay">
            <div className="qr-scanner-header">
              <div className="qr-scanner-title">สแกน QR Code / Barcode</div>
              <button className="qr-close-btn" onClick={stopQRScanner}>
                <X size={24} color="white" />
              </button>
            </div>
            <div className="qr-scanner-frame">
              <Scanner
                onScan={handleScanResult}
                onError={(error) => console.log('Scanner error:', error)}
                formats={['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'code_93', 'upc_a', 'upc_e']}
                paused={!showQRScanner}
                components={{
                  finder: true
                }}
                styles={{
                  container: { width: '100%', height: '100%' },
                  video: { width: '100%', height: '100%', objectFit: 'cover' }
                }}
              />
            </div>
            <div className="qr-scanner-hint">
              วาง QR Code หรือ Barcode ไว้ในกรอบ<br />
              ระบบจะค้นหาสินค้าให้อัตโนมัติ
            </div>
          </div>
        )}

        {/* Product Found Modal */}
        {foundProduct && (
          <div className="qr-scanner-overlay" onClick={() => setFoundProduct(null)}>
            <div className="product-found-modal" onClick={e => e.stopPropagation()}>
              <div className="product-found-handle"></div>
              <div className="product-found-title">พบสินค้า!</div>
              <div className="product-found-name">{foundProduct.ProductName}</div>
              <div className="product-found-code">รหัส: {foundProduct.code} | Barcode: {foundProduct.Barcode}</div>
              <button className="product-found-btn" onClick={() => selectProduct(foundProduct)}>
                ดูรายละเอียดสินค้า
              </button>
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="search-modal-list">
                {filteredProducts.slice(0, 50).map((product: any) => (
                  <div
                    key={product.id}
                    className="product-search-item"
                    onClick={() => handleProductSelect(product)}
                  >
                    <div className="product-code-badge">{product.code}</div>
                    <div className="product-search-details">
                      <div className="product-search-name">{product.ProductName}</div>
                      <div className="product-search-barcode">{product.Barcode}</div>
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
            className={`nav-item ${activeTab === 'receive' ? 'active' : ''}`}
            onClick={() => handleNavigation('receive')}
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

export default MobileProductPage;
