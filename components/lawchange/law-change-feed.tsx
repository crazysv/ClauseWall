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
import LawChangeSummaryCard from "./law-change-summary-card";
import LawChangeCard from "./law-change-card";
import ImpactCard from "./impact-card";
import PendingChangeCard from "./pending-change-card";

type TabKey = "affecting" | "all" | "pending";

export default function LawChangeFeed() {
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
    } catch (err) {
      console.error("[LawChangeFeed] Fetch failed:", err);
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
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-2xl" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-lg" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
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
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.key
                  ? "bg-indigo-500/15 text-indigo-300"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key
                      ? "bg-indigo-500/30 text-indigo-200"
                      : "bg-white/5 text-white/30"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2 text-white/40 hover:text-white/60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
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
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {["all", "indian_kanoon", "prs_legislative", "egazette", "rbi", "irdai", "trai"].map(
                (source) => (
                  <button
                    key={source}
                    onClick={() => setFilterSource(source)}
                    className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full border transition-colors ${
                      filterSource === source
                        ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
                        : "border-white/10 text-white/30 hover:text-white/50"
                    }`}
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
    <div className="flex flex-col items-center justify-center py-16">
      {icon}
      <h3 className="text-sm font-medium text-white/50 mt-4">{title}</h3>
      <p className="text-xs text-white/25 mt-1 max-w-sm text-center">
        {description}
      </p>
    </div>
  );
}
