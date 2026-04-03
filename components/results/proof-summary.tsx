"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Scale, Bot, ChevronRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProofTree } from "@/lib/reasoning/types";
import { getProofSummary } from "@/lib/reasoning/proof-formatter";

interface ProofSummaryProps {
  proofTree: ProofTree | null;
  onViewProof: () => void;
  documentId?: string;
}

export default function ProofSummary({ proofTree, onViewProof, documentId }: ProofSummaryProps) {
  if (!proofTree) {
    // No formal proof — show AI-only badge
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-between p-3 rounded-lg bg-slate-500/5 border border-slate-500/20"
      >
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">
            AI Assessment Only
          </span>
          <span className="text-xs text-slate-500">
            No formal proof available · Based on pattern analysis
          </span>
        </div>
      </motion.div>
    );
  }

  const summary = getProofSummary(proofTree);

  const colorMap: Record<string, {
    bg: string; border: string; text: string; icon: string; badge: string;
  }> = {
    illegal: {
      bg: "bg-background",
      border: "border-red-600",
      text: "text-red-600",
      icon: "text-red-600",
      badge: "bg-background text-red-600 border-red-600",
    },
    dangerous: {
      bg: "bg-background",
      border: "border-orange-600",
      text: "text-orange-600",
      icon: "text-orange-600",
      badge: "bg-background text-orange-600 border-orange-600",
    },
    warning: {
      bg: "bg-background",
      border: "border-yellow-600",
      text: "text-yellow-600",
      icon: "text-yellow-600",
      badge: "bg-background text-yellow-600 border-yellow-600",
    },
    safe: {
      bg: "bg-background",
      border: "border-green-600",
      text: "text-green-600",
      icon: "text-green-600",
      badge: "bg-background text-green-600 border-green-600",
    },
  };

  const colors = colorMap[summary.riskLevel] || colorMap.warning;
  const verdictLabel = summary.verdict.replace("proven_", "").toUpperCase();

  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        e.stopPropagation();
        onViewProof();
      }}
      className={`w-full flex items-center justify-between p-3 card-impact border-2 ${colors.bg} ${colors.border} hover:-translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all group`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <Scale className={`h-4 w-4 ${colors.icon}`} />
        <span className={`text-xs font-black uppercase tracking-wider ${colors.text}`}>
          Formally Proven:
        </span>
        <Badge variant="outline" className={`${colors.badge} border-2 text-[10px] gap-1 font-black uppercase tracking-wider`}>
          <ShieldCheck className="h-3 w-3" />
          {verdictLabel}
        </Badge>
        <span className="text-xs font-bold text-muted-foreground">
          {summary.stepsCount} steps · {summary.verifiedPercent}% verified
          {summary.mainStatute ? ` · ${summary.mainStatute}` : ""}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`text-xs font-black uppercase tracking-wider ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
          View Proof Tree
        </span>
        <ChevronRight className={`h-4 w-4 ${colors.icon} group-hover:translate-x-0.5 transition-transform`} />
      </div>

      {/* Cross-links for proven violations */}
      {documentId && proofTree && (
        proofTree.verdict === 'proven_illegal' ||
        proofTree.verdict === 'proven_dangerous'
      ) && (
        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t-2 border-foreground">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Next:</span>
          <Link
            href={`/negotiate/${documentId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] font-black tracking-wider uppercase text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Get negotiation script →
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link
            href={`/letter/${documentId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] font-black tracking-wider uppercase text-amber-600 hover:text-amber-700 transition-colors"
          >
            Generate legal notice →
          </Link>
        </div>
      )}
    </motion.button>
  );
}
