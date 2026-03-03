// ============================================
// GROQ API CLIENT WITH KEY ROTATION
// Automatically switches API keys when rate limited
// ============================================

import Groq from "groq-sdk";

// ============================================
// API KEY ROTATION SETUP
// ============================================

const API_KEYS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  // Add more keys here if you have them:
  // process.env.GROQ_API_KEY_3,
].filter(Boolean) as string[];

// Fallback to old single key if new ones not set
if (API_KEYS.length === 0 && process.env.GROQ_API_KEY) {
  API_KEYS.push(process.env.GROQ_API_KEY);
}

if (API_KEYS.length === 0) {
  console.warn("WARNING: No GROQ API keys found in environment variables");
}

// Track which key we're currently using
let currentKeyIndex = 0;

// Track exhausted keys (reset after some time)
const exhaustedKeys = new Set<number>();
const KEY_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown before retrying exhausted key

/**
 * Get the current Groq client instance
 */
function getGroqClient(): Groq {
  // Find a non-exhausted key
  let attempts = 0;
  while (exhaustedKeys.has(currentKeyIndex) && attempts < API_KEYS.length) {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    attempts++;
  }

  // If all keys exhausted, reset and try anyway
  if (attempts >= API_KEYS.length) {
    console.log("[ClauseWall] All API keys exhausted, resetting...");
    exhaustedKeys.clear();
  }

  return new Groq({
    apiKey: API_KEYS[currentKeyIndex] || "",
  });
}

/**
 * Mark current key as exhausted and switch to next
 */
function switchToNextKey(): boolean {
  console.log(`[ClauseWall] Key ${currentKeyIndex + 1} rate limited, switching...`);
  
  exhaustedKeys.add(currentKeyIndex);
  
  // Schedule key recovery
  setTimeout(() => {
    exhaustedKeys.delete(currentKeyIndex);
    console.log(`[ClauseWall] Key ${currentKeyIndex + 1} cooldown complete, available again`);
  }, KEY_COOLDOWN_MS);

  // Find next available key
  const previousIndex = currentKeyIndex;
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;

  // Check if we've tried all keys
  if (exhaustedKeys.size >= API_KEYS.length) {
    console.error("[ClauseWall] All API keys exhausted!");
    return false;
  }

  console.log(`[ClauseWall] Switched to Key ${currentKeyIndex + 1}`);
  return true;
}

// ============================================
// PUBLIC API
// ============================================

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Call Groq API with automatic key rotation and retries
 */
export async function callGroq(
  messages: GroqMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    retries?: number;
  }
): Promise<string> {
  const {
    temperature = 0.1,
    maxTokens = 4096,
    retries = 3,
  } = options || {};

  let lastError: Error | null = null;
  let totalAttempts = 0;
  const maxTotalAttempts = retries * API_KEYS.length; // Try each key multiple times

  while (totalAttempts < maxTotalAttempts) {
    totalAttempts++;
    
    try {
      const groq = getGroqClient();
      
      console.log(`[ClauseWall] API call using Key ${currentKeyIndex + 1} (attempt ${totalAttempts}/${maxTotalAttempts})`);

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error("Empty response from Groq API");
      }

      // Validate it's parseable JSON
      try {
        JSON.parse(content);
      } catch {
        throw new Error(`Groq returned invalid JSON: ${content.substring(0, 200)}`);
      }

      return content;
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || String(error);
      const statusCode = error?.status || error?.statusCode;

      console.error(
        `[ClauseWall] Groq API attempt ${totalAttempts}/${maxTotalAttempts} failed:`,
        statusCode,
        errorMessage.substring(0, 200)
      );

      // Handle specific error types
      if (errorMessage.includes("Invalid API Key") || errorMessage.includes("API key")) {
        console.error(`[ClauseWall] Key ${currentKeyIndex + 1} is invalid!`);
        // Mark this key as permanently bad and switch
        if (!switchToNextKey()) {
          throw new Error("All Groq API keys are invalid. Please check your keys.");
        }
        continue;
      }

      // Rate limit error (429) — switch to next key immediately
      if (statusCode === 429 || errorMessage.includes("rate_limit") || errorMessage.includes("Rate limit")) {
        const switched = switchToNextKey();
        if (!switched) {
          // All keys exhausted — wait and retry
          const waitTime = extractWaitTime(errorMessage);
          console.log(`[ClauseWall] All keys exhausted. Waiting ${waitTime}s...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
          exhaustedKeys.clear(); // Reset and try again
        }
        continue;
      }

      // Server error (503, 500) — retry with backoff
      if (statusCode === 503 || statusCode === 500) {
        const delay = Math.pow(2, totalAttempts) * 1000;
        console.log(`[ClauseWall] Server error, retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Other errors — standard retry with backoff
      if (totalAttempts < maxTotalAttempts) {
        const delay = Math.pow(2, totalAttempts % retries) * 1000;
        console.log(`[ClauseWall] Retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Groq API failed after ${totalAttempts} attempts across ${API_KEYS.length} keys: ${lastError?.message}`
  );
}

/**
 * Extract wait time from rate limit error message
 */
function extractWaitTime(errorMessage: string): number {
  // Try to extract "Please try again in Xm Ys" or "in Xs"
  const match = errorMessage.match(/try again in (\d+)m?\s*(\d+)?s?/i);
  if (match) {
    const minutes = parseInt(match[1]) || 0;
    const seconds = parseInt(match[2]) || 0;
    return minutes * 60 + seconds;
  }
  // Default wait time if can't parse
  return 30;
}

/**
 * Call Groq with streaming (for real-time responses)
 */
export async function callGroqStreaming(
  messages: GroqMessage[],
  onChunk: (chunk: string) => void
): Promise<string> {
  try {
    const groq = getGroqClient();
    
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.1,
      max_tokens: 4096,
      stream: true,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullResponse += content;
      onChunk(content);
    }

    return fullResponse;
  } catch (error: any) {
    // If rate limited on streaming, switch key for next call
    if (error?.status === 429) {
      switchToNextKey();
    }
    console.error("[ClauseWall] Groq streaming failed:", error);
    throw new Error(`Streaming failed: ${(error as Error).message}`);
  }
}

/**
 * Get current API status (for debugging)
 */
export function getApiStatus() {
  return {
    totalKeys: API_KEYS.length,
    currentKeyIndex: currentKeyIndex + 1,
    exhaustedKeys: Array.from(exhaustedKeys).map((i) => i + 1),
    availableKeys: API_KEYS.length - exhaustedKeys.size,
  };
}