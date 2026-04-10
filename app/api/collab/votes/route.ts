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
    .from("collab_votes")
    .select("*")
    .eq("room_id", roomId);

  if (error) {
    return safeErrorResponse("collab-votes", error, "Failed to fetch votes");
  }

  return NextResponse.json({ success: true, votes: data });
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
    const { roomId, clauseId, voterName, vote } = body;

    if (!roomId || !clauseId || !vote) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!["negotiate", "accept", "reject"].includes(vote)) {
      return NextResponse.json(
        { error: "Invalid vote value" },
        { status: 400 },
      );
    }

    // Upsert — update if exists, insert if not
    const { data, error } = await supabase
      .from("collab_votes")
      .upsert(
        {
          room_id: roomId,
          clause_id: clauseId,
          voter_id: user.id,
          voter_name: voterName || user.user_metadata?.full_name || "Anonymous",
          vote,
        },
        { onConflict: "room_id,clause_id,voter_id" },
      )
      .select()
      .single();

    if (error) {
      return safeErrorResponse("collab-votes", error, "Failed to cast vote");
    }

    return NextResponse.json({ success: true, vote: data });
  } catch (error) {
    return safeErrorResponse("collab-votes", error, "Failed to cast vote");
  }
}
