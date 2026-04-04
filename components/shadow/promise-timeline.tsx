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
  high: "border-green-600 bg-green-100 text-green-900 border-4",
  medium: "border-yellow-500 bg-yellow-100 text-yellow-900 border-4",
  low: "border-gray-500 bg-gray-100 text-gray-900 border-4",
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
    <div className="space-y-6">
      <h3 className="text-lg font-black uppercase tracking-widest text-black flex items-center gap-2 border-b-4 border-black pb-2">
        <div className="bg-black text-white p-1">
          <Clock className="w-5 h-5" />
        </div>
        Promise Timeline ({promises.length} promises)
      </h3>

      <div className="relative pl-8">
        {/* Timeline line */}
        <div className="absolute left-3 top-0 bottom-0 w-1 bg-black hidden sm:block" />

        <div className="space-y-6">
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
                <div className="absolute -left-7 top-4 w-5 h-5 border-4 border-black bg-yellow-400 hidden sm:block" />

                <div className={`p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${confidenceClass}`}>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {promise.date && (
                      <span className="text-xs font-black uppercase tracking-widest bg-white border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{promise.date}</span>
                    )}
                    <span className="text-xs font-black uppercase tracking-widest bg-black text-white px-2 py-1 border-2 border-black">
                      {promise.category.replace(/_/g, " ")}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 border-2 border-black bg-white ${
                      promise.confidence === "high" ? "text-green-700" :
                      promise.confidence === "medium" ? "text-yellow-700" : "text-gray-700"
                    }`}>
                      {promise.confidence}
                    </span>
                  </div>

                  <p className="text-base font-bold text-black border-l-4 border-black pl-3 mb-2">&ldquo;{promise.promise_text}&rdquo;</p>

                  <p className="text-xs font-bold uppercase tracking-widest text-black/70">
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
