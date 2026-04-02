// ============================================
// WATCHDOG SHARED CONSTANTS & UTILITIES
// Single source of truth for sector metadata,
// severity configs, and time formatting.
// ============================================

import type { CompanySector, ChangeDirection, ChangeSeverity } from "@/types";

// ---- SECTOR METADATA ----

export const SECTOR_ICONS: Record<string, string> = {
  ride_hailing: "🚗",
  food_delivery: "🍔",
  ecommerce: "🛒",
  payments: "💳",
  social: "💬",
  streaming: "🎬",
  travel: "✈️",
  banking: "🏦",
  telecom: "📱",
  edtech: "📚",
  government: "🏛️",
  other: "📋",
};

export const SECTOR_LABELS: Record<string, string> = {
  ride_hailing: "Ride-hailing",
  food_delivery: "Food Delivery",
  ecommerce: "E-commerce",
  payments: "Payments",
  social: "Social",
  streaming: "Streaming",
  travel: "Travel",
  banking: "Banking",
  telecom: "Telecom",
  edtech: "EdTech",
  government: "Government",
  other: "Other",
};

export const ALL_SECTORS: CompanySector[] = [
  "ride_hailing",
  "food_delivery",
  "ecommerce",
  "payments",
  "social",
  "streaming",
  "travel",
  "banking",
  "telecom",
  "edtech",
  "government",
];

// ---- SEVERITY CONFIG ----

export interface SeverityStyle {
  badgeClass: string;
  emoji: string;
  label: string;
}

export const SEVERITY_CONFIG: Record<string, SeverityStyle> = {
  critical: { badgeClass: "bg-red-50 text-red-700 border-red-200", emoji: "🔴", label: "CRITICAL" },
  major: { badgeClass: "bg-amber-50 text-amber-700 border-amber-200", emoji: "🟡", label: "MAJOR" },
  minor: { badgeClass: "bg-blue-50 text-blue-700 border-blue-200", emoji: "🔵", label: "MINOR" },
  cosmetic: { badgeClass: "bg-slate-50 text-slate-700 border-slate-200", emoji: "⚪", label: "COSMETIC" },
};

/** Return the emoji for a given severity level. */
export function severityEmoji(severity: string): string {
  return SEVERITY_CONFIG[severity]?.emoji ?? "📋";
}

// ---- TIME FORMATTING ----

/** Human-friendly relative time string. */
export function getTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
