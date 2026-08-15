export const STOCK_ADJUST_REASON_OPTIONS = [
  'หมดอายุ',
  'ใกล้หมดอายุ',
  'ทำลาย',
  'เสื่อมสภาพ',
  'ปรับยอดจาก Diff นับสต็อก',
  'รับสินค้าเข้าผิด',
  'โอนสินค้าผิด',
  'รับโอนสินค้าผิด',
  'ขายสินค้าผิด',
  'สินค้าเปลี่ยนคืนผู้จัดจำหน่าย',
  'อื่นๆ'
] as const

export const DEFAULT_STOCK_ADJUST_REASON = 'ปรับยอดจาก Diff นับสต็อก'

export type StockAdjustReason = typeof STOCK_ADJUST_REASON_OPTIONS[number]