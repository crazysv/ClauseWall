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
  communityMatch?: CommunityMatch | string | null; // NEW: Pre-stored match data
}

export default function CommunityInsight({
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
        console.error("Failed to parse community_match JSON");
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

  // Match type config
  const matchConfig = isExact
    ? {
        icon: <Fingerprint className="w-3.5 h-3.5" />,
        label: "EXACT MATCH",
        color: "bg-background text-orange-600 border-orange-600",
      }
    : isSemantic
      ? {
          icon: <Brain className="w-3.5 h-3.5" />,
          label: "SEMANTIC MATCH",
          color: "bg-background text-purple-600 border-purple-600",
        }
      : {
          icon: <Search className="w-3.5 h-3.5" />,
          label: "SIMILAR PATTERN",
          color: "bg-background text-yellow-600 border-yellow-600",
        };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 p-4 card-impact border-2 border-orange-600 bg-background"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 border-2 border-orange-600 bg-muted flex-shrink-0">
          <Users className="w-4 h-4 text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Title + Match Type Badge */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <p className="text-sm font-black uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Community Pattern Detected
            </p>
            <Badge
              variant="outline"
              className={`text-[10px] gap-1 font-black uppercase tracking-wider border-2 ${matchConfig.color}`}
            >
              {matchConfig.icon}
              {matchConfig.label}
            </Badge>
          </div>

          {/* Main message */}
          <p className="text-sm font-bold text-foreground leading-relaxed">
            {isExact && (
              <>
                This <strong>exact clause pattern</strong> has been found in{" "}
                <strong className="text-orange-600">
                  {match.occurrence_count}
                </strong>{" "}
                other contracts
                {jurisdictionName && (
                  <>
                    {" "}
                    in{" "}
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 inline" />
                      {jurisdictionName}
                    </span>
                  </>
                )}
                .
              </>
            )}
            {isSemantic && (
              <>
                This clause is <strong>semantically similar</strong> to{" "}
                <strong className="text-purple-600">
                  {match.semantic_stats?.total_similar_patterns || 1}
                </strong>{" "}
                patterns across{" "}
                <strong className="text-orange-600">
                  {match.occurrence_count}
                </strong>{" "}
                contracts.
                {match.match_percentage && (
                  <span className="text-purple-600">
                    {" "}
                    ({match.match_percentage}% similarity)
                  </span>
                )}
              </>
            )}
            {isFuzzy && (
              <>
                A <strong>similar clause pattern</strong> has been reported in{" "}
                <strong className="text-orange-600">
                  {match.occurrence_count}
                </strong>{" "}
                other contracts.
              </>
            )}
          </p>

          {/* Semantic stats — illegal/dangerous percentage */}
          {isSemantic && match.semantic_stats && (
            <div className="mt-2 flex flex-wrap gap-2">
              {match.semantic_stats.illegal_percentage > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-black uppercase tracking-wider border-2 border-purple-600 text-purple-600 bg-background"
                >
                  ⛔ {match.semantic_stats.illegal_percentage}% flagged illegal
                </Badge>
              )}
              {match.semantic_stats.dangerous_percentage > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-black uppercase tracking-wider border-2 border-red-600 text-red-600 bg-background"
                >
                  🔴 {match.semantic_stats.dangerous_percentage}% flagged
                  dangerous
                </Badge>
              )}
            </div>
          )}

          {/* Serial predator warning */}
          {isSerial && (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-red-600">
              <AlertTriangle className="w-3.5 h-3.5" />
              Frequently seen predatory pattern — high alert
            </div>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mt-2.5 text-xs font-bold text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {match.occurrence_count}× reported
            </span>
            {match.first_seen_at && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Since{" "}
                {new Date(match.first_seen_at).toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
            {isSemantic && (
              <span className="flex items-center gap-1 text-purple-600">
                <Brain className="w-3 h-3" />
                AI semantic match
              </span>
            )}
            {isFuzzy && (
              <span className="flex items-center gap-1 text-yellow-600">
                ~{match.match_percentage}% match
              </span>
            )}
          </div>

          {/* Legal issue */}
          {match.common_legal_issue && (
            <p className="text-xs font-bold text-orange-600 mt-2 italic uppercase tracking-wider">
              Common issue: {match.common_legal_issue}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
