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
  rent: "bg-blue-500",
  loan_emi: "bg-red-500",
  insurance_premium: "bg-green-500",
  subscription: "bg-purple-500",
  maintenance: "bg-yellow-500",
  utility: "bg-cyan-500",
  penalty: "bg-orange-500",
  deposit: "bg-pink-500",
  tax_obligation: "bg-emerald-500",
  salary: "bg-indigo-500",
  other: "bg-slate-500",
};

export function ExposureDashboard({
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: IndianRupee,
            label: "Worst Case Total",
            value: formatINR(exposure.total_worst_case),
            color: "text-red-600",
            bg: "bg-red-50",
          },
          {
            icon: TrendingUp,
            label: "Monthly Obligations",
            value: formatINR(exposure.total_monthly_obligations),
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            icon: Landmark,
            label: "Deposits at Risk",
            value: formatINR(exposure.total_deposits_at_risk),
            color: "text-yellow-600",
            bg: "bg-yellow-50",
          },
          {
            icon: AlertTriangle,
            label: "Max Penalties",
            value: formatINR(exposure.total_penalties_possible),
            color: "text-orange-600",
            bg: "bg-orange-50",
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
              <Card className={`rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 ${stat.bg}`}>
                <CardContent className="p-4 text-center">
                  <Icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                  <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* By Contract — Horizontal Bars */}
      <div>
        <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-3 tracking-tight">By Contract</h4>
        <div className="space-y-3">
          {exposure.by_contract.map((contract, i) => (
            <motion.div
              key={contract.document_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 p-4 shadow-sm dark:shadow-slate-900/20"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="min-w-0">
                  <p className="text-sm text-slate-900 dark:text-slate-100 font-bold truncate">{contract.document_title}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">{contract.document_type.replace(/_/g, " ")}</p>
                </div>
                <p className="text-sm font-black text-slate-800 dark:text-slate-200 flex-shrink-0 ml-3">
                  {formatINR(contract.worst_case_total)}
                </p>
              </div>

              {/* Stacked bar */}
              <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                {contract.monthly_obligation > 0 && (
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{
                      width: `${(contract.monthly_obligation * 12 / maxContractExposure) * 100}%`,
                    }}
                    title={`Monthly: ${formatINR(contract.monthly_obligation)}/mo`}
                  />
                )}
                {contract.deposits > 0 && (
                  <div
                    className="h-full bg-yellow-500 transition-all duration-500"
                    style={{
                      width: `${(contract.deposits / maxContractExposure) * 100}%`,
                    }}
                    title={`Deposits: ${formatINR(contract.deposits)}`}
                  />
                )}
                {contract.max_penalty > 0 && (
                  <div
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{
                      width: `${(contract.max_penalty / maxContractExposure) * 100}%`,
                    }}
                    title={`Penalties: ${formatINR(contract.max_penalty)}`}
                  />
                )}
              </div>

              {/* Legend */}
              <div className="flex gap-4 mt-3 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                {contract.monthly_obligation > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    {formatINR(contract.monthly_obligation)}/mo
                  </span>
                )}
                {contract.deposits > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    Deposits
                  </span>
                )}
                {contract.max_penalty > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Penalties
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* By Category — Horizontal Bars */}
      {exposure.by_category.length > 0 && (
        <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm dark:shadow-slate-900/20">
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-4 tracking-tight">By Category</h4>
          <div className="space-y-4">
            {exposure.by_category.map((cat, i) => {
              const barColor =
                CATEGORY_COLORS[cat.category] || "bg-slate-500";
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
                  className="flex items-center gap-3"
                >
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest w-28 text-right truncate">
                    {cat.category.replace(/_/g, " ")}
                  </span>
                  <div className="flex-1 h-4 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-700`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-700 font-black w-20 text-right">
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
