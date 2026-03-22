// ============================================
// POISON PILL — KNOWN TRAP PATTERN DEFINITIONS
// Static data — NO AI calls, NO imports
// ============================================

import type { TrapPatternType, TrapSeverity } from "@/types";

export interface TrapPatternDefinition {
  pattern_type: TrapPatternType;
  name: string;
  description: string;
  clause_types_involved: string[];
  min_clauses_needed: number;
  connection_pattern: string;
  typical_severity: TrapSeverity;
  detection_keywords: string[][];
}

export const KNOWN_TRAP_PATTERNS: TrapPatternDefinition[] = [
  {
    pattern_type: "infinite_loop",
    name: "The Infinite Loop",
    description:
      "Auto-renewal + long notice period + early termination penalty = You can never leave without paying. Miss the narrow exit window and you're auto-renewed, penalty resets, trapped for another cycle.",
    clause_types_involved: [
      "auto_renewal", "notice_period", "termination", "penalty",
      "lock_in", "early_termination", "renewal",
    ],
    min_clauses_needed: 2,
    connection_pattern: "auto_renewal → notice_period → penalty (blocks escape)",
    typical_severity: "severe",
    detection_keywords: [
      ["auto-renew", "automatic renewal", "deemed renewed", "automatically renewed", "auto renew"],
      ["notice period", "prior notice", "written notice", "advance notice", "days notice", "days' notice"],
      ["penalty", "early termination fee", "liquidated damages", "pre-closure", "exit fee"],
    ],
  },
  {
    pattern_type: "escalation_trap",
    name: "The Escalation Trap",
    description:
      "Late payment fee + compounding interest + acceleration clause = One small missed payment snowballs into massive debt because penalties compound and acceleration makes the entire balance due immediately.",
    clause_types_involved: [
      "late_payment", "interest", "penalty", "acceleration", "default",
      "payment", "overdue",
    ],
    min_clauses_needed: 2,
    connection_pattern: "late_payment → interest (compounds) → acceleration (triggers)",
    typical_severity: "devastating",
    detection_keywords: [
      ["late payment", "overdue", "delayed payment", "default in payment", "failure to pay"],
      ["interest", "compound", "per month", "per annum", "compounding", "accrued interest"],
      ["acceleration", "entire amount due", "full balance", "outstanding amount", "accelerate"],
    ],
  },
  {
    pattern_type: "waiver_chain",
    name: "The Waiver Chain",
    description:
      "Arbitration + confidentiality + indemnity = Can't go to court, can't talk about it, and must pay their legal fees if you dispute. You can't fight back through any channel without going bankrupt.",
    clause_types_involved: [
      "arbitration", "confidentiality", "indemnity", "liability",
      "waiver", "dispute_resolution", "non_disclosure",
    ],
    min_clauses_needed: 2,
    connection_pattern: "arbitration → confidentiality (blocks_escape) → indemnity (amplifies)",
    typical_severity: "severe",
    detection_keywords: [
      ["arbitration", "sole arbitrator", "dispute resolution", "arbitral tribunal"],
      ["confidential", "non-disclosure", "shall not disclose", "keep confidential", "not reveal"],
      ["indemnify", "hold harmless", "legal costs", "legal fees", "bear the costs"],
    ],
  },
  {
    pattern_type: "scope_creep",
    name: "The Scope Creep",
    description:
      "Vague work description + broad non-compete + total IP assignment = Employer owns everything you create, can assign you any work, and you can't leave to do anything related in your field.",
    clause_types_involved: [
      "scope_of_work", "non_compete", "ip_assignment", "exclusivity",
      "duties", "responsibilities", "work_product", "intellectual_property",
    ],
    min_clauses_needed: 2,
    connection_pattern: "scope_of_work → ip_assignment (enables) → non_compete (blocks_escape)",
    typical_severity: "severe",
    detection_keywords: [
      ["duties as assigned", "other tasks", "as directed", "scope of work", "any other work", "additional responsibilities"],
      ["non-compete", "competing business", "similar business", "restrictive covenant", "not engage"],
      ["intellectual property", "work product", "all rights", "assign", "belongs to", "company's property"],
    ],
  },
  {
    pattern_type: "silent_amendment",
    name: "The Silent Amendment",
    description:
      "Unilateral modification clause + deemed acceptance + email-only notice = Company can change any term, notify you by email, and if you don't respond within days, you've 'agreed' to the change.",
    clause_types_involved: [
      "modification", "amendment", "notice", "deemed_acceptance",
      "communication", "unilateral", "terms_change",
    ],
    min_clauses_needed: 2,
    connection_pattern: "modification → notice (enables) → deemed_acceptance (triggers)",
    typical_severity: "severe",
    detection_keywords: [
      ["modify", "amend", "change terms", "update terms", "revise", "alter", "vary"],
      ["deemed", "silence", "failure to respond", "acceptance", "deemed to have accepted", "deemed accepted"],
      ["email", "website", "posted on", "notification", "electronic notice", "published"],
    ],
  },
  {
    pattern_type: "deposit_trap",
    name: "The Deposit Trap",
    description:
      "High security deposit + broad deduction clauses + no inspection requirement + short claim window = Landlord keeps your deposit because 'damages' includes normal wear, no move-in inspection baseline, and missed the short claim period.",
    clause_types_involved: [
      "security_deposit", "deduction", "inspection", "damage",
      "refund", "claim_period", "wear_and_tear", "deposit",
    ],
    min_clauses_needed: 2,
    connection_pattern: "security_deposit → deduction (enables) → claim_period (blocks_escape)",
    typical_severity: "moderate",
    detection_keywords: [
      ["security deposit", "advance", "earnest money", "caution deposit", "deposit amount"],
      ["deduct", "deduction", "damages", "restoration", "repair costs", "adjustments"],
      ["inspection", "condition report", "inventory", "handing over", "check-out"],
    ],
  },
  {
    pattern_type: "termination_asymmetry",
    name: "The Termination Asymmetry",
    description:
      "Company can terminate immediately 'for cause' (broadly defined) + you must give 90-day notice + no severance + non-compete activates on ANY termination = Fired without real cause, no money, can't work in your field.",
    clause_types_involved: [
      "termination", "notice_period", "severance", "non_compete",
      "cause", "misconduct", "resignation",
    ],
    min_clauses_needed: 2,
    connection_pattern: "termination (asymmetric) → non_compete (triggers) → severance (absent)",
    typical_severity: "devastating",
    detection_keywords: [
      ["terminate immediately", "for cause", "at will", "without notice", "summary termination", "forthwith"],
      ["notice period", "prior notice", "days notice", "months notice", "advance written notice"],
      ["non-compete", "restrictive covenant", "not engage", "competing", "similar business"],
    ],
  },
  {
    pattern_type: "insurance_void",
    name: "The Insurance Void",
    description:
      "Multiple exclusion clauses spread across document + broad pre-existing condition definition + long waiting period + high co-payment = Insurance that looks comprehensive but actually covers almost nothing.",
    clause_types_involved: [
      "exclusion", "pre_existing", "waiting_period", "co_payment",
      "coverage", "claim", "deductible", "sub_limit",
    ],
    min_clauses_needed: 2,
    connection_pattern: "exclusion → pre_existing (amplifies) → waiting_period (compounds)",
    typical_severity: "severe",
    detection_keywords: [
      ["exclude", "exclusion", "not covered", "does not include", "shall not be liable", "except"],
      ["pre-existing", "prior condition", "existing ailment", "pre existing", "known condition"],
      ["waiting period", "cooling period", "moratorium", "initial waiting"],
    ],
  },
  {
    pattern_type: "jurisdiction_trap",
    name: "The Jurisdiction Trap",
    description:
      "Governing law of a different state + exclusive jurisdiction in their city + short limitation period + no remote hearing = You must travel to their city, under their state's law, within a short window, at your own expense.",
    clause_types_involved: [
      "governing_law", "jurisdiction", "limitation", "dispute_resolution",
      "venue", "forum", "applicable_law",
    ],
    min_clauses_needed: 2,
    connection_pattern: "governing_law → jurisdiction (enables) → limitation (blocks_escape)",
    typical_severity: "moderate",
    detection_keywords: [
      ["governing law", "applicable law", "laws of", "governed by", "construed in accordance"],
      ["exclusive jurisdiction", "courts of", "venue", "subject to the jurisdiction", "courts at"],
      ["limitation period", "time barred", "within days", "prescribed period", "statute of limitation"],
    ],
  },
  {
    pattern_type: "data_hostage",
    name: "The Data Hostage",
    description:
      "IP assignment (your data/content belongs to them) + no data portability + termination deletes your data + short retrieval window = Leaving the service means losing all your data/work/content forever.",
    clause_types_involved: [
      "ip_assignment", "data_ownership", "data_portability",
      "termination", "deletion", "content", "license", "user_data",
    ],
    min_clauses_needed: 2,
    connection_pattern: "data_ownership → termination (triggers) → deletion (enables)",
    typical_severity: "severe",
    detection_keywords: [
      ["intellectual property", "content", "data", "user data", "your content", "uploaded material"],
      ["ownership", "belongs to", "assigns", "grants", "exclusive license", "irrevocable"],
      ["deletion", "delete", "remove", "no portability", "non-transferable", "erase", "purge"],
    ],
  },
];
