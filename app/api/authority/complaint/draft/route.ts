// ============================================
// POST /api/authority/complaint/draft — Draft Complaint
// ============================================

import { NextResponse } from "next/server";
import { draftComplaintEmail } from "@/lib/authority/complaint-drafter";
import { getAuthorityById } from "@/lib/authority/authority-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { authority_id, document_context, complainant_name, complainant_address } = body;

    if (!document_context || !complainant_name) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    let authority = null;
    if (authority_id) {
      authority = await getAuthorityById(authority_id);
    }

    if (!authority) {
      // Create a minimal authority for drafting
      authority = {
        id: "unknown",
        name: document_context.authority_name || "Concerned Authority",
        authority_type: document_context.authority_type || "consumer_forum_district",
        physical_address: document_context.authority_address || null,
        presiding_officer_designation: "The Presiding Officer",
      } as any;
    }

    const draft = await draftComplaintEmail(
      authority,
      {
        document_type: document_context.document_type || "other",
        entity_name: document_context.entity_name || "Unknown Entity",
        jurisdiction: document_context.jurisdiction || "general",
        violations: document_context.violations || [],
        summary: document_context.summary || "",
        claim_amount: document_context.claim_amount,
      },
      complainant_name,
      complainant_address || ""
    );

    return NextResponse.json({ success: true, draft });
  } catch (error) {
    console.error("[ClauseWall] Complaint drafting failed:", error);
    return NextResponse.json(
      { success: false, error: "Complaint drafting failed" },
      { status: 500 }
    );
  }
}
