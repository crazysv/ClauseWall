"use client";

import { motion } from "framer-motion";
import {
  Users,
  AlertTriangle,
  MapPin,
  Clock,
  TrendingUp,
  Brain,
  Fingerprint,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CommunityMatch } from "@/types";
import { getStateName } from "@/lib/utils/constants";

interface CommunityInsightProps {
  clauseId: string;
  clauseText: string;
  clauseType: string;
  jurisdiction: string;
  riskLevel: string;
  communityMatch?: CommunityMatch | string | null;
}

export function CommunityInsight({
  clauseId,
  clauseText,
  clauseType,
  jurisdiction,
  riskLevel,
  communityMatch,
}: CommunityInsightProps) {
  // Don't render for safe/warning
  if (riskLevel !== "dangerous" && riskLevel !== "illegal") return null;

  // Parse community match if it's a JSON string
  let match: CommunityMatch | null = null;
  
  if (communityMatch) {
    if (typeof communityMatch === "string") {
      try {
        match = JSON.parse(communityMatch);
      } catch {
      }
    } else {
      match = communityMatch;
    }
  }

  // No match found
  if (!match || !match.found) return null;

  const jurisdictionName = getStateName(jurisdiction);
  const isExact = match.match_type === "exact";
  const isSemantic = match.match_type === "semantic";
  const isFuzzy = match.match_type === "fuzzy";
  const isSerial = match.occurrence_count >= 10;

  // Match type config mapped to Bright Vibrant Shield Tokens
  const matchConfig = isExact
    ? {
        icon: <Fingerprint className="w-3.5 h-3.5" />,
        label: "Exact DNA Match",
        color: "bg-indigo-100 text-indigo-800 border-indigo-200",
      }
    : isSemantic
      ? {
          icon: <Brain className="w-3.5 h-3.5" />,
          label: "Semantic AI Match",
          color: "bg-purple-100 text-purple-800 border-purple-200",
        }
      : {
          icon: <Search className="w-3.5 h-3.5" />,
          label: "Similar Pattern",
          color: "bg-amber-100 text-amber-800 border-amber-200",
        };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-5 rounded-2xl bg-indigo-50 border border-indigo-200 border-l-4 border-l-indigo-600 shadow-sm dark:shadow-slate-900/20 relative overflow-hidden group"
    >
      {/* Decorative gradient flare */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />

      <div className="flex items-start gap-4 relative z-10">
        <div className="p-3 rounded-xl bg-indigo-100/80 flex-shrink-0 shadow-sm dark:shadow-slate-900/20 border border-indigo-200">
          <Users className="w-5 h-5 text-indigo-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Title + Match Type Badge */}
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h4 className="text-sm font-black text-indigo-900 flex items-center gap-1.5 uppercase tracking-wide">
              Community Intelligence
            </h4>
            <Badge
              variant="outline"
              className={`text-[10px] font-black uppercase tracking-widest gap-1 shadow-sm dark:shadow-slate-900/20 ${matchConfig.color}`}
            >
              {matchConfig.icon}
              {matchConfig.label}
            </Badge>
          </div>

          {/* Main message */}
          <p className="text-sm font-medium text-slate-700 leading-relaxed bg-white dark:bg-card/50 p-3 rounded-xl border border-indigo-100 shadow-sm dark:shadow-slate-900/20 mb-3">
            {isExact && (
              <>
                This <strong>exact predatory clause pattern</strong> has been algorithmically fingerprinted in <strong className="text-indigo-700 font-extrabold bg-indigo-100 px-1 rounded">{match.occurrence_count}</strong> other contracts
                {jurisdictionName && (
                  <>
                    {" "}
                    registered in{" "}
                    <span className="inline-flex items-center gap-1 font-bold">
                      <MapPin className="w-3 h-3 inline text-indigo-500" />
                      {jurisdictionName}
                    </span>
                  </>
                )}
                . High probability of standardized exploitation.
              </>
            )}
            {isSemantic && (
              <>
                This clause is <strong>semantically structurally identical</strong> to <strong className="text-purple-700 font-extrabold bg-purple-100 px-1 rounded">{match.semantic_stats?.total_similar_patterns || 1}</strong> predatory variations found across <strong className="text-indigo-700 font-extrabold bg-indigo-100 px-1 rounded">{match.occurrence_count}</strong> community flagged contracts.
              </>
            )}
            {isFuzzy && (
              <>
                A <strong>highly similar exclusionary pattern</strong> has been officially reported in <strong className="text-amber-700 font-extrabold bg-amber-100 px-1 rounded">{match.occurrence_count}</strong> active contracts within our database.
              </>
            )}
          </p>

          {/* Semantic stats — illegal/dangerous percentage */}
          {isSemantic && match.semantic_stats && (
            <div className="mb-3 flex flex-wrap gap-2">
              {match.semantic_stats.illegal_percentage > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-black uppercase border-purple-300 bg-purple-50 text-purple-700 tracking-wider"
                >
                  ⛔ {match.semantic_stats.illegal_percentage}% flagged illegal
                </Badge>
              )}
              {match.semantic_stats.dangerous_percentage > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-black uppercase border-rose-300 bg-rose-50 text-rose-700 tracking-wider"
                >
                  🔴 {match.semantic_stats.dangerous_percentage}% flagged dangerous
                </Badge>
              )}
            </div>
          )}

          {/* Progress bar showing match rate (indigo fill) */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-500 flex items-center gap-1">
                 <Brain className="w-3 h-3" /> Pattern Similarity Rate
              </span>
              <span className="text-xs font-black text-indigo-700">{match.match_percentage || 100}%</span>
            </div>
            <div className="h-2 w-full bg-indigo-200/50 rounded-full overflow-hidden border border-indigo-200">
               <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${match.match_percentage || 100}%` }} />
            </div>
          </div>

          {/* Serial predator warning */}
          {isSerial && (
            <div className="mb-3 flex items-start gap-2 text-xs text-rose-700 bg-rose-100 border border-rose-200 p-2.5 rounded-lg shadow-sm dark:shadow-slate-900/20 font-bold">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>WARNING: Exceptionally high occurrence rate detected. This indicates a standardized boilerplate clause used for mass exploitation.</span>
            </div>
          )}

          {/* Interactive Stats row */}
          <div className="flex flex-wrap items-center gap-3 mt-1 pt-3 border-t border-indigo-200/50 text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 bg-white dark:bg-card px-2 py-1 rounded shadow-sm dark:shadow-slate-900/20 border border-indigo-100 text-indigo-700">
              <Users className="w-3.5 h-3.5" />
              {match.occurrence_count}× Verified Reports
            </span>
            {match.first_seen_at && (
              <span className="flex items-center gap-1.5 bg-white dark:bg-card px-2 py-1 rounded shadow-sm dark:shadow-slate-900/20 border border-indigo-100 text-indigo-700">
                <Clock className="w-3.5 h-3.5" />
                Tracked Since{" "}
                {new Date(match.first_seen_at).toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
            {match.common_legal_issue && (
              <span className="text-xs text-indigo-800/80 normal-case tracking-normal italic ml-auto mr-1 flex items-center gap-1">
                 <TrendingUp className="w-3 h-3" /> Core issue: {match.common_legal_issue}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}