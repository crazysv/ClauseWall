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

export function RetroactiveBanner({ documentId }: Props) {
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
        className={`relative overflow-hidden border shadow-sm dark:shadow-slate-900/20 rounded-xl transition-all ${ hasNegativeImpact ? "border-red-200 bg-red-50 hover:border-red-300" : hasPositiveImpact ? "border-emerald-200 bg-emerald-50 hover:border-emerald-300" : "border-indigo-200 bg-indigo-50 hover:border-indigo-300" }`}
      >
        <CardContent className="p-4 sm:p-5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-left focus:outline-none"
          >
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg shrink-0 shadow-inner bg-white dark:bg-card border border-current/10 ${ hasNegativeImpact ? "text-red-500" : hasPositiveImpact ? "text-emerald-500" : "text-indigo-500" }`}>
                <Scale
                  className="h-5 w-5"
                />
              </div>
              <div className="flex-1 min-w-0 pr-4 mt-0.5">
                <p className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
                  ⚖️ {analysis.total_changes} law change
                  {analysis.total_changes !== 1 ? "s" : ""} since contract
                  signing
                </p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {analysis.summary}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0 mt-0.5">
                <div className="flex gap-2">
                  {analysis.rights_gained > 0 && (
                    <Badge className="text-[10px] font-bold uppercase tracking-widest bg-emerald-100/80 text-emerald-700 border-none shadow-sm dark:shadow-slate-900/20 px-2 py-0.5 rounded-md">
                      +{analysis.rights_gained} in your favor
                    </Badge>
                  )}
                  {analysis.rights_lost > 0 && (
                    <Badge className="text-[10px] font-bold uppercase tracking-widest bg-red-100/80 text-red-700 border-none shadow-sm dark:shadow-slate-900/20 px-2 py-0.5 rounded-md">
                      {analysis.rights_lost} against you
                    </Badge>
                  )}
                </div>
                <div className={`p-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-card transition-transform mt-1 shadow-sm dark:shadow-slate-900/20 ${ expanded ? "rotate-180 bg-slate-100" : "" }`}>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>
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
                <div className="mt-5 pt-5 border-t border-current/10 space-y-4">
                  {analysis.changes_since_signing.slice(0, 5).map((impact) => (
                    <div
                      key={impact.id}
                      className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-card border border-current/10 shadow-sm dark:shadow-slate-900/20"
                    >
                      <AlertCircle className="h-4 w-4 mt-0.5 text-indigo-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 leading-relaxed mb-2">
                          {impact.impact_description}
                        </p>
                        {impact.action_required && (
                          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-sm dark:shadow-slate-900/20 mt-1">
                            <span className="text-sm leading-none drop-shadow-sm dark:shadow-slate-900/20">✅</span> {impact.action_required}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {analysis.total_financial_impact > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-100/50 border border-emerald-200 rounded-lg shadow-sm dark:shadow-slate-900/20">
                      <p className="text-sm font-bold text-emerald-800 tracking-tight">
                        💰 Potential financial impact: ₹
                        {analysis.total_financial_impact.toLocaleString("en-IN")}
                      </p>
                    </div>
                  )}

                  <Link
                    href="/lawchange"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-white dark:bg-card hover:bg-indigo-50 dark:hover:bg-indigo-950/30 px-4 py-2.5 rounded-xl border border-indigo-200 shadow-sm dark:shadow-slate-900/20 mt-2"
                  >
                    View Timeline
                    <ExternalLink className="h-4 w-4" />
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
