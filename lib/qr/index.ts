// ============================================
// QR BADGE SYSTEM — CLAUSEWALL
// Tier logic, share ID generation, config
// ============================================

import type { VerificationTier, ShareSettings } from "@/types";

export type { VerificationTier, ShareSettings };

// ============================================
// TIER CONFIG
// ============================================

export interface TierConfig {
  tier: VerificationTier;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  icon: string;
}

const TIER_CONFIGS: Record<VerificationTier, TierConfig> = {
  verified: {
    tier: "verified",
    label: "ClauseWall VERIFIED",
    shortLabel: "Verified",
    description: "Low Risk — Safe to Sign",
    color: "#22c55e",
    bgClass: "bg-green-500/10",
    borderClass: "border-green-500/30",
    textClass: "text-green-400",
    icon: "✅",
  },
  reviewed: {
    tier: "reviewed",
    label: "ClauseWall REVIEWED",
    shortLabel: "Reviewed",
    description: "Moderate Risk — Review Carefully",
    color: "#eab308",
    bgClass: "bg-yellow-500/10",
    borderClass: "border-yellow-500/30",
    textClass: "text-yellow-400",
    icon: "⚠️",
  },
  needs_work: {
    tier: "needs_work",
    label: "NEEDS IMPROVEMENT",
    shortLabel: "Needs Work",
    description: "High Risk — Significant Issues Found",
    color: "#ef4444",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/30",
    textClass: "text-red-400",
    icon: "❌",
  },
};

// ============================================
// FUNCTIONS
// ============================================

export function generateShareId(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getVerificationTier(score: number): VerificationTier {
  if (score <= 30) return "verified";
  if (score <= 60) return "reviewed";
  return "needs_work";
}

export function getTierConfig(tier: VerificationTier): TierConfig {
  return TIER_CONFIGS[tier];
}

export function getVerifyUrl(shareId: string): string {
  return `https://clause-wall.vercel.app/verify/${shareId}`;
}

export const DEFAULT_SHARE_SETTINGS: ShareSettings = {
  show_entity: false,
  show_summary: false,
  allow_full_analysis: false,
};