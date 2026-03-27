// ============================================
// CLAUSEWALL — CONNECTIVITY LINK GENERATOR
// tel:, mailto:, maps:, e-filing URLs
// ============================================

import type { LegalAuthority, ConnectivityLinks } from "@/types/authority";

/**
 * Generate connectivity links for one-tap contact.
 */
export function generateConnectivityLinks(
  authority: LegalAuthority
): ConnectivityLinks {
  // Phone — first valid number
  const validPhone = authority.phone_numbers?.find(
    (p) => p && p !== "[VERIFY]" && p.length > 3
  );
  const tel_url = validPhone
    ? `tel:${validPhone.replace(/[^+\d]/g, "")}`
    : null;

  // Email
  const mailto_url = authority.email
    ? `mailto:${authority.email}`
    : null;

  // Website
  const website_url = authority.website || null;

  // Maps — prefer stored URL, else generate from address
  let maps_url = authority.google_maps_url || null;
  if (!maps_url && authority.physical_address) {
    const encoded = encodeURIComponent(
      `${authority.name}, ${authority.physical_address}`
    );
    maps_url = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  }

  // E-filing
  const efiling_url = authority.e_filing_portal_url || null;

  return { tel_url, mailto_url, website_url, maps_url, efiling_url };
}

/**
 * Generate a pre-filled mailto URL for complaints.
 */
export function generateComplaintMailto(
  authority: LegalAuthority,
  subject: string,
  body: string
): string | null {
  if (!authority.email) return null;
  const params = new URLSearchParams({
    subject,
    body: body.substring(0, 1500), // Keep URL reasonable
  });
  return `mailto:${authority.email}?${params.toString()}`;
}

/**
 * Generate a WhatsApp share link for authority info.
 */
export function generateWhatsAppShare(
  authorityName: string,
  phone?: string
): string {
  const text = encodeURIComponent(
    `Legal Authority: ${authorityName}\nFound via ClauseWall — India's Free Contract Analyzer`
  );
  if (phone) {
    const cleanPhone = phone.replace(/[^+\d]/g, "");
    return `https://wa.me/${cleanPhone}?text=${text}`;
  }
  return `https://wa.me/?text=${text}`;
}
