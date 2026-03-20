// ============================================
// CLIENT-SIDE PDF TEXT EXTRACTOR
// Uses pdfjs-dist for text PDFs
// Falls back to Tesseract.js OCR for scanned PDFs
// Works OFFLINE — worker served from /public
// ============================================

import type { TextItem } from "pdfjs-dist/types/src/display/api";
import type { OCRProgressCallback } from "@/lib/ocr";

let pdfjsLib: typeof import("pdfjs-dist") | null = null;
let isWorkerSetup = false;

async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib;

  pdfjsLib = await import("pdfjs-dist");

  if (!isWorkerSetup) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    isWorkerSetup = true;
  }

  return pdfjsLib;
}

/**
 * Extract text from PDF — tries text layer first, falls back to OCR
 */
export async function extractTextFromPDFClient(
  file: File,
  onProgress?: OCRProgressCallback
): Promise<string | null> {
  try {
    // Step 1: Try text layer extraction (fast, works for digital PDFs)
    const text = await extractTextLayer(file);

    if (text && text.length >= 50) {
      console.log(
        `[ClauseWall] PDF text layer: ${text.length} chars`
      );
      return text;
    }

    // Step 2: Text layer empty/short — likely scanned PDF, try OCR
    console.log(
      "[ClauseWall] PDF text layer empty — attempting OCR..."
    );
    onProgress?.(5, "Scanned PDF detected. Starting OCR...");

    const { ocrPDF } = await import("@/lib/ocr");
    const ocrText = await ocrPDF(file, onProgress);

    if (ocrText) {
      console.log(
        `[ClauseWall] PDF OCR: ${ocrText.length} chars`
      );
      return ocrText;
    }

    console.warn("[ClauseWall] Both text extraction and OCR failed");
    return null;
  } catch (error) {
    console.error("[ClauseWall] Client PDF parsing failed:", error);
    return null;
  }
}

/**
 * Extract text from PDF text layer only (no OCR)
 */
async function extractTextLayer(file: File): Promise<string | null> {
  try {
    const pdfjs = await getPdfJs();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
    }).promise;

    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item): item is TextItem => "str" in item)
        .map((item) => item.str)
        .join(" ");
      pages.push(pageText);
    }

    const fullText = pages
      .join("\n\n")
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\s{3,}/g, " ")
      .trim();

    return fullText.length >= 50 ? fullText : null;
  } catch {
    return null;
  }
}