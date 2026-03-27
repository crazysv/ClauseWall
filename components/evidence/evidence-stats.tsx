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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatBox label="Total Items" value={String(stats.total_items)} color="text-blue-400" />
      <StatBox label="Certified" value={String(stats.certified_count)} color="text-emerald-400" />
      <StatBox label="Chain" value={stats.chain_verified ? "✓ Valid" : "✗ Broken"} color={stats.chain_verified ? "text-emerald-400" : "text-red-400"} />
      <StatBox label="Storage" value={`${(stats.storage_used_bytes / 1024 / 1024).toFixed(1)}MB`} color="text-muted-foreground" />

      {topTypes.length > 0 && (
        <div className="col-span-full flex flex-wrap gap-2 mt-1">
          {topTypes.map(([type, count]) => {
            const meta = EVIDENCE_TYPE_META[type as EvidenceType];
            return (
              <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-white/5 text-muted-foreground">
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
    <div className="rounded-lg bg-white/5 border border-white/5 p-3 text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
