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
        <Card className="bg-gradient-to-br from-indigo-500/5 to-violet-500/5 border border-indigo-500/10 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-500/10">
                <FileStack className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white">
                  Contract Vault
                </h3>
                <p className="text-xs text-white/40 mt-0.5">
                  Analyze {data.contract_count}/2 contracts uploaded. Upload{" "}
                  {2 - data.contract_count} more to unlock cross-contract analysis.
                </p>
              </div>
              <Link href="/upload">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                  Upload
                  <ArrowRight className="w-3.5 h-3.5" />
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
            className={`cursor-pointer hover:brightness-110 transition-all overflow-hidden ${
              isHighRisk
                ? "bg-gradient-to-br from-red-500/5 to-orange-500/5 border-red-500/15"
                : "bg-gradient-to-br from-indigo-500/5 to-violet-500/5 border-indigo-500/15"
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isHighRisk ? "bg-red-500/10" : "bg-indigo-500/10"}`}>
                  {isHighRisk ? (
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-indigo-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      Contract Vault
                    </h3>
                    {data.is_stale && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400">
                        Stale
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5 line-clamp-1">
                    {conflictCount > 0 && `${conflictCount} conflict${conflictCount > 1 ? "s" : ""}`}
                    {conflictCount > 0 && gapCount > 0 && " · "}
                    {gapCount > 0 && `${gapCount} gap${gapCount > 1 ? "s" : ""}`}
                    {(conflictCount > 0 || gapCount > 0) && cascadeCount > 0 && " · "}
                    {cascadeCount > 0 && `${cascadeCount} cascade${cascadeCount > 1 ? "s" : ""}`}
                    {conflictCount === 0 && gapCount === 0 && cascadeCount === 0 && "All clear"}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/30 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    );
  }

  // No analysis yet — prompt to run
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Link href="/vault">
        <Card className="cursor-pointer hover:brightness-110 transition-all bg-gradient-to-br from-indigo-500/5 to-violet-500/5 border border-indigo-500/10 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-500/10">
                <FileStack className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">
                  Contract Vault
                </h3>
                <p className="text-xs text-white/40 mt-0.5">
                  You have {data.contract_count} contracts. Run a cross-contract analysis to find
                  conflicts, gaps, and hidden risks.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/30 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
