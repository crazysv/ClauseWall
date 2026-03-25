// ============================================
// IMAGE PARSER — OCR via Gemini Vision
// Handles SMS screenshots, handwritten notes,
// property listings, and other images
// ============================================

import { callGeminiVision } from '@/lib/bot/gemini-client';

const OCR_PROMPTS: Record<string, string> = {
  sms_screenshot:
    'Extract ALL text from this SMS/message screenshot. Include sender name, date if visible, and full message text. Preserve the conversation flow. Return only the extracted text, no commentary.',
  handwritten_note:
    'Read and transcribe this handwritten note. Include ALL text even if partially legible. Note any parts you are uncertain about with [unclear]. Return only the transcribed text.',
  property_listing:
    'Extract ALL text from this property listing screenshot. Include: property details, amenities, price, terms mentioned, contact info. Return only the extracted text.',
  other:
    'Extract ALL readable text from this image. Return only the extracted text, no commentary.',
};

/**
 * Extract text from an image using Gemini Vision OCR
 */
export async function extractTextFromImage(
  imageBuffer: ArrayBuffer,
  type: 'sms_screenshot' | 'handwritten_note' | 'property_listing' | 'other' = 'other'
): Promise<{ text: string; confidence: number }> {
  try {
    // Convert buffer to base64
    const uint8 = new Uint8Array(imageBuffer);
    let binary = '';
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const base64 = btoa(binary);

    // Detect MIME type from magic bytes
    let mimeType = 'image/jpeg';
    if (uint8[0] === 0x89 && uint8[1] === 0x50) {
      mimeType = 'image/png';
    } else if (uint8[0] === 0x52 && uint8[1] === 0x49) {
      mimeType = 'image/webp';
    }

    const prompt = OCR_PROMPTS[type] || OCR_PROMPTS.other;

    const result = await callGeminiVision(prompt, base64, mimeType, {
      temperature: 0.1,
      maxTokens: 4096,
      retries: 2,
    });

    const text = result.trim();

    // Estimate confidence based on text length
    let confidence = 0;
    if (text.length > 200) confidence = 0.9;
    else if (text.length > 50) confidence = 0.7;
    else if (text.length > 10) confidence = 0.5;
    else confidence = 0.2;

    console.log(`[ClauseWall] Image OCR: Extracted ${text.length} chars (type=${type}, confidence=${confidence})`);

    return { text, confidence };
  } catch (error) {
    console.error('[ClauseWall] Image OCR failed:', error);
    return { text: '', confidence: 0 };
  }
}
