"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, ArrowRight, Shield, Loader2 } from "lucide-react";
import ThresholdProgress from "./threshold-progress";
import type { Collective, CollectiveMembership } from "@/types";

export default function MyCollectivesSection() {
  const [collectives, setCollectives] = useState<
    { collective: Collective; membership: CollectiveMembership }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollectives = async () => {
      try {
        const res = await fetch("/api/collective/user");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCollectives(data);
          }
        }
      } catch {
        // Silently fail — user may not be authenticated
      } finally {
        setLoading(false);
      }
    };
    fetchCollectives();
  }, []);

  if (loading) return null;
  if (collectives.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-900">
        <h2 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-amber-500" />
          [ ACTIVE_COLLECTIVES ]
        </h2>
        <Link
          href="/collective"
          className="text-[9px] font-mono tracking-widest uppercase text-amber-500 hover:text-amber-400 flex items-center gap-1.5"
        >
          OPEN_HUB <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {collectives.slice(0, 4).map(({ collective, membership }) => {
          const statusColors: Record<string, string> = {
            forming: "border-blue-900/40 bg-blue-950/20 text-blue-500",
            active: "border-green-900/40 bg-green-950/20 text-green-500",
            threshold_reached: "border-amber-900/40 bg-amber-500/10 text-amber-500 animate-pulse",
            action_taken: "border-purple-900/40 bg-purple-950/20 text-purple-500",
            resolved: "border-emerald-900/40 bg-emerald-950/20 text-emerald-500",
            dormant: "border-neutral-800 bg-neutral-900/20 text-neutral-500",
          };

          const isActionable = collective.status === "threshold_reached";
          const containerBorder = isActionable ? "border-amber-900/50" : "border-neutral-900";
          const hoverBorder = isActionable ? "group-hover:border-amber-500/50" : "group-hover:border-neutral-700";

          return (
            <Link key={collective.id} href={`/collective/${collective.id}`}>
              <div className={`group bg-[#0a0a0a] border ${containerBorder} ${hoverBorder} p-4 transition-colors relative overflow-hidden`}>
                {isActionable && (
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-amber-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                )}
                
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-mono uppercase tracking-widest text-neutral-200 truncate">
                      {collective.entity_name}
                    </p>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 mt-1 truncate">
                      {collective.entity_type} // {membership.anonymous_id}
                    </p>
                  </div>
                  <span
                    className={`text-[8px] font-mono uppercase tracking-widest border px-1.5 py-0.5 whitespace-nowrap ${statusColors[collective.status] || "border-neutral-800 text-neutral-500"}`}
                  >
                    {collective.status.replace("_", " ")}
                  </span>
                </div>

                <ThresholdProgress
                  current={collective.member_count}
                  threshold={collective.threshold}
                />

                <div className="flex items-center justify-between mt-4 border-t border-neutral-900 pt-3">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">
                    <span className="text-white">{collective.member_count}</span> UNITS
                  </span>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-neutral-500">
                    <Shield className="h-3 w-3" />
                    ENCRYPTED
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
