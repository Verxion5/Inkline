/**
 * Server-side AI client for any OpenAI-compatible provider.
 * Configuration comes from the server environment only and is never exposed
 * to the browser:
 *   AI_API_KEY    (required)  provider key
 *   AI_BASE_URL   (optional)  defaults to https://api.openai.com/v1
 *   AI_TEXT_MODEL (optional, alias AI_CHAT_MODEL) defaults to gpt-4o-mini
 *   AI_VISION_MODEL (optional, defaults to the text model)
 *   AI_IMAGE_MODEL (optional, defaults to gpt-image-1)
 */
const DEFAULT_BASE_URL = "https://api.openai.com/v1";

export const NOT_CONFIGURED_MESSAGE =
  "AI is not configured — set AI_API_KEY (and optionally AI_BASE_URL, AI_TEXT_MODEL) in the app environment.";

export class AIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function aiApiKey(): string | undefined {
  return process.env["AI_API_KEY"];
}

export function aiBaseUrl(): string {
  return (process.env["AI_BASE_URL"] || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

export function chatCompletionsUrl(): string {
  return `${aiBaseUrl()}/chat/completions`;
}

export function imagesGenerationsUrl(): string {
  return `${aiBaseUrl()}/images/generations`;
}

export function chatModel(): string {
  return process.env["AI_TEXT_MODEL"] || process.env["AI_CHAT_MODEL"] || "gpt-4o-mini";
}

export function visionModel(): string {
  return process.env["AI_VISION_MODEL"] || chatModel();
}

export function hasKey(): boolean {
  return Boolean(aiApiKey());
}

/** Multimodal content part for chat completions (text or image). */
export type ContentPart =
  { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

/** Calls the provider and returns parsed JSON content. `user` may be plain text or multimodal parts. */
export async function chatJSON<T>(
  system: string,
  user: string | ContentPart[],
  model = chatModel(),
): Promise<T> {
  const key = aiApiKey();
  if (!key) throw new AIError(NOT_CONFIGURED_MESSAGE, 401);

  const res = await fetch(chatCompletionsUrl(), {
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
    // Never echo the provider's 401 body: it can repeat part of the key.
    if (res.status === 401)
      throw new AIError(`${NOT_CONFIGURED_MESSAGE} The provider rejected the key.`, 401);
    if (res.status === 402)
      throw new AIError("AI credits are exhausted. Add credits to continue.", 402);
    if (res.status === 403) throw new AIError("AI access is blocked for this workspace.", 403);
    if (res.status === 404)
      throw new AIError(
        `AI model "${model}" is unavailable at ${aiBaseUrl()}. Check AI_TEXT_MODEL.`,
        404,
      );
    if (res.status === 429) throw new AIError("Rate limited. Try again in a moment.", 429);
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
