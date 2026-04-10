import { NextRequest, NextResponse } from "next/server";
import { joinRoom } from "@/lib/collab/room-manager";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rl = await rateLimit(request, "PUBLIC");
    if (!rl.success) return rateLimitResponse(rl);

    const { roomCode } = await request.json();

    if (!roomCode) {
      return NextResponse.json(
        { error: "roomCode is required" },
        { status: 400 },
      );
    }

    const result = await joinRoom(roomCode);

    if (!result) {
      return NextResponse.json(
        { error: "Room not found, expired, or inactive" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      room: result.room,
      documentId: result.documentId,
    });
  } catch (error) {
    console.error("[ClauseWall] [API] Collab join failed:", error);
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}
