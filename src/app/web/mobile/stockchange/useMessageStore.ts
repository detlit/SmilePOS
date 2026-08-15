"use client";
import { create } from "zustand";

interface MessageState {
  ids: string;
  setidcus: (value: string) => void;
  itemcodes: string;
  setitem: (value: string) => void;
  maxSup: string;
  setMax: (value: string) => void;
  cpage: string;
  setcpage: (value: string) => void;

}

export const useMessageStore = create<MessageState>((set) => ({
  ids: "",
  setidcus: (value) => set({ ids: value }),
  itemcodes: "",
  setitem: (value) => set({ itemcodes: value }),
  maxSup: "",
  setMax: (value) => set({ maxSup: value }),
  cpage: "",
  setcpage: (value) => set({ cpage: value }),

}));

//ids:"",itemcodes:"",maxSup:""