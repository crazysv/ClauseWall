"use client";

import { motion } from "framer-motion";
import {
  Clock,
  MessageSquare,
  Mail,
  Mic,
  Camera,
  PenTool,
  FileText,
} from "lucide-react";
import type { ExtractedPromise } from "@/types";

interface PromiseTimelineProps {
  promises: ExtractedPromise[];
}

const SOURCE_ICONS: Record<string, typeof MessageSquare> = {
  whatsapp_chat: MessageSquare,
  email: Mail,
  audio_recording: Mic,
  sms_screenshot: Camera,
  handwritten_note: PenTool,
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "border-emerald-900/50 bg-emerald-950/10",
  medium: "border-amber-900/50 bg-amber-950/10",
  low: "border-neutral-800 bg-[#050505]",
};

export default function PromiseTimeline({ promises }: PromiseTimelineProps) {
  if (promises.length === 0) return null;

  // Sort by date (dated items first, then undated)
  const sorted = [...promises].sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });

  return (
    <div className="space-y-5">
      <h3 className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-2 border-b border-neutral-800 pb-2">
        <div className="p-1 border border-neutral-800 bg-[#050505]">
          <Clock className="w-3 h-3 text-neutral-500" />
        </div>
        PROMISE TIMELINE ({promises.length} PROMISES)
      </h3>

      <div className="relative pl-8">
        {/* Timeline line */}
        <div className="absolute left-3 top-0 bottom-0 w-px bg-neutral-800 hidden sm:block" />

        <div className="space-y-4">
          {sorted.map((promise, i) => {
            const Icon =
              SOURCE_ICONS[promise.evidence_source_id?.split("_")[0] || ""] ||
              FileText;
            const confidenceClass =
              CONFIDENCE_COLORS[promise.confidence] || CONFIDENCE_COLORS.medium;

            return (
              <motion.div
                key={promise.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative"
              >
                {/* Timeline dot */}
                <div className="absolute -left-7 top-4 w-2.5 h-2.5 border border-amber-500 bg-amber-500 hidden sm:block" />

                <div
                  className={`p-4 border ${confidenceClass}`}
                >
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    {promise.date && (
                      <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-400 border border-neutral-800 bg-[#050505] px-1.5 py-0.5">
                        {promise.date}
                      </span>
                    )}
                    <span className="text-[7px] font-mono uppercase tracking-widest text-amber-400 px-1.5 py-0.5 border border-amber-900/50 bg-amber-950/20">
                      {promise.category.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`text-[7px] font-mono uppercase tracking-widest px-1.5 py-0.5 border border-neutral-800 bg-[#050505] ${
                        promise.confidence === "high"
                          ? "text-emerald-400"
                          : promise.confidence === "medium"
                            ? "text-amber-400"
                            : "text-neutral-500"
                      }`}
                    >
                      {promise.confidence}
                    </span>
                  </div>

                  <p className="text-[10px] font-mono text-neutral-300 border-l border-neutral-700 pl-3 mb-2 leading-relaxed">
                    &ldquo;{promise.promise_text}&rdquo;
                  </p>

                  <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-600">
                    — {promise.promised_by}
                    {promise.specific_value && ` • ${promise.specific_value}`}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
