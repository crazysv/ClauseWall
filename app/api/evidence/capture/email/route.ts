// Email Capture API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  parseEmlFile,
  parseRawEmailText,
} from "@/lib/evidence/parsers/eml-parser";
import { addEvidenceItem } from "@/lib/evidence/capture";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = await rateLimit(request, "DB_WRITE", user.id);
    if (!rl.success) return rateLimitResponse(rl);

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // File upload (.eml)
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const caseId = formData.get("case_id") as string | null;
      if (!file || !caseId)
        return NextResponse.json(
          { error: "Missing file or case_id" },
          { status: 400 },
        );

      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await parseEmlFile(buffer);

      const result = await addEvidenceItem(caseId, user.id, {
        evidence_type: "email",
        title: `Email: ${parsed.subject}`,
        description: `From: ${parsed.from?.address || "unknown"} | Date: ${parsed.date || "unknown"}`,
        content: buffer,
        original_filename: file.name,
        mime_type: "message/rfc822",
        file_size_bytes: file.size,
        extracted_data: parsed,
        source: "eml_import",
        captured_at: parsed.date || undefined,
      });

      return NextResponse.json(
        { item: result.item, parsed, is_duplicate: result.is_duplicate },
        { status: result.is_duplicate ? 409 : 201 },
      );
    } else {
      // Raw text paste
      const body = await request.json();
      const { case_id, text, from, to, subject, date } = body;
      if (!case_id || !text)
        return NextResponse.json(
          { error: "Missing case_id or text" },
          { status: 400 },
        );

      const parsed = parseRawEmailText(text, { from, to, subject, date });

      const result = await addEvidenceItem(case_id, user.id, {
        evidence_type: "email",
        title: `Email: ${parsed.subject}`,
        description: `From: ${parsed.from?.address || "manual entry"}`,
        content: text,
        extracted_data: parsed,
        source: "manual_upload",
        captured_at: parsed.date || undefined,
      });

      return NextResponse.json({ item: result.item, parsed }, { status: 201 });
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to parse email" },
      { status: 500 },
    );
  }
}
