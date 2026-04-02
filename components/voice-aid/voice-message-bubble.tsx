"use client";

import { motion } from "framer-motion";
import type { VoiceMessage } from "@/types";

interface Props {
  message: VoiceMessage;
  onPlayAudio?: (audioUrl: string) => void;
}

export function VoiceMessageBubble({ message, onPlayAudio }: Props) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      <div
        className={`relative max-w-[85%] rounded-2xl px-4 py-3 ${ isUser ? "bg-indigo-600/80 text-slate-900 dark:text-slate-100 rounded-br-md" : "bg-indigo-50 border border-indigo-100 text-slate-900 dark:text-slate-100 rounded-bl-md border border-white/5" }`}
      >
        {/* Role indicator */}
        <div className={`text-[10px] font-semibold mb-1 ${isUser ? "text-indigo-200" : "text-emerald-400"}`}>
          {isUser ? "🗣️ You" : "⚖️ ClauseWall"}
        </div>

        {/* Message text */}
        <p className="text-sm leading-relaxed">{message.text}</p>

        {/* Audio play button */}
        {message.audio_url && !isUser && (
          <button
            onClick={() => onPlayAudio?.(message.audio_url!)}
            className="mt-2 flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            aria-label="Play audio response"
          >
            <span className="text-base">🔊</span>
            <span>Play again</span>
          </button>
        )}

        {/* Photo indicator */}
        {message.metadata?.had_photo && isUser && (
          <div className="mt-1 text-xs text-indigo-200/60">📸 Photo attached</div>
        )}

        {/* Time */}
        <div className={`text-[10px] mt-1 ${isUser ? "text-indigo-200/50" : "text-slate-900 dark:text-slate-100"}`}>
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </motion.div>
  );
}
