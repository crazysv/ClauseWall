"use client";

import { motion } from "framer-motion";
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
              className={`p-4 text-center border bg-[#050505] transition-all relative overflow-hidden`}
              style={{ borderColor: color.fill }}
            >
              <div 
                className="absolute top-0 left-0 right-0 h-[2px]" 
                style={{ backgroundColor: color.fill }}
              />
              <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest mb-2">
                [{p.label}]
              </p>
              <motion.p
                className={`text-2xl font-mono ${color.text}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 + 0.3 }}
              >
                {formatINRCompact(value)}
              </motion.p>
              <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 mt-3 bg-[#0a0a0a] border border-neutral-800 py-1 inline-block px-2 rounded-sm">
                {getPercentileLabel(p.percentile)}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
