"use client";

import { Shield, AlertTriangle, Clock } from "lucide-react";

export function ChainStatusBadge({ verified, brokenAt }: { verified: boolean; brokenAt?: number | null }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 border-2 border-black text-xs font-black uppercase tracking-widest bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 text-emerald-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <Shield className="h-4 w-4 stroke-[3px]" />
        VERIFIED ✓
      </span>
    );
  }

  if (brokenAt !== undefined && brokenAt !== null) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 border-2 border-black text-xs font-black uppercase tracking-widest bg-red-200 dark:bg-red-900 dark:text-red-300 text-red-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <AlertTriangle className="h-4 w-4 stroke-[3px]" />
        BROKEN AT #{brokenAt}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 border-2 border-black text-xs font-black uppercase tracking-widest bg-amber-200 dark:bg-amber-900 dark:text-amber-300 text-amber-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <Clock className="h-4 w-4 stroke-[3px]" />
      VERIFYING...
    </span>
  );
}
