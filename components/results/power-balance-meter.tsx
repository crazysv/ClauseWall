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

const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
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
      className: "bg-background text-red-600 border-red-600",
    };
  if (partyAPercent >= 65)
    return {
      label: "Unfair",
      emoji: "🔴",
      className: "bg-background text-orange-600 border-orange-600",
    };
  if (partyAPercent >= 55)
    return {
      label: "Slight",
      emoji: "⚠️",
      className: "bg-background text-yellow-600 border-yellow-600",
    };
  return {
    label: "Fair",
    emoji: "✅",
    className: "bg-background text-green-600 border-green-600",
  };
}

function getVerdictStyle(verdict: string) {
  switch (verdict) {
    case "PREDATORY":
      return {
        color: "text-purple-600",
        bg: "bg-background border-purple-600 border-2",
        glow: "",
      };
    case "HEAVILY ONE-SIDED":
      return {
        color: "text-red-600",
        bg: "bg-background border-red-600 border-2",
        glow: "",
      };
    case "ONE-SIDED":
      return {
        color: "text-orange-600",
        bg: "bg-background border-orange-600 border-2",
        glow: "",
      };
    case "SLIGHTLY UNFAIR":
      return {
        color: "text-yellow-600",
        bg: "bg-background border-yellow-600 border-2",
        glow: "",
      };
    case "BALANCED":
      return {
        color: "text-green-600",
        bg: "bg-background border-green-600 border-2",
        glow: "",
      };
    case "FAIR":
      return {
        color: "text-green-600",
        bg: "bg-background border-green-600 border-2",
        glow: "",
      };
    default:
      return {
        color: "text-muted-foreground",
        bg: "bg-background border-muted-foreground border-2",
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
    <div
      className={`${height} border-2 border-foreground bg-muted overflow-hidden flex`}
    >
      <motion.div
        className="bg-red-600 border-r-2 border-foreground"
        initial={{ width: "50%" }}
        animate={isInView ? { width: `${partyAPercent}%` } : { width: "50%" }}
        transition={{
          duration: 1.5,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      />
      <div className="bg-blue-600 flex-1" />
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
          <Icon className="h-4 w-4 text-foreground" />
          <span className="text-sm font-black uppercase tracking-wider text-foreground">
            {category.name}
          </span>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 border-2 font-black uppercase tracking-wider ${severity.className}`}
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
        <span className="text-red-600 font-bold">{partyACount}%</span>
        <span className="text-blue-600 font-bold">{partyBCount}%</span>
      </div>

      {/* Description */}
      <p className="text-xs font-bold text-muted-foreground leading-relaxed">
        {category.description}
      </p>

      {/* Key Clause Reference */}
      {category.key_clause && (
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground italic">
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

  const overallACount = useCountUp(powerBalance.overall_party_a, isInView, 0.3);
  const overallBCount = useCountUp(powerBalance.overall_party_b, isInView, 0.3);

  const entityLabel = powerBalance.party_a_name || "Entity";
  const userLabel = powerBalance.party_b_name || "You";

  return (
    <Card className="card-impact border-2 border-foreground" ref={containerRef}>
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-foreground" />
          <h3 className="font-black uppercase tracking-wider text-lg lg:text-xl">
            Power Balance
          </h3>
        </div>

        {/* ═══════ OVERALL SECTION ═══════ */}
        <div className="space-y-3">
          {/* Party Labels + Percentages */}
          <div className="flex items-end justify-between">
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-0.5">
                {powerBalance.party_a_role}
              </p>
              <p className="text-sm font-bold text-foreground truncate max-w-[140px] sm:max-w-[200px]">
                {entityLabel}
              </p>
              <p className="text-2xl font-black text-red-600 tabular-nums">
                {overallACount}%
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={
                isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }
              }
              transition={{ duration: 0.5, delay: 1.5 }}
              className="text-center px-3"
            >
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                vs
              </span>
            </motion.div>

            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-0.5">
                {powerBalance.party_b_role}
              </p>
              <p className="text-sm font-bold text-foreground truncate max-w-[140px] sm:max-w-[200px]">
                {userLabel}
              </p>
              <p className="text-2xl font-black text-blue-600 tabular-nums">
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
          <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-600" />
              <span>Entity Power</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Your Power</span>
            </div>
          </div>
        </div>

        {/* ═══════ VERDICT ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.6, delay: 1.6 }}
          className={`p-4 card-impact ${verdictStyle.bg}`}
        >
          <p
            className={`text-lg font-black uppercase tracking-wider ${verdictStyle.color} mb-1`}
          >
            {powerBalance.verdict}
          </p>
          <p className="text-sm font-bold text-foreground leading-relaxed">
            {powerBalance.verdict_description}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Fairness Score:
            </span>
            <div className="flex-1 h-3 border-2 border-foreground bg-muted overflow-hidden max-w-[120px]">
              <motion.div
                className={`h-full border-r-2 border-foreground ${
                  powerBalance.fairness_score >= 70
                    ? "bg-green-600"
                    : powerBalance.fairness_score >= 40
                      ? "bg-yellow-600"
                      : "bg-red-600"
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
            <span className="text-xs font-black text-foreground tabular-nums">
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
            className="text-sm font-black text-foreground mb-4 uppercase tracking-wider border-b-2 border-foreground pb-1"
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
          className="text-[10px] font-bold text-center text-muted-foreground uppercase tracking-wider pt-2 border-t-2 border-foreground"
        >
          A fair contract distributes power equally (50/50). Imbalance above
          65/35 is concerning.
        </motion.p>
      </CardContent>
    </Card>
  );
}
