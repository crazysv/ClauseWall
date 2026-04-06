// ============================================
// GET/POST /api/collective/[collectiveId]/messages — Messaging
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getMessages, sendMessage } from "@/lib/collective";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collectiveId: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { collectiveId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const before = searchParams.get("before") || undefined;

    const messages = await getMessages(collectiveId, user.id, limit, before);

    return NextResponse.json(messages);
  } catch (error) {
    console.error("[ClauseWall] [API] Get messages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collectiveId: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { collectiveId } = await params;
    const body = await request.json();
    const { content, messageType, replyTo } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content required" },
        { status: 400 },
      );
    }

    const message = await sendMessage(
      collectiveId,
      user.id,
      content,
      messageType || "discussion",
      replyTo,
    );

    if (!message) {
      return NextResponse.json(
        { error: "Failed to send message. Ensure you are a member." },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("[ClauseWall] [API] Send message error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
