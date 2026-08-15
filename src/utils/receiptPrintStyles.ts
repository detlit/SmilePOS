export const getThermalReceiptPaperWidth = (is58: boolean) => is58 ? '50mm' : '72mm'

export const getThermalReceiptHorizontalOffset = (is58: boolean) => {
  const fallbackOffset = 14

  if (typeof window === 'undefined') return fallbackOffset

  const sizeKey = is58 ? 'receipt_print_offset_58' : 'receipt_print_offset_80'
  const savedOffset = window.localStorage.getItem(sizeKey) || window.localStorage.getItem('receipt_print_offset')
  const parsedOffset = Number(savedOffset)

  return Number.isFinite(parsedOffset) ? parsedOffset : fallbackOffset
}

// พิมพ์ใบเสร็จตอนรันบนเบราว์เซอร์ (ไม่มี Electron) — สร้าง iframe ซ่อนไว้แล้วสั่งพิมพ์จาก HTML
// ที่ประกอบไว้แล้ว จึงไม่ผูกกับ DOM ของ React (ปลอดภัยแม้หน้าจอถูก re-render/unmount ระหว่างพิมพ์)
export const printThermalReceiptInBrowser = (content: string, horizontalOffset = 0) => {
  if (typeof window === 'undefined' || !content) return

  const FRAME_ID = 'thermalReceiptPrintFrame'
  const oldFrame = document.getElementById(FRAME_ID)
  if (oldFrame && oldFrame.parentNode) oldFrame.parentNode.removeChild(oldFrame)

  const iframe = document.createElement('iframe')
  iframe.id = FRAME_ID
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'
  document.body.appendChild(iframe)

  const frameWindow = iframe.contentWindow
  const frameDoc = frameWindow?.document
  if (!frameWindow || !frameDoc) {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    return
  }

  const offset = Number.isFinite(horizontalOffset) ? horizontalOffset : 0

  // โหลดฟอนต์ Kanit เข้า iframe เอง เพราะ @font-face ของหน้าหลักไม่ถูกสืบทอดมาให้
  frameDoc.open()
  frameDoc.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <base href="/">
  <title>ใบเสร็จรับเงิน</title>
  <style>
    @font-face { font-family: 'Kanit'; src: url('/fonts/Kanit-Regular.ttf') format('truetype'); font-weight: normal; font-display: swap; }
    @font-face { font-family: 'Kanit'; src: url('/fonts/Kanit-SemiBold.ttf') format('truetype'); font-weight: bold; font-display: swap; }
    @font-face { font-family: 'Kanit_B'; src: url('/fonts/Kanit-SemiBold.ttf') format('truetype'); font-display: swap; }
    @page { margin: 0; }
    html, body { margin: 0; padding: 0; background: #ffffff; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .browser-print-root { width: fit-content; margin: 0; padding: 0; transform: translateX(${offset}px); transform-origin: top left; }
  </style>
</head>
<body><div class="browser-print-root">${content}</div></body>
</html>`)
  frameDoc.close()

  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    window.setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    }, 500)
  }

  const triggerPrint = () => {
    try {
      frameWindow.addEventListener('afterprint', cleanup)
      frameWindow.focus()
      frameWindow.print()
    } catch (error) {
      console.error('Browser receipt print failed:', error)
    }
    // กันกรณีเบราว์เซอร์ไม่ยิง afterprint (เช่นผู้ใช้ปิด dialog แบบผิดปกติ)
    window.setTimeout(cleanup, 60000)
  }

  // รอฟอนต์ + รูปโลโก้ให้พร้อมก่อนสั่งพิมพ์ แต่ไม่รอเกิน 3 วินาที
  let printed = false
  const printOnce = () => {
    if (printed) return
    printed = true
    triggerPrint()
  }

  const images = Array.from(frameDoc.images || [])
  const waitAssets: Promise<unknown>[] = images.map((img) => (
    img.complete ? Promise.resolve(true) : new Promise((done) => {
      img.onload = () => done(true)
      img.onerror = () => done(true)
    })
  ))
  // สั่งโหลดฟอนต์ตรง ๆ ไม่รอ fonts.ready เฉย ๆ เพราะมันอาจ resolve ก่อนที่ layout จะขอฟอนต์
  const frameFonts = (frameDoc as any).fonts
  if (frameFonts?.load) {
    waitAssets.push(Promise.all([
      frameFonts.load("400 12px 'Kanit'"),
      frameFonts.load("700 12px 'Kanit'"),
      frameFonts.load("400 12px 'Kanit_B'"),
    ]).catch(() => true))
  } else if (frameFonts?.ready) {
    waitAssets.push(Promise.resolve(frameFonts.ready).catch(() => true))
  }

  window.setTimeout(printOnce, 3000)
  Promise.all(waitAssets).then(() => window.setTimeout(printOnce, 100)).catch(() => printOnce())
}

export const getThermalReceiptPrintStyles = (paperWidth: string, is58: boolean) => `
  <style>
    @page { margin: 0; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
    }
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .thermal-receipt {
      width: ${paperWidth};
      max-width: ${paperWidth};
      box-sizing: border-box;
      padding: ${is58 ? '1mm 2.5mm 2mm 2.5mm' : '1.5mm 3.5mm 2mm 3.5mm'} !important;
      margin: 0;
      overflow: visible !important;
      background: #ffffff;
      color: #000000;
      font-family: 'Kanit', 'Tahoma', Arial, sans-serif;
      font-weight: 600;
      line-height: 1.32;
      letter-spacing: 0;
      text-rendering: geometricPrecision;
      -webkit-font-smoothing: antialiased;
    }
    .thermal-receipt,
    .thermal-receipt * {
      color: #000000 !important;
      text-shadow: none !important;
      font-family: 'Kanit', 'Tahoma', Arial, sans-serif !important;
      box-sizing: border-box;
    }
    .thermal-receipt div,
    .thermal-receipt span,
    .thermal-receipt td {
      line-height: 1.3 !important;
    }
    .thermal-receipt b,
    .thermal-receipt strong,
    .thermal-receipt [style*="bold"],
    .thermal-receipt [style*="Kanit_B"] {
      font-weight: 800 !important;
    }
    .thermal-receipt img {
      display: block;
      object-fit: contain;
      filter: contrast(1.1);
      image-rendering: -webkit-optimize-contrast;
    }
    .thermal-receipt table {
      width: 100% !important;
      border-collapse: collapse !important;
      border-spacing: 0 !important;
      table-layout: fixed !important;
      margin: 2px 0 0 !important;
    }
    .thermal-receipt thead tr {
      border-top: 1px solid #000000 !important;
      border-bottom: 1px solid #000000 !important;
    }
    .thermal-receipt tbody tr {
      border-bottom: 1px dotted #333333 !important;
    }
    .thermal-receipt td {
      padding: ${is58 ? '2px 1px' : '2px 1.5px'} !important;
      vertical-align: top !important;
    }
    .thermal-receipt td:last-child {
      padding-right: ${is58 ? '1mm' : '1.5mm'} !important;
      white-space: nowrap !important;
    }
    .thermal-receipt .receipt-sale-header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) ${is58 ? '36px' : '48px'};
      column-gap: 4px;
      align-items: end;
      padding: 2px 0 3px;
      border-top: 1px dashed #000000;
      border-bottom: 1px dashed #000000;
      font-weight: 800 !important;
    }
    .thermal-receipt .receipt-sale-header-total,
    .thermal-receipt .receipt-sale-total {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .thermal-receipt .receipt-sale-item {
      padding: ${is58 ? '3px 0' : '4px 0'};
      border-bottom: 1px dashed #000000;
    }
    .thermal-receipt .receipt-sale-main {
      display: grid;
      grid-template-columns: minmax(0, 1fr) ${is58 ? '36px' : '48px'};
      column-gap: 4px;
      align-items: start;
    }
    .thermal-receipt .receipt-sale-name {
      display: block;
      text-align: left;
      word-break: break-word;
      white-space: normal;
      line-height: 1.24 !important;
      font-weight: 800 !important;
    }
    .thermal-receipt .receipt-sale-line {
      margin-top: 1px;
    }
    .thermal-receipt .receipt-sale-detail {
      text-align: center;
      font-size: ${is58 ? '7.5px' : '9px'};
      font-weight: 700 !important;
      line-height: 1.2 !important;
      white-space: normal;
      word-break: break-word;
    }
    .thermal-receipt .receipt-sale-total {
      font-weight: 800 !important;
      line-height: 1.2 !important;
    }
    .thermal-receipt .receipt-sale-discount {
      margin-top: 1px;
      text-align: right;
      font-size: ${is58 ? '7px' : '8px'};
      font-weight: 700 !important;
    }
    .thermal-receipt .receipt-grand-total {
      border-top: 1.5px solid #000000 !important;
      border-bottom: 1.5px solid #000000 !important;
      padding-top: 4px !important;
      padding-bottom: 4px !important;
      font-weight: 800 !important;
    }
    @media print {
      .thermal-receipt {
        box-shadow: none !important;
        border: 0 !important;
      }
    }
  </style>
`