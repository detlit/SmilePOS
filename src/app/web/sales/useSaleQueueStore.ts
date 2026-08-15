"use client";

/**
 * สถานะคิวของหน้าขาย — อ่านจาก /api/sale-queue แล้วแชร์ให้ทุกจุดที่ต้องแสดงผล
 *
 * คิวเก็บในฐานข้อมูล จึงต้อง poll เพื่อให้เห็นความเคลื่อนไหวจากเครื่องอื่น
 * (ตั้งใจใช้ polling ธรรมดา ไม่ใช่ SSE เพราะรอบ 8 วิเบาพอ และไม่ต้องดูแล connection
 *  แบบเดียวกับ /api/print/stream ที่ต้องคอย reconnect)
 */

import { create } from "zustand";
import axios from "axios";
import { ACTIVE_QUEUE_STATUSES, queueDateOf, type QueueStatus, type SaleQueueRow } from "@/lib/saleQueue";

/** รอบ poll — ถี่พอให้เห็นคิวจากเครื่องอื่นทัน แต่ไม่ถี่จนกวนงานอื่นบนเครื่องขาย */
const POLL_MS = 8000;

/**
 * แปลง error ให้เป็นข้อความที่หน้าร้านเอาไปทำอะไรต่อได้
 * axios จะโยน "Request failed with status code 500" ซึ่งไม่บอกอะไรเลย —
 * ข้อความจริงอยู่ในฟิลด์ error ของ response ที่ฝั่ง API ส่งมา
 */
function describeQueueError(e: any): string {
  const fromApi = e?.response?.data?.error;
  if (typeof fromApi === "string" && fromApi.trim() !== "") return fromApi;
  if (e?.code === "ERR_NETWORK") return "ต่อเซิร์ฟเวอร์ไม่ได้ — คิวจะอัปเดตอีกครั้งเมื่อเชื่อมต่อได้";
  return e?.message || "โหลดคิวไม่สำเร็จ";
}

type SaleQueueState = {
  rows: SaleQueueRow[];
  loading: boolean;
  error: string;
  /** คิวล่าสุดที่เพิ่งออกจากเครื่องนี้ — ใช้ไฮไลต์บนแผงให้แคชเชียร์เห็นว่าใบไหนของตัวเอง */
  lastIssuedQueueNo: number | null;
  setLastIssuedQueueNo: (value: number | null) => void;
  refresh: (company: string) => Promise<void>;
  setStatus: (id: number, status: QueueStatus) => Promise<void>;
  startPolling: (company: string) => void;
  stopPolling: () => void;
};

let pollTimer: ReturnType<typeof setInterval> | null = null;
let pollCompany = "";

export const useSaleQueueStore = create<SaleQueueState>((set, get) => ({
  rows: [],
  loading: false,
  error: "",
  lastIssuedQueueNo: null,
  setLastIssuedQueueNo: (value) => set({ lastIssuedQueueNo: value }),

  refresh: async (company) => {
    if (!company) return;
    set({ loading: true });
    try {
      const res = await axios.get("/api/sale-queue", {
        params: { company, date: queueDateOf(), status: ACTIVE_QUEUE_STATUSES.join(",") },
      });
      set({ rows: Array.isArray(res.data) ? res.data : [], error: "", loading: false });
    } catch (e: any) {
      // อย่าล้าง rows ทิ้งตอนดึงพลาด — แคชเชียร์ควรยังเห็นคิวชุดล่าสุดระหว่างเน็ตสะดุด
      set({ error: describeQueueError(e), loading: false });
    }
  },

  setStatus: async (id, status) => {
    // อัปเดตหน้าจอก่อนเลย (optimistic) เพราะปุ่มนี้ถูกกดรัว ๆ ตอนหน้าร้านยุ่ง
    const before = get().rows;
    set({ rows: before.map((r) => (r.id === id ? { ...r, status } : r)) });
    try {
      await axios.patch(`/api/sale-queue/${id}`, { status });
      await get().refresh(pollCompany);
    } catch (e: any) {
      set({ rows: before, error: describeQueueError(e) });
    }
  },

  startPolling: (company) => {
    if (!company) return;
    // เรียกซ้ำด้วยบริษัทเดิม = ไม่ต้องตั้ง timer ใหม่ (component remount บ่อยในหน้านี้)
    if (pollTimer && pollCompany === company) return;
    get().stopPolling();
    pollCompany = company;
    void get().refresh(company);
    pollTimer = setInterval(() => { void get().refresh(company); }, POLL_MS);
  },

  stopPolling: () => {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  },
}));
