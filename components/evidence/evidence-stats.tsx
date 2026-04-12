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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatBox
        label="Total Items"
        value={String(stats.total_items)}
        color="text-cyan-400"
      />
      <StatBox
        label="Certified"
        value={String(stats.certified_count)}
        color="text-emerald-400"
      />
      <StatBox
        label="Chain"
        value={stats.chain_verified ? "✓ VALID" : "✗ BROKEN"}
        color={
          stats.chain_verified
            ? "text-emerald-400"
            : "text-red-400"
        }
      />
      <StatBox
        label="Storage"
        value={`${(stats.storage_used_bytes / 1024 / 1024).toFixed(1)}MB`}
        color="text-neutral-400"
      />

      {topTypes.length > 0 && (
        <div className="col-span-full flex flex-wrap gap-1.5 mt-1">
          {topTypes.map(([type, count]) => {
            const meta = EVIDENCE_TYPE_META[type as EvidenceType];
            return (
              <span
                key={type}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-neutral-800 bg-[#050505] text-[7px] font-mono uppercase tracking-widest text-neutral-400"
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
    <div className="border border-neutral-900 bg-[#0a0a0a] p-4 text-center">
      <p className={`text-lg font-mono tabular-nums uppercase tracking-widest ${color}`}>
        {value}
      </p>
      <p className="text-[7px] font-mono text-neutral-600 uppercase tracking-widest mt-1">
        {label}
      </p>
    </div>
  );
}
