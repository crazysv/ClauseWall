// ============================================
// VOICE SESSION MANAGER
// CRUD for voice sessions in Supabase
// ============================================

import { createAdminClient } from '@/lib/supabase/admin';
import type { SupportedLanguage, VoiceSession, VoiceMessage } from '@/types';

const SESSION_TTL_MINUTES = 30;

/**
 * Create a new voice session.
 */
export async function createSession(
  language: SupportedLanguage,
  userId?: string | null,
  telegramChatId?: string | null
): Promise<VoiceSession> {
  const supabase = createAdminClient();

  const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('voice_sessions')
    .insert({
      user_id: userId || null,
      telegram_chat_id: telegramChatId || null,
      language,
      status: 'active',
      expires_at: expiresAt,
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('[ClauseWall] Voice session creation failed:', error);
    // Return an in-memory session as fallback
    return {
      id: `temp_${Date.now()}`,
      user_id: userId || null,
      telegram_chat_id: telegramChatId || null,
      language,
      status: 'active',
      document_id: null,
      context_summary: null,
      messages: [],
      created_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
      expires_at: expiresAt,
    };
  }

  return { ...data, messages: [] } as VoiceSession;
}

/**
 * Get an active session by ID. Reurns null if expired or not found.
 */
export async function getSession(sessionId: string): Promise<VoiceSession | null> {
  // Handle temp sessions
  if (sessionId.startsWith('temp_')) return null;

  const supabase = createAdminClient();

  const { data: session, error } = await supabase
    .from('voice_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('status', 'active')
    .single();

  if (error || !session) return null;

  // Check expiry
  if (new Date(session.expires_at) < new Date()) {
    await supabase
      .from('voice_sessions')
      .update({ status: 'expired' })
      .eq('id', sessionId);
    return null;
  }

  // Fetch messages
  const { data: messages } = await supabase
    .from('voice_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(50); // Keep context manageable

  return {
    ...session,
    messages: (messages || []) as VoiceMessage[],
  } as VoiceSession;
}

/**
 * Get active session by Telegram chat ID.
 */
export async function getSessionByTelegram(chatId: string): Promise<VoiceSession | null> {
  const supabase = createAdminClient();

  const { data: session } = await supabase
    .from('voice_sessions')
    .select('*')
    .eq('telegram_chat_id', chatId)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!session) return null;

  const { data: messages } = await supabase
    .from('voice_messages')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true })
    .limit(50);

  return {
    ...session,
    messages: (messages || []) as VoiceMessage[],
  } as VoiceSession;
}

/**
 * Add a message to a session and extend expiry.
 */
export async function addMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  text: string,
  language: SupportedLanguage,
  audioUrl?: string | null,
  metadata?: Record<string, unknown>
): Promise<VoiceMessage | null> {
  if (sessionId.startsWith('temp_')) return null;

  const supabase = createAdminClient();

  const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000).toISOString();

  // Insert message + extend session expiry in parallel
  const [messageResult] = await Promise.all([
    supabase
      .from('voice_messages')
      .insert({
        session_id: sessionId,
        role,
        text,
        language,
        audio_url: audioUrl || null,
        metadata: metadata || null,
      })
      .select('*')
      .single(),
    supabase
      .from('voice_sessions')
      .update({
        last_message_at: new Date().toISOString(),
        expires_at: expiresAt,
      })
      .eq('id', sessionId),
  ]);

  if (messageResult.error) {
    console.error('[ClauseWall] Voice message insert failed:', messageResult.error);
    return null;
  }

  return messageResult.data as VoiceMessage;
}

/**
 * Update session with document context.
 */
export async function updateSessionContext(
  sessionId: string,
  documentId: string,
  contextSummary: string
): Promise<void> {
  if (sessionId.startsWith('temp_')) return;

  const supabase = createAdminClient();
  await supabase
    .from('voice_sessions')
    .update({
      document_id: documentId,
      context_summary: contextSummary,
    })
    .eq('id', sessionId);
}

/**
 * End a session.
 */
export async function endSession(sessionId: string): Promise<void> {
  if (sessionId.startsWith('temp_')) return;

  const supabase = createAdminClient();
  await supabase
    .from('voice_sessions')
    .update({ status: 'ended' })
    .eq('id', sessionId);
}

/**
 * Log analytics event (fire-and-forget).
 */
export async function logAnalytics(data: {
  language: string;
  source: string;
  stt_provider?: string;
  tts_provider?: string;
  stt_success?: boolean;
  tts_success?: boolean;
  response_time_ms?: number;
  had_photo?: boolean;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from('voice_analytics').insert(data);
  } catch {
    // Fire and forget — don't break the flow
  }
}
