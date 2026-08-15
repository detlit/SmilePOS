"use client";
import { create } from "zustand";

interface MessageState {
  maxS: string;
  setMax: (value: string) => void;
  idcus: string;
  setidcus: (value: string) => void;
   cpage: string;
  setcpage: (value: string) => void;

}

export const useMessageStore = create<MessageState>((set) => ({
  maxS: "",
  setMax: (value) => set({ maxS: value }),
  idcus: "",
  setidcus: (value) => set({ idcus: value }),
   cpage: "",
  setcpage: (value) => set({ cpage: value }),

}));