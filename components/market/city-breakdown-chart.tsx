"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getRiskColor } from "@/lib/market/constants";

interface CityBreakdownChartProps {
  data: { city: string; avg_risk_score: number; total_contracts: number }[];
  height?: number;
}

export default function CityBreakdownChart({
  data,
  height = 250,
}: CityBreakdownChartProps) {
  const chartData = useMemo(() => {
    return [...data]
      .sort((a, b) => b.total_contracts - a.total_contracts)
      .slice(0, 12)
      .map((d) => ({
        ...d,
        city: d.city.length > 12 ? d.city.substring(0, 12) + "…" : d.city,
        fullCity: d.city,
      }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="h-[120px] flex items-center justify-center text-sm text-white/30">
        No city data available
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
        >
          <XAxis
            type="number"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="city"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(17,17,17,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "12px",
            }}
            formatter={(value?: number) => [`${value ?? 0} contracts`, "Total"]}
            labelFormatter={(label) => {
              const item = chartData.find((d) => d.city === label);
              return item
                ? `${item.fullCity} (Risk: ${item.avg_risk_score}/100)`
                : label;
            }}
          />
          <Bar dataKey="total_contracts" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getRiskColor(entry.avg_risk_score)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
