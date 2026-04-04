// Chain Verification API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyChainIntegrity, buildMerkleTree } from "@/lib/evidence/chain";
import type { EvidenceItem } from "@/types/evidence";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { case_id } = body;
    if (!case_id)
      return NextResponse.json({ error: "Missing case_id" }, { status: 400 });

    const { data: items, error } = await supabase
      .from("evidence_items")
      .select("*")
      .eq("case_id", case_id)
      .eq("user_id", user.id)
      .order("sequence_number", { ascending: true });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    const typedItems = (items || []) as EvidenceItem[];
    const verification = verifyChainIntegrity(typedItems);
    const merkle = buildMerkleTree(typedItems.map((i) => i.content_hash));

    // Update case with verification result
    await supabase
      .from("evidence_cases")
      .update({
        chain_verified: verification.valid,
        chain_root_hash: merkle.root,
        last_chain_verification: new Date().toISOString(),
      })
      .eq("id", case_id)
      .eq("user_id", user.id);

    return NextResponse.json({ verification, merkle_root: merkle.root });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
