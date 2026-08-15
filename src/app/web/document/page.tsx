'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue, Suspense, createContext, useContext, ChangeEvent, KeyboardEvent } from 'react'
import dynamic from 'next/dynamic'
import MenuTab_Small from "../componant/menutab_small.tsx"
import HeadTab from "../componant/headtab.jsx"
import PermissionGuard from '@/components/PermissionGuard'
import styles from "../componant/mystyle.module.css";
import SalesTaxReport from "./SalesTaxReport";
import PurchaseTaxReport from "./PurchaseTaxReport";
import PurchaseDebitNote from "./PurchaseDebitNote";
import PurchaseCreditNote from "./PurchaseCreditNote";
import PurchaseTaxInvoiceReportModal from "./PurchaseTaxInvoiceReportModal";
import { FileText, FileCheck, Receipt as ReceiptIcon, CreditCard, FileSpreadsheet, Search, Plus, ClipboardList, Package, Truck, BookOpen, AlertCircle, ChevronRight, Calendar, Settings2, Landmark, PencilLine, Signature, Trash2, Wallet } from 'lucide-react';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,

  useDisclosure,
  RadioGroup, Radio
} from "@heroui/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
const btncolors = "#3E86C7"
const btncolort = "white"
import axios from 'axios'
import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';
import Tab from 'react-bootstrap/Tab';
import '../componant/custom.css';
import Modal_qa from 'react-bootstrap/Modal';
import Modal_blv from 'react-bootstrap/Modal';
import Modal_ble from 'react-bootstrap/Modal';
import Modal_blr from 'react-bootstrap/Modal';
import Modal_blt from 'react-bootstrap/Modal';
import Modal_blrc from 'react-bootstrap/Modal';
import Modal_dnv from 'react-bootstrap/Modal';
import Modal_dne from 'react-bootstrap/Modal';


import { useReactToPrint } from "react-to-print";
import Image from "next/image";
import deletes from "../../icon/delete-junk.svg"
import Modal_dc from 'react-bootstrap/Modal';
import Modal_ds from 'react-bootstrap/Modal';
import Modal_qty from 'react-bootstrap/Modal';

import Button3 from 'react-bootstrap/Button';
import Button1 from 'react-bootstrap/Button';
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

const apidatalist = "datalist"

import Modal1 from 'react-bootstrap/Modal';
const apipromotion = "promotion"

const apiquatation = "quatation"
const apiquatation_detail = "quatation_detail"

const apicustomer = "customer"
const getstore = "setting/store/store"

const apireceive = "receive"
const apircitem = "dataitemlist"

import { DataGrid, GridRowsProp, GridColDef } from '@mui/x-data-grid';


import Dropdown from 'react-bootstrap/Dropdown';

import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';


type Row = { id: number; item: string; qty: number; price: number };
type SalesDocumentType = "qt" | "bl" | "inv" | "re" | "tax" | "debit" | "credit" | "dn"
type FollowUpDocumentAction = {
  targetType: SalesDocumentType
  label: string
  icon: React.ReactNode
}
type CreditNoteItemInput = {
  id: string
  sourceDetailId: string
  name: string
  qty: string
  amount: string
}
type ReceiptPaymentAccount = {
  id: number
  company?: string | null
  bank?: string | null
  name?: string | null
  bookbankno?: string | null
  promtpayno?: string | null
  publicId?: string | null
}

type ReceiptPaymentSelection = {
  channel: string
  label: string
  accountId: number | null
  bank: string
  name: string
  accountNumber: string
  promptPayNumber: string
  customText: string
}

type EmployeeSignatureOption = {
  id: number
  name?: string | null
  username?: string | null
  position?: string | null
}

type DocumentAttachmentInfo = {
  exists: boolean
  docType: SalesDocumentType
  docId: number
  slot?: string | null
  fileName: string
  fileSize: number
  updatedAt: number | null
  url: string | null
}

type DocumentAttachmentState = {
  loading: boolean
  error: string
  data: DocumentAttachmentInfo | null
}

const createEmptyDocumentAttachmentState = (): DocumentAttachmentState => ({
  loading: false,
  error: "",
  data: null,
})

const createInitialDocumentAttachments = (): Record<SalesDocumentType, DocumentAttachmentState> => ({
  qt: createEmptyDocumentAttachmentState(),
  bl: createEmptyDocumentAttachmentState(),
  inv: createEmptyDocumentAttachmentState(),
  re: createEmptyDocumentAttachmentState(),
  tax: createEmptyDocumentAttachmentState(),
  debit: createEmptyDocumentAttachmentState(),
  credit: createEmptyDocumentAttachmentState(),
  dn: createEmptyDocumentAttachmentState(),
})

const PRODUCT_PICKER_INITIAL_LIMIT = 120
const PRODUCT_PICKER_SEARCH_LIMIT = 180
const RECEIPT_SLIP_ATTACHMENT_SLOT = "slip"
const RECEIPT_PROMPTPAY_CHANNEL_LABEL = "PromptPay"
const RECEIPT_BANK_CHANNEL_LABEL = "โอนเงินผ่านธนาคาร"
const RECEIPT_OTHER_CHANNEL_LABEL = "อื่นๆ"
const RECEIPT_PAYMENT_OPTIONS = [
  "เงินสด",
  RECEIPT_PROMPTPAY_CHANNEL_LABEL,
  RECEIPT_BANK_CHANNEL_LABEL,
  "เช็คธนาคาร",
  "บัตรเครดิต/เดบิต",
  RECEIPT_OTHER_CHANNEL_LABEL,
] as const

const THAI_BANK_OPTIONS = [
  "ธนาคารกรุงเทพ",
  "ธนาคารกรุงไทย",
  "ธนาคารไทยพาณิชย์",
  "ธนาคารกสิกรไทย",
  "ธนาคารทหารไทยธนชาต",
  "ธนาคารกรุงศรีอยุธยา",
  "ธนาคารทิสโก้",
  "ธนาคารเกียรตินาคินภัทร",
  "ธนาคารยูโอบี",
  "ธนาคารสแตนดาร์ดชาร์เตอร์ด (ไทย)",
  "ธนาคารไอซีบีซี (ไทย)",
  "ธนาคารซีไอเอ็มบีไทย",
  "ธนาคารแลนด์แอนด์เฮ้าส์",
] as const

const DEBIT_NOTE_VAT_RATE = 7
const CREDIT_NOTE_VAT_RATE = 7

const roundDocumentCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

const formatDocumentCurrency = (value: string | number | null | undefined) => (
  roundDocumentCurrency(Number(value || 0)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
)

const formatDocumentQuantity = (value: string | number | null | undefined) => (
  roundDocumentCurrency(Number(value || 0)).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
)

const formatDocumentAttachmentSize = (value: number | null | undefined) => {
  const size = Number(value || 0)
  if (size <= 0) return "0 KB"
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`
  }

  return `${Math.max(size / 1024, 0.1).toFixed(1)} KB`
}

const createCreditNoteItem = (overrides: Partial<CreditNoteItemInput> = {}): CreditNoteItemInput => ({
  id: overrides.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  sourceDetailId: overrides.sourceDetailId || "",
  name: overrides.name || "",
  qty: overrides.qty || "1",
  amount: overrides.amount || "",
})

const normalizeCreditNoteItems = (source: any): CreditNoteItemInput[] => {
  const rawItems = Array.isArray(source?.credit_items_json) ? source.credit_items_json : []
  if (rawItems.length > 0) {
    return rawItems.map((item: any, index: number) => createCreditNoteItem({
      id: String(item?.id || `${Date.now()}-${index}`),
      sourceDetailId: String(item?.sourceDetailId || item?.detailId || ""),
      name: String(item?.name || item?.itemName || ""),
      qty: String(item?.qty ?? item?.quantity ?? "1"),
      amount: String(item?.amount ?? item?.reduceAmount ?? ""),
    }))
  }

  if (source?.credit_item_name || source?.credit_item_qty || source?.credit_reduce_amount) {
    return [createCreditNoteItem({
      name: String(source?.credit_item_name || ""),
      qty: String(source?.credit_item_qty ?? "1"),
      amount: String(source?.credit_reduce_amount ?? ""),
    })]
  }

  return [createCreditNoteItem()]
}

const getDebitNoteAmounts = (source: any) => {
  const originalAmount = roundDocumentCurrency(Number(source?.debit_original_amount || 0))
  const correctAmount = roundDocumentCurrency(Number(source?.debit_correct_amount || 0))
  const hasStoredDifference = source?.debit_difference_amount !== undefined
    && source?.debit_difference_amount !== null
    && source?.debit_difference_amount !== ""
  const differenceAmount = roundDocumentCurrency(
    hasStoredDifference
      ? Number(source?.debit_difference_amount || 0)
      : correctAmount - originalAmount
  )
  const vatRate = Number(source?.debit_vat_rate || DEBIT_NOTE_VAT_RATE)
  const vatAmount = roundDocumentCurrency(differenceAmount > 0 ? (differenceAmount * vatRate) / 100 : 0)
  const grandTotal = roundDocumentCurrency(differenceAmount > 0 ? differenceAmount + vatAmount : 0)

  return {
    originalAmount,
    correctAmount,
    differenceAmount,
    vatRate,
    vatAmount,
    grandTotal,
  }
}

const getCreditNoteAmounts = (source: any) => {
  const normalizedItems = normalizeCreditNoteItems(source)
  const itemDifferenceAmount = roundDocumentCurrency(normalizedItems.reduce((sum: number, item) => sum + Number(item.amount || 0), 0))
  const hasStoredDifference = source?.credit_difference_amount !== undefined
    && source?.credit_difference_amount !== null
    && source?.credit_difference_amount !== ""
  const differenceAmount = roundDocumentCurrency(normalizedItems.some((item) => String(item.amount || "").trim() !== "")
    ? itemDifferenceAmount
    : hasStoredDifference
      ? Number(source?.credit_difference_amount || 0)
      : Number(source?.credit_reduce_amount || 0))
  const hasStoredOriginal = source?.credit_original_amount !== undefined
    && source?.credit_original_amount !== null
    && source?.credit_original_amount !== ""
  const originalAmount = roundDocumentCurrency(
    hasStoredOriginal
      ? Number(source?.credit_original_amount || 0)
      : Number(source?.sumtotal || source?.totalall || 0)
  )
  const hasStoredCorrect = source?.credit_correct_amount !== undefined
    && source?.credit_correct_amount !== null
    && source?.credit_correct_amount !== ""
  const correctAmount = roundDocumentCurrency(
    hasStoredCorrect
      ? Number(source?.credit_correct_amount || 0)
      : Math.max(originalAmount - differenceAmount, 0)
  )
  const vatRate = Number(source?.credit_vat_rate || CREDIT_NOTE_VAT_RATE)
  const hasStoredVat = source?.credit_vat_amount !== undefined
    && source?.credit_vat_amount !== null
    && source?.credit_vat_amount !== ""
  const vatAmount = roundDocumentCurrency(
    hasStoredVat
      ? Number(source?.credit_vat_amount || 0)
      : differenceAmount > 0 ? (differenceAmount * vatRate) / 100 : 0
  )
  const hasStoredNet = source?.credit_net_total !== undefined
    && source?.credit_net_total !== null
    && source?.credit_net_total !== ""
  const netTotal = roundDocumentCurrency(
    hasStoredNet
      ? Number(source?.credit_net_total || 0)
      : differenceAmount > 0 ? differenceAmount + vatAmount : 0
  )

  return {
    items: normalizedItems,
    originalAmount,
    correctAmount,
    differenceAmount,
    reduceAmount: differenceAmount,
    vatRate,
    vatAmount,
    netTotal,
    itemQty: roundDocumentCurrency(Number(source?.credit_item_qty || 0)),
  }
}


const generateRows = (n: number): Row[] =>
  Array.from({ length: n }).map((_, i) => ({
    id: i + 1,
    item: `Product ${String(i + 1).padStart(3, "0")}`,
    qty: Math.ceil(Math.random() * 5),
    price: Math.round((Math.random() * 90 + 10) * 100) / 100,
  }));

type DocumentDateInputProps = {
  value?: string;
  onClick?: () => void;
  placeholder?: string;
};

type SafeDateValue = string | number | Date | null | undefined;

const documentDateFormatOptions: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

const parseDocumentDate = (value: SafeDateValue): Date | null => {
  if (!value) return null;

  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getSafeDocumentDate = (value: SafeDateValue, fallback: Date = new Date()): Date => {
  return parseDocumentDate(value) ?? fallback;
};

const formatDocumentDate = (value: SafeDateValue, fallback = "."): string => {
  const date = parseDocumentDate(value);
  return date ? date.toLocaleDateString('es-US', documentDateFormatOptions) : fallback;
};

const formatDocumentTime = (value: SafeDateValue, fallback = ""): string => {
  const date = parseDocumentDate(value);
  return date ? date.toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric" }) : fallback;
};

const DocumentDateInput = React.forwardRef<HTMLButtonElement, DocumentDateInputProps>(
  ({ value, onClick, placeholder }, ref) => (
    <button
      type="button"
      ref={ref}
      onClick={onClick}
      style={{
        width: "100%",
        border: "1px solid #d1d5db",
        borderRadius: 8,
        padding: "6px 12px",
        display: "flex",
        alignItems: "center",
        background: "white",
        gap: 8,
        cursor: "pointer",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#2A6AAA"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#d1d5db"
      }}
    >
      <Calendar size={14} color="#2A6AAA" />
      <span
        style={{
          flex: 1,
          textAlign: "left",
          fontFamily: "kanit",
          fontSize: 13,
          color: "#1f2937",
        }}
      >
        {value || placeholder || "เลือกวันที่"}
      </span>
    </button>
  )
)

DocumentDateInput.displayName = "DocumentDateInput"

type SmoothDocumentTextInputProps = {
  value?: string
  onDraftChange?: (value: string) => void
  onCommit?: (value: string) => void
  placeholder?: string
  className?: string
  style?: React.CSSProperties
}

const SmoothDocumentTextInput = React.memo(function SmoothDocumentTextInput({
  value,
  onDraftChange,
  onCommit,
  placeholder,
  className,
  style,
}: SmoothDocumentTextInputProps) {
  const normalizedValue = String(value ?? "")
  const [draft, setDraft] = useState(normalizedValue)
  const latestValueRef = useRef(normalizedValue)

  useEffect(() => {
    const nextValue = String(value ?? "")
    if (latestValueRef.current !== nextValue) {
      latestValueRef.current = nextValue
      setDraft(nextValue)
    }
  }, [value])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value
    setDraft(nextValue)
    onDraftChange?.(nextValue)
  }

  const handleBlur = () => {
    latestValueRef.current = draft
    onCommit?.(draft)
  }

  return (
    <input
      type="text"
      className={className}
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      style={style}
    />
  )
})

SmoothDocumentTextInput.displayName = "SmoothDocumentTextInput"

/* Self-contained customer picker modal body — all search/filter is local, never re-renders DocPage */
const CustomerPickerBody = React.memo(function CustomerPickerBody({
  customers,
  onSelect,
  autoFocusRef,
  listMaxHeight = 320,
}: {
  customers: any[]
  onSelect: (c: any) => void
  autoFocusRef: React.RefObject<HTMLInputElement | null>
  listMaxHeight?: number
}) {
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c: any) =>
      (c.names || "").toLowerCase().includes(q)
      || (c.code || "").toLowerCase().includes(q)
      || (c.tel || "").toLowerCase().includes(q)
      || (c.numbertax || "").toLowerCase().includes(q)
    )
  }, [customers, query])

  useEffect(() => {
    const frame = requestAnimationFrame(() => autoFocusRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [autoFocusRef])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (filtered.length === 0) return
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedId(prev => {
          const idx = filtered.findIndex((c: any) => c.id === prev)
          return filtered[idx < filtered.length - 1 ? idx + 1 : 0]?.id ?? null
        })
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedId(prev => {
          const idx = filtered.findIndex((c: any) => c.id === prev)
          return filtered[idx > 0 ? idx - 1 : filtered.length - 1]?.id ?? null
        })
      } else if (e.key === "Enter" && selectedId !== null) {
        e.preventDefault()
        const c = filtered.find((c: any) => c.id === selectedId)
        if (c) onSelect(c)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [filtered, selectedId, onSelect])

  useEffect(() => {
    if (selectedId !== null) {
      document.getElementById(`cus-item-${selectedId}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [selectedId])

  const highlightText = (text: string, q: string) => {
    if (!q) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark
          style={{
            backgroundColor: "#fde68a",
            color: "inherit",
            padding: "0 2px",
            borderRadius: 4,
            lineHeight: "inherit",
          }}
        >
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    )
  }

  const trimmedQuery = query.trim()

  return (
    <>
      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="input-group input-group-lg">
          <span className="input-group-text bg-white border-end-0">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input
            ref={autoFocusRef}
            type="text"
            className="form-control border-start-0 shadow-none"
            placeholder="ค้นหาชื่อ, รหัส, เบอร์โทร, เลขภาษี..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedId(null) }}
            style={{ fontFamily: "kanit", fontSize: 15, color: "#1f2937" }}
          />
          {query && (
            <button
              className="btn btn-outline-secondary border-start-0 bg-white"
              type="button"
              onClick={() => { setQuery(""); setSelectedId(null); autoFocusRef.current?.focus() }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="px-3 pb-2">
        <small className="text-muted" style={{ fontFamily: "kanit", fontSize: 12 }}>
          {trimmedQuery ? (
            <>ผลค้นหา <strong className="text-warning">&quot;{trimmedQuery}&quot;</strong> — พบ <strong className="text-dark">{filtered.length}</strong> ราย</>
          ) : (
            <>ลูกค้าทั้งหมด <strong className="text-dark">{filtered.length}</strong> ราย</>
          )}
        </small>
      </div>

      {/* Customer list */}
      <div className="px-3 pb-3" style={{ maxHeight: listMaxHeight, overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-person-slash text-muted" style={{ fontSize: 48 }}></i>
            <p className="mt-2 mb-0 text-muted" style={{ fontFamily: "kanit_B", fontSize: 14 }}>ไม่พบลูกค้า</p>
            <p className="text-muted" style={{ fontFamily: "kanit", fontSize: 12 }}>ลองค้นหาด้วยชื่อ, รหัส หรือเบอร์โทร</p>
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {filtered.map((c: any) => {
              const isActive = selectedId === c.id
              return (
                <button
                  type="button"
                  id={`cus-item-${c.id}`}
                  key={c.id}
                  className={`list-group-item list-group-item-action d-flex align-items-start gap-3 py-2 px-3 rounded-3 mb-1 border-0 ${isActive ? "active" : ""}`}
                  style={{
                    fontFamily: "kanit",
                    backgroundColor: isActive ? "#fff8e1" : undefined,
                    color: isActive ? "#1f2937" : undefined,
                    transition: "background-color 0.12s",
                    textAlign: "left",
                  }}
                  onClick={() => onSelect(c)}
                  onMouseEnter={() => setSelectedId(c.id)}
                  onMouseLeave={() => setSelectedId(prev => prev === c.id ? null : prev)}
                >
                  {/* Avatar */}
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                    style={{
                      width: 40, height: 40, fontFamily: "kanit_B", fontSize: 16,
                      backgroundColor: isActive ? "#d97706" : "#f3f4f6",
                      color: isActive ? "white" : "#6b7280",
                      transition: "all 0.15s",
                    }}
                  >
                    {(c.names || "?").charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-grow-1 min-w-0 d-flex flex-column" style={{ gap: 4 }}>
                    <div className="d-flex flex-wrap align-items-start gap-2">
                      <span
                        className="fw-bold"
                        style={{
                          fontFamily: "kanit_B",
                          fontSize: 14,
                          color: "#1f2937",
                          lineHeight: 1.35,
                          flex: "1 1 180px",
                          minWidth: 0,
                          wordBreak: "break-word",
                        }}
                      >
                        {highlightText(c.names || "-", trimmedQuery)}
                      </span>
                      <span
                        className="badge bg-light text-secondary border"
                        style={{
                          fontFamily: "kanit",
                          fontSize: 10,
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                          alignSelf: "flex-start",
                        }}
                      >
                        {highlightText(c.code || "", trimmedQuery)}
                      </span>
                    </div>
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      {c.tel && (
                        <small
                          className="text-muted d-inline-flex align-items-center gap-1 px-2 py-1 rounded-2 bg-light"
                          style={{ fontFamily: "kanit", fontSize: 11, lineHeight: 1.35 }}
                        >
                          <i className="bi bi-telephone" style={{ fontSize: 10 }}></i>
                          {highlightText(c.tel, trimmedQuery)}
                        </small>
                      )}
                      {c.numbertax && (
                        <small
                          className="text-muted d-inline-flex align-items-center gap-1 px-2 py-1 rounded-2 bg-light"
                          style={{ fontFamily: "kanit", fontSize: 11, lineHeight: 1.35 }}
                        >
                          <i className="bi bi-file-text" style={{ fontSize: 10 }}></i>
                          {highlightText(c.numbertax, trimmedQuery)}
                        </small>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <i
                    className={`bi bi-chevron-right ${isActive ? "text-warning" : "text-muted opacity-25"}`}
                    style={{ fontSize: 14, transition: "all 0.15s", marginTop: 10 }}
                  ></i>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
})

const ProductPickerTrigger = React.memo(function ProductPickerTrigger({
  products,
  onAddProduct,
}: {
  products: any[]
  onAddProduct: (product: any, qty: number) => Promise<void>
}) {
  const [show, setShow] = useState(false)
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const [selectedProductId, setSelectedProductId] = useState<number | string | null>(null)
  const [qty, setQty] = useState("1")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { visibleProducts, totalMatches, wasLimited } = useMemo(() => {
    const source = Array.isArray(products) ? products : []
    const normalizedQuery = deferredQuery.trim().toLowerCase()
    const limit = normalizedQuery ? PRODUCT_PICKER_SEARCH_LIMIT : PRODUCT_PICKER_INITIAL_LIMIT

    if (!normalizedQuery) {
      return {
        visibleProducts: source.slice(0, limit),
        totalMatches: source.length,
        wasLimited: source.length > limit,
      }
    }

    const matches: any[] = []
    let total = 0

    for (const product of source) {
      const matchesQuery =
        String(product?.ProductName || "").toLowerCase().includes(normalizedQuery)
        || String(product?.code || "").toLowerCase().includes(normalizedQuery)
        || String(product?.Barcode || "").toLowerCase().includes(normalizedQuery)

      if (!matchesQuery) continue

      total += 1
      if (matches.length < limit) {
        matches.push(product)
      }
    }

    return {
      visibleProducts: matches,
      totalMatches: total,
      wasLimited: total > limit,
    }
  }, [products, deferredQuery])

  useEffect(() => {
    if (!show) {
      setQuery("")
      setSelectedProductId(null)
      setQty("1")
      return
    }

    const frame = requestAnimationFrame(() => searchInputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [show])

  useEffect(() => {
    if (!show) return

    if (visibleProducts.length === 0) {
      setSelectedProductId(null)
      return
    }

    setSelectedProductId((prev) => {
      const hasPrevious = visibleProducts.some((product: any) => String(product?.id) === String(prev))
      return hasPrevious ? prev : visibleProducts[0]?.id ?? null
    })
  }, [show, visibleProducts])

  const selectedProduct = useMemo(() => {
    if (selectedProductId === null) {
      return visibleProducts[0] ?? null
    }

    const source = Array.isArray(products) ? products : []
    return source.find((product: any) => String(product?.id) === String(selectedProductId))
      ?? visibleProducts.find((product: any) => String(product?.id) === String(selectedProductId))
      ?? visibleProducts[0]
      ?? null
  }, [products, selectedProductId, visibleProducts])

  const safeQty = Math.max(1, Number(qty || 1))
  const selectedPrice = Number(selectedProduct?.price || 0)
  const selectedTotal = selectedPrice * safeQty

  const handleAdd = async () => {
    if (!selectedProduct || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onAddProduct(selectedProduct, safeQty)
      setShow(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setShow(true)
        }}
        style={{
          fontFamily: "Kanit",
          fontSize: 13,
          padding: "6px 16px",
          borderRadius: 8,
          border: "1.5px solid #2A6AAA",
          backgroundColor: "#F3F8FC",
          color: "#2A6AAA",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          transition: "all 0.15s",
          whiteSpace: "nowrap",
          fontWeight: 600,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#E5EEF8"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#F3F8FC"
        }}
      >
        + เพิ่มสินค้า
      </button>

      <Modal1
        show={show}
        onHide={() => setShow(false)}
        className="document-modal product-picker-modal"
        dialogClassName="document-modal-dialog"
        backdropClassName="document-modal-backdrop product-picker-modal-backdrop"
        animation={false}
      >
        <Modal1.Header closeButton>
          <Modal1.Title style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, height: 20 }}>
            ค้นหาชื่อ, รหัส, Barcode สินค้า
          </Modal1.Title>
        </Modal1.Header>
        <Modal1.Body>
          <div className="input-group input-group-sm mb-2">
            <span className="input-group-text bg-white">
              <Search size={14} color="#6b7280" />
            </span>
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="form-control"
              placeholder="ค้นหาชื่อ, รหัส, Barcode สินค้า"
              style={{ fontFamily: "Kanit", fontSize: 12, color: "#1f2937" }}
            />
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap" style={{ gap: 8, marginBottom: 10 }}>
            <small className="text-muted" style={{ fontFamily: "kanit", fontSize: 11 }}>
              {deferredQuery.trim()
                ? `ผลค้นหา \"${deferredQuery.trim()}\" ${totalMatches.toLocaleString()} รายการ`
                : `สินค้าทั้งหมด ${totalMatches.toLocaleString()} รายการ`}
            </small>
            {wasLimited && (
              <small className="text-muted" style={{ fontFamily: "kanit", fontSize: 11 }}>
                แสดง {visibleProducts.length.toLocaleString()} รายการแรกเพื่อให้เปิดได้ลื่นขึ้น
              </small>
            )}
          </div>

          <div style={{ maxHeight: "50vh", overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 10, overflowX: "hidden" }}>
            <table className="table table-sm table-hover mb-0" style={{ tableLayout: "fixed" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <th style={{ fontFamily: "kanit_B", fontSize: 11, width: "18%", color: "#374151" }}>รหัสสินค้า</th>
                  <th style={{ fontFamily: "kanit_B", fontSize: 11, width: "52%", color: "#374151" }}>ชื่อสินค้า</th>
                  <th style={{ fontFamily: "kanit_B", fontSize: 11, width: "30%", color: "#374151" }}>Barcode</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((product: any) => {
                  const isActive = String(product?.id) === String(selectedProductId)
                  return (
                    <tr
                      key={product?.id ?? `${product?.code}-${product?.Barcode}`}
                      onClick={() => setSelectedProductId(product?.id ?? null)}
                      onDoubleClick={() => {
                        setSelectedProductId(product?.id ?? null)
                      }}
                      style={{
                        cursor: "pointer",
                        backgroundColor: isActive ? "#EDF9F3" : "white",
                      }}
                    >
                      <td style={{ fontFamily: "kanit", fontSize: 12, color: "#1f2937" }}>{product?.code || "-"}</td>
                      <td style={{ fontFamily: "kanit", fontSize: 12, color: "#1f2937", wordBreak: "break-word" }}>{product?.ProductName || "-"}</td>
                      <td style={{ fontFamily: "kanit", fontSize: 12, color: "#4b5563" }}>{product?.Barcode || "-"}</td>
                    </tr>
                  )
                })}
                {visibleProducts.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: "24px 12px", fontFamily: "kanit", fontSize: 12, color: "#6b7280" }}>
                      ไม่พบสินค้า
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
            <div style={{ fontFamily: "Kanit_B", textAlign: "left", fontSize: 15, color: "#1f2937", minHeight: 24 }}>
              {selectedProduct ? `${selectedProduct.code || ""} ${selectedProduct.ProductName || ""}`.trim() : "เลือกสินค้า"}
            </div>
            <div className="d-flex flex-wrap align-items-center" style={{ gap: 12, marginTop: 10 }}>
              <div style={{ fontFamily: "Kanit", fontSize: 15 }}>ราคา : {selectedPrice.toLocaleString()} บาท</div>
              <div className="d-flex align-items-center" style={{ gap: 8 }}>
                <div style={{ fontFamily: "Kanit", fontSize: 15 }}>จำนวน</div>
                <input
                  className="form-control form-control-sm"
                  style={{ width: 64, height: 32, fontSize: 16, fontFamily: "Kanit_B", textAlign: "center" }}
                  value={qty}
                  onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ""))}
                />
                <div style={{ fontFamily: "Kanit", fontSize: 15 }}>{selectedProduct?.Unit || "หน่วย"}</div>
              </div>
              <div style={{ fontFamily: "Kanit", fontSize: 15 }}>ราคารวม : {selectedTotal.toLocaleString()} บาท</div>
            </div>
          </div>
        </Modal1.Body>
        <Modal1.Footer>
          <button
            className="btn btn-secondary"
            style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
            onClick={() => setShow(false)}
            disabled={isSubmitting}
          >
            ปิด
          </button>
          <button
            className="btn btn-primary"
            style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit_B" }}
            onClick={handleAdd}
            disabled={!selectedProduct || isSubmitting}
          >
            {isSubmitting ? "..." : "เพิ่ม"}
          </button>
        </Modal1.Footer>
      </Modal1>
    </>
  )
})

function DocPage() {

  const [idcus, setidcus] = useState(0)
  const [ids, setids] = useState(0)
  const [qt, setqt] = useState([])
  const [qt_detail, setqt_detail] = useState([])
  const [searchname, setPosts] = useState([])
  const [dataProduct, setdataProduct] = useState([])


  const initialValues = {
    company: "",
    code: "",
    names: "",
    sex: "",
    idcode: "",
    age: "",
    birthday: "",
    address: "",
    branch: "",
    levelPrice: "",
    tel: "",
    pointStart: "",
    point: "",
    totalPoint: "",
    customer: "",
    numbertax: "",
    drugallergy: "",
    congenitalDisease: "",
    statuss: "",
  };

  const [all, setall1] = useState(initialValues)

  const initial10 = {
    names: "",
    totalPoint: "",
    id_main: "",
    id_costomer: "",
    code_costomer: "",
    name_costomer: "",
    group_price: "",
    promotion: "",
    pay: "",
    bill: "",
    total: "",
    discount: "",
    sumtotal: "",
    totalall: "",
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
    qt_orderfull: "",
    qt_status: "",
    qt_person: "",
    qt_remark: "",

    bl_date: "",
    bl_enddate: "",
    bl_credit: "",
    bl_number: "",
    bl_orderNo: "",
    bl_orderfull: "",
    bl_status: "",
    bl_person: "",
    bl_remark: "",

    inv_date: "",
    inv_enddate: "",
    inv_credit: "",
    inv_number: "",
    inv_orderNo: "",
    inv_orderfull: "",
    inv_status: "",
    inv_person: "",
    inv_remark: "",

    re_date: "",
    re_enddate: "",
    re_credit: "",
    re_number: "",
    re_orderNo: "",
    re_orderfull: "",
    re_status: "",
    re_person: "",
    re_remark: "",

    dn_date: "" as any,
    dn_enddate: "" as any,
    dn_credit: "" as any,
    dn_number: "" as any,
    dn_orderNo: "",
    dn_orderfull: "",
    dn_status: "" as any,
    dn_person: "",
    dn_remark: "",
    dn_paytype: "",
    dn_deposit: "" as any,
    dn_balance: "" as any,

    tax_date: "",
    tax_enddate: "",
    tax_credit: "",
    tax_number: "",
    tax_orderNo: "",
    tax_orderfull: "",
    tax_status: "",
    tax_person: "",
    tax_remark: "",

    debit_date: "",
    debit_enddate: "",
    debit_credit: "",
    debit_number: "",
    debit_orderNo: "",
    debit_orderfull: "",
    debit_status: "",
    debit_person: "",
    debit_remark: "",
    debit_reference_no: "",
    debit_reason: "",
    debit_original_amount: "",
    debit_correct_amount: "",
    debit_difference_amount: "",
    debit_vat_rate: DEBIT_NOTE_VAT_RATE,
    debit_vat_amount: "",
    debit_grand_total: "",

    credit_date: "",
    credit_enddate: "",
    credit_credit: "",
    credit_number: "",
    credit_orderNo: "",
    credit_orderfull: "",
    credit_status: "",
    credit_person: "",
    credit_remark: "",
    credit_reference_no: "",
    credit_reference_book_no: "",
    credit_reason: "",
    credit_item_name: "",
    credit_item_qty: "",
    credit_items_json: [],
    credit_original_amount: "",
    credit_correct_amount: "",
    credit_difference_amount: "",
    credit_reduce_amount: "",
    credit_vat_rate: CREDIT_NOTE_VAT_RATE,
    credit_vat_amount: "",
    credit_net_total: "",
  };

  const [allQT, setQT] = useState(initial10)
  const [documentAttachments, setDocumentAttachments] = useState<Record<SalesDocumentType, DocumentAttachmentState>>(createInitialDocumentAttachments)
  const [receiptSlipAttachment, setReceiptSlipAttachment] = useState<DocumentAttachmentState>(createEmptyDocumentAttachmentState)
  const attachmentInputRefs = useRef<Record<SalesDocumentType, HTMLInputElement | null>>({
    qt: null,
    bl: null,
    inv: null,
    re: null,
    tax: null,
    debit: null,
    credit: null,
    dn: null,
  })
  const receiptSlipInputRef = useRef<HTMLInputElement | null>(null)
  const latestDocumentIdRef = useRef(0)

  useEffect(() => {
    latestDocumentIdRef.current = Number(ids || 0)
  }, [ids])

  // Date state for QT DatePickers (at DocPage level to avoid re-mount)
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [startDate1, setStartDate1] = useState<Date>(new Date());
  const [paymentAccounts, setPaymentAccounts] = useState<ReceiptPaymentAccount[]>([])
  const [paymentAccountsLoading, setPaymentAccountsLoading] = useState(false)
  const [paymentAccountSaving, setPaymentAccountSaving] = useState(false)
  const [paymentAccountError, setPaymentAccountError] = useState("")
  const [showReceiptPaymentSettings, setShowReceiptPaymentSettings] = useState(false)
  const [editingPaymentAccountId, setEditingPaymentAccountId] = useState<number | null>(null)
  const [paymentAccountForm, setPaymentAccountForm] = useState({
    bank: "",
    name: "",
    bookbankno: "",
    promtpayno: "",
  })
  const paymentAccountNameInputRef = useRef<HTMLInputElement | null>(null)
  const paymentAccountNumberInputRef = useRef<HTMLInputElement | null>(null)
  const paymentAccountPromptPayInputRef = useRef<HTMLInputElement | null>(null)
  const [paymentAccountFormVersion, setPaymentAccountFormVersion] = useState(0)
  const [signatureEmployees, setSignatureEmployees] = useState<EmployeeSignatureOption[]>([])
  const [signatureEmployeesLoading, setSignatureEmployeesLoading] = useState(false)
  const [selectedSignatureEmployeeId, setSelectedSignatureEmployeeId] = useState("")
  const [documentSignatureUrl, setDocumentSignatureUrl] = useState("")
  const [documentSignatureName, setDocumentSignatureName] = useState("")
  const documentSignatureNameDraftRef = useRef("")
  const [documentSignatureDate, setDocumentSignatureDate] = useState("")
  const [documentSignatureLoading, setDocumentSignatureLoading] = useState(false)
  const [includeDocumentSignatureInfo, setIncludeDocumentSignatureInfo] = useState(true)

  const syncDocumentSignatureName = (value: any) => {
    const nextValue = String(value ?? "")
    documentSignatureNameDraftRef.current = nextValue
    setDocumentSignatureName(nextValue)
  }

  const toDocumentSignatureInputDate = (value: any) => {
    if (!value) {
      const today = new Date()
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
    }

    const rawValue = String(value || "").trim()
    const thaiDateMatch = rawValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (thaiDateMatch) {
      const [, dayValue, monthValue, yearValue] = thaiDateMatch
      return `${yearValue}-${monthValue.padStart(2, "0")}-${dayValue.padStart(2, "0")}`
    }

    const date = new Date(rawValue)
    if (!Number.isNaN(date.getTime())) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    }

    return rawValue
  }

  const formatDocumentSignatureDisplayDate = (value: string) => {
    if (!value) return "วันที่ ........./.........../.........."
    const dateParts = value.split("-")
    if (dateParts.length === 3) {
      const [yearValue, monthValue, dayValue] = dateParts
      return `${dayValue}/${monthValue}/${yearValue}`
    }
    return value
  }

  const getSignatureEmployeeLabel = (employee: EmployeeSignatureOption) => {
    return String(employee.name || employee.username || `พนักงาน ${employee.id}`).trim()
  }

  const fetchSignatureEmployees = async () => {
    const companyS = localStorage.getItem("company_") || ""
    if (!companyS) {
      setSignatureEmployees([])
      return
    }

    setSignatureEmployeesLoading(true)
    try {
      const res = await axios.get(`/api/setting/employee?id_company=${companyS}`)
      const rows = Array.isArray(res.data) ? res.data : []
      setSignatureEmployees(rows)
    } catch (error) {
      console.error(error)
      setSignatureEmployees([])
    }
    setSignatureEmployeesLoading(false)
  }

  const loadDocumentSignature = async (employeeId: string) => {
    if (!employeeId) {
      setDocumentSignatureUrl("")
      return
    }

    const companyS = localStorage.getItem("company_") || "default"
    setDocumentSignatureLoading(true)
    try {
      const res = await axios.get(`/api/setting/employee-signature?employeeId=${employeeId}&company=${companyS}`)
      const signatureUrl = res.data?.signatureUrl ? `${res.data.signatureUrl}?v=${Date.now()}` : ""
      setDocumentSignatureUrl(signatureUrl)
    } catch (error) {
      console.error(error)
      setDocumentSignatureUrl("")
    }
    setDocumentSignatureLoading(false)
  }

  const fetchPaymentAccounts = async () => {
    const companyS = localStorage.getItem("company_") || ""
    if (!companyS) {
      setPaymentAccounts([])
      return [] as ReceiptPaymentAccount[]
    }

    setPaymentAccountsLoading(true)
    try {
      const res = await axios.get(`/api/setting/payment?company=${companyS}&sort=desc`)
      const rows = Array.isArray(res.data) ? res.data : []
      setPaymentAccounts(rows)
      setPaymentAccountError("")
      return rows as ReceiptPaymentAccount[]
    } catch (error) {
      console.error(error)
      setPaymentAccountError("โหลดบัญชีรับเงินไม่สำเร็จ")
      return [] as ReceiptPaymentAccount[]
    } finally {
      setPaymentAccountsLoading(false)
    }
  }

  const fetchProduct = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apidatalist}?company=${companyS}`)
      setdataProduct(res.data)

    } catch (error) {
      console.error(error)
    }
  }

  //***************************************************** */
  const fetchQT = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apiquatation}?companyall=${companyS}`)
      setqt(res.data)
      console.log(res.data)
      window.dispatchEvent(new Event('docBadgeRefresh'))
    } catch (error) {
      console.error(error)
    }
  }


  useEffect(() => {
    // Fire all independent API calls in parallel
    Promise.allSettled([
      fetchQT(),
      fetchPostStore(),
      seachNames(),
      fetchProduct(),
      fetchPaymentAccounts(),
      fetchSignatureEmployees(),
    ]);
  }, []);

  useEffect(() => {

    if (ids === 0) {
      setall1(initialValues)
      return
    }

    fetchQT_ID()
    fetchQT_IDDetail()
  }, [ids])

  useEffect(() => {
    GetIDCustomer()
  }, [idcus])

  const setDocumentAttachmentState = (docType: SalesDocumentType, nextState: Partial<DocumentAttachmentState>) => {
    setDocumentAttachments((prev) => ({
      ...prev,
      [docType]: {
        ...prev[docType],
        ...nextState,
      },
    }))
  }

  const clearDocumentAttachmentState = (docType: SalesDocumentType) => {
    setDocumentAttachmentState(docType, createEmptyDocumentAttachmentState())
  }

  const setReceiptSlipAttachmentState = (nextState: Partial<DocumentAttachmentState>) => {
    setReceiptSlipAttachment((prev) => ({
      ...prev,
      ...nextState,
    }))
  }

  const clearReceiptSlipAttachmentState = () => {
    setReceiptSlipAttachment(createEmptyDocumentAttachmentState())
  }

  const loadDocumentAttachment = async (docType: SalesDocumentType, overrideId?: number) => {
    const docId = Number(overrideId ?? latestDocumentIdRef.current ?? ids ?? 0)
    if (!docId) {
      clearDocumentAttachmentState(docType)
      return null
    }

    setDocumentAttachmentState(docType, { loading: true, error: "" })

    try {
      const res = await axios.get("/api/document-attachment", {
        params: { docType, docId },
      })
      const nextData = res.data?.exists ? res.data as DocumentAttachmentInfo : null
      setDocumentAttachmentState(docType, { loading: false, error: "", data: nextData })
      return nextData
    } catch (error) {
      console.error(error)
      setDocumentAttachmentState(docType, { loading: false, error: "โหลดไฟล์แนบ PDF ไม่สำเร็จ", data: null })
      return null
    }
  }

  const loadReceiptSlipAttachment = async (overrideId?: number) => {
    const docId = Number(overrideId ?? latestDocumentIdRef.current ?? ids ?? 0)
    if (!docId) {
      clearReceiptSlipAttachmentState()
      return null
    }

    setReceiptSlipAttachmentState({ loading: true, error: "" })

    try {
      const res = await axios.get("/api/document-attachment", {
        params: { docType: "re", docId, slot: RECEIPT_SLIP_ATTACHMENT_SLOT },
      })
      const nextData = res.data?.exists ? res.data as DocumentAttachmentInfo : null
      setReceiptSlipAttachmentState({ loading: false, error: "", data: nextData })
      return nextData
    } catch (error) {
      console.error(error)
      setReceiptSlipAttachmentState({ loading: false, error: "โหลดไฟล์ slip PDF ไม่สำเร็จ", data: null })
      return null
    }
  }

  /*****************QT Get by ID********************************** */
  const fetchQT_ID = async (overrideId?: number) => {
    let companyS = (localStorage.getItem("company_") || "")
    const docId = overrideId ?? Number(ids)
    if (!docId || Number(docId) === 0) {
      return
    }
    try {
      const res = await axios.get(`/api/${apiquatation}/${Number(docId)}`)
      if (res.data != undefined) {
        setQT(res.data)
        setStartDate(getSafeDocumentDate(res.data.qt_date))
        setStartDate1(getSafeDocumentDate(res.data.qt_enddate))
        const personField = documentSignaturePersonFieldByTab[activeDocTab] || "re_person"
        const dateField = documentSignatureDateFieldByTab[activeDocTab] || "re_date"
        syncDocumentSignatureName(String(res.data?.[personField] || res.data?.person || localStorage.getItem("person_") || "").trim())
        setDocumentSignatureDate(toDocumentSignatureInputDate(res.data?.[dateField] || new Date()))
      }

    } catch (error) {
      console.error(error)
    }
  }

  /**************************************************************** */

  const fetchQT_IDDetail = async (overrideId?: number) => {
    let companyS = (localStorage.getItem("company_") || "")
    const docId = overrideId ?? Number(ids)
    try {
      const res = await axios.get(`/api/${apiquatation_detail}?company=${companyS}&id_docmain=${docId}`)
      res.data == undefined ? "" : setqt_detail(res.data)

    } catch (error) {
      console.error(error)
    }
  }

  /*****************QT Delete bt ID******************************************** */
  const DeleteQT_ID = async (id: Number) => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.delete(`/api/${apiquatation_detail}/${id}`)

      fetchQT_IDDetail()
    } catch (error) {
      console.error(error)
    }
  }
  /*********  Get Customer************* */
  const seachNames = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apicustomer}?company=${companyS}`)
      setPosts(res.data)

    } catch (error) {
      console.error(error)
    }
  }

  /*********Get Customer ID************ */
  const GetIDCustomer = async () => {

    if (!idcus || Number(idcus) === 0) {
      setall1(initialValues)
      return
    }

    try {
      const res = await axios.get(`/api/${apicustomer}/${Number(idcus)}`)

      res.data == undefined ? setall1(initialValues) : setall1(res.data)

    } catch (error) {
      console.error(error)
      setall1(initialValues)
    }

  }

  //******************เลือกลูกค้าใน modal เอกสาร ******************************** */
  const [showCusModal, setShowCusModal] = useState(false)
  const customerSearchInputRef = useRef<HTMLInputElement>(null)

  const openCustomerModal = () => {
    setShowCusModal(prev => !prev)
  }

  const selectCustomer = async (cus: any) => {
    setidcus(cus.id)
    setall1(cus)
    setShowCusModal(false)
    // บันทึกลูกค้าลง DocMain
    if (ids && ids !== 0) {
      try {
        await axios.put(`/api/${apiquatation}/${ids}`, {
          id_costomer: cus.id,
          code_costomer: cus.code,
          name_costomer: cus.names,
        })
        await fetchQT()
      } catch (error) {
        console.error("Error updating customer:", error)
      }
    }
  }

  //******************Get Store ร้าน************************************ */

  const [idS, SetId] = useState("")
  const [compa, Setcompany] = useState("")
  const [storeS, SetStore] = useState("")
  const [addressS, SetAddress] = useState("")
  const [telS, SetTel] = useState("")
  const [taxS, SetTax] = useState("")
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedUrl1, setUploadedUrl1] = useState<string | null>(null);

  const fetchPostStore = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      //ร้านค้า
      const res = await axios.get(`/api/${getstore}?company=${companyS}`)  //Get_Employee
      res.data[0] == undefined ? "" : SetId(res.data[0].id)
      res.data[0] == undefined ? "" : Setcompany(res.data[0].company)
      res.data[0] == undefined ? "" : SetStore(res.data[0].namestore)
      res.data[0] == undefined ? "" : SetAddress(res.data[0].address)
      res.data[0] == undefined ? "" : SetTel(res.data[0].tel)
      res.data[0] == undefined ? "" : SetTax(res.data[0].taxnumber)
      res.data[0] == undefined ? "" : setUploadedUrl(res.data[0].publiclogo)
      res.data[0] == undefined ? "" : setUploadedUrl1(res.data[0].publicline)

    } catch (error) {
      console.error(error)
    }

  }

  // **************  Promotion ************************************

  // ============== NEW: Search, Filter & Sidebar State ==============
  const [docSearchTerm, setDocSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeDocTab, setActiveDocTab] = useState("first")

  useEffect(() => {
    setIncludeDocumentSignatureInfo(true)
  }, [ids, activeDocTab])

  const [purchaseDebitOpenReceiveId, setPurchaseDebitOpenReceiveId] = useState<number | null>(null)
  const [purchaseCreditOpenReceiveId, setPurchaseCreditOpenReceiveId] = useState<number | null>(null)
  const [purchaseTaxInvoiceOpenReceiveId, setPurchaseTaxInvoiceOpenReceiveId] = useState<number | null>(null)
  const [selectedDocRow, setSelectedDocRow] = useState<any>(null)
  const documentOrderPrefixMap: Record<SalesDocumentType, string> = {
    qt: "QT",
    bl: "BL",
    inv: "INV",
    re: "RE",
    tax: "TAX",
    debit: "DN",
    credit: "CN",
    dn: "DN",
  }
  const documentLabelMap: Record<SalesDocumentType, string> = {
    qt: "ใบเสนอราคา",
    bl: "ใบวางบิล",
    inv: "ใบแจ้งหนี้",
    re: "ใบเสร็จรับเงิน",
    tax: "ใบกำกับภาษี",
    debit: "ใบเพิ่มหนี้",
    credit: "ใบลดหนี้",
    dn: "ใบส่งสินค้า",
  }

  const deliveryPayTypeLabelMap: Record<string, string> = {
    cash: "เงินสด",
    credit: "เงินเชื่อ",
    deposit: "เงินมัดจำ",
  }

  const salesDocTypes = [
    { key: "first", label: "ใบเสนอราคา", prefix: "qt", icon: "FileText", docPrefix: "QT" },
    { key: "second", label: "ใบวางบิล", prefix: "bl", icon: "ClipboardList", docPrefix: "BL" },
    { key: "delivery", label: "ใบส่งสินค้า", prefix: "dn", icon: "Truck", docPrefix: "DN" },
    { key: "three", label: "ใบแจ้งหนี้", prefix: "inv", icon: "FileCheck", docPrefix: "INV" },
    { key: "four", label: "ใบเสร็จรับเงิน", prefix: "re", icon: "ReceiptIcon", docPrefix: "RE" },
    { key: "five", label: "ใบกำกับภาษี", prefix: "tax", icon: "CreditCard", docPrefix: "TAX" },
    { key: "debit", label: "ใบเพิ่มหนี้", prefix: "debit", icon: "Landmark", docPrefix: "DN" },
    { key: "credit", label: "ใบลดหนี้", prefix: "credit", icon: "Wallet", docPrefix: "CN" },
    { key: "salestax", label: "รายการภาษีขาย", prefix: "", icon: "FileSpreadsheet", docPrefix: "" },
  ]

  const documentSignaturePersonFieldByTab: Record<string, string> = {
    first: "qt_person",
    second: "bl_person",
    three: "inv_person",
    four: "re_person",
    five: "tax_person",
    debit: "debit_person",
    credit: "credit_person",
  }

  const documentSignatureDateFieldByTab: Record<string, string> = {
    first: "qt_date",
    second: "bl_date",
    three: "inv_date",
    four: "re_date",
    five: "tax_date",
    debit: "debit_date",
    credit: "credit_date",
  }

  const getCurrentDocumentSignaturePersonField = () => documentSignaturePersonFieldByTab[activeDocTab] || "re_person"
  const getCurrentDocumentSignatureDateField = () => documentSignatureDateFieldByTab[activeDocTab] || "re_date"

  const getDocumentSellerField = (docType?: SalesDocumentType) => docType ? `${docType}_person` : getCurrentDocumentSignaturePersonField()

  const getEmployeeBySellerName = (sellerName: string) => {
    const normalizedSellerName = String(sellerName || "").trim().toLowerCase()
    if (!normalizedSellerName) return undefined
    return signatureEmployees.find((employee) => getSignatureEmployeeLabel(employee).toLowerCase() === normalizedSellerName)
  }

  const getDocumentSellerEmployeeId = (sellerName: string) => {
    const employee = getEmployeeBySellerName(sellerName)
    return employee ? String(employee.id) : ""
  }

  const getDefaultDocumentSellerName = () => {
    const currentEmployeeId = localStorage.getItem("personid_") || ""
    const currentEmployee = signatureEmployees.find((employee) => String(employee.id) === currentEmployeeId)
    return String(
      (currentEmployee ? getSignatureEmployeeLabel(currentEmployee) : "")
      || localStorage.getItem("person_")
      || ""
    ).trim()
  }

  const getResolvedDocumentSellerName = (docType: SalesDocumentType, fallbackName: any = "") => {
    const sellerField = getDocumentSellerField(docType)
    return String((allQT as any)[sellerField] || fallbackName || (allQT as any).qt_person || getDefaultDocumentSellerName() || "").trim()
  }

  const persistDocumentSellerName = async (docType: SalesDocumentType, sellerName: string) => {
    const docId = Number(latestDocumentIdRef.current || ids || localStorage.getItem("iddoc") || 0)
    if (!docId) return

    try {
      await axios.put(`/api/${apiquatation}/${docId}`, {
        [getDocumentSellerField(docType)]: String(sellerName || "").trim(),
      })
      await fetchQT()
    } catch (error) {
      console.error("Error updating document seller:", error)
    }
  }

  const updateDocumentSellerName = (docType: SalesDocumentType, value: string, options: { persist?: boolean; employeeId?: string } = {}) => {
    const sellerName = String(value || "").trim()
    const sellerField = getDocumentSellerField(docType)

    setQT((prev: any) => ({ ...prev, [sellerField]: sellerName }))

    if (sellerField === getCurrentDocumentSignaturePersonField()) {
      syncDocumentSignatureName(sellerName)
    }

    const nextEmployeeId = options.employeeId || getDocumentSellerEmployeeId(sellerName)
    if (nextEmployeeId !== selectedSignatureEmployeeId) {
      setSelectedSignatureEmployeeId(nextEmployeeId)
    }

    if (options.persist) {
      void persistDocumentSellerName(docType, sellerName)
    }
  }

  const updateDocumentSignatureName = (value: string, docType?: SalesDocumentType) => {
    syncDocumentSignatureName(value)
    const personField = docType ? `${docType}_person` : getCurrentDocumentSignaturePersonField()
    setQT((prev: any) => ({ ...prev, [personField]: value }))
  }

  const handleDocumentSellerEmployeeChange = (docType: SalesDocumentType, event: ChangeEvent<HTMLSelectElement>) => {
    const employeeId = event.target.value
    if (employeeId === "__custom__") return
    const employee = signatureEmployees.find((item) => String(item.id) === employeeId)
    updateDocumentSellerName(docType, employee ? getSignatureEmployeeLabel(employee) : "", { persist: true, employeeId })
  }

  const handleDocumentSignatureEmployeeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const employeeId = event.target.value
    setSelectedSignatureEmployeeId(employeeId)
    const employee = signatureEmployees.find((item) => String(item.id) === employeeId)
    if (employee) {
      updateDocumentSignatureName(getSignatureEmployeeLabel(employee))
      const activeDocType = salesDocTypes.find((doc) => doc.key === activeDocTab)?.prefix as SalesDocumentType | undefined
      if (activeDocType) {
        updateDocumentSellerName(activeDocType, getSignatureEmployeeLabel(employee), { persist: true, employeeId })
      }
    }
  }

  useEffect(() => {
    if (!selectedSignatureEmployeeId) {
      setDocumentSignatureUrl("")
      return
    }
    void loadDocumentSignature(selectedSignatureEmployeeId)
  }, [selectedSignatureEmployeeId])

  useEffect(() => {
    if (selectedSignatureEmployeeId || signatureEmployees.length === 0) return
    const currentEmployeeId = localStorage.getItem("personid_") || ""
    if (!currentEmployeeId) return
    const currentEmployee = signatureEmployees.find((item) => String(item.id) === currentEmployeeId)
    if (!currentEmployee) return
    setSelectedSignatureEmployeeId(String(currentEmployee.id))
    if (!documentSignatureName) {
      updateDocumentSignatureName(getSignatureEmployeeLabel(currentEmployee))
    }
  }, [signatureEmployees.length, selectedSignatureEmployeeId])

  useEffect(() => {
    const savedSignerName = String(documentSignatureName || "").trim().toLowerCase()
    if (!savedSignerName || signatureEmployees.length === 0) return
    const matchedEmployee = signatureEmployees.find((item) => getSignatureEmployeeLabel(item).toLowerCase() === savedSignerName)
    if (!matchedEmployee) return
    const matchedEmployeeId = String(matchedEmployee.id)
    if (selectedSignatureEmployeeId === matchedEmployeeId) return
    setSelectedSignatureEmployeeId(matchedEmployeeId)
  }, [documentSignatureName, signatureEmployees, selectedSignatureEmployeeId])

  useEffect(() => {
    const personField = getCurrentDocumentSignaturePersonField()
    const dateField = getCurrentDocumentSignatureDateField()
    const nextName = String((allQT as any)[personField] || (allQT as any).person || localStorage.getItem("person_") || "").trim()
    const nextDate = toDocumentSignatureInputDate((allQT as any)[dateField] || new Date())
    syncDocumentSignatureName(nextName)
    setDocumentSignatureDate(nextDate)
  }, [ids, activeDocTab])

  const purchaseDocTypes = [
    { key: "six", label: "ใบสั่งสินค้า", icon: "Truck" },
    { key: "seven", label: "ใบรับสินค้า", icon: "Package" },
   
    { key: "purchasedebit", label: "ใบเพิ่มหนี้ซื้อ", icon: "Landmark" },
    { key: "purchasecredit", label: "ใบลดหนี้ซื้อ", icon: "Wallet" },
     { key: "purchasetax", label: "รายการภาษีซื้อ", icon: "BookOpen" },
  ]

  const showWorkflowStepper = !["salestax", "six", "seven", "purchasetax", "purchasedebit", "purchasecredit", "delivery"].includes(activeDocTab)

  const openPurchaseDebitFromReceive = (receiveId: number) => {
    setSelectedDocRow(null)
    setPurchaseCreditOpenReceiveId(null)
    setPurchaseDebitOpenReceiveId(receiveId)
    setActiveDocTab("purchasedebit")
  }

  const openPurchaseCreditFromReceive = (receiveId: number) => {
    setSelectedDocRow(null)
    setPurchaseDebitOpenReceiveId(null)
    setPurchaseCreditOpenReceiveId(receiveId)
    setActiveDocTab("purchasecredit")
  }

  const openPurchaseTaxInvoiceFromReceive = (receiveId: number) => {
    setSelectedDocRow(null)
    setPurchaseDebitOpenReceiveId(null)
    setPurchaseCreditOpenReceiveId(null)
    setPurchaseTaxInvoiceOpenReceiveId(receiveId)
  }

  const getDocIcon = (iconName: string, size: number = 18) => {
    switch (iconName) {
      case "FileText": return <FileText size={size} />
      case "ClipboardList": return <ClipboardList size={size} />
      case "FileCheck": return <FileCheck size={size} />
      case "Truck": return <Truck size={size} />
      case "Package": return <Package size={size} />
      case "BookOpen": return <BookOpen size={size} />
      case "ReceiptIcon": return <ReceiptIcon size={size} />
      case "CreditCard": return <CreditCard size={size} />
      case "Landmark": return <Landmark size={size} />
      case "Wallet": return <Wallet size={size} />
      case "FileSpreadsheet": return <FileSpreadsheet size={size} />
      default: return <FileText size={size} />
    }
  }

  const getStatusCounts = (prefix: string) => {
    if (!prefix) return { pending: 0, approved: 0, cancelled: 0, total: 0 }
    const statusKey = `${prefix}_status`
    const docs = (qt as any[])
    const pending = docs.filter((d: any) => d[statusKey] === "รออนุมัติ").length
    const approved = docs.filter((d: any) => d[statusKey] === "อนุมัติ").length
    const cancelled = docs.filter((d: any) => d[statusKey] === "ยกเลิก").length
    return { pending, approved, cancelled, total: pending + approved + cancelled }
  }

  const getOverdueCount = () => {
    const today = new Date(); today.setHours(23, 59, 59, 999)
    return (qt as any[]).filter((row: any) =>
      row.inv_status === "รออนุมัติ" && row.inv_enddate != null && new Date(row.inv_enddate).getTime() <= today.getTime()
    ).length
  }

  const filterBySearch = (data: any[], prefix: string) => {
    if (!docSearchTerm.trim()) return data
    const term = docSearchTerm.toLowerCase()
    return data.filter((d: any) => {
      const mappedPrefix = documentOrderPrefixMap[prefix as SalesDocumentType] || prefix.toUpperCase()
      const docNum = prefix
        ? String(
          d[`${prefix}_orderfull`]
          || `${mappedPrefix}${d[`${prefix}_orderNo`] || ""}${d[`${prefix}_number`] || ""}`
        ).toLowerCase()
        : ""
      const custName = (d.name_costomer || "").toLowerCase()
      return docNum.includes(term) || custName.includes(term)
    })
  }

  const filterByStatus = (data: any[], prefix: string) => {
    if (statusFilter === "all" || !prefix) return data
    const statusKey = `${prefix}_status`
    return data.filter((d: any) => d[statusKey] === statusFilter)
  }
  // ============== END NEW ==============

  //  QT
  const [showE, setShowE] = useState(false);
  const [showW, setShowW] = useState(false);

  //  Bill
  const [showbv, setShowbv] = useState(false);
  const [showbe, setShowbe] = useState(false);

  //  Invoice
  const [showiv, setShowiv] = useState(false);
  const [showie, setShowie] = useState(false);

  //  Re
  const [showev, setShowev] = useState(false);
  const [showee, setShowee] = useState(false);

  // Delivery Note (ใบส่งสินค้า)
  const [showdnv, setShowdnv] = useState(false);
  const [showdne, setShowdne] = useState(false);
  const [dnEditStatus, setDnEditStatus] = useState("รออนุมัติ");
  const [dnEditRemark, setDnEditRemark] = useState("");
  const [dnEditDate, setDnEditDate] = useState<any>(new Date());
  const [dnEditEndDate, setDnEditEndDate] = useState<any>(new Date());
  const [dnEditPayType, setDnEditPayType] = useState<"cash" | "credit" | "deposit">("cash");
  const [dnEditDeposit, setDnEditDeposit] = useState<any>(0);
  const [dnSaving, setDnSaving] = useState(false);

  //  Tax
  const [showtv, setShowtv] = useState(false);
  const [showte, setShowte] = useState(false);

  // Debit note
  const [showdv, setShowdv] = useState(false);
  const [showde, setShowde] = useState(false);

  // Credit note
  const [showcv, setShowcv] = useState(false);
  const [showce, setShowce] = useState(false);

  // Receive
  const [showrv, setShowrv] = useState(false);
  const [showre, setShowre] = useState(false);

  // Order
  const [showov, setShowov] = useState(false);
  const [showoe, setShowoe] = useState(false);

  const activeCustomerPickerHost = showE ? "QT" : showbe ? "BL" : showie ? "INV" : showee ? "RE" : showte ? "TAX" : showde ? "DN" : showce ? "CN" : null

  useEffect(() => {
    setShowCusModal(false)
  }, [activeCustomerPickerHost])

  useEffect(() => {
    const activeAttachmentDocTypes: SalesDocumentType[] = []
    if (showE) activeAttachmentDocTypes.push("qt")
    if (showbe) activeAttachmentDocTypes.push("bl")
    if (showie) activeAttachmentDocTypes.push("inv")
    if (showee) activeAttachmentDocTypes.push("re")
    if (showte) activeAttachmentDocTypes.push("tax")
    if (showde) activeAttachmentDocTypes.push("debit")
    if (showce) activeAttachmentDocTypes.push("credit")

    if (activeAttachmentDocTypes.length === 0) return

    activeAttachmentDocTypes.forEach((docType) => {
      if (Number(ids || 0) > 0) {
        void loadDocumentAttachment(docType, Number(ids))
      } else {
        clearDocumentAttachmentState(docType)
      }
    })
  }, [ids, showE, showbe, showie, showee, showte, showde, showce])

  useEffect(() => {
    if (!showee) return

    if (Number(ids || 0) > 0) {
      void loadReceiptSlipAttachment(Number(ids))
      return
    }

    clearReceiptSlipAttachmentState()
  }, [ids, showee])

  const buildDocumentOrderFull = (docType: string, orderNo: string, docNumber: number) => {
    const prefix = documentOrderPrefixMap[docType as SalesDocumentType] || docType.toUpperCase()
    return `${prefix}${orderNo}${docNumber}`
  }

  const calculateDocumentCreditDays = (startValue: SafeDateValue, endValue: SafeDateValue) => {
    const start = getSafeDocumentDate(startValue)
    const end = getSafeDocumentDate(endValue)
    const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
    const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
    return Math.ceil(Math.abs(endUtc - startUtc) / (1000 * 60 * 60 * 24))
  }

  const updateDocumentDraftDate = (docType: SalesDocumentType, field: "date" | "enddate", date: Date | null) => {
    if (!date) return

    const nextDate = getSafeDocumentDate(date)
    const fieldName = `${docType}_${field}`

    setQT((prev: any) => ({
      ...prev,
      [fieldName]: nextDate,
    }))

    if (fieldName === getCurrentDocumentSignatureDateField()) {
      setDocumentSignatureDate(toDocumentSignatureInputDate(nextDate))
    }
  }

  // Create new DocMain for new document
  const createNewDocMain = async (docType: string) => {
    const companyS = localStorage.getItem("company_") || ""
    const orderNo = String(year) + String(month) + String(day)
    const existing = qt.filter((a: any) => a[`${docType}_orderNo`] === orderNo).map((pp: any) => pp[`${docType}_number`])
    const maxNum = existing.length > 0 ? Math.max(...existing) : 99
    const nextNum = maxNum + 1
    const draftStartDate = getSafeDocumentDate((allQT as any)[`${docType}_date`])
    const draftEndDate = getSafeDocumentDate((allQT as any)[`${docType}_enddate`], draftStartDate)
    const draftCreditDays = calculateDocumentCreditDays(draftStartDate, draftEndDate)
    const draftSellerName = getResolvedDocumentSellerName(docType as SalesDocumentType)

    try {
      const res = await axios.post(`/api/${apiquatation}`, {
        companyall: companyS,
        [`${docType}_date`]: draftStartDate,
        [`${docType}_enddate`]: draftEndDate,
        [`${docType}_number`]: nextNum,
        [`${docType}_orderNo`]: orderNo,
        [`${docType}_orderfull`]: buildDocumentOrderFull(docType, orderNo, nextNum),
        [`${docType}_status`]: "รออนุมัติ",
        [`${docType}_credit`]: draftCreditDays,
        [`${docType}_person`]: draftSellerName || undefined,
        id_costomer: idcus || undefined,
        code_costomer: all.code || undefined,
        name_costomer: all.names || undefined,
        ...(docType === "debit" ? { debit_vat_rate: DEBIT_NOTE_VAT_RATE } : {}),
        ...(docType === "credit" ? { credit_vat_rate: CREDIT_NOTE_VAT_RATE } : {}),
      })
      const newId = res.data.id
      latestDocumentIdRef.current = Number(newId)
      setids(newId)
      localStorage.setItem("iddoc", String(newId))
      await fetchQT()
      return newId
    } catch (error) {
      console.error("Error creating new document:", error)
      return null
    }
  }

  const openDocumentAttachmentPicker = async (docType: SalesDocumentType) => {
    let currentDocId = Number(latestDocumentIdRef.current || ids || 0)

    if (!currentDocId) {
      const newId = await createNewDocMain(docType)
      if (!newId) return
      currentDocId = Number(newId)
      latestDocumentIdRef.current = currentDocId
    }

    attachmentInputRefs.current[docType]?.click()
  }

  const handleDocumentAttachmentFileChange = async (docType: SalesDocumentType, event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const selectedFile = input.files?.[0]

    if (!selectedFile) {
      return
    }

    const isPdf = selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf")
    if (!isPdf) {
      window.alert("กรุณาเลือกไฟล์ PDF เท่านั้น")
      input.value = ""
      return
    }

    let currentDocId = Number(latestDocumentIdRef.current || ids || 0)
    if (!currentDocId) {
      const newId = await createNewDocMain(docType)
      if (!newId) {
        input.value = ""
        return
      }
      currentDocId = Number(newId)
      latestDocumentIdRef.current = currentDocId
    }

    setDocumentAttachmentState(docType, { loading: true, error: "" })

    try {
      const formData = new FormData()
      formData.append("docType", docType)
      formData.append("docId", String(currentDocId))
      formData.append("file", selectedFile)

      const res = await axios.post("/api/document-attachment", formData)
      const nextData = res.data?.exists ? res.data as DocumentAttachmentInfo : null
      setDocumentAttachmentState(docType, { loading: false, error: "", data: nextData })
    } catch (error) {
      console.error(error)
      setDocumentAttachmentState(docType, { loading: false, error: "บันทึกไฟล์แนบ PDF ไม่สำเร็จ" })
    } finally {
      input.value = ""
    }
  }

  const openDocumentAttachment = (docType: SalesDocumentType) => {
    const attachment = documentAttachments[docType]?.data
    if (!attachment?.url) return

    window.open(attachment.url, "_blank", "noopener,noreferrer")
  }

  const deleteDocumentAttachment = async (docType: SalesDocumentType) => {
    const currentDocId = Number(latestDocumentIdRef.current || ids || 0)
    if (!currentDocId) return

    const confirmed = window.confirm("ต้องการลบไฟล์แนบ PDF ของเอกสารนี้หรือไม่?")
    if (!confirmed) return

    setDocumentAttachmentState(docType, { loading: true, error: "" })

    try {
      await axios.delete("/api/document-attachment", {
        params: { docType, docId: currentDocId },
      })
      setDocumentAttachmentState(docType, { loading: false, error: "", data: null })
    } catch (error) {
      console.error(error)
      setDocumentAttachmentState(docType, { loading: false, error: "ลบไฟล์แนบ PDF ไม่สำเร็จ" })
    }
  }

  const openReceiptSlipPicker = async () => {
    let currentDocId = Number(latestDocumentIdRef.current || ids || 0)

    if (!currentDocId) {
      const newId = await createNewDocMain("re")
      if (!newId) return
      currentDocId = Number(newId)
      latestDocumentIdRef.current = currentDocId
    }

    receiptSlipInputRef.current?.click()
  }

  const handleReceiptSlipFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const selectedFile = input.files?.[0]

    if (!selectedFile) {
      return
    }

    const isPdf = selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf")
    if (!isPdf) {
      window.alert("กรุณาเลือกไฟล์ PDF เท่านั้น")
      input.value = ""
      return
    }

    let currentDocId = Number(latestDocumentIdRef.current || ids || 0)
    if (!currentDocId) {
      const newId = await createNewDocMain("re")
      if (!newId) {
        input.value = ""
        return
      }
      currentDocId = Number(newId)
      latestDocumentIdRef.current = currentDocId
    }

    setReceiptSlipAttachmentState({ loading: true, error: "" })

    try {
      const formData = new FormData()
      formData.append("docType", "re")
      formData.append("docId", String(currentDocId))
      formData.append("slot", RECEIPT_SLIP_ATTACHMENT_SLOT)
      formData.append("file", selectedFile)

      const res = await axios.post("/api/document-attachment", formData)
      const nextData = res.data?.exists ? res.data as DocumentAttachmentInfo : null
      setReceiptSlipAttachmentState({ loading: false, error: "", data: nextData })
    } catch (error) {
      console.error(error)
      setReceiptSlipAttachmentState({ loading: false, error: "บันทึกไฟล์ slip PDF ไม่สำเร็จ" })
    } finally {
      input.value = ""
    }
  }

  const openReceiptSlipAttachment = () => {
    const attachment = receiptSlipAttachment.data
    if (!attachment?.url) return

    window.open(attachment.url, "_blank", "noopener,noreferrer")
  }

  const deleteReceiptSlipAttachment = async () => {
    const currentDocId = Number(latestDocumentIdRef.current || ids || 0)
    if (!currentDocId) return

    const confirmed = window.confirm("ต้องการลบไฟล์ slip PDF ของใบเสร็จรับเงินนี้หรือไม่?")
    if (!confirmed) return

    setReceiptSlipAttachmentState({ loading: true, error: "" })

    try {
      await axios.delete("/api/document-attachment", {
        params: { docType: "re", docId: currentDocId, slot: RECEIPT_SLIP_ATTACHMENT_SLOT },
      })
      setReceiptSlipAttachmentState({ loading: false, error: "", data: null })
    } catch (error) {
      console.error(error)
      setReceiptSlipAttachmentState({ loading: false, error: "ลบไฟล์ slip PDF ไม่สำเร็จ" })
    }
  }

  const openRowDocumentAttachment = async (
    docType: SalesDocumentType,
    docId: number,
    options?: {
      sourceDocType?: SalesDocumentType
      slot?: string
      attachmentLabel?: string
      emptyMessage?: string
      errorMessage?: string
    },
  ) => {
    const nextDocId = Number(docId || 0)
    if (!nextDocId) return

    const sourceDocType = options?.sourceDocType || docType
    const attachmentLabel = options?.attachmentLabel || "ไฟล์แนบ PDF"

    try {
      const res = await axios.get("/api/document-attachment", {
        params: {
          docType: sourceDocType,
          docId: nextDocId,
          ...(options?.slot ? { slot: options.slot } : {}),
        },
      })

      if (!res.data?.exists || !res.data?.url) {
        window.alert(options?.emptyMessage || `ยังไม่มี${attachmentLabel}สำหรับ${documentLabelMap[docType]}`)
        return
      }

      window.open(String(res.data.url), "_blank", "noopener,noreferrer")
    } catch (error) {
      console.error(error)
      window.alert(options?.errorMessage || `เปิด${attachmentLabel}ไม่สำเร็จ`)
    }
  }

  const renderRowDocumentAttachmentButton = (
    docType: SalesDocumentType,
    docId: number,
    options?: {
      sourceDocType?: SalesDocumentType
      slot?: string
      attachmentLabel?: string
      emptyMessage?: string
      errorMessage?: string
      title?: string
      borderColor?: string
      hoverColor?: string
      hoverShadow?: string
      icon?: React.ReactNode
    },
  ) => (
    <button
      type="button"
      onClick={() => { void openRowDocumentAttachment(docType, docId, options) }}
      title={options?.title || `เปิดไฟล์แนบ PDF ${documentLabelMap[docType]}`}
      aria-label={options?.title || `เปิดไฟล์แนบ PDF ${documentLabelMap[docType]}`}
      style={{
        width: 28,
        height: 28,
        marginLeft: 5,
        borderRadius: 8,
        border: `1px solid ${options?.borderColor || "#ef4444"}`,
        backgroundColor: "white",
        color: options?.borderColor || "#ef4444",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.2s ease",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = options?.hoverColor || options?.borderColor || "#ef4444"
        e.currentTarget.style.color = "white"
        e.currentTarget.style.transform = "translateY(-1px)"
        e.currentTarget.style.boxShadow = options?.hoverShadow || "0 2px 8px rgba(239,68,68,0.25)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "white"
        e.currentTarget.style.color = options?.borderColor || "#ef4444"
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      {options?.icon || <FileText size={14} />}
    </button>
  )

  const renderRowSlipAttachmentButton = (docType: "re" | "tax", docId: number) => (
    renderRowDocumentAttachmentButton(docType, docId, {
      sourceDocType: "re",
      slot: RECEIPT_SLIP_ATTACHMENT_SLOT,
      attachmentLabel: "Slip จ่ายสินค้า PDF",
      emptyMessage: `ยังไม่มี Slip จ่ายสินค้า PDF สำหรับ${documentLabelMap[docType]}`,
      errorMessage: "เปิด Slip จ่ายสินค้า PDF ไม่สำเร็จ",
      title: `เปิด Slip จ่ายสินค้า PDF ${documentLabelMap[docType]}`,
      borderColor: "#0f766e",
      hoverColor: "#0f766e",
      hoverShadow: "0 2px 8px rgba(15,118,110,0.25)",
      icon: <ReceiptIcon size={14} />,
    })
  )

  const postDocumentDetail = async (docType: SalesDocumentType, product: any, quantity: number) => {
    let currentIds = ids
    if (!currentIds || currentIds === 0) {
      const newId = await createNewDocMain(docType)
      if (!newId) return
      currentIds = newId
    }

    const company = String(localStorage.getItem("company_") || "")
    const qty = Math.max(1, Number(quantity || 1))
    const price = Number(product?.price || 0)

    try {
      await axios.post(`/api/${apiquatation_detail}`,
        {
          company,
          id_product: Number(product?.id || 0),
          code_product: String(product?.code || ""),
          name_product: String(product?.ProductName || ""),
          unit: String(product?.Unit || ""),
          qty,
          price,
          total: qty * price,
          person: "",
          id_docmain: Number(currentIds),

        })

      await fetchQT_IDDetail(currentIds)
    } catch (error) {
      console.error(error)
    }
  }

  const renderProductSearchControl = (docType: SalesDocumentType) => (
    <ProductPickerTrigger
      products={dataProduct as any[]}
      onAddProduct={async (product, qty) => {
        await postDocumentDetail(docType, product, qty)
      }}
    />
  )

  // Date Real
  var dt = new Date();

  let year = dt.getFullYear();
  let month = (dt.getMonth() + 1).toString().padStart(2, "0");
  let day = dt.getDate().toString().padStart(2, "0");

  const openCreateDocumentDraft = (tabKey: string = activeDocTab) => {
    const docTypeMap: Record<string, string> = {
      first: "qt",
      second: "bl",
      three: "inv",
      four: "re",
      five: "tax",
      debit: "debit",
      credit: "credit",
    }
    const docType = docTypeMap[tabKey]
    if (!docType) return

    const orderNo = String(year) + String(month) + String(day)
    const existing = qt.filter((a: any) => a[`${docType}_orderNo`] === orderNo).map((pp: any) => pp[`${docType}_number`])
    const maxNum = existing.length > 0 ? Math.max(...existing) : 99
    const nextNum = maxNum + 1
    const now = new Date()

    setids(0)
    setidcus(0)
    setSelectedDocRow(null)
    setStartDate(now)
    setStartDate1(now)
    setQT({
      ...initial10,
      [`${docType}_date`]: now.toISOString(),
      [`${docType}_enddate`]: now.toISOString(),
      [`${docType}_number`]: nextNum,
      [`${docType}_orderNo`]: orderNo,
      [`${docType}_orderfull`]: buildDocumentOrderFull(docType, orderNo, nextNum),
      [`${docType}_status`]: "รออนุมัติ",
      [`${docType}_credit`]: 0,
      ...(docType === "debit" ? { debit_vat_rate: DEBIT_NOTE_VAT_RATE } : {}),
      ...(docType === "credit" ? { credit_vat_rate: CREDIT_NOTE_VAT_RATE } : {}),
    })
    setqt_detail([])
    setall1(initialValues)
    localStorage.setItem("iddoc", "0")

    if (tabKey === "first") setShowE(true)
    else if (tabKey === "second") setShowbe(true)
    else if (tabKey === "three") setShowie(true)
    else if (tabKey === "four") setShowee(true)
    else if (tabKey === "five") setShowte(true)
    else if (tabKey === "debit") setShowde(true)
    else if (tabKey === "credit") setShowce(true)
  }

  const getDocumentStatusColors = (status?: string | null) => {
    if (status === "อนุมัติ") {
      return { backgroundColor: "#E5EEF8", color: "#173F6B", borderColor: "#CCDFF1" }
    }
    if (status === "ยกเลิก") {
      return { backgroundColor: "#fee2e2", color: "#991b1b", borderColor: "#fecaca" }
    }
    return { backgroundColor: "#fef3c7", color: "#92400e", borderColor: "#fde68a" }
  }

  const getDocumentStatusVariant = (status?: string | null) => (
    status === "อนุมัติ" ? "success" :
      status === "รออนุมัติ" ? "warning" :
        status === "ยกเลิก" ? "danger" : "primary"
  )

  const getDocumentDetailRows = () => (Array.isArray(qt_detail) ? [...(qt_detail as any[])] : [])

  const getDocumentSubtotal = () => getDocumentDetailRows().reduce((acc: number, curr: any) => acc + Number(curr.total || 0), 0)

  const renderDocumentModalTitle = ({ title, docDisplay, status, icon, iconBackground }: any) => {
    const statusColors = getDocumentStatusColors(status)

    return (
      <div className="d-flex align-items-center" style={{ gap: 10, width: "100%" }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBackground, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 16, fontFamily: "Kanit_B", color: "#1f2937", lineHeight: 1.2 }}>{title}</div>
          <div style={{ fontSize: 11, fontFamily: "Kanit", color: "#6b7280" }}>{docDisplay}</div>
        </div>
        <span
          style={{
            marginLeft: 12,
            fontSize: 11,
            fontFamily: "kanit_B",
            padding: "3px 12px",
            borderRadius: 20,
            border: `1px solid ${statusColors.borderColor}`,
            backgroundColor: statusColors.backgroundColor,
            color: statusColors.color,
          }}
        >
          {status || "รออนุมัติ"}
        </span>
      </div>
    )
  }

  const renderDocumentWorkflowStepper = (activeCode: string) => {
    const steps = [
      { label: "ใบเสนอราคา", code: "QT", status: allQT.qt_status, orderNo: allQT.qt_orderNo, number: allQT.qt_number },
      { label: "ใบวางบิล", code: "BL", status: allQT.bl_status, orderNo: allQT.bl_orderNo, number: allQT.bl_number },
      { label: "ใบแจ้งหนี้", code: "INV", status: allQT.inv_status, orderNo: allQT.inv_orderNo, number: allQT.inv_number },
      { label: "ใบเสร็จรับเงิน", code: "RE", status: allQT.re_status, orderNo: allQT.re_orderNo, number: allQT.re_number },
      { label: "ใบกำกับภาษี", code: "TAX", status: allQT.tax_status, orderNo: allQT.tax_orderNo, number: allQT.tax_number },
      { label: "ใบเพิ่มหนี้", code: "DN", status: allQT.debit_status, orderNo: allQT.debit_orderNo, number: allQT.debit_number },
      { label: "ใบลดหนี้", code: "CN", status: allQT.credit_status, orderNo: allQT.credit_orderNo, number: allQT.credit_number },
    ]

    return (
      <div style={{ padding: "16px 24px 0", backgroundColor: "#f8fafc" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "16px 32px" }}>
          {steps.map((step, index) => {
            const isCurrent = step.code === activeCode
            const isDone = step.status === "อนุมัติ"
            const isPending = step.status === "รออนุมัติ"
            const isCancelled = step.status === "ยกเลิก"
            const hasDocumentNumber = step.number !== null && step.number !== undefined && step.number !== ""
            const stepDisplay = hasDocumentNumber ? `${step.code}${step.orderNo}${step.number}` : step.code
            const nextStep = steps[index + 1]
            const circleBorderColor = isDone ? "#147F56" : isPending ? "#d97706" : isCancelled ? "#dc2626" : isCurrent ? "#2A6AAA" : "#d1d5db"
            const circleBackgroundColor = isDone ? "#147F56" : isPending ? "#fef3c7" : isCancelled ? "#fee2e2" : isCurrent ? "#F3F8FC" : "white"
            const textColor = isDone ? "#147F56" : isPending ? "#d97706" : isCancelled ? "#dc2626" : isCurrent ? "#2A6AAA" : "#9ca3af"
            const connectorBackground = nextStep ?
              (nextStep.status ? `linear-gradient(90deg, ${circleBorderColor}, ${nextStep.status === "อนุมัติ" ? "#147F56" : nextStep.status === "รออนุมัติ" ? "#d97706" : "#dc2626"})` : "repeating-linear-gradient(90deg, #d1d5db 0px, #d1d5db 4px, transparent 4px, transparent 8px)") :
              "transparent"

            return (
              <React.Fragment key={step.code}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 90 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: `2px solid ${circleBorderColor}`,
                      backgroundColor: circleBackgroundColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s",
                    }}
                  >
                    {isDone ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : isCancelled ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    ) : isPending ? (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#d97706" }}></div>
                    ) : isCurrent ? (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#2A6AAA" }}></div>
                    ) : (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#d1d5db" }}></div>
                    )}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, fontFamily: isDone || isPending || isCurrent ? "kanit_B" : "kanit", color: textColor, textAlign: "center", lineHeight: 1.3 }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: 9, fontFamily: "kanit", color: textColor }}>{stepDisplay}</div>
                </div>
                {index < steps.length - 1 && (
                  <div style={{ flex: 1, height: 2, marginTop: -18, minWidth: 30, background: connectorBackground }}></div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    )
  }

  const renderDocumentInfoGrid = ({ docType, docDisplay, startDate, setStartDate, startDate1, setStartDate1, creditDays, personDisplay, detailIcon }: any) => {
    const currentDocType = docType as SalesDocumentType | undefined
    const sellerName = String(personDisplay || (currentDocType ? (allQT as any)[getDocumentSellerField(currentDocType)] : "") || "").trim()
    const selectedSellerEmployeeId = getDocumentSellerEmployeeId(sellerName)
    const selectedSeller = selectedSellerEmployeeId
      ? signatureEmployees.find((employee) => String(employee.id) === selectedSellerEmployeeId)
      : getEmployeeBySellerName(sellerName)
    const sellerSelectValue = selectedSellerEmployeeId || (sellerName ? "__custom__" : "")

    return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
      <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "18px 20px" }}>
        <div className="d-flex align-items-center" style={{ gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "#E5EEF8", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Package size={14} color="#2A6AAA" />
          </div>
          <span style={{ fontFamily: "kanit_B", fontSize: 13, color: "#173F6B" }}>ผู้ขาย</span>
        </div>
        <div style={{ paddingLeft: 36, marginBottom: 14 }}>
          <div style={{ fontFamily: "Kanit_B", fontSize: 13, color: "#1f2937" }}>{storeS}</div>
          <div style={{ fontFamily: "kanit", fontSize: 11, color: "#6b7280", lineHeight: 1.6 }}>{addressS}</div>
          <div style={{ fontFamily: "kanit", fontSize: 11, color: "#6b7280" }}>เลขที่ผู้เสียภาษี: {taxS}</div>
          <div style={{ fontFamily: "kanit", fontSize: 11, color: "#6b7280" }}>โทร: {telS}</div>
        </div>

        <div style={{ height: 1, backgroundColor: "#f3f4f6", margin: "8px 0 12px 0" }}></div>

        <div className="d-flex align-items-center" style={{ gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CreditCard size={14} color="#d97706" />
          </div>
          <span style={{ fontFamily: "kanit_B", fontSize: 13, color: "#92400e" }}>ผู้ซื้อ</span>
          <button
            type="button"
            onClick={openCustomerModal}
            style={{
              marginLeft: "auto",
              padding: "3px 12px",
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "kanit",
              border: "1px solid #d97706",
              backgroundColor: showCusModal ? "#fef3c7" : "#fffbeb",
              color: "#d97706",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#fef3c7"
              e.currentTarget.style.transform = "translateY(-1px)"
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(217,119,6,0.12)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = showCusModal ? "#fef3c7" : "#fffbeb"
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = showCusModal ? "0 4px 12px rgba(217,119,6,0.10)" : "none"
            }}
          >
            {showCusModal ? "ซ่อนค้นหา" : "ค้นหาลูกค้า"}
          </button>
        </div>

        <div style={{ paddingLeft: 36 }}>
          <div style={{ fontFamily: "Kanit_B", fontSize: 13, color: "#1f2937" }}>{all.names || allQT.name_costomer || "-"}</div>
          <div style={{ fontFamily: "kanit", fontSize: 11, color: "#6b7280", lineHeight: 1.6 }}>{all.address || "-"}</div>
          <div style={{ fontFamily: "kanit", fontSize: 11, color: "#6b7280" }}>เลขที่ผู้เสียภาษี: {all.numbertax || "-"}</div>
          <div style={{ fontFamily: "kanit", fontSize: 11, color: "#6b7280" }}>โทร: {all.tel || "-"}</div>
        </div>

        {showCusModal && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f3f4f6" }}>
            <div className="d-flex align-items-center justify-content-between" style={{ gap: 8, marginBottom: 8 }}>
              <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151" }}>ค้นหาและเลือกลูกค้าในเอกสารนี้</div>
              <span style={{ fontFamily: "kanit", fontSize: 11, color: "#9ca3af" }}>กด Enter เพื่อเลือก</span>
            </div>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", backgroundColor: "#fcfcfd" }}>
              <CustomerPickerBody
                customers={searchname}
                onSelect={selectCustomer}
                autoFocusRef={customerSearchInputRef}
                listMaxHeight={260}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "18px 20px" }}>
        <div className="d-flex align-items-center" style={{ gap: 8, marginBottom: 14 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "#F3F8FC", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {detailIcon}
          </div>
          <span style={{ fontFamily: "kanit_B", fontSize: 13, color: "#173F6B" }}>รายละเอียดเอกสาร</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px 16px", alignItems: "center" }}>
          <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", textAlign: "right" }}>เลขที่:</div>
          <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#1f2937" }}>{docDisplay}</div>

          <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", textAlign: "right" }}>วันที่:</div>
          <div>
            <DatePicker
              selected={getSafeDocumentDate(startDate)}
              onChange={(date: Date | null) => {
                if (!date) return
                const nextDate = getSafeDocumentDate(date)
                setStartDate(nextDate)
                if (docType) updateDocumentDraftDate(docType, "date", nextDate)
              }}
              dateFormat="dd/MM/yyyy"
              popperClassName="datepicker-popper-high"
              popperProps={{ strategy: "fixed" }}
              wrapperClassName="datepicker-wrapper-full"
              customInput={<DocumentDateInput placeholder="เลือกวันที่" />}
            />
          </div>

          <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", textAlign: "right" }}>เครดิต:</div>
          <div style={{ fontFamily: "kanit", fontSize: 13, color: "#1f2937" }}>{creditDays} วัน</div>

          <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", textAlign: "right" }}>วันครบกำหนด:</div>
          <div>
            <DatePicker
              selected={getSafeDocumentDate(startDate1)}
              onChange={(date: Date | null) => {
                if (!date) return
                const nextDate = getSafeDocumentDate(date)
                setStartDate1(nextDate)
                if (docType) updateDocumentDraftDate(docType, "enddate", nextDate)
              }}
              dateFormat="dd/MM/yyyy"
              popperClassName="datepicker-popper-high"
              popperProps={{ strategy: "fixed" }}
              wrapperClassName="datepicker-wrapper-full"
              customInput={<DocumentDateInput placeholder="เลือกวันครบกำหนด" />}
            />
          </div>

          <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", textAlign: "right" }}>พนักงานขาย:</div>
          <div>
            <select
              value={sellerSelectValue}
              onChange={(event) => currentDocType && handleDocumentSellerEmployeeChange(currentDocType, event)}
              disabled={!currentDocType || signatureEmployeesLoading}
              style={{
                width: "100%",
                height: 34,
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: "0 10px",
                fontFamily: "kanit",
                fontSize: 13,
                color: sellerName ? "#0f172a" : "#64748b",
                backgroundColor: "#ffffff",
                outline: "none",
              }}
            >
              <option value="">{signatureEmployeesLoading ? "กำลังโหลดพนักงาน..." : "เลือกพนักงานขาย"}</option>
              {sellerName && !selectedSellerEmployeeId ? <option value="__custom__">{sellerName}</option> : null}
              {signatureEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {getSignatureEmployeeLabel(employee)}{employee.position ? ` (${employee.position})` : ""}
                </option>
              ))}
            </select>
            {selectedSeller?.position ? (
              <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#64748b", marginTop: 4 }}>{selectedSeller.position}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
    )
  }

  const renderDocumentItemsSection = ({ searchProductControl, onEditQuantity, onEditDiscount, onDeleteItem, showqty, setShowqty, showD, setShowD, priceAct, setEditedpriceAct, priceDis, setEditedpriceDis, editedcode, editedTaskname, editqty, editqtyCh, setEditedqtyCh, onApplyDetailEdit }: any) => {
    const detailRows = getDocumentDetailRows().sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)))

    return (
      <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 0, marginBottom: 20, overflow: "hidden" }}>
        <div className="d-flex align-items-center justify-content-between" style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6", background: "#fafbfc" }}>
          <div className="d-flex align-items-center" style={{ gap: 8 }}>
            <ClipboardList size={16} color="#374151" />
            <span style={{ fontFamily: "kanit_B", fontSize: 14, color: "#1f2937" }}>รายการสินค้า</span>
            <span style={{ fontSize: 11, fontFamily: "kanit", padding: "2px 10px", borderRadius: 12, backgroundColor: "#f3f4f6", color: "#6b7280" }}>{detailRows.length} รายการ</span>
          </div>
          {searchProductControl}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 16px", textAlign: "left", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>ลำดับ</th>
                <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 16px", textAlign: "left", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", minWidth: 180 }}>รายการสินค้า</th>
                <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 16px", textAlign: "center", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>จำนวน</th>
                <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 16px", textAlign: "center", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>หน่วย</th>
                <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 16px", textAlign: "right", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>ราคา/หน่วย</th>
                <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 16px", textAlign: "center", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>ส่วนลด</th>
                <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 16px", textAlign: "right", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>ราคาล่าสุด</th>
                <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 16px", textAlign: "right", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>รวม</th>
                <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 16px", textAlign: "center", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {detailRows.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px 20px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <ClipboardList size={36} color="#d1d5db" />
                      <div style={{ fontFamily: "kanit", fontSize: 13, color: "#9ca3af" }}>ยังไม่มีรายการสินค้า</div>
                      <div style={{ fontFamily: "kanit", fontSize: 11, color: "#d1d5db" }}>กด "เพิ่มสินค้า" เพื่อเริ่มเพิ่มรายการ</div>
                    </div>
                  </td>
                </tr>
              ) : (
                detailRows.map((detail: any, index: number) => (
                  <tr
                    key={detail.id}
                    style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fafbfc" }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                  >
                    <td style={{ fontFamily: "kanit", fontSize: 12, padding: "10px 16px", color: "#9ca3af" }}>{index + 1}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ fontFamily: "kanit", fontSize: 12, color: "#1f2937", fontWeight: 500 }}>{detail.name_product}</div>
                      <div style={{ fontFamily: "kanit", fontSize: 10, color: "#9ca3af" }}>{detail.code_product}</div>
                    </td>
                    <td style={{ fontFamily: "kanit", fontSize: 12, padding: "10px 16px", textAlign: "center" }}>
                      <button
                        className="btn btn-sm"
                        style={{ height: 26, fontSize: 12, fontFamily: "Kanit_B", minWidth: 40, border: "1px solid #d1d5db", borderRadius: 6, backgroundColor: "#f9fafb", color: "#1f2937", cursor: "pointer" }}
                        onClick={() => onEditQuantity(detail)}
                      >
                        {detail.qty}
                      </button>
                    </td>
                    <td style={{ fontFamily: "kanit", fontSize: 12, padding: "10px 16px", textAlign: "center", color: "#6b7280" }}>{detail.unit}</td>
                    <td style={{ fontFamily: "kanit", fontSize: 12, padding: "10px 16px", textAlign: "right" }}>
                      <button
                        className="btn btn-sm"
                        style={{ height: 26, fontSize: 12, fontFamily: "Kanit_B", minWidth: 40, border: "1px solid #d1d5db", borderRadius: 6, backgroundColor: "#f9fafb", color: "#1f2937", cursor: "pointer" }}
                        onClick={() => onEditQuantity(detail)}
                      >
                        {Number(detail.price || 0).toLocaleString()}
                      </button>
                    </td>
                    <td style={{ fontFamily: "kanit", fontSize: 12, padding: "10px 16px", textAlign: "center" }}>
                      <button
                        className="btn btn-sm"
                        style={{ height: 26, fontSize: 12, fontFamily: "Kanit_B", minWidth: 40, border: "1px solid #d1d5db", borderRadius: 6, backgroundColor: "#f9fafb", color: "#1f2937", cursor: "pointer" }}
                        onClick={() => onEditDiscount(detail)}
                      >
                        {detail.discount}
                      </button>
                    </td>
                    <td style={{ fontFamily: "kanit_B", fontSize: 12, padding: "10px 16px", textAlign: "right", color: "#2A6AAA" }}>{(Number(detail.price || 0) - Number(detail.discount || 0)).toLocaleString()}</td>
                    <td style={{ fontFamily: "kanit_B", fontSize: 12, padding: "10px 16px", textAlign: "right", color: "#2A6AAA" }}>{Number(detail.total || 0).toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <button
                        onClick={() => onDeleteItem(detail.id)}
                        style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #fecaca", backgroundColor: "#fef2f2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fee2e2"; e.currentTarget.style.borderColor = "#fca5a5" }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fef2f2"; e.currentTarget.style.borderColor = "#fecaca" }}
                      >
                        <Image alt="delete" src={deletes} width={14} height={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Modal_qty
          show={showqty}
          onHide={() => setShowqty(false)}
          className="document-modal detail-editor-modal"
          dialogClassName="document-modal-dialog modal-90w"
          backdropClassName="document-modal-backdrop detail-editor-modal-backdrop"
          animation={false}
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_qty.Header closeButton>
            <Modal_qty.Title id="example-custom-modal-styling-title">
              <div style={{ width: "auto", height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>ปรับจำนวน</div>
            </Modal_qty.Title>
          </Modal_qty.Header>
          <Modal_qty.Body>
            <div className="d-flex">
              <div style={{ width: "auto", height: 30, fontSize: 15, fontFamily: "Kanit_B" }}>{editedcode}</div>
              <div style={{ width: "auto", marginLeft: 5, height: 30, fontSize: 15, fontFamily: "Kanit_B" }}>{editedTaskname}</div>
            </div>
            <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
              <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>ราคา :</div>
              <input className="form-control form-control-sm mt-1" style={{ width: 80, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }} value={priceAct} onChange={(e) => setEditedpriceAct(e.target.value)} />
              <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10 }}>บาท</div>
            </div>
            <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>คงเหลือ : {Number(priceAct) - Number(priceDis)} บาท/ชิ้น</div>
            <div className="d-flex">
              <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10 }}>จำนวนสินค้า : {Number(editqty)} ชิ้น ปรับจำนวนเป็น</div>
              <input className="form-control form-control-sm mt-1" style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }} value={editqtyCh} onChange={(e) => setEditedqtyCh(e.target.value)} />
              <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>ชิ้น</div>
            </div>
            <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>ยอดรวม : {Number(editqtyCh) * (Number(priceAct) - Number(priceDis))} บาท/ชิ้น</div>
          </Modal_qty.Body>
          <Modal_qty.Footer>
            <button className="btn btn-success" style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }} onClick={() => { onApplyDetailEdit(); setShowqty(false) }}>ตกลง</button>
            <button className="btn btn-secondary" style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }} onClick={() => setShowqty(false)}>ปิด</button>
          </Modal_qty.Footer>
        </Modal_qty>

        <Modal_ds
          show={showD}
          onHide={() => setShowD(false)}
          className="document-modal detail-editor-modal"
          dialogClassName="document-modal-dialog modal-90w"
          backdropClassName="document-modal-backdrop detail-editor-modal-backdrop"
          animation={false}
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_ds.Header closeButton>
            <Modal_ds.Title id="example-custom-modal-styling-title">
              <div style={{ width: "auto", height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>ส่วนลดราคา</div>
            </Modal_ds.Title>
          </Modal_ds.Header>
          <Modal_ds.Body>
            <div className="d-flex">
              <div style={{ width: "auto", height: 30, fontSize: 15, fontFamily: "Kanit_B" }}>{editedcode}</div>
              <div style={{ width: "auto", marginLeft: 5, height: 30, fontSize: 15, fontFamily: "Kanit_B" }}>{editedTaskname}</div>
            </div>
            <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
              <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>ราคาจาก : {priceAct} บาท ลดราคาชิ้นละ</div>
              <input className="form-control form-control-sm mt-1" style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }} value={priceDis} onChange={(e) => setEditedpriceDis(e.target.value)} />
              <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>บาท</div>
            </div>
            <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>คงเหลือ : {Number(priceAct) - Number(priceDis)} บาท/ชิ้น</div>
            <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>จำนวนสินค้า : {Number(editqty)} ชิ้น</div>
            <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>ยอดรวม : {Number(editqty) * (Number(priceAct) - Number(priceDis))} บาท/ชิ้น</div>
          </Modal_ds.Body>
          <Modal_ds.Footer>
            <button className="btn btn-success" style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }} onClick={() => { onApplyDetailEdit(); setShowD(false) }}>ตกลง</button>
            <button className="btn btn-secondary" style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }} onClick={() => setShowD(false)}>ปิด</button>
          </Modal_ds.Footer>
        </Modal_ds>
      </div>
    )
  }

  const getDocumentFinancialSummary = (taxOverride?: string | number) => {
    const subtotal = getDocumentSubtotal()
    const endDiscount = Number(allQT.discount || 0)
    const rewardDiscount = Number(allQT.usereward || 0)
    const netTotal = subtotal - endDiscount - rewardDiscount
    const taxOverrideValue = String(taxOverride ?? "")
    const effectiveTaxValue = taxOverrideValue === ""
      ? ""
      : String(allQT.taxnumber || "") !== taxOverrideValue
        ? taxOverrideValue
        : String(allQT.taxnumber || "")
    const withholdingRate = Number(effectiveTaxValue || 0)
    const withholdingAmount = taxOverrideValue === "" ? 0 : (subtotal * withholdingRate) / 100
    const grandTotal = netTotal + withholdingAmount

    return {
      subtotal,
      endDiscount,
      rewardDiscount,
      netTotal,
      withholdingAmount,
      grandTotal,
      taxDisplayValue: effectiveTaxValue,
    }
  }

  const formatReceiptBankAccountNumber = (value: number | string | null | undefined) => {
    const digits = String(value ?? "").replace(/[^\d]/g, "")
    return digits || "-"
  }

  const formatReceiptPromptPayNumber = (value: number | string | null | undefined) => {
    const digits = String(value ?? "").replace(/[^\d]/g, "")
    return digits || "-"
  }

  const buildReceiptBankPaymentValue = (account: ReceiptPaymentAccount) => {
    const bank = String(account.bank || "").trim()
    const name = String(account.name || "").trim()
    const accountNumber = formatReceiptBankAccountNumber(account.bookbankno)
    return `bank-transfer::${Number(account.id)}::${bank}::${name}::${accountNumber}`
  }

  const buildReceiptPromptPayPaymentValue = (account: ReceiptPaymentAccount) => {
    const name = String(account.name || "").trim()
    const promptPayNumber = formatReceiptPromptPayNumber(account.promtpayno)
    return `promptpay::${Number(account.id)}::${name}::${promptPayNumber}`
  }

  const parseReceiptPaymentValue = (rawValue: any): ReceiptPaymentSelection => {
    const value = String(rawValue ?? "").trim()
    if (!value) {
      return {
        channel: "",
        label: "ยังไม่ได้ระบุช่องทางรับเงิน",
        accountId: null,
        bank: "",
        name: "",
        accountNumber: "",
        promptPayNumber: "",
        customText: "",
      }
    }

    if (value.startsWith("bank-transfer::")) {
      const [, accountIdRaw = "", bank = "", name = "", accountNumber = ""] = value.split("::")
      const detail = [bank, name, accountNumber].filter(Boolean).join(" / ")
      return {
        channel: RECEIPT_BANK_CHANNEL_LABEL,
        label: detail ? `${RECEIPT_BANK_CHANNEL_LABEL} (${detail})` : RECEIPT_BANK_CHANNEL_LABEL,
        accountId: Number(accountIdRaw) || null,
        bank,
        name,
        accountNumber,
        promptPayNumber: "",
        customText: "",
      }
    }

    if (value.startsWith("promptpay::")) {
      const [, accountIdRaw = "", name = "", promptPayNumber = ""] = value.split("::")
      const detail = [name, promptPayNumber].filter(Boolean).join(" / ")
      return {
        channel: RECEIPT_PROMPTPAY_CHANNEL_LABEL,
        label: detail ? `${RECEIPT_PROMPTPAY_CHANNEL_LABEL} (${detail})` : RECEIPT_PROMPTPAY_CHANNEL_LABEL,
        accountId: Number(accountIdRaw) || null,
        bank: "",
        name,
        accountNumber: "",
        promptPayNumber,
        customText: "",
      }
    }

    if (value.startsWith("other::")) {
      const customText = value.slice("other::".length).trim()
      return {
        channel: RECEIPT_OTHER_CHANNEL_LABEL,
        label: customText ? `${RECEIPT_OTHER_CHANNEL_LABEL} (${customText})` : RECEIPT_OTHER_CHANNEL_LABEL,
        accountId: null,
        bank: "",
        name: "",
        accountNumber: "",
        promptPayNumber: "",
        customText,
      }
    }

    if (RECEIPT_PAYMENT_OPTIONS.includes(value as typeof RECEIPT_PAYMENT_OPTIONS[number])) {
      return {
        channel: value,
        label: value,
        accountId: null,
        bank: "",
        name: "",
        accountNumber: "",
        promptPayNumber: "",
        customText: value === RECEIPT_OTHER_CHANNEL_LABEL ? "" : "",
      }
    }

    return {
      channel: RECEIPT_OTHER_CHANNEL_LABEL,
      label: value,
      accountId: null,
      bank: "",
      name: "",
      accountNumber: "",
      promptPayNumber: "",
      customText: value,
    }
  }

  const getReceiptPaymentSelection = () => parseReceiptPaymentValue(allQT.pay)

  const getSelectedReceiptPaymentAccount = () => {
    const paymentSelection = getReceiptPaymentSelection()
    if (!paymentSelection.accountId) return null
    return paymentAccounts.find((account) => Number(account.id) === Number(paymentSelection.accountId)) || null
  }

  const getReceiptPaymentMethodLabel = () => getReceiptPaymentSelection().label

  const getReceiptReceiverName = () => String(allQT.re_person || allQT.qt_person || allQT.person || "").trim() || "-"

  const resetReceiptPaymentAccountForm = () => {
    setEditingPaymentAccountId(null)
    setPaymentAccountForm({
      bank: "",
      name: "",
      bookbankno: "",
      promtpayno: "",
    })
    setPaymentAccountFormVersion((prev) => prev + 1)
    setPaymentAccountError("")
  }

  const applyReceiptPaymentAccount = (account: ReceiptPaymentAccount) => {
    setQT((prev: any) => ({ ...prev, pay: buildReceiptBankPaymentValue(account) }))
  }

  const applyReceiptPromptPayAccount = (account: ReceiptPaymentAccount) => {
    setQT((prev: any) => ({ ...prev, pay: buildReceiptPromptPayPaymentValue(account) }))
  }

  const openReceiptPaymentSettings = () => {
    resetReceiptPaymentAccountForm()
    setShowReceiptPaymentSettings(true)
    fetchPaymentAccounts()
  }

  const startEditingReceiptPaymentAccount = (account: ReceiptPaymentAccount) => {
    setEditingPaymentAccountId(Number(account.id))
    setPaymentAccountForm({
      bank: String(account.bank || ""),
      name: String(account.name || ""),
      bookbankno: String(account.bookbankno || ""),
      promtpayno: String(account.promtpayno || ""),
    })
    setPaymentAccountFormVersion((prev) => prev + 1)
    setPaymentAccountError("")
    setShowReceiptPaymentSettings(true)
  }

  const saveReceiptPaymentAccount = async () => {
    const companyS = localStorage.getItem("company_") || ""
    const bank = String(paymentAccountForm.bank || "").trim()
    const name = String(paymentAccountNameInputRef.current?.value ?? paymentAccountForm.name ?? "").trim()
    const accountNumber = String(paymentAccountNumberInputRef.current?.value ?? paymentAccountForm.bookbankno ?? "").replace(/[^\d]/g, "")
    const promptPayNumber = String(paymentAccountPromptPayInputRef.current?.value ?? paymentAccountForm.promtpayno ?? "").replace(/[^\d]/g, "")

    if (!companyS) {
      setPaymentAccountError("ไม่พบบริษัทที่ใช้งานอยู่")
      return
    }
    if (accountNumber && !bank) {
      setPaymentAccountError("กรุณาเลือกธนาคาร")
      return
    }
    if (!name) {
      setPaymentAccountError("กรุณากรอกชื่อบัญชี")
      return
    }
    if (!accountNumber && !promptPayNumber) {
      setPaymentAccountError("กรุณากรอกเลขบัญชีหรือเลข PromptPay")
      return
    }

    setPaymentAccountSaving(true)
    try {
      setPaymentAccountForm({ bank, name, bookbankno: accountNumber, promtpayno: promptPayNumber })
      const payload = {
        company: companyS,
        bank,
        name,
        bookbankno: accountNumber,
        promtpayno: promptPayNumber,
      }
      let response

      if (editingPaymentAccountId) {
        try {
          response = await axios.put(`/api/setting/payment/${editingPaymentAccountId}`, payload)
        } catch (updateError) {
          console.error('update payment account failed, fallback to create', updateError)
          response = await axios.post(`/api/setting/payment`, payload)
        }
      } else {
        response = await axios.post(`/api/setting/payment`, payload)
      }

      const savedAccount = response.data as ReceiptPaymentAccount
      const currentPaymentSelection = getReceiptPaymentSelection()
      await fetchPaymentAccounts()
      if (currentPaymentSelection.channel === RECEIPT_PROMPTPAY_CHANNEL_LABEL || (!accountNumber && promptPayNumber)) {
        applyReceiptPromptPayAccount(savedAccount)
      } else {
        applyReceiptPaymentAccount(savedAccount)
      }
      resetReceiptPaymentAccountForm()
    } catch (error) {
      console.error(error)
      const message = axios.isAxiosError(error)
        ? String((error.response?.data as any)?.error || error.message || "")
        : error instanceof Error
          ? error.message
          : "บันทึกบัญชีรับเงินไม่สำเร็จ"
      setPaymentAccountError(message || "บันทึกบัญชีรับเงินไม่สำเร็จ")
    } finally {
      setPaymentAccountSaving(false)
    }
  }

  const deleteReceiptPaymentAccount = async (account: ReceiptPaymentAccount) => {
    const confirmed = window.confirm(`ลบบัญชี ${String(account.name || "") || "รายการนี้"} ใช่หรือไม่`)
    if (!confirmed) return

    try {
      await axios.delete(`/api/setting/payment/${Number(account.id)}`)
      const nextAccounts = await fetchPaymentAccounts()
      const paymentSelection = getReceiptPaymentSelection()

      if (paymentSelection.accountId === Number(account.id)) {
        const nextPromptPayAccount = nextAccounts.find((nextAccount) => formatReceiptPromptPayNumber(nextAccount.promtpayno) !== "-")
        if (paymentSelection.channel === RECEIPT_PROMPTPAY_CHANNEL_LABEL && nextPromptPayAccount) {
          applyReceiptPromptPayAccount(nextPromptPayAccount)
        } else if (nextAccounts.length > 0) {
          applyReceiptPaymentAccount(nextAccounts[0])
        } else {
          setQT((prev: any) => ({ ...prev, pay: paymentSelection.channel || RECEIPT_BANK_CHANNEL_LABEL }))
        }
      }

      if (editingPaymentAccountId === Number(account.id)) {
        resetReceiptPaymentAccountForm()
      }
    } catch (error) {
      console.error(error)
      setPaymentAccountError("ลบบัญชีรับเงินไม่สำเร็จ")
    }
  }

  const setReceiptPaymentChannel = (channel: string) => {
    if (channel === RECEIPT_PROMPTPAY_CHANNEL_LABEL) {
      const selectedAccount = getSelectedReceiptPaymentAccount()
      const selectedPromptPayAccount = selectedAccount && formatReceiptPromptPayNumber(selectedAccount.promtpayno) !== "-"
        ? selectedAccount
        : paymentAccounts.find((account) => formatReceiptPromptPayNumber(account.promtpayno) !== "-")

      if (selectedPromptPayAccount) {
        applyReceiptPromptPayAccount(selectedPromptPayAccount)
      } else {
        setQT((prev: any) => ({ ...prev, pay: RECEIPT_PROMPTPAY_CHANNEL_LABEL }))
      }
      return
    }

    if (channel === RECEIPT_BANK_CHANNEL_LABEL) {
      const selectedAccount = getSelectedReceiptPaymentAccount() || paymentAccounts[0]
      if (selectedAccount) {
        applyReceiptPaymentAccount(selectedAccount)
      } else {
        setQT((prev: any) => ({ ...prev, pay: RECEIPT_BANK_CHANNEL_LABEL }))
        setShowReceiptPaymentSettings(true)
      }
      return
    }

    if (channel === RECEIPT_OTHER_CHANNEL_LABEL) {
      const currentText = getReceiptPaymentSelection().customText
      setQT((prev: any) => ({ ...prev, pay: currentText ? `other::${currentText}` : RECEIPT_OTHER_CHANNEL_LABEL }))
      return
    }

    setQT((prev: any) => ({ ...prev, pay: channel }))
  }

  const updateReceiptOtherPaymentText = (value: string) => {
    setQT((prev: any) => ({
      ...prev,
      pay: value.trim() ? `other::${value}` : RECEIPT_OTHER_CHANNEL_LABEL,
    }))
  }

  const renderReceiptPaymentSettingsModal = () => {
    const paymentSelection = getReceiptPaymentSelection()

    return (
      <Modal1
        show={showReceiptPaymentSettings}
        onHide={() => {
          setShowReceiptPaymentSettings(false)
          resetReceiptPaymentAccountForm()
        }}
        size="lg"
        className="document-modal detail-editor-modal"
        dialogClassName="document-modal-dialog"
        backdropClassName="document-modal-backdrop detail-editor-modal-backdrop"
        animation={false}
        centered
      >
        <Modal1.Header closeButton style={{ borderBottom: "1px solid #e5e7eb", background: "linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)" }}>
          <Modal1.Title style={{ width: "100%" }}>
            <div className="d-flex align-items-center" style={{ gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg, #d97706, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Landmark size={18} color="white" />
              </div>
              <div>
                <div style={{ fontFamily: "kanit_B", fontSize: 16, color: "#7c2d12" }}>จัดการบัญชีรับเงิน</div>
                <div style={{ fontFamily: "kanit", fontSize: 12, color: "#9a3412" }}>เพิ่ม แก้ไข ลบ และเลือกใช้บัญชีธนาคารหลายรายการได้ในใบเสร็จ</div>
              </div>
            </div>
          </Modal1.Title>
        </Modal1.Header>
        <Modal1.Body style={{ backgroundColor: "#f8fafc", padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 16 }}>
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb", padding: 16 }}>
              <div className="d-flex align-items-center justify-content-between" style={{ gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#111827" }}>บัญชีที่บันทึกไว้</div>
                  <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280" }}>{paymentAccounts.length} รายการ</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetReceiptPaymentAccountForm()
                    fetchPaymentAccounts()
                  }}
                  style={{
                    border: "1px solid #fed7aa",
                    backgroundColor: "#fff7ed",
                    color: "#c2410c",
                    borderRadius: 10,
                    padding: "6px 10px",
                    fontFamily: "kanit",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  รีเฟรช
                </button>
              </div>

              {paymentAccountsLoading ? (
                <div style={{ borderRadius: 14, border: "1px dashed #cbd5e1", padding: 18, textAlign: "center", fontFamily: "kanit", fontSize: 13, color: "#64748b" }}>
                  กำลังโหลดบัญชีรับเงิน...
                </div>
              ) : paymentAccounts.length === 0 ? (
                <div style={{ borderRadius: 14, border: "1px dashed #cbd5e1", padding: 22, textAlign: "center", background: "#f8fafc" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, margin: "0 auto 10px", backgroundColor: "#F3F8FC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Wallet size={20} color="#2A6AAA" />
                  </div>
                  <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#1f2937", marginBottom: 4 }}>ยังไม่มีบัญชีรับเงิน</div>
                  <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", marginBottom: 12 }}>เพิ่มบัญชีธนาคารแรกเพื่อใช้เลือกในใบเสร็จรับเงิน</div>
                  <button
                    type="button"
                    onClick={resetReceiptPaymentAccountForm}
                    style={{
                      border: "none",
                      background: "linear-gradient(135deg, #d97706, #f59e0b)",
                      color: "white",
                      borderRadius: 10,
                      padding: "8px 14px",
                      fontFamily: "kanit_B",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    + เพิ่มบัญชีแรก
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10, maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
                  {paymentAccounts.map((account) => {
                    const isSelected = paymentSelection.accountId === Number(account.id)
                    return (
                      <div
                        key={account.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => applyReceiptPaymentAccount(account)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            applyReceiptPaymentAccount(account)
                          }
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          borderRadius: 14,
                          border: `1px solid ${isSelected ? "#fdba74" : "#e5e7eb"}`,
                          background: isSelected ? "linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)" : "white",
                          padding: 14,
                          cursor: "pointer",
                          boxShadow: isSelected ? "0 10px 22px rgba(217,119,6,0.12)" : "none",
                        }}
                      >
                        <div className="d-flex align-items-start justify-content-between" style={{ gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#111827", marginBottom: 4 }}>{account.bank || "ไม่ระบุธนาคาร"}</div>
                            <div style={{ fontFamily: "kanit", fontSize: 12, color: "#374151", marginBottom: 4 }}>{account.name || "ไม่ระบุชื่อบัญชี"}</div>
                            <div style={{ fontFamily: "kanit", fontSize: 11, color: "#6b7280" }}>เลขบัญชี {formatReceiptBankAccountNumber(account.bookbankno)}</div>
                            {formatReceiptPromptPayNumber(account.promtpayno) !== "-" && (
                              <div style={{ fontFamily: "kanit", fontSize: 11, color: "#0f766e", marginTop: 2 }}>PromptPay {formatReceiptPromptPayNumber(account.promtpayno)}</div>
                            )}
                          </div>
                          <div className="d-flex align-items-center" style={{ gap: 6 }}>
                            {isSelected && (
                              <span style={{ padding: "4px 8px", borderRadius: 999, backgroundColor: "#E5EEF8", color: "#173F6B", fontFamily: "kanit_B", fontSize: 10 }}>
                                กำลังใช้
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                startEditingReceiptPaymentAccount(account)
                              }}
                              style={{ width: 30, height: 30, borderRadius: 10, border: "1px solid #e5e7eb", backgroundColor: "white", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                            >
                              <PencilLine size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                deleteReceiptPaymentAccount(account)
                              }}
                              style={{ width: 30, height: 30, borderRadius: 10, border: "1px solid #fee2e2", backgroundColor: "#fff5f5", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb", padding: 16 }}>
              <div className="d-flex align-items-center justify-content-between" style={{ gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#111827" }}>{editingPaymentAccountId ? "แก้ไขบัญชีรับเงิน" : "เพิ่มบัญชีรับเงิน"}</div>
                  <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280" }}>ระบุธนาคาร ชื่อบัญชี และเลขบัญชีเพื่อเลือกใช้ในเอกสาร</div>
                </div>
                {editingPaymentAccountId && (
                  <button
                    type="button"
                    onClick={resetReceiptPaymentAccountForm}
                    style={{ border: "none", backgroundColor: "transparent", color: "#64748b", fontFamily: "kanit", fontSize: 12, cursor: "pointer" }}
                  >
                    ยกเลิกแก้ไข
                  </button>
                )}
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", marginBottom: 6 }}>ธนาคาร</div>
                  <Form.Select
                    value={paymentAccountForm.bank}
                    onChange={(e) => setPaymentAccountForm((prev) => ({ ...prev, bank: e.target.value }))}
                    style={{ fontFamily: "Kanit", fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
                  >
                    <option value="">เลือกธนาคาร</option>
                    {THAI_BANK_OPTIONS.map((bankName) => (
                      <option key={bankName} value={bankName}>{bankName}</option>
                    ))}
                  </Form.Select>
                </div>

                <div>
                  <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", marginBottom: 6 }}>ชื่อบัญชี</div>
                  <Form.Control
                    key={`payment-account-name-${editingPaymentAccountId ?? "new"}-${paymentAccountFormVersion}`}
                    defaultValue={paymentAccountForm.name}
                    ref={paymentAccountNameInputRef}
                    onBlur={(e) => setPaymentAccountForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="เช่น บริษัท สไมล์ ฟาร์มาซี จำกัด"
                    style={{ fontFamily: "Kanit", fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
                  />
                </div>

                <div>
                  <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", marginBottom: 6 }}>เลขบัญชี</div>
                  <Form.Control
                    key={`payment-account-number-${editingPaymentAccountId ?? "new"}-${paymentAccountFormVersion}`}
                    defaultValue={paymentAccountForm.bookbankno}
                    ref={paymentAccountNumberInputRef}
                    inputMode="numeric"
                    onChange={(e) => {
                      const nextValue = e.target.value.replace(/[^\d]/g, "")
                      if (e.target.value !== nextValue) {
                        e.target.value = nextValue
                      }
                    }}
                    onBlur={(e) => setPaymentAccountForm((prev) => ({ ...prev, bookbankno: e.target.value.replace(/[^\d]/g, "") }))}
                    placeholder="กรอกเลขบัญชี"
                    style={{ fontFamily: "Kanit", fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
                  />
                </div>

                <div>
                  <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", marginBottom: 6 }}>เลข PromptPay</div>
                  <Form.Control
                    key={`payment-account-promptpay-${editingPaymentAccountId ?? "new"}-${paymentAccountFormVersion}`}
                    defaultValue={paymentAccountForm.promtpayno}
                    ref={paymentAccountPromptPayInputRef}
                    inputMode="numeric"
                    onChange={(e) => {
                      const nextValue = e.target.value.replace(/[^\d]/g, "")
                      if (e.target.value !== nextValue) {
                        e.target.value = nextValue
                      }
                    }}
                    onBlur={(e) => setPaymentAccountForm((prev) => ({ ...prev, promtpayno: e.target.value.replace(/[^\d]/g, "") }))}
                    placeholder="กรอกเบอร์/เลข PromptPay"
                    style={{ fontFamily: "Kanit", fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
                  />
                </div>

                {paymentAccountError && (
                  <div style={{ borderRadius: 12, border: "1px solid #fecaca", backgroundColor: "#fff1f2", padding: "10px 12px", fontFamily: "kanit", fontSize: 12, color: "#b91c1c" }}>
                    {paymentAccountError}
                  </div>
                )}

                <div style={{ borderRadius: 14, backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", padding: 14 }}>
                  <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#334155", marginBottom: 6 }}>ตัวอย่างที่จะแสดงในใบเสร็จ</div>
                  <div style={{ fontFamily: "kanit", fontSize: 12, color: "#0f172a", lineHeight: 1.7 }}>
                    {paymentAccountForm.bank || "ธนาคาร"} / {paymentAccountForm.name || "ชื่อบัญชี"} / {paymentAccountForm.bookbankno || "เลขบัญชี"}
                    {paymentAccountForm.promtpayno ? ` / PromptPay ${paymentAccountForm.promtpayno}` : ""}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={saveReceiptPaymentAccount}
                  disabled={paymentAccountSaving}
                  style={{
                    border: "none",
                    background: "linear-gradient(135deg, #2A6AAA, #3E86C7)",
                    color: "white",
                    borderRadius: 12,
                    padding: "10px 14px",
                    fontFamily: "kanit_B",
                    fontSize: 13,
                    cursor: paymentAccountSaving ? "wait" : "pointer",
                    opacity: paymentAccountSaving ? 0.75 : 1,
                  }}
                >
                  {paymentAccountSaving ? "กำลังบันทึก..." : editingPaymentAccountId ? "บันทึกการแก้ไข" : "เพิ่มบัญชีรับเงิน"}
                </button>
              </div>
            </div>
          </div>
        </Modal1.Body>
        <Modal1.Footer style={{ borderTop: "1px solid #e5e7eb", backgroundColor: "#fafbfc" }}>
          <button
            type="button"
            onClick={resetReceiptPaymentAccountForm}
            style={{ border: "1px solid #d1d5db", backgroundColor: "white", color: "#6b7280", borderRadius: 10, padding: "8px 12px", fontFamily: "kanit", fontSize: 12, cursor: "pointer" }}
          >
            ล้างฟอร์ม
          </button>
          <button
            type="button"
            onClick={() => setShowReceiptPaymentSettings(false)}
            style={{ border: "none", backgroundColor: "#111827", color: "white", borderRadius: 10, padding: "8px 14px", fontFamily: "kanit_B", fontSize: 12, cursor: "pointer" }}
          >
            เสร็จสิ้น
          </button>
        </Modal1.Footer>
      </Modal1>
    )
  }

  const renderReceiptStatementSection = ({ taxNum }: any) => {
    const { grandTotal } = getDocumentFinancialSummary(taxNum)
    const customerName = allQT.name_costomer || all.names || "-"
    const paymentSelection = getReceiptPaymentSelection()
    const receiverValue = String(allQT.re_person || "")
    const promptPayAccounts = paymentAccounts.filter((account) => formatReceiptPromptPayNumber(account.promtpayno) !== "-")
    const isPromptPayChannel = paymentSelection.channel === RECEIPT_PROMPTPAY_CHANNEL_LABEL
    const isBankChannel = paymentSelection.channel === RECEIPT_BANK_CHANNEL_LABEL
    const isOtherChannel = paymentSelection.channel === RECEIPT_OTHER_CHANNEL_LABEL

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)", borderRadius: 12, border: "1px solid #fed7aa", padding: "18px 20px" }}>
          <div className="d-flex align-items-center" style={{ gap: 8, marginBottom: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ReceiptIcon size={15} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#9a3412" }}>ช่องทางชำระเงิน</div>
              <div style={{ fontFamily: "kanit", fontSize: 11, color: "#c2410c" }}>สรุปตามรูปแบบใบเสร็จรับเงินที่ผู้ใช้ต้องการ</div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontFamily: "kanit", fontSize: 13, color: "#7c2d12", lineHeight: 1.7 }}>
              เขียนใบเสร็จรับเงินเพื่อเป็นหลักฐานการรับเงินจาก <span style={{ fontFamily: "kanit_B", color: "#9a3412" }}>{customerName}</span>
            </div>
            <div style={{ fontFamily: "kanit", fontSize: 13, color: "#7c2d12", lineHeight: 1.7 }}>
              เป็นจำนวนเงินรวมสุทธิ <span style={{ fontFamily: "kanit_B", color: "#9a3412" }}>{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span> บาท
            </div>
            <div style={{ fontFamily: "kanit", fontSize: 13, color: "#7c2d12", lineHeight: 1.7 }}>
              ช่องทางการรับเงินเป็น <span style={{ fontFamily: "kanit_B", color: "#9a3412" }}>{getReceiptPaymentMethodLabel()}</span>
            </div>
          </div>
        </div>

        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "18px 20px" }}>
          <div className="d-flex align-items-start justify-content-between" style={{ gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#1f2937" }}>ตั้งค่ารายละเอียดการรับเงิน</div>
              <div style={{ fontFamily: "kanit", fontSize: 11, color: "#6b7280", marginTop: 2 }}>เลือกช่องทางรับเงินและผูกบัญชีธนาคารที่บันทึกไว้</div>
            </div>
            <button
              type="button"
              onClick={openReceiptPaymentSettings}
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                backgroundColor: "#f8fafc",
                color: "#334155",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              title="จัดการบัญชีรับเงิน"
            >
              <Settings2 size={16} />
            </button>
          </div>

          <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", marginBottom: 8 }}>ช่องทางรับเงิน</div>
          <div className="d-flex flex-wrap" style={{ gap: 8, marginBottom: 10 }}>
            {RECEIPT_PAYMENT_OPTIONS.map((option) => {
              const isActive = paymentSelection.channel === option
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setReceiptPaymentChannel(option)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 999,
                    border: `1px solid ${isActive ? "#b45309" : "#e5e7eb"}`,
                    backgroundColor: isActive ? "#fff7ed" : "white",
                    color: isActive ? "#9a3412" : "#4b5563",
                    fontFamily: "kanit",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  {option}
                </button>
              )
            })}
          </div>

          {isBankChannel && (
            <div style={{ marginBottom: 14, borderRadius: 14, border: "1px solid #e5e7eb", backgroundColor: "#f8fafc", padding: 12 }}>
              <div className="d-flex align-items-center justify-content-between" style={{ gap: 8, marginBottom: 10 }}>
                <div className="d-flex align-items-center" style={{ gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: "#F3F8FC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Landmark size={15} color="#2A6AAA" />
                  </div>
                  <div>
                    <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#1f2937" }}>บัญชีธนาคารสำหรับรับเงิน</div>
                    <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b" }}>เลือกบัญชีที่ต้องการใช้ในใบเสร็จฉบับนี้</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openReceiptPaymentSettings}
                  style={{ border: "none", backgroundColor: "transparent", color: "#2A6AAA", fontFamily: "kanit_B", fontSize: 11, cursor: "pointer" }}
                >
                  จัดการบัญชี
                </button>
              </div>

              {paymentAccountsLoading ? (
                <div style={{ fontFamily: "kanit", fontSize: 12, color: "#64748b" }}>กำลังโหลดบัญชีธนาคาร...</div>
              ) : paymentAccounts.length === 0 ? (
                <div style={{ borderRadius: 12, border: "1px dashed #cbd5e1", backgroundColor: "white", padding: 14, textAlign: "center" }}>
                  <div style={{ fontFamily: "kanit", fontSize: 12, color: "#64748b", marginBottom: 8 }}>ยังไม่มีบัญชีธนาคารที่บันทึกไว้</div>
                  <button
                    type="button"
                    onClick={openReceiptPaymentSettings}
                    style={{ border: "none", background: "linear-gradient(135deg, #2A6AAA, #3E86C7)", color: "white", borderRadius: 10, padding: "8px 12px", fontFamily: "kanit_B", fontSize: 12, cursor: "pointer" }}
                  >
                    + เพิ่มบัญชีธนาคาร
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 8, maxHeight: 180, overflowY: "auto", paddingRight: 2 }}>
                  {paymentAccounts.map((account) => {
                    const isSelected = paymentSelection.accountId === Number(account.id)
                    return (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => applyReceiptPaymentAccount(account)}
                        style={{
                          textAlign: "left",
                          borderRadius: 12,
                          border: `1px solid ${isSelected ? "#A6C8E7" : "#e5e7eb"}`,
                          backgroundColor: isSelected ? "#F3F8FC" : "white",
                          padding: "10px 12px",
                          cursor: "pointer",
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between" style={{ gap: 8 }}>
                          <div>
                            <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#0f172a" }}>{account.bank || "ไม่ระบุธนาคาร"}</div>
                            <div style={{ fontFamily: "kanit", fontSize: 11, color: "#475569" }}>{account.name || "ไม่ระบุชื่อบัญชี"}</div>
                          </div>
                          {isSelected && (
                            <span style={{ padding: "4px 8px", borderRadius: 999, backgroundColor: "#E5EEF8", color: "#1E5088", fontFamily: "kanit_B", fontSize: 10 }}>
                              เลือกแล้ว
                            </span>
                          )}
                        </div>
                        <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b", marginTop: 4 }}>เลขบัญชี {formatReceiptBankAccountNumber(account.bookbankno)}</div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {isPromptPayChannel && (
            <div style={{ marginBottom: 14, borderRadius: 14, border: "1px solid #E5EEF8", backgroundColor: "#f0fdfa", padding: 12 }}>
              <div className="d-flex align-items-center justify-content-between" style={{ gap: 8, marginBottom: 10 }}>
                <div className="d-flex align-items-center" style={{ gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: "#ccfbf1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Wallet size={15} color="#0f766e" />
                  </div>
                  <div>
                    <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#134e4a" }}>PromptPay สำหรับรับเงิน</div>
                    <div style={{ fontFamily: "kanit", fontSize: 11, color: "#0f766e" }}>เลือกเลข PromptPay ที่บันทึกไว้ในบัญชีรับเงิน</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openReceiptPaymentSettings}
                  style={{ border: "none", backgroundColor: "transparent", color: "#0f766e", fontFamily: "kanit_B", fontSize: 11, cursor: "pointer" }}
                >
                  จัดการบัญชี
                </button>
              </div>

              {paymentAccountsLoading ? (
                <div style={{ fontFamily: "kanit", fontSize: 12, color: "#0f766e" }}>กำลังโหลด PromptPay...</div>
              ) : promptPayAccounts.length === 0 ? (
                <div style={{ borderRadius: 12, border: "1px dashed #99f6e4", backgroundColor: "white", padding: 14, textAlign: "center" }}>
                  <div style={{ fontFamily: "kanit", fontSize: 12, color: "#0f766e", marginBottom: 8 }}>ยังไม่มีเลข PromptPay ที่บันทึกไว้</div>
                  <button
                    type="button"
                    onClick={openReceiptPaymentSettings}
                    style={{ border: "none", background: "linear-gradient(135deg, #0f766e, #14b8a6)", color: "white", borderRadius: 10, padding: "8px 12px", fontFamily: "kanit_B", fontSize: 12, cursor: "pointer" }}
                  >
                    + เพิ่ม PromptPay
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 8, maxHeight: 180, overflowY: "auto", paddingRight: 2 }}>
                  {promptPayAccounts.map((account) => {
                    const promptPayNumber = formatReceiptPromptPayNumber(account.promtpayno)
                    const isSelected = paymentSelection.accountId === Number(account.id)
                    return (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => applyReceiptPromptPayAccount(account)}
                        style={{
                          textAlign: "left",
                          borderRadius: 12,
                          border: `1px solid ${isSelected ? "#5eead4" : "#E5EEF8"}`,
                          backgroundColor: isSelected ? "#ccfbf1" : "white",
                          padding: "10px 12px",
                          cursor: "pointer",
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between" style={{ gap: 8 }}>
                          <div>
                            <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#0f172a" }}>{account.name || "ไม่ระบุชื่อบัญชี"}</div>
                            <div style={{ fontFamily: "kanit", fontSize: 11, color: "#0f766e", marginTop: 4 }}>PromptPay {promptPayNumber}</div>
                            {account.bank ? <div style={{ fontFamily: "kanit", fontSize: 10, color: "#64748b", marginTop: 2 }}>{account.bank}</div> : null}
                          </div>
                          {isSelected && (
                            <span style={{ padding: "4px 8px", borderRadius: 999, backgroundColor: "#99f6e4", color: "#115e59", fontFamily: "kanit_B", fontSize: 10 }}>
                              เลือกแล้ว
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {isOtherChannel && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", marginBottom: 8 }}>รายละเอียดช่องทางรับเงิน</div>
              <Form.Control
                value={paymentSelection.customText}
                onChange={(e) => updateReceiptOtherPaymentText(e.target.value)}
                placeholder="เช่น รับผ่านตัวแทน / วอเลต / ระบบภายใน"
                style={{ fontFamily: "Kanit", fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
            </div>
          )}

          {renderReceiptSlipAttachmentControl()}

          <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", marginBottom: 8 }}>ผู้รับเงินในนามบริษัท</div>
          <SmoothDocumentTextInput
            className="form-control"
            value={receiverValue}
            onDraftChange={(value) => { documentSignatureNameDraftRef.current = value }}
            onCommit={(value) => updateDocumentSignatureName(value, "re")}
            placeholder={allQT.qt_person || "ชื่อผู้รับเงินในนามบริษัท"}
            style={{ fontFamily: "Kanit", fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
          <div style={{ fontFamily: "kanit", fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
            ถ้าไม่กรอก ระบบจะใช้ชื่อผู้รับผิดชอบจากเอกสารเดิมแทน
          </div>
        </div>
      </div>
    )
  }

  const renderReceiptSlipAttachmentControl = () => {
    const attachment = receiptSlipAttachment.data
    const isBusy = receiptSlipAttachment.loading

    return (
      <div style={{ marginBottom: 14, borderRadius: 14, border: "1px solid #e5e7eb", backgroundColor: "#f8fafc", padding: 12 }}>
        <input
          ref={receiptSlipInputRef}
          type="file"
          accept="application/pdf,.pdf"
          style={{ display: "none" }}
          onChange={(event) => {
            void handleReceiptSlipFileChange(event)
          }}
        />

        <div className="d-flex align-items-center justify-content-between" style={{ gap: 10, marginBottom: attachment ? 10 : 0 }}>
          <div className="d-flex align-items-center" style={{ gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={15} color="#dc2626" />
            </div>
            <div>
              <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#1f2937" }}>Slip จ่ายสินค้า</div>
              <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b" }}>แนบไฟล์ PDF เพิ่มเติมสำหรับหลักฐานการจ่ายสินค้า</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { void openReceiptSlipPicker() }}
            disabled={isBusy}
            style={{
              border: "1px solid #fecaca",
              backgroundColor: isBusy ? "#f3f4f6" : "white",
              color: isBusy ? "#9ca3af" : "#dc2626",
              borderRadius: 999,
              padding: "5px 10px",
              fontFamily: "kanit_B",
              fontSize: 11,
              cursor: isBusy ? "wait" : "pointer",
            }}
          >
            {isBusy ? "กำลังอัปโหลด..." : attachment ? "เปลี่ยน slip" : "+ เพิ่ม slip"}
          </button>
        </div>

        {attachment ? (
          <div className="d-flex align-items-center justify-content-between" style={{ gap: 10, borderRadius: 12, backgroundColor: "white", border: "1px solid #fee2e2", padding: "8px 10px" }}>
            <div className="d-flex align-items-center" style={{ gap: 10, minWidth: 0, flex: 1 }}>
              <button
                type="button"
                onClick={openReceiptSlipAttachment}
                title="เปิด slip PDF"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: "1px solid #fecaca",
                  backgroundColor: "#fff5f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#dc2626",
                  flexShrink: 0,
                  cursor: "pointer",
                }}
              >
                <FileText size={16} />
              </button>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attachment.fileName}</div>
                <div style={{ fontFamily: "kanit", fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{formatDocumentAttachmentSize(attachment.fileSize)}</div>
              </div>
            </div>

            <div className="d-flex align-items-center" style={{ gap: 6, flexShrink: 0 }}>
              <button
                type="button"
                onClick={openReceiptSlipAttachment}
                style={{ border: "1px solid #CCDFF1", backgroundColor: "#F3F8FC", color: "#2A6AAA", borderRadius: 999, padding: "4px 10px", fontFamily: "kanit", fontSize: 11, cursor: "pointer" }}
              >
                เปิด
              </button>
              <button
                type="button"
                onClick={() => { void deleteReceiptSlipAttachment() }}
                disabled={isBusy}
                style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #fecaca", backgroundColor: "#fff1f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", cursor: isBusy ? "wait" : "pointer" }}
                title="ลบ slip PDF"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ fontFamily: "kanit", fontSize: 11, color: "#94a3b8", marginTop: 8 }}>ยังไม่มีไฟล์ slip PDF แนบกับใบเสร็จฉบับนี้</div>
        )}

        {receiptSlipAttachment.error ? (
          <div style={{ fontFamily: "kanit", fontSize: 11, color: "#dc2626", marginTop: 8 }}>{receiptSlipAttachment.error}</div>
        ) : null}
      </div>
    )
  }

  const renderDocumentAttachmentSection = (docType: SalesDocumentType) => {
    const attachmentState = documentAttachments[docType]
    const attachment = attachmentState?.data
    const isBusy = Boolean(attachmentState?.loading)

    return (
      <div>
        <input
          ref={(element) => {
            attachmentInputRefs.current[docType] = element
          }}
          type="file"
          accept="application/pdf,.pdf"
          style={{ display: "none" }}
          onChange={(event) => {
            void handleDocumentAttachmentFileChange(docType, event)
          }}
        />

        <div className="d-flex align-items-center justify-content-between" style={{ gap: 10, marginBottom: 10 }}>
          <div className="d-flex align-items-center" style={{ gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={14} color="#dc2626" />
            </div>
            <div>
              <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151" }}>ไฟล์แนบ PDF</div>
              <div style={{ fontFamily: "kanit", fontSize: 11, color: "#9ca3af" }}>{documentLabelMap[docType]} จะเก็บในโฟลเดอร์ doc</div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-sm"
            style={{
              borderRadius: 999,
              border: "1px solid #CCDFF1",
              backgroundColor: isBusy ? "#f3f4f6" : "#F3F8FC",
              color: isBusy ? "#9ca3af" : "#1E5088",
              fontFamily: "kanit_B",
              fontSize: 11,
              padding: "4px 12px",
            }}
            onClick={() => { void openDocumentAttachmentPicker(docType) }}
            disabled={isBusy}
          >
            {isBusy ? "กำลังทำงาน..." : attachment ? "เปลี่ยนไฟล์" : "+ เพิ่ม PDF"}
          </button>
        </div>

        {attachment ? (
          <div style={{ border: "1px solid #fed7aa", borderRadius: 12, padding: "10px 12px", background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)" }}>
            <div className="d-flex align-items-center" style={{ gap: 12 }}>
              <button
                type="button"
                onClick={() => openDocumentAttachment(docType)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  border: "1px solid #fecaca",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  flexShrink: 0,
                }}
                title="เปิดไฟล์ PDF"
              >
                <FileText size={16} color="#dc2626" />
                <span style={{ fontFamily: "kanit_B", fontSize: 9, color: "#dc2626", lineHeight: 1 }}>PDF</span>
              </button>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {attachment.fileName}
                </div>
                <div style={{ fontFamily: "kanit", fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                  {formatDocumentAttachmentSize(attachment.fileSize)}
                  {attachment.updatedAt ? ` · อัปเดต ${new Date(attachment.updatedAt).toLocaleString('th-TH')}` : ""}
                </div>
              </div>

              <div className="d-flex align-items-center" style={{ gap: 6, flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ borderRadius: 999, border: "1px solid #CCDFF1", backgroundColor: "#F3F8FC", color: "#1E5088", fontFamily: "kanit", fontSize: 11, padding: "4px 10px" }}
                  onClick={() => openDocumentAttachment(docType)}
                >
                  เปิด
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ borderRadius: 999, border: "1px solid #CCDFF1", backgroundColor: "#F3F8FC", color: "#1E5088", fontFamily: "kanit", fontSize: 11, padding: "4px 10px" }}
                  onClick={() => { void openDocumentAttachmentPicker(docType) }}
                  disabled={isBusy}
                >
                  เปลี่ยน
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ borderRadius: 999, border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#dc2626", padding: "4px 8px" }}
                  onClick={() => { void deleteDocumentAttachment(docType) }}
                  disabled={isBusy}
                  title="ลบไฟล์แนบ PDF"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ border: "1px dashed #d1d5db", borderRadius: 12, padding: "12px 14px", backgroundColor: "#f8fafc" }}>
            <div className="d-flex align-items-center justify-content-between" style={{ gap: 12 }}>
              <div>
                <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#475569" }}>ยังไม่มีไฟล์แนบ PDF</div>
                <div style={{ fontFamily: "kanit", fontSize: 11, color: "#94a3b8", marginTop: 2 }}>เพิ่มไฟล์เพื่อเปิดดูหรือเปลี่ยนภายหลังได้จากหน้านี้</div>
              </div>
              <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: "white", border: "1px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText size={16} color="#94a3b8" />
              </div>
            </div>
          </div>
        )}

        {attachmentState?.error ? (
          <div style={{ fontFamily: "kanit", fontSize: 11, color: "#dc2626", marginTop: 8 }}>{attachmentState.error}</div>
        ) : null}
      </div>
    )
  }

  const renderDocumentSummarySection = ({ remarkQ, setremarkQ, discountControl, taxNum, attachmentDocType }: any) => {
    const { subtotal, endDiscount, rewardDiscount, netTotal, withholdingAmount, grandTotal, taxDisplayValue } = getDocumentFinancialSummary(taxNum)

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "16px 20px" }}>
          <div className="d-flex align-items-center" style={{ gap: 6, marginBottom: 10 }}>
            <BookOpen size={14} color="#6b7280" />
            <span style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151" }}>หมายเหตุ</span>
          </div>
          <Form.Control
            style={{ fontFamily: "Kanit", fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb", minHeight: 80, resize: "vertical" }}
            as="textarea"
            placeholder="เพิ่มหมายเหตุ..."
            aria-label="With textarea"
            value={remarkQ ?? ""}
            onChange={(e) => setremarkQ(e.target.value)}
          />

          {attachmentDocType ? (
            <>
              <div style={{ height: 1, backgroundColor: "#f3f4f6", margin: "14px 0 12px" }}></div>
              {renderDocumentAttachmentSection(attachmentDocType)}
            </>
          ) : null}
        </div>

        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "16px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "8px 12px", alignItems: "center" }}>
            <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", textAlign: "right" }}>รวมเงิน</div>
            <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#1f2937", textAlign: "right", minWidth: 80 }}>{subtotal.toLocaleString()}</div>
            <div style={{ fontFamily: "kanit", fontSize: 11, color: "#9ca3af" }}>บาท</div>

            <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", textAlign: "right" }}>ส่วนลดท้ายบิล</div>
            <div style={{ textAlign: "right" }}>{discountControl}</div>
            <div style={{ fontFamily: "kanit", fontSize: 11, color: "#9ca3af" }}>บาท</div>

            <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", textAlign: "right" }}>ใช้แต้มส่วนลด</div>
            <div style={{ fontFamily: "kanit", fontSize: 13, color: "#1f2937", textAlign: "right" }}>{rewardDiscount.toLocaleString()}</div>
            <div style={{ fontFamily: "kanit", fontSize: 11, color: "#9ca3af" }}>บาท</div>

            {String(taxNum || "") !== "" && (
              <>
                <div style={{ gridColumn: "1 / -1", height: 1, backgroundColor: "#f3f4f6", margin: "4px 0" }}></div>
                <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", textAlign: "right" }}>จำนวนเงินรวมทั้งสิ้น</div>
                <div style={{ fontFamily: "kanit", fontSize: 13, color: "#1f2937", textAlign: "right" }}>{netTotal.toLocaleString()}</div>
                <div style={{ fontFamily: "kanit", fontSize: 11, color: "#9ca3af" }}>บาท</div>

                <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", textAlign: "right" }}>หักภาษี ณ ที่จ่าย {taxDisplayValue}%</div>
                <div style={{ fontFamily: "kanit", fontSize: 13, color: "#1f2937", textAlign: "right" }}>{withholdingAmount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>
                <div style={{ fontFamily: "kanit", fontSize: 11, color: "#9ca3af" }}>บาท</div>
              </>
            )}

            <div style={{ gridColumn: "1 / -1", height: 1, backgroundColor: "#e5e7eb", margin: "4px 0" }}></div>
            <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#2A6AAA", textAlign: "right" }}>ยอดชำระทั้งหมด</div>
            <div style={{ fontFamily: "kanit_B", fontSize: 18, color: "#2A6AAA", textAlign: "right" }}>{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>
            <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#2A6AAA" }}>บาท</div>
          </div>
        </div>
      </div>
    )
  }

  const renderDocumentSignatureIncludeToggle = () => (
    <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "auto 1fr", gap: 8, alignItems: "center" }}>
      <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b" }}>ข้อมูลลงนาม</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden", backgroundColor: "#ffffff" }}>
        {[
          { label: "ใส่", value: true },
          { label: "ไม่ใส่", value: false },
        ].map((option) => {
          const isActive = includeDocumentSignatureInfo === option.value
          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={isActive}
              onClick={() => setIncludeDocumentSignatureInfo(option.value)}
              style={{
                height: 28,
                border: "none",
                borderLeft: option.value === false ? "1px solid #cbd5e1" : "none",
                backgroundColor: isActive ? "#0f766e" : "#ffffff",
                color: isActive ? "#ffffff" : "#475569",
                fontFamily: isActive ? "kanit_B" : "kanit",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )

  const renderDocumentSignatureControls = () => (
    <div className="document-signature-controls" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10, textAlign: "left" }}>
      <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 6, fontFamily: "kanit_B", fontSize: 11, color: "#1E5088" }}>
        <Signature size={13} />
        ลายเซ็นอิเล็กทรอนิกส์
      </div>
      {renderDocumentSignatureIncludeToggle()}
      <select
        value={selectedSignatureEmployeeId}
        onChange={handleDocumentSignatureEmployeeChange}
        disabled={signatureEmployeesLoading}
        style={{ height: 30, border: "1px solid #cbd5e1", borderRadius: 7, padding: "0 8px", fontFamily: "kanit", fontSize: 11, color: "#334155", background: "#ffffff" }}
      >
        <option value="">เลือกลายเซ็น</option>
        {signatureEmployees.map((employee) => (
          <option key={employee.id} value={employee.id}>{getSignatureEmployeeLabel(employee)}</option>
        ))}
      </select>
      <input
        type="date"
        value={documentSignatureDate}
        onChange={(event) => setDocumentSignatureDate(event.target.value)}
        style={{ height: 30, border: "1px solid #cbd5e1", borderRadius: 7, padding: "0 8px", fontFamily: "kanit", fontSize: 11, color: "#334155" }}
      />
      <SmoothDocumentTextInput
        className="form-control"
        value={documentSignatureName}
        onDraftChange={(value) => { documentSignatureNameDraftRef.current = value }}
        onCommit={(value) => updateDocumentSignatureName(value)}
        placeholder="ชื่อผู้ลงนาม"
        style={{ gridColumn: "1 / -1", height: 30, border: "1px solid #cbd5e1", borderRadius: 7, padding: "0 8px", fontFamily: "kanit", fontSize: 11, color: "#334155" }}
      />
    </div>
  )

  const renderCompanyElectronicSignatureCard = (roleLabel: string) => {
    const signerName = String(documentSignatureName || "").trim()
    const signatureDateLabel = formatDocumentSignatureDisplayDate(documentSignatureDate)

    return (
      <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "16px 18px 18px", textAlign: "center" }}>
        <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#6b7280", marginBottom: 8 }} title={storeS ? `ลงนาม ${storeS}` : "ลงนาม"}>ลงนาม</div>
        {renderDocumentSignatureControls()}
        {includeDocumentSignatureInfo ? (
          <>
            <div style={{ height: 42, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
              {documentSignatureLoading ? (
                <div className="document-signature-empty" style={{ fontFamily: "kanit", fontSize: 10, color: "#94a3b8" }}>กำลังโหลดลายเซ็น...</div>
              ) : documentSignatureUrl ? (
                <img
                  src={documentSignatureUrl}
                  alt="ลายเซ็นอิเล็กทรอนิกส์"
                  className="document-company-signature-image"
                  style={{ maxWidth: "70%", maxHeight: 42, objectFit: "contain" }}
                />
              ) : (
                <div className="document-signature-empty" style={{ fontFamily: "kanit", fontSize: 10, color: "#cbd5e1" }}>{selectedSignatureEmployeeId ? "ยังไม่มีลายเซ็นของพนักงานนี้" : "ยังไม่ได้เลือกลายเซ็น"}</div>
              )}
            </div>
            <div style={{ width: "60%", margin: "0 auto", borderBottom: "1px dashed #d1d5db" }}></div>
            <div style={{ fontFamily: signerName ? "kanit_B" : "kanit", fontSize: 11, color: signerName ? "#173F6B" : "#9ca3af", marginTop: 4, minHeight: 17 }}>
              {signerName || "ชื่อผู้ลงนาม"}
            </div>
            <div style={{ fontFamily: "kanit", fontSize: 10, color: "#6b7280", marginTop: 1 }}>{roleLabel}</div>
            <div style={{ fontFamily: "kanit", fontSize: 10, color: "#1E5088", marginTop: 2 }}>{signatureDateLabel}</div>
          </>
        ) : (
          <div style={{ minHeight: 78, borderRadius: 8, border: "1px dashed #cbd5e1", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
            <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b" }}>ไม่ใส่ข้อมูลลงนามในเอกสาร</div>
          </div>
        )}
      </div>
    )
  }

  const renderReceiptSignatureSection = () => (
    <div style={{ display: "grid", gridTemplateColumns: includeDocumentSignatureInfo ? "1fr 1fr" : "1fr", gap: 16, marginTop: 16 }}>
      {includeDocumentSignatureInfo ? (
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "20px", textAlign: "center" }}>
          <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#6b7280", marginBottom: 30 }}>ลงนาม</div>
          <div style={{ width: "60%", margin: "0 auto", borderBottom: "1px dashed #d1d5db" }}></div>
          <div style={{ fontFamily: "kanit", fontSize: 11, color: "#9ca3af", marginTop: 4 }}>ผู้ชำระเงิน</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, color: "#d1d5db", marginTop: 2 }}>วันที่ ........./.........../..........</div>
        </div>
      ) : null}
      {renderCompanyElectronicSignatureCard("ผู้รับเงินในนามบริษัท")}
    </div>
  )

  const renderPrintManualSignatureCard = ({ companyName, roleLabel, dateLabel = "วันที่" }: any) => (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "14px 16px", minHeight: 128, backgroundColor: "#ffffff" }}>
      <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#475569", textAlign: "center", minHeight: 18 }} title={companyName ? `ลงนาม ${companyName}` : "ลงนาม"}>ลงนาม</div>
      <div style={{ height: 46 }}></div>
      <div style={{ width: "74%", margin: "0 auto", borderBottom: "1px solid #94a3b8" }}></div>
      <div style={{ fontFamily: "kanit_B", fontSize: 10.5, color: "#0f172a", marginTop: 6, textAlign: "center" }}>{roleLabel}</div>
      <div style={{ fontFamily: "kanit", fontSize: 9.5, color: "#64748b", marginTop: 3, textAlign: "center" }}>{dateLabel} ........./.........../..........</div>
    </div>
  )

  const renderPrintElectronicSignatureCard = ({ companyName, roleLabel, signerName, dateValue, signatureUrl }: any) => {
    const signerDisplay = String(signerName || documentSignatureName || "").trim()
    const signatureDateLabel = formatDocumentSignatureDisplayDate(toDocumentSignatureInputDate(dateValue || documentSignatureDate || new Date()))

    return (
      <div style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "12px 16px 14px", minHeight: 128, backgroundColor: "#ffffff" }}>
        <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#475569", textAlign: "center", minHeight: 18 }} title={companyName ? `ลงนาม ${companyName}` : "ลงนาม"}>ลงนาม</div>
        <div style={{ height: 46, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
          {documentSignatureLoading ? (
            <div style={{ fontFamily: "kanit", fontSize: 9.5, color: "#94a3b8" }}>กำลังโหลดลายเซ็น...</div>
          ) : signatureUrl ? (
            <img
              src={signatureUrl}
              alt="ลายเซ็นอิเล็กทรอนิกส์"
              style={{ maxWidth: 180, maxHeight: 46, objectFit: "contain", display: "block" }}
            />
          ) : (
            <div style={{ fontFamily: "kanit", fontSize: 9.5, color: "#94a3b8" }}>ลายเซ็นอิเล็กทรอนิกส์</div>
          )}
        </div>
        <div style={{ width: "74%", margin: "0 auto", borderBottom: "1px solid #94a3b8" }}></div>
        <div style={{ fontFamily: signerDisplay ? "kanit_B" : "kanit", fontSize: 10.5, color: signerDisplay ? "#0f172a" : "#94a3b8", marginTop: 5, textAlign: "center", minHeight: 16 }}>
          {signerDisplay || "ชื่อผู้ลงนาม"}
        </div>
        <div style={{ fontFamily: "kanit", fontSize: 9.5, color: "#334155", marginTop: 2, textAlign: "center" }}>{roleLabel}</div>
        <div style={{ fontFamily: "kanit", fontSize: 9.5, color: "#0F6845", marginTop: 2, textAlign: "center" }}>วันที่อนุมัติ {signatureDateLabel}</div>
      </div>
    )
  }

  const isApprovedDocumentStatus = (status: any) => String(status || "").trim() === "อนุมัติ"

  const renderSalesDocumentPrintSignatureSection = ({ status, customerRoleLabel = "ผู้สั่งซื้อสินค้า", companyRoleLabel = "ผู้อนุมัติ", signerName, dateValue }: any) => {
    const shouldShowElectronicSignature = includeDocumentSignatureInfo && isApprovedDocumentStatus(status)

    return (
      <div className="document-print-signatures" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "stretch", marginTop: 24 }}>
        <div>
          {renderPrintManualSignatureCard({
            companyName: allQT.name_costomer || all.names || "-",
            roleLabel: customerRoleLabel,
            dateLabel: "วันที่ลงนาม",
          })}
        </div>
        <div>
          {shouldShowElectronicSignature ? renderPrintElectronicSignatureCard({
            companyName: storeS,
            roleLabel: companyRoleLabel,
            signerName: signerName || documentSignatureName || allQT.qt_person || allQT.person,
            dateValue: dateValue || documentSignatureDate,
            signatureUrl: documentSignatureUrl,
          }) : renderPrintManualSignatureCard({
            companyName: storeS,
            roleLabel: companyRoleLabel,
            dateLabel: "วันที่",
          })}
        </div>
      </div>
    )
  }

  const renderReceiptPrintSignatureSection = () => (
    <div className="document-print-signatures" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "stretch", marginTop: 24 }}>
      <div>
        {renderPrintManualSignatureCard({
          companyName: allQT.name_costomer || all.names || "-",
          roleLabel: "ผู้ชำระเงิน",
          dateLabel: "วันที่ชำระเงิน",
        })}
      </div>
      <div>
        {includeDocumentSignatureInfo && isApprovedDocumentStatus(allQT.re_status) ? renderPrintElectronicSignatureCard({
          companyName: storeS,
          roleLabel: "ผู้รับเงินในนามบริษัท",
          signerName: allQT.re_person || documentSignatureName || allQT.qt_person || allQT.person,
          dateValue: allQT.re_date || documentSignatureDate,
          signatureUrl: documentSignatureUrl,
        }) : renderPrintManualSignatureCard({
          companyName: storeS,
          roleLabel: "ผู้รับเงินในนามบริษัท",
          dateLabel: "วันที่",
        })}
      </div>
    </div>
  )

  const getReceiptPrintDocumentNumber = () => {
    const fullNumber = String(allQT.re_orderfull || "").trim()
    if (fullNumber) return fullNumber
    const orderNo = String(allQT.re_orderNo || "").trim()
    const runningNo = String(allQT.re_number || "").trim()
    return orderNo || runningNo ? `RE${orderNo}${runningNo}` : "-"
  }

  const renderReceiptPrintInfoLine = (label: string, value: any) => (
    <div style={{ display: "grid", gridTemplateColumns: "78px 1fr", gap: 8, alignItems: "start", minHeight: 19 }}>
      <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#64748b", textAlign: "right" }}>{label}</div>
      <div style={{ fontFamily: "kanit_B", fontSize: 10.5, color: "#0f172a", wordBreak: "break-word" }}>{value || "-"}</div>
    </div>
  )

  const renderReceiptPrintPartyBlock = ({ title, name, address, taxId, tel }: any) => (
    <div className="document-print-section" style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", minHeight: 104, backgroundColor: "#ffffff" }}>
      <div style={{ fontFamily: "kanit_B", fontSize: 11, color: "#0f766e", marginBottom: 6 }}>{title}</div>
      <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#0f172a", lineHeight: 1.45 }}>{name || "-"}</div>
      <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#334155", lineHeight: 1.55, marginTop: 2, minHeight: 32 }}>{address || "-"}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
        <div style={{ fontFamily: "kanit", fontSize: 10, color: "#64748b" }}>เลขที่ผู้เสียภาษี: <span style={{ color: "#0f172a" }}>{taxId || "-"}</span></div>
        <div style={{ fontFamily: "kanit", fontSize: 10, color: "#64748b" }}>โทร: <span style={{ color: "#0f172a" }}>{tel || "-"}</span></div>
      </div>
    </div>
  )

  const renderReceiptPrintHeader = () => (
    <div className="document-print-header" style={{ borderBottom: "2px solid #0f172a", paddingBottom: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 24, alignItems: "start" }}>
        <div>
          <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#0f766e", letterSpacing: 0 }}>RECEIPT</div>
          <div style={{ fontFamily: "Kanit_B", fontSize: 18, color: "#0f172a", lineHeight: 1.35, marginTop: 2 }}>{storeS || "-"}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#334155", lineHeight: 1.55, marginTop: 4 }}>{addressS || "-"}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#334155", lineHeight: 1.55 }}>เลขที่ผู้เสียภาษี: {taxS || "-"} | โทร: {telS || "-"}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "Kanit_B", fontSize: 24, color: "#0f172a", lineHeight: 1.2 }}>ใบเสร็จรับเงิน</div>
          <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b", marginTop: 2 }}>Receipt</div>
          <div style={{ marginTop: 12, border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 10px", textAlign: "left" }}>
            {renderReceiptPrintInfoLine("เลขที่", getReceiptPrintDocumentNumber())}
            {renderReceiptPrintInfoLine("วันที่", formatDocumentDate(allQT.re_date))}
            {renderReceiptPrintInfoLine("เครดิต", allQT.re_credit || "0")}
            {renderReceiptPrintInfoLine("ครบกำหนด", formatDocumentDate(allQT.re_enddate))}
            {renderReceiptPrintInfoLine("ผู้รับเงิน", getReceiptReceiverName() === "-" ? "" : getReceiptReceiverName())}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        {renderReceiptPrintPartyBlock({
          title: "ข้อมูลผู้ขาย",
          name: storeS,
          address: addressS,
          taxId: taxS,
          tel: telS,
        })}
        {renderReceiptPrintPartyBlock({
          title: "ข้อมูลผู้ซื้อ / ผู้ชำระเงิน",
          name: allQT.name_costomer || all.names,
          address: all.address,
          taxId: all.numbertax,
          tel: all.tel,
        })}
      </div>
    </div>
  )

  const renderReceiptPrintSummaryTable = (taxNum: string | number | undefined) => {
    const { subtotal, endDiscount, rewardDiscount, netTotal, withholdingAmount, grandTotal, taxDisplayValue } = getDocumentFinancialSummary(taxNum)
    const showWithholding = String(taxNum || "") !== ""

    return (
      <div className="document-print-section" style={{ border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden", backgroundColor: "#ffffff" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 96px 34px", gap: 0, borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ fontFamily: "kanit_B", fontSize: 11, color: "#0f172a", padding: "8px 10px", backgroundColor: "#f8fafc" }}>สรุปยอดเงิน</div>
          <div style={{ fontFamily: "kanit_B", fontSize: 11, color: "#0f172a", padding: "8px 8px", backgroundColor: "#f8fafc", textAlign: "right" }}>จำนวน</div>
          <div style={{ fontFamily: "kanit_B", fontSize: 11, color: "#0f172a", padding: "8px 8px", backgroundColor: "#f8fafc" }}>บาท</div>

          <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#475569", padding: "7px 10px", textAlign: "right" }}>รวมเงิน</div>
          <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#0f172a", padding: "7px 8px", textAlign: "right" }}>{formatDocumentCurrency(subtotal)}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#475569", padding: "7px 8px" }}>บาท</div>

          <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#475569", padding: "7px 10px", textAlign: "right" }}>ส่วนลดท้ายบิล</div>
          <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#0f172a", padding: "7px 8px", textAlign: "right" }}>{formatDocumentCurrency(endDiscount)}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#475569", padding: "7px 8px" }}>บาท</div>

          <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#475569", padding: "7px 10px", textAlign: "right" }}>ใช้แต้มส่วนลด</div>
          <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#0f172a", padding: "7px 8px", textAlign: "right" }}>{formatDocumentCurrency(rewardDiscount)}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#475569", padding: "7px 8px" }}>บาท</div>

          {showWithholding ? (
            <>
              <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #e2e8f0" }}></div>
              <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#475569", padding: "7px 10px", textAlign: "right" }}>จำนวนเงินรวมทั้งสิ้น</div>
              <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#0f172a", padding: "7px 8px", textAlign: "right" }}>{formatDocumentCurrency(netTotal)}</div>
              <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#475569", padding: "7px 8px" }}>บาท</div>

              <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#475569", padding: "7px 10px", textAlign: "right" }}>หักภาษี ณ ที่จ่าย {taxDisplayValue}%</div>
              <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#0f172a", padding: "7px 8px", textAlign: "right" }}>{formatDocumentCurrency(withholdingAmount)}</div>
              <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#475569", padding: "7px 8px" }}>บาท</div>
            </>
          ) : null}

          <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #94a3b8" }}></div>
          <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#173F6B", padding: "9px 10px", textAlign: "right", backgroundColor: "#F3F8FC" }}>ยอดชำระทั้งหมด</div>
          <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#173F6B", padding: "9px 8px", textAlign: "right", backgroundColor: "#F3F8FC" }}>{formatDocumentCurrency(grandTotal)}</div>
          <div style={{ fontFamily: "kanit_B", fontSize: 11, color: "#173F6B", padding: "9px 8px", backgroundColor: "#F3F8FC" }}>บาท</div>
        </div>
      </div>
    )
  }

  const renderReceiptPrintFooterBlock = (taxNum: string | number | undefined) => {
    const { grandTotal } = getDocumentFinancialSummary(taxNum)

    return (
      <div className="document-print-footer-block" style={{ display: "grid", gridTemplateColumns: "1.12fr 0.88fr", gap: 16, alignItems: "start", marginTop: 18 }}>
        <div>
          <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#475569", marginBottom: 8 }}>ทั้งหมด {qt_detail.length} รายการ</div>
          <div className="document-print-section" style={{ border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden", backgroundColor: "#ffffff" }}>
            <div style={{ fontFamily: "kanit_B", fontSize: 11, color: "#0f172a", padding: "8px 10px", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>หมายเหตุ</div>
            <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#334155", lineHeight: 1.7, minHeight: 46, padding: "8px 10px", whiteSpace: "pre-wrap" }}>{allQT.re_remark || "-"}</div>
          </div>
          <div className="document-print-section" style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", marginTop: 10, backgroundColor: "#ffffff" }}>
            <div style={{ fontFamily: "kanit_B", fontSize: 11, color: "#0f766e", marginBottom: 6 }}>รายละเอียดการรับเงิน</div>
            <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#334155", lineHeight: 1.75 }}>ได้รับเงินจาก <span style={{ fontFamily: "kanit_B", color: "#0f172a" }}>{allQT.name_costomer || all.names || "-"}</span></div>
            <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#334155", lineHeight: 1.75 }}>เป็นจำนวนเงินสุทธิ <span style={{ fontFamily: "kanit_B", color: "#173F6B" }}>{formatDocumentCurrency(grandTotal)}</span> บาท</div>
            <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#334155", lineHeight: 1.75 }}>ช่องทางการรับเงิน: <span style={{ fontFamily: "kanit_B", color: "#0f172a" }}>{getReceiptPaymentMethodLabel()}</span></div>
          </div>
        </div>
        {renderReceiptPrintSummaryTable(taxNum)}
      </div>
    )
  }

  const getSalesPrintDocumentNumber = (docType: SalesDocumentType) => {
    const documentRecord = allQT as any
    const fullNumber = String(documentRecord[`${docType}_orderfull`] || "").trim()
    if (fullNumber) return fullNumber
    const orderNo = String(documentRecord[`${docType}_orderNo`] || "").trim()
    const runningNo = String(documentRecord[`${docType}_number`] || "").trim()
    const prefix = documentOrderPrefixMap[docType] || docType.toUpperCase()
    return orderNo || runningNo ? `${prefix}${orderNo}${runningNo}` : "-"
  }

  const renderSalesPrintHeader = ({ title, englishTitle, documentNumber, dateValue, endDateValue, creditValue, personName }: any) => (
    <div className="document-print-header" style={{ borderBottom: "2px solid #0f172a", paddingBottom: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 24, alignItems: "start" }}>
        <div>
          <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#1E5088", letterSpacing: 0 }}>{englishTitle || "SALES DOCUMENT"}</div>
          <div style={{ fontFamily: "Kanit_B", fontSize: 18, color: "#0f172a", lineHeight: 1.35, marginTop: 2 }}>{storeS || "-"}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#334155", lineHeight: 1.55, marginTop: 4 }}>{addressS || "-"}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#334155", lineHeight: 1.55 }}>เลขที่ผู้เสียภาษี: {taxS || "-"} | โทร: {telS || "-"}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "Kanit_B", fontSize: 24, color: "#0f172a", lineHeight: 1.2 }}>{title}</div>
          <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b", marginTop: 2 }}>{englishTitle || "Sales Document"}</div>
          <div style={{ marginTop: 12, border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 10px", textAlign: "left" }}>
            {renderReceiptPrintInfoLine("เลขที่", documentNumber)}
            {renderReceiptPrintInfoLine("วันที่", formatDocumentDate(dateValue))}
            {renderReceiptPrintInfoLine("เครดิต", creditValue ? `${creditValue} วัน` : "0 วัน")}
            {renderReceiptPrintInfoLine("ครบกำหนด", formatDocumentDate(endDateValue))}
            {renderReceiptPrintInfoLine("พนักงานขาย", personName || "-")}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        {renderReceiptPrintPartyBlock({
          title: "ข้อมูลผู้ขาย",
          name: storeS,
          address: addressS,
          taxId: taxS,
          tel: telS,
        })}
        {renderReceiptPrintPartyBlock({
          title: "ข้อมูลผู้ซื้อ",
          name: allQT.name_costomer || all.names,
          address: all.address,
          taxId: all.numbertax,
          tel: all.tel,
        })}
      </div>
    </div>
  )

  const renderSalesPrintFooterBlock = ({ taxNum, remark, paymentInfo }: any) => (
    <div className="document-print-footer-block" style={{ display: "grid", gridTemplateColumns: "1.12fr 0.88fr", gap: 16, alignItems: "start", marginTop: 18 }}>
      <div>
        <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#475569", marginBottom: 8 }}>ทั้งหมด {qt_detail.length} รายการ</div>
        <div className="document-print-section" style={{ border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden", backgroundColor: "#ffffff" }}>
          <div style={{ fontFamily: "kanit_B", fontSize: 11, color: "#0f172a", padding: "8px 10px", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>หมายเหตุ</div>
          <div style={{ fontFamily: "kanit", fontSize: 10.5, color: "#334155", lineHeight: 1.7, minHeight: 46, padding: "8px 10px", whiteSpace: "pre-wrap" }}>{remark || "-"}</div>
        </div>
        {paymentInfo ? (
          <div className="document-print-section" style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", marginTop: 10, backgroundColor: "#ffffff" }}>
            <div style={{ fontFamily: "kanit_B", fontSize: 11, color: "#0f766e", marginBottom: 6 }}>{paymentInfo.title}</div>
            {paymentInfo.lines.map((line: any, index: number) => (
              <div key={`${line.label}-${index}`} style={{ fontFamily: "kanit", fontSize: 10.5, color: "#334155", lineHeight: 1.75 }}>
                {line.label}: <span style={{ fontFamily: "kanit_B", color: line.color || "#0f172a" }}>{line.value || "-"}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {renderReceiptPrintSummaryTable(taxNum)}
    </div>
  )

  const renderSalesPrintDocument = ({ docType, title, englishTitle, dateValue, endDateValue, creditValue, personName, remark, taxNum, status, customerRoleLabel = "ผู้สั่งซื้อสินค้า", companyRoleLabel = "ผู้อนุมัติ", paymentInfo }: any) => {
    const sellerName = String(personName || getResolvedDocumentSellerName(docType as SalesDocumentType) || "").trim()

    return (
      <div className="document-standard-print-layout">
        {renderSalesPrintHeader({
          title,
          englishTitle,
          documentNumber: getSalesPrintDocumentNumber(docType),
          dateValue,
          endDateValue,
          creditValue,
          personName: sellerName,
        })}
        <div className="document-print-items-section" style={{ marginTop: 18 }}>
          {renderProfessionalPrintItemsTable(qt_detail)}
        </div>
        {renderSalesPrintFooterBlock({ taxNum, remark, paymentInfo })}
        {renderSalesDocumentPrintSignatureSection({
          status,
          customerRoleLabel,
          companyRoleLabel,
          signerName: sellerName,
          dateValue,
        })}
      </div>
    )
  }

  const renderReceiptPrintDocument = (taxNum: string | number | undefined) => (
    <div className="document-standard-print-layout">
      {renderReceiptPrintHeader()}
      <div className="document-print-items-section" style={{ marginTop: 18 }}>
        {renderProfessionalPrintItemsTable(qt_detail)}
      </div>
      {renderReceiptPrintFooterBlock(taxNum)}
      {renderReceiptPrintSignatureSection()}
    </div>
  )

  const PROFESSIONAL_DOCUMENT_PRINT_PAGE_STYLE = `
    @page {
      size: A4 portrait;
      margin: 12mm;
    }

    @media print {
      html, body {
        background: #ffffff !important;
      }

      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .document-print-sheet {
        width: auto !important;
        min-height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        box-shadow: none !important;
        background: #ffffff !important;
        overflow: visible !important;
      }

      .document-standard-print-layout {
        color: #0f172a !important;
        font-family: kanit, sans-serif !important;
      }

      .document-print-header,
      .document-print-section,
      .document-print-footer-block,
      .document-print-signatures {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      .document-signature-controls,
      .document-signature-empty {
        display: none !important;
      }

      .document-company-signature-image {
        max-height: 16mm !important;
        object-fit: contain !important;
      }

      .document-print-items {
        width: 100% !important;
        border-collapse: collapse !important;
        table-layout: fixed !important;
        page-break-inside: auto !important;
        break-inside: auto !important;
      }

      .document-print-items thead {
        display: table-header-group !important;
      }

      .document-print-items tfoot {
        display: table-footer-group !important;
      }

      .document-print-items tbody {
        display: table-row-group !important;
      }

      .document-print-items tr,
      .document-print-items th,
      .document-print-items td {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

    }
  `

  const PROFESSIONAL_DOCUMENT_PRINT_SHEET_STYLE = {
    justifySelf: "center",
    backgroundColor: "white",
    width: "210mm",
    minHeight: "297mm",
    margin: "0 auto",
    padding: "12mm 14mm",
    boxSizing: "border-box" as const,
    boxShadow: "0 20px 40px rgba(15, 23, 42, 0.18)",
  }

  const renderProfessionalPrintItemsTable = (rows: any[]) => (
    <table
      className="document-print-items"
      style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}
    >
      <thead>
        <tr>
          <th style={{ width: 32, fontFamily: "kanit_B", fontSize: 10, color: "#0f172a", textAlign: "center", padding: "7px 4px", borderTop: "1px solid #0f172a", borderBottom: "1px solid #0f172a", backgroundColor: "#f8fafc" }}>ลำดับ</th>
          <th style={{ fontFamily: "kanit_B", fontSize: 10, color: "#0f172a", textAlign: "left", padding: "7px 8px", borderTop: "1px solid #0f172a", borderBottom: "1px solid #0f172a", backgroundColor: "#f8fafc" }}>รายการ</th>
          <th style={{ width: 46, fontFamily: "kanit_B", fontSize: 10, color: "#0f172a", textAlign: "center", padding: "7px 4px", borderTop: "1px solid #0f172a", borderBottom: "1px solid #0f172a", backgroundColor: "#f8fafc" }}>จำนวน</th>
          <th style={{ width: 52, fontFamily: "kanit_B", fontSize: 10, color: "#0f172a", textAlign: "center", padding: "7px 4px", borderTop: "1px solid #0f172a", borderBottom: "1px solid #0f172a", backgroundColor: "#f8fafc" }}>หน่วย</th>
          <th style={{ width: 72, fontFamily: "kanit_B", fontSize: 10, color: "#0f172a", textAlign: "right", padding: "7px 4px", borderTop: "1px solid #0f172a", borderBottom: "1px solid #0f172a", backgroundColor: "#f8fafc" }}>ราคาต่อหน่วย</th>
          <th style={{ width: 52, fontFamily: "kanit_B", fontSize: 10, color: "#0f172a", textAlign: "right", padding: "7px 4px", borderTop: "1px solid #0f172a", borderBottom: "1px solid #0f172a", backgroundColor: "#f8fafc" }}>ลด/ชิ้น</th>
          <th style={{ width: 58, fontFamily: "kanit_B", fontSize: 10, color: "#0f172a", textAlign: "right", padding: "7px 4px", borderTop: "1px solid #0f172a", borderBottom: "1px solid #0f172a", backgroundColor: "#f8fafc" }}>รวม</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={7} style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", padding: "14px 8px", verticalAlign: "top", borderBottom: "1px solid #d1d5db", color: "#94a3b8" }}>ยังไม่มีรายการสินค้า</td>
          </tr>
        ) : rows.map((row: any, index: number) => (
          <tr key={row.id || `${row.name_product || "item"}-${index}`}>
            <td style={{ fontFamily: "kanit", fontSize: 10.5, color: "#0f172a", textAlign: "center", padding: "5px 4px", verticalAlign: "top", borderBottom: "1px solid #e2e8f0" }}>{index + 1}</td>
            <td style={{ fontFamily: "kanit", fontSize: 10.5, color: "#0f172a", textAlign: "left", padding: "5px 8px", verticalAlign: "top", borderBottom: "1px solid #e2e8f0", wordBreak: "break-word", lineHeight: 1.45 }}>{row.name_product || "-"}</td>
            <td style={{ fontFamily: "kanit", fontSize: 10.5, color: "#0f172a", textAlign: "center", padding: "5px 4px", verticalAlign: "top", borderBottom: "1px solid #e2e8f0" }}>{formatDocumentQuantity(row.qty)}</td>
            <td style={{ fontFamily: "kanit", fontSize: 10.5, color: "#0f172a", textAlign: "center", padding: "5px 4px", verticalAlign: "top", borderBottom: "1px solid #e2e8f0", wordBreak: "break-word" }}>{row.unit || "-"}</td>
            <td style={{ fontFamily: "kanit", fontSize: 10.5, color: "#0f172a", textAlign: "right", padding: "5px 4px", verticalAlign: "top", borderBottom: "1px solid #e2e8f0" }}>{formatDocumentCurrency(row.price)}</td>
            <td style={{ fontFamily: "kanit", fontSize: 10.5, color: "#0f172a", textAlign: "right", padding: "5px 4px", verticalAlign: "top", borderBottom: "1px solid #e2e8f0" }}>{formatDocumentCurrency(row.discount)}</td>
            <td style={{ fontFamily: "kanit", fontSize: 10.5, color: "#0f172a", textAlign: "right", padding: "5px 4px", verticalAlign: "top", borderBottom: "1px solid #e2e8f0" }}>{formatDocumentCurrency(row.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const renderPurchaseOrderPrintItemsTable = (rows: any[]) => (
    <table
      className="document-print-items"
      style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}
    >
      <thead>
        <tr>
          <th style={{ width: 30, fontFamily: "kanit_B", fontSize: 10, textAlign: "center", padding: "6px 4px", borderTop: "1px solid black", borderBottom: "1px solid black" }}>ลำดับ</th>
          <th style={{ width: 70, fontFamily: "kanit_B", fontSize: 10, textAlign: "left", padding: "6px 6px", borderTop: "1px solid black", borderBottom: "1px solid black" }}>รหัสสินค้า</th>
          <th style={{ fontFamily: "kanit_B", fontSize: 10, textAlign: "left", padding: "6px 8px", borderTop: "1px solid black", borderBottom: "1px solid black" }}>รายการสินค้า</th>
          <th style={{ width: 46, fontFamily: "kanit_B", fontSize: 10, textAlign: "center", padding: "6px 4px", borderTop: "1px solid black", borderBottom: "1px solid black" }}>หน่วย</th>
          <th style={{ width: 54, fontFamily: "kanit_B", fontSize: 10, textAlign: "center", padding: "6px 4px", borderTop: "1px solid black", borderBottom: "1px solid black" }}>จำนวน</th>
          <th style={{ width: 76, fontFamily: "kanit_B", fontSize: 10, textAlign: "right", padding: "6px 4px", borderTop: "1px solid black", borderBottom: "1px solid black" }}>ราคาทุน/หน่วย</th>
          <th style={{ width: 82, fontFamily: "kanit_B", fontSize: 10, textAlign: "right", padding: "6px 4px", borderTop: "1px solid black", borderBottom: "1px solid black" }}>รวม</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={7} style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", padding: "12px 8px", borderBottom: "1px solid #d1d5db", color: "#94a3b8" }}>
              ยังไม่มีรายการสินค้าในใบสั่งซื้อนี้
            </td>
          </tr>
        ) : rows.map((row: any, index: number) => (
          <tr key={row.id || `${row.itemcode || "item"}-${index}`}>
            <td style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", padding: "5px 4px", verticalAlign: "top", borderBottom: "1px solid #d1d5db" }}>{index + 1}</td>
            <td style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", padding: "5px 6px", verticalAlign: "top", borderBottom: "1px solid #d1d5db", wordBreak: "break-word" }}>{row.itemcode || "-"}</td>
            <td style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", padding: "5px 8px", verticalAlign: "top", borderBottom: "1px solid #d1d5db", wordBreak: "break-word" }}>{row.itemName || "-"}</td>
            <td style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", padding: "5px 4px", verticalAlign: "top", borderBottom: "1px solid #d1d5db" }}>{row.unit || "-"}</td>
            <td style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", padding: "5px 4px", verticalAlign: "top", borderBottom: "1px solid #d1d5db" }}>{formatDocumentQuantity(row.qty)}</td>
            <td style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", padding: "5px 4px", verticalAlign: "top", borderBottom: "1px solid #d1d5db" }}>{formatDocumentCurrency(row.cost)}</td>
            <td style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", padding: "5px 4px", verticalAlign: "top", borderBottom: "1px solid #d1d5db" }}>{formatDocumentCurrency(row.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  type PurchaseOrderDraftItem = {
    id: string
    itemcode: string
    itemName: string
    unit: string
    qty: string
    newCost: string
  }

  type ReceiveDraftItem = {
    id: string
    itemcode: string
    itemName: string
    unit: string
    qty: string
    newCost: string
    lot: string
    dateExp: string
  }

  const createPurchaseOrderDraftItem = (overrides: Partial<PurchaseOrderDraftItem> = {}): PurchaseOrderDraftItem => ({
    id: overrides.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    itemcode: overrides.itemcode || "",
    itemName: overrides.itemName || "",
    unit: overrides.unit || "",
    qty: overrides.qty || "1",
    newCost: overrides.newCost || "0",
  })

  const createReceiveDraftItem = (overrides: Partial<ReceiveDraftItem> = {}): ReceiveDraftItem => ({
    id: overrides.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    itemcode: overrides.itemcode || "",
    itemName: overrides.itemName || "",
    unit: overrides.unit || "",
    qty: overrides.qty || "1",
    newCost: overrides.newCost || "0",
    lot: overrides.lot || "",
    dateExp: overrides.dateExp || "",
  })

  const getFollowUpDocumentActions = (sourceType: SalesDocumentType): FollowUpDocumentAction[] => {
    switch (sourceType) {
      case "qt":
        return [
          { targetType: "bl", label: "ใบวางบิล", icon: <FileText size={14} style={{ marginRight: 6 }} /> },
          { targetType: "inv", label: "ใบแจ้งหนี้", icon: <FileCheck size={14} style={{ marginRight: 6 }} /> },
          { targetType: "re", label: "ใบเสร็จรับเงิน", icon: <ReceiptIcon size={14} style={{ marginRight: 6 }} /> },
        ]
      case "bl":
        return [
          { targetType: "inv", label: "ใบแจ้งหนี้", icon: <FileCheck size={14} style={{ marginRight: 6 }} /> },
          { targetType: "re", label: "ใบเสร็จรับเงิน", icon: <ReceiptIcon size={14} style={{ marginRight: 6 }} /> },
          { targetType: "tax", label: "ใบกำกับภาษี", icon: <CreditCard size={14} style={{ marginRight: 6 }} /> },
        ]
      case "inv":
        return [
          { targetType: "re", label: "ใบเสร็จรับเงิน", icon: <ReceiptIcon size={14} style={{ marginRight: 6 }} /> },
          { targetType: "tax", label: "ใบกำกับภาษี", icon: <CreditCard size={14} style={{ marginRight: 6 }} /> },
        ]
      case "re":
        return [
          { targetType: "tax", label: "ใบกำกับภาษี", icon: <CreditCard size={14} style={{ marginRight: 6 }} /> },
        ]
      case "tax":
        return [
          { targetType: "debit", label: "ใบเพิ่มหนี้", icon: <Landmark size={14} style={{ marginRight: 6 }} /> },
        ]
      case "debit":
        return [
          { targetType: "credit", label: "ใบลดหนี้", icon: <Wallet size={14} style={{ marginRight: 6 }} /> },
        ]
      default:
        return []
    }
  }

  const toggleDocumentEditor = (docType: SalesDocumentType, isOpen: boolean) => {
    if (docType === "qt") setShowE(isOpen)
    else if (docType === "bl") setShowbe(isOpen)
    else if (docType === "inv") setShowie(isOpen)
    else if (docType === "re") setShowee(isOpen)
    else if (docType === "tax") setShowte(isOpen)
    else if (docType === "debit") setShowde(isOpen)
    else if (docType === "credit") setShowce(isOpen)
  }

  const refreshDocumentSequence = async (docType: SalesDocumentType) => {
    if (docType === "bl") await maxV()
    else if (docType === "inv") await maxV2()
    else if (docType === "re") await maxV3()
    else if (docType === "tax") await maxV4()
    else if (docType === "debit") await maxV5()
    else if (docType === "credit") await maxV6()
  }

  const createFollowUpDocument = async (sourceType: SalesDocumentType, targetType: SalesDocumentType) => {
    let docId = ids
    if (docId === 0) {
      const newId = await createNewDocMain(sourceType)
      if (!newId) return
      docId = newId
    }

    const orderNo = String(year) + String(month) + String(day)
    const existing = qt
      .filter((row: any) => row[`${targetType}_orderNo`] === orderNo)
      .map((row: any) => row[`${targetType}_number`])
    const maxNum = existing.length > 0 ? Math.max(...existing) : 99
    const nextNum = maxNum + 1
    const customerId = Number(allQT.id_costomer) || Number(idcus) || 0

    try {
      const currentTaxReference = String(
        allQT.tax_orderfull
        || buildDocumentOrderFull("tax", String(allQT.tax_orderNo || orderNo), Number(allQT.tax_number || 0))
      )
      const taxBaseAmount = Number(allQT.sumtotal || allQT.totalall || 0)
      const debitBaseAmount = roundDocumentCurrency(Number(allQT.debit_difference_amount || 0))
      const creditOriginalAmount = roundDocumentCurrency(taxBaseAmount)
      const creditDifferenceAmount = debitBaseAmount
      const creditCorrectAmount = roundDocumentCurrency(Math.max(creditOriginalAmount - creditDifferenceAmount, 0))
      const creditVatAmount = roundDocumentCurrency(debitBaseAmount > 0 ? (debitBaseAmount * CREDIT_NOTE_VAT_RATE) / 100 : 0)
      const currentCreditReference = String(allQT.debit_reference_no || currentTaxReference)
      const sourceSellerName = getResolvedDocumentSellerName(sourceType)
      const targetSellerName = getResolvedDocumentSellerName(targetType, sourceSellerName)

      await axios.put(`/api/${apiquatation}/${docId}`, {
        [`${sourceType}_status`]: "อนุมัติ",
        [`${targetType}_date`]: new Date(),
        [`${targetType}_enddate`]: new Date(),
        [`${targetType}_number`]: nextNum,
        [`${targetType}_orderNo`]: orderNo,
        [`${targetType}_orderfull`]: buildDocumentOrderFull(targetType, orderNo, nextNum),
        [`${targetType}_status`]: "รออนุมัติ",
        [`${targetType}_credit`]: 0,
        ...(targetType === "debit" ? {
          debit_person: allQT.tax_person || allQT.qt_person || "",
          debit_reference_no: currentTaxReference,
          debit_original_amount: taxBaseAmount,
          debit_correct_amount: taxBaseAmount,
          debit_difference_amount: 0,
          debit_vat_rate: DEBIT_NOTE_VAT_RATE,
          debit_vat_amount: 0,
          debit_grand_total: 0,
        } : {}),
        ...(targetType === "credit" ? {
          credit_person: allQT.debit_person || allQT.tax_person || allQT.qt_person || "",
          credit_reference_no: currentCreditReference,
          credit_reference_book_no: "",
          credit_items_json: [],
          credit_original_amount: creditOriginalAmount,
          credit_correct_amount: creditCorrectAmount,
          credit_difference_amount: creditDifferenceAmount,
          credit_reduce_amount: creditDifferenceAmount,
          credit_vat_rate: CREDIT_NOTE_VAT_RATE,
          credit_vat_amount: creditVatAmount,
          credit_net_total: roundDocumentCurrency(debitBaseAmount + creditVatAmount),
        } : {}),
        [`${targetType}_person`]: targetSellerName,
      })

      await Promise.all([
        fetchQT(),
        fetchQT_ID(docId),
        fetchQT_IDDetail(docId),
      ])

      toggleDocumentEditor(sourceType, false)
      setids(docId)
      setidcus(customerId)
      localStorage.setItem("iddoc", String(docId))
      await refreshDocumentSequence(targetType)
      toggleDocumentEditor(targetType, true)
    } catch (error) {
      console.error(error)
    }
  }

  const renderDocumentCreateDropdown = (sourceType: SalesDocumentType) => {
    const actions = getFollowUpDocumentActions(sourceType)
    if (actions.length === 0) return null

    return (
      <Dropdown className="d-inline">
        <Dropdown.Toggle
          size="sm"
          variant="outline-primary"
          style={{ fontSize: 13, fontFamily: "kanit", borderRadius: 8 }}
        >
          สร้างเอกสาร
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {actions.map((action) => (
            <Dropdown.Item
              key={action.targetType}
              onClick={() => { void createFollowUpDocument(sourceType, action.targetType) }}
              style={{ fontSize: 13, fontFamily: "kanit" }}
            >
              {action.icon}
              {action.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    )
  }

  const renderDocumentSignatureSection = () => (
    <div style={{ display: "grid", gridTemplateColumns: includeDocumentSignatureInfo ? "1fr 1fr" : "1fr", gap: 16, marginTop: 16 }}>
      {includeDocumentSignatureInfo ? (
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "20px", textAlign: "center" }}>
          <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#6b7280", marginBottom: 30 }}>ลงนาม</div>
          <div style={{ width: "60%", margin: "0 auto", borderBottom: "1px dashed #d1d5db" }}></div>
          <div style={{ fontFamily: "kanit", fontSize: 11, color: "#9ca3af", marginTop: 4 }}>ผู้สั่งซื้อสินค้า</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, color: "#d1d5db", marginTop: 2 }}>วันที่ ........./.........../..........</div>
        </div>
      ) : null}
      {renderCompanyElectronicSignatureCard("ผู้อนุมัติ")}
    </div>
  )

  const renderDocumentFooterActions = ({ taxControl, status, onChangeStatus, onSave, onClose, createControl, saveDisabled = false }: any) => (
    <>
      <div className="d-flex align-items-center" style={{ gap: 8 }}>
        {taxControl}
      </div>
      <div className="d-flex align-items-center" style={{ gap: 8 }}>
        {createControl}
        <Dropdown className="d-inline">
          <Dropdown.Toggle size="sm" variant={getDocumentStatusVariant(status)} style={{ fontSize: 13, fontFamily: "kanit", borderRadius: 8 }}>
            {status || "รออนุมัติ"}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => onChangeStatus("รออนุมัติ")} style={{ fontSize: 13, fontFamily: "kanit" }}>รออนุมัติ</Dropdown.Item>
            <Dropdown.Item onClick={() => onChangeStatus("อนุมัติ")} style={{ fontSize: 13, fontFamily: "kanit" }}>อนุมัติ</Dropdown.Item>
            <Dropdown.Item onClick={() => onChangeStatus("ยกเลิก")} style={{ fontSize: 13, fontFamily: "kanit" }}>ยกเลิก</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <button
          className="btn btn-success"
          style={{ padding: "6px 20px", fontSize: 13, fontFamily: "Kanit_B", borderRadius: 8, background: "linear-gradient(135deg, #2A6AAA, #3E86C7)", border: "none", boxShadow: "0 2px 6px rgba(62, 134, 199,0.3)", opacity: saveDisabled ? 0.65 : 1, cursor: saveDisabled ? "not-allowed" : "pointer" }}
          onClick={onSave}
          disabled={saveDisabled}
        >
          บันทึก
        </button>
        <button
          className="btn"
          style={{ padding: "6px 20px", fontSize: 13, fontFamily: "Kanit", borderRadius: 8, border: "1px solid #d1d5db", color: "#6b7280", backgroundColor: "white" }}
          onClick={onClose}
        >
          ปิด
        </button>
      </div>
    </>
  )

  const useModernSalesDocumentLayout = true

  /**************** Bill Max Value*********************** */
  const [maxS, setMax] = useState("")
  let maxRecN1 = Number(maxS) == -Infinity ? 100 : Number(maxS) + 1
  const maxV = async () => {
    let result = qt.filter((a: any) => a.bl_orderNo === String(year) + String(month) + String(day)).map((pp: any) => (pp.bl_number))
    console.log(result)

    let maxValue = Math.max.apply(null, result)
    setMax(String(maxValue))
    //setatalist({...alldatalist,qt_number:String(maxValue)})
    console.log(maxValue)
  }

  /**************** Invoice Max Value*********************** */
  const [maxS2, setMax2] = useState("")
  let maxRecN2 = Number(maxS2) == -Infinity ? 100 : Number(maxS2) + 1
  const maxV2 = async () => {
    let result2 = qt.filter((a: any) => a.inv_orderNo === String(year) + String(month) + String(day)).map((pp: any) => (pp.inv_number))
    console.log(result2)

    let maxValue2 = Math.max.apply(null, result2)
    setMax2(String(maxValue2))
    //setatalist({...alldatalist,qt_number:String(maxValue)})
    console.log(maxValue2)
  }

  /**************** Receipt Max Value*********************** */
  const [maxS3, setMax3] = useState("")
  let maxRecN3 = Number(maxS3) == -Infinity ? 100 : Number(maxS3) + 1
  const maxV3 = async () => {
    let result3 = qt.filter((a: any) => a.re_orderNo === String(year) + String(month) + String(day)).map((pp: any) => (pp.re_number))
    console.log(result3)

    let maxValue3 = Math.max.apply(null, result3)
    setMax3(String(maxValue3))
    //setatalist({...alldatalist,qt_number:String(maxValue)})
    console.log(maxValue3)
  }


  /**************** Tax Max Value*********************** */
  const [maxS4, setMax4] = useState("")
  let maxRecN4 = Number(maxS4) == -Infinity ? 100 : Number(maxS4) + 1
  const maxV4 = async () => {
    let result4 = qt.filter((a: any) => a.tax_orderNo === String(year) + String(month) + String(day)).map((pp: any) => (pp.tax_number))
    console.log(result4)

    let maxValue4 = Math.max.apply(null, result4)
    setMax4(String(maxValue4))
    //setatalist({...alldatalist,qt_number:String(maxValue)})
    console.log(maxValue4)
  }

  /**************** Debit Note Max Value*********************** */
  const [maxS5, setMax5] = useState("")
  let maxRecN5 = Number(maxS5) == -Infinity ? 100 : Number(maxS5) + 1
  const maxV5 = async () => {
    let result5 = qt.filter((a: any) => a.debit_orderNo === String(year) + String(month) + String(day)).map((pp: any) => (pp.debit_number))
    console.log(result5)

    let maxValue5 = Math.max.apply(null, result5)
    setMax5(String(maxValue5))
    console.log(maxValue5)
  }

  /**************** Credit Note Max Value*********************** */
  const [maxS6, setMax6] = useState("")
  let maxRecN6 = Number(maxS6) == -Infinity ? 100 : Number(maxS6) + 1
  const maxV6 = async () => {
    let result6 = qt.filter((a: any) => a.credit_orderNo === String(year) + String(month) + String(day)).map((pp: any) => (pp.credit_number))
    console.log(result6)

    let maxValue6 = Math.max.apply(null, result6)
    setMax6(String(maxValue6))
    console.log(maxValue6)
  }
  /*****************ข้อมูล Api รับสินค้า ************** */
  const [rcmain, setrcmain] = useState([])
  const [ordermain, setordermain] = useState([])
  const [orderItem, setorderItem] = useState([])
  const [selectedOrderReport, setSelectedOrderReport] = useState<any | null>(null)

  useEffect(() => {
    GetMainRC()
    GetMainOrder()
  }, [])

  const GetMainRC = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apireceive}?company=${companyS}`)

      setrcmain(res.data)


    } catch (error) {
      console.error(error)
    }
  }

  const GetMainOrder = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/order?company=${companyS}`)
      setordermain(res.data)
    } catch (error) {
      console.error(error)
    }
  }




  //*****************   ใบเสนอราคา  ***************************/
  const Quatation = () => {

    //******** */ input Preview *********************
    function QuotationTemplate() {

      let taxNum = allQT.taxnumber

      //Print Label
      const contentRef = useRef<HTMLDivElement>(null);
      const reactToPrintFn2 = useReactToPrint({
        contentRef,
        documentTitle: allQT.qt_orderfull || `QT${allQT.qt_orderNo || ""}${allQT.qt_number || ""}`,
        pageStyle: PROFESSIONAL_DOCUMENT_PRINT_PAGE_STYLE,
      });



      return (


        <>

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
                <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>ใบเสนอราคา</div>
              </Modal_qa.Title>
            </Modal_qa.Header>
            <Modal_qa.Body style={{ backgroundColor: "grey" }}>

              <div className="document-print-sheet" style={PROFESSIONAL_DOCUMENT_PRINT_SHEET_STYLE} ref={contentRef} >
                {renderSalesPrintDocument({
                  docType: "qt",
                  title: "ใบเสนอราคา",
                  englishTitle: "QUOTATION",
                  dateValue: allQT.qt_date,
                  endDateValue: allQT.qt_enddate,
                  creditValue: allQT.qt_credit,
                  personName: allQT.qt_person,
                  remark: allQT.qt_remark,
                  taxNum,
                  status: allQT.qt_status,
                  customerRoleLabel: "ผู้สั่งซื้อสินค้า",
                  companyRoleLabel: "ผู้อนุมัติ",
                })}
                <div style={{ display: "none" }} aria-hidden="true">


                <div className="row" style={{ height: 24 }}></div>
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
                    <div className="row " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{all.names}</div>
                    <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{all.address}</div>
                    <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{all.numbertax}</div>
                    <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {all.tel}</div>

                  </div>

                  {/**ใบเสนราคา */}
                  <div className="col ">
                    <div className="row "
                      style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 20, justifySelf: "center" }}>
                      ใบเสนอราคา
                    </div>
                    <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                    <div className="row">
                      <div className="col-4 ">
                        <div style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เลขที่ :</div>
                        <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ :</div>
                        <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เครดิต :</div>
                        <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ครบกำหนด :</div>
                        <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>ผู้ขาย :</div>
                      </div>

                      <div className="col ">
                        <div className="col " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>QT{allQT.qt_orderNo}{allQT.qt_number}</div>
                        <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{new Date(allQT.qt_date).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })} </div>
                        <div className="mt-1 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{allQT.qt_credit}</div>
                        <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{new Date(allQT.qt_enddate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })} </div>
                        <div className="mt-1 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{allQT.qt_person}</div>
                      </div>
                    </div>
                    <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                  </div>
                </div>

                <div className="row mt-3" style={{ marginLeft: 20, marginRight: 20 }}>
                  {renderProfessionalPrintItemsTable(qt_detail)}


                  {/**ท้ายบิล Slip */}
                  <div className="container document-print-footer-block">
                    <div className="row mt-2">
                      <div className="col ">
                        <div className="row mb-3 " style={{ fontFamily: "kanit", fontSize: 11, justifySelf: "left", marginLeft: 3 }}>ทั้งหมด : {qt_detail.length} รายการ  </div>
                        <InputGroup>
                          <InputGroup.Text style={{ textAlign: "left", fontFamily: "Kanit", fontSize: 11, height: 60, borderColor: "black", backgroundColor: "white" }}>หมายเหตุ</InputGroup.Text>
                          <Form.Control
                            style={{ fontFamily: "Kanit", fontSize: 12, backgroundColor: "white", borderColor: "black" }}
                            disabled={true}
                            as="textarea"
                            aria-label="With textarea"
                            value={allQT.qt_remark ?? ""}


                          />

                        </InputGroup>

                      </div>

                      <div className="col ">
                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>รวมเงิน :</div>
                          <div className=" bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20, }}>{allQT.sumtotal}</div>
                          <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ส่วนลดท้ายบิล :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{allQT.discount}</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ใช้แต้มส่วนลด :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{allQT.usereward}</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        {String(taxNum) === "" ? "" :
                          <div>
                            <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>จำนวนเงินรวมทั้งสิ้น :</div>
                              <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{allQT.totalall} </div>
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                            </div>
                            <div className="row" style={{ justifySelf: "right", width: "70%", height: 1, backgroundColor: "black" }}></div>
                            <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>หักภาษี ณ ที่จ่าย {allQT.taxnumber} % :</div>
                              <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{((Number(allQT.totalall) * Number(allQT.taxnumber)) / 100).toFixed(1)}
                              </div>
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                            </div>
                          </div>
                        }

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 30 }}>ยอดชำระทั้งหมด :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 30 }}>{
                            (((Number(allQT.totalall) * Number(allQT.taxnumber)) / 100) + Number(allQT.totalall)).toFixed(1)
                          }</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 30 }}>บาท</div>
                        </div>
                        <div className="row" style={{ justifySelf: "right", width: "70%", height: 1, backgroundColor: "black" }}></div>
                      </div>

                    </div>
                    <div className="h-5"></div>
                  </div>

                  {renderSalesDocumentPrintSignatureSection({
                    status: allQT.qt_status,
                    customerRoleLabel: "ผู้สั่งซื้อสินค้า",
                    companyRoleLabel: "ผู้อนุมัติ",
                    signerName: allQT.qt_person,
                    dateValue: allQT.qt_date,
                  })}

                </div>

                </div>



              </div>




            </Modal_qa.Body>
            <Modal_qa.Footer>

              <button
                className="btn btn-primary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={reactToPrintFn2}>
                Print
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

    //******* */ input Edit ************************


    function QuotationTemplate_Edit() {

      let taxNum = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
        String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
          String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""

      //****** */ input Radio Tax *************
      const [selectedOptiontax, setSelectedOptiontax] = useState('notax');

      //******* เปลี่ยน Tax ภาษี ******************
      const Radio_tax = () => {

        useEffect(() => {
          setSelectedOptiontax(localStorage.getItem("numbertax_S") || "")
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

      //********* เปลี่ยนส่วนลดท้ายบิล ****************         
      const Discount_s = () => {

        const [discountS, setdiscountS] = useState('0')

        useEffect(() => {
          setdiscountS(localStorage.getItem("discount_s") || "")

        }, [Number(discountS)]);


        const [show2, setShow2] = useState(false);

        // Update Quatation
        const EditQuatation = async () => {

          const totalall = Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0))
          const discount = Number(discountS)
          const sumtotal = Number(Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(discountS) - Number(parseInt(allQT.usereward)))

          const usereward = Number(allQT.usereward)
          const taxnumber = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
            String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
              String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""
          const personall = allQT.person
          const statussall = allQT.statuss
          const qt_status = allQT.qt_status
          const qt_person = allQT.qt_person
          const qt_remark = allQT.qt_remark

          try {
            //  localStorage.setItem("show","1")
            //  Save Sale
            await axios.put(`/api/${apiquatation}/${Number(localStorage.getItem("iddoc") || "")}`,
              {

                totalall, discount, sumtotal, usereward, personall, statussall, taxnumber


              })
            await fetchQT_ID()

          } catch (error) {
            console.error(error)
          }
        }
        return (


          <>

            <button
              type="button"
              className="btn btn-outline-success "
              style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", height: 27, width: 40 }}
              onClick={() => { setShow2(true), localStorage.setItem("discount_s", "0") }}
            >
              {Number(allQT.discount)}
            </button>

            <Modal_dc
              show={show2}
              onHide={() => setShow2(false)}
              className="document-modal detail-editor-modal"
              dialogClassName="document-modal-dialog modal-90w"
              backdropClassName="document-modal-backdrop detail-editor-modal-backdrop"
              animation={false}
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

                <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit_B", marginTop: 10, textAlign: "left", height: 35 }}>
                  ส่วนลดรวม : &nbsp;&nbsp;{Number(discountS)}&nbsp;&nbsp; บาท  </div>

              </Modal_dc.Body>
              <Modal_dc.Footer>
                <button
                  className="btn btn-success"

                  style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                  onClick={() => {
                    setShow2(false),
                      setQT({ ...allQT, discount: discountS }),
                      setdiscountS(localStorage.getItem("discount_s") || "")
                    EditQuatation()
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

      const modale = useDisclosure()
      const [priceAct, setEditedpriceAct] = useState<string>("");
      const [priceDis, setEditedpriceDis] = useState<string>("");
      const [editedcode, setEditedcode] = useState<string>("");
      const [editedTaskname, setEditedname] = useState<string>("");
      const [editqty, setEditedqty] = useState<string>("");
      const [editqtyCh, setEditedqtyCh] = useState<string>("");
      const [editid, setid] = useState<number>(0);
      const [editiddoc, setiddoc] = useState<number>(0);

      const [showD, setShowD] = useState(false);
      const [showqty, setShowqty] = useState(false);

      const [remarkQ, setremarkQ] = useState(allQT.qt_remark || "")
      useEffect(() => { setremarkQ(allQT.qt_remark || "") }, [allQT.qt_remark])

      const [st, setst] = useState("")
      /***************************************** */


      let date1 = new Date(startDate);
      let date2 = new Date(startDate1);

      // Convert dates to UTC timestamps
      let utc1 =
        Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
      let utc2 =
        Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

      // Calculate the time difference in milliseconds
      const timeDiff = Math.abs(utc2 - utc1);

      // Convert milliseconds to days
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));





      // Update Quatation
      const EditQuatation = async () => {

        const totalall = Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0))
        const discount = Number(allQT.discount)
        const sumtotal = Number(Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(allQT.discount) - Number(parseInt(allQT.usereward)))

        const usereward = Number(allQT.usereward)
        const taxnumber = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
          String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
            String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""
        const personall = allQT.person
        const statussall = allQT.statuss
        const qt_date = new Date(startDate)
        const qt_enddate = new Date(startDate1)
        const qt_credit = Number(daysDiff)
        const qt_status = localStorage.getItem("st") || ""
        const qt_person = allQT.qt_person
        const qt_remark = remarkQ


        try {
          //   localStorage.setItem("show","1")
          //Save Sale
          await axios.put(`/api/${apiquatation}/${Number(localStorage.getItem("iddoc") || "")}`,
            {

              totalall, discount, sumtotal, usereward, personall, statussall, taxnumber, qt_status, qt_person, qt_remark
              , qt_date, qt_enddate, qt_credit

            })
          await fetchQT_ID()

        } catch (error) {
          console.error(error)
        }
      }

      // Update Quatation_Detail
      const EditQuatation_Detail = async () => {

        const qty = Number(editqtyCh)
        const price = Number(priceAct)
        const discount = Number(priceDis)
        const total = Number(Number(editqtyCh) * (Number(priceAct) - Number(priceDis)))
        const person = ""


        try {
          await axios.put(`/api/${apiquatation_detail}/${Number(editid)}`,
            {

              qty, price, discount, total, person


            })

          await fetchQT_IDDetail()
          await setTimeout(() => {
            EditQuatation()

          }, 1000);

        } catch (error) {
          console.error(error)
        }
      }


      //******** */ Search สินค้า*****************/
      function Search_Product() {

        //*******Show Modal **********************************/
        const [show1, setShow1] = useState(false);
        const handleClose = () => setShow1(false);
        const handleShow = () => setShow1(true);
        const handleClose1 = () => { Post_Quatation_Detail(), setShow1(false) };
        //******* */  Key ค้นหา สินค้า  ************************/
        const [data, setData] = useState(dataProduct);
        const [search, setsearch] = useState("")

        const handleChange = (value: any) => {
          setsearch(value);
          filterDataProduct(value);
        };

        // filter records by Productname
        const filterDataProduct = (value: any) => {
          const lowercasedValue = String(value || "").toLowerCase().trim();
          if (lowercasedValue === "") setData(dataProduct);
          else {
            const filteredData = dataProduct.filter((user: any) =>
              String(user?.ProductName || "").toLowerCase().includes(lowercasedValue)
              || String(user?.code || "").toLowerCase().includes(lowercasedValue)
              || String(user?.Barcode || "").toLowerCase().includes(lowercasedValue)
            );
            setData(filteredData);
          }
        };

        //***************************************************************** */
        const [idP, setidP] = useState("")
        const [code, setcode] = useState("")
        const [product, setProduct] = useState("")
        const [priceS, setprice] = useState("")
        const [unitS, setunit] = useState("")
        const [qtyP, setqtyP] = useState("1")

        // Update Quatation_Detail
        const Post_Quatation_Detail = async () => {
          let currentIds = ids
          if (!currentIds || currentIds === 0) {
            const newId = await createNewDocMain("qt")
            if (!newId) return
            currentIds = newId
          }
          const company = String(localStorage.getItem("company_") || "")
          const id_product = Number(idP)
          const code_product = code
          const name_product = product
          const unit = unitS
          const qty = Number(qtyP)
          const price = Number(priceS)
          const total = Number(qtyP) * Number(priceS)
          const person = ""
          const id_docmain = Number(currentIds)


          try {
            await axios.post(`/api/${apiquatation_detail}`,
              {
                unit, qty, price, total, person, company, id_product, code_product, name_product, id_docmain

              })

            await fetchQT_IDDetail(currentIds)


          } catch (error) {
            console.error(error)
          }
        }



        return (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleShow(); }}
              style={{
                fontFamily: "Kanit", fontSize: 13, padding: "6px 16px", borderRadius: 8,
                border: "1.5px solid #2A6AAA", backgroundColor: "#F3F8FC", color: "#2A6AAA",
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                transition: "all 0.15s", whiteSpace: "nowrap", fontWeight: 600,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#E5EEF8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#F3F8FC"; }}
            >
              + เพิ่มสินค้า
            </button>

            <Modal1
              show={show1}
              onHide={handleClose}
              className="document-modal product-picker-modal"
              dialogClassName="document-modal-dialog"
              backdropClassName="document-modal-backdrop product-picker-modal-backdrop"
              animation={false}
            >
              <Modal1.Header closeButton>
                <Modal1.Title
                  style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, height: 20 }}>
                  ค้นหาชื่อ, รหัส, Barcode สินค้า
                </Modal1.Title>
              </Modal1.Header>
              <Modal1.Body>
                <div>
                  <div className={styles.bodydetailTable_Re} style={{ width: "4vw" }}>ค้นหา</div>
                  <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                    <input
                      value={search}
                      onChange={(e) => handleChange(e.target.value)}
                      className="form-control form-control-sm"
                      placeholder="ค้นหาชื่อ, รหัส, Barcode สินค้า"
                      style={{ fontFamily: "Kanit", fontSize: 10, height: 12 }} />
                  </div>

                  <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
                    <table className="table table-sm table-hover"   >
                      <thead style={{ position: "sticky", top: "0" }}>
                        <tr>
                          <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "4vw" }}>
                            <div style={{ width: "4vw" }}>รหัสสินค้า</div>

                          </th>
                          <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "15vw" }}>
                            <div style={{ width: "15vw" }}>ชื่อสินค้า</div>

                          </th>
                          <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "7vw" }}>
                            <div style={{ width: "7vw" }}>barcode</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="table-group-divider " >
                        {data.map((post: any) => (
                          <tr key={post.id}
                            onClick={() => {
                              setidP(post.id),
                                setcode(post.code),
                                setProduct(post.ProductName),
                                setprice(post.price),
                                setunit(post.Unit)

                            }}>
                            <td className={styles.bodydetailTable_Re1} style={{ width: "4vw" }}>{post.code}</td>
                            <td className={styles.bodydetailTable_Re1} style={{ width: "15vw" }}>{post.ProductName}</td>
                            <td className={styles.bodydetailTable_Re1} style={{ width: "7vw" }}>{post.Barcode}</td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
                <div className='row'>
                  <div className='d-flex mt-1'>
                    <div style={{ fontFamily: "Kanit_B", textAlign: "left", fontSize: 15 }}>{code}</div>
                    <div style={{ fontFamily: "Kanit_B", textAlign: "left", fontSize: 15, marginLeft: 10 }}>{product}</div>
                  </div>
                  <div className='d-flex mt-2'>
                    <div style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, marginLeft: 10, marginTop: 10 }}>ราคา :&nbsp;&nbsp; {priceS}&nbsp;&nbsp; บาท&nbsp;&nbsp;&nbsp; จำนวน</div>
                    <input
                      className="form-control form-control-sm "

                      style={{ width: 50, marginLeft: 10, marginRight: 10, height: 20, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                      value={qtyP}
                      onChange={(e) => setqtyP(e.target.value)} />
                    <div style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, marginLeft: 10, marginTop: 10 }}>{unitS}&nbsp;&nbsp;ราคารวม : &nbsp;&nbsp;{Number(qtyP) * Number(priceS)}&nbsp;&nbsp; บาท</div>
                  </div>


                </div>

              </Modal1.Body>
              <Modal1.Footer >

                <Button1
                  variant="secondary"
                  onClick={handleClose}
                  style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}
                >
                  ปิด
                </Button1>
                <Button1
                  variant="primary"
                  onClick={handleClose1}
                  style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}
                >
                  เพิ่ม
                </Button1>
              </Modal1.Footer>
            </Modal1>
          </>
        );
      }

      const qtNumberDisplay = `QT${allQT.qt_orderNo}${allQT.qt_number}`

      const openQuantityEditor = (detail: any) => {
        setShowqty(true)
        setEditedpriceDis(String(detail.discount || "0"))
        setEditedpriceAct(String(detail.price || "0"))
        setEditedqty(String(detail.qty || "0"))
        setEditedqtyCh(String(detail.qty || "0"))
        setEditedcode(String(detail.code_product || ""))
        setEditedname(String(detail.name_product || ""))
        setid(Number(detail.id || 0))
        setiddoc(Number(detail.id_docmain || 0))
        localStorage.setItem("idd", String(detail.id_docmain || 0))
      }

      const openDiscountEditor = (detail: any) => {
        setShowD(true)
        setEditedpriceDis(String(detail.discount || "0"))
        setEditedpriceAct(String(detail.price || "0"))
        setEditedqty(String(detail.qty || "0"))
        setEditedqtyCh(String(detail.qty || "0"))
        setEditedcode(String(detail.code_product || ""))
        setEditedname(String(detail.name_product || ""))
        setid(Number(detail.id || 0))
        setiddoc(Number(detail.id_docmain || 0))
        localStorage.setItem("idd", String(detail.id_docmain || 0))
      }

      return (


        <>

          <Modal_qa
            show={showE}
            onHide={() => setShowE(false)}
            size="xl"
            scrollable={true}
            className="document-modal"
            dialogClassName="document-modal-dialog"
            backdropClassName="document-modal-backdrop"
            animation={false}
            enforceFocus={false}
            aria-labelledby="example-custom-modal-styling-title"
          >
            <Modal_qa.Header closeButton style={{ borderBottom: "1px solid #e5e7eb", padding: "16px 24px", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" }}>
              <Modal_qa.Title id="example-custom-modal-styling-title" style={{ width: "100%" }}>
                {renderDocumentModalTitle({
                  title: "ใบเสนอราคา",
                  docDisplay: qtNumberDisplay,
                  status: allQT.qt_status,
                  icon: <FileText size={18} color="white" />,
                  iconBackground: "linear-gradient(135deg, #2A6AAA, #3E86C7)",
                })}
              </Modal_qa.Title>
            </Modal_qa.Header>

            {renderDocumentWorkflowStepper("QT")}

            <Modal_qa.Body style={{ backgroundColor: "#f8fafc", padding: "20px 24px" }}>
              {renderDocumentInfoGrid({
                docType: "qt",
                docDisplay: qtNumberDisplay,
                startDate,
                setStartDate,
                startDate1,
                setStartDate1,
                creditDays: daysDiff,
                personDisplay: allQT.qt_person,
                detailIcon: <FileText size={14} color="#2A6AAA" />,
              })}
              {renderDocumentItemsSection({
                searchProductControl: renderProductSearchControl("qt"),
                onEditQuantity: openQuantityEditor,
                onEditDiscount: openDiscountEditor,
                onDeleteItem: DeleteQT_ID,
                showqty,
                setShowqty,
                showD,
                setShowD,
                priceAct,
                setEditedpriceAct,
                priceDis,
                setEditedpriceDis,
                editedcode,
                editedTaskname,
                editqty,
                editqtyCh,
                setEditedqtyCh,
                onApplyDetailEdit: EditQuatation_Detail,
              })}
              {renderDocumentSummarySection({
                remarkQ,
                setremarkQ,
                discountControl: <Discount_s />,
                taxNum,
                attachmentDocType: "qt",
              })}
              {renderDocumentSignatureSection()}

            </Modal_qa.Body>
            <Modal_qa.Footer style={{ borderTop: "1px solid #e5e7eb", padding: "12px 24px", background: "#fafbfc", justifyContent: "space-between" }}>
              <div className="d-flex align-items-center" style={{ gap: 8 }}>
                {/**ปรับ%ภาษี */}
                <Radio_tax />
              </div>
              <div className="d-flex align-items-center" style={{ gap: 8 }}>
                {/**สร้างเอกสารต่อเนื่อง */}
                {renderDocumentCreateDropdown("qt")}
                {/**การอนุมัติ */}
                <Dropdown className="d-inline">
                  <Dropdown.Toggle
                    id="dropdown-autoclose-true"
                    size="sm"
                    variant={
                      allQT.qt_status === "อนุมัติ" ? "success" :
                        allQT.qt_status === "รออนุมัติ" ? "warning" :
                          allQT.qt_status === "ยกเลิก" ? "danger" : "primary"
                    }
                    style={{ fontSize: 13, fontFamily: "kanit", borderRadius: 8 }}>
                    {allQT.qt_status}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item href="#"
                      onClick={() => { localStorage.setItem("st", "รออนุมัติ"), setst("รออนุมัติ"), setTimeout(() => { EditQuatation() }, 500) }}
                      style={{ fontSize: 13, fontFamily: "kanit" }}>รออนุมัติ</Dropdown.Item>
                    <Dropdown.Item href="#"
                      onClick={() => { localStorage.setItem("st", "อนุมัติ"), setst("อนุมัติ"), setTimeout(() => { EditQuatation() }, 500) }}
                      style={{ fontSize: 13, fontFamily: "kanit" }}>อนุมัติ</Dropdown.Item>
                    <Dropdown.Item href="#"
                      onClick={() => { localStorage.setItem("st", "ยกเลิก"), setst("ยกเลิก"), setTimeout(() => { EditQuatation() }, 500) }}
                      style={{ fontSize: 13, fontFamily: "kanit" }}>ยกเลิก</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                <button
                  className="btn btn-success"
                  style={{
                    padding: "6px 20px", fontSize: 13, fontFamily: "Kanit_B", borderRadius: 8,
                    background: "linear-gradient(135deg, #2A6AAA, #3E86C7)", border: "none",
                    boxShadow: "0 2px 6px rgba(62, 134, 199,0.3)",
                  }}
                  onClick={async () => {
                    if (ids === 0) {
                      const newId = await createNewDocMain("qt")
                      if (!newId) return
                    }
                    EditQuatation()
                    setShowE(false)
                    fetchQT()
                  }}
                >
                  บันทึก
                </button>
                <button
                  className="btn"
                  style={{
                    padding: "6px 20px", fontSize: 13, fontFamily: "Kanit", borderRadius: 8,
                    border: "1px solid #d1d5db", color: "#6b7280", backgroundColor: "white",
                  }}
                  onClick={() => setShowE(false)}>
                  ปิด
                </button>
              </div>
            </Modal_qa.Footer>
          </Modal_qa>

        </>

      )
    }





    return (

      <>
        <div className="col">
          <div className='d-flex align-items-center justify-content-between mb-1 mt-1' style={{ gap: 12 }}>
            <div style={{ fontFamily: "kanit_B", fontSize: 18, color: "#1f2937" }}>ใบเสนอราคา</div>
            <button
              type="button"
              onClick={() => openCreateDocumentDraft("first")}
              style={{
                padding: "6px 16px", borderRadius: 8, border: "1.5px solid #2A6AAA",
                backgroundColor: "#F3F8FC", color: "#2A6AAA", fontSize: 13,
                fontFamily: "kanit_B", cursor: "pointer", display: "inline-flex",
                alignItems: "center", gap: 6, whiteSpace: "nowrap",
              }}
            >
              <Plus size={14} /> สร้างเอกสาร
            </button>
          </div>

          <table className="table table-hover" style={{ borderCollapse: "separate", borderSpacing: "0" }}>
            <thead >
              <tr >
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>วันที่สร้าง</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>เลขที่เอกสาร</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>ชื่อลูกค้า/ชื่อโปรเจค</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>ยอดรวมสุทธิ</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>สถานะ</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", width: 156, textAlign: "center" }}></td>

              </tr>
            </thead>
            <tbody >
              {filterBySearch(filterByStatus(qt.filter((f: any) => f.qt_status === "รออนุมัติ" || f.qt_status === "อนุมัติ" || f.qt_status === "ยกเลิก"), "qt"), "qt").sort((a: any, b: any) => a.createDate.localeCompare(b.createDate)).map((a: any) =>
                <tr key={a.id} onClick={() => setSelectedDocRow(a)} style={{ cursor: "pointer", backgroundColor: selectedDocRow?.id === a.id ? "#F3F8FC" : undefined }} >
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40 }}>
                    {new Date(a.qt_date).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}&nbsp;&nbsp;
                    {new Date(a.qt_date).toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric" })}&nbsp;น.

                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40 }}>QT{a.qt_orderNo}{a.qt_number}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40 }}>{a.name_costomer}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>{(Number(a.totalall) + ((Number(a.totalall) * Number(a.taxnumber)) / 100)).toFixed(1)}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>

                    <span style={{
                      fontFamily: "kanit", fontSize: 11, padding: "3px 12px", borderRadius: 20,
                      backgroundColor: a.qt_status === "อนุมัติ" ? "#D3F0E2" : a.qt_status === "รออนุมัติ" ? "#fef3c7" : a.qt_status === "ยกเลิก" ? "#fee2e2" : "#e0e7ff",
                      color: a.qt_status === "อนุมัติ" ? "#0C5238" : a.qt_status === "รออนุมัติ" ? "#92400e" : a.qt_status === "ยกเลิก" ? "#991b1b" : "#3730a3",
                      fontWeight: 600,
                    }}>{a.qt_status}</span>

                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, textAlign: "center", height: 45 }} className='d-flex'>
                    <button
                      onClick={() => { setids(a.id), setidcus(a.id_costomer), localStorage.setItem("iddoc", a.id), setShowE(true) }}
                      style={{ fontSize: 11, height: 28, marginLeft: 5, padding: "0 12px", borderRadius: 8, border: "1px solid #d97706", backgroundColor: "white", color: "#d97706", fontFamily: "kanit", cursor: "pointer", transition: "all 0.2s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f59e0b"; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(245,158,11,0.3)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = "#d97706"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}>
                      แก้ไข
                    </button>

                    <button
                      onClick={() => { setids(a.id), setidcus(a.id_costomer), setShowW(true) }}
                      style={{ fontSize: 11, height: 28, marginLeft: 5, padding: "0 12px", borderRadius: 8, border: "1px solid #2A6AAA", backgroundColor: "white", color: "#2A6AAA", fontFamily: "kanit", cursor: "pointer", transition: "all 0.2s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#2A6AAA"; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(42, 106, 170,0.3)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = "#2A6AAA"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}>
                      ข้อมูล
                    </button>
                    {renderRowDocumentAttachmentButton("qt", Number(a.id))}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <QuotationTemplate_Edit />
          <QuotationTemplate />
        </div>

      </>

    )
  }

  //*****************   ใบวางบิล  ***************************/
  const Bill = () => {

    //******** */ input Preview *********************
    function BillTemplate() {

      let taxNum = allQT.taxnumber

      //Print Label
      const contentRef = useRef<HTMLDivElement>(null);
      const reactToPrintFn2 = useReactToPrint({
        contentRef,
        documentTitle: allQT.bl_orderfull || `BL${allQT.bl_orderNo || ""}${allQT.bl_number || ""}`,
        pageStyle: PROFESSIONAL_DOCUMENT_PRINT_PAGE_STYLE,
      });



      return (


        <>

          <Modal_blv
            show={showbv}
            onHide={() => setShowbv(false)}
            size="lg"
            scrollable={true}
            //  fullscreen={true}
            //  dialogClassName="80w"
            aria-labelledby="example-custom-modal-styling-title"
          >
            <Modal_blv.Header closeButton>
              <Modal_blv.Title id="example-custom-modal-styling-title">
                <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>ใบวางบิล</div>
              </Modal_blv.Title>
            </Modal_blv.Header>
            <Modal_blv.Body style={{ backgroundColor: "grey" }}>

              <div
                className="document-print-sheet"
                style={PROFESSIONAL_DOCUMENT_PRINT_SHEET_STYLE}
                ref={contentRef}
              >
                {renderSalesPrintDocument({
                  docType: "bl",
                  title: "ใบวางบิล",
                  englishTitle: "BILLING NOTE",
                  dateValue: allQT.bl_date,
                  endDateValue: allQT.bl_enddate,
                  creditValue: allQT.bl_credit,
                  personName: allQT.bl_person || allQT.qt_person,
                  remark: allQT.bl_remark,
                  taxNum,
                  status: allQT.bl_status,
                  customerRoleLabel: "ผู้รับวางบิล",
                  companyRoleLabel: "ผู้อนุมัติ",
                })}
                <div style={{ display: "none" }} aria-hidden="true">


                <div className="row" style={{ height: 24 }}></div>
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
                    <div className="row " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{all.names}</div>
                    <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{all.address}</div>
                    <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{all.numbertax}</div>
                    <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {all.tel}</div>

                  </div>

                  {/**ใบเสนราคา */}
                  <div className="col ">
                    <div className="row "
                      style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 20, justifySelf: "center" }}>
                      ใบวางบิล
                    </div>
                    <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                    <div className="row">
                      <div className="col-4 ">
                        <div style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เลขที่ :</div>
                        <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ :</div>
                        <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เครดิต :</div>
                        <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ครบกำหนด :</div>
                        <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>ผู้ขาย :</div>
                      </div>

                      <div className="col ">
                        <div className="col " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>BL{allQT.bl_orderNo}{allQT.bl_number}</div>
                        <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>
                          {allQT.bl_date === null ? "." : <div>{new Date(allQT.bl_date).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}</div>} </div>
                        <div className="mt-1 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{allQT.bl_credit}</div>
                        <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>
                          {allQT.bl_date === null ? "." : <div>{new Date(allQT.bl_enddate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}</div>}  </div>
                        <div className="mt-1 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{allQT.bl_person}</div>
                      </div>
                    </div>
                    <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                  </div>
                </div>

                <div className="row mt-3" style={{ marginLeft: 20, marginRight: 20 }}>
                  {renderProfessionalPrintItemsTable(qt_detail)}


                  {/**ท้ายบิล Slip */}
                  <div className="container document-print-footer-block">
                    <div className="row mt-2">
                      <div className="col ">
                        <div className="row mb-3 " style={{ fontFamily: "kanit", fontSize: 11, justifySelf: "left", marginLeft: 3 }}>ทั้งหมด : {qt_detail.length} รายการ  </div>
                        <InputGroup>
                          <InputGroup.Text style={{ textAlign: "left", fontFamily: "Kanit", fontSize: 11, height: 60, borderColor: "black", backgroundColor: "white" }}>หมายเหตุ</InputGroup.Text>
                          <Form.Control
                            style={{ fontFamily: "Kanit", fontSize: 12, backgroundColor: "white", borderColor: "black" }}
                            disabled={true}
                            as="textarea"
                            aria-label="With textarea"
                            value={allQT.bl_remark ?? ""}


                          />

                        </InputGroup>

                      </div>

                      <div className="col ">
                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>รวมเงิน :</div>
                          <div className=" bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20, }}>{allQT.sumtotal}</div>
                          <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ส่วนลดท้ายบิล :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{allQT.discount}</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ใช้แต้มส่วนลด :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{allQT.usereward}</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        {String(taxNum) === "" ? "" :
                          <div>
                            <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>จำนวนเงินรวมทั้งสิ้น :</div>
                              <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{allQT.totalall} </div>
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                            </div>
                            <div className="row" style={{ justifySelf: "right", width: "70%", height: 1, backgroundColor: "black" }}></div>
                            <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>หักภาษี ณ ที่จ่าย {allQT.taxnumber} % :</div>
                              <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{((Number(allQT.totalall) * Number(allQT.taxnumber)) / 100).toFixed(1)}
                              </div>
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                            </div>
                          </div>
                        }

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 30 }}>ยอดชำระทั้งหมด :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 30 }}>{
                            (((Number(allQT.totalall) * Number(allQT.taxnumber)) / 100) + Number(allQT.totalall)).toFixed(1)
                          }</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 30 }}>บาท</div>
                        </div>
                        <div className="row" style={{ justifySelf: "right", width: "70%", height: 1, backgroundColor: "black" }}></div>
                      </div>

                    </div>
                    <div className="h-5"></div>
                  </div>


                  <div className="row mt-3 document-print-signatures">
                    <div className="col-5" style={{ justifyItems: "center" }}>
                      <div className="row">
                        <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ลงนาม</div></div>
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
                        <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ลงนาม</div></div>

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



              </div>




            </Modal_blv.Body>
            <Modal_blv.Footer>

              <button
                className="btn btn-primary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={reactToPrintFn2}>
                Print
              </button>

              <button
                className="btn btn-secondary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={() => setShowbv(false)}>
                ปิด
              </button>

            </Modal_blv.Footer>
          </Modal_blv>

        </>

      )
    }

    //******* */ input Edit ************************


    function BillTemplate_Edit() {

      let taxNum = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
        String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
          String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""

      //****** */ input Radio Tax *************
      const [selectedOptiontax, setSelectedOptiontax] = useState('notax');

      //******* เปลี่ยน Tax ภาษี ******************
      const Radio_tax = () => {

        useEffect(() => {
          setSelectedOptiontax(localStorage.getItem("numbertax_S") || "")
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

      //********* เปลี่ยนส่วนลดท้ายบิล ****************         
      const Discount_s = () => {

        const [discountS, setdiscountS] = useState('0')

        useEffect(() => {
          setdiscountS(localStorage.getItem("discount_s") || "")

        }, [Number(discountS)]);


        const [show2, setShow2] = useState(false);

        // Update Quatation
        const EditQuatation = async () => {

          const totalall = Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0))
          const discount = Number(discountS)
          const sumtotal = Number(Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(discountS) - Number(parseInt(allQT.usereward)))

          const usereward = Number(allQT.usereward)
          const taxnumber = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
            String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
              String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""
          const personall = allQT.person
          const statussall = allQT.statuss
          const qt_status = allQT.qt_status
          const qt_person = allQT.qt_person
          const qt_remark = allQT.qt_remark

          try {
            //  localStorage.setItem("show","1")
            //  Save Sale
            await axios.put(`/api/${apiquatation}/${Number(localStorage.getItem("iddoc") || "")}`,
              {

                totalall, discount, sumtotal, usereward, personall, statussall, taxnumber


              })
            await fetchQT_ID()

          } catch (error) {
            console.error(error)
          }
        }
        return (


          <>

            <button
              type="button"
              className="btn btn-outline-success "
              style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", height: 27, width: 40 }}
              onClick={() => { setShow2(true), localStorage.setItem("discount_s", "0") }}
            >
              {Number(allQT.discount)}
            </button>

            <Modal_dc
              show={show2}
              onHide={() => setShow2(false)}
              className="document-modal detail-editor-modal"
              dialogClassName="document-modal-dialog modal-90w"
              backdropClassName="document-modal-backdrop detail-editor-modal-backdrop"
              animation={false}
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

                <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit_B", marginTop: 10, textAlign: "left", height: 35 }}>
                  ส่วนลดรวม : &nbsp;&nbsp;{Number(discountS)}&nbsp;&nbsp; บาท  </div>

              </Modal_dc.Body>
              <Modal_dc.Footer>
                <button
                  className="btn btn-success"

                  style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                  onClick={() => {
                    setShow2(false),
                      setQT({ ...allQT, discount: discountS }),
                      setdiscountS(localStorage.getItem("discount_s") || "")
                    EditQuatation()
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

      const modale = useDisclosure()
      const [priceAct, setEditedpriceAct] = useState<string>("");
      const [priceDis, setEditedpriceDis] = useState<string>("");
      const [editedcode, setEditedcode] = useState<string>("");
      const [editedTaskname, setEditedname] = useState<string>("");
      const [editqty, setEditedqty] = useState<string>("");
      const [editqtyCh, setEditedqtyCh] = useState<string>("");
      const [editid, setid] = useState<number>(0);
      const [editiddoc, setiddoc] = useState<number>(0);

      const [showD, setShowD] = useState(false);
      const [showqty, setShowqty] = useState(false);

      const [remarkQ, setremarkQ] = useState(allQT.inv_remark || allQT.qt_remark || "")
      useEffect(() => { setremarkQ(allQT.inv_remark || allQT.qt_remark || "") }, [allQT.inv_remark, allQT.qt_remark])

      const [st, setst] = useState("")
      /***************************************** */

      //***Order Date Diff */

      let dateS = getSafeDocumentDate(allQT.bl_date)
      let dateE = getSafeDocumentDate(allQT.bl_enddate)
      const [startDate, setStartDate] = useState(dateS);
      const [startDate1, setStartDate1] = useState(dateE);

      //***Order Date Diff */
      useEffect(() => {
        if (ids === 0) return

        setStartDate(getSafeDocumentDate(allQT.bl_date))
        setStartDate1(getSafeDocumentDate(allQT.bl_enddate))
      }, [ids, allQT.bl_date, allQT.bl_enddate]);

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


      // Update Quatation
      const EditQuatation = async () => {

        const totalall = Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0))
        const discount = Number(allQT.discount)
        const sumtotal = Number(Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(allQT.discount) - Number(parseInt(allQT.usereward)))

        const usereward = Number(allQT.usereward)
        const taxnumber = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
          String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
            String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""
        const personall = allQT.person
        const statussall = allQT.statuss
        const bl_date = new Date(startDate)
        const bl_enddate = new Date(startDate1)
        const bl_credit = Number(daysDiff)
        const bl_status = localStorage.getItem("st") || ""
        const bl_person = allQT.bl_person || allQT.qt_person
        const bl_remark = remarkQ
        const bl_orderNo = String(year) + String(month) + String(day)
        const bl_number = maxRecN1
        const bl_orderfull = "BL" + String(year) + String(month) + String(day) + maxRecN1

        try {
          //   localStorage.setItem("show","1")
          //Save Sale
          await axios.put(`/api/${apiquatation}/${Number(localStorage.getItem("iddoc") || "")}`,
            {

              totalall, discount, sumtotal, usereward, personall, statussall, taxnumber, bl_status, bl_person, bl_remark
              , bl_date, bl_enddate, bl_credit, bl_orderNo, bl_number, bl_orderfull

            })
          setTimeout(() => {
            fetchQT_ID()
            fetchQT()
          }, 700);


        } catch (error) {
          console.error(error)
        }
      }

      // Update Quatation_Detail
      const EditQuatation_Detail = async () => {

        const qty = Number(editqtyCh)
        const price = Number(priceAct)
        const discount = Number(priceDis)
        const total = Number(Number(editqtyCh) * (Number(priceAct) - Number(priceDis)))
        const person = ""


        try {
          await axios.put(`/api/${apiquatation_detail}/${Number(editid)}`,
            {

              qty, price, discount, total, person


            })

          await fetchQT_IDDetail()
          await setTimeout(() => {
            EditQuatation()

          }, 1000);

        } catch (error) {
          console.error(error)
        }
      }


      //******** */ Search สินค้า*****************/
      function Search_Product() {

        //*******Show Modal **********************************/
        const [show1, setShow1] = useState(false);
        const handleClose = () => setShow1(false);
        const handleShow = () => setShow1(true);
        const handleClose1 = () => { Post_Quatation_Detail(), setShow1(false) };
        //******* */  Key ค้นหา สินค้า  ************************/
        const [data, setData] = useState(dataProduct);
        const [search, setsearch] = useState("")

        const handleChange = (value: any) => {
          setsearch(value);
          filterDataProduct(value);
        };

        // filter records by Productname
        const filterDataProduct = (value: any) => {
          const lowercasedValue = String(value || "").toLowerCase().trim();
          if (lowercasedValue === "") setData(dataProduct);
          else {
            const filteredData = dataProduct.filter((user: any) =>
              String(user?.ProductName || "").toLowerCase().includes(lowercasedValue)
              || String(user?.code || "").toLowerCase().includes(lowercasedValue)
              || String(user?.Barcode || "").toLowerCase().includes(lowercasedValue)
            );
            setData(filteredData);
          }
        };

        const [idP, setidP] = useState("")
        const [code, setcode] = useState("")
        const [product, setProduct] = useState("")
        const [priceS, setprice] = useState("")
        const [unitS, setunit] = useState("")
        const [qtyP, setqtyP] = useState("1")

        // Update Quatation_Detail
        const Post_Quatation_Detail = async () => {
          let currentIds = ids
          if (!currentIds || currentIds === 0) {
            const newId = await createNewDocMain("bl")
            if (!newId) return
            currentIds = newId
          }
          const company = String(localStorage.getItem("company_") || "")
          const id_product = Number(idP)
          const code_product = code
          const name_product = product
          const unit = unitS
          const qty = Number(qtyP)
          const price = Number(priceS)
          const total = Number(qtyP) * Number(priceS)
          const person = ""
          const id_docmain = Number(currentIds)


          try {
            await axios.post(`/api/${apiquatation_detail}`,
              {
                unit, qty, price, total, person, company, id_product, code_product, name_product, id_docmain

              })

            await fetchQT_IDDetail(currentIds)


          } catch (error) {
            console.error(error)
          }
        }



        return (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleShow(); }}
              style={{
                fontFamily: "Kanit", fontSize: 13, padding: "6px 16px", borderRadius: 8,
                border: "1.5px solid #2A6AAA", backgroundColor: "#F3F8FC", color: "#2A6AAA",
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                transition: "all 0.15s", whiteSpace: "nowrap", fontWeight: 600,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#E5EEF8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#F3F8FC"; }}
            >
              + เพิ่มสินค้า
            </button>

            <Modal1 show={show1} onHide={handleClose} className="document-modal product-picker-modal" dialogClassName="document-modal-dialog" backdropClassName="document-modal-backdrop product-picker-modal-backdrop">
              <Modal1.Header closeButton>
                <Modal1.Title
                  style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, height: 20 }}>
                  ค้นหาชื่อ, รหัส, Barcode สินค้า
                </Modal1.Title>
              </Modal1.Header>
              <Modal1.Body>
                <div>
                  <div className={styles.bodydetailTable_Re} style={{ width: "4vw" }}>ค้นหา</div>
                  <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                    <input
                      value={search}
                      onChange={(e) => handleChange(e.target.value)}
                      className="form-control form-control-sm"
                      placeholder="ค้นหาชื่อ, รหัส, Barcode สินค้า"
                      style={{ fontFamily: "Kanit", fontSize: 10, height: 12 }} />
                  </div>

                  <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
                    <table className="table table-sm table-hover"   >
                      <thead style={{ position: "sticky", top: "0" }}>
                        <tr>
                          <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "4vw" }}>
                            <div style={{ width: "4vw" }}>รหัสสินค้า</div>

                          </th>
                          <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "15vw" }}>
                            <div style={{ width: "15vw" }}>ชื่อสินค้า</div>

                          </th>
                          <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "7vw" }}>
                            <div style={{ width: "7vw" }}>barcode</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="table-group-divider " >
                        {data.map((post: any) => (
                          <tr key={post.id}
                            onClick={() => {
                              setidP(post.id),
                                setcode(post.code),
                                setProduct(post.ProductName),
                                setprice(post.price),
                                setunit(post.Unit)

                            }}>
                            <td className={styles.bodydetailTable_Re1} style={{ width: "4vw" }}>{post.code}</td>
                            <td className={styles.bodydetailTable_Re1} style={{ width: "15vw" }}>{post.ProductName}</td>
                            <td className={styles.bodydetailTable_Re1} style={{ width: "7vw" }}>{post.Barcode}</td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
                <div className='row'>
                  <div className='d-flex mt-1'>
                    <div style={{ fontFamily: "Kanit_B", textAlign: "left", fontSize: 15 }}>{code}</div>
                    <div style={{ fontFamily: "Kanit_B", textAlign: "left", fontSize: 15, marginLeft: 10 }}>{product}</div>
                  </div>
                  <div className='d-flex mt-2'>
                    <div style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, marginLeft: 10, marginTop: 10 }}>ราคา :&nbsp;&nbsp; {priceS}&nbsp;&nbsp; บาท&nbsp;&nbsp;&nbsp; จำนวน</div>
                    <input
                      className="form-control form-control-sm "

                      style={{ width: 50, marginLeft: 10, marginRight: 10, height: 20, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                      value={qtyP}
                      onChange={(e) => setqtyP(e.target.value)} />
                    <div style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, marginLeft: 10, marginTop: 10 }}>{unitS}&nbsp;&nbsp;ราคารวม : &nbsp;&nbsp;{Number(qtyP) * Number(priceS)}&nbsp;&nbsp; บาท</div>
                  </div>


                </div>

              </Modal1.Body>
              <Modal1.Footer >

                <Button1
                  variant="secondary"
                  onClick={handleClose}
                  style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}
                >
                  ปิด
                </Button1>
                <Button1
                  variant="primary"
                  onClick={handleClose1}
                  style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}
                >
                  เพิ่ม
                </Button1>
              </Modal1.Footer>
            </Modal1>
          </>
        );
      }

      const billNumberDisplay = allQT.bl_number === null || allQT.bl_number === undefined
        ? `BL${year}${month}${day}${maxRecN1}`
        : `BL${allQT.bl_orderNo}${allQT.bl_number}`

      const openQuantityEditor = (detail: any) => {
        setShowqty(true)
        setEditedpriceDis(String(detail.discount || "0"))
        setEditedpriceAct(String(detail.price || "0"))
        setEditedqty(String(detail.qty || "0"))
        setEditedqtyCh(String(detail.qty || "0"))
        setEditedcode(String(detail.code_product || ""))
        setEditedname(String(detail.name_product || ""))
        setid(Number(detail.id || 0))
        setiddoc(Number(detail.id_docmain || 0))
        localStorage.setItem("idd", String(detail.id_docmain || 0))
      }

      const openDiscountEditor = (detail: any) => {
        setShowD(true)
        setEditedpriceDis(String(detail.discount || "0"))
        setEditedpriceAct(String(detail.price || "0"))
        setEditedqty(String(detail.qty || "0"))
        setEditedqtyCh(String(detail.qty || "0"))
        setEditedcode(String(detail.code_product || ""))
        setEditedname(String(detail.name_product || ""))
        setid(Number(detail.id || 0))
        setiddoc(Number(detail.id_docmain || 0))
        localStorage.setItem("idd", String(detail.id_docmain || 0))
      }

      const updateBillStatus = async (nextStatus: string) => {
        localStorage.setItem("st", nextStatus)
        setst(nextStatus)
        if (ids === 0) {
          const newId = await createNewDocMain("bl")
          if (!newId) return
        }
        setTimeout(() => {
          EditQuatation()
        }, 500)
      }

      return (


        <>

          {useModernSalesDocumentLayout ? (
            <Modal_ble
              show={showbe}
              onHide={() => setShowbe(false)}
              size="xl"
              scrollable={true}
              className="document-modal"
              dialogClassName="document-modal-dialog"
              backdropClassName="document-modal-backdrop"
              animation={false}
              enforceFocus={false}
              aria-labelledby="example-custom-modal-styling-title"
            >
              <Modal_ble.Header closeButton style={{ borderBottom: "1px solid #e5e7eb", padding: "16px 24px", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" }}>
                <Modal_ble.Title id="example-custom-modal-styling-title" style={{ width: "100%" }}>
                  {renderDocumentModalTitle({
                    title: "ใบวางบิล",
                    docDisplay: billNumberDisplay,
                    status: allQT.bl_status,
                    icon: <ClipboardList size={18} color="white" />,
                    iconBackground: "linear-gradient(135deg, #0f766e, #14b8a6)",
                  })}
                </Modal_ble.Title>
              </Modal_ble.Header>

              {renderDocumentWorkflowStepper("BL")}

              <Modal_ble.Body style={{ backgroundColor: "#f8fafc", padding: "20px 24px" }}>
                {renderDocumentInfoGrid({
                  docType: "bl",
                  docDisplay: billNumberDisplay,
                  startDate,
                  setStartDate,
                  startDate1,
                  setStartDate1,
                  creditDays: daysDiff,
                  personDisplay: allQT.bl_person || allQT.qt_person,
                  detailIcon: <ClipboardList size={14} color="#2A6AAA" />,
                })}
                {renderDocumentItemsSection({
                  searchProductControl: renderProductSearchControl("bl"),
                  onEditQuantity: openQuantityEditor,
                  onEditDiscount: openDiscountEditor,
                  onDeleteItem: DeleteQT_ID,
                  showqty,
                  setShowqty,
                  showD,
                  setShowD,
                  priceAct,
                  setEditedpriceAct,
                  priceDis,
                  setEditedpriceDis,
                  editedcode,
                  editedTaskname,
                  editqty,
                  editqtyCh,
                  setEditedqtyCh,
                  onApplyDetailEdit: EditQuatation_Detail,
                })}
                {renderDocumentSummarySection({
                  remarkQ,
                  setremarkQ,
                  discountControl: <Discount_s />,
                  taxNum,
                  attachmentDocType: "bl",
                })}
                {renderDocumentSignatureSection()}
              </Modal_ble.Body>

              <Modal_ble.Footer style={{ borderTop: "1px solid #e5e7eb", padding: "12px 24px", background: "#fafbfc", justifyContent: "space-between" }}>
                {renderDocumentFooterActions({
                  taxControl: <Radio_tax />,
                  createControl: renderDocumentCreateDropdown("bl"),
                  status: allQT.bl_status,
                  onChangeStatus: updateBillStatus,
                  onSave: async () => {
                    if (ids === 0) {
                      const newId = await createNewDocMain("bl")
                      if (!newId) return
                    }
                    EditQuatation()
                    setShowbe(false)
                    fetchQT_ID()
                  },
                  onClose: () => setShowbe(false),
                })}
              </Modal_ble.Footer>
            </Modal_ble>
          ) : (

          <Modal_ble
            show={showbe}
            onHide={() => setShowbe(false)}
            size="lg"
            scrollable={true}
            className="document-modal"
            dialogClassName="document-modal-dialog"
            backdropClassName="document-modal-backdrop"
            animation={false}
            enforceFocus={false}
            aria-labelledby="example-custom-modal-styling-title"
          >
            <Modal_ble.Header closeButton>
              <Modal_ble.Title id="example-custom-modal-styling-title">
                <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>สร้างใบวางบิล</div>
              </Modal_ble.Title>
            </Modal_ble.Header>
            <Modal_ble.Body style={{ backgroundColor: "grey" }}>

              <div className="col  " style={{ justifySelf: "center", backgroundColor: "white", marginLeft: 20, marginRight: 20 }}  >


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
                    <div className="row " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{all.names}</div>
                    <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{all.address}</div>
                    <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{all.numbertax}</div>
                    <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {all.tel}</div>

                  </div>

                  {/**ใบเสนราคา */}
                  <div className="col ">
                    <div className="row "
                      style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 20, justifySelf: "center" }}>
                      ใบวางบิล
                    </div>
                    <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                    <div className="row">
                      <div className="col-4 ">
                        <div style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เลขที่ :</div>
                        <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ :</div>
                        <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เครดิต :</div>
                        <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันครบกำหนด :</div>
                        <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>ผู้ขาย :</div>
                      </div>

                      <div className="col ">
                        <div className="col " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>

                          {allQT.bl_number === null ? <div>BL{year}{month}{day}{maxRecN1}</div> :
                            <div>BL{allQT.bl_orderNo}{allQT.bl_number}</div>}


                        </div>


                        <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>

                          {/**Open */}
                          <div className='border border-black shadow shadow-sm rounded ' style={{ width: 130, height: 25 }}>
                            <div style={{ width: 100, marginLeft: 10, marginTop: 2 }}>
                              <DatePicker
                                value={
                                  allQT.bl_date === null ?
                                    new Date().toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', }) :
                                    new Date(startDate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
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
                              <DatePicker value=
                                {
                                  allQT.bl_enddate === null ?
                                    new Date().toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', }) :
                                    new Date(startDate1).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                                selected={startDate1} 
                                onChange={(date: any) => setStartDate1(date)} />
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>ชื่อผู้ขาย</div>

                        <div className="mt-1 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{allQT.qt_person}</div>
                      </div>
                    </div>
                    <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                  </div>
                </div>

                <div className="row mt-3" style={{ marginLeft: 20, marginRight: 20 }}>
                  <div className="d-flex bd-highlight" style={{ justifySelf: "right" }}>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit_B", fontSize: 10, textAlign: "center", height: 15, width: 32 }}>ลำดับ</div>
                    <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit_B", fontSize: 11, textAlign: "start", height: 15, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>รายการ</div>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 45 }}>จำนวน</div>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>หน่วย</div>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 70 }}>ราคาต่อหน่วย</div>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>ลด/ชิ้น</div>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>รวม</div>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>ลบ</div>
                  </div>
                  <div className="mt-1 " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                  <table className="table table-hover"   >
                    <tbody className="">
                      <tr className="">
                        <td className="">
                          {qt_detail.sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)))
                            .map((a: any) =>
                              <div key={a.id} id="selcet-print">
                                <div className="d-flex bd-highlight" style={{ justifyItems: "end" }} >
                                  <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit", fontSize: 12, textAlign: "start", height: 30, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>{a.name_product}</div>
                                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 12, textAlign: "center", height: 30, width: 30 }}>

                                    <>
                                      <button

                                        className="btn btn-outline-success btn-sm"
                                        style={{ height: 24, fontSize: 12, fontFamily: "Kanit_B", width: 35 }}
                                        onClick={() => {
                                          setShowqty(true),
                                            setEditedpriceDis(String(a.discount)),
                                            setEditedpriceAct(String(a.price)),
                                            setEditedqty(String(a.qty)),
                                            setEditedqtyCh(String(a.qty)),
                                            setEditedcode(String(a.code_product)),
                                            setEditedname(String(a.name_product)),
                                            setid(Number(a.id)),
                                            setiddoc(Number(a.id_docmain)),
                                            localStorage.setItem("idd", String(a.id_docmain))

                                        }}>
                                        {a.qty}
                                      </button>
                                      <Modal_qty
                                        show={showqty}
                                        onHide={() => setShowqty(false)}
                                        dialogClassName="modal-90w"
                                        aria-labelledby="example-custom-modal-styling-title"
                                      >
                                        <Modal_qty.Header closeButton>
                                          <Modal_qty.Title id="example-custom-modal-styling-title">
                                            <div style={{ width: "auto", height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>ปรับจำนวน</div>
                                          </Modal_qty.Title>
                                        </Modal_qty.Header>
                                        <Modal_qty.Body>     <div className='d-flex'>
                                          <div style={{ width: "auto", height: 30, fontSize: 15, fontFamily: "Kanit_B" }}>{editedcode}</div>
                                          <div style={{ width: "auto", marginLeft: 5, height: 30, fontSize: 15, fontFamily: "Kanit_B" }}>{editedTaskname}</div>
                                        </div>
                                          <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
                                            <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                                              ราคา : {priceAct}  บาท
                                            </div>
                                          </div>
                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>คงเหลือ : {Number(priceAct) - Number(priceDis)} บาท/ชิ้น</div>
                                          <div className='d-flex'>
                                            <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10 }}>
                                              จำนวนสินค้า : {Number(editqty)} ชิ้น ปรับจำนวนเป็น
                                            </div>

                                            <input className="form-control form-control-sm mt-1" style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                                              value={editqtyCh}
                                              onChange={(e) => setEditedqtyCh(e.target.value)} />
                                            <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>ชิ้น</div>
                                          </div>


                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>ยอดรวม : {Number(editqtyCh) * (Number(priceAct) - Number(priceDis))} บาท/ชิ้น</div>
                                        </Modal_qty.Body>
                                        <Modal_qty.Footer>
                                          <button
                                            className="btn btn-success"

                                            style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                                            onClick={() => { EditQuatation_Detail(), setShowqty(false) }}
                                          >
                                            ตกลง
                                          </button>
                                          <button
                                            className="btn btn-secondary"
                                            style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                                            onClick={() => setShowqty(false)}
                                          >
                                            ปิด
                                          </button>

                                        </Modal_qty.Footer>
                                      </Modal_qty>


                                    </>
                                  </div>
                                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 12, textAlign: "end", height: 30, width: 50 }}>{a.unit}</div>
                                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 12, textAlign: "end", height: 30, width: 70 }}>{a.price}</div>
                                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 12, textAlign: "end", height: 30, width: 50 }} >
                                    <>
                                      <button

                                        className="btn btn-outline-success btn-sm"
                                        style={{ height: 24, fontSize: 12, fontFamily: "Kanit_B", width: 35 }}
                                        onClick={() => {
                                          setShowD(true),
                                            setEditedpriceDis(String(a.discount)),
                                            setEditedpriceAct(String(a.price)),
                                            setEditedqty(String(a.qty)),
                                            setEditedqtyCh(String(a.qty)),
                                            setEditedcode(String(a.code_product)),
                                            setEditedname(String(a.name_product)),
                                            setid(Number(a.id)),
                                            setiddoc(Number(a.id_docmain)),
                                            localStorage.setItem("idd", String(a.id_docmain))
                                        }}>
                                        {a.discount}
                                      </button>
                                      <Modal_ds
                                        show={showD}
                                        onHide={() => setShowD(false)}
                                        dialogClassName="modal-90w"
                                        aria-labelledby="example-custom-modal-styling-title"
                                      >
                                        <Modal_ds.Header closeButton>
                                          <Modal_ds.Title id="example-custom-modal-styling-title">
                                            <div style={{ width: "auto", height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>ส่วนลดราคา</div>
                                          </Modal_ds.Title>
                                        </Modal_ds.Header>
                                        <Modal_ds.Body>     <div className='d-flex'>
                                          <div style={{ width: "auto", height: 30, fontSize: 15, fontFamily: "Kanit_B" }}>{editedcode}</div>
                                          <div style={{ width: "auto", marginLeft: 5, height: 30, fontSize: 15, fontFamily: "Kanit_B" }}>{editedTaskname}</div>
                                        </div>
                                          <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
                                            <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                                              ราคาจาก : {priceAct}  บาท   ลดราคาชิ้นละ</div>

                                            <input className="form-control form-control-sm mt-1" style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                                              value={priceDis}
                                              onChange={(e) => setEditedpriceDis(e.target.value)} />
                                            <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>บาท</div>

                                          </div>
                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>คงเหลือ : {Number(priceAct) - Number(priceDis)} บาท/ชิ้น</div>
                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>จำนวนสินค้า : {Number(editqty)} ชิ้น</div>
                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>ยอดรวม : {Number(editqty) * (Number(priceAct) - Number(priceDis))} บาท/ชิ้น</div>
                                        </Modal_ds.Body>
                                        <Modal_ds.Footer>
                                          <button
                                            className="btn btn-success"

                                            style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                                            onClick={() => {
                                              EditQuatation_Detail(), setShowD(false)
                                              //    setQT({...allQT, discount:discountS}),
                                              //    setdiscountS(localStorage.getItem("discount_s") || "")

                                            }}
                                          >
                                            ตกลง
                                          </button>
                                          <button
                                            className="btn btn-secondary"
                                            style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                                            onClick={() => { setShowD(false) }}
                                          >
                                            ปิด
                                          </button>

                                        </Modal_ds.Footer>
                                      </Modal_ds>


                                    </>
                                  </div>
                                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 30, width: 50 }}>{a.total}</div>
                                  <div className=' bd-highlight' style={{ height: 30, width: 50 }}>
                                    <Image onClick={() => DeleteQT_ID(a.id)} alt={""} src={deletes} width={20} height={20} style={{ marginLeft: 30, cursor: "pointer" }} />
                                  </div>
                                </div>
                              </div>
                            )}
                        </td>

                      </tr>

                    </tbody>
                  </table>
                  <div className="d-flex flex-row-reverse bd-highlight" style={{ width: "100%" }}>

                    <div className='p-2 bd-highlight'> <Search_Product /> </div>
                  </div>
                  <div className=" " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                  <div className="row mt-2 " style={{ fontFamily: "kanit", fontSize: 11, justifySelf: "left", marginLeft: 3 }}>ทั้งหมด : {qt_detail.length} รายการ  </div>

                  {/**ท้ายบิล Slip */}
                  <div className="container">
                    <div className="row ">

                      <div className="col mt-2">
                        <InputGroup>
                          <InputGroup.Text style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>หมายเหตุ</InputGroup.Text>
                          <Form.Control
                            style={{ fontFamily: "Kanit", fontSize: 12 }}
                            as="textarea"
                            aria-label="With textarea"
                            value={remarkQ ?? ""}
                            onChange={(e) => setremarkQ(e.target.value)}

                          />

                        </InputGroup>

                      </div>
                      <div className="col ">
                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>รวมเงิน :</div>
                          <div className=" bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 27, }}>{Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0))}</div>
                          <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ส่วนลดท้ายบิล :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 27 }}><Discount_s /></div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ใช้แต้มส่วนลด :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 27 }}>{allQT.usereward}</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        {String(taxNum) === "" ? "" :
                          <div>
                            <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>จำนวนเงินรวมทั้งสิ้น :</div>
                              <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 27 }}>{Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(allQT.discount) - Number(allQT.usereward)} </div>
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                            </div>
                            <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                            <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>หักภาษี ณ ที่จ่าย {allQT.taxnumber !== taxNum ? taxNum : allQT.taxnumber} % :</div>
                              <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 27 }}>{((Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) * Number(allQT.taxnumber !== taxNum ? taxNum : allQT.taxnumber)) / 100).toFixed(1)}
                              </div>
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                            </div>
                          </div>
                        }

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 30 }}>ยอดชำระทั้งหมด :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 30 }}>
                            {((((Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(allQT.discount) - Number(allQT.usereward)) * Number(allQT.taxnumber !== taxNum ? taxNum : allQT.taxnumber)) / 100) + (Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(allQT.discount) - Number(allQT.usereward))).toFixed(1)}</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 30 }}>บาท</div>
                        </div>
                        <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                      </div>
                    </div>
                    <div className="h-5">
                    </div>
                  </div>


                  <div className="row mt-3">
                    <div className="col-5" style={{ justifyItems: "center" }}>
                      <div className="row">
                        <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ลงนาม</div></div>
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
                        <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ลงนาม</div></div>

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




            </Modal_ble.Body>
            <Modal_ble.Footer>
              {/**ปรับ%ภาษี */}
              <Radio_tax />
              {/**การอนุมัติ */}
              <Dropdown
                className="d-inline mx-2"
              >

                <Dropdown.Toggle
                  id="dropdown-autoclose-true"
                  variant={
                    allQT.bl_status === "อนุมัติ" ? "success" :
                      allQT.bl_status === "รออนุมัติ" ? "warning" :
                        allQT.bl_status === "ยกเลิก" ? "danger" : "primary"
                  }
                  style={{ fontSize: 15, fontFamily: "kanit", height: 40 }}>
                  {allQT.bl_status === null ? "รออนุมัติ" : allQT.bl_status}
                </Dropdown.Toggle>

                <Dropdown.Menu >
                  <Dropdown.Item href="#"
                    onClick={() => {
                      localStorage.setItem("st", "รออนุมัติ"),
                        setst("รออนุมัติ"),
                        setTimeout(() => {
                          EditQuatation()
                        }, 500)
                    }}
                    style={{ fontSize: 15, fontFamily: "kanit" }}>รออนุมัติ</Dropdown.Item>
                  <Dropdown.Item href="#"
                    onClick={() => {
                      localStorage.setItem("st", "อนุมัติ"),
                        setst("อนุมัติ")
                      setTimeout(() => {
                        EditQuatation()
                      }, 500)
                    }}
                    style={{ fontSize: 15, fontFamily: "kanit" }}>อนุมัติ</Dropdown.Item>
                  <Dropdown.Item href="#"
                    onClick={() => {
                      localStorage.setItem("st", "ยกเลิก"),
                        setst("ยกเลิก")
                      setTimeout(() => {
                        EditQuatation()
                      }, 500)
                    }}

                    style={{ fontSize: 15, fontFamily: "kanit" }}>

                    ยกเลิก</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <button
                className="btn btn-success"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={() => { EditQuatation(), setShowbe(false), fetchQT_ID() }}
              >
                บันทึก
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={() => setShowbe(false)}>
                ปิด
              </button>

            </Modal_ble.Footer>
          </Modal_ble>

          )}

        </>

      )
    }

    return (

      <>
        <div className="col">
          <div className='d-flex align-items-center justify-content-between mb-1 mt-1' style={{ gap: 12 }}>
            <div style={{ fontFamily: "kanit_B", fontSize: 18, color: "#1f2937" }}>ใบวางบิล</div>
            <button
              type="button"
              onClick={() => openCreateDocumentDraft("second")}
              style={{
                padding: "6px 16px", borderRadius: 8, border: "1.5px solid #2A6AAA",
                backgroundColor: "#F3F8FC", color: "#2A6AAA", fontSize: 13,
                fontFamily: "kanit_B", cursor: "pointer", display: "inline-flex",
                alignItems: "center", gap: 6, whiteSpace: "nowrap",
              }}
            >
              <Plus size={14} /> สร้างเอกสาร
            </button>
          </div>
          <table className="table table-hover" style={{ borderCollapse: "separate", borderSpacing: "0" }}>
            <thead >
              <tr >
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>วันที่สร้าง</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>เลขที่เอกสาร</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>ชื่อลูกค้า/ชื่อโปรเจค</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>ยอดรวมสุทธิ</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>สถานะ</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", width: 120, textAlign: "center" }}></td>

              </tr>
            </thead>
            <tbody >
              {filterBySearch(filterByStatus(qt.filter((d: any) => d.qt_status === "อนุมัติ" || d.bl_status === "อนุมัติ" || d.bl_status === "รออนุมัติ" || d.bl_status === "ยกเลิก"), "bl"), "bl").sort((a: any, b: any) => a.createDate.localeCompare(b.createDate)).map((a: any) =>
                <tr key={a.id} onClick={() => setSelectedDocRow(a)} style={{ cursor: "pointer", backgroundColor: selectedDocRow?.id === a.id ? "#F3F8FC" : undefined }} >
                  <td style={{ fontFamily: "kanit", fontSize: 10, height: 40 }}>

                    {a.qt_date === null ? <></> :
                      <div style={{ fontFamily: "kanit", fontSize: 10, height: 12 }}>
                        ใบเสนอราคา : {new Date(a.qt_date).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                      </div>}
                    {a.bl_date === null ? <></> :
                      <div style={{ fontFamily: "kanit", fontSize: 13 }}>
                        {new Date(a.bl_date).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                      </div>}
                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 10, height: 40 }}>
                    {a.qt_date === null ? <></> :
                      <div style={{ fontFamily: "kanit", fontSize: 10, height: 12 }}>
                        ใบเสนอราคา : QT{a.qt_orderNo}{a.qt_number}</div>}

                    {a.bl_date === null ? <></> :
                      <div style={{ fontFamily: "kanit", fontSize: 13 }}>
                        BL{a.bl_orderNo}{a.bl_number}</div>}

                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40 }}>{a.name_costomer}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>{(Number(a.totalall) + ((Number(a.totalall) * Number(a.taxnumber)) / 100)).toFixed(1)}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>

                    <span style={{
                      fontFamily: "kanit", fontSize: 11, padding: "3px 12px", borderRadius: 20,
                      backgroundColor: a.bl_status === "อนุมัติ" ? "#D3F0E2" : a.bl_status === "รออนุมัติ" ? "#fef3c7" : a.bl_status === "ยกเลิก" ? "#fee2e2" : "#e0e7ff",
                      color: a.bl_status === "อนุมัติ" ? "#0C5238" : a.bl_status === "รออนุมัติ" ? "#92400e" : a.bl_status === "ยกเลิก" ? "#991b1b" : "#3730a3",
                      fontWeight: 600,
                    }}>{a.bl_status === null ? "สร้างใบวางบิล" : a.bl_status}</span>

                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, textAlign: "center", height: 50 }} className='d-flex'>
                    <button
                      onClick={() => { maxV(), setids(a.id), setidcus(a.id_costomer), localStorage.setItem("iddoc", a.id), setShowbe(true) }}
                      style={{ fontSize: 11, height: 28, marginLeft: 5, padding: "0 12px", borderRadius: 8, border: a.bl_status === null ? "1px solid #2A6AAA" : "1px solid #d97706", backgroundColor: "white", color: a.bl_status === null ? "#2A6AAA" : "#d97706", fontFamily: "kanit", cursor: "pointer", transition: "all 0.2s ease" }}
                      onMouseEnter={(e) => { const c = a.bl_status === null ? "#2A6AAA" : "#f59e0b"; e.currentTarget.style.backgroundColor = c; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 2px 8px ${c}4d` }}
                      onMouseLeave={(e) => { const c = a.bl_status === null ? "#2A6AAA" : "#d97706"; e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = c; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}>
                      {a.bl_status === null ? "สร้าง" : "แก้ไข"}
                    </button>

                    <button
                      onClick={() => { setids(a.id), setidcus(a.id_costomer), setShowbv(true) }}
                      style={{ fontSize: 11, height: 28, marginLeft: 5, padding: "0 12px", borderRadius: 8, border: "1px solid #2A6AAA", backgroundColor: "white", color: "#2A6AAA", fontFamily: "kanit", cursor: "pointer", transition: "all 0.2s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#2A6AAA"; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(42, 106, 170,0.3)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = "#2A6AAA"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}>
                      ข้อมูล
                    </button>
                    {renderRowDocumentAttachmentButton("bl", Number(a.id))}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <BillTemplate_Edit />
          <BillTemplate />
        </div>

      </>

    )
  }

  //*****************   ใบส่งสินค้า  ***************************/
  const DeliveryNoteList = () => {
    const rows = filterBySearch(
      filterByStatus(qt.filter((d: any) => d.dn_status !== null && d.dn_status !== undefined), "dn"),
      "dn"
    ).sort((a: any, b: any) => String(a.createDate).localeCompare(String(b.createDate)))

    const openPrint = (a: any) => {
      setids(a.id)
      setidcus(a.id_costomer)
      localStorage.setItem("iddoc", a.id)
      setShowdnv(true)
    }

    const openEdit = (a: any) => {
      setids(a.id)
      setidcus(a.id_costomer)
      localStorage.setItem("iddoc", a.id)
      setDnEditStatus(a.dn_status || "รออนุมัติ")
      setDnEditRemark(a.dn_remark || "")
      setDnEditDate(getSafeDocumentDate(a.dn_date))
      setDnEditEndDate(getSafeDocumentDate(a.dn_enddate))
      setDnEditPayType((a.dn_paytype as any) || "cash")
      setDnEditDeposit(a.dn_deposit || 0)
      setShowdne(true)
    }

    const approveDelivery = async (a: any) => {
      try {
        await axios.put(`/api/${apiquatation}/${a.id}`, { dn_status: "อนุมัติ" })
        await fetchQT()
      } catch (error) {
        console.error(error)
      }
    }

    //******** */ input Preview *********************
    function DeliveryNoteTemplate() {

      let taxNum = allQT.taxnumber

      //Print Label
      const contentRef = useRef<HTMLDivElement>(null);
      const reactToPrintFn = useReactToPrint({
        contentRef,
        documentTitle: allQT.dn_orderfull || `DN${allQT.dn_orderNo || ""}${allQT.dn_number || ""}`,
        pageStyle: PROFESSIONAL_DOCUMENT_PRINT_PAGE_STYLE,
      });

      const { grandTotal } = getDocumentFinancialSummary(taxNum)

      const paymentInfo = (() => {
        if (allQT.dn_paytype === "credit") {
          return {
            title: "เงื่อนไขการชำระเงิน : เงินเชื่อ (Credit)",
            lines: [
              { label: "ระยะเวลาเครดิต", value: allQT.dn_credit ? `${allQT.dn_credit} วัน` : "-" },
              { label: "ครบกำหนดชำระ", value: formatDocumentDate(allQT.dn_enddate) },
              { label: "ยอดคงเหลือที่ต้องชำระ", value: `${formatDocumentCurrency(allQT.dn_balance ?? grandTotal)} บาท`, color: "#b45309" },
            ],
          }
        }
        if (allQT.dn_paytype === "deposit") {
          return {
            title: "เงื่อนไขการชำระเงิน : เงินมัดจำ (Deposit)",
            lines: [
              { label: "ยอดเงินมัดจำที่รับแล้ว", value: `${formatDocumentCurrency(allQT.dn_deposit)} บาท`, color: "#0f766e" },
              { label: "ครบกำหนดชำระส่วนที่เหลือ", value: formatDocumentDate(allQT.dn_enddate) },
              { label: "ยอดคงเหลือที่ต้องชำระ", value: `${formatDocumentCurrency(allQT.dn_balance)} บาท`, color: "#b45309" },
            ],
          }
        }
        return {
          title: "เงื่อนไขการชำระเงิน : เงินสด (Cash)",
          lines: [
            { label: "สถานะการชำระเงิน", value: "ชำระเงินสดครบถ้วนแล้ว", color: "#173F6B" },
          ],
        }
      })()

      return (
        <>
          <Modal_dnv
            show={showdnv}
            onHide={() => setShowdnv(false)}
            size="lg"
            scrollable={true}
            aria-labelledby="example-custom-modal-styling-title"
          >
            <Modal_dnv.Header closeButton>
              <Modal_dnv.Title id="example-custom-modal-styling-title">
                <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>ใบส่งสินค้า</div>
              </Modal_dnv.Title>
            </Modal_dnv.Header>
            <Modal_dnv.Body style={{ backgroundColor: "grey" }}>
              <div
                className="document-print-sheet"
                style={PROFESSIONAL_DOCUMENT_PRINT_SHEET_STYLE}
                ref={contentRef}
              >
                {renderSalesPrintDocument({
                  docType: "dn",
                  title: "ใบส่งสินค้า",
                  englishTitle: "DELIVERY NOTE",
                  dateValue: allQT.dn_date,
                  endDateValue: allQT.dn_enddate,
                  creditValue: allQT.dn_credit,
                  personName: allQT.dn_person || allQT.qt_person,
                  remark: allQT.dn_remark,
                  taxNum,
                  status: allQT.dn_status,
                  customerRoleLabel: "ผู้รับสินค้า",
                  companyRoleLabel: "ผู้ส่งสินค้า",
                  paymentInfo,
                })}
              </div>
            </Modal_dnv.Body>
            <Modal_dnv.Footer>
              <button
                className="btn btn-primary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={reactToPrintFn}>
                Print
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={() => setShowdnv(false)}>
                ปิด
              </button>
            </Modal_dnv.Footer>
          </Modal_dnv>
        </>
      )
    }

    //******** */ input Edit / อนุมัติ *********************
    function DeliveryNoteTemplate_Edit() {

      const taxNum = allQT.taxnumber
      const { grandTotal } = getDocumentFinancialSummary(taxNum)
      const balancePreview = dnEditPayType === "deposit"
        ? Math.max(grandTotal - Number(dnEditDeposit || 0), 0)
        : grandTotal

      const saveEdit = async () => {
        setDnSaving(true)
        try {
          const dn_balance = dnEditPayType === "deposit"
            ? Math.max(grandTotal - Number(dnEditDeposit || 0), 0)
            : grandTotal

          await axios.put(`/api/${apiquatation}/${ids}`, {
            dn_status: dnEditStatus,
            dn_remark: dnEditRemark,
            dn_date: new Date(dnEditDate),
            dn_enddate: new Date(dnEditEndDate),
            dn_paytype: dnEditPayType,
            dn_deposit: dnEditPayType === "deposit" ? Number(dnEditDeposit || 0) : 0,
            dn_balance,
          })
          await fetchQT()
          setShowdne(false)
        } catch (error) {
          console.error(error)
        } finally {
          setDnSaving(false)
        }
      }

      return (
        <>
          <Modal_dne
            show={showdne}
            onHide={() => setShowdne(false)}
            size="lg"
            scrollable={true}
            aria-labelledby="example-custom-modal-styling-title"
          >
            <Modal_dne.Header closeButton>
              <Modal_dne.Title id="example-custom-modal-styling-title">
                <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>แก้ไข / อนุมัติใบส่งสินค้า</div>
              </Modal_dne.Title>
            </Modal_dne.Header>
            <Modal_dne.Body>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 18px" }}>
                <div>
                  <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>วันที่ส่งสินค้า</div>
                  <DatePicker
                    selected={getSafeDocumentDate(dnEditDate)}
                    onChange={(date: Date | null) => { if (date) setDnEditDate(getSafeDocumentDate(date)) }}
                    dateFormat="dd/MM/yyyy"
                    popperClassName="datepicker-popper-high"
                    popperProps={{ strategy: "fixed" }}
                    wrapperClassName="datepicker-wrapper-full"
                    customInput={<DocumentDateInput placeholder="เลือกวันที่" />}
                  />
                </div>
                <div>
                  <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>วันครบกำหนดชำระ</div>
                  <DatePicker
                    selected={getSafeDocumentDate(dnEditEndDate)}
                    onChange={(date: Date | null) => { if (date) setDnEditEndDate(getSafeDocumentDate(date)) }}
                    dateFormat="dd/MM/yyyy"
                    popperClassName="datepicker-popper-high"
                    popperProps={{ strategy: "fixed" }}
                    wrapperClassName="datepicker-wrapper-full"
                    customInput={<DocumentDateInput placeholder="เลือกวันที่" />}
                  />
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>สถานะเอกสาร</div>
                <select
                  className="form-select"
                  style={{ fontFamily: "kanit", fontSize: 13, height: 38 }}
                  value={dnEditStatus}
                  onChange={(e) => setDnEditStatus(e.target.value)}
                >
                  <option value="รออนุมัติ">รออนุมัติ</option>
                  <option value="อนุมัติ">อนุมัติ</option>
                  <option value="ยกเลิก">ยกเลิก</option>
                </select>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#0f172a", marginBottom: 8 }}>เงื่อนไขการชำระเงิน</div>
                <div className="d-flex" style={{ gap: 18, flexWrap: "wrap" }}>
                  {[
                    { key: "cash", label: "เงินสด" },
                    { key: "credit", label: "เงินเชื่อ (เครดิต)" },
                    { key: "deposit", label: "เงินมัดจำ" },
                  ].map((opt) => (
                    <label key={opt.key} style={{ fontFamily: "kanit", fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="dn_edit_paytype"
                        value={opt.key}
                        checked={dnEditPayType === opt.key}
                        onChange={() => setDnEditPayType(opt.key as any)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>

                {dnEditPayType === "deposit" && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>ยอดเงินมัดจำ (บาท)</div>
                    <input
                      type="number"
                      className="form-control"
                      style={{ fontFamily: "kanit", fontSize: 13, height: 38, maxWidth: 220 }}
                      value={dnEditDeposit}
                      onChange={(e) => setDnEditDeposit(e.target.value)}
                    />
                  </div>
                )}

                {(dnEditPayType === "credit" || dnEditPayType === "deposit") && (
                  <div style={{ marginTop: 12, border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", backgroundColor: "#f8fafc" }}>
                    <div className="d-flex" style={{ justifyContent: "space-between", fontFamily: "kanit", fontSize: 13, color: "#334155" }}>
                      <span>ยอดรวมทั้งหมด</span>
                      <span style={{ fontFamily: "kanit_B" }}>{formatDocumentCurrency(grandTotal)} บาท</span>
                    </div>
                    {dnEditPayType === "deposit" && (
                      <div className="d-flex" style={{ justifyContent: "space-between", fontFamily: "kanit", fontSize: 13, color: "#334155", marginTop: 4 }}>
                        <span>หักเงินมัดจำ</span>
                        <span style={{ fontFamily: "kanit_B" }}>-{formatDocumentCurrency(dnEditDeposit)} บาท</span>
                      </div>
                    )}
                    <div className="d-flex" style={{ justifyContent: "space-between", fontFamily: "kanit_B", fontSize: 14, color: "#b45309", marginTop: 6, paddingTop: 6, borderTop: "1px solid #e2e8f0" }}>
                      <span>ยอดคงเหลือที่ต้องชำระ</span>
                      <span>{formatDocumentCurrency(balancePreview)} บาท</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>หมายเหตุ</div>
                <textarea
                  className="form-control"
                  style={{ fontFamily: "kanit", fontSize: 13, minHeight: 80 }}
                  value={dnEditRemark}
                  onChange={(e) => setDnEditRemark(e.target.value)}
                />
              </div>
            </Modal_dne.Body>
            <Modal_dne.Footer>
              <button
                className="btn btn-success"
                style={{ width: 90, height: 35, fontSize: 14, fontFamily: "Kanit" }}
                disabled={dnSaving}
                onClick={saveEdit}>
                {dnSaving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={() => setShowdne(false)}>
                ปิด
              </button>
            </Modal_dne.Footer>
          </Modal_dne>
        </>
      )
    }

    return (
      <>
        <div className="col">
          <div className='d-flex align-items-center justify-content-between mb-1 mt-1' style={{ gap: 12 }}>
            <div className="d-flex align-items-center" style={{ gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #0d9488, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Truck size={16} color="white" />
              </div>
              <div style={{ fontFamily: "kanit_B", fontSize: 18, color: "#1f2937" }}>ใบส่งสินค้า</div>
            </div>
            <div style={{
              fontFamily: "kanit", fontSize: 12, color: "#0f766e", backgroundColor: "#f0fdfa",
              border: "1px solid #99f6e4", borderRadius: 8, padding: "6px 12px",
            }}>
              สร้างใบส่งสินค้าได้จากหน้า <span style={{ fontFamily: "kanit_B" }}>ขายสินค้า</span> (เอกสารประกอบบิล)
            </div>
          </div>
          <table className="table table-hover" style={{ borderCollapse: "separate", borderSpacing: "0" }}>
            <thead>
              <tr>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>วันที่สร้าง</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>เลขที่เอกสาร</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>ชื่อลูกค้า/ชื่อโปรเจค</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>เงื่อนไขชำระเงิน</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>ยอดคงเหลือชำระ</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>สถานะ</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center", width: 320 }}>จัดการ</td>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ fontFamily: "kanit", fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "30px 12px" }}>
                    ยังไม่มีใบส่งสินค้า
                  </td>
                </tr>
              )}
              {rows.map((a: any) =>
                <tr key={a.id} onClick={() => setSelectedDocRow(a)} style={{ cursor: "pointer", backgroundColor: selectedDocRow?.id === a.id ? "#f0fdfa" : undefined }}>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40 }}>
                    {a.dn_date === null ? "-" : new Date(a.dn_date).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40 }}>
                    {a.dn_orderfull || `DN${a.dn_orderNo || ""}${a.dn_number || ""}`}
                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40 }}>{a.name_costomer}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 12, height: 40, textAlign: "center" }}>
                    {deliveryPayTypeLabelMap[a.dn_paytype] || "-"}
                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>
                    {a.dn_balance === null || a.dn_balance === undefined ? "-" : Number(a.dn_balance).toFixed(1)}
                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>
                    <span style={{
                      fontFamily: "kanit", fontSize: 11, padding: "3px 12px", borderRadius: 20,
                      backgroundColor: a.dn_status === "อนุมัติ" ? "#D3F0E2" : a.dn_status === "รออนุมัติ" ? "#fef3c7" : a.dn_status === "ยกเลิก" ? "#fee2e2" : "#e0e7ff",
                      color: a.dn_status === "อนุมัติ" ? "#0C5238" : a.dn_status === "รออนุมัติ" ? "#92400e" : a.dn_status === "ยกเลิก" ? "#991b1b" : "#3730a3",
                      fontWeight: 600,
                    }}>{a.dn_status || "-"}</span>
                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, textAlign: "center", height: 50 }} onClick={(e) => e.stopPropagation()}>
                    {a.dn_status === "รออนุมัติ" && (
                      <button
                        onClick={() => approveDelivery(a)}
                        style={{ fontSize: 11, height: 28, marginLeft: 5, padding: "0 12px", borderRadius: 8, border: "1px solid #2A6AAA", backgroundColor: "white", color: "#2A6AAA", fontFamily: "kanit", cursor: "pointer", transition: "all 0.2s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#2A6AAA"; e.currentTarget.style.color = "white" }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = "#2A6AAA" }}>
                        อนุมัติ
                      </button>
                    )}

                    <button
                      onClick={() => openEdit(a)}
                      style={{ fontSize: 11, height: 28, marginLeft: 5, padding: "0 12px", borderRadius: 8, border: "1px solid #2A6AAA", backgroundColor: "white", color: "#2A6AAA", fontFamily: "kanit", cursor: "pointer", transition: "all 0.2s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#2A6AAA"; e.currentTarget.style.color = "white" }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = "#2A6AAA" }}>
                      แก้ไข
                    </button>

                    <button
                      onClick={() => openPrint(a)}
                      style={{ fontSize: 11, height: 28, marginLeft: 5, padding: "0 12px", borderRadius: 8, border: "1px solid #0f766e", backgroundColor: "white", color: "#0f766e", fontFamily: "kanit", cursor: "pointer", transition: "all 0.2s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#0f766e"; e.currentTarget.style.color = "white" }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = "#0f766e" }}>
                      พิมพ์
                    </button>

                    <button
                      onClick={() => { maxV2(); setids(a.id); setidcus(a.id_costomer); localStorage.setItem("iddoc", a.id); setShowie(true) }}
                      style={{ fontSize: 11, height: 28, marginLeft: 5, padding: "0 12px", borderRadius: 8, border: a.inv_status ? "1px solid #d97706" : "1px solid #7c3aed", backgroundColor: "white", color: a.inv_status ? "#d97706" : "#7c3aed", fontFamily: "kanit", cursor: "pointer", transition: "all 0.2s ease" }}
                      onMouseEnter={(e) => { const c = a.inv_status ? "#d97706" : "#7c3aed"; e.currentTarget.style.backgroundColor = c; e.currentTarget.style.color = "white" }}
                      onMouseLeave={(e) => { const c = a.inv_status ? "#d97706" : "#7c3aed"; e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = c }}>
                      {a.inv_status ? "ใบแจ้งหนี้" : "สร้างใบแจ้งหนี้"}
                    </button>

                    <button
                      onClick={() => { maxV3(); setids(a.id); setidcus(a.id_costomer); localStorage.setItem("iddoc", a.id); setShowee(true) }}
                      style={{ fontSize: 11, height: 28, marginLeft: 5, padding: "0 12px", borderRadius: 8, border: a.re_status ? "1px solid #d97706" : "1px solid #db2777", backgroundColor: "white", color: a.re_status ? "#d97706" : "#db2777", fontFamily: "kanit", cursor: "pointer", transition: "all 0.2s ease" }}
                      onMouseEnter={(e) => { const c = a.re_status ? "#d97706" : "#db2777"; e.currentTarget.style.backgroundColor = c; e.currentTarget.style.color = "white" }}
                      onMouseLeave={(e) => { const c = a.re_status ? "#d97706" : "#db2777"; e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = c }}>
                      {a.re_status ? "ใบเสร็จรับเงิน" : "สร้างใบเสร็จรับเงิน"}
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <DeliveryNoteTemplate />
        <DeliveryNoteTemplate_Edit />
      </>
    )
  }

  //*****************   ใบแจ้งหนี้  ***************************/
  const Invoice = () => {

    //******** */ input Preview *********************
    function BillTemplate() {

      let taxNum = allQT.taxnumber

      //Print Label
      const contentRef = useRef<HTMLDivElement>(null);
      const reactToPrintFn2 = useReactToPrint({
        contentRef,
        documentTitle: allQT.inv_orderfull || `INV${allQT.inv_orderNo || ""}${allQT.inv_number || ""}`,
        pageStyle: PROFESSIONAL_DOCUMENT_PRINT_PAGE_STYLE,
      });



      return (


        <>

          <Modal_blv
            show={showiv}
            onHide={() => setShowiv(false)}
            size="lg"
            scrollable={true}
            //  fullscreen={true}
            //  dialogClassName="80w"
            aria-labelledby="example-custom-modal-styling-title"
          >
            <Modal_blv.Header closeButton>
              <Modal_blv.Title id="example-custom-modal-styling-title">
                <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>ใบแจ้งหนี้</div>
              </Modal_blv.Title>
            </Modal_blv.Header>
            <Modal_blv.Body style={{ backgroundColor: "grey" }}>

              <div
                className="document-print-sheet"
                style={PROFESSIONAL_DOCUMENT_PRINT_SHEET_STYLE}
                ref={contentRef}
              >
                {renderSalesPrintDocument({
                  docType: "inv",
                  title: "ใบแจ้งหนี้",
                  englishTitle: "INVOICE",
                  dateValue: allQT.inv_date,
                  endDateValue: allQT.inv_enddate,
                  creditValue: allQT.inv_credit,
                  personName: allQT.inv_person || allQT.qt_person,
                  remark: allQT.inv_remark,
                  taxNum,
                  status: allQT.inv_status,
                  customerRoleLabel: "ผู้รับใบแจ้งหนี้",
                  companyRoleLabel: "ผู้อนุมัติ",
                })}
                <div style={{ display: "none" }} aria-hidden="true">


                <div className="row" style={{ height: 24 }}></div>
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
                    <div className="row " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{all.names}</div>
                    <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{all.address}</div>
                    <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{all.numbertax}</div>
                    <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {all.tel}</div>

                  </div>

                  {/**ใบเสนราคา */}
                  <div className="col ">
                    <div className="row "
                      style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 20, justifySelf: "center" }}>
                      ใบแจ้งหนี้
                    </div>
                    <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                    <div className="row">
                      <div className="col-4 ">
                        <div style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เลขที่ :</div>
                        <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ :</div>
                        <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เครดิต :</div>
                        <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ครบกำหนด :</div>
                        <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>ผู้ขาย :</div>
                      </div>

                      <div className="col ">
                        <div className="col " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>INV{allQT.inv_orderNo}{allQT.inv_number}</div>
                        <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>
                          {allQT.inv_date === null ? "." : <div>{new Date(allQT.inv_date).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}</div>} </div>
                        <div className="mt-1 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{allQT.inv_credit}</div>
                        <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>
                          {allQT.inv_date === null ? "." : <div>{new Date(allQT.inv_enddate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}</div>}  </div>
                        <div className="mt-1 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{allQT.inv_person}</div>
                      </div>
                    </div>
                    <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                  </div>
                </div>

                <div className="row mt-3" style={{ marginLeft: 20, marginRight: 20 }}>
                  <table
                    className="invoice-print-items"
                    style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}
                  >
                    <thead>
                      <tr>
                        <th style={{ width: 32, fontFamily: "kanit_B", fontSize: 10, textAlign: "center", padding: "6px 4px", borderTop: "1px solid black", borderBottom: "1px solid black" }}>ลำดับ</th>
                        <th style={{ fontFamily: "kanit_B", fontSize: 10, textAlign: "left", padding: "6px 8px", borderTop: "1px solid black", borderBottom: "1px solid black" }}>รายการ</th>
                        <th style={{ width: 46, fontFamily: "kanit_B", fontSize: 10, textAlign: "center", padding: "6px 4px", borderTop: "1px solid black", borderBottom: "1px solid black" }}>จำนวน</th>
                        <th style={{ width: 52, fontFamily: "kanit_B", fontSize: 10, textAlign: "center", padding: "6px 4px", borderTop: "1px solid black", borderBottom: "1px solid black" }}>หน่วย</th>
                        <th style={{ width: 72, fontFamily: "kanit_B", fontSize: 10, textAlign: "right", padding: "6px 4px", borderTop: "1px solid black", borderBottom: "1px solid black" }}>ราคาต่อหน่วย</th>
                        <th style={{ width: 52, fontFamily: "kanit_B", fontSize: 10, textAlign: "right", padding: "6px 4px", borderTop: "1px solid black", borderBottom: "1px solid black" }}>ลด/ชิ้น</th>
                        <th style={{ width: 52, fontFamily: "kanit_B", fontSize: 10, textAlign: "right", padding: "6px 4px", borderTop: "1px solid black", borderBottom: "1px solid black" }}>รวม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qt_detail.map((a: any, index: number) => (
                        <tr key={a.id} id="selcet-print">
                          <td style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", padding: "4px 4px", verticalAlign: "top", borderBottom: "1px solid #d1d5db" }}>{index + 1}</td>
                          <td style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", padding: "4px 8px", verticalAlign: "top", borderBottom: "1px solid #d1d5db", wordBreak: "break-word" }}>{a.name_product}</td>
                          <td style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", padding: "4px 4px", verticalAlign: "top", borderBottom: "1px solid #d1d5db" }}>{a.qty}</td>
                          <td style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", padding: "4px 4px", verticalAlign: "top", borderBottom: "1px solid #d1d5db" }}>{a.unit}</td>
                          <td style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", padding: "4px 4px", verticalAlign: "top", borderBottom: "1px solid #d1d5db" }}>{a.price}</td>
                          <td style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", padding: "4px 4px", verticalAlign: "top", borderBottom: "1px solid #d1d5db" }}>{a.discount}</td>
                          <td style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", padding: "4px 4px", verticalAlign: "top", borderBottom: "1px solid #d1d5db" }}>{a.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>


                  {/**ท้ายบิล Slip */}
                  <div className="container invoice-print-footer-block">
                    <div className="row mt-2">
                      <div className="col ">
                        <div className="row mb-3 " style={{ fontFamily: "kanit", fontSize: 11, justifySelf: "left", marginLeft: 3 }}>ทั้งหมด : {qt_detail.length} รายการ  </div>
                        <InputGroup>
                          <InputGroup.Text style={{ textAlign: "left", fontFamily: "Kanit", fontSize: 11, height: 60, borderColor: "black", backgroundColor: "white" }}>หมายเหตุ</InputGroup.Text>
                          <Form.Control
                            style={{ fontFamily: "Kanit", fontSize: 12, backgroundColor: "white", borderColor: "black" }}
                            disabled={true}
                            as="textarea"
                            aria-label="With textarea"
                            value={allQT.inv_remark ?? ""}


                          />

                        </InputGroup>

                      </div>

                      <div className="col ">
                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>รวมเงิน :</div>
                          <div className=" bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20, }}>{allQT.sumtotal}</div>
                          <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ส่วนลดท้ายบิล :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{allQT.discount}</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ใช้แต้มส่วนลด :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{allQT.usereward}</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        {String(taxNum) === "" ? "" :
                          <div>
                            <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>จำนวนเงินรวมทั้งสิ้น :</div>
                              <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{allQT.totalall} </div>
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                            </div>
                            <div className="row" style={{ justifySelf: "right", width: "70%", height: 1, backgroundColor: "black" }}></div>
                            <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>หักภาษี ณ ที่จ่าย {allQT.taxnumber} % :</div>
                              <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{((Number(allQT.totalall) * Number(allQT.taxnumber)) / 100).toFixed(1)}
                              </div>
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                            </div>
                          </div>
                        }

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 30 }}>ยอดชำระทั้งหมด :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 30 }}>{
                            (((Number(allQT.totalall) * Number(allQT.taxnumber)) / 100) + Number(allQT.totalall)).toFixed(1)
                          }</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 30 }}>บาท</div>
                        </div>
                        <div className="row" style={{ justifySelf: "right", width: "70%", height: 1, backgroundColor: "black" }}></div>
                      </div>

                    </div>
                    <div className="h-5"></div>
                  </div>


                  <div className="row mt-3 invoice-print-signatures">
                    <div className="col-5" style={{ justifyItems: "center" }}>
                      <div className="row">
                        <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ลงนาม</div></div>
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
                        <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ลงนาม</div></div>

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



              </div>




            </Modal_blv.Body>
            <Modal_blv.Footer>

              <button
                className="btn btn-primary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={reactToPrintFn2}>
                Print
              </button>

              <button
                className="btn btn-secondary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={() => setShowiv(false)}>
                ปิด
              </button>

            </Modal_blv.Footer>
          </Modal_blv>

        </>

      )
    }

    //******* */ input Edit ************************


    function BillTemplate_Edit() {

      let taxNum = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
        String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
          String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""

      //****** */ input Radio Tax *************
      const [selectedOptiontax, setSelectedOptiontax] = useState('notax');

      //******* เปลี่ยน Tax ภาษี ******************
      const Radio_tax = () => {

        useEffect(() => {
          setSelectedOptiontax(localStorage.getItem("numbertax_S") || "")
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

      //********* เปลี่ยนส่วนลดท้ายบิล ****************         
      const Discount_s = () => {

        const [discountS, setdiscountS] = useState('0')

        useEffect(() => {
          setdiscountS(localStorage.getItem("discount_s") || "")

        }, [Number(discountS)]);


        const [show2, setShow2] = useState(false);

        // Update Quatation
        const EditQuatation = async () => {

          const totalall = Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0))
          const discount = Number(discountS)
          const sumtotal = Number(Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(discountS) - Number(parseInt(allQT.usereward)))

          const usereward = Number(allQT.usereward)
          const taxnumber = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
            String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
              String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""
          const personall = allQT.person
          const statussall = allQT.statuss
          const qt_status = allQT.qt_status
          const qt_person = allQT.qt_person
          const qt_remark = allQT.qt_remark

          try {
            //  localStorage.setItem("show","1")
            //  Save Sale
            await axios.put(`/api/${apiquatation}/${Number(localStorage.getItem("iddoc") || "")}`,
              {

                totalall, discount, sumtotal, usereward, personall, statussall, taxnumber


              })
            await fetchQT_ID()

          } catch (error) {
            console.error(error)
          }
        }
        return (


          <>

            <button
              type="button"
              className="btn btn-outline-success "
              style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", height: 27, width: 40 }}
              onClick={() => { setShow2(true), localStorage.setItem("discount_s", "0") }}
            >
              {Number(allQT.discount)}
            </button>

            <Modal_dc
              show={show2}
              onHide={() => setShow2(false)}
              className="document-modal detail-editor-modal"
              dialogClassName="document-modal-dialog modal-90w"
              backdropClassName="document-modal-backdrop detail-editor-modal-backdrop"
              animation={false}
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

                <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit_B", marginTop: 10, textAlign: "left", height: 35 }}>
                  ส่วนลดรวม : &nbsp;&nbsp;{Number(discountS)}&nbsp;&nbsp; บาท  </div>

              </Modal_dc.Body>
              <Modal_dc.Footer>
                <button
                  className="btn btn-success"

                  style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                  onClick={() => {
                    setShow2(false),
                      setQT({ ...allQT, discount: discountS }),
                      setdiscountS(localStorage.getItem("discount_s") || "")
                    EditQuatation()
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

      const modale = useDisclosure()
      const [priceAct, setEditedpriceAct] = useState<string>("");
      const [priceDis, setEditedpriceDis] = useState<string>("");
      const [editedcode, setEditedcode] = useState<string>("");
      const [editedTaskname, setEditedname] = useState<string>("");
      const [editqty, setEditedqty] = useState<string>("");
      const [editqtyCh, setEditedqtyCh] = useState<string>("");
      const [editid, setid] = useState<number>(0);
      const [editiddoc, setiddoc] = useState<number>(0);

      const [showD, setShowD] = useState(false);
      const [showqty, setShowqty] = useState(false);

      const [remarkQ, setremarkQ] = useState(allQT.re_remark || allQT.qt_remark || "")
      useEffect(() => { setremarkQ(allQT.re_remark || allQT.qt_remark || "") }, [allQT.re_remark, allQT.qt_remark])

      const [st, setst] = useState("")
      /***************************************** */

      //***Order Date Diff */
      let dateS = getSafeDocumentDate(allQT.inv_date)
      let dateE = getSafeDocumentDate(allQT.inv_enddate)
      const [startDate, setStartDate] = useState(dateS);
      const [startDate1, setStartDate1] = useState(dateE);

      useEffect(() => {
        if (ids === 0) return

        setStartDate(getSafeDocumentDate(allQT.inv_date))
        setStartDate1(getSafeDocumentDate(allQT.inv_enddate))
      }, [ids, allQT.inv_date, allQT.inv_enddate]);



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


      // Update Quatation
      const EditQuatation = async () => {

        const totalall = Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0))
        const discount = Number(allQT.discount)
        const sumtotal = Number(Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(allQT.discount) - Number(parseInt(allQT.usereward)))

        const usereward = Number(allQT.usereward)
        const taxnumber = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
          String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
            String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""
        const personall = allQT.person
        const statussall = allQT.statuss
        const inv_date = new Date(startDate)
        const inv_enddate = new Date(startDate1)
        const inv_credit = Number(daysDiff)
        const inv_status = localStorage.getItem("st") || ""
        const inv_person = allQT.inv_person || allQT.qt_person
        const inv_remark = remarkQ
        const inv_orderNo = String(year) + String(month) + String(day)
        const inv_number = maxRecN2
        const inv_orderfull = "INV" + String(year) + String(month) + String(day) + maxRecN2

        try {
          //   localStorage.setItem("show","1")
          //Save Sale
          await axios.put(`/api/${apiquatation}/${Number(localStorage.getItem("iddoc") || "")}`,
            {

              totalall, discount, sumtotal, usereward, personall, statussall, taxnumber,
              inv_status, inv_person, inv_remark, inv_date, inv_enddate, inv_credit, inv_orderNo, inv_number, inv_orderfull

            })

          setTimeout(() => {
            fetchQT_ID()
            fetchQT()
          }, 700);


        } catch (error) {
          console.error(error)
        }
      }

      // Update Quatation_Detail
      const EditQuatation_Detail = async () => {

        const qty = Number(editqtyCh)
        const price = Number(priceAct)
        const discount = Number(priceDis)
        const total = Number(Number(editqtyCh) * (Number(priceAct) - Number(priceDis)))
        const person = ""


        try {
          await axios.put(`/api/${apiquatation_detail}/${Number(editid)}`,
            {

              qty, price, discount, total, person


            })

          await fetchQT_IDDetail()
          await setTimeout(() => {
            EditQuatation()

          }, 1000);

        } catch (error) {
          console.error(error)
        }
      }


      //******** */ Search สินค้า*****************/
      function Search_Product() {

        //*******Show Modal **********************************/
        const [show1, setShow1] = useState(false);
        const handleClose = () => setShow1(false);
        const handleShow = () => setShow1(true);
        const handleClose1 = () => { Post_Quatation_Detail(), setShow1(false) };
        //******* */  Key ค้นหา สินค้า  ************************/
        const [data, setData] = useState(dataProduct);
        const [search, setsearch] = useState("")

        const handleChange = (value: any) => {
          setsearch(value);
          filterDataProduct(value);
        };

        // filter records by Productname
        const filterDataProduct = (value: any) => {
          const lowercasedValue = String(value || "").toLowerCase().trim();
          if (lowercasedValue === "") setData(dataProduct);
          else {
            const filteredData = dataProduct.filter((user: any) =>
              String(user?.ProductName || "").toLowerCase().includes(lowercasedValue)
              || String(user?.code || "").toLowerCase().includes(lowercasedValue)
              || String(user?.Barcode || "").toLowerCase().includes(lowercasedValue)
            );
            setData(filteredData);
          }
        };

        const [idP, setidP] = useState("")
        const [code, setcode] = useState("")
        const [product, setProduct] = useState("")
        const [priceS, setprice] = useState("")
        const [unitS, setunit] = useState("")
        const [qtyP, setqtyP] = useState("1")

        // Update Quatation_Detail
        const Post_Quatation_Detail = async () => {
          let currentIds = ids
          if (!currentIds || currentIds === 0) {
            const newId = await createNewDocMain("inv")
            if (!newId) return
            currentIds = newId
          }
          const company = String(localStorage.getItem("company_") || "")
          const id_product = Number(idP)
          const code_product = code
          const name_product = product
          const unit = unitS
          const qty = Number(qtyP)
          const price = Number(priceS)
          const total = Number(qtyP) * Number(priceS)
          const person = ""
          const id_docmain = Number(currentIds)


          try {
            await axios.post(`/api/${apiquatation_detail}`,
              {
                unit, qty, price, total, person, company, id_product, code_product, name_product, id_docmain

              })

            await fetchQT_IDDetail(currentIds)


          } catch (error) {
            console.error(error)
          }
        }



        return (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleShow(); }}
              style={{
                fontFamily: "Kanit", fontSize: 13, padding: "6px 16px", borderRadius: 8,
                border: "1.5px solid #2A6AAA", backgroundColor: "#F3F8FC", color: "#2A6AAA",
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                transition: "all 0.15s", whiteSpace: "nowrap", fontWeight: 600,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#E5EEF8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#F3F8FC"; }}
            >
              + เพิ่มสินค้า
            </button>

            <Modal1 show={show1} onHide={handleClose} className="document-modal product-picker-modal" dialogClassName="document-modal-dialog" backdropClassName="document-modal-backdrop product-picker-modal-backdrop">
              <Modal1.Header closeButton>
                <Modal1.Title
                  style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, height: 20 }}>
                  ค้นหาชื่อ, รหัส, Barcode สินค้า
                </Modal1.Title>
              </Modal1.Header>
              <Modal1.Body>
                <div>
                  <div className={styles.bodydetailTable_Re} style={{ width: "4vw" }}>ค้นหา</div>
                  <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                    <input
                      value={search}
                      onChange={(e) => handleChange(e.target.value)}
                      className="form-control form-control-sm"
                      placeholder="ค้นหาชื่อ, รหัส, Barcode สินค้า"
                      style={{ fontFamily: "Kanit", fontSize: 10, height: 12 }} />
                  </div>

                  <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
                    <table className="table table-sm table-hover"   >
                      <thead style={{ position: "sticky", top: "0" }}>
                        <tr>
                          <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "4vw" }}>
                            <div style={{ width: "4vw" }}>รหัสสินค้า</div>

                          </th>
                          <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "15vw" }}>
                            <div style={{ width: "15vw" }}>ชื่อสินค้า</div>

                          </th>
                          <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "7vw" }}>
                            <div style={{ width: "7vw" }}>barcode</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="table-group-divider " >
                        {data.map((post: any) => (
                          <tr key={post.id}
                            onClick={() => {
                              setidP(post.id),
                                setcode(post.code),
                                setProduct(post.ProductName),
                                setprice(post.price),
                                setunit(post.Unit)

                            }}>
                            <td className={styles.bodydetailTable_Re1} style={{ width: "4vw" }}>{post.code}</td>
                            <td className={styles.bodydetailTable_Re1} style={{ width: "15vw" }}>{post.ProductName}</td>
                            <td className={styles.bodydetailTable_Re1} style={{ width: "7vw" }}>{post.Barcode}</td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
                <div className='row'>
                  <div className='d-flex mt-1'>
                    <div style={{ fontFamily: "Kanit_B", textAlign: "left", fontSize: 15 }}>{code}</div>
                    <div style={{ fontFamily: "Kanit_B", textAlign: "left", fontSize: 15, marginLeft: 10 }}>{product}</div>
                  </div>
                  <div className='d-flex mt-2'>
                    <div style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, marginLeft: 10, marginTop: 10 }}>ราคา :&nbsp;&nbsp; {priceS}&nbsp;&nbsp; บาท&nbsp;&nbsp;&nbsp; จำนวน</div>
                    <input
                      className="form-control form-control-sm "

                      style={{ width: 50, marginLeft: 10, marginRight: 10, height: 20, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                      value={qtyP}
                      onChange={(e) => setqtyP(e.target.value)} />
                    <div style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, marginLeft: 10, marginTop: 10 }}>{unitS}&nbsp;&nbsp;ราคารวม : &nbsp;&nbsp;{Number(qtyP) * Number(priceS)}&nbsp;&nbsp; บาท</div>
                  </div>


                </div>

              </Modal1.Body>
              <Modal1.Footer >

                <Button1
                  variant="secondary"
                  onClick={handleClose}
                  style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}
                >
                  ปิด
                </Button1>
                <Button1
                  variant="primary"
                  onClick={handleClose1}
                  style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}
                >
                  เพิ่ม
                </Button1>
              </Modal1.Footer>
            </Modal1>
          </>
        );
      }

      const invoiceNumberDisplay = allQT.inv_number === null || allQT.inv_number === undefined
        ? `INV${year}${month}${day}${maxRecN2}`
        : `INV${allQT.inv_orderNo}${allQT.inv_number}`

      const openQuantityEditor = (detail: any) => {
        setShowqty(true)
        setEditedpriceDis(String(detail.discount || "0"))
        setEditedpriceAct(String(detail.price || "0"))
        setEditedqty(String(detail.qty || "0"))
        setEditedqtyCh(String(detail.qty || "0"))
        setEditedcode(String(detail.code_product || ""))
        setEditedname(String(detail.name_product || ""))
        setid(Number(detail.id || 0))
        setiddoc(Number(detail.id_docmain || 0))
        localStorage.setItem("idd", String(detail.id_docmain || 0))
      }

      const openDiscountEditor = (detail: any) => {
        setShowD(true)
        setEditedpriceDis(String(detail.discount || "0"))
        setEditedpriceAct(String(detail.price || "0"))
        setEditedqty(String(detail.qty || "0"))
        setEditedqtyCh(String(detail.qty || "0"))
        setEditedcode(String(detail.code_product || ""))
        setEditedname(String(detail.name_product || ""))
        setid(Number(detail.id || 0))
        setiddoc(Number(detail.id_docmain || 0))
        localStorage.setItem("idd", String(detail.id_docmain || 0))
      }

      const updateInvoiceStatus = async (nextStatus: string) => {
        localStorage.setItem("st", nextStatus)
        setst(nextStatus)
        if (ids === 0) {
          const newId = await createNewDocMain("inv")
          if (!newId) return
        }
        setTimeout(() => {
          EditQuatation()
        }, 500)
      }

      return (


        <>

          {useModernSalesDocumentLayout ? (
            <Modal_ble
              show={showie}
              onHide={() => setShowie(false)}
              size="xl"
              scrollable={true}
              className="document-modal"
              dialogClassName="document-modal-dialog"
              backdropClassName="document-modal-backdrop"
              animation={false}
              enforceFocus={false}
              aria-labelledby="example-custom-modal-styling-title"
            >
              <Modal_ble.Header closeButton style={{ borderBottom: "1px solid #e5e7eb", padding: "16px 24px", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" }}>
                <Modal_ble.Title id="example-custom-modal-styling-title" style={{ width: "100%" }}>
                  {renderDocumentModalTitle({
                    title: "ใบแจ้งหนี้",
                    docDisplay: invoiceNumberDisplay,
                    status: allQT.inv_status,
                    icon: <FileCheck size={18} color="white" />,
                    iconBackground: "linear-gradient(135deg, #1E5088, #3E86C7)",
                  })}
                </Modal_ble.Title>
              </Modal_ble.Header>

              {renderDocumentWorkflowStepper("INV")}

              <Modal_ble.Body style={{ backgroundColor: "#f8fafc", padding: "20px 24px" }}>
                {renderDocumentInfoGrid({
                  docType: "inv",
                  docDisplay: invoiceNumberDisplay,
                  startDate,
                  setStartDate,
                  startDate1,
                  setStartDate1,
                  creditDays: daysDiff,
                  personDisplay: allQT.inv_person || allQT.qt_person,
                  detailIcon: <FileCheck size={14} color="#2A6AAA" />,
                })}
                {renderDocumentItemsSection({
                  searchProductControl: renderProductSearchControl("inv"),
                  onEditQuantity: openQuantityEditor,
                  onEditDiscount: openDiscountEditor,
                  onDeleteItem: DeleteQT_ID,
                  showqty,
                  setShowqty,
                  showD,
                  setShowD,
                  priceAct,
                  setEditedpriceAct,
                  priceDis,
                  setEditedpriceDis,
                  editedcode,
                  editedTaskname,
                  editqty,
                  editqtyCh,
                  setEditedqtyCh,
                  onApplyDetailEdit: EditQuatation_Detail,
                })}
                {renderDocumentSummarySection({
                  remarkQ,
                  setremarkQ,
                  discountControl: <Discount_s />,
                  taxNum,
                  attachmentDocType: "inv",
                })}
                {renderDocumentSignatureSection()}
              </Modal_ble.Body>

              <Modal_ble.Footer style={{ borderTop: "1px solid #e5e7eb", padding: "12px 24px", background: "#fafbfc", justifyContent: "space-between" }}>
                {renderDocumentFooterActions({
                  taxControl: <Radio_tax />,
                  createControl: renderDocumentCreateDropdown("inv"),
                  status: allQT.inv_status,
                  onChangeStatus: updateInvoiceStatus,
                  onSave: async () => {
                    if (ids === 0) {
                      const newId = await createNewDocMain("inv")
                      if (!newId) return
                    }
                    EditQuatation()
                    setShowie(false)
                    fetchQT_ID()
                  },
                  onClose: () => setShowie(false),
                })}
              </Modal_ble.Footer>
            </Modal_ble>
          ) : (

          <Modal_ble
            show={showie}
            onHide={() => setShowie(false)}
            size="lg"
            scrollable={true}
            className="document-modal"
            dialogClassName="document-modal-dialog"
            backdropClassName="document-modal-backdrop"
            animation={false}
            enforceFocus={false}
            aria-labelledby="example-custom-modal-styling-title"
          >
            <Modal_ble.Header closeButton>
              <Modal_ble.Title id="example-custom-modal-styling-title">
                <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>สร้างใบแจ้งหนี้</div>
              </Modal_ble.Title>
            </Modal_ble.Header>
            <Modal_ble.Body style={{ backgroundColor: "grey" }}>

              <div className="col  " style={{ justifySelf: "center", backgroundColor: "white", marginLeft: 20, marginRight: 20 }}  >


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
                    <div className="row " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{all.names}</div>
                    <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{all.address}</div>
                    <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{all.numbertax}</div>
                    <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {all.tel}</div>

                  </div>

                  {/**ใบเสนราคา */}
                  <div className="col ">
                    <div className="row "
                      style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 20, justifySelf: "center" }}>
                      ใบแจ้งหนี้
                    </div>
                    <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                    <div className="row">
                      <div className="col-4 ">
                        <div style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เลขที่ :</div>
                        <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ :</div>
                        <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เครดิต :</div>
                        <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันครบกำหนด :</div>
                        <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>ผู้ขาย :</div>
                      </div>

                      <div className="col ">
                        <div className="col " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>

                          {allQT.inv_number === null ? <div>INV{year}{month}{day}{maxRecN2}</div> :
                            <div>INV{allQT.inv_orderNo}{allQT.inv_number}</div>}


                        </div>


                        <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>

                          {/**Open */}
                          <div className='border border-black shadow shadow-sm rounded ' style={{ width: 130, height: 25 }}>
                            <div style={{ width: 100, marginLeft: 10, marginTop: 2 }}>
                              <DatePicker
                                value={
                                  allQT.inv_date === null ?
                                    new Date().toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', }) :
                                    new Date(startDate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
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
                              <DatePicker value=
                                {
                                  allQT.inv_enddate === null ?
                                    new Date().toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', }) :
                                    new Date(startDate1).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                                selected={startDate1} 
                                onChange={(date: any) => setStartDate1(date)} />
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>ชื่อผู้ขาย</div>

                        <div className="mt-1 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{allQT.qt_person}</div>
                      </div>
                    </div>
                    <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                  </div>
                </div>

                <div className="row mt-3" style={{ marginLeft: 20, marginRight: 20 }}>
                  <div className="d-flex bd-highlight" style={{ justifySelf: "right" }}>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit_B", fontSize: 10, textAlign: "center", height: 15, width: 32 }}>ลำดับ</div>
                    <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit_B", fontSize: 11, textAlign: "start", height: 15, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>รายการ</div>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 45 }}>จำนวน</div>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>หน่วย</div>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 70 }}>ราคาต่อหน่วย</div>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>ลด/ชิ้น</div>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>รวม</div>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>ลบ</div>
                  </div>
                  <div className="mt-1 " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                  <table className="table table-hover"   >
                    <tbody className="">
                      <tr className="">
                        <td className="">
                          {qt_detail.sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)))
                            .map((a: any) =>
                              <div key={a.id} id="selcet-print">
                                <div className="d-flex bd-highlight" style={{ justifyItems: "end" }} >
                                  <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit", fontSize: 12, textAlign: "start", height: 30, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>{a.name_product}</div>
                                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 12, textAlign: "center", height: 30, width: 30 }}>

                                    <>
                                      <button

                                        className="btn btn-outline-success btn-sm"
                                        style={{ height: 24, fontSize: 12, fontFamily: "Kanit_B", width: 35 }}
                                        onClick={() => {
                                          setShowqty(true),
                                            setEditedpriceDis(String(a.discount)),
                                            setEditedpriceAct(String(a.price)),
                                            setEditedqty(String(a.qty)),
                                            setEditedqtyCh(String(a.qty)),
                                            setEditedcode(String(a.code_product)),
                                            setEditedname(String(a.name_product)),
                                            setid(Number(a.id)),
                                            setiddoc(Number(a.id_docmain)),
                                            localStorage.setItem("idd", String(a.id_docmain))

                                        }}>
                                        {a.qty}
                                      </button>
                                      <Modal_qty
                                        show={showqty}
                                        onHide={() => setShowqty(false)}
                                        dialogClassName="modal-90w"
                                        aria-labelledby="example-custom-modal-styling-title"
                                      >
                                        <Modal_qty.Header closeButton>
                                          <Modal_qty.Title id="example-custom-modal-styling-title">
                                            <div style={{ width: "auto", height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>ปรับจำนวน</div>
                                          </Modal_qty.Title>
                                        </Modal_qty.Header>
                                        <Modal_qty.Body>     <div className='d-flex'>
                                          <div style={{ width: "auto", height: 30, fontSize: 15, fontFamily: "Kanit_B" }}>{editedcode}</div>
                                          <div style={{ width: "auto", marginLeft: 5, height: 30, fontSize: 15, fontFamily: "Kanit_B" }}>{editedTaskname}</div>
                                        </div>
                                          <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
                                            <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                                              ราคา : {priceAct}  บาท
                                            </div>
                                          </div>
                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>คงเหลือ : {Number(priceAct) - Number(priceDis)} บาท/ชิ้น</div>
                                          <div className='d-flex'>
                                            <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10 }}>
                                              จำนวนสินค้า : {Number(editqty)} ชิ้น ปรับจำนวนเป็น
                                            </div>

                                            <input className="form-control form-control-sm mt-1" style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                                              value={editqtyCh}
                                              onChange={(e) => setEditedqtyCh(e.target.value)} />
                                            <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>ชิ้น</div>
                                          </div>


                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>ยอดรวม : {Number(editqtyCh) * (Number(priceAct) - Number(priceDis))} บาท/ชิ้น</div>
                                        </Modal_qty.Body>
                                        <Modal_qty.Footer>
                                          <button
                                            className="btn btn-success"

                                            style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                                            onClick={() => { EditQuatation_Detail(), setShowqty(false), fetchQT_ID() }}
                                          >
                                            ตกลง
                                          </button>
                                          <button
                                            className="btn btn-secondary"
                                            style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                                            onClick={() => setShowqty(false)}
                                          >
                                            ปิด
                                          </button>

                                        </Modal_qty.Footer>
                                      </Modal_qty>


                                    </>
                                  </div>
                                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 12, textAlign: "end", height: 30, width: 50 }}>{a.unit}</div>
                                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 12, textAlign: "end", height: 30, width: 70 }}>{a.price}</div>
                                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 12, textAlign: "end", height: 30, width: 50 }} >
                                    <>
                                      <button

                                        className="btn btn-outline-success btn-sm"
                                        style={{ height: 24, fontSize: 12, fontFamily: "Kanit_B", width: 35 }}
                                        onClick={() => {
                                          setShowD(true),
                                            setEditedpriceDis(String(a.discount)),
                                            setEditedpriceAct(String(a.price)),
                                            setEditedqty(String(a.qty)),
                                            setEditedqtyCh(String(a.qty)),
                                            setEditedcode(String(a.code_product)),
                                            setEditedname(String(a.name_product)),
                                            setid(Number(a.id)),
                                            setiddoc(Number(a.id_docmain)),
                                            localStorage.setItem("idd", String(a.id_docmain))
                                        }}>
                                        {a.discount}
                                      </button>
                                      <Modal_ds
                                        show={showD}
                                        onHide={() => setShowD(false)}
                                        dialogClassName="modal-90w"
                                        aria-labelledby="example-custom-modal-styling-title"
                                      >
                                        <Modal_ds.Header closeButton>
                                          <Modal_ds.Title id="example-custom-modal-styling-title">
                                            <div style={{ width: "auto", height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>ส่วนลดราคา</div>
                                          </Modal_ds.Title>
                                        </Modal_ds.Header>
                                        <Modal_ds.Body>     <div className='d-flex'>
                                          <div style={{ width: "auto", height: 30, fontSize: 15, fontFamily: "Kanit_B" }}>{editedcode}</div>
                                          <div style={{ width: "auto", marginLeft: 5, height: 30, fontSize: 15, fontFamily: "Kanit_B" }}>{editedTaskname}</div>
                                        </div>
                                          <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
                                            <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                                              ราคาจาก : {priceAct}  บาท   ลดราคาชิ้นละ</div>

                                            <input className="form-control form-control-sm mt-1" style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                                              value={priceDis}
                                              onChange={(e) => setEditedpriceDis(e.target.value)} />
                                            <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>บาท</div>

                                          </div>
                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>คงเหลือ : {Number(priceAct) - Number(priceDis)} บาท/ชิ้น</div>
                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>จำนวนสินค้า : {Number(editqty)} ชิ้น</div>
                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>ยอดรวม : {Number(editqty) * (Number(priceAct) - Number(priceDis))} บาท/ชิ้น</div>
                                        </Modal_ds.Body>
                                        <Modal_ds.Footer>
                                          <button
                                            className="btn btn-success"

                                            style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                                            onClick={() => {
                                              EditQuatation_Detail(), setShowD(false)
                                              //    setQT({...allQT, discount:discountS}),
                                              //    setdiscountS(localStorage.getItem("discount_s") || "")

                                            }}
                                          >
                                            ตกลง
                                          </button>
                                          <button
                                            className="btn btn-secondary"
                                            style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                                            onClick={() => { setShowD(false) }}
                                          >
                                            ปิด
                                          </button>

                                        </Modal_ds.Footer>
                                      </Modal_ds>


                                    </>
                                  </div>
                                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 30, width: 50 }}>{a.total}</div>
                                  <div className=' bd-highlight' style={{ height: 30, width: 50 }}>
                                    <Image onClick={() => DeleteQT_ID(a.id)} alt={""} src={deletes} width={20} height={20} style={{ marginLeft: 30, cursor: "pointer" }} />
                                  </div>
                                </div>
                              </div>
                            )}
                        </td>

                      </tr>

                    </tbody>
                  </table>
                  <div className="d-flex flex-row-reverse bd-highlight" style={{ width: "100%" }}>

                    <div className='p-2 bd-highlight'> <Search_Product /> </div>
                  </div>
                  <div className=" " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                  <div className="row mt-2 " style={{ fontFamily: "kanit", fontSize: 11, justifySelf: "left", marginLeft: 3 }}>ทั้งหมด : {qt_detail.length} รายการ  </div>

                  {/**ท้ายบิล Slip */}
                  <div className="container">
                    <div className="row ">

                      <div className="col mt-2">
                        <InputGroup>
                          <InputGroup.Text style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>หมายเหตุ</InputGroup.Text>
                          <Form.Control
                            style={{ fontFamily: "Kanit", fontSize: 12 }}
                            as="textarea"
                            aria-label="With textarea"
                            value={remarkQ ?? ""}
                            onChange={(e) => setremarkQ(e.target.value)}

                          />

                        </InputGroup>

                      </div>
                      <div className="col ">
                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>รวมเงิน :</div>
                          <div className=" bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 27, }}>{Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0))}</div>
                          <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ส่วนลดท้ายบิล :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 27 }}><Discount_s /></div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ใช้แต้มส่วนลด :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 27 }}>{allQT.usereward}</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        {String(taxNum) === "" ? "" :
                          <div>
                            <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>จำนวนเงินรวมทั้งสิ้น :</div>
                              <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 27 }}>{Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(allQT.discount) - Number(allQT.usereward)} </div>
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                            </div>
                            <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                            <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>หักภาษี ณ ที่จ่าย {allQT.taxnumber !== taxNum ? taxNum : allQT.taxnumber} % :</div>
                              <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 27 }}>{((Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) * Number(allQT.taxnumber !== taxNum ? taxNum : allQT.taxnumber)) / 100).toFixed(1)}
                              </div>
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                            </div>
                          </div>
                        }

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 30 }}>ยอดชำระทั้งหมด :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 30 }}>
                            {((((Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(allQT.discount) - Number(allQT.usereward)) * Number(allQT.taxnumber !== taxNum ? taxNum : allQT.taxnumber)) / 100) + (Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(allQT.discount) - Number(allQT.usereward))).toFixed(1)}</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 30 }}>บาท</div>
                        </div>
                        <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                      </div>
                    </div>
                    <div className="h-5">
                    </div>
                  </div>


                  <div className="row mt-3">
                    <div className="col-5" style={{ justifyItems: "center" }}>
                      <div className="row">
                        <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ลงนาม</div></div>
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
                        <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ลงนาม</div></div>

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




            </Modal_ble.Body>
            <Modal_ble.Footer>
              {/**ปรับ%ภาษี */}
              <Radio_tax />
              {/**การอนุมัติ */}
              <Dropdown
                className="d-inline mx-2"
              >

                <Dropdown.Toggle
                  id="dropdown-autoclose-true"
                  variant={
                    allQT.inv_status === "อนุมัติ" ? "success" :
                      allQT.inv_status === "รออนุมัติ" ? "warning" :
                        allQT.inv_status === "ยกเลิก" ? "danger" : "primary"
                  }
                  style={{ fontSize: 15, fontFamily: "kanit", height: 40 }}>
                  {allQT.inv_status === null ? "รออนุมัติ" : allQT.inv_status}
                </Dropdown.Toggle>

                <Dropdown.Menu >
                  <Dropdown.Item href="#"
                    onClick={() => {
                      localStorage.setItem("st", "รออนุมัติ"),
                        setst("รออนุมัติ"),
                        setTimeout(() => {
                          EditQuatation()
                        }, 500)
                    }}
                    style={{ fontSize: 15, fontFamily: "kanit" }}>รออนุมัติ</Dropdown.Item>
                  <Dropdown.Item href="#"
                    onClick={() => {
                      localStorage.setItem("st", "อนุมัติ"),
                        setst("อนุมัติ")
                      setTimeout(() => {
                        EditQuatation()
                      }, 500)
                    }}
                    style={{ fontSize: 15, fontFamily: "kanit" }}>อนุมัติ</Dropdown.Item>
                  <Dropdown.Item href="#"
                    onClick={() => {
                      localStorage.setItem("st", "ยกเลิก"),
                        setst("ยกเลิก")
                      setTimeout(() => {
                        EditQuatation()
                      }, 500)
                    }}

                    style={{ fontSize: 15, fontFamily: "kanit" }}>

                    ยกเลิก</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <button
                className="btn btn-success"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={() => { EditQuatation(), setShowie(false), fetchQT() }}
              >
                บันทึก
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={() => setShowie(false)}>
                ปิด
              </button>

            </Modal_ble.Footer>
          </Modal_ble>

          )}

        </>

      )
    }

    return (

      <>
        <div className="col">
          <div className='d-flex align-items-center justify-content-between mb-1 mt-1' style={{ gap: 12 }}>
            <div style={{ fontFamily: "kanit_B", fontSize: 18, color: "#1f2937" }}>ใบแจ้งหนี้</div>
            <button
              type="button"
              onClick={() => openCreateDocumentDraft("three")}
              style={{
                padding: "6px 16px", borderRadius: 8, border: "1.5px solid #2A6AAA",
                backgroundColor: "#F3F8FC", color: "#2A6AAA", fontSize: 13,
                fontFamily: "kanit_B", cursor: "pointer", display: "inline-flex",
                alignItems: "center", gap: 6, whiteSpace: "nowrap",
              }}
            >
              <Plus size={14} /> สร้างเอกสาร
            </button>
          </div>
          <table className="table table-hover" style={{ borderCollapse: "separate", borderSpacing: "0" }}>
            <thead >
              <tr >
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>วันที่สร้าง</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>เลขที่เอกสาร</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>ชื่อลูกค้า/ชื่อโปรเจค</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>วันที่ครบกำหนด</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>ยอดรวมสุทธิ</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>สถานะ</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", width: 120, textAlign: "center" }}></td>

              </tr>
            </thead>
            <tbody >
              {filterBySearch(filterByStatus(qt.filter((d: any) => d.bl_status === "อนุมัติ" || d.inv_status === "อนุมัติ" || d.inv_status === "รออนุมัติ" || d.inv_status === "ยกเลิก"), "inv"), "inv").sort((a: any, b: any) => a.createDate.localeCompare(b.createDate)).map((a: any) =>
                <tr key={a.id} onClick={() => setSelectedDocRow(a)} style={{ cursor: "pointer", backgroundColor: selectedDocRow?.id === a.id ? "#F3F8FC" : undefined }} >
                  <td style={{ fontFamily: "kanit", fontSize: 10, height: 40 }}>

                    {a.bl_enddate === null ? <></> :
                      <div style={{ fontFamily: "kanit", fontSize: 10, height: 12 }}>
                        ใบวางบิล : {new Date(a.bl_enddate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                      </div>}
                    {a.inv_date === null ? <></> :
                      <div style={{ fontFamily: "kanit", fontSize: 13 }}>
                        {new Date(a.inv_date).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                      </div>}
                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 10, height: 40 }}>
                    {a.bl_enddate === null ? <></> :
                      <div style={{ fontFamily: "kanit", fontSize: 10, height: 12 }}>
                        ใบวางบิล : BL{a.bl_orderNo}{a.bl_number}</div>}

                    {a.inv_date === null ? <></> :
                      <div style={{ fontFamily: "kanit", fontSize: 13 }}>
                        INV{a.inv_orderNo}{a.inv_number}</div>}

                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40 }}>{a.name_costomer}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>
                    {a.inv_enddate === null ? "-" :
                      new Date(a.inv_enddate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>{(Number(a.totalall) + ((Number(a.totalall) * Number(a.taxnumber)) / 100)).toFixed(1)}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>

                    <span style={{
                      fontFamily: "kanit", fontSize: 11, padding: "3px 12px", borderRadius: 20,
                      backgroundColor: a.inv_status === "อนุมัติ" ? "#D3F0E2" : a.inv_status === "รออนุมัติ" ? "#fef3c7" : a.inv_status === "ยกเลิก" ? "#fee2e2" : "#e0e7ff",
                      color: a.inv_status === "อนุมัติ" ? "#0C5238" : a.inv_status === "รออนุมัติ" ? "#92400e" : a.inv_status === "ยกเลิก" ? "#991b1b" : "#3730a3",
                      fontWeight: 600,
                    }}>{a.inv_status === null ? "สร้างใบแจ้งหนี้" : a.inv_status}</span>

                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, textAlign: "center", height: 50 }} className='d-flex'>
                    <button
                      onClick={() => { maxV2(), setids(a.id), setidcus(a.id_costomer), localStorage.setItem("iddoc", a.id), setShowie(true) }}
                      style={{ fontSize: 11, height: 28, marginLeft: 5, padding: "0 12px", borderRadius: 8, border: a.inv_status === null ? "1px solid #2A6AAA" : "1px solid #d97706", backgroundColor: "white", color: a.inv_status === null ? "#2A6AAA" : "#d97706", fontFamily: "kanit", cursor: "pointer", transition: "all 0.2s ease" }}
                      onMouseEnter={(e) => { const c = a.inv_status === null ? "#2A6AAA" : "#f59e0b"; e.currentTarget.style.backgroundColor = c; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 2px 8px ${c}4d` }}
                      onMouseLeave={(e) => { const c = a.inv_status === null ? "#2A6AAA" : "#d97706"; e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = c; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}>
                      {a.inv_status === null ? "สร้าง" : "แก้ไข"}
                    </button>

                    <button
                      onClick={() => { setids(a.id), setidcus(a.id_costomer), setShowiv(true) }}
                      style={{ fontSize: 11, height: 28, marginLeft: 5, padding: "0 12px", borderRadius: 8, border: "1px solid #2A6AAA", backgroundColor: "white", color: "#2A6AAA", fontFamily: "kanit", cursor: "pointer", transition: "all 0.2s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#2A6AAA"; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(42, 106, 170,0.3)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = "#2A6AAA"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}>
                      ข้อมูล
                    </button>
                    {renderRowDocumentAttachmentButton("inv", Number(a.id))}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <BillTemplate_Edit />
          <BillTemplate />
        </div>

      </>

    )
  }

  //*****************   ใบเสร็จรับเงิน  ***************************/
  const Receipt = () => {

    //******** */ input Preview *********************
    function BillTemplate() {

      let taxNum = allQT.taxnumber

      //Print Label
      const contentRef = useRef<HTMLDivElement>(null);
      const reactToPrintFn2 = useReactToPrint({
        contentRef,
        documentTitle: allQT.re_orderfull || `RE${allQT.re_orderNo || ""}${allQT.re_number || ""}`,
        pageStyle: PROFESSIONAL_DOCUMENT_PRINT_PAGE_STYLE,
      });



      return (


        <>

          <Modal_blr
            show={showev}
            onHide={() => setShowev(false)}
            size="xl"
            scrollable={true}
            //  fullscreen={true}
            //  dialogClassName="80w"
            aria-labelledby="example-custom-modal-styling-title"
          >
            <Modal_blr.Header closeButton>
              <Modal_blr.Title id="example-custom-modal-styling-title">
                <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>ใบเสร็จรับเงิน</div>
              </Modal_blr.Title>
            </Modal_blr.Header>
            <Modal_blr.Body style={{ backgroundColor: "#e5e7eb", padding: "16px", overflow: "auto" }}>

              <div className="document-print-sheet" style={PROFESSIONAL_DOCUMENT_PRINT_SHEET_STYLE} ref={contentRef} >
                {renderReceiptPrintDocument(taxNum)}

              </div>




            </Modal_blr.Body>
            <Modal_blr.Footer>

              <button
                className="btn btn-primary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={reactToPrintFn2}>
                Print
              </button>

              <button
                className="btn btn-secondary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={() => setShowev(false)}>
                ปิด
              </button>

            </Modal_blr.Footer>
          </Modal_blr>

        </>

      )
    }

    //******* */ input Edit ************************


    function BillTemplate_Edit() {



      let taxNum = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
        String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
          String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""

      //****** */ input Radio Tax *************
      const [selectedOptiontax, setSelectedOptiontax] = useState('notax');

      //******* เปลี่ยน Tax ภาษี ******************
      const Radio_tax = () => {

        useEffect(() => {
          setSelectedOptiontax(localStorage.getItem("numbertax_S") || "")
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

      //********* เปลี่ยนส่วนลดท้ายบิล ****************         
      const Discount_s = () => {

        const [discountS, setdiscountS] = useState('0')

        useEffect(() => {
          setdiscountS(localStorage.getItem("discount_s") || "")

        }, [Number(discountS)]);


        const [show2, setShow2] = useState(false);

        // Update Quatation
        const EditQuatation = async () => {

          const totalall = Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0))
          const discount = Number(discountS)
          const sumtotal = Number(Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(discountS) - Number(parseInt(allQT.usereward)))

          const usereward = Number(allQT.usereward)
          const taxnumber = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
            String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
              String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""
          const personall = allQT.person
          const statussall = allQT.statuss
          const qt_status = allQT.qt_status
          const qt_person = allQT.qt_person
          const qt_remark = allQT.qt_remark

          try {
            //  localStorage.setItem("show","1")
            //  Save Sale
            await axios.put(`/api/${apiquatation}/${Number(localStorage.getItem("iddoc") || "")}`,
              {

                totalall, discount, sumtotal, usereward, personall, statussall, taxnumber


              })
            await fetchQT_ID()

          } catch (error) {
            console.error(error)
          }
        }
        return (


          <>

            <button
              type="button"
              className="btn btn-outline-success "
              style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", height: 27, width: 40 }}
              onClick={() => { setShow2(true), localStorage.setItem("discount_s", "0") }}
            >
              {Number(allQT.discount)}
            </button>

            <Modal_dc
              show={show2}
              onHide={() => setShow2(false)}
              className="document-modal detail-editor-modal"
              dialogClassName="document-modal-dialog modal-90w"
              backdropClassName="document-modal-backdrop detail-editor-modal-backdrop"
              animation={false}
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

                <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit_B", marginTop: 10, textAlign: "left", height: 35 }}>
                  ส่วนลดรวม : &nbsp;&nbsp;{Number(discountS)}&nbsp;&nbsp; บาท  </div>

              </Modal_dc.Body>
              <Modal_dc.Footer>
                <button
                  className="btn btn-success"

                  style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                  onClick={() => {
                    setShow2(false),
                      setQT({ ...allQT, discount: discountS }),
                      setdiscountS(localStorage.getItem("discount_s") || "")
                    EditQuatation()
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

      const modale = useDisclosure()
      const [priceAct, setEditedpriceAct] = useState<string>("");
      const [priceDis, setEditedpriceDis] = useState<string>("");
      const [editedcode, setEditedcode] = useState<string>("");
      const [editedTaskname, setEditedname] = useState<string>("");
      const [editqty, setEditedqty] = useState<string>("");
      const [editqtyCh, setEditedqtyCh] = useState<string>("");
      const [editid, setid] = useState<number>(0);
      const [editiddoc, setiddoc] = useState<number>(0);

      const [showD, setShowD] = useState(false);
      const [showqty, setShowqty] = useState(false);

      const [remarkQ, setremarkQ] = useState(allQT.qt_remark || "")
      useEffect(() => { setremarkQ(allQT.qt_remark || "") }, [allQT.qt_remark])

      const [st, setst] = useState("")
      /***************************************** */

      //***Order Date Diff */ 
      let dateS = getSafeDocumentDate(allQT.re_date)
      let dateE = getSafeDocumentDate(allQT.re_enddate)
      const [startDate, setStartDate] = useState(dateS);
      const [startDate1, setStartDate1] = useState(dateE);

      useEffect(() => {
        if (ids === 0) return

        setStartDate(getSafeDocumentDate(allQT.re_date))
        setStartDate1(getSafeDocumentDate(allQT.re_enddate))
      }, [ids, allQT.re_date, allQT.re_enddate]);



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


      // Update Quatation
      const EditQuatation = async () => {

        const totalall = Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0))
        const discount = Number(allQT.discount)
        const sumtotal = Number(Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(allQT.discount) - Number(parseInt(allQT.usereward)))

        const usereward = Number(allQT.usereward)
        const taxnumber = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
          String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
            String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""
        const pay = String(allQT.pay || "")
        const personall = allQT.person
        const statussall = allQT.statuss
        const re_date = new Date(startDate)
        const re_enddate = new Date(startDate1)
        const re_credit = Number(daysDiff)
        const re_status = localStorage.getItem("st") || ""
        const re_person = String(allQT.re_person || allQT.qt_person || "")
        const re_remark = remarkQ
        const re_orderNo = String(year) + String(month) + String(day)
        const re_number = maxRecN3
        const re_orderfull = "RE" + String(year) + String(month) + String(day) + maxRecN3

        try {
          //   localStorage.setItem("show","1")
          //Save Sale
          await axios.put(`/api/${apiquatation}/${Number(localStorage.getItem("iddoc") || "")}`,
            {

              totalall, discount, sumtotal, usereward, personall, statussall, taxnumber, pay,
              re_status, re_person, re_remark, re_date, re_enddate, re_credit, re_orderNo, re_number, re_orderfull

            })

          setTimeout(() => {
            fetchQT_ID()
            fetchQT()
          }, 700);


        } catch (error) {
          console.error(error)
        }
      }

      // Update Quatation_Detail
      const EditQuatation_Detail = async () => {

        const qty = Number(editqtyCh)
        const price = Number(priceAct)
        const discount = Number(priceDis)
        const total = Number(Number(editqtyCh) * (Number(priceAct) - Number(priceDis)))
        const person = ""


        try {
          await axios.put(`/api/${apiquatation_detail}/${Number(editid)}`,
            {

              qty, price, discount, total, person


            })

          await fetchQT_IDDetail()
          await setTimeout(() => {
            EditQuatation()

          }, 1000);

        } catch (error) {
          console.error(error)
        }
      }


      //******** */ Search สินค้า*****************/
      function Search_Product() {

        //*******Show Modal **********************************/
        const [show1, setShow1] = useState(false);
        const handleClose = () => setShow1(false);
        const handleShow = () => setShow1(true);
        const handleClose1 = () => { Post_Quatation_Detail(), setShow1(false) };
        //******* */  Key ค้นหา สินค้า  ************************/
        const [data, setData] = useState(dataProduct);
        const [search, setsearch] = useState("")

        const handleChange = (value: any) => {
          setsearch(value);
          filterDataProduct(value);
        };

        // filter records by Productname
        const filterDataProduct = (value: any) => {
          const lowercasedValue = String(value || "").toLowerCase().trim();
          if (lowercasedValue === "") setData(dataProduct);
          else {
            const filteredData = dataProduct.filter((user: any) =>
              String(user?.ProductName || "").toLowerCase().includes(lowercasedValue)
              || String(user?.code || "").toLowerCase().includes(lowercasedValue)
              || String(user?.Barcode || "").toLowerCase().includes(lowercasedValue)
            );
            setData(filteredData);
          }
        };

        //***************************************************************** */
        const [idP, setidP] = useState("")
        const [code, setcode] = useState("")
        const [product, setProduct] = useState("")
        const [priceS, setprice] = useState("")
        const [unitS, setunit] = useState("")
        const [qtyP, setqtyP] = useState("1")

        // Update Quatation_Detail
        const Post_Quatation_Detail = async () => {
          let currentIds = ids
          if (!currentIds || currentIds === 0) {
            const newId = await createNewDocMain("re")
            if (!newId) return
            currentIds = newId
          }
          const company = String(localStorage.getItem("company_") || "")
          const id_product = Number(idP)
          const code_product = code
          const name_product = product
          const unit = unitS
          const qty = Number(qtyP)
          const price = Number(priceS)
          const total = Number(qtyP) * Number(priceS)
          const person = ""
          const id_docmain = Number(currentIds)


          try {
            await axios.post(`/api/${apiquatation_detail}`,
              {
                unit, qty, price, total, person, company, id_product, code_product, name_product, id_docmain

              })

            await fetchQT_IDDetail(currentIds)


          } catch (error) {
            console.error(error)
          }
        }



        return (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleShow(); }}
              style={{
                fontFamily: "Kanit", fontSize: 13, padding: "6px 16px", borderRadius: 8,
                border: "1.5px solid #2A6AAA", backgroundColor: "#F3F8FC", color: "#2A6AAA",
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                transition: "all 0.15s", whiteSpace: "nowrap", fontWeight: 600,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#E5EEF8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#F3F8FC"; }}
            >
              + เพิ่มสินค้า
            </button>

            <Modal1 show={show1} onHide={handleClose} className="document-modal product-picker-modal" dialogClassName="document-modal-dialog" backdropClassName="document-modal-backdrop product-picker-modal-backdrop">
              <Modal1.Header closeButton>
                <Modal1.Title
                  style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, height: 20 }}>
                  ค้นหาชื่อ, รหัส, Barcode สินค้า
                </Modal1.Title>
              </Modal1.Header>
              <Modal1.Body>
                <div>
                  <div className={styles.bodydetailTable_Re} style={{ width: "4vw" }}>ค้นหา</div>
                  <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                    <input
                      value={search}
                      onChange={(e) => handleChange(e.target.value)}
                      className="form-control form-control-sm"
                      placeholder="ค้นหาชื่อ, รหัส, Barcode สินค้า"
                      style={{ fontFamily: "Kanit", fontSize: 10, height: 12 }} />
                  </div>

                  <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
                    <table className="table table-sm table-hover"   >
                      <thead style={{ position: "sticky", top: "0" }}>
                        <tr>
                          <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "4vw" }}>
                            <div style={{ width: "4vw" }}>รหัสสินค้า</div>

                          </th>
                          <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "15vw" }}>
                            <div style={{ width: "15vw" }}>ชื่อสินค้า</div>

                          </th>
                          <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "7vw" }}>
                            <div style={{ width: "7vw" }}>barcode</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="table-group-divider " >
                        {data.map((post: any) => (
                          <tr key={post.id}
                            onClick={() => {
                              setidP(post.id),
                                setcode(post.code),
                                setProduct(post.ProductName),
                                setprice(post.price),
                                setunit(post.Unit)

                            }}>
                            <td className={styles.bodydetailTable_Re1} style={{ width: "4vw" }}>{post.code}</td>
                            <td className={styles.bodydetailTable_Re1} style={{ width: "15vw" }}>{post.ProductName}</td>
                            <td className={styles.bodydetailTable_Re1} style={{ width: "7vw" }}>{post.Barcode}</td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
                <div className='row'>
                  <div className='d-flex mt-1'>
                    <div style={{ fontFamily: "Kanit_B", textAlign: "left", fontSize: 15 }}>{code}</div>
                    <div style={{ fontFamily: "Kanit_B", textAlign: "left", fontSize: 15, marginLeft: 10 }}>{product}</div>
                  </div>
                  <div className='d-flex mt-2'>
                    <div style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, marginLeft: 10, marginTop: 10 }}>ราคา :&nbsp;&nbsp; {priceS}&nbsp;&nbsp; บาท&nbsp;&nbsp;&nbsp; จำนวน</div>
                    <input
                      className="form-control form-control-sm "

                      style={{ width: 50, marginLeft: 10, marginRight: 10, height: 20, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                      value={qtyP}
                      onChange={(e) => setqtyP(e.target.value)} />
                    <div style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, marginLeft: 10, marginTop: 10 }}>{unitS}&nbsp;&nbsp;ราคารวม : &nbsp;&nbsp;{Number(qtyP) * Number(priceS)}&nbsp;&nbsp; บาท</div>
                  </div>


                </div>

              </Modal1.Body>
              <Modal1.Footer >

                <Button1
                  variant="secondary"
                  onClick={handleClose}
                  style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}
                >
                  ปิด
                </Button1>
                <Button1
                  variant="primary"
                  onClick={handleClose1}
                  style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}
                >
                  เพิ่ม
                </Button1>
              </Modal1.Footer>
            </Modal1>
          </>
        );
      }

      const receiptNumberDisplay = allQT.re_number === null || allQT.re_number === undefined
        ? `RE${year}${month}${day}${maxRecN3}`
        : `RE${allQT.re_orderNo}${allQT.re_number}`

      const openQuantityEditor = (detail: any) => {
        setShowqty(true)
        setEditedpriceDis(String(detail.discount || "0"))
        setEditedpriceAct(String(detail.price || "0"))
        setEditedqty(String(detail.qty || "0"))
        setEditedqtyCh(String(detail.qty || "0"))
        setEditedcode(String(detail.code_product || ""))
        setEditedname(String(detail.name_product || ""))
        setid(Number(detail.id || 0))
        setiddoc(Number(detail.id_docmain || 0))
        localStorage.setItem("idd", String(detail.id_docmain || 0))
      }

      const openDiscountEditor = (detail: any) => {
        setShowD(true)
        setEditedpriceDis(String(detail.discount || "0"))
        setEditedpriceAct(String(detail.price || "0"))
        setEditedqty(String(detail.qty || "0"))
        setEditedqtyCh(String(detail.qty || "0"))
        setEditedcode(String(detail.code_product || ""))
        setEditedname(String(detail.name_product || ""))
        setid(Number(detail.id || 0))
        setiddoc(Number(detail.id_docmain || 0))
        localStorage.setItem("idd", String(detail.id_docmain || 0))
      }

      const updateReceiptStatus = async (nextStatus: string) => {
        localStorage.setItem("st", nextStatus)
        setst(nextStatus)
        if (ids === 0) {
          const newId = await createNewDocMain("re")
          if (!newId) return
        }
        setTimeout(() => {
          EditQuatation()
        }, 500)
      }

      return (


        <>

          {useModernSalesDocumentLayout ? (
            <Modal_blr
              show={showee}
              onHide={() => setShowee(false)}
              size="xl"
              scrollable={true}
              className="document-modal"
              dialogClassName="document-modal-dialog"
              backdropClassName="document-modal-backdrop"
              animation={false}
              enforceFocus={false}
              aria-labelledby="example-custom-modal-styling-title"
            >
              <Modal_blr.Header closeButton style={{ borderBottom: "1px solid #e5e7eb", padding: "16px 24px", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" }}>
                <Modal_blr.Title id="example-custom-modal-styling-title" style={{ width: "100%" }}>
                  {renderDocumentModalTitle({
                    title: "ใบเสร็จรับเงิน",
                    docDisplay: receiptNumberDisplay,
                    status: allQT.re_status,
                    icon: <ReceiptIcon size={18} color="white" />,
                    iconBackground: "linear-gradient(135deg, #b45309, #f59e0b)",
                  })}
                </Modal_blr.Title>
              </Modal_blr.Header>

              {renderDocumentWorkflowStepper("RE")}

              <Modal_blr.Body style={{ backgroundColor: "#f8fafc", padding: "20px 24px" }}>
                {renderDocumentInfoGrid({
                  docType: "re",
                  docDisplay: receiptNumberDisplay,
                  startDate,
                  setStartDate,
                  startDate1,
                  setStartDate1,
                  creditDays: daysDiff,
                  personDisplay: allQT.re_person || allQT.qt_person,
                  detailIcon: <ReceiptIcon size={14} color="#2A6AAA" />,
                })}
                {renderDocumentItemsSection({
                  searchProductControl: renderProductSearchControl("re"),
                  onEditQuantity: openQuantityEditor,
                  onEditDiscount: openDiscountEditor,
                  onDeleteItem: DeleteQT_ID,
                  showqty,
                  setShowqty,
                  showD,
                  setShowD,
                  priceAct,
                  setEditedpriceAct,
                  priceDis,
                  setEditedpriceDis,
                  editedcode,
                  editedTaskname,
                  editqty,
                  editqtyCh,
                  setEditedqtyCh,
                  onApplyDetailEdit: EditQuatation_Detail,
                })}
                {renderDocumentSummarySection({
                  remarkQ,
                  setremarkQ,
                  discountControl: <Discount_s />,
                  taxNum,
                  attachmentDocType: "re",
                })}
                {renderReceiptStatementSection({
                  taxNum,
                })}
                {renderReceiptSignatureSection()}
                {renderReceiptPaymentSettingsModal()}
              </Modal_blr.Body>

              <Modal_blr.Footer style={{ borderTop: "1px solid #e5e7eb", padding: "12px 24px", background: "#fafbfc", justifyContent: "space-between" }}>
                {renderDocumentFooterActions({
                  taxControl: <Radio_tax />,
                  createControl: renderDocumentCreateDropdown("re"),
                  status: allQT.re_status,
                  onChangeStatus: updateReceiptStatus,
                  onSave: async () => {
                    if (ids === 0) {
                      const newId = await createNewDocMain("re")
                      if (!newId) return
                    }
                    EditQuatation()
                    setShowee(false)
                    fetchQT_ID()
                  },
                  onClose: () => setShowee(false),
                })}
              </Modal_blr.Footer>
            </Modal_blr>
          ) : (

          <Modal_blr
            show={showee}
            onHide={() => setShowee(false)}
            size="lg"
            scrollable={true}
            className="document-modal"
            dialogClassName="document-modal-dialog"
            backdropClassName="document-modal-backdrop"
            animation={false}
            enforceFocus={false}
            aria-labelledby="example-custom-modal-styling-title"
          >
            <Modal_blr.Header closeButton>
              <Modal_blr.Title id="example-custom-modal-styling-title">
                <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>สร้างเสร็จรับเงิน</div>
              </Modal_blr.Title>
            </Modal_blr.Header>
            <Modal_blr.Body style={{ backgroundColor: "grey" }}>

              <div className="col  " style={{ justifySelf: "center", backgroundColor: "white", marginLeft: 20, marginRight: 20 }}  >


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
                    <div className="row " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{all.names}</div>
                    <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{all.address}</div>
                    <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{all.numbertax}</div>
                    <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {all.tel}</div>

                  </div>

                  {/**ใบเสนราคา */}
                  <div className="col ">
                    <div className="row "
                      style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 20, justifySelf: "center" }}>
                      ใบเสร็จรับเงิน
                    </div>
                    <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                    <div className="row">
                      <div className="col-4 ">
                        <div style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เลขที่ :</div>
                        <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ :</div>
                        <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เครดิต :</div>
                        <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันครบกำหนด :</div>
                        <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>ผู้ขาย :</div>
                      </div>

                      <div className="col ">
                        <div className="col " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>

                          {allQT.re_number === null ? <div>RE{year}{month}{day}{maxRecN3}</div> :
                            <div>RE{allQT.re_orderNo}{allQT.re_number}</div>}


                        </div>


                        <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>

                          {/**Open */}
                          <div className='border border-black shadow shadow-sm rounded ' style={{ width: 130, height: 25 }}>
                            <div style={{ width: 100, marginLeft: 10, marginTop: 2 }}>
                              <DatePicker
                                value={

                                  new Date(startDate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
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
                              <DatePicker value=
                                {

                                  new Date(startDate1).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                                selected={startDate1} 
                                onChange={(date: any) => setStartDate1(date)} />
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>ชื่อผู้ขาย</div>

                        <div className="mt-1 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{allQT.qt_person}</div>
                      </div>
                    </div>
                    <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                  </div>
                </div>

                <div className="row mt-3" style={{ marginLeft: 20, marginRight: 20 }}>
                  <div className="d-flex bd-highlight" style={{ justifySelf: "right" }}>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit_B", fontSize: 10, textAlign: "center", height: 15, width: 32 }}>ลำดับ</div>
                    <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit_B", fontSize: 11, textAlign: "start", height: 15, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>รายการ</div>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 45 }}>จำนวน</div>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>หน่วย</div>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 70 }}>ราคาต่อหน่วย</div>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>ลด/ชิ้น</div>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>รวม</div>
                    <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>ลบ</div>
                  </div>
                  <div className="mt-1 " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                  <table className="table table-hover"   >
                    <tbody className="">
                      <tr className="">
                        <td className="">
                          {qt_detail.sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)))
                            .map((a: any) =>
                              <div key={a.id} id="selcet-print">
                                <div className="d-flex bd-highlight" style={{ justifyItems: "end" }} >
                                  <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit", fontSize: 12, textAlign: "start", height: 30, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>{a.name_product}</div>
                                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 12, textAlign: "center", height: 30, width: 30 }}>

                                    <>
                                      <button

                                        className="btn btn-outline-success btn-sm"
                                        style={{ height: 24, fontSize: 12, fontFamily: "Kanit_B", width: 35 }}
                                        onClick={() => {
                                          setShowqty(true),
                                            setEditedpriceDis(String(a.discount)),
                                            setEditedpriceAct(String(a.price)),
                                            setEditedqty(String(a.qty)),
                                            setEditedqtyCh(String(a.qty)),
                                            setEditedcode(String(a.code_product)),
                                            setEditedname(String(a.name_product)),
                                            setid(Number(a.id)),
                                            setiddoc(Number(a.id_docmain)),
                                            localStorage.setItem("idd", String(a.id_docmain))

                                        }}>
                                        {a.qty}
                                      </button>
                                      <Modal_qty
                                        show={showqty}
                                        onHide={() => setShowqty(false)}
                                        dialogClassName="modal-90w"
                                        aria-labelledby="example-custom-modal-styling-title"
                                      >
                                        <Modal_qty.Header closeButton>
                                          <Modal_qty.Title id="example-custom-modal-styling-title">
                                            <div style={{ width: "auto", height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>ปรับจำนวน</div>
                                          </Modal_qty.Title>
                                        </Modal_qty.Header>
                                        <Modal_qty.Body>     <div className='d-flex'>
                                          <div style={{ width: "auto", height: 30, fontSize: 15, fontFamily: "Kanit_B" }}>{editedcode}</div>
                                          <div style={{ width: "auto", marginLeft: 5, height: 30, fontSize: 15, fontFamily: "Kanit_B" }}>{editedTaskname}</div>
                                        </div>
                                          <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
                                            <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                                              ราคา : {priceAct}  บาท
                                            </div>
                                          </div>
                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>คงเหลือ : {Number(priceAct) - Number(priceDis)} บาท/ชิ้น</div>
                                          <div className='d-flex'>
                                            <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10 }}>
                                              จำนวนสินค้า : {Number(editqty)} ชิ้น ปรับจำนวนเป็น
                                            </div>

                                            <input className="form-control form-control-sm mt-1" style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                                              value={editqtyCh}
                                              onChange={(e) => setEditedqtyCh(e.target.value)} />
                                            <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>ชิ้น</div>
                                          </div>


                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>ยอดรวม : {Number(editqtyCh) * (Number(priceAct) - Number(priceDis))} บาท/ชิ้น</div>
                                        </Modal_qty.Body>
                                        <Modal_qty.Footer>
                                          <button
                                            className="btn btn-success"

                                            style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                                            onClick={() => { EditQuatation_Detail(), setShowqty(false), fetchQT_ID() }}
                                          >
                                            ตกลง
                                          </button>
                                          <button
                                            className="btn btn-secondary"
                                            style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                                            onClick={() => setShowqty(false)}
                                          >
                                            ปิด
                                          </button>

                                        </Modal_qty.Footer>
                                      </Modal_qty>


                                    </>
                                  </div>
                                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 12, textAlign: "end", height: 30, width: 50 }}>{a.unit}</div>
                                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 12, textAlign: "end", height: 30, width: 70 }}>{a.price}</div>
                                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 12, textAlign: "end", height: 30, width: 50 }} >
                                    <>
                                      <button

                                        className="btn btn-outline-success btn-sm"
                                        style={{ height: 24, fontSize: 12, fontFamily: "Kanit_B", width: 35 }}
                                        onClick={() => {
                                          setShowD(true),
                                            setEditedpriceDis(String(a.discount)),
                                            setEditedpriceAct(String(a.price)),
                                            setEditedqty(String(a.qty)),
                                            setEditedqtyCh(String(a.qty)),
                                            setEditedcode(String(a.code_product)),
                                            setEditedname(String(a.name_product)),
                                            setid(Number(a.id)),
                                            setiddoc(Number(a.id_docmain)),
                                            localStorage.setItem("idd", String(a.id_docmain))
                                        }}>
                                        {a.discount}
                                      </button>
                                      <Modal_ds
                                        show={showD}
                                        onHide={() => setShowD(false)}
                                        dialogClassName="modal-90w"
                                        aria-labelledby="example-custom-modal-styling-title"
                                      >
                                        <Modal_ds.Header closeButton>
                                          <Modal_ds.Title id="example-custom-modal-styling-title">
                                            <div style={{ width: "auto", height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>ส่วนลดราคา</div>
                                          </Modal_ds.Title>
                                        </Modal_ds.Header>
                                        <Modal_ds.Body>     <div className='d-flex'>
                                          <div style={{ width: "auto", height: 30, fontSize: 15, fontFamily: "Kanit_B" }}>{editedcode}</div>
                                          <div style={{ width: "auto", marginLeft: 5, height: 30, fontSize: 15, fontFamily: "Kanit_B" }}>{editedTaskname}</div>
                                        </div>
                                          <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
                                            <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                                              ราคาจาก : {priceAct}  บาท   ลดราคาชิ้นละ</div>

                                            <input className="form-control form-control-sm mt-1" style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                                              value={priceDis}
                                              onChange={(e) => setEditedpriceDis(e.target.value)} />
                                            <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>บาท</div>

                                          </div>
                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>คงเหลือ : {Number(priceAct) - Number(priceDis)} บาท/ชิ้น</div>
                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>จำนวนสินค้า : {Number(editqty)} ชิ้น</div>
                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>ยอดรวม : {Number(editqty) * (Number(priceAct) - Number(priceDis))} บาท/ชิ้น</div>
                                        </Modal_ds.Body>
                                        <Modal_ds.Footer>
                                          <button
                                            className="btn btn-success"

                                            style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                                            onClick={() => {
                                              EditQuatation_Detail(), setShowD(false)
                                              //    setQT({...allQT, discount:discountS}),
                                              //    setdiscountS(localStorage.getItem("discount_s") || "")

                                            }}
                                          >
                                            ตกลง
                                          </button>
                                          <button
                                            className="btn btn-secondary"
                                            style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                                            onClick={() => { setShowD(false) }}
                                          >
                                            ปิด
                                          </button>

                                        </Modal_ds.Footer>
                                      </Modal_ds>


                                    </>
                                  </div>
                                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 30, width: 50 }}>{a.total}</div>
                                  <div className=' bd-highlight' style={{ height: 30, width: 50 }}>
                                    <Image onClick={() => DeleteQT_ID(a.id)} alt={""} src={deletes} width={20} height={20} style={{ marginLeft: 30, cursor: "pointer" }} />
                                  </div>
                                </div>
                              </div>
                            )}
                        </td>

                      </tr>

                    </tbody>
                  </table>
                  <div className="d-flex flex-row-reverse bd-highlight" style={{ width: "100%" }}>

                    <div className='p-2 bd-highlight'> <Search_Product /> </div>
                  </div>
                  <div className=" " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                  <div className="row mt-2 " style={{ fontFamily: "kanit", fontSize: 11, justifySelf: "left", marginLeft: 3 }}>ทั้งหมด : {qt_detail.length} รายการ  </div>

                  {/**ท้ายบิล Slip */}
                  <div className="container">
                    <div className="row ">

                      <div className="col mt-2">
                        <InputGroup>
                          <InputGroup.Text style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>หมายเหตุ</InputGroup.Text>
                          <Form.Control
                            style={{ fontFamily: "Kanit", fontSize: 12 }}
                            as="textarea"
                            aria-label="With textarea"
                            value={remarkQ ?? ""}
                            onChange={(e) => setremarkQ(e.target.value)}

                          />

                        </InputGroup>

                      </div>
                      <div className="col ">
                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>รวมเงิน :</div>
                          <div className=" bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 27, }}>{Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0))}</div>
                          <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ส่วนลดท้ายบิล :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 27 }}><Discount_s /></div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ใช้แต้มส่วนลด :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 27 }}>{allQT.usereward}</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        {String(taxNum) === "" ? "" :
                          <div>
                            <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>จำนวนเงินรวมทั้งสิ้น :</div>
                              <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 27 }}>{Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(allQT.discount) - Number(allQT.usereward)} </div>
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                            </div>
                            <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                            <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>หักภาษี ณ ที่จ่าย {allQT.taxnumber !== taxNum ? taxNum : allQT.taxnumber} % :</div>
                              <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 27 }}>{((Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) * Number(allQT.taxnumber !== taxNum ? taxNum : allQT.taxnumber)) / 100).toFixed(1)}
                              </div>
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                            </div>
                          </div>
                        }

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 30 }}>ยอดชำระทั้งหมด :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 30 }}>
                            {((((Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(allQT.discount) - Number(allQT.usereward)) * Number(allQT.taxnumber !== taxNum ? taxNum : allQT.taxnumber)) / 100) + (Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(allQT.discount) - Number(allQT.usereward))).toFixed(1)}</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 30 }}>บาท</div>
                        </div>
                        <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                      </div>
                    </div>
                    <div className="h-5">
                    </div>
                  </div>


                  <div className="row mt-3">
                    <div className="col-5" style={{ justifyItems: "center" }}>
                      <div className="row">
                        <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ลงนาม</div></div>
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
                        <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ลงนาม</div></div>

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




            </Modal_blr.Body>
            <Modal_blr.Footer>
              {/**ปรับ%ภาษี */}
              <Radio_tax />
              {/**การอนุมัติ */}
              <Dropdown
                className="d-inline mx-2"
              >

                <Dropdown.Toggle
                  id="dropdown-autoclose-true"
                  variant={
                    allQT.re_status === "อนุมัติ" ? "success" :
                      allQT.re_status === "รออนุมัติ" ? "warning" :
                        allQT.re_status === "ยกเลิก" ? "danger" : "primary"
                  }
                  style={{ fontSize: 15, fontFamily: "kanit", height: 40 }}>
                  {allQT.re_status === null ? "รออนุมัติ" : allQT.re_status}
                </Dropdown.Toggle>

                <Dropdown.Menu >
                  <Dropdown.Item href="#"
                    onClick={() => {
                      localStorage.setItem("st", "รออนุมัติ"),
                        setst("รออนุมัติ"),
                        setTimeout(() => {
                          EditQuatation()
                        }, 500)
                    }}
                    style={{ fontSize: 15, fontFamily: "kanit" }}>รออนุมัติ</Dropdown.Item>
                  <Dropdown.Item href="#"
                    onClick={() => {
                      localStorage.setItem("st", "อนุมัติ"),
                        setst("อนุมัติ")
                      setTimeout(() => {
                        EditQuatation()
                      }, 500)
                    }}
                    style={{ fontSize: 15, fontFamily: "kanit" }}>อนุมัติ</Dropdown.Item>
                  <Dropdown.Item href="#"
                    onClick={() => {
                      localStorage.setItem("st", "ยกเลิก"),
                        setst("ยกเลิก")
                      setTimeout(() => {
                        EditQuatation()
                      }, 500)
                    }}

                    style={{ fontSize: 15, fontFamily: "kanit" }}>

                    ยกเลิก</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <button
                className="btn btn-success"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={() => { EditQuatation(), setShowee(false), fetchQT() }}
              >
                บันทึก
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={() => setShowee(false)}>
                ปิด
              </button>

            </Modal_blr.Footer>
          </Modal_blr>

          )}

        </>

      )
    }

    return (

      <>
        <div className="col">
          <div className='d-flex align-items-center justify-content-between mb-1 mt-1' style={{ gap: 12 }}>
            <div style={{ fontFamily: "kanit_B", fontSize: 18, color: "#1f2937" }}>ใบเสร็จรับเงิน</div>
            <button
              type="button"
              onClick={() => openCreateDocumentDraft("four")}
              style={{
                padding: "6px 16px", borderRadius: 8, border: "1.5px solid #2A6AAA",
                backgroundColor: "#F3F8FC", color: "#2A6AAA", fontSize: 13,
                fontFamily: "kanit_B", cursor: "pointer", display: "inline-flex",
                alignItems: "center", gap: 6, whiteSpace: "nowrap",
              }}
            >
              <Plus size={14} /> สร้างเอกสาร
            </button>
          </div>
          <table className="table table-hover" style={{ borderCollapse: "separate", borderSpacing: "0" }}>
            <thead >
              <tr >
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>วันที่สร้าง</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>เลขที่เอกสาร</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>ชื่อลูกค้า/ชื่อโปรเจค</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>ยอดรวมสุทธิ</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>สถานะ</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", width: 120, textAlign: "center" }}></td>

              </tr>
            </thead>
            <tbody >
              {filterBySearch(filterByStatus(qt.filter((d: any) => d.inv_status === "อนุมัติ" || d.re_status === "อนุมัติ" || d.re_status === "รออนุมัติ" || d.re_status === "ยกเลิก"), "re"), "re").sort((a: any, b: any) => a.createDate.localeCompare(b.createDate)).map((a: any) =>
                <tr key={a.id} onClick={() => setSelectedDocRow(a)} style={{ cursor: "pointer", backgroundColor: selectedDocRow?.id === a.id ? "#F3F8FC" : undefined }} >
                  <td style={{ fontFamily: "kanit", fontSize: 10, height: 40 }}>

                    {a.inv_enddate === null ? <></> :
                      <div style={{ fontFamily: "kanit", fontSize: 10, height: 12 }}>
                        ใบแจ้งหนี้ : {new Date(a.inv_enddate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                      </div>}
                    {a.re_date === null ? <></> :
                      <div style={{ fontFamily: "kanit", fontSize: 13 }}>
                        {new Date(a.re_date).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                      </div>}
                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 10, height: 40 }}>
                    {a.inv_enddate === null ? <></> :
                      <div style={{ fontFamily: "kanit", fontSize: 10, height: 12 }}>
                        ใบแจ้งหนี้ : INV{a.inv_orderNo}{a.inv_number}</div>}

                    {a.re_date === null ? <></> :
                      <div style={{ fontFamily: "kanit", fontSize: 13 }}>
                        RE{a.re_orderNo}{a.re_number}</div>}

                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40 }}>{a.name_costomer}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>{(Number(a.totalall) + ((Number(a.totalall) * Number(a.taxnumber)) / 100)).toFixed(1)}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>

                    <span style={{
                      fontFamily: "kanit", fontSize: 11, padding: "3px 12px", borderRadius: 20,
                      backgroundColor: a.re_status === "อนุมัติ" ? "#D3F0E2" : a.re_status === "รออนุมัติ" ? "#fef3c7" : a.re_status === "ยกเลิก" ? "#fee2e2" : "#e0e7ff",
                      color: a.re_status === "อนุมัติ" ? "#0C5238" : a.re_status === "รออนุมัติ" ? "#92400e" : a.re_status === "ยกเลิก" ? "#991b1b" : "#3730a3",
                      fontWeight: 600,
                    }}>{a.re_status === null ? "สร้างใบเสร็จรับเงิน" : a.re_status}</span>

                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, textAlign: "center", height: 50 }} className='d-flex'>
                    <button
                      onClick={() => { maxV3(), setids(a.id), setidcus(a.id_costomer), localStorage.setItem("iddoc", a.id), setShowee(true) }}
                      style={{ fontSize: 11, height: 28, marginLeft: 5, padding: "0 12px", borderRadius: 8, border: a.re_status === null ? "1px solid #2A6AAA" : "1px solid #d97706", backgroundColor: "white", color: a.re_status === null ? "#2A6AAA" : "#d97706", fontFamily: "kanit", cursor: "pointer", transition: "all 0.2s ease" }}
                      onMouseEnter={(e) => { const c = a.re_status === null ? "#2A6AAA" : "#f59e0b"; e.currentTarget.style.backgroundColor = c; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 2px 8px ${c}4d` }}
                      onMouseLeave={(e) => { const c = a.re_status === null ? "#2A6AAA" : "#d97706"; e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = c; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}>
                      {a.re_status === null ? "สร้าง" : "แก้ไข"}
                    </button>

                    <button
                      onClick={() => { setids(a.id), setidcus(a.id_costomer), setShowev(true) }}
                      style={{ fontSize: 11, height: 28, marginLeft: 5, padding: "0 12px", borderRadius: 8, border: "1px solid #2A6AAA", backgroundColor: "white", color: "#2A6AAA", fontFamily: "kanit", cursor: "pointer", transition: "all 0.2s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#2A6AAA"; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(42, 106, 170,0.3)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = "#2A6AAA"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}>
                      ข้อมูล
                    </button>
                    {renderRowDocumentAttachmentButton("re", Number(a.id))}
                    {renderRowSlipAttachmentButton("re", Number(a.id))}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <BillTemplate_Edit />
          <BillTemplate />
        </div>

      </>

    )
  }

  //*****************   ใบกำกับภาษี  ***************************/
  const Tax = () => {

    //******** */ input Preview *********************
    function BillTemplate() {

      let taxNum = allQT.taxnumber

      //Print Label
      const contentRef = useRef<HTMLDivElement>(null);
      const reactToPrintFn2 = useReactToPrint({
        contentRef,
        documentTitle: allQT.tax_orderfull || `TAX${allQT.tax_orderNo || ""}${allQT.tax_number || ""}`,
        pageStyle: PROFESSIONAL_DOCUMENT_PRINT_PAGE_STYLE,
      });



      return (


        <>

          <Modal_blt
            show={showtv}
            onHide={() => setShowtv(false)}
            size="lg"
            scrollable={true}
            //  fullscreen={true}
            //  dialogClassName="80w"
            aria-labelledby="example-custom-modal-styling-title"
          >
            <Modal_blt.Header closeButton>
              <Modal_blt.Title id="example-custom-modal-styling-title">
                <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>ใบกำกับภาษี</div>
              </Modal_blt.Title>
            </Modal_blt.Header>
            <Modal_blt.Body style={{ backgroundColor: "grey" }}>

              <div className="document-print-sheet" style={PROFESSIONAL_DOCUMENT_PRINT_SHEET_STYLE} ref={contentRef} >
                {renderSalesPrintDocument({
                  docType: "tax",
                  title: "ใบกำกับภาษี",
                  englishTitle: "TAX INVOICE",
                  dateValue: allQT.tax_date,
                  endDateValue: allQT.tax_enddate,
                  creditValue: allQT.tax_credit,
                  personName: allQT.tax_person || allQT.qt_person,
                  remark: allQT.tax_remark,
                  taxNum,
                  status: allQT.tax_status,
                  customerRoleLabel: "ผู้รับใบกำกับภาษี",
                  companyRoleLabel: "ผู้อนุมัติ",
                  paymentInfo: {
                    title: "ช่องทางชำระเงิน",
                    lines: [
                      { label: "ผู้ชำระเงิน", value: allQT.name_costomer || all.names || "-" },
                      { label: "ช่องทางการรับเงิน", value: getReceiptPaymentMethodLabel() },
                    ],
                  },
                })}
                <div style={{ display: "none" }} aria-hidden="true">


                <div className="row" style={{ height: 24 }}></div>
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
                    <div className="row " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{all.names}</div>
                    <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{all.address}</div>
                    <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{all.numbertax}</div>
                    <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {all.tel}</div>

                  </div>

                  {/**ใบเสนราคา */}
                  <div className="col ">
                    <div className="row "
                      style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 20, justifySelf: "center" }}>
                      ใบกำกับภาษี
                    </div>
                    <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                    <div className="row">
                      <div className="col-4 ">
                        <div style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เลขที่ :</div>
                        <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ :</div>
                        <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เครดิต :</div>
                        <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ครบกำหนด :</div>
                        <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>ผู้ขาย :</div>
                      </div>

                      <div className="col ">
                        <div className="col " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>TAX{allQT.tax_orderNo}{allQT.tax_number}</div>
                        <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>
                          {allQT.tax_date === null ? "." : <div>{new Date(allQT.tax_date).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}</div>} </div>
                        <div className="mt-1 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{allQT.tax_credit}</div>
                        <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>
                          {allQT.tax_date === null ? "." : <div>{new Date(allQT.tax_enddate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}</div>}  </div>
                        <div className="mt-1 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{allQT.tax_person}</div>
                      </div>
                    </div>
                    <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                  </div>
                </div>

                <div className="row mt-3" style={{ marginLeft: 20, marginRight: 20 }}>
                  {renderProfessionalPrintItemsTable(qt_detail)}


                  {/**ท้ายบิล Slip */}
                  <div className="container document-print-footer-block">
                    <div className="row mt-2">
                      <div className="col ">
                        <div className="row mb-3 " style={{ fontFamily: "kanit", fontSize: 11, justifySelf: "left", marginLeft: 3 }}>ทั้งหมด : {qt_detail.length} รายการ  </div>
                        <InputGroup>
                          <InputGroup.Text style={{ textAlign: "left", fontFamily: "Kanit", fontSize: 11, height: 60, borderColor: "black", backgroundColor: "white" }}>หมายเหตุ</InputGroup.Text>
                          <Form.Control
                            style={{ fontFamily: "Kanit", fontSize: 12, backgroundColor: "white", borderColor: "black" }}
                            disabled={true}
                            as="textarea"
                            aria-label="With textarea"
                            value={allQT.tax_remark ?? ""}


                          />

                        </InputGroup>

                        <div className="mt-3" style={{ border: "1px solid #d1d5db", borderRadius: 12, padding: "12px 16px" }}>
                          <div style={{ fontFamily: "Kanit_B", fontSize: 12, color: "#7c2d12", marginBottom: 8 }}>ช่องทางชำระเงิน</div>
                          <div style={{ fontFamily: "kanit", fontSize: 11, color: "#1f2937", lineHeight: 1.8 }}>ได้รับเงินจาก {allQT.name_costomer || all.names || "-"}</div>
                          <div style={{ fontFamily: "kanit", fontSize: 11, color: "#1f2937", lineHeight: 1.8 }}>เป็นจำนวนเงินรวมสุทธิ {getDocumentFinancialSummary(taxNum).grandTotal.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} บาท</div>
                          <div style={{ fontFamily: "kanit", fontSize: 11, color: "#1f2937", lineHeight: 1.8 }}>ช่องทางการรับเงิน: {getReceiptPaymentMethodLabel()}</div>
                        </div>

                      </div>

                      <div className="col ">
                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>รวมเงิน :</div>
                          <div className=" bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20, }}>{allQT.sumtotal}</div>
                          <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ส่วนลดท้ายบิล :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{allQT.discount}</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ใช้แต้มส่วนลด :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{allQT.usereward}</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        {String(taxNum) === "" ? "" :
                          <div>
                            <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>จำนวนเงินรวมทั้งสิ้น :</div>
                              <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{allQT.totalall} </div>
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                            </div>
                            <div className="row" style={{ justifySelf: "right", width: "70%", height: 1, backgroundColor: "black" }}></div>
                            <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>หักภาษี ณ ที่จ่าย {allQT.taxnumber} % :</div>
                              <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{((Number(allQT.totalall) * Number(allQT.taxnumber)) / 100).toFixed(1)}
                              </div>
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                            </div>
                          </div>
                        }

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 30 }}>ยอดชำระทั้งหมด :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 30 }}>{
                            (((Number(allQT.totalall) * Number(allQT.taxnumber)) / 100) + Number(allQT.totalall)).toFixed(1)
                          }</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 30 }}>บาท</div>
                        </div>
                        <div className="row" style={{ justifySelf: "right", width: "70%", height: 1, backgroundColor: "black" }}></div>
                      </div>

                    </div>
                    <div className="h-5"></div>
                  </div>


                  <div className="row mt-3 document-print-signatures">
                    <div className="col-5" style={{ justifyItems: "center" }}>
                      <div className="row">
                        <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ลงนาม</div></div>
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
                        <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ลงนาม</div></div>

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



              </div>


            </Modal_blt.Body>
            <Modal_blt.Footer>

              <button
                className="btn btn-primary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={reactToPrintFn2}>
                Print
              </button>

              <button
                className="btn btn-secondary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={() => setShowtv(false)}>
                ปิด
              </button>

            </Modal_blt.Footer>
          </Modal_blt>

        </>

      )
    }

    //******* */ input Edit ************************


    function BillTemplate_Edit() {



      let taxNum = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
        String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
          String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""

      //****** */ input Radio Tax *************
      const [selectedOptiontax, setSelectedOptiontax] = useState('notax');

      //******* เปลี่ยน Tax ภาษี ******************
      const Radio_tax = () => {

        useEffect(() => {
          setSelectedOptiontax(localStorage.getItem("numbertax_S") || "")
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

      //********* เปลี่ยนส่วนลดท้ายบิล ****************         
      const Discount_s = () => {

        const [discountS, setdiscountS] = useState('0')

        useEffect(() => {
          setdiscountS(localStorage.getItem("discount_s") || "")

        }, [Number(discountS)]);


        const [show2, setShow2] = useState(false);

        // Update Quatation
        const EditQuatation = async () => {

          const totalall = Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0))
          const discount = Number(discountS)
          const sumtotal = Number(Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(discountS) - Number(parseInt(allQT.usereward)))

          const usereward = Number(allQT.usereward)
          const taxnumber = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
            String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
              String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""
          const personall = allQT.person
          const statussall = allQT.statuss
          const qt_status = allQT.qt_status
          const qt_person = allQT.qt_person
          const qt_remark = allQT.qt_remark

          try {
            //  localStorage.setItem("show","1")
            //  Save Sale
            await axios.put(`/api/${apiquatation}/${Number(localStorage.getItem("iddoc") || "")}`,
              {

                totalall, discount, sumtotal, usereward, personall, statussall, taxnumber


              })
            await fetchQT_ID()

          } catch (error) {
            console.error(error)
          }
        }
        return (


          <>

            <button
              type="button"
              className="btn btn-outline-success "
              style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", height: 27, width: 40 }}
              onClick={() => { setShow2(true), localStorage.setItem("discount_s", "0") }}
            >
              {Number(allQT.discount)}
            </button>

            <Modal_dc
              show={show2}
              onHide={() => setShow2(false)}
              className="document-modal detail-editor-modal"
              dialogClassName="document-modal-dialog modal-90w"
              backdropClassName="document-modal-backdrop detail-editor-modal-backdrop"
              animation={false}
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

                <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit_B", marginTop: 10, textAlign: "left", height: 35 }}>
                  ส่วนลดรวม : &nbsp;&nbsp;{Number(discountS)}&nbsp;&nbsp; บาท  </div>

              </Modal_dc.Body>
              <Modal_dc.Footer>
                <button
                  className="btn btn-success"

                  style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                  onClick={() => {
                    setShow2(false),
                      setQT({ ...allQT, discount: discountS }),
                      setdiscountS(localStorage.getItem("discount_s") || "")
                    EditQuatation()
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

      const modale = useDisclosure()
      const [priceAct, setEditedpriceAct] = useState<string>("");
      const [priceDis, setEditedpriceDis] = useState<string>("");
      const [editedcode, setEditedcode] = useState<string>("");
      const [editedTaskname, setEditedname] = useState<string>("");
      const [editqty, setEditedqty] = useState<string>("");
      const [editqtyCh, setEditedqtyCh] = useState<string>("");
      const [editid, setid] = useState<number>(0);
      const [editiddoc, setiddoc] = useState<number>(0);

      const [showD, setShowD] = useState(false);
      const [showqty, setShowqty] = useState(false);

      const [remarkQ, setremarkQ] = useState(allQT.tax_remark || allQT.qt_remark || "")
      useEffect(() => { setremarkQ(allQT.tax_remark || allQT.qt_remark || "") }, [allQT.tax_remark, allQT.qt_remark])

      const [st, setst] = useState("")
      /***************************************** */

      //***Order Date Diff */ 
      let dateS = getSafeDocumentDate(allQT.tax_date)
      let dateE = getSafeDocumentDate(allQT.tax_enddate)
      const [startDate, setStartDate] = useState(dateS);
      const [startDate1, setStartDate1] = useState(dateE);

      useEffect(() => {
        if (ids === 0) return

        setStartDate(getSafeDocumentDate(allQT.tax_date))
        setStartDate1(getSafeDocumentDate(allQT.tax_enddate))
      }, [ids, allQT.tax_date, allQT.tax_enddate]);



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


      // Update Quatation
      const EditQuatation = async () => {

        const totalall = Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0))
        const discount = Number(allQT.discount)
        const sumtotal = Number(Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(allQT.discount) - Number(parseInt(allQT.usereward)))

        const usereward = Number(allQT.usereward)
        const taxnumber = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
          String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
            String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""
        const personall = allQT.person
        const statussall = allQT.statuss
        const tax_date = new Date(startDate)
        const tax_enddate = new Date(startDate1)
        const tax_credit = Number(daysDiff)
        const tax_status = localStorage.getItem("st") || ""
        const tax_person = allQT.tax_person || allQT.qt_person
        const tax_remark = remarkQ
        const tax_orderNo = String(year) + String(month) + String(day)
        const tax_number = maxRecN4
        const tax_orderfull = "TAX" + String(year) + String(month) + String(day) + maxRecN4

        try {
          //   localStorage.setItem("show","1")
          //Save Sale
          await axios.put(`/api/${apiquatation}/${Number(localStorage.getItem("iddoc") || "")}`,
            {

              totalall, discount, sumtotal, usereward, personall, statussall, taxnumber,
              tax_status, tax_person, tax_remark, tax_date, tax_enddate, tax_credit, tax_orderNo, tax_number, tax_orderfull

            })

          setTimeout(() => {
            fetchQT_ID()
            fetchQT()
          }, 700);


        } catch (error) {
          console.error(error)
        }
      }

      // Update Quatation_Detail
      const EditQuatation_Detail = async () => {

        const qty = Number(editqtyCh)
        const price = Number(priceAct)
        const discount = Number(priceDis)
        const total = Number(Number(editqtyCh) * (Number(priceAct) - Number(priceDis)))
        const person = ""


        try {
          await axios.put(`/api/${apiquatation_detail}/${Number(editid)}`,
            {

              qty, price, discount, total, person


            })

          await fetchQT_IDDetail()
          await setTimeout(() => {
            EditQuatation()

          }, 1000);

        } catch (error) {
          console.error(error)
        }
      }


      //******** */ Search สินค้า*****************/
      function Search_Product() {

        //*******Show Modal **********************************/
        const [show1, setShow1] = useState(false);
        const handleClose = () => setShow1(false);
        const handleShow = () => setShow1(true);
        const handleClose1 = () => { Post_Quatation_Detail(), setShow1(false) };
        //******* */  Key ค้นหา สินค้า  ************************/
        const [data, setData] = useState(dataProduct);
        const [search, setsearch] = useState("")

        const handleChange = (value: any) => {
          setsearch(value);
          filterDataProduct(value);
        };

        // filter records by Productname
        const filterDataProduct = (value: any) => {
          const lowercasedValue = String(value || "").toLowerCase().trim();
          if (lowercasedValue === "") setData(dataProduct);
          else {
            const filteredData = dataProduct.filter((user: any) =>
              String(user?.ProductName || "").toLowerCase().includes(lowercasedValue)
              || String(user?.code || "").toLowerCase().includes(lowercasedValue)
              || String(user?.Barcode || "").toLowerCase().includes(lowercasedValue)
            );
            setData(filteredData);
          }
        };

        //***************************************************************** */
        const [idP, setidP] = useState("")
        const [code, setcode] = useState("")
        const [product, setProduct] = useState("")
        const [priceS, setprice] = useState("")
        const [unitS, setunit] = useState("")
        const [qtyP, setqtyP] = useState("1")

        // Update Quatation_Detail
        const Post_Quatation_Detail = async () => {
          let currentIds = ids
          if (!currentIds || currentIds === 0) {
            const newId = await createNewDocMain("tax")
            if (!newId) return
            currentIds = newId
          }
          const company = String(localStorage.getItem("company_") || "")
          const id_product = Number(idP)
          const code_product = code
          const name_product = product
          const unit = unitS
          const qty = Number(qtyP)
          const price = Number(priceS)
          const total = Number(qtyP) * Number(priceS)
          const person = ""
          const id_docmain = Number(currentIds)


          try {
            await axios.post(`/api/${apiquatation_detail}`,
              {
                unit, qty, price, total, person, company, id_product, code_product, name_product, id_docmain

              })

            await fetchQT_IDDetail(currentIds)


          } catch (error) {
            console.error(error)
          }
        }



        return (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleShow(); }}
              style={{
                fontFamily: "Kanit", fontSize: 13, padding: "6px 16px", borderRadius: 8,
                border: "1.5px solid #2A6AAA", backgroundColor: "#F3F8FC", color: "#2A6AAA",
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                transition: "all 0.15s", whiteSpace: "nowrap", fontWeight: 600,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#E5EEF8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#F3F8FC"; }}
            >
              + เพิ่มสินค้า
            </button>

            <Modal1 show={show1} onHide={handleClose} className="document-modal product-picker-modal" dialogClassName="document-modal-dialog" backdropClassName="document-modal-backdrop product-picker-modal-backdrop">
              <Modal1.Header closeButton>
                <Modal1.Title
                  style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, height: 20 }}>
                  ค้นหาชื่อ, รหัส, Barcode สินค้า
                </Modal1.Title>
              </Modal1.Header>
              <Modal1.Body>
                <div>
                  <div className={styles.bodydetailTable_Re} style={{ width: "4vw" }}>ค้นหา</div>
                  <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                    <input
                      value={search}
                      onChange={(e) => handleChange(e.target.value)}
                      className="form-control form-control-sm"
                      placeholder="ค้นหาชื่อ, รหัส, Barcode สินค้า"
                      style={{ fontFamily: "Kanit", fontSize: 10, height: 12 }} />
                  </div>

                  <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
                    <table className="table table-sm table-hover"   >
                      <thead style={{ position: "sticky", top: "0" }}>
                        <tr>
                          <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "4vw" }}>
                            <div style={{ width: "4vw" }}>รหัสสินค้า</div>

                          </th>
                          <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "15vw" }}>
                            <div style={{ width: "15vw" }}>ชื่อสินค้า</div>

                          </th>
                          <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "7vw" }}>
                            <div style={{ width: "7vw" }}>barcode</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="table-group-divider " >
                        {data.map((post: any) => (
                          <tr key={post.id}
                            onClick={() => {
                              setidP(post.id),
                                setcode(post.code),
                                setProduct(post.ProductName),
                                setprice(post.price),
                                setunit(post.Unit)

                            }}>
                            <td className={styles.bodydetailTable_Re1} style={{ width: "4vw" }}>{post.code}</td>
                            <td className={styles.bodydetailTable_Re1} style={{ width: "15vw" }}>{post.ProductName}</td>
                            <td className={styles.bodydetailTable_Re1} style={{ width: "7vw" }}>{post.Barcode}</td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
                <div className='row'>
                  <div className='d-flex mt-1'>
                    <div style={{ fontFamily: "Kanit_B", textAlign: "left", fontSize: 15 }}>{code}</div>
                    <div style={{ fontFamily: "Kanit_B", textAlign: "left", fontSize: 15, marginLeft: 10 }}>{product}</div>
                  </div>
                  <div className='d-flex mt-2'>
                    <div style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, marginLeft: 10, marginTop: 10 }}>ราคา :&nbsp;&nbsp; {priceS}&nbsp;&nbsp; บาท&nbsp;&nbsp;&nbsp; จำนวน</div>
                    <input
                      className="form-control form-control-sm "

                      style={{ width: 50, marginLeft: 10, marginRight: 10, height: 20, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                      value={qtyP}
                      onChange={(e) => setqtyP(e.target.value)} />
                    <div style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, marginLeft: 10, marginTop: 10 }}>{unitS}&nbsp;&nbsp;ราคารวม : &nbsp;&nbsp;{Number(qtyP) * Number(priceS)}&nbsp;&nbsp; บาท</div>
                  </div>


                </div>

              </Modal1.Body>
              <Modal1.Footer >

                <Button1
                  variant="secondary"
                  onClick={handleClose}
                  style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}
                >
                  ปิด
                </Button1>
                <Button1
                  variant="primary"
                  onClick={handleClose1}
                  style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}
                >
                  เพิ่ม
                </Button1>
              </Modal1.Footer>
            </Modal1>
          </>
        );
      }

      const taxNumberDisplay = allQT.tax_number === null || allQT.tax_number === undefined
        ? `TAX${year}${month}${day}${maxRecN4}`
        : `TAX${allQT.tax_orderNo}${allQT.tax_number}`

      const openQuantityEditor = (detail: any) => {
        setShowqty(true)
        setEditedpriceDis(String(detail.discount || "0"))
        setEditedpriceAct(String(detail.price || "0"))
        setEditedqty(String(detail.qty || "0"))
        setEditedqtyCh(String(detail.qty || "0"))
        setEditedcode(String(detail.code_product || ""))
        setEditedname(String(detail.name_product || ""))
        setid(Number(detail.id || 0))
        setiddoc(Number(detail.id_docmain || 0))
        localStorage.setItem("idd", String(detail.id_docmain || 0))
      }

      const openDiscountEditor = (detail: any) => {
        setShowD(true)
        setEditedpriceDis(String(detail.discount || "0"))
        setEditedpriceAct(String(detail.price || "0"))
        setEditedqty(String(detail.qty || "0"))
        setEditedqtyCh(String(detail.qty || "0"))
        setEditedcode(String(detail.code_product || ""))
        setEditedname(String(detail.name_product || ""))
        setid(Number(detail.id || 0))
        setiddoc(Number(detail.id_docmain || 0))
        localStorage.setItem("idd", String(detail.id_docmain || 0))
      }

      const updateTaxStatus = async (nextStatus: string) => {
        localStorage.setItem("st", nextStatus)
        setst(nextStatus)
        if (ids === 0) {
          const newId = await createNewDocMain("tax")
          if (!newId) return
        }
        setTimeout(() => {
          EditQuatation()
        }, 500)
      }

      return (


        <>

          {useModernSalesDocumentLayout ? (
            <Modal_blt
              show={showte}
              onHide={() => setShowte(false)}
              size="xl"
              scrollable={true}
              className="document-modal"
              dialogClassName="document-modal-dialog"
              backdropClassName="document-modal-backdrop"
              animation={false}
              enforceFocus={false}
              aria-labelledby="example-custom-modal-styling-title"
            >
              <Modal_blt.Header closeButton style={{ borderBottom: "1px solid #e5e7eb", padding: "16px 24px", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" }}>
                <Modal_blt.Title id="example-custom-modal-styling-title" style={{ width: "100%" }}>
                  {renderDocumentModalTitle({
                    title: "ใบกำกับภาษี",
                    docDisplay: taxNumberDisplay,
                    status: allQT.tax_status,
                    icon: <CreditCard size={18} color="white" />,
                    iconBackground: "linear-gradient(135deg, #7c3aed, #a855f7)",
                  })}
                </Modal_blt.Title>
              </Modal_blt.Header>

              {renderDocumentWorkflowStepper("TAX")}

              <Modal_blt.Body style={{ backgroundColor: "#f8fafc", padding: "20px 24px" }}>
                {renderDocumentInfoGrid({
                  docType: "tax",
                  docDisplay: taxNumberDisplay,
                  startDate,
                  setStartDate,
                  startDate1,
                  setStartDate1,
                  creditDays: daysDiff,
                  personDisplay: allQT.tax_person || allQT.qt_person,
                  detailIcon: <CreditCard size={14} color="#2A6AAA" />,
                })}
                {renderDocumentItemsSection({
                  searchProductControl: renderProductSearchControl("tax"),
                  onEditQuantity: openQuantityEditor,
                  onEditDiscount: openDiscountEditor,
                  onDeleteItem: DeleteQT_ID,
                  showqty,
                  setShowqty,
                  showD,
                  setShowD,
                  priceAct,
                  setEditedpriceAct,
                  priceDis,
                  setEditedpriceDis,
                  editedcode,
                  editedTaskname,
                  editqty,
                  editqtyCh,
                  setEditedqtyCh,
                  onApplyDetailEdit: EditQuatation_Detail,
                })}
                {renderDocumentSummarySection({
                  remarkQ,
                  setremarkQ,
                  discountControl: <Discount_s />,
                  taxNum,
                  attachmentDocType: "tax",
                })}
                {renderDocumentSignatureSection()}
              </Modal_blt.Body>

              <Modal_blt.Footer style={{ borderTop: "1px solid #e5e7eb", padding: "12px 24px", background: "#fafbfc", justifyContent: "space-between" }}>
                {renderDocumentFooterActions({
                  taxControl: <Radio_tax />,
                  status: allQT.tax_status,
                  onChangeStatus: updateTaxStatus,
                  createControl: renderDocumentCreateDropdown("tax"),
                  onSave: async () => {
                    if (ids === 0) {
                      const newId = await createNewDocMain("tax")
                      if (!newId) return
                    }
                    EditQuatation()
                    setShowte(false)
                    fetchQT_ID()
                  },
                  onClose: () => setShowte(false),
                })}
              </Modal_blt.Footer>
            </Modal_blt>
          ) : (

          <Modal_blt
            show={showte}
            onHide={() => setShowte(false)}
            size="lg"
            scrollable={true}
            className="document-modal"
            dialogClassName="document-modal-dialog"
            backdropClassName="document-modal-backdrop"
            animation={false}
            enforceFocus={false}
            aria-labelledby="example-custom-modal-styling-title"
          >
            <Modal_blt.Header closeButton>
              <Modal_blt.Title id="example-custom-modal-styling-title">
                <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>สร้างใบกำกับภาษี</div>
              </Modal_blt.Title>
            </Modal_blt.Header>
            <Modal_blt.Body style={{ backgroundColor: "grey" }}>

              <div className="col  " style={{ justifySelf: "center", backgroundColor: "white", marginLeft: 20, marginRight: 20 }}  >


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
                    <div className="row " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{all.names}</div>
                    <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{all.address}</div>
                    <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{all.numbertax}</div>
                    <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {all.tel}</div>

                  </div>

                  {/**ใบเสนราคา */}
                  <div className="col ">
                    <div className="row "
                      style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 20, justifySelf: "center" }}>
                      ใบกำกับภาษี
                    </div>
                    <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                    <div className="row">
                      <div className="col-4 ">
                        <div style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เลขที่ :</div>
                        <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ :</div>
                        <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เครดิต :</div>
                        <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันครบกำหนด :</div>
                        <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>ผู้ขาย :</div>
                      </div>

                      <div className="col ">
                        <div className="col " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>

                          {allQT.tax_number === null ? <div>TAX{year}{month}{day}{maxRecN4}</div> :
                            <div>TAX{allQT.tax_orderNo}{allQT.tax_number}</div>}


                        </div>


                        <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>

                          {/**Open */}
                          <div className='border border-black shadow shadow-sm rounded ' style={{ width: 130, height: 25 }}>
                            <div style={{ width: 100, marginLeft: 10, marginTop: 2 }}>
                              <DatePicker
                                value={

                                  new Date(startDate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
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
                              <DatePicker value=
                                {

                                  new Date(startDate1).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                                selected={startDate1} 
                                onChange={(date: any) => setStartDate1(date)} />
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>ชื่อผู้ขาย</div>

                        <div className="mt-1 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{allQT.tax_person}</div>
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
                    <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>ลบ</div>
                  </div>
                  <div className="mt-1 " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                  <table className="table table-hover"   >
                    <tbody className="">
                      <tr className="">
                        <td className="">
                          {qt_detail.sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)))
                            .map((a: any) =>
                              <div key={a.id} id="selcet-print">
                                <div className="d-flex bd-highlight" style={{ justifyItems: "end" }} >
                                  <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit", fontSize: 12, textAlign: "start", height: 30, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>{a.name_product}</div>
                                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 12, textAlign: "center", height: 30, width: 30 }}>

                                    <>
                                      <button

                                        className="btn btn-outline-success btn-sm"
                                        style={{ height: 24, fontSize: 12, fontFamily: "Kanit_B", width: 35 }}
                                        onClick={() => {
                                          setShowqty(true),
                                            setEditedpriceDis(String(a.discount)),
                                            setEditedpriceAct(String(a.price)),
                                            setEditedqty(String(a.qty)),
                                            setEditedqtyCh(String(a.qty)),
                                            setEditedcode(String(a.code_product)),
                                            setEditedname(String(a.name_product)),
                                            setid(Number(a.id)),
                                            setiddoc(Number(a.id_docmain)),
                                            localStorage.setItem("idd", String(a.id_docmain))

                                        }}>
                                        {a.qty}
                                      </button>
                                      <Modal_qty
                                        show={showqty}
                                        onHide={() => setShowqty(false)}
                                        dialogClassName="modal-90w"
                                        aria-labelledby="example-custom-modal-styling-title"
                                      >
                                        <Modal_qty.Header closeButton>
                                          <Modal_qty.Title id="example-custom-modal-styling-title">
                                            <div style={{ width: "auto", height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>ปรับจำนวน</div>
                                          </Modal_qty.Title>
                                        </Modal_qty.Header>
                                        <Modal_qty.Body>     <div className='d-flex'>
                                          <div style={{ width: "auto", height: 30, fontSize: 15, fontFamily: "Kanit_B" }}>{editedcode}</div>
                                          <div style={{ width: "auto", marginLeft: 5, height: 30, fontSize: 15, fontFamily: "Kanit_B" }}>{editedTaskname}</div>
                                        </div>
                                          <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
                                            <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                                              ราคา : {priceAct}  บาท
                                            </div>
                                          </div>
                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>คงเหลือ : {Number(priceAct) - Number(priceDis)} บาท/ชิ้น</div>
                                          <div className='d-flex'>
                                            <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10 }}>
                                              จำนวนสินค้า : {Number(editqty)} ชิ้น ปรับจำนวนเป็น
                                            </div>

                                            <input className="form-control form-control-sm mt-1" style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                                              value={editqtyCh}
                                              onChange={(e) => setEditedqtyCh(e.target.value)} />
                                            <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>ชิ้น</div>
                                          </div>


                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>ยอดรวม : {Number(editqtyCh) * (Number(priceAct) - Number(priceDis))} บาท/ชิ้น</div>
                                        </Modal_qty.Body>
                                        <Modal_qty.Footer>
                                          <button
                                            className="btn btn-success"

                                            style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                                            onClick={() => { EditQuatation_Detail(), setShowqty(false), fetchQT_ID() }}
                                          >
                                            ตกลง
                                          </button>
                                          <button
                                            className="btn btn-secondary"
                                            style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                                            onClick={() => setShowqty(false)}
                                          >
                                            ปิด
                                          </button>

                                        </Modal_qty.Footer>
                                      </Modal_qty>


                                    </>
                                  </div>
                                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 12, textAlign: "end", height: 30, width: 50 }}>{a.unit}</div>
                                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 12, textAlign: "end", height: 30, width: 70 }}>{a.price}</div>
                                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 12, textAlign: "end", height: 30, width: 50 }} >
                                    <>
                                      <button

                                        className="btn btn-outline-success btn-sm"
                                        style={{ height: 24, fontSize: 12, fontFamily: "Kanit_B", width: 35 }}
                                        onClick={() => {
                                          setShowD(true),
                                            setEditedpriceDis(String(a.discount)),
                                            setEditedpriceAct(String(a.price)),
                                            setEditedqty(String(a.qty)),
                                            setEditedqtyCh(String(a.qty)),
                                            setEditedcode(String(a.code_product)),
                                            setEditedname(String(a.name_product)),
                                            setid(Number(a.id)),
                                            setiddoc(Number(a.id_docmain)),
                                            localStorage.setItem("idd", String(a.id_docmain))
                                        }}>
                                        {a.discount}
                                      </button>
                                      <Modal_ds
                                        show={showD}
                                        onHide={() => setShowD(false)}
                                        dialogClassName="modal-90w"
                                        aria-labelledby="example-custom-modal-styling-title"
                                      >
                                        <Modal_ds.Header closeButton>
                                          <Modal_ds.Title id="example-custom-modal-styling-title">
                                            <div style={{ width: "auto", height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>ส่วนลดราคา</div>
                                          </Modal_ds.Title>
                                        </Modal_ds.Header>
                                        <Modal_ds.Body>     <div className='d-flex'>
                                          <div style={{ width: "auto", height: 30, fontSize: 15, fontFamily: "Kanit_B" }}>{editedcode}</div>
                                          <div style={{ width: "auto", marginLeft: 5, height: 30, fontSize: 15, fontFamily: "Kanit_B" }}>{editedTaskname}</div>
                                        </div>
                                          <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
                                            <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                                              ราคาจาก : {priceAct}  บาท   ลดราคาชิ้นละ</div>

                                            <input className="form-control form-control-sm mt-1" style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                                              value={priceDis}
                                              onChange={(e) => setEditedpriceDis(e.target.value)} />
                                            <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>บาท</div>

                                          </div>
                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>คงเหลือ : {Number(priceAct) - Number(priceDis)} บาท/ชิ้น</div>
                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>จำนวนสินค้า : {Number(editqty)} ชิ้น</div>
                                          <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>ยอดรวม : {Number(editqty) * (Number(priceAct) - Number(priceDis))} บาท/ชิ้น</div>
                                        </Modal_ds.Body>
                                        <Modal_ds.Footer>
                                          <button
                                            className="btn btn-success"

                                            style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                                            onClick={() => {
                                              EditQuatation_Detail(), setShowD(false)
                                              //    setQT({...allQT, discount:discountS}),
                                              //    setdiscountS(localStorage.getItem("discount_s") || "")

                                            }}
                                          >
                                            ตกลง
                                          </button>
                                          <button
                                            className="btn btn-secondary"
                                            style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                                            onClick={() => { setShowD(false) }}
                                          >
                                            ปิด
                                          </button>

                                        </Modal_ds.Footer>
                                      </Modal_ds>


                                    </>
                                  </div>
                                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 30, width: 50 }}>{a.total}</div>
                                  <div className=' bd-highlight' style={{ height: 30, width: 50 }}>
                                    <Image onClick={() => DeleteQT_ID(a.id)} alt={""} src={deletes} width={20} height={20} style={{ marginLeft: 30, cursor: "pointer" }} />
                                  </div>
                                </div>
                              </div>
                            )}
                        </td>

                      </tr>

                    </tbody>
                  </table>
                  <div className="d-flex flex-row-reverse bd-highlight" style={{ width: "100%" }}>

                    <div className='p-2 bd-highlight'> <Search_Product /> </div>
                  </div>
                  <div className=" " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                  <div className="row mt-2 " style={{ fontFamily: "kanit", fontSize: 11, justifySelf: "left", marginLeft: 3 }}>ทั้งหมด : {qt_detail.length} รายการ  </div>

                  {/**ท้ายบิล Slip */}
                  <div className="container">
                    <div className="row ">

                      <div className="col mt-2">
                        <InputGroup>
                          <InputGroup.Text style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>หมายเหตุ</InputGroup.Text>
                          <Form.Control
                            style={{ fontFamily: "Kanit", fontSize: 12 }}
                            as="textarea"
                            aria-label="With textarea"
                            value={remarkQ ?? ""}
                            onChange={(e) => setremarkQ(e.target.value)}

                          />

                        </InputGroup>

                      </div>
                      <div className="col ">
                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>รวมเงิน :</div>
                          <div className=" bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 27, }}>{Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0))}</div>
                          <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ส่วนลดท้ายบิล :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 27 }}><Discount_s /></div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ใช้แต้มส่วนลด :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 27 }}>{allQT.usereward}</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                        </div>

                        {String(taxNum) === "" ? "" :
                          <div>
                            <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>จำนวนเงินรวมทั้งสิ้น :</div>
                              <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 27 }}>{Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(allQT.discount) - Number(allQT.usereward)} </div>
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                            </div>
                            <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                            <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>หักภาษี ณ ที่จ่าย {allQT.taxnumber !== taxNum ? taxNum : allQT.taxnumber} % :</div>
                              <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 27 }}>{((Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) * Number(allQT.taxnumber !== taxNum ? taxNum : allQT.taxnumber)) / 100).toFixed(1)}
                              </div>
                              <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                            </div>
                          </div>
                        }

                        <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 30 }}>ยอดชำระทั้งหมด :</div>
                          <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 30 }}>
                            {((((Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(allQT.discount) - Number(allQT.usereward)) * Number(allQT.taxnumber !== taxNum ? taxNum : allQT.taxnumber)) / 100) + (Number(qt_detail.map(num => num).reduce((acc: any, curr: any) => acc + curr.total, 0)) - Number(allQT.discount) - Number(allQT.usereward))).toFixed(1)}</div>
                          <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 30 }}>บาท</div>
                        </div>
                        <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                      </div>
                    </div>
                    <div className="h-5">
                    </div>
                  </div>


                  <div className="row mt-3">
                    <div className="col-5" style={{ justifyItems: "center" }}>
                      <div className="row">
                        <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ลงนาม</div></div>
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
                        <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ลงนาม</div></div>

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




            </Modal_blt.Body>
            <Modal_blt.Footer>
              {/**ปรับ%ภาษี */}
              <Radio_tax />
              {/**การอนุมัติ */}
              <Dropdown
                className="d-inline mx-2"
              >

                <Dropdown.Toggle
                  id="dropdown-autoclose-true"
                  variant={
                    allQT.tax_status === "อนุมัติ" ? "success" :
                      allQT.tax_status === "รออนุมัติ" ? "warning" :
                        allQT.tax_status === "ยกเลิก" ? "danger" : "primary"
                  }
                  style={{ fontSize: 15, fontFamily: "kanit", height: 40 }}>
                  {allQT.tax_status === null ? "รออนุมัติ" : allQT.tax_status}
                </Dropdown.Toggle>

                <Dropdown.Menu >
                  <Dropdown.Item href="#"
                    onClick={() => {
                      localStorage.setItem("st", "รออนุมัติ"),
                        setst("รออนุมัติ"),
                        setTimeout(() => {
                          EditQuatation()
                        }, 500)
                    }}
                    style={{ fontSize: 15, fontFamily: "kanit" }}>รออนุมัติ</Dropdown.Item>
                  <Dropdown.Item href="#"
                    onClick={() => {
                      localStorage.setItem("st", "อนุมัติ"),
                        setst("อนุมัติ")
                      setTimeout(() => {
                        EditQuatation()
                      }, 500)
                    }}
                    style={{ fontSize: 15, fontFamily: "kanit" }}>อนุมัติ</Dropdown.Item>
                  <Dropdown.Item href="#"
                    onClick={() => {
                      localStorage.setItem("st", "ยกเลิก"),
                        setst("ยกเลิก")
                      setTimeout(() => {
                        EditQuatation()
                      }, 500)
                    }}

                    style={{ fontSize: 15, fontFamily: "kanit" }}>

                    ยกเลิก</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <button
                className="btn btn-success"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={() => { EditQuatation(), setShowte(false), fetchQT() }}
              >
                บันทึก
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={() => setShowte(false)}>
                ปิด
              </button>

            </Modal_blt.Footer>
          </Modal_blt>

          )}

        </>

      )
    }

    return (

      <>
        <div className="col">
          <div className='d-flex align-items-center justify-content-between mb-1 mt-1' style={{ gap: 12 }}>
            <div style={{ fontFamily: "kanit_B", fontSize: 18, color: "#1f2937" }}>ใบกำกับภาษี</div>
            <button
              type="button"
              onClick={() => openCreateDocumentDraft("five")}
              style={{
                padding: "6px 16px", borderRadius: 8, border: "1.5px solid #2A6AAA",
                backgroundColor: "#F3F8FC", color: "#2A6AAA", fontSize: 13,
                fontFamily: "kanit_B", cursor: "pointer", display: "inline-flex",
                alignItems: "center", gap: 6, whiteSpace: "nowrap",
              }}
            >
              <Plus size={14} /> สร้างเอกสาร
            </button>
          </div>
          <table className="table table-hover" style={{ borderCollapse: "separate", borderSpacing: "0" }}>
            <thead >
              <tr >
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>วันที่สร้าง</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>เลขที่เอกสาร</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>ชื่อลูกค้า/ชื่อโปรเจค</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>ยอดรวมสุทธิ</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>สถานะ</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", width: 120, textAlign: "center" }}></td>

              </tr>
            </thead>
            <tbody >
              {filterBySearch(filterByStatus(qt.filter((d: any) => d.re_status === "อนุมัติ" || d.tax_status === "อนุมัติ" || d.tax_status === "รออนุมัติ" || d.tax_status === "ยกเลิก"), "tax"), "tax").sort((a: any, b: any) => a.createDate.localeCompare(b.createDate)).map((a: any) =>
                <tr key={a.id} onClick={() => setSelectedDocRow(a)} style={{ cursor: "pointer", backgroundColor: selectedDocRow?.id === a.id ? "#F3F8FC" : undefined }} >
                  <td style={{ fontFamily: "kanit", fontSize: 10, height: 40 }}>

                    {a.re_enddate === null ? <></> :
                      <div style={{ fontFamily: "kanit", fontSize: 10, height: 12 }}>
                        ใบเสร็จรับเงิน : {new Date(a.re_enddate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                      </div>}
                    {a.tax_date === null ? <></> :
                      <div style={{ fontFamily: "kanit", fontSize: 13 }}>
                        {new Date(a.tax_date).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                      </div>}
                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 10, height: 40 }}>
                    {a.re_enddate === null ? <></> :
                      <div style={{ fontFamily: "kanit", fontSize: 10, height: 12 }}>
                        ใบเสร็จรับเงิน : RE{a.re_orderNo}{a.re_number}</div>}

                    {a.tax_date === null ? <></> :
                      <div style={{ fontFamily: "kanit", fontSize: 13 }}>
                        TAX{a.tax_orderNo}{a.tax_number}</div>}

                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40 }}>{a.name_costomer}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>{(Number(a.totalall) + ((Number(a.totalall) * Number(a.taxnumber)) / 100)).toFixed(1)}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>

                    <span style={{
                      fontFamily: "kanit", fontSize: 11, padding: "3px 12px", borderRadius: 20,
                      backgroundColor: a.tax_status === "อนุมัติ" ? "#D3F0E2" : a.tax_status === "รออนุมัติ" ? "#fef3c7" : a.tax_status === "ยกเลิก" ? "#fee2e2" : "#e0e7ff",
                      color: a.tax_status === "อนุมัติ" ? "#0C5238" : a.tax_status === "รออนุมัติ" ? "#92400e" : a.tax_status === "ยกเลิก" ? "#991b1b" : "#3730a3",
                      fontWeight: 600,
                    }}>{a.tax_status === null ? "สร้างใบกำกับภาษี" : a.tax_status}</span>

                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, textAlign: "center", height: 50 }} className='d-flex'>
                    <button
                      onClick={() => { maxV4(), setids(a.id), setidcus(a.id_costomer), localStorage.setItem("iddoc", a.id), setShowte(true) }}
                      style={{ fontSize: 11, height: 28, marginLeft: 5, padding: "0 12px", borderRadius: 8, border: a.tax_status === null ? "1px solid #2A6AAA" : "1px solid #d97706", backgroundColor: "white", color: a.tax_status === null ? "#2A6AAA" : "#d97706", fontFamily: "kanit", cursor: "pointer", transition: "all 0.2s ease" }}
                      onMouseEnter={(e) => { const c = a.tax_status === null ? "#2A6AAA" : "#f59e0b"; e.currentTarget.style.backgroundColor = c; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 2px 8px ${c}4d` }}
                      onMouseLeave={(e) => { const c = a.tax_status === null ? "#2A6AAA" : "#d97706"; e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = c; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}>
                      {a.tax_status === null ? "สร้าง" : "แก้ไข"}
                    </button>

                    <button
                      onClick={() => { setids(a.id), setidcus(a.id_costomer), setShowtv(true) }}
                      style={{ fontSize: 11, height: 28, marginLeft: 5, padding: "0 12px", borderRadius: 8, border: "1px solid #2A6AAA", backgroundColor: "white", color: "#2A6AAA", fontFamily: "kanit", cursor: "pointer", transition: "all 0.2s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#2A6AAA"; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(42, 106, 170,0.3)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = "#2A6AAA"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}>
                      ข้อมูล
                    </button>
                    {renderRowDocumentAttachmentButton("tax", Number(a.id))}
                    {renderRowSlipAttachmentButton("tax", Number(a.id))}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <BillTemplate_Edit />
          <BillTemplate />
        </div>

      </>

    )
  }

  //*****************   ใบเพิ่มหนี้  ***************************/
  const DebitNote = () => {
    const debitNumberDisplay = allQT.debit_number === null || allQT.debit_number === undefined || allQT.debit_number === ""
      ? `DN${year}${month}${day}${maxRecN5}`
      : String(allQT.debit_orderfull || buildDocumentOrderFull("debit", String(allQT.debit_orderNo || ""), Number(allQT.debit_number || 0)))

    function DebitNotePreview() {
      const debitAmounts = getDebitNoteAmounts(allQT)
      const contentRef = useRef<HTMLDivElement>(null)
      const reactToPrintFn = useReactToPrint({
        contentRef,
        documentTitle: allQT.debit_orderfull || debitNumberDisplay,
        pageStyle: PROFESSIONAL_DOCUMENT_PRINT_PAGE_STYLE,
      })

      return (
        <Modal_blrc
          show={showdv}
          onHide={() => setShowdv(false)}
          size="lg"
          scrollable={true}
          aria-labelledby="debit-note-preview-title"
        >
          <Modal_blrc.Header closeButton>
            <Modal_blrc.Title id="debit-note-preview-title">
              <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>ใบเพิ่มหนี้</div>
            </Modal_blrc.Title>
          </Modal_blrc.Header>
          <Modal_blrc.Body style={{ backgroundColor: "grey" }}>
            <div className="document-print-sheet" style={PROFESSIONAL_DOCUMENT_PRINT_SHEET_STYLE} ref={contentRef}>
              {renderSalesPrintHeader({
                title: "ใบเพิ่มหนี้",
                englishTitle: "DEBIT NOTE",
                documentNumber: debitNumberDisplay,
                dateValue: allQT.debit_date,
                endDateValue: allQT.debit_enddate,
                creditValue: allQT.debit_credit,
                personName: allQT.debit_person || allQT.tax_person || allQT.qt_person,
              })}
              <div style={{ display: "none" }} aria-hidden="true">
              <div className="row" style={{ height: 24 }}></div>
              <div className="row" style={{ marginLeft: 20, marginRight: 20 }}>
                <div className="col">
                  <div className="row mt-4" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ขาย</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{storeS}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{addressS}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี : {taxS}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {telS}</div>

                  <div className="row mt-3" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ซื้อ</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{all.names || allQT.name_costomer || "-"}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{all.address || "-"}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี : {all.numbertax || "-"}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {all.tel || "-"}</div>
                </div>

                <div className="col">
                  <div className="row" style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 20, justifySelf: "center" }}>
                    ใบเพิ่มหนี้ (Debit Note)
                  </div>
                  <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "75%", height: 1, backgroundColor: "black" }}></div>

                  <div className="row">
                    <div className="col-5">
                      <div style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เลขที่ :</div>
                      <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ :</div>
                      <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เครดิต :</div>
                      <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>ครบกำหนด :</div>
                      <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>ผู้ออกเอกสาร :</div>
                    </div>

                    <div className="col">
                      <div style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{debitNumberDisplay}</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{formatDocumentDate(allQT.debit_date)}</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{allQT.debit_credit || 0} วัน</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{formatDocumentDate(allQT.debit_enddate)}</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{allQT.debit_person || allQT.tax_person || allQT.qt_person || "-"}</div>
                    </div>
                  </div>
                </div>
              </div>
              </div>

              <div style={{ margin: "20px" }}>
                <div style={{ border: "1px solid #d1d5db", borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
                  <div style={{ fontFamily: "Kanit_B", fontSize: 12, color: "#0f766e", marginBottom: 10 }}>รายละเอียดการอ้างอิง</div>
                  <div style={{ fontFamily: "kanit", fontSize: 12, marginBottom: 6 }}>อ้างอิงใบกำกับภาษีเดิมเลขที่ : {allQT.debit_reference_no || allQT.tax_orderfull || "-"}</div>
                  <div style={{ fontFamily: "kanit", fontSize: 12, lineHeight: 1.6 }}>สาเหตุที่เพิ่มหนี้ : {allQT.debit_reason || "-"}</div>
                </div>

                <table className="document-print-items" style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #d1d5db", backgroundColor: "#f8fafc", fontFamily: "kanit_B", fontSize: 12 }}>รายการ</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid #d1d5db", backgroundColor: "#f8fafc", fontFamily: "kanit_B", fontSize: 12 }}>จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontFamily: "kanit", fontSize: 12 }}>มูลค่าเดิม</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontFamily: "kanit", fontSize: 12, textAlign: "right" }}>{formatDocumentCurrency(debitAmounts.originalAmount)} บาท</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontFamily: "kanit", fontSize: 12 }}>มูลค่าที่ถูกต้อง</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontFamily: "kanit", fontSize: 12, textAlign: "right" }}>{formatDocumentCurrency(debitAmounts.correctAmount)} บาท</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontFamily: "kanit", fontSize: 12 }}>ส่วนต่างที่ต้องเพิ่ม</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontFamily: "Kanit_B", fontSize: 12, textAlign: "right", color: "#0f766e" }}>{formatDocumentCurrency(debitAmounts.differenceAmount)} บาท</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontFamily: "kanit", fontSize: 12 }}>VAT {debitAmounts.vatRate}% จากส่วนต่าง</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontFamily: "kanit", fontSize: 12, textAlign: "right" }}>{formatDocumentCurrency(debitAmounts.vatAmount)} บาท</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "12px", fontFamily: "Kanit_B", fontSize: 12, backgroundColor: "#F3F8FC" }}>ยอดรวมที่ลูกค้าต้องชำระเพิ่ม</td>
                      <td style={{ padding: "12px", fontFamily: "Kanit_B", fontSize: 13, textAlign: "right", backgroundColor: "#F3F8FC", color: "#173F6B" }}>{formatDocumentCurrency(debitAmounts.grandTotal)} บาท</td>
                    </tr>
                  </tbody>
                </table>

                <InputGroup>
                  <InputGroup.Text style={{ textAlign: "left", fontFamily: "Kanit", fontSize: 11, height: 60, borderColor: "black", backgroundColor: "white" }}>หมายเหตุ</InputGroup.Text>
                  <Form.Control
                    style={{ fontFamily: "Kanit", fontSize: 12, backgroundColor: "white", borderColor: "black" }}
                    disabled={true}
                    as="textarea"
                    aria-label="debit-note-remark"
                    value={String(allQT.debit_remark || "")}
                  />
                </InputGroup>

                {renderSalesDocumentPrintSignatureSection({
                  status: allQT.debit_status,
                  customerRoleLabel: "ผู้รับใบเพิ่มหนี้",
                  companyRoleLabel: "ผู้อนุมัติ",
                  signerName: allQT.debit_person || allQT.tax_person || allQT.qt_person,
                  dateValue: allQT.debit_date,
                })}
                <div style={{ display: "none" }} aria-hidden="true">
                <div className="row mt-4 document-print-signatures">
                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row"><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ลงนาม</div></div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>.......................................................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>ผู้รับใบเพิ่มหนี้</div>
                      </div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>........../............/.....................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>วันที่</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-1"></div>
                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row"><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ลงนาม</div></div>
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
            </div>
          </Modal_blrc.Body>
          <Modal_blrc.Footer>
            <button
              className="btn btn-primary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={reactToPrintFn}
            >
              Print
            </button>
            <button
              className="btn btn-secondary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={() => setShowdv(false)}
            >
              ปิด
            </button>
          </Modal_blrc.Footer>
        </Modal_blrc>
      )
    }

    function DebitNoteEditor() {
      const defaultOriginalAmount = String(allQT.sumtotal || allQT.totalall || "")
      const [remarkQ, setremarkQ] = useState(String(allQT.debit_remark || ""))
      const [referenceNo, setReferenceNo] = useState(String(allQT.debit_reference_no || allQT.tax_orderfull || ""))
      const [reason, setReason] = useState(String(allQT.debit_reason || ""))
      const [originalAmountInput, setOriginalAmountInput] = useState(
        allQT.debit_original_amount === null || allQT.debit_original_amount === undefined || allQT.debit_original_amount === ""
          ? defaultOriginalAmount
          : String(allQT.debit_original_amount)
      )
      const [correctAmountInput, setCorrectAmountInput] = useState(
        allQT.debit_correct_amount === null || allQT.debit_correct_amount === undefined || allQT.debit_correct_amount === ""
          ? defaultOriginalAmount
          : String(allQT.debit_correct_amount)
      )

      useEffect(() => {
        const fallbackAmount = String(allQT.sumtotal || allQT.totalall || "")
        setremarkQ(String(allQT.debit_remark || ""))
        setReferenceNo(String(allQT.debit_reference_no || allQT.tax_orderfull || ""))
        setReason(String(allQT.debit_reason || ""))
        setOriginalAmountInput(
          allQT.debit_original_amount === null || allQT.debit_original_amount === undefined || allQT.debit_original_amount === ""
            ? fallbackAmount
            : String(allQT.debit_original_amount)
        )
        setCorrectAmountInput(
          allQT.debit_correct_amount === null || allQT.debit_correct_amount === undefined || allQT.debit_correct_amount === ""
            ? fallbackAmount
            : String(allQT.debit_correct_amount)
        )
      }, [allQT.debit_remark, allQT.debit_reference_no, allQT.debit_reason, allQT.debit_original_amount, allQT.debit_correct_amount, allQT.tax_orderfull, allQT.sumtotal, allQT.totalall])

      let dateS = getSafeDocumentDate(allQT.debit_date)
      let dateE = getSafeDocumentDate(allQT.debit_enddate)
      const [startDate, setStartDate] = useState(dateS)
      const [startDate1, setStartDate1] = useState(dateE)

      useEffect(() => {
        setStartDate(getSafeDocumentDate(allQT.debit_date))
        setStartDate1(getSafeDocumentDate(allQT.debit_enddate))
      }, [allQT.debit_date, allQT.debit_enddate, ids])

      let date1 = new Date(startDate)
      let date2 = new Date(startDate1)

      let utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate())
      let utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate())
      let timeDiff = Math.abs(utc2 - utc1)
      let daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

      const draftAmounts = getDebitNoteAmounts({
        debit_original_amount: originalAmountInput,
        debit_correct_amount: correctAmountInput,
        debit_vat_rate: DEBIT_NOTE_VAT_RATE,
      })

      const canSave = referenceNo.trim() !== "" && reason.trim() !== "" && draftAmounts.differenceAmount > 0

      const sanitizeMoneyInput = (value: string) => value.replace(/[^0-9.]/g, "")

      const saveDebitNote = async (nextStatus?: string, closeAfterSave: boolean = false) => {
        if (!canSave) return

        let currentIds = ids
        if (!currentIds || currentIds === 0) {
          const newId = await createNewDocMain("debit")
          if (!newId) return
          currentIds = newId
        }

        const existingNumber = allQT.debit_number === null || allQT.debit_number === undefined || allQT.debit_number === ""
          ? null
          : Number(allQT.debit_number)
        const debit_orderNo = String(allQT.debit_orderNo || String(year) + String(month) + String(day))
        const debit_number = existingNumber ?? maxRecN5
        const debit_orderfull = buildDocumentOrderFull("debit", debit_orderNo, debit_number)

        try {
          await axios.put(`/api/${apiquatation}/${currentIds}`, {
            debit_status: nextStatus || allQT.debit_status || "รออนุมัติ",
            debit_person: allQT.debit_person || allQT.tax_person || allQT.qt_person || "",
            debit_remark: remarkQ,
            debit_date: new Date(startDate),
            debit_enddate: new Date(startDate1),
            debit_credit: Number(daysDiff),
            debit_orderNo,
            debit_number,
            debit_orderfull,
            debit_reference_no: referenceNo.trim(),
            debit_reason: reason.trim(),
            debit_original_amount: draftAmounts.originalAmount,
            debit_correct_amount: draftAmounts.correctAmount,
            debit_difference_amount: draftAmounts.differenceAmount,
            debit_vat_rate: DEBIT_NOTE_VAT_RATE,
            debit_vat_amount: draftAmounts.vatAmount,
            debit_grand_total: draftAmounts.grandTotal,
          })

          setids(Number(currentIds))
          localStorage.setItem("iddoc", String(currentIds))
          await Promise.all([
            fetchQT(),
            fetchQT_ID(Number(currentIds)),
          ])

          if (closeAfterSave) {
            setShowde(false)
          }
        } catch (error) {
          console.error(error)
        }
      }

      const updateDebitStatus = async (nextStatus: string) => {
        await saveDebitNote(nextStatus)
      }

      return (
        <Modal_blrc
          show={showde}
          onHide={() => setShowde(false)}
          size="xl"
          scrollable={true}
          className="document-modal"
          dialogClassName="document-modal-dialog"
          backdropClassName="document-modal-backdrop"
          animation={false}
          enforceFocus={false}
          aria-labelledby="debit-note-editor-title"
        >
          <Modal_blrc.Header closeButton style={{ borderBottom: "1px solid #e5e7eb", padding: "16px 24px", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" }}>
            <Modal_blrc.Title id="debit-note-editor-title" style={{ width: "100%" }}>
              {renderDocumentModalTitle({
                title: "ใบเพิ่มหนี้",
                docDisplay: debitNumberDisplay,
                status: allQT.debit_status,
                icon: <Landmark size={18} color="white" />,
                iconBackground: "linear-gradient(135deg, #0f766e, #14b8a6)",
              })}
            </Modal_blrc.Title>
          </Modal_blrc.Header>

          {renderDocumentWorkflowStepper("DN")}

          <Modal_blrc.Body style={{ backgroundColor: "#f8fafc", padding: "20px 24px" }}>
            {renderDocumentInfoGrid({
              docType: "debit",
              docDisplay: debitNumberDisplay,
              startDate,
              setStartDate,
              startDate1,
              setStartDate1,
              creditDays: daysDiff,
              personDisplay: allQT.debit_person || allQT.tax_person || allQT.qt_person,
              detailIcon: <Landmark size={14} color="#2A6AAA" />,
            })}

            <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 20, overflow: "hidden" }}>
              <div className="d-flex align-items-center" style={{ gap: 8, padding: "14px 20px", borderBottom: "1px solid #f3f4f6", background: "#fafbfc" }}>
                <Landmark size={16} color="#0f766e" />
                <span style={{ fontFamily: "kanit_B", fontSize: 14, color: "#1f2937" }}>รายละเอียดใบเพิ่มหนี้</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 18, padding: "18px 20px" }}>
                <div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151", marginBottom: 6 }}>อ้างอิงใบกำกับภาษีเดิม</div>
                    <input
                      className="form-control"
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                      placeholder="เช่น TAX2026041201"
                      style={{ fontFamily: "kanit", fontSize: 13, borderRadius: 10, height: 42 }}
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151", marginBottom: 6 }}>สาเหตุที่เพิ่มหนี้</div>
                    <textarea
                      className="form-control"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="เช่น เนื่องจากราคาจำหน่ายต่ำกว่าความเป็นจริง หรือ ส่งสินค้าเกิน"
                      rows={4}
                      style={{ fontFamily: "kanit", fontSize: 13, borderRadius: 10, resize: "vertical" }}
                    />
                  </div>

                  <div>
                    <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151", marginBottom: 6 }}>หมายเหตุเพิ่มเติม</div>
                    <textarea
                      className="form-control"
                      value={remarkQ}
                      onChange={(e) => setremarkQ(e.target.value)}
                      placeholder="ข้อความเพิ่มเติมสำหรับแสดงในเอกสาร"
                      rows={3}
                      style={{ fontFamily: "kanit", fontSize: 13, borderRadius: 10, resize: "vertical" }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151", marginBottom: 6 }}>มูลค่าเดิม</div>
                      <div className="input-group">
                        <input
                          className="form-control"
                          value={originalAmountInput}
                          onChange={(e) => setOriginalAmountInput(sanitizeMoneyInput(e.target.value))}
                          placeholder="0.00"
                          style={{ fontFamily: "kanit", fontSize: 13, borderRadius: "10px 0 0 10px", height: 42 }}
                        />
                        <span className="input-group-text" style={{ fontFamily: "kanit", fontSize: 12, borderRadius: "0 10px 10px 0" }}>บาท</span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151", marginBottom: 6 }}>มูลค่าที่ถูกต้อง</div>
                      <div className="input-group">
                        <input
                          className="form-control"
                          value={correctAmountInput}
                          onChange={(e) => setCorrectAmountInput(sanitizeMoneyInput(e.target.value))}
                          placeholder="0.00"
                          style={{ fontFamily: "kanit", fontSize: 13, borderRadius: "10px 0 0 10px", height: 42 }}
                        />
                        <span className="input-group-text" style={{ fontFamily: "kanit", fontSize: 12, borderRadius: "0 10px 10px 0" }}>บาท</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ border: "1px solid #E5EEF8", background: "#F3F8FC", borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ fontFamily: "kanit", fontSize: 11, color: "#1E5088" }}>ส่วนต่างที่ต้องเพิ่ม</div>
                      <div style={{ fontFamily: "Kanit_B", fontSize: 22, color: "#173F6B", lineHeight: 1.2 }}>{formatDocumentCurrency(draftAmounts.differenceAmount)}</div>
                    </div>
                    <div style={{ border: "1px solid #CCDFF1", background: "#F3F8FC", borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ fontFamily: "kanit", fontSize: 11, color: "#1E5088" }}>VAT {DEBIT_NOTE_VAT_RATE}% จากส่วนต่าง</div>
                      <div style={{ fontFamily: "Kanit_B", fontSize: 20, color: "#173F6B", lineHeight: 1.2 }}>{formatDocumentCurrency(draftAmounts.vatAmount)}</div>
                    </div>
                    <div style={{ border: "1px solid #fde68a", background: "#fffbeb", borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ fontFamily: "kanit", fontSize: 11, color: "#b45309" }}>ยอดรวมที่ลูกค้าต้องชำระเพิ่ม</div>
                      <div style={{ fontFamily: "Kanit_B", fontSize: 24, color: "#92400e", lineHeight: 1.2 }}>{formatDocumentCurrency(draftAmounts.grandTotal)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: "0 20px 20px" }}>
                <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
                  {renderDocumentAttachmentSection("debit")}
                </div>
              </div>

              {!canSave && (
                <div style={{ margin: "0 20px 20px", border: "1px solid #fed7aa", backgroundColor: "#fff7ed", color: "#9a3412", borderRadius: 12, padding: "12px 14px", fontFamily: "kanit", fontSize: 12, lineHeight: 1.6 }}>
                  ต้องกรอกเลขที่ใบกำกับภาษีเดิม, สาเหตุที่เพิ่มหนี้ และให้มูลค่าที่ถูกต้องมากกว่ามูลค่าเดิม เพื่อออกใบเพิ่มหนี้ได้
                </div>
              )}
            </div>

            {renderDocumentSignatureSection()}
          </Modal_blrc.Body>

          <Modal_blrc.Footer style={{ borderTop: "1px solid #e5e7eb", padding: "12px 24px", background: "#fafbfc", justifyContent: "space-between" }}>
            {renderDocumentFooterActions({
              taxControl: <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280" }}>VAT {DEBIT_NOTE_VAT_RATE}% จะคำนวณจากส่วนต่างอัตโนมัติ</div>,
              status: allQT.debit_status,
              onChangeStatus: updateDebitStatus,
              createControl: renderDocumentCreateDropdown("debit"),
              onSave: async () => {
                await saveDebitNote(undefined, true)
              },
              onClose: () => setShowde(false),
              saveDisabled: !canSave,
            })}
          </Modal_blrc.Footer>
        </Modal_blrc>
      )
    }

    const rows = filterBySearch(
      filterByStatus(
        qt.filter((d: any) => d.tax_status === "อนุมัติ" || d.debit_status === "อนุมัติ" || d.debit_status === "รออนุมัติ" || d.debit_status === "ยกเลิก"),
        "debit"
      ),
      "debit"
    ).sort((a: any, b: any) => a.createDate.localeCompare(b.createDate))

    return (
      <>
        <DebitNoteEditor />
        <DebitNotePreview />

        <div className='div1 p-2 mt-2' style={{ overflow: 'auto' }}>
          <div className='d-flex align-items-center justify-content-between mb-1 mt-1' style={{ gap: 12 }}>
            <div style={{ fontFamily: "kanit_B", fontSize: 18, color: "#1f2937" }}>ใบเพิ่มหนี้</div>
            <button
              type="button"
              onClick={() => openCreateDocumentDraft("debit")}
              style={{
                padding: "6px 16px", borderRadius: 8, border: "1.5px solid #2A6AAA",
                backgroundColor: "#F3F8FC", color: "#2A6AAA", fontSize: 13,
                fontFamily: "kanit_B", cursor: "pointer", display: "inline-flex",
                alignItems: "center", gap: 6, whiteSpace: "nowrap",
              }}
            >
              <Plus size={14} /> สร้างเอกสาร
            </button>
          </div>

          <table className="table table-hover" style={{ borderCollapse: "separate", borderSpacing: "0" }}>
            <thead>
              <tr>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>วันที่สร้าง</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>เลขที่เอกสาร</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>ชื่อลูกค้า/ชื่อโปรเจค</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>ส่วนต่าง</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>VAT 7%</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>ยอดชำระเพิ่ม</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>สถานะ</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", width: 168, textAlign: "center" }}></td>
              </tr>
            </thead>
            <tbody>
              {rows.map((a: any) => {
                const rowAmounts = getDebitNoteAmounts(a)
                const hasDebitDoc = !!a.debit_status
                return (
                  <tr key={a.id} onClick={() => setSelectedDocRow(a)} style={{ cursor: "pointer", backgroundColor: selectedDocRow?.id === a.id ? "#F3F8FC" : undefined }}>
                    <td style={{ fontFamily: "kanit", fontSize: 10, height: 40 }}>
                      {a.tax_date === null ? <></> : <div style={{ fontFamily: "kanit", fontSize: 10, height: 12 }}>ใบกำกับภาษี : {formatDocumentDate(a.tax_date)}</div>}
                      {a.debit_date === null ? <></> : <div style={{ fontFamily: "kanit", fontSize: 13 }}>{formatDocumentDate(a.debit_date)}</div>}
                    </td>
                    <td style={{ fontFamily: "kanit", fontSize: 10, height: 40 }}>
                      <div style={{ fontFamily: "kanit", fontSize: 10, minHeight: 12 }}>อ้างอิง : {a.debit_reference_no || a.tax_orderfull || "-"}</div>
                      {a.debit_date === null ? <></> : <div style={{ fontFamily: "kanit", fontSize: 13 }}>{a.debit_orderfull || `DN${a.debit_orderNo || ""}${a.debit_number || ""}`}</div>}
                    </td>
                    <td style={{ fontFamily: "kanit", fontSize: 13, height: 40 }}>{a.name_costomer}</td>
                    <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>{formatDocumentCurrency(rowAmounts.differenceAmount)}</td>
                    <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>{formatDocumentCurrency(rowAmounts.vatAmount)}</td>
                    <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>{formatDocumentCurrency(rowAmounts.grandTotal)}</td>
                    <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>
                      <span style={{
                        fontFamily: "kanit", fontSize: 11, padding: "3px 12px", borderRadius: 20,
                        backgroundColor: a.debit_status === "อนุมัติ" ? "#D3F0E2" : a.debit_status === "รออนุมัติ" ? "#fef3c7" : a.debit_status === "ยกเลิก" ? "#fee2e2" : "#e0e7ff",
                        color: a.debit_status === "อนุมัติ" ? "#0C5238" : a.debit_status === "รออนุมัติ" ? "#92400e" : a.debit_status === "ยกเลิก" ? "#991b1b" : "#3730a3",
                        fontWeight: 600,
                      }}>{a.debit_status === null ? "สร้างใบเพิ่มหนี้" : a.debit_status}</span>
                    </td>
                    <td style={{ fontFamily: "kanit", fontSize: 13, textAlign: "center", height: 50 }} className='d-flex'>
                      <button
                        onClick={() => { maxV5(), setids(a.id), setidcus(a.id_costomer), localStorage.setItem("iddoc", a.id), setShowde(true) }}
                        style={{ fontSize: 11, height: 28, marginLeft: 5, padding: "0 12px", borderRadius: 8, border: a.debit_status === null ? "1px solid #2A6AAA" : "1px solid #d97706", backgroundColor: "white", color: a.debit_status === null ? "#2A6AAA" : "#d97706", fontFamily: "kanit", cursor: "pointer", transition: "all 0.2s ease" }}
                        onMouseEnter={(e) => { const c = a.debit_status === null ? "#2A6AAA" : "#f59e0b"; e.currentTarget.style.backgroundColor = c; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 2px 8px ${c}4d` }}
                        onMouseLeave={(e) => { const c = a.debit_status === null ? "#2A6AAA" : "#d97706"; e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = c; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}
                      >
                        {a.debit_status === null ? "สร้าง" : "แก้ไข"}
                      </button>

                      {hasDebitDoc && (
                        <button
                          onClick={() => { setids(a.id), setidcus(a.id_costomer), setShowdv(true) }}
                          style={{ fontSize: 11, height: 28, marginLeft: 5, padding: "0 12px", borderRadius: 8, border: "1px solid #2A6AAA", backgroundColor: "white", color: "#2A6AAA", fontFamily: "kanit", cursor: "pointer", transition: "all 0.2s ease" }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#2A6AAA"; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(42, 106, 170,0.3)" }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = "#2A6AAA"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}
                        >
                          ข้อมูล
                        </button>
                      )}
                      {renderRowDocumentAttachmentButton("debit", Number(a.id))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  //*****************   ใบลดหนี้  ***************************/
  const CreditNote = () => {
    const creditNumberDisplay = allQT.credit_number === null || allQT.credit_number === undefined || allQT.credit_number === ""
      ? `CN${year}${month}${day}${maxRecN6}`
      : String(allQT.credit_orderfull || buildDocumentOrderFull("credit", String(allQT.credit_orderNo || ""), Number(allQT.credit_number || 0)))

    function CreditNotePreview() {
      const creditAmounts = getCreditNoteAmounts(allQT)
      const previewItems = creditAmounts.items.filter((item) => item.name.trim() !== "" || Number(item.amount || 0) > 0)
      const creditReferenceNoDisplay = allQT.credit_reference_no || allQT.debit_reference_no || allQT.tax_orderfull || "-"
      const creditReferenceBookDisplay = String(allQT.credit_reference_book_no || "").trim() || "-"
      const contentRef = useRef<HTMLDivElement>(null)
      const reactToPrintFn = useReactToPrint({
        contentRef,
        documentTitle: allQT.credit_orderfull || creditNumberDisplay,
        pageStyle: PROFESSIONAL_DOCUMENT_PRINT_PAGE_STYLE,
      })

      return (
        <Modal_blrc
          show={showcv}
          onHide={() => setShowcv(false)}
          size="lg"
          scrollable={true}
          aria-labelledby="credit-note-preview-title"
        >
          <Modal_blrc.Header closeButton>
            <Modal_blrc.Title id="credit-note-preview-title">
              <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>ใบลดหนี้</div>
            </Modal_blrc.Title>
          </Modal_blrc.Header>
          <Modal_blrc.Body style={{ backgroundColor: "grey" }}>
            <div className="document-print-sheet" style={PROFESSIONAL_DOCUMENT_PRINT_SHEET_STYLE} ref={contentRef}>
              {renderSalesPrintHeader({
                title: "ใบลดหนี้",
                englishTitle: "CREDIT NOTE",
                documentNumber: creditNumberDisplay,
                dateValue: allQT.credit_date,
                endDateValue: allQT.credit_enddate,
                creditValue: allQT.credit_credit,
                personName: allQT.credit_person || allQT.debit_person || allQT.tax_person || allQT.qt_person,
              })}
              <div style={{ display: "none" }} aria-hidden="true">
              <div className="row" style={{ height: 24 }}></div>
              <div className="row" style={{ marginLeft: 20, marginRight: 20 }}>
                <div className="col">
                  <div className="row mt-4" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ขาย</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{storeS}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{addressS}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี : {taxS}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {telS}</div>

                  <div className="row mt-3" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ซื้อ</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{all.names || allQT.name_costomer || "-"}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{all.address || "-"}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี : {all.numbertax || "-"}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {all.tel || "-"}</div>
                </div>

                <div className="col">
                  <div className="row" style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 20, justifySelf: "center" }}>
                    ใบลดหนี้ (Credit Note)
                  </div>
                  <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "75%", height: 1, backgroundColor: "black" }}></div>

                  <div className="row">
                    <div className="col-5">
                      <div style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เลขที่ :</div>
                      <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ :</div>
                      <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เครดิต :</div>
                      <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>ครบกำหนด :</div>
                      <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>ผู้ออกเอกสาร :</div>
                    </div>

                    <div className="col">
                      <div style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{creditNumberDisplay}</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{formatDocumentDate(allQT.credit_date)}</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{allQT.credit_credit || 0} วัน</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{formatDocumentDate(allQT.credit_enddate)}</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{allQT.credit_person || allQT.debit_person || allQT.tax_person || allQT.qt_person || "-"}</div>
                    </div>
                  </div>
                </div>
              </div>
              </div>

              <div style={{ margin: "20px" }}>
                <div style={{ border: "1px solid #d1d5db", borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
                  <div style={{ fontFamily: "Kanit_B", fontSize: 12, color: "#b45309", marginBottom: 10 }}>รายละเอียดการอ้างอิง</div>
                  <div style={{ fontFamily: "kanit", fontSize: 12, marginBottom: 6 }}>อ้างอิงใบกำกับภาษีเดิมเลขที่ : {creditReferenceNoDisplay}</div>
                  <div style={{ fontFamily: "kanit", fontSize: 12, marginBottom: 6 }}>หมายเลขลำดับของเล่ม : {creditReferenceBookDisplay}</div>
                  <div style={{ fontFamily: "kanit", fontSize: 12, lineHeight: 1.6 }}>สาเหตุ : {allQT.credit_reason || "-"}</div>
                </div>

                <table className="document-print-items" style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #d1d5db", backgroundColor: "#f8fafc", fontFamily: "kanit_B", fontSize: 12 }}>รายการที่ขอลดหนี้</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", borderBottom: "1px solid #d1d5db", backgroundColor: "#f8fafc", fontFamily: "kanit_B", fontSize: 12, width: 120 }}>จำนวน</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid #d1d5db", backgroundColor: "#f8fafc", fontFamily: "kanit_B", fontSize: 12, width: 180 }}>ยอดที่ลดลง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewItems.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: "12px", fontFamily: "kanit", fontSize: 12, textAlign: "center", color: "#9ca3af", borderBottom: "1px solid #e5e7eb" }}>ยังไม่มีรายการลดหนี้</td>
                      </tr>
                    ) : previewItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontFamily: "kanit", fontSize: 12 }}>{item.name || "-"}</td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontFamily: "kanit", fontSize: 12, textAlign: "center" }}>{formatDocumentQuantity(item.qty)}</td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontFamily: "kanit", fontSize: 12, textAlign: "right" }}>{formatDocumentCurrency(item.amount)} บาท</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <table className="document-print-items" style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #d1d5db", backgroundColor: "#f8fafc", fontFamily: "kanit_B", fontSize: 12 }}>รายการ</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid #d1d5db", backgroundColor: "#f8fafc", fontFamily: "kanit_B", fontSize: 12 }}>จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontFamily: "kanit", fontSize: 12 }}>มูลค่าตามใบกำกับภาษีเดิม</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontFamily: "kanit", fontSize: 12, textAlign: "right" }}>{formatDocumentCurrency(creditAmounts.originalAmount)} บาท</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontFamily: "kanit", fontSize: 12 }}>มูลค่าที่ถูกต้อง</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontFamily: "kanit", fontSize: 12, textAlign: "right" }}>{formatDocumentCurrency(creditAmounts.correctAmount)} บาท</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontFamily: "kanit", fontSize: 12 }}>ผลต่างของมูลค่าทั้งสอง</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontFamily: "Kanit_B", fontSize: 12, textAlign: "right", color: "#b45309" }}>{formatDocumentCurrency(creditAmounts.differenceAmount)} บาท</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontFamily: "kanit", fontSize: 12 }}>ภาษีมูลค่าเพิ่มที่ใช้คืนสำหรับส่วนต่าง {creditAmounts.vatRate}%</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontFamily: "kanit", fontSize: 12, textAlign: "right" }}>{formatDocumentCurrency(creditAmounts.vatAmount)} บาท</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "12px", fontFamily: "Kanit_B", fontSize: 12, backgroundColor: "#fff7ed" }}>ยอดรวมสุทธิที่ต้องหักออกจากยอดค้างชำระเดิม</td>
                      <td style={{ padding: "12px", fontFamily: "Kanit_B", fontSize: 13, textAlign: "right", backgroundColor: "#fff7ed", color: "#9a3412" }}>{formatDocumentCurrency(creditAmounts.netTotal)} บาท</td>
                    </tr>
                  </tbody>
                </table>

                <InputGroup>
                  <InputGroup.Text style={{ textAlign: "left", fontFamily: "Kanit", fontSize: 11, height: 60, borderColor: "black", backgroundColor: "white" }}>หมายเหตุ</InputGroup.Text>
                  <Form.Control
                    style={{ fontFamily: "Kanit", fontSize: 12, backgroundColor: "white", borderColor: "black" }}
                    disabled={true}
                    as="textarea"
                    aria-label="credit-note-remark"
                    value={String(allQT.credit_remark || "")}
                  />
                </InputGroup>

                {renderSalesDocumentPrintSignatureSection({
                  status: allQT.credit_status,
                  customerRoleLabel: "ผู้รับใบลดหนี้",
                  companyRoleLabel: "ผู้อนุมัติ",
                  signerName: allQT.credit_person || allQT.debit_person || allQT.tax_person || allQT.qt_person,
                  dateValue: allQT.credit_date,
                })}
                <div style={{ display: "none" }} aria-hidden="true">
                <div className="row mt-4 document-print-signatures">
                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row"><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ลงนาม</div></div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>.......................................................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>ผู้รับใบลดหนี้</div>
                      </div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>........../............/.....................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>วันที่</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-1"></div>
                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row"><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ลงนาม</div></div>
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
            </div>
          </Modal_blrc.Body>
          <Modal_blrc.Footer>
            <button
              className="btn btn-primary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={reactToPrintFn}
            >
              Print
            </button>
            <button
              className="btn btn-secondary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={() => setShowcv(false)}
            >
              ปิด
            </button>
          </Modal_blrc.Footer>
        </Modal_blrc>
      )
    }

    function CreditNoteEditor() {
      const defaultOriginalAmount = String(allQT.sumtotal || allQT.totalall || "")
      const [remarkQ, setremarkQ] = useState(String(allQT.credit_remark || ""))
      const [referenceNo, setReferenceNo] = useState(String(allQT.credit_reference_no || allQT.debit_reference_no || allQT.tax_orderfull || ""))
      const [referenceBookNo, setReferenceBookNo] = useState(String(allQT.credit_reference_book_no || ""))
      const [creditItems, setCreditItems] = useState<CreditNoteItemInput[]>(normalizeCreditNoteItems(allQT))
      const [reason, setReason] = useState(String(allQT.credit_reason || ""))
      const [originalAmountInput, setOriginalAmountInput] = useState(
        allQT.credit_original_amount === null || allQT.credit_original_amount === undefined || allQT.credit_original_amount === ""
          ? defaultOriginalAmount
          : String(allQT.credit_original_amount)
      )

      const invoiceProductOptions = useMemo(() => {
        const detailRows = getDocumentDetailRows()
        return detailRows
          .filter((detail: any) => String(detail?.name_product || "").trim() !== "")
          .map((detail: any) => ({
            detailId: String(detail?.id || ""),
            code: String(detail?.code_product || ""),
            name: String(detail?.name_product || ""),
            qty: Number(detail?.qty || 0),
            total: Number(detail?.total || 0),
          }))
      }, [qt_detail])

      useEffect(() => {
        const fallbackAmount = String(allQT.sumtotal || allQT.totalall || "")
        setremarkQ(String(allQT.credit_remark || ""))
        setReferenceNo(String(allQT.credit_reference_no || allQT.debit_reference_no || allQT.tax_orderfull || ""))
        setReferenceBookNo(String(allQT.credit_reference_book_no || ""))
        setCreditItems(normalizeCreditNoteItems(allQT))
        setReason(String(allQT.credit_reason || ""))
        setOriginalAmountInput(
          allQT.credit_original_amount === null || allQT.credit_original_amount === undefined || allQT.credit_original_amount === ""
            ? fallbackAmount
            : String(allQT.credit_original_amount)
        )
      }, [allQT.credit_remark, allQT.credit_reference_no, allQT.credit_reference_book_no, allQT.debit_reference_no, allQT.credit_item_name, allQT.credit_item_qty, allQT.credit_items_json, allQT.credit_reason, allQT.credit_original_amount, allQT.credit_reduce_amount, allQT.credit_difference_amount, allQT.debit_difference_amount, allQT.tax_orderfull, allQT.sumtotal, allQT.totalall])

      let dateS = getSafeDocumentDate(allQT.credit_date)
      let dateE = getSafeDocumentDate(allQT.credit_enddate)
      const [startDate, setStartDate] = useState(dateS)
      const [startDate1, setStartDate1] = useState(dateE)

      useEffect(() => {
        setStartDate(getSafeDocumentDate(allQT.credit_date))
        setStartDate1(getSafeDocumentDate(allQT.credit_enddate))
      }, [allQT.credit_date, allQT.credit_enddate, ids])

      let date1 = new Date(startDate)
      let date2 = new Date(startDate1)

      let utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate())
      let utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate())
      let timeDiff = Math.abs(utc2 - utc1)
      let daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

      const sanitizeNumberInput = (value: string) => value.replace(/[^0-9.]/g, "")

      const updateCreditItem = (itemId: string, field: keyof Omit<CreditNoteItemInput, "id">, value: string) => {
        setCreditItems((prev) => prev.map((item) => item.id === itemId ? {
          ...item,
          [field]: field === "qty" || field === "amount" ? sanitizeNumberInput(value) : value,
        } : item))
      }

      const selectCreditInvoiceItem = (itemId: string, sourceDetailId: string) => {
        const selectedDetail = invoiceProductOptions.find((option) => option.detailId === sourceDetailId)
        if (!selectedDetail) return

        setCreditItems((prev) => prev.map((item) => item.id === itemId ? {
          ...item,
          sourceDetailId,
          name: selectedDetail.name,
          qty: selectedDetail.qty > 0 ? String(selectedDetail.qty) : item.qty,
          amount: selectedDetail.total > 0 ? String(roundDocumentCurrency(selectedDetail.total)) : item.amount,
        } : item))
      }

      const addCreditItemRow = () => {
        setCreditItems((prev) => [...prev, createCreditNoteItem()])
      }

      const removeCreditItemRow = (itemId: string) => {
        setCreditItems((prev) => {
          if (prev.length === 1) return [createCreditNoteItem()]
          return prev.filter((item) => item.id !== itemId)
        })
      }

      const filledCreditItems = creditItems.filter((item) => item.name.trim() !== "" || String(item.qty || "").trim() !== "" || String(item.amount || "").trim() !== "")
      const hasIncompleteFilledItem = filledCreditItems.some((item) => item.name.trim() === "" || Number(item.qty || 0) <= 0 || Number(item.amount || 0) <= 0)
      const validCreditItems = filledCreditItems.filter((item) => item.name.trim() !== "" && Number(item.qty || 0) > 0 && Number(item.amount || 0) > 0)

      const draftAmounts = getCreditNoteAmounts({
        credit_items_json: validCreditItems,
        credit_original_amount: originalAmountInput,
        credit_vat_rate: CREDIT_NOTE_VAT_RATE,
      })

      const canSave = referenceNo.trim() !== "" && reason.trim() !== "" && validCreditItems.length > 0 && !hasIncompleteFilledItem && draftAmounts.originalAmount > 0 && draftAmounts.differenceAmount > 0 && draftAmounts.differenceAmount <= draftAmounts.originalAmount

      const saveCreditNote = async (nextStatus?: string, closeAfterSave: boolean = false) => {
        if (!canSave) return

        let currentIds = ids
        if (!currentIds || currentIds === 0) {
          const newId = await createNewDocMain("credit")
          if (!newId) return
          currentIds = newId
        }

        const existingNumber = allQT.credit_number === null || allQT.credit_number === undefined || allQT.credit_number === ""
          ? null
          : Number(allQT.credit_number)
        const credit_orderNo = String(allQT.credit_orderNo || String(year) + String(month) + String(day))
        const credit_number = existingNumber ?? maxRecN6
        const credit_orderfull = buildDocumentOrderFull("credit", credit_orderNo, credit_number)
        const persistedItems = validCreditItems.map((item) => ({
          id: item.id,
          sourceDetailId: item.sourceDetailId || "",
          name: item.name.trim(),
          qty: Number(item.qty || 0),
          amount: roundDocumentCurrency(Number(item.amount || 0)),
        }))

        try {
          await axios.put(`/api/${apiquatation}/${currentIds}`, {
            credit_status: nextStatus || allQT.credit_status || "รออนุมัติ",
            credit_person: allQT.credit_person || allQT.debit_person || allQT.tax_person || allQT.qt_person || "",
            credit_remark: remarkQ,
            credit_date: new Date(startDate),
            credit_enddate: new Date(startDate1),
            credit_credit: Number(daysDiff),
            credit_orderNo,
            credit_number,
            credit_orderfull,
            credit_reference_no: referenceNo.trim(),
            credit_reference_book_no: referenceBookNo.trim(),
            credit_reason: reason.trim(),
            credit_item_name: persistedItems[0]?.name || "",
            credit_item_qty: Number(persistedItems[0]?.qty || 0),
            credit_items_json: persistedItems,
            credit_original_amount: draftAmounts.originalAmount,
            credit_correct_amount: draftAmounts.correctAmount,
            credit_difference_amount: draftAmounts.differenceAmount,
            credit_reduce_amount: draftAmounts.differenceAmount,
            credit_vat_rate: CREDIT_NOTE_VAT_RATE,
            credit_vat_amount: draftAmounts.vatAmount,
            credit_net_total: draftAmounts.netTotal,
          })

          setids(Number(currentIds))
          localStorage.setItem("iddoc", String(currentIds))
          await Promise.all([
            fetchQT(),
            fetchQT_ID(Number(currentIds)),
          ])

          if (closeAfterSave) {
            setShowce(false)
          }
        } catch (error) {
          console.error(error)
        }
      }

      const updateCreditStatus = async (nextStatus: string) => {
        await saveCreditNote(nextStatus)
      }

      return (
        <Modal_blrc
          show={showce}
          onHide={() => setShowce(false)}
          size="xl"
          scrollable={true}
          className="document-modal"
          dialogClassName="document-modal-dialog"
          backdropClassName="document-modal-backdrop"
          animation={false}
          enforceFocus={false}
          aria-labelledby="credit-note-editor-title"
        >
          <Modal_blrc.Header closeButton style={{ borderBottom: "1px solid #e5e7eb", padding: "16px 24px", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" }}>
            <Modal_blrc.Title id="credit-note-editor-title" style={{ width: "100%" }}>
              {renderDocumentModalTitle({
                title: "ใบลดหนี้",
                docDisplay: creditNumberDisplay,
                status: allQT.credit_status,
                icon: <Wallet size={18} color="white" />,
                iconBackground: "linear-gradient(135deg, #ea580c, #f59e0b)",
              })}
            </Modal_blrc.Title>
          </Modal_blrc.Header>

          {renderDocumentWorkflowStepper("CN")}

          <Modal_blrc.Body style={{ backgroundColor: "#f8fafc", padding: "20px 24px" }}>
            {renderDocumentInfoGrid({
              docType: "credit",
              docDisplay: creditNumberDisplay,
              startDate,
              setStartDate,
              startDate1,
              setStartDate1,
              creditDays: daysDiff,
              personDisplay: allQT.credit_person || allQT.debit_person || allQT.tax_person || allQT.qt_person,
              detailIcon: <Wallet size={14} color="#f59e0b" />,
            })}

            <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 20, overflow: "hidden" }}>
              <div className="d-flex align-items-center" style={{ gap: 8, padding: "14px 20px", borderBottom: "1px solid #f3f4f6", background: "#fafbfc" }}>
                <Wallet size={16} color="#f59e0b" />
                <span style={{ fontFamily: "kanit_B", fontSize: 14, color: "#1f2937" }}>รายละเอียดใบลดหนี้</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 18, padding: "18px 20px" }}>
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 220px", gap: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151", marginBottom: 6 }}>อ้างอิงใบกำกับภาษีเดิม</div>
                      <input
                        className="form-control"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        placeholder="เช่น TAX2026041201"
                        style={{ fontFamily: "kanit", fontSize: 13, borderRadius: 10, height: 42 }}
                      />
                    </div>

                    <div>
                      <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151", marginBottom: 6 }}>หมายเลขลำดับของเล่ม (ถ้ามี)</div>
                      <input
                        className="form-control"
                        value={referenceBookNo}
                        onChange={(e) => setReferenceBookNo(e.target.value)}
                        placeholder="เช่น เล่ม 1"
                        style={{ fontFamily: "kanit", fontSize: 13, borderRadius: 10, height: 42 }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div className="d-flex align-items-center justify-content-between" style={{ marginBottom: 6, gap: 12 }}>
                      <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151" }}>รายการที่ขอลดหนี้</div>
                      <button
                        type="button"
                        onClick={addCreditItemRow}
                        style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid #3E86C7", backgroundColor: "#F3F8FC", color: "#1E5088", fontFamily: "kanit", fontSize: 12, cursor: "pointer" }}
                      >
                        + เพิ่มรายการ
                      </button>
                    </div>

                    <div style={{ display: "grid", gap: 10 }}>
                      {creditItems.map((item, index) => (
                        <div key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, backgroundColor: "#fafbfc" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 120px 160px 44px", gap: 10, alignItems: "end" }}>
                            <div>
                              <div style={{ fontFamily: "kanit", fontSize: 11, color: "#6b7280", marginBottom: 4 }}>รายการที่ {index + 1}</div>
                              <Form.Select
                                value={item.sourceDetailId || invoiceProductOptions.find((option) => option.name === item.name)?.detailId || ""}
                                onChange={(e) => selectCreditInvoiceItem(item.id, e.target.value)}
                                style={{ fontFamily: "kanit", fontSize: 13, borderRadius: 10, height: 40 }}
                              >
                                <option value="">เลือกสินค้าที่แสดงในใบกำกับภาษี</option>
                                {invoiceProductOptions.map((option) => (
                                  <option key={option.detailId} value={option.detailId}>
                                    {option.code ? `${option.code} - ` : ""}{option.name} ({formatDocumentQuantity(option.qty)})
                                  </option>
                                ))}
                              </Form.Select>
                            </div>
                            <div>
                              <div style={{ fontFamily: "kanit", fontSize: 11, color: "#6b7280", marginBottom: 4 }}>จำนวน</div>
                              <input
                                className="form-control"
                                value={item.qty}
                                onChange={(e) => updateCreditItem(item.id, "qty", e.target.value)}
                                placeholder="1"
                                style={{ fontFamily: "kanit", fontSize: 13, borderRadius: 10, height: 40 }}
                              />
                            </div>
                            <div>
                              <div style={{ fontFamily: "kanit", fontSize: 11, color: "#6b7280", marginBottom: 4 }}>ยอดลดลง</div>
                              <div className="input-group">
                                <input
                                  className="form-control"
                                  value={item.amount}
                                  onChange={(e) => updateCreditItem(item.id, "amount", e.target.value)}
                                  placeholder="0.00"
                                  style={{ fontFamily: "kanit", fontSize: 13, borderRadius: "10px 0 0 10px", height: 40 }}
                                />
                                <span className="input-group-text" style={{ fontFamily: "kanit", fontSize: 12, borderRadius: "0 10px 10px 0" }}>บาท</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCreditItemRow(item.id)}
                              style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#dc2626", fontFamily: "kanit_B", cursor: "pointer" }}
                              title="ลบรายการ"
                            >
                              -
                            </button>
                          </div>
                        </div>
                      ))}
                      {invoiceProductOptions.length === 0 && (
                        <div style={{ border: "1px dashed #d1d5db", borderRadius: 12, padding: "12px 14px", backgroundColor: "#f9fafb", color: "#6b7280", fontFamily: "kanit", fontSize: 12 }}>
                          ยังไม่พบรายการสินค้าในใบกำกับภาษีของเอกสารนี้
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151", marginBottom: 6 }}>สาเหตุ</div>
                    <textarea
                      className="form-control"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="เช่น สินค้าชำรุดระหว่างขนส่ง / ส่งสินค้าไม่ตรงรุ่น"
                      rows={4}
                      style={{ fontFamily: "kanit", fontSize: 13, borderRadius: 10, resize: "vertical" }}
                    />
                  </div>

                  <div>
                    <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151", marginBottom: 6 }}>หมายเหตุเพิ่มเติม</div>
                    <textarea
                      className="form-control"
                      value={remarkQ}
                      onChange={(e) => setremarkQ(e.target.value)}
                      placeholder="ข้อความเพิ่มเติมสำหรับแสดงในเอกสาร"
                      rows={3}
                      style={{ fontFamily: "kanit", fontSize: 13, borderRadius: 10, resize: "vertical" }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151", marginBottom: 6 }}>มูลค่าตามใบกำกับภาษีเดิม</div>
                      <div className="input-group">
                        <input
                          className="form-control"
                          value={originalAmountInput}
                          onChange={(e) => setOriginalAmountInput(sanitizeNumberInput(e.target.value))}
                          placeholder="0.00"
                          style={{ fontFamily: "kanit", fontSize: 13, borderRadius: "10px 0 0 10px", height: 42 }}
                        />
                        <span className="input-group-text" style={{ fontFamily: "kanit", fontSize: 12, borderRadius: "0 10px 10px 0" }}>บาท</span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151", marginBottom: 6 }}>มูลค่าที่ถูกต้อง</div>
                      <div className="input-group">
                        <input
                          className="form-control"
                          value={formatDocumentCurrency(draftAmounts.correctAmount)}
                          disabled={true}
                          style={{ fontFamily: "kanit", fontSize: 13, borderRadius: "10px 0 0 10px", height: 42, backgroundColor: "#f8fafc" }}
                        />
                        <span className="input-group-text" style={{ fontFamily: "kanit", fontSize: 12, borderRadius: "0 10px 10px 0" }}>บาท</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ border: "1px solid #fed7aa", background: "#fff7ed", borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ fontFamily: "kanit", fontSize: 11, color: "#c2410c" }}>ผลต่างของมูลค่าทั้งสอง {validCreditItems.length > 0 ? `(${validCreditItems.length} รายการ)` : ""}</div>
                      <div style={{ fontFamily: "Kanit_B", fontSize: 22, color: "#9a3412", lineHeight: 1.2 }}>{formatDocumentCurrency(draftAmounts.differenceAmount)}</div>
                    </div>
                    <div style={{ border: "1px solid #CCDFF1", background: "#F3F8FC", borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ fontFamily: "kanit", fontSize: 11, color: "#1E5088" }}>VAT {CREDIT_NOTE_VAT_RATE}% ที่ใช้คืนสำหรับส่วนต่าง</div>
                      <div style={{ fontFamily: "Kanit_B", fontSize: 20, color: "#173F6B", lineHeight: 1.2 }}>{formatDocumentCurrency(draftAmounts.vatAmount)}</div>
                    </div>
                    <div style={{ border: "1px solid #fde68a", background: "#fffbeb", borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ fontFamily: "kanit", fontSize: 11, color: "#b45309" }}>ยอดรวมสุทธิที่ต้องหักออก</div>
                      <div style={{ fontFamily: "Kanit_B", fontSize: 24, color: "#92400e", lineHeight: 1.2 }}>{formatDocumentCurrency(draftAmounts.netTotal)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: "0 20px 20px" }}>
                <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
                  {renderDocumentAttachmentSection("credit")}
                </div>
              </div>

              {!canSave && (
                <div style={{ margin: "0 20px 20px", border: "1px solid #fed7aa", backgroundColor: "#fff7ed", color: "#9a3412", borderRadius: 12, padding: "12px 14px", fontFamily: "kanit", fontSize: 12, lineHeight: 1.6 }}>
                  ต้องกรอกเลขที่ใบกำกับภาษีเดิม, มูลค่าตามใบกำกับภาษีเดิม, สาเหตุ และอย่างน้อย 1 รายการลดหนี้ให้ครบทั้งชื่อรายการ จำนวน และยอดที่ลดลง โดยผลต่างต้องไม่เกินมูลค่าเดิม
                </div>
              )}
            </div>

            {renderDocumentSignatureSection()}
          </Modal_blrc.Body>

          <Modal_blrc.Footer style={{ borderTop: "1px solid #e5e7eb", padding: "12px 24px", background: "#fafbfc", justifyContent: "space-between" }}>
            {renderDocumentFooterActions({
              taxControl: <div style={{ fontFamily: "kanit", fontSize: 12, color: "#6b7280" }}>VAT {CREDIT_NOTE_VAT_RATE}% จะคำนวณจากผลต่างอัตโนมัติ</div>,
              status: allQT.credit_status,
              onChangeStatus: updateCreditStatus,
              onSave: async () => {
                await saveCreditNote(undefined, true)
              },
              onClose: () => setShowce(false),
              saveDisabled: !canSave,
            })}
          </Modal_blrc.Footer>
        </Modal_blrc>
      )
    }

    const rows = filterBySearch(
      filterByStatus(
        qt.filter((d: any) => d.tax_status === "อนุมัติ" || d.debit_status === "อนุมัติ" || d.credit_status === "อนุมัติ" || d.credit_status === "รออนุมัติ" || d.credit_status === "ยกเลิก"),
        "credit"
      ),
      "credit"
    ).sort((a: any, b: any) => a.createDate.localeCompare(b.createDate))

    return (
      <>
        <CreditNoteEditor />
        <CreditNotePreview />

        <div className='div1 p-2 mt-2' style={{ overflow: 'auto' }}>
          <div className='d-flex align-items-center justify-content-between mb-1 mt-1' style={{ gap: 12 }}>
            <div style={{ fontFamily: "kanit_B", fontSize: 18, color: "#1f2937" }}>ใบลดหนี้</div>
            <button
              type="button"
              onClick={() => openCreateDocumentDraft("credit")}
              style={{
                padding: "6px 16px", borderRadius: 8, border: "1.5px solid #2A6AAA",
                backgroundColor: "#F3F8FC", color: "#2A6AAA", fontSize: 13,
                fontFamily: "kanit_B", cursor: "pointer", display: "inline-flex",
                alignItems: "center", gap: 6, whiteSpace: "nowrap",
              }}
            >
              <Plus size={14} /> สร้างเอกสาร
            </button>
          </div>

          <table className="table table-hover" style={{ borderCollapse: "separate", borderSpacing: "0" }}>
            <thead>
              <tr>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>วันที่สร้าง</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>เลขที่เอกสาร</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>รายการลดหนี้</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>ยอดที่ลดลง</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>VAT 7%</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>ยอดหักออกสุทธิ</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>สถานะ</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", width: 168, textAlign: "center" }}></td>
              </tr>
            </thead>
            <tbody>
              {rows.map((a: any) => {
                const rowAmounts = getCreditNoteAmounts(a)
                const hasCreditDoc = !!a.credit_status
                const rowItems = rowAmounts.items.filter((item) => item.name.trim() !== "" || Number(item.amount || 0) > 0)
                return (
                  <tr key={a.id} onClick={() => setSelectedDocRow(a)} style={{ cursor: "pointer", backgroundColor: selectedDocRow?.id === a.id ? "#F3F8FC" : undefined }}>
                    <td style={{ fontFamily: "kanit", fontSize: 10, height: 40 }}>
                      {a.tax_date === null ? <></> : <div style={{ fontFamily: "kanit", fontSize: 10, height: 12 }}>ใบกำกับภาษี : {formatDocumentDate(a.tax_date)}</div>}
                      {a.debit_date === null ? <></> : <div style={{ fontFamily: "kanit", fontSize: 10, height: 12 }}>ใบเพิ่มหนี้ : {formatDocumentDate(a.debit_date)}</div>}
                      {a.credit_date === null ? <></> : <div style={{ fontFamily: "kanit", fontSize: 13 }}>{formatDocumentDate(a.credit_date)}</div>}
                    </td>
                    <td style={{ fontFamily: "kanit", fontSize: 10, height: 40 }}>
                      <div style={{ fontFamily: "kanit", fontSize: 10, minHeight: 12 }}>
                        อ้างอิง : {a.credit_reference_no || a.debit_reference_no || a.tax_orderfull || "-"}{a.credit_reference_book_no ? ` / เล่มที่ ${a.credit_reference_book_no}` : ""}
                      </div>
                      {a.tax_date === null ? <></> : <div style={{ fontFamily: "kanit", fontSize: 10, height: 12 }}>ใบกำกับภาษี : {a.tax_orderfull || `TAX${a.tax_orderNo || ""}${a.tax_number || ""}`}</div>}
                      {a.credit_date === null ? <></> : <div style={{ fontFamily: "kanit", fontSize: 13 }}>{a.credit_orderfull || `CN${a.credit_orderNo || ""}${a.credit_number || ""}`}</div>}
                    </td>
                    <td style={{ fontFamily: "kanit", fontSize: 13, height: 40 }}>
                      <div>{rowItems[0]?.name || a.credit_item_name || "-"}</div>
                      <div style={{ fontSize: 10, color: "#6b7280" }}>
                        {rowItems.length > 1
                          ? `${rowItems.length} รายการ`
                          : `จำนวน ${formatDocumentQuantity(rowItems[0]?.qty || a.credit_item_qty || 0)}`}
                      </div>
                    </td>
                    <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>{formatDocumentCurrency(rowAmounts.reduceAmount)}</td>
                    <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>{formatDocumentCurrency(rowAmounts.vatAmount)}</td>
                    <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>{formatDocumentCurrency(rowAmounts.netTotal)}</td>
                    <td style={{ fontFamily: "kanit", fontSize: 13, height: 40, textAlign: "center" }}>
                      <span style={{
                        fontFamily: "kanit", fontSize: 11, padding: "3px 12px", borderRadius: 20,
                        backgroundColor: a.credit_status === "อนุมัติ" ? "#D3F0E2" : a.credit_status === "รออนุมัติ" ? "#fef3c7" : a.credit_status === "ยกเลิก" ? "#fee2e2" : "#e0e7ff",
                        color: a.credit_status === "อนุมัติ" ? "#0C5238" : a.credit_status === "รออนุมัติ" ? "#92400e" : a.credit_status === "ยกเลิก" ? "#991b1b" : "#3730a3",
                        fontWeight: 600,
                      }}>{a.credit_status === null ? "สร้างใบลดหนี้" : a.credit_status}</span>
                    </td>
                    <td style={{ fontFamily: "kanit", fontSize: 13, textAlign: "center", height: 50 }} className='d-flex'>
                      <button
                        onClick={() => { maxV6(), setids(a.id), setidcus(a.id_costomer), localStorage.setItem("iddoc", a.id), setShowce(true) }}
                        style={{ fontSize: 11, height: 28, marginLeft: 5, padding: "0 12px", borderRadius: 8, border: a.credit_status === null ? "1px solid #2A6AAA" : "1px solid #d97706", backgroundColor: "white", color: a.credit_status === null ? "#2A6AAA" : "#d97706", fontFamily: "kanit", cursor: "pointer", transition: "all 0.2s ease" }}
                        onMouseEnter={(e) => { const c = a.credit_status === null ? "#2A6AAA" : "#f59e0b"; e.currentTarget.style.backgroundColor = c; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 2px 8px ${c}4d` }}
                        onMouseLeave={(e) => { const c = a.credit_status === null ? "#2A6AAA" : "#d97706"; e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = c; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}
                      >
                        {a.credit_status === null ? "สร้าง" : "แก้ไข"}
                      </button>

                      {hasCreditDoc && (
                        <button
                          onClick={() => { setids(a.id), setidcus(a.id_costomer), setShowcv(true) }}
                          style={{ fontSize: 11, height: 28, marginLeft: 5, padding: "0 12px", borderRadius: 8, border: "1px solid #2A6AAA", backgroundColor: "white", color: "#2A6AAA", fontFamily: "kanit", cursor: "pointer", transition: "all 0.2s ease" }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#2A6AAA"; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(42, 106, 170,0.3)" }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = "#2A6AAA"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}
                        >
                          ข้อมูล
                        </button>
                      )}
                      {renderRowDocumentAttachmentButton("credit", Number(a.id))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  //*****************   ใบสั่งสินค้า  ***************************/
  const [orderVender, setorderVender] = useState("")

  const Order = () => {
    const [showCreateOrderModal, setShowCreateOrderModal] = useState(false)
    const [orderSuppliers, setOrderSuppliers] = useState<any[]>([])
    const [orderSuppliersLoading, setOrderSuppliersLoading] = useState(false)
    const [orderDraftPerson, setOrderDraftPerson] = useState("")
    const [selectedSupplierId, setSelectedSupplierId] = useState("")
    const [orderDraftItems, setOrderDraftItems] = useState<PurchaseOrderDraftItem[]>([createPurchaseOrderDraftItem()])
    const [orderDraftRemark, setOrderDraftRemark] = useState("")
    const [orderDraftError, setOrderDraftError] = useState("")
    const [orderDraftSaving, setOrderDraftSaving] = useState(false)

    const fetchOrderSuppliers = async () => {
      const companyS = localStorage.getItem("company_") || ""
      if (!companyS) {
        setOrderSuppliers([])
        return
      }

      setOrderSuppliersLoading(true)
      try {
        const res = await axios.get(`/api/supplier?company=${companyS}&fields=list`)
        setOrderSuppliers(Array.isArray(res.data) ? res.data : [])
      } catch (error) {
        console.error(error)
        setOrderSuppliers([])
      } finally {
        setOrderSuppliersLoading(false)
      }
    }

    useEffect(() => {
      void fetchOrderSuppliers()
      setOrderDraftPerson(localStorage.getItem("person_") || "")
    }, [])

    const resetCreateOrderForm = () => {
      setSelectedSupplierId("")
      setOrderDraftItems([createPurchaseOrderDraftItem()])
      setOrderDraftRemark("")
      setOrderDraftError("")
      setOrderDraftSaving(false)
    }

    const openCreateOrderModal = () => {
      resetCreateOrderForm()
      setShowCreateOrderModal(true)
    }

    const closeCreateOrderModal = () => {
      setShowCreateOrderModal(false)
      setOrderDraftError("")
    }

    const openPurchaseOrderEditor = (orderId: number) => {
      if (typeof window === "undefined") return
      window.location.assign(`/web/order?orderId=${encodeURIComponent(String(orderId))}`)
    }

    const findPurchaseOrderProductMatch = (rawValue: string): any | null => {
      const normalizedValue = rawValue.trim().toLowerCase()
      if (!normalizedValue) return null

      return ((Array.isArray(dataProduct) ? dataProduct : []) as any[]).find((product: any) => {
        const productName = String(product?.ProductName || "").trim().toLowerCase()
        const productCode = String(product?.code || "").trim().toLowerCase()
        return productName === normalizedValue || productCode === normalizedValue
      }) || null
    }

    const updateOrderDraftItem = (itemId: string, patch: Partial<PurchaseOrderDraftItem>) => {
      setOrderDraftItems((prev) => prev.map((item) => item.id === itemId ? { ...item, ...patch } : item))
    }

    const handleOrderDraftItemNameChange = (itemId: string, value: string) => {
      const matchedProduct: any = findPurchaseOrderProductMatch(value)
      updateOrderDraftItem(itemId, {
        itemName: value,
        itemcode: matchedProduct ? String(matchedProduct.code || "") : "",
        unit: matchedProduct ? String(matchedProduct.Unit || "") : "",
      })
    }

    const handleOrderDraftNumberChange = (itemId: string, field: "qty" | "newCost", value: string) => {
      const sanitizedValue = value.replace(/[^0-9.]/g, "")
      updateOrderDraftItem(itemId, { [field]: sanitizedValue } as Partial<PurchaseOrderDraftItem>)
    }

    const addBlankOrderDraftItem = () => {
      setOrderDraftItems((prev) => [...prev, createPurchaseOrderDraftItem()])
    }

    const removeOrderDraftItem = (itemId: string) => {
      setOrderDraftItems((prev) => {
        if (prev.length === 1) return [createPurchaseOrderDraftItem()]
        return prev.filter((item) => item.id !== itemId)
      })
    }

    const handleAddDraftProduct = async (product: any, qty: number) => {
      setOrderDraftItems((prev) => ([
        ...prev,
        createPurchaseOrderDraftItem({
          itemcode: String(product?.code || ""),
          itemName: String(product?.ProductName || ""),
          unit: String(product?.Unit || ""),
          qty: String(Math.max(1, Number(qty || 1))),
          newCost: String(Number(product?.newCost ?? product?.cost ?? 0) || 0),
        }),
      ]))
    }

    const selectedSupplier = orderSuppliers.find((supplier: any) => String(supplier?.id) === String(selectedSupplierId)) || null

    const normalizedOrderDraftItems = orderDraftItems
      .map((item) => {
        const itemName = String(item.itemName || "").trim()
        const itemcode = String(item.itemcode || "").trim()
        const unit = String(item.unit || "").trim()
        const qty = Math.max(1, Number(item.qty || 0) || 1)
        const newCost = Math.max(0, Number(item.newCost || 0) || 0)
        const isRowTouched = itemName !== "" || itemcode !== "" || unit !== "" || Number(item.qty || 1) !== 1 || Number(item.newCost || 0) > 0

        return {
          ...item,
          itemName,
          itemcode,
          unit,
          qty,
          newCost,
          totalSuggestedCost: Number((qty * newCost).toFixed(2)),
          isRowTouched,
        }
      })

    const orderDraftHasInvalidRow = normalizedOrderDraftItems.some((item) => item.isRowTouched && item.itemName === "")
    const validOrderDraftItems = normalizedOrderDraftItems.filter((item) => item.itemName !== "")
    const totalDraftQuantity = validOrderDraftItems.reduce((sum, item) => sum + item.qty, 0)
    const totalDraftAmount = validOrderDraftItems.reduce((sum, item) => sum + item.totalSuggestedCost, 0)

    const currentDate = new Date()
    const currentOrderNo = `${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, "0")}${String(currentDate.getDate()).padStart(2, "0")}`
    const todayOrderSequences = ordermain
      .filter((order: any) => String(order?.orderNo || "") === currentOrderNo)
      .map((order: any) => {
        if (!order?.orderfull) return 100
        const sequence = Number(String(order.orderfull).replace(currentOrderNo, ""))
        return Number.isFinite(sequence) ? sequence : 100
      })
    const nextOrderSequence = todayOrderSequences.length > 0 ? Math.max(...todayOrderSequences) + 1 : 100
    const nextOrderFullPreview = `${currentOrderNo}${nextOrderSequence}`

    const savePurchaseOrderDraft = async () => {
      if (!selectedSupplierId) {
        setOrderDraftError("กรุณาเลือกผู้ขายก่อนบันทึกใบรายการสั่งซื้อสินค้า")
        return
      }

      if (orderDraftHasInvalidRow) {
        setOrderDraftError("กรุณากรอกชื่อสินค้าให้ครบทุกแถวที่ต้องการใช้งาน")
        return
      }

      if (validOrderDraftItems.length === 0) {
        setOrderDraftError("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ")
        return
      }

      const companyS = localStorage.getItem("company_") || ""
      const person = orderDraftPerson || localStorage.getItem("person_") || ""
      if (!companyS) {
        setOrderDraftError("ไม่พบข้อมูลบริษัทสำหรับบันทึกใบรายการสั่งซื้อสินค้า")
        return
      }

      setOrderDraftSaving(true)
      setOrderDraftError("")

      try {
        const res = await axios.post('/api/order', {
          company: companyS,
          orderNo: currentOrderNo,
          orderfull: nextOrderFullPreview,
          supplierId: selectedSupplierId,
          supplierCode: selectedSupplier?.code || "",
          supplierName: selectedSupplier?.names || selectedSupplier?.supplierName || "",
          totalAmount: totalDraftAmount,
          person,
          remark: orderDraftRemark,
          items: validOrderDraftItems.map((item) => ({
            itemcode: item.itemcode,
            itemName: item.itemName,
            unit: item.unit,
            suggestedQty: item.qty,
            newCost: item.newCost,
            totalSuggestedCost: item.totalSuggestedCost,
          })),
        })

        await GetMainOrder()
        closeCreateOrderModal()
        resetCreateOrderForm()
        window.alert(`บันทึกใบรายการสั่งซื้อสินค้าเลขที่ ${res.data?.orderfull || nextOrderFullPreview} เรียบร้อยแล้ว`)
      } catch (error) {
        console.error(error)
        setOrderDraftError("บันทึกใบรายการสั่งซื้อสินค้าไม่สำเร็จ")
      } finally {
        setOrderDraftSaving(false)
      }
    }

    const GetDetailOrder = (order: any) => {
      setorderItem(order.items || [])
      setorderVender(order.supplierName || "")
      setSelectedOrderReport(order)
      setShowov(true)
    }

    //******** */ input Preview *********************
    function OrderTemplate() {
      const reportOrder = selectedOrderReport
      const reportItems = Array.isArray(reportOrder?.items) && reportOrder.items.length > 0
        ? reportOrder.items
        : Array.isArray(orderItem)
          ? orderItem
          : []
      const statusLabel = reportOrder?.status === 'Pending' ? 'รอดำเนินการ' : 'ได้รับสินค้าแล้ว'
      const statusBackground = reportOrder?.status === 'Pending' ? '#fef3c7' : '#D3F0E2'
      const statusColor = reportOrder?.status === 'Pending' ? '#92400e' : '#0C5238'
      const totalQuantity = reportItems.reduce((sum: number, item: any) => sum + Number(item?.qty || 0), 0)
      const totalAmount = reportItems.reduce((sum: number, item: any) => sum + Number(item?.total || 0), 0)
      const reportRemark = String(reportOrder?.remark || '').trim()
      const contentRef = useRef<HTMLDivElement>(null);
      const reactToPrintFn2 = useReactToPrint({
        contentRef,
        documentTitle: reportOrder?.orderfull ? `PO-${reportOrder.orderfull}` : "ใบสั่งสินค้า",
        pageStyle: PROFESSIONAL_DOCUMENT_PRINT_PAGE_STYLE,
      });

      return (
        <>
          <Modal_blrc
            show={showov}
            onHide={() => { setShowov(false); setSelectedOrderReport(null) }}
            size="xl"
            scrollable={true}
            className="document-modal"
            dialogClassName="document-modal-dialog"
            backdropClassName="document-modal-backdrop"
            animation={false}
            enforceFocus={false}
            aria-labelledby="purchase-order-report-title"
          >
            <Modal_blrc.Header closeButton style={{ borderBottom: "1px solid #e5e7eb", padding: "16px 24px", background: "linear-gradient(135deg, #f8fafc 0%, #F3F8FC 100%)" }}>
              <Modal_blrc.Title id="purchase-order-report-title" style={{ width: "100%" }}>
                <div className="d-flex align-items-center" style={{ gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 14, background: "linear-gradient(135deg, #1E5088, #3E86C7)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(62, 134, 199,0.24)" }}>
                    <FileSpreadsheet size={18} color="white" />
                  </div>
                  <div>
                    <div style={{ fontFamily: "kanit_B", fontSize: 16, color: "#0f172a" }}>รายงานใบสั่งซื้อ</div>
                    <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b" }}>รูปแบบมาตรฐานสำหรับพิมพ์ A4 และรองรับหลายหน้า</div>
                  </div>
                </div>
              </Modal_blrc.Title>
            </Modal_blrc.Header>
            <Modal_blrc.Body style={{ backgroundColor: "#e5e7eb", padding: "20px 24px" }}>
              <div className="document-print-sheet" style={PROFESSIONAL_DOCUMENT_PRINT_SHEET_STYLE} ref={contentRef}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, borderBottom: "2px solid #e5e7eb", paddingBottom: 14, marginBottom: 18 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "kanit_B", fontSize: 20, color: "#0f172a", lineHeight: 1.25 }}>{storeS || "SmileStore POS"}</div>
                    <div style={{ fontFamily: "kanit", fontSize: 11, color: "#475569", marginTop: 4 }}>{addressS || "-"}</div>
                    <div style={{ fontFamily: "kanit", fontSize: 11, color: "#475569", marginTop: 2 }}>
                      โทร {telS || "-"} {taxS ? `| เลขประจำตัวผู้เสียภาษี ${taxS}` : ""}
                    </div>
                    <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b", marginTop: 10 }}>Purchase Order / ใบสั่งซื้อสินค้า</div>
                  </div>

                  <div style={{ width: 220, borderRadius: 16, border: "1px solid #E5EEF8", background: "linear-gradient(180deg, #F3F8FC 0%, #f8fafc 100%)", padding: 14 }}>
                    <div className="d-flex align-items-center justify-content-between" style={{ marginBottom: 10, gap: 8 }}>
                      <span style={{ fontFamily: "kanit_B", fontSize: 12, color: "#1E5088" }}>PO SUMMARY</span>
                      <span style={{ padding: "4px 10px", borderRadius: 999, backgroundColor: statusBackground, color: statusColor, fontFamily: "kanit_B", fontSize: 10 }}>
                        {statusLabel}
                      </span>
                    </div>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div>
                        <div style={{ fontFamily: "kanit", fontSize: 10, color: "#64748b" }}>เลขที่เอกสาร</div>
                        <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#0f172a" }}>{reportOrder?.orderfull || "-"}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: "kanit", fontSize: 10, color: "#64748b" }}>วันที่ออกเอกสาร</div>
                        <div style={{ fontFamily: "kanit", fontSize: 12, color: "#0f172a" }}>{formatDocumentDate(reportOrder?.createDate)}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: "kanit", fontSize: 10, color: "#64748b" }}>ผู้จัดทำ</div>
                        <div style={{ fontFamily: "kanit", fontSize: 12, color: "#0f172a" }}>{reportOrder?.person || "-"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16, marginBottom: 18 }}>
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, backgroundColor: "#fafafa", padding: "14px 16px" }}>
                    <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#0f172a", marginBottom: 8 }}>ข้อมูลผู้ขาย</div>
                    <div style={{ fontFamily: "kanit_B", fontSize: 15, color: "#111827" }}>{reportOrder?.supplierName || orderVender || "-"}</div>
                    <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b", marginTop: 4 }}>รหัสผู้ขาย: {reportOrder?.supplierCode || "-"}</div>
                    <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b", marginTop: 4 }}>สถานะเอกสาร: {statusLabel}</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ border: "1px solid #E5EEF8", borderRadius: 14, backgroundColor: "#F3F8FC", padding: "12px 14px" }}>
                      <div style={{ fontFamily: "kanit", fontSize: 11, color: "#1E5088" }}>จำนวนรายการสินค้า</div>
                      <div style={{ fontFamily: "kanit_B", fontSize: 22, color: "#12314F", lineHeight: 1.2 }}>{reportItems.length}</div>
                    </div>
                    <div style={{ border: "1px solid #E5EEF8", borderRadius: 14, backgroundColor: "#F3F8FC", padding: "12px 14px" }}>
                      <div style={{ fontFamily: "kanit", fontSize: 11, color: "#1E5088" }}>จำนวนรวมทั้งหมด</div>
                      <div style={{ fontFamily: "kanit_B", fontSize: 22, color: "#173F6B", lineHeight: 1.2 }}>{formatDocumentQuantity(totalQuantity)}</div>
                    </div>
                    <div style={{ gridColumn: "1 / span 2", border: "1px solid #fed7aa", borderRadius: 14, backgroundColor: "#fff7ed", padding: "12px 14px" }}>
                      <div style={{ fontFamily: "kanit", fontSize: 11, color: "#c2410c" }}>ยอดสั่งซื้อรวม</div>
                      <div style={{ fontFamily: "kanit_B", fontSize: 24, color: "#9a3412", lineHeight: 1.2 }}>{formatDocumentCurrency(reportOrder?.totalAmount ?? totalAmount)} บาท</div>
                    </div>
                  </div>
                </div>

                {renderPurchaseOrderPrintItemsTable(reportItems)}

                <div className="document-print-footer-block" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16, marginTop: 18 }}>
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, backgroundColor: "#fafafa", padding: "14px 16px" }}>
                    <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#0f172a", marginBottom: 8 }}>หมายเหตุ</div>
                    <div style={{ fontFamily: "kanit", fontSize: 11, color: reportRemark ? "#334155" : "#94a3b8", minHeight: 72, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                      {reportRemark || "ไม่มีหมายเหตุเพิ่มเติม"}
                    </div>
                  </div>

                  <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, backgroundColor: "white", padding: "14px 16px" }}>
                    <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#0f172a", marginBottom: 10 }}>สรุปสำหรับการพิมพ์</div>
                    <div className="d-flex align-items-center justify-content-between" style={{ marginBottom: 8, gap: 10 }}>
                      <span style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b" }}>เลขที่ใบสั่งซื้อ</span>
                      <span style={{ fontFamily: "kanit_B", fontSize: 11, color: "#111827" }}>{reportOrder?.orderfull || "-"}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between" style={{ marginBottom: 8, gap: 10 }}>
                      <span style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b" }}>ผู้ขาย</span>
                      <span style={{ fontFamily: "kanit", fontSize: 11, color: "#111827", textAlign: "right" }}>{reportOrder?.supplierName || orderVender || "-"}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between" style={{ marginBottom: 8, gap: 10 }}>
                      <span style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b" }}>ผู้จัดทำ</span>
                      <span style={{ fontFamily: "kanit", fontSize: 11, color: "#111827" }}>{reportOrder?.person || "-"}</span>
                    </div>
                    <div style={{ height: 1, backgroundColor: "#e5e7eb", margin: "10px 0" }}></div>
                    <div className="d-flex align-items-center justify-content-between" style={{ gap: 10 }}>
                      <span style={{ fontFamily: "kanit_B", fontSize: 12, color: "#0f172a" }}>ยอดรวมทั้งสิ้น</span>
                      <span style={{ fontFamily: "kanit_B", fontSize: 14, color: "#0f172a" }}>{formatDocumentCurrency(reportOrder?.totalAmount ?? totalAmount)} บาท</span>
                    </div>
                  </div>
                </div>

                <div className="document-print-signatures" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}>
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, backgroundColor: "white", padding: "18px 20px", textAlign: "center" }}>
                    <div style={{ fontFamily: "kanit", fontSize: 11, color: "#6b7280", marginBottom: 34 }}>ผู้จัดทำใบสั่งซื้อ</div>
                    <div style={{ width: "70%", margin: "0 auto", borderBottom: "1px dashed #94a3b8" }}></div>
                    <div style={{ fontFamily: "kanit", fontSize: 11, color: "#94a3b8", marginTop: 6 }}>ลงชื่อ ................................................</div>
                    <div style={{ fontFamily: "kanit", fontSize: 10, color: "#cbd5e1", marginTop: 4 }}>วันที่ ......... / ......... / ..........</div>
                  </div>
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, backgroundColor: "white", padding: "18px 20px", textAlign: "center" }}>
                    <div style={{ fontFamily: "kanit", fontSize: 11, color: "#6b7280", marginBottom: 34 }}>ผู้อนุมัติการสั่งซื้อ</div>
                    <div style={{ width: "70%", margin: "0 auto", borderBottom: "1px dashed #94a3b8" }}></div>
                    <div style={{ fontFamily: "kanit", fontSize: 11, color: "#94a3b8", marginTop: 6 }}>ลงชื่อ ................................................</div>
                    <div style={{ fontFamily: "kanit", fontSize: 10, color: "#cbd5e1", marginTop: 4 }}>วันที่ ......... / ......... / ..........</div>
                  </div>
                </div>
              </div>
            </Modal_blrc.Body>
            <Modal_blrc.Footer>
              <button
                className="btn btn-primary"
                style={{ width: 100, height: 35, fontSize: 14, fontFamily: "Kanit" }}
                onClick={reactToPrintFn2}>
                Print A4
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={() => { setShowov(false); setSelectedOrderReport(null) }}>
                ปิด
              </button>
            </Modal_blrc.Footer>
          </Modal_blrc>
        </>
      )
    }

    function CreateOrderModal() {
      return (
        <Modal_blrc
          show={showCreateOrderModal}
          onHide={closeCreateOrderModal}
          size="xl"
          scrollable={true}
          className="document-modal"
          dialogClassName="document-modal-dialog"
          backdropClassName="document-modal-backdrop"
          animation={false}
          enforceFocus={false}
          aria-labelledby="purchase-order-create-title"
        >
          <Modal_blrc.Header closeButton style={{ borderBottom: "1px solid #e5e7eb", padding: "16px 24px", background: "linear-gradient(135deg, #f8fafc 0%, #ecfeff 100%)" }}>
            <Modal_blrc.Title id="purchase-order-create-title" style={{ width: "100%" }}>
              <div className="d-flex align-items-center" style={{ gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: "linear-gradient(135deg, #0f766e, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 24px rgba(20,184,166,0.24)" }}>
                  <Truck size={18} color="white" />
                </div>
                <div>
                  <div style={{ fontFamily: "kanit_B", fontSize: 16, color: "#0f172a" }}>ใบรายการสั่งซื้อสินค้า</div>
                  <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b" }}>สร้างเอกสารสั่งซื้อแบบมาตรฐาน พร้อมเลือกผู้ขายและพิมพ์หรือเลือกชื่อสินค้า</div>
                </div>
              </div>
            </Modal_blrc.Title>
          </Modal_blrc.Header>

          <Modal_blrc.Body style={{ backgroundColor: "#f8fafc", padding: "20px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16, marginBottom: 18 }}>
              <div style={{ borderRadius: 16, border: "1px solid #e5e7eb", backgroundColor: "white", padding: 18 }}>
                <div className="d-flex align-items-center" style={{ gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: "#ecfeff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Truck size={15} color="#0f766e" />
                  </div>
                  <div>
                    <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#0f172a" }}>ข้อมูลผู้ขาย</div>
                    <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b" }}>เลือกผู้ขายก่อนบันทึกใบรายการสั่งซื้อสินค้า</div>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151", marginBottom: 6 }}>ผู้ขาย</div>
                  <Form.Select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    disabled={orderSuppliersLoading}
                    style={{ fontFamily: "kanit", fontSize: 13, height: 42, borderRadius: 10, border: "1px solid #d1d5db" }}
                  >
                    <option value="">{orderSuppliersLoading ? "กำลังโหลดผู้ขาย..." : "เลือกผู้ขาย"}</option>
                    {orderSuppliers.map((supplier: any) => (
                      <option key={supplier?.id || supplier?.code} value={supplier?.id}>
                        {supplier?.code ? `${supplier.code} - ` : ""}{supplier?.names || supplier?.supplierName || "ไม่ระบุชื่อผู้ขาย"}
                      </option>
                    ))}
                  </Form.Select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ borderRadius: 12, border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", padding: "10px 12px" }}>
                    <div style={{ fontFamily: "kanit", fontSize: 10, color: "#64748b" }}>รหัสผู้ขาย</div>
                    <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#0f172a", marginTop: 2 }}>{selectedSupplier?.code || "-"}</div>
                  </div>
                  <div style={{ borderRadius: 12, border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", padding: "10px 12px" }}>
                    <div style={{ fontFamily: "kanit", fontSize: 10, color: "#64748b" }}>ผู้จัดทำ</div>
                    <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#0f172a", marginTop: 2 }}>{orderDraftPerson || "-"}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ borderRadius: 16, border: "1px solid #E5EEF8", backgroundColor: "#F3F8FC", padding: "14px 16px" }}>
                  <div style={{ fontFamily: "kanit", fontSize: 11, color: "#2A6AAA" }}>เลขที่เอกสารถัดไป</div>
                  <div style={{ fontFamily: "kanit_B", fontSize: 22, color: "#1E5088", lineHeight: 1.2, marginTop: 4 }}>{nextOrderFullPreview}</div>
                </div>
                <div style={{ borderRadius: 16, border: "1px solid #E5EEF8", backgroundColor: "#F3F8FC", padding: "14px 16px" }}>
                  <div style={{ fontFamily: "kanit", fontSize: 11, color: "#1E5088" }}>วันที่สร้างเอกสาร</div>
                  <div style={{ fontFamily: "kanit_B", fontSize: 22, color: "#1E5088", lineHeight: 1.2, marginTop: 4 }}>{formatDocumentDate(new Date())}</div>
                </div>
                <div style={{ borderRadius: 16, border: "1px solid #e2e8f0", backgroundColor: "white", padding: "14px 16px" }}>
                  <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b" }}>จำนวนรายการ</div>
                  <div style={{ fontFamily: "kanit_B", fontSize: 22, color: "#0f172a", lineHeight: 1.2, marginTop: 4 }}>{validOrderDraftItems.length}</div>
                </div>
                <div style={{ borderRadius: 16, border: "1px solid #fed7aa", backgroundColor: "#fff7ed", padding: "14px 16px" }}>
                  <div style={{ fontFamily: "kanit", fontSize: 11, color: "#c2410c" }}>ยอดรวมโดยประมาณ</div>
                  <div style={{ fontFamily: "kanit_B", fontSize: 22, color: "#9a3412", lineHeight: 1.2, marginTop: 4 }}>{formatDocumentCurrency(totalDraftAmount)}</div>
                </div>
              </div>
            </div>

            <div style={{ borderRadius: 16, border: "1px solid #e5e7eb", backgroundColor: "white", overflow: "hidden", marginBottom: 18 }}>
              <div className="d-flex align-items-center justify-content-between" style={{ gap: 12, padding: "14px 18px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#fbfdff" }}>
                <div>
                  <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#0f172a" }}>รายการสินค้า</div>
                  <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b" }}>พิมพ์ชื่อสินค้าเอง หรือเลือกจากคลังสินค้าด้วยปุ่มเพิ่มสินค้า</div>
                </div>
                <div className="d-flex align-items-center" style={{ gap: 8 }}>
                  <ProductPickerTrigger products={dataProduct} onAddProduct={handleAddDraftProduct} />
                  <button
                    type="button"
                    onClick={addBlankOrderDraftItem}
                    style={{ border: "1px solid #cbd5e1", backgroundColor: "white", color: "#334155", borderRadius: 999, padding: "6px 12px", fontFamily: "kanit_B", fontSize: 12, cursor: "pointer" }}
                  >
                    + เพิ่มแถวเปล่า
                  </button>
                </div>
              </div>

              <div style={{ padding: 16, overflowX: "auto" }}>
                <table className="table table-sm mb-0" style={{ minWidth: 920, verticalAlign: "middle" }}>
                  <thead>
                    <tr>
                      <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 8px", width: 56 }}>ลำดับ</th>
                      <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 8px", width: 120 }}>รหัสสินค้า</th>
                      <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 8px", minWidth: 260 }}>ชื่อสินค้า</th>
                      <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 8px", width: 100 }}>หน่วย</th>
                      <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 8px", width: 110, textAlign: "center" }}>จำนวน</th>
                      <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 8px", width: 140, textAlign: "right" }}>ราคาทุน/หน่วย</th>
                      <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 8px", width: 140, textAlign: "right" }}>รวม</th>
                      <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 8px", width: 56 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDraftItems.map((item, index) => {
                      const qty = Math.max(1, Number(item.qty || 0) || 1)
                      const cost = Math.max(0, Number(item.newCost || 0) || 0)
                      const total = qty * cost

                      return (
                        <tr key={item.id}>
                          <td style={{ fontFamily: "kanit_B", fontSize: 12, color: "#94a3b8", padding: "10px 8px" }}>{index + 1}</td>
                          <td style={{ padding: "10px 8px" }}>
                            <Form.Control
                              value={item.itemcode}
                              onChange={(e) => updateOrderDraftItem(item.id, { itemcode: e.target.value })}
                              placeholder="รหัส"
                              style={{ fontFamily: "kanit", fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
                            />
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <Form.Control
                              value={item.itemName}
                              onChange={(e) => handleOrderDraftItemNameChange(item.id, e.target.value)}
                              placeholder="พิมพ์ชื่อสินค้า หรือเลือกจากปุ่มเพิ่มสินค้า"
                              style={{ fontFamily: "kanit", fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
                            />
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <Form.Control
                              value={item.unit}
                              onChange={(e) => updateOrderDraftItem(item.id, { unit: e.target.value })}
                              placeholder="หน่วย"
                              style={{ fontFamily: "kanit", fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
                            />
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <Form.Control
                              value={item.qty}
                              onChange={(e) => handleOrderDraftNumberChange(item.id, "qty", e.target.value)}
                              placeholder="1"
                              style={{ fontFamily: "kanit", fontSize: 12, textAlign: "center", borderRadius: 10, border: "1px solid #e5e7eb" }}
                            />
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <Form.Control
                              value={item.newCost}
                              onChange={(e) => handleOrderDraftNumberChange(item.id, "newCost", e.target.value)}
                              placeholder="0.00"
                              style={{ fontFamily: "kanit", fontSize: 12, textAlign: "right", borderRadius: 10, border: "1px solid #e5e7eb" }}
                            />
                          </td>
                          <td style={{ fontFamily: "kanit_B", fontSize: 12, color: "#0f172a", textAlign: "right", padding: "10px 8px" }}>{formatDocumentCurrency(total)}</td>
                          <td style={{ padding: "10px 8px" }}>
                            <button
                              type="button"
                              onClick={() => removeOrderDraftItem(item.id)}
                              style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid #fecaca", backgroundColor: "#fff1f2", color: "#dc2626", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                              title="ลบรายการ"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16 }}>
              <div style={{ borderRadius: 16, border: "1px solid #e5e7eb", backgroundColor: "white", padding: 18 }}>
                <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#0f172a", marginBottom: 8 }}>หมายเหตุ</div>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={orderDraftRemark}
                  onChange={(e) => setOrderDraftRemark(e.target.value)}
                  placeholder="ข้อความเพิ่มเติมสำหรับการสั่งซื้อสินค้า เช่น เงื่อนไขการจัดส่ง หรือหมายเหตุถึงผู้ขาย"
                  style={{ fontFamily: "kanit", fontSize: 12, resize: "vertical", borderRadius: 12, border: "1px solid #e5e7eb" }}
                />
              </div>

              <div style={{ borderRadius: 16, border: "1px solid #e5e7eb", backgroundColor: "white", padding: 18 }}>
                <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#0f172a", marginBottom: 10 }}>สรุปรายการสั่งซื้อ</div>
                <div className="d-flex align-items-center justify-content-between" style={{ marginBottom: 8, gap: 8 }}>
                  <span style={{ fontFamily: "kanit", fontSize: 12, color: "#64748b" }}>จำนวนรายการ</span>
                  <span style={{ fontFamily: "kanit_B", fontSize: 12, color: "#0f172a" }}>{validOrderDraftItems.length}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between" style={{ marginBottom: 8, gap: 8 }}>
                  <span style={{ fontFamily: "kanit", fontSize: 12, color: "#64748b" }}>จำนวนรวม</span>
                  <span style={{ fontFamily: "kanit_B", fontSize: 12, color: "#0f172a" }}>{formatDocumentQuantity(totalDraftQuantity)}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between" style={{ marginBottom: 8, gap: 8 }}>
                  <span style={{ fontFamily: "kanit", fontSize: 12, color: "#64748b" }}>ยอดรวมทั้งหมด</span>
                  <span style={{ fontFamily: "kanit_B", fontSize: 13, color: "#0f172a" }}>{formatDocumentCurrency(totalDraftAmount)} บาท</span>
                </div>
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px dashed #d1d5db", fontFamily: "kanit", fontSize: 11, color: "#64748b", lineHeight: 1.7 }}>
                  เอกสารนี้สามารถเปิดรายงานและพิมพ์ A4 ได้จากไอคอนรายงานในตารางหลังบันทึกเรียบร้อยแล้ว
                </div>
              </div>
            </div>

            {orderDraftError ? (
              <div style={{ marginTop: 16, border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#b91c1c", borderRadius: 12, padding: "12px 14px", fontFamily: "kanit", fontSize: 12 }}>
                {orderDraftError}
              </div>
            ) : null}
          </Modal_blrc.Body>

          <Modal_blrc.Footer style={{ borderTop: "1px solid #e5e7eb", padding: "12px 24px", background: "#fafbfc", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "kanit", fontSize: 12, color: "#64748b" }}>บันทึกเป็นใบรายการสั่งซื้อสินค้าแบบมาตรฐานของระบบ</div>
            <div className="d-flex align-items-center" style={{ gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: 88, height: 36, fontSize: 14, fontFamily: "Kanit" }}
                onClick={closeCreateOrderModal}
                disabled={orderDraftSaving}
              >
                ปิด
              </button>
              <button
                type="button"
                className="btn btn-success"
                style={{ minWidth: 150, height: 36, fontSize: 14, fontFamily: "Kanit_B" }}
                onClick={() => { void savePurchaseOrderDraft() }}
                disabled={orderDraftSaving || !selectedSupplierId || validOrderDraftItems.length === 0}
              >
                {orderDraftSaving ? "กำลังบันทึก..." : "บันทึกใบรายการสั่งซื้อ"}
              </button>
            </div>
          </Modal_blrc.Footer>
        </Modal_blrc>
      )
    }

    return (
      <>
        <OrderTemplate />
        <CreateOrderModal />
        <div className="col">
          <div className='d-flex align-items-center justify-content-between mb-1 mt-1' style={{ gap: 12 }}>
            <div style={{ fontFamily: "kanit_B", fontSize: 18, color: "#1f2937" }}>ใบสั่งสินค้า</div>
            <button
              type="button"
              onClick={openCreateOrderModal}
              style={{
                padding: "6px 16px",
                borderRadius: 10,
                border: "1.5px solid #0f766e",
                backgroundColor: "#F3F8FC",
                color: "#0f766e",
                fontSize: 13,
                fontFamily: "kanit_B",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              <Plus size={14} /> สร้างใบรายการสั่งซื้อสินค้า
            </button>
          </div>
          <table className="table table-hover" style={{ borderCollapse: "separate", borderSpacing: "0" }}>
            <thead >
              <tr >
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>วันที่สั่งสินค้า</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>เลขที่เอกสาร</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>ชื่อผู้ขาย</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>จำนวน</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>ยอดรวม</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>สถานะ</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>ผู้ทำรายการ</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", width: 144, textAlign: "center" }}>จัดการเอกสาร</td>

              </tr>
            </thead>
            <tbody >
              {ordermain.map((a: any) =>
                <tr key={a.id} >
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 30 }}>
                    {new Date(a.createDate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 30 }}>{a.orderfull}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 30 }}>{a.supplierName}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 30, textAlign: "center" }}>{a.items?.length || 0}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 30, textAlign: "center" }}>{a.totalAmount?.toLocaleString()}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 30, textAlign: "center" }}>
                    <span style={{
                      padding: '3px 12px',
                      borderRadius: 20,
                      backgroundColor: a.status === 'Pending' ? '#fef3c7' : '#D3F0E2',
                      color: a.status === 'Pending' ? '#92400e' : '#0C5238',
                      fontSize: 11, fontWeight: 600, fontFamily: "kanit",
                    }}>
                      {a.status === 'Pending' ? 'รอดำเนินการ' : 'ได้รับสินค้าแล้ว'}
                    </span>
                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 30, textAlign: "center" }}>{a.person}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, textAlign: "center", height: 40, width: 144, minWidth: 144 }} className='d-flex'>
                    <div className='d-flex justify-content-center align-items-center' style={{ gap: 8, flexWrap: "nowrap", whiteSpace: "nowrap", width: "100%" }}>
                      <button
                        onClick={() => { openPurchaseOrderEditor(a.id) }}
                        title="แก้ไขใบสั่งซื้อสินค้า"
                        aria-label="แก้ไขใบสั่งซื้อสินค้า"
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, padding: 0, borderRadius: 10, border: "1px solid #A6C8E7", backgroundColor: "#F3F8FC", color: "#1E5088", cursor: "pointer", transition: "all 0.2s ease", boxShadow: "0 1px 2px rgba(15,23,42,0.08)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#2A6AAA"; e.currentTarget.style.borderColor = "#2A6AAA"; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(42, 106, 170,0.22)" }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#F3F8FC"; e.currentTarget.style.borderColor = "#A6C8E7"; e.currentTarget.style.color = "#1E5088"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(15,23,42,0.08)" }}
                      >
                        <PencilLine size={15} />
                      </button>
                      <button
                        onClick={() => { GetDetailOrder(a) }}
                        title="รายงานใบสั่งซื้อ"
                        aria-label="รายงานใบสั่งซื้อ"
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, padding: 0, borderRadius: 10, border: "1px solid #A6C8E7", backgroundColor: "#F3F8FC", color: "#1E5088", cursor: "pointer", transition: "all 0.2s ease", boxShadow: "0 1px 2px rgba(15,23,42,0.08)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#2A6AAA"; e.currentTarget.style.borderColor = "#2A6AAA"; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(42, 106, 170,0.22)" }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#F3F8FC"; e.currentTarget.style.borderColor = "#A6C8E7"; e.currentTarget.style.color = "#1E5088"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(15,23,42,0.08)" }}
                      >
                        <FileSpreadsheet size={16} />
                      </button>
                      </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </>

    )
  }

  //*****************   ใบรับสินค้า  ***************************/
  const [postItem, setPostItem] = useState([])
  const [vender, setvender] = useState("")
  const [selectedDocType, setSelectedDocType] = useState<{ [key: number]: string }>({})
  const [currentDocTypeLabel, setCurrentDocTypeLabel] = useState("แบบ ข.ย. ๙")

  const docTypeOptions = [
    { value: "ข.ย.9", label: "ข.ย.9" },
    { value: "ข.ย.10", label: "ข.ย.10" },
    { value: "ข.ย.11", label: "ข.ย.11" },
    { value: "ข.ย.12", label: "ข.ย.12" },
    { value: "ข.ย.13", label: "ข.ย.13" },
  ]

  // Convert Arabic numerals to Thai numerals
  const toThaiNumeral = (num: string): string => {
    const thaiNumerals: { [key: string]: string } = {
      '0': '๐', '1': '๑', '2': '๒', '3': '๓', '4': '๔',
      '5': '๕', '6': '๖', '7': '๗', '8': '๘', '9': '๙'
    }
    return num.replace(/[0-9]/g, (d) => thaiNumerals[d] || d)
  }

  // Convert docType to Thai format (e.g., "ข.ย.9" -> "แบบ ข.ย. ๙")
  const toThaiDocType = (docType: string): string => {
    const match = docType.match(/(\d+)$/)
    if (match) {
      const number = match[1]
      const thaiNumber = toThaiNumeral(number)
      return `แบบ ข.ย. ${thaiNumber}`
    }
    return "แบบ ข.ย. ๙"
  }

  const Receive = () => {

    const createTodayInputValue = () => {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    }

    const parseDateInputValue = (value: string) => (
      value ? new Date(`${value}T00:00:00`) : null
    )

    const [showCreateReceiveModal, setShowCreateReceiveModal] = useState(false)
    const [receiveSuppliers, setReceiveSuppliers] = useState<any[]>([])
    const [receiveSuppliersLoading, setReceiveSuppliersLoading] = useState(false)
    const [receiveDraftPerson, setReceiveDraftPerson] = useState("")
    const [selectedReceiveSupplierId, setSelectedReceiveSupplierId] = useState("")
    const [receiveDraftReferenceNo, setReceiveDraftReferenceNo] = useState("")
    const [receiveDraftOrderDate, setReceiveDraftOrderDate] = useState(() => createTodayInputValue())
    const [receiveDraftReceiveDate, setReceiveDraftReceiveDate] = useState(() => createTodayInputValue())
    const [receiveDraftItems, setReceiveDraftItems] = useState<ReceiveDraftItem[]>([createReceiveDraftItem()])
    const [receiveDraftError, setReceiveDraftError] = useState("")
    const [receiveDraftSaving, setReceiveDraftSaving] = useState(false)

    const fetchReceiveSuppliers = async () => {
      const companyS = localStorage.getItem("company_") || ""
      if (!companyS) {
        setReceiveSuppliers([])
        return
      }

      setReceiveSuppliersLoading(true)
      try {
        const res = await axios.get(`/api/supplier?company=${companyS}&fields=list`)
        setReceiveSuppliers(Array.isArray(res.data) ? res.data : [])
      } catch (error) {
        console.error(error)
        setReceiveSuppliers([])
      } finally {
        setReceiveSuppliersLoading(false)
      }
    }

    useEffect(() => {
      void fetchReceiveSuppliers()
      setReceiveDraftPerson(localStorage.getItem("person_") || "")
    }, [])

    const resetCreateReceiveForm = () => {
      const todayValue = createTodayInputValue()
      setSelectedReceiveSupplierId("")
      setReceiveDraftReferenceNo("")
      setReceiveDraftOrderDate(todayValue)
      setReceiveDraftReceiveDate(todayValue)
      setReceiveDraftItems([createReceiveDraftItem()])
      setReceiveDraftError("")
      setReceiveDraftSaving(false)
    }

    const openCreateReceiveModal = () => {
      resetCreateReceiveForm()
      setShowCreateReceiveModal(true)
    }

    const closeCreateReceiveModal = () => {
      setShowCreateReceiveModal(false)
      setReceiveDraftError("")
    }

    const openReceiveEditor = (receiveId: number) => {
      if (typeof window === "undefined") return
      window.location.assign(`/web/receives?receiveId=${encodeURIComponent(String(receiveId))}`)
    }

    const findReceiveProductMatch = (rawValue: string): any | null => {
      const normalizedValue = rawValue.trim().toLowerCase()
      if (!normalizedValue) return null

      return ((Array.isArray(dataProduct) ? dataProduct : []) as any[]).find((product: any) => {
        const productName = String(product?.ProductName || "").trim().toLowerCase()
        const productCode = String(product?.code || "").trim().toLowerCase()
        return productName === normalizedValue || productCode === normalizedValue
      }) || null
    }

    const updateReceiveDraftItem = (itemId: string, patch: Partial<ReceiveDraftItem>) => {
      setReceiveDraftItems((prev) => prev.map((item) => item.id === itemId ? { ...item, ...patch } : item))
    }

    const handleReceiveDraftItemNameChange = (itemId: string, value: string) => {
      const matchedProduct = findReceiveProductMatch(value)
      updateReceiveDraftItem(itemId, {
        itemName: value,
        itemcode: matchedProduct ? String(matchedProduct.code || "") : "",
        unit: matchedProduct ? String(matchedProduct.Unit || "") : "",
      })
    }

    const handleReceiveDraftNumberChange = (itemId: string, field: "qty" | "newCost", value: string) => {
      const sanitizedValue = value.replace(/[^0-9.]/g, "")
      updateReceiveDraftItem(itemId, { [field]: sanitizedValue } as Partial<ReceiveDraftItem>)
    }

    const addBlankReceiveDraftItem = () => {
      setReceiveDraftItems((prev) => [...prev, createReceiveDraftItem()])
    }

    const removeReceiveDraftItem = (itemId: string) => {
      setReceiveDraftItems((prev) => {
        if (prev.length === 1) return [createReceiveDraftItem()]
        return prev.filter((item) => item.id !== itemId)
      })
    }

    const handleAddReceiveDraftProduct = async (product: any, qty: number) => {
      setReceiveDraftItems((prev) => ([
        ...prev,
        createReceiveDraftItem({
          itemcode: String(product?.code || ""),
          itemName: String(product?.ProductName || ""),
          unit: String(product?.Unit || ""),
          qty: String(Math.max(1, Number(qty || 1))),
          newCost: String(Number(product?.newCost ?? product?.cost ?? 0) || 0),
        }),
      ]))
    }

    const selectedReceiveSupplier = receiveSuppliers.find((supplier: any) => String(supplier?.id) === String(selectedReceiveSupplierId)) || null

    const normalizedReceiveDraftItems = receiveDraftItems.map((item) => {
      const itemName = String(item.itemName || "").trim()
      const itemcode = String(item.itemcode || "").trim()
      const unit = String(item.unit || "").trim()
      const lot = String(item.lot || "").trim()
      const dateExp = String(item.dateExp || "").trim()
      const qty = Math.max(1, Number(item.qty || 0) || 1)
      const newCost = Math.max(0, Number(item.newCost || 0) || 0)
      const isRowTouched = itemName !== "" || itemcode !== "" || unit !== "" || lot !== "" || dateExp !== "" || Number(item.qty || 1) !== 1 || Number(item.newCost || 0) > 0

      return {
        ...item,
        itemName,
        itemcode,
        unit,
        lot,
        dateExp,
        qty,
        newCost,
        totalcost: Number((qty * newCost).toFixed(2)),
        isRowTouched,
      }
    })

    const receiveDraftHasInvalidRow = normalizedReceiveDraftItems.some((item) => item.isRowTouched && item.itemName === "")
    const validReceiveDraftItems = normalizedReceiveDraftItems.filter((item) => item.itemName !== "")
    const totalReceiveDraftQuantity = validReceiveDraftItems.reduce((sum, item) => sum + item.qty, 0)
    const totalReceiveDraftAmount = validReceiveDraftItems.reduce((sum, item) => sum + item.totalcost, 0)

    const currentReceiveDate = new Date()
    const currentReceiveNo = `${currentReceiveDate.getFullYear()}${String(currentReceiveDate.getMonth() + 1).padStart(2, "0")}${String(currentReceiveDate.getDate()).padStart(2, "0")}`
    const todayReceiveSequences = (Array.isArray(rcmain) ? rcmain : [])
      .filter((receive: any) => String(receive?.orderNo || "") === currentReceiveNo)
      .map((receive: any) => {
        const orderFullValue = String(receive?.orderfull || "")
        if (orderFullValue.startsWith(currentReceiveNo)) {
          const sequenceFromOrderFull = Number(orderFullValue.slice(currentReceiveNo.length))
          if (Number.isFinite(sequenceFromOrderFull) && sequenceFromOrderFull > 0) {
            return sequenceFromOrderFull
          }
        }

        const codeValue = Number(receive?.code || 0)
        return Number.isFinite(codeValue) && codeValue > 0 ? codeValue : 100
      })
    const nextReceiveSequence = todayReceiveSequences.length > 0 ? Math.max(...todayReceiveSequences) + 1 : 100
    const nextReceiveFullPreview = `${currentReceiveNo}${nextReceiveSequence}`

    const saveReceiveDraft = async () => {
      if (!selectedReceiveSupplierId) {
        setReceiveDraftError("กรุณาเลือกผู้ขายก่อนบันทึกใบรายการรับสินค้า")
        return
      }

      if (receiveDraftHasInvalidRow) {
        setReceiveDraftError("กรุณากรอกชื่อสินค้าให้ครบทุกแถวที่ต้องการใช้งาน")
        return
      }

      if (validReceiveDraftItems.length === 0) {
        setReceiveDraftError("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ")
        return
      }

      const companyS = localStorage.getItem("company_") || ""
      const person = receiveDraftPerson || localStorage.getItem("person_") || ""
      if (!companyS) {
        setReceiveDraftError("ไม่พบข้อมูลบริษัทสำหรับบันทึกใบรายการรับสินค้า")
        return
      }

      if (!selectedReceiveSupplier) {
        setReceiveDraftError("ไม่พบข้อมูลผู้ขายที่เลือก กรุณาเลือกใหม่อีกครั้ง")
        return
      }

      setReceiveDraftSaving(true)
      setReceiveDraftError("")

      const totalRC = Number(totalReceiveDraftAmount.toFixed(2))
      const totalRCAll = totalRC
      const countorder = validReceiveDraftItems.length
      let createdReceiveId: number | null = null
      let itemsSaved = false

      try {
        const createRes = await axios.post('/api/receive', {
          company: companyS,
          code: String(nextReceiveSequence),
          names: selectedReceiveSupplier?.names || selectedReceiveSupplier?.supplierName || "",
          invoice_No: receiveDraftReferenceNo.trim(),
          order_date: parseDateInputValue(receiveDraftOrderDate),
          receive_date: parseDateInputValue(receiveDraftReceiveDate),
          tax_date: null,
          pay_date: null,
          statuss: "",
          codenames: selectedReceiveSupplier?.code || "",
          orderNo: currentReceiveNo,
          orderfull: nextReceiveFullPreview,
          persons: person,
        })

        createdReceiveId = Number(createRes.data?.id || 0) || null

        await axios.post('/api/receivelist', validReceiveDraftItems.map((item) => ({
          company: companyS,
          codenames: nextReceiveFullPreview,
          itemcode: item.itemcode,
          itemName: item.itemName,
          unit: item.unit,
          newCost: item.newCost,
          qty: item.qty,
          totalcost: item.totalcost,
          lot: item.lot || null,
          dateExp: item.dateExp ? parseDateInputValue(item.dateExp) : null,
          freebaht: 0,
          discountbaht: 0,
          sale: 0,
          balance: item.qty,
          person,
          statuss: "Pending",
          dateRC: parseDateInputValue(receiveDraftReceiveDate),
          codevender: selectedReceiveSupplier?.code || "",
          namevender: selectedReceiveSupplier?.names || selectedReceiveSupplier?.supplierName || "",
        })))
        itemsSaved = true

        if (createdReceiveId) {
          await axios.put(`/api/receive/${createdReceiveId}`, {
            totalRC,
            vatRC: 0,
            discountRC: 0,
            totalRCAll,
            countorder,
          })
        }

        await GetMainRC()
        closeCreateReceiveModal()
        resetCreateReceiveForm()
        window.alert(`บันทึกใบรายการรับสินค้าเลขที่ RC${nextReceiveFullPreview} เรียบร้อยแล้ว`)
      } catch (error) {
        console.error(error)
        if (createdReceiveId && !itemsSaved) {
          try {
            await axios.delete(`/api/receive/${createdReceiveId}`)
          } catch (rollbackError) {
            console.error(rollbackError)
          }
        }
        setReceiveDraftError("บันทึกใบรายการรับสินค้าไม่สำเร็จ")
      } finally {
        setReceiveDraftSaving(false)
      }
    }




    const GetDetailRC = async (orderfull: String, docType: string = "") => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res1 = await axios.get(`/api/${apircitem}?company=${companyS}&codenames=${orderfull}&docType=${encodeURIComponent(docType)}`)
        setPostItem(res1.data)

      } catch (error) {
        console.error(error)
      }
    }

    function CreateReceiveModal() {
      return (
        <Modal_blrc
          show={showCreateReceiveModal}
          onHide={closeCreateReceiveModal}
          size="xl"
          scrollable={true}
          className="document-modal"
          dialogClassName="document-modal-dialog"
          backdropClassName="document-modal-backdrop"
          animation={false}
          enforceFocus={false}
          aria-labelledby="receive-create-title"
        >
          <Modal_blrc.Header closeButton style={{ borderBottom: "1px solid #e5e7eb", padding: "16px 24px", background: "linear-gradient(135deg, #F3F8FC 0%, #ecfeff 100%)" }}>
            <Modal_blrc.Title id="receive-create-title" style={{ width: "100%" }}>
              <div className="d-flex align-items-center" style={{ gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: "linear-gradient(135deg, #2A6AAA, #3E86C7)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 24px rgba(62, 134, 199,0.24)" }}>
                  <Package size={18} color="white" />
                </div>
                <div>
                  <div style={{ fontFamily: "kanit_B", fontSize: 16, color: "#0f172a" }}>ใบรายการรับสินค้า</div>
                  <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b" }}>สร้างเอกสารรับสินค้าแบบมาตรฐาน พร้อมเลือกผู้ขายและเพิ่มรายการสินค้าได้ทันที</div>
                </div>
              </div>
            </Modal_blrc.Title>
          </Modal_blrc.Header>

          <Modal_blrc.Body style={{ backgroundColor: "#f8fafc", padding: "20px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16, marginBottom: 18 }}>
              <div style={{ borderRadius: 16, border: "1px solid #e5e7eb", backgroundColor: "white", padding: 18 }}>
                <div className="d-flex align-items-center" style={{ gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: "#F3F8FC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Truck size={15} color="#2A6AAA" />
                  </div>
                  <div>
                    <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#0f172a" }}>ข้อมูลผู้ขาย</div>
                    <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b" }}>เลือกบริษัทผู้ขายเพื่อผูกข้อมูลเอกสารและรายการรับสินค้า</div>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151", marginBottom: 6 }}>ผู้ขาย</div>
                  <Form.Select
                    value={selectedReceiveSupplierId}
                    onChange={(e) => setSelectedReceiveSupplierId(e.target.value)}
                    disabled={receiveSuppliersLoading}
                    style={{ fontFamily: "kanit", fontSize: 13, height: 42, borderRadius: 10, border: "1px solid #d1d5db" }}
                  >
                    <option value="">{receiveSuppliersLoading ? "กำลังโหลดผู้ขาย..." : "เลือกผู้ขาย"}</option>
                    {receiveSuppliers.map((supplier: any) => (
                      <option key={supplier?.id || supplier?.code} value={supplier?.id}>
                        {supplier?.code ? `${supplier.code} - ` : ""}{supplier?.names || supplier?.supplierName || "ไม่ระบุชื่อผู้ขาย"}
                      </option>
                    ))}
                  </Form.Select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div style={{ borderRadius: 12, border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", padding: "10px 12px" }}>
                    <div style={{ fontFamily: "kanit", fontSize: 10, color: "#64748b" }}>รหัสผู้ขาย</div>
                    <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#0f172a", marginTop: 2 }}>{selectedReceiveSupplier?.code || "-"}</div>
                  </div>
                  <div style={{ borderRadius: 12, border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", padding: "10px 12px" }}>
                    <div style={{ fontFamily: "kanit", fontSize: 10, color: "#64748b" }}>ผู้รับผิดชอบ</div>
                    <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#0f172a", marginTop: 2 }}>{receiveDraftPerson || "-"}</div>
                  </div>
                </div>

                <div style={{ borderRadius: 12, border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", padding: "12px 14px" }}>
                  <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#0f172a", marginBottom: 6 }}>{selectedReceiveSupplier?.names || selectedReceiveSupplier?.supplierName || "ยังไม่ได้เลือกผู้ขาย"}</div>
                  <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b", lineHeight: 1.7 }}>
                    โทร {selectedReceiveSupplier?.tel || "-"} {selectedReceiveSupplier?.email ? `| ${selectedReceiveSupplier.email}` : ""}
                  </div>
                  <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b", lineHeight: 1.7, marginTop: 4, minHeight: 36 }}>
                    {selectedReceiveSupplier?.address || "ที่อยู่ผู้ขายจะปรากฏที่นี่เมื่อเลือกบริษัทแล้ว"}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ borderRadius: 16, border: "1px solid #E5EEF8", backgroundColor: "#F3F8FC", padding: "14px 16px" }}>
                  <div style={{ fontFamily: "kanit", fontSize: 11, color: "#2A6AAA" }}>เลขที่เอกสารถัดไป</div>
                  <div style={{ fontFamily: "kanit_B", fontSize: 22, color: "#1E5088", lineHeight: 1.2, marginTop: 4 }}>RC{nextReceiveFullPreview}</div>
                </div>
                <div style={{ borderRadius: 16, border: "1px solid #CCDFF1", backgroundColor: "#F3F8FC", padding: "14px 16px" }}>
                  <div style={{ fontFamily: "kanit", fontSize: 11, color: "#1E5088" }}>วันที่รับสินค้า</div>
                  <div style={{ fontFamily: "kanit_B", fontSize: 22, color: "#0f172a", lineHeight: 1.2, marginTop: 4 }}>{formatDocumentDate(parseDateInputValue(receiveDraftReceiveDate))}</div>
                </div>
                <div style={{ borderRadius: 16, border: "1px solid #e2e8f0", backgroundColor: "white", padding: "14px 16px" }}>
                  <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b" }}>จำนวนรายการ</div>
                  <div style={{ fontFamily: "kanit_B", fontSize: 22, color: "#0f172a", lineHeight: 1.2, marginTop: 4 }}>{validReceiveDraftItems.length}</div>
                </div>
                <div style={{ borderRadius: 16, border: "1px solid #E5EEF8", backgroundColor: "#F3F8FC", padding: "14px 16px" }}>
                  <div style={{ fontFamily: "kanit", fontSize: 11, color: "#1E5088" }}>ยอดรับรวม</div>
                  <div style={{ fontFamily: "kanit_B", fontSize: 22, color: "#173F6B", lineHeight: 1.2, marginTop: 4 }}>{formatDocumentCurrency(totalReceiveDraftAmount)}</div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16, marginBottom: 18 }}>
              <div style={{ borderRadius: 16, border: "1px solid #e5e7eb", backgroundColor: "white", padding: 18 }}>
                <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#0f172a", marginBottom: 10 }}>ข้อมูลเอกสาร</div>
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr 0.9fr", gap: 10 }}>
                  <div>
                    <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151", marginBottom: 6 }}>เลขที่อ้างอิง/ใบสั่งซื้อ</div>
                    <Form.Control
                      value={receiveDraftReferenceNo}
                      onChange={(e) => setReceiveDraftReferenceNo(e.target.value)}
                      placeholder="เช่น PO-2025-001 หรือเลขที่ใบส่งของ"
                      style={{ fontFamily: "kanit", fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
                    />
                  </div>
                  <div>
                    <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151", marginBottom: 6 }}>วันที่สั่งสินค้า</div>
                    <Form.Control
                      type="date"
                      value={receiveDraftOrderDate}
                      onChange={(e) => setReceiveDraftOrderDate(e.target.value)}
                      style={{ fontFamily: "kanit", fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
                    />
                  </div>
                  <div>
                    <div style={{ fontFamily: "kanit_B", fontSize: 12, color: "#374151", marginBottom: 6 }}>วันที่รับสินค้า</div>
                    <Form.Control
                      type="date"
                      value={receiveDraftReceiveDate}
                      onChange={(e) => setReceiveDraftReceiveDate(e.target.value)}
                      style={{ fontFamily: "kanit", fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ borderRadius: 16, border: "1px solid #E5EEF8", background: "linear-gradient(180deg, #f8fdff 0%, #F3F8FC 100%)", padding: 18 }}>
                <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#0f172a", marginBottom: 10 }}>แนวทางการบันทึก</div>
                <div style={{ fontFamily: "kanit", fontSize: 11, color: "#475569", lineHeight: 1.8 }}>
                  เลือกผู้ขายก่อน จากนั้นพิมพ์ชื่อสินค้าเองหรือเลือกจากคลังสินค้าด้วยปุ่มเพิ่มสินค้า ระบบจะบันทึกยอดรวม จำนวนรายการ และสร้างข้อมูลรับสินค้าให้อยู่ในตารางนี้ทันทีหลังบันทึกสำเร็จ
                </div>
              </div>
            </div>

            <div style={{ borderRadius: 16, border: "1px solid #e5e7eb", backgroundColor: "white", overflow: "hidden", marginBottom: 18 }}>
              <div className="d-flex align-items-center justify-content-between" style={{ gap: 12, padding: "14px 18px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#fbfdff" }}>
                <div>
                  <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#0f172a" }}>รายการสินค้า</div>
                  <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b" }}>รองรับการเพิ่มชื่อสินค้าเอง หรือดึงจากข้อมูลสินค้าในระบบ</div>
                </div>
                <div className="d-flex align-items-center" style={{ gap: 8 }}>
                  <ProductPickerTrigger products={dataProduct} onAddProduct={handleAddReceiveDraftProduct} />
                  <button
                    type="button"
                    onClick={addBlankReceiveDraftItem}
                    style={{ border: "1px solid #cbd5e1", backgroundColor: "white", color: "#334155", borderRadius: 999, padding: "6px 12px", fontFamily: "kanit_B", fontSize: 12, cursor: "pointer" }}
                  >
                    + เพิ่มแถวเปล่า
                  </button>
                </div>
              </div>

              <div style={{ padding: 16, overflowX: "auto" }}>
                <table className="table table-sm mb-0" style={{ minWidth: 1180, verticalAlign: "middle" }}>
                  <thead>
                    <tr>
                      <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 8px", width: 56 }}>ลำดับ</th>
                      <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 8px", width: 120 }}>รหัสสินค้า</th>
                      <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 8px", minWidth: 260 }}>ชื่อสินค้า</th>
                      <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 8px", width: 100 }}>หน่วย</th>
                      <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 8px", width: 100, textAlign: "center" }}>จำนวน</th>
                      <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 8px", width: 130, textAlign: "right" }}>ทุน/หน่วย</th>
                      <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 8px", width: 140 }}>Lot/Batch</th>
                      <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 8px", width: 150 }}>วันหมดอายุ</th>
                      <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 8px", width: 140, textAlign: "right" }}>รวม</th>
                      <th style={{ fontFamily: "kanit_B", fontSize: 11, color: "#64748b", padding: "10px 8px", width: 56 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiveDraftItems.map((item, index) => {
                      const qty = Math.max(1, Number(item.qty || 0) || 1)
                      const cost = Math.max(0, Number(item.newCost || 0) || 0)
                      const total = qty * cost

                      return (
                        <tr key={item.id}>
                          <td style={{ fontFamily: "kanit_B", fontSize: 12, color: "#94a3b8", padding: "10px 8px" }}>{index + 1}</td>
                          <td style={{ padding: "10px 8px" }}>
                            <Form.Control
                              value={item.itemcode}
                              onChange={(e) => updateReceiveDraftItem(item.id, { itemcode: e.target.value })}
                              placeholder="รหัส"
                              style={{ fontFamily: "kanit", fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
                            />
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <Form.Control
                              value={item.itemName}
                              onChange={(e) => handleReceiveDraftItemNameChange(item.id, e.target.value)}
                              placeholder="พิมพ์ชื่อสินค้า หรือเลือกจากปุ่มเพิ่มสินค้า"
                              style={{ fontFamily: "kanit", fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
                            />
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <Form.Control
                              value={item.unit}
                              onChange={(e) => updateReceiveDraftItem(item.id, { unit: e.target.value })}
                              placeholder="หน่วย"
                              style={{ fontFamily: "kanit", fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
                            />
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <Form.Control
                              value={item.qty}
                              onChange={(e) => handleReceiveDraftNumberChange(item.id, "qty", e.target.value)}
                              placeholder="1"
                              style={{ fontFamily: "kanit", fontSize: 12, textAlign: "center", borderRadius: 10, border: "1px solid #e5e7eb" }}
                            />
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <Form.Control
                              value={item.newCost}
                              onChange={(e) => handleReceiveDraftNumberChange(item.id, "newCost", e.target.value)}
                              placeholder="0.00"
                              style={{ fontFamily: "kanit", fontSize: 12, textAlign: "right", borderRadius: 10, border: "1px solid #e5e7eb" }}
                            />
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <Form.Control
                              value={item.lot}
                              onChange={(e) => updateReceiveDraftItem(item.id, { lot: e.target.value })}
                              placeholder="เลขที่ lot"
                              style={{ fontFamily: "kanit", fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
                            />
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <Form.Control
                              type="date"
                              value={item.dateExp}
                              onChange={(e) => updateReceiveDraftItem(item.id, { dateExp: e.target.value })}
                              style={{ fontFamily: "kanit", fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
                            />
                          </td>
                          <td style={{ fontFamily: "kanit_B", fontSize: 12, color: "#0f172a", textAlign: "right", padding: "10px 8px" }}>{formatDocumentCurrency(total)}</td>
                          <td style={{ padding: "10px 8px" }}>
                            <button
                              type="button"
                              onClick={() => removeReceiveDraftItem(item.id)}
                              style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid #fecaca", backgroundColor: "#fff1f2", color: "#dc2626", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                              title="ลบรายการ"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16 }}>
              <div style={{ borderRadius: 16, border: "1px solid #e5e7eb", backgroundColor: "white", padding: 18 }}>
                <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#0f172a", marginBottom: 8 }}>บันทึกแล้วได้อะไร</div>
                <div style={{ fontFamily: "kanit", fontSize: 12, color: "#64748b", lineHeight: 1.9 }}>
                  ระบบจะสร้างหัวเอกสารรับสินค้า บันทึกรายการสินค้าเข้าฝั่งรับสินค้า และอัปเดตยอดรวมในตารางใบรับสินค้าให้พร้อมใช้งานต่อกับใบกำกับภาษีซื้อ ใบเพิ่มหนี้ซื้อ และใบลดหนี้ซื้อ
                </div>
              </div>

              <div style={{ borderRadius: 16, border: "1px solid #e5e7eb", backgroundColor: "white", padding: 18 }}>
                <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#0f172a", marginBottom: 10 }}>สรุปรายการรับสินค้า</div>
                <div className="d-flex align-items-center justify-content-between" style={{ marginBottom: 8, gap: 8 }}>
                  <span style={{ fontFamily: "kanit", fontSize: 12, color: "#64748b" }}>จำนวนรายการ</span>
                  <span style={{ fontFamily: "kanit_B", fontSize: 12, color: "#0f172a" }}>{validReceiveDraftItems.length}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between" style={{ marginBottom: 8, gap: 8 }}>
                  <span style={{ fontFamily: "kanit", fontSize: 12, color: "#64748b" }}>จำนวนรวม</span>
                  <span style={{ fontFamily: "kanit_B", fontSize: 12, color: "#0f172a" }}>{formatDocumentQuantity(totalReceiveDraftQuantity)}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between" style={{ marginBottom: 8, gap: 8 }}>
                  <span style={{ fontFamily: "kanit", fontSize: 12, color: "#64748b" }}>ยอดรับรวม</span>
                  <span style={{ fontFamily: "kanit_B", fontSize: 13, color: "#0f172a" }}>{formatDocumentCurrency(totalReceiveDraftAmount)} บาท</span>
                </div>
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px dashed #d1d5db", fontFamily: "kanit", fontSize: 11, color: "#64748b", lineHeight: 1.7 }}>
                  หากมี lot หรือวันหมดอายุ สามารถกรอกได้ทันทีในแถวสินค้าเพื่อให้ข้อมูลรับสินค้าใช้งานต่อในระบบได้ครบถ้วน
                </div>
              </div>
            </div>

            {receiveDraftError ? (
              <div style={{ marginTop: 16, border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#b91c1c", borderRadius: 12, padding: "12px 14px", fontFamily: "kanit", fontSize: 12 }}>
                {receiveDraftError}
              </div>
            ) : null}
          </Modal_blrc.Body>

          <Modal_blrc.Footer style={{ borderTop: "1px solid #e5e7eb", padding: "12px 24px", background: "#fafbfc", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "kanit", fontSize: 12, color: "#64748b" }}>บันทึกเป็นใบรายการรับสินค้าแบบมาตรฐานของระบบ</div>
            <div className="d-flex align-items-center" style={{ gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: 88, height: 36, fontSize: 14, fontFamily: "Kanit" }}
                onClick={closeCreateReceiveModal}
                disabled={receiveDraftSaving}
              >
                ปิด
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ minWidth: 156, height: 36, fontSize: 14, fontFamily: "Kanit_B" }}
                onClick={() => { void saveReceiveDraft() }}
                disabled={receiveDraftSaving || !selectedReceiveSupplierId || validReceiveDraftItems.length === 0}
              >
                {receiveDraftSaving ? "กำลังบันทึก..." : "บันทึกใบรายการรับสินค้า"}
              </button>
            </div>
          </Modal_blrc.Footer>
        </Modal_blrc>
      )
    }


    //******** */ input Preview *********************
    function BillTemplate() {



      //Print Label
      const contentRef = useRef<HTMLDivElement>(null);
      const reactToPrintFn2 = useReactToPrint({
        contentRef,
        documentTitle: "แบบ ข.ย. ๙"


      });



      return (


        <>

          <Modal_blrc
            show={showrv}
            onHide={() => setShowrv(false)}
            size="xl"
            scrollable={true}
            //  fullscreen={true}
            //  dialogClassName="80w"
            aria-labelledby="example-custom-modal-styling-title"
          >
            <Modal_blrc.Header closeButton>
              <Modal_blrc.Title id="example-custom-modal-styling-title">
                <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>ใบรับสินค้า</div>
              </Modal_blrc.Title>
            </Modal_blrc.Header>
            <Modal_blrc.Body style={{ backgroundColor: "grey" }}>


              <div className="paper a4 col-12 print-wrapper" id="print-area" style={{ justifySelf: "center", backgroundColor: "white", marginLeft: 30, marginRight: 30, position: "relative" }} ref={contentRef} >

                <div className='' style={{ marginLeft: 5, marginRight: 5 }}>




                  <table className="table table-sm items ">

                    <thead >
                      <tr>
                        <td colSpan={8} style={{ border: "none", padding: 0 }}>
                          <div style={{ position: "relative", marginBottom: 10 }}>
                            <div style={{ position: "absolute", top: 0, right: 0, fontFamily: "kanit", fontSize: 12, border: "1px solid black", padding: "2px 10px" }}>{currentDocTypeLabel}</div>
                            <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 13, marginTop: 10 }}>บัญชีการซื้อยา</div>
                            <div style={{ textAlign: "center", fontFamily: "Kanit_B", fontSize: 15 }}>{storeS}</div>
                            <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 9 }}>(ชื่อสถานที่ขายยา)</div>
                          </div>
                        </td>
                      </tr>
                      <tr >
                        <td className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", height: 15, width: "3%" }}>ลำดับ</td>
                        <td className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", height: 15, width: "10%" }}>วันที่รับสินค้า</td>
                        <td className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", height: 15, width: "25%" }}>ชื่อผู้ขาย</td>
                        <td className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", height: 15, width: "30%" }}>ชื่อยา</td>
                        <td className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", height: 15, width: "7%" }}>เลขที่อักษรขแงครั้งที่ผลิต</td>
                        <td className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", height: 15, width: "5%" }}>จำนวน/ปริมาณ</td>
                        <td className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", height: 15, width: "10%" }}>ลงลายมือชื่อผู้มีหน้าที่ปฏิบัติการ</td>
                        <td className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", height: 15, width: "10%" }}>หมายเหตุ</td>

                      </tr>
                    </thead>
                    <tbody >
                      {postItem.map((a: any, index: number) =>
                        <tr key={a.id} >
                          <td style={{ fontFamily: "kanit", fontSize: 12, height: 25, textAlign: "center" }}>{index + 1}</td>
                          <td style={{ fontFamily: "kanit", fontSize: 12, height: 25 }}>
                            {new Date(a.dateRC).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                          </td>
                          <td style={{ fontFamily: "kanit", fontSize: 12, height: 25 }}>{vender}</td>
                          <td style={{ fontFamily: "kanit", fontSize: 12, height: 25 }}>{a.itemName}</td>
                          <td style={{ fontFamily: "kanit", fontSize: 12, height: 25, textAlign: "left" }}>{a.lot}</td>
                          <td style={{ fontFamily: "kanit", fontSize: 12, height: 25, textAlign: "center" }}>{a.qty}</td>
                          <td style={{ fontFamily: "kanit", fontSize: 12, height: 25, textAlign: "center" }}></td>
                          <td style={{ fontFamily: "kanit", fontSize: 12, height: 25, textAlign: "center" }}></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <style jsx>{`
                                                        
                                                       .paper.a4-landscape {
                                                          width: 297mm;
                                                          min-height: 210mm;
                                                          margin: auto;
                                                          background: white;
                                                          padding: 5mm;
                                                          box-shadow: 0 0 0.4rem rgba(0, 0, 0, 0.15);
                                                          box-sizing: border-box;
                                                        }
                                                        .doc-header {
                                                          display: flex;
                                                          justify-content: space-between;
                                                          margin-bottom: 12px;
                                                        }
                                                        table.items {
                                                          width: 100%;
                                                          border-collapse: collapse;
                                                          font-size: 12px;
                                                        }
                                                        table.items th 
                                                        
                                                        ,
                                                        table.items td {
                                                        
                                                          padding: 4px 4px ;
                                                          border-bottom: 1px solid #686868ff;
                                                        }
                                                        @media print {
                                                          @page {
                                                            size: A4 landscape;
                                                            margin: 10mm;
                                                            @bottom-right {
                                                              content: "หน้า " counter(page) " / " counter(pages);
                                                              font-family: kanit;
                                                              font-size: 10px;
                                                            }
                                                          }
                                                          .controls {
                                                            display: none;
                                                          }
                                                          thead {
                                                            display: table-header-group;
                                                            margin-top: 70px;
                                                          }
                                                          tr {
                                                            page-break-inside: avoid;
                                                          } .print-area {
                                                            width: 100%;
                                                            max-width: none;
                                                            box-shadow: none;
                                                            margin: 0;
                                                          }
                                                          thead {
                                                            display: table-header-group;
                                                          }
                                                          tr {
                                                            page-break-inside: avoid;
                                                          }
                                                          button {
                                                            display: none !important;
                                                          }
                                                          
                                                        }
                                                      `}</style>

              </div>





            </Modal_blrc.Body>
            <Modal_blrc.Footer>

              <button
                className="btn btn-primary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={reactToPrintFn2}>
                Print
              </button>

              <button
                className="btn btn-secondary"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={() => setShowrv(false)}>
                ปิด
              </button>

            </Modal_blrc.Footer>
          </Modal_blrc>

        </>

      )
    }

    //******* */ input Edit ************************


    return (

      <>
        <CreateReceiveModal />
        <div className="col">
          <div className='d-flex align-items-center justify-content-between mb-1 mt-1' style={{ gap: 12 }}>
            <div style={{ fontFamily: "kanit_B", fontSize: 18, color: "#1f2937" }}>ใบรับสินค้า</div>
            <button
              type="button"
              onClick={openCreateReceiveModal}
              style={{
                padding: "6px 16px",
                borderRadius: 10,
                border: "1.5px solid #2A6AAA",
                backgroundColor: "#F3F8FC",
                color: "#1E5088",
                fontSize: 13,
                fontFamily: "kanit_B",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 10px rgba(42, 106, 170,0.08)",
              }}
            >
              <Plus size={14} />
              สร้างใบรายการรับสินค้า
            </button>
          </div>
          <table className="table table-hover" style={{ borderCollapse: "separate", borderSpacing: "0" }}>
            <thead >
              <tr >
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>วันที่รับสินค้า</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>เลขที่เอกสาร</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px" }}>ชื่อบริษัท</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>จำนวน</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>ยอดรวมสุทธิ</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>สถานะ</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "center" }}>ผู้รับผิดชอบ</td>
                <td style={{ fontFamily: "kanit_B", fontSize: 11, backgroundColor: "#f8fafc", color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", width: 212, minWidth: 212, textAlign: "center" }}></td>

              </tr>
            </thead>
            <tbody >
              {rcmain.map((a: any) =>
                <tr key={a.id} >
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 30 }}>
                    {new Date(a.receive_date).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 30 }}>RC{a.orderfull}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 30 }}>{a.names}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 30, textAlign: "center" }}>{a.countorder}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 30, textAlign: "center" }}>{formatDocumentCurrency(a.totalRCAll)}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 30, textAlign: "center" }}>
                    <span style={{
                      padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: "kanit",
                      backgroundColor: a.statuss === "ยกเลิก" ? "#fee2e2" : "#D3F0E2",
                      color: a.statuss === "ยกเลิก" ? "#991b1b" : "#0C5238",
                    }}>{a.statuss === "" ? "ปกติ" : a.statuss === "ยกเลิก" ? "ยกเลิก" : "ปกติ"}</span>
                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, height: 30, textAlign: "center" }}>{a.persons}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 13, textAlign: "center", height: 40, width: 212, minWidth: 212, padding: "8px 12px" }}>
                    <div className='d-flex justify-content-center align-items-center' style={{ gap: 8, flexWrap: "nowrap", whiteSpace: "nowrap" }}>
                    <button
                      onClick={() => openReceiveEditor(a.id)}
                      title="แก้ไขใบรับสินค้า"
                      aria-label="แก้ไขใบรับสินค้า"
                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, padding: 0, borderRadius: 12, border: "1px solid #A6C8E7", backgroundColor: "#F3F8FC", color: "#1E5088", cursor: "pointer", transition: "all 0.2s ease", boxShadow: "0 1px 2px rgba(15,23,42,0.08)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#2A6AAA"; e.currentTarget.style.borderColor = "#2A6AAA"; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(42, 106, 170,0.22)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#F3F8FC"; e.currentTarget.style.borderColor = "#A6C8E7"; e.currentTarget.style.color = "#1E5088"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(15,23,42,0.08)" }}
                    >
                      <PencilLine size={16} />
                    </button>
                    <button
                      onClick={() => openPurchaseTaxInvoiceFromReceive(a.id)}
                      title="รายงานใบกำกับภาษีซื้อ"
                      aria-label="รายงานใบกำกับภาษีซื้อ"
                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, padding: 0, borderRadius: 12, border: "1px solid #fcd34d", backgroundColor: "#fff8eb", color: "#b45309", cursor: "pointer", transition: "all 0.2s ease", boxShadow: "0 1px 2px rgba(15,23,42,0.08)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#d97706"; e.currentTarget.style.borderColor = "#d97706"; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(217,119,6,0.22)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff8eb"; e.currentTarget.style.borderColor = "#fcd34d"; e.currentTarget.style.color = "#b45309"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(15,23,42,0.08)" }}
                    >
                      <CreditCard size={16} />
                    </button>
                    <button
                      onClick={() => openPurchaseDebitFromReceive(a.id)}
                      title={a.purchase_debit_status ? "แก้ไขใบเพิ่มหนี้ซื้อ" : "สร้างใบเพิ่มหนี้ซื้อ"}
                      aria-label={a.purchase_debit_status ? "แก้ไขใบเพิ่มหนี้ซื้อ" : "สร้างใบเพิ่มหนี้ซื้อ"}
                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, padding: 0, borderRadius: 12, border: `1px solid ${a.purchase_debit_status ? "#fdba74" : "#99f6e4"}`, backgroundColor: a.purchase_debit_status ? "#fff7ed" : "#EDF9F3", color: a.purchase_debit_status ? "#b45309" : "#0f766e", cursor: "pointer", transition: "all 0.2s ease", boxShadow: "0 1px 2px rgba(15,23,42,0.08)" }}
                      onMouseEnter={(e) => { const hoverColor = a.purchase_debit_status ? "#f59e0b" : "#0f766e"; e.currentTarget.style.backgroundColor = hoverColor; e.currentTarget.style.borderColor = hoverColor; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 12px ${hoverColor}33` }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = a.purchase_debit_status ? "#fff7ed" : "#EDF9F3"; e.currentTarget.style.borderColor = a.purchase_debit_status ? "#fdba74" : "#99f6e4"; e.currentTarget.style.color = a.purchase_debit_status ? "#b45309" : "#0f766e"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(15,23,42,0.08)" }}
                    >
                      <Landmark size={16} />
                    </button>
                    <button
                      onClick={() => openPurchaseCreditFromReceive(a.id)}
                      title={a.purchase_credit_status ? "แก้ไขใบลดหนี้ซื้อ" : "สร้างใบลดหนี้ซื้อ"}
                      aria-label={a.purchase_credit_status ? "แก้ไขใบลดหนี้ซื้อ" : "สร้างใบลดหนี้ซื้อ"}
                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, padding: 0, borderRadius: 12, border: `1px solid ${a.purchase_credit_status ? "#fdba74" : "#fed7aa"}`, backgroundColor: "#fff7ed", color: a.purchase_credit_status ? "#b45309" : "#c2410c", cursor: "pointer", transition: "all 0.2s ease", boxShadow: "0 1px 2px rgba(15,23,42,0.08)" }}
                      onMouseEnter={(e) => { const hoverColor = a.purchase_credit_status ? "#f59e0b" : "#ea580c"; e.currentTarget.style.backgroundColor = hoverColor; e.currentTarget.style.borderColor = hoverColor; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 12px ${hoverColor}33` }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff7ed"; e.currentTarget.style.borderColor = a.purchase_credit_status ? "#fdba74" : "#fed7aa"; e.currentTarget.style.color = a.purchase_credit_status ? "#b45309" : "#c2410c"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(15,23,42,0.08)" }}
                    >
                      <Wallet size={16} />
                    </button>
                    <BillTemplate />
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </>

    )
  }

  return (
    <div style={{ paddingLeft: 15, paddingRight: 15 }} className="" >

      <div className="row justify-content-start " >
        <HeadTab />
      </div>
      <div className="row justify-content-start " >

        <div className="col-sm-1" >
          <MenuTab_Small />
        </div>

        <div className="col-sm-11">
          <div className='col shadow-sm rounded border' style={{ backgroundColor: "white", height: "90vh", overflow: "hidden" }}>

            <div className='row' style={{ marginLeft: 0, height: "100%" }}>
              <Tab.Container id="left-tabs-example" activeKey={activeDocTab} onSelect={(k: any) => { setActiveDocTab(k || "first"); setStatusFilter("all"); setDocSearchTerm(""); setSelectedDocRow(null) }}>
                <Row style={{ height: "100%" }}>
                  {/* ============== PROFESSIONAL SIDEBAR ============== */}
                  <Col sm={3} lg={2} style={{ borderRight: "1px solid #e5e7eb", padding: 0, height: "90vh", overflowY: "auto", background: "linear-gradient(180deg, #fafbfc 0%, #f3f4f6 100%)" }}>
                    <Nav variant="pills" className="flex-column" style={{ padding: "0" }}>

                      {/* -- Sales Documents Header + Search -- */}
                      <div style={{ padding: "20px 16px 0 16px" }}>
                        <div className="d-flex align-items-center justify-content-between" style={{ marginBottom: 12 }}>
                          <div className="d-flex align-items-center" style={{ gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #2A6AAA, #3E86C7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <FileText size={16} color="white" />
                            </div>
                            <span style={{ fontFamily: "kanit_B", fontSize: 16, color: "#1f2937" }}>เอกสารขาย</span>
                          </div>
                        </div>

                        {/* Search Input */}
                        <div style={{ position: "relative", marginBottom: 12 }}>
                          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                          <input
                            type="text"
                            placeholder="ค้นหาเอกสาร, ลูกค้า..."
                            value={docSearchTerm}
                            onChange={(e) => setDocSearchTerm(e.target.value)}
                            style={{
                              width: "100%", padding: "8px 12px 8px 32px", borderRadius: 8,
                              border: "1px solid #e5e7eb", fontSize: 13, fontFamily: "kanit",
                              outline: "none", background: "white", transition: "all 0.2s",
                            }}
                            onFocus={(e) => { e.target.style.borderColor = "#3E86C7"; e.target.style.boxShadow = "0 0 0 3px rgba(62, 134, 199,0.1)" }}
                            onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none" }}
                          />
                        </div>
                      </div>

                      {/* -- Sales Document Type Cards -- */}
                      <div style={{ padding: "0 10px" }}>
                        {salesDocTypes.map((doc) => {
                          const counts = getStatusCounts(doc.prefix)
                          const isActive = activeDocTab === doc.key
                          const overdueCount = doc.prefix === "inv" ? getOverdueCount() : 0
                          return (
                            <Nav.Item key={doc.key} style={{ marginBottom: 2 }}>
                              <Nav.Link
                                eventKey={doc.key}
                                style={{
                                  fontFamily: "kanit", fontSize: 12, padding: "5px 10px",
                                  borderRadius: 8, border: "1px solid transparent",
                                  borderLeft: isActive ? "3px solid #147F56" : "3px solid transparent",
                                  backgroundColor: isActive ? "#EDF9F3" : "transparent",
                                  color: isActive ? "#173F6B" : "#4b5563",
                                  transition: "all 0.2s ease",
                                  position: "relative",
                                }}
                                onMouseEnter={(e: any) => { if (!isActive) { e.currentTarget.style.backgroundColor = "#f9fafb"; e.currentTarget.style.borderColor = "#e5e7eb" } }}
                                onMouseLeave={(e: any) => { if (!isActive) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "transparent" } }}
                              >
                                <div className="d-flex align-items-center" style={{ gap: 8 }}>
                                  <div style={{
                                    width: 24, height: 24, borderRadius: 7,
                                    background: isActive ? "linear-gradient(135deg, #147F56, #1F9D6B)" : "#f3f4f6",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.2s",
                                    flexShrink: 0,
                                  }}>
                                    {React.cloneElement(getDocIcon(doc.icon, 14), { color: isActive ? "white" : "#6b7280" })}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="d-flex align-items-center justify-content-between">
                                      <span style={{ fontFamily: isActive ? "kanit_B" : "kanit", fontSize: 12 }}>{doc.label}</span>
                                      {overdueCount > 0 && (
                                        <span style={{
                                          backgroundColor: "#ef4444", color: "white", borderRadius: 10,
                                          padding: "1px 6px", fontSize: 9, fontFamily: "kanit_B",
                                          display: "flex", alignItems: "center", gap: 3,
                                          boxShadow: "0 2px 4px rgba(239,68,68,0.3)",
                                        }}>
                                          <AlertCircle size={9} /> {overdueCount}
                                        </span>
                                      )}
                                    </div>
                                    {/* Status flow mini-badges */}
                                    {doc.prefix && counts.total > 0 && (
                                      <div className="d-flex" style={{ gap: 4, marginTop: 2 }}>
                                        {counts.pending > 0 && (
                                          <span style={{
                                            fontSize: 9, fontFamily: "kanit", padding: "0px 6px",
                                            borderRadius: 10, backgroundColor: "#fef3c7", color: "#92400e",
                                            display: "inline-flex", alignItems: "center", gap: 3,
                                          }}>
                                            <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#f59e0b", display: "inline-block" }}></span>
                                            {counts.pending}
                                          </span>
                                        )}
                                        {counts.approved > 0 && (
                                          <span style={{
                                            fontSize: 9, fontFamily: "kanit", padding: "0px 6px",
                                            borderRadius: 10, backgroundColor: "#E5EEF8", color: "#173F6B",
                                            display: "inline-flex", alignItems: "center", gap: 3,
                                          }}>
                                            <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#3E86C7", display: "inline-block" }}></span>
                                            {counts.approved}
                                          </span>
                                        )}
                                        {counts.cancelled > 0 && (
                                          <span style={{
                                            fontSize: 9, fontFamily: "kanit", padding: "0px 6px",
                                            borderRadius: 10, backgroundColor: "#fee2e2", color: "#991b1b",
                                            display: "inline-flex", alignItems: "center", gap: 3,
                                          }}>
                                            <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#ef4444", display: "inline-block" }}></span>
                                            {counts.cancelled}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <ChevronRight size={12} style={{ color: isActive ? "#2A6AAA" : "#d1d5db", flexShrink: 0 }} />
                                </div>
                              </Nav.Link>
                            </Nav.Item>
                          )
                        })}
                      </div>

                      {/* -- Purchase Documents Section -- */}
                      <div style={{ padding: "0 16px" }}>
                        <div className="d-flex align-items-center" style={{ gap: 8, marginTop: 12, marginBottom: 6 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #2A6AAA, #3E86C7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Package size={14} color="white" />
                          </div>
                          <span style={{ fontFamily: "kanit_B", fontSize: 14, color: "#1f2937" }}>เอกสารซื้อ</span>
                        </div>
                      </div>
                      <div style={{ padding: "0 10px" }}>
                        {purchaseDocTypes.map((doc) => {
                          const isActive = activeDocTab === doc.key
                          return (
                            <Nav.Item key={doc.key} style={{ marginBottom: 2 }}>
                              <Nav.Link
                                eventKey={doc.key}
                                style={{
                                  fontFamily: "kanit", fontSize: 12, padding: "5px 10px",
                                  borderRadius: 8, border: "1px solid transparent",
                                  borderLeft: isActive ? "3px solid #2A6AAA" : "3px solid transparent",
                                  backgroundColor: isActive ? "#F3F8FC" : "transparent",
                                  color: isActive ? "#173F6B" : "#4b5563",
                                  transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e: any) => { if (!isActive) { e.currentTarget.style.backgroundColor = "#f9fafb"; e.currentTarget.style.borderColor = "#e5e7eb" } }}
                                onMouseLeave={(e: any) => { if (!isActive) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "transparent" } }}
                              >
                                <div className="d-flex align-items-center" style={{ gap: 8 }}>
                                  <div style={{
                                    width: 24, height: 24, borderRadius: 7,
                                    background: isActive ? "linear-gradient(135deg, #2A6AAA, #3E86C7)" : "#f3f4f6",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.2s",
                                    flexShrink: 0,
                                  }}>
                                    {React.cloneElement(getDocIcon(doc.icon, 14), { color: isActive ? "white" : "#6b7280" })}
                                  </div>
                                  <span style={{ fontFamily: isActive ? "kanit_B" : "kanit", fontSize: 12, flex: 1 }}>{doc.label}</span>
                                  <ChevronRight size={12} style={{ color: isActive ? "#2A6AAA" : "#d1d5db", flexShrink: 0 }} />
                                </div>
                              </Nav.Link>
                            </Nav.Item>
                          )
                        })}
                      </div>

                      {/* -- Other Documents Section -- */}
                      <div style={{ padding: "0 16px" }}>
                        <div className="d-flex align-items-center" style={{ gap: 8, marginTop: 12, marginBottom: 6 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #7c3aed, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FileSpreadsheet size={14} color="white" />
                          </div>
                          <span style={{ fontFamily: "kanit_B", fontSize: 14, color: "#1f2937" }}>เอกสารอื่นๆ</span>
                        </div>
                      </div>
                      <div style={{ padding: "0 10px", marginBottom: 20 }}>
                        <Nav.Item style={{ marginBottom: 2 }}>
                          <Nav.Link
                            onClick={() => window.open('/documents/pp30.pdf', '_blank')}
                            style={{
                              fontFamily: "kanit", fontSize: 12, padding: "5px 10px",
                              borderRadius: 8, cursor: "pointer",
                              border: "1px solid transparent",
                              borderLeft: "3px solid transparent",
                              backgroundColor: "transparent",
                              color: "#4b5563",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e: any) => { e.currentTarget.style.backgroundColor = "#f9fafb"; e.currentTarget.style.borderColor = "#e5e7eb" }}
                            onMouseLeave={(e: any) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "transparent" }}
                          >
                            <div className="d-flex align-items-center" style={{ gap: 8 }}>
                              <div style={{ width: 24, height: 24, borderRadius: 7, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <FileSpreadsheet size={14} color="#6b7280" />
                              </div>
                              <span style={{ fontFamily: "kanit", fontSize: 12, flex: 1 }}>ภ.พ.30</span>
                              <ChevronRight size={12} style={{ color: "#d1d5db", flexShrink: 0 }} />
                            </div>
                          </Nav.Link>
                        </Nav.Item>
                      </div>

                    </Nav>
                  </Col>
                  {/* ============== END SIDEBAR ============== */}

                  <Col sm={9} lg={10} style={{ height: "90vh", overflowY: "auto", padding: "0 20px" }}>
                    {/* Status Filter Bar */}
                    {activeDocTab !== "salestax" && activeDocTab !== "six" && activeDocTab !== "seven" && activeDocTab !== "purchasetax" && activeDocTab !== "purchasedebit" && activeDocTab !== "purchasecredit" && (
                      <div className="d-flex align-items-center" style={{ gap: 8, padding: "16px 0 8px 0", borderBottom: "1px solid #f3f4f6", marginBottom: 8, flexWrap: "wrap" }}>
                        {[
                          { key: "all", label: "ทั้งหมด", color: "#6b7280", bg: "#f3f4f6", activeBg: "#374151", activeColor: "#fff" },
                          { key: "รออนุมัติ", label: "รออนุมัติ", color: "#92400e", bg: "#fef3c7", activeBg: "#f59e0b", activeColor: "#fff" },
                          { key: "อนุมัติ", label: "อนุมัติ", color: "#0C5238", bg: "#D3F0E2", activeBg: "#1F9D6B", activeColor: "#fff" },
                          { key: "ยกเลิก", label: "ยกเลิก", color: "#991b1b", bg: "#fee2e2", activeBg: "#ef4444", activeColor: "#fff" },
                        ].map((s) => (
                          <button
                            key={s.key}
                            onClick={() => setStatusFilter(s.key)}
                            style={{
                              padding: "5px 16px", borderRadius: 20, fontSize: 12, fontFamily: "kanit_B",
                              border: statusFilter === s.key ? "none" : `1px solid ${s.bg}`,
                              backgroundColor: statusFilter === s.key ? s.activeBg : s.bg,
                              color: statusFilter === s.key ? s.activeColor : s.color,
                              cursor: "pointer", transition: "all 0.2s",
                              boxShadow: statusFilter === s.key ? `0 2px 8px ${s.activeBg}40` : "none",
                            }}
                          >
                            {s.label}
                            {s.key !== "all" && (() => {
                              const prefix = salesDocTypes.find(d => d.key === activeDocTab)?.prefix || ""
                              if (!prefix) return null
                              const counts = getStatusCounts(prefix)
                              const num = s.key === "รออนุมัติ" ? counts.pending : s.key === "อนุมัติ" ? counts.approved : counts.cancelled
                              return num > 0 ? <span style={{ marginLeft: 4 }}>({num})</span> : null
                            })()}
                          </button>
                        ))}
                        <div style={{ flex: 1 }}></div>
                        <div style={{ position: "relative" }}>
                          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                          <input
                            type="text"
                            placeholder="ค้นหาในรายการ..."
                            value={docSearchTerm}
                            onChange={(e) => setDocSearchTerm(e.target.value)}
                            style={{
                              padding: "6px 12px 6px 30px", borderRadius: 20, border: "1px solid #e5e7eb",
                              fontSize: 12, fontFamily: "kanit", outline: "none", width: 180,
                              transition: "all 0.2s",
                            }}
                            onFocus={(e) => { e.target.style.borderColor = "#3E86C7"; e.target.style.boxShadow = "0 0 0 3px rgba(62, 134, 199,0.08)" }}
                            onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none" }}
                          />
                        </div>
                      </div>
                    )}

                    {/* === Document Workflow Stepper === */}
                    {showWorkflowStepper && (
                      <div style={{ position: "sticky", top: 0, zIndex: 7, padding: "8px 0", marginBottom: 8, background: "linear-gradient(180deg, #ffffff 0%, rgba(248,250,252,0.96) 100%)", backdropFilter: "blur(8px)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 0, background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "12px 32px", boxShadow: "0 4px 14px rgba(15,23,42,0.06)" }}>
                        {[
                          { label: "ใบเสนอราคา", code: "QT", status: selectedDocRow?.qt_status, docNo: selectedDocRow?.qt_orderfull, openModal: () => { if (!selectedDocRow) return; setids(selectedDocRow.id); setidcus(selectedDocRow.id_costomer); localStorage.setItem("iddoc", selectedDocRow.id); setShowE(true) } },
                          { label: "ใบวางบิล", code: "BL", status: selectedDocRow?.bl_status, docNo: selectedDocRow?.bl_orderfull, openModal: () => { if (!selectedDocRow) return; maxV(); setids(selectedDocRow.id); setidcus(selectedDocRow.id_costomer); localStorage.setItem("iddoc", selectedDocRow.id); setShowbe(true) } },
                          { label: "ใบแจ้งหนี้", code: "INV", status: selectedDocRow?.inv_status, docNo: selectedDocRow?.inv_orderfull, openModal: () => { if (!selectedDocRow) return; maxV2(); setids(selectedDocRow.id); setidcus(selectedDocRow.id_costomer); localStorage.setItem("iddoc", selectedDocRow.id); setShowie(true) } },
                          { label: "ใบเสร็จรับเงิน", code: "RE", status: selectedDocRow?.re_status, docNo: selectedDocRow?.re_orderfull, openModal: () => { if (!selectedDocRow) return; maxV3(); setids(selectedDocRow.id); setidcus(selectedDocRow.id_costomer); localStorage.setItem("iddoc", selectedDocRow.id); setShowee(true) } },
                          { label: "ใบกำกับภาษี", code: "TAX", status: selectedDocRow?.tax_status, docNo: selectedDocRow?.tax_orderfull, openModal: () => { if (!selectedDocRow) return; maxV4(); setids(selectedDocRow.id); setidcus(selectedDocRow.id_costomer); localStorage.setItem("iddoc", selectedDocRow.id); setShowte(true) } },
                          { label: "ใบเพิ่มหนี้", code: "DN", status: selectedDocRow?.debit_status, docNo: selectedDocRow?.debit_orderfull, openModal: () => { if (!selectedDocRow) return; maxV5(); setids(selectedDocRow.id); setidcus(selectedDocRow.id_costomer); localStorage.setItem("iddoc", selectedDocRow.id); setShowde(true) } },
                          { label: "ใบลดหนี้", code: "CN", status: selectedDocRow?.credit_status, docNo: selectedDocRow?.credit_orderfull, openModal: () => { if (!selectedDocRow) return; maxV6(); setids(selectedDocRow.id); setidcus(selectedDocRow.id_costomer); localStorage.setItem("iddoc", selectedDocRow.id); setShowce(true) } },
                        ].map((step, i, arr) => {
                          const isDone = step.status === "อนุมัติ"
                          const isPending = step.status === "รออนุมัติ"
                          const isCancelled = step.status === "ยกเลิก"
                          const hasStatus = !!step.status
                          const activeStepCode = salesDocTypes.find((d) => d.key === activeDocTab)?.docPrefix || ""
                          const isActiveStep = !selectedDocRow && step.code === activeStepCode
                          return (
                            <React.Fragment key={step.code}>
                              <div
                                onClick={() => { if (hasStatus) step.openModal() }}
                                style={{
                                  display: "flex", flexDirection: "column", alignItems: "center", minWidth: 90,
                                  cursor: hasStatus ? "pointer" : "default",
                                  padding: "4px 8px", borderRadius: 8,
                                  transition: "background-color 0.15s",
                                }}
                                onMouseEnter={(e) => { if (hasStatus) e.currentTarget.style.backgroundColor = "#F3F8FC" }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                              >
                                <div style={{
                                  width: 26, height: 26, borderRadius: "50%",
                                  border: `2px solid ${isDone ? "#147F56" : isPending ? "#d97706" : isCancelled ? "#dc2626" : isActiveStep ? "#2A6AAA" : "#d1d5db"}`,
                                  backgroundColor: isDone ? "#147F56" : isPending ? "#fef3c7" : isCancelled ? "#fee2e2" : isActiveStep ? "#F3F8FC" : "white",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                  {isDone ? (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                  ) : isCancelled ? (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                  ) : isPending ? (
                                    <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#d97706" }}></div>
                                  ) : (
                                    <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: isActiveStep ? "#2A6AAA" : "#d1d5db" }}></div>
                                  )}
                                </div>
                                <div style={{
                                  marginTop: 4, fontSize: 10, fontFamily: isDone || isPending ? "kanit_B" : "kanit",
                                  color: isDone ? "#147F56" : isPending ? "#d97706" : isCancelled ? "#dc2626" : isActiveStep ? "#2A6AAA" : "#9ca3af",
                                  textAlign: "center",
                                  textDecoration: hasStatus ? "underline" : "none",
                                }}>
                                  {step.label}
                                </div>
                                <div style={{ fontSize: 8, fontFamily: "kanit", color: isDone ? "#147F56" : isPending ? "#d97706" : isCancelled ? "#dc2626" : isActiveStep ? "#2A6AAA" : "#d1d5db" }}>
                                  {step.docNo || step.code}
                                </div>
                              </div>
                              {i < arr.length - 1 && (
                                <div style={{
                                  flex: 1, height: 2, marginTop: -16, minWidth: 20,
                                  background: (arr[i + 1]?.status) ?
                                    `linear-gradient(90deg, ${isDone ? "#147F56" : isPending ? "#d97706" : "#d1d5db"}, ${arr[i + 1].status === "อนุมัติ" ? "#147F56" : arr[i + 1].status === "รออนุมัติ" ? "#d97706" : "#dc2626"})` :
                                    `repeating-linear-gradient(90deg, #d1d5db 0px, #d1d5db 4px, transparent 4px, transparent 8px)`,
                                }}></div>
                              )}
                            </React.Fragment>
                          )
                        })}
                        {selectedDocRow ? (
                          <button
                            onClick={() => setSelectedDocRow(null)}
                            style={{ marginLeft: 12, background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16, padding: "2px 6px", borderRadius: 6 }}
                            title="ปิด"
                          >✕</button>
                        ) : (
                          <div style={{ marginLeft: 12, fontSize: 11, fontFamily: "kanit", color: "#94a3b8", whiteSpace: "nowrap" }}>
                            Flow จะแสดงค้างไว้ด้านบนตลอด
                          </div>
                        )}
                        </div>
                      </div>
                    )}

                    <Tab.Content>

                      <Tab.Pane eventKey="first" ><Quatation /></Tab.Pane>
                      <Tab.Pane eventKey="second"><Bill /></Tab.Pane>
                      <Tab.Pane eventKey="delivery"><DeliveryNoteList /></Tab.Pane>
                      <Tab.Pane eventKey="three"><Invoice /></Tab.Pane>
                      <Tab.Pane eventKey="four"><Receipt /></Tab.Pane>
                      <Tab.Pane eventKey="five"><Tax /></Tab.Pane>
                      <Tab.Pane eventKey="debit"><DebitNote /></Tab.Pane>
                      <Tab.Pane eventKey="credit"><CreditNote /></Tab.Pane>
                      <Tab.Pane eventKey="salestax"><SalesTaxReport /></Tab.Pane>
                      <Tab.Pane eventKey="six"><Order /></Tab.Pane>
                      <Tab.Pane eventKey="seven"><Receive /></Tab.Pane>
                      <Tab.Pane eventKey="purchasetax"><PurchaseTaxReport /></Tab.Pane>
                      <Tab.Pane eventKey="purchasedebit"><PurchaseDebitNote openReceiveId={purchaseDebitOpenReceiveId} onOpenReceiveHandled={() => setPurchaseDebitOpenReceiveId(null)} onUpdated={GetMainRC} /></Tab.Pane>
                      <Tab.Pane eventKey="purchasecredit"><PurchaseCreditNote openReceiveId={purchaseCreditOpenReceiveId} onOpenReceiveHandled={() => setPurchaseCreditOpenReceiveId(null)} onUpdated={GetMainRC} /></Tab.Pane>
                    </Tab.Content>
                    <PurchaseTaxInvoiceReportModal openReceiveId={purchaseTaxInvoiceOpenReceiveId} onClose={() => setPurchaseTaxInvoiceOpenReceiveId(null)} />
                  </Col>
                </Row>
              </Tab.Container>
            </div>
          </div>
        </div>
      </div>

    </div>
  )

}
function DocPageWrapper() {
  return <PermissionGuard codename="K1"><DocPage /></PermissionGuard>
}
export default DocPageWrapper

