// ============================================
// RECEIPT OCR PARSER
// Uses Gemini Vision to extract payment data
// ============================================

import { callGeminiVision } from "@/lib/bot/gemini-client";
import type { ParsedReceipt } from "@/types/evidence";

const RECEIPT_PROMPT = `Extract ALL payment information from this Indian payment receipt/screenshot.
Return ONLY valid JSON with these fields:
{
  "amount": number or null,
  "currency": "INR",
  "date": "YYYY-MM-DD" or null,
  "time": "HH:MM" or null,
  "from_name": string or null,
  "to_name": string or null,
  "payment_method": "UPI" | "bank_transfer" | "cash" | "cheque" | "card" | "other",
  "upi_id": string or null,
  "transaction_id": string or null,
  "reference_number": string or null,
  "bank_name": string or null,
  "status": "success" | "pending" | "failed" or null,
  "notes": string or null
}
If any field is not visible in the image, return null for that field.
Do NOT include any text before or after the JSON.`;

/**
 * Parse a receipt image using Gemini Vision OCR
 */
export async function parseReceiptImage(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<{ success: boolean; data: ParsedReceipt | null; error?: string }> {
  try {
    const response = await callGeminiVision(RECEIPT_PROMPT, imageBase64, mimeType, {
      temperature: 0.1,
      maxTokens: 1024,
    });

    // Clean response — strip markdown code fences if present
    let cleanJson = response.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed: ParsedReceipt = JSON.parse(cleanJson);

    // Validate required structure
    if (typeof parsed !== "object" || parsed === null) {
      return { success: false, data: null, error: "Invalid response structure" };
    }

    // Normalize
    const receipt: ParsedReceipt = {
      amount: typeof parsed.amount === "number" ? parsed.amount : null,
      currency: parsed.currency || "INR",
      date: parsed.date || null,
      time: parsed.time || null,
      from_name: parsed.from_name || null,
      to_name: parsed.to_name || null,
      payment_method: parsed.payment_method || "other",
      upi_id: parsed.upi_id || null,
      transaction_id: parsed.transaction_id || null,
      reference_number: parsed.reference_number || null,
      bank_name: parsed.bank_name || null,
      status: parsed.status || null,
      notes: parsed.notes || null,
    };

    return { success: true, data: receipt };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Evidence] Receipt OCR failed:", message);
    return { success: false, data: null, error: message };
  }
}

/**
 * Create a manual receipt entry (when OCR fails)
 */
export function createManualReceipt(data: Partial<ParsedReceipt>): ParsedReceipt {
  return {
    amount: data.amount ?? null,
    currency: data.currency || "INR",
    date: data.date || null,
    time: data.time || null,
    from_name: data.from_name || null,
    to_name: data.to_name || null,
    payment_method: data.payment_method || "other",
    upi_id: data.upi_id || null,
    transaction_id: data.transaction_id || null,
    reference_number: data.reference_number || null,
    bank_name: data.bank_name || null,
    status: data.status || null,
    notes: data.notes || null,
  };
}
