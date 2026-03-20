import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { StateMachineReport, ContractState, StateTransition } from "@/lib/statemachine/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, currentStateId, action } = body;

    if (!documentId || !currentStateId) {
      return NextResponse.json(
        { success: false, error: "Missing documentId or currentStateId" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("state_machine_data")
      .eq("id", documentId)
      .single();

    if (docError || !doc || !doc.state_machine_data) {
      return NextResponse.json(
        { success: false, error: "State machine data not found" },
        { status: 404 }
      );
    }

    const report = doc.state_machine_data as StateMachineReport;
    const sm = report.stateMachine;

    // Find current state
    const currentState = sm.states.find((s: ContractState) => s.id === currentStateId);
    if (!currentState) {
      return NextResponse.json(
        { success: false, error: "State not found in state machine" },
        { status: 404 }
      );
    }

    // Find available transitions from current state
    const availableTransitions = sm.transitions.filter(
      (t: StateTransition) => t.fromStateId === currentStateId
    );

    // Try to match action to a transition
    let nextState: ContractState | null = null;
    let matchedTransition: StateTransition | null = null;

    if (action) {
      const actionLower = (action as string).toLowerCase();
      matchedTransition = availableTransitions.find(
        (t: StateTransition) =>
          t.trigger.toLowerCase().includes(actionLower) ||
          actionLower.includes(t.trigger.toLowerCase()) ||
          t.id === action
      ) || null;

      if (matchedTransition) {
        nextState = sm.states.find(
          (s: ContractState) => s.id === matchedTransition!.toStateId
        ) || null;
      }
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (currentState.isTrap) {
      recommendations.push("⚠️ You are in a trap state. Consider seeking legal advice.");
      const trap = report.trapAnalysis.find((t) => t.stateId === currentStateId);
      if (trap) {
        recommendations.push(trap.fairAlternative);
      }
    }

    const safeTransitions = availableTransitions.filter((t: StateTransition) => {
      const target = sm.states.find((s: ContractState) => s.id === t.toStateId);
      return target && !target.isTrap && target.type !== "terminal_loss";
    });

    if (safeTransitions.length > 0) {
      recommendations.push(
        `Recommended action: ${safeTransitions[0].trigger}`
      );
    }

    return NextResponse.json({
      success: true,
      currentState,
      availableTransitions,
      nextState,
      consequences: matchedTransition?.financialConsequence || null,
      recommendations,
    });
  } catch (error) {
    console.error("[ClauseWall] State machine simulate API error:", error);
    return NextResponse.json(
      { success: false, error: "Simulation failed" },
      { status: 500 }
    );
  }
}
