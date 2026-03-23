// ============================================
// TTS ENGINE — TEXT-TO-SPEECH (WHISPERED ADVICE)
// Uses Web Speech Synthesis API to whisper counter-arguments
// through earphones during negotiation.
// ============================================

interface TTSOptions {
  volume?: number;
  rate?: number;
  language?: string;
  urgent?: boolean;
}

let speechQueue: string[] = [];
let isSpeakingNow = false;
let currentVolume = 0.4;

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Speak advice text through earphones (whispered volume)
 */
export function speakAdvice(text: string, options?: TTSOptions): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  // Truncate to 200 chars for live negotiation speed
  const truncated = text.length > 200 ? text.substring(0, 197) + "..." : text;

  // If already speaking, queue the new text
  if (isSpeakingNow) {
    speechQueue.push(truncated);
    return;
  }

  speakNow(truncated, options);
}

/**
 * Internal: speak immediately
 */
function speakNow(text: string, options?: TTSOptions): void {
  if (typeof window === "undefined") return;

  const synth = window.speechSynthesis;

  // Cancel any ongoing speech
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Set volume — low for earphone whisper
  utterance.volume = options?.volume ?? currentVolume;

  // Set rate — slightly fast for urgency
  utterance.rate = options?.urgent ? 1.3 : (options?.rate ?? 1.1);

  // Set pitch
  utterance.pitch = 1.0;

  // Set language
  utterance.lang = options?.language ?? "en-IN";

  // Try to find an Indian English voice
  const voices = synth.getVoices();
  const preferredVoice = voices.find(
    (v) =>
      v.lang === "en-IN" ||
      v.lang.startsWith("en") && v.name.toLowerCase().includes("india")
  ) || voices.find(
    (v) => v.lang.startsWith("en")
  );

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  // Event handlers
  utterance.onstart = () => {
    isSpeakingNow = true;
  };

  utterance.onend = () => {
    isSpeakingNow = false;

    // Process queue
    if (speechQueue.length > 0) {
      const next = speechQueue.shift()!;
      setTimeout(() => speakNow(next, options), 300); // Small pause between items
    }
  };

  utterance.onerror = () => {
    isSpeakingNow = false;

    // Try next in queue
    if (speechQueue.length > 0) {
      const next = speechQueue.shift()!;
      speakNow(next, options);
    }
  };

  synth.speak(utterance);
}

/**
 * Stop speaking and clear queue
 */
export function stopSpeaking(): void {
  if (typeof window === "undefined") return;

  speechQueue = [];
  isSpeakingNow = false;

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Check if TTS is currently speaking
 */
export function isSpeaking(): boolean {
  if (typeof window === "undefined") return false;
  return window.speechSynthesis?.speaking || isSpeakingNow;
}

/**
 * Set whisper volume (0.0 to 1.0)
 */
export function setVolume(volume: number): void {
  currentVolume = Math.max(0, Math.min(1, volume));
}

/**
 * Get current volume
 */
export function getVolume(): number {
  return currentVolume;
}

/**
 * Get available voices, highlighting Indian English voices
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined") return [];
  if (!("speechSynthesis" in window)) return [];

  return window.speechSynthesis.getVoices();
}

/**
 * Check if TTS is supported
 */
export function isTTSSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window;
}
