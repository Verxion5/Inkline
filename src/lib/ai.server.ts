/**
 * OpenAI-compatible AI client. Everything provider-specific lives in the
 * environment so any OpenAI-compatible endpoint can back Inkline:
 *
 *   AI_API_KEY     – provider key (server-side only, never exposed to the client)
 *   AI_BASE_URL    – API root, defaults to https://api.openai.com/v1
 *   AI_TEXT_MODEL  – model for chat/JSON generation
 *   AI_VISION_MODEL – model for image review (defaults to the text model)
 *   AI_IMAGE_MODEL – model for artwork (see imageProvider.server.ts)
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

export function aiKey(): string | undefined {
  return process.env["AI_API_KEY"]?.trim() || undefined;
}

export function aiBaseUrl(): string {
  const raw = process.env["AI_BASE_URL"]?.trim() || DEFAULT_BASE_URL;
  return raw.replace(/\/+$/, "");
}

export function textModel(): string {
  return process.env["AI_TEXT_MODEL"]?.trim() || DEFAULT_TEXT_MODEL;
}

export function visionModel(): string {
  return process.env["AI_VISION_MODEL"]?.trim() || textModel();
}

export function hasKey(): boolean {
  return Boolean(aiKey());
}

/** Multimodal content part for chat completions (text or image). */
export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

function providerError(status: number, body: string): AIError {
  if (status === 401 || status === 403)
    return new AIError(
      "AI access is blocked — check that AI_API_KEY is valid and allowed to use this model.",
      status,
    );
  if (status === 429) return new AIError("Rate limited. Try again in a moment.", 429);
  if (status === 402) return new AIError("AI credits are exhausted for this provider.", 402);
  if (status === 404)
    return new AIError(
      "AI model or endpoint not found — check AI_BASE_URL and the model name.",
      404,
    );
  return new AIError(`AI provider error (${status}): ${body.slice(0, 300)}`, status);
}

/** Calls the provider and returns parsed JSON content. `user` may be plain text or multimodal parts. */
export async function chatJSON<T>(
  system: string,
  user: string | ContentPart[],
  model: string = textModel(),
): Promise<T> {
  const key = aiKey();
  if (!key)
    throw new AIError(
      "AI is not configured (missing AI_API_KEY). Add an AI provider key and, if needed, AI_BASE_URL and AI_TEXT_MODEL.",
      401,
    );

  const res = await fetch(`${aiBaseUrl()}/chat/completions`, {
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

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw providerError(res.status, text);
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
