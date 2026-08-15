"use client";
import { create } from "zustand";

// Language configuration
export const LANGUAGES = {
    th: { name: 'ไทย', speechCode: 'th-TH' },
    en: { name: 'อังกฤษ', speechCode: 'en-US' },
    my: { name: 'พม่า', speechCode: 'my-MM' },
    lo: { name: 'ลาว', speechCode: 'lo-LA' },
    zh: { name: 'จีน', speechCode: 'zh-CN' },
    ms: { name: 'บาฮาซา', speechCode: 'ms-MY' }
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

export interface ChatMessage {
    id: number;
    sender: 'seller' | 'buyer';
    originalText: string;
    translatedText: string;
    originalLang: LanguageCode;
    targetLang: LanguageCode;
    timestamp: Date;
}

interface CommunicationState {
    // Session state
    isSessionActive: boolean;
    sellerLang: LanguageCode;
    buyerLang: LanguageCode;
    messages: ChatMessage[];

    // Actions
    setSellerLang: (lang: LanguageCode) => void;
    setBuyerLang: (lang: LanguageCode) => void;
    startSession: () => void;
    endSession: () => void;
    addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    clearMessages: () => void;

    // Sync helpers
    syncToLocalStorage: () => void;
    loadFromLocalStorage: () => void;
}

const STORAGE_KEY = "comm_session";

export const useCommunicationStore = create<CommunicationState>((set, get) => ({
    isSessionActive: false,
    sellerLang: 'th',
    buyerLang: 'th',
    messages: [],

    setSellerLang: (lang) => {
        set({ sellerLang: lang });
        get().syncToLocalStorage();
    },

    setBuyerLang: (lang) => {
        set({ buyerLang: lang });
        get().syncToLocalStorage();
    },

    startSession: () => {
        set({ isSessionActive: true, messages: [] });
        get().syncToLocalStorage();
    },

    endSession: () => {
        set({ isSessionActive: false, messages: [] });
        localStorage.removeItem(STORAGE_KEY);
    },

    addMessage: (msg) => {
        const newMessage: ChatMessage = {
            ...msg,
            id: Date.now(),
            timestamp: new Date()
        };
        set((state) => ({ messages: [...state.messages, newMessage] }));
        get().syncToLocalStorage();
    },

    clearMessages: () => {
        set({ messages: [] });
        get().syncToLocalStorage();
    },

    syncToLocalStorage: () => {
        const state = get();
        const data = {
            isSessionActive: state.isSessionActive,
            sellerLang: state.sellerLang,
            buyerLang: state.buyerLang,
            messages: state.messages
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },

    loadFromLocalStorage: () => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                set({
                    isSessionActive: parsed.isSessionActive || false,
                    sellerLang: parsed.sellerLang || 'th',
                    buyerLang: parsed.buyerLang || 'th',
                    messages: parsed.messages || []
                });
            }
        } catch (e) {
            console.error("Failed to load communication session:", e);
        }
    }
}));

// Translation helper using MyMemory API (free)
export async function translateText(
    text: string,
    fromLang: LanguageCode,
    toLang: LanguageCode
): Promise<string> {
    if (fromLang === toLang || !text.trim()) return text;

    try {
        const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
        );
        const data = await response.json();

        if (data.responseStatus === 200 && data.responseData?.translatedText) {
            return data.responseData.translatedText;
        }
        return text; // Return original if translation fails
    } catch (error) {
        console.error("Translation error:", error);
        return text;
    }
}

// Speech synthesis helper
export function speakText(text: string, langCode: LanguageCode) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = LANGUAGES[langCode].speechCode;
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
}
