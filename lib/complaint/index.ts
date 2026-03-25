// ============================================
// COMPLAINT MODULE — PUBLIC API
// Re-exports for clean imports
// ============================================

export { determineAuthority } from './authority-router';
export { calculateFee } from './fee-calculator';
export { resolveJurisdiction } from './jurisdiction-resolver';
export { generateComplaint } from './complaint-generator';
export { getFilingGuide } from './filing-guide';
export { prepareForHearing } from './hearing-prep';
export {
  createFiling,
  updateFiling,
  getFiling,
  listFilings,
  updateFilingStatus,
  addHearingRecord,
  getUpcomingHearings,
} from './case-tracker';
export {
  AUTHORITIES,
  getAuthoritiesByType,
  getAuthoritiesByState,
  getAuthorityById,
  getAuthorityTypeLabel,
} from './authority-data';
