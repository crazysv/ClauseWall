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
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <CalendarDays className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white">
            Add {deadlineCount} deadline{deadlineCount !== 1 ? "s" : ""} to
            your calendar
          </h4>
          <p className="text-xs text-white/40 mt-1">
            Works with Google Calendar, Apple Calendar, and Outlook.
          </p>
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={loading}
        className="w-full mt-4 px-4 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        aria-label="Download calendar file"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : downloaded ? (
          <>
            <CheckCircle className="w-4 h-4" />
            Downloaded!
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Download .ics File
          </>
        )}
      </button>

      <p className="text-[10px] text-white/20 mt-3 text-center">
        Reminders auto-set at 30, 14, 7, 3, and 1 day before each deadline
      </p>
    </div>
  );
}
