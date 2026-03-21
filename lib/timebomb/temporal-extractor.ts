// ============================================
// TEMPORAL EXTRACTION ENGINE
// AI-powered extraction of temporal obligations
// from contract text. Follows value-extractor.ts pattern.
// ============================================

import { callGroq } from "@/lib/ai/groq-client";
import type {
  TemporalExtractionResult,
  ExtractedDeadline,
  DeadlineChain,
} from "@/types";

const TEMPORAL_EXTRACTION_PROMPT = `You are an Indian contract temporal analysis expert. Your task is to extract EVERY temporal obligation, deadline, window, period, and date from this contract.

For each temporal obligation, provide a JSON object with these exact fields:
- deadline_type: one of "notice_period", "renewal_window", "penalty_trigger", "lock_in_expiry", "grace_period", "escalation", "payment_due", "auto_renewal", "termination_window", "price_increase", "review_period", "warranty_expiry", "dispute_deadline", "compliance_deadline", "other"
- title: clear action-oriented title (e.g. "Send termination notice to landlord")
- description: plain language explanation of this deadline (2-3 sentences)
- clause_reference: quote the relevant clause text (max 100 chars)
- clause_number: which clause number this comes from (integer)
- relative_days: days from contract signing date when this deadline occurs (integer, e.g. 330 means day 330 after signing)
- relative_description: human readable (e.g. "11 months from signing", "60 days before renewal")
- is_recurring: boolean — does this repeat (monthly rent, quarterly review)
- recurrence_interval_days: if recurring, interval in days (e.g. 30 for monthly). null if not recurring
- financial_impact: rupee amount at stake if missed (number or null if not quantifiable). ONLY state amounts explicitly mentioned in the contract
- financial_description: describe the financial consequence (e.g. "₹50,000 penalty" or "lose security deposit of ₹1,20,000")
- consequence_if_missed: what happens if user misses this deadline (1-2 sentences)
- consequence_severity: "catastrophic" (lose everything/eviction/termination/full penalty), "major" (significant loss >₹10,000), "moderate" (moderate loss), or "minor" (small fees)
- action_required: what the user must DO (1-2 sentences)
- action_template_type: "termination_notice", "renewal_rejection", "refund_request", "payment_reminder", "dispute_notice", "compliance_report", "general_notice", or "none"
- linked_deadline_index: if missing this triggers another deadline, put the index of that deadline in the array (integer or null)
- warning_days: array of days before deadline to warn user, e.g. [30, 14, 7, 3, 1]

Also identify DEADLINE CHAINS — sequences where missing one deadline triggers another:
Example: Missing 60-day notice → auto-renewal for 12 months → miss next notice → locked again

Indian-specific patterns to look for:
- 11-month agreement periods (common to avoid registration)
- Lock-in periods (6-12 months in Indian rentals)
- Notice periods (30/60/90 day patterns)
- Security deposit return timelines
- TDS deposit deadlines (rent > ₹50,000/month)
- Stamp duty payment windows
- Agreement registration deadlines (if > 11 months)
- RERA milestone dates (real estate)
- Gratuity vesting (5 years employment)
- PF withdrawal timelines
- Non-compete activation on exit
- Loan EMI due dates and penalty triggers
- Auto-debit authorization periods
- Insurance claim filing windows

Return a JSON object with:
{
  "signing_date_detected": string | null (if you found a date in the contract text),
  "contract_duration_days": number | null (total contract duration in days),
  "contract_end_date_relative": number | null (days from signing to contract end),
  "deadlines": [ array of deadline objects ],
  "deadline_chains": [
    {
      "chain_name": string (e.g. "Renewal Trap Chain"),
      "description": string,
      "deadline_indices": number[] (indices into deadlines array),
      "total_financial_risk": number (combined ₹ impact),
      "chain_type": "sequential" | "parallel" | "conditional"
    }
  ],
  "overall_temporal_risk": "low" | "medium" | "high" | "extreme",
  "temporal_risk_summary": string (2-3 sentence summary of temporal risks)
}

Be CONSERVATIVE with financial estimates. If a deadline is ambiguous, flag it in the description.
ALWAYS respond with valid JSON. Nothing else.`;

