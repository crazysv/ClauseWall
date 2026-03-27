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
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  archived: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  submitted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  resolved: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export function EvidenceCaseCard({ evidenceCase }: { evidenceCase: EvidenceCase }) {
  const emoji = CASE_EMOJIS[evidenceCase.dispute_type || "other"] || "📋";
  const timeAgo = getTimeAgo(evidenceCase.updated_at);

  return (
    <Link href={`/evidence/${evidenceCase.id}`} className="block group">
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{emoji}</span>
              <h3 className="font-semibold text-foreground truncate group-hover:text-blue-400 transition-colors">
                vs. {evidenceCase.counterparty_name}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground truncate">{evidenceCase.title}</p>
          </div>

          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STATUS_STYLE[evidenceCase.status] || STATUS_STYLE.active}`}>
            {evidenceCase.status}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <span className="text-xs text-muted-foreground capitalize">
            {evidenceCase.dispute_type || "General"} Dispute
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{evidenceCase.total_items} items</span>
          <span className="text-xs text-muted-foreground">•</span>
          <ChainStatusBadge verified={evidenceCase.chain_verified} />
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {timeAgo}
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
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
