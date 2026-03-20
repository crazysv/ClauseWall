import { NextRequest, NextResponse } from "next/server";
import { createRoom } from "@/lib/collab/room-manager";

export async function POST(request: NextRequest) {
  try {
    const { documentId, hostName, sessionId } = await request.json();

    if (!documentId || !hostName || !sessionId) {
      return NextResponse.json(
        { error: "documentId, hostName, and sessionId are required" },
        { status: 400 }
      );
    }

    const room = await createRoom(documentId, hostName, sessionId);

    if (!room) {
      return NextResponse.json(
        { error: "Failed to create room. Document may not exist or analysis not complete." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      room,
      shareUrl: `/collab/${room.room_code}`,
    });
  } catch (error) {
    console.error("[ClauseWall] [API] Collab create failed:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}