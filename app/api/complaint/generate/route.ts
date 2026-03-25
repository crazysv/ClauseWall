// POST /api/complaint/generate
// Generate formal complaint documents

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateComplaint, createFiling, calculateFee } from '@/lib/complaint';
import type { AuthorityType } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      documentId, authorityType, complainantName, complainantAddress,
      complainantPhone, complainantEmail, respondentName, respondentAddress,
      respondentType, claimAmount, additionalContext,
    } = body;

    if (!documentId || !authorityType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch document and clauses
    const { data: doc } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const { data: clauses } = await supabase
      .from('clauses')
      .select('*')
      .eq('document_id', documentId)
      .order('clause_number', { ascending: true });

    const riskyClausesData = (clauses || [])
      .filter((c: { risk_level: string }) => c.risk_level === 'dangerous' || c.risk_level === 'illegal')
      .map((c: { clause_number: number; clause_type: string; risk_level: string; original_text: string; explanation: string; legal_citation: string | null }) => ({
        clause_number: c.clause_number,
        clause_type: c.clause_type,
        risk_level: c.risk_level,
        original_text: c.original_text,
        explanation: c.explanation,
        legal_citation: c.legal_citation,
      }));

    // Generate complaint
    const result = await generateComplaint({
      authorityType: authorityType as AuthorityType,
      complainantName: complainantName || user.email || 'Complainant',
      complainantAddress: complainantAddress || '',
      complainantPhone: complainantPhone || '',
      respondentName: respondentName || doc.entity_name || 'Respondent',
      respondentAddress: respondentAddress || '',
      respondentType: respondentType || '',
      claimAmount: claimAmount || 0,
      contractClauses: riskyClausesData,
      documentType: doc.document_type || 'other',
      jurisdiction: doc.jurisdiction || 'pan_india',
      overallRiskScore: doc.overall_risk_score || 0,
      additionalContext,
    });

    // Calculate fee
    const fee = calculateFee(
      authorityType as AuthorityType,
      claimAmount || 0,
      doc.jurisdiction || 'pan_india'
    );

    // Create filing record
    const filing = await createFiling(user.id, {
      document_id: documentId,
      authority_type: authorityType,
      complaint_title: `${complainantName || 'Complainant'} v. ${respondentName || doc.entity_name || 'Respondent'}`,
      complainant_name: complainantName,
      complainant_address: complainantAddress,
      complainant_phone: complainantPhone,
      complainant_email: complainantEmail || user.email || '',
      respondent_name: respondentName || doc.entity_name,
      respondent_address: respondentAddress,
      respondent_type: respondentType,
      claim_amount: claimAmount || 0,
      facts_of_case: result.complaint.content.substring(0, 5000),
      legal_grounds: result.citations,
      relief_sought: result.reliefItems,
      supporting_clauses: riskyClausesData.map(() => documentId),
      complaint_documents: [result.complaint, result.affidavit, result.synopsis],
      fee_calculation: fee,
    });

    return NextResponse.json({
      success: true,
      filing_id: filing?.id,
      complaint: result.complaint,
      affidavit: result.affidavit,
      synopsis: result.synopsis,
      fee,
      citations: result.citations,
      relief_items: result.reliefItems,
    });
  } catch (error) {
    console.error('[ClauseWall] Complaint generate error:', error);
    return NextResponse.json({ error: 'Failed to generate complaint' }, { status: 500 });
  }
}
