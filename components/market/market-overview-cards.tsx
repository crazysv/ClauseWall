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
    bgColor: "from-cyan-500/10 to-blue-500/10",
    borderColor: "border-cyan-500/15",
  },
  {
    key: "jurisdictions_covered",
    label: "States Covered",
    icon: MapPin,
    color: "text-green-400",
    bgColor: "from-green-500/10 to-emerald-500/10",
    borderColor: "border-green-500/15",
  },
  {
    key: "entities_tracked",
    label: "Entities Tracked",
    icon: Building2,
    color: "text-purple-400",
    bgColor: "from-purple-500/10 to-pink-500/10",
    borderColor: "border-purple-500/15",
  },
  {
    key: "benchmarks_computed",
    label: "Benchmarks",
    icon: BarChart3,
    color: "text-amber-400",
    bgColor: "from-amber-500/10 to-orange-500/10",
    borderColor: "border-amber-500/15",
  },
  {
    key: "contract_types_covered",
    label: "Contract Types",
    icon: Database,
    color: "text-blue-400",
    bgColor: "from-blue-500/10 to-indigo-500/10",
    borderColor: "border-blue-500/15",
  },
  {
    key: "trends_detected",
    label: "Trends Detected",
    icon: TrendingUp,
    color: "text-rose-400",
    bgColor: "from-rose-500/10 to-red-500/10",
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
              className={`bg-gradient-to-br ${card.bgColor} ${card.borderColor} h-full`}
            >
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`p-2 rounded-lg bg-white/5 mb-2`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold text-white">
                  {value.toLocaleString()}
                </p>
                <p className="text-[10px] text-white/40 mt-0.5">{card.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
