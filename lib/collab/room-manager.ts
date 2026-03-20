import { createClient } from "@/lib/supabase/server";
import { generateRoomCode } from "./types";
import type { CollabRoom } from "@/types";

export async function createRoom(
  documentId: string,
  hostName: string,
  hostSessionId: string
): Promise<CollabRoom | null> {
  const supabase = await createClient();

  // Verify document exists and is completed
  const { data: doc } = await supabase
    .from("documents")
    .select("id, analysis_status")
    .eq("id", documentId)
    .single();

  if (!doc || doc.analysis_status !== "completed") {
    return null;
  }

  // Check for existing active room
  const { data: existing } = await supabase
    .from("collab_rooms")
    .select("*")
    .eq("document_id", documentId)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (existing) {
    return existing as CollabRoom;
  }

  // Create new room
  let roomCode = generateRoomCode();
  let attempts = 0;

  while (attempts < 5) {
    const { data, error } = await supabase
      .from("collab_rooms")
      .insert({
        document_id: documentId,
        room_code: roomCode,
        host_name: hostName,
        host_session_id: hostSessionId,
      })
      .select()
      .single();

    if (!error && data) {
      return data as CollabRoom;
    }

    if (error?.code === "23505") {
      roomCode = generateRoomCode();
      attempts++;
      continue;
    }

    console.error("[ClauseWall] [Collab] Room creation failed:", error);
    return null;
  }

  return null;
}

export async function joinRoom(
  roomCode: string
): Promise<{ room: CollabRoom; documentId: string } | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("collab_rooms")
    .select("*")
    .eq("room_code", roomCode.toUpperCase())
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  return {
    room: data as CollabRoom,
    documentId: data.document_id,
  };
}

export async function closeRoom(roomCode: string, sessionId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("collab_rooms")
    .update({ is_active: false })
    .eq("room_code", roomCode)
    .eq("host_session_id", sessionId);

  return !error;
}