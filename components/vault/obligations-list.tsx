"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ListChecks, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { UnifiedObligation, RiskLevel } from "@/types";

interface ObligationsListProps {
  obligations: UnifiedObligation[];
}

const RISK_COLORS: Record<RiskLevel, { color: string; bg: string }> = {
  illegal: { color: "text-purple-700", bg: "bg-purple-100" },
  dangerous: { color: "text-red-700", bg: "bg-red-100" },
  warning: { color: "text-amber-700", bg: "bg-amber-100" },
  safe: { color: "text-emerald-700", bg: "bg-emerald-100" },
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

export function ObligationsList({ obligations }: ObligationsListProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const filtered =
    typeFilter === "all"
      ? obligations
      : obligations.filter((o) => o.obligation_type === typeFilter);

  const counts = {
    all: obligations.length,
    payment: obligations.filter((o) => o.obligation_type === "payment").length,
    action: obligations.filter((o) => o.obligation_type === "action").length,
    restriction: obligations.filter((o) => o.obligation_type === "restriction").length,
    deadline: obligations.filter((o) => o.obligation_type === "deadline").length,
  };

  if (obligations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 md:py-6 md:py-8 lg:py-12 lg:py-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-dashed rounded-3xl">
        <ListChecks className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-2 tracking-tight">
          No Obligations Found
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-md">
          No actionable obligations could be extracted from your contracts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Type Filters */}
      <div className="flex gap-2 flex-wrap">
        {(
          ["all", "payment", "action", "restriction", "deadline"] as TypeFilter[]
        ).map((f) => {
          const count = counts[f];
          const isActive = typeFilter === f;
          const typeInfo = TYPE_LABELS[f];

          return (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all shadow-sm dark:shadow-slate-900/20 ${ isActive ? "bg-indigo-600 border-indigo-700 text-white" : "bg-white dark:bg-card border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800" }`}
            >
              {f === "all" ? "All" : `${typeInfo?.emoji || ""} ${typeInfo?.label || f}`}{" "}
              <span className={isActive ? "text-indigo-200" : "text-slate-400"}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Obligations */}
      <div className="space-y-2">
        {filtered.slice(0, 50).map((obligation, index) => {
          const risk = RISK_COLORS[obligation.risk_level] || RISK_COLORS.safe;
          const typeInfo = TYPE_LABELS[obligation.obligation_type] || TYPE_LABELS.action;
          const freq = FREQUENCY_LABELS[obligation.frequency] || obligation.frequency;

          return (
            <motion.div
              key={obligation.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.02, 0.5) }}
            >
              <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 hover:border-indigo-300 shadow-sm dark:shadow-slate-900/20 rounded-2xl transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <span className="text-xl mt-0.5 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-100">{typeInfo.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge className={`${risk.bg} ${risk.color} text-[10px] font-black uppercase tracking-widest border-0 px-2 rounded-full`}>
                          {obligation.risk_level}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest">
                          {obligation.document_title}
                        </span>
                      </div>
                      <p className="text-base font-black text-slate-900 dark:text-slate-100">{obligation.title}</p>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {obligation.description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col items-end">
                      {obligation.amount != null && obligation.amount > 0 && (
                        <p className="text-lg font-black text-indigo-700 mb-1">
                          ₹{obligation.amount.toLocaleString("en-IN")}
                        </p>
                      )}
                      <Badge variant="outline" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">{freq}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        {filtered.length > 50 && (
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center py-4">
            Showing 50 of {filtered.length} obligations
          </p>
        )}
      </div>
    </div>
  );
}
