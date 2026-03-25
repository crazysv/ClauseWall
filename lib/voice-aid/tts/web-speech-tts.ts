// ============================================
// WEB SPEECH TTS — BROWSER FALLBACK
// Client-side only, uses native speech synthesis
// ============================================

'use client';

import { getLanguageConfig } from '@/lib/voice-aid/languages';
import type { SupportedLanguage } from '@/types';

interface WebSpeechTTSController {
  cancel: () => void;
  isSupported: boolean;
}

/**
 * Speak text using Web Speech Synthesis API.
 * Client-side fallback when Bhashini is unavailable.
 */
export function speakWithWebSpeech(
  text: string,
  language: SupportedLanguage,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: string) => void
): WebSpeechTTSController {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { cancel: () => {}, isSupported: false };
  }

  const config = getLanguageConfig(language);

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Split into sentences for better handling of long text
  const sentences = text.split(/(?<=[।\\.!?])\s+/).filter(s => s.trim().length > 0);

  if (sentences.length === 0) {
    onEnd?.();
    return { cancel: () => {}, isSupported: true };
  }

  let currentIndex = 0;
  let cancelled = false;

  const speakNext = () => {
    if (cancelled || currentIndex >= sentences.length) {
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sentences[currentIndex]);
    utterance.lang = config.webSpeechCode;
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find a matching voice
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = config.webSpeechCode.split('-')[0];
    const matchingVoice = voices.find(
      v => v.lang === config.webSpeechCode || v.lang.startsWith(langPrefix)
    );
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    if (currentIndex === 0) {
      onStart?.();
    }

    utterance.onend = () => {
      currentIndex++;
      speakNext();
    };

    utterance.onerror = (event) => {
      if (!cancelled) {
        onError?.(`Speech synthesis error: ${event.error}`);
        onEnd?.();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Ensure voices are loaded before speaking
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', () => speakNext(), { once: true });
    // Fallback if voiceschanged never fires
    setTimeout(() => {
      if (currentIndex === 0 && !cancelled) speakNext();
    }, 500);
  } else {
    speakNext();
  }

  const cancel = () => {
    cancelled = true;
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
    }
    onEnd?.();
  };

  return { cancel, isSupported: true };
}

/** Check if Web Speech TTS is supported */
export function isWebSpeechTTSSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
}
