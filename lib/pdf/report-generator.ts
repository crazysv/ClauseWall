// ============================================
// PDF REPORT GENERATOR
// Downloads full analysis as a PDF report
// ============================================

import jsPDF from "jspdf";
import type { Document, Clause } from "@/types";

const RISK_COLORS: Record<string, [number, number, number]> = {
  safe: [34, 197, 94],
  warning: [234, 179, 8],
  dangerous: [239, 68, 68],
  illegal: [168, 85, 247],
};

const RISK_LABELS: Record<string, string> = {
  safe: "SAFE",
  warning: "WARNING",
  dangerous: "DANGEROUS",
  illegal: "ILLEGAL",
};

/**
 * Generate and download a PDF report of the analysis
 */
export async function generateReport(
  doc: Document,
  clauses: Clause[]
): Promise<void> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper: Check if we need a new page
  const checkNewPage = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      pdf.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Helper: Draw text with word wrap
  const drawWrappedText = (
    text: string,
    x: number,
    startY: number,
    maxWidth: number,
    fontSize: number,
    color: [number, number, number] = [200, 200, 200]
  ): number => {
    pdf.setFontSize(fontSize);
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * 0.45;

    for (const line of lines) {
      checkNewPage(lineHeight + 2);
      pdf.text(line, x, y);
      y += lineHeight;
    }

    return y;
  };

  // ── Page Background ──
  const drawBackground = () => {
    pdf.setFillColor(10, 10, 15);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");
  };

  drawBackground();

  // Listen for new pages to draw background
  const originalAddPage = pdf.addPage.bind(pdf);
  pdf.addPage = (...args: Parameters<typeof pdf.addPage>) => {
    const result = originalAddPage(...args);
    drawBackground();
    return result;
  };

  // ── HEADER ──
  pdf.setFillColor(15, 15, 25);
  pdf.roundedRect(margin, y, contentWidth, 45, 3, 3, "F");

  // Title
  pdf.setFontSize(22);
  pdf.setTextColor(255, 255, 255);
  pdf.text("ClauseWall", margin + 8, y + 12);

  pdf.setFontSize(9);
  pdf.setTextColor(148, 163, 184);
  pdf.text("Contract Analysis Report", margin + 8, y + 19);

  // Score circle
  const scoreX = pageWidth - margin - 22;
  const scoreY = y + 22;
  const scoreColor = RISK_COLORS[getRiskLevel(doc.overall_risk_score)] || [148, 163, 184];

  pdf.setDrawColor(...scoreColor);
  pdf.setLineWidth(1.5);
  pdf.circle(scoreX, scoreY, 12, "S");

  pdf.setFontSize(16);
  pdf.setTextColor(...scoreColor);
  pdf.text(String(doc.overall_risk_score), scoreX, scoreY + 1, {
    align: "center",
  });

  pdf.setFontSize(6);
  pdf.setTextColor(148, 163, 184);
  pdf.text("RISK SCORE", scoreX, scoreY + 7, { align: "center" });

  y += 52;

  // ── DOCUMENT INFO ──
  pdf.setFillColor(20, 20, 30);
  pdf.roundedRect(margin, y, contentWidth, 22, 2, 2, "F");

  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);

  const infoItems = [
    `File: ${doc.original_filename || "N/A"}`,
    `Type: ${doc.document_type}`,
    `State: ${doc.jurisdiction}`,
    `Clauses: ${doc.total_clauses}`,
    `Date: ${new Date(doc.created_at).toLocaleDateString("en-IN")}`,
  ];

  const infoSpacing = contentWidth / infoItems.length;
  infoItems.forEach((item, i) => {
    pdf.text(item, margin + 4 + i * infoSpacing, y + 9);
  });

  y += 28;

  // ── RISK BREAKDOWN ──
  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);
  pdf.text("Risk Breakdown", margin, y + 5);
  y += 10;

  const breakdownData = [
    { label: "Safe", count: doc.safe_count, color: RISK_COLORS.safe },
    { label: "Warning", count: doc.warning_count, color: RISK_COLORS.warning },
    { label: "Dangerous", count: doc.dangerous_count, color: RISK_COLORS.dangerous },
    { label: "Illegal", count: doc.illegal_count, color: RISK_COLORS.illegal },
  ];

  const boxWidth = (contentWidth - 12) / 4;

  breakdownData.forEach((item, i) => {
    const bx = margin + i * (boxWidth + 4);

    pdf.setFillColor(20, 20, 30);
    pdf.roundedRect(bx, y, boxWidth, 18, 2, 2, "F");

    pdf.setFontSize(16);
    pdf.setTextColor(...item.color);
    pdf.text(String(item.count), bx + boxWidth / 2, y + 10, {
      align: "center",
    });

    pdf.setFontSize(7);
    pdf.setTextColor(148, 163, 184);
    pdf.text(item.label, bx + boxWidth / 2, y + 15, { align: "center" });
  });

  y += 25;

  // ── SUMMARY ──
  if (doc.summary) {
    checkNewPage(30);

    pdf.setFontSize(11);
    pdf.setTextColor(255, 255, 255);
    pdf.text("Summary", margin, y + 5);
    y += 10;

    drawWrappedText(doc.summary, margin, y, contentWidth, 9, [180, 180, 190]);
    y += 8;
  }

  // ── CLAUSE ANALYSIS ──
  checkNewPage(15);

  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);
  pdf.text("Clause-by-Clause Analysis", margin, y + 5);
  y += 12;

  // Sort: illegal first, then dangerous, warning, safe
  const sortedClauses = [...clauses].sort((a, b) => {
    const order: Record<string, number> = {
      illegal: 0,
      dangerous: 1,
      warning: 2,
      safe: 3,
    };
    return (order[a.risk_level] ?? 4) - (order[b.risk_level] ?? 4);
  });

  for (const clause of sortedClauses) {
    const riskColor = RISK_COLORS[clause.risk_level] || [148, 163, 184];
    const riskLabel = RISK_LABELS[clause.risk_level] || "UNKNOWN";

    // Estimate height needed
    const clauseLines = pdf.splitTextToSize(
      clause.original_text.slice(0, 300),
      contentWidth - 16
    );
    const explanationLines = pdf.splitTextToSize(
      clause.explanation,
      contentWidth - 16
    );
    const estimatedHeight =
      20 + clauseLines.length * 4 + explanationLines.length * 4 + 10;

    checkNewPage(Math.min(estimatedHeight, 80));

    // Clause card background
    pdf.setFillColor(15, 15, 25);
    const cardHeight = Math.min(estimatedHeight, pageHeight - y - margin);
    pdf.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, "F");

    // Risk color bar on left
    pdf.setFillColor(...riskColor);
    pdf.rect(margin, y, 3, cardHeight, "F");

    // Clause header
    const headerY = y + 6;
    pdf.setFontSize(9);
    pdf.setTextColor(...riskColor);
    pdf.text(`#${clause.clause_number} — ${clause.clause_type}`, margin + 8, headerY);

    // Risk badge
    pdf.setFontSize(7);
    const badgeX = pageWidth - margin - 25;
    pdf.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
    pdf.roundedRect(badgeX, headerY - 4, 22, 6, 1, 1, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.text(riskLabel, badgeX + 11, headerY, { align: "center" });

    // Score
    pdf.setFontSize(7);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Score: ${clause.risk_score}/100`, badgeX - 20, headerY);

    y = headerY + 5;

    // Original text
    pdf.setFontSize(8);
    pdf.setTextColor(160, 160, 170);
    const displayText =
      clause.original_text.length > 300
        ? clause.original_text.slice(0, 300) + "..."
        : clause.original_text;
    const textLines = pdf.splitTextToSize(displayText, contentWidth - 16);
    for (const line of textLines.slice(0, 5)) {
      checkNewPage(5);
      pdf.text(line, margin + 8, y);
      y += 4;
    }

    y += 2;

    // Explanation
    pdf.setFontSize(8);
    pdf.setTextColor(200, 200, 210);
    const expLines = pdf.splitTextToSize(clause.explanation, contentWidth - 16);
    for (const line of expLines.slice(0, 4)) {
      checkNewPage(5);
      pdf.text(line, margin + 8, y);
      y += 4;
    }

    // Legal citation
    if (clause.legal_citation) {
      y += 1;
      checkNewPage(6);
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Law: ${clause.legal_citation}`, margin + 8, y);
      y += 4;
    }

    y += 6;
  }

  // ── FOOTER ──
  checkNewPage(20);
  y += 5;

  pdf.setDrawColor(30, 30, 45);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text("Generated by ClauseWall — clausewall.com", margin, y);
  pdf.text(
    `Report ID: ${doc.id.slice(0, 8)}`,
    pageWidth - margin,
    y,
    { align: "right" }
  );

  y += 5;
  pdf.setFontSize(7);
  pdf.text(
    "Disclaimer: This analysis is AI-assisted and does not constitute legal advice. Consult a qualified lawyer.",
    margin,
    y
  );

  // ── SAVE ──
  const fileName = `clausewall-report-${doc.id.slice(0, 8)}.pdf`;
  pdf.save(fileName);
}

// ── Helper ──
function getRiskLevel(score: number): string {
  if (score >= 75) return "illegal";
  if (score >= 50) return "dangerous";
  if (score >= 25) return "warning";
  return "safe";
}