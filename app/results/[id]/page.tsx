"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  XCircle,
  FileText,
  Loader2,
  RefreshCw,
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
import ResultsLayout from "@/components/results/results-layout";
import ContextRail from "@/components/results/context-rail";
import ClauseListComponent from "@/components/results/clause-list";
import ClauseDetailDrawer from "@/components/results/clause-detail-drawer";
import QRSection from "@/components/results/qr-section";
import MismatchBanner from "@/components/results/mismatch-banner";
import FloatingActions from "@/components/results/floating-actions";
import ClauseRewriteModal from "@/components/results/clause-rewrite-modal";
import MoodRingBackground from "@/components/results/mood-ring-background";
import ProofSection from "@/components/results/proof-section";
import MicButton from "@/components/voice/mic-button";
import StateMachineModal from "@/components/statemachine/state-machine-modal";

// Voice-First Legal Aid
const VoiceFloatingButton = dynamic(
  () => import("@/components/voice-aid/voice-floating-button"),
  { ssr: false },
);

// Law Change Retroactive Banner
const RetroactiveBanner = dynamic(
  () => import("@/components/lawchange/retroactive-banner"),
  { ssr: false },
);

// Collective Bargaining
const EntityIntelligenceCard = dynamic(
  () => import("@/components/collective/entity-intelligence-card"),
  { ssr: false },
);

// Lazy-load heavy modals (rarely opened on first render)
const ScoreCardModal = dynamic(
  () => import("@/components/results/score-card-modal"),
  { ssr: false },
);
const VideoCardModal = dynamic(
  () => import("@/components/results/video-card-modal"),
  { ssr: false },
);
const ContractDNAModal = dynamic(
  () => import("@/components/results/contract-dna-modal"),
  { ssr: false },
);
const XRayOverlay = dynamic(
  () => import("@/components/results/xray-mode").then((m) => m.XRayOverlay),
  { ssr: false },
);
const ClauseAutopsyModal = dynamic(
  () => import("@/components/results/clause-autopsy-modal"),
  { ssr: false },
);
const ShareRoomModal = dynamic(
  () => import("@/components/collab/share-room-modal"),
  { ssr: false },
);
import type { StateMachineReport } from "@/lib/statemachine/types";
import DocumentDeliberation from "@/components/deliberation/document-deliberation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type {
  DeliberationResult,
  DeliberationProgress,
  ClauseDeliberation,
} from "@/lib/deliberation/types";
import type {
  PoisonPillAnalysisResult,
} from "@/types";
import { PoisonPillSection } from "@/components/poisonpill/poison-pill-section";

// Bhasha Engine
import { LanguageBadge } from "@/components/bhasha/language-badge";
import { BilingualToggle } from "@/components/bhasha/bilingual-toggle";
import { AudioPlayer } from "@/components/bhasha/audio-player";
import { LanguageBanner } from "@/components/bhasha/language-banner";
import type { SupportedLanguage } from "@/types/bhasha";

// Legal Authority Connector
const AuthoritySection = dynamic(
  () => import("@/components/authority/authority-section"),
  { ssr: false },
);

