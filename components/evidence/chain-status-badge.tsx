"use client";

import { Shield, AlertTriangle, Clock } from "lucide-react";

export function ChainStatusBadge({ verified, brokenAt }: { verified: boolean; brokenAt?: number | null }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <Shield className="h-3 w-3" />
        Chain Verified ✓
      </span>
    );
  }

  if (brokenAt !== undefined && brokenAt !== null) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
        <AlertTriangle className="h-3 w-3" />
        Chain Broken at #{brokenAt}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
      <Clock className="h-3 w-3" />
      Verifying...
    </span>
  );
}
