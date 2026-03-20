"use client";

import { motion } from "framer-motion";
import { Scale, Bot, ChevronRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProofTree } from "@/lib/reasoning/types";
import { getProofSummary } from "@/lib/reasoning/proof-formatter";

interface ProofSummaryProps {
  proofTree: ProofTree | null;
  onViewProof: () => void;
}

export default function ProofSummary({ proofTree, onViewProof }: ProofSummaryProps) {
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

  // Color scheme based on verdict
  const colorMap: Record<string, {
    bg: string; border: string; text: string; icon: string; badge: string;
  }> = {
    illegal: {
      bg: "bg-red-500/5",
      border: "border-red-500/30",
      text: "text-red-400",
      icon: "text-red-400",
      badge: "bg-red-500/15 text-red-400 border-red-500/30",
    },
    dangerous: {
      bg: "bg-orange-500/5",
      border: "border-orange-500/30",
      text: "text-orange-400",
      icon: "text-orange-400",
      badge: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    },
    warning: {
      bg: "bg-amber-500/5",
      border: "border-amber-500/30",
      text: "text-amber-400",
      icon: "text-amber-400",
      badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    },
    safe: {
      bg: "bg-emerald-500/5",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      icon: "text-emerald-400",
      badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
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
      className={`w-full flex items-center justify-between p-3 rounded-lg ${colors.bg} border ${colors.border} hover:brightness-110 transition-all group`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <Scale className={`h-4 w-4 ${colors.icon}`} />
        <span className={`text-xs font-semibold ${colors.text}`}>
          Formally Proven:
        </span>
        <Badge className={`${colors.badge} text-[10px] gap-1`}>
          <ShieldCheck className="h-3 w-3" />
          {verdictLabel}
        </Badge>
        <span className="text-xs text-gray-500">
          {summary.stepsCount} steps · {summary.verifiedPercent}% verified
          {summary.mainStatute ? ` · ${summary.mainStatute}` : ""}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`text-xs ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
          View Proof Tree
        </span>
        <ChevronRight className={`h-4 w-4 ${colors.icon} group-hover:translate-x-0.5 transition-transform`} />
      </div>
    </motion.button>
  );
}
