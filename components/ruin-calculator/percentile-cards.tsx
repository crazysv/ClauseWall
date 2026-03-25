"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import type { PercentileData } from "@/lib/simulation/types";
import { formatINRCompact, getPercentileLabel, getPercentileColor } from "@/lib/simulation/formatters";

interface Props {
  percentiles: PercentileData;
}

const DISPLAY_PERCENTILES = [
  { key: "p50" as const, label: "MEDIAN", percentile: 50 },
  { key: "p75" as const, label: "1 in 4", percentile: 75 },
  { key: "p90" as const, label: "1 in 10", percentile: 90 },
  { key: "p99" as const, label: "WORST", percentile: 99 },
];

export default function PercentileCards({ percentiles }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {DISPLAY_PERCENTILES.map((p, i) => {
        const color = getPercentileColor(p.percentile);
        const value = percentiles[p.key];

        return (
          <motion.div
            key={p.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`${color.bg} ${color.border} border`}>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-white/50 mb-1 font-medium uppercase tracking-wider">
                  {p.label}
                </p>
                <motion.p
                  className={`text-2xl font-bold ${color.text}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                >
                  {formatINRCompact(value)}
                </motion.p>
                <p className="text-[10px] text-white/30 mt-1">
                  {getPercentileLabel(p.percentile)}
                </p>
                <div
                  className="w-3 h-3 rounded-full mx-auto mt-2"
                  style={{ backgroundColor: color.fill }}
                />
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
