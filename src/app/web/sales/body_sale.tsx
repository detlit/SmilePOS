
'use client'
import styles from "../componant/mystyle.module.css";
import React, { useEffect, useState, ChangeEvent, KeyboardEvent, use, useRef, useMemo } from 'react'

import Image from "next/image";
import axios from 'axios'
import {
  getPrinters as getPlatformPrinters,
  isSilentPrintAvailable,
  printSilent,
} from "@/lib/runtime/print";
import { setPayLock } from "@/lib/runtime/native";
import { cachedGet, invalidateCatalog } from '@/lib/catalogCache'
import { fetchBarcodeAliases, buildBarcodeIndex, normalizeBarcode, type AliasIndexRow } from '@/lib/barcodeAliasClient'
import { usePermission } from '@/utils/usePermission'
import { Table } from 'react-bootstrap';
import Toast from 'react-bootstrap/Toast';
import Alert from 'react-bootstrap/Alert';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
const widths = 70;
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  RadioGroup, Radio
} from "@heroui/react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { ifError } from "assert";
import { ta } from "date-fns/locale";
import Modal1 from 'react-bootstrap/Modal';
import Button1 from 'react-bootstrap/Button';
import Modal_rw from 'react-bootstrap/Modal';
import Button_rw from 'react-bootstrap/Button';
import Modal_dc from 'react-bootstrap/Modal';
import Button_dc from 'react-bootstrap/Button';
import Modal_rc from 'react-bootstrap/Modal';
import Button_rc from 'react-bootstrap/Button';
import Modal_fill from 'react-bootstrap/Modal';
import Button_full from 'react-bootstrap/Button';
import Modal_qa from 'react-bootstrap/Modal';
import QRCode from "react-qr-code";

import SpinnerIcon from '../componant/spinnerIcon';
import LoadingOverlay from '../componant/LoadingOverlay';

import DatePicker from "react-datepicker";
import { Toaster, toast } from "sonner"
import { logAction } from "@/lib/logbook"
import "react-datepicker/dist/react-datepicker.css";

// Tittle
const getsalehistory = "salehistory"

const apis = "receive"
const apidatalist = "datalist"
const apidataitemlist = "dataitemlist"
const apicustomer = "customer"
const apibalance = "sale_cal/sale_balance"

// Label
const apiindicatorlist = "label/indicatorlist"
const apitimes = "label/times"
const apitimeL = "label/timeL"
const apiuseL = "label/useL"
const apitimeuseL = "label/timeuseL"
const apikeepL = "label/keepL"
const apiRemarkL = "label/remarkL"

// Setting
const getemployee = "setting/employee"
const getpoint = "setting/point"
const getlabel = "setting/label"
const getstore = "setting/store/store"
const getpayment = "setting/payment"

const apipromotion = "promotion"

const apilabeldata = "label/labeldata"
const apilabeldata_all = "label/labeldata_all"

const apiquatation = "quatation"

const getdrugg = "drugallergy"

const getInteraction = "interaction"

const apigiftlist = "gift/giftlist"

import deletes from "../../icon/cancel.jpg"
import LabelPage from "../dataproduct/label/page";
import { useReactToPrint } from "react-to-print";
import ReactDOMServer from 'react-dom/server';
import { createPortal } from 'react-dom';

import { useMessageStore } from "./useMessageStore";
import { normalizePriceTier, PRICE_TIER_VALUES, type PriceTier } from "./priceTier";
import { productPriceByTier, unitConversionPriceByTier } from "./salePricing";
import ProductCatalogPanel from "./ProductCatalogPanel";
import {
  isPromoActiveNow,
  promoMatchesTier,
  promoConditionText,
  promoRewardText,
  calcPromoDiscountPerUnit,
  calcPromoFreeEntitled,
} from "../promotion/productPromoUtils";
import { SellerCommunicationModal } from "./SellerCommunicationModal";
import PediatricWeightModal from "./PediatricWeightModal";
import LabelHelperModal from "./LabelHelperModal";
import HoldBillTabs from "./HoldBillTabs";
import { useHoldBillStore } from "./useHoldBillStore";
import CustomerRegisterModal from "./CustomerRegisterModal";
import SaleQueuePanel from "./SaleQueuePanel";
import CustomerCommand from "./CustomerCommand";
import TableLayoutModal from "./TableLayoutModal";
import { useSaleQueueStore } from "./useSaleQueueStore";
import { queueDateOf } from "@/lib/saleQueue";
import { buildJobTicketHtml, buildQueueBadgeHtml } from "./queuePrint";
import {
  SHOW_CUSTOMER_CONGENITAL,
  SHOW_CUSTOMER_SIDE_CARD,
  SHOW_DRUG_ALERT_COLUMNS,
  SHOW_LABEL_COLUMN,
  SHOW_LABEL_PRINT_BUTTON,
  SHOW_PRODUCT_FIXNAME,
  SHOW_PRODUCT_INDICATION,
  SHOW_PRODUCT_SIDE_CARD,
} from "./salesUiFlags";
import { AlertTriangle, BadgePercent, Banknote, ChevronLeft, ChevronRight, CircleCheck, Coins, CreditCard, Eye, EyeOff, Gift, Grid3X3, HeartPulse, ImageIcon, Info, Lock, Package, PauseCircle, Pill, Printer, ReceiptText, RotateCcw, Search, Trash2, UserPlus, UserRound, Wallet } from "lucide-react";
import { DEFAULT_EXPIRY_COLOR_RULES, colorWithAlpha, formatExpiryDaysLabel, getExpiryDaysLeft, getExpiryRuleForDate, getReadableTintTextColor, normalizeExpiryColorRules, type ExpiryColorRule } from "@/lib/expiryColorRules";
import { normalizeCostPriceMode, getCachedCostPriceMode, costPriceModeLabel, type CostPriceMode } from "@/lib/costPriceMode";
import { lotUnitCost } from "@/lib/lotCost";
import { getThermalReceiptHorizontalOffset, getThermalReceiptPaperWidth, getThermalReceiptPrintStyles, printThermalReceiptInBrowser } from "@/utils/receiptPrintStyles";
import { QRCodeCanvas } from "qrcode.react";
import JsBarcode from "jsbarcode";

/** บาร์โค้ดสำหรับฉลากตัวช่วย (CODE128) */
function HelperBarcodeCanvas({ value, height }: { value: string; height: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current && value) {
      try {
        JsBarcode(ref.current, value, { format: 'CODE128', width: 1.1, height, displayValue: true, fontSize: 9, font: 'Kanit', margin: 0, textMargin: 1 });
      } catch (e) { /* invalid barcode */ }
    }
  }, [value, height]);
  return <canvas ref={ref} style={{ maxWidth: '100%' }} />;
}


/** Toast: แสดงข้อมูลสินค้าที่เพิ่ม + แก้ไขจำนวน + กด Enter เพื่อยืนยัน */
function ProductAddedToastContent({
  productName,
  productCode,
  unit,
  price,
  initialQty,
  onSubmit,
  onClose,
}: {
  productName: string;
  productCode: string;
  unit: string;
  price: number;
  initialQty: number;
  onSubmit: (qty: number) => void;
  onClose: () => void;
}) {
  const [qtyStr, setQtyStr] = useState(String(initialQty || 1));
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const t = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 30);
    return () => clearTimeout(t);
  }, []);

  const submit = () => {
    const n = Number(qtyStr);
    if (isNaN(n) || n <= 0) return;
    onSubmit(n);
  };

  const total = (Number(qtyStr) || 0) * price;

  return (
    <div
      style={{
        width: 360,
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 12px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.08)",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        fontFamily: "Kanit",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)",
          padding: "10px 14px",
          borderBottom: "1px solid #CCDFF1",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span style={{ fontFamily: "Kanit_B", fontSize: 13, color: "#173F6B" }}>
          ✅ เพิ่มสินค้าลงรายการขายแล้ว
        </span>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#173F6B",
            fontSize: 16,
            cursor: "pointer",
            lineHeight: 1,
          }}
          aria-label="close"
        >
          ✕
        </button>
      </div>

      <div style={{ padding: "12px 14px" }}>
        <div
          style={{
            fontFamily: "Kanit_B",
            fontSize: 14,
            color: "#0f172a",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: 4,
          }}
          title={productName}
        >
          {productName}
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>
          รหัส: <span style={{ color: "#334155" }}>{productCode}</span>
          {unit ? (
            <>
              <span style={{ margin: "0 6px", color: "#cbd5e1" }}>|</span>
              หน่วย: <span style={{ color: "#334155" }}>{unit}</span>
            </>
          ) : null}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            alignItems: "stretch",
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>จำนวน</div>
            <input
              ref={inputRef}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={qtyStr}
              onChange={(e) => setQtyStr(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  submit();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  onClose();
                }
              }}
              style={{
                width: "100%",
                fontFamily: "Kanit_B",
                fontSize: 18,
                color: "#0f172a",
                textAlign: "center",
                padding: "8px 10px",
                borderRadius: 10,
                border: "2px solid #2A6AAA",
                outline: "none",
                background: "#fff",
              }}
            />
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
              border: "1px solid #fecaca",
              borderRadius: 10,
              padding: "6px 10px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-end",
            }}
          >
            <div style={{ fontSize: 10, color: "#991b1b" }}>ยอดรวม</div>
            <div
              style={{
                fontFamily: "Kanit_B",
                fontSize: 18,
                color: "#b91c1c",
                lineHeight: 1.1,
              }}
            >
              {total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span style={{ fontSize: 10, marginLeft: 3 }}>฿</span>
            </div>
            <div style={{ fontSize: 10, color: "#64748b" }}>
              ราคา/หน่วย: {price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 10, color: "#94a3b8" }}>กด Enter เพื่อยืนยันจำนวน</span>
          <button
            onClick={submit}
            style={{
              fontFamily: "Kanit_B",
              fontSize: 13,
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #2A6AAA 0%, #1E5088 100%)",
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(42, 106, 170,0.35)",
            }}
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
}


// B3 (การมองเห็น/หน้าขาย): อนุญาตให้ขายสินค้าราคา 0 บาทหรือไม่
// อ่านจากสวิตช์ Level1 (ช่อง Level2 ในหน้าตั้งค่าถูกล็อก ใช้สวิตช์เดียวคุมทุก level)
// เปิด (true) = ขายราคา 0 ได้ | ปิด (false)/ไม่มีข้อมูล = ขายไม่ได้ | ค่าเริ่มต้น = false
const isZeroPriceSaleAllowed = (): boolean => {
  if (typeof window === "undefined") return false;
  let levelRows: any[] = [];
  try { levelRows = JSON.parse(localStorage.getItem("level_data") || "[]"); } catch { levelRows = []; }
  const b3 = levelRows.find((a: any) => a.codename === "B3");
  return b3 ? b3.level1 === true : false;
};

// B4 (หน้าขาย): ล็อกปุ่ม "กลับ" ในหน้าชำระเงิน — บังคับให้กดชำระอย่างเดียว (กันทุจริต)
// true = ล็อก (กดกลับไม่ได้) | false/ไม่มีข้อมูล = ปกติ | ค่าเริ่มต้น = false
// เคารพสิทธิ์รายบุคคล (emp_permissions) ก่อน แล้วค่อย fallback สิทธิ์ตาม level
// หมายเหตุ: เป็นแฟล็ก "ข้อจำกัด" จึงไม่ใช้ hasPermission() (ที่ให้ owner=true และ default=true) เพราะความหมายกลับกัน
const isPayBackLocked = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const emp = JSON.parse(localStorage.getItem("emp_permissions") || "[]");
    const override = emp.find((p: any) => p.codename === "B4");
    if (override) return override.allowed === true;
    const levelRows = JSON.parse(localStorage.getItem("level_data") || "[]");
    const b4 = levelRows.find((a: any) => a.codename === "B4");
    if (!b4) return false;
    const userLevel = localStorage.getItem("level_") || "";
    if (userLevel === "level1") return b4.level1 === true;
    if (userLevel === "level3") return b4.level3 === true;
    if (userLevel === "level2") return b4.level2 === true;
    return false;
  } catch { return false; }
};

// B5 (หน้าขาย): ปรับ "ระดับราคา" ของสินค้าแต่ละรายการในบิลได้เอง
// true = เลือกปรับได้ | false/ไม่มีข้อมูล = เลือกปรับไม่ได้ | ค่าเริ่มต้น = false
// เคารพสิทธิ์รายบุคคล (emp_permissions) ก่อน แล้วค่อย fallback สิทธิ์ตาม level
// เป็นแฟล็ก "อนุญาต" ที่ต้องเปิดเอง จึงไม่ใช้ hasPermission() (ที่ให้ owner=true และ default=true)
const isItemPriceTierEditable = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const emp = JSON.parse(localStorage.getItem("emp_permissions") || "[]");
    const override = emp.find((p: any) => p.codename === "B5");
    if (override) return override.allowed === true;
    const levelRows = JSON.parse(localStorage.getItem("level_data") || "[]");
    const b5 = levelRows.find((a: any) => a.codename === "B5");
    if (!b5) return false;
    const userLevel = localStorage.getItem("level_") || "";
    if (userLevel === "level1") return b5.level1 === true;
    if (userLevel === "level3") return b5.level3 === true;
    if (userLevel === "level2") return b5.level2 === true;
    return false;
  } catch { return false; }
};

// การถูกยกเลิก request (unmount/HMR/นำทางออก/รีเฟรช) ไม่ใช่ error จริง
// ใช้กรองใน catch เพื่อไม่ให้ dev overlay เด้ง "Request aborted"
const isAbortError = (e: any): boolean =>
  (typeof axios.isCancel === "function" && axios.isCancel(e)) ||
  e?.code === "ERR_CANCELED" ||
  e?.code === "ECONNABORTED" ||
  e?.name === "CanceledError" ||
  e?.name === "AbortError" ||
  /aborted|canceled|cancelled/i.test(e?.message || "");

/*********************************************** */
function BodyTabSale(idDatalist: any) {



  //  const idsale=useMessageStore((state) => state.idsale)
  const idF = Number(idDatalist.data1)
  // จำนวนครั้งที่กดเลือกสินค้าจากช่องค้นหา (nonce จาก body_pro_cus) — ทำให้ effect
  // เพิ่มสินค้าทำงานทุกครั้งที่เลือก แม้เลือกสินค้าเดิมซ้ำซึ่ง idF ไม่เปลี่ยนค่า
  const selectCount = Number(idDatalist.data2 || 0)
  //console.log(idF)






  //ส่งค่ากลับ
  const setMessage = useMessageStore((state) => state.setMessage);
  const setsavehis = useMessageStore((state) => state.setsavehis);
  const savehis = useMessageStore((state) => state.savehis)

  //รับค่า
  const savemu = useMessageStore((state) => state.savemu)
  const compactCartView = useMessageStore((state) => state.compactCartView)
  // โหมดร้านอาหาร/คาเฟ่ — ใบสั่งซื้อทางซ้าย + หมวดสินค้า/กริดสินค้าตรงกลาง
  const posGridMode = useMessageStore((state) => state.posGridMode)
  const scannedBarcode = useMessageStore((state) => state.scannedBarcode)
  const scanCount = useMessageStore((state) => state.scanCount)
  // ใช้ตอนแตะการ์ดสินค้าในกริด — ส่งเข้าเส้นทางเดียวกับการสแกนบาร์โค้ด
  const setScannedBarcode = useMessageStore((state) => state.setScannedBarcode)
  const paystore = normalizePriceTier(useMessageStore((state) => state.payw))
  const setpayw = useMessageStore((state) => state.setpayw)
  const setSaleProducts = useMessageStore((state) => state.setSaleProducts)
  const selectedDrugSet = useMessageStore((state) => state.selectedDrugSet)
  const drugSetSelectionCount = useMessageStore((state) => state.drugSetSelectionCount)

  // ลูกค้าของบิล: ที่นี่คือเจ้าของ state จริง — ส่งสรุปขึ้นไปให้แถบเครื่องมือหน้าขายแสดง
  // แล้วรับคำสั่งกลับมาทาง request counter (ค้นหา / สมัครสมาชิก / ล้าง / ติดตามอาการ)
  const setSaleCustomer = useMessageStore((state) => state.setSaleCustomer)
  const customerSearchRequest = useMessageStore((state) => state.customerSearchRequest)
  const customerRegisterRequest = useMessageStore((state) => state.customerRegisterRequest)
  const customerClearRequest = useMessageStore((state) => state.customerClearRequest)
  const customerFollowUpRequest = useMessageStore((state) => state.customerFollowUpRequest)

  // Hold Bill Store
  const holdBillStore = useHoldBillStore();

  // Table Layout Modal (โหมดร้านอาหาร)
  const [showTableLayout, setShowTableLayout] = useState(false);

  // Focus Refs for Sales Process
  const receiveInputRef = useRef<HTMLInputElement>(null);
  const confirmPaymentRef = useRef<HTMLButtonElement>(null);

  // เลขออเดอร์ของบิลปัจจุบัน (ใช้แสดงใน preview และพิมพ์บนใบเสร็จ)
  const lastOrderNoRef = useRef<string>("");
  const [lastOrderNo, setLastOrderNo] = useState<string>("");

  // เลขคิวของบิลที่เพิ่งชำระ — ออกจากเซิร์ฟเวอร์ตอนบันทึกบิลสำเร็จ แล้วเอาไปพิมพ์ทั้งบนใบเสร็จและใบ job
  // เก็บเป็น ref เพราะเส้นทางพิมพ์อยู่ใน <Afterpay /> ที่ remount ทุกครั้งที่ parent re-render
  const lastQueueNoRef = useRef<number | null>(null);
  const setLastIssuedQueueNo = useSaleQueueStore((state) => state.setLastIssuedQueueNo);

  // กันบิลซ้ำ: lock/loading ของปุ่มชำระสินค้าต้องอยู่ระดับ parent
  // เพราะ Afterpay เป็น nested component ที่ remount ทุกครั้งที่ parent re-render
  // ถ้าเก็บไว้ใน Afterpay ค่าจะถูกรีเซ็ตระหว่างบันทึก ทำให้กดชำระซ้ำแล้วบิลเบิ้ลได้
  const paySubmitLockRef = useRef(false);
  const [payLoading, setPayLoading] = useState(false);

  // โหมดร้านอาหาร: ปุ่มพักบิล/ยกเลิก/ชำระเงิน ถูกย้ายไปไว้ใต้ใบสั่งซื้อ (คอลัมน์ซ้าย)
  // เก็บ element ไว้ที่ระดับ parent เพราะ Beforepay remount ทุกครั้งที่ parent re-render
  const [posActionDockEl, setPosActionDockEl] = useState<HTMLDivElement | null>(null);
  // สร้างเลขออเดอร์รูปแบบ DDMM-HHmmss (เช่น 1903-124305)
  const makeOrderNo = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(now.getDate())}${pad(now.getMonth() + 1)}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  };
  const setCurrentOrderNo = (value: string) => {
    lastOrderNoRef.current = value;
    setLastOrderNo(value);
  };

  const [dataProduct, setdataProduct] = useState<any[]>([])
  const [unitConversionData, setUnitConversionData] = useState<any[]>([])
  // บาร์โค้ดสำรอง (สินค้าตัวเดียว หน่วยเดียว แต่มีหลายบาร์โค้ด) — โหลดมาเป็น
  // ดัชนีเบา ๆ [{b: บาร์โค้ด, c: รหัสสินค้า}] แล้วผสมเข้ากับ map เดิมตอนสแกน
  const [barcodeAliases, setBarcodeAliases] = useState<AliasIndexRow[]>([])
  const [dataRCFull, setdataItemRCFull] = useState<any[]>([])
  const [dateitemRC, setdateitemRC] = useState<any[]>([])

  const initialValues7 = {
    id: "",
    company: "",
    code: "",
    indicatorlistS: "",
    timeS: "",
    useS: "",
    timeuseS: "",
    keepS: "",
    remarkS: "",
  };

  const [alllabel, setlabel] = useState([])
  const [alllabelitem, setlabelitem] = useState(initialValues7)
  /**Todat List */
  const [list, setList] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("listS");
      try {
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error("Failed to parse listS from localStorage", e);
        return [];
      }
    }
    return [];
  });

  // สร้างเลขออเดอร์ทันทีที่มีสินค้าในตะกร้า เพื่อให้แสดงใน preview และตรงกับบิลที่บันทึก
  // และล้างเมื่อตะกร้าว่าง (เช่น หลังชำระเงิน / เริ่มบิลใหม่)
  useEffect(() => {
    if (list.length > 0) {
      if (!lastOrderNoRef.current) setCurrentOrderNo(makeOrderNo());
    } else if (lastOrderNoRef.current) {
      setCurrentOrderNo("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);

  const [list_rc, setList_rc] = useState<Task_rc[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("list_rcS");
      try {
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error("Failed to parse list_rcS from localStorage", e);
        return [];
      }
    }
    return [];
  });

  const [brokenProductImages, setBrokenProductImages] = useState<Set<string>>(() => new Set());
  const normalizeProductImageUrl = React.useCallback((value: unknown) => {
    const imageUrl = String(value ?? "").trim();
    if (!imageUrl || imageUrl === "null" || imageUrl === "undefined") return "";
    return imageUrl;
  }, []);
  const markProductImageBroken = React.useCallback((imageUrl: string) => {
    if (!imageUrl) return;
    setBrokenProductImages((prev) => {
      if (prev.has(imageUrl)) return prev;
      const next = new Set(prev);
      next.add(imageUrl);
      return next;
    });
  }, []);
  const getRenderableProductImage = React.useCallback((value: unknown) => {
    const imageUrl = normalizeProductImageUrl(value);
    return imageUrl && !brokenProductImages.has(imageUrl) ? imageUrl : "";
  }, [brokenProductImages, normalizeProductImageUrl]);

  // Translation
  const [indi, setindi] = useState([])
  const [timeL, settimeL] = useState([])
  const [useL, setuseL] = useState([])
  const [timeuseL, settimeuseL] = useState([])
  const [keepL, setkeepL] = useState([])
  const [RemarkL, setRemarkL] = useState([])

  // Pediatric Liquid Dose Modal (shared via zustand store)
  const showPediatricModal = useMessageStore((state) => state.showPediatricModal)
  const setShowPediatricModal = useMessageStore((state) => state.setShowPediatricModal)
  const globalChildWeight = useMessageStore((state) => state.globalChildWeight)
  const setGlobalChildWeight = useMessageStore((state) => state.setGlobalChildWeight)
  const [pendingPediatricItem, setPendingPediatricItem] = useState<any>(null)

  // Setting Employee
  const [postsEmp, setPostsEmp] = useState([])

  // เปลี่ยนผู้ขาย (level2 only)
  const [changeSeller, setChangeSeller] = useState(() => typeof window !== 'undefined' ? localStorage.getItem("changeSeller") === "true" : false);
  const [selectedSeller, setSelectedSeller] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem("selectedSeller") || "") : "");

  // ซ่อน/แสดงคอลัมน์รายการสินค้าฝั่งซ้าย เฉพาะหน้าชำระเงิน (สไลด์เก็บได้ + จำสถานะใน localStorage)
  const [cartHidden, setCartHidden] = useState(() => typeof window !== 'undefined' ? localStorage.getItem("cartHidden_sale") === "1" : false);
  const toggleCartHidden = () => setCartHidden(prev => {
    const next = !prev;
    if (typeof window !== 'undefined') localStorage.setItem("cartHidden_sale", next ? "1" : "0");
    return next;
  });
  const getActiveSeller = () => changeSeller && selectedSeller ? selectedSeller : String(localStorage.getItem("person_") || "");

  // Setting Interaction
  const [interaction, setInertaction] = useState([])

  // Setting Label
  /***************************************************** */
  const [idS, SetId] = useState("")
  const [compa, Setcompany] = useState("")
  const [storeS, SetStore] = useState("")
  const [addressS, SetAddress] = useState("")
  const [telS, SetTel] = useState("")
  const [taxS, SetTax] = useState("")
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedUrl1, setUploadedUrl1] = useState<string | null>(null);
  const [vatEnabledS, setVatEnabledS] = useState("false")
  const [branchNameS, setBranchNameS] = useState("")
  const [blockNegativeStockSale, setBlockNegativeStockSale] = useState(false)
  const [costPriceMode, setCostPriceMode] = useState<CostPriceMode>(getCachedCostPriceMode())
  const [expiryColorRules, setExpiryColorRules] = useState<ExpiryColorRule[]>(DEFAULT_EXPIRY_COLOR_RULES)
  const [taxInvoiceNoS, setTaxInvoiceNoS] = useState("")
  const [allS, Setall] = useState(false)
  const [logoS, Setlogo] = useState(true);
  const [lineS, Setline] = useState(true)

  // Setting Reward
  const [SaleS, SetSaleInput] = useState("")
  const [pointeqS, SetPoint] = useState("")
  const [pointsetS, SetPointSet] = useState("")
  const [discountS, SetDiscount] = useState("")
  const [statusS, SetStatus] = useState("")
  const [memberDiscountPercentS, SetMemberDiscountPercent] = useState(2)
  const [memberDiscountEnabledS, SetMemberDiscountEnabled] = useState(false)

  // ค่าหยิบ      
  const [giftlist, setgiftlist] = useState([])

  // Product Balance from stock-balance-summary API (keyed by product id เพื่อรองรับกรณีรหัสซ้ำ)
  const [productBalances, setProductBalances] = useState<Map<number, number>>(new Map());

  // Fetch balance for the selected product (ใช้สูตรคำนวณเดียวกับหน้าสรุปยอดคงเหลือ)
  useEffect(() => {
    const fetchBalance = async () => {
      if (typeof window === "undefined" || !idF) return;
      const companyS = localStorage.getItem("company_") || "";
      const product = dataProduct.find((p: any) => p.id === idF);
      const code = product?.code;
      if (!code) return;

      try {
        const resSummary = await axios.get(`/api/stock-balance-summary?itemcode=${code}&company=${companyS}&id=${idF}`);
        const calcBalance = resSummary.data?.calculatedBalance;
        setProductBalances(prev => {
          const newMap = new Map(prev);
          newMap.set(Number(idF), calcBalance !== undefined ? Number(calcBalance) : 0);
          return newMap;
        });
      } catch (error) {
        console.error(`Error fetching balance for ${code}:`, error);
      }
    };

    fetchBalance();
  }, [idF]);

  // Fetch balance for all items in cart (เพื่อให้ทุกรายการในตะกร้าแสดงคงเหลือถูกต้อง)
  useEffect(() => {
    const fetchAllBalances = async () => {
      if (typeof window === "undefined" || list.length === 0) return;
      const companyS = localStorage.getItem("company_") || "";
      const ids = [...new Set(list.map((item: any) => Number(item.id_product)).filter(Boolean))];
      const idsToFetch = ids.filter(id => !productBalances.has(id));
      if (idsToFetch.length === 0) return;

      const newMap = new Map(productBalances);
      for (const id of idsToFetch) {
        const product = dataProduct.find((p: any) => p.id === id);
        const code = product?.code;
        if (!code) continue;
        try {
          const resSummary = await axios.get(`/api/stock-balance-summary?itemcode=${code}&company=${companyS}&id=${id}`);
          const calcBalance = resSummary.data?.calculatedBalance;
          newMap.set(Number(id), calcBalance !== undefined ? Number(calcBalance) : 0);
        } catch (error) {
          console.error(`Error fetching balance for id=${id}:`, error);
        }
      }
      setProductBalances(newMap);
    };

    fetchAllBalances();
  }, [list.length, dataProduct]);



  const [companyS, setcom] = useState("")
  const [paystorew, Setpaystore] = useState("")

  // Pharmacist Setting
  const modalPS = useDisclosure();
  const [selectedPS, setSelectedPS] = useState("");

  useEffect(() => {
    setSelectedPS(localStorage.getItem("ps") || "");
  }, []);

  useEffect(() => {


    if (typeof window !== 'undefined') {
      localStorage.setItem("countrow", "หน้าร้าน")
    }

    let companyS = "";
    if (typeof window !== 'undefined') {
      setcom(localStorage.getItem("company_") || "")

    }

    setTimeout(() => {
      Setpaystore(useMessageStore.getState().payw)
      //  Setpaystore(localStorage.getItem("countrow") || "")
    }, 300);



  }, [])
  const [promotionfullS, SetPromotionfull] = useState<PromotionS[]>([])
  // โปรโมชั่นระดับสินค้า (จากหน้า ตั้งค่าโปรโมชั่น ฝั่งขวา)
  const [productPromoS, SetProductPromo] = useState<any[]>([])

  interface PromotionS {
    id: number,
    name_promotion: string,
    customer: string,
    conditionid: number,
    condition: string,
    startdate: string,
    enddate: string,
    unit: string,
    pay_condition: number,
    discount: number,
    status: string,
    msg_condition: string,
    msg_discount: string,
    cal: number

  }
  // console.log([...promotionfullS])
  //*************************** */
  useEffect(() => {
    if (typeof window === "undefined") return;
    let companyS = localStorage.getItem("company_") || "";

    // Fetch all data in parallel: keep products available even if a secondary sale lookup fails.
    const fetchAll = async () => {
      try {
        const [productsRes, rcItemsRes, initRes, unitConvRes, aliasRes] = await Promise.allSettled([
          // Cached: the full product catalog (~5k rows) is otherwise refetched on
          // every visit to the sale page. Authoritative price/stock is still
          // re-fetched per product at checkout (see fetchUnitConversions).
          cachedGet(`/api/${apidatalist}?company=${companyS}&fields=sale`),
          axios.get(`/api/${apidataitemlist}?company=${String(companyS)}&fields=sale`),
          axios.get(`/api/sale_init?company=${companyS}`),
          axios.get(`/api/unitconversion?company=${companyS}`),
          // บาร์โค้ดสำรอง — payload เล็กมาก (แค่คู่ barcode/code) และมี cache ในตัว
          fetchBarcodeAliases(companyS)
        ])

        if (productsRes.status === "rejected") console.error("Failed to load sale products", productsRes.reason)
        if (rcItemsRes.status === "rejected") console.error("Failed to load sale RC items", rcItemsRes.reason)
        if (initRes.status === "rejected") console.error("Failed to load sale init data", initRes.reason)
        if (unitConvRes.status === "rejected") console.error("Failed to load unit conversions", unitConvRes.reason)

        const products = productsRes.status === "fulfilled" && Array.isArray(productsRes.value.data) ? productsRes.value.data : []
        const rcItems = rcItemsRes.status === "fulfilled" && Array.isArray(rcItemsRes.value.data) ? rcItemsRes.value.data : []
        const initData = initRes.status === "fulfilled" && initRes.value.data ? initRes.value.data : {}
        const unitConversions = unitConvRes.status === "fulfilled" && Array.isArray(unitConvRes.value.data) ? unitConvRes.value.data : []
        const aliasRows = aliasRes.status === "fulfilled" && Array.isArray(aliasRes.value) ? aliasRes.value : []
        const getInitList = (key: string): any => Array.isArray(initData[key]) ? initData[key] : []

        // Products & RC Items
        setdataProduct(products)
        setSaleProducts(products)
        setdataItemRCFull(rcItems)
        setUnitConversionData(unitConversions)
        setBarcodeAliases(aliasRows)

        // Combined init data
        //Label Data
        setlabel(getInitList("labeldata"))
        //Label Translator
        setindi(getInitList("indicator"))
        settimeL(getInitList("timeL"))
        setuseL(getInitList("useL"))
        settimeuseL(getInitList("timeuseL"))
        setkeepL(getInitList("keepL"))
        setRemarkL(getInitList("remarkL"))
        //Employee
        setPostsEmp(getInitList("employee"))
        //Interaction
        setInertaction(getInitList("interaction"))
        //ร้านค้า
        const s = getInitList("store")[0]
        if (s) {
          SetId(s.id); Setcompany(s.company); SetStore(s.namestore); SetAddress(s.address); SetTel(s.tel); SetTax(s.taxnumber); setUploadedUrl(s.publiclogo); setUploadedUrl1(s.publicline); setVatEnabledS(s.vatEnabled || "false"); setBranchNameS(s.branchName || "")
          setBlockNegativeStockSale(String(s.blockNegativeStockSale || "false") === "true")
          setCostPriceMode(normalizeCostPriceMode(s.costPriceMode))
          setExpiryColorRules(normalizeExpiryColorRules(s.expiryColorRules))
          if (s.vatEnabled === "true") {
            try { const invRes = await axios.get('/api/sale/next-tax-invoice'); setTaxInvoiceNoS(invRes.data.taxInvoiceNo) } catch (e) { console.error(e) }
          }
        }
        //ฉลากยา
        const sl = getInitList("settingLabel")[0]
        if (sl) { Setall(sl.all === "true"); Setlogo(sl.logo === "true"); Setline(sl.line === "true") }
        //แต้มสะสม
        const sp = getInitList("settingPoint")[0]
        if (sp) {
          SetSaleInput(sp.sale); SetPoint(sp.pointeq); SetPointSet(sp.pointset); SetDiscount(sp.discount); SetStatus(sp.status)
          SetMemberDiscountPercent(Number(sp.memberDiscountPercent ?? 2))
          SetMemberDiscountEnabled(sp.memberDiscountEnabled ?? false)
        }
        //โปรโมชั่น
        const promotion = getInitList("promotion")
        if (promotion[0]) SetPromotionfull(promotion)
        //โปรโมชั่นสินค้า
        SetProductPromo(getInitList("productPromotion"))
        //ค่าหยิบ
        setgiftlist(getInitList("giftlist"))
        //ลูกค้า
        setPosts(getInitList("customer"))

      } catch (error) {
        if (!isAbortError(error)) console.error(error)
        setdataProduct([])
        setSaleProducts([])
      }
    }
    fetchAll()

    localStorage.setItem("his", JSON.stringify([{
      followup: String(""),
      solution: String(""),
      id_history: "",
      count: String(""),
      statusH: "",
      duedate: new Date(),
      person: String(localStorage.getItem("person_") || "")
    }]))


    localStorage.setItem("dg", JSON.stringify([]))



  }, [])

  //*****Printer****************** */
  const [printers, setPrinters] = useState<any[]>([]);
  const [selectedPrinter_label, setSelectedPrinter_label] = useState<string>("");
  const [selectedPrinter_rc, setSelectedPrinter_rc] = useState<string>("");
  const [selectedPrinter_a4, setSelectedPrinter_a4] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedPrinter = localStorage.getItem("auto_printer_label");
    if (savedPrinter) {
      setSelectedPrinter_label(savedPrinter);

    }

    const savedPrinter_rc = localStorage.getItem("auto_printer_rc");
    if (savedPrinter_rc) {
      setSelectedPrinter_rc(savedPrinter_rc);

    }

    const savedPrinter_a4 = localStorage.getItem("auto_printer_a4");
    if (savedPrinter_a4) {
      setSelectedPrinter_a4(savedPrinter_a4);

    }

    getPlatformPrinters().then((printerList) => {
      setPrinters(printerList as any[]);
    });
  }, []);

  // Payment providers — hoisted to parent to avoid refetch on every re-render
  const [payProviders, setPayProviders] = useState<any[]>([])
  const isOtherPaymentProvider = (provider: any) => {
    const providerKey = String(provider?.provider || provider || "")
    return providerKey.startsWith("custom_") && !providerKey.startsWith("custom_transfer_")
  }

  const getPaymentProviderValue = (providers: any[], preferOther: boolean, currentProvider?: string) => {
    const providerOptions = providers.filter((provider: any) => preferOther ? isOtherPaymentProvider(provider) : !isOtherPaymentProvider(provider))
    if (currentProvider && providerOptions.some((provider: any) => provider.provider === currentProvider)) return currentProvider
    return providerOptions[0]?.provider || currentProvider || "promptpay"
  }

  const getPayLabel = (payValue: string) => payValue === "cash" ? "เงินสด" : payValue === "payment" ? "โอน" : payValue === "split" ? "เงินสด+โอน" : payValue === "other" ? "อื่นๆ" : ""

  useEffect(() => {
    const companyS = localStorage.getItem("company_") || ""
    axios.get(`/api/setting/payment-provider?company=${companyS}`)
      .then(res => {
        const enabled = res.data.filter((p: any) => p.enabled)
        const seen = new Set<string>()
        const deduped = enabled.filter((p: any) => {
          const key = String(p.provider || "")
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        setPayProviders(deduped)
      })
      .catch(err => console.error(err))
  }, []);



  //************************************************************** */

  //  const [dateRC, setdateRC] = useState([])
  // Function to delete item from list using id to delete
  const deleteItem = (id: any, unit?: any) => {
    // ลบเฉพาะแถวที่ตรงทั้ง id และหน่วย (สินค้าตัวเดียวกันคนละหน่วย = คนละแถว)
    const updatedList = list.filter((item) => !(item.id === id && (unit === undefined || item.unit === unit)));
    setList(updatedList);
  };
  const deleteall = () => {
    setList([]);
    setGlobalChildWeight(0);
  };

  // ========== HOLD BILL HANDLERS ==========
  const getCurrentBillData = () => ({
    list: list,
    list_rc: list_rc,
    customerCode: typeof window !== 'undefined' ? localStorage.getItem("code_costomer") || "" : "",
    customerName: typeof window !== 'undefined' ? localStorage.getItem("name_costomer") || "" : "",
    payw: paystore || "หน้าร้าน",
    total: list.reduce((acc, curr) => acc + curr.total, 0),
    itemCount: list.filter(item => item.qty > 0).length,
    childWeight: globalChildWeight,
  });

  const handleHoldCurrentBill = () => {
    if (list.length === 0) return;
    // Save current bill FIRST (so Zustand knows this slot is occupied)
    holdBillStore.saveBillToSlot(holdBillStore.activeIndex, getCurrentBillData());
    // Now find empty slot (current slot is no longer empty after save)
    const emptySlot = holdBillStore.findEmptySlot();
    if (emptySlot === -1) {
      toast.error("ค้างบิลได้สูงสุด 5 บิล");
      return;
    }
    const savedBillIndex = holdBillStore.activeIndex;
    // Switch to the empty slot
    holdBillStore.setActiveIndex(emptySlot);
    // Clear current cart for new bill
    setList([]);
    setList_rc([]);
    setGlobalChildWeight(0);
    localStorage.setItem("listS", "[]");
    localStorage.setItem("list_rcS", "[]");
    setCurrentOrderNo(""); // บิลใหม่ที่ว่าง — ล้างเลขออเดอร์ (จะสร้างใหม่เมื่อเพิ่มสินค้า)
    toast.success(`พักบิล ${savedBillIndex + 1} แล้ว → เปิดบิล ${emptySlot + 1}`);
  };

  const handleSwitchBill = (bill: any, targetIndex: number) => {
    // Save current bill to current active slot (if has items)
    if (list.length > 0) {
      holdBillStore.saveBillToSlot(holdBillStore.activeIndex, getCurrentBillData());
    } else {
      // Clear current slot if empty
      holdBillStore.clearSlot(holdBillStore.activeIndex);
    }
    // Load target bill data
    if (bill) {
      setList(bill.list || []);
      setList_rc(bill.list_rc || []);
      setGlobalChildWeight(bill.childWeight || 0);
      if (bill.payw) setpayw(bill.payw);
      localStorage.setItem("listS", JSON.stringify(bill.list || []));
      localStorage.setItem("list_rcS", JSON.stringify(bill.list_rc || []));
      // ออกเลขออเดอร์ใหม่ให้บิลที่สลับมา (แต่ละบิลมีเลขของตัวเอง)
      setCurrentOrderNo((bill.list || []).length > 0 ? makeOrderNo() : "");
    } else {
      setList([]);
      setList_rc([]);
      setGlobalChildWeight(0);
      localStorage.setItem("listS", "[]");
      localStorage.setItem("list_rcS", "[]");
      setCurrentOrderNo("");
    }
    holdBillStore.setActiveIndex(targetIndex);
  };

  const handleRemoveHeldBill = (index: number) => {
    if (!confirm(`ต้องการลบบิล ${index + 1} หรือไม่?`)) return;
    holdBillStore.clearSlot(index);
    toast.success(`ลบบิล ${index + 1} แล้ว`);
  };

  // Auto-save active bill to hold store when list changes (debounced with existing timer)

  if (typeof window !== 'undefined') {
    if ((window as any).__listSaveTimer) clearTimeout((window as any).__listSaveTimer);
    (window as any).__listSaveTimer = setTimeout(() => {
      localStorage.setItem("listS", JSON.stringify(list))
      localStorage.setItem("list_rcS", JSON.stringify(list_rc))
      // Auto-save to hold bill store (write localStorage directly to avoid re-render)
      if (list.length > 0) {
        try {
          const bills = JSON.parse(localStorage.getItem("holdBills") || "[null,null,null,null,null]");
          bills[holdBillStore.activeIndex] = {
            id: holdBillStore.activeIndex,
            list: list,
            list_rc: list_rc,
            customerCode: localStorage.getItem("code_costomer") || "",
            customerName: localStorage.getItem("name_costomer") || "",
            payw: paystore || "หน้าร้าน",
            total: list.reduce((acc, curr) => acc + curr.total, 0),
            itemCount: list.filter(item => item.qty > 0).length,
            childWeight: globalChildWeight,
            timestamp: Date.now(),
          };
          localStorage.setItem("holdBills", JSON.stringify(bills));
        } catch (e) {}
      }
    }, 300);
  }







  const [priceAct, setEditedpriceAct] = useState<string>("");
  const [priceDis, setEditedpriceDis] = useState<string>("");
  const [editedTaskText, setEditedTaskText] = useState<string>("");
  const [editedTaskText1, setEditedTaskText1] = useState<string>("");
  const [editedcode, setEditedcode] = useState<string>("");
  // หน่วยของแถวที่กำลังแก้ราคา/ส่วนลด เพื่อให้กระทบเฉพาะหน่วยนั้น (สินค้าตัวเดียวกันคนละหน่วย = คนละแถว)
  const [editedunit, setEditedunit] = useState<string>("");
  const [editedTaskname, setEditedname] = useState<string>("");
  const [costS, setcostS] = useState("")

  const [receivebaht, setreceivebaht] = useState<string>("");
  const [netbaht, setnetbaht] = useState<string>("");

  interface Task {

    id: number,
    company: string,
    id_product: number,
    code_product: string,
    name_product: string,
    fixname: string,
    cetagory: string,
    unit: string,
    barcode: string,
    qty: number,
    cost: Number,
    costtotal: Number,
    price: number,
    discount: number,
    gift: number,
    totalgift: number,
    diff: number,
    total: number,
    id_receive1: number,
    lot_receive1: string,
    qty_lot1: number,
    std_qty_lot1: number,
    sale_qty_lot1: number,
    id_receive2: number,
    lot_receive2: string,
    qty_lot2: number,
    std_qty_lot2: number,
    sale_qty_lot2: number,
    id_receive3: number,
    lot_receive3: string,
    qty_lot3: number,
    std_qty_lot3: number,
    sale_qty_lot3: number,
    person: string,
    statuss: string,
    label: boolean,
    indicatorlistS: string,
    timeS: string,
    useS: string,
    timeuseS: string,
    keepS: string,
    remarkS: string,
    my_indicatorlistS: string,
    my_timeS: string,
    my_useS: string,
    my_timeuseS: string,
    my_keepS: string,
    my_remarkS: string,
    lo_indicatorlistS: string,
    lo_timeS: string,
    lo_useS: string,
    lo_timeuseS: string,
    lo_keepS: string,
    lo_remarkS: string,
    en_indicatorlistS: string,
    en_timeS: string,
    en_useS: string,
    en_timeuseS: string,
    en_keepS: string,
    en_remarkS: string,
    zh_indicatorlistS: string,
    zh_timeS: string,
    zh_useS: string,
    zh_timeuseS: string,
    zh_keepS: string,
    zh_remarkS: string,
    ru_indicatorlistS: string,
    ru_timeS: string,
    ru_useS: string,
    ru_timeuseS: string,
    ru_keepS: string,
    ru_remarkS: string,
    km_indicatorlistS: string,
    km_timeS: string,
    km_useS: string,
    km_timeuseS: string,
    km_keepS: string,
    km_remarkS: string,
    ko_indicatorlistS: string,
    ko_timeS: string,
    ko_useS: string,
    ko_timeuseS: string,
    ko_keepS: string,
    ko_remarkS: string,
    ja_indicatorlistS: string,
    ja_timeS: string,
    ja_useS: string,
    ja_timeuseS: string,
    ja_keepS: string,
    ja_remarkS: string,
    ms_indicatorlistS: string,
    ms_timeS: string,
    ms_useS: string,
    ms_timeuseS: string,
    ms_keepS: string,
    ms_remarkS: string,
    pic: string,
    subQty?: number,
    subUnit?: string,
    type?: string,
    name_customer?: string,
    nme_customer?: string,
    id_card?: string,
    phone?: string,
    // โปรโมชั่นสินค้า: ส่วนลด/หน่วยที่โปรใส่ให้อัตโนมัติ และจำนวนของแถมที่รับแล้ว
    promo_discount?: number,
    promo_free_qty?: number,
    promo_id?: number,
    isPromoFree?: boolean,
    // ระดับราคาที่ปรับเองเฉพาะรายการนี้ (ไม่มีค่า = ใช้ระดับราคาของทั้งบิล)
    priceTier?: string

  }


  interface Task_rc {

    id: number,
    sale: number,
    balance: number
  }

  // ========== OPTIMIZED LOOKUP MAPS ==========
  // Product lookup map - O(1) access instead of O(n) filter
  const productMap = useMemo(() => {
    const map = new Map();
    dataProduct.forEach((p: any) => map.set(p.id, p));
    return map;
  }, [dataProduct]);

  // Product lookup by Barcode - O(1) access for fast scanning
  // รวม "บาร์โค้ดสำรอง" ไว้ใน map เดียวกัน — สินค้าตัวเดียวจึงสแกนได้หลายบาร์โค้ด
  // โดยความเร็วการสแกนเท่าเดิม (ยัง O(1) ในหน่วยความจำ ไม่ยิง API ตอนสแกน)
  //
  // map นี้ชี้ไป "ตัวสินค้า" เสมอ โค้ดที่เพิ่มรายการขายจึงยังอ่าน product.Barcode
  // (บาร์โค้ดหลัก) ไปบันทึกลงบิลตามเดิม → ยอดขาย/ยอดคงเหลือไม่เปลี่ยนวิธีคิดเลย
  const productMapByBarcode = useMemo(
    () => buildBarcodeIndex(dataProduct, barcodeAliases),
    [dataProduct, barcodeAliases]
  );

  // Product lookup by code - for UnitConversion productCode resolution
  const productMapByCode = useMemo(() => {
    const map = new Map();
    dataProduct.forEach((p: any) => map.set(p.code, p));
    return map;
  }, [dataProduct]);

  // UnitConversion lookup by Barcode - checked FIRST during scanning
  const unitConversionMapByBarcode = useMemo(() => {
    const map = new Map();
    unitConversionData.forEach((uc: any) => {
      if (uc.Barcode && uc.Barcode.trim() !== "") {
        map.set(uc.Barcode, uc);
      }
    });
    return map;
  }, [unitConversionData]);

  // UnitConversion lookup by id - ใช้ตอนเลือกหน่วยแปลงจากช่องค้นหา (รองรับหน่วยแปลงที่ไม่มีบาร์โค้ด)
  const unitConversionMapById = useMemo(() => {
    const map = new Map();
    unitConversionData.forEach((uc: any) => { if (uc?.id != null) map.set(Number(uc.id), uc); });
    return map;
  }, [unitConversionData]);

  // sentinel ที่ช่องค้นหาส่งมาเมื่อเลือก "หน่วยแปลง" จาก dropdown (แทนการสแกนบาร์โค้ด)
  const UC_SELECT_PREFIX = "__UC__";

  // sentinel ที่กริดสินค้า (โหมดร้านอาหาร/คาเฟ่) ส่งมาเมื่อแตะการ์ดสินค้า
  // ใช้ id ตรง ๆ เพราะสินค้าในร้านอาหารส่วนใหญ่ไม่มีบาร์โค้ด — เดินเส้นทางเดียวกับการสแกน
  // (มีอยู่แล้วในบิล = บวกจำนวน, ยังไม่มี = เพิ่มแถวใหม่พร้อมตัด lot ตามปกติ)
  const PID_SELECT_PREFIX = "__PID__";

  const negativeStockSaleMessage = "ไม่สามารถขายสินค้า เนื่องจากยอดคงเหลือ น้อยกว่าหรือเท่ากับ 0";

  const showNegativeStockSaleToast = () => {
    toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>{negativeStockSaleMessage}</div>, {
      duration: 3000,
    });
  };

  // ตรวจสอบราคาขายก่อนเพิ่มสินค้าลงรายการขาย
  // - ราคาขายเป็น 0 หรือ ราคาขาย < ราคาทุนล่าสุด (ลอตที่รับเข้าล่าสุด) ห้ามขาย ให้แจ้งเตือนและไปแก้ไขข้อมูลสินค้า
  const validateSalePrice = (productName: string, price: number, unitCost: number, latestUnitCost?: number): boolean => {
    // ถ้า B3 เปิด (อนุญาตขายราคา 0) ให้ข้ามการบล็อกราคา = 0
    if (price <= 0 && !isZeroPriceSaleAllowed()) {
      toast.error(
        <div style={{ fontFamily: "Kanit", fontSize: 15 }}>
          ไม่สามารถขาย "{productName}" ได้ เนื่องจากราคาขายเป็น 0 กรุณาไปแก้ไขข้อมูลสินค้า
        </div>,
        { duration: 4000 }
      );
      return false;
    }
    if (latestUnitCost !== undefined && price < latestUnitCost) {
      toast.error(
        <div style={{ fontFamily: "Kanit", fontSize: 15 }}>
          ไม่สามารถขาย "{productName}" ได้ เนื่องจากราคาขาย ({price.toLocaleString()}) ต่ำกว่าราคา{costPriceModeLabel(costPriceMode)} ({latestUnitCost.toLocaleString()}) กรุณาไปแก้ไขข้อมูลสินค้า
        </div>,
        { duration: 4000 }
      );
      return false;
    }
    return true;
  };

  const fetchCalculatedProductBalance = async (product: any): Promise<number | null> => {
    if (!product?.code) return null;
    const companyS = localStorage.getItem("company_") || "";
    try {
      const resSummary = await axios.get(`/api/stock-balance-summary?itemcode=${product.code}&company=${companyS}&id=${product.id}`);
      const calcBalance = resSummary.data?.calculatedBalance;
      if (calcBalance === undefined || calcBalance === null) return null;
      const balance = Number(calcBalance);
      setProductBalances(prev => {
        const newMap = new Map(prev);
        newMap.set(Number(product.id), isNaN(balance) ? 0 : balance);
        return newMap;
      });
      return isNaN(balance) ? 0 : balance;
    } catch (error) {
      console.error(`Error checking balance for ${product.code}:`, error);
      return null;
    }
  };

  const shouldBlockNegativeStockProduct = async (product: any): Promise<boolean> => {
    if (!blockNegativeStockSale) return false;
    const cachedBalance = productBalances.get(Number(product.id));
    if (cachedBalance !== undefined) {
      if (cachedBalance <= 0) {
        showNegativeStockSaleToast();
        return true;
      }
      return false;
    }
    const balance = await fetchCalculatedProductBalance(product);
    if (balance !== null && balance <= 0) {
      showNegativeStockSaleToast();
      return true;
    }
    return false;
  };

  // ========== ซ่อมยอด LOT อัตโนมัติตอนเพิ่มสินค้าลงบิล ==========
  // ยิงตอน "สแกนบาร์โค้ด" และตอนกด "ยืนยัน" จำนวนใน toast หลังเพิ่มสินค้า
  // ขั้นแรกตรวจแผนด้วย GET /api/lot-repair (อ่านอย่างเดียว) — สินค้าที่ยอด lot ตรงยอดคำนวณอยู่แล้ว
  // จะไม่ถูกแตะข้อมูลเลย มีแผนต้องแก้ถึงจะซ่อมจริงด้วย POST
  // หมายเหตุนโยบาย: หน้าขายซ่อม "ทุกเคสที่ยอดไม่ตรง" ต่างจากปุ่ม "ซ่อมแซม Lot ทุกสินค้า"
  // ในหน้าสรุปยอดคงเหลือที่ซ่อมอัตโนมัติเฉพาะเคสปลอดภัย — เคสที่ซ่อมแล้วยอดรวม lot ยังไม่เท่า
  // ยอดคำนวณ (หรือยังพึ่งการจับคู่ยอดขายจากบิลเก่า) จะซ่อมให้เหมือนกันแต่ขึ้น toast เตือนให้ไป
  // ตรวจต่อที่หน้าสรุปยอดคงเหลือ ทุกการซ่อมมี log ค่าเดิม/ค่าใหม่ใน _selfheal_lot_relink_log เสมอ
  const LOT_REPAIR_RECHECK_MS = 5 * 60 * 1000;
  const lotRepairCheckedAtRef = useRef<Map<string, number>>(new Map());
  const lotRepairRunningRef = useRef<Set<string>>(new Set());
  const lotRepairWarnedRef = useRef<Set<string>>(new Set());
  // itemcode ที่เพิ่งซ่อม — รอจัดสรร lot ของแถวในบิลใหม่หลังข้อมูล lot ชุดใหม่เข้า state แล้ว
  const [lotReallocQueue, setLotReallocQueue] = useState<string[]>([]);

  // ดึงข้อมูล lot ของสินค้าตัวเดียวมาทับของเดิมใน state (ชุดฟิลด์เดียวกับตอนโหลดหน้า)
  const refreshLotRowsForCode = async (itemcode: string, companyS: string) => {
    const res = await axios.get(
      `/api/${apidataitemlist}?company=${encodeURIComponent(companyS)}&itemcode=${encodeURIComponent(itemcode)}&fields=sale`,
      { timeout: 20000 }
    );
    // API ค้นด้วย startsWith จึงต้องกรองรหัสให้ตรงตัวก่อน (กันสินค้าที่รหัสขึ้นต้นเหมือนกันหลุดเข้ามา)
    const rows = (Array.isArray(res.data) ? res.data : []).filter((r: any) => String(r.itemcode || "") === itemcode);
    setdataItemRCFull((prev) => [...prev.filter((r: any) => String(r.itemcode || "") !== itemcode), ...rows]);
  };

  // รอให้การซ่อม lot ที่ค้างอยู่จบก่อน แล้วค่อยตัดสต๊อก — ถ้าปล่อยให้ทับกัน การซ่อมที่คำนวณ
  // ยอดไว้ "ก่อน" บิลถูกตัด อาจเขียนยอดเก่ากลับไปทับยอดหลังตัด (กลายเป็นสต็อกผี)
  const waitForLotRepairsToSettle = async (timeoutMs = 15000) => {
    const deadline = Date.now() + timeoutMs;
    while (lotRepairRunningRef.current.size > 0 && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 100));
    }
  };

  const autoRepairLotForCode = async (rawCode: string, productId?: number | null) => {
    const itemcode = String(rawCode || "").trim();
    if (!itemcode) return;
    const companyS = localStorage.getItem("company_") || "";
    if (!companyS) return;
    if (lotRepairRunningRef.current.has(itemcode)) return;
    // เพิ่งตรวจสินค้าตัวนี้ไปเมื่อกี้ — ไม่ต้องยิงซ้ำทุกครั้งที่สแกน/ยืนยันจำนวน
    if (Date.now() - (lotRepairCheckedAtRef.current.get(itemcode) || 0) < LOT_REPAIR_RECHECK_MS) return;

    lotRepairRunningRef.current.add(itemcode);
    try {
      const idParam = productId ? `&id=${encodeURIComponent(String(productId))}` : "";
      const planRes = await axios.get(
        `/api/lot-repair?company=${encodeURIComponent(companyS)}&itemcode=${encodeURIComponent(itemcode)}${idParam}`,
        { timeout: 30000 }
      );
      const plan = planRes.data?.plan;
      if (!plan) return;

      // lot ถูกต้องอยู่แล้ว → ไม่ต้องซ่อม (ไม่มี toast รบกวนคนขาย)
      const needRepair = (plan.changes?.length || 0) > 0
        || Number(plan.orphanTxCount || 0) > 0
        || Number(plan.createSaleTxCount || 0) > 0
        // รายการที่ตัด lot เกินของที่รับเข้าจริง — ต้องจัดสรรการตัด lot ใหม่ให้สอดคล้องกัน
        || Number(plan.reassignTxCount || 0) > 0
        || Number(plan.deleteTxCount || 0) > 0
        || Number(plan.createLotCount || 0) > 0;
      if (!needRepair) {
        lotRepairCheckedAtRef.current.set(itemcode, Date.now());
        return;
      }

      // ซ่อมแล้วยอดรวม lot จะเท่ายอดคำนวณพอดีไหม (ใช้ตัดสินแค่ว่าจะเตือนต่อหรือไม่ ไม่ได้กันการซ่อม)
      const fullyResolved = Math.abs(Number(plan.newTotal || 0) - Number(plan.calculatedBalance || 0)) < 0.001
        && !plan.saleFallbackWarning;

      const res = await axios.post("/api/lot-repair", {
        company: companyS,
        itemcode,
        id: productId ?? null,
        person: localStorage.getItem("person_") || ""
      }, { timeout: 60000 });
      lotRepairCheckedAtRef.current.set(itemcode, Date.now());
      await refreshLotRowsForCode(itemcode, companyS);
      setLotReallocQueue((prev) => prev.includes(itemcode) ? prev : [...prev, itemcode]);

      const repairMessage = String(res.data?.message || "");
      if (fullyResolved) {
        toast.success(
          <div style={{ fontFamily: "Kanit", fontSize: 14 }}>ซ่อมยอด Lot ของ {itemcode} อัตโนมัติแล้ว</div>,
          {
            description: <div style={{ fontFamily: "Kanit", fontSize: 12 }}>{repairMessage}</div>,
            duration: 3000,
          }
        );
      } else if (!lotRepairWarnedRef.current.has(itemcode)) {
        // ซ่อมให้แล้ว แต่ยอดรวม lot ยังไม่เท่ายอดคำนวณระดับสินค้า — ต้องมีคนไปดูสาเหตุต่อ
        lotRepairWarnedRef.current.add(itemcode);
        const diff = Number(plan.calculatedBalance || 0) - Number(plan.newTotal || 0);
        toast.warning(
          <div style={{ fontFamily: "Kanit", fontSize: 14 }}>ซ่อมยอด Lot ของ {itemcode} แล้ว แต่ยอดยังไม่ตรง</div>,
          {
            description: (
              <div style={{ fontFamily: "Kanit", fontSize: 12 }}>
                ยอดคำนวณต่างจากยอดรวม lot อยู่ {diff.toLocaleString("th-TH", { maximumFractionDigits: 2 })} — ตรวจต่อที่หน้าสรุปยอดคงเหลือ
              </div>
            ),
            duration: 5000,
          }
        );
      }
    } catch (error) {
      // ซ่อม lot เป็นงานเบื้องหลัง — ล้มเหลวแล้วต้องไม่ขวางการขาย
      if (!isAbortError(error)) console.error("[AutoLotRepair]", itemcode, error);
    } finally {
      lotRepairRunningRef.current.delete(itemcode);
    }
  };

  // ========== FAST BARCODE SCANNING HANDLER ==========
  // ref ที่ชี้ list ล่าสุดเสมอ เพื่อให้ตัวจัดการสแกน (deps แค่ scanCount) ตรวจ "แถวเดิม" จากข้อมูลปัจจุบัน
  // ไม่งั้นการสแกน/เลือกหน่วยซ้ำหลายครั้งจะหาแถวเดิมไม่เจอ → ไม่เพิ่มจำนวน หรือเพิ่มแถวซ้ำ
  const listRef = useRef(list);
  useEffect(() => { listRef.current = list; }, [list]);
  useEffect(() => {
    const handleScannedBarcode = async () => {
      if (!scannedBarcode || scannedBarcode === "") return;

      // แตะการ์ดสินค้าในกริด (โหมดร้านอาหาร/คาเฟ่) — ระบุตัวสินค้าด้วย id ตรง ๆ ไม่ผ่านบาร์โค้ด
      const isPickById = scannedBarcode.startsWith(PID_SELECT_PREFIX);

      // Step 1: Check UnitConversion barcode FIRST (หรือ sentinel เมื่อเลือกหน่วยแปลงจากช่องค้นหา)
      let unitConv = isPickById
        ? undefined
        : scannedBarcode.startsWith(UC_SELECT_PREFIX)
          ? unitConversionMapById.get(Number(scannedBarcode.slice(UC_SELECT_PREFIX.length)))
          : unitConversionMapByBarcode.get(scannedBarcode);
      let product: any = null;
      let isUnitConversion = false;

      if (unitConv) {
        // Found in UnitConversion - resolve the product by productCode
        product = productMapByCode.get(unitConv.productCode);
        if (product) {
          isUnitConversion = true;
        }
      }

      // Step 2: Fallback to Datalist barcode (บาร์โค้ดหลัก + บาร์โค้ดสำรอง)
      // normalize ก่อนค้น เพราะ map ถูกสร้างด้วยคีย์ที่ normalize แล้ว
      if (!product) {
        product = isPickById
          ? productMap.get(Number(scannedBarcode.slice(PID_SELECT_PREFIX.length)))
          : productMapByBarcode.get(normalizeBarcode(scannedBarcode));
      }

      if (!product) {
        console.log("Barcode not found:", scannedBarcode);
        toast.error(
          <div style={{ fontFamily: "Kanit", fontSize: 15 }}>
            {isPickById ? "ไม่พบข้อมูลสินค้าที่เลือก" : `ไม่พบสินค้าสำหรับ Barcode "${scannedBarcode}"`}
          </div>,
          { duration: 3000 }
        );
        return;
      }

      // สินค้าถูกระงับการใช้งาน — เตือนและไม่เพิ่มลงบิล
      // ครอบคลุมทั้งสแกนบาร์โค้ดหน่วยแปลง (UnitConversion) และเลือกหน่วยแปลงจากช่องค้นหา
      if (product.Show === "True" || product.Show === "true" || product.Show === "TRUE") {
        alert("สินค้าถูกระงับการใช้งาน");
        return;
      }

      if (await shouldBlockNegativeStockProduct(product)) return;

      // สแกนบาร์โค้ด = สั่งซ่อม lot ของสินค้าตัวนี้ให้อัตโนมัติ (lot ที่ถูกต้องอยู่แล้วจะไม่ถูกแก้)
      // ไม่ await เพื่อให้การสแกนรัว ๆ ยังเร็วเท่าเดิม — แถวในบิลจะถูกจัดสรร lot ใหม่ให้เมื่อซ่อมเสร็จ
      void autoRepairLotForCode(product.code, product.id);

      const productId = product.id;
      const unitForItem = isUnitConversion ? (unitConv.saleUnit || product.Unit || "") : (product.Unit || "");
      // Match existing item by product AND unit (same product with different units = separate rows)
      // ใช้ listRef.current เพื่ออ่านรายการล่าสุด (กันปัญหา closure เก่าตอนสแกน/เลือกซ้ำ)
      const existingItem = listRef.current.find((item: any) => item.id_product === productId && item.unit === unitForItem);

      // Auto-set product info panel
      setcodeproductS(product.code);
      const rcForCost = sortedRCData.filter((r: any) => r.itemcode === product.code);
      setcostS(String(lotUnitCost(rcForCost[rcForCost.length - 1] as any) || product.CostActual || 0));

      if (existingItem) {
        // Product exists in list with same unit - increase quantity
        setList(prevList => prevList.map((task: any) =>
          task.id_product === productId && task.unit === unitForItem
            ? { ...task, qty: task.qty + 1, total: (task.qty + 1) * task.diff, costtotal: (task.qty + 1) * task.cost, totalgift: (task.qty + 1) * task.gift }
            : task
        ));
      } else {
      // New product - find lot info and add to list
      const code = product.code;
      const rcItems = sortedRCData.filter((r: any) => r.itemcode === code && (r.balance == null || r.qty > r.sale));
      const lot_id = rcItems.map((r: any) => r.id);
      const lot_RC = rcItems.map((r: any) => r.lot);
      const lot_qty = rcItems.map((r: any) => r.qty);
      const lot_sale = rcItems.map((r: any) => r.sale);
      const cost = lotUnitCost(rcItems[rcItems.length - 1] as any) || product.CostActual || 0;

      // Determine price: UnitConversion prices take priority when barcode matched UnitConversion
      let price: number;
      if (isUnitConversion) {
        price = paystore === "หน้าร้าน" ? Number(unitConv.priceRetail || 0) :
          paystore === "ขายส่ง" ? Number(unitConv.priceWholesale || 0) :
            paystore === "สมาชิก" ? (Number(unitConv.priceOnline || 0) > 0 ? Number(unitConv.priceOnline) : Number(unitConv.priceRetail || 0)) :
              paystore === "ราคา A" ? Number(unitConv.priceA || 0) :
                paystore === "ราคา B" ? Number(unitConv.priceB || 0) :
                  paystore === "ราคา C" ? Number(unitConv.priceC || 0) :
                    paystore === "ราคา D" ? Number(unitConv.priceD || 0) :
                      paystore === "ราคา E" ? Number(unitConv.priceE || 0) :
                        paystore === "ราคา F" ? Number(unitConv.priceF || 0) :
                          paystore === "ราคา G" ? Number(unitConv.priceG || 0) :
                            Number(unitConv.priceH || 0);
      } else {
        price = paystore === "หน้าร้าน" ? Number(product.price || 0) :
          paystore === "ขายส่ง" ? Number(product.wholesaleprice || 0) :
            paystore === "สมาชิก" ? (Number(product.online || 0) > 0 ? Number(product.online) : Number(product.price || 0)) :
              paystore === "ราคา A" ? Number(product.PriceA || 0) :
                paystore === "ราคา B" ? Number(product.PriceB || 0) :
                  paystore === "ราคา C" ? Number(product.PriceC || 0) :
                    paystore === "ราคา D" ? Number(product.PriceD || 0) :
                      paystore === "ราคา E" ? Number(product.PriceE || 0) :
                        paystore === "ราคา F" ? Number(product.PriceF || 0) :
                          paystore === "ราคา G" ? Number(product.PriceG || 0) :
                            Number(product.PriceH || 0);
      }

      const subQtyMultiplier = isUnitConversion ? (unitConv.subQty || 1) : 1;
      const unitCost = (Number(cost) || 0) * subQtyMultiplier;
      const latestUnitCost = getAbsoluteLatestCost(code, product) * subQtyMultiplier;
      if (!validateSalePrice(product.ProductName, price, unitCost, latestUnitCost)) return;

      const labelData = labelByCode.get(code);
      const giftData = giftByCode.get(code);
      const gift_p = Number(giftData?.gift || 0);

      const newItem = {
        id: productId,
        company: localStorage.getItem("company_") || "",
        id_product: productId,
        code_product: code,
        name_product: product.ProductName,
        fixname: product.fixname || "",
        cetagory: product.Category || "",
        unit: unitForItem,
        barcode: product.Barcode || "",
        qty: 1,
        price: price,
        gift: gift_p * (isUnitConversion ? (unitConv.subQty || 1) : 1),
        totalgift: gift_p * (isUnitConversion ? (unitConv.subQty || 1) : 1),
        cost: (Number(cost) || 0) * (isUnitConversion ? (unitConv.subQty || 1) : 1),
        costtotal: (Number(cost) || 0) * (isUnitConversion ? (unitConv.subQty || 1) : 1),
        discount: 0,
        diff: price,
        total: price,
        subQty: isUnitConversion ? (unitConv.subQty || 1) : 1,
        // หน่วยย่อยยึดจากหน่วยฐานของสินค้าเสมอ (กันค่าที่ค้างใน UnitConversion.subUnit)
        subUnit: product.Unit || (isUnitConversion ? unitConv.subUnit : "") || "",
        id_receive1: lot_id[0] || 0,
        lot_receive1: lot_RC[0] || "",
        qty_lot1: 1,
        std_qty_lot1: lot_qty[0] || 0,
        sale_qty_lot1: 1 + Number(lot_sale[0] || 0),
        id_receive2: lot_id[1] || 0,
        lot_receive2: "",
        qty_lot2: 0,
        std_qty_lot2: lot_qty[1] || 0,
        sale_qty_lot2: Number(lot_sale[1] || 0),
        id_receive3: lot_id[2] || 0,
        lot_receive3: "",
        qty_lot3: 0,
        std_qty_lot3: lot_qty[2] || 0,
        sale_qty_lot3: Number(lot_sale[2] || 0),
        person: localStorage.getItem("person_") || "",
        statuss: "OK",
        label: true,
        indicatorlistS: labelData?.indicatorlistS || "",
        timeS: labelData?.timeS || "",
        useS: labelData?.useS || "",
        timeuseS: labelData?.timeuseS || "",
        keepS: labelData?.keepS || "",
        remarkS: labelData?.remarkS || "",
        type: "",
        name_customer: "",
        my_indicatorlistS: "",
        my_timeS: "",
        my_useS: "",
        my_timeuseS: "",
        my_keepS: "",
        my_remarkS: "",
        lo_indicatorlistS: "",
        lo_timeS: "",
        lo_useS: "",
        lo_timeuseS: "",
        lo_keepS: "",
        lo_remarkS: "",
        en_indicatorlistS: "",
        en_timeS: "",
        en_useS: "",
        en_timeuseS: "",
        en_keepS: "",
        en_remarkS: "",
        zh_indicatorlistS: "",
        zh_timeS: "",
        zh_useS: "",
        zh_timeuseS: "",
        zh_keepS: "",
        zh_remarkS: "",
        ru_indicatorlistS: "",
        ru_timeS: "",
        ru_useS: "",
        ru_timeuseS: "",
        ru_keepS: "",
        ru_remarkS: "",
        km_indicatorlistS: "",
        km_timeS: "",
        km_useS: "",
        km_timeuseS: "",
        km_keepS: "",
        km_remarkS: "",
        ko_indicatorlistS: "",
        ko_timeS: "",
        ko_useS: "",
        ko_timeuseS: "",
        ko_keepS: "",
        ko_remarkS: "",
        ja_indicatorlistS: "",
        ja_timeS: "",
        ja_useS: "",
        ja_timeuseS: "",
        ja_keepS: "",
        ja_remarkS: "",
        ms_indicatorlistS: "",
        ms_timeS: "",
        ms_useS: "",
        ms_timeuseS: "",
        ms_keepS: "",
        ms_remarkS: "",
        pic: product.pic || "",
        childWeight: 0,
        childDoseMl: 0,
        childDoseTeaspoon: 0,
        childFrequency: 0,
        childDoseWarning: false,
      };

      // Check if product is pediatric liquid (has concentration set)
      if (product.concentration && product.concentration > 0) {
        if (globalChildWeight > 0) {
          const calculatedItem = calcPediatricForItem(newItem, globalChildWeight, product);
          setList(prevList => [...prevList, calculatedItem]);
        } else {
          setPendingPediatricItem({ ...newItem, _product: product });
          setShowPediatricModal(true);
        }
      } else {
        setList(prevList => [...prevList, newItem]);
      }
      }
    };

    handleScannedBarcode();
  }, [scanCount]);

  // ========== RECALCULATE PRICES WHEN PAYSTORE CHANGES ==========
  const prevPaystoreRef = useRef(paystore);
  useEffect(() => {
    // Skip initial render or when paystore hasn't actually changed
    if (prevPaystoreRef.current === paystore) return;
    prevPaystoreRef.current = paystore;

    if (list.length === 0 || !paystore) return;

    setList(prevList => prevList.map(item => {
      const product = productMap.get(item.id_product);
      if (!product) return item;

      let newPrice = 0;
      if (paystore === "หน้าร้าน") {
        newPrice = Number(product.price || 0);
      } else if (paystore === "ขายส่ง") {
        newPrice = Number(product.wholesaleprice || 0);
      } else if (paystore === "สมาชิก") {
        newPrice = Number(product.online || 0) > 0 ? Number(product.online) : Number(product.price || 0);
      } else if (paystore === "ราคา A") {
        newPrice = Number(product.PriceA || 0);
      } else if (paystore === "ราคา B") {
        newPrice = Number(product.PriceB || 0);
      } else if (paystore === "ราคา C") {
        newPrice = Number(product.PriceC || 0);
      } else if (paystore === "ราคา D") {
        newPrice = Number(product.PriceD || 0);
      } else if (paystore === "ราคา E") {
        newPrice = Number(product.PriceE || 0);
      } else if (paystore === "ราคา F") {
        newPrice = Number(product.PriceF || 0);
      } else if (paystore === "ราคา G") {
        newPrice = Number(product.PriceG || 0);
      } else {
        newPrice = Number(product.PriceH || 0);
      }

      const newDiff = newPrice - Number(item.discount || 0);
      return {
        ...item,
        price: newPrice,
        // เปลี่ยนระดับราคาทั้งบิล = ล้างระดับราคาที่ปรับเองรายสินค้าไว้ก่อนหน้า
        priceTier: undefined,
        diff: newDiff,
        total: Number(item.qty) * newDiff,
      };
    }));
  }, [paystore]);

  // ========== PEDIATRIC DOSE HELPERS ==========
  const calcPediatricForItem = (item: any, weight: number, product: any) => {
    const conc = product?.concentration || 0;
    const dose = product?.dosePerKg || 0;
    const freq = product?.doseFrequency || 1;
    const maxD = product?.maxDosePerDay || 0;
    if (weight > 0 && conc > 0 && dose > 0) {
      const totalDosePerDay = dose * weight;
      const dosePerTimeMg = totalDosePerDay / freq;
      const dosePerTimeMl = Math.round((dosePerTimeMg / conc) * 100) / 100;
      const dosePerTimeTeaspoon = Math.round((dosePerTimeMl / 5) * 100) / 100;
      const isOverMax = maxD > 0 && totalDosePerDay > maxD;
      return { ...item, childWeight: weight, childDoseMl: dosePerTimeMl, childDoseTeaspoon: dosePerTimeTeaspoon, childFrequency: freq, childDoseWarning: isOverMax };
    }
    return item;
  };

  const recalcAllPediatricItems = (prevList: any[], weight: number) => {
    return prevList.map((item: any) => {
      const product = productMap.get(item.id_product);
      if (product?.concentration && product.concentration > 0) {
        return calcPediatricForItem(item, weight, product);
      }
      return item;
    });
  };

  // ========== PEDIATRIC DOSE MODAL HANDLERS ==========
  const handlePediatricConfirm = (weight: number) => {
    if (!weight || weight <= 0) return;

    setGlobalChildWeight(weight);

    if (pendingPediatricItem) {
      const product = pendingPediatricItem._product;
      const { _product, ...itemWithoutProduct } = pendingPediatricItem;
      const newItem = calcPediatricForItem(itemWithoutProduct, weight, product);
      setList(prevList => {
        const updatedList = recalcAllPediatricItems(prevList, weight);
        return [...updatedList, newItem];
      });
    } else {
      setList(prevList => recalcAllPediatricItems(prevList, weight));
    }

    setShowPediatricModal(false);
    setPendingPediatricItem(null);
  };

  const handlePediatricCancel = () => {
    if (pendingPediatricItem) {
      const { _product, ...itemWithoutProduct } = pendingPediatricItem;
      setList(prevList => [...prevList, itemWithoutProduct]);
    }
    setShowPediatricModal(false);
    setPendingPediatricItem(null);
  };

  // Selected product from map
  const selectedProduct = useMemo(() => productMap.get(idF), [productMap, idF]);

  // Sorted RC data - cached to avoid repeated sorting
  const sortedRCData = useMemo(() => {
    return [...dataRCFull]
      .sort((a: any, b: any) => new Date(a.dateExp).getTime() - new Date(b.dateExp).getTime())
      .sort((a: any, b: any) => new Date(a.createDate).getTime() - new Date(b.createDate).getTime());
  }, [dataRCFull]);

  // RC lookup by itemcode - O(1) access
  const rcByItemCode = useMemo(() => {
    const map = new Map<string, any[]>();
    sortedRCData.forEach((rc: any) => {
      const key = rc.itemcode;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(rc);
    });
    return map;
  }, [sortedRCData]);

  // RC lookup by id - for displaying lot/dateExp on cart rows
  const rcById = useMemo(() => {
    const map = new Map<number, any>();
    sortedRCData.forEach((rc: any) => map.set(Number(rc.id), rc));
    return map;
  }, [sortedRCData]);

  const formatExpiryShortDate = (dateValue: Date | string | null | undefined) => {
    if (!dateValue) return "";
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("th-TH", { year: "2-digit", month: "2-digit", day: "2-digit" });
  };

  const formatDateInputValue = (dateValue: Date | string | null | undefined) => {
    if (!dateValue) return "";
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getProductStorageArea = (item: any) => {
    const product = productMapByCode.get(item?.code_product) || productMapByCode.get(String(item?.code_product || ""));
    return String(item?.Area || item?.area || product?.Area || "").trim();
  };

  const getUsedExpiryLots = (item: any) => {
    const area = getProductStorageArea(item) || "-";
    return [1, 2, 3]
      .map((n) => {
        const qty = Number(item?.[`qty_lot${n}`] || 0);
        const lotId = Number(item?.[`id_receive${n}`] || 0);
        const lot = String(item?.[`lot_receive${n}`] || "");
        const rc = rcById.get(lotId);
        const exp = rc?.dateExp;
        const date = exp ? new Date(exp) : null;
        if (!qty || !lotId || !date || isNaN(date.getTime())) return null;
        const daysLeft = getExpiryDaysLeft(date);
        return {
          slot: n,
          qty,
          lotId,
          lot: lot || rc?.lot || "-",
          area,
          date,
          daysLeft,
          rule: getExpiryRuleForDate(date, expiryColorRules),
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.date.getTime() - b.date.getTime()) as Array<{
        slot: number;
        qty: number;
        lotId: number;
        lot: string;
        area: string;
        date: Date;
        daysLeft: number | null;
        rule: ExpiryColorRule | null;
      }>;
  };

  const getPrimaryExpiryInfo = (item: any) => getUsedExpiryLots(item)[0] || null;

  const getExpiryAccentTextColor = (color: string) => getReadableTintTextColor(color);

  const getExpiryBadgeStyle = (rule: ExpiryColorRule | null): React.CSSProperties => {
    // Only decorate with color when a configured "ตั้งค่าแสดงสีวันหมดอายุ" range
    // actually matches; otherwise show plain text with no badge box/border so
    // colors on screen always come from the setting, never a hardcoded default.
    if (!rule) {
      return { background: "transparent", borderColor: "transparent", boxShadow: "none" };
    }
    return {
      borderColor: colorWithAlpha(rule.color, 0.75),
      background: colorWithAlpha(rule.color, 0.18),
      color: getExpiryAccentTextColor(rule.color),
    };
  };

  const getExpiryProductAreaStyle = (item: any, position: "start" | "middle" | "end"): React.CSSProperties => {
    const info = getPrimaryExpiryInfo(item);
    if (!info?.rule) return {};
    const tint = colorWithAlpha(info.rule.color, 0.2);
    const softTint = colorWithAlpha(info.rule.color, 0.1);
    return {
      background: position === "end" ? `linear-gradient(90deg, ${tint} 0%, ${softTint} 78%, transparent 100%)` : tint,
      boxShadow: position === "start" ? `inset 4px 0 0 ${info.rule.color}` : undefined,
      color: "#0f172a",
    };
  };

  const [expiryEditItem, setExpiryEditItem] = useState<any | null>(null);
  const [expiryEditRows, setExpiryEditRows] = useState<Array<{ lotId: number; lot: string; qty: number; dateExp: string }>>([]);
  const [expiryEditSaving, setExpiryEditSaving] = useState(false);

  const openExpiryEditor = (item: any) => {
    const rows = getUsedExpiryLots(item).map((lot) => ({
      lotId: lot.lotId,
      lot: lot.lot,
      qty: lot.qty,
      dateExp: formatDateInputValue(lot.date),
    }));
    if (rows.length === 0) return;
    setExpiryEditItem(item);
    setExpiryEditRows(rows);
  };

  const saveExpiryEditRows = async () => {
    if (expiryEditRows.length === 0) return;
    setExpiryEditSaving(true);
    try {
      const person = String(localStorage.getItem("person_") || "");
      await Promise.all(expiryEditRows.map((row) => axios.put("/api/lot-edit", {
        lotId: row.lotId,
        dateExp: row.dateExp ? new Date(row.dateExp).toISOString() : null,
        person,
      })));

      const dateByLotId = new Map(expiryEditRows.map((row) => [row.lotId, row.dateExp ? new Date(row.dateExp).toISOString() : null]));
      setdataItemRCFull((prev) => prev.map((rc: any) => dateByLotId.has(Number(rc.id)) ? { ...rc, dateExp: dateByLotId.get(Number(rc.id)) } : rc));
      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 14 }}>บันทึกวันหมดอายุ Lot เรียบร้อย</div>);
      setExpiryEditItem(null);
      setExpiryEditRows([]);
    } catch (error) {
      if (!isAbortError(error)) console.error(error);
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 14 }}>บันทึกวันหมดอายุ Lot ไม่สำเร็จ</div>);
    } finally {
      setExpiryEditSaving(false);
    }
  };

  // Label lookup by code - O(1) access
  const labelByCode = useMemo(() => {
    const map = new Map();
    alllabel.forEach((l: any) => map.set(l.code, l));
    return map;
  }, [alllabel]);

  // Gift lookup by code - O(1) access
  const giftByCode = useMemo(() => {
    const map = new Map();
    giftlist.forEach((g: any) => map.set(g.code_product, g));
    return map;
  }, [giftlist]);

  // Helper function to get product balance keyed by product id (รองรับสินค้ารหัสซ้ำ)
  // Formula matches stock-balance-summary API (เดียวกับหน้าสรุปยอดคงเหลือ)
  const getProductBalance = (productId: number | string | undefined | null): number => {
    if (productId == null || productId === "") return 0;
    return productBalances.get(Number(productId)) || 0;
  };

  // List item lookup by id_product
  const listItemByProductId = useMemo(() => {
    const map = new Map();
    list.forEach((item: any) => map.set(item.id_product, item));
    return map;
  }, [list]);

  // จำนวนรวมของสินค้าแต่ละตัวในบิล (รวมทุกหน่วย) — ใช้แสดงป้ายจำนวนบนการ์ดในกริดสินค้า
  const cartQtyByProductId = useMemo(() => {
    const map = new Map<number, number>();
    list.forEach((item: any) => {
      const pid = Number(item.id_product);
      if (!pid) return;
      map.set(pid, (map.get(pid) || 0) + Number(item.qty || 0));
    });
    return map;
  }, [list]);

  // แตะการ์ดสินค้าในกริด = เดินเส้นทางเดียวกับการสแกนบาร์โค้ด (เพิ่มทีละ 1 หน่วย)
  const handleCatalogPick = React.useCallback((product: any) => {
    if (!product?.id) return;
    setScannedBarcode(`${PID_SELECT_PREFIX}${product.id}`);
  }, [setScannedBarcode]);

  // ========== OPTIMIZED PRODUCT DATA EXTRACTION ==========
  const listItem = listItemByProductId.get(idF);
  let qty_e = Number(listItem?.id_product || 0);
  let qty_A = Number(listItem?.qty || 0);
  const id_product_e = Number(selectedProduct?.id || 0);
  const code_product_e = String(selectedProduct?.code || "");
  const name_product_e = String(selectedProduct?.ProductName || "");
  const fixname_e = String(selectedProduct?.fixname || "");
  const barcode_e = String(selectedProduct?.Barcode || "");
  const Category_e = String(selectedProduct?.Category || "");
  const unit_e = String(selectedProduct?.Unit || "");
  const cost_e = String(selectedProduct?.CostActual || "");
  const pic_e = String(selectedProduct?.pic || "");
  const price_e = paystore === "หน้าร้าน" ? Number(selectedProduct?.price || 0) :
    paystore === "ขายส่ง" ? Number(selectedProduct?.wholesaleprice || 0) :
      paystore === "สมาชิก" ? (Number(selectedProduct?.online || 0) > 0 ? Number(selectedProduct?.online) : Number(selectedProduct?.price || 0)) :
        paystore === "ราคา A" ? Number(selectedProduct?.PriceA || 0) :
          paystore === "ราคา B" ? Number(selectedProduct?.PriceB || 0) :
            paystore === "ราคา C" ? Number(selectedProduct?.PriceC || 0) :
              paystore === "ราคา D" ? Number(selectedProduct?.PriceD || 0) :
                paystore === "ราคา E" ? Number(selectedProduct?.PriceE || 0) :
                  paystore === "ราคา F" ? Number(selectedProduct?.PriceF || 0) :
                    paystore === "ราคา G" ? Number(selectedProduct?.PriceG || 0) :
                      Number(selectedProduct?.PriceH || 0)

  //  ฉลากยา ไทย
  let code_Prod = code_product_e
  // ========== OPTIMIZED LABEL LOOKUP ==========
  const labelData = labelByCode.get(String(code_Prod));
  const label_inticator = labelData?.indicatorlistS ? [labelData.indicatorlistS] : [];
  const label_timeS = labelData?.timeS ? [labelData.timeS] : [];
  const label_useS = labelData?.useS ? [labelData.useS] : [];
  const label_timeuseS = labelData?.timeuseS ? [labelData.timeuseS] : [];
  const label_keepS = labelData?.keepS ? [labelData.keepS] : [];
  const label_remarkS = labelData?.remarkS ? [labelData.remarkS] : [];

  let my_indi = label_inticator
  let my_timeS = label_timeS
  let my_useS = label_useS
  let my_timeuseS = label_timeuseS
  let my_keepS = label_keepS
  let my_remarkS = label_remarkS



  //  ฉลากยา inticator
  const my_label_inticator = indi.filter((i: any) => i.list === String(my_indi)).map((c: any) => c.list_my)
  const lo_label_inticator = indi.filter((i: any) => i.list === String(my_indi)).map((c: any) => c.list_lo)
  const en_label_inticator = indi.filter((i: any) => i.list === String(my_indi)).map((c: any) => c.list_eng)
  const zh_label_inticator = indi.filter((i: any) => i.list === String(my_indi)).map((c: any) => c.list_zh)

  //  ฉลากยา timeL
  const my_label_timeS = timeL.filter((i: any) => i.list === String(my_timeS)).map((c: any) => c.list_my)
  const lo_label_timeS = timeL.filter((i: any) => i.list === String(my_timeS)).map((c: any) => c.list_lo)
  const en_label_timeS = timeL.filter((i: any) => i.list === String(my_timeS)).map((c: any) => c.list_eng)
  const zh_label_timeS = timeL.filter((i: any) => i.list === String(my_timeS)).map((c: any) => c.list_zh)

  //  ฉลากยา useS
  const my_label_useS = useL.filter((i: any) => i.fullname === String(my_useS)).map((c: any) => c.list_my)
  const lo_label_useS = useL.filter((i: any) => i.fullname === String(my_useS)).map((c: any) => c.list_lo)
  const en_label_useS = useL.filter((i: any) => i.fullname === String(my_useS)).map((c: any) => c.list_eng)
  const zh_label_useS = useL.filter((i: any) => i.fullname === String(my_useS)).map((c: any) => c.list_zh)

  //  ฉลากยา timeuseS  
  const my_label_timeuseS = timeuseL.filter((i: any) => i.list === String(my_timeuseS)).map((c: any) => c.list_my)
  const lo_label_timeuseS = timeuseL.filter((i: any) => i.list === String(my_timeuseS)).map((c: any) => c.list_lo)
  const en_label_timeuseS = timeuseL.filter((i: any) => i.list === String(my_timeuseS)).map((c: any) => c.list_eng)
  const zh_label_timeuseS = timeuseL.filter((i: any) => i.list === String(my_timeuseS)).map((c: any) => c.list_zh)

  //  ฉลากยา keepS 
  const my_label_keepS = keepL.filter((i: any) => i.list === String(my_keepS)).map((c: any) => c.list_my)
  const lo_label_keepS = keepL.filter((i: any) => i.list === String(my_keepS)).map((c: any) => c.list_lo)
  const en_label_keepS = keepL.filter((i: any) => i.list === String(my_keepS)).map((c: any) => c.list_eng)
  const zh_label_keepS = keepL.filter((i: any) => i.list === String(my_keepS)).map((c: any) => c.list_zh)

  //  ฉลากยา remarkS   
  const my_label_remarkS = RemarkL.filter((i: any) => i.list === String(my_remarkS)).map((c: any) => c.list_my)
  const lo_label_remarkS = RemarkL.filter((i: any) => i.list === String(my_remarkS)).map((c: any) => c.list_lo)
  const en_label_remarkS = RemarkL.filter((i: any) => i.list === String(my_remarkS)).map((c: any) => c.list_eng)
  const zh_label_remarkS = RemarkL.filter((i: any) => i.list === String(my_remarkS)).map((c: any) => c.list_zh)

  //  ฉลากยา Russian (ru)
  const ru_label_inticator = indi.filter((i: any) => i.list === String(my_indi)).map((c: any) => c.list_ru)
  const ru_label_timeS = timeL.filter((i: any) => i.list === String(my_timeS)).map((c: any) => c.list_ru)
  const ru_label_useS = useL.filter((i: any) => i.fullname === String(my_useS)).map((c: any) => c.list_ru)
  const ru_label_timeuseS = timeuseL.filter((i: any) => i.list === String(my_timeuseS)).map((c: any) => c.list_ru)
  const ru_label_keepS = keepL.filter((i: any) => i.list === String(my_keepS)).map((c: any) => c.list_ru)
  const ru_label_remarkS = RemarkL.filter((i: any) => i.list === String(my_remarkS)).map((c: any) => c.list_ru)

  //  ฉลากยา Cambodian (km)
  const km_label_inticator = indi.filter((i: any) => i.list === String(my_indi)).map((c: any) => c.list_km)
  const km_label_timeS = timeL.filter((i: any) => i.list === String(my_timeS)).map((c: any) => c.list_km)
  const km_label_useS = useL.filter((i: any) => i.fullname === String(my_useS)).map((c: any) => c.list_km)
  const km_label_timeuseS = timeuseL.filter((i: any) => i.list === String(my_timeuseS)).map((c: any) => c.list_km)
  const km_label_keepS = keepL.filter((i: any) => i.list === String(my_keepS)).map((c: any) => c.list_km)
  const km_label_remarkS = RemarkL.filter((i: any) => i.list === String(my_remarkS)).map((c: any) => c.list_km)

  // ========== OPTIMIZED GIFT LOOKUP ==========
  const giftData = giftByCode.get(String(code_Prod));
  const gift_p = Number(giftData?.gift || 0);


  const _filteredLots = (rcByItemCode.get(code_Prod) || [])
    .filter((r: any) => r.balance == null || r.qty > r.sale);

  const lot_id = _filteredLots.map((lots: any) => lots.id);
  const costArr = _filteredLots.map((lots: any) => lotUnitCost(lots));
  const cost = costArr.length > 0 ? [costArr[costArr.length - 1]] : costArr;
  const lot_RC = _filteredLots.map((lots: any) => lots.lot);
  const lot_qty = _filteredLots.map((lots: any) => lots.qty);
  const lot_sale = _filteredLots.map((lots: any) => lots.sale);



  //******************************************************************************************* */
  const _filteredLotsT = (rcByItemCode.get(editedcode) || [])
    .filter((r: any) => r.balance == null || r.qty > r.sale);

  const lot_id_T = _filteredLotsT.map((supplier: any) => supplier.id);
  const lot_RC_T = _filteredLotsT.map((supplier: any) => supplier.lot);
  const lot_qty_T = _filteredLotsT.map((supplier: any) => supplier.qty);
  const lot_sale_T = _filteredLotsT.map((supplier: any) => supplier.sale);


  // Using cached listItemByProductId instead of filter
  const act_lot0 = Number(listItem?.qty || 0);

  //console.log(list)

  //*******Cut Lot ************************* */
  const cut_lot = () => {
    // functional update + อ่านจำนวนจากแถวจริง (task.qty) แทน closure เก่า —
    // effect เพิ่มสินค้ามี await เช็คสต๊อกคั่น ถ้าใช้ list เก่า สแกน/แก้จำนวนที่แทรกจะถูกทับหาย
    setList((prevList) => prevList.map((task) => {
      if (task.id_product !== idF) return task;
      const act_lot0 = Number(task.qty || 0);
      return (
        {
          ...task,

          qty: Number(task.qty) + 1,
          discount: Number(task.discount),
          total: (Number(task.qty + 1) * (Number(task.diff))),
          cost: (Number(task.cost)),
          gift: Number(task.gift),
          totalgift: (Number(task.qty) + 1) * Number(task.gift),
          costtotal: (Number(task.qty) + 1) * Number(task.cost),
          sale_qty_lot1: act_lot0 + 1 > Number(lot_qty[0]) - Number(lot_sale[0]) ?
            Number(lot_qty[0]) :
            act_lot0 + 1 + Number(lot_sale[0]),

          sale_qty_lot2: act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1]) > Number(lot_qty[1]) - Number(lot_sale[1]) ?
            Number(lot_qty[1]) :
            act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1]) < 0 ? 0 :
              isNaN(act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1])) === true ? 0 :
                act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1])
          ,

          sale_qty_lot3: act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2]) > Number(lot_qty[2]) - Number(lot_sale[2]) ?
            Number(lot_qty[2]) :
            act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2]) < 0 ? 0 :
              isNaN(act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2])) === true ? 0 :
                act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2])
          ,

          qty_lot1: act_lot0 + 1 > (Number(lot_qty[0]) - Number(lot_sale[0])) ?
            Number(lot_qty[0]) - Number(lot_sale[0]) :
            act_lot0 + 1,

          qty_lot2: act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1]) > Number(lot_qty[1]) - Number(lot_sale[1]) ?
            Number(lot_qty[1]) - Number(lot_sale[1]) :
            act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1]) < 0 ?
              0 :
              isNaN(act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1])) === true ? 0 :
                act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1])
          ,

          qty_lot3: act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2]) > Number(lot_qty[2]) - Number(lot_sale[2]) ?
            Number(lot_qty[2]) - Number(lot_sale[2]) :
            act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2]) < 0 ? 0 :
              isNaN(act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2])) === true ? 0 :
                act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2])
          ,

          lot_receive2: act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1]) > Number(lot_qty[1]) ?
            lot_RC[1] :
            act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1]) < 0 ? "" :
              isNaN(act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1])) === true ? "" :

                act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1])
                  === 0 ? "" : lot_RC[1],

          lot_receive3: act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2]) > Number(lot_qty[2]) ?
            lot_RC[1] :
            act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2]) < 0 ? "" :
              isNaN(act_lot0 + 1 - Number(lot_qty[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2])) === true ? "" :

                act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2])
                  === 0 ? "" : lot_RC[2],
        }
      );
    }))
  }
  //  Qty Manual    
  const cut_lot_Price_manual_inline = (itemCode: string, newQty: string, itemUnit?: string) => {
    const qty = Number(newQty);
    // อนุญาตให้ขายเป็นจุดทศนิยมได้ (เช่น 0.5) — บล็อกเฉพาะค่าที่ไม่ใช่ตัวเลขหรือ <= 0
    if (isNaN(qty) || qty <= 0) return;

    // We need to get the lot info for this specific itemCode since the logic depends on it
    const lot_id_T = sortedRCData.filter((r: any) => r.itemcode === itemCode && (r.balance == null || r.qty > r.sale)).map((supplier: any) => supplier.id);
    const lot_RC_T = sortedRCData.filter((r: any) => r.itemcode === itemCode && (r.balance == null || r.qty > r.sale)).map((supplier: any) => supplier.lot);
    const lot_qty_T = sortedRCData.filter((r: any) => r.itemcode === itemCode && (r.balance == null || r.qty > r.sale)).map((supplier: any) => supplier.qty);
    const lot_sale_T = sortedRCData.filter((r: any) => r.itemcode === itemCode && (r.balance == null || r.qty > r.sale)).map((supplier: any) => supplier.sale);

    setList((prevList) => prevList.map((task) => (task.code_product === itemCode && !task.isPromoFree && (itemUnit === undefined || task.unit === itemUnit)) ?
      {
        ...task,

        qty: qty,
        total: qty * (Number(task.diff)),
        cost: Number(task.cost),
        costtotal: qty * Number(task.cost),
        gift: Number(task.gift),
        totalgift: qty * Number(task.gift),
        sale_qty_lot1: qty > Number(lot_qty_T[0]) - Number(lot_sale_T[0]) ?
          Number(lot_qty_T[0]) :
          qty + Number(lot_sale_T[0]),

        sale_qty_lot2: qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1]) > Number(lot_qty_T[1]) - Number(lot_sale_T[1]) ?
          Number(lot_qty_T[1]) :
          qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1]) < 0 ? 0 :
            isNaN(qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1])) === true ? 0 :
              qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1])
        ,

        sale_qty_lot3: qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2]) > Number(lot_qty_T[2]) - Number(lot_sale_T[2]) ?
          Number(lot_qty_T[2]) :
          qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2]) < 0 ? 0 :
            isNaN(qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2])) === true ? 0 :
              qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2])
        ,

        qty_lot1: qty > (Number(lot_qty_T[0]) - Number(lot_sale_T[0])) ?
          Number(lot_qty_T[0]) - Number(lot_sale_T[0]) :
          qty,

        qty_lot2: qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1]) > Number(lot_qty_T[1]) - Number(lot_sale_T[1]) ?
          Number(lot_qty_T[1]) - Number(lot_sale_T[1]) :
          qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1]) < 0 ?
            0 :
            isNaN(qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1])) === true ? 0 :
              qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1])
        ,

        qty_lot3: qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2]) > Number(lot_qty_T[2]) - Number(lot_sale_T[2]) ?
          Number(lot_qty_T[2]) - Number(lot_sale_T[2]) :
          qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2]) < 0 ? 0 :
            isNaN(qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2])) === true ? 0 :
              qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2])
        ,

        lot_receive2: qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1]) > Number(lot_qty_T[1]) ?
          lot_RC_T[1] :
          qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1]) < 0 ? "" :
            isNaN(qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1])) === true ? "" :

              qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1])
                === 0 ? "" : lot_RC_T[1],

        lot_receive3: qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2]) > Number(lot_qty_T[2]) ?
          lot_RC_T[1] :
          qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2]) < 0 ? "" :
            isNaN(qty - Number(lot_qty_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2])) === true ? "" :

              qty - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2])
                === 0 ? "" : lot_RC_T[2],
      }

      : task
    ));
  }

  // Ref ที่ชี้ไปยัง cut_lot_Price_manual_inline ล่าสุด เพื่อให้ toast เรียกใช้งานเวอร์ชันล่าสุดได้เสมอ
  const cutLotInlineRef = React.useRef(cut_lot_Price_manual_inline);
  React.useEffect(() => {
    cutLotInlineRef.current = cut_lot_Price_manual_inline;
  });

  // พา cursor กลับไปค้างช่องค้นหาสินค้า (input อยู่ใน body_pro_cus จึงอ้างผ่าน DOM)
  const focusProductSearchBox = () => {
    setTimeout(() => {
      document.querySelector<HTMLInputElement>('input[aria-label="ค้นหาสินค้า"]')?.focus();
    }, 60);
  };

  // แสดง toast หลังเพิ่มสินค้าลงรายการ พร้อมช่องแก้ไขจำนวน (Enter เพื่อยืนยัน)
  // ระหว่าง toast เปิด cursor ต้องค้างที่ช่องจำนวน — ยืนยัน/ปิด/หมดเวลาแล้วค่อยกลับช่องค้นหา
  const showProductAddedToast = (item: any) => {
    const code = String(item.code_product || "");
    const name = String(item.name_product || "");
    const unit = String(item.unit || "");
    const price = Number(item.diff ?? item.price ?? 0) || 0;
    const initialQty = Number(item.qty) || 1;

    toast.custom((tid: any) => (
      <ProductAddedToastContent
        productName={name}
        productCode={code}
        unit={unit}
        price={price}
        initialQty={initialQty}
        onSubmit={(qty) => {
          if (qty !== initialQty) {
            cutLotInlineRef.current(code, String(qty), unit);
          }
          // กดยืนยันจำนวน = สั่งซ่อม lot ของสินค้าตัวนี้ให้อัตโนมัติเช่นเดียวกับตอนสแกนบาร์โค้ด
          // (ไม่ await เพื่อให้ toast ปิดทันที ไม่หน่วงการขาย)
          void autoRepairLotForCode(code, Number(item.id_product) || null);
          toast.dismiss(tid);
          focusProductSearchBox();
        }}
        onClose={() => {
          toast.dismiss(tid);
          focusProductSearchBox();
        }}
      />
    ), { duration: 6000, onAutoClose: focusProductSearchBox });
  };

  const resolveProductSalePrice = (product: any) => productPriceByTier(product, paystore);

  // ราคาของหน่วยแปลงตามระดับราคาที่กำลังขายอยู่ (ชุดเดียวกับตอนสแกนบาร์โค้ดหน่วยแปลง)
  const resolveUnitConversionSalePrice = (unitConv: any) => unitConversionPriceByTier(unitConv, paystore);

  const getDrugSetProduct = (setItem: any) => {
    const productId = Number(setItem?.productId || setItem?.product?.id || 0);
    return productMap.get(productId) || productMapByCode.get(String(setItem?.code || "")) || setItem?.product || null;
  };

  // หน่วยแปลงที่ผูกไว้กับรายการในชุดยา (ไม่ผูก = ใช้หน่วยฐานของสินค้า)
  const getDrugSetUnitConversion = (setItem: any) => {
    const unitConversionId = Number(setItem?.unitConversionId || 0);
    if (!unitConversionId) return null;
    return unitConversionMapById.get(unitConversionId) || null;
  };

  // ราคาขายของรายการในชุด: ถ้าชุดกำหนดราคาไว้เองให้ใช้ราคานั้น ถ้าไม่ได้กำหนดก็คิดราคาปกติตามระดับราคา
  // หน่วยแปลงที่ยังไม่ได้ตั้งราคาของระดับราคานั้น → ใช้ราคาหน่วยฐาน x subQty แทนการขายที่ราคา 0
  const resolveDrugSetItemPrice = (setItem: any, product: any, unitConv: any) => {
    const priceOverride = setItem?.priceOverride;
    if (priceOverride !== null && priceOverride !== undefined && priceOverride !== "" && Number.isFinite(Number(priceOverride))) {
      return Number(priceOverride);
    }
    if (!unitConv) return resolveProductSalePrice(product);
    const unitPrice = resolveUnitConversionSalePrice(unitConv);
    if (unitPrice > 0) return unitPrice;
    return resolveProductSalePrice(product) * (Number(unitConv.subQty) || 1);
  };

  // จำนวนในชุดเป็นทศนิยมได้ (เช่น 0.5 แผง)
  const cleanDrugSetQty = (value: unknown) => {
    const qty = Number(value);
    return Number.isFinite(qty) && qty > 0 ? qty : 1;
  };

  const isHiddenSaleProduct = (product: any) => String(product?.Show || "").toLowerCase() === "true";

  const getSaleLotRows = (code: string) => sortedRCData.filter((r: any) => r.itemcode === code && (r.balance == null || Number(r.qty || 0) > Number(r.sale || 0)));

  // เลือกลอตที่ "วันที่รับ" (dateRC) ล่าสุด ให้ตรงกับหน้าสรุปยอดคงเหลือ
  // ถ้าวันที่รับเท่ากัน/ไม่มี → ใช้ลอตที่บันทึกล่าสุด (id มากกว่า) เป็นตัวตัดสิน
  const pickLatestLotByDateRC = (lots: any[]) => {
    if (!lots || lots.length === 0) return null;
    return lots.reduce((latest: any, current: any) => {
      const latestTime = new Date(latest?.dateRC || latest?.createDate || 0).getTime();
      const currentTime = new Date(current?.dateRC || current?.createDate || 0).getTime();
      if (currentTime > latestTime) return current;
      if (currentTime === latestTime && Number(current?.id || 0) > Number(latest?.id || 0)) return current;
      return latest;
    });
  };

  // ทุนที่ถูกบันทึกลงบิลจริงตอนกดชำระ — ใช้ทุนสุทธิหลังหักส่วนลดของล็อต (src/lib/lotCost.ts)
  // ไม่ใช่ newCost ดิบ ๆ ซึ่งเป็นทุนก่อนหักส่วนลดที่ผู้ขายให้มา
  const getLatestProductCost = (product: any, lotRows: any[]) => {
    const latestLot = pickLatestLotByDateRC(lotRows);
    const latestLotCost = lotUnitCost(latestLot);
    return latestLotCost > 0 ? latestLotCost : Number(product?.CostActual || 0);
  };

  // ราคาทุนของลอตที่รับเข้าล่าสุด (ไม่ดูว่ามียอดคงเหลือหรือไม่) สำหรับเช็คราคาขาย
  // ยึด "วันที่รับ" จริง (dateRC) ให้ตรงกับหน้าสรุปยอดคงเหลือ ไม่ใช่ลำดับวันที่บันทึกลงระบบ
  // ค่าเฉลี่ยของทุนสุทธิทุกล็อต เมื่อโหมด = average
  const getAbsoluteAverageCost = (code: string, product?: any) => {
    const allLots = sortedRCData.filter((r: any) => r.itemcode === code);
    // เปลี่ยนเฉพาะ "ที่มาของทุน" (newCost → ทุนสุทธิ) — เกณฑ์คัดค่าคงเดิมทุกประการ
    // ล็อตที่ทุนเป็น 0 ยังถูกนับในค่าเฉลี่ยเหมือนเดิม เพื่อไม่ให้ตัวเลขเตือนขยับโดยไม่ตั้งใจ
    const values = allLots
      .map((r: any) => lotUnitCost(r))
      .filter((v: any) => v !== null && v !== undefined && Number.isFinite(Number(v)))
      .map((v: any) => Number(v));
    if (values.length === 0) return Number(product?.CostActual || 0);
    const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
    return avg > 0 ? avg : Number(product?.CostActual || 0);
  };

  // ราคาทุนของลอตที่รับเข้าล่าสุด (ไม่ดูว่ามียอดคงเหลือหรือไม่) สำหรับเช็คราคาขาย
  // ยึด "วันที่รับ" จริง (dateRC) ให้ตรงกับหน้าสรุปยอดคงเหลือ ไม่ใช่ลำดับวันที่บันทึกลงระบบ
  // เมื่อโหมด = average จะใช้ราคาทุนเฉลี่ยแทน
  const getAbsoluteLatestCost = (code: string, product?: any) => {
    if (costPriceMode === 'average') return getAbsoluteAverageCost(code, product);
    const allLots = sortedRCData.filter((r: any) => r.itemcode === code);
    if (allLots.length === 0) return Number(product?.CostActual || 0);
    const latestLot = pickLatestLotByDateRC(allLots);
    const latestCost = lotUnitCost(latestLot);
    return latestCost > 0 ? latestCost : Number(product?.CostActual || 0);
  };

  const allocateSaleLots = (code: string, qtyValue: number) => {
    // จำนวนเป็นทศนิยมได้ (ชุดยากำหนดเศษส่วนได้) แต่ต้องมากกว่า 0 เสมอ
    const qty = cleanDrugSetQty(qtyValue);
    const lotRows = getSaleLotRows(code);
    let remainingQty = qty;
    const slots = [0, 1, 2].map((index) => {
      const lot = lotRows[index];
      const lotQty = Number(lot?.qty || 0);
      const lotSale = Number(lot?.sale || 0);
      const available = Math.max(0, lotQty - lotSale);
      const usedQty = Math.min(remainingQty, available);
      remainingQty = Math.max(0, remainingQty - usedQty);
      return {
        id: Number(lot?.id || 0),
        lot: usedQty > 0 ? String(lot?.lot || "") : "",
        qty: usedQty,
        stdQty: lotQty,
        saleQty: lotSale + usedQty,
      };
    });
    return { lotRows, slots };
  };

  const recalcSaleItemQty = (item: any, product: any, nextQtyValue: number) => {
    const nextQty = cleanDrugSetQty(nextQtyValue);
    const { slots, lotRows } = allocateSaleLots(String(item.code_product || product?.code || ""), nextQty);
    const itemCost = Number(item.cost ?? getLatestProductCost(product, lotRows) ?? 0);
    const itemDiff = Number(item.diff ?? item.price ?? resolveProductSalePrice(product) ?? 0);
    const itemGift = Number(item.gift || 0);
    return {
      ...item,
      qty: nextQty,
      total: nextQty * itemDiff,
      cost: itemCost,
      costtotal: nextQty * itemCost,
      totalgift: nextQty * itemGift,
      id_receive1: slots[0].id,
      lot_receive1: slots[0].lot,
      qty_lot1: slots[0].qty,
      std_qty_lot1: slots[0].stdQty,
      sale_qty_lot1: slots[0].saleQty,
      id_receive2: slots[1].id,
      lot_receive2: slots[1].lot,
      qty_lot2: slots[1].qty,
      std_qty_lot2: slots[1].stdQty,
      sale_qty_lot2: slots[1].saleQty,
      id_receive3: slots[2].id,
      lot_receive3: slots[2].lot,
      qty_lot3: slots[2].qty,
      std_qty_lot3: slots[2].stdQty,
      sale_qty_lot3: slots[2].saleQty,
    };
  };

  // จัดสรร lot ของแถวในบิลใหม่ หลังซ่อม lot อัตโนมัติและข้อมูล lot ชุดใหม่เข้า state แล้ว
  // (เลขล็อต/วันหมดอายุที่แสดงและที่บันทึกลงบิลจะได้ตรงกับ lot จริงหลังซ่อม)
  // ข้ามแถวของแถมและแถวหน่วยแปลง (subQty > 1) เพราะสองเคสนี้ไม่ได้จัดสรรจากหน่วยฐานตรง ๆ
  useEffect(() => {
    if (lotReallocQueue.length === 0) return;
    const codes = new Set(lotReallocQueue);
    setList((prevList) => prevList.map((item: any) => {
      const code = String(item.code_product || "");
      const qty = Number(item.qty || 0);
      if (!codes.has(code) || item.isPromoFree || Number(item.subQty || 1) !== 1 || !(qty > 0)) return item;
      return recalcSaleItemQty(item, productMapByCode.get(code), qty);
    }));
    setLotReallocQueue([]);
  }, [lotReallocQueue, dataRCFull]);

  const buildSaleItemFromDrugSetProduct = (product: any, qtyValue: number, setItem: any = null) => {
    const code = String(product?.code || "");
    const qty = cleanDrugSetQty(qtyValue);
    const { slots, lotRows } = allocateSaleLots(code, qty);
    const labelData = labelByCode.get(code);
    const giftData = giftByCode.get(code);
    // หน่วยแปลงของชุด: ราคา/ทุน/ค่าหยิบ คิดต่อ 1 หน่วยขาย (คูณ subQty) เหมือนตอนสแกนบาร์โค้ดหน่วยแปลง
    const unitConv = getDrugSetUnitConversion(setItem);
    const subQty = unitConv ? (Number(unitConv.subQty) || 1) : 1;
    const gift = Number(giftData?.gift || 0) * subQty;
    const cost = getLatestProductCost(product, lotRows) * subQty;
    const price = resolveDrugSetItemPrice(setItem, product, unitConv);
    const baseItem = {
      id: Number(product?.id || 0),
      company: localStorage.getItem("company_") || "",
      id_product: Number(product?.id || 0),
      code_product: code,
      name_product: String(product?.ProductName || ""),
      fixname: String(product?.fixname || ""),
      cetagory: String(product?.Category || ""),
      unit: unitConv ? String(unitConv.saleUnit || product?.Unit || "") : String(product?.Unit || ""),
      barcode: unitConv ? String(unitConv.Barcode || product?.Barcode || "") : String(product?.Barcode || ""),
      qty,
      price,
      gift,
      totalgift: qty * gift,
      cost,
      costtotal: qty * cost,
      discount: 0,
      diff: price,
      total: qty * price,
      subQty,
      // หน่วยย่อยยึดจากหน่วยฐานของสินค้าเสมอ (กันค่าที่ค้างใน UnitConversion.subUnit)
      subUnit: String(product?.Unit || (unitConv ? unitConv.subUnit : "") || ""),
      id_receive1: slots[0].id,
      lot_receive1: slots[0].lot,
      qty_lot1: slots[0].qty,
      std_qty_lot1: slots[0].stdQty,
      sale_qty_lot1: slots[0].saleQty,
      id_receive2: slots[1].id,
      lot_receive2: slots[1].lot,
      qty_lot2: slots[1].qty,
      std_qty_lot2: slots[1].stdQty,
      sale_qty_lot2: slots[1].saleQty,
      id_receive3: slots[2].id,
      lot_receive3: slots[2].lot,
      qty_lot3: slots[2].qty,
      std_qty_lot3: slots[2].stdQty,
      sale_qty_lot3: slots[2].saleQty,
      person: localStorage.getItem("person_") || "",
      statuss: "OK",
      label: true,
      indicatorlistS: labelData?.indicatorlistS || "",
      timeS: labelData?.timeS || "",
      useS: labelData?.useS || "",
      timeuseS: labelData?.timeuseS || "",
      keepS: labelData?.keepS || "",
      remarkS: labelData?.remarkS || "",
      type: "",
      name_customer: "",
      my_indicatorlistS: "",
      my_timeS: "",
      my_useS: "",
      my_timeuseS: "",
      my_keepS: "",
      my_remarkS: "",
      lo_indicatorlistS: "",
      lo_timeS: "",
      lo_useS: "",
      lo_timeuseS: "",
      lo_keepS: "",
      lo_remarkS: "",
      en_indicatorlistS: "",
      en_timeS: "",
      en_useS: "",
      en_timeuseS: "",
      en_keepS: "",
      en_remarkS: "",
      zh_indicatorlistS: "",
      zh_timeS: "",
      zh_useS: "",
      zh_timeuseS: "",
      zh_keepS: "",
      zh_remarkS: "",
      ru_indicatorlistS: "",
      ru_timeS: "",
      ru_useS: "",
      ru_timeuseS: "",
      ru_keepS: "",
      ru_remarkS: "",
      km_indicatorlistS: "",
      km_timeS: "",
      km_useS: "",
      km_timeuseS: "",
      km_keepS: "",
      km_remarkS: "",
      ko_indicatorlistS: "",
      ko_timeS: "",
      ko_useS: "",
      ko_timeuseS: "",
      ko_keepS: "",
      ko_remarkS: "",
      ja_indicatorlistS: "",
      ja_timeS: "",
      ja_useS: "",
      ja_timeuseS: "",
      ja_keepS: "",
      ja_remarkS: "",
      ms_indicatorlistS: "",
      ms_timeS: "",
      ms_useS: "",
      ms_timeuseS: "",
      ms_keepS: "",
      ms_remarkS: "",
      pic: product?.pic || "",
      childWeight: 0,
      childDoseMl: 0,
      childDoseTeaspoon: 0,
      childFrequency: 0,
      childDoseWarning: false,
    };
    return product?.concentration && product.concentration > 0 && globalChildWeight > 0
      ? calcPediatricForItem(baseItem, globalChildWeight, product)
      : baseItem;
  };

  useEffect(() => {
    if (!selectedDrugSet || drugSetSelectionCount <= 0) return;
    let cancelled = false;

    const addDrugSetToSale = async () => {
      const setItems = Array.isArray(selectedDrugSet.items) ? selectedDrugSet.items : [];
      const preparedItems: Array<{ product: any; qty: number; setItem: any }> = [];
      let skippedCount = 0;

      for (const setItem of setItems) {
        const product = getDrugSetProduct(setItem);
        if (!product || !product.id || isHiddenSaleProduct(product)) {
          skippedCount += 1;
          continue;
        }
        if (await shouldBlockNegativeStockProduct(product)) {
          skippedCount += 1;
          continue;
        }
        preparedItems.push({ product, qty: cleanDrugSetQty(setItem.qty), setItem });
      }

      if (cancelled) return;
      if (preparedItems.length === 0) {
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 14 }}>ไม่พบสินค้าที่พร้อมเพิ่มจากชุดสินค้า</div>);
        return;
      }

      setList((prevList) => {
        const nextList = [...prevList];
        preparedItems.forEach(({ product, qty, setItem }) => {
          const unitConv = getDrugSetUnitConversion(setItem);
          // สินค้าเดียวกันคนละหน่วย = คนละแถวในบิล จึงจับคู่แถวเดิมด้วยสินค้า + หน่วย
          const unitForItem = unitConv ? String(unitConv.saleUnit || product.Unit || "") : String(product.Unit || "");
          const existingIndex = nextList.findIndex((item: any) => Number(item.id_product) === Number(product.id) && String(item.unit || "") === unitForItem);
          if (existingIndex >= 0) {
            const existingItem = nextList[existingIndex];
            nextList[existingIndex] = recalcSaleItemQty(existingItem, product, Number(existingItem.qty || 0) + qty);
          } else {
            nextList.push(buildSaleItemFromDrugSetProduct(product, qty, setItem));
          }
        });
        return nextList;
      });

      const skippedText = skippedCount > 0 ? ` (ข้าม ${skippedCount} รายการ)` : "";
      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 14 }}>เพิ่มชุดสินค้า {selectedDrugSet.name} แล้ว {preparedItems.length} รายการ{skippedText}</div>, { duration: 2500 });
    };

    addDrugSetToSale();
    return () => {
      cancelled = true;
    };
  }, [drugSetSelectionCount]);

  // QtyInput Sub-component for Enter/Blur confirmation
  const QtyInput = ({ item, changepay, onConfirm }: { item: any, changepay: string, onConfirm: (code: string, qty: string, unit?: string) => void }) => {
    const [localQty, setLocalQty] = useState(String(item.qty));
    const lastKeyTimeRef = useRef(Date.now());

    useEffect(() => {
      setLocalQty(String(item.qty));
    }, [item.qty]);

    return (
      <input
        disabled={changepay === "1"}
        className={styles.qtyTextInput}
        type="text"
        value={localQty}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          lastKeyTimeRef.current = Date.now();
          // อนุญาตเฉพาะตัวเลขและจุดทศนิยมจุดเดียว (รองรับการขายเป็นเศษส่วน เช่น 0.5)
          let v = e.target.value.replace(/[^0-9.]/g, '');
          const firstDot = v.indexOf('.');
          if (firstDot !== -1) {
            v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
          }
          setLocalQty(v);
        }}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const timeSinceLastKey = Date.now() - lastKeyTimeRef.current;
            // Ignore Enter if it comes too fast (likely from barcode scanner)
            if (timeSinceLastKey < 100) {
              e.preventDefault();
              return;
            }
            onConfirm(item.code_product, localQty, item.unit);
            (e.target as HTMLInputElement).blur();
          } else {
            lastKeyTimeRef.current = Date.now();
          }
        }}
        onBlur={() => onConfirm(item.code_product, localQty, item.unit)}
      />
    );
  };


  // Edit Price (temporary per-transaction)
  const [editedPriceNew, setEditedPriceNew] = useState<string>("");

  const cut_lot_Price_edit = () => {
    return (
      setList(list.map((task) => (task.code_product === editedcode && (editedunit === "" || task.unit === editedunit)) ?
        {
          ...task,
          price: Number(editedPriceNew),
          diff: (Number(editedPriceNew) - Number(task.discount)),
          total: Number(task.qty) * (Number(editedPriceNew) - Number(task.discount)),
        }
        : task
      )))
  }

  // Discount
  const cut_lot_Discount_manual = () => {

    return (
      setList(list.map((task) => (task.code_product === editedcode && (editedunit === "" || task.unit === editedunit)) ?
        {
          ...task,

          discount: Number(priceDis),
          diff: (Number(task.price) - Number(priceDis)),
          total: Number(task.qty) * (Number(task.price) - Number(priceDis)),
        }

        : task
      )))
  }









  useEffect(() => {

    const fetchPosts = async () => {
      //    console.log(alllabel)

      try {

        if (!isNaN(idF) && idF !== 0 && selectedProduct && await shouldBlockNegativeStockProduct(selectedProduct)) {
          return;
        }


        //*****List ****** */
        {
          (isNaN(idF) || idF === 0) ?
            setList((prevList) => [...prevList])
            :
            idF === qty_e ?
              cut_lot()

              :
              (() => {
                if (!selectedProduct) return;
                // Auto-set product info panel
                setcodeproductS(code_product_e);
                setcostS(String(Number(cost) === 0 || isNaN(Number(cost)) ? Number(cost_e) : Number(cost)));

                const unitCost_e = Number(cost) === 0 || isNaN(Number(cost)) === true ? Number(cost_e) : Number(cost);
                const latestUnitCost_e = getAbsoluteLatestCost(code_product_e, selectedProduct);
                if (!validateSalePrice(name_product_e, Number(price_e), unitCost_e, latestUnitCost_e)) return;

                const newItem = {
                  id: idF,
                  company: (localStorage.getItem("company_") || ""),
                  id_product: id_product_e,
                  code_product: code_product_e,
                  name_product: name_product_e,
                  fixname: fixname_e,
                  cetagory: Category_e,
                  unit: unit_e,
                  barcode: barcode_e,
                  qty: 1,
                  price: price_e,
                  gift: gift_p,
                  totalgift: gift_p,
                  cost: Number(cost) === 0 || isNaN(Number(cost)) === true ? Number(cost_e) : Number(cost),
                  costtotal: Number(cost) === 0 || isNaN(Number(cost)) === true ? Number(cost_e) : Number(cost),
                  discount: 0,
                  diff: price_e,
                  total: price_e,
                  id_receive1: lot_id[0] === undefined ? 0 : Number(lot_id[0]),
                  lot_receive1: lot_RC[0] === undefined ? "" : lot_RC[0],
                  qty_lot1: 1,
                  std_qty_lot1: lot_qty[0] === undefined ? 0 : Number(lot_qty[0]),
                  sale_qty_lot1: 1 + Number(lot_sale[0]),
                  id_receive2: lot_id[1] === undefined ? 0 : Number(lot_id[1]),
                  lot_receive2: isNaN(lot_RC[1]) === true ? "" : "",
                  qty_lot2: isNaN(lot_qty[1]) === true ? 0 : 0,
                  std_qty_lot2: lot_qty[1] === undefined ? 0 : Number(lot_qty[1]),
                  sale_qty_lot2: isNaN(lot_sale[1]) === true ? 0 : 0 + Number(lot_sale[1]),
                  id_receive3: lot_id[2] === undefined ? 0 : Number(lot_id[2]),
                  lot_receive3: isNaN(lot_RC[2]) === true ? "" : "",
                  qty_lot3: isNaN(lot_qty[2]) === true ? 0 : 0,
                  std_qty_lot3: lot_qty[2] === undefined ? 0 : Number(lot_qty[2]),
                  sale_qty_lot3: isNaN(lot_sale[2]) === true ? 0 : 0 + Number(lot_sale[2]),
                  person: String(localStorage.getItem("person_") || ""),
                  statuss: "OK",
                  label: true,
                  indicatorlistS: String(label_inticator),
                  timeS: String(label_timeS),
                  useS: String(label_useS),
                  timeuseS: String(label_timeuseS),
                  keepS: String(label_keepS),
                  remarkS: String(label_remarkS),
                  my_indicatorlistS: String(my_label_inticator),
                  my_timeS: String(my_label_timeS),
                  my_useS: String(my_label_useS),
                  my_timeuseS: String(my_label_timeuseS),
                  my_keepS: String(my_label_keepS),
                  my_remarkS: String(my_label_remarkS),
                  lo_indicatorlistS: String(lo_label_inticator),
                  lo_timeS: String(lo_label_timeS),
                  lo_useS: String(lo_label_useS),
                  lo_timeuseS: String(lo_label_timeuseS),
                  lo_keepS: String(lo_label_keepS),
                  lo_remarkS: String(lo_label_remarkS),
                  en_indicatorlistS: String(en_label_inticator),
                  en_timeS: String(en_label_timeS),
                  en_useS: String(en_label_useS),
                  en_timeuseS: String(en_label_timeuseS),
                  en_keepS: String(en_label_keepS),
                  en_remarkS: String(en_label_remarkS),
                  zh_indicatorlistS: String(zh_label_inticator),
                  zh_timeS: String(zh_label_timeS),
                  zh_useS: String(zh_label_useS),
                  zh_timeuseS: String(zh_label_timeuseS),
                  zh_keepS: String(zh_label_keepS),
                  zh_remarkS: String(zh_label_remarkS),
                  ru_indicatorlistS: String(ru_label_inticator),
                  ru_timeS: String(ru_label_timeS),
                  ru_useS: String(ru_label_useS),
                  ru_timeuseS: String(ru_label_timeuseS),
                  ru_keepS: String(ru_label_keepS),
                  ru_remarkS: String(ru_label_remarkS),
                  km_indicatorlistS: String(km_label_inticator),
                  km_timeS: String(km_label_timeS),
                  km_useS: String(km_label_useS),
                  km_timeuseS: String(km_label_timeuseS),
                  km_keepS: String(km_label_keepS),
                  km_remarkS: String(km_label_remarkS),
                  ko_indicatorlistS: "",
                  ko_timeS: "",
                  ko_useS: "",
                  ko_timeuseS: "",
                  ko_keepS: "",
                  ko_remarkS: "",
                  ja_indicatorlistS: "",
                  ja_timeS: "",
                  ja_useS: "",
                  ja_timeuseS: "",
                  ja_keepS: "",
                  ja_remarkS: "",
                  ms_indicatorlistS: "",
                  ms_timeS: "",
                  ms_useS: "",
                  ms_timeuseS: "",
                  ms_keepS: "",
                  ms_remarkS: "",
                  pic: pic_e,
                  childWeight: 0,
                  childDoseMl: 0,
                  childDoseTeaspoon: 0,
                  childFrequency: 0,
                  childDoseWarning: false,
                };

                // Check if product is pediatric liquid (has concentration set)
                if (selectedProduct?.concentration && selectedProduct.concentration > 0) {
                  if (globalChildWeight > 0) {
                    const calculatedItem = calcPediatricForItem(newItem, globalChildWeight, selectedProduct);
                    // functional update — ห้ามใช้ [...list, item] เพราะ list เป็น closure เก่า
                    // (มี await เช็คสต๊อกคั่นก่อนหน้า สแกน/แก้จำนวนที่แทรกระหว่างนั้นจะถูกทับหาย)
                    setList((prevList) => [...prevList, calculatedItem]);
                    showProductAddedToast(newItem);
                  } else {
                    setPendingPediatricItem({ ...newItem, _product: selectedProduct });
                    setShowPediatricModal(true);
                  }
                } else {
                  setList((prevList) => [...prevList, newItem]);
                  showProductAddedToast(newItem);
                }
              })()
        }




      } catch (error) {
        if (!isAbortError(error)) console.error(error)
      }
    }

    fetchPosts()
    localStorage.setItem("itemlist", String(list.length))




    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idF, selectCount])

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const modal1 = useDisclosure()
  const modal2 = useDisclosure()
  const modalPrice = useDisclosure()
  const modalUnitChange = useDisclosure()

  // Unit Change Modal States
  interface UnitOption {
    id: number;
    productCode: string;
    qty: number;
    saleUnit: string;
    subQty: number;
    subUnit: string;
    price: number;
    priceWholesale?: number;
    priceOnline?: number;
    priceA?: number;
    priceB?: number;
    priceC?: number;
    priceD?: number;
    priceE?: number;
    priceF?: number;
    priceG?: number;
    priceH?: number;
    isBase?: boolean;
  }
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([])
  const [selectedUnitItem, setSelectedUnitItem] = useState<Task | null>(null)

  // Fetch unit conversion data for a product
  const fetchUnitConversions = async (productCode: string, item: Task) => {
    const companyS = localStorage.getItem("company_") || "";
    try {
      // Get base unit from Datalist
      const datalistRes = await axios.get(`/api/${apidatalist}?company=${companyS}&code=${productCode}`);
      const datalistItem = datalistRes.data[0];

      // Get unit conversions
      const unitRes = await axios.get(`/api/unitconversion?company=${companyS}&productCode=${productCode}`);
      const unitConversions = unitRes.data;

      const options: UnitOption[] = [];

      // Row 1: Base unit from Datalist
      if (datalistItem) {
        options.push({
          id: 0,
          productCode: productCode,
          qty: 1,
          saleUnit: datalistItem.Unit || '',
          subQty: 1,
          subUnit: datalistItem.Unit || '',
          price: datalistItem.price || 0,
          priceWholesale: datalistItem.wholesaleprice || 0,
          priceOnline: datalistItem.online || 0,
          priceA: datalistItem.PriceA || 0,
          priceB: datalistItem.PriceB || 0,
          priceC: datalistItem.PriceC || 0,
          priceD: datalistItem.PriceD || 0,
          priceE: datalistItem.PriceE || 0,
          priceF: datalistItem.PriceF || 0,
          priceG: datalistItem.PriceG || 0,
          priceH: datalistItem.PriceH || 0,
          isBase: true
        });
      }

      // Row 2+: Unit conversions from UnitConversion model
      unitConversions.forEach((uc: any) => {
        options.push({
          id: uc.id,
          productCode: uc.productCode,
          qty: uc.qty || 1,
          saleUnit: uc.saleUnit || '',
          subQty: uc.subQty || 1,
          // หน่วยย่อยยึดจากหน่วยฐานของสินค้าเสมอ (เหมือนหน้าข้อมูลสินค้าที่ล็อกช่องนี้ไว้)
          // กันค่าที่ค้างใน UnitConversion.subUnit ทำให้แสดงไม่ตรงกับข้อมูลสินค้า
          subUnit: (datalistItem?.Unit) || uc.subUnit || '',
          price: uc.priceRetail || 0,
          priceWholesale: uc.priceWholesale || 0,
          priceOnline: uc.priceOnline || 0,
          priceA: uc.priceA || 0,
          priceB: uc.priceB || 0,
          priceC: uc.priceC || 0,
          priceD: uc.priceD || 0,
          priceE: uc.priceE || 0,
          priceF: uc.priceF || 0,
          priceG: uc.priceG || 0,
          priceH: uc.priceH || 0,
          isBase: false
        });
      });

      setUnitOptions(options);
      setSelectedUnitItem(item);
      modalUnitChange.onOpen();
    } catch (error) {
      console.error("Error fetching unit conversions:", error);
    }
  }

  // Handle unit selection
  const handleUnitSelect = (unitOption: UnitOption) => {
    if (!selectedUnitItem) return;

    // Update the item in the list with new unit and price based on paystore
    setList(list.map((task) => {
      if (task.id === selectedUnitItem.id) {
        let newPrice = unitOption.price;
        if (paystore === "ขายส่ง") newPrice = unitOption.priceWholesale || 0;
        else if (paystore === "สมาชิก") newPrice = (unitOption.priceOnline || 0) > 0 ? (unitOption.priceOnline || 0) : unitOption.price;
        else if (paystore === "ราคา A") newPrice = unitOption.priceA || 0;
        else if (paystore === "ราคา B") newPrice = unitOption.priceB || 0;
        else if (paystore === "ราคา C") newPrice = unitOption.priceC || 0;
        else if (paystore === "ราคา D") newPrice = unitOption.priceD || 0;
        else if (paystore === "ราคา E") newPrice = unitOption.priceE || 0;
        else if (paystore === "ราคา F") newPrice = unitOption.priceF || 0;
        else if (paystore === "ราคา G") newPrice = unitOption.priceG || 0;
        else if (paystore === "ราคา H") newPrice = unitOption.priceH || 0;

        const newDiff = newPrice - task.discount;
        const newTotal = task.qty * newDiff; // จำนวนสินค้า (qty) * ราคาใหม่ (diff)
        // ราคาทุนต่อหน่วยฐาน (เช่น ต่อเม็ด) = ราคาทุนปัจจุบัน / อัตราแปลงหน่วยปัจจุบัน
        const baseUnitCost = Number(task.cost || 0) / Number(task.subQty || 1);
        // ราคาทุนของหน่วยใหม่ = ราคาทุนต่อหน่วยฐาน x subQty ของหน่วยใหม่
        const newCost = baseUnitCost * Number(unitOption.subQty || 1);
        // ค่าหยิบต่อหน่วยฐาน = ค่าหยิบปัจจุบัน / อัตราแปลงหน่วยปัจจุบัน
        const baseUnitGift = Number(task.gift || 0) / Number(task.subQty || 1);
        // ค่าหยิบของหน่วยใหม่ = ค่าหยิบต่อหน่วยฐาน x subQty ของหน่วยใหม่
        const newGift = baseUnitGift * Number(unitOption.subQty || 1);
        return {
          ...task,
          unit: unitOption.saleUnit,
          price: newPrice,
          diff: newDiff,
          total: newTotal,
          cost: newCost,
          costtotal: task.qty * newCost,
          gift: newGift,
          totalgift: task.qty * newGift,
          subQty: unitOption.subQty,
          subUnit: unitOption.subUnit
        };
      }
      return task;
    }));

    modalUnitChange.onClose();
  }



  // Get Item*******************************************************************************
  const [dataitem, setdataitem] = useState<any[]>([])
  const [codeproductS, setcodeproductS] = useState('')
  const selectedSideProduct = useMemo(() => {
    if (!codeproductS) return null;
    return dataitem.find((supplier: any) => String(supplier.code) === String(codeproductS)) || null;
  }, [dataitem, codeproductS]);
  const selectedSideProductImage = getRenderableProductImage(selectedSideProduct?.pic);


  useEffect(() => {

    const useMyHook = async () => {
      try {
        DetailItem()
        DetailItemRC()
        fetchGet_Balance()
        LabelData()
      } catch (e) {
        console.error(e);
      }
    }

    useMyHook()
  }, [Number(codeproductS)])

  const DetailItem = async () => {
    let companyS = (localStorage.getItem("company_") || "")

    try {
      const res = await axios.get(`/api/${apidatalist}?company=${companyS}&code=${codeproductS}`)

      setdataitem(res.data)


    } catch (error) {
      if (!isAbortError(error)) console.error(error)
    }
  }

  const DetailItemRC = async () => {
    let companyS = (localStorage.getItem("company_") || "")

    try {
      const resitemRC = await axios.get(`/api/${apidataitemlist}?company=${companyS}&itemcode=${codeproductS}`)
      // const resRC = await axios.get(`/api/${apis}?company=${companyS}`)
      setdateitemRC(resitemRC.data)
      //  setdateRC(resRC.data)
      // console.log(resitemRC.data)
    } catch (error) {
      if (!isAbortError(error)) console.error(error)
    }
  }

  //Get Label Data
  const LabelData = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apilabeldata}?company=${companyS}&code=${codeproductS}`)
      res.data[0] !== undefined ? setlabelitem(res.data[0]) : setlabelitem(initialValues7)

    } catch (error) {
      if (!isAbortError(error)) console.error(error)
    }




  }

  //******************Get Costomer ************************************************* */



  const [open, setOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<{ value: string, label: string } | null>(null)
  const [items, setFixname] = useState<{ value: string, label: string }[]>([]);
  const [searchname, setPosts] = useState([])

  // แจ้งเตือนข้อมูลสำคัญของลูกค้า (โรคประจำตัว / แพ้ยา / ข้อมูลเพิ่มเติม) เมื่อกดเลือก
  // เก็บ state ไว้ที่ระดับ BodyTabSale (parent) เพราะ <Search_Cus /> จะถูก remount เมื่อ parent re-render
  const [cusAlert, setCusAlert] = useState<{ names: string; congenital: string; allergies: any[]; moreInfo: string } | null>(null);
  const cusAlertBtnRef = useRef<HTMLButtonElement>(null);

  // state ของ modal ค้นหาลูกค้า / สมัครสมาชิก — ต้องอยู่ที่ระดับ parent ด้วยเหตุผลเดียวกับ cusAlert
  // (ถ้าประกาศไว้ใน <Search_Cus /> จะถูกรีเซ็ตทุกครั้งที่ parent re-render เช่นตอน seachNames() เรียก setPosts())
  const [show, setShow] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // ค่าที่ถือว่า "ไม่มีข้อมูล" ไม่ต้องแจ้งเตือน
  const isBlankInfo = (v: any) => {
    const t = String(v || "").trim().toLowerCase();
    return t === "" || t === "-" || t === "ไม่มี" || t === "ไม่มียา" || t === "ไม่มีแพ้ยา" || t === "none" || t === "n/a";
  };

  const warnCustomerInfo = (post: any) => {
    const congenital = isBlankInfo(post?.congenitalDisease) ? "" : String(post.congenitalDisease).trim();
    const allergies = Array.isArray(post?.drugallergys)
      ? post.drugallergys.filter((d: any) => !isBlankInfo(d?.drugallergy) || !isBlankInfo(d?.remark))
      : [];
    const moreInfo = isBlankInfo(post?.moreInfo) ? "" : String(post.moreInfo).trim();
    if (congenital || allergies.length > 0 || moreInfo) {
      setCusAlert({ names: String(post?.names || ""), congenital, allergies, moreInfo });
    }
  };

  // ปิดด้วย Enter (รับทราบ) หรือ Escape + โฟกัสปุ่มรับทราบ
  useEffect(() => {
    if (!cusAlert) return;
    cusAlertBtnRef.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); setCusAlert(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cusAlert]);

  const initialValues4 = {
    names: "",
    totalPoint: "",
    id_main: "",
    id_costomer: "",
    code_costomer: "",
    name_customer: "",
    group_price: "",
    promotion: "",
    pay: "",
    bill: "",
    total: "",
    discount: "",
    sumtotal: "",
    addreward: "",
    usereward: "",
    receivebaht: "",
    person: "",
    statuss: "",
    taxnumber: "",

    qt_date: "",
    qt_enddate: "",
    qt_credit: "",
    qt_number: "",
    qt_orderNo: "",
    qt_status: "",
    qt_person: "",
    qt_remark: "",

    bl_date: "",
    bl_enddate: "",
    bl_credit: "",
    bl_number: "",
    bl_orderNo: "",
    bl_status: "",
    bl_person: "",
    bl_remark: "",

    inv_date: "",
    inv_enddate: "",
    inv_credit: "",
    inv_number: "",
    inv_orderNo: "",
    inv_status: "",
    inv_person: "",
    inv_remark: "",

    re_date: "",
    re_enddate: "",
    re_credit: "",
    re_number: "",
    re_orderNo: "",
    re_status: "",
    re_person: "",
    re_remark: "",

    followup: "",
    solution: "",
    id_history: "",
    count: "",
    statusH: "",
    remark: "",
    cashAmount: "",
    transferAmount: "",
    discountReason: "",
    payment_provider: "promptpay"
  };

  const [alldatalist, setatalist] = useState(initialValues4)



  const seachNames = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apicustomer}?company=${companyS}&fields=list`)
      setPosts(res.data)

    } catch (error) {
      if (!isAbortError(error)) console.error(error)
    }
  }

  const id_cus = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.id))
  const code_cus = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.code))
  const name_cus = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.names))
  const address_cus = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.address))
  const numbertax_cus = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.numbertax))
  const tel_cus = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.tel))
  const total_cus = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.totalPoint))
  const drug_cus = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.drugallergy))
  const congen_cus = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.congenitalDisease))
  const moreInfo_cus = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.moreInfo))
  const totalPont = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.totalPoint))
  const toFiniteNumber = (value: unknown, fallback = 0) => {
    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? numericValue : fallback
  }
  const toSafeInteger = (value: unknown, fallback = 0) => {
    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? Math.trunc(numericValue) : fallback
  }
  const getStoredNumber = (key: string, fallback = 0) => {
    if (typeof window === "undefined") return fallback
    return toFiniteNumber(localStorage.getItem(key), fallback)
  }
  const rawLevelPrice_cus = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.levelPrice || ""))
  const levelPrice_cus = normalizePriceTier(rawLevelPrice_cus)
  const hasConfiguredCustomerLevelPrice = rawLevelPrice_cus.trim() !== "" && rawLevelPrice_cus.trim() === levelPrice_cus
  const normalizedMemberDiscountPercent = Number.isFinite(Number(memberDiscountPercentS)) ? Math.min(100, Math.max(0, Number(memberDiscountPercentS))) : 2
  const hasSelectedMemberCustomer = Number(id_cus || 0) > 0 && name_cus.trim() !== ""
  const isMemberDiscountActive = memberDiscountEnabledS && normalizedMemberDiscountPercent > 0 && hasSelectedMemberCustomer
  const isMemberDiscountEligibleItem = (item: any) => {
    const product = productMap.get(item.id_product) || productMapByCode.get(item.code_product)
    const eligibleValue = product?.memberDiscountEligible
    return eligibleValue === undefined || eligibleValue === null || eligibleValue === true || String(eligibleValue) === "true"
  }
  const roundMemberDiscountAmount = (value: number) => Math.round(Number(value || 0))
  const formatMemberDiscountAmount = (value: number) => roundMemberDiscountAmount(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  const getMemberDiscountLineKey = (item: any) => `${item.id || ""}-${item.id_product || ""}-${item.code_product || ""}-${item.unit || ""}`
  const calcRawItemMemberDiscount = (item: any) => {
    if (!isMemberDiscountActive || !isMemberDiscountEligibleItem(item)) return 0
    const lineTotal = Number(item.total || 0)
    if (!Number.isFinite(lineTotal) || lineTotal <= 0) return 0
    return Number(((lineTotal * normalizedMemberDiscountPercent) / 100).toFixed(1))
  }
  const memberDiscountEntries = list.map((item, index) => {
    const rawDiscount = calcRawItemMemberDiscount(item)
    const baseDiscount = Math.floor(rawDiscount)
    return {
      key: getMemberDiscountLineKey(item),
      rawDiscount,
      baseDiscount,
      fraction: rawDiscount - baseDiscount,
      index,
    }
  })
  const memberDiscountTotal = roundMemberDiscountAmount(memberDiscountEntries.reduce((acc, item) => acc + item.rawDiscount, 0))
  const memberDiscountBaseTotal = memberDiscountEntries.reduce((acc, item) => acc + item.baseDiscount, 0)
  const memberDiscountExtraKeys = new Set(
    [...memberDiscountEntries]
      .filter((item) => item.rawDiscount > 0)
      .sort((a, b) => b.fraction - a.fraction || b.rawDiscount - a.rawDiscount || a.index - b.index)
      .slice(0, Math.max(0, memberDiscountTotal - memberDiscountBaseTotal))
      .map((item) => item.key)
  )
  const memberDiscountLineMap = new Map(
    memberDiscountEntries.map((item) => [item.key, item.rawDiscount > 0 ? item.baseDiscount + (memberDiscountExtraKeys.has(item.key) ? 1 : 0) : 0])
  )
  const calcItemMemberDiscount = (item: any) => memberDiscountLineMap.get(getMemberDiscountLineKey(item)) || 0
  const formatSaleAmount = (value: number) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  const calcItemNetUnitPrice = (item: any) => {
    const unitPrice = Number(item.diff ?? item.price ?? 0)
    const qty = Number(item.qty || 0)
    const lineMemberDiscount = calcItemMemberDiscount(item)
    if (!Number.isFinite(unitPrice) || lineMemberDiscount <= 0 || !Number.isFinite(qty) || qty <= 0) return unitPrice
    return roundMemberDiscountAmount(unitPrice - (lineMemberDiscount / qty))
  }
  const calcItemNetTotal = (item: any) => {
    const lineMemberDiscount = calcItemMemberDiscount(item)
    if (lineMemberDiscount <= 0) return Number(item.total || 0)
    return roundMemberDiscountAmount(Number(item.total || 0) - lineMemberDiscount)
  }

  //**********ระดับราคาขายรายสินค้า (สิทธิ์ B5)************************************************/
  // อ่านสิทธิ์ครั้งเดียวหลัง mount เพื่อให้ HTML ฝั่ง server กับ client ตรงกัน (กัน hydration error)
  const [canEditItemPriceTier, setCanEditItemPriceTier] = useState(false)
  useEffect(() => { setCanEditItemPriceTier(isItemPriceTierEditable()) }, [])

  const modalPriceTier = useDisclosure()
  const [priceTierItem, setPriceTierItem] = useState<Task | null>(null)

  // ระดับราคาที่รายการนี้ใช้อยู่ — ยังไม่เคยปรับเอง = ใช้ระดับราคาของทั้งบิล
  const getItemPriceTier = (item: any): PriceTier => normalizePriceTier(item?.priceTier || paystore)

  // ย่อชื่อให้พอดีช่องในตาราง (ราคา A → A)
  const formatPriceTierShort = (tier: PriceTier) => tier.startsWith("ราคา ") ? `ราคา ${tier.slice(5)}` : tier

  // หน่วยแปลงของรายการในบิล (ไม่พบ = ขายด้วยหน่วยฐานของสินค้า)
  const findItemUnitConversion = (item: any) =>
    unitConversionData.find((uc: any) =>
      String(uc.productCode) === String(item?.code_product || "") &&
      String(uc.saleUnit || "") === String(item?.unit || "")) || null

  const resolveItemPriceByTier = (item: any, tier: PriceTier): number => {
    const product = productMap.get(item?.id_product) || productMapByCode.get(item?.code_product) || null
    const unitConv = findItemUnitConversion(item)
    if (!unitConv) return productPriceByTier(product, tier)
    const unitPrice = unitConversionPriceByTier(unitConv, tier)
    // หน่วยแปลงที่ยังไม่ได้ตั้งราคาระดับนี้ → เทียบจากราคาหน่วยฐาน x จำนวนย่อย แทนการขายที่ราคา 0
    return unitPrice > 0 ? unitPrice : productPriceByTier(product, tier) * (Number(unitConv.subQty) || 1)
  }

  const openPriceTierPicker = (item: Task) => {
    setPriceTierItem(item)
    modalPriceTier.onOpen()
  }

  // useBillDefault = ล้างค่าที่ปรับเอง กลับไปผูกกับระดับราคาของทั้งบิล
  const applyItemPriceTier = (tier: PriceTier, useBillDefault = false) => {
    const target = priceTierItem
    if (!target) return
    const newPrice = resolveItemPriceByTier(target, tier)
    if (!(newPrice > 0)) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 14 }}>ยังไม่ได้ตั้ง{tier} ของสินค้านี้</div>)
      return
    }
    setList(prevList => prevList.map((task) =>
      (task.id === target.id && task.unit === target.unit)
        ? {
          ...task,
          price: newPrice,
          priceTier: useBillDefault ? undefined : tier,
          diff: newPrice - Number(task.discount || 0),
          total: Number(task.qty) * (newPrice - Number(task.discount || 0)),
        }
        : task
    ))
    modalPriceTier.onClose()
    toast.success(
      <div style={{ fontFamily: "Kanit", fontSize: 14 }}>{target.name_product} → {tier} {formatSaleAmount(newPrice)} บาท</div>,
      { duration: 2000 }
    )
  }

  //**********โปรโมชั่นสินค้า (ProductPromotion)************************************************/
  // โปรที่ใช้งานได้ตอนนี้ ต่อรหัสสินค้า: แยกเป็นโปรส่วนลด และโปรของแถม
  // เลือกโปรที่ระบุระดับราคาตรงกับที่ขายอยู่ก่อน แล้วค่อย fallback เป็น "ทุกระดับราคา"
  const productPromoByCode = useMemo(() => {
    const map = new Map<string, { discount?: any; freebie?: any }>();
    const candidates = (Array.isArray(productPromoS) ? productPromoS : [])
      .filter((p: any) => isPromoActiveNow(p) && promoMatchesTier(p, paystore));
    candidates.forEach((p: any) => {
      const code = String(p.code_product || "");
      if (!code) return;
      const entry = map.get(code) || {};
      const slot = String(p.promo_type) === "freebie" ? "freebie" : "discount";
      const current = (entry as any)[slot];
      const isExactTier = (x: any) => String(x?.price_tier || "") === paystore;
      if (!current || (!isExactTier(current) && isExactTier(p)) || (isExactTier(current) === isExactTier(p) && Number(p.id) > Number(current.id))) {
        (entry as any)[slot] = p;
      }
      map.set(code, entry);
    });
    return map;
  }, [productPromoS, paystore]);

  // โปรของรายการขายนี้ (ต้องขายหน่วยเดียวกับที่ตั้งโปรไว้)
  const getItemPromos = (item: any) => {
    const entry = productPromoByCode.get(String(item.code_product || ""));
    if (!entry) return {};
    const unitOk = (p: any) => !p?.unit || String(item.unit || "") === String(p.unit);
    return {
      discount: entry.discount && unitOk(entry.discount) ? entry.discount : undefined,
      freebie: entry.freebie && unitOk(entry.freebie) ? entry.freebie : undefined,
    };
  };

  // เกลี่ยส่วนลดโปรลงในรายการขายอัตโนมัติ (คงส่วนลดที่พนักงานกดเองไว้)
  // - โปรส่วนลด: ครบเงื่อนไข → ลดต่อหน่วยตามที่ตั้ง (%, บาท/หน่วย หรือเฉลี่ยจากลดทั้งรายการ)
  // - ของแถมที่กดรับแล้ว (promo_free_qty): เฉลี่ยราคาให้จำนวนแถมเป็น 0 บาท
  useEffect(() => {
    setList((prevList) => {
      let changed = false;
      const nextList = prevList.map((item: any) => {
        const price = Number(item.price || 0);
        const qty = Number(item.qty || 0);
        const promos = getItemPromos(item);
        let freeGiven = Number(item.promo_free_qty || 0);
        // จำนวนแถมต้องไม่เกินสิทธิ์ปัจจุบัน (กันกรณีลดจำนวนซื้อภายหลัง หรือปิดโปรไปแล้ว)
        if (freeGiven > 0) {
          const entitled = promos.freebie ? calcPromoFreeEntitled(promos.freebie, qty - freeGiven) : 0;
          if (freeGiven > entitled) freeGiven = entitled;
        }
        let promoDisc = 0;
        let promoId = 0;
        if (promos.discount) {
          promoDisc = calcPromoDiscountPerUnit(promos.discount, qty, price);
          if (promoDisc > 0) promoId = Number(promos.discount.id);
        }
        if (freeGiven > 0 && qty > 0) {
          promoDisc += Math.round(((price * freeGiven) / qty) * 10000) / 10000;
          if (!promoId && promos.freebie) promoId = Number(promos.freebie.id);
        }
        promoDisc = Math.min(promoDisc, price);
        const prevPromo = Number(item.promo_discount || 0);
        const manual = Math.max(0, Number(item.discount || 0) - prevPromo);
        const newDiscount = Math.round((manual + promoDisc) * 10000) / 10000;
        const sameFree = Math.abs(freeGiven - Number(item.promo_free_qty || 0)) < 0.0001;
        if (Math.abs(newDiscount - Number(item.discount || 0)) < 0.0001 && Math.abs(prevPromo - promoDisc) < 0.0001 && sameFree) {
          return item;
        }
        changed = true;
        const diff = price - newDiscount;
        return {
          ...item,
          discount: newDiscount,
          promo_discount: promoDisc,
          promo_free_qty: freeGiven,
          promo_id: promoId,
          diff,
          total: Math.round(qty * diff * 100) / 100,
        };
      });
      return changed ? nextList : prevList;
    });
  }, [list, productPromoByCode]);

  // กดรับของแถมตามสิทธิ์: เพิ่มจำนวน (ตัดล็อตใหม่) แล้วบันทึกจำนวนแถมไว้ให้ effect ด้านบนเกลี่ยส่วนลด
  const addPromoFreebie = (item: any, promo: any) => {
    const freeGiven = Number(item.promo_free_qty || 0);
    const entitled = calcPromoFreeEntitled(promo, Number(item.qty || 0) - freeGiven);
    if (entitled <= freeGiven) return;
    const addQty = entitled - freeGiven;
    const product = productMap.get(item.id_product) || productMapByCode.get(item.code_product);
    setList((prevList) => prevList.map((task: any) =>
      task.code_product === item.code_product && task.unit === item.unit
        ? { ...recalcSaleItemQty(task, product, Number(task.qty || 0) + addQty), promo_free_qty: entitled }
        : task
    ));
  };

  // ป้ายโปรโมชั่นใต้ชื่อสินค้าในตารางขาย (ผู้ขายเห็นสถานะโปรของแต่ละรายการ)
  const renderItemPromoBadges = (item: any) => {
    const promos = getItemPromos(item);
    if (!promos.discount && !promos.freebie) return null;
    const qty = Number(item.qty || 0);
    const price = Number(item.price || 0);
    const badges: React.ReactNode[] = [];

    if (promos.discount) {
      const p = promos.discount;
      const perUnit = calcPromoDiscountPerUnit(p, qty, price);
      if (perUnit > 0) {
        badges.push(
          <div key="pd" className={styles.salesPromoBadge} title={`${promoConditionText(p)} ${promoRewardText(p)}`}>
            🏷️ โปรลดแล้ว {formatSaleAmount(Math.round(perUnit * qty * 100) / 100)} บาท
          </div>
        );
      } else {
        const remain = Math.max(0, Number(p.min_qty || 0) - qty);
        badges.push(
          <div key="pd" className={styles.salesPromoBadgeMuted}>
            🏷️ {promoConditionText(p)} {promoRewardText(p)} — ขาดอีก {formatSaleAmount(remain)} {String(p.unit || "")}
          </div>
        );
      }
    }

    if (promos.freebie) {
      const p = promos.freebie;
      const freeGiven = Number(item.promo_free_qty || 0);
      const entitled = calcPromoFreeEntitled(p, qty - freeGiven);
      if (entitled > freeGiven) {
        badges.push(
          <button
            key="pf"
            type="button"
            className={styles.salesPromoFreeButton}
            onClick={(e) => { e.stopPropagation(); addPromoFreebie(item, p); }}
            title={`${promoConditionText(p)} ${promoRewardText(p)} — กดเพื่อเพิ่มของแถมลงบิล`}>
            🎁 รับของแถม +{formatSaleAmount(entitled - freeGiven)} {String(p.unit || "")}
          </button>
        );
      }
      if (freeGiven > 0) {
        badges.push(
          <div key="pfg" className={styles.salesPromoBadge}>
            🎁 แถมแล้ว {formatSaleAmount(freeGiven)} {String(p.unit || "")} (ฟรี)
          </div>
        );
      } else if (entitled <= 0) {
        const remain = Math.max(0, Number(p.min_qty || 0) - qty);
        badges.push(
          <div key="pf0" className={styles.salesPromoBadgeMuted}>
            🎁 {promoConditionText(p)} {promoRewardText(p)} — ขาดอีก {formatSaleAmount(remain)} {String(p.unit || "")}
          </div>
        );
      }
    }

    return <div className={styles.salesPromoBadgeStack}>{badges}</div>;
  };

  const memberDiscountPercentForSale = isMemberDiscountActive ? normalizedMemberDiscountPercent : 0
  const saleGrossTotal = list.reduce((acc, curr) => acc + Number(curr.total || 0), 0)
  const normalizeRewardDiscount = (value: unknown) => {
    const rewardDiscount = parseInt(String(value ?? ""))
    return isNaN(rewardDiscount) ? 0 : rewardDiscount
  }
  const calcBillDiscountTotal = (data: any = alldatalist) => Number(data.discount || 0) + Number(data.promotion || 0)
  const calcSaleNetTotal = (data: any = alldatalist) => Number((saleGrossTotal - calcBillDiscountTotal(data) - Number(memberDiscountTotal || 0) - normalizeRewardDiscount(data.usereward)).toFixed(2))
  const saleNetTotal = calcSaleNetTotal()
  const calcEarnedPoints = (billTotal = saleGrossTotal) => {
    const saleAmount = toFiniteNumber(SaleS)
    const pointAmount = toFiniteNumber(pointeqS)
    if (saleAmount <= 0 || pointAmount <= 0) return 0
    return toSafeInteger(toFiniteNumber(billTotal) / (saleAmount / pointAmount))
  }
  const customerTotalPoints = toSafeInteger(total_cus)
  const usedRewardPoints = toSafeInteger(getStoredNumber("usereward_s"))
  const earnedPointsFromBill = calcEarnedPoints()
  const customerTotalPointsAfterSale = toSafeInteger(customerTotalPoints + earnedPointsFromBill - usedRewardPoints)

  /* เผยแพร่ข้อมูลลูกค้าที่เลือกอยู่ ให้ป้ายลูกค้าบนแถบเครื่องมือหน้าขาย (body_pro_cus.tsx) นำไปแสดง
     — ก่อนหน้านี้ข้อมูลชุดนี้อยู่ในการ์ด "ข้อมูลลูกค้า" คอลัมน์ขวา ซึ่งถูกซ่อนไปแล้ว
     ใช้ signature เป็น dep เพื่อไม่ให้ setSaleCustomer ยิงซ้ำทุกรอบ render (object ใหม่ทุกครั้ง) */
  const selectedCustomerRow: any = searchname.find((c: any) => c.names === alldatalist.names)
  const customerAllergyList: any[] = Array.isArray(selectedCustomerRow?.drugallergys)
    ? selectedCustomerRow.drugallergys.filter((d: any) => !isBlankInfo(d?.drugallergy) || !isBlankInfo(d?.remark))
    : []
  const customerAllergyText = customerAllergyList
    .map((d: any) => `${d?.drugallergy || "-"}${d?.remark ? ` : ${d.remark}` : ""}`)
    .join("\n")
  const saleCustomerSignature = hasSelectedMemberCustomer
    ? [id_cus, code_cus, name_cus, tel_cus, levelPrice_cus, hasConfiguredCustomerLevelPrice, customerTotalPoints, customerAllergyText, congen_cus].join("|")
    : ""
  useEffect(() => {
    if (!hasSelectedMemberCustomer) {
      setSaleCustomer(null)
      return
    }
    setSaleCustomer({
      id: toSafeInteger(id_cus),
      code: code_cus,
      name: name_cus,
      tel: tel_cus,
      levelPrice: levelPrice_cus,
      hasLevelPrice: hasConfiguredCustomerLevelPrice,
      points: customerTotalPoints,
      allergyCount: customerAllergyList.length,
      allergyText: customerAllergyText,
      congenital: isBlankInfo(congen_cus) ? "" : congen_cus,
    })
  }, [saleCustomerSignature])

  // ออกจากหน้าขายแล้วอย่าทิ้งป้ายลูกค้าค้างไว้บนแถบเครื่องมือ
  useEffect(() => () => { setSaleCustomer(null) }, [])

  //**********Sort Promotion************************************************/
  //new Date().toLocaleDateString('es-US', { day: '2-digit',month: '2-digit',year: 'numeric', })
  let dateNow = new Date().toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })
  let nameCus = name_cus


  let code_Promotion = nameCus == "" ? promotionfullS.filter((a: any) => a.conditionid === Number(1) && a.customer === String("ลูกค้าทั้งหมด") && new Date(a.startdate) <= new Date() && new Date(a.enddate) >= new Date()) :   //promotionfullS
    promotionfullS.filter((a: any) => a.conditionid === Number(1) && new Date(a.startdate) <= new Date() && new Date(a.enddate) >= new Date())

  let sumSale = Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))


  // Pronotion Percent
  let P_percent = code_Promotion.filter((a: any) => Number(sumSale) >= Number(a.pay_condition) && a.unit === "percent").reduce((acc: any, current: any) => {
    const {
      discount,
      unit
    } = current;
    const currentRegionState = acc[unit] ?? {
      perscentTotal: 0,
      bahtTotal: 0

    };
    acc[unit] = {
      perscentTotal: currentRegionState.perscentTotal + ((Number(discount) * Number(sumSale)) / 100),

    };
    return acc;
  }, {});



  // Pronotion baht
  let P_baht = code_Promotion.filter((a: any) => Number(sumSale) >= Number(a.pay_condition) && a.unit === "baht").reduce((acc: any, current: any) => {
    const {
      discount,
      unit
    } = current;
    const currentRegionState = acc[unit] ?? {
      bahtTotal: 0

    };
    acc[unit] = {
      bahtTotal: currentRegionState.bahtTotal + Number(discount),

    };
    return acc;
  }, {});

  let SumPro = ((Number(P_percent.percent == undefined ? 0 : P_percent.percent.perscentTotal)) + Number(P_baht.baht == undefined ? 0 : P_baht.baht.bahtTotal)).toFixed(0)


  /*
list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)>=Number(a.pay_condition)?
 a.unit==="percent"?(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)*Number(a.discount))/100:
 a.unit==="baht"?Number(a.discount):0
:0*/
  /*************************************************************************** */

  // B4: ถ้าล็อกหน้าชำระเงินไว้และรีเฟรช ให้กลับมาหน้าชำระเงินเดิม (กันหนีด้วยการรีเฟรช)
  // lazy-init: อ่านสถานะที่จำไว้จาก localStorage ตั้งแต่เรนเดอร์แรก จะได้ไม่วูบไปหน้าขายก่อน
  const [changepay, setchangePay] = useState(() => {
    if (typeof window === 'undefined') return ""
    try { return (localStorage.getItem("changepay_lock_s") === "1" && isPayBackLocked()) ? "1" : "" } catch { return "" }
  })

  // จำ/ล้างสถานะ "อยู่หน้าชำระเงินขณะถูกล็อก" — เก็บเฉพาะตอน B4 ล็อก + ยังมีบิลค้างเท่านั้น
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (changepay === "1" && isPayBackLocked() && list.length > 0) {
      localStorage.setItem("changepay_lock_s", "1")
    } else {
      localStorage.removeItem("changepay_lock_s")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changepay, list.length])

  // คอลัมน์ "ระดับราคา" รายสินค้า — ซ่อนตอนอยู่หน้าชำระเงิน (แก้ราคาไม่ได้แล้ว)
  const showPriceTierColumn = canEditItemPriceTier && changepay !== "1"

  // เมื่อโหลดหน้า (รีเฟรช) แล้ว restore กลับเข้าหน้าชำระเงิน ให้ซ่อนแถบหัว/เมนูซ้ายเหมือนตอนชำระเงินจริง
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (changepay === "1") setMessage("0")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  //*****************Post Sale********** */

  // Post Data RC1

  const Update_ItemRC = async () => {

    const sales_lot = list.map(posts => ({
      id_receive1: Number(posts.id_receive1),
      qty_lot1: Number(posts.qty_lot1),
      lot_receive1: posts.lot_receive1,
      sale_lot1: Number(posts.sale_qty_lot1),
      balance_lot1: Number(posts.std_qty_lot1) - Number(posts.sale_qty_lot1),
      id_receive2: Number(posts.id_receive2),
      lot_receive2: posts.lot_receive2,
      qty_lot2: Number(posts.qty_lot2),
      sale_lot2: Number(posts.sale_qty_lot2),
      balance_lot2: Number(posts.std_qty_lot2) - Number(posts.sale_qty_lot2),
      id_receive3: Number(posts.id_receive3),
      lot_receive3: posts.lot_receive3,
      qty_lot3: Number(posts.qty_lot3),
      sale_lot3: Number(posts.sale_qty_lot3),
      balance_lot3: Number(posts.std_qty_lot3) - Number(posts.sale_qty_lot3),
    }))
    try {
      await axios.put(`/api/rc1`,
        {
          sales_lot
        }
      )

    } catch (error) {
      if (!isAbortError(error)) console.error(error)
    }
  }


  const discount =
    Number(alldatalist.discount || 0) +
    Number(alldatalist.promotion || 0) +
    Number(memberDiscountTotal || 0) +
    (isNaN(parseInt(alldatalist.usereward)) ? 0 : parseInt(alldatalist.usereward));

  const total = list.reduce((sum, item) => sum + (item.total || 0), 0) - discount;
  const pay = alldatalist.pay === "cash" ? 1 : 2;

  if (typeof window !== "undefined") {
    // อัปเดต localStorage
    localStorage.setItem("order", JSON.stringify(list));
    localStorage.setItem("salemain", JSON.stringify({
      ...alldatalist,
      memberDiscount: memberDiscountTotal,
      memberDiscountPercent: memberDiscountPercentForSale,
      payment_provider: localStorage.getItem("payment_provider") || "promptpay"
    }));
    localStorage.setItem(
      "main",
      JSON.stringify([
        {
          bill: list.length,
          discount,
          memberDiscount: memberDiscountTotal,
          memberDiscountPercent: memberDiscountPercentForSale,
          total,
          pay
        },
      ])
    );

    // Save customer points data for customer display
    const billTotal = list.reduce((acc, curr) => acc + curr.total, 0);
    const pointFromBill = calcEarnedPoints(billTotal);
    const totalPointAfter = customerTotalPoints + pointFromBill - usedRewardPoints;
    localStorage.setItem("customerPoints", JSON.stringify({
      code_cus: code_cus || "",
      name_cus: name_cus || "",
      total_cus: String(customerTotalPoints),
      pointFromBill,
      totalPointAfter: toSafeInteger(totalPointAfter)
    }));

  }
  const handlePayment = () => {
    // เมื่อชำระเงินสำเร็จ
    toast.success(<div style={{ fontFamily: "Kanit", fontSize: 20 }}>ชำระเงินสำเร็จ 🎉</div>, {
      description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> ลูกค้าชำระสินค้าเรียบร้อยแล้ว</div>,
      duration: 3000, // ปิดเองใน 3 วิ
    });
  };

  // Post Data & Post Customer Point
  const SaleMainSubmit = async () => {

    let companyS = (localStorage.getItem("company_") || "")
    // parse แบบกันพัง: ถ้า "his" ไม่มี/ค่าเสีย ต้องไม่ throw (เดิม JSON.parse("") ทำให้
    // ขึ้น "เกิดข้อผิดพลาดในการบันทึกข้อมูล" ทั้งที่ยังไม่ได้ยิง API)
    let HisT: any[] = []
    try {
      const parsed = JSON.parse(localStorage.getItem("his") || "[]")
      if (Array.isArray(parsed)) HisT = parsed
    } catch (e) {
      console.error("Failed to parse his from localStorage", e)
    }
    const companyall = companyS
    const id_costomer = Number(alldatalist.id_costomer)
    const code_costomer = alldatalist.code_costomer
    const group_price = normalizePriceTier(alldatalist.group_price)
    const pay = getPayLabel(alldatalist.pay)
    const bill = Number(alldatalist.bill)
    const totalall = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)))
    const memberDiscount = memberDiscountTotal
    const memberDiscountPercent = memberDiscountPercentForSale
    const discount = Number(alldatalist.discount) + Number(alldatalist.promotion)
    const rewardDiscount = isNaN(parseInt(alldatalist.usereward)) ? 0 : parseInt(alldatalist.usereward)
    const sumtotal = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) - Number(alldatalist.discount) - Number(alldatalist.promotion) - Number(memberDiscount) - Number(rewardDiscount))
    const addreward = Number(alldatalist.addreward)
    const usereward = Number(alldatalist.usereward)
    const personall = getActiveSeller()
    const statussall = alldatalist.statuss

    // Generate orderNo: DDMM-HHmmss (10 หลัก, อ่านง่าย เช่น 1903-124305)
    // ใช้เลขที่สร้างไว้ตอนเริ่มบิล (แสดงใน preview) เพื่อให้ตรงกับใบเสร็จ ถ้ายังไม่มีค่อยสร้างใหม่
    const orderNo = lastOrderNoRef.current || makeOrderNo()
    // เก็บเลขออเดอร์ไว้ใช้แสดง/พิมพ์บนใบเสร็จ
    lastOrderNoRef.current = orderNo
    setLastOrderNo(orderNo)

    // Transfer detail: เฉพาะเมื่อชำระแบบโอนหรือแยกจ่าย
    const transferDetail = (pay === "โอน" || pay === "เงินสด+โอน" || pay === "อื่นๆ") ? (localStorage.getItem("payment_provider") || "") : ""

    // Discount reason
    const discountReason = alldatalist.discountReason || ""

    // Split payment amounts
    const cashAmount = alldatalist.pay === "split" ? Number(alldatalist.cashAmount) || 0 : null
    const transferAmount = alldatalist.pay === "split" ? Number(alldatalist.transferAmount) || 0 : null

    // ดึงราคาทุนล่าสุดมา re-calc ตอนชำระสินค้า (ถ้าไม่มีทุนล่าสุดให้ใช้ทุนตั้งต้นที่ติดมากับสินค้าตอนหยิบใส่ตะกร้า)
    const getRecalculatedCostTotal = (posts: any) => {
      const product = productMapByCode.get(posts.code_product);
      const lotRows = getSaleLotRows(posts.code_product);
      const latestBaseCost = getLatestProductCost(product, lotRows);
      const subQty = Number(posts.subQty || 1);
      const unitCost = latestBaseCost > 0 ? latestBaseCost * subQty : Number(posts.cost || 0);
      return Number(posts.qty) * unitCost;
    };

    const sales = list.map(posts => ({
      company: posts.company,
      id_product: Number(posts.id_product),
      code_product: posts.code_product,
      name_product: posts.name_product,
      cetagory: posts.cetagory,
      fixname: posts.fixname,
      unit: posts.unit,
      cost: getRecalculatedCostTotal(posts),
      qty: Number(posts.qty),
      subunit: String(posts.subUnit || posts.unit || ""),
      subqty: Number(posts.subQty || 1) * Number(posts.qty),
      price: Number(posts.price),
      gifts: Number(posts.totalgift),
      discount: Number(posts.discount),
      memberDiscount: calcItemMemberDiscount(posts),
      memberDiscountPercent: calcItemMemberDiscount(posts) > 0 ? memberDiscountPercent : 0,
      total: Number(posts.total),
      barcode: String(posts.barcode || ""),
      id_receive1: Number(posts.id_receive1),
      lot_receive1: posts.lot_receive1,
      qty_lot1: Number(posts.qty_lot1),
      id_receive2: Number(posts.id_receive2),
      lot_receive2: posts.lot_receive2,
      qty_lot2: Number(posts.qty_lot2),
      id_receive3: Number(posts.id_receive3),
      lot_receive3: posts.lot_receive3,
      qty_lot3: Number(posts.qty_lot3),
      person: getActiveSeller(),
      statuss: posts.statuss,
      type: String(posts.type || ""),
      name_customer: String(posts.name_customer || posts.nme_customer || ""),
      id_card: String(posts.id_card || ""),
      phone: String(posts.phone || ""),
      pharmacy: String(localStorage.getItem("ps") || ""),
    }))


    // duedate ต้องเป็นวันที่ที่ valid เสมอ ไม่งั้น serialize เป็น null แล้ว Prisma reject ทั้งบิล
    const rawDuedate = new Date((HisT.map((a: any) => a.duedate)).toString())
    const safeDuedate = isNaN(rawDuedate.getTime()) ? new Date() : rawDuedate

    const historys = [{
      code_costomer: String(code_costomer),
      company: String(companyS),
      id_costomer: Number(id_costomer),
      name_customer: name_cus,
      duedate: safeDuedate,
      followup: (HisT.map((a: any) => a.followup)).toString(),
      solution: (HisT.map((a: any) => a.solution)).toString(),
      id_history: 0,
      count: Number((HisT.map((a: any) => a.count)).toString()),
      statusH: (HisT.map((a: any) => a.statusH)).toString(),
      person: getActiveSeller(),
      remark: ""
    }]



    const point = calcEarnedPoints(totalall)
    const totalPoint = toSafeInteger(customerTotalPoints + point - usedRewardPoints)
    try {
      localStorage.setItem("show", "1")
      //Save Sale
      const res = await axios.post(`/api/sale`,
        {
          companyall, id_costomer, code_costomer, group_price, pay, bill, totalall, discount, memberDiscount, memberDiscountPercent, sumtotal, addreward, usereward, personall, statussall, orderNo, transferDetail, cashAmount, transferAmount, discountReason, sales, historys,
          // ค่าธรรมเนียมบัตร (เช่น EDC) — เก็บแยกจาก sumtotal (sumtotal = ยอดสินค้า)
          serviceCharge: saleServiceCharge,
          serviceChargePercent: saleServiceCharge > 0 ? saleServiceChargePercent : 0,
          vatEnabled: vatEnabledS,
          taxInvoiceNo: vatEnabledS === "true" ? taxInvoiceNoS : "",
          vatAmount: vatEnabledS === "true" ? Number((sumtotal - (sumtotal / 1.07)).toFixed(2)) : 0,
          beforeVat: vatEnabledS === "true" ? Number((sumtotal / 1.07).toFixed(2)) : 0
        })
      // server เจอบิลเดิม (orderNo ซ้ำ) = การกดซ้ำ → ข้ามการเพิ่มแต้ม/ตัด stock ซ้ำ
      const isDuplicateSubmit = Boolean((res as any)?.data?.duplicated)

      /* ออกเลขคิวให้บิลนี้ — ต้องเสร็จก่อนพิมพ์ เพราะทั้งใบเสร็จและใบ job ต้องมีเลขคิว
         ฝั่ง API กันคิวซ้ำด้วย orderNo อยู่แล้ว กดชำระซ้ำจึงได้เลขเดิมกลับมา ไม่ออกใหม่
         ถ้าออกคิวไม่สำเร็จ ห้ามทำให้ทั้งบิลล้ม — บิลถูกบันทึกไปแล้ว ให้พิมพ์ใบเสร็จต่อโดยไม่มีเลขคิว */
      lastQueueNoRef.current = null
      try {
        const queueRes = await axios.post('/api/sale-queue', {
          company: companyall,
          branch: String(localStorage.getItem("branch_name") || ""),
          queueDate: queueDateOf(),
          orderNo,
          id_salemain: Number((res as any)?.data?.id) || null,
          customer: name_cus === "" ? "" : name_cus,
          seller: personall,
          itemCount: list.length,
          totalAmount: Number(sumtotal) || 0,
          items: list.map((it: any) => ({
            name: String(it.name_product || ""),
            qty: Number(it.qty) || 0,
            unit: String(it.unit || ""),
          })),
        })
        const issued = Number((queueRes as any)?.data?.queueNo)
        if (Number.isFinite(issued) && issued > 0) {
          lastQueueNoRef.current = issued
          setLastIssuedQueueNo(issued)
        }
      } catch (queueError) {
        console.error("Issue sale queue failed (sale already saved):", queueError)
      }

      // Save Cus Point
      // ⚠️ ห้ามให้ขั้นตอนหลังบันทึกบิลสำเร็จโยน error ออกไป — เดิมถ้า PUT แต้มล้มเหลว
      // จะขึ้น "เกิดข้อผิดพลาดในการบันทึกข้อมูล" ทั้งที่บิลถูกบันทึกแล้ว พอผู้ใช้กดชำระใหม่บิลจึงเบิ้ล
      if (!isDuplicateSubmit && Number.isFinite(id_costomer) && id_costomer !== 0) {
        try {
          await axios.put(`/api/${apicustomer}/${id_costomer}`, { point, totalPoint })
        } catch (pointError) {
          console.error("Update customer point failed (sale already saved):", pointError)
        }
      }


      // ✅ Cut Stock Realtime - ตัด stock แบบ atomic ด้วย FEFO (First Expired, First Out)
      if (!isDuplicateSubmit) {
        // การซ่อม lot อัตโนมัติ (ตอนสแกน/ยืนยันจำนวน) ต้องจบก่อนตัดสต๊อก ไม่งั้นยอดจะทับกัน
        await waitForLotRepairsToSettle();
        for (const item of list) {
          try {
            await axios.post('/api/cutstock', {
              itemcode: item.code_product,
              quantity: Math.round((item.subQty || 1) * item.qty * 1000) / 1000,
              company: companyall,
              person: personall,
              transaction_type: 'SALE'
            });
          } catch (cutstockError: any) {
            console.error(`Cutstock failed for item ${item.code_product}:`, cutstockError);
            // Continue with other items even if one fails
          }
        }
      }

      // Stock changed - drop the cached catalog so the next read shows fresh qty.
      invalidateCatalog('datalist')


      //  Update_ItemRC()
      handlePayment()
      DetailItemRC()

      seachNames()

      setTimeout(() => {
        deleteall(),
          localStorage.setItem("itemlist", String(list.length)),
          setchangePay("2")
        setatalist(initialValues4)

        // Clear hold bill slot after successful payment
        holdBillStore.clearSlot(holdBillStore.activeIndex);

        const dd =
          [{
            followup: String(""),
            solution: String(""),
            id_history: "",
            count: String(""),
            statusH: "",
            duedate: new Date(),
            person: ""
          }]

        localStorage.setItem("his", JSON.stringify(dd))
        localStorage.setItem("usereward_s", "0")
        localStorage.setItem("discount_s", "0")
        localStorage.setItem("discount_Po", "0")

        // Refresh tax invoice number for next sale
        if (vatEnabledS === "true") {
          axios.get('/api/sale/next-tax-invoice').then((invRes) => { setTaxInvoiceNoS(invRes.data.taxInvoiceNo) }).catch((e) => { console.error(e) })
        }

      }, 30);




      // await  fetchPosts()
      // localStorage.setItem("loadingM","/web/customers")

      return res;

    } catch (error) {
      if (!isAbortError(error)) console.error(error)
      throw error;
    }
  }


  /*******ข้อมูล Quatation ************************ */
  // Date Real
  var dt = new Date();

  let year = dt.getFullYear();
  let month = (dt.getMonth() + 1).toString().padStart(2, "0");
  let day = dt.getDate().toString().padStart(2, "0");
  /***************************************** */

  const [qt, setqt] = useState([])


  const fetchQT = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apiquatation}?companyall=${companyS}`)
      res.data.length === 0 ? "" : setqt(res.data)
    } catch (error) {
      if (!isAbortError(error)) console.error(error)
    }
  }


  /****************Max QT********************** */
  const [maxS, setMax] = useState("")
  let maxRecN = Number(maxS) == -Infinity ? 100 : Number(maxS) + 1


  const maxV = async () => {
    let result = qt.filter((a: any) => a.qt_orderNo === String(year) + String(month) + String(day)).map((pp: any) => (pp.qt_number))
    console.log(result)

    let maxValue = Math.max.apply(null, result)
    setMax(String(maxValue))
    //setatalist({...alldatalist,qt_number:String(maxValue)})
    console.log(maxValue)
  }


  /****************Max Bill********************** */
  const [maxSB, setMaxB] = useState("")
  let maxRecNB = Number(maxSB) == -Infinity ? 100 : Number(maxSB) + 1


  const maxVB = async () => {
    let resultB = qt.filter((a: any) => a.bl_orderNo === String(year) + String(month) + String(day)).map((pp: any) => (pp.bl_number))
    console.log(resultB)

    let maxValueB = Math.max.apply(null, resultB)
    setMaxB(String(maxValueB))
    //setatalist({...alldatalist,qt_number:String(maxValue)})
    console.log(maxValueB)
  }

  /****************Max INVOICE********************** */
  const [maxSI, setMaxI] = useState("")
  let maxRecNI = Number(maxSI) == -Infinity ? 100 : Number(maxSI) + 1


  const maxVI = async () => {
    let resultI = qt.filter((a: any) => a.inv_orderNo === String(year) + String(month) + String(day)).map((pp: any) => (pp.inv_number))
    console.log(resultI)

    let maxValueI = Math.max.apply(null, resultI)
    setMaxI(String(maxValueI))
    //setatalist({...alldatalist,qt_number:String(maxValue)})
    console.log(maxValueI)
  }

  /****************Max Re********************** */
  const [maxSR, setMaxR] = useState("")
  let maxRecNR = Number(maxSR) == -Infinity ? 100 : Number(maxSR) + 1


  const maxVR = async () => {
    let resultR = qt.filter((a: any) => a.re_orderNo === String(year) + String(month) + String(day)).map((pp: any) => (pp.re_number))
    console.log(resultR)

    let maxValueR = Math.max.apply(null, resultR)
    setMaxR(String(maxValueR))
    //setatalist({...alldatalist,qt_number:String(maxValue)})
    console.log(maxValueR)
  }

  /****************Max Re********************** */
  const [maxST, setMaxT] = useState("")
  let maxRecNT = Number(maxST) == -Infinity ? 100 : Number(maxST) + 1


  const maxVT = async () => {
    let resultT = qt.filter((a: any) => a.tax_orderNo === String(year) + String(month) + String(day)).map((pp: any) => (pp.tax_number))
    console.log(resultT)

    let maxValueT = Math.max.apply(null, resultT)
    setMaxT(String(maxValueT))
    //setatalist({...alldatalist,qt_number:String(maxValue)})
    console.log(maxValueT)
  }

  /****************Max Delivery Note********************** */
  const [maxSD, setMaxD] = useState("")
  let maxRecND = Number(maxSD) == -Infinity ? 100 : Number(maxSD) + 1


  const maxVD = async () => {
    let resultD = qt.filter((a: any) => a.dn_orderNo === String(year) + String(month) + String(day)).map((pp: any) => (pp.dn_number))
    console.log(resultD)

    let maxValueD = Math.max.apply(null, resultD)
    setMaxD(String(maxValueD))
    console.log(maxValueD)
  }



  /***************************************** */

  const [selectedOption, setSelectedOption] = useState(typeof window !== 'undefined' ? (localStorage.getItem("pay_s") || 'cash') : 'cash');

  // ===== Service charge (เช่น EDC บัตร) — % ตั้งไว้ที่ payment provider เรียกเก็บเพิ่มจากลูกค้า =====
  // sumtotal ที่บันทึกยังคงเป็นยอดสินค้า ค่าธรรมเนียมเก็บแยกใน SaleMain.serviceCharge
  const calcProviderServiceCharge = (providerKey: string, base: number) => {
    const row = payProviders.find((p: any) => p.provider === providerKey)
    const pct = Number(row?.serviceChargePercent || 0)
    if (!(pct > 0) || !(base > 0)) return 0
    return Number(((base * pct) / 100).toFixed(2))
  }
  const activePayProviderKey = String(alldatalist.payment_provider || (typeof window !== 'undefined' ? localStorage.getItem('payment_provider') : '') || '')
  const saleServiceChargePercent = (selectedOption === 'payment' || selectedOption === 'split' || selectedOption === 'other')
    ? Number(payProviders.find((p: any) => p.provider === activePayProviderKey)?.serviceChargePercent || 0)
    : 0
  // ฐานคิดค่าธรรมเนียม: จ่ายเต็มผ่านช่องทาง = ยอดสุทธิ / แยกจ่าย = เฉพาะส่วนที่รูดบัตร (transferAmount)
  const saleServiceChargeBase = selectedOption === 'split' ? Number(alldatalist.transferAmount || 0) : saleNetTotal
  const saleServiceCharge = saleServiceChargePercent > 0 ? calcProviderServiceCharge(activePayProviderKey, saleServiceChargeBase) : 0
  // ยอดที่ต้องรับชำระจริง: จ่ายเต็ม = สุทธิ+ค่าธรรมเนียม / แยกจ่าย: ช่องคีย์เป็นยอดสินค้า ค่าธรรมเนียมเก็บเพิ่มที่เครื่องรูด
  const saleNetTotalDue = Number((saleNetTotal + (selectedOption === 'split' ? 0 : saleServiceCharge)).toFixed(2))
  // ยอดเรียกเก็บลูกค้ารวมทุกช่องทาง (ใช้แสดงบนใบเสร็จ)
  const saleChargeGrandTotal = Number((saleNetTotal + saleServiceCharge).toFixed(2))

  const [itembalance, setbalance] = useState([])
  const [calculatedBalance, setCalculatedBalance] = useState<number | null>(null)

  const fetchGet_Balance = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apibalance}?company=${companyS}&code_product=${codeproductS}`)
      setbalance(res.data)

      // ดึงยอดคงเหลือที่คำนวณจาก stock-balance-summary (อิง product id เพื่อรองรับรหัสซ้ำ)
      if (codeproductS) {
        const idQuery = idF ? `&id=${idF}` : ""
        const resSummary = await axios.get(`/api/stock-balance-summary?itemcode=${codeproductS}&company=${companyS}${idQuery}`)
        const calcBalance = resSummary.data?.calculatedBalance
        if (calcBalance !== undefined) {
          setCalculatedBalance(calcBalance)
          // อัพเดท productBalances Map ด้วย (key เป็น product id)
          if (idF) {
            setProductBalances(prev => {
              const newMap = new Map(prev);
              newMap.set(Number(idF), Number(calcBalance));
              return newMap;
            });
          }
        }
      }
    } catch (error) {
      if (!isAbortError(error)) console.error(error)
    }

  }








  //**************************************** */
  // input Discount
  const Discount_s = () => {

    const [discountS, setdiscountS] = useState('0')
    const [discountPo, setdiscountPo] = useState(alldatalist.promotion)
    const [discountReasonLocal, setDiscountReasonLocal] = useState(alldatalist.discountReason || '')

    useEffect(() => {
      setdiscountPo(localStorage.getItem("discount_Po") || "")
      setdiscountS(localStorage.getItem("discount_s") || "")

    }, [Number(discountS), Number(discountPo), Number(localStorage.getItem("discount_Po") || "")]);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [show2, setShow2] = useState(false);

    const discount =
      Number(alldatalist.discount || 0) +
      Number(alldatalist.promotion || 0) +
      (isNaN(parseInt(alldatalist.usereward)) ? 0 : parseInt(alldatalist.usereward));

    const total = list.reduce((sum, item) => sum + (item.total || 0), 0) - discount;
    const pay = alldatalist.pay === "cash" ? 1 : 2;

    useEffect(() => {
      if (typeof window !== "undefined") {
        // อัปเดต localStorage
        localStorage.setItem("order", JSON.stringify(list));
        localStorage.setItem(
          "main",
          JSON.stringify([
            {
              bill: list.length,
              discount,
              total,
              pay
            },
          ])
        );


      }
    }, [Number(discountS), Number(discountPo), show2])

    return (


      <>

        <button
          type="button"
          className={styles.paymentAdjustmentButton}
          onClick={() => { setShow2(true), localStorage.setItem("discount_s", "0"), setSelectedOption("cash"), localStorage.setItem("pay_s", "cash"), localStorage.setItem("discount_Po", String(alldatalist.promotion)) }}
        >
          {Number(alldatalist.discount) + Number(alldatalist.promotion)}
        </button>

        <Modal_dc
          show={show2}
          onHide={() => setShow2(false)}
          dialogClassName="modal-90w"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_dc.Header closeButton>
            <Modal_dc.Title id="example-custom-modal-styling-title">
              <div style={{ width: "auto", height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>ส่วนลดท้ายบิล</div>
            </Modal_dc.Title>
          </Modal_dc.Header>
          <Modal_dc.Body>

            <div className="d-flex" style={{ textAlign: "center", height: 40 }}>

              <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                ส่วนลด :  </div>

              <input className="form-control form-control-sm mt-1"
                style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                value={discountS}
                onChange={(e) => { setdiscountS(e.target.value), localStorage.setItem("discount_s", e.target.value) }}
              />
              <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>บาท
              </div>

            </div>
            <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
              <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                ส่วนลดโปรโมชั่น :</div>
              {/**  {Number(alldatalist.promotion)}*/}
              <input className="form-control form-control-sm mt-1"
                style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                value={discountPo}
                onChange={(e) => { setdiscountPo(e.target.value), localStorage.setItem("discount_Po", e.target.value) }}
              />

              <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>บาท
              </div>

            </div>
            <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit_B", marginTop: 10, textAlign: "left", height: 35 }}>
              ส่วนลดรวม : &nbsp;&nbsp;{Number(discountPo) + Number(discountS)}&nbsp;&nbsp; บาท  </div>

            <div className="d-flex" style={{ textAlign: "center", height: 40, marginTop: 5 }}>
              <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                เหตุผล :  </div>
              <input className="form-control form-control-sm mt-1"
                style={{ width: 250, marginLeft: 10, height: 25, fontSize: 16, fontFamily: "Kanit" }}
                placeholder="ระบุเหตุผลในการลดราคา..."
                value={discountReasonLocal}
                onChange={(e) => setDiscountReasonLocal(e.target.value)}
              />
            </div>

            {/**Promotion */}
            {code_Promotion.length > 0 ? <div className="row-4 mt-1 shadow-sm rounded border  " style={{ backgroundColor: "white", justifySelf: "center", marginLeft: 10 }}>
              <div className="d-flex  mt-1 mb-1 " style={{ justifyContent: "center" }}>
                <div className="" style={{ width: 190, justifyItems: "center" }}><div className={styles.bodydetail_head} >ส่วนลด โปรโมชั่น {((Number(P_percent.percent == undefined ? 0 : P_percent.percent.perscentTotal)) + Number(P_baht.baht == undefined ? 0 : P_baht.baht.bahtTotal)).toFixed(0)} บาท</div></div>
              </div>
              <div className='' style={{ overflowY: 'auto', marginLeft: 5 }}>
                <Table className="table" size="sm"  >
                  <thead className="">
                    <tr className="">

                      <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "40%" }}>ชื่อโปรโมชั่น</th>
                      <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "15%" }}>ลูกค้า</th>
                      <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "40%" }}>โปรโมชั่น</th>
                      <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "20%" }}>คำนวณ</th>
                    </tr>
                  </thead>
                  <tbody className="table-group-divider">
                    {code_Promotion.map((a: any) =>
                      <tr className="" key={a.id}>
                        <th scope="row" className={styles.bodydetailTable_Re1} style={{ width: "40%" }}>{a.name_promotion}</th>
                        <td className={styles.bodydetailTable_Re1} style={{ width: "15%" }}>{a.customer}</td>
                        <td className={styles.bodydetailTable_Re1} style={{ width: "40%" }}>{a.msg_condition + " " + a.msg_discount}</td>
                        <td className={styles.bodydetailTable_Re1} style={{ width: "20%" }}>
                          {

                            list.map(num => num).reduce((acc, curr) => acc + curr.total, 0) >= Number(a.pay_condition) ?
                              a.unit === "percent" ? (list.map(num => num).reduce((acc, curr) => acc + curr.total, 0) * Number(a.discount)) / 100 :
                                a.unit === "baht" ? Number(a.discount) : 0
                              :
                              0

                          }

                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

            </div> : ""}
          </Modal_dc.Body>
          <Modal_dc.Footer>
            <button
              className="btn btn-success"

              style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
              onClick={() => {
                setShow2(false),
                  setatalist({ ...alldatalist, discount: discountS, promotion: discountPo, discountReason: discountReasonLocal }),
                  setdiscountS(localStorage.getItem("discount_s") || "")
                setdiscountPo(localStorage.getItem("discount_Po") || "")
                setSelectedOption("cash")
                localStorage.setItem("pay_s", "cash")
              }}
            >
              OK
            </button>
            <button
              className="btn btn-secondary"
              style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
              onClick={() => setShow2(false)}
            >
              Close
            </button>

          </Modal_dc.Footer>
        </Modal_dc>

      </>

    )
  }


  // input use reward
  const Usereward_s = () => {

    const [userewardS, setuserewardS] = useState("0")

    const caluserreward = Number(pointsetS) === 0 ? 0 : ((Number(userewardS == undefined ? 0 : userewardS) / Number(pointsetS)) * Number(discountS))

    useEffect(() => {

      setuserewardS(localStorage.getItem("usereward_s") || "")

    }, [Number(userewardS)]);

    const [show1, setShow1] = useState(false);


    const discount =
      Number(alldatalist.discount || 0) +
      Number(alldatalist.promotion || 0) +
      (isNaN(parseInt(alldatalist.usereward)) ? 0 : parseInt(alldatalist.usereward));

    const total = list.reduce((sum, item) => sum + (item.total || 0), 0) - discount;
    const pay = alldatalist.pay === "cash" ? 1 : 2;

    useEffect(() => {
      if (typeof window !== "undefined") {
        // อัปเดต localStorage
        localStorage.setItem("order", JSON.stringify(list));
        localStorage.setItem(
          "main",
          JSON.stringify([
            {
              bill: list.length,
              discount,
              total,
              pay
            },
          ])
        );


      }
    }, [Number(userewardS), show1])


    return (

      <>

        <button
          type="button"
          className={styles.paymentAdjustmentButton}
          onClick={() => { setShow1(true), localStorage.setItem("usereward_s", "0"), setSelectedOption("cash"), localStorage.setItem("pay_s", "cash") }}>
          {isNaN(parseInt(String(alldatalist.usereward))) === true ? 0 : parseInt(String(alldatalist.usereward))}
        </button>

        <Modal_rw
          show={show1}
          onHide={() => setShow1(false)}
          dialogClassName="modal-90w"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_rw.Header closeButton>
            <Modal_rw.Title id="example-custom-modal-styling-title">
              <div style={{ width: "auto", height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>ใช้แต้มส่วนลด</div>
            </Modal_rw.Title>
          </Modal_rw.Header>
          <Modal_rw.Body>
            <div className="col-3" style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 15, width: 180 }}>{code_cus}&nbsp;&nbsp;&nbsp;{name_cus}</div>
            <div className="d-flex">
              <div className="d-flex" style={{ textAlign: "left", fontFamily: "Kanit", fontSize: 13, width: 80, marginLeft: 10 }}>มีแต้มทั้งหมด :</div>
              <div className="d-flex" style={{ textAlign: "center", fontFamily: "Kanit_B", fontSize: 13 }}>{customerTotalPoints}</div>
              <div className="d-flex" style={{ textAlign: "left", fontFamily: "Kanit", fontSize: 13, width: 80, marginLeft: 10 }}>แต้ม</div>
            </div>

            <div className="d-flex mt-1" style={{ textAlign: "center", height: 40 }}>
              <div style={{ width: "auto", fontSize: 15, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>  ใช้แต้มส่วนลด :  </div>

              <input className="form-control form-control-sm mt-1" style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 17, fontFamily: "Kanit_B", justifyItems: "center" }}
                value={userewardS ?? 0}
                disabled={statusS === "true" ? false : true}
                onChange={(e) => { setuserewardS(e.target.value), localStorage.setItem("usereward_s", e.target.value) }}

              />
              <div style={{ width: "auto", fontSize: 15, marginTop: 10, fontFamily: "Kanit" }}>แต้ม
              </div>
              <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
                <div style={{ width: 80, fontSize: 15, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>คิดเป็น :  </div>

                <div style={{ width: "auto", fontSize: 15, marginTop: 10, fontFamily: "Kanit", marginRight: 10 }}>{isNaN(parseInt(String(caluserreward))) === true ? 0 : parseInt(String(caluserreward))}</div>
                <div style={{ width: 80, fontSize: 15, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>บาท  </div>
              </div>

            </div>
            <div style={{ width: "auto", fontSize: 10, marginTop: 10, fontFamily: "Kanit", color: "GrayText" }}>{statusS === "true" ? "เปิด ใช้งานแต้มสะสม" : "ปิด ใช้งานแต้มสะสม (เปิดการใช้งานได้ที่ ตั้งค่า => ตั้งค่าแต้มสะสม)"}</div>
            <div style={{ width: "auto", fontSize: 10, marginTop: 10, fontFamily: "Kanit", color: "GrayText" }}>ซื้อครบ : {SaleS} บาท คิดเป็นแต้ม : {pointeqS} แต้ม และแต้ม :  {pointsetS} แต้ม คิดเป็นส่วนลด : {discountS} บาท</div>

          </Modal_rw.Body>
          <Modal_rw.Footer>
            <button
              className="btn btn-success"

              style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
              onClick={() => {
                setShow1(false)
                setatalist({ ...alldatalist, usereward: String(isNaN(caluserreward) ? 0 : caluserreward) }),
                  setuserewardS(localStorage.getItem("usereward_s") || ""),
                  setSelectedOption("cash")
                localStorage.setItem("pay_s", "cash")

              }}

            >
              OK
            </button>
            <button
              className="btn btn-secondary"
              style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
              onClick={() => setShow1(false)}>
              Close
            </button>
          </Modal_rw.Footer>
        </Modal_rw>

      </>
    )
  }

  // input receive Baht
  const Rereveive_s = () => {

    const [receivebahtS, setreceivebahtS] = useState('')
    useEffect(() => {

      setreceivebahtS(localStorage.getItem("receivebaht_s") || "")

    }, [Number(receivebahtS)]);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [show3, setShow3] = useState(false);


    const discount =
      calcBillDiscountTotal(alldatalist) +
      Number(memberDiscountTotal || 0) +
      normalizeRewardDiscount(alldatalist.usereward);

    const total = saleGrossTotal - discount;
    const pay = alldatalist.pay === "cash" ? 1 : 2;

    useEffect(() => {
      if (typeof window !== "undefined") {
        // อัปเดต localStorage
        localStorage.setItem("order", JSON.stringify(list));
        localStorage.setItem(
          "main",
          JSON.stringify([
            {
              bill: list.length,
              discount,
              total,
              pay
            },
          ])
        );


      }
    }, [Number(receivebahtS), show3])


    // Use local state receivebahtS for fast typing
    const [localReceive, setLocalReceive] = useState(alldatalist.receivebaht || "");

    // Sync local state when alldatalist changes from external source
    useEffect(() => {
      setLocalReceive(alldatalist.receivebaht || "");
    }, [alldatalist.receivebaht]);

    const handleReceiveBlur = () => {
      setatalist({
        ...alldatalist,
        receivebaht: localReceive,
        total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
      });

      localStorage.setItem("receivebaht_s", localReceive);
    };

    // Use shared receiveInputRef from parent scope



    return (

      <>

        <input
          ref={receiveInputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className={`${styles.paymentReceiveInput} form-control`}
          value={localReceive}
          disabled={alldatalist.pay === "split"}
          title={alldatalist.pay === "split" ? "กรุณากรอกยอดเงินสด/โอนแยกที่ช่องด้านล่าง" : undefined}

          onFocus={(e) => e.target.select()}

          onBlur={handleReceiveBlur}
          onChange={(e) => {
            setLocalReceive(e.target.value);
            // Sync via Enter key or Blur only
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleReceiveBlur();
              setTimeout(() => {
                confirmPaymentRef.current?.focus();
              }, 100);
            }
          }}
        />

        <Modal_rc
          show={show3}
          onHide={() => setShow3(false)}
          dialogClassName="modal-90w"
          aria-labelledby="example-custom-modal-styling-title">
          <Modal_rc.Header closeButton>
            <Modal_rc.Title id="example-custom-modal-styling-title">
              <div style={{ width: "auto", height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>รับเงิน</div>
            </Modal_rc.Title>
          </Modal_rc.Header>
          <Modal_rc.Body>


            <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
              <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                รับเงินสด :  </div>

              <input
                autoFocus
                className="form-control form-control-sm mt-1"
                style={{ width: 70, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                value={receivebahtS}
                onChange={(e) => { setreceivebahtS(e.target.value), localStorage.setItem("receivebaht_s", e.target.value) }}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setShow3(false);
                    setatalist({ ...alldatalist, receivebaht: receivebahtS, total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) });
                    setreceivebahtS(localStorage.getItem("receivebaht_s") || "");
                  }
                }}
              />
              <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>บาท
              </div>
            </div>
            <div className="d-flex mt-2">
              <button
                type="button"
                className="btn btn-outline-secondary "
                onClick={(e) => {
                  setreceivebahtS("20"),
                    localStorage.setItem("receivebaht_s", "20"),
                    setatalist({ ...alldatalist, receivebaht: "20", total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) }),
                    setShow3(false)
                }}>20
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  setreceivebahtS("50"),
                    localStorage.setItem("receivebaht_s", "50"),
                    setatalist({ ...alldatalist, receivebaht: "50", total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) }),
                    setShow3(false)
                }}>50
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  setreceivebahtS("60"),
                    localStorage.setItem("receivebaht_s", "60"),
                    setatalist({ ...alldatalist, receivebaht: "60", total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) }),
                    setShow3(false)
                }}>60
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  setreceivebahtS("80"),
                    localStorage.setItem("receivebaht_s", "80"),
                    setatalist({ ...alldatalist, receivebaht: "80", total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) }),
                    setShow3(false)
                }}>80
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  setreceivebahtS("100"),
                    localStorage.setItem("receivebaht_s", "100"),
                    setatalist({ ...alldatalist, receivebaht: "100", total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) }),
                    setShow3(false)
                }}>100
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  setreceivebahtS("200"),
                    localStorage.setItem("receivebaht_s", "200"),
                    setatalist({ ...alldatalist, receivebaht: "200", total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) }),
                    setShow3(false)
                }}>200
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  setreceivebahtS("500"),
                    localStorage.setItem("receivebaht_s", "500"),
                    setatalist({ ...alldatalist, receivebaht: "500", total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) }),
                    setShow3(false)
                }}>
                500
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  setreceivebahtS("1000"),
                    localStorage.setItem("receivebaht_s", "1000"),
                    setatalist({ ...alldatalist, receivebaht: "1000", total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) }),
                    setShow3(false)
                }}
              >1000
              </button>
            </div>
          </Modal_rc.Body>
          <Modal_rc.Footer>
            <button
              className="btn btn-success"
              style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
              onClick={() => {
                setShow3(false),
                  setatalist({ ...alldatalist, receivebaht: receivebahtS, total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) }),
                  setreceivebahtS(localStorage.getItem("receivebaht_s") || "")
              }}
            >
              OK
            </button>
            <button
              className="btn btn-secondary"
              style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
              onClick={() => setShow3(false)}
            >
              Close
            </button>

          </Modal_rc.Footer>
        </Modal_rc>
      </>
    )
  }

  // Split payment inputs with local state for smooth typing
  const SplitInputs = ({ patBaht }: { patBaht: number }) => {
    const [localCash, setLocalCash] = useState(alldatalist.cashAmount || "")
    const [localTransfer, setLocalTransfer] = useState(alldatalist.transferAmount || "")

    useEffect(() => {
      setLocalCash(alldatalist.cashAmount || "")
      setLocalTransfer(alldatalist.transferAmount || "")
    }, [alldatalist.cashAmount, alldatalist.transferAmount])

    const syncToParent = (cash: string, transfer: string) => {
      setatalist({
        ...alldatalist,
        cashAmount: cash,
        transferAmount: transfer,
        receivebaht: String((Number(cash) || 0) + (Number(transfer) || 0))
      })
    }

    const totalSplit = (Number(localCash) || 0) + (Number(localTransfer) || 0)

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", padding: "1px 0 0", borderTop: "1px dashed #e2e8f0", marginTop: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3, flex: 1 }}>
          <span style={{ fontFamily: 'Kanit', fontSize: 10, color: '#475569', whiteSpace: 'nowrap' }}>💵 เงินสด</span>
          <input
            type="number"
            className={styles.splitPaymentInput}
            placeholder="0"
            value={localCash}
            onChange={(e) => setLocalCash(e.target.value)}
            onBlur={() => syncToParent(localCash, localTransfer)}
            onKeyDown={(e) => { if (e.key === 'Enter') syncToParent(localCash, localTransfer) }}
            onFocus={(e) => e.target.select()}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, flex: 1 }}>
          <span style={{ fontFamily: 'Kanit', fontSize: 10, color: '#475569', whiteSpace: 'nowrap' }}>🏦 เงินโอน</span>
          <input
            type="number"
            className={styles.splitPaymentInput}
            placeholder="0"
            value={localTransfer}
            onChange={(e) => setLocalTransfer(e.target.value)}
            onBlur={() => syncToParent(localCash, localTransfer)}
            onKeyDown={(e) => { if (e.key === 'Enter') syncToParent(localCash, localTransfer) }}
            onFocus={(e) => e.target.select()}
          />
        </div>
        <div style={{
          fontFamily: 'Kanit_B', fontSize: 10, whiteSpace: 'nowrap',
          background: totalSplit >= patBaht ? '#EDF9F3' : '#fef2f2',
          color: totalSplit >= patBaht ? '#147F56' : '#ef4444',
          padding: '1px 7px', borderRadius: 6
        }}>
          รวม {totalSplit.toLocaleString()} / {patBaht.toLocaleString()} บาท
        </div>
      </div>
    )
  }

  // input Radio Pay
  const Radio_pay = () => {

    const [payS, setpay] = useState('0')
    const [selectedProvider, setSelectedProvider] = useState(localStorage.getItem("payment_provider") || "promptpay")
    const transferPayProviders = useMemo(() => payProviders.filter((provider: any) => !isOtherPaymentProvider(provider)), [payProviders])
    const otherPayProviders = useMemo(() => payProviders.filter((provider: any) => isOtherPaymentProvider(provider)), [payProviders])
    const activeProviderOptions = selectedOption === 'other' ? otherPayProviders : transferPayProviders

    useEffect(() => {
      setpay(localStorage.getItem("pay_s") || "")
    }, []);

    useEffect(() => {
      if (selectedOption === 'cash') return
      if (activeProviderOptions.length === 0) return

      const hasSelectedProvider = activeProviderOptions.some((provider: any) => provider.provider === selectedProvider)
      if (hasSelectedProvider) return

      const fallbackProvider = activeProviderOptions[0]?.provider
      if (!fallbackProvider) return

      const nextSaleData = {
        ...alldatalist,
        payment_provider: fallbackProvider,
      }

      setSelectedProvider(fallbackProvider)
      setatalist(nextSaleData)
      localStorage.setItem("payment_provider", fallbackProvider)
      localStorage.setItem("salemain", JSON.stringify(nextSaleData))
    }, [activeProviderOptions, selectedOption, selectedProvider])


    const handleOptionChange1 = (e: any) => {

      const nextPay = e.target.value;
      const nextProvider = nextPay === 'cash'
        ? "promptpay"
        : getPaymentProviderValue(payProviders, nextPay === 'other', selectedProvider)

      // ยอดรับต้องรวม service charge เมื่อจ่ายเต็มผ่านช่องทางที่มีค่าธรรมเนียม (เช่น EDC)
      const nextCharge = (nextPay === 'payment' || nextPay === 'other') ? calcProviderServiceCharge(nextProvider, saleNetTotal) : 0
      const nextDue = Number((saleNetTotal + nextCharge).toFixed(2))

      setSelectedOption(nextPay);
      const nextSaleData = {
        ...alldatalist,
        pay: nextPay,
        receivebaht: nextPay === 'split' ? "" : String(nextDue),
        total: String(saleGrossTotal),
        cashAmount: nextPay === 'split' ? "" : "",
        transferAmount: nextPay === 'split' ? "" : "",
        payment_provider: nextProvider
      }
      setatalist(nextSaleData);
      localStorage.setItem("pay_s", String(nextPay))
      localStorage.setItem("payment_provider", nextProvider)
      localStorage.setItem("salemain", JSON.stringify(nextSaleData))
      setSelectedProvider(nextProvider)

      // Focus payment button when full non-cash payment is selected
      if (nextPay === 'payment' || nextPay === 'other') {
        setTimeout(() => {
          confirmPaymentRef.current?.focus();
        }, 100);
      }
    };

    const handleProviderChange = (e: any) => {
      const provider = e.target.value
      const nextSaleData = {
        ...alldatalist,
        payment_provider: provider
      }
      setSelectedProvider(provider)
      localStorage.setItem("payment_provider", provider)
      setatalist(nextSaleData)
      localStorage.setItem("salemain", JSON.stringify(nextSaleData))
    }

    // ยอดที่ต้องรับชำระจริง (รวม service charge เมื่อจ่ายเต็มผ่านช่องทางที่มีค่าธรรมเนียม)
    const pat_baht = saleNetTotalDue

    useEffect(() => {
      if (selectedOption !== 'payment' && selectedOption !== 'other') return
      if (Number(alldatalist.receivebaht || 0) === Number(pat_baht || 0)) return

      const nextSaleData = {
        ...alldatalist,
        pay: selectedOption,
        receivebaht: String(pat_baht),
        total: String(saleGrossTotal),
      }
      setatalist(nextSaleData)
      localStorage.setItem("receivebaht_s", String(pat_baht))
      localStorage.setItem("salemain", JSON.stringify(nextSaleData))
    }, [selectedOption, pat_baht, alldatalist.receivebaht])

    const paymentOptions = [
      { value: 'cash', label: 'เงินสด', shortcut: 'F8', Icon: Banknote },
      { value: 'payment', label: 'โอน', shortcut: 'F9', Icon: Wallet },
      { value: 'split', label: 'แยกจ่าย', shortcut: 'F7', Icon: Coins },
      { value: 'other', label: 'อื่นๆ', shortcut: 'F6', Icon: CreditCard },
    ]

    // Service charge — ใช้ค่าที่คำนวณระดับ parent (แหล่งเดียวกับยอดสุทธิ/ยอดรับ/ใบเสร็จ)
    const serviceChargePercent = saleServiceChargePercent
    const serviceChargeBase = saleServiceChargeBase
    const serviceChargeAmount = saleServiceCharge
    const serviceChargeGrand = Number((saleServiceChargeBase + saleServiceCharge).toFixed(2))
    const showServiceCharge = saleServiceCharge > 0

    return (
      <div className={styles.paymentMethodPanel}>
        <div className={styles.paymentMethodControls}>
          {paymentOptions.map(({ value, label, shortcut, Icon }) => (
            <button
              key={value}
              type="button"
              className={`${styles.paymentMethodPill} ${selectedOption === value ? styles.paymentMethodPillActive : ''}`}
              onClick={() => handleOptionChange1({ target: { value } })}
            >
              <span className={styles.paymentMethodIcon}><Icon size={12} strokeWidth={2.3} /></span>
              <span className={styles.paymentMethodText}>{label}</span>
              <span className={styles.paymentMethodShortcut}>{shortcut}</span>
            </button>
          ))}
        </div>

        {(selectedOption === 'payment' || selectedOption === 'split' || selectedOption === 'other') && activeProviderOptions.length > 0 && (
          <div className={styles.paymentProviderRow}>
            <span className={styles.paymentProviderLabel}>ช่องทาง</span>
            <select
              value={selectedProvider}
              onChange={handleProviderChange}
              className={styles.paymentMethodSelect}
            >
              {activeProviderOptions.map((p: any) => (
                <option key={p.provider} value={p.provider}>{p.displayName || p.provider}</option>
              ))}
            </select>
          </div>
        )}

        {showServiceCharge && (
          <div className={styles.serviceChargePanel}>
            <div className={styles.serviceChargeHeader}>
              <span className={styles.serviceChargeTitle}>
                <CreditCard size={13} strokeWidth={2.4} />
                Service charge {serviceChargePercent}%
              </span>
              <span className={styles.serviceChargeBadge}>เรียกเก็บเพิ่มจากลูกค้า</span>
            </div>
            <div className={styles.serviceChargeRow}>
              <span>{selectedOption === 'split' ? 'ยอดชำระผ่านช่องทางนี้' : 'ยอดสุทธิ'}</span>
              <span>{serviceChargeBase.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
            </div>
            <div className={styles.serviceChargeRow}>
              <span>ค่าธรรมเนียม {serviceChargePercent}%</span>
              <span>+{serviceChargeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
            </div>
            <div className={styles.serviceChargeTotalRow}>
              <span className={styles.serviceChargeTotalLabel}>
                {selectedProvider === 'edc' ? '💳 ยอดกดที่เครื่อง EDC' : 'ยอดเรียกเก็บลูกค้า'}
              </span>
              <span className={styles.serviceChargeTotalValue}>
                {serviceChargeGrand.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className={styles.serviceChargeTotalUnit}>บาท</span>
              </span>
            </div>
          </div>
        )}

        {/* Row 2: Split payment inputs */}
        {selectedOption === 'split' && <SplitInputs patBaht={pat_baht} />}
      </div>
    )
  }

  const [addhis, setaddhis] = useState(0)    // add history

  /* คำสั่งที่ยิงมาจากปุ่มลูกค้าบนแถบเครื่องมือหน้าขาย (body_pro_cus.tsx)
     ทุกตัวเป็นตัวนับ — ข้ามรอบแรก (ค่า 0) เพื่อไม่ให้ทำงานเองตอน mount */
  useEffect(() => {
    if (customerSearchRequest === 0) return
    seachNames()          // โหลดรายชื่อใหม่ ให้ได้ข้อมูลล่าสุดก่อนเปิดหน้าค้นหา
    setShow(true)
  }, [customerSearchRequest])

  useEffect(() => {
    if (customerRegisterRequest === 0) return
    setShowRegister(true)
  }, [customerRegisterRequest])

  useEffect(() => {
    if (customerClearRequest === 0) return
    // ชุดเดียวกับปุ่ม reset เดิมในการ์ดข้อมูลลูกค้า
    setatalist((prev: any) => ({ ...prev, names: "" }))
    localStorage.setItem("dg", JSON.stringify([]))
    setaddhis(0)
    setpayw('หน้าร้าน')
    localStorage.setItem('countrow', 'หน้าร้าน')
  }, [customerClearRequest])

  useEffect(() => {
    if (customerFollowUpRequest === 0) return
    // ชุดเดียวกับปุ่ม "ติดตามอาการ" เดิมในการ์ดข้อมูลลูกค้า
    setaddhis(1)
    localStorage.setItem("his", JSON.stringify([{
      followup: String(""),
      solution: String(""),
      id_history: "",
      count: String(1),
      statusH: "",
      duedate: "",
      person: String(localStorage.getItem("person_") || "")
    }]))
    localStorage.setItem("follow_draft", "")
  }, [customerFollowUpRequest])


  // Search ลูกค้า
  function Search_Cus() {


    const handleClose = () => setShow(false);

    const [drugs, setdrugs] = useState([])
    //******* */  Key ค้นหา สินค้า (Optimized for ~4000 records) ************************/
    const [search, setsearch] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    const handleChange = (value: any) => {
      setsearch(value);
    };

    // Debounce search input - wait 400ms after user stops typing
    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedSearch(search);
      }, 400);
      return () => clearTimeout(timer);
    }, [search]);

    // Memoized filtered data - only recalculates when debouncedSearch or searchname changes
    const data = useMemo(() => {
      const lowercasedValue = debouncedSearch.toLowerCase().trim();

      // If empty or less than 2 characters, show first 100 records
      if (lowercasedValue.length < 2) {
        return searchname.slice(0, 100);
      }

      // Optimized filtering with early exit and limit
      const results: any[] = [];
      const maxResults = 100;

      for (let i = 0; i < searchname.length && results.length < maxResults; i++) {
        const user: any = searchname[i];
        const userCode = (user.code || '').toLowerCase();
        const userTel = (user.tel || '').toLowerCase();
        const userName = (user.names || '').toLowerCase();

        // Check code first (startsWith is fastest)
        if (userCode.startsWith(lowercasedValue)) {
          results.push(user);
          continue;
        }
        // Check tel
        if (userTel.includes(lowercasedValue)) {
          results.push(user);
          continue;
        }
        // Check name
        if (userName.includes(lowercasedValue)) {
          results.push(user);
          continue;
        }
        // Check โรคประจำตัว
        const userCongen = (user.congenitalDisease || '').toLowerCase();
        if (userCongen.includes(lowercasedValue)) {
          results.push(user);
          continue;
        }
        // Check ข้อมูลเพิ่มเติม
        const userMoreInfo = (user.moreInfo || '').toLowerCase();
        if (userMoreInfo.includes(lowercasedValue)) {
          results.push(user);
          continue;
        }
        // Check ประวัติแพ้ยา (relation: ชื่อยา + ลักษณะอาการแพ้)
        const userAllergy = Array.isArray(user.drugallergys)
          ? user.drugallergys.map((d: any) => `${d.drugallergy || ''} ${d.remark || ''}`).join(' ').toLowerCase()
          : '';
        if (userAllergy.includes(lowercasedValue)) {
          results.push(user);
        }
      }

      return results;
    }, [debouncedSearch, searchname]);

    //***************************************************************** */
    // หมายเหตุ: show / showRegister ถูกย้ายไปประกาศที่ระดับ BodyTabSale (parent)
    // เพื่อให้ modal ไม่ถูกปิดเองเมื่อ parent re-render (เช่นตอน seachNames())

    // ✅ Key ลัด F2 — เปิดหน้าค้นหาข้อมูลลูกค้า
    useEffect(() => {
      const handleF2 = (e: globalThis.KeyboardEvent) => {
        if (e.key === 'F2') {
          // ไม่เปิดถ้ากำลังพิมพ์อยู่ในช่อง input อื่น (ยกเว้นยังไม่มี modal เปิด)
          e.preventDefault();
          seachNames(); // โหลดรายชื่อลูกค้าใหม่ ให้ได้ข้อมูลล่าสุด (เช่น ข้อมูลเพิ่มเติมที่เพิ่งแก้ไข)
          setShow(true);
        }
      };
      window.addEventListener('keydown', handleF2);
      return () => window.removeEventListener('keydown', handleF2);
    }, []);


    const [idcusS, setidcus] = useState(0)
    const [sh, setsh] = useState([])

    const id_cus1 = String(searchname.filter((supplier: any) => supplier.id === Number(idcusS)).map((supplier: any) => supplier.id))
    const code_cus1 = String(searchname.filter((supplier: any) => supplier.id === Number(idcusS)).map((supplier: any) => supplier.code))
    const name_cus1 = String(searchname.filter((supplier: any) => supplier.id === Number(idcusS)).map((supplier: any) => supplier.names))
    const address_cus1 = String(searchname.filter((supplier: any) => supplier.id === Number(idcusS)).map((supplier: any) => supplier.address))
    const numbertax_cus1 = String(searchname.filter((supplier: any) => supplier.id === Number(idcusS)).map((supplier: any) => supplier.numbertax))
    const tel_cus1 = String(searchname.filter((supplier: any) => supplier.id === Number(idcusS)).map((supplier: any) => supplier.tel))
    const total_cus1 = String(searchname.filter((supplier: any) => supplier.id === Number(idcusS)).map((supplier: any) => supplier.totalPoint))
    const drug_cus1 = String(searchname.filter((supplier: any) => supplier.id === Number(idcusS)).map((supplier: any) => supplier.drugallergy))
    const congen_cus1 = String(searchname.filter((supplier: any) => supplier.id === Number(idcusS)).map((supplier: any) => supplier.congenitalDisease))
    const totalPont1 = String(searchname.filter((supplier: any) => supplier.id === Number(idcusS)).map((supplier: any) => supplier.totalPoint))

    // ข้อมูลสุขภาพของลูกค้าที่เลือก (โรคประจำตัว / ประวัติแพ้ยา / ข้อมูลเพิ่มเติม)
    const selCus: any = searchname.find((c: any) => c.id === Number(idcusS)) || {};
    const selCongen = isBlankInfo(selCus.congenitalDisease) ? "" : String(selCus.congenitalDisease).trim();
    const selAllergies = Array.isArray(selCus.drugallergys)
      ? selCus.drugallergys.filter((d: any) => !isBlankInfo(d?.drugallergy) || !isBlankInfo(d?.remark))
      : [];
    const selMoreInfo = isBlankInfo(selCus.moreInfo) ? "" : String(selCus.moreInfo).trim();

    const GetHistory = async (customerInput: any) => {
      let companyS = (localStorage.getItem("company_") || "")
      const selectedCustomer = typeof customerInput === "object" && customerInput !== null
        ? customerInput
        : searchname.find((customer: any) => Number(customer.id) === Number(customerInput))
      const customerId = Number(selectedCustomer?.id || customerInput || 0)
      const customerCode = String(selectedCustomer?.code || "").trim()

      if (!customerId && !customerCode) {
        setsh([])
        return
      }

      const params = new URLSearchParams({ companyall: companyS })
      if (customerCode) params.set("code_costomer", customerCode)
      if (customerId) params.set("id_costomer", String(customerId))

      try {
        const res = await axios.get(`/api/${getsalehistory}?${params.toString()}`)
        setsh(res.data)
        //   console.log(res.data)
        //   localStorage.setItem("dg",JSON.stringify(res.data))
      } catch (error) {
        if (!isAbortError(error)) console.error(error)
      }
    }

    const GetDrug = async (id: Number) => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res = await axios.get(`/api/${getdrugg}?company=${companyS}&id_cus=${Number(id)}`)
        setdrugs(res.data)
        console.log(res.data)
        localStorage.setItem("dg", JSON.stringify(res.data))
      } catch (error) {
        if (!isAbortError(error)) console.error(error)
      }
    }


    return (
      <>
        <div className={styles.customerSearchActions}>
          <button
            type="button"
            className={styles.customerSearchButton}
            onClick={() => { seachNames(); setShow(true) }}
            title="ค้นหาข้อมูลลูกค้า (F2)"
          >
            <span className={styles.customerSearchIcon}>
              <Search size={14} strokeWidth={2.4} />
            </span>
            <span className={styles.customerSearchText}>ค้นหาลูกค้า</span>
            <span className={styles.customerSearchShortcut}>F2</span>
          </button>

          {name_cus === "" ? "" :
            <button
              type="button"
              className={styles.customerFollowButton}
              onClick={() => {
                setaddhis(1)
                const dd = [{
                  followup: String(""),
                  solution: String(""),
                  id_history: "",
                  count: String(1),
                  statusH: "",
                  duedate: "",
                  person: String(localStorage.getItem("person_") || "")
                }]
                localStorage.setItem("his", JSON.stringify(dd))
                localStorage.setItem("follow_draft", "");
              }}
            >
              ติดตามอาการ
            </button >
          }

          <button
            type="button"
            className={styles.customerResetButton}
            onClick={() => { setatalist({ ...alldatalist, names: "" }), localStorage.setItem("dg", JSON.stringify([])), setaddhis(0), setpayw('หน้าร้าน'), localStorage.setItem('countrow', 'หน้าร้าน') }}
            title="ล้างข้อมูลลูกค้า"
          >
            <RotateCcw size={13} strokeWidth={2.3} />
            reset
          </button >

          {/* ปุ่ม สมัครสมาชิกลูกค้า (manual + smart card reader) */}
          <button
            type="button"
            onClick={() => setShowRegister(true)}
            title="สมัครสมาชิกลูกค้าใหม่"
            className={styles.customerAddButton}
          >
            <UserPlus size={15} strokeWidth={2.4} />
          </button>
        </div>

        <CustomerRegisterModal
          show={showRegister}
          onHide={() => setShowRegister(false)}
          onCreated={async () => { await seachNames(); }}
          onSelectCustomer={(names) => setatalist({ ...alldatalist, names })}
          nextCode={(() => {
            const codes = (searchname as any[]).map((s: any) => Number(s.code)).filter((n: number) => !isNaN(n));
            const max = codes.length ? Math.max(...codes) : 999;
            return max + 1;
          })()}
        />




        <Modal1
          show={show}
          onHide={() => { setShow(false), setatalist({ ...alldatalist, names: "" }) }}
          size="xl"
          dialogClassName="modal-90w"
          aria-labelledby="example-custom-modal-styling-title">
          <Modal1.Header closeButton>
            <Modal1.Title>
            </Modal1.Title>
          </Modal1.Header>
          <Modal1.Body>
            <div className="row" style={{ height: "80vh", overflow: "hidden" }}>
              {/* Left Column: Search & Customer List */}
              <div className="col-5 d-flex flex-column" style={{ height: "100%" }}>
                <div className={styles.cusModalCard}>
                  <div className={styles.cusModalHeader}>
                    <span>ค้นหาลูกค้า</span>
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ fontSize: 12, color: "#64748b" }}>ค้นหา:</span>
                      <input
                        autoFocus
                        value={search}
                        onChange={(e) => handleChange(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && data.length > 0) {
                            const firstResult = data[0];
                            GetDrug(firstResult.id);
                            GetHistory(firstResult);
                            setatalist({ ...alldatalist, names: firstResult.names });
                            setShow(false);
                            const cusLevel = normalizePriceTier(firstResult.levelPrice);
                            setpayw(cusLevel); localStorage.setItem('countrow', cusLevel);
                            warnCustomerInfo(firstResult);
                          }
                        }}
                        className="form-control form-control-sm"
                        placeholder="ชื่อ, รหัส, เบอร์โทร, โรคประจำตัว, แพ้สินค้า, ข้อมูลเพิ่มเติม..."
                        style={{ fontFamily: "Kanit", fontSize: 12, height: 30, width: 280 }}
                      />
                    </div>
                  </div>

                  <div className="p-2 flex-grow-1" style={{ overflowY: "auto" }}>
                    <Table hover size="sm" className="mb-0">
                      <thead style={{ position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
                        <tr style={{ fontSize: 13, borderBottom: "2px solid #edf2f7" }}>
                          <th className="py-2">รหัส</th>
                          <th className="py-2">ชื่อลูกค้า</th>
                          <th className="py-2 text-center">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((post: any) => (
                          <tr key={post.id} style={{ cursor: "pointer" }} onClick={() => { setidcus(post.id), GetHistory(post) }}>
                            <td className="align-middle" style={{ fontSize: 13, color: "#173F6B", fontFamily: "Kanit_B" }}>{post.code}</td>
                            <td className="align-middle">
                              <div style={{ fontSize: 14, color: "#1e293b" }}>{post.names}</div>
                              <div style={{ fontSize: 11, color: "#64748b" }}>📞 {post.tel}</div>
                            </td>
                            <td className="align-middle text-center">
                              <div className="d-flex gap-1 justify-content-center">
                                <button
                                  className="btn btn-sm btn-success px-2"
                                  style={{ fontSize: 11 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    GetDrug(post.id);
                                    GetHistory(post);
                                    setatalist({ ...alldatalist, names: post.names });
                                    setShow(false);
                                    const cusLevel = normalizePriceTier(post.levelPrice);
                                    setpayw(cusLevel); localStorage.setItem('countrow', cusLevel);
                                    warnCustomerInfo(post);
                                  }}
                                >
                                  เลือก
                                </button>
                                <button
                                  className="btn btn-sm btn-primary px-2"
                                  style={{ fontSize: 11 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setidcus(post.id);
                                    GetHistory(post);
                                  }}
                                >
                                  ประวัติ
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Right Column: Customer Details & History */}
              <div className="col-7 d-flex flex-column" style={{ height: "100%" }}>
                <div className={styles.cusModalCard}>
                  <div className={styles.cusModalHeader}>
                    <span>ประวัติการขาย / การรักษา</span>
                    {id_cus1 !== "0" && (
                      <span className="badge bg-primary rounded-pill" style={{ fontSize: 12 }}>
                        ID: {code_cus1}
                      </span>
                    )}
                  </div>

                  <div className="p-3 flex-grow-1" style={{ overflowY: "auto" }}>
                    {idcusS !== 0 ? (
                      <>
                        {/* Customer Info Summary Card */}
                        <div className={styles.cusInfoGrid}>
                          <div className={styles.cusInfoItem}>
                            <div className={styles.cusInfoLabel}>ชื่อ-นามสกุล</div>
                            <div className={styles.cusInfoValue}>{name_cus1}</div>
                          </div>
                          <div className={styles.cusInfoItem}>
                            <div className={styles.cusInfoLabel}>เบอร์โทรศัพท์</div>
                            <div className={styles.cusInfoValue}>{tel_cus1 || "-"}</div>
                          </div>
                          <div className={styles.cusInfoItem}>
                            <div className={styles.cusInfoLabel}>แต้มสะสม</div>
                            <div className={styles.cusInfoValue} style={{ color: "#eab308" }}>
                              {total_cus1} <span style={{ fontSize: 10, color: "#64748b" }}>แต้ม</span>
                            </div>
                          </div>
                          <div className={styles.cusInfoItem}>
                            <div className={styles.cusInfoLabel}>ระดับราคา</div>
                            <div className={styles.cusInfoValue}>{normalizePriceTier(selCus.levelPrice)}</div>
                          </div>
                        </div>

                        {/* ข้อมูลสุขภาพ / ข้อควรระวัง: โรคประจำตัว / ประวัติแพ้ยา / ข้อมูลเพิ่มเติม */}
                        <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 16, overflow: "hidden" }}>
                          <div style={{ padding: "8px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 6 }}>
                            <HeartPulse size={15} color="#dc2626" />
                            <span style={{ fontFamily: "Kanit_B", fontSize: 13, color: "#334155" }}>ข้อมูลสุขภาพ / ข้อควรระวัง</span>
                          </div>
                          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                            {!selCongen && selAllergies.length === 0 && !selMoreInfo ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, background: "#F3F8FC", border: "1px solid #CCDFF1", color: "#1E5088", fontSize: 13, fontFamily: "Kanit" }}>
                                <CircleCheck size={16} /> ไม่มีข้อมูลโรคประจำตัว / แพ้สินค้า / ข้อมูลเพิ่มเติม
                              </div>
                            ) : (
                              <>
                                {selCongen && (
                                  <div style={{ padding: "10px 12px", borderRadius: 8, background: "#fff7ed", border: "1px solid #fed7aa" }}>
                                    <div style={{ fontFamily: "Kanit_B", fontSize: 12, color: "#c2410c", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                                      <HeartPulse size={13} /> โรคประจำตัว
                                    </div>
                                    <div style={{ fontSize: 13, color: "#7c2d12", whiteSpace: "pre-line", fontFamily: "Kanit" }}>{selCongen}</div>
                                  </div>
                                )}
                                {selAllergies.length > 0 && (
                                  <div style={{ padding: "10px 12px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca" }}>
                                    <div style={{ fontFamily: "Kanit_B", fontSize: 12, color: "#b91c1c", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                                      <Pill size={13} /> ประวัติแพ้สินค้า ({selAllergies.length} รายการ)
                                    </div>
                                    {selAllergies.map((d: any, i: number) => (
                                      <div key={i} style={{ fontSize: 13, color: "#7f1d1d", padding: "2px 0", fontFamily: "Kanit" }}>
                                        <span style={{ fontFamily: "Kanit_B" }}>• {d.drugallergy || "-"}</span>
                                        {d.remark ? <span style={{ color: "#991b1b" }}> — {d.remark}</span> : null}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {selMoreInfo && (
                                  <div style={{ padding: "10px 12px", borderRadius: 8, background: "#F3F8FC", border: "1px solid #CCDFF1" }}>
                                    <div style={{ fontFamily: "Kanit_B", fontSize: 12, color: "#1E5088", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                                      <Info size={13} /> ข้อมูลเพิ่มเติม
                                    </div>
                                    <div style={{ fontSize: 13, color: "#12314F", whiteSpace: "pre-line", fontFamily: "Kanit" }}>{selMoreInfo}</div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* History Timeline */}
                        <div className="mt-3">
                          <h6 style={{ fontFamily: "Kanit_B", color: "#475569", marginBottom: 16 }}>รายการประวัติย้อนหลัง</h6>
                          {sh.length > 0 ? (
                            sh.map((s: any) => (
                              <div key={s.id} className={styles.historyEntry}>
                                <div className={styles.historyDate}>
                                  📅 {new Date(s.createDate).toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </div>

                                <div className={styles.historyGrid}>
                                  <div className={styles.treatmentList}>
                                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>รายการที่ซื้อ:</div>
                                    {s.sales.map((a: any) => (
                                      <div key={a.id} className={styles.treatmentItem}>
                                        <span style={{ fontWeight: 600 }}>{a.qty}x</span> {a.name_product}
                                      </div>
                                    ))}
                                  </div>

                                  <div>
                                    {s.historys.map((b: any) => (
                                      <div key={b.id} className={styles.followupBox}>
                                        <div style={{ fontWeight: 600, color: "#92400e", marginBottom: 4 }}>อาการ & การรักษา</div>
                                        <div className="mb-2">{b.followup}</div>
                                        <div style={{ fontSize: 11, color: "#64748b", whiteSpace: "pre-line" }}>
                                          {((b.solution ?? "").split("*").map((item: any) => item.trim()).filter(Boolean).join("\n• "))}
                                        </div>
                                        {b.duedate && (
                                          <div className="mt-2 pt-2 border-top" style={{ fontSize: 10, color: "#b45309" }}>
                                            🔔 ติดตามผล: {new Date(b.duedate).toLocaleDateString('th-TH')}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-5" style={{ color: "#94a3b8" }}>
                              <div style={{ fontSize: 40, marginBottom: 10 }}>📂</div>
                              <div>ไม่พบประวัติการขาย / การรักษา</div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center py-5" style={{ color: "#94a3b8" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
                        <h5 style={{ fontFamily: "Kanit_B" }}>กรุณาเลือกรายชื่อลูกค้า</h5>
                        <p style={{ fontSize: 14 }}>เพื่อแสดงข้อมูลรายบุคคลและประวัติการขาย / การรักษา</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Modal1.Body>
          {/**   <Modal1.Footer>
          <Button1
                variant="secondary"
                onClick={handleClose}
                style={{fontFamily:"Kanit" ,textAlign:"left",fontSize:15,color:"white"}}
                >
            ปิด
          </Button1>
          <Button1 
                variant="primary" 
                onClick={handleClose}
                style={{fontFamily:"Kanit" ,textAlign:"left",fontSize:15,color:"white"}}
                >
            เลือก
          </Button1>
        </Modal1.Footer>*/}
        </Modal1 >


      </>
    );
  }




  type Props = {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
  };

  const SpeechToText: React.FC<Props> = ({
    language = "th-TH",
    continuous = true,
    interimResults = true,
  }) => {

    const [supported, setSupported] = useState<boolean | null>(null);
    const [listening, setListening] = useState(false);
    const [interim, setInterim] = useState("");
    const [finalTranscript, setFinalTranscript] = useState("");
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const [follow, setfollow] = useState("")
    const [sol, setsol] = useState("")
    const [startDate, setStartDate] = useState(() => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      return d;
    });
    const [H, setH] = useState(0)

    // Restore state from localStorage on mount (when component remounts after addhis changes)
    useEffect(() => {
      try {
        const saved = JSON.parse(localStorage.getItem("his") || "[]");
        if (saved.length > 0 && saved[0].followup) {
          setfollow(saved[0].followup);
          setsol(saved[0].solution);
          if (saved[0].duedate) {
            setStartDate(new Date(saved[0].duedate));
          }
        } else {
          const draft = localStorage.getItem("follow_draft") || "";
          if (draft) setfollow(draft);
        }
      } catch (e) { }
    }, []);

    useEffect(() => {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;




      const recognition = new SpeechRecognitionClass() as SpeechRecognition;
      recognition.lang = language;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;

      recognition.onstart = () => setListening(true);

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimText = "";
        let finalText = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
          } else {
            interimText += result[0].transcript;
          }
        }


        if (!SpeechRecognitionClass) {
          setSupported(false);
          return;
        }
        if (finalText) {
          setFinalTranscript((prev) => (prev ? prev + " " + finalText : finalText));
          setfollow((prev) => (prev ? prev + " " + finalText : finalText));
          setInterim("");
        } else {
          setInterim(interimText);
        }
      };








      recognition.onerror = (err) => {
        console.error("Speech recognition error", err);
        setListening(false);
      };

      recognition.onend = () => setListening(false);

      recognitionRef.current = recognition;
      setSupported(true);

      return () => {
        recognition.stop();
        recognitionRef.current = null;
      };
    }, [language, continuous, interimResults]);

    const startListening = async () => {
      if (!recognitionRef.current) return;
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Microphone permission denied", err);
      }
    };

    const stopListening = () => {
      recognitionRef.current?.stop();
      setListening(false);
    };

    useEffect(() => {
      // Only set sol from product list if no saved history exists in localStorage
      const saved = JSON.parse(localStorage.getItem("his") || "[]");
      if (saved.length > 0 && saved[0].solution) return;

      const A1 = list.filter((d: any) => d.label === true).map((a: any) => "*- " + a.fixname + " ช่วย " + a.indicatorlistS + " " + a.useS + " " + a.timeuseS + " " + a.timeS)

      setsol(A1.toString().split(",").map(item => item.trim()).join("\n"))


    }, [Number(idF ?? "")])

    if (supported === false) {
      return (
        <div className="p-4 border rounded bg-red-50 text-red-700">
          <p>เบราว์เซอร์ของคุณไม่รองรับ Speech Recognition API</p>
          <p>แนะนำใช้ Chrome Desktop หรือ Android</p>
        </div>
      );
    }

    const clearText = () => {
      setFinalTranscript("");
      setfollow("");
      setInterim("");
      localStorage.removeItem("follow_draft");

    };


    const SaveHis = async () => {

      const dd = [{
        followup: String(follow ?? ""),
        solution: String(sol ?? ""),
        id_history: "",
        count: String(1),
        statusH: "ติดตามผล",
        duedate: new Date(startDate ?? ""),
        person: String(localStorage.getItem("person_") || "")
      }]

      localStorage.setItem("his", JSON.stringify(dd))

      const saved = JSON.parse(localStorage.getItem("his") || "[]")
      if (saved.length > 0) {
        setfollow(saved[0].followup)
        setsol(saved[0].solution)
        setStartDate(new Date(saved[0].duedate))
      }

      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 14 }}>บันทึกประวัติการติดตาม เรียบร้อย ✅</div>)
      setaddhis(2)
    }




    return (
      <>
        {addhis === 0 ? "" :
          <div className="p-2 border rounded space-y-3 mt-2">
            {/* <div className="flex gap-2">
              <button
                onClick={startListening}
                disabled={listening}
                style={{ fontFamily: "kanit", fontSize: 12 }}
                className="px-3 py-1 bg-blue-500 text-white rounded"
              >
                เริ่มพูด
              </button>
              <button
                onClick={stopListening}
                disabled={!listening}
                style={{ fontFamily: "kanit", fontSize: 12 }}
                className="px-3 py-1 bg-red-500 text-white rounded"
              >
                หยุด
              </button>
              <button
                onClick={clearText}
                style={{ fontFamily: "kanit", fontSize: 12 }}
                className="px-3 py-1 border rounded">
                ล้างข้อความ
              </button>

              <span
                className="ml-auto text-sm text-gray-600"
                style={{ fontFamily: "kanit", fontSize: 12 }}>
                {listening ? "🎙️ กำลังฟัง..." : "⏹️ หยุดฟัง"}
              </span>
            </div> */}

            <div className="row" >

              <div>
                <div className="input-group" style={{ minHeight: 70 }}>
                  <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 80 }}>อาการ</span>
                  <textarea
                    className="form-control"
                    aria-label="With textarea"
                    value={follow ?? ""}
                    onChange={(e) => {
                      setfollow(e.target.value);
                      localStorage.setItem("follow_draft", e.target.value);
                    }}
                    style={{ fontFamily: "kanit", fontSize: 12 }}
                  />

                </div>

              </div>


              <div>
                <div className="input-group mt-2" style={{ minHeight: 130 }}>
                  <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 80 }}>การรักษา</span>
                  <textarea
                    className="form-control"
                    aria-label="With textarea"
                    value={sol ?? ""}
                    onChange={(e) => setsol(e.target.value)}
                    style={{ fontFamily: "kanit", fontSize: 12 }}
                  />

                </div>


              </div>
              <div>
                <div className="row mt-2">
                  <div className="col-2" style={{ fontFamily: "kanit", fontSize: 13, width: 115, marginTop: 5 }}>ติดตามผล วันที่ :</div>
                  <div className='col-2' style={{ width: 200, cursor: "pointer" }}>
                    <DatePicker
                      selected={startDate}
                      onChange={(date: any) => setStartDate(date)}
                      dateFormat="dd/MM/yyyy"
                      className="form-control"
                    />
                  </div>
                  <div className="col-2" style={{ marginLeft: 10 }}>
                    <button
                      className={"btn btn-warning"}
                      style={{ width: 80, height: 35, fontSize: 10, fontFamily: "Kanit" }}
                      onClick={() => { SaveHis() }}>
                      บันทึก
                    </button>
                  </div>

                </div>

              </div>



            </div>



          </div>
        }
      </>



    );
  };






  // input ใบเสนอราคา
  function QuotationTemplate() {

    //*********Loading*********************** */
    const [loading, setLoading] = useState(false);


    // Post Quatation
    const CreateQuatation = async () => {

      let companyS = (localStorage.getItem("company_") || "")

      const companyall = companyS
      const id_costomer = Number(alldatalist.id_costomer)
      const code_costomer = alldatalist.code_costomer
      const name_costomer = String(name_cus)
      const group_price = normalizePriceTier(alldatalist.group_price)
      const pay = getPayLabel(alldatalist.pay)
      const bill = Number(alldatalist.bill)
      const totalall = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)))
      const discount = Number(alldatalist.discount) + Number(alldatalist.promotion)
      const sumtotal = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) - Number(alldatalist.discount) - Number(parseInt(alldatalist.usereward)))
      const addreward = Number(alldatalist.addreward)
      const usereward = Number(alldatalist.usereward)
      const taxnumber = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
        String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
          String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""
      const personall = String(localStorage.getItem("person_") || "")
      const statussall = alldatalist.statuss
      const qt_date = new Date(startDate)
      const qt_enddate = new Date(startDate1)
      const qt_credit = Number(daysDiff)
      const qt_number = Number(maxRecN)
      const qt_orderNo = year + month + day
      const qt_orderfull = "QT" + year + month + day + Number(maxRecN)
      const qt_status = "รออนุมัติ"
      const qt_person = String(localStorage.getItem("person_") || "")
      const qt_remark = ""
      const detailsale = list.map(posts => ({
        company: posts.company,
        id_product: Number(posts.id_product),
        code_product: posts.code_product,
        name_product: posts.name_product,
        cetagory: posts.cetagory,
        unit: posts.unit,
        cost: Number(posts.cost),
        qty: Number(posts.qty),
        price: Number(posts.price),
        discount: Number(posts.discount),
        total: Number(posts.total),
        person: String(localStorage.getItem("person_") || ""),
        statuss: posts.statuss,
      }
      )
      )

      try {
        //   localStorage.setItem("show","1")
        //Save Sale
        await axios.post(`/api/${apiquatation}`,
          {
            companyall, id_costomer, code_costomer, name_costomer, group_price, pay, bill,
            totalall, discount, sumtotal, addreward, usereward, personall, statussall, taxnumber,
            qt_date, qt_number, qt_orderNo, qt_status, qt_person, qt_remark, qt_enddate, qt_credit, qt_orderfull,

            detailsale
          })

      } catch (error) {
        if (!isAbortError(error)) console.error(error)
      }
    }



    const handleClick = async () => {

      setLoading(true);
      await new Promise((r) => setTimeout(r
        , 2000));

      await CreateQuatation()
      await fetchQT()
      setShowW(false)

      seachNames()

      setTimeout(() => {
        deleteall(),
          localStorage.setItem("itemlist", String(list.length)),
          setchangePay("2")
        setatalist(initialValues4)
        setMessage("")
      }, 30);

      setLoading(false);

    };

    let taxNum = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
      String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
        String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""

    const [showW, setShowW] = useState(false);

    // Alert
    const [show, setShow] = useState(false);

    //Print Label
    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn2 = useReactToPrint({ contentRef });

    // input Radio Tax
    const [selectedOptiontax, setSelectedOptiontax] = useState('notax');

    const Radio_tax = () => {

      useEffect(() => {

        setSelectedOptiontax(localStorage.getItem("numbertax_S") || "")
        // fetchQT()
        maxV()

      }, [Number(selectedOptiontax)]);

      const handleOptionChange4 = (e: any) => {

        const { name, value } = e.target;
        setSelectedOptiontax(e.target.value);
        localStorage.setItem("numbertax_S", e.target.value)
      };
      return (

        <>
          <div className="col">

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="notax" // Same name for all radio buttons in the group
                value="notax"
                checked={selectedOptiontax === 'notax'} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }} />
              ไม่หักภาษี
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="three" // Same name for all radio buttons in the group
                value="three"
                checked={selectedOptiontax === 'three'} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }} />
              หักภาษี 3 %
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="seven"
                value="seven"
                checked={selectedOptiontax === 'seven'}
                onChange={handleOptionChange4}
                style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }} />
              หักภาษี 7 %
            </label>
          </div>

        </>
      )
    }

    //***Order Date Diff */
    const [startDate, setStartDate] = useState(new Date());
    const [startDate1, setStartDate1] = useState(new Date());

    let date1 = new Date(startDate);
    let date2 = new Date(startDate1);

    // Convert dates to UTC timestamps
    let utc1 =
      Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    let utc2 =
      Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

    // Calculate the time difference in milliseconds
    let timeDiff = Math.abs(utc2 - utc1);

    // Convert milliseconds to days
    let daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));



    return (


      <>
        <>
          <Alert show={show} variant="warning" style={{ margin: 5 }}>
            <Alert.Heading style={{ fontSize: 13, fontFamily: "Kanit" }}>ไม่สามารถ สร้างใบเสนอราคาได้ !</Alert.Heading>
            <hr />
            <p style={{ fontSize: 14, fontFamily: "Kanit" }}>
              กรุณาคลิก "กลับ (F10)" และ กรอก "ข้อมูลลูกค้า" ให้ครบถ้วนค่ะ
            </p>
            <hr />
            <div className="d-flex justify-content-end">

              <button style={{ fontSize: 14, fontFamily: "Kanit" }} onClick={() => setShow(false)} className="outline-success">
                ปิด
              </button>
            </div>
          </Alert>

          {!show && <button
            disabled={list.length < 1 ? true : false}
            onClick={() => { name_cus === "" ? setShow(true) : setShowW(true), maxV() }}
            type="button"
            className={styles.templateButton}>
            ใบเสนอราคา
          </button>}
        </>

        <Modal_qa
          show={showW}
          onHide={() => setShowW(false)}
          size="lg"
          scrollable={true}
          //  fullscreen={true}
          //  dialogClassName="80w"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_qa.Header closeButton>
            <Modal_qa.Title id="example-custom-modal-styling-title">
              <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>สร้างใบเสนอราคา</div>
            </Modal_qa.Title>
          </Modal_qa.Header>
          <Modal_qa.Body style={{ backgroundColor: "grey" }}>

            <div className="col  " style={{ justifySelf: "center", backgroundColor: "white", marginLeft: 20, marginRight: 20 }} ref={contentRef} >


              <div className="row" style={{ height: 60 }}></div>
              <div className="row" style={{ marginLeft: 20 }}>

                <div className="col " >

                  {/**ผูขาย */}
                  <div className="row mt-4" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ขาย</div>
                  <div className="row  " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{storeS}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{addressS}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{taxS}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {telS}</div>



                  {/**ผู้ซื้อ */}
                  <div className="row mt-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ชื้อ</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{name_cus}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{address_cus}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{numbertax_cus}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {tel_cus}</div>

                </div>

                {/**ใบเสนราคา */}
                <div className="col ">
                  <div className="row "
                    style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 20, justifySelf: "center" }}>
                    ใบเสนอราคา
                  </div>
                  <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                  {/**** */}
                  <div className="row">
                    <div className="col-4 ">
                      <div style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เลขที่ :</div>
                      <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เครดิต :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันครบกำหนด :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>ผู้ขาย :</div>
                    </div>
                    <div className="col ">
                      <div className="col " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>QT{year}{month}{day}{maxRecN}</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>

                        {/**Open */}
                        <div className='border border-black shadow shadow-sm rounded ' style={{ width: 130, height: 25 }}>
                          <div style={{ width: 100, marginLeft: 10, marginTop: 2 }}>
                            <DatePicker
                              value={new Date(startDate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                              selected={startDate}
                              onChange={(date: any) => setStartDate(date)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{daysDiff} วัน</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>
                        <div className='border border-black shadow shadow-sm rounded ' style={{ width: 130, height: 25 }}>
                          <div style={{ width: 100, marginLeft: 10, marginTop: 2 }}>
                            <DatePicker value={new Date(startDate1).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })} selected={startDate1} onChange={(date: any) => setStartDate1(date)} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>ชื่อผู้ขาย</div>
                    </div>
                  </div>

                  <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                </div>
              </div>

              <div className="row mt-3" style={{ marginLeft: 20, marginRight: 20 }}>
                <div className="d-flex bd-highlight" style={{ justifySelf: "right" }}>
                  <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit_B", fontSize: 11, textAlign: "start", height: 15, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>รายการ</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 45 }}>จำนวน</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>หน่วย</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 70 }}>ราคาต่อหน่วย</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>ลด/ชิ้น</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>รวม</div>
                </div>
                <div className="mt-1 " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                <table className="table"   >
                  <tbody className="">
                    <tr className="">
                      <td className="">
                        {list.map((a: any) =>
                          <div key={a.id} id="selcet-print">
                            <div className="d-flex bd-highlight" style={{ justifyItems: "end" }} >
                              <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", height: 23, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>{a.name_product}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", height: 23, width: 30 }}>{a.qty}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50 }}>{a.unit}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 70 }}>{a.price}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50 }}>{a.discount}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50, marginRight: 5 }}>{a.total}</div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className=" " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                <div className="row " style={{ fontFamily: "kanit", fontSize: 11, justifySelf: "left", marginLeft: 3 }}>ทั้งหมด : {list.length} รายการ  </div>

                {/**ท้ายบิล Slip */}
                <div className="container">
                  <div className="row ">
                    <div className="col ">
                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>รวมเงิน :</div>
                        <div className=" bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20, }}>{list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)}</div>
                        <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ส่วนลดท้ายบิล :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{Number(alldatalist.discount) + Number(alldatalist.promotion)}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      {Number(memberDiscountTotal || 0) > 0 && (
                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ส่วนลดสมาชิก :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{formatMemberDiscountAmount(memberDiscountTotal)}</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>
                      )}

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ใช้แต้มส่วนลด :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{parseInt(String(alldatalist.usereward))}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      {String(taxNum) === "" ? "" :
                        <div>
                          <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>จำนวนเงินรวมทั้งสิ้น :</div>
                            <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(memberDiscountTotal || 0)
                              - Number(parseInt(alldatalist.usereward))
                            }</div>
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                          </div>
                          <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                          <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>หักภาษี ณ ที่จ่าย {String(taxNum)} % :</div>
                            <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{(((Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(memberDiscountTotal || 0)
                              - Number(parseInt(alldatalist.usereward))) * Number(taxNum)) / 100).toFixed(1)
                            }</div>
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                          </div>
                        </div>
                      }

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 30 }}>ยอดชำระทั้งหมด :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 30 }}>{
                          (Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                            - Number(alldatalist.discount)
                            - Number(alldatalist.promotion)
                            - Number(memberDiscountTotal || 0)
                            - Number(parseInt(alldatalist.usereward)) +
                            ((Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(memberDiscountTotal || 0)
                              - Number(parseInt(alldatalist.usereward))) * Number(taxNum)) / 100).toFixed(1)
                        }</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 30 }}>บาท</div>
                      </div>
                      <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                    </div>
                    <div className="h-5"></div>
                  </div>
                </div>


                <div className="row mt-3">
                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ในนาม {name_cus}</div></div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>.......................................................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>ผู้สั่งซื้อสินค้า</div>
                      </div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>........../............/.....................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>วันที่</div>

                      </div>
                    </div>

                  </div>
                  <div className="col-sm-1" style={{ justifyItems: "center" }}>

                  </div>

                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row" >
                      <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ในนาม {storeS}</div></div>

                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>......................................................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>ผู้อนุมัติ</div>
                      </div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>........./.........../....................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>วันที่</div>

                      </div>
                    </div>
                  </div>
                </div>

              </div>



            </div>




          </Modal_qa.Body>
          <Modal_qa.Footer>
            <Radio_tax />
            <button
              className="btn btn-primary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={reactToPrintFn2}>
              Print
            </button>

            <button
              className="btn btn-success"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={handleClick}>
              {loading ? (
                <>
                  <SpinnerIcon size={9} color="text-white" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึก</span>
              )}

            </button>
            <button
              className="btn btn-secondary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={() => setShowW(false)}>
              ปิด
            </button>

          </Modal_qa.Footer>
        </Modal_qa>

      </>

    )
  }

  // input ใบวางบิล
  function BillTemplate() {

    //*********Loading*********************** */
    const [loading, setLoading] = useState(false);


    // Post Quatation
    const CreateBill = async () => {

      let companyS = (localStorage.getItem("company_") || "")

      const companyall = companyS
      const id_costomer = Number(alldatalist.id_costomer)
      const code_costomer = alldatalist.code_costomer
      const name_costomer = String(name_cus)
      const group_price = normalizePriceTier(alldatalist.group_price)
      const pay = getPayLabel(alldatalist.pay)
      const bill = Number(alldatalist.bill)
      const totalall = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)))
      const discount = Number(alldatalist.discount) + Number(alldatalist.promotion)
      const sumtotal = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) - Number(alldatalist.discount) - Number(parseInt(alldatalist.usereward)))
      const addreward = Number(alldatalist.addreward)
      const usereward = Number(alldatalist.usereward)
      const taxnumber = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
        String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
          String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""
      const personall = String(localStorage.getItem("person_") || "")
      const statussall = alldatalist.statuss
      const bl_date = new Date(startDate)
      const bl_enddate = new Date(startDate1)
      const bl_credit = Number(daysDiff)
      const bl_number = Number(maxRecNB)
      const bl_orderNo = year + month + day
      const bl_orderfull = "BL" + year + month + day + Number(maxRecNB)
      const bl_status = "รออนุมัติ"
      const bl_person = ""
      const bl_remark = ""
      const detailsale = list.map(posts => ({
        company: posts.company,
        id_product: Number(posts.id_product),
        code_product: posts.code_product,
        name_product: posts.name_product,
        cetagory: posts.cetagory,
        unit: posts.unit,
        cost: Number(posts.cost),
        qty: Number(posts.qty),
        price: Number(posts.price),
        discount: Number(posts.discount),
        total: Number(posts.total),
        person: String(localStorage.getItem("person_") || ""),
        statuss: posts.statuss,
      }
      )
      )

      try {
        //   localStorage.setItem("show","1")
        //Save Sale
        await axios.post(`/api/${apiquatation}`,
          {
            companyall, id_costomer, code_costomer, name_costomer, group_price, pay, bill,
            totalall, discount, sumtotal, addreward, usereward, personall, statussall, taxnumber,
            bl_date, bl_number, bl_orderNo, bl_status, bl_person, bl_remark, bl_enddate, bl_credit, bl_orderfull,

            detailsale
          })

      } catch (error) {
        if (!isAbortError(error)) console.error(error)
      }
    }



    const handleClick = async () => {

      setLoading(true);
      await new Promise((r) => setTimeout(r
        , 2000));

      //  SaleMainSubmit(),
      //    setMessage("")
      await CreateBill()
      await fetchQT()
      setShowW(false)

      seachNames()
      setTimeout(() => {
        deleteall(),
          localStorage.setItem("itemlist", String(list.length)),
          setchangePay("2")
        setatalist(initialValues4)
        setMessage("")
      }, 30);


      setLoading(false);

    };

    let taxNum = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
      String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
        String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""

    const [showW, setShowW] = useState(false);

    // Alert
    const [show, setShow] = useState(false);

    //Print Label
    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn2 = useReactToPrint({ contentRef });

    // input Radio Tax
    const [selectedOptiontax, setSelectedOptiontax] = useState('notax');

    const Radio_tax = () => {

      useEffect(() => {

        setSelectedOptiontax(localStorage.getItem("numbertax_S") || "")
        // fetchQT()
        maxVB()

      }, [Number(selectedOptiontax)]);

      const handleOptionChange4 = (e: any) => {

        const { name, value } = e.target;
        setSelectedOptiontax(e.target.value);
        localStorage.setItem("numbertax_S", e.target.value)
      };
      return (

        <>
          <div className="col">

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="notax" // Same name for all radio buttons in the group
                value="notax"
                checked={selectedOptiontax === 'notax'} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }} />
              ไม่หักภาษี
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="three" // Same name for all radio buttons in the group
                value="three"
                checked={selectedOptiontax === 'three'} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }} />
              หักภาษี 3 %
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="seven"
                value="seven"
                checked={selectedOptiontax === 'seven'}
                onChange={handleOptionChange4}
                style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }} />
              หักภาษี 7 %
            </label>
          </div>

        </>
      )
    }

    //***Order Date Diff */
    const [startDate, setStartDate] = useState(new Date());
    const [startDate1, setStartDate1] = useState(new Date());

    let date1 = new Date(startDate);
    let date2 = new Date(startDate1);

    // Convert dates to UTC timestamps
    let utc1 =
      Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    let utc2 =
      Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

    // Calculate the time difference in milliseconds
    let timeDiff = Math.abs(utc2 - utc1);

    // Convert milliseconds to days
    let daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));



    return (


      <>
        <>
          <Alert show={show} variant="warning" style={{ margin: 5 }}>
            <Alert.Heading style={{ fontSize: 13, fontFamily: "Kanit" }}>ไม่สามารถ สร้างใบวางบิลได้ !</Alert.Heading>
            <hr />
            <p style={{ fontSize: 14, fontFamily: "Kanit" }}>
              กรุณาคลิก "กลับ (F10)" และ กรอก "ข้อมูลลูกค้า" ให้ครบถ้วนค่ะ
            </p>
            <hr />
            <div className="d-flex justify-content-end">

              <button style={{ fontSize: 14, fontFamily: "Kanit" }} onClick={() => setShow(false)} className="outline-success">
                ปิด
              </button>
            </div>
          </Alert>

          {!show && <button
            disabled={list.length < 1 ? true : false}
            onClick={() => { name_cus === "" ? setShow(true) : setShowW(true) }}
            type="button"
            className={styles.templateButton}>
            ใบวางบิล
          </button>}
        </>

        <Modal_qa
          show={showW}
          onHide={() => setShowW(false)}
          size="lg"
          scrollable={true}
          //  fullscreen={true}
          //  dialogClassName="80w"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_qa.Header closeButton>
            <Modal_qa.Title id="example-custom-modal-styling-title">
              <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>สร้างใบวางบิล</div>
            </Modal_qa.Title>
          </Modal_qa.Header>
          <Modal_qa.Body style={{ backgroundColor: "grey" }}>

            <div className="col  " style={{ justifySelf: "center", backgroundColor: "white", marginLeft: 20, marginRight: 20 }} ref={contentRef} >


              <div className="row" style={{ height: 60 }}></div>
              <div className="row" style={{ marginLeft: 20 }}>

                <div className="col " >

                  {/**ผูขาย */}
                  <div className="row mt-4" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ขาย</div>
                  <div className="row  " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{storeS}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{addressS}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{taxS}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {telS}</div>



                  {/**ผู้ซื้อ */}
                  <div className="row mt-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ชื้อ</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{name_cus}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{address_cus}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{numbertax_cus}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {tel_cus}</div>

                </div>

                {/**ใบเสนราคา */}
                <div className="col ">
                  <div className="row "
                    style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 20, justifySelf: "center" }}>
                    ใบวางบิล
                  </div>
                  <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                  {/**** */}
                  <div className="row">
                    <div className="col-4 ">
                      <div style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เลขที่ :</div>
                      <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เครดิต :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันครบกำหนด :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>ผู้ขาย :</div>
                    </div>
                    <div className="col ">
                      <div className="col " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>BL{year}{month}{day}{maxRecNB}</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>

                        {/**Open */}
                        <div className='border border-black shadow shadow-sm rounded ' style={{ width: 130, height: 25 }}>
                          <div style={{ width: 100, marginLeft: 10, marginTop: 2 }}>
                            <DatePicker
                              value={new Date(startDate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                              //  selected={startDate} 
                              onChange={(date: any) => setStartDate(date)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{daysDiff} วัน</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>
                        <div className='border border-black shadow shadow-sm rounded ' style={{ width: 130, height: 25 }}>
                          <div style={{ width: 100, marginLeft: 10, marginTop: 2 }}>
                            <DatePicker value={new Date(startDate1).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                              //selected={startDate1} 
                              onChange={(date: any) => setStartDate1(date)} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>ชื่อผู้ขาย</div>
                    </div>
                  </div>

                  <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                </div>
              </div>

              <div className="row mt-3" style={{ marginLeft: 20, marginRight: 20 }}>
                <div className="d-flex bd-highlight" style={{ justifySelf: "right" }}>
                  <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit_B", fontSize: 11, textAlign: "start", height: 15, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>รายการ</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 45 }}>จำนวน</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>หน่วย</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 70 }}>ราคาต่อหน่วย</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>ลด/ชิ้น</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>รวม</div>
                </div>
                <div className="mt-1 " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                <table className="table"   >
                  <tbody className="">
                    <tr className="">
                      <td className="">
                        {list.map((a: any) =>
                          <div key={a.id} id="selcet-print">
                            <div className="d-flex bd-highlight" style={{ justifyItems: "end" }} >
                              <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", height: 23, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>{a.name_product}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", height: 23, width: 30 }}>{a.qty}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50 }}>{a.unit}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 70 }}>{a.price}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50 }}>{a.discount}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50, marginRight: 5 }}>{a.total}</div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className=" " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                <div className="row " style={{ fontFamily: "kanit", fontSize: 11, justifySelf: "left", marginLeft: 3 }}>ทั้งหมด : {list.length} รายการ  </div>

                {/**ท้ายบิล Slip */}
                <div className="container">
                  <div className="row ">
                    <div className="col ">
                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>รวมเงิน :</div>
                        <div className=" bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20, }}>{list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)}</div>
                        <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ส่วนลดท้ายบิล :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{Number(alldatalist.discount) + Number(alldatalist.promotion)}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      {Number(memberDiscountTotal || 0) > 0 && (
                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ส่วนลดสมาชิก :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{formatMemberDiscountAmount(memberDiscountTotal)}</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>
                      )}

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ใช้แต้มส่วนลด :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{parseInt(String(alldatalist.usereward))}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      {String(taxNum) === "" ? "" :
                        <div>
                          <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>จำนวนเงินรวมทั้งสิ้น :</div>
                            <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(memberDiscountTotal || 0)
                              - Number(parseInt(alldatalist.usereward))
                            }</div>
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                          </div>
                          <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                          <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>หักภาษี ณ ที่จ่าย {String(taxNum)} % :</div>
                            <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{(((Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(memberDiscountTotal || 0)
                              - Number(parseInt(alldatalist.usereward))) * Number(taxNum)) / 100).toFixed(1)
                            }</div>
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                          </div>
                        </div>
                      }

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 30 }}>ยอดชำระทั้งหมด :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 30 }}>{
                          (Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                            - Number(alldatalist.discount)
                            - Number(alldatalist.promotion)
                            - Number(memberDiscountTotal || 0)
                            - Number(parseInt(alldatalist.usereward)) +
                            ((Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(memberDiscountTotal || 0)
                              - Number(parseInt(alldatalist.usereward))) * Number(taxNum)) / 100).toFixed(1)
                        }</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 30 }}>บาท</div>
                      </div>
                      <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                    </div>
                    <div className="h-5"></div>
                  </div>
                </div>


                <div className="row mt-3">
                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ในนาม {name_cus}</div></div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>.......................................................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>ผู้สั่งซื้อสินค้า</div>
                      </div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>........../............/.....................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>วันที่</div>

                      </div>
                    </div>

                  </div>
                  <div className="col-sm-1" style={{ justifyItems: "center" }}>

                  </div>

                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row" >
                      <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ในนาม {storeS}</div></div>

                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>......................................................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>ผู้อนุมัติ</div>
                      </div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>........./.........../....................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>วันที่</div>

                      </div>
                    </div>
                  </div>
                </div>

              </div>



            </div>




          </Modal_qa.Body>
          <Modal_qa.Footer>
            <Radio_tax />
            <button
              className="btn btn-primary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={reactToPrintFn2}>
              Print
            </button>

            <button
              className="btn btn-success"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={handleClick}>
              {loading ? (
                <>
                  <SpinnerIcon size={9} color="text-white" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึก</span>
              )}

            </button>
            <button
              className="btn btn-secondary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={() => setShowW(false)}>
              ปิด
            </button>

          </Modal_qa.Footer>
        </Modal_qa>

      </>

    )
  }

  // input ใบแจ้งหนี้
  function InvoiceTemplate() {

    //*********Loading*********************** */
    const [loading, setLoading] = useState(false);


    // Post Quatation
    const CreateBill = async () => {

      let companyS = (localStorage.getItem("company_") || "")

      const companyall = companyS
      const id_costomer = Number(alldatalist.id_costomer)
      const code_costomer = alldatalist.code_costomer
      const name_costomer = String(name_cus)
      const group_price = normalizePriceTier(alldatalist.group_price)
      const pay = getPayLabel(alldatalist.pay)
      const bill = Number(alldatalist.bill)
      const totalall = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)))
      const discount = Number(alldatalist.discount) + Number(alldatalist.promotion)
      const sumtotal = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) - Number(alldatalist.discount) - Number(parseInt(alldatalist.usereward)))
      const addreward = Number(alldatalist.addreward)
      const usereward = Number(alldatalist.usereward)
      const taxnumber = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
        String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
          String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""
      const personall = String(localStorage.getItem("person_") || "")
      const statussall = alldatalist.statuss
      const inv_date = new Date(startDate)
      const inv_enddate = new Date(startDate1)
      const inv_credit = Number(daysDiff)
      const inv_number = Number(maxRecNI)
      const inv_orderNo = year + month + day
      const inv_orderfull = "INV" + year + month + day + Number(maxRecNI)
      const inv_status = "รออนุมัติ"
      const inv_person = ""
      const inv_remark = ""
      const detailsale = list.map(posts => ({
        company: posts.company,
        id_product: Number(posts.id_product),
        code_product: posts.code_product,
        name_product: posts.name_product,
        cetagory: posts.cetagory,
        unit: posts.unit,
        cost: Number(posts.cost),
        qty: Number(posts.qty),
        price: Number(posts.price),
        discount: Number(posts.discount),
        total: Number(posts.total),
        person: String(localStorage.getItem("person_") || ""),
        statuss: posts.statuss,
      }
      )
      )

      try {
        //   localStorage.setItem("show","1")
        //Save Sale
        await axios.post(`/api/${apiquatation}`,
          {
            companyall, id_costomer, code_costomer, name_costomer, group_price, pay, bill,
            totalall, discount, sumtotal, addreward, usereward, personall, statussall, taxnumber,
            inv_date, inv_number, inv_orderNo, inv_status, inv_person, inv_remark, inv_enddate, inv_credit, inv_orderfull,

            detailsale
          })

      } catch (error) {
        if (!isAbortError(error)) console.error(error)
      }
    }



    const handleClick = async () => {

      setLoading(true);
      await new Promise((r) => setTimeout(r
        , 2000));

      //  SaleMainSubmit(),
      //    setMessage("")
      await CreateBill()
      await fetchQT()
      setShowW(false)


      seachNames()

      setTimeout(() => {
        deleteall(),
          localStorage.setItem("itemlist", String(list.length)),
          setchangePay("2")
        setatalist(initialValues4)
        setMessage("")
      }, 30);


      setLoading(false);

    };

    let taxNum = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
      String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
        String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""

    const [showW, setShowW] = useState(false);

    // Alert
    const [show, setShow] = useState(false);

    //Print Label
    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn2 = useReactToPrint({ contentRef });

    // input Radio Tax
    const [selectedOptiontax, setSelectedOptiontax] = useState('notax');

    const Radio_tax = () => {

      useEffect(() => {

        setSelectedOptiontax(localStorage.getItem("numbertax_S") || "")
        // fetchQT()
        maxVI()

      }, [Number(selectedOptiontax)]);

      const handleOptionChange4 = (e: any) => {

        const { name, value } = e.target;
        setSelectedOptiontax(e.target.value);
        localStorage.setItem("numbertax_S", e.target.value)
      };
      return (

        <>
          <div className="col">

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="notax" // Same name for all radio buttons in the group
                value="notax"
                checked={selectedOptiontax === 'notax'} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }} />
              ไม่หักภาษี
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="three" // Same name for all radio buttons in the group
                value="three"
                checked={selectedOptiontax === 'three'} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }} />
              หักภาษี 3 %
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="seven"
                value="seven"
                checked={selectedOptiontax === 'seven'}
                onChange={handleOptionChange4}
                style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }} />
              หักภาษี 7 %
            </label>
          </div>

        </>
      )
    }

    //***Order Date Diff */
    const [startDate, setStartDate] = useState(new Date());
    const [startDate1, setStartDate1] = useState(new Date());

    let date1 = new Date(startDate);
    let date2 = new Date(startDate1);

    // Convert dates to UTC timestamps
    let utc1 =
      Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    let utc2 =
      Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

    // Calculate the time difference in milliseconds
    let timeDiff = Math.abs(utc2 - utc1);

    // Convert milliseconds to days
    let daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));



    return (


      <>
        <>
          <Alert show={show} variant="warning" style={{ margin: 5 }}>
            <Alert.Heading style={{ fontSize: 13, fontFamily: "Kanit" }}>ไม่สามารถ สร้างใบแจข้งหนี้ได้ !</Alert.Heading>
            <hr />
            <p style={{ fontSize: 14, fontFamily: "Kanit" }}>
              กรุณาคลิก "กลับ (F10)" และ กรอก "ข้อมูลลูกค้า" ให้ครบถ้วนค่ะ
            </p>
            <hr />
            <div className="d-flex justify-content-end">

              <button style={{ fontSize: 14, fontFamily: "Kanit" }} onClick={() => setShow(false)} className="outline-success">
                ปิด
              </button>
            </div>
          </Alert>

          {!show && <button
            disabled={list.length < 1 ? true : false}
            onClick={() => { name_cus === "" ? setShow(true) : setShowW(true), maxVI() }}
            type="button"
            className={styles.templateButton}>
            ใบแจ้งหนี้
          </button>}
        </>

        <Modal_qa
          show={showW}
          onHide={() => setShowW(false)}
          size="lg"
          scrollable={true}
          //  fullscreen={true}
          //  dialogClassName="80w"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_qa.Header closeButton>
            <Modal_qa.Title id="example-custom-modal-styling-title">
              <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>สร้างใบแจ้งหนี้</div>
            </Modal_qa.Title>
          </Modal_qa.Header>
          <Modal_qa.Body style={{ backgroundColor: "grey" }}>

            <div className="col  " style={{ justifySelf: "center", backgroundColor: "white", marginLeft: 20, marginRight: 20 }} ref={contentRef} >


              <div className="row" style={{ height: 60 }}></div>
              <div className="row" style={{ marginLeft: 20 }}>

                <div className="col " >

                  {/**ผูขาย */}
                  <div className="row mt-4" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ขาย</div>
                  <div className="row  " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{storeS}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{addressS}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{taxS}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {telS}</div>



                  {/**ผู้ซื้อ */}
                  <div className="row mt-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ชื้อ</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{name_cus}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{address_cus}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{numbertax_cus}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {tel_cus}</div>

                </div>

                {/**ใบเสนราคา */}
                <div className="col ">
                  <div className="row "
                    style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 20, justifySelf: "center" }}>
                    ใบแจ้งหนี้
                  </div>
                  <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                  {/**** */}
                  <div className="row">
                    <div className="col-4 ">
                      <div style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เลขที่ :</div>
                      <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เครดิต :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันครบกำหนด :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>ผู้ขาย :</div>
                    </div>
                    <div className="col ">
                      <div className="col " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>INV{year}{month}{day}{maxRecNI}</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>

                        {/**Open */}
                        <div className='border border-black shadow shadow-sm rounded ' style={{ width: 130, height: 25 }}>
                          <div style={{ width: 100, marginLeft: 10, marginTop: 2 }}>
                            <DatePicker
                              value={new Date(startDate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                              //  selected={startDate} 
                              onChange={(date: any) => setStartDate(date)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{daysDiff} วัน</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>
                        <div className='border border-black shadow shadow-sm rounded ' style={{ width: 130, height: 25 }}>
                          <div style={{ width: 100, marginLeft: 10, marginTop: 2 }}>
                            <DatePicker value={new Date(startDate1).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                              //selected={startDate1} 
                              onChange={(date: any) => setStartDate1(date)} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>ชื่อผู้ขาย</div>
                    </div>
                  </div>

                  <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                </div>
              </div>

              <div className="row mt-3" style={{ marginLeft: 20, marginRight: 20 }}>
                <div className="d-flex bd-highlight" style={{ justifySelf: "right" }}>
                  <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit_B", fontSize: 11, textAlign: "start", height: 15, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>รายการ</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 45 }}>จำนวน</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>หน่วย</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 70 }}>ราคาต่อหน่วย</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>ลด/ชิ้น</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>รวม</div>
                </div>
                <div className="mt-1 " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                <table className="table"   >
                  <tbody className="">
                    <tr className="">
                      <td className="">
                        {list.map((a: any) =>
                          <div key={a.id} id="selcet-print">
                            <div className="d-flex bd-highlight" style={{ justifyItems: "end" }} >
                              <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", height: 23, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>{a.name_product}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", height: 23, width: 30 }}>{a.qty}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50 }}>{a.unit}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 70 }}>{a.price}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50 }}>{a.discount}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50, marginRight: 5 }}>{a.total}</div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className=" " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                <div className="row " style={{ fontFamily: "kanit", fontSize: 11, justifySelf: "left", marginLeft: 3 }}>ทั้งหมด : {list.length} รายการ  </div>

                {/**ท้ายบิล Slip */}
                <div className="container">
                  <div className="row ">
                    <div className="col ">
                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>รวมเงิน :</div>
                        <div className=" bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20, }}>{list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)}</div>
                        <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ส่วนลดท้ายบิล :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{Number(alldatalist.discount) + Number(alldatalist.promotion)}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ใช้แต้มส่วนลด :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{parseInt(String(alldatalist.usereward))}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      {String(taxNum) === "" ? "" :
                        <div>
                          <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>จำนวนเงินรวมทั้งสิ้น :</div>
                            <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(parseInt(alldatalist.usereward))
                            }</div>
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                          </div>
                          <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                          <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>หักภาษี ณ ที่จ่าย {String(taxNum)} % :</div>
                            <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{(((Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(parseInt(alldatalist.usereward))) * Number(taxNum)) / 100).toFixed(1)
                            }</div>
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                          </div>
                        </div>
                      }

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 30 }}>ยอดชำระทั้งหมด :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 30 }}>{
                          (Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                            - Number(alldatalist.discount)
                            - Number(alldatalist.promotion)
                            - Number(parseInt(alldatalist.usereward)) +
                            ((Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(parseInt(alldatalist.usereward))) * Number(taxNum)) / 100).toFixed(1)
                        }</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 30 }}>บาท</div>
                      </div>
                      <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                    </div>
                    <div className="h-5"></div>
                  </div>
                </div>


                <div className="row mt-3">
                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ในนาม {name_cus}</div></div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>.......................................................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>ผู้สั่งซื้อสินค้า</div>
                      </div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>........../............/.....................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>วันที่</div>

                      </div>
                    </div>

                  </div>
                  <div className="col-sm-1" style={{ justifyItems: "center" }}>

                  </div>

                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row" >
                      <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ในนาม {storeS}</div></div>

                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>......................................................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>ผู้อนุมัติ</div>
                      </div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>........./.........../....................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>วันที่</div>

                      </div>
                    </div>
                  </div>
                </div>

              </div>



            </div>




          </Modal_qa.Body>
          <Modal_qa.Footer>
            <Radio_tax />
            <button
              className="btn btn-primary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={reactToPrintFn2}>
              Print
            </button>

            <button
              className="btn btn-success"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={handleClick}>
              {loading ? (
                <>
                  <SpinnerIcon size={9} color="text-white" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึก</span>
              )}

            </button>
            <button
              className="btn btn-secondary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={() => setShowW(false)}>
              ปิด
            </button>

          </Modal_qa.Footer>
        </Modal_qa>

      </>

    )
  }

  // input ใบส่งสินค้า
  function DeliveryTemplate() {

    //*********Loading*********************** */
    const [loading, setLoading] = useState(false);

    const [showW, setShowW] = useState(false);

    // Alert
    const [show, setShow] = useState(false);

    //Print Label
    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn3 = useReactToPrint({ contentRef });

    //***Order Date Diff */
    const [startDate, setStartDate] = useState(new Date());
    const [startDate1, setStartDate1] = useState(new Date());

    let date1 = new Date(startDate);
    let date2 = new Date(startDate1);

    let utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    let utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

    let timeDiff = Math.abs(utc2 - utc1);
    let daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    let taxNum = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
      String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
        String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""

    // input Radio Tax
    const [selectedOptiontax, setSelectedOptiontax] = useState('notax');

    const Radio_tax = () => {

      useEffect(() => {

        setSelectedOptiontax(localStorage.getItem("numbertax_S") || "")
        maxVD()

      }, [Number(selectedOptiontax)]);

      const handleOptionChange4 = (e: any) => {

        setSelectedOptiontax(e.target.value);
        localStorage.setItem("numbertax_S", e.target.value)
      };
      return (

        <>
          <div className="d-flex align-items-center" style={{ gap: 14, flexWrap: 'nowrap' }}>
            <span style={{ fontFamily: "Kanit_B", fontSize: 13, color: "#495057", whiteSpace: 'nowrap' }}>ภาษีหัก ณ ที่จ่าย :</span>

            <label className="d-flex align-items-center" style={{ fontFamily: "Kanit", fontSize: 13, gap: 6, marginBottom: 0, whiteSpace: 'nowrap' }}>
              <input
                type="radio"
                name="dn_notax"
                value="notax"
                checked={selectedOptiontax === 'notax'}
                onChange={handleOptionChange4} />
              ไม่หักภาษี
            </label>

            <label className="d-flex align-items-center" style={{ fontFamily: "Kanit", fontSize: 13, gap: 6, marginBottom: 0, whiteSpace: 'nowrap' }}>
              <input
                type="radio"
                name="dn_three"
                value="three"
                checked={selectedOptiontax === 'three'}
                onChange={handleOptionChange4} />
              หักภาษี 3%
            </label>

            <label className="d-flex align-items-center" style={{ fontFamily: "Kanit", fontSize: 13, gap: 6, marginBottom: 0, whiteSpace: 'nowrap' }}>
              <input
                type="radio"
                name="dn_seven"
                value="seven"
                checked={selectedOptiontax === 'seven'}
                onChange={handleOptionChange4} />
              หักภาษี 7%
            </label>
          </div>

        </>
      )
    }

    // เงื่อนไขการชำระเงิน
    const [paymentTerm, setPaymentTerm] = useState<'cash' | 'credit' | 'deposit'>('cash');
    const [depositAmount, setDepositAmount] = useState<number>(0);

    // ซ่อนข้อมูลผู้ส่งสินค้า
    const [hideSenderInfo, setHideSenderInfo] = useState(false);

    useEffect(() => {
      maxVD()
    }, [qt]);

    const netTotal = Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
      - Number(alldatalist.discount)
      - Number(alldatalist.promotion)
      - Number(memberDiscountTotal || 0)
      - Number(parseInt(String(alldatalist.usereward)))

    const taxAmount = String(taxNum) === "" ? 0 : Number(((netTotal * Number(taxNum)) / 100).toFixed(1))
    const netTotalWithTax = Number((netTotal + taxAmount).toFixed(1))

    const balanceDue = paymentTerm === 'deposit' ? (netTotalWithTax - Number(depositAmount || 0)) : netTotalWithTax

    // Post Delivery Note
    const CreateDeliveryNote = async () => {

      let companyS = (localStorage.getItem("company_") || "")

      const companyall = companyS
      const id_costomer = Number(alldatalist.id_costomer)
      const code_costomer = alldatalist.code_costomer
      const name_costomer = String(name_cus)
      const group_price = normalizePriceTier(alldatalist.group_price)
      const pay = getPayLabel(alldatalist.pay)
      const bill = Number(alldatalist.bill)
      const totalall = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)))
      const discount = Number(alldatalist.discount) + Number(alldatalist.promotion)
      const sumtotal = netTotal
      const addreward = Number(alldatalist.addreward)
      const usereward = Number(alldatalist.usereward)
      const taxnumber = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
        String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
          String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""
      const personall = String(localStorage.getItem("person_") || "")
      const statussall = alldatalist.statuss
      const dn_date = new Date(startDate)
      const dn_enddate = new Date(startDate1)
      const dn_credit = paymentTerm === 'credit' ? Number(daysDiff) : 0
      const dn_number = Number(maxRecND)
      const dn_orderNo = year + month + day
      const dn_orderfull = "DN" + year + month + day + Number(maxRecND)
      const dn_status = "รออนุมัติ"
      const dn_person = ""
      const dn_remark = ""
      const dn_paytype = paymentTerm
      const dn_deposit = paymentTerm === 'deposit' ? Number(depositAmount || 0) : 0
      const dn_balance = balanceDue
      const detailsale = list.map(posts => ({
        company: posts.company,
        id_product: Number(posts.id_product),
        code_product: posts.code_product,
        name_product: posts.name_product,
        cetagory: posts.cetagory,
        unit: posts.unit,
        cost: Number(posts.cost),
        qty: Number(posts.qty),
        price: Number(posts.price),
        discount: Number(posts.discount),
        total: Number(posts.total),
        person: String(localStorage.getItem("person_") || ""),
        statuss: posts.statuss,
      }
      )
      )

      try {
        //Save Delivery Note
        await axios.post(`/api/${apiquatation}`,
          {
            companyall, id_costomer, code_costomer, name_costomer, group_price, pay, bill,
            totalall, discount, sumtotal, addreward, usereward, personall, statussall, taxnumber,
            dn_date, dn_number, dn_orderNo, dn_status, dn_person, dn_remark, dn_enddate, dn_credit, dn_orderfull, dn_paytype, dn_deposit, dn_balance,

            detailsale
          })

        // ✅ ตัดสต๊อกสินค้าออกจริง (สินค้าออกตามใบส่งสินค้า)
        // รอการซ่อม lot อัตโนมัติที่ค้างอยู่ให้จบก่อน ด้วยเหตุผลเดียวกับตอนตัดสต๊อกบิลขาย
        await waitForLotRepairsToSettle();
        for (const item of list) {
          try {
            await axios.post('/api/cutstock', {
              itemcode: item.code_product,
              quantity: Math.round((item.subQty || 1) * item.qty * 1000) / 1000,
              company: companyall,
              person: personall,
              transaction_type: 'DELIVERY'
            });
          } catch (cutstockError: any) {
            console.error(`Cutstock failed for item ${item.code_product}:`, cutstockError);
          }
        }

      } catch (error) {
        if (!isAbortError(error)) console.error(error)
      }
    }

    const handleClick = async () => {

      setLoading(true);
      await new Promise((r) => setTimeout(r, 2000));

      await CreateDeliveryNote()
      await fetchQT()
      setShowW(false)

      seachNames()
      setTimeout(() => {
        deleteall(),
          localStorage.setItem("itemlist", String(list.length)),
          setchangePay("2")
        setatalist(initialValues4)
        setMessage("")
      }, 30);

      setLoading(false);

    };

    return (

      <>
        <>
          <Alert show={show} variant="warning" style={{ margin: 5 }}>
            <Alert.Heading style={{ fontSize: 13, fontFamily: "Kanit" }}>ไม่สามารถ สร้างใบส่งสินค้าได้ !</Alert.Heading>
            <hr />
            <p style={{ fontSize: 14, fontFamily: "Kanit" }}>
              กรุณาคลิก "กลับ (F10)" และ กรอก "ข้อมูลลูกค้า" ให้ครบถ้วนค่ะ
            </p>
            <hr />
            <div className="d-flex justify-content-end">
              <button style={{ fontSize: 14, fontFamily: "Kanit" }} onClick={() => setShow(false)} className="outline-success">
                ปิด
              </button>
            </div>
          </Alert>

          {!show && <button
            disabled={list.length < 1 ? true : false}
            onClick={() => { name_cus === "" ? setShow(true) : setShowW(true) }}
            type="button"
            className={styles.templateButton}>
            ใบส่งสินค้า
          </button>}
        </>

        <Modal_qa
          show={showW}
          onHide={() => setShowW(false)}
          size="lg"
          scrollable={true}
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_qa.Header closeButton>
            <Modal_qa.Title id="example-custom-modal-styling-title">
              <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>สร้างใบส่งสินค้า</div>
            </Modal_qa.Title>
          </Modal_qa.Header>
          <Modal_qa.Body style={{ backgroundColor: "grey" }}>

            <div className="col  " style={{ justifySelf: "center", backgroundColor: "white", marginLeft: 20, marginRight: 20 }} ref={contentRef} >

              <div className="row" style={{ height: 60 }}></div>
              <div className="row" style={{ marginLeft: 20 }}>

                <div className="col " >

                  {/**ผูส่ง */}
                  {!hideSenderInfo && <>
                    <div className="row mt-4" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ส่งสินค้า</div>
                    <div className="row  " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{storeS}</div>
                    <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{addressS}</div>
                    <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{taxS}</div>
                    <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {telS}</div>
                  </>}

                  {/**ผู้รับ */}
                  <div className="row mt-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้รับสินค้า</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{name_cus}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{address_cus}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{numbertax_cus}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {tel_cus}</div>

                </div>

                {/**ใบส่งสินค้า */}
                <div className="col ">
                  <div className="row "
                    style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 20, justifySelf: "center" }}>
                    ใบส่งสินค้า
                  </div>
                  <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                  <div className="d-flex flex-column" style={{ gap: 4 }}>
                    <div className="d-flex align-items-center">
                      <div style={{ width: 90, textAlign: "right", fontFamily: "kanit", fontSize: 12, marginRight: 8 }}>เลขที่ :</div>
                      <div style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 12 }}>DN{year}{month}{day}{maxRecND}</div>
                    </div>
                    <div className="d-flex align-items-center">
                      <div style={{ width: 90, textAlign: "right", fontFamily: "kanit", fontSize: 12, marginRight: 8 }}>วันที่ :</div>
                      <div className='border border-black rounded d-flex align-items-center' style={{ width: 120, height: 22, paddingLeft: 8 }}>
                        <DatePicker
                          value={new Date(startDate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                          onChange={(date: any) => setStartDate(date)}
                        />
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <div style={{ width: 90, textAlign: "right", fontFamily: "kanit", fontSize: 12, marginRight: 8 }}>วันครบกำหนด :</div>
                      <div className='border border-black rounded d-flex align-items-center' style={{ width: 120, height: 22, paddingLeft: 8 }}>
                        <DatePicker value={new Date(startDate1).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                          onChange={(date: any) => setStartDate1(date)} />
                      </div>
                    </div>
                    {!hideSenderInfo &&
                      <div className="d-flex align-items-center">
                        <div style={{ width: 90, textAlign: "right", fontFamily: "kanit", fontSize: 12, marginRight: 8 }}>ผู้ส่งสินค้า :</div>
                        <div style={{ textAlign: "left", fontFamily: "kanit", fontSize: 12 }}>ชื่อผู้ส่งสินค้า</div>
                      </div>
                    }
                  </div>

                  <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                </div>
              </div>

              <div className="row mt-3" style={{ marginLeft: 20, marginRight: 20 }}>
                <div className="d-flex bd-highlight" style={{ justifySelf: "right" }}>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "center", height: 15, width: 30, flexShrink: 0 }}>ลำดับ</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "center", height: 15, width: 95, flexShrink: 0, marginRight: 5 }}>บาร์โค้ด</div>
                  <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit_B", fontSize: 11, textAlign: "start", height: 15, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>รายการ</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 45 }}>จำนวน</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>หน่วย</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 70 }}>ราคาต่อหน่วย</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>ลด/ชิ้น</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>รวม</div>
                </div>
                <div className="mt-1 " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                <table className="table"   >
                  <tbody className="">
                    <tr className="">
                      <td className="">
                        {list.map((a: any, index: number) =>
                          <div key={a.id} id="selcet-print">
                            <div className="d-flex bd-highlight" style={{ justifyItems: "end" }} >
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", height: 23, width: 30, flexShrink: 0 }}>{index + 1}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "center", height: 23, width: 95, flexShrink: 0, marginRight: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>{a.barcode || a.code_product}</div>
                              <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", height: 23, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>{a.name_product}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", height: 23, width: 30 }}>{a.qty}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50 }}>{a.unit}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 70 }}>{a.price}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50 }}>{a.discount}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50, marginRight: 5 }}>{a.total}</div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className=" " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                <div className="row " style={{ fontFamily: "kanit", fontSize: 11, justifySelf: "left", marginLeft: 3 }}>ทั้งหมด : {list.length} รายการ  </div>

                {/**ท้ายบิล Slip */}
                <div className="container">
                  <div className="row ">
                    <div className="col ">
                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>รวมเงิน :</div>
                        <div className=" bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20, }}>{list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)}</div>
                        <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ส่วนลดท้ายบิล :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{Number(alldatalist.discount) + Number(alldatalist.promotion)}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      {Number(memberDiscountTotal || 0) > 0 && (
                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ส่วนลดสมาชิก :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{formatMemberDiscountAmount(memberDiscountTotal)}</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>
                      )}

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ใช้แต้มส่วนลด :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{parseInt(String(alldatalist.usereward))}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                        <div className="bd-highlight" style={{ fontFamily: "kanit_B", fontSize: 11, textAlign: "right", width: 200, height: 30 }}>ยอดมูลค่าสินค้า :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit_B", fontSize: 11, textAlign: "center", width: 70, height: 30 }}>{netTotal}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 30 }}>บาท</div>
                      </div>

                      {String(taxNum) !== "" &&
                        <div>
                          <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                          <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>หักภาษี ณ ที่จ่าย {String(taxNum)} % :</div>
                            <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{taxAmount}</div>
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                          </div>
                          <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                            <div className="bd-highlight" style={{ fontFamily: "kanit_B", fontSize: 11, textAlign: "right", width: 200, height: 30 }}>ยอดชำระทั้งหมด :</div>
                            <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit_B", fontSize: 11, textAlign: "center", width: 70, height: 30 }}>{netTotalWithTax}</div>
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 30 }}>บาท</div>
                          </div>
                        </div>
                      }
                      <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                    </div>
                    <div className="h-5"></div>
                  </div>
                </div>

                {/**เงื่อนไขการชำระเงิน */}
                <div className="row mt-2" style={{ marginLeft: 3 }}>
                  <div style={{ fontFamily: "Kanit_B", fontSize: 13 }}>เงื่อนไขการชำระเงิน</div>
                  <div className="d-flex" style={{ gap: 15, marginTop: 5, flexWrap: 'wrap' }}>
                    <label style={{ fontFamily: "Kanit", fontSize: 12 }}>
                      <input type="radio" name="dn_paytype" value="cash" checked={paymentTerm === 'cash'} onChange={() => setPaymentTerm('cash')} style={{ marginRight: 5 }} />
                      เงินสด
                    </label>
                    <label style={{ fontFamily: "Kanit", fontSize: 12 }}>
                      <input type="radio" name="dn_paytype" value="credit" checked={paymentTerm === 'credit'} onChange={() => setPaymentTerm('credit')} style={{ marginRight: 5 }} />
                      เงินเชื่อ (เครดิต)
                    </label>
                    <label style={{ fontFamily: "Kanit", fontSize: 12 }}>
                      <input type="radio" name="dn_paytype" value="deposit" checked={paymentTerm === 'deposit'} onChange={() => setPaymentTerm('deposit')} style={{ marginRight: 5 }} />
                      เงินมัดจำ
                    </label>
                  </div>

                  {paymentTerm === 'credit' && (
                    <div className="mt-2" style={{ fontFamily: "Kanit", fontSize: 12 }}>
                      เครดิต {daysDiff} วัน — ครบกำหนดชำระวันที่ {new Date(startDate1).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      &nbsp;&nbsp; ยอดที่ต้องชำระทั้งหมด : <span style={{ fontFamily: "Kanit_B" }}>{balanceDue}</span> บาท
                    </div>
                  )}

                  {paymentTerm === 'deposit' && (
                    <div className="mt-2 d-flex align-items-center" style={{ fontFamily: "Kanit", fontSize: 12, gap: 8, flexWrap: 'wrap' }}>
                      <span>ยอดเงินมัดจำ :</span>
                      <input
                        type="number"
                        min={0}
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(Number(e.target.value))}
                        style={{ width: 100, fontFamily: "Kanit", fontSize: 12, border: '1px solid #000', borderRadius: 4, padding: '2px 6px' }}
                      />
                      <span>บาท</span>
                      <span>&nbsp;&nbsp; ครบกำหนดชำระยอดคงเหลือวันที่ {new Date(startDate1).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                      <span style={{ fontFamily: "Kanit_B" }}>&nbsp;&nbsp; ยอดคงเหลือที่ต้องชำระ : {balanceDue} บาท</span>
                    </div>
                  )}
                </div>

                <div className="row mt-3">
                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ในนาม {storeS}</div></div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>.......................................................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>ผู้ส่งสินค้า</div>
                      </div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>........../............/.....................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>วันที่</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-1" style={{ justifyItems: "center" }}>
                  </div>
                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row" >
                      <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ในนาม {name_cus}</div></div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>......................................................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>ผู้รับสินค้า</div>
                      </div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>........./.........../....................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>วันที่</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </Modal_qa.Body>
          <Modal_qa.Footer style={{ display: 'block' }}>
            <div className="d-flex align-items-center justify-content-between" style={{ flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
              <div className="d-flex align-items-center" style={{ gap: 14, flexWrap: 'wrap' }}>
                <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#b45309" }}>* การบันทึกจะตัดสต๊อกสินค้าออกตามรายการนี้ทันที</div>
                <label className="d-flex align-items-center" style={{ fontFamily: "Kanit", fontSize: 12, gap: 6, marginBottom: 0, whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox"
                    checked={hideSenderInfo}
                    onChange={(e) => setHideSenderInfo(e.target.checked)} />
                  ซ่อนข้อมูลผู้ส่งสินค้า
                </label>
              </div>
              <Radio_tax />
            </div>
            <div className="d-flex justify-content-end" style={{ gap: 8 }}>
              <button
                className="btn btn-primary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={reactToPrintFn3}>
                Print
              </button>

              <button
                className="btn btn-success"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={handleClick}>
                {loading ? (
                  <>
                    <SpinnerIcon size={9} color="text-white" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <span>บันทึก</span>
                )}

              </button>
              <button
                className="btn btn-secondary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={() => setShowW(false)}>
                ปิด
              </button>
            </div>
          </Modal_qa.Footer>
        </Modal_qa>

      </>

    )
  }

  // input ใบเสร็จรับเงิน
  function ReTemplate() {

    //*********Loading*********************** */
    const [loading, setLoading] = useState(false);


    // Post Quatation
    const CreateBill = async () => {

      let companyS = (localStorage.getItem("company_") || "")

      const companyall = companyS
      const id_costomer = Number(alldatalist.id_costomer)
      const code_costomer = alldatalist.code_costomer
      const name_costomer = String(name_cus)
      const group_price = normalizePriceTier(alldatalist.group_price)
      const pay = getPayLabel(alldatalist.pay)
      const bill = Number(alldatalist.bill)
      const totalall = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)))
      const discount = Number(alldatalist.discount) + Number(alldatalist.promotion)
      const sumtotal = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) - Number(alldatalist.discount) - Number(parseInt(alldatalist.usereward)))
      const addreward = Number(alldatalist.addreward)
      const usereward = Number(alldatalist.usereward)
      const taxnumber = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
        String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
          String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""
      const personall = String(localStorage.getItem("person_") || "")
      const statussall = alldatalist.statuss
      const re_date = new Date(startDate)
      const re_enddate = new Date(startDate1)
      const re_credit = Number(daysDiff)
      const re_number = Number(maxRecNR)
      const re_orderNo = year + month + day
      const re_orderfull = "RE" + year + month + day + Number(maxRecNR)
      const re_status = "รออนุมัติ"
      const re_person = String(localStorage.getItem("person_") || "")
      const re_remark = ""
      const detailsale = list.map(posts => ({
        company: posts.company,
        id_product: Number(posts.id_product),
        code_product: posts.code_product,
        name_product: posts.name_product,
        cetagory: posts.cetagory,
        unit: posts.unit,
        cost: Number(posts.cost),
        qty: Number(posts.qty),
        price: Number(posts.price),
        discount: Number(posts.discount),
        total: Number(posts.total),
        person: String(localStorage.getItem("person_") || ""),
        statuss: posts.statuss,
      }
      )
      )

      try {
        //   localStorage.setItem("show","1")
        //Save Sale
        await axios.post(`/api/${apiquatation}`,
          {
            companyall, id_costomer, code_costomer, name_costomer, group_price, pay, bill,
            totalall, discount, sumtotal, addreward, usereward, personall, statussall, taxnumber,
            re_date, re_number, re_orderNo, re_status, re_person, re_remark, re_enddate, re_credit, re_orderfull,

            detailsale
          })

      } catch (error) {
        if (!isAbortError(error)) console.error(error)
      }
    }



    const handleClick = async () => {

      setLoading(true);
      await new Promise((r) => setTimeout(r
        , 2000));

      //  SaleMainSubmit(),
      //    setMessage("")
      await CreateBill()
      await fetchQT()
      setShowW(false)


      seachNames()

      setTimeout(() => {
        deleteall(),
          localStorage.setItem("itemlist", String(list.length)),
          setchangePay("2")
        setatalist(initialValues4)
        setMessage("")
      }, 30);


      setLoading(false);

    };

    let taxNum = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
      String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
        String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""

    const [showW, setShowW] = useState(false);

    // Alert
    const [show, setShow] = useState(false);

    //Print Label
    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn2 = useReactToPrint({ contentRef });

    // input Radio Tax
    const [selectedOptiontax, setSelectedOptiontax] = useState('notax');

    const Radio_tax = () => {

      useEffect(() => {

        setSelectedOptiontax(localStorage.getItem("numbertax_S") || "")
        // fetchQT()
        maxVR()

      }, [Number(selectedOptiontax)]);

      const handleOptionChange4 = (e: any) => {

        const { name, value } = e.target;
        setSelectedOptiontax(e.target.value);
        localStorage.setItem("numbertax_S", e.target.value)
      };
      return (

        <>
          <div className="col">

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="notax" // Same name for all radio buttons in the group
                value="notax"
                checked={selectedOptiontax === 'notax'} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }} />
              ไม่หักภาษี
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="three" // Same name for all radio buttons in the group
                value="three"
                checked={selectedOptiontax === 'three'} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }} />
              หักภาษี 3 %
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="seven"
                value="seven"
                checked={selectedOptiontax === 'seven'}
                onChange={handleOptionChange4}
                style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }} />
              หักภาษี 7 %
            </label>
          </div>

        </>
      )
    }

    //***Order Date Diff */
    const [startDate, setStartDate] = useState(new Date());
    const [startDate1, setStartDate1] = useState(new Date());

    let date1 = new Date(startDate);
    let date2 = new Date(startDate1);

    // Convert dates to UTC timestamps
    let utc1 =
      Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    let utc2 =
      Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

    // Calculate the time difference in milliseconds
    let timeDiff = Math.abs(utc2 - utc1);

    // Convert milliseconds to days
    let daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));



    return (


      <>
        <>
          <Alert show={show} variant="warning" style={{ margin: 5 }}>
            <Alert.Heading style={{ fontSize: 13, fontFamily: "Kanit" }}>ไม่สามารถ สร้างใบแจข้งหนี้ได้ !</Alert.Heading>
            <hr />
            <p style={{ fontSize: 14, fontFamily: "Kanit" }}>
              กรุณาคลิก "กลับ (F10)" และ กรอก "ข้อมูลลูกค้า" ให้ครบถ้วนค่ะ
            </p>
            <hr />
            <div className="d-flex justify-content-end">

              <button style={{ fontSize: 14, fontFamily: "Kanit" }} onClick={() => setShow(false)} className="outline-success">
                ปิด
              </button>
            </div>
          </Alert>

          {!show && <button
            disabled={list.length < 1 ? true : false}
            onClick={() => { name_cus === "" ? setShow(true) : setShowW(true), maxVR() }}
            type="button"
            className={styles.templateButton}>
            ใบเสร็จรับเงิน
          </button>}
        </>

        <Modal_qa
          show={showW}
          onHide={() => setShowW(false)}
          size="lg"
          scrollable={true}
          //  fullscreen={true}
          //  dialogClassName="80w"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_qa.Header closeButton>
            <Modal_qa.Title id="example-custom-modal-styling-title">
              <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>สร้างใบเสร็จรับเงิน</div>
            </Modal_qa.Title>
          </Modal_qa.Header>
          <Modal_qa.Body style={{ backgroundColor: "grey" }}>

            <div className="col  " style={{ justifySelf: "center", backgroundColor: "white", marginLeft: 20, marginRight: 20 }} ref={contentRef} >


              <div className="row" style={{ height: 60 }}></div>
              <div className="row" style={{ marginLeft: 20 }}>

                <div className="col " >

                  {/**ผูขาย */}
                  <div className="row mt-4" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ขาย</div>
                  <div className="row  " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{storeS}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{addressS}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{taxS}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {telS}</div>



                  {/**ผู้ซื้อ */}
                  <div className="row mt-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ชื้อ</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{name_cus}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{address_cus}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{numbertax_cus}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {tel_cus}</div>

                </div>

                {/**ใบเสนราคา */}
                <div className="col ">
                  <div className="row "
                    style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 20, justifySelf: "center" }}>
                    ใบเสร็จรับเงิน
                  </div>
                  <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                  {/**** */}
                  <div className="row">
                    <div className="col-4 ">
                      <div style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เลขที่ :</div>
                      <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เครดิต :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันครบกำหนด :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>ผู้ขาย :</div>
                    </div>
                    <div className="col ">
                      <div className="col " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>RE{year}{month}{day}{maxRecNI}</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>

                        {/**Open */}
                        <div className='border border-black shadow shadow-sm rounded ' style={{ width: 130, height: 25 }}>
                          <div style={{ width: 100, marginLeft: 10, marginTop: 2 }}>
                            <DatePicker
                              value={new Date(startDate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                              //  selected={startDate} 
                              onChange={(date: any) => setStartDate(date)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{daysDiff} วัน</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>
                        <div className='border border-black shadow shadow-sm rounded ' style={{ width: 130, height: 25 }}>
                          <div style={{ width: 100, marginLeft: 10, marginTop: 2 }}>
                            <DatePicker value={new Date(startDate1).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                              //selected={startDate1} 
                              onChange={(date: any) => setStartDate1(date)} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>ชื่อผู้ขาย</div>
                    </div>
                  </div>

                  <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                </div>
              </div>

              <div className="row mt-3" style={{ marginLeft: 20, marginRight: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 70px", columnGap: 8, width: "100%" }}>
                  <div style={{ fontFamily: "kanit_B", fontSize: 11, textAlign: "start" }}>รายการ</div>
                  <div style={{ fontFamily: "kanit_B", fontSize: 11, textAlign: "right" }}>รวม</div>
                </div>
                <div className="mt-1 " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                <div style={{ width: "100%" }}>
                  {list.map((a: any) => {
                    const unitLabel = String(a.unit || '').trim()
                    const qtyLabel = `${a.qty}${unitLabel ? ` ${unitLabel}` : ''}`
                    const discountValue = Number(a.discount || 0)

                    return (
                      <div key={a.id} id="selcet-print" style={{ padding: "5px 0", borderBottom: "1px dashed #000" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 70px", columnGap: 8, alignItems: "start" }}>
                          <div style={{ fontFamily: "kanit_B", fontSize: 11, textAlign: "start", lineHeight: 1.25, wordBreak: "break-word" }}>{a.name_product}</div>
                          <div style={{ fontFamily: "kanit_B", fontSize: 11, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{a.total}</div>
                        </div>
                        <div style={{ fontFamily: "kanit", fontSize: 10, textAlign: "center", lineHeight: 1.25 }}>{qtyLabel} x {a.price}</div>
                        {discountValue > 0 && <div style={{ fontFamily: "kanit", fontSize: 9, textAlign: "right" }}>ลด {a.discount}</div>}
                      </div>
                    )
                  })}
                </div>
                <div className=" " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                <div className="row " style={{ fontFamily: "kanit", fontSize: 11, justifySelf: "left", marginLeft: 3 }}>ทั้งหมด : {list.length} รายการ  </div>

                {/**ท้ายบิล Slip */}
                <div className="container">
                  <div className="row ">
                    <div className="col ">
                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>รวมเงิน :</div>
                        <div className=" bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20, }}>{list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)}</div>
                        <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ส่วนลดท้ายบิล :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{Number(alldatalist.discount) + Number(alldatalist.promotion)}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ใช้แต้มส่วนลด :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{parseInt(String(alldatalist.usereward))}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      {String(taxNum) === "" ? "" :
                        <div>
                          <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>จำนวนเงินรวมทั้งสิ้น :</div>
                            <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(parseInt(alldatalist.usereward))
                            }</div>
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                          </div>
                          <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                          <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>หักภาษี ณ ที่จ่าย {String(taxNum)} % :</div>
                            <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{(((Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(parseInt(alldatalist.usereward))) * Number(taxNum)) / 100).toFixed(1)
                            }</div>
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                          </div>
                        </div>
                      }

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 30 }}>ยอดชำระทั้งหมด :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 30 }}>{
                          (Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                            - Number(alldatalist.discount)
                            - Number(alldatalist.promotion)
                            - Number(parseInt(alldatalist.usereward)) +
                            ((Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(parseInt(alldatalist.usereward))) * Number(taxNum)) / 100).toFixed(1)
                        }</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 30 }}>บาท</div>
                      </div>

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ยอดรับ :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{Number(alldatalist.receivebaht || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>เงินทอน :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{(Number(alldatalist.receivebaht || 0) - Number((saleNetTotal + (saleNetTotal * Number(taxNum)) / 100).toFixed(1))).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>
                      <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                    </div>
                    <div className="h-5"></div>
                  </div>
                </div>


                <div className="row mt-3">
                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ในนาม {name_cus}</div></div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>.......................................................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>ผู้สั่งซื้อสินค้า</div>
                      </div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>........../............/.....................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>วันที่</div>

                      </div>
                    </div>

                  </div>
                  <div className="col-sm-1" style={{ justifyItems: "center" }}>

                  </div>

                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row" >
                      <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ในนาม {storeS}</div></div>

                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>......................................................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>ผู้อนุมัติ</div>
                      </div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>........./.........../....................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>วันที่</div>

                      </div>
                    </div>
                  </div>
                </div>

              </div>



            </div>




          </Modal_qa.Body>
          <Modal_qa.Footer>
            <Radio_tax />
            <button
              className="btn btn-primary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={reactToPrintFn2}>
              Print
            </button>

            <button
              className="btn btn-success"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={handleClick}>
              {loading ? (
                <>
                  <SpinnerIcon size={9} color="text-white" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึก</span>
              )}

            </button>
            <button
              className="btn btn-secondary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={() => setShowW(false)}>
              ปิด
            </button>

          </Modal_qa.Footer>
        </Modal_qa>

      </>

    )
  }


  const buildSaleLogbookItems = () => list.slice(0, 5).map((saleItem) => ({
    code: String(saleItem.code_product || ""),
    name: String(saleItem.name_product || ""),
    qty: Number(saleItem.qty || 0),
    unit: String(saleItem.unit || ""),
  })).filter((saleItem) => saleItem.code || saleItem.name);

  const formatSaleLogbookSummary = (saleItems: ReturnType<typeof buildSaleLogbookItems>) => {
    const summary = saleItems.map((saleItem) => {
      const productText = [saleItem.code, saleItem.name].filter(Boolean).join(" - ");
      const qtyText = saleItem.qty ? ` x${saleItem.qty}${saleItem.unit ? ` ${saleItem.unit}` : ""}` : "";
      return `${productText}${qtyText}`.trim();
    }).filter(Boolean).join(", ");
    const remainingCount = Math.max(list.length - saleItems.length, 0);
    return remainingCount > 0 ? `${summary} +${remainingCount} รายการ` : summary;
  };


  // Before Sale
  function Beforepay() {


    //*********Loading*********************** */
    const [loading1, setLoading1] = useState(true);
    const [loading, setLoading] = useState(false);

    // Modal state สำหรับเพิ่มชื่อลูกค้า สั่งซื้อยา ข.ย.10-13
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customerNameInput, setCustomerNameInput] = useState("");
    const [customerIdCardInput, setCustomerIdCardInput] = useState("");
    const [customerPhoneInput, setCustomerPhoneInput] = useState("");
    const [itemsNeedCustomer, setItemsNeedCustomer] = useState<Task[]>([]);

    const proceedPayment = async () => {
      // B3 (การมองเห็น/หน้าขาย): เปิด = ขายราคา 0 ได้ | ปิด/ไม่มีข้อมูล = ขายไม่ได้ | ค่าเริ่มต้น = false
      {
        // กันเหนียวอีกชั้นตอนกดชำระเงิน (เผื่อสินค้าราคา 0 เข้าตะกร้ามาทางอื่น)
        if (!isZeroPriceSaleAllowed()) {
          // บล็อกเมื่อมีสินค้า (ที่มีจำนวน > 0) แต่ยอดต่อรายการ = 0 บาท
          const zeroItem = list.find((it: any) => Number(it.qty) > 0 && Number(it.total || 0) <= 0);
          if (zeroItem) {
            toast.error(
              <div style={{ fontFamily: "Kanit", fontSize: 16 }}>
                ไม่สามารถชำระสินค้าได้ เนื่องจากมีสินค้าราคา 0 บาท ({String(zeroItem.name_product || "")})
              </div>,
              { duration: 3000 }
            );
            return;
          }
        }
      }
      if (loading) return;
      setLoading(true);

      // ตรวจสอบความพร้อม API ก่อน post
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch('/api/sale', { method: 'OPTIONS', signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok && res.status >= 500) {
          throw new Error('API Server Error');
        }
      } catch (err) {
        setLoading(false);
        alert('Api ไม่พร้อม กรุณากด Refresh หน้าเว็บใหม่');
        return;
      }

      await new Promise((r) => setTimeout(r
        , 200));
      setatalist({
        ...alldatalist,
        discount: "0",
        usereward: "0",
        receivebaht: "",
        bill: String(list.filter(item => item.qty > 0).length),
        code_costomer: code_cus,
        names: name_cus,
        id_costomer: id_cus,
        group_price: normalizePriceTier(localStorage.getItem("countrow")),
        pay: "cash",
        totalPoint: String(totalPont),
        id_main: String(Date.now()),
        promotion: String(SumPro)
      }),
        setchangePay("1"),
        localStorage.setItem("showhead", "0"),
        localStorage.setItem("pay_s", "cash"),

        setSelectedOption("cash")
      setMessage("0")
      fetchQT()

        localStorage.setItem("usereward_s", "0")
        localStorage.setItem("discount_s", "0")
        localStorage.setItem("discount_Po", "0")

      // Focus on receive input after state transition
      setTimeout(() => {
        receiveInputRef.current?.focus();
      }, 100);

      setLoading(false);
    };

    const getDrugLabel = (code_product: string): string | null => {
      const drugTypes = ["ขย.10", "ขย.11", "ขย.12", "ขย.13", "ข.ย.10", "ข.ย.11", "ข.ย.12", "ข.ย.13", "ขย.10 และ ขย.11", "ขย.10 และ ขย.12", "ขย.11 และ ขย.12"];
      const prod = dataProduct.find((p: any) => p.code === code_product);
      if (!prod) return null;
      const matchType = drugTypes.includes(prod.type) ? prod.type : null;
      const matchSubtype = drugTypes.includes(prod.subtype) ? prod.subtype : null;
      return matchType || matchSubtype;
    };

    const handleClick = async () => {
      // ตรวจสอบสินค้าที่มี matchType || matchSubtype ตรงกับ ขย.10-13, ข.ย.10-13
      const itemsWithDrugType = list.filter((item) => getDrugLabel(item.code_product) !== null);

      if (itemsWithDrugType.length > 0) {
        // มีสินค้าประเภทยา ข.ย. → ตรวจสอบชื่อลูกค้า
        if (name_cus && name_cus.trim() !== "") {
          // มีชื่อลูกค้าแล้ว → เก็บ type และ name_customer ให้ตรงแถว แล้วดำเนินการต่อ
          setList(list.map((task) => {
            const label = getDrugLabel(task.code_product);
            return label ? { ...task, type: label, name_customer: name_cus } : task;
          }));
          await proceedPayment();
        } else {
          // ไม่มีชื่อลูกค้า → แสดง modal
          setItemsNeedCustomer(itemsWithDrugType);
          setCustomerNameInput("");
          setCustomerIdCardInput("");
          setCustomerPhoneInput("");
          setShowCustomerModal(true);
        }
      } else {
        // ไม่มีสินค้าประเภทยา → ดำเนินการปกติ
        await proceedPayment();
      }
    };

    const handleConfirmCustomerModal = async () => {
      if (customerNameInput.trim() === "") return;
      // เก็บ type และ name_customer ให้ตรงแถว
      setList(list.map((task) => {
        const label = getDrugLabel(task.code_product);
        return label ? { ...task, type: label, name_customer: customerNameInput.trim(), id_card: customerIdCardInput.trim(), phone: customerPhoneInput.trim() } : task;
      }));
      setShowCustomerModal(false);
      await proceedPayment();
    };

    const handleSave = () => list.length > 0 ? handleClick() : "";


    useEffect(() => {
      // ✅ บอก type ให้ TypeScript ชัดเจน
      const handleKeyDown = (event: globalThis.KeyboardEvent) => {
        const key = event.key.toLowerCase();

        // Check if focus is on an input or textarea
        const target = event.target as HTMLElement;
        const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

        switch (key) {
          case 'f4':
            event.preventDefault();
            if (changepay !== '1') handleHoldCurrentBill();
            break;
          case 'f12':
            event.preventDefault();
            handleSave();
            break;

        }
      };

      // ✅ ระบุ type ของ listener ให้ตรง
      window.addEventListener('keydown', handleKeyDown as EventListener);

      return () => {
        window.removeEventListener('keydown', handleKeyDown as EventListener);
      };
    }, [handleSave /*, handlePrint, handleClear*/]);
    //****************************************** */

    const [drugs, setdrugs] = useState([])

    useEffect(() => {

      setTimeout(() => {
        setdrugs(JSON.parse(localStorage.getItem("dg") || "[]"))
      }, 1000);


      //setdrugs(JSON.parse(localStorage.getItem("dg")||"")) 
    }, [id_cus])

    /*
            const GetDrug = async () => {
               let companyS= (localStorage.getItem("company_") || "")
                try {
                  const res = await axios.get(`/api/${getdrugg}?company=${companyS}&id_cus=${Number(id_cus)}`)
                  
                    
                  id_cus!==undefined?  setdrugs(res.data):""
                  localStorage.setItem("dg",JSON.stringify(res.data))
             
                } catch (error) {
                  if (!isAbortError(error)) console.error(error)
                }
               
              }  

*/

    const [l, setlevel] = useState(() => {
      try { return JSON.parse(localStorage.getItem("level_data") || "[]") } catch { return [] }
    })
    const { hasPermission } = usePermission()
    const billItemCount = list.filter(item => item.qty > 0).length
    const billTotal = list.reduce((acc, curr) => acc + Number(curr.total || 0), 0)
    // ยอดสุทธิที่ใช้โชว์บนปุ่มชำระเงินของโหมดร้านอาหาร (ตรงกับยอดท้ายใบสั่งซื้อ)
    const ticketNetTotal = list.reduce((acc, curr: any) => acc + calcItemNetTotal(curr), 0)

    /* ปุ่มดำเนินการของบิล — ใช้ชุดเดียวกันทั้งแถบแนวตั้งด้านขวา (โหมดปกติ)
       และแถบใต้ใบสั่งซื้อคอลัมน์ซ้าย (โหมดร้านอาหาร) ต่างกันแค่ CSS ของกล่องที่ครอบ */
    const checkoutActions = (
      <>
        <SetLabel />
        <button
          disabled={list.length < 1 || holdBillStore.findEmptySlot() === -1}
          onClick={handleHoldCurrentBill}
          type="button"
          title="พักบิล (F4)"
          className={`${styles.checkoutActionButton} ${styles.holdBillActionButton}`}>
          <span className={styles.checkoutActionIcon}>
            <PauseCircle size={20} strokeWidth={2.3} />
          </span>
          <span className={styles.checkoutActionText}>พักบิล</span>
          <span className={styles.checkoutShortcut}>F4</span>
        </button>
        <button
          disabled={list.length < 1 ? true : false}
          onClick={() => {
            deleteall(),
              holdBillStore.clearSlot(holdBillStore.activeIndex),
              localStorage.setItem("itemlist", String(list.length)),
              localStorage.setItem("dg", JSON.stringify([])),
              localStorage.setItem("his", JSON.stringify([{
                followup: String(""),
                solution: String(""),
                id_history: "",
                count: String(""),
                statusH: "",
                duedate: new Date(),
                person: String(localStorage.getItem("person_") || "")
              }]))
          }}
          type="button"
          title="ยกเลิกบิล"
          data-logbook-context={formatSaleLogbookSummary(buildSaleLogbookItems())}
          className={`${styles.checkoutActionButton} ${styles.cancelBillActionButton}`}>
          <span className={styles.checkoutActionIcon}>
            <Trash2 size={20} strokeWidth={2.3} />
          </span>
          <span className={styles.checkoutActionText}>ยกเลิก</span>
        </button>

        <div className={styles.checkoutRailSpacer} />

        <button
          disabled={loading || list.length < 1 || savehis === "3" || addhis === 1}
          onClick={handleSave}
          type="button"
          title="ชำระสินค้า (F12)"
          className={styles.payButton}>
          {loading ? (
            <span className={styles.payButtonText}>
              <SpinnerIcon size={18} color="text-white" />
              <span>กำลังบันทึก...</span>
            </span>
          ) : (
            <span className={styles.payButtonText}>
              <CreditCard size={26} strokeWidth={2.3} />
              <span>ชำระสินค้า</span>
              {restaurantLayout && list.length > 0 && (
                <span className={styles.posPayAmount}>{formatSaleAmount(ticketNetTotal)} ฿</span>
              )}
              <span className={styles.payButtonShortcut}>F12</span>
            </span>
          )}
        </button>
      </>
    )


    return (
      <>

        <div>
          {/*แถบสรุปยอดขายก่อนหักท้ายบิล — ซ่อนไว้ตามที่ผู้ใช้ร้องขอ (ยกเลิกคอมเมนต์เพื่อเปิดใช้งานอีกครั้ง)
          <div className={styles.saleSummaryBar} style={{ marginBottom: 5 }}>
            <div className={styles.saleSummaryBrand}>
              <span className={styles.saleSummaryIcon}>
                <ReceiptText size={15} strokeWidth={2.3} />
              </span>
              <span className={styles.saleSummaryTitle}>ข้อมูลขายก่อนหักท้ายบิล</span>
            </div>

            <div className={styles.saleSummaryMetrics}>
              <div className={styles.saleSummaryMetric}>
                <span className={styles.saleSummaryMetricLabel}>จำนวน</span>
                <span className={styles.saleSummaryMetricFigure}>
                  <span className={styles.saleSummaryMetricValue}>{billItemCount.toLocaleString("en-US")}</span>
                  <span className={styles.saleSummaryMetricUnit}>รายการ</span>
                </span>
              </div>
              <div className={`${styles.saleSummaryMetric} ${styles.saleSummaryMetricTotal}`}>
                <span className={styles.saleSummaryMetricLabel}>ยอดรวม</span>
                <span className={styles.saleSummaryMetricFigure}>
                  <span className={styles.saleSummaryMetricValue}>{billTotal.toLocaleString("en-US")}</span>
                  <span className={styles.saleSummaryMetricUnit}>บาท</span>
                </span>
              </div>
            </div>
          </div>
          */}

          {/* คอลัมน์ขวา: ข้อมูลสินค้า/ลูกค้า อยู่ซ้าย — แถบปุ่มดำเนินการเรียงแนวตั้งอยู่ขวา */}
          <div className={styles.saleSideLayout}>
            <div className={styles.saleSideMain}>

          {/*Detail code สินค้า — การ์ดทั้งใบถูกซ่อนด้วย SHOW_PRODUCT_SIDE_CARD (โค้ดเดิมยังอยู่ครบ)*/}

          {SHOW_PRODUCT_SIDE_CARD && (
            addhis === 1 ? "" :
            addhis === 0 ?

              <div className={`${styles.infoCard} ${styles.productInfoCardCompact} ${styles.salesSideProductCard}`} style={{ marginBottom: 5 }} >
                <div className={styles.infoCardHeader}>
                  <span className={styles.salesSideHeaderIcon}><Package size={12} strokeWidth={2.4} /></span>
                  <span>ข้อมูลสินค้า</span>
                </div>
                <div className={styles.infoCardBody}>
                  <div className={styles.salesSideProductHead}>
                    <div className={styles.salesSideProductThumb}>
                      {selectedSideProductImage === "" ?
                        <ImageIcon size={20} strokeWidth={1.6} /> :
                        <img alt="" src={selectedSideProductImage} onError={() => markProductImageBroken(selectedSideProductImage)} />}
                    </div>
                    <div className={styles.salesSideProductHeadInfo}>
                      <span className={styles.salesSideProductCode}>
                        {String(dataitem.filter((supplier: any) => supplier.code === codeproductS).map((supplier: any) => supplier.code))}
                      </span>
                      {(() => {
                        const drugTypes = ["ขย.10", "ขย.11", "ขย.12", "ขย.13", "ข.ย.10", "ข.ย.11", "ข.ย.12", "ข.ย.13", "ขย.10 และ ขย.11", "ขย.10 และ ขย.12", "ขย.11 และ ขย.12"];
                        const matched = dataitem.filter((supplier: any) => supplier.code === codeproductS);
                        const subtype = matched.length > 0 ? (matched[0] as any).subtype : null;
                        return subtype && drugTypes.includes(subtype) ? <span className={styles.salesSideProductSubtype}>{subtype}</span> : null;
                      })()}
                      <div className={styles.salesSideProductName}>
                        {String(dataitem.filter((supplier: any) => supplier.code === codeproductS).map((supplier: any) => supplier.ProductName))}
                      </div>
                    </div>
                  </div>

                  <div className={styles.salesSideProductDetail}>
                      {SHOW_PRODUCT_FIXNAME && (
                      <div className={styles.infoRow}>
                        <div className={styles.infoLabel}>ชื่อเฉพาะทาง :</div>
                        <div className={styles.infoValue} style={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}>{String(dataitem.filter((supplier: any) => supplier.code === codeproductS).map((supplier: any) => supplier.fixname))}</div>
                      </div>
                      )}

                      <div className={styles.infoRow}>
                        <div className={styles.infoLabel}>ที่เก็บ :</div>
                        <div className={styles.infoValue}>{String(dataitem.filter((supplier: any) => supplier.code === codeproductS).map((supplier: any) => supplier.Area || '-'))}</div>
                      </div>

                      <div className={styles.infoRow}>
                        <div className={styles.infoLabel}>ราคาขาย :</div>
                        <div className={styles.infoValue}>
                          <span style={{ color: '#d32f2f', fontFamily: 'Kanit_B', fontSize: 14 }}>{String(dataitem.filter((supplier: any) => supplier.code === codeproductS).map((supplier: any) => supplier.price ?? 0))}</span>
                          <span style={{ color: '#666', fontFamily: 'Kanit', fontSize: 11, marginLeft: 4 }}>บาท</span>
                        </div>
                        {hasPermission("B2") ?
                          <>
                            <div className={styles.infoLabel} style={{ marginLeft: 8 }}>ราคาทุน :</div>
                            <div className={styles.infoValue}>
                              <span style={{ color: '#ff9800', fontSize: 13 }}>{Number(costS).toFixed(0)}</span>
                              <span style={{ color: '#666', fontFamily: 'Kanit', fontSize: 11, marginLeft: 4 }}>บาท</span>
                            </div>
                          </>
                          : ""}
                      </div>

                      {/* Indicator Section */}
                      {SHOW_PRODUCT_INDICATION && (
                      <div className={styles.indicatorSection}>
                        <div className="d-flex align-items-start mb-1">
                          <div className={styles.indicatorTitle} style={{ minWidth: 70 }}>สรรพคุณ :</div>
                          <div className={styles.indicatorContent}>{alllabelitem.indicatorlistS}</div>
                        </div>
                        <div className="d-flex align-items-start mb-1">
                          <div className={styles.indicatorTitle} style={{ minWidth: 70 }}>ข้อบ่งใช้ :</div>
                          <div className={styles.indicatorContent}>{alllabelitem.useS} {alllabelitem.timeuseS}</div>
                        </div>
                        <div className="d-flex align-items-start mb-1">
                          <div className={styles.indicatorContent}>{alllabelitem.timeS} {alllabelitem.keepS}</div>
                        </div>
                        {alllabelitem.remarkS && (
                          <div className="d-flex align-items-start">
                            <div className={styles.indicatorTitle} style={{ minWidth: 70 }}>หมายเหตุ :</div>
                            <div className={styles.indicatorContent}>{alllabelitem.remarkS}</div>
                          </div>
                        )}
                      </div>
                      )}
                    </div>
                </div>
              </div>
              : ""
          )}

          {/* ================= ลูกค้า =================
              การ์ด "ข้อมูลลูกค้า" ถูกซ่อนด้วย SHOW_CUSTOMER_SIDE_CARD — ย้ายไปแสดงเป็น
              ปุ่ม "ค้นหาลูกค้า" + ป้ายข้อมูลลูกค้า บนแถบเครื่องมือด้านบนแทน (body_pro_cus.tsx)
              สองส่วนนี้ต้องอยู่นอกการ์ด เพราะยังต้องทำงานแม้การ์ดจะไม่ถูกแสดง:
                1) <Search_Cus />  โมดัลค้นหาลูกค้า / สมัครสมาชิก + คีย์ลัด F2
                                   (ปุ่มในตัวมันถูกซ่อนด้วย .customerHeadlessMount ส่วนโมดัลใช้ portal จึงยังเห็น)
                2) กล่องเตือนข้อมูลสำคัญของลูกค้า (overlay เต็มจอ) */}
          {!SHOW_CUSTOMER_SIDE_CARD && (
            <div className={styles.customerHeadlessMount} aria-hidden="true">
              <Search_Cus />
            </div>
          )}

          {/* แจ้งเตือนข้อมูลสำคัญของลูกค้า: โรคประจำตัว / แพ้ยา / ข้อมูลเพิ่มเติม
              เรนเดอร์ที่ระดับ parent เพื่อให้รอด remount ของ <Search_Cus /> */}
          {cusAlert && (
                <div
                  onClick={() => setCusAlert(null)}
                  style={{
                    position: "fixed", inset: 0, zIndex: 20000,
                    background: "rgba(15,23,42,0.45)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: "min(480px, 92vw)", maxHeight: "85vh", overflowY: "auto",
                      background: "white", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                      fontFamily: "Kanit",
                    }}>
                    <div style={{
                      background: "#fef2f2", borderBottom: "1px solid #fecaca", borderRadius: "14px 14px 0 0",
                      padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <div style={{ fontFamily: "Kanit_B", fontSize: 16, color: "#b91c1c", display: "flex", alignItems: "center", gap: 8 }}>
                        <AlertTriangle size={20} /> ข้อมูลสำคัญของลูกค้า
                      </div>
                      <button onClick={() => setCusAlert(null)} style={{ border: "none", background: "transparent", fontSize: 22, lineHeight: 1, color: "#64748b", cursor: "pointer" }}>×</button>
                    </div>

                    <div style={{ padding: "16px 18px" }}>
                      <div style={{ fontSize: 14, color: "#475569", marginBottom: 12 }}>
                        ลูกค้า: <span style={{ fontFamily: "Kanit_B", color: "#1e293b" }}>{cusAlert.names || "-"}</span>
                      </div>
                      {cusAlert.congenital && (
                        <div style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 8, background: "#fff7ed", border: "1px solid #fed7aa" }}>
                          <div style={{ fontFamily: "Kanit_B", fontSize: 13, color: "#c2410c", marginBottom: 2 }}>โรคประจำตัว</div>
                          <div style={{ fontSize: 13, color: "#7c2d12", whiteSpace: "pre-line" }}>{cusAlert.congenital}</div>
                        </div>
                      )}
                      {cusAlert.allergies.length > 0 && (
                        <div style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca" }}>
                          <div style={{ fontFamily: "Kanit_B", fontSize: 13, color: "#b91c1c", marginBottom: 4 }}>ข้อมูลแพ้สินค้า</div>
                          {cusAlert.allergies.map((d: any, i: number) => (
                            <div key={i} style={{ fontSize: 13, color: "#7f1d1d" }}>
                              • {d.drugallergy || "-"}{d.remark ? ` : ${d.remark}` : ""}
                            </div>
                          ))}
                        </div>
                      )}
                      {cusAlert.moreInfo && (
                        <div style={{ marginBottom: 4, padding: "10px 12px", borderRadius: 8, background: "#F3F8FC", border: "1px solid #CCDFF1" }}>
                          <div style={{ fontFamily: "Kanit_B", fontSize: 13, color: "#1E5088", marginBottom: 2 }}>ข้อมูลเพิ่มเติม</div>
                          <div style={{ fontSize: 13, color: "#12314F", whiteSpace: "pre-line" }}>{cusAlert.moreInfo}</div>
                        </div>
                      )}
                    </div>

                    <div style={{ padding: "12px 18px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end" }}>
                      <button
                        ref={cusAlertBtnRef}
                        onClick={() => setCusAlert(null)}
                        style={{
                          fontFamily: "Kanit", fontSize: 14, padding: "8px 22px", borderRadius: 8, border: "none",
                          background: "#dc2626", color: "white", cursor: "pointer",
                        }}>
                        รับทราบ
                      </button>
                    </div>
                  </div>
                </div>
              )}

          {SHOW_CUSTOMER_SIDE_CARD && (
          <div className={`${styles.customerCard} ${styles.salesSideCustomerCard}`} style={{ marginBottom: 5 }}>
            <div className={styles.customerCardHeader}>
              <span className={styles.salesSideHeaderIcon}><UserRound size={12} strokeWidth={2.4} /></span>
              <span>ข้อมูลลูกค้า</span>
            </div>
            <div className={styles.infoCardBody}>
              {/* Search Row */}
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>ค้นหา :</div>
                <div style={{ flex: 1 }}>
                  <Search_Cus />
                </div>
              </div>

              {/* Customer Info */}
              <div className={styles.salesSideCustomerIdentity}>
                <span className={styles.salesSideCustomerCode}>{code_cus || "-"}</span>
                <span className={styles.salesSideCustomerName} title={String(name_cus || "")}>{name_cus || "ลูกค้าทั่วไป"}</span>
              </div>

              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>ระดับราคา :</div>
                <div style={{ fontFamily: 'Kanit_B', fontSize: 12, color: hasConfiguredCustomerLevelPrice ? '#2A6AAA' : '#94a3b8', backgroundColor: hasConfiguredCustomerLevelPrice ? '#F3F8FC' : '#f8fafc', padding: '0 9px', borderRadius: '999px', border: `1px solid ${hasConfiguredCustomerLevelPrice ? '#CCDFF1' : '#e2e8f0'}`, lineHeight: 1.5 }}>
                  {levelPrice_cus}
                </div>
                <div className={styles.infoLabel} style={{ marginLeft: 'auto' }}>แต้มสะสม :</div>
                <div className={styles.pointsBadge}>{customerTotalPoints} แต้ม</div>
              </div>

              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>เบอร์โทร :</div>
                <div className={styles.infoValue}>{tel_cus}</div>
              </div>

              {SHOW_CUSTOMER_CONGENITAL && (
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>โรคประจำตัว :</div>
                <div className={styles.infoValue}>{congen_cus}</div>
              </div>
              )}

              {!isBlankInfo(moreInfo_cus) && (
                <div className={styles.infoRow} style={{ alignItems: "flex-start" }}>
                  <div className={styles.infoLabel}>ข้อมูลเพิ่มเติม :</div>
                  <div className={styles.infoValue} style={{ whiteSpace: "pre-line", color: "#1E5088" }}>{moreInfo_cus}</div>
                </div>
              )}

              {/* Drug Allergy Table */}
              {Number(id_cus) === 0 || !drugs?.length ? "" :
                <div className={styles.allergyTable}>
                  <table className="table table-sm mb-0">
                    <thead>
                      <tr>
                        <th className={styles.allergyTableHeader} style={{ width: "45%" }}><span className={styles.salesSideTableHeaderIcon}><Pill size={12} strokeWidth={2.3} /></span>แพ้สินค้า</th>
                        <th className={styles.allergyTableHeader} style={{ width: "45%" }}>อาการ</th>
                        <th className={styles.allergyTableHeader} style={{ width: "10%" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {drugs?.map((s: any) => (
                        <tr key={s.id} className={`${styles.allergyRow} ${list.filter((w: any) => w.fixname === s.drugallergy).map((r: any) => r.fixname).length > 0 ? styles.allergyWarning : ''}`}>
                          <td style={{ fontFamily: 'Kanit', fontSize: 11.5, padding: '2px 8px' }}>
                            {s.drugallergy}
                          </td>
                          <td style={{ fontFamily: 'Kanit', fontSize: 11.5, padding: '2px 8px' }}>
                            {s.remark}
                          </td>
                          <td style={{ fontFamily: 'Kanit_B', fontSize: 11.5, padding: '2px 8px', textAlign: 'center' }}>
                            {list.filter((w: any) => w.fixname === s.drugallergy).map((r: any) => r.fixname).length > 0 ? "⚠️" : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              }

            </div>
          </div>
          )}

          {/*เพิ่มประวัติลูกค้า — ฟอร์ม "ติดตามอาการ" (โผล่เมื่อ addhis === 1)
             อยู่นอกการ์ดข้อมูลลูกค้า เพื่อให้ยังใช้งานได้แม้การ์ดจะถูกซ่อน*/}
          <div style={{ marginTop: 5 }}>
            <SpeechToText language="th-TH" />
          </div>

            </div>

            {/*ปุ่ม sale — โหมดปกติ: แถบแนวตั้งด้านขวา | โหมดร้านอาหาร: portal ไปไว้ใต้ใบสั่งซื้อคอลัมน์ซ้าย*/}
            {restaurantLayout
              ? (posActionDockEl ? createPortal(checkoutActions, posActionDockEl) : null)
              : <div className={styles.checkoutRail}>{checkoutActions}</div>}
          </div>

          {/* Modal เพิ่มชื่อลูกค้า สั่งซื้อยา ข.ย.10-13 */}
          <Modal_fill
            show={showCustomerModal}
            onHide={() => setShowCustomerModal(false)}
            dialogClassName="modal-90w"
            aria-labelledby="customer-drug-modal"
            centered
          >
            <Modal_fill.Header closeButton>
              <Modal_fill.Title id="customer-drug-modal">
                <div style={{ fontSize: 16, fontFamily: "Kanit_B", color: '#1f2937' }}>
                  เพิ่มชื่อลูกค้า สั่งซื้อยา ข.ย.10-13
                </div>
              </Modal_fill.Title>
            </Modal_fill.Header>
            <Modal_fill.Body>
              <div style={{ marginBottom: 16 }}>
                <Table size="sm" bordered hover>
                  <thead style={{ backgroundColor: '#F3F8FC' }}>
                    <tr>
                      <th style={{ fontFamily: 'Kanit', fontSize: 13, padding: '8px', width: '25%' }}>รหัสสินค้า</th>
                      <th style={{ fontFamily: 'Kanit', fontSize: 13, padding: '8px', width: '45%' }}>ชื่อสินค้า</th>
                      <th style={{ fontFamily: 'Kanit', fontSize: 13, padding: '8px', width: '30%' }}>ประเภท</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsNeedCustomer.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'Kanit', fontSize: 12, padding: '6px 8px' }}>{item.code_product}</td>
                        <td style={{ fontFamily: 'Kanit', fontSize: 12, padding: '6px 8px' }}>{item.name_product}</td>
                        <td style={{ fontFamily: 'Kanit', fontSize: 12, padding: '6px 8px', color: '#2A6AAA', fontWeight: 600 }}>{item.cetagory}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontFamily: 'Kanit', fontSize: 14, fontWeight: 600, color: '#1f2937', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  ชื่อลูกค้า
                  <span
                    title="สุ่มชื่อลูกค้า"
                    onClick={() => {
                      const firstNames = ["สมชาย", "สมหญิง", "วิชัย", "สุนีย์", "ประเสริฐ", "จันทร์", "อรุณ", "พิมพ์", "กิตติ", "นภา", "ธนา", "วรรณ", "สุวิทย์", "ปราณี", "มานะ", "รัตนา", "ชัยวัฒน์", "ศิริ", "อนุชา", "พรทิพย์", "ไพรัช", "ดวงใจ", "สมศักดิ์", "วิไล", "บุญมี", "สุภาพ", "ณัฐ", "กาญจนา", "เอกชัย", "ลัดดา"];
                      const lastNames = ["ใจดี", "สุขสม", "แสงทอง", "พงษ์ไพร", "วงศ์สวัสดิ์", "ศรีสุข", "บุญมา", "เจริญผล", "ทองคำ", "สมบูรณ์", "พิทักษ์", "รุ่งเรือง", "ชัยชนะ", "สว่างแสง", "มีสุข", "ประเสริฐ", "จิตรดี", "วิเชียร", "ดำรงค์", "สายทอง", "กล้าหาญ", "น้อยนิด", "เพ็ชรดี", "อินทร์", "ศักดิ์สิทธิ์", "พลอยงาม", "แก้วมณี", "บุญเกิด", "ชูศรี", "ดีมาก"];
                      const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
                      const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
                      setCustomerNameInput(`${fn} ${ln}`);
                    }}
                    style={{ cursor: 'pointer', fontSize: 10, opacity: 0.3, border: 'none', background: 'none', padding: 0, lineHeight: 1 }}
                  >🎲</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="กรอกชื่อลูกค้า..."
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  style={{ fontFamily: 'Kanit', fontSize: 14, borderRadius: 10, padding: '10px 14px' }}
                  autoFocus
                />
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontFamily: 'Kanit', fontSize: 14, fontWeight: 600, color: '#1f2937', marginBottom: 6, display: 'block' }}>
                  เลขบัตรประชาชน
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="กรอกเลขบัตรประชาชน..."
                  value={customerIdCardInput}
                  onChange={(e) => setCustomerIdCardInput(e.target.value)}
                  style={{ fontFamily: 'Kanit', fontSize: 14, borderRadius: 10, padding: '10px 14px' }}
                  maxLength={13}
                />
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontFamily: 'Kanit', fontSize: 14, fontWeight: 600, color: '#1f2937', marginBottom: 6, display: 'block' }}>
                  เบอร์โทร
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="กรอกเบอร์โทร..."
                  value={customerPhoneInput}
                  onChange={(e) => setCustomerPhoneInput(e.target.value)}
                  style={{ fontFamily: 'Kanit', fontSize: 14, borderRadius: 10, padding: '10px 14px' }}
                  maxLength={10}
                />
              </div>
            </Modal_fill.Body>
            <Modal_fill.Footer>
              <button
                className="btn btn-success"
                style={{ fontFamily: 'Kanit', fontSize: 15, fontWeight: 600, borderRadius: 10, padding: '8px 24px' }}
                disabled={customerNameInput.trim() === ""}
                onClick={handleConfirmCustomerModal}
              >
                ตกลง
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontFamily: 'Kanit', fontSize: 15, borderRadius: 10, padding: '8px 24px' }}
                onClick={() => setShowCustomerModal(false)}
              >
                ปิด
              </button>
            </Modal_fill.Footer>
          </Modal_fill>

          {/* Pediatric Liquid Dose Modal */}
          <PediatricWeightModal
            show={showPediatricModal}
            onClose={handlePediatricCancel}
            onConfirm={handlePediatricConfirm}
            onSkip={handlePediatricCancel}
            pendingProduct={pendingPediatricItem?._product || null}
            currentWeight={globalChildWeight}
          />

          {/**Promotion */}
          {
            code_Promotion.length > 0 ? <div className="row-4 mt-1 shadow-sm rounded border  " style={{ backgroundColor: "white" }}>
              <div className="d-flex  mt-1 mb-1 " style={{ justifyContent: "center" }}>
                <div className="" style={{ width: 200 }}><div className={styles.bodydetail_head} >ส่วนลด โปรโมชั่น {(Number(P_percent.percent == undefined ? 0 : P_percent.percent.perscentTotal)) + Number(P_baht.baht == undefined ? 0 : P_baht.baht.bahtTotal)} บาท</div></div>
              </div>
              <div className='' style={{ overflowY: 'auto' }}>
                <Table className="table" size="sm"  >
                  <thead className="">
                    <tr className="">

                      <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "30%" }}>ชื่อโปรโมชั่น</th>
                      <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "15%" }}>ลูกค้า</th>
                      <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "40%" }}>โปรโมชั่น</th>
                      <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "40%" }}>คำนวณ</th>
                    </tr>
                  </thead>
                  <tbody className="table-group-divider">
                    {code_Promotion.map((a: any) =>
                      <tr className="" key={a.id}>
                        <th scope="row" className={styles.bodydetailTable_Re1} style={{ width: "30%" }}>{a.name_promotion}</th>
                        <td className={styles.bodydetailTable_Re1} style={{ width: "15%" }}>{a.customer}</td>
                        <td className={styles.bodydetailTable_Re1} style={{ width: "40%" }}>{a.msg_condition + " " + a.msg_discount}</td>
                        <td className={styles.bodydetailTable_Re1} style={{ width: "40%" }}>
                          {

                            list.map(num => num).reduce((acc, curr) => acc + curr.total, 0) >= Number(a.pay_condition) ?
                              a.unit === "percent" ? (list.map(num => num).reduce((acc, curr) => acc + curr.total, 0) * Number(a.discount)) / 100 :
                                a.unit === "baht" ? Number(a.discount) : 0
                              :
                              0

                          }

                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

            </div> : ""
          }
        </div>
      </>
    )
  }


  // After Sale
  function Afterpay() {
    // ใช้ ref ระดับ parent (paySubmitLockRef) เพราะ Afterpay remount ทุก parent render
    // ref ที่ประกาศในนี้จะรีเซ็ตเป็น false ระหว่างบันทึก ทำให้กันกดซ้ำไม่ได้
    const isSubmitting = paySubmitLockRef;


    // ประกอบ HTML ใบเสร็จแบบ synchronous จาก state ปัจจุบัน
    // ⚠️ ห้ามอ่าน DOM (contentRef) ในเส้นทางพิมพ์ เพราะ Afterpay remount ทุกครั้งที่ parent re-render
    // ระหว่างบันทึกบิล ทำให้ ref เดิมกลายเป็น null แล้วใบเสร็จไม่ถูกพิมพ์
    const buildReceiptPrintContent = () => {
      const paperSize = localStorage.getItem("receipt_paper_size") || "80";
      const is58 = paperSize === "58";
      const paperW = getThermalReceiptPaperWidth(is58);
      const horizontalOffset = getThermalReceiptHorizontalOffset(is58);
      const fontSize_header = is58 ? "12px" : "15px";
      const fontSize_store = is58 ? "15px" : "19px";
      const fontSize_body = is58 ? "9px" : "11px";
      const fontSize_item = is58 ? "9px" : "11px";
      const fontSize_th = is58 ? "7px" : "8.5px";
      const fontSize_footer = is58 ? "9px" : "11px";
      const fontSize_total = is58 ? "11px" : "13px";
      const separator = is58 ? "------------------------" : "--------------------------------------";
      const logoSize = is58 ? "40px" : "50px";
      const receiptItemRows = list.map((saleItem: any) => {
        const unitLabel = String(saleItem.unit || '').trim();
        const qtyLabel = `${saleItem.qty}${unitLabel ? ` ${unitLabel}` : ''}`;
        const discountValue = Number(saleItem.discount || 0);

        return `
          <div class="receipt-sale-item" style="font-size: ${fontSize_item};">
            <div class="receipt-sale-main">
              <div class="receipt-sale-name">${saleItem.name_product}</div>
              <div class="receipt-sale-total">${saleItem.total}</div>
            </div>
            <div class="receipt-sale-line">
              <div class="receipt-sale-detail">${qtyLabel} x ${saleItem.price}</div>
            </div>
            ${discountValue > 0 ? `<div class="receipt-sale-discount">ลด ${saleItem.discount}</div>` : ''}
          </div>
        `;
      }).join('');

      const content = `
        ${getThermalReceiptPrintStyles(paperW, is58)}
        <div class="thermal-receipt" style="width: ${paperW}; max-width: ${paperW}; background-color: white; box-sizing: border-box; font-family: 'Kanit'; justify-self: left; overflow: visible; margin: 0;">
          
          <div style="width: 100%; display: flex; justify-content: center; margin-bottom: 5px;">
             ${uploadedUrl && String(uploadedUrl) !== "" ? `<img src="${String(uploadedUrl)}" style="width: ${logoSize}; height: ${logoSize};" />` : ''}
          </div>

          <div style="text-align: center; font-size: ${fontSize_header}; font-family: 'Kanit';">${vatEnabledS === "true" ? `<b>ใบกำกับภาษีแบบย่อ</b><br/><span style="font-size: ${fontSize_body}; color: #555;">TAX INVOICE (ABBREVIATED)</span>` : `ใบเสร็จรับเงิน`}</div>
          <div style="text-align: center; font-size: ${fontSize_store}; font-family: 'Kanit'; font-weight: bold;">${storeS}</div>
          ${vatEnabledS === "true" && branchNameS ? `<div style="text-align: center; font-size: ${fontSize_body}; font-family: 'Kanit';">สาขา: ${branchNameS}</div>` : ''}
          <div style="text-align: center; font-size: ${fontSize_body}; font-family: 'Kanit'; word-break: break-word;">${addressS}</div>
          <div style="text-align: center; font-size: ${fontSize_body}; font-family: 'Kanit';">เลขประจำตัวผู้เสียภาษี: ${taxS}</div>
          <div style="text-align: center; font-size: ${fontSize_body}; font-family: 'Kanit';">โทร: ${telS}</div>
          <div style="text-align: center; font-size: ${fontSize_body}; font-family: 'Kanit';">${separator}</div>
          
          ${vatEnabledS === "true" && taxInvoiceNoS ? `<div style="font-size: ${fontSize_body}; font-family: 'Kanit'; font-weight: bold; text-align: left;">เลขที่ใบกำกับภาษี: ${taxInvoiceNoS}</div>` : ''}
          ${lastOrderNoRef.current ? `<div style="font-size: ${fontSize_body}; font-family: 'Kanit'; font-weight: bold; text-align: left;">เลขที่ออเดอร์ : ${lastOrderNoRef.current}</div>` : ''}
          <div style="font-size: ${fontSize_body}; font-family: 'Kanit'; text-align: left;">พนักงานขาย : ${getActiveSeller()}</div>
           <div style="font-size: ${fontSize_body}; font-family: 'Kanit'; text-align: left;">
            วันที่ : ${new Date().toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}&nbsp;&nbsp;&nbsp;
            ${new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric" })}
          </div>
          <div style="text-align: center; font-size: ${fontSize_body}; font-family: 'Kanit';">${separator}</div>
          <div style="font-size: ${fontSize_body}; font-family: 'Kanit'; text-align: left;">ลูกค้า : ${name_cus === "" ? "ลูกค้าทั่วไป" : name_cus}</div>

          <!-- เลขคิวตัวใหญ่ — วางเหนือรายการสินค้าให้ลูกค้าเห็นก่อนอย่างอื่น -->
          ${buildQueueBadgeHtml(lastQueueNoRef.current, is58)}

          <div style="text-align: center; font-size: ${fontSize_body}; font-family: 'Kanit';">${separator}</div>

          <!-- Header & List -->
          <div class="receipt-sale-header" style="font-size: ${fontSize_th};">
            <div>รายการ</div>
            <div class="receipt-sale-header-total">รวม</div>
          </div>
          ${receiptItemRows}

          <div style="text-align: center; font-size: ${fontSize_body}; font-family: 'Kanit'; margin-top: 3px;">${separator}</div>
          <div style="font-size: ${fontSize_body}; font-family: 'Kanit'; text-align: left;">ทั้งหมด : ${list.length} รายการ  ชำระ : ${getPayLabel(alldatalist.pay)}</div>
          
          <!-- Footer Totals -->
          ${(() => {
            const totalItems = list.reduce((acc: number, curr: any) => acc + curr.total, 0)
            const discountAll = Number(alldatalist.discount) + Number(alldatalist.promotion)
            const memberDiscount = Number(memberDiscountTotal || 0)
            const useReward = Number(isNaN(Number(parseInt(alldatalist.usereward))) === true ? 0 : Number(parseInt(alldatalist.usereward)))
            const netTotal = totalItems - discountAll - memberDiscount - useReward
            const bv = Number((netTotal / 1.07).toFixed(2))
            const va = Number((netTotal - bv).toFixed(2))
            const isVatOn = vatEnabledS === "true"
            // ค่าธรรมเนียมบัตร (เช่น EDC) — แสดงแยกใต้ยอดสุทธิ + ยอดเรียกเก็บรวม
            const serviceCharge = saleServiceCharge
            const serviceChargePct = saleServiceChargePercent
            const grandDue = Number((netTotal + serviceCharge).toFixed(2))
            const changeDue = Number(alldatalist.receivebaht || 0) - (alldatalist.pay === 'split' ? netTotal : grandDue)
            const fm2 = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

            if (is58) {
              return `
              <div style="font-size: ${fontSize_footer}; font-family: 'Kanit'; margin-top: 3px;">
                <div style="display: flex; justify-content: space-between; padding: 1px 0;">
                  <span>รวมมูลค่าสินค้า :</span>
                  <span>${totalItems} บ.</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 1px 0;">
                  <span>ส่วนลด :</span>
                  <span>${discountAll} บ.</span>
                </div>
                ${memberDiscount > 0 ? `
                <div style="display: flex; justify-content: space-between; padding: 1px 0;">
                  <span>ส่วนลดสมาชิก :</span>
                  <span>${memberDiscount.toLocaleString()} บ.</span>
                </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; padding: 1px 0;">
                  <span>ใช้แต้มส่วนลด :</span>
                  <span>${useReward.toLocaleString()} บ.</span>
                </div>
                ${isVatOn ? `
                <div style="text-align: center; font-size: 6px; color: #999; margin: 2px 0;">- - - - - - - - - - - - - - -</div>
                <div style="display: flex; justify-content: space-between; padding: 1px 0;">
                  <span>มูลค่าสินค้า :</span>
                  <span>${bv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บ.</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 1px 0;">
                  <span>VAT 7% :</span>
                  <span>${va.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บ.</span>
                </div>
                ` : ''}
                <div class="receipt-grand-total" style="display: flex; justify-content: space-between; padding: 3px 0 1px 0; font-size: ${fontSize_total}; font-weight: bold; border-top: 1px dashed black; margin-top: 2px;">
                  <span>${isVatOn ? 'รวมทั้งสิ้น :' : 'ยอดสุทธิ :'}</span>
                  <span>${isVatOn ? netTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : netTotal.toLocaleString()} บ.</span>
                </div>
                ${isVatOn ? '<div style="text-align: center; font-size: 6px; font-family: Kanit; color: #888; margin-top: 3px;">** ราคารวมภาษีมูลค่าเพิ่มแล้ว **</div>' : ''}
                ${serviceCharge > 0 ? `
                <div style="display: flex; justify-content: space-between; padding: 1px 0; font-size: ${fontSize_footer};">
                  <span>ค่าธรรมเนียมบัตร ${serviceChargePct}% :</span>
                  <span>+${fm2(serviceCharge)} บ.</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 1px 0; font-size: ${fontSize_total}; font-weight: bold;">
                  <span>ยอดเรียกเก็บรวม :</span>
                  <span>${fm2(grandDue)} บ.</span>
                </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; padding: 1px 0; font-size: ${fontSize_footer};">
                  <span>ยอดรับ :</span>
                  <span>${Number(alldatalist.receivebaht || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บ.</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 1px 0; font-size: ${fontSize_footer};">
                  <span>เงินทอน :</span>
                  <span>${fm2(changeDue)} บ.</span>
                </div>
              </div>`
            } else {
              return `
              <table style="width: 100%; border-collapse: collapse; table-layout: fixed; font-family: 'Kanit'; margin-top: 10px;">
                <colgroup>
                  <col style="width: auto;"/>
                  <col style="width: 96px;"/>
                </colgroup>
                <tbody>
                  <tr style="font-size: ${fontSize_footer};">
                    <td style="text-align: right; padding: 1px 2px 1px 0;">รวมมูลค่าสินค้า :</td>
                    <td style="text-align: right; padding: 1px 0; white-space: nowrap;">${totalItems} บาท</td>
                  </tr>
                  <tr style="font-size: ${fontSize_footer};">
                    <td style="text-align: right; padding: 1px 2px 1px 0;">ส่วนลด :</td>
                    <td style="text-align: right; padding: 1px 0; white-space: nowrap;">${discountAll} บาท</td>
                  </tr>
                  ${memberDiscount > 0 ? `
                  <tr style="font-size: ${fontSize_footer};">
                    <td style="text-align: right; padding: 1px 2px 1px 0;">ส่วนลดสมาชิก :</td>
                    <td style="text-align: right; padding: 1px 0; white-space: nowrap;">${memberDiscount.toLocaleString()} บาท</td>
                  </tr>
                  ` : ''}
                  <tr style="font-size: ${fontSize_footer};">
                    <td style="text-align: right; padding: 1px 2px 1px 0;">ใช้แต้มส่วนลด :</td>
                    <td style="text-align: right; padding: 1px 0; white-space: nowrap;">${useReward.toLocaleString()} บาท</td>
                  </tr>
                  ${isVatOn ? `
                  <tr><td colspan="2" style="text-align: center; font-size: 7px; color: #999; padding: 2px 0;">- - - - - - - - - - - - - - - - - - -</td></tr>
                  <tr style="font-size: ${fontSize_footer};">
                    <td style="text-align: right; padding: 1px 2px 1px 0;">มูลค่าสินค้า :</td>
                    <td style="text-align: right; padding: 1px 0; white-space: nowrap;">${bv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</td>
                  </tr>
                  <tr style="font-size: ${fontSize_footer};">
                    <td style="text-align: right; padding: 1px 2px 1px 0;">ภาษีมูลค่าเพิ่ม 7% :</td>
                    <td style="text-align: right; padding: 1px 0; white-space: nowrap;">${va.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</td>
                  </tr>
                  ` : ''}
                  <tr class="receipt-grand-total" style="font-size: ${fontSize_total}; font-weight: bold;">
                    <td style="text-align: right; padding: 4px 2px 1px 0;">${isVatOn ? 'รวมทั้งสิ้น :' : 'ยอดรวมสุทธิ :'}</td>
                    <td style="text-align: right; padding: 4px 0 1px 0; white-space: nowrap;">${isVatOn ? netTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : netTotal.toLocaleString()} บาท</td>
                  </tr>
                  ${isVatOn ? '<tr><td colspan="2" style="text-align: center; font-size: 7px; font-family: Kanit; color: #888; padding: 3px 0;">** ราคารวมภาษีมูลค่าเพิ่มแล้ว **</td></tr>' : ''}
                  ${serviceCharge > 0 ? `
                  <tr style="font-size: ${fontSize_footer};">
                    <td style="text-align: right; padding: 1px 2px 1px 0;">ค่าธรรมเนียมบัตร ${serviceChargePct}% :</td>
                    <td style="text-align: right; padding: 1px 0; white-space: nowrap;">+${fm2(serviceCharge)} บาท</td>
                  </tr>
                  <tr style="font-size: ${fontSize_total}; font-weight: bold;">
                    <td style="text-align: right; padding: 1px 2px 1px 0;">ยอดเรียกเก็บรวม :</td>
                    <td style="text-align: right; padding: 1px 0; white-space: nowrap;">${fm2(grandDue)} บาท</td>
                  </tr>
                  ` : ''}
                  <tr style="font-size: ${fontSize_footer};">
                    <td style="text-align: right; padding: 1px 2px 1px 0;">ยอดรับ :</td>
                    <td style="text-align: right; padding: 1px 0; white-space: nowrap;">${Number(alldatalist.receivebaht || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</td>
                  </tr>
                  <tr style="font-size: ${fontSize_footer};">
                    <td style="text-align: right; padding: 1px 2px 1px 0;">เงินทอน :</td>
                    <td style="text-align: right; padding: 1px 0; white-space: nowrap;">${fm2(changeDue)} บาท</td>
                  </tr>
                </tbody>
              </table>`
            }
          })()}

        </div>
      `;

      return { content, horizontalOffset };
    };

    /* ใบ job ของพนักงาน — พิมพ์ต่อจากใบเสร็จที่เครื่องพิมพ์ตัวเดียวกัน (auto_printer_rc)
       แยกใบเพราะคนละคนใช้: ใบเสร็จให้ลูกค้าถือไปรอ ใบ job อยู่กับคนเตรียมของ
       ถ้ายังไม่ได้เลขคิว (ออกคิวไม่สำเร็จ) ก็ไม่ต้องพิมพ์ ใบ job ที่ไม่มีเลขคิวจับคู่กับลูกค้าไม่ได้ */
    const printJobTicket = async () => {
      const queueNo = lastQueueNoRef.current;
      if (!queueNo) return;

      const is58 = (localStorage.getItem("receipt_paper_size") || "80") === "58";
      const content = buildJobTicketHtml({
        queueNo,
        orderNo: lastOrderNoRef.current,
        customer: name_cus === "" ? "" : name_cus,
        seller: getActiveSeller(),
        storeName: storeS,
        is58,
        items: list.map((it: any) => ({
          name: String(it.name_product || ""),
          qty: Number(it.qty) || 0,
          unit: String(it.unit || ""),
        })),
      });

      if (!isSilentPrintAvailable()) {
        printThermalReceiptInBrowser(content, getThermalReceiptHorizontalOffset(is58));
        return;
      }
      try {
        await printSilent({
          content,
          printerName: selectedPrinter_rc,
          horizontalOffset: getThermalReceiptHorizontalOffset(is58),
        });
      } catch (error) {
        // ใบเสร็จพิมพ์ไปแล้ว — ใบ job พลาดไม่ควรทำให้ flow ชำระเงินสะดุด แค่บอกให้สั่งพิมพ์ซ้ำ
        console.error("Job ticket printing failed:", error);
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>พิมพ์ใบ job ไม่สำเร็จ</div>, {
          description: <div style={{ fontFamily: "Kanit", fontSize: 16 }}>ใบเสร็จพิมพ์แล้ว และคิวถูกบันทึกแล้ว — ดูรายการที่ต้องเตรียมได้จากแผงสถานะคิว</div>,
          duration: 5000,
        });
      }
    };

    const handleAutoPrint_rc = async () => {
      const { content, horizontalOffset } = buildReceiptPrintContent();

      // ไม่มีช่องทางพิมพ์เงียบ (เช่นเปิดผ่านเบราว์เซอร์) → ใช้ print dialog ของเบราว์เซอร์แทน
      if (!isSilentPrintAvailable()) {
        printThermalReceiptInBrowser(content, horizontalOffset);
        await printJobTicket();
        return;
      }

      try {
        await printSilent({
          content: content,
          printerName: selectedPrinter_rc,
          horizontalOffset
        });
        await printJobTicket();
        toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
          description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> ส่งพิมพ์เรียบร้อย</div>,
          duration: 3000,
        });

      } catch (error) {
        console.error("Printing failed:", error);
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>พิมพ์ใบเสร็จไม่สำเร็จ</div>, {
          description: <div style={{ fontFamily: "Kanit", fontSize: 16 }}>กรุณาตรวจสอบเครื่องพิมพ์ แล้วสั่งพิมพ์ใหม่จากเมนูรายงาน</div>,
          duration: 5000,
        });
      }
    };


    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn1 = useReactToPrint({
      contentRef,
      print: async (iframe: HTMLIFrameElement) => {
        const html = iframe.contentDocument?.documentElement.outerHTML;

        if (html && isSilentPrintAvailable()) {
          handleAutoPrint_rc()
        } else {
          // เบราว์เซอร์ล้วน: ไม่มีช่องทางพิมพ์เงียบ ต้องเด้ง dialog ของระบบ
          await iframe.contentWindow?.print();

        }
      }
    })

    //*********Loading*********************** */
    // loading ของปุ่มชำระต้องอยู่ระดับ parent (payLoading) ไม่งั้น spinner/disabled
    // หายกลางทางเมื่อ Afterpay ถูก remount ระหว่างรอ API ตอบ
    const loading = payLoading;
    const setLoading = setPayLoading;
    const [autoPrintReceipt, setAutoPrintReceipt] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem("autoPrintReceipt") !== "false") : true);

    const handleClick = async () => {
      if (loading || isSubmitting.current) return;

      // Validation: Check if change is negative (insufficient payment)
      const totalAmount = Number(list.reduce((acc, curr) => acc + curr.total, 0));
      const netTotal = totalAmount - Number(alldatalist.discount || 0) - Number(alldatalist.promotion || 0) - Number(memberDiscountTotal || 0) - Number(alldatalist.usereward || 0);
      const isSplitPay = alldatalist.pay === "split";
      const splitReceived = Number(alldatalist.cashAmount || 0) + Number(alldatalist.transferAmount || 0);
      const received = isSplitPay ? splitReceived : Number(alldatalist.receivebaht || 0);
      // จ่ายเต็มผ่านช่องทางที่มีค่าธรรมเนียม (เช่น EDC): ยอดที่ต้องรับ = สุทธิ + service charge
      // แยกจ่าย: ช่องคีย์เป็นยอดสินค้า ค่าธรรมเนียมเก็บเพิ่มที่เครื่องรูด จึงเทียบกับยอดสินค้าตามเดิม
      const netTotalDue = isSplitPay ? netTotal : Number((netTotal + saleServiceCharge).toFixed(2));
      const change = received - netTotalDue;
      const saleLogbookItems = buildSaleLogbookItems();
      const saleItemSummary = formatSaleLogbookSummary(saleLogbookItems);

      if (isSplitPay && change < 0) {
        toast.error("กรุณากรอกยอดเงินสด/โอนให้ครบยอดสุทธิก่อนยืนยันการชำระ");
        void logAction({
          actionType: "confirm",
          entityType: "sale",
          buttonLabel: "ชำระสินค้า",
          status: "blocked",
          message: "กรุณากรอกยอดเงินสด/โอนให้ครบยอดสุทธิก่อนยืนยันการชำระ",
          metadata: {
            itemCount: list.length,
            netTotal,
            cashAmount: Number(alldatalist.cashAmount || 0),
            transferAmount: Number(alldatalist.transferAmount || 0),
            change,
            paymentMethod: alldatalist.pay || "",
            saleItemSummary,
            saleItems: saleLogbookItems,
            productItems: saleLogbookItems,
          },
        });
        return;
      }

      if (change < 0) {
        toast.error("ไม่สามารถชำระสินค้าได้ เนื่องจากเงินรับน้อยกว่ายอดสุทธิ");
        void logAction({
          actionType: "confirm",
          entityType: "sale",
          buttonLabel: "ชำระสินค้า",
          status: "blocked",
          message: "ไม่สามารถชำระสินค้าได้ เนื่องจากเงินรับน้อยกว่ายอดสุทธิ",
          metadata: {
            itemCount: list.length,
            netTotal,
            receiveBaht: Number(alldatalist.receivebaht || 0),
            change,
            paymentMethod: alldatalist.pay || "",
            saleItemSummary,
            saleItems: saleLogbookItems,
            productItems: saleLogbookItems,
          },
        });
        return;
      }

      const startedAt = Date.now();

      // ✅ Set loading IMMEDIATELY so button disables + spinner paints in next frame
      isSubmitting.current = true;
      setLoading(true);

      // ✅ Yield to the browser so React can flush the loading state to the DOM
      // before we kick off the heavy POST (gives instant visual feedback)
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      try {
        const result = await SaleMainSubmit();
        const billId = result?.data?.bill_id || "";
        const payMethodLabel = alldatalist.pay === "split" ? "แยกจ่าย" : getPayLabel(alldatalist.pay);

        void logAction({
          actionType: "confirm",
          entityType: "sale",
          buttonLabel: "ชำระสินค้า",
          status: "success",
          message: billId ? `ชำระสินค้าสำเร็จ เลขที่บิล: ${billId}` : "ชำระสินค้าสำเร็จ",
          entityId: billId,
          entityCode: billId,
          durationMs: Date.now() - startedAt,
          metadata: {
            itemCount: list.length,
            netTotal,
            netTotalDue,
            serviceCharge: saleServiceCharge,
            serviceChargePercent: saleServiceChargePercent,
            totalAmount,
            discount: Number(alldatalist.discount || 0),
            promotion: Number(alldatalist.promotion || 0),
            rewardUsed: Number(alldatalist.usereward || 0),
            receiveBaht: Number(alldatalist.receivebaht || 0),
            change,
            paymentMethod: payMethodLabel || alldatalist.pay || "",
            customerCode: code_cus || alldatalist.code_costomer || "",
            saleItemSummary,
            saleItems: saleLogbookItems,
            productItems: saleLogbookItems,
          },
        });

        toast.success(
          <div style={{ fontFamily: "Kanit", fontSize: 14 }}>
            <b>ชำระสินค้าสำเร็จ!</b>
            {billId && <div>เลขที่บิล: {billId}</div>}
          </div>
        );

        setMessage("");
        localStorage.setItem("dg", JSON.stringify([]));

        // Print only on success (if autoPrintReceipt is enabled)
        // handleAutoPrint_rc ประกอบใบเสร็จจาก state ทันที (ไม่พึ่ง contentRef ที่ถูกล้างตอน remount)
        // และเลือกช่องทางพิมพ์เอง: Electron = printSilent, เบราว์เซอร์ = print dialog
        if (autoPrintReceipt) {
          void handleAutoPrint_rc();
        }

        // Show large payment summary toast
        const summaryToastId = toast(
            <div style={{ fontFamily: "Kanit", width: "100%" }}>
              {/* Header */}
              <div style={{ textAlign: "center", padding: "14px 20px 12px", borderBottom: "1.5px solid #e2e8f0" }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#334155", letterSpacing: 0.5 }}>✅ ชำระสินค้าสำเร็จ</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>
                  {new Date().toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}&nbsp;&nbsp;
                  {new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              {/* Net Total — Hero */}
              <div style={{ background: "linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)", padding: "20px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 18, color: "#173F6B", marginBottom: 4 }}>ยอดสุทธิ</div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8 }}>
                  <span style={{ fontSize: 56, fontWeight: 800, color: "#2A6AAA", lineHeight: 1.1 }}>{netTotalDue.toLocaleString()}</span>
                  <span style={{ fontSize: 26, fontWeight: 500, color: "#3E86C7" }}>บาท</span>
                </div>
                {saleServiceCharge > 0 && (
                  <div style={{ fontSize: 14, color: "#92400e", marginTop: 4 }}>
                    สินค้า {netTotal.toLocaleString()} + ค่าธรรมเนียมบัตร {saleServiceChargePercent}% ({saleServiceCharge.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท)
                  </div>
                )}
              </div>

              {/* รับเงิน */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F3F8FC", padding: "14px 24px" }}>
                <span style={{ fontSize: 22, color: "#173F6B" }}>💵 รับเงิน</span>
                <span>
                  <span style={{ fontSize: 38, fontWeight: 700, color: "#2A6AAA" }}>{Number(alldatalist.receivebaht || 0).toLocaleString()}</span>
                  <span style={{ fontSize: 20, color: "#6BA3D8", marginLeft: 6 }}>บาท</span>
                </span>
              </div>

              {/* เงินทอน */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: change > 0 ? "linear-gradient(135deg,#fef3c7,#fde68a)" : "#f8fafc", padding: "14px 24px" }}>
                <span style={{ fontSize: 22, color: "#92400e" }}>💸 เงินทอน</span>
                <span>
                  <span style={{ fontSize: 38, fontWeight: 700, color: change > 0 ? "#d97706" : "#94a3b8" }}>{change.toLocaleString()}</span>
                  <span style={{ fontSize: 20, color: change > 0 ? "#f59e0b" : "#cbd5e1", marginLeft: 6 }}>บาท</span>
                </span>
              </div>

              {/* Split */}
              {alldatalist.pay === "split" && (
                <div style={{ display: "flex", justifyContent: "center", gap: 32, background: "#f8fafc", padding: "12px 24px", fontSize: 17, color: "#475569", borderTop: "1px solid #e2e8f0" }}>
                  <span>💵 เงินสด: <b style={{ color: "#2A6AAA" }}>{Number(alldatalist.cashAmount || 0).toLocaleString()}</b> บาท</span>
                  <span>🏦 โอน: <b style={{ color: "#2A6AAA" }}>{Number(alldatalist.transferAmount || 0).toLocaleString()}</b> บาท</span>
                </div>
              )}

              {/* Footer */}
              <div style={{ textAlign: "center", padding: "12px 20px 16px", borderTop: "1px solid #e2e8f0", background: "#fff" }}>
                {payMethodLabel && (
                  <span style={{ background: "#f1f5f9", borderRadius: 20, padding: "4px 16px", fontSize: 14, color: "#475569", display: "inline-block", marginBottom: 6 }}>💳 {payMethodLabel}</span>
                )}
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>กด Enter เพื่อปิด</div>
              </div>
            </div>,
            {
              unstyled: true,
              duration: 3000,
              style: {
                width: 460,
                maxWidth: "95vw",
                background: "#fff",
                borderRadius: 18,
                boxShadow: "0 10px 50px rgba(0,0,0,0.18), 0 2px 10px rgba(0,0,0,0.08)",
                overflow: "hidden",
                border: "1px solid #e2e8f0",
              },
            }
          );

          // Allow dismissing with Enter key
          const dismissOnEnter = (e: globalThis.KeyboardEvent) => {
            if (e.key === "Enter") {
              toast.dismiss(summaryToastId);
              document.removeEventListener("keydown", dismissOnEnter);
            }
          };
          document.addEventListener("keydown", dismissOnEnter);
          // Auto-cleanup listener after 3s
          setTimeout(() => document.removeEventListener("keydown", dismissOnEnter), 3500);

      } catch (error) {
        console.error("Sale submission failed:", error);
        toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
        void logAction({
          actionType: "confirm",
          entityType: "sale",
          buttonLabel: "ชำระสินค้า",
          status: "failed",
          message: "ชำระสินค้าไม่สำเร็จ",
          errorMessage: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
          durationMs: Date.now() - startedAt,
          metadata: {
            itemCount: list.length,
            netTotal,
            totalAmount,
            receiveBaht: Number(alldatalist.receivebaht || 0),
            change,
            paymentMethod: alldatalist.pay || "",
            saleItemSummary,
            saleItems: saleLogbookItems,
            productItems: saleLogbookItems,
          },
        });
      } finally {
        setLoading(false);
        isSubmitting.current = false;
      }
    };

    //****************************************** */

    const handlePay = () => { handleClick() };
    const handlePrint = () => {
      const totalAmount = Number(list.reduce((acc, curr) => acc + curr.total, 0));
      const netTotal = totalAmount - Number(alldatalist.discount || 0) - Number(alldatalist.promotion || 0) - Number(memberDiscountTotal || 0) - Number(alldatalist.usereward || 0);
      const change = Number(alldatalist.receivebaht || 0) - netTotal;

      if (change < 0) {
        toast.error("ไม่สามารถพิมพ์ใบเสร็จได้ เนื่องจากเงินรับน้อยกว่ายอดสุทธิ");
        return;
      }
      // ✅ Defer the heavy DOM-clone print work to next frame so the click is acknowledged instantly
      requestAnimationFrame(() => reactToPrintFn1());
    };
    // const handlePrint1 = handleAutoPrint_rc;
    // B4: ล็อกปุ่มกลับหน้าชำระเงิน (กันทุจริต) — กดกลับไม่ได้ ให้ชำระอย่างเดียว
    const payBackLocked = isPayBackLocked();

    const handleback = () => {
      if (payBackLocked) return; // ล็อกไว้ตามสิทธิ์ B4 — ห้ามย้อนกลับ

      localStorage.setItem("showhead", String((Math.floor(Math.random() * 100) + 1))),
        setchangePay("2"),
        setMessage(""),
        localStorage.setItem("pay_s", "cash")
      setSelectedOption("cash")

    };

    // B4: เมื่อล็อกปุ่มกลับ — ดักทางออกจากหน้าชำระเงินทุกทาง (กันทุจริต)
    // 1) ปุ่มย้อนกลับเบราว์เซอร์: history trap — push state ค้างไว้ แล้วทุกครั้งที่กด back (popstate)
    //    ก็ push กลับเข้ามาใหม่ ทำให้ยังอยู่หน้าเดิม
    // 2) ปิดแท็บ / รีเฟรช (F5, Ctrl+R): beforeunload — เบราว์เซอร์เด้งกล่องยืนยันก่อนออก
    //    (มาตรฐานเว็บทำได้แค่ "ถามยืนยัน" ปิด/รีเฟรชแบบเงียบ ๆ ไม่ได้ ข้อความก็ถูก browser บังคับเอง)
    // เลิกดักทั้งหมดอัตโนมัติเมื่อออกจากโหมดชำระเงิน (component unmount)
    useEffect(() => {
      if (!payBackLocked) return;
      if (typeof window === 'undefined') return;
      window.history.pushState(null, '', window.location.href);
      const onPopState = () => {
        window.history.pushState(null, '', window.location.href);
      };
      const onBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = ''; // จำเป็นสำหรับ Chrome ให้กล่องยืนยันเด้ง
        return '';
      };
      // ดักคีย์รีเฟรช (F5, Ctrl+R, Ctrl+Shift+R, Cmd+R) แบบ capture → preventDefault
      // ทำให้กดรีเฟรชด้วยคีย์บอร์ดแล้ว "ไม่รีเฟรช" อยู่หน้าเดิมจริง ๆ
      const onKeyDownBlock = (e: globalThis.KeyboardEvent) => {
        const k = (e.key || '').toLowerCase();
        if (k === 'f5' || ((e.ctrlKey || e.metaKey) && k === 'r')) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      window.addEventListener('popstate', onPopState);
      window.addEventListener('beforeunload', onBeforeUnload);
      window.addEventListener('keydown', onKeyDownBlock as EventListener, { capture: true });
      // เดสก์ท็อป: สั่ง Electron main process บล็อกการปิดหน้าต่าง/รีเฟรช/Ctrl+W จริง ๆ
      // Android: กันปุ่ม Back ของเครื่องผ่าน NativeAppShell (เพดานสูงกว่าที่เบราว์เซอร์ทำได้)
      setPayLock(true);
      return () => {
        window.removeEventListener('popstate', onPopState);
        window.removeEventListener('beforeunload', onBeforeUnload);
        window.removeEventListener('keydown', onKeyDownBlock as EventListener, { capture: true } as any);
        setPayLock(false);
      };
    }, [payBackLocked]);


    useEffect(() => {
      // ✅ บอก type ให้ TypeScript ชัดเจน
      const handleKeyDown = (event: globalThis.KeyboardEvent) => {
        const key = event.key.toLowerCase();

        switch (key) {
          case 'f12':
            event.preventDefault();
            handlePay();
            break;
          case 'f11':
            event.preventDefault();
            handlePrint();
            //    handlePrint1();
            break;
          case 'f10':
            event.preventDefault();
            if (!payBackLocked) handleback(); // B4 ล็อก: ปิดคีย์ลัด F10 ด้วย
            break;
          case 'f8':
            event.preventDefault();
            setSelectedOption('cash');
            setatalist((prev: any) => ({
              ...prev,
              pay: 'cash',
              receivebaht: String(calcSaleNetTotal(prev)),
              total: String(saleGrossTotal)
            }));
            localStorage.setItem("pay_s", "cash");
            setTimeout(() => { receiveInputRef.current?.focus(); receiveInputRef.current?.select(); }, 100);
            break;
          case 'f9':
            event.preventDefault();
            setSelectedOption('payment');
            setatalist((prev: any) => ({
              ...prev,
              pay: 'payment',
              receivebaht: String(calcSaleNetTotal(prev)),
              total: String(saleGrossTotal)
            }));
            localStorage.setItem("pay_s", "payment");
            setTimeout(() => { receiveInputRef.current?.focus(); receiveInputRef.current?.select(); }, 100);
            break;
          case 'f7':
            event.preventDefault();
            setSelectedOption('split');
            setatalist((prev: any) => ({
              ...prev,
              pay: 'split',
              receivebaht: "",
              cashAmount: "",
              transferAmount: "",
              total: String(list.reduce((acc: number, curr: any) => acc + curr.total, 0))
            }));
            localStorage.setItem("pay_s", "split");
            break;
          case 'f6': {
            event.preventDefault();
            const nextProvider = getPaymentProviderValue(payProviders, true, localStorage.getItem("payment_provider") || "")
            setSelectedOption('other');
            setatalist((prev: any) => ({
              ...prev,
              pay: 'other',
              receivebaht: String(calcSaleNetTotal(prev)),
              total: String(saleGrossTotal),
              payment_provider: nextProvider
            }));
            localStorage.setItem("pay_s", "other");
            localStorage.setItem("payment_provider", nextProvider);
            setTimeout(() => { confirmPaymentRef.current?.focus(); }, 100);
            break;
          }

        }
      };

      // ✅ ระบุ type ของ listener ให้ตรง
      window.addEventListener('keydown', handleKeyDown as EventListener);

      return () => {
        window.removeEventListener('keydown', handleKeyDown as EventListener);
      };
    }, [handlePay, handlePrint, handleback]);

    const paymentGrossTotal = saleGrossTotal;
    const paymentRewardDiscount = normalizeRewardDiscount(alldatalist.usereward);
    const paymentBillDiscount = calcBillDiscountTotal(alldatalist);
    // ยอดสุทธิที่แสดง = ยอดที่ลูกค้าต้องชำระจริง (รวม service charge เช่น EDC)
    const paymentNetTotal = saleNetTotalDue;
    const paymentReceived = Number(alldatalist.receivebaht || 0);
    const paymentChange = paymentReceived - paymentNetTotal;





    return (

      <div className={`${styles.afterpayContainer} ${styles.payDeskRoot}`}>
        {/* Header : ชื่อหน้า + ข้อมูลบิลย่อ (วันที่ / ลูกค้า / แต้ม) รวมเป็นแถบเดียว */}
        <div className={styles.payDeskHeader}>
          <div className={styles.payDeskBrand}>
            <span className={styles.payDeskBrandIcon}><CreditCard size={24} strokeWidth={2.3} /></span>
            <div className={styles.payDeskBrandText}>
              <div className={styles.payDeskBrandTitle}>สรุปข้อมูลการขาย</div>
              <div className={styles.payDeskBrandSub}>ตรวจสอบยอดก่อนรับชำระเงิน</div>
            </div>
          </div>
          <div className={styles.payDeskMeta}>
            <div className={styles.payDeskMetaItem}>
              <span className={styles.payDeskMetaLabel}>วันที่</span>
              <span className={styles.payDeskMetaValue}>
                {new Date().toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}&nbsp;
                {new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric" })}
              </span>
            </div>
            <span className={styles.payDeskMetaSep} />
            <div className={styles.payDeskMetaItem}>
              <span className={styles.payDeskMetaLabel}>ลูกค้า</span>
              <span className={styles.payDeskMetaValue}>
                {code_cus === "" ? "ลูกค้าทั่วไป" : `${code_cus} ${name_cus}`}
              </span>
            </div>
            <span className={styles.payDeskMetaSep} />
            <div className={styles.payDeskMetaItem}>
              <span className={styles.payDeskMetaLabel}>แต้มสะสม</span>
              <span className={styles.payDeskMetaValue}>
                {code_cus === "" ? 0 : customerTotalPoints}
                <span className={styles.payDeskMetaDelta}>+{earnedPointsFromBill}</span>
                <span className={styles.payDeskMetaArrow}>→</span>
                {customerTotalPointsAfterSale}
                <span className={styles.payDeskMetaUnit}>แต้ม</span>
              </span>
            </div>
          </div>
        </div>

        <div className={`row ${styles.payDeskBody}`}>
          {/* Left Column - Sale Info */}
          <div className={`col-sm-7 ${styles.payDeskColumn}`}>

            {/* แถวหลัก : ซ้าย = ที่มาของยอด / ขวา = รับเงิน-เงินทอน (จุดที่แคชเชียร์ต้องมอง) */}
            <div className={styles.payDeskGrid}>

              {/* การ์ดยอดชำระ */}
              <section className={styles.payDeskCard}>
                <div className={styles.payDeskCardHead}>
                  <span className={styles.payDeskCardTitle}>ยอดชำระ</span>
                  <span className={styles.payDeskCardBadge}>{list.length} รายการ</span>
                </div>

                <div className={styles.payDeskLines}>
                  <div className={styles.payDeskLine}>
                    <span className={styles.payDeskLineLabel}>
                      <span className={styles.payDeskLineIcon}><Coins size={18} strokeWidth={2.3} /></span>ยอดรวม
                    </span>
                    <span className={styles.payDeskLineValue}>{paymentGrossTotal.toLocaleString()}<span className={styles.payDeskLineUnit}>บาท</span></span>
                  </div>
                  <div className={styles.payDeskLine}>
                    <span className={styles.payDeskLineLabel}>
                      <span className={styles.payDeskLineIcon}><Gift size={18} strokeWidth={2.3} /></span>แต้มลด
                    </span>
                    <span className={styles.payDeskLineControl}><Usereward_s /></span>
                  </div>
                  <div className={styles.payDeskLine}>
                    <span className={styles.payDeskLineLabel}>
                      <span className={styles.payDeskLineIcon}><BadgePercent size={18} strokeWidth={2.3} /></span>ส่วนลด
                    </span>
                    <span className={styles.payDeskLineControl}><Discount_s /></span>
                  </div>
                  <div className={styles.payDeskLine}>
                    <span className={styles.payDeskLineLabel}>
                      <span className={styles.payDeskLineIcon}><UserRound size={18} strokeWidth={2.3} /></span>ส่วนลดสมาชิก
                    </span>
                    <span className={styles.payDeskLineValue}>{formatMemberDiscountAmount(memberDiscountTotal)}<span className={styles.payDeskLineUnit}>บาท</span></span>
                  </div>
                </div>

                <div className={styles.payDeskNet}>
                  <span className={styles.payDeskNetLabel}>
                    <span className={styles.payDeskNetIcon}><CircleCheck size={22} strokeWidth={2.5} /></span>ยอดสุทธิ
                  </span>
                  <span className={styles.payDeskNetValue}>
                    {paymentNetTotal.toLocaleString()}<span className={styles.payDeskNetUnit}>บาท</span>
                  </span>
                </div>
                {saleServiceCharge > 0 && selectedOption !== 'split' && (
                  <div className={styles.payDeskNote}>
                    รวมค่าธรรมเนียมบัตร {saleServiceChargePercent}% (+{saleServiceCharge.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </div>
                )}
              </section>

              {/* การ์ดรับเงิน / เงินทอน */}
              <section className={`${styles.payDeskCard} ${styles.payDeskCardAccent}`}>
                <div className={styles.payDeskCardHead}>
                  <span className={styles.payDeskCardTitle}>
                    <span className={styles.payDeskLineIcon}><Banknote size={18} strokeWidth={2.3} /></span>รับเงิน
                  </span>
                  <span className={styles.payDeskHint}>พิมพ์ยอด แล้วกด Enter</span>
                </div>

                <div className={styles.payDeskReceiveField}>
                  <Rereveive_s />
                  <span className={styles.payDeskFieldUnit}>บาท</span>
                </div>

                <div className={`${styles.payDeskChange} ${paymentChange < 0 ? styles.payDeskChangeNeg : ''}`}>
                  <span className={styles.payDeskChangeLabel}>
                    <span className={styles.payDeskLineIcon}><Wallet size={18} strokeWidth={2.3} /></span>เงินทอน
                  </span>
                  <span className={styles.payDeskChangeValue}>
                    {paymentChange.toLocaleString()}<span className={styles.payDeskNetUnit}>บาท</span>
                  </span>
                </div>

                {paymentChange < 0 && (
                  <div className={styles.payDeskAlert}>
                    ⚠️ ยังชำระไม่ได้ — รับเงินน้อยกว่ายอดสุทธิ {Math.abs(paymentChange).toLocaleString()} บาท
                  </div>
                )}
              </section>
            </div>

            {/* Payment Method */}
            <section className={styles.payDeskCard} style={{ marginTop: 8 }}>
              <div className={styles.payDeskCardHead}>
                <span className={styles.payDeskCardTitle}>
                  <span className={styles.payDeskLineIcon}><CreditCard size={18} strokeWidth={2.3} /></span>ช่องทางชำระ
                </span>
              </div>
              <Radio_pay />
            </section>

            {/* Manual Confirm Payment (Gateway) */}
            {selectedOption === 'payment' && (
              <div className={styles.payDeskGatewayRow}>
                <button
                  type="button"
                  onClick={async () => {
                    const txId = localStorage.getItem("current_txId") || ""
                    if (!txId) { alert("ยังไม่มี Transaction"); return }
                    try {
                      const companyS = localStorage.getItem("company_") || ""
                      const res = await axios.post("/api/gateway/confirm", { txId, company: companyS })
                      if (res.data.success) {
                        alert("✅ ยืนยันชำระเงินสำเร็จ")
                      }
                    } catch (err: any) {
                      alert(err?.response?.data?.error || "เกิดข้อผิดพลาด")
                    }
                  }}
                  className={styles.payDeskGatewayButton}
                >
                  ✅ ยืนยันชำระเงิน (Manual)
                </button>
              </div>
            )}

            {/* Template Buttons */}
            <div className={`${styles.documentActionPanel} ${styles.payDeskDocPanel}`}>
              <div className={styles.documentActionTitle}>เอกสารประกอบบิล</div>
              <div className={`${styles.templateButtons} ${styles.payDeskDocGrid}`}>
              <QuotationTemplate /> {/**ใบเสนอราคา */}
              <BillTemplate />     {/**ใบวางบิล */}
              <InvoiceTemplate />  {/**ใบแจ้งหนี้ */}
              <DeliveryTemplate /> {/**ใบส่งสินค้า */}
              <ReTemplate />        {/**ใบเสร็จรับเงิน */}
              </div>
            </div>

          </div>

          {/* แถบปุ่มดำเนินการแนวตั้ง : วางในช่องว่างระหว่างแผงชำระเงินกับใบเสร็จ + ลอยติดจอ (sticky) */}
          <div className={styles.payDeskRail}>
            <button
              ref={confirmPaymentRef}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur from input before click
                handlePay();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handlePay();
                }
              }}
              type="button"
              disabled={loading || addhis === 1}
              className={`${styles.payDeskRailButton} ${styles.payDeskRailPrimary}`}>
              {loading ? (
                <>
                  <span className={styles.payDeskRailIcon}><SpinnerIcon size={30} color="text-white" /></span>
                  <span className={styles.payDeskRailLabel}>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <span className={styles.payDeskRailIcon}><CircleCheck size={38} strokeWidth={2.2} /></span>
                  <span className={styles.payDeskRailLabel}>ชำระสินค้า</span>
                  <span className={styles.payDeskRailShortcut}>Enter · F12</span>
                </>
              )}
            </button>

            <button
              onMouseDown={(e) => { e.preventDefault(); handleback(); }}
              type="button"
              disabled={payBackLocked}
              title={payBackLocked ? "ปุ่มกลับถูกล็อก (สิทธิ์ B4) — กรุณากดชำระสินค้า" : undefined}
              className={`${styles.payDeskRailButton} ${styles.payDeskRailBack} ${payBackLocked ? styles.payDeskRailLocked : ''}`}>
              <span className={styles.payDeskRailIcon}>
                {payBackLocked ? <Lock size={26} strokeWidth={2.3} /> : <RotateCcw size={28} strokeWidth={2.3} />}
              </span>
              <span className={styles.payDeskRailLabel}>กลับ</span>
              <span className={styles.payDeskRailShortcut}>{payBackLocked ? "ล็อก" : "F10"}</span>
            </button>
          </div>

          {/** Slip */}
          {list.length > 0 && (
          <div className={`col-sm-5 ${styles.receiptColRight}`}>
            {/* แถวควบคุม (เปลี่ยนผู้ขาย/พิมพ์ใบเสร็จ) จัดชิดซ้ายให้ตรงกับสลิปที่ชิดซ้าย + ติดปุ่มชำระเงิน */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 4, gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {(String(localStorage.getItem("level_")) === "level2" || String(localStorage.getItem("level_")) === "level1") && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {String(localStorage.getItem("level_")) === "level2" && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontFamily: 'Kanit', fontSize: 12, color: '#555' }}>
                    <input
                      type="checkbox"
                      checked={changeSeller}
                      onChange={(e) => { setChangeSeller(e.target.checked); localStorage.setItem("changeSeller", String(e.target.checked)); if (!e.target.checked) { setSelectedSeller(""); localStorage.setItem("selectedSeller", ""); } }}
                      style={{ width: 16, height: 16, accentColor: '#f59e0b', cursor: 'pointer' }}
                    />
                    เปลี่ยนผู้ขาย
                  </label>
                  )}
                  <select
                    value={selectedSeller}
                    onChange={(e) => { setSelectedSeller(e.target.value); localStorage.setItem("selectedSeller", e.target.value); }}
                    disabled={!changeSeller}
                    style={{
                      fontFamily: 'Kanit', fontSize: 12, padding: '2px 6px', borderRadius: 6,
                      border: '1px solid #d1d5db', cursor: changeSeller ? 'pointer' : 'not-allowed',
                      backgroundColor: changeSeller ? '#fff' : '#f3f4f6', color: changeSeller ? '#333' : '#9ca3af',
                      minWidth: 120,
                    }}
                  >
                    <option value="">-- เลือกผู้ขาย --</option>
                    {postsEmp.map((emp: any) => (
                      <option key={emp.id} value={emp.name}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontFamily: 'Kanit', fontSize: 12, color: '#555' }}>
                <input
                  type="checkbox"
                  checked={autoPrintReceipt}
                  onChange={(e) => { setAutoPrintReceipt(e.target.checked); localStorage.setItem("autoPrintReceipt", String(e.target.checked)); }}
                  style={{ width: 16, height: 16, accentColor: '#2A6AAA', cursor: 'pointer' }}
                />
                🖨️ พิมพ์ใบเสร็จ
              </label>
            </div>
            <div className={styles.receiptSlip} ref={contentRef}>

              <div className={styles.receiptHeader}>
                {String(uploadedUrl)===""?"":
                <div style={{ width: 50, height: 50, margin: '0 auto 8px' }}>
                  <img alt={""} src={String(uploadedUrl)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>}
                {vatEnabledS === "true" ? (
                  <>
                    <div style={{ fontFamily: 'Kanit_B', fontSize: 13 }}>ใบกำกับภาษีแบบย่อ</div>
                    <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#555' }}>TAX INVOICE (ABBREVIATED)</div>
                  </>
                ) : (
                  <div style={{ fontFamily: 'Kanit_B', fontSize: 14 }}>ใบเสร็จรับเงิน</div>
                )}
                <div className={styles.receiptStoreName}>{storeS}</div>
                {vatEnabledS === "true" && branchNameS && (
                  <div className={styles.receiptAddress}>สาขา: {branchNameS}</div>
                )}
                <div className={styles.receiptAddress}>{addressS}</div>
                <div className={styles.receiptAddress}>เลขประจำตัวผู้เสียภาษี: {taxS}</div>
                <div className={styles.receiptAddress}>โทร: {telS}</div>
              </div>

              <div className={styles.receiptDivider}>--------------------------------------</div>

              {vatEnabledS === "true" && taxInvoiceNoS && (
                <div className={styles.receiptLine} style={{ fontFamily: 'Kanit_B' }}>เลขที่ใบกำกับภาษี: {taxInvoiceNoS}</div>
              )}
              {lastOrderNo && (
                <div className={styles.receiptLine} style={{ fontFamily: 'Kanit_B' }}>เลขที่ออเดอร์ : {lastOrderNo}</div>
              )}
                <div className={styles.receiptLine}>พนักงานขาย : {getActiveSeller()}</div>
                <div className={styles.receiptLine}>
                วันที่ : {new Date().toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}&nbsp;&nbsp;&nbsp;
                {new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric" })}
              </div>

              <div className={styles.receiptDivider}>--------------------------------------</div>
                <div className={styles.receiptLine}>ลูกค้า : {name_cus === "" ? "ลูกค้าทั่วไป" : name_cus}</div>
              <div className={styles.receiptDivider}>--------------------------------------</div>


              {/* Item Header */}
              <div className={styles.receiptItemsHeader}>
                <div>รายการ</div>
                <div className={styles.receiptNumber}>รวม</div>
              </div>

              {/* Item List */}
              {list.map((saleItem: any) => {
                const drugTypes = ["ขย.10", "ขย.11", "ขย.12", "ขย.13", "ข.ย.10", "ข.ย.11", "ข.ย.12", "ข.ย.13", "ขย.10 และ ขย.11", "ขย.10 และ ขย.12", "ขย.11 และ ขย.12"];
                const prod = dataProduct.find((productItem: any) => productItem.code === saleItem.code_product);
                const matchType = prod && drugTypes.includes(prod.type) ? prod.type : null;
                const matchSubtype = prod && drugTypes.includes(prod.subtype) ? prod.subtype : null;
                const drugLabel = matchType || matchSubtype;
                const unitLabel = String(saleItem.unit || '').trim();
                const qtyLabel = `${saleItem.qty}${unitLabel ? ` ${unitLabel}` : ''}`;
                const discountValue = Number(saleItem.discount || 0);

                return (
                  <div key={saleItem.id}>
                    <div className={styles.receiptItemGrid}>
                      <div className={styles.receiptItemMain}>
                        <div className={styles.receiptItemName}>{saleItem.name_product}</div>
                        <div className={styles.receiptNumber}>{saleItem.total}</div>
                      </div>
                      <div className={styles.receiptItemFormula}>{qtyLabel} x {saleItem.price}</div>
                      {discountValue > 0 && <div className={styles.receiptItemDiscount}>ลด {saleItem.discount}</div>}
                    </div>
                    {drugLabel && saleItem.name_customer && (
                      <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#2A6AAA', fontWeight: 600, paddingLeft: 4 }}>
                        ผู้ซื้อ: {saleItem.name_customer}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className={styles.receiptDivider}>--------------------------------------</div>
              <div className={styles.receiptLine}>
                ทั้งหมด : {list.length} รายการ &nbsp;&nbsp; ชำระสินค้า : {alldatalist.pay === "split" ? "แยกจ่าย" : getPayLabel(alldatalist.pay)}
              </div>
              {alldatalist.pay === "split" && (
                <div className={styles.receiptLine}>
                  เงินสด: {Number(alldatalist.cashAmount || 0).toLocaleString()} บาท / โอน: {Number(alldatalist.transferAmount || 0).toLocaleString()} บาท
                </div>
              )}

              {/* Footer - Points & Total */}
              <div className={styles.receiptTotalSection}>
                <div className={styles.receiptFooterGrid}>
                  {/* Points Column */}
                  <div className={styles.receiptPointsColumn}>
                    <div className={styles.receiptPointsRow}>
                      <span className={styles.receiptPointItem}>
                        <span className={styles.receiptPointLabel}>สะสม</span>
                        <span className={styles.receiptPointValue}>{total_cus === "" ? 0 : customerTotalPoints}</span>
                      </span>
                      <span className={styles.receiptPointItem}>
                        <span className={styles.receiptPointLabel}>บิลนี้</span>
                        <span className={styles.receiptPointValue}>{total_cus === "" ? 0 : earnedPointsFromBill}</span>
                      </span>
                      <span className={styles.receiptPointItem}>
                        <span className={styles.receiptPointLabel}>รวม</span>
                        <span className={styles.receiptPointValue}>{total_cus === "" ? 0 : customerTotalPoints + earnedPointsFromBill}</span>
                        <span className={styles.receiptPointUnit}>แต้ม</span>
                      </span>
                    </div>
                  </div>

                  {/* Money Column */}
                  <div className={styles.receiptMoneyColumn}>
                    <div className={styles.receiptTotalRow}>
                      <span className={styles.receiptTotalLabel}>รวมมูลค่าสินค้า :</span>
                      <span className={styles.receiptTotalValue}>{list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)} บาท</span>
                    </div>
                    <div className={styles.receiptTotalRow}>
                      <span className={styles.receiptTotalLabel}>ส่วนลด :</span>
                      <span className={styles.receiptTotalValue}>{Number(alldatalist.discount) + Number(alldatalist.promotion)} บาท</span>
                    </div>
                    {Number(memberDiscountTotal || 0) > 0 && (
                      <div className={styles.receiptTotalRow}>
                        <span className={styles.receiptTotalLabel}>ส่วนลดสมาชิก :</span>
                        <span className={styles.receiptTotalValue}>{formatMemberDiscountAmount(memberDiscountTotal)} บาท</span>
                      </div>
                    )}
                    <div className={styles.receiptTotalRow}>
                      <span className={styles.receiptTotalLabel}>ใช้แต้มส่วนลด :</span>
                      <span className={styles.receiptTotalValue}>{parseInt(String(alldatalist.usereward))} บาท</span>
                    </div>
                    {vatEnabledS === "true" && (() => {
                      const netTotal = saleNetTotal
                      const bv = Number((netTotal / 1.07).toFixed(2))
                      const va = Number((netTotal - bv).toFixed(2))
                      return (
                        <>
                          <div style={{ textAlign: 'center', fontSize: 8, fontFamily: 'Kanit', color: '#999', margin: '2px 0' }}>- - - - - - - - - - - - - -</div>
                          <div className={styles.receiptTotalRow}>
                            <span className={styles.receiptTotalLabel}>มูลค่าสินค้า :</span>
                            <span className={styles.receiptTotalValue}>{bv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
                          </div>
                          <div className={styles.receiptTotalRow}>
                            <span className={styles.receiptTotalLabel}>VAT 7% :</span>
                            <span className={styles.receiptTotalValue}>{va.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
                          </div>
                        </>
                      )
                    })()}
                    <div className={styles.receiptTotalRow} style={{ background: '#F8FAFC', borderRadius: 4, padding: '4px 8px', marginTop: 4 }}>
                      <span className={styles.receiptNetTotal}>{vatEnabledS === "true" ? "รวมทั้งสิ้น :" : "ยอดรวมสุทธิ :"}</span>
                      <span className={styles.receiptNetTotal} style={{ marginLeft: 8, height: 10 }}>
                        {vatEnabledS === "true"
                          ? saleNetTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : saleNetTotal
                        } บาท
                      </span>
                    </div>
                    {vatEnabledS === "true" && (
                      <div style={{ textAlign: 'center', fontSize: 8, fontFamily: 'Kanit', color: '#888', marginTop: 4 }}>** ราคารวมภาษีมูลค่าเพิ่มแล้ว **</div>
                    )}
                    {saleServiceCharge > 0 && (
                      <>
                        <div className={styles.receiptTotalRow}>
                          <span className={styles.receiptTotalLabel}>ค่าธรรมเนียมบัตร {saleServiceChargePercent}% :</span>
                          <span className={styles.receiptTotalValue}>+{saleServiceCharge.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
                        </div>
                        <div className={styles.receiptTotalRow} style={{ background: '#FFFBEB', borderRadius: 4, padding: '4px 8px' }}>
                          <span className={styles.receiptNetTotal}>ยอดเรียกเก็บรวม :</span>
                          <span className={styles.receiptNetTotal} style={{ marginLeft: 8, height: 10 }}>
                            {saleChargeGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                          </span>
                        </div>
                      </>
                    )}
                    <div className={styles.receiptTotalRow} style={{ marginTop: 4 }}>
                      <span className={styles.receiptTotalLabel}>ยอดรับ :</span>
                      <span className={styles.receiptTotalValue}>{Number(alldatalist.receivebaht || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
                    </div>
                    <div className={styles.receiptTotalRow}>
                      <span className={styles.receiptTotalLabel}>เงินทอน :</span>
                      <span className={styles.receiptTotalValue}>
                        {(() => {
                          const nt = alldatalist.pay === 'split' ? saleNetTotal : saleChargeGrandTotal
                          return (Number(alldatalist.receivebaht || 0) - nt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        })()} บาท
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          )}
        </div>

      </div>

    )
  }





  const [isChecked, setIsChecked] = useState(true);

  const handleCheckboxChange = (event: any) => {
    setIsChecked(event.target.checked);
  };


  //${"50"}
  //Print Label
  const handleAutoPrint_label = async () => {
    if (!isSilentPrintAvailable()) {
      alert("ไม่พบช่องทางการพิมพ์ของเครื่องนี้");
      return;
    }


    const selectedOption1 = typeof window !== 'undefined' ? localStorage.getItem("lg") || 'th' : 'th';
    const content = ReactDOMServer.renderToStaticMarkup(
      <div style={{ width: "100mm", fontFamily: "Kanit" }}>
        {list.filter((q: any) => q.label === true).map((a: any) => (
          <div key={a.id} id="selcet-print" className='col-12 rounded border border-2 shadow shadow-sm' style={{ height: 200, backgroundColor: "white", marginBottom: "10px", pageBreakInside: "avoid" }}  >
            <div className='row' >

              <Container style={{ height: 60 }}>
                {allS === false ?
                  <Row >
                    {logoS === true ?
                      <Col sm={2}>
                        <div style={{ maxWidth: 60, width: 60, marginTop: 5, justifyItems: "center", marginLeft: 5 }}>
                          <img alt={""} src={String(uploadedUrl)} width={45} height={45} />

                        </div>
                      </Col>
                      : ""}
                    <Col sm={lineS === true ? 5 : (logoS === true ? 8 : 10)} style={{ marginLeft: logoS === true ? 10 : 35 }}>
                      <div className='row'>
                        <div className={logoS === true ? 'col-8' : 'col-9'} style={{ fontFamily: "kanit_B", fontSize: 16, textAlign: "start", width: "100%" ,marginLeft:10}}>{storeS}</div>

                      </div>
                      <div style={{ fontFamily: "kanit", fontSize: 9, width: "100%" }}>{addressS}{" โทร : "}  {telS}</div>
                      <div className='row rounded  shadow shadow mb-2' style={{ borderColor: "black", fontFamily: "kanit", height: 2, fontSize: 10, backgroundColor: "black" ,marginLeft:10}}></div>
                    </Col>
                    {lineS === true ?
                      <Col sm={2}>
                        <div style={{ maxWidth: 45, width: 45, marginLeft: 10 }}>
                          <img alt={""} src={String(uploadedUrl1)} width={60} height={60} />
                          <div style={{ fontFamily: "kanit", fontSize: 8, textAlign: "center" }}>Line ร้านค้า</div>
                        </div>
                      </Col> : ""}
                  </Row> : ""}
              </Container>


              <div style={{ width: '100%' }}>
                {allS === true ? <div className='row ' style={{ marginLeft: 8, backgroundColor: "black", width: "95%", borderColor: "black", height: 2 }}></div> : ""}
                <div className='row mt-1'>
                  <div className='col-auto me-auto ' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "start", marginLeft: 5 }}>{typeof name_cus !== "undefined" && name_cus === "" ? "ลูกค้าทั่วไป" : typeof name_cus !== "undefined" ? name_cus : "ลูกค้าทั่วไป"}</div>
                  <div className='col-auto' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", marginRight: 10 }}>{new Date().toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}</div>
                </div>


                <div className='row' style={{ height: "20vh" }}>
                  <div className='col-9 me-auto'>

                    <div className='d-flex' style={{ fontFamily: "kanit_B", fontSize: 13, textAlign: "start", marginLeft: 5, wordBreak: 'break-word', width: "100%" }}>{a.name_product}</div>
                    <div
                      className='d-flex'
                      style={{ fontFamily: "kanit", fontSize: 13, textAlign: "start", marginLeft: 5, wordBreak: 'break-word', width: "100%" }}>

                      {
                        selectedOption1 === "th" ? a.indicatorlistS :
                          selectedOption1 === "my" ? a.my_indicatorlistS :
                            selectedOption1 === "lo" ? a.lo_indicatorlistS :
                              selectedOption1 === "en" ? a.en_indicatorlistS :
                                selectedOption1 === "zh-CN" ? a.zh_indicatorlistS :
                                  selectedOption1 === "ru" ? a.ru_indicatorlistS :
                                    selectedOption1 === "km" ? a.km_indicatorlistS :
                                      selectedOption1 === "ko" ? a.ko_indicatorlistS :
                                        selectedOption1 === "ja" ? a.ja_indicatorlistS :
                                          selectedOption1 === "ms" ? a.ms_indicatorlistS :
                                      ""}

                    </div>


                    <div className='d-flex' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", wordBreak: 'break-word', width: "100%" }}>
                      <div
                        className='d-flex'
                        style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, wordBreak: 'break-word', width: "100%", flexWrap: 'wrap' }}>

                        {a.childWeight > 0
                          ? (selectedOption1 === "th" ? `น้ำหนัก ${a.childWeight} kg | ครั้งละ ${a.childDoseMl} ml  วันละ ${a.childFrequency} ครั้ง` :
                            selectedOption1 === "my" ? `ကိုယ်အလေးချိန် ${a.childWeight} kg | တစ်ကြိမ် ${a.childDoseMl} ml  တစ်နေ့ ${a.childFrequency} ကြိမ်` :
                            selectedOption1 === "lo" ? `ນ້ຳໜັກ ${a.childWeight} kg | ຄັ້ງລະ ${a.childDoseMl} ml  ມື້ລະ ${a.childFrequency} ຄັ້ງ` :
                            selectedOption1 === "en" ? `Weight ${a.childWeight} kg | ${a.childDoseMl} ml  ${a.childFrequency} times/day` :
                            selectedOption1 === "zh-CN" ? `体重 ${a.childWeight} kg | 每次 ${a.childDoseMl} ml  每天 ${a.childFrequency} 次` :
                            selectedOption1 === "ru" ? `Вес ${a.childWeight} кг | по ${a.childDoseMl} мл  ${a.childFrequency} раз/день` :
                            selectedOption1 === "km" ? `ទម្ងន់ ${a.childWeight} kg | ម្តង់ៗ ${a.childDoseMl} ml  ថ្ងៃលៈ ${a.childFrequency} ដង` :
                            selectedOption1 === "ko" ? `체중 ${a.childWeight} kg | 1회 ${a.childDoseMl} ml  하루 ${a.childFrequency}회` :
                            selectedOption1 === "ja" ? `体重 ${a.childWeight} kg | 1回 ${a.childDoseMl} ml  1日 ${a.childFrequency}回` :
                            selectedOption1 === "ms" ? `Berat ${a.childWeight} kg | ${a.childDoseMl} ml  ${a.childFrequency} kali/hari` :
                            `Weight ${a.childWeight} kg | ${a.childDoseMl} ml (${a.childDoseTeaspoon} tsp) ${a.childFrequency} times/day`)
                          : <>{
                          selectedOption1 === "th" ? a.useS :
                            selectedOption1 === "my" ? a.my_useS :
                              selectedOption1 === "lo" ? a.lo_useS :
                                selectedOption1 === "en" ? a.en_useS :
                                  selectedOption1 === "zh-CN" ? a.zh_useS :
                                    selectedOption1 === "ru" ? a.ru_useS :
                                      selectedOption1 === "km" ? a.km_useS :
                                        selectedOption1 === "ko" ? a.ko_useS :
                                          selectedOption1 === "ja" ? a.ja_useS :
                                            selectedOption1 === "ms" ? a.ms_useS :
                                        ""}
                        &nbsp;&nbsp;&nbsp;
                        {
                          selectedOption1 === "th" ? a.timeuseS :
                            selectedOption1 === "my" ? a.my_timeuseS :
                              selectedOption1 === "lo" ? a.lo_timeuseS :
                                selectedOption1 === "en" ? a.en_timeuseS :
                                  selectedOption1 === "zh-CN" ? a.zh_timeuseS :
                                    selectedOption1 === "ru" ? a.ru_timeuseS :
                                      selectedOption1 === "km" ? a.km_timeuseS :
                                        selectedOption1 === "ko" ? a.ko_timeuseS :
                                          selectedOption1 === "ja" ? a.ja_timeuseS :
                                            selectedOption1 === "ms" ? a.ms_timeuseS :
                                        ""}</>}

                      </div>


                    </div>


                    {/**     <div className='col' style={{fontFamily:"kanit",fontSize:11,textAlign:"start",marginLeft:5,whiteSpace:'nowrap',overflow:"hidden",textOverflow:"ellipsis",width:"9vw"}}>{a.timeuseS}</div>*/}


                    <div className='d-flex' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", wordBreak: 'break-word', width: "100%" }}>
                      {/**  {a.timeS} */}
                      <div
                        className='d-flex'
                        style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, wordBreak: 'break-word', width: "100%", flexWrap: 'wrap' }}>

                        {
                          selectedOption1 === "th" ? a.timeS :
                            selectedOption1 === "my" ? a.my_timeS :
                              selectedOption1 === "lo" ? a.lo_timeS :
                                selectedOption1 === "en" ? a.en_timeS :
                                  selectedOption1 === "zh-CN" ? a.zh_timeS :
                                    selectedOption1 === "ru" ? a.ru_timeS :
                                      selectedOption1 === "km" ? a.km_timeS :
                                        selectedOption1 === "ko" ? a.ko_timeS :
                                          selectedOption1 === "ja" ? a.ja_timeS :
                                            selectedOption1 === "ms" ? a.ms_timeS :
                                        ""}
                        &nbsp;&nbsp;&nbsp;
                        {
                          selectedOption1 === "th" ? a.keepS :
                            selectedOption1 === "my" ? a.my_keepS :
                              selectedOption1 === "lo" ? a.lo_keepS :
                                selectedOption1 === "en" ? a.en_keepS :
                                  selectedOption1 === "zh-CN" ? a.zh_keepS :
                                    selectedOption1 === "ru" ? a.ru_keepS :
                                      selectedOption1 === "km" ? a.km_keepS :
                                        selectedOption1 === "ko" ? a.ko_keepS :
                                          selectedOption1 === "ja" ? a.ja_keepS :
                                            selectedOption1 === "ms" ? a.ms_keepS :
                                        ""}

                      </div>


                    </div>
                    {/**   <div className='col' style={{fontFamily:"kanit",fontSize:11,textAlign:"start",marginLeft:5,whiteSpace:'nowrap',overflow:"hidden",textOverflow:"ellipsis",width:"9vw"}}>{a.keepS}</div>*/}


                    <div className='d-flex' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", wordBreak: 'break-word', width: "100%" }}>
                      {/**     {a.remarkS}*/}
                      <div
                        className='d-flex'
                        style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, wordBreak: 'break-word', width: "100%", flexWrap: 'wrap' }}>

                        หมายเหตุ : {
                          selectedOption1 === "th" ? a.remarkS :
                            selectedOption1 === "my" ? a.my_remarkS :
                              selectedOption1 === "lo" ? a.lo_remarkS :
                                selectedOption1 === "en" ? a.en_remarkS :
                                  selectedOption1 === "zh-CN" ? a.zh_remarkS :
                                    selectedOption1 === "ru" ? a.ru_remarkS :
                                      selectedOption1 === "km" ? a.km_remarkS :
                                        selectedOption1 === "ko" ? a.ko_remarkS :
                                          selectedOption1 === "ja" ? a.ja_remarkS :
                                            selectedOption1 === "ms" ? a.ms_remarkS :
                                        "."}

                      </div>

                    </div>
                    {a.childWeight > 0 && (
                      <div style={{ background: '#F3F8FC', borderRadius: 4, padding: '2px 5px', marginTop: 2, marginLeft: 5, border: '1px solid #CCDFF1' }}>
                        <div style={{ fontFamily: "kanit_B", fontSize: 11, color: '#173F6B' }}>
                          น.น. {a.childWeight} kg | ครั้งละ {a.childDoseMl} ml  วันละ {a.childFrequency} ครั้ง
                        </div>
                        {a.childDoseWarning && (
                          <div style={{ fontFamily: "kanit_B", fontSize: 10, color: '#dc2626' }}>** เกิน max dose **</div>
                        )}
                      </div>
                    )}
                    <div className='row mt-1' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, wordBreak: 'break-word', width: "100%" }}>เภสัชกร : {postsEmp.filter((a: any) => a.position === "เภสัชกรประจำร้าน").map((b: any) => b.name)}</div>
                  </div>


                  <div className='col-3' style={{ marginTop: 60 }}>

                    <div style={{ height: "auto", margin: "0 auto", maxWidth: 40, width: "100%" }}>


                      <QRCode
                        size={256}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        value={a.barcode}
                        viewBox={"0 0 256 256"}
                      />


                    </div>
                    <div style={{ fontFamily: "kanit", fontSize: 8, textAlign: "left", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>{a.barcode}</div>
                  </div>

                </div>
              </div>



            </div>
          </div>
        ))}
      </div>
    );

    try {
      await printSilent({
        content: content,
        printerName: selectedPrinter_rc
      });
      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> ส่งพิมพ์เรียบร้อย</div>,
        duration: 3000,
      });

    } catch (error) {
      console.error("Printing failed:", error);
      alert("Printing failed");
    }
  };


  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({
    contentRef,
    pageStyle: `@media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`,
    print: async (iframe: HTMLIFrameElement) => {
      const html = iframe.contentDocument?.documentElement.outerHTML;

      if (html) {
        await iframe.contentWindow?.print();

      }
    }
  })


  // ตั้งค่่าฉลากยา
  function SetLabel() {

    type LabelPaperSize = '80x50' | '80x60' | '70x100'
    const labelPaperSizeOptions: Array<{ value: LabelPaperSize; label: string; widthMm: number; heightMm: number }> = [
      { value: '80x50', label: '80×50 mm', widthMm: 80, heightMm: 50 },
      { value: '80x60', label: '80×60 mm', widthMm: 80, heightMm: 60 },
      { value: '70x100', label: '70×100 mm', widthMm: 70, heightMm: 100 },
    ]
    const isLabelPaperSize = (value: string | null): value is LabelPaperSize =>
      value === '80x50' || value === '80x60' || value === '70x100'

    const [listS, setListS] = useState<any[]>([]); // กำหนด Type ให้เป็น Array ของอะไรบางอย่าง
    const [listL, setlistL] = useState(list)
    const [separatePage, setSeparatePage] = useState(false)
    const [paperSize, setPaperSize] = useState<LabelPaperSize>('80x50')
    const [labelStyle, setLabelStyle] = useState<'current' | 'wow' | 'pro' | 'elegant' | 'minimal'>('current')
    const selectPaperSize = (size: LabelPaperSize) => {
      setPaperSize(size)
      localStorage.setItem("labelPaperSize", size)
    }

    // เปิด/ปิดแต่ละหัวข้อบนฉลากยา (จำค่าใน localStorage)
    type LabelSectionKey = 'customer' | 'date' | 'productName' | 'fixname' | 'indication' | 'usage' | 'timeKeep' | 'remark' | 'pharmacist';
    const labelSectionOptions: { key: LabelSectionKey; label: string }[] = [
      { key: 'customer', label: 'ชื่อลูกค้า' },
      { key: 'date', label: 'วันที่' },
      { key: 'productName', label: 'ชื่อสินค้า' },
      { key: 'fixname', label: 'ชื่อทางการ' },
      { key: 'indication', label: 'ข้อบ่งใช้' },
      { key: 'usage', label: 'วิธีใช้' },
      { key: 'timeKeep', label: 'ช่วงเวลา/เก็บ' },
      { key: 'remark', label: 'หมายเหตุ' },
      { key: 'pharmacist', label: 'เภสัชกร' },
    ];
    const defaultLabelSections: Record<LabelSectionKey, boolean> = {
      customer: true, date: true, productName: true, fixname: true, indication: true, usage: true, timeKeep: true, remark: true, pharmacist: true,
    };
    // เริ่มด้วยค่า default ก่อน แล้วค่อยโหลดค่าที่จำไว้ใน useEffect ด้านล่าง (กัน SSR hydration mismatch)
    const [labelSections, setLabelSections] = useState<Record<LabelSectionKey, boolean>>(defaultLabelSections);
    const toggleLabelSection = (key: LabelSectionKey) => {
      setLabelSections(prev => {
        const next = { ...prev, [key]: !prev[key] };
        localStorage.setItem('labelSections', JSON.stringify(next));
        return next;
      });
    };
    const resetLabelSections = () => {
      setLabelSections(defaultLabelSections);
      localStorage.setItem('labelSections', JSON.stringify(defaultLabelSections));
    };
    const hiddenSectionCount = labelSectionOptions.filter(o => !labelSections[o.key]).length;

    // ฉลากยาเปล่า
    const blankLabelModal = useDisclosure();
    const blankLabelRef = useRef<HTMLDivElement>(null);
    const [blankFontAdj, setBlankFontAdj] = useState(0);

    // ตัวช่วยฉลากยา
    const labelHelperModal = useDisclosure();
    const [helperList, setHelperList] = useState<any[]>([]);
    const [showHelper, setShowHelper] = useState(false);
    const [selectedHelperId, setSelectedHelperId] = useState<number | null>(null);

    // โหลดรายการตัวช่วยฉลากยา (และรีโหลดเมื่อปิด modal สร้าง/แก้ไข)
    useEffect(() => {
      const c = localStorage.getItem("company_") || "";
      axios.get(`/api/label-helper?company=${c}&sort=asc`)
        .then(r => {
          const data = (r.data || []).filter((h: any) => !h.suspended);
          setHelperList(data);
          setSelectedHelperId(prev => {
            if (prev != null && data.some((h: any) => h.id === prev)) return prev;
            const def = data.find((h: any) => h.isDefault) || data[0];
            return def ? def.id : null;
          });
        })
        .catch(() => { });
    }, [labelHelperModal.isOpen]);

    const activeHelper = showHelper && selectedHelperId != null
      ? helperList.find((h: any) => h.id === selectedHelperId)
      : null;

    // ฉลากตัวช่วยฉลากยา — เพิ่มอีก 1 ดวงต่อ 1 ฉลากที่เลือกพิมพ์ (idx ใช้เป็น key)
    const renderHelperCard = (idx: number = 0) => {
      if (!activeHelper) return null;
      const lines = [1, 2, 3, 4, 5, 6]
        .map(n => ({ on: activeHelper[`line${n}On`], text: activeHelper[`line${n}`], size: Number(activeHelper[`line${n}Size`]) || 10 }))
        .filter(l => l.on && (l.text || '').trim() !== '');
      const hasQr = !!(activeHelper.url && String(activeHelper.url).trim() !== '');
      const hasBc = !!(activeHelper.showBarcode && String(activeHelper.barcode || '').trim() !== '');
      const titleText = activeHelper.titleOn !== false ? String(activeHelper.title || '').trim() : '';
      if (lines.length === 0 && !hasQr && !hasBc && titleText === '') return null;

      const isTallSep = separatePage && paperSize === '70x100';
      const dateStr = new Date().toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
      // วันนัดโทรติดตาม — ดึงวันที่ที่กดบันทึกไว้ (localStorage "his") มาเติมในบรรทัดที่มีจุดไข่ปลา
      const followupDateStr = (() => {
        try {
          const saved = JSON.parse(localStorage.getItem("his") || "[]");
          const rec = saved?.[0];
          // เติมวันที่เฉพาะเมื่อผู้ใช้กดบันทึกการติดตามแล้ว (statusH = "ติดตามผล")
          if (!rec || rec.statusH !== "ติดตามผล") return "";
          const dd = rec.duedate;
          if (!dd) return "";
          const d = new Date(dd);
          if (isNaN(d.getTime())) return "";
          return d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch { return ""; }
      })();
      const fillFollowupDate = (text: string) => {
        if (!followupDateStr) return text;
        // เติมเฉพาะบรรทัดนัดติดตามที่มีจุดไข่ปลา (……)
        if (/ติดตาม/.test(text) && /\.{2,}/.test(text)) {
          return text.replace(/\.{2,}/, ` ${followupDateStr}`);
        }
        return text;
      };
      const outer: React.CSSProperties = {
        ...(separatePage
          ? { height: paperHeightCss, width: paperWidthCss, pageBreakAfter: 'always' as const, pageBreakInside: 'avoid' as const, margin: `0 ${paperPreviewGap}px ${paperPreviewGap}px 0`, overflow: 'hidden', padding: paperSize === '70x100' ? '1.5mm' : '0mm', boxSizing: 'border-box' as const }
          : { minHeight: labelHeight, width: contentWidth + 80, margin: '0 0 6px 0', boxSizing: 'border-box' as const }),
        backgroundColor: 'white',
      };

      return (
        <div key={`helper-${idx}`} id="selcet-print" style={{ ...outer, borderRadius: 0, border: '2.5px double #000', overflow: 'hidden', fontFamily: 'Kanit', display: isTallSep ? 'flex' : undefined, flexDirection: isTallSep ? 'column' : undefined }}>
          {/* Header ร้าน */}
          <div style={{ height: headerHeight, overflow: 'hidden', flexShrink: 0 }}>
            {allS === false ? (
              <div style={{ padding: '1px 8px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 6, height: '100%', borderBottom: '2px solid #000' }}>
                {logoS === true && uploadedUrl ? <img alt="" src={String(uploadedUrl)} width={32} height={30} style={{ flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} /> : null}
                <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Kanit_B', fontSize: labelHeaderFontSize + 2, color: '#000', lineHeight: 1.15, letterSpacing: '0.5px' }}>{storeS}</div>
                  <div style={{ fontSize: labelHeaderFontSize - 5, color: '#000', lineHeight: 1.15 }}>{addressS} Tel. {telS}</div>
                </div>
              </div>
            ) : ""}
          </div>
          {/* ลูกค้า + วันที่ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isTallSep ? '1mm 2.5mm' : '1px 8px', borderBottom: '1px solid #000', fontSize: isTallSep ? labelFontSize - 2 : labelFontSize - 3, color: '#000', flexShrink: 0 }}>
            <span><span style={{ fontSize: labelFontSize - 4, color: '#444' }}>ชื่อ:</span> <span style={{ fontFamily: 'Kanit_B' }}>{name_cus === "" ? "ลูกค้าทั่วไป" : name_cus}</span></span>
            <span><span style={{ fontSize: labelFontSize - 4, color: '#444' }}>วันที่:</span> {dateStr}</span>
          </div>
          {/* ข้อความตัวช่วย — จัดกึ่งกลาง */}
          <div style={{ flex: isTallSep ? 1 : undefined, minHeight: isTallSep ? 0 : undefined, padding: isTallSep ? '2mm 3mm' : '4px 8px 5px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 2 }}>
            {titleText !== '' && (
              <div style={{ fontFamily: 'Kanit_B', fontSize: Number(activeHelper.titleSize) || 14, lineHeight: 1.2, color: '#000', borderBottom: '1.5px solid #000', paddingBottom: 2, marginBottom: 2, width: '100%', wordBreak: 'break-word' }}>{titleText}</div>
            )}
            {lines.map((l, i) => (
              <div key={i} style={{ fontFamily: 'Kanit_B', fontSize: l.size, lineHeight: 1.2, color: '#000', wordBreak: 'break-word', width: '100%' }}>{fillFollowupDate(l.text)}</div>
            ))}
            {(hasQr || hasBc) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 3 }}>
                {hasQr && <QRCodeCanvas value={String(activeHelper.url)} size={isTallSep ? 56 : 42} level="M" />}
                {hasBc && <HelperBarcodeCanvas value={String(activeHelper.barcode).trim()} height={isTallSep ? 28 : 22} />}
              </div>
            )}
          </div>
        </div>
      );
    };

    // Hydrate label-modal selections from localStorage after mount (avoid SSR hydration mismatch)
    useEffect(() => {
      if (typeof window === 'undefined') return
      const ps = localStorage.getItem("labelPaperSize")
      if (isLabelPaperSize(ps)) setPaperSize(ps)
      const ls = localStorage.getItem("labelStyle")
      if (ls === 'current' || ls === 'wow' || ls === 'pro' || ls === 'elegant' || ls === 'minimal') setLabelStyle(ls)
      const bf = Number(localStorage.getItem('blankFontAdj'))
      if (Number.isFinite(bf)) setBlankFontAdj(bf)
      // หัวข้อในฉลาก (เปิด/ปิดแต่ละหัวข้อ)
      try {
        const sec = JSON.parse(localStorage.getItem('labelSections') || '{}')
        if (sec && typeof sec === 'object') setLabelSections({ ...defaultLabelSections, ...sec })
      } catch { }
    }, [])

    const paperSizeConfig = labelPaperSizeOptions.find(option => option.value === paperSize) ?? labelPaperSizeOptions[0]
    const paperWidthCss = `${paperSizeConfig.widthMm}mm`
    const paperHeightCss = `${paperSizeConfig.heightMm}mm`
    const paperPrintPadding = paperSize === '70x100' ? '2mm' : '1mm'
    const paperPreviewGap = paperSize === '70x100' ? 12 : 8

    const blankLabelPrintFn = useReactToPrint({
      contentRef: blankLabelRef,
      pageStyle: `@page { size: ${paperWidthCss} ${paperHeightCss}; margin: 0; } @media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } body { margin: 0; padding: 0; } #blank-label-print { box-shadow: none !important; margin: 0 !important; padding: ${paperPrintPadding} !important; page-break-inside: avoid; width: ${paperWidthCss} !important; height: ${paperHeightCss} !important; overflow: hidden !important; box-sizing: border-box !important; } }`,
    });

    const handlelabel = () => {
      setSeparatePage(false);
      list.length > 0 ? onOpen() : "",
        localStorage.setItem("lg", "th"),
        setListS(list)
    };

    const handlelabelSeparate = () => {
      setSeparatePage(true);
      list.length > 0 ? onOpen() : "",
        localStorage.setItem("lg", "th"),
        setListS(list)
    };

    const reactToPrintSeparateFn = useReactToPrint({
      contentRef,
      pageStyle: `@page { size: ${paperWidthCss} ${paperHeightCss}; margin: 0; } @media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } body { margin: 0; padding: 0; } .row { margin: 0; padding: 0; } #selcet-print { box-shadow: none !important; border: none !important; margin: 0 !important; padding: ${paperPrintPadding} !important; page-break-inside: avoid; width: ${paperWidthCss} !important; height: ${paperHeightCss} !important; overflow: hidden !important; box-sizing: border-box !important; } }`,
    });




    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    // เริ่มต้นชื่อบนฉลากจากชื่อลูกค้าจริงทุกครั้งที่เปิดหน้าพิมพ์ฉลาก
    useEffect(() => {
      if (isOpen) setCusNameOverride("");
    }, [isOpen]);

    useEffect(() => {
      // ✅ บอก type ให้ TypeScript ชัดเจน
      const handleKeyDown = (event: globalThis.KeyboardEvent) => {
        const key = event.key.toLowerCase();

        switch (key) {
          case 'f11':
            event.preventDefault();
            if (isOpen) {
              separatePage ? reactToPrintSeparateFn() : reactToPrintFn();
            } else {
              handlelabelSeparate();
            }
            break;

        }
      };

      // ✅ ระบุ type ของ listener ให้ตรง
      window.addEventListener('keydown', handleKeyDown as EventListener);

      return () => {
        window.removeEventListener('keydown', handleKeyDown as EventListener);
      };
    }, [handlelabel, isOpen, reactToPrintFn]);

    const [selectedOption1, setSelectedOption1] = useState('th');  // Initial selected value
    //  const listS=JSON.parse(localStorage.getItem("listS") || "") ===undefined?[]:JSON.parse(localStorage.getItem("listS") || "")

    // เก็บ translations แยกจาก list เพื่อไม่ให้ modal ปิด
    const translationsRef = React.useRef<Record<string, string>>({});
    const [isTranslating, setIsTranslating] = useState(false);






    // Helper function เพื่อดึงข้อความที่แปลแล้วหรือข้อความเดิม
    const getTranslatedText = (item: any, field: string, lang: string) => {
      const langPrefix = lang === 'zh-CN' ? 'zh' : lang;
      // ตรวจสอบจาก item ก่อน
      if (item[`${langPrefix}_${field}`]) return item[`${langPrefix}_${field}`];
      // ตรวจสอบจาก translationsRef
      const key = `${item.id}_${langPrefix}_${field}`;
      if (translationsRef.current[key]) return translationsRef.current[key];
      // ถ้าเป็นภาษาไทยหรือไม่มีการแปล ให้ return ข้อความไทย
      return lang === 'th' ? item[field] : item[field];
    };

    const handleOptionChange2 = (e: any) => {
      const lang = e.target.value;
      localStorage.setItem("lg", lang)
      setSelectedOption1(lang);

      // ถ้าเลือกภาษาอื่นที่ไม่ใช่ไทย ให้ตรวจสอบและแปลอัตโนมัติ
      if (lang !== 'th') {
        const langMap: Record<string, string> = {
          'my': 'my',
          'lo': 'lo',
          'en': 'en',
          'zh-CN': 'zh',
          'ko': 'ko',
          'ja': 'ja',
          'ms': 'ms'
        };
        const targetLang = langMap[lang] || lang;
        const langPrefix = lang === 'zh-CN' ? 'zh' : lang;

        // รวบรวมข้อความทั้งหมดที่ต้องแปล
        const textsToTranslate: string[] = [];
        const textMapping: { itemId: any, field: string, textIndex: number }[] = [];

        listL.forEach((item: any) => {
          const fields = ['indicatorlistS', 'useS', 'timeS', 'timeuseS', 'keepS', 'remarkS'];
          fields.forEach(field => {
            const key = `${item.id}_${langPrefix}_${field}`;
            const existingTranslation = item[`${langPrefix}_${field}`] || translationsRef.current[key];
            // แปลใหม่ถ้า: ยังไม่มีการแปล หรือ ค่าที่แปลเหมือนภาษาไทยเดิม (แปลล้มเหลว)
            const needsTranslation = !existingTranslation || existingTranslation === item[field];
            if (item[field] && needsTranslation) {
              // ลบ cache เก่าที่ล้มเหลว
              delete translationsRef.current[key];
              textMapping.push({ itemId: item.id, field, textIndex: textsToTranslate.length });
              textsToTranslate.push(item[field]);
            }
          });
        });

        if (textsToTranslate.length > 0) {
          // ส่งข้อความทั้งหมดใน request เดียว (batch) เพื่อความเร็ว
          fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: textsToTranslate, targets: [targetLang] }),
          }).then(r => r.json()).then(data => {
            if (data?.batchResults) {
              const newListL = [...listL];
              let hasChanges = false;
              data.batchResults.forEach((result: any) => {
                const mapping = textMapping[result.index];
                if (mapping && result.translatedText) {
                  const itemIndex = newListL.findIndex((item: any) => item.id === mapping.itemId);
                  const originalText = itemIndex !== -1 ? (newListL[itemIndex] as any)[mapping.field] : '';
                  // ไม่ cache ถ้าผลแปลเหมือนภาษาไทยเดิม (แปลล้มเหลว)
                  if (result.translatedText !== originalText) {
                    const key = `${mapping.itemId}_${langPrefix}_${mapping.field}`;
                    translationsRef.current[key] = result.translatedText;
                    if (itemIndex !== -1) {
                      newListL[itemIndex] = {
                        ...newListL[itemIndex],
                        [`${langPrefix}_${mapping.field}`]: result.translatedText
                      };
                      hasChanges = true;
                    }
                  }
                }
              });
              if (hasChanges) {
                setlistL(newListL);
                localStorage.setItem("listS", JSON.stringify(newListL));
              }
            }
          }).catch(err => console.error('Translation error:', err));
        }
      }
    };

    const [showA, setShowA] = useState(false);
    const [showB, setShowB] = useState(false);
    const [showC, setShowC] = useState(false);
    const [showD, setShowD] = useState(false);
    const [showCus, setShowCus] = useState(false);

    const toggleShowA = () => setShowA(!showA);
    const toggleShowB = () => setShowB(!showB);
    const toggleShowC = () => setShowC(!showC);
    const toggleShowD = () => setShowD(!showD);
    const toggleShowCus = () => setShowCus(!showCus);

    // ชื่อลูกค้าที่แก้ไขได้เฉพาะตอนพิมพ์ฉลาก ("" = ใช้ชื่อลูกค้าตามจริง)
    const [cusNameOverride, setCusNameOverride] = useState("");

    const [labelHeight, setLabelHeight] = useState(200)
    const [labelFontSize, setLabelFontSize] = useState(13)
    const [labelHeaderFontSize, setLabelHeaderFontSize] = useState(13)
    const [headerHeight, setHeaderHeight] = useState(60)
    const [contentHeight, setContentHeight] = useState(130)
    const [contentWidth, setContentWidth] = useState(350)

    // Hydrate label customization values from localStorage after mount to avoid SSR hydration mismatch
    useEffect(() => {
      if (typeof window === 'undefined') return
      const readNum = (key: string, fallback: number, min: number, max: number) => {
        const raw = localStorage.getItem(key)
        if (raw === null || raw === '') return fallback
        const n = Number(raw)
        if (!Number.isFinite(n)) return fallback
        return Math.max(min, Math.min(max, n))
      }
      setLabelHeight(readNum("labelHeight", 200, 120, 400))
      setLabelFontSize(readNum("labelFontSize", 13, 8, 22))
      setLabelHeaderFontSize(readNum("labelHeaderFontSize", 13, 8, 22))
      setHeaderHeight(readNum("labelHeaderHeight", 60, 20, 120))
      setContentHeight(readNum("labelContentHeight", 130, 60, 400))
      setContentWidth(readNum("labelContentWidth", 350, 150, 600))
    }, [])

    const adjustHeight = (delta: number) => {
      setLabelHeight(prev => { const v = Math.max(120, Math.min(400, prev + delta)); localStorage.setItem("labelHeight", String(v)); return v })
    }
    const adjustFontSize = (delta: number) => {
      setLabelFontSize(prev => { const v = Math.max(8, Math.min(22, prev + delta)); localStorage.setItem("labelFontSize", String(v)); return v })
    }
    const adjustHeaderFontSize = (delta: number) => {
      setLabelHeaderFontSize(prev => { const v = Math.max(8, Math.min(22, prev + delta)); localStorage.setItem("labelHeaderFontSize", String(v)); return v })
    }
    const adjustHeaderHeight = (delta: number) => {
      setHeaderHeight(prev => { const v = Math.max(20, Math.min(120, prev + delta)); localStorage.setItem("labelHeaderHeight", String(v)); return v })
    }
    const adjustContentHeight = (delta: number) => {
      setContentHeight(prev => { const v = Math.max(60, Math.min(400, prev + delta)); localStorage.setItem("labelContentHeight", String(v)); return v })
    }
    const adjustContentWidth = (delta: number) => {
      setContentWidth(prev => { const v = Math.max(150, Math.min(600, prev + delta)); localStorage.setItem("labelContentWidth", String(v)); return v })
    }

    const getHeaderQrSize = (isTallSeparateLabel: boolean) => {
      const targetSize = isTallSeparateLabel ? 68 : paperSize === '80x60' ? 58 : 54
      const headerFitSize = headerHeight > 0 ? headerHeight - 2 : targetSize
      return Math.max(48, Math.min(targetSize, headerFitSize))
    }

    const renderHeaderQrImage = (isTallSeparateLabel: boolean, extraStyle: React.CSSProperties = {}) => {
      if (lineS !== true || !uploadedUrl1) return null
      const qrSize = getHeaderQrSize(isTallSeparateLabel)
      return (
        <img
          alt=""
          src={String(uploadedUrl1)}
          width={qrSize}
          height={qrSize}
          style={{
            width: qrSize,
            height: qrSize,
            minWidth: qrSize,
            minHeight: qrSize,
            maxWidth: qrSize,
            maxHeight: qrSize,
            boxSizing: 'border-box',
            objectFit: 'contain',
            background: '#fff',
            padding: 1,
            borderRadius: 2,
            flexShrink: 0,
            imageRendering: 'pixelated',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
            ...extraStyle,
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )
    }

    const [num, setNum] = useState(0)
    const [code_pro, setId_pro] = useState("")
    const [id_Name, setName_pro] = useState("")

    const [windiE, setIndiE] = useState("")
    //Indicator   
    const IndiShow = () => {
      const [indiE, wsetIndiE] = useState(windiE)
      const IndiInput = (e: any) => {
        wsetIndiE(e.target.value)
      }
      return (
        <Toast show={showA} onClose={toggleShowA}>
          <Toast.Header>
            <img
              src="holder.js/20x20?text=%20"
              className="rounded me-2"
              alt=""
            />
            <strong className="me-auto" style={{ fontFamily: "Kanit", width: "100%", textAlign: "start", fontSize: 10 }}>แก้ไข ข้อบ่งใช้ == {id_Name}</strong>

          </Toast.Header>
          <Toast.Body>
            <div className="row" style={{ justifyContent: "center" }}>
              <input
                value={indiE}
                onChange={IndiInput}
                className="form-control form-control-sm "
                placeholder=""
                style={{ fontFamily: "Kanit_B", width: "70%", textAlign: "start", fontSize: 14, fontWeight: 600 }}

              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  const langPrefix = selectedOption1 === 'th' ? '' : selectedOption1 === 'zh-CN' ? 'zh_' : selectedOption1 + '_';
                  const fieldName = langPrefix ? `${langPrefix}indicatorlistS` : 'indicatorlistS';
                  setlistL(listL.map((task: any) => task.code_product === code_pro ?
                    { ...task, [fieldName]: String(indiE) } : task
                  )), setShowA(!showA)
                }}
                style={{ fontFamily: "Kanit", width: "20%", textAlign: "center", fontSize: 12, marginLeft: 5 }}>
                ตกลง
              </button>
            </div>

          </Toast.Body>
        </Toast>
      )
    }

    const [wcusE, setcusE] = useState("")
    //Customer name (แก้ไขชื่อลูกค้าบนฉลากตอนพิมพ์)
    const CusShow = () => {
      const [cusE, wsetcusE] = useState(wcusE)
      const CusInput = (e: any) => {
        wsetcusE(e.target.value)
      }
      return (
        <Toast show={showCus} onClose={toggleShowCus}>
          <Toast.Header>
            <img
              src="holder.js/20x20?text=%20"
              className="rounded me-2"
              alt=""
            />
            <strong className="me-auto" style={{ fontFamily: "Kanit", width: "100%", textAlign: "start", fontSize: 10 }}>แก้ไข ชื่อลูกค้า</strong>
          </Toast.Header>
          <Toast.Body>
            <div className="row" style={{ justifyContent: "center" }}>
              <input
                value={cusE}
                onChange={CusInput}
                list="label-member-list"
                className="form-control form-control-sm "
                placeholder="พิมพ์ หรือเลือกชื่อสมาชิก..."
                style={{ fontFamily: "Kanit_B", width: "70%", textAlign: "start", fontSize: 14, fontWeight: 600 }}
              />
              <datalist id="label-member-list">
                {(searchname as any[])
                  .filter((c: any) => String(c?.names || '').trim() !== '')
                  .map((c: any, i: number) => (
                    <option key={`${c.code || ''}-${i}`} value={String(c.names)}>
                      {c.code ? `${c.code} · ` : ''}{c.tel || ''}
                    </option>
                  ))}
              </datalist>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => { setCusNameOverride(String(cusE)); setShowCus(false); }}
                style={{ fontFamily: "Kanit", width: "20%", textAlign: "center", fontSize: 12, marginLeft: 5 }}>
                ตกลง
              </button>
            </div>
          </Toast.Body>
        </Toast>
      )
    }

    const [wuseE, setuseE] = useState("")
    //Use
    const UseShow = () => {
      const [useE, wsetuseE] = useState(wuseE)
      const useInput = (e: any) => {
        wsetuseE(e.target.value)
      }
      return (
        <Toast show={showB} onClose={toggleShowB}>
          <Toast.Header>
            <img
              src="holder.js/20x20?text=%20"
              className="rounded me-2"
              alt=""
            />
            <strong className="me-auto" style={{ fontFamily: "Kanit", width: "100%", textAlign: "start", fontSize: 10 }}>แก้ไข วิธีและช่วงเวลา == {id_Name}</strong>

          </Toast.Header>
          <Toast.Body>
            <div className="row" style={{ justifyContent: "center" }}>
              <input
                value={useE}
                onChange={useInput}
                className="form-control form-control-sm "
                placeholder=""
                style={{ fontFamily: "Kanit_B", width: "70%", textAlign: "start", fontSize: 14, fontWeight: 600 }}

              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  const langPrefix = selectedOption1 === 'th' ? '' : selectedOption1 === 'zh-CN' ? 'zh_' : selectedOption1 + '_';
                  const useField = langPrefix ? `${langPrefix}useS` : 'useS';
                  const timeuseField = langPrefix ? `${langPrefix}timeuseS` : 'timeuseS';
                  setlistL(listL.map((task: any) => task.code_product === code_pro ?
                    { ...task, [useField]: String(useE), [timeuseField]: String(""), childWeight: 0 } : task
                  )), setShowB(!showB)
                }}
                style={{ fontFamily: "Kanit", width: "20%", textAlign: "center", fontSize: 12, marginLeft: 5 }}>
                ตกลง
              </button>
            </div>

          </Toast.Body>
        </Toast>
      )
    }

    const [wtimeE, settimeE] = useState("")
    //timeS      
    const TimeShow = () => {
      const [timeE, wsettimeE] = useState(wtimeE)
      const timeInput = (e: any) => {
        wsettimeE(e.target.value)
      }


      return (
        <Toast show={showC} onClose={toggleShowC}>
          <Toast.Header>
            <img
              src="holder.js/20x20?text=%20"
              className="rounded me-2"
              alt=""
            />
            <strong className="me-auto" style={{ fontFamily: "Kanit", width: "100%", textAlign: "start", fontSize: 10 }}>แก้ไข ช่วงเวลาและวิธีเก็บ == {id_Name}</strong>

          </Toast.Header>
          <Toast.Body>
            <div className="row" style={{ justifyContent: "center" }}>
              <input
                value={timeE}
                onChange={timeInput}
                className="form-control form-control-sm "
                placeholder=""
                style={{ fontFamily: "Kanit_B", width: "70%", textAlign: "start", fontSize: 14, fontWeight: 600 }}

              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  const langPrefix = selectedOption1 === 'th' ? '' : selectedOption1 === 'zh-CN' ? 'zh_' : selectedOption1 + '_';
                  const timeField = langPrefix ? `${langPrefix}timeS` : 'timeS';
                  const keepField = langPrefix ? `${langPrefix}keepS` : 'keepS';
                  setlistL(listL.map((task: any) => task.code_product === code_pro ?
                    { ...task, [timeField]: String(timeE), [keepField]: String("") } : task
                  )), setShowC(!showC)
                }}
                style={{ fontFamily: "Kanit", width: "20%", textAlign: "center", fontSize: 12, marginLeft: 5 }}>
                ตกลง
              </button>
            </div>

          </Toast.Body>
        </Toast>
      )
    }

    const [remarkE, setremarkE] = useState("")

    const [showE, setShowE] = useState(false)
    const toggleShowE = () => setShowE(!showE)
    const [expiryE, setExpiryE] = useState("")
    const [showExpiry, setShowExpiry] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem("labelShowExpiry") === 'true') : false)

    //ExpiryS
    const ExpiryShow = () => {
      const [wexpiryE, wsetExpiryE] = useState(expiryE)
      const expiryInput = (e: any) => {
        wsetExpiryE(e.target.value)
      }
      return (
        <Toast show={showE} onClose={toggleShowE}>
          <Toast.Header>
            <img
              src="holder.js/20x20?text=%20"
              className="rounded me-2"
              alt=""
            />
            <strong className="me-auto" style={{ fontFamily: "Kanit", width: "100%", textAlign: "start", fontSize: 10 }}>แก้ไข หมดอายุ == {id_Name}</strong>

          </Toast.Header>
          <Toast.Body>
            <div className="row" style={{ justifyContent: "center" }}>
              <input
                value={wexpiryE}
                onChange={expiryInput}
                className="form-control form-control-sm "
                placeholder="dd/mm/yyyy"
                style={{ fontFamily: "Kanit_B", width: "70%", textAlign: "start", fontSize: 14, fontWeight: 600 }}

              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setlistL(listL.map((task: any) => task.code_product === code_pro ?
                    { ...task, expiryDate: String(wexpiryE) } : task
                  )), setShowE(!showE)
                }}
                style={{ fontFamily: "Kanit", width: "20%", textAlign: "center", fontSize: 12, marginLeft: 5 }}>
                ตกลง
              </button>
            </div>

          </Toast.Body>
        </Toast>
      )
    }

    //RemarkS   
    const RemarkShow = () => {
      const [wremarkE, wsetremarkE] = useState(remarkE)
      const remarkInput = (e: any) => {
        wsetremarkE(e.target.value)
      }
      return (
        <Toast show={showD} onClose={toggleShowD}>
          <Toast.Header>
            <img
              src="holder.js/20x20?text=%20"
              className="rounded me-2"
              alt=""
            />
            <strong className="me-auto" style={{ fontFamily: "Kanit", width: "100%", textAlign: "start", fontSize: 10 }}>แก้ไข หมายเหตุ == {id_Name}</strong>

          </Toast.Header>
          <Toast.Body>
            <div className="row" style={{ justifyContent: "center" }}>
              <input
                value={wremarkE}
                onChange={remarkInput}
                className="form-control form-control-sm "
                placeholder=""
                style={{ fontFamily: "Kanit_B", width: "70%", textAlign: "start", fontSize: 14, fontWeight: 600 }}

              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  const langPrefix = selectedOption1 === 'th' ? '' : selectedOption1 === 'zh-CN' ? 'zh_' : selectedOption1 + '_';
                  const remarkField = langPrefix ? `${langPrefix}remarkS` : 'remarkS';
                  setlistL(listL.map((task: any) => task.code_product === code_pro ?
                    { ...task, [remarkField]: String(wremarkE) } : task
                  )), setShowD(!showD)
                }}
                style={{ fontFamily: "Kanit", width: "20%", textAlign: "center", fontSize: 12, marginLeft: 5 }}>
                ตกลง
              </button>
            </div>

          </Toast.Body>
        </Toast>
      )
    }


    // ซ่อนปุ่มแล้ว wrapper ต้องไม่กินช่องใน flex column ของ checkoutRail (gap 9px)
    return (
      <div className={styles.labelPrintActionWrapper} style={SHOW_LABEL_PRINT_BUTTON ? undefined : { display: 'contents' }}>
        {SHOW_LABEL_PRINT_BUTTON && (
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            disabled={list.length < 1 ? true : false}
            className={`${styles.checkoutActionButton} ${styles.labelPrintButton}`}
            title="พิมพ์ฉลากสินค้า (F11)"
            onClick={handlelabelSeparate}>
            <span className={styles.checkoutActionIcon}>
              <Printer size={20} strokeWidth={2.3} />
            </span>
            <span className={styles.checkoutActionText}>ฉลากสินค้า</span>
            <span className={styles.checkoutShortcut}>F11</span>
          </button>
        </div>
        )}



        <Modal isOpen={isOpen} onOpenChange={onOpenChange} scrollBehavior={"inside"} size="full" >
          <ModalContent className=" shadow-sm rounded rounded-2 border border" style={{ backgroundColor: "rgba(255, 255, 255, 1)", width: "100vw", height: "100vh", maxHeight: "100vh", display: "flex", flexDirection: "column", overflowY: "auto", overflowX: "hidden" }}>

            {(onClose) => (
              <>
                <ModalHeader style={{ minHeight: separatePage ? 155 : 125, backgroundColor: "rgba(241, 241, 241, 1)", flexShrink: 0 }}>
                  <div style={{ width: "100%" }}>
                    {/* Row 0: Mode indicator + Paper size (separate page only) */}
                    {separatePage && (
                      <div className="d-flex align-items-center" style={{ width: "100%", marginBottom: 6, gap: 10 }}>
                        <span style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#7c3aed', background: '#f3e8ff', borderRadius: 6, padding: '2px 8px', border: '1px solid #c4b5fd' }}>
                          🖨️ โหมดแยกหน้า
                        </span>
                        <div className="d-flex align-items-center" style={{ gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#555' }}>ขนาดกระดาษ:</span>
                          {labelPaperSizeOptions.map(option => (
                            <button
                              key={option.value}
                              onClick={() => selectPaperSize(option.value)}
                              style={{
                                fontFamily: 'Kanit', fontSize: 11, padding: '3px 10px', borderRadius: 7, cursor: 'pointer',
                                minWidth: 78,
                                border: paperSize === option.value ? '2px solid #7c3aed' : '1px solid #d1d5db',
                                background: paperSize === option.value ? '#f3e8ff' : '#fff',
                                color: paperSize === option.value ? '#7c3aed' : '#666',
                                fontWeight: paperSize === option.value ? 700 : 400,
                              }}
                            >{option.label}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Row 0.5: Label style selection */}
                    <div className="d-flex align-items-center" style={{ width: "100%", marginBottom: 6, gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#555', whiteSpace: 'nowrap' }}>รูปแบบฉลาก:</span>
                      {([
                        { value: 'current' as const, label: '📋 แบบที่ 1', color: '#6b7280', bg: '#f3f4f6' },
                        { value: 'wow' as const, label: '✨ แบบที่ 2', color: '#ec4899', bg: '#fdf2f8' },
                        { value: 'pro' as const, label: '🏥 แบบที่ 3', color: '#0891b2', bg: '#ecfeff' },
                        { value: 'elegant' as const, label: '🌸 แบบที่ 4', color: '#d97706', bg: '#fffbeb' },
                        { value: 'minimal' as const, label: '💎 แบบที่ 5', color: '#7c3aed', bg: '#f5f3ff' },
                      ]).map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setLabelStyle(opt.value); localStorage.setItem("labelStyle", opt.value) }}
                          style={{
                            fontFamily: 'Kanit', fontSize: 11, padding: '2px 10px', borderRadius: 20, cursor: 'pointer',
                            border: labelStyle === opt.value ? `2px solid ${opt.color}` : '1px solid #d1d5db',
                            background: labelStyle === opt.value ? opt.bg : '#fff',
                            color: labelStyle === opt.value ? opt.color : '#888',
                            fontWeight: labelStyle === opt.value ? 700 : 400,
                            transition: 'all 0.15s ease',
                          }}
                        >{opt.label}</button>
                      ))}
                      {/* ปุ่มฉลากยาเปล่า */}
                      <button
                        onClick={() => blankLabelModal.onOpen()}
                        style={{
                          fontFamily: 'Kanit', fontSize: 11, padding: '2px 10px', borderRadius: 20, cursor: 'pointer',
                          border: '2px solid #0d9488', background: '#f0fdfa', color: '#0d9488', fontWeight: 700,
                          transition: 'all 0.15s ease', marginLeft: 4,
                        }}
                      >📝 ฉลากสินค้าเปล่า</button>
                      {/* ปุ่มสร้างตัวช่วยฉลากยา */}
                      <button
                        onClick={() => labelHelperModal.onOpen()}
                        style={{
                          fontFamily: 'Kanit', fontSize: 11, padding: '2px 10px', borderRadius: 20, cursor: 'pointer',
                          border: '2px solid #4f46e5', background: '#eef2ff', color: '#4f46e5', fontWeight: 700,
                          transition: 'all 0.15s ease', marginLeft: 4,
                        }}
                      >🧩 สร้างตัวช่วยฉลากสินค้า</button>
                    </div>
                    {/* Row 0.7: เปิด/ปิดหัวข้อในฉลาก */}
                    <div className="d-flex align-items-center" style={{ width: "100%", marginBottom: 6, gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#555', whiteSpace: 'nowrap' }}>หัวข้อในฉลาก:</span>
                      {labelSectionOptions.map(opt => {
                        const on = labelSections[opt.key];
                        return (
                          <button
                            key={opt.key}
                            onClick={() => toggleLabelSection(opt.key)}
                            title={on ? `ซ่อน "${opt.label}" บนฉลาก` : `แสดง "${opt.label}" บนฉลาก`}
                            style={{
                              fontFamily: 'Kanit', fontSize: 10.5, padding: '2px 9px', borderRadius: 20, cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', gap: 4, lineHeight: 1.4,
                              border: on ? '1.5px solid #2A6AAA' : '1.5px dashed #cbd5e1',
                              background: on ? '#F3F8FC' : '#f8fafc',
                              color: on ? '#1E5088' : '#94a3b8',
                              fontWeight: on ? 600 : 400,
                              textDecoration: on ? 'none' : 'line-through',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {on ? <Eye size={11} strokeWidth={2.2} /> : <EyeOff size={11} strokeWidth={2.2} />}
                            {opt.label}
                          </button>
                        );
                      })}
                      {hiddenSectionCount > 0 && (
                        <button
                          onClick={resetLabelSections}
                          title="กลับมาแสดงทุกหัวข้อ"
                          style={{
                            fontFamily: 'Kanit', fontSize: 10.5, padding: '2px 9px', borderRadius: 20, cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 4, lineHeight: 1.4,
                            border: '1.5px solid #6366f1', background: '#eef2ff', color: '#4f46e5', fontWeight: 600,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <RotateCcw size={11} strokeWidth={2.2} /> แสดงทั้งหมด ({hiddenSectionCount} ถูกซ่อน)
                        </button>
                      )}
                    </div>
                    {/* Row 1: Adjustment controls - ชิดขวา */}
                    <div className="d-flex align-items-center" style={{ width: "100%", justifyContent: 'flex-end', gap: 6 }}>

                      {/* ตัวช่วยฉลากยา: เปิดใช้ + เลือกแม่แบบ (แนบต่อท้ายฉลาก) */}
                      <div className="d-flex align-items-center" style={{ background: showHelper ? '#eef2ff' : '#fff', borderRadius: 6, border: showHelper ? '1px solid #c7d2fe' : '1px solid #d1d5db', padding: '1px 6px', gap: 6, marginRight: 'auto' }} title="แนบข้อความตัวช่วยฉลากสินค้าต่อท้ายฉลากแต่ละดวง">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', margin: 0 }}>
                          <input type="checkbox" checked={showHelper} onChange={(e) => setShowHelper(e.target.checked)} style={{ accentColor: '#4f46e5', cursor: 'pointer' }} />
                          <span style={{ fontFamily: 'Kanit', fontSize: 10, color: showHelper ? '#4f46e5' : '#6b7280', whiteSpace: 'nowrap' }}>🧩 ตัวช่วยฉลากสินค้า</span>
                        </label>
                        <select
                          value={selectedHelperId ?? ''}
                          onChange={(e) => setSelectedHelperId(e.target.value ? Number(e.target.value) : null)}
                          style={{ fontFamily: 'Kanit', fontSize: 10, border: '1px solid #e2e8f0', borderRadius: 4, padding: '1px 4px', maxWidth: 150, color: '#374151', background: '#fff', cursor: 'pointer' }}
                        >
                          <option value="">— เลือกตัวช่วย —</option>
                          {helperList.map((h: any) => (
                            <option key={h.id} value={h.id}>{(h.name || '(ไม่มีชื่อ)') + (h.isDefault ? ' ★' : '')}</option>
                          ))}
                        </select>
                      </div>

                      {/* ปรับความสูงหัวฉลาก */}
                      <div className="d-flex align-items-center" style={{ background: '#fff', borderRadius: 6, border: '1px solid #d1d5db', padding: '1px 4px', gap: 2 }} title="ปรับความสูงหัวฉลาก">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="#6b7280" viewBox="0 0 16 16">
                          <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm6 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                        </svg>
                        <button onClick={() => adjustHeaderHeight(-1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 3px', fontSize: 14, fontWeight: 700, color: '#6b7280', lineHeight: 1 }}>−</button>
                        <span style={{ fontFamily: 'Kanit', fontSize: 10, color: '#6b7280', minWidth: 20, textAlign: 'center' }}>{headerHeight}</span>
                        <button onClick={() => adjustHeaderHeight(1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 3px', fontSize: 14, fontWeight: 700, color: '#6b7280', lineHeight: 1 }}>+</button>
                      </div>
                      
                      {/* ปรับขนาดตัวหนังสือหัวฉลาก */}
                      <div className="d-flex align-items-center" style={{ background: '#fff', borderRadius: 6, border: '1px solid #d1d5db', padding: '1px 4px', gap: 2 }} title="ปรับขนาดตัวหนังสือหัวฉลาก (ร้าน/ที่อยู่)">
                        <span style={{ fontFamily: 'Kanit_B', fontSize: 9, color: '#6b7280', padding: '0 2px' }}>H</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="#6b7280" viewBox="0 0 16 16">
                          <path d="M12.258 3h-8.51l-.083 2.46h.479c.26-1.544.758-1.783 2.693-1.845l.424-.013v7.827c0 .663-.144.82-1.3.923v.52h4.082v-.52c-1.162-.103-1.306-.26-1.306-.923V3.602l.431.013c1.934.062 2.434.301 2.693 1.846h.479z"/>
                        </svg>
                        <button onClick={() => adjustHeaderFontSize(-1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 3px', fontSize: 14, fontWeight: 700, color: '#6b7280', lineHeight: 1 }}>−</button>
                        <span style={{ fontFamily: 'Kanit', fontSize: 10, color: '#6b7280', minWidth: 16, textAlign: 'center' }}>{labelHeaderFontSize}</span>
                        <button onClick={() => adjustHeaderFontSize(1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 3px', fontSize: 14, fontWeight: 700, color: '#6b7280', lineHeight: 1 }}>+</button>
                      </div>
                      {/* ปรับขนาดตัวหนังสือข้อมูลฉลาก */}
                      <div className="d-flex align-items-center" style={{ background: '#fff', borderRadius: 6, border: '1px solid #d1d5db', padding: '1px 4px', gap: 2 }} title="ปรับขนาดตัวหนังสือข้อมูลฉลาก (สินค้า/วิธีใช้)">
                        <span style={{ fontFamily: 'Kanit_B', fontSize: 9, color: '#6b7280', padding: '0 2px' }}>C</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="#6b7280" viewBox="0 0 16 16">
                          <path d="M12.258 3h-8.51l-.083 2.46h.479c.26-1.544.758-1.783 2.693-1.845l.424-.013v7.827c0 .663-.144.82-1.3.923v.52h4.082v-.52c-1.162-.103-1.306-.26-1.306-.923V3.602l.431.013c1.934.062 2.434.301 2.693 1.846h.479z"/>
                        </svg>
                        <button onClick={() => adjustFontSize(-1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 3px', fontSize: 14, fontWeight: 700, color: '#6b7280', lineHeight: 1 }}>−</button>
                        <span style={{ fontFamily: 'Kanit', fontSize: 10, color: '#6b7280', minWidth: 16, textAlign: 'center' }}>{labelFontSize}</span>
                        <button onClick={() => adjustFontSize(1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 3px', fontSize: 14, fontWeight: 700, color: '#6b7280', lineHeight: 1 }}>+</button>
                      </div>
                      {/* แสดงหมดอายุ */}
                      <label className="d-flex align-items-center" style={{ background: showExpiry ? '#E5EEF8' : '#fff', borderRadius: 6, border: showExpiry ? '1px solid #A6C8E7' : '1px solid #d1d5db', padding: '1px 8px', gap: 4, cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }} title="แสดงวันหมดอายุบนฉลาก">
                        <input type="checkbox" checked={showExpiry} onChange={(e) => { setShowExpiry(e.target.checked); localStorage.setItem("labelShowExpiry", String(e.target.checked)) }} style={{ cursor: 'pointer', accentColor: '#3E86C7' }} />
                        <span style={{ fontFamily: 'Kanit', fontSize: 10, color: showExpiry ? '#2A6AAA' : '#6b7280' }}>หมดอายุ</span>
                      </label>
                      {/* ตั้งค่าเภสัชกร */}
                      <button
                        className="btn btn-primary"
                        onClick={modalPS.onOpen}
                        title="ตั้งค่าเภสัชกร"
                        style={{ fontSize: 13, height: 28, width: 28, padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/>
                          <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"/>
                        </svg>
                      </button>
                    </div>

                    {/* Row 2: Language selection */}
                    <div className="d-flex align-items-center" style={{ width: "100%", fontSize: 14, fontFamily: "Kanit_B", marginTop: 8 }}>
                      <div style={{ whiteSpace: 'nowrap' }}>เลือกภาษา :</div>
                      <label style={{ fontFamily: "Kanit", fontSize: 15, width: 70 }}>
                        <input type="radio" name="th" value="th" checked={selectedOption1 === 'th'} onChange={handleOptionChange2} style={{ marginRight: 10, fontFamily: "Kanit" }} />
                        ไทย
                      </label>
                      <label style={{ fontFamily: "Kanit", fontSize: 15, width: 70 }}>
                        <input type="radio" name="my" value="my" checked={selectedOption1 === 'my'} onChange={handleOptionChange2} style={{ marginRight: 10, fontFamily: "Kanit" }} />
                        พม่า
                      </label>
                      <label style={{ fontFamily: "Kanit", fontSize: 15 }}>
                        <input type="radio" name="lo" value="lo" checked={selectedOption1 === 'lo'} onChange={handleOptionChange2} style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }} />
                        ลาว
                      </label>
                      <label style={{ fontFamily: "Kanit", fontSize: 15 }}>
                        <input type="radio" name="en" value="en" checked={selectedOption1 === 'en'} onChange={handleOptionChange2} style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }} />
                        อังกฤษ
                      </label>
                      <label style={{ fontFamily: "Kanit", fontSize: 15 }}>
                        <input type="radio" name="zh-CN" value="zh-CN" checked={selectedOption1 === 'zh-CN'} onChange={handleOptionChange2} style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }} />
                        จีน
                      </label>
                      <label style={{ fontFamily: "Kanit", fontSize: 15 }}>
                        <input type="radio" name="ru" value="ru" checked={selectedOption1 === 'ru'} onChange={handleOptionChange2} style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }} />
                        รัสเซีย
                      </label>
                      <label style={{ fontFamily: "Kanit", fontSize: 15 }}>
                        <input type="radio" name="km" value="km" checked={selectedOption1 === 'km'} onChange={handleOptionChange2} style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }} />
                        กัมพูชา
                      </label>
                      <label style={{ fontFamily: "Kanit", fontSize: 15 }}>
                        <input type="radio" name="ko" value="ko" checked={selectedOption1 === 'ko'} onChange={handleOptionChange2} style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }} />
                        เกาหลี
                      </label>
                      <label style={{ fontFamily: "Kanit", fontSize: 15 }}>
                        <input type="radio" name="ja" value="ja" checked={selectedOption1 === 'ja'} onChange={handleOptionChange2} style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }} />
                        ญี่ปุ่น
                      </label>
                      <label style={{ fontFamily: "Kanit", fontSize: 15 }}>
                        <input type="radio" name="ms" value="ms" checked={selectedOption1 === 'ms'} onChange={handleOptionChange2} style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }} />
                        บาฮาซา
                      </label>
                      {/* Reload translation button */}
                      {isTranslating && <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>}
                      {selectedOption1 !== 'th' && (
                        <button
                          title="โหลดภาษาใหม่"
                          disabled={isTranslating}
                          onClick={async () => {
                            if (isTranslating) return;
                            setIsTranslating(true);
                            const lang = selectedOption1;
                            const langPrefix = lang === 'zh-CN' ? 'zh' : lang;
                            const targetLang = lang === 'zh-CN' ? 'zh' : lang;
                            // ลบ cache การแปลของภาษาที่เลือกอยู่
                            Object.keys(translationsRef.current).forEach(key => {
                              if (key.includes(`_${langPrefix}_`)) {
                                delete translationsRef.current[key];
                              }
                            });
                            // ลบค่าแปลใน listL เพื่อให้แปลใหม่
                            const clearedListL = listL.map((item: any) => {
                              const copy = { ...item };
                              ['indicatorlistS', 'useS', 'timeS', 'timeuseS', 'keepS', 'remarkS'].forEach(field => {
                                delete copy[`${langPrefix}_${field}`];
                              });
                              return copy;
                            });
                            // แปลใหม่โดยตรง (ไม่ใช้ setTimeout) + deduplicate ข้อความซ้ำ
                            const fields = ['indicatorlistS', 'useS', 'timeS', 'timeuseS', 'keepS', 'remarkS'];
                            const uniqueTexts = new Map<string, number>(); // text -> index in textsToTranslate
                            const textsToTranslate: string[] = [];
                            const textMapping: { itemId: any, field: string, uniqueKey: string }[] = [];
                            clearedListL.forEach((item: any) => {
                              fields.forEach(field => {
                                if (item[field]) {
                                  const txt = item[field];
                                  if (!uniqueTexts.has(txt)) {
                                    uniqueTexts.set(txt, textsToTranslate.length);
                                    textsToTranslate.push(txt);
                                  }
                                  textMapping.push({ itemId: item.id, field, uniqueKey: txt });
                                }
                              });
                            });
                            if (textsToTranslate.length > 0) {
                              try {
                                const r = await fetch('/api/translate', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ texts: textsToTranslate, targets: [targetLang] }),
                                });
                                const data = await r.json();
                                if (data?.batchResults) {
                                  const translatedMap = new Map<number, string>();
                                  data.batchResults.forEach((res: any) => {
                                    if (res.translatedText) translatedMap.set(res.index, res.translatedText);
                                  });
                                  const newListL = [...clearedListL];
                                  textMapping.forEach(m => {
                                    const idx = uniqueTexts.get(m.uniqueKey);
                                    const translated = idx !== undefined ? translatedMap.get(idx) : undefined;
                                    const originalText = m.uniqueKey; // ข้อความไทยเดิม
                                    // ไม่ cache ถ้าผลแปลเหมือนภาษาไทยเดิม (แปลล้มเหลว)
                                    if (translated && translated !== originalText) {
                                      const key = `${m.itemId}_${langPrefix}_${m.field}`;
                                      translationsRef.current[key] = translated;
                                      const itemIdx = newListL.findIndex((item: any) => item.id === m.itemId);
                                      if (itemIdx !== -1) {
                                        newListL[itemIdx] = { ...newListL[itemIdx], [`${langPrefix}_${m.field}`]: translated };
                                      }
                                    }
                                  });
                                  setlistL(newListL);
                                  localStorage.setItem("listS", JSON.stringify(newListL));
                                }
                              } catch (err) { console.error('Reload translation error:', err); }
                            } else {
                              setlistL(clearedListL);
                              localStorage.setItem("listS", JSON.stringify(clearedListL));
                            }
                            setIsTranslating(false);
                          }}
                          style={{
                            marginLeft: 12, border: 'none', background: 'transparent', cursor: 'pointer',
                            padding: '2px 4px', borderRadius: 4, display: 'flex', alignItems: 'center',
                            opacity: isTranslating ? 0.5 : 1,
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#0d6efd" viewBox="0 0 16 16"
                            style={{ animation: isTranslating ? 'spin 1s linear infinite' : 'none' }}>
                            <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
                            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
                          </svg>
                        </button>
                      )}
                    </div>

                  </div>
                </ModalHeader>
                <ModalBody style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                  {/* เลือกฉลากที่จะพิมพ์ — panel นี้อยู่นอก contentRef จึงไม่ถูกพิมพ์ */}
                  <div style={{ padding: '6px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#555', whiteSpace: 'nowrap' }}>เลือกพิมพ์:</span>
                    {listL.map((item: any, idx: number) => (
                      <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', background: item.label ? '#D3F0E2' : '#fee2e2', borderRadius: 16, padding: '2px 10px', border: item.label ? '1px solid #74CCA4' : '1px solid #fca5a5', userSelect: 'none' }}>
                        <input
                          type="checkbox"
                          checked={!!item.label}
                          onChange={() => setlistL(listL.map((i: any, j: number) => j === idx ? { ...i, label: !i.label } : i))}
                          style={{ cursor: 'pointer', accentColor: '#3E86C7' }}
                        />
                        <span style={{ fontFamily: 'Kanit', fontSize: 11, color: item.label ? '#0F6845' : '#b91c1c', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name_product || item.fixname || `รายการ ${idx + 1}`}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="col">
                    <div className="col" style={{ textAlign: "center" }}>
                      <Table className="table" size="sm"  >
                        <tbody className="table-group-divider">
                          <tr className="">
                            <th scope="row" className={styles.bodydetailTable_Re1} style={{ width: "15%" }}>

                              <div className='row mt-1' style={{ justifyContent: "center" }} ref={contentRef}>

                                {(() => { const filtered = listL.filter((q: any) => q.label === true); return filtered.map((a: any, idx: number) => {
                                  /* === Helper: get text by language === */
                                  const gt = (field: string) => {
                                    const lp = selectedOption1 === 'zh-CN' ? 'zh' : selectedOption1;
                                    if (selectedOption1 === 'th') return a[field] || '';
                                    return a[`${lp}_${field}`] || a[field] || '';
                                  };
                                  const gtUseTime = () => {
                                    if (a.childWeight > 0) {
                                      const map: Record<string, string> = {
                                        'th': `ครั้งละ ${a.childDoseMl} ml  วันละ ${a.childFrequency} ครั้ง`,
                                        'my': `တစ်ကြိမ် ${a.childDoseMl} ml  တစ်နေ့ ${a.childFrequency} ကြိမ်`,
                                        'lo': `ຄັ້ງລະ ${a.childDoseMl} ml  ມື້ລະ ${a.childFrequency} ຄັ້ງ`,
                                        'en': `${a.childDoseMl} ml  ${a.childFrequency} times/day`,
                                        'zh-CN': `每次 ${a.childDoseMl} ml  每天 ${a.childFrequency} 次`,
                                        'ru': `по ${a.childDoseMl} мл  ${a.childFrequency} раз/день`,
                                        'km': `ម្តង់ៗ ${a.childDoseMl} ml  ថ្ងៃលៈ ${a.childFrequency} ដង`,
                                        'ko': `1회 ${a.childDoseMl} ml  하루 ${a.childFrequency}회`,
                                        'ja': `1回 ${a.childDoseMl} ml  1日 ${a.childFrequency}回`,
                                        'ms': `${a.childDoseMl} ml  ${a.childFrequency} kali/hari`,
                                      };
                                      return (map[selectedOption1] || map['en']) + '  ' + gt('timeuseS');
                                    }
                                    return gt('useS') + '  ' + gt('timeuseS');
                                  };
                                  const gtTimeKeep = () => gt('timeS') + '  ' + gt('keepS');
                                  const dateStr = new Date().toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                  const cusBaseName = name_cus === "" ? "ลูกค้าทั่วไป" : name_cus;
                                  const cusName = cusNameOverride.trim() !== "" ? cusNameOverride : cusBaseName;
                                  const openCusEdit = () => { setNum(6); setcusE(cusNameOverride.trim() !== "" ? cusNameOverride : (name_cus === "" ? "" : name_cus)); setShowCus(true); };
                                  const isTallSeparateLabel = separatePage && paperSize === '70x100';

                                  const labelOuterStyle = {
                                    ...(separatePage
                                      ? { height: paperHeightCss, width: paperWidthCss, pageBreakAfter: 'always' as const, pageBreakInside: 'avoid' as const, margin: `0 ${paperPreviewGap}px ${paperPreviewGap}px 0`, overflow: 'hidden', padding: paperSize === '70x100' ? '1.5mm' : '0mm', boxSizing: 'border-box' as const }
                                      : { minHeight: labelHeight, width: contentWidth + 80, margin: '0 0 6px 0', boxSizing: 'border-box' as const }),
                                    backgroundColor: "white",
                                  };

                                  /* ===================== WOW STYLE (thermal-friendly) ===================== */
                                  if (labelStyle === 'wow') return (
                                    <div key={`${a.id}-${idx}`} id="selcet-print" style={{ ...labelOuterStyle, borderRadius: 8, border: '2.5px solid #000', overflow: 'hidden', fontFamily: 'Kanit', display: isTallSeparateLabel ? 'flex' : undefined, flexDirection: isTallSeparateLabel ? 'column' : undefined }}>
                                      {/* Header - always render wrapper with headerHeight, content conditional on allS */}
                                      <div style={{ height: headerHeight, overflow: 'hidden', flexShrink: 0 }}>
                                        {allS === false ? (
                                          <div style={{ background: '#000', padding: '1px 8px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 8, height: '100%', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}>
                                            {logoS === true && uploadedUrl ? <img alt="" src={String(uploadedUrl)} width={38} height={34} style={{ borderRadius: 4, background: '#fff', padding: 2 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} /> : null}
                                            <div style={{ flex: 1 }}>
                                              <div style={{ fontFamily: 'Kanit_B', fontSize: labelHeaderFontSize + 1, color: '#fff', lineHeight: 1.2 }}>{storeS}</div>
                                              <div style={{ fontSize: labelHeaderFontSize - 5, color: '#fff', lineHeight: 1.2 }}>{addressS} โทร: {telS}</div>
                                            </div>
                                            {renderHeaderQrImage(isTallSeparateLabel, { borderRadius: 4 })}
                                          </div>
                                        ) : ""}
                                      </div>
                                      {allS === false ? <div style={{ borderBottom: '1.5px solid #000' }}></div> : ""}
                                      {/* Customer + Date bar */}
                                      {(labelSections.customer || labelSections.date) && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: isTallSeparateLabel ? '1.2mm 3mm' : '1px 10px', borderBottom: '1.5px solid #000', fontSize: isTallSeparateLabel ? labelFontSize - 3 : labelFontSize - 3, color: '#000', flexShrink: 0 }}>
                                          {labelSections.customer ? <span onClick={openCusEdit} title="คลิกเพื่อแก้ไขชื่อลูกค้า" style={{ fontFamily: 'Kanit_B', cursor: 'pointer' }}>{cusName}</span> : <span />}
                                          {labelSections.date ? <span>{dateStr}</span> : <span />}
                                        </div>
                                      )}
                                      {/* Body */}
                                      <div style={{ padding: isTallSeparateLabel ? '3mm 3.2mm 2.8mm' : '2px 10px 3px', width: '100%', flex: isTallSeparateLabel ? 1 : undefined, display: isTallSeparateLabel ? 'flex' : undefined, flexDirection: isTallSeparateLabel ? 'column' : undefined, gap: isTallSeparateLabel ? '1.8mm' : undefined, minHeight: isTallSeparateLabel ? 0 : undefined }}>
                                        {labelSections.productName && (
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #000', paddingBottom: 1, marginBottom: 1 }}>
                                            <div style={{ fontSize: isTallSeparateLabel ? labelFontSize - 1 : labelFontSize, fontFamily: 'Kanit_B', color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, maxWidth: contentWidth }}>{a.name_product}</div>
                                            <div style={{ fontSize: isTallSeparateLabel ? labelFontSize - 3 : labelFontSize - 2, fontFamily: 'Kanit_B', color: '#000', whiteSpace: 'nowrap', marginLeft: 4, textAlign: 'right' }}>{a.qty} {a.unit}</div>
                                          </div>
                                        )}
                                        {labelSections.fixname && a.fixname && (
                                          <div style={{ fontSize: isTallSeparateLabel ? labelFontSize - 4 : labelFontSize - 3, fontFamily: 'Kanit', color: '#000', borderBottom: '1px dashed #000', paddingBottom: 1, marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.fixname}</div>
                                        )}
                                        {/* Indicator - clickable */}
                                        {labelSections.indication && (
                                          <button onClick={() => { setShowA(!showA); setId_pro(a.code_product); setName_pro(a.name_product); setNum(1); setIndiE(gt('indicatorlistS')); }}
                                            style={{ border: '1px solid #000', borderRadius: 4, padding: isTallSeparateLabel ? '1.2mm 2mm' : '1px 8px', marginBottom: isTallSeparateLabel ? 0 : 1, marginTop: isTallSeparateLabel ? 0 : 1, minHeight: isTallSeparateLabel ? '10mm' : undefined, lineHeight: isTallSeparateLabel ? 1.25 : undefined, fontSize: isTallSeparateLabel ? labelFontSize - 3 : labelFontSize - 2, color: '#000', background: 'transparent', textAlign: 'left', width: '100%', cursor: 'pointer', fontFamily: 'Kanit', display: 'block' }}>
                                            <strong>ข้อบ่งใช้:</strong> {gt('indicatorlistS')}
                                          </button>
                                        )}
                                        {/* Usage - clickable */}
                                        {labelSections.usage && (
                                          <button onClick={() => { setShowB(!showB); setId_pro(a.code_product); setName_pro(a.name_product); setNum(2); setuseE(gtUseTime()); }}
                                            style={{ border: '1px solid #000', borderRadius: 4, padding: isTallSeparateLabel ? '1.4mm 2mm' : '1px 8px', marginBottom: isTallSeparateLabel ? 0 : 1, minHeight: isTallSeparateLabel ? '14mm' : undefined, lineHeight: isTallSeparateLabel ? 1.25 : undefined, fontSize: isTallSeparateLabel ? labelFontSize - 3 : labelFontSize - 2, color: '#000', background: 'transparent', textAlign: 'left', width: '100%', cursor: 'pointer', fontFamily: 'Kanit', display: 'block' }}>
                                            <strong>วิธีใช้:</strong> {gtUseTime()}
                                          </button>
                                        )}
                                        {/* Time/Keep - clickable */}
                                        {labelSections.timeKeep && (
                                          <button onClick={() => { setShowC(!showC); setId_pro(a.code_product); setName_pro(a.name_product); setNum(3); settimeE(gtTimeKeep()); }}
                                            style={{ border: '1px solid #000', borderRadius: 4, padding: isTallSeparateLabel ? '1.1mm 2mm' : '0px 6px', marginBottom: isTallSeparateLabel ? 0 : 1, minHeight: isTallSeparateLabel ? '10mm' : undefined, lineHeight: isTallSeparateLabel ? 1.25 : undefined, fontSize: isTallSeparateLabel ? labelFontSize - 4 : labelFontSize - 3, color: '#000', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontFamily: 'Kanit', display: isTallSeparateLabel ? 'block' : 'inline-block', width: isTallSeparateLabel ? '100%' : undefined }}>
                                            {gtTimeKeep()}
                                          </button>
                                        )}
                                        {/* Remark - clickable */}
                                        {labelSections.remark && (
                                          <button onClick={() => { setShowD(!showD); setId_pro(a.code_product); setName_pro(a.name_product); setNum(4); setremarkE(gt('remarkS')); }}
                                            style={{ border: 'none', background: 'transparent', fontSize: labelFontSize - 3, color: '#000', fontStyle: 'italic', textAlign: 'left', width: '100%', cursor: 'pointer', fontFamily: 'Kanit', display: 'block', padding: isTallSeparateLabel ? '1.1mm 0' : '0px 0', minHeight: isTallSeparateLabel ? '10mm' : undefined, lineHeight: isTallSeparateLabel ? 1.25 : undefined }}>
                                            หมายเหตุ: {gt('remarkS') || "."}
                                          </button>
                                        )}
                                        {a.childWeight > 0 && a.childDoseWarning && (
                                          <div style={{ borderRadius: 4, padding: '0px 6px', marginTop: 1, border: '2px solid #000', fontSize: labelFontSize - 3, color: '#000', fontFamily: 'Kanit_B' }}>** เกิน max dose **</div>
                                        )}
                                        {(labelSections.pharmacist || showExpiry) && (
                                          <div style={{ marginTop: isTallSeparateLabel ? 'auto' : 1, minHeight: isTallSeparateLabel ? '8.5mm' : undefined, fontSize: labelFontSize - 3, color: '#000', borderTop: '1px solid #000', paddingTop: isTallSeparateLabel ? '1.4mm' : 1, display: 'flex', justifyContent: 'space-between', alignItems: isTallSeparateLabel ? 'flex-end' : undefined }}>
                                            {labelSections.pharmacist ? <span>เภสัชกร: {selectedPS}</span> : <span />}
                                            {showExpiry && <button onClick={() => { setShowE(!showE); setId_pro(a.code_product); setName_pro(a.name_product); setNum(5); setExpiryE(a.expiryDate || ''); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'Kanit', fontSize: labelFontSize - 3, color: '#000', padding: 0, textAlign: 'right' }}>หมดอายุ : {a.expiryDate || '..../......./..........'}</button>}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );

                                  /* ===================== PRO STYLE (thermal-friendly) ===================== */
                                  if (labelStyle === 'pro') return (
                                    <div key={`${a.id}-${idx}`} id="selcet-print" style={{ ...labelOuterStyle, borderRadius: 0, border: '2px solid #000', overflow: 'hidden', fontFamily: 'Kanit', display: isTallSeparateLabel ? 'flex' : undefined, flexDirection: isTallSeparateLabel ? 'column' : undefined }}>
                                      {/* Header - always render wrapper with headerHeight, content conditional on allS */}
                                      <div style={{ height: headerHeight, overflow: 'hidden', flexShrink: 0 }}>
                                        {allS === false ? (
                                          <div style={{ borderBottom: '2px double #000', padding: '1px 8px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 8, height: '100%' }}>
                                            {logoS === true && uploadedUrl ? <img alt="" src={String(uploadedUrl)} width={34} height={30} style={{ borderRadius: 2, padding: 1 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} /> : null}
                                            <div style={{ flex: 1 }}>
                                              <div style={{ fontFamily: 'Kanit_B', fontSize: labelHeaderFontSize + 1, color: '#000', lineHeight: 1.2, letterSpacing: '0.5px' }}>{storeS}</div>
                                              <div style={{ fontSize: labelHeaderFontSize - 5, color: '#000', lineHeight: 1.1 }}>{addressS} | โทร {telS}</div>
                                            </div>
                                            {renderHeaderQrImage(isTallSeparateLabel)}
                                          </div>
                                        ) : ""}
                                      </div>
                                      {/* Info Bar */}
                                      {(labelSections.customer || labelSections.date) && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: isTallSeparateLabel ? '1mm 3mm' : '0px 10px', borderBottom: '1px solid #000', fontSize: isTallSeparateLabel ? labelFontSize - 3 : labelFontSize - 3, color: '#000', flexShrink: 0 }}>
                                          {labelSections.customer ? <span onClick={openCusEdit} title="คลิกเพื่อแก้ไขชื่อลูกค้า" style={{ fontFamily: 'Kanit_B', cursor: 'pointer' }}>{cusName}</span> : <span />}
                                          {labelSections.date ? <span>{dateStr}</span> : <span />}
                                        </div>
                                      )}
                                      {/* Product Name Bar */}
                                      {labelSections.productName && (
                                        <div style={{ padding: isTallSeparateLabel ? '1mm 3mm' : '0px 10px', borderBottom: '1px solid #000', background: '#000', display: 'flex', justifyContent: 'space-between', alignItems: 'center', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', flexShrink: 0 } as React.CSSProperties}>
                                          <div style={{ fontSize: isTallSeparateLabel ? labelFontSize - 1 : labelFontSize, fontFamily: 'Kanit_B', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, maxWidth: contentWidth }}>{a.name_product}</div>
                                          <div style={{ fontSize: isTallSeparateLabel ? labelFontSize - 3 : labelFontSize - 2, fontFamily: 'Kanit_B', color: '#fff', whiteSpace: 'nowrap', marginLeft: 4, textAlign: 'right' }}>{a.qty} {a.unit}</div>
                                        </div>
                                      )}
                                      {labelSections.fixname && a.fixname && (
                                        <div style={{ padding: isTallSeparateLabel ? '0.6mm 3mm' : '0px 10px', borderBottom: '1px solid #000', fontSize: isTallSeparateLabel ? labelFontSize - 4 : labelFontSize - 3, fontFamily: 'Kanit', color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }}>{a.fixname}</div>
                                      )}
                                      {/* Structured Body - clickable fields */}
                                      <div style={{ padding: isTallSeparateLabel ? '3mm 3.2mm 2.8mm' : '0px 10px 1px', flex: isTallSeparateLabel ? 1 : undefined, display: isTallSeparateLabel ? 'flex' : undefined, flexDirection: isTallSeparateLabel ? 'column' : undefined, gap: isTallSeparateLabel ? '1.8mm' : undefined, minHeight: isTallSeparateLabel ? 0 : undefined }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isTallSeparateLabel ? labelFontSize - 3 : labelFontSize - 2 }}>
                                          <tbody>
                                            {labelSections.indication && (
                                              <tr style={{ borderBottom: '1px dotted #000', cursor: 'pointer', height: isTallSeparateLabel ? '10mm' : 'auto' }} onClick={() => { setShowA(!showA); setId_pro(a.code_product); setName_pro(a.name_product); setNum(1); setIndiE(gt('indicatorlistS')); }}>
                                                <td style={{ width: 65, color: '#000', fontFamily: 'Kanit_B', verticalAlign: 'top', padding: isTallSeparateLabel ? '1mm 0' : '0px 0', fontSize: isTallSeparateLabel ? labelFontSize - 4 : labelFontSize - 3 }}>ข้อบ่งใช้</td>
                                                <td style={{ color: '#000', padding: isTallSeparateLabel ? '1mm 0' : '0px 0', verticalAlign: 'top', fontSize: isTallSeparateLabel ? labelFontSize - 3 : undefined }}>{gt('indicatorlistS')}</td>
                                              </tr>
                                            )}
                                            {labelSections.usage && (
                                              <tr style={{ borderBottom: '1px dotted #000', cursor: 'pointer', height: isTallSeparateLabel ? '14mm' : 'auto' }} onClick={() => { setShowB(!showB); setId_pro(a.code_product); setName_pro(a.name_product); setNum(2); setuseE(gtUseTime()); }}>
                                                <td style={{ width: 65, color: '#000', fontFamily: 'Kanit_B', verticalAlign: 'top', padding: isTallSeparateLabel ? '1.2mm 0' : '0px 0', fontSize: isTallSeparateLabel ? labelFontSize - 4 : labelFontSize - 3 }}>วิธีใช้</td>
                                                <td style={{ color: '#000', padding: isTallSeparateLabel ? '1.2mm 0' : '0px 0', verticalAlign: 'top', fontSize: isTallSeparateLabel ? labelFontSize - 3 : undefined }}>{gtUseTime()}</td>
                                              </tr>
                                            )}
                                            {labelSections.timeKeep && (
                                              <tr style={{ borderBottom: '1px dotted #000', cursor: 'pointer', height: isTallSeparateLabel ? '10mm' : 'auto' }} onClick={() => { setShowC(!showC); setId_pro(a.code_product); setName_pro(a.name_product); setNum(3); settimeE(gtTimeKeep()); }}>
                                                <td style={{ width: 65, color: '#000', fontFamily: 'Kanit_B', verticalAlign: 'top', padding: isTallSeparateLabel ? '1mm 0' : '0px 0', fontSize: isTallSeparateLabel ? labelFontSize - 4 : labelFontSize - 3 }}>ช่วงเวลา</td>
                                                <td style={{ color: '#000', padding: isTallSeparateLabel ? '1mm 0' : '0px 0', verticalAlign: 'top', fontSize: isTallSeparateLabel ? labelFontSize - 3 : undefined }}>{gtTimeKeep()}</td>
                                              </tr>
                                            )}
                                            {labelSections.remark && (
                                              <tr style={{ cursor: 'pointer', height: isTallSeparateLabel ? '10mm' : 'auto' }} onClick={() => { setShowD(!showD); setId_pro(a.code_product); setName_pro(a.name_product); setNum(4); setremarkE(gt('remarkS')); }}>
                                                <td style={{ width: 65, color: '#000', fontFamily: 'Kanit_B', verticalAlign: 'top', padding: isTallSeparateLabel ? '1mm 0' : '0px 0', fontSize: isTallSeparateLabel ? labelFontSize - 4 : labelFontSize - 3 }}>หมายเหตุ</td>
                                                <td style={{ color: '#000', padding: isTallSeparateLabel ? '1mm 0' : '0px 0', verticalAlign: 'top', fontStyle: 'italic', fontSize: isTallSeparateLabel ? labelFontSize - 3 : undefined }}>{gt('remarkS') || "."}</td>
                                              </tr>
                                            )}
                                          </tbody>
                                        </table>
                                        {a.childWeight > 0 && a.childDoseWarning && (
                                          <div style={{ borderRadius: 0, padding: '0px 6px', marginTop: 1, border: '2px solid #000', fontSize: labelFontSize - 3, color: '#000', fontFamily: 'Kanit_B' }}>** เกิน max dose **</div>
                                        )}
                                        {(labelSections.pharmacist || showExpiry) && (
                                          <div style={{ borderTop: '1.5px solid #000', marginTop: isTallSeparateLabel ? 'auto' : 0, minHeight: isTallSeparateLabel ? '8.5mm' : undefined, paddingTop: isTallSeparateLabel ? '1.4mm' : 0, fontSize: labelFontSize - 3, color: '#000', display: 'flex', justifyContent: 'space-between', alignItems: isTallSeparateLabel ? 'flex-end' : undefined }}>
                                            {labelSections.pharmacist ? <span>เภสัชกร: {selectedPS}</span> : <span />}
                                            {showExpiry && <button onClick={() => { setShowE(!showE); setId_pro(a.code_product); setName_pro(a.name_product); setNum(5); setExpiryE(a.expiryDate || ''); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'Kanit', fontSize: labelFontSize - 3, color: '#000', padding: 0, textAlign: 'right' }}>หมดอายุ : {a.expiryDate || '..../......./..........'}</button>}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );

                                  /* ===================== ELEGANT STYLE (thermal-friendly, beautiful) ===================== */
                                  if (labelStyle === 'elegant') return (
                                    <div key={`${a.id}-${idx}`} id="selcet-print" style={{ ...labelOuterStyle, borderRadius: 10, border: '2px solid #000', overflow: 'hidden', fontFamily: 'Kanit', display: isTallSeparateLabel ? 'flex' : undefined, flexDirection: isTallSeparateLabel ? 'column' : undefined }}>
                                      {/* Header - always render wrapper with headerHeight */}
                                      <div style={{ height: headerHeight, overflow: 'hidden', flexShrink: 0 }}>
                                        {allS === false ? (
                                          <div style={{ padding: '1px 8px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 8, height: '100%' }}>
                                            {logoS === true && uploadedUrl ? <img alt="" src={String(uploadedUrl)} width={36} height={32} style={{ borderRadius: '5%', padding: 1 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} /> : null}
                                            <div style={{ flex: 1, textAlign: 'center' }}>
                                              <div style={{ fontFamily: 'Kanit_B', fontSize: labelHeaderFontSize + 2, color: '#000', lineHeight: 1.2, letterSpacing: '1px' }}>{storeS}</div>
                                              <div style={{ fontSize: labelHeaderFontSize - 5, color: '#000', lineHeight: 1.1 }}>{addressS} | {telS}</div>
                                            </div>
                                            {renderHeaderQrImage(isTallSeparateLabel)}
                                          </div>
                                        ) : ""}
                                      </div>
                                      {/* Ornamental divider */}
                                      {allS === false ? (
                                        <div style={{ textAlign: 'center', lineHeight: 0.6, fontSize: 8, color: '#000', letterSpacing: 2, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', flexShrink: 0 } as React.CSSProperties}>
                                          <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '0.5px 0', margin: '0 10px' }}>
                                            <span style={{ fontSize: 7, letterSpacing: 4 }}>&#9670; &#9670; &#9670;</span>
                                          </div>
                                        </div>
                                      ) : ""}
                                      {/* Customer + Date */}
                                      {(labelSections.customer || labelSections.date) && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: isTallSeparateLabel ? '1.2mm 3.2mm' : '0px 12px', fontSize: isTallSeparateLabel ? labelFontSize - 3 : labelFontSize - 3, color: '#000', flexShrink: 0 }}>
                                          {labelSections.customer ? <span onClick={openCusEdit} title="คลิกเพื่อแก้ไขชื่อลูกค้า" style={{ fontFamily: 'Kanit_B', cursor: 'pointer' }}>{cusName}</span> : <span />}
                                          {labelSections.date ? <span style={{ fontStyle: 'italic' }}>{dateStr}</span> : <span />}
                                        </div>
                                      )}
                                      {/* Product name - centered with decorative borders */}
                                      {labelSections.productName && (
                                        <div style={{ margin: isTallSeparateLabel ? '1mm 10px' : '0 10px', border: '1.5px solid #000', borderRadius: 6, padding: isTallSeparateLabel ? '1mm 2mm' : '0px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', flexShrink: 0 } as React.CSSProperties}>
                                          <div style={{ fontSize: isTallSeparateLabel ? labelFontSize : labelFontSize + 1, fontFamily: 'Kanit_B', color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, maxWidth: contentWidth }}>{a.name_product}</div>
                                          <div style={{ fontSize: isTallSeparateLabel ? labelFontSize - 3 : labelFontSize - 2, fontFamily: 'Kanit_B', color: '#000', whiteSpace: 'nowrap', marginLeft: 4, textAlign: 'right' }}>{a.qty} {a.unit}</div>
                                        </div>
                                      )}
                                      {labelSections.fixname && a.fixname && (
                                        <div style={{ margin: isTallSeparateLabel ? '0.8mm 10px 0' : '1px 10px 0', fontSize: isTallSeparateLabel ? labelFontSize - 4 : labelFontSize - 3, fontFamily: 'Kanit', color: '#000', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.fixname}</div>
                                      )}
                                      {/* Body fields */}
                                      <div style={{ padding: isTallSeparateLabel ? '2.8mm 3.2mm 2.6mm' : '0px 12px 1px', flex: isTallSeparateLabel ? 1 : undefined, display: isTallSeparateLabel ? 'flex' : undefined, flexDirection: isTallSeparateLabel ? 'column' : undefined, gap: isTallSeparateLabel ? '1.8mm' : undefined, minHeight: isTallSeparateLabel ? 0 : undefined }}>
                                        {/* Indicator - clickable */}
                                        {labelSections.indication && (
                                          <button onClick={() => { setShowA(!showA); setId_pro(a.code_product); setName_pro(a.name_product); setNum(1); setIndiE(gt('indicatorlistS')); }}
                                            style={{ border: 'none', borderBottom: '1px dotted #000', background: 'transparent', padding: isTallSeparateLabel ? '1mm 0' : '0px 0', marginBottom: 0, minHeight: isTallSeparateLabel ? '10mm' : undefined, lineHeight: isTallSeparateLabel ? 1.25 : undefined, fontSize: isTallSeparateLabel ? labelFontSize - 3 : labelFontSize - 2, color: '#000', textAlign: 'left', width: '100%', cursor: 'pointer', fontFamily: 'Kanit', display: 'block' }}>
                                            <span style={{ fontFamily: 'Kanit_B', fontSize: isTallSeparateLabel ? labelFontSize - 4 : labelFontSize - 3 }}>&#9702; ข้อบ่งใช้ : </span>{gt('indicatorlistS')}
                                          </button>
                                        )}
                                        {/* Usage - clickable */}
                                        {labelSections.usage && (
                                          <button onClick={() => { setShowB(!showB); setId_pro(a.code_product); setName_pro(a.name_product); setNum(2); setuseE(gtUseTime()); }}
                                            style={{ border: 'none', borderBottom: '1px dotted #000', background: 'transparent', padding: isTallSeparateLabel ? '1.2mm 0' : '0px 0', marginBottom: 0, minHeight: isTallSeparateLabel ? '14mm' : undefined, lineHeight: isTallSeparateLabel ? 1.25 : undefined, fontSize: isTallSeparateLabel ? labelFontSize - 3 : labelFontSize - 2, color: '#000', textAlign: 'left', width: '100%', cursor: 'pointer', fontFamily: 'Kanit', display: 'block' }}>
                                            <span style={{ fontFamily: 'Kanit_B', fontSize: isTallSeparateLabel ? labelFontSize - 4 : labelFontSize - 3 }}>&#9702; วิธีใช้ : </span>{gtUseTime()}
                                          </button>
                                        )}
                                        {/* Time/Keep - clickable */}
                                        {labelSections.timeKeep && (
                                          <button onClick={() => { setShowC(!showC); setId_pro(a.code_product); setName_pro(a.name_product); setNum(3); settimeE(gtTimeKeep()); }}
                                            style={{ border: 'none', borderBottom: '1px dotted #000', background: 'transparent', padding: isTallSeparateLabel ? '1mm 0' : '0px 0', marginBottom: 0, minHeight: isTallSeparateLabel ? '10mm' : undefined, lineHeight: isTallSeparateLabel ? 1.25 : undefined, fontSize: isTallSeparateLabel ? labelFontSize - 4 : labelFontSize - 3, color: '#000', textAlign: 'left', width: '100%', cursor: 'pointer', fontFamily: 'Kanit', display: 'block' }}>
                                            <span style={{ fontFamily: 'Kanit_B', fontSize: isTallSeparateLabel ? labelFontSize - 5 : labelFontSize - 3 }}>&#9702; ช่วงเวลา/เก็บ : </span>{gtTimeKeep()}
                                          </button>
                                        )}
                                        {/* Remark - clickable */}
                                        {labelSections.remark && (
                                          <button onClick={() => { setShowD(!showD); setId_pro(a.code_product); setName_pro(a.name_product); setNum(4); setremarkE(gt('remarkS')); }}
                                            style={{ border: 'none', background: 'transparent', padding: isTallSeparateLabel ? '1mm 0' : '0px 0', minHeight: isTallSeparateLabel ? '10mm' : undefined, lineHeight: isTallSeparateLabel ? 1.25 : undefined, fontSize: isTallSeparateLabel ? labelFontSize - 4 : labelFontSize - 3, color: '#000', textAlign: 'left', width: '100%', cursor: 'pointer', fontFamily: 'Kanit', display: 'block', fontStyle: 'italic' }}>
                                            <span style={{ fontFamily: 'Kanit_B', fontStyle: 'normal', fontSize: isTallSeparateLabel ? labelFontSize - 5 : labelFontSize - 3 }}>&#9702; หมายเหตุ : </span>{gt('remarkS') || "."}
                                          </button>
                                        )}
                                        {a.childWeight > 0 && a.childDoseWarning && (
                                          <div style={{ borderRadius: 6, padding: '0px 6px', marginTop: 0, border: '2px solid #000', fontSize: labelFontSize - 3, color: '#000', fontFamily: 'Kanit_B', textAlign: 'center' }}>** เกิน max dose **</div>
                                        )}
                                        {/* Footer divider + pharmacist */}
                                        {(labelSections.pharmacist || showExpiry) && (
                                          <>
                                            <div style={{ textAlign: 'center', marginTop: isTallSeparateLabel ? 'auto' : 0, minHeight: isTallSeparateLabel ? 0.5 : undefined, lineHeight: 0.5, fontSize: 7, color: '#000', letterSpacing: 3, flexShrink: 0 }}>
                                              <span>&#9670; &#9670; &#9670;</span>
                                            </div>
                                            <div style={{ marginTop: 0, minHeight: isTallSeparateLabel ? '8.5mm' : undefined, fontSize: labelFontSize - 3, color: '#000', display: 'flex', justifyContent: 'space-between', alignItems: isTallSeparateLabel ? 'flex-end' : 'center', paddingTop: isTallSeparateLabel ? '1.2mm' : undefined, borderTop: isTallSeparateLabel ? '1px solid #000' : undefined }}>
                                              {labelSections.pharmacist ? <span><span style={{ fontFamily: 'Kanit_B' }}>เภสัชกร :</span> {selectedPS}</span> : <span />}
                                              {showExpiry && <button onClick={() => { setShowE(!showE); setId_pro(a.code_product); setName_pro(a.name_product); setNum(5); setExpiryE(a.expiryDate || ''); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'Kanit', fontSize: labelFontSize - 3, color: '#000', padding: 0, textAlign: 'right' }}>หมดอายุ : {a.expiryDate || '..../......./..........'}</button>}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  );

                                  /* ===================== MINIMAL STYLE (แบบที่ 5 — clean & beautiful) ===================== */
                                  if (labelStyle === 'minimal') return (
                                    <div key={`${a.id}-${idx}`} id="selcet-print" style={{ ...labelOuterStyle, borderRadius: 8, border: '1.5px solid #555', overflow: 'hidden', fontFamily: 'Kanit', position: 'relative', display: isTallSeparateLabel ? 'flex' : undefined, flexDirection: isTallSeparateLabel ? 'column' : undefined }}>
                                      {/* Header — soft top accent line */}
                                      <div style={{ height: 3, background: '#555', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', flexShrink: 0 } as React.CSSProperties} />
                                      <div style={{ height: allS === false ? headerHeight : 0, overflow: 'hidden', flexShrink: 0 }}>
                                        {allS === false ? (
                                          <div style={{ padding: '1px 8px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 6, height: '100%' }}>
                                            {logoS === true && uploadedUrl ? <img alt="" src={String(uploadedUrl)} width={30} height={28} style={{ borderRadius: 4, flexShrink: 0, opacity: 0.9 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} /> : null}
                                            <div style={{ flex: 1, minWidth: 0, textAlign: logoS ? 'left' : 'center' }}>
                                              <div style={{ fontFamily: 'Kanit_B', fontSize: labelHeaderFontSize + 1, color: '#222', lineHeight: 1.15 }}>{storeS}</div>
                                              <div style={{ fontSize: labelHeaderFontSize - 5.5, color: '#000', lineHeight: 1.1 }}>{addressS} | โทร {telS}</div>
                                            </div>
                                            {renderHeaderQrImage(isTallSeparateLabel, { opacity: 1 })}
                                          </div>
                                        ) : ""}
                                      </div>
                                      {/* Thin separator */}
                                      {allS === false ? <div style={{ height: '0.5px', background: '#000', margin: '0 8px', flexShrink: 0 }} /> : ""}
                                      {/* Patient + Date */}
                                      {(labelSections.customer || labelSections.date) && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: isTallSeparateLabel ? '1.1mm 2.5mm' : '1px 10px', fontSize: isTallSeparateLabel ? labelFontSize - 2 : labelFontSize - 3.5, color: '#000', flexShrink: 0 }}>
                                          {labelSections.customer ? <span onClick={openCusEdit} title="คลิกเพื่อแก้ไขชื่อลูกค้า" style={{ cursor: 'pointer' }}>{cusName}</span> : <span />}
                                          {labelSections.date ? <span>{dateStr}</span> : <span />}
                                        </div>
                                      )}
                                      {/* Drug name — prominent */}
                                      {labelSections.productName && (
                                        <div style={{ margin: isTallSeparateLabel ? '1mm 2.5mm' : '0 8px', padding: isTallSeparateLabel ? '1.1mm 2mm' : '1px 8px', background: '#f5f5f5', borderRadius: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', flexShrink: 0 } as React.CSSProperties}>
                                          <div style={{ fontSize: labelFontSize + 0.5, fontFamily: 'Kanit_B', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, maxWidth: contentWidth }}>{a.name_product}</div>
                                          <div style={{ fontSize: labelFontSize - 2, fontFamily: 'Kanit_B', color: '#333', whiteSpace: 'nowrap', marginLeft: 6, flexShrink: 0 }}>{a.qty} {a.unit}</div>
                                        </div>
                                      )}
                                      {labelSections.fixname && a.fixname && (
                                        <div style={{ margin: isTallSeparateLabel ? '0.8mm 2.5mm 0' : '1px 8px 0', fontSize: labelFontSize - 3.5, fontFamily: 'Kanit', color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.fixname}</div>
                                      )}
                                      {/* Body */}
                                      <div style={{ padding: isTallSeparateLabel ? '2.4mm 2.5mm 2.2mm' : '2px 10px 3px', flex: isTallSeparateLabel ? 1 : undefined, display: isTallSeparateLabel ? 'flex' : undefined, flexDirection: isTallSeparateLabel ? 'column' : undefined, gap: isTallSeparateLabel ? '1.6mm' : undefined, minHeight: isTallSeparateLabel ? 0 : undefined }}>
                                        {/* Indicator */}
                                        {labelSections.indication && (
                                          <button onClick={() => { setShowA(!showA); setId_pro(a.code_product); setName_pro(a.name_product); setNum(1); setIndiE(gt('indicatorlistS')); }}
                                            style={{ border: 'none', background: 'transparent', padding: isTallSeparateLabel ? '0.6mm 0' : '0.5px 0', minHeight: isTallSeparateLabel ? '9mm' : undefined, lineHeight: isTallSeparateLabel ? 1.2 : undefined, fontSize: labelFontSize - 2, color: '#000', textAlign: 'left', width: '100%', cursor: 'pointer', fontFamily: 'Kanit', display: 'block' }}>
                                            <span style={{ color: '#000', fontSize: labelFontSize - 3.5, marginRight: 3 }}>▸</span>{gt('indicatorlistS')}
                                          </button>
                                        )}
                                        {/* Usage — emphasized */}
                                        {labelSections.usage && (
                                          <button onClick={() => { setShowB(!showB); setId_pro(a.code_product); setName_pro(a.name_product); setNum(2); setuseE(gtUseTime()); }}
                                            style={{ border: 'none', background: 'transparent', padding: isTallSeparateLabel ? '0.8mm 0' : '0.5px 0', minHeight: isTallSeparateLabel ? '12mm' : undefined, lineHeight: isTallSeparateLabel ? 1.2 : undefined, fontSize: labelFontSize - 1, color: '#000', textAlign: 'left', width: '100%', cursor: 'pointer', fontFamily: 'Kanit_B', display: 'block' }}>
                                            <span style={{ color: '#000', fontSize: labelFontSize - 3.5, fontFamily: 'Kanit', marginRight: 3 }}>▸</span>{gtUseTime()}
                                          </button>
                                        )}
                                        {/* Time/Keep */}
                                        {labelSections.timeKeep && (
                                          <button onClick={() => { setShowC(!showC); setId_pro(a.code_product); setName_pro(a.name_product); setNum(3); settimeE(gtTimeKeep()); }}
                                            style={{ border: 'none', background: 'transparent', padding: isTallSeparateLabel ? '0.6mm 0' : '0px 0', minHeight: isTallSeparateLabel ? '9mm' : undefined, lineHeight: isTallSeparateLabel ? 1.2 : undefined, fontSize: labelFontSize - 3, color: '#000', textAlign: 'left', width: '100%', cursor: 'pointer', fontFamily: 'Kanit', display: 'block' }}>
                                            <span style={{ color: '#000', fontSize: labelFontSize - 3.5, marginRight: 3 }}>▸</span>{gtTimeKeep()}
                                          </button>
                                        )}
                                        {/* Remark */}
                                        {labelSections.remark && (
                                          <button onClick={() => { setShowD(!showD); setId_pro(a.code_product); setName_pro(a.name_product); setNum(4); setremarkE(gt('remarkS')); }}
                                            style={{ border: 'none', background: 'transparent', fontSize: labelFontSize - 3.5, color: '#000', textAlign: 'left', width: '100%', cursor: 'pointer', fontFamily: 'Kanit', display: 'block', padding: isTallSeparateLabel ? '0.6mm 0' : '0', minHeight: isTallSeparateLabel ? '9mm' : undefined, lineHeight: isTallSeparateLabel ? 1.2 : undefined }}>
                                            หมายเหตุ: {gt('remarkS') || "-"}
                                          </button>
                                        )}
                                        {a.childWeight > 0 && a.childDoseWarning && (
                                          <div style={{ background: '#f5f5f5', borderRadius: 4, padding: '0px 6px', marginTop: isTallSeparateLabel ? 0 : 1, minHeight: isTallSeparateLabel ? '8mm' : undefined, fontSize: labelFontSize - 3, color: '#000', fontFamily: 'Kanit_B', textAlign: 'center', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', display: 'flex', alignItems: 'center', justifyContent: 'center' } as React.CSSProperties}>⚠ เกิน max dose</div>
                                        )}
                                        {/* Footer */}
                                        {(labelSections.pharmacist || showExpiry) && (
                                          <>
                                            <div style={{ height: '0.5px', background: '#000', margin: isTallSeparateLabel ? '0.8mm 0 0.8mm' : '2px 0 2px' }} />
                                            <div style={{ fontSize: labelFontSize - 3.5, color: '#000', display: 'flex', justifyContent: 'space-between', alignItems: isTallSeparateLabel ? 'flex-end' : 'center', minHeight: isTallSeparateLabel ? '8mm' : undefined }}>
                                              {labelSections.pharmacist ? <span>เภสัชกร: {selectedPS}</span> : <span />}
                                              {showExpiry && <button onClick={() => { setShowE(!showE); setId_pro(a.code_product); setName_pro(a.name_product); setNum(5); setExpiryE(a.expiryDate || ''); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'Kanit', fontSize: labelFontSize - 3.5, color: '#000', padding: 0, textAlign: 'right' }}>หมดอายุ: {a.expiryDate || '..../......./..........'}</button>}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                      {/* Bottom accent line */}
                                      <div style={{ height: 3, background: '#555', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', flexShrink: 0 } as React.CSSProperties} />
                                    </div>
                                  );

                                  /* ===================== CURRENT STYLE (default) — Premium Hospital ===================== */
                                  return (
                                    <div key={`${a.id}-${idx}`} id="selcet-print" style={{ ...labelOuterStyle, borderRadius: 0, border: '2.5px double #000', overflow: 'hidden', fontFamily: 'Kanit', boxSizing: 'border-box', display: isTallSeparateLabel ? 'flex' : undefined, flexDirection: isTallSeparateLabel ? 'column' : undefined }}>
                                      {/* Header — clean white, centered like hospital Rx */}
                                      <div style={{ height: headerHeight, overflow: 'hidden' }}>
                                        {allS === false ? (
                                          <div style={{ padding: '1px 8px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 6, height: '100%', borderBottom: '2px solid #000' }}>
                                            {logoS === true && uploadedUrl ? <img alt="" src={String(uploadedUrl)} width={32} height={30} style={{ flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} /> : null}
                                            <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                                              <div style={{ fontFamily: 'Kanit_B', fontSize: labelHeaderFontSize + 2, color: '#000', lineHeight: 1.15, letterSpacing: '0.5px' }}>{storeS}</div>
                                              <div style={{ fontSize: labelHeaderFontSize - 5, color: '#000', lineHeight: 1.15 }}>{addressS} Tel. {telS}</div>
                                            </div>
                                            {renderHeaderQrImage(isTallSeparateLabel)}
                                          </div>
                                        ) : ""}
                                      </div>
                                      {/* Patient + Date row */}
                                      {(labelSections.customer || labelSections.date) && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isTallSeparateLabel ? '1mm 2.5mm' : '1px 8px', borderBottom: '1px solid #000', fontSize: isTallSeparateLabel ? labelFontSize - 2 : labelFontSize - 3, color: '#000', flexShrink: 0 }}>
                                          {labelSections.customer ? <span onClick={openCusEdit} title="คลิกเพื่อแก้ไขชื่อลูกค้า" style={{ cursor: 'pointer' }}><span style={{ fontSize: labelFontSize - 4, color: '#444' }}>ชื่อ:</span> <span style={{ fontFamily: 'Kanit_B' }}>{cusName}</span></span> : <span />}
                                          {labelSections.date ? <span><span style={{ fontSize: labelFontSize - 4, color: '#444' }}>วันที่:</span> {dateStr}</span> : <span />}
                                        </div>
                                      )}
                                      {/* Drug name bar */}
                                      {labelSections.productName && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isTallSeparateLabel ? '1.2mm 2.5mm' : '1px 8px', borderBottom: '1.5px solid #000', background: '#000', color: '#fff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', flexShrink: 0 } as React.CSSProperties}>
                                          <div style={{ fontSize: labelFontSize, fontFamily: 'Kanit_B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, maxWidth: contentWidth }}>{a.name_product}</div>
                                          <div style={{ fontSize: labelFontSize - 1, fontFamily: 'Kanit_B', whiteSpace: 'nowrap', marginLeft: 6, flexShrink: 0 }}>{a.qty} {a.unit}</div>
                                        </div>
                                      )}
                                      {labelSections.fixname && a.fixname && (
                                        <div style={{ padding: isTallSeparateLabel ? '0.6mm 2.5mm' : '0px 8px', borderBottom: '1.5px solid #000', fontSize: labelFontSize - 3, fontFamily: 'Kanit', color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }}>{a.fixname}</div>
                                      )}
                                      {/* Body — structured fields */}
                                      <div style={{ padding: isTallSeparateLabel ? '3mm 3mm 2.6mm' : '2px 8px 3px', flex: isTallSeparateLabel ? 1 : undefined, minHeight: isTallSeparateLabel ? 0 : undefined, display: isTallSeparateLabel ? 'flex' : undefined, flexDirection: isTallSeparateLabel ? 'column' : undefined, gap: isTallSeparateLabel ? '1.8mm' : undefined }}>
                                        {/* Indicator */}
                                        {labelSections.indication && (
                                          <button onClick={() => { setShowA(!showA); setId_pro(a.code_product); setName_pro(a.name_product); setNum(1); setIndiE(gt('indicatorlistS')); }}
                                            style={{ border: 'none', borderBottom: '0.5px dotted #999', background: 'transparent', padding: isTallSeparateLabel ? '1mm 0 1.6mm' : '1px 0', minHeight: isTallSeparateLabel ? '11mm' : undefined, lineHeight: isTallSeparateLabel ? 1.25 : undefined, fontSize: labelFontSize - 2, color: '#000', textAlign: 'left', width: '100%', cursor: 'pointer', fontFamily: 'Kanit', display: 'block' }}>
                                            {gt('indicatorlistS')}
                                          </button>
                                        )}
                                        {/* Usage */}
                                        {labelSections.usage && (
                                          <button onClick={() => { setShowB(!showB); setId_pro(a.code_product); setName_pro(a.name_product); setNum(2); setuseE(gtUseTime()); }}
                                            style={{ border: 'none', borderBottom: '0.5px dotted #999', background: 'transparent', padding: isTallSeparateLabel ? '1.2mm 0 1.8mm' : '1px 0', minHeight: isTallSeparateLabel ? '14mm' : undefined, lineHeight: isTallSeparateLabel ? 1.25 : undefined, fontSize: labelFontSize - 1, color: '#000', textAlign: 'left', width: '100%', cursor: 'pointer', fontFamily: 'Kanit_B', display: 'block' }}>
                                            {gtUseTime()}
                                          </button>
                                        )}
                                        {/* Time/Keep */}
                                        {labelSections.timeKeep && (
                                          <button onClick={() => { setShowC(!showC); setId_pro(a.code_product); setName_pro(a.name_product); setNum(3); settimeE(gtTimeKeep()); }}
                                            style={{ border: 'none', borderBottom: isTallSeparateLabel ? '0.5px dotted #999' : 'none', background: 'transparent', padding: isTallSeparateLabel ? '1mm 0 1.5mm' : '0px 0', minHeight: isTallSeparateLabel ? '11mm' : undefined, lineHeight: isTallSeparateLabel ? 1.25 : undefined, fontSize: labelFontSize - 3, color: '#000', textAlign: 'left', cursor: 'pointer', fontFamily: 'Kanit', display: 'block', width: '100%' }}>
                                            {gtTimeKeep()}
                                          </button>
                                        )}
                                        {/* Remark */}
                                        {labelSections.remark && (
                                          <button onClick={() => { setShowD(!showD); setId_pro(a.code_product); setName_pro(a.name_product); setNum(4); setremarkE(gt('remarkS')); }}
                                            style={{ border: 'none', background: 'transparent', fontSize: labelFontSize - 3, color: '#444', textAlign: 'left', width: '100%', cursor: 'pointer', fontFamily: 'Kanit', display: 'block', padding: isTallSeparateLabel ? '1mm 0 1.5mm' : '0', minHeight: isTallSeparateLabel ? '11mm' : undefined, lineHeight: isTallSeparateLabel ? 1.25 : undefined }}>
                                            หมายเหตุ: {gt('remarkS') || "-"}
                                          </button>
                                        )}
                                        {a.childWeight > 0 && a.childDoseWarning && (
                                          <div style={{ padding: '0px 4px', marginTop: 1, border: '1.5px solid #000', fontSize: labelFontSize - 3, color: '#000', fontFamily: 'Kanit_B', textAlign: 'center' }}>⚠ เกิน max dose</div>
                                        )}
                                        {/* Footer — double line top */}
                                        {(labelSections.pharmacist || showExpiry) && (
                                          <div style={{ marginTop: isTallSeparateLabel ? 'auto' : 2, minHeight: isTallSeparateLabel ? '9mm' : undefined, fontSize: labelFontSize - 3, color: '#000', borderTop: '2px double #000', paddingTop: isTallSeparateLabel ? '1.8mm' : 2, display: 'flex', justifyContent: 'space-between', alignItems: isTallSeparateLabel ? 'flex-end' : 'center' }}>
                                            {labelSections.pharmacist ? <span>เภสัชกร: {selectedPS}</span> : <span />}
                                            {showExpiry && <button onClick={() => { setShowE(!showE); setId_pro(a.code_product); setName_pro(a.name_product); setNum(5); setExpiryE(a.expiryDate || ''); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'Kanit', fontSize: labelFontSize - 3, color: '#000', padding: 0, textAlign: 'right' }}>Exp: {a.expiryDate || '..../......./..........'}</button>}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })})()}

                                {/* ฉลากตัวช่วยฉลากยา — เพิ่ม 1 ดวงต่อ 1 ฉลากที่เลือกพิมพ์ */}
                                {activeHelper && listL.filter((q: any) => q.label === true).map((_: any, i: number) => renderHelperCard(i))}

                              </div>


                            </th>
                          </tr>
                        </tbody>
                      </Table>


                    </div>
                  </div>

                </ModalBody>


                <ModalFooter className="d-flex border " style={{ height: showA === true || showB === true || showC === true || showD === true || showE === true || showCus === true ? 150 : 70, backgroundColor: "rgba(241, 241, 241, 1)", flexShrink: 0 }}>



                  <button
                    className="btn btn-success"

                    style={{ width: 130, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                    onClick={separatePage ? reactToPrintSeparateFn : reactToPrintFn}
                  >
                    Print (F11)
                  </button>




                  <button
                    className="btn btn-secondary"
                    style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                    onClick={() => onClose()}
                  >
                    Close
                  </button>


                  {
                    num === 1 ? <IndiShow /> :
                      num === 2 ? <UseShow /> :
                        num === 3 ? <TimeShow /> :
                          num === 4 ? <RemarkShow /> :
                            num === 5 ? <ExpiryShow /> :
                              num === 6 ? <CusShow /> :
                            ""

                  }

                </ModalFooter>


              </>
            )}
          </ModalContent>
        </Modal>

        {/* ===================== LABEL HELPER MODAL (ตัวช่วยฉลากยา) ===================== */}
        <LabelHelperModal
          isOpen={labelHelperModal.isOpen}
          onClose={labelHelperModal.onClose}
          store={{
            name: storeS,
            address: addressS,
            tel: telS,
            logoUrl: uploadedUrl,
            lineUrl: uploadedUrl1,
            showLogo: logoS,
            showLine: lineS,
          }}
          initialPaperSize={paperSize}
          initialLabelStyle={labelStyle}
        />

        {/* ===================== BLANK LABEL MODAL (ฉลากยาเปล่า GPP) ===================== */}
        <Modal isOpen={blankLabelModal.isOpen} onOpenChange={blankLabelModal.onOpenChange} scrollBehavior={"inside"} size="lg">
          <ModalContent className="shadow-sm rounded rounded-2 border border" style={{ backgroundColor: "rgba(255, 255, 255, 1)" }}>
            {(onClose) => (
              <>
                <ModalHeader style={{ height: 50, backgroundColor: "rgba(241, 241, 241, 1)" }}>
                  <div className="d-flex align-items-center" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <div style={{ fontFamily: "Kanit_B", fontSize: 16 }}>📝 ฉลากสินค้าเปล่า (GPP)</div>
                    <div className="d-flex align-items-center" style={{ gap: 6 }}>
                      {/* ปรับขนาดตัวหนังสือ */}
                      <div className="d-flex align-items-center" style={{ background: '#fff', borderRadius: 6, border: '1px solid #d1d5db', padding: '1px 4px', gap: 2 }} title="ปรับขนาดตัวหนังสือ">
                        <span style={{ fontFamily: 'Kanit', fontSize: 10, color: '#6b7280' }}>T</span>
                        <button onClick={() => setBlankFontAdj(prev => { const v = Math.max(-4, prev - 0.5); localStorage.setItem('blankFontAdj', String(v)); return v; })} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 3px', fontSize: 14, fontWeight: 700, color: '#6b7280', lineHeight: 1 }}>−</button>
                        <span style={{ fontFamily: 'Kanit', fontSize: 10, color: '#6b7280', minWidth: 20, textAlign: 'center' }}>{blankFontAdj >= 0 ? '+' : ''}{blankFontAdj}</span>
                        <button onClick={() => setBlankFontAdj(prev => { const v = Math.min(6, prev + 0.5); localStorage.setItem('blankFontAdj', String(v)); return v; })} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 3px', fontSize: 14, fontWeight: 700, color: '#6b7280', lineHeight: 1 }}>+</button>
                      </div>
                      <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#555' }}>ขนาดกระดาษ:</span>
                      {labelPaperSizeOptions.map(option => (
                        <button key={option.value} onClick={() => selectPaperSize(option.value)}
                          style={{ fontFamily: 'Kanit', fontSize: 11, padding: '2px 10px', borderRadius: 20, cursor: 'pointer',
                            border: paperSize === option.value ? '2px solid #0d9488' : '1px solid #d1d5db',
                            background: paperSize === option.value ? '#f0fdfa' : '#fff',
                            color: paperSize === option.value ? '#0d9488' : '#888',
                            fontWeight: paperSize === option.value ? 700 : 400,
                          }}
                        >{option.label}</button>
                      ))}
                    </div>
                  </div>
                </ModalHeader>
                <ModalBody>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                    <div ref={blankLabelRef}>
                      {(() => {
                        const is60 = paperSize === '80x60';
                        const isTall = paperSize === '70x100';
                        const isRoomy = is60 || isTall;
                        const adj = blankFontAdj;
                        const fs = (isTall ? 9.5 : is60 ? 9.5 : 8.5) + adj;       // base font
                        const fsLabel = (isTall ? 8.5 : is60 ? 8.5 : 7.5) + adj;   // label font
                        const fsHead = (isTall ? 12 : is60 ? 12 : 11) + adj;      // store name
                        const fsAddr = (isTall ? 7.5 : is60 ? 7.5 : 6.5) + adj;    // address
                        const fsCb = (isTall ? 8 : is60 ? 8 : 7) + adj;          // checkbox text
                        const cbSize = (isTall ? 8 : is60 ? 8 : 7) + adj;        // checkbox box
                        const gap = isTall ? 3 : is60 ? 2 : 0;           // row gap
                        const px = isTall ? '3.5mm' : is60 ? '3mm' : '2.5mm';  // horizontal padding
                        const imgW = isTall ? 24 : is60 ? 26 : 22;
                        const imgH = isTall ? 22 : is60 ? 24 : 20;
                        const dotMin = isTall ? '40mm' : is60 ? '58mm' : '54mm'; // dotted line min-width for full-row
                        const patientLineWidth = isTall ? '22mm' : is60 ? '33mm' : '30mm';
                        const dateLineWidth = isTall ? '12mm' : is60 ? '18mm' : '16mm';
                        const tradeLineWidth = isTall ? '24mm' : is60 ? '34mm' : '30mm';
                        const qtyLineWidth = isTall ? '8mm' : is60 ? '10mm' : '8mm';
                        const doseLineWidth = isTall ? '8mm' : is60 ? '10mm' : '8mm';
                        const doseTimesLineWidth = isTall ? '6mm' : is60 ? '8mm' : '6mm';
                        const remarkLineWidth = isTall ? '38mm' : '48mm';
                        const expiryLineWidth = isTall ? '18mm' : '20mm';

                        return (
                      <div id="blank-label-print" style={{
                        width: paperWidthCss, height: paperHeightCss,
                        fontFamily: 'Kanit', fontSize: fs, color: '#000', boxSizing: 'border-box',
                        border: '1.5px solid #000', borderRadius: 4, overflow: 'hidden', padding: 0,
                        display: 'flex', flexDirection: 'column',
                        WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
                      } as React.CSSProperties}>

                        {/* === HEADER === */}
                        <div style={{ borderBottom: '1px solid #000', padding: isTall ? '2mm 3mm 1.2mm' : is60 ? '1.5mm 2.5mm 1mm' : '1mm 2mm 0.5mm', textAlign: 'center', flexShrink: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            {logoS && uploadedUrl && <img alt="" src={String(uploadedUrl)} width={imgW} height={imgH} style={{ borderRadius: 2, flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontFamily: 'Kanit_B', fontSize: fsHead, lineHeight: 1.15, letterSpacing: '0.3px' }}>{storeS}</div>
                              <div style={{ fontSize: fsAddr, lineHeight: 1.05, color: '#333' }}>{addressS} โทร {telS}</div>
                            </div>
                            {lineS && uploadedUrl1 && <img alt="" src={String(uploadedUrl1)} width={imgW} height={imgH} style={{ borderRadius: 2, flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />}
                          </div>
                        </div>

                        {/* === BODY === */}
                        <div style={{ flex: 1, padding: `0.5mm ${px} 0.5mm`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>

                          {/* ชื่อผู้ป่วย + วันที่ */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: gap }}>
                            <div style={{ flex: 1, fontSize: fs, overflow: 'hidden' }}>
                              <span style={{ fontFamily: 'Kanit_B', fontSize: fsLabel }}>ชื่อผู้ป่วย: </span>
                              <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', width: patientLineWidth }}>&nbsp;</span>
                            </div>
                            <div style={{ fontSize: fs, flexShrink: 0 }}>
                              <span style={{ fontFamily: 'Kanit_B', fontSize: fsLabel }}>วันที่: </span>
                              <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', width: dateLineWidth }}>&nbsp;</span>
                            </div>
                          </div>

                          {/* ชื่อสามัญทางยา */}
                          <div style={{ marginTop: gap, fontSize: fs, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            <span style={{ fontFamily: 'Kanit_B', fontSize: fsLabel }}>ชื่อสามัญทางสินค้า: </span>
                            <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', width: dotMin }}>&nbsp;</span>
                          </div>

                          {/* ชื่อยา + จำนวน */}
                          <div style={{ border: '1.5px solid #000', borderRadius: 3, padding: isTall ? '0.7mm 2mm' : is60 ? '0.5mm 2mm' : '0.3mm 1.5mm', marginTop: gap, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: fs, overflow: 'hidden', flex: 1 }}>
                              <span style={{ fontFamily: 'Kanit_B', fontSize: fsLabel }}>ชื่อการค้า: </span>
                              <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', width: tradeLineWidth }}>&nbsp;</span>
                            </div>
                            
                            <div style={{ fontSize: fs, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 2 }}>
                              <span style={{ fontFamily: 'Kanit_B', fontSize: fsLabel }}>จำนวน </span>
                              <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', width: qtyLineWidth }}>&nbsp;</span>
                            </div>
                          </div>

                          {/* ข้อบ่งใช้ */}
                          <div style={{ marginTop: gap, fontSize: fs, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            <span style={{ fontFamily: 'Kanit_B', fontSize: fsLabel }}>● ข้อบ่งใช้: </span>
                            <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', width: dotMin }}>&nbsp;</span>
                          </div>

                          {/* วิธีใช้ */}
                          <div style={{ marginTop: gap, fontSize: fs, display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'nowrap' }}>
                            <span style={{ fontFamily: 'Kanit_B', fontSize: fsLabel, flexShrink: 0 }}>● วิธีใช้: </span>
                            <span style={{ flexShrink: 0 }}>ครั้งละ</span>
                            <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', width: doseLineWidth, flexShrink: 0 }}>&nbsp;</span>
                            <span style={{ flexShrink: 0 }}>วันละ</span>
                            <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', width: doseTimesLineWidth, flexShrink: 0 }}>&nbsp;</span>
                            <span style={{ flexShrink: 0 }}>ครั้ง</span>
                          </div>

                          {/* ช่วงเวลา — checkboxes */}
                          <div style={{ marginTop: gap, fontSize: fsCb, display: 'flex', flexWrap: 'wrap', gap: isTall ? 4 : is60 ? 3 : 1, alignItems: 'center', lineHeight: 1 }}>
                            {['ก่อนอาหาร', 'หลังอาหาร', 'พร้อมอาหาร', 'เช้า', 'กลางวัน', 'เย็น', 'ก่อนนอน'].map(t => (
                              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                                <span style={{ display: 'inline-block', width: cbSize, height: cbSize, border: '1px solid #000', borderRadius: 1, flexShrink: 0 }} />
                                <span>{t}</span>
                              </span>
                            ))}
                          </div>

                          {/* การเก็บรักษา + หมายเหตุ */}
                          {isRoomy ? (<>
                            <div style={{ marginTop: gap, fontSize: fs, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              <span style={{ fontFamily: 'Kanit_B', fontSize: fsLabel }}>● เก็บรักษา: </span>
                              <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', width: dotMin }}>&nbsp;</span>
                            </div>
                            <div style={{ marginTop: gap, fontSize: fs, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              <span style={{ fontFamily: 'Kanit_B', fontSize: fsLabel }}>● หมายเหตุ/คำเตือน: </span>
                              <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', width: remarkLineWidth }}>&nbsp;</span>
                            </div>
                            <div style={{ marginTop: gap, fontSize: fs, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              <span style={{ fontFamily: 'Kanit_B', fontSize: fsLabel }}>● วันหมดอายุ: </span>
                              <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', width: expiryLineWidth }}>&nbsp;</span>
                            </div>
                          </>) : (<>
                            <div style={{ marginTop: gap, fontSize: fs, display: 'flex', gap: 2, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              <span style={{ flexShrink: 0 }}><span style={{ fontFamily: 'Kanit_B', fontSize: fsLabel }}>● เก็บรักษา: </span><span style={{ borderBottom: '1px dotted #000', display: 'inline-block', width: '22mm' }}>&nbsp;</span></span>
                              <span style={{ flexShrink: 0 }}><span style={{ fontFamily: 'Kanit_B', fontSize: fsLabel }}>Exp: </span><span style={{ borderBottom: '1px dotted #000', display: 'inline-block', width: '14mm' }}>&nbsp;</span></span>
                            </div>
                            <div style={{ marginTop: gap, fontSize: fs, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              <span style={{ fontFamily: 'Kanit_B', fontSize: fsLabel }}>● หมายเหตุ: </span>
                              <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', width: '50mm' }}>&nbsp;</span>
                            </div>
                          </>)}

                        </div>

                        {/* === FOOTER === */}
                        <div style={{ borderTop: '1px solid #000', padding: isTall ? '0.9mm 3mm' : is60 ? '0.8mm 2.5mm' : '0.5mm 2mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: isRoomy ? 8 : 7, flexShrink: 0 }}>
                          <span><span style={{ fontFamily: 'Kanit_B', fontSize: fsLabel  }}>เภสัชกร:</span>. </span>
                          
                        </div>
                      </div>
                        );
                      })()}
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter className="d-flex border" style={{ height: 60, backgroundColor: "rgba(241, 241, 241, 1)" }}>
                  <button className="btn btn-success" style={{ width: 130, height: 35, fontSize: 15, fontFamily: "Kanit" }} onClick={blankLabelPrintFn}>
                    Print
                  </button>
                  <button className="btn btn-secondary" style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }} onClick={() => onClose()}>
                    Close
                  </button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Pharmacist Selection Modal */}
        <Modal isOpen={modalPS.isOpen} onOpenChange={modalPS.onOpenChange} scrollBehavior={"inside"} size="md">
          <ModalContent className="shadow-sm rounded rounded-2 border border" style={{ backgroundColor: "rgba(255, 255, 255, 1)" }}>
            {(onClose) => (
              <>
                <ModalHeader style={{ height: 60, backgroundColor: "rgba(241, 241, 241, 1)" }}>
                  <div style={{ fontFamily: "Kanit_B", fontSize: 18 }}>เลือกเภสัชกร</div>
                </ModalHeader>
                <ModalBody>
                  <Table className="table" size="sm">
                    <thead>
                      <tr>
                        <th style={{ fontFamily: "Kanit_B" }}>ชื่อ-นามสกุล</th>
                        <th style={{ fontFamily: "Kanit_B" }}>ตำแหน่ง</th>
                        <th style={{ fontFamily: "Kanit_B", textAlign: "center" }}>เลือก</th>
                      </tr>
                    </thead>
                    <tbody className="table-group-divider">
                      {postsEmp
                        .map((emp: any) => (
                          <tr key={emp.id}>
                            <td style={{ fontFamily: "Kanit", fontSize: 14 }}>{emp.name}</td>
                            <td style={{ fontFamily: "Kanit", fontSize: 14 }}>{emp.position}</td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                className="btn btn-outline-success btn-sm"
                                style={{ fontFamily: "Kanit", fontSize: 12 }}
                                onClick={() => {
                                  localStorage.setItem("ps", String(emp.name));
                                  setSelectedPS(String(emp.name));
                                  onClose();
                                }}
                              >
                                เลือก
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </Table>
                </ModalBody>
                <ModalFooter style={{ backgroundColor: "rgba(241, 241, 241, 1)" }}>
                  <button
                    className="btn btn-secondary"
                    style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                    onClick={onClose}
                  >
                    ปิด
                  </button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>



      </div>

    )

  }


  const [drugs, setdrugs] = useState([])
  const [mu, setmu] = useState("")

  useEffect(() => {

    setTimeout(() => {
      setdrugs(JSON.parse(localStorage.getItem("dg") || "[]"))
      setmu(localStorage.getItem("mu") || "")
    }, 1000);


    //setdrugs(JSON.parse(localStorage.getItem("dg")||"")) 
  }, [Number(id_cus), Number(idF)])


  //*************check drug interaction**************************************************** */

  const result = interaction.map((pair: any) => {
    const foundA = list.some((item: any) => item.fixname === pair.fixname1);
    const foundB = list.some((item: any) => item.fixname === pair.fixname2);
    const found = foundA && foundB;

    return {
      ...pair,
      found
    };
  });

  const foundPairs = result.filter(r => r.found);


  // โหมดร้านอาหาร/คาเฟ่ : หมวดสินค้า/กริดสินค้า (ซ้าย, กว้างสุด) + ใบสั่งซื้อพร้อมปุ่มดำเนินการ (ขวา)
  // ใช้เฉพาะหน้าขายเท่านั้น — หน้าชำระเงิน (changepay === "1") ยังคง layout เดิมทุกประการ
  const restaurantLayout = posGridMode && changepay !== "1";

  /* คอลัมน์ <Beforepay /> ในโหมดร้านอาหารแทบไม่เหลืออะไรให้แสดง — การ์ดข้อมูลสินค้า/ลูกค้าถูกซ่อน
     และปุ่มดำเนินการถูก portal ไปไว้ใต้ใบสั่งซื้อแล้ว จึงบีบให้กว้าง 0 เพื่อคืนพื้นที่ให้กริดสินค้า
     ยกเว้นตอนเปิดฟอร์ม "ติดตามอาการ" (addhis === 1) ที่ยังต้องมีที่ให้กรอก
     — ตัวคอมโพเนนต์ยังถูก mount อยู่เสมอ เพราะเป็นเจ้าของ checkoutActions ที่ portal ออกไป */
  const restaurantSideCollapsed = restaurantLayout && addhis !== 1;
  // แผงสถานะคิวกินคอลัมน์ขวาสุดเป็นของตัวเองในโหมดร้านอาหาร (หน้าชำระเงินไม่ต้องมี)
  const showQueuePanel = restaurantLayout;


  return (
    <div className="row g-1" style={{ paddingLeft: 5, flexWrap: 'nowrap' }} id="after-print" suppressHydrationWarning>

      {/* ปุ่มสไลด์ซ่อน/แสดงคอลัมน์รายการสินค้า — เฉพาะหน้าชำระเงิน (จำสถานะใน localStorage) */}
      {changepay === "1" && (
        <button
          type="button"
          onClick={toggleCartHidden}
          className={styles.cartSlideToggle}
          title={cartHidden ? "แสดงรายการสินค้า" : "ซ่อนรายการสินค้า"}
          aria-label={cartHidden ? "แสดงรายการสินค้า" : "ซ่อนรายการสินค้า"}>
          {cartHidden ? <ChevronRight size={18} strokeWidth={2.4} /> : <ChevronLeft size={18} strokeWidth={2.4} />}
        </button>
      )}

      {/* โหมดชำระเงิน : บีบคอลัมน์รายการเหลือครึ่งเดียว (41.666% -> 20.833%) เพื่อให้แผงสรุปการขายกว้างขึ้น + สไลด์ซ่อนได้ */}
      {/* โหมดร้านอาหาร : ย้ายใบสั่งซื้อไปอยู่ขวาสุด (order 2) กว้าง 30% ที่เหลือยกให้กริดสินค้า */}
      <div
        className={changepay === "1" ? "col-sm-3" : restaurantLayout ? "col-sm-4" : "col-sm-8"}
        style={{
          overflow: 'hidden',
          minWidth: 0,
          order: restaurantLayout ? 2 : undefined,
          flex: (changepay === "1" && cartHidden) ? '0 0 0px' : (changepay === "1" ? '0 0 20.833%' : restaurantLayout ? '0 0 30%' : '0 0 66.666%'),
          maxWidth: (changepay === "1" && cartHidden) ? 0 : (changepay === "1" ? '20.833%' : restaurantLayout ? '30%' : undefined),
          opacity: (changepay === "1" && cartHidden) ? 0 : 1,
          transition: 'flex-basis 0.28s ease, max-width 0.28s ease, opacity 0.2s ease',
        }}>
        <div className="row-4 shadow-sm rounded border border-success  " ></div>

        <div className="container-fluid " style={{ overflow: 'hidden' }}>

          {/*ตารางรายการ sale*/}
          <div className="container" style={{ padding: 5 }}>
            {/* Hold Bill Tabs */}
            <HoldBillTabs
              currentList={list}
              currentTotal={list.reduce((acc, curr) => acc + curr.total, 0)}
              onSwitchBill={handleSwitchBill}
              onHoldCurrent={handleHoldCurrentBill}
              onRemoveBill={handleRemoveHeldBill}
            />
            <div className="row  mb-1" >

              {restaurantLayout ?
                /* โหมดร้านอาหาร/คาเฟ่ : ใบสั่งซื้อแบบแตะปรับจำนวนได้ทันที ไม่ต้องพิมพ์ */
                <div className={styles.posTicketPanel}>
                  <div className={styles.posTicketHead}>
                    <span className={styles.posTicketTitle}>🧾 รายการสั่งซื้อ</span>
                    <span className={styles.posTicketCount}>{list.length} รายการ</span>
                  </div>

                  <div className={styles.posTicketList}>
                    {list.length === 0 ? (
                      <div className={styles.posTicketEmpty}>
                        <span className={styles.posTicketEmptyIcon}>🍽️</span>
                        <div>ยังไม่มีรายการ</div>
                        <span>แตะสินค้าทางขวาเพื่อเริ่มรับออร์เดอร์</span>
                      </div>
                    ) : (
                      list.map((item: any, index: number) => {
                        const netUnitPrice = calcItemNetUnitPrice(item);
                        const unitDiscount = Number(item.price || 0) - netUnitPrice;
                        const memberDiscount = calcItemMemberDiscount(item);
                        const qty = Number(item.qty || 0);
                        return (
                          <div
                            className={styles.posTicketRow}
                            key={`${item.id}-${item.unit}`}
                            onClick={() => { setcodeproductS(item.code_product); setcostS(String(item.cost)) }}>
                            <div className={styles.posTicketRowTop}>
                              <span className={styles.posTicketIndex}>{index + 1}</span>
                              <span className={styles.posTicketName} title={item.name_product}>{item.name_product}</span>
                              <span className={styles.posTicketAmount}>{formatSaleAmount(calcItemNetTotal(item))}</span>
                            </div>

                            <div className={styles.posTicketRowBottom}>
                              <div className={styles.posTicketStepper}>
                                <button
                                  type="button"
                                  className={styles.posStepBtn}
                                  title="ลดจำนวน"
                                  aria-label="ลดจำนวน"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (qty <= 1) { deleteItem(item.id, item.unit); localStorage.setItem("itemlist", String(list.length)); return; }
                                    cut_lot_Price_manual_inline(item.code_product, String(qty - 1), item.unit);
                                  }}>−</button>
                                <span className={styles.posStepValue}>{qty}</span>
                                <button
                                  type="button"
                                  className={`${styles.posStepBtn} ${styles.posStepBtnPlus}`}
                                  title="เพิ่มจำนวน"
                                  aria-label="เพิ่มจำนวน"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cut_lot_Price_manual_inline(item.code_product, String(qty + 1), item.unit);
                                  }}>+</button>
                                <span className={styles.posTicketUnit}>{item.unit}</span>
                              </div>

                              <span className={styles.posTicketUnitPrice}>× {formatSaleAmount(netUnitPrice)}</span>

                              <button
                                type="button"
                                className={styles.posTicketDelete}
                                title="ลบรายการ"
                                aria-label="ลบรายการ"
                                onClick={(e) => { e.stopPropagation(); deleteItem(item.id, item.unit); localStorage.setItem("itemlist", String(list.length)) }}>
                                <Trash2 size={13} />
                              </button>
                            </div>

                            {(unitDiscount > 0 || memberDiscount > 0) && (
                              <div className={styles.posTicketTags}>
                                {unitDiscount > 0 && <span className={styles.posTicketTag}>ลด {formatSaleAmount(unitDiscount)}/ชิ้น</span>}
                                {memberDiscount > 0 && <span className={`${styles.posTicketTag} ${styles.posTicketTagMember}`}>สมาชิก -{formatMemberDiscountAmount(memberDiscount)}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className={styles.posTicketFoot}>
                    <span className={styles.posTicketFootLabel}>
                      รวม {list.reduce((acc, curr: any) => acc + Number(curr.qty || 0), 0)} ชิ้น
                    </span>
                    <span className={styles.posTicketFootValue}>
                      {formatSaleAmount(list.reduce((acc, curr: any) => acc + calcItemNetTotal(curr), 0))}
                      <span className={styles.posTicketFootUnit}>บาท</span>
                    </span>
                  </div>

                  {/* แถบปุ่มดำเนินการท้ายใบสั่งซื้อ — ปุ่มจริงถูก portal มาจาก Beforepay (พักบิล/ยกเลิก/ชำระเงิน) */}
                  <div ref={setPosActionDockEl} className={styles.posActionDock} />
                </div>
                :
                changepay === "1" ?
                /* โหมดชำระเงิน : ย่อรายการเป็นแบบใบเสร็จ อ่านง่ายในคอลัมน์แคบ */
                <div className={styles.payCartPanel}>
                  <div className={styles.payCartHead}>
                    <div className={styles.payCartTitle}>🧾 รายการสินค้า</div>
                    <div className={styles.payCartCount}>{list.length} รายการ</div>
                  </div>
                  <div className={styles.payCartList}>
                    {list.length === 0 ?
                      <div className={styles.payCartEmpty}>ไม่มีรายการในบิล</div>
                      :
                      list.map((item, index) => {
                        const netUnitPrice = calcItemNetUnitPrice(item);
                        const unitDiscount = Number(item.price || 0) - netUnitPrice;
                        const memberDiscount = calcItemMemberDiscount(item);
                        const expiryInfo = getPrimaryExpiryInfo(item);
                        const subQtyText = item.subQty && Number(item.subQty) !== 1
                          ? `${Math.round((Number(item.subQty) || 1) * Number(item.qty || 0) * 1000) / 1000} ${item.subUnit || item.unit}`
                          : "";
                        return (
                          <div
                            className={`${styles.payCartRow} ${index % 2 === 1 ? styles.payCartRowAlt : ''}`}
                            key={`${item.id}-${item.unit}`}>
                            <div className={styles.payCartIndex}>{index + 1}</div>
                            <div className={styles.payCartMain}>
                              <div className={styles.payCartName} title={item.name_product}>{item.name_product}</div>
                              <div className={styles.payCartMeta}>
                                <span className={styles.payCartCode}>{item.code_product}</span>
                                <span className={styles.payCartQty}>{item.qty} {item.unit} × {formatSaleAmount(netUnitPrice)}</span>
                                {subQtyText && <span className={styles.payCartSub}>({subQtyText})</span>}
                              </div>
                              {(unitDiscount > 0 || memberDiscount > 0 || expiryInfo?.rule) && (
                                <div className={styles.payCartMeta}>
                                  {unitDiscount > 0 && (
                                    <span className={styles.payCartTag}>ลด {formatSaleAmount(unitDiscount)}/ชิ้น</span>
                                  )}
                                  {memberDiscount > 0 && (
                                    <span className={`${styles.payCartTag} ${styles.payCartTagMember}`}>สมาชิก -{formatMemberDiscountAmount(memberDiscount)}</span>
                                  )}
                                  {expiryInfo?.rule && (
                                    <span className={styles.payCartExp} style={getExpiryBadgeStyle(expiryInfo.rule)} title={`Lot ${expiryInfo.lot} · ที่เก็บ ${expiryInfo.area}`}>
                                      EXP {formatExpiryShortDate(expiryInfo.date)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className={styles.payCartAmount}>
                              {unitDiscount > 0 && (
                                <div className={styles.payCartAmountOld}>{formatSaleAmount(Number(item.price || 0) * Number(item.qty || 0))}</div>
                              )}
                              <div className={styles.payCartAmountNet}>{formatSaleAmount(calcItemNetTotal(item))}</div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <div className={styles.payCartFoot}>
                    <div className={styles.payCartFootLabel}>
                      รวม {list.reduce((acc, curr: any) => acc + Number(curr.qty || 0), 0)} ชิ้น
                    </div>
                    <div className={styles.payCartFootValue}>
                      {formatSaleAmount(list.reduce((acc, curr: any) => acc + calcItemNetTotal(curr), 0))}
                      <span className={styles.payCartFootUnit}>บาท</span>
                    </div>
                  </div>
                </div>
                :
                savemu === "1" ?
                <div className={styles.salesTableContainer}>
                  <Table className="table table-borderless mb-0" size="sm" style={{ tableLayout: 'fixed', width: '100%' }}>
                    <thead>
                      <tr>
                        {!compactCartView && <th className={styles.salesTableHeader} style={{ width: "5%" }}>รูปภาพ</th>}
                        <th className={styles.salesTableHeader} style={{ width: compactCartView ? "8%" : "6%" }}>รหัส</th>
                        <th className={styles.salesTableHeaderLeft} style={{ width: showPriceTierColumn ? "22%" : (compactCartView ? "31%" : "27%") }}>ชื่อสินค้า</th>
                        {SHOW_DRUG_ALERT_COLUMNS && !compactCartView && <th className={styles.salesTableHeader} style={{ width: "5%" }}></th>}
                        {SHOW_DRUG_ALERT_COLUMNS && !compactCartView && <th className={styles.salesTableHeader} style={{ width: "5%" }}></th>}
                        <th className={styles.salesTableHeader} style={{ width: compactCartView ? "9%" : "5%" }}>จำนวน</th>
                        <th className={styles.salesTableHeader} style={{ width: compactCartView ? "9%" : "5%" }}>หน่วย</th>
                        {!compactCartView && <th className={styles.salesTableHeader} style={{ width: "7%" }}>จำนวนย่อย</th>}
                        <th className={styles.salesTableHeader} style={{ width: compactCartView ? "10%" : "6%" }}>ราคา</th>
                        <th className={styles.salesTableHeader} style={{ width: compactCartView ? "9%" : "7%" }}>ลด/ชิ้น</th>
                        <th className={styles.salesTableHeader} style={{ width: compactCartView ? "10%" : "7%" }}>ราคาใหม่</th>
                        <th className={styles.salesTableHeader} style={{ width: compactCartView ? "10%" : "6%" }}>รวม</th>
                        {showPriceTierColumn && <th className={styles.salesTableHeader} style={{ width: compactCartView ? "12%" : "9%" }}>ระดับราคา</th>}
                        {SHOW_LABEL_COLUMN && !compactCartView && <th className={styles.salesTableHeader} style={{ width: changepay === "1" ? "0%" : "5%" }}>{changepay === "1" ? "" : "ฉลาก"}</th>}
                        <th className={styles.salesTableHeader} style={{ width: changepay === "1" ? "0%" : "4%" }}>{changepay === "1" ? "" : "ลบ"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((item, index) => (
                        <tr
                          className={`${styles.salesTableRow} ${styles.salesCartRow} ${index % 2 === 0 ? styles.salesTableRowEven : styles.salesTableRowOdd}`}
                          key={`${item.id}-${item.unit}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => { setcodeproductS(item.code_product), setcostS(String(item.cost)) }}>
                          {!compactCartView && (
                          <td className={styles.salesTableCell} style={{ width: "5%", textAlign: "center", ...getExpiryProductAreaStyle(item, "start") }}>
                            <div className={styles.salesProductThumb}>
                              {(() => {
                                const productImageUrl = getRenderableProductImage(item.pic);
                                return productImageUrl ?
                                  <img className={styles.salesProductImage} alt="" src={productImageUrl} width={30} height={30} onError={() => markProductImageBroken(productImageUrl)} /> :
                                  <div className={styles.salesProductThumbEmpty}>
                                    <Package size={15} strokeWidth={1.8} />
                                  </div>;
                              })()}
                            </div>
                          </td>
                          )}
                          <td className={styles.salesTableCellCode} style={{ width: compactCartView ? "8%" : "6%", textAlign: "center", ...getExpiryProductAreaStyle(item, "middle") }}>
                            <div className={styles.salesProductCodeStack}>
                              <span className={styles.salesProductCodePill} title={item.code_product}>{item.code_product}</span>
                              {(() => {
                                const drugTypes = ["ขย.10", "ขย.11", "ขย.12", "ขย.13", "ข.ย.10", "ข.ย.11", "ข.ย.12", "ข.ย.13", "ขย.10 และ ขย.11", "ขย.10 และ ขย.12", "ขย.11 และ ขย.12"];
                                const prod = dataProduct.find((p: any) => p.code === item.code_product);
                                const matchType = prod && drugTypes.includes(prod.type) ? prod.type : null;
                                const matchSubtype = prod && drugTypes.includes(prod.subtype) ? prod.subtype : null;
                                const label = matchType || matchSubtype;
                                return label ? <span className={styles.salesDrugTypeBadge}>{label}</span> : null;
                              })()}
                            </div>
                          </td>
                          <td className={styles.salesTableCellName} style={{ width: showPriceTierColumn ? "22%" : (compactCartView ? "31%" : "27%"), maxWidth: 0, textAlign: "left", overflow: "hidden", ...getExpiryProductAreaStyle(item, "end") }}>
                            <div className={styles.salesProductTitle} title={item.name_product}>{item.name_product}</div>
                            {(() => {
                              const expiryInfo = getPrimaryExpiryInfo(item);
                              // แสดงป้าย Lot เฉพาะเมื่อวันหมดอายุตรงกับช่วงที่ตั้งค่า "แสดงสีวันหมดอายุ" เท่านั้น
                              if (!expiryInfo || !expiryInfo.rule) return null;
                              return (
                                <button
                                  type="button"
                                  className={styles.salesExpiryBadge}
                                  style={getExpiryBadgeStyle(expiryInfo.rule)}
                                  onClick={(e) => { e.stopPropagation(); openExpiryEditor(item); }}
                                  title={`แก้ไขวันหมดอายุ Lot ${expiryInfo.lot} · พื้นที่เก็บ ${expiryInfo.area}`}>
                                  <span className={styles.salesExpiryBadgeLine}>EXP {formatExpiryShortDate(expiryInfo.date)} · {formatExpiryDaysLabel(expiryInfo.daysLeft)}</span>
                                  <span className={styles.salesExpiryBadgeMeta}>Lot {expiryInfo.lot} · ที่เก็บ {expiryInfo.area}</span>
                                </button>
                              );
                            })()}
                            {(item.nme_customer || item.name_customer) && (
                              <div className={styles.salesCustomerLine}>
                                {item.nme_customer || item.name_customer}
                              </div>
                            )}

                            {(() => {
                              const lineMemberDiscount = calcItemMemberDiscount(item);
                              if (lineMemberDiscount > 0) {
                                return <div className={styles.salesMemberDiscountBadge}>ส่วนลดสมาชิก {memberDiscountPercentForSale}% -{formatMemberDiscountAmount(lineMemberDiscount)} บาท</div>;
                              }
                              if (isMemberDiscountActive && !isMemberDiscountEligibleItem(item)) {
                                return <div className={styles.salesMemberDiscountBadgeMuted}>ไม่ร่วมส่วนลดสมาชิก</div>;
                              }
                              return null;
                            })()}

                            {renderItemPromoBadges(item)}

                            {(compactCartView || changepay === "1") ? "" :
                              <>
                                <div className={styles.salesInstructionLine}>{item.indicatorlistS}</div>
                                <div className={styles.salesInstructionLine}>{item.useS}&nbsp;&nbsp;{item.timeuseS}&nbsp;&nbsp;{item.timeS}</div>
                              </>
                            }
                          </td>
                          {SHOW_DRUG_ALERT_COLUMNS && !compactCartView && (
                          <td style={{ width: "5%", textAlign: "center", padding: "6px 4px" }}>
                            {(foundPairs.filter((d: any) => d.fixname2 === String(item.fixname))[0] ||
                              foundPairs.filter((d: any) => d.fixname1 === String(item.fixname))[0]) && (
                                <span className={styles.drugInteractionBadge}>Drug Interaction</span>
                              )}
                          </td>
                          )}
                          {SHOW_DRUG_ALERT_COLUMNS && !compactCartView && (
                          <td style={{ width: "5%", textAlign: "center", padding: "6px 4px" }}>
                            {drugs.filter((w: any) => w.drugallergy === item.fixname).map((r: any) => r.drugallergy).length > 0 && (
                              <span className={styles.drugAllergyBadge}>แพ้สินค้า</span>
                            )}
                          </td>
                          )}
                          <td className={styles.salesTableCell} style={{ width: compactCartView ? "9%" : "5%", textAlign: "center" }}>
                            <QtyInput
                              item={item}
                              changepay={changepay}
                              onConfirm={cut_lot_Price_manual_inline}
                            />
                          </td>
                          <td className={styles.salesTableCell} style={{ width: compactCartView ? "9%" : "5%", textAlign: "center" }}>
                            <button
                              disabled={changepay === "1"}
                              className={styles.salesUnitButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchUnitConversions(item.code_product, item);
                              }}>
                              {item.unit}
                            </button>
                          </td>
                          {!compactCartView && (
                          <td className={styles.salesTableCellAction} style={{ width: "7%" }}>
                            {(() => {
                              const bal = getProductBalance(item.id_product);
                              const prod = productMap.get(item.id_product) || productMapByCode.get(item.code_product);
                              const minVal = prod?.Min || 0;
                              const ropVal = prod?.ROP || 0;
                              const belowMin = minVal > 0 && bal < minVal;
                              const belowRop = !belowMin && ropVal > 0 && bal < ropVal;
                              return (
                                <div className={styles.salesStockBox}>
                                  <div className={styles.salesStockQty}>{Math.round((item.subQty || 1) * item.qty * 1000) / 1000}</div>
                                  <div className={styles.salesStockUnit}>{item.subUnit || item.unit}</div>
                                  <div className={`${styles.salesStockBalance} ${bal < 1 ? styles.salesStockBalanceDanger : bal <= 2 ? styles.salesStockBalanceWarn : ''}`}>คงเหลือ {bal}</div>
                                  {belowMin && (
                                    <div className={`${styles.salesStockWarningBadge} ${styles.salesStockWarningDanger}`}>ต่ำกว่า MIN</div>
                                  )}
                                  {belowRop && (
                                    <div className={`${styles.salesStockWarningBadge} ${styles.salesStockWarningWarn}`}>ต่ำกว่า ROP</div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          )}
                          <td className={styles.salesTableCellAction} style={{ width: compactCartView ? "10%" : "6%" }}>
                            <button
                              disabled={changepay === "1" || String(localStorage.getItem("level_")) === "level1"}
                              className={styles.salesPriceButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                modalPrice.onOpen();
                                setEditedPriceNew(String(item.price));
                                setEditedpriceAct(String(item.price));
                                setEditedcode(String(item.code_product));
                                setEditedunit(String(item.unit || ""));
                                setEditedname(String(item.name_product));
                              }}>
                              {item.price}
                            </button>
                          </td>
                          <td className={styles.salesTableCellAction} style={{ width: compactCartView ? "9%" : "7%" }}>
                            <>
                              <button
                                disabled={changepay === "1" || String(localStorage.getItem("level_")) === "level1"}
                                className={styles.salesDiscountEditButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  modal2.onOpen(),
                                    setEditedpriceDis(String(item.discount)),
                                    setEditedpriceAct(String(item.price)),
                                    setEditedcode(String(item.code_product)),
                                    setEditedunit(String(item.unit || "")),
                                    setEditedname(String(item.name_product))
                                }}>
                                {Number(list.filter((supplier: any) => supplier.id === Number(item.id) && supplier.unit === item.unit).map((supplier: any) => supplier.discount))}
                              </button>
                              <Modal isOpen={modal2.isOpen} onOpenChange={modal2.onOpenChange} scrollBehavior={"inside"}>
                                <ModalContent className=" shadow-sm rounded rounded-2 border border" style={{ backgroundColor: "rgba(255, 255, 255, 1)", width: 500, height: 270 }}>
                                  {(onClose) => (
                                    <>
                                      <ModalBody >
                                        <div style={{ width: "auto", marginTop: 15, height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>{editedcode}</div>
                                        <div style={{ width: "auto", height: 30, fontSize: 16, fontFamily: "Kanit_B" }}>{editedTaskname}</div>
                                        <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                                            ราคาจาก : {priceAct}  บาท   ลดราคาชิ้นละ</div>

                                          <input
                                            autoFocus
                                            className="form-control form-control-sm mt-1"
                                            style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                                            value={priceDis}
                                            onChange={(e) => setEditedpriceDis(e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                cut_lot_Discount_manual();
                                                onClose();
                                              }
                                            }}
                                          />
                                          <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>บาท</div>
                                        </div>
                                        <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>คงเหลือ : {Number(item.price) - Number(priceDis)} บาท</div>
                                      </ModalBody>
                                      <ModalFooter className="d-flex border " style={{ height: 80, backgroundColor: "rgba(241, 241, 241, 1)" }}>
                                        <button
                                          className="btn btn-success"
                                          style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                                          onClick={() => {
                                            cut_lot_Discount_manual(),
                                              onClose()
                                          }}>
                                          OK
                                        </button>
                                        <button
                                          className="btn btn-secondary"
                                          style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                                          onClick={onClose}>
                                          Close
                                        </button>
                                      </ModalFooter>
                                    </>
                                  )}
                                </ModalContent>
                              </Modal>
                            </>
                          </td>
                          <td className={styles.salesTableCellPrice} style={{ width: compactCartView ? "10%" : "7%" }}>
                            <div className={styles.salesLotStack}>
                              <div className={styles.salesLotValue}>{formatSaleAmount(calcItemNetUnitPrice(item))}</div>
                            {[1, 2, 3].map((n) => {
                              const qty = (item as any)[`qty_lot${n}`];
                              const lot = (item as any)[`lot_receive${n}`];
                              if (!qty || !lot) return null;
                              return (
                                <div key={n} className={styles.salesLotCode} title={`Lot ${lot} (จำนวน ${qty})`}>
                                  {lot}
                                </div>
                              );
                            })}
                            </div>
                          </td>
                          <td className={styles.salesTableCellTotal} style={{ width: compactCartView ? "10%" : "6%" }}>
                            <div className={styles.salesTotalStack}>
                              <div className={styles.salesTotalValue}>{formatSaleAmount(calcItemNetTotal(item))}</div>
                            {[1, 2, 3].map((n) => {
                              const qty = (item as any)[`qty_lot${n}`];
                              const rid = (item as any)[`id_receive${n}`];
                              if (!qty) return null;
                              const rc = rcById.get(Number(rid));
                              const exp = rc?.dateExp;
                              if (!exp) return null;
                              const d = new Date(exp);
                              if (isNaN(d.getTime())) return null;
                              const expRule = getExpiryRuleForDate(d, expiryColorRules);
                              if (!expRule) return null;
                              const expStr = d.toLocaleDateString("th-TH", { year: "2-digit", month: "2-digit", day: "2-digit" });
                              return (
                                <button
                                  type="button"
                                  key={n}
                                  className={`${styles.salesExpText} ${styles.salesExpButton}`}
                                  style={getExpiryBadgeStyle(expRule)}
                                  onClick={(e) => { e.stopPropagation(); openExpiryEditor(item); }}
                                  title={`EXP ${expStr} (จำนวน ${qty})`}>
                                  {expStr}
                                </button>
                              );
                            })}
                            </div>
                          </td>
                          {showPriceTierColumn && (
                          <td className={styles.salesTableCellAction} style={{ width: compactCartView ? "9%" : "5%" }}>
                            <button
                              type="button"
                              className={`${styles.salesTierButton} ${item.priceTier ? styles.salesTierButtonCustom : ""}`}
                              title={`ระดับราคาของรายการนี้ : ${getItemPriceTier(item)} (คลิกเพื่อเปลี่ยนระดับราคา)`}
                              onClick={(e) => { e.stopPropagation(); openPriceTierPicker(item); }}>
                              {formatPriceTierShort(getItemPriceTier(item))}
                            </button>
                          </td>
                          )}
                          {SHOW_LABEL_COLUMN && !compactCartView && (
                          <td className={styles.salesTableCellAction} style={{ width: changepay === "1" ? "0%" : "4%" }}>
                            {changepay === "1" ? "" :
                              <input
                                className={styles.salesLabelCheckbox}
                                type="checkbox"
                                value=""
                                id="invalidCheck2"
                                required
                                title="พิมพ์ฉลาก"
                                checked={item.label}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => { setIsChecked(e.target.checked), setList(list.map((task) => task.id === item.id ? { ...task, label: e.target.checked } : task)) }}
                              />}
                          </td>
                          )}
                          <td className={styles.salesTableCellAction} style={{ width: changepay === "1" ? "0%" : "4%", textAlign: "center" }}>
                            {changepay === "1" ? "" :
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteItem(item.id, item.unit), localStorage.setItem("itemlist", String(list.length)) }}
                                type="button"
                                className={styles.salesDeleteButton}
                                title="ลบรายการ"
                                aria-label="ลบรายการ">
                                <Trash2 size={13} />
                              </button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                :

                <div className={styles.salesTableContainer}>
                  <Table className="table table-borderless mb-0" size="sm" style={{ tableLayout: 'fixed', width: '100%' }}>
                    <thead>
                      <tr>
                        {!compactCartView && <th className={styles.salesTableHeader} style={{ width: "8%" }}>รหัส</th>}
                        <th className={styles.salesTableHeaderLeft} style={{ width: showPriceTierColumn ? (compactCartView ? "31%" : "28%") : (compactCartView ? "40%" : "33%") }}>ชื่อสินค้า</th>
                        {SHOW_DRUG_ALERT_COLUMNS && !compactCartView && <th className={styles.salesTableHeader} style={{ width: "5%" }}></th>}
                        {SHOW_DRUG_ALERT_COLUMNS && !compactCartView && <th className={styles.salesTableHeader} style={{ width: "5%" }}></th>}
                        <th className={styles.salesTableHeader} style={{ width: compactCartView ? "10%" : "5%" }}>จำนวน</th>
                        <th className={styles.salesTableHeader} style={{ width: compactCartView ? "10%" : "5%" }}>หน่วย</th>
                        {!compactCartView && <th className={styles.salesTableHeader} style={{ width: "7%" }}>จำนวน</th>}
                        <th className={styles.salesTableHeader} style={{ width: compactCartView ? "12%" : "6%" }}>ราคา</th>
                        {!compactCartView && <th className={styles.salesTableHeader} style={{ width: "7%" }}>ลด/ชิ้น</th>}
                        <th className={styles.salesTableHeader} style={{ width: compactCartView ? "12%" : "7%" }}>ราคาใหม่</th>
                        <th className={styles.salesTableHeader} style={{ width: compactCartView ? "12%" : "6%" }}>รวม</th>
                        {showPriceTierColumn && <th className={styles.salesTableHeader} style={{ width: compactCartView ? "12%" : "9%" }}>ระดับราคา</th>}
                        {SHOW_LABEL_COLUMN && !compactCartView && <th className={styles.salesTableHeader} style={{ width: changepay === "1" ? "0%" : "4%" }}>{changepay === "1" ? "" : "ฉลาก"}</th>}
                        <th className={styles.salesTableHeader} style={{ width: changepay === "1" ? "0%" : "4%" }}>{changepay === "1" ? "" : "ลบ"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((item, index) => (
                        <tr
                          className={`${styles.salesTableRow} ${styles.salesCartRow} ${index % 2 === 0 ? styles.salesTableRowEven : styles.salesTableRowOdd}`}
                          key={`${item.id}-${item.unit}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => { setcodeproductS(item.code_product), setcostS(String(item.cost)) }}>
                          {!compactCartView && (
                          <td className={styles.salesTableCellCode} style={{ width: "8%", textAlign: "center", ...getExpiryProductAreaStyle(item, "start") }}>
                            <div className={styles.salesProductCodeStack}>
                              <span className={styles.salesProductCodePill} title={item.code_product}>{item.code_product}</span>
                            {(() => {
                              const drugTypes = ["ขย.10", "ขย.11", "ขย.12", "ขย.13", "ข.ย.10", "ข.ย.11", "ข.ย.12", "ข.ย.13", "ขย.10 และ ขย.11", "ขย.10 และ ขย.12", "ขย.11 และ ขย.12"];
                              const prod = dataProduct.find((p: any) => p.code === item.code_product);
                              const matchSubtype = prod && drugTypes.includes(prod.subtype) ? prod.subtype : null;
                              return matchSubtype ? <span className={styles.salesDrugTypeBadge}>{matchSubtype}</span> : null;
                            })()}
                            </div>
                          </td>
                          )}
                          <td className={styles.salesTableCellName} style={{ width: showPriceTierColumn ? (compactCartView ? "31%" : "28%") : (compactCartView ? "40%" : "33%"), maxWidth: 0, textAlign: "left", overflow: "hidden", ...getExpiryProductAreaStyle(item, "end") }}>
                            <div className={styles.salesProductTitle} title={item.name_product}>{item.name_product}</div>
                            {(() => {
                              const expiryInfo = getPrimaryExpiryInfo(item);
                              // แสดงป้าย Lot เฉพาะเมื่อวันหมดอายุตรงกับช่วงที่ตั้งค่า "แสดงสีวันหมดอายุ" เท่านั้น
                              if (!expiryInfo || !expiryInfo.rule) return null;
                              return (
                                <button
                                  type="button"
                                  className={styles.salesExpiryBadge}
                                  style={getExpiryBadgeStyle(expiryInfo.rule)}
                                  onClick={(e) => { e.stopPropagation(); openExpiryEditor(item); }}
                                  title={`แก้ไขวันหมดอายุ Lot ${expiryInfo.lot} · พื้นที่เก็บ ${expiryInfo.area}`}>
                                  <span className={styles.salesExpiryBadgeLine}>EXP {formatExpiryShortDate(expiryInfo.date)} · {formatExpiryDaysLabel(expiryInfo.daysLeft)}</span>
                                  <span className={styles.salesExpiryBadgeMeta}>Lot {expiryInfo.lot} · ที่เก็บ {expiryInfo.area}</span>
                                </button>
                              );
                            })()}
                            {(item.nme_customer || item.name_customer) && (
                              <div className={styles.salesCustomerLine}>
                                {item.nme_customer || item.name_customer}
                              </div>
                            )}
                            {(() => {
                              const lineMemberDiscount = calcItemMemberDiscount(item);
                              if (lineMemberDiscount > 0) {
                                return <div className={styles.salesMemberDiscountBadge}>ส่วนลดสมาชิก {memberDiscountPercentForSale}% -{formatMemberDiscountAmount(lineMemberDiscount)} บาท</div>;
                              }
                              if (isMemberDiscountActive && !isMemberDiscountEligibleItem(item)) {
                                return <div className={styles.salesMemberDiscountBadgeMuted}>ไม่ร่วมส่วนลดสมาชิก</div>;
                              }
                              return null;
                            })()}
                            {renderItemPromoBadges(item)}
                            {(() => {
                              const drugTypes = ["ขย.10", "ขย.11", "ขย.12", "ขย.13", "ข.ย.10", "ข.ย.11", "ข.ย.12", "ข.ย.13", "ขย.10 และ ขย.11", "ขย.10 และ ขย.12", "ขย.11 และ ขย.12"];
                              const prod = dataProduct.find((p: any) => p.code === item.code_product);
                              const matchType = prod && drugTypes.includes(prod.type) ? prod.type : null;
                              const matchSubtype = prod && drugTypes.includes(prod.subtype) ? prod.subtype : null;
                              const label = matchType || matchSubtype;
                              return label ? <div className={styles.salesInstructionLine}>{label}</div> : null;
                            })()}
                          </td>
                          {SHOW_DRUG_ALERT_COLUMNS && !compactCartView && (
                          <td style={{ width: "5%", textAlign: "center", padding: "6px 4px" }}>
                            {(foundPairs.filter((d: any) => d.fixname2 === String(item.fixname))[0] ||
                              foundPairs.filter((d: any) => d.fixname1 === String(item.fixname))[0]) && (
                                <span className={styles.drugInteractionBadge}>Drug Interaction</span>
                              )}
                          </td>
                          )}
                          {SHOW_DRUG_ALERT_COLUMNS && !compactCartView && (
                          <td style={{ width: "5%", textAlign: "center", padding: "6px 4px" }}>
                            {drugs.filter((w: any) => w.drugallergy === item.fixname).map((r: any) => r.drugallergy).length > 0 && (
                              <span className={styles.drugAllergyBadge}>แพ้สินค้า</span>
                            )}
                          </td>
                          )}
                          <td className={styles.salesTableCell} style={{ width: compactCartView ? "9%" : "5%", textAlign: "center" }}>
                            <QtyInput
                              item={item}
                              changepay={changepay}
                              onConfirm={cut_lot_Price_manual_inline}
                            />
                          </td>
                          <td className={styles.salesTableCell} style={{ width: compactCartView ? "9%" : "5%", textAlign: "center" }}>
                            <button
                              disabled={changepay === "1"}
                              className={styles.salesUnitButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchUnitConversions(item.code_product, item);
                              }}>
                              {item.unit}
                            </button>
                          </td>
                          {!compactCartView && (
                          <td className={styles.salesTableCellAction} style={{ width: "7%" }}>
                            {(() => {
                              const bal = getProductBalance(item.id_product);
                              const prod = productMap.get(item.id_product) || productMapByCode.get(item.code_product);
                              const minVal = prod?.Min || 0;
                              const ropVal = prod?.ROP || 0;
                              const belowMin = minVal > 0 && bal < minVal;
                              const belowRop = !belowMin && ropVal > 0 && bal < ropVal;
                              return (
                                <div className={styles.salesStockBox}>
                                  <div className={styles.salesStockQty}>{Math.round((item.subQty || 1) * item.qty * 1000) / 1000}</div>
                                  <div className={styles.salesStockUnit}>{item.subUnit || item.unit}</div>
                                  <div className={`${styles.salesStockBalance} ${bal < 1 ? styles.salesStockBalanceDanger : bal <= 2 ? styles.salesStockBalanceWarn : ''}`}>คงเหลือ {bal}</div>
                                  {belowMin && (
                                    <div className={`${styles.salesStockWarningBadge} ${styles.salesStockWarningDanger}`}>ต่ำกว่า MIN</div>
                                  )}
                                  {belowRop && (
                                    <div className={`${styles.salesStockWarningBadge} ${styles.salesStockWarningWarn}`}>ต่ำกว่า ROP</div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          )}
                          <td className={styles.salesTableCellAction} style={{ width: compactCartView ? "10%" : "6%" }}>
                            <button
                              disabled={changepay === "1" || String(localStorage.getItem("level_")) === "level1"}
                              className={styles.salesPriceButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                modalPrice.onOpen();
                                setEditedPriceNew(String(item.price));
                                setEditedpriceAct(String(item.price));
                                setEditedcode(String(item.code_product));
                                setEditedunit(String(item.unit || ""));
                                setEditedname(String(item.name_product));
                              }}>
                              {item.price}
                            </button>
                          </td>
                          <td className={styles.salesTableCellAction} style={{ width: compactCartView ? "9%" : "7%" }}>
                            <>
                              <button
                                disabled={changepay === "1" || String(localStorage.getItem("level_")) === "level1"}
                                className={styles.salesDiscountEditButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  modal2.onOpen(),
                                    setEditedpriceDis(String(item.discount)),
                                    setEditedpriceAct(String(item.price)),
                                    setEditedcode(String(item.code_product)),
                                    setEditedunit(String(item.unit || "")),
                                    setEditedname(String(item.name_product))
                                }}>
                                {Number(list.filter((supplier: any) => supplier.id === Number(item.id) && supplier.unit === item.unit).map((supplier: any) => supplier.discount))}
                              </button>
                              <Modal isOpen={modal2.isOpen} onOpenChange={modal2.onOpenChange} scrollBehavior={"inside"}>
                                <ModalContent className=" shadow-sm rounded rounded-2 border border" style={{ backgroundColor: "rgba(255, 255, 255, 1)", width: 500, height: 270 }}>
                                  {(onClose) => (
                                    <>
                                      <ModalBody >
                                        <div style={{ width: "auto", marginTop: 15, height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>{editedcode}</div>
                                        <div style={{ width: "auto", height: 30, fontSize: 16, fontFamily: "Kanit_B" }}>{editedTaskname}</div>
                                        <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                                            ราคาจาก : {priceAct}  บาท   ลดราคาชิ้นละ</div>

                                          <input
                                            autoFocus
                                            className="form-control form-control-sm mt-1"
                                            style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                                            value={priceDis}
                                            onChange={(e) => setEditedpriceDis(e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                cut_lot_Discount_manual();
                                                onClose();
                                              }
                                            }}
                                          />
                                          <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>บาท</div>
                                        </div>
                                        <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>คงเหลือ : {Number(item.price) - Number(priceDis)} บาท</div>
                                      </ModalBody>
                                      <ModalFooter className="d-flex border " style={{ height: 80, backgroundColor: "rgba(241, 241, 241, 1)" }}>
                                        <button
                                          className="btn btn-success"
                                          style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                                          onClick={() => {
                                            cut_lot_Discount_manual(),
                                              onClose()
                                          }}>
                                          OK
                                        </button>
                                        <button
                                          className="btn btn-secondary"
                                          style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                                          onClick={onClose}>
                                          Close
                                        </button>
                                      </ModalFooter>
                                    </>
                                  )}
                                </ModalContent>
                              </Modal>
                            </>
                          </td>
                          <td className={styles.salesTableCellPrice} style={{ width: compactCartView ? "10%" : "7%" }}>
                            <div className={styles.salesLotStack}>
                              <div className={styles.salesLotValue}>{formatSaleAmount(calcItemNetUnitPrice(item))}</div>
                            {[1, 2, 3].map((n) => {
                              const qty = (item as any)[`qty_lot${n}`];
                              const lot = (item as any)[`lot_receive${n}`];
                              if (!qty || !lot) return null;
                              return (
                                <div key={n} className={styles.salesLotCode} title={`Lot ${lot} (จำนวน ${qty})`}>
                                  {lot}
                                </div>
                              );
                            })}
                            </div>
                          </td>
                          <td className={styles.salesTableCellTotal} style={{ width: compactCartView ? "10%" : "6%" }}>
                            <div className={styles.salesTotalStack}>
                              <div className={styles.salesTotalValue}>{formatSaleAmount(calcItemNetTotal(item))}</div>
                            {[1, 2, 3].map((n) => {
                              const qty = (item as any)[`qty_lot${n}`];
                              const rid = (item as any)[`id_receive${n}`];
                              if (!qty) return null;
                              const rc = rcById.get(Number(rid));
                              const exp = rc?.dateExp;
                              if (!exp) return null;
                              const d = new Date(exp);
                              if (isNaN(d.getTime())) return null;
                              const expRule = getExpiryRuleForDate(d, expiryColorRules);
                              if (!expRule) return null;
                              const expStr = d.toLocaleDateString("th-TH", { year: "2-digit", month: "2-digit", day: "2-digit" });
                              return (
                                <button
                                  type="button"
                                  key={n}
                                  className={`${styles.salesExpText} ${styles.salesExpButton}`}
                                  style={getExpiryBadgeStyle(expRule)}
                                  onClick={(e) => { e.stopPropagation(); openExpiryEditor(item); }}
                                  title={`EXP ${expStr} (จำนวน ${qty})`}>
                                  {expStr}
                                </button>
                              );
                            })}
                            </div>
                          </td>
                          {showPriceTierColumn && (
                          <td className={styles.salesTableCellAction} style={{ width: compactCartView ? "9%" : "5%" }}>
                            <button
                              type="button"
                              className={`${styles.salesTierButton} ${item.priceTier ? styles.salesTierButtonCustom : ""}`}
                              title={`ระดับราคาของรายการนี้ : ${getItemPriceTier(item)} (คลิกเพื่อเปลี่ยนระดับราคา)`}
                              onClick={(e) => { e.stopPropagation(); openPriceTierPicker(item); }}>
                              {formatPriceTierShort(getItemPriceTier(item))}
                            </button>
                          </td>
                          )}
                          {SHOW_LABEL_COLUMN && !compactCartView && (
                          <td className={styles.salesTableCellAction} style={{ width: changepay === "1" ? "0%" : "4%" }}>
                            {changepay === "1" ? "" :
                              <input
                                className={styles.salesLabelCheckbox}
                                type="checkbox"
                                value=""
                                id="invalidCheck2"
                                required
                                title="พิมพ์ฉลาก"
                                checked={item.label}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => { setIsChecked(e.target.checked), setList(list.map((task) => task.id === item.id ? { ...task, label: e.target.checked } : task)) }}
                              />}
                          </td>
                          )}
                          <td className={styles.salesTableCellAction} style={{ width: changepay === "1" ? "0%" : "4%", textAlign: "center" }}>
                            {changepay === "1" ? "" :
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteItem(item.id, item.unit), localStorage.setItem("itemlist", String(list.length)) }}
                                type="button"
                                className={styles.salesDeleteButton}
                                title="ลบรายการ"
                                aria-label="ลบรายการ">
                                <Trash2 size={13} />
                              </button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              }

            </div>
          </div>


        </div>
      </div>
      {/* โหมดร้านอาหาร/คาเฟ่ : คอลัมน์ซ้าย (order 1) — เลือกหมวดสินค้าแล้วแตะการ์ดสินค้าเพื่อเพิ่มลงบิล */}
      {restaurantLayout && (
        <div className="col-sm" style={{ order: 1, flex: '1 1 0%', minWidth: 0, overflow: 'hidden', padding: '5px 5px 5px 0' }}>
          <ProductCatalogPanel
            products={dataProduct}
            priceTier={paystore}
            cartQtyByProductId={cartQtyByProductId}
            onPick={handleCatalogPick}
          />
        </div>
      )}

      {/* โหมดชำระเงิน : overflow ต้องเป็น visible ไม่งั้น sticky ของแถบปุ่มชำระเงินจะถูก clip */}
      {/* โหมดร้านอาหาร : บีบเหลือ 0 (ดู restaurantSideCollapsed) แต่ยัง mount ไว้เพราะเป็นเจ้าของปุ่มดำเนินการที่ portal ไปใต้ใบสั่งซื้อ */}
      <div
        className="col-sm"
        style={{
          order: restaurantLayout ? 3 : undefined,
          flex: restaurantSideCollapsed ? '0 0 0px' : restaurantLayout ? '0 0 26%' : '1 1 0%',
          maxWidth: restaurantSideCollapsed ? 0 : restaurantLayout ? '26%' : undefined,
          padding: restaurantSideCollapsed ? 0 : undefined,
          minWidth: 0,
          overflow: changepay === "1" ? 'visible' : 'hidden',
          transition: 'flex-basis 0.28s ease, max-width 0.28s ease',
        }}>

        {changepay === "1" ? < Afterpay /> : < Beforepay />}
      </div>

      {/* คอลัมน์ขวาสุดของหน้าขาย (โหมดร้านอาหาร): ลูกค้าของบิล อยู่เหนือแผงสถานะคิว */}
      {showQueuePanel && (
        <div
          className="col-sm"
          style={{ order: 4, flex: '0 0 236px', maxWidth: 236, minWidth: 0, overflow: 'hidden', padding: 0 }}>
          <div className={styles.posSideColumn}>
            <button
              type="button"
              className={styles.tableLayoutBtn}
              onClick={() => setShowTableLayout(true)}
              title="จัดวาง Layout โต๊ะ"
            >
              <Grid3X3 size={15} strokeWidth={2.2} />
              <span>จัดโต๊ะ</span>
            </button>
            <CustomerCommand layout="stack" />
            <SaleQueuePanel company={companyS} />
          </div>
          <TableLayoutModal open={showTableLayout} onClose={() => setShowTableLayout(false)} />
        </div>
      )}

      <Modal isOpen={expiryEditItem !== null} onOpenChange={(open) => { if (!open) { setExpiryEditItem(null); setExpiryEditRows([]); } }} scrollBehavior="inside">
        <ModalContent className="shadow-sm rounded rounded-2 border border" style={{ backgroundColor: "#ffffff", width: 560, maxHeight: 520 }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontFamily: "Kanit_B", fontSize: 16, color: "#0f172a" }}>
                แก้ไขวันหมดอายุ Lot ที่จะตัดสต๊อก
              </ModalHeader>
              <ModalBody style={{ padding: 16 }}>
                <div style={{ fontFamily: "Kanit_B", fontSize: 14, color: "#0f172a", marginBottom: 4 }}>
                  {expiryEditItem?.code_product} · {expiryEditItem?.name_product}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 150px", gap: 8, fontFamily: "Kanit_B", fontSize: 11, color: "#64748b", padding: "8px 10px" }}>
                  <div>Lot</div>
                  <div style={{ textAlign: "center" }}>จำนวน</div>
                  <div>วันหมดอายุ</div>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {expiryEditRows.map((row) => (
                    <div key={row.lotId} style={{ display: "grid", gridTemplateColumns: "1fr 70px 150px", gap: 8, alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, background: "#ffffff" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: "Kanit_B", fontSize: 13, color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.lot}</div>
                        <div style={{ fontFamily: "Kanit", fontSize: 10, color: "#94a3b8" }}>ID {row.lotId}</div>
                      </div>
                      <div style={{ fontFamily: "Kanit_B", fontSize: 13, textAlign: "center", color: "#0f766e" }}>{row.qty}</div>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={row.dateExp}
                        disabled={expiryEditSaving || changepay === "1"}
                        onChange={(e) => setExpiryEditRows((prev) => prev.map((item) => item.lotId === row.lotId ? { ...item, dateExp: e.target.value } : item))}
                        style={{ fontFamily: "Kanit", fontSize: 12, height: 32 }}
                      />
                    </div>
                  ))}
                </div>
              </ModalBody>
              <ModalFooter className="d-flex border" style={{ height: 72, backgroundColor: "#f8fafc" }}>
                <button
                  className="btn btn-success"
                  disabled={expiryEditSaving || changepay === "1"}
                  style={{ minWidth: 92, height: 36, fontSize: 14, fontFamily: "Kanit" }}
                  onClick={saveExpiryEditRows}>
                  {expiryEditSaving ? "กำลังบันทึก" : "บันทึก"}
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={expiryEditSaving}
                  style={{ minWidth: 82, height: 36, fontSize: 14, fontFamily: "Kanit" }}
                  onClick={() => { setExpiryEditItem(null); setExpiryEditRows([]); onClose(); }}>
                  ปิด
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal เปลี่ยนหน่วยสินค้า */}
      <Modal isOpen={modalUnitChange.isOpen} onOpenChange={modalUnitChange.onOpenChange} scrollBehavior={"inside"} size="5xl">
        <ModalContent className="shadow-sm rounded rounded-2 border border !max-w-[1200px] !w-[1200px]" style={{ backgroundColor: "rgba(255, 255, 255, 1)", maxHeight: "85vh" }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ backgroundColor: "rgba(241, 241, 241, 1)", fontFamily: "Kanit_B", fontSize: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>เปลี่ยนหน่วยสินค้า</span>
                <span style={{ fontSize: 16, color: "#d32f2f", border: "1px solid #d32f2f", padding: "2px 10px", borderRadius: "4px", backgroundColor: "#ffebee" }}>
                  {paystore || "หน้าร้าน"}
                </span>
              </ModalHeader>
              <ModalBody>
                <div style={{ fontSize: 14, fontFamily: "Kanit", marginBottom: 10 }}>
                  <strong>รหัส:</strong> {selectedUnitItem?.code_product} | <strong>ชื่อ:</strong> {selectedUnitItem?.name_product}
                </div>
                <Table className="table table-bordered table-hover" size="lg">
                  <thead style={{ backgroundColor: "#f5f5f5" }}>
                    <tr>
                      <th style={{ fontFamily: "Kanit_B", textAlign: "center", width: "10%" }}>จำนวนสินค้า</th>
                      <th style={{ fontFamily: "Kanit_B", textAlign: "center", width: "10%" }}>หน่วย</th>
                      <th style={{ fontFamily: "Kanit_B", textAlign: "center", width: "10%" }}>จำนวนย่อย</th>
                      <th style={{ fontFamily: "Kanit_B", textAlign: "center", width: "10%" }}>หน่วยย่อย</th>
                      <th style={{ fontFamily: "Kanit_B", textAlign: "center", width: "10%" }}>หน้าร้าน</th>
                      <th style={{ fontFamily: "Kanit_B", textAlign: "center", width: "10%" }}>ราคาส่ง</th>
                      <th style={{ fontFamily: "Kanit_B", textAlign: "center", width: "10%" }}>สมาชิก</th>
                      <th style={{ fontFamily: "Kanit_B", textAlign: "center", width: "10%" }}>ราคา A</th>
                      <th style={{ fontFamily: "Kanit_B", textAlign: "center", width: "10%" }}>ราคา B</th>
                      <th style={{ fontFamily: "Kanit_B", textAlign: "center", width: "10%" }}>เลือก</th>
                    </tr>
                  </thead>
                  <tbody className="table-group-divider">
                    {unitOptions.map((unitOpt, index) => (
                      <tr key={unitOpt.id || index} style={{ backgroundColor: unitOpt.isBase ? "#F3F8FC" : "white" }}>
                        <td style={{ fontFamily: "Kanit", fontSize: 14, textAlign: "center" }}>{unitOpt.qty}</td>
                        <td style={{ fontFamily: "Kanit", fontSize: 14, textAlign: "center" }}>{unitOpt.saleUnit}</td>
                        <td style={{ fontFamily: "Kanit", fontSize: 14, textAlign: "center" }}>{unitOpt.subQty}</td>
                        <td style={{ fontFamily: "Kanit", fontSize: 14, textAlign: "center" }}>{unitOpt.subUnit}</td>
                        <td style={{ fontFamily: "Kanit", fontSize: 14, textAlign: "center" }}>{unitOpt.price.toFixed(2)}</td>
                        <td style={{ fontFamily: "Kanit", fontSize: 14, textAlign: "center" }}>{(unitOpt.priceWholesale || 0).toFixed(2)}</td>
                        <td style={{ fontFamily: "Kanit", fontSize: 14, textAlign: "center" }}>{(unitOpt.priceOnline || 0).toFixed(2)}</td>
                        <td style={{ fontFamily: "Kanit", fontSize: 14, textAlign: "center" }}>{(unitOpt.priceA || 0).toFixed(2)}</td>
                        <td style={{ fontFamily: "Kanit", fontSize: 14, textAlign: "center" }}>{(unitOpt.priceB || 0).toFixed(2)}</td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            className="btn btn-outline-success btn-sm"
                            style={{ fontFamily: "Kanit", fontSize: 12 }}
                            onClick={() => {
                              handleUnitSelect(unitOpt);
                              onClose();
                            }}
                          >
                            เลือก
                          </button>
                        </td>
                      </tr>
                    ))}
                    {unitOptions.length === 0 && (
                      <tr>
                        <td colSpan={10} style={{ textAlign: "center", fontFamily: "Kanit", color: "#888" }}>
                          ไม่พบข้อมูลหน่วยสินค้า
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </ModalBody>
              <ModalFooter style={{ backgroundColor: "rgba(241, 241, 241, 1)" }}>
                <button
                  className="btn btn-secondary"
                  style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                  onClick={onClose}
                >
                  ปิด
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal แก้ไขราคาสินค้า (ชั่วคราวเฉพาะบิลนี้) */}
      <Modal isOpen={modalPrice.isOpen} onOpenChange={modalPrice.onOpenChange} scrollBehavior={"inside"}>
        <ModalContent className="shadow-sm rounded rounded-2 border border" style={{ backgroundColor: "rgba(255, 255, 255, 1)", width: 500, height: 270 }}>
          {(onClose) => (
            <>
              <ModalBody>
                <div style={{ width: "auto", marginTop: 15, height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>{editedcode}</div>
                <div style={{ width: "auto", height: 30, fontSize: 16, fontFamily: "Kanit_B" }}>{editedTaskname}</div>
                <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
                  <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                    ราคาเดิม : {priceAct} บาท &nbsp;&nbsp; ราคาใหม่</div>
                  <input
                    autoFocus
                    className="form-control form-control-sm mt-1"
                    style={{ width: 70, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                    value={editedPriceNew}
                    onChange={(e) => setEditedPriceNew(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        cut_lot_Price_edit();
                        onClose();
                      }
                    }}
                  />
                  <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>บาท</div>
                </div>
                <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 5 }}>ราคาที่แก้ไข : {editedPriceNew} บาท</div>
              </ModalBody>
              <ModalFooter className="d-flex border" style={{ height: 80, backgroundColor: "rgba(241, 241, 241, 1)" }}>
                <button
                  className="btn btn-success"
                  style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                  onClick={() => {
                    cut_lot_Price_edit();
                    onClose();
                  }}>
                  OK
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                  onClick={onClose}>
                  Close
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {/* Modal ปรับระดับราคาขายเฉพาะรายการ (สิทธิ์ B5) */}
      <Modal isOpen={modalPriceTier.isOpen} onOpenChange={modalPriceTier.onOpenChange} scrollBehavior={"inside"} size="2xl">
        <ModalContent className="shadow-sm rounded rounded-2 border border" style={{ backgroundColor: "#ffffff", maxHeight: "85vh" }}>
          {(onClose) => (
            <>
              <ModalHeader className={styles.tierPickerHeader}>
                <span className={styles.tierPickerTitle}>ปรับระดับราคาขาย</span>
                <span className={styles.tierPickerBillBadge}>ระดับราคาของบิล : {paystore}</span>
              </ModalHeader>
              <ModalBody>
                <div className={styles.tierPickerProduct}>
                  <span className={styles.tierPickerCode}>{priceTierItem?.code_product}</span>
                  <span className={styles.tierPickerName} title={priceTierItem?.name_product}>{priceTierItem?.name_product}</span>
                  <span className={styles.tierPickerUnit}>หน่วย : {priceTierItem?.unit}</span>
                </div>
                <div className={styles.tierPickerGrid}>
                  {priceTierItem && PRICE_TIER_VALUES.map((tier) => {
                    const tierPrice = resolveItemPriceByTier(priceTierItem, tier);
                    const isActive = getItemPriceTier(priceTierItem) === tier;
                    const isBillTier = paystore === tier;
                    return (
                      <button
                        type="button"
                        key={tier}
                        disabled={!(tierPrice > 0)}
                        className={`${styles.tierPickerCard} ${isActive ? styles.tierPickerCardActive : ""}`}
                        onClick={() => applyItemPriceTier(tier)}>
                        <span className={styles.tierPickerCardName}>
                          {tier}
                          {isBillTier && <span className={styles.tierPickerCardTag}>ตามบิล</span>}
                        </span>
                        <span className={styles.tierPickerCardPrice}>{tierPrice > 0 ? formatSaleAmount(tierPrice) : "-"}</span>
                        <span className={styles.tierPickerCardUnit}>บาท / {priceTierItem?.unit}</span>
                      </button>
                    );
                  })}
                </div>
                <div className={styles.tierPickerHint}>ราคาที่เลือกมีผลเฉพาะรายการนี้ในบิลปัจจุบัน · ส่วนลดต่อชิ้นที่ตั้งไว้ยังคงถูกหักตามเดิม</div>
              </ModalBody>
              <ModalFooter style={{ backgroundColor: "rgba(241, 241, 241, 1)" }}>
                <button
                  className="btn btn-outline-success"
                  style={{ height: 35, fontSize: 14, fontFamily: "Kanit" }}
                  onClick={() => applyItemPriceTier(paystore, true)}>
                  ใช้ระดับราคาตามบิล ({paystore})
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                  onClick={onClose}>
                  ปิด
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>

  )




}
export default BodyTabSale


