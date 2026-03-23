// ============================================
// LIB/NEGOTIATE — BARREL EXPORT
// ============================================

// Pressure tactics database & detection
export {
  PRESSURE_TACTICS,
  detectPressureTactic,
  detectAllTactics,
  getTacticByType,
} from "./pressure-tactics";

// Bluff checker
export {
  checkBluff,
  quickFactCheck,
  detectClauseType,
  extractClaimValue,
  CLAUSE_TYPE_MAP,
} from "./bluff-checker";

// Quick lookup
export { lookupClauseQuestion } from "./quick-lookup";

// Whisper transcription
export { transcribeAudio } from "./whisper-client";

// Audio processing
export {
  startAudioRecording,
  stopMediaStream,
  createAudioChunker,
  processTranscriptionResult,
  isMediaRecorderSupported,
} from "./audio-processor";

// Camera processing
export {
  startCameraStream,
  stopCameraStream,
  captureFrame,
  processFrameForClauses,
  isCameraSupported,
} from "./camera-processor";

// Session management
export {
  createSession,
  saveSession,
  loadSession,
  loadLatestSession,
  getAllSessions,
  deleteSession,
  addClauseToTracker,
  updateClauseStatus,
  calculateScore,
  addNote,
  exportSession,
} from "./session-manager";

// TTS engine
export {
  speakAdvice,
  stopSpeaking,
  isSpeaking,
  setVolume,
  getVolume,
  getAvailableVoices,
  isTTSSupported,
} from "./tts-engine";
