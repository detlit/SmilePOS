"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    LANGUAGES,
    LanguageCode,
    translateText,
    speakText,
    ChatMessage
} from './useCommunicationStore';

// Speech Recognition types
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    onend: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

const STORAGE_KEY = "comm_session";

interface SessionData {
    isSessionActive: boolean;
    sellerLang: LanguageCode;
    buyerLang: LanguageCode;
    messages: ChatMessage[];
}

export default function BuyerCommunicationModal() {
    const [session, setSession] = useState<SessionData | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef(0);

    // Poll localStorage for session updates + listen for storage events
    useEffect(() => {
        const loadSession = () => {
            try {
                const data = localStorage.getItem(STORAGE_KEY);
                if (data) {
                    const parsed = JSON.parse(data);
                    if (parsed.isSessionActive) {
                        setSession(parsed);
                    } else {
                        setSession(null);
                    }
                } else {
                    setSession(null);
                }
            } catch (e) {
                console.error("Failed to load session:", e);
                setSession(null);
            }
        };

        // Listen for storage changes (when seller ends session)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY || e.key === null) {
                loadSession();
            }
        };

        loadSession();
        window.addEventListener('storage', handleStorageChange);
        const interval = setInterval(loadSession, 800); // Faster polling

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [session?.messages]);

    // Speak seller messages when they arrive
    useEffect(() => {
        if (!session) return;

        const currentLength = session.messages.length;
        if (currentLength > prevMessagesLengthRef.current) {
            const newMessages = session.messages.slice(prevMessagesLengthRef.current);
            newMessages.forEach(msg => {
                if (msg.sender === 'seller') {
                    speakText(msg.translatedText, session.buyerLang);
                }
            });
        }
        prevMessagesLengthRef.current = currentLength;
    }, [session?.messages, session?.buyerLang]);

    // Listen for seller enabling buyer's microphone
    useEffect(() => {
        if (!session) return;

        const checkMicEnabled = () => {
            const micEnabled = localStorage.getItem('buyer_mic_enabled');
            if (micEnabled === 'true' && !isListening) {
                // Auto-start listening when seller enables mic
                startListeningAuto();
            }
        };

        // Check immediately
        checkMicEnabled();

        // Poll for changes
        const interval = setInterval(checkMicEnabled, 500);

        // Listen for storage events
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'buyer_mic_enabled') {
                checkMicEnabled();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [session, isListening]);

    // Auto start listening function (called when seller enables)
    const startListeningAuto = () => {
        if (!session || isListening) return;

        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) return;

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = LANGUAGES[session.buyerLang].speechCode;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const result = event.results[event.results.length - 1];
            const text = result[0].transcript;
            setTranscript(text);

            if (result.isFinal) {
                handleSendMessage(text);
                // Reset the mic enabled flag after sending
                localStorage.setItem('buyer_mic_enabled', 'false');
            }
        };

        recognition.onerror = () => {
            setIsListening(false);
            localStorage.setItem('buyer_mic_enabled', 'false');
        };

        recognition.onend = () => {
            setIsListening(false);
            localStorage.setItem('buyer_mic_enabled', 'false');
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
            setIsListening(true);
        } catch (e) {
            console.error('Failed to start auto-listening:', e);
        }
    };

    const syncToLocalStorage = (updatedMessages: ChatMessage[]) => {
        if (!session) return;
        const data = {
            ...session,
            messages: updatedMessages
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setSession(data);
    };

    const startListening = useCallback(() => {
        if (!session) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech Recognition ไม่รองรับในเบราว์เซอร์นี้');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = LANGUAGES[session.buyerLang].speechCode;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const result = event.results[event.results.length - 1];
            const text = result[0].transcript;
            setTranscript(text);

            if (result.isFinal) {
                handleSendMessage(text);
            }
        };

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
    }, [session]);

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || !session) return;

        setIsTranslating(true);
        try {
            const translated = await translateText(text, session.buyerLang, session.sellerLang);

            const newMessage: ChatMessage = {
                id: Date.now(),
                sender: 'buyer',
                originalText: text,
                translatedText: translated,
                originalLang: session.buyerLang,
                targetLang: session.sellerLang,
                timestamp: new Date()
            };

            const updatedMessages = [...session.messages, newMessage];
            syncToLocalStorage(updatedMessages);
            setTranscript('');
        } catch (error) {
            console.error('Translation failed:', error);
        } finally {
            setIsTranslating(false);
        }
    };

    // Don't render if no active session
    if (!session) {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #F3F8FC 0%, #e3f2fd 50%, #fff8e1 100%)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            padding: 40
        }}>
            {/* Header - Compact */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
                paddingBottom: 6,
                borderBottom: '1px solid #3E86C7'
            }}>
                <div style={{
                    fontFamily: 'Kanit',
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#173F6B'
                }}>
                    🎤 สนทนากับผู้ขาย
                </div>
                <div style={{
                    fontFamily: 'Kanit',
                    fontSize: 10,
                    color: '#fff',
                    backgroundColor: '#3E86C7',
                    padding: '3px 10px',
                    borderRadius: 10
                }}>
                    ภาษา: {LANGUAGES[session.buyerLang].name}
                </div>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                backgroundColor: '#f8f9fa',
                borderRadius: 16,
                padding: 25,
                marginBottom: 20
            }}>
                {session.messages.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        color: '#999',
                        fontFamily: 'Kanit',
                        fontSize: 22,
                        paddingTop: 80
                    }}>
                        💬 รอข้อความจากผู้ขาย<br />
                        หรือกดปุ่มไมโครโฟนเพื่อพูด
                    </div>
                )}

                {session.messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} isSeller={false} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Transcript Preview */}
            {transcript && (
                <div style={{
                    padding: 15,
                    backgroundColor: '#fff3cd',
                    borderRadius: 12,
                    marginBottom: 20,
                    fontFamily: 'Kanit',
                    fontSize: 18,
                    textAlign: 'center'
                }}>
                    🎙️ {transcript}
                </div>
            )}

            {/* Microphone Button - Hidden, controlled by seller */}
            {isListening && (
                <div style={{
                    textAlign: 'center',
                    padding: 10,
                    backgroundColor: '#ffebee',
                    borderRadius: 12,
                    marginTop: 10
                }}>
                    <div style={{
                        fontFamily: 'Kanit',
                        fontSize: 16,
                        color: '#dc3545',
                        fontWeight: 'bold'
                    }}>
                        🔴 กำลังฟัง... พูดได้เลย
                    </div>
                </div>
            )}
        </div>
    );
}

