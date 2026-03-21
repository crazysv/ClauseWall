// ============================================
// GET /api/timebomb/action-letter/[deadlineId]
// Generate or fetch cached action letter
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateActionTemplate } from "@/lib/timebomb/action-generator";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deadlineId: string }> }
) {
  try {
    const { deadlineId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch deadline
    const { data: deadline, error } = await supabase
      .from("contract_deadlines")
      .select("*")
      .eq("id", deadlineId)
      .eq("user_id", user.id)
      .single();

    if (error || !deadline) {
      return NextResponse.json(
        { error: "Deadline not found" },
        { status: 404 }
      );
    }

    // Return cached template if available
    if (deadline.action_template) {
      return NextResponse.json({
        letter: deadline.action_template,
        deadline,
      });
    }

    // Fetch document for context
    const { data: doc } = await supabase
      .from("documents")
      .select("entity_name, document_type, jurisdiction, created_at")
      .eq("id", deadline.document_id)
      .single();

    // Generate the letter
    const letter = await generateActionTemplate(
      deadline,
      {
        entity_name: doc?.entity_name || "[COUNTERPARTY]",
        document_type: doc?.document_type || "other",
        jurisdiction: doc?.jurisdiction || "ALL-INDIA",
      },
      doc?.created_at
        ? new Date(doc.created_at).toLocaleDateString("en-IN")
        : "[DATE]"
    );

    // Cache the generated letter
    if (letter) {
      await supabase
        .from("contract_deadlines")
        .update({ action_template: letter, updated_at: new Date().toISOString() })
        .eq("id", deadlineId);
    }

    return NextResponse.json({
      letter,
      deadline: { ...deadline, action_template: letter },
    });
  } catch (error) {
    console.error("[TimeBomb API] Action letter error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
