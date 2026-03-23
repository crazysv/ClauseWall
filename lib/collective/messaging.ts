// ============================================
// COLLECTIVE MESSAGING — Anonymous Communication
// All messages use anonymous IDs, PII is stripped
// ============================================

import { createAdminClient } from "@/lib/supabase/admin";
import type { CollectiveMessage, CollectiveMessageType } from "@/types";

// Basic PII patterns to strip from messages
const PII_PATTERNS = [
  /\b\d{10,12}\b/g, // Phone numbers
  /\b[A-Z]{5}\d{4}[A-Z]\b/gi, // PAN card
  /\b\d{4}\s?\d{4}\s?\d{4}\b/g, // Aadhaar (12-digit)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi, // Email
  /\b(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/\S*)?\b/gi, // URLs
  /\b\d{1,4}[\s,/-]+[A-Za-z\s]+(?:street|road|lane|nagar|colony|apartment|flat|floor|ward|sector|phase|block)\b/gi, // Addresses
];

/**
 * Sanitize message content by stripping potential PII
 */
function sanitizeMessage(content: string): string {
  let sanitized = content;
  for (const pattern of PII_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }
  // Limit length
  if (sanitized.length > 2000) {
    sanitized = sanitized.substring(0, 2000) + "...";
  }
  return sanitized;
}

/**
 * Send a message to a collective chat (anonymous)
 */
export async function sendMessage(
  collectiveId: string,
  userId: string,
  content: string,
  messageType: CollectiveMessageType = "discussion",
  replyTo?: string
): Promise<CollectiveMessage | null> {
  try {
    const supabase = createAdminClient();

    // Verify membership and get anonymous ID
    const { data: membership } = await supabase
      .from("collective_memberships")
      .select("anonymous_id")
      .eq("collective_id", collectiveId)
      .eq("user_id", userId)
      .eq("is_active", true)
      .eq("opted_in_to_communication", true)
      .single();

    if (!membership) {
      console.error("[ClauseWall] [Collective] Non-member or not opted-in tried to send message");
      return null;
    }

    const sanitized = sanitizeMessage(content);

    const { data: message, error } = await supabase
      .from("collective_messages")
      .insert({
        collective_id: collectiveId,
        sender_anonymous_id: membership.anonymous_id,
        message_type: messageType,
        content: sanitized,
        reply_to: replyTo || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[ClauseWall] [Collective] Send message error:", error);
      return null;
    }

    return message as CollectiveMessage;
  } catch (error) {
    console.error("[ClauseWall] [Collective] Send message error:", error);
    return null;
  }
}

/**
 * Get messages for a collective (paginated)
 */
export async function getMessages(
  collectiveId: string,
  userId: string,
  limit: number = 50,
  before?: string
): Promise<CollectiveMessage[]> {
  try {
    const supabase = createAdminClient();

    // Verify membership
    const { data: membership } = await supabase
      .from("collective_memberships")
      .select("id")
      .eq("collective_id", collectiveId)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (!membership) return [];

    let query = supabase
      .from("collective_messages")
      .select("*")
      .eq("collective_id", collectiveId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data } = await query;
    return (data || []) as CollectiveMessage[];
  } catch (error) {
    console.error("[ClauseWall] [Collective] Get messages error:", error);
    return [];
  }
}

/**
 * Pin/unpin a message (coordinators/leads only)
 */
export async function togglePinMessage(
  messageId: string,
  userId: string,
  collectiveId: string
): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    // Verify membership and role
    const { data: membership } = await supabase
      .from("collective_memberships")
      .select("role")
      .eq("collective_id", collectiveId)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (!membership || membership.role === "member") return false;

    // Toggle pin
    const { data: msg } = await supabase
      .from("collective_messages")
      .select("is_pinned")
      .eq("id", messageId)
      .single();

    if (!msg) return false;

    await supabase
      .from("collective_messages")
      .update({ is_pinned: !msg.is_pinned })
      .eq("id", messageId);

    return true;
  } catch (error) {
    console.error("[ClauseWall] [Collective] Pin message error:", error);
    return false;
  }
}

/**
 * Get pinned messages for a collective
 */
export async function getPinnedMessages(
  collectiveId: string,
  userId: string
): Promise<CollectiveMessage[]> {
  try {
    const supabase = createAdminClient();

    // Verify membership
    const { data: membership } = await supabase
      .from("collective_memberships")
      .select("id")
      .eq("collective_id", collectiveId)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (!membership) return [];

    const { data } = await supabase
      .from("collective_messages")
      .select("*")
      .eq("collective_id", collectiveId)
      .eq("is_pinned", true)
      .order("created_at", { ascending: false });

    return (data || []) as CollectiveMessage[];
  } catch (error) {
    console.error("[ClauseWall] [Collective] Get pinned messages error:", error);
    return [];
  }
}
