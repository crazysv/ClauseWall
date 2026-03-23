"use client";

import { useState } from "react";
import { X, Volume2, AlertTriangle, XCircle } from "lucide-react";
import { getTacticByType } from "@/lib/negotiate/pressure-tactics";
import type { DetectedTactic, BluffAnalysis } from "@/types";

interface TacticAlertProps {
  tactic: DetectedTactic;
  bluffCheck: BluffAnalysis | null;
  onDismiss: () => void;
  onSpeak: (text: string) => void;
}

export default function TacticAlert({ tactic, bluffCheck, onDismiss, onSpeak }: TacticAlertProps) {
  const [expanded, setExpanded] = useState(true);

  const tacticData = getTacticByType(tactic.tactic_type);

  const isBluff = tactic.tactic_type === "false_legal_claim" && bluffCheck;
  const borderColor = isBluff ? "border-red-500/30" : "border-orange-500/20";
  const bgColor = isBluff ? "bg-red-500/5" : "bg-orange-500/5";

  return (
    <div
      className={`rounded-2xl border ${borderColor} ${bgColor} overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {isBluff ? (
            <XCircle className="w-5 h-5 text-red-400 animate-pulse" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-orange-400 animate-pulse" />
          )}
          <div>
            <p className={`text-sm font-bold ${isBluff ? "text-red-400" : "text-orange-400"}`}>
              {isBluff ? "⚡ BLUFF DETECTED" : `⚠️ ${tacticData?.name || "Tactic Detected"}`}
            </p>
            <p className="text-[10px] text-white/30">
              {tactic.confidence} confidence
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Matched phrase */}
      {expanded && (
        <div className="px-4 pb-2">
          <p className="text-xs text-white/30">Detected:</p>
          <p className="text-sm text-white/60 italic">&ldquo;{tactic.matched_phrase}&rdquo;</p>
        </div>
      )}

      {/* Bluff details */}
      {expanded && isBluff && bluffCheck && (
        <div className="mx-4 mb-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10 space-y-2">
          <p className="text-xs text-red-400/70 font-medium">Legal Reality:</p>
          <p className="text-sm text-white/80">{bluffCheck.actual_legal_position}</p>
          {bluffCheck.legal_limit && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-400/80 bg-green-500/10 px-2 py-0.5 rounded">
                📏 Legal Limit: {bluffCheck.legal_limit}
              </span>
              {bluffCheck.their_claim_value && (
                <span className="text-xs text-red-400/80 bg-red-500/10 px-2 py-0.5 rounded">
                  They want: {bluffCheck.their_claim_value}
                </span>
              )}
            </div>
          )}
          {bluffCheck.statute_name && (
            <p className="text-[10px] text-white/20">
              📖 {bluffCheck.statute_name} {bluffCheck.statute_code ? `(${bluffCheck.statute_code})` : ""}
            </p>
          )}
        </div>
      )}

      {/* Counter response */}
      {expanded && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-emerald-400/70 font-medium">💬 Say This:</p>
            <button
              onClick={() => onSpeak(isBluff && bluffCheck?.what_to_say ? bluffCheck.what_to_say : tactic.counter_response)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              <Volume2 className="w-3 h-3" />
              Whisper
            </button>
          </div>
          <p className="text-sm text-emerald-300 leading-relaxed">
            &ldquo;{isBluff && bluffCheck?.what_to_say ? bluffCheck.what_to_say : tactic.counter_response}&rdquo;
          </p>
        </div>
      )}

      {/* Expand/Collapse toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-2 text-[10px] text-white/20 hover:text-white/40 border-t border-white/5 transition-colors"
      >
        {expanded ? "▲ Collapse" : "▼ Show details"}
      </button>
    </div>
  );
}
