"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  AlertCircle,
  Calendar,
  ChevronDown,
  ExternalLink,
  Shield,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RetroactiveAnalysis } from "@/types";

interface Props {
  documentId: string;
}

export default function RetroactiveBanner({ documentId }: Props) {
  const [analysis, setAnalysis] = useState<RetroactiveAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchRetroactive = async () => {
      try {
        const res = await fetch(`/api/lawchange/retroactive/${documentId}`);
        if (res.ok) {
          const data = await res.json();
          setAnalysis(data.analysis);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchRetroactive();
  }, [documentId]);

  if (loading || !analysis || analysis.total_changes === 0) return null;

  const hasNegativeImpact = analysis.rights_lost > 0;
  const hasPositiveImpact = analysis.rights_gained > 0;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mb-6"
    >
      <Card
        className={`relative overflow-hidden border ${hasNegativeImpact ? "border-red-500/20 bg-red-500/5" : hasPositiveImpact ? "border-green-500/20 bg-green-500/5" : "border-indigo-500/20 bg-indigo-500/5"}`}
      >
        <CardContent className="p-4 sm:p-5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-left"
          >
            <div className="flex items-center gap-3">
              <Scale
                className={`h-5 w-5 flex-shrink-0 ${hasNegativeImpact ? "text-red-400" : hasPositiveImpact ? "text-green-400" : "text-indigo-400"}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground/90">
                  ⚖️ {analysis.total_changes} law change
                  {analysis.total_changes !== 1 ? "s" : ""} since contract
                  signing
                </p>
                <p className="text-xs text-foreground/40 mt-0.5">
                  {analysis.summary}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {analysis.rights_gained > 0 && (
                  <Badge className="text-[10px] bg-green-500/15 text-green-400 border-0">
                    +{analysis.rights_gained} in your favor
                  </Badge>
                )}
                {analysis.rights_lost > 0 && (
                  <Badge className="text-[10px] bg-red-500/15 text-red-400 border-0">
                    {analysis.rights_lost} against you
                  </Badge>
                )}
                <ChevronDown
                  className={`h-4 w-4 text-foreground/20 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
              </div>
            </div>
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-foreground border-2 space-y-3">
                  {analysis.changes_since_signing.slice(0, 5).map((impact) => (
                    <div
                      key={impact.id}
                      className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.02] border border-foreground border-2"
                    >
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-indigo-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-foreground/50">
                          {impact.impact_description}
                        </p>
                        {impact.action_required && (
                          <p className="text-[10px] text-indigo-300/60 mt-1">
                            ✅ {impact.action_required}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {analysis.total_financial_impact > 0 && (
                    <p className="text-xs text-emerald-300/60">
                      💰 Potential financial impact: ₹
                      {analysis.total_financial_impact.toLocaleString("en-IN")}
                    </p>
                  )}

                  <Link
                    href="/lawchange"
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    View all law changes
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
