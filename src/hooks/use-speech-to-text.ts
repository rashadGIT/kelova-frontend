'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type AnswerKey = 'favoriteMemory' | 'description' | 'loved' | 'anythingElse';

interface UseSpeechToTextOptions {
  onTranscript: (key: AnswerKey, text: string) => void;
}

interface UseSpeechToTextReturn {
  isSupported: boolean;
  activeKey: AnswerKey | null;
  toggle: (key: AnswerKey) => void;
}

export function useSpeechToText({ onTranscript }: UseSpeechToTextOptions): UseSpeechToTextReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [activeKey, setActiveKeyState] = useState<AnswerKey | null>(null);

  const activeKeyRef = useRef<AnswerKey | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const stoppingRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  });

  const setActive = useCallback((val: AnswerKey | null) => {
    activeKeyRef.current = val;
    setActiveKeyState(val);
  }, []);

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setIsSupported(!!SR);
  }, []);

  const startRecognition = useCallback((key: AnswerKey) => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = navigator.language;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.trim();
      if (transcript && activeKeyRef.current) {
        onTranscriptRef.current(activeKeyRef.current, transcript);
      }
    };

    recognition.onend = () => {
      if (activeKeyRef.current !== null && !stoppingRef.current) {
        recognition.start();
      } else {
        stoppingRef.current = false;
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed' || event.error === 'aborted') {
        setActive(null);
      }
    };

    recognitionRef.current = recognition;
    setActive(key);
    recognition.start();
  }, [setActive]);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      stoppingRef.current = true;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setActive(null);
  }, [setActive]);

  const toggle = useCallback((key: AnswerKey) => {
    if (activeKeyRef.current === key) {
      stopRecognition();
    } else {
      if (recognitionRef.current) {
        stoppingRef.current = true;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setActive(null);
      setTimeout(() => startRecognition(key), 50);
    }
  }, [startRecognition, stopRecognition, setActive]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        stoppingRef.current = true;
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  return { isSupported, activeKey, toggle };
}
