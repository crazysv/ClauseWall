// ============================================
// CONTRACT STATE MACHINE ENGINE — BARREL EXPORTS
// Main entry point for the state machine module
// ============================================

export * from "./types";
export { getTemplate, validateAgainstTemplate, enhanceWithTemplate } from "./templates";
export { extractStateMachine } from "./extractor";
export { StateMachineAnalyzer } from "./analyzer";

import { extractStateMachine } from "./extractor";
import { StateMachineAnalyzer } from "./analyzer";
import type { StateMachineReport } from "./types";

/**
 * Main entry point: extract a state machine from contract text and run full analysis.
 * Returns a complete StateMachineReport or null on failure.
 * NEVER throws — all errors are caught and logged.
 */
export async function extractAndAnalyzeStateMachine(
  fullContractText: string,
  documentType: string,
  jurisdiction: string,
  documentId: string,
  clauses?: Array<{ text: string; type: string; index: number }>
): Promise<StateMachineReport | null> {
  try {

    // Step 1: Extract state machine from contract text via AI
    const stateMachine = await extractStateMachine(
      fullContractText,
      documentType,
      jurisdiction,
      clauses
    );

    if (!stateMachine) {
      console.warn("[ClauseWall] [StateMachine] Extraction returned null — skipping analysis");
      return null;
    }

    // Step 2: Set the document ID
    stateMachine.documentId = documentId;

    // Step 3: Run deterministic graph analysis
    const analyzer = new StateMachineAnalyzer(stateMachine);
    const report = analyzer.getFullReport();


    return report;
  } catch (error) {
    console.error("[ClauseWall] [StateMachine] extractAndAnalyzeStateMachine failed:", error);
    return null;
  }
}
