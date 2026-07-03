// Generates AI board commentary from the *computed* metrics (never from raw
// PDFs at request time — extraction is a separate, offline pipeline; see
// scripts/extract_financials.py). Falls back to a cached, pre-validated
// insight set if ANTHROPIC_API_KEY is unset, so the demo never breaks.

import Anthropic from "@anthropic-ai/sdk";
import fallbackInsights from "../../data/fallback_insights.json";

const SYSTEM_PROMPT = `You are a financial analyst preparing board commentary for Senus PLC, a
pre-profitability Natural Capital software company listed on Euronext Access+ Dublin.
Audience: Management, the Board, Equity Investors and Credit Providers.

Rules:
- Only reference figures present in the JSON you're given. Never invent numbers.
- If a metric you'd normally comment on (EBITDA, DSCR, ROCE) is flagged as unavailable,
  say so explicitly rather than approximating it.
- Write in a neutral, board-report register: direct, specific, no hype.
- Return strict JSON: an array of {theme, title, body} objects, 4-6 items.`;

export type Insight = { theme: string; title: string; body: string };

export async function generateInsights(metricsPayload: unknown): Promise<{
  insights: Insight[];
  source: "live" | "cached-fallback";
}> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { insights: fallbackInsights as Insight[], source: "cached-fallback" };
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: JSON.stringify(metricsPayload) }],
    });

    const text = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("\n")
      .replace(/```json|```/g, "")
      .trim();

    const insights = JSON.parse(text) as Insight[];
    return { insights, source: "live" };
  } catch (err) {
    console.error("AI insight generation failed, serving cached fallback:", err);
    return { insights: fallbackInsights as Insight[], source: "cached-fallback" };
  }
}
