// Evidence Item Detail — GET, PATCH, DELETE
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const { itemId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("evidence_items")
      .select("*")
      .eq("id", itemId)
      .eq("user_id", user.id)
      .single();

    if (error || !data)
      return NextResponse.json({ error: "Item not found" }, { status: 404 });

    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const { itemId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const allowed = ["title", "description", "tags", "issue_category", "notes"];
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const { data, error } = await supabase
      .from("evidence_items")
      .update(updates)
      .eq("id", itemId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const { itemId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get item to find case_id
    const { data: item } = await supabase
      .from("evidence_items")
      .select("case_id")
      .eq("id", itemId)
      .eq("user_id", user.id)
      .single();

    if (!item)
      return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const { deleteEvidenceItem } = await import("@/lib/evidence/capture");
    const success = await deleteEvidenceItem(itemId, item.case_id);

    if (!success)
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 },
    );
  }
}
