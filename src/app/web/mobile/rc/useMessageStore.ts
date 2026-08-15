"use client";
import { create } from "zustand";

interface MessageState {
  maxRec: string;
  setmaxRec: (value: string) => void;
  idcus: string;
  setidcus: (value: string) => void;
  codes: string;
  setcodes: (value: string) => void;
  companys: string;
  setcompanys: (value: string) => void;
  rcnumber: string;
  setrcnumber: (value: string) => void;
  cpage: string;
  setcpage: (value: string) => void;
  scannedBarcode: string;
  setScannedBarcode: (value: string) => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  maxRec: "",
  setmaxRec: (value) => set({ maxRec: value }),
  idcus: "",
  setidcus: (value) => set({ idcus: value }),
  codes: "",
  setcodes: (value) => set({ codes: value }),
  companys: "",
  setcompanys: (value) => set({ companys: value }),
  rcnumber: "",
  setrcnumber: (value) => set({ rcnumber: value }),
  cpage: "",
  setcpage: (value) => set({ cpage: value }),
  scannedBarcode: "",
  setScannedBarcode: (value) => set({ scannedBarcode: value }),
}));
