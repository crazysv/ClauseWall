"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  FileStack,
  XCircle,
  FileText,
  Loader2,
  RefreshCw,
  ChevronDown,
  BarChart3,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
import FloatingActions from "@/components/results/floating-actions";
import EscapeCTA from "@/components/results/escape-cta";
import SimulatorCTA from "@/components/results/simulator-cta";
import PowerBalanceMeter from "@/components/results/power-balance-meter";
import { NextSteps } from "@/components/results/next-steps";
import ClauseRewriteModal from "@/components/results/clause-rewrite-modal";
import MoodRingBackground from "@/components/results/mood-ring-background";
import ProofSection from "@/components/results/proof-section";
import MicButton from "@/components/voice/mic-button";
import StateMachineCTA from "@/components/statemachine/statemachine-cta";
import StateMachineModal from "@/components/statemachine/state-machine-modal";

// Voice-First Legal Aid
const VoiceFloatingButton = dynamic(
  () => import("@/components/voice-aid/voice-floating-button"),
  { ssr: false }
);

// Law Change Retroactive Banner
const RetroactiveBanner = dynamic(
  () => import("@/components/lawchange/retroactive-banner"),
  { ssr: false }
);

// Collective Bargaining
const EntityIntelligenceCard = dynamic(
  () => import("@/components/collective/entity-intelligence-card"),
  { ssr: false }
);

// Lazy-load heavy modals (rarely opened on first render)
const ScoreCardModal = dynamic(() => import("@/components/results/score-card-modal"), { ssr: false });
const VideoCardModal = dynamic(() => import("@/components/results/video-card-modal"), { ssr: false });
const ContractDNAModal = dynamic(() => import("@/components/results/contract-dna-modal"), { ssr: false });
const XRayOverlay = dynamic(() => import("@/components/results/xray-mode").then(m => m.XRayOverlay), { ssr: false });
const ClauseAutopsyModal = dynamic(() => import("@/components/results/clause-autopsy-modal"), { ssr: false });
const ShareRoomModal = dynamic(() => import("@/components/collab/share-room-modal"), { ssr: false });
import type { StateMachineReport } from "@/lib/statemachine/types";
import DeliberationCTA from "@/components/deliberation/deliberation-cta";
import DocumentDeliberation from "@/components/deliberation/document-deliberation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { DeliberationResult, DeliberationProgress, ClauseDeliberation } from "@/lib/deliberation/types";
import { TimebombCTA } from "@/components/timebomb/timebomb-cta";
import type { TemporalExtractionResult, PoisonPillAnalysisResult } from "@/types";
import { PoisonPillCTA } from "@/components/poisonpill/poison-pill-cta";
import { PoisonPillSection } from "@/components/poisonpill/poison-pill-section";
import ComplaintCTA from "@/components/complaint/complaint-cta";
import ShadowCTA from "@/components/shadow/shadow-cta";

// Bhasha Engine
import { LanguageBadge } from "@/components/bhasha/language-badge";
import { BilingualToggle } from "@/components/bhasha/bilingual-toggle";
import { AudioPlayer } from "@/components/bhasha/audio-player";
import { LanguageBanner } from "@/components/bhasha/language-banner";
import type { SupportedLanguage } from "@/types/bhasha";

// Legal Authority Connector
const AuthoritySection = dynamic(
  () => import("@/components/authority/authority-section"),
  { ssr: false }
);

// Market Intelligence
const MarketComparisonSection = dynamic(
  () => import("@/components/market/market-comparison-section"),
  { ssr: false }
);

interface HybridClause extends Clause {
  verification_source?: "database" | "ai";
  confidence?: "verified" | "partial" | "ai_suggested";
  matched_rule_id?: string | null;
  negotiation_script?: string | null;
  penalty_info?: string | null;
  community_match?: string | null;
  proof_data?: string | null;
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
  const [showCollab, setShowCollab] = useState(false);
  const [showStateMachineModal, setShowStateMachineModal] = useState(false);

  // UX Overhaul: Sort + Collapsible
  const [sortByRisk, setSortByRisk] = useState(true);
  const [analysisDetailsOpen, setAnalysisDetailsOpen] = useState(false);

  // Deliberation state
  const [deliberationResult, setDeliberationResult] = useState<DeliberationResult | null>(null);
  const [isRunningDeliberation, setIsRunningDeliberation] = useState(false);
  const [deliberationProgress, setDeliberationProgress] = useState<DeliberationProgress | null>(null);
  const [showDeliberationView, setShowDeliberationView] = useState(false);

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

