// ============================================
// CAMERA PROCESSOR — CAMERA FRAME PROCESSING
// Handles camera capture and OCR clause analysis
// ============================================

import type { CameraClause, RiskLevel } from "@/types";

// ============================================
// DANGEROUS KEYWORDS FOR RISK ASSESSMENT
// ============================================

const DANGEROUS_KEYWORDS: Record<string, { weight: number; risk: RiskLevel; reason: string }> = {
  forfeit: { weight: 3, risk: "dangerous", reason: "Forfeiture clause — may lose your deposit/payment" },
  forfeiture: { weight: 3, risk: "dangerous", reason: "Forfeiture clause — may lose your deposit/payment" },
  "non-refundable": { weight: 3, risk: "dangerous", reason: "Non-refundable payment — no recovery possible" },
  nonrefundable: { weight: 3, risk: "dangerous", reason: "Non-refundable payment — no recovery possible" },
  irrevocable: { weight: 3, risk: "dangerous", reason: "Irrevocable commitment — cannot be undone" },
  waive: { weight: 2, risk: "warning", reason: "Waiver of rights — you may be giving up legal protections" },
  indemnify: { weight: 2, risk: "warning", reason: "Indemnification — you may be liable for their losses" },
  indemnification: { weight: 2, risk: "warning", reason: "Indemnification — you may be liable for their losses" },
  "sole discretion": { weight: 3, risk: "dangerous", reason: "One-sided power — they decide everything alone" },
  "no liability": { weight: 3, risk: "dangerous", reason: "No liability clause — they can't be held responsible" },
  "terminate immediately": { weight: 2, risk: "warning", reason: "Immediate termination — no notice for you" },
  "liquidated damages": { weight: 2, risk: "warning", reason: "Pre-set penalty amount — may be excessive" },
  penalty: { weight: 1, risk: "warning", reason: "Penalty clause — check if amount is reasonable" },
  "without notice": { weight: 2, risk: "dangerous", reason: "Action without notice — no warning before consequences" },
  "at any time": { weight: 1, risk: "warning", reason: "Open-ended power — no restrictions on when they act" },
  "unconditional": { weight: 2, risk: "warning", reason: "Unconditional obligation — no exceptions allowed" },
  "entire risk": { weight: 2, risk: "dangerous", reason: "All risk on you — no shared responsibility" },
  "not be liable": { weight: 2, risk: "warning", reason: "Liability exclusion" },
  "shall not claim": { weight: 2, risk: "dangerous", reason: "Waiver of claims — you can't seek remedies" },
  "automatic renewal": { weight: 1, risk: "warning", reason: "Auto-renewal — contract extends without your consent" },
  "non compete": { weight: 2, risk: "warning", reason: "Non-compete restriction — limits your employment options" },
  "non-compete": { weight: 2, risk: "warning", reason: "Non-compete restriction — limits your employment options" },
  arbitration: { weight: 1, risk: "warning", reason: "Mandatory arbitration — may limit your legal options" },
  "exclusive jurisdiction": { weight: 1, risk: "warning", reason: "Forum selection — may force you to litigate elsewhere" },
};

// ============================================
// CLAUSE TYPE KEYWORDS
// ============================================

const CLAUSE_TYPE_KEYWORDS: Record<string, string[]> = {
  security_deposit: ["deposit", "security deposit", "advance", "refundable", "caution money"],
  notice_period: ["notice", "notice period", "termination notice", "vacate"],
  rent_escalation: ["rent increase", "escalation", "hike", "revision", "enhancement"],
  penalty: ["penalty", "fine", "liquidated damages", "damages"],
  late_payment: ["late fee", "delayed payment", "overdue", "late charge"],
  lock_in: ["lock-in", "lock in", "minimum period", "committed period"],
  termination: ["termination", "exit", "cancellation", "end of contract"],
  non_compete: ["non-compete", "non compete", "restrictive covenant", "competition"],
  indemnity: ["indemnity", "indemnification", "hold harmless"],
  maintenance: ["maintenance", "upkeep", "repair", "common area"],
  brokerage: ["brokerage", "broker", "commission", "agent fee"],
  confidentiality: ["confidential", "non-disclosure", "nda", "proprietary"],
  ip_assignment: ["intellectual property", "ip", "copyright", "patent", "invention"],
};

/**
 * Detect clause type from clause text
 */
function detectClauseTypeFromText(text: string): string | null {
  const lower = text.toLowerCase();

  for (const [clauseType, keywords] of Object.entries(CLAUSE_TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return clauseType;
      }
    }
  }

  return null;
}

// ============================================
// CAMERA STREAM
// ============================================

/**
 * Start camera stream for document scanning
 */
