// ============================================
// SECTION 65B CERTIFICATE GENERATOR
// Indian Evidence Act, 1872, Section 65B(4)
// ============================================

import type { Section65BData, EvidenceItem, EvidenceCase } from "@/types/evidence";
import { EVIDENCE_TYPE_META } from "@/types/evidence";

/**
 * Generate Section 65B certificate data for an evidence item
 */
export function generateSection65BData(
  item: EvidenceItem,
  evidenceCase: EvidenceCase,
  userInfo: {
    name: string;
    designation: string;
    address: string;
    place: string;
  }
): Section65BData {
  const typeMeta = EVIDENCE_TYPE_META[item.evidence_type];
  const now = new Date();

  // Build description based on evidence type
  const description = buildDescription(item, typeMeta.label);
  const productionManner = buildProductionManner(item);
  const deviceDescription = buildDeviceDescription(item);
  const informationSource = buildInformationSource(item, evidenceCase);

  return {
    electronic_record_description: description,
    production_manner: productionManner,
    device_description: deviceDescription,
    device_was_operating_properly: true,
    information_derived_from: informationSource,
    accuracy_statement:
      "The information contained in the electronic record was produced by the computer/device " +
      "during the period in which it was used regularly to store or process information. " +
      "The computer/device was operating properly, and if not, the malfunction did not affect " +
      "the electronic record or its accuracy.",
    person_in_charge_name: userInfo.name,
    person_in_charge_designation: userInfo.designation,
    person_in_charge_address: userInfo.address,
    date_of_certificate: now.toISOString().split("T")[0],
    place_of_certificate: userInfo.place,
    content_hash: item.content_hash,
    hash_algorithm: item.hash_algorithm || "SHA-256",
    timestamp_proof: item.timestamp_proof
      ? `TSA: ${item.timestamp_proof.authority || "Local"} at ${item.timestamp_proof.timestamp || item.captured_at}`
      : null,
    original_format: item.mime_type || "Electronic Document",
    storage_medium: "Cloud Storage (Supabase) with client-side hash verification",
  };
}

function buildDescription(item: EvidenceItem, typeLabel: string): string {
  const parts = [
    `${typeLabel}: "${item.title}"`,
  ];

  if (item.original_filename) {
    parts.push(`Original file: ${item.original_filename}`);
  }
  if (item.file_size_bytes > 0) {
    parts.push(`File size: ${formatBytes(item.file_size_bytes)}`);
  }
  if (item.captured_at) {
    parts.push(`Captured on: ${new Date(item.captured_at).toLocaleString("en-IN")}`);
  }

  return parts.join(". ");
}

function buildProductionManner(item: EvidenceItem): string {
  switch (item.evidence_type) {
    case "email":
      return "Electronic mail transmitted via email servers and received on the deponent's email client/device.";
    case "whatsapp_chat":
    case "whatsapp_message":
      return "Messages exchanged via WhatsApp messaging application, exported using the application's built-in export feature.";
    case "audio_recording":
      return "Audio recording captured using a digital recording device/smartphone in the ordinary course of events.";
    case "payment_receipt":
      return "Payment receipt/screenshot captured from banking application or payment gateway confirming a financial transaction.";
    case "photo":
    case "screenshot":
      return "Digital photograph/screenshot captured using a smartphone or computer in the ordinary course of events.";
    case "website_archive":
    case "tos_archive":
      return "Web page archived by capturing its HTML content and/or screenshot from the internet using a web browser.";
    case "company_data":
      return "Company information retrieved from public government records (Ministry of Corporate Affairs database).";
    case "contract":
    case "document":
      return "Electronic document stored on a computer/cloud storage in the ordinary course of business or personal activities.";
    default:
      return "Electronic record produced by a computer/device during the period in which it was used regularly to store or process information.";
  }
}

function buildDeviceDescription(item: EvidenceItem): string {
  switch (item.source) {
    case "whatsapp_export":
      return "Smartphone with WhatsApp application installed, used regularly for personal/business communication.";
    case "eml_import":
      return "Computer/device with email client, used regularly for sending and receiving electronic mail.";
    case "url_archive":
      return "Computer with web browser, used to access and archive web pages from the internet.";
    case "mca_fetch":
      return "Computer with web browser accessing the Ministry of Corporate Affairs (MCA) public database.";
    case "ocr_capture":
      return "Smartphone/camera used to capture photograph of physical document, processed via Optical Character Recognition (OCR).";
    default:
      return "Digital device (computer/smartphone) used regularly by the deponent for personal and/or business activities.";
  }
}

function buildInformationSource(item: EvidenceItem, evidenceCase: EvidenceCase): string {
  return `Evidence collected in connection with dispute: "${evidenceCase.title}" against ${evidenceCase.counterparty_name}. ` +
    `The information was supplied to the computer/device in the ordinary course of activities by the deponent.`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
