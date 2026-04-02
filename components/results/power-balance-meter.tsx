"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  Scale,
  DoorOpen,
  Wallet,
  AlertTriangle,
  Gavel,
  Settings2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PowerBalance, PowerCategory } from "@/types";

// ============================================
// PROPS
// ============================================

interface PowerBalanceMeterProps {
  powerBalance: PowerBalance | null;
}

// ============================================
// CATEGORY ICON MAP
// ============================================

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  termination: DoorOpen,
  financial: Wallet,
  penalties: AlertTriangle,
  dispute: Gavel,
  control: Settings2,
};

// ============================================
// SEVERITY HELPERS
// ============================================

function getSeverityInfo(partyAPercent: number) {
  if (partyAPercent >= 80)
    return {
      label: "Severe",
      emoji: "⛔",
      className: "bg-rose-50 text-rose-700 border-rose-200",
    };
  if (partyAPercent >= 65)
    return {
      label: "Unfair",
      emoji: "🔴",
      className: "bg-orange-50 text-orange-700 border-orange-200",
    };
  if (partyAPercent >= 55)
    return {
      label: "Slight",
      emoji: "⚠️",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    };
  return {
    label: "Fair",
    emoji: "✅",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
}

function getVerdictStyle(verdict: string) {
  switch (verdict) {
    case "PREDATORY":
      return {
        color: "text-purple-700",
        bg: "bg-purple-50 border-purple-200",
        glow: "shadow-sm shadow-purple-900/5",
      };
    case "HEAVILY ONE-SIDED":
      return {
        color: "text-rose-700",
        bg: "bg-rose-50 border-rose-200",
        glow: "shadow-sm shadow-rose-900/5",
      };
    case "ONE-SIDED":
      return {
        color: "text-orange-700",
        bg: "bg-orange-50 border-orange-200",
        glow: "shadow-sm shadow-orange-900/5",
      };
    case "SLIGHTLY UNFAIR":
      return {
        color: "text-amber-700",
        bg: "bg-amber-50 border-amber-200",
        glow: "shadow-sm shadow-amber-900/5",
      };
    case "BALANCED":
      return {
        color: "text-emerald-700",
        bg: "bg-emerald-50 border-emerald-200",
        glow: "shadow-sm shadow-emerald-900/5",
      };
    case "FAIR":
      return {
        color: "text-teal-700",
        bg: "bg-teal-50 border-teal-200",
        glow: "shadow-sm shadow-teal-900/5",
      };
    default:
      return {
        color: "text-slate-600",
        bg: "bg-slate-50 border-slate-200",
        glow: "shadow-sm shadow-slate-900/5",
      };
  }
}

// ============================================
// COUNT-UP ANIMATION HOOK
// ============================================

function useCountUp(target: number, isActive: boolean, delay: number = 0) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const timer = setTimeout(() => {
      const duration = 1200;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * target));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [target, isActive, delay]);

  return count;
}

// ============================================
// POWER BAR SUB-COMPONENT
// ============================================

