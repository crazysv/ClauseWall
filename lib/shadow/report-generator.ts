// ============================================
// SHADOW REPORT GENERATOR
// Generates Promise vs Contract PDF report
// using jsPDF with ClauseWall dark theme
// ============================================

import jsPDF from 'jspdf';
import type { ShadowAnalysis, ContractMismatch, MismatchSeverity } from '@/types';

const SEVERITY_COLORS: Record<MismatchSeverity, [number, number, number]> = {
  critical: [239, 68, 68],
  major: [249, 115, 22],
  minor: [234, 179, 8],
  info: [59, 130, 246],
};

const SEVERITY_LABELS: Record<MismatchSeverity, string> = {
  critical: 'CRITICAL',
  major: 'MAJOR',
  minor: 'MINOR',
  info: 'INFO',
};

const MISMATCH_TYPE_LABELS: Record<string, string> = {
  direct_contradiction: 'Direct Contradiction',
  missing_promise: 'Missing Promise',
  weakened_promise: 'Weakened Promise',
  hidden_condition: 'Hidden Condition',
  amount_mismatch: 'Amount Mismatch',
  timeline_mismatch: 'Timeline Mismatch',
  scope_mismatch: 'Scope Mismatch',
};

/**
 * Generate the Promise vs Contract PDF report
 * Returns a Blob for upload or download
 */
