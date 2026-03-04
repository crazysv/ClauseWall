"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, AlertTriangle, MapPin, Clock, TrendingUp } from "lucide-react";
import type { CommunityMatch } from "@/types";
import { getStateName } from "@/lib/utils/constants";

interface CommunityInsightProps {
  clauseId: string;
  clauseText: string;
  clauseType: string;
  jurisdiction: string;
  riskLevel: string;
}

export default function CommunityInsight({
  clauseId,
  clauseText,
  clauseType,
  jurisdiction,
  riskLevel,
}: CommunityInsightProps) {
  const [match, setMatch] = useState<CommunityMatch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (riskLevel !== "dangerous" && riskLevel !== "illegal") {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function checkCommunity() {
      try {
        const res = await fetch("/api/community/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clauseText, clauseType }),
        });

        if (res.ok && !cancelled) {
          const data = await res.json();
          if (data.match) setMatch(data.match);
        }
      } catch (err) {
        console.error("Community check failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkCommunity();
    return () => { cancelled = true; };
  }, [clauseId, clauseText, clauseType, riskLevel]);

  // Don't render for safe/warning
  if (riskLevel !== "dangerous" && riskLevel !== "illegal") return null;

  // Loading
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
        <div className="w-3 h-3 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        Checking community patterns...
      </div>
    );
  }

  // No match
  if (!match) return null;

  const jurisdictionName = getStateName(jurisdiction);
  const isExact = match.match_percentage === 100;
  const isSerial = match.occurrence_count >= 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 p-4 rounded-lg bg-orange-500/5 border border-orange-500/20"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-orange-500/10 flex-shrink-0">
          <Users className="w-4 h-4 text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-sm font-medium text-orange-400 mb-1.5 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Community Pattern Detected
          </p>

          {/* Main message */}
          <p className="text-sm text-gray-300 leading-relaxed">
            {isExact ? (
              <>
                This <strong>exact clause pattern</strong> has been found in{" "}
                <strong className="text-orange-400">
                  {match.occurrence_count}
                </strong>{" "}
                other contracts
                {jurisdictionName && (
                  <>
                    {" "}in{" "}
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 inline" />
                      {jurisdictionName}
                    </span>
                  </>
                )}
                .
              </>
            ) : (
              <>
                A <strong>similar clause pattern</strong> has been reported in{" "}
                <strong className="text-orange-400">
                  {match.occurrence_count}
                </strong>{" "}
                other contracts.
              </>
            )}
          </p>

          {/* Serial predator warning */}
          {isSerial && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              Frequently seen predatory pattern — high alert
            </div>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mt-2.5 text-xs text-gray-500">
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
            {!isExact && (
              <span className="flex items-center gap-1 text-orange-400/60">
                ~{match.match_percentage}% match
              </span>
            )}
          </div>

          {/* Legal issue */}
          {match.common_legal_issue && (
            <p className="text-xs text-orange-300/70 mt-2 italic">
              Common issue: {match.common_legal_issue}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}