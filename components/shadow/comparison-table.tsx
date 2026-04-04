"use client";

import type { ContractMismatch, MismatchSeverity } from "@/types";

interface ComparisonTableProps {
  mismatches: ContractMismatch[];
}

const SEVERITY_DOT: Record<MismatchSeverity, string> = {
  critical: "bg-red-600 border-red-900 border-2",
  major: "bg-orange-500 border-orange-900 border-2",
  minor: "bg-yellow-400 border-yellow-900 border-2",
  info: "bg-blue-500 border-blue-900 border-2",
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
      <h3 className="text-xl font-black uppercase tracking-widest text-black border-b-4 border-black pb-2">
        📊 Promise vs. Contract
      </h3>

      <div className="overflow-x-auto border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-4 border-black bg-gray-100">
              <th className="py-3 px-4 text-left text-xs font-black uppercase tracking-widest text-black w-8 border-r-4 border-black">#</th>
              <th className="py-3 px-4 text-left text-xs font-black uppercase tracking-widest text-black border-r-4 border-black bg-yellow-200">💬 Promise</th>
              <th className="py-3 px-4 text-left text-xs font-black uppercase tracking-widest text-white border-r-4 border-black bg-black">📄 Contract</th>
              <th className="py-3 px-4 text-left text-xs font-black uppercase tracking-widest text-black border-r-4 border-black">Status</th>
              <th className="py-3 px-4 text-left text-xs font-black uppercase tracking-widest text-black">Clause</th>
            </tr>
          </thead>
          <tbody>
            {mismatches.map((m, i) => (
              <tr key={m.id} className="border-b-4 border-black last:border-b-0 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-4 text-sm font-black text-black align-top border-r-4 border-black">{i + 1}</td>
                <td className="py-4 px-4 align-top max-w-[250px] border-r-4 border-black bg-yellow-50">
                  <p className="text-sm font-bold text-black leading-relaxed line-clamp-4">
                    {m.promise_says}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mt-2 bg-yellow-200 inline-block px-1 border-2 border-black">
                    — {m.promise.promised_by}{m.promise.date ? `, ${m.promise.date}` : ""}
                  </p>
                </td>
                <td className="py-4 px-4 align-top max-w-[250px] border-r-4 border-black bg-gray-50">
                  <p className="text-sm font-bold text-black leading-relaxed line-clamp-4">
                    {m.contract_says}
                  </p>
                </td>
                <td className="py-4 px-4 align-top border-r-4 border-black">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 flex-shrink-0 ${SEVERITY_DOT[m.severity]}`} />
                    <span className="text-xs font-black uppercase tracking-widest text-black whitespace-nowrap">
                      {TYPE_LABELS[m.mismatch_type] || m.mismatch_type}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 align-top">
                  <span className="text-xs font-black uppercase tracking-widest text-black bg-gray-200 px-2 py-1 border-2 border-black">
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
