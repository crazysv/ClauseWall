// ============================================
// PDF TEXT EXTRACTOR
// Uses unpdf — lightweight, no Canvas/Worker issues
// ============================================

import { extractText } from "unpdf";

/**
 * Extract text from a PDF buffer
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(buffer);

    const { text, totalPages } = await extractText(uint8Array, {
      mergePages: true,
    });

    if (!text || text.trim().length === 0) {
      throw new Error(
        "Could not extract text from PDF. The file might be scanned/image-based. Please try pasting the text manually."
      );
    }

    // Clean up extracted text
    const cleanText = text
      .replace(/\r\n/g, "\n")       // Normalize line breaks
      .replace(/\n{3,}/g, "\n\n")   // Remove excessive blank lines
      .replace(/\s{3,}/g, " ")      // Remove excessive spaces
      .trim();


    return cleanText;
  } catch (error) {
    console.error("[ClauseWall] PDF parsing failed:", error);

    const errorMessage = (error as Error).message || "Unknown error";

    if (
      errorMessage.includes("scanned") ||
      errorMessage.includes("image-based")
    ) {
      throw error;
    }

    throw new Error(
      `Failed to parse PDF: ${errorMessage}. Please try pasting the text directly.`
    );
  }
}

/**
 * Check if a file is a valid PDF
 */
export function isPDF(buffer: Buffer): boolean {
  const header = buffer.slice(0, 5).toString("ascii");
  return header === "%PDF-";
}

/**
 * Get basic PDF info without full parsing
 */
export async function getPDFInfo(buffer: Buffer): Promise<{
  pageCount: number;
  title?: string;
  author?: string;
}> {
  try {
    const uint8Array = new Uint8Array(buffer);
    const { totalPages } = await extractText(uint8Array, {
      mergePages: true,
    });

    return {
      pageCount: totalPages,
    };
  } catch {
    return { pageCount: 0 };
  }
}