// ============================================
// ML MODEL LOADER (Singleton)
// Loads TF.js model once, caches in memory
// ============================================

import type { ModelStatus, ModelConfig } from "./types";

// We'll use 'any' for TF.js types to avoid complex typing issues
// TF.js types are challenging with dynamic imports

// Singleton state
let modelInstance: any = null;
let vocabulary: Record<string, number> | null = null;
let idfWeights: number[] | null = null;
let labelMap: Record<string, string> | null = null;
let modelConfig: ModelConfig | null = null;
let modelStatus: ModelStatus = "idle";
let loadPromise: Promise<boolean> | null = null;
let tfInstance: any = null;

/**
 * Get current model loading status
 */
export function getModelStatus(): ModelStatus {
  return modelStatus;
}

/**
 * Get model config (after loading)
 */
export function getModelConfig(): ModelConfig | null {
  return modelConfig;
}

/**
 * Get number of features model expects
 */
export function getFeatureCount(): number {
  return modelConfig?.max_features || 3061;
}

/**
 * Get vocabulary for preprocessing
 */
export function getVocabulary(): Record<string, number> | null {
  return vocabulary;
}

/**
 * Get IDF weights for preprocessing
 */
export function getIdfWeights(): number[] | null {
  return idfWeights;
}

/**
 * Get label map for decoding predictions
 */
export function getLabelMap(): Record<string, string> | null {
  return labelMap;
}

/**
 * Get TensorFlow instance
 */
export function getTf(): any {
  return tfInstance;
}

/**
 * Get loaded model instance
 */
export function getModel(): any {
  return modelInstance;
}

/**
 * Check if running in browser
 */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Load a JSON file from public/ml/
 */
async function loadJSON<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Load the ML model and all supporting files
 * Singleton — only loads once, subsequent calls return cached promise
 */
export async function loadModel(): Promise<boolean> {
  // Server-side: skip
  if (!isBrowser()) {
    return false;
  }

  // Already loaded
  if (modelStatus === "ready" && modelInstance) {
    return true;
  }

  // Already loading — return existing promise
  if (loadPromise) {
    return loadPromise;
  }

  // Start loading
  loadPromise = (async () => {
    try {
      modelStatus = "loading";
      console.log("[ClauseWall ML] Loading model...");

      const startTime = performance.now();

      // Load TensorFlow.js dynamically (browser only)
      const tf = await import("@tensorflow/tfjs");
      tfInstance = tf;

      // Set backend to CPU (most compatible, fast enough for our model)
      await tf.setBackend("cpu");
      await tf.ready();
      console.log("[ClauseWall ML] TF.js ready, backend:", tf.getBackend());

      // Load all files in parallel
      const [model, vocab, idf, labels, config] = await Promise.all([
        tf.loadLayersModel("/ml/model.json"),
        loadJSON<Record<string, number>>("/ml/vocabulary.json"),
        loadJSON<number[]>("/ml/idf_weights.json"),
        loadJSON<Record<string, string>>("/ml/label_map.json"),
        loadJSON<ModelConfig>("/ml/config.json"),
      ]);

      // Cache everything
      modelInstance = model;
      vocabulary = vocab;
      idfWeights = idf;
      labelMap = labels;
      modelConfig = config;

      const loadTime = performance.now() - startTime;
      modelStatus = "ready";
      console.log(
        `[ClauseWall ML] ✅ Model loaded in ${loadTime.toFixed(0)}ms | ` +
          `Features: ${config.max_features} | ` +
          `Vocab: ${Object.keys(vocab).length} terms | ` +
          `Accuracy: ${(config.test_accuracy * 100).toFixed(1)}%`
      );

      return true;
    } catch (error) {
      modelStatus = "error";
      console.error("[ClauseWall ML] ❌ Model load failed:", error);
      loadPromise = null; // Allow retry
      return false;
    }
  })();

  return loadPromise;
}

/**
 * Warm up model with a dummy prediction
 * First prediction is slower due to JIT compilation
 */
export async function warmUpModel(): Promise<void> {
  if (!modelInstance || !tfInstance) return;

  try {
    const tf = tfInstance;
    const numFeatures = getFeatureCount();
    const dummyInput = tf.zeros([1, numFeatures]);
    const result = modelInstance.predict(dummyInput);
    result.dispose();
    dummyInput.dispose();
    console.log("[ClauseWall ML] Model warmed up");
  } catch (error) {
    console.warn("[ClauseWall ML] Warm-up failed:", error);
  }
}