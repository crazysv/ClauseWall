// ============================================
// MCA COMPANY DATA SCRAPER
// Fetches Indian company data from public sources
// ============================================

import type { MCACompanyData, CompanyDirector } from "@/types/evidence";

/**
 * Fetch company data by CIN from public aggregators
 */
export async function fetchCompanyData(cin: string): Promise<{
  success: boolean;
  data: MCACompanyData | null;
  source: string;
  error?: string;
}> {
  // Validate CIN format
  if (!/^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/.test(cin)) {
    return { success: false, data: null, source: "", error: "Invalid CIN format. Expected: U/L + 5 digits + 2 letters + 4 digits + 3 letters + 6 digits" };
  }

  // Try Tofler first (public API)
  try {
    const result = await fetchFromTofler(cin);
    if (result) return { success: true, data: result, source: "tofler.in" };
  } catch (e) {
    console.error("[Evidence] Tofler fetch failed:", e);
  }

  // Try Zaubacorp
  try {
    const result = await fetchFromZaubacorp(cin);
    if (result) return { success: true, data: result, source: "zaubacorp.com" };
  } catch (e) {
    console.error("[Evidence] Zaubacorp fetch failed:", e);
  }

  // Fallback: Return minimal data from CIN parsing
  const minimalData = parseCINData(cin);
  return {
    success: false,
    data: minimalData,
    source: "cin_parsing",
    error: "Could not fetch live data. Please upload a screenshot of the MCA company page for verification.",
  };
}

/**
 * Fetch from Tofler public page
 */
async function fetchFromTofler(cin: string): Promise<MCACompanyData | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`https://www.tofler.in/company/${cin}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();
    return extractCompanyFromHTML(html, cin);
  } catch {
    return null;
  }
}

/**
 * Fetch from Zaubacorp public page
 */
async function fetchFromZaubacorp(cin: string): Promise<MCACompanyData | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`https://www.zaubacorp.com/company/${cin}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();
    return extractCompanyFromHTML(html, cin);
  } catch {
    return null;
  }
}

/**
 * Extract company data from HTML page
 */
function extractCompanyFromHTML(html: string, cin: string): MCACompanyData | null {
  try {
    const getMetaContent = (name: string): string | null => {
      const re = new RegExp(`<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i");
      const match = html.match(re);
      return match ? match[1].trim() : null;
    };

    // Try to extract company name from title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "";
    const companyName = getMetaContent("og:title") || title.split("-")[0]?.trim() || "";

    if (!companyName) return null;

    return {
      cin,
      company_name: companyName,
      registration_date: null,
      category: null,
      sub_category: null,
      class_of_company: cin.startsWith("U") ? "Private" : "Public",
      authorized_capital: null,
      paid_up_capital: null,
      registered_address: null,
      registrar_of_companies: null,
      company_status: "Active",
      directors: [],
      email: null,
      website: null,
      last_agm_date: null,
      last_balance_sheet_date: null,
    };
  } catch {
    return null;
  }
}

/**
 * Parse minimal data from CIN structure
 */
function parseCINData(cin: string): MCACompanyData {
  const stateCode = cin.substring(6, 8);
  const year = cin.substring(8, 12);
  const classType = cin.startsWith("U") ? "Private" : "Public";

  const stateCodes: Record<string, string> = {
    MH: "Maharashtra", DL: "Delhi", KA: "Karnataka", TN: "Tamil Nadu",
    GJ: "Gujarat", UP: "Uttar Pradesh", WB: "West Bengal", RJ: "Rajasthan",
    HR: "Haryana", AP: "Andhra Pradesh", TS: "Telangana", KL: "Kerala",
    PB: "Punjab", MP: "Madhya Pradesh", BR: "Bihar", OR: "Odisha",
    GA: "Goa", JH: "Jharkhand", CT: "Chhattisgarh", HP: "Himachal Pradesh",
  };

  return {
    cin,
    company_name: `Company (CIN: ${cin})`,
    registration_date: `${year}-01-01`,
    category: null,
    sub_category: null,
    class_of_company: classType,
    authorized_capital: null,
    paid_up_capital: null,
    registered_address: stateCodes[stateCode] || null,
    registrar_of_companies: stateCodes[stateCode] ? `RoC-${stateCodes[stateCode]}` : null,
    company_status: "Unknown",
    directors: [],
    email: null,
    website: null,
    last_agm_date: null,
    last_balance_sheet_date: null,
  };
}

/**
 * Create company data from manual input
 */
export function createManualCompanyData(data: Partial<MCACompanyData> & { cin: string }): MCACompanyData {
  return {
    cin: data.cin,
    company_name: data.company_name || "",
    registration_date: data.registration_date || null,
    category: data.category || null,
    sub_category: data.sub_category || null,
    class_of_company: data.class_of_company || null,
    authorized_capital: data.authorized_capital || null,
    paid_up_capital: data.paid_up_capital || null,
    registered_address: data.registered_address || null,
    registrar_of_companies: data.registrar_of_companies || null,
    company_status: data.company_status || "Unknown",
    directors: data.directors || [],
    email: data.email || null,
    website: data.website || null,
    last_agm_date: data.last_agm_date || null,
    last_balance_sheet_date: data.last_balance_sheet_date || null,
  };
}
