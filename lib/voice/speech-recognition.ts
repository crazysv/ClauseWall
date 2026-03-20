export type RecognitionCallback = (transcript: string, isFinal: boolean) => void;
export type ErrorCallback = (error: string) => void;

let recognition: any = null;
let isListening = false;
let hasSpeechBeenDetected = false; // Track if any speech has been detected
let attemptedFallback = false; // Track if a fallback has already been attempted

export function isSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

export function startListening(
  language: string,
  onResult: RecognitionCallback,
  onError?: ErrorCallback
): boolean {
  if (!isSupported()) {
    onError?.("Speech recognition not supported in this browser");
    return false;
  }

  if (isListening && recognition) {
    recognition.stop();
  }

  // Reset hasSpeechBeenDetected for a new listening session (but not when called as fallback)
  if (!attemptedFallback) {
    hasSpeechBeenDetected = false;
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  recognition = new SpeechRecognition();
  recognition.lang = language;
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript || interimTranscript) {
      hasSpeechBeenDetected = true; // Speech has been detected
    }

    if (finalTranscript) {
      onResult(finalTranscript, true);
    } else if (interimTranscript) {
      onResult(interimTranscript, false);
    }
  };

  recognition.onerror = (event: any) => {
    isListening = false;
    const isHindi = language.startsWith("hi");

    // Automatic language fallback for network errors before speech
    if (event.error === "network" && !hasSpeechBeenDetected && isHindi && !attemptedFallback) {
      console.warn("[ClauseWall] Hindi speech server unreachable, retrying with en-IN fallback...");
      attemptedFallback = true;
      startListening("en-IN", onResult, onError);
      return; // Silently retry — no error shown to user
    }

    const errorMap: Record<string, string> = {
      "not-allowed": isHindi
        ? "माइक्रोफोन की अनुमति नहीं है। कृपया अनुमति दें।"
        : "Microphone permission denied. Please allow microphone access.",
      "no-speech": isHindi
        ? "कोई आवाज़ नहीं मिली। कृपया फिर से प्रयास करें।"
        : "No speech detected. Please try again.",
      "audio-capture": isHindi
        ? "कोई माइक्रोफोन नहीं मिला। कृपया कनेक्ट करें।"
        : "No microphone found. Please connect a microphone.",
      "network": isHindi
        ? "नेटवर्क त्रुटि। यदि आपका इंटरनेट स्थिर है, तो आपका ब्राउज़र (जैसे Brave) स्पीच सर्वर को ब्लॉक कर रहा है। कृपया Google Chrome का उपयोग करें।"
        : "Network error. If your internet is stable, this usually means your browser (like Brave or Chromium) blocks access to speech servers. Please try using Google Chrome or Edge.",
    };

    onError?.(errorMap[event.error] || (isHindi ? `स्पीच त्रुटि: ${event.error}` : `Speech error: ${event.error}`));
  };

  recognition.onend = () => {
    isListening = false;
    // After any session ends, reset the fallback state for the next fresh attempt
    attemptedFallback = false;
  };

  try {
    recognition.start();
    isListening = true;
    return true;
  } catch (err) {
    onError?.("Failed to start speech recognition");
    isListening = false;
    attemptedFallback = false; // Reset if start fails immediately
    return false;
  }
}

export function stopListening(): void {
  if (recognition && isListening) {
    recognition.stop();
    isListening = false;
    attemptedFallback = false; // Reset on explicit stop
  }
}

export function getIsListening(): boolean {
  return isListening;
}