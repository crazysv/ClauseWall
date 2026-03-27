// ============================================
// SNAPSHOT MANAGER
// Manages ToS snapshot CRUD + hash comparison
// ============================================

import { createAdminClient } from "@/lib/supabase/admin";
import type { TosSnapshot, MonitoredCompany, TosDocType } from "@/types";

/**
 * Get the latest snapshot for a company + doc type
 */
export async function getLatestSnapshot(
  companyId: string,
  tosType: TosDocType
): Promise<TosSnapshot | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tos_snapshots")
    .select("*")
    .eq("company_id", companyId)
    .eq("tos_type", tosType)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("[Watchdog] Failed to get latest snapshot:", error);
  }

  return (data as TosSnapshot) || null;
}

/**
 * Save a new snapshot (only if hash differs)
 */
export async function saveSnapshot(
  companyId: string,
  tosType: TosDocType,
  data: {
    raw_html: string | null;
    clean_text: string;
    text_hash: string;
    word_count: number;
    readability_score: number | null;
    section_count: number;
    url_scraped: string;
    scrape_status: string;
    scrape_error?: string;
  }
): Promise<{ snapshot: TosSnapshot | null; isNew: boolean }> {
  const supabase = createAdminClient();

  // Check if we already have this exact hash
  const { data: existing } = await supabase
    .from("tos_snapshots")
    .select("id")
    .eq("company_id", companyId)
    .eq("tos_type", tosType)
    .eq("text_hash", data.text_hash)
    .limit(1)
    .single();

  if (existing) {
    return { snapshot: null, isNew: false };
  }

  // Get next version number
  const { data: latest } = await supabase
    .from("tos_snapshots")
    .select("version_number")
    .eq("company_id", companyId)
    .eq("tos_type", tosType)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (latest?.version_number || 0) + 1;

  const { data: newSnapshot, error } = await supabase
    .from("tos_snapshots")
    .insert({
      company_id: companyId,
      tos_type: tosType,
      version_number: nextVersion,
      raw_html: data.raw_html,
      clean_text: data.clean_text,
      text_hash: data.text_hash,
      word_count: data.word_count,
      readability_score: data.readability_score,
      section_count: data.section_count,
      url_scraped: data.url_scraped,
      scrape_status: data.scrape_status,
      scrape_error: data.scrape_error || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[Watchdog] Failed to save snapshot:", error);
    return { snapshot: null, isNew: false };
  }

  return { snapshot: newSnapshot as TosSnapshot, isNew: true };
}

/**
 * Get snapshot history for a company
 */
export async function getSnapshotHistory(
  companyId: string,
  tosType?: TosDocType,
  limit = 20
): Promise<TosSnapshot[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("tos_snapshots")
    .select("*")
    .eq("company_id", companyId)
    .order("version_number", { ascending: false })
    .limit(limit);

  if (tosType) {
    query = query.eq("tos_type", tosType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Watchdog] Failed to get snapshot history:", error);
    return [];
  }

  return (data as TosSnapshot[]) || [];
}

/**
 * Update company's last_scraped_at timestamp
 */
export async function updateCompanyScrapedAt(companyId: string): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from("monitored_companies")
    .update({ last_scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", companyId);
}

/**
 * Mark a snapshot as analyzed
 */
export async function markSnapshotAnalyzed(snapshotId: string): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from("tos_snapshots")
    .update({ analyzed: true })
    .eq("id", snapshotId);
}

/**
 * Save a change record
 */
export async function saveChangeRecord(
  change: Omit<import("@/types").TosChange, "id" | "created_at">
): Promise<import("@/types").TosChange | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tos_changes")
    .insert(change)
    .select()
    .single();

  if (error) {
    console.error("[Watchdog] Failed to save change:", error);
    return null;
  }

  // Update company stats
  await supabase
    .from("monitored_companies")
    .update({
      last_change_detected: new Date().toISOString(),
      total_changes: change.total_changes || 0,
      pro_company_changes: change.overall_direction === "pro_company" ? 1 : 0,
      pro_consumer_changes: change.overall_direction === "pro_consumer" ? 1 : 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", change.company_id);

  return data as import("@/types").TosChange;
}

/**
 * Get changes for a company
 */
export async function getCompanyChanges(
  companyId: string,
  limit = 20
): Promise<import("@/types").TosChange[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tos_changes")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_published", true)
    .order("detected_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Watchdog] Failed to get changes:", error);
    return [];
  }

  return (data as import("@/types").TosChange[]) || [];
}

/**
 * Get companies that are due for scraping
 */
export async function getCompaniesDueForScrape(limit = 10): Promise<MonitoredCompany[]> {
  const supabase = createAdminClient();
  const now = new Date();

  const { data, error } = await supabase
    .from("monitored_companies")
    .select("*")
    .eq("is_active", true)
    .order("last_scraped_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) {
    console.error("[Watchdog] Failed to get companies due for scrape:", error);
    return [];
  }

  // Filter by frequency
  return ((data as MonitoredCompany[]) || []).filter((company) => {
    if (!company.last_scraped_at) return true; // Never scraped

    const lastScraped = new Date(company.last_scraped_at);
    const hoursSince = (now.getTime() - lastScraped.getTime()) / (1000 * 60 * 60);

    switch (company.scrape_frequency) {
      case "daily": return hoursSince >= 20;
      case "weekly": return hoursSince >= 144; // 6 days
      case "biweekly": return hoursSince >= 312; // 13 days
      case "monthly": return hoursSince >= 672; // 28 days
      default: return hoursSince >= 144;
    }
  });
}
