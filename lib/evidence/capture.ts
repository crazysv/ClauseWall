// ============================================
// EVIDENCE CAPTURE ORCHESTRATOR
// Routes evidence to correct parser/archiver
// Handles dedup + chain linking
// ============================================

import { createAdminClient } from "@/lib/supabase/admin";
import { hashContent } from "./storage";
import { createChainHash } from "./chain";
import type { EvidenceItem, EvidenceType, EvidenceSource, ExtractedData } from "@/types/evidence";

/**
 * Add an evidence item to a case with chain linking
 */
export async function addEvidenceItem(
  caseId: string,
  userId: string,
  data: {
    evidence_type: EvidenceType;
    title: string;
    description?: string;
    content: Buffer | string;
    original_filename?: string;
    storage_path?: string;
    file_size_bytes?: number;
    mime_type?: string;
    thumbnail_path?: string;
    extracted_data?: ExtractedData;
    captured_at?: string;
    source?: EvidenceSource;
    tags?: string[];
    issue_category?: string;
    notes?: string;
  }
): Promise<{ item: EvidenceItem | null; is_duplicate: boolean; error?: string }> {
  const supabase = createAdminClient();

  try {
    // Compute content hash
    const contentHash = hashContent(data.content);
    const capturedAt = data.captured_at || new Date().toISOString();

    // Check for duplicate
    const { data: existing } = await supabase
      .from("evidence_items")
      .select("id, title")
      .eq("case_id", caseId)
      .eq("content_hash", contentHash)
      .limit(1)
      .single();

    if (existing) {
      return { item: null, is_duplicate: true, error: `Duplicate: "${existing.title}" has the same content hash` };
    }

    // Get last item in chain for this case
    const { data: lastItem } = await supabase
      .from("evidence_items")
      .select("id, chain_hash, sequence_number")
      .eq("case_id", caseId)
      .order("sequence_number", { ascending: false })
      .limit(1)
      .single();

    const sequenceNumber = (lastItem?.sequence_number || 0) + 1;
    const previousChainHash = lastItem?.chain_hash || null;
    const chainHash = createChainHash(previousChainHash, contentHash, capturedAt);

    // Insert evidence item
    const { data: newItem, error } = await supabase
      .from("evidence_items")
      .insert({
        case_id: caseId,
        user_id: userId,
        sequence_number: sequenceNumber,
        evidence_type: data.evidence_type,
        title: data.title,
        description: data.description || null,
        original_filename: data.original_filename || null,
        storage_path: data.storage_path || null,
        file_size_bytes: data.file_size_bytes || 0,
        mime_type: data.mime_type || null,
        thumbnail_path: data.thumbnail_path || null,
        content_hash: contentHash,
        chain_hash: chainHash,
        previous_item_id: lastItem?.id || null,
        hash_algorithm: "SHA-256",
        extracted_data: data.extracted_data || {},
        captured_at: capturedAt,
        source: data.source || "manual_upload",
        tags: data.tags || [],
        issue_category: data.issue_category || null,
        notes: data.notes || null,
        processing_status: "completed",
      })
      .select()
      .single();

    if (error) {
      console.error("[Evidence] Insert item failed:", error);
      return { item: null, is_duplicate: false, error: error.message };
    }

    // Update case total_items and storage
    await supabase
      .from("evidence_cases")
      .update({
        total_items: sequenceNumber,
        storage_used_bytes: (data.file_size_bytes || 0),
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseId);

    return { item: newItem as EvidenceItem, is_duplicate: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Evidence] Add item error:", message);
    return { item: null, is_duplicate: false, error: message };
  }
}

/**
 * Delete an evidence item (soft — keeps chain hash)
 */
export async function deleteEvidenceItem(
  itemId: string,
  caseId: string
): Promise<boolean> {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .from("evidence_items")
      .delete()
      .eq("id", itemId)
      .eq("case_id", caseId);

    if (error) {
      console.error("[Evidence] Delete item failed:", error);
      return false;
    }

    // Update case item count
    const { count } = await supabase
      .from("evidence_items")
      .select("id", { count: "exact", head: true })
      .eq("case_id", caseId);

    await supabase
      .from("evidence_cases")
      .update({ total_items: count || 0, updated_at: new Date().toISOString() })
      .eq("id", caseId);

    return true;
  } catch (error) {
    console.error("[Evidence] Delete item error:", error);
    return false;
  }
}