// Message Bubble Component
function MessageBubble({ message, isSeller }: { message: ChatMessage; isSeller: boolean }) {
    const isFromMe = (isSeller && message.sender === 'seller') || (!isSeller && message.sender === 'buyer');

    return (
        <div style={{
            display: 'flex',
            justifyContent: isFromMe ? 'flex-end' : 'flex-start',
            marginBottom: 25
        }}>
            <div style={{
                maxWidth: '90%',
                padding: 25,
                borderRadius: 25,
                backgroundColor: isFromMe ? '#CCDFF1' : '#90caf9',
                color: '#1a1a1a',
                fontFamily: 'Kanit',
                boxShadow: '0 6px 20px rgba(0,0,0,0.12)'
            }}>
                <div style={{ fontSize: 22, opacity: 0.7, marginBottom: 10 }}>
                    {message.sender === 'seller' ? '👤 ผู้ขาย' : '🛒 คุณ'}
                </div>
                <div style={{ fontSize: 42, fontWeight: 500, lineHeight: 1.5 }}>
                    {isFromMe ? message.originalText : message.translatedText}
                </div>
                {!isFromMe && message.originalText !== message.translatedText && (
                    <div style={{ fontSize: 18, opacity: 0.6, marginTop: 15, fontStyle: 'italic' }}>
                        ต้นฉบับ: {message.originalText}
                    </div>
                )}
            </div>
        </div>
    );
}
