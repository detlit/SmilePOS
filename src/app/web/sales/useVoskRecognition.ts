"use client";
import { useState, useRef, useCallback, useEffect } from 'react';

// Vosk model URL - Thai model
const THAI_MODEL_URL = 'https://alphacephei.com/vosk/models/vosk-model-small-th-0.4.zip';

// Check if we're in Electron - use function to avoid SSR issues
const getIsElectron = () => typeof window !== 'undefined' && !!(window as any).electron;

interface VoskRecognizerResult {
    text: string;
    partial?: string;
}

export function useVoskRecognition() {
    const [isSupported, setIsSupported] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const modelRef = useRef<any>(null);
    const recognizerRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Check if Vosk is supported (only in Electron)
    useEffect(() => {
        setIsSupported(getIsElectron());
    }, []);

    // Load Vosk model
    const loadModel = useCallback(async () => {
        if (!getIsElectron()) {
            setError('Vosk is only supported in Electron');
            return false;
        }

        if (modelRef.current) {
            return true; // Already loaded
        }

        setIsLoading(true);
        setError(null);

        try {
            const { createModel } = await import('vosk-browser');

            // Create model from URL
            const model = await createModel(THAI_MODEL_URL);
            modelRef.current = model;

            // Create recognizer
            recognizerRef.current = new model.KaldiRecognizer(16000);

            setIsLoading(false);
            return true;
        } catch (err: any) {
            console.error('Failed to load Vosk model:', err);
            setError('ไม่สามารถโหลด Vosk model ได้: ' + err.message);
            setIsLoading(false);
            return false;
        }
    }, []);

    // Start listening
    const startListening = useCallback(async () => {
        if (!getIsElectron()) {
            setError('Vosk is only supported in Electron');
            return;
        }

        // Load model if not loaded
        if (!modelRef.current) {
            const loaded = await loadModel();
            if (!loaded) return;
        }

        try {
            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            streamRef.current = stream;

            // Create audio context
            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            // Create source from microphone
            const source = audioContext.createMediaStreamSource(stream);

            // Create processor
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            let fullTranscript = '';

            processor.onaudioprocess = (e) => {
                if (!recognizerRef.current) return;

                const inputData = e.inputBuffer.getChannelData(0);
                const int16Array = new Int16Array(inputData.length);

                for (let i = 0; i < inputData.length; i++) {
                    int16Array[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
                }

                const result = recognizerRef.current.acceptWaveform(int16Array);

                if (result) {
                    const res: VoskRecognizerResult = JSON.parse(recognizerRef.current.result());
                    if (res.text) {
                        fullTranscript += res.text + ' ';
                        setTranscript(fullTranscript.trim());
                    }
                } else {
                    const partial: VoskRecognizerResult = JSON.parse(recognizerRef.current.partialResult());
                    if (partial.partial) {
                        setTranscript(fullTranscript + partial.partial);
                    }
                }
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            setIsListening(true);
            setTranscript('');
        } catch (err: any) {
            console.error('Failed to start Vosk recognition:', err);
            setError('ไม่สามารถเริ่มการฟังได้: ' + err.message);
        }
    }, [loadModel]);

    // Stop listening
    const stopListening = useCallback(() => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Get final result
        if (recognizerRef.current) {
            const final: VoskRecognizerResult = JSON.parse(recognizerRef.current.finalResult());
            if (final.text) {
                setTranscript(prev => (prev + ' ' + final.text).trim());
            }
        }

        setIsListening(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopListening();
            if (modelRef.current) {
                modelRef.current.terminate();
            }
        };
    }, [stopListening]);

    return {
        isElectron: getIsElectron(),
        isSupported,
        isLoading,
        isListening,
        transcript,
        error,
        startListening,
        stopListening,
        loadModel
    };
}

export default useVoskRecognition;
