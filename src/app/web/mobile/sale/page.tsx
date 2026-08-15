'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Home, ShoppingCart, DollarSign, Box, ClipboardList, LogIn, Camera, Search, X, ChevronRight, Trash2, Plus, Minus, RefreshCw, PackagePlus, MessageSquare } from "lucide-react"
import { useNavLevel } from '../useNavLevel'
import { useMessageStore } from "./useMessageStore"
import BodyTabSale from './body_sale.tsx'
import axios from 'axios'
import { Scanner } from '@yudiel/react-qr-scanner'
import { toast } from 'sonner'
import { isNativeScannerAvailable, scanBarcode } from '@/lib/runtime/scanner'

const apidatalist = "datalist"

// Mobile Sale Styles
const mobileSaleStyles = `
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

  .mobile-sale-app {
    font-family: 'Kanit', sans-serif;
    background: linear-gradient(180deg, #F3F8FC 0%, #f8fafc 100%);
    min-height: 100vh;
    max-width: 100vw;
    overflow-x: hidden;
    padding-bottom: 90px;
  }

  /* Header */
  .sale-header {
    background: linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%);
    padding: 16px 16px 20px;
    border-radius: 0 0 24px 24px;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 4px 20px rgba(42, 106, 170, 0.3);
  }

  .header-title {
    color: white;
    font-size: 20px;
    font-weight: 600;
    text-align: center;
    margin-bottom: 12px;
  }

  /* Search Container */
  .search-container {
    display: flex;
    gap: 10px;
    align-items: center;
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
    border: 3px solid #3E86C7;
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
    border: 4px solid #3E86C7;
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
    background: linear-gradient(90deg, transparent, #3E86C7, transparent);
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

  /* Product Search Modal */
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
    border-color: #3E86C7;
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
    background: #F3F8FC;
  }

  .product-code {
    background: #F3F8FC;
    color: #2A6AAA;
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
    color: #3E86C7;
  }

  /* Content Area */
  .sale-content {
    padding: 16px;
    padding-top: 20px;
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

  /* Price Type Selector */
  .price-type-container {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 4px 0 16px;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .price-type-container::-webkit-scrollbar {
    display: none;
  }

  .price-type-btn {
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
  }

  .price-type-btn.active {
    background: #3E86C7;
    border-color: #3E86C7;
    color: white;
  }

  /* View Toggle */
  .view-toggle-container {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .view-toggle-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 2px solid #e5e7eb;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .view-toggle-btn.active {
    background: #F3F8FC;
    border-color: #3E86C7;
  }

  .view-toggle-btn.active svg {
    color: #3E86C7;
  }

  /* Sale Table Card */
  .sale-table-card {
    background: white;
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    border: 1px solid #f0f0f0;
  }
`;

const priceTypes = [
  { value: "หน้าร้าน", label: "หน้าร้าน" },
  { value: "ขายส่ง", label: "ขายส่ง" },
  { value: "สมาชิก", label: "สมาชิก" },
  { value: "ราคา A", label: "ราคา A" },
  { value: "ราคา B", label: "ราคา B" },
];

function MobileSalePage() {
  const router = useRouter();
  const { isNavVisible } = useNavLevel();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sale');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dataProduct, setDataProduct] = useState<any[]>([]);
  const [selectedPriceType, setSelectedPriceType] = useState('หน้าร้าน');
  const [viewMode, setViewMode] = useState('1');
  const [idDatalist, setIdDatalist] = useState('');

  const message = useMessageStore((state) => state.message);
  const setsavemu = useMessageStore((state) => state.setsavemu);
  const setsale = useMessageStore((state) => state.setsale);

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.background = '#f8fafc';
  }, []);

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("countrow", selectedPriceType);
      localStorage.setItem("show", "1");
      localStorage.setItem("mu", viewMode);
    }
  }, [selectedPriceType, viewMode]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (typeof window === "undefined") return;
      let companyS = localStorage.getItem("company_") || "";
      try {
        const res = await axios.get(`/api/${apidatalist}?company=${companyS}`);
        setDataProduct(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchProducts();
  }, []);

  // QR Scanner Functions - Using @yudiel/react-qr-scanner
  // บนแอป Android ใช้ ML Kit ของระบบแทน เร็วและโฟกัสดีกว่าการถอดรหัสใน WebView มาก
  // ถ้าไม่ใช่แอป native ก็เปิด overlay ตัวเดิมเหมือนเดิมทุกประการ
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
    // Find product by barcode
    const product = dataProduct.find((p: any) => p.Barcode === code);
    if (product) {
      setIdDatalist(String(product.id));
      setsale(String(product.id));
      // Reset after a short delay
      setTimeout(() => {
        setIdDatalist('');
      }, 100);
    }
  };

  const handleProductSelect = (product: any) => {
    setIdDatalist(String(product.id));
    setsale(String(product.id));
    setShowSearchModal(false);
    setSearchQuery('');
    // Reset after a short delay
    setTimeout(() => {
      setIdDatalist('');
    }, 100);
  };

  const filteredProducts = dataProduct.filter((product: any) => {
    const query = searchQuery.toLowerCase();
    return (
      product.ProductName?.toLowerCase().includes(query) ||
      product.code?.toLowerCase().includes(query) ||
      product.Barcode?.toLowerCase().includes(query)
    );
  });

  const handleNavigation = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'home') router.push('/web/mobile/index/');
    if (tab === 'checkin') router.push('/web/mobile/checkin/');
    if (tab === 'product') router.push('/web/mobile/product/');
    if (tab === 'count') router.push('/web/mobile/stock/');
    if (tab === 'stockchange') router.push('/web/mobile/stockchange/');
    if (tab === 'receive') router.push('/web/mobile/rc/');
    if (tab === 'pickup') router.push('/web/mobile/gift/');
    if (tab === 'voice') router.push('/web/mobile/voice/');
  };

  if (loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: mobileSaleStyles }} />
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">กำลังโหลดหน้าขาย...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: mobileSaleStyles }} />
      <div className="mobile-sale-app">
        {/* Header */}
        <div className="sale-header">
          <div className="header-title">🛒 หน้าขาย</div>

          {message === "" && (
            <div className="search-container">
              <div className="search-input-wrapper">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="ค้นหาสินค้า..."
                  readOnly
                  onClick={() => setShowSearchModal(true)}
                />
              </div>
              <button className="camera-btn" onClick={startQRScanner}>
                <Camera size={24} color="white" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="sale-content">


          {/* Sale Table */}
          <div className="sale-table-card">
            <BodyTabSale data1={idDatalist} />
          </div>
        </div>

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <div className="qr-scanner-overlay">
            <div className="qr-scanner-header">
              <div className="qr-scanner-title">สแกน QR Code</div>
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
              วางกรอบ QR Code หรือ Barcode ไว้ในกรอบ<br />
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
                    <div className="product-code">{product.code}</div>
                    <div className="product-details">
                      <div className="product-name">{product.ProductName}</div>
                      <div className="product-barcode">{product.Barcode}</div>
                    </div>
                    <div className="product-price">฿{Number(product.price).toLocaleString()}</div>
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

export default MobileSalePage;