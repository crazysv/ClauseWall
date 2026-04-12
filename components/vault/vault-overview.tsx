"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  ShieldOff,
  GitBranch,
  IndianRupee,
  ListChecks,
  Zap,
} from "lucide-react";
import type { VaultAnalysisResult } from "@/types";
import { getVaultSummaryStats } from "@/lib/vault/vault-scorer";
import VaultSummaryCard from "./vault-summary-card";
import ConflictList from "./conflict-list";
import GapsList from "./gaps-list";
import CascadesList from "./cascades-list";
import ExposureDashboard from "./exposure-dashboard";
import ObligationsList from "./obligations-list";
import WhatIfPanel from "./whatif-panel";

interface VaultOverviewProps {
  analysis: VaultAnalysisResult;
}

const TABS = [
  { id: "conflicts", label: "Conflicts", icon: AlertTriangle },
  { id: "gaps", label: "Gaps", icon: ShieldOff },
  { id: "cascades", label: "Cascades", icon: GitBranch },
  { id: "finances", label: "Finances", icon: IndianRupee },
  { id: "obligations", label: "Obligations", icon: ListChecks },
  { id: "whatif", label: "What-If", icon: Zap },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function VaultOverview({ analysis }: VaultOverviewProps) {
  const stats = getVaultSummaryStats(analysis);

  // Default to conflicts tab if conflicts exist, otherwise first tab with content
  const defaultTab: TabId =
    analysis.conflicts.length > 0
      ? "conflicts"
      : analysis.coverage_gaps.length > 0
        ? "gaps"
        : analysis.cascading_failures.length > 0
          ? "cascades"
          : "conflicts";

  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

  const getTabCount = (tabId: TabId): number => {
    switch (tabId) {
      case "conflicts":
        return analysis.conflicts.length;
      case "gaps":
        return analysis.coverage_gaps.length;
      case "cascades":
        return analysis.cascading_failures.length;
      case "finances":
        return analysis.financial_exposure.by_contract.length;
      case "obligations":
        return analysis.unified_obligations.length;
      case "whatif":
        return analysis.what_if_results.length;
      default:
        return 0;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "conflicts":
        return <ConflictList conflicts={analysis.conflicts} />;
      case "gaps":
        return <GapsList gaps={analysis.coverage_gaps} />;
      case "cascades":
        return <CascadesList cascades={analysis.cascading_failures} />;
      case "finances":
        return <ExposureDashboard exposure={analysis.financial_exposure} />;
      case "obligations":
        return <ObligationsList obligations={analysis.unified_obligations} />;
      case "whatif":
        return (
          <WhatIfPanel
            existingResults={analysis.what_if_results}
            documentIds={analysis.document_ids}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <VaultSummaryCard stats={stats} />

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-none border-b border-neutral-900">
        {TABS.map((tab) => {
          const count = getTabCount(tab.id);
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 font-mono uppercase tracking-widest text-[9px] border transition-colors whitespace-nowrap ${
                isActive
                  ? "border-cyan-900/50 bg-cyan-950/20 text-cyan-400"
                  : "border-neutral-900 bg-[#050505] text-neutral-500 hover:text-neutral-300 hover:border-neutral-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {count > 0 && (
                <span
                  className={`text-[8px] px-1.5 py-0.5 border font-mono ${
                    isActive
                      ? "border-cyan-800 text-cyan-300 bg-cyan-950/30"
                      : "border-neutral-800 text-neutral-600 bg-neutral-950"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
