// ============================================
// WEB SPEECH API STT — BROWSER FALLBACK
// Client-side only, runs in browser
// ============================================

'use client';

import { getLanguageConfig } from '@/lib/voice-aid/languages';
import type { SupportedLanguage, STTResult } from '@/types';

interface WebSpeechController {
  start: () => void;
  stop: () => void;
  isSupported: boolean;
}

/**
 * Create a Web Speech API recognizer for client-side STT.
 * Fallback when Groq Whisper is unavailable (browser-only).
 */
export function createWebSpeechRecognizer(
  language: SupportedLanguage,
  onResult: (result: STTResult) => void,
  onError: (error: string) => void,
  onListening: (isListening: boolean) => void
): WebSpeechController {
  if (typeof window === 'undefined') {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  const config = getLanguageConfig(language);
  let recognition: any = null;
  let startTime = 0;

  const start = () => {
    try {
      recognition = new SpeechRecognition();
      recognition.lang = config.webSpeechCode;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      startTime = Date.now();

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          onResult({
            text: finalTranscript.trim(),
            language,
            confidence: event.results[0]?.[0]?.confidence || 0.7,
            provider: 'web_speech',
            duration_ms: Date.now() - startTime,
          });
        } else if (interimTranscript) {
          // Send interim results with low confidence marker
          onResult({
            text: interimTranscript,
            language,
            confidence: 0.3, // Mark as interim
            provider: 'web_speech',
            duration_ms: Date.now() - startTime,
          });
        }
      };

      recognition.onerror = (event: any) => {
        onListening(false);
        const errorMessages: Record<string, string> = {
          'not-allowed': 'Microphone access denied',
          'no-speech': 'No speech detected',
          'audio-capture': 'No microphone found',
          'network': 'Speech server unreachable',
        };
        onError(errorMessages[event.error] || `Speech error: ${event.error}`);
      };

      recognition.onend = () => {
        onListening(false);
      };

      recognition.start();
      onListening(true);
    } catch (err) {
      onError('Failed to start speech recognition');
      onListening(false);
    }
  };

  const stop = () => {
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // Already stopped
      }
      onListening(false);
    }
  };

  return { start, stop, isSupported: true };
}

/** Check if Web Speech API is supported */
export function isWebSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}
