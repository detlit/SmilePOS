"use client";
import { create } from "zustand";
import { normalizePriceTier } from "./priceTier";
import { FORCE_RESTAURANT_MODE } from "./salesUiFlags";

/** ข้อมูลลูกค้าที่กำลังเลือกอยู่ในบิล — สรุปเท่าที่แถบเครื่องมือหน้าขายต้องใช้แสดงผล */
export interface SaleCustomerInfo {
  id: number;
  code: string;
  name: string;
  tel: string;
  /** ระดับราคาของลูกค้า (หน้าร้าน / ส่ง / ...) */
  levelPrice: string;
  /** true = ลูกค้ารายนี้ตั้งระดับราคาเฉพาะไว้จริง (ไม่ใช่ค่า default) */
  hasLevelPrice: boolean;
  points: number;
  /** จำนวนรายการแพ้สินค้า — ใช้ขึ้นป้ายเตือนบนแถบเครื่องมือ */
  allergyCount: number;
  /** รายการแพ้สินค้าแบบข้อความ สำหรับ tooltip ของป้ายเตือน */
  allergyText: string;
  congenital: string;
}

interface MessageState {
  message: string;
  setMessage: (value: string) => void;
  savehis: string;
  setsavehis: (value: string) => void;
  savemu: string;
  setsavemu: (value: string) => void;
  compactCartView: boolean;
  setCompactCartView: (value: boolean) => void;
  /** โหมดร้านอาหาร/คาเฟ่ : เปลี่ยน layout หน้าขายเป็น ใบสั่งซื้อ + หมวดสินค้า + กริดสินค้าให้กดเลือก */
  posGridMode: boolean;
  setPosGridMode: (value: boolean) => void;
  idsale: string;
  setsale: (value: string) => void;
  scannedBarcode: string;
  scanCount: number;
  setScannedBarcode: (value: string) => void;
  payw: string;
  setpayw: (value: string) => void;
  globalChildWeight: number;
  setGlobalChildWeight: (value: number) => void;
  showPediatricModal: boolean;
  setShowPediatricModal: (value: boolean) => void;
  saleProducts: any[];
  saleProductsLoaded: boolean;
  setSaleProducts: (value: any[]) => void;
  selectedDrugSet: any | null;
  drugSetSelectionCount: number;
  setSelectedDrugSet: (value: any) => void;
  /* ---- ลูกค้าของบิลปัจจุบัน ----
     body_sale.tsx เป็นเจ้าของ state จริง (alldatalist.names) แล้วเผยแพร่สรุปมาที่ saleCustomer
     ส่วนแถบเครื่องมือใน body_pro_cus.tsx อ่านไปแสดง และสั่งงานกลับผ่านตัวนับ request ด้านล่าง
     (ใช้ "ตัวนับ" แทน boolean เพราะต้องสั่งซ้ำคำสั่งเดิมได้ เช่นกดค้นหาสองครั้งติดกัน) */
  saleCustomer: SaleCustomerInfo | null;
  setSaleCustomer: (value: SaleCustomerInfo | null) => void;
  customerSearchRequest: number;
  requestCustomerSearch: () => void;
  customerRegisterRequest: number;
  requestCustomerRegister: () => void;
  customerClearRequest: number;
  requestCustomerClear: () => void;
  customerFollowUpRequest: number;
  requestCustomerFollowUp: () => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  message: "",
  setMessage: (value) => set({ message: value }),
  savehis: "",
  setsavehis: (value) => set({ savehis: value }),
  savemu: "",
  setsavemu: (value) => set({ savemu: value }),
  compactCartView: false,
  setCompactCartView: (value) => set({ compactCartView: value }),
  // เริ่มที่ true เลยเมื่อล็อกโหมดร้านอาหาร — กันจอกระพริบเป็น layout ตารางปกติหนึ่งเฟรมก่อน effect จะทำงาน
  // (ค่าคงที่ ไม่ได้อ่าน localStorage จึงไม่ทำให้ hydration ไม่ตรงกัน)
  posGridMode: FORCE_RESTAURANT_MODE,
  setPosGridMode: (value) => set({ posGridMode: value }),
  idsale: "",
  setsale: (value) => set({ idsale: value }),
  scannedBarcode: "",
  scanCount: 0,
  setScannedBarcode: (value) => set((state) => ({ scannedBarcode: value, scanCount: state.scanCount + 1 })),
  payw: "",
  setpayw: (value) => set({ payw: normalizePriceTier(value) }),
  globalChildWeight: 0,
  setGlobalChildWeight: (value) => set({ globalChildWeight: value }),
  showPediatricModal: false,
  setShowPediatricModal: (value) => set({ showPediatricModal: value }),
  saleProducts: [],
  saleProductsLoaded: false,
  setSaleProducts: (value) => set({ saleProducts: Array.isArray(value) ? value : [], saleProductsLoaded: true }),
  selectedDrugSet: null,
  drugSetSelectionCount: 0,
  setSelectedDrugSet: (value) => set((state) => ({ selectedDrugSet: value, drugSetSelectionCount: state.drugSetSelectionCount + 1 })),
  saleCustomer: null,
  setSaleCustomer: (value) => set({ saleCustomer: value }),
  customerSearchRequest: 0,
  requestCustomerSearch: () => set((state) => ({ customerSearchRequest: state.customerSearchRequest + 1 })),
  customerRegisterRequest: 0,
  requestCustomerRegister: () => set((state) => ({ customerRegisterRequest: state.customerRegisterRequest + 1 })),
  customerClearRequest: 0,
  requestCustomerClear: () => set((state) => ({ customerClearRequest: state.customerClearRequest + 1 })),
  customerFollowUpRequest: 0,
  requestCustomerFollowUp: () => set((state) => ({ customerFollowUpRequest: state.customerFollowUpRequest + 1 })),
}));