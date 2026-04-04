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
  active: "bg-emerald-200 text-emerald-900 border-black",
  archived: "bg-gray-200 text-gray-900 border-black bg-[url('/noise.png')]",
  submitted: "bg-blue-200 text-blue-900 border-black",
  resolved: "bg-purple-200 text-purple-900 border-black",
};

export function EvidenceCaseCard({ evidenceCase }: { evidenceCase: EvidenceCase }) {
  const emoji = CASE_EMOJIS[evidenceCase.dispute_type || "other"] || "📋";
  const timeAgo = getTimeAgo(evidenceCase.updated_at);

  return (
    <Link href={`/evidence/${evidenceCase.id}`} className="block group">
      <div className="border-4 border-black bg-white dark:bg-zinc-900 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all duration-200 h-full flex flex-col items-start justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{emoji}</span>
              <h3 className="font-black text-lg uppercase tracking-widest text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                vs. {evidenceCase.counterparty_name}
              </h3>
            </div>
            <p className="text-sm font-bold text-muted-foreground truncate">{evidenceCase.title}</p>
          </div>

          <span className={`inline-flex items-center px-3 py-1 text-xs font-black uppercase tracking-widest border-2 ${STATUS_STYLE[evidenceCase.status] || STATUS_STYLE.active}`}>
            {evidenceCase.status}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-6 mb-4 flex-wrap w-full">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-2 border-black px-2 py-0.5">
            {evidenceCase.dispute_type || "General"}
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-2 border-black px-2 py-0.5">{evidenceCase.total_items} items</span>
          <span className="text-xs text-muted-foreground">•</span>
          <ChainStatusBadge verified={evidenceCase.chain_verified} />
        </div>

        <div className="flex w-full items-center justify-between mt-auto pt-4 border-t-4 border-black border-dashed">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Calendar className="h-4 w-4 stroke-[3px]" />
            {timeAgo}
          </span>
          <ArrowRight className="h-5 w-5 text-black dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all stroke-[3px]" />
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
