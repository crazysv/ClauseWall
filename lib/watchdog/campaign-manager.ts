// ============================================
// CAMPAIGN MANAGER
// Collective opt-out campaign management
// ============================================

import { createAdminClient } from "@/lib/supabase/admin";
import { callGroq } from "@/lib/ai/groq-client";
import { CAMPAIGN_LETTER_PROMPT } from "./prompts";
import type { OptoutCampaign, OptoutCampaignWithCompany, CampaignSignatory, TosChange, MonitoredCompany } from "@/types";

/**
 * Create a new opt-out campaign
 */
export async function createCampaign(params: {
  company_id: string;
  change_id: string;
  title: string;
  description: string;
  legal_basis: string;
  created_by: string;
  company_email?: string;
}): Promise<OptoutCampaign | null> {
  const supabase = createAdminClient();

  // Generate objection letter template
  const letterTemplate = await generateObjectionLetter(
    params.title,
    params.legal_basis,
    params.description
  );

  const { data, error } = await supabase
    .from("optout_campaigns")
    .insert({
      company_id: params.company_id,
      change_id: params.change_id,
      title: params.title,
      description: params.description,
      legal_basis: params.legal_basis,
      objection_template: letterTemplate,
      company_email: params.company_email || null,
      created_by: params.created_by,
    })
    .select()
    .single();

  if (error) {
    console.error("[Watchdog] Failed to create campaign:", error);
    return null;
  }

  return data as OptoutCampaign;
}

/**
 * Sign a campaign
 */
export async function signCampaign(params: {
  campaign_id: string;
  user_id: string;
  display_name: string;
  email?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Check if already signed
  const { data: existing } = await supabase
    .from("campaign_signatories")
    .select("id")
    .eq("campaign_id", params.campaign_id)
    .eq("user_id", params.user_id)
    .single();

  if (existing) {
    return { success: false, error: "You have already signed this campaign" };
  }

  // Insert signatory
  const { error: signError } = await supabase
    .from("campaign_signatories")
    .insert({
      campaign_id: params.campaign_id,
      user_id: params.user_id,
      display_name: params.display_name,
      email: params.email || null,
    });

  if (signError) {
    return { success: false, error: signError.message };
  }

  // Update count
  const { data: countData } = await supabase
    .from("campaign_signatories")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", params.campaign_id);

  await supabase
    .from("optout_campaigns")
    .update({
      signatory_count: (countData as unknown as { count: number })?.count || 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.campaign_id);

  return { success: true };
}

/**
 * Get campaigns (with optional filters)
 */
export async function getCampaigns(filters?: {
  status?: string;
  company_id?: string;
  limit?: number;
}): Promise<OptoutCampaignWithCompany[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("optout_campaigns")
    .select("*, company:monitored_companies(*)")
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.company_id) query = query.eq("company_id", filters.company_id);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;

  if (error) {
    console.error("[Watchdog] Failed to get campaigns:", error);
    return [];
  }

  return (data as OptoutCampaignWithCompany[]) || [];
}

/**
 * Get a single campaign by ID
 */
export async function getCampaignById(id: string): Promise<OptoutCampaignWithCompany | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("optout_campaigns")
    .select("*, company:monitored_companies(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[Watchdog] Failed to get campaign:", error);
    return null;
  }

  return data as OptoutCampaignWithCompany;
}

/**
 * Get signatories for a campaign
 */
export async function getCampaignSignatories(
  campaignId: string
): Promise<CampaignSignatory[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("campaign_signatories")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("signed_at", { ascending: false });

  if (error) {
    console.error("[Watchdog] Failed to get signatories:", error);
    return [];
  }

  return (data as CampaignSignatory[]) || [];
}

/**
 * Generate objection letter template using Groq
 */
async function generateObjectionLetter(
  title: string,
  legalBasis: string,
  description: string
): Promise<string> {
  try {
    const response = await callGroq(
      [
        { role: "system", content: CAMPAIGN_LETTER_PROMPT },
        {
          role: "user",
          content: `Generate a collective objection letter for:
Title: ${title}
Legal basis: ${legalBasis}
Description: ${description}`,
        },
      ],
      { temperature: 0.2, maxTokens: 2048 }
    );

    const parsed = JSON.parse(response);
    return parsed.body || "Template generation failed. Please draft manually.";
  } catch (error) {
    console.error("[Watchdog] Letter generation failed:", error);
    return "Template generation failed. Please draft manually.";
  }
}