function PowerBar({
  userPercent,
  delay,
  isInView,
  height = "h-4",
}: {
  userPercent: number;
  delay: number;
  isInView: boolean;
  height?: string;
}) {
  return (
    <div className={`${height} rounded-full overflow-hidden bg-rose-500 flex shadow-inner relative`}>
      <motion.div
        className="bg-teal-600 rounded-l-full relative"
        initial={{ width: "50%" }}
        animate={isInView ? { width: `${userPercent}%` } : { width: "50%" }}
        transition={{
          duration: 1.5,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white dark:bg-slate-900/30 skew-x-12 transform" />
      </motion.div>
    </div>
  );
}

// ============================================
// CATEGORY ROW SUB-COMPONENT
// ============================================

function CategoryRow({
  category,
  index,
  isInView,
}: {
  category: PowerCategory;
  index: number;
  isInView: boolean;
}) {
  const Icon = CATEGORY_ICONS[category.key] || Scale;
  // Severity is calculated against Entity power (Party A)
  const severity = getSeverityInfo(category.party_a_percent);
  const delay = 1.8 + index * 0.2;

  const partyACount = useCountUp(category.party_a_percent, isInView, delay);
  const partyBCount = useCountUp(category.party_b_percent, isInView, delay);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ duration: 0.5, delay }}
      className="space-y-2 bg-white dark:bg-card p-4 rounded-xl border border-slate-100 shadow-sm dark:shadow-slate-900/20"
    >
      {/* Category Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <Icon className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-bold">{category.name}</span>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${severity.className}`}
        >
          {severity.emoji} {severity.label}
        </span>
      </div>

      {/* Bar (User is B, Entity is A) */}
      <PowerBar
        userPercent={category.party_b_percent}
        delay={delay}
        isInView={isInView}
        height="h-2.5"
      />

      {/* Percentages */}
      <div className="flex justify-between text-[11px] font-bold">
        <span className="text-teal-700">{partyBCount}%</span>
        <span className="text-rose-600">{partyACount}%</span>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
        {category.description}
      </p>

      {/* Key Clause Reference */}
      {category.key_clause && (
        <p className="text-[10px] text-slate-400 italic">
          Driven by: {category.key_clause}
        </p>
      )}
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PowerBalanceMeter({
  powerBalance,
}: PowerBalanceMeterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-80px" });

  if (!powerBalance) return null;

  const verdictStyle = getVerdictStyle(powerBalance.verdict);

  const overallACount = useCountUp(
    powerBalance.overall_party_a,
    isInView,
    0.3
  );
  const overallBCount = useCountUp(
    powerBalance.overall_party_b,
    isInView,
    0.3
  );

  const entityLabel = powerBalance.party_a_name || "Entity";
  const userLabel = powerBalance.party_b_name || "You";

  return (
    <Card className="bg-white dark:bg-card border-none shadow-sm dark:shadow-slate-900/20 rounded-2xl overflow-hidden" ref={containerRef}>
      <CardContent className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Scale className="h-6 w-6 text-indigo-600" />
          <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-100">Power Balance</h3>
        </div>

        {/* ═══════ OVERALL SECTION ═══════ */}
        <div className="space-y-4">
          {/* Party Labels + Percentages */}
          <div className="flex items-end justify-between">
            {/* Left: User (Party B) */}
            <div className="text-left">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wider font-bold">
                {powerBalance.party_b_role}
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-[140px] sm:max-w-[200px]">
                {userLabel}
              </p>
              <p className="text-lg md:text-xl lg:text-2xl md:text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl lg:text-4xl text-balance font-black text-teal-600 tabular-nums">
                {overallBCount}%
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={
                isInView
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 0, scale: 0.8 }
              }
              transition={{ duration: 0.5, delay: 1.5 }}
              className="text-center px-4 pb-1"
            >
              <span className="text-[10px] font-black text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-100">
                VS
              </span>
            </motion.div>

            {/* Right: Entity (Party A) */}
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wider font-bold">
                {powerBalance.party_a_role}
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-[140px] sm:max-w-[200px]">
                {entityLabel}
              </p>
              <p className="text-lg md:text-xl lg:text-2xl md:text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl lg:text-4xl text-balance font-black text-rose-500 tabular-nums">
                {overallACount}%
              </p>
            </div>
          </div>

          {/* Main Bar */}
          <PowerBar
            userPercent={powerBalance.overall_party_b}
            delay={0.5}
            isInView={isInView}
            height="h-6"
          />

          {/* Color Legend */}
          <div className="flex justify-between text-[11px] font-bold text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-600 shadow-[0_0_8px_rgba(13,148,136,0.3)]" />
              <span>Your Power</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Entity Power</span>
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]" />
            </div>
          </div>
        </div>

        {/* ═══════ VERDICT ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.6, delay: 1.6 }}
          className={`p-5 rounded-2xl border ${verdictStyle.bg} ${verdictStyle.glow} mt-4`}
        >
          <p className={`text-lg font-black ${verdictStyle.color} mb-1.5 tracking-tight`}>
            {powerBalance.verdict}
          </p>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {powerBalance.verdict_description}
          </p>
          <div className="flex items-center gap-3 mt-4 bg-white dark:bg-slate-900/50 p-2 rounded-lg">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Fairness Score
            </span>
            <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden max-w-[140px]">
              <motion.div
                className={`h-full rounded-full ${
                  powerBalance.fairness_score >= 70
                    ? "bg-teal-500"
                    : powerBalance.fairness_score >= 40
                      ? "bg-amber-400"
                      : "bg-rose-500"
                }`}
                initial={{ width: 0 }}
                animate={
                  isInView
                    ? { width: `${powerBalance.fairness_score}%` }
                    : { width: 0 }
                }
                transition={{ duration: 1, delay: 2 }}
              />
            </div>
            <span className="text-xs font-black text-slate-700 tabular-nums">
              {powerBalance.fairness_score}/100
            </span>
          </div>
        </motion.div>

        {/* ═══════ CATEGORY BREAKDOWN ═══════ */}
        <div className="pt-2">
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 1.7 }}
            className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest pl-1 border-b border-slate-100 pb-2"
          >
            Category Breakdown
          </motion.p>

          <div className="space-y-3">
            {powerBalance.categories.map((category, index) => (
               <CategoryRow
                 key={category.key}
                 category={category}
                 index={index}
                 isInView={isInView}
               />
            ))}
          </div>
        </div>

        {/* ═══════ FOOTER NOTE ═══════ */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 0.8 } : { opacity: 0 }}
          transition={{ delay: 3 }}
          className="text-xs font-medium text-center text-slate-400 pt-4"
        >
          A fair contract distributes power equally (50/50). Imbalance above 65/35 against you is highly predatory.
        </motion.p>
      </CardContent>
    </Card>
  );
}