// ============================================
// CLIENT-SIDE OCR ENGINE
// Uses Tesseract.js (WASM) for scanned PDFs/images
// Runs entirely in browser — no server upload
// Supports: English + Hindi
// ============================================

import type { Worker as TesseractWorker } from "tesseract.js";

let worker: TesseractWorker | null = null;
let isInitializing = false;
let isReady = false;

export type OCRStatus = "idle" | "loading" | "ready" | "processing" | "error";
export type OCRProgressCallback = (progress: number, status: string) => void;

/**
 * Initialize Tesseract worker with English + Hindi
 */
export async function initOCR(
  onProgress?: OCRProgressCallback
): Promise<boolean> {
  if (isReady && worker) return true;
  if (isInitializing) return false;

  isInitializing = true;

  try {
    const Tesseract = await import("tesseract.js");

    onProgress?.(10, "Loading OCR engine...");

    worker = await Tesseract.createWorker("eng+hin", undefined, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          const pct = Math.round((m.progress || 0) * 100);
          onProgress?.(30 + pct * 0.6, `OCR processing: ${pct}%`);
        } else if (m.status === "loading language traineddata") {
          onProgress?.(20, "Loading language data...");
        }
      },
    });

    isReady = true;
    isInitializing = false;
    onProgress?.(100, "OCR ready");

    console.log("[ClauseWall OCR] ✅ Tesseract worker ready (eng+hin)");
    return true;
  } catch (error) {
    console.error("[ClauseWall OCR] Failed to initialize:", error);
    isInitializing = false;
    isReady = false;
    return false;
  }
}

/**
 * OCR a single image (File, Blob, or canvas element)
 */
export async function ocrImage(
  image: File | Blob | HTMLCanvasElement,
  onProgress?: OCRProgressCallback
): Promise<string | null> {
  if (!worker || !isReady) {
    const initialized = await initOCR(onProgress);
    if (!initialized) return null;
  }

  try {
    onProgress?.(30, "Reading text from image...");

    const result = await worker!.recognize(image);
    const text = result.data.text.trim();

    if (text.length < 20) {
      console.warn("[ClauseWall OCR] Too little text extracted:", text.length);
      return null;
    }

    console.log(`[ClauseWall OCR] Extracted ${text.length} chars`);
    onProgress?.(100, "OCR complete");

    return text;
  } catch (error) {
    console.error("[ClauseWall OCR] Recognition failed:", error);
    return null;
  }
}

/**
 * OCR all pages of a scanned PDF
 * Renders each page to canvas, then runs OCR
 */
export async function ocrPDF(
  file: File,
  onProgress?: OCRProgressCallback
): Promise<string | null> {
  try {
    onProgress?.(5, "Preparing PDF for OCR...");

    // Load PDF.js
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
    }).promise;

    onProgress?.(10, `Found ${pdf.numPages} pages. Starting OCR...`);

    // Init Tesseract
    const initialized = await initOCR(onProgress);
    if (!initialized) return null;

    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const pagePct = Math.round(10 + (i / pdf.numPages) * 80);
      onProgress?.(pagePct, `OCR page ${i}/${pdf.numPages}...`);

      const page = await pdf.getPage(i);

      // Render page to canvas at 2x for better OCR accuracy
      const scale = 2.0;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      await page.render({
        canvasContext: ctx,
        viewport,
        canvas: canvas,
      }).promise;

      // OCR the canvas
      const pageText = await ocrImage(canvas);
      if (pageText) {
        pages.push(pageText);
      }

      // Cleanup
      canvas.width = 0;
      canvas.height = 0;
    }

    const fullText = pages
      .join("\n\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\s{3,}/g, " ")
      .trim();

    if (fullText.length < 50) {
      console.warn("[ClauseWall OCR] PDF OCR result too short");
      return null;
    }

    onProgress?.(95, "OCR complete!");
    console.log(
      `[ClauseWall OCR] ✅ PDF OCR: ${fullText.length} chars from ${pdf.numPages} pages`
    );

    return fullText;
  } catch (error) {
    console.error("[ClauseWall OCR] PDF OCR failed:", error);
    return null;
  }
}

/**
 * Terminate the worker when done
 */
export async function terminateOCR(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
    isReady = false;
    console.log("[ClauseWall OCR] Worker terminated");
  }
}

/**
 * Get current OCR readiness
 */
export function getOCRStatus(): OCRStatus {
  if (isReady) return "ready";
  if (isInitializing) return "loading";
  return "idle";
}