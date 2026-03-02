// ============================================
// CLAUSEWALL CONSTANTS — INDIA EDITION 🇮🇳
// ============================================

export const DOCUMENT_TYPES = [
  { value: "rental", label: "Rental / Leave & License Agreement" },
  { value: "employment", label: "Employment / Offer Letter" },
  { value: "tos", label: "Terms of Service / Privacy Policy" },
  { value: "loan", label: "Loan Agreement (Bank/NBFC)" },
  { value: "freelance", label: "Freelance / Service Contract" },
  { value: "sale", label: "Sale Agreement / Sale Deed" },
  { value: "partnership", label: "Partnership / Shareholder Agreement" },
  { value: "nda", label: "NDA / Confidentiality Agreement" },
  { value: "other", label: "Other Document" },
] as const;

export const JURISDICTIONS = [
  { value: "IN-MH", label: "Maharashtra" },
  { value: "IN-DL", label: "Delhi NCR" },
  { value: "IN-KA", label: "Karnataka" },
  { value: "IN-TN", label: "Tamil Nadu" },
  { value: "IN-UP", label: "Uttar Pradesh" },
  { value: "IN-GJ", label: "Gujarat" },
  { value: "IN-WB", label: "West Bengal" },
  { value: "IN-RJ", label: "Rajasthan" },
  { value: "IN-TS", label: "Telangana" },
  { value: "IN-KL", label: "Kerala" },
  { value: "IN-AP", label: "Andhra Pradesh" },
  { value: "IN-MP", label: "Madhya Pradesh" },
  { value: "IN-HR", label: "Haryana" },
  { value: "IN-PB", label: "Punjab" },
  { value: "IN-BR", label: "Bihar" },
  { value: "IN-OR", label: "Odisha" },
  { value: "IN-JH", label: "Jharkhand" },
  { value: "IN-CG", label: "Chhattisgarh" },
  { value: "IN-UK", label: "Uttarakhand" },
  { value: "IN-GA", label: "Goa" },
  { value: "IN-OTHER", label: "Other State / UT" },
] as const;

export const RISK_COLORS = {
  safe: "#22c55e",
  warning: "#eab308",
  dangerous: "#ef4444",
  illegal: "#a855f7",
} as const;

export const RISK_BG_CLASSES = {
  safe: "bg-green-500/10 border-green-500/30",
  warning: "bg-yellow-500/10 border-yellow-500/30",
  dangerous: "bg-red-500/10 border-red-500/30",
  illegal: "bg-purple-500/10 border-purple-500/30",
} as const;

export const RISK_TEXT_CLASSES = {
  safe: "text-green-500",
  warning: "text-yellow-500",
  dangerous: "text-red-500",
  illegal: "text-purple-500",
} as const;

export const RISK_BORDER_CLASSES = {
  safe: "border-l-green-500",
  warning: "border-l-yellow-500",
  dangerous: "border-l-red-500",
  illegal: "border-l-purple-500",
} as const;

export const RISK_LABELS = {
  safe: "✅ Safe",
  warning: "⚠️ Caution",
  dangerous: "🔴 Dangerous",
  illegal: "⛔ Likely Illegal",
} as const;

export const RISK_LABELS_SHORT = {
  safe: "Safe",
  warning: "Caution",
  dangerous: "Dangerous",
  illegal: "Illegal",
} as const;

export const RISK_SCORE_RANGES = {
  safe: { min: 0, max: 20, label: "Safe" },
  warning: { min: 21, max: 50, label: "Needs Attention" },
  dangerous: { min: 51, max: 80, label: "Dangerous" },
  illegal: { min: 81, max: 100, label: "Critical" },
} as const;

// Key Indian Laws Reference
export const INDIAN_LAWS = {
  contract: {
    name: "Indian Contract Act, 1872",
    key_sections: ["Section 10", "Section 14-22", "Section 23", "Section 27", "Section 28", "Section 73-74"],
  },
  property: {
    name: "Transfer of Property Act, 1882",
    key_sections: ["Section 106", "Section 108", "Section 111"],
  },
  consumer: {
    name: "Consumer Protection Act, 2019",
    key_sections: ["Section 2(46)", "Unfair Contract Terms"],
  },
  it: {
    name: "Information Technology Act, 2000",
    key_sections: ["Section 43A", "Section 72A"],
  },
  rera: {
    name: "RERA (Real Estate Regulation Act), 2016",
    key_sections: ["Builder obligations", "Buyer rights"],
  },
  tenancy: {
    name: "Model Tenancy Act, 2021",
    key_sections: ["Deposit limits", "Notice periods"],
  },
  labour: {
    name: "Industrial Disputes Act, 1947",
    key_sections: ["Termination", "Retrenchment"],
  },
  shops: {
    name: "Shops and Establishments Act",
    key_sections: ["State-specific provisions"],
  },
  stamp: {
    name: "Indian Stamp Act, 1899",
    key_sections: ["Stamp duty requirements"],
  },
  registration: {
    name: "Registration Act, 1908",
    key_sections: ["Document registration requirements"],
  },
} as const;

// Type exports
export type RiskLevel = "safe" | "warning" | "dangerous" | "illegal";
export type DocumentType = (typeof DOCUMENT_TYPES)[number]["value"];
export type Jurisdiction = (typeof JURISDICTIONS)[number]["value"];

// Helper Functions
export function getRiskLevel(score: number): RiskLevel {
  if (score <= 20) return "safe";
  if (score <= 50) return "warning";
  if (score <= 80) return "dangerous";
  return "illegal";
}

export function getRiskColor(level: RiskLevel): string {
  return RISK_COLORS[level];
}

export function getRiskLabel(level: RiskLevel): string {
  return RISK_LABELS[level];
}

export function getRiskBgClass(level: RiskLevel): string {
  return RISK_BG_CLASSES[level];
}

export function getRiskTextClass(level: RiskLevel): string {
  return RISK_TEXT_CLASSES[level];
}

export function getRiskBorderClass(level: RiskLevel): string {
  return RISK_BORDER_CLASSES[level];
}

export function getStateName(code: string): string {
  const state = JURISDICTIONS.find((j) => j.value === code);
  return state?.label || code;
}

export function getDocumentTypeLabel(type: string): string {
  const docType = DOCUMENT_TYPES.find((d) => d.value === type);
  return docType?.label || type;
}

// App Configuration
export const APP_CONFIG = {
  name: "ClauseWall",
  tagline: "Your last line of defense before signing",
  description:
    "India's first AI-powered predatory clause detector. Upload any contract and instantly find unfair, dangerous, or illegal clauses with legal citations under Indian law.",
  url: "https://clausewall.vercel.app",
  github: "https://github.com/YOUR_USERNAME/clausewall",
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFileTypes: ["application/pdf", "text/plain"],
  country: "India",
  defaultJurisdiction: "IN-MH",
  contactEmail: "support@clausewall.com",
} as const;

// Analysis Configuration
export const ANALYSIS_CONFIG = {
  maxClausesPerDocument: 100,
  minTextLength: 50,
  maxTextLength: 50000,
  clauseDelayMs: 500, // Delay between clause analysis to avoid rate limiting
  maxRetries: 3,
} as const;