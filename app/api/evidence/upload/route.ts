// Evidence File Upload API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadEvidenceFile } from "@/lib/evidence/storage";
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
    const itemId = formData.get("item_id") as string | null;

    if (!file || !caseId || !itemId) {
      return NextResponse.json(
        { error: "Missing file, case_id, or item_id" },
        { status: 400 },
      );
    }

    // Server-side MIME validation (Whitelist approach)
    const allowedMimeTypes = [
      // Documents
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      // Images
      "image/jpeg",
      "image/png",
      "image/webp",
      // Audio
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/webm",
      "audio/ogg",
      "audio/x-m4a",
      // Email/Messages
      "message/rfc822",
      "application/vnd.ms-outlook",
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Supported types: PDF, Word, images, audio, text, and email." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await uploadEvidenceFile(
      user.id,
      caseId,
      itemId,
      buffer,
      file.name,
      file.type,
    );

    if (!result) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    return NextResponse.json({
      path: result.path,
      size: result.size,
      hash: result.hash,
    });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
