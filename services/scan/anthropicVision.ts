import { VISION_SYSTEM_PROMPT } from "./visionPrompt";
import type { VisionResult } from "./types";

const API_URL = "https://api.openai.com/v1/chat/completions";

export async function callVisionAPI(base64Image: string, mimeType: string): Promise<VisionResult> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY_MISSING");

  const body = {
    model: "gpt-4o",
    max_tokens: 1024,
    messages: [
      {
        role: "system",
        content: VISION_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
              detail: "high",
            },
          },
          {
            type: "text",
            text: "Identify this perfume.",
          },
        ],
      },
    ],
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";

  try {
    const parsed = JSON.parse(text) as VisionResult;
    return parsed;
  } catch {
    return { candidates: [], notRecognizable: true, rawText: text };
  }
}
