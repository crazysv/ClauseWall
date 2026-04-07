"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Network,
  ShieldAlert,
  Shield,
  ArrowRight,
  Loader2,
} from "lucide-react";
import type { PoisonPillAnalysisResult } from "@/types";

interface Props {
  documentId: string;
  poisonPillData: PoisonPillAnalysisResult | null;
  totalClauses: number;
}

export function PoisonPillCTA({
  documentId,
  poisonPillData,
  totalClauses,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PoisonPillAnalysisResult | null>(
    poisonPillData,
  );

  const runScan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/poisonpill/${documentId}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  };

  // Too few clauses
  if (totalClauses < 3) {
    return null;
  }

  // Loading
  if (loading) {
    return (
      <div className="px-3 py-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center gap-3">
        <Loader2 className="w-4 h-4 text-purple-400 animate-spin flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-purple-400">Scanning...</p>
          <p className="text-[10px] text-[#a3a3a3] mt-0.5">
            Detecting clause interconnection traps
          </p>
        </div>
      </div>
    );
  }

  // No data — CTA to run
  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={runScan}
          className="w-full px-3 py-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center gap-3 cursor-pointer hover:bg-purple-500/15 transition-colors text-left"
        >
          <Network className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-purple-400">
              Poison Pill Scanner
            </p>
            <p className="text-[10px] text-[#a3a3a3] mt-0.5">
              Detect clause combos that create hidden traps
            </p>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
        </button>
      </motion.div>
    );
  }

  // Has data with traps
  if (data.traps.length > 0) {
    const scrollToSection = () => {
      const el = document.getElementById("poison-pill-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={scrollToSection}
          className="w-full px-3 py-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center gap-3 cursor-pointer hover:bg-purple-500/15 transition-colors text-left"
        >
          <ShieldAlert className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-purple-400">
              {data.traps.length} Hidden Trap{data.traps.length > 1 ? "s" : ""} Found
            </p>
            <p className="text-[10px] text-[#a3a3a3] mt-0.5">
              Score: {data.combined_trap_score}/100 —{" "}
              {data.most_dangerous_trap?.trap_name}
            </p>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
        </button>
      </motion.div>
    );
  }

  // Has data, no traps
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3">
        <Shield className="w-4 h-4 text-green-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-green-500">
            No Hidden Traps
          </p>
          <p className="text-[10px] text-[#a3a3a3] mt-0.5">
            All clause combinations checked — no traps detected
          </p>
        </div>
      </div>
    </motion.div>
  );
}
