"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  XCircle,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import {
  getRiskLevel,
  getRiskLabel,
  getStateName,
  getDocumentTypeLabel,
  RISK_COLORS,
} from "@/lib/utils/constants";
import type { Document, Clause } from "@/types";
import { toast } from "sonner";
import { useSound } from "@/lib/audio/sound-context";
import ClauseCard from "@/components/results/clause-card";
import QRSection from "@/components/results/qr-section";
import EntityReputation from "@/components/results/entity-reputation";
import MismatchBanner from "@/components/results/mismatch-banner";
import ScoreCardModal from "@/components/results/score-card-modal";
import VideoCardModal from "@/components/results/video-card-modal";
import ContractDNAModal from "@/components/results/contract-dna-modal";
import { XRayOverlay } from "@/components/results/xray-mode";
import FloatingActions from "@/components/results/floating-actions";
import ClauseAutopsyModal from "@/components/results/clause-autopsy-modal";
import EscapeCTA from "@/components/results/escape-cta";
import SimulatorCTA from "@/components/results/simulator-cta";
import PowerBalanceMeter from "@/components/results/power-balance-meter";
import ClauseRewriteModal from "@/components/results/clause-rewrite-modal";
import MoodRingBackground from "@/components/results/mood-ring-background";

interface HybridClause extends Clause {
  verification_source?: "database" | "ai";
  confidence?: "verified" | "partial" | "ai_suggested";
  matched_rule_id?: string | null;
  negotiation_script?: string | null;
  penalty_info?: string | null;
}

