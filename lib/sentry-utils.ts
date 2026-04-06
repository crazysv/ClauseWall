import * as Sentry from "@sentry/nextjs";

/**
 * PII Filter lists for Sentry data scrubbing
 */
const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "api_key",
  "apikey",
  "auth",
  "cookie",
  "jwt",
  // Document context constraints
  "rawtext",
  "raw_text",
  "content",
  "contract",
  "text",
  "pdf",
  "base64",
  // Standard PII
  "email",
  "phone",
  "ssn",
  "adhaar",
  "pan",
  "address",
];

function maskSensitiveData(obj: any, parentKey?: string): any {
  if (obj == null) return obj;

  // Handle arrays explicitly
  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitiveData(item, parentKey));
  }

  // Handle objects and scrub keys dynamically
  if (typeof obj === "object") {
    const copy = { ...obj };
    for (const key in copy) {
      if (!Object.prototype.hasOwnProperty.call(copy, key)) continue;

      const lowerKey = key.toLowerCase();
      
      // If it's a sensitive key and it holds string-type values
      if (SENSITIVE_KEYS.some((k) => lowerKey.includes(k))) {
        if (typeof copy[key] === "string" && copy[key].length > 0) {
          copy[key] = "[Filtered for Privacy]";
        }
      } else {
        copy[key] = maskSensitiveData(copy[key], key);
      }
    }
    return copy;
  }

  return obj;
}

/**
 * beforeSend Sentry Hook
 * Ensures no text payloads, emails, or raw tokens accidentally reach monitoring dashboards.
 */
export const sentryBeforeSend = (event: any) => {
  // Scrub breadcrumbs
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((crumb: any) => {
      if (crumb.data) {
        crumb.data = maskSensitiveData(crumb.data);
      }
      return crumb;
    });
  }

  // Scrub main request context (headers, cookies, data payload)
  if (event.request) {
    if (event.request.data) {
      // Data might be stringified JSON
      try {
        if (typeof event.request.data === "string") {
            const parsed = JSON.parse(event.request.data);
            event.request.data = JSON.stringify(maskSensitiveData(parsed));
        } else {
            event.request.data = maskSensitiveData(event.request.data);
        }
      } catch (e) {
          // If it fails to parse JSON on a request marked sensitive but sent as string,
          // it might be raw text form data. Be aggressive and redact.
          if ((event.request.data as string).length > 200) {
            event.request.data = "[Filtered Potential Large Payload]";
          }
      }
    }
    if (event.request.headers) {
      event.request.headers = maskSensitiveData(event.request.headers);
    }
    if (event.request.cookies) {
      event.request.cookies = maskSensitiveData(event.request.cookies);
    }
  }

  // Scrub any extra context/tags sent by the logger
  if (event.extra) {
    event.extra = maskSensitiveData(event.extra);
  }

  return event;
};
