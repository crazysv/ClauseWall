import { NextRequest, NextResponse } from "next/server";
import { log } from "@/lib/logger";

interface HealthCheck {
  status: "pass" | "fail";
  message: string;
  durationMs?: number;
}

/**
 * GET /api/health/deep
 * Deep health check — verifies connectivity to Supabase and AI service availability.
 * Gated behind INTERNAL_API_SECRET in production.
 */
export async function GET(request: NextRequest) {
  // ── Auth check (skip in dev) ──
  const secret = process.env.INTERNAL_API_SECRET;
  const provided = request.headers.get("x-internal-secret");
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev && secret && provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checks: Record<string, HealthCheck> = {};

  // ── Check 1: Supabase connectivity ──
  try {
    const start = Date.now();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      checks.database = {
        status: "fail",
        message: "Supabase URL or anon key not configured",
      };
    } else {
      // Lightweight REST call to check connectivity
      const res = await fetch(`${url}/rest/v1/`, {
        method: "HEAD",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      checks.database = {
        status: res.ok || res.status === 400 ? "pass" : "fail",
        message:
          res.ok || res.status === 400
            ? "Supabase reachable"
            : `Supabase returned ${res.status}`,
        durationMs: Date.now() - start,
      };
    }
  } catch (error) {
    checks.database = {
      status: "fail",
      message:
        error instanceof Error ? error.message : "Supabase connectivity failed",
    };
  }

  // ── Check 2: AI service availability (key check only, no API call) ──
  try {
    const groqKeys = [
      process.env.GROQ_API_KEY_1,
      process.env.GROQ_API_KEY_2,
      process.env.GROQ_API_KEY_3,
      process.env.GROQ_API_KEY,
    ].filter(Boolean);

    const geminiKeys = [
      process.env.GOOGLE_AI_API_KEY_1,
      process.env.GOOGLE_AI_API_KEY_2,
    ].filter(Boolean);

    checks.ai = {
      status: groqKeys.length > 0 ? "pass" : "fail",
      message: `Groq keys: ${groqKeys.length}, Gemini keys: ${geminiKeys.length}`,
    };
  } catch {
    checks.ai = {
      status: "fail",
      message: "AI key check failed",
    };
  }

  // ── Check 3: Critical environment variables ──
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];
  const optionalEnvVars = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "INTERNAL_API_SECRET",
  ];

  const missingRequired = requiredEnvVars.filter(
    (v) => !process.env[v],
  );
  const missingOptional = optionalEnvVars.filter(
    (v) => !process.env[v],
  );

  checks.env = {
    status: missingRequired.length === 0 ? "pass" : "fail",
    message:
      missingRequired.length === 0
        ? `All required env vars present${missingOptional.length > 0 ? `, ${missingOptional.length} optional missing` : ""}`
        : `Missing required: ${missingRequired.join(", ")}`,
  };

  // ── Aggregate status ──
  const allChecks = Object.values(checks);
  const hasCriticalFailure = checks.database?.status === "fail" || checks.env?.status === "fail";
  const hasAnyFailure = allChecks.some((c) => c.status === "fail");

  let overallStatus: "ok" | "degraded" | "unhealthy";
  if (hasCriticalFailure) {
    overallStatus = "unhealthy";
  } else if (hasAnyFailure) {
    overallStatus = "degraded";
  } else {
    overallStatus = "ok";
  }

  const statusCode = overallStatus === "unhealthy" ? 503 : 200;

  log.info("health", "Deep health check completed", {
    status: overallStatus,
    checks: Object.fromEntries(
      Object.entries(checks).map(([k, v]) => [k, v.status]),
    ),
  });

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
