// ============================================
// EVIDENCE BUNDLE GENERATOR
// Generates court-ready PDF bundles using jsPDF
// ============================================

import jsPDF from "jspdf";
import type { EvidenceCase, EvidenceItem, EvidenceCertificate, BundleConfig } from "@/types/evidence";
import { EVIDENCE_TYPE_META } from "@/types/evidence";
import { buildMerkleTree } from "../chain";

/**
 * Generate a complete evidence bundle PDF
 */
export async function generateEvidenceBundle(
  evidenceCase: EvidenceCase,
  items: EvidenceItem[],
  certificates: EvidenceCertificate[],
  config: BundleConfig
): Promise<{ pdf: Buffer; totalPages: number; bundleHash: string }> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;
  let totalPages = 1;

  // Sort items based on config
  const sortedItems = sortItems(items, config);

  // Merkle tree
  const hashes = sortedItems.map((i) => i.content_hash);
  const merkle = buildMerkleTree(hashes);

  // ── Background ──
  const drawBg = () => {
    pdf.setFillColor(10, 10, 15);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");
  };
  drawBg();

  const origAddPage = pdf.addPage.bind(pdf);
  pdf.addPage = (...args: Parameters<typeof pdf.addPage>) => {
    const result = origAddPage(...args);
    drawBg();
    totalPages++;
    return result;
  };

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  // ── A. COVER PAGE ──
  y = 50;
  pdf.setFontSize(24);
  pdf.setTextColor(255, 255, 255);
  pdf.text("EVIDENCE BUNDLE", pageWidth / 2, y, { align: "center" });
  y += 12;

  pdf.setFontSize(10);
  pdf.setTextColor(148, 163, 184);
  pdf.text("Prepared using ClauseWall Evidence Chain Builder", pageWidth / 2, y, { align: "center" });
  y += 20;

  // Case info box
  pdf.setFillColor(15, 15, 25);
  pdf.roundedRect(margin, y, contentWidth, 60, 3, 3, "F");

  pdf.setFontSize(14);
  pdf.setTextColor(96, 165, 250);
  pdf.text(evidenceCase.title, margin + 8, y + 12);

  pdf.setFontSize(10);
  pdf.setTextColor(200, 200, 210);
  pdf.text(`Complainant vs. ${evidenceCase.counterparty_name}`, margin + 8, y + 22);

  pdf.setFontSize(9);
  pdf.setTextColor(148, 163, 184);
  pdf.text(`Dispute Type: ${evidenceCase.dispute_type || "General"}`, margin + 8, y + 32);
  pdf.text(`Date of Compilation: ${new Date().toLocaleDateString("en-IN")}`, margin + 8, y + 39);
  pdf.text(`Total Evidence Items: ${sortedItems.length}`, margin + 8, y + 46);
  pdf.text(`Merkle Root: ${merkle.root.substring(0, 32)}...`, margin + 8, y + 53);

  y += 70;

  // ── B. INDEX / TABLE OF CONTENTS ──
  if (config.include_index !== false) {
    pdf.addPage();
    y = margin;

    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text("INDEX OF EVIDENCE", margin, y + 8);
    y += 16;

    // Table header
    pdf.setFillColor(20, 20, 35);
    pdf.rect(margin, y, contentWidth, 8, "F");
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text("Sr.", margin + 2, y + 5.5);
    pdf.text("Exhibit", margin + 12, y + 5.5);
    pdf.text("Description", margin + 32, y + 5.5);
    pdf.text("Type", margin + 110, y + 5.5);
    pdf.text("Date", margin + 140, y + 5.5);
    y += 10;

    sortedItems.forEach((item, i) => {
      checkPage(8);
      const bg = i % 2 === 0 ? [15, 15, 22] : [12, 12, 18];
      pdf.setFillColor(bg[0], bg[1], bg[2]);
      pdf.rect(margin, y, contentWidth, 7, "F");

      pdf.setFontSize(7);
      pdf.setTextColor(200, 200, 210);
      pdf.text(`${i + 1}`, margin + 2, y + 5);
      pdf.text(`A-${i + 1}`, margin + 12, y + 5);
      pdf.text(item.title.substring(0, 50), margin + 32, y + 5);

      const meta = EVIDENCE_TYPE_META[item.evidence_type];
      pdf.text(meta?.label || item.evidence_type, margin + 110, y + 5);
      pdf.text(new Date(item.captured_at).toLocaleDateString("en-IN"), margin + 140, y + 5);

      y += 7;
    });
  }

  // ── C. EVIDENCE ITEMS ──
  for (let i = 0; i < sortedItems.length; i++) {
    const item = sortedItems[i];
    const meta = EVIDENCE_TYPE_META[item.evidence_type];

    pdf.addPage();
    y = margin;

    // Exhibit header
    pdf.setFillColor(15, 15, 25);
    pdf.roundedRect(margin, y, contentWidth, 35, 3, 3, "F");

    // Blue accent bar
    pdf.setFillColor(96, 165, 250);
    pdf.rect(margin, y, 3, 35, "F");

    pdf.setFontSize(14);
    pdf.setTextColor(96, 165, 250);
    pdf.text(`EXHIBIT A-${i + 1}`, margin + 8, y + 10);

    pdf.setFontSize(11);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`${meta?.emoji || ""} ${item.title}`, margin + 8, y + 19);

    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Type: ${meta?.label || item.evidence_type} | Captured: ${new Date(item.captured_at).toLocaleString("en-IN")}`, margin + 8, y + 27);
    pdf.text(`Hash: ${item.content_hash.substring(0, 32)}... | Chain Position: #${item.sequence_number}`, margin + 8, y + 33);

    y += 42;

    // Description
    if (item.description) {
      checkPage(15);
      pdf.setFontSize(9);
      pdf.setTextColor(200, 200, 210);
      const descLines = pdf.splitTextToSize(item.description, contentWidth - 10);
      for (const line of descLines.slice(0, 6)) {
        checkPage(5);
        pdf.text(line, margin + 5, y);
        y += 4.5;
      }
      y += 5;
    }

    // Extracted data summary
    if (item.extracted_data && typeof item.extracted_data === "object") {
      checkPage(10);
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text("Extracted Data:", margin + 5, y);
      y += 6;

      pdf.setFontSize(8);
      pdf.setTextColor(180, 180, 190);
      const dataStr = JSON.stringify(item.extracted_data, null, 2).substring(0, 500);
      const dataLines = pdf.splitTextToSize(dataStr, contentWidth - 10);
      for (const line of dataLines.slice(0, 15)) {
        checkPage(4);
        pdf.text(line, margin + 5, y);
        y += 4;
      }
    }

    // Notes
    if (item.notes) {
      y += 5;
      checkPage(10);
      pdf.setFontSize(8);
      pdf.setTextColor(234, 179, 8);
      pdf.text(`Note: ${item.notes}`, margin + 5, y);
      y += 6;
    }
  }

  // ── D. Section 65B Certificates ──
  if (config.include_certificates !== false && certificates.length > 0) {
    for (const cert of certificates) {
      pdf.addPage();
      y = margin;

      pdf.setFontSize(14);
      pdf.setTextColor(255, 255, 255);
      pdf.text("CERTIFICATE UNDER SECTION 65B(4)", pageWidth / 2, y + 8, { align: "center" });
      y += 12;
      pdf.setFontSize(10);
      pdf.setTextColor(148, 163, 184);
      pdf.text("OF THE INDIAN EVIDENCE ACT, 1872", pageWidth / 2, y + 4, { align: "center" });
      y += 15;

      const cd = cert.certificate_data;
      const lines = [
        `I, ${cd.person_in_charge_name}, ${cd.person_in_charge_designation},`,
        `residing at ${cd.person_in_charge_address}, do hereby certify as follows:`,
        "",
        "1. The electronic record described below was produced by a computer/device",
        "   during the period in which it was used regularly to store or process information:",
        "",
        `   Description: ${cd.electronic_record_description}`,
        `   Original Format: ${cd.original_format}`,
        "",
        "2. The information contained in the electronic record was supplied to the computer",
        `   in the ordinary course of the activities of: ${cd.information_derived_from}`,
        "",
        `3. ${cd.accuracy_statement}`,
        "",
        `   Device: ${cd.device_description}`,
        "",
        "INTEGRITY VERIFICATION:",
        `   ${cd.hash_algorithm} Hash: ${cd.content_hash}`,
        `   Timestamp: ${cd.timestamp_proof || "Local timestamp"}`,
        `   Storage: ${cd.storage_medium}`,
        "",
        `Date: ${cd.date_of_certificate}`,
        `Place: ${cd.place_of_certificate}`,
        "",
        "Signature: ____________________",
        `Name: ${cd.person_in_charge_name}`,
        `${cd.person_in_charge_designation}`,
      ];

      pdf.setFontSize(9);
      pdf.setTextColor(200, 200, 210);
      for (const line of lines) {
        checkPage(5);
        pdf.text(line, margin + 5, y);
        y += 5;
      }
    }
  }

  // ── E. Chain of Custody Report ──
  if (config.include_chain_report !== false) {
    pdf.addPage();
    y = margin;

    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text("CHAIN OF CUSTODY REPORT", margin, y + 8);
    y += 18;

    pdf.setFontSize(9);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Merkle Root Hash: ${merkle.root}`, margin, y);
    y += 6;
    pdf.text(`Total Items: ${sortedItems.length}`, margin, y);
    y += 6;
    pdf.text(`Hash Algorithm: SHA-256`, margin, y);
    y += 10;

    // Chain listing
    for (let i = 0; i < sortedItems.length; i++) {
      checkPage(12);
      const item = sortedItems[i];
      pdf.setFontSize(8);
      pdf.setTextColor(96, 165, 250);
      pdf.text(`#${item.sequence_number} — ${item.title}`, margin + 5, y);
      y += 4;
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Content: ${item.content_hash.substring(0, 40)}...`, margin + 10, y);
      y += 4;
      pdf.text(`Chain:   ${item.chain_hash.substring(0, 40)}...`, margin + 10, y);
      y += 6;
    }

    y += 5;
    checkPage(10);
    pdf.setFontSize(9);
    pdf.setTextColor(34, 197, 94);
    pdf.text("✓ All evidence items are linked in a cryptographic hash chain.", margin, y);
    y += 5;
    pdf.text("✓ Any tampering of individual items will break the chain integrity.", margin, y);
  }

  // Generate buffer
  const { createHash } = await import("crypto");
  const pdfOutput = pdf.output("arraybuffer");
  const pdfBuffer = Buffer.from(pdfOutput);
  const bundleHash = createHash("sha256").update(pdfBuffer).digest("hex");

  return { pdf: pdfBuffer, totalPages, bundleHash };
}

/**
 * Sort items based on bundle config
 */
function sortItems(items: EvidenceItem[], config: BundleConfig): EvidenceItem[] {
  const filtered = config.selected_item_ids?.length
    ? items.filter((i) => config.selected_item_ids!.includes(i.id))
    : items;

  switch (config.issue_categories?.length ? "issue" : "chronological") {
    case "issue":
      return [...filtered].sort((a, b) => {
        const catA = a.issue_category || "zzz";
        const catB = b.issue_category || "zzz";
        return catA.localeCompare(catB) || new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime();
      });
    default:
      return [...filtered].sort((a, b) =>
        new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
      );
  }
}
