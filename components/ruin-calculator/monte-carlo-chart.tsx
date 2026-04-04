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
      { value: percentiles.p50, label: "P50", color: "#22c55e" },
      { value: percentiles.p75, label: "P75", color: "#f59e0b" },
      { value: percentiles.p90, label: "P90", color: "#ef4444" },
      { value: percentiles.p95, label: "P95", color: "#a855f7" },
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
            tick={{ fill: "#000000", fontSize: 10, fontWeight: 900 }}
            axisLine={{ stroke: "#000000", strokeWidth: 4 }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "#000000", fontSize: 10, fontWeight: 900 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "4px solid #000000",
              borderRadius: "0px",
              padding: "12px",
              boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
              color: "#000000",
              fontWeight: 900,
            }}
            itemStyle={{ color: "#000000" }}
            labelStyle={{
              color: "#000000",
              fontSize: 12,
              fontWeight: 900,
              textTransform: "uppercase",
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, _name: any, props: any) => [
              `${value}% of scenarios (${props.payload.count} runs)`,
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
                strokeWidth={4}
                label={{
                  value: pl.label,
                  position: "top",
                  fill: pl.color,
                  fontSize: 12,
                  fontWeight: 900,
                }}
              />
            );
          })}
          <Bar dataKey="percentage" radius={[0, 0, 0, 0]} maxBarSize={20}>
            {chartData.map((entry) => (
              <Cell
                key={entry.index}
                fill={getHistogramBarColor(entry.index, chartData.length)}
                fillOpacity={1}
                stroke="#000000"
                strokeWidth={2}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 mt-6 text-xs font-bold uppercase tracking-widest text-black/50">
        <span>X: Total cost over contract period</span>
        <span>Y: % of scenarios</span>
      </div>
    </div>
  );
}
