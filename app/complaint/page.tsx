"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Gavel,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  FileText,
  Loader2,
  Scale,
} from "lucide-react";
import type { ComplaintFiling } from "@/types";

const statusConfig: Record<
  string,
  { color: string; icon: typeof Clock; label: string }
> = {
  draft: { color: "text-neutral-500", icon: FileText, label: "Draft" },
  documents_ready: {
    color: "text-cyan-400",
    icon: FileText,
    label: "Docs Ready",
  },
  filing_guided: { color: "text-cyan-400", icon: Scale, label: "Guided" },
  filed: { color: "text-amber-400", icon: CheckCircle2, label: "Filed" },
  acknowledged: {
    color: "text-amber-400",
    icon: CheckCircle2,
    label: "Acknowledged",
  },
  hearing_scheduled: {
    color: "text-amber-500",
    icon: Clock,
    label: "Hearing Scheduled",
  },
  hearing_completed: {
    color: "text-amber-500",
    icon: CheckCircle2,
    label: "Hearing Done",
  },
  order_received: {
    color: "text-purple-400",
    icon: Scale,
    label: "Order Received",
  },
  resolved: { color: "text-emerald-400", icon: CheckCircle2, label: "Resolved" },
  appealed: { color: "text-red-400", icon: AlertCircle, label: "Appealed" },
  closed: { color: "text-neutral-500", icon: CheckCircle2, label: "Closed" },
};

export default function ComplaintListPage() {
  const [filings, setFilings] = useState<ComplaintFiling[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/complaint/list")
      .then((res) => res.json())
      .then((data) => setFilings(data.filings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = filings.filter(
    (f) => !["resolved", "closed"].includes(f.status),
  );
  const resolved = filings.filter((f) =>
    ["resolved", "closed"].includes(f.status),
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 border border-neutral-800 bg-[#050505]">
              <Gavel className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xs font-mono uppercase tracking-widest text-neutral-200">
                COMPLAINT_FILINGS
              </h1>
              <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 mt-1">
                TRACK AND MANAGE YOUR REGULATORY COMPLAINTS
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="border border-amber-900/50 bg-amber-950/10 p-4 text-center">
            <p className="text-lg font-mono tabular-nums text-amber-400">
              {active.length}
            </p>
            <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mt-1">
              ACTIVE
            </p>
          </div>
          <div className="border border-emerald-900/50 bg-emerald-950/10 p-4 text-center">
            <p className="text-lg font-mono tabular-nums text-emerald-400">
              {resolved.length}
            </p>
            <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mt-1">
              RESOLVED
            </p>
          </div>
          <div className="border border-neutral-800 bg-[#050505] p-4 text-center">
            <p className="text-lg font-mono tabular-nums text-neutral-300">
              {filings.length}
            </p>
            <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mt-1">
              TOTAL
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 w-full border border-neutral-900 bg-[#0a0a0a] animate-pulse"
              />
            ))}
          </div>
        ) : filings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-dashed border-neutral-800 p-16 text-center"
          >
            <div className="inline-flex items-center justify-center p-3 border border-amber-900/50 bg-amber-950/10 mb-6">
              <Gavel className="h-6 w-6 text-amber-500" />
            </div>
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-neutral-300 mb-2">
              [ NO_COMPLAINTS_FILED ]
            </h3>
            <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 mb-6 max-w-md mx-auto">
              ANALYZE A CONTRACT FIRST, THEN FILE A COMPLAINT IF VIOLATIONS ARE
              FOUND.
            </p>
            <Link href="/">
              <button className="flex items-center gap-2 px-4 py-2 border border-amber-900/50 bg-amber-950/10 font-mono uppercase tracking-widest text-[9px] text-amber-400 hover:text-amber-300 hover:border-amber-800 transition-colors mx-auto">
                <Plus className="h-3.5 w-3.5" />
                ANALYZE A CONTRACT
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {filings.map((filing, i) => {
              const config = statusConfig[filing.status] || statusConfig.draft;
              const StatusIcon = config.icon;
              return (
                <motion.div
                  key={filing.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/complaint/${filing.document_id}`}>
                    <div className="border border-neutral-900 bg-[#0a0a0a] hover:border-neutral-700 transition-colors cursor-pointer group p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <StatusIcon
                              className={`h-3 w-3 ${config.color}`}
                            />
                            <span
                              className={`text-[8px] font-mono uppercase tracking-widest ${config.color}`}
                            >
                              {config.label}
                            </span>
                            {filing.case_number && (
                              <span className="text-[8px] font-mono text-neutral-700">
                                #{filing.case_number}
                              </span>
                            )}
                          </div>
                          <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-300 truncate group-hover:text-amber-400 transition-colors">
                            {filing.complaint_title}
                          </h4>
                          <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mt-1">
                            {filing.authority_type.replace(/_/g, " ")} · ₹
                            {(filing.claim_amount || 0).toLocaleString(
                              "en-IN",
                            )}
                          </p>
                          {filing.next_hearing_date && (
                            <div className="flex items-center gap-1.5 mt-2 text-[8px] font-mono uppercase tracking-widest text-amber-400 border border-amber-900/50 bg-amber-950/10 px-2 py-1 w-fit">
                              <Clock className="h-2.5 w-2.5" />
                              NEXT HEARING:{" "}
                              {new Date(
                                filing.next_hearing_date,
                              ).toLocaleDateString("en-IN")}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-neutral-700 group-hover:text-neutral-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-2" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
