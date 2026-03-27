// ============================================
// EVIDENCE STORAGE — Supabase Storage Wrapper
// Private bucket for evidence files
// ============================================

import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "crypto";

const BUCKET = "evidence-files";
const MAX_EVIDENCE_FILE_SIZE = 25 * 1024 * 1024; // 25MB (Groq Whisper limit)
const MAX_CASE_STORAGE = 200 * 1024 * 1024; // 200MB
const WARN_CASE_STORAGE = 100 * 1024 * 1024; // 100MB
const SIGNED_URL_EXPIRY = 3600; // 1 hour
const BUNDLE_URL_EXPIRY = 7 * 24 * 3600; // 7 days

/**
 * Build storage path for evidence files
 */
function buildPath(userId: string, caseId: string, itemId: string, filename: string): string {
  return `evidence/${userId}/${caseId}/${itemId}/${filename}`;
}

function buildCertPath(userId: string, caseId: string, certId: string): string {
  return `evidence/${userId}/${caseId}/certificates/${certId}.pdf`;
}

function buildBundlePath(userId: string, caseId: string, bundleId: string): string {
  return `evidence/${userId}/${caseId}/bundles/${bundleId}.pdf`;
}

function buildThumbPath(userId: string, caseId: string, itemId: string, filename: string): string {
  return `evidence/${userId}/${caseId}/${itemId}/thumb_${filename}`;
}

/**
 * Upload a file to evidence storage
 */
export async function uploadEvidenceFile(
  userId: string,
  caseId: string,
  itemId: string,
  file: Buffer | Uint8Array,
  filename: string,
  mimeType: string
): Promise<{ path: string; size: number; hash: string } | null> {
  try {
    if (file.length > MAX_EVIDENCE_FILE_SIZE) {
      console.error(`[Evidence] File too large: ${file.length} bytes (max ${MAX_EVIDENCE_FILE_SIZE})`);
      return null;
    }

    const supabase = createAdminClient();
    const path = buildPath(userId, caseId, itemId, filename);
    const hash = createHash("sha256").update(file).digest("hex");

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error("[Evidence] Upload failed:", error);
      return null;
    }

    return { path, size: file.length, hash };
  } catch (error) {
    console.error("[Evidence] Upload error:", error);
    return null;
  }
}

/**
 * Upload a certificate PDF
 */
export async function uploadCertificatePdf(
  userId: string,
  caseId: string,
  certId: string,
  pdf: Buffer | Uint8Array
): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const path = buildCertPath(userId, caseId, certId);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, pdf, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      console.error("[Evidence] Certificate upload failed:", error);
      return null;
    }

    return path;
  } catch (error) {
    console.error("[Evidence] Certificate upload error:", error);
    return null;
  }
}

/**
 * Upload a bundle PDF
 */
export async function uploadBundlePdf(
  userId: string,
  caseId: string,
  bundleId: string,
  pdf: Buffer | Uint8Array
): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const path = buildBundlePath(userId, caseId, bundleId);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, pdf, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      console.error("[Evidence] Bundle upload failed:", error);
      return null;
    }

    return path;
  } catch (error) {
    console.error("[Evidence] Bundle upload error:", error);
    return null;
  }
}

/**
 * Upload a thumbnail
 */
export async function uploadThumbnail(
  userId: string,
  caseId: string,
  itemId: string,
  filename: string,
  thumb: Buffer | Uint8Array
): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const path = buildThumbPath(userId, caseId, itemId, filename);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, thumb, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error("[Evidence] Thumbnail upload failed:", error);
      return null;
    }

    return path;
  } catch (error) {
    console.error("[Evidence] Thumbnail upload error:", error);
    return null;
  }
}

/**
 * Get a signed URL for viewing
 */
export async function getSignedUrl(
  storagePath: string,
  expiresIn: number = SIGNED_URL_EXPIRY
): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, expiresIn);

    if (error || !data?.signedUrl) {
      console.error("[Evidence] Signed URL error:", error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("[Evidence] Signed URL error:", error);
    return null;
  }
}

/**
 * Get signed URL for bundle (longer expiry)
 */
export async function getBundleSignedUrl(storagePath: string): Promise<string | null> {
  return getSignedUrl(storagePath, BUNDLE_URL_EXPIRY);
}

/**
 * Delete a file from storage
 */
export async function deleteEvidenceFile(storagePath: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);

    if (error) {
      console.error("[Evidence] Delete failed:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Evidence] Delete error:", error);
    return false;
  }
}

/**
 * Download file content
 */
export async function downloadEvidenceFile(storagePath: string): Promise<Buffer | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);

    if (error || !data) {
      console.error("[Evidence] Download failed:", error);
      return null;
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("[Evidence] Download error:", error);
    return null;
  }
}

/**
 * Check storage quota for a case
 */
export function checkStorageQuota(usedBytes: number): {
  ok: boolean;
  warning: boolean;
  percent: number;
  message: string | null;
} {
  const percent = Math.round((usedBytes / MAX_CASE_STORAGE) * 100);

  if (usedBytes >= MAX_CASE_STORAGE) {
    return { ok: false, warning: true, percent, message: "Storage limit reached (200MB). Delete old bundles or files." };
  }
  if (usedBytes >= WARN_CASE_STORAGE) {
    return { ok: true, warning: true, percent, message: `Storage ${percent}% used. Consider cleanup.` };
  }
  return { ok: true, warning: false, percent, message: null };
}

/**
 * Compute SHA-256 hash of content
 */
export function hashContent(content: Buffer | Uint8Array | string): string {
  return createHash("sha256").update(content).digest("hex");
}

export { BUCKET, MAX_EVIDENCE_FILE_SIZE, MAX_CASE_STORAGE };
