// types/speech.d.ts

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;

  onaudioend?: (ev: Event) => any;
  onaudiostart?: (ev: Event) => any;
  onend?: (ev: Event) => any;
  onerror?: (ev: any) => any;
  onnomatch?: (ev: any) => any;
  onresult?: (ev: SpeechRecognitionEvent) => any;
  onsoundend?: (ev: Event) => any;
  onsoundstart?: (ev: Event) => any;
  onspeechend?: (ev: Event) => any;
  onspeechstart?: (ev: Event) => any;
  onstart?: (ev: Event) => any;
}

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};
