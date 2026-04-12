"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import type { HistogramBin, PercentileData } from "@/lib/simulation/types";
import {
  formatINRCompact,
  getHistogramBarColor,
} from "@/lib/simulation/formatters";

interface Props {
  histogram: HistogramBin[];
  percentiles: PercentileData;
}

export default function MonteCarloChart({ histogram, percentiles }: Props) {
  const chartData = useMemo(
    () =>
      histogram.map((bin, i) => ({
        range: formatINRCompact(bin.lower),
        percentage: Math.round(bin.percentage * 100) / 100,
        count: bin.count,
        lower: bin.lower,
        upper: bin.upper,
        index: i,
      })),
    [histogram],
  );

  const percentileLines = useMemo(
    () => [
      { value: percentiles.p50, label: "P50", color: "#10b981" },
      { value: percentiles.p75, label: "P75", color: "#f59e0b" },
      { value: percentiles.p90, label: "P90", color: "#f97316" },
      { value: percentiles.p95, label: "P95", color: "#ef4444" },
    ],
    [percentiles],
  );

  if (histogram.length === 0) return null;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 10, bottom: 10, left: 10 }}
        >
          <XAxis
            dataKey="range"
            tick={{ fill: "#737373", fontSize: 9, fontFamily: "monospace" }}
            axisLine={{ stroke: "#262626", strokeWidth: 1 }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "#737373", fontSize: 9, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#050505",
              border: "1px solid #262626",
              borderRadius: "2px",
              padding: "12px",
              boxShadow: "none",
              color: "#a3a3a3",
              fontFamily: "monospace",
              fontSize: "10px",
            }}
            itemStyle={{ color: "#d4d4d4" }}
            labelStyle={{
              color: "#525252",
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "8px",
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, _name: any, props: any) => [
              `${value}% OF SCENARIOS (${props.payload.count} RUNS)`,
              `${formatINRCompact(props.payload.lower)} – ${formatINRCompact(props.payload.upper)}`,
            ]}
          />
          {percentileLines.map((pl) => {
            const binIndex = chartData.findIndex(
              (d) => d.lower <= pl.value && d.upper >= pl.value,
            );
            if (binIndex < 0) return null;
            return (
              <ReferenceLine
                key={pl.label}
                x={chartData[binIndex]?.range}
                stroke={pl.color}
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: pl.label,
                  position: "top",
                  fill: pl.color,
                  fontSize: 9,
                  fontFamily: "monospace",
                }}
              />
            );
          })}
          <Bar dataKey="percentage" radius={[0, 0, 0, 0]} maxBarSize={20}>
            {chartData.map((entry) => (
              <Cell
                key={entry.index}
                fill={getHistogramBarColor(entry.index, chartData.length)}
                fillOpacity={0.8}
                stroke="#050505"
                strokeWidth={1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 mt-6 text-[9px] font-mono uppercase tracking-widest text-neutral-600">
        <span>[X: TOTAL COST OVER PERIOD]</span>
        <span>[Y: % OF SCENARIOS]</span>
      </div>
    </div>
  );
}