/**
 * Extract all temporal obligations from a contract using AI
 */
export async function extractTemporalObligations(
  contractText: string,
  documentType: string,
  jurisdiction: string,
  clausesData: Array<{
    clause_number: number;
    original_text: string;
    clause_type: string;
  }>
): Promise<TemporalExtractionResult> {
  try {
    // Truncate to leave room for prompt + clause data
    const truncatedText = contractText.slice(0, 12000);

    const clausesSummary = clausesData
      .map(
        (c) =>
          `Clause ${c.clause_number} (${c.clause_type}): ${c.original_text.slice(0, 200)}`
      )
      .join("\n");

    const response = await callGroq(
      [
        { role: "system", content: TEMPORAL_EXTRACTION_PROMPT },
        {
          role: "user",
          content: `Contract type: ${documentType}
Jurisdiction: ${jurisdiction}

Contract clauses:
${clausesSummary}

Full contract text:
${truncatedText}`,
        },
      ],
      {
        temperature: 0.0,
        maxTokens: 4096,
      }
    );

    const parsed = JSON.parse(response);

    // Validate and sanitize deadlines
    const deadlines: ExtractedDeadline[] = [];
    const rawDeadlines = Array.isArray(parsed.deadlines)
      ? parsed.deadlines
      : [];

    for (const d of rawDeadlines.slice(0, 50)) {
      if (!d.title || typeof d.relative_days !== "number") continue;

      deadlines.push({
        deadline_type: d.deadline_type || "other",
        title: String(d.title || ""),
        description: String(d.description || ""),
        clause_reference: String(d.clause_reference || "").slice(0, 200),
        clause_number: Number(d.clause_number) || 1,
        relative_days: Math.max(0, Number(d.relative_days) || 0),
        relative_description: String(d.relative_description || ""),
        is_recurring: Boolean(d.is_recurring),
        recurrence_interval_days: d.recurrence_interval_days
          ? Number(d.recurrence_interval_days)
          : null,
        financial_impact:
          d.financial_impact != null ? Number(d.financial_impact) : null,
        financial_description: String(d.financial_description || ""),
        consequence_if_missed: String(d.consequence_if_missed || ""),
        consequence_severity: d.consequence_severity || "moderate",
        action_required: String(d.action_required || ""),
        action_template_type: d.action_template_type || "none",
        linked_deadline_index:
          d.linked_deadline_index != null
            ? Number(d.linked_deadline_index)
            : null,
        warning_days: Array.isArray(d.warning_days)
          ? d.warning_days.map(Number).filter((n: number) => n > 0)
          : [30, 14, 7, 3, 1],
      });
    }

    // Validate chains
    const chains: DeadlineChain[] = [];
    const rawChains = Array.isArray(parsed.deadline_chains)
      ? parsed.deadline_chains
      : [];

    for (const c of rawChains) {
      if (!c.chain_name) continue;
      chains.push({
        chain_name: String(c.chain_name),
        description: String(c.description || ""),
        deadline_indices: Array.isArray(c.deadline_indices)
          ? c.deadline_indices.map(Number)
          : [],
        total_financial_risk: Number(c.total_financial_risk) || 0,
        chain_type: c.chain_type || "sequential",
      });
    }

    return {
      signing_date_detected: parsed.signing_date_detected || null,
      contract_duration_days: parsed.contract_duration_days
        ? Number(parsed.contract_duration_days)
        : null,
      contract_end_date_relative: parsed.contract_end_date_relative
        ? Number(parsed.contract_end_date_relative)
        : null,
      deadlines,
      deadline_chains: chains,
      overall_temporal_risk: parsed.overall_temporal_risk || "low",
      temporal_risk_summary: String(
        parsed.temporal_risk_summary || "No significant temporal risks detected."
      ),
    };
  } catch (error) {
    console.error("[TimeBomb] Temporal extraction failed:", error);

    return {
      signing_date_detected: null,
      contract_duration_days: null,
      contract_end_date_relative: null,
      deadlines: [],
      deadline_chains: [],
      overall_temporal_risk: "low",
      temporal_risk_summary:
        "Temporal extraction could not be completed. Please review the contract manually for deadlines.",
    };
  }
}
