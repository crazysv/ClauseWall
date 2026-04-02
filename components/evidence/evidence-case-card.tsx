"use client";

import Link from "next/link";
import type { EvidenceCase } from "@/types/evidence";
import { ChainStatusBadge } from "./chain-status-badge";
import { ArrowRight, Calendar } from "lucide-react";

const CASE_EMOJIS: Record<string, string> = {
  rental: "🏠", employment: "💼", consumer: "🛒", financial: "💳",
  property: "🏗️", service: "⚙️", insurance: "🛡️", telecom: "📱",
  ecommerce: "📦", other: "📋",
};

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  archived: "bg-slate-50 text-slate-700 border-slate-200",
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

export function EvidenceCaseCard({ evidenceCase }: { evidenceCase: EvidenceCase }) {
  const emoji = CASE_EMOJIS[evidenceCase.dispute_type || "other"] || "📋";
  const timeAgo = getTimeAgo(evidenceCase.updated_at);

  return (
    <Link href={`/evidence/${evidenceCase.id}`} className="block group">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-lg md:text-xl lg:text-2xl">{emoji}</span>
              <h3 className="font-black text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 transition-colors">
                vs. {evidenceCase.counterparty_name}
              </h3>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{evidenceCase.title}</p>
          </div>

          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-black border ${STATUS_STYLE[evidenceCase.status] || STATUS_STYLE.active}`}>
            {evidenceCase.status}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {evidenceCase.dispute_type || "General"} Dispute
          </span>
          <span className="text-xs text-slate-300">•</span>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{evidenceCase.total_items} items</span>
          <span className="text-xs text-slate-300">•</span>
          <ChainStatusBadge verified={evidenceCase.chain_verified} />
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Calendar className="h-3.5 w-3.5" />
            {timeAgo}
          </span>
          <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 group-hover:-translate-x-1.5 transition-all outline-none" />
        </div>
      </div>
    </Link>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN");
}
