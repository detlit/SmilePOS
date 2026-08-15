"use client";
import { create } from "zustand";

/**
 * ข้อมูลโต๊ะแต่ละตัวบนผังร้าน
 */
export interface TableItem {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  seats: number;
  shape: "rect" | "circle";
  status: "available" | "occupied" | "reserved";
  color: string;
  rotation: number;
}

const STORAGE_KEY = "tableLayout";

/** โต๊ะเริ่มต้นเมื่อไม่เคยบันทึกมาก่อน */
const DEFAULT_TABLES: TableItem[] = [
  { id: "t1", name: "T1", x: 60, y: 60, width: 100, height: 80, seats: 4, shape: "rect", status: "available", color: "#3b82f6", rotation: 0 },
  { id: "t2", name: "T2", x: 220, y: 60, width: 100, height: 80, seats: 4, shape: "rect", status: "available", color: "#3b82f6", rotation: 0 },
  { id: "t3", name: "T3", x: 380, y: 60, width: 100, height: 80, seats: 2, shape: "rect", status: "available", color: "#3b82f6", rotation: 0 },
  { id: "t4", name: "VIP1", x: 60, y: 220, width: 120, height: 120, seats: 6, shape: "circle", status: "available", color: "#8b5cf6", rotation: 0 },
  { id: "t5", name: "T5", x: 280, y: 220, width: 100, height: 80, seats: 4, shape: "rect", status: "available", color: "#3b82f6", rotation: 0 },
];

function loadFromStorage(): TableItem[] {
  if (typeof window === "undefined") return DEFAULT_TABLES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TABLES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TABLES;
  } catch {
    return DEFAULT_TABLES;
  }
}

function saveToStorage(tables: TableItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
}

let nextId = Date.now();
function genId() {
  return `table_${++nextId}`;
}

interface TableLayoutState {
  tables: TableItem[];
  selectedTableId: string | null;
  addTable: (partial?: Partial<TableItem>) => void;
  updateTable: (id: string, updates: Partial<TableItem>) => void;
  removeTable: (id: string) => void;
  selectTable: (id: string | null) => void;
  loadLayout: () => void;
  saveLayout: () => void;
  resetLayout: () => void;
}

export const useTableLayoutStore = create<TableLayoutState>((set, get) => ({
  tables: loadFromStorage(),
  selectedTableId: null,

  addTable: (partial) => {
    const id = genId();
    const newTable: TableItem = {
      id,
      name: `T${get().tables.length + 1}`,
      x: 200,
      y: 200,
      width: 100,
      height: 80,
      seats: 4,
      shape: "rect",
      status: "available",
      color: "#3b82f6",
      rotation: 0,
      ...partial,
    };
    set((s) => ({ tables: [...s.tables, newTable], selectedTableId: id }));
  },

  updateTable: (id, updates) => {
    set((s) => ({
      tables: s.tables.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  removeTable: (id) => {
    set((s) => ({
      tables: s.tables.filter((t) => t.id !== id),
      selectedTableId: s.selectedTableId === id ? null : s.selectedTableId,
    }));
  },

  selectTable: (id) => set({ selectedTableId: id }),

  loadLayout: () => {
    set({ tables: loadFromStorage(), selectedTableId: null });
  },

  saveLayout: () => {
    saveToStorage(get().tables);
  },

  resetLayout: () => {
    set({ tables: DEFAULT_TABLES, selectedTableId: null });
    saveToStorage(DEFAULT_TABLES);
  },
}));
