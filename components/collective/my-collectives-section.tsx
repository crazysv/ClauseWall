"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, ArrowRight, Shield, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="h-4 w-4 text-amber-400" />
          Your Collectives
        </h2>
        <Link
          href="/collective"
          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {collectives.slice(0, 4).map(({ collective, membership }) => {
          const statusColors: Record<string, string> = {
            forming: "bg-blue-500/10 text-blue-400",
            active: "bg-green-500/10 text-green-400",
            threshold_reached: "bg-amber-500/10 text-amber-400",
            action_taken: "bg-purple-500/10 text-purple-400",
            resolved: "bg-emerald-500/10 text-emerald-400",
            dormant: "bg-white/5 text-white/30",
          };

          return (
            <Link key={collective.id} href={`/collective/${collective.id}`}>
              <Card className="border-amber-500/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-amber-500/20 transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white truncate">
                        {collective.entity_name}
                      </p>
                      <p className="text-[10px] text-white/30">
                        {collective.entity_type} • {membership.anonymous_id}
                      </p>
                    </div>
                    <Badge
                      className={`text-[9px] ${statusColors[collective.status] || ""}`}
                    >
                      {collective.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <ThresholdProgress
                    current={collective.member_count}
                    threshold={collective.threshold}
                  />

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-white/20">
                      {collective.member_count} members
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-white/20">
                      <Shield className="h-3 w-3" />
                      Anonymous
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
