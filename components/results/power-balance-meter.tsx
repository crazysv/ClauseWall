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
      className: "bg-red-500/20 text-red-400 border border-red-500/30",
    };
  if (partyAPercent >= 65)
    return {
      label: "Unfair",
      emoji: "🔴",
      className: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    };
  if (partyAPercent >= 55)
    return {
      label: "Slight",
      emoji: "⚠️",
      className: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    };
  return {
    label: "Fair",
    emoji: "✅",
    className: "bg-green-500/20 text-green-400 border border-green-500/30",
  };
}

function getVerdictStyle(verdict: string) {
  switch (verdict) {
    case "PREDATORY":
      return {
        color: "text-purple-400",
        bg: "bg-purple-500/10 border-purple-500/30",
        glow: "shadow-purple-500/20",
      };
    case "HEAVILY ONE-SIDED":
      return {
        color: "text-red-400",
        bg: "bg-red-500/10 border-red-500/30",
        glow: "shadow-red-500/20",
      };
    case "ONE-SIDED":
      return {
        color: "text-orange-400",
        bg: "bg-orange-500/10 border-orange-500/30",
        glow: "shadow-orange-500/20",
      };
    case "SLIGHTLY UNFAIR":
      return {
        color: "text-yellow-400",
        bg: "bg-yellow-500/10 border-yellow-500/30",
        glow: "shadow-yellow-500/20",
      };
    case "BALANCED":
      return {
        color: "text-green-400",
        bg: "bg-green-500/10 border-green-500/30",
        glow: "shadow-green-500/20",
      };
    case "FAIR":
      return {
        color: "text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/30",
        glow: "shadow-emerald-500/20",
      };
    default:
      return {
        color: "text-gray-400",
        bg: "bg-gray-500/10 border-gray-500/30",
        glow: "",
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
  partyAPercent,
  delay,
  isInView,
  height = "h-4",
}: {
  partyAPercent: number;
  delay: number;
  isInView: boolean;
  height?: string;
}) {
  return (
    <div className={`${height} rounded-full overflow-hidden bg-gray-800 flex`}>
      <motion.div
        className="bg-gradient-to-r from-red-600 to-orange-500 rounded-l-full"
        initial={{ width: "50%" }}
        animate={isInView ? { width: `${partyAPercent}%` } : { width: "50%" }}
        transition={{
          duration: 1.5,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      />
      <div className="bg-gradient-to-r from-blue-500 to-emerald-400 rounded-r-full flex-1" />
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
  const severity = getSeverityInfo(category.party_a_percent);
  const delay = 1.8 + index * 0.2;

  const partyACount = useCountUp(category.party_a_percent, isInView, delay);
  const partyBCount = useCountUp(category.party_b_percent, isInView, delay);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ duration: 0.5, delay }}
      className="space-y-2"
    >
      {/* Category Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{category.name}</span>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${severity.className}`}
        >
          {severity.emoji} {severity.label}
        </span>
      </div>

      {/* Bar */}
      <PowerBar
        partyAPercent={category.party_a_percent}
        delay={delay}
        isInView={isInView}
        height="h-3"
      />

      {/* Percentages */}
      <div className="flex justify-between text-[11px]">
        <span className="text-red-400/80">{partyACount}%</span>
        <span className="text-blue-400/80">{partyBCount}%</span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        {category.description}
      </p>

      {/* Key Clause Reference */}
      {category.key_clause && (
        <p className="text-[10px] text-muted-foreground/60 italic">
          Driven by: {category.key_clause}
        </p>
      )}
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function PowerBalanceMeter({
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
    <Card className="bg-gray-900/50 border-gray-800 overflow-hidden" ref={containerRef}>
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-blue-400" />
          <h3 className="font-semibold text-lg">Power Balance</h3>
        </div>

        {/* ═══════ OVERALL SECTION ═══════ */}
        <div className="space-y-3">
          {/* Party Labels + Percentages */}
          <div className="flex items-end justify-between">
            <div className="text-left">
              <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wider">
                {powerBalance.party_a_role}
              </p>
              <p className="text-sm font-medium truncate max-w-[140px] sm:max-w-[200px]">
                {entityLabel}
              </p>
              <p className="text-2xl font-bold text-red-400 tabular-nums">
                {overallACount}%
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
              className="text-center px-3"
            >
              <span className="text-xs text-muted-foreground">vs</span>
            </motion.div>

            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wider">
                {powerBalance.party_b_role}
              </p>
              <p className="text-sm font-medium truncate max-w-[140px] sm:max-w-[200px]">
                {userLabel}
              </p>
              <p className="text-2xl font-bold text-blue-400 tabular-nums">
                {overallBCount}%
              </p>
            </div>
          </div>

          {/* Main Bar */}
          <PowerBar
            partyAPercent={powerBalance.overall_party_a}
            delay={0.5}
            isInView={isInView}
            height="h-6"
          />

          {/* Color Legend */}
          <div className="flex justify-between text-[10px] text-muted-foreground/60">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-600 to-orange-500" />
              <span>Entity Power</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" />
              <span>Your Power</span>
            </div>
          </div>
        </div>

        {/* ═══════ VERDICT ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.6, delay: 1.6 }}
          className={`p-4 rounded-xl border ${verdictStyle.bg} ${verdictStyle.glow} shadow-lg`}
        >
          <p className={`text-lg font-bold ${verdictStyle.color} mb-1`}>
            {powerBalance.verdict}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {powerBalance.verdict_description}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">
              Fairness Score:
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden max-w-[120px]">
              <motion.div
                className={`h-full rounded-full ${
                  powerBalance.fairness_score >= 70
                    ? "bg-green-500"
                    : powerBalance.fairness_score >= 40
                      ? "bg-yellow-500"
                      : "bg-red-500"
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
            <span className="text-xs font-medium tabular-nums">
              {powerBalance.fairness_score}/100
            </span>
          </div>
        </motion.div>

        {/* ═══════ CATEGORY BREAKDOWN ═══════ */}
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 1.7 }}
            className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider"
          >
            Category Breakdown
          </motion.p>

          <div className="space-y-5">
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
          animate={isInView ? { opacity: 0.5 } : { opacity: 0 }}
          transition={{ delay: 3 }}
          className="text-[10px] text-center text-muted-foreground/50 pt-2 border-t border-gray-800"
        >
          A fair contract distributes power equally (50/50). Imbalance above 65/35 is concerning.
        </motion.p>
      </CardContent>
    </Card>
  );
}