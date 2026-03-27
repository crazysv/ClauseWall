// Evidence Bundle Generation API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEvidenceBundle } from "@/lib/evidence/legal/evidence-bundle-generator";
import { uploadBundlePdf } from "@/lib/evidence/storage";
import type { EvidenceItem, EvidenceCase, EvidenceCertificate, BundleConfig } from "@/types/evidence";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { case_id, bundle_type, title, config } = body as {
      case_id: string;
      bundle_type: string;
      title: string;
      config: BundleConfig;
    };

    if (!case_id || !title) return NextResponse.json({ error: "Missing case_id or title" }, { status: 400 });

    // Fetch case, items, certificates
    const [{ data: caseData }, { data: items }, { data: certs }] = await Promise.all([
      supabase.from("evidence_cases").select("*").eq("id", case_id).eq("user_id", user.id).single(),
      supabase.from("evidence_items").select("*").eq("case_id", case_id).eq("user_id", user.id).order("sequence_number"),
      supabase.from("evidence_certificates").select("*").eq("case_id", case_id).eq("user_id", user.id),
    ]);

    if (!caseData) return NextResponse.json({ error: "Case not found" }, { status: 404 });
    if (!items?.length) return NextResponse.json({ error: "No evidence items to bundle" }, { status: 400 });

    // Generate bundle
    const { pdf, totalPages, bundleHash } = await generateEvidenceBundle(
      caseData as EvidenceCase,
      items as EvidenceItem[],
      (certs || []) as EvidenceCertificate[],
      config || {}
    );

    // Upload PDF
    const bundleId = crypto.randomUUID();
    const pdfPath = await uploadBundlePdf(user.id, case_id, bundleId, pdf);

    // Save bundle record
    const { data: bundle, error } = await supabase
      .from("evidence_bundles")
      .insert({
        id: bundleId,
        case_id,
        user_id: user.id,
        bundle_type: bundle_type || "full",
        title,
        included_item_ids: items.map((i: { id: string }) => i.id),
        pdf_storage_path: pdfPath,
        total_pages: totalPages,
        file_size_bytes: pdf.length,
        bundle_hash: bundleHash,
        chain_root_hash: caseData.chain_root_hash,
        config: config || {},
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ bundle, total_pages: totalPages }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to generate bundle" }, { status: 500 });
  }
}
