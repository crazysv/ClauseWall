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

export default function TacticAlert({
  tactic,
  bluffCheck,
  onDismiss,
  onSpeak,
}: TacticAlertProps) {
  const [expanded, setExpanded] = useState(true);

  const tacticData = getTacticByType(tactic.tactic_type);

  const isBluff = tactic.tactic_type === "false_legal_claim" && bluffCheck;
  const borderColor = isBluff ? "border-red-600" : "border-yellow-600";
  const bgColor = isBluff ? "bg-red-100" : "bg-yellow-50";

  return (
    <div
      className={`border-2 ${borderColor} ${bgColor} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in slide-in- fade-in duration-300`}
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
            <p
              className={`text-sm font-black uppercase tracking-widest ${isBluff ? "text-red-700" : "text-yellow-900 dark:text-yellow-100 font-bold"}`}
            >
              {isBluff
                ? "⚡ BLUFF DETECTED"
                : `⚠️ ${tacticData?.name || "Tactic Detected"}`}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-foreground mt-0.5">
              {tactic.confidence} confidence
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 border-2 border-transparent hover:border-black hover:bg-white text-black transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Matched phrase */}
      {expanded && (
        <div className="px-4 pb-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-foreground mb-1">
            Detected:
          </p>
          <p className="text-sm font-bold text-black italic leading-relaxed">
            &ldquo;{tactic.matched_phrase}&rdquo;
          </p>
        </div>
      )}

      {/* Bluff details */}
      {expanded && isBluff && bluffCheck && (
        <div className="mx-4 mb-4 p-4 border-2 border-red-900 bg-white shadow-[2px_2px_0px_0px_rgba(127,29,29,1)] space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-red-900">
            Legal Reality:
          </p>
          <p className="text-sm font-bold text-red-950 leading-relaxed">
            {bluffCheck.actual_legal_position}
          </p>
          {bluffCheck.legal_limit && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-black bg-blue-100 border-2 border-blue-900 px-2 py-1">
                📏 Legal Limit: {bluffCheck.legal_limit}
              </span>
              {bluffCheck.their_claim_value && (
                <span className="text-[10px] font-black uppercase tracking-wider text-black bg-red-100 border-2 border-red-900 px-2 py-1">
                  They want: {bluffCheck.their_claim_value}
                </span>
              )}
            </div>
          )}
          {bluffCheck.statute_name && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-900/60 pt-2 border-t-2 border-red-900/10">
              📖 {bluffCheck.statute_name}{" "}
              {bluffCheck.statute_code ? `(${bluffCheck.statute_code})` : ""}
            </p>
          )}
        </div>
      )}

      {/* Counter response */}
      {expanded && (
        <div className="mx-4 mb-5 p-4 border-2 border-green-900 bg-green-100 border-dashed">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-black uppercase tracking-wider text-green-900">
              💬 Say This:
            </p>
            <button
              onClick={() =>
                onSpeak(
                  isBluff && bluffCheck?.what_to_say
                    ? bluffCheck.what_to_say
                    : tactic.counter_response,
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-green-900 bg-white text-[10px] font-bold uppercase tracking-wider text-green-900 hover:bg-green-200 transition-colors shadow-[2px_2px_0px_0px_rgba(20,83,45,1)] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(20,83,45,1)]"
            >
              <Volume2 className="w-3 h-3" />
              Whisper
            </button>
          </div>
          <p className="text-base font-bold text-green-950 leading-relaxed">
            &ldquo;
            {isBluff && bluffCheck?.what_to_say
              ? bluffCheck.what_to_say
              : tactic.counter_response}
            &rdquo;
          </p>
        </div>
      )}

      {/* Expand/Collapse toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-foreground hover:text-black hover:bg-muted border-t-2 border-black/10 transition-colors"
      >
        {expanded ? "▲ COLLAPSE" : "▼ SHOW DETAILS"}
      </button>
    </div>
  );
}
