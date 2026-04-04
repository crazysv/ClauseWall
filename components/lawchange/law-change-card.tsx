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
  high: "bg-green-500/15 text-green-400",
  medium: "bg-yellow-500/15 text-yellow-400",
  low: "bg-white/5 text-white/30",
};

export default function LawChangeCard({ change, compact }: Props) {
  const [expanded, setExpanded] = useState(false);

  const icon = SOURCE_ICONS[change.source] || "📄";
  const typeLabel = TYPE_LABELS[change.change_type] || change.change_type;
  const dateStr = new Date(change.date_published).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Card className="bg-white/[0.02] border-white/5 hover:border-indigo-500/20 transition-all">
      <CardContent className="p-4">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left"
        >
          <div className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-white/90 leading-snug">
                {change.title}
              </h3>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className="text-[10px] border-indigo-500/30 text-indigo-300"
                >
                  {typeLabel}
                </Badge>
                <span className="text-[10px] text-white/25 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {dateStr}
                </span>
                {change.source && (
                  <span className="text-[10px] text-white/20">
                    {change.source.replace(/_/g, " ")}
                  </span>
                )}
              </div>

              {!compact && (
                <p className="text-xs text-white/40 mt-2 line-clamp-2">
                  {change.summary}
                </p>
              )}

              {/* Clause type tags */}
              {change.affected_clause_types?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {change.affected_clause_types.slice(0, 4).map((ct) => (
                    <span
                      key={ct}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/25"
                    >
                      {ct.replace(/_/g, " ")}
                    </span>
                  ))}
                  {change.affected_clause_types.length > 4 && (
                    <span className="text-[9px] text-white/20">
                      +{change.affected_clause_types.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>

            <ChevronDown
              className={`h-4 w-4 text-white/20 flex-shrink-0 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
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
              <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                <p className="text-xs text-white/50 leading-relaxed">
                  {change.summary}
                </p>

                {change.court_name && (
                  <div className="flex items-center gap-2 text-xs text-white/30">
                    <Building2 className="h-3 w-3" />
                    <span>{change.court_name}</span>
                  </div>
                )}

                {change.case_number && (
                  <div className="flex items-center gap-2 text-xs text-white/30">
                    <FileText className="h-3 w-3" />
                    <span>{change.case_number}</span>
                  </div>
                )}

                {change.act_name && (
                  <div className="flex items-center gap-2 text-xs text-white/30">
                    <Scale className="h-3 w-3" />
                    <span>{change.act_name}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {change.classification_confidence && (
                    <Badge
                      className={`text-[10px] ${
                        CONFIDENCE_COLORS[change.classification_confidence] ||
                        ""
                      }`}
                    >
                      {change.classification_confidence} confidence
                    </Badge>
                  )}
                  {change.impact_type && (
                    <Badge className="text-[10px] bg-indigo-500/15 text-indigo-300">
                      {change.impact_type.replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>

                {change.source_url && (
                  <a
                    href={change.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Source
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
