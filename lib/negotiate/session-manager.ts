// ============================================
// SESSION MANAGER — NEGOTIATION SESSION STATE
// Client-side localStorage persistence
// ============================================

import type {
  NegotiationSession,
  NegotiationClauseItem,
  NegotiationClauseStatus,
  NegotiationScore,
} from "@/types";

const STORAGE_PREFIX = "clausewall_negotiation_";
const SESSIONS_INDEX_KEY = "clausewall_negotiation_sessions";

// ============================================
// SESSION CREATION
// ============================================

/**
 * Create a new negotiation session
 */
export function createSession(
  documentType: string,
  jurisdiction: string,
  entityName: string
): NegotiationSession {
  const session: NegotiationSession = {
    id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    started_at: new Date().toISOString(),
    document_type: documentType,
    jurisdiction,
    entity_name: entityName,
    clauses: [],
    transcript_chunks: [],
    bluff_checks: [],
    lookups: [],
    camera_frames: [],
    notes: [],
    overall_score: {
      total_clauses: 0,
      won: 0,
      conceded: 0,
      compromised: 0,
      pending: 0,
      deadlocked: 0,
      win_percentage: 0,
      strongest_win: null,
      biggest_concession: null,
    },
  };

  // Save immediately
  saveSession(session);

  // Add to sessions index
  addToIndex(session.id);

  return session;
}

// ============================================
// PERSISTENCE
// ============================================

/**
 * Save session to localStorage
 */
export function saveSession(session: NegotiationSession): void {
  if (typeof window === "undefined") return;

  try {
    const key = `${STORAGE_PREFIX}${session.id}`;
    // Limit transcript chunks and camera frames to prevent localStorage overflow
    const trimmed: NegotiationSession = {
      ...session,
      transcript_chunks: session.transcript_chunks.slice(-100),
      camera_frames: session.camera_frames.slice(-20),
    };
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch (error) {
    console.error("[ClauseWall] Failed to save session:", error);
    // If storage is full, try to clear old sessions
    try {
      cleanOldSessions();
      const key = `${STORAGE_PREFIX}${session.id}`;
      localStorage.setItem(key, JSON.stringify(session));
    } catch {
      console.error("[ClauseWall] Storage full, cannot save session");
    }
  }
}

/**
 * Load session by ID
 */
export function loadSession(sessionId: string): NegotiationSession | null {
  if (typeof window === "undefined") return null;

  try {
    const key = `${STORAGE_PREFIX}${sessionId}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as NegotiationSession;
  } catch {
    return null;
  }
}

/**
 * Load the most recent session
 */
export function loadLatestSession(): NegotiationSession | null {
  if (typeof window === "undefined") return null;

  const sessions = getAllSessions();
  if (sessions.length === 0) return null;

  // Sort by started_at descending
  sessions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

  return sessions[0];
}

/**
 * Get all saved sessions
 */
export function getAllSessions(): NegotiationSession[] {
  if (typeof window === "undefined") return [];

  try {
    const indexData = localStorage.getItem(SESSIONS_INDEX_KEY);
    if (!indexData) return [];

    const sessionIds: string[] = JSON.parse(indexData);
    const sessions: NegotiationSession[] = [];

    for (const id of sessionIds) {
      const session = loadSession(id);
      if (session) sessions.push(session);
    }

    return sessions;
  } catch {
    return [];
  }
}

/**
 * Delete a session
 */
export function deleteSession(sessionId: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${sessionId}`);
    removeFromIndex(sessionId);
  } catch {
    // Ignore errors
  }
}

// ============================================
// CLAUSE TRACKING
// ============================================

/**
 * Add a clause to the negotiation tracker
 */
