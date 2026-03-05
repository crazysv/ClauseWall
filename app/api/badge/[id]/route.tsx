// ============================================
// EMBED BADGE — SVG Generator
// Returns dynamic SVG badge for embedding
// ============================================

import { createAdminClient } from "@/lib/supabase/admin";
import { getRiskLevel } from "@/lib/utils/constants";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600;

const BADGE_THEMES = {
  safe: { bg: "#064e3b", text: "#4ade80", label: "Verified Safe", icon: "✅" },
  warning: { bg: "#78350f", text: "#facc15", label: "Reviewed", icon: "⚠️" },
  dangerous: { bg: "#7f1d1d", text: "#f87171", label: "Needs Review", icon: "🔴" },
  illegal: { bg: "#3b0764", text: "#c084fc", label: "High Risk", icon: "⛔" },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const style = searchParams.get("style") || "full";

    console.log("Badge request for ID:", id); // Debug log

    const supabase = createAdminClient();

    // Try to find by public_share_id first
    let { data: doc, error } = await supabase
      .from("documents")
      .select("overall_risk_score, document_type, public_share_id, verification_tier")
      .eq("public_share_id", id)
      .single();

    // If not found by public_share_id, try by document id
    if (error || !doc) {
      console.log("Not found by public_share_id, trying document id..."); // Debug
      const result = await supabase
        .from("documents")
        .select("overall_risk_score, document_type, public_share_id, verification_tier")
        .eq("id", id)
        .single();
      
      doc = result.data;
      error = result.error;
    }

    if (error || !doc) {
      console.log("Document not found:", error); // Debug log
      return notFoundBadge();
    }

    console.log("Found document:", doc); // Debug log

    const riskLevel = getRiskLevel(doc.overall_risk_score);
    const theme = BADGE_THEMES[riskLevel];
    const shareId = doc.public_share_id || id;
    const verifyUrl = `https://clause-wall.vercel.app/verify/${shareId}`;

    let svg: string;

    if (style === "shield") {
      svg = generateShieldBadge(doc.overall_risk_score, theme);
    } else if (style === "compact") {
      svg = generateCompactBadge(doc.overall_risk_score, theme);
    } else {
      svg = generateFullBadge(doc.overall_risk_score, theme, verifyUrl);
    }

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err) {
    console.error("Badge error:", err);
    return notFoundBadge();
  }
}

function generateShieldBadge(score: number, theme: typeof BADGE_THEMES.safe): string {
  const width = 220;
  const labelWidth = 90;
  const scoreWidth = width - labelWidth;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="28" viewBox="0 0 ${width} 28">
    <rect rx="6" width="${labelWidth}" height="28" fill="#1e293b"/>
    <rect rx="6" x="${labelWidth}" width="${scoreWidth}" height="28" fill="${theme.bg}"/>
    <rect rx="6" x="${labelWidth - 6}" width="6" height="28" fill="#1e293b"/>
    <text x="12" y="18" fill="#e2e8f0" font-family="system-ui,sans-serif" font-size="11" font-weight="600">🛡️ ClauseWall</text>
    <text x="${labelWidth + 12}" y="18" fill="${theme.text}" font-family="system-ui,sans-serif" font-size="11" font-weight="700">${theme.icon} ${score}/100</text>
  </svg>`;
}

function generateCompactBadge(score: number, theme: typeof BADGE_THEMES.safe): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="56" viewBox="0 0 180 56">
    <rect rx="10" width="180" height="56" fill="#0f172a"/>
    <rect rx="10" width="180" height="56" fill="none" stroke="${theme.text}" stroke-opacity="0.3" stroke-width="1.5"/>
    <text x="14" y="22" fill="${theme.text}" font-family="system-ui,sans-serif" font-size="12" font-weight="700">🛡️ ClauseWall</text>
    <text x="14" y="42" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="13">Score: </text>
    <text x="62" y="42" fill="${theme.text}" font-family="system-ui,sans-serif" font-size="13" font-weight="700">${score}/100 ${theme.icon}</text>
  </svg>`;
}

function generateFullBadge(score: number, theme: typeof BADGE_THEMES.safe, url: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="90" viewBox="0 0 300 90">
    <rect rx="12" width="300" height="90" fill="#0f172a"/>
    <rect rx="12" width="300" height="90" fill="none" stroke="${theme.text}" stroke-opacity="0.2" stroke-width="1.5"/>
    
    <!-- Header -->
    <text x="18" y="28" fill="#ffffff" font-family="system-ui,sans-serif" font-size="15" font-weight="800">🛡️ CLAUSEWALL VERIFIED</text>
    
    <!-- Score line -->
    <text x="18" y="50" fill="#e2e8f0" font-family="system-ui,sans-serif" font-size="13">
      Score: <tspan fill="${theme.text}" font-weight="700">${score}/100</tspan>
      <tspan fill="#64748b"> · </tspan>
      <tspan fill="${theme.text}">${theme.label}</tspan>
    </text>
    
    <!-- Footer -->
    <text x="18" y="72" fill="#64748b" font-family="system-ui,sans-serif" font-size="10">Click to verify · clausewall.vercel.app</text>
    
    <!-- Score box -->
    <rect x="255" y="20" rx="8" width="32" height="50" fill="${theme.bg}"/>
    <text x="271" y="52" text-anchor="middle" fill="${theme.text}" font-family="system-ui,sans-serif" font-size="16" font-weight="800">${score}</text>
  </svg>`;
}

function notFoundBadge(): Response {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="28" viewBox="0 0 220 28">
    <rect rx="6" width="220" height="28" fill="#1e293b"/>
    <text x="12" y="18" fill="#64748b" font-family="system-ui,sans-serif" font-size="11">🛡️ ClauseWall · Not Found</text>
  </svg>`;
  return new Response(svg, {
    status: 404,
    headers: { "Content-Type": "image/svg+xml" },
  });
}