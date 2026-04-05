// ============================================
// PUBLIC VERIFICATION PAGE
// /verify/[shareId] — Scanned via QR code
// Server Component for fast mobile loading
// ============================================

import { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTierConfig } from "@/lib/qr";
import type { VerificationTier, ShareSettings } from "@/lib/qr";
import {
  getStateName,
  getDocumentTypeLabel,
  getRiskLevel,
  RISK_COLORS,
} from "@/lib/utils/constants";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  FileText,
  MapPin,
  Calendar,
  Users,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Ban,
  Building2,
} from "lucide-react";

// Force dynamic rendering — track every visit
export const dynamic = "force-dynamic";

// ── Metadata ──────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: shareId } = await params;
  const supabase = createAdminClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("overall_risk_score, document_type, verification_tier")
    .eq("public_share_id", shareId)
    .single();

  if (!doc) {
    return {
      title: "Verification Not Found — ClauseWall",
      description: "This verification link is invalid or has expired.",
    };
  }

  const tier = getTierConfig(
    (doc.verification_tier as VerificationTier) || "needs_work",
  );

  return {
    title: `${tier.icon} ${tier.shortLabel} Contract — ClauseWall Verification`,
    description: `This contract scored ${doc.overall_risk_score}/100. ${tier.description}. Verified by ClauseWall — India's AI Contract Analyzer.`,
    openGraph: {
      title: `${tier.icon} Contract ${tier.shortLabel} — ClauseWall`,
      description: `Risk Score: ${doc.overall_risk_score}/100. ${tier.description}. Scan verified by ClauseWall.`,
      type: "website",
      siteName: "ClauseWall",
    },
  };
}

