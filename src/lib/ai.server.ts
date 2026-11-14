/**
 * Server-side AI client for any OpenAI-compatible provider.
 *
 * Configured entirely from the server environment (never the client bundle):
 *   AI_API_KEY     — required; the provider key
 *   AI_BASE_URL    — optional; defaults to https://api.openai.com/v1
 *   AI_TEXT_MODEL  — optional; default chat/completions model
 */

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_TEXT_MODEL = "gpt-4o-mini";

export class AIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function apiKey(): string | undefined {
  const key = process.env["AI_API_KEY"];
  return key && key.trim() ? key.trim() : undefined;
}

/** Provider root, without a trailing slash (e.g. https://api.openai.com/v1). */
export function apiBaseUrl(): string {
  const configured = process.env["AI_BASE_URL"]?.trim() || DEFAULT_BASE_URL;
  return configured.replace(/\/+$/, "");
}

export function textModel(): string {
  return process.env["AI_TEXT_MODEL"]?.trim() || DEFAULT_TEXT_MODEL;
}

export function hasKey(): boolean {
  return Boolean(apiKey());
}

/** Multimodal content part for chat completions (text or image). */
export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

/** Calls the provider's chat completions endpoint and returns parsed JSON content. */
export async function chatJSON<T>(
  system: string,
  user: string | ContentPart[],
  model = textModel(),
): Promise<T> {
  const key = apiKey();
  if (!key) {
    throw new AIError("AI is not configured. Set AI_API_KEY in the server environment.", 401);
  }

  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });
  } catch {
    throw new AIError(
      `Could not reach the AI provider at ${apiBaseUrl()}. Check AI_BASE_URL.`,
      502,
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401)
      throw new AIError("The AI provider rejected the API key. Check AI_API_KEY.", 401);
    if (res.status === 429) throw new AIError("Rate limited. Try again in a moment.", 429);
    if (res.status === 402)
      throw new AIError("AI credits are exhausted for this API key. Add credits to continue.", 402);
    if (res.status === 403) throw new AIError("AI access is blocked for this API key.", 403);
    throw new AIError(`AI provider error (${res.status}): ${text.slice(0, 300)}`, res.status);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(content) as T;
  } catch {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(content.slice(start, end + 1)) as T;
    throw new AIError("The model returned an unreadable response. Try again.", 502);
  }
}

export const ORIGINALITY_RULE = `Originality rules you must follow:
- Invent original characters, worlds and visual looks.
- Never reference, name, or imitate a living artist, studio signature style, or copyrighted franchise.
- If the user names an existing style or property, translate it into abstract visual attributes only (line weight, ink density, color treatment, shading, lighting, texture, background detail, rendering, motion effects, panel energy).`;
