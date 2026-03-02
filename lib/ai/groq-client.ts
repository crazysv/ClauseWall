// ============================================
// GROQ API CLIENT
// Handles all communication with Groq's LLM API
// ============================================

import Groq from "groq-sdk";

// Validate API key exists
if (!process.env.GROQ_API_KEY) {
  console.warn("WARNING: GROQ_API_KEY is not set in environment variables");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Call Groq API with automatic retries and error handling
 */
export async function callGroq(
  messages: GroqMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    retries?: number;
  }
): Promise<string> {
  const { 
    temperature = 0.1, 
    maxTokens = 4096, 
    retries = 3 
  } = options || {};

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error("Empty response from Groq API");
      }

      // Validate it's parseable JSON
      try {
        JSON.parse(content);
      } catch {
        throw new Error(`Groq returned invalid JSON: ${content.substring(0, 200)}`);
      }

      return content;
    } catch (error) {
      lastError = error as Error;
      
      console.error(
        `[ClauseWall] Groq API attempt ${attempt}/${retries} failed:`,
        (error as Error).message
      );

      // Don't retry on certain errors
      if ((error as Error).message?.includes("API key")) {
        throw new Error("Invalid Groq API key. Please check your GROQ_API_KEY.");
      }

      if (attempt < retries) {
        // Exponential backoff: 2s, 4s, 8s...
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[ClauseWall] Retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Groq API failed after ${retries} attempts: ${lastError?.message}`
  );
}

/**
 * Call Groq with streaming (for real-time responses)
 */
export async function callGroqStreaming(
  messages: GroqMessage[],
  onChunk: (chunk: string) => void
): Promise<string> {
  try {
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.1,
      max_tokens: 4096,
      stream: true,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullResponse += content;
      onChunk(content);
    }

    return fullResponse;
  } catch (error) {
    console.error("[ClauseWall] Groq streaming failed:", error);
    throw new Error(`Streaming failed: ${(error as Error).message}`);
  }
}