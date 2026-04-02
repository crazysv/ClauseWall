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
  Building2,
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
  if (score >= 80) return "#ef4444"; // rose-500
  if (score >= 60) return "#f97316"; // orange-500
  if (score >= 40) return "#f59e0b"; // amber-500
  return "#10b981"; // emerald-500
}

export function EntityReputation({
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
          `/api/flag-entity?name=${encodeURIComponent(entityName)}`
        );
        const data = await res.json();
        setReputation(data);
      } catch {
        // Silently handled
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
            violations.length > 0
              ? violations
              : ["Predatory contract terms"],
        }),
      });

      const data = await res.json();

      if (data.success) {
        setFlagged(true);
        setShowFlagDialog(false);
        toast.success(
          `${entityName} has been flagged! Total flags: ${data.totalFlags}`
        );

        // Refresh reputation
        const repRes = await fetch(
          `/api/flag-entity?name=${encodeURIComponent(entityName)}`
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
      <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-xl shadow-sm dark:shadow-slate-900/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-100 shadow-sm dark:shadow-slate-900/20">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-0.5">
                Entity Not Identified
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                Could not extract landlord/company name from this contract.
                The contract may not contain identifiable party names.
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
      <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-xl shadow-sm dark:shadow-slate-900/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 border border-indigo-100 shadow-sm dark:shadow-slate-900/20">
              <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-0.5">
                Connecting to Wall of Shame...
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Checking community reputation for <span className="text-indigo-600 font-bold">{entityName}</span>
              </p>
            </div>
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
      <div
        className={`rounded-2xl overflow-hidden border transition-all shadow-sm dark:shadow-slate-900/20 ${ isSevere ? "bg-rose-50/50 border-rose-200 shadow-rose-100 ring-2 ring-rose-100" : isModerate ? "bg-white dark:bg-card border-red-200" : isKnownBadActor ? "bg-white dark:bg-card border-orange-200" : "bg-white dark:bg-card border-slate-200 dark:border-slate-700" }`}
      >
        {/* ============================================ */}
        {/* DRAMATIC HEADER — For entities with 3+ flags */}
        {/* ============================================ */}
        {isKnownBadActor && (isModerate || isSevere) && (
          <div className={`px-4 py-2 border-b flex items-center justify-center gap-2 ${isSevere ? "bg-rose-600 border-rose-700 pattern-diagonal-lines pattern-red-700 pattern-bg-red-600 pattern-size-4 pattern-opacity-20 animate-pulse-once text-white" : "bg-red-50 border-red-100 text-red-600"}`}>
            <Skull className="h-4 w-4" />
            <span className="text-xs font-black tracking-[0.2em] uppercase">
              {isSevere ? "Critical Reputation Alert" : "Entity Reputation Alert"}
            </span>
            <Skull className="h-4 w-4" />
          </div>
        )}

        {/* Orange stripe for minor flags */}
        {isMinor && <div className="h-1.5 bg-gradient-to-r from-orange-400 to-amber-400" />}
        {!isKnownBadActor && <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-400" />}

        <div className="p-5 sm:p-6">
          {/* ============================================ */}
          {/* ENTITY HEADER                                */}
          {/* ============================================ */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div
                className={`h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm dark:shadow-slate-900/20 border ${ isSevere ? "bg-rose-100 border-rose-300" : isKnownBadActor ? "bg-red-50 border-red-200" : "bg-indigo-50 border-indigo-100" }`}
              >
                {isKnownBadActor ? (
                  <ShieldAlert
                    className={`h-7 w-7 ${
                      isSevere ? "text-rose-600" : "text-red-500"
                    }`}
                  />
                ) : (
                  <Building2 className="h-7 w-7 text-indigo-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    {entityTypeInfo.emoji} {entityTypeInfo.label}
                  </span>
                  
                  {isSevere && (
                    <Badge className="bg-rose-600 text-white border-rose-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 animate-pulse shadow-sm dark:shadow-slate-900/20">
                      ⛔ Serial Offender
                    </Badge>
                  )}
                  {isModerate && (
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                      🔴 Flagged {flagCount} Times
                    </Badge>
                  )}
                  {isMinor && (
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                      ⚠️ Flagged
                    </Badge>
                  )}
                  {!isKnownBadActor && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                      ✓ Clean Record
                    </Badge>
                  )}
                </div>

                <h2 className="font-extrabold text-lg md:text-xl lg:text-2xl text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-2 break-all">{entityName}</h2>

                {jurisdiction && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {getStateName(jurisdiction)} Registration
                  </span>
                )}
              </div>
            </div>

            {/* Flag Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFlagDialog(true)}
              disabled={flagged}
              className={`gap-1.5 flex-shrink-0 font-bold border-2 rounded-xl shadow-sm dark:shadow-slate-900/20 transition-all ${ flagged ? "text-emerald-600 border-emerald-200 bg-emerald-50 opacity-100 cursor-default" : "text-rose-600 border-rose-200 bg-white dark:bg-card hover:bg-rose-50 hover:text-rose-700" }`}
            >
              {flagged ? (
                <>
                  <Check className="h-4 w-4" />
                  Flag Recorded
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4" />
                  Report Entity
                </>
              )}
            </Button>
          </div>

          {/* ============================================ */}
          {/* KNOWN BAD ACTOR — Full reputation display    */}
          {/* ============================================ */}
          {isKnownBadActor && (
            <div className="space-y-6">
              
              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col justify-center p-4 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Community Flags</p>
                  <div className="flex items-center justify-center gap-2">
                    <Flag className="h-5 w-5 text-rose-500" />
                    <span className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-rose-600 tracking-tighter">
                      {flagCount}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col justify-center p-4 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 relative overflow-hidden">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Avg Risk Score</p>
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black tracking-tighter" style={{ color: getRiskBarColor(avgScore) }}>
                      {avgScore}
                    </span>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${avgScore}%`, backgroundColor: getRiskBarColor(avgScore) }} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center p-4 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Worse Than</p>
                  <div className="flex items-center justify-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                    <span className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-indigo-600 tracking-tighter">
                      {percentile}%
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 text-center font-bold mt-0.5">market average</p>
                </div>
              </div>

              {/* Social Proof Line */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 shadow-sm dark:shadow-slate-900/20">
                <div className="p-1.5 bg-white dark:bg-card rounded-lg shadow-sm dark:shadow-slate-900/20 border border-rose-100 shrink-0">
                  <Users className="h-4 w-4 text-rose-500" />
                </div>
                <p className="text-sm font-medium text-rose-900 leading-snug">
                  <strong>{flagCount}</strong> {flagCount === 1 ? "ClauseWall user has" : "ClauseWall users have"} officially reported predatory intent or unconscionable clauses tied to this entity.
                </p>
              </div>

              {/* Percentile Warning — Severe */}
              {percentile >= 80 && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 border border-red-700 shadow-md text-white">
                  <p className="text-sm font-bold flex items-start gap-3 leading-snug">
                    <AlertTriangle className="h-5 w-5 text-red-200 flex-shrink-0 mt-0.5" />
                    <span>
                      This entity operates in the <strong className="text-white bg-red-800/50 px-1 rounded">top {100 - percentile}% most predatory</strong> percentile {jurisdiction ? `in ${getStateName(jurisdiction)}` : "in our database"}. High chance of financial coercion.
                    </span>
                  </p>
                </div>
              )}

              {/* Percentile Warning — Moderate */}
              {percentile >= 50 && percentile < 80 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 shadow-sm dark:shadow-slate-900/20">
                  <p className="text-sm font-bold text-amber-900 flex items-start gap-3 leading-snug">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>
                      This entity issues contracts that contain more legal traps than <strong>{percentile}%</strong> of the standard market baseline.
                    </span>
                  </p>
                </div>
              )}

              {/* Common Violations List */}
              {commonViolations.length > 0 && (
                <div className="bg-white dark:bg-card p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Community Flagged DNA Vectors</p>
                  <div className="flex flex-col gap-2.5">
                    {commonViolations.slice(0, 5).map((violation, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm text-slate-700 font-semibold leading-snug">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0 shadow-sm dark:shadow-slate-900/20" />
                        {violation}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wall of Shame Link */}
              <Link
                href="/wall-of-shame"
                className="flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700 hover:underline underline-offset-4 py-2 group transition-all w-fit"
              >
                View Full Dossier on the Wall of Shame <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}

          {/* ============================================ */}
          {/* CLEAN ENTITY — No flags found                */}
          {/* ============================================ */}
          {!isKnownBadActor && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm dark:shadow-slate-900/20">
                <p className="text-sm font-bold text-emerald-900 flex items-start gap-3 leading-snug">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>No community flags found. This is the first time the ClauseWall network is analyzing an agreement from this entity.</span>
                </p>
                <p className="text-xs font-semibold text-emerald-700/80 mt-2 ml-8">
                  If you finalize your review and discover predatory clauses, reporting the entity helps protect future individuals.
                </p>
              </div>

              {/* Show current contract risk context */}
              {overallRiskScore >= 60 && (
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 shadow-sm dark:shadow-slate-900/20">
                  <p className="text-sm font-bold text-orange-900 flex items-start gap-3 leading-snug">
                    <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                    <span>
                      Despite having a clean record, this specific contract scored an alarming <strong className="bg-orange-200 px-1 rounded">{overallRiskScore}/100</strong> risk. We strongly advise flagging this entity to alert future negotiators.
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* FLAG CONFIRMATION DIALOG                     */}
      {/* ============================================ */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 max-w-md rounded-2xl shadow-2xl p-0 overflow-hidden">
          <div className="bg-rose-50 border-b border-rose-100 p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-black text-rose-900">
                <Flag className="h-5 w-5 text-rose-600" />
                Flag {entityName}
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-rose-800/80 pt-2">
                You are initiating a community report against this {entityType === "landlord" ? "landlord" : entityType === "employer" ? "employer" : "entity"}. ClauseWall depends on crowdsourced intelligence to map predatory behavior across India.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-inner">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {entityTypeInfo.emoji} Target Profile
                </span>
              </div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{entityName}</p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                Risk Assessed: <span className="text-rose-600">{overallRiskScore}/100</span> • {getStateName(jurisdiction)}
              </p>
            </div>

            {(dangerousClauses.length > 0 || illegalClauses.length > 0) && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Evidence of Predatory Terms:
                </p>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-2 scrollbar-thin">
                  {illegalClauses.slice(0, 3).map((clause, i) => (
                     <div key={`illegal-${i}`} className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 bg-white dark:bg-card border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg shadow-sm dark:shadow-slate-900/20">
                       <span className="text-purple-600 mt-0.5"><Skull className="w-3.5 h-3.5"/></span>
                       <span className="line-clamp-2 leading-relaxed">{clause}</span>
                     </div>
                  ))}
                  {dangerousClauses.slice(0, 3).map((clause, i) => (
                    <div key={`danger-${i}`} className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 bg-white dark:bg-card border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg shadow-sm dark:shadow-slate-900/20">
                      <span className="text-rose-500 mt-0.5"><AlertTriangle className="w-3.5 h-3.5"/></span>
                      <span className="line-clamp-2 leading-relaxed">{clause}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 bg-amber-50 rounded-lg flex gap-3 border border-amber-200 items-start">
              <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-amber-900 leading-snug">
                This flag is strictly anonymous. Your personal data is stripped before inclusion in the Market Intelligence vector database.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 p-6 pt-0">
            <Button
              variant="outline"
              onClick={() => setShowFlagDialog(false)}
              disabled={flagging}
              className="font-bold border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleFlag}
              disabled={flagging}
              className="gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md"
            >
              {flagging ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Transmitting Flag...
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4" />
                  Submit Anonymous Flag
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}