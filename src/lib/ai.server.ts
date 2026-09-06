const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export class AIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function hasKey(): boolean {
  return Boolean(process.env["LOVABLE_API_KEY"]);
}

/** Multimodal content part for chat completions (text or image). */
export type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

/** Calls the gateway and returns parsed JSON content. `user` may be plain text or multimodal parts. */
export async function chatJSON<T>(
  system: string,
  user: string | ContentPart[],
  model = "google/gemini-3.7-flash",
): Promise<T> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new AIError("AI is not configured for this workspace (missing API key).", 401);

  const res = await fetch(GATEWAY, {
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
    if (res.status === 429) throw new AIError("Rate limited. Try again in a moment.", 429);
    if (res.status === 402)
      throw new AIError("AI credits are exhausted for this workspace. Add credits to continue.", 402);
    if (res.status === 403) throw new AIError("AI access is blocked for this workspace.", 403);
    throw new AIError(`AI gateway error (${res.status}): ${text.slice(0, 300)}`, res.status);
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
