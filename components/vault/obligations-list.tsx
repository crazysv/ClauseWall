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
  illegal: { color: "text-purple-400", bg: "bg-purple-500/10" },
  dangerous: { color: "text-red-400", bg: "bg-red-500/10" },
  warning: { color: "text-yellow-400", bg: "bg-yellow-500/10" },
  safe: { color: "text-green-400", bg: "bg-green-500/10" },
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
    restriction: obligations.filter((o) => o.obligation_type === "restriction").length,
    deadline: obligations.filter((o) => o.obligation_type === "deadline").length,
  };

  if (obligations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ListChecks className="w-12 h-12 text-white/20 mb-4" />
        <h3 className="text-lg font-semibold text-white/60 mb-2">
          No Obligations Found
        </h3>
        <p className="text-sm text-white/40 max-w-md">
          No obligations could be extracted from your contracts.
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isActive
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-white/[0.02] border-white/5 text-white/40 hover:text-white/60"
              }`}
            >
              {f === "all" ? "All" : `${typeInfo?.emoji || ""} ${typeInfo?.label || f}`}{" "}
              <span className="opacity-60">({count})</span>
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
              <Card className="bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <span className="text-base mt-0.5">{typeInfo.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge className={`${risk.bg} ${risk.color} text-[9px] border-0 px-1.5`}>
                          {obligation.risk_level}
                        </Badge>
                        <span className="text-[10px] text-white/30 truncate">
                          {obligation.document_title}
                        </span>
                      </div>
                      <p className="text-sm text-white/80">{obligation.title}</p>
                      <p className="text-xs text-white/40 mt-0.5 line-clamp-2">
                        {obligation.description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {obligation.amount != null && obligation.amount > 0 && (
                        <p className="text-sm font-semibold text-white/70">
                          ₹{obligation.amount.toLocaleString("en-IN")}
                        </p>
                      )}
                      <p className="text-[10px] text-white/30">{freq}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        {filtered.length > 50 && (
          <p className="text-xs text-white/30 text-center py-2">
            Showing 50 of {filtered.length} obligations
          </p>
        )}
      </div>
    </div>
  );
}
