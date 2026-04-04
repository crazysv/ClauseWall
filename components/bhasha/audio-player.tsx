"use client";

import { useState, useRef, useEffect } from "react";
import type { SupportedLanguage } from "@/types/bhasha";
import { LANGUAGE_CONFIGS } from "@/lib/bhasha/constants";

interface AudioPlayerProps {
  text: string;
  language: SupportedLanguage;
  title?: string;
}

export function AudioPlayer({ text, language, title }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const config = LANGUAGE_CONFIGS[language];

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlay = async () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setProgress(0);
      return;
    }

    setIsLoading(true);

    // Try server TTS first
    try {
      const response = await fetch("/api/bhasha/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });

      const data = await response.json();

      if (data.audio_base64) {
        const audioData = atob(data.audio_base64);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < audioData.length; i++) {
          view[i] = audioData.charCodeAt(i);
        }

        const audioBlob = new Blob([arrayBuffer], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.playbackRate = speed;

        audio.onended = () => {
          setIsPlaying(false);
          setProgress(100);
          URL.revokeObjectURL(audioUrl);
        };
        audio.ontimeupdate = () => {
          if (audio.duration) {
            setProgress((audio.currentTime / audio.duration) * 100);
          }
        };

        setIsLoading(false);
        setIsPlaying(true);
        await audio.play();
        return;
      }
    } catch {
      console.warn(
        "[ClauseWall] Server TTS failed, using Web Speech API fallback",
      );
    }

    // Fallback: Web Speech API
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = config.webSpeechCode;
      utterance.rate = speed * 0.9;
      utterance.onend = () => {
        setIsPlaying(false);
        setProgress(100);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
      };

      utteranceRef.current = utterance;
      setIsLoading(false);
      setIsPlaying(true);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsLoading(false);
    }
  };

  const speeds = [0.75, 1, 1.25, 1.5];

  return (
    <div className="bhasha-audio-player">
      <div className="bhasha-audio-header">
        <button
          onClick={handlePlay}
          className="bhasha-audio-btn"
          disabled={isLoading}
        >
          {isLoading ? "⏳" : isPlaying ? "⏹" : "▶️"}
        </button>
        <div className="bhasha-audio-info">
          <span className="bhasha-audio-title">
            {title || `Listen in ${config.nativeName}`}
          </span>
          <span className="bhasha-audio-lang">🔊 {config.name}</span>
        </div>
        <div className="bhasha-speed-controls">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`bhasha-speed-btn ${speed === s ? "active" : ""}`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
      {(isPlaying || progress > 0) && (
        <div className="bhasha-audio-progress">
          <div className="bhasha-audio-bar" style={{ width: `${progress}%` }} />
        </div>
      )}

      <style jsx>{`
        .bhasha-audio-player {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 10px 14px;
        }
        .bhasha-audio-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .bhasha-audio-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(99, 102, 241, 0.2);
          cursor: pointer;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .bhasha-audio-btn:hover {
          background: rgba(99, 102, 241, 0.35);
          transform: scale(1.05);
        }
        .bhasha-audio-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .bhasha-audio-title {
          font-size: 0.8rem;
          font-weight: 500;
          color: #e2e8f0;
        }
        .bhasha-audio-lang {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.4);
        }
        .bhasha-speed-controls {
          display: flex;
          gap: 2px;
        }
        .bhasha-speed-btn {
          padding: 2px 6px;
          font-size: 0.6rem;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: rgba(255, 255, 255, 0.3);
          cursor: pointer;
        }
        .bhasha-speed-btn:hover {
          color: rgba(255, 255, 255, 0.6);
        }
        .bhasha-speed-btn.active {
          background: rgba(99, 102, 241, 0.2);
          color: #a5b4fc;
        }
        .bhasha-audio-progress {
          height: 3px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 2px;
          margin-top: 8px;
          overflow: hidden;
        }
        .bhasha-audio-bar {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #a855f7);
          border-radius: 2px;
          transition: width 0.3s linear;
        }
      `}</style>
    </div>
  );
}
