import { apiSuccess, apiError } from "@/lib/response";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return apiError("No API key", 500);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
  );
  const data = await res.json();
  const names = (data.models || []).map((m: { name: string }) => m.name);
  return apiSuccess({ models: names });
}
