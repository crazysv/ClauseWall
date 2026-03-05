// ============================================
// RESULTS PAGE LAYOUT — OG METADATA
// Server component that provides dynamic
// meta tags for social sharing link previews
// ============================================

import { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getDocumentTypeLabel,
  getRiskLevel,
  RISK_LABELS,
} from "@/lib/utils/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: doc } = await supabase
      .from("documents")
      .select(
        "overall_risk_score, document_type, illegal_count, dangerous_count, total_clauses"
      )
      .eq("id", id)
      .single();

    if (!doc) {
      return {
        title: "Analysis Results — ClauseWall",
        description: "Contract analysis powered by ClauseWall.",
      };
    }

    const riskLevel = getRiskLevel(doc.overall_risk_score);
    const riskLabel = RISK_LABELS[riskLevel];
    const docType = getDocumentTypeLabel(doc.document_type);

    const title = `${riskLabel} — ${docType} | ClauseWall`;
    const description = `Score: ${doc.overall_risk_score}/100 · ${doc.illegal_count} illegal · ${doc.dangerous_count} dangerous · ${doc.total_clauses} clauses analyzed. Powered by ClauseWall — India's AI Contract Analyzer.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        siteName: "ClauseWall",
        images: [
          {
            url: `/api/og/${id}`,
            width: 1200,
            height: 630,
            alt: `ClauseWall Analysis — Score ${doc.overall_risk_score}/100`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [`/api/og/${id}`],
      },
    };
  } catch {
    return {
      title: "Analysis Results — ClauseWall",
    };
  }
}

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}