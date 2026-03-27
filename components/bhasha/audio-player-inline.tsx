"use client";

import { useState } from "react";
import type { SupportedLanguage } from "@/types/bhasha";
import { LANGUAGE_CONFIGS } from "@/lib/bhasha/constants";

interface AudioPlayerInlineProps {
  text: string;
  language: SupportedLanguage;
  size?: "sm" | "md";
}

export function AudioPlayerInline({ text, language, size = "sm" }: AudioPlayerInlineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const config = LANGUAGE_CONFIGS[language];

  const handlePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = config.webSpeechCode;
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      setIsPlaying(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <button
      onClick={handlePlay}
      className={`bhasha-inline-audio ${size} ${isPlaying ? "playing" : ""}`}
      title={`Listen in ${config.name}`}
      type="button"
    >
      {isPlaying ? "⏹" : "🔊"}
      <style jsx>{`
        .bhasha-inline-audio {
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 2px;
          font-size: 0.75rem;
          opacity: 0.5;
          transition: all 0.2s;
          border-radius: 4px;
          line-height: 1;
        }
        .bhasha-inline-audio:hover {
          opacity: 1;
          background: rgba(99, 102, 241, 0.15);
        }
        .bhasha-inline-audio.playing {
          opacity: 1;
          animation: bhasha-pulse 1s infinite;
        }
        .bhasha-inline-audio.md {
          font-size: 1rem;
          padding: 4px;
        }
        @keyframes bhasha-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </button>
  );
}
