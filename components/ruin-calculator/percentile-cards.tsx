"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import type { PercentileData } from "@/lib/simulation/types";
import {
  formatINRCompact,
  getPercentileLabel,
  getPercentileColor,
} from "@/lib/simulation/formatters";

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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
            <div
              className={`p-4 text-center border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all`}
              style={{ borderTopWidth: "8px", borderTopColor: color.fill }}
            >
              <p className="text-xs text-black font-black uppercase tracking-widest mb-2">
                {p.label}
              </p>
              <motion.p
                className={`text-3xl font-black text-black`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 + 0.3 }}
              >
                {formatINRCompact(value)}
              </motion.p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 mt-3 bg-gray-100 py-1 inline-block px-2">
                {getPercentileLabel(p.percentile)}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
