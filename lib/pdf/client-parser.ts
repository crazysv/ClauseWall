// ============================================
// CLIENT-SIDE PDF TEXT EXTRACTOR
// Uses pdfjs-dist in browser — enables ML scan for PDFs
// Works OFFLINE — worker served from /public
// Returns null on failure (graceful fallback)
// ============================================

import type { TextItem } from "pdfjs-dist/types/src/display/api";

let pdfjsLib: typeof import("pdfjs-dist") | null = null;
let isWorkerSetup = false;

async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib;

  pdfjsLib = await import("pdfjs-dist");

  if (!isWorkerSetup) {
    // Local worker — works offline
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    isWorkerSetup = true;
  }

  return pdfjsLib;
}

export async function extractTextFromPDFClient(
  file: File
): Promise<string | null> {
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

    if (fullText.length < 50) {
      console.warn(
        "[ClauseWall] Client PDF: text too short — likely scanned/image-based"
      );
      return null;
    }

    console.log(
      `[ClauseWall] Client PDF: extracted ${fullText.length} chars from ${pdf.numPages} pages`
    );

    return fullText;
  } catch (error) {
    console.error("[ClauseWall] Client PDF parsing failed:", error);
    return null;
  }
}