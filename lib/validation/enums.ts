// ============================================
// SHARED ZOD ENUMS — Central source of truth
// ============================================

import { z } from "zod";

// ── Document Types ──

export const DocumentTypeEnum = z.enum([
  "rental",
  "employment",
  "tos",
  "loan",
  "freelance",
  "sale",
  "partnership",
  "nda",
  "other",
]);

// ── Jurisdictions ──
// Accept any non-empty string for jurisdiction since Indian states
// are handled as free-form strings in the DB (e.g., "pan_india",
// "maharashtra", "karnataka", etc.). We only enforce non-emptiness.
export const JurisdictionSchema = z
  .string()
  .min(1, "Jurisdiction is required")
  .max(100, "Jurisdiction too long");

// ── Risk Levels ──
export const RiskLevelEnum = z.enum([
  "safe",
  "warning",
  "dangerous",
  "illegal",
]);

// ── UUID ──
export const UUIDSchema = z
  .string()
  .uuid("Invalid ID format — expected a UUID");

// ── File size limits (bytes) ──
export const FILE_SIZE_LIMITS = {
  CONTRACT_PDF_TXT: 10 * 1024 * 1024,  // 10 MB
  OCR_IMAGE: 10 * 1024 * 1024,          // 10 MB
  AUDIO_STT_VOICE: 25 * 1024 * 1024,    // 25 MB
  EVIDENCE_GENERAL: 50 * 1024 * 1024,   // 50 MB
} as const;
