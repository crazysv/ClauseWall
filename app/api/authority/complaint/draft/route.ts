// ============================================
// POST /api/authority/complaint/draft — Draft Complaint
// ============================================

import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { ComplaintDraftSchema, type ComplaintDraftInput } from "@/lib/validation/schemas";
import { draftComplaintEmail } from "@/lib/authority/complaint-drafter";
import { getAuthorityById } from "@/lib/authority/authority-db";

export const POST = withApiHandler<ComplaintDraftInput>(
  {
    module: "complaint-draft",
    rateLimit: "AI_HEAVY",
    auth: true,
    schema: ComplaintDraftSchema,
  },
  async (ctx) => {
    const {
      authority_id,
      document_context,
      complainant_name,
      complainant_address,
    } = ctx.body;

    let authority = null;
    if (authority_id) {
      authority = await getAuthorityById(authority_id);
    }

    if (!authority) {
      // Create a minimal authority for drafting
      authority = {
        id: "unknown",
        name: document_context.authority_name || "Concerned Authority",
        authority_type:
          document_context.authority_type || "consumer_forum_district",
        physical_address: document_context.authority_address || null,
        presiding_officer_designation: "The Presiding Officer",
      } as any;
    }

    const draft = await draftComplaintEmail(
      authority,
      {
        document_type: document_context.document_type,
        entity_name: document_context.entity_name,
        jurisdiction: document_context.jurisdiction,
        violations: document_context.violations,
        summary: document_context.summary,
        claim_amount: document_context.claim_amount,
      },
      complainant_name,
      complainant_address,
    );

    return NextResponse.json({ success: true, draft });
  },
);
