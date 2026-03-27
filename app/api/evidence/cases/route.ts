// Evidence Cases API — GET (list), POST (create)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EvidenceCase } from "@/types/evidence";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("evidence_cases")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ cases: data as EvidenceCase[] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch cases" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { title, description, counterparty_name, counterparty_type, dispute_type, dispute_description, document_id } = body;

    if (!title || !counterparty_name || !counterparty_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("evidence_cases")
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        counterparty_name,
        counterparty_type,
        dispute_type: dispute_type || null,
        dispute_description: dispute_description || null,
        document_id: document_id || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ case: data as EvidenceCase }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create case" }, { status: 500 });
  }
}
