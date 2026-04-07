/**
 * Converts raw DB clause_type labels into human-readable labels.
 * e.g. "SECURITY_DEPOSIT" → "Security Deposit"
 *      "LOCK_IN_PERIOD"   → "Lock-in Period"
 *      "PENALTIES"         → "Penalties"
 */

const CUSTOM_LABELS: Record<string, string> = {
  LOCK_IN_PERIOD: "Lock-in Period",
  SECURITY_DEPOSIT: "Security Deposit",
  RENT_PAYMENT: "Rent Payment",
  REPAIR_RESPONSIBILITY: "Repair Responsibility",
  NOTICE_PERIOD: "Notice Period",
  PENALTIES: "Penalties",
  RENT_ESCALATION: "Rent Escalation",
  MAINTENANCE: "Maintenance",
  SUBLETTING: "Subletting",
  TERMINATION: "Termination",
  INDEMNITY: "Indemnity",
  FORCE_MAJEURE: "Force Majeure",
  DISPUTE_RESOLUTION: "Dispute Resolution",
  GOVERNING_LAW: "Governing Law",
  RENEWAL: "Renewal",
  PETS_POLICY: "Pets Policy",
  PARKING: "Parking",
  FURNISHING: "Furnishing",
  UTILITIES: "Utilities",
};

export function formatClauseType(raw: string): string {
  if (!raw) return "";

  // Check custom map first
  const upper = raw.toUpperCase();
  if (CUSTOM_LABELS[upper]) return CUSTOM_LABELS[upper];

  // Fallback: replace underscores, title-case each word
  return raw
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