export function generateShadowReportPDF(
  analysis: ShadowAnalysis,
  documentType: string,
  entityName: string | null
): Blob {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
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
      drawBackground();
      y = margin;
      return true;
    }
    return false;
  };

  // Helper: Draw wrapped text
  const drawWrappedText = (
    text: string,
    x: number,
    maxWidth: number,
    fontSize: number,
    color: [number, number, number] = [200, 200, 200]
  ): void => {
    pdf.setFontSize(fontSize);
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * 0.45;
    for (const line of lines) {
      checkNewPage(lineHeight + 2);
      pdf.text(line, x, y);
      y += lineHeight;
    }
  };

  // Background
  const drawBackground = () => {
    pdf.setFillColor(10, 10, 15);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  };

  drawBackground();

  // ── PAGE 1: COVER ──
  y = pageHeight * 0.3;
  pdf.setFontSize(28);
  pdf.setTextColor(255, 255, 255);
  pdf.text('PROMISE vs. CONTRACT', pageWidth / 2, y, { align: 'center' });
  y += 12;
  pdf.setFontSize(16);
  pdf.setTextColor(245, 158, 11);
  pdf.text('ANALYSIS REPORT', pageWidth / 2, y, { align: 'center' });
  y += 16;

  pdf.setFontSize(10);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Prepared by ClauseWall', pageWidth / 2, y, { align: 'center' });
  y += 6;
  pdf.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, pageWidth / 2, y, { align: 'center' });
  y += 6;
  pdf.text(`Document Type: ${documentType}`, pageWidth / 2, y, { align: 'center' });
  y += 6;
  if (entityName) {
    pdf.text(`Other Party: ${entityName}`, pageWidth / 2, y, { align: 'center' });
  }

  // ── PAGE 2: EXECUTIVE SUMMARY ──
  pdf.addPage();
  drawBackground();
  y = margin;

  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Executive Summary', margin, y + 5);
  y += 15;

  // Trust Score
  const scoreColor = analysis.overall_trust_score >= 80
    ? [34, 197, 94] as [number, number, number]
    : analysis.overall_trust_score >= 50
    ? [234, 179, 8] as [number, number, number]
    : analysis.overall_trust_score >= 20
    ? [249, 115, 22] as [number, number, number]
    : [239, 68, 68] as [number, number, number];

  pdf.setDrawColor(...scoreColor);
  pdf.setLineWidth(2);
  const scoreX = margin + 25;
  const scoreY = y + 15;
  pdf.circle(scoreX, scoreY, 15, 'S');
  pdf.setFontSize(20);
  pdf.setTextColor(...scoreColor);
  pdf.text(String(analysis.overall_trust_score), scoreX, scoreY + 2, { align: 'center' });
  pdf.setFontSize(6);
  pdf.setTextColor(148, 163, 184);
  pdf.text('TRUST SCORE', scoreX, scoreY + 9, { align: 'center' });

  // Stats
  const statsX = margin + 55;
  pdf.setFontSize(9);
  pdf.setTextColor(200, 200, 210);
  pdf.text(`Total Promises Found: ${analysis.total_promises_found}`, statsX, y + 5);
  pdf.text(`Total Mismatches: ${analysis.total_mismatches}`, statsX, y + 11);

  pdf.setTextColor(239, 68, 68);
  pdf.text(`Critical: ${analysis.critical_mismatches}`, statsX, y + 17);
  pdf.setTextColor(249, 115, 22);
  pdf.text(`Major: ${analysis.major_mismatches}`, statsX + 40, y + 17);
  pdf.setTextColor(234, 179, 8);
  pdf.text(`Minor: ${analysis.minor_mismatches}`, statsX + 72, y + 17);

  y += 40;

  // Summary text
  if (analysis.summary) {
    drawWrappedText(analysis.summary, margin, contentWidth, 9, [180, 180, 190]);
    y += 8;
  }

  // Evidence sources
  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Evidence Sources', margin, y + 5);
  y += 10;

  for (const source of analysis.evidence_sources) {
    const typeLabel = source.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const wordCount = source.metadata.word_count || 0;
    drawWrappedText(
      `• ${typeLabel}${source.filename ? ` (${source.filename})` : ''} — ${wordCount} words`,
      margin + 4,
      contentWidth - 8,
      8,
      [148, 163, 184]
    );
    y += 2;
  }

  // ── MISMATCH TABLE PAGES ──
  if (analysis.mismatches.length > 0) {
    pdf.addPage();
    drawBackground();
    y = margin;

    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text('Promise vs. Contract — Mismatches', margin, y + 5);
    y += 15;

    for (let i = 0; i < analysis.mismatches.length; i++) {
      const mismatch = analysis.mismatches[i];
      const sevColor = SEVERITY_COLORS[mismatch.severity] || [148, 163, 184];
      const sevLabel = SEVERITY_LABELS[mismatch.severity] || 'UNKNOWN';
      const typeLabel = MISMATCH_TYPE_LABELS[mismatch.mismatch_type] || mismatch.mismatch_type;

      // Estimate card height
      const promiseLines = pdf.splitTextToSize(`Promise: "${mismatch.promise_says}"`, contentWidth - 20);
      const contractLines = pdf.splitTextToSize(`Contract: "${mismatch.contract_says}"`, contentWidth - 20);
      const explLines = pdf.splitTextToSize(mismatch.explanation, contentWidth - 20);
      const cardHeight = 16 + (promiseLines.length + contractLines.length + explLines.length) * 3.5 + 8;

      checkNewPage(Math.min(cardHeight, 60));

      // Card background
      pdf.setFillColor(15, 15, 25);
      const actualHeight = Math.min(cardHeight, pageHeight - y - margin);
      pdf.roundedRect(margin, y, contentWidth, actualHeight, 2, 2, 'F');

      // Severity color bar
      pdf.setFillColor(...sevColor);
      pdf.rect(margin, y, 3, actualHeight, 'F');

      // Header
      const headerY = y + 6;
      pdf.setFontSize(8);
      pdf.setTextColor(...sevColor);
      pdf.text(`#${i + 1} — ${sevLabel} — ${typeLabel}`, margin + 8, headerY);

      if (mismatch.clause_number) {
        pdf.setTextColor(148, 163, 184);
        pdf.text(`Clause ${mismatch.clause_number}`, pageWidth - margin - 5, headerY, { align: 'right' });
      }

      y = headerY + 5;

      // Promise
      pdf.setFontSize(8);
      pdf.setTextColor(245, 158, 11);
      const pLines = pdf.splitTextToSize(`Promise: "${mismatch.promise_says}"`, contentWidth - 20);
      for (const line of pLines.slice(0, 3)) {
        pdf.text(line, margin + 8, y);
        y += 3.5;
      }

      y += 1;

      // Contract
      pdf.setTextColor(100, 116, 139);
      const cLines = pdf.splitTextToSize(`Contract: "${mismatch.contract_says}"`, contentWidth - 20);
      for (const line of cLines.slice(0, 3)) {
        pdf.text(line, margin + 8, y);
        y += 3.5;
      }

      y += 1;

      // Explanation
      pdf.setTextColor(180, 180, 190);
      const eLines = pdf.splitTextToSize(mismatch.explanation, contentWidth - 20);
      for (const line of eLines.slice(0, 3)) {
        checkNewPage(5);
        pdf.text(line, margin + 8, y);
        y += 3.5;
      }

      y += 6;
    }
  }

  // ── LAST PAGE: LEGAL DISCLAIMER ──
  checkNewPage(30);
  y += 5;

  pdf.setDrawColor(30, 30, 45);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Generated by ClauseWall — clausewall.com', margin, y);
  y += 5;
  pdf.setFontSize(7);
  pdf.text(
    'Disclaimer: This analysis is AI-assisted and is not legal advice. Consult a qualified lawyer for legal proceedings.',
    margin,
    y
  );
  y += 4;
  pdf.text(
    'Electronic evidence admissibility requires Section 65B certification under IT Act 2000.',
    margin,
    y
  );

  // Generate blob
  return pdf.output('blob');
}

/**
 * Generate and download the report client-side
 */
export function downloadShadowReport(
  analysis: ShadowAnalysis,
  documentType: string,
  entityName: string | null
): void {
  const blob = generateShadowReportPDF(analysis, documentType, entityName);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clausewall-shadow-report-${analysis.document_id.slice(0, 8)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
