'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import MenuTab_Small from "../componant/menutab_small.tsx"
import HeadTab from "../componant/headtab.jsx"
import { useRouter } from "next/navigation"
import { jwtDecode } from 'jwt-decode'
import { Toaster, toast } from "sonner"
import PermissionGuard from '@/components/PermissionGuard'
import { isLotRequired, allocateFromLots, NO_LOT_VALUE, NO_LOT_LABEL } from '@/lib/lotPolicy'

const escapePrintHtml = (value: any) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;")

const formatThaiDateTime = (value: any) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

const formatThaiShortDate = (value: any) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  })
}

const formatTransferNumber = (value: any) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return "0"
  return parsed.toLocaleString("th-TH", {
    minimumFractionDigits: Number.isInteger(parsed) ? 0 : 2,
    maximumFractionDigits: 2
  })
}

const getTransferModeMeta = (order: any) => {
  const transferMode = order?.transferMode || (order?.remark?.includes("Remote") ? "remote" : "connected")

  if (transferMode === "manual") {
    return {
      transferMode,
      label: "Manual",
      chipBackground: "#E5EEF8",
      chipColor: "#1E5088"
    }
  }

  if (transferMode === "remote") {
    return {
      transferMode,
      label: "Remote",
      chipBackground: "#ede9fe",
      chipColor: "#7c3aed"
    }
  }

  return {
    transferMode,
    label: "เชื่อมสาขา",
    chipBackground: "#E5EEF8",
    chipColor: "#173F6B"
  }
}

const normalizeManualProduct = (product: any) => ({
  ...product,
  code: product.code || product.itemcode || "",
  ProductName: product.ProductName || product.itemName || "",
  Barcode: product.Barcode || product.barcode || "",
  Unit: product.Unit || product.unit || "",
  CostActual: product.CostActual || product.newCost || 0,
  mainTotalBalance: product.mainTotalBalance ?? product.totalBalance ?? 0,
  mainLots: (product.mainLots || product.lots || []).map((lot: any) => ({
    ...lot,
    balance: lot.balance ?? 0,
  }))
})

