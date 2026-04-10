import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeErrorResponse } from "@/lib/api/error-response";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const rl = await rateLimit(request, "PUBLIC");
  if (!rl.success) return rateLimitResponse(rl);

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ error: "roomId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("collab_annotations")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (error) {
    return safeErrorResponse("collab-annotations", error, "Failed to fetch annotations");
  }

  return NextResponse.json({ success: true, annotations: data });
}

export async function POST(request: NextRequest) {
  try {
    const rl = await rateLimit(request, "PUBLIC");
    if (!rl.success) return rateLimitResponse(rl);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      roomId,
      clauseId,
      authorName,
      authorColor,
      content,
      parentId,
    } = body;

    if (!roomId || !clauseId || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("collab_annotations")
      .insert({
        room_id: roomId,
        clause_id: clauseId,
        author_id: user.id,
        author_name: authorName || user.user_metadata?.full_name || "Anonymous",
        author_color: authorColor || "#6B7280",
        content,
        parent_id: parentId || null,
      })
      .select()
      .single();

    if (error) {
      return safeErrorResponse("collab-annotations", error, "Failed to insert annotation");
    }

    return NextResponse.json({ success: true, annotation: data });
  } catch (error) {
    return safeErrorResponse("collab-annotations", error, "Failed to create annotation");
  }
}

export async function DELETE(request: NextRequest) {
  const rl = await rateLimit(request, "PUBLIC");
  if (!rl.success) return rateLimitResponse(rl);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "id required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only allow deleting your own annotations
  const { error } = await supabase
    .from("collab_annotations")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id);

  if (error) {
    return safeErrorResponse("collab-annotations", error, "Failed to delete annotation");
  }

  return NextResponse.json({ success: true });
}
