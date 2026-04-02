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
      toast.error("Failed to download calendar file");
    } finally {
      setLoading(false);
    }
  };

  if (deadlineCount === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card p-6 shadow-sm dark:shadow-slate-900/20">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 shadow-sm dark:shadow-slate-900/20">
          <CalendarDays className="w-6 h-6 text-indigo-600" />
        </div>
        <div className="flex-1 mt-0.5">
          <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Add {deadlineCount} deadline{deadlineCount !== 1 ? "s" : ""} to
            your calendar
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
            Works with Google Calendar, Apple Calendar, and Outlook.
          </p>
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={loading}
        className="w-full mt-5 px-4 py-3 rounded-xl bg-indigo-600 border border-indigo-700 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-indigo-700 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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

      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4 text-center">
        Reminders auto-set at 30, 14, 7, 3, and 1 day before each deadline
      </p>
    </div>
  );
}
