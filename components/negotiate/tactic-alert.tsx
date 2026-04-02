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

export function TacticAlert({ tactic, bluffCheck, onDismiss, onSpeak }: TacticAlertProps) {
  const [expanded, setExpanded] = useState(true);

  const tacticData = getTacticByType(tactic.tactic_type);

  const isBluff = tactic.tactic_type === "false_legal_claim" && bluffCheck;
  const borderColor = isBluff ? "border-red-200 border-l-4 border-l-red-500" : "border-orange-200 border-l-4 border-l-orange-500";
  const bgColor = isBluff ? "bg-red-50" : "bg-orange-50";

  return (
    <div
      className={`rounded-xl border ${borderColor} ${bgColor} overflow-hidden shadow-sm dark:shadow-slate-900/20 animate-in slide-in-from-top-2 fade-in duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {isBluff ? (
            <XCircle className="w-5 h-5 text-red-600 animate-pulse" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-orange-600 animate-pulse" />
          )}
          <div>
            <p className={`text-sm font-bold uppercase tracking-wider ${isBluff ? "text-red-700" : "text-orange-700"}`}>
              {isBluff ? "⚡ BLUFF DETECTED" : `⚠️ ${tacticData?.name || "Tactic Detected"}`}
            </p>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              {tactic.confidence} confidence
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-400 hover:bg-black/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Matched phrase */}
      {expanded && (
        <div className="px-5 pb-3">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Detected:</p>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 italic">&ldquo;{tactic.matched_phrase}&rdquo;</p>
        </div>
      )}

      {/* Bluff details */}
      {expanded && isBluff && bluffCheck && (
        <div className="mx-4 mb-3 p-4 rounded-xl bg-white dark:bg-card border border-red-100 shadow-sm dark:shadow-slate-900/20 space-y-2">
          <p className="text-xs font-bold text-red-700">Legal Reality:</p>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">{bluffCheck.actual_legal_position}</p>
          {bluffCheck.legal_limit && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-md border border-green-200">
                📏 Limit: {bluffCheck.legal_limit}
              </span>
              {bluffCheck.their_claim_value && (
                <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-md border border-red-200">
                  Asking: {bluffCheck.their_claim_value}
                </span>
              )}
            </div>
          )}
          {bluffCheck.statute_name && (
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2">
              📖 {bluffCheck.statute_name} {bluffCheck.statute_code ? `(${bluffCheck.statute_code})` : ""}
            </p>
          )}
        </div>
      )}

      {/* Counter response */}
      {expanded && (
        <div className="mx-4 mb-4 p-4 rounded-xl bg-teal-50 border border-teal-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-teal-800 uppercase tracking-widest">💬 Say This:</p>
            <button
              onClick={() => onSpeak(isBluff && bluffCheck?.what_to_say ? bluffCheck.what_to_say : tactic.counter_response)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-teal-700 bg-teal-100 hover:bg-teal-200 hover:text-teal-900 transition-colors shadow-sm dark:shadow-slate-900/20"
            >
              <Volume2 className="w-4 h-4" />
              Whisper
            </button>
          </div>
          <p className="text-sm font-medium text-teal-900 leading-relaxed">
            &ldquo;{isBluff && bluffCheck?.what_to_say ? bluffCheck.what_to_say : tactic.counter_response}&rdquo;
          </p>
        </div>
      )}

      {/* Expand/Collapse toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:text-slate-400 border-t border-black/5 hover:bg-black/5 transition-colors"
      >
        {expanded ? "▲ Collapse" : "▼ Show details"}
      </button>
    </div>
  );
}
