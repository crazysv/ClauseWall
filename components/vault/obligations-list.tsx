"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ListChecks, CheckCircle2 } from "lucide-react";
import type { UnifiedObligation, RiskLevel } from "@/types";

interface ObligationsListProps {
  obligations: UnifiedObligation[];
}

const RISK_COLORS: Record<RiskLevel, { color: string; bg: string; border: string }> = {
  illegal: {
    color: "text-purple-400",
    bg: "bg-purple-950/20",
    border: "border-purple-900/50",
  },
  dangerous: {
    color: "text-red-500",
    bg: "bg-red-950/20",
    border: "border-red-900/50",
  },
  warning: {
    color: "text-amber-500",
    bg: "bg-amber-950/20",
    border: "border-amber-900/50",
  },
  safe: {
    color: "text-emerald-500",
    bg: "bg-emerald-950/20",
    border: "border-emerald-900/50",
  },
};

const TYPE_LABELS: Record<string, { emoji: string; label: string }> = {
  payment: { emoji: "💰", label: "Payment" },
  action: { emoji: "📋", label: "Action" },
  restriction: { emoji: "🚫", label: "Restriction" },
  deadline: { emoji: "⏰", label: "Deadline" },
};

const FREQUENCY_LABELS: Record<string, string> = {
  one_time: "One-time",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semi_annual: "Semi-annual",
  annual: "Annual",
  on_event: "On event",
};

type TypeFilter = "all" | "payment" | "action" | "restriction" | "deadline";

export default function ObligationsList({ obligations }: ObligationsListProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const filtered =
    typeFilter === "all"
      ? obligations
      : obligations.filter((o) => o.obligation_type === typeFilter);

  const counts = {
    all: obligations.length,
    payment: obligations.filter((o) => o.obligation_type === "payment").length,
    action: obligations.filter((o) => o.obligation_type === "action").length,
    restriction: obligations.filter((o) => o.obligation_type === "restriction")
      .length,
    deadline: obligations.filter((o) => o.obligation_type === "deadline")
      .length,
  };

  if (obligations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-neutral-900 bg-[#0a0a0a]">
        <ListChecks className="w-8 h-8 text-neutral-700 mb-4" />
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-2">
          [ NO_OBLIGATIONS_FOUND ]
        </h3>
        <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 max-w-md leading-relaxed">
          NO OBLIGATIONS COULD BE EXTRACTED FROM YOUR CONTRACTS.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Type Filters */}
      <div className="flex gap-2 flex-wrap p-3 border border-neutral-900 bg-[#0a0a0a]">
        {(
          [
            "all",
            "payment",
            "action",
            "restriction",
            "deadline",
          ] as TypeFilter[]
        ).map((f) => {
          const count = counts[f];
          const isActive = typeFilter === f;
          const typeInfo = TYPE_LABELS[f];

          return (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-3 py-1.5 font-mono uppercase tracking-widest text-[9px] border transition-colors ${
                isActive
                  ? "border-cyan-900/50 bg-cyan-950/20 text-cyan-400"
                  : "border-neutral-800 bg-[#050505] text-neutral-500 hover:text-neutral-300 hover:border-neutral-700"
              }`}
            >
              {f === "all"
                ? "ALL"
                : `${typeInfo?.label.toUpperCase() || f.toUpperCase()}`}{" "}
              <span
                className={isActive ? "text-cyan-500/70" : "text-neutral-700"}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Obligations */}
      <div className="space-y-2">
        {filtered.slice(0, 50).map((obligation, index) => {
          const risk = RISK_COLORS[obligation.risk_level] || RISK_COLORS.safe;
          const typeInfo =
            TYPE_LABELS[obligation.obligation_type] || TYPE_LABELS.action;
          const freq =
            FREQUENCY_LABELS[obligation.frequency] || obligation.frequency;

          return (
            <motion.div
              key={obligation.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.02, 0.5) }}
            >
              <div className="border border-neutral-900 bg-[#0a0a0a] hover:border-neutral-700 transition-colors p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  <span className="text-xl mt-0.5 p-2 border border-neutral-800 bg-[#050505] flex-shrink-0">
                    {typeInfo.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className={`${risk.color} ${risk.bg} text-[8px] border ${risk.border} font-mono uppercase tracking-widest px-1.5 py-0.5`}
                      >
                        {obligation.risk_level}
                      </span>
                      <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 truncate bg-neutral-900 px-1.5 py-0.5 border border-neutral-800">
                        {obligation.document_title}
                      </span>
                    </div>
                    <p className="text-xs font-mono uppercase tracking-widest text-neutral-200">
                      {obligation.title}
                    </p>
                    <p className="text-[10px] font-mono text-neutral-500 mt-2 line-clamp-2 leading-relaxed">
                      {obligation.description}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end">
                    {obligation.amount != null && obligation.amount > 0 && (
                      <span className="text-[10px] font-mono text-red-500 border border-red-900/50 bg-red-950/20 px-2 py-0.5 mb-2">
                        ₹{obligation.amount.toLocaleString("en-IN")}
                      </span>
                    )}
                    <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mt-auto">
                      {freq}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        {filtered.length > 50 && (
          <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 text-center py-4 border-t border-neutral-900 mt-4">
            SHOWING 50 OF {filtered.length} OBLIGATIONS
          </p>
        )}
      </div>
    </div>
  );
}
