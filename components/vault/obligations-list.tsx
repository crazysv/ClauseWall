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
  illegal: {
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  dangerous: {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  warning: {
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  safe: {
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
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
      <div className="flex flex-col items-center justify-center py-16 text-center border-4 border-black bg-gray-50 dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <ListChecks className="w-16 h-16 text-muted-foreground mb-6 stroke-[3px]" />
        <h3 className="text-xl font-black uppercase tracking-widest text-foreground mb-4">
          NO OBLIGATIONS FOUND
        </h3>
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground max-w-md leading-relaxed">
          NO OBLIGATIONS COULD BE EXTRACTED FROM YOUR CONTRACTS.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Type Filters */}
      <div className="flex gap-3 flex-wrap p-4 border-4 border-black bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
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
              className={`px-4 py-2 font-black uppercase tracking-widest text-xs border-4 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none ${
                isActive
                  ? "bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-y-[-2px] dark:bg-white dark:text-black"
                  : "bg-white text-black border-black dark:bg-zinc-800 dark:text-white"
              }`}
            >
              {f === "all"
                ? "ALL"
                : `${typeInfo?.emoji || ""} ${typeInfo?.label.toUpperCase() || f.toUpperCase()}`}{" "}
              <span
                className={isActive ? "opacity-80" : "text-muted-foreground"}
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
              <Card className="border-4 border-black bg-white dark:bg-zinc-900 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all mb-4">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-4">
                    <span className="text-2xl mt-0.5 p-2 border-4 border-black bg-gray-50 dark:bg-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                      {typeInfo.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Badge
                          className={`${risk.bg} ${risk.color} text-[10px] border-2 border-black rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-black uppercase tracking-widest`}
                        >
                          {obligation.risk_level}
                        </Badge>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 border-2 border-black">
                          {obligation.document_title}
                        </span>
                      </div>
                      <p className="text-base font-black uppercase tracking-widest text-foreground">
                        {obligation.title}
                      </p>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                        {obligation.description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col items-end">
                      {obligation.amount != null && obligation.amount > 0 && (
                        <p className="text-sm font-black tabular-nums tracking-tighter bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 px-2 py-1 border-2 border-red-500 shadow-[1px_1px_0px_0px_rgba(239,68,68,1)] mb-2">
                          ₹{obligation.amount.toLocaleString("en-IN")}
                        </p>
                      )}
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-auto px-2 py-1 border-b-2 border-black">
                        {freq}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        {filtered.length > 50 && (
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground text-center py-4 border-t-4 border-black mt-4">
            SHOWING 50 OF {filtered.length} OBLIGATIONS
          </p>
        )}
      </div>
    </div>
  );
}
