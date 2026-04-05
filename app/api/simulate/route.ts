import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/ai/groq-client";
import { CONTRACT_SIMULATOR_PROMPT } from "@/lib/ai/system-prompt";
import { createClient } from "@/lib/supabase/server";
import { sanitizeLLMInput } from "@/lib/sanitize";
import { SimulateSchema } from "@/lib/validation/schemas";
import { validateBody } from "@/lib/validation/middleware";
import { safeParseJson } from "@/lib/ai/output-guards";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Schema Validation ──
    const parsed = validateBody(body, SimulateSchema);
    if (!parsed.success) return parsed.response;
    const { documentId } = parsed.data;

    const supabase = await createClient();

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    const { data: clauses, error: clauseError } = await supabase
      .from("clauses")
      .select("*")
      .eq("document_id", documentId)
      .order("clause_number", { ascending: true });

    if (clauseError || !clauses || clauses.length === 0) {
      return NextResponse.json({ error: "No clauses found" }, { status: 404 });
    }

    const clauseContext = clauses
      .map(
        (c: {
          clause_number: number;
          clause_type: string;
          risk_level: string;
          original_text: string;
          explanation: string;
        }) =>
          `[Clause #${c.clause_number}] (${c.clause_type}, ${c.risk_level})
Text: "${sanitizeLLMInput(c.original_text || "", 3000)}"
Analysis: ${sanitizeLLMInput(c.explanation || "", 1000)}`,
      )
      .join("\n\n---\n\n");

    const response = await callGroq(
      [
        { role: "system", content: CONTRACT_SIMULATOR_PROMPT },
        {
          role: "user",
          content: `Generate a financial simulation for this contract.

Document Type: ${doc.document_type}
Jurisdiction: ${doc.jurisdiction}
Entity: ${doc.entity_name || "Unknown"}
Risk Score: ${doc.overall_risk_score}/100
Total Clauses: ${doc.total_clauses}

ALL CLAUSES:
${clauseContext}`,
        },
      ],
      { maxTokens: 5000 },
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aiResponse = safeParseJson(response) as any;
    if (!aiResponse) {
      console.error("[ClauseWall] Simulator JSON parse failed:", response.substring(0, 200));
      return NextResponse.json(
        { error: "Failed to parse simulation" },
        { status: 500 },
      );
    }

    // Sanitize response
    const sanitizeNum = (v: unknown, fallback = 0) => {
      const n = Number(v);
      return isNaN(n) ? fallback : n;
    };

    const result = {
      contract_duration_months: sanitizeNum(
        aiResponse.contract_duration_months,
        11,
      ),
      document_type: String(aiResponse.document_type || doc.document_type),
      upfront_costs: Array.isArray(aiResponse.upfront_costs)
        ? aiResponse.upfront_costs.map((c: Record<string, unknown>) => ({
            label: String(c.label || ""),
            amount: sanitizeNum(c.amount),
            is_refundable: !!c.is_refundable,
            refund_conditions: c.refund_conditions
              ? String(c.refund_conditions)
              : null,
            fair_amount: sanitizeNum(c.fair_amount),
            issue: c.issue ? String(c.issue) : null,
          }))
        : [],
      monthly_costs: Array.isArray(aiResponse.monthly_costs)
        ? aiResponse.monthly_costs.map((c: Record<string, unknown>) => ({
            label: String(c.label || ""),
            amount: sanitizeNum(c.amount),
            escalation_percent: sanitizeNum(c.escalation_percent),
            escalation_frequency_months: sanitizeNum(
              c.escalation_frequency_months,
            ),
            fair_amount: sanitizeNum(c.fair_amount),
          }))
        : [],
      exit_costs: Array.isArray(aiResponse.exit_costs)
        ? aiResponse.exit_costs.map((c: Record<string, unknown>) => ({
            label: String(c.label || ""),
            amount: sanitizeNum(c.amount),
            condition: String(c.condition || ""),
            fair_amount: sanitizeNum(c.fair_amount),
            issue: c.issue ? String(c.issue) : null,
          }))
        : [],
      penalties: {
        early_exit_during_lockin: aiResponse.penalties?.early_exit_during_lockin
          ? {
              amount: sanitizeNum(
                aiResponse.penalties.early_exit_during_lockin.amount,
              ),
              description: String(
                aiResponse.penalties.early_exit_during_lockin.description || "",
              ),
              is_legal: !!aiResponse.penalties.early_exit_during_lockin.is_legal,
              law: aiResponse.penalties.early_exit_during_lockin.law
                ? String(aiResponse.penalties.early_exit_during_lockin.law)
                : null,
            }
          : null,
        early_exit_after_lockin: aiResponse.penalties?.early_exit_after_lockin
          ? {
              amount: sanitizeNum(
                aiResponse.penalties.early_exit_after_lockin.amount,
              ),
              description: String(
                aiResponse.penalties.early_exit_after_lockin.description || "",
              ),
              is_legal: !!aiResponse.penalties.early_exit_after_lockin.is_legal,
              law: aiResponse.penalties.early_exit_after_lockin.law
                ? String(aiResponse.penalties.early_exit_after_lockin.law)
                : null,
            }
          : null,
        late_rent_per_day: aiResponse.penalties?.late_rent_per_day
          ? {
              amount: sanitizeNum(aiResponse.penalties.late_rent_per_day.amount),
              description: String(
                aiResponse.penalties.late_rent_per_day.description || "",
              ),
              is_legal: !!aiResponse.penalties.late_rent_per_day.is_legal,
              law: aiResponse.penalties.late_rent_per_day.law
                ? String(aiResponse.penalties.late_rent_per_day.law)
                : null,
            }
          : null,
      },
      lock_in: {
        months: sanitizeNum(aiResponse.lock_in?.months),
        applies_to: String(aiResponse.lock_in?.applies_to || "tenant_only"),
        is_mutual: !!aiResponse.lock_in?.is_mutual,
        fair_months: sanitizeNum(aiResponse.lock_in?.fair_months, 6),
        issue: aiResponse.lock_in?.issue ? String(aiResponse.lock_in.issue) : null,
      },
      notice_period: {
        days: sanitizeNum(aiResponse.notice_period?.days, 30),
        fair_days: sanitizeNum(aiResponse.notice_period?.fair_days, 30),
        issue: aiResponse.notice_period?.issue
          ? String(aiResponse.notice_period.issue)
          : null,
      },
      deposit_refund: {
        total_deposit: sanitizeNum(aiResponse.deposit_refund?.total_deposit),
        refund_timeline_days: sanitizeNum(
          aiResponse.deposit_refund?.refund_timeline_days,
        ),
        conditions: String(aiResponse.deposit_refund?.conditions || ""),
        refundable_if_full_term:
          aiResponse.deposit_refund?.refundable_if_full_term !== false,
        refundable_if_early_exit:
          !!aiResponse.deposit_refund?.refundable_if_early_exit,
        deductions: sanitizeNum(aiResponse.deposit_refund?.deductions),
      },
      danger_zones: Array.isArray(aiResponse.danger_zones)
        ? aiResponse.danger_zones.map((z: Record<string, unknown>) => ({
            month_start: sanitizeNum(z.month_start),
            month_end: sanitizeNum(z.month_end),
            label: String(z.label || ""),
            description: String(z.description || ""),
            severity: z.severity === "critical" ? "critical" : "warning",
          }))
        : [],
      scenarios: Array.isArray(aiResponse.scenarios)
        ? aiResponse.scenarios.map((s: Record<string, unknown>) => ({
            label: String(s.label || ""),
            total_cost: sanitizeNum(s.total_cost),
            deposit_returned: sanitizeNum(s.deposit_returned),
            penalty: sanitizeNum(s.penalty),
            net_cost: sanitizeNum(s.net_cost),
          }))
        : [],
      overpayment_vs_fair: sanitizeNum(aiResponse.overpayment_vs_fair),
      worst_case_total: sanitizeNum(aiResponse.worst_case_total),
      fair_contract_total: sanitizeNum(aiResponse.fair_contract_total),
      summary: String(aiResponse.summary || "Simulation generated."),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ClauseWall] Simulator API error:", error);
    return NextResponse.json(
      { error: "Failed to generate simulation. Please try again." },
      { status: 500 },
    );
  }
}
