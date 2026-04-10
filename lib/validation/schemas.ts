// ============================================
// ROUTE SCHEMAS — Wave 1
// Public / unauthenticated AI endpoints
// ============================================

import { z } from "zod";
import { DocumentTypeEnum, JurisdictionSchema, UUIDSchema, RiskLevelEnum } from "./enums";

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

// ============================================
// ROUTE SCHEMAS — Wave 2
// Authenticated AI-heavy endpoints
// ============================================

// ── Reusable: Clause item for arrays sent to AI routes ──
const ClauseItemSchema = z.object({
  id: z.string().max(200).optional(),
  clause_number: z.coerce.number().int().min(0).optional(),
  clause_type: z.string().max(100).optional().default("general"),
  risk_level: RiskLevelEnum.optional(),
  risk_score: z.coerce.number().min(0).max(100).optional(),
  original_text: z.string().max(10_000).optional().default(""),
  explanation: z.string().max(5_000).optional().default(""),
  legal_issue: z.string().max(2_000).nullable().optional(),
  legal_citation: z.string().max(1_000).nullable().optional(),
  fair_alternative: z.string().max(5_000).nullable().optional(),
  negotiation_script: z.string().max(5_000).nullable().optional(),
  red_flags: z.array(z.string().max(500)).max(50).optional().default([]),
});

// ── /api/generate-letter ──
export const GenerateLetterSchema = z.object({
  documentType: DocumentTypeEnum.optional().default("other"),
  jurisdiction: JurisdictionSchema.optional().default("pan_india"),
  entityName: z.string().max(300).optional().default(""),
  clauses: z
    .array(ClauseItemSchema)
    .min(1, "At least one clause is required")
    .max(15, "Too many clauses for letter generation (maximum 15)"),
});

// ── /api/roast ──
export const RoastSchema = z.object({
  clauses: z
    .array(ClauseItemSchema)
    .min(1, "At least one clause is required")
    .max(15, "Too many clauses selected for roast (maximum 15)"),
  jurisdiction: JurisdictionSchema.optional().default("India"),
  documentType: DocumentTypeEnum.optional().default("other"),
});

// ── /api/rewrite ──
export const RewriteSchema = z.object({
  clauseText: z.string().min(1, "Clause text is required").max(10_000),
  clauseType: z.string().min(1, "Clause type is required").max(100),
  jurisdiction: JurisdictionSchema,
  documentType: DocumentTypeEnum,
  riskLevel: RiskLevelEnum.optional().default("warning"),
  explanation: z.string().max(5_000).nullable().optional(),
  legalCitation: z.string().max(1_000).nullable().optional(),
  fairAlternative: z.string().max(5_000).nullable().optional(),
});

// ── /api/explain ──
export const ExplainSchema = z
  .object({
    clauseText: z.string().max(2_000).optional().default(""),
    explanation: z.string().max(2_000).optional().default(""),
    riskLevel: RiskLevelEnum.optional().default("warning"),
    legalCitation: z.string().max(1_000).nullable().optional(),
    clauseType: z.string().max(100).optional().default("unknown"),
  })
  .refine((data) => data.clauseText || data.explanation, {
    message: "Either clauseText or explanation is required",
    path: ["clauseText"],
  });

// ── /api/simulate ──
export const SimulateSchema = z.object({
  documentId: UUIDSchema,
});

// ── /api/negotiate/generate ──
export const NegotiateGenerateSchema = z.object({
  documentId: UUIDSchema,
});

// ── /api/complaint/generate ──
const AuthorityTypeEnum = z.enum([
  "consumer_forum_district",
  "consumer_forum_state",
  "consumer_forum_national",
  "rera_authority",
  "rera_appellate",
  "labour_commissioner",
  "labour_court",
  "industrial_tribunal",
  "rent_controller",
  "rent_court",
  "rbi_ombudsman",
  "insurance_ombudsman",
  "banking_ombudsman",
  "epfo_regional",
  "esic_regional",
  "cat_bench",
  "sat_bench",
  "civil_court_district",
  "small_causes_court",
  "commercial_court",
  "high_court",
  "dlsa",
  "slsa",
  "nalsa",
  "women_commission_state",
  "women_commission_national",
  "sc_st_commission_state",
  "sc_st_commission_national",
  "information_commission_state",
  "information_commission_central",
  "police_station",
  "cyber_crime_cell",
  "other",
]);

