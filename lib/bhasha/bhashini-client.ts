// ============================================
// CLAUSEWALL — BHASHINI API CLIENT
// Indian government free AI translation/TTS/STT
// https://bhashini.gov.in
// ============================================

import type {
  BhashiniConfig,
  BhashiniServiceResponse,
  BhashiniTranslationResponse,
  BhashiniTTSResponse,
  BhashiniSTTResponse,
  TranslationResult,
  STTResult,
  SupportedLanguage,
} from "@/types/bhasha";
import { BHASHINI_PIPELINE_URL, BHASHINI_TIMEOUT_MS } from "./constants";

// ============================================
// CLIENT
// ============================================

class BhashiniClient {
  private apiKey: string;
  private userId: string;

  constructor() {
    this.apiKey = process.env.BHASHINI_API_KEY || "";
    this.userId = process.env.BHASHINI_USER_ID || "";
  }

  private get isConfigured(): boolean {
    return Boolean(this.apiKey && this.userId);
  }

  private get headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Authorization": this.apiKey,
      "userID": this.userId,
    };
  }

  // ============================================
  // SERVICE CONFIG
  // ============================================

  async getServiceConfig(
    taskType: "translation" | "tts" | "asr",
    sourceLanguage: string,
    targetLanguage?: string
  ): Promise<BhashiniServiceResponse | null> {
    if (!this.isConfigured) {
      console.warn("[ClauseWall] Bhashini not configured — missing API key");
      return null;
    }

    try {
      const pipelineTask: Record<string, unknown> = {
        taskType,
        config: {
          language: {
            sourceLanguage,
            ...(targetLanguage && { targetLanguage }),
          },
        },
      };

      const response = await fetch(BHASHINI_PIPELINE_URL, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          pipelineTasks: [pipelineTask],
          pipelineRequestConfig: {
            pipelineId: "64392f96daac500b55c543cd",
          },
        }),
        signal: AbortSignal.timeout(BHASHINI_TIMEOUT_MS),
      });

      if (!response.ok) {
        console.error(`[ClauseWall] Bhashini config failed: ${response.status}`);
        return null;
      }

      return await response.json() as BhashiniServiceResponse;
    } catch (error) {
      console.error("[ClauseWall] Bhashini service config error:", error);
      return null;
    }
  }

  // ============================================
  // TRANSLATION
  // ============================================

  async translate(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationResult | null> {
    if (!this.isConfigured) return null;

    try {
      const config = await this.getServiceConfig("translation", sourceLanguage, targetLanguage);
      if (!config?.pipelineResponseConfig?.[0]) return null;

      const endpoint = config.pipelineResponseConfig[0].pipelineInferenceAPIEndPoint;

      const response = await fetch(endpoint.callbackUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [endpoint.inferenceApiKey.name]: endpoint.inferenceApiKey.value,
        },
        body: JSON.stringify({
          pipelineTasks: [{
            taskType: "translation",
            config: {
              language: { sourceLanguage, targetLanguage },
            },
          }],
          inputData: {
            input: [{ source: text }],
          },
        }),
        signal: AbortSignal.timeout(BHASHINI_TIMEOUT_MS),
      });

      if (!response.ok) {
        console.error(`[ClauseWall] Bhashini translation failed: ${response.status}`);
        return null;
      }

      const data = await response.json() as BhashiniTranslationResponse;
      const translatedText = data.pipelineResponse?.[0]?.output?.[0]?.target;

      if (!translatedText) return null;

      return {
        translated_text: translatedText,
        source_language: sourceLanguage as SupportedLanguage,
        target_language: targetLanguage as SupportedLanguage,
        confidence: 0.85,
        service_used: "bhashini",
      };
    } catch (error) {
      console.error("[ClauseWall] Bhashini translation error:", error);
      return null;
    }
  }

  // ============================================
  // TEXT-TO-SPEECH
  // ============================================

  async textToSpeech(
    text: string,
    language: string,
    voice?: string
  ): Promise<Buffer | null> {
    if (!this.isConfigured) return null;

    try {
      const config = await this.getServiceConfig("tts", language);
      if (!config?.pipelineResponseConfig?.[0]) return null;

      const endpoint = config.pipelineResponseConfig[0].pipelineInferenceAPIEndPoint;

      const response = await fetch(endpoint.callbackUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [endpoint.inferenceApiKey.name]: endpoint.inferenceApiKey.value,
        },
        body: JSON.stringify({
          pipelineTasks: [{
            taskType: "tts",
            config: {
              language: { sourceLanguage: language },
              ...(voice && { serviceId: voice }),
            },
          }],
          inputData: {
            input: [{ source: text }],
          },
        }),
        signal: AbortSignal.timeout(BHASHINI_TIMEOUT_MS * 2), // TTS can take longer
      });

      if (!response.ok) {
        console.error(`[ClauseWall] Bhashini TTS failed: ${response.status}`);
        return null;
      }

      const data = await response.json() as BhashiniTTSResponse;
      const audioContent = data.pipelineResponse?.[0]?.audio?.[0]?.audioContent;

      if (!audioContent) return null;

      return Buffer.from(audioContent, "base64");
    } catch (error) {
      console.error("[ClauseWall] Bhashini TTS error:", error);
      return null;
    }
  }

  // ============================================
  // SPEECH-TO-TEXT
  // ============================================

  async speechToText(
    audioBuffer: Buffer,
    language: string
  ): Promise<STTResult | null> {
    if (!this.isConfigured) return null;

    try {
      const config = await this.getServiceConfig("asr", language);
      if (!config?.pipelineResponseConfig?.[0]) return null;

      const endpoint = config.pipelineResponseConfig[0].pipelineInferenceAPIEndPoint;
      const audioBase64 = audioBuffer.toString("base64");

      const response = await fetch(endpoint.callbackUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [endpoint.inferenceApiKey.name]: endpoint.inferenceApiKey.value,
        },
        body: JSON.stringify({
          pipelineTasks: [{
            taskType: "asr",
            config: {
              language: { sourceLanguage: language },
              audioFormat: "wav",
              samplingRate: 16000,
            },
          }],
          inputData: {
            audio: [{ audioContent: audioBase64 }],
          },
        }),
        signal: AbortSignal.timeout(BHASHINI_TIMEOUT_MS * 2),
      });

      if (!response.ok) {
        console.error(`[ClauseWall] Bhashini STT failed: ${response.status}`);
        return null;
      }

      const data = await response.json() as BhashiniSTTResponse;
      const text = data.pipelineResponse?.[0]?.output?.[0]?.source;

      if (!text) return null;

      return {
        text,
        language: language as SupportedLanguage,
        confidence: 0.85,
        service_used: "bhashini",
      };
    } catch (error) {
      console.error("[ClauseWall] Bhashini STT error:", error);
      return null;
    }
  }
}

// Singleton
let client: BhashiniClient | null = null;

export function getBhashiniClient(): BhashiniClient {
  if (!client) {
    client = new BhashiniClient();
  }
  return client;
}

export { BhashiniClient };
