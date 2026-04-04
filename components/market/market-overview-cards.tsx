"use client";

import { motion } from "framer-motion";
import {
  FileText,
  MapPin,
  Building2,
  BarChart3,
  TrendingUp,
  Database,
} from "lucide-react";
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
    color: "text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-950",
    borderColor: "border-cyan-500/15",
  },
  {
    key: "jurisdictions_covered",
    label: "States Covered",
    icon: MapPin,
    color: "text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950",
    borderColor: "border-green-500/15",
  },
  {
    key: "entities_tracked",
    label: "Entities Tracked",
    icon: Building2,
    color: "text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950",
    borderColor: "border-purple-500/15",
  },
  {
    key: "benchmarks_computed",
    label: "Benchmarks",
    icon: BarChart3,
    color: "text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950",
    borderColor: "border-amber-500/15",
  },
  {
    key: "contract_types_covered",
    label: "Contract Types",
    icon: Database,
    color: "text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    borderColor: "border-blue-500/15",
  },
  {
    key: "trends_detected",
    label: "Trends Detected",
    icon: TrendingUp,
    color: "text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950",
    borderColor: "border-rose-500/15",
  },
];

export default function MarketOverviewCards({
  stats,
}: MarketOverviewCardsProps) {
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
            <Card
              className={`bg-background ${card.bgColor} ${card.borderColor} h-full`}
            >
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`p-2 rounded-none bg-muted mb-2`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {value.toLocaleString()}
                </p>
                <p className="text-[10px] text-foreground mt-0.5">
                  {card.label}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
