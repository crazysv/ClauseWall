// WhatsApp Export Capture API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseWhatsAppExport } from "@/lib/evidence/parsers/whatsapp-parser";
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const caseId = formData.get("case_id") as string | null;

    if (!file || !caseId) {
      return NextResponse.json(
        { error: "Missing file or case_id" },
        { status: 400 },
      );
    }

    const text = await file.text();
    const parsed = parseWhatsAppExport(text);

    if (parsed.message_count === 0) {
      return NextResponse.json(
        { error: "No messages found in export file" },
        { status: 400 },
      );
    }

    const result = await addEvidenceItem(caseId, user.id, {
      evidence_type: "whatsapp_chat",
      title: `WhatsApp Chat (${parsed.participants.join(", ")})`,
      description: `${parsed.message_count} messages from ${new Date(parsed.date_range.start).toLocaleDateString("en-IN")} to ${new Date(parsed.date_range.end).toLocaleDateString("en-IN")}`,
      content: text,
      original_filename: file.name,
      mime_type: "text/plain",
      file_size_bytes: file.size,
      extracted_data: parsed,
      source: "whatsapp_export",
    });

    return NextResponse.json(
      {
        item: result.item,
        parsed_summary: {
          participants: parsed.participants,
          message_count: parsed.message_count,
          date_range: parsed.date_range,
          chat_type: parsed.chat_type,
        },
        is_duplicate: result.is_duplicate,
      },
      { status: result.is_duplicate ? 409 : 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to parse WhatsApp export" },
      { status: 500 },
    );
  }
}
