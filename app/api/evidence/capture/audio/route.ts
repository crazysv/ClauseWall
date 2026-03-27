// Audio Transcription Capture API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transcribeAudio } from "@/lib/evidence/parsers/audio-transcriber";
import { addEvidenceItem } from "@/lib/evidence/capture";
import { uploadEvidenceFile } from "@/lib/evidence/storage";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const caseId = formData.get("case_id") as string | null;
    const language = (formData.get("language") as string) || "en";

    if (!file || !caseId) return NextResponse.json({ error: "Missing file or case_id" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Transcribe
    const transcriptionResult = await transcribeAudio(buffer, file.name, { language });

    // Upload audio file
    const tempItemId = crypto.randomUUID();
    const uploadResult = await uploadEvidenceFile(user.id, caseId, tempItemId, buffer, file.name, file.type);

    const duration = transcriptionResult.data?.duration_seconds || 0;
    const durationStr = `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, "0")}`;

    const result = await addEvidenceItem(caseId, user.id, {
      evidence_type: "audio_recording",
      title: `Audio Recording — ${durationStr}`,
      description: transcriptionResult.success
        ? `Transcribed (${language.toUpperCase()}) — ${transcriptionResult.data?.text.substring(0, 100)}...`
        : "Audio stored. Transcription unavailable — retry or add manually.",
      content: buffer,
      original_filename: file.name,
      storage_path: uploadResult?.path || undefined,
      file_size_bytes: file.size,
      mime_type: file.type,
      extracted_data: transcriptionResult.data || {},
      source: "manual_upload",
    });

    return NextResponse.json({
      item: result.item,
      transcription: transcriptionResult,
      is_duplicate: result.is_duplicate,
    }, { status: result.is_duplicate ? 409 : 201 });
  } catch {
    return NextResponse.json({ error: "Failed to process audio" }, { status: 500 });
  }
}
