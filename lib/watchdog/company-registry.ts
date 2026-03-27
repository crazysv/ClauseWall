// ============================================
// COMPANY REGISTRY + SEED DATA
// 30+ Indian companies with ToS URLs
// ============================================

import { createAdminClient } from "@/lib/supabase/admin";
import type { MonitoredCompany, CompanySector } from "@/types";
import type { CompanySeedEntry } from "./types";

/** Seed data for initial company list */
export const COMPANY_SEED_DATA: CompanySeedEntry[] = [
  // ─── Ride-hailing ───
  { name: "Ola", slug: "ola", sector: "ride_hailing", website: "olacabs.com", logo_url: null, tos_urls: [{ label: "Terms of Service", url: "https://www.olacabs.com/terms", type: "tos" }, { label: "Privacy Policy", url: "https://www.olacabs.com/privacy", type: "privacy" }] },
  { name: "Uber India", slug: "uber-india", sector: "ride_hailing", website: "uber.com", logo_url: null, tos_urls: [{ label: "Terms", url: "https://www.uber.com/legal/en/document/?name=general-terms-of-use&country=india", type: "tos" }, { label: "Privacy", url: "https://www.uber.com/legal/en/document/?name=privacy-notice&country=india", type: "privacy" }] },
  { name: "Rapido", slug: "rapido", sector: "ride_hailing", website: "rapido.bike", logo_url: null, tos_urls: [{ label: "Terms", url: "https://www.rapido.bike/terms", type: "tos" }] },

  // ─── Food delivery ───
  { name: "Zomato", slug: "zomato", sector: "food_delivery", website: "zomato.com", logo_url: null, tos_urls: [{ label: "Terms of Use", url: "https://www.zomato.com/conditions", type: "tos" }, { label: "Privacy Policy", url: "https://www.zomato.com/privacy", type: "privacy" }] },
  { name: "Swiggy", slug: "swiggy", sector: "food_delivery", website: "swiggy.com", logo_url: null, tos_urls: [{ label: "Terms & Conditions", url: "https://www.swiggy.com/terms-and-conditions", type: "tos" }, { label: "Privacy Policy", url: "https://www.swiggy.com/privacy-policy", type: "privacy" }] },
  { name: "EatSure", slug: "eatsure", sector: "food_delivery", website: "eatsure.com", logo_url: null, tos_urls: [{ label: "Terms", url: "https://www.eatsure.com/terms", type: "tos" }] },

  // ─── E-commerce ───
  { name: "Amazon India", slug: "amazon-india", sector: "ecommerce", website: "amazon.in", logo_url: null, tos_urls: [{ label: "Conditions of Use", url: "https://www.amazon.in/gp/help/customer/display.html?nodeId=200545940", type: "tos" }, { label: "Privacy Notice", url: "https://www.amazon.in/gp/help/customer/display.html?nodeId=200534380", type: "privacy" }] },
  { name: "Flipkart", slug: "flipkart", sector: "ecommerce", website: "flipkart.com", logo_url: null, tos_urls: [{ label: "Terms of Use", url: "https://www.flipkart.com/pages/terms", type: "tos" }, { label: "Privacy Policy", url: "https://www.flipkart.com/pages/privacypolicy", type: "privacy" }] },
  { name: "Meesho", slug: "meesho", sector: "ecommerce", website: "meesho.com", logo_url: null, tos_urls: [{ label: "Terms", url: "https://www.meesho.com/terms", type: "tos" }] },
  { name: "Myntra", slug: "myntra", sector: "ecommerce", website: "myntra.com", logo_url: null, tos_urls: [{ label: "Terms of Use", url: "https://www.myntra.com/termsofuse", type: "tos" }, { label: "Privacy Policy", url: "https://www.myntra.com/privacypolicy", type: "privacy" }] },
  { name: "Nykaa", slug: "nykaa", sector: "ecommerce", website: "nykaa.com", logo_url: null, tos_urls: [{ label: "Terms", url: "https://www.nykaa.com/terms-conditions", type: "tos" }] },

  // ─── Payments ───
  { name: "PhonePe", slug: "phonepe", sector: "payments", website: "phonepe.com", logo_url: null, tos_urls: [{ label: "Terms", url: "https://www.phonepe.com/terms-conditions/", type: "tos" }, { label: "Privacy", url: "https://www.phonepe.com/privacy-policy/", type: "privacy" }] },
  { name: "Paytm", slug: "paytm", sector: "payments", website: "paytm.com", logo_url: null, tos_urls: [{ label: "Terms", url: "https://paytm.com/about-us/terms-of-use/", type: "tos" }, { label: "Privacy", url: "https://paytm.com/about-us/privacy-policy/", type: "privacy" }] },
  { name: "Google Pay India", slug: "google-pay", sector: "payments", website: "pay.google.com", logo_url: null, tos_urls: [{ label: "Terms of Service", url: "https://payments.google.com/payments/apis-secure/get_legal_document?ldo=0&ldt=googlepaytos&ldl=en-IN", type: "tos" }] },
  { name: "CRED", slug: "cred", sector: "payments", website: "cred.club", logo_url: null, tos_urls: [{ label: "Terms", url: "https://cred.club/terms", type: "tos" }, { label: "Privacy", url: "https://cred.club/privacy", type: "privacy" }] },
  { name: "Razorpay", slug: "razorpay", sector: "payments", website: "razorpay.com", logo_url: null, tos_urls: [{ label: "Terms", url: "https://razorpay.com/terms/", type: "tos" }] },

  // ─── Social / Communication ───
  { name: "WhatsApp India", slug: "whatsapp-india", sector: "social", website: "whatsapp.com", logo_url: null, tos_urls: [{ label: "Terms of Service", url: "https://www.whatsapp.com/legal/terms-of-service-eea", type: "tos" }, { label: "Privacy Policy", url: "https://www.whatsapp.com/legal/privacy-policy", type: "privacy" }] },
  { name: "Instagram India", slug: "instagram-india", sector: "social", website: "instagram.com", logo_url: null, tos_urls: [{ label: "Terms of Use", url: "https://help.instagram.com/581066165581870", type: "tos" }] },
  { name: "X India", slug: "x-india", sector: "social", website: "x.com", logo_url: null, tos_urls: [{ label: "Terms of Service", url: "https://x.com/en/tos", type: "tos" }, { label: "Privacy Policy", url: "https://x.com/en/privacy", type: "privacy" }] },

  // ─── Streaming ───
  { name: "Hotstar", slug: "hotstar", sector: "streaming", website: "hotstar.com", logo_url: null, tos_urls: [{ label: "Terms of Use", url: "https://www.hotstar.com/in/terms-of-use", type: "tos" }] },
  { name: "Netflix India", slug: "netflix-india", sector: "streaming", website: "netflix.com", logo_url: null, tos_urls: [{ label: "Terms of Use", url: "https://help.netflix.com/legal/termsofuse", type: "tos" }, { label: "Privacy Statement", url: "https://help.netflix.com/legal/privacy", type: "privacy" }] },
  { name: "Spotify India", slug: "spotify-india", sector: "streaming", website: "spotify.com", logo_url: null, tos_urls: [{ label: "Terms", url: "https://www.spotify.com/in-en/legal/end-user-agreement/", type: "tos" }] },
  { name: "JioCinema", slug: "jiocinema", sector: "streaming", website: "jiocinema.com", logo_url: null, tos_urls: [{ label: "Terms", url: "https://www.jiocinema.com/terms", type: "tos" }] },

  // ─── Travel ───
  { name: "MakeMyTrip", slug: "makemytrip", sector: "travel", website: "makemytrip.com", logo_url: null, tos_urls: [{ label: "Terms & Conditions", url: "https://www.makemytrip.com/about/terms_of_service.html", type: "tos" }, { label: "Privacy Policy", url: "https://www.makemytrip.com/about/privacy_policy.html", type: "privacy" }] },
  { name: "Goibibo", slug: "goibibo", sector: "travel", website: "goibibo.com", logo_url: null, tos_urls: [{ label: "Terms", url: "https://www.goibibo.com/info/terms-and-conditions/", type: "tos" }] },
  { name: "IRCTC", slug: "irctc", sector: "travel", website: "irctc.co.in", logo_url: null, tos_urls: [{ label: "Terms", url: "https://www.irctc.co.in/nget/termsandcondition", type: "tos" }] },
  { name: "Yatra", slug: "yatra", sector: "travel", website: "yatra.com", logo_url: null, tos_urls: [{ label: "Terms", url: "https://www.yatra.com/online/terms-and-conditions.html", type: "tos" }] },

  // ─── Banking / Finance ───
  { name: "Zerodha", slug: "zerodha", sector: "banking", website: "zerodha.com", logo_url: null, tos_urls: [{ label: "Terms", url: "https://zerodha.com/terms", type: "tos" }, { label: "Privacy Policy", url: "https://zerodha.com/privacy-policy", type: "privacy" }] },
  { name: "Groww", slug: "groww", sector: "banking", website: "groww.in", logo_url: null, tos_urls: [{ label: "Terms", url: "https://groww.in/terms-and-conditions", type: "tos" }] },
  { name: "HDFC Bank", slug: "hdfc-bank", sector: "banking", website: "hdfcbank.com", logo_url: null, tos_urls: [{ label: "Terms", url: "https://www.hdfcbank.com/personal/useful-links/terms-and-conditions", type: "tos" }] },
  { name: "SBI", slug: "sbi", sector: "banking", website: "sbi.co.in", logo_url: null, tos_urls: [{ label: "Terms", url: "https://www.onlinesbi.sbi/sbijava/termsandconditions.html", type: "tos" }] },

  // ─── Telecom ───
  { name: "Jio", slug: "jio", sector: "telecom", website: "jio.com", logo_url: null, tos_urls: [{ label: "Terms", url: "https://www.jio.com/en-in/terms-and-conditions", type: "tos" }, { label: "Privacy Policy", url: "https://www.jio.com/en-in/privacy-policy", type: "privacy" }] },
  { name: "Airtel", slug: "airtel", sector: "telecom", website: "airtel.in", logo_url: null, tos_urls: [{ label: "Terms", url: "https://www.airtel.in/terms-conditions", type: "tos" }] },
  { name: "Vi", slug: "vi", sector: "telecom", website: "myvi.in", logo_url: null, tos_urls: [{ label: "Terms", url: "https://www.myvi.in/terms-and-conditions", type: "tos" }] },

  // ─── EdTech ───
  { name: "BYJU'S", slug: "byjus", sector: "edtech", website: "byjus.com", logo_url: null, tos_urls: [{ label: "Terms", url: "https://byjus.com/terms/", type: "tos" }] },
  { name: "Unacademy", slug: "unacademy", sector: "edtech", website: "unacademy.com", logo_url: null, tos_urls: [{ label: "Terms", url: "https://unacademy.com/terms", type: "tos" }] },
  { name: "upGrad", slug: "upgrad", sector: "edtech", website: "upgrad.com", logo_url: null, tos_urls: [{ label: "Terms", url: "https://www.upgrad.com/terms-and-conditions/", type: "tos" }] },

  // ─── Government ───
  { name: "Aadhaar/UIDAI", slug: "aadhaar", sector: "government", website: "uidai.gov.in", logo_url: null, tos_urls: [{ label: "Terms", url: "https://uidai.gov.in/en/terms-conditions.html", type: "tos" }] },
  { name: "DigiLocker", slug: "digilocker", sector: "government", website: "digilocker.gov.in", logo_url: null, tos_urls: [{ label: "Terms", url: "https://www.digilocker.gov.in/terms-conditions", type: "tos" }] },
];

