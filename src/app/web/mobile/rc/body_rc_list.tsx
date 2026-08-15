'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Trash2, Package, ChevronDown, ChevronUp, Check, RotateCcw, Plus
} from "lucide-react"
import { useMessageStore } from "./useMessageStore"
import axios from 'axios'
import { toast } from 'sonner'
import { fetchCostPriceMode, getCachedCostPriceMode, costPriceModeLabel, pickCostByMode, type CostPriceMode } from "@/lib/costPriceMode"
import { normalizeBarcode } from "@/lib/barcodeAliasClient"
import {
  BASE_UNIT_KEY,
  UC_SELECT_PREFIX,
  buildReceiveQuantities,
  buildUnitOptions,
  findUnitOption,
  reinterpretOnUnitChange,
  roundUnit,
  toBaseCost,
  unitOptionLabel,
  type UnitConversionRow,
} from "@/lib/receiveUnit"

const apis = "receive"
const apidatalist = "datalist"
const apidataitem = "dataitemlist"
const apiunitconversion = "unitconversion"

interface BodyRCListProps {
  rcId: string;
}

const bodyStyles = `
  .detail-header-card {
    background: white;
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.04);
    border: 1px solid #f0f0f0;
  }

  .detail-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .detail-code {
    font-size: 18px;
    font-weight: 700;
    color: #4f46e5;
  }

  .detail-supplier {
    font-size: 15px;
    color: #334155;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .detail-meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    font-size: 12px;
    color: #64748b;
    margin-top: 8px;
  }

  .detail-meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .detail-meta-value {
    font-weight: 600;
    color: #1e293b;
  }

  .detail-total-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, #eef2ff, #e0e7ff);
    border-radius: 12px;
    padding: 12px 16px;
    margin-top: 10px;
  }

  .detail-total-label {
    font-size: 13px;
    color: #64748b;
  }

  .detail-total-value {
    font-size: 18px;
    font-weight: 700;
    color: #4f46e5;
  }

  /* Item List */
  .item-list-card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.04);
    border: 1px solid #f0f0f0;
  }

  .item-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    border-bottom: 1px solid #f0f0f0;
    background: #fafafa;
  }

  .item-list-title {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .item-list-count {
    font-size: 12px;
    color: #6366f1;
    background: #eef2ff;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 600;
  }

  .item-row {
    padding: 12px 16px;
    border-bottom: 1px solid #f5f5f5;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .item-row:last-child {
    border-bottom: none;
  }

  .item-num {
    width: 24px;
    height: 24px;
    border-radius: 8px;
    background: #f1f5f9;
    color: #64748b;
    font-size: 11px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .item-info {
    flex: 1;
    min-width: 0;
  }

  .item-name {
    font-size: 13px;
    color: #334155;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-sub {
    font-size: 11px;
    color: #94a3b8;
    display: flex;
    gap: 8px;
    margin-top: 2px;
  }

  .item-qty-cost {
    text-align: right;
    flex-shrink: 0;
  }

  .item-qty {
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
  }

  .item-cost {
    font-size: 11px;
    color: #64748b;
  }

  .item-delete-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: #fef2f2;
    color: #ef4444;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.15s;
  }

  .item-delete-btn:active {
    background: #fee2e2;
    transform: scale(0.95);
  }

  /* Add Item Form */
  .add-item-card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.04);
    border: 2px solid #6366f1;
  }

  .add-item-header {
    padding: 12px 16px;
    background: linear-gradient(135deg, #eef2ff, #e0e7ff);
    font-size: 14px;
    font-weight: 600;
    color: #4f46e5;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  .add-item-body {
    padding: 16px;
  }

  .add-item-product {
    font-size: 15px;
    font-weight: 600;
    color: #2A6AAA;
    margin-bottom: 4px;
  }

  .add-item-balance {
    font-size: 13px;
    color: #2A6AAA;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .add-item-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .add-field {
    margin-bottom: 0;
  }

  .add-field-label {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 4px;
    font-weight: 500;
  }

  .add-field-input {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    font-size: 15px;
    font-family: 'Kanit', sans-serif;
    outline: none;
    text-align: center;
    font-weight: 600;
    color: #2A6AAA;
    transition: border-color 0.2s;
    background: #fafafa;
  }

  .add-field-input:focus {
    border-color: #6366f1;
    background: white;
  }

  .add-field-input:disabled {
    background: #f1f5f9;
    color: #64748b;
  }

  .add-btns {
    display: flex;
    gap: 8px;
    margin-top: 14px;
  }

  .add-btn-save {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #2A6AAA, #3E86C7);
    color: white;
    font-family: 'Kanit', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    box-shadow: 0 4px 12px rgba(42, 106, 170, 0.3);
    transition: all 0.2s;
  }

  .add-btn-save:active {
    transform: scale(0.98);
  }

  .add-btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .add-btn-clear {
    padding: 12px 20px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    color: #64748b;
    font-family: 'Kanit', sans-serif;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .add-btn-clear:active {
    background: #f5f5f5;
  }

  /* Barcode input */
  .barcode-input-row {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .barcode-input {
    flex: 1;
    padding: 12px 14px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 15px;
    font-family: 'Kanit', sans-serif;
    outline: none;
    transition: border-color 0.2s;
    background: #fafafa;
  }

  .barcode-input:focus {
    border-color: #6366f1;
    background: white;
  }

  /* Receive unit chips — เลือกรับเป็นหน่วยฐาน หรือ หน่วยขาย (กล่อง/ลัง) */
  .unit-chip-row {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 4px;
    margin-bottom: 12px;
    -webkit-overflow-scrolling: touch;
  }

  .unit-chip {
    flex-shrink: 0;
    padding: 7px 12px;
    border-radius: 20px;
    border: 1.5px solid #e5e7eb;
    background: #fafafa;
    color: #64748b;
    font-family: 'Kanit', sans-serif;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
  }

  .unit-chip.active {
    border-color: #6366f1;
    background: #eef2ff;
    color: #4338ca;
    font-weight: 600;
  }

  .unit-chip:active {
    transform: scale(0.97);
  }

  .converted-hint {
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    color: #4338ca;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    border-radius: 10px;
    padding: 1px 7px;
    margin-top: 4px;
    white-space: nowrap;
  }

  .item-pack-badge {
    font-size: 11px;
    font-weight: 600;
    color: #4338ca;
    background: #eef2ff;
    border-radius: 6px;
    padding: 1px 6px;
  }

  /* Profit tag */
  .profit-tag {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 6px;
    font-weight: 500;
  }

  .profit-tag.positive {
    color: #2A6AAA;
    background: #F3F8FC;
  }

  .profit-tag.negative {
    color: #ef4444;
    background: #fef2f2;
  }
`;

