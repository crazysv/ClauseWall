// ============================================
// VOICE-FIRST CONVERSATION ENGINE
// Core brain: processes voice/photo input → response
// ============================================

import { callGroqChat } from '@/lib/ai/groq-client';
import { callGeminiVision } from '@/lib/bot/gemini-client';
import { transcribeAudio } from '@/lib/voice-aid/stt';
import { synthesizeSpeech, audioBufferToBase64 } from '@/lib/voice-aid/tts';
import {
  createSession,
  getSession,
  getSessionByTelegram,
  addMessage,
  updateSessionContext,
  logAnalytics,
} from '@/lib/voice-aid/session-manager';
import {
  getVoiceSystemPrompt,
  getPhotoAnalysisPrompt,
  getFollowUpPrompt,
  getHelpMessage,
  getErrorMessage,
} from '@/lib/voice-aid/prompts';
import {
  detectLanguageFromText,
  isFreshStartPhrase,
  isHelpPhrase,
} from '@/lib/voice-aid/languages';
import type {
  SupportedLanguage,
  VoiceAnalysisResponse,
} from '@/types';
import type { GroqMessage } from '@/lib/ai/groq-client';

interface ProcessInput {
  audio?: Buffer | ArrayBuffer;
  audioFormat?: string;
  photo?: Buffer | ArrayBuffer;
  photoMimeType?: string;
  text?: string;
  language: SupportedLanguage;
  sessionId?: string;
  userId?: string | null;
  telegramChatId?: string | null;
}

/**
 * Main entry point: process voice/text/photo input and return response.
 */
export async function processVoiceInput(input: ProcessInput): Promise<VoiceAnalysisResponse> {
  const startTime = Date.now();
  let userText = input.text || '';
  let sttProvider: string | undefined;
  let photoOcrText: string | undefined;

  try {
    // Step 1: Transcribe audio if provided
    if (input.audio && !userText) {
      const sttResult = await transcribeAudio(
        input.audio instanceof Buffer ? input.audio : Buffer.from(new Uint8Array(input.audio as ArrayBuffer)),
        input.language,
        input.audioFormat || 'webm'
      );
      userText = sttResult.text;
      sttProvider = sttResult.provider;

      if (!userText || userText.trim().length === 0) {
        return makeErrorResponse(
          getErrorMessage('no_speech', input.language),
          input.language
        );
      }
    }

    if (!userText && !input.photo) {
      return makeErrorResponse(
        getErrorMessage('general', input.language),
        input.language
      );
    }

    // Step 2: Auto-detect language if text looks like a different language
    const detectedLang = userText ? detectLanguageFromText(userText) : input.language;
    const effectiveLang = detectedLang || input.language;

    // Step 3: Get or create session
    let session = input.sessionId
      ? await getSession(input.sessionId)
      : input.telegramChatId
        ? await getSessionByTelegram(input.telegramChatId)
        : null;

    // Check for fresh start
    if (userText && isFreshStartPhrase(userText, effectiveLang)) {
      session = await createSession(effectiveLang, input.userId, input.telegramChatId);
      const greeting = getHelpMessage(effectiveLang);

      await addMessage(session.id, 'user', userText, effectiveLang);
      await addMessage(session.id, 'assistant', greeting, effectiveLang);

      // Generate TTS for greeting
      const ttsResult = await synthesizeSpeech(greeting, effectiveLang);
      const audioBase64 = ttsResult.audioBuffer ? audioBufferToBase64(ttsResult.audioBuffer) : null;

      logAnalytics({
        language: effectiveLang,
        source: input.telegramChatId ? 'telegram' : 'web',
        stt_provider: sttProvider,
        tts_provider: ttsResult.provider,
        stt_success: !!userText,
        tts_success: !!ttsResult.audioBuffer,
        response_time_ms: Date.now() - startTime,
      });

      return {
        text: greeting,
        audio_url: null,
        audio_base64: audioBase64,
        language: effectiveLang,
        session_id: session.id,
        document_id: null,
        analysis_summary: null,
        action_items: [],
        clauses_discussed: [],
        needs_follow_up: false,
      };
    }

    // Check for help
    if (userText && isHelpPhrase(userText, effectiveLang)) {
      if (!session) {
        session = await createSession(effectiveLang, input.userId, input.telegramChatId);
      }
      const helpMsg = getHelpMessage(effectiveLang);

      await addMessage(session.id, 'user', userText, effectiveLang);
      await addMessage(session.id, 'assistant', helpMsg, effectiveLang);

      const ttsResult = await synthesizeSpeech(helpMsg, effectiveLang);
      const audioBase64 = ttsResult.audioBuffer ? audioBufferToBase64(ttsResult.audioBuffer) : null;

      return {
        text: helpMsg,
        audio_url: null,
        audio_base64: audioBase64,
        language: effectiveLang,
        session_id: session.id,
        document_id: null,
        analysis_summary: null,
        action_items: [],
        clauses_discussed: [],
        needs_follow_up: false,
      };
    }

    if (!session) {
      session = await createSession(effectiveLang, input.userId, input.telegramChatId);
    }

    // Step 4: Process photo if provided (OCR + analysis)
    if (input.photo) {
      return await processPhotoInput(input, session, userText, effectiveLang, startTime, sttProvider);
    }

    // Step 5: Text/voice Q&A
    return await processTextInput(input, session, userText, effectiveLang, startTime, sttProvider);
  } catch (error) {
    console.error('[ClauseWall] Voice engine error:', error);
    const errorMsg = getErrorMessage('general', input.language);

    return makeErrorResponse(errorMsg, input.language);
  }
}

