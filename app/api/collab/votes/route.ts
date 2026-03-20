import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ error: "roomId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collab_votes")
    .select("*")
    .eq("room_id", roomId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, votes: data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, clauseId, voterId, voterName, vote } = body;

    if (!roomId || !clauseId || !voterId || !vote) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["negotiate", "accept", "reject"].includes(vote)) {
      return NextResponse.json({ error: "Invalid vote value" }, { status: 400 });
    }

    const supabase = await createClient();

    // Upsert — update if exists, insert if not
    const { data, error } = await supabase
      .from("collab_votes")
      .upsert(
        {
          room_id: roomId,
          clause_id: clauseId,
          voter_id: voterId,
          voter_name: voterName || "Anonymous",
          vote,
        },
        { onConflict: "room_id,clause_id,voter_id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, vote: data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 });
  }
}