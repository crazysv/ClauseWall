"use client";

import { motion } from "framer-motion";
import {
  Gavel,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import type { ComplaintFiling } from "@/types";

interface ComplaintDashboardWidgetProps {
  filings: ComplaintFiling[];
}

export default function ComplaintDashboardWidget({
  filings,
}: ComplaintDashboardWidgetProps) {
  if (!filings || filings.length === 0) return null;

  const active = filings.filter(
    (f) => !["resolved", "closed"].includes(f.status),
  );
  const resolved = filings.filter((f) =>
    ["resolved", "closed"].includes(f.status),
  );
  const nextHearing = active
    .filter((f) => f.next_hearing_date)
    .sort(
      (a, b) =>
        new Date(a.next_hearing_date!).getTime() -
        new Date(b.next_hearing_date!).getTime(),
    )[0];

  const statusColors: Record<string, string> = {
    draft: "text-neutral-500 border-neutral-800 bg-[#050505]",
    documents_ready: "text-blue-500 border-blue-900/40 bg-blue-950/20",
    filing_guided: "text-blue-500 border-blue-900/40 bg-blue-950/20",
    filed: "text-amber-500 border-amber-900/40 bg-amber-950/20",
    acknowledged: "text-amber-500 border-amber-900/40 bg-amber-950/20",
    hearing_scheduled: "text-orange-500 border-orange-900/40 bg-orange-950/20 animate-pulse",
    hearing_completed: "text-orange-500 border-orange-900/40 bg-orange-950/20",
    order_received: "text-pink-500 border-pink-900/40 bg-pink-950/20",
    resolved: "text-emerald-500 border-emerald-900/40 bg-emerald-950/20",
    appealed: "text-red-500 border-red-900/40 bg-red-950/20",
    closed: "text-neutral-500 border-neutral-800 bg-[#050505]",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="bg-[#0a0a0a] border border-neutral-900 p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-900">
          <h3 className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-3 text-neutral-400">
            <Gavel className="h-4 w-4 text-orange-500" />
            [ LITIGATION_TRACKER ]
          </h3>
          <Link
            href="/complaint"
            className="text-[9px] font-mono uppercase tracking-widest text-orange-500 hover:text-orange-400 flex items-center gap-1.5"
          >
            OPEN_DOCKET <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="flex flex-col p-3 bg-orange-950/10 border border-orange-900/30">
            <p className="text-xl font-mono text-orange-500">
              {active.length}
            </p>
            <p className="text-[8px] font-mono uppercase tracking-widest text-orange-500/70 mt-1">
              ACTIVE_FILINGS
            </p>
          </div>
          <div className="flex flex-col p-3 bg-emerald-950/10 border border-emerald-900/30">
            <p className="text-xl font-mono text-emerald-500">
              {resolved.length}
            </p>
            <p className="text-[8px] font-mono uppercase tracking-widest text-emerald-500/70 mt-1">
              RESOLVED
            </p>
          </div>
          <div className="flex flex-col p-3 bg-cyan-950/10 border border-cyan-900/30">
            <p className="text-xl font-mono text-cyan-500">
              {filings.length}
            </p>
            <p className="text-[8px] font-mono uppercase tracking-widest text-cyan-500/70 mt-1">
              TOTAL_CASES
            </p>
          </div>
        </div>

        {nextHearing && (
          <div className="p-4 bg-amber-950/20 border-l-2 border-amber-500 mb-6 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[9px] font-mono uppercase tracking-widest text-amber-500">
                PENDING_HEARING
              </span>
            </div>
            <p className="text-xs font-mono uppercase text-amber-400">
              {nextHearing.complaint_title}
            </p>
            <p className="text-[10px] font-mono text-amber-600 mt-1">
              T-MINUS: {new Date(nextHearing.next_hearing_date!).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        )}

        <div className="space-y-3 flex-1">
          {active.slice(0, 3).map((filing) => (
            <Link key={filing.id} href={`/complaint/${filing.document_id}`}>
              <div className="flex items-center justify-between p-3 border border-neutral-900 bg-[#050505] hover:bg-neutral-950 transition-colors group">
                <div className="min-w-0 pr-4">
                  <p className="text-xs font-mono uppercase tracking-widest text-neutral-300 truncate group-hover:text-white transition-colors">
                    {filing.complaint_title}
                  </p>
                  <p className="text-[9px] font-mono text-neutral-600 mt-1 uppercase">
                    {filing.case_number || "CASE_ID_PENDING"}
                  </p>
                </div>
                <span
                  className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 border whitespace-nowrap ${statusColors[filing.status] || "text-neutral-500 border-neutral-800"}`}
                >
                  {filing.status.replace(/_/g, " ")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