// Market Intelligence
const MarketComparisonSection = dynamic(
  () => import("@/components/market/market-comparison-section"),
  { ssr: false },
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
  const [expandedClauses, setExpandedClauses] = useState<Set<string>>(
    new Set(),
  );
  const [refreshing, setRefreshing] = useState(false);
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [showCollab, setShowCollab] = useState(false);
  const [showStateMachineModal, setShowStateMachineModal] = useState(false);

  // UX Overhaul: Sort + Collapsible
  const [sortByRisk, setSortByRisk] = useState(true);
  const [analysisDetailsOpen, setAnalysisDetailsOpen] = useState(false);
  const [forensicsLabOpen, setForensicsLabOpen] = useState(false);

  // Deliberation state
  const [deliberationResult, setDeliberationResult] =
    useState<DeliberationResult | null>(null);
  const [isRunningDeliberation, setIsRunningDeliberation] = useState(false);
  const [deliberationProgress, setDeliberationProgress] =
    useState<DeliberationProgress | null>(null);
  const [showDeliberationView, setShowDeliberationView] = useState(false);

  // Modal states
  const [showScoreCard, setShowScoreCard] = useState(false);
  const [showVideoCard, setShowVideoCard] = useState(false);
  const [showDNA, setShowDNA] = useState(false);
  const [showXRay, setShowXRay] = useState(false);

  // 🔬 AUTOPSY
  const [autopsyClause, setAutopsyClause] = useState<HybridClause | null>(null);

  const [rewriteClause, setRewriteClause] = useState<HybridClause | null>(null);

  // 📋 CLAUSE DETAIL DRAWER
  const [drawerClause, setDrawerClause] = useState<HybridClause | null>(null);
  const [drawerInitialTab, setDrawerInitialTab] = useState<string | null>(null);

  // 🌈 MOOD RING
  const [activeClauseIndex, setActiveClauseIndex] = useState<number | null>(
    null,
  );
  const [isInClauseZone, setIsInClauseZone] = useState(false);
  const clauseListRef = useRef<HTMLDivElement>(null);

  // 🔥 ROAST MODE
  const [isRoastMode, setIsRoastMode] = useState(false);
  const [roastCache, setRoastCache] = useState<Map<string, string>>(new Map());
  const [roastLoading, setRoastLoading] = useState(false);
  const roastFetched = useRef(false);

  // Bhasha state
  const [bilingualMode, setBilingualMode] = useState<
    "source" | "english" | "both"
  >("both");

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
      (c) => c.confidence === "ai_suggested" || !c.confidence,
    ).length,
    verification_rate:
      clauses.length > 0
        ? Math.round(
            (clauses.filter((c) => c.confidence === "verified").length /
              clauses.length) *
              100,
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
      // 1. Fallback polling mechanism (slower, 10s fallback)
      const interval = setInterval(fetchData, 10000);

      // 2. Realtime subscription
      const channel = supabase
        .channel(`document-progress-${documentId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "documents",
            filter: `id=eq.${documentId}`,
          },
          (payload) => {
            const updatedDoc = payload.new as Document;
            setDocument(updatedDoc);
            
            // If it just transitioned to completed or failed, we need to fetch clauses
            if (
              updatedDoc.analysis_status === "completed" ||
              updatedDoc.analysis_status === "failed"
            ) {
              fetchData();
            }
          }
        )
        .subscribe();

      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    }
  }, [document?.analysis_status, documentId]);

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
          "(prefers-reduced-motion: reduce)",
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
            card.getAttribute("data-clause-index") || "-1",
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
      `[data-clause-index="${index}"]`,
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
      (c) => c.risk_level === "dangerous" || c.risk_level === "illegal",
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
      <div className="min-h-screen bg-[#050505] p-4 sm:p-8 max-w-5xl mx-auto">
        <Skeleton className="h-4 w-64 mb-2 bg-neutral-900 rounded-sm" />
        <Skeleton className="h-3 w-96 mb-8 bg-neutral-900 rounded-sm" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-sm bg-neutral-900" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-sm bg-neutral-900 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-sm bg-neutral-900" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-[#050505]">
        <XCircle className="h-12 w-12 text-red-600" />
        <p className="text-[10px] font-mono tracking-widest text-red-500 uppercase">{error || "[ERR: DOCUMENT_ORPHANED]"}</p>
        <Link href="/upload">
          <Button variant="outline" className="font-mono text-[10px] tracking-widest uppercase border-red-900/50 hover:bg-red-900/30 hover:text-red-400 mt-4">
            [RESTART_INGESTION]
          </Button>
        </Link>
      </div>
    );
  }

  if (
    document.analysis_status === "pending" ||
    document.analysis_status === "analyzing"
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 bg-[#050505]">
        <div className="relative">
          <Loader2 className="h-12 w-12 text-cyan-500 animate-spin" />
          <div className="absolute inset-0 h-12 w-12 bg-cyan-500/20 blur-xl rounded-full animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="font-mono text-xl tracking-widest uppercase text-white mb-2">
            [INITIALIZING FORENSIC SCAN]
          </h2>
          <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 max-w-md mx-auto">
            CROSSLINKING AGAINST 750+ VERIFIED LEGAL VECTORS.
            <br />
            ESTIMATED T-MINUS 30 SECONDS.
          </p>
        </div>
        <div className="w-64 mt-4">
          <Progress value={33} className="h-[2px] bg-neutral-900" />
        </div>
      </div>
    );
  }

  if (document.analysis_status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 bg-[#050505]">
        <XCircle className="h-12 w-12 text-red-600" />
        <h2 className="font-mono text-xl tracking-widest uppercase text-red-500">[SCAN COLLAPSE: FATAL ERROR]</h2>
        <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 text-center max-w-md">
          {document.summary || "UNHANDLED EXCEPTION IN PIPELINE."}
        </p>
        <Link href="/upload">
          <Button variant="outline" className="font-mono text-[10px] tracking-widest uppercase border-red-900/50 hover:bg-red-900/30 hover:text-red-400 mt-4">
            [RESTART_INGESTION]
          </Button>
        </Link>
      </div>
    );
  }

  const riskLevel = getRiskLevel(document.overall_risk_score);
  const riskColor = RISK_COLORS[riskLevel];

  // ═══════════════════════════════════════════
  // RENDER: Split Workspace Layout
  // ═══════════════════════════════════════════
  return (
    <ResultsLayout
      header={
        <MoodRingBackground
          activeRiskLevel={activeMoodRisk}
          isInClauseZone={isInClauseZone}
        />
      }
      main={
        <>
          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-neutral-900 pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] text-neutral-500 uppercase tracking-widest mb-2">
                <span className="text-white bg-[#0a0a0a] border border-neutral-800 px-1 py-0.5">
                  [{document.original_filename || "ANALYZED_DOCUMENT"}]
                </span>
                <span className="text-neutral-800">/</span>
                <span>{getDocumentTypeLabel(document.document_type)}</span>
                <span className="text-neutral-800">/</span>
                <span>{getStateName(document.jurisdiction)}</span>
                {document.detected_language &&
                  document.detected_language !== "en" && (
                    <>
                      <span className="text-neutral-800">/</span>
                      <LanguageBadge
                        sourceLanguage={
                          document.detected_language as SupportedLanguage
                        }
                        showAudioAvailable
                      />
                    </>
                  )}
              </div>
              <h1 className="font-mono text-2xl sm:text-3xl tracking-tighter text-white uppercase">
                [FORENSIC_ANALYSIS_ARRAY]
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="gap-2 font-mono text-[10px] uppercase tracking-widest border-neutral-800 hover:bg-neutral-900 hover:text-white bg-transparent h-8"
                aria-label="Re-analyze contract"
              >
                <RefreshCw
                  className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
                />
                [REINITIALIZE]
              </Button>
            </div>
          </div>

          {/* ── Banners ── */}
          <MismatchBanner
            documentId={documentId}
            selectedJurisdiction={document.jurisdiction}
            detectedJurisdiction={document.detected_jurisdiction}
            selectedDocType={document.document_type}
            detectedDocType={document.detected_document_type}
          />
          <RetroactiveBanner documentId={documentId} />
          {document.detected_language &&
            document.detected_language !== "en" && (
              <div className="mb-6 space-y-3">
                <LanguageBanner
                  detectedLanguage={
                    document.detected_language as SupportedLanguage
                  }
                  confidence={document.language_confidence ?? 0.9}
                />
                <div className="flex items-center justify-between gap-4">
                  <BilingualToggle
                    mode={bilingualMode}
                    onChange={setBilingualMode}
                    sourceLanguage={
                      document.detected_language as SupportedLanguage
                    }
                  />
                  <AudioPlayer
                    text={document.summary || "Analysis summary not available"}
                    language={document.detected_language as SupportedLanguage}
                    title="Listen to full summary"
                  />
                </div>
              </div>
            )}

          {/* ── Mobile: Compact summary (visible only below lg) ── */}
          <div className="lg:hidden mb-6">
            <div className="bg-[#050505] border border-neutral-900 rounded-sm p-4 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-neutral-500/10 to-transparent pointer-events-none" />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-mono text-neutral-500 tracking-widest uppercase mb-1">
                  [OVERALL VULNERABILITY]
                </p>
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-mono text-4xl tracking-tighter"
                    style={{ color: riskColor }}
                  >
                    {document.overall_risk_score}
                  </span>
                  <span
                    className="inline-block border border-neutral-800 bg-[#0a0a0a] px-2 py-0.5 font-mono text-[9px] tracking-widest uppercase rounded-sm"
                    style={{ color: riskColor, borderColor: `${riskColor}40` }}
                  >
                    {getRiskLabel(riskLevel)}
                  </span>
                </div>
                <p className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest mt-2">
                  {document.total_clauses} VECTORS • {document.illegal_count} ILLEGAL • {document.dangerous_count} DANGEROUS
                </p>
              </div>
            </div>
          </div>

          {/* ── Clause List ── */}
          <ClauseListComponent
            document={document}
            documentId={documentId}
            clauses={clauses}
            filteredClauses={filteredClauses}
            expandedClauses={expandedClauses}
            filterRisk={filterRisk}
            sortByRisk={sortByRisk}
            isRoastMode={isRoastMode}
            roastCache={roastCache}
            clauseListRef={clauseListRef}
            deliberationResult={deliberationResult}
            onToggleClause={toggleClause}
            onSetFilterRisk={setFilterRisk}
            onSetSortByRisk={setSortByRisk}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
            onAutopsy={(c) => setAutopsyClause(c as any)}
            onRewrite={(c) => setRewriteClause(c as any)}
            onDeepDive={(c, tab) => {
              setDrawerClause(c as unknown as HybridClause);
              setDrawerInitialTab(tab);
            }}
          />

          {/* ── Market Comparison ── */}
          <div className="mt-8 mb-8">
            <MarketComparisonSection
              documentId={documentId}
              documentType={document.document_type || "rental"}
              jurisdiction={document.jurisdiction}
            />
          </div>

          {/* ── Poison Pill Interconnection ── */}
          <div id="poison-pill-section" className="mt-8">
            <PoisonPillSection
              documentId={documentId}
              poisonPillData={
                (document?.poison_pill_data as unknown as PoisonPillAnalysisResult) ||
                null
              }
            />
          </div>

          {/* ── QR Verification Badge ── */}
          <div id="qr-section" className="mt-8">
            <QRSection document={document} />
          </div>

          {/* ── Blockchain Proof ── */}
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
        </>
      }
      rail={
        <ContextRail
          document={document}
          documentId={documentId}
          clauses={clauses as any}
          analysisDetailsOpen={analysisDetailsOpen}
          onSetAnalysisDetailsOpen={setAnalysisDetailsOpen}
          verificationStats={verificationStats}
          deliberationResult={deliberationResult}
          isRunningDeliberation={isRunningDeliberation}
          deliberationProgress={deliberationProgress}
          onRunFullDeliberation={runFullDeliberation}
          onShowDeliberationView={() => setShowDeliberationView(true)}
          forensicsLabOpen={forensicsLabOpen}
          onSetForensicsLabOpen={setForensicsLabOpen}
          onShowStateMachineModal={() => setShowStateMachineModal(true)}
        />
      }
      footer={
        <>
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

          {/* ── Clause Detail Drawer ── */}
          <ClauseDetailDrawer
            clause={drawerClause}
            isOpen={!!drawerClause}
            onClose={() => {
              setDrawerClause(null);
              setDrawerInitialTab(null);
            }}
            initialTab={drawerInitialTab as any}
            jurisdiction={document.jurisdiction}
            documentType={document.document_type}
            documentId={documentId}
            deliberation={
              drawerClause
                ? deliberationResult?.deliberations?.find(
                    (d) =>
                      d.clauseIndex === drawerClause.clause_number ||
                      d.clauseId === drawerClause.id,
                  ) || null
                : null
            }
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
              report={
                document.state_machine_data as unknown as StateMachineReport
              }
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
            <Dialog
              open={showDeliberationView}
              onOpenChange={setShowDeliberationView}
            >
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-background border-2 border-foreground card-impact">
                <DocumentDeliberation
                  result={deliberationResult}
                  onClauseClick={(index) => {
                    setShowDeliberationView(false);
                    setFilterRisk("all");
                    const targetClause = clauses[index];
                    if (targetClause) {
                      setExpandedClauses(new Set([targetClause.id]));
                      setTimeout(() => {
                        const el = window.document.querySelector(
                          `[data-clause-index="${index}"]`,
                        );
                        el?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
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
                case "SCORE":
                  setShowScoreCard(true);
                  break;
                case "DNA":
                  setShowDNA(true);
                  break;
                case "XRAY":
                  setShowXRay(true);
                  break;
                case "NEGOTIATE":
                  window.location.href = `/negotiate/${documentId}`;
                  break;
                case "LEGAL_NOTICE":
                  window.location.href = `/letter/${documentId}`;
                  break;
                case "ESCAPE":
                  window.location.href = `/escape/${documentId}`;
                  break;
                case "BATTLE":
                  window.location.href = `/battle/${documentId}`;
                  break;
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
                      const el = window.document.querySelector(
                        `[data-clause-index="${idx}"]`,
                      );
                      el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 100);
                  }
                  break;
                case "STOP":
                  break;
              }
            }}
          />
          <VoiceFloatingButton />
        </>
      }
    />
  );
}