/**
 * Get all companies from database
 */
export async function getCompanies(filters?: {
  sector?: CompanySector;
  is_active?: boolean;
  limit?: number;
}): Promise<MonitoredCompany[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("monitored_companies")
    .select("*")
    .order("name");

  if (filters?.sector) query = query.eq("sector", filters.sector);
  if (filters?.is_active !== undefined) query = query.eq("is_active", filters.is_active);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;

  if (error) {
    console.error("[Watchdog] Failed to get companies:", error);
    return [];
  }

  return (data as MonitoredCompany[]) || [];
}

/**
 * Get a single company by slug
 */
export async function getCompanyBySlug(slug: string): Promise<MonitoredCompany | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("monitored_companies")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("[Watchdog] Failed to get company:", error);
    return null;
  }

  return data as MonitoredCompany;
}

/**
 * Seed companies into the database
 */
export async function seedCompanies(): Promise<{ inserted: number; skipped: number }> {
  const supabase = createAdminClient();
  let inserted = 0;
  let skipped = 0;

  for (const company of COMPANY_SEED_DATA) {
    // Check if already exists
    const { data: existing } = await supabase
      .from("monitored_companies")
      .select("id")
      .eq("slug", company.slug)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from("monitored_companies").insert({
      name: company.name,
      slug: company.slug,
      sector: company.sector,
      website: company.website,
      logo_url: company.logo_url,
      tos_urls: company.tos_urls,
      scrape_config: company.scrape_config || null,
      scrape_frequency: company.scrape_frequency || "weekly",
    });

    if (error) {
      console.error(`[Watchdog] Failed to seed ${company.name}:`, error);
    } else {
      inserted++;
    }
  }

  console.log(`[Watchdog] Seeded ${inserted} companies, ${skipped} already existed`);
  return { inserted, skipped };
}

/** Sector display names */
export const SECTOR_LABELS: Record<CompanySector, string> = {
  ride_hailing: "Ride-hailing",
  food_delivery: "Food Delivery",
  ecommerce: "E-commerce",
  payments: "Payments",
  social: "Social",
  streaming: "Streaming",
  travel: "Travel",
  banking: "Banking & Finance",
  telecom: "Telecom",
  edtech: "EdTech",
  government: "Government",
  other: "Other",
};

/** Sector icon emojis */
export const SECTOR_ICONS: Record<CompanySector, string> = {
  ride_hailing: "🚗",
  food_delivery: "🍔",
  ecommerce: "🛒",
  payments: "💳",
  social: "💬",
  streaming: "🎬",
  travel: "✈️",
  banking: "🏦",
  telecom: "📱",
  edtech: "📚",
  government: "🏛️",
  other: "📋",
};
