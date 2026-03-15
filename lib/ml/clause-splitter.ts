// ============================================
// REGEX-BASED CLAUSE SPLITTER
// Splits contract text into clauses WITHOUT AI
// Zero latency, works offline
// ============================================

export interface SplitClause {
  text: string;
  index: number;
}

/**
 * Split contract text into individual clauses using regex patterns
 * Designed for Indian legal documents
 */
export function splitIntoClauses(documentText: string): SplitClause[] {
  if (!documentText || documentText.trim().length < 20) {
    return [];
  }

  const text = documentText.trim();
  let clauses: string[] = [];

  // Pattern 1: Numbered sections like "1.", "2.", "3." at start of line
  const numberedPattern = /(?:^|\n)\s*\d{1,3}\s*[.)]\s+/;

  // Pattern 2: Lettered sections like "(a)", "(b)"
  const letteredPattern = /(?:^|\n)\s*\([a-z]\)\s+/;

  // Pattern 3: Section/Clause headers like "CLAUSE 1:", "Section 2:"
  const headerPattern =
    /(?:^|\n)\s*(?:clause|section|article|schedule|annexure)\s+\d+/i;

  // Pattern 4: ALL-CAPS titled sections like "RENT:", "DEPOSIT:", "TERMINATION:"
  const capsHeaderPattern =
    /(?:^|\n)\s*[A-Z][A-Z\s]{2,30}(?::|\.|-)\s*/;

  // Try numbered splitting first (most common in Indian contracts)
  const numberedSplit = text.split(/(?=(?:^|\n)\s*\d{1,3}\s*[.)]\s+)/m);
  const numberedFiltered = numberedSplit.filter(
    (s) => s.trim().length > 20
  );

  if (numberedFiltered.length >= 3) {
    clauses = numberedFiltered;
  } else {
    // Try CAPS header splitting
    const capsSplit = text.split(
      /(?=(?:^|\n)\s*[A-Z][A-Z\s]{2,30}(?::|\.|-)\s*)/m
    );
    const capsFiltered = capsSplit.filter((s) => s.trim().length > 20);

    if (capsFiltered.length >= 3) {
      clauses = capsFiltered;
    } else {
      // Try header pattern
      const headerSplit = text.split(
        /(?=(?:^|\n)\s*(?:clause|section|article)\s+\d+)/im
      );
      const headerFiltered = headerSplit.filter(
        (s) => s.trim().length > 20
      );

      if (headerFiltered.length >= 3) {
        clauses = headerFiltered;
      } else {
        // Fallback: split by double newlines (paragraphs)
        const paragraphSplit = text.split(/\n\s*\n/);
        clauses = paragraphSplit.filter((s) => s.trim().length > 20);
      }
    }
  }

  // If we still have very few clauses, split long ones by sentences
  if (clauses.length < 3 && text.length > 200) {
    const sentenceSplit = text.split(/(?<=[.!?])\s+(?=[A-Z])/);
    const merged: string[] = [];
    let current = "";

    for (const sentence of sentenceSplit) {
      current += (current ? " " : "") + sentence;
      if (current.length > 100) {
        merged.push(current);
        current = "";
      }
    }
    if (current.length > 20) {
      merged.push(current);
    }

    if (merged.length > clauses.length) {
      clauses = merged;
    }
  }

  // Clean and index
  return clauses
    .map((text, index) => ({
      text: text.trim(),
      index,
    }))
    .filter((c) => c.text.length > 20)
    .slice(0, 50); // Cap at 50 clauses for performance
}