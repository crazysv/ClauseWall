// ============================================
// OG IMAGE GENERATOR
// Auto-generates preview images when links
// are shared on WhatsApp/Twitter/LinkedIn
// ============================================

import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getDocumentTypeLabel,
  getStateName,
  getRiskLevel,
} from "@/lib/utils/constants";

export const runtime = "nodejs";

// Cache for 1 hour
export const revalidate = 3600;

const THEMES = {
  safe: { bg: "#064e3b", accent: "#22c55e", label: "LOW RISK", emoji: "✅" },
  warning: {
    bg: "#78350f",
    accent: "#eab308",
    label: "MEDIUM RISK",
    emoji: "⚠️",
  },
  dangerous: {
    bg: "#7f1d1d",
    accent: "#ef4444",
    label: "HIGH RISK",
    emoji: "🔴",
  },
  illegal: {
    bg: "#3b0764",
    accent: "#a855f7",
    label: "CRITICAL RISK",
    emoji: "⛔",
  },
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: doc, error } = await supabase
      .from("documents")
      .select(
        "overall_risk_score, document_type, jurisdiction, safe_count, warning_count, dangerous_count, illegal_count, total_clauses",
      )
      .eq("id", id)
      .single();

    if (error || !doc) {
      return new Response("Not found", { status: 404 });
    }

    const riskLevel = getRiskLevel(doc.overall_risk_score);
    const theme = THEMES[riskLevel];
    const docType = getDocumentTypeLabel(doc.document_type);
    const state = getStateName(doc.jurisdiction);

    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          background: `linear-gradient(135deg, ${theme.bg} 0%, #111827 100%)`,
          padding: 60,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Left — Score */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 60,
          }}
        >
          <div
            style={{
              fontSize: 120,
              fontWeight: 800,
              color: theme.accent,
              lineHeight: 1,
            }}
          >
            {doc.overall_risk_score}
          </div>
          <div
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.4)",
              marginTop: 4,
            }}
          >
            / 100
          </div>
          <div
            style={{
              marginTop: 16,
              padding: "8px 24px",
              borderRadius: 100,
              background: `${theme.accent}25`,
              border: `2px solid ${theme.accent}60`,
              fontSize: 18,
              fontWeight: 700,
              color: theme.accent,
              letterSpacing: 2,
            }}
          >
            {theme.emoji} {theme.label}
          </div>
        </div>

        {/* Vertical divider */}
        <div
          style={{
            width: 2,
            height: 300,
            background: "rgba(255,255,255,0.1)",
            marginRight: 60,
          }}
        />

        {/* Right — Details */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          {/* Branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <span style={{ fontSize: 32 }}>🛡️</span>
            <span
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: 1,
              }}
            >
              ClauseWall
            </span>
          </div>

          {/* Doc Info */}
          <div
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.7)",
              marginBottom: 8,
            }}
          >
            📄 {docType}
          </div>
          <div
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.7)",
              marginBottom: 32,
            }}
          >
            📍 {state}
          </div>

          {/* Clause Stats */}
          <div
            style={{
              display: "flex",
              gap: 24,
              marginBottom: 32,
            }}
          >
            {[
              { n: doc.illegal_count, l: "Illegal", c: "#a855f7" },
              { n: doc.dangerous_count, l: "Dangerous", c: "#ef4444" },
              { n: doc.warning_count, l: "Warning", c: "#eab308" },
              { n: doc.safe_count, l: "Safe", c: "#22c55e" },
            ].map((item) => (
              <div
                key={item.l}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: item.c,
                  }}
                >
                  {item.n}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  {item.l}
                </span>
              </div>
            ))}
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.3)",
            }}
          >
            India&apos;s AI Contract Analyzer · clause-wall.vercel.app
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (err) {
    console.error("OG image error:", err);
    return new Response("Error generating image", { status: 500 });
  }
}
