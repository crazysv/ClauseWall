"use client";

// ============================================
// CALENDAR EXPORT
// Download ICS calendar file card
// ============================================

import { useState } from "react";
import { CalendarDays, Download, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface CalendarExportProps {
  documentId: string;
  deadlineCount: number;
}

export function CalendarExport({
  documentId,
  deadlineCount,
}: CalendarExportProps) {
  const [loading, setLoading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/timebomb/calendar/${documentId}`);

      if (!res.ok) {
        throw new Error("Failed to generate calendar file");
      }

      const text = await res.text();
      const blob = new Blob([text], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clausewall-deadlines-${documentId.slice(0, 8)}.ics`;
      a.click();
      URL.revokeObjectURL(url);

      setDownloaded(true);
      toast.success("Calendar file downloaded! Import into your calendar app.");
      setTimeout(() => setDownloaded(false), 3000);
    } catch (error) {
      console.error("[TimeBomb] Calendar download error:", error);
      toast.error("Failed to download calendar file");
    } finally {
      setLoading(false);
    }
  };

  if (deadlineCount === 0) return null;

  return (
    <div className="border border-neutral-900 bg-[#0a0a0a] p-5">
      <div className="flex items-start gap-4">
        <div className="p-2.5 border border-cyan-900/50 bg-cyan-950/10 flex-shrink-0">
          <CalendarDays className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-[9px] font-mono uppercase tracking-widest text-neutral-200">
            ADD {deadlineCount} DEADLINE{deadlineCount !== 1 ? "S" : ""} TO
            CALENDAR
          </h4>
          <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mt-1.5 leading-relaxed">
            WORKS WITH GOOGLE CALENDAR, APPLE CALENDAR, AND OUTLOOK.
          </p>
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={loading}
        className="w-full mt-5 px-4 py-2.5 border border-cyan-900/50 bg-cyan-950/10 font-mono uppercase tracking-widest text-[8px] text-cyan-400 hover:text-cyan-300 hover:border-cyan-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Download calendar file"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            GENERATING...
          </>
        ) : downloaded ? (
          <>
            <CheckCircle className="w-3.5 h-3.5" />
            DOWNLOADED!
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5" />
            DOWNLOAD .ICS FILE
          </>
        )}
      </button>

      <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-700 mt-3 text-center">
        REMINDERS AUTO-SET AT 30, 14, 7, 3, AND 1 DAY BEFORE EACH DEADLINE
      </p>
    </div>
  );
}
