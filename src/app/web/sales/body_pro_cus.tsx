'use client'

import React, { useRef, useState, useEffect, useMemo, useCallback, Suspense, createContext, useContext, ChangeEvent, KeyboardEvent } from 'react'
import axios from 'axios'
import styles from "../componant/mystyle.module.css";
import { Table } from 'react-bootstrap';

const widthsh = 100;
import Link from "next/link";
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

import { Input } from "@/components/ui/input";
import BodyTabSale from './body_sale.tsx';
import { id } from 'date-fns/locale';
const widths = 70;
// Tittle
const apis = "receive"
const apidatalist = "datalist"
const apidataitem = "dataitemlist"
import { Baby, Check, ChevronDownIcon, Eye, EyeOff, Gauge, LayoutGrid, Layers3, Monitor, PackagePlus, Rows3, Search, UtensilsCrossed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Modal1 from 'react-bootstrap/Modal';
import Button1 from 'react-bootstrap/Button';
import LoadingOverlay from '../componant/LoadingOverlay';
import { DEFAULT_PRICE_TIER, PRICE_TIER_VALUES, normalizePriceTier } from "./priceTier";

// ความยาวขั้นต่ำที่ยอมรับว่า "ส่วนท้ายของข้อความ" เป็นบาร์โค้ด — บาร์โค้ดสินค้าจริง
// (EAN-8/UPC-A/EAN-13) ยาว 8 ตัวขึ้นไป ตั้งไว้กันคำค้นหาสั้น ๆ ไปชนบาร์โค้ดโดยบังเอิญ
const MIN_SUFFIX_BARCODE_LEN = 8;
// ช่วงอักขระไทย — ใช้ตรวจว่าคีย์บอร์ด/สแกนเนอร์ส่งมาเป็นภาษาไทยแล้วต้องแปลงกลับเป็นอังกฤษ
const THAI_CHAR_RE = /[฀-๿]/;

const IDContext_SaleItem = createContext<any>(undefined)
const frameworks = [
  ...PRICE_TIER_VALUES.map((value) => ({ value, label: value })),
]

import { enableFullscreen } from "@/lib/fullscreen";
import { fetchBarcodeAliases, buildAliasesByCode, normalizeBarcode, type AliasIndexRow } from "@/lib/barcodeAliasClient";
import { useMessageStore } from "./useMessageStore";
import { SellerCommunicationModal } from "./SellerCommunicationModal";
import TemperatureModal from "./TemperatureModal";
import { ChatNotificationButton } from "./ChatNotificationButton";
import {
  FORCE_RESTAURANT_MODE,
  SHOW_CART_VIEW_TOGGLE,
  SHOW_CUSTOMER_SCREEN_BUTTON,
  SHOW_DRUG_SET_SELECTOR,
  SHOW_HIDE_PRICE_TOGGLE,
  SHOW_PEDIATRIC_BUTTON,
  SHOW_POS_MODE_TOGGLE,
  SHOW_PRICE_TIER_SELECTOR,
  SHOW_PRODUCT_SEARCH_BAR,
  SHOW_SALES_COMMAND_BAR,
  SHOW_SALES_ICON_RAIL,
  SHOW_SCANNER_SPEED_TOGGLE,
  SHOW_SELLER_CHAT_BUTTON,
  SHOW_TEMPERATURE_BUTTON,
} from "./salesUiFlags";



function BodyTabIndex() {
  // Product search input ref — the cursor "rests" here so the cashier can
  // type to search or scan a barcode immediately without pressing F1.
  const productSearchInputRef = useRef<HTMLInputElement>(null);

  const [idc, setidss] = useState({ idcus: "", pay: DEFAULT_PRICE_TIER, mu: "1" })

  const [showcolor, setshowcolor] = useState("")
  const [companyR, setcom] = useState("")

  const initialValues1 = {
    ProductName: "",
    Barcode: "",
    pay: "",
    idcs: ""
  };

  //รับค่า
  const message = useMessageStore((state) => state.message)

  //ส่งค่า
  const setsavemu = useMessageStore((state) => state.setsavemu);
  const compactCartView = useMessageStore((state) => state.compactCartView);
  const setCompactCartView = useMessageStore((state) => state.setCompactCartView);
  const posGridMode = useMessageStore((state) => state.posGridMode);
  const setPosGridMode = useMessageStore((state) => state.setPosGridMode);
  const setsale = useMessageStore((state) => state.setsale);
  const setScannedBarcode = useMessageStore((state) => state.setScannedBarcode);
  const setpayw = useMessageStore((state) => state.setpayw);
  const setSelectedDrugSet = useMessageStore((state) => state.setSelectedDrugSet);
  const paystore = useMessageStore((state) => state.payw);
  const saleProducts = useMessageStore((state) => state.saleProducts);
  const saleProductsLoaded = useMessageStore((state) => state.saleProductsLoaded);
  const [drugSets, setDrugSets] = useState<any[]>([])
  const [drugSetLoading, setDrugSetLoading] = useState(false)

  // Read products from zustand store (populated by body_sale.tsx) instead of fetching again
  useEffect(() => {
    if (!saleProductsLoaded) return;
    const products = Array.isArray(saleProducts) ? saleProducts : [];
    setdataProduct(products)
    const items = products.map((item: { id: string | number; ProductName?: string }) => ({ value: String(item.id), label: item.ProductName || "" }))
    setFixname(items)
    setLoading(false)
  }, [saleProducts, saleProductsLoaded])


  const isProductHidden = (item: any) =>
    item.Show === "True" || item.Show === "true" || item.Show === "TRUE";

  useEffect(() => {

    const useMyHook = async () => {
      // *** ย้ายการอ่าน localStorage มาไว้ที่นี่ ***
      let companyS = "";
      if (typeof window !== 'undefined') {
        companyS = localStorage.getItem("company_") || "";
        setcom(localStorage.getItem("company_") || "")
        localStorage.setItem("countrow", DEFAULT_PRICE_TIER)
        setpayw(DEFAULT_PRICE_TIER)
        localStorage.setItem("show", "1")
        localStorage.setItem("mu", "1")
      }

      try {


        // อ่านค่าอื่นๆ ที่ใช้ localStorage ต่อไป
        setshowcolor(localStorage.getItem("mu") || "")
        setsavemu(localStorage.getItem("mu") || "")
        setCompactCartView(localStorage.getItem("compactCartView") === "true")
        // ล็อกไว้ที่โหมดร้านอาหารก็ไม่ต้องสนใจค่าที่จำไว้ (ค่าที่จำไว้เป็น false จะเตะกลับโหมดตาราง)
        setPosGridMode(FORCE_RESTAURANT_MODE ? true : localStorage.getItem("posGridMode") === "true")

      } catch (e) {
        console.error(e);
      }
    }

    useMyHook()

  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!companyR) return
    const companyCode = companyR
    const fetchDrugSets = async () => {
      setDrugSetLoading(true)
      try {
        const res = await axios.get(`/api/drug-set?company=${companyCode}&status=active`)
        setDrugSets(Array.isArray(res.data) ? res.data : [])
      } catch (error) {
        console.error(error)
        setDrugSets([])
      } finally {
        setDrugSetLoading(false)
      }
    }
    fetchDrugSets()
  }, [companyR])

  useEffect(() => {
    const normalizedPay = normalizePriceTier(paystore);
    setidss((prev) => prev.pay === normalizedPay ? prev : { ...prev, pay: normalizedPay });
    if (typeof window !== 'undefined') {
      localStorage.setItem("countrow", normalizedPay);
    }
  }, [paystore]);

  // Global Barcode Scanner Listener
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = 0;
    let bufferStartTime = 0;
    let idleTimer: any = null;
    // Threshold sets — picked at runtime based on fastScannerModeRef:
    //  - FAST  (default): tight thresholds, distinguish scanner from human typing
    //  - SLOW            : loose thresholds for very slow Bluetooth / keyboard-wedge scanners
    const FAST = { RESET_GAP_MS: 200, IDLE_FLUSH_MS: 120, MAX_AVG_INTERVAL_MS: 50 };
    const SLOW = { RESET_GAP_MS: 800, IDLE_FLUSH_MS: 400, MAX_AVG_INTERVAL_MS: 250 };
    const cfg = () => (fastScannerModeRef.current ? FAST : SLOW);
    // Minimum length to accept as a barcode (prevents flushing 1-2 typed chars)
    const MIN_BARCODE_LEN = 4;

    // Thai to English keyboard mapping
    const thaiToEnglishMap: { [key: string]: string } = {
      'ๅ': '1', '/': '2', '-': '3', 'ภ': '4', 'ถ': '5', 'ุ': '6', 'ึ': '7', 'ค': '8', 'ต': '9', 'จ': '0',
      'ข': '-', 'ช': '=',
      'ๆ': 'q', 'ไ': 'w', 'ำ': 'e', 'พ': 'r', 'ะ': 't', 'ั': 'y', 'ี': 'u', 'ร': 'i', 'น': 'o', 'ย': 'p',
      'บ': '[', 'ล': ']', 'ฃ': '\\',
      'ฟ': 'a', 'ห': 's', 'ก': 'd', 'ด': 'f', 'เ': 'g', '้': 'h', '่': 'j', 'า': 'k', 'ส': 'l', 'ว': ';', 'ง': "'",
      'ผ': 'z', 'ป': 'x', 'แ': 'c', 'อ': 'v', 'ิ': 'b', 'ื': 'n', 'ท': 'm', 'ม': ',', 'ใ': '.', 'ฝ': '/',
      // Shifted Thai characters
      '+': '!', '๑': '@', '๒': '#', '๓': '$', '๔': '%', 'ู': '^', '฿': '&', '๕': '*', '๖': '(', '๗': ')',
      '๘': '_', '๙': '+',
      '๐': 'Q', '"': 'W', 'ฎ': 'E', 'ฑ': 'R', 'ธ': 'T', 'ํ': 'Y', '๊': 'U', 'ณ': 'I', 'ฯ': 'O', 'ญ': 'P',
      'ฐ': '{', ',': '}', 'ฅ': '|',
      'ฤ': 'A', 'ฆ': 'S', 'ฏ': 'D', 'โ': 'F', 'ฌ': 'G', '็': 'H', '๋': 'J', 'ษ': 'K', 'ศ': 'L', 'ซ': ':',
      '.': '"',
      '(': 'Z', ')': 'X', 'ฉ': 'C', 'ฮ': 'V', 'ฺ': 'B', '์': 'N', '?': 'M', 'ฒ': '<', 'ฬ': '>', 'ฦ': '?'
    };

    const convertThaiToEnglish = (text: string): string => {
      return text.split('').map(char => thaiToEnglishMap[char] || char).join('');
    };

    // Fallback for scanners stuck in "ALT keypad / Unicode" output mode.
    // In that mode each character is sent as ALT + its 3-digit decimal ASCII code
    // on the numpad. The OS-level ALT composition never reaches us, so the buffer
    // ends up as the raw codes, e.g. "8852616500335" arrives as
    // "056056053050054049054053048048051051053".
    // We only convert when the whole buffer is groups of 3 digits whose value is
    // a printable-digit code (048–057). Real barcodes don't match this shape, so
    // this is safe to apply unconditionally.
    const decodeAltKeypadBarcode = (text: string): string => {
      if (text.length < 6 || text.length % 3 !== 0 || !/^\d+$/.test(text)) return text;
      let decoded = "";
      for (let i = 0; i < text.length; i += 3) {
        const code = Number(text.slice(i, i + 3));
        if (code < 48 || code > 57) return text; // not all digit-ASCII codes → leave untouched
        decoded += String.fromCharCode(code);
      }
      return decoded;
    };

    const resetState = () => {
      buffer = "";
      bufferStartTime = 0;
      if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
    };

    // Decide whether the current buffer looks like a scan based on length + speed.
    // Returns true if we should emit it as a barcode.
    const looksLikeScan = (): boolean => {
      if (buffer.length < MIN_BARCODE_LEN) return false;
      const total = lastKeyTime - bufferStartTime;
      if (total <= 0) return true; // single-frame burst
      const avgInterval = total / Math.max(1, buffer.length - 1);
      return avgInterval <= cfg().MAX_AVG_INTERVAL_MS;
    };

    const emitBarcode = (e?: globalThis.KeyboardEvent) => {
      // Check for Thai characters and auto-convert
      const isThai = /[\u0E00-\u0E7F]/.test(buffer);
      let finalBarcode = buffer;
      if (isThai) {
        finalBarcode = convertThaiToEnglish(buffer);
        console.warn("Thai keyboard detected, auto-converted:", buffer, "->", finalBarcode);
      }

      // Recover barcodes from scanners stuck in ALT-keypad/Unicode output mode.
      const decoded = decodeAltKeypadBarcode(finalBarcode);
      if (decoded !== finalBarcode) {
        console.warn("ALT-keypad scanner mode detected, auto-decoded:", finalBarcode, "->", decoded);
        finalBarcode = decoded;
      }

      // มีข้อความพิมพ์ค้างในช่องค้นหาก่อนยิงสแกน → ช่องจะมีค่าเป็น "ข้อความเดิม + บาร์โค้ด"
      // ให้เอาทั้งก้อนมาหาบาร์โค้ดจริง: ครอบคลุมทั้งกรณีคีย์ต้นบาร์โค้ดเองแล้วสแกนส่วนที่เหลือ
      // (หรือตัวแรกจากสแกนเนอร์มาช้าจน buffer ถูกตัด) และกรณีคีย์คำค้นหาค้างไว้แล้วสแกนทับ
      const boxText = (productSearchInputRef.current?.value || "").trim();
      if (boxText.length > finalBarcode.length && boxText.endsWith(buffer)) {
        let combined = THAI_CHAR_RE.test(boxText) ? convertThaiToEnglish(boxText) : boxText;
        combined = decodeAltKeypadBarcode(combined);
        const resolved = resolveBarcodeFromText(combined);
        if (resolved && resolved !== finalBarcode) {
          console.warn("merged pre-typed text with scan:", boxText, "->", resolved);
          finalBarcode = resolved;
        }
      }

      // Check if barcode matches a hidden product
      // ต้องเช็คบาร์โค้ดสำรองด้วย ไม่งั้นสแกนบาร์โค้ดสำรองของสินค้าที่ถูกระงับ
      // จะหลุดด่านนี้ไปโผล่เป็น toast "ไม่พบสินค้า" แทนคำเตือนที่ถูกต้อง
      const scannedCode = aliasCodeRef.current.get(normalizeBarcode(finalBarcode)) || "";
      const hiddenProduct = dataProductRef.current.find((p: any) =>
        (p.Barcode === finalBarcode || (scannedCode !== "" && p.code === scannedCode)) && isProductHidden(p)
      );
      if (hiddenProduct) {
        if (e) { e.preventDefault(); e.stopImmediatePropagation?.(); }
        alert("สินค้าถูกระงับการใช้งาน");
        resetState();
        return;
      }

      // Prevent terminator from triggering payment / form-submit / focus shift
      if (e) { e.preventDefault(); e.stopImmediatePropagation?.(); }

      // Mark scan timestamp to prevent payment trigger
      (window as any).__lastBarcodeScanTime = Date.now();

      // Send barcode to body_sale
      setScannedBarcode(finalBarcode);
      resetState();
    };

    const scheduleIdleFlush = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        idleTimer = null;
        if (looksLikeScan()) emitBarcode();
        else resetState();
      }, cfg().IDLE_FLUSH_MS);
    };

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // Ignore if a message modal is open
      if (message !== "") return;

      // F1: jump the cursor into the (always-live) product search box
      if (e.key === 'F1') {
        e.preventDefault();
        productSearchInputRef.current?.focus();
        productSearchInputRef.current?.select();
        return;
      }

      // Ignore pure modifier keys
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta'
        || e.key === 'CapsLock' || e.key === 'NumLock') {
        return;
      }

      const currentTime = Date.now();

      // Terminator keys: Enter or Tab — flush whatever we have
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (looksLikeScan()) {
          emitBarcode(e);
        } else {
          resetState();
        }
        lastKeyTime = currentTime;
        return;
      }

      // Only process printable single-char keys
      if (e.key.length !== 1) return;

      const delta = currentTime - lastKeyTime;
      // Big gap → start a fresh capture
      if (buffer.length === 0 || delta > cfg().RESET_GAP_MS) {
        buffer = e.key;
        bufferStartTime = currentTime;
      } else {
        buffer += e.key;
      }
      lastKeyTime = currentTime;

      scheduleIdleFlush();
    };

    // Capture phase so we see keys before inputs/popovers consume them.
    // Note: we deliberately do NOT preventDefault on every char — characters
    // typed into focused inputs are still allowed to appear there. Only the
    // terminator key (Enter/Tab) is suppressed when we recognize a scan.
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [message, initialValues1]);

  // Latest `message` for the long-lived focus listener below
  const messageRef = useRef(message);
  useEffect(() => { messageRef.current = message; }, [message]);

  // The cursor "rests" in the product search box (POS behaviour): after clicking
  // any non-text control — toggles, action buttons, blank space — focus returns
  // to the search input so the next keystroke or barcode scan starts a search.
  // We never steal focus from another text field or from an open dialog/popover.
  useEffect(() => {
    const isTypingTarget = (el: Element | null) => {
      if (!el || !(el instanceof HTMLElement)) return false;
      if (el.isContentEditable) return true;
      const tag = el.tagName;
      if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (tag === 'INPUT') {
        const type = (el.getAttribute('type') || 'text').toLowerCase();
        return !['button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'range', 'color'].includes(type);
      }
      return false;
    };
    const inOverlay = (el: Element | null) =>
      !!(el && el.closest && el.closest('[role="dialog"],[role="alertdialog"],[data-radix-popper-content-wrapper],[data-radix-menu-content]'));

    const restFocus = () => {
      const input = productSearchInputRef.current;
      if (!input) return;                    // search field not mounted (modal open)
      if (messageRef.current !== "") return;
      // Don't fight a Radix popover/menu/dialog that just opened
      if (document.querySelector('[data-radix-popper-content-wrapper],[role="dialog"][data-state="open"],[role="menu"][data-state="open"]')) return;
      const active = document.activeElement;
      if (active === input) return;
      if (isTypingTarget(active)) return;    // user is in another field → leave it alone
      if (inOverlay(active)) return;
      input.focus();
    };

    // Small delay so popovers/dialogs opened by the click have time to mount
    const onPointerUp = () => { window.setTimeout(restFocus, 30); };
    document.addEventListener('pointerup', onPointerUp, true);
    return () => document.removeEventListener('pointerup', onPointerUp, true);
  }, []);


  const [dataProduct, setdataProduct] = useState<any[]>([])
  // นับจำนวนครั้งที่ "กดเลือกสินค้า" จากช่องค้นหา — ส่งลง body_sale คู่กับ id
  // เพื่อให้ effect เพิ่มสินค้าทำงานทุกครั้งที่เลือก แม้เลือกสินค้าเดิมซ้ำ (id ไม่เปลี่ยน)
  // แบบเดียวกับ scanCount ของเส้นทางสแกนบาร์โค้ด
  const [selectCount, setSelectCount] = useState(0)
  // Ref mirror so the global keydown listener always reads the latest products
  // without re-binding the listener on every product list change.
  const dataProductRef = useRef<any[]>([]);
  useEffect(() => { dataProductRef.current = dataProduct; }, [dataProduct]);

  // หน่วยแปลง (UnitConversion) จัดกลุ่มตามรหัสสินค้า เพื่อให้ค้นหาด้วยหน่วย/บาร์โค้ดของหน่วยแปลงได้
  const [unitConvByCode, setUnitConvByCode] = useState<Map<string, any[]>>(new Map())
  useEffect(() => {
    const companyS = typeof window !== 'undefined' ? (localStorage.getItem("company_") || "") : ""
    if (!companyS) return
    let cancelled = false
    axios.get(`/api/unitconversion?company=${companyS}`)
      .then((res) => {
        if (cancelled) return
        const map = new Map<string, any[]>()
        for (const uc of (Array.isArray(res.data) ? res.data : [])) {
          const code = String(uc.productCode || "")
          if (!code) continue
          if (!map.has(code)) map.set(code, [])
          map.get(code)!.push(uc)
        }
        setUnitConvByCode(map)
      })
      .catch((err) => console.error('load unit conversions failed:', err))
    return () => { cancelled = true }
  }, [])

  // บาร์โค้ดสำรอง — สินค้าตัวเดียว/หน่วยเดียว แต่สแกนได้หลายบาร์โค้ด
  // (มี cache ในตัว จึงไม่ยิงซ้ำกับที่ body_sale.tsx โหลดไปแล้ว)
  const [barcodeAliases, setBarcodeAliases] = useState<AliasIndexRow[]>([])
  useEffect(() => {
    const companyS = typeof window !== 'undefined' ? (localStorage.getItem("company_") || "") : ""
    if (!companyS) return
    let cancelled = false
    fetchBarcodeAliases(companyS).then((rows) => { if (!cancelled) setBarcodeAliases(rows) })
    return () => { cancelled = true }
  }, [])

  // บาร์โค้ดสำรองจัดกลุ่มตามรหัสสินค้า — ใช้กรองผลค้นหาให้พิมพ์บาร์โค้ดสำรองแล้วเจอ
  const aliasesByCode = useMemo(() => buildAliasesByCode(barcodeAliases), [barcodeAliases])

  // แผนที่ผกผัน (บาร์โค้ดสำรอง → รหัสสินค้า) + ref mirror ให้ global keydown listener
  // อ่านค่าล่าสุดได้โดยไม่ต้อง re-bind listener (แบบเดียวกับ dataProductRef)
  const aliasCodeMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const a of barcodeAliases) {
      const b = normalizeBarcode(a?.b)
      const c = String(a?.c || "")
      if (b && c) map.set(b, c)
    }
    return map
  }, [barcodeAliases])
  const aliasCodeRef = useRef(aliasCodeMap)
  useEffect(() => { aliasCodeRef.current = aliasCodeMap }, [aliasCodeMap])

  // บาร์โค้ดที่รู้จักทั้งหมด (สินค้า + บาร์โค้ดสำรอง + หน่วยแปลง)
  // สำหรับตรวจว่าข้อความหนึ่งเป็นบาร์โค้ดจริงไหม
  const knownBarcodes = useMemo(() => {
    const set = new Set<string>()
    for (const p of dataProduct) {
      const b = String(p?.Barcode || "").trim()
      if (b) set.add(b)
    }
    for (const a of barcodeAliases) {
      const b = normalizeBarcode(a?.b)
      if (b) set.add(b)
    }
    for (const list of unitConvByCode.values()) {
      for (const uc of list) {
        const b = String(uc?.Barcode || "").trim()
        if (b) set.add(b)
      }
    }
    return set
  }, [dataProduct, barcodeAliases, unitConvByCode])
  // ref mirror — global keydown listener อ่านค่าล่าสุดได้โดยไม่ต้อง re-bind listener
  const knownBarcodesRef = useRef(knownBarcodes)
  useEffect(() => { knownBarcodesRef.current = knownBarcodes }, [knownBarcodes])

  // หา "บาร์โค้ดจริง" จากข้อความหนึ่งก้อน: ตรงทั้งก้อนก่อน ถ้าไม่ตรงจึงไล่ส่วนท้าย (ยาวสุดก่อน)
  // รองรับกรณีพนักงานพิมพ์อะไรค้างไว้ในช่องค้นหาแล้วยิงสแกนต่อ — ข้อความจะกลายเป็น
  // "ข้อความเดิม + บาร์โค้ด" ทั้งตอนคีย์บาร์โค้ดเองบางส่วนแล้วสแกนต่อ (ตรงทั้งก้อน)
  // และตอนคีย์คำค้นหาค้างไว้ (ตรงเฉพาะส่วนท้าย). คืน "" เมื่อไม่พบบาร์โค้ดใด ๆ
  const resolveBarcodeFromText = useCallback((text: string): string => {
    const set = knownBarcodesRef.current
    const t = String(text || "").trim()
    if (!t) return ""
    if (set.has(t)) return t
    for (let len = t.length - 1; len >= MIN_SUFFIX_BARCODE_LEN; len--) {
      const cand = t.slice(t.length - len)
      if (set.has(cand)) return cand
    }
    return ""
  }, [])
  const [listM, setlistM] = useState("")
  const [showS, setShow] = useState("")
  const [switchdata, setswitchdata] = useState('2')

  /**************Data Company******************************/

  const [alldatalist, setatalist] = useState(initialValues1)
  const [idDatalist, setidW] = useState("")


  //***********Get ID************************** */
  useEffect(() => {
    if (!alldatalist.ProductName && !alldatalist.Barcode) return;

    let idDatalists = "";
    if (switchdata === "1") {
      const found = dataProduct.find((supplier: any) => supplier.ProductName === alldatalist.ProductName);
      idDatalists = found ? String(found.id) : "";
    } else {
      const found = dataProduct.find((supplier: any) => supplier.Barcode === alldatalist.Barcode);
      idDatalists = found ? String(found.id) : "";
    }

    try {
      setidW(idDatalists)
      setsale(idDatalists)

      localStorage.setItem("countrow", normalizePriceTier(idc.pay))
      const items = localStorage.getItem("itemlist") || ""
      if (items) {
        setlistM(items);
      }
      const visShow = localStorage.getItem("show") || ""
      if (visShow) {
        setShow(visShow);
      }
    } catch (e) {
      console.error(e);
    }
  }, [alldatalist.ProductName, alldatalist.Barcode, switchdata, dataProduct, idc.pay])


  const handleInputChange1 = () => {


    const pp = localStorage.getItem("bar") || ""
    setatalist({ ...alldatalist, Barcode: pp, });

    setTimeout(() => {
      setatalist(initialValues1)

    }, 1);

  };




  //*** Get API Fixname */
  const [open, setOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<{ value: string, label: string } | null>(null)
  const [items, setFixname] = useState<{ value: string, label: string }[]>([]);



  /***********Get datalist*/




  //******** */ Search สินค้า*****************/
  // รวมสินค้าที่ถูกระงับการใช้งานไว้ในผลค้นหาด้วย เพื่อให้แสดง + เตือน + บล็อกเมื่อเลือก
  const searchableProducts = useMemo(
    () => dataProduct,
    [dataProduct]
  );

  // Resolve display price by current price tier (หน้าร้าน / ขายส่ง / สมาชิก / ราคา A / ราคา B)
  const getDisplayPrice = useCallback((p: any): number => {
    const tier = normalizePriceTier(idc.pay);
    let raw: any = p?.price;
    if (tier === "ขายส่ง") raw = p?.priceWholesale ?? p?.price;
    else if (tier === "สมาชิก") raw = (Number(p?.priceOnline) > 0 ? p?.priceOnline : p?.price);
    else if (tier === "ราคา A") raw = p?.priceA ?? p?.price;
    else if (tier === "ราคา B") raw = p?.priceB ?? p?.price;
    else if (tier === "ราคา C") raw = p?.priceC ?? p?.price;
    else if (tier === "ราคา D") raw = p?.priceD ?? p?.price;
    else if (tier === "ราคา E") raw = p?.priceE ?? p?.price;
    else if (tier === "ราคา F") raw = p?.priceF ?? p?.price;
    else if (tier === "ราคา G") raw = p?.priceG ?? p?.price;
    else if (tier === "ราคา H") raw = p?.priceH ?? p?.price;
    const n = Number(raw);
    return isNaN(n) ? 0 : n;
  }, [idc.pay]);

  // ราคาตามระดับราคาปัจจุบัน สำหรับหน่วยแปลง (UnitConversion ใช้ priceRetail เป็นราคาหน้าร้าน)
  const getDisplayPriceUC = useCallback((uc: any): number => {
    const tier = normalizePriceTier(idc.pay);
    let raw: any = uc?.priceRetail;
    if (tier === "ขายส่ง") raw = uc?.priceWholesale ?? uc?.priceRetail;
    else if (tier === "สมาชิก") raw = (Number(uc?.priceOnline) > 0 ? uc?.priceOnline : uc?.priceRetail);
    else if (tier === "ราคา A") raw = uc?.priceA ?? uc?.priceRetail;
    else if (tier === "ราคา B") raw = uc?.priceB ?? uc?.priceRetail;
    else if (tier === "ราคา C") raw = uc?.priceC ?? uc?.priceRetail;
    else if (tier === "ราคา D") raw = uc?.priceD ?? uc?.priceRetail;
    else if (tier === "ราคา E") raw = uc?.priceE ?? uc?.priceRetail;
    else if (tier === "ราคา F") raw = uc?.priceF ?? uc?.priceRetail;
    else if (tier === "ราคา G") raw = uc?.priceG ?? uc?.priceRetail;
    else if (tier === "ราคา H") raw = uc?.priceH ?? uc?.priceRetail;
    const n = Number(raw);
    return isNaN(n) ? 0 : n;
  }, [idc.pay]);

  const formatPrice = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function Search_Product() {
    const [search, setsearch] = useState("");
    const [activeIdx, setActiveIdx] = useState(0);
    const [focused, setFocused] = useState(false);
    // ซ่อน dropdown ระหว่างเครื่องสแกนกำลัง "พิมพ์" บาร์โค้ดลงช่องนี้ (keystroke burst)
    const [scanBurst, setScanBurst] = useState(false);
    const burstRef = useRef<{ last: number; streak: number; timer: any }>({ last: 0, streak: 0, timer: null });
    const deferredSearch = React.useDeferredValue(search);
    const scanCount = useMessageStore((s) => s.scanCount);
    const prevScanCountRef = useRef(scanCount);
    const listRef = useRef<HTMLDivElement>(null);

    const data = useMemo(() => {
      const lowercasedValue = deferredSearch.toLowerCase().trim();
      if (lowercasedValue === "") return searchableProducts.slice(0, 50);
      // ค้นหาจากหน่วยแปลง (UnitConversion) ด้วย: หน่วยขาย/หน่วยย่อย (ค้นบางส่วน) หรือบาร์โค้ดของหน่วยแปลง
      const matchUnitConversion = (code: string) => {
        const list = unitConvByCode.get(String(code || ""))
        if (!list) return false
        return list.some((uc: any) =>
          (uc.saleUnit || '').toLowerCase().includes(lowercasedValue)
          || (uc.subUnit || '').toLowerCase().includes(lowercasedValue)
          || (uc.Barcode || '').toLowerCase().startsWith(lowercasedValue)
        )
      }
      // บาร์โค้ดสำรองของสินค้า — พิมพ์บาร์โค้ดตัวไหนของสินค้าก็ต้องเจอสินค้าตัวเดียวกัน
      const matchAlias = (code: string) =>
        (aliasesByCode.get(String(code || "")) || []).some((b) => b.toLowerCase().startsWith(lowercasedValue))

      return searchableProducts.filter((user: any) =>
        (user.ProductName || '').toLowerCase().includes(lowercasedValue)
        // ชื่อทางการ (fixname) — พิมพ์ชื่อสามัญ/generic name ก็ต้องเจอสินค้า
        || (user.fixname || '').toLowerCase().includes(lowercasedValue)
        || (user.code || '').toLowerCase().startsWith(lowercasedValue)
        || (user.Barcode || '').toLowerCase().startsWith(lowercasedValue)
        || matchAlias(user.code)
        || matchUnitConversion(user.code)
      ).slice(0, 50);
    }, [deferredSearch, searchableProducts, unitConvByCode, aliasesByCode]);

    // Flatten products + their unit-conversion rows into one keyboard-navigable list
    const flatItems = useMemo(() => {
      const items: any[] = [];
      for (const post of data) {
        items.push({ kind: 'product', post });
        if (!isProductHidden(post)) {
          for (const uc of (unitConvByCode.get(String(post.code)) || [])) {
            items.push({ kind: 'uc', post, uc });
          }
        }
      }
      return items;
    }, [data, unitConvByCode]);

    // Results only drop down once something is typed, so the page stays clean.
    // scanBurst: ระหว่างเครื่องสแกนพิมพ์บาร์โค้ดรัว ๆ ห้ามเปิด dropdown — ผลค้นหา
    // ระหว่างกลางบาร์โค้ดไม่มีความหมาย และเดี๋ยวช่องจะถูกเคลียร์เมื่อสแกนสำเร็จ
    const dropdownOpen = focused && deferredSearch.trim() !== "" && !scanBurst;

    // Always keep the first result highlighted whenever the query changes
    useEffect(() => { setActiveIdx(0); }, [deferredSearch]);
    useEffect(() => {
      if (activeIdx > flatItems.length - 1) setActiveIdx(flatItems.length ? flatItems.length - 1 : 0);
    }, [flatItems.length, activeIdx]);

    // Keep the highlighted row visible while navigating with the arrow keys
    useEffect(() => {
      const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement | null;
      el?.scrollIntoView({ block: 'nearest' });
    }, [activeIdx, dropdownOpen]);

    // Rest the cursor in the box as soon as the field appears:
    // เข้าหน้าขาย / refresh / ปิด modal / re-render หลังกดปุ่มอื่น
    // ห้ามแย่ง focus ถ้าผู้ใช้กำลังพิมพ์อยู่ใน text field อื่น (เช่น ช่องจำนวนใน
    // toast "เพิ่มสินค้าลงรายการขายแล้ว") — remount ระหว่างนั้นต้องไม่ดึง cursor กลับ
    useEffect(() => {
      const t = setTimeout(() => {
        const active = document.activeElement;
        if (active instanceof HTMLElement && active !== productSearchInputRef.current) {
          if (active.isContentEditable) return;
          const tag = active.tagName;
          if (tag === 'TEXTAREA' || tag === 'SELECT') return;
          if (tag === 'INPUT') {
            const type = (active.getAttribute('type') || 'text').toLowerCase();
            if (!['button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'range', 'color'].includes(type)) return;
          }
        }
        productSearchInputRef.current?.focus();
      }, 0);
      return () => clearTimeout(t);
    }, []);

    // A barcode scan types into this box too — clear it once the scan is handled.
    // เทียบด้วย scanCount (nonce บวกทุกครั้งที่ยิง) ไม่ใช่ตัว string บาร์โค้ด:
    // สแกนบาร์โค้ดเดิมซ้ำ ค่า string ไม่เปลี่ยน → ถ้า subscribe ตัวบาร์โค้ด
    // component จะไม่ re-render และช่องค้นหา/dropdown จะค้างคาไว้
    useEffect(() => {
      if (scanCount !== prevScanCountRef.current) {
        prevScanCountRef.current = scanCount;
        setsearch("");
        setActiveIdx(0);
        const b = burstRef.current;
        b.streak = 0;
        b.last = 0;
        if (b.timer) { clearTimeout(b.timer); b.timer = null; }
        setScanBurst(false);
      }
    }, [scanCount]);

    // เก็บกวาด timer ของ burst detector ตอน unmount (component นี้ remount บ่อย)
    useEffect(() => () => {
      const b = burstRef.current;
      if (b.timer) clearTimeout(b.timer);
    }, []);

    const selectItem = (item: any) => {
      if (!item) return;
      if (item.kind === 'product') {
        if (isProductHidden(item.post)) { alert("สินค้าถูกระงับการใช้งาน"); return; }
        // ส่ง id ตรง ๆ + บวก selectCount — ห้ามกลับไปใช้วิธี setatalist แล้วหา id จากชื่อ:
        // ชื่อซ้ำจะจับสินค้าตัวแรกเสมอ และเลือกสินค้าเดิมซ้ำจะเงียบ (idF ไม่เปลี่ยน → ไม่เพิ่มลงรายการขาย)
        const pid = String(item.post.id);
        setidW(pid);
        setsale(pid);
        setSelectCount((c) => c + 1);
        setsearch("");
        setActiveIdx(0);
      } else {
        // sentinel → body_sale adds it as a unit-conversion row
        setScannedBarcode(`__UC__${item.uc.id}`);
        setsearch("");
        setActiveIdx(0);
      }
      productSearchInputRef.current?.focus();
    };

    // จับความเร็วการพิมพ์: ตัวอักษรติดกัน 3 ตัวที่ห่างกัน < 60ms = เครื่องสแกน
    // (คนพิมพ์เร็วสุดก็ราว 100ms/ตัว) → ซ่อน dropdown ไว้จนกว่าจะเงียบ ~300ms
    // เผื่อกรณีสแกนไม่ถูกจับเป็นบาร์โค้ด (เช่น สั้นเกิน) ค่อยเปิดผลค้นหาตามปกติ
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const now = Date.now();
      const b = burstRef.current;
      if (now - b.last < 60) b.streak += 1; else b.streak = 0;
      b.last = now;
      if (b.streak >= 2) setScanBurst(true);
      if (b.timer) clearTimeout(b.timer);
      b.timer = setTimeout(() => { b.timer = null; setScanBurst(false); }, 300);
      setsearch(e.target.value);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setsearch("");
        setActiveIdx(0);
        return;
      }
      // สแกนเนอร์ที่ช้ากว่า threshold จะพิมพ์บาร์โค้ดลงช่องนี้แล้วปิดท้ายด้วย Enter
      // (ไม่ถูกจับโดย global scanner listener) — ถ้าข้อความมีบาร์โค้ดจริงอยู่ ให้เดิน
      // เส้นทางสแกนตรง: บวกจำนวนแถวเดิม/เพิ่มแถวใหม่ทันที โดยไม่เปิด toast ใส่จำนวน
      // resolveBarcodeFromText รับกรณีพิมพ์ค้างไว้ก่อนแล้วสแกนต่อด้วย (ตรงเฉพาะส่วนท้าย)
      if (e.key === 'Enter') {
        const typed = search.trim();
        const resolved = typed !== "" ? resolveBarcodeFromText(typed) : "";
        if (resolved) {
          e.preventDefault();
          setScannedBarcode(resolved);
          setsearch("");
          setActiveIdx(0);
          return;
        }
      }
      if (!dropdownOpen || flatItems.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectItem(flatItems[activeIdx]);
      }
    };

    return (
      <div className={styles.productSearchRoot}>
        {/* ช่องค้นหาจริง — cursor ค้างอยู่ตรงนี้ตลอด พิมพ์/สแกนได้ทันที ไม่ต้องกด F1 */}
        <div
          className={styles.productSearchField}
          onMouseDown={(e) => {
            if (e.target !== productSearchInputRef.current) {
              e.preventDefault();
              productSearchInputRef.current?.focus();
            }
          }}
        >
          <Search className={styles.productSearchIcon} size={15} strokeWidth={2.3} />
          <input
            ref={productSearchInputRef}
            type="text"
            value={search}
            onChange={handleSearchChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="พิมพ์ค้นหาชื่อ, ชื่อทางการ, รหัส, หรือสแกน Barcode สินค้าได้เลย..."
            className={styles.productSearchInput}
            autoComplete="off"
            spellCheck={false}
            aria-label="ค้นหาสินค้า"
          />
          <span className={styles.productSearchShortcut}>F1</span>
        </div>

        {dropdownOpen && (
          <div className={styles.productSearchDropdown}>
            <div className={styles.productSearchMeta}>
              <span>พบ <b style={{ color: '#0f172a' }}>{data.length}</b> รายการ</span>
              <span className={styles.productSearchTierBadge}>
                ระดับราคา: <b style={{ color: '#dc2626' }}>{normalizePriceTier(idc.pay)}</b>
              </span>
            </div>
            <div className={styles.productSearchList} ref={listRef}>
              {flatItems.length === 0 ? (
                <div className={styles.productSearchEmpty}>ไม่พบข้อมูลสินค้า</div>
              ) : (
                flatItems.map((item: any, idx: number) => {
                  const isActive = idx === activeIdx;
                  if (item.kind === 'product') {
                    const post = item.post;
                    const displayPrice = getDisplayPrice(post);
                    const hidden = isProductHidden(post);
                    return (
                      <div
                        key={`p-${post.id}`}
                        data-idx={idx}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectItem(item)}
                        style={{
                          fontFamily: "Kanit",
                          fontSize: 12,
                          padding: '8px 10px',
                          borderRadius: 8,
                          margin: '2px 4px',
                          cursor: 'pointer',
                          opacity: hidden ? 0.6 : 1,
                          borderLeft: hidden ? '2px solid #ef4444' : '2px solid transparent',
                          background: isActive ? '#eef2ff' : 'transparent',
                        }}
                      >
                        <div className="flex w-full items-center" style={{ gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                              <div
                                style={{
                                  fontFamily: 'Kanit_B',
                                  fontSize: 13,
                                  color: '#0f172a',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  flex: '0 1 auto',
                                }}
                              >
                                {post.ProductName}
                              </div>
                              {hidden && (
                                <span style={{
                                  flexShrink: 0,
                                  background: '#fee2e2',
                                  border: '1px solid #fecaca',
                                  color: '#b91c1c',
                                  fontSize: 9,
                                  fontFamily: 'Kanit',
                                  padding: '1px 6px',
                                  borderRadius: 999,
                                  lineHeight: 1.4,
                                }}>ระงับการใช้งาน</span>
                              )}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                gap: 8,
                                fontSize: 10,
                                color: '#64748b',
                                marginTop: 2,
                              }}
                            >
                              <span>รหัส: <span style={{ color: '#334155' }}>{post.code}</span></span>
                              <span style={{ color: '#cbd5e1' }}>|</span>
                              <span>Barcode: <span style={{ color: '#334155' }}>{post.Barcode}</span></span>
                              {post.fixname ? (
                                <>
                                  <span style={{ color: '#cbd5e1' }}>|</span>
                                  <span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    ชื่อทางการ: <span style={{ color: '#334155' }}>{post.fixname}</span>
                                  </span>
                                </>
                              ) : null}
                              {post.Unit ? (
                                <>
                                  <span style={{ color: '#cbd5e1' }}>|</span>
                                  <span>หน่วย: <span style={{ color: '#334155' }}>{post.Unit}</span></span>
                                </>
                              ) : null}
                            </div>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end',
                              minWidth: 90,
                              gap: 2,
                            }}
                          >
                            {hidden ? (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  background: '#fee2e2',
                                  border: '1px solid #fecaca',
                                  color: '#b91c1c',
                                  padding: '3px 10px',
                                  borderRadius: 999,
                                  fontFamily: 'Kanit_B',
                                  fontSize: 11,
                                  lineHeight: 1.1,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                🚫 สินค้าถูกระงับการใช้งาน
                              </div>
                            ) : (
                              <>
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'baseline',
                                    gap: 3,
                                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                                    border: '1px solid #fecaca',
                                    color: '#b91c1c',
                                    padding: '3px 10px',
                                    borderRadius: 999,
                                    fontFamily: 'Kanit_B',
                                    fontSize: 13,
                                    lineHeight: 1.1,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  <span>{formatPrice(displayPrice)}</span>
                                  <span style={{ fontSize: 9, color: '#dc2626', fontWeight: 500 }}>฿</span>
                                </div>
                                <div
                                  style={{
                                    fontSize: 10,
                                    color: '#64748b',
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                  }}
                                >
                                  {post.unit || '-'}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  // แถวหน่วยแปลง (UnitConversion) — เลือกแล้วเพิ่มเป็นแถวแยกตามหน่วย
                  const post = item.post;
                  const uc = item.uc;
                  const ucPrice = getDisplayPriceUC(uc);
                  return (
                          <div
                            key={`uc-${uc.id}`}
                            data-idx={idx}
                            onMouseEnter={() => setActiveIdx(idx)}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectItem(item)}
                            style={{ fontFamily: "Kanit", fontSize: 12, padding: '6px 10px 6px 22px', borderRadius: 8, margin: '2px 4px 2px 14px', borderLeft: '2px solid #c7d2fe', background: isActive ? '#e0e7ff' : '#f8fafc', cursor: 'pointer' }}
                          >
                            <div className="flex w-full items-center" style={{ gap: 10 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#3730a3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  ↳ {post.ProductName}
                                </div>
                                <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#64748b', marginTop: 2 }}>
                                  <span>หน่วย: <span style={{ color: '#334155' }}>{uc.saleUnit || '-'}</span></span>
                                  <span style={{ color: '#cbd5e1' }}>|</span>
                                  <span>= {uc.subQty || 1} {uc.subUnit || post.Unit || ''}</span>
                                  {uc.Barcode ? (<><span style={{ color: '#cbd5e1' }}>|</span><span>Barcode: <span style={{ color: '#334155' }}>{uc.Barcode}</span></span></>) : null}
                                </div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 90, gap: 2 }}>
                                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3, background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', border: '1px solid #c7d2fe', color: '#3730a3', padding: '3px 10px', borderRadius: 999, fontFamily: 'Kanit_B', fontSize: 13, lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                                  <span>{formatPrice(ucPrice)}</span>
                                  <span style={{ fontSize: 9, fontWeight: 500 }}>฿</span>
                                </div>
                                <div style={{ fontSize: 10, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1px 6px', borderRadius: 4 }}>
                                  {uc.saleUnit || '-'}
                                </div>
                              </div>
                            </div>
                          </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  }


  // Removed Scanbarcode component as it's now handled by a global listener

  //*******Func Sex********************** */
  function Payinput() {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")
    const [isDisabled, setIsDisabled] = React.useState(false)

    React.useEffect(() => {
      const checkListS = () => {
        const listS = localStorage.getItem("listS");
        if (!listS) {
          setIsDisabled(false);

          return;
        }
        try {
          const parsed = JSON.parse(listS);
          setIsDisabled(Array.isArray(parsed) && parsed.length > 0);
        } catch {
          setIsDisabled(true);
        }
      };

      checkListS();

      // Listen for storage changes from other tabs
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "listS") {
          checkListS();
        }
      };

      window.addEventListener("storage", handleStorageChange);

      // Poll for same-tab changes
      const interval = setInterval(checkListS, 500);

      return () => {
        window.removeEventListener("storage", handleStorageChange);
        clearInterval(interval);
      };
    }, []);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            name="pay"
            disabled={isDisabled}
            aria-expanded={open}
            className={styles.salesPriceTierButton}
          >
            <span className={styles.salesPriceTierLabel}>{normalizePriceTier(idc.pay)}</span>
            <ChevronDownIcon className={styles.salesPriceTierIcon} size={14} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="หน้าร้าน" className="h-9" />
            <CommandList>
              <CommandEmpty>No framework found.</CommandEmpty>
              <CommandGroup>
                {frameworks.map((framework) => (
                  <CommandItem
                    key={framework.value}
                    value={framework.value}
                    onSelect={(currentValue) => {
                      const nextValue = normalizePriceTier(currentValue === value ? "" : currentValue);
                      setValue(nextValue)
                      setidss({ ...idc, pay: nextValue });
                      setOpen(false)
                      localStorage.setItem("countrow", nextValue)
                      setpayw(nextValue)
                    }}
                  >
                    {framework.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        value === framework.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }




  const customerWin = useRef<Window | null>(null);

  const openCustomerOnSecondScreen = async () => {
    // Check if running in Electron and the API is available
    // @ts-ignore
    if (window.electron && window.electron.openCustomerDisplay) {
      // @ts-ignore
      await window.electron.openCustomerDisplay();
      return;
    }

    if ("getScreenDetails" in window) {
      // @ts-ignore
      const details = await window.getScreenDetails();

      const screens = details.screens;
      const extend = screens.find((s: any) => !s.isPrimary);

      if (extend) {
        window.open(
          "/web/sales/customer",
          "_blank",
          `
          left=${extend.left},
          top=${extend.top},
          width=${extend.width},
          height=${extend.height},
          fullscreen=yes,
          resizable=yes,
          scrollbars=no
        `
        );
        return;
      }
    }


    // ส่งคำสั่ง fullscreen ให้ทันทีหลังจากเปิด
    setTimeout(() => {
      customerWin.current?.postMessage({ action: "enter_fullscreen" }, "*");

    }, 2000);
  };




  const [hideCustomerPrice, setHideCustomerPrice] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('hideCustomerPrice') === 'true'
    return false
  })

  const toggleHideCustomerPrice = () => {
    const next = !hideCustomerPrice
    setHideCustomerPrice(next)
    localStorage.setItem('hideCustomerPrice', String(next))
  }

  // Hidden toggle: fast (default) vs slow scanner mode.
  // When false → loosen thresholds so very slow Bluetooth/keyboard-wedge scanners work.
  // Initialize with default (true) so SSR and first client render match,
  // then sync from localStorage in an effect to avoid hydration mismatch.
  const [fastScannerMode, setFastScannerMode] = useState<boolean>(true)
  const fastScannerModeRef = useRef<boolean>(true)
  useEffect(() => { fastScannerModeRef.current = fastScannerMode }, [fastScannerMode])
  useEffect(() => {
    if (typeof window === 'undefined') return
    const v = localStorage.getItem('fastScannerMode')
    if (v !== null) setFastScannerMode(v === 'true')
  }, [])
  const toggleFastScannerMode = () => {
    const next = !fastScannerMode
    setFastScannerMode(next)
    localStorage.setItem('fastScannerMode', String(next))
  }

  function DrugSetSelector() {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const deferredSearch = React.useDeferredValue(search)

    const filteredDrugSets = useMemo(() => {
      const query = deferredSearch.toLowerCase().trim()
      if (!query) return drugSets.slice(0, 40)
      return drugSets.filter((drugSet: any) => {
        const itemText = Array.isArray(drugSet.items)
          ? drugSet.items.map((item: any) => [item.code, item.name, item.fixname, item.drugGroup, item.barcode, item.product?.ProductName, item.product?.fixname, item.product?.group, item.product?.Barcode].join(" ")).join(" ")
          : ""
        return [drugSet.name, drugSet.description, itemText].join(" ").toLowerCase().includes(query)
      }).slice(0, 40)
    }, [deferredSearch, drugSets])

    return (
      <div className={styles.salesDrugSetRoot}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={message !== "" || drugSetLoading}
              className={styles.salesDrugSetButton}
            >
              <PackagePlus size={15} strokeWidth={2.2} />
              <span className={styles.salesDrugSetLabel}>{drugSetLoading ? "กำลังโหลด" : "จัดชุดสินค้า"}</span>
              <ChevronDownIcon size={13} className={styles.salesDrugSetIcon} />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0"
            style={{ width: 430, borderRadius: 12, overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: '0 12px 32px rgba(15,23,42,0.14)' }}
            align="start"
          >
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="ค้นหาชื่อชุดสินค้า, กลุ่มสินค้า, รหัส, ชื่อ, Barcode..."
                value={search}
                onValueChange={setSearch}
                className="h-10"
                style={{ fontFamily: "Kanit", fontSize: 13 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', fontFamily: 'Kanit', fontSize: 11, color: '#64748b' }}>
                <span>พบ <b style={{ color: '#0f172a' }}>{filteredDrugSets.length}</b> ชุด</span>
                <span style={{ color: '#0e7490' }}>เพิ่มต่อท้ายรายการขาย</span>
              </div>
              <CommandList style={{ maxHeight: 360 }}>
                <CommandEmpty>
                  <div style={{ padding: 22, textAlign: 'center', fontFamily: 'Kanit', fontSize: 13, color: '#94a3b8' }}>ไม่พบชุดสินค้า</div>
                </CommandEmpty>
                <CommandGroup>
                  {filteredDrugSets.map((drugSet: any) => {
                    const itemCount = Array.isArray(drugSet.items) ? drugSet.items.length : 0
                    // ยึด salePrice ที่บันทึกไว้ในชุด (รวมราคาที่กำหนดเอง/ราคาตามหน่วยแปลง) ก่อนราคาปกติของสินค้า
                    const total = Array.isArray(drugSet.items) ? drugSet.items.reduce((acc: number, item: any) => acc + Number(item.qty || 1) * Number(item.salePrice ?? item.product?.price ?? 0), 0) : 0
                    return (
                      <CommandItem
                        key={drugSet.id}
                        value={String(drugSet.id)}
                        onSelect={() => {
                          setSelectedDrugSet(drugSet)
                          setOpen(false)
                          setSearch("")
                        }}
                        style={{ fontFamily: "Kanit", fontSize: 12, padding: '9px 10px', borderRadius: 8, margin: '3px 5px' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#ecfeff', border: '1px solid #a5f3fc', color: '#0891b2', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><Layers3 size={15} strokeWidth={2.3} /></div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{drugSet.name}</div>
                            <div style={{ fontSize: 10, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {(drugSet.items || []).slice(0, 3).map((item: any) => item.product?.ProductName || item.name || item.code).filter(Boolean).join(' • ') || '-'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', minWidth: 86 }}>
                            <div style={{ fontFamily: 'Kanit_B', color: '#1E5088', fontSize: 12 }}>{total.toLocaleString()} บาท</div>
                            <div style={{ color: '#64748b', fontSize: 10 }}>{itemCount} รายการ</div>
                          </div>
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  const KeyScan = () => {
    const globalChildWeight = useMessageStore((state) => state.globalChildWeight)
    const setShowPediatricModalStore = useMessageStore((state) => state.setShowPediatricModal)
    /* ช่องค้นหา/สแกนสินค้า — ซ่อนด้วย SHOW_PRODUCT_SEARCH_BAR แต่ยังต้องอยู่ในทรีและโฟกัสได้
       เพราะเป็นทางที่เครื่องสแกนบาร์โค้ดพิมพ์เข้ามา (ดูหมายเหตุใน salesUiFlags.ts) */
    const productSearchMount = (
      <div className={SHOW_PRODUCT_SEARCH_BAR ? styles.salesCommandSearch : styles.salesCommandSearchHidden}>
        <Search_Product />
      </div>
    )

    // ไม่เหลือเครื่องมือให้แสดงสักตัว → ไม่เรนเดอร์กรอบแถบเปล่า ๆ
    // แต่ยังต้องคืนช่องสแกนไว้ในทรี ไม่งั้นสแกนบาร์โค้ดพัง
    if (!SHOW_SALES_COMMAND_BAR) return productSearchMount

    return (
      <div className={styles.salesCommandBar}>
        {productSearchMount}
        {SHOW_DRUG_SET_SELECTOR && <DrugSetSelector />}
        {SHOW_PRICE_TIER_SELECTOR && <div className={styles.salesCommandTier}>{Payinput()}</div>}

        <div className={styles.salesCommandActions}>
          {/* โหมดร้านอาหาร/คาเฟ่ : เปลี่ยนหน้าขายเป็นใบสั่งซื้อ + หมวดสินค้า + กริดสินค้าให้แตะเลือก
              ซ่อนอยู่ (SHOW_POS_MODE_TOGGLE) เพราะหน้าขายถูกล็อกไว้ที่โหมดนี้ด้วย FORCE_RESTAURANT_MODE */}
          {SHOW_POS_MODE_TOGGLE && (
          <button
            type="button"
            title={posGridMode ? "กำลังใช้โหมดร้านอาหาร/คาเฟ่ (คลิกเพื่อกลับโหมดตารางปกติ)" : "เปลี่ยนเป็นโหมดร้านอาหาร/คาเฟ่ (เลือกหมวด + แตะสินค้า)"}
            aria-pressed={posGridMode}
            onClick={() => { const next = !posGridMode; setPosGridMode(next); localStorage.setItem("posGridMode", String(next)) }}
            className={`${styles.salesModeToggle} ${posGridMode ? styles.salesModeToggleOn : ""}`}
          >
            <UtensilsCrossed size={15} strokeWidth={2.3} />
            <span>โหมดร้านอาหาร</span>
          </button>
          )}

          {SHOW_CART_VIEW_TOGGLE && (
          <div className={styles.salesViewToggleGroup} role="group" aria-label="รูปแบบการแสดงรายการขาย">
            <button
              type="button"
              title="แสดงรายการแบบเต็ม (พร้อมรูปสินค้า)"
              disabled={posGridMode}
              onClick={() => { setshowcolor("1"), setsavemu("1"), localStorage.setItem("mu", "1") }}
              className={`${styles.salesViewToggleButton} ${showcolor === "1" ? styles.salesViewToggleButtonActiveGrid : ""}`}
            >
              <LayoutGrid size={16} strokeWidth={2.2} />
            </button>

            <button
              type="button"
              title={compactCartView ? "แสดงรายการแบบย่อ (เฉพาะชื่อ/รหัส/จำนวน/ราคา)" : "แสดงรายการแบบเต็ม (ทุกคอลัมน์)"}
              disabled={posGridMode}
              onClick={() => { const next = !compactCartView; setCompactCartView(next); localStorage.setItem("compactCartView", String(next)) }}
              className={`${styles.salesViewToggleButton} ${compactCartView ? styles.salesViewToggleButtonActiveRows : ""}`}
            >
              <Rows3 size={16} strokeWidth={2.2} />
            </button>
          </div>
          )}

          {SHOW_CUSTOMER_SCREEN_BUTTON && (
          <button
            type="button"
            onClick={() => { openCustomerOnSecondScreen() }}
            className={`${styles.salesCommandButton} ${styles.salesCommandButtonPrimary}`}
          >
            <Monitor size={15} strokeWidth={2.2} />
            <span>จอลูกค้า</span>
          </button>
          )}

          {/* ลูกค้าของบิล (ปุ่มค้นหา + ป้ายข้อมูลลูกค้า) ย้ายไปไว้เหนือแผง "คิววันนี้"
              ในคอลัมน์ขวาแล้ว — ดู <CustomerCommand layout="stack" /> ใน body_sale.tsx */}

          {/* ถาดไอคอนเครื่องมือ — ไม่เรนเดอร์เลยถ้าเครื่องมือข้างในถูกปิดหมด ไม่งั้นจะเหลือกรอบเปล่าคาไว้ */}
          {SHOW_SALES_ICON_RAIL && (
          <div className={styles.salesIconRail} role="group" aria-label="เครื่องมือหน้าขาย">
            {SHOW_SELLER_CHAT_BUTTON && !isElectron && <SellerCommunicationModal />}

            {SHOW_TEMPERATURE_BUTTON && <TemperatureModal />}

            {SHOW_PEDIATRIC_BUTTON && (
            <button
              type="button"
              title={globalChildWeight > 0 ? `น้ำหนักเด็ก ${globalChildWeight} kg (คลิกเพื่อแก้ไข)` : 'น้ำหนักเด็ก (คำนวณขนาดสินค้าเด็ก)'}
              aria-label="น้ำหนักเด็ก"
              aria-pressed={globalChildWeight > 0}
              onClick={() => setShowPediatricModalStore(true)}
              className={`${styles.salesIconAction} ${globalChildWeight > 0 ? styles.salesIconActionOnInfo : styles.salesIconActionBaby}`}
            >
              <Baby size={17} strokeWidth={2.1} />
              {globalChildWeight > 0 && <span className={styles.salesIconBadge}>{globalChildWeight}</span>}
            </button>
            )}

            {SHOW_HIDE_PRICE_TOGGLE && (
            <button
              type="button"
              title={hideCustomerPrice ? 'ซ่อนราคาอยู่ (คลิกเพื่อแสดงราคาให้ลูกค้าเห็น)' : 'แสดงราคาอยู่ (คลิกเพื่อซ่อนราคาจากลูกค้า)'}
              aria-label={hideCustomerPrice ? 'ซ่อนราคา' : 'แสดงราคา'}
              aria-pressed={hideCustomerPrice}
              onClick={toggleHideCustomerPrice}
              className={`${styles.salesIconAction} ${hideCustomerPrice ? styles.salesIconActionOnDanger : styles.salesIconActionPrice}`}
            >
              {hideCustomerPrice ? <EyeOff size={17} strokeWidth={2.1} /> : <Eye size={17} strokeWidth={2.1} />}
            </button>
            )}
          </div>
          )}

          {/* สลับโหมดสแกนเนอร์ปกติ/ช้า — ซ่อนอยู่ แต่ค่าที่ตั้งไว้ยังมีผลกับเกณฑ์จับบาร์โค้ด */}
          {SHOW_SCANNER_SPEED_TOGGLE && (
          <button
            type="button"
            title={fastScannerMode ? 'โหมดสแกนปกติ (คลิกเพื่อเปลี่ยนเป็นโหมดสแกนเนอร์ช้า)' : 'สำหรับสแกนเนอร์ช้า ๆ (คลิกเพื่อกลับโหมดปกติ)'}
            aria-label="Toggle slow scanner mode"
            onClick={toggleFastScannerMode}
            className={`${styles.salesScannerToggle} ${fastScannerMode ? "" : styles.salesScannerToggleSlow}`}
          >
            {fastScannerMode ? <span className={styles.salesScannerDot} /> : <><Gauge size={13} strokeWidth={2.3} /><span>สแกนเนอร์ช้า</span></>}
          </button>
          )}
        </div>
      </div>
    )
  }

  const [loading, setLoading] = useState(true);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if running in Electron (client-side only)
    setIsElectron(typeof window !== 'undefined' && !!(window as any).electron);
  }, []);

  // loading is now controlled by fetchPosts().finally() above

  return (

    <>
      <LoadingOverlay show={loading} />
      <div className="row  ">

        <div className="row ">

          {/*ตาราง สินค้า*/}


          {message === "" ? <KeyScan /> : ""}







        </div>




        <IDContext_SaleItem.Provider value={idc}>
          <BodyTabSale data1={idDatalist} data2={selectCount} />
        </IDContext_SaleItem.Provider>


      </div>
    </>









  )

}


export default BodyTabIndex




export function useSaleContext() {
  return useContext(IDContext_SaleItem)
}
