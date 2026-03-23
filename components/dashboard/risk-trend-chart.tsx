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
  ReferenceLine,
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
      ? "#a855f7"
      : score >= 51
      ? "#ef4444"
      : score >= 21
      ? "#f59e0b"
      : "#10b981";

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{point.date}</p>
      <p className="text-sm font-medium text-white truncate max-w-[200px]">
        {point.label}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span
          className="text-lg font-bold"
          style={{ color: riskColor }}
        >
          {score}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: `${riskColor}20`,
            color: riskColor,
          }}
        >
          {riskLabel}
        </span>
      </div>
    </div>
  );
}

export default function RiskTrendChart({ data }: RiskTrendChartProps) {
  if (data.length < 2) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-gray-800 bg-gray-900/50 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Risk Trend</h3>
        </div>
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <Info className="w-8 h-8 text-gray-600 mb-3" />
          <p className="text-gray-400 text-sm">
            Analyze 2+ contracts to see your risk trend
          </p>
          <p className="text-gray-500 text-xs mt-1">
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
      className="rounded-xl border border-gray-800 bg-gray-900/50 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Risk Trend</h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Safe &lt;30
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            Warning
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            Dangerous &gt;60
          </div>
        </div>
      </div>

      <div className="h-64 min-h-[16rem]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1f2937"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              dy={10}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Risk zone reference lines */}
            <ReferenceLine
              y={30}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeOpacity={0.3}
            />
            <ReferenceLine
              y={60}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeOpacity={0.3}
            />
            <ReferenceLine
              y={80}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeOpacity={0.3}
            />

            <Area
              type="monotone"
              dataKey="score"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#riskGradient)"
              dot={{
                r: 4,
                fill: "#1e293b",
                stroke: "#3b82f6",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: "#3b82f6",
                stroke: "#1e293b",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}