export function addClauseToTracker(
  session: NegotiationSession,
  clause: Omit<NegotiationClauseItem, "id">
): NegotiationSession {
  const newClause: NegotiationClauseItem = {
    ...clause,
    id: `clause_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  };

  const updated = {
    ...session,
    clauses: [...session.clauses, newClause],
  };

  updated.overall_score = calculateScore(updated);
  saveSession(updated);
  return updated;
}

/**
 * Update clause status
 */
export function updateClauseStatus(
  session: NegotiationSession,
  clauseId: string,
  status: NegotiationClauseStatus,
  finalTerms?: string
): NegotiationSession {
  const updated = {
    ...session,
    clauses: session.clauses.map((c) =>
      c.id === clauseId
        ? { ...c, status, final_terms: finalTerms ?? c.final_terms }
        : c
    ),
  };

  updated.overall_score = calculateScore(updated);
  saveSession(updated);
  return updated;
}

// ============================================
// SCORING
// ============================================

/**
 * Calculate negotiation score from current clause states
 */
export function calculateScore(session: NegotiationSession): NegotiationScore {
  const clauses = session.clauses;
  const total = clauses.length;

  const won = clauses.filter((c) => c.status === "won").length;
  const conceded = clauses.filter((c) => c.status === "conceded").length;
  const compromised = clauses.filter((c) => c.status === "compromised").length;
  const pending = clauses.filter((c) => c.status === "pending" || c.status === "negotiating").length;
  const deadlocked = clauses.filter((c) => c.status === "deadlocked").length;

  const resolved = won + conceded + compromised;
  const winPercentage = resolved > 0 ? Math.round((won / resolved) * 100) : 0;

  const wonClause = clauses.find((c) => c.status === "won");
  const concededClause = clauses.find((c) => c.status === "conceded");

  return {
    total_clauses: total,
    won,
    conceded,
    compromised,
    pending,
    deadlocked,
    win_percentage: winPercentage,
    strongest_win: wonClause?.clause_summary || null,
    biggest_concession: concededClause?.clause_summary || null,
  };
}

// ============================================
// NOTES
// ============================================

/**
 * Add a note to the session
 */
export function addNote(session: NegotiationSession, note: string): NegotiationSession {
  const updated = {
    ...session,
    notes: [...session.notes, `[${new Date().toLocaleTimeString()}] ${note}`],
  };

  saveSession(updated);
  return updated;
}

// ============================================
// EXPORT
// ============================================

/**
 * Export session as readable text summary
 */
export function exportSession(session: NegotiationSession): string {
  const lines: string[] = [];

  lines.push("═══════════════════════════════════════════");
  lines.push("NEGOTIATION SESSION SUMMARY");
  lines.push("═══════════════════════════════════════════");
  lines.push("");
  lines.push(`Date: ${new Date(session.started_at).toLocaleDateString("en-IN", { dateStyle: "long" })}`);
  lines.push(`Entity: ${session.entity_name}`);
  lines.push(`Contract Type: ${session.document_type}`);
  lines.push(`Jurisdiction: ${session.jurisdiction}`);
  lines.push("");

  // Score
  const score = session.overall_score;
  lines.push("── SCORE ──");
  lines.push(`Win Rate: ${score.win_percentage}%`);
  lines.push(`Won: ${score.won} | Conceded: ${score.conceded} | Compromised: ${score.compromised} | Pending: ${score.pending}`);
  lines.push("");

  // Clauses
  if (session.clauses.length > 0) {
    lines.push("── CLAUSES ──");
    for (const clause of session.clauses) {
      const statusEmoji: Record<string, string> = {
        won: "✅", conceded: "❌", compromised: "🤝",
        pending: "⏳", negotiating: "🔄", deadlocked: "🔒", skipped: "⏭️",
      };
      lines.push(`${statusEmoji[clause.status] || "•"} ${clause.clause_summary} [${clause.status.toUpperCase()}]`);
      lines.push(`  Their terms: ${clause.original_terms}`);
      lines.push(`  Your ask: ${clause.your_ask}`);
      if (clause.final_terms) lines.push(`  Final: ${clause.final_terms}`);
      if (clause.notes) lines.push(`  Notes: ${clause.notes}`);
      lines.push("");
    }
  }

  // Bluff checks
  if (session.bluff_checks.length > 0) {
    lines.push("── BLUFF CHECKS ──");
    for (const bluff of session.bluff_checks) {
      const emoji = bluff.result === "false_claim" ? "❌ FALSE" : bluff.result === "true_claim" ? "✅ TRUE" : "⚠️ " + bluff.result.toUpperCase();
      lines.push(`${emoji}: "${bluff.claim_text}"`);
      if (bluff.actual_legal_position) lines.push(`  Actual: ${bluff.actual_legal_position}`);
      lines.push("");
    }
  }

  // Notes
  if (session.notes.length > 0) {
    lines.push("── NOTES ──");
    for (const note of session.notes) {
      lines.push(`• ${note}`);
    }
    lines.push("");
  }

  lines.push("═══════════════════════════════════════════");
  lines.push("Generated by ClauseWall Live Negotiation Companion");

  return lines.join("\n");
}

// ============================================
// INTERNAL HELPERS
// ============================================

function addToIndex(sessionId: string): void {
  if (typeof window === "undefined") return;

  try {
    const indexData = localStorage.getItem(SESSIONS_INDEX_KEY);
    const ids: string[] = indexData ? JSON.parse(indexData) : [];

    if (!ids.includes(sessionId)) {
      ids.push(sessionId);
      // Keep max 50 sessions
      while (ids.length > 50) ids.shift();
      localStorage.setItem(SESSIONS_INDEX_KEY, JSON.stringify(ids));
    }
  } catch {
    // Ignore
  }
}

function removeFromIndex(sessionId: string): void {
  if (typeof window === "undefined") return;

  try {
    const indexData = localStorage.getItem(SESSIONS_INDEX_KEY);
    if (!indexData) return;

    const ids: string[] = JSON.parse(indexData);
    const filtered = ids.filter((id) => id !== sessionId);
    localStorage.setItem(SESSIONS_INDEX_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore
  }
}

function cleanOldSessions(): void {
  if (typeof window === "undefined") return;

  try {
    const sessions = getAllSessions();
    // Sort by date, remove oldest if more than 20
    sessions.sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

    while (sessions.length > 20) {
      const oldest = sessions.shift();
      if (oldest) deleteSession(oldest.id);
    }
  } catch {
    // Ignore
  }
}
