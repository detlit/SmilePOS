/**
 * เทมเพลตพิมพ์ที่เกี่ยวกับคิว
 *  - buildQueueBadgeHtml : บล็อกเลขคิวตัวใหญ่ที่แทรกบนใบเสร็จลูกค้า
 *  - buildJobTicketHtml  : ใบ job แยกใบสำหรับพนักงาน (พิมพ์ต่อจากใบเสร็จ เครื่องเดียวกัน)
 *
 * ทั้งคู่คืนค่าเป็น HTML string เพื่อส่งเข้าเส้นทางพิมพ์เดิม (printSilent / printThermalReceiptInBrowser)
 */

import { formatQueueNo, type SaleQueueItem } from "@/lib/saleQueue"

/** กัน HTML injection จากชื่อสินค้า/ชื่อลูกค้า — เนื้อหาทั้งหมดถูกยัดเข้า template string ตรง ๆ */
const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

/**
 * บล็อกเลขคิวบนใบเสร็จลูกค้า — ตัวเลขใหญ่ที่สุดบนใบ เพื่อให้ยืนอ่านจากระยะห่างได้
 * กรอบทึบเต็มความกว้างช่วยให้ตาจับได้ทันทีว่าต้องดูตรงไหน แม้กระดาษจะพิมพ์จาง
 */
export function buildQueueBadgeHtml(queueNo: unknown, is58: boolean): string {
  const label = formatQueueNo(queueNo)
  if (label === "-") return ""

  const captionSize = is58 ? "10px" : "12px"
  const numberSize = is58 ? "52px" : "68px"
  const padY = is58 ? "6px" : "8px"

  return `
    <div style="
      margin: ${padY} 0;
      padding: ${padY} 4px;
      border: 2px solid #000;
      border-radius: 6px;
      text-align: center;
      font-family: 'Kanit';
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    ">
      <div style="font-size: ${captionSize}; letter-spacing: 2px;">คิวของท่าน</div>
      <div style="font-size: ${numberSize}; font-weight: bold; line-height: 1.05;">${label}</div>
      <div style="font-size: ${captionSize};">กรุณารอเรียกคิว</div>
    </div>
  `
}

type JobTicketInput = {
  queueNo: unknown
  orderNo?: string
  items: SaleQueueItem[]
  customer?: string
  seller?: string
  note?: string
  /** ชื่อร้าน/สาขา ใช้เป็นหัวใบเมื่อมีหลายจุดเตรียมสินค้า */
  storeName?: string
  is58: boolean
}

/**
 * ใบ job ของพนักงาน — คนละหน้าที่กับใบเสร็จ จึงตัดทุกอย่างที่เกี่ยวกับเงินออกหมด
 * เหลือแค่สิ่งที่ต้องใช้หยิบของ: เลขคิว, จำนวน, ชื่อสินค้า
 * จำนวนพิมพ์ตัวหนา/ใหญ่กว่าชื่อ เพราะเป็นตัวที่หยิบผิดแล้วเสียหายที่สุด
 */
export function buildJobTicketHtml(input: JobTicketInput): string {
  const { queueNo, orderNo, items, customer, seller, note, storeName, is58 } = input

  const paperW = is58 ? "48mm" : "72mm"
  const queueSize = is58 ? "46px" : "60px"
  const titleSize = is58 ? "13px" : "16px"
  const bodySize = is58 ? "10px" : "12px"
  const itemSize = is58 ? "12px" : "14px"
  const qtySize = is58 ? "15px" : "18px"
  const separator = is58 ? "------------------------" : "--------------------------------------"

  const now = new Date()
  const timeLabel = `${now.toLocaleDateString("es-US", { day: "2-digit", month: "2-digit", year: "numeric" })} ${now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })}`

  const rows = (items || [])
    .filter((it) => Number(it?.qty) > 0)
    .map(
      (it) => `
        <div style="display: flex; align-items: flex-start; gap: 6px; padding: 3px 0; border-bottom: 1px dashed #999;">
          <div style="flex: 0 0 auto; min-width: ${is58 ? "34px" : "42px"}; font-size: ${qtySize}; font-weight: bold; font-family: 'Kanit';">${Number(it.qty)}</div>
          <div style="flex: 1 1 auto; min-width: 0; font-size: ${itemSize}; font-family: 'Kanit'; word-break: break-word;">
            ${esc(it.name)}
            ${it.unit ? `<span style="font-size: ${bodySize};"> (${esc(it.unit)})</span>` : ""}
          </div>
        </div>
      `
    )
    .join("")

  return `
    <div class="thermal-receipt" style="width: ${paperW}; max-width: ${paperW}; background-color: white; box-sizing: border-box; font-family: 'Kanit'; margin: 0; overflow: visible;">

      <div style="text-align: center; font-size: ${titleSize}; font-weight: bold; font-family: 'Kanit';">ใบสั่งงาน (JOB)</div>
      ${storeName ? `<div style="text-align: center; font-size: ${bodySize}; font-family: 'Kanit';">${esc(storeName)}</div>` : ""}
      <div style="text-align: center; font-size: ${bodySize}; font-family: 'Kanit';">${separator}</div>

      <div style="
        margin: 4px 0;
        padding: 6px 4px;
        border: 2px solid #000;
        border-radius: 6px;
        text-align: center;
        font-family: 'Kanit';
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      ">
        <div style="font-size: ${bodySize}; letter-spacing: 2px;">คิว</div>
        <div style="font-size: ${queueSize}; font-weight: bold; line-height: 1.05;">${formatQueueNo(queueNo)}</div>
      </div>

      <div style="font-size: ${bodySize}; font-family: 'Kanit'; text-align: left;">เวลา : ${timeLabel}</div>
      ${orderNo ? `<div style="font-size: ${bodySize}; font-family: 'Kanit'; text-align: left;">ออเดอร์ : ${esc(orderNo)}</div>` : ""}
      ${customer ? `<div style="font-size: ${bodySize}; font-family: 'Kanit'; text-align: left;">ลูกค้า : ${esc(customer)}</div>` : ""}
      ${seller ? `<div style="font-size: ${bodySize}; font-family: 'Kanit'; text-align: left;">ผู้ขาย : ${esc(seller)}</div>` : ""}

      <div style="text-align: center; font-size: ${bodySize}; font-family: 'Kanit';">${separator}</div>
      <div style="font-size: ${bodySize}; font-family: 'Kanit'; text-align: left; font-weight: bold;">จำนวน / รายการ</div>
      ${rows || `<div style="font-size: ${bodySize}; font-family: 'Kanit'; padding: 6px 0;">- ไม่มีรายการ -</div>`}

      ${note ? `
        <div style="margin-top: 5px; padding: 4px; border: 1px dashed #000; font-size: ${bodySize}; font-family: 'Kanit'; word-break: break-word;">
          <b>หมายเหตุ :</b> ${esc(note)}
        </div>
      ` : ""}

      <div style="text-align: center; font-size: ${bodySize}; font-family: 'Kanit'; margin-top: 6px;">${separator}</div>
      <div style="text-align: center; font-size: ${bodySize}; font-family: 'Kanit';">*** ไม่ใช่ใบเสร็จรับเงิน ***</div>
      <div style="height: 12px;"></div>
    </div>
  `
}