export async function startCameraStream(videoElement: HTMLVideoElement): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    video: {
      facingMode: "environment", // Rear camera for document scanning
      width: { ideal: 1920, min: 1280 },
      height: { ideal: 1080, min: 720 },
    },
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;
    await videoElement.play();
    return stream;
  } catch (error: any) {
    // Try fallback without facing mode
    if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") {
      const fallbackConstraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      videoElement.srcObject = stream;
      await videoElement.play();
      return stream;
    }
    throw error;
  }
}

/**
 * Stop camera stream
 */
export function stopCameraStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}

// ============================================
// FRAME CAPTURE
// ============================================

/**
 * Capture a single frame from the video element as base64 JPEG
 */
export function captureFrame(videoElement: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = videoElement.videoWidth || 1280;
  canvas.height = videoElement.videoHeight || 720;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot create canvas context");

  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  // Convert to JPEG base64 (0.8 quality for OCR balance)
  const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

  // Remove data:image/jpeg;base64, prefix
  const base64 = dataUrl.split(",")[1];

  // Cleanup
  canvas.width = 0;
  canvas.height = 0;

  return base64;
}

// ============================================
// CLAUSE RISK ASSESSMENT
// ============================================

/**
 * Process extracted text for risky clauses — pure keyword analysis, no AI
 */
export function processFrameForClauses(
  extractedText: string,
  jurisdiction: string,
  documentType: string
): CameraClause[] {
  if (!extractedText || extractedText.trim().length < 20) return [];

  // Split text into potential clauses (by numbered items, paragraphs, or periods)
  const clauseTexts = splitIntoClauses(extractedText);
  const results: CameraClause[] = [];

  for (const clauseText of clauseTexts) {
    if (clauseText.trim().length < 15) continue; // Skip very short fragments

    const lower = clauseText.toLowerCase();
    let maxWeight = 0;
    let worstRisk: RiskLevel = "safe";
    let riskReasons: string[] = [];
    let detectedType: string | null = null;

    // Check against dangerous keywords
    for (const [keyword, info] of Object.entries(DANGEROUS_KEYWORDS)) {
      if (lower.includes(keyword)) {
        if (info.weight > maxWeight) {
          maxWeight = info.weight;
          worstRisk = info.risk;
        }
        riskReasons.push(info.reason);
      }
    }

    // Detect clause type
    detectedType = detectClauseTypeFromText(clauseText);

    // Determine final risk level
    let finalRisk: RiskLevel = "safe";
    if (maxWeight >= 3) finalRisk = "dangerous";
    else if (maxWeight >= 2) finalRisk = "warning";
    else if (maxWeight >= 1) finalRisk = "warning";
    else if (riskReasons.length > 0) finalRisk = "warning";

    // Multiple risk factors compound
    if (riskReasons.length >= 3 && finalRisk === "warning") {
      finalRisk = "dangerous";
    }

    results.push({
      text: clauseText.trim(),
      risk_level: finalRisk,
      risk_reason: riskReasons.length > 0
        ? riskReasons.slice(0, 3).join("; ")
        : "No specific risk identified",
      clause_type: detectedType,
      legal_issue: riskReasons.length > 0 ? riskReasons[0] : null,
      bounding_box: null, // Would need OCR coordinates for this
    });
  }

  // Sort: dangerous first, then warning, then safe
  const riskOrder: Record<string, number> = {
    illegal: 0, dangerous: 1, warning: 2, safe: 3,
  };
  results.sort((a, b) => (riskOrder[a.risk_level] ?? 3) - (riskOrder[b.risk_level] ?? 3));

  return results;
}

/**
 * Split extracted text into potential clause segments
 */
function splitIntoClauses(text: string): string[] {
  const clauses: string[] = [];

  // Try splitting by numbered patterns: "1.", "1)", "(1)", "(a)", "Clause 1"
  const numberedPattern = /(?:^|\n)\s*(?:\d+[.)]\s|[(]\d+[)]\s|[(][a-z][)]\s|[a-z][.)]\s|clause\s+\d+|section\s+\d+)/gi;
  const matches = text.split(numberedPattern).filter((s) => s && s.trim().length > 15);

  if (matches.length > 1) {
    return matches;
  }

  // Fallback: split by double newline (paragraphs)
  const paragraphs = text.split(/\n\s*\n/).filter((s) => s && s.trim().length > 15);
  if (paragraphs.length > 1) {
    return paragraphs;
  }

  // Fallback: split by single newline if the text has many lines
  const lines = text.split(/\n/).filter((s) => s && s.trim().length > 15);
  if (lines.length > 2) {
    return lines;
  }

  // Last resort: split by period (sentence-level)
  const sentences = text.split(/\.\s+/).filter((s) => s && s.trim().length > 20);
  if (sentences.length > 1) {
    return sentences.map((s) => s + ".");
  }

  // Return the whole text as one clause
  return [text];
}

/**
 * Check if camera is supported
 */
export function isCameraSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
