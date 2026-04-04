// Evidence File Upload API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
    const itemId = formData.get("item_id") as string | null;

    if (!file || !caseId || !itemId) {
      return NextResponse.json(
        { error: "Missing file, case_id, or item_id" },
        { status: 400 },
      );
    }

    // Validate MIME type
    const dangerousMimes = [
      "application/x-executable",
      "application/x-msdownload",
      "application/x-sh",
    ];
    if (dangerousMimes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
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
