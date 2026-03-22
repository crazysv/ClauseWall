"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, ShieldOff, GitBranch, IndianRupee, ListChecks, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
      case "conflicts": return analysis.conflicts.length;
      case "gaps": return analysis.coverage_gaps.length;
      case "cascades": return analysis.cascading_failures.length;
      case "finances": return analysis.financial_exposure.by_contract.length;
      case "obligations": return analysis.unified_obligations.length;
      case "whatif": return analysis.what_if_results.length;
      default: return 0;
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
      <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
        {TABS.map((tab) => {
          const count = getTabCount(tab.id);
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                  : "bg-white/[0.03] text-white/50 border border-white/5 hover:bg-white/[0.06] hover:text-white/70"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {count > 0 && (
                <Badge
                  className={`text-[10px] px-1.5 py-0 ${
                    isActive
                      ? "bg-indigo-500/25 text-indigo-300"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {count}
                </Badge>
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
