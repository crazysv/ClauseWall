"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  ShieldAlert,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EntityIntelligence } from "@/types";
import JoinCollectiveModal from "./join-collective-modal";
import ThresholdProgress from "./threshold-progress";

interface Props {
  entityName: string | null;
  documentId: string;
  jurisdiction: string;
  documentType: string;
}

export default function EntityIntelligenceCard({
  entityName,
  documentId,
  jurisdiction,
  documentType,
}: Props) {
  const [intelligence, setIntelligence] = useState<EntityIntelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    if (!entityName) return;

    const fetchIntelligence = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          entity: entityName,
          jurisdiction,
          documentType,
        });
        const res = await fetch(`/api/collective/intelligence?${params}`);
        const data = await res.json();
        if (data?.entity) {
          setIntelligence(data as EntityIntelligence);
        }
      } catch (err) {
        console.error("[ClauseWall] Intelligence fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIntelligence();
  }, [entityName, jurisdiction, documentType]);

  if (!entityName || loading || !intelligence) return null;

  const { entity, collective, user_membership, leverage, strength_assessment } = intelligence;

  const strengthColors = {
    very_strong: "text-green-400 bg-green-500/10",
    strong: "text-emerald-400 bg-emerald-500/10",
    moderate: "text-amber-400 bg-amber-500/10",
    weak: "text-orange-400 bg-orange-500/10",
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent overflow-hidden">
          {/* Header stripe */}
          <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

          <CardContent className="p-5">
            {/* Title row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Community Intelligence
                  </h3>
                  <p className="text-[10px] text-white/40">
                    {entity.total_flags} community flags • {entity.total_documents} documents
                  </p>
                </div>
              </div>
              <Badge className={`text-[10px] ${strengthColors[strength_assessment]}`}>
                {strength_assessment.replace("_", " ")}
              </Badge>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                <p className="text-lg font-bold text-amber-400">{entity.total_flags}</p>
                <p className="text-[10px] text-white/40">Flags</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                <p className="text-lg font-bold text-orange-400">
                  {entity.common_violations.length}
                </p>
                <p className="text-[10px] text-white/40">Violations</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                <p className="text-lg font-bold text-red-400">{entity.avg_risk_score}</p>
                <p className="text-[10px] text-white/40">Avg Risk</p>
              </div>
            </div>

            {/* Common violations */}
            {entity.common_violations.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
                  Most Common Violations
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {entity.common_violations.slice(0, 4).map((v, i) => (
                    <Badge
                      key={i}
                      className="bg-red-500/10 text-red-300/80 text-[10px] border-red-500/20"
                    >
                      {v.clause_type} ({v.occurrence_count}x)
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Collective section */}
            {collective ? (
              <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium text-white">
                      Active Collective
                    </span>
                  </div>
                  <Badge className="text-[10px] bg-amber-500/10 text-amber-400">
                    {collective.member_count} members
                  </Badge>
                </div>

                <ThresholdProgress
                  current={collective.member_count}
                  threshold={collective.threshold}
                />

                {user_membership ? (
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    You&apos;re a member • {user_membership.anonymous_id}
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setShowJoin(true)}
                    className="w-full mt-2 bg-amber-600 hover:bg-amber-700 gap-2 text-xs"
                  >
                    <Users className="h-3 w-3" />
                    Join Collective — Strengthen Community Action
                  </Button>
                )}
              </div>
            ) : entity.total_flags >= 2 ? (
              <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-orange-400" />
                  <span className="text-xs text-white/60">
                    {entity.total_flags} flags recorded — collective forming soon
                  </span>
                </div>
              </div>
            ) : null}

            {/* Leverage teaser */}
            {leverage && (
              <div className="flex items-center justify-between rounded-lg bg-white/[0.02] p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-white/60">
                    Collective action is{" "}
                    <span className="text-green-400 font-medium">
                      {leverage.collective.multiplier}x
                    </span>{" "}
                    more cost-effective
                  </span>
                </div>
                {collective && (
                  <a
                    href={`/collective/${collective.id}`}
                    className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    Details <ArrowRight className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Join Modal */}
      {showJoin && collective && (
        <JoinCollectiveModal
          collectiveId={collective.id}
          entityName={entity.entity_name}
          memberCount={collective.member_count}
          documentId={documentId}
          onClose={() => setShowJoin(false)}
          onJoined={() => {
            setShowJoin(false);
            // Refetch intelligence
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
