// ============================================
// VOICE-FIRST LEGAL AID — BARREL EXPORT
// ============================================

export { processVoiceInput } from './conversation-engine';
export {
  createSession,
  getSession,
  getSessionByTelegram,
  addMessage,
  updateSessionContext,
  endSession,
  logAnalytics,
} from './session-manager';
export {
  SUPPORTED_LANGUAGES,
  getLanguageConfig,
  getAllLanguages,
  detectLanguageFromText,
  isFreshStartPhrase,
  isHelpPhrase,
} from './languages';
export {
  getVoiceSystemPrompt,
  getPhotoAnalysisPrompt,
  getFollowUpPrompt,
  getHelpMessage,
  getErrorMessage,
} from './prompts';
export { transcribeAudio } from './stt';
export { synthesizeSpeech, audioBufferToBase64, storeAudio } from './tts';
