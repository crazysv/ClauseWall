// Re-export from main types for convenience
export type {
  CollabRoom,
  CollabParticipant,
  CollabAnnotation,
  CollabVote,
  VoteSummary,
  CollabRoomState,
} from "@/types";

// Realtime event types
export type CollabEvent =
  | "annotation_added"
  | "annotation_deleted"
  | "vote_cast"
  | "clause_highlight"
  | "participant_joined"
  | "participant_left";

export interface CollabBroadcast {
  event: CollabEvent;
  payload: Record<string, unknown>;
  sender_id: string;
  sender_name: string;
}

// Random colors for participants
export const PARTICIPANT_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899",
  "#F43F5E", "#14B8A6", "#A855F7", "#6366F1",
];

export function getRandomColor(): string {
  return PARTICIPANT_COLORS[Math.floor(Math.random() * PARTICIPANT_COLORS.length)];
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CW-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}