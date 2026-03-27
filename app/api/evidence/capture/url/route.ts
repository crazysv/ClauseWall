// URL Archive Capture API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { archiveUrl, hashArchiveContent } from "@/lib/evidence/archiver/web-archiver";
import { addEvidenceItem } from "@/lib/evidence/capture";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { case_id, url, evidence_type } = body;

    if (!case_id || !url) return NextResponse.json({ error: "Missing case_id or url" }, { status: 400 });

    // Validate URL format
    try { new URL(url); } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const archiveResult = await archiveUrl(url);
    const { combinedHash } = hashArchiveContent(archiveResult.html || null, null);

    const result = await addEvidenceItem(case_id, user.id, {
      evidence_type: evidence_type || "website_archive",
      title: archiveResult.title || url,
      description: archiveResult.success
        ? `Archived from ${url} on ${new Date(archiveResult.archived_at).toLocaleString("en-IN")}`
        : `Partial archive of ${url} — ${archiveResult.error}`,
      content: archiveResult.html || url,
      extracted_data: {
        url: archiveResult.url,
        title: archiveResult.title,
        archived_at: archiveResult.archived_at,
        screenshot_hash: null,
        html_hash: archiveResult.html ? combinedHash : null,
        screenshot_path: null,
        html_snippet: archiveResult.html?.substring(0, 1000) || null,
      },
      source: "url_archive",
    });

    return NextResponse.json({
      item: result.item,
      archive: {
        success: archiveResult.success,
        title: archiveResult.title,
        has_html: !!archiveResult.html,
        error: archiveResult.error,
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to archive URL" }, { status: 500 });
  }
}
