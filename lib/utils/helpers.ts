// ============================================
// UTILITY HELPER FUNCTIONS
// ============================================

import type { RiskLevel } from "@/types";
import { RISK_COLORS, RISK_LABELS, RISK_BG_CLASSES, RISK_TEXT_CLASSES } from "./constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes (used by shadcn/ui)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get risk level from numeric score
 */
export function scoreToRiskLevel(score: number): RiskLevel {
  if (score <= 20) return "safe";
  if (score <= 50) return "warning";
  if (score <= 80) return "dangerous";
  return "illegal";
}

/**
 * Format date to human readable string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format date with time
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Format file size to human readable
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get score color as CSS value
 */
export function getScoreColor(score: number): string {
  const level = scoreToRiskLevel(score);
  return RISK_COLORS[level];
}

/**
 * Delay execution (for rate limiting)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safely parse JSON with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}