export const ComplaintGenerateSchema = z.object({
  documentId: UUIDSchema,
  authorityType: AuthorityTypeEnum,
  complainantName: z.string().max(300).optional(),
  complainantAddress: z.string().max(1_000).optional(),
  complainantPhone: z.string().max(20).optional(),
  complainantEmail: z.string().email().max(254).optional().or(z.literal("")),
  respondentName: z.string().max(300).optional(),
  respondentAddress: z.string().max(1_000).optional(),
  respondentType: z.string().max(100).optional(),
  claimAmount: z.coerce.number().min(0).optional().default(0),
  additionalContext: z.string().max(5_000).optional(),
});

// ── /api/adversarial ──
export const AdversarialSchema = z.object({
  clauseText: z.string().min(1, "clauseText is required").max(10_000),
  clauseType: z.string().min(1, "clauseType is required").max(100),
  jurisdiction: JurisdictionSchema.optional().default("ALL-INDIA"),
  documentType: DocumentTypeEnum.optional().default("rental"),
});

// ── /api/deliberation/run ──
// Two modes: documentId (full doc) OR clauseText (single clause)
export const DeliberationRunSchema = z
  .object({
    documentId: UUIDSchema.optional(),
    clauseText: z.string().max(10_000).optional(),
    documentType: DocumentTypeEnum.optional(),
    jurisdiction: JurisdictionSchema.optional(),
  })
  .refine((data) => data.documentId || data.clauseText, {
    message: "Either documentId or clauseText is required",
    path: ["documentId"],
  });

// ── /api/autopsy ──
export const AutopsySchema = z.object({
  clauseText: z.string().min(1, "clauseText is required").max(10_000),
  clauseType: z.string().min(1, "clauseType is required").max(100),
  jurisdiction: JurisdictionSchema.optional().default("India"),
  documentType: DocumentTypeEnum.optional().default("other"),
  riskLevel: RiskLevelEnum.optional().default("warning"),
});

// ── /api/authority/complaint/draft ──
export const ComplaintDraftSchema = z.object({
  authority_id: z.string().max(100).optional(),
  document_context: z.object({
    document_type: z.string().max(100).optional().default("other"),
    entity_name: z.string().max(200).optional().default("Unknown Entity"),
    jurisdiction: z.string().max(100).optional().default("general"),
    violations: z.array(z.string().max(2000)).max(50).optional().default([]),
    summary: z.string().max(5000).optional().default(""),
    claim_amount: z.number().optional(),
    authority_name: z.string().max(200).optional(),
    authority_type: z.string().max(100).optional(),
    authority_address: z.string().max(500).optional(),
  }),
  complainant_name: z.string().min(1, "complainant_name is required").max(200),
  complainant_address: z.string().max(500).optional().default(""),
});

// ── /api/builder/generate ──
const BuilderTemplateTypeEnum = z.enum([
  "rental",
  "employment",
  "freelance",
  "nda",
  "loan",
  "partnership",
  "sale",
  "service",
  "mou",
  "poa",
]);

export const BuilderGenerateSchema = z.object({
  template_type: BuilderTemplateTypeEnum,
  jurisdiction: JurisdictionSchema,
  values: z.record(z.string().max(200), z.string().max(10_000)).optional().default({}),
});

// ── Wave 2 type exports ──
export type GenerateLetterInput = z.infer<typeof GenerateLetterSchema>;
export type RoastInput = z.infer<typeof RoastSchema>;
export type RewriteInput = z.infer<typeof RewriteSchema>;
export type ExplainInput = z.infer<typeof ExplainSchema>;
export type SimulateInput = z.infer<typeof SimulateSchema>;
export type NegotiateGenerateInput = z.infer<typeof NegotiateGenerateSchema>;
export type ComplaintGenerateInput = z.infer<typeof ComplaintGenerateSchema>;
export type AdversarialInput = z.infer<typeof AdversarialSchema>;
export type DeliberationRunInput = z.infer<typeof DeliberationRunSchema>;
export type AutopsyInput = z.infer<typeof AutopsySchema>;
export type ComplaintDraftInput = z.infer<typeof ComplaintDraftSchema>;
export type BuilderGenerateInput = z.infer<typeof BuilderGenerateSchema>;

