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
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-none border-b-4 border-black">
        {TABS.map((tab) => {
          const count = getTabCount(tab.id);
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-6 py-3 font-black uppercase tracking-widest text-xs border-4 border-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none ${
                isActive
                  ? "bg-indigo-500 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-y-[-2px]"
                  : "bg-white text-black dark:bg-zinc-900 dark:text-white"
              }`}
            >
              <Icon className="w-5 h-5 stroke-[3px]" />
              {tab.label}
              {count > 0 && (
                <Badge
                  className={`text-[10px] px-2 py-0.5 border-2 border-black rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                    isActive
                      ? "bg-white text-black"
                      : "bg-indigo-100 dark:bg-indigo-900 text-black dark:text-white"
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
