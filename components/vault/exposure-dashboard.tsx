"use client";

import { motion } from "framer-motion";
import { IndianRupee, TrendingUp, Landmark, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { FinancialExposure } from "@/types";

interface ExposureDashboardProps {
  exposure: FinancialExposure;
}

function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  rent: "bg-blue-600 dark:bg-blue-500 border-4 border-black",
  loan_emi: "bg-red-600 dark:bg-red-500 border-4 border-black",
  insurance_premium: "bg-green-600 dark:bg-green-500 border-4 border-black",
  subscription: "bg-purple-600 dark:bg-purple-500 border-4 border-black",
  maintenance: "bg-yellow-500 border-4 border-black",
  utility: "bg-cyan-500 border-4 border-black",
  penalty: "bg-orange-500 border-4 border-black",
  deposit: "bg-pink-500 border-4 border-black",
  tax_obligation: "bg-emerald-500 border-4 border-black",
  salary: "bg-indigo-600 dark:bg-indigo-500 border-4 border-black",
  other: "bg-gray-500 dark:bg-gray-400 border-4 border-black",
};

export default function ExposureDashboard({
  exposure,
}: ExposureDashboardProps) {
  const maxContractExposure = Math.max(
    ...exposure.by_contract.map((c) => c.worst_case_total),
    1
  );
  const maxCategoryTotal = Math.max(
    ...exposure.by_category.map((c) => c.total),
    1
  );

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: IndianRupee,
            label: "WORST CASE TOTAL",
            value: formatINR(exposure.total_worst_case),
            color: "text-red-700 dark:text-red-500",
            bg: "bg-red-100 dark:bg-red-950",
          },
          {
            icon: TrendingUp,
            label: "MONTHLY OBLIGATIONS",
            value: formatINR(exposure.total_monthly_obligations),
            color: "text-blue-700 dark:text-blue-500",
            bg: "bg-blue-100 dark:bg-blue-950",
          },
          {
            icon: Landmark,
            label: "DEPOSITS AT RISK",
            value: formatINR(exposure.total_deposits_at_risk),
            color: "text-yellow-700 dark:text-yellow-500",
            bg: "bg-yellow-100 dark:bg-yellow-950",
          },
          {
            icon: AlertTriangle,
            label: "MAX PENALTIES",
            value: formatINR(exposure.total_penalties_possible),
            color: "text-orange-700 dark:text-orange-500",
            bg: "bg-orange-100 dark:bg-orange-950",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`${stat.bg} border-4 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all`}>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-10 h-10 border-4 border-black bg-white dark:bg-black mb-4 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Icon className={`w-5 h-5 ${stat.color} stroke-[3px]`} />
                  </div>
                  <p className={`text-2xl font-black tabular-nums tracking-tighter ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2 border-t-2 border-black pt-2">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* By Contract — Horizontal Bars */}
      <div className="border-4 border-black bg-white dark:bg-zinc-900 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h4 className="text-xl font-black uppercase tracking-widest text-foreground mb-6 border-b-4 border-black pb-4">
          BY CONTRACT
        </h4>
        <div className="space-y-6">
          {exposure.by_contract.map((contract, i) => (
            <motion.div
              key={contract.document_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border-4 border-black p-4 bg-gray-50 dark:bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-widest text-foreground truncate block">{contract.document_title}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1 inline-block border-2 border-black bg-white dark:bg-zinc-800 px-2 py-0.5">{contract.document_type.replace(/_/g, " ")}</p>
                </div>
                <p className="text-lg font-black tabular-nums tracking-tighter flex-shrink-0 ml-4 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 px-3 py-1 border-4 border-red-500 shadow-[2px_2px_0px_0px_rgba(239,68,68,1)]">
                  {formatINR(contract.worst_case_total)}
                </p>
              </div>

              {/* Stacked bar */}
              <div className="h-6 border-4 border-black bg-white dark:bg-zinc-800 flex shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,1)]">
                {contract.monthly_obligation > 0 && (
                  <div
                    className="h-full bg-blue-500 border-r-4 border-black last:border-r-0 transition-all duration-500"
                    style={{
                      width: `${(contract.monthly_obligation * 12 / maxContractExposure) * 100}%`,
                    }}
                    title={`Monthly: ${formatINR(contract.monthly_obligation)}/mo`}
                  />
                )}
                {contract.deposits > 0 && (
                  <div
                    className="h-full bg-yellow-400 border-r-4 border-black last:border-r-0 transition-all duration-500"
                    style={{
                      width: `${(contract.deposits / maxContractExposure) * 100}%`,
                    }}
                    title={`Deposits: ${formatINR(contract.deposits)}`}
                  />
                )}
                {contract.max_penalty > 0 && (
                  <div
                    className="h-full bg-red-500 border-r-4 border-black last:border-r-0 transition-all duration-500"
                    style={{
                      width: `${(contract.max_penalty / maxContractExposure) * 100}%`,
                    }}
                    title={`Penalties: ${formatINR(contract.max_penalty)}`}
                  />
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t-2 border-dashed border-black">
                {contract.monthly_obligation > 0 && (
                  <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground">
                    <span className="w-4 h-4 border-2 border-black bg-blue-500 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" />
                    {formatINR(contract.monthly_obligation)}/MO
                  </span>
                )}
                {contract.deposits > 0 && (
                  <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground">
                    <span className="w-4 h-4 border-2 border-black bg-yellow-400 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" />
                    DEPOSITS
                  </span>
                )}
                {contract.max_penalty > 0 && (
                  <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground">
                    <span className="w-4 h-4 border-2 border-black bg-red-500 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" />
                    PENALTIES
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* By Category — Horizontal Bars */}
      {exposure.by_category.length > 0 && (
        <div className="border-4 border-black bg-white dark:bg-zinc-900 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mt-8">
          <h4 className="text-xl font-black uppercase tracking-widest text-foreground mb-6 border-b-4 border-black pb-4">
            BY CATEGORY
          </h4>
          <div className="space-y-4">
            {exposure.by_category.map((cat, i) => {
              const barColor =
                CATEGORY_COLORS[cat.category] || "bg-gray-500 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
              const barWidth = Math.max(
                5,
                (cat.total / maxCategoryTotal) * 100
              );

              return (
                <motion.div
                  key={cat.category}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4"
                >
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground w-36 text-right truncate">
                    {cat.category.replace(/_/g, " ")}
                  </span>
                  <div className="flex-1 h-8 border-4 border-black bg-gray-100 dark:bg-zinc-800 flex shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div
                      className={`h-full ${barColor} transition-all duration-700`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-sm font-black tabular-nums tracking-tighter text-foreground w-28 text-left bg-white dark:bg-zinc-950 border-4 border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {formatINR(cat.total)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
