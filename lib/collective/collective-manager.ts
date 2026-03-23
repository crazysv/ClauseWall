// ============================================
// COLLECTIVE MANAGER — CRUD for Collectives & Memberships
// Handles join, leave, propose, vote, update
// ============================================

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Collective,
  CollectiveMembership,
  CollectiveAction,
  VoteResult,
  CollectiveActionType,
} from "@/types";

/**
 * Generate a unique anonymous ID for a user within a collective
 */
function generateAnonymousId(): string {
  const adjectives = [
    "Swift", "Bold", "Calm", "Keen", "Wise", "Fair", "Just", "True",
    "Brave", "Noble", "Sharp", "Firm", "Deep", "Pure", "Strong",
    "Quiet", "Clear", "Bright", "Steady", "Iron",
  ];
  const nouns = [
    "Shield", "Anchor", "Arrow", "Bridge", "Crown", "Eagle", "Guard",
    "Lance", "Oak", "Pillar", "Raven", "Sage", "Tower", "Valor", "Wall",
    "Beacon", "Forge", "Haven", "Peak", "Stone",
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const id = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}${noun}${id}`;
}

/**
 * Join a collective — creates membership with anonymous identity
 */
export async function joinCollective(
  collectiveId: string,
  userId: string,
  documentId?: string,
  financialExposure?: number,
  violationTypes?: string[]
): Promise<{ membership: CollectiveMembership; anonymous_id: string } | null> {
  try {
    const supabase = createAdminClient();

    // Check if already a member
    const { data: existing } = await supabase
      .from("collective_memberships")
      .select("*")
      .eq("collective_id", collectiveId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing && existing.is_active) {
      return {
        membership: existing as CollectiveMembership,
        anonymous_id: existing.anonymous_id,
      };
    }

    // Rejoin if previously left
    if (existing && !existing.is_active) {
      const { data: updated } = await supabase
        .from("collective_memberships")
        .update({
          is_active: true,
          joined_at: new Date().toISOString(),
          document_id: documentId || existing.document_id,
          financial_exposure: financialExposure ?? existing.financial_exposure,
          violation_types: violationTypes || existing.violation_types,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (updated) {
        await updateCollectiveStats(collectiveId);
        await createNotification(
          collectiveId,
          "member_joined",
          "New member joined",
          "A new member has joined the collective."
        );
        return {
          membership: updated as CollectiveMembership,
          anonymous_id: updated.anonymous_id,
        };
      }
      return null;
    }

    // Create new membership
    const anonymousId = generateAnonymousId();
    const { data: membership, error } = await supabase
      .from("collective_memberships")
      .insert({
        collective_id: collectiveId,
        user_id: userId,
        anonymous_id: anonymousId,
        role: "member",
        document_id: documentId || null,
        financial_exposure: financialExposure || null,
        violation_types: violationTypes || [],
        is_active: true,
        opted_in_to_action: false,
        opted_in_to_communication: true,
      })
      .select()
      .single();

    if (error) {
      console.error("[ClauseWall] [Collective] Join error:", error);
      return null;
    }

    // Update collective stats
    await updateCollectiveStats(collectiveId);

    // Notify existing members
    await createNotification(
      collectiveId,
      "member_joined",
      "New member joined",
      "A new member has joined the collective. Collective strength is growing!"
    );

    return {
      membership: membership as CollectiveMembership,
      anonymous_id: anonymousId,
    };
  } catch (error) {
    console.error("[ClauseWall] [Collective] Join collective error:", error);
    return null;
  }
}

/**
 * Leave a collective — soft-deletes membership
 */
export async function leaveCollective(
  collectiveId: string,
  userId: string
): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("collective_memberships")
      .update({ is_active: false })
      .eq("collective_id", collectiveId)
      .eq("user_id", userId);

    if (error) return false;

    await updateCollectiveStats(collectiveId);
    return true;
  } catch (error) {
    console.error("[ClauseWall] [Collective] Leave error:", error);
    return false;
  }
}

/**
 * Get collective details with aggregate stats (no user-identifying data)
 */
export async function getCollective(
  collectiveId: string
): Promise<Collective | null> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("collectives")
      .select("*")
      .eq("id", collectiveId)
      .single();

    if (error || !data) return null;

    // Get actions
    const { data: actions } = await supabase
      .from("collective_actions")
      .select("*")
      .eq("collective_id", collectiveId)
      .order("proposed_at", { ascending: false })
      .limit(20);

    return {
      ...data,
      action_history: (actions || []) as CollectiveAction[],
    } as Collective;
  } catch (error) {
    console.error("[ClauseWall] [Collective] Get collective error:", error);
    return null;
  }
}

/**
 * Get all collectives a user belongs to
 */
export async function getUserCollectives(
  userId: string
): Promise<{ collective: Collective; membership: CollectiveMembership }[]> {
  try {
    const supabase = createAdminClient();

    const { data: memberships } = await supabase
      .from("collective_memberships")
      .select("*, collectives(*)")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("joined_at", { ascending: false });

    if (!memberships) return [];

    return memberships.map((m: any) => ({
      collective: m.collectives as Collective,
      membership: {
        id: m.id,
        collective_id: m.collective_id,
        user_id: m.user_id,
        anonymous_id: m.anonymous_id,
        role: m.role,
        joined_at: m.joined_at,
        document_id: m.document_id,
        financial_exposure: m.financial_exposure,
        violation_types: m.violation_types,
        is_active: m.is_active,
        opted_in_to_action: m.opted_in_to_action,
        opted_in_to_communication: m.opted_in_to_communication,
      } as CollectiveMembership,
    }));
  } catch (error) {
    console.error("[ClauseWall] [Collective] Get user collectives error:", error);
    return [];
  }
}

/**
 * Propose a collective action — creates action and starts voting
 */
export async function proposeAction(
  collectiveId: string,
  userId: string,
  actionType: CollectiveActionType,
  title: string,
  description: string
): Promise<CollectiveAction | null> {
  try {
    const supabase = createAdminClient();

    // Verify membership
    const { data: membership } = await supabase
      .from("collective_memberships")
      .select("anonymous_id")
      .eq("collective_id", collectiveId)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (!membership) {
      console.error("[ClauseWall] [Collective] Non-member tried to propose action");
      return null;
    }

    const { data: action, error } = await supabase
      .from("collective_actions")
      .insert({
        collective_id: collectiveId,
        action_type: actionType,
        title,
        description,
        status: "proposed",
        proposed_by: membership.anonymous_id,
      })
      .select()
      .single();

    if (error) return null;

    await createNotification(
      collectiveId,
      "action_proposed",
      `New action proposed: ${title}`,
      `A member has proposed: ${description?.substring(0, 100) || title}. Vote now!`
    );

    return action as CollectiveAction;
  } catch (error) {
    console.error("[ClauseWall] [Collective] Propose action error:", error);
    return null;
  }
}

/**
 * Cast a vote on an action
 */
export async function castVote(
  actionId: string,
  userId: string,
  vote: "yes" | "no" | "abstain"
): Promise<VoteResult | null> {
  try {
    const supabase = createAdminClient();

    // Get action and verify membership
    const { data: action } = await supabase
      .from("collective_actions")
      .select("collective_id")
      .eq("id", actionId)
      .single();

    if (!action) return null;

    const { data: membership } = await supabase
      .from("collective_memberships")
      .select("anonymous_id")
      .eq("collective_id", action.collective_id)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (!membership) return null;

    // Upsert vote
    await supabase.from("collective_votes").upsert(
      {
        action_id: actionId,
        user_id: userId,
        anonymous_id: membership.anonymous_id,
        vote,
        voted_at: new Date().toISOString(),
      },
      { onConflict: "action_id,user_id" }
    );

    // Tally votes
    const { data: votes } = await supabase
      .from("collective_votes")
      .select("vote")
      .eq("action_id", actionId);

    const tally: VoteResult = {
      total_votes: votes?.length || 0,
      yes_votes: votes?.filter((v: any) => v.vote === "yes").length || 0,
      no_votes: votes?.filter((v: any) => v.vote === "no").length || 0,
      abstain_votes: votes?.filter((v: any) => v.vote === "abstain").length || 0,
      passed: false,
      required_majority: 0.5,
    };

    const activeVotes = tally.yes_votes + tally.no_votes;
    tally.passed = activeVotes > 0 && tally.yes_votes / activeVotes > tally.required_majority;

    // Update action with vote result
    const newStatus = tally.passed ? "approved" : "voting";
    await supabase
      .from("collective_actions")
      .update({
        vote_result: tally,
        status: newStatus,
        participants_count: tally.total_votes,
      })
      .eq("id", actionId);

    return tally;
  } catch (error) {
    console.error("[ClauseWall] [Collective] Cast vote error:", error);
    return null;
  }
}

/**
 * Update collective aggregate stats (member count, exposure, etc.)
 */
export async function updateCollectiveStats(collectiveId: string): Promise<void> {
  try {
    const supabase = createAdminClient();

    const { data: members } = await supabase
      .from("collective_memberships")
      .select("financial_exposure, violation_types")
      .eq("collective_id", collectiveId)
      .eq("is_active", true);

    const memberCount = members?.length || 0;
    const totalExposure = members?.reduce(
      (sum, m: any) => sum + (m.financial_exposure || 0), 0
    ) || 0;
    const avgExposure = memberCount > 0 ? Math.round(totalExposure / memberCount) : 0;

    // Get current collective for threshold check
    const { data: collective } = await supabase
      .from("collectives")
      .select("threshold, status")
      .eq("id", collectiveId)
      .single();

    const threshold = collective?.threshold || 10;
    let newStatus = collective?.status || "forming";

    if (memberCount >= threshold && newStatus === "forming") {
      newStatus = "threshold_reached";
    }

    await supabase
      .from("collectives")
      .update({
        member_count: memberCount,
        total_financial_exposure: totalExposure,
        individual_avg_exposure: avgExposure,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", collectiveId);

    // Send milestone notification if threshold reached
    if (newStatus === "threshold_reached" && collective?.status === "forming") {
      await createNotification(
        collectiveId,
        "threshold_reached",
        "🎉 Collective threshold reached!",
        `The collective now has ${memberCount} members — enough to take coordinated legal action!`
      );
    }
  } catch (error) {
    console.error("[ClauseWall] [Collective] Update stats error:", error);
  }
}

/**
 * Create a notification for all members of a collective
 */
async function createNotification(
  collectiveId: string,
  type: string,
  title: string,
  description: string
): Promise<void> {
  try {
    const supabase = createAdminClient();

    const { data: members } = await supabase
      .from("collective_memberships")
      .select("user_id")
      .eq("collective_id", collectiveId)
      .eq("is_active", true)
      .eq("opted_in_to_communication", true);

    if (!members || members.length === 0) return;

    const notifications = members.map((m: any) => ({
      collective_id: collectiveId,
      user_id: m.user_id,
      type,
      title,
      description,
    }));

    await supabase.from("collective_notifications").insert(notifications);
  } catch (error) {
    console.error("[ClauseWall] [Collective] Notification error:", error);
  }
}
