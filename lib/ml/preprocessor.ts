// ============================================
// TF-IDF PREPROCESSOR (Browser)
// Replicates Python scikit-learn TF-IDF exactly
// ============================================

/**
 * Clean text — must match Python clean_text() EXACTLY
 */
export function cleanText(text: string): string {
  if (!text) return "";
  let cleaned = text.toLowerCase();
  cleaned = cleaned.replace(/[^a-z0-9\s₹%]/g, " ");
  cleaned = cleaned.replace(/\s+/g, " ");
  return cleaned.trim();
}

/**
 * Tokenize text into words
 */
function tokenize(text: string): string[] {
  return text.split(/\s+/).filter((t) => t.length > 0);
}

/**
 * Generate unigrams and bigrams from tokens
 * Matches scikit-learn ngram_range=(1,2)
 */
function generateNgrams(tokens: string[]): string[] {
  const ngrams: string[] = [];

  // Unigrams
  for (const token of tokens) {
    ngrams.push(token);
  }

  // Bigrams
  for (let i = 0; i < tokens.length - 1; i++) {
    ngrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }

  return ngrams;
}

/**
 * Convert text to TF-IDF vector
 *
 * Replicates scikit-learn TfidfVectorizer with:
 * - ngram_range=(1,2)
 * - sublinear_tf=True
 * - L2 normalization
 *
 * @param text - Raw clause text
 * @param vocabulary - Word/ngram to index mapping from vocabulary.json
 * @param idfWeights - IDF weight array from idf_weights.json
 * @param numFeatures - Feature vector dimension (must match model input)
 * @returns Float32Array of TF-IDF features
 */
export function textToTfidfVector(
  text: string,
  vocabulary: Record<string, number>,
  idfWeights: number[],
  numFeatures: number
): Float32Array {
  // Step 1: Clean text (same as Python preprocessing)
  const cleaned = cleanText(text);

  // Step 2: Tokenize
  const tokens = tokenize(cleaned);

  // Step 3: Generate unigrams + bigrams
  const ngrams = generateNgrams(tokens);

  // Step 4: Count term frequency
  const termFrequency: Record<number, number> = {};
  for (const ngram of ngrams) {
    const index = vocabulary[ngram];
    if (index !== undefined) {
      termFrequency[index] = (termFrequency[index] || 0) + 1;
    }
  }

  // Step 5: Build TF-IDF vector with sublinear TF
  const vector = new Float32Array(numFeatures);
  for (const indexStr of Object.keys(termFrequency)) {
    const index = parseInt(indexStr);
    const tf = termFrequency[index];
    // Sublinear TF: 1 + log(tf)
    const sublinearTf = 1 + Math.log(tf);
    vector[index] = sublinearTf * idfWeights[index];
  }

  // Step 6: L2 normalize
  let norm = 0;
  for (let i = 0; i < vector.length; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= norm;
    }
  }

  return vector;
}