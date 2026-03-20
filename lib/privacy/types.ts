// ============================================
// PRIVACY SYSTEM TYPES
// ============================================

export type PrivacyLevel = "maximum" | "balanced" | "standard";

export interface PIIDetection {
  type: PIIType;
  value: string;
  masked: string;
  startIndex: number;
  endIndex: number;
}

export type PIIType =
  | "name"
  | "aadhaar"
  | "pan"
  | "phone"
  | "email"
  | "address"
  | "bank_account"
  | "date"
  | "company"
  | "amount"
  | "gstin"
  | "cin";

export interface RedactionResult {
  original: string;
  redacted: string;
  detections: PIIDetection[];
  stats: {
    total: number;
    names: number;
    ids: number;
    contacts: number;
    addresses: number;
    financial: number;
  };
}

export interface PrivacyState {
  level: PrivacyLevel;
  setLevel: (level: PrivacyLevel) => void;
  processingSteps: ProcessingStep[];
  addStep: (step: ProcessingStep) => void;
  clearSteps: () => void;
  bytesSent: number;
  setBytesSent: (bytes: number) => void;
}

export interface ProcessingStep {
  id: string;
  label: string;
  status: "pending" | "done" | "error";
  location: "device" | "server";
  detail?: string;
  timestamp: number;
}