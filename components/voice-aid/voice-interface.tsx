"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { LanguageSelector } from "./language-selector";
import { MicrophoneButton } from "./microphone-button";
import { VoiceMessageBubble } from "./voice-message-bubble";
import { AudioWaveform } from "./audio-waveform";
import { CameraCaptureButton } from "./camera-capture-button";
import { isWebSpeechSupported, createWebSpeechRecognizer } from "@/lib/voice-aid/stt/web-speech";
import { speakWithWebSpeech } from "@/lib/voice-aid/tts/web-speech-tts";
import { getLanguageConfig } from "@/lib/voice-aid/languages";
import type { SupportedLanguage, VoiceMessage, VoicePageState } from "@/types";

export function VoiceInterface() {
  const [state, setState] = useState<VoicePageState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    currentLanguage: "hi",
    session: null,
    messages: [],
    error: null,
    micPermission: "prompt",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const webSpeechRef = useRef<ReturnType<typeof createWebSpeechRecognizer> | null>(null);
  const ttsCancelRef = useRef<(() => void) | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages.length]);

  // Show greeting on mount
  useEffect(() => {
    const config = getLanguageConfig(state.currentLanguage);
    const greeting: VoiceMessage = {
      id: "greeting",
      session_id: "",
      role: "assistant",
      text: config.greeting,
      language: state.currentLanguage,
      audio_url: null,
      metadata: null,
      created_at: new Date().toISOString(),
    };
    setState((s) => ({ ...s, messages: [greeting] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPartialState = useCallback((partial: Partial<VoicePageState>) => {
    setState((s) => ({ ...s, ...partial }));
  }, []);

  // Start recording audio
  const startListening = useCallback(async () => {
    try {
      // Try MediaRecorder for server-side Whisper
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPartialState({ micPermission: "granted", error: null });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        if (audioBlob.size < 1000) {
          setPartialState({ isListening: false, error: "No speech detected" });
          return;
        }

        await processAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);
      setPartialState({ isListening: true });
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setPartialState({ micPermission: "denied", error: "Microphone access denied" });
      } else {
        // Fallback to Web Speech API
        if (isWebSpeechSupported()) {
          startWebSpeechListening();
        } else {
          setPartialState({ micPermission: "unsupported", error: "Microphone not available" });
        }
      }
    }
  }, [state.currentLanguage]);

  // Fallback: Web Speech API
  const startWebSpeechListening = useCallback(() => {
    const recognizer = createWebSpeechRecognizer(
      state.currentLanguage,
      async (result) => {
        if (result.confidence > 0.5 && result.text.trim()) {
          setPartialState({ isListening: false });
          await processText(result.text);
        }
      },
      (error) => setPartialState({ error, isListening: false }),
      (listening) => setPartialState({ isListening: listening })
    );

    if (recognizer.isSupported) {
      webSpeechRef.current = recognizer;
      recognizer.start();
    } else {
      setPartialState({ error: "Speech recognition not supported" });
    }
  }, [state.currentLanguage]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (webSpeechRef.current) {
      webSpeechRef.current.stop();
    }
    setPartialState({ isListening: false });
  }, []);

  // Process recorded audio via API
  const processAudio = useCallback(async (audioBlob: Blob) => {
    setPartialState({ isProcessing: true, error: null });

    // Add user message placeholder
    const userMsg: VoiceMessage = {
      id: `user_${Date.now()}`,
      session_id: state.session?.id || "",
      role: "user",
      text: "🎤 ...",
      language: state.currentLanguage,
      audio_url: null,
      metadata: null,
      created_at: new Date().toISOString(),
    };
    setState((s) => ({ ...s, messages: [...s.messages, userMsg] }));

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", state.currentLanguage);
      formData.append("audio_format", "webm");
      if (state.session?.id) formData.append("session_id", state.session.id);

      const res = await fetch("/api/voice-aid/process", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.error || "Processing failed");

      handleResponse(data, userMsg.id);
    } catch (error) {
      setPartialState({
        isProcessing: false,
        error: "Processing failed. Try again.",
      });
      // Remove placeholder
      setState((s) => ({
        ...s,
        messages: s.messages.filter((m) => m.id !== userMsg.id),
      }));
    }
  }, [state.session, state.currentLanguage]);

  // Process text input
  const processText = useCallback(async (text: string) => {
    setPartialState({ isProcessing: true, error: null });

    const userMsg: VoiceMessage = {
      id: `user_${Date.now()}`,
      session_id: state.session?.id || "",
      role: "user",
      text,
      language: state.currentLanguage,
      audio_url: null,
      metadata: null,
      created_at: new Date().toISOString(),
    };
    setState((s) => ({ ...s, messages: [...s.messages, userMsg] }));

    try {
      const res = await fetch("/api/voice-aid/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          language: state.currentLanguage,
          session_id: state.session?.id,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      handleResponse(data, userMsg.id);
    } catch (error) {
      setPartialState({ isProcessing: false, error: "Processing failed." });
    }
  }, [state.session, state.currentLanguage]);

  // Handle API response
  const handleResponse = useCallback((data: any, userMsgId: string) => {
    // Update user message with transcribed text
    setState((s) => ({
      ...s,
      messages: s.messages.map((m) =>
        m.id === userMsgId
          ? { ...m, text: data.text ? `You: ${data.text.substring(0, 20)}...` : m.text }
          : m
      ),
    }));

    // Add assistant message
    const assistantMsg: VoiceMessage = {
      id: `assistant_${Date.now()}`,
      session_id: data.session_id || "",
      role: "assistant",
      text: data.text,
      language: data.language || state.currentLanguage,
      audio_url: null,
      metadata: null,
      created_at: new Date().toISOString(),
    };

    setState((s) => ({
      ...s,
      messages: [...s.messages, assistantMsg],
      session: s.session ? { ...s.session, id: data.session_id } : {
        id: data.session_id,
        user_id: null,
        telegram_chat_id: null,
        language: s.currentLanguage,
        status: "active" as const,
        document_id: data.document_id,
        context_summary: null,
        messages: [],
        created_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
      isProcessing: false,
    }));

    // Play audio response
    if (data.audio_base64) {
      playAudioBase64(data.audio_base64);
    } else {
      // Fallback: Web Speech TTS
      const controller = speakWithWebSpeech(
        data.text,
        data.language || state.currentLanguage,
        () => setPartialState({ isSpeaking: true }),
        () => setPartialState({ isSpeaking: false }),
        () => setPartialState({ isSpeaking: false })
      );
      ttsCancelRef.current = controller.cancel;
    }
  }, [state.currentLanguage]);

  // Play base64 audio
  const playAudioBase64 = useCallback((base64: string) => {
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      setPartialState({ isSpeaking: true });
      audio.onended = () => {
        setPartialState({ isSpeaking: false });
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setPartialState({ isSpeaking: false });
      };
      audio.play().catch(() => setPartialState({ isSpeaking: false }));
    } catch {
      setPartialState({ isSpeaking: false });
    }
  }, []);

  // Handle photo capture
  const handlePhotoCapture = useCallback(async (photo: Blob) => {
    setPartialState({ isProcessing: true, error: null });

    const userMsg: VoiceMessage = {
      id: `user_${Date.now()}`,
      session_id: state.session?.id || "",
      role: "user",
      text: "📸 Contract photo sent",
      language: state.currentLanguage,
      audio_url: null,
      metadata: { had_photo: true },
      created_at: new Date().toISOString(),
    };
    setState((s) => ({ ...s, messages: [...s.messages, userMsg] }));

    try {
      const formData = new FormData();
      formData.append("photo", photo, "contract.jpg");
      formData.append("language", state.currentLanguage);
      if (state.session?.id) formData.append("session_id", state.session.id);

      const res = await fetch("/api/voice-aid/process", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      handleResponse(data, userMsg.id);
    } catch (error) {
      setPartialState({ isProcessing: false, error: "Photo processing failed." });
    }
  }, [state.session, state.currentLanguage]);

  // Reset session
  const handleReset = useCallback(() => {
    if (ttsCancelRef.current) ttsCancelRef.current();
    const config = getLanguageConfig(state.currentLanguage);
    setState({
      isListening: false,
      isProcessing: false,
      isSpeaking: false,
      currentLanguage: state.currentLanguage,
      session: null,
      messages: [
        {
          id: "greeting",
          session_id: "",
          role: "assistant",
          text: config.greeting,
          language: state.currentLanguage,
          audio_url: null,
          metadata: null,
          created_at: new Date().toISOString(),
        },
      ],
      error: null,
      micPermission: state.micPermission,
    });
  }, [state.currentLanguage, state.micPermission]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <LanguageSelector
          current={state.currentLanguage}
          onChange={(lang) => setPartialState({ currentLanguage: lang })}
        />
        <button
          onClick={handleReset}
          className="p-2 rounded-xl text-slate-900 dark:text-slate-100 hover:text-slate-900 dark:text-slate-100 hover:bg-indigo-50 dark:hover:bg-indigo-950/30/50 transition-all"
          aria-label="Reset conversation"
          title="New conversation"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        <AnimatePresence>
          {state.messages.map((msg) => (
            <VoiceMessageBubble
              key={msg.id}
              message={msg}
              onPlayAudio={(url) => {
                const audio = new Audio(url);
                setPartialState({ isSpeaking: true });
                audio.onended = () => setPartialState({ isSpeaking: false });
                audio.play();
              }}
            />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-4 mb-2 px-3 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center"
          >
            {state.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom controls */}
      <div className="border-t border-white/5 px-4 py-6 flex items-center justify-center gap-6">
        <CameraCaptureButton
          onCapture={handlePhotoCapture}
          disabled={state.isProcessing || state.isListening}
        />

        <MicrophoneButton
          isListening={state.isListening}
          isProcessing={state.isProcessing}
          isSpeaking={state.isSpeaking}
          onStartListening={startListening}
          onStopListening={stopListening}
          disabled={state.isProcessing}
        />

        <AudioWaveform
          isActive={state.isListening || state.isSpeaking}
          color={state.isListening ? "#ef4444" : "#3b82f6"}
        />
      </div>
    </div>
  );
}
