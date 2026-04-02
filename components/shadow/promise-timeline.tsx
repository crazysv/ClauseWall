"use client";

import { motion } from "framer-motion";
import { Clock, MessageSquare, Mail, Mic, Camera, PenTool, FileText } from "lucide-react";
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
  high: "border-emerald-200 bg-emerald-50 shadow-sm text-slate-900",
  medium: "border-amber-200 bg-amber-50 shadow-sm text-slate-900",
  low: "border-slate-200 bg-slate-50 shadow-sm text-slate-900",
};

export function PromiseTimeline({ promises }: PromiseTimelineProps) {
  if (promises.length === 0) return null;

  // Sort by date (dated items first, then undated)
  const sorted = [...promises].sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });

  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 inline-flex px-3 py-1.5 rounded-lg shadow-sm dark:shadow-slate-900/20">
        <Clock className="w-3.5 h-3.5" />
        Promise Timeline ({promises.length} promises)
      </h3>

      <div className="relative pl-7 mt-2">
        {/* Timeline line */}
        <div className="absolute left-2.5 top-0 bottom-0 w-px bg-slate-200" />

        <div className="space-y-3">
          {sorted.map((promise, i) => {
            const Icon = SOURCE_ICONS[promise.evidence_source_id?.split("_")[0] || ""] || FileText;
            const confidenceClass = CONFIDENCE_COLORS[promise.confidence] || CONFIDENCE_COLORS.medium;

            return (
              <motion.div
                key={promise.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative"
              >
                {/* Timeline dot */}
                <div className="absolute -left-7 top-4 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white shadow-sm dark:shadow-slate-900/20 ring-1 ring-amber-200" />

                <div className={`p-4 rounded-xl border ${confidenceClass}`}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {promise.date && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{promise.date}</span>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 border border-amber-200 bg-white dark:bg-card px-2 py-0.5 rounded-md shadow-sm dark:shadow-slate-900/20">
                      {promise.category.replace(/_/g, " ")}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-widest border shadow-sm dark:shadow-slate-900/20 ${ promise.confidence === "high" ? "text-emerald-700 bg-emerald-100 border-emerald-200" : promise.confidence === "medium" ? "text-amber-700 bg-amber-100 border-amber-200" : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" }`}>
                      {promise.confidence}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">&ldquo;{promise.promise_text}&rdquo;</p>

                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-3 block">
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
