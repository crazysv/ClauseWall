// ============================================
// CLAUSE EMBEDDING GENERATOR
// Uses HuggingFace Inference API (free)
// Model: all-MiniLM-L6-v2 (384-dim vectors)
// Fallback: BAAI/bge-small-en-v1.5 (same 384-dim)
// ============================================

const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const HF_FALLBACK_MODEL = "BAAI/bge-small-en-v1.5";
const EMBEDDING_DIM = 384;

// Cache to avoid re-embedding identical text in same request
const embeddingCache = new Map<string, number[]>();
const MAX_CACHE_SIZE = 500;

/**
 * Generate embedding for a single text using HuggingFace Inference API
 */
export async function generateEmbedding(
  text: string
): Promise<number[] | null> {
  // Check cache first
  const cacheKey = text.substring(0, 200);
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!;
  }

  const hfToken = process.env.HUGGINGFACE_API_KEY;

  if (!hfToken) {
    console.warn("[Embedder] No HUGGINGFACE_API_KEY set. Skipping embedding.");
    return null;
  }

  try {
    const embedding = await embedWithFallbacks(text, hfToken);

    if (!embedding) {
      return null;
    }

    // Normalize to exact dimension
    const normalized = normalizeEmbedding(embedding);

    // Cache it
    if (embeddingCache.size >= MAX_CACHE_SIZE) {
      const firstKey = embeddingCache.keys().next().value;
      if (firstKey) embeddingCache.delete(firstKey);
    }
    embeddingCache.set(cacheKey, normalized);

    return normalized;
  } catch (error) {
    console.error("[Embedder] Failed to generate embedding:", error);
    return null;
  }
}

/**
 * Try multiple endpoints with fallbacks
 */
async function embedWithFallbacks(
  text: string,
  token: string
): Promise<number[] | null> {
  const truncated = text.substring(0, 1000);

  // Try 1: Primary model via router
  try {
    const result = await callHFEndpoint(
      `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`,
      truncated,
      token
    );
    if (result) return result;
  } catch {
    // Continue to fallback
  }

  // Try 2: Pipeline-specific URL
  try {
    const result = await callHFEndpoint(
      `https://router.huggingface.co/hf-inference/pipeline/feature-extraction/${HF_MODEL}`,
      truncated,
      token
    );
    if (result) return result;
  } catch {
    // Continue to fallback
  }

  // Try 3: Fallback model (BAAI/bge-small-en-v1.5)
  try {
    const result = await callHFEndpoint(
      `https://router.huggingface.co/hf-inference/models/${HF_FALLBACK_MODEL}`,
      truncated,
      token
    );
    if (result) return result;
  } catch {
    // All failed
  }

  console.error("[Embedder] All endpoints failed");
  return null;
}

/**
 * Call a HuggingFace endpoint and parse the response
 */
async function callHFEndpoint(
  url: string,
  text: string,
  token: string
): Promise<number[] | null> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-wait-for-model": "true",
    },
    body: JSON.stringify({
      inputs: text,
      options: { wait_for_model: true },
    }),
  });

  if (!response.ok) {
    if (response.status === 503) {
      // Model loading — wait and retry once

      await new Promise((r) => setTimeout(r, 10000));
      return callHFEndpoint(url, text, token);
    }
    return null;
  }

  const result = await response.json();
  return parseEmbeddingResponse(result);
}

/**
 * Parse various HF response formats into a flat embedding array
 */
function parseEmbeddingResponse(result: unknown): number[] | null {
  // Format 1: Direct array of numbers [0.1, 0.2, ...]
  if (Array.isArray(result) && typeof result[0] === "number") {
    return result;
  }

  // Format 2: Nested array [[0.1, 0.2, ...]] (single sentence)
  if (
    Array.isArray(result) &&
    Array.isArray(result[0]) &&
    typeof result[0][0] === "number"
  ) {
    if (result.length === 1) {
      // Single sentence embedding
      return result[0];
    }

    // Token-level: mean-pool to get sentence embedding
    const dim = result[0].length;
    const averaged = new Array(dim).fill(0);
    for (const token of result) {
      for (let i = 0; i < dim; i++) {
        averaged[i] += (token as number[])[i];
      }
    }
    for (let i = 0; i < dim; i++) {
      averaged[i] /= result.length;
    }
    return averaged;
  }

  // Format 3: OpenAI-style { data: [{ embedding: [...] }] }
  const obj = result as Record<string, unknown>;
  if (obj.data && Array.isArray(obj.data)) {
    const first = (obj.data as Record<string, unknown>[])[0];
    if (first?.embedding && Array.isArray(first.embedding)) {
      return first.embedding as number[];
    }
  }

  return null;
}

/**
 * Ensure embedding is exactly EMBEDDING_DIM dimensions
 */
function normalizeEmbedding(embedding: number[]): number[] {
  if (embedding.length === EMBEDDING_DIM) return embedding;
  if (embedding.length > EMBEDDING_DIM) return embedding.slice(0, EMBEDDING_DIM);
  // Pad with zeros
  const padded = [...embedding];
  while (padded.length < EMBEDDING_DIM) padded.push(0);
  return padded;
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<(number[] | null)[]> {
  const hfToken = process.env.HUGGINGFACE_API_KEY;

  if (!hfToken) {
    console.warn("[Embedder] No HUGGINGFACE_API_KEY. Skipping batch embed.");
    return texts.map(() => null);
  }

  // For now, process individually (more reliable with fallbacks)
  // Batch endpoint has different response format issues
  return Promise.all(texts.map((t) => generateEmbedding(t)));
}

/**
 * Format embedding for Supabase pgvector insertion
 * pgvector expects: '[0.1,0.2,0.3,...]'
 */
export function formatEmbeddingForPgvector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}