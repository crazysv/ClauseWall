// ============================================
// CLAUSEWALL — TRANSLATION ORCHESTRATOR
// Bhashini (primary) → Groq (fallback)
// With LRU cache and text chunking
// ============================================

import type { TranslationResult, SupportedLanguage } from "@/types/bhasha";
import { getBhashiniClient } from "./bhashini-client";
import { callGroq } from "@/lib/ai/groq-client";
import { BHASHINI_MAX_TEXT_LENGTH, LANGUAGE_CONFIGS } from "./constants";

// ============================================
// IN-MEMORY LRU CACHE
// ============================================

const CACHE_MAX_SIZE = 1000;
const translationCache = new Map<string, TranslationResult>();

function getCacheKey(text: string, source: string, target: string): string {
  const textKey = text.substring(0, 100) + `:${text.length}`;
  return `${source}:${target}:${textKey}`;
}

function getFromCache(key: string): TranslationResult | null {
  const result = translationCache.get(key);
  if (result) {
    translationCache.delete(key);
    translationCache.set(key, result);
  }
  return result || null;
}

function setInCache(key: string, result: TranslationResult): void {
  if (translationCache.size >= CACHE_MAX_SIZE) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey) translationCache.delete(firstKey);
  }
  translationCache.set(key, result);
}

// ============================================
// MAIN TRANSLATION FUNCTION
// ============================================

/**
 * Translate text between languages.
 * Fallback chain: Bhashini → Groq → return original with error.
 */
export async function translateText(
  text: string,
  sourceLang: SupportedLanguage,
  targetLang: SupportedLanguage
): Promise<TranslationResult> {
  if (sourceLang === targetLang) {
    return {
      translated_text: text,
      source_language: sourceLang,
      target_language: targetLang,
      confidence: 1.0,
      service_used: "bhashini",
    };
  }

  const cacheKey = getCacheKey(text, sourceLang, targetLang);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  if (text.length > BHASHINI_MAX_TEXT_LENGTH) {
    return translateLongText(text, sourceLang, targetLang);
  }

  const bhashiniResult = await tryBhashini(text, sourceLang, targetLang);
  if (bhashiniResult) {
    setInCache(cacheKey, bhashiniResult);
    return bhashiniResult;
  }

  const groqResult = await tryGroq(text, sourceLang, targetLang);
  if (groqResult) {
    setInCache(cacheKey, groqResult);
    return groqResult;
  }

  console.error("[ClauseWall] All translation services failed");
  return {
    translated_text: text,
    source_language: sourceLang,
    target_language: targetLang,
    confidence: 0,
    service_used: "groq",
  };
}

async function tryBhashini(
  text: string, sourceLang: SupportedLanguage, targetLang: SupportedLanguage
): Promise<TranslationResult | null> {
  try {
    const client = getBhashiniClient();
    return await client.translate(text, sourceLang, targetLang);
  } catch (error) {
    console.warn("[ClauseWall] Bhashini translation failed:", error);
    return null;
  }
}

async function tryGroq(
  text: string, sourceLang: SupportedLanguage, targetLang: SupportedLanguage
): Promise<TranslationResult | null> {
  const sourceConfig = LANGUAGE_CONFIGS[sourceLang];
  const targetConfig = LANGUAGE_CONFIGS[targetLang];
  try {
    const response = await callGroq(
      [
        {
          role: "system",
          content: `You are an expert translator specializing in Indian legal documents.
Translate the following ${sourceConfig.name} text to ${targetConfig.name}.

RULES:
1. Preserve legal terminology accuracy
2. If a legal term has no direct translation, keep the original term and add the translation in parentheses
3. Preserve formatting (paragraph breaks, numbering)
4. Do NOT add explanations — just translate
5. Preserve numbers and currency symbols as-is

Return ONLY the translated text, nothing else.`,
        },
        { role: "user", content: text },
      ],
      { temperature: 0.1, maxTokens: 4000 }
    );
    return {
      translated_text: response,
      source_language: sourceLang,
      target_language: targetLang,
      confidence: 0.75,
      service_used: "groq",
    };
  } catch (error) {
    console.error("[ClauseWall] Groq translation failed:", error);
    return null;
  }
}

async function translateLongText(
  text: string, sourceLang: SupportedLanguage, targetLang: SupportedLanguage
): Promise<TranslationResult> {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    if ((currentChunk + "\n\n" + para).length > BHASHINI_MAX_TEXT_LENGTH) {
      if (currentChunk) chunks.push(currentChunk);
      if (para.length > BHASHINI_MAX_TEXT_LENGTH) {
        const sentences = para.split(/(?<=[।.!?])\s+/);
        let sentChunk = "";
        for (const sent of sentences) {
          if ((sentChunk + " " + sent).length > BHASHINI_MAX_TEXT_LENGTH) {
            if (sentChunk) chunks.push(sentChunk);
            sentChunk = sent;
          } else {
            sentChunk = sentChunk ? sentChunk + " " + sent : sent;
          }
        }
        if (sentChunk) chunks.push(sentChunk);
        currentChunk = "";
      } else {
        currentChunk = para;
      }
    } else {
      currentChunk = currentChunk ? currentChunk + "\n\n" + para : para;
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  const translatedChunks: string[] = [];
  let lastService: "bhashini" | "groq" = "bhashini";
  let totalConfidence = 0;

  for (const chunk of chunks) {
    const result = await translateText(chunk, sourceLang, targetLang);
    translatedChunks.push(result.translated_text);
    lastService = result.service_used;
    totalConfidence += result.confidence;
  }

  return {
    translated_text: translatedChunks.join("\n\n"),
    source_language: sourceLang,
    target_language: targetLang,
    confidence: chunks.length > 0 ? totalConfidence / chunks.length : 0,
    service_used: lastService,
  };
}

/**
 * Translate multiple texts at once.
 */
export async function translateBatch(
  texts: string[],
  sourceLang: SupportedLanguage,
  targetLang: SupportedLanguage
): Promise<TranslationResult[]> {
  const results: TranslationResult[] = [];
  for (const text of texts) {
    results.push(await translateText(text, sourceLang, targetLang));
  }
  return results;
}
