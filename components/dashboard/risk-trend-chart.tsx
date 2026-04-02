"use client";

import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { TrendingUp, Info } from "lucide-react";
import type { RiskDataPoint } from "@/types";

interface RiskTrendChartProps {
  data: RiskDataPoint[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const point = payload[0].payload as RiskDataPoint;
  const score = point.score;

  const riskLabel =
    score >= 81
      ? "Critical"
      : score >= 51
      ? "Dangerous"
      : score >= 21
      ? "Warning"
      : "Safe";

  const riskColor =
    score >= 81
      ? "#a855f7" // purple-500
      : score >= 51
      ? "#f43f5e" // rose-500
      : score >= 21
      ? "#f59e0b" // amber-500
      : "#10b981"; // emerald-500

  return (
    <div className="bg-white dark:bg-card border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 pb-1.5 mb-2">{point.date}</p>
      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
        {point.label}
      </p>
      <div className="flex items-center gap-2 mt-2">
        <span
          className="text-xl font-black"
          style={{ color: riskColor }}
        >
          {score}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-bold border shadow-sm dark:shadow-slate-900/20"
          style={{
            backgroundColor: `${riskColor}10`,
            borderColor: `${riskColor}30`,
            color: riskColor,
          }}
        >
          {riskLabel}
        </span>
      </div>
    </div>
  );
}

export function RiskTrendChart({ data }: RiskTrendChartProps) {
  if (data.length < 2) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">Risk Trend</h3>
        </div>
        <div className="flex flex-col items-center justify-center h-48 text-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          <Info className="w-8 h-8 text-indigo-300 mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">
            Analyze 2+ contracts to see your risk trend
          </p>
          <p className="text-slate-400 font-medium text-xs mt-1">
            Each contract will appear as a data point
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 p-6 flex flex-col"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">Risk Trend</h3>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm dark:shadow-slate-900/20" />
            Safe &lt;30
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm dark:shadow-slate-900/20" />
            Warning
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm dark:shadow-slate-900/20" />
            Dangerous &gt;60
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm dark:shadow-slate-900/20" />
            Critical &gt;80
          </div>
        </div>
      </div>

      <div className="h-[20rem] min-h-[16rem]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
              dy={10}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
              dx={-5}
            />
            
            {/* Horizontal Risk Bands mapped to background */}
            <ReferenceArea y1={0} y2={30} fill="#10b981" fillOpacity={0.03} />
            <ReferenceArea y1={30} y2={60} fill="#f59e0b" fillOpacity={0.03} />
            <ReferenceArea y1={60} y2={80} fill="#f43f5e" fillOpacity={0.03} />
            <ReferenceArea y1={80} y2={100} fill="#a855f7" fillOpacity={0.03} />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />

            <Area
              type="monotone"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={3}
              fill="url(#riskGradient)"
              activeDot={{
                r: 6,
                fill: "#4f46e5",
                stroke: "#ffffff",
                strokeWidth: 3,
                className: "shadow-md"
              }}
              dot={{
                r: 4,
                fill: "#ffffff",
                stroke: "#6366f1",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}