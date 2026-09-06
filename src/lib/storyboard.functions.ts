import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AIError, chatJSON, ORIGINALITY_RULE } from "./ai.server";

const Input = z.object({
  story: z.string().min(4).max(2000),
  panelCount: z.number().int().min(3).max(6).default(4),
  format: z.enum(["manga", "webtoon"]).default("manga"),
});

const CastSchema = z.object({
  name: z.string(),
  age: z.string().default(""),
  /** canonical identity: build, face shape, skin, distinguishing marks */
  identity: z.string().default(""),
  hair: z.string().default(""),
  eyes: z.string().default(""),
  outfit: z.string().default(""),
  props: z.array(z.string()).default([]),
  silhouette: z.string().default(""),
});

const LocationSchema = z.object({
  name: z.string().default(""),
  description: z.string().default(""),
  architecture: z.string().default(""),
  lighting: z.string().default(""),
  weather: z.string().default(""),
  keyObjects: z.array(z.string()).default([]),
});

const PanelSchema = z.object({
  index: z.number(),
  shot: z.string(),
  cameraPosition: z.string().default("eye level"),
  lens: z.string().default("natural lens"),
  focalSubject: z.string().default(""),
  depth: z.string().default(""),
  bubbleSpace: z.string().default("upper area of the frame"),
  actionDirection: z.string().default("left to right"),
  action: z.string(),
  emotion: z.string().default(""),
  expression: z.string().default(""),
  pose: z.string().default(""),
  characters: z.array(z.string()).default([]),
  dialogue: z.string().default(""),
  sfx: z.string().default(""),
});

const Output = z.object({
  title: z.string(),
  logline: z.string(),
  tone: z.string().default(""),
  continuity: z.string().default(""),
  cast: z.array(CastSchema).default([]),
  location: LocationSchema.default({}),
  panels: z.array(PanelSchema),
});

export type Storyboard = z.infer<typeof Output>;
export type StoryboardPanelData = z.infer<typeof PanelSchema>;
export type StoryboardCast = z.infer<typeof CastSchema>;

const SYSTEM = `You are the Director agent for Inkline, a professional manga/manhwa creation studio.
From a short premise you produce a shot-by-shot storyboard that an artist can draw without asking questions.

Duties:
1. CAST — define 1-3 original characters with a CANONICAL identity that must stay identical in every panel: age, build, face shape, skin tone, distinguishing marks, exact hair (color, length, cut), exact eye color, one outfit (garments, colors, materials), signature props, and a one-line silhouette read.
2. LOCATION — one canonical setting: description, architecture, lighting source and quality, weather, 3-5 key objects that can recur across panels.
3. PANELS — for each panel specify: shot type; camera position (height and angle); lens/perspective feel (wide, natural, telephoto, worm's-eye, etc.); the single focal subject; depth layers (what is in foreground / midground / background); where negative space is reserved for speech balloons; action direction across the frame; the action itself as a concrete directorial note (posture, gesture, what hands are doing); the emotional beat; the facial expression; the pose; and which cast members are in frame (exact names from cast, zero or more).
4. Vary shot scale and angle across the board — no two consecutive panels with the same shot. Open with an establishing or contextual shot. Escalate toward the climax.
5. Dialogue: max 12 words per panel, natural voice. SFX: ALL-CAPS onomatopoeia or empty string.
6. Manga format: think in page rhythm, strong silhouettes, high contrast. Webtoon format: think vertically — tall compositions, cinematic lighting, room above/below the subject.
${ORIGINALITY_RULE}
Return JSON only.`;

export const generateStoryboard = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<Storyboard> => {
    try {
      const raw = await chatJSON<unknown>(
        SYSTEM,
        `Create a ${data.panelCount}-panel ${data.format === "manga" ? "manga" : "webtoon/manhwa"} storyboard for this premise.

Premise: ${data.story}

Respond with JSON matching exactly:
{"title":string,"logline":string,"tone":string,"continuity":string,
"cast":[{"name":string,"age":string,"identity":string,"hair":string,"eyes":string,"outfit":string,"props":string[],"silhouette":string}],
"location":{"name":string,"description":string,"architecture":string,"lighting":string,"weather":string,"keyObjects":string[]},
"panels":[{"index":number,"shot":string,"cameraPosition":string,"lens":string,"focalSubject":string,"depth":string,"bubbleSpace":string,"actionDirection":string,"action":string,"emotion":string,"expression":string,"pose":string,"characters":string[],"dialogue":string,"sfx":string}]}
"continuity" is one sentence of facts that must hold across all panels (time of day, weather, injuries, held objects).`,
        "google/gemini-3.7-flash",
      );
      return Output.parse(raw);
    } catch (e) {
      if (e instanceof AIError) throw new Error(e.message);
      if (e instanceof z.ZodError) throw new Error("The Director returned an unexpected shape. Try again.");
      throw new Error(e instanceof Error ? e.message : "Something went wrong.");
    }
  });
