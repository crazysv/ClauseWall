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
    <div className="bg-background border-2 border-foreground rounded-none shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] p-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">{point.date}</p>
      <p className="text-sm font-bold text-foreground truncate max-w-[200px]">
        {point.label}
      </p>
      <div className="flex items-center gap-2 mt-2">
        <span
          className="text-lg font-black tracking-tighter"
          style={{ color: riskColor === '#a855f7' ? '#9333ea' : riskColor }}
        >
          {score}
        </span>
        <span
          className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 border-2 border-current bg-background"
          style={{ color: riskColor === '#a855f7' ? '#9333ea' : riskColor }}
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
        className="card-impact border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] bg-background p-6 h-full flex flex-col"
      >
        <div className="flex items-center gap-2 mb-4 pb-4 border-b-2 border-foreground">
          <TrendingUp className="w-6 h-6 text-blue-600 bg-blue-100 p-1 border-2 border-blue-600" />
          <h3 className="text-xl font-black uppercase tracking-wider text-foreground">Risk Trend</h3>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center border-2 border-dashed border-muted-foreground/30 bg-muted/10 mt-2">
          <Info className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="font-bold text-foreground text-sm uppercase tracking-wider">
            Analyze 2+ contracts to see your risk trend
          </p>
          <p className="text-muted-foreground text-xs mt-2 font-bold">
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
      className="card-impact border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] bg-background p-6 h-full flex flex-col"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3 pb-4 border-b-2 border-foreground">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600 bg-blue-100 p-1 border-2 border-blue-600" />
          <h3 className="text-xl font-black uppercase tracking-wider text-foreground">Risk Trend</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          <div className="flex items-center gap-1.5 border-2 border-foreground bg-muted px-2 py-1 shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]">
            <div className="w-2.5 h-2.5 bg-green-500 border border-current" />
            <span className="text-green-700">Safe &lt;30</span>
          </div>
          <div className="flex items-center gap-1.5 border-2 border-foreground bg-muted px-2 py-1 shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]">
            <div className="w-2.5 h-2.5 bg-yellow-500 border border-current" />
            <span className="text-yellow-700">Warning</span>
          </div>
          <div className="flex items-center gap-1.5 border-2 border-foreground bg-muted px-2 py-1 shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]">
            <div className="w-2.5 h-2.5 bg-red-600 border border-current" />
            <span className="text-red-700">Danger &gt;60</span>
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