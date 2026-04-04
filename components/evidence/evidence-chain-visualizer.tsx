"use client";

import type { ChainLink } from "@/types/evidence";
import { Shield, Link as LinkIcon, Hash } from "lucide-react";

export function EvidenceChainVisualizer({ links }: { links: ChainLink[] }) {
  if (links.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No chain links yet.
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-x-auto relative">
      <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground mb-6">
        <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400 stroke-[3px]" />
        <span>Cryptographic Hash Chain — Each item is linked to the previous via SHA-256</span>
      </div>

      <div className="border-l-4 border-black ml-4 pl-8 py-2 relative">
        {links.map((link, i) => (
          <div key={link.item_id} className="relative mb-8 last:mb-0">
            {/* Chain connector node */}
            <div className="absolute -left-[44px] top-4 w-4 h-4 rounded-full border-4 border-black bg-blue-500 z-10" />

            {/* Content block */}
            <div className={`border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${link.verified ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-lg font-black uppercase tracking-widest ${link.verified ? "text-emerald-900 dark:text-emerald-300" : "text-red-900 dark:text-red-300"}`}>
                    #{link.sequence_number}
                  </span>
                  <Hash className="h-4 w-4 text-black dark:text-white stroke-[3px]" />
                  <span className="text-sm font-bold font-mono text-black dark:text-white truncate bg-white/50 dark:bg-black/50 px-2 py-0.5 border-2 border-black">
                    {link.content_hash.substring(0, 16)}...
                  </span>
                </div>
                <span className={`text-xl font-black ${link.verified ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                  {link.verified ? "✓" : "✗"}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t-2 border-black border-dashed">
                <span className="text-xs font-black uppercase tracking-widest text-black/70 dark:text-white/70">CHAIN:</span>
                <span className="text-xs font-bold font-mono text-black dark:text-white truncate">
                  {link.chain_hash.substring(0, 32)}...
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
