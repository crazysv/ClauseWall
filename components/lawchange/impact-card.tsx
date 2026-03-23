"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  FileText,
  DollarSign,
  ArrowRight,
  Calendar,
  Scale,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LawChange, LawChangeImpact } from "@/types";

interface Props {
  impact: LawChangeImpact & { change: LawChange };
  onAcknowledge: (id: string) => void;
}

const SEVERITY_CONFIG: Record<
  string,
  { color: string; border: string; bg: string; label: string }
> = {
  rights_gained: {
    color: "text-green-400",
    border: "border-l-green-500",
    bg: "bg-green-500/5",
    label: "Rights Gained",
  },
  clause_voided: {
    color: "text-green-400",
    border: "border-l-green-500",
    bg: "bg-green-500/5",
    label: "Clause Voided",
  },
  protection_added: {
    color: "text-green-400",
    border: "border-l-green-500",
    bg: "bg-green-500/5",
    label: "Protection Added",
  },
  rights_lost: {
    color: "text-red-400",
    border: "border-l-red-500",
    bg: "bg-red-500/5",
    label: "Rights Lost",
  },
  protection_removed: {
    color: "text-red-400",
    border: "border-l-red-500",
    bg: "bg-red-500/5",
    label: "Protection Removed",
  },
  obligation_added: {
    color: "text-orange-400",
    border: "border-l-orange-500",
    bg: "bg-orange-500/5",
    label: "Obligation Added",
  },
  obligation_removed: {
    color: "text-green-400",
    border: "border-l-green-500",
    bg: "bg-green-500/5",
    label: "Obligation Removed",
  },
  limit_changed: {
    color: "text-yellow-400",
    border: "border-l-yellow-500",
    bg: "bg-yellow-500/5",
    label: "Limit Changed",
  },
  neutral_clarification: {
    color: "text-blue-400",
    border: "border-l-blue-500",
    bg: "bg-blue-500/5",
    label: "Clarification",
  },
};

export default function ImpactCard({ impact, onAcknowledge }: Props) {
  const [acknowledged, setAcknowledged] = useState(impact.user_acknowledged);
  const config = SEVERITY_CONFIG[impact.impact_severity] || SEVERITY_CONFIG.neutral_clarification;

  const handleAcknowledge = () => {
    setAcknowledged(true);
    onAcknowledge(impact.id);
  };

  const dateStr = impact.change
    ? new Date(impact.change.date_published).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <Card
      className={`relative overflow-hidden border-l-4 ${config.border} ${config.bg} border-white/5 transition-all ${
        !acknowledged ? "ring-1 ring-indigo-500/20" : "opacity-80"
      }`}
    >
      {/* Unacknowledged pulse */}
      {!acknowledged && (
        <div className="absolute top-3 right-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-50" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
          </span>
        </div>
      )}

      <CardContent className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Scale className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.color}`} />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white/90">
              {impact.change?.title || "Law Change"}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-[10px] ${config.color} bg-transparent border border-current/20`}>
                {config.label}
              </Badge>
              <span className="text-[10px] text-white/25 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {dateStr}
              </span>
            </div>
          </div>
        </div>

        {/* Clause affected */}
        <p className="text-xs text-white/30 mb-2">
          Clause {impact.clause_number || "—"}: {impact.clause_type?.replace(/_/g, " ")}
        </p>

        {/* Impact description */}
        <p className="text-xs text-white/50 leading-relaxed mb-3">
          {impact.impact_description}
        </p>

        {/* Before / After */}
        {(impact.old_legal_position || impact.new_legal_position) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {impact.old_legal_position && (
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <p className="text-[10px] text-white/25 mb-1 uppercase tracking-wider">
                  Before
                </p>
                <p className="text-xs text-white/40 line-clamp-3">
                  {impact.old_legal_position}
                </p>
              </div>
            )}
            {impact.new_legal_position && (
              <div className="p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                <p className="text-[10px] text-indigo-300/60 mb-1 uppercase tracking-wider">
                  After
                </p>
                <p className="text-xs text-indigo-200/60 line-clamp-3">
                  {impact.new_legal_position}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Financial impact */}
        {impact.financial_description && (
          <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-300">
              {impact.financial_impact
                ? `₹${impact.financial_impact.toLocaleString("en-IN")} — `
                : ""}
              {impact.financial_description}
            </span>
          </div>
        )}

        {/* Action required */}
        {impact.action_required && (
          <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 mb-3">
            <p className="text-[10px] text-indigo-300/50 uppercase tracking-wider mb-1">
              ✅ Action Required
            </p>
            <p className="text-xs text-indigo-200/70">
              {impact.action_required}
            </p>
          </div>
        )}

        {/* Citation */}
        {impact.new_legal_citation && (
          <p className="text-[10px] text-white/20 mb-3">
            📖 {impact.new_legal_citation}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!acknowledged && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAcknowledge}
              className="gap-1.5 text-xs border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
            >
              <Check className="h-3 w-3" />
              Acknowledge
            </Button>
          )}
          {acknowledged && (
            <span className="text-[10px] text-white/20 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Acknowledged
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
