'use client'

import React, { useState, useEffect, Suspense, createContext, useMemo, useDeferredValue, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import MenuTab_Small from "../componant/menutab_small.tsx"
import HeadTab from "../componant/headtab.jsx"
import styles from "../componant/mystyle.module.css";
import PermissionGuard from '@/components/PermissionGuard'
import { Table } from 'react-bootstrap';
import Modal_blrc from 'react-bootstrap/Modal';
import Link from "next/link";
import CreateMainOrder from './createorder.tsx'
import Loading from "./loading.tsx";
import axios from 'axios'
import UpdateMainRC from './updateRC.tsx'
import { enableFullscreen } from "@/lib/fullscreen";
import { Package, Search, Plus, Calendar, DollarSign, ArrowDownToLine, Scissors, Printer } from "lucide-react";
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import CutLotModal from '@/components/CutLotModal';
import { useReactToPrint } from "react-to-print";

const apis = "receive"
const apidataitem = "dataitemlist"
import { useMessageStore } from "./useMessageStore";

const IDContext_Rec = createContext<any>(undefined)

function ReceivePage() {

  const BodyCat = () => {
    const searchParams = useSearchParams()
    const requestedReceiveId = searchParams.get('receiveId')
    const appliedReceiveIdRef = useRef<string | null>(null)
    const setmaxRec = useMessageStore((state) => state.setmaxRec);
    const setidcus = useMessageStore((state) => state.setidcus);
    const setcodes = useMessageStore((state) => state.setcodes);
    const setcompanys = useMessageStore((state) => state.setcompanys);
    const setrcnumber = useMessageStore((state) => state.setrcnumber);

    const [idc, setidss] = useState({ idcus: "", maxRec: "", codes: "", companys: "", rcnumber: "" })
    const [chanhepage, setchanhepage] = useState(2)
    const setcpage = useMessageStore((state) => state.setcpage);
    const cpage = useMessageStore((state) => state.cpage)
    const [decimalPlaces] = useState(() => typeof window !== 'undefined' ? Number(localStorage.getItem('decimalPlaces') ?? 2) : 2)
    const [posts, setPosts] = useState([])
    const [postItem, setPostItem] = useState([])
    const [searchname, setsearchname] = useState('')
    const deferredSearch = useDeferredValue(searchname)
    const [filterPendingConfirm, setFilterPendingConfirm] = useState(false)
    const [filterUnpaid, setFilterUnpaid] = useState(false)
    const [supplierFilter, setSupplierFilter] = useState('')
    const [selectedDocType, setSelectedDocType] = useState<Record<number, string>>({})
    const docTypeOptions = [
      { value: "ข.ย.9", label: "ข.ย.9" },
      { value: "ข.ย.10", label: "ข.ย.10" },
      { value: "ข.ย.11", label: "ข.ย.11" },
      { value: "ข.ย.12", label: "ข.ย.12" },
      { value: "ข.ย.13", label: "ข.ย.13" },
    ]

    // === ประเภทเอกสาร print modal state ===
    const [showDocModal, setShowDocModal] = useState(false)
    const [docPostItem, setDocPostItem] = useState([])
    const [docVender, setDocVender] = useState("")
    const [currentDocTypeLabel, setCurrentDocTypeLabel] = useState("แบบ ข.ย. ๙")
    const [storeS, setStoreS] = useState("")

    const toThaiNumeral = (num: string): string => {
      const thaiNumerals: { [key: string]: string } = {
        '0': '๐', '1': '๑', '2': '๒', '3': '๓', '4': '๔',
        '5': '๕', '6': '๖', '7': '๗', '8': '๘', '9': '๙'
      }
      return num.replace(/[0-9]/g, (d) => thaiNumerals[d] || d)
    }

    const toThaiDocType = (docType: string): string => {
      const match = docType.match(/(\d+)$/)
      if (match) {
        const thaiNumber = toThaiNumeral(match[1])
        return `แบบ ข.ย. ${thaiNumber}`
      }
      return "แบบ ข.ย. ๙"
    }

    const fetchStoreInfo = async () => {
      const companyS = localStorage.getItem("company_") || ""
      try {
        const res = await axios.get(`/api/setting/store/store?company=${companyS}`)
        if (res.data[0]) setStoreS(res.data[0].namestore)
      } catch (error) {
        console.error(error)
      }
    }

    const GetDetailRC = async (orderfull: string, docType: string = "") => {
      const companyS = localStorage.getItem("company_") || ""
      try {
        const res = await axios.get(`/api/${apidataitem}?company=${companyS}&codenames=${orderfull}&docType=${encodeURIComponent(docType)}`)
        setDocPostItem(res.data)
      } catch (error) {
        console.error(error)
      }
    }

    // === รับโอน state ===
    const [showTransferModal, setShowTransferModal] = useState(false)
    const [showCutLotModal, setShowCutLotModal] = useState(false)
    const [pendingTransfers, setPendingTransfers] = useState<any[]>([])
    const [transferLoading, setTransferLoading] = useState(false)
    const [expandedTransferId, setExpandedTransferId] = useState<number | null>(null)
    const [editingItemId, setEditingItemId] = useState<number | null>(null)
    const [editQty, setEditQty] = useState<string>('')
    const [confirmingItemId, setConfirmingItemId] = useState<number | null>(null)
    const [currentUserId, setCurrentUserId] = useState<number | null>(null)
    const [receiverName, setReceiverName] = useState<string>('')
    const [pendingCount, setPendingCount] = useState(0)
    const [showHistoryView, setShowHistoryView] = useState(false)
    const [transferHistory, setTransferHistory] = useState<any[]>([])
    const [historyLoading, setHistoryLoading] = useState(false)
    const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null)

    const fetchPendingTransfers = async (userId?: number) => {
      const uid = userId || currentUserId
      if (!uid) return
      setTransferLoading(true)
      try {
        const res = await axios.get(`/api/stocktransfer/pending-receive?userId=${uid}`)
        setPendingTransfers(res.data || [])
        setPendingCount(res.data?.length || 0)
      } catch (err) {
        console.error('Failed to fetch pending transfers:', err)
      } finally {
        setTransferLoading(false)
      }
    }

    const fetchTransferHistory = async (userId?: number) => {
      const uid = userId || currentUserId
      if (!uid) return
      setHistoryLoading(true)
      try {
        const res = await axios.get(`/api/stocktransfer/pending-receive?userId=${uid}&status=history`)
        setTransferHistory(res.data || [])
      } catch (err) {
        console.error('Failed to fetch transfer history:', err)
      } finally {
        setHistoryLoading(false)
      }
    }

    const confirmItem = async (transferItemId: number, action: 'confirm' | 'confirm_edit', qty?: number) => {
      if (!currentUserId) return
      setConfirmingItemId(transferItemId)
      try {
        const res = await axios.post('/api/stocktransfer/pending-receive', {
          action,
          transferItemId,
          confirmedQty: qty,
          receiverCompanyId: currentUserId,
          receiverPerson: receiverName
        })
        toast.success(<div style={{ fontFamily: 'Kanit' }}>{res.data.message}</div>)
        setEditingItemId(null)
        fetchPendingTransfers()
        setcpage(String(Date.now()))
      } catch (err: any) {
        toast.error(<div style={{ fontFamily: 'Kanit' }}>{err.response?.data?.error || 'ยืนยันไม่สำเร็จ'}</div>)
      } finally {
        setConfirmingItemId(null)
      }
    }

    // พิมพ์ใบรับโอนสินค้า A4
    const printReceiveDocument = (transfer: any) => {
      const totalItems = transfer.items?.length || 0;
      const pendingItems = transfer.items?.filter((i: any) => i.itemStatus === 'pending') || [];
      const confirmedItems = transfer.items?.filter((i: any) => i.itemStatus === 'confirmed') || [];
      const totalQty = transfer.items?.reduce((sum: number, item: any) => sum + (item.qty || 0), 0) || 0;
      const confirmedQty = confirmedItems.reduce((sum: number, item: any) => sum + (item.confirmedQty || item.qty || 0), 0);
      const totalCost = transfer.items?.reduce((sum: number, item: any) => sum + ((item.qty || 0) * (item.cost || 0)), 0) || 0;
      const createdDate = new Date(transfer.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
      const completedDate = transfer.completedAt ? new Date(transfer.completedAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

      const overallStatus = confirmedItems.length === totalItems ? "รับครบแล้ว" : confirmedItems.length > 0 ? `รับแล้ว ${confirmedItems.length}/${totalItems}` : "รอรับทั้งหมด";
      const overallStatusColor = confirmedItems.length === totalItems ? "#147F56" : confirmedItems.length > 0 ? "#f59e0b" : "#dc2626";
      const overallStatusBg = confirmedItems.length === totalItems ? "#D3F0E2" : confirmedItems.length > 0 ? "#fef3c7" : "#fee2e2";

      const ITEMS_PER_PAGE = 18;
      const pages: any[][] = [];
      const itemsCopy = [...(transfer.items || [])];
      while (itemsCopy.length > 0) {
        pages.push(itemsCopy.splice(0, ITEMS_PER_PAGE));
      }
      if (pages.length === 0) pages.push([]);

      const statusIcon = (status: string) => {
        if (status === 'confirmed') return '<span style="color:#2A6AAA;font-size:14px;">✅</span>';
        if (status === 'returned') return '<span style="color:#dc2626;font-size:14px;">🔄</span>';
        return '<span style="color:#f59e0b;font-size:14px;">⏳</span>';
      };
      const statusText = (status: string) => {
        if (status === 'confirmed') return '<span style="color:#2A6AAA;font-weight:600;font-size:10px;background:#E5EEF8;padding:1px 6px;border-radius:8px;">รับแล้ว</span>';
        if (status === 'returned') return '<span style="color:#dc2626;font-weight:600;font-size:10px;background:#fee2e2;padding:1px 6px;border-radius:8px;">คืน</span>';
        return '<span style="color:#d97706;font-weight:600;font-size:10px;background:#fef3c7;padding:1px 6px;border-radius:8px;">รอรับ</span>';
      };

      const generatePage = (pageItems: any[], pageNum: number, totalPages: number) => {
        const rows = pageItems.map((item: any, idx: number) => {
          const rowBg = item.itemStatus === 'confirmed' ? '#EDF9F3' : item.itemStatus === 'returned' ? '#fef2f2' : (((pageNum - 1) * ITEMS_PER_PAGE + idx) % 2 === 0 ? '#fff' : '#fafafa');
          return `
            <tr style="background:${rowBg};">
              <td style="text-align:center;padding:5px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#64748b;">${(pageNum - 1) * ITEMS_PER_PAGE + idx + 1}</td>
              <td style="text-align:center;padding:5px 4px;border-bottom:1px solid #e5e7eb;">${statusIcon(item.itemStatus)}</td>
              <td style="padding:5px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#1E5088;font-weight:500;">${item.itemcode || "-"}</td>
              <td style="padding:5px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;">${item.itemName || "-"}${item.barcode ? '<div style="font-size:9px;color:#94a3b8;">BC: ' + item.barcode + '</div>' : ''}</td>
              <td style="padding:5px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#64748b;">${item.lot || "-"}</td>
              <td style="text-align:center;padding:5px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#64748b;">${item.dateExp ? new Date(item.dateExp).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "-"}</td>
              <td style="text-align:center;padding:5px 6px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:600;">${item.qty || 0}</td>
              <td style="text-align:center;padding:5px 6px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:600;color:${item.itemStatus === 'confirmed' ? '#147F56' : '#94a3b8'};">${item.confirmedQty != null ? item.confirmedQty : "-"}</td>
              <td style="text-align:right;padding:5px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;">${item.cost ? Number(item.cost).toLocaleString("th-TH", { minimumFractionDigits: 2 }) : "-"}</td>
              <td style="text-align:center;padding:5px 6px;border-bottom:1px solid #e5e7eb;">${statusText(item.itemStatus)}</td>
            </tr>
          `;
        }).join("");

        const emptyRows = Array(Math.max(0, ITEMS_PER_PAGE - pageItems.length)).fill("").map(() =>
          '<tr><td style="padding:5px 6px;border-bottom:1px solid #f1f5f9;" colspan="10">&nbsp;</td></tr>'
        ).join("");

        return `
          <div class="page">
            <!-- Header -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;padding-bottom:12px;border-bottom:3px solid #f59e0b;">
              <div>
                <h1 style="margin:0;font-size:20px;color:#92400e;font-weight:800;letter-spacing:0.5px;">📥 ใบรับโอนสินค้าระหว่างสาขา</h1>
                <div style="font-size:11px;color:#64748b;margin-top:2px;">Stock Transfer Receiving Document</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:16px;font-weight:700;color:#0f172a;letter-spacing:1px;">${transfer.transferNo || "#" + transfer.id}</div>
                <div style="font-size:10px;color:#94a3b8;margin-top:2px;">หน้า ${pageNum}/${totalPages}</div>
                <div style="display:inline-block;margin-top:4px;padding:2px 10px;border-radius:12px;font-size:10px;font-weight:600;background:${overallStatusBg};color:${overallStatusColor};">${overallStatus}</div>
              </div>
            </div>

            <!-- Info Grid -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
              <div style="border:1px solid #fde68a;border-radius:8px;padding:10px 14px;background:#fffbeb;">
                <div style="font-size:10px;color:#92400e;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">📤 สาขาผู้ส่ง (From)</div>
                <div style="font-size:14px;font-weight:700;color:#0f172a;">${transfer.fromBranchName || "Remote"}</div>
                <div style="font-size:11px;color:#64748b;margin-top:2px;">${transfer.fromEmail || ""}</div>
              </div>
              <div style="border:1px solid #CCDFF1;border-radius:8px;padding:10px 14px;background:#F3F8FC;">
                <div style="font-size:10px;color:#173F6B;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">📥 สาขาผู้รับ (To)</div>
                <div style="font-size:14px;font-weight:700;color:#0f172a;">${transfer.toBranchName || "-"}</div>
                <div style="font-size:11px;color:#64748b;margin-top:2px;">${transfer.toEmail || ""}</div>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:14px;">
              <div style="background:#f8fafc;border-radius:8px;padding:7px 10px;">
                <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">ผู้โอน</div>
                <div style="font-size:11px;font-weight:600;color:#0f172a;">${transfer.person || "-"}</div>
              </div>
              <div style="background:#f8fafc;border-radius:8px;padding:7px 10px;">
                <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">วันที่โอน</div>
                <div style="font-size:11px;font-weight:600;color:#0f172a;">${createdDate}</div>
              </div>
              <div style="background:#f8fafc;border-radius:8px;padding:7px 10px;">
                <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">วันที่รับ</div>
                <div style="font-size:11px;font-weight:600;color:#0f172a;">${completedDate}</div>
              </div>
              <div style="background:${overallStatusBg};border-radius:8px;padding:7px 10px;">
                <div style="font-size:9px;color:${overallStatusColor};text-transform:uppercase;">สถานะการรับ</div>
                <div style="font-size:11px;font-weight:700;color:${overallStatusColor};">${overallStatus}</div>
              </div>
            </div>

            <!-- Items Table -->
            <table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
              <thead>
                <tr style="background:#fef3c7;">
                  <th style="text-align:center;padding:7px 4px;font-size:9px;color:#92400e;font-weight:700;border-bottom:2px solid #fde68a;width:28px;">#</th>
                  <th style="text-align:center;padding:7px 4px;font-size:9px;color:#92400e;font-weight:700;border-bottom:2px solid #fde68a;width:28px;"></th>
                  <th style="padding:7px 4px;font-size:9px;color:#92400e;font-weight:700;border-bottom:2px solid #fde68a;width:60px;">รหัส</th>
                  <th style="padding:7px 4px;font-size:9px;color:#92400e;font-weight:700;border-bottom:2px solid #fde68a;">ชื่อสินค้า</th>
                  <th style="padding:7px 4px;font-size:9px;color:#92400e;font-weight:700;border-bottom:2px solid #fde68a;width:50px;">Lot</th>
                  <th style="text-align:center;padding:7px 4px;font-size:9px;color:#92400e;font-weight:700;border-bottom:2px solid #fde68a;width:60px;">หมดอายุ</th>
                  <th style="text-align:center;padding:7px 4px;font-size:9px;color:#92400e;font-weight:700;border-bottom:2px solid #fde68a;width:45px;">จำนวนโอน</th>
                  <th style="text-align:center;padding:7px 4px;font-size:9px;color:#92400e;font-weight:700;border-bottom:2px solid #fde68a;width:45px;">จำนวนรับ</th>
                  <th style="text-align:right;padding:7px 4px;font-size:9px;color:#92400e;font-weight:700;border-bottom:2px solid #fde68a;width:55px;">ราคาทุน</th>
                  <th style="text-align:center;padding:7px 4px;font-size:9px;color:#92400e;font-weight:700;border-bottom:2px solid #fde68a;width:55px;">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
                ${emptyRows}
              </tbody>
            </table>

            ${pageNum === totalPages ? `
              <!-- Summary -->
              <div style="border-top:2px solid #f59e0b;padding-top:10px;margin-bottom:16px;">
                <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                  <div style="display:flex;gap:16px;">
                    <div style="background:#fef3c7;border-radius:8px;padding:6px 12px;text-align:center;">
                      <div style="font-size:9px;color:#92400e;">จำนวนรายการ</div>
                      <div style="font-size:14px;font-weight:700;color:#0f172a;">${totalItems} รายการ</div>
                    </div>
                    <div style="background:#fef3c7;border-radius:8px;padding:6px 12px;text-align:center;">
                      <div style="font-size:9px;color:#92400e;">จำนวนโอน</div>
                      <div style="font-size:14px;font-weight:700;color:#0f172a;">${totalQty} ชิ้น</div>
                    </div>
                    <div style="background:#E5EEF8;border-radius:8px;padding:6px 12px;text-align:center;">
                      <div style="font-size:9px;color:#173F6B;">จำนวนรับจริง</div>
                      <div style="font-size:14px;font-weight:700;color:#2A6AAA;">${confirmedQty} ชิ้น</div>
                    </div>
                    <div style="background:#f8fafc;border-radius:8px;padding:6px 12px;text-align:center;">
                      <div style="font-size:9px;color:#64748b;">มูลค่ารวม</div>
                      <div style="font-size:14px;font-weight:700;color:#0f172a;">฿${totalCost.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Legend -->
              <div style="display:flex;gap:16px;margin-bottom:20px;font-size:10px;color:#64748b;">
                <span>⏳ = รอรับ</span>
                <span>✅ = รับแล้ว</span>
                <span>🔄 = คืนสินค้า</span>
              </div>

              <!-- Signature Section -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:20px;">
                <div style="text-align:center;">
                  <div style="border-bottom:1px solid #cbd5e1;padding-bottom:40px;margin:0 20px;"></div>
                  <div style="font-size:11px;color:#64748b;margin-top:6px;">ผู้ส่งสินค้า / Sender</div>
                  <div style="font-size:10px;color:#94a3b8;">วันที่ ....../....../......</div>
                </div>
                <div style="text-align:center;">
                  <div style="border-bottom:1px solid #cbd5e1;padding-bottom:40px;margin:0 20px;"></div>
                  <div style="font-size:11px;color:#64748b;margin-top:6px;">ผู้รับสินค้า / Receiver</div>
                  <div style="font-size:10px;color:#94a3b8;">วันที่ ....../....../......</div>
                </div>
              </div>
            ` : ""}

            <!-- Footer -->
            <div style="position:absolute;bottom:18px;left:20mm;right:20mm;text-align:center;font-size:9px;color:#cbd5e1;border-top:1px solid #f1f5f9;padding-top:6px;">
              เอกสารนี้สร้างโดยระบบ SmileStore POS · ${transfer.transferNo || "#" + transfer.id} · หน้า ${pageNum}/${totalPages}
            </div>
          </div>
        `;
      };

      const allPages = pages.map((pageItems, i) => generatePage(pageItems, i + 1, pages.length)).join("");

      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>ใบรับโอนสินค้า ${transfer.transferNo || "#" + transfer.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Kanit', sans-serif; }
            .page {
              width: 210mm; min-height: 297mm; padding: 15mm 18mm 25mm 18mm;
              position: relative; background: #fff;
              page-break-after: always;
            }
            .page:last-child { page-break-after: auto; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none !important; }
              .page { padding: 10mm 15mm 20mm 15mm; }
            }
            @media screen {
              body { background: #e2e8f0; display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 20px 0; }
              .page { box-shadow: 0 4px 20px rgba(0,0,0,0.15); border-radius: 4px; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="position:fixed;top:16px;right:16px;z-index:999;display:flex;gap:8px;">
            <button onclick="window.print()" style="padding:10px 24px;background:#f59e0b;color:#fff;border:none;border-radius:8px;font-family:Kanit;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(245,158,11,0.3);">🖨️ พิมพ์</button>
            <button onclick="window.close()" style="padding:10px 18px;background:#f1f5f9;color:#475569;border:none;border-radius:8px;font-family:Kanit;font-size:14px;cursor:pointer;">✕ ปิด</button>
          </div>
          ${allPages}
        </body>
        </html>
      `);
      printWindow.document.close();
    };

    // ดึง userId จาก token
    useEffect(() => {
      try {
        const token = localStorage.getItem('token') || ''
        if (token) {
          const payload = jwtDecode<any>(token)
          const uid = Number(payload.idcompany)
          setCurrentUserId(uid)
          fetchPendingTransfers(uid)

          // ดึงชื่อผู้ที่ล็อกอินใช้งาน (ผู้รับโอน) จาก token
          axios.get(`/api/login/loginuser/${Number(payload.id)}`)
            .then(r => setReceiverName(r.data?.name || payload.username || localStorage.getItem('person_') || ''))
            .catch(() => setReceiverName(payload.username || localStorage.getItem('person_') || ''))
        }
      } catch (e) { console.error(e) }
    }, [])

    useEffect(() => {
      const fetchPosts = async () => {
        let companyS = (localStorage.getItem("company_") || "")
        try {
          const [res, res1] = await Promise.all([
            axios.get(`/api/${apis}?company=${companyS}`),
            axios.get(`/api/${apidataitem}?company=${companyS}`)
          ])
          setPosts(res.data)
          setPostItem(res1.data)
        } catch (error) { console.error(error) }
      }
      fetchPosts()
      fetchStoreInfo()
      setcpage("1")
    }, [Number(cpage)])

    useEffect(() => {
      if (!requestedReceiveId || appliedReceiveIdRef.current === requestedReceiveId || posts.length === 0) return
      const matchedReceive: any = posts.find((post: any) => String(post?.id) === String(requestedReceiveId))
      if (!matchedReceive) return

      setidss((prev) => ({
        ...prev,
        idcus: String(matchedReceive.id || ""),
        codes: String(matchedReceive.code || ""),
        companys: String(matchedReceive.company || ""),
        rcnumber: String(matchedReceive.orderfull || ""),
      }))
      setidcus(String(matchedReceive.id || ""))
      setcodes(String(matchedReceive.code || ""))
      setcompanys(String(matchedReceive.company || ""))
      setrcnumber(String(matchedReceive.orderfull || ""))
      localStorage.setItem("id_RC", String(matchedReceive.id || ""))
      localStorage.setItem("codeS", String(matchedReceive.orderfull || ""))
      setchanhepage(2)
      appliedReceiveIdRef.current = requestedReceiveId
    }, [requestedReceiveId, posts, setcodes, setcompanys, setidcus, setrcnumber])

    var dt = new Date();
    let year = dt.getFullYear();
    let month = (dt.getMonth() + 1).toString().padStart(2, "0");
    let day = dt.getDate().toString().padStart(2, "0");

    const maxV = async () => {
      let result = posts.filter((a: any) => a.orderNo === String(year) + String(month) + String(day)).map((pp: any) => (pp.code))
      let maxValue = Math.max.apply(null, result)
      await setidss({ ...idc, maxRec: String(maxValue) })
      setmaxRec(String(maxValue))
    }

    const normalizeSearchValue = (value: any) => String(value || "").trim().toLowerCase()

    const formatTableDate = (value: any, fallback = "-") => {
      if (!value) return fallback
      const parsedDate = new Date(String(value))
      if (Number.isNaN(parsedDate.getTime())) return fallback
      return `${parsedDate.getDate()}/${parsedDate.getMonth() + 1}/${parsedDate.getFullYear()}`
    }

    const getPaymentDisplay = (post: any) => {
      const normalizedStatus = String(post.statuss || "").trim()
      const isPaid = normalizedStatus === "ชำระเงินแล้ว"
      const hasDueDate = Boolean(post.pay_date)

      // ตรวจสอบว่าเลยกำหนดชำระหรือยัง (pay_date <= วันปัจจุบัน)
      let isOverdue = false
      if (hasDueDate && !isPaid) {
        const dueDate = new Date(String(post.pay_date))
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        dueDate.setHours(0, 0, 0, 0)
        isOverdue = dueDate.getTime() <= today.getTime()
      }

      if (isPaid) {
        return {
          label: "ชำระแล้ว",
          color: "#173F6B",
          background: "#E5EEF8",
          border: "#A6C8E7",
          dot: "#3E86C7",
          dueDateText: formatTableDate(post.pay_date, "ไม่ระบุ"),
          isOverdue: false
        }
      }

      return {
        label: hasDueDate ? "ยังไม่ชำระ" : "รอระบุ",
        color: hasDueDate ? (isOverdue ? "#991b1b" : "#92400e") : "#475569",
        background: hasDueDate ? (isOverdue ? "#fee2e2" : "#fef3c7") : "#f1f5f9",
        border: hasDueDate ? (isOverdue ? "#fca5a5" : "#fcd34d") : "#cbd5e1",
        dot: hasDueDate ? (isOverdue ? "#ef4444" : "#f59e0b") : "#94a3b8",
        dueDateText: formatTableDate(post.pay_date, "ไม่ระบุ"),
        isOverdue
      }
    }

    const isDisplayedUnpaid = (post: any) => {
      return getPaymentDisplay(post).label === "ยังไม่ชำระ"
    }

    const isReceiveConfirmed = (post: any) => {
      const confirmStatus = String(post.confirmRecord?.status || "").trim().toLowerCase()
      const legacyStatus = String(post.statuss || "").trim().toLowerCase()
      return confirmStatus === "confirmed" || legacyStatus === "confirmed"
    }

    const getReceiveConfirmDisplay = (post: any) => {
      const isConfirmed = isReceiveConfirmed(post)

      if (isConfirmed) {
        return {
          label: "ยืนยันรับแล้ว",
          color: "#173F6B",
          background: "#E5EEF8",
          border: "#A6C8E7",
          dot: "#3E86C7"
        }
      }

      return {
        label: "รอยืนยันรับ",
        color: "#9a3412",
        background: "#ffedd5",
        border: "#fdba74",
        dot: "#f97316"
      }
    }

    const supplierOptions = useMemo(() => {
      return [...new Set(
        posts
          .map((post: any) => String(post.names || '').trim())
          .filter((name: string) => Boolean(name))
      )].sort((left: string, right: string) => left.localeCompare(right, 'th'))
    }, [posts])

    const overdueUnpaidCount = useMemo(() => {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      return posts.filter((post: any) => {
        const normalizedStatus = String(post.statuss || "").trim()
        if (normalizedStatus === "ชำระเงินแล้ว") return false
        if (!post.pay_date) return false
        const dueDate = new Date(String(post.pay_date))
        dueDate.setHours(0, 0, 0, 0)
        return dueDate.getTime() <= today.getTime()
      }).length
    }, [posts])

    const filteredPosts = useMemo(() => {
      const normalizedSearch = normalizeSearchValue(deferredSearch)
      const normalizedSupplierFilter = normalizeSearchValue(supplierFilter)

      return [...posts]
        .filter((post: any) => {
          const paymentDisplay = getPaymentDisplay(post)
          const receiveConfirmDisplay = getReceiveConfirmDisplay(post)

          if (normalizedSupplierFilter && normalizeSearchValue(post.names) !== normalizedSupplierFilter) {
            return false
          }

          if (normalizedSearch) {
            const searchableValues = [
              post.orderfull,
              `RC${post.orderfull || ""}`,
              post.invoice_No,
              post.names,
              paymentDisplay.label,
              paymentDisplay.dueDateText,
              receiveConfirmDisplay.label,
              formatTableDate(post.order_date),
              formatTableDate(post.receive_date),
              formatTableDate(post.pay_date),
            ]

            const matchesSearch = searchableValues.some((value) => normalizeSearchValue(value).includes(normalizedSearch))
            if (!matchesSearch) {
              return false
            }
          }

          if (filterPendingConfirm && isReceiveConfirmed(post)) {
            return false
          }

          if (filterUnpaid && !isDisplayedUnpaid(post)) {
            return false
          }

          return true
        })
        .sort((a: any, b: any) => (b.orderfull || "").localeCompare(a.orderfull || ""))
    }, [posts, deferredSearch, filterPendingConfirm, filterUnpaid, supplierFilter])

    return (
      <div className="row g-3">
        {/* Left Panel - Receive List */}
        <div className="col-lg-8 col-md-12">
          <div style={{
            backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0', overflow: 'hidden', height: '88vh', display: 'flex', flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
              color: '#475569', padding: '16px 20px', fontFamily: 'Kanit_B', fontSize: '15px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid #cbd5e1'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Package size={20} style={{ color: '#6366f1' }} /> ข้อมูล รับสินค้า
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <div style={{ position: 'relative' }}>
                  <select
                    value={supplierFilter}
                    onChange={(e) => setSupplierFilter(e.target.value)}
                    style={{
                      minWidth: '170px',
                      fontFamily: 'Kanit',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: supplierFilter ? '#0f172a' : '#64748b',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '999px',
                      padding: '7px 34px 7px 12px',
                      outline: 'none',
                      cursor: 'pointer',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none'
                    }}
                  >
                    <option value="">ผู้ขายทั้งหมด</option>
                    {supplierOptions.map((supplierName) => (
                      <option key={supplierName} value={supplierName}>{supplierName}</option>
                    ))}
                  </select>
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#94a3b8',
                    fontSize: '10px'
                  }}>▼</span>
                </div>
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                  fontFamily: 'Kanit', fontSize: '12px', fontWeight: 500,
                  color: filterPendingConfirm ? '#9a3412' : '#64748b',
                  backgroundColor: filterPendingConfirm ? '#ffedd5' : '#ffffff',
                  border: `1px solid ${filterPendingConfirm ? '#fdba74' : '#e2e8f0'}`,
                  borderRadius: '999px', padding: '7px 12px', userSelect: 'none'
                }}>
                  <input
                    type="checkbox"
                    checked={filterPendingConfirm}
                    onChange={(e) => setFilterPendingConfirm(e.target.checked)}
                    style={{ width: '14px', height: '14px', accentColor: '#f97316', cursor: 'pointer' }}
                  />
                  รอยืนยันรับ
                </label>
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                  fontFamily: 'Kanit', fontSize: '12px', fontWeight: 500,
                  color: filterUnpaid ? '#1E5088' : '#64748b',
                  backgroundColor: filterUnpaid ? '#E5EEF8' : '#ffffff',
                  border: `1px solid ${filterUnpaid ? '#A6C8E7' : '#e2e8f0'}`,
                  borderRadius: '999px', padding: '7px 12px', userSelect: 'none'
                }}>
                  <input
                    type="checkbox"
                    checked={filterUnpaid}
                    onChange={(e) => setFilterUnpaid(e.target.checked)}
                    style={{ width: '14px', height: '14px', accentColor: '#2A6AAA', cursor: 'pointer' }}
                  />
                  ยังไม่ชำระ
                  {overdueUnpaidCount > 0 && (
                    <span style={{
                      backgroundColor: '#dc2626', color: '#fff',
                      borderRadius: '50%', minWidth: '18px', height: '18px',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 700, lineHeight: 1
                    }}>{overdueUnpaidCount}</span>
                  )}
                </label>
                <span style={{
                  backgroundColor: '#cbd5e1', color: '#475569', padding: '4px 12px',
                  borderRadius: '12px', fontSize: '11px', fontWeight: 600
                }}>{filteredPosts.length} รายการ</span>
              </div>
            </div>

            {/* Filter Section */}
            <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <div className="d-flex align-items-center gap-2">
                  <Search size={14} style={{ color: '#94a3b8' }} />
                  <span style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#64748b' }}>ค้นหา :</span>
                </div>
                <input value={searchname} onChange={(e) => { setsearchname(e.target.value) }}
                  placeholder="พิมพ์เลขที่เอกสาร ผู้ขาย หรือสถานะ..."
                  style={{
                    fontFamily: 'Kanit', fontSize: '12px', padding: '8px 14px', borderRadius: '8px',
                    border: '1px solid #e2e8f0', backgroundColor: 'white', width: '180px'
                  }}
                />
                <button onClick={() => setsearchname('')} type="button" style={{
                  fontFamily: 'Kanit', fontSize: '12px', padding: '8px 16px', borderRadius: '8px',
                  border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', cursor: 'pointer'
                }}>ล้างค้นหา</button>
                <button onClick={() => { setchanhepage(1), maxV() }} type="button" style={{
                  fontFamily: 'Kanit', fontSize: '12px', padding: '8px 16px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)', color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(42, 106, 170, 0.2)'
                }}><Plus size={16} /> เพิ่มใบรับสินค้า</button>
                <button onClick={() => { setShowTransferModal(true); fetchPendingTransfers(); }} type="button" style={{
                  fontFamily: 'Kanit', fontSize: '12px', padding: '8px 16px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(217, 119, 6, 0.3)',
                  position: 'relative'
                }}>
                  <ArrowDownToLine size={16} /> รับโอน
                  {pendingCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -6, right: -6,
                      backgroundColor: '#dc2626', color: '#fff',
                      borderRadius: '50%', width: 20, height: 20,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700
                    }}>{pendingCount}</span>
                  )}
                </button>
                <button onClick={() => setShowCutLotModal(true)} type="button" style={{
                  fontFamily: 'Kanit', fontSize: '12px', padding: '8px 16px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(124, 58, 237, 0.3)'
                }}>
                  <Scissors size={16} /> ตัด Lot ย้อนหลัง
                </button>
              </div>
            </div>

            {/* Table */}
            <div className={styles.receiveTableFrame}>
              <Table borderless className={`${styles.receiveTable} mb-0`}>
                <thead className={styles.receiveTableHead}>
                  <tr>
                    <th className={styles.receiveHeadCellCenter} style={{ width: '12%' }}>ORDER NO.</th>
                    <th className={styles.receiveHeadCellCenter} style={{ width: '10%' }}>เลขที่ใบสั่งซื้อ</th>
                    <th className={styles.receiveHeadCellLeft} style={{ width: '20%' }}>ชื่อผู้ขายหรือผู้แทนจำหน่าย</th>
                    <th className={styles.receiveHeadCellCenter} style={{ width: '13%' }}>วันสั่งสินค้า</th>
                    <th className={styles.receiveHeadCellCenter} style={{ width: '13%' }}>วันรับสินค้า</th>
                    <th className={styles.receiveHeadCellCenter} style={{ width: '6%' }}>จำนวน</th>
                    <th className={styles.receiveHeadCellCenter} style={{ width: '10%' }}>เงินสุทธิ</th>
                    {/* ประเภทเอกสาร — ซ่อนไว้ (ลบ display:none ทั้ง th และ td เพื่อเปิดกลับ) */}
                    <th className={styles.receiveHeadCellCenter} style={{ width: '11%', display: 'none' }}>ประเภทเอกสาร</th>
                    <th className={styles.receiveHeadCellCenter} style={{ width: '5%' }}>เพิ่ม</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post: any, index: number) => (
                    <tr key={post.id}
                      onClick={() => { setidss({ ...idc, idcus: post.id }), setidcus(String(post.id)), setchanhepage(2) }}
                      className={styles.receiveTableRow}
                    >
                      <td className={styles.receiveTableCellCenter}>
                        <span className={styles.receiveOrderCode}>{"RC" + post.orderfull}</span>
                      </td>
                      <td className={styles.receiveTableCellCenter}>
                        <span className={styles.receiveInvoiceText}>{post.invoice_No || '-'}</span>
                      </td>
                      <td className={styles.receiveTableCell}>
                        {(() => {
                          const receiveConfirmDisplay = getReceiveConfirmDisplay(post)
                          return (
                            <div className={styles.receiveSupplierStack}>
                              <div className={styles.receiveSupplierName} title={post.names}>
                                {post.names}
                              </div>
                              <div className={styles.receiveStatusPill} style={{
                                color: receiveConfirmDisplay.color,
                                backgroundColor: receiveConfirmDisplay.background,
                                borderColor: receiveConfirmDisplay.border
                              }}>
                                <span style={{
                                  backgroundColor: receiveConfirmDisplay.dot
                                }} />
                                <span>{receiveConfirmDisplay.label}</span>
                              </div>
                            </div>
                          )
                        })()}
                      </td>
                      <td className={styles.receiveTableCellCenter}>
                        {(() => {
                          const paymentDisplay = getPaymentDisplay(post)
                          return (
                            <div className={styles.receiveDateStack}>
                              <div className={styles.receiveDateTextMuted}>
                                {formatTableDate(post.order_date)}
                              </div>
                              <div className={styles.receiveDuePill} style={{
                                fontWeight: paymentDisplay.isOverdue ? 700 : 500,
                                color: paymentDisplay.isOverdue ? '#991b1b' : '#64748b',
                                backgroundColor: paymentDisplay.isOverdue ? '#fee2e2' : '#f8fafc',
                                borderColor: paymentDisplay.isOverdue ? '#fca5a5' : '#e2e8f0'
                              }}>
                                <Calendar size={10} />
                                <span>ชำระ {paymentDisplay.dueDateText}</span>
                              </div>
                            </div>
                          )
                        })()}
                      </td>
                      <td className={styles.receiveTableCellCenter}>
                        {(() => {
                          const paymentDisplay = getPaymentDisplay(post)
                          return (
                            <div className={styles.receiveDateStack}>
                              <div className={styles.receiveDateTextStrong}>
                                {formatTableDate(post.receive_date)}
                              </div>
                              <div className={styles.receiveStatusPill} style={{
                                color: paymentDisplay.color,
                                backgroundColor: paymentDisplay.background,
                                borderColor: paymentDisplay.border
                              }}>
                                <span style={{
                                  backgroundColor: paymentDisplay.dot
                                }} />
                                <DollarSign size={10} />
                                <span>{paymentDisplay.label}</span>
                              </div>
                            </div>
                          )
                        })()}
                      </td>
                      <td className={styles.receiveTableCellCenter}>
                        <span className={styles.receiveQtyPill}>{post.countorder}</span>
                      </td>
                      <td className={styles.receiveTableCellCenter}>
                        <span className={styles.receiveAmountPill}>{Number(post.totalRCAll).toLocaleString(undefined, { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces })}</span>
                      </td>
                      {/* ประเภทเอกสาร — ซ่อนไว้ */}
                      <td className={styles.receiveTableCellCenter} style={{ display: 'none' }} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.receiveDocActions}>
                          <select
                            value={selectedDocType[post.id] || "ข.ย.9"}
                            onChange={(e) => setSelectedDocType(prev => ({ ...prev, [post.id]: e.target.value }))}
                            className={styles.receiveDocSelect}
                          >
                            {docTypeOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              const docType = selectedDocType[post.id] || "ข.ย.9"
                              GetDetailRC(post.orderfull, docType)
                              setDocVender(post.names)
                              setCurrentDocTypeLabel(toThaiDocType(docType))
                              setShowDocModal(true)
                            }}
                            className={styles.receivePrintButton}
                            title="พิมพ์เอกสาร"
                          >
                            <Printer size={14} />
                          </button>
                        </div>
                      </td>
                      <td className={styles.receiveTableCellCenter}
                        onClick={(e) => {
                          e.stopPropagation();
                          setidss({ ...idc, idcus: post.id }); setidss({ ...idc, codes: post.code }); setidss({ ...idc, companys: post.company });
                          setidcus(String(post.id)); setcodes(String(post.code)); setcompanys(String(post.company));
                          localStorage.setItem("id_RC", post.id); localStorage.setItem("codeS", post.orderfull);
                        }}
                      >
                        <Link href={`/web/receives/createlistreceive?id=${post.id}&code=${encodeURIComponent(post.orderfull ?? "")}`}>
                          <button type="button" className={styles.receiveAddButton}>เพิ่ม</button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        </div>

        {/* === Cut Lot Modal === */}
        <CutLotModal
          show={showCutLotModal}
          onClose={() => setShowCutLotModal(false)}
          company={typeof window !== 'undefined' ? (localStorage.getItem('company_') || '') : ''}
          person={typeof window !== 'undefined' ? (localStorage.getItem('person_') || '') : ''}
          onComplete={() => setcpage(String(Date.now()))}
        />

        {/* === ประเภทเอกสาร Print Modal === */}
        <DocTypePrintModal
          show={showDocModal}
          onHide={() => setShowDocModal(false)}
          postItem={docPostItem}
          vender={docVender}
          currentDocTypeLabel={currentDocTypeLabel}
          storeS={storeS}
        />

        {/* === Transfer Receive Modal === */}
        {showTransferModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
          }} onClick={() => setShowTransferModal(false)}>
            <div style={{
              backgroundColor: '#fff', borderRadius: 16, width: '92%', maxWidth: 950,
              maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
            }} onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div style={{
                padding: '18px 24px', borderBottom: '1px solid #e2e8f0',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff', borderRadius: '16px 16px 0 0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontFamily: 'Kanit', fontSize: 18, fontWeight: 700 }}>
                    {showHistoryView ? '� ประวัติการรับโอนสินค้า' : '� รับโอนสินค้าระหว่างสาขา'}
                  </div>
                  <div style={{ fontFamily: 'Kanit', fontSize: 12, opacity: 0.85 }}>
                    {showHistoryView ? `ทั้งหมด ${transferHistory.length} รายการ` : `รอรับ ${pendingTransfers.length} ออเดอร์`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => {
                      if (!showHistoryView) {
                        fetchTransferHistory();
                      }
                      setShowHistoryView(!showHistoryView);
                      setExpandedHistoryId(null);
                    }}
                    style={{
                      background: showHistoryView ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.2)',
                      border: 'none',
                      color: showHistoryView ? '#d97706' : '#fff',
                      padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                      fontFamily: 'Kanit', fontSize: 12, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'all 0.2s'
                    }}
                  >
                    {showHistoryView ? '📦 รอรับ' : '📋 ประวัติ'}
                  </button>
                  <button onClick={() => { setShowTransferModal(false); setShowHistoryView(false); }} style={{
                    background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
                    width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                    fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>✕</button>
                </div>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
                {showHistoryView ? (
                  /* === History View === */
                  historyLoading ? (
                    <div style={{ textAlign: 'center', padding: 40, fontFamily: 'Kanit', color: '#64748b' }}>🔄 กำลังโหลด...</div>
                  ) : transferHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, fontFamily: 'Kanit', color: '#94a3b8' }}>ยังไม่มีประวัติการรับโอน</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {transferHistory.map((transfer: any) => {
                        const isExpanded = expandedHistoryId === transfer.id;
                        const totalItems = transfer.items?.length || 0;
                        const confirmedItems = transfer.items?.filter((i: any) => i.itemStatus === 'confirmed') || [];
                        const pendingItems = transfer.items?.filter((i: any) => i.itemStatus === 'pending') || [];
                        const totalQty = transfer.items?.reduce((s: number, i: any) => s + (i.qty || 0), 0) || 0;
                        const confirmedQty = confirmedItems.reduce((s: number, i: any) => s + (i.confirmedQty || i.qty || 0), 0);

                        const isCompleted = transfer.status === 'completed' || confirmedItems.length === totalItems;
                        const isFailed = transfer.status === 'failed';
                        const statusColor = isCompleted ? '#147F56' : isFailed ? '#dc2626' : '#f59e0b';
                        const statusBg = isCompleted ? '#D3F0E2' : isFailed ? '#fee2e2' : '#fef3c7';
                        const statusLabel = isCompleted ? '✅ รับครบแล้ว' : isFailed ? '❌ ล้มเหลว' : `⏳ รอรับ ${pendingItems.length}/${totalItems}`;
                        const statusIcon = isCompleted ? '✅' : isFailed ? '❌' : '⏳';

                        return (
                          <div key={transfer.id} style={{
                            border: `1px solid ${isExpanded ? statusColor : '#e2e8f0'}`,
                            borderRadius: 12, overflow: 'hidden',
                            boxShadow: isExpanded ? `0 4px 12px ${statusColor}25` : '0 1px 3px rgba(0,0,0,0.04)',
                            transition: 'all 0.2s'
                          }}>
                            {/* Header */}
                            <div
                              onClick={() => setExpandedHistoryId(isExpanded ? null : transfer.id)}
                              style={{
                                padding: '12px 16px', cursor: 'pointer',
                                backgroundColor: isExpanded ? `${statusBg}` : '#fafafa',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 36, height: 36, borderRadius: 9,
                                  backgroundColor: statusBg,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 18
                                }}>{statusIcon}</div>
                                <div>
                                  <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                                    {transfer.transferNo || `#${transfer.id}`}
                                  </div>
                                  <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '2px 8px' }}>
                                    <span>📤 <strong>{transfer.fromBranchName || 'Remote'}</strong></span>
                                    <span>➡️</span>
                                    <span>📥 <strong>{transfer.toBranchName || '-'}</strong></span>
                                  </div>
                                  <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8', display: 'flex', flexWrap: 'wrap', gap: '2px 8px', marginTop: 1 }}>
                                    <span>ผู้โอน: {transfer.person || '-'}</span>
                                    <span>· {new Date(transfer.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    <span>· {totalItems} รายการ · {totalQty} ชิ้น</span>
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <button
                                  title="พิมพ์ใบรับโอนสินค้า"
                                  onClick={(e) => { e.stopPropagation(); printReceiveDocument(transfer); }}
                                  style={{
                                    background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706',
                                    width: 26, height: 26, borderRadius: 6, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, transition: 'all 0.15s'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f59e0b'; e.currentTarget.style.color = '#fff'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fffbeb'; e.currentTarget.style.color = '#d97706'; }}
                                >🖨️</button>
                                <span style={{
                                  fontFamily: 'Kanit', fontSize: 10, fontWeight: 600,
                                  color: statusColor, backgroundColor: statusBg,
                                  padding: '2px 8px', borderRadius: 12
                                }}>{statusLabel}</span>
                                <span style={{ fontSize: 12, color: '#94a3b8', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                              </div>
                            </div>

                            {/* Expanded Items */}
                            {isExpanded && transfer.items && (
                              <div style={{ borderTop: '1px solid #e2e8f0' }}>
                                <div style={{
                                  padding: '8px 16px', backgroundColor: '#f8fafc',
                                  display: 'grid', gridTemplateColumns: '0.6fr 2fr 0.6fr 0.6fr 0.6fr 0.6fr',
                                  gap: 6, fontFamily: 'Kanit', fontSize: 10, fontWeight: 700, color: '#64748b'
                                }}>
                                  <div>รหัส</div>
                                  <div>ชื่อสินค้า</div>
                                  <div>Lot</div>
                                  <div style={{ textAlign: 'center' }}>โอน</div>
                                  <div style={{ textAlign: 'center' }}>รับจริง</div>
                                  <div style={{ textAlign: 'center' }}>สถานะ</div>
                                </div>
                                {transfer.items.map((item: any, idx: number) => {
                                  const isPending = item.itemStatus === 'pending';
                                  const isConfirmed = item.itemStatus === 'confirmed';
                                  return (
                                    <div key={item.id} style={{
                                      padding: '8px 16px',
                                      display: 'grid', gridTemplateColumns: '0.6fr 2fr 0.6fr 0.6fr 0.6fr 0.6fr',
                                      gap: 6, fontFamily: 'Kanit', fontSize: 11,
                                      borderBottom: idx < transfer.items.length - 1 ? '1px solid #f1f5f9' : 'none',
                                      backgroundColor: isConfirmed ? '#F3F8FC' : idx % 2 === 0 ? '#fff' : '#fafafa',
                                      alignItems: 'center'
                                    }}>
                                      <div style={{ color: '#1E5088', fontWeight: 500, fontSize: 10 }}>{item.itemcode}</div>
                                      <div style={{ color: '#334155' }}>
                                        {item.itemName}
                                        {item.barcode && <span style={{ fontSize: 9, color: '#94a3b8', marginLeft: 4 }}>({item.barcode})</span>}
                                      </div>
                                      <div style={{ color: '#64748b', fontSize: 10 }}>{item.lot || '-'}</div>
                                      <div style={{ textAlign: 'center', fontWeight: 600 }}>{item.qty}</div>
                                      <div style={{ textAlign: 'center', fontWeight: 600, color: isConfirmed ? '#2A6AAA' : '#94a3b8' }}>
                                        {item.confirmedQty != null ? item.confirmedQty : '-'}
                                      </div>
                                      <div style={{ textAlign: 'center' }}>
                                        {isConfirmed ? (
                                          <span style={{ fontSize: 9, color: '#2A6AAA', backgroundColor: '#E5EEF8', padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>✅ รับแล้ว</span>
                                        ) : (
                                          <span style={{ fontSize: 9, color: '#d97706', backgroundColor: '#fef3c7', padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>⏳ รอรับ</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                                {/* Footer */}
                                <div style={{
                                  padding: '8px 16px', backgroundColor: '#F3F8FC',
                                  display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6,
                                  fontFamily: 'Kanit', fontSize: 11, color: '#475569'
                                }}>
                                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <span>ผู้โอน: <strong>{transfer.person || '-'}</strong></span>
                                    <span>จาก: <strong>{transfer.fromBranchName || 'Remote'}</strong></span>
                                    <span>ถึง: <strong>{transfer.toBranchName || '-'}</strong></span>
                                  </div>
                                  <div style={{ display: 'flex', gap: 12 }}>
                                    <span>โอน: <strong>{totalQty} ชิ้น</strong></span>
                                    {confirmedItems.length > 0 && (
                                      <span style={{ color: '#2A6AAA' }}>รับ: <strong>{confirmedQty} ชิ้น</strong></span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  /* === Pending View (existing) === */
                  transferLoading ? (
                    <div style={{ textAlign: 'center', padding: 40, fontFamily: 'Kanit', color: '#64748b' }}>🔄 กำลังโหลด...</div>
                  ) : pendingTransfers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, fontFamily: 'Kanit', color: '#94a3b8' }}>ไม่มีรายการรอรับ</div>
                  ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {pendingTransfers.map((transfer: any) => {
                      const isExpanded = expandedTransferId === transfer.id
                      const pendingItems = transfer.items?.filter((i: any) => i.itemStatus === 'pending') || []
                      const confirmedItems = transfer.items?.filter((i: any) => i.itemStatus === 'confirmed') || []
                      const totalItems = transfer.items?.length || 0

                      return (
                        <div key={transfer.id} style={{
                          border: `1px solid ${isExpanded ? '#f59e0b' : '#e2e8f0'}`,
                          borderRadius: 12, overflow: 'hidden',
                          boxShadow: isExpanded ? '0 4px 12px rgba(245,158,11,0.15)' : '0 1px 3px rgba(0,0,0,0.04)'
                        }}>
                          {/* Order Header */}
                          <div
                            onClick={() => setExpandedTransferId(isExpanded ? null : transfer.id)}
                            style={{
                              padding: '14px 18px', cursor: 'pointer',
                              backgroundColor: isExpanded ? '#fffbeb' : '#fafafa',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{
                                width: 40, height: 40, borderRadius: 10,
                                backgroundColor: '#fef3c7',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 20
                              }}>📦</div>
                              <div>
                                <div style={{ fontFamily: 'Kanit', fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                                  {transfer.transferNo || `#${transfer.id}`}
                                </div>
                                <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '2px 10px' }}>
                                  <span>📤 จาก: <strong>{transfer.fromBranchName || `สาขา ${transfer.fromUserId}`}</strong></span>
                                  <span>➡️</span>
                                  <span>📥 ถึง: <strong>{transfer.toBranchName || '-'}</strong></span>
                                </div>
                                <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8', display: 'flex', flexWrap: 'wrap', gap: '2px 10px' }}>
                                  <span>ผู้โอน: {transfer.person || '-'}</span>
                                  <span>· วันที่โอน: {new Date(transfer.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                  {transfer.completedAt && <span>· วันที่รับ: {new Date(transfer.completedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button
                                title="พิมพ์ใบรับโอนสินค้า"
                                onClick={(e) => { e.stopPropagation(); printReceiveDocument(transfer); }}
                                style={{
                                  background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706',
                                  width: 28, height: 28, borderRadius: 7, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 13, transition: 'all 0.15s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#f59e0b'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#fffbeb'; e.currentTarget.style.color = '#d97706'; }}
                              >🖨️</button>
                              <span style={{
                                fontFamily: 'Kanit', fontSize: 11, fontWeight: 600,
                                color: '#d97706', backgroundColor: '#fef3c7',
                                padding: '3px 10px', borderRadius: 20
                              }}>รอรับ {pendingItems.length}/{totalItems}</span>
                              {confirmedItems.length > 0 && (
                                <span style={{
                                  fontFamily: 'Kanit', fontSize: 11, fontWeight: 600,
                                  color: '#2A6AAA', backgroundColor: '#E5EEF8',
                                  padding: '3px 10px', borderRadius: 20
                                }}>ยืนยันแล้ว {confirmedItems.length}</span>
                              )}
                              <span style={{ fontSize: 14, color: '#94a3b8', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                            </div>
                          </div>

                          {/* Expanded Items */}
                          {isExpanded && transfer.items && (
                            <div style={{ borderTop: '1px solid #e2e8f0' }}>
                              {/* Table Header */}
                              <div style={{
                                padding: '10px 18px', backgroundColor: '#f8fafc',
                                display: 'grid', gridTemplateColumns: '0.8fr 2fr 0.7fr 0.7fr 0.7fr 0.7fr 1.2fr',
                                gap: 8, fontFamily: 'Kanit', fontSize: 11, fontWeight: 700, color: '#64748b'
                              }}>
                                <div>รหัส</div>
                                <div>ชื่อสินค้า</div>
                                <div>Lot</div>
                                <div style={{ textAlign: 'center' }}>จำนวนโอน</div>
                                <div style={{ textAlign: 'center' }}>ต้นทุน</div>
                                <div style={{ textAlign: 'center' }}>สถานะ</div>
                                <div style={{ textAlign: 'center' }}>ดำเนินการ</div>
                              </div>

                              {transfer.items.map((item: any, idx: number) => {
                                const isPending = item.itemStatus === 'pending'
                                const isEditing = editingItemId === item.id
                                const isConfirming = confirmingItemId === item.id

                                return (
                                  <div key={item.id} style={{
                                    padding: '10px 18px',
                                    display: 'grid', gridTemplateColumns: '0.8fr 2fr 0.7fr 0.7fr 0.7fr 0.7fr 1.2fr',
                                    gap: 8, fontFamily: 'Kanit', fontSize: 12,
                                    borderBottom: idx < transfer.items.length - 1 ? '1px solid #f1f5f9' : 'none',
                                    backgroundColor: !isPending ? '#F3F8FC' : idx % 2 === 0 ? '#fff' : '#fafafa',
                                    alignItems: 'center'
                                  }}>
                                    <div style={{ color: '#1E5088', fontWeight: 500 }}>{item.itemcode}</div>
                                    <div style={{ color: '#334155' }}>
                                      {item.itemName}
                                      {item.barcode && <div style={{ fontSize: 10, color: '#94a3b8' }}>BC: {item.barcode}</div>}
                                    </div>
                                    <div style={{ color: '#64748b' }}>{item.lot || '-'}</div>
                                    <div style={{ textAlign: 'center', fontWeight: 600, color: '#0f172a' }}>
                                      {isEditing ? (
                                        <input
                                          type="number"
                                          value={editQty}
                                          onChange={(e) => setEditQty(e.target.value)}
                                          style={{
                                            width: 60, textAlign: 'center', border: '2px solid #f59e0b',
                                            borderRadius: 6, fontFamily: 'Kanit', fontSize: 13, fontWeight: 600,
                                            padding: '2px 4px'
                                          }}
                                          autoFocus
                                        />
                                      ) : (
                                        <>{item.qty}{!isPending && item.confirmedQty != null && item.confirmedQty !== item.qty && (
                                          <span style={{ fontSize: 10, color: '#dc2626' }}> → {item.confirmedQty}</span>
                                        )}</>
                                      )}
                                    </div>
                                    <div style={{ textAlign: 'center', color: '#64748b' }}>
                                      {item.cost ? `฿${Number(item.cost).toLocaleString()}` : '-'}
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                      {isPending ? (
                                        <span style={{ fontSize: 10, color: '#d97706', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>รอยืนยัน</span>
                                      ) : (
                                        <span style={{ fontSize: 10, color: '#2A6AAA', backgroundColor: '#E5EEF8', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>✅ ยืนยันแล้ว</span>
                                      )}
                                    </div>
                                    <div style={{ textAlign: 'center', display: 'flex', gap: 4, justifyContent: 'center' }}>
                                      {isPending && !isEditing && (
                                        <>
                                          <button
                                            onClick={() => confirmItem(item.id, 'confirm')}
                                            disabled={isConfirming}
                                            style={{
                                              fontFamily: 'Kanit', fontSize: 11, padding: '4px 10px',
                                              borderRadius: 6, border: 'none', cursor: 'pointer',
                                              background: '#2A6AAA', color: '#fff',
                                              opacity: isConfirming ? 0.6 : 1
                                            }}
                                          >{isConfirming ? '...' : '✓ ยืนยัน'}</button>
                                          <button
                                            onClick={() => { setEditingItemId(item.id); setEditQty(String(item.qty || 0)); }}
                                            style={{
                                              fontFamily: 'Kanit', fontSize: 11, padding: '4px 10px',
                                              borderRadius: 6, border: '1px solid #f59e0b', cursor: 'pointer',
                                              background: '#fff', color: '#d97706'
                                            }}
                                          >✏️ แก้ไข</button>
                                        </>
                                      )}
                                      {isPending && isEditing && (
                                        <>
                                          <button
                                            onClick={() => {
                                              const q = parseFloat(editQty)
                                              if (isNaN(q) || q < 0 || q > (item.qty || 0)) {
                                                toast.error(<div style={{ fontFamily: 'Kanit' }}>จำนวนต้องอยู่ระหว่าง 0 ถึง {item.qty}</div>)
                                                return
                                              }
                                              confirmItem(item.id, 'confirm_edit', q)
                                            }}
                                            disabled={isConfirming}
                                            style={{
                                              fontFamily: 'Kanit', fontSize: 11, padding: '4px 10px',
                                              borderRadius: 6, border: 'none', cursor: 'pointer',
                                              background: '#f59e0b', color: '#fff',
                                              opacity: isConfirming ? 0.6 : 1
                                            }}
                                          >{isConfirming ? '...' : `✓ ยืนยัน ${editQty} (คืน ${((item.qty || 0) - parseFloat(editQty || '0')).toFixed(1)})`}</button>
                                          <button
                                            onClick={() => setEditingItemId(null)}
                                            style={{
                                              fontFamily: 'Kanit', fontSize: 11, padding: '4px 8px',
                                              borderRadius: 6, border: '1px solid #e2e8f0', cursor: 'pointer',
                                              background: '#fff', color: '#64748b'
                                            }}
                                          >ยกเลิก</button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}

                              {/* Transfer Footer */}
                              <div style={{
                                padding: '10px 18px', backgroundColor: '#fffbeb',
                                display: 'flex', justifyContent: 'space-between',
                                fontFamily: 'Kanit', fontSize: 12, color: '#92400e'
                              }}>
                                <div>ผู้โอน: <strong>{transfer.person || '-'}</strong></div>
                                <div>
                                  รวม: <strong>{transfer.items.reduce((s: number, i: any) => s + (i.qty || 0), 0)} ชิ้น</strong>
                                  {confirmedItems.length > 0 && (
                                    <span style={{ marginLeft: 10, color: '#2A6AAA' }}>
                                      ยืนยันแล้ว: {confirmedItems.reduce((s: number, i: any) => s + (i.confirmedQty || i.qty || 0), 0)} ชิ้น
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right Panel - Form */}
        <div className="col-lg-4 col-md-12">
          <IDContext_Rec.Provider value={idc}>
            {chanhepage === 1 ? <CreateMainOrder /> : idc.idcus === "" ? <></> : <UpdateMainRC />}
          </IDContext_Rec.Provider>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingLeft: 15, paddingRight: 15, backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: 20 }}>
      <div className="row justify-content-start"><HeadTab /></div>
      <div className="row justify-content-start">
        <div className="col-sm-1"><MenuTab_Small /></div>
        <div className="col-sm-11"><BodyCat /></div>
      </div>
      <style jsx>{`.hover-row:hover { background-color: #f1f5f9 !important; }`}</style>
    </div>
  )
}

function DocTypePrintModal({ show, onHide, postItem, vender, currentDocTypeLabel, storeS }: {
  show: boolean, onHide: () => void, postItem: any[], vender: string, currentDocTypeLabel: string, storeS: string
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const reactToPrintFn = useReactToPrint({ contentRef, documentTitle: currentDocTypeLabel })

  return (
    <Modal_blrc show={show} onHide={onHide} size="xl" scrollable={true} aria-labelledby="doc-type-print-modal">
      <Modal_blrc.Header closeButton>
        <Modal_blrc.Title id="doc-type-print-modal">
          <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>ใบรับสินค้า</div>
        </Modal_blrc.Title>
      </Modal_blrc.Header>
      <Modal_blrc.Body style={{ backgroundColor: "grey" }}>
        <div className="paper a4 col-12 print-wrapper" id="print-area" style={{ justifySelf: "center", backgroundColor: "white", marginLeft: 30, marginRight: 30, position: "relative" }} ref={contentRef}>
          <div style={{ marginLeft: 5, marginRight: 5 }}>
            <table className="table table-sm items">
              <thead>
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
                <tr>
                  <td className='bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", height: 15, width: "3%" }}>ลำดับ</td>
                  <td className='bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", height: 15, width: "10%" }}>วันที่รับสินค้า</td>
                  <td className='bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", height: 15, width: "25%" }}>ชื่อผู้ขาย</td>
                  <td className='bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", height: 15, width: "30%" }}>ชื่อยา</td>
                  <td className='bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", height: 15, width: "7%" }}>เลขที่อักษรของครั้งที่ผลิต</td>
                  <td className='bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", height: 15, width: "5%" }}>จำนวน/ปริมาณ</td>
                  <td className='bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", height: 15, width: "10%" }}>ลงลายมือชื่อผู้มีหน้าที่ปฏิบัติการ</td>
                  <td className='bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", height: 15, width: "10%" }}>หมายเหตุ</td>
                </tr>
              </thead>
              <tbody>
                {postItem.map((a: any, index: number) =>
                  <tr key={a.id}>
                    <td style={{ fontFamily: "kanit", fontSize: 12, height: 25, textAlign: "center" }}>{index + 1}</td>
                    <td style={{ fontFamily: "kanit", fontSize: 12, height: 25 }}>
                      {new Date(a.dateRC).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
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
            .paper.a4-landscape { width: 297mm; min-height: 210mm; margin: auto; background: white; padding: 5mm; box-shadow: 0 0 0.4rem rgba(0,0,0,0.15); box-sizing: border-box; }
            table.items { width: 100%; border-collapse: collapse; font-size: 12px; }
            table.items th, table.items td { padding: 4px 4px; border-bottom: 1px solid #686868ff; }
            @media print {
              @page { size: A4 landscape; margin: 10mm; }
              .controls { display: none; }
              thead { display: table-header-group; margin-top: 70px; }
              tr { page-break-inside: avoid; }
              .print-area { width: 100%; max-width: none; box-shadow: none; margin: 0; }
              button { display: none !important; }
            }
          `}</style>
        </div>
      </Modal_blrc.Body>
      <Modal_blrc.Footer>
        <button className="btn btn-primary" style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }} onClick={reactToPrintFn}>Print</button>
        <button className="btn btn-secondary" style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }} onClick={onHide}>ปิด</button>
      </Modal_blrc.Footer>
    </Modal_blrc>
  )
}

function ReceivePageWrapper() {
  return <PermissionGuard codename="F1"><ReceivePage /></PermissionGuard>
}
export default ReceivePageWrapper
