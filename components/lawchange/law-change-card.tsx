"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  FileText,
  Calendar,
  ExternalLink,
  ChevronDown,
  Building2,
  Bookmark,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LawChange } from "@/types";

interface Props {
  change: LawChange;
  compact?: boolean;
}

const SOURCE_ICONS: Record<string, string> = {
  indian_kanoon: "⚖️",
  prs_legislative: "📋",
  egazette: "📰",
  rbi: "🏦",
  irdai: "🛡️",
  trai: "📡",
  state_gazette: "🏛️",
  manual: "✍️",
};

const TYPE_LABELS: Record<string, string> = {
  court_judgment: "Court Judgment",
  amendment: "Amendment",
  new_act: "New Act",
  circular: "Circular",
  notification: "Notification",
  regulation: "Regulation",
  order: "Order",
  guideline: "Guideline",
  repeal: "Repeal",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-50 text-slate-500 border-slate-200",
};

export function LawChangeCard({ change, compact }: Props) {
  const [expanded, setExpanded] = useState(false);

  const icon = SOURCE_ICONS[change.source] || "📄";
  const typeLabel = TYPE_LABELS[change.change_type] || change.change_type;
  const dateStr = new Date(change.date_published).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-md transition-all mb-4">
      <CardContent className="p-4 sm:p-5">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left focus:outline-none"
        >
          <div className="flex items-start gap-4">
            <div className="shrink-0 h-10 w-10 bg-slate-50 dark:bg-slate-800 border border-slate-100 rounded-xl flex items-center justify-center text-lg shadow-sm dark:shadow-slate-900/20">
              <span className="drop-shadow-sm dark:shadow-slate-900/20">{icon}</span>
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight mb-2">
                {change.title}
              </h3>

              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-700 border-indigo-200 rounded-md px-2 py-0.5"
                >
                  {typeLabel}
                </Badge>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {dateStr}
                  </span>
                  {change.source && (
                    <span className="flex items-center gap-1.5">
                      <ExternalLink className="h-3 w-3" />
                      {change.source.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              </div>

              {!compact && (
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                  {change.summary}
                </p>
              )}

              {/* Clause type tags */}
              {change.affected_clause_types?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center mr-1">
                    Affects:
                  </span>
                  {change.affected_clause_types.slice(0, 4).map((ct) => (
                    <span
                      key={ct}
                      className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 shadow-sm dark:shadow-slate-900/20"
                    >
                      {ct.replace(/_/g, " ")}
                    </span>
                  ))}
                  {change.affected_clause_types.length > 4 && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      +{change.affected_clause_types.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className={`p-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex-shrink-0 transition-transform ${expanded ? "rotate-180 bg-slate-200" : ""}`}>
              <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </div>
          </div>
        </button>

        {/* Expanded Details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-5 pt-5 border-t border-slate-100 space-y-4">
                <p className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  {change.summary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {change.court_name && (
                    <div className="flex items-center gap-2.5 text-sm font-bold text-slate-600 dark:text-slate-400">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span>{change.court_name}</span>
                    </div>
                  )}

                  {change.case_number && (
                    <div className="flex items-center gap-2.5 text-sm font-bold text-slate-600 dark:text-slate-400">
                      <Bookmark className="h-4 w-4 text-slate-400" />
                      <span>{change.case_number}</span>
                    </div>
                  )}

                  {change.act_name && (
                    <div className="flex items-center gap-2.5 text-sm font-bold text-slate-600 dark:text-slate-400">
                      <Scale className="h-4 w-4 text-slate-400" />
                      <span>{change.act_name}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-3">
                  {change.classification_confidence && (
                    <Badge
                      className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 shadow-sm dark:shadow-slate-900/20 rounded-md ${ CONFIDENCE_COLORS[change.classification_confidence] || "" }`}
                    >
                      {change.classification_confidence} confidence
                    </Badge>
                  )}
                  {change.impact_type && (
                    <Badge className="text-[10px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm dark:shadow-slate-900/20 px-2 py-0.5 rounded-md">
                      {change.impact_type.replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>

                {change.source_url && (
                  <div className="pt-2 border-t border-slate-100">
                    <a
                      href={change.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 mt-2 shadow-sm dark:shadow-slate-900/20"
                    >
                      View Original Source
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
