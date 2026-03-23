// ============================================
// COLLECTIVE BARGAINING ENGINE — Barrel Export
// ============================================

export { getEntityIntelligence } from "./entity-intelligence";
export {
  joinCollective,
  leaveCollective,
  getCollective,
  getUserCollectives,
  proposeAction,
  castVote,
  updateCollectiveStats,
} from "./collective-manager";
export { calculateLeverage } from "./leverage-calculator";
export { generateCollectiveDocument } from "./action-generator";
export { sendMessage, getMessages, togglePinMessage, getPinnedMessages } from "./messaging";
export { matchLegalAidOrganizations, getForumForComplaint } from "./legal-aid-matcher";
