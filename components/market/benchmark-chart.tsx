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
import type { DistributionBucket } from "@/types/market";

interface BenchmarkChartProps {
  distribution: DistributionBucket[];
  userValue: number;
  median: number;
  mean: number;
  p25: number;
  p75: number;
  unit?: string;
  height?: number;
}

export default function BenchmarkChart({
  distribution,
  userValue,
  median,
  mean,
  p25,
  p75,
  unit = "",
  height = 200,
}: BenchmarkChartProps) {
  const chartData = useMemo(() => {
    if (!distribution || distribution.length === 0) return [];

    return distribution.map((bucket, i) => {
      const midpoint = (bucket.bucket_min + bucket.bucket_max) / 2;
      const isUserBucket =
        userValue >= bucket.bucket_min &&
        (i === distribution.length - 1
          ? userValue <= bucket.bucket_max
          : userValue < bucket.bucket_max);

      return {
        name: `${bucket.bucket_min.toFixed(1)}`,
        range: `${bucket.bucket_min.toFixed(1)} – ${bucket.bucket_max.toFixed(1)}`,
        count: bucket.count,
        percentage: bucket.percentage,
        isUser: isUserBucket,
        midpoint,
      };
    });
  }, [distribution, userValue]);

  if (chartData.length === 0) {
    return (
      <div className="h-[120px] flex items-center justify-center text-sm text-foreground">
        Not enough data for histogram
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, bottom: 20, left: 0 }}
        >
          <XAxis
            dataKey="name"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(17,17,17,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "12px",
            }}
            formatter={((value: any) => [`${value} contracts`, "Count"]) as any}
            labelFormatter={(label) => {
              const item = chartData.find((d) => d.name === label);
              return item ? `Range: ${item.range} ${unit}` : label;
            }}
          />

          {/* Median reference line */}
          <ReferenceLine
            x={chartData.find((d) => median >= parseFloat(d.name))?.name}
            stroke="#fbbf24"
            strokeDasharray="3 3"
            label={{
              value: `Median: ${median}`,
              fill: "#fbbf24",
              fontSize: 10,
              position: "top",
            }}
          />

          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.isUser
                    ? "#3b82f6" // blue for user's bucket
                    : "rgba(255,255,255,0.08)"
                }
                stroke={entry.isUser ? "#60a5fa" : "rgba(255,255,255,0.05)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-foreground -mt-2">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
          Your value ({userValue} {unit})
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-muted inline-block border border-foreground border-2" />
          Market distribution
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-0 border-t border-dashed border-amber-400 inline-block" />
          Median
        </span>
      </div>
    </div>
  );
}
