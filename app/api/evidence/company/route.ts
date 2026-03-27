// MCA Company Lookup API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCompanyData } from "@/lib/evidence/archiver/mca-scraper";
import { addEvidenceItem } from "@/lib/evidence/capture";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { case_id, cin } = body;

    if (!case_id || !cin) return NextResponse.json({ error: "Missing case_id or cin" }, { status: 400 });

    const companyResult = await fetchCompanyData(cin);

    if (!companyResult.data) {
      return NextResponse.json({ error: companyResult.error || "Failed to fetch company data" }, { status: 404 });
    }

    const result = await addEvidenceItem(case_id, user.id, {
      evidence_type: "company_data",
      title: `Company: ${companyResult.data.company_name}`,
      description: `CIN: ${cin} | Status: ${companyResult.data.company_status} | Source: ${companyResult.source}`,
      content: JSON.stringify(companyResult.data),
      extracted_data: companyResult.data,
      source: "mca_fetch",
    });

    return NextResponse.json({
      item: result.item,
      company: companyResult.data,
      source: companyResult.source,
      partial: !companyResult.success,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to fetch company data" }, { status: 500 });
  }
}
