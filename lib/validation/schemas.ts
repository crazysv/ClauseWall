// ============================================
// ROUTE SCHEMAS — Wave 1
// Public / unauthenticated AI endpoints
// ============================================

import { z } from "zod";
import { DocumentTypeEnum, JurisdictionSchema, UUIDSchema } from "./enums";

// ── /api/extension/analyze ──
// PUBLIC (CORS *) — highest risk endpoint
export const ExtensionAnalyzeSchema = z.object({
  url: z.string().url("Invalid URL").max(2000).optional().or(z.literal("")),
  text: z
    .string()
    .min(100, "Not enough text to analyze (minimum 100 characters)")
    .max(50_000, "Text too long (maximum 50,000 characters)"),
  title: z.string().max(500).optional().default(""),
});

// ── /api/quick-scan (JSON body path) ──
// PUBLIC — accepts contract text for instant scan
export const QuickScanSchema = z.object({
  text: z
    .string()
    .min(50, "Text too short (minimum 50 characters)")
    .max(100_000, "Text too long (maximum 100,000 characters)"),
  documentType: DocumentTypeEnum.optional().default("other"),
  jurisdiction: JurisdictionSchema.optional().default("pan_india"),
});

// ── /api/analyze (JSON body path) ──
// Authenticated — accepts pasted text for full analysis
export const AnalyzeJsonSchema = z.object({
  text: z
    .string()
    .min(50, "Document text too short (minimum 50 characters)")
    .max(200_000, "Document text too long (maximum 200,000 characters)"),
  documentType: DocumentTypeEnum,
  jurisdiction: JurisdictionSchema,
  filename: z.string().max(255).optional().default("pasted-text.txt"),
});

// ── /api/bot/trigger-analysis ──
// Internal secret protected — accepts document + text for full analysis
export const TriggerAnalysisSchema = z.object({
  documentId: UUIDSchema,
  text: z
    .string()
    .min(1, "Text is required")
    .max(200_000, "Text too long"),
  documentType: DocumentTypeEnum.optional().default("other"),
  jurisdiction: JurisdictionSchema.optional().default("pan_india"),
  chatId: z.coerce.number().int().optional(),
});

// ── Type exports ──
export type ExtensionAnalyzeInput = z.infer<typeof ExtensionAnalyzeSchema>;
export type QuickScanInput = z.infer<typeof QuickScanSchema>;
export type AnalyzeJsonInput = z.infer<typeof AnalyzeJsonSchema>;
export type TriggerAnalysisInput = z.infer<typeof TriggerAnalysisSchema>;
