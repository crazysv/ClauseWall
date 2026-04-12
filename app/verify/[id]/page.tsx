// ============================================
// PUBLIC VERIFICATION PAGE
// /verify/[shareId] — Scanned via QR code
// Server Component for fast mobile loading
// ============================================

import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();

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
  const supabase = await createClient();

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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#050505]">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/20 via-[#050505] to-[#050505]" />

      <div className="relative w-full max-w-md">
        {/* Main Card */}
        <div className="bg-[#0a0a0a] border border-neutral-900 rounded-sm relative overflow-hidden">
          {/* Top color stripe pseudo-edge glow */}
          <div
            className="absolute top-0 inset-x-0 h-[1px]"
            style={{ backgroundColor: tier.color, boxShadow: `0 0 10px ${tier.color}` }}
          />

          <div className="p-6 sm:p-8">
            {/* Badge Icon + Label */}
            <div className="text-center mb-8 border-b border-neutral-900 pb-8">
              <div className="inline-flex items-center justify-center h-16 w-16 mb-4 rounded-sm border border-neutral-800 bg-[#050505]">
                <span className="text-3xl filter grayscale opacity-80">{tier.icon}</span>
              </div>
              <h1 className="text-xl font-mono uppercase tracking-widest text-white">
                [ STATUS: <span style={{ color: tier.color }}>{tier.label}</span> ]
              </h1>
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mt-2">
                SYS.CLEARANCE.NODE // PUBLIC
              </p>
            </div>

            {/* Score Gauge -> Telemetry Factor */}
            <div className="flex justify-center mb-8">
              <div className="bg-[#050505] border border-neutral-900 rounded-sm p-5 w-full text-center relative overflow-hidden">
                <p className="text-[9px] font-mono text-neutral-500 tracking-widest uppercase mb-4">
                  [OVERALL VULNERABILITY FACTOR]
                </p>
                <div className="mb-2">
                  <span
                    className="font-mono text-5xl tracking-tighter"
                    style={{ color: tier.color }}
                  >
                    {doc.overall_risk_score}
                  </span>
                </div>
                <div className="text-[9px] font-mono text-neutral-600 tracking-widest uppercase mt-3">
                  {tier.description}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-neutral-900 mb-6" />

            {/* Contract Details */}
            <div className="space-y-3 mb-8 pt-6 border-t border-neutral-900">
              <div className="flex bg-[#050505] border border-neutral-900 p-2 items-center gap-4 text-[9px] font-mono uppercase tracking-widest">
                <FileText className="h-4 w-4 text-neutral-600 flex-shrink-0" />
                <span className="text-neutral-500 w-24">TYPE</span>
                <span className="text-neutral-300">
                  {getDocumentTypeLabel(doc.document_type)}
                </span>
              </div>
              <div className="flex bg-[#050505] border border-neutral-900 p-2 items-center gap-4 text-[9px] font-mono uppercase tracking-widest">
                <MapPin className="h-4 w-4 text-neutral-600 flex-shrink-0" />
                <span className="text-neutral-500 w-24">JURISDICTION</span>
                <span className="text-neutral-300">
                  {getStateName(doc.jurisdiction)}
                </span>
              </div>
              <div className="flex bg-[#050505] border border-neutral-900 p-2 items-center gap-4 text-[9px] font-mono uppercase tracking-widest">
                <Calendar className="h-4 w-4 text-neutral-600 flex-shrink-0" />
                <span className="text-neutral-500 w-24">VERIFIED</span>
                <span className="text-neutral-300">
                  {formattedDate}
                </span>
              </div>

              {/* Entity — only if owner enabled */}
              {settings.show_entity && doc.entity_name && (
                <div className="flex bg-[#050505] border border-cyan-900/50 p-2 items-center gap-4 text-[9px] font-mono uppercase tracking-widest">
                  <Building2 className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                  <span className="text-cyan-600/60 w-24">ENTITY</span>
                  <span className="text-cyan-500">
                    {doc.entity_name}
                  </span>
                </div>
              )}

              {viewCount > 1 && (
                <div className="flex bg-[#0a0a0a] border border-neutral-800 p-2 items-center gap-4 text-[9px] font-mono uppercase tracking-widest mt-4">
                  <Users className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                  <span className="text-neutral-400">
                    VERIFIED BY {viewCount} NODES
                  </span>
                </div>
              )}
            </div>

            {/* Clause Breakdown */}
            <div className="mb-8 pt-6 border-t border-neutral-900">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-4">
                [ TACTICAL CLAUSE BREAKDOWN ]
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-3 border border-emerald-900/30 bg-[#050505]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto mb-2" />
                  <p className="text-lg font-mono tracking-tighter text-emerald-500">
                    {doc.safe_count}
                  </p>
                  <p className="text-[9px] font-mono tracking-widest text-emerald-700 mt-1">
                    SAFE
                  </p>
                </div>
                <div className="text-center p-3 border border-amber-900/30 bg-[#050505]">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mx-auto mb-2" />
                  <p className="text-lg font-mono tracking-tighter text-amber-500">
                    {doc.warning_count}
                  </p>
                  <p className="text-[9px] font-mono tracking-widest text-amber-700 mt-1">
                    WARN
                  </p>
                </div>
                <div className="text-center p-3 border border-red-900/30 bg-[#050505]">
                  <XCircle className="h-4 w-4 text-red-600 mx-auto mb-2" />
                  <p className="text-lg font-mono tracking-tighter text-red-500">
                    {doc.dangerous_count}
                  </p>
                  <p className="text-[9px] font-mono tracking-widest text-red-700 mt-1">
                    DANG
                  </p>
                </div>
                <div className="text-center p-3 border border-red-900/70 bg-[#050505] relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-px bg-red-600/50" />
                  <Ban className="h-4 w-4 text-red-500 mx-auto mb-2" />
                  <p className="text-lg font-mono tracking-tighter text-red-500">
                    {doc.illegal_count}
                  </p>
                  <p className="text-[9px] font-mono tracking-widest text-red-600 mt-1">
                    ILLEGAL
                  </p>
                </div>
              </div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 text-center mt-4">
                {doc.total_clauses} VECTORS ANALYZED
              </p>
            </div>

            {/* Summary — only if owner enabled */}
            {settings.show_summary && doc.summary && (
              <>
                <div className="mb-8 pt-6 border-t border-neutral-900">
                  <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-4">
                    [ EXECUTIVE SUMMARY ]
                  </h3>
                  <p className="text-[11px] font-mono text-neutral-400 leading-relaxed p-4 border border-neutral-900 bg-[#050505]">
                    {doc.summary}
                  </p>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="space-y-3 mb-4 pt-6 border-t border-neutral-900">
              {/* Full Analysis — only if owner enabled */}
              {settings.allow_full_analysis && (
                <Link
                  href={`/results/${doc.id}`}
                  className="flex items-center justify-center gap-3 w-full px-4 py-3 border border-cyan-900/50 hover:bg-cyan-950/20 text-cyan-500 text-[10px] font-mono uppercase tracking-widest transition-all"
                >
                  <ExternalLink className="h-3 w-3" />
                  [ ACCESS FULL ANALYSIS ARRAY ]
                </Link>
              )}

              <Link
                href="/upload"
                className="flex items-center justify-center gap-3 w-full px-4 py-3 border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-[10px] font-mono uppercase tracking-widest transition-all"
              >
                <Search className="h-3 w-3" />
                [ INITIATE OWN CONTRACT SCAN ]
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-6 border-t border-neutral-900 bg-[#050505]">
            <div className="flex items-center justify-center gap-2 mb-3 filter grayscale opacity-50">
              <Shield className="h-4 w-4 text-white" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white">
                CLAUSEWALL
              </span>
            </div>
            <p className="text-[8px] text-center font-mono text-neutral-600 uppercase tracking-widest leading-relaxed">
              India&apos;s AI Contract Analyzer. Verification valid as
              of date shown. Terms may have changed. Not legal advice.
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#050505]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/20 via-[#050505] to-[#050505]" />
      
      <div className="text-center max-w-sm relative z-10 p-8 border border-neutral-900 bg-[#0a0a0a]">
        <div className="inline-flex items-center justify-center h-16 w-16 mb-4 rounded-sm border border-neutral-800 bg-[#050505]">
          <span className="text-3xl filter grayscale opacity-50">🔍</span>
        </div>
        <h1 className="text-xl font-mono text-white mb-2 uppercase tracking-widest">[ERR: NODE_NOT_FOUND]</h1>
        <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-6">
          VERIFICATION LINK INVALID OR EXPIRED.
          <br />TARGET ARRAY TERMINATED.
        </p>
        <Link
          href="/upload"
          className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-[10px] font-mono uppercase tracking-widest transition-all"
        >
          <Search className="h-3 w-3" />
          [ INITIATE OWN CONTRACT SCAN ]
        </Link>
      </div>
    </div>
  );
}
