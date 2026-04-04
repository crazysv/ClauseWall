// Evidence Items API — POST (add evidence item)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addEvidenceItem } from "@/lib/evidence/capture";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      case_id,
      evidence_type,
      title,
      description,
      content,
      original_filename,
      storage_path,
      file_size_bytes,
      mime_type,
      extracted_data,
      captured_at,
      source,
      tags,
      issue_category,
      notes,
    } = body;

    if (!case_id || !evidence_type || !title) {
      return NextResponse.json(
        { error: "Missing required fields: case_id, evidence_type, title" },
        { status: 400 },
      );
    }

    // Verify case ownership
    const { data: caseData } = await supabase
      .from("evidence_cases")
      .select("id")
      .eq("id", case_id)
      .eq("user_id", user.id)
      .single();

    if (!caseData)
      return NextResponse.json({ error: "Case not found" }, { status: 404 });

    const result = await addEvidenceItem(case_id, user.id, {
      evidence_type,
      title,
      description,
      content: content || title, // fallback to title for hash if no content
      original_filename,
      storage_path,
      file_size_bytes,
      mime_type,
      extracted_data,
      captured_at,
      source,
      tags,
      issue_category,
      notes,
    });

    if (result.is_duplicate) {
      return NextResponse.json(
        { error: result.error, is_duplicate: true },
        { status: 409 },
      );
    }

    if (!result.item) {
      return NextResponse.json(
        { error: result.error || "Failed to add item" },
        { status: 500 },
      );
    }

    return NextResponse.json({ item: result.item }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to add evidence item" },
      { status: 500 },
    );
  }
}
