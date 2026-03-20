// ============================================
// ADVERSARIAL DELIBERATION — BARREL EXPORTS
// ============================================

export type {
  AgentRole,
  AgentTone,
  AgentArgument,
  ArbiterVerdict,
  ClauseDeliberation,
  DeliberationResult,
  DeliberationProgress,
  DeliberationVerdict,
  DeliberationStatus,
  DeliberationSummary,
} from "./types";

export {
  getPredatorPrompt,
  getGuardianPrompt,
  getArbiterPrompt,
} from "./prompts";

export { deliberateClause, deliberateDocument } from "./engine";
