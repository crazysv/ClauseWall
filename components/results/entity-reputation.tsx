"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldAlert,
  Flag,
  AlertTriangle,
  TrendingUp,
  Users,
  MapPin,
  Loader2,
  Check,
  Skull,
  ArrowRight,
  Search,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getStateName } from "@/lib/utils/constants";
import {
  detectEntityType,
  getEntityTypeLabel,
} from "@/lib/core/entity-extractor";
import type { FlaggedEntity } from "@/types";

interface EntityReputationProps {
  entityName: string | null;
  documentId: string;
  jurisdiction: string;
  documentType: string;
  overallRiskScore: number;
  dangerousClauses: string[];
  illegalClauses: string[];
}

interface ReputationData {
  found: boolean;
  entity: FlaggedEntity | null;
  percentile: number | null;
  totalEntities: number | null;
}

function getRiskBarColor(score: number): string {
  if (score >= 80) return "#ef4444";
  if (score >= 60) return "#f97316";
  if (score >= 40) return "#eab308";
  return "#22c55e";
}

export default function EntityReputation({
  entityName,
  documentId,
  jurisdiction,
  documentType,
  overallRiskScore,
  dangerousClauses,
  illegalClauses,
}: EntityReputationProps) {
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [flagged, setFlagged] = useState(false);

  // Detect entity type
  const entityType = entityName
    ? detectEntityType(entityName, documentType)
    : "other";
  const entityTypeInfo = getEntityTypeLabel(entityType);

  // Fetch reputation on mount
  useEffect(() => {
    if (!entityName) return;

    const fetchReputation = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/flag-entity?name=${encodeURIComponent(entityName)}`,
        );
        const data = await res.json();
        setReputation(data);
      } catch (err) {
        console.error("Failed to fetch reputation:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReputation();
  }, [entityName]);

  // Handle flag submission
  const handleFlag = async () => {
    if (!entityName) return;

    setFlagging(true);
    try {
      const violations = [
        ...dangerousClauses.map((c) => c.substring(0, 100)),
        ...illegalClauses.map((c) => c.substring(0, 100)),
      ].slice(0, 5);

      const res = await fetch("/api/flag-entity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          entityName: entityName.trim(),
          entityType: entityType,
          jurisdiction,
          riskScore: overallRiskScore,
          violations:
            violations.length > 0 ? violations : ["Predatory contract terms"],
        }),
      });

      const data = await res.json();

      if (data.success) {
        setFlagged(true);
        setShowFlagDialog(false);
        toast.success(
          `${entityName} has been flagged! Total flags: ${data.totalFlags}`,
        );

        // Refresh reputation
        const repRes = await fetch(
          `/api/flag-entity?name=${encodeURIComponent(entityName)}`,
        );
        const repData = await repRes.json();
        setReputation(repData);
      } else {
        toast.error(data.error || "Failed to flag entity");
      }
    } catch (err) {
      toast.error("Failed to flag entity");
    } finally {
      setFlagging(false);
    }
  };

  // ============================================
  // STATE: No Entity Identified
  // ============================================
  if (!entityName) {
    return (
      <Card className="card-impact bg-muted">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 border-2 border-foreground bg-background flex items-center justify-center flex-shrink-0">
              <Search className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-foreground">
                Entity Not Identified
              </p>
              <p className="text-xs font-medium text-muted-foreground mt-1">
                Could not extract landlord/company name from this contract. The
                contract may not contain identifiable party names.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================
  // STATE: Loading
  // ============================================
  if (loading) {
    return (
      <Card className="card-impact bg-muted">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-foreground animate-spin" />
            <p className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
              Checking community reputation for{" "}
              <span className="text-foreground font-black">{entityName}</span>
              ...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isKnownBadActor =
    reputation?.found && reputation.entity && reputation.entity.total_flags > 0;
  const flagCount = reputation?.entity?.total_flags || 0;
  const percentile = reputation?.percentile || 0;
  const avgScore = reputation?.entity?.avg_risk_score || 0;
  const commonViolations = reputation?.entity?.common_violations || [];

  // Severity tiers
  const isSevere = flagCount >= 10;
  const isModerate = flagCount >= 3 && flagCount < 10;
  const isMinor = flagCount >= 1 && flagCount < 3;

  return (
    <>
      <Card
        className={`card-impact overflow-hidden transition-all ${isSevere ? "border-red-600 bg-red-50 dark:bg-red-950" : isModerate ? "border-red-600" : isKnownBadActor ? "border-orange-600" : "border-foreground"}`}
      >
        {/* ============================================ */}
        {/* DRAMATIC HEADER — For entities with 3+ flags */}
        {/* ============================================ */}
        {isKnownBadActor && (isModerate || isSevere) && (
          <div className="relative px-4 py-3 bg-red-600 border-b-2 border-foreground">
            {isSevere && (
              <div className="absolute inset-0 bg-red-800 animate-pulse mix-blend-overlay" />
            )}
            <div className="relative flex items-center justify-center gap-2">
              <Skull className="h-4 w-4 text-foreground" />
              <span className="text-sm font-black tracking-widest text-foreground uppercase">
                Entity Reputation Alert
              </span>
              <Skull className="h-4 w-4 text-foreground" />
            </div>
          </div>
        )}

        {/* Red stripe for minor flags */}
        {isMinor && <div className="h-1 bg-orange-500" />}

        <CardContent className="p-6">
          {/* ============================================ */}
          {/* ENTITY HEADER                                */}
          {/* ============================================ */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3">
              <div
                className={`h-12 w-12 rounded-none flex items-center justify-center flex-shrink-0 ${isSevere ? "bg-red-500/15 ring-1 ring-red-500/30" : isKnownBadActor ? "bg-red-500/10" : "bg-blue-500/10"}`}
              >
                {isKnownBadActor ? (
                  <ShieldAlert
                    className={`h-6 w-6 ${isSevere ? "text-red-400" : "text-orange-400"}`}
                  />
                ) : (
                  <Shield className="h-6 w-6 text-blue-400" />
                )}
              </div>
              <div>
                {/* Entity Type Badge */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">
                    {entityTypeInfo.emoji} {entityTypeInfo.label}
                  </span>
                </div>

                {/* Entity Name */}
                <p className="font-bold text-lg leading-tight">{entityName}</p>

                {/* Location + Flag Status */}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {jurisdiction && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {getStateName(jurisdiction)}
                    </span>
                  )}
                  {isSevere && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[10px] font-bold animate-pulse">
                      ⛔ SERIAL OFFENDER
                    </Badge>
                  )}
                  {isModerate && (
                    <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px] font-bold">
                      🔴 FLAGGED {flagCount} TIMES
                    </Badge>
                  )}
                  {isMinor && (
                    <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/30 text-[10px]">
                      ⚠️ FLAGGED
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Flag Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFlagDialog(true)}
              disabled={flagged}
              className={`gap-1.5 flex-shrink-0 ${flagged ? "text-green-400 border-green-500/30" : "text-red-400 border-red-500/30 hover:bg-red-500/10"}`}
            >
              {flagged ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Flagged
                </>
              ) : (
                <>
                  <Flag className="h-3.5 w-3.5" />
                  Flag Entity
                </>
              )}
            </Button>
          </div>

          {/* ============================================ */}
          {/* KNOWN BAD ACTOR — Full reputation display    */}
          {/* ============================================ */}
          {isKnownBadActor && (
            <div className="space-y-4">
              {/* Social Proof Line */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-none bg-red-500/5 border border-red-500/10">
                <Users className="h-4 w-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">
                  <strong>{flagCount}</strong>{" "}
                  {flagCount === 1 ? "user has" : "users have"} reported issues
                  with this entity.
                </p>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-none bg-red-500/10 border border-red-500/10">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flag className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-2xl font-bold text-red-400">
                      {flagCount}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Times Flagged
                  </p>
                </div>
                <div className="text-center p-3 rounded-none bg-orange-500/10 border border-orange-500/10">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-orange-400" />
                    <span className="text-2xl font-bold text-orange-400">
                      {avgScore}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Avg Risk Score
                  </p>
                </div>
                <div className="text-center p-3 rounded-none bg-purple-500/10 border border-purple-500/10">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <BarChart3 className="h-3.5 w-3.5 text-purple-400" />
                    <span className="text-2xl font-bold text-purple-400">
                      {percentile}%
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Worse Than
                  </p>
                </div>
              </div>

              {/* Community Risk Level Bar */}
              {avgScore > 0 && (
                <div className="p-3 rounded-none bg-white/[0.02] border border-foreground border-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Community Risk Level
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: getRiskBarColor(avgScore) }}
                    >
                      {avgScore}/100
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${avgScore}%`,
                        backgroundColor: getRiskBarColor(avgScore),
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Percentile Warning — Severe */}
              {percentile >= 80 && (
                <div className="p-3 rounded-none bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-300 flex items-center gap-2">
                    <Skull className="h-4 w-4 text-red-400 flex-shrink-0" />
                    <span>
                      This entity is in the{" "}
                      <strong className="text-red-400">
                        top {100 - percentile}% most predatory
                      </strong>{" "}
                      {jurisdiction
                        ? `in ${getStateName(jurisdiction)}`
                        : "in our database"}
                      .
                    </span>
                  </p>
                </div>
              )}

              {/* Percentile Warning — Moderate */}
              {percentile >= 50 && percentile < 80 && (
                <div className="p-3 rounded-none bg-orange-500/10 border border-orange-500/20">
                  <p className="text-sm text-orange-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0" />
                    <span>
                      This entity has more flags than{" "}
                      <strong>{percentile}%</strong> of entities in our
                      database.
                    </span>
                  </p>
                </div>
              )}

              {/* Common Violations */}
              {commonViolations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Common Violations Reported
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {commonViolations.slice(0, 5).map((violation, i) => (
                      <Badge
                        key={i}
                        className="bg-red-500/10 text-red-300 border-red-500/20 text-xs"
                      >
                        {violation.length > 60
                          ? violation.substring(0, 60) + "..."
                          : violation}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Wall of Shame Link */}
              <Link
                href="/wall-of-shame"
                className="flex items-center justify-between p-3 rounded-none bg-white/[0.03] border border-foreground border-2 hover:bg-white/[0.06] transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Skull className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-muted-foreground">
                    View Wall of Shame
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}

          {/* ============================================ */}
          {/* CLEAN ENTITY — No flags found                */}
          {/* ============================================ */}
          {!isKnownBadActor && (
            <div className="space-y-3">
              <div className="p-3 rounded-none bg-green-500/5 border border-green-500/15">
                <p className="text-sm text-green-400 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  No community flags found for this entity.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This is the first time ClauseWall is seeing this entity. If
                  you find this contract unfair, flag it to help others.
                </p>
              </div>

              {/* Show current contract risk context */}
              {overallRiskScore >= 60 && (
                <div className="p-3 rounded-none bg-yellow-500/5 border border-yellow-500/15">
                  <p className="text-xs text-yellow-300 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      This contract scored{" "}
                      <strong>{overallRiskScore}/100</strong> risk. Consider
                      flagging this entity to alert future users.
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* FLAG CONFIRMATION DIALOG                     */}
      {/* ============================================ */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent className="bg-background border-2 border-foreground card-impact border-foreground border-2 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-400" />
              Flag {entityName}
            </DialogTitle>
            <DialogDescription>
              You&apos;re about to flag this entity for predatory contract
              practices. This helps other users identify risky{" "}
              {entityType === "landlord"
                ? "landlords"
                : entityType === "employer"
                  ? "employers"
                  : "entities"}
              .
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="p-3 rounded-none bg-muted border border-foreground border-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground">
                  {entityTypeInfo.emoji} {entityTypeInfo.label}
                </span>
              </div>
              <p className="text-sm font-medium">{entityName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Risk Score: {overallRiskScore}/100 •{" "}
                {getStateName(jurisdiction)}
              </p>
            </div>

            {(dangerousClauses.length > 0 || illegalClauses.length > 0) && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Issues found in this contract:
                </p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {illegalClauses.slice(0, 3).map((clause, i) => (
                    <div
                      key={`illegal-${i}`}
                      className="flex items-start gap-2 text-xs"
                    >
                      <span className="text-purple-400">⛔</span>
                      <span className="text-muted-foreground line-clamp-2">
                        {clause}
                      </span>
                    </div>
                  ))}
                  {dangerousClauses.slice(0, 3).map((clause, i) => (
                    <div
                      key={`danger-${i}`}
                      className="flex items-start gap-2 text-xs"
                    >
                      <span className="text-red-400">🔴</span>
                      <span className="text-muted-foreground line-clamp-2">
                        {clause}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 rounded-none bg-yellow-500/5 border border-yellow-500/15">
              <p className="text-xs text-yellow-300">
                <strong>Note:</strong> All flags are anonymous. Your personal
                information is never shared. This report helps the community
                identify predatory patterns.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setShowFlagDialog(false)}
              disabled={flagging}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFlag}
              disabled={flagging}
              className="gap-2 bg-red-600 hover:bg-red-700"
            >
              {flagging ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Flagging...
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4" />
                  Flag This Entity
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
