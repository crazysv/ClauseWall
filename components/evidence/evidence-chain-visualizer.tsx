"use client";

import type { ChainLink } from "@/types/evidence";
import { Shield, Link as LinkIcon, Hash } from "lucide-react";

export function EvidenceChainVisualizer({ links }: { links: ChainLink[] }) {
  if (links.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm font-medium">
        No chain links yet.
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-x-auto">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-5">
        <Shield className="h-4 w-4 text-emerald-600" />
        <span>Cryptographic Hash Chain — Each item is linked to the previous via SHA-256</span>
      </div>

      {links.map((link, i) => (
        <div key={link.item_id} className="flex items-center gap-2">
          {/* Chain connector */}
          {i > 0 && (
            <div className="flex flex-col items-center -my-2 opacity-50 z-0">
              <div className="h-5 w-0.5 bg-slate-300" />
              <LinkIcon className="h-4 w-4 text-slate-400 -m-1 bg-white dark:bg-slate-900 p-0.5 rounded-full z-10" />
              <div className="h-5 w-0.5 bg-slate-300" />
            </div>
          )}

          {/* Chain block */}
          <div className={`flex-1 rounded-xl border p-4 shadow-sm dark:shadow-slate-900/20 z-10 ${link.verified ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${link.verified ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                  #{link.sequence_number}
                </span>
                <Hash className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">
                  {link.content_hash.substring(0, 16)}...
                </span>
              </div>
              {link.verified ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 rounded uppercase font-bold tracking-widest inline-flex py-0.5">VERIFIED</span>
              ) : (
                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 rounded uppercase font-bold tracking-widest inline-flex py-0.5">TAMPERED</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-3 pl-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Chain:</span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">
                {link.chain_hash.substring(0, 24)}...
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
