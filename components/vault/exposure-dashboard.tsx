"use client";

import { motion } from "framer-motion";
import { IndianRupee, TrendingUp, Landmark, AlertTriangle } from "lucide-react";
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
  rent: "bg-cyan-500",
  loan_emi: "bg-red-500",
  insurance_premium: "bg-emerald-500",
  subscription: "bg-purple-500",
  maintenance: "bg-amber-500",
  utility: "bg-cyan-400",
  penalty: "bg-orange-500",
  deposit: "bg-pink-500",
  tax_obligation: "bg-emerald-400",
  salary: "bg-indigo-500",
  other: "bg-neutral-500",
};

export default function ExposureDashboard({
  exposure,
}: ExposureDashboardProps) {
  const maxContractExposure = Math.max(
    ...exposure.by_contract.map((c) => c.worst_case_total),
    1,
  );
  const maxCategoryTotal = Math.max(
    ...exposure.by_category.map((c) => c.total),
    1,
  );

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: IndianRupee,
            label: "WORST_CASE_TOTAL",
            value: formatINR(exposure.total_worst_case),
            color: "text-red-500",
          },
          {
            icon: TrendingUp,
            label: "MONTHLY_OBLIGATIONS",
            value: formatINR(exposure.total_monthly_obligations),
            color: "text-cyan-500",
          },
          {
            icon: Landmark,
            label: "DEPOSITS_AT_RISK",
            value: formatINR(exposure.total_deposits_at_risk),
            color: "text-amber-500",
          },
          {
            icon: AlertTriangle,
            label: "MAX_PENALTIES",
            value: formatINR(exposure.total_penalties_possible),
            color: "text-orange-500",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="border border-neutral-900 bg-[#0a0a0a] hover:border-neutral-700 transition-colors p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1 border border-neutral-800 bg-[#050505]">
                    <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                  </div>
                  <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-600">
                    {stat.label}
                  </span>
                </div>
                <p
                  className={`text-xl font-mono tabular-nums ${stat.color}`}
                >
                  {stat.value}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* By Contract — Horizontal Bars */}
      <div className="border border-neutral-900 bg-[#0a0a0a] p-6">
        <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-6 border-b border-neutral-900 pb-4">
          EXPOSURE_BY_CONTRACT
        </h4>
        <div className="space-y-5">
          {exposure.by_contract.map((contract, i) => (
            <motion.div
              key={contract.document_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border border-neutral-900 bg-[#050505] p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="min-w-0">
                  <p className="text-xs font-mono uppercase tracking-widest text-neutral-200 truncate block">
                    {contract.document_title}
                  </p>
                  <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mt-1 inline-block border border-neutral-800 bg-neutral-900 px-1.5 py-0.5">
                    {contract.document_type.replace(/_/g, " ")}
                  </span>
                </div>
                <span className="text-sm font-mono tabular-nums flex-shrink-0 ml-4 text-red-500 border border-red-900/50 bg-red-950/20 px-2 py-1">
                  {formatINR(contract.worst_case_total)}
                </span>
              </div>

              {/* Stacked bar */}
              <div className="h-2 bg-neutral-900 flex overflow-hidden">
                {contract.monthly_obligation > 0 && (
                  <div
                    className="h-full bg-cyan-500 transition-all duration-500"
                    style={{
                      width: `${((contract.monthly_obligation * 12) / maxContractExposure) * 100}%`,
                    }}
                    title={`Monthly: ${formatINR(contract.monthly_obligation)}/mo`}
                  />
                )}
                {contract.deposits > 0 && (
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
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
              <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-neutral-900">
                {contract.monthly_obligation > 0 && (
                  <span className="flex items-center gap-2 text-[8px] font-mono uppercase tracking-widest text-neutral-500">
                    <span className="w-3 h-3 bg-cyan-500" />
                    {formatINR(contract.monthly_obligation)}/MO
                  </span>
                )}
                {contract.deposits > 0 && (
                  <span className="flex items-center gap-2 text-[8px] font-mono uppercase tracking-widest text-neutral-500">
                    <span className="w-3 h-3 bg-amber-500" />
                    DEPOSITS
                  </span>
                )}
                {contract.max_penalty > 0 && (
                  <span className="flex items-center gap-2 text-[8px] font-mono uppercase tracking-widest text-neutral-500">
                    <span className="w-3 h-3 bg-red-500" />
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
        <div className="border border-neutral-900 bg-[#0a0a0a] p-6">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-6 border-b border-neutral-900 pb-4">
            EXPOSURE_BY_CATEGORY
          </h4>
          <div className="space-y-3">
            {exposure.by_category.map((cat, i) => {
              const barColor =
                CATEGORY_COLORS[cat.category] || "bg-neutral-500";
              const barWidth = Math.max(
                5,
                (cat.total / maxCategoryTotal) * 100,
              );

              return (
                <motion.div
                  key={cat.category}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4"
                >
                  <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 w-36 text-right truncate">
                    {cat.category.replace(/_/g, " ")}
                  </span>
                  <div className="flex-1 h-2 bg-neutral-900 overflow-hidden">
                    <div
                      className={`h-full ${barColor} transition-all duration-700`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono tabular-nums text-neutral-400 w-24 text-left">
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
