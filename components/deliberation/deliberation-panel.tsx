"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type {
  ClauseDeliberation,
  AgentArgument,
  ArbiterVerdict,
  AgentRole,
  AgentTone,
} from "@/lib/deliberation/types";

// ============================================
// PROPS
// ============================================

interface DeliberationPanelProps {
  deliberation: ClauseDeliberation;
  isLoading?: boolean;
  currentAgent?: AgentRole | null;
  animated?: boolean;
  compact?: boolean;
}

// ============================================
// TONE BADGE
// ============================================

function ToneBadge({ tone }: { tone: AgentTone }) {
  const config = {
    aggressive: {
      className: "bg-red-500/15 text-red-300 border-red-500/30",
      label: "Aggressive",
    },
    measured: {
      className: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      label: "Measured",
    },
    conciliatory: {
      className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      label: "Conciliatory",
    },
  };

  const c = config[tone];
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${c.className}`}>
      {c.label}
    </span>
  );
}

// ============================================
// CONFIDENCE BAR
// ============================================

function ConfidenceBar({
  confidence,
  color,
}: {
  confidence: number;
  color: string;
}) {
  const percent = Math.round(confidence * 100);
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-[10px] text-white/40 w-16 shrink-0">
        Confidence
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className="text-[10px] text-white/50 w-8 text-right">
        {percent}%
      </span>
    </div>
  );
}

// ============================================
// AGENT SECTION (Predator / Guardian)
// ============================================

function AgentSection({
  agent,
  colorBorder,
  colorBg,
  colorText,
  colorBar,
  icon,
  isLoading,
  animated,
  animationDelay,
  compact,
}: {
  agent: AgentArgument;
  colorBorder: string;
  colorBg: string;
  colorText: string;
  colorBar: string;
  icon: string;
  isLoading: boolean;
  animated: boolean;
  animationDelay: number;
  compact?: boolean;
}) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
  }, []);

  const shouldAnimate = animated && !prefersReducedMotion;
  const spacing = compact ? "p-3" : "p-4";

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={`${spacing} rounded-xl border-l-4 ${colorBorder} ${colorBg}`}
        role="article"
        aria-label={`${agent.agentName} is preparing argument`}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{icon}</span>
          <span className={`text-sm font-semibold ${colorText}`}>
            {agent.agentName}
          </span>
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-xs text-white/40"
          >
            preparing argument...
          </motion.span>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full bg-white/5" />
          <Skeleton className="h-3 w-4/5 bg-white/5" />
          <Skeleton className="h-3 w-3/5 bg-white/5" />
          <Skeleton className="h-3 w-2/3 bg-white/5" />
        </div>
      </div>
    );
  }

  const content = (
    <div
      className={`${spacing} rounded-xl border-l-4 ${colorBorder} ${colorBg} transition-colors`}
      role="article"
      aria-label={`${agent.agentName}'s argument`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className={`text-sm font-semibold ${colorText}`}>
            {agent.agentName}
          </span>
          {agent.wasRecovered && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
              ⚠ Recovered
            </span>
          )}
        </div>
        <ToneBadge tone={agent.tone} />
      </div>

      {/* Argument Text */}
      <p className={`text-white/90 leading-relaxed mb-3 ${compact ? "text-xs" : "text-sm"}`}>
        {agent.argument}
      </p>

      {/* Key Points */}
      {agent.keyPoints.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">
            Key Points
          </p>
          <ul className="space-y-1">
            {agent.keyPoints.map((point, i) => (
              <li
                key={i}
                className={`flex items-start gap-2 text-white/80 ${compact ? "text-xs" : "text-sm"}`}
              >
                <span className={`mt-1 shrink-0 ${colorText}`}>•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Citations */}
      {agent.citations.length > 0 && (
        <p className="text-[10px] text-white/40 italic mb-2">
          Citations: {agent.citations.join(" · ")}
        </p>
      )}

      {/* Confidence */}
      <ConfidenceBar confidence={agent.confidence} color={colorBar} />
    </div>
  );

  if (shouldAnimate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: animationDelay / 1000,
          ease: "easeOut",
        }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

// ============================================
// VS DIVIDER
// ============================================

function VsDivider({ animated }: { animated: boolean }) {
  const divider = (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 border-t border-white/10" />
      <span className="text-sm font-bold text-white/30 select-none">⚡ VS ⚡</span>
      <div className="flex-1 border-t border-white/10" />
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      >
        {divider}
      </motion.div>
    );
  }

  return divider;
}

// ============================================
// VERDICT BADGE
// ============================================

function VerdictBadge({
  verdict,
  animated,
  animationDelay,
  large,
}: {
  verdict: string;
  animated: boolean;
  animationDelay: number;
  large?: boolean;
}) {
  const config: Record<string, { bg: string; label: string; emoji: string }> = {
    fair: { bg: "bg-emerald-500", label: "FAIR", emoji: "✅" },
    partially_fair: { bg: "bg-amber-500", label: "PARTIALLY FAIR", emoji: "⚠️" },
    unfair: { bg: "bg-red-500", label: "UNFAIR", emoji: "❌" },
    illegal: { bg: "bg-purple-600 ring-2 ring-purple-400/50", label: "ILLEGAL", emoji: "⛔" },
  };

  const c = config[verdict] || config.partially_fair;
  const size = large ? "text-base py-2 px-6" : "text-xs py-1 px-3";

  const badge = (
    <span
      className={`inline-flex items-center gap-1.5 ${size} rounded-full font-bold text-white ${c.bg}`}
      aria-label={`Verdict: ${c.label}`}
    >
      {c.emoji} {c.label}
    </span>
  );

  if (animated) {
    return (
      <motion.div
        className="flex justify-center"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: [0.7, 1.1, 1.0], opacity: 1 }}
        transition={{
          duration: 0.5,
          delay: animationDelay / 1000,
          ease: "easeOut",
        }}
      >
        {badge}
      </motion.div>
    );
  }

  return <div className="flex justify-center">{badge}</div>;
}

