// ============================================
// VOICE-AID SESSION API — SESSION MANAGEMENT
// GET: retrieve session | DELETE: end session
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getSession, endSession } from "@/lib/voice-aid/session-manager";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "session id is required" },
        { status: 400 },
      );
    }

    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found or expired" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        language: session.language,
        status: session.status,
        document_id: session.document_id,
        messages: session.messages.map((m) => ({
          id: m.id,
          role: m.role,
          text: m.text,
          language: m.language,
          audio_url: m.audio_url,
          created_at: m.created_at,
        })),
        created_at: session.created_at,
        expires_at: session.expires_at,
      },
    });
  } catch (error) {
    console.error("[ClauseWall] [API] Session GET failed:", error);
    return NextResponse.json(
      { error: "Failed to retrieve session." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "session id is required" },
        { status: 400 },
      );
    }

    await endSession(sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ClauseWall] [API] Session DELETE failed:", error);
    return NextResponse.json(
      { error: "Failed to end session." },
      { status: 500 },
    );
  }
}
