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
  high: "border-green-500/30 bg-green-500/5",
  medium: "border-yellow-500/30 bg-yellow-500/5",
  low: "border-gray-500/30 bg-gray-500/5",
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
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-white/60 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Promise Timeline ({promises.length} promises)
      </h3>

      <div className="relative pl-6">
        {/* Timeline line */}
        <div className="absolute left-2 top-0 bottom-0 w-px bg-white/10" />

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
                <div className="absolute -left-6 top-3 w-3 h-3 rounded-full bg-amber-500/30 border border-amber-500/50" />

                <div className={`p-3 rounded-lg border ${confidenceClass}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {promise.date && (
                      <span className="text-[10px] text-white/40">{promise.date}</span>
                    )}
                    <span className="text-[10px] text-amber-400/60 font-medium">
                      {promise.category.replace(/_/g, " ")}
                    </span>
                    <span className={`text-[10px] px-1 rounded ${
                      promise.confidence === "high" ? "text-green-400" :
                      promise.confidence === "medium" ? "text-yellow-400" : "text-gray-400"
                    }`}>
                      {promise.confidence}
                    </span>
                  </div>

                  <p className="text-sm text-white/80">&ldquo;{promise.promise_text}&rdquo;</p>

                  <p className="text-xs text-white/30 mt-1">
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
