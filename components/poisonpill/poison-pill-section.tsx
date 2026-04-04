"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldAlert,
  RefreshCcw,
  Loader2,
  Network,
  Target,
  LayoutList,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PoisonPillAnalysisResult } from "@/types";
import { TrapSummaryBar } from "./trap-summary-bar";
import { TrapCard } from "./trap-card";
import { InterconnectionMap } from "./interconnection-map";
import { NegotiationRoadmap } from "./negotiation-roadmap";

interface Props {
  documentId: string;
  poisonPillData: PoisonPillAnalysisResult | null;
}

type TabView = "traps" | "map" | "roadmap";

export function PoisonPillSection({
  documentId,
  poisonPillData: initialData,
}: Props) {
  const [data, setData] = useState<PoisonPillAnalysisResult | null>(
    initialData,
  );
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabView>("traps");
  const [expandedTrapId, setExpandedTrapId] = useState<string | null>(null);
  const [selectedTrapId, setSelectedTrapId] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/poisonpill/${documentId}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const reanalyze = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/poisonpill/reanalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: documentId }),
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card className="bg-white/[0.02] border-foreground border-2">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-sm text-foreground">
            Analyzing clause interconnections...
          </p>
          <p className="text-xs text-foreground mt-1">
            Pre-screening patterns → Deep analysis → Building graph...
          </p>
        </CardContent>
      </Card>
    );
  }

  // No data — show CTA
  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-background border-purple-500/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-none bg-purple-500/10">
                <Network className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Poison Pill Scanner
                </h3>
                <p className="text-xs text-foreground mt-0.5">
                  Detect hidden traps — clause combinations that look safe
                  individually but create devastating effects together.
                </p>
              </div>
              <Button
                onClick={runAnalysis}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 gap-2"
              >
                Scan Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Has data but no traps
  if (data.traps.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-white/[0.02] border-foreground border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-none bg-green-500/10">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">
                  No Hidden Traps Found
                </h3>
                <p className="text-xs text-foreground mt-0.5">
                  All clause combinations checked — no synergistic risks
                  detected.
                </p>
              </div>
              <Button
                onClick={reanalyze}
                variant="ghost"
                size="sm"
                className="text-foreground hover:text-foreground gap-1"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Re-scan
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Has data with traps — full view
  const tabs: { id: TabView; label: string; icon: React.ReactNode }[] = [
    {
      id: "traps",
      label: "Trap Cards",
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
    },
    {
      id: "map",
      label: "Interconnection Map",
      icon: <Network className="w-3.5 h-3.5" />,
    },
    {
      id: "roadmap",
      label: "Negotiation Roadmap",
      icon: <Target className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-none bg-purple-500/10">
            <ShieldAlert className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Poison Pill Interconnection Analysis
            </h2>
            <p className="text-xs text-foreground">
              {data.traps.length} hidden trap
              {data.traps.length !== 1 ? "s" : ""} detected
            </p>
          </div>
        </div>
        <Button
          onClick={reanalyze}
          variant="ghost"
          size="sm"
          className="text-foreground hover:text-foreground gap-1"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Re-scan
        </Button>
      </div>

      {/* Summary Bar */}
      <TrapSummaryBar result={data} />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-none border border-foreground border-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium transition-all ${activeTab === tab.id ? "bg-purple-500/15 text-purple-300 border border-purple-500/20" : "text-foreground hover:text-foreground border border-transparent"}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "traps" && (
          <motion.div
            key="traps"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {data.traps.map((trap, i) => (
              <motion.div
                key={trap.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <TrapCard
                  trap={trap}
                  isExpanded={expandedTrapId === trap.id}
                  onToggle={() =>
                    setExpandedTrapId(
                      expandedTrapId === trap.id ? null : trap.id,
                    )
                  }
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === "map" && (
          <motion.div
            key="map"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <InterconnectionMap
              graph={data.graph}
              traps={data.traps}
              selectedTrapId={selectedTrapId}
              onTrapSelect={setSelectedTrapId}
            />
          </motion.div>
        )}

        {activeTab === "roadmap" && (
          <motion.div
            key="roadmap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <NegotiationRoadmap
              roadmap={data.negotiation_roadmap}
              traps={data.traps}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
