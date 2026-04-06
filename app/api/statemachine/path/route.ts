import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { StateMachineAnalyzer } from "@/lib/statemachine/analyzer";
import type { StateMachineReport } from "@/lib/statemachine/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const rl = await rateLimit(request, "AI_MEDIUM", user.id);
    if (!rl.success) return rateLimitResponse(rl);

    const body = await request.json();
    const { documentId, fromStateId, toStateId } = body;

    if (!documentId || !fromStateId || !toStateId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing documentId, fromStateId, or toStateId",
        },
        { status: 400 },
      );
    }

    

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("state_machine_data")
      .eq("id", documentId)
      .single();

    if (docError || !doc || !doc.state_machine_data) {
      return NextResponse.json(
        { success: false, error: "State machine data not found" },
        { status: 404 },
      );
    }

    const report = doc.state_machine_data as StateMachineReport;
    const analyzer = new StateMachineAnalyzer(report.stateMachine);

    const paths = analyzer.findAllPaths(fromStateId, toStateId, 12);

    return NextResponse.json({
      success: true,
      paths,
      totalPaths: paths.length,
    });
  } catch (error) {
    console.error("[ClauseWall] State machine path API error:", error);
    return NextResponse.json(
      { success: false, error: "Path finding failed" },
      { status: 500 },
    );
  }
}
