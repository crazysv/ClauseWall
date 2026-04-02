"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  TrendingUp,
  AlertCircle,
  Bell,
  Clock,
  Filter,
  Check,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  LawChangeSummary,
  LawChange,
  LawChangeImpact,
  PendingLawChange,
} from "@/types";
import { LawChangeSummaryCard } from "./law-change-summary-card";
import { LawChangeCard } from "./law-change-card";
import { ImpactCard } from "./impact-card";
import { PendingChangeCard } from "./pending-change-card";

type TabKey = "affecting" | "all" | "pending";

export function LawChangeFeed() {
  const [activeTab, setActiveTab] = useState<TabKey>("affecting");
  const [summary, setSummary] = useState<LawChangeSummary | null>(null);
  const [impacts, setImpacts] = useState<(LawChangeImpact & { change: LawChange })[]>([]);
  const [allChanges, setAllChanges] = useState<LawChange[]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingLawChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterSource, setFilterSource] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, impactsRes, changesRes, pendingRes] = await Promise.all([
        fetch("/api/lawchange/summary"),
        fetch("/api/lawchange/impacts"),
        fetch("/api/lawchange/recent?days=30"),
        fetch("/api/lawchange/pending"),
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }

      if (impactsRes.ok) {
        const data = await impactsRes.json();
        setImpacts(data.impacts || []);
      }

      if (changesRes.ok) {
        const data = await changesRes.json();
        setAllChanges(data.changes || []);
      }

      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingChanges(data.pending || []);
      }
    } catch {
        // Silently handled
      } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleAcknowledge = async (impactId: string) => {
    try {
      const res = await fetch("/api/lawchange/impacts/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ impact_ids: [impactId] }),
      });

      if (res.ok) {
        setImpacts((prev) =>
          prev.map((i) =>
            i.id === impactId
              ? { ...i, user_acknowledged: true, acknowledged_at: new Date().toISOString() }
              : i
          )
        );
      }
    } catch {
      // Silently fail
    }
  };

  const filteredChanges =
    filterSource === "all"
      ? allChanges
      : allChanges.filter((c) => c.source === filterSource);

  const tabs = [
    {
      key: "affecting" as const,
      label: "Affecting You",
      count: impacts.filter((i) => !i.user_acknowledged).length,
    },
    { key: "all" as const, label: "All Changes", count: allChanges.length },
    {
      key: "pending" as const,
      label: "Pending",
      count: pendingChanges.length,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto">
        <Skeleton className="h-44 rounded-2xl bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-32 rounded-xl bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700" />
          ))}
        </div>
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      {summary && <LawChangeSummaryCard summary={summary} />}

      {/* Tabs + Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-inner">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-4 py-2.5 text-sm font-bold tracking-tight rounded-xl transition-all ${ activeTab === tab.key ? "bg-white dark:bg-card text-indigo-700 shadow-sm dark:shadow-slate-900/20 ring-1 ring-slate-200/50" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-2 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${ activeTab === tab.key ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600 dark:text-slate-400" }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 shadow-sm dark:shadow-slate-900/20 h-11 px-4 rounded-xl"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-indigo-500" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "affecting" && (
          <motion.div
            key="affecting"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {impacts.length === 0 ? (
              <EmptyState
                icon={<Check className="h-12 w-12 text-green-500/30" />}
                title="No impacts yet"
                description="Your contracts are not affected by any recent law changes. We'll notify you when something comes up."
              />
            ) : (
              impacts.map((impact, i) => (
                <motion.div
                  key={impact.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ImpactCard
                    impact={impact}
                    onAcknowledge={handleAcknowledge}
                  />
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "all" && (
          <motion.div
            key="all"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Source filter */}
            <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-thin">
              {["all", "indian_kanoon", "prs_legislative", "egazette", "rbi", "irdai", "trai"].map(
                (source) => (
                  <button
                    key={source}
                    onClick={() => setFilterSource(source)}
                    className={`flex-shrink-0 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full border-2 transition-all shadow-sm dark:shadow-slate-900/20 ${ filterSource === source ? "bg-indigo-600 border-indigo-700 text-white" : "bg-white dark:bg-card border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800" }`}
                  >
                    {source === "all"
                      ? "All Sources"
                      : source.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </button>
                )
              )}
            </div>

            {filteredChanges.length === 0 ? (
              <EmptyState
                icon={<Scale className="h-12 w-12 text-indigo-500/30" />}
                title="No changes found"
                description="No law changes match your current filters. Try adjusting or check back later."
              />
            ) : (
              filteredChanges.map((change, i) => (
                <motion.div
                  key={change.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <LawChangeCard change={change} />
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "pending" && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {pendingChanges.length === 0 ? (
              <EmptyState
                icon={<Clock className="h-12 w-12 text-blue-500/30" />}
                title="No pending changes"
                description="No upcoming law changes are being tracked at the moment."
              />
            ) : (
              pendingChanges.map((pending, i) => (
                <motion.div
                  key={pending.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <PendingChangeCard pending={pending} />
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 md:px-6 sm:px-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-inner max-w-4xl mx-auto mt-4">
      <div className="h-20 w-20 bg-white dark:bg-card border border-slate-100 shadow-sm dark:shadow-slate-900/20 rounded-3xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-2 mb-3 tracking-tight">{title}</h3>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md text-center leading-relaxed">
        {description}
      </p>
    </div>
  );
}
