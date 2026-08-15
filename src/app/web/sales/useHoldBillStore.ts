"use client";
import { create } from "zustand";

export interface HoldBill {
  id: number;
  list: any[];
  list_rc: any[];
  customerCode: string;
  customerName: string;
  payw: string;
  timestamp: number;
  total: number;
  itemCount: number;
  childWeight: number;
}

const MAX_BILLS = 5;
const STORAGE_KEY = "holdBills";
const ACTIVE_INDEX_KEY = "holdBillActiveIndex";

function loadFromStorage(): { bills: (HoldBill | null)[]; activeIndex: number } {
  if (typeof window === "undefined") return { bills: [null, null, null, null, null], activeIndex: 0 };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedIndex = localStorage.getItem(ACTIVE_INDEX_KEY);
    const bills = saved ? JSON.parse(saved) : [null, null, null, null, null];
    const activeIndex = savedIndex ? parseInt(savedIndex, 10) : 0;
    // ensure array length is always 5
    while (bills.length < MAX_BILLS) bills.push(null);
    return { bills: bills.slice(0, MAX_BILLS), activeIndex: Math.min(activeIndex, MAX_BILLS - 1) };
  } catch {
    return { bills: [null, null, null, null, null], activeIndex: 0 };
  }
}

function saveToStorage(bills: (HoldBill | null)[], activeIndex: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
  localStorage.setItem(ACTIVE_INDEX_KEY, String(activeIndex));
}

interface HoldBillState {
  bills: (HoldBill | null)[];
  activeIndex: number;
  // Save current cart data into a specific slot
  saveBillToSlot: (index: number, data: Omit<HoldBill, "id" | "timestamp">) => void;
  // Clear a specific slot
  clearSlot: (index: number) => void;
  // Set active index
  setActiveIndex: (index: number) => void;
  // Get count of held bills (non-null slots)
  getHeldCount: () => number;
  // Find next empty slot index, returns -1 if all full
  findEmptySlot: () => number;
}

const initial = loadFromStorage();

export const useHoldBillStore = create<HoldBillState>((set, get) => ({
  bills: initial.bills,
  activeIndex: initial.activeIndex,

  saveBillToSlot: (index, data) => {
    set((state) => {
      const newBills = [...state.bills];
      newBills[index] = {
        ...data,
        id: index,
        timestamp: Date.now(),
      };
      saveToStorage(newBills, state.activeIndex);
      return { bills: newBills };
    });
  },

  clearSlot: (index) => {
    set((state) => {
      const newBills = [...state.bills];
      newBills[index] = null;
      saveToStorage(newBills, state.activeIndex);
      return { bills: newBills };
    });
  },

  setActiveIndex: (index) => {
    set(() => {
      const bills = get().bills;
      saveToStorage(bills, index);
      return { activeIndex: index };
    });
  },

  getHeldCount: () => {
    return get().bills.filter((b) => b !== null).length;
  },

  findEmptySlot: () => {
    const bills = get().bills;
    for (let i = 0; i < MAX_BILLS; i++) {
      if (bills[i] === null) return i;
    }
    return -1;
  },
}));
