// ============================================
// CLAUSEWALL COLLAB — CLIENT-SAFE EXPORTS ONLY
// Room management happens via API routes, not direct imports
// ============================================

export {
  generateSessionId,
  generateRoomCode,
  getRandomColor,
  PARTICIPANT_COLORS,
} from "./types";

export type { CollabEvent, CollabBroadcast } from "./types";