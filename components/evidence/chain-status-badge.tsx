"use client";

import { Shield, AlertTriangle, Clock } from "lucide-react";

export function ChainStatusBadge({
  verified,
  brokenAt,
}: {
  verified: boolean;
  brokenAt?: number | null;
}) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-emerald-900/50 text-[7px] font-mono uppercase tracking-widest bg-emerald-950/20 text-emerald-400">
        <Shield className="h-3 w-3" />
        VERIFIED ✓
      </span>
    );
  }

  if (brokenAt !== undefined && brokenAt !== null) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-red-900/50 text-[7px] font-mono uppercase tracking-widest bg-red-950/20 text-red-400">
        <AlertTriangle className="h-3 w-3" />
        BROKEN AT #{brokenAt}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-amber-900/50 text-[7px] font-mono uppercase tracking-widest bg-amber-950/20 text-amber-400">
      <Clock className="h-3 w-3" />
      VERIFYING...
    </span>
  );
}