function BranchTransferPageInner() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // สาขาปัจจุบัน
  const [currentUser, setCurrentUser] = useState<any>(null);

  // ชื่อผู้ใช้งานที่ล็อกอินอยู่ (พนักงาน/เจ้าของที่ล็อกอิน)
  const [loginName, setLoginName] = useState<string>("");

  // สาขาที่เชื่อมต่อทั้งหมด (จากตั้งค่าเชื่อมสาขา)
  const [connectedBranches, setConnectedBranches] = useState<any[]>([]);
  const [acceptedConnectionsCount, setAcceptedConnectionsCount] = useState(0);
  const [unavailableTransferConnectionsCount, setUnavailableTransferConnectionsCount] = useState(0);

  // สาขาที่เลือกโอน (หลายสาขา)
  const [selectedBranches, setSelectedBranches] = useState<any[]>([]);
  const [branchDropdownValue, setBranchDropdownValue] = useState("");

  // ค้นหาสินค้า (scan barcode)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // สินค้าที่ scan แล้ว - แสดงข้อมูลทั้งสาขาหลักและสาขาปลายทาง
  const [scannedProduct, setScannedProduct] = useState<any>(null);

  // จำนวนโอนต่อสาขา { [branchId]: qty }
  const [branchTransferQty, setBranchTransferQty] = useState<Record<number, number>>({});

  // เลือก lot สำหรับโอน
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);

  // รายการโอนทั้งหมด
  const [transferItems, setTransferItems] = useState<any[]>([]);

  // Loading
  const [submitting, setSubmitting] = useState(false);

  // สถานะสาขา
  const [sidebarBranches, setSidebarBranches] = useState<any[]>([]);
  const [sidebarCheckingAll, setSidebarCheckingAll] = useState(false);
  const [sidebarCheckingId, setSidebarCheckingId] = useState<number | null>(null);

  const fetchSidebarBranches = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const payload = jwtDecode<any>(token);
      const userId = Number(payload.idcompany);
      const connRes = await axios.get(`/api/branchconnection?userId=${userId}&type=all`);
      const accepted = connRes.data.filter((c: any) => c.status === "accepted");
      setSidebarBranches(accepted);
    } catch (e) { console.error('fetchSidebarBranches:', e); }
  };

  const handleSidebarCheckStatus = async (connId: number) => {
    setSidebarCheckingId(connId);
    try {
      const res = await axios.post("/api/branchconnection/check", { connectionId: connId });
      setSidebarBranches(prev => prev.map(c => c.id === connId ? { ...c, isOnline: res.data.isOnline, lastCheckedAt: res.data.lastCheckedAt } : c));
    } catch (e) { console.error('checkStatus:', e); }
    setSidebarCheckingId(null);
  };

  const handleSidebarRefreshAll = async () => {
    setSidebarCheckingAll(true);
    for (const conn of sidebarBranches) {
      setSidebarCheckingId(conn.id);
      try {
        const res = await axios.post("/api/branchconnection/check", { connectionId: conn.id });
        setSidebarBranches(prev => prev.map(c => c.id === conn.id ? { ...c, isOnline: res.data.isOnline, lastCheckedAt: res.data.lastCheckedAt } : c));
      } catch (e) { console.error('checkStatus:', e); }
    }
    setSidebarCheckingId(null);
    setSidebarCheckingAll(false);
  };

  // ประวัติการโอน
  const [showHistory, setShowHistory] = useState(false);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const [showManualTransfer, setShowManualTransfer] = useState(false);
  const [manualDestinationName, setManualDestinationName] = useState("");
  const [manualDestinationDetail, setManualDestinationDetail] = useState("");
  const [manualSearchQuery, setManualSearchQuery] = useState("");
  const [manualSearchLoading, setManualSearchLoading] = useState(false);
  const [manualScannedProduct, setManualScannedProduct] = useState<any>(null);
  const [manualSelectedLotId, setManualSelectedLotId] = useState<number | null>(null);
  const [manualTransferQty, setManualTransferQty] = useState("");
  const [manualTransferItems, setManualTransferItems] = useState<any[]>([]);
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const fetchTransferHistory = async () => {
    if (!currentUser?.id) return;
    setHistoryLoading(true);
    try {
      const res = await axios.get(`/api/stocktransfer?userId=${currentUser.id}`);
      setTransferHistory(res.data || []);
    } catch (err) {
      console.error("Failed to fetch transfer history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // พิมพ์ใบโอนสินค้า A4
  const printTransferDocument = (order: any) => {
    const modeMeta = getTransferModeMeta(order);
    const items = order.items || [];
    const totalItems = items.length;
    const totalQty = items.reduce((sum: number, item: any) => sum + (Number(item.qty) || 0), 0);
    const totalCost = items.reduce((sum: number, item: any) => sum + ((Number(item.qty) || 0) * (Number(item.cost) || 0)), 0);
    const statusLabel = order.status === "completed"
      ? "สำเร็จ"
      : order.status === "failed"
        ? "ไม่สำเร็จ"
        : order.status === "pending_remote"
          ? "รอส่ง"
          : order.status === "pending_receive"
            ? "รอรับ"
            : "รอดำเนินการ";
    const statusBackground = order.status === "completed"
      ? "#E5EEF8"
      : order.status === "failed"
        ? "#fee2e2"
        : "#fef3c7";
    const statusColor = order.status === "completed"
      ? "#173F6B"
      : order.status === "failed"
        ? "#991b1b"
        : "#92400e";
    const createdDate = formatThaiDateTime(order.createdAt);
    const completedDate = order.completedAt ? formatThaiDateTime(order.completedAt) : "-";
    const destinationDetail = order.toBranchDetail || order.toBranchDetailSnapshot || "";

    const rows = items.length === 0
      ? `
        <tr>
          <td colspan="10" style="padding:14px 10px;text-align:center;color:#94a3b8;font-size:11px;border-bottom:1px solid #d1d5db;">ยังไม่มีรายการสินค้า</td>
        </tr>
      `
      : items.map((item: any, index: number) => {
        const qty = Number(item.qty) || 0;
        const cost = Number(item.cost) || 0;
        const unit = item.unit || item.Unit || "-";
        const barcode = item.barcode || item.Barcode || "-";
        return `
          <tr>
            <td style="font-size:11px;text-align:center;padding:5px 4px;border-bottom:1px solid #d1d5db;vertical-align:top;">${index + 1}</td>
            <td style="font-size:11px;padding:5px 6px;border-bottom:1px solid #d1d5db;vertical-align:top;color:#1E5088;font-weight:600;">${escapePrintHtml(item.itemcode || "-")}</td>
            <td style="font-size:11px;padding:5px 6px;border-bottom:1px solid #d1d5db;vertical-align:top;color:#475569;">${escapePrintHtml(barcode)}</td>
            <td style="font-size:11px;padding:5px 8px;border-bottom:1px solid #d1d5db;vertical-align:top;word-break:break-word;">${escapePrintHtml(item.itemName || "-")}</td>
            <td style="font-size:11px;padding:5px 6px;border-bottom:1px solid #d1d5db;vertical-align:top;color:#475569;">${escapePrintHtml(item.lot || "-")}</td>
            <td style="font-size:11px;text-align:center;padding:5px 4px;border-bottom:1px solid #d1d5db;vertical-align:top;">${escapePrintHtml(formatThaiShortDate(item.dateExp))}</td>
            <td style="font-size:11px;text-align:center;padding:5px 4px;border-bottom:1px solid #d1d5db;vertical-align:top;">${escapePrintHtml(formatTransferNumber(qty))}</td>
            <td style="font-size:11px;text-align:center;padding:5px 4px;border-bottom:1px solid #d1d5db;vertical-align:top;">${escapePrintHtml(unit)}</td>
            <td style="font-size:11px;text-align:right;padding:5px 4px;border-bottom:1px solid #d1d5db;vertical-align:top;">${escapePrintHtml(formatTransferNumber(cost))}</td>
            <td style="font-size:11px;text-align:right;padding:5px 4px;border-bottom:1px solid #d1d5db;vertical-align:top;font-weight:600;">${escapePrintHtml(formatTransferNumber(qty * cost))}</td>
          </tr>
        `;
      }).join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>ใบโอนสินค้า ${order.transferNo || "#" + order.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Kanit', sans-serif; background: #e2e8f0; }
          .document-print-sheet {
            width: 210mm;
            min-height: 297mm;
            margin: 20px auto;
            background: #ffffff;
            padding: 8mm 10mm 12mm;
            box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
          }
          .document-print-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            border-bottom: 2px solid #1E5088;
            padding-bottom: 12px;
            margin-bottom: 10px;
          }
          .document-print-meta-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
            margin-bottom: 12px;
          }
          .document-print-party-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 12px;
          }
          .document-print-box {
            border: 1px solid #d1d5db;
            border-radius: 10px;
            padding: 10px 12px;
            background: #ffffff;
          }
          .document-print-items {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 12px;
          }
          .document-print-items thead th {
            font-family: 'Kanit', sans-serif;
            font-size: 10px;
            font-weight: 700;
            padding: 6px 4px;
            border-top: 1px solid black;
            border-bottom: 1px solid black;
            background: #f8fafc;
            color: #334155;
          }
          .document-print-footer-block,
          .document-print-signatures {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .document-print-signatures {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 24px;
            margin-top: 18px;
          }
          .document-signature-line {
            border-bottom: 1px solid #94a3b8;
            height: 42px;
            margin-bottom: 6px;
          }
          .document-print-footer-note {
            margin-top: 16px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
          }
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          @media print {
            html, body { background: #ffffff !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .document-print-sheet {
              width: auto !important;
              min-height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
            }
            .document-print-items thead {
              display: table-header-group !important;
            }
            .document-print-items tr,
            .document-print-items td,
            .document-print-items th,
            .document-print-footer-block,
            .document-print-signatures {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="position:fixed;top:16px;right:16px;z-index:999;display:flex;gap:8px;">
          <button onclick="window.print()" style="padding:10px 24px;background:#1E5088;color:#fff;border:none;border-radius:8px;font-family:Kanit;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(30, 80, 136,0.3);">🖨️ พิมพ์</button>
          <button onclick="window.close()" style="padding:10px 18px;background:#f1f5f9;color:#475569;border:none;border-radius:8px;font-family:Kanit;font-size:14px;cursor:pointer;">✕ ปิด</button>
        </div>
        <div class="document-print-sheet">
          <div class="document-print-header">
            <div>
              <div style="font-size:24px;font-weight:800;color:#1E5088;line-height:1.15;">ใบโอนสินค้าระหว่างสาขา</div>
              <div style="font-size:11px;color:#64748b;margin-top:3px;">Professional Stock Transfer Report · A4 Portrait</div>
            </div>
            <div style="text-align:right;min-width:190px;">
              <div style="font-size:18px;font-weight:800;color:#0f172a;">${escapePrintHtml(order.transferNo || `#${order.id}`)}</div>
              <div style="margin-top:6px;display:flex;justify-content:flex-end;gap:6px;flex-wrap:wrap;">
                <span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;background:${modeMeta.chipBackground};color:${modeMeta.chipColor};font-size:10px;font-weight:700;">${escapePrintHtml(modeMeta.label)}</span>
                <span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;background:${statusBackground};color:${statusColor};font-size:10px;font-weight:700;">${escapePrintHtml(statusLabel)}</span>
              </div>
            </div>
          </div>

          <div class="document-print-party-grid">
            <div class="document-print-box">
              <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">สาขาต้นทาง</div>
              <div style="font-size:14px;font-weight:700;color:#0f172a;word-break:break-word;">${escapePrintHtml(order.fromBranchName || "-")}</div>
              <div style="font-size:11px;color:#64748b;margin-top:2px;word-break:break-word;">${escapePrintHtml(order.fromEmail || "-")}</div>
            </div>
            <div class="document-print-box">
              <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">สาขาปลายทาง</div>
              <div style="font-size:14px;font-weight:700;color:#0f172a;word-break:break-word;">${escapePrintHtml(order.toBranchName || "-")}</div>
              <div style="font-size:11px;color:#64748b;margin-top:2px;word-break:break-word;">${escapePrintHtml(order.toEmail || "-")}</div>
              ${destinationDetail ? `<div style="font-size:11px;color:#475569;margin-top:6px;white-space:pre-wrap;word-break:break-word;">${escapePrintHtml(destinationDetail)}</div>` : ""}
            </div>
          </div>

          <div class="document-print-meta-grid">
            <div class="document-print-box" style="background:#f8fafc;">
              <div style="font-size:10px;color:#94a3b8;">ผู้ทำรายการ</div>
              <div style="font-size:12px;font-weight:700;color:#0f172a;margin-top:2px;word-break:break-word;">${escapePrintHtml(order.person || "-")}</div>
            </div>
            <div class="document-print-box" style="background:#f8fafc;">
              <div style="font-size:10px;color:#94a3b8;">วันที่สร้างเอกสาร</div>
              <div style="font-size:12px;font-weight:700;color:#0f172a;margin-top:2px;">${escapePrintHtml(createdDate)}</div>
            </div>
            <div class="document-print-box" style="background:#f8fafc;">
              <div style="font-size:10px;color:#94a3b8;">วันที่เสร็จสิ้น</div>
              <div style="font-size:12px;font-weight:700;color:#0f172a;margin-top:2px;">${escapePrintHtml(completedDate)}</div>
            </div>
          </div>

          <table class="document-print-items">
            <thead>
              <tr>
                <th style="width:30px;text-align:center;">ลำดับ</th>
                <th style="width:72px;text-align:left;">รหัส</th>
                <th style="width:84px;text-align:left;">Barcode</th>
                <th style="text-align:left;">รายการสินค้า</th>
                <th style="width:62px;text-align:left;">Lot</th>
                <th style="width:62px;text-align:center;">หมดอายุ</th>
                <th style="width:52px;text-align:center;">จำนวน</th>
                <th style="width:44px;text-align:center;">หน่วย</th>
                <th style="width:68px;text-align:right;">ต้นทุน/หน่วย</th>
                <th style="width:74px;text-align:right;">รวม</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="document-print-footer-block" style="display:flex;justify-content:flex-end;gap:18px;flex-wrap:wrap;border-top:1px solid #1E5088;padding-top:10px;">
            <div style="min-width:110px;text-align:right;">
              <div style="font-size:10px;color:#64748b;">จำนวนรายการ</div>
              <div style="font-size:14px;font-weight:800;color:#0f172a;">${escapePrintHtml(formatTransferNumber(totalItems))}</div>
            </div>
            <div style="min-width:110px;text-align:right;">
              <div style="font-size:10px;color:#64748b;">จำนวนรวม</div>
              <div style="font-size:14px;font-weight:800;color:#1E5088;">${escapePrintHtml(formatTransferNumber(totalQty))}</div>
            </div>
            <div style="min-width:140px;text-align:right;">
              <div style="font-size:10px;color:#64748b;">มูลค่ารวม</div>
              <div style="font-size:14px;font-weight:800;color:#0f172a;">${escapePrintHtml(formatTransferNumber(totalCost))}</div>
            </div>
          </div>

          <div class="document-print-signatures">
            <div style="text-align:center;">
              <div class="document-signature-line"></div>
              <div style="font-size:11px;color:#334155;font-weight:600;">ผู้ส่งสินค้า</div>
              <div style="font-size:10px;color:#94a3b8;">วันที่ ....../....../......</div>
            </div>
            <div style="text-align:center;">
              <div class="document-signature-line"></div>
              <div style="font-size:11px;color:#334155;font-weight:600;">ผู้รับสินค้า</div>
              <div style="font-size:10px;color:#94a3b8;">วันที่ ....../....../......</div>
            </div>
          </div>

          <div class="document-print-footer-note">เอกสารนี้สร้างโดยระบบ SmileStore POS · ${escapePrintHtml(order.transferNo || `#${order.id}`)}</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ดึงข้อมูลสาขาและการเชื่อม
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/");
          return;
        }

        const payload = jwtDecode<any>(token);
        const userId = Number(payload.idcompany);

        const userRes = await axios.get(`/api/login/logins/${userId}`);
        setCurrentUser(userRes.data);

        // ดึงชื่อผู้ที่ล็อกอินใช้งานจริง (พนักงาน/เจ้าของ) จาก token
        try {
          const empRes = await axios.get(`/api/login/loginuser/${Number(payload.id)}`);
          setLoginName(empRes.data?.name || payload.username || userRes.data?.name || "");
        } catch {
          setLoginName(payload.username || userRes.data?.name || "");
        }

        const connRes = await axios.get(`/api/branchconnection?userId=${userId}&type=all`);
        const accepted = connRes.data.filter((c: any) => c.status === "accepted");

        const branches = accepted.map((c: any) => {
          const isFromUs = c.fromUserId === userId;
          const branch = isFromUs ? c.toUser : c.fromUser;
          const localBranchId = Number(branch?.id);
          const isRemote = !localBranchId || Number.isNaN(localBranchId) || !branch;
          const branchId = isRemote
            ? (c.remoteUserId ? `remote_${c.id}` : null)
            : localBranchId;
          if (!branchId || (!isRemote && localBranchId === userId)) return null;
          return {
            id: branchId,
            company: branch?.company || c.remoteCompany || "",
            email: branch?.email || "",
            name: branch?.name || "",
            branchName: c.branchName || branch?.company || branch?.name || c.remoteCompany || "ไม่ทราบชื่อ",
            connectionId: c.id,
            isRemote: isRemote,
            tunnelUrl: c.tunnelUrl || "",
            apiToken: c.apiToken || "",
            remoteUserId: c.remoteUserId || null
          };
        }).filter((b: any) => b !== null);

        setConnectedBranches(branches);
        setAcceptedConnectionsCount(accepted.length);
        setUnavailableTransferConnectionsCount(Math.max(accepted.length - branches.length, 0));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    fetchSidebarBranches();
  }, []);

  const clearManualProductSelection = () => {
    setManualSearchQuery("");
    setManualScannedProduct(null);
    setManualSelectedLotId(null);
    setManualTransferQty("");
  };

  const resetManualTransferForm = () => {
    setManualDestinationName("");
    setManualDestinationDetail("");
    setManualTransferItems([]);
    clearManualProductSelection();
  };

  const closeManualTransferModal = () => {
    if (manualSubmitting) return;
    setShowManualTransfer(false);
    resetManualTransferForm();
  };

  const handleManualSearch = async () => {
    if (!manualSearchQuery.trim() || !currentUser?.id) return;

    setManualSearchLoading(true);
    setManualScannedProduct(null);
    setManualSelectedLotId(null);
    setManualTransferQty("");

    try {
      const res = await axios.get("/api/stocktransfer/search", {
        params: {
          q: manualSearchQuery.trim(),
          company: currentUser.id
        }
      });

      const results = (res.data || []).map((item: any) => normalizeManualProduct(item));
      if (results.length === 0) {
        toast.info(<div style={{ fontFamily: "Kanit" }}>ไม่พบสินค้าใน stock สาขาต้นทาง</div>);
      } else if (results.length === 1) {
        setManualScannedProduct(results[0]);
      } else {
        setManualScannedProduct({ multipleResults: results });
      }
    } catch (error) {
      console.error("Manual search failed:", error);
      toast.error(<div style={{ fontFamily: "Kanit" }}>ค้นหาสินค้า Manual ไม่สำเร็จ</div>);
    } finally {
      setManualSearchLoading(false);
    }
  };

  const selectManualProduct = (product: any) => {
    setManualScannedProduct(normalizeManualProduct(product));
    setManualSelectedLotId(null);
    setManualTransferQty("");
  };

  const addManualTransferItem = () => {
    if (!manualScannedProduct || manualScannedProduct.multipleResults) return;

    // สินค้าที่ตั้งค่า "ไม่มี Lot" ไม่ต้องเลือก lot — ระบบปันส่วนให้เองแบบใกล้หมดอายุก่อน
    const lotRequired = isLotRequired(manualScannedProduct);
    if (lotRequired && !manualSelectedLotId) return;

    const transferQty = parseFloat(manualTransferQty);
    if (!transferQty || transferQty <= 0) {
      toast.error(<div style={{ fontFamily: "Kanit" }}>กรุณาระบุจำนวนโอน Manual ให้มากกว่า 0</div>);
      return;
    }

    // ยอดของสินค้าตัวนี้ที่ถูกจองไว้ในตะกร้าแล้ว (ต่อ lot)
    const reserved = new Map<number, number>();
    for (const item of manualTransferItems) {
      if (String(item.itemcode || "") !== String(manualScannedProduct.code || "")) continue;
      const lotKey = Number(item.lotId);
      reserved.set(lotKey, (reserved.get(lotKey) || 0) + (Number(item.qty) || 0));
    }

    let allocations: { lot: any; qty: number }[] = [];

    if (lotRequired) {
      const selectedLot = manualScannedProduct.mainLots?.find((lot: any) => lot.id === manualSelectedLotId);
      if (!selectedLot) return;

      const availableQty = (parseFloat(String(selectedLot.balance)) || 0) - (reserved.get(Number(manualSelectedLotId)) || 0);
      if (transferQty > availableQty) {
        toast.error(
          <div style={{ fontFamily: "Kanit" }}>
            จำนวนที่เลือกเกินยอดคงเหลือของ Lot นี้ ({formatTransferNumber(availableQty)})
          </div>
        );
        return;
      }
      allocations = [{ lot: selectedLot, qty: transferQty }];
    } else {
      const result = allocateFromLots(manualScannedProduct.mainLots || [], transferQty, reserved);
      if (result.shortage > 0) {
        toast.error(
          <div style={{ fontFamily: "Kanit" }}>
            จำนวนที่เลือกเกินยอดคงเหลือ (ขาดอีก {formatTransferNumber(result.shortage)})
          </div>
        );
        return;
      }
      allocations = result.allocations;
    }

    setManualTransferItems(prev => {
      const next = [...prev];
      for (const allocation of allocations) {
        const existingIndex = next.findIndex(item => item.lotId === allocation.lot.id);
        if (existingIndex === -1) {
          next.push({
            lotId: allocation.lot.id,
            itemcode: manualScannedProduct.code,
            itemName: manualScannedProduct.ProductName,
            Barcode: manualScannedProduct.Barcode,
            Unit: manualScannedProduct.Unit,
            lot: allocation.lot.lot || NO_LOT_VALUE,
            dateExp: allocation.lot.dateExp,
            balance: allocation.lot.balance,
            cost: allocation.lot.newCost || manualScannedProduct.CostActual || 0,
            qty: allocation.qty
          });
        } else {
          next[existingIndex] = {
            ...next[existingIndex],
            qty: (Number(next[existingIndex].qty) || 0) + allocation.qty
          };
        }
      }
      return next;
    });

    clearManualProductSelection();
    toast.success(<div style={{ fontFamily: "Kanit" }}>เพิ่มรายการ Manual สำเร็จ</div>);
  };

  const removeManualItem = (index: number) => {
    setManualTransferItems(prev => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleManualTransfer = async () => {
    const destinationName = manualDestinationName.trim();
    const destinationDetail = manualDestinationDetail.trim();

    if (!currentUser?.id) return;

    if (!destinationName) {
      toast.error(<div style={{ fontFamily: "Kanit" }}>กรุณาระบุสาขาปลายทาง Manual</div>);
      return;
    }

    if (manualTransferItems.length === 0) {
      toast.error(<div style={{ fontFamily: "Kanit" }}>กรุณาเพิ่มสินค้าในรายการ Manual</div>);
      return;
    }

    setManualSubmitting(true);

    try {
      const payload = {
        transferMode: "manual",
        fromUserId: currentUser.id,
        toUserId: 0,
        fromCompany: currentUser.company || "",
        toCompany: destinationName,
        fromBranchNameSnapshot: currentUser.company || "",
        fromBranchEmailSnapshot: currentUser.email || "",
        toBranchNameSnapshot: destinationName,
        toBranchEmailSnapshot: "",
        toBranchDetailSnapshot: destinationDetail,
        items: manualTransferItems.map((item: any) => ({
          lotId: item.lotId,
          itemcode: item.itemcode,
          itemName: item.itemName,
          lot: item.lot,
          dateExp: item.dateExp,
          qty: item.qty,
          cost: item.cost
        })),
        person: loginName || currentUser.email || currentUser.name || "Manual Transfer"
      };

      const res = await axios.post("/api/stocktransfer", payload);
      const createdTransfer = res.data?.data?.transfer || {};
      const createdItems = manualTransferItems.map((item: any, index: number) => {
        const apiItem = res.data?.data?.transferItems?.[index] || {};
        return {
          ...item,
          ...apiItem,
          barcode: apiItem.barcode || item.Barcode || "",
          unit: apiItem.unit || item.Unit || ""
        };
      });

      const orderForPrint = {
        ...createdTransfer,
        items: createdItems,
        person: createdTransfer.person || loginName || currentUser.email || currentUser.name || "",
        fromBranchName: createdTransfer.fromBranchNameSnapshot || currentUser.company || "-",
        fromEmail: createdTransfer.fromBranchEmailSnapshot || currentUser.email || "",
        toBranchName: createdTransfer.toBranchNameSnapshot || destinationName,
        toEmail: createdTransfer.toBranchEmailSnapshot || "",
        toBranchDetail: createdTransfer.toBranchDetailSnapshot || destinationDetail,
        transferMode: createdTransfer.transferMode || "manual"
      };

      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>บันทึก Manual สำเร็จ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 14 }}>เลขที่ใบโอน {createdTransfer.transferNo || "-"}</div>,
        duration: 5000,
      });

      setShowManualTransfer(false);
      resetManualTransferForm();
      printTransferDocument(orderForPrint);
    } catch (error: any) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>บันทึก Manual ไม่สำเร็จ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 14 }}>{error.response?.data?.error || "ไม่สามารถบันทึกโอน Manual ได้"}</div>,
        duration: 5000,
      });
    } finally {
      setManualSubmitting(false);
    }
  };

  // เพิ่มสาขาเข้ารายการโอน
  const addBranch = () => {
    if (!branchDropdownValue) {
      toast.error(<div style={{ fontFamily: "Kanit" }}>กรุณาเลือกสาขาปลายทาง</div>);
      return;
    }
    const branch = connectedBranches.find(b => String(b.id) === String(branchDropdownValue));
    if (!branch) {
      toast.error(<div style={{ fontFamily: "Kanit" }}>ไม่พบข้อมูลสาขาที่เลือก</div>);
      return;
    }
    if (selectedBranches.find(b => String(b.id) === String(branch.id))) {
      toast.info(<div style={{ fontFamily: "Kanit" }}>สาขานี้ถูกเลือกแล้ว</div>);
      return;
    }
    setSelectedBranches((prev) => [...prev, branch]);
    setBranchDropdownValue("");
    setScannedProduct(null);
    setBranchTransferQty({});
  };

  // ลบสาขาออกจากรายการโอน
  const removeBranch = (branchId: number) => {
    setSelectedBranches(selectedBranches.filter(b => b.id !== branchId));
    setTransferItems(transferItems.filter(item => item.toBranchId !== branchId));
    const newQty = { ...branchTransferQty };
    delete newQty[branchId];
    setBranchTransferQty(newQty);
  };

  // Scan barcode / ค้นหาสินค้า
  const handleSearch = async () => {
    if (!searchQuery.trim() || !currentUser || selectedBranches.length === 0) {
      if (selectedBranches.length === 0) {
        toast.error(<div style={{ fontFamily: "Kanit" }}>กรุณาเลือกสาขาปลายทางก่อน</div>);
      }
      return;
    }

    setSearchLoading(true);
    setScannedProduct(null);
    setBranchTransferQty({});
    setSelectedLotId(null);

    try {
      const localBranches = selectedBranches.filter((b: any) => !b.isRemote);
      const remoteBranchList = selectedBranches.filter((b: any) => b.isRemote).map((b: any) => ({
        branchId: b.id,
        tunnelUrl: b.tunnelUrl,
        apiToken: b.apiToken,
        remoteUserId: b.remoteUserId,
        branchName: b.branchName || b.company || "",
        remoteCompany: b.company || ""
      }));

      const res = await axios.post("/api/stocktransfer/branch-lookup", {
        query: searchQuery.trim(),
        mainCompanyId: currentUser.id,
        branchIds: localBranches.map((b: any) => b.id),
        remoteBranches: remoteBranchList
      });

      if (res.data.length === 0) {
        toast.info(<div style={{ fontFamily: "Kanit" }}>ไม่พบสินค้า</div>);
      } else if (res.data.length === 1) {
        setScannedProduct(res.data[0]);
      } else {
        setScannedProduct({ multipleResults: res.data });
      }
    } catch (error) {
      console.error("Error searching:", error);
      toast.error(<div style={{ fontFamily: "Kanit" }}>ค้นหาล้มเหลว</div>);
    } finally {
      setSearchLoading(false);
    }
  };

  // เลือกสินค้าจากหลายรายการ
  const selectProduct = (product: any) => {
    setScannedProduct(product);
    setBranchTransferQty({});
    setSelectedLotId(null);
  };

  // เพิ่มรายการโอน
  const addToTransferList = () => {
    if (!scannedProduct || scannedProduct.multipleResults) return;

    // สินค้าที่ตั้งค่า "ไม่มี Lot" ไม่ต้องเลือก lot — ระบบปันส่วนให้เองแบบใกล้หมดอายุก่อน
    const lotRequired = isLotRequired(scannedProduct);
    if (lotRequired && !selectedLotId) return;

    const selectedLot = lotRequired
      ? scannedProduct.mainLots?.find((l: any) => l.id === selectedLotId)
      : null;
    if (lotRequired && !selectedLot) return;

    let totalTransfer = 0;
    const branchEntries: any[] = [];

    for (const branch of selectedBranches) {
      const qty = branchTransferQty[branch.id] || 0;
      if (qty > 0) {
        totalTransfer += qty;
        const branchBalance = scannedProduct.branchBalances?.find((bb: any) => bb.branchId === branch.id);
        branchEntries.push({
          toBranchId: branch.id,
          toBranchName: branch.branchName || branch.company,
          toBranchEmail: branch.email,
          qty: qty,
          receiverProductCode: branchBalance?.productCode || null,
          receiverProductName: branchBalance?.productName || null,
          receiverBarcode: branchBalance?.barcode || null,
          receiverBalance: branchBalance?.totalBalance || 0
        });
      }
    }

    if (branchEntries.length === 0) {
      toast.error(<div style={{ fontFamily: "Kanit" }}>กรุณาระบุจำนวนโอนอย่างน้อย 1 สาขา</div>);
      return;
    }

    // ยอดของสินค้าตัวนี้ที่ถูกจองไว้ในตะกร้าแล้ว (ต่อ lot) — กันเพิ่มซ้ำจนเกินของจริง
    const reserved = new Map<number, number>();
    for (const item of transferItems) {
      if (String(item.itemcode || "") !== String(scannedProduct.code || "")) continue;
      const lotKey = Number(item.lotId);
      reserved.set(lotKey, (reserved.get(lotKey) || 0) + (Number(item.qty) || 0));
    }

    const newItems: any[] = [];

    if (lotRequired) {
      const lotBalance = parseFloat(String(selectedLot.balance)) || 0;
      const availableQty = lotBalance - (reserved.get(Number(selectedLotId)) || 0);

      if (totalTransfer > availableQty) {
        toast.error(<div style={{ fontFamily: "Kanit" }}>จำนวนรวมทุกสาขา ({totalTransfer}) เกินยอดคงเหลือ ({formatTransferNumber(availableQty)})</div>);
        return;
      }

      const existingBranchIds = transferItems
        .filter(item => item.lotId === selectedLotId)
        .map(item => item.toBranchId);

      for (const entry of branchEntries) {
        if (existingBranchIds.includes(entry.toBranchId)) {
          toast.error(<div style={{ fontFamily: "Kanit" }}>Lot นี้มีในรายการสาขา {entry.toBranchName} แล้ว</div>);
          return;
        }
      }

      newItems.push(...branchEntries.map(entry => ({
        lotId: selectedLotId,
        itemcode: scannedProduct.code,
        itemName: scannedProduct.ProductName,
        Barcode: scannedProduct.Barcode,
        Unit: scannedProduct.Unit,
        lot: selectedLot.lot,
        dateExp: selectedLot.dateExp,
        balance: selectedLot.balance,
        cost: selectedLot.newCost || scannedProduct.CostActual || 0,
        ...entry
      })));
    } else {
      // สินค้าไม่ใช้ lot — ปันส่วนยอดของแต่ละสาขาลง lot จริงตามลำดับ FEFO → FIFO
      // (แถวที่บันทึกยังผูก lotId จริงเสมอ เพื่อให้บัญชีสต็อกฝั่งผู้ส่งไม่หลุด)
      for (const entry of branchEntries) {
        const { allocations, shortage } = allocateFromLots(scannedProduct.mainLots || [], entry.qty, reserved);
        if (shortage > 0) {
          toast.error(<div style={{ fontFamily: "Kanit" }}>ยอดคงเหลือไม่พอสำหรับสาขา {entry.toBranchName} (ขาดอีก {formatTransferNumber(shortage)})</div>);
          return;
        }
        for (const allocation of allocations) {
          const lotKey = Number(allocation.lot.id);
          reserved.set(lotKey, (reserved.get(lotKey) || 0) + allocation.qty);
          newItems.push({
            lotId: allocation.lot.id,
            itemcode: scannedProduct.code,
            itemName: scannedProduct.ProductName,
            Barcode: scannedProduct.Barcode,
            Unit: scannedProduct.Unit,
            lot: allocation.lot.lot || NO_LOT_VALUE,
            dateExp: allocation.lot.dateExp,
            balance: allocation.lot.balance,
            cost: allocation.lot.newCost || scannedProduct.CostActual || 0,
            ...entry,
            qty: allocation.qty
          });
        }
      }
    }

    setTransferItems([...transferItems, ...newItems]);
    setSearchQuery("");
    setScannedProduct(null);
    setBranchTransferQty({});
    setSelectedLotId(null);
    toast.success(<div style={{ fontFamily: "Kanit" }}>เพิ่มรายการสำเร็จ</div>);
  };

  // ลบรายการโอน
  const removeItem = (index: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== index));
  };

  // ยืนยันการโอน
  const handleTransfer = async () => {
    if (transferItems.length === 0) {
      toast.error(<div style={{ fontFamily: "Kanit" }}>กรุณาเพิ่มสินค้าในรายการ</div>);
      return;
    }

    setSubmitting(true);

    // Pre-check connection
    try {
      const branchIdsInTransfer = [...new Set(transferItems.map(item => String(item.toBranchId)))];
      const branchesToCheck = branchIdsInTransfer.map(id => {
        const branch = selectedBranches.find(b => String(b.id) === id);
        return branch ? {
          branchName: branch.branchName || branch.company || "ไม่ทราบ",
          tunnelUrl: branch.tunnelUrl || "",
          apiToken: branch.apiToken || "",
          remoteUserId: branch.remoteUserId || null,
          isRemote: !!branch.isRemote
        } : null;
      }).filter(Boolean);

      const checkRes = await axios.post("/api/stocktransfer/check-connection", { branches: branchesToCheck });
      const { allOk, failed } = checkRes.data;

      if (!allOk && failed?.length > 0) {
        setSubmitting(false);
        const failedNames = failed.map((f: any) => `${f.branchName} (${f.error})`).join(", ");
        toast.error(
          <div style={{ fontFamily: "Kanit", fontSize: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>ไม่สามารถยืนยันการโอนได้</div>
            <div>กรุณาตรวจสอบ Internet หรือการเชื่อมต่อสาขาต้นทางและปลายทาง</div>
            <div style={{ fontSize: 12, color: "#dc2626", marginTop: 6 }}>
              สาขาที่เชื่อมต่อไม่ได้: {failedNames}
            </div>
          </div>,
          { duration: 8000 }
        );
        return;
      }
    } catch (checkError) {
      console.error("Pre-transfer check error:", checkError);
      setSubmitting(false);
      toast.error(
        <div style={{ fontFamily: "Kanit" }}>
          <div style={{ fontWeight: 600 }}>ไม่สามารถยืนยันการโอนได้</div>
          <div>กรุณาตรวจสอบ Internet หรือการเชื่อมต่อสาขาต้นทางและปลายทาง</div>
        </div>,
        { duration: 8000 }
      );
      return;
    }

    try {
      const byBranch: Record<string, any[]> = {};
      for (const item of transferItems) {
        const key = String(item.toBranchId);
        if (!byBranch[key]) byBranch[key] = [];
        byBranch[key].push(item);
      }

      const results: any[] = [];
      for (const [branchIdStr, items] of Object.entries(byBranch)) {
        const branch = selectedBranches.find(b => String(b.id) === branchIdStr);

        const payload: any = {
          fromUserId: currentUser.id,
          fromCompany: currentUser.company,
          toCompany: branch?.company || "",
          items: items.map((item: any) => ({
            lotId: item.lotId,
            itemcode: item.itemcode,
            itemName: item.itemName,
            lot: item.lot,
            dateExp: item.dateExp,
            qty: item.qty,
            cost: item.cost
          })),
          person: loginName || currentUser.email
        };

        if (branch?.isRemote) {
          payload.isRemote = true;
          payload.tunnelUrl = branch.tunnelUrl;
          payload.apiToken = branch.apiToken;
          payload.remoteUserId = branch.remoteUserId;
        } else {
          payload.toUserId = branch?.id;
        }

        const res = await axios.post("/api/stocktransfer", payload);
        results.push({
          branch: branch?.branchName || branch?.company,
          transferNo: res.data.data.transfer.transferNo,
          isRemote: !!branch?.isRemote
        });
      }

      const summary = results.map(r =>
        `${r.branch}${r.isRemote ? " (Remote)" : ""}: ${r.transferNo}`
      ).join(", ");
      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 14 }}>โอนสินค้าเรียบร้อย ({summary})</div>,
        duration: 5000,
      });

      setTransferItems([]);
      setScannedProduct(null);
      setBranchTransferQty({});
    } catch (error: any) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 14 }}>{error.response?.data?.error || "ไม่สามารถโอนได้"}</div>,
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // หาสาขาที่ยังไม่ได้เลือก
  const availableBranches = connectedBranches.filter(
    (b) => !selectedBranches.find((s) => String(s.id) === String(b.id))
  );

  return (
    <div style={{ paddingLeft: 15, paddingRight: 15 }}>
      <Toaster richColors position="top-right" />

      <div className="row justify-content-start">
        <HeadTab />
      </div>

      <div className="row justify-content-start">
        <div className="col-sm-1">
          <MenuTab_Small />
        </div>

        <div className="col-sm-11">
          <div className='col shadow-sm rounded border' style={{ backgroundColor: "white", minHeight: "90vh", padding: 20 }}>

      <div className="container-fluid" style={{ padding: 20 }}>
        {/* หัวข้อ */}
        <div className="mb-4 d-flex align-items-center justify-content-between flex-wrap" style={{
          backgroundColor: "#F3F8FC",
          padding: 15,
          borderRadius: 12,
          border: "1px solid #CCDFF1",
          gap: 12
        }}>
          <button
            type="button"
            onClick={() => setShowManualTransfer(true)}
            style={{
              borderRadius: 12,
              border: "1px solid #A6C8E7",
              background: "linear-gradient(180deg, #ffffff 0%, #E5EEF8 100%)",
              color: "#1E5088",
              fontFamily: "kanit_B",
              fontSize: 13,
              padding: "10px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 6px 16px rgba(42, 106, 170, 0.12)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>📝</span>
            <span>โอนสาขา Manual</span>
          </button>
          <div style={{ fontFamily: "kanit_B", fontSize: 22, color: "#1E5088", flex: 1, textAlign: "center", minWidth: 220 }}>📦 โอนสินค้าระหว่างสาขา</div>
          <button
            onClick={() => { setShowHistory(true); fetchTransferHistory(); }}
            style={{
              fontFamily: "Kanit",
              fontSize: 13,
              backgroundColor: "#1E5088",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 6px rgba(30, 80, 136,0.3)",
              flexShrink: 0
            }}
          >
            📋 ประวัติการโอน
          </button>
        </div>

        {/* === Transfer History Modal === */}
        {showHistory && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999,
            display: "flex", justifyContent: "center", alignItems: "center"
          }} onClick={() => setShowHistory(false)}>
            <div style={{
              backgroundColor: "#fff", borderRadius: 16, width: "90%", maxWidth: 900,
              maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)"
            }} onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div style={{
                padding: "20px 24px", borderBottom: "1px solid #e2e8f0",
                background: "linear-gradient(135deg, #1E5088 0%, #3E86C7 100%)",
                color: "#fff", borderRadius: "16px 16px 0 0",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <div>
                  <div style={{ fontFamily: "kanit_B", fontSize: 20 }}>📋 ประวัติการโอนสินค้า</div>
                  <div style={{ fontFamily: "Kanit", fontSize: 12, opacity: 0.8 }}>รายการโอนทั้งหมด {transferHistory.length} ออเดอร์</div>
                </div>
                <button onClick={() => setShowHistory(false)} style={{
                  background: "rgba(255,255,255,0.2)", border: "none", color: "#fff",
                  width: 36, height: 36, borderRadius: "50%", cursor: "pointer",
                  fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center"
                }}>✕</button>
              </div>

              {/* Body */}
              <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1 }}>
                {historyLoading ? (
                  <div style={{ textAlign: "center", padding: 40, fontFamily: "Kanit", color: "#64748b" }}>
                    🔄 กำลังโหลด...
                  </div>
                ) : transferHistory.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, fontFamily: "Kanit", color: "#94a3b8" }}>
                    ยังไม่มีประวัติการโอน
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {transferHistory.map((order: any) => {
                      const isExpanded = expandedOrderId === order.id;
                      const modeMeta = getTransferModeMeta(order);
                      const statusColor = order.status === "completed" ? "#147F56" : order.status === "failed" ? "#dc2626" : "#f59e0b";
                      const statusLabel = order.status === "completed" ? "สำเร็จ" : order.status === "failed" ? "ไม่สำเร็จ" : order.status === "pending_remote" ? "รอส่ง Remote" : order.status;
                      const totalItems = order.items?.length || 0;
                      const totalQty = order.items?.reduce((sum: number, item: any) => sum + (item.qty || 0), 0) || 0;

                      return (
                        <div key={order.id} style={{
                          border: `1px solid ${isExpanded ? "#3E86C7" : "#e2e8f0"}`,
                          borderRadius: 12,
                          overflow: "hidden",
                          transition: "all 0.2s",
                          boxShadow: isExpanded ? "0 4px 12px rgba(62, 134, 199,0.15)" : "0 1px 3px rgba(0,0,0,0.04)"
                        }}>
                          {/* Order Header - Clickable */}
                          <div
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            style={{
                              padding: "14px 18px", cursor: "pointer",
                              backgroundColor: isExpanded ? "#F3F8FC" : "#fafafa",
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                              transition: "background-color 0.15s"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                              <div style={{
                                width: 42, height: 42, borderRadius: 10,
                                backgroundColor: statusColor + "18",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 20
                              }}>
                                {order.status === "completed" ? "✅" : order.status === "failed" ? "❌" : "⏳"}
                              </div>
                              <div>
                                <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#1e293b" }}>
                                  {order.transferNo || `#${order.id}`}
                                  <span style={{ fontSize: 10, color: modeMeta.chipColor, marginLeft: 6, backgroundColor: modeMeta.chipBackground, padding: "2px 6px", borderRadius: 10 }}>{modeMeta.label}</span>
                                </div>
                                <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#64748b", display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 2 }}>
                                  <span>📤 <strong>{order.fromBranchName || "-"}</strong></span>
                                  <span>➡️</span>
                                  <span>📥 <strong>{order.toBranchName || "-"}</strong></span>
                                </div>
                                {order.toBranchDetail && (
                                  <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#475569", marginTop: 3, whiteSpace: "pre-wrap" }}>
                                    {order.toBranchDetail}
                                  </div>
                                )}
                                <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#94a3b8", display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 1 }}>
                                  <span>ผู้โอน: {order.person || "-"}</span>
                                  <span>· วันที่โอน: {new Date(order.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                  {order.completedAt && <span>· วันที่รับ: {new Date(order.completedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}
                                  <span>· {totalItems} รายการ · {totalQty} ชิ้น</span>
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <button
                                title="พิมพ์ใบโอนสินค้า"
                                onClick={(e) => { e.stopPropagation(); printTransferDocument(order); }}
                                style={{
                                  background: "#F3F8FC", border: "1px solid #CCDFF1", color: "#1E5088",
                                  width: 30, height: 30, borderRadius: 8, cursor: "pointer",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 14, transition: "all 0.15s"
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#1E5088"; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "#F3F8FC"; e.currentTarget.style.color = "#1E5088"; }}
                              >🖨️</button>
                              <span style={{
                                fontFamily: "Kanit", fontSize: 11, fontWeight: 600,
                                color: statusColor, backgroundColor: statusColor + "15",
                                padding: "3px 10px", borderRadius: 20
                              }}>{statusLabel}</span>
                              <span style={{ fontSize: 14, color: "#94a3b8", transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                            </div>
                          </div>

                          {/* Expanded Items */}
                          {isExpanded && order.items && (
                            <div style={{ borderTop: "1px solid #e2e8f0" }}>
                              <div style={{
                                padding: "10px 18px", backgroundColor: "#f8fafc",
                                display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr",
                                gap: 8, fontFamily: "kanit_B", fontSize: 11, color: "#64748b"
                              }}>
                                <div>รหัส</div>
                                <div>ชื่อสินค้า</div>
                                <div>Lot</div>
                                <div style={{ textAlign: "center" }}>จำนวน</div>
                                <div style={{ textAlign: "right" }}>ต้นทุน</div>
                              </div>
                              {order.items.map((item: any, idx: number) => (
                                <div key={item.id || idx} style={{
                                  padding: "10px 18px",
                                  display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr",
                                  gap: 8, fontFamily: "Kanit", fontSize: 12,
                                  borderBottom: idx < order.items.length - 1 ? "1px solid #f1f5f9" : "none",
                                  backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa"
                                }}>
                                  <div style={{ color: "#1E5088", fontWeight: 500 }}>{item.itemcode}</div>
                                  <div style={{ color: "#334155" }}>{item.itemName}</div>
                                  <div style={{ color: "#64748b" }}>{item.lot || "-"}</div>
                                  <div style={{ textAlign: "center", fontWeight: 600, color: "#0f172a" }}>{item.qty}</div>
                                  <div style={{ textAlign: "right", color: "#64748b" }}>{item.cost ? `฿${Number(item.cost).toLocaleString()}` : "-"}</div>
                                </div>
                              ))}
                              {/* Footer */}
                              <div style={{
                                padding: "10px 18px", backgroundColor: "#F3F8FC",
                                display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6,
                                fontFamily: "Kanit", fontSize: 12, color: "#475569"
                              }}>
                                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                  <span>ผู้ทำรายการ: <strong>{order.person || "-"}</strong></span>
                                  <span>สาขาผู้ส่ง: <strong>{order.fromBranchName || "-"}</strong> ({order.fromEmail || "-"})</span>
                                  <span>สาขาผู้รับ: <strong>{order.toBranchName || "-"}</strong> ({order.toEmail || "-"})</span>
                                  {order.toBranchDetail && <span>รายละเอียดปลายทาง: <strong>{order.toBranchDetail}</strong></span>}
                                </div>
                                <div>รวม: <strong style={{ color: "#1E5088" }}>{totalQty} ชิ้น</strong></div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showManualTransfer && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15,23,42,0.55)",
              zIndex: 10000,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: 16
            }}
            onClick={closeManualTransferModal}
          >
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 18,
                  width: "98%",
                  maxWidth: 1280,
                  height: "90vh",
                  maxHeight: "90vh",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 30px 60px rgba(15, 23, 42, 0.35)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                padding: "18px 22px",
                borderBottom: "1px solid #E5EEF8",
                background: "linear-gradient(135deg, #1E5088 0%, #6BA3D8 100%)",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12
              }}>
                <div>
                  <div style={{ fontFamily: "kanit_B", fontSize: 22 }}>📝 โอนสาขา Manual</div>
                  <div style={{ fontFamily: "Kanit", fontSize: 12, opacity: 0.88 }}>
                    ปลายทางพิมพ์เอง · ตัด lot ตามที่เลือก · บันทึกแล้วพิมพ์ A4 ได้ทันที
                  </div>
                </div>
                <button
                  onClick={closeManualTransferModal}
                  disabled={manualSubmitting}
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    border: "none",
                    color: "#fff",
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    cursor: manualSubmitting ? "default" : "pointer",
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: 20, overflowY: "auto", flex: 1, background: "#f8fafc" }}>
                <div className="row g-3 mb-4">
                  <div className="col-md-5">
                    <div style={{
                      backgroundColor: "#F3F8FC",
                      padding: 16,
                      borderRadius: 14,
                      border: "1px solid #CCDFF1",
                      height: "100%"
                    }}>
                      <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#173F6B", marginBottom: 10 }}>📤 สาขาต้นทาง</div>
                      <div style={{ fontFamily: "Kanit", fontSize: 18, fontWeight: 700, color: "#102C4C" }}>{currentUser?.company || "-"}</div>
                      <div style={{ fontFamily: "Kanit", fontSize: 13, color: "#64748b", marginTop: 4 }}>{loginName || currentUser?.email || "-"}</div>
                    </div>
                  </div>
                  <div className="col-md-7">
                    <div style={{
                      backgroundColor: "#fffbeb",
                      padding: 16,
                      borderRadius: 14,
                      border: "1px solid #fde68a",
                      height: "100%"
                    }}>
                      <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#92400e", marginBottom: 10 }}>📥 สาขาปลายทาง (พิมพ์เอง)</div>
                      <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="ชื่อสาขาปลายทาง / ร้าน / หน่วยงาน"
                        style={{ fontFamily: "Kanit", fontSize: 14 }}
                        value={manualDestinationName}
                        onChange={(e) => setManualDestinationName(e.target.value)}
                      />
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="รายละเอียดเพิ่มเติม เช่น ผู้ติดต่อ, ที่อยู่, หมายเหตุสำหรับพิมพ์"
                        style={{ fontFamily: "Kanit", fontSize: 13, resize: "vertical" }}
                        value={manualDestinationDetail}
                        onChange={(e) => setManualDestinationDetail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4" style={{
                  backgroundColor: "#fff",
                  padding: 16,
                  borderRadius: 14,
                  border: "1px solid #e2e8f0"
                }}>
                  <div style={{ fontFamily: "kanit_B", fontSize: 14, marginBottom: 10, color: "#334155" }}>🔎 ค้นหาสินค้า Manual</div>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="พิมพ์ชื่อสินค้า / รหัสสินค้า / Barcode"
                      style={{ fontFamily: "Kanit", fontSize: 15 }}
                      value={manualSearchQuery}
                      onChange={(e) => setManualSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleManualSearch}
                      disabled={manualSearchLoading || !currentUser?.id}
                      style={{ fontFamily: "Kanit" }}
                    >
                      {manualSearchLoading ? "🔄" : "ค้นหา"}
                    </button>
                  </div>
                </div>

                {manualScannedProduct?.multipleResults && (
                  <div className="mb-4" style={{
                    backgroundColor: "#fff",
                    padding: 16,
                    borderRadius: 14,
                    border: "1px solid #CCDFF1"
                  }}>
                    <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#1E5088", marginBottom: 10 }}>
                      พบ {manualScannedProduct.multipleResults.length} รายการสำหรับ Manual
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {manualScannedProduct.multipleResults.map((product: any, index: number) => (
                        <button
                          key={`${product.code || "manual"}-${index}`}
                          type="button"
                          onClick={() => selectManualProduct(product)}
                          style={{
                            textAlign: "left",
                            border: "1px solid #E5EEF8",
                            background: "#f8fbff",
                            borderRadius: 10,
                            padding: "10px 12px",
                            cursor: "pointer"
                          }}
                        >
                          <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#1e293b" }}>{product.ProductName}</div>
                          <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b" }}>
                            รหัส: {product.code || "-"} | Barcode: {product.Barcode || "-"} | คงเหลือ: {formatTransferNumber(product.mainTotalBalance)} {product.Unit || ""}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {manualScannedProduct && !manualScannedProduct.multipleResults && (
                  <div className="mb-4" style={{
                    backgroundColor: "#fff",
                    padding: 18,
                    borderRadius: 14,
                    border: "2px solid #CCDFF1"
                  }}>
                    <div style={{ fontFamily: "kanit_B", fontSize: 16, color: "#1E5088", marginBottom: 14 }}>
                      📦 สินค้าที่เลือกสำหรับ Manual: {manualScannedProduct.ProductName}
                    </div>
                    <div className="row g-3">
                      <div className="col-md-7">
                        <div style={{
                          backgroundColor: "#F3F8FC",
                          padding: 16,
                          borderRadius: 12,
                          border: "1px solid #CCDFF1",
                          height: "100%"
                        }}>
                          <div style={{ fontFamily: "Kanit", fontSize: 13, marginBottom: 6 }}><span style={{ color: "#64748b" }}>รหัสสินค้า:</span> <strong>{manualScannedProduct.code || "-"}</strong></div>
                          <div style={{ fontFamily: "Kanit", fontSize: 13, marginBottom: 6 }}><span style={{ color: "#64748b" }}>Barcode:</span> {manualScannedProduct.Barcode || "-"}</div>
                          <div style={{ fontFamily: "Kanit", fontSize: 13, marginBottom: 12 }}>
                            <span style={{ color: "#64748b" }}>ยอดคงเหลือรวม:</span>{" "}
                            <span style={{ fontSize: 18, fontWeight: 700, color: "#173F6B" }}>
                              {formatTransferNumber(manualScannedProduct.mainTotalBalance)} {manualScannedProduct.Unit || ""}
                            </span>
                          </div>

                          {!isLotRequired(manualScannedProduct) ? (
                            <div style={{
                              fontFamily: "Kanit", fontSize: 12, color: "#b45309",
                              background: "#fffbeb", border: "1px solid #fcd34d",
                              borderRadius: 10, padding: "9px 10px"
                            }}>
                              🏷️ {NO_LOT_LABEL} — สินค้านี้ตั้งค่าไม่ติดตาม Lot
                              <div style={{ fontSize: 11, color: "#92400e", marginTop: 3 }}>
                                ระบุแค่จำนวน ระบบจะตัดจากล็อตที่ใกล้หมดอายุก่อนให้อัตโนมัติ
                              </div>
                            </div>
                          ) : (<>
                          <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#475569", marginBottom: 8 }}>เลือก Lot ที่จะตัด:</div>
                          {manualScannedProduct.mainLots?.length ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {manualScannedProduct.mainLots.map((lot: any) => (
                                <div
                                  key={lot.id}
                                  onClick={() => setManualSelectedLotId(lot.id)}
                                  style={{
                                    padding: "9px 10px",
                                    borderRadius: 10,
                                    border: manualSelectedLotId === lot.id ? "2px solid #3E86C7" : "1px solid #d1d5db",
                                    backgroundColor: manualSelectedLotId === lot.id ? "#E5EEF8" : "#fff",
                                    cursor: "pointer"
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                    <span style={{ fontFamily: "Kanit", fontSize: 12, color: "#1e293b" }}>Lot: {lot.lot || "-"}</span>
                                    <span style={{ fontFamily: "kanit_B", fontSize: 12, color: "#173F6B" }}>{formatTransferNumber(lot.balance)} {manualScannedProduct.Unit || ""}</span>
                                  </div>
                                  <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#64748b", marginTop: 3 }}>
                                    หมดอายุ: {formatThaiShortDate(lot.dateExp)}{lot.newCost ? ` | ต้นทุน: ${formatTransferNumber(lot.newCost)}` : ""}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#dc2626" }}>ไม่มี Lot ที่พร้อมโอน</div>
                          )}
                          </>)}
                        </div>
                      </div>

                      <div className="col-md-5">
                        <div style={{
                          backgroundColor: "#fffbeb",
                          padding: 16,
                          borderRadius: 12,
                          border: "1px solid #fde68a",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between"
                        }}>
                          <div>
                            <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#92400e", marginBottom: 10 }}>ปลายทางเอกสาร Manual</div>
                            <div style={{ fontFamily: "Kanit", fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>
                              {manualDestinationName.trim() || "ยังไม่ได้ระบุชื่อปลายทาง"}
                            </div>
                            <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b", whiteSpace: "pre-wrap", minHeight: 42 }}>
                              {manualDestinationDetail.trim() || "รายละเอียดปลายทางจะไปแสดงในรายงานพิมพ์"}
                            </div>

                            <div className="mt-3">
                              <label style={{ fontFamily: "Kanit", fontSize: 12, color: "#475569", display: "block", marginBottom: 6 }}>จำนวนโอน</label>
                              <div className="d-flex align-items-center gap-2">
                                <input
                                  type="number"
                                  className="form-control"
                                  min={0}
                                  step="any"
                                  placeholder="0"
                                  style={{ fontFamily: "Kanit", fontSize: 14, textAlign: "center" }}
                                  value={manualTransferQty}
                                  onChange={(e) => setManualTransferQty(e.target.value)}
                                />
                                <span style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>{manualScannedProduct.Unit || ""}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-center mt-3">
                            <button
                              className="btn btn-primary"
                              style={{ fontFamily: "Kanit", fontSize: 14, padding: "8px 28px" }}
                              onClick={addManualTransferItem}
                              disabled={(isLotRequired(manualScannedProduct) && !manualSelectedLotId) || !manualTransferQty}
                            >
                              ➕ เพิ่มลงรายการ Manual
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{
                  backgroundColor: "#fff",
                  padding: 16,
                  borderRadius: 14,
                  border: "1px solid #e2e8f0"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                    <div style={{ fontFamily: "kanit_B", fontSize: 16, color: "#173F6B" }}>📋 รายการโอน Manual ({manualTransferItems.length})</div>
                    <div style={{ fontFamily: "Kanit", fontSize: 13, color: "#64748b" }}>
                      จำนวนรวม {formatTransferNumber(manualTransferItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0))} | มูลค่ารวม {formatTransferNumber(manualTransferItems.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.cost) || 0)), 0))}
                    </div>
                  </div>

                  {manualTransferItems.length === 0 ? (
                    <div className="text-center py-4" style={{ fontFamily: "Kanit", color: "#9ca3af" }}>
                      ยังไม่มีสินค้าในรายการ Manual
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover" style={{ fontFamily: "Kanit", fontSize: 12 }}>
                        <thead>
                          <tr style={{ backgroundColor: "#f8fafc" }}>
                            <th>รหัส</th>
                            <th>ชื่อสินค้า</th>
                            <th>Barcode</th>
                            <th>Lot</th>
                            <th>หมดอายุ</th>
                            <th style={{ textAlign: "center" }}>จำนวน</th>
                            <th style={{ textAlign: "right" }}>ต้นทุน</th>
                            <th style={{ textAlign: "right" }}>รวม</th>
                            <th style={{ width: 60 }}>ลบ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {manualTransferItems.map((item, index) => (
                            <tr key={`${item.lotId}-${index}`}>
                              <td style={{ color: "#2A6AAA", fontWeight: 600 }}>{item.itemcode || "-"}</td>
                              <td>{item.itemName || "-"}</td>
                              <td style={{ color: "#64748b" }}>{item.Barcode || "-"}</td>
                              <td style={{ color: "#64748b" }}>{item.lot || "-"}</td>
                              <td>{formatThaiShortDate(item.dateExp)}</td>
                              <td style={{ textAlign: "center", fontWeight: 700, color: "#2A6AAA" }}>{formatTransferNumber(item.qty)}</td>
                              <td style={{ textAlign: "right" }}>{formatTransferNumber(item.cost)}</td>
                              <td style={{ textAlign: "right", fontWeight: 700 }}>{formatTransferNumber((Number(item.qty) || 0) * (Number(item.cost) || 0))}</td>
                              <td>
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => removeManualItem(index)}
                                  style={{ fontSize: 10, padding: "2px 6px" }}
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                padding: "14px 20px",
                borderTop: "1px solid #e2e8f0",
                background: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap"
              }}>
                <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b" }}>
                  บันทึกแล้วระบบจะตัด stock สาขาต้นทางตาม Lot ที่เลือก และเปิดรายงานพิมพ์ A4 แนวตั้งให้ทันที
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={closeManualTransferModal}
                    disabled={manualSubmitting}
                    style={{ fontFamily: "Kanit" }}
                  >
                    ปิด
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleManualTransfer}
                    disabled={manualSubmitting || manualTransferItems.length === 0}
                    style={{ fontFamily: "kanit_B", paddingInline: 22 }}
                  >
                    {manualSubmitting ? "กำลังบันทึก..." : "📤 บันทึกและพิมพ์ Manual"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === Section: สาขาผู้ส่ง + เลือกสาขาผู้รับ (หลายสาขา) === */}
        <div className="row mb-4">
          {/* สาขาผู้ส่ง */}
          <div className="col-md-4">
            <div style={{
              backgroundColor: "#F3F8FC",
              padding: 15,
              borderRadius: 12,
              border: "1px solid #CCDFF1",
              height: "100%"
            }}>
              <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#173F6B", marginBottom: 10 }}>📤 สาขาผู้ส่ง (สาขาหลัก)</div>
              <div style={{ fontFamily: "Kanit", fontSize: 16, fontWeight: 600 }}>{currentUser?.company || "-"}</div>
              <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b" }}>{loginName || currentUser?.email || "-"}</div>
            </div>
          </div>

          <div className="col-md-1 d-flex align-items-center justify-content-center">
            <div style={{ fontSize: 28 }}>➡️</div>
          </div>

          {/* สาขาผู้รับ (เลือกหลายสาขา) */}
          <div className="col-md-7">
            <div style={{
              backgroundColor: "#fef3c7",
              padding: 15,
              borderRadius: 12,
              border: "1px solid #fcd34d"
            }}>
              <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#854d0e", marginBottom: 10 }}>📥 สาขาผู้รับ (เลือกได้หลายสาขา)</div>

              {/* Dropdown + ปุ่มเพิ่ม */}
              <div className="d-flex gap-2 mb-2">
                <select
                  className="form-control"
                  style={{ fontFamily: "Kanit", fontSize: 13 }}
                  value={branchDropdownValue}
                  onChange={(e) => setBranchDropdownValue(e.target.value)}
                >
                  <option value="">-- เลือกสาขาปลายทาง --</option>
                  {availableBranches.map((branch, index) => (
                    <option key={branch.id ?? `branch-${index}`} value={String(branch.id)}>
                      {branch.branchName || branch.company || branch.name} {branch.isRemote ? "(Remote)" : `(${branch.email})`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={addBranch}
                  disabled={!branchDropdownValue}
                  style={{ fontFamily: "Kanit", fontSize: 13, whiteSpace: "nowrap" }}
                >
                  + เพิ่ม
                </button>
              </div>

              {/* รายการสาขาที่เลือก */}
              {selectedBranches.length === 0 ? (
                <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#92400e", marginTop: 5 }}>
                  ยังไม่ได้เลือกสาขาปลายทาง
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {selectedBranches.map((branch) => (
                    <div key={branch.id} style={{
                      backgroundColor: "#fff",
                      border: "1px solid #f59e0b",
                      borderRadius: 20,
                      padding: "4px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "Kanit",
                      fontSize: 12
                    }}>
                      <span style={{ color: "#92400e", fontWeight: 500 }}>
                        {branch.branchName || branch.company}
                        {branch.isRemote && <span style={{ color: "#7c3aed", fontSize: 10, marginLeft: 4 }}>(Remote)</span>}
                      </span>
                      <button
                        onClick={() => removeBranch(branch.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc2626",
                          cursor: "pointer",
                          fontSize: 14,
                          padding: 0,
                          lineHeight: 1
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {connectedBranches.length === 0 && acceptedConnectionsCount === 0 && (
                <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#dc2626", marginTop: 5 }}>
                  ⚠️ ไม่มีสาขาที่เชื่อมต่อ กรุณาเชื่อมสาขาก่อน (ตั้งค่าเชื่อมสาขา)
                </div>
              )}

              {unavailableTransferConnectionsCount > 0 && (
                <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#b45309", marginTop: 5 }}>
                  ⚠️ พบการเชื่อมสาขา {unavailableTransferConnectionsCount} รายการ ที่ข้อมูลไม่สมบูรณ์ (ไม่มี remoteUserId) กรุณาเชื่อมสาขาใหม่อีกครั้ง
                </div>
              )}
            </div>
          </div>
        </div>

        {/* === Section: Scan Barcode / ค้นหาสินค้า === */}
        <div className="mb-4" style={{
          backgroundColor: "#f8fafc",
          padding: 15,
          borderRadius: 12,
          border: "1px solid #e2e8f0"
        }}>
          <div style={{ fontFamily: "kanit_B", fontSize: 14, marginBottom: 10, color: "#475569" }}>🔍 Scan Barcode / ค้นหาสินค้า</div>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Scan Barcode / พิมพ์รหัสสินค้า / ชื่อสินค้า"
              style={{ fontFamily: "Kanit", fontSize: 15 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              autoFocus
            />
            <button
              className="btn btn-primary"
              onClick={handleSearch}
              disabled={searchLoading || selectedBranches.length === 0}
              style={{ fontFamily: "Kanit" }}
            >
              {searchLoading ? "🔄" : "🔍 ค้นหา"}
            </button>
          </div>
        </div>

        {/* === Section: ผลการ Scan - ถ้ามีหลายรายการให้เลือก === */}
        {scannedProduct?.multipleResults && (
          <div className="mb-4" style={{
            backgroundColor: "#fff",
            padding: 15,
            borderRadius: 12,
            border: "1px solid #3E86C7"
          }}>
            <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#1E5088", marginBottom: 10 }}>
              พบ {scannedProduct.multipleResults.length} รายการ - เลือกสินค้า
            </div>
            {scannedProduct.multipleResults.map((p: any, idx: number) => (
              <div
                key={idx}
                onClick={() => selectProduct(p)}
                style={{
                  padding: "10px 12px",
                  borderBottom: "1px solid #f1f5f9",
                  cursor: "pointer",
                  fontFamily: "Kanit",
                  borderRadius: 8,
                  transition: "background-color 0.15s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F3F8FC"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fff"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{p.ProductName}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>รหัส: {p.code} | Barcode: {p.Barcode || "-"}</div>
                  </div>
                  <div style={{
                    backgroundColor: "#E5EEF8",
                    color: "#173F6B",
                    padding: "4px 10px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    คงเหลือ: {p.mainTotalBalance} {p.Unit || ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === Section: แสดงข้อมูลสินค้า === */}
        {scannedProduct && !scannedProduct.multipleResults && (
          <div className="mb-4" style={{
            backgroundColor: "#fff",
            padding: 20,
            borderRadius: 12,
            border: "2px solid #3E86C7"
          }}>
            <div style={{ fontFamily: "kanit_B", fontSize: 16, color: "#1E5088", marginBottom: 15 }}>
              📋 ข้อมูลสินค้า: {scannedProduct.ProductName}
            </div>

            <div className="row">
              {/* ===== ฝั่งซ้าย: ข้อมูลสาขาหลัก ===== */}
              <div className="col-md-5">
                <div style={{
                  backgroundColor: "#F3F8FC",
                  padding: 15,
                  borderRadius: 12,
                  border: "1px solid #CCDFF1",
                  height: "100%"
                }}>
                  <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#173F6B", marginBottom: 10 }}>
                    📤 สาขาหลัก - ยอดคงเหลือ
                  </div>
                  <div style={{ fontFamily: "Kanit", fontSize: 13, marginBottom: 8 }}>
                    <span style={{ color: "#64748b" }}>รหัส:</span> <strong>{scannedProduct.code}</strong>
                  </div>
                  <div style={{ fontFamily: "Kanit", fontSize: 13, marginBottom: 8 }}>
                    <span style={{ color: "#64748b" }}>Barcode:</span> {scannedProduct.Barcode || "-"}
                  </div>
                  <div style={{ fontFamily: "Kanit", fontSize: 13, marginBottom: 12 }}>
                    <span style={{ color: "#64748b" }}>ยอดคงเหลือรวม:</span>{" "}
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#173F6B" }}>
                      {scannedProduct.mainTotalBalance} {scannedProduct.Unit || ""}
                    </span>
                  </div>

                  {/* เลือก Lot — ข้ามทั้งบล็อกเมื่อสินค้าตั้งค่า "ไม่มี Lot" */}
                  {!isLotRequired(scannedProduct) ? (
                    <div style={{
                      fontFamily: "Kanit", fontSize: 12, color: "#b45309",
                      background: "#fffbeb", border: "1px solid #fcd34d",
                      borderRadius: 10, padding: "9px 10px"
                    }}>
                      🏷️ {NO_LOT_LABEL} — สินค้านี้ตั้งค่าไม่ติดตาม Lot
                      <div style={{ fontSize: 11, color: "#92400e", marginTop: 3 }}>
                        ระบุแค่จำนวนของแต่ละสาขา ระบบจะตัดจากล็อตที่ใกล้หมดอายุก่อนให้อัตโนมัติ
                      </div>
                    </div>
                  ) : (<>
                  <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#475569", marginBottom: 6 }}>เลือก Lot:</div>
                  {scannedProduct.mainLots && scannedProduct.mainLots.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {scannedProduct.mainLots.map((lot: any) => (
                        <div
                          key={lot.id}
                          onClick={() => setSelectedLotId(lot.id)}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: selectedLotId === lot.id ? "2px solid #3E86C7" : "1px solid #d1d5db",
                            backgroundColor: selectedLotId === lot.id ? "#E5EEF8" : "#fff",
                            cursor: "pointer",
                            fontFamily: "Kanit",
                            fontSize: 12,
                            transition: "all 0.15s"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Lot: {lot.lot || "N/A"}</span>
                            <span style={{ fontWeight: 600, color: "#173F6B" }}>{lot.balance} {scannedProduct.Unit || ""}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            หมดอายุ: {lot.dateExp ? new Date(lot.dateExp).toLocaleDateString("th-TH") : "-"}
                            {lot.newCost ? ` | ต้นทุน: ${lot.newCost}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#dc2626" }}>
                      ไม่มี Lot ที่มีสินค้าคงเหลือ
                    </div>
                  )}
                  </>)}
                </div>
              </div>

              {/* ===== ฝั่งขวา: ข้อมูลแต่ละสาขาปลายทาง ===== */}
              <div className="col-md-7">
                <div style={{
                  backgroundColor: "#fffbeb",
                  padding: 15,
                  borderRadius: 12,
                  border: "1px solid #fde68a",
                  height: "100%"
                }}>
                  <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#854d0e", marginBottom: 10 }}>
                    📥 สาขาปลายทาง - ยอดคงเหลือ & จำนวนโอน
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selectedBranches.map((branch) => {
                      const branchBalance = scannedProduct.branchBalances?.find((bb: any) => bb.branchId === branch.id);
                      return (
                        <div key={branch.id} style={{
                          backgroundColor: "#fff",
                          padding: 12,
                          borderRadius: 10,
                          border: "1px solid #e5e7eb"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div>
                              <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#1e293b" }}>
                                {branch.branchName || branch.company}
                              </div>
                              <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#64748b" }}>
                                {branch.email}
                              </div>
                            </div>
                            <div style={{
                              backgroundColor: branchBalance?.hasProduct ? "#D3F0E2" : "#fef2f2",
                              color: branchBalance?.hasProduct ? "#0C5238" : "#dc2626",
                              padding: "3px 10px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontFamily: "Kanit",
                              fontWeight: 500
                            }}>
                              {branchBalance?.hasProduct ? `คงเหลือ: ${branchBalance.totalBalance}` : (branchBalance?.remoteError || "ไม่พบสินค้า")}
                            </div>
                          </div>

                          {branchBalance?.hasProduct && (
                            <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                              รหัสสาขา: {branchBalance.productCode || "-"} | ชื่อ: {branchBalance.productName || "-"}
                              {branchBalance.queriedCompanyId && (
                                <span style={{ color: "#9333ea", marginLeft: 6 }}>
                                  [companyId: {branchBalance.queriedCompanyId}, src: {branchBalance.source}]
                                </span>
                              )}
                            </div>
                          )}

                          {/* Input จำนวนโอน */}
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ fontFamily: "Kanit", fontSize: 12, color: "#475569", whiteSpace: "nowrap" }}>จำนวนโอน:</span>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              style={{ fontFamily: "Kanit", fontSize: 13, maxWidth: 120, textAlign: "center" }}
                              min={0}
                              value={branchTransferQty[branch.id] || ""}
                              onChange={(e) => {
                                setBranchTransferQty({
                                  ...branchTransferQty,
                                  [branch.id]: parseInt(e.target.value) || 0
                                });
                              }}
                              placeholder="0"
                            />
                            <span style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b" }}>{scannedProduct.Unit || ""}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ปุ่มเพิ่มลงรายการ */}
                  <div className="text-center mt-3">
                    <button
                      className="btn btn-primary"
                      style={{ fontFamily: "Kanit", fontSize: 14, padding: "8px 30px" }}
                      onClick={addToTransferList}
                      disabled={(isLotRequired(scannedProduct) && !selectedLotId) || Object.values(branchTransferQty).every(q => !q || q <= 0)}
                    >
                      ➕ เพิ่มลงรายการโอน
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === Section: ตารางรายการโอน === */}
        <div style={{
          backgroundColor: "#fff",
          padding: 15,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          marginBottom: 20
        }}>
          <div style={{ fontFamily: "kanit_B", fontSize: 16, marginBottom: 10, color: "#173F6B" }}>
            📋 รายการโอน ({transferItems.length})
          </div>

          {transferItems.length === 0 ? (
            <div className="text-center py-4" style={{ fontFamily: "Kanit", color: "#9ca3af" }}>
              ยังไม่มีสินค้าในรายการ
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover" style={{ fontFamily: "Kanit", fontSize: 12 }}>
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9" }}>
                    <th style={{ fontSize: 12, backgroundColor: "#E5EEF8", color: "#1E5088" }}>รหัส</th>
                    <th style={{ fontSize: 12, backgroundColor: "#E5EEF8", color: "#1E5088" }}>ชื่อสินค้า</th>
                    <th style={{ fontSize: 12, backgroundColor: "#E5EEF8", color: "#1E5088" }}>Barcode</th>
                    <th style={{ fontSize: 12 }}>Lot</th>
                    <th style={{ fontSize: 12 }}>หมดอายุ</th>
                    <th style={{ fontSize: 12, backgroundColor: "#fef3c7", color: "#92400e" }}>สาขาปลายทาง</th>
                    <th style={{ fontSize: 12, backgroundColor: "#fef3c7", color: "#92400e" }}>ยอดคงเหลือปลายทาง</th>
                    <th style={{ fontSize: 12, backgroundColor: "#E5EEF8", color: "#173F6B" }}>จำนวนโอน</th>
                    <th style={{ fontSize: 12, width: 50 }}>ลบ</th>
                  </tr>
                </thead>
                <tbody>
                  {transferItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontSize: 11, color: "#3E86C7", fontWeight: 500 }}>{item.itemcode || "-"}</td>
                      <td style={{ fontSize: 11 }}>{item.itemName}</td>
                      <td style={{ fontSize: 10, color: "#64748b" }}>{item.Barcode || "-"}</td>
                      <td style={{ fontSize: 11, color: "#64748b" }}>{item.lot || "-"}</td>
                      <td style={{ fontSize: 11 }}>{item.dateExp ? new Date(item.dateExp).toLocaleDateString("th-TH") : "-"}</td>
                      <td style={{ fontSize: 11 }}>
                        <span style={{
                          backgroundColor: "#fef3c7",
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontSize: 11,
                          color: "#92400e",
                          fontWeight: 500
                        }}>
                          {item.toBranchName}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, textAlign: "center" }}>{item.receiverBalance || 0}</td>
                      <td style={{ fontSize: 13, fontWeight: 600, color: "#2A6AAA", textAlign: "center" }}>{item.qty}</td>
                      <td>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeItem(idx)}
                          style={{ fontSize: 10, padding: "2px 6px" }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ปุ่มยืนยัน */}
        <div className="text-center">
          <button
            className="btn btn-success btn-lg"
            style={{ fontFamily: "kanit_B", fontSize: 18, padding: "12px 40px" }}
            onClick={handleTransfer}
            disabled={submitting || transferItems.length === 0}
          >
            {submitting ? "กำลังโอน..." : "📤 ยืนยันการโอน"}
          </button>
        </div>

        {/* สถานะสาขา */}
        {sidebarBranches.length > 0 && (
          <div style={{ marginTop: 20, maxWidth: '20%', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '10px 12px', background: 'linear-gradient(135deg, #F3F8FC, #CCDFF1)', borderBottom: '1px solid #E5EEF8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 700, color: '#173F6B' }}>📡 สถานะสาขา</span>
              <button
                onClick={handleSidebarRefreshAll}
                disabled={sidebarCheckingAll}
                style={{ fontFamily: 'Kanit', fontSize: 9, padding: '3px 8px', borderRadius: 6, border: '1px solid #CCDFF1', background: sidebarCheckingAll ? '#E5EEF8' : '#fff', color: '#2A6AAA', cursor: sidebarCheckingAll ? 'default' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, transition: 'all 0.2s' }}>
                {sidebarCheckingAll ? '⏳ กำลังตรวจ...' : '🔄 Refresh'}
              </button>
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {sidebarBranches.map((conn: any) => {
                const isFromUs = conn.fromUserId === Number(jwtDecode<any>(localStorage.getItem("token") || "").idcompany || 0);
                const brName = conn.branchName || (isFromUs ? conn.toUser?.company : conn.fromUser?.company) || conn.remoteCompany || 'ไม่ทราบชื่อ';
                const isOnline = conn.isOnline === true;
                const isChecking = sidebarCheckingId === conn.id;
                const lastCheck = conn.lastCheckedAt ? new Date(conn.lastCheckedAt).toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : null;
                return (
                  <div key={conn.id}
                    onClick={() => !isChecking && handleSidebarCheckStatus(conn.id)}
                    style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8, cursor: isChecking ? 'default' : 'pointer', transition: 'background 0.15s', background: isChecking ? '#EDF9F3' : 'transparent' }}
                    onMouseEnter={(e) => { if (!isChecking) (e.currentTarget as HTMLDivElement).style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { if (!isChecking) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {isChecking ? (
                        <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #f59e0b', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                      ) : (
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: isOnline ? '#1F9D6B' : '#94a3b8', boxShadow: isOnline ? '0 0 6px rgba(31, 157, 107,0.5)' : 'none', transition: 'all 0.3s' }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brName}</div>
                      <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#94a3b8' }}>
                        {isChecking ? 'กำลังตรวจสอบ...' : isOnline ? '🟢 ออนไลน์' : '⚫ ออฟไลน์'}
                        {lastCheck && !isChecking && <span style={{ marginLeft: 4 }}>· {lastCheck}</span>}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <span style={{ fontFamily: 'Kanit', fontSize: 9, padding: '2px 6px', borderRadius: 8, background: isOnline ? '#D3F0E2' : '#f1f5f9', color: isOnline ? '#147F56' : '#94a3b8', fontWeight: 600 }}>
                        {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function BranchTransferPage() {
  return <PermissionGuard codename="R1"><BranchTransferPageInner /></PermissionGuard>
}

export default BranchTransferPage
