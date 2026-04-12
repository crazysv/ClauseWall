"use client";

import type { ContractMismatch, MismatchSeverity } from "@/types";

interface ComparisonTableProps {
  mismatches: ContractMismatch[];
}

const SEVERITY_DOT: Record<MismatchSeverity, string> = {
  critical: "bg-red-500 border border-red-400",
  major: "bg-amber-500 border border-amber-400",
  minor: "bg-amber-400 border border-amber-300",
  info: "bg-cyan-500 border border-cyan-400",
};

const TYPE_LABELS: Record<string, string> = {
  direct_contradiction: "Contradicted",
  missing_promise: "Missing",
  weakened_promise: "Weakened",
  hidden_condition: "Hidden",
  amount_mismatch: "Amount ≠",
  timeline_mismatch: "Timeline ≠",
  scope_mismatch: "Scope ≠",
};

export default function ComparisonTable({ mismatches }: ComparisonTableProps) {
  if (mismatches.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 border-b border-neutral-800 pb-2">
        📊 PROMISE VS. CONTRACT
      </h3>

      <div className="overflow-x-auto border border-neutral-900 bg-[#0a0a0a]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="py-3 px-3 text-left text-[7px] font-mono uppercase tracking-widest text-neutral-600 w-8 border-r border-neutral-800">
                #
              </th>
              <th className="py-3 px-3 text-left text-[7px] font-mono uppercase tracking-widest text-amber-400 border-r border-neutral-800">
                💬 PROMISE
              </th>
              <th className="py-3 px-3 text-left text-[7px] font-mono uppercase tracking-widest text-cyan-400 border-r border-neutral-800">
                📄 CONTRACT
              </th>
              <th className="py-3 px-3 text-left text-[7px] font-mono uppercase tracking-widest text-neutral-500 border-r border-neutral-800">
                STATUS
              </th>
              <th className="py-3 px-3 text-left text-[7px] font-mono uppercase tracking-widest text-neutral-500">
                CLAUSE
              </th>
            </tr>
          </thead>
          <tbody>
            {mismatches.map((m, i) => (
              <tr
                key={m.id}
                className="border-b border-neutral-900 last:border-b-0 hover:bg-neutral-900/50 transition-colors"
              >
                <td className="py-3 px-3 text-[8px] font-mono tabular-nums text-neutral-600 align-top border-r border-neutral-900">
                  {i + 1}
                </td>
                <td className="py-3 px-3 align-top max-w-[250px] border-r border-neutral-900">
                  <p className="text-[9px] font-mono text-neutral-300 leading-relaxed line-clamp-4">
                    {m.promise_says}
                  </p>
                  <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 mt-2">
                    — {m.promise.promised_by}
                    {m.promise.date ? `, ${m.promise.date}` : ""}
                  </p>
                </td>
                <td className="py-3 px-3 align-top max-w-[250px] border-r border-neutral-900">
                  <p className="text-[9px] font-mono text-neutral-400 leading-relaxed line-clamp-4">
                    {m.contract_says}
                  </p>
                </td>
                <td className="py-3 px-3 align-top border-r border-neutral-900">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 flex-shrink-0 ${SEVERITY_DOT[m.severity]}`}
                    />
                    <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-400 whitespace-nowrap">
                      {TYPE_LABELS[m.mismatch_type] || m.mismatch_type}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 align-top">
                  <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-500 border border-neutral-800 bg-[#050505] px-1.5 py-0.5">
                    {m.clause_number ? `#${m.clause_number}` : "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
