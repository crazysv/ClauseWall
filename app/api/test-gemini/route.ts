import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GOOGLE_AI_API_KEY_1;

  if (!apiKey) {
    return NextResponse.json({ error: "No API key" });
  }

  // Small test image (1x1 red pixel PNG in base64)
  const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

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