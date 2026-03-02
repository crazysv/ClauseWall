// ============================================
// PDF TEXT EXTRACTOR
// Extracts text content from uploaded PDF files
// ============================================

// Import type for the PDF data
interface PDFData {
  text: string;
  numpages: number;
  numrender: number;
  info: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
  version: string;
}

/**
 * Extract text from a PDF buffer
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import for pdf-parse (CommonJS module)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    
    const data: PDFData = await pdfParse(buffer);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error(
        "Could not extract text from PDF. The file might be scanned/image-based. Please try pasting the text manually."
      );
    }

    // Clean up extracted text
    let cleanText = data.text
      .replace(/\r\n/g, "\n")       // Normalize line breaks
      .replace(/\n{3,}/g, "\n\n")   // Remove excessive blank lines
      .replace(/\s{3,}/g, " ")      // Remove excessive spaces
      .trim();

    console.log(
      `[ClauseWall] Extracted ${cleanText.length} characters from PDF (${data.numpages} pages)`
    );

    return cleanText;
  } catch (error) {
    console.error("[ClauseWall] PDF parsing failed:", error);
    
    const errorMessage = (error as Error).message || "Unknown error";
    
    if (errorMessage.includes("scanned")) {
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
  // PDF files start with "%PDF-"
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data: PDFData = await pdfParse(buffer);
    
    return {
      pageCount: data.numpages,
      title: data.info?.Title as string | undefined,
      author: data.info?.Author as string | undefined,
    };
  } catch {
    return { pageCount: 0 };
  }
}