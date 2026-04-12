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
      ? "CRITICAL"
      : score >= 51
        ? "DANGEROUS"
        : score >= 21
          ? "WARNING"
          : "SAFE";

  const riskColor =
    score >= 81
      ? "#c084fc"
      : score >= 51
        ? "#ef4444"
        : score >= 21
          ? "#f59e0b"
          : "#10b981";

  return (
    <div className="bg-[#050505] border border-neutral-800 p-3 shadow-2xl">
      <p className="text-[9px] font-mono tracking-widest text-neutral-500 mb-1">
        {point.date}
      </p>
      <p className="text-xs font-mono text-neutral-300 truncate max-w-[200px] uppercase">
        {point.label}
      </p>
      <div className="flex items-center gap-3 mt-2">
        <span
          className="text-sm font-mono tracking-tighter"
          style={{ color: riskColor }}
        >
          {score}
        </span>
        <span
          className="text-[8px] font-mono tracking-widest uppercase px-1.5 py-0.5 border"
          style={{ color: riskColor, borderColor: riskColor }}
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a0a0a] border border-neutral-900 p-6 h-full flex flex-col"
      >
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-900">
          <TrendingUp className="w-4 h-4 text-cyan-500" />
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
            [ RISK_TREND_TELEMETRY ]
          </h3>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center border border-dashed border-neutral-800 bg-[#050505] mt-2">
          <Info className="w-6 h-6 text-neutral-600 mb-3" />
          <p className="font-mono text-neutral-400 text-[10px] uppercase tracking-widest">
            INSUFFICIENT_DATA_POINTS
          </p>
          <p className="text-neutral-600 text-[9px] font-mono uppercase tracking-widest mt-2">
            INGEST 2+ CONTRACTS TO GENERATE TREND CURVE
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-[#0a0a0a] border border-neutral-900 p-6 h-full flex flex-col"
    >
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-5 gap-4 pb-4 border-b border-neutral-900">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-4 h-4 text-cyan-500" />
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
            [ RISK_TREND_TELEMETRY ]
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[8px] font-mono uppercase tracking-widest text-neutral-500">
          <div className="flex items-center gap-1.5 border border-emerald-900/40 bg-emerald-950/20 px-2 py-1">
            <div className="w-1.5 h-1.5 bg-emerald-500" />
            <span className="text-emerald-500">SAFE &lt;30</span>
          </div>
          <div className="flex items-center gap-1.5 border border-amber-900/40 bg-amber-950/20 px-2 py-1">
            <div className="w-1.5 h-1.5 bg-amber-500" />
            <span className="text-amber-500">WARNING</span>
          </div>
          <div className="flex items-center gap-1.5 border border-red-900/40 bg-red-950/20 px-2 py-1">
            <div className="w-1.5 h-1.5 bg-red-500" />
            <span className="text-red-500">DANGER &gt;60</span>
          </div>
        </div>
      </div>

      <div className="h-64 min-h-[16rem]">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          minHeight={0}
        >
          <AreaChart
            data={data}
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="#171717"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#525252", fontSize: 9, fontFamily: "monospace" }}
              dy={10}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#525252", fontSize: 9, fontFamily: "monospace" }}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#262626', strokeWidth: 1, strokeDasharray: '4 4' }} />

            {/* Risk zone reference lines */}
            <ReferenceLine
              y={30}
              stroke="#10b981"
              strokeDasharray="2 4"
              strokeOpacity={0.2}
            />
            <ReferenceLine
              y={60}
              stroke="#f59e0b"
              strokeDasharray="2 4"
              strokeOpacity={0.2}
            />
            <ReferenceLine
              y={80}
              stroke="#ef4444"
              strokeDasharray="2 4"
              strokeOpacity={0.2}
            />

            <Area
              type="monotone"
              dataKey="score"
              stroke="#06b6d4"
              strokeWidth={1}
              fill="url(#riskGradient)"
              dot={{
                r: 3,
                fill: "#050505",
                stroke: "#06b6d4",
                strokeWidth: 1,
              }}
              activeDot={{
                r: 4,
                fill: "#06b6d4",
                stroke: "#fff",
                strokeWidth: 0,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>    </motion.div>
  );
}