const initialItemValues = {
  newCost: '',
  qty: '',
  lot: '',
  dateExp: '',
  freebaht: '',
  discountbaht: ''
};

function BodyRCList({ rcId }: BodyRCListProps) {
  const [rcData, setRcData] = useState<any>(null);
  const [dataItem, setDataItem] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [dataProduct, setDataProduct] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  // Editable Vat / Discount
  const [editingVat, setEditingVat] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [vatValue, setVatValue] = useState('');
  const [discountValue, setDiscountValue] = useState('');

  // Add item form
  const [showAddForm, setShowAddForm] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [balance, setBalance] = useState('0');
  const [costPriceMode, setCostPriceMode] = useState<CostPriceMode>(getCachedCostPriceMode());
  const [costSummary, setCostSummary] = useState<{ latestCost: number | null; averageCost: number | null }>({ latestCost: null, averageCost: null });
  const [itemValues, setItemValues] = useState(initialItemValues);
  const [saveLoading, setSaveLoading] = useState(false);

  // ══ หน่วยรับ: รับเป็นกล่อง/ลังได้ แต่เก็บลงสต็อกเป็นหน่วยย่อยเสมอ ══
  // ช่องกรอกทุกช่อง (ราคาทุนใหม่ · จำนวนรับ · แถม) อยู่ใน "หน่วยรับ" ที่เลือก
  // แล้วแปลงเป็นหน่วยย่อยครั้งเดียวตอนบันทึก — ดู src/lib/receiveUnit.ts
  const [unitConversions, setUnitConversions] = useState<UnitConversionRow[]>([]);
  const [unitKey, setUnitKey] = useState<string>(BASE_UNIT_KEY);
  const unitOptions = useMemo(
    () => buildUnitOptions(selectedProduct, unitConversions),
    [selectedProduct, unitConversions]
  );
  const selectedUnit = findUnitOption(unitOptions, unitKey);
  const unitFactor = selectedUnit.factor;
  const isPackUnit = unitFactor !== 1;

  const barcodeRef = useRef<HTMLInputElement>(null);
  const newCostRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const lotRef = useRef<HTMLInputElement>(null);
  const dateExpRef = useRef<HTMLInputElement>(null);

  const scannedBarcode = useMessageStore((state) => state.scannedBarcode);
  const setScannedBarcode = useMessageStore((state) => state.setScannedBarcode);
  const setcpage = useMessageStore((state) => state.setcpage);

  // Fetch RC detail + items
  const fetchData = async () => {
    setIsFetching(true);
    const companyS = localStorage.getItem("company_") || "";
    const codeS = localStorage.getItem("codeS") || "";
    try {
      const [rcRes, itemsRes] = await Promise.all([
        axios.get(`/api/${apis}/${Number(rcId)}`),
        axios.get(`/api/${apidataitem}?company=${companyS}&codenames=${codeS}`)
      ]);
      setRcData(rcRes.data);
      setDataItem(itemsRes.data);
      const total = itemsRes.data.reduce((a: any, b: any) => a + (b.totalcost || 0), 0);
      setTotalCost(total);

      // Update bill totals
      const totalRC = total;
      const vatRC = Number(rcRes.data.vatRC || 0);
      const discountRC = Number(rcRes.data.discountRC || 0);
      const totalRCAll = total + vatRC - discountRC;
      const countorder = itemsRes.data.length;
      await axios.put(`/api/${apis}/${Number(rcId)}`, {
        totalRC, vatRC, discountRC, totalRCAll, countorder
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  };

  // Save Vat / Discount
  const handleSaveVatDiscount = async (field: 'vat' | 'discount') => {
    const val = field === 'vat' ? Number(vatValue || 0) : Number(discountValue || 0);
    const vatRC = field === 'vat' ? val : Number(rcData?.vatRC || 0);
    const discountRC = field === 'discount' ? val : Number(rcData?.discountRC || 0);
    const totalRCAll = totalCost + vatRC - discountRC;
    try {
      await axios.put(`/api/${apis}/${Number(rcId)}`, {
        totalRC: totalCost, vatRC, discountRC, totalRCAll, countorder: dataItem.length
      });
      setRcData((prev: any) => ({ ...prev, vatRC, discountRC, totalRCAll }));
      toast.success(<div style={{ fontFamily: 'Kanit' }}>บันทึกเรียบร้อย</div>);
    } catch (err) {
      toast.error(<div style={{ fontFamily: 'Kanit' }}>บันทึกไม่สำเร็จ</div>);
    }
    if (field === 'vat') setEditingVat(false);
    if (field === 'discount') setEditingDiscount(false);
  };

  // Fetch product list
  const fetchProducts = async () => {
    const companyS = localStorage.getItem("company_") || "";
    try {
      const res = await axios.get(`/api/${apidatalist}?company=${companyS}&fields=receive`);
      setDataProduct(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // หน่วยขายทั้งบริษัท — ใช้ทั้งสแกนบาร์โค้ดกล่อง/ลัง และเลือกหน่วยรับในฟอร์ม
  const fetchUnitConversions = async () => {
    const companyS = localStorage.getItem("company_") || "";
    if (!companyS) return;
    try {
      const res = await axios.get(`/api/${apiunitconversion}?company=${encodeURIComponent(companyS)}`);
      setUnitConversions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('load unit conversions failed:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchProducts();
    fetchUnitConversions();
  }, [rcId]);

  // Handle scanned barcode from parent (QR scanner or search modal)
  useEffect(() => {
    if (scannedBarcode && scannedBarcode !== '') {
      // sentinel ของหน่วยขาย (__UC__id) เป็นค่าภายใน ไม่ใช่บาร์โค้ดจริง จึงไม่โชว์ในช่องสแกน
      setBarcodeValue(scannedBarcode.startsWith(UC_SELECT_PREFIX) ? '' : scannedBarcode);
      lookupByBarcode(scannedBarcode);
      setScannedBarcode('');
      setShowAddForm(true);
    }
  }, [scannedBarcode]);

  /** เลือกสินค้าได้แล้ว — ตั้งหน่วยรับที่สแกนมา แล้วโฟกัสช่องราคาทุน */
  const applyScannedProduct = (product: any, nextUnitKey: string) => {
    setSelectedProduct(product);
    setUnitKey(nextUnitKey);
    fetchBalance(product.id);
    setTimeout(() => {
      newCostRef.current?.focus();
      newCostRef.current?.select();
    }, 200);
  };

  // Lookup product by barcode
  // สินค้าหนึ่งตัวสแกนได้หลายบาร์โค้ด และหลายหน่วย ลำดับเดียวกับฝั่งเซิร์ฟเวอร์:
  //   0. sentinel __UC__<id> — เลือกหน่วยขายจากช่องค้นหา (หน่วยที่ไม่มีบาร์โค้ด)
  //   1. บาร์โค้ดหลัก (ในแคตตาล็อกที่โหลดไว้ — เร็วสุด ไม่ต้องยิง API)
  //   2. บาร์โค้ดสำรอง / บาร์โค้ดหน่วยขาย — ถาม /api/product-barcode/resolve
  //      (ยิงเฉพาะตอนหาไม่เจอ จึงไม่ทำให้สแกนช้าลง) ถ้าเป็นหน่วยขายจะได้ unitConversionId มาด้วย
  // ที่ได้กลับมาคือ "ตัวสินค้า" — การรับสินค้ายังบันทึก Barcode หลักตามเดิม
  const lookupByBarcode = async (barcode: string) => {
    const raw = String(barcode || "");

    // 0) เลือกหน่วยขายจากช่องค้นหา
    if (raw.startsWith(UC_SELECT_PREFIX)) {
      const ucId = Number(raw.slice(UC_SELECT_PREFIX.length));
      const uc = unitConversions.find((u: any) => Number(u.id) === ucId);
      const ucProduct = uc ? dataProduct.find((p: any) => String(p.code || "") === String(uc.productCode || "")) : null;
      if (uc && ucProduct) {
        applyScannedProduct(ucProduct, String(uc.id));
      } else {
        toast.error(<div style={{ fontFamily: 'Kanit' }}>ไม่พบหน่วยขายที่เลือก</div>);
        setSelectedProduct(null);
      }
      return;
    }

    const scanned = normalizeBarcode(raw);
    let product = dataProduct.find((p: any) => normalizeBarcode(p.Barcode) === scanned);
    let scannedUnitKey = BASE_UNIT_KEY;

    if (!product) {
      const companyS = localStorage.getItem("company_") || "";
      try {
        const res = await axios.get(
          `/api/product-barcode/resolve?company=${encodeURIComponent(companyS)}&barcode=${encodeURIComponent(scanned)}`
        );
        if (res.data?.found) {
          product = dataProduct.find((p: any) => String(p.code || "") === String(res.data.code));
          // สแกนโดนบาร์โค้ดที่ติดข้างกล่อง/ลัง → ตั้งหน่วยรับเป็นหน่วยขายนั้นให้เลย
          if (product && res.data.source === "unit" && res.data.unitConversionId != null) {
            scannedUnitKey = String(res.data.unitConversionId);
          }
        }
      } catch (e) {
        console.error("resolve barcode failed:", e);
        // เซิร์ฟเวอร์ล่ม/ออฟไลน์ → ยังลองเทียบกับหน่วยขายที่โหลดไว้ในเครื่องได้
        const uc = unitConversions.find((u: any) => normalizeBarcode(u.Barcode) === scanned);
        if (uc) {
          product = dataProduct.find((p: any) => String(p.code || "") === String(uc.productCode || ""));
          if (product) scannedUnitKey = String(uc.id);
        }
      }
    }

    if (product) {
      applyScannedProduct(product, scannedUnitKey);
    } else {
      toast.error(<div style={{ fontFamily: 'Kanit' }}>ไม่พบสินค้าจาก Barcode: {barcode}</div>);
      setSelectedProduct(null);
    }
  };

  /** สลับหน่วยเอง — คงปริมาณ/มูลค่าจริงไว้ (2 กล่อง ⇄ 24 ขวด, 267/กล่อง ⇄ 22.25/ขวด) */
  const handleUnitChange = (nextKey: string) => {
    const fromFactor = selectedUnit.factor;
    const toFactor = findUnitOption(unitOptions, nextKey).factor;
    setUnitKey(nextKey);
    if (fromFactor === toFactor) return;
    setItemValues((prev) => ({
      ...prev,
      qty: reinterpretOnUnitChange(prev.qty, fromFactor, toFactor, "qty"),
      newCost: reinterpretOnUnitChange(prev.newCost, fromFactor, toFactor, "cost"),
      freebaht: reinterpretOnUnitChange(prev.freebaht, fromFactor, toFactor, "qty"),
    }));
  };

  const fetchBalance = async (productId: string | number) => {
    const companyS = localStorage.getItem("company_") || "";
    try {
      const res = await axios.get(`/api/sale_cal/sale_balance?company=${companyS}&id=${productId}`);
      setBalance(String(res.data.balance ?? 0));
    } catch {
      setBalance('0');
    }
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (barcodeValue) {
        lookupByBarcode(barcodeValue);
      }
    }
  };

  const handleFieldKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLInputElement | null>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef.current?.focus();
      nextRef.current?.select();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setItemValues(prev => ({ ...prev, [name]: value }));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  // Save item
  const handleSaveItem = async () => {
    if (!selectedProduct) {
      toast.error(<div style={{ fontFamily: 'Kanit' }}>กรุณาเลือกสินค้าก่อน</div>);
      return;
    }
    if (!itemValues.newCost || !itemValues.qty) {
      toast.error(<div style={{ fontFamily: 'Kanit' }}>กรุณากรอกราคาทุนและจำนวน</div>);
      return;
    }

    setSaveLoading(true);
    const companyS = localStorage.getItem("company_") || "";
    const codeS = localStorage.getItem("codeS") || "";
    const person = localStorage.getItem("person_") || "";

    // จุดแปลงหน่วยจุดเดียวของฟอร์ม: สิ่งที่ผู้ใช้กรอก (หน่วยรับ) → หน่วยย่อยที่เข้าสต็อก
    // unit ต้องเป็นหน่วยฐานของสินค้าเสมอ ห้ามเขียนชื่อหน่วยขายลงไป
    // ไม่งั้นยอดคงเหลือ/FEFO จะจับกลุ่มผิด (เหตุผลเต็ม: src/lib/receiveUnit.ts)
    const packed = buildReceiveQuantities({
      qtyInUnit: itemValues.qty,
      costPerUnit: itemValues.newCost,
      freeInUnit: itemValues.freebaht,
      option: selectedUnit,
    });

    try {
      await axios.post(`/api/${apidataitem}`, {
        company: companyS,
        codenames: codeS,
        itemcode: selectedProduct.code,
        itemName: selectedProduct.ProductName,
        unit: selectedProduct.Unit || '',
        newCost: packed.newCost,
        qty: packed.qty,
        totalcost: packed.totalcost,
        lot: itemValues.lot || '',
        dateExp: itemValues.dateExp || null,
        // ของแถมแปลงด้วยตัวคูณเดียวกัน (แถม 1 กล่อง = 12 ขวดเข้าสต็อก)
        freebaht: packed.freebaht,
        discountbaht: Number(itemValues.discountbaht) || 0,
        Barcode: selectedProduct.Barcode || '',
        type: selectedProduct.type || '',
        subtype: selectedProduct.subtype || '',
        person,
        statuss: '',
        dateRC: rcData?.receive_date || new Date(),
        // sale = ตัวนับจำนวนที่ขายไปแล้วของ lot นี้ ต้องเริ่มที่ 0
        // (ห้ามใส่ราคาขาย ไม่งั้นหน้าขายมองว่า lot ขายหมดแล้ว — เคยเกิดขึ้นมาแล้ว)
        sale: 0,
        // จำนวนเข้าสต็อกจริงของ lot นี้ = จำนวนรับ + ของแถม (หน่วยย่อยทั้งคู่)
        balance: packed.balance,
        codevender: rcData?.codenames || '',
        namevender: rcData?.names || '',
        // ที่มาของจำนวน: รับมากี่ "หน่วยขาย" — ไว้แสดง/ตรวจสอบย้อนหลังเท่านั้น
        saleQty: packed.saleQty,
        saleUnit: packed.saleUnit,
        saleFactor: packed.saleFactor
      });

      toast.success(<div style={{ fontFamily: 'Kanit' }}>บันทึกสินค้าเรียบร้อย</div>);
      setItemValues(initialItemValues);
      setSelectedProduct(null);
      setUnitKey(BASE_UNIT_KEY);
      setBarcodeValue('');
      setBalance('0');
      setcpage(String(Date.now()));
      fetchData();

      setTimeout(() => {
        barcodeRef.current?.focus();
      }, 300);
    } catch (error) {
      console.error(error);
      toast.error(<div style={{ fontFamily: 'Kanit' }}>เกิดข้อผิดพลาดในการบันทึก</div>);
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId: number) => {
    try {
      await axios.delete(`/api/${apidataitem}/${itemId}`);
      toast.success(<div style={{ fontFamily: 'Kanit' }}>ลบรายการเรียบร้อย</div>);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(<div style={{ fontFamily: 'Kanit' }}>ลบไม่สำเร็จ</div>);
    }
  };

  const clearForm = () => {
    setItemValues(initialItemValues);
    setSelectedProduct(null);
    setUnitKey(BASE_UNIT_KEY);
    setBarcodeValue('');
    setBalance('0');
    setTimeout(() => barcodeRef.current?.focus(), 100);
  };

  const totalComputedCost = useMemo(() => {
    return Number(itemValues.newCost || 0) * Number(itemValues.qty || 0);
  }, [itemValues.newCost, itemValues.qty]);

  // ดึงราคาทุน (ล่าสุด/เฉลี่ย) ตามโหมดที่ตั้งค่า เมื่อเลือกสินค้า
  useEffect(() => {
    const code = selectedProduct?.code;
    if (!code) {
      setCostSummary({ latestCost: null, averageCost: null });
      return;
    }
    let active = true;
    const companyS = localStorage.getItem("company_") || "";
    fetchCostPriceMode(companyS).then((mode) => { if (active) setCostPriceMode(mode); });
    axios.get(`/api/${apidataitem}?company=${encodeURIComponent(companyS)}&itemcode=${encodeURIComponent(code)}&fields=cost-summary`)
      .then((res) => {
        if (!active) return;
        const latest = res.data?.latestCost;
        const avg = res.data?.averageCost;
        setCostSummary({
          latestCost: latest === null || latest === undefined ? null : Number(latest),
          averageCost: avg === null || avg === undefined ? null : Number(avg),
        });
      })
      .catch(() => { if (active) setCostSummary({ latestCost: null, averageCost: null }); });
    return () => { active = false; };
  }, [selectedProduct?.code]);

  const displayRefCost = pickCostByMode(costPriceMode, costSummary.latestCost, costSummary.averageCost, Number(selectedProduct?.CostActual || 0));

  // เทียบที่หน่วยย่อยเสมอ — ราคาขายเป็นราคาต่อหน่วยย่อย
  // (ถ้าเทียบทุนต่อกล่องกับราคาขายต่อขวด %กำไรจะติดลบทุกครั้งที่รับเป็นกล่อง)
  const baseNewCost = toBaseCost(itemValues.newCost, unitFactor);
  const previewBaseQty = roundUnit((Number(itemValues.qty) || 0) * unitFactor);

  const profitPercent = useMemo(() => {
    const price = Number(selectedProduct?.price || 0);
    if (price > 0 && baseNewCost > 0) {
      return (((price - baseNewCost) / price) * 100).toFixed(1);
    }
    return null;
  }, [selectedProduct, baseNewCost]);

  if (isFetching) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div className="loading-spinner" style={{ margin: '0 auto', width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <div style={{ marginTop: 12, color: '#6b7280', fontSize: 14 }}>กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: bodyStyles }} />

      {/* RC Detail Header */}
      {rcData && (
        <div className="detail-header-card">
          <div className="detail-header-row">
            <div className="detail-code">RC{rcData.orderfull}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>#{rcData.code}</div>
          </div>
          <div className="detail-supplier">{rcData.names}</div>
          <div className="detail-meta-grid">
            <div className="detail-meta-item">
              <span>INV:</span>
              <span className="detail-meta-value">{rcData.invoice_No || '-'}</span>
            </div>
            <div className="detail-meta-item">
              <span>ผู้รับ:</span>
              <span className="detail-meta-value">{rcData.persons || '-'}</span>
            </div>
            <div className="detail-meta-item">
              <span>วันสั่ง:</span>
              <span className="detail-meta-value">
                {rcData.order_date ? new Date(rcData.order_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '-'}
              </span>
            </div>
            <div className="detail-meta-item">
              <span>วันรับ:</span>
              <span className="detail-meta-value">
                {rcData.receive_date ? new Date(rcData.receive_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '-'}
              </span>
            </div>
          </div>
          <div className="detail-total-bar" style={{ flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>ยอดท้ายบิล ({dataItem.length} รายการ)</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                ฿{totalCost.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Vat</span>
              {editingVat ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="number"
                    autoFocus
                    value={vatValue}
                    onChange={(e) => setVatValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveVatDiscount('vat'); }}
                    style={{ width: 80, textAlign: 'right', border: '2px solid #6366f1', borderRadius: 8, padding: '4px 8px', fontFamily: 'Kanit', fontSize: 13, fontWeight: 600, outline: 'none' }}
                  />
                  <button onClick={() => handleSaveVatDiscount('vat')} style={{ background: '#2A6AAA', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontFamily: 'Kanit', fontWeight: 600, cursor: 'pointer' }}>✓</button>
                  <button onClick={() => setEditingVat(false)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>✕</button>
                </div>
              ) : (
                <span
                  onClick={() => { setEditingVat(true); setVatValue(String(rcData.vatRC || 0)); }}
                  style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', cursor: 'pointer', borderBottom: '1px dashed #94a3b8', paddingBottom: 1 }}
                >
                  ฿{Number(rcData.vatRC || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>ลดท้ายบิล</span>
              {editingDiscount ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="number"
                    autoFocus
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveVatDiscount('discount'); }}
                    style={{ width: 80, textAlign: 'right', border: '2px solid #f59e0b', borderRadius: 8, padding: '4px 8px', fontFamily: 'Kanit', fontSize: 13, fontWeight: 600, outline: 'none' }}
                  />
                  <button onClick={() => handleSaveVatDiscount('discount')} style={{ background: '#2A6AAA', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontFamily: 'Kanit', fontWeight: 600, cursor: 'pointer' }}>✓</button>
                  <button onClick={() => setEditingDiscount(false)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>✕</button>
                </div>
              ) : (
                <span
                  onClick={() => { setEditingDiscount(true); setDiscountValue(String(rcData.discountRC || 0)); }}
                  style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', cursor: 'pointer', borderBottom: '1px dashed #94a3b8', paddingBottom: 1 }}
                >
                  ฿{Number(rcData.discountRC || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderTop: '1px solid #c7d2fe', paddingTop: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4f46e5' }}>รวมยอดสุทธิ</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#4f46e5' }}>
                ฿{Number(rcData.totalRCAll || totalCost).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Section */}
      <div className="add-item-card">
        <div className="add-item-header" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={18} />
          เพิ่มสินค้า
          {showAddForm ? <ChevronUp size={16} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={16} style={{ marginLeft: 'auto' }} />}
        </div>

        {showAddForm && (
          <div className="add-item-body">
            {/* Barcode Input */}
            <div className="barcode-input-row">
              <input
                ref={barcodeRef}
                type="text"
                className="barcode-input"
                placeholder="สแกนหรือพิมพ์ Barcode..."
                value={barcodeValue}
                onChange={(e) => setBarcodeValue(e.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                autoFocus
              />
            </div>

            {/* Product Info */}
            {selectedProduct && (
              <>
                <div className="add-item-product">
                  {selectedProduct.code} {selectedProduct.ProductName}
                </div>
                <div className="add-item-balance">
                  <span>คงเหลือ: <strong>{balance}</strong> {selectedProduct.Unit || ''}</span>
                  {selectedProduct.type && (
                    <span className="profit-tag negative">{selectedProduct.type}</span>
                  )}
                  {selectedProduct.subtype && (
                    <span className="profit-tag positive">{selectedProduct.subtype}</span>
                  )}
                </div>

                {/* หน่วยรับ — มีให้เลือกเฉพาะสินค้าที่ตั้งหน่วยขาย (กล่อง/ลัง) ไว้ */}
                {unitOptions.length > 1 && (
                  <>
                    <div className="add-field-label" style={{ marginBottom: 6 }}>หน่วยรับ</div>
                    <div className="unit-chip-row">
                      {unitOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          className={`unit-chip${option.key === selectedUnit.key ? ' active' : ''}`}
                          onClick={() => handleUnitChange(option.key)}
                        >
                          {unitOptionLabel(option)}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Cost info */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 13, color: '#64748b' }}>
                  <span>{costPriceModeLabel(costPriceMode)}: <strong style={{ color: '#2A6AAA' }}>฿{displayRefCost.toLocaleString()}</strong></span>
                  <span>ราคาขาย: <strong style={{ color: '#2A6AAA' }}>฿{Number(selectedProduct.price || 0).toLocaleString()}</strong>{selectedProduct.Unit ? <span style={{ color: '#64748b', fontWeight: 400, marginLeft: 3 }}>/{selectedProduct.Unit}</span> : ''}</span>
                </div>

                {/* Input Fields */}
                <div className="add-item-grid">
                  <div className="add-field">
                    <div className="add-field-label">
                      ราคาทุนใหม่{isPackUnit ? `/${selectedUnit.label}` : ''}
                      {profitPercent && (
                        <span className={`profit-tag ${Number(profitPercent) >= 0 ? 'positive' : 'negative'}`} style={{ marginLeft: 6 }}>
                          %กำไร {profitPercent}%
                        </span>
                      )}
                    </div>
                    <input
                      ref={newCostRef}
                      name="newCost"
                      type="number"
                      className="add-field-input"
                      placeholder="0"
                      value={itemValues.newCost}
                      onChange={handleInputChange}
                      onFocus={handleFocus}
                      onKeyDown={(e) => handleFieldKeyDown(e, qtyRef)}
                    />
                    {isPackUnit && Number(itemValues.newCost) > 0 && (
                      <div className="converted-hint">= {baseNewCost.toFixed(2)} /{selectedUnit.baseUnit}</div>
                    )}
                  </div>
                  <div className="add-field">
                    <div className="add-field-label">จำนวนรับ</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        ref={qtyRef}
                        name="qty"
                        type="number"
                        className="add-field-input"
                        placeholder="0"
                        value={itemValues.qty}
                        onChange={handleInputChange}
                        onFocus={handleFocus}
                        onKeyDown={(e) => handleFieldKeyDown(e, lotRef)}
                        style={{ flex: 1, width: 0 }}
                      />
                      {(selectedUnit.label || selectedProduct.Unit) && (
                        <span style={{ fontFamily: 'Kanit', fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>{selectedUnit.label || selectedProduct.Unit}</span>
                      )}
                    </div>
                    {isPackUnit && previewBaseQty > 0 && (
                      <div className="converted-hint">= {previewBaseQty} {selectedUnit.baseUnit}</div>
                    )}
                  </div>
                  <div className="add-field">
                    <div className="add-field-label">Lot</div>
                    <input
                      ref={lotRef}
                      name="lot"
                      type="text"
                      className="add-field-input"
                      placeholder="-"
                      value={itemValues.lot}
                      onChange={handleInputChange}
                      onKeyDown={(e) => handleFieldKeyDown(e, dateExpRef)}
                    />
                  </div>
                  <div className="add-field">
                    <div className="add-field-label">หมดอายุ</div>
                    <input
                      ref={dateExpRef}
                      name="dateExp"
                      type="date"
                      className="add-field-input"
                      value={itemValues.dateExp}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Total */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginTop: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 10
                }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>ทุนรวม:</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#4f46e5' }}>
                    ฿{totalComputedCost.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </span>
                </div>

                {/* Buttons */}
                <div className="add-btns">
                  <button
                    className="add-btn-save"
                    onClick={handleSaveItem}
                    disabled={saveLoading}
                  >
                    {saveLoading ? (
                      <><RotateCcw size={16} style={{ animation: 'spin 1s linear infinite' }} /> บันทึก...</>
                    ) : (
                      <><Check size={16} /> บันทึก</>
                    )}
                  </button>
                  <button className="add-btn-clear" onClick={clearForm}>ล้าง</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Item List */}
      <div className="item-list-card">
        <div className="item-list-header">
          <div className="item-list-title">
            <Package size={16} color="#6366f1" />
            รายการสินค้า
          </div>
          <span className="item-list-count">{dataItem.length} รายการ</span>
        </div>

        {dataItem.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            ยังไม่มีรายการสินค้า
          </div>
        ) : (
          dataItem.sort((a: any, b: any) => Number(a.id) - Number(b.id)).map((item: any, idx: number) => (
            <div key={item.id} className="item-row">
              <div className="item-num">{idx + 1}</div>
              <div className="item-info">
                <div className="item-name">{item.itemName}</div>
                <div className="item-sub">
                  <span>{item.itemcode}</span>
                  {/* รับมาเป็นหน่วยขาย (กล่อง/ลัง) — จำนวนที่เข้าสต็อกจริงอยู่ทางขวา */}
                  {Number(item.saleFactor) > 1 && item.saleQty != null && (
                    <span className="item-pack-badge">
                      📦 {roundUnit(Number(item.saleQty))} {item.saleUnit}
                    </span>
                  )}
                  {item.lot && <span>Lot: {item.lot}</span>}
                  {item.Barcode && <span>BC: {item.Barcode}</span>}
                </div>
              </div>
              <div className="item-qty-cost">
                <div className="item-qty">{item.qty} {item.unit}</div>
                <div className="item-cost">฿{Number(item.newCost || 0).toLocaleString()} × {item.qty}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>
                  ฿{Number(item.totalcost || 0).toLocaleString(undefined, { minimumFractionDigits: 1 })}
                </div>
              </div>
              <button className="item-delete-btn" onClick={() => handleDeleteItem(item.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default BodyRCList;
