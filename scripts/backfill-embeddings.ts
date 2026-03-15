import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load .env.local
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("❌ .env.local not found");
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.substring(0, eqIndex).trim();
    const value = trimmed.substring(eqIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const hfKey = process.env.HUGGINGFACE_API_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}
if (!hfKey) {
  console.error("❌ Missing HUGGINGFACE_API_KEY");
  process.exit(1);
}

console.log("✅ Environment loaded");

const supabase = createClient(supabaseUrl, supabaseKey);

const EMBEDDING_DIM = 384;

/**
 * Generate embedding using HuggingFace Inference API
 * Uses the feature-extraction pipeline with the correct new endpoint
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  const truncated = text.substring(0, 1000);

  try {
    // New HF Inference Providers endpoint for feature-extraction
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfKey}`,
          "Content-Type": "application/json",
          "x-wait-for-model": "true",
        },
        body: JSON.stringify({
          inputs: truncated,
          options: { wait_for_model: true },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 503) {
        console.log("   Model loading, waiting 15s...");
        await new Promise((r) => setTimeout(r, 15000));
        return generateEmbedding(text);
      }

      const errorBody = await response.text().catch(() => "");
      
      // If router endpoint fails, try direct inference endpoint
      if (response.status === 400 || response.status === 410) {
        return await generateEmbeddingFallback(truncated);
      }

      console.error(`   HF error: ${response.status} ${errorBody.substring(0, 120)}`);
      return null;
    }

    const result = await response.json();
    return parseEmbeddingResponse(result);
  } catch (err) {
    console.error(`   Fetch error: ${(err as Error).message}`);
    return null;
  }
}

/**
 * Fallback: Use HF dedicated TEI endpoint format
 */
async function generateEmbeddingFallback(text: string): Promise<number[] | null> {
  try {
    // Try with explicit pipeline task
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
        }),
      }
    );

    if (!response.ok) {
      // Last resort: try BAAI/bge-small-en-v1.5 (also 384 dim)
      return await generateEmbeddingLastResort(text);
    }

    const result = await response.json();
    return parseEmbeddingResponse(result);
  } catch {
    return await generateEmbeddingLastResort(text);
  }
}

/**
 * Last resort: Use BAAI/bge-small-en-v1.5 (384 dim, widely available)
 */
async function generateEmbeddingLastResort(text: string): Promise<number[] | null> {
  try {
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfKey}`,
          "Content-Type": "application/json",
          "x-wait-for-model": "true",
        },
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text().catch(() => "");
      console.error(`   Last resort error: ${response.status} ${err.substring(0, 120)}`);
      return null;
    }

    const result = await response.json();
    return parseEmbeddingResponse(result);
  } catch (err) {
    console.error(`   Last resort fetch error: ${(err as Error).message}`);
    return null;
  }
}

/**
 * Parse various HF response formats into a flat embedding array
 */
function parseEmbeddingResponse(result: unknown): number[] | null {
  // Format 1: Direct array of numbers [0.1, 0.2, ...]
  if (Array.isArray(result) && typeof result[0] === "number") {
    return normalizeEmbedding(result);
  }

  // Format 2: Nested array [[0.1, 0.2, ...]] (single sentence)
  if (
    Array.isArray(result) &&
    Array.isArray(result[0]) &&
    typeof result[0][0] === "number"
  ) {
    // Check if it's token-level embeddings (many arrays) or sentence embedding (one array)
    if (result.length === 1) {
      // Single sentence embedding
      return normalizeEmbedding(result[0]);
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
    return normalizeEmbedding(averaged);
  }

  // Format 3: OpenAI-style { data: [{ embedding: [...] }] }
  const obj = result as Record<string, unknown>;
  if (obj.data && Array.isArray(obj.data)) {
    const first = (obj.data as Record<string, unknown>[])[0];
    if (first?.embedding && Array.isArray(first.embedding)) {
      return normalizeEmbedding(first.embedding as number[]);
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

async function backfillEmbeddings() {
  console.log("\n🚀 Starting embedding backfill...\n");

  // Test embedding
  console.log("🧪 Testing embedding generation...");
  const testEmb = await generateEmbedding(
    "The licensee shall deposit a security deposit of ten months rent which shall be refundable upon termination."
  );

  if (!testEmb) {
    console.error("❌ Embedding test failed. Cannot proceed.");
    console.log("\n💡 Debug steps:");
    console.log("   1. Check your HUGGINGFACE_API_KEY is valid");
    console.log("   2. Ensure 'Make calls to Inference Providers' permission is enabled");
    console.log("   3. Try visiting: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2");
    process.exit(1);
  }
  console.log(`✅ Test embedding: ${testEmb.length} dimensions\n`);

  const { data: clauses, error } = await supabase
    .from("community_clauses")
    .select("id, anonymized_text")
    .is("embedding", null);

  if (error) {
    console.error("❌ Error fetching clauses:", error);
    return;
  }

  if (!clauses || clauses.length === 0) {
    console.log("✅ No clauses need embedding. All done!");
    return;
  }

  console.log(`📋 Found ${clauses.length} clauses without embeddings\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < clauses.length; i++) {
    const clause = clauses[i];
    process.stdout.write(
      `[${i + 1}/${clauses.length}] ${clause.id.substring(0, 8)}... `
    );

    try {
      const embedding = await generateEmbedding(clause.anonymized_text);

      if (embedding && embedding.length === EMBEDDING_DIM) {
        const embeddingStr = `[${embedding.join(",")}]`;

        const { error: updateError } = await supabase
          .from("community_clauses")
          .update({ embedding: embeddingStr })
          .eq("id", clause.id);

        if (updateError) {
          console.log(`❌ DB: ${updateError.message}`);
          failed++;
        } else {
          console.log("✅");
          success++;
        }
      } else {
        console.log(`❌ Bad dims (${embedding?.length || 0})`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ ${(err as Error).message}`);
      failed++;
    }

    // Rate limit: 300ms between requests
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n🏁 Backfill complete!`);
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Total: ${clauses.length}`);
}

backfillEmbeddings();