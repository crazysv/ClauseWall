import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // ── Internal-only route ──
  const secret = process.env.INTERNAL_API_SECRET;
  const provided = request.headers.get("x-internal-secret");
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev) {
    if (!secret) {
      return NextResponse.json(
        { error: "Route not available — server misconfiguration" },
        { status: 503 },
      );
    }
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY_1;

  if (!apiKey) {
    return NextResponse.json({ error: "No API key" });
  }

  // Small test image (1x1 red pixel PNG in base64)
  const testImageBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: "What color is this image? Reply in one word." },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: testImageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 100,
        },
      }),
    });

    const status = response.status;
    const data = await response.json();

    return NextResponse.json({
      status,
      success: response.ok,
      response: data,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
    });
  }
}
