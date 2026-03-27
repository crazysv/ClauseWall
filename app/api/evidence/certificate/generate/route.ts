// Certificate Generation API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSection65BData } from "@/lib/evidence/legal/section-65b-generator";
import { generateCertificatePdf } from "@/lib/evidence/certificate-template";
import { uploadCertificatePdf } from "@/lib/evidence/storage";
import type { EvidenceItem, EvidenceCase } from "@/types/evidence";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { item_id, case_id, user_info } = body;

    if (!item_id || !case_id || !user_info?.name) {
      return NextResponse.json({ error: "Missing item_id, case_id, or user_info" }, { status: 400 });
    }

    // Get item and case
    const [{ data: item }, { data: caseData }] = await Promise.all([
      supabase.from("evidence_items").select("*").eq("id", item_id).eq("user_id", user.id).single(),
      supabase.from("evidence_cases").select("*").eq("id", case_id).eq("user_id", user.id).single(),
    ]);

    if (!item || !caseData) return NextResponse.json({ error: "Item or case not found" }, { status: 404 });

    // Generate certificate data
    const certData = generateSection65BData(item as EvidenceItem, caseData as EvidenceCase, user_info);

    // Generate PDF
    const pdfBuffer = generateCertificatePdf(certData);

    // Save certificate record
    const certId = crypto.randomUUID();
    const pdfPath = await uploadCertificatePdf(user.id, case_id, certId, pdfBuffer);

    const { data: cert, error } = await supabase
      .from("evidence_certificates")
      .insert({
        id: certId,
        evidence_item_id: item_id,
        case_id,
        user_id: user.id,
        certificate_data: certData,
        pdf_storage_path: pdfPath,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Mark item as certified
    await supabase
      .from("evidence_items")
      .update({ is_certified: true, certificate_id: certId })
      .eq("id", item_id);

    return NextResponse.json({ certificate: cert, pdf_path: pdfPath }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 });
  }
}
