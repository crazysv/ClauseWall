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
        <div className="bg-[#0a0a0a] border border-cyan-900/50 p-6 relative group overflow-hidden">
          {/* Subtle accent glow */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500 opacity-20 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="p-4 bg-cyan-950/20 border border-cyan-900/50 text-cyan-500">
              <FileStack className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-cyan-500 mb-1.5">
                [ CROSS-NODE_ANALYSIS_UNAVAILABLE ]
              </h3>
              <p className="text-xs font-mono uppercase tracking-widest text-neutral-400 leading-relaxed">
                INGESTED: {data.contract_count}/2. UPLOAD {" "}
                {2 - data.contract_count} OR MORE PAYLOADS TO INITIALIZE MULTI-CONTRACT VULNERABILITY SCAN.
              </p>
            </div>
            <Link href="/upload" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-6 h-10 flex items-center justify-center gap-2 border border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-[#050505] transition-colors font-mono text-[10px] uppercase tracking-widest">
                INITIALIZE_UPLOAD <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
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
          <div
            className={`group cursor-pointer p-6 relative overflow-hidden transition-all bg-[#0a0a0a] border ${
              isHighRisk
                ? "border-red-900/50 hover:bg-red-950/10"
                : "border-cyan-900/50 hover:bg-cyan-950/10"
            }`}
          >
            {/* Subtle accent glow */}
            <div className={`absolute top-0 left-0 w-full h-[1px] opacity-20 group-hover:opacity-100 transition-opacity ${isHighRisk ? "bg-red-500" : "bg-cyan-500"}`} />

            <div className="flex items-center gap-6">
              <div
                className={`p-4 border ${
                  isHighRisk ? "bg-red-950/20 border-red-900/50 text-red-500" : "bg-cyan-950/20 border-cyan-900/50 text-cyan-500"
                } flex-shrink-0`}
              >
                {isHighRisk ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <ShieldCheck className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className={`text-[10px] font-mono uppercase tracking-widest ${isHighRisk ? 'text-red-500' : 'text-cyan-500'}`}>
                    [ VAULT_ANALYSIS_REPORT ]
                  </h3>
                  {data.is_stale && (
                    <span className="text-[8px] font-mono uppercase tracking-widest border border-amber-500/50 bg-amber-500/10 text-amber-500 px-1.5 py-0.5">
                      STALE_DATA
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs font-mono uppercase tracking-widest leading-relaxed truncate ${isHighRisk ? "text-red-400/80" : "text-cyan-400/80"}`}
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
                    "ALL CLEAR - NO CRITICAL FAILURES DETECTED"}
                </p>
              </div>
              <div className="hidden sm:flex p-3 items-center justify-center border border-neutral-800 bg-neutral-900/50 text-neutral-400 group-hover:text-white transition-colors">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // No analysis yet — prompt to run
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Link href="/vault">
        <div className="group cursor-pointer p-6 bg-[#0a0a0a] border border-emerald-900/50 hover:bg-emerald-950/10 transition-all relative overflow-hidden">
          {/* Subtle accent glow */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center gap-6">
            <div className="p-4 border border-emerald-900/50 bg-emerald-950/20 text-emerald-500 flex-shrink-0">
              <FileStack className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 mb-2">
                [ INIT_VAULT_ANALYSIS ]
              </h3>
              <p className="text-xs font-mono uppercase tracking-widest text-neutral-400 leading-relaxed">
                VAULT CONTAINS{" "}
                <span className="text-emerald-400 font-bold">
                  {data.contract_count}
                </span>{" "}
                PAYLOADS. EXECUTE CROSS-CONTRACT SCAN TO DETECT CONFLICTS AND COVERAGE GAPS.
              </p>
            </div>
            <div className="hidden sm:flex p-3 items-center justify-center border border-neutral-800 bg-neutral-900/50 text-neutral-400 group-hover:text-emerald-400 transition-colors">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
