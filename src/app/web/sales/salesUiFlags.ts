/**
 * ตัวเปิด/ปิดการแสดงผลบางส่วนบนหน้าขาย
 * ตั้งเป็น true เพื่อกลับมาแสดงเหมือนเดิม (โค้ดเดิมยังอยู่ครบ ไม่ได้ลบทิ้ง)
 */

/**
 * ช่องค้นหา/สแกนสินค้า (F1) บนแถบเครื่องมือหน้าขาย
 *
 * ปิดอยู่ — แต่ตัวช่องยังถูกเรนเดอร์ไว้แบบ "ซ่อนแต่ยังโฟกัสได้" (.salesCommandSearchHidden)
 * ห้ามเปลี่ยนเป็น display:none หรือถอดออก เพราะ:
 *   1) เครื่องสแกนบาร์โค้ดพิมพ์คีย์ผ่านช่องนี้ และ emitBarcode() อ่านค่าในช่องมารวมกับ buffer
 *   2) restFocus() จอดเคอร์เซอร์ไว้ที่ช่องนี้ตลอด เพื่อกันคีย์จากสแกนเนอร์ไปกดปุ่มอื่นโดยไม่ตั้งใจ
 * ค้นหาสินค้าด้วยมือ ใช้ช่อง "กรองสินค้าในหมวด" ในแผงเลือกสินค้าแทน
 */
export const SHOW_PRODUCT_SEARCH_BAR = false;

/**
 * ล็อกหน้าขายไว้ที่โหมดร้านอาหาร/คาเฟ่ ตลอดเวลา
 * เปิดอยู่ — ไม่อ่านค่าที่จำไว้ใน localStorage("posGridMode") และสลับกลับโหมดตารางปกติไม่ได้
 * (หน้าชำระเงินยังใช้ layout เดิมเสมอ เพราะเงื่อนไข changepay)
 * ต้องปิด SHOW_POS_MODE_TOGGLE คู่กันเสมอ ไม่งั้นจะมีปุ่มที่กดแล้วไม่เกิดอะไรขึ้น
 */
export const FORCE_RESTAURANT_MODE = true;

/** ปุ่ม "จัดชุดสินค้า" (เลือกชุดยา) บนแถบเครื่องมือหน้าขาย */
export const SHOW_DRUG_SET_SELECTOR = false;

/** ตัวเลือกระดับราคาบนแถบเครื่องมือหน้าขาย — ระดับราคายังทำงานตามค่าที่ตั้งไว้ (ดูป้ายระดับราคาในแผงเลือกสินค้า) */
export const SHOW_PRICE_TIER_SELECTOR = false;

/** ปุ่มสลับ "โหมดร้านอาหาร" — ซ่อนคู่กับ FORCE_RESTAURANT_MODE */
export const SHOW_POS_MODE_TOGGLE = false;

/** ปุ่มสลับรูปแบบรายการขาย เต็ม/ย่อ — ใช้ไม่ได้อยู่แล้วเมื่ออยู่ในโหมดร้านอาหาร */
export const SHOW_CART_VIEW_TOGGLE = false;

/** ปุ่ม "จอลูกค้า" (เปิดจอแสดงผลฝั่งลูกค้าบนหน้าจอที่สอง) */
export const SHOW_CUSTOMER_SCREEN_BUTTON = false;

/** ปุ่มสื่อสารกับผู้ขาย (ไอคอนไมค์) ในถาดไอคอนบนแถบเครื่องมือหน้าขาย — แสดงเฉพาะตอนไม่ได้รันบน Electron */
export const SHOW_SELLER_CHAT_BUTTON = false;

/**
 * ปุ่มซ่อน/แสดงราคาให้ลูกค้าเห็น (ไอคอนตา) ในถาดไอคอนบนแถบเครื่องมือหน้าขาย
 * ค่าที่ตั้งไว้ล่าสุดยังมีผลอยู่ (อ่านจาก localStorage "hideCustomerPrice") แค่สลับด้วยมือไม่ได้แล้ว
 */
export const SHOW_HIDE_PRICE_TOGGLE = false;

/**
 * ปุ่มสลับโหมดสแกนเนอร์ปกติ/ช้า (จุดเล็ก ๆ ท้ายแถบเครื่องมือ)
 * ค่าที่ตั้งไว้ล่าสุดยังมีผลกับเกณฑ์จับบาร์โค้ด (อ่านจาก localStorage "fastScannerMode") แค่สลับด้วยมือไม่ได้แล้ว
 */
export const SHOW_SCANNER_SPEED_TOGGLE = false;

