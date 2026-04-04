// POST /api/complaint/hearing-prep

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFiling, prepareForHearing } from "@/lib/complaint";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { filingId } = await request.json();
    if (!filingId)
      return NextResponse.json({ error: "Missing filingId" }, { status: 400 });

    const filing = await getFiling(filingId, user.id);
    if (!filing)
      return NextResponse.json({ error: "Filing not found" }, { status: 404 });

    const prep = await prepareForHearing(filing);
    return NextResponse.json(prep);
  } catch (error) {
    console.error("[ClauseWall] Hearing prep error:", error);
    return NextResponse.json(
      { error: "Failed to prepare for hearing" },
      { status: 500 },
    );
  }
}
