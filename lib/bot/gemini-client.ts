// ============================================
// GEMINI API CLIENT WITH KEY ROTATION
// Used for image/photo OCR analysis
// Rotates between multiple API keys on failure
// ============================================

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// ============================================
// API KEY ROTATION SETUP
// ============================================

const API_KEYS = [
  process.env.GOOGLE_AI_API_KEY_1,
  process.env.GOOGLE_AI_API_KEY_2,
  process.env.GOOGLE_AI_API_KEY_3,
  process.env.GOOGLE_AI_API_KEY, // Fallback to single key
].filter(Boolean) as string[];

if (API_KEYS.length === 0) {
  console.warn("[ClauseWall] WARNING: No Gemini API keys found");
}

// Track which key we're using
let currentKeyIndex = 0;

// Track exhausted keys
const exhaustedKeys = new Set<number>();
const KEY_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown

/**
 * Get current API key
 */
function getApiKey(): string {
  if (API_KEYS.length === 0) {
    throw new Error("GOOGLE_AI_API_KEY not configured");
  }

  // Find a non-exhausted key
  let attempts = 0;
  while (exhaustedKeys.has(currentKeyIndex) && attempts < API_KEYS.length) {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    attempts++;
  }

  // If all keys exhausted, reset and try anyway
  if (attempts >= API_KEYS.length) {
    console.log("[ClauseWall] Gemini: All keys exhausted, resetting...");
    exhaustedKeys.clear();
  }

  return API_KEYS[currentKeyIndex];
}

/**
 * Mark current key as exhausted and switch to next
 */
function switchToNextKey(): boolean {
  console.log(`[ClauseWall] Gemini: Key ${currentKeyIndex + 1} rate limited, switching...`);

  exhaustedKeys.add(currentKeyIndex);

  // Schedule key recovery
  setTimeout(() => {
    exhaustedKeys.delete(currentKeyIndex);
    console.log(`[ClauseWall] Gemini: Key ${currentKeyIndex + 1} cooldown complete`);
  }, KEY_COOLDOWN_MS);

  // Find next available key
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;

  // Check if we've tried all keys
  if (exhaustedKeys.size >= API_KEYS.length) {
    console.error("[ClauseWall] Gemini: All API keys exhausted!");
    return false;
  }

  console.log(`[ClauseWall] Gemini: Switched to Key ${currentKeyIndex + 1}`);
  return true;
}

// ---- TYPES ----

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
    finishReason: string;
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

// ---- IMAGE ANALYSIS WITH RETRY & ROTATION ----

export async function callGeminiVision(
  prompt: string,
  imageBase64: string,
  mimeType: string = "image/jpeg",
  options?: {
    temperature?: number;
    maxTokens?: number;
    retries?: number;
  }
): Promise<string> {
  const { temperature = 0.1, maxTokens = 2048, retries = 3 } = options || {};

  let lastError: Error | null = null;
  let totalAttempts = 0;
  const maxTotalAttempts = retries * API_KEYS.length;

  while (totalAttempts < maxTotalAttempts) {
    totalAttempts++;

    try {
      const apiKey = getApiKey();
      const url = `${BASE_URL}/gemini-2.5-flash:generateContent?key=${apiKey}`;

      console.log(`[ClauseWall] Gemini Vision: Using Key ${currentKeyIndex + 1} (attempt ${totalAttempts}/${maxTotalAttempts})`);

      const parts: GeminiPart[] = [
        { text: prompt },
        {
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        },
      ];

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        responseMimeType: "application/json",
        thinkingConfig: {
        thinkingBudget: 0,
        },
        },
        }),
      });

      // Handle rate limit (429)
      if (response.status === 429) {
        console.log(`[ClauseWall] Gemini: Rate limited (429)`);
        const switched = switchToNextKey();
        if (!switched) {
          // All keys exhausted — wait and retry
          console.log("[ClauseWall] Gemini: All keys exhausted, waiting 30s...");
          await new Promise((resolve) => setTimeout(resolve, 30000));
          exhaustedKeys.clear();
        }
        continue;
      }

      // Handle other errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ClauseWall] Gemini error: ${response.status}`, errorText.substring(0, 200));

        // Invalid API key — switch immediately
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          if (!switchToNextKey()) {
            throw new Error("All Gemini API keys are invalid");
          }
          continue;
        }

        // Server error — retry with backoff
        if (response.status >= 500) {
          const delay = Math.pow(2, totalAttempts) * 1000;
          console.log(`[ClauseWall] Gemini: Server error, retrying in ${delay / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw new Error(`Gemini API failed: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();

      if (data.error) {
        throw new Error(`Gemini error: ${data.error.message}`);
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Empty response from Gemini Vision");
      }

      return text;
    } catch (error: any) {
      lastError = error;
      console.error(`[ClauseWall] Gemini attempt ${totalAttempts} failed:`, error.message);

      // Retry with backoff
      if (totalAttempts < maxTotalAttempts) {
        const delay = Math.pow(2, totalAttempts % retries) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Gemini Vision failed after ${totalAttempts} attempts: ${lastError?.message}`
  );
}

/**
 * Get current API status (for debugging)
 */
export function getGeminiStatus() {
  return {
    totalKeys: API_KEYS.length,
    currentKeyIndex: currentKeyIndex + 1,
    exhaustedKeys: Array.from(exhaustedKeys).map((i) => i + 1),
    availableKeys: API_KEYS.length - exhaustedKeys.size,
  };
}

console.log("[ClauseWall] Gemini keys loaded:", API_KEYS.length);
console.log("[ClauseWall] Image analyze: Using Gemini 2.5 Flash...");