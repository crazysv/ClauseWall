"use client";

import { EVIDENCE_TYPE_META, type EvidenceType } from "@/types/evidence";

export function EvidenceStats({ stats }: {
  stats: {
    total_items: number;
    certified_count: number;
    chain_verified: boolean;
    storage_used_bytes: number;
    by_type: Partial<Record<EvidenceType, number>>;
  };
}) {
  const topTypes = Object.entries(stats.by_type)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatBox label="Total Items" value={String(stats.total_items)} color="text-indigo-600" />
      <StatBox label="Certified" value={String(stats.certified_count)} color="text-emerald-600" />
      <StatBox label="Chain" value={stats.chain_verified ? "✓ Valid" : "✗ Broken"} color={stats.chain_verified ? "text-emerald-600" : "text-red-600"} />
      <StatBox label="Storage" value={`${(stats.storage_used_bytes / 1024 / 1024).toFixed(1)}MB`} color="text-slate-600" />

      {topTypes.length > 0 && (
        <div className="col-span-full flex flex-wrap gap-2 mt-1">
          {topTypes.map(([type, count]) => {
            const meta = EVIDENCE_TYPE_META[type as EvidenceType];
            return (
              <span key={type} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {meta?.emoji} {meta?.label}: {count}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 p-4 text-center">
      <p className={`text-lg md:text-xl lg:text-2xl font-black ${color}`}>{value}</p>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
  );
}
