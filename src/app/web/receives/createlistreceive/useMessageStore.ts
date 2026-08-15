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
  decimalPlaces: number;
  setDecimalPlaces: (value: number) => void;
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
  decimalPlaces: typeof window !== "undefined" ? Number(localStorage.getItem("decimalPlaces") ?? 2) : 2,
  setDecimalPlaces: (value) => {
    if (typeof window !== "undefined") localStorage.setItem("decimalPlaces", String(value));
    set({ decimalPlaces: value });
  },

}));

//idcus:"",maxRec:"",codes:"",companys:"",rcnumber:""