/** ปุ่มบันทึกอุณหภูมิ (ไอคอนปรอท) บนแถบเครื่องมือหน้าขาย */
export const SHOW_TEMPERATURE_BUTTON = false;

/** ปุ่มน้ำหนักเด็ก (ไอคอนเด็ก) บนแถบเครื่องมือหน้าขาย — modal ยังเปิดอัตโนมัติเมื่อสแกนยาน้ำเด็ก */
export const SHOW_PEDIATRIC_BUTTON = false;

/** คอลัมน์เตือน Drug Interaction / แพ้ยา ในตารางตะกร้าสินค้า */
export const SHOW_DRUG_ALERT_COLUMNS = false;

/** คอลัมน์ "ฉลาก" (checkbox เลือกพิมพ์ฉลาก) ในตารางตะกร้าสินค้า */
export const SHOW_LABEL_COLUMN = false;

/** ปุ่ม "ฉลากยา (F11)" บนแถบปุ่มด้านขวา — คีย์ลัด F11 ยังใช้ได้ */
export const SHOW_LABEL_PRINT_BUTTON = false;

/** แถว "โรคประจำตัว" ในการ์ดข้อมูลลูกค้า (แผงขวา) */
export const SHOW_CUSTOMER_CONGENITAL = false;

/**
 * การ์ด "ข้อมูลลูกค้า" ทั้งใบในแผงขวา
 * ปิดอยู่ — ย้ายไปแสดงเป็นปุ่ม "ค้นหาลูกค้า" + ป้ายข้อมูลลูกค้า บนแถบเครื่องมือด้านบนแทน
 * (โมดัลค้นหา/สมัครสมาชิก, กล่องเตือนข้อมูลสำคัญ และฟอร์มติดตามอาการ ยังถูกเรนเดอร์อยู่นอกการ์ด)
 */
export const SHOW_CUSTOMER_SIDE_CARD = false;

/**
 * การ์ด "ข้อมูลสินค้า" ทั้งใบในแผงขวา (รหัส/ชื่อ/รูป/ที่เก็บ/ราคาขาย/ราคาทุน)
 * ปิดอยู่ — ข้อมูลชุดนี้ดูได้จากรายการในตะกร้าและการ์ดสินค้าในกริดอยู่แล้ว
 */
export const SHOW_PRODUCT_SIDE_CARD = false;

/** แถว "ชื่อเฉพาะทาง" ในการ์ดข้อมูลสินค้า (แผงขวา) */
export const SHOW_PRODUCT_FIXNAME = false;

/** กล่อง "สรรพคุณ / ข้อบ่งใช้" ในการ์ดข้อมูลสินค้า (แผงขวา) */
export const SHOW_PRODUCT_INDICATION = false;

/**
 * ถาดไอคอนเครื่องมือบนแถบเครื่องมือหน้าขาย — คำนวณจากแฟล็กด้านบน ไม่ต้องตั้งค่าเอง
 * มีไว้กันถาดเปล่า (กรอบ+เงา) ค้างอยู่บนแถบเมื่อเครื่องมือข้างในถูกปิดหมด
 */
export const SHOW_SALES_ICON_RAIL =
  SHOW_SELLER_CHAT_BUTTON || SHOW_TEMPERATURE_BUTTON || SHOW_PEDIATRIC_BUTTON || SHOW_HIDE_PRICE_TOGGLE;

/**
 * ตัวแถบเครื่องมือด้านบนหน้าขาย — คำนวณจากแฟล็กด้านบน ไม่ต้องตั้งค่าเอง
 * ถ้าไม่เหลือเครื่องมือให้แสดงสักตัว จะไม่เรนเดอร์กรอบแถบเปล่า ๆ ทิ้งไว้
 *
 * ⚠️ ปิดแถบ ไม่ได้แปลว่าถอด <Search_Product /> ออก — ช่องสแกนบาร์โค้ดยังต้องอยู่ในทรี
 * และโฟกัสได้เสมอ (ดูหมายเหตุที่ SHOW_PRODUCT_SEARCH_BAR)
 */
export const SHOW_SALES_COMMAND_BAR =
  SHOW_PRODUCT_SEARCH_BAR ||
  SHOW_DRUG_SET_SELECTOR ||
  SHOW_PRICE_TIER_SELECTOR ||
  SHOW_POS_MODE_TOGGLE ||
  SHOW_CART_VIEW_TOGGLE ||
  SHOW_CUSTOMER_SCREEN_BUTTON ||
  SHOW_SALES_ICON_RAIL ||
  SHOW_SCANNER_SPEED_TOGGLE;
