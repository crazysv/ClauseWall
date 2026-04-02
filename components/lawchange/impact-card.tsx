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
    color: "text-emerald-700",
    border: "border-l-emerald-500",
    bg: "bg-emerald-50",
    label: "Rights Gained",
  },
  clause_voided: {
    color: "text-emerald-700",
    border: "border-l-emerald-500",
    bg: "bg-emerald-50",
    label: "Clause Voided",
  },
  protection_added: {
    color: "text-emerald-700",
    border: "border-l-emerald-500",
    bg: "bg-emerald-50",
    label: "Protection Added",
  },
  rights_lost: {
    color: "text-red-700",
    border: "border-l-red-500",
    bg: "bg-red-50",
    label: "Rights Lost",
  },
  protection_removed: {
    color: "text-red-700",
    border: "border-l-red-500",
    bg: "bg-red-50",
    label: "Protection Removed",
  },
  obligation_added: {
    color: "text-amber-700",
    border: "border-l-amber-500",
    bg: "bg-amber-50",
    label: "Obligation Added",
  },
  obligation_removed: {
    color: "text-emerald-700",
    border: "border-l-emerald-500",
    bg: "bg-emerald-50",
    label: "Obligation Removed",
  },
  limit_changed: {
    color: "text-amber-700",
    border: "border-l-amber-500",
    bg: "bg-amber-50",
    label: "Limit Changed",
  },
  neutral_clarification: {
    color: "text-indigo-700",
    border: "border-l-indigo-500",
    bg: "bg-indigo-50",
    label: "Clarification",
  },
};

export function ImpactCard({ impact, onAcknowledge }: Props) {
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
      className={`relative overflow-hidden border-l-[6px] ${config.border} bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 rounded-xl mb-4 transition-all ${ !acknowledged ? "ring-2 ring-indigo-200 ring-offset-1" : "opacity-80 grayscale-[20%]" }`}
    >
      {/* Unacknowledged pulse */}
      {!acknowledged && (
        <div className="absolute top-4 right-4">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600" />
          </span>
        </div>
      )}

      <CardContent className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-2 rounded-lg ${config.bg} shrink-0 shadow-inner`}>
            <Scale className={`h-5 w-5 ${config.color}`} />
          </div>
          <div className="min-w-0 pr-6">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight mb-2">
              {impact.change?.title || "Law Change"}
            </h3>
            <div className="flex items-center gap-3 flex-wrap mt-2">
              <Badge className={`text-[10px] font-bold uppercase tracking-widest ${config.color} ${config.bg} border-none shadow-sm dark:shadow-slate-900/20 px-2 py-0.5 rounded-md`}>
                {config.label}
              </Badge>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                {dateStr}
              </span>
            </div>
          </div>
        </div>

        {/* Clause affected */}
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
          Clause {impact.clause_number || "—"}: <span className="text-slate-700">{impact.clause_type?.replace(/_/g, " ")}</span>
        </p>

        {/* Impact description */}
        <p className="text-sm font-medium text-slate-700 leading-relaxed mb-4 ml-3">
          {impact.impact_description}
        </p>

        {/* Before / After */}
        {(impact.old_legal_position || impact.new_legal_position) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {impact.old_legal_position && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20">
                <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
                  Before
                </p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {impact.old_legal_position}
                </p>
              </div>
            )}
            {impact.new_legal_position && (
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm dark:shadow-slate-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-100/50 rounded-bl-full border-l border-b border-indigo-100/30" />
                <p className="text-[10px] font-bold text-indigo-500 mb-2 uppercase tracking-widest">
                  After
                </p>
                <p className="text-sm font-medium text-indigo-800 line-clamp-3 leading-relaxed">
                  {impact.new_legal_position}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Financial impact */}
        {impact.financial_description && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm dark:shadow-slate-900/20">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-800">
              {impact.financial_impact
                ? `₹${impact.financial_impact.toLocaleString("en-IN")} — `
                : ""}
              <span className="font-medium text-emerald-700">{impact.financial_description}</span>
            </span>
          </div>
        )}

        {/* Action required */}
        {impact.action_required && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 shadow-sm dark:shadow-slate-900/20 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base drop-shadow-sm dark:shadow-slate-900/20 leading-none">✅</span>
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">
                Action Required
              </p>
            </div>
            <p className="text-sm font-medium text-amber-900 leading-relaxed ml-6">
              {impact.action_required}
            </p>
          </div>
        )}

        {/* Citation */}
        {impact.new_legal_citation && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-1.5 ml-1 border-t border-slate-100 pt-3">
            <FileText className="h-3 w-3" /> {impact.new_legal_citation}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 ml-1">
          {!acknowledged && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAcknowledge}
              className="gap-2 text-sm bg-white dark:bg-card border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 font-bold shadow-sm dark:shadow-slate-900/20 transition-all rounded-lg"
            >
              <Check className="h-4 w-4" />
              Acknowledge
            </Button>
          )}
          {acknowledged && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-inner">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              Acknowledged
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
