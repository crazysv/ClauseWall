// ============================================
// BARREL EXPORT — lib/vault/index.ts
// Re-exports all public functions
// ============================================

// Core conflict detection
export { detectCrossContractConflicts } from "./conflict-detector";

// Coverage gap analysis
export { analyzeCoverageGaps } from "./gap-analyzer";

// Cascading failure detection
export { analyzeCascadingFailures } from "./cascade-analyzer";

// Financial exposure calculation
export { calculateFinancialExposure } from "./exposure-calculator";

// Obligation unification
export { unifyObligations } from "./obligation-unifier";

// What-if scenario simulation
export { simulateWhatIf } from "./whatif-simulator";

// Vault scoring and summary
export {
  calculateVaultRiskScore,
  generateVaultSummary,
  getVaultSummaryStats,
} from "./vault-scorer";
