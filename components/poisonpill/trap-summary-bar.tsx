"use client";

import { motion } from "framer-motion";
import type { PoisonPillAnalysisResult, TrapSeverity } from "@/types";

interface Props {
  result: PoisonPillAnalysisResult;
}

const SEVERITY_COLORS: Record<TrapSeverity, string> = {
  devastating: "text-purple-400",
  severe: "text-red-400",
  moderate: "text-orange-400",
  minor: "text-yellow-400",
};

function getScoreColor(score: number): string {
  if (score >= 76) return "text-red-400";
  if (score >= 51) return "text-orange-400";
  if (score >= 26) return "text-yellow-400";
  return "text-green-400";
}

function getScoreLabel(score: number): string {
  if (score >= 76) return "Extreme trap risk";
  if (score >= 51) return "High trap risk";
  if (score >= 26) return "Moderate trap risk";
  return "Low trap risk";
}

function getScoreRingColor(score: number): string {
  if (score >= 76) return "stroke-red-400";
  if (score >= 51) return "stroke-orange-400";
  if (score >= 26) return "stroke-yellow-400";
  return "stroke-green-400";
}

export function TrapSummaryBar({ result }: Props) {
  const { traps, combined_trap_score, trap_density, most_dangerous_trap } =
    result;

  // Count by severity
  const severityCounts = traps.reduce(
    (acc, t) => {
      acc[t.severity] = (acc[t.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Average risk amplification
  const avgMultiplier =
    traps.length > 0
      ? traps.reduce((s, t) => s + t.risk_multiplier, 0) / traps.length
      : 0;

  // SVG circular gauge
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const dashOffset =
    circumference - (combined_trap_score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
    >
      {/* Combined Trap Score */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex items-center gap-3">
        <svg
          width="50"
          height="50"
          viewBox="0 0 50 50"
          className="flex-shrink-0"
        >
          <circle
            cx="25"
            cy="25"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="4"
          />
          <circle
            cx="25"
            cy="25"
            r={radius}
            fill="none"
            className={getScoreRingColor(combined_trap_score)}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 25 25)"
          />
          <text
            x="25"
            y="25"
            textAnchor="middle"
            dominantBaseline="central"
            className={`text-[11px] font-bold fill-current ${getScoreColor(combined_trap_score)}`}
          >
            {combined_trap_score}
          </text>
        </svg>
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-wider">
            Trap Score
          </p>
          <p
            className={`text-xs font-medium ${getScoreColor(combined_trap_score)}`}
          >
            {getScoreLabel(combined_trap_score)}
          </p>
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">
          By Severity
        </p>
        <div className="space-y-0.5">
          {(
            ["devastating", "severe", "moderate", "minor"] as TrapSeverity[]
          ).map(
            (sev) =>
              (severityCounts[sev] || 0) > 0 && (
                <p key={sev} className={`text-xs ${SEVERITY_COLORS[sev]}`}>
                  {severityCounts[sev]} {sev}
                </p>
              ),
          )}
        </div>
      </div>

      {/* Trap Density */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">
          Trap Density
        </p>
        <p className="text-lg font-bold text-white/80">{trap_density}%</p>
        <p className="text-[10px] text-white/25">of clauses involved</p>
      </div>

      {/* Most Dangerous / Amplification */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">
          Risk Amplification
        </p>
        <p className="text-lg font-bold text-orange-400">
          {avgMultiplier.toFixed(1)}x
        </p>
        {most_dangerous_trap && (
          <p className="text-[10px] text-white/25 truncate">
            Worst: {most_dangerous_trap.trap_name}
          </p>
        )}
      </div>
    </motion.div>
  );
}
