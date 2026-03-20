"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  startListening,
  stopListening,
  isSupported as isRecognitionSupported,
} from "./speech-recognition";
import {
  speak as ttsSpeak,
  stopSpeaking,
  isTTSSupported,
  isSpeaking as checkSpeaking,
} from "./speech-synthesis";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, detectLanguage } from "./languages";
import type { VoiceLanguage } from "./languages";

interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  interimTranscript: string;
  language: VoiceLanguage;
  isSupported: boolean;
  error: string | null;
}

interface VoiceActions {
  startVoice: () => void;
  stopVoice: () => void;
  speak: (text: string, lang?: string) => void;
  stopSpeak: () => void;
  setLanguage: (lang: VoiceLanguage) => void;
  clearTranscript: () => void;
  clearError: () => void;
}

const VoiceContext = createContext<(VoiceState & VoiceActions) | null>(null);

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingState, setIsSpeakingState] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [language, setLanguageState] = useState<VoiceLanguage>(DEFAULT_LANGUAGE);
  const [error, setError] = useState<string | null>(null);

  const supported =
    typeof window !== "undefined" && isRecognitionSupported() && isTTSSupported();

  const onResultRef = useRef<((text: string, isFinal: boolean) => void) | null>(null);

  const startVoice = useCallback(() => {
    setError(null);
    setInterimTranscript("");

    const started = startListening(
      language.speechCode,
      (text, isFinal) => {
        if (isFinal) {
          setTranscript(text);
          setInterimTranscript("");
          setIsListening(false);
        } else {
          setInterimTranscript(text);
        }
      },
      (err) => {
        setError(err);
        setIsListening(false);
      }
    );

    if (started) {
      setIsListening(true);
    }
  }, [language]);

  const stopVoice = useCallback(() => {
    stopListening();
    setIsListening(false);
  }, []);

  const speak = useCallback(
    (text: string, lang?: string) => {
      setIsSpeakingState(true);
      ttsSpeak(text, lang || language.speechCode, 1.0, () => {
        setIsSpeakingState(false);
      });
    },
    [language]
  );

  const stopSpeak = useCallback(() => {
    stopSpeaking();
    setIsSpeakingState(false);
  }, []);

  const setLanguage = useCallback((lang: VoiceLanguage) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("clausewall_voice_lang", lang.code);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <VoiceContext.Provider
      value={{
        isListening,
        isSpeaking: isSpeakingState,
        transcript,
        interimTranscript,
        language,
        isSupported: supported,
        error,
        startVoice,
        stopVoice,
        speak,
        stopSpeak,
        setLanguage,
        clearTranscript,
        clearError,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoice must be used within VoiceProvider");
  return ctx;
}