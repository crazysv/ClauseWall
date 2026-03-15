// ============================================
// ML MODULE PUBLIC API
// ============================================

export { loadModel, warmUpModel, getModelStatus, getModelConfig } from "./model-loader";
export { classifyDocument } from "./classifier";
export { splitIntoClauses } from "./clause-splitter";
export type { MLScanResult, MLClauseResult, ModelStatus, ModelConfig } from "./types";