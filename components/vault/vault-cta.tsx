"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Loader2,
  FileStack,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LatestVaultData {
  analysis: {
    risk_score: number;
    risk_summary: string;
    conflicts: unknown[];
    coverage_gaps: unknown[];
    cascading_failures: unknown[];
  } | null;
  is_stale: boolean;
  has_enough_contracts: boolean;
  contract_count: number;
}

export function VaultCTA() {
  const [data, setData] = useState<LatestVaultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch("/api/vault/latest");
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // Silent fail — CTA just won't show
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  if (loading) return null;
  if (!data) return null;

  // Not enough contracts
  if (!data.has_enough_contracts) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-4 border-black bg-indigo-50 dark:bg-indigo-950/20 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="p-4 border-4 border-black bg-white dark:bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <FileStack className="w-8 h-8 text-black dark:text-white stroke-[3px]" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
                  CONTRACT VAULT
                </h3>
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mt-2 leading-relaxed">
                  ANALYZE {data.contract_count}/2 CONTRACTS UPLOADED. UPLOAD{" "}
                  {2 - data.contract_count} MORE TO UNLOCK CROSS-CONTRACT
                  ANALYSIS.
                </p>
              </div>
              <Link href="/upload" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto border-4 border-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all font-black uppercase tracking-widest rounded-none h-12">
                  UPLOAD <ArrowRight className="w-5 h-5 ml-2 stroke-[3px]" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Has analysis results
  if (data.analysis) {
    const riskScore = data.analysis.risk_score;
    const isHighRisk = riskScore > 50;
    const conflictCount = data.analysis.conflicts?.length || 0;
    const gapCount = data.analysis.coverage_gaps?.length || 0;
    const cascadeCount = data.analysis.cascading_failures?.length || 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link href="/vault">
          <Card
            className={`cursor-pointer hover:-translate-y-2 hover:shadow-none transition-all border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${
              isHighRisk
                ? "bg-red-50 dark:bg-red-950/20"
                : "bg-indigo-50 dark:bg-indigo-950/20"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div
                  className={`p-4 border-4 border-black bg-white dark:bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-shrink-0`}
                >
                  {isHighRisk ? (
                    <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500 stroke-[3px]" />
                  ) : (
                    <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-500 stroke-[3px]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
                      CONTRACT VAULT
                    </h3>
                    {data.is_stale && (
                      <span className="text-[10px] font-black uppercase tracking-widest border-2 border-yellow-500 bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(234,179,8,1)]">
                        STALE
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm font-bold uppercase tracking-widest leading-relaxed line-clamp-2 ${isHighRisk ? "text-red-900/60 dark:text-red-200/60" : "text-indigo-900/60 dark:text-indigo-200/60"}`}
                  >
                    {conflictCount > 0 &&
                      `${conflictCount} CONFLICT${conflictCount > 1 ? "S" : ""}`}
                    {conflictCount > 0 && gapCount > 0 && " · "}
                    {gapCount > 0 &&
                      `${gapCount} GAP${gapCount > 1 ? "S" : ""}`}
                    {(conflictCount > 0 || gapCount > 0) &&
                      cascadeCount > 0 &&
                      " · "}
                    {cascadeCount > 0 &&
                      `${cascadeCount} CASCADE${cascadeCount > 1 ? "S" : ""}`}
                    {conflictCount === 0 &&
                      gapCount === 0 &&
                      cascadeCount === 0 &&
                      "ALL CLEAR - NO CRITICAL ISSUES"}
                  </p>
                </div>
                <div className="p-3 border-4 border-black bg-white dark:bg-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hidden sm:block">
                  <ArrowRight className="w-6 h-6 text-black dark:text-white stroke-[3px]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    );
  }

  // No analysis yet — prompt to run
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Link href="/vault">
        <Card className="cursor-pointer hover:-translate-y-2 hover:shadow-none transition-all bg-indigo-50 dark:bg-indigo-950/20 border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="p-4 border-4 border-black bg-white dark:bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                <FileStack className="w-8 h-8 text-black dark:text-white stroke-[3px]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-black uppercase tracking-widest text-foreground mb-2">
                  CONTRACT VAULT
                </h3>
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground leading-relaxed">
                  YOU HAVE{" "}
                  <span className="text-indigo-600 dark:text-indigo-400 font-black">
                    {data.contract_count}
                  </span>{" "}
                  CONTRACTS. RUN A CROSS-CONTRACT ANALYSIS TO FIND CONFLICTS,
                  GAPS, AND HIDDEN RISKS.
                </p>
              </div>
              <div className="p-3 border-4 border-black bg-white dark:bg-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hidden sm:block">
                <ArrowRight className="w-6 h-6 text-black dark:text-white stroke-[3px]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
