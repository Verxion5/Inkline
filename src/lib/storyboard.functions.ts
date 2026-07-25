import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  story: z.string().min(4).max(2000),
  panelCount: z.number().int().min(3).max(6).default(4),
});

const PanelSchema = z.object({
  index: z.number(),
  shot: z.string(),
  description: z.string(),
  dialogue: z.string(),
  sfx: z.string(),
});

const Output = z.object({
  title: z.string(),
  logline: z.string(),
  panels: z.array(PanelSchema),
});

export type Storyboard = z.infer<typeof Output>;

const SYSTEM = `You are the Director agent for an AI manga/manhwa creation OS.
Given a user's short story premise, produce a cinematic storyboard.
- Invent an original style; never imitate specific artists.
- Vary shots: establishing wide, medium, close-up, dutch angle, overhead, silhouette.
- Keep dialogue tight (max 12 words per panel).
- SFX are onomatopoeia in ALL CAPS (e.g. KRRSH, DOKI, TMP).
- Descriptions read like directorial notes: character posture, lighting, environment, mood.
Return JSON matching the schema.`;

export const generateStoryboard = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<Storyboard> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Create a ${data.panelCount}-panel manga storyboard for this premise. Respond with JSON only, matching:
{ "title": string, "logline": string, "panels": [ { "index": number, "shot": string, "description": string, "dialogue": string, "sfx": string } ] }

Premise: ${data.story}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits to your workspace.");
      throw new Error(`AI gateway error (${res.status}): ${text}`);
    }

    const json = (await res.json()) as { choices: { message: { content: string } }[] };
    const content = json.choices[0]?.message?.content ?? "{}";
    const parsed = Output.parse(JSON.parse(content));
    return parsed;
  });