// ── Page ──────────────────────────────────────

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: shareId } = await params;
  const supabase = createAdminClient();

  // Fetch document by share ID
  const { data: doc, error } = await supabase
    .from("documents")
    .select(
      `
      id,
      overall_risk_score,
      document_type,
      jurisdiction,
      total_clauses,
      safe_count,
      warning_count,
      dangerous_count,
      illegal_count,
      entity_name,
      summary,
      verification_tier,
      qr_generated_at,
      share_count,
      share_settings,
      created_at
    `,
    )
    .eq("public_share_id", shareId)
    .single();

  if (error || !doc) {
    return <NotFound />;
  }

  // Track this view
  await supabase.rpc("increment_share_count", { p_share_id: shareId });

  const tier = getTierConfig(
    (doc.verification_tier as VerificationTier) || "needs_work",
  );
  const settings: ShareSettings = (doc.share_settings as ShareSettings) || {
    show_entity: false,
    show_summary: false,
    allow_full_analysis: false,
  };

  const formattedDate = new Date(
    doc.qr_generated_at || doc.created_at,
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const viewCount = (doc.share_count || 0) + 1; // +1 for current view

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 bg-background border-t-4 border-black">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white dark:bg-zinc-950 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all duration-300">
          {/* Top color stripe */}
          <div
            className="h-4 border-b-4 border-black"
            style={{ backgroundColor: tier.color }}
          />

          <div className="p-6 sm:p-8">
            {/* Badge Icon + Label */}
            <div className="text-center mb-8 border-b-4 border-black pb-8 border-dashed">
              <div className="text-6xl mb-4">{tier.icon}</div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-black dark:text-foreground">
                <span style={{ color: tier.color }}>{tier.label}</span>
              </h1>
            </div>

            {/* Score Gauge */}
            <div className="flex justify-center mb-8">
              <div
                className="relative h-32 w-32 border-4 border-black rounded-full flex items-center justify-center bg-gray-100 dark:bg-zinc-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                style={{
                  background: `conic-gradient(${tier.color} ${doc.overall_risk_score}%, transparent 0)`,
                }}
              >
                <div className="absolute inset-2 md:inset-3 bg-white dark:bg-zinc-950 border-4 border-black rounded-full flex flex-col items-center justify-center">
                  <span
                    className="text-4xl font-black"
                    style={{ color: tier.color }}
                  >
                    {doc.overall_risk_score}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-foreground">
                    /100
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-center text-sm text-foreground mb-6">
              {tier.description}
            </p>

            {/* Divider */}
            <div className="h-px bg-muted mb-6" />

            {/* Contract Details */}
            <div className="space-y-4 mb-8 pt-6 border-t-4 border-black border-dashed">
              <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest">
                <FileText className="h-5 w-5 text-black dark:text-foreground flex-shrink-0 stroke-[3px]" />
                <span className="text-foreground w-32">TYPE</span>
                <span className="font-black text-foreground">
                  {getDocumentTypeLabel(doc.document_type)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest">
                <MapPin className="h-5 w-5 text-black dark:text-foreground flex-shrink-0 stroke-[3px]" />
                <span className="text-foreground w-32">JURISDICTION</span>
                <span className="font-black text-foreground">
                  {getStateName(doc.jurisdiction)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest">
                <Calendar className="h-5 w-5 text-black dark:text-foreground flex-shrink-0 stroke-[3px]" />
                <span className="text-foreground w-32">VERIFIED</span>
                <span className="font-black text-foreground">
                  {formattedDate}
                </span>
              </div>

              {/* Entity — only if owner enabled */}
              {settings.show_entity && doc.entity_name && (
                <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest">
                  <Building2 className="h-5 w-5 text-black dark:text-foreground flex-shrink-0 stroke-[3px]" />
                  <span className="text-foreground w-32">ENTITY</span>
                  <span className="font-black text-foreground">
                    {doc.entity_name}
                  </span>
                </div>
              )}

              {viewCount > 1 && (
                <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest mx-auto mt-6 border-2 border-black bg-blue-100 dark:bg-blue-900/30 p-2 justify-center">
                  <Users className="h-5 w-5 text-blue-900 dark:text-blue-100 flex-shrink-0 stroke-[3px]" />
                  <span className="text-blue-900 dark:text-blue-100">
                    VERIFIED BY {viewCount} PEOPLE
                  </span>
                </div>
              )}
            </div>

            {/* Clause Breakdown */}
            <div className="mb-8 pt-6 border-t-4 border-black border-dashed">
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-4">
                CLAUSE BREAKDOWN
              </h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 border-4 border-black bg-green-100 dark:bg-green-900/30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <CheckCircle2 className="h-5 w-5 text-green-700 dark:text-green-400 mx-auto mb-2 stroke-[3px]" />
                  <p className="text-xl font-black text-green-800 dark:text-green-300">
                    {doc.safe_count}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-green-900 dark:text-green-300 mt-1">
                    SAFE
                  </p>
                </div>
                <div className="text-center p-3 border-4 border-black bg-yellow-100 dark:bg-yellow-900/30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <AlertTriangle className="h-5 w-5 text-yellow-700 dark:text-yellow-400 mx-auto mb-2 stroke-[3px]" />
                  <p className="text-xl font-black text-yellow-800 dark:text-yellow-300">
                    {doc.warning_count}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-yellow-900 dark:text-yellow-300 mt-1">
                    WARN
                  </p>
                </div>
                <div className="text-center p-3 border-4 border-black bg-red-100 dark:bg-red-900/30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <XCircle className="h-5 w-5 text-red-700 dark:text-red-400 mx-auto mb-2 stroke-[3px]" />
                  <p className="text-xl font-black text-red-800 dark:text-red-300">
                    {doc.dangerous_count}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-red-900 dark:text-red-300 mt-1">
                    DANG
                  </p>
                </div>
                <div className="text-center p-3 border-4 border-black bg-purple-100 dark:bg-purple-900/30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Ban className="h-5 w-5 text-purple-700 dark:text-purple-400 mx-auto mb-2 stroke-[3px]" />
                  <p className="text-xl font-black text-purple-800 dark:text-purple-300">
                    {doc.illegal_count}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-purple-900 dark:text-purple-300 mt-1">
                    BANNED
                  </p>
                </div>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-foreground text-center mt-4">
                {doc.total_clauses} TOTAL CLAUSES ANALYZED
              </p>
            </div>

            {/* Summary — only if owner enabled */}
            {settings.show_summary && doc.summary && (
              <>
                <div className="mb-8 pt-6 border-t-4 border-black border-dashed">
                  <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-4">
                    ANALYSIS SUMMARY
                  </h3>
                  <p className="text-base font-medium text-foreground leading-relaxed p-4 border-l-4 border-black bg-gray-50 dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {doc.summary}
                  </p>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="space-y-4 mb-4 pt-6 border-t-4 border-black border-dashed">
              {/* Full Analysis — only if owner enabled */}
              {settings.allow_full_analysis && (
                <Link
                  href={`/results/${doc.id}`}
                  className="flex items-center justify-center gap-3 w-full px-4 py-4 border-4 border-black bg-blue-400 hover:bg-blue-500 text-black text-sm font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all"
                >
                  <ExternalLink className="h-5 w-5 stroke-[3px]" />
                  VIEW FULL ANALYSIS
                </Link>
              )}

              <Link
                href="/upload"
                className="flex items-center justify-center gap-3 w-full px-4 py-4 border-4 border-black bg-white dark:bg-zinc-900 text-foreground text-sm font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all"
              >
                <Search className="h-5 w-5 stroke-[3px]" />
                ANALYZE YOUR OWN CONTRACT
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-6 border-t-4 border-black bg-gray-100 dark:bg-zinc-900">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-black dark:text-foreground stroke-[3px]" />
              <span className="text-base font-black uppercase tracking-widest">
                CLAUSEWALL
              </span>
            </div>
            <p className="text-xs text-center font-bold text-foreground uppercase tracking-widest leading-relaxed">
              India&apos;s AI Contract Analyzer. This verification is valid as
              of the date shown. Contract terms may have changed since
              verification. This is not legal advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Not Found State ──────────────────────────

function NotFound() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-bold mb-2">Verification Not Found</h1>
        <p className="text-sm text-foreground mb-6">
          This verification link is invalid or has expired. The contract owner
          may have removed it.
        </p>
        <Link
          href="/upload"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-none bg-blue-600 hover:bg-blue-700 text-foreground text-sm font-medium transition-colors"
        >
          <Search className="h-4 w-4" />
          Analyze Your Contract
        </Link>
      </div>
    </div>
  );
}