  // Bhasha state
  const [bilingualMode, setBilingualMode] = useState<"source" | "english" | "both">("both");

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
    const handler = () => setShowCollab(true);
    window.addEventListener("clausewall:collaborate", handler);
    return () => window.removeEventListener("clausewall:collaborate", handler);
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

  // Risk sort order (memoized)
  const sortedClauses = useMemo(() => {
    const riskOrder: Record<string, number> = {
      illegal: 0,
      dangerous: 1,
      warning: 2,
      safe: 3,
    };
    return [...clauses].sort((a, b) => {
      const aOrder = riskOrder[a.risk_level] ?? 4;
      const bOrder = riskOrder[b.risk_level] ?? 4;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (b.risk_score ?? 0) - (a.risk_score ?? 0);
    });
  }, [clauses]);

  const filteredClauses = useMemo(() => {
    const baseClauses = sortByRisk ? sortedClauses : clauses;
    return filterRisk === "all"
      ? baseClauses
      : baseClauses.filter((c) => c.risk_level === filterRisk);
  }, [clauses, sortedClauses, sortByRisk, filterRisk]);

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

  // ═══════════════════════════════════════════
  // ⚔️ FULL DOCUMENT DELIBERATION
  // ═══════════════════════════════════════════
  const runFullDeliberation = useCallback(async () => {
    setIsRunningDeliberation(true);
    setDeliberationProgress({
      totalClauses: clauses.length,
      currentClause: 1,
      currentAgent: "predator",
      status: "predator_arguing",
      message: "Starting AI debate...",
    });
    try {
      const res = await fetch("/api/deliberation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setDeliberationResult(data.result as DeliberationResult);
        toast.success("AI debate complete!");
      } else {
        toast.error(data.error || "Deliberation failed");
      }
    } catch (error) {
      console.error("[ClauseWall] Full deliberation failed:", error);
      toast.error("Deliberation failed. Please try again.");
    } finally {
      setIsRunningDeliberation(false);
      setDeliberationProgress(null);
    }
  }, [documentId, clauses.length]);

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

