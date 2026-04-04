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
    <div className="border-4 border-black bg-blue-100 dark:bg-blue-900/30 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 border-4 border-black bg-white dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <CalendarDays className="w-6 h-6 text-blue-600 dark:text-blue-400 stroke-[3px]" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-black uppercase tracking-widest text-foreground">
            ADD {deadlineCount} DEADLINE{deadlineCount !== 1 ? "S" : ""} TO
            CALENDAR
          </h4>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2 leading-relaxed">
            WORKS WITH GOOGLE CALENDAR, APPLE CALENDAR, AND OUTLOOK.
          </p>
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={loading}
        className="w-full mt-6 px-4 py-3 border-4 border-black bg-blue-500 hover:bg-blue-600 font-black uppercase tracking-widest text-sm text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        aria-label="Download calendar file"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin stroke-[3px]" />
            GENERATING...
          </>
        ) : downloaded ? (
          <>
            <CheckCircle className="w-5 h-5 stroke-[3px]" />
            DOWNLOADED!
          </>
        ) : (
          <>
            <Download className="w-5 h-5 stroke-[3px]" />
            DOWNLOAD .ICS FILE
          </>
        )}
      </button>

      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-4 text-center">
        REMINDERS AUTO-SET AT 30, 14, 7, 3, AND 1 DAY BEFORE EACH DEADLINE
      </p>
    </div>
  );
}
