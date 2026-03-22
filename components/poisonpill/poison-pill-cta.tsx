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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PoisonPillAnalysisResult } from "@/types";

interface Props {
  documentId: string;
  poisonPillData: PoisonPillAnalysisResult | null;
  totalClauses: number;
}

export function PoisonPillCTA({ documentId, poisonPillData, totalClauses }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PoisonPillAnalysisResult | null>(poisonPillData);

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
      <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/10 h-full">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white">Scanning...</h4>
            <p className="text-xs text-white/40 mt-0.5">
              Detecting clause interconnection traps
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No data — CTA to run
  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <Card className="cursor-pointer hover:brightness-110 transition-all bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/10 h-full">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Network className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white">
                  Poison Pill Scanner
                </h4>
                <p className="text-xs text-white/40 mt-0.5">
                  Detect clause combos that create hidden traps
                </p>
              </div>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  runScan();
                }}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 gap-1"
              >
                Scan
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
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
        className="h-full"
      >
        <Card
          onClick={scrollToSection}
          className="cursor-pointer hover:brightness-110 transition-all bg-gradient-to-br from-purple-500/5 to-red-500/5 border-purple-500/15 h-full"
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <ShieldAlert className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white">
                  {data.traps.length} Hidden Trap{data.traps.length > 1 ? "s" : ""} Found
                </h4>
                <p className="text-xs text-white/40 mt-0.5">
                  Score: {data.combined_trap_score}/100 — {data.most_dangerous_trap?.trap_name}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/30 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Has data, no traps
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card className="bg-white/[0.02] border-white/10 h-full">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white">
                No Hidden Traps
              </h4>
              <p className="text-xs text-white/40 mt-0.5">
                All clause combinations checked — no traps detected
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
