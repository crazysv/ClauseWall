// ============================================
// CASE TRACKER — FILING STATUS MANAGEMENT
// CRUD for complaint filings in Supabase
// ============================================

import { createAdminClient } from '@/lib/supabase/admin';
import type { ComplaintFiling, ComplaintStatus, HearingRecord } from '@/types';

/**
 * Create a new complaint filing
 */
export async function createFiling(
  userId: string,
  data: Partial<ComplaintFiling>
): Promise<ComplaintFiling | null> {
  const supabase = createAdminClient();

  const { data: filing, error } = await supabase
    .from('complaint_filings')
    .insert({
      user_id: userId,
      document_id: data.document_id,
      authority_id: data.authority_id,
      authority_type: data.authority_type,
      status: 'draft',
      complaint_title: data.complaint_title || 'New Complaint',
      complainant_name: data.complainant_name,
      complainant_address: data.complainant_address,
      complainant_phone: data.complainant_phone,
      complainant_email: data.complainant_email,
      respondent_name: data.respondent_name,
      respondent_address: data.respondent_address,
      respondent_type: data.respondent_type,
      claim_amount: data.claim_amount || 0,
      claim_description: data.claim_description,
      facts_of_case: data.facts_of_case,
      legal_grounds: data.legal_grounds || [],
      relief_sought: data.relief_sought || [],
      supporting_clauses: data.supporting_clauses || [],
      complaint_documents: data.complaint_documents || [],
      fee_calculation: data.fee_calculation || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[ClauseWall] Create filing error:', error);
    return null;
  }

  return filing as ComplaintFiling;
}

/**
 * Update a filing
 */
export async function updateFiling(
  filingId: string,
  userId: string,
  updates: Partial<ComplaintFiling>
): Promise<ComplaintFiling | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('complaint_filings')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', filingId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[ClauseWall] Update filing error:', error);
    return null;
  }

  return data as ComplaintFiling;
}

/**
 * Get a single filing by ID
 */
export async function getFiling(
  filingId: string,
  userId: string
): Promise<ComplaintFiling | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('complaint_filings')
    .select('*')
    .eq('id', filingId)
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data as ComplaintFiling;
}

/**
 * List all filings for a user
 */
export async function listFilings(
  userId: string,
  documentId?: string
): Promise<ComplaintFiling[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from('complaint_filings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (documentId) {
    query = query.eq('document_id', documentId);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data || []) as ComplaintFiling[];
}

/**
 * Update filing status
 */
export async function updateFilingStatus(
  filingId: string,
  userId: string,
  status: ComplaintStatus,
  extras?: {
    case_number?: string;
    filing_date?: string;
    next_hearing_date?: string;
    notes?: string;
  }
): Promise<boolean> {
  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (extras?.case_number) updateData.case_number = extras.case_number;
  if (extras?.filing_date) updateData.filing_date = extras.filing_date;
  if (extras?.next_hearing_date) updateData.next_hearing_date = extras.next_hearing_date;
  if (extras?.notes) updateData.notes = extras.notes;

  const { error } = await supabase
    .from('complaint_filings')
    .update(updateData)
    .eq('id', filingId)
    .eq('user_id', userId);

  return !error;
}

/**
 * Add a hearing record
 */
export async function addHearingRecord(
  filingId: string,
  userId: string,
  hearing: HearingRecord
): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: filing } = await supabase
    .from('complaint_filings')
    .select('hearing_history, next_hearing_date')
    .eq('id', filingId)
    .eq('user_id', userId)
    .single();

  if (!filing) return false;

  const history = Array.isArray(filing.hearing_history) ? filing.hearing_history : [];
  history.push(hearing);

  const { error } = await supabase
    .from('complaint_filings')
    .update({
      hearing_history: history,
      next_hearing_date: hearing.next_date || filing.next_hearing_date,
      status: hearing.outcome ? 'order_received' : 'hearing_completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', filingId)
    .eq('user_id', userId);

  return !error;
}

/**
 * Get upcoming hearings for cron job
 */
export async function getUpcomingHearings(): Promise<Array<{
  filing_id: string;
  user_id: string;
  case_number: string | null;
  complaint_title: string;
  next_hearing_date: string;
  authority_type: string;
}>> {
  const supabase = createAdminClient();

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const { data, error } = await supabase
    .from('complaint_filings')
    .select('id, user_id, case_number, complaint_title, next_hearing_date, authority_type')
    .not('next_hearing_date', 'is', null)
    .gte('next_hearing_date', new Date().toISOString().split('T')[0])
    .lte('next_hearing_date', thirtyDaysFromNow.toISOString().split('T')[0])
    .in('status', ['filed', 'acknowledged', 'hearing_scheduled']);

  if (error || !data) return [];
  return data.map((d: Record<string, unknown>) => ({
    filing_id: String(d.id),
    user_id: String(d.user_id),
    case_number: d.case_number ? String(d.case_number) : null,
    complaint_title: String(d.complaint_title),
    next_hearing_date: String(d.next_hearing_date),
    authority_type: String(d.authority_type),
  }));
}
