import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { StateMachineReport } from "@/lib/statemachine/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const { documentId } = await params;

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: "Missing documentId" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("state_machine_data")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 },
      );
    }

    if (!doc.state_machine_data) {
      return NextResponse.json(
        {
          success: false,
          error: "No state machine data available for this document",
        },
        { status: 404 },
      );
    }

    const report = doc.state_machine_data as StateMachineReport;

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("[ClauseWall] State machine GET API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch state machine data" },
      { status: 500 },
    );
  }
}
