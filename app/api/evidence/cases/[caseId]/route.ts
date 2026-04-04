// Evidence Case Detail API — GET, PATCH, DELETE
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> },
) {
  try {
    const { caseId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("evidence_cases")
      .select("*")
      .eq("id", caseId)
      .eq("user_id", user.id)
      .single();

    if (error || !data)
      return NextResponse.json({ error: "Case not found" }, { status: 404 });

    // Also get items
    const { data: items } = await supabase
      .from("evidence_items")
      .select("*")
      .eq("case_id", caseId)
      .eq("user_id", user.id)
      .order("sequence_number", { ascending: true });

    return NextResponse.json({ case: data, items: items || [] });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch case" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> },
) {
  try {
    const { caseId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const allowed = [
      "title",
      "description",
      "counterparty_name",
      "counterparty_type",
      "counterparty_details",
      "dispute_type",
      "dispute_description",
      "status",
    ];
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const { data, error } = await supabase
      .from("evidence_cases")
      .update(updates)
      .eq("id", caseId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ case: data });
  } catch {
    return NextResponse.json(
      { error: "Failed to update case" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> },
) {
  try {
    const { caseId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("evidence_cases")
      .delete()
      .eq("id", caseId)
      .eq("user_id", user.id);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete case" },
      { status: 500 },
    );
  }
}
