import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ error: "roomId required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("collab_annotations")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, annotations: data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      roomId,
      clauseId,
      authorId,
      authorName,
      authorColor,
      content,
      parentId,
    } = body;

    if (!roomId || !clauseId || !authorId || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("collab_annotations")
      .insert({
        room_id: roomId,
        clause_id: clauseId,
        author_id: authorId,
        author_name: authorName || "Anonymous",
        author_color: authorColor || "#6B7280",
        content,
        parent_id: parentId || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, annotation: data });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create annotation" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const authorId = searchParams.get("authorId");

  if (!id || !authorId) {
    return NextResponse.json(
      { error: "id and authorId required" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("collab_annotations")
    .delete()
    .eq("id", id)
    .eq("author_id", authorId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
