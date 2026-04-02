// ============================================
// BHASHINI TTS — PRIMARY TTS PROVIDER
// Indian government's natural voice synthesis
// ============================================

import { getLanguageConfig } from '@/lib/voice-aid/languages';
import type { SupportedLanguage, TTSResult } from '@/types';

// Cache pipeline config (rarely changes)
let pipelineCache: Record<string, {
  serviceId: string;
  inferenceUrl: string;
  authToken: string;
  fetchedAt: number;
}> = {};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get Bhashini pipeline config for a language (cached).
 */
async function getPipelineConfig(bhashiniCode: string): Promise<{
  serviceId: string;
  inferenceUrl: string;
  authToken: string;
} | null> {
  const apiKey = process.env.BHASHINI_API_KEY;
  const userId = process.env.BHASHINI_USER_ID;

  if (!apiKey || !userId) {
    console.warn('[ClauseWall] Bhashini: API key or user ID not configured');
    return null;
  }

  // Check cache
  const cached = pipelineCache[bhashiniCode];
  if (cached && (Date.now() - cached.fetchedAt) < CACHE_TTL_MS) {
    return cached;
  }

  try {
    const pipelineId = process.env.BHASHINI_PIPELINE_ID || '64392f96daac500b55c543cd';

    const response = await fetch('https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ulcaApiKey': apiKey,
        'userID': userId,
      },
      body: JSON.stringify({
        pipelineTasks: [{
          taskType: 'tts',
          config: {
            language: { sourceLanguage: bhashiniCode },
          },
        }],
        pipelineRequestConfig: {
          pipelineId,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(`[ClauseWall] Bhashini pipeline config failed: ${response.status}`);
      return null;
    }

    const data = await response.json();

    const pipelineResponse = data?.pipelineResponseConfig?.[0];
    const taskConfig = pipelineResponse?.config?.[0];

    if (!taskConfig?.serviceId) {
      console.error('[ClauseWall] Bhashini: No TTS service found for language:', bhashiniCode);
      return null;
    }

    const inferenceUrl = data?.pipelineInferenceAPIEndPoint?.callbackUrl;
    const authToken = data?.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value;

    if (!inferenceUrl || !authToken) {
      console.error('[ClauseWall] Bhashini: Missing inference URL or auth token');
      return null;
    }

    const config = {
      serviceId: taskConfig.serviceId,
      inferenceUrl,
      authToken,
      fetchedAt: Date.now(),
    };

    pipelineCache[bhashiniCode] = config;

    return config;
  } catch (error) {
    console.error('[ClauseWall] Bhashini pipeline config error:', error);
    return null;
  }
}

/**
 * Synthesize speech using Bhashini API.
 * Returns base64 audio on success, throws on failure.
 */
export async function synthesizeWithBhashini(
  text: string,
  language: SupportedLanguage,
  gender: 'male' | 'female' = 'female'
): Promise<TTSResult> {
  const startTime = Date.now();
  const config = getLanguageConfig(language);

  const pipeline = await getPipelineConfig(config.bhashiniCode);
  if (!pipeline) {
    throw new Error('Bhashini pipeline not available');
  }

  try {
    // Chunk long text into sentences (Bhashini has limits)
    const chunks = text.length > 5000
      ? splitIntoChunks(text, 5000)
      : [text];

    const audioBuffers: ArrayBuffer[] = [];

    for (const chunk of chunks) {
      const response = await fetch(pipeline.inferenceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': pipeline.authToken,
        },
        body: JSON.stringify({
          pipelineTasks: [{
            taskType: 'tts',
            config: {
              language: { sourceLanguage: config.bhashiniCode },
              gender,
              serviceId: pipeline.serviceId,
            },
          }],
          inputData: {
            input: [{ source: chunk }],
          },
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[ClauseWall] Bhashini TTS failed: ${response.status}`, errText.substring(0, 200));
        throw new Error(`Bhashini TTS failed: ${response.status}`);
      }

      const data = await response.json();
      const audioContent = data?.pipelineResponse?.[0]?.audio?.[0]?.audioContent;

      if (!audioContent) {
        throw new Error('No audio content in Bhashini response');
      }

      // Base64 to ArrayBuffer
      const binaryString = atob(audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      audioBuffers.push(bytes.buffer);
    }

    // Concatenate all audio buffers
    const totalLength = audioBuffers.reduce((sum, buf) => sum + buf.byteLength, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of audioBuffers) {
      combined.set(new Uint8Array(buf), offset);
      offset += buf.byteLength;
    }

    const duration = Date.now() - startTime;

    return {
      audioUrl: null,
      audioBuffer: combined.buffer,
      provider: 'bhashini',
      language,
      duration_ms: duration,
    };
  } catch (error) {
    console.error('[ClauseWall] Bhashini TTS error:', error);
    throw error;
  }
}

/** Split text into chunks at sentence boundaries */
function splitIntoChunks(text: string, maxLength: number): string[] {
  const sentences = text.split(/(?<=[।\\.!?])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > maxLength && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}