// ============================================
// ARBITER SECTION
// ============================================

function ArbiterSection({
  agent,
  verdict,
  isLoading,
  animated,
  animationDelay,
  duration,
  compact,
}: {
  agent: AgentArgument;
  verdict: ArbiterVerdict;
  isLoading: boolean;
  animated: boolean;
  animationDelay: number;
  duration: number;
  compact?: boolean;
}) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
  }, []);

  const shouldAnimate = animated && !prefersReducedMotion;
  const spacing = compact ? "p-3" : "p-4 sm:p-5";

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={`${spacing} rounded-xl border-2 border-amber-500/20 bg-amber-500/[0.03]`}
        role="article"
        aria-label="Judicial Arbiter is deliberating"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⚖️</span>
          <span className="text-sm font-semibold text-amber-400">
            Judicial Arbiter
          </span>
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-xs text-white/40"
          >
            deliberating...
          </motion.span>
        </div>
        <div className="flex justify-center mb-4">
          <Skeleton className="h-10 w-40 rounded-full bg-white/5" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full bg-white/5" />
          <Skeleton className="h-3 w-5/6 bg-white/5" />
          <Skeleton className="h-3 w-4/5 bg-white/5" />
        </div>
      </div>
    );
  }

  const durationStr =
    duration >= 1000
      ? `${(duration / 1000).toFixed(1)}s`
      : `${duration}ms`;

  const content = (
    <div
      className={`${spacing} rounded-xl border-2 border-amber-500/20 bg-amber-500/[0.03]`}
      role="article"
      aria-label="Judicial Arbiter's verdict"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚖️</span>
          <span className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
            Judicial Arbiter
          </span>
          {agent.wasRecovered && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
              ⚠ Recovered
            </span>
          )}
        </div>
      </div>

      {/* Verdict Badge */}
      <div className="my-4">
        <VerdictBadge
          verdict={verdict.verdict}
          animated={shouldAnimate}
          animationDelay={animationDelay + 200}
          large
        />
      </div>

      {/* Core Reasoning */}
      {verdict.reasoning && (
        <div className="mb-3 text-center">
          <p className={`text-white/70 italic ${compact ? "text-xs" : "text-sm"}`}>
            &ldquo;{verdict.reasoning}&rdquo;
          </p>
        </div>
      )}

      {/* Full Argument */}
      <p className={`text-white/90 leading-relaxed mb-4 ${compact ? "text-xs" : "text-sm"}`}>
        {agent.argument}
      </p>

      {/* Key Factors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Defense Valid */}
        {verdict.predatorValidPoints.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-emerald-400/80 uppercase tracking-wider">
              ✓ Defense Valid
            </p>
            {verdict.predatorValidPoints.map((p, i) => (
              <p key={i} className={`text-white/70 ${compact ? "text-[11px]" : "text-xs"}`}>
                {p}
              </p>
            ))}
          </div>
        )}

        {/* Defense Weak */}
        {verdict.predatorWeaknesses.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-red-400/80 uppercase tracking-wider">
              ✗ Defense Weak
            </p>
            {verdict.predatorWeaknesses.map((p, i) => (
              <p key={i} className={`text-white/70 ${compact ? "text-[11px]" : "text-xs"}`}>
                {p}
              </p>
            ))}
          </div>
        )}

        {/* Advocate Valid */}
        {verdict.guardianValidPoints.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-emerald-400/80 uppercase tracking-wider">
              ✓ Advocate Valid
            </p>
            {verdict.guardianValidPoints.map((p, i) => (
              <p key={i} className={`text-white/70 ${compact ? "text-[11px]" : "text-xs"}`}>
                {p}
              </p>
            ))}
          </div>
        )}

        {/* Advocate Weak */}
        {verdict.guardianWeaknesses.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-red-400/80 uppercase tracking-wider">
              ✗ Advocate Weak
            </p>
            {verdict.guardianWeaknesses.map((p, i) => (
              <p key={i} className={`text-white/70 ${compact ? "text-[11px]" : "text-xs"}`}>
                {p}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Modification */}
      {verdict.suggestedModification && (
        <div className="mb-4">
          <p className="text-[10px] text-amber-400/80 uppercase tracking-wider mb-1.5">
            Suggested Modification
          </p>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <p className={`text-white/80 italic ${compact ? "text-xs" : "text-sm"} leading-relaxed`}>
              &ldquo;{verdict.suggestedModification}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Legal References */}
      {verdict.legalReferences.length > 0 && (
        <p className="text-[10px] text-white/40 italic mb-3">
          Legal References: {verdict.legalReferences.join(" · ")}
        </p>
      )}

      {/* Confidence + Duration */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <ConfidenceBar
            confidence={verdict.confidence}
            color="bg-amber-500"
          />
        </div>
        <span className="text-[10px] text-white/30 ml-4 shrink-0">
          ⏱️ {durationStr}
        </span>
      </div>
    </div>
  );

  if (shouldAnimate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: animationDelay / 1000,
          ease: "easeOut",
        }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

// ============================================
// MAIN COMPONENT: DELIBERATION PANEL
// ============================================

export default function DeliberationPanel({
  deliberation,
  isLoading = false,
  currentAgent = null,
  animated = false,
  compact = false,
}: DeliberationPanelProps) {
  // On mobile, default to showing only arbiter expanded
  const [expandedAgent, setExpandedAgent] = useState<AgentRole | "all">("all");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isMobile && !isLoading) {
      setExpandedAgent("arbiter");
    }
  }, [isMobile, isLoading]);

  const showPredator = expandedAgent === "all" || expandedAgent === "predator";
  const showGuardian = expandedAgent === "all" || expandedAgent === "guardian";
  const showArbiter = expandedAgent === "all" || expandedAgent === "arbiter";

  const gap = compact ? "space-y-3" : "space-y-4";

  return (
    <div className={gap}>
      {/* Mobile agent selector */}
      {isMobile && !isLoading && (
        <div className="flex gap-1.5 p-1 bg-white/5 rounded-lg">
          {(["predator", "guardian", "arbiter", "all"] as const).map((role) => {
            const labels: Record<string, string> = {
              predator: "🔴 Defense",
              guardian: "🟢 Advocate",
              arbiter: "⚖️ Verdict",
              all: "All",
            };
            return (
              <button
                key={role}
                onClick={() => setExpandedAgent(role)}
                className={`flex-1 text-[10px] py-1.5 rounded-md font-medium transition-colors ${
                  expandedAgent === role
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                {labels[role]}
              </button>
            );
          })}
        </div>
      )}

      {/* Predator */}
      <AnimatePresence>
        {(showPredator || isLoading) && (
          <AgentSection
            agent={deliberation.predatorArgument}
            colorBorder="border-red-500"
            colorBg="bg-red-500/[0.04]"
            colorText="text-red-400"
            colorBar="bg-red-500"
            icon="🔴"
            isLoading={isLoading && (currentAgent === "predator" || !currentAgent)}
            animated={animated}
            animationDelay={0}
            compact={compact}
          />
        )}
      </AnimatePresence>

      {/* VS Divider */}
      {(showPredator || showGuardian) && !isLoading && (
        <VsDivider animated={animated} />
      )}

      {/* Guardian */}
      <AnimatePresence>
        {(showGuardian || (isLoading && currentAgent === "guardian")) && (
          <AgentSection
            agent={deliberation.guardianArgument}
            colorBorder="border-emerald-500"
            colorBg="bg-emerald-500/[0.04]"
            colorText="text-emerald-400"
            colorBar="bg-emerald-500"
            icon="🟢"
            isLoading={isLoading && currentAgent === "guardian"}
            animated={animated}
            animationDelay={1500}
            compact={compact}
          />
        )}
      </AnimatePresence>

      {/* Divider before Arbiter */}
      {(showGuardian || showArbiter) && !isLoading && (
        <div className="border-t border-white/5" />
      )}

      {/* Arbiter */}
      <AnimatePresence>
        {(showArbiter || (isLoading && currentAgent === "arbiter")) && (
          <ArbiterSection
            agent={deliberation.arbiterArgument}
            verdict={deliberation.arbiterVerdict}
            isLoading={isLoading && currentAgent === "arbiter"}
            animated={animated}
            animationDelay={3000}
            duration={deliberation.deliberationDuration}
            compact={compact}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
