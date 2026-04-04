"use client";

import { EVIDENCE_TYPE_META, type EvidenceType } from "@/types/evidence";

export function EvidenceStats({
  stats,
}: {
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
      <StatBox
        label="Total Items"
        value={String(stats.total_items)}
        color="text-blue-700 dark:text-blue-400"
      />
      <StatBox
        label="Certified"
        value={String(stats.certified_count)}
        color="text-emerald-700 dark:text-emerald-400"
      />
      <StatBox
        label="Chain"
        value={stats.chain_verified ? "✓ VALID" : "✗ BROKEN"}
        color={
          stats.chain_verified
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-red-700 dark:text-red-400"
        }
      />
      <StatBox
        label="Storage"
        value={`${(stats.storage_used_bytes / 1024 / 1024).toFixed(1)}MB`}
        color="text-muted-foreground"
      />

      {topTypes.length > 0 && (
        <div className="col-span-full flex flex-wrap gap-2 mt-2">
          {topTypes.map(([type, count]) => {
            const meta = EVIDENCE_TYPE_META[type as EvidenceType];
            return (
              <span
                key={type}
                className="inline-flex items-center gap-2 px-3 py-1 border-2 border-black bg-gray-100 dark:bg-zinc-800 text-xs font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {meta?.emoji} {meta?.label}: {count}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="border-4 border-black bg-white dark:bg-zinc-900 p-4 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all">
      <p className={`text-2xl font-black uppercase tracking-widest ${color}`}>
        {value}
      </p>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
        {label}
      </p>
    </div>
  );
}
