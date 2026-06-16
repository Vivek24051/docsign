import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/response";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { text } = await request.json();
  if (!text?.trim()) return apiError("No text provided");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return apiError("AI not configured", 500);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a document analyst. Analyze this document and provide a concise summary in 2-3 sentences covering: what type of document it is, the main subject or parties involved, and any key terms, dates, or amounts mentioned. Be brief and professional.\n\nDocument text:\n${text.slice(0, 10000)}`,
          }],
        }],
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("[Gemini error]", JSON.stringify(data));
    return apiError(data.error?.message || "Gemini API error", 500);
  }

  const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!summary) return apiError("Failed to generate summary", 500);

  return apiSuccess({ summary });
}
