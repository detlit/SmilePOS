"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
} from "@heroui/react";
import {
    useCommunicationStore,
    LANGUAGES,
    LanguageCode,
    translateText,
    speakText,
    ChatMessage
} from './useCommunicationStore';
import { useVoskRecognition } from './useVoskRecognition';

// Detect if running in Electron - use function to avoid SSR issues
const getIsElectron = () => typeof window !== 'undefined' && !!(window as any).electron;

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

export function SellerCommunicationModal() {
    const modal = useDisclosure();
    const {
        isSessionActive,
        sellerLang,
        buyerLang,
        messages,
        setSellerLang,
        setBuyerLang,
        startSession,
        endSession,
        addMessage,
        loadFromLocalStorage
    } = useCommunicationStore();

    // Vosk for Electron
    const vosk = useVoskRecognition();
    const [voskLoading, setVoskLoading] = useState(false);

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [buyerMicEnabled, setBuyerMicEnabled] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef(0);
    const isCancelledRef = useRef(false);  // Flag to track if cancelled

    // Refs to avoid stale closure
    const sellerLangRef = useRef(sellerLang);
    const buyerLangRef = useRef(buyerLang);

    useEffect(() => {
        sellerLangRef.current = sellerLang;
        buyerLangRef.current = buyerLang;
    }, [sellerLang, buyerLang]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Poll for updates from buyer
    useEffect(() => {
        if (!isSessionActive) return;

        const interval = setInterval(() => {
            loadFromLocalStorage();
        }, 1500);

        return () => clearInterval(interval);
    }, [isSessionActive, loadFromLocalStorage]);

    // Sync Vosk transcript with UI (for Electron)
    useEffect(() => {
        if (getIsElectron() && vosk.transcript) {
            setTranscript(vosk.transcript);
        }
    }, [vosk.transcript]);

    // Speak buyer messages when they arrive
    useEffect(() => {
        if (messages.length > prevMessagesLengthRef.current) {
            const newMessages = messages.slice(prevMessagesLengthRef.current);
            newMessages.forEach(msg => {
                if (msg.sender === 'buyer') {
                    speakText(msg.translatedText, sellerLang);
                }
            });
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages, sellerLang]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        setIsTranslating(true);
        try {
            const currentSellerLang = sellerLangRef.current;
            const currentBuyerLang = buyerLangRef.current;

            const translated = await translateText(text, currentSellerLang, currentBuyerLang);

            addMessage({
                sender: 'seller',
                originalText: text,
                translatedText: translated,
                originalLang: currentSellerLang,
                targetLang: currentBuyerLang
            });

            setTranscript('');
        } catch (error) {
            console.error('Translation failed:', error);
        } finally {
            setIsTranslating(false);
        }
    };

    const startListening = async () => {
        // Try Web Speech API first (works in browser, may work in Electron on some systems)
        const SpeechRecognitionAPI = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : undefined;

        // If in Electron and Vosk is loading, show loading state
        if (getIsElectron() && vosk.isLoading) {
            setVoskLoading(true);
            return;
        }

        // Request microphone permission first
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the stream immediately after getting permission
            stream.getTracks().forEach(track => track.stop());
        } catch (err: any) {
            console.error('Microphone permission error:', err);
            return;
        }

        // Try Web Speech API
        if (SpeechRecognitionAPI) {
            // Stop any existing recognition
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }

            const recognition = new SpeechRecognitionAPI();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = LANGUAGES[sellerLangRef.current].speechCode;

            let fullTranscript = '';

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = 0; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        finalTranscript += result[0].transcript + ' ';
                    } else {
                        interimTranscript += result[0].transcript;
                    }
                }

                fullTranscript = finalTranscript;
                setTranscript(finalTranscript + interimTranscript);
            };

            recognition.onerror = (event: any) => {
                if (event.error === 'no-speech' || event.error === 'aborted') {
                    return;
                }
                console.error('Speech recognition error:', event.error);
                setIsListening(false);

                // If network error in Electron, show message to user
                if (getIsElectron() && (event.error === 'network' || event.error === 'not-allowed')) {
                    console.log('Web Speech API not available in Electron');
                    // Show message in transcript area instead of freezing
                    setTranscript('⚠️ ไมโครโฟนไม่สามารถใช้งานใน Electron ได้ กรุณาใช้ Chrome browser แทน (เปิด http://localhost:3000 ใน Chrome)');
                }
            };

            recognition.onend = () => {
                if (!isCancelledRef.current && fullTranscript.trim()) {
                    handleSendMessage(fullTranscript.trim());
                }
                isCancelledRef.current = false;
                setIsListening(false);
                setTranscript('');
            };

            recognitionRef.current = recognition;

            try {
                recognition.start();
                setIsListening(true);
            } catch (error) {
                console.error('Failed to start recognition:', error);
                // Try Vosk as fallback in Electron
                if (getIsElectron()) {
                    startVoskListening();
                }
            }
        } else if (getIsElectron()) {
            // No Web Speech API, try Vosk
            startVoskListening();
        }
    };

    // Vosk fallback for Electron
    const startVoskListening = async () => {
        setVoskLoading(true);
        try {
            await vosk.startListening();
            setIsListening(true);
        } catch (err) {
            console.error('Vosk start error:', err);
        } finally {
            setVoskLoading(false);
        }
    };

    const stopListening = () => {
        if (getIsElectron() && vosk.isListening) {
            // Stop Vosk and get transcript
            vosk.stopListening();
            if (vosk.transcript.trim()) {
                handleSendMessage(vosk.transcript.trim());
            }
            setIsListening(false);
            return;
        }

        // Web Speech API
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    // Cancel/Reset - abort without sending
    const cancelListening = () => {
        if (getIsElectron() && vosk.isListening) {
            vosk.stopListening();
            setIsListening(false);
            return;
        }

        isCancelledRef.current = true;
        try {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
                recognitionRef.current = null;
            }
        } catch (e) {
            console.log('Cancel ignored:', e);
        }
        setIsListening(false);
        setTranscript('');
    };

    const handleStartSession = () => {
        startSession();
    };

    const handleEndSession = () => {
        endSession();
        modal.onClose();
    };

    return (
        <>
            <button
                style={{
                    fontFamily: 'Kanit',
                    fontSize: 13,
                    padding: '4px 12px',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 32,
                    backgroundColor: '#e0e0e0',
                    border: '1px solid #bdbdbd',
                    color: '#424242',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                }}
                onClick={modal.onOpen}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#bdbdbd'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
            >
                🎤 สื่อสารลูกค้า
            </button>

            <Modal
                isOpen={modal.isOpen}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        handleEndSession();
                    }
                }}
                size="2xl"
                scrollBehavior="inside"
            >
                <ModalContent style={{ backgroundColor: '#fff', minHeight: 500 }}>
                    {() => (
                        <>
                            <ModalHeader style={{
                                backgroundColor: '#17a2b8',
                                color: 'white',
                                fontFamily: 'Kanit'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    🎤 สื่อสารลูกค้า - แปลภาษาอัตโนมัติ
                                </div>
                            </ModalHeader>

                            <ModalBody style={{ padding: 20 }}>
                                {/* Language Selection */}
                                {!isSessionActive && (
                                    <div style={{
                                        backgroundColor: '#f8f9fa',
                                        padding: 20,
                                        borderRadius: 12,
                                        marginBottom: 20
                                    }}>
                                        <h5 style={{ fontFamily: 'Kanit', marginBottom: 15, color: '#333' }}>
                                            เลือกภาษาสำหรับการสื่อสาร
                                        </h5>

                                        <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap' }}>
                                            <div style={{ flex: 1, minWidth: 200 }}>
                                                <label style={{
                                                    fontFamily: 'Kanit',
                                                    fontSize: 14,
                                                    color: '#666',
                                                    marginBottom: 8,
                                                    display: 'block'
                                                }}>
                                                    ภาษาผู้ขาย (คุณ)
                                                </label>
                                                <select
                                                    className="form-select"
                                                    value={sellerLang}
                                                    onChange={(e) => setSellerLang(e.target.value as LanguageCode)}
                                                    style={{ fontFamily: 'Kanit', fontSize: 16 }}
                                                >
                                                    {Object.entries(LANGUAGES).map(([code, lang]) => (
                                                        <option key={code} value={code}>{lang.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div style={{ flex: 1, minWidth: 200 }}>
                                                <label style={{
                                                    fontFamily: 'Kanit',
                                                    fontSize: 14,
                                                    color: '#666',
                                                    marginBottom: 8,
                                                    display: 'block'
                                                }}>
                                                    ภาษาผู้ซื้อ (ลูกค้า)
                                                </label>
                                                <select
                                                    className="form-select"
                                                    value={buyerLang}
                                                    onChange={(e) => setBuyerLang(e.target.value as LanguageCode)}
                                                    style={{ fontFamily: 'Kanit', fontSize: 16 }}
                                                >
                                                    {Object.entries(LANGUAGES).map(([code, lang]) => (
                                                        <option key={code} value={code}>{lang.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{
                                            marginTop: 20,
                                            padding: 15,
                                            backgroundColor: '#e7f3ff',
                                            borderRadius: 8,
                                            fontSize: 14,
                                            fontFamily: 'Kanit',
                                            color: '#0066cc'
                                        }}>
                                            💡 คุณพูด {LANGUAGES[sellerLang].name} → ลูกค้าจะเห็นเป็น {LANGUAGES[buyerLang].name}
                                        </div>

                                        <button
                                            className="btn btn-success btn-lg"
                                            style={{
                                                marginTop: 20,
                                                fontFamily: 'Kanit',
                                                width: '100%'
                                            }}
                                            onClick={handleStartSession}
                                        >
                                            🚀 เริ่มการสนทนา
                                        </button>
                                    </div>
                                )}

                                {/* Active Session */}
                                {isSessionActive && (
                                    <>
                                        {/* Session Info */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: 15,
                                            padding: 10,
                                            backgroundColor: '#d4edda',
                                            borderRadius: 8
                                        }}>
                                            <span style={{ fontFamily: 'Kanit', color: '#155724' }}>
                                                🟢 กำลังสนทนา: {LANGUAGES[sellerLang].name} ↔ {LANGUAGES[buyerLang].name}
                                            </span>
                                            <button
                                                className="btn btn-outline-danger btn-sm"
                                                style={{ fontFamily: 'Kanit' }}
                                                onClick={handleEndSession}
                                            >
                                                จบการสนทนา
                                            </button>
                                        </div>

                                        {/* Chat Messages */}
                                        <div style={{
                                            height: 250,
                                            overflowY: 'auto',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: 12,
                                            padding: 15,
                                            marginBottom: 15
                                        }}>
                                            {messages.length === 0 && (
                                                <div style={{
                                                    textAlign: 'center',
                                                    color: '#999',
                                                    fontFamily: 'Kanit',
                                                    marginTop: 50
                                                }}>
                                                    กดปุ่มไมโครโฟนเพื่อเริ่มพูด
                                                </div>
                                            )}

                                            {messages.map((msg) => (
                                                <MessageBubble key={msg.id} message={msg} isSeller={true} />
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        {/* Transcript Preview */}
                                        {transcript && (
                                            <div style={{
                                                padding: 10,
                                                backgroundColor: '#fff3cd',
                                                borderRadius: 8,
                                                marginBottom: 15,
                                                fontFamily: 'Kanit',
                                                fontSize: 14
                                            }}>
                                                🎙️ {transcript}
                                            </div>
                                        )}

                                        {/* Microphone Buttons - Seller & Buyer - Compact */}
                                        <div style={{
                                            display: 'flex',
                                            gap: 15,
                                            justifyContent: 'center',
                                            alignItems: 'flex-start',
                                            padding: 10,
                                            backgroundColor: '#f0f4f8',
                                            borderRadius: 8
                                        }}>
                                            {/* Seller Microphone */}
                                            <div style={{
                                                textAlign: 'center',
                                                padding: 8,
                                                backgroundColor: '#e3f2fd',
                                                borderRadius: 8,
                                                border: '1px solid #2196f3',
                                                minWidth: 100
                                            }}>
                                                <div style={{
                                                    fontFamily: 'Kanit',
                                                    fontSize: 11,
                                                    fontWeight: 'bold',
                                                    color: '#1565c0',
                                                    marginBottom: 5
                                                }}>
                                                    👤 ผู้ขาย
                                                </div>
                                                <div style={{ display: 'flex', gap: 5, justifyContent: 'center', alignItems: 'center' }}>
                                                    {/* Reset Button - Show when listening */}
                                                    {isListening && (
                                                        <button
                                                            className="btn btn-warning btn-sm"
                                                            style={{
                                                                borderRadius: '50%',
                                                                width: 28,
                                                                height: 28,
                                                                fontSize: 12,
                                                                padding: 0,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                            onClick={cancelListening}
                                                            title="ยกเลิก"
                                                        >
                                                            🔄
                                                        </button>
                                                    )}
                                                    {/* Main Mic Button */}
                                                    <button
                                                        className={`btn btn-${isListening ? 'danger' : 'primary'}`}
                                                        style={{
                                                            borderRadius: '50%',
                                                            width: 40,
                                                            height: 40,
                                                            fontSize: 16,
                                                            padding: 0,
                                                            boxShadow: isListening ? '0 0 10px rgba(220, 53, 69, 0.5)' : '0 2px 8px rgba(0,0,0,0.2)'
                                                        }}
                                                        onClick={isListening ? stopListening : startListening}
                                                        disabled={isTranslating}
                                                    >
                                                        {isListening ? '⏹️' : '🎤'}
                                                    </button>
                                                </div>
                                                <div style={{
                                                    marginTop: 4,
                                                    fontFamily: 'Kanit',
                                                    fontSize: 10,
                                                    color: isListening ? '#dc3545' : '#666'
                                                }}>
                                                    {isListening ? '🔴 ฟัง...' :
                                                        isTranslating ? '⏳...' : 'กดพูด'}
                                                </div>
                                            </div>

                                            {/* Buyer Microphone - Clickable */}
                                            <div style={{
                                                textAlign: 'center',
                                                padding: 8,
                                                backgroundColor: buyerMicEnabled ? '#D3F0E2' : '#EDF9F3',
                                                borderRadius: 8,
                                                border: buyerMicEnabled ? '2px solid #0C5238' : '1px solid #1F9D6B',
                                                transition: 'all 0.3s ease',
                                                minWidth: 100
                                            }}>
                                                <div style={{
                                                    fontFamily: 'Kanit',
                                                    fontSize: 11,
                                                    fontWeight: 'bold',
                                                    color: '#173F6B',
                                                    marginBottom: 5
                                                }}>
                                                    🛒 ผู้ซื้อ
                                                </div>
                                                <button
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '50%',
                                                        backgroundColor: buyerMicEnabled ? '#0C5238' : '#1F9D6B',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 16,
                                                        margin: '0 auto',
                                                        color: 'white',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        boxShadow: buyerMicEnabled ? '0 0 12px rgba(12, 82, 56, 0.6)' : '0 2px 8px rgba(31, 157, 107, 0.3)',
                                                        transition: 'all 0.3s ease',
                                                        transform: buyerMicEnabled ? 'scale(1.1)' : 'scale(1)'
                                                    }}
                                                    onClick={() => {
                                                        const newState = !buyerMicEnabled;
                                                        setBuyerMicEnabled(newState);
                                                        localStorage.setItem('buyer_mic_enabled', newState ? 'true' : 'false');
                                                    }}
                                                >
                                                    {buyerMicEnabled ? '🔴' : '🎤'}
                                                </button>
                                                <div style={{
                                                    marginTop: 4,
                                                    fontFamily: 'Kanit',
                                                    fontSize: 10,
                                                    color: buyerMicEnabled ? '#0C5238' : '#666',
                                                    fontWeight: buyerMicEnabled ? 'bold' : 'normal'
                                                }}>
                                                    {buyerMicEnabled ? '🟢 เปิดแล้ว' : 'กดเปิดไมค์'}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </ModalBody>

                            <ModalFooter style={{ backgroundColor: '#f8f9fa' }}>
                                <button
                                    className="btn btn-secondary"
                                    style={{ fontFamily: 'Kanit' }}
                                    onClick={handleEndSession}
                                >
                                    ปิด
                                </button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}

// Message Bubble Component
function MessageBubble({ message, isSeller }: { message: ChatMessage; isSeller: boolean }) {
    const isFromMe = (isSeller && message.sender === 'seller') || (!isSeller && message.sender === 'buyer');

    return (
        <div style={{
            display: 'flex',
            justifyContent: isFromMe ? 'flex-end' : 'flex-start',
            marginBottom: 10
        }}>
            <div style={{
                maxWidth: '80%',
                padding: 12,
                borderRadius: 16,
                backgroundColor: isFromMe ? '#007bff' : '#e9ecef',
                color: isFromMe ? 'white' : 'black',
                fontFamily: 'Kanit'
            }}>
                <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>
                    {isFromMe ? '(คุณ)' : message.sender === 'seller' ? '(ผู้ขาย)' : '(ลูกค้า)'}
                </div>
                <div style={{ fontSize: 15 }}>
                    {isFromMe ? message.originalText : message.translatedText}
                </div>
                {!isFromMe && message.originalText !== message.translatedText && (
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 5, fontStyle: 'italic' }}>
                        ต้นฉบับ: {message.originalText}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SellerCommunicationModal;
