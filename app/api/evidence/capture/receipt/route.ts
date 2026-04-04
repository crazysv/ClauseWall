// Receipt OCR Capture API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseReceiptImage } from "@/lib/evidence/parsers/receipt-parser";
import { addEvidenceItem } from "@/lib/evidence/capture";
import { uploadEvidenceFile } from "@/lib/evidence/storage";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const caseId = formData.get("case_id") as string | null;

    if (!file || !caseId)
      return NextResponse.json(
        { error: "Missing file or case_id" },
        { status: 400 },
      );

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    // OCR the receipt
    const ocrResult = await parseReceiptImage(base64, file.type);

    // Generate a temporary item ID for storage
    const tempItemId = crypto.randomUUID();

    // Upload original image
    const uploadResult = await uploadEvidenceFile(
      user.id,
      caseId,
      tempItemId,
      buffer,
      file.name,
      file.type,
    );

    // Build title from OCR data
    const amount = ocrResult.data?.amount
      ? `₹${ocrResult.data.amount.toLocaleString("en-IN")}`
      : "Amount unknown";
    const title = `Payment Receipt — ${amount}`;

    // Add to evidence chain
    const result = await addEvidenceItem(caseId, user.id, {
      evidence_type: "payment_receipt",
      title,
      description: ocrResult.data
        ? `${ocrResult.data.payment_method || "Payment"} on ${ocrResult.data.date || "unknown date"}`
        : "Receipt (OCR pending manual review)",
      content: buffer,
      original_filename: file.name,
      storage_path: uploadResult?.path || undefined,
      file_size_bytes: file.size,
      mime_type: file.type,
      extracted_data: ocrResult.data || {},
      source: "ocr_capture",
      captured_at: ocrResult.data?.date
        ? `${ocrResult.data.date}T00:00:00Z`
        : undefined,
    });

    return NextResponse.json(
      {
        item: result.item,
        ocr_result: ocrResult,
        is_duplicate: result.is_duplicate,
      },
      { status: result.is_duplicate ? 409 : 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to process receipt" },
      { status: 500 },
    );
  }
}
