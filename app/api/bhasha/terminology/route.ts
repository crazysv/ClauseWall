import { NextRequest, NextResponse } from "next/server";
import {
  getTermsForLanguage,
  getEnglishEquivalent,
  getTerminologyContext,
  getTotalTermCount,
  LEGAL_TERMINOLOGY,
} from "@/lib/bhasha/legal-terminology";
import type { SupportedLanguage } from "@/types/bhasha";
import { LANGUAGE_CONFIGS } from "@/lib/bhasha/constants";
import { createClient } from "@/lib/supabase/server";

/**
 * GET: Retrieve terminology for a language.
 * /api/bhasha/terminology?language=hi
 * /api/bhasha/terminology?language=hi&term=किराया
 * /api/bhasha/terminology?seed=true  — seed db from static data
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const language = searchParams.get("language");
  const term = searchParams.get("term");
  const seed = searchParams.get("seed") === "true";

  // Seed database from static data
  if (seed) {
    return seedTerminology();
  }

  if (language) {
    if (!LANGUAGE_CONFIGS[language as SupportedLanguage]) {
      return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
    }

    // Lookup specific term
    if (term) {
      const equivalent = getEnglishEquivalent(term, language);
      return NextResponse.json({
        term,
        language,
        english_equivalent: equivalent,
      });
    }

    // Get all terms for language
    const terms = getTermsForLanguage(language);
    return NextResponse.json({
      language,
      total_terms: terms.length,
      terms,
    });
  }

  // Return summary
  return NextResponse.json({
    total_terms: getTotalTermCount(),
    languages: Object.keys(LEGAL_TERMINOLOGY),
  });
}

// ============================================
// SEED TERMINOLOGY INTO DATABASE
// ============================================

async function seedTerminology(): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Check if already seeded
    const { count } = await supabase
      .from("legal_terminology")
      .select("*", { count: "exact", head: true });

    if (count && count > 0) {
      return NextResponse.json({
        status: "already_seeded",
        count,
      });
    }

    // Flatten all terms into rows
    const rows: {
      language_code: string;
      regional_term: string;
      regional_term_transliterated: string;
      english_equivalent: string;
      clause_type: string | null;
      legal_context: string;
      usage_example: string | null;
    }[] = [];

    for (const [languageCode, terms] of Object.entries(LEGAL_TERMINOLOGY)) {
      for (const term of terms) {
        rows.push({
          language_code: languageCode,
          regional_term: term.regional_term,
          regional_term_transliterated: term.transliterated,
          english_equivalent: term.english_equivalent,
          clause_type: term.clause_type,
          legal_context: term.legal_context,
          usage_example: term.usage_example || null,
        });
      }
    }

    // Insert in batches
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabase.from("legal_terminology").upsert(batch, {
        onConflict: "language_code,regional_term",
      });
      if (error) {
        console.error(`[ClauseWall] Terminology seed batch ${i} failed:`, error);
      } else {
        inserted += batch.length;
      }
    }

    return NextResponse.json({
      status: "seeded",
      inserted,
      total: rows.length,
    });
  } catch (error) {
    console.error("[ClauseWall] Terminology seeding failed:", error);
    return NextResponse.json({ error: "Seeding failed" }, { status: 500 });
  }
}
