"use client";

import { motion } from "framer-motion";
import { FileText, MapPin, Building2, BarChart3, TrendingUp, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PlatformStats } from "@/types/market";

interface MarketOverviewCardsProps {
  stats: PlatformStats;
}

const statCards = [
  {
    key: "total_analyzed",
    label: "Contracts Analyzed",
    icon: FileText,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-400",
  },
  {
    key: "jurisdictions_covered",
    label: "States Covered",
    icon: MapPin,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-400",
  },
  {
    key: "entities_tracked",
    label: "Entities Tracked",
    icon: Building2,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-400",
  },
  {
    key: "benchmarks_computed",
    label: "Benchmarks",
    icon: BarChart3,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-400",
  },
  {
    key: "contract_types_covered",
    label: "Contract Types",
    icon: Database,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-400",
  },
  {
    key: "trends_detected",
    label: "Trends Detected",
    icon: TrendingUp,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-400",
  },
];

export function MarketOverviewCards({ stats }: MarketOverviewCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        const value = (stats as any)[card.key] || 0;

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border-l-4 ${card.borderColor} border-y-slate-200 border-r-slate-200 h-full rounded-2xl`}>
              <CardContent className="p-5 flex flex-col items-center text-center">
                <div className={`p-2.5 rounded-xl ${card.bgColor} mb-3`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <p className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {value.toLocaleString()}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">{card.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