  // Loading state — skeleton layout
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-xl mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
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
      <div className="relative px-4 sm:px-6 md:px-8 py-8 pb-24 sm:pb-12 bg-background min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm font-bold uppercase tracking-wider mb-3">
              <span className="text-foreground">{document.original_filename || "Analyzed Document"}</span>
              <span>•</span>
              <span>{getDocumentTypeLabel(document.document_type)}</span>
              <span>•</span>
              <span>{getStateName(document.jurisdiction)}</span>
              {/* Bhasha: Language badge for non-English docs */}
              {document.detected_language && document.detected_language !== "en" && (
                <>
                  <span>•</span>
                  <LanguageBadge
                    sourceLanguage={document.detected_language as SupportedLanguage}
                    showAudioAvailable
                  />
                </>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground tracking-tight">
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
              aria-label="Re-analyze contract"
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

        {/* Law Change Retroactive Banner */}
        <RetroactiveBanner documentId={documentId} />

        {/* Bhasha: Language Detection Banner + Bilingual Toggle */}
        {document.detected_language && document.detected_language !== "en" && (
          <div className="mb-6 space-y-3">
            <LanguageBanner
              detectedLanguage={document.detected_language as SupportedLanguage}
              confidence={document.language_confidence ?? 0.9}
            />
            <div className="flex items-center justify-between gap-4">
              <BilingualToggle
                mode={bilingualMode}
                onChange={setBilingualMode}
                sourceLanguage={document.detected_language as SupportedLanguage}
              />
              <AudioPlayer
                text={document.summary || "Analysis summary not available"}
                language={document.detected_language as SupportedLanguage}
                title="Listen to full summary"
              />
            </div>
          </div>
        )}

        {/* Score Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="card-impact md:col-span-2">
            <CardContent className="p-6 md:p-8 flex items-center gap-6 md:gap-8">
              <div
                className="relative h-28 w-28 md:h-32 md:w-32 rounded-full border-4 flex items-center justify-center flex-shrink-0"
                title="Overall contract risk score. 0 = safe, 100 = extremely dangerous"
                style={{
                  borderColor: riskColor,
                  borderStyle: 'solid'
                }}
              >
                <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center border-2 border-foreground">
                  <span className="text-4xl md:text-5xl font-black tabular-nums" style={{ color: riskColor }}>
                    {document.overall_risk_score}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Overall Risk Score</p>
                <p className="text-2xl md:text-3xl font-black uppercase" style={{ color: riskColor }}>
                  {getRiskLabel(riskLevel)}
                </p>
                <p className="text-sm font-bold text-foreground mt-2 px-3 py-1 bg-muted inline-block rounded-none border border-foreground">
                  {document.total_clauses} clauses analyzed
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-impact">
            <CardContent className="p-6 flex flex-col justify-center h-full">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-2 rounded border-2 border-green-600 bg-green-50 dark:bg-green-950">
                  <p className="text-2xl md:text-3xl font-black text-green-700 dark:text-green-400 tabular-nums">{document.safe_count}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-green-800 dark:text-green-300">Safe</p>
                </div>
                <div className="text-center p-2 rounded border-2 border-yellow-600 bg-yellow-50 dark:bg-yellow-950">
                  <p className="text-2xl md:text-3xl font-black text-yellow-700 dark:text-yellow-400 tabular-nums">{document.warning_count}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-800 dark:text-yellow-300">Warning</p>
                </div>
                <div className="text-center p-2 rounded border-2 border-red-600 bg-red-50 dark:bg-red-950">
                  <p className="text-2xl md:text-3xl font-black text-red-700 dark:text-red-400 tabular-nums">{document.dangerous_count}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-800 dark:text-red-300">Dangerous</p>
                </div>
                <div className="text-center p-2 rounded border-2 border-purple-600 bg-purple-50 dark:bg-purple-950">
                  <p className="text-2xl md:text-3xl font-black text-purple-700 dark:text-purple-400 tabular-nums">{document.illegal_count}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">Illegal</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-impact">
            <CardContent className="p-6 flex flex-col justify-center h-full">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Identified Entity</p>
              <p className="text-xl font-bold truncate text-foreground">
                {document.entity_name || "Not identified"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        {document.summary && (
          <Card className="card-impact mb-8 bg-muted">
            <CardContent className="p-6">
              <h3 className="text-lg font-black uppercase tracking-wider mb-3 flex items-center gap-2 text-foreground">
                <FileText className="h-5 w-5 text-red-600" />
                Executive Summary
              </h3>
              <p className="text-foreground leading-relaxed text-sm md:text-base font-medium">
                {document.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ═══ ANALYSIS DETAILS — Collapsible ═══ */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden mb-8">
          <button
            onClick={() => setAnalysisDetailsOpen(!analysisDetailsOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
            aria-label={analysisDetailsOpen ? "Collapse analysis details" : "Expand analysis details"}
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4 text-white/50" />
              <span className="text-sm font-medium text-white/80">
                Analysis Details
              </span>
            </div>

            {!analysisDetailsOpen && (
              <div className="flex items-center gap-4 text-xs text-white/40">
                <span>
                  {clauses.length} clauses • {verificationStats.verification_rate}% verified
                </span>
              </div>
            )}

            <ChevronDown
              className={`w-4 h-4 text-white/40 transition-transform duration-200 ${
                analysisDetailsOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {analysisDetailsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-4">
                  {/* Power Balance */}
                  <PowerBalanceMeter
                    powerBalance={document.power_balance ?? null}
                  />

                  {/* Entity Reputation */}
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

                  {/* Community Intelligence */}
                  <EntityIntelligenceCard
                    entityName={document.entity_name}
                    documentId={documentId}
                    jurisdiction={document.jurisdiction || 'pan_india'}
                    documentType={document.document_type || 'other'}
                  />

                  {/* Verification Stats */}
                  <Card className="card-impact-emphasis">
                    <CardContent className="p-6">
                      <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-foreground">
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                        Legal Database Verification
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="text-center p-3 rounded-none border-2 border-green-600 bg-green-50 dark:bg-green-950">
                          <p className="text-2xl font-black text-green-700 dark:text-green-400 tabular-nums">{verificationStats.verified}</p>
                          <p className="text-xs font-bold uppercase text-green-800 dark:text-green-300">Verified ✓</p>
                        </div>
                        <div className="text-center p-3 rounded-none border-2 border-yellow-600 bg-yellow-50 dark:bg-yellow-950">
                          <p className="text-2xl font-black text-yellow-700 dark:text-yellow-400 tabular-nums">{verificationStats.partial}</p>
                          <p className="text-xs font-bold uppercase text-yellow-800 dark:text-yellow-300">Partial</p>
                        </div>
                        <div className="text-center p-3 rounded-none border-2 border-blue-600 bg-blue-50 dark:bg-blue-950">
                          <p className="text-2xl font-black text-blue-700 dark:text-blue-400 tabular-nums">{verificationStats.ai_suggested}</p>
                          <p className="text-xs font-bold uppercase text-blue-800 dark:text-blue-300">AI-Only</p>
                        </div>
                        <div className="text-center p-3 rounded-none border-2 border-foreground bg-muted">
                          <p className="text-2xl font-black tabular-nums text-foreground">{verificationStats.verification_rate}%</p>
                          <p className="text-xs font-bold uppercase text-muted-foreground">Verified Rate</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══ NEXT STEPS ═══ */}
        <div className="mb-8">
          <NextSteps
            overallRiskScore={document.overall_risk_score ?? 0}
            illegalCount={document.illegal_count ?? 0}
            dangerousCount={document.dangerous_count ?? 0}
            warningCount={document.warning_count ?? 0}
            documentId={documentId}
            hasStateMachine={!!document.state_machine_data}
            hasDeliberation={!!deliberationResult}
            entityName={document.entity_name || undefined}
          />
        </div>

                {/* ═══ CLAUSE SECTION — MOOD RING ZONE ═══ */}
        <div id="clause-list">
          {/* Clause Header + Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-3xl font-black text-foreground tracking-tight uppercase">Clause Analysis</h2>
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
                  className={`px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider border-2 transition-all ${
                    filterRisk === filter.value
                      ? "bg-foreground border-foreground text-background"
                      : "bg-background border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  <span className={filterRisk === filter.value ? "text-background" : filter.color}>
                    {filter.count}
                  </span>{" "}
                  {filter.label}
                </button>
              ))}

              <span className="text-gray-700">|</span>

              <button
                onClick={() => setSortByRisk(!sortByRisk)}
                className="text-xs text-white/40 hover:text-white/60 transition-colors"
                aria-label="Toggle sort order"
              >
                {sortByRisk ? '↕ Sort by order' : '↕ Sort by risk'}
              </button>

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

          {/* Sort indicator */}
          {sortByRisk && (
            <p className="text-xs text-white/30 mb-2">
              Sorted by risk level — most critical first
            </p>
          )}

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
                  documentType={document.document_type}
                  onAutopsy={() => setAutopsyClause(clause)}
                  onRewrite={() => setRewriteClause(clause)}
                  isRoastMode={isRoastMode}
                  roastText={roastCache.get(clause.id) || null}
                  deliberation={
                    deliberationResult?.deliberations?.find(
                      (d) => d.clauseIndex === clause.clause_number || d.clauseId === clause.id
                    ) || null
                  }
                  documentId={documentId}
                  detectedLanguage={document.detected_language || undefined}
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

        {/* ═══ MARKET COMPARISON ═══ */}
        <div className="mb-8">
          <MarketComparisonSection
            documentId={documentId}
            documentType={document.document_type || "rental"}
            jurisdiction={document.jurisdiction}
          />
        </div>

        {/* ── Explore Deeper ── */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-black uppercase tracking-wider text-foreground">
              Explore Deeper
            </h3>
            <div className="flex-1 border-t-2 border-foreground" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <EscapeCTA
                documentId={documentId}
                dangerousCount={document.dangerous_count}
                illegalCount={document.illegal_count}
              />
            </div>

            <div>
              <SimulatorCTA
                documentId={documentId}
                overallRiskScore={document.overall_risk_score}
              />
            </div>

            <div id="ruin-calculator-cta">
              <Link href={`/ruin-calculator/${documentId}`}>
                <Card className="card-impact cursor-pointer hover:shadow-lg transition-all border-red-600 bg-red-50 dark:bg-red-950 h-full">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-600 border-2 border-black dark:border-white">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-black uppercase text-red-900 dark:text-red-100">Financial Risk Calculator</h4>
                        <p className="text-xs font-medium text-red-800/80 dark:text-red-200/80 mt-1">
                          Monte Carlo simulation: see the real cost of this contract over 36 months
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <div id="statemachine-cta">
              {document.state_machine_data && (
                <StateMachineCTA
                  report={document.state_machine_data as unknown as StateMachineReport}
                  onExplore={() => setShowStateMachineModal(true)}
                />
              )}
            </div>

            <div id="deliberation-cta">
              <DeliberationCTA
                result={deliberationResult}
                isLoading={isRunningDeliberation}
                progress={deliberationProgress}
                onRun={runFullDeliberation}
                onView={() => setShowDeliberationView(true)}
              />
            </div>

            <div id="timebomb-cta">
              <TimebombCTA
                documentId={documentId}
                temporalData={(document?.temporal_data as unknown as TemporalExtractionResult) || null}
                hasActivated={false}
              />
            </div>

            <div id="vault-cta">
              <Link href="/vault">
                <Card className="card-impact cursor-pointer hover:shadow-lg transition-all border-indigo-600 bg-indigo-50 dark:bg-indigo-950 h-full">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-600 border-2 border-black dark:border-white">
                        <FileStack className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-black uppercase text-indigo-900 dark:text-indigo-100">Contract Vault</h4>
                        <p className="text-xs font-medium text-indigo-800/80 dark:text-indigo-200/80 mt-1">
                          Cross-analyze all your contracts for conflicts, gaps & hidden risks
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <div id="poisonpill-cta">
              <PoisonPillCTA
                documentId={documentId}
                poisonPillData={(document?.poison_pill_data as unknown as PoisonPillAnalysisResult) || null}
                totalClauses={document.total_clauses || 0}
              />
            </div>

            <div id="complaint-cta">
              <ComplaintCTA
                documentId={documentId}
                dangerousCount={document.dangerous_count}
                illegalCount={document.illegal_count}
                entityName={document.entity_name}
              />
            </div>

            <div id="shadow-cta">
              <ShadowCTA
                documentId={documentId}
                shadowData={document.shadow_analysis_data as { trust_score?: number; total_mismatches?: number; critical_mismatches?: number; has_analysis?: boolean } | null}
              />
            </div>

            <div id="authority-section-cta">
              <AuthoritySection
                documentType={document.document_type}
                jurisdiction={document.jurisdiction}
                entityName={document.entity_name || ""}
                clauseTypes={clauses.map(c => c.clause_type).filter(Boolean)}
                preloadedRouting={(document as any).authority_routing || null}
              />
            </div>
          </div>
        </div>

        {/* ── Poison Pill Interconnection Analysis ── */}
        <div id="poison-pill-section" className="mt-8">
          <PoisonPillSection
            documentId={documentId}
            poisonPillData={(document?.poison_pill_data as unknown as PoisonPillAnalysisResult) || null}
          />
        </div>

        {/* QR Verification Badge */}
        <div id="qr-section" className="mt-8">
          <QRSection document={document} />
        </div>

        {/* Blockchain Proof */}
        <ProofSection
          proofHash={document.proof_hash}
          proofCid={document.proof_cid}
          proofTimestamp={document.proof_timestamp}
          proofStatus={document.proof_status}
          tsaToken={document.tsa_token}
          tsaSerial={document.tsa_serial}
          overallRiskScore={document.overall_risk_score}
          totalClauses={document.total_clauses}
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

      {/* ── State Machine Modal ── */}
      {document.state_machine_data && (
        <StateMachineModal
          report={document.state_machine_data as unknown as StateMachineReport}
          isOpen={showStateMachineModal}
          onClose={() => setShowStateMachineModal(false)}
          documentId={documentId}
        />
      )}

      {/* ── Collaboration Modal ── */}
      <ShareRoomModal
        isOpen={showCollab}
        onClose={() => setShowCollab(false)}
        documentId={documentId}
      />

      {/* ── Document Deliberation Modal ── */}
      {deliberationResult && (
        <Dialog open={showDeliberationView} onOpenChange={setShowDeliberationView}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gray-950 border-white/10">
            <DocumentDeliberation
              result={deliberationResult}
              onClauseClick={(index) => {
                setShowDeliberationView(false);
                setFilterRisk("all");
                const targetClause = clauses[index];
                if (targetClause) {
                  setExpandedClauses(new Set([targetClause.id]));
                  setTimeout(() => {
                    const el = window.document.querySelector(`[data-clause-index="${index}"]`);
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 100);
                }
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* ── Voice Mic Button ── */}
      <MicButton
        documentId={documentId}
        onCommand={(intent, params) => {
          switch (intent) {
            case "SCORE": setShowScoreCard(true); break;
            case "DNA": setShowDNA(true); break;
            case "XRAY": setShowXRay(true); break;
            case "NEGOTIATE": window.location.href = `/negotiate/${documentId}`; break;
            case "LEGAL_NOTICE": window.location.href = `/letter/${documentId}`; break;
            case "ESCAPE": window.location.href = `/escape/${documentId}`; break;
            case "BATTLE": window.location.href = `/battle/${documentId}`; break;
            case "SHARE":
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied!");
              break;
            case "NAVIGATE_CLAUSE":
              const idx = (params.clause_number as number) - 1;
              if (idx >= 0 && idx < clauses.length) {
                setFilterRisk("all");
                setExpandedClauses(new Set([clauses[idx].id]));
                setTimeout(() => {
                  const el = window.document.querySelector(`[data-clause-index="${idx}"]`);
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 100);
              }
              break;
            case "STOP":
              break;
          }
        }}
      />
    </div>
    <VoiceFloatingButton />
  </>
  );
}