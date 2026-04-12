"use client";

import Link from "next/link";
import type { EvidenceCase } from "@/types/evidence";
import { ChainStatusBadge } from "./chain-status-badge";
import { ArrowRight, Calendar } from "lucide-react";

const CASE_EMOJIS: Record<string, string> = {
  rental: "🏠",
  employment: "💼",
  consumer: "🛒",
  financial: "💳",
  property: "🏗️",
  service: "⚙️",
  insurance: "🛡️",
  telecom: "📱",
  ecommerce: "📦",
  other: "📋",
};

const STATUS_STYLE: Record<string, string> = {
  active: "text-emerald-400 bg-emerald-950/20 border-emerald-900/50",
  archived: "text-neutral-500 bg-neutral-950/20 border-neutral-800",
  submitted: "text-cyan-400 bg-cyan-950/20 border-cyan-900/50",
  resolved: "text-purple-400 bg-purple-950/20 border-purple-900/50",
};

export function EvidenceCaseCard({
  evidenceCase,
}: {
  evidenceCase: EvidenceCase;
}) {
  const emoji = CASE_EMOJIS[evidenceCase.dispute_type || "other"] || "📋";
  const timeAgo = getTimeAgo(evidenceCase.updated_at);

  return (
    <Link href={`/evidence/${evidenceCase.id}`} className="block group">
      <div className="border border-neutral-900 bg-[#0a0a0a] p-5 hover:border-neutral-700 transition-colors h-full flex flex-col items-start justify-between">
        <div className="flex items-start justify-between gap-3 w-full">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{emoji}</span>
              <h3 className="text-[9px] font-mono uppercase tracking-widest text-neutral-300 group-hover:text-amber-400 transition-colors truncate">
                VS. {evidenceCase.counterparty_name}
              </h3>
            </div>
            <p className="text-[8px] font-mono text-neutral-600 truncate">
              {evidenceCase.title}
            </p>
          </div>

          <span
            className={`inline-flex items-center px-2 py-0.5 text-[7px] font-mono uppercase tracking-widest border ${STATUS_STYLE[evidenceCase.status] || STATUS_STYLE.active}`}
          >
            {evidenceCase.status}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-4 mb-3 flex-wrap w-full">
          <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-500 border border-neutral-800 px-1.5 py-0.5">
            {evidenceCase.dispute_type || "General"}
          </span>
          <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-500 border border-neutral-800 px-1.5 py-0.5">
            {evidenceCase.total_items} ITEMS
          </span>
          <ChainStatusBadge verified={evidenceCase.chain_verified} />
        </div>

        <div className="flex w-full items-center justify-between mt-auto pt-3 border-t border-neutral-800">
          <span className="flex items-center gap-1.5 text-[7px] font-mono uppercase tracking-widest text-neutral-600">
            <Calendar className="h-3 w-3" />
            {timeAgo}
          </span>
          <ArrowRight className="h-3 w-3 text-neutral-700 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
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
