"use client";
import { create } from "zustand";

interface MessageState {
  message: string;
  setMessage: (value: string) => void;
  savehis: string;
  setsavehis: (value: string) => void;
  savemu: string;
  setsavemu: (value: string) => void;
  idsale: string;
  setsale: (value: string) => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  message: "",
  setMessage: (value) => set({ message: value }),
   savehis: "",
  setsavehis: (value) => set({ savehis: value }),
  savemu: "",
  setsavemu: (value) => set({ savemu: value }),
  idsale: "",
  setsale: (value) => set({ idsale: value }),
}));