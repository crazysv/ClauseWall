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
    (doc.verification_tier as VerificationTier) || "needs_work"
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
    `
    )
    .eq("public_share_id", shareId)
    .single();

  if (error || !doc) {
    return <NotFound />;
  }

  // Track this view
  await supabase.rpc("increment_share_count", { p_share_id: shareId });

  const tier = getTierConfig(
    (doc.verification_tier as VerificationTier) || "needs_work"
  );
  const settings: ShareSettings = (doc.share_settings as ShareSettings) || {
    show_entity: false,
    show_summary: false,
    allow_full_analysis: false,
  };

  const formattedDate = new Date(
    doc.qr_generated_at || doc.created_at
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const viewCount = (doc.share_count || 0) + 1; // +1 for current view

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-8">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-10"
          style={{ backgroundColor: tier.color }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Main Card */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden">
          {/* Top color stripe */}
          <div className="h-1.5" style={{ backgroundColor: tier.color }} />

          <div className="p-6 sm:p-8">
            {/* Badge Icon + Label */}
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{tier.icon}</div>
              <h1
                className="text-xl sm:text-2xl font-bold"
                style={{ color: tier.color }}
              >
                {tier.label}
              </h1>
            </div>

            {/* Score Gauge */}
            <div className="flex justify-center mb-6">
              <div
                className="relative h-28 w-28 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(${tier.color} ${doc.overall_risk_score}%, rgba(255,255,255,0.05) 0)`,
                }}
              >
                <div className="absolute inset-2.5 bg-gray-900 rounded-full flex flex-col items-center justify-center">
                  <span
                    className="text-3xl font-bold"
                    style={{ color: tier.color }}
                  >
                    {doc.overall_risk_score}
                  </span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-center text-sm text-muted-foreground mb-6">
              {tier.description}
            </p>

            {/* Divider */}
            <div className="h-px bg-white/5 mb-6" />

            {/* Contract Details */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">
                  {getDocumentTypeLabel(doc.document_type)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Jurisdiction:</span>
                <span className="font-medium">
                  {getStateName(doc.jurisdiction)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Verified:</span>
                <span className="font-medium">{formattedDate}</span>
              </div>

              {/* Entity — only if owner enabled */}
              {settings.show_entity && doc.entity_name && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Entity:</span>
                  <span className="font-medium">{doc.entity_name}</span>
                </div>
              )}

              {viewCount > 1 && (
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Verified by {viewCount} people
                  </span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5 mb-6" />

            {/* Clause Breakdown */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Clause Breakdown
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-2.5 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-green-400">
                    {doc.safe_count}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Safe</p>
                </div>
                <div className="text-center p-2.5 rounded-lg bg-yellow-500/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-yellow-400">
                    {doc.warning_count}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Warning</p>
                </div>
                <div className="text-center p-2.5 rounded-lg bg-red-500/10">
                  <XCircle className="h-4 w-4 text-red-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-red-400">
                    {doc.dangerous_count}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Dangerous
                  </p>
                </div>
                <div className="text-center p-2.5 rounded-lg bg-purple-500/10">
                  <Ban className="h-4 w-4 text-purple-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-purple-400">
                    {doc.illegal_count}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Illegal</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                {doc.total_clauses} total clauses analyzed
              </p>
            </div>

            {/* Summary — only if owner enabled */}
            {settings.show_summary && doc.summary && (
              <>
                <div className="h-px bg-white/5 mb-6" />
                <div className="mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Analysis Summary
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {doc.summary}
                  </p>
                </div>
              </>
            )}

            {/* Divider */}
            <div className="h-px bg-white/5 mb-6" />

            {/* Actions */}
            <div className="space-y-3">
              {/* Full Analysis — only if owner enabled */}
              {settings.allow_full_analysis && (
                <Link
                  href={`/results/${doc.id}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Full Analysis
                </Link>
              )}

              <Link
                href="/upload"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-colors"
              >
                <Search className="h-4 w-4" />
                Analyze Your Own Contract
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 sm:px-8 py-4 bg-white/[0.02] border-t border-white/5">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-semibold">ClauseWall</span>
            </div>
            <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
              India&apos;s AI Contract Analyzer. This verification is valid as of the
              date shown. Contract terms may have changed since verification.
              This is not legal advice.
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
        <p className="text-sm text-muted-foreground mb-6">
          This verification link is invalid or has expired. The contract owner
          may have removed it.
        </p>
        <Link
          href="/upload"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          <Search className="h-4 w-4" />
          Analyze Your Contract
        </Link>
      </div>
    </div>
  );
}