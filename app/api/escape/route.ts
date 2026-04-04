import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/ai/groq-client";
import { ESCAPE_PLAN_PROMPT } from "@/lib/ai/system-prompt";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: "Missing documentId" },
        { status: 400 },
      );
    }

    // Fetch document and clauses from Supabase
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
      return NextResponse.json(
        { error: "No clauses found for this document" },
        { status: 404 },
      );
    }

    // Filter to only dangerous and illegal clauses
    const riskyClausesRaw = clauses.filter(
      (c: { risk_level: string }) =>
        c.risk_level === "dangerous" || c.risk_level === "illegal",
    );

    if (riskyClausesRaw.length === 0) {
      return NextResponse.json({
        severity: "low",
        can_escape: false,
        summary:
          "This contract has no dangerous or illegal clauses. No escape plan is needed — this is a relatively fair contract.",
        void_clauses: [],
        escape_steps: [],
        recovery: {
          items: [],
          interest_rate: "N/A",
          interest_amount: 0,
          total: 0,
        },
        total_recoverable: 0,
        estimated_timeline: "N/A",
        success_probability: "low",
        success_explanation: "No actionable violations found.",
        warnings: [],
        immediate_actions: [],
      });
    }

    // Build clause context for AI
    const clauseContext = riskyClausesRaw
      .map(
        (c: {
          clause_number: number;
          clause_type: string;
          risk_level: string;
          risk_score: number;
          original_text: string;
          explanation: string;
          legal_citation: string | null;
        }) =>
          `[Clause #${c.clause_number}] (Type: ${c.clause_type}, Risk: ${c.risk_level}, Score: ${c.risk_score}/100)
Text: "${c.original_text}"
Analysis: ${c.explanation}
Legal Citation: ${c.legal_citation || "None"}`,
      )
      .join("\n\n---\n\n");

    // Include all clauses summary for context
    const allClausesSummary = clauses
      .map(
        (c: {
          clause_number: number;
          clause_type: string;
          risk_level: string;
        }) => `Clause #${c.clause_number}: ${c.clause_type} (${c.risk_level})`,
      )
      .join("\n");

    const response = await callGroq(
      [
        {
          role: "system",
          content: ESCAPE_PLAN_PROMPT,
        },
        {
          role: "user",
          content: `Generate an escape plan for a user who has ALREADY SIGNED this contract.

Document Type: ${doc.document_type}
Jurisdiction: ${doc.jurisdiction}
Entity: ${doc.entity_name || "Unknown"}
Overall Risk Score: ${doc.overall_risk_score}/100
Total Clauses: ${doc.total_clauses}
Dangerous: ${doc.dangerous_count}, Illegal: ${doc.illegal_count}

ALL CLAUSES OVERVIEW:
${allClausesSummary}

DANGEROUS & ILLEGAL CLAUSES (analyze these for escape):
${clauseContext}`,
        },
      ],
      { maxTokens: 6000 },
    );

    // Parse response
    let parsed;
    try {
      let cleaned = response.trim();
      if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
      if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
      if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
      parsed = JSON.parse(cleaned.trim());
    } catch {
      console.error(
        "[ClauseWall] Escape plan JSON parse failed. Raw:",
        response,
      );
      return NextResponse.json(
        { error: "Failed to parse escape plan" },
        { status: 500 },
      );
    }

    // Validate and sanitize
    const validSeverities = ["low", "medium", "high", "critical"];
    const validProbabilities = ["low", "medium", "high", "very_high"];

    const result = {
      severity: validSeverities.includes(parsed.severity)
        ? parsed.severity
        : "medium",
      can_escape: parsed.can_escape !== false,
      summary: String(parsed.summary || "Escape plan generated."),
      void_clauses: Array.isArray(parsed.void_clauses)
        ? parsed.void_clauses.map((v: Record<string, unknown>) => ({
            clause_number: Number(v.clause_number) || 0,
            clause_text: String(v.clause_text || ""),
            why_void: String(v.why_void || "Potential violation"),
            law: String(v.law || "Indian Contract Act, 1872"),
            law_explanation: String(v.law_explanation || ""),
            void_type:
              v.void_type === "fully_void" || v.void_type === "partially_void"
                ? v.void_type
                : "fully_void",
            enforceable_portion: v.enforceable_portion
              ? String(v.enforceable_portion)
              : null,
            recoverable_amount: Number(v.recoverable_amount) || 0,
            recovery_method: String(
              v.recovery_method || "Legal notice → Court",
            ),
          }))
        : [],
      escape_steps: Array.isArray(parsed.escape_steps)
        ? parsed.escape_steps.map((s: Record<string, unknown>) => ({
            step_number: Number(s.step_number) || 1,
            title: String(s.title || ""),
            description: String(s.description || ""),
            action_type: [
              "awareness",
              "notice",
              "negotiate",
              "complaint",
              "refund",
            ].includes(s.action_type as string)
              ? s.action_type
              : "awareness",
            timeframe: String(s.timeframe || ""),
            details: String(s.details || ""),
            link_to:
              s.link_to === "letter" || s.link_to === "negotiate"
                ? s.link_to
                : null,
            authorities: Array.isArray(s.authorities)
              ? s.authorities.map((a: Record<string, unknown>) => ({
                  name: String(a.name || ""),
                  for: String(a.for || ""),
                  jurisdiction: String(a.jurisdiction || ""),
                  cost: String(a.cost || ""),
                  timeline: String(a.timeline || ""),
                  how_to_file: String(a.how_to_file || ""),
                }))
              : [],
          }))
        : [],
      recovery: {
        items: Array.isArray(parsed.recovery?.items)
          ? parsed.recovery.items.map((item: Record<string, unknown>) => ({
              label: String(item.label || ""),
              amount: Number(item.amount) || 0,
              explanation: String(item.explanation || ""),
            }))
          : [],
        interest_rate: String(parsed.recovery?.interest_rate || "6% per annum"),
        interest_amount: Number(parsed.recovery?.interest_amount) || 0,
        total: Number(parsed.recovery?.total) || 0,
      },
      total_recoverable: Number(parsed.total_recoverable) || 0,
      estimated_timeline: String(parsed.estimated_timeline || "30-90 days"),
      success_probability: validProbabilities.includes(
        parsed.success_probability,
      )
        ? parsed.success_probability
        : "medium",
      success_explanation: String(
        parsed.success_explanation ||
          "Based on established Indian legal precedent.",
      ),
      warnings: Array.isArray(parsed.warnings)
        ? parsed.warnings.map(String)
        : [
            "This is general guidance, not legal advice.",
            "Consult a lawyer for claims above ₹5,00,000.",
          ],
      immediate_actions: Array.isArray(parsed.immediate_actions)
        ? parsed.immediate_actions.map(String)
        : [
            "Save all payment receipts",
            "Screenshot the signed contract",
            "Document all communications",
          ],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ClauseWall] Escape plan API error:", error);
    return NextResponse.json(
      { error: "Failed to generate escape plan. Please try again." },
      { status: 500 },
    );
  }
}
