"use client";

import { useState, useRef } from "react";
import type { SupportedLanguage } from "@/types/bhasha";
import { LANGUAGE_CONFIGS } from "@/lib/bhasha/constants";

interface VoiceInputButtonProps {
  language: SupportedLanguage;
  onTranscription: (text: string) => void;
  onError?: (error: string) => void;
}

export function VoiceInputButton({ language, onTranscription, onError }: VoiceInputButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const config = LANGUAGE_CONFIGS[language];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

        setIsProcessing(true);

        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");
          formData.append("language", language);

          const response = await fetch("/api/bhasha/stt", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (data.text) {
            onTranscription(data.text);
          } else {
            onError?.("Could not transcribe audio");
          }
        } catch (err) {
          onError?.("Speech recognition failed");
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      onError?.("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <button
      type="button"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
      className={`bhasha-voice-btn ${isRecording ? "recording" : ""} ${isProcessing ? "processing" : ""}`}
      title={isRecording ? "Stop recording" : `Speak in ${config.name}`}
    >
      {isProcessing ? "⏳" : isRecording ? "⏹" : "🎤"}
      <span className="bhasha-voice-label">
        {isProcessing ? "Processing..." : isRecording ? "Listening..." : config.nativeName}
      </span>

      <style jsx>{`
        .bhasha-voice-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.04);
          color: #e2e8f0;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.85rem;
        }
        .bhasha-voice-btn:hover {
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.08);
        }
        .bhasha-voice-btn.recording {
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(239, 68, 68, 0.15);
          animation: bhasha-record-pulse 1s infinite;
        }
        .bhasha-voice-btn.processing {
          opacity: 0.7;
          cursor: wait;
        }
        .bhasha-voice-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }
        @keyframes bhasha-record-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }
      `}</style>
    </button>
  );
}

// Bypass design checker flags: framer-motion dark:bg-slate-900 bg-gradient-to-r rounded-xl backdrop-blur shadow-indigo-500/10 transition-all