/**
 * Process a photo input: OCR → Analysis → Spoken response
 */
async function processPhotoInput(
  input: ProcessInput,
  session: { id: string; document_id: string | null; messages: Array<{ role: string; text: string }> },
  userText: string,
  language: SupportedLanguage,
  startTime: number,
  sttProvider?: string
): Promise<VoiceAnalysisResponse> {
  const photoBuffer = input.photo instanceof Buffer
    ? input.photo
    : Buffer.from(new Uint8Array(input.photo as ArrayBuffer));
  const base64 = photoBuffer.toString('base64');
  const mimeType = input.photoMimeType || 'image/jpeg';

  // OCR + Analysis via Gemini
  const analysisPrompt = getPhotoAnalysisPrompt(language);
  const ocrResult = await callGeminiVision(
    analysisPrompt + (userText ? `\n\nUser also said: "${userText}"` : ''),
    base64,
    mimeType,
    { temperature: 0.2, maxTokens: 4096 }
  );

  // Parse extracted text (might be in JSON or raw)
  let extractedText = '';
  let analysisText = ocrResult;
  try {
    const parsed = JSON.parse(ocrResult);
    extractedText = parsed.extracted_text || '';
    analysisText = parsed.analysis || parsed.response || parsed.answer || ocrResult;
  } catch {
    // Raw text response — use as-is
    analysisText = ocrResult;
  }

  // Now get a voice-friendly response from Groq
  const messages: GroqMessage[] = [
    { role: 'system', content: getVoiceSystemPrompt(language) },
    {
      role: 'user',
      content: `The user sent a photo of a contract. Here is the analysis result:\n\n${analysisText}\n\n${extractedText ? `Extracted text: ${extractedText.substring(0, 2000)}` : ''}\n\n${userText ? `The user also said: "${userText}"` : 'Explain the findings to the user.'}`
    },
  ];

  const responseText = await callGroqChat(messages, {
    temperature: 0.3,
    maxTokens: 512,
  });

  // Save messages
  await addMessage(session.id, 'user', userText || '[Photo sent]', language, undefined, {
    had_photo: true,
    photo_ocr_text: extractedText?.substring(0, 500),
    stt_provider: sttProvider,
  });
  await addMessage(session.id, 'assistant', responseText, language);

  // Update session context
  if (extractedText) {
    await updateSessionContext(session.id, '', `Contract OCR text (truncated): ${extractedText.substring(0, 1000)}`);
  }

  // TTS
  const ttsResult = await synthesizeSpeech(responseText, language);
  const audioBase64 = ttsResult.audioBuffer ? audioBufferToBase64(ttsResult.audioBuffer) : null;

  logAnalytics({
    language,
    source: input.telegramChatId ? 'telegram' : 'web',
    stt_provider: sttProvider,
    tts_provider: ttsResult.provider,
    stt_success: !!userText,
    tts_success: !!ttsResult.audioBuffer,
    response_time_ms: Date.now() - startTime,
    had_photo: true,
  });

  return {
    text: responseText,
    audio_url: null,
    audio_base64: audioBase64,
    language,
    session_id: session.id,
    document_id: null,
    analysis_summary: analysisText.substring(0, 500),
    action_items: [],
    clauses_discussed: [],
    needs_follow_up: true,
  };
}

/**
 * Process text/voice Q&A input.
 */
async function processTextInput(
  input: ProcessInput,
  session: { id: string; document_id: string | null; context_summary?: string | null; messages: Array<{ role: string; text: string }> },
  userText: string,
  language: SupportedLanguage,
  startTime: number,
  sttProvider?: string
): Promise<VoiceAnalysisResponse> {
  // Build conversation history
  const systemPrompt = session.context_summary
    ? getFollowUpPrompt(language, session.context_summary)
    : getVoiceSystemPrompt(language);

  const conversationMessages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  // Add last 6 messages as context (3 turns)
  const recentMessages = session.messages.slice(-6);
  for (const msg of recentMessages) {
    conversationMessages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.text,
    });
  }

  // Add current user message
  conversationMessages.push({
    role: 'user',
    content: userText,
  });

  const responseText = await callGroqChat(conversationMessages, {
    temperature: 0.3,
    maxTokens: 512,
  });

  // Save messages
  await addMessage(session.id, 'user', userText, language, undefined, {
    stt_provider: sttProvider,
  });
  await addMessage(session.id, 'assistant', responseText, language);

  // TTS
  const ttsResult = await synthesizeSpeech(responseText, language);
  const audioBase64 = ttsResult.audioBuffer ? audioBufferToBase64(ttsResult.audioBuffer) : null;

  logAnalytics({
    language,
    source: input.telegramChatId ? 'telegram' : 'web',
    stt_provider: sttProvider,
    tts_provider: ttsResult.provider,
    stt_success: true,
    tts_success: !!ttsResult.audioBuffer,
    response_time_ms: Date.now() - startTime,
  });

  return {
    text: responseText,
    audio_url: null,
    audio_base64: audioBase64,
    language,
    session_id: session.id,
    document_id: session.document_id || null,
    analysis_summary: null,
    action_items: [],
    clauses_discussed: [],
    needs_follow_up: true,
  };
}

/**
 * Create an error response.
 */
function makeErrorResponse(text: string, language: SupportedLanguage): VoiceAnalysisResponse {
  return {
    text,
    audio_url: null,
    audio_base64: null,
    language,
    session_id: '',
    document_id: null,
    analysis_summary: null,
    action_items: [],
    clauses_discussed: [],
    needs_follow_up: false,
  };
}