export default function ResultsPage() {
  const params = useParams();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [clauses, setClauses] = useState<HybridClause[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedClauses, setExpandedClauses] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [filterRisk, setFilterRisk] = useState<string>("all");

  // Modal states
  const [showScoreCard, setShowScoreCard] = useState(false);
  const [showVideoCard, setShowVideoCard] = useState(false);
  const [showDNA, setShowDNA] = useState(false);
  const [showXRay, setShowXRay] = useState(false);

  // 🔬 AUTOPSY
  const [autopsyClause, setAutopsyClause] = useState<HybridClause | null>(null);

  const [rewriteClause, setRewriteClause] = useState<HybridClause | null>(null);

  // 🌈 MOOD RING
  const [activeClauseIndex, setActiveClauseIndex] = useState<number | null>(null);
  const [isInClauseZone, setIsInClauseZone] = useState(false);
  const clauseListRef = useRef<HTMLDivElement>(null);

  // 🔥 ROAST MODE
  const [isRoastMode, setIsRoastMode] = useState(false);
  const [roastCache, setRoastCache] = useState<Map<string, string>>(new Map());
  const [roastLoading, setRoastLoading] = useState(false);
  const roastFetched = useRef(false);

  // Sound system
  const { playRiskSound, isMuted } = useSound();
  const soundTriggered = useRef(false);
  const isMutedRef = useRef(isMuted);

  const supabase = createClient();

  // Keep mute ref in sync
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const verificationStats = {
    verified: clauses.filter((c) => c.confidence === "verified").length,
    partial: clauses.filter((c) => c.confidence === "partial").length,
    ai_suggested: clauses.filter(
      (c) => c.confidence === "ai_suggested" || !c.confidence
    ).length,
    verification_rate:
      clauses.length > 0
        ? Math.round(
            (clauses.filter((c) => c.confidence === "verified").length /
              clauses.length) *
              100
          )
        : 0,
  };

  const fetchData = async () => {
    try {
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single();

      if (docError || !doc) {
        setError("Document not found");
        setLoading(false);
        return;
      }

      setDocument(doc as Document);

      if (doc.analysis_status === "completed") {
        const { data: clauseData, error: clauseError } = await supabase
          .from("clauses")
          .select("*")
          .eq("document_id", documentId)
          .order("clause_number", { ascending: true });

        if (!clauseError && clauseData) {
          setClauses(clauseData as HybridClause[]);
        }
      }

      setLoading(false);
    } catch (err) {
      setError("Failed to load results");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [documentId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (
      document?.analysis_status === "analyzing" ||
      document?.analysis_status === "pending"
    ) {
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [document?.analysis_status]);

  // ═══════════════════════════════════════════
  // 🔊 SOUND EFFECT + SCREEN SHAKE TRIGGER
  // ═══════════════════════════════════════════
  useEffect(() => {
    if (soundTriggered.current) return;
    if (!document || document.analysis_status !== "completed") return;
    if (clauses.length === 0) return;

    soundTriggered.current = true;

    const sessionKey = `clausewall_sound_played_${documentId}`;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, "true");

    const timeout = setTimeout(() => {
      const riskLevel = getRiskLevel(document.overall_risk_score);
      playRiskSound(riskLevel);

      if (!isMutedRef.current) {
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

        if (!prefersReducedMotion) {
          const body = window.document.body;

          if (riskLevel === "illegal") {
            body.classList.add("screen-shake-intense", "red-vignette");
            setTimeout(() => {
              body.classList.remove("screen-shake-intense", "red-vignette");
            }, 1000);
          } else if (riskLevel === "dangerous") {
            body.classList.add("screen-shake-subtle");
            setTimeout(() => {
              body.classList.remove("screen-shake-subtle");
            }, 400);
          }
        }
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [document?.analysis_status, clauses.length, documentId, playRiskSound]);

  const filteredClauses =
    filterRisk === "all"
      ? clauses
      : clauses.filter((c) => c.risk_level === filterRisk);

  // ═══════════════════════════════════════════
  // 🌈 MOOD RING — SCROLL TRACKING
  // ═══════════════════════════════════════════
  useEffect(() => {
    const container = clauseListRef.current;
    if (!container || filteredClauses.length === 0) return;

    let ticking = false;

    const updateActiveClause = () => {
      const cards = container.querySelectorAll("[data-clause-index]");
      if (cards.length === 0) {
        setIsInClauseZone(false);
        setActiveClauseIndex(null);
        return;
      }

      // Check if clause zone is visible at all
      const containerRect = container.getBoundingClientRect();
      const inZone =
        containerRect.top < window.innerHeight && containerRect.bottom > 0;
      setIsInClauseZone(inZone);

      if (!inZone) {
        setActiveClauseIndex(null);
        return;
      }

      // Find clause card closest to viewport center
      const viewportCenter = window.innerHeight / 2;
      let closestIndex = -1;
      let closestDistance = Infinity;

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        // Skip cards fully off-screen
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;

        const cardCenter = rect.top + rect.height / 2;
        const distance = Math.abs(cardCenter - viewportCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = parseInt(
            card.getAttribute("data-clause-index") || "-1"
          );
        }
      });

      if (closestIndex >= 0) {
        setActiveClauseIndex(closestIndex);
      }
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateActiveClause();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateActiveClause(); // Initial check

    return () => window.removeEventListener("scroll", onScroll);
  }, [filteredClauses.length, filterRisk]);

  // Derived mood risk level
  const activeMoodRisk =
    activeClauseIndex !== null && activeClauseIndex < filteredClauses.length
      ? filteredClauses[activeClauseIndex].risk_level
      : null;

  // Scroll-to-clause for mood bar dot clicks
  const scrollToClause = useCallback((index: number) => {
    const el = clauseListRef.current?.querySelector(
      `[data-clause-index="${index}"]`
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // ═══════════════════════════════════════════
  // 🔥 ROAST MODE LOGIC
  // ═══════════════════════════════════════════
  const fetchRoasts = useCallback(async () => {
    if (roastFetched.current || clauses.length === 0) return;

    const roastableClauses = clauses.filter(
      (c) => c.risk_level === "dangerous" || c.risk_level === "illegal"
    );

    if (roastableClauses.length === 0) {
      toast.info("No dangerous or illegal clauses to roast! 🎉");
      setIsRoastMode(false);
      return;
    }

    setRoastLoading(true);

    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clauses: roastableClauses.map((c) => ({
            id: c.id,
            clause_number: c.clause_number,
            clause_type: c.clause_type,
            original_text: c.original_text,
            risk_level: c.risk_level,
            explanation: c.explanation,
          })),
          jurisdiction: document?.jurisdiction,
          documentType: document?.document_type,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Roast failed");
      }

      if (data.roasts && typeof data.roasts === "object") {
        const newCache = new Map<string, string>();
        for (const [id, text] of Object.entries(data.roasts)) {
          if (typeof text === "string") {
            newCache.set(id, text);
          }
        }
        setRoastCache(newCache);
        roastFetched.current = true;
        toast.success(`${newCache.size} clauses roasted! 🔥`);
      }
    } catch (err) {
      console.error("[ClauseWall] Roast fetch failed:", err);
      toast.error("Failed to generate roasts. Try again.");
      setIsRoastMode(false);
    } finally {
      setRoastLoading(false);
    }
  }, [clauses, document?.jurisdiction, document?.document_type]);

  const handleToggleRoast = useCallback(() => {
    if (isRoastMode) {
      // Turning OFF — instant, no API call
      setIsRoastMode(false);
      toast("Roast mode off. Back to business. 📋");
    } else {
      // Turning ON
      setIsRoastMode(true);

      if (!roastFetched.current) {
        // First time — fetch roasts
        fetchRoasts();
      } else {
        toast("🔥 Roast mode activated!");
      }
    }
  }, [isRoastMode, fetchRoasts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success("Results refreshed");
  };

  const toggleClause = (clauseId: string) => {
    const newExpanded = new Set(expandedClauses);
    if (newExpanded.has(clauseId)) {
      newExpanded.delete(clauseId);
    } else {
      newExpanded.add(clauseId);
    }
    setExpandedClauses(newExpanded);
  };

  const expandAll = () => {
    setExpandedClauses(new Set(filteredClauses.map((c) => c.id)));
  };

  const collapseAll = () => {
    setExpandedClauses(new Set());
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-400">{error || "Document not found"}</p>
        <Link href="/upload">
          <Button>Upload New Document</Button>
        </Link>
      </div>
    );
  }

  if (
    document.analysis_status === "pending" ||
    document.analysis_status === "analyzing"
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="relative">
          <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
          <div className="absolute inset-0 h-16 w-16 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Analyzing Your Contract</h2>
          <p className="text-muted-foreground max-w-md">
            Checking against 750+ verified Indian legal rules. This typically
            takes 30-60 seconds.
          </p>
        </div>
        <div className="w-64">
          <Progress value={33} className="h-2" />
        </div>
      </div>
    );
  }

  if (document.analysis_status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-2xl font-bold text-red-400">Analysis Failed</h2>
        <p className="text-muted-foreground text-center max-w-md">
          {document.summary || "Something went wrong. Please try again."}
        </p>
        <Link href="/upload">
          <Button>Try Again</Button>
        </Link>
      </div>
    );
  }

  const riskLevel = getRiskLevel(document.overall_risk_score);
  const riskColor = RISK_COLORS[riskLevel];

  return (
    <>
      {/* 🌈 Mood Ring Background */}
      <MoodRingBackground
        activeRiskLevel={activeMoodRisk}
        isInClauseZone={isInClauseZone}
      />
      <div className="relative px-4 sm:px-6 lg:px-8 py-8">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <FileText className="h-4 w-4" />
              <span>{document.original_filename || "Analyzed Document"}</span>
              <span>•</span>
              <span>{getDocumentTypeLabel(document.document_type)}</span>
              <span>•</span>
              <span>{getStateName(document.jurisdiction)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Analysis Results
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Mismatch Warning */}
        <MismatchBanner
          documentId={documentId}
          selectedJurisdiction={document.jurisdiction}
          detectedJurisdiction={document.detected_jurisdiction}
          selectedDocType={document.document_type}
          detectedDocType={document.detected_document_type}
        />

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900/50 border-gray-800 md:col-span-2">
            <CardContent className="p-6 flex items-center gap-6">
              <div
                className="relative h-24 w-24 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: `conic-gradient(${riskColor} ${document.overall_risk_score}%, transparent 0)`,
                }}
              >
                <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold" style={{ color: riskColor }}>
                    {document.overall_risk_score}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Overall Risk Score</p>
                <p className="text-xl font-bold" style={{ color: riskColor }}>
                  {getRiskLabel(riskLevel)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {document.total_clauses} clauses analyzed
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6 flex flex-col justify-center h-full">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">{document.safe_count}</p>
                  <p className="text-xs text-muted-foreground">Safe</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-500">{document.warning_count}</p>
                  <p className="text-xs text-muted-foreground">Warning</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">{document.dangerous_count}</p>
                  <p className="text-xs text-muted-foreground">Dangerous</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-500">{document.illegal_count}</p>
                  <p className="text-xs text-muted-foreground">Illegal</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6 flex flex-col justify-center h-full">
              <p className="text-sm text-muted-foreground mb-2">Identified Entity</p>
              <p className="font-semibold truncate">
                {document.entity_name || "Not identified"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        {document.summary && (
          <Card className="bg-gray-900/50 border-gray-800 mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-400" />
                Summary
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {document.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Power Balance */}
        <div className="mb-8">
          <PowerBalanceMeter
            powerBalance={document.power_balance ?? null}
          />
        </div>

        {/* Entity Reputation */}
        <div className="mb-8">
          <EntityReputation
            entityName={document.entity_name}
            documentId={documentId}
            jurisdiction={document.jurisdiction}
            documentType={document.document_type}
            overallRiskScore={document.overall_risk_score}
            dangerousClauses={clauses
              .filter((c) => c.risk_level === "dangerous")
              .map((c) => c.explanation)}
            illegalClauses={clauses
              .filter((c) => c.risk_level === "illegal")
              .map((c) => c.explanation)}
          />
        </div>

        {/* Verification Stats */}
        <Card className="bg-gray-900/50 border-gray-800 mb-8">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-400" />
              Legal Database Verification
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-green-500/10">
                <p className="text-2xl font-bold text-green-400">{verificationStats.verified}</p>
                <p className="text-xs text-muted-foreground">Verified ✓</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                <p className="text-2xl font-bold text-yellow-400">{verificationStats.partial}</p>
                <p className="text-xs text-muted-foreground">Partial</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-500/10">
                <p className="text-2xl font-bold text-blue-400">{verificationStats.ai_suggested}</p>
                <p className="text-xs text-muted-foreground">AI-Only</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <p className="text-2xl font-bold">{verificationStats.verification_rate}%</p>
                <p className="text-xs text-muted-foreground">Verified Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

                {/* ═══ CLAUSE SECTION — MOOD RING ZONE ═══ */}
        <div>
          {/* Clause Header + Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold">Clause Analysis</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { value: "all", label: "All", count: clauses.length },
                {
                  value: "illegal",
                  label: "Illegal",
                  count: document.illegal_count,
                  color: "text-purple-400",
                },
                {
                  value: "dangerous",
                  label: "Dangerous",
                  count: document.dangerous_count,
                  color: "text-red-400",
                },
                {
                  value: "warning",
                  label: "Warning",
                  count: document.warning_count,
                  color: "text-yellow-400",
                },
                {
                  value: "safe",
                  label: "Safe",
                  count: document.safe_count,
                  color: "text-green-400",
                },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterRisk(filter.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    filterRisk === filter.value
                      ? "bg-white/10 border-white/20 text-white"
                      : "bg-white/[0.02] border-white/5 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <span className={filter.color}>{filter.count}</span>{" "}
                  {filter.label}
                </button>
              ))}

              <span className="text-gray-700">|</span>

              <button
                onClick={expandAll}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Clause Cards */}
          <div className="space-y-3" ref={clauseListRef}>
            {filteredClauses.map((clause, index) => (
              <motion.div
                key={clause.id}
                data-clause-index={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <ClauseCard
                  clause={clause}
                  isExpanded={expandedClauses.has(clause.id)}
                  onToggle={() => toggleClause(clause.id)}
                  jurisdiction={document.jurisdiction}
                  onAutopsy={() => setAutopsyClause(clause)}
                  onRewrite={() => setRewriteClause(clause)}
                  isRoastMode={isRoastMode}
                  roastText={roastCache.get(clause.id) || null}
                />
              </motion.div>
            ))}
          </div>

          {/* No results for filter */}
          {filteredClauses.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No {filterRisk} clauses found.</p>
              <button
                onClick={() => setFilterRisk("all")}
                className="text-blue-400 text-sm mt-2 hover:underline"
              >
                Show all clauses
              </button>
            </div>
          )}
        </div>

        {/* QR Verification Badge */}
        <QRSection document={document} />

        {/* Escape Plan CTA */}
        <EscapeCTA
          documentId={documentId}
          dangerousCount={document.dangerous_count}
          illegalCount={document.illegal_count}
        />

        {/* Simulator CTA */}
        <SimulatorCTA
          documentId={documentId}
          overallRiskScore={document.overall_risk_score}
        />
      </div>

      {/* ── Floating Action Sidebar ── */}
      <FloatingActions
        document={document}
        clauses={clauses}
        onOpenDNA={() => setShowDNA(true)}
        onOpenXRay={() => setShowXRay(true)}
        onOpenScoreCard={() => setShowScoreCard(true)}
        onOpenVideoCard={() => setShowVideoCard(true)}
        isRoastMode={isRoastMode}
        roastLoading={roastLoading}
        onToggleRoast={handleToggleRoast}
      />

      {/* ── X-Ray Overlay ── */}
      <AnimatePresence>
        {showXRay && (
          <XRayOverlay
            document={document}
            clauses={clauses}
            onClose={() => setShowXRay(false)}
          />
        )}
      </AnimatePresence>

      {/* ── DNA Modal ── */}
      <ContractDNAModal
        isOpen={showDNA}
        onClose={() => setShowDNA(false)}
        contractDoc={document}
        clauses={clauses}
      />

      {/* ── Score Card Modal ── */}
      <ScoreCardModal
        isOpen={showScoreCard}
        onClose={() => setShowScoreCard(false)}
        document={document}
        clauses={clauses}
        verificationRate={verificationStats.verification_rate}
      />

      {/* ── Video Card Modal ── */}
      <VideoCardModal
        isOpen={showVideoCard}
        onClose={() => setShowVideoCard(false)}
        document={document}
        clauses={clauses}
        verificationRate={verificationStats.verification_rate}
      />

      {/* ── Clause Autopsy Modal ── */}
      <ClauseAutopsyModal
        isOpen={!!autopsyClause}
        onClose={() => setAutopsyClause(null)}
        clause={autopsyClause}
        jurisdiction={document.jurisdiction}
        documentType={document.document_type}
      />

      {/* ── Clause Rewrite Modal ── */}
      <ClauseRewriteModal
        isOpen={!!rewriteClause}
        onClose={() => setRewriteClause(null)}
        clause={rewriteClause}
        jurisdiction={document.jurisdiction}
        documentType={document.document_type}
      />
    </div>
  </>
  );
}